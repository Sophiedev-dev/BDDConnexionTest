// Définitions d'étapes du scénario technique de vérification de la configuration.
const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('node:assert/strict');

Given('un compteur initialisé à {int}', function (valeur) {
  this.compteur = valeur;
});

When("j'ajoute {int} au compteur", function (valeur) {
  this.compteur += valeur;
});

Then('le compteur vaut {int}', function (attendu) {
  assert.equal(this.compteur, attendu);
});

Then('le paramètre {string} du World est défini', function (nom) {
  assert.equal(typeof this.parameters[nom], 'boolean');
});
