/**
 * Catalogue de textes français.
 *
 * Le MVP est livré uniquement en français, sans sélecteur de langue
 * (voir docs/Specifications-fonctionnelles/12 – Architecture technique, §12.1
 * « Internationalisation » et décision D-034).
 *
 * Les clés sont stables et en anglais afin de rester indépendantes du texte
 * affiché ; seules les valeurs sont traduites. L’ajout d’une langue future
 * consistera à ajouter un fichier de ressources supplémentaire ici, sans
 * modifier la logique métier ni les composants qui consomment ces clés.
 */
export const fr = {
  errors: {
    root: {
      message: "Impossible d'afficher KODJO. Fermez puis relancez l'application.",
    },
  },
  nav: {
    // RES-NAV-LABEL-01 (contre-recette iPhone, addendum Phase 2,
    // 2026-09-03) : "Mes séances" → "Séances" — source i18n canonique,
    // pas un texte local injecté dans le composant de navigation.
    sessions: "Séances",
    calendar: "Calendrier",
    history: "Suivi",
    profile: "Profil",
    search: "Recherche",
  },
  screens: {
    notFound: {
      title: "Écran introuvable",
      backHome: "Retourner à l’accueil",
      accessibility: {
        title: "Écran introuvable",
        backHome: "Retourner à l’accueil",
      },
    },
    sessions: {
      title: "Catalogue des séances",
      filters: {
        all: "Toutes",
        scheduled: "Planifiées",
        archived: "Archivées",
      },
      createAction: "Créer",
      loading: {
        accessibilityLabel: "Chargement des séances en cours",
      },
      empty: {
        message:
          "Vous verrez ici la liste de vos séances dès que vous aurez commencé à les créer.",
      },
      error: {
        message: "Impossible de charger vos séances.",
        retry: "Réessayer",
      },
      card: {
        activitySingular: "activité",
        activityPlural: "activités",
        tourSingular: "tour",
        tourPlural: "tours",
        durationUnit: "min",
        expandAccessibilityLabel: "Déployer la séance",
        startAccessibilityLabel: "Démarrer la séance",
      },
    },
    composition: {
      title: "Composition d’une séance",
      backAccessibilityLabel: "Retour",
      name: "Nom de la séance",
      colorPicker: {
        label: "Couleur",
        paletteAccessibilityLabel: "Palette de couleurs",
        swatchAccessibilityLabel: "Couleur",
      },
      countdown: {
        label: "Compte à rebours initial",
      },
      finalPhase: {
        label: "Fin de séance",
      },
      tour: {
        // T-03 (contre-recette iPhone, `[ChatGPT] DEVICE NO-GO — PHASE02
        // REWORK03 CUMULATIVE CORRECTION`, 2026-09-03) : libellé exact
        // remplacé, auparavant "Tour" seul.
        label: "Nombre de tours",
      },
      wheelPicker: {
        minutesAccessibilityLabel: "Minutes",
        secondsAccessibilityLabel: "Secondes",
        // R4-09 (`[ChatGPT] REWORK04 IMPLEMENTATION AUTHORIZED — DESIGN
        // COMPLEMENTS REVIEWED`, 2026-09-03) : toolbar Annuler/Valider.
        cancelAccessibilityLabel: "Annuler",
        validateAccessibilityLabel: "Valider",
      },
      addActivity: "Ajouter une activité",
      continueAction: "Continuer",
      summary: {
        empty: "0 activité · 0 min",
      },
      abandonModal: {
        title: "Abandonner la création ?",
        message: "Les informations saisies seront perdues et la séance ne sera pas créée.",
        // REWORK10 (`[ChatGPT] CHANGES_REQUESTED — REWORK10 — dialogue
        // d'abandon de création`, 2026-09-04) : « Continuer la création »
        // → « Annuler », « Abandonner » → « Confirmer » — vérifié
        // directement sur l'instance `2591:3083` de la frame CE-T01-08
        // (`2028:11298`). Clés inchangées (`continueCreating`/`abandon`) :
        // seule la valeur affichée change, aucun renommage de clé —
        // `onCancel`/`onConfirm` (props du composant) portaient déjà la
        // sémantique correcte avant ce cycle.
        continueCreating: "Annuler",
        abandon: "Confirmer",
      },
      exerciseRow: {
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
      },
    },
    exercise: {
      // REWORK09 (mission directe utilisateur, 2026-09-04, points 1/2) :
      // `titleAdd`/`titleEdit` — l'ancien grand titre local du corps
      // défilant — sont supprimés avec lui ; l'en-tête fixe partagé affiche
      // désormais le nom réel de la Séance (`FixedHeader`, comme
      // `CompositionScreen.tsx`), jamais un titre d'écran distinct.
      backAccessibilityLabel: "Retour",
      type: {
        label: "Type d’activité",
        exercise: "Exercice",
        recovery: "Récupération",
      },
      // REWORK09, point 2/3 : « Nom » → « Nom de l'activité » (`Forms /
      // Text Field — Source exact`, libellé visible ET accessibilityLabel
      // du champ — même chaîne réutilisée pour les deux, patron déjà
      // établi).
      name: "Nom de l’activité",
      executionMode: {
        label: "Mode d’exécution",
        duration: "Durée",
        repetitions: "Répétition",
      },
      parametersTitle: "Paramètres de l’activité",
      duration: {
        // Déjà conforme au libellé compact Figma (« Durée ») — aucun
        // changement de valeur nécessaire.
        label: "Durée",
        // Distinct de `executionMode.duration` (même mot, deux contrôles
        // différents : l'onglet de mode et la ligne roulette) — un même
        // `accessibilityLabel` sur les deux rendrait l'un inatteignable par
        // requête d'accessibilité univoque.
        accessibilityLabel: "Durée de l’exercice",
      },
      repetitionCount: {
        label: "Nombre de répétitions",
        accessibilityLabel: "Nombre de répétitions",
        // Distincte de `accessibilityLabel` (ligne) : `NumberWheelPicker`
        // reçoit un unique `accessibilityLabel`, qui entrait en collision
        // avec celui de la ligne une fois le sélecteur ouvert (audit
        // `T01_S01_S08_CONFORMITY_AUDIT_20260902.md`, AUD-05).
        wheelAccessibilityLabel: "Roulette nombre de répétitions",
        // REWORK09, point 6 : libellé COURT affiché au-dessus du contrôle
        // compact (`Activity / Parameter Row — Source exact`) — distinct
        // de `label`/`accessibilityLabel` ci-dessus, conservés inchangés
        // pour le nom accessible complet.
        compactLabel: "Répétitions",
      },
      pauseSeconds: {
        label: "Pause après Série",
        // REWORK09, point 6 : nom accessible explicite — auparavant
        // confondu avec `label`, désormais distinct du libellé compact
        // visible ci-dessous (même patron que `duration`).
        accessibilityLabel: "Pause après Série",
        compactLabel: "Pause",
      },
      seriesCount: {
        label: "Nombre de Séries",
        accessibilityLabel: "Nombre de Séries",
        wheelAccessibilityLabel: "Roulette nombre de Séries",
        // REWORK09, point 6.
        compactLabel: "Séries",
      },
      wheelPicker: {
        minutesAccessibilityLabel: "Minutes",
        secondsAccessibilityLabel: "Secondes",
        // R4-09 : même contrat toolbar Annuler/Valider que Composition —
        // câblage mécanique nécessaire au nouveau contrat de props partagé
        // de `DurationWheelPicker`, hors périmètre visuel de cette revue.
        cancelAccessibilityLabel: "Annuler",
        validateAccessibilityLabel: "Valider",
      },
      // REWORK09, point 8 « cadre récapitulatif » — deux fragments propres
      // à cette formulation, distincts de `composition.exerciseRow`
      // (réutilisé par ailleurs pour `min`/`s`/pluriels/« de »/« avec »,
      // voir `compositionPresentation.ts`, `formatExerciseRecap`).
      recap: {
        modePrefix: "Mode",
        pauseSuffix: "de pause entre les séries",
      },
      instruction: {
        label: "Consigne",
      },
      bodyZones: {
        label: "Zones corporelles",
        accessibilityLabel: "Zones corporelles",
      },
      validateAction: "Valider",
      finishAction: "Terminer",
      exitConfirmModal: {
        title: "Abandonner les modifications ?",
        message: "Les modifications apportées à cette activité seront perdues.",
        // REWORK11 (`[ChatGPT] CHANGES_REQUESTED — REWORK11 — dialogue
        // d'abandon d'une Activité`, 2026-09-04) : « Continuer la
        // modification » → « Annuler », « Abandonner » → « Confirmer » —
        // vérifié directement sur l'instance `3224:4140` (frame CE-T01-16,
        // `3224:4082`). Mêmes clés (`continueEditing`/`abandon`), mêmes
        // props `onCancel`/`onConfirm` déjà correctement nommées ;
        // même correction que REWORK10 sur `composition.abandonModal`.
        continueEditing: "Annuler",
        abandon: "Confirmer",
      },
    },
    calendar: {
      title: "Calendrier",
      placeholder:
        "Le calendrier des routines sera développé dans une prochaine tranche.",
    },
    history: {
      title: "Suivi",
      placeholder:
        "Le suivi des exécutions sera développé dans une prochaine tranche.",
    },
    profile: {
      title: "Profil",
      placeholder:
        "Les préférences globales seront développées dans une prochaine tranche.",
    },
  },
} as const;
