# KODJO PRE-6 — Architecture cible (évolution minimale)

Les décisions AD-1 à AD-33 de PRE-4 et PRE-5 sont conservées. Ce document ajoute AD-34 à AD-45. Principe directeur : **étendre les modules existants, sans couche nouvelle et sans moteur d'exécution**.

## 1. Modèle

### AD-34 — Circuit = organisation + borne, deux champs distincts

Le Tour technique existant (`cycle.tour`) reste la seule structure persistée (Cycle technique, Circuit unique : RM-025, D-209). Le domaine expose une vue « Circuit » :

```ts
type CircuitNature = "TOURS" | "SERIES";            // organisation (ch10 L686-693)
type CircuitBound =                                  // condition de fin (ch10 L1102-1108)
  | { kind: "COUNT"; count: number }                 // 1..99 — seule borne de la séance libre
  // réservées aux formats, NON implémentées en PRE-6 :
  // | { kind: "DURATION"; seconds: number }         // AMRAP
  // | { kind: "MAX" }                               // Death by
```

- La borne `COUNT` **est** le `repeatCount` existant : aucun second compte concurrent (ch09 L574). L'unité affichée (tours / séries) se déduit de la nature.
- L'union fermée et le `switch` exhaustif sur `kind` permettront à la PR des formats d'ajouter une variante sans refonte. PRE-6 ne crée ni variante, ni champ, ni écran pour Durée ou Max.
- Persistance : migration 011 = `ALTER TABLE tours ADD COLUMN nature TEXT NOT NULL DEFAULT 'TOURS' CHECK (nature IN ('TOURS','SERIES'))`. Les séances existantes se lisent en Circuit de Tours (« compatibilité tours par défaut », ch12 L1715). La borne n'est pas persistée : `COUNT` est implicite tant qu'aucun format n'existe. La PR des formats ajoutera sa colonne.

### AD-35 — Récupération : présence distinguée, sans table nouvelle

- Domaine : `postActivityRecoverySeconds: number | null` (`null` = absente ; `0` = présente à 0 ; positive). Ce reste une donnée de l'occurrence (RM-210 : déplacée, copiée et supprimée avec elle), conformément à ch09 L682 (« recovery appartient à une occurrence »).
- Persistance : migration 011 ajoute `activities.post_activity_recovery_present INTEGER NOT NULL DEFAULT 0` (ADD COLUMN, sans reconstruire la table). Reprise : `present = 1` si la valeur existante est > 0, sinon 0 ; aucune interface n'a jamais créé de récupération à 0.
- Calcul : `executionCalculations` est inchangé (R > 0 remplace PN ; 0 et absent ne remplacent rien).

### AD-36 — Point d'arrêt rattaché à un emplacement

