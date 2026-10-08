# VNEXT_TASK2_PLAN_PROOF_RESULT — runs terminés du 6 octobre 2026

## Mission et périmètre

Diagnostiquer les trois runs signalés terminés, conserver leurs preuves et comparer systématiquement leur origine historique. Branche `protocol/vnext-proof-stability-20260930`, départ local `2f8469039f16e53c031bacd80ebe742f5e545531`. Aucun correctif de code ni relancement dans cette mission. Aucun changement applicatif, tâche 3, certification native ou clôture autorisé.

## Résultat vérifié

Les trois runs portent sur le contrôleur `4b623a022b731880980bb71cfc6f66eb48c7c301`, code qualifié `988bd1da798b8290135adc122ceb960f69745de1`, qualification préalable verte `37433965073`. La séquence publiée ensuite à `e72309a30792b573d604b987edba351732aa3099` n'est pas exercée par ces runs et ne peut expliquer leurs échecs.

| Run | Résultat | Portée |
| --- | --- | --- |
| 37435583814 — VNext proof stability | SUCCESS | Contrôles et qualification ; ne démontre pas le succès Claude |
| 37435583811 — parcours Figma réel jetable | FAILURE / REVISE | Revue complète valide, cinq réserves bloquantes, arrêt avant implémentation |
| 37435583847 — KODJO V2 pilot tests | FAILURE | Job protocol vert ; préflight Windows local : 1091 tests, 1085 pass, 2 fail, 4 skip ; qualification jetable suivante sautée |

Claude a terminé normalement, code 0, aucun signal ni erreur, en **501598 ms (8 min 22 s)**. Réponse acceptée, 436 cibles revues, checkout inchangé. Plafond effectif 7200000 ms : aucun dépassement. Le refus porte sur le plan ; ce run ne prouve aucun défaut d'une implémentation qui n'a pas eu lieu. La livraison préservée est propre et le nettoyage du clone jetable est confirmé. Acquisition Figma en direct non exercée : rejeu de capture Git figée.

Admission vérifiée pour la requête `7855f901-9ebb-4913-82a3-f68323046d31`, génération 54. Elle est déjà consommée et ne doit pas être rejouée.

## Réserves et correctifs à préparer

1. **Composition du fichier** : trois exigences modifient Screen.js mais chacune dit « Realize only this source requirement ». Expliciter qu'elles composent une livraison unique avec Existing, render et toggle ; lever l'ambiguïté de « only ».
2. **Dimensions** : valeurs CSS déclarées et dimensions réellement mesurées peuvent diverger en présence de bordures ou marges internes. Fixer le modèle de boîte du cadre et vérifier la correspondance des dimensions, aux deux tailles de fenêtre.
3. **Titre dans le cadre** : le plan demande cette relation mais ses preuves ne la contrôlent pas. Soit la rendre vérifiable dans le périmètre autorisé, soit retirer la prescription supplémentaire. Ne pas ajouter silencieusement une nouvelle exigence produit.
4. **Origine de l'image mesurée** : le pilote exécute render() mais les obligations et faits conservés n'attestent pas assez explicitement que le document mesuré vient de cette sortie. Définir et produire une chaîne de provenance vérifiée par l'observateur indépendant. Un hash du document hôte, qui inclut scripts et enveloppe, ne doit pas être naïvement comparé au hash du seul fragment HTML : documenter et vérifier la transformation.
5. **Isolation des tests** : le test de préservation recharge des modules tandis que le test toggle utilise un état initial. Préciser les instances fraîches, l'ordre et la restauration ; vérifier que l'ordre des blocs n'altère pas les résultats.

Ces observations sont les risques et ambiguïtés jugés bloquants par le reviewer, pas cinq incidents d'exécution constatés. Les trois anciennes réserves du run 37428291785 (second viewport dans la preuve canonique, préservation trop faible, propriétaire de l'observateur) ne sont pas répétées sous leur ancienne forme ; leur absence ne constitue pas une certification générale des correctifs.

## Échec Windows local distinct

Les deux tests navigateur de `vnext-figma-browser-observer.pilot.js` échouent avec `VNEXT_FIGMA_BROWSER_PROCESS_NOT_CLOSED`, job 112177160722. Le précédent échec taskkill `/T` n'est plus le message terminal : le nouveau code attend toujours la fermeture avant d'inventorier et terminer les autres processus du profil. Le runner local reste donc en échec malgré les contrôles Windows hébergés verts.

