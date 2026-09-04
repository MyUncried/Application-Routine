import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { NAME_MAX_LENGTH } from "@/domain/sessions/validation";
import { FIXED_TOUR_REPEAT_COUNT } from "@/domain/sessions/defaults";
import { isSessionDraftDirty } from "@/domain/sessions/SessionDraft";
import { AbandonCreationModal } from "@/features/sessions/AbandonCreationModal";
import { ColorPalette } from "@/features/sessions/ColorPalette";
import {
  formatCompositionSummary,
  formatDurationRowValue,
  formatExerciseRowSummary,
} from "@/features/sessions/compositionPresentation";
import { DurationWheelPicker } from "@/features/sessions/DurationWheelPicker";
import { useSessionDraft } from "@/features/sessions/SessionDraftContext";
import { useCompositionExitGuard } from "@/features/sessions/useCompositionExitGuard";
import { strings } from "@/shared/i18n";
import { ContextBand, FixedHeader, HeaderSeparator, ScreenShell } from "@/shared/ui/ScreenShell";
import { KodjoIcon, type KodjoIconName } from "@/shared/ui/KodjoIcon";
import { colors, dimensions, minTouchTarget, spacing, type } from "@/shared/ui/tokens";

type OverlayKind = "color" | "countdown" | "finalPhase";

/**
 * Écran `Composition d'une séance` (T01-S07, docs §06 Écran 3 ; corrections
 * de conformité — audit `T01_S01_S08_CONFORMITY_AUDIT_20260902.md`,
 * instruction Codex de correction autonome ; consolidation Foundation —
 * `[ChatGPT] DIAGNOSTIC APPROVED — PHASE02 CONSOLIDATED REWORK02`,
 * 2026-09-03 ; correction cumulative post contre-recette iPhone —
 * `[ChatGPT] DEVICE NO-GO — PHASE02 REWORK03 CUMULATIVE CORRECTION`,
 * 2026-09-03, identifiants `C-01/C-02/T-01…T-05/A-01`) ; REWORK06
 * (`[ChatGPT] PLAN_APPROVED — REWORK06 — RESTAURATION CIBLÉE DE LA
 * ROULETTE + VERROU DE CAPITALISATION`, 2026-09-04) — Header, zone Context
 * et zone Bottom Action sont désormais une **BASELINE GELÉE** (validation
 * iPhone utilisateur `CONFORME`) : conservées inchangées ce cycle, toute
 * régression de leur position est interdite (voir `.github/
 * AI_ORCHESTRATION.md`, « Conservation des acquis / Change Control »).
 *
 * Le brouillon vient de `SessionDraftProvider` (monté par
 * `app/(creation)/_layout.tsx`, au-dessus de cet écran) — cette route ne
 * connaît ni SQLite ni `SessionService` : aucun enregistrement n'a lieu
 * avant T01-S09.
 *
 * Un seul sélecteur intégré ouvert à la fois (couleur, Compte à rebours,
 * Fin de séance) — état `openOverlay` unique (plan §5).
 *
 * **CMP-01/Racine non interactive + backdrop dédié** (correction
 * consolidée) : l'écran entier n'est plus un `Pressable` racine (défaut
 * D-03 identifié — un `Pressable` plein écran intercepte le geste avant
 * même qu'il n'atteigne un contrôle imbriqué, y compris parfois le
 * contrôle qu'on cherche justement à ouvrir). La racine (`ScreenShell`) est
 * désormais un simple conteneur ; un `Pressable` `backdrop` dédié n'est
 * rendu QUE lorsqu'un sélecteur est ouvert, en dernier frère de premier
 * niveau — sans `zIndex` propre (donc peint au-dessus des frères par
 * défaut, du seul fait de son ordre), il reste sous la ligne/bande
 * effectivement `elevated` (`zIndex: 1`) : les contrôles ouverts restent
 * tactiles, tout le reste ferme le sélecteur au toucher.
 *
 * `+ Ajouter une activité` (T01-S08) navigue vers l'écran Exercice
 * (`/exercise`) ; celui-ci lit lui-même `draft.exercise` pour déterminer
 * s'il s'agit d'un ajout ou d'une modification — aucun paramètre de route
 * n'est nécessaire. Le modèle `SessionDraft.exercise` restant un unique
 * champ nullable (pas un tableau, hors périmètre T01), le bouton d'ajout
 * est masqué dès qu'un Exercice existe : une ligne récapitulative le
 * remplace, pressable pour rouvrir l'écran en modification.
 *
 * Chaque roulette intégrée (Compte à rebours, Fin de séance) est ancrée en
 * superposition (`position: "absolute"`, correction CE-T01-06/07) plutôt
 * que rendue en flux : elle ne repousse plus les éléments suivants. La
 * validation de la valeur choisie n'a lieu qu'à la fermeture du sélecteur
 * (démontage de `DurationWheelPicker`, voir ce fichier) — jamais à chaque
 * cran de défilement (D-06).
 *
 * `Retour` (correction CE-T01-04, AUD-03) : action visible identique au
 * patron déjà validé sur `ExerciseScreen.tsx` — navigation arrière normale,
 * interceptée par `useCompositionExitGuard` exactement comme le geste
 * système.
 */
