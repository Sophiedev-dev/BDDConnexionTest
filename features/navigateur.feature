# language: fr
@technique @navigateur
Fonctionnalité: Vérification de l'intégration Playwright
  Afin de m'assurer que Cucumber pilote correctement le navigateur
  En tant qu'étudiant testeur
  Je veux ouvrir une page locale contrôlée et vérifier son contenu

  Scénario: Ouverture d'une page locale dans Chromium
    Étant donné que j'ouvre la page locale "page-technique.html"
    Alors le titre de la page est "Page technique Playwright"
    Et le titre principal "Playwright est opérationnel" est visible
