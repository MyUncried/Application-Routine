import { describe, expect, it } from "@jest/globals";

import { totalClauseAmount } from "@/domain/activities/executionPhrase";
import { strings } from "@/shared/i18n";

describe("strings", () => {
  it("exposes the main tab labels in French, including the disabled Communauté destination (PRE-8 E01); sessions is 'Séances' (RES-NAV-LABEL-01)", () => {
    expect(strings.nav).toEqual({
      sessions: "Séances",
      calendar: "Calendrier",
      history: "Suivi",
      profile: "Profil",
      search: "Recherche",
      community: "Communauté",
    });
  });

  it("exposes a title and a placeholder for each tab screen still awaiting its real UI", () => {
    const tabScreens = [strings.screens.calendar, strings.screens.history];

    for (const screen of tabScreens) {
      expect(screen.title.length).toBeGreaterThan(0);
      expect(screen.placeholder.length).toBeGreaterThan(0);
    }
  });

  // V2-PRE-2 : le Profil a désormais une UI réelle (même patron que
  // `sessions` en son temps) — `placeholder` n'a plus de consommateur.
  it("exposes the Profile screen title, with no placeholder (it has a real UI, V2-PRE-2)", () => {
    expect(strings.screens.profile.title).toBe("Profil");
    expect(strings.screens.profile).not.toHaveProperty("placeholder");
  });

  it("exposes the Profile's six setting labels/units and three group titles (CE-UI-07 L2515)", () => {
    expect(strings.screens.profile.groups).toEqual({
      exercise: "Exercice",
      session: "Séance",
      preferences: "Préférences",
    });
    expect(strings.screens.profile.settings.sideChangeRecovery).toEqual({
      label: "Pause entre les côtés",
      unit: "s",
    });
    expect(strings.screens.profile.settings.sessionInitialCountdown.label).toBe(
      "Compte à rebours initial",
    );
  });

  it("exposes the Profile's four preference switch labels (CE-UI-07 L2515/L2519/L2573)", () => {
    expect(strings.screens.profile.preferencesSwitches).toEqual({
      sounds: "Sons",
      voiceAnnouncements: "Annonces vocales",
      vibration: "Vibration",
      notifications: "Notifications",
    });
  });

  it("exposes the exact Modifier le profil texts (CE-UI-01)", () => {
    expect(strings.screens.profileEdit.title).toBe("Modifier le profil");
    expect(strings.screens.profileEdit.name.errorRequired.length).toBeGreaterThan(0);
    expect(strings.screens.profileEdit.silhouette).toEqual({
      label: "Silhouette",
      homme: "Silhouette homme",
      femme: "Silhouette femme",
    });
    expect(strings.screens.profileEdit.abandonModal).toEqual({
      title: "Abandonner les modifications ?",
      message: "Les modifications apportées au profil seront perdues.",
      continueEditing: "Annuler",
      abandon: "Confirmer",
    });
  });

  it("exposes deletion confirmation title fragments composing 'Supprimer « {nom} » ?', and differentiated used/unused messages (§4.10 L134/L135)", () => {
    const composed = `${strings.referenceData.deleteConfirm.titlePrefix}Focus${strings.referenceData.deleteConfirm.titleSuffix}`;
    expect(composed).toContain("Supprimer");
    expect(composed).toContain("Focus");
    expect(composed.endsWith("?")).toBe(true);
    expect(strings.referenceData.deleteConfirm.usedMessage).not.toBe(
      strings.referenceData.deleteConfirm.unusedMessage,
    );
  });

  it("exposes the shared long-press dialog labels Annuler/Modifier/Supprimer (D4, D-259)", () => {
    expect(strings.referenceData.longPressDialog).toEqual({
      cancel: "Annuler",
      modify: "Modifier",
      delete: "Supprimer",
      // PRE-4 story 4.6 (FR-22-09, AC8) : action accessible équivalente à l'appui long (ajout).
      accessibilityAction: "Modifier ou supprimer",
    });
  });

  /** R10 (CE-T03-16 L1677) : l'action proposée (choisir/retirer) d'une Étiquette est distincte de son nom et de son état sélectionné. */
  it("exposes distinct choose/retire action hints for Étiquette (R10)", () => {
    expect(strings.referenceData.label.chooseActionHint).not.toBe(
      strings.referenceData.label.retireActionHint,
    );
    expect(strings.referenceData.label.chooseActionHint.length).toBeGreaterThan(0);
    expect(strings.referenceData.label.retireActionHint.length).toBeGreaterThan(0);
  });

  /**
   * §4.10 L136 ; CE-UI-09 L2812, L2836 ; CE-T03-16 L1665, L1673 : clé
   * centralisée partagée par les trois modales de référentiel pour un échec
   * d'écriture (modale conservée), jamais un texte local improvisé par l'un
   * des trois consommateurs.
   */
  it("exposes the shared referential write-error message (§4.10 L136)", () => {
    expect(strings.referenceData.writeError.length).toBeGreaterThan(0);
  });

  it("exposes the Catalogue screen title (T01-S06 — no placeholder, it has a real UI)", () => {
    expect(strings.screens.sessions.title.length).toBeGreaterThan(0);
  });

  it("exposes the Catalogue filter labels (future domain filters, D-109 — never the main control)", () => {
    expect(strings.screens.sessions.filters).toEqual({
      all: "Toutes",
      scheduled: "Planifiées",
      archived: "Archivées",
    });
  });

  it("exposes the Catalogue content-type selector labels (T01-S10, D-108)", () => {
    expect(strings.screens.sessions.contentTypes).toEqual({
      activities: "Exercices",
      sessions: "Séances",
      // Alignement DSF 07/10 (D10) : « Parcours » dans les catalogues.
      circuits: "Parcours",
      activitiesUnavailableAccessibilityLabel: "Exercices — indisponible",
      circuitsUnavailableAccessibilityLabel: "Parcours — indisponible",
    });
  });

  it("exposes the Catalogue create action label", () => {
    expect(strings.screens.sessions.createAction.length).toBeGreaterThan(0);
  });

  it("exposes the exact Catalogue loading accessibility label", () => {
    expect(strings.screens.sessions.loading.accessibilityLabel).toBe(
      "Chargement des séances en cours",
    );
  });

  it("exposes the exact Catalogue empty-state message", () => {
    expect(strings.screens.sessions.empty.message).toBe(
      "Vous verrez ici la liste de vos séances dès que vous aurez commencé à les créer.",
    );
  });

  it("exposes the exact Catalogue error message and retry label", () => {
    expect(strings.screens.sessions.error.message).toBe("Impossible de charger vos séances.");
    expect(strings.screens.sessions.error.retry).toBe("Réessayer");
  });

  it("exposes the Catalogue card singular/plural fragments and duration unit", () => {
    expect(strings.screens.sessions.card).toEqual({
      activitySingular: "exercice",
      activityPlural: "exercices",
      tourSingular: "tour",
      tourPlural: "tours",
      durationUnit: "min",
      expandAccessibilityLabel: "Déployer la séance",
      startAccessibilityLabel: "Démarrer la séance",
      openAccessibilityLabel: "Modifier la séance",
    });
  });

  it("exposes the Composition screen texts (T01-S07)", () => {
    // Complément d'alignement du 07/10 (ajout D).
    expect(strings.screens.composition.title).toBe("Composer une séance");
    expect(strings.screens.composition.name).toBe("Nom de la séance");
    expect(strings.screens.composition.colorPicker).toEqual({
      label: "Couleur",
      paletteAccessibilityLabel: "Palette de couleurs",
      swatchAccessibilityLabel: "Couleur",
    });
    expect(strings.screens.composition.label).toEqual({
      accessibilityLabel: "Étiquette de la séance",
      placeholder: "Étiquette",
    });
    expect(strings.screens.composition.countdown.label).toBe("Compte à rebours initial");
    expect(strings.screens.composition.finalPhase.label).toBe("Fin de séance");
    expect(strings.screens.composition.circuit).toEqual({
      title: "Circuit",
      unit: {
        TOURS: { singular: "tour", plural: "tours" },
        SERIES: { singular: "série", plural: "séries" },
      },
      countAccessibilityLabel: { TOURS: "Nombre de tours", SERIES: "Nombre de séries" },
      // PRE-6 story 7.3 (D-442) : boutons − et + du stepper toujours affiché.
      decrementAccessibilityLabel: { TOURS: "Retirer un tour", SERIES: "Retirer une série" },
      incrementAccessibilityLabel: { TOURS: "Ajouter un tour", SERIES: "Ajouter une série" },
      // PRE-6 story 3.2 (CE-CIR-01, `8328:34805`) : choix de nature du Circuit.
      nature: {
        accessibilityLabel: "Nature du circuit",
        options: {
          TOURS: { title: "Circuit de tours", subtitle: "les séries d’un exercice s’enchaînent" },
          SERIES: { title: "Circuit de séries", subtitle: "une série de chaque exercice par passage" },
        },
      },
      // PRE-6 story 3.4 (CE-CIR-03, `8328:34965`) : œil et feuille « Volumes du circuit ».
      volumes: {
        openAccessibilityLabel: "Voir les volumes du circuit",
        title: "Volumes du circuit",
        closeAccessibilityLabel: "Fermer les volumes du circuit",
        empty: "Aucun exercice dans le circuit",
        columns: { exercise: "Exercice", series: "S{n}", unit: "Unité" },
        units: { REPETITIONS: "rép.", DURATION: "durée", FAILURE: "À l’échec" },
        failureValue: "✓",
        missingValue: "—",
        spoken: {
          series: "série {n} : {value}",
          repetitionsSingular: "{n} répétition",
          repetitionsPlural: "{n} répétitions",
          failure: "à l’échec",
          noSeries: "pas de série",
          unset: "à renseigner",
        },
      },
    });
  });

  it("exposes the Circuit conversion loss dialog texts (PRE-6 story 3.2, CE-CIR-02, `8328:34964`)", () => {
    const t = strings.screens.composition.circuitEntryConfirmModal;
    expect(t.natureTitle).toBe("Passer en circuit de séries ?");
    expect(t.natureMessage).toBe(
      "Tous les exercices auront {series}. Les séries au-delà de la {ordinal} seront supprimées, avec les valeurs qu’elles portent.",
    );
  });

  it("exposes the Composition edit-mode rehydration state texts (T01-S10, CE-T01-S10-09)", () => {
    expect(strings.screens.composition.editStates).toEqual({
      loadingAccessibilityLabel: "Chargement de la séance en cours",
      errorMessage: "Impossible de charger cette séance.",
      retry: "Réessayer",
      notFoundMessage: "Cette séance est introuvable.",
      archivedMessage: "Cette séance est archivée et ne peut pas être modifiée.",
      backToCatalogue: "Revenir au catalogue",
    });
    expect(strings.screens.composition.wheelPicker).toEqual({
      minutesAccessibilityLabel: "Minutes",
      secondsAccessibilityLabel: "Secondes",
      cancelAccessibilityLabel: "Annuler",
      validateAccessibilityLabel: "Valider",
    });
    expect(strings.screens.composition.addActivity).toBe("Ajouter un exercice");
    // PRE-4 Q54 : l’action finale de la Composition enregistre la Séance ; PRE-6 story 2.1
    // (CE-T03-08, D-388) : son libellé est « Continuer ».
    expect(strings.screens.composition.saveAction).toBe("Continuer");
    expect(strings.screens.composition.saveError).toBe("La séance n’a pas pu être enregistrée. Réessayez.");
  });

  it("exposes the placement mode texts (PRE-6 story 4.1, `8328:28622`, `8328:29270`, `8328:28733`)", () => {
    expect(strings.screens.composition.placement).toEqual({
      addStopAccessibilityLabel: "Ajouter un arrêt",
      recovery: "Récupération",
      stopPoint: "Point d’arrêt",
      addRecoveryAccessibilityLabel: "Ajouter une récupération après {exercise}",
      addStopPointAccessibilityLabel: "Ajouter un point d’arrêt après {exercise}",
      addStopPointAfterCircuitAccessibilityLabel: "Ajouter un point d’arrêt après le circuit",
      // PRE-6 story 7.2 (D-442) : emplacement de tête de Circuit.
      addStopPointAtCircuitStartAccessibilityLabel: "Ajouter un point d’arrêt au début du circuit",
      existingStopPointAccessibilityLabel: "Point d’arrêt après {exercise}",
      existingStopPointAfterCircuitAccessibilityLabel: "Point d’arrêt après le circuit",
      // PRE-6 story 6.2 : point en tête de portée (données héritées).
      stopPointAtCircuitStartAccessibilityLabel: "Point d’arrêt au début du circuit",
      stopPointAtSessionStartAccessibilityLabel: "Point d’arrêt au début de la séance",
      confirmSingular: "Confirmer {n} pause ajoutée",
      confirmPlural: "Confirmer {n} pauses ajoutées",
      // PRE-6 story 6.3 (D-441) : libellé des changements autres que des ajouts seuls.
      confirmChanges: "Confirmer les modifications",
      cancel: "Annuler",
      recoveryWheelTitle: "Durée de récupération",
      selectedHint: "Un toucher retire cet ajout.",
      // PRE-6 story 6.3 : indices du point existant en placement.
      existingStopPointSelectedHint: "Toucher pour retirer ce point d’arrêt.",
      existingStopPointRemovedHint: "Toucher pour conserver ce point d’arrêt.",
      // PRE-6 story 6.3 (revue) : resélection refusée, annonces, indice d’entrée.
      existingStopPointBlockedHint: "Ne peut pas être conservé : un point ajouté le suivrait.",
      stopPointRemovedAnnouncement: "Point d’arrêt retiré",
      stopPointKeptAnnouncement: "Point d’arrêt conservé",
      stopPointKeepRefusedAnnouncement: "Point d’arrêt non conservé : un point ajouté le suivrait",
      addStopRemovalOnlyHint: "Permet de retirer des points d’arrêt existants.",
      // PRE-6 story 7.2 (D-442) : une récupération existante se modifie et se retire en placement.
      addStopChangesOnlyHint: "Permet de modifier ou de retirer les pauses existantes.",
      // PRE-6 story 6.3 (revue, ch13 L1524) : annonces d’ajout.
      stopPointAddedAnnouncement: "Point d’arrêt ajouté",
      recoveryAddedAnnouncement: "Récupération ajoutée",
      additionCancelledAnnouncement: "Ajout annulé",
      // PRE-6 story 7.2 (D-442) : zone de récupération existante en placement.
      existingRecoveryAccessibilityLabel: "Récupération après {exercise}",
      existingRecoverySelectedHint: "Toucher pour retirer cette récupération.",
      existingRecoveryRemovedHint: "Toucher pour choisir sa durée et la conserver.",
      recoveryRemovedAnnouncement: "Récupération retirée",
      recoverySelectedAnnouncement: "Récupération sélectionnée",
    });
  });

  it("exposes the pause texts (PRE-6 story 6.2 ; story 7.2, D-442 : plus de réglage de la récupération hors placement)", () => {
    expect(strings.screens.composition.pauses).toEqual({
      // PRE-6 story 6.2 (D-441) : plus de retrait d'un point par bulle ; l'appui long le déplace.
      stopPointReorderAccessibilityHint: "Appui long pour déplacer le point d’arrêt",
    });
    // Story 7.2 (D-442) : D-301 retirée, plus d’avertissement d’enchaînement sans pause.
    expect(strings.screens.composition).not.toHaveProperty("unpausedWarning");
  });

  it("exposes the tour-boundary choice and removed-stop-point texts (PRE-6 story 7.2, D-442)", () => {
    expect(strings.screens.composition.tourBoundaryChoice).toEqual({
      title: "Point d’arrêt en début et en fin de tour",
      message: "Les deux se suivraient entre deux tours. Lequel conserver ?",
      head: "Début de tour",
      tail: "Fin de tour",
      cancel: "Annuler",
    });
    expect(strings.screens.composition.stopPointsRemovedAnnouncement).toEqual({
      singular: "Point d’arrêt retiré",
      plural: "{n} points d’arrêt retirés",
    });
  });

  it("no longer exposes refused-deletion announcements (PRE-6 story 7.5, D-442 amendée)", () => {
    expect(strings.screens.composition.activityActions).not.toHaveProperty("deleteRefusedStopPointNotAllowed");
    expect(strings.screens.composition.activityActions).not.toHaveProperty("deleteRefusedConsecutiveStopPoints");
  });

  it("exposes the seconds unit of the session boundaries; no Circuit duration label any more (PRE-6 story 7.8, D-443)", () => {
    expect(strings.screens.composition.boundarySecondsUnit).toBe("s");
    expect(strings.screens.composition).not.toHaveProperty("summary");
  });

  it("exposes the exact abandon-creation modal texts (docs §06, « Les modales » ; REWORK10, 2026-09-04 — 'Continuer la création'/'Abandonner' renamed to 'Annuler'/'Confirmer', same keys)", () => {
    expect(strings.screens.composition.abandonModal).toEqual({
      title: "Abandonner la création ?",
      message: "Les informations saisies seront perdues et la séance ne sera pas créée.",
      continueCreating: "Annuler",
      abandon: "Confirmer",
    });
  });

  it("exposes the Composition exercise-row accessibility label (T01-S08)", () => {
    expect(strings.screens.composition.exerciseRow.editAccessibilityLabel.length).toBeGreaterThan(
      0,
    );
  });

  it("exposes the exact exercise-row summary lexical fragments (T01-S08, CHANGES_REQUESTED, D-095; V2-BILAT-01 direction clause added)", () => {
    expect(strings.screens.composition.exerciseRow).toEqual({
      editAccessibilityLabel: "Modifier l’exercice",
      seriesSingular: "série",
      seriesPlural: "séries",
      repetitionSingular: "répétition",
      repetitionPlural: "répétitions",
      of: "de",
      withPause: "avec",
      pauseSuffix: "de pause par série",
      // PRE-4 (story 1.1, Q24) : « {N} séries à l’échec ».
      toFailure: "à l’échec",
      // V2-BILAT-01 (plan `## UI`, « Composition cards and summaries ») :
      // clause de côté d'une carte Activité à direction PROPRE bilatérale.
      perSide: "par côté",
      sideDirectionSuffixRightLeft: ", à droite, puis à gauche",
      sideDirectionSuffixLeftRight: ", à gauche, puis à droite",
    });
  });

  it("T02-S02, révisé PRE-6 story 2.1 — exposes the Récupération label of a Composition occurrence (D-095/D-128/D-138)", () => {
    expect(strings.screens.composition.activityRecovery).toEqual({
      label: "Récupération",
    });
  });

  it("exposes the Exercise screen texts (T01-S08)", () => {
    // REWORK09 (mission directe utilisateur, 2026-09-04) : `titleAdd`/
    // `titleEdit` (grand titre local, remplacé par le nom réel de la
    // Séance dans l'en-tête fixe partagé) avaient été retirés.
    //
    // Complétion REWORK12 (`[ChatGPT] Applique impérativement le protocole
    // KODJO actif...`, 2026-09-04, D-105) : réintroduits avec un sens
    // fonctionnel — voir le test dédié ci-dessous.
    expect(strings.screens.exercise.backAccessibilityLabel).toBe("Retour");
    expect(strings.screens.exercise.name).toBe("Nom de l’exercice");
    expect(strings.screens.exercise.executionMode).toEqual({
      label: "Mode d’exécution",
      duration: "Durée",
      repetitions: "Répétitions",
    });
    expect(strings.screens.exercise.wheelPicker).toEqual({
      minutesAccessibilityLabel: "Minutes",
      secondsAccessibilityLabel: "Secondes",
      cancelAccessibilityLabel: "Annuler",
      validateAccessibilityLabel: "Valider",
    });
    expect(strings.screens.exercise.finishAction).toBe("Terminer");
    // T02-S02 (D-137) : l'écran unifié n'a plus d'étape intermédiaire —
    // `validateAction` est supprimé, `Terminer` est la seule action finale.
    expect(strings.screens.exercise).not.toHaveProperty("validateAction");
    expect(strings.screens.exercise.instruction.label).toBe("Description de l’exercice");
    // T02-S02 (continuation après recette visuelle) : « Zone corporelle
    // d'exécution » → « Zones corporelles » — la section accepte PLUSIEURS
    // Zones (D-093), le singulier était trompeur.
    expect(strings.screens.exercise.bodyZones.label).toBe("Zones corporelles");
    expect(strings.screens.exercise.bodyZones.accessibilityLabel).toBe("Zones corporelles");
  });

  it("T02-S02 — exposes the collapsible section titles and composes header names with an action verb, keeping the description field label unique (CE-T01-13/CE-T01-15)", () => {
    expect(strings.screens.exercise.sections).toEqual({
      description: "Description de l’exercice",
      bodyZones: "Zones corporelles",
      executionMode: "Mode d’exécution",
      expandAction: "Déployer la section",
      collapseAction: "Replier la section",
    });
    // Le titre de section EST le libellé du champ qu'elle contient : c'est le
    // même élément fonctionnel. L'unicité du nom accessible repose donc
    // entièrement sur la composition `{action} {titre}` de l'en-tête.
    expect(strings.screens.exercise.sections.description).toBe(
      strings.screens.exercise.instruction.label,
    );
    expect(strings.screens.exercise.sections.bodyZones).toBe(
      strings.screens.exercise.bodyZones.accessibilityLabel,
    );
    expect(strings.screens.exercise.sections.expandAction).not.toBe(
      strings.screens.exercise.sections.collapseAction,
    );
  });

  it("T02-S02 — exposes the attached Récupération and the derived Durée totale parameter labels (CE-T01-14)", () => {
    expect(strings.screens.exercise.recoverySeconds).toEqual({
      label: "Récupération après les Séries",
      accessibilityLabel: "Récupération après les Séries",
      compactLabel: "Récupération",
    });
    expect(strings.screens.exercise.totalDuration).toEqual({
      label: "Durée totale de l’exercice",
      accessibilityLabel: "Durée totale de l’exercice",
      compactLabel: "Durée totale",
      // T02-S02 (seconde recette visuelle, point 9) : variante BORNE
      // MINIMALE, affichée en modes `Répétitions` et « À l'échec ».
      compactLabelLowerBound: "Durée totale ≥",
      accessibilityLabelLowerBound: "Durée totale minimale de l’exercice",
    });
    // Le glyphe `≥` est celui, unique, de toutes les bornes minimales de
    // l'application — jamais une écriture concurrente.
    expect(strings.screens.exercise.totalDuration.compactLabelLowerBound).toContain("≥");
    // V2-BILAT-01 (BIL-068) : le libellé visible de la ligne de durée reste
    // `Durée totale` dans les trois modes — jamais lui-même porteur du `≥`,
    // qui reste composé par `compositionPresentation.ts` au moment de
    // l'affichage.
    expect(strings.screens.exercise.recap.totalDurationLabel).not.toContain("≥");
  });

  it("T02-S02 — exposes the total-duration adjustment message with a {duration} placeholder (RM-130)", () => {
    expect(strings.screens.exercise.adjustedTotalDurationMessage).toBe(
      "Durée ajustée à {duration} pour respecter un nombre entier de Séries.",
    );
    expect(strings.screens.exercise.adjustedTotalDurationMessage).toContain("{duration}");
    // T02-S02 (continuation) : le message est rendu dans la notification
    // noire temporaire canonique, qui exige une action de CORRECTION.
    expect(strings.screens.exercise.adjustedTotalDurationUndoAction).toBe("Annuler");
  });

  it("exposes the disabled add-media button label (T01-S10, doc13 §8 — Médias V2 hors périmètre ; correctif T02 2026-09-08 — le '+' n'est plus un caractère de texte, porté par l'icône DSF)", () => {
    expect(strings.screens.exercise.addMedia).toBe("Ajouter un média");
    expect(strings.screens.exercise.addMediaUnavailableAccessibilityLabel).toBe(
      "Ajouter un média — indisponible",
    );
  });

  it("REWORK09 — exposes short compact-row labels for Durée/Pause/Séries/Répétitions, distinct from their fuller accessibility labels", () => {
    expect(strings.screens.exercise.duration.label).toBe("Durée");
    expect(strings.screens.exercise.pauseSeconds.compactLabel).toBe("Pause");
    expect(strings.screens.exercise.pauseSeconds.accessibilityLabel).toBe("Pause après Série");
    expect(strings.screens.exercise.seriesCount.compactLabel).toBe("Séries");
    expect(strings.screens.exercise.repetitionCount.compactLabel).toBe("Répétitions");
  });

  it("REWORK12 — exposes the Exercise recap fragments (pause label always applied, suffix conditional on several Séries), modePrefix removed (no longer consumed)", () => {
    expect(strings.screens.exercise.recap).toEqual({
      pauseLabel: "de pause",
      pauseSuffix: "entre les séries",
      // T02-S02 : proposition de Récupération attachée et ligne de durée.
      recoveryPrefix: "puis",
      recoveryLabel: "de récupération",
      // V2-BILAT-01 (BIL-068) : `minimumDurationLabel` (« Durée minimale »)
      // est retiré — le libellé visible reste `Durée totale` dans les trois
      // modes, la borne inférieure restant signalée par le seul `≥`.
      totalDurationLabel: "Durée totale",
    });
    expect(strings.screens.exercise.recap.pauseSuffix).not.toBe(
      strings.screens.composition.exerciseRow.pauseSuffix,
    );
  });

  it("REWORK12 — exposes the functional titles Ajouter/Modifier une activité, and the Séance context prefix (D-105)", () => {
    // Complément d'alignement du 07/10 (ajout D).
    expect(strings.screens.exercise.titleAdd).toBe("Créer un exercice");
    expect(strings.screens.exercise.titleEdit).toBe("Modifier un exercice");
    expect(strings.screens.exercise.context).toEqual({ prefix: "Séance" });
    // T02-S02 (D-137) : l'écran unifié n'a plus de seconde étape —
    // `titleInformation` est supprimé plutôt que laissé mort.
    expect(strings.screens.exercise).not.toHaveProperty("titleInformation");
  });

  it("T02-S02 (D-137) — the Type segment and the Paramètres section title are removed from the unified Activity screen", () => {
    // La Récupération n'est plus un TYPE d'Activité sélectionnable mais un
    // paramètre attaché (`recoverySeconds`) : le segment `Exercice /
    // Récupération` disparaît avec lui, ainsi que le titre `Paramètres de
    // l'activité`.
    expect(strings.screens.exercise).not.toHaveProperty("type");
    expect(strings.screens.exercise).not.toHaveProperty("parametersTitle");
  });

  it("exposes distinct wheel accessibility labels for Répétitions/Séries, never colliding with their row label (AUD-05)", () => {
    expect(strings.screens.exercise.repetitionCount.wheelAccessibilityLabel).not.toBe(
      strings.screens.exercise.repetitionCount.label,
    );
    expect(strings.screens.exercise.seriesCount.wheelAccessibilityLabel).not.toBe(
      strings.screens.exercise.seriesCount.label,
    );
  });

  it("exposes the distinct navigation Recherche accessibility label (AUD-02)", () => {
    expect(strings.nav.search).toBe("Recherche");
  });

  it("exposes the Composition Retour accessibility label (AUD-03)", () => {
    expect(strings.screens.composition.backAccessibilityLabel).toBe("Retour");
    expect(strings.screens.composition.closeAccessibilityLabel).toBe("Fermer");
  });

  it("exposes a Durée row accessibility label distinct from the Durée/Répétition mode tab (T01-S08)", () => {
    expect(strings.screens.exercise.duration.label).toBe("Durée");
    expect(strings.screens.exercise.duration.accessibilityLabel).not.toBe(
      strings.screens.exercise.executionMode.duration,
    );
  });

  it("exposes the exact D-094/CE-T01-16 exercise exit-confirm modal texts (REWORK11, 2026-09-04 — 'Continuer la modification'/'Abandonner' renamed to 'Annuler'/'Confirmer', same keys)", () => {
    expect(strings.screens.exercise.exitConfirmModal).toEqual({
      title: "Abandonner les modifications ?",
      message: "Les modifications apportées à cet exercice seront perdues.",
      continueEditing: "Annuler",
      abandon: "Confirmer",
      // PRE-4 story 4.2 (Q18) : textes du dialogue en création.
      createTitle: "Abandonner la création ?",
      createMessage: "Les informations saisies seront perdues et l’exercice ne sera pas créé.",
    });
  });

  it("exposes the not-found screen texts and accessibility labels", () => {
    expect(strings.screens.notFound.title.length).toBeGreaterThan(0);
    expect(strings.screens.notFound.backHome.length).toBeGreaterThan(0);
    expect(strings.screens.notFound.accessibility.title.length).toBeGreaterThan(0);
    expect(strings.screens.notFound.accessibility.backHome.length).toBeGreaterThan(0);
  });

  it("exposes the exact generic root error message", () => {
    expect(strings.errors.root.message).toBe(
      "Impossible d'afficher KODJO. Fermez puis relancez l'application.",
    );
  });

  // Correction bornée V2-BILAT-01 (plan `## 4.3`/`## 4.1`/`## 4.2`) :
  // textes exacts du dialogue de confirmation du Tour, labels accessibles
  // Activité/Tour, et valeurs visibles distinctes de `UNILATERAL` entre les
  // deux contextes.
  it("exposes the exact Tour bilateral confirmation dialog title, message and actions (plan '## 4.3')", () => {
    expect(strings.screens.composition.tourBilateralConfirmModal).toEqual({
      title: "Exécuter chaque Tour des deux côtés ?",
      message:
        "À chaque Tour, tous les Exercices sont exécutés une fois d’un côté, puis une fois de l’autre, selon l’ordre choisi. Ce réglage remplace tout réglage de côté défini individuellement pour un Exercice.",
      cancel: "Annuler",
      confirm: "Confirmer",
    });
  });

  it("exposes the exact Activity accessible side labels, and the explicit 'Aucun' unilateral visible value (V2-PRE-1, critère UI-73382D60E040)", () => {
    expect(strings.shared.sideMode.activity.accessibilityLabels).toEqual({
      UNILATERAL: "Changement de côté : Aucun",
      RIGHT_LEFT: "Côté : bilatéral, droite puis gauche",
      LEFT_RIGHT: "Côté : bilatéral, gauche puis droite",
    });
    expect(strings.shared.sideMode.activity.inheritedAccessibilitySuffix).toBe(
      "défini par le Tour, indisponible",
    );
    // V2-PRE-1 (critère UI-73382D60E040, assertion
    // UI-73382D60E040-A3E11D4F3FF2A, round 3) : le plan approuvé demande
    // "Aucun" ici — `SideModeControl.test.tsx` (désormais dans `scope_allow`)
    // a été adapté en conséquence.
    expect(strings.shared.sideMode.valueLabels.UNILATERAL).toBe("Aucun");
  });

  it("exposes the exact Tour accessible direction labels, and the '–' unilateral visible value, distinct from the Activity's empty value (plan '## 4.2')", () => {
    expect(strings.shared.sideMode.tour.accessibilityLabels).toEqual({
      UNILATERAL: "Direction du Tour : unilatéral",
      RIGHT_LEFT: "Direction du Tour : droite puis gauche",
      LEFT_RIGHT: "Direction du Tour : gauche puis droite",
    });
    expect(strings.shared.sideMode.tour.valueLabels).toEqual({
      UNILATERAL: "–",
      RIGHT_LEFT: "D→G",
      LEFT_RIGHT: "G→D",
    });
    expect(strings.shared.sideMode.tour.valueLabels.UNILATERAL).not.toBe(
      strings.shared.sideMode.valueLabels.UNILATERAL,
    );
  });
});

