# KODJO Protocol VNext — spécification normative

**Lot :** VNext-01 — Fondations  
**Statut :** construction VNext, inactive  
**Date :** 2026-09-29

## 1. Principes normatifs

### VNX-01 — Source avant interprétation
Toute exigence provient d'une source normative identifiée et adressable. L'IA ne crée pas de décision produit.

### VNX-02 — RequirementRegistry source-first
Le registre d'exigences est construit depuis les sources applicables, jamais rétro-déduit du plan ou des critères UI.

### VNX-03 — Cœur commun INITIAL / REVISION
INITIAL et REVISION utilisent le même cœur :
`REQUIREMENTS → IMPACT → PLAN → REVIEW`.

### VNX-04 — Révision bornée
Après REVISE, aucun élément validé n'est rouvert sans cause démontrée.

### VNX-05 — Identités mécaniques
Paths, IDs, hashes, scopes, agrégats et verdicts calculables sont produits par la machine.

### VNX-06 — IA bornée
L'IA apporte l'interprétation sémantique dans un ensemble de candidats et contrats fournis. Elle ne choisit pas les identités calculables ni le verdict agrégé.

### VNX-07 — Intervention utilisateur limitée
L'utilisateur intervient pour les ambiguïtés produit réellement ouvertes et l'approbation finale.

### VNX-07A — Décision durable et causale
Toute ambiguïté réellement soumise à l'utilisateur est matérialisée par un `DecisionRecord` durable contenant :
- question exacte ;
- options réellement ouvertes ;
- sources causales ;
- réponse utilisateur ;
- exigences affectées ;
- date et preuve causale.

Une question seule ne vaut jamais décision. Une décision résolue devient une source normative du `SourceManifest`.

### VNX-08 — Contrat structuré canonique
Le JSON contractuel est canonique. Le Markdown est une projection lisible, jamais une seconde source concurrente.

### VNX-09 — Atomicité observable
Pour l'UI : `Requirement → Criterion → Atomic Assertions`. Deux propriétés indépendamment falsifiables sont séparées.

### VNX-10 — Preuve adaptée
Un test fonctionnel ne prouve pas le visuel ; une analyse statique ne prouve pas le device ; une validation humaine ne remplace pas une preuve technique obligatoire.

### VNX-11 — Fail closed
Toute identité, source, preuve ou donnée obligatoire absente, ambiguë ou incohérente bloque.

### VNX-12 — Anti-régression opposable
Chaque règle historique reçoit une disposition explicite :
`CONSERVÉE | REMPLACÉE_ÉQUIVALENTE | SUPERSÉDÉE_EXPLICITEMENT | NON_APPLICABLE_JUSTIFIÉE`.

## 2. Machine cible

1. ADMISSION
2. REQUIREMENTS
3. IMPACT
4. PLAN
5. REVIEW
6. REVISION
7. USER_APPROVAL
8. HANDOFF

REVISE réentre uniquement à l'étape minimale nécessaire : REQUIREMENTS, IMPACT ou PLAN.

## 3. Contrats VNext

- `kodjo.vnext.planning-envelope.v1`
- `kodjo.vnext.source-manifest.v1`
- `kodjo.vnext.decision-record.v1`
- `kodjo.vnext.requirement-registry.v1`
- `kodjo.vnext.impact-graph.v1`
- `kodjo.vnext.plan-contract.v1`
- `kodjo.vnext.review-report.v1`
- `kodjo.vnext.revision-patch.v1`
- `kodjo.vnext.approval-target.v1`
- `kodjo.vnext.approval-record.v1`
- `kodjo.vnext.execution-request.v1`
- `kodjo.vnext.runtime-snapshot.v1`
- `kodjo.vnext.legacy-queue-projection.v1`
- `kodjo.vnext.cutover-plan.v1`
- `kodjo.vnext.cutover-activation.v1`
- `kodjo.vnext.cutover-rollback.v1`
- `kodjo.vnext.audit-manifest.v1`
- `kodjo.vnext.audit-coverage.v2`
- `kodjo.vnext.finding-ledger.v1`
- `kodjo.vnext.final-audit-report.v1`

VNext-01 implémente uniquement les trois premiers contrats et le socle de canonicalisation/hash/IDs.

## 4. PlanningEnvelope

Le `PlanningEnvelope` fixe avant raisonnement :
- slice_id ;
- planning_mode INITIAL/REVISION ;
- baseline_head ;
- product_head ;
- application_head ;
- issue_id ;
- SourceManifest ;
- base plan/review et findings en REVISION ;
- provenance causale.

INITIAL interdit tout état causal de révision.
REVISION exige plan, review et findings causaux exacts.

## 5. SourceManifest

Chaque source porte :
- source_kind ;
- authority ;
- locator Unicode exact ;
- revision ;
- fingerprint ;
- unités adressables.

Les dispositions d'unité sont fermées :
`REQUIREMENT_SOURCE | CONTEXT_ONLY | SUPERSEDED | OUT_OF_SCOPE | AMBIGUOUS`.

Les formes dégradées `#Uxxxx`, `\\uXXXX` littéral et U+FFFD sont refusées. Aucune normalisation silencieuse Unicode n'est appliquée.

## 6. DecisionRecord

Un DecisionRecord possède un ID machine, une question, au moins deux options, les sources causales et un statut `OPEN | RESOLVED`.

OPEN ne vaut jamais décision.
RESOLVED exige une option valide, une identité utilisateur et une preuve causale.
La décision résolue peut être injectée comme nouvelle source normative.

## 7. Impact — règle conservée dès la fondation

Le contrat VNext conserve explicitement `ONE_LEVEL_DIRECT_IMPORTS` :
- scan depuis les racines validées ;
- chaque importateur direct classé exactement une fois ;
- un direct MODIFY rejoint le scope ;
- il ne devient pas automatiquement une nouvelle racine ;
- aucune fermeture transitive libre.

## 8. Ordre déterministe scope → UI

Ordre obligatoire :
`requirements → impact candidates → classifications → scope final → UI criteria → atomic assertions → validators`.

Aucune matrice UI n'est considérée finale avant fixation du scope final.

## 9. Approbation actionnable

Quand l'approbation utilisateur est requise, le handoff doit identifier l'objet canonique, fournir un lien direct lorsque le transport le permet et une action attendue explicite.

L'ergonomie du message n'est pas normative ; l'identité de l'objet et l'action attendue le sont.

VNext-08 précise cette règle : l'utilisateur approuve un `ApprovalTarget` scellé qui représente l'exécution exacte à venir. Une approbation textuelle non liée au hash exact de cet objet n'autorise aucun handoff.

## 10. Politique d'erreur

Catégories fermées :
- `PREVENTABLE_BY_DETERMINISM` ;
- `RESIDUAL_AUTOCORRECTABLE` ;
- `HUMAN_DECISION_REQUIRED`.

Une erreur inconnue n'est jamais automatiquement retentée.

## 11. Gate VNext-01

VNext-01 est conforme si :
- canonical JSON/hash déterministes ;
- IDs machine stables ;
- Unicode exact conservé ;
- SourceManifest scellé et vérifiable ;
- PlanningEnvelope INITIAL/REVISION fail-closed ;
- DecisionRecord causal et durable ;
- politique d'erreur fermée ;
- aucun workflow de production modifié.


## 12. VNext-02 — RequirementRegistry source-first

### 12.1 Contrat

Le registre canonique des exigences utilise :

`kodjo.vnext.requirement-registry.v1`.

Il est lié par hash au `PlanningEnvelope` et au `SourceManifest` exacts.

### 12.2 Construction exclusivement depuis les sources

Le constructeur reçoit uniquement :

- `planning_envelope_hash` ;
- `source_manifest` ;
- les classifications sémantiques des exigences extraites de ces unités de source.

Il ne reçoit ni `PlanContract`, ni matrice UI, ni `criterion_id`, ni assertions UI.

Une exigence UI est donc recensée avant la création de tout critère UI.

### 12.3 Types d’exigence

Taxonomie fermée :

- `FUNCTIONAL`
- `UI`
- `DATA`
- `TECHNICAL`
- `MIGRATION`
- `PRESERVATION`
- `NON_FUNCTIONAL`

Statuts :

- `ACTIVE`
- `CLARIFICATION_REQUIRED`

Priorité sourcée :

- `MUST`
- `SHOULD`
- `MAY`
- `UNSPECIFIED`

`UNSPECIFIED` est utilisé lorsqu’aucune priorité explicite ne peut être déduite de la source ; le protocole ne l’invente pas.

### 12.4 Identité mécanique

`requirement_id` est produit par la machine à partir de l’identité de source, de l’unité, de son fingerprint, du type et de l’énoncé normalisé.

Le modèle ne choisit ni ne recopie l’ID.

### 12.5 Couverture exhaustive

Toute unité du `SourceManifest` apparaît exactement une fois dans la matrice de couverture du registre.

Règles bloquantes :

- `REQUIREMENT_SOURCE` sans requirement → `VNEXT_REQUIREMENT_SOURCE_UNCOVERED` ;
- `AMBIGUOUS` sans requirement → `VNEXT_AMBIGUOUS_SOURCE_UNCOVERED` ;
- requirement issu de `CONTEXT_ONLY`, `SUPERSEDED` ou `OUT_OF_SCOPE` → refus ;
- requirement lié à une source/unité inconnue → refus ;
- doublon d’identité calculée → refus.

### 12.6 Ambiguïtés et contradictions

