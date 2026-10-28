import { Pressable, StyleSheet, Text, View } from "react-native";

import { decodeInstructionSteps } from "@/domain/activities/instructionSteps";
import { strings } from "@/shared/i18n";
import { colors, fixedRadii, minTouchTarget } from "@/shared/ui/tokens";

import type { MovementChoice } from "./ActivityDefinitionService";
import { MediaPreview, firstMediaPreviewSource, useMediaUriResolver } from "./MediaPreview";
import { fillTemplate } from "./movementChoicePresentation";

/** PRE-7 (R-5, C02, MFN-07 l.371) : sens d'insertion d'une variante — Plus facile / Plus difficile. */
export type VariantPlacement = "BEFORE_ORIGIN" | "AFTER_ORIGIN";

/**
 * Valeurs du composant « Carte — Mouvement — Résultat » `10199:22268` (relevé du 25/10,
 * `releve-composants.json` ; DSF l.103 et l.110) : composant distinct de 338 × 107 (hauteur
 * minimale ici, le texte agrandi grandit ; le gabarit 80 de la carte simple ne s'applique pas) ;
 * photo 57 ; nom 15, description 12, niveau 12, actions 13 ; bouton « Utiliser ce mouvement » 26
 * de haut ; zone tactile de « Créer une variante » 44. Fond et contour : liaisons
 * `VariableID:2290:56` et `color/cards/border`, rapprochées des jetons existants (`surfaceSubtle`,
 * `border`) sans en créer. Couleur du bouton et marges : lues sur les captures `9882:19049` et
 * `10140:20180`, valeurs de rendu. Constantes locales : `tokens.ts` inchangé.
 */
const CARD_MIN_HEIGHT = 107;
const PHOTO = 57;
const PHOTO_RADIUS = 10;
const PHOTO_FILL = "#DEE2EC";
const PADDING = 8;
const USE_BUTTON_HEIGHT = 26;
const SECONDARY_TEXT = "#7A7A80";
/** Sous-choix de la variante (`10140:20180`) : retrait sous « Créer une variante ». */
const SUB_CHOICE_INDENT = 16;

export type MovementResultCardProps = {
  readonly choice: MovementChoice;
  /** Sous-choix Plus facile / Plus difficile déployés (après « Créer une variante »). */
  readonly variantExpanded?: boolean;
  /** « Utiliser ce mouvement » : reprise du mouvement RÉELLEMENT choisi. */
  readonly onUse: () => void;
  /** « Créer une variante » : déploie les deux sens (choix explicite, rien n'est créé). */
  readonly onCreateVariant: () => void;
  readonly onChooseVariant: (placement: VariantPlacement) => void;
  /**
   * Recette A/B B.10 (remarque 6) : libellés des deux actions propres à l'appelant (fiche Mouvement :
   * « Ajouter un niveau » / « Ouvrir ce mouvement ») ; absent : libellés de l'éditeur d'Exercice.
   */
  readonly actionLabels?: MovementResultActionLabels;
  readonly testID: string;
};

/** Libellés des deux actions internes d'une carte Résultat. */
export type MovementResultActionLabels = { readonly createVariant: string; readonly useMovement: string };

/**
 * PRE-7 story R-5 (D-445 C02, v7 §6 R04 ; `10199:22268`, `9882:19049`, `10140:20180`) — un résultat
 * représente un MOUVEMENT, pas un exercice paramétré : photo (premier média, rendu du Catalogue,
 * à défaut le gabarit gris), nom tel que saisi (jamais normalisé, v7 l.158), « Niveau N » (rang
 * dérivé, absent sans groupe, C06), description sur deux lignes et deux actions internes :
 * « Créer une variante » (texte bleu, à gauche) et « Utiliser ce mouvement » (bouton, à droite).
 * Aucune sélection radio, aucune action globale. Déployée, la carte montre les deux sens de la
 * variante ; le choix d'un sens est le rattachement explicite (MFN-05).
 */
