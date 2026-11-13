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
  /** Recette du 13/11/2026 (Hermann : « Il faut ajouter le cycle »). */
  cycle: "Cycle",
  /** Compteur automatique (recette du 13/11/2026) : « tour » jusqu’à 1, « tours » au-delà. */
  tours: (count: number) => (count > 1 ? "tours" : "tour"),
  /** Recette du 13/11/2026 (Hermann : « Remplacer tour par mouvements ») : « mouvement » jusqu’à 1, « mouvements » au-delà. */
  // Puis « Ok pour mouv. » : abréviation à la taille de « rép. » et « kg ». [« mouvement(s) » — remplacé.]
  movements: () => "mouv.",
  /** Recette du 13/11/2026 (Hermann : « Changer le texte Côté 1 et Côté 2 par 1er côté et 2ème côté »). [« Côté n » — remplacé.] */
  side: (rank: 1 | 2) => (rank === 1 ? "1er côté" : "2ème côté"),
  next: "À suivre",
  /** Point d'arrêt (recette du 12/11/2026, Hermann, e1f). */
  pressStart: "Appuyer sur démarrer",
  /** « À suivre » d'un Point d'arrêt (recette PRE-10 du 09/11/2026, Hermann). */
  nextStopPoint: "Arrêt de la séance, redémarrage manuel",
  elapsed: "Temps écoulé",
  load: (kg: number) => `${kg.toLocaleString("fr-FR")} kg`,
  target: "Sur",
  repetitions: (value: number) => `${value} rép.`,
  failure: "À l'échec",
  phases: {
    // Recette du 12/11/2026 (Hermann : « Remplacer le texte compte à rebours, par Préparez vous »). [« Compte à rebours » — remplacé.]
    INITIAL_COUNTDOWN: "Préparez-vous",
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
    /** Recette e1 du 12/11/2026 (e) : boutons de la Pause, sans fenêtre. */
    resume: "Reprendre la séance",
    stop: "Arrêter la séance",
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