Une unité `AMBIGUOUS` produit obligatoirement une exigence `CLARIFICATION_REQUIRED`.

Un conflit entre unités source est conservé dans les exigences et rend le registre `BLOCKED`.

Routage :

- clarification → `CLARIFICATION_REQUIRED` ;
- contradiction produit → `PRODUCT_AMBIGUITY` ;
- omission/identité/structure incohérente → `PREVENTABLE_BY_DETERMINISM`.

### 12.7 Relations

Les relations sont exprimées vers des `unit_id` déjà produits par la machine.

Le registre dérive ensuite mécaniquement les `related_requirement_ids` et `conflict_ids` et rend ces relations symétriques.

### 12.8 Gate REQUIREMENTS_READY

Le gate est franchissable uniquement si :

- toutes les unités source sont couvertes ou disposées ;
- toutes les exigences ont une source exacte ;
- aucun requirement source n’est oublié ;
- aucune clarification ou contradiction bloquante ne subsiste ;
- `registry_status=READY`.

Le plan et l’impact restent interdits tant que ce gate n’est pas franchi.


## 13. VNext-03 — ImpactGraph déterministe

### 13.1 Contrats

VNext-03 introduit :

- `kodjo.vnext.impact-candidates.v1`
- `kodjo.vnext.direct-import-scan.v1`
- `kodjo.vnext.impact-graph.v1`

### 13.2 Propriété des chemins

L’IA ne fournit jamais de path libre à `ImpactGraph`.

La machine construit un `CandidateManifest` lié au HEAD exact à partir de :

1. l’arbre Git pour les chemins existants ;
2. des slots `CREATE` explicitement admis par une politique machine.

Chaque candidat reçoit un `candidate_id` déterministe.

La classification IA référence uniquement :

- `requirement_id`
- `candidate_id`
- `change_kind`
- justification et preuves sémantiques.

### 13.3 Sémantique MODIFY / CREATE / DELETE / NO_CHANGE

Pour un candidat issu de `GIT_TREE` :

- `MODIFY` autorisé ;
- `DELETE` autorisé ;
- `NO_CHANGE` autorisé ;
- `CREATE` interdit.

Pour un candidat issu de `CREATE_SLOT_POLICY` :

- `CREATE` autorisé ;
- `NO_CHANGE` autorisé ;
- `MODIFY` et `DELETE` interdits.

Un slot `CREATE` :

- ne doit pas exister au HEAD analysé ;
- appartient à une racine autorisée ;
- possède un `policy_id` et un `policy_hash` ;
- reçoit son identité par la machine.

### 13.4 Binding au HEAD

Le CandidateManifest contient :

- `revision` SHA-40 ;
- `git_tree_sha256` ;
- liste exacte des candidats ;
- hash canonique du contrat.

Un candidat existant doit correspondre exactement à un chemin Git au HEAD analysé.

Unicode, casse et séparateurs font partie de l’identité exacte du path.

### 13.5 ONE_LEVEL_DIRECT_IMPORTS

Pour tout module de code source classé `MODIFY`, la machine exécute un scan des importeurs directs.

Règles :

- seuls les importeurs directs sont ajoutés aux obligations de classification ;
- chaque importeur direct doit être classé pour chaque exigence qui modifie l’une de ses dépendances directes ;
- un importeur direct lui-même classé `MODIFY` ne devient pas automatiquement une nouvelle racine de scan ;
- aucune fermeture transitive libre n’est autorisée ;
- tests, documents et workflows modifiés ne déclenchent pas à eux seuls une expansion d’imports.

### 13.6 Couverture des exigences

Pour chaque exigence du `RequirementRegistry READY`, `ImpactGraph` exige :

- au moins un impact ciblé ; ou
- un `NO_CHANGE` au niveau exigence avec justification.

Une exigence sans ligne d’impact est bloquante.

Un `NO_CHANGE` au niveau exigence ne peut pas être mélangé à des impacts ciblés pour la même exigence.

### 13.7 Identités mécaniques

`impact_id` est produit par la machine à partir de :

- `requirement_id`
- `candidate_id`
- `change_kind`

Le modèle ne crée jamais `impact_id`, `candidate_id`, path, hash ou verdict de couverture.

### 13.8 Gate IMPACT_READY

Le gate est franchissable uniquement si :

- RequirementRegistry est `READY` ;
- CandidateManifest est valide et lié au HEAD ;
- aucun candidate_id inconnu n’est utilisé ;
- chaque change_kind est compatible avec l’origine du candidat ;
- tous les importeurs directs requis sont classés ;
- toutes les exigences sont couvertes ;
- aucune expansion non démontrée n’est présente.

Le `PlanContract` reste interdit tant que ce gate n’est pas franchi.


## 14. VNext-04 — PlanContract canonique

### 14.1 Contrat

VNext-04 introduit :

`kodjo.vnext.plan-contract.v1`

Le PlanContract devient l’unique contrat canonique du plan VNext.

Les contrôles historiques de scope, tests, preuve, provenance et boundaries sont conservés comme exigences de comportement, mais ne constituent plus des contrats parallèles concurrents dans VNext.

### 14.2 Chaîne obligatoire

Pour chaque requirement :

`Requirement → Impact → Change → Test → Proof → Boundary`

Aucune exigence active ne peut exister uniquement en prose.

Chaque `plan_item` est lié à exactement un `requirement_id` existant et reprend mécaniquement tous ses `impact_id`.

### 14.3 Change items

Les changements sont dérivés exclusivement des impacts :

- `MODIFY`
- `CREATE`
- `DELETE`

Le modèle fournit uniquement un `intent` sémantique pour chaque impact modifié.

Le path, le candidate_id, le change_kind, le change_id et le scope sont calculés par la machine.

Tout changement sans `implementation_intent` est bloquant.

### 14.4 Obligations de test

Chaque requirement possède au moins une obligation de test.

Une obligation cible :

- un `impact_id` de test existant ; ou
- `null` avec justification explicite de non-testabilité automatique.

L’action est dérivée mécaniquement depuis l’impact :

- NO_CHANGE → RUN_EXISTING
- MODIFY → ADAPT
- CREATE → CREATE
- DELETE → REMOVE
- cible null → NONE_WITH_JUSTIFICATION

Chaque changement doit être couvert explicitement par au moins une obligation de test.

Un test indiqué comme affecté dans ImpactGraph doit avoir son propre impact et une obligation de test correspondante.

### 14.5 Obligations de preuve

Types fermés :

- `FUNCTIONAL_TEST`
- `STATIC_ANALYSIS`
- `VISUAL_COMPARE`
- `ACCESSIBILITY_CHECK`
- `DEVICE_CHECK`

Chaque changement doit être couvert explicitement par au moins une preuve.

Une preuve `FUNCTIONAL_TEST` doit référencer une obligation de test réelle et sa couverture ne peut pas dépasser celle du test associé.

Un test supprimé ou une absence justifiée de test automatique exige une preuve alternative non `FUNCTIONAL_TEST`.

### 14.6 Boundaries

Les boundaries sont calculées mécaniquement depuis ImpactGraph et CandidateManifest :

- `write_scope` = candidats portant MODIFY / CREATE / DELETE ;
- `preserve_scope` = candidats existants explicitement marqués à préserver ;
- `forbidden_policy = ALL_OUTSIDE_WRITE_SCOPE`.

Un candidat ne peut être simultanément CHANGE et PRESERVE.

Le modèle ne fournit aucun path de boundary.

### 14.7 Disposition

La disposition du requirement est calculée :

- au moins un impact MODIFY / CREATE / DELETE → `CHANGE`
- uniquement des impacts NO_CHANGE → `NO_CHANGE`

L’IA ne choisit pas cette disposition.

### 14.8 Projection Markdown

Le JSON `PlanContract` est la source canonique.

Le Markdown est généré mécaniquement depuis ce contrat et embarque exactement :

`<KODJO_VNEXT_PLAN_CONTRACT_JSON> ... </KODJO_VNEXT_PLAN_CONTRACT_JSON>`

Toute différence entre la projection attendue et le Markdown consommé produit :

`VNEXT_PLAN_MARKDOWN_PROJECTION_DRIFT`

### 14.9 Réutilisation de l’existant

VNext-04 conserve les comportements qualifiés de :

- `verify-plan-contract-consistency.js` pour cohérence scope/tests/provenance ;
- `requirement-contract.js` candidat pour la séparation requirement/test/boundary ;
- les validations de paths et de scope existantes ;
- les bindings d’autorisation du handoff existant.

Ces mécanismes ne sont pas copiés tels quels lorsque leur modèle est incompatible avec le registre source-first VNext.

Ils sont absorbés dans le PlanContract canonique avec les identités VNext.

### 14.10 Gate PLAN_READY_FOR_REVIEW

Le gate est franchissable uniquement si :

- RequirementRegistry est READY ;
- ImpactGraph est lié au même RequirementRegistry et CandidateManifest ;
- chaque requirement possède exactement un plan_item ;
- tous ses impacts sont repris ;
- chaque changement possède un intent ;
- chaque changement est couvert par un test ;
- chaque changement est couvert par une preuve ;
- chaque test affecté est explicitement lié ;
- boundaries calculées sans contradiction ;
- la projection Markdown est strictement dérivable du JSON canonique.

La review reste interdite tant que ce gate n’est pas franchi.


## 15. VNext-05 — Atomicité UI

### 15.1 Contrat

VNext-05 introduit le contrat subordonné :

`kodjo.vnext.ui-criteria.v2`

