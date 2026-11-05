import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View, type LayoutChangeEvent } from "react-native";

import { strings } from "@/shared/i18n";
import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import { colors, fixedRadii } from "@/shared/ui/tokens";

import type { MovementChoice } from "./ActivityDefinitionService";
import { familyOfChoice } from "./movementFamilyGrouping";
import {
  MOVEMENT_RESULT_CARD_HEIGHT,
  MovementCompositionCard,
  MovementResultCard,
  type MovementResultActionLabels,
  type VariantPlacement,
} from "./MovementResultCard";

/**
 * PRE-9 CAT.2 (CE-MVT-RESULT-01 ; relevé MCP en lecture seule de `10415:21733`, `10175:20369` et
 * `10415:21959`) — panneau « Résultats de la recherche », 354 de large pour des cartes de 338 :
 * fond blanc, contour 1 `#E3E8F0`, rayon 12, ombre 0/8/20 à 10 % ; cartes à 8 du bord (7 sous le
 * contour) ; 14 au-dessus de la première carte et sous la dernière ; 4 entre deux cartes d'une même
 * famille, 8 sinon (cinq résultats : 14 + 5 × 73 + 4 + 3 × 8 + 14 = 421) ; message Medium 12
 * `#D92D20` à (14, 12), 12 au-dessus des cartes ; état de choix du sens : cadre de retour 338 × 36
 * à 14 du haut, 10 au-dessus de la carte dépliée (14 + 36 + 10 + 104 + 14 = 178). Filet « groupe de
 * niveaux » : x = 3, largeur 2, rayon 1, `rgba(5, 8, 229, 0.35)`, du centre vertical de la première
 * à celui de la dernière carte affichée de la famille. Constantes locales : `tokens.ts` inchangé.
 */
const PANEL_BORDER = 1;
const PANEL_BORDER_COLOR = "#E3E8F0";
const PANEL_RADIUS = fixedRadii[12];
const CARD_INSET = 8 - PANEL_BORDER;
const LIST_EDGE = 14 - PANEL_BORDER;
const MESSAGE_TOP = 12 - PANEL_BORDER;
const MESSAGE_INSET = 14 - PANEL_BORDER;
const MESSAGE_TO_CARDS = 12;
const BACK_FRAME_HEIGHT = 36;
const BACK_TO_CARD = 10;
const FAMILY_GAP = 4;
const CARD_GAP = 8;
const RAIL_X = 3 - PANEL_BORDER;
const RAIL_WIDTH = 2;
const RAIL_COLOR = "rgba(5, 8, 229, 0.35)";

/**
 * Message d'unicité : texte simple, ou texte dont un mot est mis en gras (recette iPhone du 29/10/2026 :
 * « Un mouvement **archivé** porte déjà ce nom. »).
 */
export type MovementNameMessage = string | { readonly before: string; readonly bold: string; readonly after: string };

/**
 * PRE-9 CAT.2 : variante de carte des résultats. `"result"` — « Carte — Mouvement — Résultat »,
 * parcours « Créer un Mouvement » (Catalogue des Mouvements) ; `"composition"` — « Carte — Mouvement
 * — Composition », sans bouton, depuis la Composition d'une Séance / la création d'un Exercice.
 */
export type MovementResultCardVariant = "result" | "composition";

export type MovementSuggestionPanelProps = {
  /** Message d'unicité (C01) au-dessus des cartes ; `null` : aucun. */
  readonly message: MovementNameMessage | null;
  /**
   * Résultats affichés, déjà classés ; figés pendant un appui par l'appelant. Contre-recette du
   * 30/10 : plus de limite à cinq (R04 remplacé) — la liste défile dans la hauteur de l'hôte.
   */
  readonly results: readonly MovementChoice[];
  /**
   * Variante de carte (CAT.2) ; défaut `"result"`. La carte Résultat suppose `onCreateVariant` ;
   * sans lui, la carte Composition est rendue.
   */
  readonly cardVariant?: MovementResultCardVariant;
  /** Mouvement dont le sens du nouveau Niveau est en cours de choix (`10415:21939`) ; `null` : liste. */
  readonly variantOf: string | null;
  /**
   * Toucher d'une carte Composition : utilisation du Mouvement existant, sans doublon (décision de
   * Hermann du 30/10/2026). Les cartes Résultat (Catalogue) n'ont aucune action de réutilisation.
   */
  readonly onUse: (choice: MovementChoice) => void;
  /** « Ajouter un niveau » (carte Résultat) ; absent : carte Composition. */
  readonly onCreateVariant?: (choice: MovementChoice) => void;
  /** Carte Résultat : toucher du corps — ouvre le mouvement (demande de Hermann du 05/11/2026, soir). */
  readonly onOpenResult?: (choice: MovementChoice) => void;
  readonly onChooseVariant: (choice: MovementChoice, placement: VariantPlacement) => void;
  /** Cadre de retour : revient à la liste, sans choix. */
  readonly onBack: () => void;
  /** Doigt posé sur le panneau (R04 : « l'ordre ne change pas pendant un appui »). */
  readonly onTouchingChange: (touching: boolean) => void;
  /** Libellés (nom accessible d'« Ajouter un niveau », indication VoiceOver du toucher de carte). */
  readonly actionLabels?: MovementResultActionLabels;
};

