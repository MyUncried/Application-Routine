# KODJO VNext — Change Report VNext-10

## Objet

Préparer le cutover VNext sans l’activer avant la clôture de PRE-1.

Ce lot est explicitement **non actif**.

## État courant vérifié

Le registre legacy `.github/orchestration/v2-activation-registry.json` contient actuellement :

- `V2-PRE-1` : `ACTIVE`
- Issue : `#249`
- bootstrap : `.github/orchestration/v2-slices/V2-PRE-1/slice-bootstrap.json`

Conséquence attendue :

- CutoverPlan constructible ;
- `activation_readiness = BLOCKED_BY_ACTIVE_PROTECTED_SLICE` ;
- `blocking_slice_ids = ["V2-PRE-1"]` ;
- activation effective interdite.

## Ajouts

- `scripts/kodjo/lib/vnext-cutover-contract.js`
  - `kodjo.vnext.cutover-plan.v1` ;
  - `kodjo.vnext.cutover-activation.v1` ;
  - `kodjo.vnext.cutover-rollback.v1` ;
  - recalcul des bloqueurs depuis le registre legacy courant ;
  - refus d’un registre ayant dérivé depuis la préparation ;
  - approbation explicite liée au CutoverPlan exact ;
  - coexistence LEGACY / VNEXT sans changement de protocole en cours de cycle ;
  - rollback avec grandfathering des slices VNext déjà actives.

- `tests/kodjo/vnext-cutover-preparation.pilot.js`
  - PRE-1 actif bloque l’activation ;
  - préparation non active autorisée ;
  - avant activation : toutes les slices → LEGACY ;
  - PRE-1 CLOSED rend le plan READY ;
  - approbation exacte obligatoire ;
  - registre dérivé refusé ;
  - slices legacy existantes restent LEGACY après activation ;
  - nouvelles slices → VNEXT après activation ;
  - aucun changement de protocole en cours de cycle ;
  - CutoverPlan re-signé sans blocker refusé ;
  - ActivationRecord re-signé avec grandfathering falsifié refusé ;
  - rollback → nouvelles slices LEGACY ;
  - slices VNext déjà actives restent VNEXT après rollback ;
  - rollback lié à l’activation exacte.

- `.github/orchestration/KODJO_PROTOCOL_VNEXT_SPEC.md`
  - section normative VNext-10 ;
  - PRE-1 explicité comme précondition de cutover ;
  - gates CUTOVER_PREPARED / CUTOVER_ACTIVATABLE.

## Routage préparé

### Avant activation

- slice legacy existante → LEGACY
- nouvelle slice → LEGACY

### Après activation

- slice déjà présente dans le registre legacy → LEGACY
- nouvelle slice → VNEXT

### Après rollback

- slice VNext déjà active → VNEXT jusqu’à clôture
- nouvelle slice → LEGACY

## Protection PRE-1

V2-PRE-1 est explicitement inclus dans `protected_legacy_slice_ids`.

Tant qu’il n’est pas CLOSED, la machine doit refuser l’ActivationRecord.

Aucune modification de PRE-1 n’est réalisée par VNext-10.

## Rollback

Le rollback est préparé mais non déclenché.

Il exige :
- ActivationRecord exact ;
- approbation explicite ;
- activation_hash exact ;
- HEAD protocolaire de rollback ;
- liste des slices VNext encore actives.

Il ne doit jamais interrompre un cycle VNext déjà commencé.

## Hors périmètre

VNext-10 ne modifie :
- aucun workflow actif ;
- aucun trigger ;
- aucune Lean Queue active ;
- aucun runner ;
- aucun code applicatif ;
- aucun statut de PRE-1.

VNext-10 ne réalise aucune activation.

## Gate

Le lot est qualifié si :
- le comportement courant PRE-1 ACTIVE produit bien un cutover BLOCKED ;
- la simulation PRE-1 CLOSED produit READY_FOR_ACTIVATION ;
- coexistence et rollback passent ;
- anti-tampering passe ;
- VNext-01..09 restent verts ;
- suite KODJO Linux reste verte ;
- suite KODJO Windows reste verte sur son périmètre ;
- diff strictement borné aux fichiers VNext-10 et à la spec.

Le résultat attendu de ce lot est :

`CUTOVER_PREPARED`

et non `CUTOVER_ACTIVATED`.
