// Traduction d'une phrase ("bonjour tout le monde") via le site Reverso
// Mise au point d'une fonction scraping_manuel car Reverso résiste
//  à l'évaluation effectuée par Puppeteer

const puppeteer = require("puppeteer")

const {replaceAll, htmlToElem, scraping} = require('../library/tools.js');
const {urlAPIs} = require('../library/constants.js');

const {scraping_manuel} = require('../library/tradTools.js');

const from_lang = 'french';
const to_lang = 'dutch';

const to_translate = 'Bonjour tout le monde';

function prepareURL (data) {
  return encodeURIComponent(replaceAll(data, ' ', '+'));
}

const URL = urlAPIs.TRANSLATION_URL + from_lang + '-' +  to_lang + '/' +
      prepareURL(to_translate);

console.log(URL);

;(async () => {
    // const browser = await puppeteer.launch({ headless: false })
    const browser = await puppeteer.launch({
      slowMo: 500,
    });
    const page = await browser.newPage()
    await page.goto(URL, {
        waitUntil: 'domcontentloaded',
    });

    const source = await page.content();

    let trads = [];
    trads.push({origine: to_translate, traduction: scraping_manuel(to_translate, source)})

    console.log(trads);

    await browser.close();

})()
