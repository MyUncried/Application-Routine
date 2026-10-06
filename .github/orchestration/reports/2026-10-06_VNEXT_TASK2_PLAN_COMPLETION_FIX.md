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

## Correction révélée par les contrôles du premier candidat

Candidat a1ab2ab641536d90df288136af843c1989a5e940, contrôles seuls 37440545157 : Linux échoue sur les deux tests navigateur. Page.getResourceContent refuse le document file:// non mis en cache. Ce défaut est introduit dans cette mission par la nouvelle attestation, pas par b0bf. Aucun Claude lancé. Remplacement par serveur HTTP strictement local 127.0.0.1, document exact généré, Network.enable avant navigation, attente loadingFinished et Network.getResponseBody pour capturer les octets réellement reçus. Serveur fermé dans finally. Les comparaisons de hashes et les deux viewports restent exigés. Nouvelle qualification exacte nécessaire ; ancien échec conservé, jamais masqué.

Premier run 37440545157 terminé : Linux et Windows 329 tests, 327 PASS, 2 FAIL, 0 SKIP, même refus de ressource file://. Aucun appel Claude ni historique. Correctif HTTP publié à 92015bd3e640bbe71a65d78b5cbc50a45d2c38f2, tree 50cf1a51337cc8af1466e2da7a91b7e84a46951d, strictement identique au candidat local validé. Nouvelle branche qualification/vnext-task2-plan-completion-http-20261006, run 37441523810 ; lancé après fin du premier run, contrôles seuls Linux/Windows. Requête fraîche génération 55 préparée, non publiée tant que ces deux jobs ne sont pas verts.

Le contrôle Linux du candidat HTTP 37441523810 dépasse bien la récupération de la réponse puis échoue : digest non défini. Oubli de déclaration introduit dans la présente mission, démontré à a1ab puis révélé après suppression du premier obstacle. Correction : import crypto, helper attestProvenance effectivement appelé par observe, test local positif et adversarial de document/fragment substitué sans navigateur. Aucun contournement des comparaisons. 14 tests navigateur/attestation locaux, 12 PASS, 0 FAIL, 2 SKIP ; troisième qualification exacte nécessaire. Windows de la deuxième qualification peut encore terminer sur le candidat obsolète, sans permettre aucun appel Claude ; seule la qualification du nouveau candidat sera admise.

Deuxième qualification 37441523810 terminée en FAILURE : Windows confirme le même digest absent, 329 tests dont 327 PASS et 2 FAIL, aucun SKIP. Candidat final ae4420751d64bfc98add0eb75df975ac14ee8728, tree 49d4d7731e63a6e77cf746b5ef03514c36dd6e48, publié avec lease et conservé identique localement. Qualification 37442048532 : Linux 330 PASS, 0 FAIL, 0 SKIP, navigateur réel et provenance vérifiés ; Windows encore en cours à cet enregistrement. Historiques sautés dans les trois qualifications : aucune qualification complète de campagne n’est revendiquée.

## Admission finale et relance autorisée

Qualification 37442048532 SUCCESS : Linux et Windows chacun 330 PASS, 0 FAIL, 0 SKIP, tests de navigateur réels inclus. Attestation et fenêtre de publication vérifiées par les fonctions du protocole sur les réponses GitHub exactes ; scope AUTOMATIC_CONTROLS_ONLY. Historiques non exécutés par cette qualification. Requête fraîche b79dcc3e-1962-416c-a701-bd1325b78492, génération 55, code approuvé ae4420751d64bfc98add0eb75df975ac14ee8728 ; aucun rejeu des UUID précédentes. Publication du contrôleur ensuite autorisée pour un seul parcours FIGMA_INITIAL ; Claude n’est pas déclaré réussi avant observation de son résultat. La réussite du parcours déclenchera automatiquement les historiques Linux/Windows, puis le préflight Windows local dans le même workflow séquencé.
