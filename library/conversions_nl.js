const conversions = {
  'Nbre' : 'Nombre ',
  'Nb' : 'Nombre ',
  'N°' : 'Numéro ',
  'Num.': 'Numéro ',
  '/' : ' / ',
  'Ty' : 'Type ',
  'ID' : 'Identifiant ',
  'Pds': 'Poids ',
  'Prv/dst': 'Provenance / Destination',
  'Prv': 'Provenance ',
  'Dst': 'Destination ',
  'gpe': 'groupe ',
  'Libelle': 'Libellé ',
  'Mont.': 'Montant ',
  'Mont ': 'Montant ',
  'Fac ' : 'Facture ',
  'Mvt': 'Mouvement ',
  'mvt': 'mouvement ',
  'Ct ': 'Contrat ',
  'paramètrés': 'paramétrés'
}

const conversions_sigles = {
  'O/N' : 'J/N',
  'Oui/Non' : 'Ja/Neen',
  'Oui/non' : 'Ja/Neen',
  'HT': 'EB',    // exclusief belastingen
  'TTC': 'AT',   // all-tax (prijs)
  'TVA': 'BOT',   // belasting over de toegevoegde waarde
  'OL': 'LS',     // levering sopdracht
  'N°' : 'Nr',  // Nummer
  'Qté': 'Hvh',    // hoeveelheid
  'VHU' : "AK ",   // auto kapot
//  'BSD' : 'SGA',     // staat gevolgd afval (SGA)
}

module.exports = {
  conversions: conversions,
  conversions_sigles: conversions_sigles
};
