import { fireEvent, render, screen } from "@testing-library/react-native";
import { describe, expect, it, jest } from "@jest/globals";
import { StyleSheet } from "react-native";

import { SegmentedControl } from "@/shared/ui/SegmentedControl";
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
