import { fireEvent, render, screen } from "@testing-library/react-native";
import { describe, expect, it, jest } from "@jest/globals";

import type { ActivityDefinition } from "@/domain/activities";
import type { BodyZone } from "@/domain/body-zones/BodyZone";
import { ActivityCard } from "@/features/activities/ActivityCard";

/**
 * `ActivityCard` s'auto-alimente désormais en Zones corporelles persistées
 * via `useSQLiteContext` (V2-PRE-1, plan §3.1, UI-07F470FC189F) — sans
 * `<SQLiteProvider>` réel en tests, `expo-sqlite` et le Repository sont
 * doublés ici, même patron que les autres suites consommant une connexion
 * SQLite (`SessionServiceProvider.test.tsx`).
 */
jest.mock("expo-sqlite", () => ({
  useSQLiteContext: () => ({}),
}));

const BODY_ZONE_FIXTURES: readonly BodyZone[] = [
  { id: "cuisses", name: "Cuisses", isActive: true, createdAt: "2026-01-01T00:00:06.000Z" },
  { id: "dos", name: "Dos", isActive: true, createdAt: "2026-01-01T00:00:04.000Z" },
];

jest.mock("@/infrastructure/database/repositories/SqliteBodyZoneRepository", () => ({
  SqliteBodyZoneRepository: jest.fn().mockImplementation(() => ({
    listAll: jest.fn<() => Promise<readonly BodyZone[]>>().mockResolvedValue(BODY_ZONE_FIXTURES),
  })),
}));

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
    render(<ActivityCard definition={DEFINITION} />);
    expect(screen.getByText("Squat")).toBeTruthy();
  });

  it("opens editing when the main surface is pressed", () => {
    const onOpen = jest.fn();
    render(<ActivityCard definition={DEFINITION} onOpen={onOpen} />);

    fireEvent.press(screen.getByTestId("activity-card-open"));

    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it("is not pressable without onOpen", () => {
    render(<ActivityCard definition={DEFINITION} />);
    expect(screen.queryByTestId("activity-card-open")).toBeNull();
  });

  it("renders Déployer and Lecture as disabled, without handlers", () => {
    render(<ActivityCard definition={DEFINITION} onOpen={jest.fn()} />);

    const play = screen.getByTestId("activity-card-play");
    expect(play.props.accessibilityState.disabled).toBe(true);

    const disclosure = screen.getByLabelText("Déployer l’exercice");
    expect(disclosure.props.accessibilityState?.disabled ?? disclosure.props.disabled).toBeTruthy();
  });

  /**
   * V2-CAT-01 (UI-CAT-R-002) : chaque carte affiche une marque de couleur,
   * les Zones corporelles, le mode/la cible, les Séries et la Pause — jamais
   * seulement le nom. V2-PRE-1 (plan §3.1) : plus aucune Récupération propre
   * à la Définition — aucune sous-carte Récupération n'existe donc plus ici.
   */
  it("shows a fixed color mark, the body zones and the mode/target/series/pause summary", async () => {
    render(
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
    render(<ActivityCard definition={{ ...DEFINITION, bodyZoneIds: [] }} />);

    await screen.findByText("Squat");
    expect(screen.queryByTestId(`activity-card-body-zones-${DEFINITION.id}`)).toBeNull();
  });
});
