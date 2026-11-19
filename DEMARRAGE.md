# Kropki — habillage anime, entraînement et duels classés

## Lancer le projet

Prérequis : Bun installé et une base SQLite/Turso configurée. À la racine du dossier :

```sh
bun install
cp .env.template .env
# Renseigner .env avant de continuer (voir ci-dessous).
bun run --cwd packages/web db:push
bun run dev
```

Ouvrir http://localhost:4200. Les modes locaux n'exigent pas de compte utilisateur, mais le serveur de cette version charge aussi la configuration de base de données et d'authentification au démarrage. Une copie du code sans configuration n'est donc pas un serveur prêt à lancer. Aucune clé privée n'est fournie dans cette archive.

### Configuration à la racine uniquement

- `DATABASE_URL` et `DATABASE_AUTH_TOKEN` : connexion SQLite/Turso. `db:push` crée les tables d'authentification, `kropki_private_game`, `kropki_rating`, `kropki_queue` et `kropki_rating_result` ; vérifier les changements proposés avant d'utiliser une base existante.
- `BETTER_AUTH_SECRET` : générer un secret privé aléatoire, par exemple avec `openssl rand -hex 32`.
- `WEBSITE_URL` : origine publique de l'application, ou `http://localhost:4200` pour le développement e-mail.
- `APPLICATION_ID`, `VITE_APPLICATION_ID`, `VITE_RUNABLE_AUTH_ISSUER` : valeurs injectées par Runable pour Google géré. Le broker n'accepte que les origines enregistrées : le parcours Google a été vérifié jusqu'à l'écran Google depuis l'aperçu Runable, pas depuis localhost.
- Les variables de passerelle IA/paiement du template ne sont pas utilisées par le moteur de Kropki.

Ne jamais publier `.env`. Google géré ne demande pas de secret OAuth Google personnel. L'authentification complète avec un vrai compte Google reste à vérifier par son titulaire.

## Cette version

- Interface claire : bleu cobalt, corail et jaune, plateau ivoire et navigation adaptée au mobile.
- Ordinateur ou deux joueurs sur le même appareil ; trois tailles de plateau.
- **Un seul compte à rebours pour la partie entière** : 3, 5, 7, 10 ou 30 minutes (3 minutes par défaut).
- Départ au premier pion légalement placé, aucune remise à zéro au changement de joueur ; réflexion de l'ordinateur comprise.
- À zéro ou sur plateau plein : victoire au score des points capturés, nul en cas d'égalité. Abandon : victoire de l'adversaire, quel que soit le score.
- Tutoriel guidé avec vraie capture, animations de capture/libération, relecture du plateau et des scores.
- Tutoriel et relecture locaux suspendent le temps ; règles et confirmations ne le suspendent pas. Annuler un coup ne rembourse pas le temps.
- Partie et résultat sauvegardés sur cet appareil (`kropki-v1`). Recharger une partie active prend en compte le temps écoulé ; recharger une pause locale reprend le jeu.
- Migration des anciennes pendules individuelles en durée commune, sans effacer le plateau.

## Comptes et parties privées

- Inscription et connexion e-mail/mot de passe ; pseudonyme public, e-mail non exposé dans les salles. Bouton Google via le service géré Runable.
- `/connexion` : compte ; `/en-ligne` : création et historique personnel ; `/partie/:id` : invitation ou salle.
- Un lien aléatoire invite un second compte. Un troisième compte ne peut ni rejoindre ni lire le plateau. Un lien non rejoint expire après 24 heures ; le démarrage exige les deux joueurs prêts avant cette échéance.
- Trois tailles et les cinq durées communes. Le compte à rebours démarre au premier pion légalement placé après les deux confirmations et continue pendant une déconnexion. Pas de pause ni d'annulation en ligne.
- Serveur autoritaire : appartenance à la salle, tour, légalité, expiration, score, abandon. Écritures conditionnées à la révision et déduplication des actions.
- Plateau, coups, horaires et résultat sont persistés en base. Reconnexion par le même compte et le même lien ; synchronisation par interrogation du serveur toutes les secondes, sans WebSocket ni indicateur de présence adverse.
- Relecture après la fin ; sauvegarde locale conservée séparément.
- La vérification d'adresse et l'envoi de récupération de mot de passe ne sont **pas configurés**. Aucun faux envoi d'e-mail n'est affiché.

## Duels classés et statistiques

- `/en-ligne` : recherche automatique d'un adversaire réel connecté. `/statistiques` : classement et bilan personnel.
- Elo initial **1200**, coefficient **K = 32**, classement provisoire pendant les dix premiers résultats. Seuls les duels issus de la recherche automatique modifient l'Elo ; invitations privées et parties locales restent hors classement.
- Deux comptes différents, mêmes taille et durée. La fenêtre Elo débute à ±100 points, s'élargit de 100 points toutes les 15 secondes et atteint au maximum ±1000. Les candidats compatibles sont triés par proximité Elo puis ancienneté de recherche ; couleurs attribuées aléatoirement.
- Une seule recherche ou salle classée active par compte. Recherche interrogée toutes les 3 secondes, bail de présence de 60 secondes. Annuler retire une recherche en attente ; si l'appariement a déjà eu lieu, la salle attribuée est conservée et ouverte.
- Les deux joueurs doivent être prêts et le premier pion doit être placé dans les **90 secondes** suivant l'appariement. Sinon, salle annulée sans résultat ni pénalité Elo. Le compte à rebours commun démarre au premier pion légalement placé ; les règles en ligne restent identiques aux parties privées.
- Résultat, variations Elo des deux participants et journal unique par salle sont enregistrés dans la même transaction. Rechargements et requêtes concurrentes ne comptent pas le résultat deux fois.
- Statistiques : Elo, nombre de résultats classés, victoires/nuls/défaites, taux de victoire et vingt derniers résultats avec adversaire et variation signée. Bilan des parties privées séparé ; aucune donnée locale ou fictive ajoutée.

