/**
 * Fin de PRE-10 — guidage propre à une Séance (spec `spec-guidage-reglages` §3.2 et §3.3, validée par Hermann le
 * 10/11/2026 : « Élément Guidage (Recommandé) »). Chaque réglage est nullable : `null` = « comme le Profil ».
 *
 * - `soundsEnabled` : interrupteur Sons de l'Exécution au démarrage ;
 * - `voiceEnabled` : interrupteur Voix de l'Exécution au démarrage (toutes les annonces, décision de Hermann du
 *   10/11/2026 : « Oui, toute la voix ») ;
 * - `announceObjective` : catégorie « Annoncer les répétitions ou la durée ».
 *
 * Les autres catégories d'annonces et le guidage en arrière-plan restent des réglages du Profil seulement.
 */
export type SessionGuidance = {
  readonly soundsEnabled: boolean | null;
  readonly voiceEnabled: boolean | null;
  readonly announceObjective: boolean | null;
};

export const PROFILE_GUIDANCE: SessionGuidance = Object.freeze({ soundsEnabled: null, voiceEnabled: null, announceObjective: null });

/** Vrai si la Séance suit entièrement le Profil (aucun réglage propre). */
export function followsProfile(guidance: SessionGuidance | null | undefined): boolean {
  return guidance == null || (guidance.soundsEnabled === null && guidance.voiceEnabled === null && guidance.announceObjective === null);
}

/** Forme normalisée : `undefined` quand la Séance suit le Profil, sinon une copie. */
export function normalizedGuidance(guidance: SessionGuidance | null | undefined): SessionGuidance | undefined {
  if (guidance == null || followsProfile(guidance)) return undefined;
  return { soundsEnabled: guidance.soundsEnabled, voiceEnabled: guidance.voiceEnabled, announceObjective: guidance.announceObjective };
}

export function guidanceEqual(a: SessionGuidance | null | undefined, b: SessionGuidance | null | undefined): boolean {
  const x = a ?? PROFILE_GUIDANCE;
  const y = b ?? PROFILE_GUIDANCE;
  return x.soundsEnabled === y.soundsEnabled && x.voiceEnabled === y.voiceEnabled && x.announceObjective === y.announceObjective;
}

/** Valeur effective d'un réglage : celle de la Séance, sinon celle du Profil. */
export function effectiveSetting(own: boolean | null | undefined, profile: boolean): boolean {
  return own ?? profile;
}

/** Colonnes SQLite (0, 1 ou NULL) ↔ booléen nullable. */
export function guidanceFromColumns(sounds: number | null, voice: number | null, objective: number | null): SessionGuidance | undefined {
  const flag = (value: number | null) => (value === null ? null : value === 1);
  return normalizedGuidance({ soundsEnabled: flag(sounds), voiceEnabled: flag(voice), announceObjective: flag(objective) });
}

export function guidanceColumns(guidance: SessionGuidance | null | undefined): [number | null, number | null, number | null] {
  const g = guidance ?? PROFILE_GUIDANCE;
  const column = (value: boolean | null) => (value === null ? null : value ? 1 : 0);
  return [column(g.soundsEnabled), column(g.voiceEnabled), column(g.announceObjective)];
}
