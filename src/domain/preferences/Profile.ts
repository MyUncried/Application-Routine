/**
 * Profil utilisateur — agrégat persistant SINGLETON (V2-PRE-1, plan §3.2 ;
 * V2-PRE-2, plan §6.1) : pause de changement de côté, récupération
 * post-exercice, compte à rebours/fin d'Exercice, compte à rebours
 * initial/fin de Séance, quatre préférences locales (Sons, Annonces
 * vocales, Vibration, Notifications) et identité (nom d'affichage, photo,
 * silhouette).
 *
 * Les quatre défauts historiques (D-240) restent des constantes normatives
 * inchangées — la migration de la tranche précédente (`migration007`) les
 * lit pour semer le Profil (PRESERVE, boundary contract).
 */

export const DEFAULT_SIDE_CHANGE_RECOVERY_SECONDS = 10 as const;
export const DEFAULT_POST_ACTIVITY_RECOVERY_SECONDS = 30 as const;
/** Décision D-240 : compte à rebours d'Exercice par défaut. */
export const DEFAULT_EXERCISE_COUNTDOWN_SECONDS = 10 as const;
/** Décision D-240 : fin d'Exercice par défaut. */
export const DEFAULT_EXERCISE_END_SECONDS = 5 as const;

/** V2-PRE-2 (plan §6.1/§7, D-004) : deux nouveaux défauts de Séance. */
export const DEFAULT_SESSION_INITIAL_COUNTDOWN_SECONDS = 10 as const;
export const DEFAULT_SESSION_FINAL_PHASE_SECONDS = 5 as const;

/** V2-PRE-2 (plan §6.1, CE-UI-07 L2515/L2519/L2573) : quatre préférences locales. */
export const DEFAULT_SOUNDS_ENABLED = true as const;
export const DEFAULT_VOICE_ANNOUNCEMENTS_ENABLED = true as const;
export const DEFAULT_VIBRATION_ENABLED = true as const;
export const DEFAULT_NOTIFICATIONS_ENABLED = false as const;

export type Silhouette = "homme" | "femme";

export type Profile = {
  readonly id: string;
  /** Pause de changement de côté par défaut — `10` s, appliquée à l'activation bilatérale d'un Exercice du Catalogue (T21). */
  readonly sideChangeRecoverySecondsDefault: number;
  /** Récupération post-exercice par défaut — `30` s, copiée dans une occurrence à sa création. */
  readonly postActivityRecoverySecondsDefault: number;
  /** Compte à rebours d'Exercice par défaut (D-240) — `10` s. */
  readonly exerciseCountdownSecondsDefault: number;
  /** Fin d'Exercice par défaut (D-240) — `5` s. */
  readonly exerciseEndSecondsDefault: number;
  /** V2-PRE-2 : Compte à rebours initial par défaut d'une nouvelle Séance — `10` s. */
  readonly sessionInitialCountdownSecondsDefault: number;
  /** V2-PRE-2 : Fin de séance par défaut d'une nouvelle Séance — `5` s. */
  readonly sessionFinalPhaseSecondsDefault: number;
  readonly soundsEnabled: boolean;
  readonly voiceAnnouncementsEnabled: boolean;
  /** Vibrations fonctionnelles de séance uniquement — sans effet sur le retour haptique des roulettes numériques (C08 L1078-1101). */
  readonly vibrationEnabled: boolean;
  /** Désactivée par défaut ; aucune demande de permission système n'est faite depuis le Profil (T7). */
  readonly notificationsEnabled: boolean;
  /** Nullable tant que jamais renseigné (T8) ; 1..80 points de code à l'enregistrement. */
  readonly displayName: string | null;
  /** URI locale persistante de la copie de la photo ; `null` si aucune. */
  readonly photoUri: string | null;
  /** `null` tant que jamais choisie — `resolveSilhouette` affiche alors `"homme"` (T13). */
  readonly silhouette: Silhouette | null;
  readonly updatedAt: string;
};

/** Profil par défaut (première initialisation) — jamais rétroactif sur un Profil déjà persisté. */
export function createDefaultProfile(id: string, updatedAt: string): Profile {
  return {
    id,
    sideChangeRecoverySecondsDefault: DEFAULT_SIDE_CHANGE_RECOVERY_SECONDS,
    postActivityRecoverySecondsDefault: DEFAULT_POST_ACTIVITY_RECOVERY_SECONDS,
    exerciseCountdownSecondsDefault: DEFAULT_EXERCISE_COUNTDOWN_SECONDS,
    exerciseEndSecondsDefault: DEFAULT_EXERCISE_END_SECONDS,
    sessionInitialCountdownSecondsDefault: DEFAULT_SESSION_INITIAL_COUNTDOWN_SECONDS,
    sessionFinalPhaseSecondsDefault: DEFAULT_SESSION_FINAL_PHASE_SECONDS,
    soundsEnabled: DEFAULT_SOUNDS_ENABLED,
    voiceAnnouncementsEnabled: DEFAULT_VOICE_ANNOUNCEMENTS_ENABLED,
    vibrationEnabled: DEFAULT_VIBRATION_ENABLED,
    notificationsEnabled: DEFAULT_NOTIFICATIONS_ENABLED,
    displayName: null,
    photoUri: null,
    silhouette: null,
    updatedAt,
  };
}

