import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";

import { durationParameters } from "@/domain/activities/testing/executionParametersFixtures";
import type { Activity } from "@/domain/sessions/Session";
import type { CatalogueSessionRecord } from "@/domain/sessions/SessionRepository";
import { ArchivedSessionConsultation } from "@/features/sessions/ArchivedSessionConsultation";
import type { SessionService } from "@/features/sessions/SessionService";
import { SessionServiceContext } from "@/features/sessions/SessionServiceContext";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

/**
 * Recette E du 28/10/2026 (Hermann, e5-12 : « Composition en lecture seule ») — une Séance archivée
 * s'ouvre en consultation : nom, avis de consultation seule, conteneurs, cartes d'Exercice et
 * récupérations ; aucune commande de modification, aucune écriture ; retour par l'en-tête.
 */

let sequence = 0;
const exercise = (name: string, overrides: Partial<Activity> = {}): Activity => ({
  id: `ex-${++sequence}`,
  type: "EXERCISE",
  structuralPosition: "BEFORE_TOUR",
  position: 0,
  name,
  executionParameters: durationParameters(45),
  postActivityRecoverySeconds: null,
  instruction: null,
  bodyZoneIds: [],
  categoryId: null,
  media: [],
  ...overrides,
});

const squat = exercise("Squat", { postActivityRecoverySeconds: 30 });
const fente = exercise("Fente");
const gainage = exercise("Gainage");

const archived: CatalogueSessionRecord = {
  id: "s-1",
  name: "Renforcement du genou",
  color: "#3B82F6",
  labelId: null,
  status: "ARCHIVED",
  archivedAt: "2026-10-28T09:00:00.000Z",
  updatedAt: "2026-10-28T08:00:00.000Z",
  structure: {
    elements: [
      { kind: "CIRCUIT", circuit: { id: "c-1", repeatCount: 3, nature: "TOURS", exercises: [squat, fente] } },
      { kind: "EXERCISE", exercise: gainage },
    ],
    stopPoints: [],
  },
};

function renderConsultation(record: CatalogueSessionRecord | null) {
  const getSessionForConsultation = jest.fn(async () => record);
  const writes = { archiveSession: jest.fn(), restoreSession: jest.fn(), updateSession: jest.fn(), deleteArchivedSession: jest.fn() };
  const service = { getSessionForConsultation, ...writes } as unknown as SessionService;
  const onBack = jest.fn();
  render(
    <TestSafeAreaProvider>
      <SessionServiceContext.Provider value={service}>
        <ArchivedSessionConsultation sessionId="s-1" categories={[]} bodyZones={[]} onBack={onBack} />
      </SessionServiceContext.Provider>
    </TestSafeAreaProvider>,
  );
  return { getSessionForConsultation, writes, onBack };
}

describe("Recette E (e5-12) — consultation d'une Séance archivée", () => {
  it("affiche le nom, l'avis de consultation seule, le Circuit et chaque Exercice dans l'ordre", async () => {
    const { getSessionForConsultation } = renderConsultation(archived);
    await waitFor(() => expect(screen.getByTestId("archived-consultation")).toBeTruthy());
    expect(getSessionForConsultation).toHaveBeenCalledWith("s-1");
    expect(screen.getByTestId("archived-consultation-name")).toHaveTextContent("Renforcement du genou");
    expect(screen.getByTestId("archived-consultation-notice")).toHaveTextContent(
      "Séance archivée : consultation seule. Restaurez-la depuis le Catalogue pour la modifier.",
    );
    expect(screen.getByTestId("archived-consultation-container-c-1")).toHaveTextContent("Circuit · 3 tours");
    const order = screen
      .getAllByTestId(/^archived-consultation-exercise-/)
      .map((node) => node.props.testID as string);
    expect(order).toEqual([`archived-consultation-exercise-${squat.id}`, `archived-consultation-exercise-${fente.id}`, `archived-consultation-exercise-${gainage.id}`]);
    expect(screen.getByText("Squat")).toBeTruthy();
    expect(screen.getByText("Gainage")).toBeTruthy();
  });

  it("aucune commande de modification ni écriture ; le retour ferme la consultation", async () => {
    const { writes, onBack } = renderConsultation(archived);
    await waitFor(() => expect(screen.getByTestId("archived-consultation")).toBeTruthy());
    expect(screen.queryByText("Enregistrer")).toBeNull();
    expect(screen.queryByText("Ajouter un exercice")).toBeNull();
    for (const write of Object.values(writes)) expect(write).not.toHaveBeenCalled();
    fireEvent.press(screen.getByLabelText("Retour"));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it("Séance introuvable : message d'erreur, aucun formulaire", async () => {
    renderConsultation(null);
    await waitFor(() => expect(screen.getByTestId("archived-consultation-unavailable")).toBeTruthy());
    expect(screen.getByText("Impossible de charger cette séance.")).toBeTruthy();
  });
});