Hypothèse à vérifier : des descendants gardent des flux ouverts et retardent l'événement de fermeture du processus observé ; l'attente avant inventaire empêcherait le nettoyage nécessaire. Les logs actuels ne permettent pas de distinguer cela d'un processus principal restant actif. Ne pas déclarer cette cause racine démontrée. Relever exit/close, PIDs du profil et résultats de terminaison sur le runner concerné ; traiter l'ensemble du profil isolé avant d'exiger la fermeture de tous les flux, sans toucher aux navigateurs utilisateur. Augmenter arbitrairement l'attente ne résout pas ce défaut.

## Analyse historique et attribution

Référence détaillée conservée : `2026-10-06_VNEXT_SYSTEMATIC_HISTORY.md` et résultat précédent `2026-10-06_VNEXT_TASK2_REGRESSION_RESULT.md`.

| Mécanisme | Origine et évolution vérifiées | Attribution |
| --- | --- | --- |
| Instructions « Realize only » par exigence sur le même fichier | Absentes de c1ea9aef, présentes dans b0bf7edf et encore dans 988bd1da | Introduction du texte ambigu dans le lot mixte d'optimisation démontrée ; détection seulement dans ce run |
| DOM réel, titre « containing », document hôte et nettoyage du navigateur | Introduits dans b0bf7edf ; géométrie/protection renforcées dans cf80c57c et preuves/fermeture dans 988bd1da | Mécanismes du nouveau parcours démontrés ; les manques de contrat persistent au-delà des corrections. Aucune preuve que le batch Git cause ces réserves |
| Cache et sentinelle de préservation | Ajoutés par 988bd1da pour corriger le test trop faible de 67d18be2 | Interaction non explicitée avec toggle introduite par le dernier correctif, démontrée au niveau du texte ; incident d'état non exécuté |
| Fermeture Windows locale | EPERM après b0bf, puis erreurs taskkill /T sur cf80 ; 988 retire /T mais échoue maintenant sur fermeture | Même famille de nettoyage non fiabilisée ; cause précise du nouvel arrêt indéterminée |

Les succès historiques 37115247745 / 08cb et 36881458781 / 3a931996 concernent un parcours antérieur, pas cette combinaison navigateur/provenance. Le run Figma 37325776512 / e0c échouait déjà avant b0bf (`DEPENDENCY_UNKNOWN:PLAN_CONTRACT`). Il n'existe donc pas dans les preuves examinées de succès bout en bout strictement comparable au parcours actuel. La qualification 37433965073 est un succès comparable des tests navigateur sur Windows hébergé, pas du runner Windows local ni du parcours Claude complet.

Conclusion d'attribution : certains défauts viennent bien du lot de modifications regroupé avec l'optimisation ; un nouveau manque vient de 988bd1da. On ne peut pas attribuer l'ensemble au seul changement de performance ou affirmer que tous les défauts étaient anciens.

## Preuves, livraison et limites

Archive Git conservée dans `v8-consolidation/figma-zones/task2/plan-proof-fix-20261006/runtime-result-37435583811/` : ZIP original, reçu de revue intégral, admission, statut, livraison préservée, résumé de processus, extraits Windows et vérification. Artefact GitHub 11399780380, 2235442 octets ; SHA-256 `1c80bc1b77fc9091611de2a234e2a6812192354850d2c369d1fc780d9ca7bdf3` conforme au digest GitHub ; intégrité ZIP PASS.

Modifications : ce rapport, preuves archivées et checkpoint campaign-state.json actualisé. Aucun test logiciel supplémentaire applicable à ce diagnostic documentaire ; vérification JSON, ZIP, digest et diff Git effectuée. Certification sur appareil réel toujours hors périmètre. Aucun nouveau run lancé ; la nouvelle séquence contrôles → Claude → historiques reste à éprouver après correction et admission fraîche.

Commit final : commit documentaire contenant ce rapport, identifiable par `git log -1 --format=%H -- .github/orchestration/reports/2026-10-06_VNEXT_TASK2_PLAN_PROOF_RESULT.md` et communiqué dans la réponse de livraison. État Git attendu et vérifié après commit : propre.
