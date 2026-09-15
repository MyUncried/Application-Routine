[KODJO_V2] PLAN_OUTPUT
slice_id=V2-BILAT-01
bootstrap_path=.github/orchestration/v2-slices/V2-BILAT-01/slice-bootstrap.json
source_head=ef0bf111195d67f6223ee4844da2b6bf2aca00d2
protocol_execution_head=afb608a4f6872d9b8d60caa70b883ff449c062cb
application_pr=131
application_head=df38ade5e8737ed8f59a3a7472ebe9b168a85145
supersedes_plan_blob_oid=07707548809b091cff7a32dfd40e079126b86924
prior_review_blob_oid=1282a3b45e2329c47d867d6921f82b853e589ace
planning_contract=kodjo.plan-impact.v1
STATUT : PLAN_READY_FOR_INDEPENDENT_REVIEW

# Plan technique final — KODJO V2-BILAT-01

## 1. Statut et objectif

- Tranche : `V2-BILAT-01`
- Mode : `PLAN_ONLY`
- Implémentation autorisée : non
- PR applicative : `#131`
- Objet : correction bornée de la présentation de la bilatéralité déjà implémentée.
- La correction reste strictement présentationnelle.
- Aucun calcul, modèle, service métier, repository, migration, persistance ou comportement T03 n’est réouvert.
- Aucun manifeste V1 n’est créé, utilisé ou réutilisé.
- Aucun nouveau fichier n’est créé et aucun fichier n’est supprimé.

La revue indépendante du scan déterministe des imports directs est traitée ci-dessous. Les trois consommateurs détectés restent hors périmètre de modification.

<KODJO_PLAN_IMPACT_JSON>
{
  "schema": "kodjo.plan-impact.v1",
  "scan_revision": "df38ade5e8737ed8f59a3a7472ebe9b168a85145",
  "modified_modules": [
    {
      "path": "src/features/sessions/CompositionScreen.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/features/sessions/ExerciseScreen.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/features/sessions/SideModeControl.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/features/sessions/__tests__/CompositionScreen.test.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/features/sessions/__tests__/ExerciseScreen.test.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/features/sessions/__tests__/SideModeControl.test.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/features/sessions/__tests__/compositionPresentation.test.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/features/sessions/compositionPresentation.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/shared/i18n/index.test.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/shared/i18n/resources/fr.ts",
      "change": "MODIFY"
    }
  ],
  "scan_sha256": "9f4967a65b42328cf65d995a3e96ee5cf31dd7e975468425147ff4b3dd929f44",
  "rows": [
    {
      "path": "src/features/sessions/CompositionScreen.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/features/sessions/ExerciseScreen.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/features/sessions/SideModeControl.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/features/sessions/__tests__/CompositionScreen.test.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/features/sessions/__tests__/ExerciseScreen.test.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/features/sessions/__tests__/SideModeControl.test.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/features/sessions/__tests__/compositionPresentation.test.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/features/sessions/compositionPresentation.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/shared/i18n/index.test.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/shared/i18n/resources/fr.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "app/(creation)/composition.tsx",
      "candidate_kind": "CONSUMER",
      "triggered_by": [
        "src/features/sessions/CompositionScreen.tsx"
      ],
      "risk_score": 0,
      "classification": "CONSUMER_UNAFFECTED",
      "justification": "Le contrat de route et les propriétés consommées par CompositionScreen restent inchangés ; la correction porte uniquement sur la présentation interne de l’écran."
    },
    {
      "path": "app/(creation)/exercise.tsx",
      "candidate_kind": "CONSUMER",
      "triggered_by": [
        "src/features/sessions/ExerciseScreen.tsx"
      ],
      "risk_score": 0,
      "classification": "CONSUMER_UNAFFECTED",
      "justification": "Le contrat de route reste inchangé et ExerciseScreen conserve son interface publique ; seul le contexte d’héritage déjà calculé est transmis à la présentation interne."
    },
    {
      "path": "src/shared/i18n/index.ts",
      "candidate_kind": "CONSUMER",
      "triggered_by": [
        "src/shared/i18n/resources/fr.ts"
      ],
      "risk_score": 0,
      "classification": "CONSUMER_UNAFFECTED",
      "justification": "Le chargeur i18n générique, ses clés et sa structure restent inchangés ; les nouvelles valeurs sont limitées à la ressource française fr.ts."
    }
  ],
  "scope_allow": [
    "src/features/sessions/CompositionScreen.tsx",
    "src/features/sessions/ExerciseScreen.tsx",
    "src/features/sessions/SideModeControl.tsx",
    "src/features/sessions/__tests__/CompositionScreen.test.tsx",
    "src/features/sessions/__tests__/ExerciseScreen.test.tsx",
    "src/features/sessions/__tests__/SideModeControl.test.tsx",
    "src/features/sessions/__tests__/compositionPresentation.test.ts",
    "src/features/sessions/compositionPresentation.ts",
    "src/shared/i18n/index.test.ts",
    "src/shared/i18n/resources/fr.ts"
  ]
}
</KODJO_PLAN_IMPACT_JSON>

