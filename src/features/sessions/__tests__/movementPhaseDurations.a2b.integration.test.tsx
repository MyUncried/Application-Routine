import { act, fireEvent, renderRouter, screen, waitFor, within } from "expo-router/testing-library";
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { Stack } from "expo-router/stack";
import type { ReactNode } from "react";

import type { Movement } from "@/domain/activities/Movement";
import { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { ActivityDefinitionServiceProvider } from "@/features/activities/ActivityDefinitionServiceProvider";
import { ProfileService } from "@/features/preferences/ProfileService";
import { ProfileServiceContext } from "@/features/preferences/ProfileServiceContext";
import { ReferentialService } from "@/features/reference-data/ReferentialService";
import { ReferentialServiceContext } from "@/features/reference-data/ReferentialServiceContext";
import { SessionService } from "@/features/sessions/SessionService";
import { SessionServiceContext } from "@/features/sessions/SessionServiceContext";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteActivityDefinitionRepository } from "@/infrastructure/database/repositories/SqliteActivityDefinitionRepository";
import { SqliteBodyZoneRepository } from "@/infrastructure/database/repositories/SqliteBodyZoneRepository";
import { SqliteCategoryRepository } from "@/infrastructure/database/repositories/SqliteCategoryRepository";
import { SqliteLabelRepository } from "@/infrastructure/database/repositories/SqliteLabelRepository";
import { SqliteMovementRepository } from "@/infrastructure/database/repositories/SqliteMovementRepository";
import { SqliteProfileRepository } from "@/infrastructure/database/repositories/SqliteProfileRepository";
import { SqliteSessionRepository } from "@/infrastructure/database/repositories/SqliteSessionRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";
import { strings } from "@/shared/i18n";

/**
 * PRE-9 A.2b — durées des phases portées par le Mouvement, reprises par défaut dans un NOUVEL
 * Exercice de Séance. Décisions de Hermann : 30/10/2026 (« si elles sont renseignées elles sont
 * reprises par défaut et peuvent être changées dans la séance, si elles n'existent pas elles sont à
 * renseigner dans la séance ») ; 31/10/2026 (modification ultérieure du Mouvement : Exercices
 * existants « Inchangés »). Vrai navigateur (pile racine + groupe `(creation)`), SQLite en mémoire,
 * mêmes harnais que `CompositionMovementFlow.integration.test.tsx` (PRE-9 A.2). En mode Durée, la
 * durée de série (Cible) reste à renseigner selon la règle existante (D-446, D-448) : l'Exercice
 * reste « Paramètres à compléter » même quand toutes ses phases ont reçu une durée.
 */

jest.mock("expo-sqlite", () => ({ useSQLiteContext: () => ({}) }));
jest.mock("expo-haptics", () => ({ selectionAsync: jest.fn<() => Promise<void>>().mockResolvedValue(undefined) }));
jest.mock("expo-crypto", () => ({
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  randomUUID: () => (require("node:crypto") as typeof import("node:crypto")).randomUUID(),
}));
jest.mock("@/infrastructure/media/VideoPoster", () => ({ generateVideoPoster: jest.fn(async () => null) }));

const composition = strings.screens.composition;
const addToSession = strings.screens.activities.addToSession;
const NOW = "2026-10-29T09:00:00.000Z";

let database: NodeSqliteDatabase;
let sequence = 0;
const ids = (prefix: string) => () => `${prefix}-${++sequence}`;
const movements = () => new SqliteMovementRepository(database, ids("grp"), () => NOW);

beforeEach(async () => {
  database = NodeSqliteDatabase.openInMemory();
  await migrateDatabase(database);
});

afterEach(() => {
  database.close();
});

const movement = (id: string, name: string, overrides: Partial<Movement> = {}): Movement => ({
  id,
  name,
  description: null,
  media: [],
  categoryId: "cardio",
  bodyZoneIds: ["cuisses"],
  phases: [],
  nextPhaseId: 1,
  aliases: [],
  levelGroup: null,
  ...overrides,
});

function RootStack() {
  return <Stack screenOptions={{ headerShown: false }} />;
}