/** Les six réglages réglables par stepper, avec leurs bornes (T1/T2/D1/D-089/D-252/D-256). */
export type ProfileDurationSetting =
  | "sideChangeRecoverySecondsDefault"
  | "postActivityRecoverySecondsDefault"
  | "exerciseCountdownSecondsDefault"
  | "exerciseEndSecondsDefault"
  | "sessionInitialCountdownSecondsDefault"
  | "sessionFinalPhaseSecondsDefault";

export type ProfileDurationBounds = { readonly min: number; readonly max: number };

/**
 * Bornes de chaque réglage (T1, T2, D1, D-089, D-265) :
 * - Compte à rebours initial / Fin de séance (défauts du Profil) : `0..60` s (D-265 — ne borne jamais une valeur
 *   déjà enregistrée au-delà de 60, affichée et conservée exacte ; les champs de la Séance en Composition restent `0..3599`, D-089) ;
 * - Compte à rebours d'exercice / Fin d'exercice : `0..60` s (D1) ;
 * - Pause entre les côtés / Récupération après exercice : `0..300` s sur la grille (T2).
 */
export function profileDurationBounds(setting: ProfileDurationSetting): ProfileDurationBounds {
  switch (setting) {
    case "sessionInitialCountdownSecondsDefault":
    case "sessionFinalPhaseSecondsDefault":
    case "exerciseCountdownSecondsDefault":
    case "exerciseEndSecondsDefault":
      return { min: 0, max: 60 };
    case "sideChangeRecoverySecondsDefault":
    case "postActivityRecoverySecondsDefault":
      return { min: 0, max: 300 };
  }
}

/** Le pas de chaque réglage : `1` s pour les phases d'Exercice/Séance (T1) ; la grille pour les pauses (T2). */
export function isGridBasedSetting(setting: ProfileDurationSetting): boolean {
  return setting === "sideChangeRecoverySecondsDefault" || setting === "postActivityRecoverySecondsDefault";
}

/**
 * Grille canonique des pauses (Pause entre les côtés, Récupération après
 * exercice) — v12 L93-100 : pas de `1` s jusqu'à `5` s, puis `5` s jusqu'à
 * `120` s, puis `30` s jusqu'à `300` s.
 */
export const PAUSE_GRID_VALUES: readonly number[] = (() => {
  const values: number[] = [];
  for (let value = 0; value <= 5; value += 1) {
    values.push(value);
  }
  for (let value = 10; value <= 120; value += 5) {
    values.push(value);
  }
  for (let value = 150; value <= 300; value += 30) {
    values.push(value);
  }
  return values;
})();

/**
 * Valeur de grille strictement SUPÉRIEURE à `current` (T3) — jamais un
 * arrondi de `current` elle-même, qui peut se trouver hors grille. Plafonnée
 * à la plus grande valeur de la grille.
 */
export function nextGridValue(current: number): number {
  const next = PAUSE_GRID_VALUES.find((value) => value > current);
  return next ?? PAUSE_GRID_VALUES[PAUSE_GRID_VALUES.length - 1]!;
}

/**
 * Valeur de grille strictement INFÉRIEURE à `current` (T3) — plancher à la
 * plus petite valeur de la grille (`0`).
 */
export function previousGridValue(current: number): number {
  for (let index = PAUSE_GRID_VALUES.length - 1; index >= 0; index -= 1) {
    const value = PAUSE_GRID_VALUES[index]!;
    if (value < current) {
      return value;
    }
  }
  return PAUSE_GRID_VALUES[0]!;
}

export type DisplayNameValidationResult =
  | { readonly ok: true; readonly value: string }
  | { readonly ok: false; readonly code: "REQUIRED" | "TOO_LONG" };

/**
 * Nom d'affichage à l'enregistrement de Modifier le profil (T8, C09 L147,
 * CE-UI-01 L2021/L2033, C08 L1078) : `1..80` points de code Unicode après
 * normalisation des espaces — un nom vide est refusé (`REQUIRED`). Le champ
 * `Profile.displayName` ne reste `null` qu'avant toute première
 * utilisation de Modifier le profil (`createDefaultProfile`) : cette
 * fonction ne produit jamais `null` elle-même.
 */
export function validateDisplayName(raw: string): DisplayNameValidationResult {
  const normalized = raw.trim().replace(/\s+/g, " ");
  if (normalized.length === 0) {
    return { ok: false, code: "REQUIRED" };
  }
  const length = Array.from(normalized).length;
  if (length > 80) {
    return { ok: false, code: "TOO_LONG" };
  }
  return { ok: true, value: normalized };
}

/** Une silhouette absente est affichée homme (T13, CE-UI-01 L1985/L2029). */
export function resolveSilhouette(silhouette: Silhouette | null): Silhouette {
  return silhouette ?? "homme";
}