## 2. Périmètre de modification

Les modules suivants sont les seuls modules applicatifs et de test prévus pour modification :

- `src/features/sessions/CompositionScreen.tsx`
- `src/features/sessions/ExerciseScreen.tsx`
- `src/features/sessions/SideModeControl.tsx`
- `src/features/sessions/__tests__/CompositionScreen.test.tsx`
- `src/features/sessions/__tests__/ExerciseScreen.test.tsx`
- `src/features/sessions/__tests__/SideModeControl.test.tsx`
- `src/features/sessions/__tests__/compositionPresentation.test.ts`
- `src/features/sessions/compositionPresentation.ts`
- `src/shared/i18n/index.test.ts`
- `src/shared/i18n/resources/fr.ts`

Les éléments suivants restent explicitement inchangés :

- `src/domain/sessions/*`
- `src/infrastructure/database/*`
- `src/features/sessions/DecisionDialog.tsx`
- `src/features/sessions/formatSessionSummary.ts`
- `src/shared/i18n/index.ts`
- `src/shared/ui/tokens.ts`
- `app/(creation)/composition.tsx`
- `app/(creation)/exercise.tsx`
- toutes les migrations ;
- tous les modules d’Exécution, de Plan, de Résultat et d’Historique ;
- toute route ;
- tout manifeste ;
- toute documentation fonctionnelle.

## 3. Constat technique

### `SideModeControl.tsx`

Le contrôle est partagé entre :

- le contrôle de côté d’une Activité ;
- le contrôle de direction du Tour.

Le comportement actuel commun doit être conservé par défaut pour l’Activité :

- `UNILATERAL` : affichage vide ;
- `RIGHT_LEFT` : `D→G` ;
- `LEFT_RIGHT` : `G→D`.

Le contexte Tour est ajouté de manière optionnelle afin de permettre :

- `UNILATERAL` : affichage `–` ;
- conservation de `D→G` et `G→D` ;
- labels accessibles propres au Tour ;
- espacement interne réduit localement pour éviter la troncature dans `42 × 34 pt`.

Le comportement Activité par défaut ne doit pas changer.

### `CompositionScreen.tsx`

L’écran contient déjà :

- le contrôle du Tour ;
- la condition d’ouverture du dialogue ;
- l’appel à `DecisionDialog` ;
- le rendu des cartes d’Activité ;
- l’indicateur court de direction.

Les corrections portent sur :

- les textes exacts du dialogue ;
- le rendu `–` du Tour unilatéral ;
- la visibilité complète des directions courtes ;
- le positionnement de l’indicateur de carte ;
- son exposition à l’accessibilité ;
- la suppression de la direction développée dans le texte des cartes.

### `ExerciseScreen.tsx`

L’écran calcule déjà le contexte d’héritage du Tour pour le contrôle de côté. Le même contexte doit être transmis à `formatExerciseRecap`.

