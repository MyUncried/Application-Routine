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
import { KodjoIcon, type KodjoIconName } from "@/shared/ui/KodjoIcon";
import { colors, minTouchTarget, spacing, type } from "@/shared/ui/tokens";

type OverlayKind = "color" | "countdown" | "finalPhase";

/**
 * Écran `Composition d'une séance` (T01-S07, docs §06 Écran 3 ; corrections
 * de conformité — audit `T01_S01_S08_CONFORMITY_AUDIT_20260902.md`,
 * instruction Codex de correction autonome).
 *
 * Le brouillon vient de `SessionDraftProvider` (monté par
 * `app/(creation)/_layout.tsx`, au-dessus de cet écran) — cette route ne
 * connaît ni SQLite ni `SessionService` : aucun enregistrement n'a lieu
 * avant T01-S09.
 *
 * Un seul sélecteur intégré ouvert à la fois (couleur, Compte à rebours,
 * Fin de séance) — état `openOverlay` unique (plan §5). Toucher en dehors
 * d'un contrôle interactif ferme le sélecteur ouvert : l'écran entier est
 * enveloppé dans un `Pressable` qui ne reçoit le toucher que si aucun
 * contrôle imbriqué (ligne, roulette, palette) ne l'a déjà capté.
 *
 * `+ Ajouter une activité` (T01-S08) navigue vers l'écran Exercice
 * (`/exercise`) ; celui-ci lit lui-même `draft.exercise` pour déterminer
 * s'il s'agit d'un ajout ou d'une modification — aucun paramètre de route
 * n'est nécessaire. Le modèle `SessionDraft.exercise` restant un unique
 * champ nullable (pas un tableau, hors périmètre T01), le bouton d'ajout
 * est masqué dès qu'un Exercice existe : une ligne récapitulative le
 * remplace, pressable pour rouvrir l'écran en modification.
 *
 * Chaque roulette intégrée (Compte à rebours, Fin de séance) est désormais
 * ancrée en superposition (`position: "absolute"`, correction CE-T01-06/07)
 * plutôt que rendue en flux : elle ne repousse plus les éléments suivants.
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
    <Pressable
      style={[styles.container, { paddingTop: insets.top + spacing[16] }]}
      onPress={closeOverlay}
      accessible={false}
    >
      <View style={styles.topBar}>
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={composition.backAccessibilityLabel}
          hitSlop={spacing[8]}
          style={styles.backButton}
        >
          <KodjoIcon name="control-back" testID="composition-back-icon" />
        </Pressable>
      </View>

      <View
        testID="composition-header"
        style={[styles.header, openOverlay === "color" ? styles.elevated : null]}
      >
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
       * UI-COMP-001/002 (cycle de correction après contre-recette iPhone,
       * 2026-09-03) : `+ Ajouter une activité` est un élément fixe du Shell,
       * positionné AU-DESSUS de la structure Compte à rebours / Tour / Fin
       * de séance — jamais après elle (défaut précédent : ce bouton était
       * rendu en dernier, après Tour). Masqué dès qu'un Exercice existe
       * (modèle T01, `draft.exercise` unique, jamais un tableau) : la ligne
       * de résumé de l'Exercice le remplace alors ailleurs dans la
       * structure (voir plus bas, UI-COMP-003), jamais à cette position.
       */}
      {draft.exercise === null ? (
        <Pressable
          onPress={() => router.push("/exercise")}
          accessibilityRole="button"
          accessibilityState={{ disabled: false }}
          accessibilityLabel={composition.addActivity}
          style={styles.addActivityAction}
        >
          <KodjoIcon name="action-add" testID="composition-add-activity-icon" />
          <Text style={styles.addActivityLabel}>{composition.addActivity}</Text>
        </Pressable>
      ) : null}

      <AnchoredRow testID="composition-anchored-row-countdown" elevated={openOverlay === "countdown"}>
        <DurationRow
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
              minutesAccessibilityLabel={composition.wheelPicker.minutesAccessibilityLabel}
              secondsAccessibilityLabel={composition.wheelPicker.secondsAccessibilityLabel}
            />
          </PopoverAnchor>
        ) : null}
      </AnchoredRow>

      {/*
       * UI-COMP-003 : une fois créée, l'Activité s'insère ICI — entre Compte
       * à rebours initial et Tour, jamais après Tour par défaut (défaut
       * précédent : cette ligne remplaçait le bouton d'ajout, donc après
       * Tour et Fin de séance).
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

      <View
        style={styles.tourRow}
        accessibilityRole="button"
        accessibilityLabel={composition.tour.label}
        accessibilityState={{ disabled: true }}
      >
        <Text style={styles.rowLabel}>{composition.tour.label}</Text>
        <Text style={styles.rowValue}>×{FIXED_TOUR_REPEAT_COUNT}</Text>
      </View>

      <AnchoredRow testID="composition-anchored-row-finalPhase" elevated={openOverlay === "finalPhase"}>
        <DurationRow
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
              minutesAccessibilityLabel={composition.wheelPicker.minutesAccessibilityLabel}
              secondsAccessibilityLabel={composition.wheelPicker.secondsAccessibilityLabel}
            />
          </PopoverAnchor>
        ) : null}
      </AnchoredRow>

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
       * pas avant T01-S09. Activer ce bouton sans action réelle
       * contredirait doc13 §3.3 (« aucun contrôle actif sans action
       * réelle »). Comportement conservé tel quel dans l'attente d'un
       * arbitrage explicite — non tranché silencieusement.
       */}
      <Pressable
        disabled
        accessibilityRole="button"
        accessibilityState={{ disabled: true }}
        accessibilityLabel={composition.continueAction}
        style={[styles.continueAction, { marginBottom: insets.bottom + spacing[16] }]}
      >
        <Text style={styles.continueLabel}>{composition.continueAction}</Text>
      </Pressable>

      {isPendingExit ? <AbandonCreationModal onCancel={cancelExit} onConfirm={confirmExit} /> : null}
    </Pressable>
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
 * 2026-09-03) : cette superposition seule ne suffisait pas. Le popover
 * ouvert (≈136px) déborde largement de l'écart réel jusqu'à la ligne
 * suivante (`gap: spacing[16]` + hauteur de ligne, ≈20px) ; sans
 * différenciation de `zIndex` entre `AnchoredRow` frères, React Native peint
 * la ligne suivante (montée après, donc au-dessus par défaut) par-dessus le
 * popover ouvert — un `zIndex` posé uniquement sur le popover ne fait pas
 * remonter tout le sous-arbre `AnchoredRow` au-dessus d'un frère de même
 * niveau. `elevated` élève désormais l'`AnchoredRow` elle-même (et non plus
 * seulement son popover interne) au-dessus de ses frères tant que son
 * sélecteur est ouvert — cause racine démontrée du défaut tactile réel
 * (UI-CTRL-001).
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

