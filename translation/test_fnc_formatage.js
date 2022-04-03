// script de test de la fonction formatage()

const {formatage} = require('../library/tools.js');

let endPattern = '. . . . . :';
let result = formatage('g', 30, endPattern, 'Bewegingsnummer');
console.log(result, result.length);
result = formatage('g', 30, endPattern, 'Numéro de mouvement');
console.log(result, result.length);

//Bewegingsnummer. . . . . . . : 30
//Numéro de mouvement. . . . . : 30
