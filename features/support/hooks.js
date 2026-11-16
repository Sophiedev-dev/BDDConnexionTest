// Hooks Playwright :
// - @navigateur     : Chromium neuf, sans aucune session ;
// - @profil-chrome  : Chrome installé, sur le profil dédié contenant une session ouverte manuellement.
const { Before, After, Status } = require('@cucumber/cucumber');
const fs = require('node:fs/promises');
const path = require('node:path');
const { verifierEmplacementProfil } = require('./profil-chrome');

const DOSSIER_CAPTURES = path.join('reports', 'screenshots');

async function capturerSiEchec(world, { pickle, result }) {
  if (result?.status !== Status.FAILED || !world.page) return;
  // Les champs mot de passe sont masqués : aucun secret ne peut apparaître sur une capture.
  // Délai borné : une page bloquée ne doit pas faire échouer le hook à la place du scénario.
  const capture = await world.page
    .screenshot({ fullPage: true, mask: [world.page.locator('input[type="password"]')], timeout: 10 * 1000 })
    .catch((erreur) => console.warn(`Capture d'écran impossible : ${erreur.message.split('\n')[0]}`));
  if (!capture) return;
  const nom = `${pickle.name.replace(/[^\w-]+/g, '_')}_${Date.now()}.png`;
  await fs.mkdir(DOSSIER_CAPTURES, { recursive: true });
  await fs.writeFile(path.join(DOSSIER_CAPTURES, nom), capture);
  world.attach(capture, 'image/png'); // capture également intégrée au rapport HTML
}

async function terminerScenario(scenario) {
  try {
    await capturerSiEchec(this, scenario);
  } finally {
    await this.fermerNavigateur();
  }
}

Before({ tags: '@navigateur' }, async function () {
  await this.ouvrirNavigateur();
});

Before({ tags: '@profil-chrome' }, async function () {
  await this.ouvrirProfilChrome(verifierEmplacementProfil());
});

After({ tags: '@navigateur or @profil-chrome' }, terminerScenario);
