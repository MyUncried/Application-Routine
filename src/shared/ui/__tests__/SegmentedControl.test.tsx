import { fireEvent, render, screen } from "@testing-library/react-native";
import { describe, expect, it, jest } from "@jest/globals";
import { StyleSheet, Text } from "react-native";

import { INLINE_OPTION_WIDTHS, SegmentedControl } from "@/shared/ui/SegmentedControl";
import { colors, dimensions, type } from "@/shared/ui/tokens";

describe("SegmentedControl", () => {
  const options = [
    { value: "activities" as const, label: "Activités" },
    { value: "sessions" as const, label: "Séances" },
    { value: "circuits" as const, label: "Circuits", disabled: true, accessibilityLabel: "Circuits — indisponible" },
  ];

  it("renders every option with the selected one marked accordingly", () => {
    render(<SegmentedControl options={options} value="sessions" onChange={jest.fn()} testID="seg" />);

    expect(screen.getByTestId("seg-activities").props.accessibilityState.selected).toBe(false);
    expect(screen.getByTestId("seg-sessions").props.accessibilityState.selected).toBe(true);
  });

  it("calls onChange with the pressed option's value", () => {
    const onChange = jest.fn();
    render(<SegmentedControl options={options} value="sessions" onChange={onChange} testID="seg" />);

    fireEvent.press(screen.getByTestId("seg-activities"));

    expect(onChange).toHaveBeenCalledWith("activities");
  });

  it("disables a segment and exposes its unavailability accessibility label, without a handler firing", () => {
    const onChange = jest.fn();
    render(<SegmentedControl options={options} value="sessions" onChange={onChange} testID="seg" />);

    const circuits = screen.getByTestId("seg-circuits");
    expect(circuits.props.accessibilityState.disabled).toBe(true);
    expect(circuits.props.accessibilityLabel).toBe("Circuits — indisponible");

    fireEvent.press(circuits);
    expect(onChange).not.toHaveBeenCalled();
  });

  /** V2-CAT-01 (revue 5732014381, obligation 3) : cadre unique animé, jamais un fond par segment. */
  describe("cadre animé (V2-CAT-01)", () => {
    it("renders no indicator before the container is measured", () => {
      render(<SegmentedControl options={options} value="sessions" onChange={jest.fn()} testID="seg" />);
      expect(screen.queryByTestId("seg-indicator")).toBeNull();
    });

    it("renders the indicator once the container is measured, positioned toward the selected segment", () => {
      render(<SegmentedControl options={options} value="sessions" onChange={jest.fn()} testID="seg" />);

      fireEvent(screen.getByTestId("seg"), "layout", {
        nativeEvent: { layout: { x: 0, y: 0, width: 354, height: 42 } },
      });

      expect(screen.getByTestId("seg-indicator")).toBeTruthy();
    });

    it("keeps a single shared indicator (never a background on each segment) after a selection change", () => {
      const onChange = jest.fn();
      const { rerender } = render(
        <SegmentedControl options={options} value="sessions" onChange={onChange} testID="seg" />,
      );
      fireEvent(screen.getByTestId("seg"), "layout", {
        nativeEvent: { layout: { x: 0, y: 0, width: 354, height: 42 } },
      });

      rerender(<SegmentedControl options={options} value="activities" onChange={onChange} testID="seg" />);

      expect(screen.getAllByTestId("seg-indicator")).toHaveLength(1);
      expect(screen.getByTestId("seg-activities").props.accessibilityState.selected).toBe(true);
    });

    /**
     * VISUAL_CORRECTION (revue iPhone du HEAD `d6ce731`, obligation 2) : le
     * cadre coloré doit rester centré verticalement, marges haute et basse
     * ÉGALES — la bordure du conteneur (`1` pt, `styles.container.borderWidth`)
     * doit être prise en compte, pas seulement le padding déclaré.
     */
    it("centers the indicator vertically, with equal top and bottom margins (accounting for the container border)", () => {
      render(<SegmentedControl options={options} value="sessions" onChange={jest.fn()} testID="seg" />);
      fireEvent(screen.getByTestId("seg"), "layout", {
        nativeEvent: { layout: { x: 0, y: 0, width: 354, height: 42 } },
      });

      const indicator = screen.getByTestId("seg-indicator");
      const flattenedTop = StyleSheet.flatten(indicator.props.style).top as number;
      // Complément d'alignement du 07/10 (ajout C) : cadre sans contour.
      const containerBorderWidth = 0;
      const expectedTop =
        (dimensions.segmentedControl.height -
          containerBorderWidth * 2 -
          dimensions.segmentedControl.segmentHeight) /
        2;
      const marginBottom =
        dimensions.segmentedControl.height -
        containerBorderWidth * 2 -
        (flattenedTop + dimensions.segmentedControl.segmentHeight);

      expect(flattenedTop).toBe(expectedTop);
      expect(marginBottom).toBe(flattenedTop);
    });
  });

  // Complément d'alignement du 07/10 (ajout C, `DSF / Controls / Segmenté`
  // `7388:13779`) : style visuel seulement — mêmes options, mêmes valeurs.
  describe("style visuel standard (ajout C)", () => {
    it("draws a #EAEAFF tile (radius 10) under every option, beneath the selection indicator, without giving the pressable segments a background", () => {
      render(<SegmentedControl options={options} value="sessions" onChange={jest.fn()} testID="seg" />);
      fireEvent(screen.getByTestId("seg"), "layout", {
        nativeEvent: { layout: { x: 0, y: 0, width: 354, height: 42 } },
      });

      for (const option of options) {
        const tile = StyleSheet.flatten(screen.getByTestId(`seg-tile-${option.value}`).props.style);
        expect(tile.backgroundColor).toBe(colors.segmentedInactiveSurface);
        expect(tile.borderRadius).toBe(10);
        expect(tile.height).toBe(34);
        expect(StyleSheet.flatten(screen.getByTestId(`seg-${option.value}`).props.style).backgroundColor).toBeUndefined();
      }
      expect(colors.segmentedInactiveSurface).toBe("#EAEAFF");
    });

    it("uses a borderless white 50 % frame of radius 14 with a 4 gap", () => {
      render(<SegmentedControl options={options} value="sessions" onChange={jest.fn()} testID="seg" />);
      const frame = StyleSheet.flatten(screen.getByTestId("seg").props.style);
      expect(frame.backgroundColor).toBe("rgba(255, 255, 255, 0.5)");
      expect(frame.borderWidth).toBe(0);
      expect(frame.borderRadius).toBe(14);
      expect(frame.gap).toBe(4);
      expect(frame.padding).toBe(4);
      expect(frame.height).toBe(42);
    });

    it("renders every label in Semi Bold 16/20, text-label when inactive and white when selected", () => {
      render(<SegmentedControl options={options} value="sessions" onChange={jest.fn()} testID="seg" />);
      const inactive = StyleSheet.flatten(screen.getByText("Activités").props.style);
      const selected = StyleSheet.flatten(screen.getByText("Séances").props.style);
      for (const style of [inactive, selected]) {
        expect(style.fontSize).toBe(type.segmentedLabel.fontSize);
        expect(style.lineHeight).toBe(20);
        expect(style.fontWeight).toBe("600");
      }
      expect(inactive.color).toBe(colors.textLabel);
      expect(selected.color).toBe(colors.background);
    });
  });
});

