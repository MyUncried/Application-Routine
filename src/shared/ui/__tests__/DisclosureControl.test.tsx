import { fireEvent, render, screen } from "@testing-library/react-native";
import { describe, expect, it, jest } from "@jest/globals";
import { StyleSheet } from "react-native";

import { DisclosureControl } from "@/shared/ui/DisclosureControl";
import { colors, dimensions, minTouchTarget } from "@/shared/ui/tokens";

/**
 * `DisclosureControl` (T01-S09, correction VISUAL — instance de `Controls /
 * Disclosure — Source exact`, `12 – Architecture technique.md`,
 * `2537:1033`/`2537:1038`). Ces tests vérifient les deux états documentés
 * avec les véritables tokens DSF, jamais une valeur visuelle non sourcée.
 */
describe("DisclosureControl — State=Collapsed (2537:1033)", () => {
  it("renders the canonical 28×28 frame, radius 6, colors.disclosureBackground, 1pt colors.disclosureBorderCollapsed border", () => {
    render(<DisclosureControl expanded={false} accessibilityLabel="Déployer" testID="control" />);

    const frame = screen.getByTestId("control-frame");
    const flattened = StyleSheet.flatten(frame.props.style);
    expect(flattened.width).toBe(dimensions.catalogueDisclosure.frame);
    expect(flattened.height).toBe(dimensions.catalogueDisclosure.frame);
    expect(flattened.borderRadius).toBe(dimensions.catalogueDisclosure.radius);
    expect(flattened.backgroundColor).toBe(colors.disclosureBackground);
    expect(flattened.borderWidth).toBe(1);
    expect(flattened.borderColor).toBe(colors.disclosureBorderCollapsed);
  });

  it("renders a downward chevron tinted colors.disclosureChevronCollapsed", () => {
    render(<DisclosureControl expanded={false} accessibilityLabel="Déployer" testID="control" />);

    const chevron = screen.getByTestId("control-chevron");
    expect(chevron.props.source).toBeTruthy();
    expect(chevron.props.style.tintColor).toBe(colors.disclosureChevronCollapsed);
  });

  it("exposes accessibilityState.expanded: false", () => {
    render(<DisclosureControl expanded={false} accessibilityLabel="Déployer" />);
    expect(screen.getByLabelText("Déployer").props.accessibilityState).toMatchObject({
      expanded: false,
    });
  });
});

describe("DisclosureControl — State=Expanded (2537:1038)", () => {
  it("keeps the same canonical 28×28 frame, radius 6 and background, but a 2pt colors.disclosureBorderExpanded border", () => {
    render(<DisclosureControl expanded accessibilityLabel="Replier" testID="control" />);

    const frame = screen.getByTestId("control-frame");
    const flattened = StyleSheet.flatten(frame.props.style);
    expect(flattened.width).toBe(dimensions.catalogueDisclosure.frame);
    expect(flattened.height).toBe(dimensions.catalogueDisclosure.frame);
    expect(flattened.borderRadius).toBe(dimensions.catalogueDisclosure.radius);
    expect(flattened.backgroundColor).toBe(colors.disclosureBackground);
    expect(flattened.borderWidth).toBe(2);
    expect(flattened.borderColor).toBe(colors.disclosureBorderExpanded);
  });

  it("renders an upward chevron tinted colors.disclosureBorderExpanded (documented as the same colour as the expanded border)", () => {
    render(<DisclosureControl expanded accessibilityLabel="Replier" testID="control" />);

    const chevron = screen.getByTestId("control-chevron");
    expect(chevron.props.style.tintColor).toBe(colors.disclosureBorderExpanded);
  });

  it("exposes accessibilityState.expanded: true", () => {
    render(<DisclosureControl expanded accessibilityLabel="Replier" />);
    expect(screen.getByLabelText("Replier").props.accessibilityState).toMatchObject({
      expanded: true,
    });
  });
});

describe("DisclosureControl — comportements transverses", () => {
  it("preserves the 48×48 touch target via a numeric hitSlop applied on every side of the smaller 28×28 frame", () => {
    render(<DisclosureControl expanded={false} accessibilityLabel="Déployer" />);
    const pressable = screen.getByLabelText("Déployer");
    const hitSlop = pressable.props.hitSlop as number;
    expect(dimensions.catalogueDisclosure.frame + 2 * hitSlop).toBeGreaterThanOrEqual(minTouchTarget);
  });

  it("defaults to enabled and calls onPress when pressed", () => {
    const onPress = jest.fn();
    render(<DisclosureControl expanded={false} accessibilityLabel="Déployer" onPress={onPress} />);

    const pressable = screen.getByLabelText("Déployer");
    expect(pressable.props.accessibilityState).toMatchObject({ disabled: false });
    fireEvent.press(pressable);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("never calls onPress when disabled", () => {
    const onPress = jest.fn();
    render(
      <DisclosureControl expanded={false} disabled accessibilityLabel="Déployer" onPress={onPress} />,
    );

    fireEvent.press(screen.getByLabelText("Déployer"));
    expect(onPress).not.toHaveBeenCalled();
  });
});
