// Définitions d'étapes de features/authentication.feature (site réel https://chatgpt.com/).
// Aucune donnée sensible n'est saisie ni stockée : les opérations sensibles sont faites à la main.
const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('node:assert/strict');
const site = require('../support/chatgpt');

const METHODE = process.env.METHODE_CONNEXION || 'Google';
const ETAPE_RESEAU = { timeout: site.DELAI_VERIFICATION_MS + 90 * 1000 };

async function ouvrirModaleConnexion(world) {
  await site.boutonSeConnecter(world.page).click();
  await site.modaleConnexion(world.page).waitFor({ state: 'visible', timeout: 15 * 1000 });
}

async function selectionnerMethode(world) {
  const proposees = await site.methodesProposees(world.page);
  assert.ok(proposees.includes(METHODE), `Méthode "${METHODE}" non proposée. Méthodes observées : ${proposees.join(', ')}`);
  assert.ok(
    site.DESTINATIONS[METHODE],
    `Méthode "${METHODE}" non sélectionnable sans saisie. Méthodes utilisables : ${Object.keys(site.DESTINATIONS).join(', ')}`,
  );
  await site.modaleConnexion(world.page).getByRole('link', { name: `Continuer avec ${METHODE}`, exact: true }).click();
  world.methodeChoisie = METHODE;
}

async function attendrePageFournisseur(world) {
  const hote = site.DESTINATIONS[world.methodeChoisie];
  await world.page.waitForURL((u) => u.host === hote, { timeout: 90 * 1000 });
}

// --- Contexte ---------------------------------------------------------------

Given('le navigateur ne possède aucune session ChatGPT active', async function () {
  assert.deepEqual(await this.context.cookies(), [], 'Le contexte du navigateur contient déjà des cookies');
});

// --- Accueil ----------------------------------------------------------------

When("j'ouvre le site officiel de ChatGPT", ETAPE_RESEAU, async function () {
  await site.ouvrirAccueil(this);
});

Given("je suis sur la page d'accueil de ChatGPT", ETAPE_RESEAU, async function () {
  await site.ouvrirAccueil(this);
  await site.boutonSeConnecter(this.page).waitFor({ state: 'visible', timeout: 30 * 1000 });
});

Then("la page d'accueil de ChatGPT s'affiche", async function () {
  assert.match(await this.page.title(), /ChatGPT/);
  await this.page.getByRole('heading', { level: 1 }).first().waitFor({ state: 'visible', timeout: 30 * 1000 });
});

Then("l'adresse de la page appartient au domaine officiel de ChatGPT", function () {
  assert.equal(new URL(this.page.url()).host, site.HOTE_OFFICIEL);
});

Then('un accès à la connexion est proposé', async function () {
  // Délai inférieur à celui de l'étape (30 s) pour obtenir le message précis de Playwright.
  await site.boutonSeConnecter(this.page).waitFor({ state: 'visible', timeout: 20 * 1000 });
});

// --- Page de connexion ------------------------------------------------------

When('je demande à me connecter', async function () {
  await ouvrirModaleConnexion(this);
});

Given('je suis sur la page de connexion de ChatGPT', ETAPE_RESEAU, async function () {
  await site.ouvrirAccueil(this);
  await site.boutonSeConnecter(this.page).waitFor({ state: 'visible', timeout: 30 * 1000 });
  await ouvrirModaleConnexion(this);
});

Then("la page de connexion s'affiche", async function () {
  assert.ok(await site.modaleConnexion(this.page).isVisible(), 'La fenêtre de connexion ne s’affiche pas');
});

Then('au moins une méthode de connexion est proposée', async function () {
  this.methodesObservees = await site.methodesProposees(this.page);
  assert.ok(this.methodesObservees.length > 0, 'Aucune méthode de connexion proposée');
});

Then('les méthodes de connexion réellement proposées sont consignées dans le rapport', async function () {
  const methodes = this.methodesObservees ?? (await site.methodesProposees(this.page));
  this.attach(`Méthodes de connexion observées : ${methodes.join(', ')}`, 'text/plain');
});

// --- Démarrage du processus -------------------------------------------------

When(
  'je sélectionne la méthode de connexion choisie pour le test parmi celles proposées',
  async function () {
    await selectionnerMethode(this);
  },
);

Then('le processus de connexion démarre', { timeout: 90 * 1000 }, async function () {
  await this.page.waitForURL((u) => u.host !== site.HOTE_OFFICIEL || u.pathname.startsWith('/auth/'), {
    timeout: 60 * 1000,
  });
});

Then("la page correspondant à la méthode choisie s'affiche", { timeout: 120 * 1000 }, async function () {
  await attendrePageFournisseur(this);
  assert.equal(new URL(this.page.url()).host, site.DESTINATIONS[this.methodeChoisie]);
});

// --- Connexion réussie (session ouverte manuellement dans le profil Chrome dédié) ---

Given('le profil Chrome de test contient une session ouverte manuellement', async function () {
  // Seule la présence de cookies chatgpt.com est contrôlée : leurs valeurs ne sont jamais lues.
  const cookies = await this.context.cookies(site.URL_ACCUEIL);
  assert.ok(
    cookies.length > 0,
    'Aucun cookie ChatGPT dans le profil de test : lancez "npm run profil:connexion" et connectez-vous.',
  );
});

Then("un indicateur fiable de l'espace authentifié de ChatGPT est visible", async function () {
  assert.equal(await site.estAuthentifie(this.page), true, 'La session ChatGPT ne contient aucun utilisateur');
});

Then("l'accès à la connexion n'est plus proposé", async function () {
  await site.boutonSeConnecter(this.page).waitFor({ state: 'hidden', timeout: 30 * 1000 });
});

// --- Connexion non aboutie --------------------------------------------------

Given(
  "j'ai démarré le processus de connexion avec une méthode proposée",
  { timeout: 120 * 1000 },
  async function () {
    await selectionnerMethode(this);
    await attendrePageFournisseur(this);
  },
);

When(
  "j'interromps volontairement le processus avant toute saisie ou validation d'informations",
  async function () {
    // Le test n'a rien saisi : il est toujours sur la page du fournisseur lorsqu'il l'abandonne.
    assert.equal(new URL(this.page.url()).host, site.DESTINATIONS[this.methodeChoisie]);
    await this.page.goto('about:blank');
  },
);

// Vérifications sans revenir sur chatgpt.com (le retour déclenche systématiquement Cloudflare).
Then('le serveur ChatGPT ne reconnaît aucune session authentifiée pour ce navigateur', async function () {
  assert.equal(await site.sessionServeurAuthentifiee(this.context), false, 'Le serveur reconnaît une session authentifiée');
});

Then("aucun cookie de session ChatGPT n'est présent dans le navigateur", async function () {
  const cookies = await site.cookiesDeSession(this.context);
  assert.deepEqual(cookies, [], `Cookie(s) de session présent(s) : ${cookies.join(', ')}`);
});