- `StopPoint = { id, scope, position }` : `position` = **emplacement** dans la portée, c'est-à-dire le nombre d'occurrences de cette portée qui le précèdent. Une seule colonne et une seule contrainte `UNIQUE(session_id, scope, position)`, qui traduit « un seul point par emplacement ».
- `insertStopPoints` enregistre la position reçue au lieu de renuméroter. `SessionDraft` porte `stopPoints` ; `toCreate/UpdateSessionInput` les transmettent ; `validation.ts` applique `isStopPointPlacementValid` (existant) et l'unicité.
- Rattachement (ARB-3 clos, ch09 L682 PR #390) : le point accompagne l'occurrence qui le précède dans son emplacement, comme la récupération, lors des déplacements, duplications et suppressions. Les opérations de Composition (`composition.ts`) recalculent les positions ; un dépôt qui amènerait le point sur un emplacement interdit (après le compte à rebours initial, avant la Fin) est un dépôt invalide, position restituée (règle existante, CE-T03-08 L1502). Le cas d'une suppression qui laisserait un autre point juste avant la Fin est traité en story 1.2 depuis les sources, sans blocage nouveau. La forme `{ id, scope, position }` est conservée.

### AD-37 — Circuit de Séries : N hérité, régime libre

- En nature `SERIES`, chaque occurrence du Circuit a `count = repeatCount` (série identique) ou `rows.length = repeatCount` (séries variables). Le régime de chaque exercice reste le sien (CIR, ch10 L729-731).
- Le Circuit **contraint** et ne crée aucun paramètre (ch10 L693). Les paramètres de l'occurrence restent `ExecutionParameters` v3, inchangés.

### AD-38 — Réserve de séries au niveau du brouillon de séance

- `SessionDraft.circuitSeriesReserve?: Record<occurrenceId, SeriesRow[]>` : lignes retirées par une diminution de N, restaurées en priorité lors d'une augmentation, puis préremplissage par copie de la dernière ligne active (ch10 L654, L758).
- La réserve ne participe ni aux cartes, ni à la grille, ni aux calculs. Elle est purgée à l'enregistrement et n'est jamais persistée.
- Une conversion confirmée tronque définitivement : rien n'est mémorisé (CE-CIR-02).

## 2. Services et calculs (domaine pur)

### AD-39 — Un module `domain/sessions/circuit.ts`

Il regroupe les opérations de l'API Circuits (ch11 L255-267), toutes pures et sur le `SessionDraft` :

| Fonction | Règle |
|---|---|
| `prepareNatureChange(draft, nature)` → `{ losses }` | Prédicat de perte avant mutation (CE-CIR-01). |
| `applyNatureChange(draft, nature)` | Tours → Séries : extension par la dernière ligne active, troncature au-delà de N. Séries → Tours : compte et valeurs conservés. |
| `setCircuitCount(draft, n)` | En Séries : diminution vers la réserve, augmentation par restauration puis préremplissage. En Tours : compte seul. |
| `prepareEnterCircuit` / `enterCircuit` | Ajout depuis le Catalogue ou déplacement vers un Circuit de Séries, perte éventuelle à confirmer (CE-CIR-02). |
| `exitCircuit` | Nombre et paramètres conservés, sans message (ch10 L655, L792-798). |
| `circuitVolumes(draft)` | Lignes de la grille CE-CIR-03, à partir des séries actives seulement. |

**Aucune duplication de logique avec la Feuille.** L'adaptation d'une occurrence à N réutilise les primitives d'`ExecutionParametersDraft` qui existent déjà pour faire suivre le tableau à N (ajout par copie de la dernière ligne, retrait). Si une primitive n'est disponible qu'à l'intérieur d'un `ExecutionSheetDraft`, elle est extraite en fonction pure dans `ExecutionParameters.ts`, à comportement identique. Ce refactor fait partie de la story 1.4 et est couvert par les tests existants de la Feuille.

### AD-40 — Développement et durées

- `calculations.ts` gagne le développement selon la nature (ch10 L651) :
  - **Tours** : (contenu interne) × N ;
  - **Séries** : boucle i = 1..N, puis exercices dans l'ordre, série i seulement. Un passage bilatéral calculable vaut 2Ti + PC + Pi, ou 2Ti + PC + R si R > 0 (ch10 L2050-2052).
- Les récupérations et points d'arrêt internes sont répétés à chaque Tour ou passage, les externes ne le sont pas. Un point d'arrêt ne compte aucune durée (RM-191). R > 0 remplace seulement la dernière Pause (RM-038). Une récupération n'est jamais comptée deux fois (RM-071, RM-159).
- Les tests reprennent les valeurs de ch10 L2052 : 75 s, 85 s, 225 s et 255 s.
- Ce développement sert aux durées, aux comptes et aux volumes. **Ce n'est pas le plan d'exécution** : le moteur reste hors PRE-6.

## 3. Interface

### AD-41 — Pas de croissance de `CompositionScreen.tsx`

Le fichier compte 2944 lignes. Les surfaces nouvelles sont des composants distincts dans `src/features/sessions/` :

- `CircuitHeader` : titre, durée, œil, compteur révélé (`InlineStepper`), pastille d'unité ;
- `CircuitNaturePopover` ;
- `CircuitVolumesSheet` ;
- `PlacementLayer` : emplacements, barre de placement ;
- `RecoveryDurationSheet`.

`CompositionScreen` ne fait que les orchestrer. `TourCard` est remplacé par `CircuitHeader` et le conteneur existant.

### AD-42 — Réutilisation des primitives

| Besoin | Brique réutilisée |
|---|---|
| ± révélé du compte | `InlineStepper` (`appearance="bare"`), avec le même mécanisme que les steppers révélés de PRE-5 (RC-4 : toucher la valeur referme) |
| Choix de nature | Popover / panneau ancré existant (`AnchoredPanel`), à condition qu'une primitive native iOS ne s'impose pas (P-4). Le menu natif de l'Enchainement (PRE-5, `@expo/ui` hébergé) est le candidat à évaluer en premier. |
| Confirmation de perte | `DecisionDialog` |
| Roulette de récupération | `DurationWheelPicker` + `WheelPickerOverlay`, avec la grille 0..300 s (1 / 5 / 30) dans `wheelPickerMath.ts` |
| Modale Volumes | Feuille basse native (`Modal` + `SheetMotion`) et `ScrollView` horizontale pour les seules colonnes S1…Sn |
| Œil | Nouvelle icône dans `KodjoIcon`, tracé repris de Figma |
| Annulation et messages | `TransientNotification` |
| Jetons | `tokens.ts` ; toute couleur sans jeton est une constante locale nommée (règle PRE-5) |

Aucune bibliothèque nouvelle. Le geste de glisser reste le système de répondeurs existant (`compositionGesture.ts`), étendu aux bornes du Circuit.

### AD-43 — Sous-brouillon de placement

Le placement est un état local à la Composition qui copie `{ recoveries, stopPoints }` à l'entrée :

- « Confirmer N pauses ajoutées » applique la copie atomiquement au `SessionDraft` ;
- « Annuler » la jette ;
- la roulette valide ou annule dans ce sous-brouillon ;
- « Continuer » reste la seule persistance (D-388, ch12 L1687).

### AD-44 — Contexte « hérité » transmis à la Feuille

`ExerciseScreen` reçoit de la Composition le contexte de l'occurrence : nature du Circuit et N si l'occurrence est dans un Circuit de Séries. Il le passe à `ActivityEditorForm`, puis à `openSheetDraft(parent, { inheritedSeriesCount })`, une option qui existe déjà. Le stepper du nombre de séries est alors indisponible (état indisponible existant, RM-247 ; refus de modification locale, ch11 L267). Aucun autre changement de la Feuille PRE-5.

### AD-45 — Navigation

Inchangée : routes `composition`, `exercise` et `activity-selection` sous `SessionDraftProvider`. « Continuer » enregistre puis ouvre Catalogue / Séances (CE-T03-08 L1454, ch13 L408). Aucune route nouvelle : popover, confirmation, volumes, placement et roulette sont des surfaces de la Composition.

## 4. Points d'attache réservés à la future PR des formats (non développés)

Ce sont des besoins à couvrir plus tard, pas des stories PRE-6 :

- variantes `DURATION` et `MAX` de `CircuitBound`, leur colonne, et la génération progressive depuis l'instantané (ch12 L1713) ;
- nature imposée par un format, avec le choix de nature verrouillé (addenda 14/10 de CE-CIR-01) ;
- état « imposé » d'un paramètre avec sa raison ; unité d'indexation (ch12 L1720-1726) ;
- exclusions AMRAP : ni Circuit de Séries, ni séries variables (ch10 L1159) ;
- For time : volume par tour sans conversion en séries ;
- Tabata : pause distincte de la récupération de séance (FMT-18) ;
- EMOM : N×E×W sans repos résiduel ;
- points de revue R-01 à R-04 (`docs/REVUE-COHERENCE-FORMATS-2026-10-14.md`).

PRE-6 garantit que ces ajouts sont additifs : union `CircuitBound`, `switch` exhaustifs, nature portée par la donnée et non déduite de l'interface.
