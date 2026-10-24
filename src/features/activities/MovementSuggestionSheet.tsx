import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { strings } from "@/shared/i18n";
import { colors, fixedRadii, minTouchTarget, spacing, type } from "@/shared/ui/tokens";

import type { MovementChoice } from "./ActivityDefinitionService";
import { MovementChoiceCard } from "./MovementChoiceCard";
import { fillTemplate } from "./movementChoicePresentation";

/** Choix explicite de l'origine du geste (MFN-06), jamais présélectionné. */
export type MovementOriginChoice = "SAME_MOVEMENT" | "VARIANT" | "INDEPENDENT";

export type MovementSuggestionSheetProps = {
  /** Faux pendant la fermeture animée (iOS : la feuille reste montée jusqu'à `onDismissed`). */
  readonly visible: boolean;
  /** Geste proche RÉELLEMENT proposé (`findCloseMovement`), jamais un exemple codé en dur. */
  readonly suggestion: MovementChoice;
  readonly onChoose: (choice: MovementOriginChoice) => void;
  /** « Rechercher un autre geste » : recherche explicite (`9959:19623`). */
  readonly onSearch: () => void;
  /**
   * Retour système (Android) : la feuille se ferme sans choix — la création reste celle en cours,
   * sans aucun rattachement (MFN-05, MFN-06 : rien n'est présélectionné ni attribué).
   */
  readonly onDismiss: () => void;
  /** `onDismiss` du `Modal` (iOS) : fin de la fermeture animée. */
  readonly onDismissed: () => void;
};

/**
 * Valeurs de la feuille `9882:19125` (« Feuille - Rapprochement du geste », relevé MCP en lecture
 * seule du 24/10) : coins hauts 24 ; titre Semi Bold 20 `#141414` à 28 du haut ; message Regular 14
 * `#7A7A80` à 6 dessous ; carte du geste à 8 sous le message ; trois choix 354 × 64 (hauteur
 * minimale) à 20 sous la carte, 8 entre eux, fond blanc, liseré 1 `#E4E7EF`, rayon 12, libellé
 * Medium 15 à 12 / 15 du bord, explication Regular 13 `#7A7A80` à 4 dessous ; « Rechercher un autre
 * geste » Medium 15 `primary` à 18 sous le dernier choix. Constantes locales : `tokens.ts` inchangé.
 */
const SHEET_RADIUS = 24;
const SHEET_TOP = 28;
const SECONDARY_TEXT = "#7A7A80";
const CHOICE_BORDER = "#E4E7EF";
const CHOICE_MIN_HEIGHT = 64;
const TITLE = { ...type.screenTitle, lineHeight: 24, color: colors.textPrimary } as const;
const MESSAGE = { fontFamily: "Inter_400Regular", fontWeight: "400", fontSize: 14, lineHeight: 17, color: SECONDARY_TEXT } as const;
const CHOICE_LABEL = { fontFamily: "Inter_500Medium", fontWeight: "500", fontSize: 15, lineHeight: 18, color: colors.textPrimary } as const;
const CHOICE_DETAIL = { fontFamily: "Inter_400Regular", fontWeight: "400", fontSize: 13, lineHeight: 16, color: SECONDARY_TEXT } as const;
const LINK_LABEL = { fontFamily: "Inter_500Medium", fontWeight: "500", fontSize: 15, lineHeight: 18, color: colors.primary } as const;

/**
 * PRE-7 story A2.3 (MFN-06, D-439 ; CE-T03-04 §11 ; `9882:19049`) — suggestion d'un geste proche à
 * la création : la carte du geste proposé, TROIS choix explicites, aucun présélectionné, et l'accès
 * à la recherche. Composée sur la `Modal` native, comme la question d'identité (A2.2) : aucune
 * primitive native ne porte trois choix expliqués. La suggestion ne rattache rien : seul le choix
 * de l'utilisateur décide (MFN-05). Le message s'adapte à l'origine du geste : « déjà dans votre
 * catalogue » s'il a au moins un Exercice au Catalogue, formulation neutre sinon (relevé du 23/10).
 */
export function MovementSuggestionSheet({
  visible,
  suggestion,
  onChoose,
  onSearch,
  onDismiss,
  onDismissed,
}: MovementSuggestionSheetProps) {
  const insets = useSafeAreaInsets();
  const t = strings.screens.activities.editor.movementSuggestion;
  const name = suggestion.movement.name;
  const message = fillTemplate(suggestion.definitionCount > 0 ? t.catalogueMessage : t.localMessage, { name });

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onDismiss} onDismiss={onDismissed}>
      <View style={styles.backdrop} testID="movement-suggestion-backdrop">
        <View
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, spacing[24]) }]}
          accessibilityViewIsModal
          testID="movement-suggestion-sheet"
        >
          <Text style={styles.title} accessibilityRole="header" testID="movement-suggestion-title">
            {t.title}
          </Text>
          <Text style={styles.message} testID="movement-suggestion-message">
            {message}
          </Text>
          <View style={styles.card}>
            <MovementChoiceCard choice={suggestion} variant="summary" testID="movement-suggestion-card" />
          </View>
          <View style={styles.choices}>
            <Choice
              label={t.sameMovement}
              detail={fillTemplate(t.sameMovementDetail, { name })}
              onPress={() => onChoose("SAME_MOVEMENT")}
              testID="movement-suggestion-same"
            />
            <Choice label={t.variant} detail={t.variantDetail} onPress={() => onChoose("VARIANT")} testID="movement-suggestion-variant" />
            <Choice
              label={t.independent}
              detail={fillTemplate(t.independentDetail, { name })}
              onPress={() => onChoose("INDEPENDENT")}
              testID="movement-suggestion-independent"
            />
          </View>
          <Pressable
            onPress={onSearch}
            accessibilityRole="button"
            accessibilityLabel={t.searchOther}
            hitSlop={(minTouchTarget - LINK_LABEL.lineHeight) / 2}
            style={styles.link}
            testID="movement-suggestion-search"
          >
            <Text style={styles.linkLabel}>{t.searchOther}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

function Choice({ label, detail, onPress, testID }: { label: string; detail: string; onPress: () => void; testID: string }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}. ${detail}`}
      style={styles.choice}
      testID={testID}
    >
      <Text style={styles.choiceLabel}>{label}</Text>
      <Text style={styles.choiceDetail} testID={`${testID}-detail`}>
        {detail}
      </Text>
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
    paddingHorizontal: spacing[24],
  },
  title: TITLE,
  message: {
    ...MESSAGE,
    marginTop: 6,
  },
  card: {
    marginTop: spacing[8],
  },
  choices: {
    marginTop: 20,
    gap: spacing[8],
  },
  choice: {
    minHeight: CHOICE_MIN_HEIGHT,
    borderWidth: 1,
    borderColor: CHOICE_BORDER,
    borderRadius: fixedRadii[12],
    backgroundColor: colors.background,
    paddingHorizontal: 15,
    paddingTop: 12,
    paddingBottom: 12,
  },
  choiceLabel: CHOICE_LABEL,
  choiceDetail: {
    ...CHOICE_DETAIL,
    marginTop: 4,
  },
  link: {
    alignSelf: "flex-start",
    marginTop: 18,
    minHeight: LINK_LABEL.lineHeight,
    justifyContent: "center",
  },
  linkLabel: LINK_LABEL,
});
