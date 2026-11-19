# Kropki — Arena sombre

## Direction
Refonte de la version existante : interface de plateforme de jeu inspirée de la disposition de Chess.com, sans logo, textes ou assets copiés. Identité propre Kropki. L’utilisateur a validé de commencer par le design ; aucune fonction en ligne ajoutée à cette étape.

## Palette et typographie
Fond #262522, menu #1f1e1b, panneaux #302f2b, traits #45443e. Texte #f0eee8, texte secondaire #a7a59b. Vert action #9bc35d (ombre #648532), plateau vert doux #c2d1a8 / #b8c89d. Points bleus #406be1 et rouges #e46a58 conservés. Corps et titres Poppins, serif seulement dans l’exemple de règles.

## Composition
Menu latéral fixe de 184px à gauche, avec navigation fonctionnelle Jouer, Ordinateur, À deux et Règles. En-tête compact de partie. Centre : plateau quadrillé Kropki avec coordonnées et bandeaux des joueurs au-dessus et dessous. À droite : panneau scores, modes, historique réel des coups, commandes de partie. Aucun faux classement, compte ou nombre de joueurs.
Mobile : menu compact en haut, plateau puis panneau empilé. Cibles de commandes de 40px minimum. Contraste lisible, mouvements subtils, focus visible.

## Fonctionnalités préservées
Moteur lib/kropki.ts inchangé : captures, libérations, deux modes, deux niveaux, trois tailles, fin, annulation, sauvegarde locale kropki-v1. Dialogues de règles/nouvelle partie/fin restylés. Historique lecture seule, coordonnées réelles.

## Fichiers
packages/web/src/web/pages/game.tsx, styles.css, index.html, public/kropki-icon.svg. Aucun changement API, DB, auth ou moteur.

## Lot pédagogique et retour visuel
- Captures : tracé progressif des nouvelles frontières, pulsation des points capturés/libérés et notification du delta réel de score (+N ou −N). Animation désactivée si réduction des mouvements demandée.
- Relecture : plateau et scores historiques, boutons début/précédent/lecture/suivant/fin, curseur, retour à la partie en cours. Lecture seule ; suspend l’ordinateur, ne remplace jamais la sauvegarde.
- Tutoriel : panneau/plateau dédié 7×7, étapes guidées avec intersections mises en évidence ; vraie capture diagonale avec le moteur existant. Partie personnelle conservée ; accessible depuis navigation, règles et conseil.
- Nouveaux composants : game-board.tsx, replay-controls.tsx, tutorial.tsx ; utilitaires et tests feedback dans lib/game-feedback.ts. Moteur kropki.ts inchangé, pas de nouvelles API ni données serveur.

## Cadences et résultats (priorité validée)
- Correction approuvée : durée totale commune de 1, 3, 5, 7, 10 ou 30 minutes ; 1 minute par défaut. Un unique compte à rebours au-dessus du plateau, vert actif, ambre/rouge sous 10 secondes. Aucun budget par joueur, aucun ajout lors des tours.
- À zéro : fin immédiate, victoire au nombre de points capturés, égalité si scores identiques (pas de défaite automatique au temps). Plateau plein : même règle de score. Abandon : victoire adverse même si l’abandonnant mène.
- Temps réel écoulé calculé avec horodatages, pas par simple décrément ; expiration contrôlée avant chaque coup. Sauvegarde version 2 du chronomètre commun et du résultat ; fermer/recharger n’efface pas le temps écoulé. Migration des anciennes pendules : durée moins temps consommé par les deux joueurs.
- Relecture et tutoriel locaux : chronomètre mis en pause avec explication explicite ; temps au coup affiché distingué du temps réel en pause. Aucun changement des scores ni restauration de temps après une annulation. Les fenêtres de règles et de confirmation continuent le décompte.
- Match/horloge/résultat dans lib/timed-game.ts, tests unitaires ; moteur géométrique kropki.ts conservé.

