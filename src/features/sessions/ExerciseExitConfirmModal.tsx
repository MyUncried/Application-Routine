import { DecisionDialog } from "@/features/sessions/DecisionDialog";
import { strings } from "@/shared/i18n";
import { colors, type } from "@/shared/ui/tokens";

export type ExerciseExitConfirmModalProps = {
  /** « Annuler » — ferme la modale, conserve intégralement la copie de travail locale. */
  onCancel: () => void;
  /** « Confirmer » — abandonne la copie de travail locale puis rejoue la navigation initialement bloquée. */
  onConfirm: () => void;
  /**
   * PRE-4 story 4.2 (Q18, FR-02-12) : `true` en création (CC, CS) — titre
   * « Abandonner la création ? » et son message ; `false` par défaut
   * (modification, MC et MS) — textes PRE-3 inchangés. Seuls les textes
   * changent : rendu, actions et comportement restent ceux du composant accepté.
   */
  isCreation?: boolean;
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
/** G-9 : couleur du message du dialogue d'abandon (`8328:36781`), sans jeton exact. */
const EXIT_DIALOG_MESSAGE_COLOR = "#474D57";

export function ExerciseExitConfirmModal({ onCancel, onConfirm, isCreation = false }: ExerciseExitConfirmModalProps) {
  const modalStrings = strings.screens.exercise.exitConfirmModal;

  return (
    <DecisionDialog
      title={isCreation ? modalStrings.createTitle : modalStrings.title}
      titleStyle={{ ...type.modalTitle, color: colors.dialogTitleText }}
      message={isCreation ? modalStrings.createMessage : modalStrings.message}
      // PRE-5 story 3.2, arbitrage G-9 de Hermann du 19/10 (Figma `8328:36781`) : titre Inter
      // Semi Bold 18 (`type.modalTitle`, inchangé), message Inter Regular 14 interligne 21
      // (`type.dialogMessage`) ; structure, couleurs et interactions PRE-3 conservées.
      // Compléments G-9 (conformité au Figma actuel, `8328:36781`) : message `#474D57` (constante
      // locale), libellés d'action en 16 — « Annuler » Semi Bold `#292E38`, « Confirmer » Medium —
      // et liseré de « Confirmer » (jetons Séance existants) ; structure et interactions inchangées.
      messageStyle={{ ...type.dialogMessage, color: EXIT_DIALOG_MESSAGE_COLOR }}
      cancelLabel={modalStrings.continueEditing}
      cancelLabelStyle={{ ...type.dialogNeutralActionLabel, color: colors.dialogNeutralActionText }}
      confirmLabel={modalStrings.abandon}
      confirmLabelStyle={type.dialogDestructiveActionLabel}
      confirmBordered
      onCancel={onCancel}
      onConfirm={onConfirm}
      testIDPrefix="exercise-exit-confirm"
    />
  );
}
