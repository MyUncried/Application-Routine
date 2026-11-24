/**
 * J1 « Gestion des langues » (23/11/2026) : traduction anglaise de `screens.exercise`, `screens.categories`,
 * `screens.calendar`, `screens.history`, `screens.soundGuidance`, `screens.profile`, `screens.movement` et
 * `screens.profileEdit` de `fr.ts` (selon le glossaire validé, `docs/preparation/langues/GLOSSAIRE-EN-2026-11-23.md`).
 */
import type { FrResource } from "./en";

export const enScreensMovement: Pick<
  FrResource["screens"],
  "exercise" | "categories" | "calendar" | "history" | "soundGuidance" | "profile" | "movement" | "profileEdit"
> = {
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
    titleAdd: "Create exercise",
    titleEdit: "Edit exercise",
    backAccessibilityLabel: "Back",
    // Complétion REWORK12 (D-105) : « Zone bleue — Contexte séance et nom
    // de l'activité » (`3261:4151`/`3261:4160`) — `prefix` compose
    // `"${prefix} · ${nom de la séance}"`, jamais un littéral local dans
    // `ExerciseScreen.tsx`.
    // T01-S10 (doc13 §8) : le bandeau bleu ne rappelle plus le nom de la
    // Séance — `context.prefix` n'a plus de consommateur dans
    // `ExerciseScreen.tsx`. Clé conservée (aucun renommage/suppression
    // demandé) mais RETIRÉE de l'écran.
    context: {
      prefix: "Workout",
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
      description: "Exercise description",
      bodyZones: "Body focus",
      executionMode: "Execution mode",
      expandAction: "Expand section",
      collapseAction: "Collapse section",
    },
    // REWORK09, point 2/3 : « Nom » → « Nom de l'activité » (`Forms /
    // Text Field — Source exact`, libellé visible ET accessibilityLabel
    // du champ — même chaîne réutilisée pour les deux, patron déjà
    // établi). Complétion REWORK12 : réutilisée telle quelle comme
    // placeholder du champ, désormais logé dans la zone bleue
    // contextuelle plutôt que comme un champ autonome.
    name: "Exercise name",
    executionMode: {
      label: "Execution mode",
      duration: "Duration",
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
      repetitions: "Reps",
      // PRE-4 (story 1.1, FR-05-01) : deux Modes seulement — l'ancienne
      // troisième option « À l’échec » est retirée (une Cible, FR-05-04).
    },
    duration: {
      // Déjà conforme au libellé compact Figma (« Durée ») — aucun
      // changement de valeur nécessaire.
      label: "Duration",
      // Distinct de `executionMode.duration` (même mot, deux contrôles
      // différents : l'onglet de mode et la ligne roulette) — un même
      // `accessibilityLabel` sur les deux rendrait l'un inatteignable par
      // requête d'accessibilité univoque.
      accessibilityLabel: "Exercise duration",
    },
    repetitionCount: {
      label: "Number of reps",
      accessibilityLabel: "Number of reps",
      // Distincte de `accessibilityLabel` (ligne) : `NumberWheelPicker`
      // reçoit un unique `accessibilityLabel`, qui entrait en collision
      // avec celui de la ligne une fois le sélecteur ouvert (audit
      // `T01_S01_S08_CONFORMITY_AUDIT_20260902.md`, AUD-05).
      wheelAccessibilityLabel: "Reps wheel",
      // REWORK09, point 6 : libellé COURT affiché au-dessus du contrôle
      // compact (`Activity / Parameter Row — Source exact`) — distinct
      // de `label`/`accessibilityLabel` ci-dessus, conservés inchangés
      // pour le nom accessible complet.
      compactLabel: "Reps",
    },
    pauseSeconds: {
      label: "Rest after set",
      // REWORK09, point 6 : nom accessible explicite — auparavant
      // confondu avec `label`, désormais distinct du libellé compact
      // visible ci-dessous (même patron que `duration`).
      accessibilityLabel: "Rest after set",
      compactLabel: "Rest",
    },
    seriesCount: {
      label: "Number of sets",
      accessibilityLabel: "Number of sets",
      wheelAccessibilityLabel: "Sets wheel",
      // REWORK09, point 6.
      compactLabel: "Sets",
    },
    // T02-S02 (CE-T01-13/CE-T01-14) : seconde rangée de paramètres,
    // `Récupération` à gauche puis `Durée totale` à droite. Les deux
    // héritent du contrat de roulette minutes/secondes (`Type=Duration`) —
    // aucun écran supplémentaire n'est requis.
    recoverySeconds: {
      label: "Recovery after sets",
      accessibilityLabel: "Recovery after sets",
      compactLabel: "Recovery",
    },
    // T02-S02 (seconde recette visuelle, point 9) : en modes `Répétitions`
    // et « À l'échec », la Durée totale reste AFFICHÉE mais devient une
    // BORNE MINIMALE non modifiable — la durée d'une Série y est inconnue.
    // Le `≥` du libellé dit exactement cela ; il reprend le glyphe déjà
    // employé par toutes les bornes minimales de l'application (synthèses
    // du Catalogue et du Tour), jamais une écriture concurrente.
    totalDuration: {
      label: "Total exercise duration",
      accessibilityLabel: "Total exercise duration",
      compactLabel: "Total duration",
      compactLabelLowerBound: "Total duration ≥",
      accessibilityLabelLowerBound: "Minimum total exercise duration",
    },
    wheelPicker: {
      minutesAccessibilityLabel: "Minutes",
      secondsAccessibilityLabel: "Seconds",
      // R4-09 : même contrat toolbar Annuler/Valider que Composition —
      // câblage mécanique nécessaire au nouveau contrat de props partagé
      // de `DurationWheelPicker`, hors périmètre visuel de cette revue.
      cancelAccessibilityLabel: "Cancel",
      validateAccessibilityLabel: "Done",
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
      pauseLabel: "rest",
      pauseSuffix: "between sets",
      recoveryPrefix: "then",
      recoveryLabel: "recovery",
      totalDurationLabel: "Total duration",
    },
    // T02-S02 : la Durée totale saisie n'est jamais persistée (DM-015/DM-016) ;
    // elle PILOTE le nombre de Séries via le calcul inverse
    // `Cth = (D − R + B) / (A + B)`. Un arrondi ou un bornage `[1, 99]`
    // rend la durée effective différente de la cible : le message ci-dessous
    // l'annonce explicitement plutôt que de corriger silencieusement.
    adjustedTotalDurationMessage:
      "Duration adjusted to {duration} for a whole number of sets.",
    // T02-S02 (continuation) : ce message est désormais rendu dans la
    // notification noire temporaire canonique (`color.snackbar`, RM-010),
    // qui exige une action de CORRECTION — `Annuler` restitue le nombre de
    // Séries d'avant l'ajustement, il ne se contente pas de refermer.
    adjustedTotalDurationUndoAction: "Undo",
    // T02-S02 (CE-T01-13) : le champ multiligne de la section repliable
    // « Description de l'activité » — même chaîne que `sections.description`,
    // qui est le titre de la section qui le contient. Le nom accessible de
    // l'en-tête, lui, est composé avec `sections.expandAction`/
    // `collapseAction`, ce qui laisse ce libellé UNIQUE pour le champ.
    instruction: {
      label: "Exercise description",
      // PRE-5 story 3.1 (FR-33, FR-44, AC1, AC6) : invites grises de la Description en
      // étapes (première ligne de l’état vide, ligne suivant la dernière étape) et nom
      // VoiceOver de chaque étape, numéro compris (`{n}` : numéro de l’étape).
      firstStepPlaceholder: "Describe the first step",
      nextStepPlaceholder: "Next step",
      stepAccessibilityLabel: "Step {n}",
    },
    // T02-S02 (continuation) : même chaîne que `sections.bodyZones`, qui
    // est le titre de la section contenant ce sélecteur — l'unicité du nom
    // accessible reste assurée par la composition du nom de l'en-tête
    // (`expandAction`/`collapseAction`), jamais par une divergence de
    // libellé entre le titre et son contenu.
    bodyZones: {
      label: "Body focus",
      accessibilityLabel: "Body focus",
      // PRE-4 story 4.3 (FR-02-05, P35) : libellé visible de l'accès non
      // renseigné et séparateur des Zones choisies dans le bandeau, tels que
      // montrés par les captures `8328:35698` et `8328:37022` (texte
      // « Cuisses . Fessier ») ; le point médian reste la règle des cartes
      // consommatrices, hors bandeau (FR-02-05, notes).
      unsetLabel: "Body focus",
      // Revue 4.3 (WCAG 2.5.3) : nom accessible de l'accès non renseigné, qui contient
      // le libellé visible, sur le modèle de `category.unsetAccessibilityLabel`.
      unsetAccessibilityLabel: "Body focus — not set",
      // Q49 (a) : valeur en attente de Hermann (« . » de la capture ou point médian).
      bandSeparator: " . ",
    },
    // T01-S10 (doc13 §8, frame `1992:9132`) : bouton centré, VISIBLE mais
    // DÉSACTIVÉ dans le MVP — aucune section Médias, aucun import/galerie/
    // lecture/stockage (Médias V2 hors périmètre).
    // Correctif T02 (2026-09-08, point 5) : le `+` n'est plus porté par ce
    // libellé — il est rendu séparément par l'icône DSF `action-add`
    // (`ExerciseScreen.tsx`), jamais comme caractère de texte concaténé.
    addMedia: "Add media",
    addMediaUnavailableAccessibilityLabel: "Add media — unavailable",
    // T02-S02 (D-137) : l'écran unifié n'a plus d'étape intermédiaire à
    // valider — `validateAction` (« Valider ») n'a plus de consommateur et
    // est supprimé ; seul `finishAction` (« Terminer ») clôt l'écran.
    finishAction: "Finish",
    exitConfirmModal: {
      title: "Discard changes?",
      // V2-PRE-1 (critère UI-D35DA2C4F266) : « cet exercice » remplace « cette activité ».
      message: "Changes to this exercise will be lost.",
      // REWORK11 (`[ChatGPT] CHANGES_REQUESTED — REWORK11 — dialogue
      // d'abandon d'une Activité`, 2026-09-04) : « Continuer la
      // modification » → « Annuler », « Abandonner » → « Confirmer » —
      // vérifié directement sur l'instance `3224:4140` (frame CE-T01-16,
      // `3224:4082`). Mêmes clés (`continueEditing`/`abandon`), mêmes
      // props `onCancel`/`onConfirm` déjà correctement nommées ;
      // même correction que REWORK10 sur `composition.abandonModal`.
      continueEditing: "Cancel",
      abandon: "Confirm",
      // PRE-4 story 4.2 (Q18, AC12) : textes du dialogue en CRÉATION (CC, CS) ;
      // `title` / `message` ci-dessus restent ceux de la MODIFICATION (MC, MS).
      // Le texte de la capture `8328:36781` (« l'activité ne sera pas créé »)
      // n'est pas repris.
      createTitle: "Discard creation?",
      createMessage: "Your entries will be lost and the exercise won’t be created.",
    },
  },
  // T01-S09 (CE-T01-11/CE-T01-12, D-106/D-107) : aucun texte introductif
  // supplémentaire n'est affiché sur cet écran — le titre de section
  // (`sectionLabel`) et les tags suffisent, conformément à D-106.
  // Q54 : l'écran « Catégories de la séance » est supprimé ; seul reste le suffixe d'état des
  // options des feuilles de Catégorie et d'Étiquette (identifiant historique conservé).
  categories: {
    tagAccessibility: {
      selectedSuffix: "selected",
    },
  },
  calendar: {
    title: "Calendar",
    placeholder:
      "The routine calendar will come in a future release.",
  },
  history: {
    title: "Progress",
    placeholder:
      "Workout progress will come in a future release.",
  },
  // V2-PRE-2 (plan §6.5, CE-UI-07) : écran Profil — six réglages,
  // quatre préférences locales, accès à Modifier le profil. `placeholder`
  // (ancien écran d'attente) est retiré : cet écran porte désormais une
  // UI réelle (même patron que `sessions`/`activities` en leur temps).
  // Guidage sonore — Profil › Préférences et modale de Composition (documentation de main `ebe72f76`, ch13 « Guidage
  // sonore en Composition et dans le Profil » ; Figma 1992:684, 12093:25010, 12132:27436, 12175:25882, 12068:25044).
  soundGuidance: {
    title: "Voice guidance",
    buttonLabel: "Voice guidance",
    buttonHint: "Opens voice guidance settings for this workout",
    close: "Close",
    validate: "Done",
    announcementsTitle: "Voice guidance",
    eventsTitle: "Sounds and vibrations",
    soundColumn: "Sound",
    vibrationColumn: "Vibration",
    announcements: {
      session: "Workout start and end",
      names: "Exercise names",
      phases: "Phase names",
      objective: "Duration and rep targets",
      pauses: "Rest, recovery and holds",
      sides: "Side switches",
      rounds: "Round announcements",
    },
    events: {
      COUNTDOWN: "Countdown",
      EXERCISE_START: "Exercise start",
      PHASE_CHANGE: "Phase change",
      SIDE_CHANGE: "Side switch",
      CADENCE: "Tempo",
      // Recette du 11/11/2026 (Hermann, y1). [« Toutes les X minutes » — remplacé.]
      EVERY_MINUTES: "Every minute",
      HALF_TIME: "Halfway",
      STOP_POINT: "Hold",
      SESSION_END: "Workout end",
    },
    soundValue: {
      DEFAULT: "Default",
      // Recette du 11/11/2026 (Hermann, y3 : « son nom doit être "Aucun" […] et non pas "Non" »). [« Non » — remplacé.]
      NONE: "None",
    },
    soundHint: "Opens sound picker",
    soundLabel: "Sound, {event}",
    vibrationLabel: "Vibration, {event}",
    picker: {
      default: "Default",
      none: "None",
      librarySection: "App sounds",
    },
    librarySounds: {
      BIP_COURT: "Short beep",
      BIP_GRAVE: "Low beep",
      BIP_DOUBLE: "Double beep",
      BIP_LONG: "Long beep",
      SIFFLET_ROULE: "Trill whistle",
      SIFFLET_PUR: "Pure whistle",
      SIFFLET_COURT: "Short whistle",
      FANFARE_COURTE: "Fanfare",
      DING: "Ding",
      CLIC_DOUX: "Soft click",
    },
  },
  profile: {
    title: "Profile",
    groups: {
      exercise: "Exercise",
      session: "Workout",
      preferences: "Preferences",
      guidance: "Guidance",
      notifications: "Notifications",
    },
    // J1 (D-569, règle 2 de « Gestion des langues ») : la ligne ouvre le réglage iOS de langue de l’application.
    language: {
      // Titre de la section en tête des Préférences (Figma `1992:684`).
      sectionTitle: "Language and units",
      label: "Language",
      hint: "Opens the app’s settings to change the language",
    },
    /** Nom de chaque langue dans sa propre langue (usage iOS) : identique dans tous les catalogues. */
    languageNames: { fr: "Français", en: "English" },
    settings: {
      sideChangeRecovery: { label: "Rest between sides", unit: "s" },
      exerciseCountdown: { label: "Exercise countdown", unit: "s" },
      exerciseEnd: { label: "Exercise end", unit: "s" },
      postActivityRecovery: { label: "Recovery after exercise", unit: "s" },
      // Figma `1992:684` (documentation de main `ebe72f76`).
      sessionInitialCountdown: { label: "Workout countdown", unit: "s" },
      sessionFinalPhase: { label: "Workout end", unit: "s" },
    },
    stepper: {
      decrementAccessibilityLabel: "Decrease",
      incrementAccessibilityLabel: "Increase",
      minimumReachedSuffix: "minimum reached",
      maximumReachedSuffix: "maximum reached",
      // CE-UI-07 L2569 : annoncée par la valeur, en TOUTE position (mi-course,
      // borne basse, borne haute) — jamais seulement au bouton désactivé à la
      // limite. Clé de format : `{value}` reprend la valeur déjà unitée
      // (ex. "10 s"), `{min}` la borne basse SANS unité, `{max}` la borne
      // haute unitée — ex. "10 s, de 0 à 300 s".
      boundsAccessibilityLabel: "{value}, from {min} to {max}",
      saveError: "The change couldn’t be saved. Try again.",
    },
    preferencesSwitches: {
      sounds: "Sounds",
      voiceAnnouncements: "Announce exercise names",
      announceObjective: "Announce reps or duration",
      announcePauses: "Announce rest and recovery",
      announceSession: "Announce workout start and end",
      announceSides: "Announce side switches",
      announcePhases: "Announce movement phases",
      vibration: "Vibration",
      notifications: "Notifications",
    },
    // Figma `1992:684` : onglets de l'en-tête ; Communauté hors MVP.
    tabs: {
      profile: "Profile",
      preferences: "Preferences",
      community: "Community",
      communityUnavailable: "Community, unavailable",
    },
    // Figma `1992:684` : section Notifications.
    notifications: {
      label: "Allow notifications",
      subtitle: "Reminders for planned workouts",
    },
    editProfileAction: "Edit profile",
    identity: {
      unsetDisplayNameAccessibilityLabel: "Name not set",
    },
  },
  // PRE-8 (B.2, B.3, CE-MVT-01, Figma `10415:21706` à `10453:23030`) : fiche Mouvement et
  // Catalogue des Mouvements. Libellés relevés dans Figma ; C03 réutilise `activities.editor`.
  movement: {
    titles: {
      create: "Create movement",
      consult: "Movement",
      edit: "Edit movement",
      // Ordre de Hermann du 01/11/2026, ch13 CE-T03-08 et l.5269 : écran ouvert par « Créer un
      // exercice » depuis le menu Créer de la Composition.
      sessionCreate: "Create exercise",
      // Recette du 05/11/2026 au soir (r-creer, Hermann : « Le titre de la modale doit être « Choisir ou créer un mouvement » ») ;
      // Q2 du 06/11 : « ok, je regarderai à l’usage ». Remplace « Créer un exercice » pour la fiche ouverte par Exercice libre.
      sessionChooseOrCreate: "Choose or create a movement",
    },
    finish: "Finish",
    // Même source : confirmation du mouvement en contexte Séance (les autres contextes gardent « Terminer »).
    sessionFinish: "Create exercise",
    // Demande de Hermann du 05/11/2026 (soir) : fiche « Modifier un mouvement », coche Valider de l'en-tête.
    validate: "Done",
    edit: "Edit movement",
    close: "Close",
    // Recette iPhone du 06/11/2026 (t-fiche-choix, t-cat-choix) : bouton Retour de la fiche d'un mouvement choisi.
    back: "Back",
    loadError: "The movement couldn’t be loaded.",
    retry: "Retry",
    saveError: "The movement couldn’t be saved. Your entries are kept.",
    // Recette A/B (F03) : titre de la Description sur la fiche Mouvement (Figma `10453:23036`).
    descriptionTitle: "Movement description",
    // Recette iPhone du 29/10/2026 (Hermann ; Figma `10415:21706`) : texte par défaut du Nom de la
    // fiche Mouvement, en gris clair. [Remplace, sur cette fiche seulement, « Nom de l’exercice »
    // (`activities.editor.name`), qui reste celui de l’Éditeur d’Exercice.]
    namePrompt: "Movement name",
    // Recette A/B B.10 (q6-2) : invite grise après le nom d'un Mouvement archivé.
    archivedNameSuffix: "(archived)",
    // Recette A/B B.10 (remarque 4) : compteur du gabarit photo, à la place du badge « Vidéo ».
    mediaCounter: "{rank} / {total}",
    // PRE-8, recette A/B (27/10) : bouton de lecture du gabarit photo (vidéo seulement).
    playVideo: "Play video",
    // Recette A/B B.10 (remarque 6) : actions des cartes de résultat de la fiche Mouvement.
    suggestion: {
      useMovement: "Open this movement",
      createVariant: "Add a level",
    },
    // Recette A/B B.10 (b2-4) : ↑ des Phases, qui ferme le clavier comme celui de la Description.
    phasesSubmitAccessibilityLabel: "Done with phases",
    phases: {
      // Recette du 05/11/2026 (n-fiche, Hermann) : « (si il faut les minuter pendant l'exécution) ». [« (pour minuter l'exécution) » — remplacé.]
      title: "Movement phases (if they need timing during the workout)",
      firstPlaceholder: "Name the first phase",
      nextPlaceholder: "Next phase",
      labelAccessibility: "Phase {rank}",
      remove: "Remove phase {rank}",
      row: "Phase {n}",
      moveUp: "Move up",
      moveDown: "Move down",
      // PRE-9 A.2b (Hermann, 30/10/2026) : durée facultative de la phase, reprise par défaut dans
      // un nouvel Exercice. Rendu choisi (aucun Figma dédié) : valeur à droite du libellé.
      durationPrompt: "Duration",
      durationAccessibility: "Phase {rank} duration",
      durationNone: "no duration",
      // [Recette iPhone n° 2 du 31/10/2026 : roulette et « Sans durée » retirés (saisie au clavier
      // numérique) — libellés « Durée par défaut » et « Sans durée » supprimés.]
    },
    catalogue: {
      segment: "Movements",
      title: "Movement catalog",
      searchPlaceholder: "Search",
      searchAccessibilityLabel: "Search movements",
      create: "Create movement",
      empty: "No movements yet.",
      noResult: "No movement matches your search.",
      loadError: "Movements couldn’t be loaded.",
      retry: "Retry",
      openAccessibilityHint: "Opens the movement card",
      // PRE-8 (B.5, B.6, B.7, B.8) : piles, actions glissées, filtres et archives (Figma page 510:101).
      noMatch: "No movement matches your search or filters.",
      pileAccessibilityLabel: "{name}, {count} levels shown",
      pileExpandHint: "Expands stack",
      pileCollapse: "Collapse stack",
      archivedAccessibility: "archived",
      // D-510 (Hermann, 06/11/2026) : badge d'une fiche créée — « New », seule la première lettre en majuscule ; « New ↓ » sur la
      // tête d'une pile repliée dont un niveau caché est nouveau. [Recette du 06/11 (t-niveau) : « NEW » — remplacé.]
      newBadge: "New",
      newInPileBadge: "New ↓",
      newAccessibility: "new",
      newInPileAccessibility: "contains a new level",
      // Décision de Hermann du 16/11/2026 (CE-MVT-03, Bascule) : présentation en liste ou en grille de photos.
      viewList: "Show as list",
      viewGrid: "Show as grid",
      // Recette A/B (D03) : croix d'effacement de la recherche.
      searchClear: "Clear search",
      // Recette A/B (B08, MFN-05) : réordonnancement des Niveaux d'une pile déployée.
      reorderHint: "Long press, then drag to reorder levels",
      moveHarder: "Move {name} one level up",
      moveEasier: "Move {name} one level down",
      reorderError: "The level order couldn’t be saved. Try again.",
      // PRE-8, familles de niveaux (règle E2 du 28/10/2026) : messages des changements d'appartenance.
      family: {
        created: "New level family created",
        dissolved: "Level family deleted",
        left: "Movement removed from family",
        // Entrée dans une famille existante : la DSF du 28/10 ne fournit pas ce libellé (réserve de
        // transcription) ; texte validé par Hermann le 28/10/2026 (recette FAM).
        joined: "Movement added to family",
      },
      actions: {
        share: "Share",
        // Recette A/B (B12, CE-MVT-02) : « Ajouter un niveau » remplace « Créer une variante ».
        addLevel: "Add a level",
        archive: "Archive",
        restore: "Restore",
        delete: "Delete",
      },
      archived: "Movement archived",
      restored: "Movement restored",
      undo: "Undo",
      archiveRefused: {
        title: "Can’t archive",
        messageOne: "This movement is used by 1 exercise. You can archive it once it no longer is.",
        messageMany: "This movement is used by {count} exercises. You can archive it once it no longer is.",
        acknowledge: "Got it",
      },
      deleteRefused: {
        title: "Can’t delete",
        messageOne: "This movement is used by 1 exercise.",
        messageMany: "This movement is used by {count} exercises.",
      },
      deleteConfirm: {
        title: "Delete this movement?",
        message: "This archived movement will be permanently deleted. This can’t be undone.",
        cancel: "Cancel",
        confirm: "Confirm",
      },
      actionError: "The action couldn’t be completed.",
      filters: {
        command: "Filters",
        title: "Filters",
        close: "Close",
        apply: "Apply filters",
        reset: "Reset",
        status: "Status",
        active: "Active",
        archivedValue: "Archived",
        levels: "Levels",
        withLevels: "With levels",
        withoutLevel: "No levels",
        usage: "Usage",
        withExercise: "With exercises",
        withoutExercise: "No exercises",
        categories: "Categories",
        bodyZones: "Body focus",
        activeSummary: "{count} filters",
        // Recette A/B (D05, ch13 §4.5) : commande étendue — le rond retire les filtres, la zone
        // texte ouvre la feuille.
        clearAccessibility: "Clear filters",
        editAccessibility: "Edit filters",
      },
    },
  },
  // V2-PRE-2 (plan §6.5, CE-UI-01) : écran Modifier le profil — nom,
  // photo, silhouette, dans un brouillon enregistré par `Enregistrer`.
  profileEdit: {
    title: "Edit profile",
    backAccessibilityLabel: "Back",
    // Écran Profil aligné sur Figma 12119:25611 (11/11/2026) : en-tête à trois onglets. « Préférences »
    // ramène à l'écran Profil, qui porte les réglages et préférences ; « Communauté » visible et
    // désactivée, sans écran (même règle que la navigation basse, E01).
    tabs: {
      profile: "Profile",
      preferences: "Preferences",
      community: "Community",
      communityUnavailableAccessibilityLabel: "Community — unavailable",
    },
    profileTabs: {
      account: "Account",
      preferences: "Preferences",
      privacy: "Privacy",
    },
    accountRows: {
      publicName: "Public username",
      access: "Account access and sign-in",
    },
    sectionLabel: "Profile",
    name: {
      label: "Name",
      placeholder: "Name",
      errorRequired: "Name is required.",
      errorTooLong: "Name can’t exceed 80 characters.",
    },
    photo: {
      addAccessibilityLabel: "Add photo",
      changeAccessibilityLabel: "Change photo",
      initialsAccessibilityLabel: "Profile initials",
      editLabel: "Edit photo",
      errorMessage: "The photo couldn’t be added. Try again.",
    },
    silhouette: {
      label: "Silhouette",
      homme: "Male silhouette",
      femme: "Female silhouette",
      toggleHint: "Tap to switch silhouette.",
    },
    saveAction: "Save",
    saveError: "The profile couldn’t be saved. Try again.",
    abandonModal: {
      title: "Discard changes?",
      message: "Changes to the profile will be lost.",
      continueEditing: "Cancel",
      abandon: "Confirm",
    },
  },
};
