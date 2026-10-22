import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { AccessibilityInfo } from "react-native";

import type { PlacementConfirmation } from "@/domain/sessions/placement";
import { formatPlacementConfirmLabel, PlacementBar } from "@/features/sessions/PlacementBar";

const NONE: PlacementConfirmation = { kind: "NONE" };
const additions = (count: number): PlacementConfirmation => ({ kind: "ADDITIONS_ONLY", count });
const CHANGES: PlacementConfirmation = { kind: "CHANGES" };

/** PRE-6 story 4.1 (`8328:29423`) : barre « Confirmer N pauses ajoutées » / « Annuler ». */
describe("PlacementBar (PRE-6 story 4.1, story 6.3)", () => {
  it("agrees the additions label in number: singular at 0 and 1, plural from 2", () => {
    expect(formatPlacementConfirmLabel(NONE)).toBe("Confirmer 0 pause ajoutée");
    expect(formatPlacementConfirmLabel(additions(1))).toBe("Confirmer 1 pause ajoutée");
    expect(formatPlacementConfirmLabel(additions(2))).toBe("Confirmer 2 pauses ajoutées");
  });

  it("story 6.3 (D-436, 22/10 arbitration): any other change reads « Confirmer les modifications »", () => {
    expect(formatPlacementConfirmLabel(CHANGES)).toBe("Confirmer les modifications");
  });

  it("never announces by itself (review 6.3: the screen announces); Confirmer is unavailable at NONE", () => {
    const announce = jest.spyOn(AccessibilityInfo, "announceForAccessibility").mockImplementation(() => undefined);
    announce.mockClear();
    try {
      const onConfirm = jest.fn();
      const onCancel = jest.fn();
      const view = render(<PlacementBar confirmation={NONE} onConfirm={onConfirm} onCancel={onCancel} />);
      const confirm = () => screen.getByTestId("composition-placement-bar-confirm");
      expect(confirm().props.accessibilityState).toMatchObject({ disabled: true });
      fireEvent.press(confirm());
      expect(onConfirm).not.toHaveBeenCalled();

      view.rerender(<PlacementBar confirmation={additions(2)} onConfirm={onConfirm} onCancel={onCancel} />);
      expect(confirm().props.accessibilityLabel).toBe("Confirmer 2 pauses ajoutées");
      fireEvent.press(confirm());
      expect(onConfirm).toHaveBeenCalledTimes(1);

      view.rerender(<PlacementBar confirmation={CHANGES} onConfirm={onConfirm} onCancel={onCancel} />);
      expect(confirm().props.accessibilityLabel).toBe("Confirmer les modifications");
      expect(confirm().props.accessibilityState).toMatchObject({ disabled: false });
      fireEvent.press(confirm());
      expect(onConfirm).toHaveBeenCalledTimes(2);
      fireEvent.press(screen.getByLabelText("Annuler"));
      expect(onCancel).toHaveBeenCalledTimes(1);
      view.rerender(<PlacementBar confirmation={NONE} onConfirm={onConfirm} onCancel={onCancel} />);
      expect(announce).not.toHaveBeenCalled();
    } finally {
      announce.mockRestore();
    }
  });
});
