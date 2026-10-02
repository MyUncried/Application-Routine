# VNEXT_DEVICE_FINALIZATION — cohérence revue / appareil / clôture

## Mission et périmètre

Demande utilisateur du 2 octobre 2026 : vérifier et corriger dans VNext l'incohérence observée sur V2 PRE-1 entre APPROVE avec preuve appareil en attente et finalisation après VISUAL_APPROVED. Départ : branche `protocol/vnext-proof-stability-20260930`, commit `f5245debd2a715a7db8e8bd12dc5219aca46ce5a`, PR #269. Aucun changement applicatif, aucune clôture réelle PRE-1, aucune fusion ou activation.

## Constat et correction

VNext projette son exécution validée vers la queue consommée par la chaîne commune (`scripts/kodjo/lib/vnext-legacy-queue-adapter.js`). `verify-ui-implementation-review.js` accepte NON_VERIFIABLE lorsque les preuves sont PASS ou différées sur appareil ; `verify-v2-finalization.js` exigeait CONFORME sans exception. L'incohérence existe donc sur ce chemin de livraison. L'audit FINAL propre à VNext (`audit-convergence-contract.js`) est un autre mécanisme : sa barrière sur les preuves indisponibles reste inchangée.

La correction du finalisateur autorise NON_VERIFIABLE seulement si le gate appareil est requis, au moins une preuve VISUAL_COMPARE ou DEVICE_CHECK est PENDING_DEVICE et toutes les autres preuves sont PASS. La préservation doit rester PASS et toutes les frontières PASS. PARTIELLEMENT_CONFORME, NON_CONFORME, les preuves techniques FAIL/NON_VERIFIABLE/PENDING_DEVICE, l'absence de preuves et ACCESSIBILITY_CHECK différé restent bloquants. Une preuve appareil déclarée PASS avant le gate reste refusée conformément au contrat existant.

VISUAL_APPROVED reste obligatoire : même slice, même HEAD d'implémentation/revue/livraison, référence exacte de la revue. Le workflow `kodjo-slice-finalize.yml` conserve l'autorisation du propriétaire MyUncried, la lecture des vrais commentaires et les contrôles de la PR ouverte, branche et HEAD courant. Ces gardes existants ne sont pas remplacés par une approbation inventée.

## Preuves non exécutées et dérogation SQLite PRE-1

La revue n'est ni réécrite ni normalisée en CONFORME. Les preuves PENDING_DEVICE restent PENDING_DEVICE et sont copiées dans `pending_device_proofs` du résultat, avec le critère, son statut et l'explication de la preuve. Le champ historique `device_evidence_satisfied` signifie satisfaction du gate humain de livraison ; `device_evidence_scope=USER_APPROVAL_OF_EXACT_DELIVERY` explicite cette portée. Il ne certifie pas les contrôles individuels. Le parcours de requalification ciblée reste DELTA et ne permet toujours pas la clôture globale.

La dérogation SQLite de PRE-1 n'est pas modifiée. Le test représente explicitement un contrôle SQLite non exécuté avec risque résiduel : la clôture après validation exacte conserve ce texte et le statut PENDING_DEVICE. Aucun contrôle SQLite réel ni contrôle sur appareil n'a été exécuté par cette mission.

## Vérification

105 tests ciblés PASS, 0 FAIL, 0 SKIP (Node test runner) : ui-e2e-finalization, ui-implementation-review, vnext-audit-convergence, vnext-ui-atomicity, vnext-remote-write-security, vnext-historical-equivalence, vnext-e2e-migration, vnext-queue-admission.

Le test positif appelle réellement le CLI de validation de revue puis celui de finalisation avec des commentaires de fixture : APPROVE / NON_VERIFIABLE / preuves appareil PENDING_DEVICE -> validation utilisateur exacte -> READY_TO_CLOSE. Refus vérifiés : validation absente, autre HEAD, autre revue, autre slice, écart fonctionnel, préservation ou frontière en échec, non-conformité/partielle, absence de preuve, absence de gap appareil et gate appareil désactivé. Les fixtures simulent une validation pour tester le code ; elles ne constituent pas une revue humaine ou une approbation GitHub réelle.

Un premier contrôle local de policy a détecté l'OID périmé après la dernière retouche du finalisateur. L'OID a été actualisé puis les 105 tests ont passé. Neuf empreintes de cas historiques du seul fichier de tests modifié sont actualisées ; aucun sujet parmi les 420, identifiant, protection ou preuve historique n'est modifié.

## Livraison et limites

Fichiers modifiés : finalisateur commun, tests E2E existants, exact blob OID dans KODJO_VNEXT_REMOTE_WRITE_POLICY.json, neuf empreintes correspondantes dans KODJO_VNEXT_HISTORICAL_EQUIVALENCE.json, checkpoint de campagne et présent rapport.

Commit final : commit contenant ce rapport, descendant direct du HEAD de départ (identité vérifiée lors de publication GitHub). État local : modifications limitées à ces six fichiers avant publication. Qualification Linux/Windows du nouveau candidat : EN ATTENTE au moment de cette publication ; résultat à rattacher au checkpoint après lecture des vrais jobs. INITIAL et REVISION précédents ne sont pas rejoués, et aucune preuve acquise ne change.

Le correctif est livré sur la branche de protocole. Le workflow partagé de finalisation charge actuellement le protocole depuis main : son usage en production exigera la promotion autorisée de cette branche ; aucune fusion n'est effectuée ici. Aucun constat ne démontre une validation physique de PRE-1 ou la réussite du contrôle SQLite exempté.
