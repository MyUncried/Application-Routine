import { fireEvent, render, screen, within } from "@testing-library/react-native";
import { describe, expect, it, jest } from "@jest/globals";

import { PlanningSelection } from "@/features/planning/PlanningSelection";
import type { SessionCatalogueProjection } from "@/features/sessions/sessionCatalogueProjection";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

/**
 * « Catalogue des séances » de la planification — recette du 17/11/2026 : case ronde, numéro d'ordre de sélection en
 * blanc sur fond bleu ; durée sur la troisième ligne de la carte.
 */

jest.mock("expo-router", () => ({ useRouter: () => ({ push: jest.fn(), back: jest.fn() }) }));

const projection = (id: string, name: string): SessionCatalogueProjection =>
  ({
    id,
    name,
    status: "ACTIVE",
    duration: { kind: "EXACT", seconds: 600 },
    forTimeBound: false,
    categories: [],
    visual: { kind: "FORMAT", format: "TABATA" },
    mosaic: [],
    movementNames: [],
    formatNames: [],
    circuitCount: 1,
    exerciseCount: 2,
    incomplete: false,
    toVerify: false,
  }) as unknown as SessionCatalogueProjection;

describe("PlanningSelection", () => {
  it("numérote les séances cochées dans l'ordre de sélection ; décocher renumérote", () => {
    const onValidate = jest.fn();
    render(
      <TestSafeAreaProvider>
        <PlanningSelection
          sessions={[projection("a", "Alpha"), projection("b", "Bravo"), projection("c", "Charlie")]}
          loading={false}
          failed={false}
          initial={[]}
          onCancel={jest.fn()}
          onValidate={onValidate}
        />
      </TestSafeAreaProvider>,
    );
    fireEvent.press(screen.getByTestId("planning-selection-c"));
    fireEvent.press(screen.getByTestId("planning-selection-a"));
    expect(screen.getByTestId("planning-selection-c-checked")).toHaveTextContent("1");
    expect(screen.getByTestId("planning-selection-a-checked")).toHaveTextContent("2");
    fireEvent.press(screen.getByTestId("planning-selection-c"));
    expect(screen.getByTestId("planning-selection-a-checked")).toHaveTextContent("1");
    fireEvent.press(screen.getByTestId("screen-header-validate"));
    expect(onValidate).toHaveBeenCalledWith(["a"]);
  });

  it("« Changer » : les séances choisies sont figées au-dessus de la liste, dans l'ordre ; décocher les rend à la liste", () => {
    render(
      <TestSafeAreaProvider>
        <PlanningSelection
          sessions={[projection("a", "Alpha"), projection("b", "Bravo"), projection("c", "Charlie")]}
          loading={false}
          failed={false}
          initial={["c", "a"]}
          onCancel={jest.fn()}
          onValidate={jest.fn()}
        />
      </TestSafeAreaProvider>,
    );
    const pinnedIds = () =>
      within(screen.getByTestId("planning-selection-pinned"))
        .queryAllByTestId(/^planning-selection-[abc]$/)
        .map((node) => node.props.testID as string);
    expect(pinnedIds()).toEqual(["planning-selection-c", "planning-selection-a"]);
    expect(within(screen.getByTestId("planning-selection-list")).queryAllByTestId(/^planning-selection-[abc]$/).map((node) => node.props.testID)).toEqual(["planning-selection-b"]);
    fireEvent.press(screen.getByTestId("planning-selection-c"));
    expect(pinnedIds()).toEqual(["planning-selection-a"]);
    fireEvent.press(screen.getByTestId("planning-selection-a"));
    expect(screen.queryByTestId("planning-selection-pinned")).toBeNull();
  });
});
