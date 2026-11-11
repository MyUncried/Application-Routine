import { describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen } from "@testing-library/react-native";

import type { SessionGuidance } from "@/domain/sessions/sessionGuidance";
import { ProfileService } from "@/features/preferences/ProfileService";
import { ProfileServiceContext } from "@/features/preferences/ProfileServiceContext";
import { SessionGuidanceSheet } from "@/features/sessions/SessionGuidanceSheet";
import { migrateDatabase } from "@/infrastructure/database/migrateDatabase";
import { SqliteProfileRepository } from "@/infrastructure/database/repositories/SqliteProfileRepository";
import { NodeSqliteDatabase } from "@/infrastructure/database/testing/NodeSqliteDatabase";
import { strings } from "@/shared/i18n";

/**
 * Fin de PRE-10 — feuille « Guidage de la séance » (spec `spec-guidage-reglages` §3.2) : valeur effective (Séance, sinon
 * Profil) et origine de chaque réglage ; ✓ applique la forme normalisée, « Revenir au Profil » efface tout.
 */
const t = strings.screens.composition.guidance;

async function renderSheet(initial: SessionGuidance | undefined, profilePatch: Record<string, boolean> = {}) {
  const database = NodeSqliteDatabase.openInMemory();
  await migrateDatabase(database);
  const repository = new SqliteProfileRepository(database);
  for (const [key, value] of Object.entries(profilePatch)) await repository.updatePreference(key as never, value as never);
  const onApply = jest.fn<(guidance: SessionGuidance | undefined) => void>();
  const onClose = jest.fn();
  render(
    <ProfileServiceContext.Provider value={new ProfileService(repository)}>
      <SessionGuidanceSheet initial={initial} onApply={onApply} onClose={onClose} />
    </ProfileServiceContext.Provider>,
  );
  await act(async () => undefined);
  return { onApply, onClose };
}

const checked = (setting: string) => screen.getByTestId(`session-guidance-${setting}`).props.accessibilityState.checked as boolean;
const origin = (setting: string) => screen.getByTestId(`session-guidance-${setting}-origin`, { includeHiddenElements: true }).props.children as string;

describe("fin de PRE-10 — feuille Guidage de la séance", () => {
  it("Séance comme le Profil : valeurs du Profil, origine « Comme le Profil », « Revenir au Profil » inactif", async () => {
    const { onApply } = await renderSheet(undefined, { soundsEnabled: false });
    expect(checked("soundsEnabled")).toBe(false);
    expect(checked("voiceEnabled")).toBe(true);
    expect(checked("announceObjective")).toBe(true);
    expect(origin("soundsEnabled")).toBe(t.rowFollowsProfile);
    expect(screen.getByTestId("session-guidance-reset").props.accessibilityState).toEqual({ disabled: true });
    fireEvent.press(screen.getByTestId("session-guidance-validate"));
    expect(onApply).toHaveBeenCalledWith(undefined);
  });

  it("toucher un réglage le rend propre à la Séance ; ✓ applique seulement ce réglage", async () => {
    const { onApply } = await renderSheet(undefined);
    fireEvent.press(screen.getByTestId("session-guidance-announceObjective"));
    expect(checked("announceObjective")).toBe(false);
    expect(origin("announceObjective")).toBe(t.rowOwn);
    expect(origin("soundsEnabled")).toBe(t.rowFollowsProfile);
    fireEvent.press(screen.getByTestId("session-guidance-validate"));
    expect(onApply).toHaveBeenCalledWith({ soundsEnabled: null, voiceEnabled: null, announceObjective: false });
  });

  it("« Revenir au Profil » efface les réglages propres ; ✕ ferme sans rien appliquer", async () => {
    const { onApply, onClose } = await renderSheet({ soundsEnabled: false, voiceEnabled: false, announceObjective: null });
    expect(checked("soundsEnabled")).toBe(false);
    expect(origin("voiceEnabled")).toBe(t.rowOwn);
    fireEvent.press(screen.getByTestId("session-guidance-reset"));
    expect(checked("soundsEnabled")).toBe(true);
    expect(origin("voiceEnabled")).toBe(t.rowFollowsProfile);
    fireEvent.press(screen.getByTestId("session-guidance-cancel"));
    expect(onClose).toHaveBeenCalled();
    expect(onApply).not.toHaveBeenCalled();
  });
});
