# Performance — 19 novembre 2026

## Lot réalisé
- Connexion, salon, statistiques, entraînement et salle chargés à la demande via React.lazy ; état de chargement accessible. Jeu local conservé dans le chargement initial.
- Sauvegarde locale immédiate sur coup, annulation, pause/reprise, départ, fin, nouvelle partie ou changement de paramètres. Les tics seuls ne déclenchent plus de sérialisation ni d'écriture.
- L'ancre sauvegardée (temps restant + horodatage) permet à la restauration existante de déduire tout le temps écoulé. Aucun changement du format des sauvegardes ni du moteur.

## Mesures de compilation
Avant : JavaScript monolithique 743,20 kB / 217,67 kB gzip.
Après : entrée 505,61 kB / 149,91 kB gzip, plus module partagé préchargé online-shell 135,36 kB / 41,37 kB gzip.
**Chargement initial total : 640,97 kB / 191,28 kB gzip**, soit environ **−13,8 % brut et −12,1 % gzip**. Le module partagé est inclus : la baisse de la seule entrée ne représente pas le gain réel.
Les modules secondaires sont téléchargés lors de leur utilisation ; cette séparation ne réduit pas nécessairement le total si toutes les pages sont visitées. CSS inchangé : 68,89 kB / 14,32 kB gzip. Tailles selon Vite, kB décimaux.

## Vérifications
- 80 tests unitaires / 936 assertions, zéro échec ; lint et compilation réussis.
- Scripts navigateur local, chrono, entraînement et anime réussis : captures, ordinateur, annulation, relecture, tutoriel, pauses, migrations, fin et responsive.
- Compteur d'écritures navigateur : aucune écriture pendant trois secondes de tics actifs sans action ; temps écoulé correctement déduit au rechargement.
- Toutes les routes rendent un écran sans erreur JavaScript, y compris les routes protégées sans session et une URL inconnue. Les duels authentifiés n'ont pas été rejoués dans ce lot ; leurs tests unitaires passent et le serveur est inchangé.
- Le script chrono a été adapté pour contrôler le temps effectif calculé depuis l'ancre, plutôt que supposer une réécriture du stockage à chaque tic.

## Limites
L'entrée dépasse encore 500 kB : avertissement Vite non bloquant conservé. Aucun score Lighthouse, délai réel en production ou gain de CPU chiffré revendiqué. Les métriques de compilation ne sont pas des temps de chargement réseau.
Règles, design, moteur, API, tables, Elo et authentification inchangés ; limites Google/e-mail de l'audit conservées. Aucun service payant utilisé.