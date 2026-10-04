import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { describe, expect, it, jest } from "@jest/globals";

import type { Category } from "@/domain/categories/Category";
import { CategoryPickerModal } from "@/features/reference-data/CategoryPickerModal";
import { ReferentialServiceContext } from "@/features/reference-data/ReferentialServiceContext";
import type { ReferentialService } from "@/features/reference-data/ReferentialService";

function aCategory(overrides: Partial<Category> = {}): Category {
  return {
    id: "cardio",
    name: "Cardio",
    canonicalKey: "cardio",
    color: "#3B82F6",
    isPredefined: true,
    displayOrder: 1,
    isActive: true,
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function fakeReferentialService(overrides: Partial<ReferentialService> = {}): ReferentialService {
  return {
    listCategories: jest.fn(async () => [aCategory()]),
    createCategory: jest.fn(async () => ({ status: "DUPLICATE" as const })),
    renameCategory: jest.fn(async () => ({ status: "NOT_FOUND" as const })),
    recolorCategory: jest.fn(async () => ({ status: "NOT_FOUND" as const })),
    retireCategory: jest.fn(async () => ({ status: "NOT_FOUND" as const })),
    isCategoryUsed: jest.fn(async () => false),
    ...overrides,
  } as unknown as ReferentialService;
}

function renderModal(
  service: ReferentialService,
  props: Partial<React.ComponentProps<typeof CategoryPickerModal>> = {},
) {
  return render(
    <ReferentialServiceContext.Provider value={service}>
      <CategoryPickerModal
        selectedId={null}
        onSelect={jest.fn()}
        onClose={jest.fn()}
        {...props}
      />
    </ReferentialServiceContext.Provider>,
  );
}

describe("CategoryPickerModal — selection (AC873C19CD5A9)", () => {
  it("a tap on an active Category selects it and closes the modal, with no extra validation button", async () => {
    const onSelect = jest.fn();
    const onClose = jest.fn();
    const service = fakeReferentialService();
    renderModal(service, { onSelect, onClose });

    await screen.findByTestId("category-picker-tag-cardio");
    await act(async () => {
      fireEvent.press(screen.getByTestId("category-picker-tag-cardio"));
    });

    expect(onSelect).toHaveBeenCalledWith("cardio");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("announces each Category's name and selected state, color always accompanied by the name", async () => {
    const service = fakeReferentialService();
    renderModal(service, { selectedId: "cardio" });

    const tag = await screen.findByTestId("category-picker-tag-cardio");
    expect(tag.props.accessibilityLabel).toContain("Cardio");
    expect(tag.props.accessibilityState.selected).toBe(true);
  });
});

describe("CategoryPickerModal — create (D2 reactivation)", () => {
  it("creates a new Category with the chosen color, selects it and closes", async () => {
    const onSelect = jest.fn();
    const onClose = jest.fn();
    const service = fakeReferentialService({
      createCategory: jest.fn(async () => ({
        status: "OK" as const,
        value: aCategory({ id: "new-cat", name: "Danse", isPredefined: false, displayOrder: null }),
      })),
    });
    renderModal(service, { onSelect, onClose });

    await screen.findByTestId("category-picker-create-action");
    fireEvent.press(screen.getByTestId("category-picker-create-action"));
    fireEvent.changeText(screen.getByTestId("category-picker-new-name-input"), "Danse");
    await act(async () => {
      fireEvent.press(screen.getByTestId("category-picker-new-add"));
    });

    expect(service.createCategory).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Danse" }),
    );
    expect(onSelect).toHaveBeenCalledWith("new-cat");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows a duplicate error and never closes when the name's key matches an active Category", async () => {
    const onClose = jest.fn();
    const service = fakeReferentialService({
      createCategory: jest.fn(async () => ({ status: "DUPLICATE" as const })),
    });
    renderModal(service, { onClose });

    fireEvent.press(await screen.findByTestId("category-picker-create-action"));
    fireEvent.changeText(screen.getByTestId("category-picker-new-name-input"), "Cardio");
    await act(async () => {
      fireEvent.press(screen.getByTestId("category-picker-new-add"));
    });

    expect(screen.getByTestId("category-picker-new-error")).toBeTruthy();
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe("CategoryPickerModal — long-press menu and deletion (D4, §4.10)", () => {
  it("long-press opens the Annuler/Modifier/Supprimer menu without changing the selection", async () => {
    const onSelect = jest.fn();
    const service = fakeReferentialService();
    renderModal(service, { onSelect, selectedId: "cardio" });

    const tag = await screen.findByTestId("category-picker-tag-cardio");
    await act(async () => {
      fireEvent(tag, "longPress");
    });

    expect(screen.getByTestId("category-picker-long-press-modify")).toBeTruthy();
    expect(screen.getByTestId("category-picker-long-press-delete")).toBeTruthy();
    expect(onSelect).not.toHaveBeenCalled();
  });

  it("shows the used-value deletion message when the Category is referenced by an existing Exercise", async () => {
    const service = fakeReferentialService({ isCategoryUsed: jest.fn(async () => true) });
    renderModal(service, { selectedId: "cardio" });

    const tag = await screen.findByTestId("category-picker-tag-cardio");
    await act(async () => {
      fireEvent(tag, "longPress");
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId("category-picker-long-press-delete"));
    });

    expect(screen.getByText(/objets/)).toBeTruthy();
  });

  it("after confirming deletion, the modal stays open and the value is absent from the list (§4.10 L138)", async () => {
    const service = fakeReferentialService();
    const { rerender } = renderModal(service, { selectedId: "cardio" });

    const tag = await screen.findByTestId("category-picker-tag-cardio");
    await act(async () => {
      fireEvent(tag, "longPress");
    });
    await act(async () => {
      fireEvent.press(screen.getByTestId("category-picker-long-press-delete"));
    });

    service.listCategories = jest.fn(async () => [aCategory({ isActive: false })]);
    await act(async () => {
      fireEvent.press(screen.getByLabelText("Supprimer"));
    });

    expect(screen.queryByTestId("category-picker-tag-cardio")).toBeNull();
    expect(screen.getByTestId("category-picker-card")).toBeTruthy();
    rerender(
      <ReferentialServiceContext.Provider value={service}>
        <CategoryPickerModal selectedId="cardio" onSelect={jest.fn()} onClose={jest.fn()} />
      </ReferentialServiceContext.Provider>,
    );
  });

  it("Modifier opens an inline rename/recolor form, and saving applies both", async () => {
    const service = fakeReferentialService({
      renameCategory: jest.fn(async () => ({ status: "OK" as const, value: aCategory({ name: "Cardio intense" }) })),
      recolorCategory: jest.fn(async () => ({ status: "OK" as const, value: aCategory({ color: "#E5484D" }) })),
    });
    renderModal(service, { selectedId: "cardio" });

    const tag = await screen.findByTestId("category-picker-tag-cardio");
    await act(async () => {
      fireEvent(tag, "longPress");
    });
    fireEvent.press(screen.getByTestId("category-picker-long-press-modify"));

    fireEvent.changeText(screen.getByTestId("category-picker-edit-name-input"), "Cardio intense");
    await act(async () => {
      fireEvent.press(screen.getByTestId("category-picker-edit-save"));
    });

    expect(service.renameCategory).toHaveBeenCalledWith("cardio", "Cardio intense");
    expect(service.recolorCategory).toHaveBeenCalled();
  });
});

describe("CategoryPickerModal — predefined categories are administrable like custom ones (§4.10 L137)", () => {
  it("renders no isPredefined guard — a predefined Category offers the same long-press actions", async () => {
    const service = fakeReferentialService();
    renderModal(service, { selectedId: null });

    const tag = await screen.findByTestId("category-picker-tag-cardio");
    expect(tag).toBeTruthy();
    await act(async () => {
      fireEvent(tag, "longPress");
    });
    expect(screen.getByTestId("category-picker-long-press-delete")).toBeTruthy();
  });
});
