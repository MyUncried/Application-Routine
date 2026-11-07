import { Pressable, StyleSheet, Text, View } from "react-native";

import { decodeInstructionSteps } from "@/domain/activities/instructionSteps";
import { strings } from "@/shared/i18n";
import { colors, fixedRadii } from "@/shared/ui/tokens";

import type { MovementChoice } from "./ActivityDefinitionService";
import { MediaPreview, firstMediaPreviewSource, useMediaUriResolver } from "./MediaPreview";
import { fillTemplate } from "./movementChoicePresentation";

/** PRE-7 (R-5, C02, MFN-07 l.371) : sens d'insertion d'une variante — Plus facile / Plus difficile. */
export type VariantPlacement = "BEFORE_ORIGIN" | "AFTER_ORIGIN";

/**
 * PRE-9 CAT.2 (CE-MVT-RESULT-01, spécification « Résultats de recherche des Mouvements — PRE-9 » du
 * 30/10/2026 ; Figma `10199:22268` Résultat, `10895:19870` Composition, relevé MCP en lecture seule
 * de `10415:21959` et `10175:20369`). Coordonnées du composant (bord extérieur) :
 * - carte 338 × 73, contour 0,5 `color/cards/border` (#CCD1E0), fond `surfaceSubtle`, rayon 12 ;
 * - photo 57 à (8, 8), rayon 12 ; nom Semi Bold 15 à (77, 11), bord droit à 74 du bord de la carte ;
 *   « Niveau N » Medium 12, bord droit à 8, centré à y = 20 ; description Regular 12/16 à (77, 33),
 *   deux lignes au plus, « … » ;
 * - Résultat : description de 179 (bord droit à 82) ; « Ajouter un niveau » 66 × 32 à x = 264,
 *   deux lignes Medium 13/16 alignées à droite, bas aligné sur la fin de la description (y = 65) ;
 *   zone tactile 78 × 36 à (258, 31) ;
 * - Composition : description de 253 (bord droit à 8), aucun bouton ;
 * - carte dépliée (« Niveau, plus facile ou plus difficile », `10415:21939`) : 338 × 104, marges
 *   verticales 8 ; « Plus facile » 64 × 28 à (90,5 ; 68), « Plus difficile » à (183,5 ; 68), hauteur
 *   28 ; séparateur 1,5 × 12 à (166,5 ; 74,5).
 * Les décalages internes sont exprimés depuis le bord intérieur du contour (0,5). Constantes
 * locales : `tokens.ts` inchangé (contrat gelé).
 */
const BORDER = 0.5;
const CARD_HEIGHT = 73;
const EXPANDED_HEIGHT = 104;
const CARD_BORDER_COLOR = "#CCD1E0";
const CARD_RADIUS = fixedRadii[12];
const PADDING = 8 - BORDER;
const PHOTO = 57;
const PHOTO_RADIUS = 12;
const PHOTO_FILL = "#DEE2EC";
const PHOTO_TEXT_GAP = 12;
const TEXT_TOP = 11 - 8;
const NAME_LINE = 18;
const DESCRIPTION_TOP = 33 - 11 - NAME_LINE;
const SECONDARY_TEXT = "#7A7A80";
/** Bord droit du nom (74) et de la description Résultat (82) depuis le bord de la carte. */
const NAME_RIGHT = 74;
const RESULT_DESCRIPTION_RIGHT = 82;
const COMPOSITION_DESCRIPTION_RIGHT = 8;
const LEVEL_RIGHT = 8;
const LEVEL_WIDTH = 58;
const LEVEL_LINE = 16;
const LEVEL_CENTER = 20;
/** « Ajouter un niveau » : 66 × 32 à x = 264, bord droit à 8 ; zone tactile 78 × 36 à (258, 31). */
const ADD_LEVEL_WIDTH = 66;
const ADD_LEVEL_HEIGHT = 32;
const ADD_LEVEL_TOUCH_WIDTH = 78;
const ADD_LEVEL_TOUCH_HEIGHT = 36;
const ADD_LEVEL_TOUCH_TOP = 31;
const ADD_LEVEL_TOUCH_RIGHT = 338 - 258 - ADD_LEVEL_TOUCH_WIDTH;
/** Quatrième ligne de la carte dépliée. */
const OPTION_TOP = 68;
const OPTION_HEIGHT = 28;
const EASIER_X = 90.5;
const EASIER_WIDTH = 64;
const HARDER_X = 183.5;
const SEPARATOR_X = 166.5;
const SEPARATOR_Y = 74.5;
const SEPARATOR_WIDTH = 1.5;
const SEPARATOR_HEIGHT = 12;

