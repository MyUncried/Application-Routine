import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { AccessibilityInfo } from "react-native";

import { formatPlacementConfirmLabel, PlacementBar } from "@/features/sessions/PlacementBar";

/** PRE-6 story 4.1 (`8328:29423`) : barre « Confirmer N pauses ajoutées » / « Annuler ». */
describe("PlacementBar (PRE-6 story 4.1)", () => {
  it("agrees the label in number: singular at 0 and 1, plural from 2", () => {
    expect(formatPlacementConfirmLabel(0)).toBe("Confirmer 0 pause ajoutée");
    expect(formatPlacementConfirmLabel(1)).toBe("Confirmer 1 pause ajoutée");
    expect(formatPlacementConfirmLabel(2)).toBe("Confirmer 2 pauses ajoutées");
  });

  it("does not announce on first display, then announces each change of N; Confirmer is unavailable at 0", () => {
    const announce = jest.spyOn(AccessibilityInfo, "announceForAccessibility").mockImplementation(() => undefined);
    announce.mockClear();
    try {
      const onConfirm = jest.fn();
      const onCancel = jest.fn();
      const view = render(<PlacementBar count={0} onConfirm={onConfirm} onCancel={onCancel} />);
      expect(announce).not.toHaveBeenCalled();
      const confirm = () => screen.getByTestId("composition-placement-bar-confirm");
      expect(confirm().props.accessibilityState).toMatchObject({ disabled: true });
      fireEvent.press(confirm());
      expect(onConfirm).not.toHaveBeenCalled();

      view.rerender(<PlacementBar count={2} onConfirm={onConfirm} onCancel={onCancel} />);
      expect(announce).toHaveBeenCalledTimes(1);
      expect(announce).toHaveBeenLastCalledWith("Confirmer 2 pauses ajoutées");
      view.rerender(<PlacementBar count={2} onConfirm={onConfirm} onCancel={onCancel} />);
      expect(announce).toHaveBeenCalledTimes(1);
      fireEvent.press(confirm());
      expect(onConfirm).toHaveBeenCalledTimes(1);
      fireEvent.press(screen.getByLabelText("Annuler"));
      expect(onCancel).toHaveBeenCalledTimes(1);
    } finally {
      announce.mockRestore();
    }
  });
});
