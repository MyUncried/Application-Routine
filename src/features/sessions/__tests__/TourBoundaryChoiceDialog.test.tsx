import { describe, expect, it, jest } from "@jest/globals";
import { act, render } from "@testing-library/react-native";
import { Alert, type AlertButton, type AlertOptions } from "react-native";

import { TourBoundaryChoiceDialog } from "@/features/sessions/TourBoundaryChoiceDialog";
import { strings } from "@/shared/i18n";

const t = strings.screens.composition.tourBoundaryChoice;

/** PRE-6 story 7.2 (D-442, ch13 CE-T03-08 L1498) : dialogue natif « lequel conserver ». */
describe("TourBoundaryChoiceDialog (PRE-6 story 7.2, D-442)", () => {
  function renderDialog() {
    const alert = jest.spyOn(Alert, "alert").mockImplementation(() => undefined);
    const onChoose = jest.fn();
    const onCancel = jest.fn();
    const view = render(<TourBoundaryChoiceDialog onChoose={onChoose} onCancel={onCancel} />);
    const call = alert.mock.calls[0]!;
    const buttons = call[2] as AlertButton[];
    const press = (label: string) => act(() => buttons.find((button) => button.text === label)!.onPress!());
    return { alert, onChoose, onCancel, view, call, buttons, press };
  }

  it("opens one native alert at mount: title, message, « Début de tour », « Fin de tour », « Annuler » (cancel style); renders nothing", () => {
    const { alert, call, buttons, view } = renderDialog();
    try {
      expect(alert).toHaveBeenCalledTimes(1);
      expect(call[0]).toBe("Point d’arrêt en début et en fin de tour");
      expect(call[1]).toBe("Les deux se suivraient entre deux tours. Lequel conserver ?");
      expect(buttons.map((button) => button.text)).toEqual([t.head, t.tail, t.cancel]);
      expect(buttons[2]!.style).toBe("cancel");
      expect((call[3] as AlertOptions).cancelable).toBe(true);
      expect(view.toJSON()).toBeNull();
      view.rerender(<TourBoundaryChoiceDialog onChoose={jest.fn()} onCancel={jest.fn()} />);
      expect(alert).toHaveBeenCalledTimes(1);
    } finally {
      alert.mockRestore();
    }
  });

  it("« Début de tour » → HEAD, « Fin de tour » → TAIL, « Annuler » → cancel; a single answer per dialog (Android dismissal after a button is ignored)", () => {
    const first = renderDialog();
    try {
      first.press(t.head);
      expect(first.onChoose).toHaveBeenCalledWith("HEAD");
      act(() => (first.call[3] as AlertOptions).onDismiss!());
      expect(first.onCancel).not.toHaveBeenCalled();
    } finally {
      first.alert.mockRestore();
    }
    const second = renderDialog();
    try {
      second.press(t.tail);
      expect(second.onChoose).toHaveBeenCalledWith("TAIL");
    } finally {
      second.alert.mockRestore();
    }
    const third = renderDialog();
    try {
      act(() => (third.call[3] as AlertOptions).onDismiss!());
      expect(third.onCancel).toHaveBeenCalledTimes(1);
      third.press(t.cancel);
      expect(third.onCancel).toHaveBeenCalledTimes(1);
      expect(third.onChoose).not.toHaveBeenCalled();
    } finally {
      third.alert.mockRestore();
    }
  });

  it("the answer reaches the latest callbacks (the screen replays the choice on the current state)", () => {
    const { alert, view, press, onChoose } = renderDialog();
    try {
      const latest = jest.fn();
      view.rerender(<TourBoundaryChoiceDialog onChoose={latest} onCancel={jest.fn()} />);
      press(t.head);
      expect(latest).toHaveBeenCalledWith("HEAD");
      expect(onChoose).not.toHaveBeenCalled();
    } finally {
      alert.mockRestore();
    }
  });
});
