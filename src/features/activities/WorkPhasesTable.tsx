import { Fragment, useState, type ReactNode } from "react";
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";

import { WORK_PHASE_LIMITS } from "@/domain/activities/ExecutionParameters";
import type { DraftWorkPhase } from "@/domain/activities/ExecutionParametersDraft";
import { SheetMotionGroupMount, SheetMotionView } from "@/features/activities/SheetMotion";
import {
  DraggableRow,
  InsertionGuide,
  RemoveRowButton,
  TABLE_CELL_HEIGHT,
  TABLE_ROW_HEIGHT,
  TABLE_ROW_INSET,
  tableStyles,
  type DraggableRowLabels,
} from "@/features/activities/sheetTable";
import { strings } from "@/shared/i18n";
import { colors } from "@/shared/ui/tokens";

/**
 * PRE-5 story 2.8 (FR-4, FR-8, FR-29, AD-27, UX-DR3, UX-DR4 ; D-432, D-434) — tableau des
 * phases de l'exercice, composant DISTINCT du tableau des séries (`VariableTable`), construit
 * sur les briques partagées de `sheetTable.tsx` sans copie : bloc blanc (`tableStyles`), en-têtes
 * « Libellé » et « Durée », lignes de 36 (`DraggableRow` : poignée, numéro, glisser RC-5 et
 * actions accessibles Monter / Descendre), repère d'insertion (`InsertionGuide`) et croix de
 * retrait (`RemoveRowButton`). Ni pied, ni ± propres, ni ligne « Ajouter une phase » : le nombre
 * se règle par le stepper de la ligne « Phases de l'exercice ». Aucun espace sous la dernière
 * ligne (RC-9, `tableStyles.block`).
 *
 * Les cellules (libellé au clavier texte, durée au clavier numérique MMSS) sont rendues par la
 * Feuille (`cell`), qui les raccorde à `useSheetKeyboard` ; le tableau ne connaît ni le
 * Brouillon ni ses transitions. Les phases sont désignées par leur IDENTITÉ (`id`), jamais par
 * leur rang : le libellé suit sa phase lors d'un déplacement (`moveWorkPhase`).
 *
 * Croix : PRE-7 (A2.1, D-438, qui remplace D-371 et D-432 pour le retrait ; QR-1, croix indisponible à deux, en découlait) — disponible dès deux
 * phases ; le retrait de l'avant-dernière donne Sans, la durée restante devenant la durée de série
 * (transition du domaine `removeWorkPhase`). Une phase seule relue des données n'a pas de croix
 * disponible (Sans reste le geste). Comme pour les séries, un appui pendant qu'une surface est
 * ouverte la range sans retirer (`removalActive`, décidé par la Feuille).
 *
 * Structure verrouillée (PRE-7 A2.1, D-438, MFN-09, CE-UI-10 : occurrence de Séance,
 * `structureLocked`) : croix et poignées indisponibles (états existants, `unselected`), sans
 * glisser ni actions Monter / Descendre ; les cellules restent fournies par la Feuille, qui garde
 * les durées modifiables. Aucun rendu Figma dédié : `NON VÉRIFIABLE` (ch13).
 *
 * Géométrie (Figma `9207:18817`, lecture seule) en constantes locales nommées, `tokens.ts`
 * inchangé (NFR-3) : cellules Libellé et Durée de 76 × 24, écart de 20 entre elles ; mêmes
 * amorce, lignes et croix que le tableau des séries. Repère de la ligne active (« Repère —
 * phase en cours de réglage ») : trait de 3 × 24 en `colors.primary`, à gauche de la ligne,
 * quand une de ses cellules est en saisie.
 */

const t = strings.executionParameters.sheet;

/** Figma `9207:18817` : cellules Libellé et Durée de 76 × 24, séparées de 20. */
export const PHASE_CELL_WIDTH = 76;
export const PHASE_CELL_GAP = 20;
/** Figma `9207:18817` (« Repère — phase en cours de réglage ») : 3 × 24, à gauche de la ligne. */
const PHASE_ACTIVE_MARKER_WIDTH = 3;
const PHASE_ACTIVE_MARKER_RADIUS = 1.5;