/**
 * PRE-3 (P3-20/contract-i18n) — libellés français des surfaces Paramètres,
 * médias et cartes ; les groupes existants restent intacts.
 */
describe("strings — PRE-3", () => {
  it("P3-20/contract-i18n — libellés PRE-3 des surfaces, modes et erreurs ; groupes existants conservés", () => {
    const pre3 = strings.executionParameters;
    expect(pre3.sheet.title).toBe("Paramètres d’exécution");
    // PRE-4 (story 1.1, AC22) : deux Modes seulement ; « à l’échec » reste le texte d’une Cible.
    expect(pre3.sheet.modes).toEqual({ DURATION: "Durée", REPETITIONS: "Répétitions" });
    expect(pre3.sheet.failureTarget).toBe("à l’échec");
    // PRE-5 story 2.5 (AC5) : libellés anatomiques `sideModes` retirés (voir « strings — PRE-5 story 2.5 »).
    expect(pre3.sheet.sideOrders).toEqual({
      BY_SIDE: "Un côté après l’autre",
      BY_SERIES: "Les deux côtés à chaque série",
    });
    for (const label of [pre3.sheet.pause, pre3.sheet.cadence, pre3.sheet.sideRecovery, pre3.sheet.countdown, pre3.sheet.end]) {
      expect(label.length).toBeGreaterThan(0);
    }
    expect(pre3.sheet.incompleteSeries.DURATION.replace("{n}", "2")).toBe("Série 2 : renseignez la durée.");
    expect(pre3.sheet.adjusted).toContain("{duration}");
    expect(Object.keys(pre3.media.errors).sort()).toEqual(["COPY_FAILED", "ERROR", "INCOMPATIBLE", "STORAGE_FULL"]);
    // PRE-4 story 4.2 (Q23, AC14) : clé du bouton de Mode retirée ; E-21 : invite H22 retirée.
    expect("chooseMode" in pre3.card).toBe(false);
    expect("emptyPrompt" in pre3.card).toBe(false);
    // Groupes existants conservés à l'identique.
    expect(strings.nav.sessions).toBe("Séances");
    expect(strings.screens.activities.editor.titleAdd).toBe("Créer un exercice");
    expect(strings.screens.exercise.finishAction).toBe("Terminer");
  });
});