Ce contrat est lié au `PlanContract` exact par `plan_contract_hash`.

Il ne constitue pas une seconde source de plan et ne peut créer aucune exigence.

La hiérarchie normative est :

`UI Requirement → Criterion → Atomic Assertions`

### 15.2 Source-first obligatoire

Un critère UI référence uniquement un `requirement_id` déjà présent dans le `RequirementRegistry`.

Le module d’atomicité ne contient aucun mécanisme permettant de créer ou déduire un Requirement depuis un Criterion ou une Assertion.

Tout changement UI du PlanContract doit être porté par un requirement de type `UI`.

Un changement UI porté uniquement par un requirement non-UI est bloquant.

### 15.3 Identités mécaniques

Le modèle ne fournit aucun `criterion_id` ni `assertion_id`.

La machine produit :

- `criterion_id = CRT-...`
- `assertion_id = AST-...`

à partir des identités causales, de l’énoncé, des preuves et des impacts couverts.

### 15.4 Critère UI

Chaque critère contient :

- `requirement_id`
- source dérivée du Requirement
- statement observable
- risk_types
- recherche de réutilisation
- décision REUSE / EXTEND / CREATE
- change_impact_ids
- proof_ids provenant du PlanContract
- assertions atomiques

Les chemins ne sont jamais fournis librement par l’IA.

Les cibles de changement sont exclusivement des `impact_id`.

La recherche de réutilisation référence uniquement des `candidate_id` existants correspondant à des candidats UI.

REUSE et EXTEND exigent que le composant sélectionné appartienne au périmètre réellement recherché.

CREATE interdit de prétendre sélectionner un composant existant.

### 15.5 Assertions atomiques

Types fermés :

- `PRESENCE`
- `CONTENT`
- `STATE`
- `GEOMETRY`
- `RELATION`
- `STYLE`
- `LAYERING`
- `INTERACTION`
- `RESPONSIVE`

Une assertion décrit une seule propriété observable.

Deux propriétés doivent être séparées dès qu’au moins une condition est vraie :

1. l’une peut échouer alors que l’autre passe ;
2. elles nécessitent des preuves différentes ;
3. elles peuvent être corrigées indépendamment.

L’atomicité porte sur les propriétés observables, pas sur les nodes Figma, composants React ou éléments techniques internes.

### 15.6 Sources normatives et non-invention

La source de chaque assertion est dérivée mécaniquement du Requirement parent.

Aucun path ou locator source supplémentaire n’est inventé par le modèle.

Règles :

- GEOMETRY / RELATION / STYLE / LAYERING / RESPONSIVE exigent une source d’autorité `VISUAL` ou `DECISION` ;
- INTERACTION exige une source d’autorité `FUNCTIONAL` ou `DECISION` ;
- PRESENCE / CONTENT / STATE exigent une preuve observable adaptée.

Une valeur visuelle absente de Figma ou d’une décision normative ne doit pas être inventée ; elle doit produire une clarification en amont du PlanContract.

### 15.7 Preuves

Les preuves du critère sont des `proof_id` déjà créés dans le PlanContract.

Une assertion ne peut utiliser qu’un sous-ensemble des preuves de son critère.

Le type de preuve est dérivé du PlanContract, jamais recréé librement.

Règles minimales :

- GEOMETRY / RELATION / STYLE / LAYERING / RESPONSIVE → `VISUAL_COMPARE`
- INTERACTION → `FUNCTIONAL_TEST` ou `STATIC_ANALYSIS`
- PRESENCE / CONTENT / STATE → au moins une preuve observable

Toutes les preuves du critère doivent être allouées à au moins une assertion.

### 15.8 Couverture des changements UI

Chaque `change_impact_id` UI du PlanContract doit être couvert par au moins un Criterion.

Chaque `change_impact_id` d’un Criterion doit être couvert par au moins une Assertion.

Aucune fermeture implicite n’est admise.

### 15.9 Réutilisation de #243

VNext-05 conserve de #243 :

- la taxonomie des propriétés atomiques ;
- la règle de preuve adaptée à la propriété ;
- l’obligation d’assertions pour les nouveaux plans UI ;
- la couverture des preuves du critère par les assertions ;
- la distinction REUSE / EXTEND / CREATE ;
- la compatibilité historique des anciens plans.

VNext-05 remplace cependant les identités libres et les paths recopiés par les IDs mécaniques VNext.

Le lecteur historique existant des matrices `kodjo.ui-criteria.v1` / candidate v2 reste inchangé tant que la migration VNext n’est pas activée.

### 15.10 Gate UI_ATOMICITY_READY

Le gate est franchissable uniquement si :

- le PlanContract exact est valide ;
- chaque changement UI possède un requirement UI ;
- chaque requirement UI modifié possède au moins un Criterion ;
- tous les changements UI sont couverts ;
- chaque Criterion possède au moins une Assertion ;
- toutes les preuves sont compatibles et allouées ;
- chaque Assertion possède une source normative compatible avec sa propriété ;
- tous les IDs sont mécaniques ;
- aucun path libre n’est introduit.

La review VNext ne peut pas déclarer un plan UI prêt tant que ce gate n’est pas franchi.


## 16. VNext-06 — Review commune INITIAL / REVISION

### 16.1 Contrats

VNext-06 introduit :

- `kodjo.vnext.review-context.v1`
- `kodjo.vnext.review-report.v1`

Le même moteur de review est utilisé en mode `INITIAL` et `REVISION`.

Le mode est une donnée du contexte ; il ne sélectionne pas deux implémentations différentes.

### 16.2 Ordre obligatoire

La review s’exécute en deux couches strictement ordonnées :

1. validations mécaniques ;
2. review sémantique indépendante.

La review sémantique ne peut être préparée que si tous les contrôles mécaniques sont `PASS`.

Les validations mécaniques rejouent au minimum :

- PlanningEnvelope ;
- RequirementRegistry ;
- CandidateManifest ;
- ImpactGraph ;
- DirectImportScan lorsqu’applicable ;
- PlanContract ;
- UI Atomicity lorsqu’un changement UI est présent.

Un plan UI sans contrat atomique est bloqué avant invocation du reviewer.

### 16.3 ReviewContext

Le contexte reviewer est scellé et contient les hashes exacts de :

- PlanningEnvelope ;
- RequirementRegistry ;
- CandidateManifest ;
- ImpactGraph ;
- DirectImportScan éventuel ;
- PlanContract ;
- UI Atomicity éventuel.

Il contient également un `target_catalog` calculé mécaniquement avec les IDs connus :

- SOURCE_UNIT
- REQUIREMENT
- IMPACT
- CANDIDATE
- PLAN_ITEM
- TEST
- PROOF
- CRITERION
- ASSERTION
- PLAN_CONTRACT

Le reviewer ne peut donc pas inventer librement une cible.

### 16.4 Sortie autorisée du reviewer

Le reviewer sémantique renvoie uniquement :

- category
- target_type
- target_id
- finding
- evidence
- required_correction
- dependency_target_ids

Il ne fournit jamais :

- verdict
- blocking
- finding_id
- reentry_stage

Tout champ supplémentaire est refusé.

### 16.5 Catégories fermées

- `MISSING_REQUIREMENT`
- `SOURCE_CONTRADICTION`
- `IMPACT_INCOMPLETE`
- `WRONG_TARGET`
- `PLAN_GAP`
- `TEST_GAP`
- `PROOF_GAP`
- `PRESERVATION_RISK`
- `UI_ASSERTION_GAP`
- `PRODUCT_AMBIGUITY`
- `TECHNICAL_RISK`
- `SUGGESTION`

Chaque catégorie possède une liste fermée de types de cible compatibles.

### 16.6 Identité et caractère bloquant

**Supersédé par VNext-07 pour l’identité inter-revues :** `finding_id` est calculé par la machine depuis les caractéristiques stables du finding, sans `review_context_hash` :

- category ;
- target_type ;
- target_id ;
- finding ;
- evidence ;
- required_correction ;
- dependency_target_ids.

Cette identité reste liée au `ReviewReport` exact par le contrat de report, tout en permettant de reconnaître le même défaut lors d’une revue suivante.

Toutes les catégories sont bloquantes sauf `SUGGESTION`.

Le reviewer ne choisit donc pas le caractère bloquant.

### 16.7 Réentrée mécanique

La réentrée minimale est calculée depuis la catégorie :

- MISSING_REQUIREMENT / SOURCE_CONTRADICTION → `REQUIREMENTS`
- IMPACT_INCOMPLETE / WRONG_TARGET → `IMPACT`
- PLAN_GAP / TEST_GAP / PROOF_GAP / PRESERVATION_RISK / UI_ASSERTION_GAP / TECHNICAL_RISK → `PLAN`
- PRODUCT_AMBIGUITY → `USER_DECISION`
- SUGGESTION → `NONE`

Le reviewer ne choisit jamais l’étape de réentrée.

### 16.8 Verdict mécanique

Le verdict est calculé :

- au moins un `PRODUCT_AMBIGUITY` → `CLARIFICATION_REQUIRED`
- sinon au moins un finding bloquant → `REVISE`
- sinon → `APPROVE`

Un texte libre `VERDICT: APPROVE` ou équivalent n’a aucune autorité dans VNext.

### 16.9 Structured output fail-closed

Le schéma de sortie reviewer est construit depuis le ReviewContext exact.

Les `target_id` autorisés sont limités aux IDs du `target_catalog`.

Sont bloquants avant calcul du verdict :

