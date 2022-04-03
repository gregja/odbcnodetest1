/*
 * script create_table_v4.js
 * Génération d'un script SQL générant les indexs de type "surrogate"

  Recréation des indexs à partir d'un fichier DB2 généré de la manière suivante :
  --- fichier de travail généré avec la commande suivante :
      DSPFD FILE(GCFIC/*ALL) TYPE(*ACCPTH) OUTPUT(*OUTFILE) FILEATR(*LF) OUTFILE(xxxxx/DDSINDEX)

  SELECT aplib, apfile, apuniq, apbof, apbol, apbolf, apnkyf, apkeyf,
         apkeyn, apkseq, apnsc2, apjoin
  FROM xxxxx.DDSINDEX
  WHERE apnsc2 = 1 AND substr(apfile, 1, 3) <> 'SYS' ;

*/
const odbc = require('odbc');
const alasql = require('alasql');
const FS = require('fs');
const config1 = require('../library/env0');
const {getDSN, genOverlayDBFile, dropOverlayDBFile, formatsDDS, genAddPFM,
  getAllMembersFromFile} = require('../library/IBMiTools');

const {formatOn2Digits} = require('../library/tools.js');

const list_fichiers = require('./datas/dspfd_gcfic.json');

/*
* mode génération : 1=fichier textes seulement ; 2=membres DB2 ; 3=les deux
*/
const mode_generation = 2;

const repdest = 'testcreadb/';
const repsurrogates = 'surrogates/';
const path = config1.exportPath;

async function loadCSV1() {
  /*
  * Chargement des tables
  */
  const path = 'datas/klist_tables.csv';
  const columns = 'nom_entite as entite, nom_physique as physiq, nom_logique as logiq, designation'
  const res = await alasql.promise(`SELECT ${columns} FROM CSV(?, {headers:true, separator:";"})`, [path]);
  return res;
}

