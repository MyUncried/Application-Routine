import {
  profileDurationBounds,
  validateDisplayName,
  type Profile,
  type ProfileDurationSetting,
  type Silhouette,
} from "@/domain/preferences/Profile";
import type {
  ProfilePreference,
  ProfileRepository,
} from "@/domain/preferences/ProfileRepository";

export type SaveIdentityInput = {
  readonly displayName: string;
  readonly photoUri: string | null;
  readonly silhouette: Silhouette | null;
};

export type SaveIdentityResult =
  | { readonly ok: true; readonly value: Profile }
  | { readonly ok: false; readonly code: "REQUIRED" | "TOO_LONG" };

/**
 * Orchestration applicative du Profil (V2-PRE-2, plan §6.3) — ne dépend que
 * du Domaine (`@/domain/preferences/*`) et de l'interface `ProfileRepository`,
 * jamais de React, Expo ou d'une implémentation concrète (même patron que
 * `SessionService`).
 */
export class ProfileService {
  constructor(private readonly repository: ProfileRepository) {}

  async getProfile(): Promise<Profile> {
    return this.repository.get();
  }

  /**
   * Met à jour un seul réglage de durée, borné à ses limites canoniques
   * (T1/T2/D1/D-089) avant écriture — un appelant ne peut jamais persister
   * une valeur hors bornes, y compris une valeur hors grille `+`/`−` déjà
   * résolue par l'appelant (`nextGridValue`/`previousGridValue`).
   */
  async setDefault(setting: ProfileDurationSetting, value: number): Promise<Profile> {
    const bounds = profileDurationBounds(setting);
    const clamped = Math.min(bounds.max, Math.max(bounds.min, Math.round(value)));
    return this.repository.updateDefault(setting, clamped);
  }

  async setPreference(preference: ProfilePreference, value: boolean): Promise<Profile> {
    return this.repository.updatePreference(preference, value);
  }

  /**
   * Valide le nom d'affichage (T8) avant d'enregistrer nom, photo et
   * silhouette ensemble, atomiquement (CE-UI-01 L1981/L2025/L2033). Un échec
   * de validation ne tente aucune écriture.
   */
  async saveIdentity(input: SaveIdentityInput): Promise<SaveIdentityResult> {
    const validated = validateDisplayName(input.displayName);
    if (!validated.ok) {
      return { ok: false, code: validated.code };
    }
    const profile = await this.repository.updateIdentity({
      displayName: validated.value,
      photoUri: input.photoUri,
      silhouette: input.silhouette,
    });
    return { ok: true, value: profile };
  }
}
