# Kropki Arena — cadences prioritaires + lot pédagogique
- [x] Correction approuvée : 1/3/5/7/10/30 min pour toute la partie, un compte à rebours ; pause tutoriel/relecture ; zéro => score décide ; abandon => victoire adverse
- [x] Chronomètre global horodaté, persistance version 2, migration des anciennes pendules, résultats et sélection des six durées
- [x] Tutoriel terminé avec vraie capture +1 ; relecture contrôles/curseur/lecture seule ; partie personnelle conservée
- [x] 33 tests unitaires / 281 assertions ; deux scripts Playwright réussis : temps des deux tours et ordinateur, pauses simulées, reload/expiration/nul, confirmation expirée et abandon malgré l'avance au score
- [x] Lint et build réussis ; captures mobile/desktop/tutoriel/relecture inspectées ; aucun débordement sur six largeurs et aucun JS error
- [x] ZIP version chronomètre global et livraison
Note build : avertissement de bundle JS >500 kB, non bloquant ; avertissements préexistants du template conservés. Moteur kropki.ts inchangé.
## Socle en ligne — vérifié
- [x] Auth Better Auth + Google géré ; tables ajoutées sans supprimer l'existant
- [x] E-mail inscription et sessions testés avec trois contextes navigateur
- [x] Parties privées : lien non devinable, deux participants, prêts, compte à rebours serveur, CAS et idempotence
- [x] Playwright : alternance, vraie capture, refus du troisième compte, reload, abandon du meneur, relecture, mobile/six largeurs
- [x] 39 tests unitaires / 306 assertions ; tests API réels : accès, confidentialité, prêts concurrents, doublons, révision périmée, CAS des coups et expiration au score ; données API de test supprimées
- [x] Régression locale et chronomètre Playwright ; lint/build réussis (bundle >500 kB, non bloquant)
- [x] Déconnexion/reconnexion réseau en salle, plateau bloqué hors connexion ; connexion e-mail après déconnexion, jeton supprimé, retour invitation et session persistante
- [x] Google : écran de connexion accounts.google.com atteint depuis l'aperçu Runable ; localhost refusé par le broker (« Unrecognized managed auth origin »), attendu ; connexion complète avec compte Google non testée
- [x] Retour après Google vers l'invitation conservé, erreurs de callback visibles ; captures connexion/salle desktop et mobile inspectées, salon sans débordement sur six largeurs
- [ ] Envoi de vérification/récupération e-mail : non configuré, limitation documentée ; aucun faux envoi
- [x] Comptes et salles générés par les tests navigateur supprimés (16 comptes identifiés par leur format et nom de test uniquement)
- [x] ZIP en ligne vérifié : 122 fichiers, aucune clé .env ni dépendance/cache ; archives précédentes conservées ; moteur inchangé
- Livraison préparée : site port 4200 (HTTP 200) et `/home/user/kropki-en-ligne-projet.zip`.
## Refonte claire + duels classés — vérifié
- [x] Plan approuvé et référence utilisateur : interface claire cobalt/corail/jaune, contenus Kropki conservés
- [x] Tables rating/queue/rating_result ajoutées ; Elo 1200/K32, dix résultats provisoires, journal unique et transaction des deux classements
- [x] Appariement réel : mêmes critères, comptes distincts, proximité Elo élargie, une seule recherche/salle active, couleurs aléatoires
- [x] Bail de recherche 60 s, interrogation 3 s, annulation résistante à la course d'appariement ; deux prêts sous 90 s sinon aucune pénalité
- [x] Statistiques personnelles et vingt derniers résultats, bilan privé séparé, aucune donnée fictive ou locale
- [x] API réelle : concurrence, critères, expiration, annulation, résultat unique, Elo des deux comptes, nul au délai, isolation privée et salle non démarrée sans pénalité
- [x] Navigateur classé : recherche 21/7 restaurée au reload, annulation, appariement, prêts, capture, reload, abandon malgré avance, Elo réel et historique des deux joueurs ; six largeurs sans erreur JS
- [x] Régressions navigateur local/chronomètre/privé réussies avec le nouveau thème ; captures desktop/mobile inspectées
- [x] 45 tests unitaires / 333 assertions, lint et build réussis ; avertissements non bloquants du template/bundle conservés
- [x] Nettoyage de 16 comptes navigateur de ce lot identifiés par format e-mail ET nom ; salles liées supprimées, autres comptes conservés
- [x] Moteur kropki.ts identique octet pour octet à l'archive Arena ; serveur HTTP 200 et route /statistiques confirmés
- [x] ZIP classé livré : 131 fichiers, sans secrets/cache ; site livré port 4200
Limites inchangées : connexion Google complète non testée, récupération/vérification e-mail non configurée. Entraînement avancé/social/compétitions hors de ce lot.

