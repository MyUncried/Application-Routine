import { describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen } from "@testing-library/react-native";

import { DEFAULT_GUIDANCE_EVENTS, type GuidanceSettings } from "@/domain/preferences/guidanceSettings";
import type { SessionGuidance } from "@/domain/sessions/sessionGuidance";
import { ProfileService } from "@/features/preferences/ProfileService";
import { ProfileServiceContext } from "@/features/preferences/ProfileServiceContext";
import { SessionGuidanceSheet } from "@/features/sessions/SessionGuidanceSheet";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteProfileRepository } from "@/infrastructure/database/repositories/SqliteProfileRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

jest.mock("@/infrastructure/audio/ExecutionSounds", () => ({
  ExecutionSounds: class {
    play() {}
  },
}));

/**
 * Modale « Guidage sonore » de la Composition (documentation de main `ebe72f76`, Figma `12132:27436`, `12175:25882` ;
 * demande de Hermann du 11/11/2026, cahier, constat d) : réglages effectifs à l'ouverture, « Fermer » abandonne,
 * « Valider » applique à la séance seulement, « Choix d'un son » dans la même feuille.
 * [Remplacé le 11/11/2026 — feuille « Guidage de la séance » (Sons, Voix, objectif, « Comme le Profil »).]
 */
async function renderSheet(initial: SessionGuidance | undefined, prepare?: (repository: SqliteProfileRepository) => Promise<void>) {
  const database = NodeSqliteDatabase.openInMemory();
  await migrateDatabase(database);
  const repository = new SqliteProfileRepository(database);
  await prepare?.(repository);
  const onApply = jest.fn<(guidance: SessionGuidance) => void>();
  const onClose = jest.fn();
  const view = render(
    <TestSafeAreaProvider>
    <ProfileServiceContext.Provider value={new ProfileService(repository)}>
      <SessionGuidanceSheet initial={initial} onApply={onApply} onClose={onClose} />
    </ProfileServiceContext.Provider>
    </TestSafeAreaProvider>,
  );
  await act(async () => undefined);
  return { onApply, onClose, repository, view };
}

const checked = (testID: string) => screen.getByTestId(testID).props.accessibilityState.checked as boolean;
const soundValue = (event: string) => screen.getByTestId(`session-guidance-event-${event}-sound`).props.accessibilityValue.text as string;

describe("modale Guidage sonore de la Composition", () => {
  it("Séance sans réglage propre : réglages du Profil à l'ouverture ; les deux groupes du design", async () => {
    await renderSheet(undefined, async (repository) => {
      await repository.updatePreference("announceSidesEnabled", false);
      await repository.updateGuidanceEvent("CADENCE", { sound: "DING", vibration: true });
    });
    expect(screen.getByTestId("session-guidance-announcements")).toBeTruthy();
    expect(screen.getByTestId("session-guidance-events")).toBeTruthy();
    expect(checked("session-guidance-announcement-sides")).toBe(false);
    expect(checked("session-guidance-announcement-names")).toBe(true);
    expect(soundValue("CADENCE")).toBe("Ding");
    expect(soundValue("EVERY_MINUTES")).toBe("Aucun");
    expect(screen.getByTestId("session-guidance-event-CADENCE-vibration").props.value).toBe(true);
  });

  it("scénario de Hermann : « Aucun » pour Mi-temps, vibration laissée active, Valider ; le Profil reste inchangé", async () => {
    const { onApply, repository } = await renderSheet(undefined);
    const profileBefore = await repository.get();
    fireEvent.press(screen.getByTestId("session-guidance-event-HALF_TIME-sound"));
    expect(screen.getByTestId("session-guidance-sound-choices")).toBeTruthy();
    expect(checked("session-guidance-sound-choice-DEFAULT")).toBe(true);
    // Recette du 11/11/2026 (Hermann, y3) : « Par défaut » coche aussi le son par défaut de l'événement (Bip long).
    expect(checked("session-guidance-sound-choice-BIP_LONG")).toBe(true);
    expect(screen.getByTestId("session-guidance-sound-choice-BIP_LONG-check")).toBeTruthy();
    expect(checked("session-guidance-sound-choice-DING")).toBe(false);
    expect(screen.queryByText("Touchez un son pour l’écouter.")).toBeNull();
    fireEvent.press(screen.getByTestId("session-guidance-sound-choice-NONE"));
    expect(checked("session-guidance-sound-choice-BIP_LONG")).toBe(false);
    fireEvent.press(screen.getByTestId("session-guidance-sound-apply"));
    expect(soundValue("HALF_TIME")).toBe("Aucun");
    expect(screen.getByTestId("session-guidance-event-HALF_TIME-vibration").props.value).toBe(true);
    fireEvent.press(screen.getByTestId("session-guidance-apply"));
    expect(onApply).toHaveBeenCalledTimes(1);
    const applied = onApply.mock.calls[0]![0];
    expect(applied.events.HALF_TIME).toEqual({ sound: "NONE", vibration: true });
    expect(applied.events.COUNTDOWN).toEqual(DEFAULT_GUIDANCE_EVENTS.COUNTDOWN);
    expect(await repository.get()).toEqual(profileBefore);
  });

  it("réouverture : valeurs validées pour la séance ; « Fermer » abandonne les changements", async () => {
    const own: GuidanceSettings = {
      announcements: { session: true, names: true, phases: true, objective: true, pauses: true, sides: true },
      events: { ...DEFAULT_GUIDANCE_EVENTS, HALF_TIME: { sound: "NONE", vibration: true } },
    };
    const { onApply, onClose } = await renderSheet(own);
    expect(soundValue("HALF_TIME")).toBe("Aucun");
    fireEvent.press(screen.getByTestId("session-guidance-announcement-pauses"));
    expect(checked("session-guidance-announcement-pauses")).toBe(false);
    fireEvent.press(screen.getByTestId("session-guidance-close"));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onApply).not.toHaveBeenCalled();
  });

  it("Choix d'un son : ✕ revient sans changer le son", async () => {
    await renderSheet(undefined);
    fireEvent.press(screen.getByTestId("session-guidance-event-COUNTDOWN-sound"));
    fireEvent.press(screen.getByTestId("session-guidance-sound-choice-BIP_LONG"));
    fireEvent.press(screen.getByTestId("session-guidance-sound-close"));
    expect(soundValue("COUNTDOWN")).toBe("Par défaut");
  });
});
