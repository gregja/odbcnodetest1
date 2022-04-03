/*
 * script utilitaire pour transformer une ligne de type carte C du RPG ILE
 *  en RPG Free (expérimental)
 */
let src = `     C                   ADD       DEVAST        ZCUMVS
     C                   ADD       DEVAST        ZCUMV2
`;

let blank = '         ';
let src_tmp = [];
let lignes = src.split('\n');
lignes.forEach((item, i) => {
  let typcol = item.substring(5, 6) ;

  if (typcol == 'C') {
    let verbe = item.substring(25, 35).trim();
    let champ1 = item.substring(35, 45).trim();
    let champ2 = item.substring(49, 59).trim();
    //console.log(verbe, champ1, champ2);

    if (verbe == 'Z-ADD' || verbe == 'MOVE' || verbe == 'MOVEL') {
      src_tmp.push(`${blank}${champ2} = ${champ1} ;`);
    } else {
      if (verbe == 'ADD') {
        src_tmp.push(`${blank}${champ2} = ${champ2} + ${champ1} ;`);
      }
    }
  }
});

let src_final = src_tmp.join('\n');

console.log(src_final);
