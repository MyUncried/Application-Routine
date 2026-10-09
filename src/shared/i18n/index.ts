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
    chooseMode: "Choisir un mode",
    descriptionPlaceholder: "Décrivez ce qu’il faut faire, comment, et avec quoi",
    openAccessibilityLabel: "Modifier les paramètres d’exécution",
    incomplete: "Paramètres à compléter.",
    countdown: "Compte à rebours",
    end: "Fin d’exercice",
  },
  sheet: {
    title: "Paramètres d’exécution",
    cancelAccessibilityLabel: "Annuler les paramètres",
    validateAccessibilityLabel: "Valider les paramètres",
    mode: "Mode d’exécution",
    modes: { DURATION: "Durée", REPETITIONS: "Répétitions", TO_FAILURE: "À l’échec" },
    unset: "—",
    series: "Séries",
    seriesSingular: "série",
    seriesPlural: "séries",
    variable: "Séries variables",
    showTable: "Afficher le tableau des séries",
    hideTable: "Masquer le tableau des séries",
    durationTarget: "Durée d’une série",
    repetitionsTarget: "Répétitions",
    repetitionsUnit: "rép.",
    pause: "Pause après chaque série",
    columns: { DURATION: "Durée", REPETITIONS: "Répétitions", pause: "Pause" },
    row: "Série {n}",
    rowTarget: "Série {n}, {field}",
    rowPause: "Série {n}, pause",
    moveUp: "Monter la série {n}",
    moveDown: "Descendre la série {n}",
    sideMode: "Changement de côté",
    sideModes: {
      UNILATERAL: "Sans changement",
      RIGHT_LEFT: "Droite puis gauche",
      LEFT_RIGHT: "Gauche puis droite",
    },
    sideOrder: "Ordre des côtés",
    sideOrders: { BY_SIDE: "Un côté après l’autre", BY_SERIES: "Les deux côtés à chaque série" },
    sideRecovery: "Pause entre les côtés",
    beep: "Bip de cadence",
    beepNone: "Aucun",
    total: "Durée totale",
    totalEstimated: "Durée totale ≈",
    totalEditAccessibilityLabel: "Durée totale, ajuster le nombre de séries",
    countdown: "Compte à rebours",
    end: "Fin d’exercice",
    secondsUnit: "secondes",
    incompleteMode: "Choisissez un mode d’exécution.",
    incompleteSeries: {
      DURATION: "Série {n} : renseignez la durée.",
      REPETITIONS: "Série {n} : renseignez les répétitions.",
    },
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
    range: "de {min} à {max}",
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
