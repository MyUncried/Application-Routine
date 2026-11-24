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
    // [create : « Créer un programme » (bouton de la zone de contexte) — retiré le 24/11/2026, UI-FAB-01 : bouton flottant.]
    /** Figma « PROG — 8 » (`12862:208`). */
    empty: "Vous verrez ici vos programmes dès que vous en aurez créé un. Un programme réunit des planifications sur une période et en suit l’exécution.",
    /** [interprétation] Aucun programme du statut choisi, ou aucun résultat de recherche. */
    noMatch: "Aucun programme.",
    loadError: "Les programmes n’ont pas pu être chargés.",
    retry: "Réessayer",
    actionError: "L’action n’a pas pu être effectuée.",
    phase: { IN_PROGRESS: "En cours", UPCOMING: "À venir", TERMINATED: "Terminé" },
    /** Figma « PROG — 7 » : « semaine 3 sur 13 » (PROG-CAT-01, point 2, 23/11/2026). */
    week: "semaine {week} sur {total}",
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
    /**
     * Contre-recette du 23/11/2026 (m, Hermann) : « titre de la modale de programme : "Créer un programme" en mode création,
     * "Modifier le programme" en mode modification ». [« Nouveau programme » ; nom du programme en configuration — remplacés.]
     */
    titleNew: "Créer un programme",
    titleEdit: "Modifier le programme",
    /** Contre-recette du 23/11/2026 (l) : toucher la ligne d'une routine l'ouvre en modification. */
    routineEditAccessibility: "Modifier la planification",
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
    /**
     * Lot 5, 23/11/2026 (point 4, D-544 — Hermann : « Le texte doit afficher le nombre de créneaux dans le programme et la date
     * de fin (jour et mois) ») : « 12 créneaux, jusqu'au 15 déc. ». [« du 15 septembre au 15 décembre » — remplacé.]
     */
    routineSlotsOne: "1 créneau, jusqu’au {end}",
    routineSlotsMany: "{count} créneaux, jusqu’au {end}",
  },
  /** D-543 (Hermann, 23/11/2026 ; DSF Programmes § 1) : période d'un programme. */
  period: {
    /** Le mot « au » / « pendant » est une valeur modifiable qui bascule d'un toucher (lot 5, 23/11/2026, y4 ; [menu — remplacé]). */
    // Lot 6 (23/11/2026, y4 — Hermann : « Remplacer "jusqu'au" par "au" »). [« jusqu’au » du lot 5 ter — remplacé.]
    modeDates: "au",
    modeDuration: "pendant",
    /** [interprétation] Libellés d'accessibilité des menus et de la roulette. */
    modeAccessibility: "Fin de la période, {value}",
    countAccessibility: "Durée, {value}",
    unitAccessibility: "Unité de la durée, {value}",
    units: {
      DAY: { one: "jour", many: "jours" },
      WEEK: { one: "semaine", many: "semaines" },
      MONTH: { one: "mois", many: "mois" },
    },
    daysOne: "1 jour",
    daysMany: "{count} jours",
    weeksOne: "1 semaine",
    weeksMany: "{count} semaines",
    /** « 91 jours, soit 13 semaines » ; « 92 jours, soit 13 semaines et 1 jour ». */
    datesInfo: "{days}, soit {weeks}",
    datesInfoRest: "{line} et {rest}",
    endsOn: "Se termine le {date}",
    /**
     * Lot 5, 23/11/2026 (y3 — Hermann : « Jours : « Se termine le… » ; Semaines : « X jours, se termine le… » ; Mois :
     * « X semaines, se termine le… » ») : « 21 jours, se termine le 5 octobre 2026 ».
     */
    endsOnAfter: "{length}, se termine le {date}",
    /** Raccourcir la période : « N créneaux seront supprimés ». [Singulier, Annuler et Confirmer : interprétation.] */
    shortenedOne: "1 créneau sera supprimé",
    shortenedMany: "{count} créneaux seront supprimés",
    shortenedCancel: "Annuler",
    shortenedConfirm: "Confirmer",
    /** [interprétation] Roulette du nombre hors iOS. */
    validate: "Valider",
  },
  /** « Rattacher une routine existante » (D-549). */
  attach: {
    /** Recette du 23/11/2026 (p4-rattacher) : plusieurs routines à la fois. [« Rattacher une routine » — remplacé.] */
    title: "Rattacher des routines",
    cancel: "Fermer",
    validate: "Rattacher",
    /** Bouton du bas (même patron que « Filtrer N routines »). */
    applyOne: "Rattacher 1 routine",
    applyMany: "Rattacher {count} routines",
    /** Hermann, 23/11/2026 (p4-rattacher) : « X créneaux sur la période, Y en dehors ». */
    slots: "{inside} créneaux sur la période, {outside} en dehors",
    slotsOne: "1 créneau sur la période, {outside} en dehors",
    /** [interprétation] Aucune routine sans programme. */
    empty: "Toutes vos routines appartiennent déjà à un programme.",
    /**
     * D-566 (23/11/2026) : créneaux à venir hors de la période. Contre-recette du 23/11/2026, lot 4 — rattachement (x9, Hermann :
     * « titre : "de ce programme" et non pas "du programme", enlever le point final ») ; modification depuis le Journal (x10 :
     * « Enlever le point final dans le titre de la fenêtre de confirmation »). [« … de la période du programme. » — remplacé.]
     */
    outsideMany: "{count} créneaux sont en dehors de la période de ce programme",
    outsideOne: "1 créneau est en dehors de la période de ce programme",
    outsideManyJournal: "{count} créneaux sont en dehors de la période du programme",
    outsideOneJournal: "1 créneau est en dehors de la période du programme",
    /** x9 et x10 (Hermann) : « Les garder dans le calendrier ». [« Garder dans le calendrier » — remplacé.] */
    outsideKeep: "Les garder dans le calendrier",
    /** x10 et arbitrage de Hermann du 23/11/2026 (« Les supprimer », dans les deux contextes). [« Supprimer » — remplacé.] */
    outsideDelete: "Les supprimer",
    outsideCancel: "Annuler",
  },
  /**
   * Figma « PROG — 13b » (`12848:47353`). Contre-recette du 23/11/2026 (a) : fenêtre de confirmation centrée sur un voile gris,
   * la modale du programme restant ouverte. [Feuille native posée sur la modale — remplacée.]
   */
  consent: {
    title: "Suivi de la douleur",
    /**
     * Lot 4 du 23/11/2026 (x5, Hermann) : texte recopié tel quel (« demandés » : accord signalé, non corrigé). [« Une échelle de
     * douleur et la zone concernée vous seront demandées avant et après les séances des programmes qui activent ce suivi. » —
     * remplacé.]
     */
    body: "Une échelle de douleur et la zone concernée vous seront demandés avant et après chaque séance exécutée dans ce programme",
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
    /**
     * Contre-recette du 23/11/2026 (constat b, Hermann) : « Retirer mon accord » demande une confirmation qui nomme les
     * programmes concernés. Message : texte de Hermann, « rapporté » accordé. Titre et libellé d'action : [interprétation].
     */
    withdrawConfirmTitle: "Retirer mon accord",
    withdrawConfirmMessage:
      "L’information de douleur rapportée avant et après l’exécution d’une séance ne sera plus mesurée ni partagée dans les programmes suivants : {names}",
    withdrawConfirm: "Retirer",
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
