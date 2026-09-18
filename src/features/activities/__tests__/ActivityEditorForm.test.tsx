import { fireEvent, render, screen } from "@testing-library/react-native";
import { describe, expect, it, jest } from "@jest/globals";
import { useState } from "react";

import { createEmptyActivityDefinitionDraft } from "@/domain/activities";
import {
  ActivityEditorForm,
  type ActivityEditorFormValue,
} from "@/features/activities/ActivityEditorForm";

function Harness({
  initial,
  onChangeSpy,
}: {
  initial?: Partial<ActivityEditorFormValue>;
  onChangeSpy?: (patch: Partial<ActivityEditorFormValue>) => void;
}) {
  const [value, setValue] = useState<ActivityEditorFormValue>({
    ...createEmptyActivityDefinitionDraft(),
    ...initial,
  });
  return (
    <ActivityEditorForm
      value={value}
      onChange={(patch) => {
        onChangeSpy?.(patch);
        setValue((current) => ({ ...current, ...patch }));
      }}
    />
  );
}

describe("ActivityEditorForm", () => {
  it("renders the name field with the current value", () => {
    render(<Harness initial={{ name: "Squat" }} />);
    expect(screen.getByDisplayValue("Squat")).toBeTruthy();
  });

  it("reports a name change", () => {
    const onChangeSpy = jest.fn();
    render(<Harness onChangeSpy={onChangeSpy} />);
    fireEvent.changeText(screen.getByTestId("activity-editor-name-input"), "Fentes");
    expect(onChangeSpy).toHaveBeenCalledWith({ name: "Fentes" });
  });

  it("switches to REPETITIONS mode and shows the repetition field instead of duration", () => {
    render(<Harness />);
    expect(screen.getByTestId("activity-editor-duration")).toBeTruthy();

    fireEvent.press(screen.getByText("Répétitions"));

    expect(screen.queryByTestId("activity-editor-duration")).toBeNull();
    expect(screen.getByTestId("activity-editor-repetitionCount")).toBeTruthy();
  });

  it("toggles a body zone", () => {
    const onChangeSpy = jest.fn();
    render(<Harness onChangeSpy={onChangeSpy} />);
    fireEvent.press(screen.getByLabelText("Dos"));
    expect(onChangeSpy).toHaveBeenCalledWith({ bodyZoneIds: ["dos"] });
  });

  it("keeps the Médias section collapsed by default with disabled controls", () => {
    render(<Harness />);
    expect(screen.queryByTestId("activity-editor-media-content")).toBeNull();

    fireEvent.press(screen.getByTestId("activity-editor-media-header"));

    expect(screen.getByTestId("activity-editor-media-content")).toBeTruthy();
    const addMedia = screen.getByTestId("activity-editor-add-media");
    expect(addMedia.props.accessibilityState.disabled).toBe(true);
  });
});