/** Valeurs nominales exportées pour le filet de famille du panneau (centres des cartes). */
export const MOVEMENT_RESULT_CARD_HEIGHT = CARD_HEIGHT;
export const MOVEMENT_RESULT_CARD_EXPANDED_HEIGHT = EXPANDED_HEIGHT;

/** Libellés des actions d'une carte Résultat. */
export type MovementResultActionLabels = {
  /** « Ajouter un niveau » (nom accessible ; affiché sur deux lignes). */
  readonly createVariant: string;
  /** Action du toucher de la carte (indication VoiceOver), p. ex. « Ouvrir ce mouvement ». */
  readonly useMovement: string;
};

type CardContent = {
  readonly name: string;
  readonly level: string | null;
  readonly description: string;
  readonly summary: string;
  readonly preview: ReturnType<typeof firstMediaPreviewSource>;
};

function useCardContent(choice: MovementChoice): CardContent {
  const t = strings.screens.activities.editor.movementSuggestion;
  const { movement } = choice;
  const description = decodeInstructionSteps(movement.description).join(" ");
  const level = choice.level !== null ? fillTemplate(t.level, { rank: String(choice.level.rank) }) : null;
  const summary = [movement.name, level, description].filter((part) => part !== null && part.length > 0).join(", ");
  return { name: movement.name, level, description, summary, preview: firstMediaPreviewSource(movement.media) };
}

/** Photo, nom et description (communs aux deux variantes), dans la zone du toucher de la carte. */
function CardBody({ content, descriptionRight, testID }: { content: CardContent; descriptionRight: number; testID: string }) {
  const resolveUri = useMediaUriResolver();
  return (
    <>
      <View
        style={styles.photo}
        accessible={false}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        testID={`${testID}-photo`}
      >
        {content.preview ? (
          <MediaPreview
            uri={resolveUri(content.preview.uri)}
            isVideo={content.preview.isVideo}
            imageStyle={styles.photoFill}
            fallbackStyle={styles.photoFill}
            imageTestID={`${testID}-photo-image`}
            fallbackTestID={`${testID}-photo-fallback`}
          />
        ) : null}
      </View>
      {/* Colonne de texte jusqu'au bord droit de la description ; le nom s'étend jusqu'à 74 du bord. */}
      <View style={[styles.texts, { marginRight: descriptionRight - PADDING - BORDER }]}>
        <Text style={[styles.name, { marginRight: NAME_RIGHT - descriptionRight }]} numberOfLines={1} testID={`${testID}-name`}>
          {content.name}
        </Text>
        {content.description.length > 0 ? (
          <Text
            style={styles.description}
            numberOfLines={2}
            ellipsizeMode="tail"
            testID={`${testID}-description`}
          >
            {content.description}
          </Text>
        ) : null}
      </View>
    </>
  );
}

function LevelLabel({ level, testID }: { level: string | null; testID: string }) {
  if (level === null) return null;
  return (
    <Text
      style={styles.level}
      numberOfLines={1}
      accessible={false}
      importantForAccessibility="no"
      testID={`${testID}-level`}
    >
      {level}
    </Text>
  );
}

export type MovementResultCardProps = {
  readonly choice: MovementChoice;
  /**
   * État « Niveau, plus facile ou plus difficile » (`10415:21939`) : la même carte, dépliée à
   * 338 × 104, porte la quatrième ligne « Plus facile | Plus difficile ».
   */
  readonly variantExpanded?: boolean;
  /** « Ajouter un niveau » : déploie (ou replie) le choix du sens ; rien n'est créé. */
  readonly onCreateVariant: () => void;
  readonly onChooseVariant: (placement: VariantPlacement) => void;
  /** Libellés propres à l'appelant ; absent : ceux de la fiche Mouvement. */
  readonly actionLabels?: MovementResultActionLabels;
  /** Toucher du corps de la carte : ouvre le mouvement. Demande de Hermann du 05/11/2026 (soir) : « catalogue des mouvements : saisie du nom : appui sur une carte. Rien ne se passe, on devrait pourtant charger le mouvement. » [Corps de la carte Résultat non activable (décision du 30/10/2026) — remplacé.] */
  readonly onOpen?: () => void;
  readonly testID: string;
};