const familyOf = familyOfChoice;

/**
 * Suites de cartes CONSÉCUTIVES d'une même famille (au moins deux), dans l'ordre affiché :
 * `[première, dernière]`. [Remplacé par la clarification de Hermann du 30/10/2026 : « des membres
 * séparés par un autre résultat forment des suites distinctes » ne se produit plus — les résultats
 * sont regroupés par famille en amont (`groupResultsByFamily`), une famille = une seule suite.]
 */
export function familyRuns(results: readonly MovementChoice[]): readonly (readonly [number, number])[] {
  const runs: [number, number][] = [];
  let start = 0;
  for (let index = 1; index <= results.length; index += 1) {
    const family = familyOf(results[start]!);
    const current = index < results.length ? familyOf(results[index]!) : null;
    if (family === null || current !== family) {
      if (family !== null && index - 1 > start) runs.push([start, index - 1]);
      start = index;
    }
  }
  return runs;
}

type CardFrame = { readonly y: number; readonly height: number };

/**
 * PRE-7 story R-5 puis PRE-9 CAT.2 (CE-MVT-RESULT-01) — panneau superposé sous le nom, clavier
 * visible, rendu par l'éditeur (`ActivityEditorForm`, prop `nameAssist`). Il porte :
 * - le message rouge « nom déjà utilisé » (`10175:20349`, `10415:21814`), affiché dès la frappe ;
 * - les cartes, toutes (contre-recette du 30/10), dans l'ordre du classement existant : carte
 *   Résultat (« Ajouter un niveau » seul, aucun « Utiliser ») ou carte Composition (aucun bouton) ;
 *   le toucher d'une carte Composition utilise le Mouvement ; Entrée ne sélectionne jamais ;
 * - le filet bleu des familles, de centre à centre des cartes consécutives d'un même groupe ;
 * - après « Ajouter un niveau », la seule carte d'origine, dépliée (« Plus facile | Plus
 *   difficile »), sous un cadre de retour (`10415:21939`).
 * Sans résultat, le message seul.
 */
