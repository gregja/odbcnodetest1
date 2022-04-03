/*
 * Appel de l'API Reverso n° 1 de traduction
 */

const puppeteer = require("puppeteer")

const {replaceAll, htmlToElem, scraping} = require('../library/tools.js');
const {urlAPIs} = require('../library/constants.js');

const from_lang = 'french';
const to_lang = 'dutch';

const to_translate = [
  'Bonjour tout le monde',
  'Allez-vous bien ?',
  "C'est génial !"
];

function prepareURL (data) {
  return encodeURIComponent(replaceAll(data, ' ', '+'));
}

const URL = urlAPIs.TRANSLATION_URL + from_lang + '-' +  to_lang + '/' ;

console.log(URL);

function scraping_manuel(origine, source) {
    // scraping manuel car Reverso résiste à l'évaluation de page de Puppeteer
    let result = scraping(source, '<div id="translations-content" class="wide-container">', '<section id="filters-content" class="wide-container">' )

    let temp = result.split("<em class='translation'");
    let trans = [];
    temp.forEach((item, cpt) => {
      if (cpt < 5) { // on ne garde que les 4 premières traductions
        let tmp = scraping(item, '>', '</em>');
        if (tmp.trim() != "" && tmp.substring(0, 1) != "\n") {
          trans.push(tmp);
        }
      }
    })
    return trans;
}

/*
 * Renvoie une valeur aléatoire entre 1 et 5000 secondes
 */
function timer() {
  return Math.floor(Math.random() * 5000)+1;
}

let trads = [];

async function Traduction (textToTranslate) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage()
    let url = URL + prepareURL(textToTranslate);
    await page.goto(url, {
        waitUntil: 'domcontentloaded',
    });
    const source = await page.content();
    trads.push({
      origine: textToTranslate,
      traduction: scraping_manuel(textToTranslate, source)
    })
    await browser.close();
}

;(async () => {

  for (let i=0, imax=to_translate.length; i<imax; i++) {
    // objectif du setTimeout : retarder l'exécution des requêtes HTTP
    //   avec un timer de durée variable, afin de ne pas se faire repérer
    await setTimeout(async function(){
          await Traduction(to_translate[i]);
          if (i == imax-1) {
             await setTimeout(()=>{
                console.log(trads);
             }, 1000)
          }
    }, timer() );
  }

})();