function renderApp() {
  const service = new ActivityDefinitionService(
    new SqliteActivityDefinitionRepository(database),
    new SqliteCategoryRepository(database),
    new SqliteBodyZoneRepository(database),
    new SqliteLabelRepository(database),
    undefined,
    movements(),
  );
  const sessionService = new SessionService(new SqliteSessionRepository(database), new SqliteCategoryRepository(database));
  const referentialService = new ReferentialService(
    new SqliteCategoryRepository(database),
    new SqliteBodyZoneRepository(database),
    new SqliteLabelRepository(database),
  );
  const profileService = new ProfileService(new SqliteProfileRepository(database));
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <SessionServiceContext.Provider value={sessionService}>
        <ActivityDefinitionServiceProvider service={service}>
          <ReferentialServiceContext.Provider value={referentialService}>
            <ProfileServiceContext.Provider value={profileService}>{children}</ProfileServiceContext.Provider>
          </ReferentialServiceContext.Provider>
        </ActivityDefinitionServiceProvider>
      </SessionServiceContext.Provider>
    );
  }
  /* eslint-disable @typescript-eslint/no-require-imports */
  return renderRouter(
    {
      _layout: RootStack,
      index: () => null,
      movement: require("../../../../app/movement").default,
      "(creation)/_layout": require("../../../../app/(creation)/_layout").default,
      "(creation)/composition": require("../../../../app/(creation)/composition").default,
      "(creation)/exercise": require("../../../../app/(creation)/exercise").default,
      "(creation)/activity-selection": require("../../../../app/(creation)/activity-selection").default,
      "(creation)/movement-selection": require("../../../../app/(creation)/movement-selection").default,
    },
    { initialUrl: "/composition", wrapper: Wrapper },
  );
  /* eslint-enable @typescript-eslint/no-require-imports */
}

async function settle(ms = 0) {
  await act(async () => {
    await jest.advanceTimersByTimeAsync(ms);
    for (let round = 0; round < 5; round += 1) {
      await jest.advanceTimersByTimeAsync(0);
    }
  });
}

/** Noms des cartes d'Exercice de la Composition, dans l'ordre affiché. */
function cardNames(): string[] {
  const prefix = `${composition.occurrenceCard.accessibilityType}, `;
  return screen
    .queryAllByLabelText(new RegExp(`^${prefix}`))
    .map((node) => String(node.props.accessibilityLabel).slice(prefix.length).split(",")[0]!);
}

async function openMenuAction(label: string) {
  fireEvent.press(screen.getByLabelText(composition.addActivity));
  fireEvent.press(within(screen.getByTestId("composition-add-activity-tree")).getByLabelText(label));
  await settle(300);
}

/** 01/11/2026 : reprendre un Mouvement existant par « Créer un exercice », saisie du nom, toucher de la carte. */
async function useExistingMovement(name: string, id: string) {
  await openMenuAction(addToSession.newActivity);
  fireEvent.changeText(screen.getByTestId("exercise-name-input"), name);
  await settle();
  const result = await screen.findByTestId(`movement-suggestion-result-${id}`);
  await act(async () => {
    fireEvent.press(result);
  });
  await settle(300);
}

/** Carte d'Exercice de la Composition, par son nom. */
const card = (name: string) => screen.getByLabelText(new RegExp(`^${composition.occurrenceCard.accessibilityType}, ${name},`));

/** Toucher d'une carte (feuille ouverte après lecture du Profil). */
async function tapCard(name: string) {
  fireEvent.press(card(name));
  await settle(300);
}

/** Durées affichées du tableau des phases de la feuille de paramètres, dans l'ordre des phases. */
function sheetPhaseDurations(): unknown[] {
  const texts = within(screen.getByTestId("execution-sheet-phases-table"))
    .queryAllByText(/./)
    .map((node) => node.props.children);
  // En-têtes « Libellé », « Durée », puis, par phase : numéro, durée.
  return texts.slice(2).filter((_, index) => index % 2 === 1);
}

