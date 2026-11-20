/**
 * Planification et Calendrier Semaine — textes repris des écrans Figma (page « Prototype MVP » : `1992:5101`,
 * `1992:6389`, `1992:5962`, `1992:5365`, `1992:6102`, `1992:6838`, `1992:7716`, `7594:34531`, `7599:14197`) et des
 * contrats CE-UI-03/04/05. Regroupés dans la fonctionnalité (même patron que `executionStrings`) pour ne pas
 * modifier le catalogue partagé `fr.ts` pendant les chantiers parallèles.
 */
export const planningStrings = {
  /** Repère « P » d'une routine à plusieurs séances (recette du 20/11/2026, constat A), lu par VoiceOver. */
  parcours: "Parcours",
  months: ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"],
  monthsShort: ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."],
  /** Lundi = index 0. */
  weekdayNames: ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"],
  weekdayShort: ["Lun.", "Mar.", "Mer.", "Jeu.", "Ven.", "Sam.", "Dim."],
  weekdayLetters: ["L", "M", "M", "J", "V", "S", "D"],
  weekdayPlurals: ["lundis", "mardis", "mercredis", "jeudis", "vendredis", "samedis", "dimanches"],
  the: "les",
  and: "et",
  weekUnit: { singular: "semaine", plural: "semaines" },
  dayUnit: { singular: "jour", plural: "jours" },
  /** RM-259 (18/11/2026) : synthèse de la zone de contexte, sans majuscule initiale ni point final. */
  synthesis: {
    single: "le {date}, à {time}",
    everyWeek: "toutes les semaines",
    everyWeeks: "toutes les {count} semaines",
    everyDay: "tous les jours",
    everyDays: "tous les {count} jours",
    daysPerWeekOne: "{count} jour par semaine",
    daysPerWeek: "{count} jours par semaine",
  },
  summary: {
    single: "Planifiée le {date} à {time}, sans répétition.",
    everyWeek: "Toutes les semaines",
    everyWeeks: "Toutes les {count} semaines",
    at: "à",
    until: "jusqu’au {date}",
    during: "pendant {count} {unit}",
  },
  calendar: {
    title: "Calendrier",
    // D-532 (19/11/2026) : onglets Journal · Agenda · Vue d’ensemble. [Avant : Jour, Semaine, Mois.]
    views: { day: "Journal", week: "Agenda", month: "Vue d’ensemble" },
    viewUnavailable: "{view} — vue non disponible dans cette version",
    today: "Aujourd’hui",
    plan: "Planifier",
    previousWeek: "Semaine précédente",
    nextWeek: "Semaine suivante",
    planned: { one: "{count} prévue", other: "{count} prévues" },
    emptyWeek: "Aucune séance planifiée cette semaine.",
    loadError: "Le calendrier n’a pas pu être chargé.",
    actionError: "L’action n’a pas pu être effectuée.",
    duplicate: "Dupliquer",
    delete: "Supprimer",
    everyWeekdayPrefix: "Chaque",
    everyDay: "Tous les jours",
    everyDays: "Tous les {count} jours",
    openRoutine: "Modifier la planification",
    dayAccessibility: "{day}, {count}",
    dayEmptyAccessibility: "{day}, aucune séance",
    timeAccessibility: "à {time}",
    // D-533 (19/11/2026) : Agenda — navigation par mois, carte de routine.
    previousMonth: "Mois précédent",
    nextMonth: "Mois suivant",
    expandRoutine: "Déplier la routine",
    collapseRoutine: "Replier la routine",
    start: "Démarrer",
    // D-536, point 5 (20/11/2026) : occurrence passée non commencée.
    catchUp: "Rattraper",
    done: "Terminée",
    // Recette du 19/11/2026 au soir (s19-passees) : statut d'une occurrence exécutée.
    status: { completed: "Complétée", partial: "Partielle", stopped: "Arrêtée" },
  },
  // D-535 (19/11/2026) : Journal des routines (DSF Journal, Figma « Calendrier — Journal — MVP »).
  journal: {
    // Recette du 19/11/2026 au soir (j1-compteurs) : « Mettre planifiée ». [« Actives » — remplacé.]
    active: "Planifiées",
    finished: "Terminées",
    once: "Une seule fois",
    on: "le",
    until: "jusqu’au",
    edit: "Modifier la planification",
    empty: "Aucune routine planifiée.",
    noResult: "Aucune routine ne correspond.",
    loadError: "Le journal n’a pas pu être chargé.",
    searchPlaceholder: "Rechercher",
    searchAccessibility: "Rechercher une routine",
    searchClear: "Effacer la recherche",
    sort: "Trier",
    expand: "Déplier la routine",
    collapse: "Replier la routine",
    // Recette du 19/11/2026 au soir (constat E) : nombre d'occurrences à venir, dates de début et de fin.
    // Ligne 3 de la carte (recette du 20/11/2026, r20-j-deploye) : « N créneaux, du X mois au Y mois ».
    slotsNone: "Aucun créneau à venir",
    slotsOne: "1 créneau, le {date}",
    slotsMany: "{count} créneaux, du {start} au {end}",
    upcomingNone: "Aucune occurrence à venir",
    upcomingOne: "1 occurrence à venir",
    upcomingMany: "{count} occurrences à venir",
    period: "du {start} au {end}",
    single: "le {date}",
  },
  deleteSingle: {
    title: "Supprimer la planification ?",
    message: "La séance reste dans le catalogue. Les séances déjà exécutées resteront dans l’historique.",
    cancel: "Annuler",
    confirm: "Confirmer",
  },
  /**
   * Recette du 20/11/2026 (constat D — Hermann : « Dans l'agenda on ne supprime que l'occurrence ; Dans le Journal on
   * supprime toutes les occurrences ») ; libellés de D-537 et du constat E (« Suppression sans historique : « La routine et
   * ses N créneaux seront supprimés. » »).
   */
  deleteOccurrence: {
    // Recette du 20/11/2026 (r21-supprimer — Hermann : « remplacer le texte par "Supprimer ce créneau" »). [« Supprimer cette
    // occurrence » — remplacé.]
    title: "Supprimer ce créneau",
    cancel: "Annuler",
    confirm: "Confirmer",
  },
  deleteRoutine: {
    title: "Supprimer cette routine",
    messageOne: "La routine et son créneau seront supprimés.",
    messageMany: "La routine et ses {count} créneaux seront supprimés.",
    // Constat E (Hermann, 20/11/2026) : « Suppression avec historique : « N créneaux non commencés seront supprimés ; La
    // routine sera archivée. » ».
    archiveOne: "1 créneau non commencé sera supprimé ; La routine sera archivée.",
    archiveMany: "{count} créneaux non commencés seront supprimés ; La routine sera archivée.",
    // r21-j-supprimer (Hermann) : aucun créneau à supprimer — « enlever le texte et mettre dans le titre "la routine <Nom de
    // la routine> sera supprimée" ».
    titleNamed: "La routine {name} sera supprimée",
    cancel: "Annuler",
    confirm: "Confirmer",
  },
  /** D-539 (20/11/2026, DSF Agenda § 9) : filtre par routine de l'Agenda. */
  routineFilter: {
    open: "Filtrer par routine",
    active: "Filtre par routine actif",
    title: "Filtrer par routine",
    close: "Fermer",
    applyOne: "Filtrer 1 routine",
    applyMany: "Filtrer {count} routines",
    // [Libellé sans sélection : retenu par Claude, D-539.]
    showAll: "Afficher toutes les routines",
    slots: "{count} à venir, jusqu’au {date}",
    empty: "Aucune routine planifiée.",
    noResult: "Aucune routine ne correspond.",
  },
  /** Constat E (Hermann, 20/11/2026) : « Modification dans le Journal : « N créneaux à venir seront modifiés. » ». */
  modifyRoutine: {
    // [Titre : interprétation technique, aucun texte demandé.]
    title: "Modifier cette routine",
    messageOne: "1 créneau à venir sera modifié.",
    messageMany: "{count} créneaux à venir seront modifiés.",
    cancel: "Annuler",
    confirm: "Confirmer",
  },
  deleteOccurrences: {
    title: "Supprimer des occurrences ?",
    message: "Choisissez les occurrences à retirer. Les séances déjà exécutées resteront dans l’historique.",
    thisOne: "Seulement cette occurrence",
    allUpcoming: "Toutes les occurrences à venir",
    cancel: "Annuler",
  },
  form: {
    titleEmpty: "Planifier",
    titleSession: "Planifier une séance",
    titleRoute: "Planifier un parcours",
    cancel: "Fermer sans enregistrer",
    save: "Enregistrer la planification",
    change: "Changer",
    // D-521 (18/11/2026) : carte « Programme et Début le ». [Recette du 17/11/2026 : « Planifié » — remplacé.]
    start: "Début",
    program: "Programme",
    programNone: "Aucun",
    nameAccessibility: "Nom de la planification",
    namePlaceholder: "Nom de la planification",
    nameRequired: "Nom obligatoire",
    nameTaken: "Ce nom est déjà utilisé",
    everyFeminine: "toutes les",
    everyMasculine: "tous les",
    none: "aucune",
    repetitionKindAccessibility: "Répétition : {value}. Toucher pour basculer.",
    unitAccessibility: "Unité : {value}. Toucher pour basculer.",
    // D-519 : « Séance par créneau ». [Figma `12650:27854` : « Séances par créneau ».]
    slotsTitle: "Séance par créneau",
    column: "#{n}",
    columnAccessibility: "Cycle de {n} créneaux",
    pointAccessibility: "{name}, créneau {n}",
    cycleTooLong: "Le cycle compte {n} créneaux : touchez un numéro de colonne pour le ramener à 7 au plus.",
    on: "le",
    at: "à",
    repetition: "Répétition",
    repetitionToggle: "Répétition",
    collapse: "Replier la répétition",
    expand: "Déplier la répétition",
    units: { day: "Jour", week: "Semaine", month: "Mois" },
    unitUnavailable: "{unit} — non disponible dans cette version",
    every: "Toutes les",
    until: "jusqu’au",
    during: "pendant",
    endKindAccessibility: "Borne de fin : {value}. Toucher pour basculer.",
    endCountAccessibility: "Pendant {count} {unit}",
    multiplierAccessibility: "Toutes les {count} semaines",
    decrease: "Diminuer",
    increase: "Augmenter",
    everyTime: "à chaque fois",
    frequency: "{x} fois sur {n}",
    reorderHandle: "Déplacer {name}",
    moveUp: "Monter",
    moveDown: "Descendre",
    saveError: "La planification n’a pas pu être enregistrée.",
    unavailableContent: "{count} séance indisponible retirée de la planification.",
    combinedName: "{first} et {count} autres",
    combinedNameTwo: "{first} et {second}",
    datePicker: "Date de planification",
    timePicker: "Heure",
    endDatePicker: "Date de fin",
  },
  reminder: {
    title: "Rappel",
    toggle: "Rappel",
    // D-524 (18/11/2026) : « Sans » désactive le rappel.
    none: "Sans",
    other: "Autre",
    customTitle: "Rappel personnalisé",
    hours: "heures",
    minutes: "minutes",
    cancel: "Annuler",
    validate: "Valider",
    // Recette du 19/11/2026 (k14, e3) : notifications refusées — message natif proposant de les réactiver ; le texte
    // sous la carte Rappel est retiré.
    deniedTitle: "Notifications désactivées",
    deniedMessage: "Pour recevoir ce rappel, autorisez les notifications de Routine.",
    deniedCancel: "Annuler",
    deniedSettings: "Autoriser",
  },
  selection: {
    title: "Catalogue des séances",
    cancel: "Fermer sans modifier la sélection",
    validate: "Valider la sélection",
    empty: "Aucune séance à planifier. Créez d’abord une séance dans le Catalogue.",
    loadError: "Les séances n’ont pas pu être chargées.",
    checked: "sélectionnée",
    unchecked: "non sélectionnée",
  },
} as const;
