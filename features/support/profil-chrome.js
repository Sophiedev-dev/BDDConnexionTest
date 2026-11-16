// Profil Chrome dédié au scénario de session authentifiée.
// Il contient des cookies de session : il doit rester hors du projet et hors de OneDrive.
const path = require('node:path');
const os = require('node:os');

const RACINE_PROJET = path.resolve(__dirname, '..', '..');

const DOSSIER_PROFIL_CHROME = path.resolve(
  process.env.CHROME_PROFIL_TESTS || path.join(process.env.LOCALAPPDATA || os.homedir(), 'bdd-chatgpt-profil'),
);

const estDans = (dossier, parent) => {
  const relatif = path.relative(parent.toLowerCase(), dossier.toLowerCase());
  return relatif === '' || (!relatif.startsWith('..') && !path.isAbsolute(relatif));
};

// Refuse tout emplacement versionné ou synchronisé dans le cloud.
function verifierEmplacementProfil() {
  const interdits = [RACINE_PROJET, process.env.OneDrive, process.env.OneDriveConsumer, process.env.OneDriveCommercial]
    .filter(Boolean)
    .map((d) => path.resolve(d));
  const parent = interdits.find((d) => estDans(DOSSIER_PROFIL_CHROME, d));
  if (parent) {
    throw new Error(`Profil Chrome refusé : "${DOSSIER_PROFIL_CHROME}" est dans "${parent}" (projet ou OneDrive).`);
  }
  return DOSSIER_PROFIL_CHROME;
}

module.exports = { DOSSIER_PROFIL_CHROME, verifierEmplacementProfil };