export function CompositionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { draft, updateDraft, resetDraft } = useSessionDraft();
  const [openOverlay, setOpenOverlay] = useState<OverlayKind | null>(null);

  const shouldBlockExit = isSessionDraftDirty(draft);
  const { isPendingExit, cancelExit, confirmExit } = useCompositionExitGuard(
    shouldBlockExit,
    resetDraft,
  );

  const closeOverlay = useCallback(() => setOpenOverlay(null), []);
  // REWORK08-B — voir la documentation détaillée sur `<ScrollView
  // style={styles.body}>` ci-dessous : élève le `ScrollView` lui-même
  // (jamais seulement l'`AnchoredRow` qu'il contient) au-dessus du
  // `backdrop` tant qu'un sélecteur de durée y est ancré.
  const bodyElevated = openOverlay === "countdown" || openOverlay === "finalPhase";

  const toggleOverlay = useCallback((kind: OverlayKind) => {
    Keyboard.dismiss();
    setOpenOverlay((current) => (current === kind ? null : kind));
  }, []);

  const composition = strings.screens.composition;
  // REWORK08-C (`[ChatGPT] CHANGES_REQUESTED — REWORK08 — roulette native +
  // synthèse Tour`, 2026-09-04, addendum précédemment `QUEUED_FOR_NEXT_
  // COMPOSITION_REWORK` désormais explicitement autorisé) : calculée UNE
  // SEULE FOIS, réutilisée à la fois par `TourCard` (nouvelle synthèse sous
  // `Nombre de tours`) et par `bottomAction` (synthèse déjà existante) —
  // même contenu canonique (`formatCompositionSummary`), jamais recalculé
  // ni reformulé localement pour l'un ou l'autre emplacement.
  //
  // REWORK13 (R13-02) : `initialCountdownSeconds`/`finalPhaseSeconds` ne
  // sont plus transmis — `Compte à rebours initial`/`Fin de séance` sont
  // des éléments structurels hors Tour, désormais toujours exclus de cette
  // synthèse (voir `compositionPresentation.ts`). Confirmer l'un ou
  // l'autre sélecteur n'actualise donc plus jamais `compositionSummary`,
  // par construction (ces deux champs du brouillon ne sont plus lus par
  // cette fonction).
  const compositionSummary = formatCompositionSummary({ exercises: draft.exercises });

  return (
    <ScreenShell>
      <FixedHeader
        title={composition.title}
        onBack={() => router.back()}
        backAccessibilityLabel={composition.backAccessibilityLabel}
      />
      <HeaderSeparator />

      <ContextBand elevated={openOverlay === "color"}>
        {/*
         * CMP-02 : le champ Nom et le sélecteur de couleur partagent
         * désormais UN SEUL champ blanc arrondi (`nameColorField`) posé sur
         * la bande Context — auparavant deux éléments distincts directement
         * sur le fond bleu pâle de la bande.
         */}
        <View style={styles.nameColorField} testID="composition-name-color-field">
          <TextInput
            value={draft.name}
            onChangeText={(text) => updateDraft({ name: text })}
            onFocus={closeOverlay}
            placeholder={composition.name}
            // R4-01 (`[ChatGPT] CHANGES_REQUESTED — Composition d'une
            // séance — audit indépendant REWORK04`, 2026-09-03) : le
            // placeholder lui-même utilise désormais `text-primary`
            // (`#141414`), pas seulement le texte réellement saisi —
            // corrige `placeholderTextColor`, précédemment
            // `colors.textSecondary`.
            placeholderTextColor={colors.textPrimary}
            accessibilityLabel={composition.name}
            maxLength={NAME_MAX_LENGTH}
            style={styles.nameInput}
          />
          <ColorPalette
            value={draft.color}
            onChange={(color) => {
              updateDraft({ color });
              closeOverlay();
            }}
            isOpen={openOverlay === "color"}
            onToggle={() => toggleOverlay("color")}
          />
        </View>

        {/*
         * CMP-02 : `+ Ajouter une activité` centré (auparavant
         * `alignSelf: "flex-start"`). Boîte visuelle compacte issue du
         * composant DS (`dimensions.compactSecondaryButton`, même token que
         * le bouton Créer du Catalogue) — fond blanc, bordure/icône/texte
         * primaires, cible tactile `≥48` via `hitSlop` indépendante de la
         * boîte visuelle.
         *
         * **Complétion REWORK12 (COMP-03)** (`[ChatGPT] Applique
         * impérativement le protocole KODJO actif...`, 2026-09-04) : reste
         * désormais TOUJOURS visible et utilisable, y compris après l'ajout
         * d'une ou plusieurs Activités — abroge la restriction précédente
         * (« Masqué dès qu'un Exercice existe », modèle T01 à Exercice
         * unique) : `draft.exercises` est désormais une collection ordonnée
         * (`SessionDraft.ts`), et ce bouton navigue systématiquement vers
         * `/exercise` SANS paramètre `exerciseId` — un identifiant frais y
         * est généré, ajoutant toujours une NOUVELLE Activité en fin de
         * collection, jamais en remplacement d'une existante.
         */}
        <Pressable
          onPress={() => router.push("/exercise")}
          accessibilityRole="button"
          accessibilityState={{ disabled: false }}
          accessibilityLabel={composition.addActivity}
          hitSlop={{
            top: (minTouchTarget - dimensions.compactSecondaryButton.visualHeight) / 2,
            bottom: (minTouchTarget - dimensions.compactSecondaryButton.visualHeight) / 2,
            left: spacing[8],
            right: spacing[8],
          }}
          style={styles.addActivityAction}
        >
          <KodjoIcon name="action-add" testID="composition-add-activity-icon" />
          <Text style={styles.addActivityLabel}>{composition.addActivity}</Text>
        </Pressable>
      </ContextBand>

      {/*
       * R4-13 (`Fixed Header + Fixed Context + Scrollable Content + Fixed
       * Bottom Action`, `[ChatGPT] REWORK04 ADDENDUM — FIXED SHELL /
       * ACTIVITIES SCROLL CONTRACT`, 2026-09-03) : `composition-body` est
       * désormais un unique `ScrollView` — le seul conteneur défilant de
       * l'écran. Header/séparateur/bande Context restent au-dessus, hors de
       * ce `ScrollView` (jamais recouverts) ; la zone d'action basse
       * (synthèse + `Continuer`) reste en dessous, également hors de ce
       * `ScrollView` (S-01 à S-04). `keyboardShouldPersistTaps="handled"` :
       * un appui sur une ligne/action de cette liste reste effectif même si
       * le champ Nom a le focus clavier, sans nécessiter un premier appui
       * « perdu » pour seulement fermer le clavier (même patron déjà
       * établi sur `ExerciseScreen.tsx`).
       *
       * Limite disclosed (non vérifiée sur device) : un popover de roulette
       * (`PopoverAnchor`, `position: absolute` relatif à sa ligne) ancré à
       * une ligne proche du bas de la zone visible du `ScrollView` pourrait
       * être partiellement rogné par le bord de ce dernier — comportement
       * standard de clipping React Native, non contourné ici faute de
       * pouvoir le vérifier sans appareil. En T01, au plus 4 lignes
       * existent (Compte à rebours, Activité optionnelle, Tour, Fin de
       * séance) : le risque pratique reste faible tant qu'aucune Activité
       * supplémentaire n'existe (hors périmètre T01, modèle à Exercice
       * unique).
       *
       * **REWORK08-B — cause racine identifiée et corrigée** (`[ChatGPT]
       * CHANGES_REQUESTED — REWORK08 — roulette native + synthèse Tour`,
       * 2026-09-04 ; constat iPhone : « dès que l'utilisateur touche une
       * roue... le sélecteur se ferme »). Chaîne d'événements AVANT
       * correction : `AnchoredRow.elevated` (voir plus bas) portait
       * `zIndex: 1`, mais un `zIndex` React Native ne se compare qu'ENTRE
       * FRÈRES PARTAGEANT LE MÊME PARENT — or `AnchoredRow` est un
       * descendant de CE `ScrollView`, jamais un frère direct de
       * `composition-backdrop` (frère direct de `ScreenShell`, rendu
       * APRÈS ce `ScrollView`). L'élévation de `AnchoredRow` ne « remontait »
       * donc jamais jusqu'au niveau où `backdrop` est comparé : ce dernier,
       * dernier frère de `ScreenShell` au `zIndex` par défaut identique (0)
       * à celui — également par défaut — de ce `ScrollView`, gagnait la
       * priorité de peinture/hit-testing sur l'ENSEMBLE du `ScrollView`,
       * popover ancré compris. Toute pression — un tap franc sur Annuler/
       * Valider comme le début d'un geste de défilement sur une roue —
       * atteignait donc `composition-backdrop` en premier, qui fermait
       * immédiatement le sélecteur via `closeOverlay` (`onPress`), avant
       * même que la vue native `Host` ne reçoive le geste. Aucune ligne du
       * mécanisme `elevated`/`backdrop` lui-même n'était fautive
       * isolément — seule la portée du `zIndex` de `AnchoredRow`, un
       * niveau trop bas dans l'arbre, ne pouvait pas produire l'effet
       * documenté par son propre commentaire (« un zIndex supérieur...
       * suffit à rester peint au-dessus du backdrop » — vrai pour
       * `ContextBand`, frère direct de `backdrop`, jamais vérifié pour
       * `AnchoredRow`, imbriqué plus profondément).
       *
       * Correction APRÈS : ce `ScrollView` — frère direct réel de
       * `composition-backdrop` — porte désormais lui-même `zIndex: 1`
       * (`bodyElevated`, réutilise `styles.elevated`, même mécanisme déjà
       * établi et correct pour `ContextBand`) tant qu'un sélecteur de
       * durée (`countdown`/`finalPhase`) y est ancré — jamais pour la
       * palette de couleur (`color`), gérée par `ContextBand`, un frère
       * direct distinct qui n'a pas besoin de cette élévation
       * supplémentaire. `AnchoredRow.elevated` reste par ailleurs
       * nécessaire et inchangé : il départage désormais correctement les
       * DEUX `AnchoredRow` ENTRE ELLES (éviter qu'une ligne fermée ne
       * peigne par-dessus le popover d'une ligne ouverte, cas déjà couvert
       * par UI-CTRL-002) — un problème de portée différent, à un niveau de
       * l'arbre différent, désormais correctement distingué de celui
       * corrigé ici.
       */}
      <ScrollView
        style={[styles.body, bodyElevated ? styles.elevated : null]}
        contentContainerStyle={styles.bodyContent}
        keyboardShouldPersistTaps="handled"
        testID="composition-body"
      >
        <AnchoredRow testID="composition-anchored-row-countdown" elevated={openOverlay === "countdown"}>
          <BoundaryActivityRow
            icon="composition-initial-countdown"
            label={composition.countdown.label}
            value={formatDurationRowValue(draft.initialCountdownSeconds)}
            isOpen={openOverlay === "countdown"}
            onPress={() => toggleOverlay("countdown")}
          />
          {openOverlay === "countdown" ? (
            <PopoverAnchor>
              <DurationWheelPicker
                totalSeconds={draft.initialCountdownSeconds}
                onValidate={(totalSeconds) => {
                  updateDraft({ initialCountdownSeconds: totalSeconds });
                  closeOverlay();
                }}
                onCancel={closeOverlay}
                minutesAccessibilityLabel={composition.wheelPicker.minutesAccessibilityLabel}
                secondsAccessibilityLabel={composition.wheelPicker.secondsAccessibilityLabel}
                cancelAccessibilityLabel={composition.wheelPicker.cancelAccessibilityLabel}
                validateAccessibilityLabel={composition.wheelPicker.validateAccessibilityLabel}
              />
            </PopoverAnchor>
          ) : null}
        </AnchoredRow>

        {/*
         * UI-COMP-003 : une fois créée, chaque Activité s'insère ICI — entre
         * Compte à rebours initial et Tour, jamais après Tour par défaut.
         *
         * **Complétion REWORK12 (« Plusieurs activités et bouton
         * persistant »)** : `draft.exercises` est désormais une collection
         * ORDONNÉE (`SessionDraft.ts`) — chaque élément produit sa propre
         * `BoundaryActivityRow`, dans l'ORDRE de la collection (celui-ci EST
         * l'ordre d'affichage, aucun tri séparé). Presser une ligne ouvre
         * `/exercise` avec son `exerciseId` (édition ciblée par
         * identifiant) — jamais l'identifiant d'une autre Activité de la
         * liste. Le déplacement réel reste hors périmètre de S08 (poignée
         * indicative uniquement, COMP-01/S09).
         */}
        {draft.exercises.map((exercise) => (
          <BoundaryActivityRow
            key={exercise.id}
            testID={`composition-exercise-row-${exercise.id}`}
            icon={null}
            label={exercise.name}
            value={formatExerciseRowSummary(exercise)}
            isOpen={false}
            onPress={() => router.push({ pathname: "/exercise", params: { exerciseId: exercise.id } })}
            accessibilityLabel={composition.exerciseRow.editAccessibilityLabel}
          />
        ))}

        <TourCard label={composition.tour.label} summary={compositionSummary} />

        <AnchoredRow testID="composition-anchored-row-finalPhase" elevated={openOverlay === "finalPhase"}>
          <BoundaryActivityRow
            icon="composition-end-session"
            label={composition.finalPhase.label}
            value={formatDurationRowValue(draft.finalPhaseSeconds)}
            isOpen={openOverlay === "finalPhase"}
            onPress={() => toggleOverlay("finalPhase")}
          />
          {openOverlay === "finalPhase" ? (
            <PopoverAnchor>
              <DurationWheelPicker
                totalSeconds={draft.finalPhaseSeconds}
                onValidate={(totalSeconds) => {
                  updateDraft({ finalPhaseSeconds: totalSeconds });
                  closeOverlay();
                }}
                onCancel={closeOverlay}
                minutesAccessibilityLabel={composition.wheelPicker.minutesAccessibilityLabel}
                secondsAccessibilityLabel={composition.wheelPicker.secondsAccessibilityLabel}
                cancelAccessibilityLabel={composition.wheelPicker.cancelAccessibilityLabel}
                validateAccessibilityLabel={composition.wheelPicker.validateAccessibilityLabel}
              />
            </PopoverAnchor>
          ) : null}
        </AnchoredRow>
      </ScrollView>

      {/*
       * CMP-06 (contre-recette iPhone, correction consolidée, 2026-09-03) :
       * zone d'action basse (`bottomAction`), poussée en bas
       * (`marginTop: "auto"`).
       *
       * REWORK09 (mission directe utilisateur, 2026-09-04, point 2
       * « CORRECTIONS CONNEXES — COMPOSITION ») : la ligne de synthèse
       * `0 activité · 0 min` précédemment affichée ICI est **supprimée** —
       * devenue redondante depuis REWORK08-C, qui affiche désormais la même
       * synthèse canonique (`compositionSummary`) directement sous le
       * libellé `Nombre de tours` (voir `TourCard` ci-dessus). `Continuer`
       * reste seul dans cette zone ; le style `summary` (devenu sans
       * consommateur) est supprimé avec elle plutôt que laissé mort.
       */}
      <View
        testID="composition-bottom-action"
        style={[styles.bottomAction, { marginBottom: insets.bottom + spacing[16] }]}
      >
        {/*
         * `Continuer` (CE-T01-04) — ARBITRAGE REQUIS, voir rapport d'audit :
         * le contrat exige une activation conditionnelle (Nom + Exercice
         * valide) et un libellé dynamique `Enregistrer`/`Continuer`, mais la
         * destination réelle (`Catégories de la séance`, CE-T01-11) n'existe
         * pas avant T01-S09. Comportement conservé tel quel dans l'attente
         * d'un arbitrage explicite — non tranché silencieusement.
         */}
        <Pressable
          disabled
          accessibilityRole="button"
          accessibilityState={{ disabled: true }}
          accessibilityLabel={composition.continueAction}
          style={styles.continueAction}
        >
          <Text style={styles.continueLabel}>{composition.continueAction}</Text>
        </Pressable>
      </View>

      {openOverlay !== null ? (
        <Pressable
          onPress={closeOverlay}
          accessible={false}
          testID="composition-backdrop"
          style={styles.backdrop}
        />
      ) : null}

      {isPendingExit ? <AbandonCreationModal onCancel={cancelExit} onConfirm={confirmExit} /> : null}
    </ScreenShell>
  );
}