- finding mal formé ;
- catégorie inconnue ;
- cible inconnue ;
- type de cible incompatible avec la catégorie ;
- dépendance vers un ID inconnu ;
- doublon de finding calculé ;
- champ supplémentaire non autorisé.

### 16.10 Réutilisation de l’existant

VNext-06 conserve de la review actuelle :

- revue indépendante après contrôles déterministes ;
- replay de l’impact ;
- replay du plan ;
- replay du contrat UI ;
- séparation reviewer / auteur du plan.

VNext-06 réutilise de #250 :

- le principe de findings structurés ;
- l’identité stable des findings.

VNext-06 remplace :

- le verdict libre produit par Claude ;
- les targets textuelles libres ;
- le booléen `blocking` choisi par le reviewer ;
- la réentrée choisie sémantiquement.

### 16.11 Gate REVIEW_APPROVED

Le gate est franchi uniquement si :

- le ReviewContext est mécaniquement valide ;
- le ReviewReport est structurellement valide ;
- `verdict = APPROVE` calculé par la machine.

Aucun commentaire ou texte de reviewer ne peut contourner ce gate.


## 17. VNext-07 — Révision bornée

### 17.1 Contrats

VNext-07 introduit :

- `kodjo.vnext.allowed-change-set.v1`
- `kodjo.vnext.revision-patch.v1`
- `kodjo.vnext.revision-application.v1`
- `kodjo.vnext.revision-outcome.v1`

Le flux est :

`ReviewReport → AllowedChangeSet → RevisionPatch → RevisionApplication → réentrée minimale → reconstruction canonique → contrôle de préservation → nouvelle Review`

### 17.2 AllowedChangeSet

Le `AllowedChangeSet` est construit exclusivement par la machine à partir du `ReviewReport` exact et du graphe d’objets exact qui a été revu.

Il contient trois classes disjointes :

1. `authorized_targets` : cibles que la correction sémantique peut adresser ;
2. `derived_targets` : objets susceptibles d’être recalculés mécaniquement en aval ;
3. `preserved_targets` : objets qui doivent rester strictement identiques.

Chaque objet porte son `object_hash`.

Le graphe complet de départ est lui-même scellé par `base_target_graph_hash`.

### 17.3 Ancres immuables

`SOURCE_UNIT` et `CANDIDATE` sont des ancres immuables.

Un finding peut les utiliser pour autoriser l’ajout d’un objet manquant lors de la réentrée, mais cela :

- n’autorise pas la modification de l’ancre ;
- ne rend pas automatiquement ses descendants existants modifiables ;
- ne supprime aucune garantie de préservation sur les objets existants.

### 17.4 Dépendances dérivées

Une cible sémantiquement modifiable peut entraîner la reconstruction mécanique de ses descendants causaux.

Exemples :

- REQUIREMENT → IMPACT → PLAN_ITEM → TEST / PROOF → PLAN_CONTRACT ;
- IMPACT → PLAN_ITEM et dépendances du plan ;
- PLAN_ITEM → TEST / PROOF → PLAN_CONTRACT ;
- PROOF → Criterion / Assertion qui consomment cette preuve ;
- Criterion → Assertions.

Ces objets deviennent `MACHINE_DERIVED`, pas éditables librement par l’IA.

Une dépendance explicitement citée par le reviewer devient en revanche une cible autorisée, liée au finding causal.

### 17.5 Réentrée minimale

L’étape de réentrée est calculée depuis les findings bloquants.

Priorité :

1. `REQUIREMENTS`
2. `IMPACT`
3. `PLAN`

La réentrée la plus amont nécessaire l’emporte lorsqu’il existe plusieurs findings.

`PRODUCT_AMBIGUITY` ne produit pas un RevisionPatch : il reste `CLARIFICATION_REQUIRED` et nécessite une décision utilisateur.

### 17.6 Findings trop larges

Un finding ciblant directement `PLAN_CONTRACT` n’autorise jamais une reconstruction globale.

Il doit fournir des `dependency_target_ids` précis.

Sans cible dépendante explicite :

`VNEXT_REVISION_PLAN_ROOT_TOO_BROAD`

Le plan complet n’est jamais une autorisation de modification globale.

### 17.7 RevisionPatch

Le `RevisionPatch` ne contient pas de remplacement arbitraire de JSON canonique.

Le reviewer/correcteur fournit uniquement, pour chaque cible autorisée :

- `target_type`
- `target_id`
- `finding_ids`
- `correction` sémantique

La machine produit `correction_id`.

Le schéma ne permet pas :

- path libre ;
- nouvel ID libre ;
- verdict ;
- nouveau scope libre ;
- remplacement brut d’un contrat.

Chaque finding bloquant doit être couvert par au moins une correction.

Une cible absente du `AllowedChangeSet` est refusée.

### 17.8 Application mécanique du patch

L’application du patch produit un `RevisionApplication` fermé avec :

- étape de réentrée ;
- cibles éditables ;
- cibles uniquement dérivées par la machine ;
- hash des objets préservés ;
- corrections causales.

Le builder canonique de l’étape de réentrée reconstruit ensuite les contrats normaux VNext.

Il ne s’agit jamais d’un second modèle de données concurrent.

### 17.9 Identités stables nécessaires à la préservation

VNext-07 fixe deux dépendances révélées par la révision bornée :

- `finding_id` ne dépend plus du hash du ReviewContext ; le même finding sur la même cible conserve son identité entre deux revues ;
- `plan_item_id` dépend du `requirement_id`, pas des hashes globaux RequirementRegistry / ImpactGraph.

Ainsi, une correction locale ne renouvelle pas artificiellement les identités de tous les objets non concernés.

### 17.10 Contrôle de préservation après reconstruction

Après réentrée et reconstruction :

- chaque cible `PRESERVE_EXACT` doit encore exister ;
- son type doit être identique ;
- son `object_hash` doit être strictement identique.

Toute différence produit :

`PRESERVATION_REGRESSION`

Les objets nouveaux sont acceptés uniquement s’ils sont causalement rattachés à :

- une cible autorisée ;
- un descendant machine autorisé ;
- ou une nouvelle identité remplaçant un objet autorisé sous le même parent causal.

Tout nouvel objet sans cette causalité produit :

`VNEXT_REVISION_UNAUTHORIZED_NEW_TARGET`

### 17.11 Anti-loop

Après reconstruction et nouvelle review :

- si un `finding_id` bloquant précédent réapparaît → `REVISION_STALLED` ;
- si un nouveau finding bloquant cible un objet qui devait être préservé → `PRESERVATION_REGRESSION` ;
- si le verdict devient APPROVE → `RESOLVED` ;
- si de nouveaux findings légitimes apparaissent uniquement dans le périmètre autorisé/dérivé → `REVIEW_AGAIN` ;
- si une ambiguïté produit apparaît → `CLARIFICATION_REQUIRED`.

Aucune boucle automatique supplémentaire n’est déclenchée après `REVISION_STALLED`.

### 17.12 Réutilisation de l’existant

VNext-07 conserve de #251 :

- le principe de correction bornée après REVISE ;
- la conservation des décisions et sections non concernées ;
- l’interdiction de reconstruire opportunistement le plan.

VNext-07 conserve de #250 :

- le contrôle explicite des modifications ciblées ;
- la notion de findings structurés comme base d’autorisation.

VNext-07 remplace :

- la simple consigne textuelle de préservation ;
- la comparaison partielle de contrats ;
- la reconstruction complète suivie d’un contrôle tardif.

La préservation devient un contrat mécanique d’objets et de hashes.

### 17.13 Gate REVISION_READY

Le gate de sortie de révision est franchissable uniquement si :

- le ReviewReport causal vaut REVISE ;
- l’AllowedChangeSet est valide ;
- tous les findings bloquants sont couverts par le RevisionPatch ;
- aucune correction ne vise une cible non autorisée ;
- la réentrée a eu lieu à l’étape calculée ;
- tous les objets préservés sont inchangés ;
- aucun nouvel objet non causal n’est apparu ;
- la nouvelle review ne produit ni REVISION_STALLED ni PRESERVATION_REGRESSION.

La révision ne peut être considérée résolue que si la nouvelle review calcule `APPROVE`.


## 18. VNext-08 — Approbation utilisateur et handoff canonique

### 18.1 Contrats

VNext-08 introduit :

- `kodjo.vnext.approval-target.v1`
- `kodjo.vnext.approval-record.v1`
- `kodjo.vnext.execution-request.v1`

Le flux est :

`ReviewReport(APPROVE) → ApprovalTarget → action utilisateur explicite → ApprovalRecord → ExecutionRequest`

Aucun `ExecutionRequest` n'est produit directement depuis un plan ou un texte de reviewer.

### 18.2 Précondition d'approbation

Un `ApprovalTarget` ne peut être construit que si :

- PlanningEnvelope est valide ;
- RequirementRegistry et ImpactGraph sont rejoués mécaniquement et valides ;
- PlanContract est valide ;
- ReviewContext correspond exactement au PlanningEnvelope, RequirementRegistry, CandidateManifest, ImpactGraph et PlanContract courants ;
- ReviewReport correspond exactement au ReviewContext ;
- `verdict = APPROVE` ;
- `blocking_finding_count = 0` ;
- UI Atomicity est présent et valide lorsque le plan contient un changement UI ;
- les HEAD produit et applicatif observés correspondent toujours au PlanningEnvelope.

Tout écart bloque avant demande d'approbation.

### 18.3 Execution fingerprint

