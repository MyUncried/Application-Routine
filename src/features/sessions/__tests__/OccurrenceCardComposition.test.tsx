import { describe, expect, it } from "@jest/globals";
import { render, screen } from "@testing-library/react-native";
import { StyleSheet } from "react-native";

import { TEXT_TERTIARY } from "@/features/sessions/CompositionSequence";
import {
  OCCURRENCE_CARD_BORDER_COLOR,
  OCCURRENCE_CARD_HAIRLINE_WIDTH,
  OCCURRENCE_CARD_HEIGHT,
  OCCURRENCE_CARD_LINES,
  OCCURRENCE_CARD_MEDIA,
  OCCURRENCE_CARD_SYMBOL_COLUMN,
  OccurrenceCard,
  occurrenceCardSurface,
  type OccurrenceCardProps,
} from "@/features/sessions/OccurrenceCard";
import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import { colors } from "@/shared/ui/tokens";

/**
 * Demande de Hermann du 08/11/2026 : carte d'exercice de la Composition au composant « DSF / Cards / Exercice —
 * Composition » (Figma `11810:2159`, variantes `11810:2102` et `11810:2132`, D-511). Tests de rendu Jest : ils ne
 * prouvent pas le rendu sur iPhone.
 */
const hidden = { includeHiddenElements: true } as const;
const style = (testID: string) => StyleSheet.flatten(screen.getByTestId(testID, hidden).props.style);

const BASE: OccurrenceCardProps = {
  name: "Étirement du quadriceps",
  level: null,
  category: { name: "Étirements", color: "#000000" },
  bodyZones: "Quadriceps",
  summary: "45″",
  hasSideChange: false,
  variant: "OUT_OF_CIRCUIT",
  borderWidth: OCCURRENCE_CARD_HAIRLINE_WIDTH,
};

function renderCard(props: Partial<OccurrenceCardProps> = {}) {
  return render(<OccurrenceCard {...BASE} {...props} />);
}

function iconSource(name: "card-media-exercise" | "card-media-exercise-out-of-circuit") {
  const { getByTestId, unmount } = render(<KodjoIcon name={name} testID="probe" />);
  const source = getByTestId("probe").props.source;
  unmount();
  return source;
}