describe("strings — PRE-4 story 1.1", () => {
  it("PRE4-1.1/AC22 — liste des Modes à deux entrées, ordre Durée puis Répétitions ; « à l’échec » reste le texte d’une Cible ; résumé tout échec « à l’échec » (Q24)", () => {
    expect(Object.keys(strings.executionParameters.sheet.modes)).toEqual(["DURATION", "REPETITIONS"]);
    expect(Object.values(strings.executionParameters.sheet.modes)).not.toContain("À l’échec");
    expect(strings.executionParameters.sheet.failureTarget).toBe("à l’échec");
    expect(Object.keys(strings.screens.exercise.executionMode)).not.toContain("toFailure");
    expect(strings.screens.composition.exerciseRow.toFailure).toBe("à l’échec");
  });

  it("PRE4-1.1/AC24 — indices de validation neutres : « à renseigner » seulement pour une valeur manquante", () => {
    expect(strings.executionParameters.sheet.invalidHint).toBe("Valeur à renseigner");
    expect(strings.executionParameters.sheet.invalidValueHint).toBe("Valeur non admise");
    expect(strings.executionParameters.sheet.validateUnavailableSuffix).toBe("indisponible tant qu’une valeur est invalide");
  });

  it("PRE-6 story 3.3 — nombre de séries imposé par le Circuit de Séries (nom accessible et indice)", () => {
    expect(strings.executionParameters.circuit.inheritedSeriesCountSuffix).toBe("imposé par le circuit");
    expect(strings.executionParameters.circuit.inheritedSeriesCount).toBe("Nombre de séries imposé par le circuit");
  });
});