La machine dérive un `execution_core` unique contenant :

- slice_id ;
- issue_id ;
- baseline_head ;
- product_head ;
- application_head ;
- protocol_head ;
- planning_mode ;
- planning_envelope_hash ;
- direct_import_scan_hash éventuel ;
- plan_contract_hash ;
- review_context_hash ;
- review_report_hash ;
- ui_atomicity_hash éventuel ;
- operation_kind = IMPLEMENT ;
- write_scope ;
- preserve_scope ;
- forbidden_policy ;
- checks d'implémentation.

`execution_fingerprint = SHA256(canonical execution_core)`.

Le `write_scope` et le `preserve_scope` sont dérivés uniquement du PlanContract canonique.

Aucun scope ou path libre n'est accepté en entrée du handoff.

### 18.4 ApprovalTarget

L'objet à approuver porte :

- approval_target_id machine ;
- action_expected = `APPROVE_EXACT_EXECUTION` ;
- execution_fingerprint ;
- execution_core ;
- résumé de scope ;
- contract_hash.

L'identité du transport, du bouton ou du message n'entre pas dans l'identité métier de l'objet approuvé.

Un changement de lien d'approbation ne change donc pas l'ApprovalTarget.

### 18.5 Approbation explicite

L'ApprovalRecord exige une preuve d'action utilisateur vérifiée avec :

- decision = APPROVED ou REJECTED ;
- actor_id ;
- transport fermé ;
- evidence_ref ;
- approved_target_hash ;
- observed_at.

Transports reconnus dans ce lot :

- `GITHUB_REACTION`
- `GITHUB_COMMENT`
- `CHATGPT_ACTION`

L'evidence_kind canonique est `VERIFIED_USER_ACTION`.

Une action visant un autre hash est refusée.

Une décision REJECTED est durable mais n'autorise jamais le handoff.

### 18.6 Approbation obsolète

Avant handoff, la machine reconstruit l'ApprovalTarget depuis l'état courant.

L'objet reconstruit doit être strictement identique à l'objet approuvé.

Toute divergence produit :

`VNEXT_HANDOFF_APPROVAL_STALE`

Sont notamment invalidants :

- plan modifié ;
- review modifiée ;
- UI Atomicity modifié ;
- product_head modifié ;
- application_head modifié ;
- protocol_head modifié ;
- scope d'écriture ou de préservation modifié.

L'utilisateur n'approuve donc jamais « le plan en général » mais une exécution précise.

### 18.7 ExecutionRequest

L'ExecutionRequest est construit uniquement après validation de l'ApprovalRecord APPROVED.

Il recopie mécaniquement l'`execution_core` approuvé et ajoute :

- execution_request_id machine ;
- approval_target_hash ;
- approval_record_hash ;
- execution_fingerprint.

Le résultat doit être reconstructible bit-for-bit depuis les artefacts approuvés.

Toute divergence entre l'ExecutionRequest consommé et le résultat recalculé produit :

`VNEXT_EXECUTION_REQUEST_REBUILD_MISMATCH`

### 18.8 Fidélité du handoff

Le handoff ne peut :

- ajouter un path ;
- retirer un path ;
- changer un change_kind ;
- élargir le scope ;
- changer les checks ;
- modifier les HEAD ;
- substituer un plan ;
- substituer une review ;
- substituer une approbation.

Les boundaries du PlanContract restent l'unique source du scope d'implémentation.

### 18.9 Présentation actionnable

La projection utilisateur doit exposer au minimum :

- approval_target_id ;
- approval_target_hash ;
- execution_fingerprint ;
- application_head ;
- plan_contract_hash ;
- review_report_hash ;
- write_scope_count ;
- action_expected.

Lorsque le transport permet un lien direct, celui-ci est ajouté à la projection.

Le lien n'est pas une preuve d'approbation.

### 18.10 Réutilisation de l'existant

VNext-08 conserve du handoff V2 actuel :

- approbation utilisateur explicite ;
- identité utilisateur ;
- preuve externe d'approbation ;
- binding au plan/review exacts ;
- contrôle du HEAD applicatif ;
- autorisation structurée avant queue ;
- checks d'implémentation `jest / typescript / lint`.

VNext-08 remplace :

- l'approbation d'un commentaire contenant plusieurs identités dispersées ;
- la dépendance à un marqueur textuel `PLAN_HANDOFF_READY` comme source d'autorité ;
- l'autorisation fondée sur le seul blob du plan.

Le contrat canonique devient l'ApprovalTarget et son execution_fingerprint.

### 18.11 Compatibilité avec la queue existante

Ce lot ne modifie pas la Lean Queue active.

`kodjo.vnext.execution-request.v1` est l'autorisation canonique VNext.

L'adaptation vers le contrat de transport/queue actif est une projection de migration ultérieure et ne peut ni enrichir ni élargir l'autorisation canonique.

### 18.12 Gate USER_APPROVED

Le gate est franchi uniquement si :

- ApprovalTarget courant valide ;
- ApprovalRecord valide ;
- decision = APPROVED ;
- actor_id présent ;
- preuve vérifiée liée au hash exact ;
- état courant toujours identique à l'état approuvé.

### 18.13 Gate HANDOFF_READY

Le gate est franchi uniquement si :

- USER_APPROVED est acquis ;
- ExecutionRequest est reconstructible exactement ;
- execution_fingerprint identique à celui approuvé ;
- write_scope / preserve_scope / checks identiques ;
- aucun HEAD n'a dérivé.

Aucun message libre ne peut contourner ces gates.


## 19. VNext-09 — Assemblage end-to-end et migration sans élargissement

### 19.1 Objet

VNext-09 assemble les lots VNext-01 à VNext-08 en une chaîne exécutable unique et qualifie sa projection vers le transport Lean Queue actuel sans modifier les workflows actifs.

Le lot ne constitue pas l'activation.

Il produit un candidat de cutover démontré par E2E.

### 19.2 RuntimeSnapshot

Contrat :

`kodjo.vnext.runtime-snapshot.v1`

Le runtime valide, dans l'ordre :

1. ADMISSION
2. REQUIREMENTS
3. IMPACT
4. PLAN
5. REVIEW
6. REVISION
7. USER_APPROVAL
8. HANDOFF

Le snapshot contient :

- slice_id ;
- planning_mode ;
- application_head ;
- protocol_head ;
- terminal_state ;
- execution_request_hash ;
- execution_fingerprint ;
- statut et hashes de preuve de chaque étape ;
- chain_hash ;
- contract_hash.

Le terminal state acceptable de ce lot est uniquement :

`HANDOFF_READY`

### 19.3 INITIAL

En mode INITIAL :

- aucune donnée de Revision n'est autorisée ;
- l'étape REVISION vaut `NOT_APPLICABLE` ;
- tous les autres gates doivent être PASS / APPROVED / READY selon leur contrat.

### 19.4 REVISION

En mode REVISION, le runtime exige :

- AllowedChangeSet ;
- RevisionPatch ;
- RevisionOutcome ;
- `RevisionOutcome.status = RESOLVED` ;
- correspondance exacte avec base_plan_hash ;
- correspondance exacte avec base_review_hash ;
- causal_findings identiques aux blocking_finding_ids du cycle précédent ;
- nouvelle Review APPROVE.

Une REVISION sans preuve complète de résolution bornée ne peut atteindre HANDOFF_READY.

### 19.5 Validation par reconstruction

Le RuntimeSnapshot ne fait pas confiance aux hashes déclarés isolément.

Il rejoue ou reconstruit :

- PlanningEnvelope ;
- RequirementRegistry ;
- CandidateManifest ;
- DirectImportScan éventuel ;
- ImpactGraph ;
- PlanContract ;
- UI Atomicity éventuel ;
- ReviewContext ;
- ReviewReport ;
- ApprovalTarget ;
- ApprovalRecord ;
- ExecutionRequest.

Un snapshot re-signé avec un statut d'étape incompatible est refusé.

### 19.6 Projection vers la Lean Queue active

Contrat :

`kodjo.vnext.legacy-queue-projection.v1`

Cette projection est un adaptateur de transport uniquement.

Autorité canonique :

`VNEXT_EXECUTION_REQUEST`

Le transport legacy ne peut enrichir ni modifier l'autorisation VNext.

### 19.7 Scope de transport

La projection impose :

`legacy.scope_allow = executionRequest.write_scope[].path`

exactement, dans le même ordre canonique.

La projection impose également :

`legacy.checks = executionRequest.checks`

Toute différence produit respectivement :

- `VNEXT_QUEUE_SCOPE_WIDENING`
- `VNEXT_QUEUE_CHECK_DRIFT`

Aucun path libre supplémentaire n'est accepté.

### 19.8 HEAD et mode de transport

Pour une première implémentation issue de VNext :

- `legacy.mode = INITIAL`
- `legacy.operation_kind = IMPLEMENT`
- `legacy.session_id = null`
- `legacy.source_head = executionRequest.protocol_head`
- `legacy.baseline_head = executionRequest.baseline_head`

Le planning_mode VNext INITIAL/REVISION ne devient pas un RESUME_DELTA d'implémentation.

La sémantique RESUME_DELTA de la Lean Queue reste réservée aux reprises d'exécution existantes.

### 19.9 Artefacts de compatibilité

L'adaptateur produit trois projections déterministes :

- technical-plan.md ;
- independent-review.md ;
- implementation-mission.md.

Ces fichiers ne sont jamais la nouvelle source de vérité.

Ils portent l'identité de l'ExecutionRequest VNext.

