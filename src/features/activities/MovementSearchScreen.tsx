import { useMemo, useState } from "react";
import { FlatList, Modal, Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";

import { normalizeSearchText, rankMovements, type MovementSearchContext } from "@/domain/activities/movementSuggestion";
import { strings } from "@/shared/i18n";
import { FixedHeader, ScreenShell } from "@/shared/ui/ScreenShell";
import { colors, fixedRadii, minTouchTarget } from "@/shared/ui/tokens";

import type { MovementChoice } from "./ActivityDefinitionService";
import { EDITOR_HEADER, editorSideMargin } from "./ActivityEditorForm";
import { MovementResultCard, type VariantPlacement } from "./MovementResultCard";

export type MovementSearchScreenProps = {
  /** Tous les mouvements disponibles, locaux compris, dans l'ordre de parcours du Catalogue. */
  readonly choices: readonly MovementChoice[];
  /** R03 : le nom saisi, prérempli et effaçable. */
  readonly initialQuery: string;
  /** R02 : signaux Catégorie et Zones du brouillon. */
  readonly context?: MovementSearchContext;
  /** « Utiliser ce mouvement » : reprise du mouvement RÉELLEMENT choisi. */
  readonly onUse: (choice: MovementChoice) => void;
  /** « Créer une variante » puis Plus facile / Plus difficile (C02). */
  readonly onChooseVariant: (choice: MovementChoice, placement: VariantPlacement) => void;
  /** ✕ (et retour système) : retour au brouillon appelant, intact. */
  readonly onClose: () => void;
};

/**
 * Valeurs de `9959:19623` (« Liste des gestes » `9959:19701`, relevé MCP en lecture seule du
 * 24/10) : contenu à 16 sous l'en-tête, marges 24, 10 entre éléments ; champ 44 de haut, fond
 * `#F3F4F9`, rayon 12, texte à 16 du bord, Regular 15, indication `#7A7A80` ; note Regular 13
 * `#7A7A80`. Constantes locales : `tokens.ts` inchangé.
 */
const FIELD_HEIGHT = 44;
const FIELD_FILL = "#F3F4F9";
const SECONDARY_TEXT = "#7A7A80";
const GAP = 10;

/**
 * PRE-7 story A2.3 (MFN-04, MFN-06, D-439 ; CE-T03-04 §11) puis R-5 (v7 §6 R03-R05) — recherche
 * explicite d'un mouvement, accessible même lorsqu'aucun mouvement n'atteint les seuils. Une seule
 * liste, dont le contenu dépend de la requête (R03, « il n'existe pas de liste filtrée coexistant
 * avec une zone tous les mouvements ») :
 * - requête renseignée : résultats listés (R02 ≥ 0,45), classés par pertinence décroissante, un
 *   par mouvement, nom ou alias (R05) ;
 * - requête renseignée sans résultat : l'absence est annoncée, avec « Voir tous les mouvements »,
 *   qui vide la requête ;
 * - requête vide : tous les mouvements, dans l'ordre de parcours du Catalogue
 *   (`listMovementChoices`), mouvements sans exercice compris (v7 l.27).
 * Résultats : cartes `10199:22268` à deux actions (R04), la variante se déployant dans sa carte.
 * La représentation de l'écran n'est pas relevée (DSF l.41, « représentation courante manquante ») :
 * en-tête, champ et note de `9959:19623`, désormais catalogue d'entretien, réutilisés (NON
 * VÉRIFIABLE). `Modal` native plein écran au-dessus de l'éditeur, dont le brouillon reste monté.
 */
export function MovementSearchScreen({ choices, initialQuery, context, onUse, onChooseVariant, onClose }: MovementSearchScreenProps) {
  const t = strings.screens.activities.editor.movementSearch;
  const sideMargin = editorSideMargin(useWindowDimensions().width);
  const [query, setQuery] = useState(initialQuery);
  const [variantOf, setVariantOf] = useState<string | null>(null);
  const isQueryEmpty = normalizeSearchText(query).length === 0;
  const results = useMemo(() => {
    if (normalizeSearchText(query).length === 0) return choices;
    const byId = new Map(choices.map((choice) => [choice.movement.id, choice]));
    return rankMovements(
      query,
      choices.map((choice) => choice.movement),
      context,
    )
      .map((result) => byId.get(result.id))
      .filter((choice): choice is MovementChoice => choice !== undefined);
  }, [query, choices, context]);

  return (
    <Modal visible animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <ScreenShell>
        <FixedHeader
          title={t.title}
          onBack={onClose}
          backAccessibilityLabel={t.closeAccessibilityLabel}
          closeIcon
          horizontalPadding={sideMargin}
          layoutStyle={{ paddingLeft: EDITOR_HEADER.paddingLeft, gap: EDITOR_HEADER.gap }}
          backCircleStyle={EDITOR_HEADER.backCircle}
          titleStyle={EDITOR_HEADER.title}
          backIconTintColor={EDITOR_HEADER.closeIconTint}
        />
        <FlatList
          data={results}
          keyExtractor={(choice) => choice.movement.id}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerStyle={[styles.content, { paddingHorizontal: sideMargin }]}
          ItemSeparatorComponent={Separator}
          ListHeaderComponent={
            <View style={styles.header}>
              <TextInput
                value={query}
                onChangeText={(text) => {
                  setQuery(text);
                  setVariantOf(null);
                }}
                placeholder={t.placeholder}
                placeholderTextColor={SECONDARY_TEXT}
                accessibilityLabel={t.placeholder}
                autoCorrect={false}
                autoCapitalize="none"
                returnKeyType="search"
                clearButtonMode="while-editing"
                style={styles.field}
                testID="movement-search-input"
              />
              <Text style={styles.note} testID="movement-search-note">
                {t.localNote}
              </Text>
            </View>
          }
          ListEmptyComponent={
            isQueryEmpty ? null : (
              <View style={styles.empty} testID="movement-search-empty">
                <Text style={styles.emptyMessage} accessibilityLiveRegion="polite">
                  {t.noResult}
                </Text>
                <Pressable
                  onPress={() => {
                    setQuery("");
                    setVariantOf(null);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={t.showAll}
                  hitSlop={(minTouchTarget - LINK_LINE_HEIGHT) / 2}
                  style={styles.showAll}
                  testID="movement-search-show-all"
                >
                  <Text style={styles.showAllLabel}>{t.showAll}</Text>
                </Pressable>
              </View>
            )
          }
          renderItem={({ item }) => (
            <MovementResultCard
              choice={item}
              variantExpanded={variantOf === item.movement.id}
              onUse={() => onUse(item)}
              onCreateVariant={() => setVariantOf((current) => (current === item.movement.id ? null : item.movement.id))}
              onChooseVariant={(placement) => onChooseVariant(item, placement)}
              testID={`movement-search-result-${item.movement.id}`}
            />
          )}
          testID="movement-search-list"
        />
      </ScreenShell>
    </Modal>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}

const LINK_LINE_HEIGHT = 18;

const styles = StyleSheet.create({
  content: {
    paddingTop: 16,
    paddingBottom: 24,
  },
  header: {
    gap: GAP,
    marginBottom: GAP,
  },
  field: {
    minHeight: FIELD_HEIGHT,
    borderRadius: fixedRadii[12],
    backgroundColor: FIELD_FILL,
    paddingHorizontal: 16,
    fontFamily: "Inter_400Regular",
    fontSize: 15,
    color: colors.textPrimary,
  },
  note: {
    fontFamily: "Inter_400Regular",
    fontWeight: "400",
    fontSize: 13,
    lineHeight: 16,
    color: SECONDARY_TEXT,
  },
  separator: {
    height: GAP,
  },
  empty: {
    gap: GAP,
    paddingTop: GAP,
  },
  emptyMessage: {
    fontFamily: "Inter_400Regular",
    fontWeight: "400",
    fontSize: 15,
    lineHeight: 18,
    color: colors.textPrimary,
  },
  showAll: {
    alignSelf: "flex-start",
    minHeight: LINK_LINE_HEIGHT,
    justifyContent: "center",
  },
  showAllLabel: {
    fontFamily: "Inter_500Medium",
    fontWeight: "500",
    fontSize: 15,
    lineHeight: LINK_LINE_HEIGHT,
    color: colors.primary,
  },
});
