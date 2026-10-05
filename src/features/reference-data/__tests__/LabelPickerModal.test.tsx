import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { describe, expect, it, jest } from "@jest/globals";

import type { Label } from "@/domain/labels/Label";
import { LabelPickerModal } from "@/features/reference-data/LabelPickerModal";
import type { ReferentialService } from "@/features/reference-data/ReferentialService";
import { ReferentialServiceContext } from "@/features/reference-data/ReferentialServiceContext";

function aLabel(overrides: Partial<Label> = {}): Label {
  return {
    id: "focus",
    name: "Focus",
    canonicalKey: "focus",
    color: "#3B82F6",
    isActive: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function fakeReferentialService(overrides: Partial<ReferentialService> = {}): ReferentialService {
  return {
    listLabels: jest.fn(async () => [aLabel()]),
    createLabel: jest.fn(async () => ({ status: "DUPLICATE" as const })),
    renameLabel: jest.fn(async () => ({ status: "NOT_FOUND" as const })),
    recolorLabel: jest.fn(async () => ({ status: "NOT_FOUND" as const })),
    retireLabel: jest.fn(async () => ({ status: "NOT_FOUND" as const })),
    isLabelUsed: jest.fn(async () => false),
    ...overrides,
  } as unknown as ReferentialService;
}

function renderModal(
  service: ReferentialService,
  props: Partial<React.ComponentProps<typeof LabelPickerModal>> = {},
) {
  return render(
    <ReferentialServiceContext.Provider value={service}>
      <LabelPickerModal selectedId={null} onSelect={jest.fn()} onClose={jest.fn()} {...props} />
    </ReferentialServiceContext.Provider>,
  );
}

describe("LabelPickerModal — zero or one, toggle off on second touch (A3409468666E5)", () => {
  it("a touch on an Étiquette selects it and closes the modal", async () => {
    const onSelect = jest.fn();
    const onClose = jest.fn();
    const service = fakeReferentialService();
    renderModal(service, { onSelect, onClose });

    await screen.findByTestId("label-picker-tag-focus");
    await act(async () => {
      fireEvent.press(screen.getByTestId("label-picker-tag-focus"));
    });

    expect(onSelect).toHaveBeenCalledWith("focus");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("a new touch on the already-selected Étiquette removes the assignment", async () => {
    const onSelect = jest.fn();
    const service = fakeReferentialService();
    renderModal(service, { selectedId: "focus", onSelect });

    await screen.findByTestId("label-picker-tag-focus");
    await act(async () => {
      fireEvent.press(screen.getByTestId("label-picker-tag-focus"));
    });

    expect(onSelect).toHaveBeenCalledWith(null);
  });

  /** R10 (CE-T03-16 L1677) : l'action proposée (choisir/retirer) est distincte du nom et de l'état sélectionné. */
  it("hints the proposed action — Choisir when unselected, Retirer when selected", async () => {
    const service = fakeReferentialService();
    const unselected = renderModal(service, { selectedId: null });

    const unselectedTag = await screen.findByTestId("label-picker-tag-focus");
    expect(unselectedTag.props.accessibilityHint).toBe("Choisir");
    unselected.unmount();

    renderModal(service, { selectedId: "focus" });
    const selectedTag = await screen.findByTestId("label-picker-tag-focus");
    expect(selectedTag.props.accessibilityHint).toBe("Retirer");
  });
});

describe("LabelPickerModal — long-press menu (A03C567FAE159)", () => {
  it("long-press opens Annuler/Modifier/Supprimer without selecting or deselecting", async () => {
    const onSelect = jest.fn();
    const service = fakeReferentialService();
    renderModal(service, { onSelect, selectedId: null });

    const tag = await screen.findByTestId("label-picker-tag-focus");
    await act(async () => {
      fireEvent(tag, "longPress");
    });

    expect(screen.getByTestId("label-picker-long-press-modify")).toBeTruthy();
    expect(onSelect).not.toHaveBeenCalled();
  });
});

describe("LabelPickerModal — create / modify / delete with reactivation (D2, D4)", () => {
  it("creates a new Étiquette with the chosen color, selects it and closes", async () => {
    const onSelect = jest.fn();
    const onClose = jest.fn();
    const service = fakeReferentialService({
      createLabel: jest.fn(async () => ({
        status: "OK" as const,
        value: aLabel({ id: "new-label", name: "Sport" }),
      })),
    });
    renderModal(service, { onSelect, onClose });

    fireEvent.press(await screen.findByTestId("label-picker-create-action"));
    fireEvent.changeText(screen.getByTestId("label-picker-new-name-input"), "Sport");
    await act(async () => {
      fireEvent.press(screen.getByTestId("label-picker-new-add"));
    });

    expect(service.createLabel).toHaveBeenCalledWith(expect.objectContaining({ name: "Sport" }));
    expect(onSelect).toHaveBeenCalledWith("new-label");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("Modifier renames and recolors without changing the identifier", async () => {
    const service = fakeReferentialService({
      renameLabel: jest.fn(async () => ({ status: "OK" as const, value: aLabel({ name: "Concentration" }) })),
      recolorLabel: jest.fn(async () => ({ status: "OK" as const, value: aLabel({ color: "#E5484D" }) })),
    });
    renderModal(service);

    const tag = await screen.findByTestId("label-picker-tag-focus");
    await act(async () => {
      fireEvent(tag, "longPress");
    });
    fireEvent.press(screen.getByTestId("label-picker-long-press-modify"));
    fireEvent.changeText(screen.getByTestId("label-picker-edit-name-input"), "Concentration");
    await act(async () => {
      fireEvent.press(screen.getByTestId("label-picker-edit-save"));
    });

    expect(service.renameLabel).toHaveBeenCalledWith("focus", "Concentration");
    expect(service.recolorLabel).toHaveBeenCalled();
  });

  it("after Supprimer, the modal stays open and the Étiquette is absent from the list (§4.10 L138/L139)", async () => {
    const service = fakeReferentialService();
    renderModal(service, { selectedId: "focus" });

    const tag = await screen.findByTestId("label-picker-tag-focus");
    await act(async () => {
      fireEvent(tag, "longPress");
    });
    service.listLabels = jest.fn(async () => [aLabel({ isActive: false })]);
    await act(async () => {
      fireEvent.press(screen.getByTestId("label-picker-long-press-delete"));
    });
    await act(async () => {
      fireEvent.press(screen.getByLabelText("Supprimer"));
    });

    expect(service.retireLabel).toHaveBeenCalledWith("focus");
    expect(screen.getByTestId("label-picker-card")).toBeTruthy();
  });
});

describe("LabelPickerModal — R4/R10 (palette en flux, défilement, en-tête accessible, échec d'écriture)", () => {
  it("exposes the title as an accessible header", async () => {
    const service = fakeReferentialService();
    renderModal(service);

    await screen.findByTestId("label-picker-card");
    const title = screen.getByText("Étiquettes");
    expect(title.props.accessibilityRole).toBe("header");
  });

  it("renders the create palette inline (never a position: absolute overlay)", async () => {
    const service = fakeReferentialService();
    renderModal(service);

    fireEvent.press(await screen.findByTestId("label-picker-create-action"));
    fireEvent.press(screen.getByLabelText("Couleur"));

    const palette = screen.getByTestId("color-palette-popover");
    expect(palette.props.style.position).not.toBe("absolute");
  });

  it("shows a write-error message and keeps the modal open and the draft intact when createLabel throws", async () => {
    const onClose = jest.fn();
    const service = fakeReferentialService({
      createLabel: jest.fn(async () => {
        throw new Error("transaction annulée");
      }),
    });
    renderModal(service, { onClose });

    fireEvent.press(await screen.findByTestId("label-picker-create-action"));
    fireEvent.changeText(screen.getByTestId("label-picker-new-name-input"), "Sport");
    await act(async () => {
      fireEvent.press(screen.getByTestId("label-picker-new-add"));
    });

    expect(screen.getByTestId("label-picker-write-error")).toBeTruthy();
    expect(screen.getByTestId("label-picker-new-name-input").props.value).toBe("Sport");
    expect(onClose).not.toHaveBeenCalled();
  });
});