describe("PRE-9 A.2b — durées des phases du Mouvement reprises dans un nouvel Exercice de Séance", () => {
  it("« Créer un nouveau mouvement » : durée saisie sur la fiche → enregistrée sur le Mouvement et reprise dans l'Exercice ; phase sans durée à renseigner", async () => {
    renderApp();
    await settle();
    await openMenuAction(addToSession.newActivity);
    fireEvent.changeText(screen.getByTestId("exercise-name-input"), "Squat");
    fireEvent.press(screen.getByTestId("activity-editor-category-button"));
    const [firstCategory] = await screen.findAllByTestId(/^category-picker-tag-(?!row$)/);
    fireEvent.press(firstCategory!);
    fireEvent.press(screen.getByTestId("category-picker-confirm"));
    await waitFor(() => expect(screen.queryByTestId("category-picker-sheet")).toBeNull(), { timeout: 3000 });
    fireEvent.press(screen.getByTestId("exercise-body-zones-open"));
    fireEvent.press(await screen.findByTestId("body-zone-selector-tag-cuisses"));
    await act(async () => {
      fireEvent.press(screen.getByTestId("body-zone-picker-confirm"));
    });
    await settle(300);
    // Deux phases ; durée de 30 s sur la première seulement.
    await act(async () => {
      fireEvent.changeText(screen.getByTestId("movement-phases-invite"), "Descente");
    });
    await act(async () => {
      fireEvent(screen.getByTestId("movement-phases-label-1"), "focus");
    });
    await act(async () => {
      fireEvent.changeText(screen.getByTestId("movement-phases-invite"), "Montée");
    });
    await settle();
    // Recette iPhone n° 2 du 31/10/2026 : durée saisie au clavier numérique (la roulette est retirée).
    const durationInput = () => screen.getByTestId("movement-phases-duration-1-input", { includeHiddenElements: true });
    await act(async () => {
      fireEvent(durationInput(), "focus");
    });
    await act(async () => {
      fireEvent.changeText(durationInput(), "30");
    });
    await act(async () => {
      fireEvent(durationInput(), "blur");
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId("movement-finish-action"));
    });
    await settle(300);

    const saved = await database.getAllAsync<{ label: string; duration_seconds: number | null }>(
      "SELECT label, duration_seconds FROM movement_phases ORDER BY position",
    );
    expect(saved).toEqual([
      { label: "Descente", duration_seconds: 30 },
      { label: "Montée", duration_seconds: null },
    ]);
    expect(cardNames()).toEqual(["Squat"]);
    // Montée reste à renseigner (et la durée de série, règle existante) : carte « à compléter ».
    expect(screen.getByText(strings.executionParameters.card.incomplete)).toBeTruthy();
    await tapCard("Squat");
    expect(sheetPhaseDurations()).toEqual(["30 s", "—"]);
  }, 40000);

  it("Mouvement existant repris par « Utiliser un mouvement existant », puis par « Créer un exercice » : durées reprises par phase ; une modification ultérieure du Mouvement ne change pas l'Exercice déjà posé (« Inchangés »)", async () => {
    await movements().create(
      movement("fentes", "Fentes", { phases: [{ id: 1, label: "Descente", durationSeconds: 3 }, { id: 2, label: "Montée" }], nextPhaseId: 3 }),
    );
    renderApp();
    await settle();
    // [« Utiliser un mouvement existant » — entrée retirée du menu Créer le 01/11/2026 (ordre de
    // Hermann, ch13 CE-T03-08) : le Mouvement est repris par la saisie de son nom dans « Créer un exercice ».]
    // [Entrée rétablie le même jour (recette iPhone du 01/11/2026, m11-menu) : premier Exercice par la
    // sélection des Mouvements, comme avant ; le second reste repris par la saisie du nom.]
    await openMenuAction(addToSession.existingActivity);
    fireEvent.press(await screen.findByTestId("movement-card-fentes"));
    await act(async () => {
      fireEvent.press(screen.getByTestId("movement-selection-add"));
    });
    await settle(300);
    expect(cardNames()).toEqual(["Fentes"]);
    await tapCard("Fentes");
    expect(sheetPhaseDurations()).toEqual(["3 s", "—"]);
    fireEvent.press(screen.getByTestId("execution-sheet-cancel"));
    await settle(300);

    // Le Mouvement change ensuite ses durées : l'Exercice déjà posé garde les siennes.
    await movements().update(
      movement("fentes", "Fentes", {
        phases: [
          { id: 1, label: "Descente", durationSeconds: 9 },
          { id: 2, label: "Montée", durationSeconds: 9 },
        ],
        nextPhaseId: 3,
      }),
    );
    await tapCard("Fentes");
    expect(sheetPhaseDurations()).toEqual(["3 s", "—"]);
    fireEvent.press(screen.getByTestId("execution-sheet-cancel"));
    await settle(300);

    // Un NOUVEL Exercice du même Mouvement reçoit les nouvelles valeurs par défaut.
    // [« Utiliser un mouvement existant » — entrée retirée du menu Créer le 01/11/2026 (ordre de
    // Hermann, ch13 CE-T03-08) : le Mouvement est repris par la saisie de son nom dans « Créer un exercice ».]
    await useExistingMovement("Fentes", "fentes");
    expect(cardNames()).toEqual(["Fentes", "Fentes"]);
    const [, second] = screen.getAllByLabelText(new RegExp(`^${composition.occurrenceCard.accessibilityType}, Fentes,`));
    fireEvent.press(second!);
    await settle(300);
    // Hermann, 01/11/2026 : « Lorsque la modale des paramètres s'ouvre, le tableau des phases doit
    // être fermé s'il n'y a aucune valeur à vérifier ou à renseigner. » Durées complètes, aucune
    // marque « à vérifier » (Exercice posé après la modification du Mouvement) : replié, chevron d'abord.
    expect(screen.queryByTestId("execution-sheet-phases-table")).toBeNull();
    fireEvent.press(screen.getByTestId("execution-sheet-phases-control-WITH-chevron"));
    expect(sheetPhaseDurations()).toEqual(["9 s", "9 s"]);
  }, 40000);
});