/**
 * Ancre de positionnement d'un sélecteur intégré (correction CE-T01-06/07,
 * AUD-05) : React Native positionne un enfant `position: "absolute"`
 * relativement à la boîte de son parent immédiat, sans exiger que ce
 * parent porte explicitement `position: "relative"` (contrairement au
 * web). Ce `View` sert donc uniquement de parent immédiat commun à une
 * ligne et à son sélecteur, afin que ce dernier se superpose au contenu
 * suivant au lieu de le repousser.
 *
 * Correction UI-CTRL-002 (cycle de correction après contre-recette iPhone,
 * 2026-09-03) : cette superposition seule ne suffisait pas. `elevated`
 * élève l'`AnchoredRow` elle-même (et non plus seulement son popover
 * interne) au-dessus de SES FRÈRES DIRECTS — c'est-à-dire les autres
 * `AnchoredRow`/`TourCard` à l'intérieur du même `ScrollView` — afin
 * qu'une ligne fermée ne peigne jamais par-dessus le popover d'une ligne
 * ouverte.
 *
 * **Précision REWORK08-B** (portée corrigée d'une affirmation antérieure
 * inexacte de ce commentaire) : ce `zIndex` NE suffit PAS, à lui seul, à
 * rester peint au-dessus de `composition-backdrop` — un `zIndex` React
 * Native ne se compare qu'entre frères partageant le même parent immédiat,
 * or `AnchoredRow` est un DESCENDANT du `ScrollView` (`composition-body`),
 * jamais un frère direct de `backdrop` (frère direct de `ScreenShell`).
 * C'est désormais le `ScrollView` lui-même qui porte sa propre élévation
 * conditionnelle (`bodyElevated`, voir `CompositionScreen` ci-dessus) pour
 * gagner face à `backdrop` — un mécanisme distinct, à un niveau de l'arbre
 * différent, nécessaire en plus de celui-ci (pas à sa place).
 */
