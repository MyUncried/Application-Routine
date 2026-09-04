import { DecisionDialog } from "@/features/sessions/DecisionDialog";
import { strings } from "@/shared/i18n";
import { colors, type } from "@/shared/ui/tokens";

export type AbandonCreationModalProps = {
  /** « Annuler » — ferme la modale, conserve intégralement la création en cours. */
  onCancel: () => void;
  /** « Confirmer » — réinitialise le brouillon puis rejoue la navigation initialement bloquée. */
  onConfirm: () => void;
};

/**
 * Modale « Abandonner la création d'une séance » (CE-T01-08, docs §06,
 * « Les modales »). Titre et message repris mot pour mot de la
 * spécification fonctionnelle (inchangés depuis l'origine).
 *
 * **REWORK10** (`[ChatGPT] CHANGES_REQUESTED — REWORK10 — dialogue
 * d'abandon de création`, 2026-09-04) : anatomie réalignée sur `Overlay /
 * Decision Dialog` (`2590:2961`), vérifiée directement sur son instance
 * concrète `2591:3083` (frame CE-T01-08, `2028:11298`) — validée sur
 * iPhone (`[ChatGPT] CHANGES_REQUESTED — REWORK11`, 2026-09-04,
 * « dialogue d'abandon de création de séance validé sur iPhone »).
 *
 * **REWORK11** (`[ChatGPT] CHANGES_REQUESTED — REWORK11 — dialogue
 * d'abandon d'une Activité`, 2026-09-04, « Réutilisation canonique
 * obligatoire ») : la géométrie/le comportement communs sont désormais
 * portés par le composant partagé `DecisionDialog` (extrait de ce
 * fichier), consommé aussi par `ExerciseExitConfirmModal.tsx`. **Rendu et
 * comportement strictement inchangés par cette extraction** — mêmes
 * `testID` (`abandon-creation-backdrop`/`-card`/`-actions`), mêmes
 * valeurs de style (`titleStyle`/`messageStyle`/`cancelLabelStyle`/
 * `confirmLabelStyle` reproduisent exactement les styles locaux
 * précédents), `confirmBordered` conservé à `true` (liseré rouge
 * `colors.dialogDestructiveActionBorder`, vérifié présent sur `2591:3083`,
 * distinct du dialogue Activité qui en est dépourvu) — vérifié par la
 * suite de tests REWORK10 existante, gardée verte sans aucune modification
 * de ses assertions.
 */
export function AbandonCreationModal({ onCancel, onConfirm }: AbandonCreationModalProps) {
  const modalStrings = strings.screens.composition.abandonModal;

  return (
    <DecisionDialog
      title={modalStrings.title}
      titleStyle={{ ...type.modalTitle, color: colors.dialogTitleText }}
      message={modalStrings.message}
      messageStyle={{ ...type.dialogMessage, color: colors.dialogMessageText, textAlign: "justify" }}
      cancelLabel={modalStrings.continueCreating}
      cancelLabelStyle={{ ...type.dialogNeutralActionLabel, color: colors.dialogNeutralActionText }}
      confirmLabel={modalStrings.abandon}
      confirmLabelStyle={type.dialogDestructiveActionLabel}
      confirmBordered
      onCancel={onCancel}
      onConfirm={onConfirm}
      testIDPrefix="abandon-creation"
    />
  );
}
