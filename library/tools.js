
/*
 * Méthode simple et rapide pour remplacer toutes les occurrences
 * d'un caractère par un autre
 */
function replaceAll (origine, str1, str2) {
  let data = new String(origine);
  return data.split(str1).join(str2);
}

/*
 * Supprimer tous les caractères non alphabétiques
 */
function dropAllNonAlphaChars(value) {
  let data = new String(value);
  return data.replace(/[^0-9a-z]/gi, '').trim() ;
}

/*
 * génération d'une portion de DOM à partir de code html
 * technique trouvé sur w3docs
 * finalement non utilisé mais conservé au cas où..
  * https://www.w3docs.com/snippets/javascript/how-to-create-a-new-dom-element-from-html-string.html
  */
function htmlToElem(doc, html) {
  let temp = doc.createElement('template');
  html = html.trim(); // Never return a space text node as a result
  temp.innerHTML = html;
  return temp.content.firstChild;
}

/*
 * scraping de données encapsulées dans une chaîne de caractères
 */
function scraping(response, str_begin, str_end) {
  var start_resp = response.indexOf(str_begin)+str_begin.length;
  var end_resp = response.indexOf(str_end);
  var tampon = response.substring(start_resp, end_resp);
  return tampon;
}

/*
 * Elimination des caractères accentués
 *  https://www.developpez.net/forums/d1134410/javascript/general-javascript/fonction-remplacer-caracteres-accentues/
 * 	accent   = "ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõöøùúûýýþÿŠŽšžŸ"
 *	noaccent = "AAAAAAACEEEEIIIIDNOOOOOOUUUUYbsaaaaaaaceeeeiiiidnoooooouuuyybySZszY"
 */
function dropAccents(my_string){
    var des_string = new String(my_string);

    // tableau accents
		var pattern_accent = new Array(/À/g, /Á/g, /Â/g, /Ã/g, /Ä/g, /Å/g, /Æ/g, /Ç/g, /È/g, /É/g, /Ê/g, /Ë/g,
		/Ì/g, /Í/g, /Î/g, /Ï/g, /Ð/g, /Ñ/g, /Ò/g, /Ó/g, /Ô/g, /Õ/g, /Ö/g, /Ø/g, /Ù/g, /Ú/g, /Û/g, /Ü/g, /Ý/g,
		/Þ/g, /ß/g, /à/g, /á/g, /â/g, /ã/g, /ä/g, /å/g, /æ/g, /ç/g, /è/g, /é/g, /ê/g, /ë/g, /ì/g, /í/g, /î/g,
		/ï/g, /ð/g, /ñ/g, /ò/g, /ó/g, /ô/g, /õ/g, /ö/g, /ø/g, /ù/g, /ú/g, /û/g, /ü/g, /ý/g, /ý/g, /þ/g, /ÿ/g,
    /Š/g, /Ž/g, /š/g, /ž/g, /Ÿ/g);

		// tableau sans accents
		var pattern_replace_accent = new Array("A","A","A","A","A","A","A","C","E","E","E","E",
		"I","I","I","I","D","N","O","O","O","O","O","O","U","U","U","U","Y",
		"b","s","a","a","a","a","a","a","a","c","e","e","e","e","i","i","i",
		"i","d","n","o","o","o","o","o","o","u","u","u","u","y","y","b","y","S",
    "Z","s","z","Y");

		//pour chaque caractère, si accentué alors le remplacer par un non accentué
		for(let i=0, imax=pattern_accent.length; i < imax; i++){
      des_string = des_string.replace(pattern_accent[i], pattern_replace_accent[i]);
		}
		return des_string;
}

// https://stackoverflow.com/questions/9862761/how-to-check-if-character-is-a-letter-in-javascript
function isLetter(c) {
  if (c == '(' || c == ')') {
    return true;
  }
  return c.toLowerCase() != c.toUpperCase();
}