function AnchoredRow({
  children,
  elevated,
  testID,
}: {
  children: React.ReactNode;
  elevated: boolean;
  testID: string;
}) {
  return (
    <View testID={testID} style={[styles.anchoredRow, elevated ? styles.elevated : null]}>
      {children}
    </View>
  );
}

/** Conteneur du sélecteur superposé lui-même, ancré juste sous la ligne. */
function PopoverAnchor({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.popoverAnchor} testID="composition-popover-anchor">
      {children}
    </View>
  );
}

/**
 * `Boundary Activity` (Compte à rebours initial / Fin de séance) —
 * correction CMP-03/CMP-05 (contre-recette iPhone, correction consolidée,
 * `[ChatGPT] DIAGNOSTIC APPROVED — PHASE02 CONSOLIDATED REWORK02`,
 * 2026-09-03) : nouvel ordre de slots, explicitement demandé par cette
 * revue et qui **remplace** la disposition `LAY-05` précédente (gauche
 * icône / centre libellé / droite valeur+chevron) — pas une ambiguïté
 * résolue localement, une instruction directe et autorisée.
 *
 * Slots : gauche = poignée/structure (`handleSlot`) ; centre = libellé puis,
 * sur une seconde ligne, la valeur de durée déjà formatée
 * (`formatDurationRowValue`, format `MM min SS s` — inchangé, c'est la
 * valeur réellement engagée par la roulette, voir D-06) ; droite = icône de
 * rôle (déplacée depuis le slot gauche).
 *
 * **C-01/C-02** (contre-recette iPhone, `[ChatGPT] DEVICE NO-GO — PHASE02
 * REWORK03 CUMULATIVE CORRECTION`, 2026-09-03) : fond désormais blanc avec
 * un liseré gris visible (`limitCardBase`, partagé avec `TourCard` — voir
 * T-01) — auparavant `colors.surface` (gris), jugé non conforme au rendu
 * réel. Le slot gauche porte désormais un pictogramme
 * (`structureIcon`, prop dédiée, défaut `composition-reorder` — même
 * pictogramme « déplacement/structure » que `Composition / Activity Row`,
 * réutilisation désormais explicitement demandée par cette revue, qui
 * abroge la restriction posée au cycle précédent) ; la prop permet son
 * remplacement ultérieur par un pictogramme « carte fixe/non déplaçable »
 * sans toucher au layout (CMP-03/05 initial, cycle précédent, avait laissé
 * ce slot vide faute d'instruction explicite de réutilisation).
 *
 * **Chevron définitivement retiré** (`[ChatGPT] PLAN_APPROVED — REWORK06 —
 * RESTAURATION CIBLÉE DE LA ROULETTE + VERROU DE CAPITALISATION`,
 * 2026-09-04, addendum « écarts visuels encore ouverts ») : le cycle
 * précédent conservait un chevron (`control-chevron-up`) uniquement à
 * l'état ouvert — cet élément supplémentaire, ajouté à droite de l'icône de
 * rôle, faisait varier le nombre d'enfants de la rangée entre les états
 * fermé/ouvert, donc la position de l'icône de rôle elle-même (« l'icône
 * fonctionnelle de la carte... doit garder exactement la même position
 * ouverte et fermée »). Le chevron est désormais entièrement supprimé, à
 * l'état ouvert comme fermé — `accessibilityState.expanded` porte déjà
 * cette information pour l'accessibilité, sans dépendre d'un indice visuel
 * qui décale la mise en page.
 *
 * **REWORK07-A** (`[ChatGPT] CHANGES_REQUESTED — REWORK07-A — ICON /
 * STRUCTURE / MOVABLE UNIQUEMENT`, 2026-09-04) : le slot gauche
 * (`boundaryRowHandleSlot`) revient de `32×32` (REWORK06) à `28×28`
 * (`dimensions.structureMovableIcon.slot`) — la valeur canonique du
 * composant Figma/DSF `Icon / Structure / Movable` (`3066:4676`), pas un
 * abandon de la correction REWORK06 : l'asset affiché a lui-même été
 * remplacé par son export canonique (voir `KodjoIcon.tsx`), qui occupe
 * réellement son canevas — l'agrandissement précédent du conteneur
 * compensait un glyphe sous-dimensionné, plus nécessaire une fois l'asset
 * corrigé. L'opacité `0.5` du pictogramme n'est plus passée localement
 * (`opacity={0.5}` supprimé) — portée par défaut dans `KodjoIcon.tsx`
 * (`defaultOpacities`), automatiquement appliquée sans paramètre d'écran.
 *
 * **REWORK12 (COMP-01)** (`[ChatGPT] CHANGES_REQUESTED — REWORK12 —
 * Activité + intégration dans Composition`, 2026-09-04) : `icon` devient
 * nullable — vérifié directement sur les nœuds Figma actuels (`2028:11723`
 * pour `Composition / Boundary Activity — Source exact`, `2028:11733` pour
 * `Composition / Activity Row`, `2588:2679`) que ces deux composants
 * partagent EXACTEMENT la même anatomie de carte (fond, liseré, rayon,
 * hauteur, slot structure `28×28` à gauche) à une seule différence près :
 * `Boundary Activity` porte une icône de rôle supplémentaire dans un
 * troisième slot à droite (`icon`), que `Activity Row` n'a jamais —
 * `icon={null}` omet entièrement ce troisième slot plutôt que de le rendre
 * vide, pour rester fidèle à la structure Figma réelle de `Activity Row`
 * (aucun troisième slot du tout, pas un slot présent mais inoccupé).
 * `accessibilityLabel`/`testID` deviennent des props optionnelles
 * (`accessibilityLabel` par défaut = `label`, comportement inchangé pour
 * les deux appelants `Boundary Activity` existants) — nécessaires à la
 * ligne Exercice, dont le nom accessible (`Modifier l'exercice`) diffère du
 * titre affiché (nom réel de l'Activité) et dont les tests doivent pouvoir
 * cibler cette rangée précisément (les trois appels de ce composant
 * partagent sinon les mêmes `testID` internes, jamais uniques par défaut).
 */
