// Connaissance du site https://chatgpt.com/, issue de l'observation du site réel
// (13/11/2026, Chromium Playwright, interface fr-FR, session non connectée).
// Aucun sélecteur n'est supposé : chaque libellé ci-dessous a été relevé sur le site.

const URL_ACCUEIL = 'https://chatgpt.com/';
const HOTE_OFFICIEL = 'chatgpt.com';
const TITRE_MODALE_CONNEXION = 'Connectez-vous ou inscrivez-vous';
const ORIGINE_VERIFICATION_ANTI_ROBOT = 'https://challenges.cloudflare.com';

// Méthodes menant à un fournisseur externe, avec l'hôte de destination observé.
// Téléphone et e-mail exigent une saisie dès l'étape suivante : ils sont listés mais pas sélectionnés.
const DESTINATIONS = {
  Google: 'accounts.google.com',
  Apple: 'appleid.apple.com',
};

const DELAI_VERIFICATION_MS = Number(process.env.DELAI_VERIFICATION_MS) || 3 * 60 * 1000;

const boutonSeConnecter = (page) => page.getByRole('button', { name: 'Se connecter', exact: true }).first();

const modaleConnexion = (page) =>
  page.getByRole('dialog').filter({ has: page.getByRole('heading', { name: TITRE_MODALE_CONNEXION }) });

// Méthodes réellement affichées dans la modale (libellés « Continuer avec … » + champ e-mail).
async function methodesProposees(page) {
  const modale = modaleConnexion(page);
  const libelles = [
    ...(await modale.getByRole('link', { name: /^Continuer avec / }).allInnerTexts()),
    ...(await modale.getByRole('button', { name: /^Continuer avec / }).allInnerTexts()),
  ];
  const methodes = libelles.map((t) => t.trim().replace(/^Continuer avec (un |une )?/, ''));
  if (await modale.getByPlaceholder('Adresse e-mail').count()) methodes.push('adresse e-mail');
  return methodes;
}

// Signes observés de la page de vérification : titre « Un instant… » (affiché avant même le widget),
// conteneur « cf-chl-widget-* » et cadre servi par challenges.cloudflare.com.
const TITRE_VERIFICATION_ANTI_ROBOT = 'Un instant…';

async function verificationAntiRobotPresente(page) {
  if (page.frames().some((f) => f.url().startsWith(ORIGINE_VERIFICATION_ANTI_ROBOT))) return true;
  if ((await page.title().catch(() => '')) === TITRE_VERIFICATION_ANTI_ROBOT) return true;
  return (await page.locator('[id^="cf-chl-widget-"]').count().catch(() => 0)) > 0;
}

// La vérification anti-robot n'est jamais contournée : elle est résolue par l'utilisateur.
async function attendreVerificationHumaine(world) {
  const { page } = world;
  if (!(await verificationAntiRobotPresente(page))) return;
  if (world.parameters.headless) {
    throw new Error(
      'Vérification anti-robot Cloudflare affichée : elle doit être résolue par un humain. ' +
        'Relancez en mode visible (npm run test:headed) et résolvez-la dans le navigateur.',
    );
  }
  console.log('\n>>> Vérification anti-robot affichée : résolvez-la manuellement dans le navigateur.');
  const limite = Date.now() + DELAI_VERIFICATION_MS;
  while (await verificationAntiRobotPresente(page)) {
    if (Date.now() > limite) throw new Error('Vérification anti-robot non résolue dans le délai imparti.');
    await page.waitForTimeout(1000);
  }
  await page.waitForLoadState('domcontentloaded');
}

// Après une navigation vers chatgpt.com : attend que la vraie page ChatGPT soit affichée
// (titre contenant « ChatGPT »), en passant par la vérification anti-robot si elle apparaît.
// Échoue explicitement au lieu d'abandonner en silence.
async function attendrePageChatGPT(world) {
  const { page } = world;
  const DELAI_AFFICHAGE_MS = 30 * 1000;
  let limite = Date.now() + DELAI_AFFICHAGE_MS;
  for (;;) {
    if (await verificationAntiRobotPresente(page)) {
      await attendreVerificationHumaine(world);
      // Le temps passé par l'humain sur la vérification ne doit pas consommer le délai d'affichage :
      // après résolution, Cloudflare recharge la page (titre vide, logo seul) avant d'afficher ChatGPT.
      limite = Date.now() + DELAI_AFFICHAGE_MS;
      continue;
    }
    const titre = await page.title().catch(() => '');
    if (/ChatGPT/.test(titre)) return;
    if (Date.now() > limite) throw new Error(`La page ChatGPT ne s'affiche pas (titre actuel : "${titre}")`);
    await page.waitForTimeout(500);
  }
}

async function ouvrirAccueil(world) {
  await world.page.goto(URL_ACCUEIL, { waitUntil: 'domcontentloaded', timeout: 60 * 1000 });
  await attendrePageChatGPT(world);
}

// INDICATEUR FIABLE DE L'ESPACE AUTHENTIFIÉ (scénarios 4 et 5) :
// la session que chatgpt.com expose à sa propre page contient un utilisateur.
// Seul un booléen sort de la page : aucun jeton ni donnée personnelle n'est lu par le test.
async function estAuthentifie(page) {
  if (new URL(page.url()).host !== HOTE_OFFICIEL) {
    throw new Error(`Indicateur lisible uniquement sur ${HOTE_OFFICIEL} (page actuelle : ${page.url()})`);
  }
  const resultat = await page.evaluate(async () => {
    const reponse = await fetch('/api/auth/session', { credentials: 'same-origin' });
    const type = reponse.headers.get('content-type') || '';
    if (!reponse.ok || !type.includes('application/json')) return { lisible: false, statut: reponse.status };
    const session = await reponse.json();
    return { lisible: true, authentifie: Boolean(session && session.user) };
  });
  if (!resultat.lisible) throw new Error(`Session ChatGPT illisible (HTTP ${resultat.statut})`);
  return resultat.authentifie;
}

// Même indicateur, lu SANS naviguer : requête HTTP portant les cookies du contexte du navigateur.
// Une réponse qui n'est pas un JSON valide (ex. page Cloudflare) n'est jamais prise pour une preuve.
async function sessionServeurAuthentifiee(context) {
  const reponse = await context.request.get(`${URL_ACCUEIL}api/auth/session`, { failOnStatusCode: false });
  const type = reponse.headers()['content-type'] || '';
  if (!reponse.ok() || !type.includes('application/json')) {
    throw new Error(`Session ChatGPT illisible (HTTP ${reponse.status()}, ${type || 'type inconnu'}) : aucune conclusion possible`);
  }
  const session = await reponse.json();
  return Boolean(session && session.user);
}

// Cookie de session observé sur un compte connecté (découpé en .0, .1…) ; seuls les noms sont lus.
const PREFIXE_COOKIE_SESSION = '__Secure-next-auth.session-token';

async function cookiesDeSession(context) {
  return (await context.cookies(URL_ACCUEIL)).map((c) => c.name).filter((nom) => nom.startsWith(PREFIXE_COOKIE_SESSION));
}

module.exports = {
  sessionServeurAuthentifiee,
  cookiesDeSession,
  URL_ACCUEIL,
  HOTE_OFFICIEL,
  DESTINATIONS,
  DELAI_VERIFICATION_MS,
  boutonSeConnecter,
  modaleConnexion,
  methodesProposees,
  verificationAntiRobotPresente,
  attendreVerificationHumaine,
  attendrePageChatGPT,
  ouvrirAccueil,
  estAuthentifie,
};
