// Configuration Cucumber.js (profils sélectionnables avec --profile <nom>)
const common = {
  paths: ['features/**/*.feature'],
  require: ['features/support/**/*.js', 'features/step_definitions/**/*.js'],
  format: ['progress', 'html:reports/cucumber-report.html'],
  formatOptions: { snippetInterface: 'async-await' },
  worldParameters: { headless: true },
  // Le scénario @manuel attend une connexion humaine : il a son propre profil.
  tags: 'not @manuel',
};

module.exports = {
  default: common,
  // Navigateur visible, ralenti de 250 ms par action pour observer les interactions.
  headed: { ...common, worldParameters: { headless: false, slowMo: 250 } },
  // Connexion manuelle (scénario @manuel) : navigateur visible, sans ralenti.
  manuel: { ...common, tags: '@manuel', worldParameters: { headless: false } },
  // Vérifie les correspondances Gherkin <-> définitions sans exécuter le code (tous les scénarios).
  // Pas de rapport HTML pour ne pas écraser celui de la dernière exécution réelle.
  'dry-run': { ...common, tags: '', dryRun: true, format: ['progress'] },
};