describe("OccurrenceCard — DSF / Cards / Exercice — Composition (D-511)", () => {
  it("surface: white, 0.5 hairline of the session-card border at 50 %, radius 12; height 72", () => {
    expect(OCCURRENCE_CARD_HEIGHT).toBe(72);
    expect(occurrenceCardSurface).toEqual({
      backgroundColor: colors.background,
      borderWidth: 0.5,
      borderColor: OCCURRENCE_CARD_BORDER_COLOR,
      borderRadius: 12,
    });
    // `colors.cardsBorder` (#CCD1E0) à 50 %, comme `SessionCard` (D-504).
    expect(colors.cardsBorder).toBe("#CCD1E0");
    expect(OCCURRENCE_CARD_BORDER_COLOR).toBe("rgba(204, 209, 224, 0.5)");
  });

  it("photo 64 × 64 at 4 from the outer edge, radius 8; rail anchor at its centre (x 36), top 4, bottom 68", () => {
    renderCard();
    expect(style("composition-exercise-media")).toMatchObject({ position: "absolute", top: 4, left: 4, width: 64, height: 64, borderRadius: 8 });
    expect(OCCURRENCE_CARD_MEDIA).toEqual({ top: 4, centerX: 36, bottom: 68 });
  });

  it("content is measured from the OUTER edge whatever the caller's border (0.5 or 1)", () => {
    renderCard({ borderWidth: 0.5 });
    expect(style("composition-activity-main-card")).toMatchObject({ position: "absolute", top: -0.5, left: -0.5, right: -0.5, bottom: -0.5 });
    expect(style("composition-exercise-card-content").height).toBe(72);
    screen.unmount();
    renderCard({ borderWidth: 1 });
    expect(style("composition-activity-main-card")).toMatchObject({ top: -1, left: -1, right: -1, bottom: -1 });
  });

  it("lines at 8, 30 and 48 from the top; text 8 from the photo (x 76); right values end 12 from the edge", () => {
    renderCard();
    expect(OCCURRENCE_CARD_LINES).toEqual({ nameTop: 8, nameHeight: 20, workTop: 30, workHeight: 16, zonesTop: 48, zonesHeight: 16 });
    expect(style("composition-exercise-name-row")).toMatchObject({ top: 8, height: 20, left: 76, right: 12, alignItems: "baseline" });
    expect(style("composition-exercise-work-row")).toMatchObject({ top: 30, height: 16, left: 76, right: 12 });
    expect(style("composition-exercise-zones-line")).toMatchObject({ top: 48, height: 16, left: 76, right: 12 });
  });

  it("icons of lines 2 and 3 are centred in a 10 column; texts 7 after it", () => {
    renderCard({ recoverySeconds: 30 });
    expect(OCCURRENCE_CARD_SYMBOL_COLUMN).toBe(10);
    for (const column of ["composition-exercise-category-column", "composition-exercise-body-zones-column", "composition-recovery-line-column"]) {
      const s = style(column);
      expect(s).toMatchObject({ width: 10, alignItems: "center", justifyContent: "center" });
      // marge 2 + écart de la ligne 5 = 7.
      expect(s.marginRight + style("composition-exercise-work-row").gap).toBe(7);
    }
  });

  it("line 1: name Semi Bold 15 truncated before the level; level Medium 12 text-primary on the name baseline", () => {
    renderCard({ name: "Gainage sur les genoux, très long nom d'exercice", level: "Niveau 2" });
    const name = screen.getByTestId("composition-exercise-name", hidden);
    expect(name.props.numberOfLines).toBe(1);
    expect(style("composition-exercise-name")).toMatchObject({ fontFamily: "Inter_600SemiBold", fontSize: 15, flex: 1, minWidth: 0, color: colors.textPrimary });
    expect(screen.getByTestId("composition-exercise-level", hidden).props.children).toBe("Niveau 2");
    expect(style("composition-exercise-level")).toMatchObject({ fontFamily: "Inter_500Medium", fontSize: 12, flexShrink: 0, color: colors.textPrimary });
  });

  it("without level: nothing on the right, the name takes the space", () => {
    renderCard({ level: null });
    expect(screen.queryByTestId("composition-exercise-level", hidden)).toBeNull();
    expect(style("composition-exercise-name").flex).toBe(1);
  });

  it("line 2: category Regular 12 grey; side change immediately before the prescription Semi Bold 12 text-primary; no stopwatch", () => {
    renderCard({ hasSideChange: true, sideChangeTestID: "side", summary: "3 × 10 rép." });
    expect(style("composition-exercise-category")).toMatchObject({ fontFamily: "Inter_400Regular", fontSize: 12, color: TEXT_TERTIARY });
    expect(style("composition-exercise-summary")).toMatchObject({ fontFamily: "Inter_600SemiBold", fontSize: 12, color: colors.textPrimary });
    const row = screen.getByTestId("composition-exercise-work-row", hidden);
    const ids = row.children.map((child) => (typeof child === "string" ? child : child.props.testID));
    expect(ids.slice(-2)).toEqual(["side", "composition-exercise-summary"]);
    expect(screen.queryByTestId("composition-exercise-work-symbol", hidden)).toBeNull();
    expect(screen.queryByTestId("composition-exercise-estimated-duration", hidden)).toBeNull();
  });

  it("no chevron and no disclosure: the card does not expand", () => {
    renderCard();
    const all = screen.getByTestId("composition-activity-main-card", hidden).findAll(() => true);
    for (const node of all) {
      expect(String(node.props.testID ?? "")).not.toMatch(/chevron|disclosure/);
      expect(node.props.onPress).toBeUndefined();
    }
  });

  it("line 3: role and recovery together — role, then hourglass and duration (Regular 12 text-secondary, M′SS″ / S″ format)", () => {
    renderCard({ role: "Buy-in", roleTestID: "role", recoverySeconds: 90 });
    const line = screen.getByTestId("composition-exercise-zones-line", hidden);
    const ids = line.children.map((child) => (typeof child === "string" ? child : child.props.testID));
    expect(ids.slice(-2)).toEqual(["role", "composition-exercise-recovery"]);
    expect(style("role")).toMatchObject({ fontFamily: "Inter_400Regular", fontSize: 12, color: TEXT_TERTIARY });
    expect(screen.getByTestId("composition-recovery-line-label", hidden).props.children).toBe("1′30″");
    expect(style("composition-recovery-line-label")).toMatchObject({ fontFamily: "Inter_400Regular", fontSize: 12, color: colors.textSecondary });
    expect(screen.getByTestId("composition-recovery-line-icon", hidden)).toBeTruthy();
  });

  it("recovery of 30 s: « 30″ »; recovery 0, null or absent: neither hourglass nor value", () => {
    renderCard({ recoverySeconds: 30 });
    expect(screen.getByTestId("composition-recovery-line-label", hidden).props.children).toBe("30″");
    for (const recoverySeconds of [0, null, undefined]) {
      screen.unmount();
      renderCard({ recoverySeconds });
      expect(screen.queryByTestId("composition-recovery-line-icon", hidden)).toBeNull();
      expect(screen.queryByTestId("composition-recovery-line-label", hidden)).toBeNull();
    }
  });

  it("role alone (no recovery)", () => {
    renderCard({ role: "Buy-out", roleTestID: "role", recoverySeconds: 0 });
    expect(screen.getByTestId("role", hidden).props.children).toBe("Buy-out");
    expect(screen.queryByTestId("composition-recovery-line-icon", hidden)).toBeNull();
  });

  it("variants: black pictogram out of a circuit, grey pictogram in a circuit (without photo)", () => {
    const black = iconSource("card-media-exercise-out-of-circuit");
    const grey = iconSource("card-media-exercise");
    expect(black).not.toEqual(grey);
    renderCard({ variant: "OUT_OF_CIRCUIT" });
    expect(screen.getByTestId("composition-exercise-media-icon", hidden).props.source).toEqual(black);
    screen.unmount();
    renderCard({ variant: "IN_CIRCUIT" });
    expect(screen.getByTestId("composition-exercise-media-icon", hidden).props.source).toEqual(grey);
  });

  it("without photo: the frame has its 1 grey border and the placeholder fill", () => {
    renderCard();
    expect(style("composition-exercise-media")).toMatchObject({ borderWidth: 1, borderColor: TEXT_TERTIARY, backgroundColor: "#EEF0F6" });
  });

  it("placement: content greyed and hidden from accessibility; no dashed recovery frame", () => {
    renderCard({ attenuated: true, hideContentFromAccessibility: true, recoverySeconds: 20 });
    expect(style("composition-exercise-card-content").opacity).toBe(0.45);
    const card = screen.getByTestId("composition-activity-main-card", hidden);
    expect(card.props.accessibilityElementsHidden).toBe(true);
    for (const node of card.findAll(() => true)) {
      const s = StyleSheet.flatten(node.props.style) ?? {};
      expect(s.borderStyle).not.toBe("dashed");
    }
  });
});