function DurationRow({
  icon,
  label,
  value,
  isOpen,
  onPress,
}: {
  icon: KodjoIconName;
  label: string;
  value: string;
  isOpen: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ expanded: isOpen }}
      style={styles.durationRow}
    >
      <View style={styles.durationRowLeading}>
        <KodjoIcon name={icon} testID={`composition-row-icon-${icon}`} />
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <View style={styles.durationRowTrailing}>
        <Text style={styles.rowValue}>{value}</Text>
        <KodjoIcon
          name={isOpen ? "control-chevron-up" : "control-chevron-down"}
          testID={`composition-row-chevron-${isOpen ? "up" : "down"}`}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing[24],
    gap: spacing[16],
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    minWidth: minTouchTarget,
    minHeight: minTouchTarget,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -spacing[12],
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[12],
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
  // Élève une ligne (et son popover) au-dessus de ses frères tant que son
  // sélecteur est ouvert (correction UI-CTRL-002, cause racine UI-CTRL-001) —
  // `zIndex` seul suffit : React Native réordonne le tracé des frères d'un
  // même parent d'après cette valeur, aucune `elevation` supplémentaire
  // n'est nécessaire sur un `View` sans fond propre.
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
  durationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing[12],
    paddingHorizontal: spacing[16],
    backgroundColor: colors.surface,
    borderRadius: 12,
  },
  durationRowLeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[8],
  },
  durationRowTrailing: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[4],
  },
  tourRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing[12],
    paddingHorizontal: spacing[16],
    backgroundColor: colors.surfaceSubtle,
    borderRadius: 12,
    opacity: 0.6,
  },
  rowLabel: {
    ...type.body,
    color: colors.textPrimary,
  },
  rowValue: {
    ...type.body,
    color: colors.textSecondary,
  },
  addActivityAction: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[6],
    paddingHorizontal: spacing[16],
    paddingVertical: spacing[8],
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.primary,
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
  summary: {
    ...type.body,
    color: colors.textSecondary,
    textAlign: "center",
  },
  continueAction: {
    marginTop: "auto",
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
