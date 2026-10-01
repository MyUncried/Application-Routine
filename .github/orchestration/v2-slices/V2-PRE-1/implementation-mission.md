# Mission d’implémentation — V2-PRE-1

Exécuter exclusivement le plan approuvé matérialisé dans `technical-plan.md`.

implementation_contract=kodjo.implementation-contract.v3
plan_blob_oid=46981c873063d9afe4d02dfe341f4d05d48b3c31
ui_plan_contract=kodjo.ui-plan-contract.v1
ui_matrix_sha256=bf3b9feef6166d4a4daf0bf9068e960af20f211cb146531d4faf4b8b351804dd
ui_criterion_count=13
ui_criterion_ids_sha256=17bfb853beb901def74d52f131f62d551a1a2b90e6cf123935a6ebad3865c8c2
ui_assertion_count=32
ui_assertion_ids_sha256=534163c795e81bbf3909122b2bdd0ec2568c187f94d8d0564979cc8b5e8d836f
ui_preservation_sha256=3ddf3ced3ba720f9e82866871e3ffae123f5cac76c0cf8c590b9c32eab4761c4
requirement_count=28
requirement_ids_sha256=56e6d656a49f9456fdb725380d288eaad39afdad92691afa0a7e5029a1eaa92c
requirement_contract_sha256=0a632f3579856e80cd5482dd24ff3b609d8c8b804c1e84d347c49799b819f80d
test_contract_sha256=84713d14def3c301dbe75a8f41888a99d5f363a8074282a913448b047088dcbb
boundary_contract_sha256=8d290bd47df7851de55aadc88c35156bb213a035e83b2348452378b1fb2bf3a0
required_stops=CHANGE_REQUEST_REQUIRED,SCOPE_EXPANSION_REQUIRED,NATIVE_PRIMITIVE_EXCEPTION_REQUIRED,CLARIFICATION_REQUIRED

## Contrat de développement opposable

- Lire avant tout code le bloc exact `KODJO_UI_CRITERIA_MATRIX_JSON` de `technical-plan.md`. Cette matrice approuvée est la seule source du contrat UI de cette implémentation ; ne pas la recopier, réencoder ni reconstruire depuis la mémoire.
- Lire aussi `KODJO_REQUIREMENT_CONTRACT_JSON`, `KODJO_TEST_CONTRACT_JSON` et `KODJO_BOUNDARY_CONTRACT_JSON`. Chaque `requirement_id` doit être traité exactement une fois ; les exigences non-UI ne doivent jamais être reconstruites depuis la prose.
- Les bindings requirement→test et les boundaries adressables sont opposables. Ne pas inventer un test, un chemin ou une relation qui n’existe pas dans ces contrats.
- Appliquer chaque `criterion_id` sans omission et respecter sa décision `REUSE | EXTEND | CREATE`, ses `change_targets`, ses tests et ses `proof_required`.
- Pour chaque critère, appliquer chaque `assertion_id` exactement une fois. Une assertion représente un invariant observable indépendamment falsifiable ; aucune assertion ne peut être fusionnée, omise ou reformulée en verdict global.
- Respecter pour chaque assertion sa source exacte, son `property_type`, son `expected` et ses `proof_required`. Une valeur géométrique ou stylistique absente des sources normatives ne doit jamais être inventée : arrêter avec `CLARIFICATION_REQUIRED`.
- Les relations, alignements, gaps, layering, responsive et états sont des invariants autonomes lorsqu’ils sont explicitement normés ; une conformité fonctionnelle n’autorise jamais à les considérer implicitement conformes.
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

Le rapport final doit contenir un bloc `KODJO_IMPLEMENTATION_CONFORMANCE` listant chaque `criterion_id` approuvé avec : `implementation_status`, `files_or_symbols`, `component_used`, `tests_run`, `proof_status`, `preserve_status`, `residual_status`. Dans files_or_symbols, indiquer uniquement des chemins de fichiers réellement modifiés, relatifs au dépôt. Dans tests_run, indiquer uniquement les identifiants des checks réellement exécutés par le superviseur (jest, typescript, lint).
Pour un plan atomique v2, chaque ligne de critère contient aussi `assertion_results` avec exactement tous les `assertion_id` approuvés du critère. Chaque résultat comporte `assertion_id`, `implementation_status` et `evidence`. Les statuts autorisés sont `IMPLEMENTED`, `NOT_IMPLEMENTED`, `PENDING_DEVICE` et `NON_VERIFIABLE`.
Encodage v2 : <KODJO_IMPLEMENTATION_CONFORMANCE>{"criteria":[{"criterion_id":"...","implementation_status":"...","files_or_symbols":["..."],"component_used":"...","tests_run":["..."],"proof_status":"...","preserve_status":"...","residual_status":"...","assertion_results":[{"assertion_id":"...-A01","implementation_status":"IMPLEMENTED","evidence":"..."}]}]}</KODJO_IMPLEMENTATION_CONFORMANCE>.
Chaque champ est explicite. `tests_run` contient uniquement les checks exécutés (tableau vide autorisé) ; les checks non exécutés et leurs raisons vont dans `tests_not_run:[{"check":"...","reason":"..."}]`. `files_or_symbols` contient uniquement les chemins modifiés ; pour un critère sans changement de code, utiliser [] et renseigner `no_code_change_reason`. Les symboles éventuels vont dans `symbols` et ne constituent pas une preuve Git.
Aucun critère ne peut disparaître du rapport. Toute preuve visuelle/device non exécutée reste `PENDING_DEVICE` ou `NON_VERIFIABLE`.
Le rapport final doit aussi contenir exactement un bloc `KODJO_REQUIREMENT_CONFORMANCE` couvrant chaque `requirement_id` avec `implementation_status`, `files_or_symbols`, `tests_run`, `proof_status` et `residual_status`. Les faits Git/tests seront recoupés mécaniquement par le superviseur.

- scope : la propriété `scope_allow` de la Lean Request reste opposable ; aucun élargissement n’est autorisé.
- contrôles : exécuter uniquement les checks déclarés dans la Lean Request.

Cette mission ne crée aucune décision fonctionnelle ou technique nouvelle et n’ajoute aucun nouveau canal de transport au protocole.
