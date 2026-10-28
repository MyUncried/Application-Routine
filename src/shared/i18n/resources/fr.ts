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
  // PRE-4 (story 1.2, H24, AD-12, RM-092) : avis unique des Exercices
  // illisibles écartés par `migration010` (Q19). Le pluriel est l'exemple
  // de H24 ; le singulier n'a pas de source et sera validé par Hermann à la
  // recette (AC4). `{n}` reçoit le nombre écarté, jamais un nom ni un
  // identifiant. Le libellé du bouton unique n'a pas de source non plus.
  migrationNotice: {
    unreadableExercisesDroppedSingular: "1 exercice illisible n’a pas pu être repris.",
    unreadableExercisesDroppedPlural: "{n} exercices illisibles n’ont pas pu être repris.",
    // PRE-7 (A1.2, D-440 assouplie, MFN-12) : avis unique de la migration 012 —
    // Exercices et Séances réinitialisés, Profil, Catégories et Zones conservés.
    // Texte sans source littérale, à valider par Hermann au jalon JA1.
    exercisesAndSessionsReset:
      "Vos exercices et vos séances ont été réinitialisés pour cette nouvelle version. Vos préférences, vos catégories et vos zones corporelles sont conservées.",
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
    // PRE-4 (story 2.2, AC6, NFR-08, AD-11) : préfixes uniques de la nature
    // d'une durée affichée hors du domaine — `estimated` (≈) et `lowerBound`
    // (≥), suivis d'une espace simple (rendu PRE-3 inchangé).
    // La Phrase et les formateurs du domaine en sont exemptés (AD-11).
    durationNature: {
      estimatedPrefix: "≈ ",
      lowerBoundPrefix: "≥ ",
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
    // PRE-8 (E01) : destination visible et désactivée, sans écran.
    community: "Communauté",
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
        // Alignement DSF 07/10 (D10) : « Parcours » dans les contrôles
        // segmentés des catalogues ; « Circuit » reste le terme de la
        // Composition. Clés non renommées.
        circuits: "Parcours",
        // Nom accessible des segments désactivés — annonce explicitement
        // l'indisponibilité MVP (D-108).
        activitiesUnavailableAccessibilityLabel: "Exercices — indisponible",
        circuitsUnavailableAccessibilityLabel: "Parcours — indisponible",
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
      // PRE-8 (epic E, Q-E6) : liste sans résultat après filtrage, distincte du Catalogue vide.
      noMatch: "Aucune séance ne correspond aux filtres.",
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
      // PRE-8 (epic E, E.2 et E.3) : carte unique du Catalogue des séances (spécification du 27/10).
      catalogueCard: {
        categoriesOverflow: "+{count}",
        expandAccessibilityLabel: "Afficher la composition de {name}",
        collapseAccessibilityLabel: "Masquer la composition de {name}",
        // CE-T03-01 : destination non livrée, explicitement indisponible.
        playUnavailableAccessibilityLabel: "Lancer la séance — indisponible",
        archivedAccessibility: "archivée",
        cycleLine: "Cycle · {count} {unit}",
        cycleUnit: { singular: "répétition", plural: "répétitions" },
        circuitLine: "Circuit · {count} {unit}",
        recovery: "Récupération",
        compositionAccessibilityLabel: "Composition de la séance",
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
        // PRE-7 (R-6, D-445 C06, MFN-10 l.426, relevé du 25/10 §6 « Squat assisté - N1 ») : suffixe
        // de niveau des cartes sans pastille, dérivé, jamais stocké dans le nom.
        levelSuffix: "{name} - N{rank}",
      },
      editor: {
        // Complément d'alignement du 07/10 (ajout D) : titre d'écran de
        // création « Créer un exercice » ; « Modifier un exercice » inchangé.
        titleAdd: "Créer un exercice",
        titleEdit: "Modifier un exercice",
        backAccessibilityLabel: "Retour",
        name: "Nom de l’exercice",
        finishAction: "Terminer",
        saveError: "L’exercice n’a pas pu être enregistré. Réessayez.",
        // PRE-7 story A2.2 (D-438, CE-T03-04 §3, relevé Figma MFN du 23/10, `9952:44374`) :
        // crayon de la création sur geste repris. PRE-7 story R-4 (v7 §1) : « geste » devient
        // « mouvement » dans tous les textes d’interface (identifiants inchangés, D-201) ; même
        // crayon sur une occurrence de Séance (D-445 C04).
        editMovement: "Modifier le mouvement",
        // PRE-7 story R-9 (D-448 point 10) : indication VoiceOver du crayon actif en Séance (aucun
        // texte documenté).
        editMovementActiveHint: "Touchez pour quitter la modification du mouvement",
        // PRE-7 story R-5 (D-445 C01, C02, v7 §6 R03-R04 ; maquettes `9882:19049`, `10175:20349`,
        // `10140:20180`, `10187:20340`, carte `10199:22268`) : panneau sous le nom, pendant la saisie
        // (remplace la feuille à trois choix d’A2.3). Textes relevés : message d’unicité, actions de
        // la carte, invite grise. « Plus facile / Plus difficile » : libellés de C02, MFN-07 l.371 et du
        // popover `10152:20369` (la maquette `10140:20180` porte « Moins difficile » ; option
        // conservatrice, à valider par Hermann). `nameTakenEdit` (correction, variante, Séance : aucune
        // carte à reprendre) et `backToResults` (nom accessible du chevron) : sans texte relevé (NON
        // VÉRIFIABLE).
        movementSuggestion: {
          nameTaken: "Ce nom est déjà utilisé. Reprenez ce mouvement ou choisissez un autre nom.",
          nameTakenEdit: "Ce nom est déjà utilisé. Choisissez un autre nom.",
          useMovement: "Utiliser ce mouvement",
          createVariant: "Créer une variante",
          easier: "Plus facile",
          harder: "Plus difficile",
          backToResults: "Retour aux résultats",
          level: "Niveau {rank}",
          completeNameHint: "(compléter le nom)",
        },
        // PRE-7 story A2.3 (MFN-04, MFN-06, D-439 ; écran `9959:19623`) : recherche spécialisée des
        // gestes, locaux compris. Titre, champ et note de `9959:19623`. `open` : accès depuis le
        // formulaire, sans frame (NON VÉRIFIABLE), libellé repris du champ de recherche.
        // PRE-7 story R-5 (v7 §6 R03) : « Voir tous les mouvements » (texte de la v7) ; l’annonce
        // d’absence de résultat n’a pas de texte relevé (NON VÉRIFIABLE).
        movementSearch: {
          title: "Choisir un mouvement",
          placeholder: "Rechercher un mouvement",
          localNote: "Les mouvements créés dans une séance apparaissent aussi.",
          noResult: "Aucun mouvement ne correspond à cette recherche.",
          showAll: "Voir tous les mouvements",
          exerciseCountSingular: "{n} exercice",
          exerciseCountPlural: "{n} exercices",
          open: "Rechercher un mouvement",
          closeAccessibilityLabel: "Retour",
        },
        // PRE-7 story A3.1 (D-439, MFN-05, MFN-07 ; CE-T03-04 §9 ; Figma `9925:41506` / `9925:41515`,
        // popover `9577:19843`) : pastille de la rangée de classification et popover de niveau. Vide :
        // « Niveau » (sans groupe ou singleton, rang masqué, jamais un faux « Niveau 1 ») ; renseignée :
        // « Niveau X », rang calculé ; le total figure dans le choix (« Niveau r sur t · nom »). Le nom
        // accessible vide suit `category.unsetAccessibilityLabel`. L’en-tête « 2 sur 3 » du popover
        // Figma est un ancien exemple, non repris.
        levelMenu: {
          unsetLabel: "Niveau",
          unsetAccessibilityLabel: "Niveau — non renseigné",
          rank: "Niveau {rank}",
          // PRE-7 story R-9 (D-448 point 9) : intitulé du sous-menu des niveaux au Catalogue en
          // modification (choix par Exercice) ; « Changer de niveau » reste en Séance et en reprise.
          navigateTo: "Naviguer vers",
          changeLevel: "Changer de niveau",
          addLevel: "Ajouter un niveau",
          // PRE-7 (R-6, MFN-07 l.371, déploiement `10152:20369`) : sens du niveau ajouté.
          addEasier: "Plus facile",
          addHarder: "Plus difficile",
          levelOption: "Niveau {rank} sur {total} · {name}",
          // Recette A/B B.10 (q6-2) : un niveau archivé est signalé dans le menu.
          levelOptionArchived: "Niveau {rank} sur {total} · {name} (archivé)",
          // Recette A/B B.10 (b2-8) : sous-menu des niveaux de la fiche Mouvement (Catalogue des Mouvements).
          openOtherLevel: "Ouvrir un autre niveau",
          // PRE-7 story A3.2 : accès à l’écran des niveaux (aucun libellé documenté ; verbe de ch03
          // l.154 « glisser réordonne les niveaux »). R-9 (D-448 point 9) : troisième entrée de la
          // racine du menu, retirée du sous-menu des niveaux.
          reorderLevels: "Réordonner les niveaux",
        },
        // PRE-7 story A3.2 (D-439, MFN-05, MFN/AC07) : écran des niveaux d’un groupe, sans frame
        // Figma (NON VÉRIFIABLE). Aucun texte documenté : titre « Niveaux » ; lignes calquées sur
        // celles des phases (« Déplacer la phase {n} », « Monter la phase {n} ») ; nombre
        // d’Exercices repris de `movementSearch` ; erreurs calquées sur `error` (Catalogue) et
        // `saveError` des valeurs. Textes à valider par Hermann.
        levelOrder: {
          title: "Niveaux",
          closeAccessibilityLabel: "Retour",
          row: "Niveau {n}",
          handle: "Déplacer le niveau {n}",
          moveUp: "Monter le niveau {n}",
          moveDown: "Descendre le niveau {n}",
          loadError: "Impossible de charger les niveaux.",
          retry: "Réessayer",
          saveError: "La modification n’a pas pu être enregistrée. Réessayez.",
        },
        // PRE-7 story R-4 (D-445 C03, v7 §3) : dialogue unique de sauvegarde du mouvement. Textes
        // du relevé utilisateur (`docs/figma-niveaux-2026-10-25/releve-utilisateur.md` §4) et des
        // frames `9952:44349`, `10253:20414`, `10257:20651` ; nombres calculés. « Aucun autre
        // exercice… » : portée zéro, jamais masquée (C03), texte composé sur le même modèle.
        movementSave: {
          choiceTitle: "Vous souhaitez :",
          confirmTitle: "Vous avez modifié ce mouvement",
          otherPlural: "{n} autres exercices utilisent ce mouvement.",
          otherSingular: "{n} autre exercice utilise ce mouvement.",
          noOther: "Aucun autre exercice n’utilise ce mouvement.",
          appliesToAll: "La modification s’appliquera à tous.",
          update: "Mettre à jour ce mouvement",
          updateDetail: "Pour tous les exercices qui l’utilisent",
          newMovement: "Créer un nouveau mouvement",
          newMovementDetail: "Uniquement pour cet exercice",
          cancel: "Annuler",
          confirm: "Confirmer",
        },
        // PRE-7 story A2.2 (MFN-08 « Étape d’écran après choix de correction structurelle »,
        // CE-T03-04 §11 et §14) : étape distincte, sans frame Figma (NON VÉRIFIABLE). Libellés
        // tirés du vocabulaire des documents (« durées manquantes », complétion « passée »),
        // soumis à Hermann ; « Terminer », « Annuler » existants ; un frère passé affiche le texte
        // existant `executionParameters.card.incomplete` (« Paramètres à compléter. »).
        siblingCompletion: {
          title: "Durées manquantes",
          skip: "Passer",
          finish: "Terminer",
          cancel: "Annuler",
          unset: "—",
          durationAccessibilityLabel: "Durée de {label}",
        },
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
      // Complément d'alignement du 07/10 (ajout D) : titre d'écran.
      title: "Composer une séance",
      backAccessibilityLabel: "Retour",
      // PRE-6 (story 2.1, Figma `8328:28730`) : bouton fermer (X) de l’en-tête de la Composition.
      closeAccessibilityLabel: "Fermer",
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
        // PRE-6 (story 2.1, Figma `8328:28617`) : libellé de la puce sans Étiquette affectée.
        placeholder: "Étiquette",
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
      // PRE-6 (story 3.1, CIR-10, Figma `8328:28667`) : en-tête du Circuit — titre, unité du
      // compteur accordée selon la nature (N = 1 singulier) et nom VoiceOver du réglage.
      // Remplace l’ancien jeu `tour` (« Nombre de tours », roulette du compte retirée).
      circuit: {
        title: "Circuit",
        unit: {
          TOURS: { singular: "tour", plural: "tours" },
          SERIES: { singular: "série", plural: "séries" },
        },
        countAccessibilityLabel: {
          TOURS: "Nombre de tours",
          SERIES: "Nombre de séries",
        },
        // PRE-6 (story 7.3, D-442) : boutons − et + du stepper toujours affiché, éléments
        // accessibles distincts du réglage « Nombre de tours ».
        decrementAccessibilityLabel: {
          TOURS: "Retirer un tour",
          SERIES: "Retirer une série",
        },
        incrementAccessibilityLabel: {
          TOURS: "Ajouter un tour",
          SERIES: "Ajouter une série",
        },
        // PRE-6 (story 3.2, CE-CIR-01, Figma `8328:34805`) : choix de nature par la pastille d’unité.
        nature: {
          accessibilityLabel: "Nature du circuit",
          options: {
            TOURS: { title: "Circuit de tours", subtitle: "les séries d’un exercice s’enchaînent" },
            SERIES: { title: "Circuit de séries", subtitle: "une série de chaque exercice par passage" },
          },
        },
        // PRE-6 (story 3.4, CE-CIR-03, Figma `8328:34965` / `8328:35135`) : œil de l’en-tête et
        // feuille « Volumes du circuit », en lecture seule. « ✓ » = cible à l’échec ; « — » = série
        // inexistante ou cible à renseigner (jamais 0), distingués à l’annonce VoiceOver.
        volumes: {
          openAccessibilityLabel: "Voir les volumes du circuit",
          title: "Volumes du circuit",
          closeAccessibilityLabel: "Fermer les volumes du circuit",
          empty: "Aucun exercice dans le circuit",
          columns: {
            exercise: "Exercice",
            series: "S{n}",
            unit: "Unité",
          },
          units: {
            REPETITIONS: "rép.",
            DURATION: "durée",
            FAILURE: "À l’échec",
          },
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
      // PRE-4, décision Q54 : l'action finale de la Composition enregistre la Séance (repris de
      // l'écran « Catégories de la séance », supprimé). D-107 : message d'échec mot pour mot.
      // PRE-6 (story 2.1, CE-T03-08, D-388, Figma `8328:28732`) : libellé « Continuer » ; même
      // composant, mêmes règles d'activation et même enregistrement (Q54).
      saveAction: "Continuer",
      // PRE-6 (story 2.1) : durée de séance de l'en-tête (toutes les occurrences, RM-159).
      sessionDurationAccessibilityLabel: "Durée de la séance",
      // PRE-6 (story 4.1, AD-43, Figma `8328:28622`, `8328:29270`, `8328:28733`) : action
      // « Ajouter un arrêt » et mode placement — puces des emplacements, barre « Confirmer N
      // pauses ajoutées » / « Annuler » et roulette « Durée de récupération ».
      placement: {
        addStopAccessibilityLabel: "Ajouter un arrêt",
        recovery: "Récupération",
        stopPoint: "Point d’arrêt",
        addRecoveryAccessibilityLabel: "Ajouter une récupération après {exercise}",
        addStopPointAccessibilityLabel: "Ajouter un point d’arrêt après {exercise}",
        addStopPointAfterCircuitAccessibilityLabel: "Ajouter un point d’arrêt après le circuit",
        // PRE-6 story 7.2 (D-442) : emplacement de tête de Circuit (début de Tour).
        addStopPointAtCircuitStartAccessibilityLabel: "Ajouter un point d’arrêt au début du circuit",
        existingStopPointAccessibilityLabel: "Point d’arrêt après {exercise}",
        existingStopPointAfterCircuitAccessibilityLabel: "Point d’arrêt après le circuit",
        // PRE-6 story 6.2 : point en tête de portée (données héritées), formulation à valider.
        stopPointAtCircuitStartAccessibilityLabel: "Point d’arrêt au début du circuit",
        stopPointAtSessionStartAccessibilityLabel: "Point d’arrêt au début de la séance",
        confirmSingular: "Confirmer {n} pause ajoutée",
        confirmPlural: "Confirmer {n} pauses ajoutées",
        // PRE-6 story 6.3 (D-441, arbitrage du 22/10/2026) : retrait de point, mélange ou modification
        // de durée seule.
        confirmChanges: "Confirmer les modifications",
        cancel: "Annuler",
        recoveryWheelTitle: "Durée de récupération",
        selectedHint: "Un toucher retire cet ajout.",
        // PRE-6 story 6.3 (D-441, ch13 CE-T03-08 accessibilité) : point existant sélectionné (conservé)
        // ou désélectionné (retrait programmé).
        existingStopPointSelectedHint: "Toucher pour retirer ce point d’arrêt.",
        existingStopPointRemovedHint: "Toucher pour conserver ce point d’arrêt.",
        // PRE-6 story 6.3 (revue) : resélection refusée (un point ajouté le suivrait, RM-251),
        // annonces de la bascule d’un point existant et indice d’entrée quand seul un retrait est
        // possible. Formulations à valider.
        existingStopPointBlockedHint: "Ne peut pas être conservé : un point ajouté le suivrait.",
        stopPointRemovedAnnouncement: "Point d’arrêt retiré",
        stopPointKeptAnnouncement: "Point d’arrêt conservé",
        stopPointKeepRefusedAnnouncement: "Point d’arrêt non conservé : un point ajouté le suivrait",
        addStopRemovalOnlyHint: "Permet de retirer des points d’arrêt existants.",
        // PRE-6 story 7.2 (D-442) : une récupération existante se modifie et se retire en placement.
        addStopChangesOnlyHint: "Permet de modifier ou de retirer les pauses existantes.",
        // PRE-6 story 6.3 (revue, ch13 L1524) : effet d’un ajout ou de son annulation, suivi du
        // libellé de « Confirmer » (nombre d’ajouts).
        stopPointAddedAnnouncement: "Point d’arrêt ajouté",
        recoveryAddedAnnouncement: "Récupération ajoutée",
        additionCancelledAnnouncement: "Ajout annulé",
        // PRE-6 story 7.2 (D-442, ch13 CE-T03-08 L1496) : zone de récupération existante (0 comprise)
        // en placement — nom, indices (sélectionnée : toucher la retire ; désélectionnée : toucher
        // ouvre la roulette) et annonces. Formulations à valider.
        existingRecoveryAccessibilityLabel: "Récupération après {exercise}",
        existingRecoverySelectedHint: "Toucher pour retirer cette récupération.",
        existingRecoveryRemovedHint: "Toucher pour choisir sa durée et la conserver.",
        recoveryRemovedAnnouncement: "Récupération retirée",
        recoverySelectedAnnouncement: "Récupération sélectionnée",
      },
      // PRE-6 story 7.2 (D-442) : la récupération ne se règle plus hors placement — la bulle « Retirer
      // la récupération » et les actions « Modifier » / « Retirer la récupération » de la carte
      // (stories 4.2, 5.1) sont retirées.
      pauses: {
        // PRE-6 story 6.2 (D-441) : l’appui long d’un point le saisit (glisser).
        stopPointReorderAccessibilityHint: "Appui long pour déplacer le point d’arrêt",
      },
      saveError: "La séance n’a pas pu être enregistrée. Réessayez.",
      // PRE-7 story R-5 (D-445 C01 ; report R-3) : un nom de mouvement de la Séance pris en base entre
      // la saisie et l’enregistrement (écriture concurrente) est signalé pour ce qu’il est, et non par
      // l’erreur générique. Aucun texte relevé (NON VÉRIFIABLE).
      nameTakenError: "Un mouvement de cette séance porte un nom déjà utilisé. Modifiez son nom.",
      // PRE-6 story 7.2 (D-442, ch13 CE-T03-08 L1498) : choix « lequel conserver » quand, à N ≥ 2, un
      // Point de début et un Point de fin de Tour se suivraient entre deux Tours (dialogue natif).
      // Formulations à valider.
      tourBoundaryChoice: {
        title: "Point d’arrêt en début et en fin de tour",
        message: "Les deux se suivraient entre deux tours. Lequel conserver ?",
        head: "Début de tour",
        tail: "Fin de tour",
        cancel: "Annuler",
      },
      // PRE-6 story 7.2 (D-442) : points retirés sans message par un déplacement d’Exercice, un
      // changement du nombre de Tours ou un choix de Tour — annonce d’accessibilité discrète.
      stopPointsRemovedAnnouncement: {
        singular: "Point d’arrêt retiré",
        plural: "{n} points d’arrêt retirés",
      },
      // PRE-6 story 7.8 (D-443) : Compte à rebours et Fin de séance affichés en secondes seulement
      // (« 45 s ») ; la durée du Circuit (et son « — min ») n’est plus affichée.
      boundarySecondsUnit: "s",
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
      // T02-S02 (D-095/D-128/D-138) : Récupération de l'occurrence — jamais une Activité, jamais
      // une ligne de plus dans le compte (`computeActivityCount` inchangé). PRE-6 (story 2.1) :
      // affichée par la ligne structurelle sous l'occurrence, dont le nom accessible est le
      // libellé visible (« Récupération 20 s ») ; l'ancienne clé « Récupération attachée » est retirée.
      activityRecovery: {
        label: "Récupération",
      },
      activityActions: {
        duplicate: "Dupliquer",
        delete: "Supprimer",
        // V2-PRE-1 (critère UI-D35DA2C4F266) : « exercice » remplace « activité ».
        revealAccessibilityLabel: "Actions de l’exercice",
        reorderAccessibilityHint:
          "Appui long pour déplacer l’exercice, glissement vers la gauche pour afficher les actions",
        // PRE-6 (story 2.3, CE-T03-08 §18) : alternatives accessibles au glisser — une position
        // dans la séquence affichée, mêmes règles que le glisser.
        moveUp: "Monter",
        moveDown: "Descendre",
        // PRE-6 story 7.5 (D-442 amendée) : la suppression d’un exercice n’est plus refusée — les
        // annonces de refus de la story 6.2 sont retirées.
      },
      // PRE-6 (story 2.3) : confirmation de perte de séries à l’entrée d’un exercice dans un
      // Circuit de Séries (dialogue `8328:34964`). Formulation calquée sur la conversion
      // (ch13), à valider par Hermann. `{series}` = « N série(s) », `{ordinal}` = N-ième.
      circuitEntryConfirmModal: {
        addTitle: "Ajouter au circuit de séries ?",
        moveTitle: "Déplacer dans le circuit de séries ?",
        // PRE-6 (story 3.2, CE-CIR-02, Figma `8328:34964`) : conversion Tours → Séries avec perte.
        natureTitle: "Passer en circuit de séries ?",
        natureMessage:
          "Tous les exercices auront {series}. Les séries au-delà de la {ordinal} seront supprimées, avec les valeurs qu’elles portent.",
        addMessagePlural:
          "Les exercices ajoutés auront {series}. Les séries au-delà de la {ordinal} seront supprimées, avec les valeurs qu’elles portent.",
        addMessageSingular:
          "L’exercice ajouté aura {series}. Les séries au-delà de la {ordinal} seront supprimées, avec les valeurs qu’elles portent.",
        moveMessage:
          "L’exercice déplacé aura {series}. Les séries au-delà de la {ordinal} seront supprimées, avec les valeurs qu’elles portent.",
        seriesSingular: "{n} série",
        seriesPlural: "{n} séries",
        ordinalFirst: "1re",
        ordinalOther: "{n}e",
        cancel: "Annuler",
        confirm: "Confirmer",
      },
      exerciseRow: {
        editAccessibilityLabel: "Modifier l’exercice",
        seriesSingular: "série",
        seriesPlural: "séries",
        repetitionSingular: "répétition",
        repetitionPlural: "répétitions",
        of: "de",
        withPause: "avec",
        pauseSuffix: "de pause par série",
        // PRE-4 (story 1.1, Q24, FR-05-05) : résumé de carte d'un Exercice dont
        // toutes les Cibles sont à l'échec — « {N} séries à l’échec » (P3) ;
        // remplace « {N} séries jusqu’à l’échec » de PRE-3.
        toFailure: "à l’échec",
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
      // PRE-6 story 2.2 (D-238, Figma `5544:6797`) : carte d'occurrence de la Composition.
      // Synthèse « N × cible » des séries identiques, « … » après trois cibles variables ;
      // nom accessible « Exercice, {nom}, {n} sur {m}, {durée} » (CE-T03-08 §18).
      occurrenceCard: {
        seriesTimes: "{n} × {target}",
        valuesOverflow: "…",
        accessibilityType: "Exercice",
        accessibilityPosition: "{position} sur {count}",
        // Ajouté au nom accessible d'une occurrence bilatérale (RM-243 : sans direction).
        accessibilitySideChange: "changement de côté",
        // PRE-6 (story 5.1, revue) : ajouté au nom accessible d’une occurrence dont la récupération
        // est affichée en ligne 3 (le contrôle imbriqué n’est pas exposé à l’accessibilité).
        accessibilityRecovery: "récupération {duration}",
        // PRE-6 (story 5.1, D-435, Figma `9808:19924`) : séparateur entre la synthèse et la durée
        // estimée des Répétitions avec bip, sur la ligne 2 de la carte v2 (« 10 rép. / ≈ 1 min »).
        workEstimateSeparator: " / ",
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
      // Complément d'alignement du 07/10 (ajout D) : « Créer un exercice ».
      titleAdd: "Créer un exercice",
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
        // PRE-4 (story 1.1, FR-05-01) : deux Modes seulement — l'ancienne
        // troisième option « À l’échec » est retirée (une Cible, FR-05-04).
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
        // PRE-5 story 3.1 (FR-33, FR-44, AC1, AC6) : invites grises de la Description en
        // étapes (première ligne de l’état vide, ligne suivant la dernière étape) et nom
        // VoiceOver de chaque étape, numéro compris (`{n}` : numéro de l’étape).
        firstStepPlaceholder: "Décrivez la première étape",
        nextStepPlaceholder: "Étape suivante",
        stepAccessibilityLabel: "Étape {n}",
      },
      // T02-S02 (continuation) : même chaîne que `sections.bodyZones`, qui
      // est le titre de la section contenant ce sélecteur — l'unicité du nom
      // accessible reste assurée par la composition du nom de l'en-tête
      // (`expandAction`/`collapseAction`), jamais par une divergence de
      // libellé entre le titre et son contenu.
      bodyZones: {
        label: "Zones corporelles",
        accessibilityLabel: "Zones corporelles",
        // PRE-4 story 4.3 (FR-02-05, P35) : libellé visible de l'accès non
        // renseigné et séparateur des Zones choisies dans le bandeau, tels que
        // montrés par les captures `8328:35698` et `8328:37022` (texte
        // « Cuisses . Fessier ») ; le point médian reste la règle des cartes
        // consommatrices, hors bandeau (FR-02-05, notes).
        unsetLabel: "Zone corporelle",
        // Revue 4.3 (WCAG 2.5.3) : nom accessible de l'accès non renseigné, qui contient
        // le libellé visible, sur le modèle de `category.unsetAccessibilityLabel`.
        unsetAccessibilityLabel: "Zone corporelle — non renseignée",
        // Q49 (a) : valeur en attente de Hermann (« . » de la capture ou point médian).
        bandSeparator: " . ",
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
        // PRE-4 story 4.2 (Q18, AC12) : textes du dialogue en CRÉATION (CC, CS) ;
        // `title` / `message` ci-dessus restent ceux de la MODIFICATION (MC, MS).
        // Le texte de la capture `8328:36781` (« l'activité ne sera pas créé »)
        // n'est pas repris.
        createTitle: "Abandonner la création ?",
        createMessage: "Les informations saisies seront perdues et l’exercice ne sera pas créé.",
      },
    },
    // T01-S09 (CE-T01-11/CE-T01-12, D-106/D-107) : aucun texte introductif
    // supplémentaire n'est affiché sur cet écran — le titre de section
    // (`sectionLabel`) et les tags suffisent, conformément à D-106.
    // Q54 : l'écran « Catégories de la séance » est supprimé ; seul reste le suffixe d'état des
    // options des feuilles de Catégorie et d'Étiquette (identifiant historique conservé).
    categories: {
      tagAccessibility: {
        selectedSuffix: "sélectionnée",
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
    // PRE-8 (B.2, B.3, CE-MVT-01, Figma `10415:21706` à `10453:23030`) : fiche Mouvement et
    // Catalogue des Mouvements. Libellés relevés dans Figma ; C03 réutilise `activities.editor`.
    movement: {
      titles: {
        create: "Créer un mouvement",
        consult: "Mouvement",
        edit: "Modifier le mouvement",
      },
      finish: "Terminer",
      edit: "Modifier le mouvement",
      close: "Fermer",
      loadError: "Le mouvement n’a pas pu être chargé.",
      retry: "Réessayer",
      saveError: "Le mouvement n’a pas pu être enregistré. Vos saisies sont conservées.",
      // Recette A/B (F03) : titre de la Description sur la fiche Mouvement (Figma `10453:23036`).
      descriptionTitle: "Description du mouvement",
      // Recette A/B B.10 (q6-2) : invite grise après le nom d'un Mouvement archivé.
      archivedNameSuffix: "(archivé)",
      // Recette A/B B.10 (remarque 4) : compteur du gabarit photo, à la place du badge « Vidéo ».
      mediaCounter: "{rank} / {total}",
      // PRE-8, recette A/B (27/10) : bouton de lecture du gabarit photo (vidéo seulement).
      playVideo: "Lire la vidéo",
      // Recette A/B B.10 (remarque 6) : actions des cartes de résultat de la fiche Mouvement.
      suggestion: {
        useMovement: "Ouvrir ce mouvement",
        createVariant: "Ajouter un niveau",
      },
      // Recette A/B B.10 (b2-4) : ↑ des Phases, qui ferme le clavier comme celui de la Description.
      phasesSubmitAccessibilityLabel: "Valider les phases",
      phases: {
        title: "Phases du mouvement (pour minuter l’exécution)",
        firstPlaceholder: "Nommez la première phase",
        nextPlaceholder: "Phase suivante",
        labelAccessibility: "Phase {rank}",
        remove: "Retirer la phase {rank}",
        row: "Phase {n}",
        moveUp: "Monter",
        moveDown: "Descendre",
      },
      catalogue: {
        segment: "Mouvements",
        title: "Catalogue des mouvements",
        searchPlaceholder: "Rechercher",
        searchAccessibilityLabel: "Rechercher un mouvement",
        create: "Créer un mouvement",
        empty: "Aucun mouvement pour l’instant.",
        noResult: "Aucun mouvement ne correspond à la recherche.",
        loadError: "Les mouvements n’ont pas pu être chargés.",
        retry: "Réessayer",
        openAccessibilityHint: "Ouvre la fiche du mouvement",
        // PRE-8 (B.5, B.6, B.7, B.8) : piles, actions glissées, filtres et archives (Figma page 510:101).
        noMatch: "Aucun mouvement ne correspond à la recherche ou aux filtres.",
        pileAccessibilityLabel: "{name}, {count} niveaux affichés",
        pileExpandHint: "Déplie la pile",
        pileCollapse: "Replier la pile",
        archivedAccessibility: "archivé",
        // Recette A/B (D03) : croix d'effacement de la recherche.
        searchClear: "Effacer la recherche",
        // Recette A/B (B08, MFN-05) : réordonnancement des Niveaux d'une pile déployée.
        reorderHint: "Appui long puis glisser pour changer l’ordre des niveaux",
        moveHarder: "Placer {name} un niveau plus haut",
        moveEasier: "Placer {name} un niveau plus bas",
        reorderError: "L’ordre des niveaux n’a pas pu être enregistré. Réessayez.",
        actions: {
          share: "Partager",
          // Recette A/B (B12, CE-MVT-02) : « Ajouter un niveau » remplace « Créer une variante ».
          addLevel: "Ajouter un niveau",
          archive: "Archiver",
          restore: "Restaurer",
          delete: "Supprimer",
        },
        archived: "Mouvement archivé",
        restored: "Mouvement restauré",
        undo: "Annuler",
        archiveRefused: {
          title: "Archivage impossible",
          messageOne: "Ce mouvement est utilisé par 1 exercice. Vous pourrez l’archiver lorsqu’il ne le sera plus.",
          messageMany: "Ce mouvement est utilisé par {count} exercices. Vous pourrez l’archiver lorsqu’il ne le sera plus.",
          acknowledge: "J’ai compris",
        },
        deleteRefused: {
          title: "Suppression impossible",
          messageOne: "Ce mouvement est utilisé par 1 exercice.",
          messageMany: "Ce mouvement est utilisé par {count} exercices.",
        },
        deleteConfirm: {
          title: "Supprimer ce mouvement ?",
          message: "Ce mouvement archivé sera définitivement supprimé. Cette action est irréversible.",
          cancel: "Annuler",
          confirm: "Confirmer",
        },
        actionError: "L’action n’a pas pu être effectuée.",
        filters: {
          command: "Filtres",
          title: "Filtres",
          close: "Fermer",
          apply: "Appliquer les filtres",
          reset: "Réinitialiser",
          status: "Statut",
          active: "Actifs",
          archivedValue: "Archivés",
          levels: "Niveaux",
          withLevels: "Avec niveaux",
          withoutLevel: "Sans niveau",
          usage: "Utilisation",
          withExercise: "Avec exercice",
          withoutExercise: "Sans exercice",
          categories: "Catégories",
          bodyZones: "Zones corporelles",
          activeSummary: "{count} filtres",
          // Recette A/B (D05, ch13 §4.5) : commande étendue — le rond retire les filtres, la zone
          // texte ouvre la feuille.
          clearAccessibility: "Retirer les filtres",
          editAccessibility: "Modifier les filtres",
        },
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
      // Q53 : nom accessible d'une Zone retirée encore affectée à l'Exercice — l'état n'est pas
      // porté par la seule couleur de fond (aucune mention visible, décision de Hermann).
      retiredAccessibilityLabel: "{name}, retirée de la liste des choix",
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
      // PRE-4 story 4.6 (FR-22-09, AC8) : action accessible d'une Catégorie ou d'une Zone,
      // équivalente à l'appui long ; elle ouvre ce même menu. Texte nouveau, à valider par
      // Hermann (H23).
      accessibilityAction: "Modifier ou supprimer",
    },
    // §4.10 L134/L135/L138/L139 : titre exact et messages différenciés
    // utilisé/non utilisé, partagés par Catégorie/Zone/Étiquette.
    deleteConfirm: {
      titlePrefix: "Supprimer « ",
      titleSuffix: " » ?",
      usedMessage:
        "Elle disparaîtra des nouveaux choix mais restera attachée aux objets qui l’utilisent déjà, avec son nom et sa couleur actuels.",
      unusedMessage: "Cette valeur sera retirée des choix proposés.",
      // PRE-4 story 4.3 (FR-20-09, AC11 ; captures `8328:35932`, `8328:36441`) :
      // messages distincts d'une Catégorie et d'une Zone utilisées. `usedMessage`
      // reste celui de l'Étiquette (hors story) ; `unusedMessage` est inchangé (P34).
      categoryUsedMessage:
        "Cette catégorie ne sera plus proposée. Les exercices qui l’utilisent actuellement la conserveront.",
      bodyZoneUsedMessage:
        "Cette zone corporelle ne sera plus proposée. Les exercices qui l’utilisent actuellement la conserveront.",
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
    // Q53 (8) : nom accessible d'une Catégorie ou d'une Étiquette retirée encore affectée
    // (fond rouge clair, aucune mention visible).
    retiredEntryAccessibilityLabel: "{name}, retirée de la liste des choix",
    // §4.10 L136 ; CE-UI-09 L2812, L2836 ; CE-T03-16 L1665, L1673 : échec
    // d'écriture d'une opération de référentiel, partagé par Catégorie/
    // Zone/Étiquette — message, modale conservée ouverte, aucune
    // modification partielle (un nom vide ou invalide reste prévenu en
    // amont par la désactivation d'Ajouter/Enregistrer, jamais par cette
    // écriture).
    writeError: "La modification n’a pas pu être enregistrée. Réessayez.",
  },
} as const;