Cette transmission ne crée :

- aucun champ de domaine ;
- aucune propriété persistée `isSideModeInherited` ;
- aucune modification de route ;
- aucune modification de modèle ou de DTO.

### `compositionPresentation.ts`

Les deux sorties doivent rester distinctes :

- `formatExerciseRecap` conserve la direction développée pour la synthèse Ajouter/Modifier une Activité ;
- `formatExerciseRowSummary` conserve uniquement la formulation de carte et son indicateur court.

La carte ne doit jamais contenir :

- `à droite, puis à gauche` ;
- `à gauche, puis à droite`.

### `fr.ts`

Les ressources françaises doivent distinguer :

- le libellé unilatéral de l’Activité : vide ;
- le libellé unilatéral du Tour : `–` ;
- les labels accessibles Activité ;
- les labels accessibles Tour ;
- le titre, le message et les actions exacts du dialogue.

Le chargeur i18n générique reste inchangé.

## 4. Comportement cible

### 4.1 Contrôle Activité

- `UNILATERAL` : affichage visuellement vide.
- `RIGHT_LEFT` : `D→G`.
- `LEFT_RIGHT` : `G→D`.
- Dimensions : `74 × 42 pt`.
- Titre visible : `Côté`.

Labels accessibles exacts :

- `Côté : unilatéral`
- `Côté : bilatéral, droite puis gauche`
- `Côté : bilatéral, gauche puis droite`

Sous héritage d’un Tour bilatéral :

- le contrôle reste visible ;
- il est désactivé ;
- aucune action n’est émise ;
- le suffixe exact est `défini par le Tour, indisponible`.

### 4.2 Contrôle Tour

- `UNILATERAL` : `–` centré.
- `RIGHT_LEFT` : `D→G`, entièrement visible.
- `LEFT_RIGHT` : `G→D`, entièrement visible.
- Dimensions : `42 × 34 pt`.
- Espace avec le sélecteur : `8 pt`.
- Aucun titre `Côté` ou `Côtés`.

Labels accessibles exacts :

- `Direction du Tour : unilatéral`
- `Direction du Tour : droite puis gauche`
- `Direction du Tour : gauche puis droite`

La propriété indiquant le contexte Tour doit être optionnelle afin de préserver la compatibilité de tous les appels Activité existants.

### 4.3 Dialogue de confirmation

`DecisionDialog.tsx` est réutilisé sans modification.

Le dialogue est absent :

- lorsque le Tour est vide ;
- lorsque tous les enfants propres sont `UNILATERAL`.

Le dialogue est affiché lorsqu’au moins un enfant propre `RIGHT_LEFT` ou `LEFT_RIGHT` serait remplacé par la direction du Tour.

Textes exacts :

- Titre : `Exécuter chaque Tour des deux côtés ?`
- Message : `À chaque Tour, toutes les Activités sont exécutées une fois d’un côté, puis une fois de l’autre, selon l’ordre choisi. Ce réglage remplace tout réglage de côté défini individuellement pour une Activité.`
- Actions : `Annuler`, `Confirmer`

Le style utilisé est celui de l’instance Composition/Tour attestée par le produit, et non celui du dialogue d’abandon d’Activité.

Les garanties suivantes sont conservées :

- annulation sans mutation ;
- confirmation atomique ;
- remise cohérente des enfants ;
- absence de restauration d’un réglage propre écrasé ;
- priorité du Tour sur les réglages individuels.

### 4.4 Carte de Composition

Pour une Activité propre bilatérale hors héritage d’un Tour bilatéral :

- indicateur non interactif `D→G` ou `G→D` ;
- dimensions `42 × 20 pt` ;
- position `x=311`, `y=24,5` ;
- texte visuel entièrement visible ;
- libellé accessible développé.

Libellés accessibles :

- `Côté : bilatéral, droite puis gauche`
- `Côté : bilatéral, gauche puis droite`

