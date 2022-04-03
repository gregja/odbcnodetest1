const languages = {
    arabic: 'ara',
    german: 'ger',
    spanish: 'spa',
    french: 'fra',
    hebrew: 'heb',
    italian: 'ita',
    japanese: 'jpn',
    dutch: 'dut',
    polish: 'pol',
    portuguese: 'por',
    romanian: 'rum',
    russian: 'rus',
    turkish: 'tur',
    chinese: 'chi',
    english: 'eng',
};

const urlAPIs = {
    "TRANSLATION_URL" : "https://context.reverso.net/translation/",
    "TRANSLATION_URL2" : "https://www.deepl.com/translator?utm_source=lingueebanner1&il=",
    "SYNONYMS_URL"    : "https://synonyms.reverso.net/synonym/"
};

module.exports = {
  urlAPIs: urlAPIs,
  languages: languages
};
