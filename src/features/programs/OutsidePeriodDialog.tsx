import { fillTemplate } from "@/features/activities/movementChoicePresentation";
import { DecisionDialog } from "@/features/sessions/DecisionDialog";
import { colors, type } from "@/shared/ui/tokens";

import { programStrings } from "./programStrings";

/**
 * D-566 (23/11/2026, recette du Programme) — routine qui déborde de la période du programme, au rattachement ou à sa modification
 * depuis le Journal : « N créneaux sont en dehors de la période du programme. »
 * - « Garder dans le calendrier » (par défaut) : la routine n'est pas coupée, ces créneaux restent hors programme ;
 * - « Supprimer » : les créneaux à venir hors période sont supprimés ;
 * - « Annuler » : rien n'est enregistré.
 * Confirmation commune des programmes (`DecisionDialog` empilée, comme la suppression d'un programme) : action principale rouge
 * (Supprimer), action secondaire (Garder), Annuler. [Interprétation : ordre des actions imposé par la variante empilée.]
 */
const t = programStrings.attach;

/**
 * Contre-recette du 23/11/2026, lot 4 : `ATTACH` — rattachement d'une routine à un programme (« de ce programme », x9) ;
 * `JOURNAL` — modification de la routine depuis le Journal, sans changement de programme (« du programme », x10).
 */
export type OutsidePeriodContext = "ATTACH" | "JOURNAL";

export function outsidePeriodMessage(count: number, context: OutsidePeriodContext = "ATTACH"): string {
  const journal = context === "JOURNAL";
  return count === 1 ? (journal ? t.outsideOneJournal : t.outsideOne) : fillTemplate(journal ? t.outsideManyJournal : t.outsideMany, { count: String(count) });
}

export function OutsidePeriodDialog({
  count,
  context = "ATTACH",
  onKeep,
  onDelete,
  onCancel,
  testIDPrefix,
}: {
  readonly count: number;
  readonly context?: OutsidePeriodContext;
  readonly onKeep: () => void;
  readonly onDelete: () => void;
  readonly onCancel: () => void;
  readonly testIDPrefix: string;
}) {
  return (
    <DecisionDialog
      stacked
      title={outsidePeriodMessage(count, context)}
      titleStyle={{ ...type.modalTitle, color: colors.dialogTitleText, textAlign: "center" }}
      message=""
      messageStyle={{ ...type.dialogMessage, color: colors.dialogMessageText, textAlign: "center" }}
      cancelLabel={t.outsideCancel}
      cancelLabelStyle={{ ...type.dialogNeutralActionLabel, color: colors.dialogNeutralActionText }}
      confirmLabel={t.outsideDelete}
      confirmLabelStyle={type.dialogDestructiveActionLabel}
      confirmBordered={false}
      secondaryAction={{ label: t.outsideKeep, onPress: onKeep }}
      onCancel={onCancel}
      onConfirm={onDelete}
      testIDPrefix={testIDPrefix}
    />
  );
}