(async () => {
  let errors = [];

  const dbcnx1 = await odbc.connect(getDSN(config1));

	const entites = await loadCSV1();

  const query1 = 'select trim(rffile) as rffile, trim(rflib) as rflib , trim(rfname) as rfname from ? ';
  const fichiers = alasql (query1, [list_fichiers, "PF"]);

  const fusion = `select a.entite, a.physiq, a.logiq, a.designation, b.rfname, b.rflib
from ? a
inner join ? b
  on a.physiq = b.rffile
order by a.physiq, a.logiq  
`;

  const ref_ori = {
    file : 'QDDSSRC',
    bibl : 'GCSRC'
  }
  const ref_des = {
    file : 'QDDSSRC',
    bibl : 'JARRIGE2'
  }

  // liste des membres du fichier source d'origine
  let mbrListOri = await dbcnx1.query(getAllMembersFromFile(), [ref_ori.bibl, ref_ori.file]);
  // liste des membres du fichier source de destination
  let mbrListDes = await dbcnx1.query(getAllMembersFromFile(), [ref_des.bibl, ref_des.file]);

  const prefix_physiq = 'X_';

  const insertQry = `INSERT INTO ${ref_des.file} (SRCSEQ, SRCDAT, SRCDTA) VALUES (?, ?, ?) `;

  const newdate = new Date();
  const insertDate = formatOn2Digits(newdate.getYear()-100) +
                    formatOn2Digits(newdate.getMonth()) +
                    formatOn2Digits(newdate.getDay()) ;

  const liste_tables2 = alasql(fusion, [entites, fichiers])
  let liste_tables3 = JSON.parse(JSON.stringify(liste_tables2));

  // boucle de traitement des fichiers physiques => ajoute les fichiers physiques en tant que fichiers logiques,
  //  au début du tableau liste_tables3, afin que la boucle suivante puisse traiter tous les membres 
  //  en une seule passe
  let rupt_physiq = 'ZZZ'; // zone de rupture pour détecter un changement de fichier physique
  for (let i=0, imax=liste_tables2.length; i<imax; i++) {
    let mainItem = liste_tables2[i];
    if (mainItem.physiq != rupt_physiq) {
      rupt_physiq = mainItem.physiq;
      let newmember = {...mainItem}; // clonage d'objet
      newmember.logiq = newmember.physiq; // le physique est ajouté en tant que logique 
      liste_tables3.unshift(newmember);
      console.log('ajout membre '+ newmember.physiq);
    }
  }

  // boucle de traitement des fichiers logiques
  for (let i=0, imax=liste_tables3.length; i<imax; i++) {
    let mainItem = liste_tables3[i];
    /* structure de mainItem :
      {
        entite: 'VHU_TIERS',
        physiq: 'FWVHUTIE',
        logiq: 'FWVHUTIE01',
        designation: 'VHU- Tiers',
        rfname: 'FWVHUTIEF',
        rflib: 'GCFIC'
      }
    */
    console.log('Membre : '+mainItem.logiq)

    let topCheck = true;
    let qryCheck = alasql('SELECT 1 as trouve FROM ? WHERE SYSTEM_TABLE_MEMBER = ?', 
      [mbrListOri, String(mainItem.logiq).trim()]);

    if (qryCheck.length == 0) {
      topCheck = false;
      //errors.push(`Membre inexistant : ${ref_ori.bibl}/${ref_ori.file} MBR(${mainItem.logiq})`);
      errors.push(`Membre inexistant : ${ref_ori.bibl}/${ref_ori.file} MBR(${mainItem.logiq}) entité ${mainItem.entite}`);
    } else {
      if (mode_generation == 2 || mode_generation == 3) {
        // contrôle à faire seulement si on crée des membres sur l'IBMi
        let qryCheck = alasql('SELECT 1 as trouve FROM ? WHERE SYSTEM_TABLE_MEMBER = ?', 
          [mbrListDes, String(mainItem.logiq).trim()]);
        if (qryCheck.length > 0) {
          topCheck = false;
          errors.push(`Membre existant dans fichier cible (non recréé) : ${ref_des.bibl}/${ref_des.file} MBR(${mainItem.logiq})`);
        }  
      }
    }

    if (topCheck) {

      // ouverture du membre d'origine <memberName> 
      let cmd1ori = genOverlayDBFile(ref_ori.file, ref_ori.bibl, mainItem.logiq);
      let res1ori = await dbcnx1.query(cmd1ori);

      // récupération des lignes du membre courant
      let qry1ori = "SELECT SRCDTA FROM QDDSSRC ORDER BY SRCSEQ";
      let res2ori = await dbcnx1.query(qry1ori);

      // arrêt de l'overlay 
      let cmd3ori = dropOverlayDBFile();
      //let res3ori = await dbcnx1.query(cmd3ori);

      let typ_file = 'LF';
      if (mainItem.logiq == mainItem.physiq) {
        typ_file = 'PF';
      }
      let linedes = [];
      
      for (let j=0, jmax=res2ori.length; j<jmax; j++) {
        let lineori = new String(res2ori[j]['SRCDTA']);

        if (typ_file == 'PF') {
          /* dans le cas d'un PF */
          /* il faut transformer la 5ème ligne du membre ci-dessous : 
               A          R FABTRAF                   TEXT('v50613 - Barèmes de transpor-
            ... en 2 lignes :
               A          R FABTRAF                   PFILE(X_FABTRA)
               A                                      TEXT('v50613 - Barèmes de transpor 
          */
          if (j != 4) {  
            linedes.push( lineori ); // les autres lignes demeurent inchangées
          } else {
            let oldpart1 = lineori.substring(0, formatsDDS.att.beg)
            let oldtext1 = lineori.substring(formatsDDS.att.beg, formatsDDS.att.end)
            let newpart1 = oldpart1 + `PFILE(${prefix_physiq}${mainItem.physiq})`;
            linedes.push( newpart1 );
            let oldpart2 = oldpart1.split(''); 
            oldpart2.forEach((zitem, z) => {
              if (z > 6) { // vidage du contenu à droite du A 
                oldpart2[z] = ' ';
              }
            })
            let newpart2 = oldpart2.join('') + oldtext1;
            linedes.push( new String(newpart2) );
          }
        } else {
          /* cas d'un vrai LF */
          if (lineori.includes(`PFILE(${mainItem.physiq})`)) {
            // ajout d'un préfixe X_ devant le nom du fichier physique
            let newline = lineori.replace(`PFILE(${mainItem.physiq})`, `PFILE(${prefix_physiq}${mainItem.physiq})`);
            let arrnewline = newline.split('');
            arrnewline.pop(); // suppression de 2 caractères pour éviter un dépassement de longueur de ligne
            arrnewline.pop(); // 
            newline = arrnewline.join('');
            linedes.push( new String(newline) );
          } else {
            linedes.push( lineori );
          }  
        }
      }

      if (mode_generation == 2 || mode_generation == 3) {
        // création du membre de destination
        let cmd1des = genAddPFM(ref_des.bibl, ref_des.file, mainItem.logiq, 'LF', mainItem.designation);
        let res1des = await dbcnx1.query(cmd1des);

        // ouverture du membre d'origine <memberName> 
        let cmd2des = genOverlayDBFile(ref_des.file, ref_des.bibl, mainItem.logiq);
        let res2des = await dbcnx1.query(cmd2des);
        
        const statement = await dbcnx1.createStatement();
        await statement.prepare(insertQry);

        let numline = 0.00; // compteur de ligne utilisé pour l'insertion en BD

        // injection de la ou des lignes prédigérées
        for (let x=0, xmax=linedes.length; x<xmax; x++) {
          numline += 0.01;
          console.log(linedes[x].length, linedes[x])
          //let test = await dbcnx1.query(insertQry, [numline, insertDate, linedes[x]]);
          await statement.bind([numline, insertDate, linedes[x]]);
          await statement.execute();
        }

        // arrêt de l'overlay 
        let cmd3des = dropOverlayDBFile();
        let res3des = await dbcnx1.query(cmd3des);
      }
      if (mode_generation == 1 || mode_generation == 3) {
        console.log('enregistrement du fichier : '+mainItem.logiq+'.txt');
        FS.writeFileSync( path+repdest+repsurrogates+mainItem.logiq+'.txt', linedes.join('\n') );
      }
    }

  }

  if (errors.length>0) {
    console.log("Liste des anomalies durant la génération des indexs de type surrogate :");
    errors.forEach((error, ie) => {
      //console.log(`${ie} - ${error}`)
      console.log(`${error}`)
    })
  } else {
    console.log("Pas d'anomalies durant la génération des indexs de type surrogate.");
  }

})();
