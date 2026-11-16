# language: fr
@chatgpt @authentification @manuel @profil-chrome
Fonctionnalité: Accès à l'espace authentifié avec une session ouverte manuellement
  Afin de vérifier la connexion réelle à mon compte ChatGPT
  En tant qu'utilisateur possédant un compte
  Je veux constater que mon espace authentifié est accessible après m'être connecté moi-même

  Google refuse toute connexion depuis un navigateur automatisé
  (« Ce navigateur ou cette application ne sont peut-être pas sécurisés »).
  La connexion est donc effectuée manuellement, sans Playwright, dans un profil Chrome dédié
  (npm run profil:connexion) ; ce scénario réutilise ensuite ce profil pour la vérifier.
  Aucune donnée sensible n'est saisie ni lue par le test.

  Scénario: Connexion réussie après les opérations manuelles de l'utilisateur
    Étant donné que le profil Chrome de test contient une session ouverte manuellement
    Quand j'ouvre le site officiel de ChatGPT
    Alors un indicateur fiable de l'espace authentifié de ChatGPT est visible
    Et l'accès à la connexion n'est plus proposé