Pour chaque fichier, la projection scelle :

- path ;
- Git blob OID ;
- content_sha256 ;
- contenu exact.

La validation recalcule le SHA-256 et le blob OID.

Un fichier re-signé mais modifié est refusé.

### 19.10 Approbation et transport legacy

Le transport legacy actuel exige une preuve GitHub par réaction.

La projection VNext-09 accepte donc uniquement un ApprovalRecord de transport :

`GITHUB_REACTION`

pour cette projection spécifique.

Cela ne réduit pas les transports admis par le contrat canonique VNext ; cela exprime uniquement une limitation du transport legacy actif.

L'evidence_ref de l'ApprovalRecord doit être causalement lié au gate_ref legacy.

### 19.11 Handoff legacy

La projection legacy produit un objet conforme au contrat actuel :

`kodjo.protocol.v2.lean-request.0.6.13`

avec :

- authorized_plan ;
- independent_review ;
- user_gate ;
- scope_allow ;
- checks ;
- provenance de tranche.

Le gated_reference legacy désigne le protocol_head pour rester compatible avec le vérificateur actif.

La preuve canonique d'approbation reste l'ApprovalRecord VNext et n'est pas remplacée par ce champ legacy.

### 19.12 Anti-régression canonique

Le fichier :

`.github/orchestration/KODJO_VNEXT_ANTI_REGRESSION_MATRIX.md`

dispose explicitement chacun des invariants canoniques `INV-001..INV-024`.

Dispositions fermées :

- CONSERVÉE
- REMPLACÉE_ÉQUIVALENTE
- SUPERSÉDÉE_EXPLICITEMENT
- NON_APPLICABLE_JUSTIFIÉE

Le registre historique reste autoritatif pour l'inventaire :

- 24 invariants ;
- 165 incidents ;
- 138 tests.

La qualification VNext-09 vérifie les cardinalités et l'absence de trou.

### 19.13 E2E obligatoire

VNext-09 doit démontrer au minimum :

1. INITIAL nominal jusqu'à HANDOFF_READY ;
2. projection Lean Queue sans élargissement ;
3. refus scope élargi ;
4. refus checks modifiés ;
5. refus fichier de compatibilité altéré ;
6. REVISION causale complète jusqu'à HANDOFF_READY ;
7. refus REVISION sans preuves de résolution ;
8. inventaire anti-régression 24 / 165 / 138.

### 19.14 Gate CUTOVER_CANDIDATE

VNext devient `CUTOVER_CANDIDATE` uniquement si :

- VNext-01 à VNext-08 restent qualifiés ;
- RuntimeSnapshot INITIAL E2E PASS ;
- RuntimeSnapshot REVISION E2E PASS ;
- projection legacy PASS ;
- anti-régression 24 / 165 / 138 PASS ;
- suite KODJO existante Linux PASS ;
- suite KODJO existante Windows PASS sur son périmètre ;
- aucun workflow actif n'est modifié par ce lot.

`CUTOVER_CANDIDATE` n'active pas VNext.

Le cutover reste un lot séparé.


## 20. VNext-10 — Préparation du cutover, coexistence et rollback

### 20.1 Objet

VNext-10 prépare le cutover sans activer VNext.

Ce lot :

- définit le contrat de cutover ;
- définit le routage LEGACY / VNEXT ;
- protège les cycles legacy en cours ;
- définit le rollback ;
- qualifie ces comportements ;
- ne modifie aucun workflow actif.

### 20.2 Contrats

VNext-10 introduit :

- `kodjo.vnext.cutover-plan.v1`
- `kodjo.vnext.cutover-activation.v1`
- `kodjo.vnext.cutover-rollback.v1`

### 20.3 CutoverPlan

Le CutoverPlan est construit depuis :

- HEAD candidat VNext qualifié ;
- PR candidate ;
- run de qualification ;
- registre d’activation legacy exact ;
- liste des slices legacy protégées.

Le plan scelle :

- legacy_registry_hash ;
- protected_legacy_slice_ids ;
- blocking_slice_ids ;
- grandfathered_legacy_slice_ids ;
- routing avant activation ;
- routing après activation ;
- activation_readiness.

Le plan de préparation porte obligatoirement :

`active_workflow_change_allowed = false`

### 20.4 PRE-1 comme précondition explicite

Pour le cutover préparé dans ce cycle :

`V2-PRE-1`

est une slice legacy protégée.

Tant que son statut dans le registre legacy n’est pas `CLOSED` :

`activation_readiness = BLOCKED_BY_ACTIVE_PROTECTED_SLICE`

et toute tentative de créer un ActivationRecord échoue.

La préparation de VNext-10 reste autorisée pendant PRE-1.

L’activation effective ne l’est pas.

### 20.5 Recalcul des bloqueurs

Le champ `activation_readiness` n’est jamais accepté sur confiance.

Avant activation, la machine :

1. relit le registre legacy courant ;
2. recalcule son hash ;
3. recalcule les slices protégées encore ouvertes ;
4. recalcule les slices legacy actives à grandfather ;
5. compare le tout au CutoverPlan.

Un CutoverPlan re-signé qui supprimerait artificiellement PRE-1 des bloqueurs est refusé.

### 20.6 Registre legacy dérivé

Si le registre legacy change entre préparation et activation :

`VNEXT_CUTOVER_LEGACY_REGISTRY_STALE`

Le cutover doit être reconstruit sur l’état courant.

Aucun nouveau cycle legacy apparu après la préparation ne peut être ignoré silencieusement.

### 20.7 Activation explicite

L’ActivationRecord exige :

- CutoverPlan READY_FOR_ACTIVATION ;
- registre legacy courant identique à celui qualifié ;
- approbation explicite ;
- actor_id ;
- evidence_ref ;
- approved_cutover_plan_hash exact ;
- activated_at_protocol_head.

L’activation porte :

`default_protocol = VNEXT`

mais ne déplace jamais les slices legacy existantes.

### 20.8 Coexistence

Après activation :

- toute slice déjà présente dans le registre legacy reste `LEGACY` ;
- toute slice listée grandfathered_legacy_slice_ids reste `LEGACY` ;
- une nouvelle slice non legacy est routée `VNEXT`.

Une slice ne change donc jamais de protocole en cours de cycle.

### 20.9 Routage avant activation

Avant ActivationRecord :

- existing legacy slice → LEGACY ;
- nouvelle slice → LEGACY.

Le simple fait que VNext soit CUTOVER_CANDIDATE ne change aucun routage.

### 20.10 Rollback

Le rollback exige :

- ActivationRecord valide ;
- CutoverPlan causal ;
- approbation explicite du rollback ;
- activation_hash exact ;
- rolled_back_at_protocol_head ;
- inventaire des slices VNext encore actives.

Après rollback :

- default_protocol = LEGACY ;
- une nouvelle slice est routée LEGACY ;
- une slice VNext déjà active reste VNEXT jusqu’à sa clôture.

Le rollback ne change donc pas non plus de protocole en cours de cycle.

### 20.11 Anti-tampering

Un ActivationRecord re-signé avec une liste grandfathered modifiée est refusé.

Un CutoverPlan re-signé avec des blockers modifiés est refusé.

Les décisions de routage utilisent uniquement des contrats validés et liés causalement.

### 20.12 État de préparation au 30 septembre 2026

Le registre legacy qualifié contient :

- `V2-PRE-1` : ACTIVE.

La préparation VNext-10 est donc attendue en état :

`BLOCKED_BY_ACTIVE_PROTECTED_SLICE`

avec :

`blocking_slice_ids = ["V2-PRE-1"]`

Cela est le comportement conforme tant que PRE-1 n’est pas clôturé.

### 20.13 Gate CUTOVER_PREPARED

Le gate `CUTOVER_PREPARED` est franchi si :

- VNext-09 est CUTOVER_CANDIDATE ;
- CutoverPlan valide ;
- PRE-1 présent comme slice protégée ;
- coexistence testée ;
- rollback testé ;
- anti-tampering testé ;
- aucun workflow actif modifié.

CUTOVER_PREPARED peut être acquis alors que l’activation reste bloquée par PRE-1.

### 20.14 Gate CUTOVER_ACTIVATABLE

Le gate `CUTOVER_ACTIVATABLE` n’est franchi que si :

- CUTOVER_PREPARED acquis ;
- toutes les slices protégées sont CLOSED ;
- registre legacy relu et identique au plan recalculé ;
- qualification VNext toujours valide sur le HEAD destiné au cutover ;
- approbation explicite de l’activation disponible.

Ce gate n’est pas attendu avant la clôture de PRE-1.

### 20.15 Hors périmètre

VNext-10 ne :

- modifie pas les triggers actifs ;
- modifie pas les workflows de planification actifs ;
- modifie pas la Lean Queue active ;
- modifie pas le runner ;
- ferme pas PRE-1 ;
- active pas VNext.

Le changement effectif de routage reste une opération ultérieure, exécutée seulement après PRE-1.


## 21. VNext-11 — Convergence de l’audit final

### 21.1 Objet

VNext-11 ajoute uniquement les protections nécessaires contre une boucle d’audit/correction non convergente.

Le lot ne transforme pas toutes les recommandations historiques en exigences.

Il introduit quatre garanties bloquantes :

1. un finding bloquant ne peut pas être fermé par simple disparition ;
2. un finding bloquant final doit être relié à une source normative préexistante ;
3. les critères de l’audit final sont figés avant l’appel indépendant ;
4. un dernier verdict REVISE est terminal et ne déclenche aucune nouvelle réentrée automatique.