function BoundaryActivityRow({
  icon,
  label,
  value,
  isOpen,
  onPress,
  structureIcon = "composition-reorder",
  accessibilityLabel = label,
  testID,
}: {
  /** `null` omet entièrement le troisième slot (droite) — anatomie exacte de `Composition / Activity Row`, qui n'en a jamais. */
  icon: KodjoIconName | null;
  label: string;
  value: string;
  isOpen: boolean;
  onPress: () => void;
  /** C-02 : pictogramme du slot gauche — remplaçable sans changer le layout (ex. futur pictogramme « carte fixe »). */
  structureIcon?: KodjoIconName;
  /** REWORK12 : nom accessible distinct du titre affiché — par défaut `label` (comportement inchangé des deux appelants `Boundary Activity`). */
  accessibilityLabel?: string;
  /** REWORK12 : identifiant de la rangée elle-même, pour un ciblage de test sans ambiguïté entre les appels de ce composant. */
  testID?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ expanded: isOpen }}
      style={[styles.limitCardBase, styles.boundaryRow]}
      testID={testID}
    >
      <View style={styles.boundaryRowHandleSlot} testID="composition-boundary-handle-slot">
        <KodjoIcon name={structureIcon} testID="composition-boundary-handle-icon" />
      </View>
      <View style={styles.boundaryRowTitleSlot}>
        <Text style={styles.rowLabel} numberOfLines={1}>
          {label}
        </Text>
        <Text style={styles.boundaryRowSecondaryLine} numberOfLines={1}>
          {value}
        </Text>
      </View>
      {icon !== null ? (
        <View style={styles.boundaryRowIconSlot}>
          <KodjoIcon name={icon} testID={`composition-row-icon-${icon}`} />
        </View>
      ) : null}
    </Pressable>
  );
}

