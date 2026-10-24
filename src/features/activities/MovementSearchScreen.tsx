import { useEffect, useRef, useState } from "react";
import { FlatList, Modal, StyleSheet, Text, TextInput, View, useWindowDimensions } from "react-native";

import { strings } from "@/shared/i18n";
import { FixedHeader, ScreenShell } from "@/shared/ui/ScreenShell";
import { colors, fixedRadii } from "@/shared/ui/tokens";

import type { ActivityDefinitionService, MovementChoice } from "./ActivityDefinitionService";
import { EDITOR_HEADER, editorSideMargin } from "./ActivityEditorForm";
import { MovementChoiceCard } from "./MovementChoiceCard";

export type MovementSearchScreenProps = {
  readonly service: ActivityDefinitionService;
  /** Sélection d'un résultat : reprise du geste RÉELLEMENT choisi (relevé du 23/10). */
  readonly onSelect: (choice: MovementChoice) => void;
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
 * PRE-7 story A2.3 (MFN-04, MFN-06, D-439 ; CE-T03-04 §11 ; `9959:19623`) — recherche explicite
 * d'un geste, accessible indépendamment de la similarité du nom : TOUS les gestes disponibles,
 * locaux compris (`searchMovements`, nom normalisé contenant la saisie). Recherche spécialisée de
 * l'éditeur, pas un Catalogue de gestes ni une recherche des listes Catalogue (D-221 inchangée).
 * État d'écran de CE-T03-04, sans nouvelle destination de navigation : `Modal` native plein écran
 * au-dessus de l'éditeur, dont le brouillon reste monté et intact. Champ : `TextInput` natif.
 * Aucun texte d'état vide n'est documenté : une recherche sans résultat affiche la liste vide.
 */
export function MovementSearchScreen({ service, onSelect, onClose }: MovementSearchScreenProps) {
  const t = strings.screens.activities.editor.movementSearch;
  const sideMargin = editorSideMargin(useWindowDimensions().width);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<readonly MovementChoice[]>([]);
  // Seule la réponse à la DERNIÈRE saisie est affichée (réponses hors d'ordre ignorées).
  const requestRef = useRef(0);

  useEffect(() => {
    const request = requestRef.current + 1;
    requestRef.current = request;
    service.searchMovements(query).then(
      (found) => {
        if (requestRef.current === request) setResults(found);
      },
      (error: unknown) => {
        console.error("La recherche des gestes a échoué.", error);
        if (requestRef.current === request) setResults([]);
      },
    );
  }, [service, query]);

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
                onChangeText={setQuery}
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
          renderItem={({ item }) => (
            <MovementChoiceCard
              choice={item}
              variant="result"
              onPress={() => onSelect(item)}
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
});
