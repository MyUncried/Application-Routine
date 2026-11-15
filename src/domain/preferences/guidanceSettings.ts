/**
 * Guidage sonore — réglages du Profil et d'une Séance (documentation publiée sur main `ebe72f76`, RM-087, CE-UI-07,
 * ch13 « Guidage sonore en Composition et dans le Profil » ; demande de Hermann du 11/11/2026, cahier, constat d).
 *
 * - Six annonces vocales indépendantes.
 * - Neuf événements, chacun avec un son (« Par défaut », « Aucun » ou un son choisi) et une vibration.
 * - « Aucun » coupe uniquement le son de l'événement ; sa vibration et les annonces gardent leur valeur.
 */

export const VOICE_ANNOUNCEMENTS = ["session", "names", "phases", "objective", "pauses", "sides"] as const;
export type VoiceAnnouncement = (typeof VOICE_ANNOUNCEMENTS)[number];
export type VoiceAnnouncements = Readonly<Record<VoiceAnnouncement, boolean>>;

/** Ordre du design : Compte à rebours … Fin de séance. */
export const GUIDANCE_EVENTS = [
  "COUNTDOWN",
  "EXERCISE_START",
  "PHASE_CHANGE",
  "SIDE_CHANGE",
  "CADENCE",
  "EVERY_MINUTES",
  "HALF_TIME",
  "STOP_POINT",
  "SESSION_END",
] as const;
export type GuidanceEvent = (typeof GUIDANCE_EVENTS)[number];

/** Sons courts de l'application (fichiers `assets/sounds`). */
export const LIBRARY_SOUNDS = [
  "BIP_COURT",
  "BIP_GRAVE",
  "BIP_DOUBLE",
  "BIP_LONG",
  "SIFFLET_ROULE",
  "SIFFLET_PUR",
  "SIFFLET_COURT",
  "FANFARE_COURTE",
  "DING",
  "CLIC_DOUX",
] as const;
export type LibrarySound = (typeof LIBRARY_SOUNDS)[number];

export type SoundChoice = "DEFAULT" | "NONE" | LibrarySound;

export type EventGuidance = { readonly sound: SoundChoice; readonly vibration: boolean };
export type GuidanceEvents = Readonly<Record<GuidanceEvent, EventGuidance>>;

export type GuidanceSettings = { readonly announcements: VoiceAnnouncements; readonly events: GuidanceEvents };

/** Valeurs illustrées dans le Profil (ch13 « Guidage sonore en Composition et dans le Profil »). */
export const DEFAULT_GUIDANCE_EVENTS: GuidanceEvents = Object.freeze({
  COUNTDOWN: { sound: "DEFAULT", vibration: true },
  EXERCISE_START: { sound: "DEFAULT", vibration: true },
  PHASE_CHANGE: { sound: "DEFAULT", vibration: true },
  SIDE_CHANGE: { sound: "DEFAULT", vibration: true },
  CADENCE: { sound: "DEFAULT", vibration: false },
  EVERY_MINUTES: { sound: "NONE", vibration: false },
  HALF_TIME: { sound: "DEFAULT", vibration: true },
  STOP_POINT: { sound: "DEFAULT", vibration: true },
  SESSION_END: { sound: "DEFAULT", vibration: true },
});

/**
 * Son « Par défaut » de chaque événement : celui joué jusqu'ici (table de guidage du 10/11/2026, ch08). Le départ d'un
 * exercice en Répétitions garde son sifflet pur. Mi-temps : aucun signal n'existe encore (À CLARIFIER) ; le son
 * proposé à l'écoute est le bip long.
 */
export const DEFAULT_EVENT_SOUNDS: Readonly<Record<GuidanceEvent, LibrarySound>> = Object.freeze({
  COUNTDOWN: "BIP_GRAVE",
  EXERCISE_START: "SIFFLET_ROULE",
  PHASE_CHANGE: "BIP_COURT",
  SIDE_CHANGE: "SIFFLET_COURT",
  CADENCE: "CLIC_DOUX",
  EVERY_MINUTES: "DING",
  HALF_TIME: "BIP_LONG",
  STOP_POINT: "BIP_DOUBLE",
  SESSION_END: "FANFARE_COURTE",
});

function isSoundChoice(value: unknown): value is SoundChoice {
  return value === "DEFAULT" || value === "NONE" || (LIBRARY_SOUNDS as readonly unknown[]).includes(value);
}

function eventsFrom(raw: unknown): GuidanceEvents {
  const source = typeof raw === "object" && raw !== null ? (raw as Record<string, unknown>) : {};
  const events = {} as Record<GuidanceEvent, EventGuidance>;
  for (const event of GUIDANCE_EVENTS) {
    const fallback = DEFAULT_GUIDANCE_EVENTS[event];
    const item = source[event];
    const value = typeof item === "object" && item !== null ? (item as Record<string, unknown>) : {};
    events[event] = {
      sound: isSoundChoice(value.sound) ? value.sound : fallback.sound,
      vibration: typeof value.vibration === "boolean" ? value.vibration : fallback.vibration,
    };
  }
  return events;
}

function parse(json: string | null | undefined): unknown {
  if (json == null || json === "") return null;
  try {
    return JSON.parse(json) as unknown;
  } catch {
    return null;
  }
}

/** Réglages des neuf événements enregistrés dans le Profil ; une valeur absente ou illisible reprend son défaut. */
export function parseGuidanceEvents(json: string | null | undefined): GuidanceEvents {
  return eventsFrom(parse(json));
}

export function serializeGuidanceEvents(events: GuidanceEvents): string {
  return JSON.stringify(Object.fromEntries(GUIDANCE_EVENTS.map((event) => [event, events[event]])));
}

/** Réglages propres à une Séance ; `undefined` quand rien n'est enregistré (la Séance suit le Profil). */
export function parseGuidanceSettings(json: string | null | undefined): GuidanceSettings | undefined {
  const raw = parse(json);
  if (typeof raw !== "object" || raw === null) return undefined;
  const value = raw as Record<string, unknown>;
  const announcementsRaw = typeof value.announcements === "object" && value.announcements !== null ? (value.announcements as Record<string, unknown>) : {};
  const announcements = Object.fromEntries(
    VOICE_ANNOUNCEMENTS.map((key) => [key, typeof announcementsRaw[key] === "boolean" ? announcementsRaw[key] : true]),
  ) as Record<VoiceAnnouncement, boolean>;
  return { announcements, events: eventsFrom(value.events) };
}

export function serializeGuidanceSettings(settings: GuidanceSettings): string {
  return JSON.stringify({
    announcements: Object.fromEntries(VOICE_ANNOUNCEMENTS.map((key) => [key, settings.announcements[key]])),
    events: Object.fromEntries(GUIDANCE_EVENTS.map((event) => [event, settings.events[event]])),
  });
}

export function guidanceSettingsEqual(a: GuidanceSettings | null | undefined, b: GuidanceSettings | null | undefined): boolean {
  if (a == null || b == null) return a == null && b == null;
  return serializeGuidanceSettings(a) === serializeGuidanceSettings(b);
}

/** Son réellement joué pour un événement : `null` pour « Aucun ». */
export function soundOf(event: GuidanceEvent, setting: EventGuidance): LibrarySound | null {
  if (setting.sound === "NONE") return null;
  return setting.sound === "DEFAULT" ? DEFAULT_EVENT_SOUNDS[event] : setting.sound;
}