export function MovementSuggestionPanel({
  message,
  results,
  cardVariant = "result",
  variantOf,
  onUse,
  onOpenResult,
  onCreateVariant,
  onChooseVariant,
  onBack,
  onTouchingChange,
  actionLabels,
}: MovementSuggestionPanelProps) {
  const t = strings.screens.activities.editor.movementSuggestion;
  const isResult = cardVariant === "result" && onCreateVariant !== undefined;
  const variantChoice =
    !isResult || variantOf === null ? null : (results.find((choice) => choice.movement.id === variantOf) ?? null);
  const shown = variantChoice !== null ? [variantChoice] : results;
  const runs = variantChoice !== null ? [] : familyRuns(shown);
  const joinsPrevious = (index: number) => runs.some(([start, end]) => index > start && index <= end);
  const listTop = variantChoice !== null ? BACK_TO_CARD : message !== null ? MESSAGE_TO_CARDS : LIST_EDGE;

  // Positions réellement affichées (hauteur et ordre, `onLayout`) ; à défaut, gabarit nominal (73).
  const [frames, setFrames] = useState<Readonly<Record<string, CardFrame>>>({});
  const onCardLayout = (id: string) => (event: LayoutChangeEvent) => {
    const { y, height } = event.nativeEvent.layout;
    setFrames((current) =>
      current[id]?.y === y && current[id]?.height === height ? current : { ...current, [id]: { y, height } },
    );
  };
  const nominal: CardFrame[] = [];
  shown.forEach((_, index) => {
    const previous = nominal[index - 1];
    const y =
      previous === undefined ? listTop : previous.y + previous.height + (joinsPrevious(index) ? FAMILY_GAP : CARD_GAP);
    nominal.push({ y, height: MOVEMENT_RESULT_CARD_HEIGHT });
  });
  const frameAt = (index: number): CardFrame => frames[shown[index]!.movement.id] ?? nominal[index]!;
  const rails = runs.map(([start, end]) => {
    const first = frameAt(start);
    const last = frameAt(end);
    const top = first.y + first.height / 2;
    return { key: shown[start]!.movement.id, top, height: last.y + last.height / 2 - top };
  });
  const compositionHint = actionLabels?.useMovement ?? t.useMovement;

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
          {typeof message === "string" ? (
            message
          ) : (
            <>
              {message.before}
              <Text style={styles.messageBold} testID="movement-suggestion-message-bold">
                {message.bold}
              </Text>
              {message.after}
            </>
          )}
        </Text>
      ) : null}
      {variantChoice !== null ? (
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel={t.backToResults}
          style={[styles.backFrame, message !== null ? styles.backFrameAfterMessage : null]}
          testID="movement-suggestion-back"
        >
          <KodjoIcon name="control-back" size={20} tintColor={colors.textPrimary} />
        </Pressable>
      ) : null}
      {/* Hauteur bornée par l'hôte (espace au-dessus du clavier) : les cartes défilent ; un appui
          sur une carte agit sans fermer le clavier (`handled`). */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={[styles.listContent, { paddingTop: listTop }]}
        keyboardShouldPersistTaps="handled"
        testID="movement-suggestion-list"
      >
        {shown.map((choice, index) => {
          const testID = `movement-suggestion-result-${choice.movement.id}`;
          return (
            <View
              key={choice.movement.id}
              onLayout={onCardLayout(choice.movement.id)}
              style={index === 0 ? null : { marginTop: joinsPrevious(index) ? FAMILY_GAP : CARD_GAP }}
              testID={`${testID}-slot`}
            >
              {isResult && onCreateVariant !== undefined ? (
                <MovementResultCard
                  choice={choice}
                  variantExpanded={variantChoice !== null}
                  onCreateVariant={() => (variantChoice !== null ? onBack() : onCreateVariant(choice))}
                  onChooseVariant={(placement) => onChooseVariant(choice, placement)}
                  {...(actionLabels ? { actionLabels } : {})}
                  {...(onOpenResult !== undefined ? { onOpen: () => onOpenResult(choice) } : {})}
                  testID={testID}
                />
              ) : (
                <MovementCompositionCard
                  choice={choice}
                  onPress={() => onUse(choice)}
                  actionHint={compositionHint}
                  testID={testID}
                />
              )}
            </View>
          );
        })}
        {rails.map((rail) => (
          <View
            key={rail.key}
            pointerEvents="none"
            accessible={false}
            importantForAccessibility="no-hide-descendants"
            style={[styles.rail, { top: rail.top, height: rail.height }]}
            testID={`movement-suggestion-family-rail-${rail.key}`}
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
    borderWidth: PANEL_BORDER,
    borderColor: PANEL_BORDER_COLOR,
    shadowColor: "#000000",
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  // `10175:20518` : Medium 12, `#D92D20`, à (14, 12).
  message: {
    marginTop: MESSAGE_TOP,
    marginHorizontal: MESSAGE_INSET,
    fontFamily: "Inter_500Medium",
    fontWeight: "500",
    fontSize: 12,
    lineHeight: 15,
    color: colors.danger,
  },
  // Recette du 29/10/2026 : « archivé » en gras dans le message d'un nom pris par un Mouvement archivé.
  messageBold: {
    fontFamily: "Inter_700Bold",
    fontWeight: "700",
  },
  list: {
    flexGrow: 0,
    flexShrink: 1,
  },
  listContent: {
    paddingHorizontal: CARD_INSET,
    paddingBottom: LIST_EDGE,
  },
  // `10415:21977` : 338 × 36 à 14 du haut, chevron à 16 du bord.
  backFrame: {
    height: BACK_FRAME_HEIGHT,
    marginTop: LIST_EDGE,
    marginHorizontal: CARD_INSET,
    borderRadius: fixedRadii[12],
    borderWidth: 0.5,
    borderColor: "#CCD1E0",
    backgroundColor: colors.surfaceSubtle,
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  backFrameAfterMessage: {
    marginTop: MESSAGE_TO_CARDS,
  },
  rail: {
    position: "absolute",
    left: RAIL_X,
    width: RAIL_WIDTH,
    borderRadius: RAIL_WIDTH / 2,
    backgroundColor: RAIL_COLOR,
  },
});