describe("SegmentedControl — variante « Paramètres » (X-1, D-341, 12/10)", () => {
  const sides = [
    { value: "UNILATERAL" as const, label: "Sans\nchangement", accessibilityLabel: "Sans changement" },
    { value: "RIGHT_LEFT" as const, label: "Droite puis\ngauche", accessibilityLabel: "Droite puis gauche" },
  ];
  const layout = (height: number) =>
    fireEvent(screen.getByTestId("seg"), "layout", { nativeEvent: { layout: { x: 0, y: 0, width: 330, height } } });

  it("cadre figé (blanc, contour #DBDEE3, rayon 12) et hauteur MINIMALE, jamais fixe ; libellés centrés avec la typographie demandée", () => {
    render(
      <SegmentedControl
        options={sides}
        value="RIGHT_LEFT"
        onChange={jest.fn()}
        variant="parameters"
        labelStyle={type.segmentedCompactLabel}
        testID="seg"
      />,
    );
    const container = StyleSheet.flatten(screen.getByTestId("seg").props.style);
    expect(container.height).toBeUndefined();
    expect(container).toMatchObject({ minHeight: 42, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#DBDEE3", borderRadius: 12 });
    const label = StyleSheet.flatten(screen.getByText("Droite puis\ngauche").props.style);
    expect(label).toMatchObject({ fontSize: 13, lineHeight: 16, fontWeight: "400", textAlign: "center" });
    expect(screen.getByTestId("seg-RIGHT_LEFT").props.accessibilityLabel).toBe("Droite puis gauche");
    expect(StyleSheet.flatten(screen.getByTestId("seg-RIGHT_LEFT").props.style).minHeight).toBe(32);
  });

  it("texte agrandi : options et cadre de sélection suivent la hauteur RÉELLE mesurée (aucun rognage)", () => {
    render(<SegmentedControl options={sides} value="UNILATERAL" onChange={jest.fn()} variant="parameters" testID="seg" />);
    layout(96);
    // 96 − contour 2 − marges 8 = 86.
    expect(StyleSheet.flatten(screen.getByTestId("seg-indicator").props.style).height).toBe(86);
    expect(StyleSheet.flatten(screen.getByTestId("seg-tile-RIGHT_LEFT").props.style)).toMatchObject({
      height: 86,
      backgroundColor: "#FCFCFE",
    });
  });

  it("valeur nulle : aucun cadre de sélection, aucune option annoncée sélectionnée", () => {
    render(<SegmentedControl options={sides} value={null} onChange={jest.fn()} variant="parameters" testID="seg" />);
    layout(42);
    expect(screen.queryByTestId("seg-indicator")).toBeNull();
    for (const side of sides) {
      expect(screen.getByTestId(`seg-${side.value}`).props.accessibilityState).toMatchObject({ selected: false });
    }
  });

  it("sous-titres : Regular 11/13 centrés, #E0E3FF pour l’option choisie, #595E66 sinon ; hauteur minimale 60 respectée", () => {
    render(
      <SegmentedControl
        options={[
          { value: "BY_SIDE" as const, label: "Un côté après l’autre", subtitle: "(D1 → D2) → (G1 → G2)" },
          { value: "BY_SERIES" as const, label: "Les deux côtés à chaque série", subtitle: "(D1 → G1) → (D2 → G2)" },
        ]}
        value="BY_SIDE"
        onChange={jest.fn()}
        variant="parameters"
        labelStyle={type.body}
        minHeight={60}
        testID="seg"
      />,
    );
    expect(StyleSheet.flatten(screen.getByTestId("seg").props.style).minHeight).toBe(60);
    const selected = StyleSheet.flatten(screen.getByTestId("seg-BY_SIDE-subtitle").props.style);
    const other = StyleSheet.flatten(screen.getByTestId("seg-BY_SERIES-subtitle").props.style);
    expect(selected).toMatchObject({ fontSize: 11, lineHeight: 13, fontWeight: "400", textAlign: "center", color: "#E0E3FF" });
    expect(other.color).toBe("#595E66");
    expect(StyleSheet.flatten(screen.getByText("Un côté après l’autre").props.style)).toMatchObject({ fontSize: 14, lineHeight: 17, fontWeight: "400" });
  });

  it("standard inchangé : hauteur fixe 42, fond translucide, sans contour", () => {
    render(<SegmentedControl options={sides} value="UNILATERAL" onChange={jest.fn()} testID="seg" />);
    expect(StyleSheet.flatten(screen.getByTestId("seg").props.style)).toMatchObject({
      height: 42,
      backgroundColor: colors.segmentedSurface,
      borderWidth: 0,
      borderRadius: dimensions.segmentedControl.containerRadius,
    });
  });
});

/**
 * PRE-5 story 2.3 (AD-24, FR-27, FR-28, FR-17, FR-20, QP5-06) : variante
 * `inline`, relevé Figma UX-DR1 (`8328:38193`). Les tests ci-dessus des
 * variantes `standard` et `parameters` sont inchangés.
 */
describe("SegmentedControl — variante « inline » (PRE-5 story 2.3)", () => {
  const binary = [
    { value: "WITH" as const, label: "Avec" },
    { value: "WITHOUT" as const, label: "Sans" },
  ];

  it("cadre aligné à droite, sans enveloppe blanche, 32 de haut, marge 3, écart 2, rayon 8 ; options de même largeur", () => {
    render(<SegmentedControl options={binary} value="WITH" onChange={jest.fn()} variant="inline" testID="seg" />);
    const frame = StyleSheet.flatten(screen.getByTestId("seg").props.style);
    expect(frame).toMatchObject({ alignSelf: "flex-end", height: 32, padding: 3, gap: 2, borderRadius: 8, width: 132 });
    expect(frame.backgroundColor).toBeUndefined();
    expect(frame.borderWidth).toBeUndefined();
    for (const option of binary) {
      expect(StyleSheet.flatten(screen.getByTestId(`seg-tile-${option.value}`).props.style)).toMatchObject({
        width: INLINE_OPTION_WIDTHS.narrow,
        height: 26,
        top: 3,
        borderRadius: 5,
        backgroundColor: colors.surface,
      });
    }
  });

  it("largeur d'option fournie : 2 × 106 + 2 + 6 = 220 (Mode) ; 5 × 46,4 + 8 + 6 = 246 (Cadence)", () => {
    const { rerender } = render(
      <SegmentedControl
        options={binary}
        value="WITH"
        onChange={jest.fn()}
        variant="inline"
        optionWidth={INLINE_OPTION_WIDTHS.wide}
        testID="seg"
      />,
    );
    expect(StyleSheet.flatten(screen.getByTestId("seg").props.style).width).toBe(220);
    const cadence = ["OTHER", "5", "2", "1", "NONE"].map((value) => ({ value, label: value }));
    rerender(
      <SegmentedControl
        options={cadence}
        value="2"
        onChange={jest.fn()}
        variant="inline"
        optionWidth={INLINE_OPTION_WIDTHS.cadence}
        testID="seg"
      />,
    );
    expect(StyleSheet.flatten(screen.getByTestId("seg").props.style).width).toBeCloseTo(246);
  });

  it("option choisie : cadre violet existant (rayon 5) et libellé blanc Semi Bold 12/16 ; autres en gris regular 12/16", () => {
    render(<SegmentedControl options={binary} value="WITH" onChange={jest.fn()} variant="inline" testID="seg" />);
    expect(StyleSheet.flatten(screen.getByTestId("seg-indicator").props.style)).toMatchObject({
      backgroundColor: colors.selection,
      borderRadius: 5,
      height: 26,
      width: INLINE_OPTION_WIDTHS.narrow,
    });
    expect(StyleSheet.flatten(screen.getByText("Avec", { includeHiddenElements: true }).props.style)).toMatchObject({
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "600",
      color: colors.background,
    });
    expect(StyleSheet.flatten(screen.getByText("Sans", { includeHiddenElements: true }).props.style)).toMatchObject({
      fontSize: 12,
      lineHeight: 16,
      fontWeight: "400",
      color: "#4A4A52",
    });
  });

  it("sélection : rôle onglet, état sélectionné, onChange avec la valeur ; valeur nulle sans cadre", () => {
    const onChange = jest.fn();
    const { rerender } = render(
      <SegmentedControl options={binary} value="WITH" onChange={onChange} variant="inline" testID="seg" />,
    );
    expect(screen.getByTestId("seg").props.accessibilityRole).toBe("tablist");
    expect(screen.getByTestId("seg-WITH").props.accessibilityState).toMatchObject({ selected: true });
    fireEvent.press(screen.getByTestId("seg-WITHOUT"));
    expect(onChange).toHaveBeenCalledWith("WITHOUT");
    rerender(<SegmentedControl options={binary} value={null} onChange={onChange} variant="inline" testID="seg" />);
    expect(screen.queryByTestId("seg-indicator")).toBeNull();
  });

  it("chevron : icône graphique control-chevron-up/down de KodjoIcon, centrée avec le libellé, appui distinct de la sélection", () => {
    const onChange = jest.fn();
    const onChevronPress = jest.fn();
    const { rerender } = render(
      <SegmentedControl
        options={[{ ...binary[0], chevron: "up" as const, chevronAccessibilityLabel: "Replier les côtés" }, binary[1]]}
        value="WITH"
        onChange={onChange}
        onChevronPress={onChevronPress}
        variant="inline"
        testID="seg"
      />,
    );
    const chevron = screen.getByTestId("seg-WITH-chevron");
    expect(chevron.props.accessibilityRole).toBe("button");
    expect(chevron.props.accessibilityLabel).toBe("Replier les côtés");
    expect(chevron.props.accessibilityState).toMatchObject({ expanded: true });
    const icon = screen.getByTestId("seg-WITH-chevron-icon", { includeHiddenElements: true });
    expect(icon.props.source).toEqual([require("../../../../assets/icons/control-chevron-up.svg")]);
    expect(StyleSheet.flatten(icon.props.style)).toMatchObject({ width: 16, height: 16, tintColor: colors.background });
    expect(StyleSheet.flatten(chevron.props.style)).toMatchObject({ width: 10, height: 10 });
    expect(screen.queryByText(/[↑↓⌃⌄▲▼^]/, { includeHiddenElements: true })).toBeNull();

    fireEvent.press(chevron);
    expect(onChevronPress).toHaveBeenCalledWith("WITH");
    expect(onChange).not.toHaveBeenCalled();

    rerender(
      <SegmentedControl
        options={[{ ...binary[0], chevron: "down" as const }, binary[1]]}
        value="WITH"
        onChange={onChange}
        onChevronPress={onChevronPress}
        variant="inline"
        testID="seg"
      />,
    );
    expect(screen.getByTestId("seg-WITH-chevron-icon", { includeHiddenElements: true }).props.source).toEqual([
      require("../../../../assets/icons/control-chevron-down.svg"),
    ]);
    expect(screen.getByTestId("seg-WITH-chevron").props.accessibilityState).toMatchObject({ expanded: false });
  });

  it("chevron sans onChevronPress : décoratif, sans rôle ni action", () => {
    render(
      <SegmentedControl
        options={[{ ...binary[0], chevron: "down" as const }, binary[1]]}
        value="WITHOUT"
        onChange={jest.fn()}
        variant="inline"
        testID="seg"
      />,
    );
    const chevron = screen.getByTestId("seg-WITH-chevron", { includeHiddenElements: true });
    expect(chevron.props.accessibilityRole).toBeUndefined();
    expect(chevron.props.onPress).toBeUndefined();
    expect(StyleSheet.flatten(screen.getByTestId("seg-WITH-chevron-icon", { includeHiddenElements: true }).props.style).tintColor).toBe("#4A4A52");
  });

  it("compact : police réduite à 10, géométrie inchangée", () => {
    render(
      <SegmentedControl
        options={[
          { value: "BY_SIDE" as const, label: "(D1 → D2) ➜ (G1 → G2)", accessibilityLabel: "Un côté après l’autre" },
          { value: "BY_SERIES" as const, label: "(D1 → G1) ➜ (D2 → G2)", accessibilityLabel: "Les deux côtés à chaque série" },
        ]}
        value="BY_SIDE"
        onChange={jest.fn()}
        variant="inline"
        optionWidth={INLINE_OPTION_WIDTHS.notation}
        compact
        testID="seg"
      />,
    );
    expect(StyleSheet.flatten(screen.getByText("(D1 → D2) ➜ (G1 → G2)", { includeHiddenElements: true }).props.style).fontSize).toBe(10);
    expect(StyleSheet.flatten(screen.getByTestId("seg").props.style)).toMatchObject({ height: 32, width: 234 });
    expect(screen.getByTestId("seg-BY_SERIES").props.accessibilityLabel).toBe("Les deux côtés à chaque série");
  });

  it("readOnly : aucune zone de sélection, un seul élément texte qui annonce le libellé et la valeur", () => {
    render(
      <SegmentedControl
        options={[{ value: "MIXED" as const, label: "À la cible et à l’échec" }]}
        value="MIXED"
        onChange={jest.fn()}
        variant="inline"
        readOnly
        accessibilityLabel="Condition d’arrêt"
        testID="seg"
      />,
    );
    const frame = screen.getByTestId("seg");
    expect(frame.props.accessible).toBe(true);
    expect(frame.props.accessibilityRole).toBe("text");
    expect(frame.props.accessibilityLabel).toBe("Condition d’arrêt, À la cible et à l’échec");
    expect(screen.queryByTestId("seg-MIXED")).toBeNull();
    expect(screen.UNSAFE_queryAllByProps({ accessibilityRole: "tab" })).toHaveLength(0);
    expect(screen.getByText("À la cible et à l’échec", { includeHiddenElements: true })).toBeTruthy();
    expect(screen.getByTestId("seg-indicator")).toBeTruthy();
  });

  it("selectedContent : remplace le libellé de l'option sélectionnée seulement ; le chevron reste rendu", () => {
    const options = [
      { ...binary[0], chevron: "down" as const, selectedContent: <Text testID="phases-content">3 phases</Text> },
      binary[1],
    ];
    const { rerender } = render(
      <SegmentedControl
        options={options}
        value="WITH"
        onChange={jest.fn()}
        onChevronPress={jest.fn()}
        variant="inline"
        testID="seg"
      />,
    );
    expect(screen.getByTestId("phases-content")).toBeTruthy();
    expect(screen.queryByText("Avec", { includeHiddenElements: true })).toBeNull();
    expect(screen.getByTestId("seg-WITH-chevron")).toBeTruthy();
    expect(screen.getByTestId("seg-WITH").props.accessibilityLabel).toBe("Avec");

    rerender(<SegmentedControl options={options} value="WITHOUT" onChange={jest.fn()} variant="inline" testID="seg" />);
    expect(screen.queryByTestId("phases-content")).toBeNull();
    expect(screen.getByText("Avec", { includeHiddenElements: true })).toBeTruthy();
  });

  it("option indisponible : valeur affichée, état indisponible exposé, aucune sélection ni chevron actif (RM-247)", () => {
    const onChange = jest.fn();
    render(
      <SegmentedControl
        options={[
          {
            value: "VARIABLE" as const,
            label: "Variables",
            disabled: true,
            chevron: "down" as const,
            accessibilityLabel: "Variables — indisponible",
          },
          { value: "UNIFORM" as const, label: "Identiques" },
        ]}
        value="UNIFORM"
        onChange={onChange}
        onChevronPress={jest.fn()}
        variant="inline"
        testID="seg"
      />,
    );
    const variable = screen.getByTestId("seg-VARIABLE");
    expect(variable.props.accessibilityRole).toBe("tab");
    expect(variable.props.accessibilityState).toMatchObject({ disabled: true, selected: false });
    expect(variable.props.accessibilityLabel).toBe("Variables — indisponible");
    expect(StyleSheet.flatten(screen.getByText("Variables", { includeHiddenElements: true }).props.style).color).toBe(colors.disabled);
    fireEvent.press(variable);
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByTestId("seg-VARIABLE-chevron", { includeHiddenElements: true }).props.accessibilityRole).toBeUndefined();
    expect(
      StyleSheet.flatten(screen.getByTestId("seg-VARIABLE-chevron-icon", { includeHiddenElements: true }).props.style)
        .tintColor,
    ).toBe(colors.disabled);
  });

  it("valeur inconnue : aucun cadre de sélection (comme parameters)", () => {
    render(
      <SegmentedControl
        options={binary}
        value={"OTHER" as "WITH"}
        onChange={jest.fn()}
        variant="inline"
        testID="seg"
      />,
    );
    expect(screen.queryByTestId("seg-indicator")).toBeNull();
  });

  it("readOnly : le chevron reste décoratif même avec onChevronPress", () => {
    const onChevronPress = jest.fn();
    render(
      <SegmentedControl
        options={[{ ...binary[0], chevron: "down" as const }, binary[1]]}
        value="WITH"
        onChange={jest.fn()}
        onChevronPress={onChevronPress}
        variant="inline"
        readOnly
        testID="seg"
      />,
    );
    const chevron = screen.getByTestId("seg-WITH-chevron", { includeHiddenElements: true });
    expect(chevron.props.accessibilityRole).toBeUndefined();
    expect(chevron.props.onPress).toBeUndefined();
  });

  it("variante standard : les props d'option propres à inline n'ont aucun effet", () => {
    render(
      <SegmentedControl
        options={[{ ...binary[0], chevron: "up" as const }, binary[1]]}
        value="WITH"
        onChange={jest.fn()}
        testID="seg"
      />,
    );
    expect(screen.queryByTestId("seg-WITH-chevron")).toBeNull();
    expect(StyleSheet.flatten(screen.getByTestId("seg").props.style).height).toBe(42);
  });
});
