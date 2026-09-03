import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { Keyboard, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
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
 * 2026-09-03, identifiants `C-01/C-02/T-01…T-05/A-01`).
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

  const toggleOverlay = useCallback((kind: OverlayKind) => {
    Keyboard.dismiss();
    setOpenOverlay((current) => (current === kind ? null : kind));
  }, []);

  const composition = strings.screens.composition;

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
            placeholderTextColor={colors.textSecondary}
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
         * boîte visuelle. Masqué dès qu'un Exercice existe (modèle T01,
         * `draft.exercise` unique, jamais un tableau) : la ligne de résumé
         * de l'Exercice le remplace alors ailleurs dans la structure (voir
         * plus bas, UI-COMP-003), jamais à cette position.
         */}
        {draft.exercise === null ? (
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
        ) : null}
      </ContextBand>

      <View style={styles.body} testID="composition-body">
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
                onChange={(totalSeconds) => updateDraft({ initialCountdownSeconds: totalSeconds })}
                onRequestClose={() => toggleOverlay("countdown")}
                minutesAccessibilityLabel={composition.wheelPicker.minutesAccessibilityLabel}
                secondsAccessibilityLabel={composition.wheelPicker.secondsAccessibilityLabel}
              />
            </PopoverAnchor>
          ) : null}
        </AnchoredRow>

        {/*
         * UI-COMP-003 : une fois créée, l'Activité s'insère ICI — entre Compte
         * à rebours initial et Tour, jamais après Tour par défaut.
         */}
        {draft.exercise !== null ? (
          <Pressable
            onPress={() => router.push("/exercise")}
            accessibilityRole="button"
            accessibilityLabel={composition.exerciseRow.editAccessibilityLabel}
            style={styles.exerciseRow}
          >
            <View style={styles.exerciseRowHeader}>
              <KodjoIcon name="composition-main-content" testID="composition-exercise-icon" />
              <Text style={styles.rowLabel}>{draft.exercise.name}</Text>
              <View style={styles.exerciseRowSpacer} />
              {/* Poignée de réorganisation (CE-T01-09) : présente conformément au
                  composant `Composition / Activity Row`, mais non interactive —
                  un seul Exercice existe dans le modèle T01, rien à réordonner
                  avant qu'une Composition à plusieurs Activités n'existe. */}
              <KodjoIcon name="composition-reorder" testID="composition-reorder-icon" opacity={0.5} />
            </View>
            <Text style={styles.exerciseRowSummary}>{formatExerciseRowSummary(draft.exercise)}</Text>
          </Pressable>
        ) : null}

        <TourCard label={composition.tour.label} />

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
                onChange={(totalSeconds) => updateDraft({ finalPhaseSeconds: totalSeconds })}
                onRequestClose={() => toggleOverlay("finalPhase")}
                minutesAccessibilityLabel={composition.wheelPicker.minutesAccessibilityLabel}
                secondsAccessibilityLabel={composition.wheelPicker.secondsAccessibilityLabel}
              />
            </PopoverAnchor>
          ) : null}
        </AnchoredRow>
      </View>

      {/*
       * CMP-06 (contre-recette iPhone, correction consolidée, 2026-09-03) :
       * synthèse et `Continuer` regroupés dans UNE seule zone d'action basse
       * (`bottomAction`) — auparavant `summary` était un `Text` isolé entre
       * le corps et le bouton, avec `marginTop: "auto"` posé sur le bouton
       * seul (le texte pouvait donc se retrouver loin de l'action qu'il
       * qualifie selon le contenu au-dessus). C'est désormais le groupe
       * entier qui est poussé en bas (`marginTop: "auto"` sur
       * `bottomAction`), la synthèse restant immédiatement au-dessus de
       * `Continuer`.
       */}
      <View
        testID="composition-bottom-action"
        style={[styles.bottomAction, { marginBottom: insets.bottom + spacing[16] }]}
      >
        <Text style={styles.summary}>
          {formatCompositionSummary({
            exercise: draft.exercise,
            initialCountdownSeconds: draft.initialCountdownSeconds,
            finalPhaseSeconds: draft.finalPhaseSeconds,
          })}
        </Text>

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
 * interne) au-dessus de ses frères tant que son sélecteur est ouvert — même
 * mécanisme que le `backdrop` dédié (voir `CompositionScreen` ci-dessus) :
 * un `zIndex` supérieur à celui des frères par défaut (0) suffit à rester
 * peint au-dessus du `backdrop`.
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
 * Chevron : supprimé à l'état fermé (absent de la référence signalée par
 * le cycle précédent). Conservé uniquement à l'état ouvert, comme seul
 * indice visuel restant de l'état « développé » (`accessibilityState.
 * expanded` porte déjà cette information pour l'accessibilité).
 */
function BoundaryActivityRow({
  icon,
  label,
  value,
  isOpen,
  onPress,
  structureIcon = "composition-reorder",
}: {
  icon: KodjoIconName;
  label: string;
  value: string;
  isOpen: boolean;
  onPress: () => void;
  /** C-02 : pictogramme du slot gauche — remplaçable sans changer le layout (ex. futur pictogramme « carte fixe »). */
  structureIcon?: KodjoIconName;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ expanded: isOpen }}
      style={[styles.limitCardBase, styles.boundaryRow]}
    >
      <View style={styles.boundaryRowHandleSlot} testID="composition-boundary-handle-slot">
        <KodjoIcon name={structureIcon} testID="composition-boundary-handle-icon" opacity={0.5} />
      </View>
      <View style={styles.boundaryRowTitleSlot}>
        <Text style={styles.rowLabel} numberOfLines={1}>
          {label}
        </Text>
        <Text style={styles.boundaryRowSecondaryLine} numberOfLines={1}>
          {value}
        </Text>
      </View>
      <View style={styles.boundaryRowIconSlot}>
        <KodjoIcon name={icon} testID={`composition-row-icon-${icon}`} />
      </View>
      {isOpen ? (
        <KodjoIcon name="control-chevron-up" testID="composition-row-chevron-up" />
      ) : null}
    </Pressable>
  );
}

/**
 * Carte `Tour` — corrections cumulatives :
 *
 * - **CMP-04** (cycle précédent) : contrôle désormais présenté dans un
 *   conteneur dédié (`tourCardControl`) avec une affordance de disclosure
 *   (chevron), au lieu d'un simple `Text` nu — la carte Tour n'est toujours
 *   pas interactive en T01 (`accessibilityState.disabled`), ce chevron est
 *   donc une affordance purement visuelle, jamais fonctionnelle avant
 *   qu'un état d'ouverture réel n'existe.
 * - **T-01** (`[ChatGPT] DEVICE NO-GO — PHASE02 REWORK03 CUMULATIVE
 *   CORRECTION`, 2026-09-03) : géométrie (padding/bordure/rayon) désormais
 *   partagée avec `BoundaryActivityRow` via `limitCardBase` — auparavant
 *   une largeur divergente était possible faute de règle de boîte commune
 *   explicite ; seul le fond (`colors.selectionSurface`, teinte propre à
 *   Tour) reste spécifique.
 * - **T-02** : slot gauche toujours vide — **icône Tour canonique toujours
 *   absente**. Recherche exhaustive reconduite ce cycle
 *   (`assets/icons/manifest.json`, 19 entrées) : aucune entrée `tour.*` ni
 *   glyphe sémantiquement proche. Le MCP `figma` de cet environnement est
 *   non authentifié — impossible d'obtenir/vérifier un asset réel depuis ce
 *   run. Réutiliser `composition-reorder` ici (comme desormais fait pour le
 *   slot gauche de `BoundaryActivityRow`, C-02) représenterait faussement
 *   « Tour » avec un pictogramme de déplacement — DÉLIBÉRÉMENT non fait,
 *   ce serait une correction pire que le blocage documenté. Escaladé de
 *   nouveau, explicitement, pas reconduit silencieusement.
 * - **T-03** : libellé désormais `strings.screens.composition.tour.label`
 *   = `"Nombre de tours"` (auparavant `"Tour"` seul, changé à la source).
 * - **T-04** : contrôle carré violet (`colors.selection`) avec chevron
 *   blanc (`KodjoIcon`'s nouveau prop `tintColor`, voir `KodjoIcon.tsx`) —
 *   auparavant un contrôle blanc arrondi avec un chevron par défaut.
 * - **T-05** : contenu `1` seul — le signe `×` retiré (`FIXED_TOUR_REPEAT_
 *   COUNT` affiché nu, plus de préfixe).
 */
function TourCard({ label }: { label: string }) {
  return (
    <View
      style={[styles.limitCardBase, styles.tourCard]}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: true }}
      testID="composition-tour-card"
    >
      <View style={styles.tourCardIconSlot} testID="composition-tour-icon-slot" />
      <Text style={styles.tourCardLabel}>{label}</Text>
      <View style={styles.tourCardControl} testID="composition-tour-control">
        <Text style={styles.tourCardControlValue}>{FIXED_TOUR_REPEAT_COUNT}</Text>
        <KodjoIcon
          name="control-chevron-down"
          testID="composition-tour-control-chevron"
          tintColor={colors.background}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // A-01 (contre-recette iPhone, `[ChatGPT] DEVICE NO-GO — PHASE02 REWORK03
  // CUMULATIVE CORRECTION`, 2026-09-03) : `flex: 1` — le corps occupe
  // désormais tout l'espace vertical restant entre la bande Context et
  // `bottomAction` (ses lignes restent alignées en haut, comportement par
  // défaut d'un conteneur flex sans `justifyContent`), poussant
  // mécaniquement `bottomAction` au bas de la zone utile. Remplace la
  // dépendance précédente au seul `marginTop: "auto"` de `bottomAction`
  // (jugée insuffisante au rendu réel — bloc « trop haut »).
  body: {
    flex: 1,
    paddingHorizontal: spacing[24],
    paddingTop: spacing[16],
    gap: spacing[16],
  },
  // CMP-02 : champ blanc unique regroupant Nom et Sélecteur de couleur.
  nameColorField: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[12],
    backgroundColor: colors.background,
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
  // peint sous la ligne/bande `elevated` (`zIndex: 1`) par cette seule
  // valeur par défaut (0), tout en restant au-dessus des autres frères de
  // premier niveau du seul fait de son ordre de rendu (dernier frère).
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
  // C-02 : centré, afin que le pictogramme (`composition-reorder`, 16×16)
  // soit visuellement centré dans le même espace que les autres slots.
  boundaryRowHandleSlot: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  boundaryRowTitleSlot: {
    flex: 1,
    gap: spacing[2],
  },
  boundaryRowSecondaryLine: {
    ...type.supporting,
    color: colors.textSecondary,
  },
  boundaryRowIconSlot: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  // Carte `Tour`, voir `TourCard` ci-dessus pour la justification complète
  // (géométrie partagée `limitCardBase`/T-01, slot d'icône vide — asset
  // canonique absent/T-02, contrôle carré violet/T-04, contenu `1` seul/T-05).
  tourCard: {
    backgroundColor: colors.selectionSurface,
  },
  tourCardIconSlot: {
    width: 24,
    height: 24,
  },
  tourCardLabel: {
    ...type.body,
    flex: 1,
    color: colors.textPrimary,
  },
  // T-04 : contrôle carré violet avec chevron blanc — auparavant un
  // contrôle blanc arrondi. Dimension fixe (`36`) choisie pour contenir
  // confortablement le chevron (`24×24`, taille DS exacte, non redimensionné)
  // et le chiffre `1` côte à côte ; non confirmée contre un rendu réel
  // (`NON_VERIFIABLE_DEVICE`, voir le rapport de mission).
  tourCardControl: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[2],
    width: 36,
    height: 36,
    backgroundColor: colors.selection,
    borderRadius: 8,
  },
  tourCardControlValue: {
    ...type.body,
    color: colors.background,
  },
  rowLabel: {
    ...type.body,
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
  exerciseRow: {
    paddingVertical: spacing[12],
    paddingHorizontal: spacing[16],
    backgroundColor: colors.surface,
    borderRadius: 12,
    gap: spacing[4],
  },
  exerciseRowHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[8],
  },
  exerciseRowSpacer: {
    flex: 1,
  },
  exerciseRowSummary: {
    ...type.supporting,
    color: colors.textSecondary,
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
  summary: {
    ...type.body,
    color: colors.textSecondary,
    textAlign: "center",
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