### 21.2 FindingLedger

Contrat :

`kodjo.vnext.finding-ledger.v1`

Pour chaque finding bloquant d’une revue précédente, la revue suivante doit conduire à l’un des états explicites :

- `OPEN`
- `RESOLVED`
- `REFUTED_WITH_EVIDENCE`

Un finding absent de la revue suivante sans résolution explicite produit :

`VNEXT_LEDGER_FINDING_DISAPPEARED_WITHOUT_RESOLUTION`

Un finding qui persiste ne peut pas être déclaré résolu.

Le handoff REVISION exige désormais un FindingLedger valide et aucune entrée précédente encore OPEN.

### 21.3 AuditManifest figé

Contrat :

`kodjo.vnext.audit-manifest.v1`

Le manifeste scelle avant l’audit final :

- candidate_head ;
- protocol_spec_hash ;
- références normatives ;
- critères d’audit ;
- applicabilité de chaque critère ;
- références causales de création.

Les critères ne peuvent pas être ajoutés, retirés ou requalifiés pendant l’audit sans produire un nouveau manifeste et donc un nouvel objet d’audit.

### 21.4 AuditCoverage

Contrat :

`kodjo.vnext.audit-coverage.v2`

Chaque critère du manifeste apparaît exactement une fois avec l’un des statuts :

- `CHECKED_PASS`
- `CHECKED_FAIL`
- `NON_VERIFIABLE`
- `NOT_APPLICABLE`

Un critère `REQUIRED` ne peut pas devenir `NOT_APPLICABLE` pendant l’audit.

Un critère déclaré `NOT_APPLICABLE` dans le manifeste ne peut pas être réintroduit silencieusement comme critère bloquant.

Toute absence d’un critère produit :

`VNEXT_AUDIT_CRITERION_UNCOVERED`

### 21.5 Provenance normative des findings

Le rapport d’audit final enrichit chaque finding avec :

- `normative_reference_ids`
- `audit_criterion_ids`

Pour toute catégorie autre que `SUGGESTION`, au moins une référence normative préexistante du manifeste est obligatoire.

Sans cette provenance :

`VNEXT_FINAL_AUDIT_BLOCKING_FINDING_WITHOUT_NORMATIVE_SOURCE`

Une proposition sans fondement normatif nécessaire doit être classée `SUGGESTION`.

`SUGGESTION` reste non bloquante.

### 21.6 Critère échoué et finding

Tout critère `CHECKED_FAIL` doit être relié à au moins un finding.

Un audit ne peut donc pas publier un axe échoué sans expliquer la règle, la cible et la correction requise.

### 21.7 Rapport d’audit final

Contrat :

`kodjo.vnext.final-audit-report.v1`

Le rapport lie exactement :

- AuditManifest ;
- AuditCoverage ;
- ReviewContext ;
- ReviewReport ;
- provenance normative de chaque finding.

La validation recalcule la correspondance entre ReviewReport et provenance.

Une provenance modifiée puis re-signée est refusée.

### 21.8 États terminaux

L’audit indépendant final produit uniquement :

- `FINAL_APPROVED`
- `FINAL_PROOF_UNAVAILABLE_TERMINAL`
- `FINAL_REVISE_TERMINAL`
- `FINAL_CLARIFICATION_TERMINAL`

Le champ :

`reentry_allowed = false`

est obligatoire.

Un `FINAL_REVISE_TERMINAL` n’autorise pas un nouvel audit automatique.

Toute correction ultérieure éventuelle constitue un nouveau candidat et nécessite une nouvelle décision explicite de pilotage ; elle n’est pas une continuation automatique de la même boucle.

### 21.9 Recommandations non transformées en gates

VNext-11 ne rend pas obligatoires :

- la classification détaillée de la raison d’une découverte tardive ;
- un registre narratif lourd des occurrences ;
- une métrique de diminution du nombre de findings ;
- un nombre maximal arbitraire de défauts.

Ces éléments peuvent rester des informations de diagnostic.

### 21.10 Validations encore requises avant cutover

Deux validations restent nécessaires hors de ce lot :

1. E2E réel jetable du protocole et du transport ;
2. audit indépendant final sur le candidat figé et son AuditManifest.

### 21.11 Gate AUDIT_CONVERGENCE_READY

Le gate est franchi si :

- FindingLedger interdit la fermeture par disparition ;
- provenance normative bloquante testée ;
- AuditManifest figé testé ;
- AuditCoverage exhaustive testée ;
- FINAL_REVISE_TERMINAL testé ;
- aucune réentrée automatique finale possible ;
- non-régression VNext-01..10 PASS.

Ce gate ne vaut ni audit final ni activation.


## 22. VNext-F01 — Sécurité des écritures distantes avant VNext-12

### 22.1 Objet

Ce lot ferme le risque F-01 identifié lors de l'audit indépendant de PR #250 sans modifier le protocole actif.

Le risque traité est le suivant :

- une capacité d'écriture distante peut exister dans un workflow dont le nom ne correspond pas au préfixe historiquement scanné ;
- une nouvelle écriture ajoutée à cette surface pourrait alors échapper au contrôle statique.

La protection VNext ne repose donc sur aucun préfixe de nom de workflow.

### 22.2 Surface inventoriée

Le contrôle VNext inspecte systématiquement :

- tous les fichiers `.github/workflows/*.yml|yaml` ;
- tous les scripts exécutables sous `scripts/kodjo/**` de type JS/CJS/MJS/PS1/SH.

Le nom du workflow n'intervient jamais comme critère d'inclusion.

Le scanner relève notamment :

- permissions GitHub `*: write` ;
- `persist-credentials: true` ;
- credentials Git via `extraheader` ;
- commit/push/tag/update-ref/merge/rebase/cherry-pick ;
- actions de commit/PR connues ;
- écritures REST explicites sur `/contents` et Git data.

Cette analyse est statique et conservatrice. Elle ne prétend pas reconnaître tout code arbitraire, dynamique, téléchargé ou obfusqué.

### 22.3 RemoteWritePolicy

Source canonique :

`.github/orchestration/KODJO_VNEXT_REMOTE_WRITE_POLICY.json`

Schéma :

`kodjo.vnext.remote-write-policy.v1`

Deux régimes sont autorisés.

#### Legacy figé

Pendant la coexistence :

- chaque workflow/script legacy est lié à son Git blob OID exact ;
- toute modification de cette surface produit `VNEXT_REMOTE_WRITE_FROZEN_PRODUCER_DRIFT` ;
- aucune nouvelle capacité d'écriture ne peut donc être ajoutée silencieusement à un writer legacy.

Cette règle est transitoire et ne constitue pas une autorisation permanente VNext.

#### Writer VNext déclaré

Tout nouveau writer VNext doit déclarer explicitement :

- producteur ;
- Git blob OID exact ;
- condition d'autorisation ;
- job autorisé ;
- capacité ;
- destination ;
- scope de permission.

Une capacité observée absente de cette déclaration produit :

`VNEXT_REMOTE_WRITE_UNDECLARED_CAPABILITY`

Un producteur non déclaré produit :

`VNEXT_REMOTE_WRITE_UNDECLARED_PRODUCER`

### 22.4 Permissions et credentials

Pour un writer VNext :

- toute permission d'écriture doit être bornée au job déclaré ;
- une permission `write` au niveau workflow est interdite ;
- les credentials d'écriture ne doivent pas être exposés à un agent qui n'en a pas besoin ;
- toute capacité credential détectée doit être comprise dans la politique exacte du producteur.

Les surfaces legacy peuvent conserver leurs permissions historiques uniquement tant qu'elles restent figées et nécessaires à une slice legacy active.

### 22.5 Attestation

Contrat :

`kodjo.vnext.remote-write-attestation.v2`

États :

- `PASS_WITH_FROZEN_LEGACY`
- `PASS_RETIRED`
- `FAIL`

Pendant la coexistence, `PASS_WITH_FROZEN_LEGACY` est acceptable uniquement si au moins une slice legacy reste ACTIVE.

Lorsque toutes les slices legacy sont CLOSED :

- tout ancien workflow/script possédant encore une capacité d'écriture produit `VNEXT_REMOTE_WRITE_LEGACY_WRITER_NOT_RETIRED` ;
- l'attestation devient FAIL ;
- le cutover ne peut pas être considéré propre tant que ces writers ne sont pas retirés ou neutralisés.

### 22.6 Gate de cutover

Le CutoverPlan lie désormais exactement :

- `remote_write_security_hash`
- `remote_write_security_status`

Un CutoverPlan est refusé si l'attestation vaut FAIL.

Si des slices legacy sont encore actives :

`remote_write_security_status = PASS_WITH_FROZEN_LEGACY`

Si aucune slice legacy n'est active :

`remote_write_security_status = PASS_RETIRED`

Le passage artificiel d'un état à l'autre sans retrait effectif est donc refusé.

### 22.7 Retrait legacy

Règle :

`REMOVE_OR_DISABLE_ALL_LEGACY_WRITERS_AFTER_LAST_LEGACY_SLICE`

Après fermeture de la dernière slice legacy :

- les anciens workflows writers ne peuvent plus rester déclenchables ;
- leurs mécanismes de reprise/rerun ne peuvent pas rester un chemin d'écriture actif ;
- une simple absence de routage nominal ne suffit pas ;
- la preuve de retrait fait partie du gate de sécurité.

### 22.8 Tests obligatoires

