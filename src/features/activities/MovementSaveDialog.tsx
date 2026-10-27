import { useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { strings } from "@/shared/i18n";
import { colors, dimensions } from "@/shared/ui/tokens";

/** Choix explicite du dialogue de nom modifié (D-445 C03). */
export type MovementSaveChoice = "UPDATE" | "NEW_MOVEMENT";

export type MovementSaveDialogProps =
  | {
      /** Nom enregistré modifié : « Vous souhaitez : », deux choix, aucune présélection. */
      readonly variant: "CHOICE";
      readonly otherCount: number;
      readonly onConfirm: (choice: MovementSaveChoice) => void;
      /**
       * PRE-8 (B.2, DSF Mouvements §5, `10415:22524`) : depuis le Catalogue des Mouvements, aucun
       * exercice n'est l'objet édité — la conséquence « Uniquement pour cet exercice » n'est pas
       * affichée (libellé « à adapter », non fourni : Q-B3). Défaut `false` : rendu inchangé.
       */
      readonly withoutNewMovementDetail?: boolean;
      readonly onCancel: () => void;
    }
  | {
      /** Nom inchangé, contenu modifié, autres exercices : confirmation de mise à jour seule. */
      readonly variant: "CONFIRM";
      readonly otherCount: number;
      readonly onConfirm: () => void;
      readonly onCancel: () => void;
    };

/**
 * Valeurs relevées en lecture seule (MCP, 26/10/2026) sur `9952:44349` (« Sauvegarde — Nom
 * modifié »), `10257:20651` (« Choix sélectionné ») et `10253:20414` (« Nom inchangé ») : fenêtre
 * centrée de 354, marges 24 (géométrie de `dimensions.decisionDialog`) ; titre Semi Bold 18 aligné
 * à gauche ; message Regular 14 secondaire, 18 sous le titre ; choix 306 × 68, rayon 12, liseré 1,
 * libellé Medium 15 à 16 / 14 du bord, conséquence Regular 13 à 36 du haut, radio 20 à droite ; 8
 * entre les choix ; actions 147 × 48 (neutre à gauche, principale à droite), 16 sous les choix.
 * Écart signalé par le DSF : sur `9952:44349` Confirmer est absent avant le choix ; le relevé
 * utilisateur (§4) exige Confirmer visible et indisponible — c'est la règle suivie. Constantes
 * locales : `tokens.ts` inchangé.
 */
const TITLE = { fontFamily: "Inter_600SemiBold", fontWeight: "600", fontSize: 18, lineHeight: 22, color: colors.textPrimary } as const;
const MESSAGE = { fontFamily: "Inter_400Regular", fontWeight: "400", fontSize: 14, lineHeight: 17, color: colors.textSecondary } as const;
const CHOICE_LABEL = { fontFamily: "Inter_500Medium", fontWeight: "500", fontSize: 15, lineHeight: 18, color: colors.textPrimary } as const;
const CHOICE_DETAIL = { fontFamily: "Inter_400Regular", fontWeight: "400", fontSize: 13, lineHeight: 16, color: colors.textSecondary } as const;
const ACTION_LABEL = { fontFamily: "Inter_500Medium", fontWeight: "500", fontSize: 15, lineHeight: 18 } as const;
const CHOICE_MIN_HEIGHT = 68;
const CHOICE_RADIUS = 12;
const RADIO_SIZE = 20;

/** Portée annoncée (C03 : « le dialogue indique la portée réelle » ; zéro n'est jamais masqué). */
function scopeText(otherCount: number): string {
  const t = strings.screens.activities.editor.movementSave;
  if (otherCount === 0) {
    return t.noOther;
  }
  return (otherCount === 1 ? t.otherSingular : t.otherPlural).replace("{n}", String(otherCount));
}

/**
 * PRE-7 (R-4, D-445 C03, v7 §3) — dialogue UNIQUE de sauvegarde d'un Mouvement existant modifié,
 * dans tous les contextes (Catalogue, reprise, occurrence de Séance par le crayon, C04). Remplace la
 * feuille d'identité de MFN-08 (`IdentityDecisionSheet`). La décision d'afficher l'une ou l'autre
 * variante appartient au domaine (`decideMovementSave`).
 *
 * `CHOICE` : deux cartes à bouton radio, sans présélection ; Confirmer reste visible mais
 * indisponible tant qu'aucune n'est cochée ; Annuler reste disponible et ne devient jamais
 * Confirmer. `CONFIRM` : Annuler / Confirmer. Annuler et le retour système rendent le brouillon de
 * l'éditeur intact, sans écriture. Composant `Modal` natif, comme `DecisionDialog`.
 */
export function MovementSaveDialog(props: MovementSaveDialogProps) {
  const t = strings.screens.activities.editor.movementSave;
  const [choice, setChoice] = useState<MovementSaveChoice | null>(null);
  const confirmDisabled = props.variant === "CHOICE" && choice === null;
  const confirm = () => {
    if (props.variant === "CONFIRM") {
      props.onConfirm();
    } else if (choice !== null) {
      props.onConfirm(choice);
    }
  };
  const scope =
    props.variant === "CONFIRM" ? `${scopeText(props.otherCount)} ${t.appliesToAll}` : scopeText(props.otherCount);

  return (
    <Modal transparent visible animationType="fade" onRequestClose={props.onCancel}>
      <View style={styles.backdrop} testID="movement-save-backdrop">
        <View style={styles.card} accessibilityViewIsModal testID="movement-save-dialog">
          <Text style={TITLE} accessibilityRole="header">
            {props.variant === "CHOICE" ? t.choiceTitle : t.confirmTitle}
          </Text>
          <Text style={MESSAGE}>{scope}</Text>
          {props.variant === "CHOICE" ? (
            <View style={styles.choices} accessibilityRole="radiogroup">
              {(
                [
                  ["UPDATE", t.update, t.updateDetail],
                  ["NEW_MOVEMENT", t.newMovement, t.newMovementDetail],
                ] as const
              ).map(([value, label, fullDetail]) => {
                const detail = value === "NEW_MOVEMENT" && props.withoutNewMovementDetail === true ? null : fullDetail;
                const selected = choice === value;
                return (
                  <Pressable
                    key={value}
                    onPress={() => setChoice(value)}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: selected }}
                    accessibilityLabel={detail === null ? label : `${label}, ${detail}`}
                    style={[styles.choice, selected ? styles.choiceSelected : null]}
                    testID={`movement-save-choice-${value}`}
                  >
                    <View style={styles.choiceText}>
                      <Text style={CHOICE_LABEL}>{label}</Text>
                      {detail === null ? null : <Text style={CHOICE_DETAIL}>{detail}</Text>}
                    </View>
                    <View style={[styles.radio, selected ? styles.radioSelected : null]}>
                      {selected ? <View style={styles.radioDot} /> : null}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          ) : null}
          <View style={styles.actions}>
            <Pressable
              onPress={props.onCancel}
              accessibilityRole="button"
              accessibilityLabel={t.cancel}
              style={[styles.action, styles.neutralAction]}
              testID="movement-save-cancel"
            >
              <Text style={[ACTION_LABEL, { color: colors.textPrimary }]}>{t.cancel}</Text>
            </Pressable>
            <Pressable
              onPress={confirm}
              disabled={confirmDisabled}
              accessibilityRole="button"
              accessibilityLabel={t.confirm}
              accessibilityState={{ disabled: confirmDisabled }}
              style={[styles.action, styles.primaryAction, confirmDisabled ? styles.primaryActionDisabled : null]}
              testID="movement-save-confirm"
            >
              <Text style={[ACTION_LABEL, { color: colors.background }]}>{t.confirm}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlayScrim,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: dimensions.decisionDialog.width,
    maxWidth: "100%",
    backgroundColor: colors.background,
    borderRadius: dimensions.decisionDialog.radius,
    padding: dimensions.decisionDialog.padding,
    gap: dimensions.decisionDialog.gap,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 8,
  },
  choices: {
    gap: 8,
  },
  choice: {
    minHeight: CHOICE_MIN_HEIGHT,
    borderRadius: CHOICE_RADIUS,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    paddingLeft: 16,
    paddingRight: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  choiceSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceSubtle,
  },
  choiceText: {
    flex: 1,
    gap: 4,
  },
  radio: {
    width: RADIO_SIZE,
    height: RADIO_SIZE,
    borderRadius: RADIO_SIZE / 2,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  radioSelected: {
    borderColor: colors.primary,
    borderWidth: 6,
  },
  radioDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.background,
  },
  actions: {
    flexDirection: "row",
    gap: dimensions.decisionDialog.actionGap,
  },
  action: {
    flex: 1,
    minHeight: dimensions.decisionDialog.actionHeight,
    borderRadius: dimensions.decisionDialog.actionRadius,
    alignItems: "center",
    justifyContent: "center",
  },
  neutralAction: {
    backgroundColor: colors.dialogNeutralActionBackground,
  },
  primaryAction: {
    backgroundColor: colors.primary,
  },
  primaryActionDisabled: {
    opacity: 0.4,
  },
});
