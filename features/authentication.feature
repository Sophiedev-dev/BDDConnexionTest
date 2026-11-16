# language: fr
@chatgpt @authentification @navigateur
Fonctionnalité: Connexion au site officiel de ChatGPT
  Afin d'accéder à mon espace personnel ChatGPT
  En tant qu'utilisateur possédant un compte
  Je veux me connecter au site officiel par une méthode de connexion réellement proposée

  Règles :
    - Aucune donnée sensible (identifiant, mot de passe, code de vérification) n'est écrite dans les tests.
    - Les opérations sensibles sont effectuées manuellement par l'utilisateur dans le navigateur.
    - Les méthodes de connexion ne sont jamais supposées : elles sont observées sur le site.
    - Une connexion n'est réussie que si un indicateur fiable de l'espace authentifié est visible ;
      la seule disparition de l'accès à la connexion ne constitue pas une preuve suffisante.

  Contexte:
    Étant donné que le navigateur ne possède aucune session ChatGPT active

  Scénario: Accéder au site officiel de ChatGPT
    Quand j'ouvre le site officiel de ChatGPT
    Alors la page d'accueil de ChatGPT s'affiche
    Et l'adresse de la page appartient au domaine officiel de ChatGPT
    Et un accès à la connexion est proposé

  Scénario: Accéder à la page de connexion
    Étant donné que je suis sur la page d'accueil de ChatGPT
    Quand je demande à me connecter
    Alors la page de connexion s'affiche
    Et au moins une méthode de connexion est proposée
    Et les méthodes de connexion réellement proposées sont consignées dans le rapport

  Scénario: Démarrer le processus de connexion avec une méthode proposée
    Étant donné que je suis sur la page de connexion de ChatGPT
    Quand je sélectionne la méthode de connexion choisie pour le test parmi celles proposées
    Alors le processus de connexion démarre
    Et la page correspondant à la méthode choisie s'affiche

  Scénario: Connexion non aboutie après interruption volontaire du processus
    Étant donné que je suis sur la page de connexion de ChatGPT
    Et que j'ai démarré le processus de connexion avec une méthode proposée
    Quand j'interromps volontairement le processus avant toute saisie ou validation d'informations
    Alors le serveur ChatGPT ne reconnaît aucune session authentifiée pour ce navigateur
    Et aucun cookie de session ChatGPT n'est présent dans le navigateur
