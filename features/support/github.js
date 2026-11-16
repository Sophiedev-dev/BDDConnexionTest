// Connaissance du site https://github.com/login, issue de l'observation du site réel
// (13/11/2026, Chromium Playwright). La page est en anglais quelle que soit la langue du navigateur.
// Observé : champs « Username or email address » et « Password » (required), bouton « Sign in »,
// formulaire POST /session, refus → URL /session + alerte « Incorrect username or password. »,
// formulaire incomplet → bloqué par la validation HTML5, aucune requête POST /session.
// Un champ piège anti-robot caché (« required_field_… ») existe : il n'est JAMAIS rempli.
const crypto = require('node:crypto');

const URL_CONNEXION = 'https://github.com/login';
const HOTE = 'github.com';
const MESSAGE_REFUS = 'Incorrect username or password.';
const CHEMINS_CONNEXION = ['/login', '/session'];

const champUtilisateur = (page) => page.getByLabel('Username or email address', { exact: true });
const champMotDePasse = (page) => page.getByLabel('Password', { exact: true });
const boutonConnexion = (page) => page.getByRole('button', { name: 'Sign in', exact: true });
// La page contient plusieurs formulaires POST /session (passkeys…) : on vise celui du champ de connexion.
const formulaireValide = (page) => champUtilisateur(page).evaluate((champ) => champ.form.checkValidity());

const NOMS_CHAMPS = { "nom d'utilisateur": 'login_field', 'mot de passe': 'password' };

// --- Données de test (aucune valeur réelle dans le code ni dans le Gherkin) ---

const motDePasseAleatoire = () => `bdd-${crypto.randomBytes(18).toString('base64url')}`;

async function compteExiste(nom) {
  const reponse = await fetch(`https://api.github.com/users/${encodeURIComponent(nom)}`, {
    headers: { 'User-Agent': 'bdd-authentication-tests' },
  });
  if (reponse.status === 200) return true;
  if (reponse.status === 404) return false;
  throw new Error(`API GitHub indisponible (HTTP ${reponse.status}) : existence du compte non vérifiable`);
}

// Nom d'utilisateur généré, dont l'inexistence est vérifiée auprès de l'API publique de GitHub.
async function nomInexistant() {
  const nom = `bdd-inexistant-${crypto.randomBytes(6).toString('hex')}`;
  if (await compteExiste(nom)) throw new Error(`Le nom généré "${nom}" existe déjà`);
  return nom;
}

// --- Protections : signalées, jamais contournées ---

async function protectionDetectee(page) {
  if (/captcha/i.test(page.url())) return `CAPTCHA (${new URL(page.url()).pathname})`;
  const cadre = page.frames().find((f) => /captcha/i.test(f.url()));
  if (cadre) return `CAPTCHA (cadre ${new URL(cadre.url()).host})`;
  return null;
}

async function verifierAbsenceProtection(page) {
  const protection = await protectionDetectee(page);
  if (protection) {
    throw new Error(`Protection anti-robot GitHub détectée : ${protection}. Test interrompu, aucun contournement.`);
  }
}

const alertesVisibles = async (page) =>
  (await page.getByRole('alert').filter({ visible: true }).allInnerTexts()).map((t) => t.trim()).filter(Boolean);

// Remplit un champ sans jamais laisser la valeur apparaître dans un message d'erreur.
async function remplirSansDivulguer(locator, valeur) {
  try {
    await locator.fill(valeur);
  } catch (erreur) {
    throw new Error(`Impossible de remplir le champ : ${erreur.message.split(valeur).join('***').split('\n')[0]}`);
  }
}

module.exports = {
  URL_CONNEXION,
  HOTE,
  MESSAGE_REFUS,
  CHEMINS_CONNEXION,
  NOMS_CHAMPS,
  champUtilisateur,
  champMotDePasse,
  boutonConnexion,
  formulaireValide,
  motDePasseAleatoire,
  compteExiste,
  nomInexistant,
  protectionDetectee,
  verifierAbsenceProtection,
  alertesVisibles,
  remplirSansDivulguer,
};
