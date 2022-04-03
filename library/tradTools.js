const {scraping, replaceAll} = require('../temp/tools.js');

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

function confirme_bonne_traduction (value) {
  let res_scraping = new String(value);
  if (res_scraping == "<!DOCTYPE html>" || res_scraping.substr(0, 15) == 'meta http-equiv') {
    return false;
  }
  return true;
}

function generateURL (url, from_lang, to_lang) {
  return url + from_lang + '-' +  to_lang + '/' ;
}

function generateURL2 (url, from_lang, to_lang) {
  // https://www.reverso.net/traduction-texte#sl=fra&tl=dut&text=
  // // https://www.deepl.com/translator?utm_source=lingueebanner1&il=fr#fr/nl/affichage%20du%20dernier%20bar%C3%A8me
  return url + from_lang + "#" + from_lang + '/' +  to_lang + '/' ;
}


function clean_before_trans(conversions, value) {
  let res = new String(value);
  let keys = Object.keys(conversions);
  for (let i=0, imax=keys.length; i<imax; i++) {
    let key = keys[i];
    let val = conversions[key];
    res = replaceAll(res, key, val )
  }
  return res;
}

// cette fonction ne peut fonctionner qu'avec Puppeteer
function prepareURL (data) {
  return encodeURIComponent(replaceAll(data, ' ', '+'));
}

module.exports = {
  scraping_manuel: scraping_manuel,
  timer: timer,
  confirme_bonne_traduction: confirme_bonne_traduction,
  generateURL: generateURL,
  generateURL2: generateURL2,
  clean_before_trans: clean_before_trans,
  prepareURL: prepareURL
};