Le lot doit démontrer :

1. workflow au nom arbitraire + write non déclaré → FAIL ;
2. script sous `scripts/kodjo` + push non déclaré → FAIL ;
3. REST repository write non déclaré → FAIL ;
4. writer legacy exact → accepté seulement pendant coexistence ;
5. modification d'un legacy figé → FAIL ;
6. writer VNext déclaré job/destination/condition exacts → PASS ;
7. permission workflow-level write VNext → FAIL ;
8. dernière slice legacy fermée avec anciens writers encore présents → FAIL ;
9. dépôt VNext courant entièrement inventorié sans filtre de préfixe.

### 22.9 Gate F01_REMOTE_WRITE_READY

Le gate est acquis seulement si :

- RemoteWritePolicy valide ;
- attestation PASS pour l'état legacy courant ;
- tests positifs et négatifs PASS ;
- CutoverPlan lie l'attestation exacte ;
- aucune modification du protocole actif n'a eu lieu.

Ce gate est requis avant VNext-12.

Il ne signifie pas encore que F-01 est sans objet : F-01 devient effectivement sans objet uniquement après `PASS_RETIRED`, c'est-à-dire après retrait des derniers writers legacy.

## 23. Complément ciblé PRE-1 — preuve indisponible et stabilité

Ce complément ne modifie pas PRE-1 ni les dispositions #250/#252. Référence
et preuves : [couverture ciblée](KODJO_VNEXT_PRE1_COVERAGE.md). Les garanties
contractuelles ci-dessous ne constituent pas un E2E VNext qualifié.

### 23.1 Taxonomie et gates

`ProofResult` distingue PASS, FAIL démontré et NON_VERIFIABLE. Une syntaxe de
résolution non prise en charge impose NON_VERIFIABLE, même si le producteur
propose PASS ou FAIL. Pour une preuve requise par le gate : FAIL exige une
correction causale ; NON_VERIFIABLE attend la preuve ; PASS autorise ce
contrôle seulement. Une preuve non requise reste visible sans bloquer ce gate.
Aucun retry automatique n'est induit.

`AuditCoverage v2` ajoute NON_VERIFIABLE et `unavailable_criterion_ids`.
La qualification finale ne peut être FINAL_APPROVED avec un critère requis
NON_VERIFIABLE. Elle devient FINAL_PROOF_UNAVAILABLE_TERMINAL si aucun défaut
ni ambiguïté n'impose déjà une autre issue terminale. Elle n'invente aucun
finding applicatif pour expliquer une certification indisponible.

### 23.2 Registre cumulatif et réserves

Le registre cumulatif conserve les sujets même absents d'une revue ciblée.
L'identité règle+cible ne dépend pas du wording. Chaque observation porte
classe, gravité générale, nécessité pour le gate, hashes cible/norme/critère,
évidences et justification. Nouvelle formulation seule ne suffit pas à
requalifier un objet inchangé comme bloquant ou comme défaut démontré.

Une réouverture est causale : changement de cible, règle/critère applicable,
preuve nouvelle ou phase différente. Ses raisons sont conservées. Une réserve
acceptée persiste dans le même contexte ; son acceptation ne vaut pas
résolution. Le propriétaire identifié à l'admission est seul habilité à
accepter/révoquer ; l'authentification de transport doit vérifier cet acteur.
RESOLVE exige une nouvelle observation SUCCESS et une évidence de fermeture.
Le gate ACCEPTED_WITH_RESERVES conserve les défauts et n'écrit jamais APPROVE.

La limite de reprise est une entrée explicite figée du cycle. À épuisement,
aucune réentrée automatique. Un audit final reste terminal comme en §21.

### 23.3 Producteur, CI et retrait

Tout producteur VNext doit recevoir les règles de tous ses consommateurs,
ou utiliser une construction mécanique équivalente. `buildProducerPacket`
embarque les sources et hashes de leur fermeture CommonJS locale, les inputs
et le schéma ; dépendances dynamiques/externes non couvertes sont refusées,
pas déclarées exhaustives. JSON UTF-8 transporté en LF ou CRLF conserve les
objets canoniques. `buildReviewerPacket` expose cette chaîne pour la review.
Le raccordement de tous les appels IA reste un travail d'intégration à prouver.

La CI VNext dédiée couvre tous les chemins workflows/orchestration/scripts/
tests et règles AI sans exclusions tacites. Elle ne supprime aucun contrôle
historique pendant la coexistence. Tout contrôle historique absent de la
chaîne VNext doit avoir une disposition de responsabilité explicite.

`RemoteWriteAttestation v2` ne peut être PASS_RETIRED par seule absence de
fichiers. Sans observation de retrait, elle échoue NON VERIFIABLE : inventaire
GitHub complet/paginé, zéro run pending et barrière prouvée contre rerun/replay
pour toutes les surfaces workflow figées. L'observation est liée au hash de
policy. Le collecteur doit produire une observation actuelle au gate réel ;
une fixture locale ne prouve pas le retrait effectif.

### 23.4 Audit d'architecture anticipé

La [mission dédiée](KODJO_VNEXT_ARCHITECTURE_AUDIT_MISSION.md) cherche les trous
architecturaux, distingue défaut/preuve manquante/recommandation/préférence,
et n'est ni l'audit final ni un préalable supplémentaire au développement
PRE-1. Son rapport en lecture seule ne crée aucune exigence automatiquement.

### 23.5 Fermeture ciblée de l’audit architecture du 30 septembre

Rapport source : [audit anticipé](reports/2026-09-30_VNEXT_ARCHITECTURE_36719499021_1.md),
HEAD `a0e7379e166ec899180a186361f41123360ff908`, run `36719499021`,
artefact `11101687312`. La réussite du job signifie rapport livré, pas architecture approuvée.

Le runtime confronte CandidateManifest et DirectImportScan aux objets Git du HEAD
applicatif observé ; il reconstruit RevisionOutcome avec les artefacts avant/après.
Le handoff et l’audit final reconstruisent ReviewContext à partir des artefacts.
L’audit final refuse un candidate_head différent du HEAD protocolaire du dossier.
L’applicabilité UI provient des requirements UI source-first, avec un garde
de chemins conservateur supplémentaire désormais porté par VNext.

Toute modification de classification, gravité ou nécessité au gate exige une
cause explicite. Les phases utilisent le vocabulaire fermé des étapes et des
gates FINAL_AUDIT/CUTOVER. Le runtime exige le registre cumulatif lié à son lot,
HEAD et phase HANDOFF ; en REVISION, le compteur progresse d’une unité et la
limite ne change pas. Ces contrôles locaux ne prouvent pas l’authentification
GitHub ni l’existence d’un collecteur opérationnel.

Conséquence dérivée de §23.1 et des champs critiques VERIFIED du protocole
AI_ORCHESTRATION : accepter la conservation d’une preuve obligatoire indisponible
comme réserve ne ferme pas sa preuve. Le gate reste WAIT_FOR_PROOF. Aucun
ACCEPTED_WITH_RESERVES ne remplace cette obligation ni l’audit final terminal.

Les octets des projections canoniques restent LF. Un fichier Markdown converti
en CRLF est refusé par l’égalité exacte ; les transports JSON LF/CRLF conservent
les valeurs JSON. Les adaptateurs de publication doivent conserver ces octets
sans filtres Git implicites. Aucune normalisation globale du dépôt n’est prescrite.

Le [rapport de fermeture ciblée](reports/2026-09-30_VNEXT_ARCHITECTURE_CLOSURE.md)
distingue corrections contractuelles, preuves d’intégration encore absentes et
réserves avant cutover. Il ne vaut ni VNext-12 ni audit final.

### 23.6 Matérialisation avant approbation et admission vérifiée

Les fichiers de transport plan/revue/mission sont préparés à partir des
artefacts canoniques validés, puis versionnés avant l’approbation du commit
protocolaire exact. Ils portent le hash du PlanContract ; la revue porte
également le hash du ReviewReport. Ils ne contiennent pas l’ExecutionRequest
postérieur, qui dépend du commit et de l’ApprovalRecord. Le lien exact vers
l’ExecutionRequest reste dans la projection canonique scellée et son guard.
Cette séparation évite de demander à un commit de contenir son propre hash.

Le point d’entrée `vnext-queue-admission.verifyQueueAdmission` est en lecture
seule. Il reconstruit runtime et projection, compare la demande, lit les trois
fichiers via les objets Git du commit approuvé et appelle le consommateur
`verify-authorizations.js`. Le commentaire GitHub doit aussi porter le hash
exact de l’ApprovalTarget. La réaction du propriétaire doit être postérieure
ou égale à la dernière édition du commentaire et antérieure ou égale à
l’observation d’approbation. Une réaction conservée après modification de
l’objet soumis ne vaut donc pas nouvelle approbation. Le client de production
effectue des lectures GitHub authentifiées, sans fallback hors ligne.

La préparation et l’admission sont testées en dépôt jetable avec un client
GitHub de fixture. Leur raccordement à un producteur/workflow réel, au runner,
au contrat downstream d’implémentation et aux preuves de chaque responsabilité
reste requis avant VNext-12. Ces tests n’autorisent aucune queue réelle.

La couverture historique contient toutes les unités de prose et les formats
de référence de la source normative. La readiness exige des preuves par sujet,
résolues au candidat exact par le consommateur ; des flags CONFORME seuls ne
constituent pas une certification. La classification des clauses identifie
responsabilité et phase sans promouvoir un résultat historique en PASS VNext.
