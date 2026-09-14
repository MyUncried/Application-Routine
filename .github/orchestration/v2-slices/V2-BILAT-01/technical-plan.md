[KODJO_V2] PLAN_OUTPUT
slice_id=V2-BILAT-01
bootstrap_path=.github/orchestration/v2-slices/V2-BILAT-01/slice-bootstrap.json
source_head=6be5ba2c23ec9a066c84466de485a69389a22afc
supersedes_plan_blob_oid=36ae634d91e6fcf72d8c53242f81212ff18907ee
prior_review_blob_oid=2d129379a5f1c6247926bf49d68cfc25754f203c
planning_contract=kodjo.plan-impact.v1
STATUT : PLAN_READY_FOR_INDEPENDENT_REVIEW

# KODJO V2 Technical Plan — V2-BILAT-01

## 1. Identity, status and boundaries

- Application revision: `6be5ba2c23ec9a066c84466de485a69389a22afc`
- Slice: `V2-BILAT-01`
- Mode: `PLAN_ONLY`
- Implementation: **not authorized**
- Migration: `005`
- Target database version: `DATABASE_VERSION = 5`
- `migration004` remains owned by T02-S02 and must remain unchanged.
- `migration006` remains reserved for T03.
- No T03 execution engine, Plan, Result, History, V2 Activity catalogue, Circuit, or V1 manifest is included.
- `formatSessionSummary.ts` remains outside the revised production scope. Catalogue duration wording is handled by `compositionPresentation.ts` and `fr.ts`.
- The deterministic direct-import scan is closed by the decision block below. No scanned production consumer requires promotion to the workflow-managed modified-module set.

Implementation remains prohibited until independent review approval.

---

## 2. Product decisions retained

The normative rule `PAUSE_RULE_WHEN_RECOVERY_ZERO` is retained:

- When `R = 0`, there are `C` pauses, including after the final Set.
- When `R > 0`, there are `C - 1` pauses followed by one final Recovery.
- Existing T02-S02 behavior remains authoritative.
- The unconditional documentary rule `C - 1` must not be applied.

The following product decisions remain in scope:

- Three side modes: `UNILATERAL`, `RIGHT_LEFT`, `LEFT_RIGHT`.
- Activity and Tour side settings are independently persisted.
- A Tour direction overrides child Activity direction while active.
- Tour inheritance is resolved at read/calculation time and is never written into an Activity.
- A Tour activation that would replace child bilateral settings requires confirmation.
- Cancellation must not mutate the draft.
- Confirmed replacement is atomic.
- Returning a Tour to unilateral mode does not restore previous child settings.
- `duplicateActivity` preserves the Activity’s own `sideMode`.
- No new side-specific controls are added to structural phases or Recovery.
- Body Zones are not made lateralized.
- Real bilateral execution remains deferred to T03.
- Catalogue persistence and insertion remain deferred to future work where stated in the traceability matrix.

---

## 3. Existing architecture and impact boundary

### Domain

The following domain modules require implementation work:

- `Session.ts`
- `SessionDraft.ts`
- `defaults.ts`
- `validation.ts`
- `errors.ts`
- `composition.ts`
- `calculations.ts`
- `index.ts`
- New `sideMode.ts`

The domain currently has no Activity or Tour side fields, no side validation fields, no side defaults, and no effective-direction resolver.

### Application transport

The following application modules require implementation work:

- `SessionService.ts`
- `SessionDraftContext.tsx`
- `SessionDraftProvider.tsx`
- `ExerciseScreen.tsx`
- `CompositionScreen.tsx`
- `compositionPresentation.ts`
- New `SideModeControl.tsx`

`DecisionDialog.tsx` already exists and must be reused without modification.

### Persistence

The following persistence modules require implementation work:

- `constants.ts`
- `migrateDatabase.ts`
- New `migration005.ts`
- `DatabaseRows.ts`
- `SqliteSessionRepository.ts`
- `runNativeDatabaseIntegrationCheck.ts`

Migrations `001` through `004` remain immutable.

### Direct-import closure

The scanned application consumers are transitive consumers of stable APIs, unrelated fields, or infrastructure boundaries. They do not require side-specific production logic. Their classifications and evidence are recorded once in the required decision block.

The workflow remains responsible for assembling its authoritative modified-module set and deriving `scope_allow`; this plan does not reproduce those immutable workflow facts.

---

## 4. Traceability

### In scope

- `BIL-001` through `BIL-009`
- `BIL-011` through `BIL-020`
- `BIL-023` through `BIL-032`
- `BIL-053`, `BIL-054`
- `BIL-057`, `BIL-058`
- `BIL-061` through `BIL-068`

### Deferred to T03