Pour une Activité :

- unilatérale ;
- ou héritée d’un Tour bilatéral ;

il n’y a :

- aucun indicateur ;
- aucune direction développée dans le texte de carte ;
- aucune répétition de la direction du Tour.

La formulation `par côté`, lorsqu’elle décrit le nombre de séries, reste autorisée et ne constitue pas une direction développée.

### 4.5 Synthèse Ajouter/Modifier une Activité

La base reste :

`{N} série(s) par côté …`

Suffixes exacts :

- `, à droite, puis à gauche`
- `, à gauche, puis à droite`

Le suffixe est placé :

1. après la cible ;
2. après `jusqu’à l’échec` lorsqu’il est présent ;
3. avant la Pause.

Le suffixe est absent :

- en `UNILATERAL` ;
- lorsque la direction est héritée du Tour ;
- du texte des cartes de Composition.

Les formulations suivantes restent inchangées :

- `Durée totale` ;
- la borne `≥ …`.

## 5. Données, calculs et persistance

La correction ne modifie aucun des éléments suivants :

- `side_mode` ;
- `DATABASE_VERSION` ;
- modèles ;
- DTO ;
- conversions SQL ;
- migrations ;
- valeurs persistées ;
- calculs directs ou inverses ;
- règle conditionnelle des pauses ;
- durée globale ;
- multiplicateur bilatéral ;
- cible globale ;
- arrondi `.5` vers le haut ;
- durée réalisable ;
- données d’Exécution ;
- données de Plan ;
- données de Résultat.

Les trois valeurs déjà persistées continuent d’être consommées sans transformation :

- `UNILATERAL`
- `RIGHT_LEFT`
- `LEFT_RIGHT`

Aucun comportement T03 n’est ajouté ou modifié.

## 6. Plan séquencé

### Étape 1 — Contrôle partagé

Modifier `SideModeControl.tsx` pour :

- ajouter le contexte Tour optionnel ;
- conserver le rendu Activité par défaut ;
- afficher `–` uniquement pour le Tour unilatéral ;
- réduire uniquement les espacements internes nécessaires ;
- exposer les labels accessibles corrects ;
- préserver la désactivation héritée sans dispatch.

Résultat attendu : Activité unilatérale vide ; Tour unilatéral en `–` ; directions Tour entièrement visibles.

### Étape 2 — Écran Composition

Modifier `CompositionScreen.tsx` pour :

- aligner le dialogue sur les textes exacts ;
- conserver sa condition d’ouverture ;
- conserver annulation et confirmation atomique ;
- appliquer le style Composition/Tour ;
- positionner l’indicateur de carte ;
- supprimer son masquage incorrect à l’accessibilité ;
- exposer le libellé développé ;
- ne rien afficher sous héritage ;
- supprimer toute direction développée du texte de carte.

Résultat attendu : le Tour et les cartes respectent simultanément les contrats visuels, textuels et d’accessibilité.

### Étape 3 — Transmission de l’héritage

Modifier `ExerciseScreen.tsx` pour transmettre à `formatExerciseRecap` le contexte d’héritage déjà calculé.

Résultat attendu : la synthèse réelle de l’éditeur omet la clause développée lorsqu’une Activité hérite d’un Tour bilatéral.

### Étape 4 — Présentation et traductions

Modifier `compositionPresentation.ts` pour :

- conserver `par côté` ;
- ajouter les deux suffixes exacts à la synthèse d’édition ;
- respecter leur position avant la Pause ;
- préserver `Durée totale` et la borne `≥` ;
- ne jamais ajouter la direction développée à une carte.

Modifier `fr.ts` pour :

- mettre à jour le dialogue ;
- conserver les labels accessibles exacts ;
- fournir une valeur Tour distincte `–` ;
- conserver la valeur Activité unilatérale vide ;
- conserver les clés et la structure existantes.

### Étape 5 — Tests ciblés

Adapter les tests des contrôles, écrans, fonctions de présentation et ressources i18n.

