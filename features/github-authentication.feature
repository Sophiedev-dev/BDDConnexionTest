# language: fr
@github @navigateur
Fonctionnalité: Authentification sur le site réel GitHub
  Afin de vérifier l'automatisation de la connexion sur un véritable site
  En tant qu'utilisateur possédant un compte GitHub
  Je veux soumettre le formulaire de connexion et constater la réponse réelle de GitHub

  Règles :
    - Les identifiants proviennent de variables d'environnement, jamais du code ni de ce fichier.
    - Les colonnes « utilisateur » et « mot_de_passe » désignent des rôles, pas des valeurs.
    - Aucun mot de passe incorrect n'est soumis sur le compte personnel.
    - Une protection anti-robot (CAPTCHA, blocage) est signalée et fait échouer le test, sans contournement.
    - Le succès de la connexion valide signifie que GitHub accepte les identifiants et affiche
      l'étape de vérification suivante (2FA ou vérification de l'appareil).

  Contexte:
    Étant donné que j'ouvre la page de connexion GitHub

  Scénario: Ouverture de la page de connexion GitHub
    Alors la page de connexion GitHub est affichée
    Et les champs "Username or email address" et "Password" sont visibles et vides
    Et le bouton "Sign in" est visible

  @identifiants-reels
  Scénario: Connexion avec des identifiants valides
    Quand je soumets le formulaire de connexion avec le nom d'utilisateur "mon compte" et le mot de passe "valide"
    Alors GitHub accepte les identifiants
    Et l'étape de vérification suivante est affichée

  Plan du Scénario: Refus d'une connexion avec des identifiants incorrects (<cas>)
    Quand je soumets le formulaire de connexion avec le nom d'utilisateur "<utilisateur>" et le mot de passe "<mot_de_passe>"
    Alors GitHub refuse la connexion avec le message "Incorrect username or password."
    Et je reste sur la page de connexion GitHub

    Exemples:
      | cas                          | utilisateur    | mot_de_passe |
      | nom d'utilisateur inexistant | inexistant     | aléatoire    |

  Plan du Scénario: Soumission d'un formulaire de connexion incomplet (<cas>)
    Quand je soumets le formulaire de connexion avec le nom d'utilisateur "<utilisateur>" et le mot de passe "<mot_de_passe>"
    Alors le formulaire n'est pas envoyé à GitHub
    Et les champs obligatoires non remplis sont "<champs_manquants>"
    Et je reste sur la page de connexion GitHub

    Exemples:
      | cas                         | utilisateur | mot_de_passe | champs_manquants                  |
      | aucun champ rempli          | vide        | vide         | nom d'utilisateur, mot de passe   |
      | uniquement le nom           | inexistant  | vide         | mot de passe                      |
      | uniquement le mot de passe  | vide        | aléatoire    | nom d'utilisateur                 |
