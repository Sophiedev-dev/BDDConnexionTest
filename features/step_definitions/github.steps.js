// Définitions d'étapes de features/github-authentication.feature (site réel https://github.com/login).
// Les identifiants viennent des variables d'environnement ; aucune valeur n'est journalisée.
const { Given, When, Then } = require('@cucumber/cucumber');
const assert = require('node:assert/strict');
const gh = require('../support/github');

// --- Résolution des rôles du Gherkin en valeurs (null = donnée non configurée) ----

async function resoudreUtilisateur(role) {
  switch (role) {
    case 'vide':
      return '';
    case 'inexistant':
      return gh.nomInexistant();
    case 'mon compte':
      return process.env.GITHUB_USERNAME || null;
    case 'compte de test': {
      const compte = process.env.GITHUB_TEST_USERNAME;
      if (!compte) return null;
      // Protection du compte personnel : jamais de mauvais mot de passe dessus.
      if (compte.toLowerCase() === (process.env.GITHUB_USERNAME || '').toLowerCase()) {
        throw new Error('GITHUB_TEST_USERNAME doit être un compte de test distinct du compte personnel.');
      }
      if (compte.includes('@')) {
        throw new Error("GITHUB_TEST_USERNAME doit être un nom d'utilisateur GitHub (ex. mon-compte-test), pas une adresse email.");
      }
      if (!(await gh.compteExiste(compte))) throw new Error('Le compte GITHUB_TEST_USERNAME est introuvable sur GitHub.');
      return compte;
    }
    default:
      throw new Error(`Rôle d'utilisateur inconnu : "${role}"`);
  }
}

function resoudreMotDePasse(role) {
  switch (role) {
    case 'vide':
      return '';
    case 'aléatoire':
      return gh.motDePasseAleatoire();
    case 'valide':
      return process.env.GITHUB_PASSWORD || null;
    default:
      throw new Error(`Rôle de mot de passe inconnu : "${role}"`);
  }
}

const VARIABLES_REQUISES = {
  'mon compte': 'GITHUB_USERNAME',
  'compte de test': 'GITHUB_TEST_USERNAME',
  valide: 'GITHUB_PASSWORD',
};

// --- Contexte ---------------------------------------------------------------

Given("j'ouvre la page de connexion GitHub", async function () {
  const reponse = await this.page.goto(gh.URL_CONNEXION, { waitUntil: 'domcontentloaded' });
  await gh.verifierAbsenceProtection(this.page);
  assert.ok(reponse?.ok(), `GitHub a répondu HTTP ${reponse?.status()}`);
});

// --- Ouverture de la page ---------------------------------------------------

Then('la page de connexion GitHub est affichée', async function () {
  const url = new URL(this.page.url());
  assert.equal(url.host, gh.HOTE);
  assert.equal(url.pathname, '/login');
  assert.equal(await this.page.title(), 'Sign in to GitHub · GitHub');
  await this.page.getByRole('heading', { name: 'Sign in to GitHub' }).waitFor({ state: 'visible', timeout: 15 * 1000 });
});

Then('les champs {string} et {string} sont visibles et vides', async function (libelle1, libelle2) {
  for (const libelle of [libelle1, libelle2]) {
    const champ = this.page.getByLabel(libelle, { exact: true });
    await champ.waitFor({ state: 'visible', timeout: 10 * 1000 });
    assert.equal(await champ.inputValue(), '', `Le champ "${libelle}" n'est pas vide`);
  }
});

Then('le bouton {string} est visible', async function (nom) {
  await this.page.getByRole('button', { name: nom, exact: true }).waitFor({ state: 'visible', timeout: 10 * 1000 });
});

// --- Soumission -------------------------------------------------------------