Ajouter explicitement la preuve :

- de l’accessibilité de l’indicateur propre ;
- de son absence sous héritage ;
- de l’absence de direction développée dans le texte de carte ;
- de la transmission réelle de l’héritage par `ExerciseScreen`.

### Étape 6 — Validation finale

Exécuter sans filtrage :

- la suite Jest complète ;
- les tests ciblés ;
- la vérification TypeScript complète ;
- le lint complet ;
- le contrôle du diff ;
- l’inspection visuelle aux dimensions de référence et sur largeur compacte.

Vérifier également :

- absence de modification des calculs ;
- absence de modification de la persistance ;
- absence de migration ;
- absence de changement de route ;
- absence de module T03 ;
- absence de consommateur direct oublié ;
- absence de fichier hors périmètre.

## 7. Tests obligatoires

### `SideModeControl.test.tsx`

- Activité unilatérale vide.
- Tour unilatéral affiché par `–`.
- `D→G` et `G→D` entièrement visibles.
- Dimensions et espacements locaux.
- Labels Activité exacts.
- Labels Tour exacts.
- Suffixe `défini par le Tour, indisponible`.
- Désactivation sans dispatch.
- Compatibilité du comportement Activité par défaut.

### `CompositionScreen.test.tsx`

- Absence de dialogue pour un Tour vide.
- Absence de dialogue lorsque tous les enfants sont unilatéraux.
- Dialogue lorsqu’un enfant propre bilatéral serait remplacé.
- Textes et actions exacts.
- Style Composition/Tour.
- Annulation sans mutation.
- Confirmation atomique.
- Tiret centré.
- Directions Tour entièrement visibles.
- Indicateur propre présent uniquement hors héritage.
- Indicateur accessible avec un libellé développé.
- Indicateur absent sous Tour bilatéral.
- Texte de carte sans direction développée.

### `ExerciseScreen.test.tsx`

- Transmission du contexte d’héritage à la synthèse.
- Omission de la direction développée sous Tour bilatéral.
- Conservation de la direction développée pour une Activité propre hors héritage.
- Contrôle Activité inchangé.
- Contrat de route inchangé.

### `compositionPresentation.test.ts`

- Base `{N} série(s) par côté …`.
- Suffixe droite puis gauche.
- Suffixe gauche puis droite.
- Position après la cible.
- Position après `jusqu’à l’échec`.
- Position avant la Pause.
- Absence en unilatéral.
- Absence en héritage.
- Absence dans le texte de carte.
- Conservation de `Durée totale`.
- Conservation de `Durée totale : ≥ …`.

### `src/shared/i18n/index.test.ts`

- Titre et message exacts du dialogue.
- Actions exactes.
- Labels Activité exacts.
- Labels Tour exacts.
- Valeur Tour `–`.
- Valeur Activité unilatérale vide.
- Conservation des clés.
- Conservation de la structure du chargeur.

## 8. Traçabilité produit

### Correction directe dans cette tranche

- `BIL-002` : Activité vide, Tour `–`, directions courtes.
- `BIL-003` : labels accessibles exacts.
- `BIL-061` : contrôle Tour, dimensions, espace et alignement.
- `BIL-062` : absence de titre, tiret et labels Tour.
- `BIL-065` : indicateur, position, lisibilité et accessibilité.
- `BIL-067` : direction développée uniquement dans la synthèse d’édition.

### Préservé et retesté

- `BIL-026` : confirmation conditionnelle.
- `BIL-027` : remise des enfants.
- `BIL-029` : enfants visibles et désactivés.
- `BIL-030` : état propre affiché.
- `BIL-031` : absence de restauration.
- `BIL-058` : UI et validations.

### Préservé

- `BIL-001`, `BIL-004`, `BIL-005`, `BIL-006`, `BIL-007`, `BIL-008`, `BIL-009`
- `BIL-011` à `BIL-020`
- `BIL-023` à `BIL-025`
- `BIL-028`
- `BIL-032`
- `BIL-053`, `BIL-054`
- `BIL-057`
- `BIL-063`, `BIL-064`
- `BIL-066`
- `BIL-068`

