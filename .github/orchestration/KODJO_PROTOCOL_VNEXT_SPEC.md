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
