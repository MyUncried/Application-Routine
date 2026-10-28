import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { StyleSheet } from "react-native";

import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import type { Activity } from "@/domain/sessions/Session";
import type { CatalogueSessionRecord } from "@/domain/sessions/SessionRepository";
import type { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { ActivityDefinitionServiceContext } from "@/features/activities/ActivityDefinitionServiceContext";
import { CatalogueScreen } from "@/features/sessions/CatalogueScreen";
import { SessionCommandRow } from "@/features/sessions/SessionCommandRow";
import type { SessionService } from "@/features/sessions/SessionService";
import { SessionServiceContext } from "@/features/sessions/SessionServiceContext";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

/**
 * PRE-8 (epic E, story E.4) — écran du segment Séances : bascule « Un exercice | Plusieurs »,
 * désélection, état vide réel et liste sans résultat (Q-E6), conservation au retour, réinitialisation
 * à la relance, rangée responsive (Q-E4).
 */

const focusEffectHarness: { effect: (() => (() => void) | void) | null } = { effect: null };
const mockPush = jest.fn();
jest.mock("expo-router", () => {
  const actual = jest.requireActual("expo-router") as object;
  return {
    ...actual,
    useFocusEffect: (effect: () => (() => void) | void) => {
      focusEffectHarness.effect = effect;
    },
    useRouter: () => ({ push: mockPush, setParams: jest.fn() }),
    useLocalSearchParams: () => ({}),
  };
});

let sequence = 0;
const exercise = (): Activity => ({
  id: `ex-${++sequence}`,
  type: "EXERCISE",
  structuralPosition: "BEFORE_TOUR",
  position: 0,
  name: "Ex",
  executionParameters: durationParameters(30),
  postActivityRecoverySeconds: null,
  instruction: null,
  bodyZoneIds: [],
  categoryId: null,
  media: [],
});

const record = (id: string, count: number, status: "ACTIVE" | "ARCHIVED" = "ACTIVE"): CatalogueSessionRecord => ({
  id,
  name: `Séance ${id}`,
  color: "#3B82F6",
  labelId: null,
  status,
  archivedAt: null,
  updatedAt: "2026-10-28T08:00:00.000Z",
  structure: { elements: Array.from({ length: count }, () => ({ kind: "EXERCISE" as const, exercise: exercise() })), stopPoints: [] },
});

function renderScreen(records: readonly CatalogueSessionRecord[]) {
  const listCatalogueSessions = jest.fn(async () => records);
  const service = { listCatalogueSessions } as unknown as SessionService;
  const activityService = { listActivityDefinitions: jest.fn(async () => []) } as unknown as ActivityDefinitionService;
  const utils = render(
    <TestSafeAreaProvider>
      <SessionServiceContext.Provider value={service}>
        <ActivityDefinitionServiceContext.Provider value={activityService}>
          <CatalogueScreen />
        </ActivityDefinitionServiceContext.Provider>
      </SessionServiceContext.Provider>
    </TestSafeAreaProvider>,
  );
  return { ...utils, listCatalogueSessions };
}

async function focus() {
  await act(async () => {
    focusEffectHarness.effect?.();
    for (let index = 0; index < 4; index += 1) await Promise.resolve();
  });
}

const shown = () => screen.queryAllByTestId(/^catalogue-session-item-(?!.*-content$)/).map((node) => node.props.testID as string);

beforeEach(() => {
  mockPush.mockClear();
});

describe("PRE-8 E.4 — vues du segment Séances", () => {
  it("aucune option : collection complète ; Un exercice ; Plusieurs ; toucher l'option active la désélectionne", async () => {
    renderScreen([record("un", 1), record("deux", 2), record("vide", 0)]);
    await focus();
    expect(shown()).toEqual(["catalogue-session-item-un", "catalogue-session-item-deux", "catalogue-session-item-vide"]);
    const single = screen.getByTestId("catalogue-session-view-SINGLE");
    const multiple = screen.getByTestId("catalogue-session-view-MULTIPLE");
    expect(single.props.accessibilityState).toEqual({ selected: false });
    fireEvent.press(single);
    expect(shown()).toEqual(["catalogue-session-item-un"]);
    expect(screen.getByTestId("catalogue-session-view-SINGLE").props.accessibilityState).toEqual({ selected: true });
    expect(screen.getByTestId("catalogue-session-view-SINGLE").props.accessibilityHint).toBe("Touchez de nouveau pour afficher toutes les séances");
    fireEvent.press(multiple);
    expect(shown()).toEqual(["catalogue-session-item-deux"]);
    fireEvent.press(screen.getByTestId("catalogue-session-view-MULTIPLE"));
    expect(shown()).toHaveLength(3);
  });

  it("libellés Un exercice / Plusieurs, aucune option Toutes, cibles de 44 de haut", async () => {
    renderScreen([record("un", 1)]);
    await focus();
    expect(screen.getByText("Un exercice")).toBeTruthy();
    expect(screen.getByText("Plusieurs")).toBeTruthy();
    expect(screen.queryByText("Toutes")).toBeNull();
    const option = screen.getByTestId("catalogue-session-view-SINGLE");
    const height = StyleSheet.flatten(option.props.style).minHeight as number;
    expect(height + option.props.hitSlop.top + option.props.hitSlop.bottom).toBeGreaterThanOrEqual(44);
  });

  it("Catalogue réellement vide : message existant ; liste sans résultat : message distinct (Q-E6)", async () => {
    const { unmount } = renderScreen([]);
    await focus();
    expect(screen.getByText("Vous verrez ici la liste de vos séances dès que vous aurez commencé à les créer.")).toBeTruthy();
    unmount();
    renderScreen([record("deux", 2)]);
    await focus();
    fireEvent.press(screen.getByTestId("catalogue-session-view-SINGLE"));
    expect(screen.getByTestId("catalogue-session-no-match")).toHaveTextContent("Aucune séance ne correspond aux filtres.");
  });

  it("une Séance archivée n'apparaît pas par défaut (Statut Actives)", async () => {
    renderScreen([record("active", 1), record("archivee", 1, "ARCHIVED")]);
    await focus();
    expect(shown()).toEqual(["catalogue-session-item-active"]);
  });

  it("retour d'un parcours : vue conservée, liste relue sans état de chargement ; relance : collection complète", async () => {
    const { listCatalogueSessions, unmount } = renderScreen([record("un", 1), record("deux", 2)]);
    await focus();
    fireEvent.press(screen.getByTestId("catalogue-session-view-MULTIPLE"));
    const list = screen.getByTestId("catalogue-session-list");
    await focus();
    expect(listCatalogueSessions).toHaveBeenCalledTimes(2);
    expect(screen.getByTestId("catalogue-session-list")).toBe(list);
    expect(shown()).toEqual(["catalogue-session-item-deux"]);
    unmount();
    renderScreen([record("un", 1), record("deux", 2)]);
    await focus();
    expect(screen.getByTestId("catalogue-session-view-MULTIPLE").props.accessibilityState).toEqual({ selected: false });
    expect(shown()).toHaveLength(2);
  });

  it("la vue ne modifie aucune donnée (seule la lecture est appelée)", async () => {
    const { listCatalogueSessions } = renderScreen([record("un", 1)]);
    await focus();
    fireEvent.press(screen.getByTestId("catalogue-session-view-SINGLE"));
    expect(listCatalogueSessions).toHaveBeenCalledTimes(1);
    expect(mockPush).not.toHaveBeenCalled();
  });
});

describe("PRE-8 E.4 — rangée responsive (Q-E4)", () => {
  const layout = (width: number) => ({ nativeEvent: { layout: { width, height: 44, x: 0, y: 0 } } });
  const renderRow = (summary: string | null) =>
    render(
      <SessionCommandRow
        view={null}
        onToggleView={() => undefined}
        filterSummary={summary}
        onOpenFilters={() => undefined}
        onResetFilters={() => undefined}
        onCreate={() => undefined}
      />,
    );
  const measure = (available: number, toggle: number, extended?: number) => {
    fireEvent(screen.getByTestId("catalogue-command-row"), "layout", layout(available));
    fireEvent(screen.getByTestId("catalogue-session-view"), "layout", layout(toggle));
    if (extended !== undefined) fireEvent(screen.getByTestId("catalogue-filter-measure", { includeHiddenElements: true }), "layout", layout(extended));
  };

  it("ordre Filtre, Tri, Créer ; Créer le plus à droite", () => {
    renderRow(null);
    const commands = screen.getByTestId("catalogue-session-commands");
    expect(commands.children.map((child) => (typeof child === "string" ? child : child.props.testID))).toEqual([
      "catalogue-filter-action",
      "catalogue-sort-action",
      "catalogue-create-action",
    ]);
  });

  it("filtre actif : étendu quand la rangée tient (440) ; compact sinon (402) ; deux lignes à 360", () => {
    renderRow("Archivées");
    measure(408, 150, 132);
    expect(screen.getByTestId("catalogue-filter-action-edit").props.accessibilityLabel).toBe("Modifier les filtres, Archivées");
    expect(screen.queryByTestId("catalogue-filter-action-summary")).toBeTruthy();

    measure(370, 150, 132);
    expect(screen.queryByTestId("catalogue-filter-action-summary")).toBeNull();
    expect(screen.getByTestId("catalogue-filter-action-clear").props.accessibilityLabel).toBe("Réinitialiser les filtres");
    expect(StyleSheet.flatten(screen.getByTestId("catalogue-command-row").props.style).flexDirection).toBe("row");

    measure(328, 150, 132);
    expect(StyleSheet.flatten(screen.getByTestId("catalogue-command-row").props.style).flexDirection).toBe("column");
  });

  it("filtre inactif : un seul bouton rond, une ligne ; texte agrandi : deux lignes", () => {
    renderRow(null);
    measure(328, 150);
    expect(screen.queryByTestId("catalogue-filter-action-clear")).toBeNull();
    expect(StyleSheet.flatten(screen.getByTestId("catalogue-command-row").props.style).flexDirection).toBe("row");
    measure(328, 260);
    expect(StyleSheet.flatten(screen.getByTestId("catalogue-command-row").props.style).flexDirection).toBe("column");
  });
});
