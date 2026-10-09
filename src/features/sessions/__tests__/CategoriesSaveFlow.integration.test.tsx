import { act, fireEvent, renderRouter, screen, waitFor, within } from "expo-router/testing-library";
import { describe, expect, it, jest } from "@jest/globals";
import type { ReactNode } from "react";

import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteActivityDefinitionRepository } from "@/infrastructure/database/repositories/SqliteActivityDefinitionRepository";
import { SqliteBodyZoneRepository } from "@/infrastructure/database/repositories/SqliteBodyZoneRepository";
import { SqliteCategoryRepository } from "@/infrastructure/database/repositories/SqliteCategoryRepository";
import { SqliteLabelRepository } from "@/infrastructure/database/repositories/SqliteLabelRepository";
import { SqliteProfileRepository } from "@/infrastructure/database/repositories/SqliteProfileRepository";
import { SqliteSessionRepository } from "@/infrastructure/database/repositories/SqliteSessionRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";
import { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { ActivityDefinitionServiceProvider } from "@/features/activities/ActivityDefinitionServiceProvider";
import { ProfileService } from "@/features/preferences/ProfileService";
import { ProfileServiceContext } from "@/features/preferences/ProfileServiceContext";
import { ReferentialService } from "@/features/reference-data/ReferentialService";
import { ReferentialServiceContext } from "@/features/reference-data/ReferentialServiceContext";
import { SessionService } from "@/features/sessions/SessionService";
import { SessionServiceContext } from "@/features/sessions/SessionServiceContext";
import { strings } from "@/shared/i18n";

/**
 * `CompositionScreen`/`ExerciseScreen` s'auto-alimentent en Zones corporelles
 * persistées via `ActivityDefinitionService.listBodyZones()` (V2-PRE-1, plan
 * §3.1, UI-CDBCCFD16078/UI-1652FFC3B512 ; correction device check Hermann,
 * commentaire 5948936550). Cette suite court-circuite `expo-sqlite` natif au
 * profit d'un `NodeSqliteDatabase` injecté directement via
 * `SessionServiceContext`/`ActivityDefinitionServiceProvider` (voir docstring
 * plus bas) — `expo-sqlite` reste doublé ici (nécessaire à
 * `CompositionScreen`'s `useLabelsReferential`, hors périmètre de cette
 * correction) ; `SqliteBodyZoneRepository`/`SqliteActivityDefinitionRepository`
 * sont en revanche RÉELS, adossés à la MÊME base migrée (migration007 y sème
 * déjà le référentiel canonique des Zones, dont « Dos »).
 */
jest.mock("expo-sqlite", () => ({
  useSQLiteContext: () => ({}),
}));

/**
 * Intégration bout-en-bout T01-S09 : Composition → Catégories (confirmation
 * finale) → Enregistrer → Catalogue, avec un VRAI `SessionDraftProvider`
 * (monté une seule fois par `app/(creation)/_layout.tsx`) et un VRAI
 * `SqliteSessionRepository` adossé à une vraie base SQLite en mémoire
 * (`NodeSqliteDatabase`, même mécanisme que `SqliteSessionRepository
 * .test.ts`) — seul `expo-sqlite` lui-même (natif) est court-circuité, en
 * fournissant directement `SessionServiceContext` plutôt qu'en passant par
 * `SessionServiceProvider`/`SQLiteProvider`.
 *
 * V2-PRE-1 (plan §3.3, UI-8CB4E7976CBA) : la relation historique Catégorie
 * de Séance N:N est retirée — l'écran `Catégories de la séance` ne lit ni
 * n'écrit plus `session_categories` ; ce parcours couvre désormais
 * uniquement la confirmation finale et l'enregistrement.
 *
 * Couvre explicitement, avec des données réelles bout en bout : plusieurs
 * Activités (une en Durée, une en Répétitions) ; Zones corporelles ; aucune
 * perte de donnée T01-S01…S08 ; reset du brouillon et retour au Catalogue
 * uniquement après succès.
 */

jest.mock("expo-haptics", () => ({
  selectionAsync: jest.fn<() => Promise<void>>().mockResolvedValue(undefined),
}));

/**
 * `jest-expo` ne fournit aucune implémentation par défaut de
 * `Crypto.randomUUID()` (`undefined` sous ce preset) — même contrainte déjà
 * documentée par `SqliteSessionRepository.test.ts`. Cette suite est la
 * SEULE, parmi les tests d'intégration de cette feature, à faire
 * réellement transiter ces identifiants jusqu'à une vraie contrainte SQLite
 * liée (`activities.id`, `categories.id`) : sans ce mock, chaque appel
 * renverrait `undefined`, provoquant un rejet SQLite (« cannot be bound »)
 * plutôt qu'une preuve de persistance réelle.
 */
jest.mock("expo-crypto", () => ({
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  randomUUID: () => (require("node:crypto") as typeof import("node:crypto")).randomUUID(),
}));

const composition = strings.screens.composition;
const exercise = strings.screens.exercise;
const categories = strings.screens.categories;

/**
 * La migration SQLite est asynchrone (`migrateDatabase`) et doit être
 * terminée AVANT que `CategoriesScreen` n'appelle `listCategories()` au
 * montage : migrer explicitement ici, hors composant, avant `render`, est
 * plus simple et plus robuste qu'une migration paresseuse déclenchée depuis
 * l'intérieur d'un composant React.
 */
/**
 * PRE-3 (#340, correction revue 1, REV-04 — extension technique bornée) :
 * un NOUVEL Exercice exige Nom, une Catégorie, au moins une Zone et des
 * paramètres valides (périmètre §5, chapitre 06). Saisie complète dans
 * l'éditeur réel : Catégorie prédéfinie (sélection au toucher), Zone (✓),
 * feuille Paramètres (mode, cible), puis ✓ de la feuille. Terminer est
 * pressé par l'appelant. Contrats du parcours conservés : persistance
 * complète, ordre, aucun doublon, échec technique atomique, retour Catalogue.
 */
async function fillNewExercise(name: string, mode: "Durée" | "Répétitions", zoneId: string) {
  fireEvent.changeText(screen.getByLabelText(exercise.name), name);
  fireEvent.press(screen.getByTestId("activity-editor-category-button"));
  const [firstCategory] = await screen.findAllByTestId(/^category-picker-tag-(?!row$)/);
  fireEvent.press(firstCategory!);
  fireEvent.press(screen.getByTestId("exercise-body-zones-open"));
  fireEvent.press(await screen.findByTestId(`body-zone-selector-tag-${zoneId}`));
  await act(async () => {
    fireEvent.press(screen.getByTestId("body-zone-picker-confirm"));
  });
  fireEvent.press(screen.getByTestId("exercise-parameters-card"));
  fireEvent.press(screen.getByTestId("execution-sheet-mode-value"));
  fireEvent.press(within(screen.getByTestId("execution-sheet-mode-control")).getByText(mode));
  if (mode === "Durée") {
    fireEvent.press(screen.getByTestId("execution-sheet-target-value"));
    fireEvent(screen.getByTestId("duration-wheel-seconds"), "selectionChange", { nativeEvent: { selection: 30 } });
    fireEvent.press(screen.getByTestId("duration-wheel-validate"));
  }
  // Répétitions : première sélection uniforme → cible initiale 1 (v13 §6).
  fireEvent.press(screen.getByTestId("execution-sheet-validate"));
}

async function renderCreationRouter() {
  const database = NodeSqliteDatabase.openInMemory();
  await migrateDatabase(database);
  const sessionService = new SessionService(
    new SqliteSessionRepository(database),
    new SqliteCategoryRepository(database),
  );
  const activityDefinitionService = new ActivityDefinitionService(
    new SqliteActivityDefinitionRepository(database),
    new SqliteCategoryRepository(database),
    new SqliteBodyZoneRepository(database),
    new SqliteLabelRepository(database),
  );
  const referentialService = new ReferentialService(
    new SqliteCategoryRepository(database),
    new SqliteBodyZoneRepository(database),
    new SqliteLabelRepository(database),
  );
  const profileService = new ProfileService(new SqliteProfileRepository(database));

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <SessionServiceContext.Provider value={sessionService}>
        <ActivityDefinitionServiceProvider service={activityDefinitionService}>
          <ReferentialServiceContext.Provider value={referentialService}>
            <ProfileServiceContext.Provider value={profileService}>
              {children}
            </ProfileServiceContext.Provider>
          </ReferentialServiceContext.Provider>
        </ActivityDefinitionServiceProvider>
      </SessionServiceContext.Provider>
    );
  }

  const router = renderRouter(
    {
      index: () => null,
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      "(creation)/_layout": require("../../../../app/(creation)/_layout").default,
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      "(creation)/composition": require("../../../../app/(creation)/composition").default,
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      "(creation)/exercise": require("../../../../app/(creation)/exercise").default,
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      "(creation)/categories": require("../../../../app/(creation)/categories").default,
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      "(creation)/activity-selection": require("../../../../app/(creation)/activity-selection")
        .default,
    },
    { initialUrl: "/composition", wrapper: Wrapper },
  );

  return { router, database };
}

