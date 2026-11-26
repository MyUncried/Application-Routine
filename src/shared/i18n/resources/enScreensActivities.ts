/**
 * J1 « Gestion des langues » (23/11/2026) : traduction anglaise de `screens.activities`, `screens.formatModel` et
 * `screens.sessionModels` de `fr.ts` (selon le glossaire validé, `docs/preparation/langues/GLOSSAIRE-EN-2026-11-23.md`).
 */
import type { FrResource } from "./en";

export const enScreensActivities: Pick<FrResource["screens"], "activities" | "formatModel" | "sessionModels"> = {
  activities: {
    // V2-PRE-1 (critère UI-D35DA2C4F266) : « Exercice(s) » remplace
    // « Activité(s) » dans les libellés fonctionnels français — les
    // identifiants techniques (clés, `ActivityDefinition`) restent inchangés.
    title: "Exercise catalog",
    empty: {
      message:
        "Your exercises will appear here once you’ve created one.",
    },
    error: {
      message: "Unable to load your exercises.",
      retry: "Try again",
    },
    card: {
      deployAccessibilityLabel: "Expand exercise",
      playAccessibilityLabel: "Play",
      openAccessibilityLabel: "Edit exercise",
      // PRE-7 (R-6, D-445 C06, MFN-10 l.426, relevé du 25/10 §6 « Squat assisté - N1 ») : suffixe
      // de niveau des cartes sans pastille, dérivé, jamais stocké dans le nom.
      levelSuffix: "{name} - L{rank}",
    },
    editor: {
      // Complément d'alignement du 07/10 (ajout D) : titre d'écran de
      // création « Créer un exercice » ; « Modifier un exercice » inchangé.
      titleAdd: "Create an exercise",
      titleEdit: "Edit an exercise",
      backAccessibilityLabel: "Back",
      name: "Exercise name",
      finishAction: "Finish",
      saveError: "The exercise couldn’t be saved. Try again.",
      // PRE-7 story A2.2 (D-438, CE-T03-04 §3, relevé Figma MFN du 23/10, `9952:44374`) :
      // crayon de la création sur geste repris. PRE-7 story R-4 (v7 §1) : « geste » devient
      // « mouvement » dans tous les textes d’interface (identifiants inchangés, D-201) ; même
      // crayon sur une occurrence de Séance (D-445 C04).
      editMovement: "Edit movement",
      // PRE-7 story R-9 (D-448 point 10) : indication VoiceOver du crayon actif en Séance (aucun
      // texte documenté).
      editMovementActiveHint: "Tap to stop editing the movement",
      // PRE-7 story R-5 (D-445 C01, C02, v7 §6 R03-R04 ; maquettes `9882:19049`, `10175:20349`,
      // `10140:20180`, `10187:20340`, carte `10199:22268`) : panneau sous le nom, pendant la saisie
      // (remplace la feuille à trois choix d’A2.3). Textes relevés : message d’unicité, actions de
      // la carte, invite grise. « Plus facile / Plus difficile » : libellés de C02, MFN-07 l.371 et du
      // popover `10152:20369` (la maquette `10140:20180` porte « Moins difficile » ; option
      // conservatrice, à valider par Hermann). `nameTakenEdit` (correction, variante, Séance : aucune
      // carte à reprendre) et `backToResults` (nom accessible du chevron) : sans texte relevé (NON
      // VÉRIFIABLE).
      movementSuggestion: {
        nameTaken: "This name is already in use. Use this movement or choose another name.",
        nameTakenEdit: "This name is already in use. Choose another name.",
        // Recette iPhone du 29/10/2026 (Hermann) : le nom est pris par un Mouvement ARCHIVÉ (jamais
        // proposé en carte, B.8 Q6) — « archivé » en gras (`{archived}` ← `archivedWord`).
        nameTakenArchived: "An {archived} movement already has this name.",
        archivedWord: "archived",
        useMovement: "Use this movement",
        createVariant: "Create a variation",
        // PRE-9 CAT.2 (CE-MVT-RESULT-01, `10199:22268`) : « Ajouter un niveau » affiché sur deux
        // lignes dans la carte Résultat ; le nom accessible reste `movement.suggestion.createVariant`.
        addLevelTwoLines: "Add\na level",
        easier: "Easier",
        harder: "Harder",
        backToResults: "Back to results",
        level: "Level {rank}",
        completeNameHint: "(complete the name)",
      },
      // PRE-7 story A2.3 (MFN-04, MFN-06, D-439 ; écran `9959:19623`) : recherche spécialisée des
      // gestes, locaux compris. Titre, champ et note de `9959:19623`. `open` : accès depuis le
      // formulaire, sans frame (NON VÉRIFIABLE), libellé repris du champ de recherche.
      // PRE-7 story R-5 (v7 §6 R03) : « Voir tous les mouvements » (texte de la v7) ; l’annonce
      // d’absence de résultat n’a pas de texte relevé (NON VÉRIFIABLE).
      movementSearch: {
        title: "Choose a movement",
        placeholder: "Search for a movement",
        localNote: "Movements created in a workout also appear.",
        noResult: "No movement matches this search.",
        showAll: "See all movements",
        exerciseCountSingular: "{n} exercise",
        exerciseCountPlural: "{n} exercises",
        open: "Search for a movement",
        closeAccessibilityLabel: "Back",
      },
      // PRE-7 story A3.1 (D-439, MFN-05, MFN-07 ; CE-T03-04 §9 ; Figma `9925:41506` / `9925:41515`,
      // popover `9577:19843`) : pastille de la rangée de classification et popover de niveau. Vide :
      // « Niveau » (sans groupe ou singleton, rang masqué, jamais un faux « Niveau 1 ») ; renseignée :
      // « Niveau X », rang calculé ; le total figure dans le choix (« Niveau r sur t · nom »). Le nom
      // accessible vide suit `category.unsetAccessibilityLabel`. L’en-tête « 2 sur 3 » du popover
      // Figma est un ancien exemple, non repris.
      levelMenu: {
        unsetLabel: "Level",
        unsetAccessibilityLabel: "Level — not set",
        rank: "Level {rank}",
        // PRE-7 story R-9 (D-448 point 9) : intitulé du sous-menu des niveaux au Catalogue en
        // modification (choix par Exercice) ; « Changer de niveau » reste en Séance et en reprise.
        navigateTo: "Go to",
        changeLevel: "Change level",
        addLevel: "Add a level",
        // PRE-7 (R-6, MFN-07 l.371, déploiement `10152:20369`) : sens du niveau ajouté.
        addEasier: "Easier",
        addHarder: "Harder",
        levelOption: "Level {rank} of {total} · {name}",
        // Recette A/B B.10 (q6-2) : un niveau archivé est signalé dans le menu.
        levelOptionArchived: "Level {rank} of {total} · {name} (archived)",
        // Recette A/B B.10 (b2-8) : sous-menu des niveaux de la fiche Mouvement (Catalogue des Mouvements).
        openOtherLevel: "Open another level",
        // PRE-7 story A3.2 : accès à l’écran des niveaux (aucun libellé documenté ; verbe de ch03
        // l.154 « glisser réordonne les niveaux »). R-9 (D-448 point 9) : troisième entrée de la
        // racine du menu, retirée du sous-menu des niveaux.
        reorderLevels: "Reorder levels",
      },
      // PRE-7 story A3.2 (D-439, MFN-05, MFN/AC07) : écran des niveaux d’un groupe, sans frame
      // Figma (NON VÉRIFIABLE). Aucun texte documenté : titre « Niveaux » ; lignes calquées sur
      // celles des phases (« Déplacer la phase {n} », « Monter la phase {n} ») ; nombre
      // d’Exercices repris de `movementSearch` ; erreurs calquées sur `error` (Catalogue) et
      // `saveError` des valeurs. Textes à valider par Hermann.
      levelOrder: {
        title: "Levels",
        closeAccessibilityLabel: "Back",
        row: "Level {n}",
        handle: "Move level {n}",
        moveUp: "Move level {n} up",
        moveDown: "Move level {n} down",
        loadError: "Unable to load levels.",
        retry: "Try again",
        saveError: "The change couldn’t be saved. Try again.",
      },
      // PRE-7 story R-4 (D-445 C03, v7 §3) : dialogue unique de sauvegarde du mouvement. Textes
      // du relevé utilisateur (`docs/figma-niveaux-2026-10-25/releve-utilisateur.md` §4) et des
      // frames `9952:44349`, `10253:20414`, `10257:20651` ; nombres calculés. « Aucun autre
      // exercice… » : portée zéro, jamais masquée (C03), texte composé sur le même modèle.
      movementSave: {
        choiceTitle: "You want to:",
        confirmTitle: "You edited this movement",
        otherPlural: "{n} other exercises use this movement.",
        otherSingular: "{n} other exercise uses this movement.",
        noOther: "No other exercise uses this movement.",
        appliesToAll: "The change will apply to all.",
        update: "Update this movement",
        updateDetail: "For all exercises that use it",
        newMovement: "Create a new movement",
        newMovementDetail: "Only for this exercise",
        cancel: "Cancel",
        confirm: "Confirm",
      },
      // PRE-7 story A2.2 (MFN-08 « Étape d’écran après choix de correction structurelle »,
      // CE-T03-04 §11 et §14) : étape distincte, sans frame Figma (NON VÉRIFIABLE). Libellés
      // tirés du vocabulaire des documents (« durées manquantes », complétion « passée »),
      // soumis à Hermann ; « Terminer », « Annuler » existants ; un frère passé affiche le texte
      // existant `executionParameters.card.incomplete` (« Paramètres à compléter. »).
      siblingCompletion: {
        title: "Missing durations",
        skip: "Skip",
        finish: "Finish",
        cancel: "Cancel",
        unset: "—",
        durationAccessibilityLabel: "Duration of {label}",
      },
      media: {
        label: "Media",
        expandAccessibilityLabel: "Expand Media section",
        collapseAccessibilityLabel: "Collapse Media section",
        addMedia: "Add media",
        addMediaUnavailableAccessibilityLabel: "Add media — unavailable",
        placeholder: "No media for this exercise.",
      },
      // V2-PRE-1 (plan §3.1, D-211 ; `08 – Conception fonctionnelle
      // détaillée.md` l.978 ; `13 – Contrats d’écran.md` §4.10, Figma
      // 4861:6259) : Catégorie exactement une, obligatoire — bouton/pilule
      // ouvrant la modale de sélection, icône dans l'état non renseigné,
      // appui court pour sélectionner (contrat de modale déjà validé,
      // réutilisé sans nouvelle conception).
      category: {
        label: "Category",
        unsetAccessibilityLabel: "Category — not set",
        modalTitle: "Category",
        newCategory: {
          placeholder: "Category name",
          cancelAccessibilityLabel: "Cancel",
          addAccessibilityLabel: "Add",
        },
        createAction: "Create a category",
        closeAccessibilityLabel: "Close",
      },
    },
    selection: {
      title: "Select an exercise",
      backAccessibilityLabel: "Back",
      empty: {
        message: "No exercises available yet.",
      },
      addAction: "Add",
      cancelAccessibilityLabel: "Cancel",
      // Contre-recette PRE-9 n° 1 (Hermann, 30/10/2026) : Mouvement déjà présent dans la Séance,
      // marqué par un coin replié (contre-recette n° 2) ; annoncé seulement à VoiceOver.
      inSessionAccessibility: "in the workout",
      // PRE-8 (epic E, E.8-a, option 1) : accès transitoire à l'éditeur des anciennes définitions.
      editAccessibilityLabel: "Edit exercise {name}",
    },
    // PRE-9 B.2 (COMP §5, Figma `10705:20223`) : menu Créer de la Composition — cinq actions puis
    // Annuler, dans l'ordre observé. [Anciens libellés « Un nouvel exercice » / « Un exercice
    // existant » : remplacés le 29/10/2026 par ceux de COMP §5.]
    // [Remplacé le 01/11/2026 (ordre de Hermann, ch13 CE-T03-08 « Menu Créer — état cible ») :
    // quatre options, plus de rangée Annuler — `cancel` nomme désormais le « + » transformé ;
    // « Créer un nouveau mouvement » devient « Créer un exercice » ; `existingActivity` ne sert plus
    // qu'au titre de l'écran de sélection des Mouvements, qui n'est plus atteint depuis ce menu.]
    // [Recette iPhone du 01/11/2026 (m11-menu, Hermann) : « Utiliser un mouvement existant » est de
    // nouveau une option du menu (2e, après « Créer un exercice ») : cinq options.]
    // [Référence Formats du 02/11/2026 (§7, CE-T03-08, Figma `10705:20223`) : cinq options — « Créer un
    // exercice », « Utiliser des mouvements existants », « Utiliser un format d'entraînement », « Ajouter
    // un circuit », « Ajouter un cycle » ; « Utiliser une séance existante » n'est plus proposée ici.]
    addToSession: {
      newActivity: "Create an exercise",
      existingActivity: "Use existing movements",
      existingSession: "Use an existing workout",
      useFormat: "Use a workout format",
      // Complément du 5 novembre 2026 (§3) : « Créer un circuit », « Créer un cycle ». [« Ajouter un … » — remplacé.]
      addCircuit: "Create a circuit",
      addCycle: "Create a cycle",
      // UI-FAB-01 (D-558) : quatrième option du menu Créer, ouvert depuis le bouton flottant.
      addStopPoint: "Add a hold",
      // [Annuler du menu Créer — remplacé le 24/11/2026, UI-FAB-01]
      // Action indisponible : même traitement que « Un circuit » du menu du Catalogue (atténuée,
      // nom suivi de « indisponible »). Formulation à valider.
      unavailableAccessibilityLabel: "{action} — unavailable",
    },
  },
  // PRE-9 C.3 (CE-FMT-02) : paramètres du modèle et récapitulatif.
  // PRE-9 C.3 (référence Formats du 02/11/2026 §7, §9 à §12, §15 ; CE-FMT-02) : questionnaires et
  // récapitulatifs. Libellés et accroches repris des maquettes du 02/11 (`8624:29980` et suivantes) ;
  // aucune valeur de maquette n'en est un défaut.
  formatModel: {
    // Recette iPhone n° 3 du 02/11/2026 (f3-questionnaire, Hermann : « Le titre de la modale doit être
    // "Configurer un X" et non plus "Composer une séance X" »). [C.3 : préfixe « Composer une séance » — remplacé.]
    titles: {
      TABATA: "Set up Tabata",
      INTERVALS_30_30: "Set up 30/30",
      EMOM: "Set up EMOM",
      AMRAP: "Set up AMRAP",
      FOR_TIME: "Set up For time",
      DEATH_BY: "Set up Death by",
      STRENGTH: "Set up Strength",
      SUPERSET: "Set up Superset",
      PROGRESSION: "Set up Progression",
      UNTIL_FAILURE: "Set up To failure",
    },
    closeAccessibilityLabel: "Close",
    backAccessibilityLabel: "Back to questionnaire",
    namePlaceholder: "Workout name",
    movements: "Movements",
    add: "+ Add",
    emomOverflow: "Durations reach or exceed the {interval} interval: no time is left for the remaining work or for rest.",
    // Complément du 5 novembre 2026 (§13) : avertissement non bloquant du Death by.
    deathByFirstRankWarning: "The first interval can’t be held: the challenge will end before it starts.",
    addPicked: "Add",
    // Recette du 05/11/2026 au soir (p-coche, Hermann) : bouton du bas du mode catalogue « Ajouter X mouvements ».
    addPickedOne: "Add 1 movement",
    addPickedMany: "Add {count} movements",
    // Recette du 06/11/2026 (s-focus, Hermann : « Le bouton d'action du bas est "Fermer sans sélectionner" si aucun mouvement n'est
    // sélectionné, puis devien "Ajouter X mouvements" lorsque des mouvements sont sélectionnés »).
    closeWithoutSelecting: "Close without selecting",
    // p-coche / p-ajout : « le bouton +Ajouter est remplacé par « revenir aux paramètres » après qu'il ait été sélectionné ».
    backToParameters: "Settings",
    // Recette du 05/11/2026 (n-charge-colonne) : seul exercice restant en Répétitions (AMRAP, For time).
    lastRepetitionsLocked: "At least one exercise stays in reps: duration isn’t available for this one.",
    maxLocked: "Max isn’t available in a loop of several movements.",
    // Recette du 17/11/2026 : boucle d’un For time déjà sans exercice en répétitions (séance antérieure).
    loopWithoutRepetitions: "At least one loop exercise must be in reps: choose Reps.",
    collapsePiles: "Collapse stacks",
    expandPiles: "Expand stacks",
    openMovementSheet: "Movement card for {name}",
    change: "Change",
    searchPlaceholder: "Movement name",
    buyInSection: "Buy-in · once, at the start",
    loopSection: "Loop · in the remaining time",
    buyInPickerTitle: "Buy-in movement",
    // Recette du 04/11/2026 (For time : interrupteurs Buy-in et Buy-out au questionnaire).
    buyOutSection: "Buy-out · once, at the end",
    buyOutPickerTitle: "Buy-out movement",
    forTimeLoopSection: "Loop · every round",
    parameters: "Execution settings",
    totalDuration: "Total duration",
    execution: "Execution",
    executions: { SEQUENCE: "In sequence", ALTERNATED: "Alternating", EACH_INTERVAL: "In each interval" },
    timeline: "Timeline",
    // Recette du 16/11/2026 (constat h) : AMRAP répété, à côté de « Déroulé ».
    timelineRepeat: "({count} times)",
    recovery: "Recovery",
    untilFailure: "to failure",
    measured: "timed",
    noLimit: "No limit",
    untilCadence: "until tempo",
    atFailure: "to failure",
    // Recette iPhone du 16/11/2026 (constat d, Hermann : « Format A l'échec : écrire A l'échec sur deux lignes dans la colonne "Objectif" »).
    atFailureTwoLines: "To\nfailure",
    dash: "—",
    save: "Save to workout",
    // Mise à jour consolidée du 04/11/2026 (§6 sexies) : réédition depuis la Composition.
    saveChanges: "Save changes",
    variable: "variable",
    variableConfirmTitle: "Replace custom values?",
    variableConfirmMessage: "The exercises have different values. The new value will apply to all.",
    supersetLimitTitle: "Two exercises max",
    // Recette du 16/11/2026 (fmt-superset, Hermann : « + Ajouter doit se transformer en Modifier ») : Superset complet.
    supersetEdit: "Edit",
    // « Modifier » : le mode catalogue s'ouvre sur les deux mouvements choisis ; ce bouton applique la nouvelle sélection.
    applyPicked: "Confirm selection",
    supersetLimitMessage: "A Superset links two exercises. Remove one to choose another.",
    supersetLimitAcknowledge: "Got it",
    // D-572 (25/11/2026; Formats § 9.9): “+ Add” becomes “+ Edit” once a movement is chosen; five movements at most per format.
    editMovements: "+ Edit",
    formatLimitTitle: "Five movements max",
    formatLimitMessage: "A format holds five movements at most. Remove one to choose another.",
    noSearchResult: "No results",
    variableConfirmCancel: "Cancel",
    // Correction 2 de Hermann du 14/11/2026 (For time) : ligne d'un bloc buy-in ou buy-out, « Sans » ou un nombre de séries.
    blockNone: "None",
    blockSeriesOne: "{count} set",
    blockSeriesMany: "{count} sets",
    blockRemoveTitle: "Remove the {block}?",
    blockRemoveMessage: "The {block} exercises will be removed from the For time.",
    blockRemoveConfirm: "Remove",
    variableConfirmReplace: "Replace",
    // Recette n° 3 du 03/11/2026 : bouton du questionnaire AMRAP (passage au récapitulatif).
    validate: "Confirm settings",
    increase: "Increase",
    decrease: "Decrease",
    delete: "Delete",
    moveUp: "Move up",
    moveDown: "Move down",
    toComplete: "to complete",
    rows: {
      seriesCount: "Number of sets",
      workSeconds: "Work per set",
      pauseSeconds: "Rest",
      repetitions: "Reps per set",
      intervalSeconds: "Interval",
      // Complément du 5 novembre 2026 (§13) : « Objectif de départ » (Répétitions ou Durée). [« Nombre de répétitions » — remplacé.]
      startRepetitions: "Starting target",
      increment: "Increment per interval",
      durationSeconds: "Duration",
      blockDuration: "Block duration",
      blockCount: "Number of AMRAPs",
      restBetweenBlocksSeconds: "Rest between AMRAPs",
      loopRestSeconds: "Rest after each loop round",
      buyIn: "Buy-in",
      buyOut: "Buy-out",
      increasingVolume: "Increasing volume each round",
      // Mise à jour consolidée du 04/11/2026 §6 quater et §6 quater bis.
      withLoad: "With weight",
      roundCount: "Number of rounds",
      supersetRounds: "Circuit",
      timeCapSeconds: "Time cap",
      restBetweenRoundsSeconds: "Rest between rounds",
      // « Correction — For time : ajouter le mode d’exécution « En alternance » / « À la suite » » (FT-20 à FT-23) : For time « À la suite ».
      restBetweenSeriesSeconds: "Rest between sets",
      recoveryBetweenSeconds: "Recovery between movements",
      // Complément du 5 novembre 2026 (§11) : « Récupération après le tour ». [« … après la paire » — remplacé.]
      recoveryAfterPair: "Recovery after the round",
      // Complément du 5 novembre 2026 (§16) : ligne Charge d’un mouvement seul, sous Durée totale.
      load: "Weight",
      rest: "Rest",
      stopCondition: "Stop condition",
      targetPerSeries: "Target per set",
    },
    table: {
      movement: "Movement",
      repetitions: "Reps",
      perRound: "Per round",
      // Recette du 16/11/2026 (fmt-entree, Hermann : « Changer "Par tour" par "+/- / tour" (plus au dessus du moins) ») : titre de la
      // colonne de l'AMRAP, comme « ± / série ». « Par tour » reste le nom lu par VoiceOver.
      perRoundHead: "± / round",
      max: "To failure",
      round: "Round {n}",
      series: "S{n}",
      roundShort: "R{n}",
      // Règles de Hermann du 14/11/2026 (For time, FT-4, FT-12) : séries propres du buy-in et du buy-out, chacun son tableau.
      buyInTitle: "Buy-in",
      buyOutTitle: "Buy-out",
      // FT-3 : les séries se règlent dans la même modale que dans la Composition.
      openParameters: "Execution settings for {name}",
      buyInSuffix: " (buy-in)",
      // Mise à jour consolidée du 04/11/2026 (§4.2 à §4.5, §6 quater, §6 quater bis).
      buyOutSuffix: " (buy-out)",
      objective: "Target",
      objectiveKind: "target",
      load: "Weight",
      // Hermann, 04/11/2026 : « le titre de la colonne doit remplacer le signe + par le signe double + et − ».
      perSeries: "± / set",
      start: "Start",
      increment: "Increment",
      unit: "Unit",
      durationUnit: "duration",
      toFill: "to fill in",
      variable: "variable",
      // Complément du 5 novembre 2026 (§9, §15–§16) : charge décidée par mouvement, entre parenthèses ; Pause par mouvement.
      // [« sans charge à partir de la série {n} » (EMOM, 04/11) — retiré le 05/11/2026.]
      addLoad: "(+ kg)",
      removeLoad: "(− kg)",
      // Recette du 05/11/2026 (n-charge-switch, Hermann) : sous le nom du mouvement du tableau des séries — « (rép, +kg) », « (durée, −kg) ».
      // Spécification de Hermann du 08/11/2026 (A §4.4, B §4.4) : « (rép., +kg) », « (durée, −kg) » ; la parenthèse fermante est
      // rendue à part. [« rép », « +kg) », « −kg) » (recette du 05/11/2026, n-charge-switch) — remplacés le 08/11/2026.]
      repetitionsUnitShort: "reps",
      durationUnitShort: "duration",
      // Formats — saisie par la modale des paramètres d’exécution (décision de Hermann du 16/11/2026, CE-FMT-02 §8) : ligne sous le
      // nom — « Paramètres à compléter » (texte de la Composition, sans point), ou l’unité suivie de « · bilatéral ».
      parametersToComplete: "Settings to complete",
      bilateralSuffix: " · bilateral",
      addLoadShort: "+kg",
      removeLoadShort: "−kg",
      addLoadAccessibility: "add weight",
      removeLoadAccessibility: "remove weight",
      loadEmpty: "(—)",
      pause: "Rest",
      cellLabel: "{movement}, {column}, {kind}",
      repetitionsKind: "reps",
      loadKind: "weight",
    },
    // Décision de Hermann du 15/11/2026 (registre ch07, « For time — tableau unique, sans questionnaire ») : trois blocs, « − » / « + »
    // des colonnes, unité de chaque ligne au toucher (« Unité » en rouge à l'ajout).
    forTimeTable: {
      buyIn: "Buy-in",
      loop: "Loop",
      buyOut: "Buy-out",
      add: "+ Add",
      addSeries: "Add a set",
      removeSeries: "Remove a set",
      addRound: "Add a round",
      removeRound: "Remove a round",
      unitMissing: "Unit",
      unitRepetitions: "Reps",
      unitDuration: "Duration",
      unitAccessibility: "Unit for {name}",
      unitFirst: "{name}, choose the unit first",
      disabledValue: "–",
      photo: "Card for {name}",
    },
    roundUnit: { one: "round", many: "rounds" },
    repetitionsUnit: "reps",
    taglines: {
      TABATA: "Four minutes, eight 20-second sprints.\nBreath and power, all-out to the end.",
      INTERVALS_30_30: "30 seconds of effort, 30 seconds of recovery.\nOne to one, longer than Tabata.",
      EMOM: "One minute, one effort, rest is what’s left.\nEvery minute starts a round, no matter what.",
      AMRAP: "Twelve minutes, as many rounds as you can.\nNo set rest, rounds are counted.",
      FOR_TIME: "The work is fixed, time is what counts.\nKeep going with no set rest.",
      DEATH_BY: "One more rep every minute.\nKeep going while you finish within the minute.",
      STRENGTH: "Three sets of fifteen reps.\nThe most common starting point.",
      SUPERSET: "Two exercises back to back without rest,\nthen recovery after the pair.",
      PROGRESSION: "One value per set, to progress.\nThe app shows the instruction.",
      UNTIL_FAILURE: "Each set is taken to failure.\nThe drop from set to set is the measure.",
    },
  },
  // PRE-9 C.2 (CE-FMT-01, Figma `8598:29271`) : « Créer » — choix du modèle et du format.
  // PRE-9 C.2, référence Formats du 02/11/2026 (CE-FMT-01, Figma `9977:19613`) : fenêtre « Formats
  // d'entraînement » — dix cartes, sans carte Exercice, Séance, Libre ni Gainage · Mobilité.
  sessionModels: {
    // Complément du 5 novembre 2026 (§4) : modale de création « Créer un exercice », section « Formats d'entraînement ».
    creationTitle: "Create an exercise",
    freeExercise: { title: "Free exercise", subtitle: "one movement, to set up" },
    title: "Workout formats",
    closeAccessibilityLabel: "Close",
    cards: {
      TABATA: { title: "Tabata", subtitle: "anaerobic capacity" },
      INTERVALS_30_30: { title: "30/30", subtitle: "VO2 max and MAS" },
      EMOM: { title: "EMOM", subtitle: "hold a pace" },
      AMRAP: { title: "AMRAP", subtitle: "max volume" },
      FOR_TIME: { title: "For time", subtitle: "execution speed" },
      DEATH_BY: { title: "Death by", subtitle: "to failure" },
      STRENGTH: { title: "Strength", subtitle: "muscle strength" },
      SUPERSET: { title: "Superset", subtitle: "intensity without rest" },
      PROGRESSION: { title: "Progression", subtitle: "progressive loading" },
      UNTIL_FAILURE: { title: "To failure", subtitle: "max recruitment" },
    },
  },
};
