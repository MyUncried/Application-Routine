/**
 * PRE-10.3 — textes de l'écran d'Exécution (CE-EXEC-SESSION-01, ch08, ch12 §12.33). Libellés des
 * dialogues repris tels quels du contrat d'écran (titres, messages, actions).
 */
export const executionStrings = {
  start: "Démarrer",
  back: "Retour",
  close: "Fermer",
  soundOn: "Sons activés",
  soundOff: "Sons désactivés",
  voiceOn: "Annonces vocales activées",
  voiceOff: "Annonces vocales désactivées",
  series: "Série",
  tour: "Tour",
  side: (rank: 1 | 2) => `Côté ${rank}`,
  next: "À suivre",
  /** Liste des exercices de la Séance (essai du 10/11/2026). */
  outline: "Séance",
  outlineTour: (current: number, total: number) => `Tour ${current}/${total}`,
  /** « À suivre » d'un Point d'arrêt (recette PRE-10 du 09/11/2026, Hermann). */
  nextStopPoint: "Arrêt de la séance, redémarrage manuel",
  seriesShort: (current: number, total: number) => `Série ${current}/${total}`,
  elapsed: "Temps écoulé",
  load: (kg: number) => `${kg.toLocaleString("fr-FR")} kg`,
  target: "Sur",
  repetitions: (value: number) => `${value} rép.`,
  failure: "À l'échec",
  phases: {
    INITIAL_COUNTDOWN: "Compte à rebours",
    ACTIVITY: "",
    SERIES_PAUSE: "Pause",
    SIDE_RECOVERY: "Pause entre les côtés",
    POST_ACTIVITY_RECOVERY: "Récupération",
    STOP_POINT: "Point d'arrêt",
    SESSION_END: "Fin de séance",
    BLOCK_REST: "Repos",
    WINDOW_REST: "Repos",
    CLOSURE: "Résultat",
  },
  commands: {
    resetExercise: "Réinitialiser l’exercice",
    resetRecovery: "Réinitialiser la récupération",
    pause: "Pause",
    next: "Exercice suivant",
    continue: "Continuer",
  },
  resetDialog: {
    title: "Réinitialiser l’exercice ?",
    message: "L’exercice en cours recommencera depuis le début. La progression de la séance sera conservée.",
    cancel: "Annuler",
    confirm: "Confirmer",
  },
  nextDialog: {
    title: "Passer à l’exercice suivante ?",
    message: "La séance continuera avec l’exercice suivante, elle sera enregistrée comme partiellement exécutée.",
    cancel: "Annuler",
    confirm: "Confirmer",
  },
  pauseDialog: {
    title: "Séance en pause",
    message: (name: string | null) =>
      name === null ? "La séance est suspendue.\nLe chronomètre reprendra là où il s’est arrêté." : `L’exercice « ${name} » est suspendue.\nLe chronomètre reprendra là où il s’est arrêté.`,
    resume: "Reprendre la séance",
    stop: "Arrêter la séance",
  },
  safetyPause: "Séance mise en pause faute d’interaction.",
  restorePause: "La séance a été remise à l’étape en cours.",
  recoveryDialog: {
    title: "Séance interrompue",
    message: (name: string) => `La séance « ${name} » n’a pas été terminée.`,
    resume: "Reprendre la séance",
    stop: "Arrêter la séance",
  },
  saveError: "La progression n’a pas pu être enregistrée.",
  retry: "Réessayer",
  end: {
    COMPLETED: "Séance terminée",
    PARTIAL: "Séance partiellement exécutée",
    INTERRUPTED: "Séance interrompue",
    exercisePartial: "Partielle",
    exerciseCompleted: "Terminée",
  },
  notLaunchable: "Cette séance ne peut pas encore être exécutée.",
  notLaunchableFormats: "Les Formats AMRAP, EMOM, For time et Death by seront exécutables dans une prochaine version.",
  notLaunchableInvalid: "Cette séance comporte des paramètres à compléter.",
  blocked: "Une séance interrompue doit d’abord être reprise ou arrêtée.",
};

/** `m:ss`, ou `h:mm:ss` au-delà d'une heure ; secondes entières, arrondi supérieur pour un compte à rebours. */
export function formatClock(ms: number, roundUp = false): string {
  const total = Math.max(0, roundUp ? Math.ceil(ms / 1000 - 1e-9) : Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const ss = String(seconds).padStart(2, "0");
  return hours > 0 ? `${hours}:${String(minutes).padStart(2, "0")}:${ss}` : `${String(minutes).padStart(2, "0")}:${ss}`;
}
