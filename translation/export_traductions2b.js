/*
 * script export_traductions2b.js (variante du 2a, pour ARCHIVE)
 * Convertit le fichier des traductions finales du JSON vers le CSV
 * TODO : malgré différents tests, je n'ai pas réussi à encapsuler les colonnes
 *        dataori et datades dans des apostrophes avec les paramètres standards
 *        de fast-csv (mal documenté ou buggé ?)
 * du coup ce script fait plutôt moins bien que la variante 2a
 *  (conservé pour archive)
 */
const FS = require("fs");
const fastcsv = require("fast-csv");

const config1 = require('./library/env1');
const path = config1.exportPath;

const fichier_original = "Trad_finales.json";
const fichier_final = "Trad_finales.csv";

const jsonData = require(path + fichier_original);

const options = {
  encoding: "utf8",   // pris en compte ??
  objectMode: true,
  delimiter: ";",     // OK
  quoteColumns: true, // pas pris en compte !!
  quoteChar : '"',    // pas pris en compte !!
  headers: true,
  renameHeaders: false,
};

let ws = FS.createWriteStream(path + fichier_final, { flags: 'a' });

|| fastcsv.
    write(jsonData, options)
        .pipe(ws);