// détection des masques de saisie présents dans un constante
// l'objectif étant des les isoler pour pouvoir les réappliquer sur les traductions
function detectPatterns(data_ori) {
  let result = '';
  let data = new String(data_ori);
  let length = data.length;

  let patterns = {
    before: '',
    textori: String(data_ori),
    center: String(data_ori),
    after: ''
  }

  // analyse par l'arrière
  for (let i=length-1; i>=0; i--) {
    let tmpdata = data[i];
    if (isLetter(tmpdata)) {
      i = -1; // stop the loop
    } else {
        patterns.after = tmpdata + patterns.after;
    }
  }

  // analyse par l'avant
  // détection préalable des touches de fonction
  let fnc_check3 = data.substring(0, 3);
  let fnc_check4 = data.substring(0, 4);
  let fnc_detect = false;
  for (let i=1, imax=25; i<imax; i++) {
    let tmpfnc = `F${i}=`;
    if (fnc_check4 == tmpfnc || fnc_check3 == tmpfnc ) {
      patterns.before = tmpfnc;
      imax = 999; // fin de boucle
    }
  }
  if (!fnc_detect) {
    for (let i=0, imax=length; i<imax; i++) {
      let tmpdata = data[i];
      if (isLetter(tmpdata)) {
        i = imax + 1; // stop the loop
      } else {
        patterns.before += tmpdata;
      }
    }
  }

  if (patterns.before != '' || patterns.after != '') {
    patterns.center = patterns.center.replace(patterns.before, '');
    patterns.center = patterns.center.replace(patterns.after, '');
    patterns.center = patterns.center.trim();
  }

  return patterns;
}

function chunk (arr, len) {
  var chunks = [],
  i = 0,
  n = arr.length;
  while (i < n) {
    chunks.push(arr.slice(i, i += len));
  }
  return chunks;
}

function genFilledArray(items=10, valdef=null) {
  let tmp = [...new Array(items)].map((item, idx) => idx);
  tmp.forEach((item, i) => {
    tmp[i] = valdef;
  });
  return tmp;
}