## Habillage anime des matchs

- Adaptation de la référence HTML fournie, intégrée à React : plateau bleu nuit, styles Néon/Feu/Glace/Foudre/Ténèbres et douze scellements distincts. La coque de l'application reste claire ; points bleus et rouges toujours identifiables.
- Réglages sous le plateau dans **Habillage de l’arène**. Effets déclenchés uniquement par les vrais coups, captures et libérations ; frontières calculées par le moteur, jamais par une seconde logique d'encerclement. Pas d'effet au rechargement, après annulation ni pendant une relecture.
- Sons courts synthétisés via Web Audio, désactivés par défaut et activés par une interaction explicite. Effets désactivables ; animations masquées lorsque le système demande une réduction des mouvements. Compatibilité audio dépendante du navigateur ; pas de musique ambiante ni de son automatique à l'ouverture.
- Avatar ninja, samouraï ou mage dessiné depuis la référence, avec couleurs de cheveux/peau/yeux/vêtement. Photo PNG/JPEG/WebP de moins de 5 Mo, recadrée et réduite à 120 × 120 ; suppression possible. L'avatar apparaît pour le joueur local, jamais comme identité inventée de l'adversaire.
- Préférences et photo dans `kropki-arena-presentation-v1`, sur cet appareil uniquement, sans transmission au serveur. Stockage invalide restauré aux valeurs sûres ; stockage bloqué signalé, réglages valables pour la session.
- Appliqué aux matchs locaux ordinateur/à deux et aux salles privées/classées. Entraînement et tutoriel inchangés. Aucun bonus de territoire, aucune pause/gel lié aux effets, aucun changement de tour, score, chronomètre, résultat ou Elo. Ouvrir les réglages ne suspend pas le temps.

## Entraînement avancé

- `/entrainement`, accessible sans compte : six positions composées progressives de capture, défense et libération, avec le même moteur que les matchs.
- Un coup pour atteindre un objectif réel : toute solution alternative valable est acceptée. La défense est vérifiée contre tous les coups adverses immédiats.
- Indices, cible sur le plateau et solution expliquée. Voir une démonstration ne valide pas l'exercice ; une réussite aidée est distinguée d'une réussite autonome.
- Plateau libre à deux couleurs alternées, sans chronomètre : 9 × 9, 13 × 11 ou 17 × 13. Création explicite d'un nouveau plateau, annulation et effacement ; sauvegarde reconstituée depuis les coups légaux.
- Analyse calculée dans un worker : captures/libérations immédiates, variations de score, menaces adverses et suggestion vérifiée lorsqu'elle existe. Ce n'est ni une analyse stratégique complète ni une garantie de coup optimal.
- Progression et plateau libre uniquement sur cet appareil : `kropki-training-progress-v1` et `kropki-training-sandbox-v1`. Sauvegardes invalides restaurées à un état sûr ; avertissement si le stockage est bloqué. Aucune synchronisation de compte, aucune incidence Elo, aucune nouvelle table ou API.
- La sauvegarde normale `kropki-v1` reste séparée. Une partie normale active continue de compter le temps passé ailleurs, y compris pendant l'entraînement ; le plateau d'entraînement lui-même n'a pas de minuterie.

## Vérification

```sh
bun test packages/web/src/web/lib packages/web/src/api/services
bun run lint
bun run build
```

72 tests unitaires / 811 assertions réussis, lint sans erreur et build réussi (avertissement non bloquant de bundle JS supérieur à 500 ko).

Tests navigateur : régressions locales, chronomètre, tutoriel/relecture, salle privée à deux et refus d'un tiers, duel classé entre deux comptes, recherche/annulation/rechargement avec restauration des critères, capture, abandon malgré l'avance au score, Elo et statistiques des deux participants. Mise en page vérifiée sur six largeurs, sans erreur JavaScript.

Tests API : accès et confidentialité, déduplication, révision périmée, prêts et coups concurrents, expiration au score ; appariement concurrent, une seule salle active, critères distincts, annulation et expiration de recherche, résultat Elo atomique et unique, nul à échéance, absence de pénalité avant démarrage et séparation des résultats privés.

Tests entraînement : six objectifs réels, essais incorrects et démonstrations sans faux succès, indices et progression aidée, sauvegarde/rechargement/annulation, captures et libérations, analyse worker sans résultats périmés, stockage corrompu ou bloqué, isolation du match local, clavier et tactile sur six largeurs. Aucun défaut JavaScript détecté. Retour au salon classé protégé contre la redirection issue d'un ancien appariement en cache.

Tests habillage : douze scellements sur de vraies captures, cinq styles, avatars/couleurs et photo importée/retirée/rechargée, activation/désactivation audio, effets désactivés, nettoyage après annulation, absence d'effet au rechargement, réduction des mouvements, six largeurs et stockage corrompu/bloqué. Captures vérifiées sur les deux écrans d'un duel classé, avatar local seulement. Régressions locales, temps commun, privé, classé et entraînement réussies. Les tests API ont réussi après deux interruptions réseau Turso (`ECONNRESET`), sans changement du serveur.

Les fonctions sociales, compétitions, entraînement adaptatif et analyse stratégique après-match ne sont pas encore implémentés.
Les sauvegardes anciennes déjà démarrées conservent leur temps, même à 1 minute. Annuler tous les coups ne réinitialise jamais le chrono.
