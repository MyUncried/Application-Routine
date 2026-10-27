import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { strings } from "@/shared/i18n";
import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import { colors, fixedRadii, minTouchTarget } from "@/shared/ui/tokens";

import type { MovementChoice } from "./ActivityDefinitionService";
import {
  MovementResultCard,
  type MovementResultActionLabels,
  type VariantPlacement,
} from "./MovementResultCard";

/**
 * Valeurs de rendu lues sur `9882:19049`, `10175:20349` et `10140:20180` (captures du 25/10) :
 * panneau blanc à coins 16, ombre portée, marges internes 8, 8 entre les cartes ; message rouge
 * Regular 13 au-dessus des cartes ; cadre de retour aux résultats de 32 de haut, liseré
 * `color/cards/border`. Aucune liaison relevée pour ces valeurs : constantes locales, `tokens.ts`
 * inchangé.
 */
const PANEL_RADIUS = 16;
const PANEL_PADDING = 8;
const BACK_FRAME_HEIGHT = 32;

export type MovementSuggestionPanelProps = {
  /** Message d'unicité (C01) au-dessus des cartes ; `null` : aucun. */
  readonly message: string | null;
  /** Résultats affichés, cinq au plus (R04), déjà classés ; figés pendant un appui par l'appelant. */
  readonly results: readonly MovementChoice[];
  /** Mouvement dont la variante est en cours de choix (`10140:20180`) ; `null` : liste. */
  readonly variantOf: string | null;
  readonly onUse: (choice: MovementChoice) => void;
  readonly onCreateVariant: (choice: MovementChoice) => void;
  readonly onChooseVariant: (
    choice: MovementChoice,
    placement: VariantPlacement,
  ) => void;
  /** Cadre de retour : revient à la liste, sans choix. */
  readonly onBack: () => void;
  /** Doigt posé sur le panneau (R04 : « l'ordre ne change pas pendant un appui »). */
  readonly onTouchingChange: (touching: boolean) => void;
  /** Recette A/B B.10 (remarque 6) : libellés des actions des cartes ; absent : ceux de l'éditeur d'Exercice. */
  readonly actionLabels?: MovementResultActionLabels;
};

/**
 * PRE-7 story R-5 (D-445 C01, C02, v7 §6 R03-R04 ; DSF « Saisie et rapprochement » l.39) — panneau
 * superposé sous le nom, clavier visible, rendu par l'éditeur (`ActivityEditorForm`, prop
 * `nameAssist`). Remplace la feuille à trois choix d'A2.3. Il porte :
 * - le message rouge « nom déjà utilisé » (`10175:20349`), affiché dès la frappe ;
 * - jusqu'à cinq cartes Résultat (`10199:22268`), chacune avec ses deux actions internes ; Entrée
 *   ne sélectionne jamais un résultat (le panneau se ferme à la fin de la saisie du nom) ;
 * - après « Créer une variante », la seule carte d'origine sous un cadre de retour, avec les deux
 *   sens Plus facile / Plus difficile (`10140:20180`).
 * Sans résultat, le message seul (correction d'un mouvement existant, variante, Séance : NON
 * VÉRIFIABLE, même emplacement).
 */
export function MovementSuggestionPanel({
  message,
  results,
  variantOf,
  onUse,
  onCreateVariant,
  onChooseVariant,
  onBack,
  onTouchingChange,
  actionLabels,
}: MovementSuggestionPanelProps) {
  const t = strings.screens.activities.editor.movementSuggestion;
  const variantChoice =
    variantOf === null
      ? null
      : (results.find((choice) => choice.movement.id === variantOf) ?? null);
  const shown = variantChoice !== null ? [variantChoice] : results;

  return (
    <View
      style={styles.panel}
      onTouchStart={() => onTouchingChange(true)}
      onTouchEnd={() => onTouchingChange(false)}
      onTouchCancel={() => onTouchingChange(false)}
      testID="movement-suggestion-panel"
    >
      {message !== null ? (
        <Text
          style={styles.message}
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          testID="movement-suggestion-message"
        >
          {message}
        </Text>
      ) : null}
      {variantChoice !== null ? (
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel={t.backToResults}
          hitSlop={(minTouchTarget - BACK_FRAME_HEIGHT) / 2}
          style={styles.backFrame}
          testID="movement-suggestion-back"
        >
          <KodjoIcon
            name="control-back"
            size={20}
            tintColor={colors.textPrimary}
          />
        </Pressable>
      ) : null}
      {/* Hauteur bornée par l'hôte (espace au-dessus du clavier) : les cartes défilent ; un appui
          sur une carte agit sans fermer le clavier (`handled`). */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        testID="movement-suggestion-list"
      >
        {shown.map((choice) => (
          <MovementResultCard
            key={choice.movement.id}
            choice={choice}
            variantExpanded={variantChoice !== null}
            onUse={() => onUse(choice)}
            onCreateVariant={() =>
              variantChoice !== null ? onBack() : onCreateVariant(choice)
            }
            onChooseVariant={(placement) => onChooseVariant(choice, placement)}
            {...(actionLabels ? { actionLabels } : {})}
            testID={`movement-suggestion-result-${choice.movement.id}`}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    flexShrink: 1,
    backgroundColor: colors.background,
    borderRadius: PANEL_RADIUS,
    padding: PANEL_PADDING,
    gap: PANEL_PADDING,
    shadowColor: colors.textPrimary,
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  message: {
    fontFamily: "Inter_400Regular",
    fontWeight: "400",
    fontSize: 13,
    lineHeight: 17,
    color: colors.danger,
    paddingHorizontal: 6,
  },
  list: {
    flexGrow: 0,
    flexShrink: 1,
  },
  listContent: {
    gap: PANEL_PADDING,
  },
  backFrame: {
    height: BACK_FRAME_HEIGHT,
    borderRadius: fixedRadii[12],
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSubtle,
    justifyContent: "center",
    paddingHorizontal: 10,
  },
});