Ces exigences restent protégées par l’absence de modification des domaines, calculs, modèles et routes, ainsi que par les tests ciblés et la suite complète.

### Différé hors de cette tranche

- `BIL-010`, `BIL-021`, `BIL-022`
- `BIL-033`
- `BIL-034` à `BIL-048`
- `BIL-049` à `BIL-052`
- `BIL-055`, `BIL-056`
- `BIL-059`, `BIL-060`

Ces exigences concernent respectivement l’exécution T03, la duplication de Tour, les passages, le Catalogue V2, le Plan, les Résultats ou la révision du lot T03. Aucun module correspondant n’est touché.

## 9. Risques résiduels et contrôles

1. **Régression du contrôle Activité**  
   Le contexte Tour est optionnel et le comportement par défaut reste celui de l’Activité. Les tests de compatibilité doivent rester obligatoires.

2. **Propagation incorrecte du tiret Tour**  
   La valeur vide Activité ne doit pas être remplacée globalement. Le `–` est consommé uniquement dans le contexte Tour.

3. **Indicateur inaccessible**  
   Le texte visuel reste court, mais l’indicateur propre bilatéral doit exposer son libellé développé à l’accessibilité.

4. **Confusion entre carte et éditeur**  
   `formatExerciseRecap` reçoit la direction développée ; `formatExerciseRowSummary` ne la reçoit pas et ne l’ajoute pas.

5. **Héritage non transmis à l’écran réel**  
   La modification de la présentation seule est insuffisante. `ExerciseScreen.tsx` doit transmettre le contexte déjà calculé.

6. **Régression i18n**  
   Les clés, le chargeur et la structure restent stables. Les valeurs françaises exactes sont vérifiées par les tests de ressource.

## 10. Critères d’acceptation finale

Le plan est considéré comme réalisé uniquement si :

- les trois modes continuent de fonctionner ;
- l’Activité unilatérale reste vide ;
- le Tour unilatéral affiche `–` ;
- les directions Tour restent entièrement visibles ;
- les labels accessibles sont exacts ;
- le dialogue respecte la condition, les textes et l’atomicité attendues ;
- l’indicateur propre est visible, non interactif et accessible ;
- l’indicateur disparaît sous héritage ;
- les cartes ne contiennent aucune direction développée ;
- la synthèse d’édition conserve les suffixes exacts hors héritage ;
- `Durée totale` et la borne `≥` sont conservées ;
- aucun calcul, modèle, stockage, migration, route ou module T03 n’est modifié ;
- Jest complet, TypeScript complet et lint complet passent ;
- le diff reste limité au périmètre défini ;
- aucune clarification supplémentaire n’est nécessaire.

PLAN_STATUS: READY_FOR_INDEPENDENT_REVIEW

