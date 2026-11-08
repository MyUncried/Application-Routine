import { describe, expect, it } from "@jest/globals";
import { render, screen } from "@testing-library/react-native";
import { StyleSheet } from "react-native";

import { OccurrenceCard, occurrenceCardIncompleteSurface, occurrenceCardToVerifySurface } from "@/features/sessions/OccurrenceCard";
import { strings } from "@/shared/i18n";
import { toVerifyColors } from "@/shared/ui/toVerifyColors";
import { colors } from "@/shared/ui/tokens";

/**
 * PRE-9, recette iPhone du 29/10 — carte incomplète de la Composition : « Paramètres à compléter. » en rouge, fond et
 * liseré rouges. Demande de Hermann du 08/11/2026 (composant « DSF / Cards / Exercice — Composition », D-511) : la
 * colonne des valeurs et le chronomètre n'existent plus ; la prescription n'est jamais abrégée, la catégorie lui cède
 * la place, elle tient sur la ligne 2. [Deux lignes, chronomètre à sa place (recette du 29/10, contre-recette du
 * 30/10) — remplacé le 08/11/2026.] Jest ne prouve pas le rendu sur iPhone.
 */
const INCOMPLETE = strings.executionParameters.card.incomplete;
const TO_VERIFY = strings.executionParameters.card.toVerify;
const hidden = { includeHiddenElements: true } as const;
const style = (testID: string) => StyleSheet.flatten(screen.getByTestId(testID, hidden).props.style);

function renderCard(summary: string, attenuated = false) {
  render(
    <OccurrenceCard
      name="Squat assisté"
      level={null}
      category={{ name: "Renforcement", color: "#000000" }}
      bodyZones={null}
      summary={summary}
      hasSideChange={false}
      variant="OUT_OF_CIRCUIT"
      borderWidth={1}
      recoverySeconds={20}
      attenuated={attenuated}
    />,
  );
}

describe("OccurrenceCard — carte incomplète ou à vérifier", () => {
  it("« Paramètres à compléter. » : une ligne, rouge, jamais abrégée ; la récupération reste en ligne 3", () => {
    renderCard(INCOMPLETE);
    const summary = screen.getByTestId("composition-exercise-summary", hidden);
    expect(summary.props.numberOfLines).toBe(1);
    expect(style("composition-exercise-summary")).toMatchObject({ color: colors.danger, flexShrink: 0 });
    expect(style("composition-exercise-category")).toMatchObject({ flex: 1, minWidth: 0 });
    expect(screen.getByTestId("composition-recovery-line-label", hidden)).toBeTruthy();
    // Aucun chronomètre ni colonne des valeurs.
    expect(screen.queryByTestId("composition-exercise-work-symbol", hidden)).toBeNull();
    expect(screen.queryByTestId("composition-exercise-values-column", hidden)).toBeNull();
  });

  it("« Paramètre à vérifier » : orange", () => {
    renderCard(TO_VERIFY);
    expect(style("composition-exercise-summary").color).toBe(toVerifyColors.text);
  });

  it("incomplete surface: red tint plus a thin red border; to verify: orange tint, transparent border", () => {
    expect(occurrenceCardIncompleteSurface).toEqual({
      backgroundColor: colors.dangerSurface,
      borderWidth: 1,
      borderColor: colors.danger,
    });
    expect(occurrenceCardToVerifySurface).toEqual({
      backgroundColor: toVerifyColors.surface,
      borderWidth: 1,
      borderColor: "transparent",
    });
  });
});
