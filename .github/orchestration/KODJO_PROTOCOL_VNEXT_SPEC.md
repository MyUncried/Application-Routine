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
- `kodjo.vnext.approval-record.v1`
- `kodjo.vnext.execution-request.v1`

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

`finding_id` est calculé par la machine depuis :

- review_context_hash ;
- category ;
- target_type ;
- target_id ;
- finding ;
- evidence ;
- required_correction ;
- dependency_target_ids.

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