- `BIL-010`
- `BIL-021`, `BIL-022`
- `BIL-034` through `BIL-048`
- `BIL-055`, `BIL-056`
- `BIL-059`, `BIL-060`

These cover execution order, developed passages, per-side results, partial-side state, execution progress, current-side announcements, result preservation, and the T03 lot revision.

### Deferred to future work

- `BIL-033`
- `BIL-049` through `BIL-052`

These cover Tour duplication and persistent catalogue behavior.

---

## 5. Domain model

Create `src/domain/sessions/sideMode.ts` as the single source of truth for:

- `SideMode`
- `SIDE_MODES`
- `cycleSideMode`
- `sideMultiplier`
- `resolveEffectiveSideMode`
- detection of own bilateral child Activities
- Tour activation transition logic
- atomic reset of affected child Activities to `UNILATERAL`

Extend the domain contracts with:

- `Activity.sideMode`
- `Session.cycle.tour.sideMode`
- `CreateSessionActivityInput.sideMode`
- `UpdateSessionActivityInput.sideMode`
- `CreateSessionInput.tourSideMode`
- `UpdateSessionInput.tourSideMode`
- `SessionDraftExercise.sideMode`
- `SessionDraft.tourSideMode`

Extend `ValidationField` with the corresponding Activity and Tour side fields.

Every new field defaults to `UNILATERAL`:

- Newly created Activities are unilateral.
- Newly created Tours are unilateral.
- Historical database rows migrate to unilateral.
- Missing or invalid transport values are rejected by validation rather than silently converted, except for migration defaults and explicit creation defaults.

The effective direction must distinguish:

- the Activity’s own direction;
- the Tour’s direction;
- whether the effective value is inherited.

The inherited value is calculated, not persisted into the child Activity.

---

## 6. Side-mode transitions

### Activity control

The Activity cycle is:

`UNILATERAL → RIGHT_LEFT → LEFT_RIGHT → UNILATERAL`

The control is active in:

- Duration mode;
- Repetitions mode;
- Until-failure mode.

### Tour activation

The transition helper must:

1. Inspect the Tour’s child Activities.
2. Detect whether any child has an own bilateral setting.
3. Apply the Tour direction immediately when no child replacement is required.
4. Request confirmation only when one or more child bilateral settings would be replaced.
5. Leave the draft unchanged when the user cancels.
6. On confirmation, set the Tour direction and reset all affected own-bilateral children to `UNILATERAL` atomically.
7. Never restore those child settings when the Tour returns to unilateral mode.

While a Tour direction is active:

- Child controls remain visible.
- Child controls are disabled.
- Child controls display their own persisted state, which is unilateral after confirmed replacement.
- Child controls cannot dispatch changes.
- The effective direction comes from the Tour.

An empty Tour or a Tour whose children are all unilateral applies directly without confirmation.

---

## 7. Calculations

### Side multiplier

Define:

- `L = 1` for `UNILATERAL`.
- `L = 2` for `RIGHT_LEFT` or `LEFT_RIGHT`.

The multiplier must be applied exactly once.

### Pause occurrences

Define:

- `P(C, R) = C` when `R = 0`.
- `P(C, R) = C - 1` when `R > 0`.

### Autonomous Activity

For an autonomous Activity:

```text
D = L × [C × A + P(C,R) × B] + R
```

Where:

- `A` is the active work duration per side;
- `B` is the pause duration;
- `C` is the number of Sets per side;
- `R` is the final Recovery duration.

The distinction is mandatory:

- A bilateral autonomous Activity has one positive Recovery after both sides.
- A bilateral Tour applies each Activity once per side passage, so a positive Activity Recovery occurs once after each passage.
- Neither behavior may receive a second implicit multiplier.

### Inverse Duration mode calculation

When `R = 0`:

```text
Cth = D / [L × (A + B)]
```

When `R > 0`:

```text
Cth = ((D - R) / L + B) / (A + B)
```

The result must:

- use nearest-integer rounding;
- round `.5` upward;
- be bounded to `1..99`;
- be reinjected into the direct calculation to obtain the realizable duration.

### Repetitions and Until-failure

The known minimum duration is:

```text
Dmin = L × P(C,R) × B + R
```

The visible presentation is:

```text
Durée totale : ≥ …
```

The visible label remains `Durée totale` in all three modes.

### Tour calculation

- A bilateral Tour imposes its effective direction on every child Activity.
- A unilateral Tour allows each Activity to use its own setting.
- A bilateral Activity inside a unilateral Tour retains `L = 2`.
- An Activity inside a bilateral Tour does not receive a second multiplier.
- `tourRepeatCount` multiplies the complete Tour content exactly once.
- `RIGHT_LEFT` and `LEFT_RIGHT` have equal totals.
- Activities before and after the Tour retain their own settings.
- Tour bilateral recovery is calculated once per Activity passage.
- Autonomous bilateral recovery is calculated once after both sides.