describe("Parcours Composition → Catégories → Enregistrer → Catalogue (T01-S09)", () => {
  it("persists a full multi-Activity, multi-Category session without any data loss, resets the draft and returns to the Catalogue only on success", async () => {
    const { router, database } = await renderCreationRouter();

    // Composition : Nom + Activité 1 (Durée, Zones corporelles).
    fireEvent.changeText(screen.getByLabelText(composition.name), "Circuit complet");
    fireEvent.press(screen.getByLabelText(composition.addActivity));
    fireEvent.press(screen.getByLabelText(strings.screens.activities.addToSession.newActivity));
    // T02-S02 (D-137) : aucune étape `Valider` ; PRE-3 : saisie complète
    // (Catégorie, Zone via `BodyZonePickerModal`, feuille Paramètres).
    await fillNewExercise("Gainage", "Durée", "dos");
    fireEvent.press(screen.getByLabelText(exercise.finishAction));

    // Activité 2 (Répétitions) — nouvel ajout, jamais un remplacement.
    fireEvent.press(screen.getByLabelText(composition.addActivity));
    fireEvent.press(screen.getByLabelText(strings.screens.activities.addToSession.newActivity));
    await fillNewExercise("Squats", "Répétitions", "cuisses");
    fireEvent.press(screen.getByLabelText(exercise.finishAction));

    // Continuer → Catégories (confirmation finale).
    const continueAction = screen.getByLabelText(composition.continueAction);
    expect(continueAction.props.accessibilityState).toMatchObject({ disabled: false });
    fireEvent.press(continueAction);
    expect(router.getPathname()).toBe("/categories");

    // Enregistrer la séance.
    await act(async () => {
      fireEvent.press(screen.getByLabelText(categories.saveAction));
    });

    await waitFor(() => expect(router.getPathname()).toBe("/"));

    // Aucune perte de donnée : relecture directe de la base réelle.
    const sessionRow = await database.getFirstAsync<{ id: string; name: string }>(
      "SELECT id, name FROM sessions",
    );
    expect(sessionRow?.name).toBe("Circuit complet");

    const activityRows = await database.getAllAsync<{ name: string; execution_mode: string }>(
      "SELECT name, execution_mode FROM activities ORDER BY position ASC",
    );
    expect(activityRows.map((row) => row.name)).toEqual(["Gainage", "Squats"]);
    expect(activityRows.map((row) => row.execution_mode)).toEqual(["DURATION", "REPETITIONS"]);

    // PRE-3 : chaque nouvel Exercice porte au moins une Zone (périmètre §5) —
    // une Zone par Activité, chacune persistée sans perte.
    const bodyZoneRows = await database.getAllAsync<{ body_zone_id: string }>(
      "SELECT body_zone_id FROM activity_body_zones ORDER BY body_zone_id ASC",
    );
    expect(bodyZoneRows.map((row) => row.body_zone_id)).toEqual(["cuisses", "dos"]);

    // PRE-3 : paramètres canoniques et Catégorie persistés avec chaque occurrence.
    const canonicalRows = await database.getAllAsync<{ execution_parameters: string | null; category_id: string | null }>(
      "SELECT execution_parameters, category_id FROM activities ORDER BY position ASC",
    );
    expect(canonicalRows.every((row) => row.execution_parameters !== null && row.category_id !== null)).toBe(true);

    database.close();
  });

  it("shows the exact failure message, keeps the draft intact and re-enables the action on a technical save failure — no navigation, no partial data", async () => {
    const { router, database } = await renderCreationRouter();

    fireEvent.changeText(screen.getByLabelText(composition.name), "Séance qui échoue");
    fireEvent.press(screen.getByLabelText(composition.addActivity));
    fireEvent.press(screen.getByLabelText(strings.screens.activities.addToSession.newActivity));
    // PRE-3 : les référentiels (Catégories, Zones) sont lus pendant la saisie ;
    // l'échec technique est donc provoqué juste AVANT l'enregistrement de la
    // Séance — même contrat : échec atomique, brouillon intact, action réarmée.
    await fillNewExercise("Gainage", "Durée", "dos");
    fireEvent.press(screen.getByLabelText(exercise.finishAction));
    fireEvent.press(screen.getByLabelText(composition.continueAction));
    // Force une erreur technique en fermant la connexion avant l'enregistrement.
    database.close();

    await act(async () => {
      fireEvent.press(screen.getByLabelText(categories.saveAction));
    });

    await waitFor(() => expect(screen.getByTestId("categories-save-error")).toBeTruthy());
    expect(screen.getByText(categories.saveError)).toBeTruthy();
    // Aucune navigation n'a eu lieu : l'écran Catégories reste affiché.
    expect(router.getPathname()).toBe("/categories");
    // L'action est réactivée (non désactivée par un état "saving" bloqué).
    expect(screen.getByLabelText(categories.saveAction).props.accessibilityState).toMatchObject({
      disabled: false,
    });

    // Le brouillon reste intact (pas de reset) : Retour ramène sur
    // Composition, où l'Activité saisie est toujours présente.
    fireEvent.press(screen.getByLabelText(categories.backAccessibilityLabel));
    expect(router.getPathname()).toBe("/composition");
    expect(screen.getByText("Gainage")).toBeTruthy();
    expect(screen.getByLabelText(composition.name).props.value).toBe("Séance qui échoue");
  }, 20000);
});