describe("strings — PRE-4 story 2.2", () => {
  it("PRE4-2.2/AC6 — préfixes uniques de la nature d'une durée : « ≈ » estimée, « ≥ » borne minimale (NFR-08)", () => {
    expect(strings.shared.durationNature).toEqual({ estimatedPrefix: "≈ ", lowerBoundPrefix: "≥ " });
  });

  it("PRE4-2.2/AC6 — les préfixes du domaine (`totalClauseAmount`, exempté du lexique, AD-11) sont identiques aux clés du lexique", () => {
    const { estimatedPrefix, lowerBoundPrefix } = strings.shared.durationNature;
    const result = (kind: "estimated" | "lowerBound") => ({ kind, seconds: 90, knownSeconds: 90, events: [] });
    expect(totalClauseAmount(result("estimated"))).toBe(`${estimatedPrefix}1 min 30 s`);
    expect(totalClauseAmount(result("lowerBound"))).toBe(`${lowerBoundPrefix}1 min 30 s`);
  });
});

describe("strings — PRE-5 story 2.4", () => {
  it("PRE5-2.4/AC9 — clés de la Feuille : Mode, Condition d’arrêt et ses trois résultats, Type de série (RC-15 : nombre porté par l’option sélectionnée, plus de « Nombre de séries ») ; Régime retiré ; aucun « Cible », « Définie » ni « Ordre » réintroduit", () => {
    const sheet = strings.executionParameters.sheet;
    expect(sheet.mode).toBe("Mode");
    expect(sheet.stopCondition).toBe("Condition d’arrêt");
    expect(sheet.stopConditions).toEqual({ FAILURE: "À l’échec", TARGET: "À l’objectif", MIXED: "À l’objectif et à l’échec" });
    // Recette du 20/10 (RC-15) : la ligne « Nombre de séries » est retirée.
    expect("seriesCount" in sheet).toBe(false);
    // Recette du 20/10 (RC-17) : la ligne du segmenté « Variables | Identiques » s'intitule « Séries ».
    expect(sheet.seriesType).toBe("Séries");
    expect([sheet.seriesCountUniform, sheet.seriesCountUniformSingular]).toEqual(["{n} séries identiques", "{n} série identique"]);
    expect([sheet.seriesCountVariable, sheet.seriesCountVariableSingular]).toEqual(["{n} séries variables", "{n} série variable"]);
    expect(sheet.seriesTypes).toEqual({ VARIABLE: "Variables", UNIFORM: "Identiques" });
    // NR Δ38 (RC-15 : présentation seule remplacée) : le nom accessible du stepper de N reste « Séries » ; chevron du tableau inchangé.
    expect(sheet.series).toBe("Séries");
    expect([sheet.showTable, sheet.hideTable]).toEqual(["Afficher le tableau des séries", "Masquer le tableau des séries"]);
    for (const removed of ["regime", "regimes", "regimeSubtitles"]) {
      expect({ removed, present: removed in sheet }).toEqual({ removed, present: false });
    }
    const added = [sheet.mode, sheet.stopCondition, sheet.seriesType, ...Object.values(sheet.stopConditions), ...Object.values(sheet.seriesTypes)];
    expect(added.filter((label) => /(^|\s)(Cible|Définie|Ordre)(\s|$)/u.test(label))).toEqual([]);
  });
});

