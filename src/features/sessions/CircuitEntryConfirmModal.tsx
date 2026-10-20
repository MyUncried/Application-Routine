import { DecisionDialog } from "@/features/sessions/DecisionDialog";
import { DIALOG_8328_MESSAGE_COLOR } from "@/features/sessions/ExerciseExitConfirmModal";
import { strings } from "@/shared/i18n";
import { colors, type } from "@/shared/ui/tokens";

/**
 * Opération qui fait entrer un ou plusieurs exercices dans un Circuit de
 * Séries : ajout (Catalogue, création) ou déplacement (glisser, « Monter » /
 * « Descendre »).
 */
export type CircuitEntryKind = "ADD" | "MOVE";

/**
 * Message du dialogue : nombre de séries N et rang N-ième au-delà duquel les
 * séries sont supprimées. `exerciseCount` > 1 (ajout multiple) : pluriel.
 */
export function formatCircuitEntryMessage(kind: CircuitEntryKind, seriesCount: number, exerciseCount: number): string {
  const t = strings.screens.composition.circuitEntryConfirmModal;
  const template =
    kind === "MOVE" ? t.moveMessage : exerciseCount > 1 ? t.addMessagePlural : t.addMessageSingular;
  const series = (seriesCount === 1 ? t.seriesSingular : t.seriesPlural).replace("{n}", String(seriesCount));
  const ordinal = seriesCount === 1 ? t.ordinalFirst : t.ordinalOther.replace("{n}", String(seriesCount));
  return template.replace("{series}", series).replace("{ordinal}", ordinal);
}

export type CircuitEntryConfirmModalProps = {
  readonly kind: CircuitEntryKind;
  /** N du Circuit de Séries. */
  readonly seriesCount: number;
  /** Nombre d'exercices qui entrent (accord du message d'ajout). */
  readonly exerciseCount: number;
  /** « Annuler » : ferme le dialogue, aucune mutation. */
  readonly onCancel: () => void;
  /** « Confirmer » : applique l'opération adaptée à N. */
  readonly onConfirm: () => void;
};

/**
 * PRE-6 (story 2.3) : confirmation de perte de séries à l'entrée d'un
 * exercice dans un Circuit de Séries. Réutilise le dialogue générique
 * `DecisionDialog` avec le rendu de `8328:34964` (ch13 « Confirmation de
 * perte de séries ») : titre Semi Bold 18, message 14, Annuler à gauche,
 * Confirmer à droite — mêmes styles que le dialogue `8328:36781`
 * (`ExerciseExitConfirmModal`, G-9). `onRequestClose` vaut Annuler.
 */
export function CircuitEntryConfirmModal({
  kind,
  seriesCount,
  exerciseCount,
  onCancel,
  onConfirm,
}: CircuitEntryConfirmModalProps) {
  const t = strings.screens.composition.circuitEntryConfirmModal;
  return (
    <DecisionDialog
      title={kind === "MOVE" ? t.moveTitle : t.addTitle}
      titleStyle={{ ...type.modalTitle, color: colors.dialogTitleText }}
      message={formatCircuitEntryMessage(kind, seriesCount, exerciseCount)}
      messageStyle={{ ...type.dialogMessage, color: DIALOG_8328_MESSAGE_COLOR }}
      cancelLabel={t.cancel}
      cancelLabelStyle={{ ...type.dialogNeutralActionLabel, color: colors.dialogNeutralActionText }}
      confirmLabel={t.confirm}
      confirmLabelStyle={type.dialogDestructiveActionLabel}
      confirmBordered
      onCancel={onCancel}
      onConfirm={onConfirm}
      testIDPrefix="circuit-entry-confirm"
    />
  );
}
