# Correction bornée de l’audit 0.6.46

Source exclusive : Audit_KODJO_V2_0.6.46_f3ba2e69.md, rapport final du 19 septembre 2026.
Baseline distante vérifiée avant modification : f3ba2e69efbf5ef3aa455062daaeb71110a3f3ef.
Ce plan précède toute modification de code. Aucun état, gate ou périmètre applicatif nouveau. Aucune fusion autorisée.

| Ordre | Défaut | Correction minimale prévue / fichiers | Invariant | Non-régression | Risque |
|---|---|---|---|---|---|
| 1 | F01 | Restaurer le bloc tronqué de kodjo-slice-finalize.yml, test du PowerShell embarqué | I4 | Parse natif et contrats V2/legacy | Élevé : clôture |
| 2 | F02 | Rendre exclusives les conditions IMPLEMENT/VISUAL_CORRECTION dans kodjo-slice-implementation-review.yml | I2/I4 | Table de sélection des steps | Moyen : routage |
| 3 | F14 | Refuser NON_VERIFIABLE device en review selon N40, verify-ui-implementation-review.js | I3/I4 | Statuts PASS/FAIL/PENDING_DEVICE/NON_VERIFIABLE | Moyen : review |
| 4 | F06 | Cohérence, complétude et applicabilité dans preflight-contract.js et verify-preflight-attestation.js ; fixtures/tests préflight | I3/I5 | Contre-exemples audit et chemins légitimes | Élevé : admission |
| 5 | F08 | Sélection bornée puis agrégation, verify-queue-admission.js et Lean Queue ; conserver admission complète par défaut | I1/I5 | Défauts multiples, autorisation toujours requise avant mutation | Élevé : contrôles déplacés |
| 6 | F09 | Préserver directement l’attestation d’échec dans kodjo-v2-lean-queue.yml | I1/I3 | Chemin upload après échec, sans runtime Claude | Faible |
| 7 | F07 | Actualiser PR/ref avant mutation, agent et push ; runtime/runner/live-target/finalizer | I5 | Changement de cible entre phases ; HEAD local autorisé distinct du remote attendu | Élevé : races/refus indus |
| 8 | F03 | YAML du sidecar Dev valide et garde de syntaxe dans qualification | I3 | Parse indépendant ; ancien contre-exemple rejeté | Faible |
| 9 | F04 | Applicabilité strictement booléenne, deux sidecars | I5 | true/false/null/absent/vide/types invalides | Moyen : publication |
| 10 | F05 | Événement de fin de review observé latéralement, lien exact au run/commentaire ; sidecar/resolver/producteur/tests | I5 | Run étranger/échoué, commentaire non lié, dédoublement | Élevé : event chain |
| 11 | F11 | Aucun statut de check autre que PASS ne compte comme réussi, lib/status.js | I3 | Table audit, conservation des patches et statuts existants | Moyen |
| 12 | F12 | Acheminer la sortie IMPLEMENT existante vers la contre-vérification indépendante ; ne pas inventer un gate runtime que N39 ne prescrit pas | I1/I4 | Rapport absent/incomplet visible au reviewer, legacy/delta préservés | Moyen |
| 13 | F13 | Actualiser PACKAGE_MANIFEST, test des références normatives | I1/I2 | Héritage normatif et versions exactes | Faible |

F10 réservé : la politique de consommation durable entre runs est explicitement classée À CLARIFIER en G1 du rapport. Aucun mécanisme de consommation nouveau sans décision.
Les points NON VÉRIFIABLE et la preuve humaine détaillée (G2) restent hors correction.

Après chaque lot : tests ciblés. À la fin : suite pilote et seconde passe distincte cherchant anciennes formulations, raccords, conditions et fixtures contradictoires. Une preuve locale/simulée n’est pas un E2E distant. La PR restera non fusionnée.
