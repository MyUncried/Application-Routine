import { fireEvent, render, screen } from "@testing-library/react-native";
import { describe, expect, it, jest } from "@jest/globals";

import { SESSION_COLORS } from "@/domain/sessions/Session";
import { ColorPalette } from "@/features/sessions/ColorPalette";
import { strings } from "@/shared/i18n";

describe("ColorPalette", () => {
  it("shows only the compact swatch when closed, never the grid", () => {
    render(
      <ColorPalette value={SESSION_COLORS[0]} onChange={jest.fn()} isOpen={false} onToggle={jest.fn()} />,
    );

    expect(
      screen.queryByLabelText(strings.screens.composition.colorPicker.paletteAccessibilityLabel),
    ).toBeNull();
  });

  it("calls onToggle when the compact swatch is pressed", () => {
    const onToggle = jest.fn();
    render(
      <ColorPalette value={SESSION_COLORS[0]} onChange={jest.fn()} isOpen={false} onToggle={onToggle} />,
    );

    fireEvent.press(screen.getByLabelText(strings.screens.composition.colorPicker.label));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("renders exactly the 12 canonical colors as a radiogroup when open", () => {
    render(
      <ColorPalette value={SESSION_COLORS[0]} onChange={jest.fn()} isOpen={true} onToggle={jest.fn()} />,
    );

    const group = screen.getByLabelText(
      strings.screens.composition.colorPicker.paletteAccessibilityLabel,
    );
    expect(group.props.accessibilityRole).toBe("radiogroup");
    expect(SESSION_COLORS).toHaveLength(12);

    for (const color of SESSION_COLORS) {
      expect(
        screen.getByLabelText(`${strings.screens.composition.colorPicker.swatchAccessibilityLabel} ${color}`),
      ).toBeTruthy();
    }
  });

  it("marks exactly the currently selected color as selected=true, every other as selected=false", () => {
    render(
      <ColorPalette value={SESSION_COLORS[2]} onChange={jest.fn()} isOpen={true} onToggle={jest.fn()} />,
    );

    for (const color of SESSION_COLORS) {
      const swatch = screen.getByLabelText(
        `${strings.screens.composition.colorPicker.swatchAccessibilityLabel} ${color}`,
      );
      expect(swatch.props.accessibilityState).toMatchObject({ selected: color === SESSION_COLORS[2] });
    }
  });

  it("calls onChange with the pressed color", () => {
    const onChange = jest.fn();
    render(
      <ColorPalette value={SESSION_COLORS[0]} onChange={onChange} isOpen={true} onToggle={jest.fn()} />,
    );

    fireEvent.press(
      screen.getByLabelText(
        `${strings.screens.composition.colorPicker.swatchAccessibilityLabel} ${SESSION_COLORS[5]}`,
      ),
    );

    expect(onChange).toHaveBeenCalledWith(SESSION_COLORS[5]);
  });
});
