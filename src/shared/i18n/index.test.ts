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
    const tabScreens = [strings.screens.calendar, strings.screens.history, strings.screens.profile];

    for (const screen of tabScreens) {
      expect(screen.title.length).toBeGreaterThan(0);
      expect(screen.placeholder.length).toBeGreaterThan(0);
    }
  });

  it("exposes the Catalogue screen title (T01-S06 — no placeholder, it has a real UI)", () => {
    expect(strings.screens.sessions.title.length).toBeGreaterThan(0);
  });

  it("exposes the Catalogue filter labels", () => {
    expect(strings.screens.sessions.filters).toEqual({
      all: "Toutes",
      scheduled: "Planifiées",
      archived: "Archivées",
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
      activitySingular: "activité",
      activityPlural: "activités",
      tourSingular: "tour",
      tourPlural: "tours",
      durationUnit: "min",
      expandAccessibilityLabel: "Déployer la séance",
      startAccessibilityLabel: "Démarrer la séance",
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
    expect(strings.screens.composition.countdown.label).toBe("Compte à rebours initial");
    expect(strings.screens.composition.finalPhase.label).toBe("Fin de séance");
    expect(strings.screens.composition.tour.label).toBe("Nombre de tours");
    expect(strings.screens.composition.wheelPicker).toEqual({
      minutesAccessibilityLabel: "Minutes",
      secondsAccessibilityLabel: "Secondes",
      cancelAccessibilityLabel: "Annuler",
      validateAccessibilityLabel: "Valider",
    });
    expect(strings.screens.composition.addActivity).toBe("Ajouter une activité");
    expect(strings.screens.composition.continueAction).toBe("Continuer");
  });

  it("exposes the exact local Composition empty-summary label (V2 — singular, distinct from formatActivityCount(0))", () => {
    expect(strings.screens.composition.summary.empty).toBe("0 activité · 0 min");
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

  it("exposes the exact exercise-row summary lexical fragments (T01-S08, CHANGES_REQUESTED, D-095)", () => {
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
    expect(strings.screens.exercise.name).toBe("Nom de l’activité");
    expect(strings.screens.exercise.executionMode).toEqual({
      label: "Mode d’exécution",
      duration: "Durée",
      repetitions: "Répétition",
    });
    expect(strings.screens.exercise.wheelPicker).toEqual({
      minutesAccessibilityLabel: "Minutes",
      secondsAccessibilityLabel: "Secondes",
      cancelAccessibilityLabel: "Annuler",
      validateAccessibilityLabel: "Valider",
    });
    expect(strings.screens.exercise.validateAction).toBe("Valider");
    expect(strings.screens.exercise.finishAction).toBe("Terminer");
    expect(strings.screens.exercise.instruction.label).toBe("Consigne");
    expect(strings.screens.exercise.bodyZones.label).toBe("Zones corporelles");
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
    });
    expect(strings.screens.exercise.recap.pauseSuffix).not.toBe(
      strings.screens.composition.exerciseRow.pauseSuffix,
    );
  });

  it("REWORK12 — exposes the functional titles Ajouter/Modifier une activité and Informations complémentaires, and the Séance context prefix (D-105)", () => {
    expect(strings.screens.exercise.titleAdd).toBe("Ajouter une activité");
    expect(strings.screens.exercise.titleEdit).toBe("Modifier une activité");
    expect(strings.screens.exercise.titleInformation).toBe("Informations complémentaires");
    expect(strings.screens.exercise.context).toEqual({ prefix: "Séance" });
  });

  it("exposes the Exercise Type segment (Exercice/Récupération) and the Paramètres section title (CE-T01-13, AUD-08)", () => {
    expect(strings.screens.exercise.type).toEqual({
      label: "Type d’activité",
      exercise: "Exercice",
      recovery: "Récupération",
    });
    expect(strings.screens.exercise.parametersTitle).toBe("Paramètres de l’activité");
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
      message: "Les modifications apportées à cette activité seront perdues.",
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
});