/** Préfixe des identifiants de ligne (`DraggableRow` : `${prefix}-${n}`, `${prefix}-${n}-handle`). */
export const PHASE_ROW_TEST_ID = "execution-sheet-phase-row";

const PHASE_ROW_LABELS: DraggableRowLabels = {
  handle: t.phaseMoveHandle,
  row: t.phaseRow,
  moveUp: t.phaseMoveUp,
  moveDown: t.phaseMoveDown,
};


/** Cellule d'une phase fournie par la Feuille. */
export type WorkPhaseCellKind = "phaseLabel" | "phaseDuration";

export function WorkPhasesTable({
  phases,
  activePhase,
  onRemove,
  removalActive,
  onMove,
  onDraggingChange,
  cell,
  bleed,
  structureLocked = false,
  style,
}: {
  phases: readonly DraftWorkPhase[];
  /** Identité de la phase dont une cellule est en saisie (repère de ligne active), ou `null`. */
  activePhase: number | null;
  onRemove: (phaseId: number) => void;
  /** La croix retire ; sinon son appui range d'abord la surface ouverte (comme les séries). */
  removalActive: boolean;
  onMove: (from: number, to: number) => void;
  onDraggingChange: (dragging: boolean) => void;
  /** Cellule clavier `kind` de la phase d'identité `phaseId` (numéro affiché `number`). */
  cell: (kind: WorkPhaseCellKind, phaseId: number, number: number) => ReactNode;
  /** Débord du cadre de découpe dans la marge du groupe (bloc à 8 du contour du cadre). */
  bleed: number;
  /** PRE-7 (A2.1, D-438) : structure verrouillée (occurrence) — ni retrait ni déplacement. */
  structureLocked?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  // Repère d'insertion pendant le glisser (T-15), comme le tableau des séries.
  const [drag, setDrag] = useState<{ readonly from: number; readonly to: number } | null>(null);
  const guideBefore = drag === null || drag.to === drag.from ? null : drag.to < drag.from ? drag.to : drag.to + 1;
  function handleDrag(next: { readonly from: number; readonly to: number } | null) {
    setDrag(next);
    onDraggingChange(next !== null);
  }
  // RC-5 : phase saisie (identité), de l'appui sur la poignée à la fin de son insertion.
  const [liftedPhase, setLiftedPhase] = useState<number | null>(null);
  const unclipped = drag !== null || liftedPhase !== null;
  const insertionGuide = (before: number) => <InsertionGuide testID={`execution-sheet-phases-insertion-guide-before-${before}`} />;
  return (
    <SheetMotionView enter={false} clip={!unclipped} bleed={bleed} style={[tableStyles.block, style]} testID="execution-sheet-phases-table">
      {/* E-20 : à l'apparition du tableau, ses lignes ne se révèlent pas séparément. */}
      <SheetMotionGroupMount>
        <View style={tableStyles.header} testID="execution-sheet-phases-table-header">
          <View style={tableStyles.headerLead} />
          <View style={tableStyles.leadGap} />
          <Text style={[tableStyles.columnHeader, styles.column]}>{t.phaseColumns.label}</Text>
          <View style={styles.cellGap} />
          <Text style={[tableStyles.columnHeader, styles.column]}>{t.phaseColumns.duration}</Text>
          <View style={tableStyles.spacer} />
          <View style={tableStyles.removeColumn} />
        </View>
        {phases.map((phase, index) => (
          <Fragment key={`phase-${phase.id}`}>
            {guideBefore === index ? insertionGuide(index + 1) : null}
            <WorkPhaseRow
              index={index}
              phaseId={phase.id}
              count={phases.length}
              active={activePhase === phase.id}
              onRemove={onRemove}
              removalActive={removalActive}
              onMove={onMove}
              onDrag={handleDrag}
              lifted={liftedPhase === phase.id}
              onLiftedChange={(lifted) =>
                setLiftedPhase((current) => (lifted ? phase.id : current === phase.id ? null : current))
              }
              clip={!unclipped}
              structureLocked={structureLocked}
              cell={(kind) => cell(kind, phase.id, index + 1)}
            />
          </Fragment>
        ))}
        {guideBefore === phases.length ? insertionGuide(phases.length + 1) : null}
      </SheetMotionGroupMount>
    </SheetMotionView>
  );
}

/** Ligne du tableau des phases : poignée et numéro, Libellé, Durée, croix ; repère si active. */
function WorkPhaseRow({
  index,
  phaseId,
  count,
  active,
  onRemove,
  removalActive,
  onMove,
  onDrag,
  lifted,
  onLiftedChange,
  clip,
  structureLocked,
  cell,
}: {
  index: number;
  phaseId: number;
  count: number;
  active: boolean;
  onRemove: (phaseId: number) => void;
  removalActive: boolean;
  onMove: (from: number, to: number) => void;
  onDrag: (state: { readonly from: number; readonly to: number } | null) => void;
  lifted: boolean;
  onLiftedChange: (lifted: boolean) => void;
  clip: boolean;
  structureLocked: boolean;
  cell: (kind: WorkPhaseCellKind) => ReactNode;
}) {
  const number = index + 1;
  const testID = `${PHASE_ROW_TEST_ID}-${number}`;
  return (
    <SheetMotionView
      // RC-5 : les autres lignes se décalent visiblement ; la ligne saisie est portée par `DraggableRow`.
      transition={lifted ? false : "row"}
      raised={lifted}
      clip={clip}
      // La marge des lignes porte la zone tactile de la poignée (AD-28) et le repère de ligne active.
      bleed={TABLE_ROW_INSET}
      testID={`${testID}-motion`}
    >
      {active ? (
        <View
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={styles.activeMarker}
          testID={`${testID}-active-marker`}
        />
      ) : null}
      <DraggableRow
        index={index}
        count={count}
        onMove={(to) => onMove(index, to)}
        onDrag={onDrag}
        onLiftedChange={onLiftedChange}
        labels={PHASE_ROW_LABELS}
        testIDPrefix={PHASE_ROW_TEST_ID}
        movable={!structureLocked}
      >
        <View style={styles.column} testID={`${testID}-label-cell`}>
          {cell("phaseLabel")}
        </View>
        <View style={styles.cellGap} />
        <View style={styles.column} testID={`${testID}-duration-cell`}>
          {cell("phaseDuration")}
        </View>
        <View style={tableStyles.spacer} />
        <RemoveRowButton
          accessibilityLabel={t.removePhase.replace("{n}", String(number))}
          closesFieldHint={t.removePhaseClosesFieldHint}
          // PRE-7 (A2.1, D-438) : croix disponible dès deux phases (2 → Sans), indisponible pour une
          // phase seule relue des données et sous structure verrouillée (occurrence).
          disabled={structureLocked || count < WORK_PHASE_LIMITS.controlMinCount}
          active={removalActive}
          onPress={() => onRemove(phaseId)}
          testID={`${testID}-remove`}
        />
      </DraggableRow>
    </SheetMotionView>
  );
}

const styles = StyleSheet.create({
  // Colonne Libellé ou Durée (76, rétrécissable sur un écran étroit), en-tête compris.
  column: {
    width: PHASE_CELL_WIDTH,
    flexShrink: 1,
  },
  cellGap: {
    width: PHASE_CELL_GAP,
  },
  // Repère de la ligne active, dans le retrait de la ligne, centré sur la hauteur des cellules.
  activeMarker: {
    position: "absolute",
    left: -TABLE_ROW_INSET,
    top: (TABLE_ROW_HEIGHT - TABLE_CELL_HEIGHT) / 2,
    width: PHASE_ACTIVE_MARKER_WIDTH,
    height: TABLE_CELL_HEIGHT,
    borderRadius: PHASE_ACTIVE_MARKER_RADIUS,
    backgroundColor: colors.primary,
  },
});
