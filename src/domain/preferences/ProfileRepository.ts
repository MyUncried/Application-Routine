import type { ProfileDurationSetting, Profile, Silhouette } from "./Profile";

/** Préférences locales à bascule indépendante (CE-UI-07 L2515/L2519/L2573). */
export type ProfilePreference =
  | "soundsEnabled"
  | "voiceAnnouncementsEnabled"
  | "vibrationEnabled"
  | "notificationsEnabled";

/** Identité modifiable depuis Modifier le profil (CE-UI-01) — toujours les trois ensemble, atomiquement. */
export type ProfileIdentityInput = {
  readonly displayName: string;
  readonly photoUri: string | null;
  readonly silhouette: Silhouette | null;
};

/** Le Profil reste un agrégat SINGLETON : une seule ligne existe toujours après initialisation — jamais `null`. */
export interface ProfileRepository {
  get(): Promise<Profile>;
  /** Met à jour un seul des six réglages de durée, atomiquement — les cinq autres restent inchangés. */
  updateDefault(setting: ProfileDurationSetting, value: number): Promise<Profile>;
  /** Bascule une seule préférence, atomiquement — les trois autres restent inchangées. */
  updatePreference(preference: ProfilePreference, value: boolean): Promise<Profile>;
  /** Enregistre nom, photo et silhouette ensemble, atomiquement (CE-UI-01 L1981/L2025/L2033). */
  updateIdentity(input: ProfileIdentityInput): Promise<Profile>;
}
