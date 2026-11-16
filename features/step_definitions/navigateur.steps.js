// Définitions d'étapes du scénario technique Playwright (page locale, sans réseau).
const { Given, Then } = require('@cucumber/cucumber');
const assert = require('node:assert/strict');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const DOSSIER_FIXTURES = path.join(__dirname, '..', 'fixtures');

Given("j'ouvre la page locale {string}", async function (fichier) {
  await this.page.goto(pathToFileURL(path.join(DOSSIER_FIXTURES, fichier)).href);
});

Then('le titre de la page est {string}', async function (attendu) {
  assert.equal(await this.page.title(), attendu);
});

Then('le titre principal {string} est visible', async function (texte) {
  const titre = this.page.getByRole('heading', { level: 1, name: texte });
  await titre.waitFor({ state: 'visible', timeout: 5000 });
});