<KODJO_PLAN_TRANSITION_JSON>
{
  "schema_version": "kodjo.protocol.v2.plan-review-transition.0.6.25",
  "source_head": "ef0bf111195d67f6223ee4844da2b6bf2aca00d2",
  "protocol_execution_head": "afb608a4f6872d9b8d60caa70b883ff449c062cb",
  "bootstrap_path": ".github/orchestration/v2-slices/V2-BILAT-01/slice-bootstrap.json",
  "status": "PASS",
  "reason": null,
  "protected_paths": [
    ".github/orchestration/v2-activation-registry.json",
    ".github/orchestration/v2-slices/V2-BILAT-01/independent-review.md",
    ".github/orchestration/v2-slices/V2-BILAT-01/planning-mission.md",
    ".github/orchestration/v2-slices/V2-BILAT-01/slice-bootstrap.json",
    ".github/orchestration/v2-slices/V2-BILAT-01/technical-plan.md",
    "docs/MATRICE-TRACABILITE-BILATERALITE.md",
    "docs/PRODUCT.md",
    "docs/RAPPORT-CONFORMITE-BILATERALITE.md",
    "docs/Specifications-fonctionnelles/12 – Architecture technique.md"
  ],
  "changed_paths": [
    ".github/orchestration/CHANGE_REPORT_0.6.25.md",
    ".github/orchestration/KODJO_PROTOCOL_INCIDENT_REGISTER.md",
    ".github/orchestration/KODJO_PROTOCOL_V2_SPEC_0.6.25.md",
    ".github/orchestration/tests/test-incident-register.sh",
    ".github/workflows/kodjo-v2-disposable-qualification.yml",
    ".github/workflows/kodjo-v2-slice-plan-review.yml",
    ".github/workflows/kodjo-v2-slice-plan.yml",
    "scripts/kodjo/run-disposable-qualification.ps1",
    "scripts/kodjo/run-disposable-resume-qualification.ps1",
    "scripts/kodjo/verify-plan-review-transition.js",
    "tests/kodjo/incident-register.pilot.js",
    "tests/kodjo/plan-review-transition.pilot.js",
    "tests/kodjo/v2-planning-entry.pilot.js"
  ],
  "protocol_changes": [
    ".github/orchestration/CHANGE_REPORT_0.6.25.md",
    ".github/orchestration/KODJO_PROTOCOL_INCIDENT_REGISTER.md",
    ".github/orchestration/KODJO_PROTOCOL_V2_SPEC_0.6.25.md",
    ".github/orchestration/tests/test-incident-register.sh",
    ".github/workflows/kodjo-v2-disposable-qualification.yml",
    ".github/workflows/kodjo-v2-slice-plan-review.yml",
    ".github/workflows/kodjo-v2-slice-plan.yml",
    "scripts/kodjo/run-disposable-qualification.ps1",
    "scripts/kodjo/run-disposable-resume-qualification.ps1",
    "scripts/kodjo/verify-plan-review-transition.js",
    "tests/kodjo/incident-register.pilot.js",
    "tests/kodjo/plan-review-transition.pilot.js",
    "tests/kodjo/v2-planning-entry.pilot.js"
  ],
  "protected_blobs": [
    {
      "path": ".github/orchestration/v2-activation-registry.json",
      "source_oid": "286b6d2808e28814cb0b4b3c725150980f9afd67",
      "execution_oid": "286b6d2808e28814cb0b4b3c725150980f9afd67"
    },
    {
      "path": ".github/orchestration/v2-slices/V2-BILAT-01/independent-review.md",
      "source_oid": "1282a3b45e2329c47d867d6921f82b853e589ace",
      "execution_oid": "1282a3b45e2329c47d867d6921f82b853e589ace"
    },
    {
      "path": ".github/orchestration/v2-slices/V2-BILAT-01/planning-mission.md",
      "source_oid": "6e418e0b9f4e81a4e7e06930ecf5035cff5a635a",
      "execution_oid": "6e418e0b9f4e81a4e7e06930ecf5035cff5a635a"
    },
    {
      "path": ".github/orchestration/v2-slices/V2-BILAT-01/slice-bootstrap.json",
      "source_oid": "e96e51544d3a163a87d4d587acefe83fd903e8f5",
      "execution_oid": "e96e51544d3a163a87d4d587acefe83fd903e8f5"
    },
    {
      "path": ".github/orchestration/v2-slices/V2-BILAT-01/technical-plan.md",
      "source_oid": "07707548809b091cff7a32dfd40e079126b86924",
      "execution_oid": "07707548809b091cff7a32dfd40e079126b86924"
    },
    {
      "path": "docs/MATRICE-TRACABILITE-BILATERALITE.md",
      "source_oid": "e78bf56059fd90e5b8020c0c8870f9685f461403",
      "execution_oid": "e78bf56059fd90e5b8020c0c8870f9685f461403"
    },
    {
      "path": "docs/PRODUCT.md",
      "source_oid": "872ae9f40437b6d379daec4073e02a42506ea872",
      "execution_oid": "872ae9f40437b6d379daec4073e02a42506ea872"
    },
    {
      "path": "docs/RAPPORT-CONFORMITE-BILATERALITE.md",
      "source_oid": "38f0047cfc80724b5a2930b250221252efb798d6",
      "execution_oid": "38f0047cfc80724b5a2930b250221252efb798d6"
    },
    {
      "path": "docs/Specifications-fonctionnelles/12 – Architecture technique.md",
      "source_oid": "4205d200faa365bc55484c542c5c240988383c4f",
      "execution_oid": "4205d200faa365bc55484c542c5c240988383c4f"
    }
  ],
  "product_source_evidence": [
    {
      "path": "docs/PRODUCT.md",
      "declared_sha256": "62daa97413d9dc268e7245a3cbe2a5604b40fc74baaa00fab1bfed9428fa6125",
      "source_sha256": "eac9645772d69e344be05536b6f843db01cc1a17c965a1bb62a7b277ec9334fa",
      "execution_sha256": "eac9645772d69e344be05536b6f843db01cc1a17c965a1bb62a7b277ec9334fa",
      "declared_hash_matches_source": false,
      "transition_matches": true
    },
    {
      "path": "docs/MATRICE-TRACABILITE-BILATERALITE.md",
      "declared_sha256": "7c400345e180b298d81f704199a955234ffaceed35b1001bd30e7ece4a89e575",
      "source_sha256": "b9476b6652a826139cb7aefeefa23053b73ad2f2c68dff8cda3c4d503d267238",
      "execution_sha256": "b9476b6652a826139cb7aefeefa23053b73ad2f2c68dff8cda3c4d503d267238",
      "declared_hash_matches_source": false,
      "transition_matches": true
    },
    {
      "path": "docs/RAPPORT-CONFORMITE-BILATERALITE.md",
      "declared_sha256": "630afb04768e6199315ac767ccfa5af3d3ecdf6697b0604395e60a88a1ae369b",
      "source_sha256": "9917cdffb80333315f6afe1eb18a9e1f516b8494853905ad48684f443d2302ee",
      "execution_sha256": "9917cdffb80333315f6afe1eb18a9e1f516b8494853905ad48684f443d2302ee",
      "declared_hash_matches_source": false,
      "transition_matches": true
    },
    {
      "path": "docs/Specifications-fonctionnelles/12 – Architecture technique.md",
      "declared_sha256": "8337d20068a151b9ab3654528d5416e9b1c3f9ca23f1362cb3d89c5dbd8ae3ac",
      "source_sha256": "ddca8811dbf19a7454c3a28a6107b910256987b15f4341d4f7824839294ead18",
      "execution_sha256": "ddca8811dbf19a7454c3a28a6107b910256987b15f4341d4f7824839294ead18",
      "declared_hash_matches_source": false,
      "transition_matches": true
    }
  ],
  "policy": {
    "classifier_sha256": "a954d5be623a9d8e0481821957af30ff5ab61d85a047fc90396aa9bd6581f852",
    "blobs": [
      {
        "path": "scripts/kodjo/verify-plan-review-transition.js",
        "source_oid": null,
        "execution_oid": "ff40f12f7f4d5c03d849d70e1f498039621098e4"
      },
      {
        "path": ".github/workflows/kodjo-v2-slice-plan.yml",
        "source_oid": "4de9038787025fd7ccabac7054bfa46068fa50d2",
        "execution_oid": "19bd7127ae7cca036fe1c43cf4d38781d913b77d"
      },
      {
        "path": ".github/workflows/kodjo-v2-slice-plan-review.yml",
        "source_oid": "ed50784c36a7ff27a78d14b147a81f07cef8b999",
        "execution_oid": "6a24287981898a85bb8b73fc60b466c668a15e89"
      }
    ]
  }
}
</KODJO_PLAN_TRANSITION_JSON>