// mise en majuscule du premier caractère du premier mot de la chaîne
function capitalize(value) {
  let string = new String(value);
  if (string.length == 0) return '';
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

// mise en majuscule du premier caractère de tous les mots de la chaîne
function capitalize2(param) {
  var temp = param.split(' ');
  var result = '';
  for (let i=0, imax=temp.length; i<imax ; i++) {
    result += ' ' + temp[i].charAt(0).toUpperCase() +
    temp[i].slice(1).toLowerCase();
  }
  return result;
}

function isUpper(value) {
      var rtn = false;
      if (value == value.toUpperCase()) rtn = true;
      return rtn;
}

function isCapitalized(value) {
      var char1 = value[0];
      var char2 = value[1];
      if (char1 == char1.toUpperCase() && char2 == undefined) return true;
      if (char1 == char1.toUpperCase() && char2 == char2.toLowerCase()) return true;
      return false;
}


function replaceAllTags(value, oldValue, newvalue) {
  let html = new String(value);
  return html.split('{{xx}}').join(newvalue);
}

function cleanInput (value) {
  let entry = new String(value);
  return entry.replace(/[^\x09\x0A\x0D\x20-\x7F\xC0-\xFF]/, '');
}

// cette fonction ne peut fonctionner qu'avec Puppeteer
function prepareURL (data) {
  return encodeURIComponent(replaceAll(data, ' ', '+'));
}

// technique ES6 pour éliminer les doublons dans un tableau
function deleteDoublons(datas) {
  return [...new Set(datas)]
}

// centre un texte par rapport à une longueur maximum
function centrage (data, longmax) {
  let res = new String(data);
  let diff = longmax - res.length;

  if (diff > 0) {
    let before = Math.floor(diff / 2);
    let after = diff - before;
    res = res.padStart(before+res.length);
    res = res.padEnd(after+res.length);
  }
  return res;
}

/*
 * Fonction renvoyant un cadrage le plus homogène possible, en tenant compte
 * des patterns de fin (endPattern), et de la longueur de chaque constante (firstPart)
 * Même si le pattern ne remplit pas complètement la fin d'une constante, on
 * rajoute artificiellement les points et les blancs manquants.
 * Exemple d'utilisation (et cas de test) :
 *   let endPattern = '. . . . . :';
 *   let result = formatage('g', 30, endPattern, 'Bewegingsnummer');
 *   console.log(result, result.length);
 *   result = formatage('g', 30, endPattern, 'Numéro de mouvement');
 *   console.log(result, result.length);
 * Résultats produits par le code ci-dessus:
 *   Bewegingsnummer. . . . . . . : 30
 *   Numéro de mouvement. . . . . : 30
 */
function formatage(typcadrage, longmax, endPattern, firstpart) {
  endPattern = new String(endPattern);
  firstpart = new String(firstpart);
  if (typcadrage == 'c' || endPattern == '') {
    // si la donnée en centrée ou s'il n'y a pas d'endPattern, alors on reste là
	   return firstpart + endPattern;
  }

  let arr_endPattern = endPattern.split('');
  let datadest = firstpart;
  let arr_datadest = datadest.split('');

  if (arr_datadest.length < longmax) {
    for(let i=arr_datadest.length; i<longmax; i++) {
      arr_datadest.push(' ');
    }
  }

  let last_car = '$';
  for (i=arr_datadest.length-1, imin=0; i>=imin; i--) {
    if (arr_datadest[i] != ' ') {
      i = -1; // on n'est plus dans la zone blanche de fin, alors on arrête tout
    } else {
      if (arr_endPattern.length == 0) {
        // on n'a plus de motif sous la main, mais on continue le remplissage
        // des blancs avec un motif estimé en fonction du caractère précédent
        if (last_car == ' ' || last_car == '.') {
          // alternance de blancs et de points
          if (last_car == ' ') {
            last_car = '.';
          } else {
            last_car = ' ';
          }
          arr_datadest[i] = last_car;
        }
      } else {
        last_car = arr_endPattern.pop();
        arr_datadest[i] = last_car;
      }
    }
  }
  datadest = arr_datadest.join('');
  return datadest;
}

function consoleObject(datas) {
  for (let key in datas) {
    if (datas.hasOwnProperty(key)) {
      console.log(`${key} : `, datas[key]);
    }
  }
}

function rtrim(data) {
  let tmp = String(data).split('');
  let lng = tmp.length-1;
  let res = [];
  while (tmp[lng] == ' ') {
    tmp.pop();
    lng --;
  }
  return tmp.join('');
}

function cloneArray(data) {
  return JSON.parse(JSON.stringify(data));
}

function cloneObject(data) {
  return { ...data };
}

function isCentered(data) {
  let value = new String(data);
  return (value.substring(0, 1) == ' ' ? 'c':'g');
}
function chunk (arr, len) {
  var chunks = [],
  i = 0,
  n = arr.length;
  while (i < n) {
    chunks.push(arr.slice(i, i += len));
  }
  return chunks;
}

function formatOn2Digits(value) {
  if (value < 10) {
    return "0"+String(value);
  } else {
    return String(value);
  }
}

module.exports = {
  replaceAll: replaceAll,
  htmlToElem: htmlToElem,
  scraping: scraping,
  dropAccents: dropAccents,
  detectPatterns: detectPatterns,
  chunk: chunk,
  capitalize: capitalize,
  capitalize2: capitalize2,
  replaceAllTags: replaceAllTags,
  cleanInput: cleanInput,
  prepareURL: prepareURL,
  isUpper: isUpper,
  isCapitalized: isCapitalized,
  deleteDoublons: deleteDoublons,
  centrage: centrage,
  formatage: formatage,
  consoleObject: consoleObject,
  rtrim: rtrim,
  genFilledArray: genFilledArray,
  cloneArray: cloneArray,
  cloneObject: cloneObject,
  dropAllNonAlphaChars: dropAllNonAlphaChars,
  isCentered: isCentered,
  chunk: chunk,
  formatOn2Digits: formatOn2Digits
};
