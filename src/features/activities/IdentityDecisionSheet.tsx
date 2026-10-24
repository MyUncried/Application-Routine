import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { correctionScope } from "@/domain/activities/sharedCorrection";
import { strings } from "@/shared/i18n";
import { colors, fixedRadii, minTouchTarget, spacing, type } from "@/shared/ui/tokens";

/**
 * Contexte de la question d'identité (D-438, MFN-08) : modification d'un Exercice du Catalogue
 * (`CATALOGUE` : « Corriger cet exercice / Créer un nouvel exercice ») ou création sur un geste
 * repris (`REPRISE` : « Corriger ce geste / En faire un geste distinct »). Même décision
 * d'identité ; seuls les libellés et le décompte de la création en cours changent.
 */
export type IdentityDecisionContext = "CATALOGUE" | "REPRISE";

export type IdentityDecisionSheetProps = {
  readonly context: IdentityDecisionContext;
  /** Nom du geste AVANT modification (« Vous avez modifié Squats », « Squats reste intact »). */
  readonly movementName: string;
  /** Définitions du Catalogue qui partagent déjà le geste (`CorrectionAssessment.affectedDefinitionCount`). */
  readonly affectedDefinitionCount: number;
  readonly onCorrect: () => void;
  readonly onNewIdentity: () => void;
  /** « Annuler » (et retour système) : retour au brouillon appelant, intact, sans écriture. */
  readonly onCancel: () => void;
};

/**
 * Valeurs de la feuille `9952:44349` (« Feuille — Confirmation du geste », relevé MCP en lecture
 * seule du 24/10) : coins hauts 24 ; titre Semi Bold 20 `#141414` à 28 du haut ; portée Regular 14
 * `#7A7A80` à 6 sous le titre ; choix 354 × 68 (hauteur minimale ici : le texte agrandi grandit),
 * fond blanc, liseré 1 `#E4E7EF`, rayon 12, libellé Medium 15 à 14 / 16 du bord, explication
 * Regular 13 `#7A7A80` à 4 dessous ; 8 entre les choix ; « Annuler » Medium 15 `primary` à 22 sous le
 * second choix. Constantes locales : `tokens.ts` inchangé.
 */
const SHEET_RADIUS = 24;
const SHEET_TOP = 28;
const SHEET_SIDE = spacing[24];
const SECONDARY_TEXT = "#7A7A80";
const CHOICE_BORDER = "#E4E7EF";
const CHOICE_MIN_HEIGHT = 68;
const TITLE = { ...type.screenTitle, lineHeight: 24, color: colors.textPrimary } as const;
const SCOPE = { fontFamily: "Inter_400Regular", fontWeight: "400", fontSize: 14, lineHeight: 17, color: SECONDARY_TEXT } as const;
const CHOICE_LABEL = { fontFamily: "Inter_500Medium", fontWeight: "500", fontSize: 15, lineHeight: 18, color: colors.textPrimary } as const;
const CHOICE_DETAIL = { fontFamily: "Inter_400Regular", fontWeight: "400", fontSize: 13, lineHeight: 16, color: SECONDARY_TEXT } as const;
const CANCEL_LABEL = { fontFamily: "Inter_500Medium", fontWeight: "500", fontSize: 15, lineHeight: 18, color: colors.primary } as const;

/**
 * PRE-7 story A2.2 (D-438, MFN-08, CE-T03-04 §9 et §14) — question d'identité à l'enregistrement,
 * en feuille basse selon `9952:44349`, montée seulement si le geste est « déjà utilisé » et que son
 * nom, sa description, ses médias ou sa structure de phases ont changé (décision de l'écran,
 * `CorrectionAssessment.requiresIdentityDecision`).
 *
 * Deux choix EXPLIQUÉS et Annuler : ni `DecisionDialog` (carte centrée à deux actions sans
 * explication), ni l'`Alert` à trois boutons de `TourBoundaryChoiceDialog`, ni la feuille d'actions
 * native (`ActionSheetIOS`) ne portent une explication par choix ; la feuille est donc composée sur
 * la `Modal` native, comme les feuilles de référentiel. Le nombre d'Exercices concernés est calculé
 * (`correctionScope`), jamais copié de la maquette, et affiché seulement au-delà d'un.
 */
