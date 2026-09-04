import { DecisionDialog } from "@/features/sessions/DecisionDialog";
import { strings } from "@/shared/i18n";
import { colors, type } from "@/shared/ui/tokens";

export type ExerciseExitConfirmModalProps = {
  /** « Annuler » — ferme la modale, conserve intégralement la copie de travail locale. */
  onCancel: () => void;
  /** « Confirmer » — abandonne la copie de travail locale puis rejoue la navigation initialement bloquée. */
  onConfirm: () => void;
};

/**
 * Modale « Abandonner les modifications ? » de l'écran Activité (T01-S08,
 * CE-T01-16, D-094 révisée) — distincte d'`AbandonCreationModal`
 * (Composition, CE-T01-08) : celle-ci porte sur la copie de travail locale
 * de l'Activité, jamais sur le `SessionDraft` partagé (aucun autre élément
 * de la Séance — nom, couleur, compte à rebours, fin de séance, autres
 * Activités déjà enregistrées — n'est altéré par `onConfirm`).
 *
 * **REWORK11** (`[ChatGPT] CHANGES_REQUESTED — REWORK11 — dialogue
 * d'abandon d'une Activité`, 2026-09-04) : reconstruite depuis le
 * composant partagé `DecisionDialog` (extrait d'`AbandonCreationModal
 * .tsx`, REWORK10, validé sur iPhone), conformément à l'instance Figma
 * concrète vérifiée directement `3224:4140` (frame CE-T01-16, `3224:4082`)
 * — jamais sur l'ancien rapport ni l'implémentation précédente. Réutilise
 * la géométrie/le comportement communs (voile, carte `354` large rayon
 * `18`, actions `147×48` écart `12`, `spacing/16`, fond neutre/destructif
 * `colors.dialogNeutralActionBackground`/`dialogDestructiveActionBackground`)
 * — aucune duplication locale de ces valeurs (interdite par REWORK11).
 *
 * **Typographie propre à ce contexte** (vérifiée distincte de
 * l'instance Séance `2591:3083` sur le nœud Figma concret — pas une
 * incohérence, deux instances indépendamment art-directées du même
 * composant DSF) :
 * - libellés d'action `14px` Semi Bold (`type.button`, déjà canonique et
 *   partagé ailleurs) pour Annuler ET Confirmer — contre `16px`
 *   Semi Bold/Medium respectivement côté Séance ;
 * - couleur du libellé Annuler : `colors.dialogTitleText` (même ton
 *   quasi-noir que le titre sur cette instance, `#111` vérifié sur Figma,
 *   à moins d'un demi-point de `#121212` déjà canonique — pas un nouveau
 *   token pour un écart imperceptible) — contre `colors.dialogNeutral
 *   ActionText` (`#292E38`) côté Séance ;
 * - message : `type.body`/`colors.textSecondary` (tokens déjà canoniques,
 *   partagés dans tout le projet — `#595E66` vérifié exact sur Figma pour
 *   cette instance), alignement par défaut (gauche) — contre le
 *   `type.dialogMessage`/`colors.dialogMessageText` dédié et justifié de
 *   la Séance ;
 * - action destructive **sans liseré** (`confirmBordered={false}`,
 *   vérifié absent sur `3224:4140` — contre le liseré rouge présent côté
 *   Séance).
 *
 * `onRequestClose` (bouton matériel Android) traité comme Annuler par
 * `DecisionDialog` — comportement inchangé.
 */
export function ExerciseExitConfirmModal({ onCancel, onConfirm }: ExerciseExitConfirmModalProps) {
  const modalStrings = strings.screens.exercise.exitConfirmModal;

  return (
    <DecisionDialog
      title={modalStrings.title}
      titleStyle={{ ...type.modalTitle, color: colors.dialogTitleText }}
      message={modalStrings.message}
      messageStyle={{ ...type.body, color: colors.textSecondary }}
      cancelLabel={modalStrings.continueEditing}
      cancelLabelStyle={{ ...type.button, color: colors.dialogTitleText }}
      confirmLabel={modalStrings.abandon}
      confirmLabelStyle={type.button}
      confirmBordered={false}
      onCancel={onCancel}
      onConfirm={onConfirm}
      testIDPrefix="exercise-exit-confirm"
    />
  );
}
