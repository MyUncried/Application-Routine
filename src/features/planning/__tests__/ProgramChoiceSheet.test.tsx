import { act, fireEvent, render, screen, within } from "@testing-library/react-native";
import { describe, expect, it, jest } from "@jest/globals";

import type { Program } from "@/domain/programs/Program";
import { ProgramChoiceSheet } from "@/features/planning/ProgramChoiceSheet";
import type { ProgramService, ProgramSummary } from "@/features/programs/ProgramService";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

/**
 * D-545 (Hermann, 23/11/2026 ; contre-recette lot 4, x17) — modale « Rattacher un programme » : ✕ sans bouton Valider, titre,
 * « Actifs N · Terminés M », Rechercher, cartes du catalogue des programmes avec bouton radio ; toucher une carte non
 * sélectionnée la choisit, toucher la carte sélectionnée rend « Aucun ». Jest n'exerce pas la feuille native : iPhone.
 */
function program(id: string, name: string, startDate: string, endDate: string): Program {
  return { id, name, objective: null, startDate, endDate, terminatedAt: null } as unknown as Program;
}

const SUMMARIES: readonly ProgramSummary[] = [
  { program: program("p-genou", "Rééducation genou", "2030-09-15", "2030-12-15"), routineCount: 3, sessionCount: 4 },
  { program: program("p-trail", "Préparation trail", "2030-11-01", "2031-02-15"), routineCount: 2, sessionCount: 3 },
  { program: program("p-ancien", "Ancien", "2029-01-01", "2029-03-31"), routineCount: 1, sessionCount: 1 },
];

function service(): ProgramService {
  return { listSummaries: jest.fn(async () => SUMMARIES), today: () => "2030-10-01" } as unknown as ProgramService;
}

async function renderSheet(selectedId: string | null) {
  const onChoose = jest.fn();
  const onCancel = jest.fn();
  render(
    <TestSafeAreaProvider>
      <ProgramChoiceSheet service={service()} selectedId={selectedId} onCancel={onCancel} onChoose={onChoose} />
    </TestSafeAreaProvider>,
  );
  await act(async () => {
    await Promise.resolve();
  });
  return { onChoose, onCancel };
}

describe("ProgramChoiceSheet (D-545)", () => {
  it("en-tête : ✕ et titre centré, aucun bouton Valider ; zone de contexte sans Créer", async () => {
    const { onCancel } = await renderSheet(null);
    expect(screen.getByText("Rattacher un programme")).toBeTruthy();
    expect(screen.queryByTestId("screen-header-validate")).toBeNull();
    expect(screen.getByTestId("program-catalogue-search")).toBeTruthy();
    expect(screen.queryByText("Créer")).toBeNull();
    fireEvent.press(screen.getByTestId("screen-header-back"));
    expect(onCancel).toHaveBeenCalled();
  });

  it("« Actifs 2 · Terminés 1 », cartes actives avec radio vide ; toucher une carte la choisit", async () => {
    const { onChoose } = await renderSheet(null);
    expect(within(screen.getByTestId("program-status-ACTIVE")).getByText("2")).toBeTruthy();
    expect(within(screen.getByTestId("program-status-TERMINATED")).getByText("1")).toBeTruthy();
    expect(screen.getByTestId("program-choice-p-genou-empty")).toBeTruthy();
    expect(screen.getByTestId("program-choice-p-trail-empty")).toBeTruthy();
    expect(screen.queryByTestId("program-choice-p-ancien")).toBeNull();
    fireEvent.press(screen.getByTestId("program-choice-p-trail"));
    expect(onChoose).toHaveBeenCalledWith("p-trail");
  });

  it("programme actuel sélectionné à l'ouverture ; toucher sa carte rend « Aucun »", async () => {
    const { onChoose } = await renderSheet("p-genou");
    expect(screen.getByTestId("program-choice-p-genou-selected")).toBeTruthy();
    expect(screen.getByTestId("program-choice-p-genou").props.accessibilityState).toMatchObject({ selected: true });
    fireEvent.press(screen.getByTestId("program-choice-p-genou"));
    expect(onChoose).toHaveBeenCalledWith(null);
  });

  it("programme actuel terminé : la liste s'ouvre sur Terminés ; la recherche filtre les cartes", async () => {
    await renderSheet("p-ancien");
    expect(screen.getByTestId("program-choice-p-ancien-selected")).toBeTruthy();
    fireEvent.press(screen.getByTestId("program-status-ACTIVE"));
    fireEvent.changeText(screen.getByTestId("program-catalogue-search"), "trail");
    expect(screen.getByTestId("program-choice-p-trail")).toBeTruthy();
    expect(screen.queryByTestId("program-choice-p-genou")).toBeNull();
  });
});
