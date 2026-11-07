import { describe, expect, it } from "@jest/globals";
import { render, screen } from "@testing-library/react-native";
import { StyleSheet, Text } from "react-native";

import { OccurrenceCard, occurrenceCardIncompleteSurface } from "@/features/sessions/OccurrenceCard";
import { strings } from "@/shared/i18n";
import { colors } from "@/shared/ui/tokens";

/**
 * PRE-9, recette iPhone du 29/10 — carte incomplète de la Composition : « Paramètres à compléter. »
 * sur deux lignes, chronomètre à sa place (colonne des valeurs à sa largeur minimale), liseré rouge.
 * Jest ne prouve pas le rendu sur iPhone.
 */
const INCOMPLETE = strings.executionParameters.card.incomplete;
const hidden = { includeHiddenElements: true } as const;
const style = (testID: string) => StyleSheet.flatten(screen.getByTestId(testID, hidden).props.style);

function renderCard(summary: string, attenuated = false) {
  render(
    <OccurrenceCard
      name="Squat assisté"
      category={null}
      bodyZones={null}
      summary={summary}
      hasSideChange={false}
      bordered
      recovery={<Text testID="recovery">20 s</Text>}
      attenuated={attenuated}
    />,
  );
}

describe("OccurrenceCard — carte incomplète (recette du 29/10)", () => {
  it("the summary is written on two lines; the values column keeps its minimum width (chronometer in place)", () => {
    renderCard(INCOMPLETE);
    expect(screen.getByTestId("composition-exercise-summary", hidden).props.numberOfLines).toBe(2);
    expect(style("composition-exercise-values-column")).toMatchObject({ width: "35%", minWidth: "35%" });
    expect(style("composition-exercise-work")).toMatchObject({ alignSelf: "flex-start" });
    expect(style("composition-exercise-summary").color).toBe(colors.danger);
    // La ligne 3 de la colonne des valeurs est laissée à la seconde ligne.
    expect(screen.queryByTestId("recovery", hidden)).toBeNull();
    expect(screen.queryByTestId("composition-exercise-recovery-slot", hidden)).toBeNull();
  });

  it("contre-recette du 30/10 — the work row spans lines 2 and 3 (two lines of 15 fit, no iOS truncation); the stopwatch keeps its box", () => {
    renderCard(INCOMPLETE);
    // 16 (ligne 2) + 2 (écart) + 17 (ligne 3) : la hauteur de mesure du texte en contient deux lignes.
    const row = style("composition-exercise-work-row");
    expect(row).toMatchObject({ height: 35, alignItems: "flex-start" });
    expect(row.height).toBeGreaterThanOrEqual(2 * style("composition-exercise-summary").lineHeight);
    const symbolBox = style("composition-exercise-work-symbol-box");
    expect(symbolBox).toMatchObject({ height: 16, justifyContent: "center" });
  });

  it("the stopwatch box is identical on a complete card (same position)", () => {
    renderCard("10 rép.");
    expect(style("composition-exercise-work-row").height).toBe(16);
    const symbolBox = style("composition-exercise-work-symbol-box");
    expect(symbolBox).toMatchObject({ height: 16, justifyContent: "center" });
  });

  it("a complete card is unchanged: one line, column free to widen, recovery shown", () => {
    renderCard("10 rép.");
    expect(screen.getByTestId("composition-exercise-summary", hidden).props.numberOfLines).toBe(1);
    expect(style("composition-exercise-values-column").width).toBeUndefined();
    expect(screen.getByTestId("recovery", hidden)).toBeTruthy();
  });

  it("placement (attenuated): one line, the recovery frame keeps line 3", () => {
    renderCard(INCOMPLETE, true);
    expect(screen.getByTestId("composition-exercise-summary", hidden).props.numberOfLines).toBe(1);
    expect(screen.getByTestId("recovery", hidden)).toBeTruthy();
  });

  it("incomplete surface: red tint plus a thin red border", () => {
    expect(occurrenceCardIncompleteSurface).toEqual({
      backgroundColor: colors.dangerSurface,
      borderWidth: 1,
      borderColor: colors.danger,
    });
  });
});
