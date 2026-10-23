import { DecisionDialog } from "@/features/sessions/DecisionDialog";
import { DIALOG_8328_MESSAGE_COLOR } from "@/features/sessions/ExerciseExitConfirmModal";
import { strings } from "@/shared/i18n";
import { colors, type } from "@/shared/ui/tokens";

/**
 * Opération qui fait entrer un ou plusieurs exercices dans un Circuit de
 * Séries : ajout (Catalogue, création) ou déplacement (glisser, « Monter » /
 * « Descendre »). PRE-6 (story 3.2, CE-CIR-02) : `NATURE` — conversion du
 * Circuit de tours en Circuit de séries (tous les exercices du Circuit).
 */
export type CircuitEntryKind = "ADD" | "MOVE" | "NATURE";

/**
 * Message du dialogue : nombre de séries N et rang N-ième au-delà duquel les
 * séries sont supprimées. `exerciseCount` > 1 (ajout multiple) : pluriel ; sans
 * effet pour `MOVE` et `NATURE`.
 */
export function formatCircuitEntryMessage(kind: CircuitEntryKind, seriesCount: number, exerciseCount = 1): string {
  const t = strings.screens.composition.circuitEntryConfirmModal;
  const template =
    kind === "NATURE"
      ? t.natureMessage
      : kind === "MOVE"
        ? t.moveMessage
        : exerciseCount > 1
          ? t.addMessagePlural
          : t.addMessageSingular;
  const series = (seriesCount === 1 ? t.seriesSingular : t.seriesPlural).replace("{n}", String(seriesCount));
  const ordinal = seriesCount === 1 ? t.ordinalFirst : t.ordinalOther.replace("{n}", String(seriesCount));
  return template.replace("{series}", series).replace("{ordinal}", ordinal);
}

export type CircuitEntryConfirmModalProps = {
  /** N du Circuit de Séries. */
  readonly seriesCount: number;
  /** « Annuler » : ferme le dialogue, aucune mutation. */
  readonly onCancel: () => void;
  /** « Confirmer » : applique l'opération adaptée à N. */
  readonly onConfirm: () => void;
} & (
  | {
      readonly kind: "ADD" | "MOVE";
      /** Nombre d'exercices qui entrent (accord du message d'ajout). */
      readonly exerciseCount: number;
    }
  | {
      /** PRE-6 (story 3.2) : conversion du Circuit, aucun nombre d'exercices. */
      readonly kind: "NATURE";
      readonly exerciseCount?: undefined;
    }
);

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
      title={kind === "NATURE" ? t.natureTitle : kind === "MOVE" ? t.moveTitle : t.addTitle}
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
      testIDPrefix={kind === "NATURE" ? "circuit-nature-confirm" : "circuit-entry-confirm"}
    />
  );
}
