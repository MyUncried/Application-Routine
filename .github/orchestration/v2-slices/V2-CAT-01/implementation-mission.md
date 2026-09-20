# Mission d’implémentation — V2-CAT-01

Exécuter exclusivement le plan approuvé matérialisé dans `technical-plan.md`.

implementation_contract=kodjo.ui-implementation-contract.v1
plan_blob_oid=40f476b2c47047718cae31a694da55938c0bb62a
ui_plan_contract=kodjo.ui-plan-contract.v1
ui_matrix_sha256=a3c2aa8e052960900e752bab8e41faaceea004da8fa409d5cea5ce5eaed6e2fb
ui_criterion_count=10
ui_criterion_ids_sha256=005a04bb23d8b6aa3456428c22750046e89f44b009920589f379631dd9e34e30
ui_preservation_sha256=4bafadb16ed0af4491e427f8b1d6b19590f4cd7f35cc7ecb23094924b7254ccc
required_stops=CHANGE_REQUEST_REQUIRED,SCOPE_EXPANSION_REQUIRED,NATIVE_PRIMITIVE_EXCEPTION_REQUIRED,CLARIFICATION_REQUIRED

## Contrat de développement opposable

- Lire avant tout code le bloc exact `KODJO_UI_CRITERIA_MATRIX_JSON` de `technical-plan.md`. Cette matrice approuvée est la seule source du contrat UI de cette implémentation ; ne pas la recopier, réencoder ni reconstruire depuis la mémoire.
- Appliquer chaque `criterion_id` sans omission et respecter sa décision `REUSE | EXTEND | CREATE`, ses `change_targets`, ses tests et ses `proof_required`.
- Respecter intégralement `PRESERVE / CHANGE / FORBIDDEN`. Tout élément `PRESERVE` doit rester inchangé ; tout élément `FORBIDDEN` interdit la modification correspondante.
- Une décision `REUSE` ou `EXTEND` interdit de créer silencieusement un équivalent local. Une décision `CREATE` ne permet pas de substituer une primitive, un composant canonique ou un asset déjà imposé par le plan.
- Si une substitution, une refonte, un changement de primitive/composant/architecture ou un élargissement de périmètre devient nécessaire, arrêter avant le code concerné avec le statut approprié : `CHANGE_REQUEST_REQUIRED`, `SCOPE_EXPANSION_REQUIRED` ou `NATIVE_PRIMITIVE_EXCEPTION_REQUIRED`. Si un asset canonique requis est indisponible, utiliser `CHANGE_REQUEST_REQUIRED` avec le motif `CANONICAL_ASSET_UNAVAILABLE` ; `ASSET_REQUIRED` reste un libellé historique et n’est pas réintroduit comme état protocolaire.
- En cas d’ambiguïté fonctionnelle ou normative, arrêter avec `CLARIFICATION_REQUIRED` ; ne jamais inventer.
- Une suite Jest verte ne constitue jamais à elle seule une preuve `VISUAL_COMPARE`, `ACCESSIBILITY_CHECK` ou `DEVICE_CHECK`.
- Pour tout critère exigeant une preuve device non disponible dans l’environnement, l’implémentation peut être techniquement prête pour revue mais la preuve doit rester explicitement `PENDING_DEVICE` ; ne jamais la déclarer PASS.
- `PENDING_DEVICE` est une valeur de `proof_status`, jamais un état de la machine protocolaire.
- Si une barrière d’arrêt est rencontrée, terminer le rapport par exactement `KODJO_STOP_STATUS: <STATUT>`, où <STATUT> appartient à la liste `required_stops`. Sans barrière, terminer par `KODJO_STOP_STATUS: NONE`.
- Avant toute modification, effectuer le self-check `PRESERVE / CHANGE / FORBIDDEN`. Après modification, démontrer dans le rapport final que chaque élément `PRESERVE` est resté inchangé.

## Rapport final obligatoire

Le rapport final doit contenir un bloc `KODJO_IMPLEMENTATION_CONFORMANCE` listant chaque `criterion_id` approuvé avec : `implementation_status`, `files_or_symbols`, `component_used`, `tests_run`, `proof_status`, `preserve_status`, `residual_status`.
Encodage du bloc : <KODJO_IMPLEMENTATION_CONFORMANCE>{"criteria":[{"criterion_id":"...","implementation_status":"...","files_or_symbols":["..."],"component_used":"...","tests_run":["..."],"proof_status":"...","preserve_status":"...","residual_status":"..."}]}</KODJO_IMPLEMENTATION_CONFORMANCE>. Chaque champ est explicite et non vide ; pour un test non exécuté, indiquer NOT_RUN et sa raison. Cet encodage rend contrôlable le rapport déjà obligatoire, sans nouvel état ni gate runtime.
Aucun critère ne peut disparaître du rapport. Toute preuve visuelle/device non exécutée reste `PENDING_DEVICE` ou `NON_VERIFIABLE`.

- scope : la propriété `scope_allow` de la Lean Request reste opposable ; aucun élargissement n’est autorisé.
- contrôles : exécuter uniquement les checks déclarés dans la Lean Request.

Cette mission ne crée aucune décision fonctionnelle ou technique nouvelle et n’ajoute aucun nouveau canal de transport au protocole.