When(
  "je soumets le formulaire de connexion avec le nom d'utilisateur {string} et le mot de passe {string}",
  { timeout: 60 * 1000 },
  async function (roleUtilisateur, roleMotDePasse) {
    const utilisateur = await resoudreUtilisateur(roleUtilisateur);
    const motDePasse = resoudreMotDePasse(roleMotDePasse);
    const manquantes = [roleUtilisateur, roleMotDePasse]
      .filter((role, i) => (i === 0 ? utilisateur : motDePasse) === null)
      .map((role) => VARIABLES_REQUISES[role]);
    if (manquantes.length) {
      const raison = `Scénario ignoré : variable(s) d'environnement non définie(s) : ${manquantes.join(', ')} (voir .env.example).`;
      console.warn(`\n${raison}`);
      this.attach(raison, 'text/plain');
      return 'skipped';
    }

    const { page } = this;
    this.requetesSession = [];
    page.on('request', (requete) => {
      if (requete.method() === 'POST' && new URL(requete.url()).pathname === '/session') this.requetesSession.push(1);
    });

    if (utilisateur) await gh.remplirSansDivulguer(gh.champUtilisateur(page), utilisateur);
    if (motDePasse) await gh.remplirSansDivulguer(gh.champMotDePasse(page), motDePasse);

    // Le navigateur n'envoie le formulaire que si les champs obligatoires sont remplis.
    const formulaireValide = await gh.formulaireValide(page);
    await gh.boutonConnexion(page).click();
    if (formulaireValide) {
      await page.waitForURL((u) => u.pathname !== '/login', { timeout: 45 * 1000, waitUntil: 'domcontentloaded' });
    } else {
      await page.waitForTimeout(1500);
    }
    await gh.verifierAbsenceProtection(page);
  },
);

// --- Identifiants valides ---------------------------------------------------

Then('GitHub accepte les identifiants', async function () {
  await gh.verifierAbsenceProtection(this.page);
  const chemin = new URL(this.page.url()).pathname;
  if (gh.CHEMINS_CONNEXION.includes(chemin)) {
    throw new Error(`Identifiants non acceptés (${chemin}). Alertes : ${JSON.stringify(await gh.alertesVisibles(this.page))}`);
  }
});

Then("l'étape de vérification suivante est affichée", async function () {
  const chemin = new URL(this.page.url()).pathname;
  const utilisateurConnecte = await this.page.getAttribute('meta[name="user-login"]', 'content').catch(() => '');
  if (chemin.startsWith('/sessions/')) {
    this.attach(`Étape de vérification atteinte : ${chemin}`, 'text/plain');
  } else if (utilisateurConnecte) {
    this.attach('Connexion complète sans étape de vérification supplémentaire.', 'text/plain');
  } else {
    throw new Error(`Étape inattendue après acceptation : ${chemin}`);
  }
});

// --- Refus ------------------------------------------------------------------

Then('GitHub refuse la connexion avec le message {string}', async function (message) {
  await gh.verifierAbsenceProtection(this.page);
  assert.equal(this.requetesSession.length, 1, 'Le formulaire aurait dû être envoyé une fois à GitHub');
  const alerte = this.page.getByRole('alert').filter({ hasText: message, visible: true }).first();
  const visible = await alerte.waitFor({ state: 'visible', timeout: 10 * 1000 }).then(() => true, () => false);
  assert.ok(visible, `Message "${message}" absent. Alertes visibles : ${JSON.stringify(await gh.alertesVisibles(this.page))}`);
});

Then('je reste sur la page de connexion GitHub', async function () {
  const url = new URL(this.page.url());
  assert.equal(url.host, gh.HOTE);
  assert.ok(gh.CHEMINS_CONNEXION.includes(url.pathname), `Page inattendue : ${url.pathname}`);
  await gh.champUtilisateur(this.page).waitFor({ state: 'visible' });
  assert.equal(await this.page.getAttribute('meta[name="user-login"]', 'content'), '', 'Un utilisateur est connecté');
});

// --- Formulaire incomplet ---------------------------------------------------

Then("le formulaire n'est pas envoyé à GitHub", function () {
  assert.equal(this.requetesSession.length, 0, 'Une requête POST /session a été envoyée');
  assert.equal(new URL(this.page.url()).pathname, '/login');
});

Then('les champs obligatoires non remplis sont {string}', async function (liste) {
  const attendus = liste.split(',').map((nom) => {
    const id = gh.NOMS_CHAMPS[nom.trim()];
    if (!id) throw new Error(`Champ inconnu : "${nom.trim()}"`);
    return id;
  });
  const manquants = await this.page.evaluate((ids) => ids.filter((id) => document.getElementById(id).validity.valueMissing), Object.values(gh.NOMS_CHAMPS));
  assert.deepEqual(manquants.sort(), attendus.sort());
});
