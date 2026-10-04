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
        UNILATERAL: "Aucun",
        RIGHT_LEFT: "D→G",
        LEFT_RIGHT: "G→D",
      },
      // Contrôle `Côté` d'une Activité (`ExerciseScreen`) — titre visible
      // `Côté` (singulier), noms accessibles exacts du plan V2-BILAT-01.
      activity: {
        label: "Côté",
        accessibilityLabels: {
          // V2-PRE-1 (plan §12, critère UI-73382D60E040) : terminologie
          // cible validée — « Changement de côté : Aucun ».
          UNILATERAL: "Changement de côté : Aucun",
          RIGHT_LEFT: "Côté : bilatéral, droite puis gauche",
          LEFT_RIGHT: "Côté : bilatéral, gauche puis droite",
        },
        // Suffixe ajouté au nom accessible lorsque le contrôle est
        // désactivé (enfant `IN_TOUR` d'un Tour déjà bilatéral, direction
        // hérité) — même convention de séparateur « — » que les autres
        // suffixes d'indisponibilité déjà établis dans ce fichier
        // (`activitiesUnavailableAccessibilityLabel`, etc.).
        inheritedAccessibilitySuffix: "défini par le Tour, indisponible",
      },
      // Contrôle `Direction du Tour` (`CompositionScreen`) — aucun titre
      // visible (« Côté »/« Côtés » proscrit par le plan pour ce contrôle),
      // noms accessibles exacts du plan V2-BILAT-01.
      tour: {
        accessibilityLabels: {
          UNILATERAL: "Direction du Tour : unilatéral",
          RIGHT_LEFT: "Direction du Tour : droite puis gauche",
          LEFT_RIGHT: "Direction du Tour : gauche puis droite",
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
          RIGHT_LEFT: "D→G",
          LEFT_RIGHT: "G→D",
        },
      },
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
      circuitsTitle: "Catalogue des circuits",
      // V2-CAT-01 (plan §4.5, revue 5732014381 obligation 1) : libellé
      // PERMANENT de la destination basse — distinct de `strings.nav.sessions`
      // (« Séances »), verrouillé par `src/shared/i18n/index.test.ts`, hors
      // périmètre d'écriture autorisé de cette tranche et donc jamais
      // modifiable ici. Cette clé dédiée permet au libellé de navigation de
      // devenir `Catalogues` sans toucher à cette égalité stricte externe.
      navLabel: "Catalogues",
      // T01-S10 (D-108, doc13 §8) : le contrôle principal du Catalogue est
      // désormais un sélecteur de TYPE de contenu — `Séances` seul actif,
      // `Activités`/`Circuits` visibles mais désactivés. Il ne filtre jamais
      // les Séances.
      contentTypes: {
        // V2-PRE-1 (plan §4/§12, critère UI-D35DA2C4F266) : terminologie
        // fonctionnelle cible — « Exercices » remplace « Activités ».
        activities: "Exercices",
        sessions: "Séances",
        circuits: "Circuits",
        // Nom accessible des segments désactivés — annonce explicitement
        // l'indisponibilité MVP (D-108).
        activitiesUnavailableAccessibilityLabel: "Exercices — indisponible",
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
        // V2-PRE-1 (critère UI-D35DA2C4F266) : « exercice(s) » remplace « activité(s) ».
        activitySingular: "exercice",
        activityPlural: "exercices",
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
      // V2-CAT-01 : arbre `Créer` du Catalogue — ancré à `Créer`, conserve la
      // rangée `Créer / Filtrer / Trier` sous le scrim. Seule `Une nouvelle
      // activité` est active dans cette tranche.
      createTree: {
        newActivity: "Un nouvel exercice",
        newSession: "Une séance",
        newCircuit: "Un circuit",
        cancel: "Annuler",
        circuitUnavailableAccessibilityLabel: "Un circuit — indisponible",
      },
      filterAction: "Filtrer",
      sortAction: "Trier",
    },
    // V2-CAT-01 : Catalogue des activités — segment `Activités` du Catalogue,
    // liste/création/modification d'`ActivityDefinition` persistantes.
    activities: {
      // V2-PRE-1 (critère UI-D35DA2C4F266) : « Exercice(s) » remplace
      // « Activité(s) » dans les libellés fonctionnels français — les
      // identifiants techniques (clés, `ActivityDefinition`) restent inchangés.
      title: "Catalogue des exercices",
      empty: {
        message:
          "Vous verrez ici la liste de vos exercices dès que vous en aurez créé un.",
      },
      error: {
        message: "Impossible de charger vos exercices.",
        retry: "Réessayer",
      },
      card: {
        deployAccessibilityLabel: "Déployer l’exercice",
        playAccessibilityLabel: "Lecture",
        openAccessibilityLabel: "Modifier l’exercice",
      },
      editor: {
        titleAdd: "Ajouter un exercice",
        titleEdit: "Modifier un exercice",
        backAccessibilityLabel: "Retour",
        name: "Nom de l’exercice",
        finishAction: "Terminer",
        saveError: "L’exercice n’a pas pu être enregistré. Réessayez.",
        media: {
          label: "Médias",
          expandAccessibilityLabel: "Déployer la section Médias",
          collapseAccessibilityLabel: "Replier la section Médias",
          addMedia: "Ajouter un média",
          addMediaUnavailableAccessibilityLabel: "Ajouter un média — indisponible",
          placeholder: "Aucun média pour cet exercice.",
        },
        // V2-PRE-1 (plan §3.1, D-211 ; `08 – Conception fonctionnelle
        // détaillée.md` l.978 ; `13 – Contrats d’écran.md` §4.10, Figma
        // 4861:6259) : Catégorie exactement une, obligatoire — bouton/pilule
        // ouvrant la modale de sélection, icône dans l'état non renseigné,
        // appui court pour sélectionner (contrat de modale déjà validé,
        // réutilisé sans nouvelle conception).
        category: {
          label: "Catégorie",
          unsetAccessibilityLabel: "Catégorie — non renseignée",
          modalTitle: "Catégorie",
          newCategory: {
            placeholder: "Nom de la catégorie",
            cancelAccessibilityLabel: "Annuler",
            addAccessibilityLabel: "Ajouter",
          },
          createAction: "Créer une catégorie",
          closeAccessibilityLabel: "Fermer",
        },
      },
      selection: {
        title: "Sélectionner un exercice",
        backAccessibilityLabel: "Retour",
        empty: {
          message: "Aucun exercice disponible pour le moment.",
        },
        addAction: "Ajouter",
        cancelAccessibilityLabel: "Annuler",
      },
      addToSession: {
        newActivity: "Un nouvel exercice",
        existingActivity: "Un exercice existant",
        cancel: "Annuler",
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
      // V2-PRE-2 (plan §6.5, CE-T03-16) : la pastille dérivée de l'Étiquette
      // devient un déclencheur interactif de `LabelPickerModal` — libellé
      // d'accessibilité DISTINCT de `colorPicker.label` (retiré, jamais
      // réintroduit) pour que le test « never renders an autonomous color
      // picker » reste probant.
      label: {
        accessibilityLabel: "Étiquette de la séance",
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
      // V2-PRE-1 (critère UI-D35DA2C4F266) : « exercice » remplace « activité ».
      addActivity: "Ajouter un exercice",
      continueAction: "Continuer",
      summary: {
        empty: "0 exercice · 0 min",
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
        title: "Exécuter chaque Tour des deux côtés ?",
        // V2-PRE-1 (critère UI-D35DA2C4F266) : « Exercice(s) » remplace « Activité(s) ».
        message:
          "À chaque Tour, tous les Exercices sont exécutés une fois d’un côté, puis une fois de l’autre, selon l’ordre choisi. Ce réglage remplace tout réglage de côté défini individuellement pour un Exercice.",
        cancel: "Annuler",
        confirm: "Confirmer",
      },
      // T02-S01 (CE-T02-01/CE-T02-02, D-124/D-127) : gestes et actions
      // glissées d'une carte Activité. Les deux libellés `Dupliquer` et
      // `Supprimer` sont ceux, exacts, du groupe `144 × 69` de la frame
      // `2028:11808`.
      // T02-S02 (D-095/D-128/D-138) : sous-carte `Récupération X min Y s`
      // attachée à la carte d'Activité — jamais une Activité, jamais une
      // ligne de plus dans le compte (`computeActivityCount` inchangé).
      activityRecovery: {
        label: "Récupération",
        accessibilityLabel: "Récupération attachée",
      },
      activityActions: {
        duplicate: "Dupliquer",
        delete: "Supprimer",
        // V2-PRE-1 (critère UI-D35DA2C4F266) : « exercice » remplace « activité ».
        revealAccessibilityLabel: "Actions de l’exercice",
        reorderAccessibilityHint:
          "Appui long pour déplacer l’exercice, glissement vers la gauche pour afficher les actions",
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
        // V2-BILAT-01 (plan `## UI`, « Composition cards and summaries ») :
        // clause de côté d'une carte Activité dont la direction PROPRE est
        // bilatérale (jamais héritée du Tour) — insérée immédiatement après
        // « {N} série(s) », avant le connecteur `of` (« de »)/`toFailure`
        // (« jusqu'à l'échec »), d'où « {N} série(s) par côté … ».
        perSide: "par côté",
        // Suffixe de direction, ajouté juste après la cible (ou après
        // `toFailure`), donc AVANT la clause de Pause — jamais pour une
        // Activité unilatérale ni pour une direction héritée du Tour.
        sideDirectionSuffixRightLeft: ", à droite, puis à gauche",
        sideDirectionSuffixLeftRight: ", à gauche, puis à droite",
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
      // V2-PRE-1 (critère UI-D35DA2C4F266) : « exercice » remplace « activité ».
      titleAdd: "Ajouter un exercice",
      titleEdit: "Modifier un exercice",
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
      // T02-S02 (D-137, CE-T01-13) : `type` (segment `Exercice / Récupération`)
      // et `parametersTitle` (« Paramètres de l'activité ») sont SUPPRIMÉS —
      // « L'écran Activité unique supprime le type et le titre `Paramètres de
      // l'activité` ». Clés retirées plutôt que laissées mortes, comme
      // `modePrefix` en son temps.
      //
      // Sections repliables de l'écran unifié (CE-T01-13/CE-T01-15) : la
      // Description et la Zone corporelle sont fermées par défaut, le Mode
      // d'exécution est déployé par défaut. Les trois titres partagent la
      // même typographie et le chevron DSF de déploiement.
      //
      // `expandAction`/`collapseAction` composent le NOM ACCESSIBLE de
      // l'en-tête de section (« Déployer la section {titre} ») — jamais le
      // titre seul : `sections.description` vaut exactement
      // `instruction.label`, et deux nœuds portant ce même nom rendraient
      // toute requête d'accessibilité ambiguë (le champ multiligne porte
      // déjà ce libellé, qui est le sien).
      //
      // T02-S02 (continuation après recette visuelle) : « Zone corporelle
      // d'exécution » devient « Zones corporelles » — la section accepte
      // PLUSIEURS Zones (sélection multiple, D-093), le singulier était donc
      // trompeur, et « d'exécution » redondant sur un écran d'Activité.
      sections: {
        description: "Description de l’exercice",
        bodyZones: "Zones corporelles",
        executionMode: "Mode d’exécution",
        expandAction: "Déployer la section",
        collapseAction: "Replier la section",
      },
      // REWORK09, point 2/3 : « Nom » → « Nom de l'activité » (`Forms /
      // Text Field — Source exact`, libellé visible ET accessibilityLabel
      // du champ — même chaîne réutilisée pour les deux, patron déjà
      // établi). Complétion REWORK12 : réutilisée telle quelle comme
      // placeholder du champ, désormais logé dans la zone bleue
      // contextuelle plutôt que comme un champ autonome.
      name: "Nom de l’exercice",
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
      // T02-S02 (CE-T01-13/CE-T01-14) : seconde rangée de paramètres,
      // `Récupération` à gauche puis `Durée totale` à droite. Les deux
      // héritent du contrat de roulette minutes/secondes (`Type=Duration`) —
      // aucun écran supplémentaire n'est requis.
      recoverySeconds: {
        label: "Récupération après les Séries",
        accessibilityLabel: "Récupération après les Séries",
        compactLabel: "Récupération",
      },
      // T02-S02 (seconde recette visuelle, point 9) : en modes `Répétitions`
      // et « À l'échec », la Durée totale reste AFFICHÉE mais devient une
      // BORNE MINIMALE non modifiable — la durée d'une Série y est inconnue.
      // Le `≥` du libellé dit exactement cela ; il reprend le glyphe déjà
      // employé par toutes les bornes minimales de l'application (synthèses
      // du Catalogue et du Tour), jamais une écriture concurrente.
      totalDuration: {
        label: "Durée totale de l’exercice",
        accessibilityLabel: "Durée totale de l’exercice",
        compactLabel: "Durée totale",
        compactLabelLowerBound: "Durée totale ≥",
        accessibilityLabelLowerBound: "Durée totale minimale de l’exercice",
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
      //
      // T02-S02 : la synthèse fixe reprend la Récupération attachée
      // (« …, puis 20 s de récupération ») puis la ligne de durée.
      //
      // V2-BILAT-01 (plan `## Calculs`, BIL-068) : « le libellé visible reste
      // `Durée totale` dans les trois modes » — `minimumDurationLabel`
      // (« Durée minimale »), employé jusqu'ici pour les modes Répétitions/
      // À l'échec, est donc SUPPRIMÉ plutôt que laissé mort : ces deux modes
      // réutilisent désormais `totalDurationLabel`, la borne inférieure
      // restant signalée par le seul préfixe `≥` (décision T02-S02 conservée
      // — jamais retiré du champ éditeur ni de cette ligne).
      recap: {
        pauseLabel: "de pause",
        pauseSuffix: "entre les séries",
        recoveryPrefix: "puis",
        recoveryLabel: "de récupération",
        totalDurationLabel: "Durée totale",
      },
      // T02-S02 : la Durée totale saisie n'est jamais persistée (DM-015/DM-016) ;
      // elle PILOTE le nombre de Séries via le calcul inverse
      // `Cth = (D − R + B) / (A + B)`. Un arrondi ou un bornage `[1, 99]`
      // rend la durée effective différente de la cible : le message ci-dessous
      // l'annonce explicitement plutôt que de corriger silencieusement.
      adjustedTotalDurationMessage:
        "Durée ajustée à {duration} pour respecter un nombre entier de Séries.",
      // T02-S02 (continuation) : ce message est désormais rendu dans la
      // notification noire temporaire canonique (`color.snackbar`, RM-010),
      // qui exige une action de CORRECTION — `Annuler` restitue le nombre de
      // Séries d'avant l'ajustement, il ne se contente pas de refermer.
      adjustedTotalDurationUndoAction: "Annuler",
      // T02-S02 (CE-T01-13) : le champ multiligne de la section repliable
      // « Description de l'activité » — même chaîne que `sections.description`,
      // qui est le titre de la section qui le contient. Le nom accessible de
      // l'en-tête, lui, est composé avec `sections.expandAction`/
      // `collapseAction`, ce qui laisse ce libellé UNIQUE pour le champ.
      instruction: {
        label: "Description de l’exercice",
      },
      // T02-S02 (continuation) : même chaîne que `sections.bodyZones`, qui
      // est le titre de la section contenant ce sélecteur — l'unicité du nom
      // accessible reste assurée par la composition du nom de l'en-tête
      // (`expandAction`/`collapseAction`), jamais par une divergence de
      // libellé entre le titre et son contenu.
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
      // T02-S02 (D-137) : l'écran unifié n'a plus d'étape intermédiaire à
      // valider — `validateAction` (« Valider ») n'a plus de consommateur et
      // est supprimé ; seul `finishAction` (« Terminer ») clôt l'écran.
      finishAction: "Terminer",
      exitConfirmModal: {
        title: "Abandonner les modifications ?",
        // V2-PRE-1 (critère UI-D35DA2C4F266) : « cet exercice » remplace « cette activité ».
        message: "Les modifications apportées à cet exercice seront perdues.",
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
    // V2-PRE-2 (plan §6.5, CE-UI-07) : écran Profil — six réglages,
    // quatre préférences locales, accès à Modifier le profil. `placeholder`
    // (ancien écran d'attente) est retiré : cet écran porte désormais une
    // UI réelle (même patron que `sessions`/`activities` en leur temps).
    profile: {
      title: "Profil",
      groups: {
        exercise: "Exercice",
        session: "Séance",
        preferences: "Préférences",
      },
      settings: {
        sideChangeRecovery: { label: "Pause entre les côtés", unit: "s" },
        exerciseCountdown: { label: "Compte à rebours d’un exercice", unit: "s" },
        exerciseEnd: { label: "Fin d’exercice", unit: "s" },
        postActivityRecovery: { label: "Récupération après exercice", unit: "s" },
        sessionInitialCountdown: { label: "Compte à rebours initial", unit: "s" },
        sessionFinalPhase: { label: "Fin de séance", unit: "s" },
      },
      stepper: {
        decrementAccessibilityLabel: "Diminuer",
        incrementAccessibilityLabel: "Augmenter",
        minimumReachedSuffix: "minimum atteint",
        maximumReachedSuffix: "maximum atteint",
        // CE-UI-07 L2569 : annoncée par la valeur, en TOUTE position (mi-course,
        // borne basse, borne haute) — jamais seulement au bouton désactivé à la
        // limite. Clé de format : `{value}` reprend la valeur déjà unitée
        // (ex. "10 s"), `{min}` la borne basse SANS unité, `{max}` la borne
        // haute unitée — ex. "10 s, de 0 à 300 s".
        boundsAccessibilityLabel: "{value}, de {min} à {max}",
        saveError: "La modification n’a pas pu être enregistrée. Réessayez.",
      },
      preferencesSwitches: {
        sounds: "Sons",
        voiceAnnouncements: "Annonces vocales",
        vibration: "Vibration",
        notifications: "Notifications",
      },
      editProfileAction: "Modifier le profil",
      identity: {
        unsetDisplayNameAccessibilityLabel: "Nom non renseigné",
      },
    },
    // V2-PRE-2 (plan §6.5, CE-UI-01) : écran Modifier le profil — nom,
    // photo, silhouette, dans un brouillon enregistré par `Enregistrer`.
    profileEdit: {
      title: "Modifier le profil",
      backAccessibilityLabel: "Retour",
      name: {
        label: "Nom",
        placeholder: "Nom",
        errorRequired: "Le nom est obligatoire.",
        errorTooLong: "Le nom ne peut pas dépasser 80 caractères.",
      },
      photo: {
        addAccessibilityLabel: "Ajouter une photo",
        changeAccessibilityLabel: "Changer la photo",
        initialsAccessibilityLabel: "Initiales du profil",
        errorMessage: "La photo n’a pas pu être ajoutée. Réessayez.",
      },
      silhouette: {
        label: "Silhouette",
        homme: "Silhouette homme",
        femme: "Silhouette femme",
      },
      saveAction: "Enregistrer",
      saveError: "Le profil n’a pas pu être enregistré. Réessayez.",
      abandonModal: {
        title: "Abandonner les modifications ?",
        message: "Les modifications apportées au profil seront perdues.",
        continueEditing: "Annuler",
        abandon: "Confirmer",
      },
    },
  },
  // V2-PRE-2 (plan §6.5, §4.10) : textes partagés par les trois modales de
  // référentiel (Catégorie, Zone, Étiquette) et le dialogue d'appui long.
  referenceData: {
    category: {
      title: "Catégorie",
      createAction: "Créer une catégorie",
      newEntry: {
        placeholder: "Nom de la catégorie",
        cancelAccessibilityLabel: "Annuler",
        addAccessibilityLabel: "Ajouter",
      },
      closeAccessibilityLabel: "Fermer",
    },
    bodyZone: {
      title: "Zones corporelles",
      createAction: "Créer une zone",
      newEntry: {
        placeholder: "Nom de la zone",
        cancelAccessibilityLabel: "Annuler",
        addAccessibilityLabel: "Ajouter",
      },
      confirmAction: "Confirmer",
      closeAccessibilityLabel: "Fermer",
      atLeastOneRequired: "Au moins une Zone doit rester sélectionnée.",
    },
    label: {
      title: "Étiquettes",
      createAction: "Créer une étiquette",
      newEntry: {
        placeholder: "Nom de l’étiquette",
        cancelAccessibilityLabel: "Annuler",
        addAccessibilityLabel: "Ajouter",
      },
      closeAccessibilityLabel: "Fermer",
      // CE-T03-16 L1677 (R10) : action proposée distincte du nom et de
      // l'état sélectionné — « choisir » sur une Étiquette non affectée,
      // « retirer » sur l'Étiquette déjà affectée (A3409468666E5).
      chooseActionHint: "Choisir",
      retireActionHint: "Retirer",
    },
    // D4, D-259 : dialogue d'appui long partagé — Annuler / Modifier / Supprimer.
    longPressDialog: {
      cancel: "Annuler",
      modify: "Modifier",
      delete: "Supprimer",
    },
    // §4.10 L134/L135/L138/L139 : titre exact et messages différenciés
    // utilisé/non utilisé, partagés par Catégorie/Zone/Étiquette.
    deleteConfirm: {
      titlePrefix: "Supprimer « ",
      titleSuffix: " » ?",
      usedMessage:
        "Elle disparaîtra des nouveaux choix mais restera attachée aux objets qui l’utilisent déjà, avec son nom et sa couleur actuels.",
      unusedMessage: "Cette valeur sera retirée des choix proposés.",
      confirm: "Supprimer",
      cancel: "Annuler",
    },
    renameDialog: {
      title: "Modifier",
      nameLabel: "Nom",
      colorLabel: "Couleur",
      saveAction: "Enregistrer",
      cancelAction: "Annuler",
      duplicateError: "Ce nom existe déjà.",
    },
    retiredValueMessage: "Cette valeur a été retirée. Choisissez-en une autre.",
    // §4.10 L136 ; CE-UI-09 L2812, L2836 ; CE-T03-16 L1665, L1673 : échec
    // d'écriture d'une opération de référentiel, partagé par Catégorie/
    // Zone/Étiquette — message, modale conservée ouverte, aucune
    // modification partielle (un nom vide ou invalide reste prévenu en
    // amont par la désactivation d'Ajouter/Enregistrer, jamais par cette
    // écriture).
    writeError: "La modification n’a pas pu être enregistrée. Réessayez.",
  },
} as const;