/**
 * `Composition / Tour Section` — corrections cumulatives :
 *
 * - **CMP-04** (cycle `REWORK02`) : contrôle présenté dans un conteneur
 *   dédié (`tourCardControl`) avec une affordance de disclosure (chevron)
 *   — la carte Tour n'est toujours pas interactive en T01
 *   (`accessibilityState.disabled`), ce chevron reste donc purement visuel.
 * - **T-01** (cycle `REWORK03`) : géométrie de la carte interne
 *   (padding/bordure/rayon) partagée avec `BoundaryActivityRow` via
 *   `limitCardBase` — seul le fond (`colors.selectionSurface`) reste
 *   spécifique.
 * - **T-02/R4-11** (`[ChatGPT] REWORK04 IMPLEMENTATION AUTHORIZED — DESIGN
 *   COMPLEMENTS REVIEWED`, 2026-09-03) : **icône Tour canonique intégrée**
 *   — `icon-tour.svg` (`3066:4685`, `20×20`), octets exacts téléchargés
 *   depuis l'asset MCP fourni par l'autorisation, jamais redessinée ni
 *   substituée. Ferme le blocage reconduit depuis `REWORK02`.
 * - **REWORK12 (COMP-02), première tentative** (`[ChatGPT] CHANGES_REQUESTED
 *   — REWORK12`, 2026-09-04) : `icon-tour.svg` avait été temporairement
 *   remplacé par `composition-main-content` après avoir constaté, sur le
 *   Figma alors en vigueur, que l'icône réellement affichée dans l'en-tête
 *   de la structure Tour (`icon/contenu-principal`) ne correspondait pas à
 *   l'ancien export `icon-tour.svg` — écart disclosé dans le rapport de
 *   mission de ce cycle.
 * - **REWORK12-bis — correction canonique définitive** (`[ChatGPT] Applique
 *   impérativement le protocole KODJO actif...`, 2026-09-04 ; `.github/
 *   orchestration/reports/2026-09-04_icon-tour-canonical-source-alignment
 *   .md`, `DESIGN_ICON_TOUR_CANONICAL_SOURCE_ALIGNED`) : le composant DSF
 *   `Icon / Tour` (`3066:4685`) a depuis été **reconstruit** sur le dessin
 *   validé (celui de `Nouvelle séance — Nom renseigné`, `2028:12003`) et
 *   republié à `18×18` (contre `20×20` auparavant) ; `assets/icons/icon-
 *   tour.svg` a été remplacé par le nouvel export (octets exacts). `icon-
 *   tour` (`KodjoIcon.tsx`) redevient donc la source canonique correcte —
 *   revenue ici depuis `composition-main-content`, désormais retiré du
 *   registre (`KodjoIcon.tsx`) et du manifeste Figma (`assets/icons/
 *   manifest.json` ne porte plus aucune entrée `composition.mainContent`).
 *   Ce n'est pas un aller-retour arbitraire : la première tentative avait
 *   correctement diagnostiqué que l'ancien `icon-tour.svg` (`20×20`) ne
 *   correspondait pas à la source canonique — la correction définitive
 *   porte sur LEQUEL export résout ce défaut (le même composant DSF
 *   reconstruit, pas un composant concurrent).
 * - **T-03/R4-03** : libellé `strings.screens.composition.tour.label` =
 *   `"Nombre de tours"` ; titre en style `KODJO / Card / Title` (voir
 *   `rowLabel`/`tourCardLabel`).
 * - **T-04a/b/c** (audit indépendant REWORK04, 2026-09-03) : anatomie du
 *   contrôle **refaite**, inversant `T-04/R4-10` du cycle précédent —
 *   cadre parent clair (`tourCardControl`, fond `colors.background`)
 *   contenant DEUX éléments distincts côte à côte : la valeur `1` en texte
 *   nu (`tourCardControlValue`, jamais sur fond violet) et un carré violet
 *   `28×28` (`tourCardControlChevronBox`, `colors.selection`) contenant
 *   UNIQUEMENT le chevron blanc — le cycle précédent plaçait `1` et le
 *   chevron ensemble dans le même carré violet, explicitement interdit.
 *   **REWORK06** (`[ChatGPT] PLAN_APPROVED — REWORK06`, 2026-09-04,
 *   addendum) : cadre porté de `66×30` à `78×44` — le `1` est désormais
 *   centré horizontalement ET verticalement (auparavant aligné à gauche),
 *   en `type.cardTitle` (`16/20` Semi Bold, auparavant `type.label` `14/18`
 *   Medium) ; le carré violet dispose de marges visibles identiques en
 *   haut/bas/droite (`8pt` chacune, dérivées par construction — voir
 *   `tourCardControl` ci-dessous).
 * - **T-05** : contenu `1` seul — le signe `×` retiré.
 * - **R4-12** : le conteneur Tour (`tourSectionContainer`, `374`) est
 *   désormais plus large que la carte interne qu'il héberge (`354`,
 *   inset `10`/côté) — INVERSE explicitement `T-01` (qui avait unifié la
 *   largeur de Tour avec celle des cartes limites) : `T-01` unifiait la
 *   GÉOMÉTRIE DE BOÎTE (padding/bordure/rayon, toujours vrai à l'époque) ;
 *   R4-12 distingue la LARGEUR EXTÉRIEURE du conteneur (rôle de conteneur,
 *   pas une carte elle-même) de celle, alors inchangée, de la carte
 *   interne. `marginHorizontal: -inset` fait « déborder » le conteneur de
 *   `10pt` de chaque côté au-delà du padding de `body` (`24`), portant sa
 *   largeur extérieure réelle à `374` sur le canevas de référence
 *   (`402pt`) sans aucune constante de largeur codée en dur — dérivée par
 *   construction, comme pour la marge basse de la navigation (`N-03`).
 *
 * - **REWORK07B — structure extérieure / en-tête transparent** (`[ChatGPT]
 *   PLAN_APPROVED — REWORK07B — contrôles canoniques + structure Tour`,
 *   2026-09-04 ; `12 – Architecture technique.md`, « Anatomie canonique —
 *   Nombre de tours » ; `13 – Contrats d'écran.md`, CE-T01-08/09) : **T-01
 *   est ici explicitement révisé, pas silencieusement contredit** — la
 *   documentation canonique établit que la SEULE surface visuelle du bloc
 *   Tour est la **structure extérieure** (`tourSectionContainer`, `374 pt`,
 *   fond `colors.tourSurface` = `#CDCEFA`, rayon canonique `10`, distinct
 *   du rayon `12` de `limitCardBase`/cartes limites), jamais la carte
 *   interne. L'**en-tête technique intérieur** (`tourHeader`, testID
 *   inchangé `composition-tour-card` — seule sa signification visuelle
 *   change, pas son identifiant) redevient un simple conteneur de mise en
 *   page **transparent** : ni fond, ni bordure, ni rayon, ni apparence de
 *   carte autonome — `limitCardBase` (fond/bordure/padding partagés avec
 *   `BoundaryActivityRow`) ne s'applique donc plus ici. Le `paddingVertical`
 *   et le `minHeight` que portait auparavant la carte interne (via
 *   `limitCardBase`/`tourCard`) sont **relocalisés** sur la structure
 *   extérieure (mêmes valeurs numériques, seul le propriétaire change) :
 *   `tourSectionContainer` disposait déjà, depuis R4-12, exactement de la
 *   géométrie `374 large / inset 10 / contenu 354` requise pour porter
 *   cette surface — aucun nouveau conteneur n'était nécessaire. Absence
 *   d'activité : une seule structure bleue reste visible (aucune carte
 *   intérieure ne dessine plus sa propre surface).
 *
 * - **REWORK08-C — synthèse sous « Nombre de tours »** (`[ChatGPT]
 *   CHANGES_REQUESTED — REWORK08 — roulette native + synthèse Tour`,
 *   2026-09-04) : l'addendum précédemment `QUEUED_FOR_NEXT_COMPOSITION_
 *   REWORK` est désormais implémenté. Titre + synthèse forment un seul
 *   bloc textuel (`tourCardTextBlock`, colonne — même patron que
 *   `boundaryRowTitleSlot`), centré verticalement avec `tourCardControl`
 *   par le `alignItems: "center"` déjà porté par `tourHeader` (hérité,
 *   inchangé). La synthèse (`composition-tour-summary`) réutilise
 *   exactement `formatCompositionSummary` (même contenu canonique que
 *   `bottomAction`, calculé une seule fois dans `CompositionScreen`) et
 *   exactement le style `boundaryRowSecondaryLine` (même typographie que
 *   la ligne secondaire des cartes `Compte à rebours initial`/`Fin de
 *   séance`, réutilisé tel quel, jamais dupliqué). Structure extérieure
 *   bleue et contrôle blanc/violet du nombre de tours : non touchés.
 */
