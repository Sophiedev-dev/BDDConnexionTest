// Ouvre le rapport HTML de Cucumber dans le navigateur par défaut.
// Avec des arguments, lance d'abord Cucumber avec ces arguments, puis ouvre le rapport
// même si des tests échouent (le code de sortie de Cucumber est conservé).
const { spawnSync, spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const racine = path.resolve(__dirname, '..');
const rapport = path.join(racine, 'reports', 'cucumber-report.html');

let codeSortie = 0;
const argumentsCucumber = process.argv.slice(2);
if (argumentsCucumber.length) {
  // Chemin direct : le paquet n'exporte pas son fichier bin/ via require.resolve.
  const cucumber = path.join(racine, 'node_modules', '@cucumber', 'cucumber', 'bin', 'cucumber.js');
  codeSortie = spawnSync(process.execPath, [cucumber, ...argumentsCucumber], { cwd: racine, stdio: 'inherit' }).status ?? 1;
}

if (!fs.existsSync(rapport)) {
  console.error(`Rapport introuvable : ${rapport}. Lancez d'abord les tests.`);
  process.exit(1);
}

const [commande, args] =
  process.platform === 'win32' ? ['cmd', ['/c', 'start', '""', rapport]]
  : process.platform === 'darwin' ? ['open', [rapport]]
  : ['xdg-open', [rapport]];
spawn(commande, args, { stdio: 'ignore', detached: true }).unref();
console.log(`Rapport ouvert : ${rapport}`);
process.exit(codeSortie);
