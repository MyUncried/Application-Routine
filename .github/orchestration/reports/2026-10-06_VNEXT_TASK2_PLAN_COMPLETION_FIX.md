# VNEXT_TASK2_PLAN_COMPLETION_FIX

## Mission, autorisation et périmètre

Instruction utilisateur du 6 octobre 2026 à 10:59 Paris : corriger les constats du rapport puis relancer automatiquement les tests. Branche protocol/vnext-proof-stability-20260930, départ local fb8c06d9209bdbf4521ad94467a08df471410090, départ distant e72309a30792b573d604b987edba351732aa3099. Périmètre réel : tâche 2 jetable, plan, preuves et nettoyage du navigateur ; puis contrôles automatiques, Claude et historiques conditionnés au succès du parcours. Aucune tâche 3, certification native, modification applicative ou clôture.

## Diagnostic historique préalable

Le rapport 2026-10-06_VNEXT_TASK2_PLAN_PROOF_RESULT.md conserve le refus 37435583811 sur 4b623a02 / code 988bd1da : cinq réserves, revue valide complète en 501598 ms, aucun timeout ni implémentation. Le run Windows local 37435583847 échoue sur deux tests navigateur avec PROCESS_NOT_CLOSED. Les instructions ambiguës, le document hôte et le navigateur viennent du lot mixte b0bf7edf ; le test de sentinelle sans isolation explicite vient de 988bd1da. cf80 puis 988 n'ont pas fiabilisé le nettoyage local. Aucune preuve que le batch Git cause ces défauts. Le premier Figma e0c échouait avant b0bf ; les succès anciens ne certifient pas ce parcours. L'analyse détaillée reste dans le rapport de résultat et SYSTEMATIC_HISTORY.

## Correctifs

- Les intentions par exigence composent explicitement une livraison du même fichier ; les tests partagés composent un seul fichier et exécutent les blocs communs une fois.
- Cadre fixé en border-box, sans bordure ni padding, dimensions 402x874 aux deux viewports. La relation supplémentaire titre-dans-cadre est retirée des prescriptions : le test garde les trois seules propriétés sélectionnées, sans ajouter d'exigence produit.
- La preuve visuelle exige et produit les hashes du code source, de la chaîne render capturée une fois, du document hôte généré et du document réellement chargé via CDP. Vérification de correspondance hôte chargé/généré et des fragments DOM canoniques rendu/mesuré. Les hashes du fragment et du document entier ne sont pas comparés entre eux.
- Les tests de sentinelle et de toggle utilisent des processus Node distincts ; état initial frais, deux transitions sur la même instance, restauration du cache et indépendance de l'ordre explicités.
- Le nettoyage distingue sortie du processus et fermeture des flux. Il inventorie et termine les PIDs du profil unique avant l'attente finale de sortie, puis détache les flux hérités après vérification. Erreurs conservées, profil non supprimé avant absence des processus. Aucun navigateur utilisateur n'est visé ; pas de nouvelle hausse des plafonds Claude.

## Preuves et limites

Tests ciblés navigateur et séquence : 17 cas, 15 PASS, 0 FAIL, 2 SKIP (navigateur absent de cet environnement). Régression de l'ordre inventaire/attente couverte ; les deux tests navigateur réels exigent une exécution sur runners équipés. Qualification Linux/Windows de contrôles seuls requise avant Claude. Les tests de publication et validation de tree/fenêtre sont consignés lors de la publication ci-dessous. La cause exacte du maintien des flux Windows dans l'ancien run demeure une hypothèse ; le correctif supprime le blocage d'ordre observé dans le code, sa fiabilité locale reste à confirmer par le parcours et l'étape historique locale.

## Livraison et reprise

Fichiers de code modifiés : vnext-figma-recipe.js, vnext-figma-browser-observer.js, qualify-vnext-figma-real-path.js et tests/kodjo/vnext-figma-browser-observer.pilot.js. Rapport, preuves et checkpoint mis à jour. Request génération 54 déjà consommée : jamais rejouée. Préparer une nouvelle UUID/génération uniquement après contrôles verts sur le code exact. La séquence publiée dans e72309a3 s'applique à cette relance ; historiques interdits après refus Claude. Aucun test appareil réel applicable à ce périmètre jetable.

Commit final identifiable par git log sur ce rapport et communiqué dans la réponse. État Git vérifié après livraison. Les résultats futurs ne doivent pas être anticipés.

## Validation de publication

14 tests de publication et séquence PASS, 0 FAIL, 0 SKIP. validateTree VALIDATED, politique writer PASS_WITH_FROZEN_LEGACY, 420 sujets historiques, aucune unité PowerShell modifiée. Fenêtre vérifiée contre HEAD distant e72309a3 et blob checkpoint 8a6ffddc77bab1df8bc516d5b9e6457c6c27de69 ; 198 runs terminés examinés, aucun actif. ZIP précédent et reçus conservés intégralement dans la livraison.
