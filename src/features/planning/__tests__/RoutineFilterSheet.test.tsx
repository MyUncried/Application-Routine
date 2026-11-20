import { fireEvent, render, screen } from "@testing-library/react-native";
import { describe, expect, it, jest } from "@jest/globals";

import { EVERY_TIME, type Routine } from "@/domain/planning/Routine";
import { RoutineFilterSheet, routineFilterButtonLabel, routineFilterSlotsLine, type RoutineFilterChoice } from "@/features/planning/RoutineFilterSheet";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

/** D-539 (20/11/2026) — modale « Filtrer par routine » de l'Agenda. Une suite verte ne remplace pas la recette sur iPhone. */

const mockPush = jest.fn();
jest.mock("expo-router", () => ({ useRouter: () => ({ push: mockPush, back: jest.fn() }) }));

const routine = (id: string, name: string, end: string): Routine => ({
  id,
  name,
  startDate: "2030-08-05",
  time: "08:00",
  repetition: { unit: "WEEK", every: 1, weekdays: [1], end: { kind: "UNTIL", date: end } },
  entries: [{ id: `e-${id}`, sessionId: `s-${id}`, frequency: EVERY_TIME }],
  exclusions: [],
  reminderMinutes: null,
  createdAt: "2030-08-01T10:00:00.000Z",
  updatedAt: "2030-08-01T10:00:00.000Z",
});
const choices: RoutineFilterChoice[] = [
  { routine: routine("r1", "Dos et mobilité", "2030-12-28"), upcoming: 6 },
  { routine: { ...routine("r2", "Genou", "2030-11-30"), archivedAt: "2030-09-01T10:00:00.000Z" }, upcoming: 0 },
];

function renderSheet(initial: readonly string[] = []) {
  const onClose = jest.fn();
  const onValidate = jest.fn();
  render(
    <TestSafeAreaProvider>
      <RoutineFilterSheet choices={choices} loading={false} sessions={new Map()} initial={initial} onClose={onClose} onValidate={onValidate} />
    </TestSafeAreaProvider>,
  );
  return { onClose, onValidate };
}

describe("Filtrer par routine (D-539)", () => {
  it("libellés : « Filtrer N routines », « Filtrer 1 routine », « Afficher toutes les routines » ; ligne 3", () => {
    expect(routineFilterButtonLabel(2)).toBe("Filtrer 2 routines");
    expect(routineFilterButtonLabel(1)).toBe("Filtrer 1 routine");
    expect(routineFilterButtonLabel(0)).toBe("Afficher toutes les routines");
    expect(routineFilterSlotsLine(choices[0]!)).toBe("6 à venir, jusqu’au 28/12/2030");
  });

  it("cartes réduites (nom, ligne 3, case), archivée comprise ; sélection multiple ; ✕ ferme sans valider", () => {
    const { onClose, onValidate } = renderSheet();
    expect(screen.getByText("Filtrer par routine")).toBeTruthy();
    expect(screen.getByTestId("routine-filter-card-r2-name").props.children).toBe("Genou");
    expect(screen.queryByTestId("routine-filter-card-r1-chevron")).toBeNull();
    expect(screen.getByTestId("routine-filter-card-r1-check-unchecked")).toBeTruthy();
    expect(screen.getByText("Afficher toutes les routines")).toBeTruthy();
    fireEvent.press(screen.getByTestId("routine-filter-card-r1"));
    expect(screen.getByText("Filtrer 1 routine")).toBeTruthy();
    fireEvent.press(screen.getByTestId("routine-filter-card-r2"));
    expect(screen.getByText("Filtrer 2 routines")).toBeTruthy();
    fireEvent.press(screen.getByTestId("routine-filter-apply"));
    expect(onValidate).toHaveBeenCalledWith(["r1", "r2"]);
    fireEvent.press(screen.getByLabelText("Fermer"));
    expect(onClose).toHaveBeenCalled();
  });

  it("réouverture : les routines du filtre en cours sont cochées ; recherche ; filtre du Catalogue des séances", () => {
    renderSheet(["r2"]);
    expect(screen.getByTestId("routine-filter-card-r2-check-checked")).toBeTruthy();
    fireEvent.changeText(screen.getByTestId("routine-filter-search"), "dos");
    expect(screen.queryByTestId("routine-filter-card-r2")).toBeNull();
    expect(screen.getByTestId("routine-filter-card-r1")).toBeTruthy();
    fireEvent.press(screen.getByTestId("routine-filter-filter"));
    expect(mockPush).toHaveBeenLastCalledWith("/catalogue-filters");
  });
});