export function IdentityDecisionSheet({
  context,
  movementName,
  affectedDefinitionCount,
  onCorrect,
  onNewIdentity,
  onCancel,
}: IdentityDecisionSheetProps) {
  const insets = useSafeAreaInsets();
  const t = strings.screens.activities.editor.identityDecision;
  const scope = correctionScope(context === "CATALOGUE" ? "UPDATE" : "SAME_MOVEMENT", affectedDefinitionCount);
  const labels = context === "CATALOGUE" ? t.catalogue : t.reprise;
  const title = t.title.replace("{name}", () => movementName);
  const others =
    scope.otherCount > 0
      ? (scope.otherCount === 1 ? t.otherCountSingular : t.otherCountPlural).replace("{n}", String(scope.otherCount))
      : null;
  const correctDetail = scope.showCount ? t.correctScope.replace("{n}", String(scope.totalCount)) : null;
  const newIdentityDetail = context === "REPRISE" ? t.reprise.newIdentityScope.replace("{name}", () => movementName) : null;

  return (
    <Modal transparent visible animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop} testID="identity-decision-backdrop">
        <View
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing[24]) }]}
          accessibilityViewIsModal
          testID="identity-decision-sheet"
        >
          <Text style={styles.title} accessibilityRole="header" testID="identity-decision-title">
            {title}
          </Text>
          {others ? (
            <Text style={styles.scope} testID="identity-decision-others">
              {others}
            </Text>
          ) : null}
          <View style={styles.choices}>
            <Choice label={labels.correct} detail={correctDetail} onPress={onCorrect} testID="identity-decision-correct" />
            <Choice
              label={labels.newIdentity}
              detail={newIdentityDetail}
              onPress={onNewIdentity}
              testID="identity-decision-new-identity"
            />
          </View>
          <Pressable
            onPress={onCancel}
            accessibilityRole="button"
            accessibilityLabel={t.cancel}
            hitSlop={(minTouchTarget - CANCEL_LABEL.lineHeight) / 2}
            style={styles.cancel}
            testID="identity-decision-cancel"
          >
            <Text style={styles.cancelLabel}>{t.cancel}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function Choice({
  label,
  detail,
  onPress,
  testID,
}: {
  label: string;
  detail: string | null;
  onPress: () => void;
  testID: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={detail ? `${label}. ${detail}` : label}
      style={styles.choice}
      testID={testID}
    >
      <Text style={styles.choiceLabel}>{label}</Text>
      {detail ? (
        <Text style={styles.choiceDetail} testID={`${testID}-detail`}>
          {detail}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: colors.overlayScrim,
  },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: SHEET_RADIUS,
    borderTopRightRadius: SHEET_RADIUS,
    paddingTop: SHEET_TOP,
    paddingHorizontal: SHEET_SIDE,
  },
  title: TITLE,
  scope: {
    ...SCOPE,
    marginTop: 6,
  },
  choices: {
    marginTop: 25,
    gap: spacing[8],
  },
  choice: {
    minHeight: CHOICE_MIN_HEIGHT,
    borderWidth: 1,
    borderColor: CHOICE_BORDER,
    borderRadius: fixedRadii[12],
    backgroundColor: colors.background,
    paddingHorizontal: 15,
    paddingTop: 13,
    paddingBottom: 12,
    justifyContent: "flex-start",
  },
  choiceLabel: CHOICE_LABEL,
  choiceDetail: {
    ...CHOICE_DETAIL,
    marginTop: 4,
  },
  cancel: {
    alignSelf: "flex-start",
    marginTop: 22,
    minHeight: CANCEL_LABEL.lineHeight,
    justifyContent: "center",
  },
  cancelLabel: CANCEL_LABEL,
});
