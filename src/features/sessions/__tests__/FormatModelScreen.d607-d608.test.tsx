import { describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { useEffect, useState } from "react";

import type { Movement } from "@/domain/activities/Movement";
import { createEmptyDraft, type SessionDraft } from "@/domain/sessions/SessionDraft";
import { ActivityDefinitionServiceContext } from "@/features/activities/ActivityDefinitionServiceContext";
import { circuitDisplayTitle, formatModelName } from "@/features/sessions/carrierPresentation";
import { FormatModelDraftProvider } from "@/features/sessions/FormatModelDraftContext";
import { FormatModelScreen } from "@/features/sessions/FormatModelScreen";
import { SessionDraftContext, type SessionDraftContextValue } from "@/features/sessions/SessionDraftContext";
import { strings } from "@/shared/i18n";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

/**
 * D-607 (D-572 de la branche de documentation, point 8) et D-608 (D-573, point 3) — Hermann, 25-26/11/2026 ; Formats §§ 9.9 et 9.10 :
 * - nom du Superset selon le nombre de mouvements (2 : Superset, 3 : Tri-set, 4 et plus : Giant set) pour la modale, la proposition de
 *   préfixe du nom de séance et la carte du catalogue ;
 * - HIIT de bout en bout dans l'écran du format : nom, accroche, choix de deux mouvements, Nombre de séries 6, Durée totale 12 min
 *   (Figma « HIIT — Récapitulatif »), enregistrement dans la séance avec le préfixe « HIIT ».
 * Jest ne prouve que l'arbre JS : la vérification visuelle et tactile est faite par Hermann sur iPhone.
 */

let mockModel = "HIIT";
let mockUuid = 0;
jest.mock("expo-crypto", () => ({ randomUUID: () => `uuid-${++mockUuid}` }));
jest.mock("expo-router", () => {
  const actual = jest.requireActual("expo-router") as object;
  return {
    ...actual,
    useRouter: () => ({ push: jest.fn(), back: jest.fn(), dismissTo: jest.fn(), dismiss: jest.fn() }),
    useNavigation: () => ({ getState: () => ({ index: 1, routes: [{ name: "(tabs)" }, { name: "formats-window" }] }), dispatch: jest.fn(), goBack: jest.fn() }),
    useLocalSearchParams: () => ({ model: mockModel }),
    useFocusEffect: () => undefined,
  };
});

const movement = (id: string, name: string): Movement => ({
  id,
  name,
  description: null,
  media: [],
  categoryId: "cardio",
  bodyZoneIds: ["jambes"],
  phases: [],
  nextPhaseId: 1,
  aliases: [],
  levelGroup: null,
});
const SQUATS = movement("mv-squats", "Squats sautés");
const FENTES = movement("mv-fentes", "Fentes avant");
const service = {
  supportsMovementSearch: true,
  listMovementChoices: async () => [
    { movement: SQUATS, level: null },
    { movement: FENTES, level: null },
  ],
} as never;
const models = strings.screens.sessionModels;

const seen: { draft: SessionDraft | null } = { draft: null };
function Harness() {
  const [draft, setDraft] = useState<SessionDraft>(createEmptyDraft);
  useEffect(() => {
    seen.draft = draft;
  }, [draft]);
  const update = (patch: Partial<SessionDraft>) => setDraft((current) => ({ ...current, ...patch }));
  const value = { draft, updateDraft: update, suggestDraftName: (name: string) => update({ name }), resetDraft: jest.fn(), hydrateFromSession: jest.fn() } as unknown as SessionDraftContextValue;
  return (
    <TestSafeAreaProvider>
      <ActivityDefinitionServiceContext.Provider value={service}>
        <SessionDraftContext.Provider value={value}>
          <FormatModelDraftProvider>
            <FormatModelScreen stage="summary" />
          </FormatModelDraftProvider>
        </SessionDraftContext.Provider>
      </ActivityDefinitionServiceContext.Provider>
    </TestSafeAreaProvider>
  );
}

async function openWithTwoMovements(model: string) {
  mockModel = model;
  render(<Harness />);
  await screen.findByTestId("format-title");
  fireEvent.press(await screen.findByTestId("format-catalogue-card-mv-squats"));
  fireEvent.press(await screen.findByTestId("format-catalogue-card-mv-fentes"));
  await act(async () => {
    fireEvent.press(screen.getByTestId("format-catalogue-add"));
  });
  await waitFor(() => expect(screen.queryByTestId("format-catalogue-layer")).toBeNull());
}

describe("D-608 — HIIT de bout en bout dans l'écran du format", () => {
  it("nom « HIIT », accroche de Figma ; deux mouvements : 6 séries, Durée totale 12 min ; enregistré dans la séance, préfixe « HIIT », origine HIIT", async () => {
    await openWithTwoMovements("HIIT");
    expect(screen.getByTestId("format-title")).toHaveTextContent("HIIT");
    expect(screen.getByText("40’’ d’effort, 20’’ de récupération.\nLe format intense, entièrement réglable.")).toBeTruthy();
    expect(screen.getByTestId("format-row-seriesCount")).toHaveTextContent(/6/);
    expect(screen.getByTestId("format-total")).toHaveTextContent(/12/);
    expect(screen.getByTestId("format-line-1-name-open")).toBeTruthy();
    await act(async () => {
      fireEvent.press(screen.getByTestId("format-save"));
    });
    await waitFor(() => expect(seen.draft?.name).toBe("HIIT"));
    expect(seen.draft?.origin).toBe("HIIT");
    const circuit = seen.draft?.structure?.elements.find((element) => element.kind === "CIRCUIT");
    expect(circuit?.kind === "CIRCUIT" && circuit.circuit.originModel).toBe("HIIT");
  });
});

describe("D-607 — nom du Superset selon le nombre de mouvements", () => {
  it("2 : Superset ; 3 : Tri-set ; 4 : Giant set ; 5 : Giant set ; autres formats : nom de leur carte", () => {
    expect([0, 1, 2, 3, 4, 5].map((count) => formatModelName("SUPERSET", count))).toEqual(["Superset", "Superset", "Superset", "Tri-set", "Giant set", "Giant set"]);
    expect(formatModelName("HIIT", 4)).toBe(models.cards.HIIT.title);
    expect(formatModelName("TABATA", 3)).toBe("Tabata");
  });

  it("carte du catalogue et Composition : le nom du Circuit Superset suit le nombre de ses membres ; un nom choisi par Renommer prime", () => {
    const circuit = (count: number) => ({ originModel: "SUPERSET" as const, exercises: Array.from({ length: count }, (_, index) => `e${index}`) });
    expect([2, 3, 4, 5].map((count) => circuitDisplayTitle(circuit(count)))).toEqual(["Superset", "Tri-set", "Giant set", "Giant set"]);
    expect(circuitDisplayTitle({ ...circuit(3), name: "Bras" })).toBe("Bras");
    expect(circuitDisplayTitle({ originModel: "HIIT", exercises: ["a", "b"] })).toBe("HIIT");
  });

  it("modale du format : deux mouvements choisis, titre « Superset »", async () => {
    await openWithTwoMovements("SUPERSET");
    expect(screen.getByTestId("format-title")).toHaveTextContent("Superset");
  });
});