export function MovementResultCard({
  choice,
  variantExpanded = false,
  onUse,
  onCreateVariant,
  onChooseVariant,
  actionLabels,
  testID,
}: MovementResultCardProps) {
  const t = strings.screens.activities.editor.movementSuggestion;
  const createVariantLabel = actionLabels?.createVariant ?? t.createVariant;
  const useMovementLabel = actionLabels?.useMovement ?? t.useMovement;
  const resolveUri = useMediaUriResolver();
  const { movement } = choice;
  const preview = firstMediaPreviewSource(movement.media);
  const description = decodeInstructionSteps(movement.description).join(" ");
  const level = choice.level !== null ? fillTemplate(t.level, { rank: String(choice.level.rank) }) : null;
  const summary = [movement.name, level, description].filter((part) => part !== null && part.length > 0).join(", ");

  return (
    <View style={styles.card} testID={testID}>
      <View style={styles.main} accessible accessibilityLabel={summary} testID={`${testID}-summary`}>
        <View
          style={styles.photo}
          accessible={false}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          testID={`${testID}-photo`}
        >
          {preview ? (
            <MediaPreview
              uri={resolveUri(preview.uri)}
              isVideo={preview.isVideo}
              imageStyle={styles.photoFill}
              fallbackStyle={styles.photoFill}
              imageTestID={`${testID}-photo-image`}
              fallbackTestID={`${testID}-photo-fallback`}
            />
          ) : null}
        </View>
        <View style={styles.texts}>
          <View style={styles.titleRow}>
            <Text style={styles.name} numberOfLines={1} testID={`${testID}-name`}>
              {movement.name}
            </Text>
            {level !== null ? (
              <Text style={styles.level} testID={`${testID}-level`}>
                {level}
              </Text>
            ) : null}
          </View>
          {description.length > 0 ? (
            <Text style={styles.description} numberOfLines={2} testID={`${testID}-description`}>
              {description}
            </Text>
          ) : null}
        </View>
      </View>
      <View style={styles.actions}>
        <Pressable
          onPress={onCreateVariant}
          accessibilityRole="button"
          accessibilityLabel={`${createVariantLabel}, ${movement.name}`}
          accessibilityState={{ expanded: variantExpanded }}
          hitSlop={(minTouchTarget - ACTION_LABEL.lineHeight) / 2}
          style={styles.variantAction}
          testID={`${testID}-variant`}
        >
          <Text style={styles.variantLabel}>{createVariantLabel}</Text>
        </Pressable>
        <Pressable
          onPress={onUse}
          accessibilityRole="button"
          accessibilityLabel={`${useMovementLabel}, ${movement.name}`}
          hitSlop={(minTouchTarget - USE_BUTTON_HEIGHT) / 2}
          style={styles.useButton}
          testID={`${testID}-use`}
        >
          <Text style={styles.useLabel}>{useMovementLabel}</Text>
        </Pressable>
      </View>
      {variantExpanded ? (
        <View style={styles.subChoices}>
          <SubChoice label={t.easier} onPress={() => onChooseVariant("BEFORE_ORIGIN")} testID={`${testID}-easier`} />
          <SubChoice label={t.harder} onPress={() => onChooseVariant("AFTER_ORIGIN")} testID={`${testID}-harder`} />
        </View>
      ) : null}
    </View>
  );
}

function SubChoice({ label, onPress, testID }: { label: string; onPress: () => void; testID: string }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label} style={styles.subChoice} testID={testID}>
      {/* Marque de hiérarchie de `10140:20180` (angle fin), décorative. */}
      <View style={styles.subChoiceMark} accessible={false} importantForAccessibility="no" />
      <Text style={styles.variantLabel}>{label}</Text>
    </Pressable>
  );
}

const ACTION_LABEL = { fontFamily: "Inter_500Medium", fontWeight: "500", fontSize: 13, lineHeight: 16 } as const;

const styles = StyleSheet.create({
  card: {
    minHeight: CARD_MIN_HEIGHT,
    borderRadius: fixedRadii[12],
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceSubtle,
    padding: PADDING,
    gap: PADDING,
  },
  main: {
    flexDirection: "row",
    gap: 12,
  },
  photo: {
    width: PHOTO,
    height: PHOTO,
    borderRadius: PHOTO_RADIUS,
    backgroundColor: PHOTO_FILL,
    overflow: "hidden",
  },
  photoFill: {
    width: PHOTO,
    height: PHOTO,
    backgroundColor: PHOTO_FILL,
  },
  texts: {
    flex: 1,
    gap: 2,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 8,
  },
  name: {
    flex: 1,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
    fontSize: 15,
    lineHeight: 18,
    color: colors.textPrimary,
  },
  level: {
    fontFamily: "Inter_500Medium",
    fontWeight: "500",
    fontSize: 12,
    lineHeight: 16,
    color: colors.textPrimary,
  },
  description: {
    fontFamily: "Inter_400Regular",
    fontWeight: "400",
    fontSize: 12,
    lineHeight: 16,
    color: SECONDARY_TEXT,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  variantAction: {
    minHeight: ACTION_LABEL.lineHeight,
    justifyContent: "center",
  },
  variantLabel: {
    ...ACTION_LABEL,
    color: colors.primary,
  },
  useButton: {
    height: USE_BUTTON_HEIGHT,
    borderRadius: USE_BUTTON_HEIGHT / 2,
    paddingHorizontal: 8,
    justifyContent: "center",
    backgroundColor: colors.selectionSurface,
  },
  useLabel: {
    ...ACTION_LABEL,
    color: colors.primary,
  },
  subChoices: {
    paddingLeft: SUB_CHOICE_INDENT,
  },
  subChoice: {
    minHeight: minTouchTarget,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  subChoiceMark: {
    width: 8,
    height: 10,
    marginTop: -8,
    borderLeftWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
});
