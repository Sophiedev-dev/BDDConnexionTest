# language: fr
@technique
Fonctionnalité: Vérification de la configuration Cucumber
  Afin de m'assurer que l'outillage BDD est opérationnel
  En tant qu'étudiant testeur
  Je veux exécuter un scénario technique indépendant de toute application

  Scénario: Les étapes Gherkin sont reliées à leurs définitions JavaScript
    Étant donné un compteur initialisé à 0
    Quand j'ajoute 2 au compteur
    Et j'ajoute 3 au compteur
    Alors le compteur vaut 5
    Et le paramètre "headless" du World est défini
