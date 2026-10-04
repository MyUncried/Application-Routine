import { describe, expect, it } from "@jest/globals";

import { strings } from "@/shared/i18n";

describe("strings", () => {
  it("exposes the four main tab labels in French, plus the distinct Recherche label (AUD-02); sessions is 'Séances' (RES-NAV-LABEL-01)", () => {
    expect(strings.nav).toEqual({
      sessions: "Séances",
      calendar: "Calendrier",
      history: "Suivi",
      profile: "Profil",
      search: "Recherche",
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
    });
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
      circuits: "Circuits",
      activitiesUnavailableAccessibilityLabel: "Exercices — indisponible",
      circuitsUnavailableAccessibilityLabel: "Circuits — indisponible",
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
    expect(strings.screens.composition.title).toBe("Composition d’une séance");
    expect(strings.screens.composition.name).toBe("Nom de la séance");
    expect(strings.screens.composition.colorPicker).toEqual({
      label: "Couleur",
      paletteAccessibilityLabel: "Palette de couleurs",
      swatchAccessibilityLabel: "Couleur",
    });
    expect(strings.screens.composition.label).toEqual({
      accessibilityLabel: "Étiquette de la séance",
    });
    expect(strings.screens.composition.countdown.label).toBe("Compte à rebours initial");
    expect(strings.screens.composition.finalPhase.label).toBe("Fin de séance");
    expect(strings.screens.composition.tour.label).toBe("Nombre de tours");
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
    expect(strings.screens.composition.continueAction).toBe("Continuer");
  });

  it("exposes the exact local Composition empty-summary label (V2 — singular, distinct from formatActivityCount(0))", () => {
    expect(strings.screens.composition.summary.empty).toBe("0 exercice · 0 min");
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
      durationUnitMinutes: "min",
      durationUnitSeconds: "s",
      of: "de",
      withPause: "avec",
      pauseSuffix: "de pause par série",
      toFailure: "jusqu’à l’échec",
      // V2-BILAT-01 (plan `## UI`, « Composition cards and summaries ») :
      // clause de côté d'une carte Activité à direction PROPRE bilatérale.
      perSide: "par côté",
      sideDirectionSuffixRightLeft: ", à droite, puis à gauche",
      sideDirectionSuffixLeftRight: ", à gauche, puis à droite",
    });
  });

  it("T02-S02 — exposes the attached-Récupération sub-card label of a Composition card (D-095/D-128/D-138)", () => {
    expect(strings.screens.composition.activityRecovery).toEqual({
      label: "Récupération",
      accessibilityLabel: "Récupération attachée",
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
      toFailure: "À l’échec",
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
    expect(strings.screens.exercise.titleAdd).toBe("Ajouter un exercice");
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
