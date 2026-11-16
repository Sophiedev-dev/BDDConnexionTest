// Ouvre Chrome normalement (SANS Playwright ni automatisation) sur le profil dédié aux tests,
// pour que l'utilisateur s'y connecte lui-même à ChatGPT. Aucune donnée n'est lue ni enregistrée ici.
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { verifierEmplacementProfil } = require('../features/support/profil-chrome');

const candidats = [
  process.env.CHROME_EXE,
  path.join(process.env.ProgramFiles || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
  path.join(process.env['ProgramFiles(x86)'] || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
  path.join(process.env.LOCALAPPDATA || '', 'Google', 'Chrome', 'Application', 'chrome.exe'),
].filter(Boolean);

const chrome = candidats.find((p) => fs.existsSync(p));
if (!chrome) {
  console.error('Chrome introuvable. Indiquez son chemin avec la variable CHROME_EXE.');
  process.exit(1);
}

const profil = verifierEmplacementProfil();
fs.mkdirSync(profil, { recursive: true });

spawn(chrome, [`--user-data-dir=${profil}`, 'https://chatgpt.com/'], { detached: true, stdio: 'ignore' }).unref();

console.log(`Chrome ouvert sur le profil de test : ${profil}`);
console.log('1. Connectez-vous à ChatGPT dans cette fenêtre (Google ou autre méthode).');
console.log('2. Vérifiez que votre espace ChatGPT s’affiche.');
console.log('3. Fermez TOUTES les fenêtres de ce Chrome avant de lancer : npm run test:manuel');