describe("strings — PRE-5 story 2.5", () => {
  it("PRE5-2.5/AC5 — clés des cadres Côtés et Cadence et durée : Changement de côté Avec / Sans, Enchainement à notations ➜ (D-431, rétablies par RC-12), Cadence et options, Durée de l’exercice ; clés orphelines retirées ; « Durée totale » de la Phrase intacte", () => {
    const sheet = strings.executionParameters.sheet;
    expect(sheet.sideMode).toBe("Changement de côté");
    expect(sheet.sideModeChoices).toEqual({ WITH: "Avec", WITHOUT: "Sans" });
    expect(sheet.sideSequence).toBe("Enchainement");
    // Notations graphiques exactes de la frame `8328:38193` (D-431), flèche centrale ➜ ; rétablies
    // par la recette du 19/10 (RC-12) après le raccourcissement de RC-11.
    expect(sheet.sideOrderSubtitles).toEqual({ BY_SIDE: "(D1 → D2) ➜ (G1 → G2)", BY_SERIES: "(D1 → G1) ➜ (D2 → G2)" });
    // Nom accessible neutre des options (D-407).
    expect(sheet.sideOrders).toEqual({ BY_SIDE: "Un côté après l’autre", BY_SERIES: "Les deux côtés à chaque série" });
    expect(sheet.cadence).toBe("Cadence");
    expect(sheet.cadenceOptions).toEqual({ OTHER: "Autre", "1": "1 s", NONE: "Sans" }); // RC-10
    expect(sheet.exerciseDuration).toBe("Durée de l’exercice");
    // D-433 : le symbole ≈ quitte le titre (collé à la valeur) ; la clé `exerciseDurationEstimated`
    // est supprimée. Ligne toujours affichée : « Non calculable » et annonce de « — ».
    expect("exerciseDurationEstimated" in sheet).toBe(false);
    expect(sheet.totalNotCalculable).toBe("Non calculable");
    expect(sheet.totalMissingSpoken).toBe("données manquantes");
    expect(sheet.exerciseDurationEditAccessibilityLabel).toBe("Durée de l’exercice, ajuster le nombre de séries");
    for (const label of [sheet.showExerciseSignals, sheet.hideExerciseSignals]) {
      expect(label.length).toBeGreaterThan(0);
    }
    // Recette du 19/10 (RC-6) : menu de l'Enchainement dans l'option Avec, chevron de repli retiré.
    for (const removed of ["showSideSettings", "hideSideSettings", "sideModes", "sideModeOptions", "sideOrder", "beep", "beepNone", "total", "totalEstimated", "totalEditAccessibilityLabel"]) {
      expect({ removed, present: removed in sheet }).toEqual({ removed, present: false });
    }
    // Aucune désignation anatomique ni « Durée totale » dans les libellés de la Feuille.
    const labels = JSON.stringify(sheet);
    expect(labels).not.toMatch(/Droite puis|Gauche puis|Sans changement|Bip de cadence|Durée totale|Ordre des côtés/u);
    // Identifiants techniques non renommés : `sideOrders` garde ses clés `SideOrder`.
    expect(Object.keys(sheet.sideOrders)).toEqual(["BY_SIDE", "BY_SERIES"]);
  });
});