The domain calculations and SQL expressions must produce identical totals for:

- `R = 0`;
- `R > 0`;
- autonomous bilateral Activities;
- bilateral Tours;
- unilateral Tours containing bilateral Activities;
- both directional variants.

---

## 8. Composition behavior

Update composition operations to preserve side state:

- copy;
- insert;
- move;
- duplicate;
- draft equality;
- model-to-draft conversion;
- draft-to-model conversion.

`duplicateActivity` must copy the Activity’s own `sideMode`.

Tour duplication is not introduced.

The effective side resolver must be shared by:

- composition summaries;
- duration calculations;
- SQL-compatible calculation definitions;
- UI state decisions.

No inherited Tour direction is written into an Activity during calculation or presentation.

---

## 9. UI and accessibility

### `SideModeControl`

Create `SideModeControl.tsx` with:

- Activity mode only;
- local size `74 × 42 pt`;
- placement on line 2, column 1;
- placement beneath `Séries`;
- visible title `Côté`;
- availability in Duration, Repetitions, and Until-failure modes.

Visible values:

- `UNILATERAL`: visually empty;
- `RIGHT_LEFT`: `D→G`;
- `LEFT_RIGHT`: `G→D`.

Exact accessible labels:

- `Côté : unilatéral`
- `Côté : bilatéral, droite puis gauche`
- `Côté : bilatéral, gauche puis droite`

When inherited from the Tour, the control remains visible and disabled. Its complete accessible label appends exactly:

`défini par le Tour, indisponible`

A disabled control must not dispatch an action.

### Tour side control

In `CompositionScreen.tsx`:

- place the control immediately to the right of the Tour-count selector;
- use `8 pt` spacing;
- use local geometry `42 × 34 pt`;
- show no `Côté` or `Côtés` title.

Exact accessible labels:

- `Direction du Tour : unilatéral`
- `Direction du Tour : droite puis gauche`
- `Direction du Tour : gauche puis droite`

### Confirmation dialog

Reuse `DecisionDialog.tsx` without modification.

Exact text:

- Title: `Voulez-vous exécuter ce Tour de manière bilatérale ?`
- Message: `À chaque répétition du Tour, toutes ses Activités seront exécutées une première fois d’un côté, puis une seconde fois de l’autre, selon l’ordre choisi. Les réglages de côtés propres aux Activités seront remplacés par celui du Tour.`
- Actions: `Annuler`, `Confirmer`

The dialog must use the Composition/Tour instance styling established by `CE-BIL-02`, not the Activity-abandon dialog styling.

### Composition cards and summaries

For Composition cards:

- show `D→G` or `G→D` only for an own bilateral Activity;
- use local size `42 × 20 pt`;
- show nothing for unilateral Activities;
- show nothing when bilateral behavior is inherited from the Tour;
- keep the indicator non-interactive.

Summary strings:

- own bilateral base: `{N} série(s) par côté …`;
- `RIGHT_LEFT`: append `, à droite, puis à gauche`;
- `LEFT_RIGHT`: append `, à gauche, puis à droite`.

The direction suffix appears:

1. after the target;
2. after `jusqu’à l’échec` when applicable;
3. before the Pause.

No direction clause is shown for unilateral Activities or inherited bilateral behavior.

---

## 10. Persistence and migration

Create `migration005.ts` using only additive changes:

```sql
ALTER TABLE activities
ADD COLUMN side_mode TEXT NOT NULL DEFAULT 'UNILATERAL'
CHECK (side_mode IN ('UNILATERAL', 'RIGHT_LEFT', 'LEFT_RIGHT'));
```

```sql
ALTER TABLE tours
ADD COLUMN side_mode TEXT NOT NULL DEFAULT 'UNILATERAL'
CHECK (side_mode IN ('UNILATERAL', 'RIGHT_LEFT', 'LEFT_RIGHT'));
```

The migration must:

- use the existing transaction;
- use only `ALTER TABLE ... ADD COLUMN`;
- avoid table reconstruction;
- avoid row duplication;
- avoid changes to migrations `001` through `004`;
- create no Plan, Result, Execution, History, or T03 data;
- update the version only after all statements succeed;
- roll back completely on failure.

Update:

- `DATABASE_VERSION` to `5`;
- the reservation comment in `constants.ts`;
- the migration chain in `migrateDatabase.ts`;
- `DatabaseRows.ts`;
- `AGGREGATE_QUERY`;
- `ACTIVITY_ROW_COLUMNS`;
- Activity and Tour SQL conversions;
- `insertActivities`;
- `mergeActivities`;
- `toActivitySqlValues`;
- `toActivity`;
- `assembleSession`;
- `listActive`;
- `ACTIVITY_PAUSE_OCCURRENCES_SQL`;
- `ACTIVITY_DURATION_SQL`;
- `zoneDurationSql`.

