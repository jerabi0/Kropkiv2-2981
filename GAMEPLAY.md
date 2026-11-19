# Gameplay tactique — 19 novembre 2026

## Inspiré de la référence fournie
Le plateau reste celui de Kropki : pas de pouvoir, mana, multiplicateur, personnages copiés ni règles nouvelles. L'inspiration porte sur la préparation du coup, les points lumineux, les frontières de capture et la lisibilité du tour.

## Commandes
- Par défaut, cliquer/toucher une intersection sélectionne un point fantôme. Aucun coup n'est encore joué ni enregistré.
- L'aperçu annonce le gain de score réel du joueur au trait, les libérations et le risque d'auto-capture. Une future frontière apparaît en pointillés ; le vrai moteur calcule cet unique coup, pas les réponses suivantes.
- Confirmer le coup applique le placement ; Annuler retire la sélection. Changer d'intersection remplace la sélection. Boutons accessibles au clavier et tactiles.
- Option « Placement direct » sauvegardée localement pour retrouver le placement en un clic. Le tutoriel reste en confirmation pour enseigner le geste.
- L'indicateur de tour distingue le plateau actif, l'attente et la fin. Halo du point sélectionné, frontière anticipée, effets existants de pose/encerclement/reconquête conservés, sans ajouter de temps mort ni de délai obligatoire. Réduction des mouvements existante conservée.

## Chrono et salles
La première sélection ne démarre pas le chrono ; le premier placement légal confirmé le démarre. Pendant une partie active, le temps continue durant l'aperçu.
En ligne, la sélection est attachée à la révision serveur pour survivre aux interrogations sans changement. Changement de position, attente/verrouillage, relecture, expiration ou changement de salle empêchent la confirmation d'une sélection périmée. Le serveur revalide toujours le coup ; aucune API modifiée.
Une sélection n'est pas une sauvegarde de partie : recharger la page l'efface. Les coups confirmés restent sauvegardés selon le mécanisme optimisé du lot précédent.

## Pédagogie
Les quatre étapes du tutoriel enseignent sélection, aperçu et confirmation, dont une vraie capture +1. Partie personnelle isolée et chrono local en pause pendant le tutoriel. Les six exercices et leur progression existante sont conservés, sans nouvelle campagne fictive.

## Vérifications
- Lint et compilation réussis ; 80 tests unitaires / 936 assertions, zéro échec.
- Scénario navigateur dédié : sélection sans placement, annulation, premier pion/chrono, aperçu +1/frontière réelle, confirmation/capture, placement direct/rechargement, disparition d'une sélection au reload, tutoriel complet et six largeurs.
- Vérifications clavier (Entrée) et invalidation d'une sélection à expiration réussies.
- Régressions local, chrono, entraînement, habillage, privé et classé exécutées avec adaptateur de confirmation pour les anciens scripts. Captures, relecture, déconnexion/reconnexion, statistiques/Elo des deux comptes et responsive réussis.
- Dans une salle réelle, une sélection reste confirmable après 2,5 s de synchronisation sans changement de révision. Dix comptes générés par ces tests supprimés avec filtre strict e-mail ET nom.
- Capture desktop inspectée ; aucun débordement aux six largeurs ni erreur JavaScript dans les scénarios testés.

## Limites
L'image fournie ne documente pas la vitesse réelle du jeu de référence : aucun rythme identique revendiqué. Le décor panoramique et ses personnages ne sont pas reproduits. L'aperçu n'est pas un conseiller stratégique et n'offre aucun bonus.
Le chargement différé est conservé ; JavaScript initial : 511,29 + 135,37 = 646,66 kB, 192,54 kB gzip. Avertissement Vite >500 kB non bloquant. Limites Google/e-mail de l'audit inchangées.