## Entraînement — vérifié, livraison en préparation
- [x] Proposition validée telle quelle : exercices capture/défense/libération, indices/solutions expliqués, plateau libre sans temps, analyse tactique et progression locale
- [x] Modules indépendants de positions/exercices, analyse déterministe à un coup et persistance validée ; moteur inchangé
- [x] Page /entrainement + navigation ; worker d'analyse hors du fil UI ; stockage isolé et erreurs honnêtes
- [x] Six exercices résolus par le moteur, essais alternatifs et aides sans faux succès ; plateau libre/reload/annuler/analyse
- [x] Tests unitaires, browser desktop/mobile/six largeurs, isolation sauvegarde et régression des modes existants
- [x] Lint/build et documentation ; archive et livraison à vérifier ci-dessous

- [x] 67 tests / 441 assertions ; navigateurs entraînement et classé réussis après protection du retour salon contre un ancien appariement en cache. Régressions local/chrono/privé et API privées/classées réussies.
- [x] Nettoyage de 9 comptes de test identifiés strictement par e-mail et nom, salles liées supprimées.
- [x] Moteur identique octet pour octet à Arena ; /entrainement et /statistiques HTTP 200. Archive entraînement vérifiée : 139 fichiers, sans secrets/dépendances/caches ; anciennes archives conservées.
- [x] Livraison site port 4200 et ZIP entraînement confirmée.

## Habillage anime — vérifié, livraison préparée
- [x] Plan approuvé : référence utilisateur, règles conservées, matchs locaux et privés/classés uniquement.
- [x] Préférences locales validées, effets sur vrais coups/captures, avatars, sons désactivables.
- [x] Régressions locales/chrono/relecture/entraînement/privé/classé et tests anime réussis ; effets des captures sur les deux écrans classés et avatar local seulement. Lint sans erreur, build réussi, 72 tests / 811 assertions.
- [x] Tests API privés/classés réussis après deux interruptions réseau Turso ECONNRESET ; aucun changement serveur.
- [x] 10 comptes de test navigateur supprimés avec filtre strict e-mail ET nom ; autres comptes conservés.
- [x] API, moteur, chronomètre et page entraînement identiques à l’archive entraînement (22 fichiers vérifiés). Captures desktop/mobile inspectées.
- [x] Archive anime préparée et vérifiée, sans secrets/caches/dépendances ; anciennes archives conservées.
- [x] Livraison anime site port 4200 et ZIP.

## Départ au premier pion
- [x] Plan validé : suppression 1 min, premier coup légal démarre, anciens matchs conservés.
- [x] Implémentation local version 3 et départ serveur atomique au premier coup ; anciennes parties conservées.
- [x] 74 tests / 832 assertions, lint/build réussis ; navigateur local attente/reload/premier pion/undo et régressions local/privé/classé réussies ; API privées/classées réussies.
- [x] 5 comptes navigateur de test supprimés par filtre strict ; API auto-nettoyée.
- [x] Archive sans secrets/caches, moteur inchangé. Livraison site et ZIP confirmée.

## Audit approuvé
- [x] Périmètre existant uniquement, règles/design/Elo conservés.
- [x] Reproductions : URL inconnue vide ; sauvegarde h=2 acceptée avec w=17.
- [x] Validation sauvegarde, alertes stockage, navigation, isolation des salles et cas limites chrono.
- [x] Régressions navigateur local/entraînement/anime/chrono/privé/classé et API privées/classées réussies ; huit comptes navigateur nettoyés avec filtre strict.
- [x] Vérification finale : 78 tests / 872 assertions, zéro échec ; lint et build réussis ; site HTTP 200 sur 4200.
- [x] Documentation AUDIT.md : corrections, vérifications et limites explicites ; avertissement bundle non bloquant.
- [x] Archive finale vérifiée et livraison site + ZIP confirmée.

## Performance — lot approuvé
- [x] Chargement différé des pages secondaires et état de chargement accessible ; jeu local initial conservé.
- [x] Sauvegarde sur changements significatifs, sans écritures aux seuls tics ; horodatage et rechargement corrects.
- [x] 80 tests / 936 assertions ; lint/build et régressions navigateur local/chrono/entraînement/anime réussis.
- [x] Compteur navigateur : zéro écriture pendant 3 s de tics seuls ; reload et routes vérifiés sans erreur JavaScript.
- [x] Mesures documentées dans PERFORMANCE.md : chargement initial 640,97 kB contre 743,20 kB, module partagé inclus ; avertissement >500 kB maintenu.
- [x] Vérification archive et livraison site + ZIP performance confirmées.

## Gameplay tactique — lot approuvé
- [x] Référence utilisateur, périmètre local/en ligne/tutoriel confirmé ; aucune règle/API/Elo modifiée.
- [x] Sélection, aperçu par le vrai moteur, annulation/confirmation et option directe persistée ; tour visible et frontières anticipées.
- [x] Révision serveur stable pour la sélection, invalidation au verrouillage/fin/relecture ; chrono continue pendant l'aperçu actif.
- [x] Tutoriel adapté et progression d'entraînement conservée ; responsive et clavier vérifiés.
- [x] 80 tests / 936 assertions ; lint/build ; gameplay dédié et six régressions navigateur avec adaptateur de confirmation réussis.
- [x] Dix comptes de test nettoyés avec filtre strict ; documentation GAMEPLAY.md.
- [ ] Archive vérifiée et livraison site + ZIP gameplay.
