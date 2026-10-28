import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { describe, expect, it, jest } from "@jest/globals";

import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import type { Activity } from "@/domain/sessions/Session";
import type { CatalogueSessionRecord } from "@/domain/sessions/SessionRepository";
import type { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { ActivityDefinitionServiceContext } from "@/features/activities/ActivityDefinitionServiceContext";
import type { ReferentialService } from "@/features/reference-data/ReferentialService";
import { ReferentialServiceContext } from "@/features/reference-data/ReferentialServiceContext";
import { CatalogueScreen } from "@/features/sessions/CatalogueScreen";
import type { SessionService } from "@/features/sessions/SessionService";
import { SessionServiceContext } from "@/features/sessions/SessionServiceContext";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

/**
 * PRE-8 (epic E, story E.6) — filtres du segment Séances dans l'écran : application, annulation,
 * réinitialisation (vue conservée), archives, combinaison avec les vues, aucun résultat.
 */

const focusEffectHarness: { effect: (() => (() => void) | void) | null } = { effect: null };
jest.mock("expo-router", () => {
  const actual = jest.requireActual("expo-router") as object;
  return {
    ...actual,
    useFocusEffect: (effect: () => (() => void) | void) => {
      focusEffectHarness.effect = effect;
    },
    useRouter: () => ({ push: jest.fn(), setParams: jest.fn() }),
    useLocalSearchParams: () => ({}),
  };
});

let sequence = 0;
const exercise = (categoryId: string, bodyZoneIds: readonly string[]): Activity => ({
  id: `ex-${++sequence}`,
  type: "EXERCISE",
  structuralPosition: "BEFORE_TOUR",
  position: 0,
  name: "Ex",
  executionParameters: durationParameters(30),
  postActivityRecoverySeconds: null,
  instruction: null,
  bodyZoneIds,
  categoryId,
  media: [],
});

const record = (id: string, exercises: readonly Activity[], status: "ACTIVE" | "ARCHIVED" = "ACTIVE"): CatalogueSessionRecord => ({
  id,
  name: `Séance ${id}`,
  color: "#3B82F6",
  labelId: null,
  status,
  archivedAt: null,
  updatedAt: "2026-10-28T08:00:00.000Z",
  structure: { elements: exercises.map((item) => ({ kind: "EXERCISE" as const, exercise: item })), stopPoints: [] },
});

const RECORDS = [
  record("genou", [exercise("mobilite", ["dos"]), exercise("renfo", ["genoux"])]),
  record("seul", [exercise("renfo", ["dos"])]),
  record("archivee", [exercise("mobilite", ["genoux"])], "ARCHIVED"),
];

function renderScreen() {
  const service = { listCatalogueSessions: jest.fn(async () => RECORDS) } as unknown as SessionService;
  const activityService = { listActivityDefinitions: jest.fn(async () => []) } as unknown as ActivityDefinitionService;
  const referentials = {
    listCategories: jest.fn(async () => [
      { id: "mobilite", name: "Mobilité", color: "#2E9B62", isActive: true },
      { id: "renfo", name: "Renforcement", color: "#E5484D", isActive: true },
    ]),
    listBodyZones: jest.fn(async () => [
      { id: "dos", name: "Dos", isActive: true, createdAt: "x" },
      { id: "genoux", name: "Genoux", isActive: true, createdAt: "x" },
    ]),
    listLabels: jest.fn(async () => []),
  } as unknown as ReferentialService;
  render(
    <TestSafeAreaProvider>
      <SessionServiceContext.Provider value={service}>
        <ReferentialServiceContext.Provider value={referentials}>
          <ActivityDefinitionServiceContext.Provider value={activityService}>
            <CatalogueScreen />
          </ActivityDefinitionServiceContext.Provider>
        </ReferentialServiceContext.Provider>
      </SessionServiceContext.Provider>
    </TestSafeAreaProvider>,
  );
}

async function flush() {
  await act(async () => {
    for (let index = 0; index < 6; index += 1) await Promise.resolve();
  });
}

async function focus() {
  await act(async () => {
    focusEffectHarness.effect?.();
  });
  await flush();
}

const shown = () =>
  screen.queryAllByTestId(/^catalogue-session-item-(?!.*-content$)/).map((node) => (node.props.testID as string).replace("catalogue-session-item-", ""));

async function openSheet() {
  fireEvent.press(screen.getByTestId("catalogue-filter-action"));
  await flush();
}

describe("PRE-8 E.6 — filtres dans l'écran", () => {
  it("Filtrer actif sur le segment Séances : ouvre le panneau ; ✕ ferme sans appliquer", async () => {
    renderScreen();
    await focus();
    expect(shown()).toEqual(["genou", "seul"]);
    await openSheet();
    fireEvent.press(screen.getByTestId("session-filter-status-archived"));
    fireEvent.press(screen.getByTestId("session-filter-close"));
    expect(screen.queryByTestId("session-filter-sheet")).toBeNull();
    expect(shown()).toEqual(["genou", "seul"]);
  });

  it("Statut Archivées : seules les archivées ; résumé dans la commande étendue", async () => {
    renderScreen();
    await focus();
    await openSheet();
    fireEvent.press(screen.getByTestId("session-filter-status-archived"));
    fireEvent.press(screen.getByTestId("session-filter-apply"));
    expect(shown()).toEqual(["archivee"]);
    expect(screen.getByTestId("catalogue-filter-action-summary")).toHaveTextContent("Archivées");
  });

  it("Catégorie Mobilité ET Zone Genoux (exercices différents) ; réinitialiser en un toucher conserve la vue", async () => {
    renderScreen();
    await focus();
    fireEvent.press(screen.getByTestId("catalogue-session-view-MULTIPLE"));
    await openSheet();
    fireEvent.press(screen.getByTestId("session-filter-section-CATEGORIES-toggle"));
    fireEvent.press(screen.getByTestId("session-filter-category-mobilite"));
    fireEvent.press(screen.getByTestId("session-filter-section-BODY_ZONES-toggle"));
    fireEvent.press(screen.getByTestId("session-filter-zone-genoux"));
    fireEvent.press(screen.getByTestId("session-filter-apply"));
    expect(shown()).toEqual(["genou"]);
    expect(screen.getByTestId("catalogue-filter-action-summary")).toHaveTextContent("2 filtres");

    fireEvent.press(screen.getByTestId("catalogue-filter-action-clear"));
    expect(screen.queryByTestId("catalogue-filter-action-summary")).toBeNull();
    expect(screen.getByTestId("catalogue-session-view-MULTIPLE").props.accessibilityState).toEqual({ selected: true });
    expect(shown()).toEqual(["genou"]);
  });

  it("filtres combinés à la vue : aucun résultat, message distinct (Q-E6)", async () => {
    renderScreen();
    await focus();
    fireEvent.press(screen.getByTestId("catalogue-session-view-SINGLE"));
    await openSheet();
    fireEvent.press(screen.getByTestId("session-filter-section-BODY_ZONES-toggle"));
    fireEvent.press(screen.getByTestId("session-filter-zone-genoux"));
    fireEvent.press(screen.getByTestId("session-filter-apply"));
    expect(shown()).toEqual([]);
    expect(screen.getByTestId("catalogue-session-no-match")).toHaveTextContent("Aucune séance ne correspond aux filtres.");
  });

  it("réouverture : les sections portant un filtre sont ouvertes", async () => {
    renderScreen();
    await focus();
    await openSheet();
    fireEvent.press(screen.getByTestId("session-filter-section-BODY_ZONES-toggle"));
    fireEvent.press(screen.getByTestId("session-filter-zone-dos"));
    fireEvent.press(screen.getByTestId("session-filter-apply"));
    fireEvent.press(screen.getByTestId("catalogue-filter-action-edit"));
    await flush();
    expect(screen.getByTestId("session-filter-section-BODY_ZONES-toggle").props.accessibilityState).toEqual({ expanded: true });
    expect(screen.getByTestId("session-filter-section-CATEGORIES-toggle").props.accessibilityState).toEqual({ expanded: false });
  });
});
