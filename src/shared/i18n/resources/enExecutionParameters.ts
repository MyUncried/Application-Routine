/**
 * J1 « Gestion des langues » (23/11/2026) : traduction anglaise de `executionParameters` (`frExecutionParameters.ts`,
 * selon le glossaire validé, `docs/preparation/langues/GLOSSAIRE-EN-2026-11-23.md`).
 */
/**
 * PRE-3 (#340) — libellés des surfaces Paramètres d'exécution, médias et
 * cartes. Regroupés ici, à côté du catalogue `fr` (fichier de ressources
 * hors du périmètre d'écriture PRE-3) ; textes repris des écrans Figma de
 * référence (`docs/preparation/PRE-3/figma/ecrans`). Aucun nouveau moteur de
 * traduction : français MVP uniquement.
 */
import type { executionParameters as frExecutionParameters } from "./frExecutionParameters";
import type { Widen } from "./types";

export const executionParameters: Widen<typeof frExecutionParameters> = {
  card: {
    title: "Execution settings",
    // PRE-4 story 4.2 (Q23, AC14) : `chooseMode` (« Choisir un mode ») est retiré
    // avec le bouton de Mode à droite du titre de la Carte.
    // E-21 (décision de Hermann du 2026-10-18) : l'invite H22 de la Carte vide est retirée.
    // PRE-5 story 3.1 : `descriptionPlaceholder` retiré avec le champ libre de la Description
    // (invites des étapes : `screens.exercise.instruction`).
    // Recette 3 (N-05) : action ↑ du champ Description.
    descriptionSubmitAccessibilityLabel: "Confirm description",
    openAccessibilityLabel: "Edit execution settings",
    // Recette iPhone du 30/10/2026 (Hermann : « Il faut enlever le point après "compléter" »).
    incomplete: "Settings to complete",
    // Complément du 5 novembre 2026 (§10) : fiche de l’Exercice ouverte par sa photo dans la Composition (Figma `11580:21528`).
    inThisSession: "In this workout",
    exerciseSheetTitle: "Exercise card",
    recoveryBeforeNext: "{duration} recovery before the next exercise.",
    noRecoveryBeforeNext: "No recovery before the next exercise.",
    // PRE-9, recette iPhone n° 2 du 31/10/2026 (constat e, Hermann : « avec le texte « Paramètre à
    // vérifier » à la place de « Paramètre à compléter » ») : texte exact de Hermann (singulier) ;
    // « Paramètres à compléter » prime.
    toVerify: "Setting to check",
    // PRE-5 story 3.2 (R-14, FR-36) : `countdown` et `end` retirés avec les lignes
    // Compte à rebours / Fin de la Carte (la Feuille garde les siennes : `sheet`).
  },
  sheet: {
    title: "Execution settings",
    cancelAccessibilityLabel: "Cancel settings",
    validateAccessibilityLabel: "Confirm settings",
    // PRE-5 story 2.4 (PR-01, FR-44) : ligne « Mode » du cadre Exécution, segmenté en ligne.
    mode: "Mode",
    // PRE-4 (story 1.1, AC22, FR-05-01) : deux Modes seulement ; « à l’échec »
    // désigne une Cible, jamais un Mode (FR-05-04) : voir `failureTarget`.
    modes: { DURATION: "Duration", REPETITIONS: "Reps" },
    unset: "—",
    // PRE-4 story 3.8 (AC2, AC4, FR-22-08, H23) : annonce VoiceOver d’une valeur affichée
    // « — » (Mode, Changement de côté, Cible non renseignés) : jamais lue « tiret ».
    unsetSpoken: "no value",
    series: "Sets",
    seriesSingular: "set",
    seriesPlural: "sets",
    // PRE-5 story 2.4 (PR-01, FR-26, FR-27, FR-44) : ligne « Type de série » (Variables à
    // gauche avec son chevron, Identiques à droite) et ligne « Condition d’arrêt » (À l’échec
    // à gauche, À l’objectif à droite ; résultat dérivé mixte en variables, FR-20). Le Régime
    // de PRE-4 (champ, panneau et sous-titres) est retiré. Recette du 20/10 (RC-15) : plus de
    // ligne « Nombre de séries » ; le nombre est porté par l’option sélectionnée du Type de
    // série (« 3 séries identiques », « 3 séries variables », accord au singulier à N = 1), le
    // stepper révélé garde son nom accessible `series` et sa valeur « 3 séries ».
    // Recette du 20/10 (RC-17, décision de Hermann, Figma `9436:18101`) : la ligne s’intitule
    // « Séries » (au lieu de « Type de série ») ; même texte pour le nom accessible du segmenté.
    seriesType: "Sets",
    seriesCountUniform: "{n} identical sets",
    seriesCountUniformSingular: "{n} identical set",
    seriesCountVariable: "{n} variable sets",
    seriesCountVariableSingular: "{n} variable set",
    // Formats — saisie par la modale (16/11/2026, Hermann : exercice en boucle, « tours identiques / variables » au lieu de
    // « séries identiques / variables ») : mêmes options, comptées en tours.
    roundCountUniform: "{n} identical rounds",
    roundCountUniformSingular: "{n} identical round",
    roundCountVariable: "{n} variable rounds",
    roundCountVariableSingular: "{n} variable round",
    seriesTypes: { VARIABLE: "Variable", UNIFORM: "Identical" },
    stopCondition: "Stop condition",
    // D-447 (PRE-7 story B.2) : « À l’objectif » et « À l’objectif et à l’échec » remplacent
    // « À la cible… » dans tous les états ; identifiants `TARGET` et `MIXED` inchangés.
    stopConditions: { FAILURE: "To failure", TARGET: "To target", MIXED: "To target and failure" },
    showTable: "Show sets table",
    hideTable: "Hide sets table",
    // PRE-4 story 3.3 (AC8) : action accessible qui range un champ ± ouvert.
    closeField: "Close",
    durationTarget: "Set duration",
    // PRE-9 (ordre de Hermann du 01/11/2026, point 4 ; CE-UI-10, D-413) : en séries identiques,
    // mode Durée, la ligne de la cible commune de la Feuille s’intitule « Objectif de durée »
    // (remplace « Durée d’une série » dans la Feuille ; `durationTarget` reste celui de l’étape
    // de complétion, hors périmètre). « Durée de l’exercice » et les en-têtes du tableau des
    // séries variables (`columns`) sont inchangés.
    durationGoal: "Duration target",
    // PRE-4 story 3.5 (H14, décision de Claude du 2026-10-17, révisable par Hermann) :
    // ligne de la Cible commune, symétrique de « Durée d’une série ». Seule la Feuille
    // l’emploie ; l’en-tête de colonne du tableau reste `columns.REPETITIONS`.
    repetitionsTarget: "Number of reps",
    repetitionsUnit: "reps",
    pause: "Rest after each set",
    columns: { DURATION: "Duration", REPETITIONS: "Reps", pause: "Rest", load: "Weight" },
    row: "Set {n}",
    rowTarget: "Set {n}, {field}",
    rowPause: "Set {n}, rest",
    // PRE-5 story 2.2 (FR-23 à FR-25, AD-26) : ligne « Charge » (Avec / Sans), cellule de
    // charge d’une ligne du tableau, et barre du clavier décimal (Précédent / Suivant /
    // « Fermer ») ; les flèches ne sont jamais lues (`…Spoken`).
    load: "Weight",
    // Nom accessible du champ de la charge commune (distinct du segmenté « Charge »).
    loadValue: "Weight value",
    loadWith: "With",
    loadWithout: "Without",
    rowLoad: "Set {n}, weight",
    // D-434 (décision de Hermann du 19/10) : « À l’échec » à gauche de la barre (cellule Cible
    // d’une série) ; flèches seules quand la largeur manque, annoncées par `…Spoken`.
    keyboardBar: {
      failure: "To failure",
      previous: "← Previous",
      previousArrow: "←",
      previousSpoken: "Previous",
      next: "Next →",
      nextArrow: "→",
      nextSpoken: "Next",
      close: "Close",
      // Mise à jour consolidée des écrans Formats du 04/11/2026 (§4.5, §6 quater) : unité de l'objectif.
      repetitions: "Reps",
      duration: "Duration",
      unitSpoken: "Target unit: {unit}, tap to change",
      // Recette du 04/11/2026 : signe de l'incrément de charge EMOM.
      sign: "±",
      signSpoken: "Change sign",
    },
    moveUp: "Move set {n} up",
    moveDown: "Move set {n} down",
    moveHandle: "Move set {n}",
    // PRE-4 story 3.6 (FR-12-05, AC9, AC13) : croix de retrait et message de retrait.
    removeRow: "Delete set {n}",
    seriesRemoved: "Set deleted",
    // Croix non active (un champ ou un sélecteur est ouvert) : l'appui le ferme sans retirer.
    removeRowClosesFieldHint: "Closes the open field first, without deleting the set",
    // PRE-5 story 2.8 (FR-4 à FR-9, FR-44, D-432, D-434) : ligne « Phases de l’exercice » en tête
    // du cadre Séries (Avec / Sans ; Avec sélectionné affiche « n phases », n ≥ 2, avec le stepper
    // existant et le chevron du tableau), tableau des phases (Libellé, Durée), libellé par défaut
    // « Phase n » (affiché pour un libellé vide, stocké au ✓) et message de retrait d’une phase.
    // PRE-7 (D-448, point 8) : libellé « Phases du mouvement » (remplace « Phases de l’exercice » de D-432).
    workPhases: "Movement phases",
    workPhaseChoices: { WITH: "With", WITHOUT: "Without" },
    workPhaseCount: "{n} phases",
    // Une seule phase relue des données (le modèle l’admet) : accord au singulier.
    workPhaseCountSingular: "{n} phase",
    // Nom accessible du stepper du nombre de phases (2..6).
    workPhaseCountLabel: "Number of phases",
    showPhases: "Show phases table",
    hidePhases: "Hide phases table",
    // Recette du 20/10 (RC-16) : pendant le réglage du nombre de phases, le chevron du tableau est
    // visible mais indisponible ; l’indice est annoncé par le réglage ajustable.
    phasesTableToggleUnavailableHint: "Phases table: chevron unavailable while adjusting",
    phaseColumns: { label: "Label", duration: "Duration" },
    phaseDefault: "Phase {n}",
    phaseRow: "Phase {n}",
    phaseLabel: "Phase {n}, label",
    phaseDuration: "Phase {n}, duration",
    phaseMoveUp: "Move phase {n} up",
    phaseMoveDown: "Move phase {n} down",
    phaseMoveHandle: "Move phase {n}",
    removePhase: "Delete phase {n}",
    phaseRemoved: "Phase deleted",
    // Décision de Hermann du 09/11/2026 (recette PRE-10, constat d) : durée de série et phases du mouvement.
    phaseCycleBelow: "The set duration is shorter than the movement phases duration ({cycle}).",
    phaseCycleRoundTitle: "Round the set duration?",
    phaseCycleRoundMessage: "{target} isn’t a multiple of the movement phases duration ({cycle}).",
    phaseCycleRoundMessageRow: "Set {n}: {target} isn’t a multiple of the movement phases duration ({cycle}).",
    phaseCycleRoundTo: "Round to {duration}",
    totalRoundTitle: "Round the exercise duration?",
    totalRoundMessage: "{total} doesn’t match a whole number of sets.",
    removePhaseClosesFieldHint: "Closes the open field first, without deleting the phase",
    // PRE-5 story 2.5 (FR-15, FR-16, FR-44) : ligne « Changement de côté », segmenté « Avec | Sans »,
    // sans désignation anatomique. Les libellés anatomiques (`sideModes`, `sideModeOptions`) sont
    // retirés ; recette du 19/10 (RC-6) : le chevron de repli d’Avec aussi (`showSideSettings`,
    // `hideSideSettings`).
    sideMode: "Switch sides",
    // PRE-9 (ordre de Hermann du 01/11/2026, point 5 ; CE-UI-10 §7) : la ligne visible du
    // Changement de côté s’intitule « De chaque côté », sur une ligne (même texte pour le nom
    // accessible du segmenté, comme « Séries », RC-17). Le concept reste Changement de côté.
    sideModeRow: "Each side",
    sideModeChoices: { WITH: "With", WITHOUT: "Without" },
    // PRE-5 story 2.5 (FR-17, D-431) ; recette du 19/10 (RC-6) : plus de ligne « Enchainement » ;
    // l’option Avec porte la notation et ouvre le menu des deux notations, nommé « Enchainement » ;
    // nom accessible des notations = `sideOrders`. Recette du 19/10 (RC-12) : notation D-431
    // complète rétablie (option Avec de 146), après le raccourcissement de RC-11.
    sideSequence: "Sequence",
    // PRE-9 (ordre de Hermann du 01/11/2026, point 5 ; CE-UI-10 §8, D-431) : notations
    // « DD… → GG… » (un côté après l’autre, par défaut) et « DG → DG → … » (les deux côtés à
    // chaque série), à la taille standard des options ; D et G désignent les côtés 1 et 2, jamais
    // la droite et la gauche. Libellés accessibles : « Chaque série d’un côté, puis chaque série
    // de l’autre » et « Les deux côtés à chaque série ». [Remplacé le 01/11/2026 : notations
    // « (D1 → D2) ➜ (G1 → G2) » / « (D1 → G1) ➜ (D2 → G2) » en police réduite et libellé
    // accessible « Un côté après l’autre ».]
    sideOrders: { BY_SIDE: "Each set on one side, then each set on the other", BY_SERIES: "Both sides in each set" },
    sideOrderSubtitles: { BY_SIDE: "AA… → BB…", BY_SERIES: "AB → AB → …" },
    sideRecovery: "Rest between sides",
    // PRE-9 (ordre de Hermann du 01/11/2026, point 2 ; CE-UI-10 ligne 14) : bloc 6, seule ligne
    // « Récupération » (Récupération après exercice de l’Exercice de Séance).
    recovery: "Recovery",
    // PRE-9 (même ordre) : indice VoiceOver d’une valeur reprise d’un défaut du Profil, rendue sur fond
    // orange jusqu’au premier ✓ de l’Exercice (rendu choisi sans maquette).
    profileDefaultHint: "Profile default value, confirm with ✓.",
    // PRE-5 story 2.5 (FR-30, AD-24) : ligne « Cadence » (remplace « Bip de cadence »), segmenté
    // Autre / 5 s / 2 s / 1 s / Sans ; Autre révèle le ± existant.
    cadence: "Tempo",
    // Recette du 19/10 (RC-10) : Autre / 1 s / Sans.
    // Hermann, 08/11/2026 au soir : « Partout veut bien dire partout » — « 1″ ». [« 1 s » — remplacé le 08/11/2026 au soir.]
    cadenceOptions: { OTHER: "Other", "1": "1″", NONE: "None" },
    // PRE-5 story 2.5 (FR-31, AD-28) : ligne « Durée de l’exercice » (remplace « Durée totale »
    // dans la Feuille ; celle de la Phrase reste), chevron qui replie Compte à rebours et Fin.
    exerciseDuration: "Exercise duration",
    exerciseDurationEditAccessibilityLabel: "Exercise duration, adjust the number of sets",
    showExerciseSignals: "Show countdown and exercise end",
    hideExerciseSignals: "Hide countdown and exercise end",
    // PRE-4 story 3.7 (AC7, FR-14-05, AD-11) : annonces VoiceOver de la ligne Durée de l’exercice
    // en lecture seule — nature du total (≈ « estimation », ≥ « total prévisionnel
    // partiel ») et caractère non modifiable ; le symbole n'est jamais lu, ni un tiret.
    totalEstimatedSpoken: "estimate",
    totalLowerBoundSpoken: "partial projected total",
    totalReadOnlySpoken: "read-only",
    // Revue de la story 3.7 : ligne affichée « — » (saisie invalide hors Cible à
    // renseigner) ; annoncée après la nature quand elle est connue, jamais par le tiret.
    totalInvalidSpoken: "amount unavailable while a value is invalid",
    // D-433 (décision de Hermann du 19/10) : ligne « Durée de l’exercice » toujours affichée ;
    // durée exclue par la configuration seule, et annonce de « — » (données manquantes).
    totalNotCalculable: "Not calculable",
    totalMissingSpoken: "missing data",
    countdown: "Countdown",
    end: "Exercise end",
    secondsUnit: "seconds",
    incompleteMode: "Choose an execution mode.",
    incompleteSeries: {
      DURATION: "Set {n}: enter the duration.",
      REPETITIONS: "Set {n}: enter the reps.",
    },
    incompleteUniform: {
      DURATION: "Enter the set duration.",
      REPETITIONS: "Enter the reps.",
    },
    // PRE-4 (story 1.1) : indice choisi selon la violation — Cible à renseigner
    // (« Valeur à renseigner ») ou valeur hors des valeurs admises.
    invalidHint: "Value required",
    invalidValueHint: "Value not allowed",
    validateUnavailableSuffix: "unavailable while a value is invalid",
    // PRE-4 (story 1.1, AC22) : texte d'une Cible à l'échec, affiché en lecture
    // dans la Cible commune et dans chaque cellule du tableau.
    failureTarget: "to failure",
    // PRE-4 story 3.4 (FR-07-02) : option échec du Sélecteur de cible en Durée ; son
    // état est annoncé par l’état natif « sélectionné » (FR-07-08).
    durationFailureOption: "No duration, to failure",
    // PRE-4 story 3.5 (Q14, FR-07-08) : ligne de tête de la roue en Répétitions, et
    // annonce d’un nombre de la roue avec son unité (H13) ; « rép. » reste l’affichage.
    repetitionsFailureOption: "No reps, to failure",
    repetitionsSpokenSingular: "{n} rep",
    repetitionsSpokenPlural: "{n} reps",
    adjusted: "Duration adjusted to {duration} to keep a whole number of sets.",
    disabledSuffix: "no effect for a single set",
  },
  // PRE-6 story 3.3 (AD-37, AD-44) : Feuille d’un exercice d’un Circuit de Séries — nombre de
  // séries indisponible : suffixe du nom accessible et indice (nombre et croix de retrait). Hors de
  // `sheet`, dont le lexique proscrit « Circuit » depuis PRE-4 (`PRE4-3.8/AC4`), terme repris par PRE-6.
  circuit: {
    inheritedSeriesCountSuffix: "set by the circuit",
    inheritedSeriesCount: "Number of sets set by the circuit",
  },
  // PRE-9 — réglages de Format dans la modale de l’Exercice (CE-FMT-04 ; mise à jour consolidée des écrans Formats
  // du 04/11/2026 §6 bis 2, §4.4).
  format: {
    title: "{format}",
    names: { AMRAP: "AMRAP", FOR_TIME: "For time", EMOM: "EMOM", DEATH_BY: "Death by" },
    role: "Role",
    roles: { BUY_IN: "Buy-in", TOUR: "Round", BUY_OUT: "Buy-out" },
    lastTourHint: "Last exercise in the loop: switch another exercise to Round first.",
    incrementPerRound: "Increment per round",
    incrementPerInterval: "Increment per interval",
    // Recette iPhone du 07/11/2026 (Figma « Death by — Modale exercice, standard » `8598:31210` et « …, dans chaque intervalle » `11373:20396` ; référence Formats §12 et §14) : valeur du champ Séries d'un Death by autonome.
    seriesUntilFailure: "Until failure",
    repetitionsUnit: "reps",
    interval: "Interval",
    duration: "Exercise duration",
    timeCap: "For time max duration",
    noCap: "None",
    noLimit: "No limit",
    stopCondition: "Stop condition",
    atFailure: "To failure",
    emomOverflow: "The duration reaches or exceeds the interval: no time is left for the remaining work or for rest.",
    // Recette iPhone du 08/11/2026 au soir (Hermann) : durée de la série d'un Exercice qui atteint seule l'intervalle.
    emomSeriesOverflow: "The set duration exceeds the interval duration.",
    // Correction 2 de Hermann du 14/11/2026 (For time, règle 5 ; « aucune valeur perdue en silence ») : changement de Rôle qui
    // retire des séries (tours moins nombreux, bloc de séries plus court).
    roleLossTitle: "Remove sets?",
    roleLossMessageOne: "As {role}, this exercise keeps {kept} sets: the last value will be removed.",
    roleLossMessageMany: "As {role}, this exercise keeps {kept} sets: the last {count} values will be removed.",
    blockLossMessageOne: "The other {role} exercises also go to {kept} sets: one value will be removed.",
    blockLossMessageMany: "The other {role} exercises also go to {kept} sets: {count} values will be removed.",
    roleLossCancel: "Cancel",
    roleLossConfirm: "Continue",
  },
  media: {
    section: "Media",
    add: "Add photos or videos",
    importing: "Importing…",
    photo: "Photo",
    video: "Video",
    item: "{type} {rank} of {total}",
    remove: "Remove {item}",
    moveUp: "Move {item} up",
    moveDown: "Move {item} down",
    menuRemove: "Remove",
    menuMoveUp: "Move up",
    menuMoveDown: "Move down",
    menuCancel: "Cancel",
    // PRE-4 story 4.5 (Q31, H23, Q51 b) : le toucher consulte ; le menu du Média s’ouvre par
    // l’appui long ou, avec VoiceOver, par les actions de la tuile. Aucune option n’est
    // listée : elles dépendent de la position (bornes exclues). « Lire la vidéo » /
    // « Agrandir le média » par analogie du ch. 13 l. 1957.
    videoHint: "Play the video. Media menu by long press or actions",
    photoHint: "Enlarge the media. Media menu by long press or actions",
    // PRE-7 story A2.2 (MFN-09, MFN/AC28) : contenu de geste verrouillé — consultation seule,
    // sans menu (libellés « Lire la vidéo » / « Agrandir le média » du ch. 13 l. 3467).
    videoHintLocked: "Play the video",
    photoHintLocked: "Enlarge the media",
    closeConsultation: "Close",
    // Story 4.5 (FR-21-58, AC6) : erreur locale de consultation, lien du Média conservé.
    unavailable: "Media unavailable.",
    retry: "Try again",
    retryAccessibilityLabel: "Retry importing {item}",
    errors: {
      COPY_FAILED: "Import failed.",
      STORAGE_FULL: "Not enough storage space.",
      INCOMPATIBLE: "Unsupported format.",
      ERROR: "The photo library couldn’t be opened.",
    },
    permissionDenied: "Photo library access denied.",
    openSettings: "Open Settings",
    limitedAccess: "Limited access: only allowed media are shown.",
    missingFile: "File not found",
  },
  summary: {
    variableSeries: "{n} variable sets",
    variableSeriesPerSide: "{n} variable sets per side",
  },
  referenceSheets: {
    categoryTitle: "Exercise category",
    // Décision propriétaire D-8 (12/10) : confirmation explicite de la Catégorie.
    categoryConfirmAction: "Confirm category",
    // Recette 3 (N-03, D-355) : confirmation explicite de l’Étiquette de séance.
    labelConfirmAction: "Confirm tag",
    zoneCreateAction: "Create a body focus",
  },
};
