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
import { colors, dimensions, minTouchTarget, spacing, type } from "@/shared/ui/tokens";

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

  // LAY-03 : seule la hauteur visuelle est contrainte par le composant DS
  // (`dimensions.compactSecondaryButton.visualHeight`, pas une largeur
  // fixe — ce bouton porte un libellé plus long que celui du Catalogue).
  // La cible tactile verticale est donc calculée depuis cette hauteur ;
  // horizontalement, la largeur réelle (icône + libellé) dépasse déjà
  // largement `minTouchTarget`, un `hitSlop` fixe modeste suffit comme
  // marge de confort sans dépendre d'une largeur non mesurable à l'avance.
  const addActivityVerticalHitSlop =
    (minTouchTarget - dimensions.compactSecondaryButton.visualHeight) / 2;

  return (
    <Pressable
      style={styles.container}
      onPress={closeOverlay}
      accessible={false}
    >
      {/*
       * LAY-02 (contre-recette iPhone, Phase 2 Composition, 2026-09-03) :
       * Header fixe avec Retour ET le titre statique exact — jamais
       * remplacé par le nom saisi (`composition.title`, déjà présent dans
       * `fr.ts` mais jamais rendu avant cette correction). Séparateur
       * horizontal immédiatement sous le Header. Nom/couleur/Ajouter sont
       * désormais regroupés dans la bande Context ci-dessous, plus dans le
       * Header lui-même (défaut précédent : aucun titre d'écran distinct
       * du champ Nom n'existait).
       */}
      <View
        testID="composition-header"
        style={[styles.header, { paddingTop: insets.top }]}
      >
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel={composition.backAccessibilityLabel}
          hitSlop={spacing[8]}
          style={styles.backButton}
        >
          <KodjoIcon name="control-back" testID="composition-back-icon" />
        </Pressable>
        <Text style={styles.title}>{composition.title}</Text>
      </View>

      <View testID="composition-header-separator" style={styles.headerSeparator} />

      <View
        testID="composition-context-band"
        style={[styles.contextBand, openOverlay === "color" ? styles.elevated : null]}
      >
        <View style={styles.nameRow}>
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
         * LAY-03 : boîte visuelle compacte issue du composant DS
         * (`dimensions.compactSecondaryButton`, même token que le bouton
         * Créer du Catalogue, `UI-CAT-001`/`CAT-R02`) — fond blanc,
         * bordure/icône/texte primaires, cible tactile `≥48` via `hitSlop`
         * indépendante de la boîte visuelle, jamais un agrandissement du
         * cadre lui-même. Masqué dès qu'un Exercice existe (modèle T01,
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
              top: addActivityVerticalHitSlop,
              bottom: addActivityVerticalHitSlop,
              left: spacing[8],
              right: spacing[8],
            }}
            style={styles.addActivityAction}
          >
            <KodjoIcon name="action-add" testID="composition-add-activity-icon" />
            <Text style={styles.addActivityLabel}>{composition.addActivity}</Text>
          </Pressable>
        ) : null}
      </View>

      <View style={styles.body}>
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
                minutesAccessibilityLabel={composition.wheelPicker.minutesAccessibilityLabel}
                secondsAccessibilityLabel={composition.wheelPicker.secondsAccessibilityLabel}
              />
            </PopoverAnchor>
          ) : null}
        </AnchoredRow>
      </View>

      {/*
       * LAY-04 (9) : synthèse indépendante de la carte Tour, placée dans la
       * zone basse près de l'action finale — jamais à l'intérieur de la
       * carte Tour elle-même (déjà le cas structurellement : `TourCard`
       * ci-dessus ne contient jamais ce texte).
       */}
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

/**
 * `Boundary Activity` (Compte à rebours initial / Fin de séance) —
 * correction LAY-05 (contre-recette iPhone, Phase 2 Composition,
 * 2026-09-03) : trois slots indépendants (gauche icône de rôle / centre
 * libellé / droite valeur + chevron), au lieu des deux groupes précédents
 * (icône+libellé regroupés à gauche). Aucune poignée de structure dans le
 * slot gauche : le catalogue de composants (doc12 §12.26,
 * `Composition / Boundary Activity — Source exact`, seule variante
 * documentée `Type=Initial countdown/End session`) ne mentionne aucune
 * capacité de réorganisation pour ce composant — à la différence de
 * `Composition / Activity Row`, dont doc12 note explicitement la position
 * « avant/dans/après Tour » comme hors état du composant. Le slot gauche
 * porte donc l'icône de rôle elle-même, jamais une poignée inventée sans
 * évidence documentaire. Le chevron ne partage plus son slot avec l'icône
 * de rôle : les deux ne peuvent plus se déplacer mutuellement.
 */