/**
 * PRE-9 CAT.2 — composant « Carte — Mouvement — Résultat » (`10199:22268`), résultats du parcours
 * « Créer un Mouvement » : photo, nom, « Niveau N », description sur 179 pt et une seule action
 * visible, « Ajouter un niveau », à droite sur deux lignes. Aucun bouton « Utiliser » ni « Utiliser
 * ce mouvement » (CE-MVT-RESULT-01). Décision de Hermann du 30/10/2026 : « À partir du catalogue
 * des mouvements, cette option n'est pas utile, seul la création d'un niveau est une action
 * pertinente » — le corps de la carte n'est pas activable. Dépliée (`10415:21939`), la carte reste
 * unique et ajoute la ligne « Plus facile | Plus difficile » ; ni second cadre ni symbole
 * d'arborescence.
 */
export function MovementResultCard({
  choice,
  variantExpanded = false,
  onCreateVariant,
  onChooseVariant,
  actionLabels,
  onOpen,
  testID,
}: MovementResultCardProps) {
  const t = strings.screens.activities.editor.movementSuggestion;
  const labels = actionLabels ?? strings.screens.movement.suggestion;
  const content = useCardContent(choice);

  return (
    <View style={[styles.card, styles.resultShadow, variantExpanded ? styles.cardExpanded : null]} testID={testID}>
      {/* Corps : ouvre le mouvement quand l'appelant le permet (demande de Hermann du 05/11/2026, soir) ; « Ajouter un niveau »
          garde sa zone. [Corps non activable (décision du 30/10/2026) — remplacé.] */}
      <Pressable
        onPress={onOpen}
        disabled={onOpen === undefined}
        style={[styles.body, variantExpanded ? styles.bodyExpanded : null]}
        accessible
        accessibilityRole={onOpen !== undefined ? "button" : undefined}
        accessibilityLabel={content.summary}
        testID={`${testID}-summary`}
      >
        <CardBody content={content} descriptionRight={RESULT_DESCRIPTION_RIGHT} testID={testID} />
      </Pressable>
      <LevelLabel level={content.level} testID={testID} />
      <Pressable
        onPress={onCreateVariant}
        accessibilityRole="button"
        accessibilityLabel={`${labels.createVariant}, ${content.name}`}
        accessibilityState={{ expanded: variantExpanded }}
        style={styles.addLevelTouch}
        testID={`${testID}-variant`}
      >
        <Text style={styles.addLevelLabel} numberOfLines={2} testID={`${testID}-variant-label`}>
          {t.addLevelTwoLines}
        </Text>
      </Pressable>
      {variantExpanded ? (
        <View style={styles.options} testID={`${testID}-options`}>
          <Pressable
            onPress={() => onChooseVariant("BEFORE_ORIGIN")}
            accessibilityRole="button"
            accessibilityLabel={t.easier}
            style={[styles.option, styles.easier]}
            testID={`${testID}-easier`}
          >
            <Text style={styles.optionLabel} numberOfLines={1}>
              {t.easier}
            </Text>
          </Pressable>
          <View
            style={styles.separator}
            accessible={false}
            importantForAccessibility="no"
            testID={`${testID}-options-separator`}
          />
          <Pressable
            onPress={() => onChooseVariant("AFTER_ORIGIN")}
            accessibilityRole="button"
            accessibilityLabel={t.harder}
            style={[styles.option, styles.harder]}
            testID={`${testID}-harder`}
          >
            <Text style={styles.optionLabel} numberOfLines={1}>
              {t.harder}
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

export type MovementCompositionCardProps = {
  readonly choice: MovementChoice;
  /**
   * Toucher de la carte : utilisation du Mouvement existant (effet de l'ancien « Utiliser ce
   * mouvement » : reprise, sans doublon). Décision de Hermann du 30/10/2026 : « l'utilisateur doit
   * simplement appuyer sur la carte pour l'utiliser ». Absent : carte non activable.
   */
  readonly onPress?: () => void;
  /** Indication VoiceOver de l'action du toucher (p. ex. « Utiliser ce mouvement »). */
  readonly actionHint?: string;
  readonly testID: string;
};

/**
 * PRE-9 CAT.2 — composant commun « Carte — Mouvement — Composition » (`10895:19870`) : 338 × 73,
 * **aucun bouton** (ni « Ajouter un niveau » ni « Utiliser »), description sur 253 pt, deux lignes
 * au plus, tronquée par « … ». Utilisé par la création d'un Exercice (éditeurs d'Exercice) et la
 * création d'un Mouvement depuis la Composition d'une Séance.
 */
export function MovementCompositionCard({ choice, onPress, actionHint, testID }: MovementCompositionCardProps) {
  const content = useCardContent(choice);
  // Toute la carte est un seul élément accessible (bouton) ; « Niveau N » est dans la zone du toucher.
  const body = (
    <>
      <CardBody content={content} descriptionRight={COMPOSITION_DESCRIPTION_RIGHT} testID={testID} />
      <LevelLabel level={content.level} testID={testID} />
    </>
  );
  return (
    <View style={[styles.card, styles.compositionShadow]}>
      {onPress !== undefined ? (
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={content.summary}
          {...(actionHint !== undefined ? { accessibilityHint: actionHint } : {})}
          style={({ pressed }) => [styles.body, pressed ? styles.bodyPressed : null]}
          testID={testID}
        >
          {body}
        </Pressable>
      ) : (
        <View style={styles.body} accessible accessibilityLabel={content.summary} testID={testID}>
          {body}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: CARD_HEIGHT,
    borderRadius: CARD_RADIUS,
    borderWidth: BORDER,
    borderColor: CARD_BORDER_COLOR,
    backgroundColor: colors.surfaceSubtle,
  },
  cardExpanded: {
    minHeight: EXPANDED_HEIGHT,
  },
  // Figma : ombre 0/2/5 à 8 % (Résultat), 0/2/10 à 8 % (Composition), teinte #1A1A26.
  resultShadow: {
    shadowColor: "#1A1A26",
    shadowOpacity: 0.08,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  compositionShadow: {
    shadowColor: "#1A1A26",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
  },
  body: {
    minHeight: CARD_HEIGHT - 2 * BORDER,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: PHOTO_TEXT_GAP,
    padding: PADDING,
  },
  // Retour visuel du toucher de la carte Composition (aucune valeur Figma : opacité système).
  bodyPressed: {
    opacity: 0.6,
  },
  // Dépliée : la quatrième ligne commence à y = 68, au-dessus du bas de la zone haute (73).
  bodyExpanded: {
    marginBottom: -(CARD_HEIGHT - BORDER - OPTION_TOP),
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
    paddingTop: TEXT_TOP,
  },
  name: {
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
    fontSize: 15,
    lineHeight: NAME_LINE,
    color: colors.textPrimary,
  },
  description: {
    marginTop: DESCRIPTION_TOP,
    fontFamily: "Inter_400Regular",
    fontWeight: "400",
    fontSize: 12,
    lineHeight: 16,
    color: SECONDARY_TEXT,
  },
  level: {
    position: "absolute",
    top: LEVEL_CENTER - LEVEL_LINE / 2 - BORDER,
    right: LEVEL_RIGHT - BORDER,
    width: LEVEL_WIDTH,
    textAlign: "right",
    fontFamily: "Inter_500Medium",
    fontWeight: "500",
    fontSize: 12,
    lineHeight: LEVEL_LINE,
    color: colors.textPrimary,
  },
  addLevelTouch: {
    position: "absolute",
    top: ADD_LEVEL_TOUCH_TOP - BORDER,
    right: ADD_LEVEL_TOUCH_RIGHT - BORDER,
    width: ADD_LEVEL_TOUCH_WIDTH,
    height: ADD_LEVEL_TOUCH_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  addLevelLabel: {
    width: ADD_LEVEL_WIDTH,
    height: ADD_LEVEL_HEIGHT,
    textAlign: "right",
    fontFamily: "Inter_500Medium",
    fontWeight: "500",
    fontSize: 13,
    lineHeight: 16,
    color: colors.primary,
  },
  options: {
    height: OPTION_HEIGHT,
    marginBottom: 8 - BORDER,
  },
  option: {
    position: "absolute",
    top: 0,
    height: OPTION_HEIGHT,
    justifyContent: "center",
  },
  easier: {
    left: EASIER_X - BORDER,
    width: EASIER_WIDTH,
  },
  harder: {
    left: HARDER_X - BORDER,
  },
  optionLabel: {
    fontFamily: "Inter_500Medium",
    fontWeight: "500",
    fontSize: 13,
    lineHeight: 16,
    color: colors.primary,
  },
  separator: {
    position: "absolute",
    left: SEPARATOR_X - BORDER,
    top: SEPARATOR_Y - OPTION_TOP,
    width: SEPARATOR_WIDTH,
    height: SEPARATOR_HEIGHT,
    backgroundColor: colors.primary,
  },
});
