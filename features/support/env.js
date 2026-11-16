// Charge le fichier .env local (non versionné) s'il existe, avec le chargeur natif de Node.js.
// Les variables déjà définies dans l'environnement ne sont pas écrasées.
const fs = require('node:fs');
const path = require('node:path');

const FICHIER_ENV = path.resolve(__dirname, '..', '..', '.env');
if (fs.existsSync(FICHIER_ENV)) process.loadEnvFile(FICHIER_ENV);
