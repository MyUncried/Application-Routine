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
  // D-540 : routine terminée (aucun créneau à venir), toujours proposée.
  { routine: routine("r2", "Genou", "2030-11-30"), upcoming: 0 },
];

function renderSheet() {
  const onClose = jest.fn();
  const onValidate = jest.fn();
  render(
    <TestSafeAreaProvider>
      <RoutineFilterSheet choices={choices} loading={false} sessions={new Map()} onClose={onClose} onValidate={onValidate} />
    </TestSafeAreaProvider>,
  );
  return { onClose, onValidate };
}

describe("Filtrer par routine (D-539)", () => {
  it("libellés : « Filtrer N routines », « Filtrer 1 routine » ; ligne 3", () => {
    expect(routineFilterButtonLabel(2)).toBe("Filtrer 2 routines");
    expect(routineFilterButtonLabel(1)).toBe("Filtrer 1 routine");
    expect(routineFilterSlotsLine(choices[0]!)).toBe("6 à venir, jusqu’au 28/12/2030");
  });

  it("cartes réduites (nom, ligne 3, case), terminée comprise ; sélection multiple ; ✕ ferme sans valider", () => {
    const { onClose, onValidate } = renderSheet();
    expect(screen.getByText("Filtrer par routine")).toBeTruthy();
    expect(screen.getByTestId("routine-filter-card-r2-name").props.children).toBe("Genou");
    expect(screen.queryByTestId("routine-filter-card-r1-chevron")).toBeNull();
    expect(screen.getByTestId("routine-filter-card-r1-check-unchecked")).toBeTruthy();
    // D-539 mis à jour : sans sélection, le bouton est désactivé (plus de « Afficher toutes les routines »).
    expect(screen.queryByText("Afficher toutes les routines")).toBeNull();
    expect(screen.getByTestId("routine-filter-apply").props.accessibilityState).toMatchObject({ disabled: true });
    fireEvent.press(screen.getByTestId("routine-filter-apply"));
    expect(onValidate).not.toHaveBeenCalled();
    fireEvent.press(screen.getByTestId("routine-filter-card-r1"));
    expect(screen.getByTestId("routine-filter-apply").props.accessibilityState).toMatchObject({ disabled: false });
    expect(screen.getByText("Filtrer 1 routine")).toBeTruthy();
    fireEvent.press(screen.getByTestId("routine-filter-card-r2"));
    expect(screen.getByText("Filtrer 2 routines")).toBeTruthy();
    fireEvent.press(screen.getByTestId("routine-filter-apply"));
    expect(onValidate).toHaveBeenCalledWith(["r1", "r2"]);
    fireEvent.press(screen.getByLabelText("Fermer"));
    expect(onClose).toHaveBeenCalled();
  });

  // D-553 (21/11/2026, § 5 et arbitrage 3) : une ligne par Routine (parcours : nom de Routine et Ⓟ, jamais une ligne par
  // Séance) ; actives puis terminées ; doublons de noms possibles, sélection liée à l'identifiant.
  it("une ligne par Routine, parcours compris ; actives puis terminées ; noms identiques sélectionnés par identifiant (D-553)", () => {
    const parcours: Routine = {
      ...routine("p", "Mobilité du matin", "2030-12-28"),
      entries: [
        { id: "e-p1", sessionId: "s-a", frequency: EVERY_TIME },
        { id: "e-p2", sessionId: "s-b", frequency: EVERY_TIME },
      ],
    };
    const list: RoutineFilterChoice[] = [
      { routine: routine("t", "Abdos", "2030-08-05"), upcoming: 0, active: false },
      { routine: routine("d1", "Genou", "2030-12-28"), upcoming: 3, active: true },
      { routine: routine("d2", "Genou", "2030-12-28"), upcoming: 2, active: true },
      { routine: parcours, upcoming: 4, active: true },
    ];
    const onValidate = jest.fn();
    render(
      <TestSafeAreaProvider>
        <RoutineFilterSheet choices={list} loading={false} sessions={new Map()} onClose={jest.fn()} onValidate={onValidate} />
      </TestSafeAreaProvider>,
    );
    const order = screen.queryAllByTestId(/^routine-filter-card-[a-z0-9]+$/).map((node) => node.props.testID as string);
    expect(order).toEqual(["routine-filter-card-d1", "routine-filter-card-d2", "routine-filter-card-p", "routine-filter-card-t"]);
    expect(screen.getByTestId("routine-filter-card-p-name").props.children).toBe("Mobilité du matin");
    expect(screen.getByTestId("routine-filter-card-p-parcours")).toBeTruthy();
    fireEvent.press(screen.getByTestId("routine-filter-card-d2"));
    fireEvent.press(screen.getByTestId("routine-filter-apply"));
    expect(onValidate).toHaveBeenCalledWith(["d2"]);
  });

  it("ouverture : aucune routine cochée (sans mémoire du filtre précédent) ; recherche ; filtre du Catalogue des séances", () => {
    renderSheet();
    expect(screen.getByTestId("routine-filter-card-r1-check-unchecked")).toBeTruthy();
    expect(screen.getByTestId("routine-filter-card-r2-check-unchecked")).toBeTruthy();
    fireEvent.changeText(screen.getByTestId("routine-filter-search"), "dos");
    expect(screen.queryByTestId("routine-filter-card-r2")).toBeNull();
    expect(screen.getByTestId("routine-filter-card-r1")).toBeTruthy();
    fireEvent.press(screen.getByTestId("routine-filter-filter"));
    expect(mockPush).toHaveBeenLastCalledWith("/catalogue-filters");
  });
});
