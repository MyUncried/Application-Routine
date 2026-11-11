import { guidanceSettingsEqual, parseGuidanceSettings, serializeGuidanceSettings, type GuidanceSettings } from "@/domain/preferences/guidanceSettings";

/**
 * Guidage sonore propre à une Séance — documentation publiée sur main `ebe72f76` (ch09 : « Les valeurs validées dans
 * la modale de Composition s’appliquent uniquement à la séance en cours » ; ch13 « Guidage sonore en Composition et
 * dans le Profil »). Absent : la Séance suit le Profil. Présent : les six annonces et les neuf événements validés.
 *
 * [Remplacé le 11/11/2026 — fin de PRE-10, trois booléens nullables (Sons, Voix, objectif), `migration028` : remplacés
 * par les réglages complets, `migration029`.]
 */
export type SessionGuidance = GuidanceSettings;

/** Vrai si la Séance suit le Profil (aucun réglage validé dans la modale). */
export function followsProfile(guidance: SessionGuidance | null | undefined): boolean {
  return guidance == null;
}

/** Forme normalisée : `undefined` quand la Séance suit le Profil, sinon une copie. */
export function normalizedGuidance(guidance: SessionGuidance | null | undefined): SessionGuidance | undefined {
  return guidance == null ? undefined : { announcements: { ...guidance.announcements }, events: { ...guidance.events } };
}

export function guidanceEqual(a: SessionGuidance | null | undefined, b: SessionGuidance | null | undefined): boolean {
  return guidanceSettingsEqual(a, b);
}

/** Réglages effectifs : ceux de la Séance, sinon ceux du Profil. */
export function effectiveGuidance(own: SessionGuidance | null | undefined, profile: GuidanceSettings): GuidanceSettings {
  return own ?? profile;
}

/** Colonne SQLite `sessions.guidance_settings` (JSON ou `NULL`). */
export function guidanceFromColumn(json: string | null | undefined): SessionGuidance | undefined {
  return parseGuidanceSettings(json);
}

export function guidanceColumn(guidance: SessionGuidance | null | undefined): string | null {
  return guidance == null ? null : serializeGuidanceSettings(guidance);
}
