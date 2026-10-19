import { fr } from "./resources/fr";

/**
 * PRE-3 (#340) — libellés des surfaces Paramètres d'exécution, médias et
 * cartes. Regroupés ici, à côté du catalogue `fr` (fichier de ressources
 * hors du périmètre d'écriture PRE-3) ; textes repris des écrans Figma de
 * référence (`docs/preparation/PRE-3/figma/ecrans`). Aucun nouveau moteur de
 * traduction : français MVP uniquement.
 */
const executionParameters = {
  card: {
    title: "Paramètres d’exécution",
    // PRE-4 story 4.2 (Q23, AC14) : `chooseMode` (« Choisir un mode ») est retiré
    // avec le bouton de Mode à droite du titre de la Carte.
    // E-21 (décision de Hermann du 2026-10-18) : l'invite H22 de la Carte vide est retirée.
    descriptionPlaceholder: "Décrivez ce qu’il faut faire, comment, et avec quoi",
    // Recette 3 (N-05) : action ↑ du champ Description.
    descriptionSubmitAccessibilityLabel: "Valider la description",
    openAccessibilityLabel: "Modifier les paramètres d’exécution",
    incomplete: "Paramètres à compléter.",
    countdown: "Compte à rebours",
    end: "Fin d’exercice",
  },
  sheet: {
    title: "Paramètres d’exécution",
    cancelAccessibilityLabel: "Annuler les paramètres",
    validateAccessibilityLabel: "Valider les paramètres",
    // PRE-5 story 2.4 (PR-01, FR-44) : ligne « Mode » du cadre Exécution, segmenté en ligne.
    mode: "Mode",
    // PRE-4 (story 1.1, AC22, FR-05-01) : deux Modes seulement ; « à l’échec »
    // désigne une Cible, jamais un Mode (FR-05-04) : voir `failureTarget`.
    modes: { DURATION: "Durée", REPETITIONS: "Répétitions" },
    unset: "—",
    // PRE-4 story 3.8 (AC2, AC4, FR-22-08, H23) : annonce VoiceOver d’une valeur affichée
    // « — » (Mode, Changement de côté, Cible non renseignés) : jamais lue « tiret ».
    unsetSpoken: "aucune valeur",
    series: "Séries",
    seriesSingular: "série",
    seriesPlural: "séries",
    // PRE-5 story 2.4 (PR-01, FR-26, FR-27, FR-44, NR Δ38) : ligne du stepper « Nombre de
    // séries » (son nom accessible reste `series`), ligne « Type de série » (Variables à
    // gauche avec son chevron, Identiques à droite) et ligne « Condition d’arrêt » (À l’échec
    // à gauche, À la cible à droite ; résultat dérivé mixte en variables, FR-20). Le Régime
    // de PRE-4 (champ, panneau et sous-titres) est retiré.
    seriesCount: "Nombre de séries",
    seriesType: "Type de série",
    seriesTypes: { VARIABLE: "Variables", UNIFORM: "Identiques" },
    stopCondition: "Condition d’arrêt",
    stopConditions: { FAILURE: "À l’échec", TARGET: "À la cible", MIXED: "À la cible et à l’échec" },
    showTable: "Afficher le tableau des séries",
    hideTable: "Masquer le tableau des séries",
    // PRE-4 story 3.3 (AC8) : action accessible qui range un champ ± ouvert.
    closeField: "Fermer",
    durationTarget: "Durée d’une série",
    // PRE-4 story 3.5 (H14, décision de Claude du 2026-10-17, révisable par Hermann) :
    // ligne de la Cible commune, symétrique de « Durée d’une série ». Seule la Feuille
    // l’emploie ; l’en-tête de colonne du tableau reste `columns.REPETITIONS`.
    repetitionsTarget: "Nombre de répétitions",
    repetitionsUnit: "rép.",
    pause: "Pause après chaque série",
    columns: { DURATION: "Durée", REPETITIONS: "Répétitions", pause: "Pause", load: "Charge" },
    row: "Série {n}",
    rowTarget: "Série {n}, {field}",
    rowPause: "Série {n}, pause",
    // PRE-5 story 2.2 (FR-23 à FR-25, AD-26) : ligne « Charge » (Avec / Sans), cellule de
    // charge d’une ligne du tableau, et barre du clavier décimal (Précédent / Suivant /
    // « Fermer ») ; les flèches ne sont jamais lues (`…Spoken`).
    load: "Charge",
    // Nom accessible du champ de la charge commune (distinct du segmenté « Charge »).
    loadValue: "Valeur de la charge",
    loadWith: "Avec",
    loadWithout: "Sans",
    rowLoad: "Série {n}, charge",
    keyboardBar: {
      previous: "← Précédent",
      previousSpoken: "Précédent",
      next: "Suivant →",
      nextSpoken: "Suivant",
      close: "Fermer",
    },
    moveUp: "Monter la série {n}",
    moveDown: "Descendre la série {n}",
    moveHandle: "Déplacer la série {n}",
    // PRE-4 story 3.6 (FR-12-05, AC9, AC13) : croix de retrait et message de retrait.
    removeRow: "Supprimer la série {n}",
    seriesRemoved: "Série supprimée",
    // Croix non active (un champ ou un sélecteur est ouvert) : l'appui le ferme sans retirer.
    removeRowClosesFieldHint: "Ferme d’abord le champ ouvert, sans supprimer la série",
    // PRE-5 story 2.5 (FR-15, FR-16, FR-44) : ligne « Changement de côté », segmenté « Avec | Sans »,
    // sans désignation anatomique. Les libellés anatomiques (`sideModes`, `sideModeOptions`) sont
    // retirés ; recette du 19/10 (RC-6) : le chevron de repli d’Avec aussi (`showSideSettings`,
    // `hideSideSettings`).
    sideMode: "Changement de côté",
    sideModeChoices: { WITH: "Avec", WITHOUT: "Sans" },
    // PRE-5 story 2.5 (FR-17, D-431) ; recette du 19/10 (RC-6) : plus de ligne « Enchainement » ;
    // l’option Avec porte la notation (flèche centrale ➜) et ouvre le menu des deux notations,
    // nommé « Enchainement » ; nom accessible des notations = `sideOrders`.
    sideSequence: "Enchainement",
    sideSequenceCancel: "Annuler",
    sideOrders: { BY_SIDE: "Un côté après l’autre", BY_SERIES: "Les deux côtés à chaque série" },
    sideOrderSubtitles: { BY_SIDE: "(D1 → D2) ➜ (G1 → G2)", BY_SERIES: "(D1 → G1) ➜ (D2 → G2)" },
    sideRecovery: "Pause entre les côtés",
    // PRE-5 story 2.5 (FR-30, AD-24) : ligne « Cadence » (remplace « Bip de cadence »), segmenté
    // Autre / 5 s / 2 s / 1 s / Sans ; Autre révèle le ± existant.
    cadence: "Cadence",
    cadenceOptions: { OTHER: "Autre", "5": "5 s", "2": "2 s", "1": "1 s", NONE: "Sans" },
    // PRE-5 story 2.5 (FR-31, AD-28) : ligne « Durée de l’exercice » (remplace « Durée totale »
    // dans la Feuille ; celle de la Phrase reste), chevron qui replie Compte à rebours et Fin.
    exerciseDuration: "Durée de l’exercice",
    exerciseDurationEstimated: "Durée de l’exercice ≈",
    exerciseDurationEditAccessibilityLabel: "Durée de l’exercice, ajuster le nombre de séries",
    showExerciseSignals: "Afficher le compte à rebours et la fin d’exercice",
    hideExerciseSignals: "Masquer le compte à rebours et la fin d’exercice",
    // PRE-4 story 3.7 (AC7, FR-14-05, AD-11) : annonces VoiceOver de la ligne Durée de l’exercice
    // en lecture seule — nature du total (≈ « estimation », ≥ « total prévisionnel
    // partiel ») et caractère non modifiable ; le symbole n'est jamais lu, ni un tiret.
    totalEstimatedSpoken: "estimation",
    totalLowerBoundSpoken: "total prévisionnel partiel",
    totalReadOnlySpoken: "non modifiable",
    // Revue de la story 3.7 : ligne affichée « — » (saisie invalide hors Cible à
    // renseigner) ; annoncée après la nature quand elle est connue, jamais par le tiret.
    totalInvalidSpoken: "montant indisponible tant qu’une valeur est invalide",
    countdown: "Compte à rebours",
    end: "Fin d’exercice",
    secondsUnit: "secondes",
    incompleteMode: "Choisissez un mode d’exécution.",
    incompleteSeries: {
      DURATION: "Série {n} : renseignez la durée.",
      REPETITIONS: "Série {n} : renseignez les répétitions.",
    },
    incompleteUniform: {
      DURATION: "Renseignez la durée d’une série.",
      REPETITIONS: "Renseignez les répétitions.",
    },
    // PRE-4 (story 1.1) : indice choisi selon la violation — Cible à renseigner
    // (« Valeur à renseigner ») ou valeur hors des valeurs admises.
    invalidHint: "Valeur à renseigner",
    invalidValueHint: "Valeur non admise",
    validateUnavailableSuffix: "indisponible tant qu’une valeur est invalide",
    // PRE-4 (story 1.1, AC22) : texte d'une Cible à l'échec, affiché en lecture
    // dans la Cible commune et dans chaque cellule du tableau.
    failureTarget: "à l’échec",
    // PRE-4 story 3.4 (FR-07-02) : option échec du Sélecteur de cible en Durée ; son
    // état est annoncé par l’état natif « sélectionné » (FR-07-08).
    durationFailureOption: "Aucune durée, à l’échec",
    // PRE-4 story 3.5 (Q14, FR-07-08) : ligne de tête de la roue en Répétitions, et
    // annonce d’un nombre de la roue avec son unité (H13) ; « rép. » reste l’affichage.
    repetitionsFailureOption: "Aucune répétition, à l’échec",
    repetitionsSpokenSingular: "{n} répétition",
    repetitionsSpokenPlural: "{n} répétitions",
    adjusted: "Durée ajustée à {duration} pour respecter un nombre entier de séries.",
    disabledSuffix: "sans effet pour une seule série",
  },
  media: {
    section: "Médias",
    add: "Ajouter des photos ou vidéos",
    importing: "Importation…",
    photo: "Photo",
    video: "Vidéo",
    item: "{type} {rank} sur {total}",
    remove: "Retirer {item}",
    moveUp: "Monter {item}",
    moveDown: "Descendre {item}",
    menuRemove: "Retirer",
    menuMoveUp: "Monter",
    menuMoveDown: "Descendre",
    menuCancel: "Annuler",
    // PRE-4 story 4.5 (Q31, H23, Q51 b) : le toucher consulte ; le menu du Média s’ouvre par
    // l’appui long ou, avec VoiceOver, par les actions de la tuile. Aucune option n’est
    // listée : elles dépendent de la position (bornes exclues). « Lire la vidéo » /
    // « Agrandir le média » par analogie du ch. 13 l. 1957.
    videoHint: "Lire la vidéo. Menu du média par appui long ou par les actions",
    photoHint: "Agrandir le média. Menu du média par appui long ou par les actions",
    closeConsultation: "Fermer",
    // Story 4.5 (FR-21-58, AC6) : erreur locale de consultation, lien du Média conservé.
    unavailable: "Média indisponible.",
    retry: "Réessayer",
    retryAccessibilityLabel: "Réessayer l’import de {item}",
    errors: {
      COPY_FAILED: "Import impossible.",
      STORAGE_FULL: "Espace de stockage insuffisant.",
      INCOMPATIBLE: "Format non pris en charge.",
      ERROR: "La photothèque n’a pas pu être ouverte.",
    },
    permissionDenied: "Accès à la photothèque refusé.",
    openSettings: "Ouvrir les réglages",
    limitedAccess: "Accès limité : seuls les médias autorisés sont proposés.",
    missingFile: "Fichier introuvable",
  },
  summary: {
    variableSeries: "{n} séries variables",
    variableSeriesPerSide: "{n} séries variables par côté",
  },
  referenceSheets: {
    categoryTitle: "Catégorie de l’exercice",
    // Décision propriétaire D-8 (12/10) : confirmation explicite de la Catégorie.
    categoryConfirmAction: "Confirmer la catégorie",
    // Recette 3 (N-03, D-355) : confirmation explicite de l’Étiquette de séance.
    labelConfirmAction: "Confirmer l’étiquette",
    zoneCreateAction: "Créer une zone corporelle",
  },
} as const;

/**
 * Point d’accès unique au catalogue de textes.
 *
 * Le MVP est monolingue (français). Ce module reste le seul endroit à
 * modifier pour introduire une sélection de langue future : les écrans ne
 * doivent jamais importer `./resources/fr` directement.
 */
export const strings = { ...fr, executionParameters };

export type Strings = typeof strings;
