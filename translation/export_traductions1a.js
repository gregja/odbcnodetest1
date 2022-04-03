/*
 * script export_traductions1a.js
 * génère le fichier Trad_finales.json qui, comme son nom l'indique,
 * contient les traductions finalisées
 * ce fichier est un tableau contenant des objets formatés comme suit :
  {"src":"AFFBARFM","pgm":"RAFFBAR","type":"DSPF","id":1,"fmt":"FOR01",
   "lig":2,"pos":12,"dtaori":"Affichage du dernier barème",
   "dtades":"Weergave van de laatste schaal ","lng":57,"cad":"c","warn":"OVERFLOW"}
 */
const FS = require("fs");
const alasql = require('alasql');

const config1 = require('./library/env1');
const path = config1.exportPath;

const conversions = require('../library/conversions_nl.js');

const {clean_before_trans} = require('../library/tradTools.js');
const {capitalize, isUpper, isCapitalized, centrage, formatage} = require('../library/tools.js');

const origfile = require(path+'Trad_rebuts.json');

const datas_origine = require('./exports/DDS_application_plus.json');
const datas_traduites = require('./exports/Trad_reverso3.json')

const fichier_final = "Trad_finales.json";

let jsonData = [];
let querysearch = 'select traduction from ? where origine = ? ';



for (let i=0, imax=datas_origine.length; i<imax; i++) {
  let item1 = datas_origine[i];

  item1.datas.forEach((item2, i) => {
      // "datas":[{"id":1,"fmt":"FOR01","lig":2,"pos":12,
      //           "str":"Affichage du dernier barème","lng":57,"cad":"c",
      // plus":{"before":"","textori":"Affichage du dernier barème","center":"Affichage du dernier barème","after":""}

      let dataori = item2.plus.textori;
      let lng_dataori = dataori.length;
      let datadest = '';

      let datas = {
        src: item1.src,
        pgm: item1.pgm,
        type: item1.type,
        id: item2.id,
        fmt: item2.fmt,
        lig: item2.lig,
        pos: item2.pos,
        dtaori: dataori,
        dtades: '',
        lng: item2.lng,
        cad: item2.cad,
        warn: ''
      }
      let before = String(item2.plus.before).trim();
      let after = String(item2.plus.after).trim();
      let center = String(item2.plus.center).trim();

      let clean_constante = clean_before_trans(conversions, center)

      let search_trad = alasql(querysearch, [datas_traduites, clean_constante]);

      if (search_trad.length > 0) {
        let liste_trads = search_trad[0].traduction;
        let tmptrad = liste_trads[0]; // on sélectionne la 1ère trad par défaut
        // si la longueur de la 1ère trad excède celle de la constante d'origine..
        //  et si le nombre de trads est supérieur à 1, alors on regarde si on a
        //  des traductions plus compatibles au niveau longueur
        if (tmptrad.length > lng_dataori && liste_trads.length > 1) {  // et on regarde s'il y en a d'autres
            for (let x=1, xmax=liste_trads.length; x<xmax ; x++) {
              if (liste_trads[x].length <= lng_dataori) {
                tmptrad = liste_trads[x];
                x = xmax+999; // on a trouvé le bon candidat, on arrête tout !! :)
                break;
              }
            }
        }

        if (isUpper(dataori)) {
          // on considère que c'est tout le libellé qui doit être en majuscules
          tmptrad = String(tmptrad).toUpperCase();
        } else {
          if (isCapitalized(dataori)) {
            tmptrad = capitalize(tmptrad);
          }
        }

        let firstpart = String(before + tmptrad).trim();
        datadest = formatage(item2.cad, item2.lng, after, firstpart);

      }

      if (datadest == '') {
        datas['warn'] = 'NO_TRANSLATION';
        datadest = dataori;
      } else {
        // quelques nettoyages de dernière minute
        datadest = datadest.split('N°').join('Nr');
        datadest = datadest.split('n°').join('nr');
        datadest = datadest.split('°').join(' ');

        if (datadest.length > item2.lng) {
          // alors on est en dépassement d'office
          datas['warn'] = 'OVERFLOW';
        } else {
          if (item2.cad == 'c') {
            // gérer le cas du centrage
            if (datadest.length < item2.lng) {
              datadest = centrage(datadest, item2.lng);
            }
          }
        }
      }

      datas['dtades'] = datadest;

      jsonData.push(datas);
  });

}

console.log('enregistrement du fichier : '+fichier_final);
FS.writeFileSync( path+fichier_final, JSON.stringify(jsonData) );
