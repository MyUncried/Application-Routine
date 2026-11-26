/**
 * J1 « Gestion des langues » (23/11/2026) : traduction anglaise de `screens.composition` de `fr.ts` (selon le
 * glossaire validé, `docs/preparation/langues/GLOSSAIRE-EN-2026-11-23.md`).
 */
import type { FrResource } from "./en";

export const enScreensComposition: Pick<FrResource["screens"], "composition"> = {
  composition: {
    // Complément d'alignement du 07/10 (ajout D) : titre d'écran.
    title: "Build a workout",
    editTitle: "Edit workout",
    startAccessibilityLabel: "Start workout",
    backAccessibilityLabel: "Back",
    // PRE-6 (story 2.1, Figma `8328:28730`) : bouton fermer (X) de l’en-tête de la Composition.
    closeAccessibilityLabel: "Close",
    name: "Workout name",
    // PRE-9 B.9 (ch08 « Nom de séance — trois états », état 3) : invite dès le deuxième Exercice.
    namePrompt: "Enter a workout name",
    colorPicker: {
      label: "Color",
      paletteAccessibilityLabel: "Color palette",
      swatchAccessibilityLabel: "Color",
    },
    // V2-PRE-2 (plan §6.5, CE-T03-16) : la pastille dérivée de l'Étiquette
    // devient un déclencheur interactif de `LabelPickerModal` — libellé
    // d'accessibilité DISTINCT de `colorPicker.label` (retiré, jamais
    // réintroduit) pour que le test « never renders an autonomous color
    // picker » reste probant.
    label: {
      accessibilityLabel: "Workout tag",
      // PRE-6 (story 2.1, Figma `8328:28617`) : libellé de la puce sans Étiquette affectée.
      placeholder: "Tag",
    },
    countdown: {
      label: "Initial countdown",
    },
    // Fin de PRE-10 (spec `spec-guidage-reglages` §3.2) : guidage propre à la Séance, sinon le Profil.
    guidance: {
      label: "Guidance",
      followsProfile: "Same as Profile",
      own: "Workout-specific",
      accessibilityHint: "Opens the workout’s guidance settings",
      sheetTitle: "Workout guidance",
      intro: "These settings replace your Profile’s for this workout. During the workout, the Sounds and Voice guidance switches stay adjustable.",
      sounds: "Sounds",
      voice: "Voice guidance",
      objective: "Announce reps or duration",
      rowFollowsProfile: "Same as Profile",
      rowOwn: "Workout-specific",
      resetToProfile: "Revert to Profile",
      cancel: "Close without saving",
      validate: "Apply to workout",
    },
    finalPhase: {
      label: "End of workout",
    },
    // T01-S10 (CE-T01-S10-01/02/09) : états de la réhydratation d'une
    // Séance existante ouverte en MODIFICATION. Le Catalogue reste la
    // destination sûre en cas d'échec — aucune mutation de données.
    editStates: {
      loadingAccessibilityLabel: "Loading workout",
      errorMessage: "Unable to load this workout.",
      retry: "Try again",
      notFoundMessage: "This workout can’t be found.",
      archivedMessage: "This workout is archived and can’t be edited.",
      backToCatalogue: "Back to catalog",
    },
    // Recette E du 28/10/2026 (Hermann, e5-12) : une Séance archivée s’ouvre en consultation seule.
    consultation: {
      title: "Archived workout",
      notice: "Archived workout: view only. Restore it from the Catalog to edit it.",
    },
    // PRE-6 (story 3.1, CIR-10, Figma `8328:28667`) : en-tête du Circuit — titre, unité du
    // compteur accordée selon la nature (N = 1 singulier) et nom VoiceOver du réglage.
    // Remplace l’ancien jeu `tour` (« Nombre de tours », roulette du compte retirée).
    circuit: {
      title: "Circuit",
      unit: {
        TOURS: { singular: "round", plural: "rounds" },
        SERIES: { singular: "set", plural: "sets" },
      },
      // PRE-9 B.1a (D-451, complément du 28/10, remplace D-442 sur ce point ; référence
      // « Composition : circuits, cycles et création » §2) : l’unité du compteur de l’en-tête
      // reste « tour(s) » pour les deux natures, accordée à N ; la nature est portée par
      // l’adjectif « groupées » / « alternées » (identifiants persistés `TOURS` / `SERIES`
      // inchangés). `unit` ci-dessus n’est plus lu [PRE-9 B.1b : la carte du Catalogue emploie aussi
      // `countUnit` et `natureAdjective`] ; conservé, sans effet.
      countUnit: { singular: "round", plural: "rounds" },
      natureAdjective: {
        TOURS: "grouped",
        SERIES: "alternating",
      },
      countAccessibilityLabel: "Number of rounds",
      // PRE-6 (story 7.3, D-442) : boutons − et + du stepper, éléments accessibles distincts du
      // réglage « Nombre de tours ». PRE-9 B.1a : stepper révélé au toucher du nombre (RM-027).
      decrementAccessibilityLabel: "Remove a round",
      incrementAccessibilityLabel: "Add a round",
      // PRE-6 (story 3.2, CE-CIR-01, Figma `8328:34805`) : choix de nature. PRE-9 B.1a (RM-027,
      // référence §2) : ouvert par l’adjectif ; options renommées « Séries groupées » / « Séries
      // alternées », descriptions de la référence [remplacent « Circuit de tours » — « les séries
      // d’un exercice s’enchaînent » et « Circuit de séries » — « une série de chaque exercice
      // par passage », 29/10/2026].
      nature: {
        accessibilityLabel: "Circuit type",
        options: {
          TOURS: { title: "Grouped sets", subtitle: "all sets of an exercise done each round" },
          SERIES: { title: "Alternating sets", subtitle: "one set of each exercise done each round" },
        },
      },
      // PRE-6 (story 3.4, CE-CIR-03, Figma `8328:34965` / `8328:35135`) : œil de l’en-tête et
      // feuille « Volumes du circuit », en lecture seule. « ✓ » = cible à l’échec ; « — » = série
      // inexistante ou cible à renseigner (jamais 0), distingués à l’annonce VoiceOver.
      volumes: {
        openAccessibilityLabel: "View circuit volumes",
        title: "Circuit volumes",
        closeAccessibilityLabel: "Close circuit volumes",
        empty: "No exercises in the circuit",
        columns: {
          exercise: "Exercise",
          series: "S{n}",
          unit: "Unit",
        },
        units: {
          REPETITIONS: "reps",
          DURATION: "duration",
          FAILURE: "To failure",
        },
        failureValue: "✓",
        missingValue: "—",
        spoken: {
          series: "set {n}: {value}",
          repetitionsSingular: "{n} rep",
          repetitionsPlural: "{n} reps",
          failure: "to failure",
          noSeries: "no set",
          unset: "not set",
        },
      },
    },
    // PRE-9 B.1b (D-451 ; référence §4 : « Le cycle ne se replie pas […] Sa ligne n’a pas
    // d’adjectif de nature ; unité « répétition(s) » ») : en-tête du Cycle. Compte 1..99, nombre
    // révélant le stepper (RM-027, comme le Circuit) ; l’unité n’est pas interactive.
    // [31/10/2026, Hermann : « Remplacer le terme « répétition » par « passage » dans la composition
    // de séance pour le nombre de cycles, et dans le message » — remplace l'unité « répétition(s) ».]
    cycle: {
      title: "Cycle",
      countUnit: { singular: "pass", plural: "passes" },
      countAccessibilityLabel: "Number of passes",
      decrementAccessibilityLabel: "Remove a pass",
      incrementAccessibilityLabel: "Add a pass",
    },
    wheelPicker: {
      minutesAccessibilityLabel: "Minutes",
      secondsAccessibilityLabel: "Seconds",
      // R4-09 (`[ChatGPT] REWORK04 IMPLEMENTATION AUTHORIZED — DESIGN
      // COMPLEMENTS REVIEWED`, 2026-09-03) : toolbar Annuler/Valider.
      cancelAccessibilityLabel: "Cancel",
      validateAccessibilityLabel: "Done",
    },
    // V2-PRE-1 (critère UI-D35DA2C4F266) : « exercice » remplace « activité ».
    // [retiré le 24/11/2026, UI-FAB-01]
    // PRE-4, décision Q54 : l'action finale de la Composition enregistre la Séance (repris de
    // l'écran « Catégories de la séance », supprimé). D-107 : message d'échec mot pour mot.
    // PRE-6 (story 2.1, CE-T03-08, D-388, Figma `8328:28732`) : libellé « Continuer » ; même
    // composant, mêmes règles d'activation et même enregistrement (Q54).
    saveAction: "Continue",
    // PRE-6 (story 2.1) : durée de séance de l'en-tête (toutes les occurrences, RM-159).
    sessionDurationAccessibilityLabel: "Workout duration",
    // PRE-6 (story 4.1, AD-43, Figma `8328:28622`, `8328:29270`, `8328:28733`) : action
    // « Ajouter un arrêt » et mode placement — puces des emplacements, barre « Confirmer N
    // pauses ajoutées » / « Annuler » et roulette « Durée de récupération ».
    placement: {
      // [retiré le 24/11/2026, UI-FAB-01]
      recovery: "Recovery",
      stopPoint: "Hold",
      addRecoveryAccessibilityLabel: "Add recovery after {exercise}",
      addStopPointAccessibilityLabel: "Add a hold after {exercise}",
      addStopPointAfterCircuitAccessibilityLabel: "Add a hold after the circuit",
      // PRE-6 story 7.2 (D-442) : emplacement de tête de Circuit (début de Tour).
      addStopPointAtCircuitStartAccessibilityLabel: "Add a hold at the start of the circuit",
      existingStopPointAccessibilityLabel: "Hold after {exercise}",
      existingStopPointAfterCircuitAccessibilityLabel: "Hold after the circuit",
      // PRE-6 story 6.2 : point en tête de portée (données héritées), formulation à valider.
      stopPointAtCircuitStartAccessibilityLabel: "Hold at the start of the circuit",
      stopPointAtSessionStartAccessibilityLabel: "Hold at the start of the workout",
      // PRE-9 B.6 (ARB-02a/b) : emplacements d’un Cycle (début et fin de répétition) et après un
      // Circuit ou un Cycle désigné par sa lettre (ARB-13). Formulations à valider.
      addStopPointAtCycleStartAccessibilityLabel: "Add a hold at the start of the cycle",
      addStopPointAfterCycleAccessibilityLabel: "Add a hold after the cycle",
      stopPointAtCycleStartAccessibilityLabel: "Hold at the start of the cycle",
      existingStopPointAfterCycleAccessibilityLabel: "Hold after the cycle",
      // D-513 (Hermann, 06/11/2026), réalisé le 08/11/2026 : « Confirmer N points d’arrêt ajoutés ».
      // [« Confirmer {n} pause ajoutée » / « Confirmer {n} pauses ajoutées » — remplacés le 08/11/2026.]
      confirmSingular: "Confirm {n} added hold",
      confirmPlural: "Confirm {n} added holds",
      // PRE-6 story 6.3 (D-441, arbitrage du 22/10/2026) : retrait de point, mélange ou modification
      // de durée seule.
      confirmChanges: "Confirm changes",
      cancel: "Cancel",
      recoveryWheelTitle: "Recovery duration",
      selectedHint: "Tap to remove this addition.",
      // PRE-6 story 6.3 (D-441, ch13 CE-T03-08 accessibilité) : point existant sélectionné (conservé)
      // ou désélectionné (retrait programmé).
      existingStopPointSelectedHint: "Tap to remove this hold.",
      existingStopPointRemovedHint: "Tap to keep this hold.",
      // PRE-6 story 6.3 (revue) : resélection refusée (un point ajouté le suivrait, RM-251),
      // annonces de la bascule d’un point existant et indice d’entrée quand seul un retrait est
      // possible. Formulations à valider.
      existingStopPointBlockedHint: "Can’t be kept: an added hold would follow it.",
      stopPointRemovedAnnouncement: "Hold removed",
      stopPointKeptAnnouncement: "Hold kept",
      stopPointKeepRefusedAnnouncement: "Hold not kept: an added hold would follow it",
      addStopRemovalOnlyHint: "Lets you remove existing holds.",
      // PRE-6 story 7.2 (D-442) : une récupération existante se modifie et se retire en placement.
      addStopChangesOnlyHint: "Lets you edit or remove existing breaks.",
      // PRE-6 story 6.3 (revue, ch13 L1524) : effet d’un ajout ou de son annulation, suivi du
      // libellé de « Confirmer » (nombre d’ajouts).
      stopPointAddedAnnouncement: "Hold added",
      recoveryAddedAnnouncement: "Recovery added",
      additionCancelledAnnouncement: "Addition canceled",
      // PRE-6 story 7.2 (D-442, ch13 CE-T03-08 L1496) : zone de récupération existante (0 comprise)
      // en placement — nom, indices (sélectionnée : toucher la retire ; désélectionnée : toucher
      // ouvre la roulette) et annonces. Formulations à valider.
      existingRecoveryAccessibilityLabel: "Recovery after {exercise}",
      existingRecoverySelectedHint: "Tap to remove this recovery.",
      existingRecoveryRemovedHint: "Tap to choose its duration and keep it.",
      recoveryRemovedAnnouncement: "Recovery removed",
      recoverySelectedAnnouncement: "Recovery selected",
    },
    // PRE-9 B.2 (ARB-06, COMP §5 ; Figma `10819:20344`, `10836:20478`) : mode enveloppe — désigner
    // le premier contenu du Circuit ou du Cycle, barre « Confirmer le circuit / le cycle » et
    // « Annuler ». Noms accessibles et annonces : formulations à valider.
    envelope: {
      confirmCircuit: "Confirm circuit",
      confirmCycle: "Confirm cycle",
      cancel: "Cancel",
      exerciseInCircuitAccessibilityLabel: "Wrap {name} in the circuit",
      exerciseInCycleAccessibilityLabel: "Wrap {name} in the cycle",
      circuitInCycleAccessibilityLabel: "Wrap {name} in the cycle",
      circuitName: "the circuit",
      circuitNameWithLetter: "circuit {letter}",
      designatedAnnouncement: "{name} selected",
      circuitCreatedAnnouncement: "Circuit created around {name}",
      cycleCreatedAnnouncement: "Cycle created around {name}",
      // PRE-9 B.4b (sélection multiple, périmètre ajustable) : formulations choisies, à valider en recette.
      undesignatedAnnouncement: "{name} removed from selection",
      confirmCircuits: "Confirm circuits",
      confirmCycles: "Confirm cycles",
      circuitsCreatedAnnouncement: "{count} circuits created",
      cyclesCreatedAnnouncement: "{count} cycles created",
      circuitTopEdge: "Circuit top edge",
      circuitBottomEdge: "Circuit bottom edge",
      cycleTopEdge: "Cycle top edge",
      cycleBottomEdge: "Cycle bottom edge",
      extendUp: "Extend up",
      extendDown: "Extend down",
      reduceFromTop: "Shrink from top",
      reduceFromBottom: "Shrink from bottom",
      perimeterOne: "1 item",
      perimeterMany: "{count} items",
    },
    // PRE-9 B.4 (ch13 « annonce de la raison d'un refus de dépose ») : annonces VoiceOver d'une dépose
    // refusée sans modification dans une disposition générale. Formulations à valider.
    // PRE-9 C.4 (référence Formats du 02/11/2026 §13, `11410:20123`) : sortie d'un Exercice d'un Circuit
    // porteur d'un Format. Message illustratif, variable selon le mouvement et le Format.
    // PRE-9 C.4 (référence Formats du 02/11/2026 §5, §11, §12) : en-tête d'un Circuit porteur.
    carrier: {
      blockUnit: { singular: "block", plural: "blocks" },
      roundUnit: { singular: "round", plural: "rounds" },
      // « Correction — For time : ajouter le mode d’exécution « En alternance » / « À la suite » » : en-tête d'un For time « À la suite » (« 3 séries · à la suite »).
      seriesUnit: { singular: "set", plural: "sets" },
      inSequence: "in sequence",
      untilFailure: "to failure",
      noLimit: "No limit",
      buyIn: "Buy-in",
      buyOut: "Buy-out",
      durationLabels: {
        blockSeconds: "Block duration",
        windowSeconds: "Round duration",
        timeCapSeconds: "Time cap",
      },
    },
    formatExit: {
      title: "Leave the {format} circuit?",
      message: "{name} becomes a single {format}, or a free exercise.",
      keep: "Keep the {format} format",
      free: "Use a free format",
      cancel: "Cancel",
    },
    layoutMove: {
      refused: {
        NESTING: "Can’t drop: no circuit in a circuit, no cycle in a cycle",
        FORMAT_INCOMPATIBLE: "Can’t drop: this exercise’s format isn’t compatible with this circuit",
        // [B.4 : « STOP_POINTS: Dépose impossible tant que la séance contient des points d’arrêt » —
        // refus retiré le 31/10/2026 par B.6.]
        CONTROL: "Can’t drop",
        // Recette iPhone n° 3 du 03/11/2026 (référence Formats §6 point 4). Formulation à valider.
        // [Recette n° 3 du 03/11 : « le buy-in reste en tête du circuit, le buy-out à la fin » — remplacé le 04/11/2026
        // (zones des Rôles, MAJ §6 bis 2).]
        PASSAGE_FIXED: "Can’t drop: to change zones, edit the exercise’s role",
        // MAJ 04/11/2026 §6 bis 2 : message court invitant à passer d’abord un autre Exercice en Tour.
        LAST_TOUR: "First set another exercise to Round: the loop needs at least one",
        LAST_REPETITIONS: "This For time needs at least one exercise in Reps",
        // Recette du 08/11/2026 au soir (Superset limité) : libellé repris du questionnaire (« Deux exercices au maximum »,
        // registre ch07). Annoncé seulement : l'emplacement n'est pas proposé et « Monter » / « Descendre » franchit le Circuit.
        MEMBER_LIMIT: "Two exercises max in a Superset",
        // Réponse de Hermann du 08/11/2026 (« dans la composition on limite à deux exercices aussi ») : sortie ou
        // suppression d'un membre d'un Superset à deux. Formulation à faire confirmer par Hermann.
        MEMBER_MINIMUM: "Exactly two exercises in a Superset", // [« Deux exercices au minimum dans un Superset » — remplacé le 08/11/2026, Hermann : « Deux exercices exactement dans un superset »]
        NOT_FOUND: "",
        AT_BOUNDARY: "",
      },
      // PRE-9 B.6 (D-441, RM-251, ARB-06) : dépose d'un Point d'arrêt refusée sans mutation (position
      // interdite, occupée, ou consécutive à un autre Point). Formulation à valider.
      stopPointRefused: "Can’t drop: a hold can’t be placed here",
    },
    // PRE-6 story 7.2 (D-442) : la récupération ne se règle plus hors placement — la bulle « Retirer
    // la récupération » et les actions « Modifier » / « Retirer la récupération » de la carte
    // (stories 4.2, 5.1) sont retirées.
    pauses: {
      // PRE-6 story 6.2 (D-441) : l’appui long d’un point le saisit (glisser).
      stopPointReorderAccessibilityHint: "Long press to move the hold",
    },
    saveError: "The workout couldn’t be saved. Try again.",
    // PRE-7 story R-5 (D-445 C01 ; report R-3) : un nom de mouvement de la Séance pris en base entre
    // la saisie et l’enregistrement (écriture concurrente) est signalé pour ce qu’il est, et non par
    // l’erreur générique. Aucun texte relevé (NON VÉRIFIABLE).
    nameTakenError: "A movement in this workout has a name already in use. Change its name.",
    // Recette du 17/11/2026 (Hermann : « le nom d’une séance doit être unique ») : même tournure que le nom de
    // mouvement déjà utilisé (« Ce nom est déjà utilisé. … choisissez un autre nom. »). Texte non relevé dans Figma.
    sessionNameTaken: "This name is already used by another workout. Choose another name.",
    // Recette iPhone du 07/11/2026 (y-rouge, Hermann : « on ne peut sauvegarder mais il n’y a pas de message d’explication « la somme des durée des exercices d’une série excède l’intervalle de temps alloué par série » »).
    emomOverflow: "The total duration of the exercises in a set exceeds the time allotted per set.",
    // Recette du 17/11/2026 : For time dont la boucle n’a plus aucun exercice en répétitions.
    forTimeNoRepetitions: "For time: at least one exercise in the loop must be in reps.",
    // PRE-6 story 7.2 (D-442, ch13 CE-T03-08 L1498) : choix « lequel conserver » quand, à N ≥ 2, un
    // Point de début et un Point de fin de Tour se suivraient entre deux Tours (dialogue natif).
    // Formulations à valider.
    tourBoundaryChoice: {
      title: "Hold at round start and end",
      message: "They would follow each other between two rounds. Which one to keep?",
      head: "Round start",
      tail: "Round end",
      cancel: "Cancel",
    },
    // PRE-9 B.6 (ARB-02b : « demande de choix entre point de début et point de fin de répétition […]
    // même formulation et mêmes opérations que D-442 ») : même dialogue pour un Cycle répété, ses
    // répétitions au lieu des tours. Formulation à valider (À CLARIFIER de la spec B.6).
    repetitionBoundaryChoice: {
      // [31/10/2026, Hermann : « répétition » → « passage » dans ce message.]
      title: "Hold at pass start and end",
      message: "They would follow each other between two passes of the cycle. Which one to keep?",
      head: "Pass start",
      tail: "Pass end",
      cancel: "Cancel",
    },
    // PRE-6 story 7.2 (D-442) : points retirés sans message par un déplacement d’Exercice, un
    // changement du nombre de Tours ou un choix de Tour — annonce d’accessibilité discrète.
    stopPointsRemovedAnnouncement: {
      singular: "Hold removed",
      plural: "{n} holds removed",
    },
    // PRE-6 story 7.8 (D-443) : Compte à rebours et Fin de séance affichés en secondes seulement
    // (« 45 s ») ; la durée du Circuit (et son « — min ») n’est plus affichée.
    boundarySecondsUnit: "s",
    abandonModal: {
      title: "Discard this workout?",
      message: "Your entries will be lost and the workout won’t be created.",
      // REWORK10 (`[ChatGPT] CHANGES_REQUESTED — REWORK10 — dialogue
      // d'abandon de création`, 2026-09-04) : « Continuer la création »
      // → « Annuler », « Abandonner » → « Confirmer » — vérifié
      // directement sur l'instance `2591:3083` de la frame CE-T01-08
      // (`2028:11298`). Clés inchangées (`continueCreating`/`abandon`) :
      // seule la valeur affichée change, aucun renommage de clé —
      // `onCancel`/`onConfirm` (props du composant) portaient déjà la
      // sémantique correcte avant ce cycle.
      continueCreating: "Cancel",
      abandon: "Confirm",
    },
    // V2-BILAT-01 (plan `## UI`) : dialogue déterministe d'ACTIVATION de la
    // bilatéralité du Tour — uniquement à la transition `UNILATERAL` →
    // direction bilatérale (`RIGHT_LEFT`/`LEFT_RIGHT`). Titre et message
    // reproduits mot pour mot depuis le plan technique approuvé.
    // `Annuler` ne produit aucune mutation ; `Confirmer` applique la
    // transition atomique (`applyTourSideModeTransition`). Le retour à
    // `UNILATERAL` et le changement de sens entre deux directions déjà
    // bilatérales n'affichent jamais ce dialogue.
    // Correction bornée (plan `## 4.3`) : textes exacts republiés par le
    // plan de correction de présentation — remplacent les précédents,
    // approuvés pour l'implémentation initiale mais non conformes au
    // produit attesté (CE-BIL-02).
    tourBilateralConfirmModal: {
      title: "Do each Round on both sides?",
      // V2-PRE-1 (critère UI-D35DA2C4F266) : « Exercice(s) » remplace « Activité(s) ».
      message:
        "In each Round, all Exercises are done once on one side, then once on the other, in the chosen order. This setting replaces any side setting defined for an individual Exercise.",
      cancel: "Cancel",
      confirm: "Confirm",
    },
    // T02-S01 (CE-T02-01/CE-T02-02, D-124/D-127) : gestes et actions
    // glissées d'une carte Activité. Les deux libellés `Dupliquer` et
    // `Supprimer` sont ceux, exacts, du groupe `144 × 69` de la frame
    // `2028:11808`.
    // T02-S02 (D-095/D-128/D-138) : Récupération de l'occurrence — jamais une Activité, jamais
    // une ligne de plus dans le compte (`computeActivityCount` inchangé). PRE-6 (story 2.1) :
    // affichée par la ligne structurelle sous l'occurrence, dont le nom accessible est le
    // libellé visible (« Récupération 20 s ») ; l'ancienne clé « Récupération attachée » est retirée.
    activityRecovery: {
      label: "Recovery",
    },
    activityActions: {
      duplicate: "Duplicate",
      delete: "Delete",
      // V2-PRE-1 (critère UI-D35DA2C4F266) : « exercice » remplace « activité ».
      revealAccessibilityLabel: "Exercise actions",
      reorderAccessibilityHint:
        "Long press to move the exercise, swipe left to show actions",
      // PRE-6 (story 2.3, CE-T03-08 §18) : alternatives accessibles au glisser — une position
      // dans la séquence affichée, mêmes règles que le glisser.
      moveUp: "Move up",
      moveDown: "Move down",
      // PRE-6 story 7.5 (D-442 amendée) : la suppression d’un exercice n’est plus refusée — les
      // annonces de refus de la story 6.2 sont retirées.
    },
    // PRE-6 (story 2.3) : confirmation de perte de séries à l’entrée d’un exercice dans un
    // Circuit de Séries (dialogue `8328:34964`). Formulation calquée sur la conversion
    // (ch13), à valider par Hermann. `{series}` = « N série(s) », `{ordinal}` = N-ième.
    circuitEntryConfirmModal: {
      // PRE-9 (B.1a, D-451, COMP §2) : « circuit de séries » devient un terme historique ; nature
      // active « séries alternées ». [Avant : « Ajouter au circuit de séries ? », « Déplacer dans
      // le circuit de séries ? », « Passer en circuit de séries ? ».]
      addTitle: "Add to the alternating-sets circuit?",
      moveTitle: "Move into the alternating-sets circuit?",
      // PRE-6 (story 3.2, CE-CIR-02, Figma `8328:34964`) : conversion Tours → Séries avec perte.
      natureTitle: "Switch to alternating sets?",
      natureMessage:
        "All exercises will have {series}. Sets after set {ordinal} will be deleted, along with their values.",
      addMessagePlural:
        "The added exercises will have {series}. Sets after set {ordinal} will be deleted, along with their values.",
      addMessageSingular:
        "The added exercise will have {series}. Sets after set {ordinal} will be deleted, along with their values.",
      moveMessage:
        "The moved exercise will have {series}. Sets after set {ordinal} will be deleted, along with their values.",
      seriesSingular: "{n} set",
      seriesPlural: "{n} sets",
      ordinalFirst: "1",
      ordinalOther: "{n}",
      cancel: "Cancel",
      confirm: "Confirm",
    },
    exerciseRow: {
      editAccessibilityLabel: "Edit exercise",
      // PRE-9, recette iPhone n° 2 du 31/10/2026 (constat c, Hermann) : l'appui sur la carte ouvre la
      // feuille des paramètres d'exécution ; l'appui sur la photo ouvre la fiche du mouvement.
      editParametersAccessibilityLabel: "Edit settings",
      openMovementAccessibilityLabel: "Open movement",
      seriesSingular: "set",
      seriesPlural: "sets",
      repetitionSingular: "rep",
      repetitionPlural: "reps",
      of: "of",
      withPause: "with",
      pauseSuffix: "rest per set",
      // PRE-4 (story 1.1, Q24, FR-05-05) : résumé de carte d'un Exercice dont
      // toutes les Cibles sont à l'échec — « {N} séries à l’échec » (P3) ;
      // remplace « {N} séries jusqu’à l’échec » de PRE-3.
      toFailure: "to failure",
      // V2-BILAT-01 (plan `## UI`, « Composition cards and summaries ») :
      // clause de côté d'une carte Activité dont la direction PROPRE est
      // bilatérale (jamais héritée du Tour) — insérée immédiatement après
      // « {N} série(s) », avant le connecteur `of` (« de »)/`toFailure`
      // (« jusqu'à l'échec »), d'où « {N} série(s) par côté … ».
      perSide: "per side",
      // Suffixe de direction, ajouté juste après la cible (ou après
      // `toFailure`), donc AVANT la clause de Pause — jamais pour une
      // Activité unilatérale ni pour une direction héritée du Tour.
      sideDirectionSuffixRightLeft: ", right, then left",
      sideDirectionSuffixLeftRight: ", left, then right",
    },
    // PRE-6 story 2.2 (D-238, Figma `5544:6797`) : carte d'occurrence de la Composition.
    // Synthèse « N × cible » des séries identiques, « … » après trois cibles variables ;
    // nom accessible « Exercice, {nom}, {n} sur {m}, {durée} » (CE-T03-08 §18).
    // Mise à jour consolidée des écrans Formats du 04/11/2026 (§6 quinquies, §6 sexies) : Circuit replié.
    circuitActions: {
      rename: "Rename",
      editFormat: "Edit format",
      duplicate: "Duplicate",
      delete: "Delete",
      renameLabel: "Circuit name",
      deleteTitle: "Delete this circuit?",
      deleteMessage: "The circuit and its {count} exercises will be removed from the workout.",
      deleteMessageOne: "The circuit and its exercise will be removed from the workout.",
      cancel: "Cancel",
      confirmDelete: "Delete",
    },
    occurrenceCard: {
      seriesTimes: "{n} × {target}",
      valuesOverflow: "…",
      accessibilityType: "Exercise",
      accessibilityPosition: "{position} of {count}",
      // Ajouté au nom accessible d'une occurrence bilatérale (RM-243 : sans direction).
      accessibilitySideChange: "switch sides",
      // PRE-6 (story 5.1, revue) : ajouté au nom accessible d’une occurrence dont la récupération
      // est affichée en ligne 3 (le contrôle imbriqué n’est pas exposé à l’accessibilité).
      accessibilityRecovery: "recovery {duration}",
      // PRE-6 (story 5.1, D-435, Figma `9808:19924`) : séparateur entre la synthèse et la durée
      // estimée des Répétitions avec bip, sur la ligne 2 de la carte v2 (« 10 rép. / ≈ 1 min »).
      // Contre-recette n° 3 ter du 03/11/2026 (f3-deathby) : « 1 / +1 rép. ».
      // [« {start} / +{increment} {unit} » (Death by, 03/11/2026) — remplacé le 08/11/2026 par `increment`.]
      // Demande de Hermann du 08/11/2026 (carte « DSF / Cards / Exercice — Composition ») : départ et incrément avec son
      // unité — « 10 rép. +2/tour » (AMRAP, Volume croissant), « 1 rép. +1/min » (Death by, par intervalle).
      increment: "{start} {sign}{increment}/{period}",
      incrementPlus: "+",
      incrementMinus: "−",
      incrementPerRound: "round",
      incrementPerMinute: "min",
      workEstimateSeparator: " / ",
    },
  },
};
