import { fireEvent, render, screen } from "@testing-library/react-native";
import { describe, expect, it, jest } from "@jest/globals";

import type { ActivityDefinition } from "@/domain/activities";
import type { BodyZone } from "@/domain/body-zones/BodyZone";
import { ActivityCard } from "@/features/activities/ActivityCard";
import type { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { ActivityDefinitionServiceContext } from "@/features/activities/ActivityDefinitionServiceContext";

const BODY_ZONE_FIXTURES: readonly BodyZone[] = [
  { id: "cuisses", name: "Cuisses", isActive: true, createdAt: "2026-01-01T00:00:06.000Z" },
  { id: "dos", name: "Dos", isActive: true, createdAt: "2026-01-01T00:00:04.000Z" },
];

/**
 * `ActivityCard` s'auto-alimente en Zones corporelles persistées via
 * `ActivityDefinitionService.listBodyZones()` (V2-PRE-1, plan §3.1,
 * UI-07F470FC189F ; correction device check Hermann, commentaire 5948936550
 * — un accès direct à `useSQLiteContext` levait TOUJOURS en production,
 * cette carte étant rendue hors de `<SQLiteProvider>`) — doublé ici via
 * `ActivityDefinitionServiceContext`, jamais `expo-sqlite`/
 * `SqliteBodyZoneRepository`.
 */
function fakeActivityDefinitionService(): ActivityDefinitionService {
  return {
    listBodyZones: jest
      .fn<ActivityDefinitionService["listBodyZones"]>()
      .mockResolvedValue(BODY_ZONE_FIXTURES),
  } as unknown as ActivityDefinitionService;
}

function renderCard(ui: Parameters<typeof render>[0]) {
  return render(
    <ActivityDefinitionServiceContext.Provider value={fakeActivityDefinitionService()}>
      {ui}
    </ActivityDefinitionServiceContext.Provider>,
  );
}

const DEFINITION: ActivityDefinition = {
  id: "def-1",
  name: "Squat",
  description: null,
  executionMode: "DURATION",
  durationSeconds: 30,
  repetitionCount: null,
  seriesCount: 3,
  pauseSeconds: 10,
  categoryId: "cardio",
  bodyZoneIds: ["cuisses"],
  sideMode: "UNILATERAL",
  sideRecoverySeconds: 0,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

describe("ActivityCard", () => {
  it("renders the activity name", () => {
    renderCard(<ActivityCard definition={DEFINITION} />);
    expect(screen.getByText("Squat")).toBeTruthy();
  });

  it("opens editing when the main surface is pressed", () => {
    const onOpen = jest.fn();
    renderCard(<ActivityCard definition={DEFINITION} onOpen={onOpen} />);

    fireEvent.press(screen.getByTestId("activity-card-open"));

    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it("is not pressable without onOpen", () => {
    renderCard(<ActivityCard definition={DEFINITION} />);
    expect(screen.queryByTestId("activity-card-open")).toBeNull();
  });

  // Alignement DSF 07/10 (annexe I.2, `DSF / Cards / Exercice` `6214:4111`) :
  // le chevron Déployer — un contrôle désactivé, sans action — n'existe plus
  // sur les cartes d'Exercice ; Lecture reste visible et désactivée.
  it("renders Lecture as disabled, without handler, and no Déployer chevron", () => {
    renderCard(<ActivityCard definition={DEFINITION} onOpen={jest.fn()} />);

    const play = screen.getByTestId("activity-card-play");
    expect(play.props.accessibilityState.disabled).toBe(true);

    expect(screen.queryByLabelText("Déployer l’exercice")).toBeNull();
  });

  /**
   * V2-CAT-01 (UI-CAT-R-002) : chaque carte affiche une marque de couleur,
   * les Zones corporelles, le mode/la cible, les Séries et la Pause — jamais
   * seulement le nom. V2-PRE-1 (plan §3.1) : plus aucune Récupération propre
   * à la Définition — aucune sous-carte Récupération n'existe donc plus ici.
   */
  it("shows a fixed color mark, the body zones and the mode/target/series/pause summary", async () => {
    renderCard(
      <ActivityCard
        definition={{
          ...DEFINITION,
          bodyZoneIds: ["dos"],
        }}
      />,
    );

    expect(screen.getByTestId(`activity-card-color-bar-${DEFINITION.id}`)).toBeTruthy();
    expect(await screen.findByTestId(`activity-card-body-zones-${DEFINITION.id}`)).toBeTruthy();
    expect(screen.getByText(/série/u)).toBeTruthy();
  });

  it("omits the body zones line when absent, without an empty line", async () => {
    renderCard(<ActivityCard definition={{ ...DEFINITION, bodyZoneIds: [] }} />);

    await screen.findByText("Squat");
    expect(screen.queryByTestId(`activity-card-body-zones-${DEFINITION.id}`)).toBeNull();
  });
});

/**
 * PRE-3 (DSF cartes-durée 07/10, phrase v1 §4, v13 §7) — durée intrinsèque
 * de la définition sur la carte Catalogue ; indicateur compact des Séries
 * variables ; aucune refonte de la carte.
 */
describe("ActivityCard — PRE-3", () => {
  const canonical = (overrides: Partial<NonNullable<ActivityDefinition["executionParameters"]>>) => ({
    version: 1 as const,
    mode: "DURATION" as const,
    series: { kind: "UNIFORM" as const, count: 3, target: 90, pauseSeconds: 15 },
    sideMode: "UNILATERAL" as const,
    sideOrder: "BY_SIDE" as const,
    sideRecoverySeconds: 0,
    cadenceBeepIntervalSeconds: 0,
    countdownSeconds: 10,
    endSeconds: 5,
    ...overrides,
  });

  it("durée exacte, ≈ en Répétitions avec bip, absente sans bip ou À l'échec ; « N séries variables » sans valeurs", () => {
    const { unmount } = renderCard(<ActivityCard definition={{ ...DEFINITION, executionParameters: canonical({}) }} onOpen={jest.fn()} />);
    expect(screen.getByTestId(`activity-card-${DEFINITION.id}-duration`).props.children).toBe("5 min 15 s");
    unmount();

    const reps = renderCard(
      <ActivityCard
        definition={{
          ...DEFINITION,
          executionParameters: canonical({
            mode: "REPETITIONS",
            series: { kind: "UNIFORM", count: 4, target: 15, pauseSeconds: 15 },
            cadenceBeepIntervalSeconds: 4,
          }),
        }}
        onOpen={jest.fn()}
      />,
    );
    expect(screen.getByTestId(`activity-card-${DEFINITION.id}-duration`).props.children).toBe("≈ 5 min");
    reps.unmount();

    const failure = renderCard(
      <ActivityCard
        definition={{
          ...DEFINITION,
          executionParameters: canonical({
            mode: "TO_FAILURE",
            series: { kind: "VARIABLE", rows: [{ target: null, pauseSeconds: 10 }, { target: null, pauseSeconds: 20 }] },
          }),
        }}
        onOpen={jest.fn()}
      />,
    );
    expect(screen.queryByTestId(`activity-card-${DEFINITION.id}-duration`)).toBeNull();
    expect(screen.getByText("2 séries variables")).toBeTruthy();
    failure.unmount();
  });
});