function BoundaryActivityRow({
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
      style={styles.boundaryRow}
    >
      <View style={styles.boundaryRowIconSlot}>
        <KodjoIcon name={icon} testID={`composition-row-icon-${icon}`} />
      </View>
      <Text style={styles.boundaryRowTitleSlot} numberOfLines={1}>
        {label}
      </Text>
      <View style={styles.boundaryRowValueSlot}>
        <Text style={styles.rowValue}>{value}</Text>
        <KodjoIcon
          name={isOpen ? "control-chevron-up" : "control-chevron-down"}
          testID={`composition-row-chevron-${isOpen ? "up" : "down"}`}
        />
      </View>
    </Pressable>
  );
}

/**
 * Carte `Tour` — correction LAY-04 (contre-recette iPhone, Phase 2
 * Composition, 2026-09-03) : composant DS dédié, fond distinct
 * (`colors.selectionSurface`, seul token « bleu/lavande très pâle » déjà
 * présent dans ce code — valeur par défaut non confirmée contre la frame
 * Figma exacte, voir le rapport de mission), libellé `Tour` et contrôle
 * `×1` placés dans des slots distincts, jamais partagés avec une icône
 * d'Activité (`composition-main-content`, réservée à la ligne Exercice).
 *
 * **Icône Tour canonique absente** : aucun asset `tour.*` n'existe dans
 * `assets/icons/manifest.json` ni dans `assets/icons/` (vérifié par
 * recherche exhaustive) — le slot gauche reste donc vide plutôt que de
 * réutiliser l'icône d'une Activité ou d'inventer un glyphe de
 * substitution, interdit par les règles du manifeste. Point bloqué,
 * documenté dans le rapport de mission — pas un défaut silencieux.
 */
function TourCard({ label }: { label: string }) {
  return (
    <View
      style={styles.tourCard}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: true }}
      testID="composition-tour-card"
    >
      <View style={styles.tourCardIconSlot} testID="composition-tour-icon-slot" />
      <Text style={styles.tourCardLabel}>{label}</Text>
      <Text style={styles.tourCardValue}>×{FIXED_TOUR_REPEAT_COUNT}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  // LAY-02 : Header fixe — Retour + titre statique, safe area appliquée une
  // seule fois ici (`paddingTop: insets.top`, inline).
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[12],
    paddingHorizontal: spacing[24],
    paddingBottom: spacing[16],
  },
  backButton: {
    minWidth: minTouchTarget,
    minHeight: minTouchTarget,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -spacing[12],
  },
  title: {
    ...type.screenTitle,
    flex: 1,
    color: colors.textPrimary,
  },
  headerSeparator: {
    height: 1,
    backgroundColor: colors.divider,
  },
  // LAY-02 : bande Context bleu très pâle (`colors.selectionSurface`) —
  // nom, couleur et Ajouter une activité.
  contextBand: {
    backgroundColor: colors.selectionSurface,
    paddingHorizontal: spacing[24],
    paddingVertical: spacing[16],
    gap: spacing[16],
  },
  nameRow: {
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
  body: {
    paddingHorizontal: spacing[24],
    paddingTop: spacing[16],
    gap: spacing[16],
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
  // LAY-05 — `Boundary Activity` : trois slots indépendants, voir
  // `BoundaryActivityRow` ci-dessus pour la justification complète.
  boundaryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing[12],
    paddingHorizontal: spacing[16],
    backgroundColor: colors.surface,
    borderRadius: 12,
    gap: spacing[8],
  },
  boundaryRowIconSlot: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  boundaryRowTitleSlot: {
    ...type.body,
    flex: 1,
    color: colors.textPrimary,
  },
  boundaryRowValueSlot: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[4],
  },
  // LAY-04 — carte `Tour`, voir `TourCard` ci-dessus pour la justification
  // complète (fond, slot d'icône vide — asset canonique absent).
  tourCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing[12],
    paddingHorizontal: spacing[16],
    backgroundColor: colors.selectionSurface,
    borderRadius: 12,
    gap: spacing[8],
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
  tourCardValue: {
    ...type.body,
    color: colors.textSecondary,
  },
  rowLabel: {
    ...type.body,
    color: colors.textPrimary,
  },
  rowValue: {
    ...type.body,
    color: colors.textSecondary,
  },
  // LAY-03 : hauteur/rayon issus du composant DS
  // (`dimensions.compactSecondaryButton`, même token que le bouton Créer
  // du Catalogue) ; fond blanc explicite (la bande Context est teintée) ;
  // bordure/icône/texte primaires ; largeur libre (libellé plus long que
  // celui du Catalogue, aucune largeur fixe imposée par le contrat de
  // cette phase).
  addActivityAction: {
    alignSelf: "flex-start",
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
  summary: {
    ...type.body,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing[16],
    paddingHorizontal: spacing[24],
  },
  continueAction: {
    marginTop: "auto",
    marginHorizontal: spacing[24],
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