Migration guarantees:

- databases from versions 0 through 4 migrate to version 5;
- historical Activities and Tours receive `UNILATERAL`;
- version 5 is not replayed;
- version 6 is rejected;
- failed migrations do not leave a partially upgraded schema.

---

## 11. Implementation sequence

### Step 1 — Domain and transport

- Create `sideMode.ts`.
- Extend model, DTO, draft, equality, and public exports.
- Add defaults.
- Add validation fields and rules.
- Update service conversion and persistence payloads.
- Update draft context and provider.

Verification:

- create, edit, reload, compare, and save preserve side settings;
- omitted creation values default to unilateral;
- invalid side values fail validation.

### Step 2 — Calculations and composition

- Preserve the conditional T02-S02 pause rule.
- Add multiplier and effective-side resolution.
- Implement direct and inverse calculations.
- Implement autonomous and Tour recovery distinctions.
- Update composition operations and `duplicateActivity`.
- Implement parent-to-child transition semantics.

Verification:

- direct and inverse calculations are deterministic;
- Tour priority is respected;
- no multiplier is applied twice;
- cancellation and confirmation transitions are atomic;
- child settings are not restored after Tour deactivation.

### Step 3 — Migration and SQL

- Create and register migration 005.
- Set database version to 5.
- Update row types and repository projections.
- Update read, insert, merge, and conversion paths.
- Align SQL duration expressions with domain calculations.
- Add native integration checks.

Verification:

- versions 0 through 4 reach version 5;
- version 5 is not replayed;
- version 6 is rejected;
- rollback is complete;
- SQL and domain totals match.

### Step 4 — Interface

- Create and test `SideModeControl`.
- Integrate it into `ExerciseScreen`.
- Integrate the Tour control into `CompositionScreen`.
- Reuse `DecisionDialog`.
- Add conditional confirmation and disabled inherited state.
- Add own-direction card indicators.
- Add summaries and French translations.

Verification:

- geometry, placement, labels, accessibility, and dialog styling match the product decisions;
- side controls are available in all required Activity modes;
- Tour inheritance is visible and non-interactive;
- summaries do not expose inherited direction as an own Activity setting.

### Step 5 — Full validation

Run without filtering:

- complete Jest suite;
- complete TypeScript verification;
- complete lint suite;
- SQLite and migration integration checks;
- repository tests;
- domain, service, draft, screen, presentation, and i18n tests.

Also verify:

- migrations `001` through `004` are byte-for-byte unchanged;
- no T03, Plan, Result, History, catalogue-persistence, Circuit, or manifest behavior is introduced;
- no unapproved production consumer is added to scope;
- the final direct-import scope remains closed.

---

## 12. Required tests

### Domain tests

Cover:

- exact three-mode set;
- rejection of unknown values;
- complete cycle;
- side multiplier;
- effective-side resolution;
- defaults;
- validation errors;
- draft equality;
- direct transition;
- confirmation-required transition;
- cancellation without mutation;
- atomic child reset;
- no restoration;
- `duplicateActivity` preservation;
- direct duration;
- inverse duration;
- `.5` rounding upward;
- bounds `1..99`;
- `R = 0` with `C` pauses;
- `R > 0` with `C - 1` pauses and final Recovery;
- Duration, Repetitions, and Until-failure modes;
- autonomous bilateral Recovery after both sides;
- per-passage Recovery in a bilateral Tour;
- unilateral Tour containing a bilateral Activity;
- absence of double multiplication;
- equal totals for `RIGHT_LEFT` and `LEFT_RIGHT`.

### Persistence and SQL tests

Cover:

- migration from versions 0, 1, 2, 3, and 4 to 5;
- historical unilateral defaults;
- no version-5 replay;
- rejection of version 6;
- SQL constraints;
- complete rollback;
- Activity side read/write;
- Tour side read/write;
- copy and duplicate preservation;
- parent/child consistency;
- domain/SQL parity for `R = 0`;
- domain/SQL parity for `R > 0`;
- autonomous bilateral Activity totals;
- bilateral Tour priority;
- unilateral Tour with bilateral Activity;
- Catalogue/Composition parity;
- absence of T03 data.

### UI and integration tests

Cover:

- visually empty unilateral Activity state;
- `D→G`;
- `G→D`;
- complete control cycle;
- exact accessible labels;
- visible `Côté` title for Activities;
- no title for the Tour control;
- exact inherited suffix;
- availability in all three Activity modes;
- empty Tour direct application;
- direct application when all children are unilateral;
- confirmation only when own bilateral child state is replaced;
- exact dialog text;
- Composition/Tour dialog styling;
- cancellation without mutation;
- atomic confirmation;
- no restoration after deactivation;
- own-direction card indicator;
- absence of indicator under Tour inheritance;
- exact summary suffix placement;
- `Durée totale`;
- `Durée totale : ≥ …`.

---

## 13. Acceptance criteria

The implementation is acceptable only when all of the following are demonstrated:

- The three side modes are defined once and validated consistently.
- Activity and Tour side values survive draft, model, service, repository, and database round trips.
- Historical data defaults to unilateral through migration 005.
- The T02-S02 conditional pause rule is preserved in both domain and SQL.
- Tour priority is resolved centrally.
- Autonomous and Tour bilateral Recovery semantics remain distinct.
- No double multiplier occurs.
- Activity duplication preserves own side mode.
- Tour confirmation is conditional, atomic, and non-restoring.
- Child controls are visible but disabled during inheritance.
- UI geometry and exact French strings are implemented.
- Accessibility labels match exactly.
- Migration rollback, version rejection, and historical upgrades pass.
- Migrations `001` through `004` remain unchanged.
- No T03 behavior or artifacts are added.
- Full Jest, TypeScript, and lint checks pass without filtering.
- The deterministic scan remains closed with no production consumer requiring modification.

---

## 14. Deterministic scan decisions

