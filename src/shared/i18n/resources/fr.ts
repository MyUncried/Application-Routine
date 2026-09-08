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
      // T01-S10 (D-108, doc13 §8) : le contrôle principal du Catalogue est
      // désormais un sélecteur de TYPE de contenu — `Séances` seul actif,
      // `Activités`/`Circuits` visibles mais désactivés. Il ne filtre jamais
      // les Séances.
      contentTypes: {
        activities: "Activités",
        sessions: "Séances",
        circuits: "Circuits",
        // Nom accessible des segments désactivés — annonce explicitement
        // l'indisponibilité MVP (D-108).
        activitiesUnavailableAccessibilityLabel: "Activités — indisponible",
        circuitsUnavailableAccessibilityLabel: "Circuits — indisponible",
      },
      // T01-S10 (D-109) : `Toutes`/`Planifiées`/`Archivées` restent des
      // filtres de domaine FUTURS — jamais rendus comme contrôle principal
      // (les anciens libellés sont interdits à cet emplacement, doc13 §8).
      // Conservés ici pour l'ajout ultérieur, sans bouton nouveau.
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
        // T01-S10 (CE-T01-S10-01) : la zone principale de la carte ouvre
        // `Composition d'une séance` en MODIFICATION (transmet uniquement
        // `sessionId`).
        openAccessibilityLabel: "Modifier la séance",
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
      // T01-S10 (CE-T01-S10-01/02/09) : états de la réhydratation d'une
      // Séance existante ouverte en MODIFICATION. Le Catalogue reste la
      // destination sûre en cas d'échec — aucune mutation de données.
      editStates: {
        loadingAccessibilityLabel: "Chargement de la séance en cours",
        errorMessage: "Impossible de charger cette séance.",
        retry: "Réessayer",
        notFoundMessage: "Cette séance est introuvable.",
        archivedMessage: "Cette séance est archivée et ne peut pas être modifiée.",
        backToCatalogue: "Revenir au catalogue",
      },
      tour: {
        // T-03 (contre-recette iPhone, `[ChatGPT] DEVICE NO-GO — PHASE02
        // REWORK03 CUMULATIVE CORRECTION`, 2026-09-03) : libellé exact
        // remplacé, auparavant "Tour" seul.
        label: "Nombre de tours",
        // T02-S01 (CE-T02-01, « Nombre de Tours ») : le contrôle devient
        // réellement pressable et ouvre la roulette numérique `1..99`.
        valueAccessibilityLabel: "Nombre de tours",
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
      // T02-S01 (CE-T02-01/CE-T02-02, D-124/D-127) : gestes et actions
      // glissées d'une carte Activité. Les deux libellés `Dupliquer` et
      // `Supprimer` sont ceux, exacts, du groupe `144 × 69` de la frame
      // `2028:11808`.
      activityActions: {
        duplicate: "Dupliquer",
        delete: "Supprimer",
        revealAccessibilityLabel: "Actions de l’activité",
        reorderAccessibilityHint:
          "Appui long pour déplacer l’activité, glissement vers la gauche pour afficher les actions",
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
        // T01-S10 (D-111) : fragment des synthèses du mode « À l'échec ».
        toFailure: "jusqu’à l’échec",
      },
    },
    exercise: {
      // REWORK09 (mission directe utilisateur, 2026-09-04, points 1/2) :
      // `titleAdd`/`titleEdit` — l'ancien grand titre local du corps
      // défilant — étaient supprimés avec lui, l'en-tête fixe partagé
      // affichant alors le nom réel de la Séance.
      //
      // Complétion REWORK12 (`[ChatGPT] Applique impérativement le
      // protocole KODJO actif...`, 2026-09-04, D-105) : **réintroduits**,
      // désormais avec leur sens original de titre fonctionnel d'écran —
      // le nom de la Séance n'est plus utilisé comme titre (déplacé dans
      // la zone bleue contextuelle, voir `context` ci-dessous). Frame
      // Figma `1992:9132`/`1992:9212` (« Ajouter une activité ») —
      // « Modifier une activité » n'a pas de frame Figma dédiée mais est
      // explicitement demandée par l'autorisation, même patron que
      // `08 – Conception fonctionnelle détaillée.md` (« Titre de l'écran »).
      titleAdd: "Ajouter une activité",
      titleEdit: "Modifier une activité",
      // Étape 2 (CE-T01-15, `1992:9292`) : titre fonctionnel propre à cette
      // étape, distinct de `titleAdd`/`titleEdit` — jamais de distinction
      // création/modification à cette étape (vérifié directement, aucune
      // frame Figma dédiée à une variante « modification » de cette étape).
      titleInformation: "Informations complémentaires",
      backAccessibilityLabel: "Retour",
      // Complétion REWORK12 (D-105) : « Zone bleue — Contexte séance et nom
      // de l'activité » (`3261:4151`/`3261:4160`) — `prefix` compose
      // `"${prefix} · ${nom de la séance}"`, jamais un littéral local dans
      // `ExerciseScreen.tsx`.
      // T01-S10 (doc13 §8) : le bandeau bleu ne rappelle plus le nom de la
      // Séance — `context.prefix` n'a plus de consommateur dans
      // `ExerciseScreen.tsx`. Clé conservée (aucun renommage/suppression
      // demandé) mais RETIRÉE de l'écran.
      context: {
        prefix: "Séance",
      },
      type: {
        label: "Type d’activité",
        exercise: "Exercice",
        recovery: "Récupération",
      },
      // REWORK09, point 2/3 : « Nom » → « Nom de l'activité » (`Forms /
      // Text Field — Source exact`, libellé visible ET accessibilityLabel
      // du champ — même chaîne réutilisée pour les deux, patron déjà
      // établi). Complétion REWORK12 : réutilisée telle quelle comme
      // placeholder du champ, désormais logé dans la zone bleue
      // contextuelle plutôt que comme un champ autonome.
      name: "Nom de l’activité",
      executionMode: {
        label: "Mode d’exécution",
        duration: "Durée",
        // Correction compacte LOT_3_OF_3 (demande utilisateur directe) :
        // « Répétition » → « Répétitions », au PLURIEL, dans le segment
        // « Durée / Répétitions / À l'échec ». Aligne ce libellé de mode sur
        // `repetitionCount.compactLabel` (« Répétitions », déjà au pluriel
        // depuis REWORK09) : le mode désigne un NOMBRE de répétitions, jamais
        // une répétition unique. Les deux chaînes deviennent identiques mais
        // restent deux clés distinctes (onglet de mode / libellé de colonne
        // compacte), exactement comme « Durée » l'est déjà des deux côtés —
        // leurs noms accessibles, eux, restent distincts
        // (`repetitionCount.accessibilityLabel` = « Nombre de répétitions »),
        // aucune requête d'accessibilité ne devient donc ambiguë.
        repetitions: "Répétitions",
        // T01-S10 (D-111, frame `3369:4236`) : troisième option de mode
        // d'Exercice, de même largeur — masque Durée et Répétitions cibles.
        toFailure: "À l’échec",
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
      // REWORK09, point 8 « cadre récapitulatif » — fragments propres à
      // cette formulation, distincts de `composition.exerciseRow`
      // (réutilisé par ailleurs pour `min`/`s`/pluriels/« de »/« avec »,
      // voir `compositionPresentation.ts`, `formatExerciseRecap`).
      //
      // Complétion REWORK12 (D-105) : `modePrefix` (« Mode ») n'a plus de
      // consommateur — la synthèse ne préfixe plus jamais par le type ni le
      // mode d'exécution, vérifié directement sur `3261:4157`/`3261:4166`
      // — supprimé plutôt que laissé mort. `pauseSuffix` (« de pause entre
      // les séries ») est scindé : `pauseLabel` (« de pause ») s'applique
      // toujours dès qu'une pause existe, `pauseSuffix` (« entre les
      // séries ») uniquement lorsque `seriesCount > 1`.
      recap: {
        pauseLabel: "de pause",
        pauseSuffix: "entre les séries",
      },
      instruction: {
        label: "Consigne",
      },
      bodyZones: {
        label: "Zones corporelles",
        accessibilityLabel: "Zones corporelles",
      },
      // T01-S10 (doc13 §8, frame `1992:9132`) : bouton centré, VISIBLE mais
      // DÉSACTIVÉ dans le MVP — aucune section Médias, aucun import/galerie/
      // lecture/stockage (Médias V2 hors périmètre).
      // Correctif T02 (2026-09-08, point 5) : le `+` n'est plus porté par ce
      // libellé — il est rendu séparément par l'icône DSF `action-add`
      // (`ExerciseScreen.tsx`), jamais comme caractère de texte concaténé.
      addMedia: "Ajouter un média",
      addMediaUnavailableAccessibilityLabel: "Ajouter un média — indisponible",
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
    // T01-S09 (CE-T01-11/CE-T01-12, D-106/D-107) : aucun texte introductif
    // supplémentaire n'est affiché sur cet écran — le titre de section
    // (`sectionLabel`) et les tags suffisent, conformément à D-106.
    categories: {
      title: "Catégories de la séance",
      backAccessibilityLabel: "Retour",
      sectionLabel: "Catégories",
      createAction: "Créer une catégorie",
      tagAccessibility: {
        selectedSuffix: "sélectionnée",
      },
      newCategory: {
        placeholder: "Nom de la catégorie",
        cancelAccessibilityLabel: "Annuler",
        addAccessibilityLabel: "Ajouter",
      },
      loading: {
        accessibilityLabel: "Chargement des catégories en cours",
      },
      error: {
        message: "Impossible de charger vos catégories.",
        retry: "Réessayer",
      },
      saveAction: "Enregistrer la séance",
      // D-107 : message exact, reproduit mot pour mot — n'importe quelle
      // reformulation locale serait non conforme.
      saveError: "La séance n’a pas pu être enregistrée. Réessayez.",
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
