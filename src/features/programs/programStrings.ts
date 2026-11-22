/**
 * Libellés des programmes (PROG-CAT-01, 21/11/2026). Sources : spécification
 * `docs/KODJO-Programme-catalogue-creation-configuration-2026-11-20.md` et Figma `G6RY5Ebhgwb4AHIOYDwwvg` (PROG — 7, 7b, 7c, 8,
 * 13, 13b ; Profil — Confidentialité `12839:4036`). Les libellés qui ne figurent dans aucune source sont marqués
 * « [interprétation] » et sont listés dans le rapport de mission.
 */
export const programStrings = {
  catalogue: {
    segment: "Programmes",
    /** D-545 : ligne « Actifs N · Terminés N », filtre. */
    active: "Actifs",
    finished: "Terminés",
    filterSelectHint: "Affiche les programmes de ce statut",
    searchPlaceholder: "Rechercher",
    searchAccessibility: "Rechercher un programme",
    searchClear: "Effacer la recherche",
    filter: "Filtrer",
    sort: "Trier",
    create: "Créer un programme",
    /** Figma « PROG — 8 » (`12862:208`). */
    empty: "Vous verrez ici vos programmes dès que vous en aurez créé un. Un programme réunit des planifications sur une période et en suit l’exécution.",
    /** [interprétation] Aucun programme du statut choisi, ou aucun résultat de recherche. */
    noMatch: "Aucun programme.",
    loadError: "Les programmes n’ont pas pu être chargés.",
    retry: "Réessayer",
    actionError: "L’action n’a pas pu être effectuée.",
    phase: { IN_PROGRESS: "En cours", UPCOMING: "À venir", TERMINATED: "Terminé" },
    routinesOne: "1 planification",
    routinesMany: "{count} planifications",
    /** Hermann, 21/11/2026, point 2 : « N séances » (séances distinctes des routines rattachées). */
    sessionsOne: "1 séance",
    sessionsMany: "{count} séances",
    /** D-546 et décision du 21/11/2026 : actions glissées. */
    saveAsTemplate: "Enregistrer comme modèle",
    duplicate: "Dupliquer",
    delete: "Supprimer",
    openAccessibility: "Configurer le programme",
  },
  /** CE-PROG-03 (Figma « PROG — 7c »). */
  deletion: {
    title: "Supprimer ce programme",
    slotsOne: "1 créneau non commencé sera supprimé.",
    slotsMany: "{count} créneaux non commencés seront supprimés.",
    terminated: "Le programme sera terminé.",
    /** [interprétation] Sans historique : le programme est supprimé (D-547). */
    deleted: "Le programme sera supprimé.",
    withRoutines: "Supprimer avec ses routines",
    keepRoutines: "Garder les routines dans le calendrier",
    cancel: "Annuler",
  },
  /** CE-PROG-02 (Figma « PROG — 13 »). */
  sheet: {
    titleNew: "Nouveau programme",
    cancel: "Fermer sans enregistrer",
    save: "Enregistrer le programme",
    namePlaceholder: "Nom du programme",
    nameAccessibility: "Nom du programme",
    objectivePlaceholder: "Objectif",
    objectiveAccessibility: "Objectif du programme",
    from: "Du",
    to: "au",
    /** [interprétation] Date pas encore choisie (programme dupliqué, sans dates). */
    chooseDate: "Choisir",
    startAccessibility: "Date de début",
    endAccessibility: "Date de fin",
    plannings: "Planifications",
    /** Hermann, 21/11/2026, point 1 : « + Planifier une séance » (D-449). */
    plan: "+ Planifier une séance",
    attach: "Rattacher une routine existante",
    detach: "Retirer",
    detachAccessibility: "Retirer {name} du programme",
    contentsOne: "1 contenu",
    contentsMany: "{count} contenus",
    painTracking: "Suivi de la douleur",
    saveFailed: "Le programme n’a pas pu être enregistré.",
    /** [interprétation] « + Planifier une séance » d'un nouveau programme : il est d'abord enregistré. */
    saveBeforePlanning: "Renseignez le nom et la période pour planifier une séance.",
  },
  /** « Rattacher une routine existante » (D-549). */
  attach: {
    title: "Rattacher une routine",
    cancel: "Fermer",
    validate: "Rattacher",
    /** [interprétation] Aucune routine sans programme. */
    empty: "Toutes vos routines appartiennent déjà à un programme.",
  },
  /** Figma « PROG — 13b » (`12848:47353`). */
  consent: {
    title: "Suivi de la douleur",
    body: "Une échelle de douleur et la zone concernée vous seront demandées avant et après les séances des programmes qui activent ce suivi.",
    note: "Ces relevés restent sur votre téléphone et ne sont jamais interprétés. Vous pouvez retirer votre accord et effacer vos relevés à tout moment dans Profil › Confidentialité.",
    cancel: "Annuler",
    allow: "Autoriser",
  },
  /** CE-PRF-01 (Figma « Profil — Confidentialité » `12839:4036`). */
  privacy: {
    tab: "Confidentialité",
    painTitle: "Suivi de la douleur",
    /** Spécification §5.4 : sans accord, « non utilisé », sans réglage. */
    painUnused: "Non utilisé",
    grantedOn: "Accordé le {date}",
    usedByNone: "Utilisé par aucun programme",
    usedByOne: "Utilisé par 1 programme · {names}",
    usedByMany: "Utilisé par {count} programmes · {names}",
    withdraw: "Retirer mon accord",
    erase: "Effacer mes relevés",
    painNote:
      "Le suivi s’active dans un programme. Retirer votre accord le désactive dans tous les programmes ; les relevés restent sur votre téléphone, jamais interprétés, jusqu’à leur effacement.",
    /** [interprétation] Confirmations (« Effacer mes relevés demande une confirmation »). */
    eraseConfirmTitle: "Effacer mes relevés",
    eraseConfirmMessage: "Tous vos relevés de douleur seront supprimés de ce téléphone.",
    eraseConfirm: "Effacer",
    withdrawFailed: "L’accord n’a pas pu être retiré.",
    communityTitle: "Partage communautaire",
    visibleExecutions: "Mes nouvelles exécutions sont visibles",
    visibleExecutionsHint: "Rendez-en une privée à tout moment",
    pseudo: "Pseudo",
    pseudoValue: "@hermann — visible par tous",
    displayName: "Nom d’affichage",
    displayNameValue: "Privé",
    profile: "Profil",
    profileValue: "Visible par vos amis",
    painReadings: "Relevés de douleur",
    painReadingsValue: "Jamais partagés",
    communityNote: "Les exécutions réalisées avant l’activation de la communauté ne sont jamais partagées.",
    /** Mission PROG-CAT-01 §5. */
    unavailable: "Disponible avec la gestion des comptes",
    cancel: "Annuler",
  },
} as const;
