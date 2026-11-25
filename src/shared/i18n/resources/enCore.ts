/**
 * J1 « Gestion des langues » (23/11/2026) : traduction anglaise de `fr.ts` hors `screens` (errors, splash,
 * migrationNotice, shared, nav, referenceData) et, dans `screens`, de `notFound`, `catalogueContext` et `sessions`
 * (selon le glossaire validé, `docs/preparation/langues/GLOSSAIRE-EN-2026-11-23.md`).
 */
import type { FrResource } from "./en";

export const enCore: Omit<FrResource, "screens"> & {
  readonly screens: Pick<FrResource["screens"], "notFound" | "catalogueContext" | "sessions">;
} = {
  errors: {
    root: {
      message: "Unable to display KODJO. Close and restart the app.",
    },
  },
  // J1 « Gestion des langues » (23/11/2026, accord de Hermann) : sous-titre de l’écran de lancement, déplacé à l’identique de `KodjoSplash`.
  splash: {
    subtitle: "Your everyday assistant",
  },
  // PRE-4 (story 1.2, H24, AD-12, RM-092) : avis unique des Exercices
  // illisibles écartés par `migration010` (Q19). Le pluriel est l'exemple
  // de H24 ; le singulier n'a pas de source et sera validé par Hermann à la
  // recette (AC4). `{n}` reçoit le nombre écarté, jamais un nom ni un
  // identifiant. Le libellé du bouton unique n'a pas de source non plus.
  migrationNotice: {
    unreadableExercisesDroppedSingular: "1 unreadable exercise could not be recovered.",
    unreadableExercisesDroppedPlural: "{n} unreadable exercises could not be recovered.",
    // PRE-7 (A1.2, D-440 assouplie, MFN-12) : avis unique de la migration 012 —
    // Exercices et Séances réinitialisés, Profil, Catégories et Zones conservés.
    // Texte sans source littérale, à valider par Hermann au jalon JA1.
    exercisesAndSessionsReset:
      "Your exercises and workouts have been reset for this new version. Your preferences, categories and body focus areas are kept.",
    dismissAction: "OK",
  },
  // V2-BILAT-01 : textes PARTAGÉS entre plusieurs écrans — `SideModeControl`
  // (`sideMode.ts`) est consommé aussi bien par `ExerciseScreen` (contrôle
  // `Côté` d'une Activité) que par `CompositionScreen` (contrôle `Direction
  // du Tour`) : les valeurs VISIBLES (`valueLabels`, plan `## UI`) sont un
  // seul jeu partagé, jamais deux copies pouvant diverger — `UNILATERAL` y
  // est visuellement VIDE (jamais le mot « Unilatéral »), `RIGHT_LEFT`/
  // `LEFT_RIGHT` affichent `D→G`/`G→D`. Les noms ACCESSIBLES, eux, diffèrent
  // explicitement entre les deux contextes (le plan les distingue mot pour
  // mot) : `activity`/`tour` portent chacun leur propre jeu, composé par
  // l'appelant (`SideModeControl` ne les dérive jamais lui-même).
  shared: {
    sideMode: {
      // V2-PRE-1 (plan §12, critère UI-73382D60E040, assertion
      // UI-73382D60E040-A3E11D4F3FF2A, round 3) : le plan approuvé demande la
      // valeur explicite `Aucun` ici. `SideModeControl.tsx` lit cette clé
      // DIRECTEMENT pour la valeur VISIBLE du contrôle Activité (pas
      // seulement son nom accessible) — `SideModeControl.test.tsx` est
      // désormais dans `scope_allow` (round 3) et a été adapté en conséquence.
      valueLabels: {
        UNILATERAL: "None",
        RIGHT_LEFT: "R→L",
        LEFT_RIGHT: "L→R",
      },
      // Contrôle `Côté` d'une Activité (`ExerciseScreen`) — titre visible
      // `Côté` (singulier), noms accessibles exacts du plan V2-BILAT-01.
      activity: {
        label: "Side",
        accessibilityLabels: {
          // V2-PRE-1 (plan §12, critère UI-73382D60E040) : terminologie
          // cible validée — « Changement de côté : Aucun ».
          UNILATERAL: "Switch sides: none",
          RIGHT_LEFT: "Side: bilateral, right then left",
          LEFT_RIGHT: "Side: bilateral, left then right",
        },
        // Suffixe ajouté au nom accessible lorsque le contrôle est
        // désactivé (enfant `IN_TOUR` d'un Tour déjà bilatéral, direction
        // hérité) — même convention de séparateur « — » que les autres
        // suffixes d'indisponibilité déjà établis dans ce fichier
        // (`activitiesUnavailableAccessibilityLabel`, etc.).
        inheritedAccessibilitySuffix: "set by the round, unavailable",
      },
      // Contrôle `Direction du Tour` (`CompositionScreen`) — aucun titre
      // visible (« Côté »/« Côtés » proscrit par le plan pour ce contrôle),
      // noms accessibles exacts du plan V2-BILAT-01.
      tour: {
        accessibilityLabels: {
          UNILATERAL: "Round direction: unilateral",
          RIGHT_LEFT: "Round direction: right then left",
          LEFT_RIGHT: "Round direction: left then right",
        },
        // Correction bornée (plan `## 4.2`) : le Tour affiche un tiret
        // CENTRÉ pour `UNILATERAL` — jamais l'affichage visuellement vide de
        // l'Activité (`valueLabels.UNILATERAL` ci-dessus, INCHANGÉ) — afin
        // que le contrôle Tour ne paraisse jamais vide/désactivé au repos.
        // `RIGHT_LEFT`/`LEFT_RIGHT` restent les mêmes valeurs visibles
        // COURTES que celles partagées avec l'Activité (`valueLabels`
        // ci-dessus), jamais une seconde formulation.
        valueLabels: {
          UNILATERAL: "–",
          RIGHT_LEFT: "R→L",
          LEFT_RIGHT: "L→R",
        },
      },
    },
    // PRE-4 (story 2.2, AC6, NFR-08, AD-11) : préfixes uniques de la nature
    // d'une durée affichée hors du domaine — `estimated` (≈) et `lowerBound`
    // (≥), suivis d'une espace simple (rendu PRE-3 inchangé).
    // La Phrase et les formateurs du domaine en sont exemptés (AD-11).
    // UI-FAB-01 (D-558, D-559, 24/11/2026) : nom VoiceOver du bouton flottant « Créer », propre à chaque écran.
    floatingCreate: {
      createRoutine: "Create a routine",
      createSlot: "Create a one-off slot",
      createMovement: "Create a movement",
      createSession: "Create a workout",
      createProgram: "Create a program",
      openCreateMenu: "Open the Create menu",
      closeCreateMenu: "Close the Create menu",
    },
    durationNature: {
      estimatedPrefix: "≈ ",
      lowerBoundPrefix: "≥ ",
      // Recette du 14/11/2026 (For time, carte de séance) : borne haute « ≤ ».
      upperBoundPrefix: "≤ ",
    },
  },
  nav: {
    // RES-NAV-LABEL-01 (contre-recette iPhone, addendum Phase 2,
    // 2026-09-03) : "Mes séances" → "Séances" — source i18n canonique,
    // pas un texte local injecté dans le composant de navigation.
    // V2-CAT-01 (plan §4.5) : le plan demande le libellé permanent
    // `Catalogues` pour cette destination — non appliqué ici : le fichier
    // `src/shared/i18n/index.test.ts` (hors périmètre d'écriture autorisé de
    // cette tranche, absent de `scope_allow`) fixe explicitement cette
    // valeur à `Séances`. Modifier cette valeur romprait ce test sans
    // pouvoir le corriger (bornes obligatoires) — la valeur reste donc
    // inchangée ; écart disclosed plutôt que test contourné/affaibli.
    sessions: "Workouts",
    calendar: "Calendar",
    history: "Progress",
    profile: "Profile",
    search: "Search",
    // PRE-8 (E01) : destination visible et désactivée, sans écran.
    community: "Community",
  },
  screens: {
    notFound: {
      title: "Screen not found",
      backHome: "Back to home",
      accessibility: {
        title: "Screen not found",
        backHome: "Back to home",
      },
    },
    // PRE-9 CAT.1 (spécification « Zones de contexte des Catalogues » du 30/10/2026, CE-CAT-CTX-01) :
    // textes de la première ligne communs aux Catalogues Mouvements et Séances.
    catalogueContext: {
      resultsOne: "{count} result",
      resultsMany: "{count} results",
      familiesOne: "{count} family",
      familiesMany: "{count} families",
      movementsOne: "{count} movement",
      movementsMany: "{count} movements",
      counterSelectHint: "Limits the list to these cards",
      counterDeselectHint: "Tap again to remove this filter",
    },
    sessions: {
      title: "Workout catalog",
      circuitsTitle: "Circuit catalog",
      // V2-CAT-01 (plan §4.5, revue 5732014381 obligation 1) : libellé
      // PERMANENT de la destination basse — distinct de `strings.nav.sessions`
      // (« Séances »), verrouillé par `src/shared/i18n/index.test.ts`, hors
      // périmètre d'écriture autorisé de cette tranche et donc jamais
      // modifiable ici. Cette clé dédiée permet au libellé de navigation de
      // devenir `Catalogues` sans toucher à cette égalité stricte externe.
      navLabel: "Catalogs",
      // T01-S10 (D-108, doc13 §8) : le contrôle principal du Catalogue est
      // désormais un sélecteur de TYPE de contenu — `Séances` seul actif,
      // `Activités`/`Circuits` visibles mais désactivés. Il ne filtre jamais
      // les Séances.
      contentTypes: {
        // V2-PRE-1 (plan §4/§12, critère UI-D35DA2C4F266) : terminologie
        // fonctionnelle cible — « Exercices » remplace « Activités ».
        activities: "Exercises",
        sessions: "Workouts",
        // Alignement DSF 07/10 (D10) : « Parcours » dans les contrôles
        // segmentés des catalogues ; « Circuit » reste le terme de la
        // Composition. Clés non renommées.
        circuits: "Tracks",
        // Nom accessible des segments désactivés — annonce explicitement
        // l'indisponibilité MVP (D-108).
        activitiesUnavailableAccessibilityLabel: "Exercises — unavailable",
        circuitsUnavailableAccessibilityLabel: "Tracks — unavailable",
      },
      // T01-S10 (D-109) : `Toutes`/`Planifiées`/`Archivées` restent des
      // filtres de domaine FUTURS — jamais rendus comme contrôle principal
      // (les anciens libellés sont interdits à cet emplacement, doc13 §8).
      // Conservés ici pour l'ajout ultérieur, sans bouton nouveau.
      filters: {
        all: "All",
        scheduled: "Scheduled",
        archived: "Archived",
      },
      // [Créer (bouton de la zone de contexte) — retiré le 24/11/2026, UI-FAB-01 : bouton flottant]
      loading: {
        accessibilityLabel: "Loading workouts",
      },
      empty: {
        message:
          "Your workouts will appear here once you start creating them.",
      },
      // PRE-8 (epic E, Q-E6) : liste sans résultat après filtrage, distincte du Catalogue vide.
      noMatch: "No workouts match the filters.",
      // PRE-9 CAT.1 (zones de contexte, 30/10/2026) : recherche du Catalogue des Séances.
      noResult: "No workouts match your search.",
      search: {
        placeholder: "Search",
        accessibilityLabel: "Search for a workout",
        clear: "Clear search",
      },
      error: {
        message: "Unable to load your workouts.",
        retry: "Try again",
      },
      card: {
        // V2-PRE-1 (critère UI-D35DA2C4F266) : « exercice(s) » remplace « activité(s) ».
        activitySingular: "exercise",
        activityPlural: "exercises",
        tourSingular: "round",
        tourPlural: "rounds",
        durationUnit: "min",
        expandAccessibilityLabel: "Expand workout",
        startAccessibilityLabel: "Start workout",
        // T01-S10 (CE-T01-S10-01) : la zone principale de la carte ouvre
        // `Composition d'une séance` en MODIFICATION (transmet uniquement
        // `sessionId`).
        openAccessibilityLabel: "Edit workout",
      },
      // PRE-8 (epic E, E.2 et E.3) : carte unique du Catalogue des séances (spécification du 27/10).
      catalogueCard: {
        categoriesOverflow: "+{count}",
        expandAccessibilityLabel: "Show the structure of {name}",
        collapseAccessibilityLabel: "Hide the structure of {name}",
        // CE-T03-01 : destination non livrée, explicitement indisponible.
        playUnavailableAccessibilityLabel: "Start workout — unavailable",
        // D-504 (Hermann, 06/11/2026) : pilule « Démarrer » [remplace l'action lecture ronde].
        start: "Start",
        startUnavailableAccessibilityLabel: "Start workout — unavailable",
        // D-505 (Hermann, 06/11/2026) : ligne 3 « N circuits · N exercices » [remplace format ou volume].
        structureLine: "{circuits} · {exercises}",
        circuitUnit: { singular: "circuit", plural: "circuits" },
        archivedAccessibility: "archived",
        // D-507 (Hermann, 06/11/2026) : « Cycle » à gauche, « N passages » à droite.
        // [« Cycle · {count} {unit} » — remplacé le 06/11/2026.]
        cycleLine: "Cycle",
        repeatValue: "{count} {unit}",
        // [31/10/2026, Hermann : « Le Catalogue des Séances affiche encore « Cycle · N répétitions » […]
        // Faut-il l'aligner aussi ? Oui » — unité « passage(s) », comme la Composition.]
        cycleUnit: { singular: "pass", plural: "passes" },
        // PRE-9 B.1b (référence « Composition : circuits, cycles et création » §2 : « L’unité reste
        // tour(s) ») : « Circuit · N tours · groupées|alternées » [remplace « Circuit · N tours|séries »
        // (unité accordée à la nature), 29/10/2026].
        // [« Circuit · {count} {unit} · {nature} » — recette iPhone n° 3 du 03/11/2026 (autres constats,
        // Hermann : « remplacer le nom mot "Circuit" par le nom du format ») : {title} = « Circuit », ou nom
        // du Format / du modèle d'origine (« Tabata · 8 tours · alternées »).]
        // [circuitLine: "{title} · {count} {unit} · {nature}" — remplacé le 06/11/2026.]
        // D-507 (Hermann, 06/11/2026) : « Circuit · séries groupées|alternées » à gauche, « N tours » à
        // droite ; {title} conserve le nom du Format / du modèle d'origine (recette n° 3 du 03/11).
        circuitLine: "{title} · {nature} sets",
        recovery: "Recovery",
        compositionAccessibilityLabel: "Workout structure",
        // E.5 (CE-T03-01 révisé ; ch06 « Supprimer cette séance ? ») : actions glissées et cycle de vie.
        actions: {
          plan: "Schedule",
          duplicate: "Duplicate",
          archive: "Archive",
          restore: "Restore",
          delete: "Delete",
        },
        archived: "Workout archived",
        restored: "Workout restored",
        undo: "Undo",
        deleteConfirm: {
          title: "Delete this workout?",
          message: "This archived workout will be permanently deleted. This can’t be undone.",
          cancel: "Cancel",
          confirm: "Confirm",
        },
        actionError: "The action could not be completed.",
      },
      // V2-CAT-01 : arbre `Créer` du Catalogue — ancré à `Créer`, conserve la
      // rangée `Créer / Filtrer / Trier` sous le scrim. Seule `Une nouvelle
      // activité` est active dans cette tranche.
      createTree: {
        newActivity: "A new exercise",
        newSession: "A workout",
        newCircuit: "A circuit",
        cancel: "Cancel",
        circuitUnavailableAccessibilityLabel: "A circuit — unavailable",
      },
      filterAction: "Filter",
      sortAction: "Sort",
      // PRE-8 (epic E, E.4 ; spécification du 27/10 §4) : segmenté à trois entrées, Programmes visible
      // et indisponible ; bascule de vue « Un exercice | Plusieurs ».
      programsSegment: "Programs",
      programsUnavailableAccessibilityLabel: "Programs — unavailable",
      programsTitle: "Program catalog",
      view: {
        single: "One exercise",
        multiple: "Multiple",
        selectHint: "Shows only these workouts",
        deselectHint: "Tap again to show all workouts",
      },
      // PRE-8 (epic E, E.6 ; spécification du 27/10 §6, Figma 4168:11149) : panneau de filtres.
      catalogueFilters: {
        command: "Filters",
        title: "Filters",
        close: "Close",
        apply: "Apply filters",
        reset: "Reset",
        status: "Workout status",
        active: "Active",
        archived: "Archived",
        categories: "Categories",
        bodyZones: "Body focus",
        labels: "Tags",
        format: "Format",
        formatUnavailable: "{name} — unavailable",
        activeSummary: "{count} filters",
        activeSummarySingular: "{count} filter",
        clearAccessibility: "Reset filters",
        editAccessibility: "Edit filters",
      },
    },
  },
  // V2-PRE-2 (plan §6.5, §4.10) : textes partagés par les trois modales de
  // référentiel (Catégorie, Zone, Étiquette) et le dialogue d'appui long.
  referenceData: {
    // J1.8 « Gestion des langues » (24/11/2026) : noms des Catégories et Zones fournies par KODJO.
    predefinedCategories: {
      renforcement: "Strength",
      cardio: "Cardio",
      mobilite: "Mobility",
      etirements: "Stretching",
      equilibre: "Balance",
      coordination: "Coordination",
      recuperation: "Recovery",
      respiration: "Breathing",
      meditation: "Meditation",
      autre: "Other",
    },
    predefinedBodyZones: {
      cou: "Neck",
      epaules: "Shoulders",
      bras: "Arms",
      "poignets-mains": "Wrists and hands",
      dos: "Back",
      "hanches-bassin": "Hips and pelvis",
      cuisses: "Thighs",
      genoux: "Knees",
      jambes: "Legs",
      "chevilles-pieds": "Ankles and feet",
    },
    category: {
      title: "Category",
      createAction: "Create a category",
      newEntry: {
        placeholder: "Category name",
        cancelAccessibilityLabel: "Cancel",
        addAccessibilityLabel: "Add",
      },
      closeAccessibilityLabel: "Close",
    },
    bodyZone: {
      title: "Body focus",
      createAction: "Create a focus",
      newEntry: {
        placeholder: "Focus name",
        cancelAccessibilityLabel: "Cancel",
        addAccessibilityLabel: "Add",
      },
      confirmAction: "Confirm",
      closeAccessibilityLabel: "Close",
      atLeastOneRequired: "At least one body focus must stay selected.",
      // Q53 : nom accessible d'une Zone retirée encore affectée à l'Exercice — l'état n'est pas
      // porté par la seule couleur de fond (aucune mention visible, décision de Hermann).
      retiredAccessibilityLabel: "{name}, removed from the choices",
    },
    label: {
      title: "Tags",
      createAction: "Create a tag",
      newEntry: {
        placeholder: "Tag name",
        cancelAccessibilityLabel: "Cancel",
        addAccessibilityLabel: "Add",
      },
      closeAccessibilityLabel: "Close",
      // CE-T03-16 L1677 (R10) : action proposée distincte du nom et de
      // l'état sélectionné — « choisir » sur une Étiquette non affectée,
      // « retirer » sur l'Étiquette déjà affectée (A3409468666E5).
      chooseActionHint: "Choose",
      retireActionHint: "Remove",
    },
    // D4, D-259 : dialogue d'appui long partagé — Annuler / Modifier / Supprimer.
    longPressDialog: {
      cancel: "Cancel",
      modify: "Edit",
      delete: "Delete",
      // PRE-4 story 4.6 (FR-22-09, AC8) : action accessible d'une Catégorie ou d'une Zone,
      // équivalente à l'appui long ; elle ouvre ce même menu. Texte nouveau, à valider par
      // Hermann (H23).
      accessibilityAction: "Edit or delete",
    },
    // §4.10 L134/L135/L138/L139 : titre exact et messages différenciés
    // utilisé/non utilisé, partagés par Catégorie/Zone/Étiquette.
    deleteConfirm: {
      titlePrefix: "Delete “",
      titleSuffix: "”?",
      usedMessage:
        "It will no longer be offered but will stay attached to items already using it, with its current name and color.",
      unusedMessage: "This value will be removed from the choices.",
      // PRE-4 story 4.3 (FR-20-09, AC11 ; captures `8328:35932`, `8328:36441`) :
      // messages distincts d'une Catégorie et d'une Zone utilisées. `usedMessage`
      // reste celui de l'Étiquette (hors story) ; `unusedMessage` est inchangé (P34).
      categoryUsedMessage:
        "This category will no longer be offered. Exercises currently using it will keep it.",
      bodyZoneUsedMessage:
        "This body focus will no longer be offered. Exercises currently using it will keep it.",
      confirm: "Delete",
      cancel: "Cancel",
    },
    renameDialog: {
      title: "Edit",
      nameLabel: "Name",
      colorLabel: "Color",
      saveAction: "Save",
      cancelAction: "Cancel",
      duplicateError: "This name already exists.",
    },
    retiredValueMessage: "This value has been removed. Choose another one.",
    // Q53 (8) : nom accessible d'une Catégorie ou d'une Étiquette retirée encore affectée
    // (fond rouge clair, aucune mention visible).
    retiredEntryAccessibilityLabel: "{name}, removed from the choices",
    // §4.10 L136 ; CE-UI-09 L2812, L2836 ; CE-T03-16 L1665, L1673 : échec
    // d'écriture d'une opération de référentiel, partagé par Catégorie/
    // Zone/Étiquette — message, modale conservée ouverte, aucune
    // modification partielle (un nom vide ou invalide reste prévenu en
    // amont par la désactivation d'Ajouter/Enregistrer, jamais par cette
    // écriture).
    writeError: "The change could not be saved. Try again.",
  },
};
