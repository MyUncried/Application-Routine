/**
 * J1 « Gestion des langues » (23/11/2026) : traduction anglaise de `frExecution.ts` (textes de l'Exécution et annonces
 * vocales), selon le glossaire validé (`docs/preparation/langues/GLOSSAIRE-EN-2026-11-23.md`).
 */
import { appLocaleTag } from "../locale";
import type { execution as frExecution, voice as frVoice } from "./frExecution";
import type { Widen } from "./types";

/*
 * PRE-10.3 — textes de l'écran d'Exécution (CE-EXEC-SESSION-01, ch08, ch12 §12.33). Libellés des
 * dialogues repris tels quels du contrat d'écran (titres, messages, actions).
 */
/**
 * Suffixe d'un nombre ordinal abrégé, typographie anglaise (J1, 23/11/2026) : 1st, 2nd, 3rd, puis th ; 11th, 12th,
 * 13th. Remplace `ordinalSuffix` (typographie française) dans le catalogue anglais.
 */
export function ordinalSuffixEn(rank: number): string {
  const lastTwo = rank % 100;
  if (lastTwo >= 11 && lastTwo <= 13) return "th";
  switch (rank % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
}

export const execution: Widen<typeof frExecution> = {
  start: "Start",
  back: "Back",
  close: "Close",
  soundOn: "Sounds on",
  soundOff: "Sounds off",
  voiceOn: "Voice guidance on",
  voiceOff: "Voice guidance off",
  series: "Set",
  tour: "Round",
  /** Recette du 13/11/2026 (Hermann : « Il faut ajouter le cycle »). */
  cycle: "Cycle",
  /** Compteur automatique (recette du 13/11/2026) : « tour » jusqu’à 1, « tours » au-delà. */
  tours: (count: number) => (count === 1 ? "round" : "rounds"),
  /** Recette du 13/11/2026 (Hermann : « Remplacer tour par mouvements ») : « mouvement » jusqu’à 1, « mouvements » au-delà. */
  // Puis « Ok pour mouv. » : abréviation à la taille de « rép. » et « kg ». [« mouvement(s) » — remplacé.]
  movements: () => "mvts",
  /** Recette du 13/11/2026 (Hermann : « Changer le texte Côté 1 et Côté 2 par 1er côté et 2ème côté »). [« Côté n » — remplacé.] */
  // Puis (Hermann : « Le "er" de 1er doit être en exposant, pareil pour le "d" de second côté ou le "e" de troisième,
  // quatrième, etc ») : rang, suffixe en exposant, puis « côté ». [« 2ème côté » — remplacé par « 2d côté ».]
  // Deux côtés au plus : « 2d côté ».
  side: (rank: number) => ({ rank: String(rank), suffix: ordinalSuffixEn(rank), label: "side", spoken: `${rank}${ordinalSuffixEn(rank)} side` }),
  next: "Up next",
  /** Point d'arrêt (recette du 12/11/2026, Hermann, e1f). */
  pressStart: "Tap start",
  /** Sur deux lignes (recette du 13/11/2026, Hermann : « texte Appuyer sur démarrer sur deux lignes »). */
  pressStartLines: "Tap\nstart",
  /** « À suivre » d'un Point d'arrêt (recette PRE-10 du 09/11/2026, Hermann). */
  nextStopPoint: "Workout stops, restart manually",
  elapsed: "Elapsed time",
  load: (kg: number) => `${kg.toLocaleString(appLocaleTag)} kg`,
  target: "Of",
  repetitions: (value: number) => `${value} reps`,
  failure: "To failure",
  phases: {
    // Recette du 12/11/2026 (Hermann : « Remplacer le texte compte à rebours, par Préparez vous »). [« Compte à rebours » — remplacé.]
    INITIAL_COUNTDOWN: "Get ready",
    ACTIVITY: "",
    SERIES_PAUSE: "Rest",
    // Recette du 14/11/2026 (Hermann : « Pause au changement de côté : mettre le titre "Changez de côté" »). [« Pause entre les
    // côtés », puis « Pause » au titre — remplacé.]
    SIDE_RECOVERY: "Switch sides",
    POST_ACTIVITY_RECOVERY: "Recovery",
    STOP_POINT: "Hold",
    SESSION_END: "Workout end",
    BLOCK_REST: "Rest",
    WINDOW_REST: "Rest",
    CLOSURE: "Result",
  },
  commands: {
    resetExercise: "Reset exercise",
    resetRecovery: "Reset recovery",
    pause: "Pause",
    next: "Next exercise",
    continue: "Continue",
    // PRE-11, correction 3 (For time) : bouton de succès, valide l’étape sans saisie.
    validate: "Done, move on",
    /** Recette e1 du 12/11/2026 (e) : boutons de la Pause, sans fenêtre. */
    resume: "Resume workout",
    stop: "Stop workout",
  },
  resetDialog: {
    title: "Reset exercise?",
    message: "The current exercise will restart from the beginning. Workout progress will be kept.",
    cancel: "Cancel",
    confirm: "Confirm",
  },
  nextDialog: {
    title: "Skip to the next exercise?",
    message: "The workout will continue with the next exercise and will be saved as partially completed.",
    cancel: "Cancel",
    confirm: "Confirm",
  },
  recoveryDialog: {
    title: "Workout interrupted",
    message: (name: string) => `The workout “${name}” was not finished.`,
    resume: "Resume workout",
    stop: "Stop workout",
  },
  saveError: "Progress could not be saved.",
  retry: "Try again",
  // D-534 (19/11/2026) : écran de transition entre deux séances d'une routine, sur trois lignes.
  chain: {
    lines: (rank: number): readonly string[] => ["Tap to", `start the ${rank}${ordinalSuffixEn(rank)} workout`, "of the track"],
    routeTitle: "Track",
    routeItem: (rank: number) => `Workout ${rank}`,
  },
  end: {
    COMPLETED: "Workout complete",
    PARTIAL: "Workout partially completed",
    INTERRUPTED: "Workout interrupted",
    exercisePartial: "Partial",
    exerciseCompleted: "Complete",
    seriesNotTerminated: "Not finished",
    seriesLine: (series: number, status: string, done: string, objective?: string) => `Set ${series} · ${status} · ${objective === undefined ? done : `${done} / ${objective}`}`,
  },
  notLaunchable: "This workout can’t be run yet.",
  // PRE-11 (T4, 18/11/2026) : plus aucun Format spécialisé non lançable ; message conservé pour un Format futur.
  notLaunchableFormats: "This format will be available in a future version.",
  emomStopTitle: "EMOM stop",
  amrapStopTitle: "AMRAP stop",
  amrapClosureTitle: "End of block",
  amrapMaxEntryTitle: "Set reps",
  amrapMaxEntryLabel: (series: number) => `Set ${series}`,
  repetitionsUnit: "reps",
  emomClosureTitle: "End of EMOM",
  deathByStopTitle: "Death by stop",
  deathByClosureTitle: "End of Death by",
  emomWindowName: (name: string | null, window: number) => `${name ?? ""} · set ${window}`,
  notLaunchableInvalid: "This workout has settings to complete.",
  blocked: "An interrupted workout must be resumed or stopped first.",
  // PRE-11 (T1) — For time : borne dans le coin du haut à gauche (Hermann, 13/11/2026), Clôture « Vos résultats »
  // (modale « Résultat de série », Figma 8937:35362).
  capUnit: "max",
  forTime: "For time",
  closureTitle: "Your results",
  // PRE-11, corrections 3 et 4 : temps final (fin normale, sans saisie) ; modale « Répétitions partielles » de l’arrêt.
  forTimeFinal: "Final time",
  partialConfirm: "Finish exercise",
  partialClose: "Back to rest",
  partialNoSeries: "No set in progress.",
  // Registre ch07, « For time — exécution : exercices en durée, « + Tour », sans Pause » (16/11/2026) ; Formats §11.1 ; Figma
  // `8982:15849`, `12514:27223`, `12514:27329`, `11990:24925`.
  plusTour: "+ Round",
  // Recette du 17/11/2026 (ft-barre) ; Figma « Zone — Buy-in ✓ » (`12512:27117`).
  buyInBadge: "Buy-in ✓",
  buyOutBadge: "Buy-out ✓",
  plusTourSign: "+",
  plusTourWord: "Round",
  plusTourAcquired: (acquired: number) => `Round · ${acquired}`,
  partialHeldDuration: "Duration held",
  /** Troisième recette du 17/11/2026 (Hermann, ftr3-modale-duree) : titre et lignes des trois modales d'arrêt du For time. */
  forTimeStopTitle: "For Time stop",
  stopObjective: "Target",
  stopResult: "Result",
  /** Objectif d'une série en répétitions : « 12 répétitions ». */
  stopRepetitions: (count: number) => `${count} ${count === 1 ? "rep" : "reps"}`,
  /** Titre de la modale de l'Arrêt pendant une série en répétitions (seconde recette du 17/11/2026, Hermann). */
  partialEnterResult: "Enter your result",
  partialBackToExercise: "Back to exercise",
  // Recette du 17/11/2026 (Hermann : « Corrige l'alignement du texte "Appuyer pour lancer" sur la première ligne ») : « Appuyez pour lancer »
  // sur la première ligne, le nom de l'exercice sur la seconde. [« Appuyez » / « pour lancer <nom> » — remplacé.]
  pressToLaunch: (name: string | null) => ["Tap to start", name === null || name === "" ? "the exercise" : name] as const,
  pressToHold: ["Tap to", "pause"] as const,
  pressToRelease: ["Tap", "to resume"] as const,
  pressEachRound: ["Tap", "after each round"] as const,
  closureCapReached: "Cap reached",
  closurePartial: (name: string | null) => (name === null || name === "" ? "Reps done" : `Reps done — ${name}`),
  validate: "Done",
};

/**
 * Annonces vocales de l'Exécution (`ExecutionSignalAdapter`), déplacées à l'identique (T1, 23/11/2026). Les
 * séparateurs « , » et « . » qui assemblent les annonces restent dans l'adaptateur (grammaire, lot T2).
 */
export const voice: Widen<typeof frVoice> = {
  // Recette du 10/11/2026 (a1) : après la fanfare, catégorie début et fin de séance.
  sessionFinished: "Great job, workout complete",
  getReady: "Get ready",
  pause: "Rest",
  recovery: "Recovery",
  // Recette du 13/11/2026 (Hermann) : « premier côté » au départ, « Second côté » au changement de côté.
  secondSide: "Second side",
  firstSide: "first side",
  /** `{ordinal}` : rang en toutes lettres (`ordinals`). */
  seriesOrdinal: "{ordinal} set",
  /** Recette du 11/11/2026 (constat b) : « Premier exercice » pendant le Compte à rebours initial d'une Séance de plusieurs Exercices. */
  firstExercise: "First exercise: {name}",
  next: "Up next: {name}",
  /** Annonce des Séries (recette du 13/11/2026). Au-delà de dix : `ordinalFallback`. */
  ordinals: ["first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth"] as const,
  ordinalFallback: "{rank}th",
  roundOrdinal: "{ordinal} round",
  roundOrdinals: ["first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth", "ninth", "tenth"] as const,
  failure: "to failure",
  repetitionsOne: "1 rep",
  repetitionsMany: "{n} reps",
  secondsOne: "1 second",
  secondsMany: "{n} seconds",
  minutesOne: "1 minute",
  minutesMany: "{n} minutes",
};
