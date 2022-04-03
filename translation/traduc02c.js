/*
 * Script traduc02c.js
 * Variante du traduc02b.js avec prise en compte des données déjà traduites
 * pour ne pas les rescrapper inutilement.
 * Dans cette variante, avant de solliciter Reverso, on vérifie si la
 * traduction est présente dans le fichier tradCompl.json.
 * Ce script ne sollicite donc Reverso qu'en dernier recours.
 * Les constantes déjà traduites ont été préalablement stockées dans le fichier
 * Trad_reverso_all.json, qui est une copie du fichier Trad_reverso.json généré
 * par traduc02a.js.
 * Le fichier tradCompl.json est un complément qui est sensé contenir toutes
 * les traduction manquantes aux étapes précédentes.
 * Le script produit en sortie les fichiers :
 * - Trad_reverso.json
 * - Trad_rebuts.json
*/

const FS = require('fs');
const puppeteer = require("puppeteer");
const alasql = require("alasql");

const config1 = require('./library/env1');

const {replaceAll, chunk, prepareURL} = require('../library/tools.js');
const {urlAPIs} = require('../library/constants.js');

const from_lang = 'french';
const to_lang = 'dutch';

const path = config1.exportPath;
const expfile1 = 'Trad_reverso.json';
const expfile2 = 'Trad_rebuts.json';

const to_translate = require('./exports/Constantes_uniques.json');
const deja_traduits = require('./exports/Trad_reverso_all.json');
const trad_compl = require('./exports/tradCompl.json');

const {scraping_manuel, timer, confirme_bonne_traduction, generateURL, clean_before_trans} =
  require('../library/tradTools.js');

const URL = generateURL(urlAPIs.TRANSLATION_URL, from_lang, to_lang);
console.log(URL);

const conversions = require('../library/conversions_nl.js');

let trads = [];
let rebuts = []; // stockage des données mal traduites pour une prochaine passe

async function Traduction (value) {
    //console.log(textToTranslate)
    let textToTranslate = clean_before_trans(conversions, value);
    const browser = await puppeteer.launch();
    const page = await browser.newPage()
    let url = URL + prepareURL(textToTranslate);
    await page.goto(url, {
        waitUntil: 'domcontentloaded',
    });
    const source = await page.content();
    let res_scraping = scraping_manuel(textToTranslate, source);
    if (confirme_bonne_traduction(res_scraping) == false) {
      rebuts.push(textToTranslate);
    } else {
      trads.push({
        origine: textToTranslate,
        traduction: res_scraping
      })
    }
    await browser.close();
}

let blocs_a_traduire = chunk(to_translate, 5);
console.log('Nombre de blocs (de 5) à traduire : ', blocs_a_traduire.length);
let nb_total_a_traduire = to_translate.length;
console.log('Nombre de constantes à traduire : ', nb_total_a_traduire);
let nb_traduits = 0;

;(async () => {

  for (let i=0, imax=blocs_a_traduire.length; i<imax; i++) {
    let bloc = blocs_a_traduire[i];
    for (let j=0, jmax=bloc.length; j<jmax; j++) {
      let constante = bloc[j];
      let check_deja_trad = alasql('select traduction as trad from ? where origine = ?', [deja_traduits, constante]);
      if (check_deja_trad.length > 0 && confirme_bonne_traduction(check_deja_trad[0].trad[0])) {
        console.log(i, j, constante, '=> déjà traduit'  );
        let oldtrads = [];
        check_deja_trad.forEach((item, i) => {
          oldtrads.push(item.trad);
        });

        trads.push({
          origine: constante,
          traduction: oldtrads
        })
      } else {
        let traduc_compl = alasql('select dtades as trad from ? where dtaori = ?', [trad_compl, constante]);
        if (traduc_compl.length > 0) {
          console.log(i, j, constante, '=> alimenté par traduCompl.json'  );
          trads.push({
            origine: constante,
            traduction: traduc_compl[0]['trad']
          })
        } else {
          console.log(i, j, constante, '=> à traduire'  );
          await Traduction(constante);
        }
      }
      nb_traduits ++;
      if (nb_traduits >= nb_total_a_traduire-1) {
         await setTimeout(()=>{
            console.log('enregistrement du fichier : '+expfile1);
            FS.writeFileSync( path+expfile1, JSON.stringify(trads) );
            console.log('Nombre de traductions effectuées : ', trads.length);
            console.log('enregistrement du fichier : '+expfile2);
            FS.writeFileSync( path+expfile2, JSON.stringify(rebuts) );
            console.log('Nombre de rebuts : ', rebuts.length);
         }, 20000)
      }

    }
    await setTimeout(async function(){
      // petite attente avant de passer à un autre bloc
    }, 2000);
  }

})();