<KODJO_PLAN_IMPACT_JSON>
{
  "schema": "kodjo.plan-impact.v1",
  "scan_revision": "6be5ba2c23ec9a066c84466de485a69389a22afc",
  "modified_modules": [
    {
      "path": "app/__tests__/creationLayout.test.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/domain/sessions/Session.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/domain/sessions/SessionDraft.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/domain/sessions/__tests__/SessionDraft.test.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/domain/sessions/__tests__/calculations.test.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/domain/sessions/__tests__/composition.test.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/domain/sessions/__tests__/sideMode.test.ts",
      "change": "CREATE"
    },
    {
      "path": "src/domain/sessions/__tests__/validation.test.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/domain/sessions/calculations.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/domain/sessions/composition.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/domain/sessions/defaults.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/domain/sessions/errors.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/domain/sessions/index.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/domain/sessions/sideMode.ts",
      "change": "CREATE"
    },
    {
      "path": "src/domain/sessions/validation.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/features/sessions/CompositionScreen.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/features/sessions/ExerciseScreen.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/features/sessions/SessionDraftContext.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/features/sessions/SessionDraftProvider.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/features/sessions/SessionService.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/features/sessions/SideModeControl.tsx",
      "change": "CREATE"
    },
    {
      "path": "src/features/sessions/__tests__/CatalogueCompositionEditFlow.integration.test.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/features/sessions/__tests__/CatalogueScreen.test.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/features/sessions/__tests__/CategoriesSaveFlow.integration.test.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/features/sessions/__tests__/CategoriesScreen.test.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/features/sessions/__tests__/ColorPalette.test.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/features/sessions/__tests__/CompositionExerciseFlow.integration.test.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/features/sessions/__tests__/CompositionNavigationGuard.integration.test.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/features/sessions/__tests__/CompositionScreen.test.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/features/sessions/__tests__/ExerciseNavigationGuard.integration.test.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/features/sessions/__tests__/ExerciseScreen.test.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/features/sessions/__tests__/SessionCard.test.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/features/sessions/__tests__/SessionDraftContext.test.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/features/sessions/__tests__/SessionDraftProvider.test.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/features/sessions/__tests__/SessionService.test.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/features/sessions/__tests__/SessionServiceContext.test.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/features/sessions/__tests__/SessionServiceProvider.test.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/features/sessions/__tests__/SideModeControl.test.tsx",
      "change": "CREATE"
    },
    {
      "path": "src/features/sessions/__tests__/compositionPresentation.test.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/features/sessions/__tests__/formatSessionSummary.test.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/features/sessions/__tests__/useSessionCatalogue.test.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/features/sessions/compositionPresentation.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/infrastructure/database/__tests__/SqliteCategoryRepository.test.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/infrastructure/database/__tests__/SqliteSessionRepository.test.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/infrastructure/database/__tests__/initializeDatabase.test.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/infrastructure/database/__tests__/migrateDatabase.test.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/infrastructure/database/constants.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/infrastructure/database/integration/runNativeDatabaseIntegrationCheck.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/infrastructure/database/migrateDatabase.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/infrastructure/database/migrations/migration005.ts",
      "change": "CREATE"
    },
    {
      "path": "src/infrastructure/database/repositories/SqliteSessionRepository.ts",
      "change": "MODIFY"
    },
    {
      "path": "src/infrastructure/database/types/DatabaseRows.ts",
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
  "scan_sha256": "c0aec81133ac1bd1bab6106ad7be851f2816970a665b135603392e312b74e424",
  "rows": [
    {
      "path": "app/__tests__/creationLayout.test.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/domain/sessions/Session.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/domain/sessions/SessionDraft.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/domain/sessions/__tests__/SessionDraft.test.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/domain/sessions/__tests__/calculations.test.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/domain/sessions/__tests__/composition.test.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/domain/sessions/__tests__/sideMode.test.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/domain/sessions/__tests__/validation.test.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/domain/sessions/calculations.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/domain/sessions/composition.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/domain/sessions/defaults.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/domain/sessions/errors.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/domain/sessions/index.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/domain/sessions/sideMode.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/domain/sessions/validation.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
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
      "path": "src/features/sessions/SessionDraftContext.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/features/sessions/SessionDraftProvider.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/features/sessions/SessionService.ts",
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
      "path": "src/features/sessions/__tests__/CatalogueCompositionEditFlow.integration.test.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/features/sessions/__tests__/CatalogueScreen.test.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/features/sessions/__tests__/CategoriesSaveFlow.integration.test.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/features/sessions/__tests__/CategoriesScreen.test.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/features/sessions/__tests__/ColorPalette.test.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/features/sessions/__tests__/CompositionExerciseFlow.integration.test.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/features/sessions/__tests__/CompositionNavigationGuard.integration.test.tsx",
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
      "path": "src/features/sessions/__tests__/ExerciseNavigationGuard.integration.test.tsx",
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
      "path": "src/features/sessions/__tests__/SessionCard.test.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/features/sessions/__tests__/SessionDraftContext.test.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/features/sessions/__tests__/SessionDraftProvider.test.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/features/sessions/__tests__/SessionService.test.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/features/sessions/__tests__/SessionServiceContext.test.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/features/sessions/__tests__/SessionServiceProvider.test.tsx",
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
      "path": "src/features/sessions/__tests__/formatSessionSummary.test.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/features/sessions/__tests__/useSessionCatalogue.test.ts",
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
      "path": "src/infrastructure/database/__tests__/SqliteCategoryRepository.test.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/infrastructure/database/__tests__/SqliteSessionRepository.test.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/infrastructure/database/__tests__/initializeDatabase.test.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/infrastructure/database/__tests__/migrateDatabase.test.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/infrastructure/database/constants.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/infrastructure/database/integration/runNativeDatabaseIntegrationCheck.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/infrastructure/database/migrateDatabase.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/infrastructure/database/migrations/migration005.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/infrastructure/database/repositories/SqliteSessionRepository.ts",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/infrastructure/database/types/DatabaseRows.ts",
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
      "path": "app/(creation)/_layout.tsx",
      "candidate_kind": "CONSUMER",
      "triggered_by": [
        "src/features/sessions/SessionDraftProvider.tsx"
      ],
      "risk_score": 0,
      "classification": "CONSUMER_UNAFFECTED",
      "justification": "This route layout only mounts the creation provider and navigation shell; side-state transport remains inside the existing provider and screen APIs."
    },
    {
      "path": "app/(creation)/composition.tsx",
      "candidate_kind": "CONSUMER",
      "triggered_by": [
        "src/features/sessions/CompositionScreen.tsx",
        "src/features/sessions/SessionDraftContext.tsx"
      ],
      "risk_score": 0,
      "classification": "CONSUMER_UNAFFECTED",
      "justification": "This route only renders the composition screen and forwards navigation context; Tour-side behavior is implemented inside CompositionScreen."
    },
    {
      "path": "app/(creation)/exercise.tsx",
      "candidate_kind": "CONSUMER",
      "triggered_by": [
        "src/features/sessions/ExerciseScreen.tsx"
      ],
      "risk_score": 0,
      "classification": "CONSUMER_UNAFFECTED",
      "justification": "This route only renders the exercise screen; Activity side control state is owned and handled by ExerciseScreen."
    },
    {
      "path": "src/domain/categories/Category.ts",
      "candidate_kind": "CONSUMER",
      "triggered_by": [
        "src/domain/sessions/Session.ts"
      ],
      "risk_score": 0,
      "classification": "CONSUMER_UNAFFECTED",
      "justification": "This module defines category data only; adding side fields to sessions does not alter category properties or category contracts."
    },
    {
      "path": "src/domain/categories/validation.ts",
      "candidate_kind": "CONSUMER",
      "triggered_by": [
        "src/domain/sessions/validation.ts"
      ],
      "risk_score": 0,
      "classification": "CONSUMER_UNAFFECTED",
      "justification": "Its validation rules cover category fields only, while Activity and Tour side validation is added to the sessions validation boundary."
    },
    {
      "path": "src/domain/sessions/SessionRepository.ts",
      "candidate_kind": "CONSUMER",
      "triggered_by": [
        "src/domain/sessions/Session.ts"
      ],
      "risk_score": 0,
      "classification": "CONSUMER_UNAFFECTED",
      "justification": "The repository interface continues to expose the existing session operations; side fields are carried by the existing session DTOs and handled by the repository implementation."
    },
    {
      "path": "src/features/sessions/CatalogueScreen.tsx",
      "candidate_kind": "CONSUMER",
      "triggered_by": [
        "src/domain/sessions/Session.ts"
      ],
      "risk_score": 0,
      "classification": "CONSUMER_UNAFFECTED",
      "justification": "Catalogue screen behavior remains based on existing catalogue operations and presentation boundaries; side-specific composition summaries are handled by the planned presentation changes."
    },
    {
      "path": "src/features/sessions/CategoriesScreen.tsx",
      "candidate_kind": "CONSUMER",
      "triggered_by": [
        "src/features/sessions/SessionDraftContext.tsx"
      ],
      "risk_score": 0,
      "classification": "CONSUMER_UNAFFECTED",
      "justification": "This screen edits category data and does not read or write Activity or Tour side settings."
    },
    {
      "path": "src/features/sessions/ColorPalette.tsx",
      "candidate_kind": "CONSUMER",
      "triggered_by": [
        "src/domain/sessions/Session.ts"
      ],
      "risk_score": 0,
      "classification": "CONSUMER_UNAFFECTED",
      "justification": "The component consumes session color information only; side mode does not affect palette selection or rendering."
    },
    {
      "path": "src/features/sessions/SessionCard.tsx",
      "candidate_kind": "CONSUMER",
      "triggered_by": [
        "src/domain/sessions/Session.ts"
      ],
      "risk_score": 0,
      "classification": "CONSUMER_UNAFFECTED",
      "justification": "The card renders existing session-level information and does not own the Composition card side indicator or effective-direction presentation."
    },
    {
      "path": "src/features/sessions/SessionServiceContext.tsx",
      "candidate_kind": "CONSUMER",
      "triggered_by": [
        "src/features/sessions/SessionService.ts"
      ],
      "risk_score": 0,
      "classification": "CONSUMER_UNAFFECTED",
      "justification": "The context provides the existing service abstraction without implementing DTO conversion or side-state persistence."
    },
    {
      "path": "src/features/sessions/SessionServiceProvider.tsx",
      "candidate_kind": "CONSUMER",
      "triggered_by": [
        "src/features/sessions/SessionService.ts",
        "src/infrastructure/database/constants.ts",
        "src/infrastructure/database/repositories/SqliteSessionRepository.ts"
      ],
      "risk_score": 0,
      "classification": "CONSUMER_UNAFFECTED",
      "justification": "The provider wires the existing service and repository construction APIs; side transport is implemented within those existing service and repository layers."
    },
    {
      "path": "src/features/sessions/compositionGesture.ts",
      "candidate_kind": "CONSUMER",
      "triggered_by": [
        "src/domain/sessions/Session.ts"
      ],
      "risk_score": 0,
      "classification": "CONSUMER_UNAFFECTED",
      "justification": "Gesture logic manipulates composition positioning and interaction coordinates, not Activity or Tour side semantics."
    },
    {
      "path": "src/features/sessions/useSessionCatalogue.ts",
      "candidate_kind": "CONSUMER",
      "triggered_by": [
        "src/domain/sessions/Session.ts"
      ],
      "risk_score": 0,
      "classification": "CONSUMER_UNAFFECTED",
      "justification": "The hook manages catalogue loading and session retrieval through stable service operations; side persistence is transparent to its loading contract."
    },
    {
      "path": "src/infrastructure/database/ExpoDatabase.ts",
      "candidate_kind": "CONSUMER",
      "triggered_by": [
        "src/infrastructure/database/constants.ts"
      ],
      "risk_score": 0,
      "classification": "CONSUMER_UNAFFECTED",
      "justification": "This module opens and exposes the SQLite database; version handling and migration registration remain encapsulated by the database initialization and migration modules."
    },
    {
      "path": "src/infrastructure/database/initializeDatabase.ts",
      "candidate_kind": "CONSUMER",
      "triggered_by": [
        "src/infrastructure/database/constants.ts",
        "src/infrastructure/database/migrateDatabase.ts"
      ],
      "risk_score": 0,
      "classification": "CONSUMER_UNAFFECTED",
      "justification": "Initialization continues to delegate schema upgrades to the migration chain; registering migration 005 does not change its initialization contract."
    },
    {
      "path": "src/infrastructure/database/repositories/SqliteCategoryRepository.ts",
      "candidate_kind": "CONSUMER",
      "triggered_by": [
        "src/infrastructure/database/types/DatabaseRows.ts"
      ],
      "risk_score": 0,
      "classification": "CONSUMER_UNAFFECTED",
      "justification": "The repository reads and writes category rows only; Activity and Tour side columns do not alter category queries or conversions."
    },
    {
      "path": "src/shared/i18n/index.ts",
      "candidate_kind": "CONSUMER",
      "triggered_by": [
        "src/shared/i18n/resources/fr.ts"
      ],
      "risk_score": 0,
      "classification": "CONSUMER_UNAFFECTED",
      "justification": "The i18n index exports the resource tree without encoding individual translation keys; adding French side-mode strings preserves its public API."
    }
  ],
  "scope_allow": [
    "app/__tests__/creationLayout.test.tsx",
    "src/domain/sessions/Session.ts",
    "src/domain/sessions/SessionDraft.ts",
    "src/domain/sessions/__tests__/SessionDraft.test.ts",
    "src/domain/sessions/__tests__/calculations.test.ts",
    "src/domain/sessions/__tests__/composition.test.ts",
    "src/domain/sessions/__tests__/sideMode.test.ts",
    "src/domain/sessions/__tests__/validation.test.ts",
    "src/domain/sessions/calculations.ts",
    "src/domain/sessions/composition.ts",
    "src/domain/sessions/defaults.ts",
    "src/domain/sessions/errors.ts",
    "src/domain/sessions/index.ts",
    "src/domain/sessions/sideMode.ts",
    "src/domain/sessions/validation.ts",
    "src/features/sessions/CompositionScreen.tsx",
    "src/features/sessions/ExerciseScreen.tsx",
    "src/features/sessions/SessionDraftContext.tsx",
    "src/features/sessions/SessionDraftProvider.tsx",
    "src/features/sessions/SessionService.ts",
    "src/features/sessions/SideModeControl.tsx",
    "src/features/sessions/__tests__/CatalogueCompositionEditFlow.integration.test.tsx",
    "src/features/sessions/__tests__/CatalogueScreen.test.tsx",
    "src/features/sessions/__tests__/CategoriesSaveFlow.integration.test.tsx",
    "src/features/sessions/__tests__/CategoriesScreen.test.tsx",
    "src/features/sessions/__tests__/ColorPalette.test.tsx",
    "src/features/sessions/__tests__/CompositionExerciseFlow.integration.test.tsx",
    "src/features/sessions/__tests__/CompositionNavigationGuard.integration.test.tsx",
    "src/features/sessions/__tests__/CompositionScreen.test.tsx",
    "src/features/sessions/__tests__/ExerciseNavigationGuard.integration.test.tsx",
    "src/features/sessions/__tests__/ExerciseScreen.test.tsx",
    "src/features/sessions/__tests__/SessionCard.test.tsx",
    "src/features/sessions/__tests__/SessionDraftContext.test.tsx",
    "src/features/sessions/__tests__/SessionDraftProvider.test.tsx",
    "src/features/sessions/__tests__/SessionService.test.ts",
    "src/features/sessions/__tests__/SessionServiceContext.test.tsx",
    "src/features/sessions/__tests__/SessionServiceProvider.test.tsx",
    "src/features/sessions/__tests__/SideModeControl.test.tsx",
    "src/features/sessions/__tests__/compositionPresentation.test.ts",
    "src/features/sessions/__tests__/formatSessionSummary.test.ts",
    "src/features/sessions/__tests__/useSessionCatalogue.test.ts",
    "src/features/sessions/compositionPresentation.ts",
    "src/infrastructure/database/__tests__/SqliteCategoryRepository.test.ts",
    "src/infrastructure/database/__tests__/SqliteSessionRepository.test.ts",
    "src/infrastructure/database/__tests__/initializeDatabase.test.ts",
    "src/infrastructure/database/__tests__/migrateDatabase.test.ts",
    "src/infrastructure/database/constants.ts",
    "src/infrastructure/database/integration/runNativeDatabaseIntegrationCheck.ts",
    "src/infrastructure/database/migrateDatabase.ts",
    "src/infrastructure/database/migrations/migration005.ts",
    "src/infrastructure/database/repositories/SqliteSessionRepository.ts",
    "src/infrastructure/database/types/DatabaseRows.ts",
    "src/shared/i18n/index.test.ts",
    "src/shared/i18n/resources/fr.ts"
  ]
}
</KODJO_PLAN_IMPACT_JSON>

PLAN_STATUS: READY_FOR_INDEPENDENT_REVIEW
