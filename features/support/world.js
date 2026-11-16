// World personnalisé : contexte propre à chaque scénario, partagé entre ses étapes via `this`.
// Cucumber crée une nouvelle instance par scénario, ce qui isole les scénarios entre eux.
const { World, setWorldConstructor, setDefaultTimeout } = require('@cucumber/cucumber');
const { chromium } = require('playwright');

// Le délai par défaut de Cucumber (5 s) est trop court pour lancer un navigateur.
setDefaultTimeout(30 * 1000);

class PlaywrightWorld extends World {
  constructor(options) {
    super(options);
    this.browser = null;
    this.context = null;
    this.page = null;
  }

  // Ouvre Chromium, puis un contexte isolé (cookies, stockage) et une page.
  async ouvrirNavigateur() {
    const { headless = true, slowMo = 0 } = this.parameters;
    this.browser = await chromium.launch({ headless, slowMo });
    // Langue fixée : les libellés utilisés par les étapes ont été observés en français.
    this.context = await this.browser.newContext({ locale: 'fr-FR' });
    this.page = await this.context.newPage();
  }

  // Ouvre le Chrome installé sur le profil dédié (session ouverte manuellement au préalable).
  // Contexte persistant : navigateur et contexte ne font qu'un, `this.browser` reste vide.
  async ouvrirProfilChrome(dossier) {
    try {
      this.context = await chromium.launchPersistentContext(dossier, {
        channel: 'chrome',
        headless: false,
        locale: 'fr-FR',
      });
    } catch (erreur) {
      throw new Error(
        `Impossible d'ouvrir le profil Chrome "${dossier}". Fermez toutes ses fenêtres Chrome puis relancez.\n${erreur.message}`,
      );
    }
    this.page = this.context.pages()[0] ?? (await this.context.newPage());
  }

  // Ferme page, contexte puis navigateur ; chaque fermeture est tentée même si la précédente échoue.
  async fermerNavigateur() {
    for (const cle of ['page', 'context', 'browser']) {
      try {
        await this[cle]?.close();
      } catch (erreur) {
        console.warn(`Fermeture de "${cle}" impossible : ${erreur.message}`);
      } finally {
        this[cle] = null;
      }
    }
  }
}

setWorldConstructor(PlaywrightWorld);
