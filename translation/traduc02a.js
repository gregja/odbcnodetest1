/*
 * Script Puppet05a.js
 * Traduction des constantes uniques, via un scraping de Reverso
  *  avec stockage du résultat dans deux fichiers JSON :
  *  - Trad_reverso.json : fichier contenant la liste des constantes traduites
  *  - Trad_rebuts.json : fichier contenant la liste des constantes rejetées par Reverso
 */
const FS = require('fs');
const puppeteer = require("puppeteer");

const config1 = require('./library/env1');

const {replaceAll, chunk, scraping} = require('../library/tools.js');
const {urlAPIs} = require('../library/constants.js');

const from_lang = 'french';
const to_lang = 'dutch';

const path = config1.exportPath;
const expfile1 = 'Trad_reverso.json';
const expfile2 = 'Trad_rebuts.json';

const to_translate = require('./exports/Constantes_uniques.json')

const {scraping_manuel, timer, confirme_bonne_traduction, prepareURL, generateURL} =
  require('../library/tradTools.js');

const conversions = require('../library/conversions_nl.js');

const URL = generateURL(urlAPIs.TRANSLATION_URL, from_lang, to_lang);
console.log(URL);

let trads = [];
let rebuts = []; // stockage des données mal traduites pour une prochaine passe

async function Traduction (value) {
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
      console.log(i, j, constante);
      await Traduction(constante);
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