function TourCard({ label, summary }: { label: string; summary: string }) {
  return (
    <View style={styles.tourSectionContainer} testID="composition-tour-section">
      <View
        style={styles.tourHeader}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled: true }}
        testID="composition-tour-card"
      >
        <View style={styles.tourCardIconSlot} testID="composition-tour-icon-slot">
          <KodjoIcon name="icon-tour" testID="composition-tour-icon" />
        </View>
        {/*
         * REWORK08-C : titre + synthèse forment désormais UN SEUL bloc
         * textuel (`tourCardTextBlock`, colonne — même patron que
         * `boundaryRowTitleSlot`), centré verticalement avec le cadre du
         * contrôle grâce à `tourHeader.alignItems: "center"` (hérité,
         * inchangé). La synthèse réutilise exactement le même contenu
         * canonique (`formatCompositionSummary`, calculé une seule fois
         * dans `CompositionScreen`) et exactement le même style
         * typographique que la ligne secondaire des cartes limites —
         * `styles.boundaryRowSecondaryLine` est réutilisé tel quel
         * ci-dessous, jamais dupliqué localement, pour garantir l'identité
         * exacte demandée plutôt qu'une simple ressemblance.
         */}
        <View style={styles.tourCardTextBlock} testID="composition-tour-text-block">
          <Text style={styles.tourCardLabel}>{label}</Text>
          <Text style={styles.boundaryRowSecondaryLine} testID="composition-tour-summary">
            {summary}
          </Text>
        </View>
        <View style={styles.tourCardControl} testID="composition-tour-control">
          <Text style={styles.tourCardControlValue}>{FIXED_TOUR_REPEAT_COUNT}</Text>
          <View style={styles.tourCardControlChevronBox} testID="composition-tour-control-chevron-box">
            <KodjoIcon
              name="control-chevron-down"
              testID="composition-tour-control-chevron"
              tintColor={colors.background}
              size={12}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // A-01 (`[ChatGPT] DEVICE NO-GO — PHASE02 REWORK03 CUMULATIVE
  // CORRECTION`, 2026-09-03) : `flex: 1` — le corps occupe tout l'espace
  // vertical restant entre la bande Context et `bottomAction`, poussant
  // mécaniquement ce dernier au bas de la zone utile.
  //
  // R4-13/S-01…S-09 (`[ChatGPT] REWORK04 ADDENDUM — FIXED SHELL /
  // ACTIVITIES SCROLL CONTRACT`, 2026-09-03) : `body` est désormais le
  // `ScrollView` lui-même (style du conteneur défilant, sans padding
  // propre) — le padding/l'écart entre lignes vivent dans `bodyContent`
  // (`contentContainerStyle`), seul appliqué au CONTENU défilant. Header,
  // séparateur, bande Context et `bottomAction` restent hors de ce
  // `ScrollView`, donc jamais recouverts ni déplacés par le défilement.
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: spacing[24],
    paddingTop: spacing[16],
    paddingBottom: spacing[16],
    gap: spacing[16],
  },
  // CMP-02 : champ unique regroupant Nom et Sélecteur de couleur — acquis
  // préservé (fusion, géométrie, gap, padding, rayon inchangés).
  //
  // REWORK09 (mission directe utilisateur, 2026-09-04, point 1 « Champ Nom
  // de la séance ») : `Session / Name Field — Source exact` (`2537:1480`)
  // documente un fond TRANSPARENT (laissant apparaître la bande Context
  // colorée sous-jacente, jamais un fond blanc opaque) et un liseré blanc
  // intérieur de `1pt` via le token canonique `color.sessionNameBorder`
  // (`#FFFFFF`, variable Figma `color/session-name-border`,
  // `VariableID:3163:4015`) — remplace `colors.background` (fond opaque),
  // seule propriété modifiée par cette correction ; ce champ reste le seul
  // représentant visuel concret du « Nom de la séance » dans cet écran
  // (fusionné avec le sélecteur de couleur depuis CMP-02, acquis
  // explicitement préservé), la transparence s'applique donc à l'ensemble
  // du champ fusionné plutôt qu'à un sous-élément désormais inexistant.
  nameColorField: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[12],
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.sessionNameBorder,
    borderRadius: 12,
    paddingHorizontal: spacing[16],
    paddingVertical: spacing[4],
  },
  nameInput: {
    ...type.screenTitle,
    flex: 1,
    color: colors.textPrimary,
    paddingVertical: spacing[8],
  },
  anchoredRow: {
    // Sert uniquement de contexte de positionnement pour son sélecteur
    // (voir `AnchoredRow` ci-dessus) ; aucune propriété de layout propre.
  },
  // Élève une ligne/bande (et son popover) au-dessus de ses frères tant que
  // son sélecteur est ouvert (correction UI-CTRL-002) et au-dessus du
  // `backdrop` dédié (même mécanisme, voir la note de tête).
  elevated: {
    zIndex: 1,
  },
  popoverAnchor: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    marginTop: spacing[4],
    zIndex: 20,
    elevation: 8,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
  },
  // Backdrop dédié (CMP-01/D-03) : couvre tout l'écran, rendu uniquement
  // pendant qu'un sélecteur est ouvert, sans `zIndex` propre — reste donc
  // peint sous le FRÈRE DIRECT `elevated` (`ContextBand` pour la palette de
  // couleur, `composition-body`/`ScrollView` pour un sélecteur de durée —
  // voir `bodyElevated`, REWORK08-B) par cette seule valeur par défaut (0),
  // tout en restant au-dessus des autres frères directs de `ScreenShell`
  // du seul fait de son ordre de rendu (dernier frère). Un `zIndex` porté
  // par un DESCENDANT de ces frères (ex. `AnchoredRow`, à l'intérieur du
  // `ScrollView`) ne suffit jamais à lui seul — voir la correction
  // REWORK08-B documentée sur `AnchoredRow` et sur le `ScrollView`.
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  // T-01 : géométrie commune aux cartes `Boundary Activity` et `Tour` —
  // seul le fond diverge (voir `boundaryRow`/`tourCard` ci-dessous),
  // garantissant des bords gauche/droit strictement alignés par
  // construction (même padding/bordure/rayon), plutôt que deux définitions
  // séparées pouvant diverger.
  limitCardBase: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing[12],
    paddingHorizontal: spacing[16],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing[8],
  },
  // C-01 — `Boundary Activity` : fond blanc avec liseré gris visible
  // (`limitCardBase.borderColor`), auparavant `colors.surface` (gris).
  boundaryRow: {
    backgroundColor: colors.background,
  },
  // R4-04 (slot `28×28`, icône `20×20`, cycle REWORK04). REWORK06 (addendum
  // « poignées encore trop petites », 2026-09-04) : porté à `32×32` pour
  // compenser un glyphe sous-dimensionné. REWORK07-A (`[ChatGPT]
  // CHANGES_REQUESTED — REWORK07-A — ICON / STRUCTURE / MOVABLE
  // UNIQUEMENT`, 2026-09-04) : diagnostic établi — le glyphe lui-même était
  // en cause, pas le slot ; l'asset canonique remplacé (`KodjoIcon.tsx`),
  // le slot revient à `28×28`
  // (`dimensions.structureMovableIcon.slot`), valeur canonique DSF,
  // partagée avec `KodjoIcon.tsx` (source unique, plus de littéral local
  // dupliqué).
  boundaryRowHandleSlot: {
    width: dimensions.structureMovableIcon.slot,
    height: dimensions.structureMovableIcon.slot,
    alignItems: "center",
    justifyContent: "center",
  },
  boundaryRowTitleSlot: {
    flex: 1,
    gap: spacing[2],
  },
  // R4-03 (`KODJO / Card / Supporting`, `11/14`) : auparavant
  // `type.supporting` (`12/16`), non conforme au style DSF partagé.
  boundaryRowSecondaryLine: {
    ...type.caption,
    color: colors.textSecondary,
  },
  boundaryRowIconSlot: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  // R4-12 : conteneur Tour, plus large que la carte interne qu'il héberge
  // — voir `TourCard` ci-dessus pour la justification complète du calcul.
  // REWORK07B : porte désormais la surface visuelle elle-même (fond,
  // rayon, padding vertical, hauteur minimale) — relocalisés depuis
  // l'ancien style `tourCard` (voir `tourHeader` ci-dessous), qui ne
  // portait pas encore la bonne largeur (`374`) pour cette surface.
  tourSectionContainer: {
    marginHorizontal: -dimensions.compositionTourSection.inset,
    paddingHorizontal: dimensions.compositionTourSection.inset,
    paddingVertical: spacing[12],
    borderRadius: dimensions.compositionTourSection.radius,
    backgroundColor: colors.tourSurface,
    minHeight: dimensions.compositionTourSection.closedHeight,
  },
  // En-tête technique intérieur de `TourCard`, voir la documentation
  // REWORK07B ci-dessus pour la justification complète : simple rangée de
  // mise en page (icône/titre/contrôle), **transparente** — ni fond, ni
  // bordure, ni rayon, ni padding propres (portés par `tourSectionContainer`
  // désormais). N'utilise plus `limitCardBase` (fond/bordure partagés avec
  // `BoundaryActivityRow`, non conformes ici depuis la révision REWORK07B).
  tourHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[8],
  },
  // R4-04 : même slot que `boundaryRowHandleSlot` (`28×28`) — icône Tour
  // désormais réellement affichée dedans (R4-11), plus un espace vide.
  tourCardIconSlot: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  // REWORK08-C : bloc unique titre + synthèse (même patron que
  // `boundaryRowTitleSlot`) — `flex: 1` (auparavant sur `tourCardLabel`
  // directement, quand le titre était seul dans la rangée) porte
  // désormais l'espace disponible du bloc entier, poussant
  // `tourCardControl` à droite ; `gap` identique à `boundaryRowTitleSlot`.
  tourCardTextBlock: {
    flex: 1,
    gap: spacing[2],
  },
  // R4-03/REWORK06 : même style de titre que les cartes limites (voir `rowLabel`).
  tourCardLabel: {
    ...type.cardTitle,
    color: colors.textPrimary,
  },
  // T-04a/b/c (cycle REWORK04) : cadre parent clair contenant la valeur `1`
  // (texte nu, jamais sur fond violet) et le carré violet dédié au chevron
  // (`tourCardControlChevronBox`) comme deux éléments frères distincts.
  //
  // REWORK06 (addendum « écarts visuels encore ouverts », 2026-09-04) :
  // hauteur portée de `30` à `44` — `alignItems: "center"` centre
  // mécaniquement le carré violet (`28`) dans cette hauteur, dégageant une
  // marge haut/bas de `(44-28)/2 = 8` ; `paddingRight: spacing[8]` (`8`)
  // égale cette même marge à droite du carré, comme demandé (« marges
  // visibles identiques en haut, en bas et à droite »). Largeur portée de
  // `66` à `78` pour dégager l'espace nécessaire au centrage du chiffre.
  tourCardControl: {
    flexDirection: "row",
    alignItems: "center",
    width: 78,
    height: 44,
    paddingLeft: spacing[8],
    paddingRight: spacing[8],
    backgroundColor: colors.background,
    borderRadius: 10,
  },
  // REWORK06 : `1` centré horizontalement (`flex: 1` + `textAlign:
  // "center"`, occupe tout l'espace entre le padding gauche et le carré
  // violet — auparavant hors flex, aligné au bord gauche du cadre par
  // `justifyContent: "space-between"`) et verticalement (centrage flex par
  // `tourCardControl.alignItems: "center"`, hérité). Style porté de
  // `type.label` (`14/18` Medium) à `type.cardTitle` (`16/20` Semi Bold) —
  // « en gras et plus grand ».
  tourCardControlValue: {
    ...type.cardTitle,
    color: colors.textPrimary,
    flex: 1,
    textAlign: "center",
  },
  // Carré violet dédié, ne contenant QUE le chevron blanc (T-04c).
  tourCardControlChevronBox: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.selection,
    borderRadius: 8,
  },
  // R4-03 (cycle REWORK04) : `type.compactCardTitle` (`14/18` Semi Bold),
  // auparavant `type.body` (`14/20` Regular). REWORK06 (addendum « titres
  // des cartes... encore trop petits », 2026-09-04) : porté à
  // `type.cardTitle` (`16/20` Semi Bold) — token DSF déjà canonique,
  // partagé avec `SessionCard.tsx` (Catalogue), plutôt qu'une nouvelle
  // taille locale inventée. Effet de bord accepté : la ligne Exercice de
  // cet écran (non explicitement citée par l'addendum) partage `rowLabel`
  // et grandit donc identiquement.
  rowLabel: {
    ...type.cardTitle,
    color: colors.textPrimary,
  },
  // LAY-03 : hauteur/rayon issus du composant DS
  // (`dimensions.compactSecondaryButton`, même token que le bouton Créer
  // du Catalogue) ; fond blanc explicite (la bande Context est teintée) ;
  // bordure/icône/texte primaires ; largeur libre. CMP-02 : centré
  // (`alignSelf: "center"`, auparavant `flex-start`).
  addActivityAction: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[6],
    height: dimensions.compactSecondaryButton.visualHeight,
    paddingHorizontal: spacing[16],
    borderRadius: dimensions.compactSecondaryButton.radius,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.background,
  },
  addActivityLabel: {
    ...type.button,
    color: colors.primary,
  },
  // CMP-06 : zone d'action basse regroupant la synthèse et `Continuer`.
  // A-01 : plus de `marginTop: "auto"` ici — `body` (`flex: 1`, ci-dessus)
  // absorbe désormais tout l'espace disponible, `bottomAction` suit
  // naturellement juste après. `Continuer` reste centré sur l'axe
  // horizontal de l'écran (`marginHorizontal` symétrique) ; Composition
  // n'affiche aucun cadre de navigation principal (écran de création hors
  // `(tabs)`), le critère « centré sur l'axe du cadre de navigation » de
  // cette revue ne s'applique donc pas ici (condition explicitement posée
  // par la revue elle-même, « lorsqu'il est présent »).
  bottomAction: {
    marginHorizontal: spacing[24],
    gap: spacing[12],
  },
  continueAction: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing[12],
    borderRadius: 24,
    backgroundColor: colors.disabled,
  },
  continueLabel: {
    ...type.button,
    color: colors.background,
  },
});
