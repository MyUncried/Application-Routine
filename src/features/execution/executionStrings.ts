/**
 * PRE-10.3 — textes de l'écran d'Exécution (CE-EXEC-SESSION-01, ch08, ch12 §12.33). Libellés des
 * dialogues repris tels quels du contrat d'écran (titres, messages, actions).
 */
/**
 * Suffixe d'un nombre ordinal abrégé (typographie française), recette du 13/11/2026 : 1er ; 2d (second) quand il n'y en a
 * que deux, 2e (deuxième) quand il y a un troisième (Hermann : « Le "e" de deuxième (quand il y a un troisième) ») ; 3e, 4e…
 */
export function ordinalSuffix(rank: number, total: number): string {
  if (rank === 1) return "er";
  return rank === 2 && total === 2 ? "d" : "e";
}

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
  // Puis (Hermann : « Le "er" de 1er doit être en exposant, pareil pour le "d" de second côté ou le "e" de troisième,
  // quatrième, etc ») : rang, suffixe en exposant, puis « côté ». [« 2ème côté » — remplacé par « 2d côté ».]
  // Deux côtés au plus : « 2d côté ».
  side: (rank: number) => ({ rank: String(rank), suffix: ordinalSuffix(rank, 2), label: "côté", spoken: `${rank}${ordinalSuffix(rank, 2)} côté` }),
  next: "À suivre",
  /** Point d'arrêt (recette du 12/11/2026, Hermann, e1f). */
  pressStart: "Appuyer sur démarrer",
  /** Sur deux lignes (recette du 13/11/2026, Hermann : « texte Appuyer sur démarrer sur deux lignes »). */
  pressStartLines: "Appuyer sur\ndémarrer",
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
    // Recette du 14/11/2026 (Hermann : « Pause au changement de côté : mettre le titre "Changez de côté" »). [« Pause entre les
    // côtés », puis « Pause » au titre — remplacé.]
    SIDE_RECOVERY: "Changez de côté",
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
    // PRE-11, correction 3 (For time) : bouton de succès, valide l’étape sans saisie.
    validate: "Valider et passer à la suite",
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
    // Recette EMOM du 18/11/2026 (Hermann : « Synthèse : mettre chaque série sur une ligne avec statut, nombre de séries / objectif ») :
    // une ligne par Série d'un Exercice exécuté en EMOM — « Série 2 · Non terminée · 4 / 10 rép. ».
    seriesNotTerminated: "Non terminée",
    seriesLine: (series: number, status: string, done: string, objective?: string) => `Série ${series} · ${status} · ${objective === undefined ? done : `${done} / ${objective}`}`,
  },
  notLaunchable: "Cette séance ne peut pas encore être exécutée.",
  // PRE-11 (T1, 13/11/2026) : For time exécutable. [« Les Formats AMRAP, EMOM, For time et Death by… » — remplacé.]
  // PRE-11 (T2, 18/11/2026) : EMOM exécutable. [« Les Formats AMRAP, EMOM et Death by… » — remplacé.]
  // PRE-11 (T3, 18/11/2026) : AMRAP exécutable. PRE-11 (T4, 18/11/2026) : Death by exécutable — plus aucun Format spécialisé non
  // lançable ; message conservé pour un Format futur. [« Les Formats AMRAP et Death by… » — remplacé.]
  notLaunchableFormats: "Ce Format sera exécutable dans une prochaine version.",
  // PRE-11 (T2, 18/11/2026) — EMOM : feuille de l'Arrêt (arbitrage « Comme le For time »), Clôture des fenêtres non saisies (§12.2),
  // bandeau Q1.
  emomStopTitle: "Arrêt de l’EMOM",
  /** PRE-11 (T3), arbitrage de Hermann du 18/11/2026 : feuilles de l'AMRAP, modèle du For time. */
  amrapStopTitle: "Arrêt de l’AMRAP",
  amrapClosureTitle: "Fin du bloc",
  emomClosureTitle: "Fin de l’EMOM",
  /** PRE-11 (T4), arbitrage de Hermann du 18/11/2026 : feuilles du Death by, modèle du For time. */
  deathByStopTitle: "Arrêt du Death by",
  deathByClosureTitle: "Fin du Death by",
  // Recette EMOM du 18/11/2026 (Hermann : « Modale de résultat partiel : remplacer Fenêtre par Série »). [« · fenêtre N » — remplacé.]
  emomWindowName: (name: string | null, window: number) => `${name ?? ""} · série ${window}`,
  // Recette EMOM du 18/11/2026 (emom-3 : « Supprimer ce bandeau ») : libellés du bandeau retirés.
  notLaunchableInvalid: "Cette séance comporte des paramètres à compléter.",
  blocked: "Une séance interrompue doit d’abord être reprise ou arrêtée.",
  // PRE-11 (T1) — For time : borne dans le coin du haut à gauche (Hermann, 13/11/2026), Clôture « Vos résultats »
  // (modale « Résultat de série », Figma 8937:35362).
  capUnit: "max",
  forTime: "For time",
  closureTitle: "Vos résultats",
  // PRE-11, corrections 3 et 4 : temps final (fin normale, sans saisie) ; modale « Répétitions partielles » de l’arrêt.
  forTimeFinal: "Temps final",
  partialConfirm: "Terminer l’exercice",
  partialClose: "Revenir à la pause",
  partialNoSeries: "Aucune série en cours.",
  // Registre ch07, « For time — exécution : exercices en durée, « + Tour », sans Pause » (16/11/2026) ; Formats §11.1 ; Figma
  // `8982:15849`, `12514:27223`, `12514:27329`, `11990:24925`.
  plusTour: "+ Tour",
  // Recette du 17/11/2026 (ft-barre) ; Figma « Zone — Buy-in ✓ » (`12512:27117`).
  buyInBadge: "Buy-in ✓",
  buyOutBadge: "Buy-out ✓",
  plusTourSign: "+",
  plusTourWord: "Tour",
  /** D-529 / CE-UI-14 (18/11/2026) : « Tour · 3 », nombre de tours déjà acquis, sous le « + » du bouton. */
  plusTourAcquired: (acquired: number) => `Tour · ${acquired}`,
  partialHeldDuration: "Durée tenue",
  /** Troisième recette du 17/11/2026 (Hermann, ftr3-modale-duree) : titre et lignes des trois modales d'arrêt du For time. */
  forTimeStopTitle: "Arrêt du For Time",
  stopObjective: "Objectif",
  stopResult: "Résultat",
  /** Objectif d'une série en répétitions : « 12 répétitions ». */
  stopRepetitions: (count: number) => `${count} ${count > 1 ? "répétitions" : "répétition"}`,
  /** Titre de la modale de l'Arrêt pendant une série en répétitions (seconde recette du 17/11/2026, Hermann). */
  partialEnterResult: "Entrer votre résultat",
  partialBackToExercise: "Revenir à l’exercice",
  // Recette du 17/11/2026 (Hermann : « Corrige l'alignement du texte "Appuyer pour lancer" sur la première ligne ») : « Appuyez pour lancer »
  // sur la première ligne, le nom de l'exercice sur la seconde. [« Appuyez » / « pour lancer <nom> » — remplacé.]
  pressToLaunch: (name: string | null) => ["Appuyez pour lancer", name === null || name === "" ? "l’exercice" : name] as const,
  // Décisions de Hermann du 18/11/2026 (EMOM en durée) : « ma formulation partout » ; « "Appuyer pour" sur la première ligne, "faire une
  // pause" sur la seconde ligne », dans tous les Formats. [« Appuyez » / « pour faire pause » — remplacé.] Reprise inchangée (« non, pour
  // la reprise "Appuyez" et "pour repartir". Si je n'ai rien mentionné c'est que je ne voulais pas changer »).
  pressToHold: ["Appuyer pour", "faire une pause"] as const,
  pressToRelease: ["Appuyez", "pour repartir"] as const,
  pressEachRound: ["Appuyez", "à chaque tour terminé"] as const,
  closureCapReached: "Limite atteinte",
  closurePartial: (name: string | null) => (name === null || name === "" ? "Répétitions faites" : `Répétitions faites — ${name}`),
  validate: "Valider",
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
