import { act, fireEvent, renderRouter, screen, waitFor, within } from "expo-router/testing-library";
import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { Stack } from "expo-router/stack";
import type { ReactNode } from "react";

import type { Movement } from "@/domain/activities/Movement";
import { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { ActivityDefinitionServiceProvider } from "@/features/activities/ActivityDefinitionServiceProvider";
import { chooseExecutionMode } from "@/features/activities/testing/executionSheetActions";
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
 * PRE-9 A.2 — Créer un Exercice depuis un Mouvement (ARB-22a, ARB-07, D-449, Q6 ; CE-MVT-01).
 * Vrai navigateur (pile racine + groupe `(creation)` réel, `SessionDraftProvider` réel), SQLite en
 * mémoire : « Créer un nouvel exercice » ouvre la création d'un Mouvement (plus `/exercise`) ;
 * « Utiliser un mouvement existant » ouvre la sélection des Mouvements actifs du Catalogue (plus
 * `/activity-selection`) ; les Mouvements choisis deviennent des Exercices insérés après le dernier
 * Exercice entré. Demande de Hermann du 29/10/2026 : aucune feuille ne s'ouvre à l'insertion ; les
 * cartes sont posées « Paramètres à compléter » ; toucher une telle carte ouvre directement la
 * feuille de paramètres (pas l'éditeur) ; complète, la carte ouvre l'éditeur comme avant.
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

/** Carte d'Exercice de la Composition, par son nom. */
const card = (name: string) => screen.getByLabelText(new RegExp(`^${composition.occurrenceCard.accessibilityType}, ${name},`));

/** Toucher d'une carte (feuille ouverte après lecture du Profil). */
async function tapCard(name: string) {
  fireEvent.press(card(name));
  await settle(300);
}

/** Feuille de paramètres : mode Durée, 45 s, ✓. */
async function setDuration45() {
  chooseExecutionMode("Durée");
  fireEvent.press(screen.getByTestId("execution-sheet-target-value"));
  fireEvent(screen.getByTestId("duration-wheel-seconds"), "selectionChange", { nativeEvent: { selection: 45 } });
  fireEvent.press(screen.getByTestId("duration-wheel-validate"));
  await act(async () => {
    fireEvent.press(screen.getByTestId("execution-sheet-validate"));
  });
  await settle(300);
}

describe("PRE-9 A.2 — « Créer un nouveau mouvement » : création d'un Mouvement, puis carte à compléter", () => {
  it("ouvre la fiche de création du Mouvement (pas l'ancien éditeur) ; Terminer enregistre le Mouvement, revient à la Composition et pose l'Exercice « Paramètres à compléter », sans feuille ; la carte ouvre la feuille, puis, complète, l'éditeur", async () => {
    const router = renderApp();
    await settle();
    await openMenuAction(addToSession.newActivity);
    expect(router.getPathname()).toBe("/movement");
    expect(router.getSearchParams()).toMatchObject({ context: "session" });
    expect(screen.getByText(strings.screens.movement.titles.create)).toBeTruthy();
    expect(screen.queryByText(strings.screens.exercise.titleAdd)).toBeNull();

    fireEvent.changeText(screen.getByTestId("exercise-name-input"), "Burpees");
    fireEvent.press(screen.getByTestId("activity-editor-category-button"));
    const [firstCategory] = await screen.findAllByTestId(/^category-picker-tag-(?!row$)/);
    fireEvent.press(firstCategory!);
    fireEvent.press(screen.getByTestId("category-picker-confirm"));
    await waitFor(() => expect(screen.queryByTestId("category-picker-sheet")).toBeNull(), { timeout: 3000 });
    fireEvent.press(screen.getByTestId("exercise-body-zones-open"));
    fireEvent.press(await screen.findByTestId("body-zone-selector-tag-dos"));
    await act(async () => {
      fireEvent.press(screen.getByTestId("body-zone-picker-confirm"));
    });
    await settle(300);
    await act(async () => {
      fireEvent.press(screen.getByTestId("movement-finish-action"));
    });
    await settle(300);

    expect(router.getPathname()).toBe("/composition");
    const saved = await database.getAllAsync<{ id: string; name: string }>("SELECT id, name FROM movements WHERE name = 'Burpees'");
    expect(saved).toHaveLength(1);
    // Demande de Hermann du 29/10/2026 : aucune feuille à l'insertion ; carte à compléter (D-389).
    expect(screen.queryByTestId("execution-sheet")).toBeNull();
    expect(cardNames()).toEqual(["Burpees"]);
    expect(String(card("Burpees").props.accessibilityLabel)).toBe("Exercice, Burpees, 1 sur 1");
    expect(screen.getByText(strings.executionParameters.card.incomplete)).toBeTruthy();
    // Toucher la carte à compléter : la feuille de paramètres, par-dessus la Composition, sans l'éditeur.
    await tapCard("Burpees");
    expect(router.getPathname()).toBe("/composition");
    expect(screen.getByTestId("execution-sheet")).toBeTruthy();
    await setDuration45();
    expect(screen.queryByTestId("execution-sheet")).toBeNull();
    // 45 s, avec Compte à rebours et Fin du Profil : durée estimée de l'Exercice.
    expect(String(card("Burpees").props.accessibilityLabel)).toBe("Exercice, Burpees, 1 sur 1, 1 min");
    // Paramètres renseignés : la carte ouvre l'éditeur de l'Exercice, comme avant.
    await tapCard("Burpees");
    expect(router.getPathname()).toBe("/exercise");
    expect(screen.queryByTestId("execution-sheet")).toBeNull();
  }, 40000);

  it("depuis une Séance, « Utiliser ce mouvement » reprend le Mouvement existant (aucun doublon) ; « Créer une variante » n'est pas proposé ; ARB-07 : après le dernier Exercice", async () => {
    await movements().create(movement("pompes", "Pompes"));
    await movements().create(movement("squats", "Squats"));
    const router = renderApp();
    await settle();
    // Premier Exercice, par la sélection.
    await openMenuAction(addToSession.existingActivity);
    fireEvent.press(await screen.findByTestId("movement-card-squats"));
    await act(async () => {
      fireEvent.press(screen.getByTestId("movement-selection-add"));
    });
    await settle(300);
    expect(screen.queryByTestId("execution-sheet")).toBeNull();

    await openMenuAction(addToSession.newActivity);
    fireEvent.changeText(screen.getByTestId("exercise-name-input"), "Pompes");
    await settle();
    const result = await screen.findByTestId("movement-suggestion-result-pompes");
    expect(within(result).queryByTestId("movement-suggestion-result-pompes-variant")).toBeNull();
    expect(within(result).getByText(strings.screens.activities.editor.movementSuggestion.useMovement)).toBeTruthy();
    await act(async () => {
      fireEvent.press(screen.getByTestId("movement-suggestion-result-pompes-use"));
    });
    await settle(300);

    expect(router.getPathname()).toBe("/composition");
    expect(await database.getAllAsync("SELECT id FROM movements WHERE name = 'Pompes'")).toHaveLength(1);
    expect(screen.queryByTestId("execution-sheet")).toBeNull();
    // Paramètres à compléter : l'Exercice est posé après le précédent.
    expect(cardNames()).toEqual(["Squats", "Pompes"]);
  }, 40000);
});

describe("PRE-9 A.2 — « Utiliser un mouvement existant » : sélection par le Catalogue des Mouvements", () => {
  it("ouvre la sélection des Mouvements (pas l'ancienne sélection) ; archivés absents ; choisis → Exercices dans l'ordre du Catalogue, posés à compléter ; chaque carte ouvre ses paramètres", async () => {
    await movements().create(movement("fentes", "Fentes"));
    await movements().create(movement("gainage", "Gainage"));
    await movements().create(movement("abdos", "Abdos"));
    await movements().create(movement("ancien", "Ancien"));
    await movements().archive("ancien");
    const router = renderApp();
    await settle();

    await openMenuAction(addToSession.existingActivity);
    expect(router.getPathname()).toBe("/movement-selection");
    expect(screen.queryByTestId("activity-selection-list")).toBeNull();
    expect(await screen.findByTestId("movement-card-fentes")).toBeTruthy();
    expect(screen.queryByTestId("movement-card-ancien")).toBeNull();
    expect(screen.getByTestId("movement-selection-add").props.accessibilityState).toMatchObject({ disabled: true });

    // Touchers dans le désordre : l'ordre d'insertion est celui du Catalogue (par nom).
    fireEvent.press(screen.getByTestId("movement-card-gainage"));
    fireEvent.press(screen.getByTestId("movement-card-abdos"));
    fireEvent.press(screen.getByTestId("movement-card-fentes"));
    fireEvent.press(screen.getByTestId("movement-card-fentes"));
    expect(screen.getByLabelText("Abdos").props.accessibilityState).toMatchObject({ selected: true });
    expect(screen.getByLabelText("Fentes").props.accessibilityState).toMatchObject({ selected: false });
    expect(screen.getByText("Ajouter 2 exercices")).toBeTruthy();
    await act(async () => {
      fireEvent.press(screen.getByTestId("movement-selection-add"));
    });
    await settle(300);

    expect(router.getPathname()).toBe("/composition");
    expect(cardNames()).toEqual(["Abdos", "Gainage"]);
    // Aucune feuille à l'insertion : les deux cartes sont à compléter.
    expect(screen.queryByTestId("execution-sheet")).toBeNull();
    expect(screen.getAllByText(strings.executionParameters.card.incomplete)).toHaveLength(2);
    // Carte touchée → ses paramètres : Abdos (✓), puis Gainage (✕ : laissé à compléter).
    await tapCard("Abdos");
    expect(screen.getByTestId("execution-sheet")).toBeTruthy();
    await setDuration45();
    expect(screen.queryByTestId("execution-sheet")).toBeNull();
    await tapCard("Gainage");
    expect(screen.getByTestId("execution-sheet")).toBeTruthy();
    fireEvent.press(screen.getByTestId("execution-sheet-cancel"));
    await settle(300);
    expect(screen.queryByTestId("execution-sheet")).toBeNull();
    expect(router.getPathname()).toBe("/composition");
    const [abdos, gainage] = screen.getAllByLabelText(new RegExp(`^${composition.occurrenceCard.accessibilityType}, `));
    expect(String(abdos!.props.accessibilityLabel)).toBe("Exercice, Abdos, 1 sur 2, 1 min");
    // Paramètres à compléter : aucune durée annoncée (D-389).
    expect(String(gainage!.props.accessibilityLabel)).toBe("Exercice, Gainage, 2 sur 2");
    // Aucun Mouvement créé ni modifié par la sélection.
    expect(await database.getAllAsync("SELECT id FROM movements")).toHaveLength(4);

    // Contre-recette du 30/10 (Hermann) : rouverte, la sélection marque d'un coin replié (annoncé
    // « dans la séance ») les Mouvements déjà présents ; ils restent sélectionnables.
    await openMenuAction(addToSession.existingActivity);
    expect(await screen.findByTestId("movement-card-in-session-abdos")).toBeTruthy();
    expect(screen.getByTestId("movement-card-in-session-gainage")).toBeTruthy();
    expect(screen.queryByTestId("movement-card-in-session-fentes")).toBeNull();
    expect(screen.queryByText("Dans la séance")).toBeNull();
    fireEvent.press(screen.getByTestId("movement-card-abdos"));
    expect(screen.getByLabelText("Abdos, dans la séance").props.accessibilityState).toMatchObject({ selected: true });
    expect(screen.getByLabelText("Fentes").props.accessibilityState).toMatchObject({ selected: false });
  }, 40000);

  it("Annuler revient à la Composition sans rien ajouter", async () => {
    await movements().create(movement("fentes", "Fentes"));
    const router = renderApp();
    await settle();
    await openMenuAction(addToSession.existingActivity);
    fireEvent.press(await screen.findByTestId("movement-card-fentes"));
    fireEvent.press(screen.getByTestId("movement-selection-cancel"));
    await settle(300);
    expect(router.getPathname()).toBe("/composition");
    expect(cardNames()).toEqual([]);
    expect(screen.queryByTestId("execution-sheet")).toBeNull();
  }, 40000);
});
