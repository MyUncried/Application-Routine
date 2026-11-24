import { fireEvent, render, screen } from "@testing-library/react-native";
import { describe, expect, it, jest } from "@jest/globals";
import { StyleSheet } from "react-native";

import { JournalRoutineCard } from "@/features/planning/JournalRoutineCard";

/**
 * Contre-recette du 23/11/2026 (c, modale de rattachement d'un programme) : la date de la carte ouvre la planification ; le cadre
 * est gris quand l'appelant le demande. Sans ces options, la carte du filtre de l'Agenda est inchangée.
 */
const base = { date: "12 nov.", year: "2030", name: "Genou", detail: "", slots: "3 créneaux", planned: true, expanded: false, onOpen: () => undefined, onToggleExpanded: () => undefined, testID: "card" };

describe("JournalRoutineCard — carte de sélection (contre-recette du 23/11/2026, c)", () => {
  it("sans option : toucher la date coche, cadre lilas", () => {
    const onToggle = jest.fn();
    render(<JournalRoutineCard {...base} selection={{ checked: false, onToggle }} />);
    fireEvent.press(screen.getByTestId("card-frame"));
    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(StyleSheet.flatten(screen.getByTestId("card-frame").props.style).backgroundColor).toBe("#EAEAFF");
    expect(screen.queryByTestId("card-dimmed")).toBeNull();
  });

  it("onOpen : toucher la date ouvre la planification sans cocher ; dimmed : cadre gris", () => {
    const onToggle = jest.fn();
    const onOpen = jest.fn();
    render(<JournalRoutineCard {...base} selection={{ checked: false, onToggle, onOpen, dimmed: true }} />);
    fireEvent.press(screen.getByTestId("card-frame"));
    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onToggle).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Modifier la planification, Genou")).toBeTruthy();
    expect(StyleSheet.flatten(screen.getByTestId("card-frame").props.style).backgroundColor).toBe("#F0F0F5");
    expect(screen.getByTestId("card-dimmed")).toBeTruthy();
    fireEvent.press(screen.getByTestId("card"));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
