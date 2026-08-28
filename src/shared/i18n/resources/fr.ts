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
    sessions: "Mes séances",
    calendar: "Calendrier",
    history: "Suivi",
    profile: "Profil",
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
        label: "Tour",
      },
      wheelPicker: {
        minutesAccessibilityLabel: "Minutes",
        secondsAccessibilityLabel: "Secondes",
      },
      addActivity: "Ajouter une activité",
      continueAction: "Continuer",
      summary: {
        empty: "0 activité · 0 min",
      },
      abandonModal: {
        title: "Abandonner la création ?",
        message: "Les informations saisies seront perdues et la séance ne sera pas créée.",
        continueCreating: "Continuer la création",
        abandon: "Abandonner",
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
      titleAdd: "Ajouter une activité",
      titleEdit: "Modifier une activité",
      backAccessibilityLabel: "Retour",
      name: "Nom",
      executionMode: {
        label: "Mode d’exécution",
        duration: "Durée",
        repetitions: "Répétition",
      },
      duration: {
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
      },
      pauseSeconds: {
        label: "Pause après Série",
      },
      seriesCount: {
        label: "Nombre de Séries",
        accessibilityLabel: "Nombre de Séries",
      },
      wheelPicker: {
        minutesAccessibilityLabel: "Minutes",
        secondsAccessibilityLabel: "Secondes",
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
        continueEditing: "Continuer la modification",
        abandon: "Abandonner",
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