## Socle en ligne
Identité sombre/verte conservée. Connexion : composition asymétrique, manifeste à gauche et formulaire/onglets à droite. Lobby : création avec six durées communes et liste de vraies parties. Salle : plateau et chronomètre commun à gauche, invitation/prêts/actions à droite. En mobile les sections s'empilent ; cibles tactiles 40px, formulaires lisibles et erreurs en français. Les données serveur sont explicites ; aucune fausse présence, Elo ou statistiques.

## Refonte claire — direction approuvée novembre 2026
Cette direction remplace l'identité sombre ci-dessus. Référence fournie : fond clair quadrillé, bleu vif, titres foncés, espace généreux et dashboard avec navigation. Aucun texte ni marque de la référence repris.
Palette : blanc cassé #f8faff, blanc #ffffff, texte bleu nuit #14213d, cobalt #255bfa, corail #f26367, jaune #ffd569. Texte secondaire #617089 et bordures #dce4f1. Poppins conservée, titres plus grands et contrastés. Bandeau de jeu clair avec grille légère ; navigation blanche et boutons cobalt, cartes statistiques pastel et plateau ivoire clair avec grille bleu-gris. Animations sobres et réduction des mouvements respectée.
La refonte couvre le jeu local, les comptes, les salles, le salon classé et les statistiques. Elo et résultats réels uniquement, invitations non classées ; aucun faux joueur. Navigation responsive, plateau sans débordement et formulaires/cibles tactiles lisibles.

## Lot entraînement — approuvé
Page publique /entrainement, dans la même coque claire. En-tête « Un coup. Un déclic. », progression locale et onglets Exercices / Plateau libre. Six positions composées progressives (capture, défense, libération), plateau à gauche et atelier pédagogique à droite. Accent jaune pour les indices, cobalt pour la progression, corail pour les menaces. Aucun chronomètre, aucune influence sur l'Elo. Indices explicites calculés, solutions démontrées par le moteur et analyse tactique limitée à un coup, sans promesse de meilleur jeu absolu. Sauvegardes d'entraînement séparées de kropki-v1. Navigation accessible depuis le jeu local et les écrans en ligne.

## Habillage Arène anime — approuvé
Référence HTML utilisateur : plateau bleu nuit, Néon/Feu/Glace/Foudre/Ténèbres, douze scellements et avatars ninja/samouraï/mage/photo. Intégration limitée aux matchs locaux et en ligne. Coque claire et couleurs d'identité bleu/rouge conservées ; effets superposés non interactifs, de courte durée, réduction des mouvements et sons coupables. Aucun gel du match, multiplicateur, changement moteur/serveur/Elo. Préférences/avatar locaux, adversaire non usurpé. Entraînement/tutoriel gardent leur rendu actuel.

## Départ du chrono — approuvé
Cadences 3/5/7/10/30, défaut 3. Attente du premier coup légal affichée explicitement ; prêts en ligne conservés. Délai classé 90 s couvre prêts et premier coup. Sauvegardes actives anciennes conservées, y compris 1 min.

## Audit de robustesse
Design existant conservé. Messages de sauvegarde et erreurs accessibles via role/status ; page introuvable avec retour local/en ligne. Aucun nouveau thème ou changement de règles.

## Performance — lot approuvé
Pages secondaires chargées à la demande avec état de chargement accessible. Sauvegarde immédiate sur les changements de jeu/état, sans sérialisation à chaque tic ; horodatage conservé pour le rechargement. Design, règles et serveur inchangés.

## Sensations de jeu — référence « The World », lot approuvé
Commandes sélection/aperçu/confirmation par défaut, placement direct optionnel. Bandeau de tour bleu/corail, point fantôme lumineux et aperçu exact du prochain coup par le moteur. Confirmation et annulation tactiles, clavier natif. Animation de pose courte, sans retarder le prochain tour ; effets de capture existants conservés, mouvement réduit respecté. Tutoriel enseigne la confirmation, progression d'entraînement conservée. Aucun personnage/décor copié, pouvoir, mana ou score fictif. API/Elo/règles inchangés.
