# Audit fonctionnel — finalisé le 19 novembre 2026

## Corrections
- URL inconnue : page explicite avec liens de retour, au lieu d'un écran vide.
- Sauvegarde locale : dimensions autorisées exactes, historique borné, coordonnées entières, alternance et légalité des coups vérifiées. Plateau, territoires et score recalculés par le moteur. Une sauvegarde illisible ouvre une nouvelle partie avec un avertissement.
- Stockage bloqué ou saturé : avertissement visible pendant le jeu ; les accès complémentaires au stockage pour les callbacks d'authentification ne propagent plus d'exception. Ce correctif ne garantit pas une connexion OAuth dans un navigateur qui refuse tout stockage.
- Changement de salle : l'état de relecture, de confirmation et de feedback est recréé pour chaque identifiant de salle.
- Plateau en ligne : verrouillage à l'échéance affichée et à l'expiration du délai de départ ; le serveur reste autoritaire.
- Pendule locale : rejet d'un état « pas encore démarré » avec un budget déjà consommé.
- Message de reconnexion : distingue attente du départ et partie chronométrée.
- Script de régression chrono mis à jour pour cinq cadences et départ au premier pion ; tests historiques 1 minute conservés comme migration des anciennes parties.

## Vérification
- Vérification finale : 78 tests unitaires, 872 assertions, zéro échec ; lint et compilation réussis ; site accessible sur le port 4200 (HTTP 200).
- Tests unitaires du moteur, pendule, feedback, entraînement, habillage, restauration locale, stockage, parties en ligne et Elo.
- Navigateurs : jeu local/ordinateur, captures, annulation, sauvegarde/rechargement, tutoriel, relecture, chrono et résultats ; six exercices et plateau libre ; douze scellements et cinq effets, avatar/photo, mouvements réduits ; parties privées et classées avec vrais comptes, synchronisation/reconnexion, Elo et statistiques.
- Vérifications spécifiques : route inexistante, sauvegarde aux mauvaises dimensions, stockage refusé, navigation de retour, écran de connexion et affichage sur six largeurs.
- API privée et classée : autorisations, confidentialité, prêts concurrents, premier coup, doublons, révision périmée, coups concurrents, résultat au délai, Elo atomique et annulation sans pénalité avant départ.
- Une exécution privée a échoué sur une assertion de largeur immédiatement après redimensionnement. Nouvelle exécution avec capture de diagnostic : réussie ; le défaut n'a pas été reproduit et aucune correction de mise en page n'est revendiquée pour ce cas.
- Les comptes générés par ces tests sont supprimés par filtre strict e-mail ET nom ; les tests API nettoient leurs données.

## Limites restantes
- Vérification d'e-mail et récupération de mot de passe intégrées avec Resend (Better Auth 1.6.19). Les e-mails ne sont activés que si `RESEND_API_KEY` et `EMAIL_FROM` sont définis ; vérification facultative par défaut pour ne pas bloquer les comptes existants. Les liens de réinitialisation expirent après une heure. La livraison en production reste à vérifier avec un domaine expéditeur validé et des identifiants Resend réels.
- Connexion Google complète avec un compte réel : non vérifiée dans cet audit. Les méthodes et la configuration existantes restent inchangées.
- Bundle JavaScript supérieur à 500 kB : avertissement de compilation non bloquant, optimisation non effectuée ici.
- L'isolation de l'état au changement d'identifiant de salle est une protection structurelle React ; le passage direct entre deux salles avec une relecture ouverte n'a pas fait l'objet d'un scénario navigateur dédié.
- Cet audit est fonctionnel et de robustesse ; il ne remplace pas un test d'intrusion ni un test de charge en production.

Règles de capture/libération, moteur `kropki.ts`, Elo, design, tables et archives précédentes conservés.