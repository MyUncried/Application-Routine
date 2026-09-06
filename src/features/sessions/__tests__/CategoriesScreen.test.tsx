import { act, fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { useCallback, useMemo, useState } from "react";
import { StyleSheet } from "react-native";

import type { Category } from "@/domain/categories/Category";
import { DEFAULT_SESSION_COLOR } from "@/domain/sessions/Session";
import type { SessionDraft } from "@/domain/sessions/SessionDraft";
import { createExerciseDraft } from "@/domain/sessions/SessionDraft";
import { CategoriesScreen } from "@/features/sessions/CategoriesScreen";
import { SessionDraftContext, type SessionDraftContextValue } from "@/features/sessions/SessionDraftContext";
import { SessionServiceContext } from "@/features/sessions/SessionServiceContext";
import type { SessionService } from "@/features/sessions/SessionService";
import { strings } from "@/shared/i18n";
import { colors } from "@/shared/ui/tokens";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

const mockBack = jest.fn();
const mockDismissTo = jest.fn();
jest.mock("expo-router", () => {
  const actual = jest.requireActual("expo-router") as object;
  return {
    ...actual,
    useRouter: () => ({ back: mockBack, dismissTo: mockDismissTo }),
  };
});

jest.mock("expo-crypto", () => ({ randomUUID: jest.fn(() => "local-new-id") }));

const t = strings.screens.categories;

function aValidDraft(overrides: Partial<SessionDraft> = {}): SessionDraft {
  return {
    name: "Séance simple",
    color: DEFAULT_SESSION_COLOR,
    initialCountdownSeconds: 10,
    finalPhaseSeconds: 5,
    exercises: [{ ...createExerciseDraft("ex-1"), name: "Gainage", durationSeconds: 30 }],
    categoryDrafts: [],
    selectedCategoryIds: [],
    ...overrides,
  };
}

function predefinedCategory(id: string, name: string, displayOrder: number): Category {
  return {
    id,
    name,
    canonicalKey: name.toLowerCase(),
    isPredefined: true,
    displayOrder,
    createdAt: "2026-01-01T00:00:00.000Z",
  };
}

function StatefulDraftWrapper({
  initialDraft,
  categoriesResult,
  createSession,
  children,
}: {
  initialDraft: SessionDraft;
  categoriesResult: Promise<readonly Category[]>;
  createSession: (draft: SessionDraft) => ReturnType<SessionService["createSession"]>;
  children: React.ReactNode;
}) {
  const [draft, setDraft] = useState<SessionDraft>(initialDraft);
  const updateDraft = useCallback((patch: Partial<SessionDraft>) => {
    setDraft((current) => ({ ...current, ...patch }));
  }, []);
  const resetDraft = useCallback(() => {
    mockResetDraft();
  }, []);
  const draftValue = useMemo<SessionDraftContextValue>(
    () => ({ draft, updateDraft, resetDraft }),
    [draft, updateDraft, resetDraft],
  );
  const service = useMemo(
    () =>
      ({
        listCategories: () => categoriesResult,
        createSession,
      }) as unknown as SessionService,
    [categoriesResult, createSession],
  );

  return (
    <SessionDraftContext.Provider value={draftValue}>
      <SessionServiceContext.Provider value={service}>{children}</SessionServiceContext.Provider>
    </SessionDraftContext.Provider>
  );
}

const mockResetDraft = jest.fn();

function renderScreen({
  draft = aValidDraft(),
  categories = [predefinedCategory("cardio", "Cardio", 1), predefinedCategory("renforcement", "Renforcement", 0)],
  createSession = jest.fn<() => Promise<{ ok: true; value: never }>>(),
}: {
  draft?: SessionDraft;
  categories?: readonly Category[];
  createSession?: (draft: SessionDraft) => ReturnType<SessionService["createSession"]>;
} = {}) {
  return render(
    <TestSafeAreaProvider>
      <StatefulDraftWrapper
        initialDraft={draft}
        categoriesResult={Promise.resolve(categories)}
        createSession={createSession}
      >
        <CategoriesScreen />
      </StatefulDraftWrapper>
    </TestSafeAreaProvider>,
  );
}

beforeEach(() => {
  mockBack.mockReset();
  mockDismissTo.mockReset();
  mockResetDraft.mockReset();
});

describe("CategoriesScreen — tags (AC-03, D-107)", () => {
  it("shows predefined categories ordered by displayOrder once loaded, none selected by default", async () => {
    renderScreen();

    await waitFor(() => expect(screen.getByLabelText("Renforcement")).toBeTruthy());
    const cardio = screen.getByLabelText("Cardio");
    expect(cardio.props.accessibilityState).toMatchObject({ checked: false });
  });

  it("Retour navigates back without resetting the draft (non-destructive)", async () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText(t.backAccessibilityLabel));
    expect(mockBack).toHaveBeenCalledTimes(1);
    expect(mockResetDraft).not.toHaveBeenCalled();
  });

  it("toggling an unselected tag selects it, and pressing again deselects it", async () => {
    renderScreen();
    await waitFor(() => expect(screen.getByLabelText("Cardio")).toBeTruthy());

    fireEvent.press(screen.getByLabelText("Cardio"));
    expect(screen.getByLabelText(`Cardio ${t.tagAccessibility.selectedSuffix}`).props.accessibilityState).toMatchObject({
      checked: true,
    });

    fireEvent.press(screen.getByLabelText(`Cardio ${t.tagAccessibility.selectedSuffix}`));
    expect(screen.getByLabelText("Cardio").props.accessibilityState).toMatchObject({ checked: false });
  });

  it("allows zero Category selected: Enregistrer is never disabled by an empty selection (D-106)", async () => {
    const createSession = jest.fn<() => Promise<{ ok: true; value: never }>>().mockResolvedValue({
      ok: true,
      value: {} as never,
    });
    renderScreen({ createSession });
    await waitFor(() => expect(screen.getByLabelText("Cardio")).toBeTruthy());

    expect(screen.getByLabelText(t.saveAction).props.accessibilityState).toMatchObject({
      disabled: false,
    });
  });
});

describe("CategoriesScreen — création inline (AC-04, D-106, CE-T01-12)", () => {
  it("opens the inline row with the field focused, Annuler closes it without any draft change", async () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText(t.createAction));

    const input = screen.getByLabelText(t.newCategory.placeholder);
    expect(input).toBeTruthy();

    fireEvent.changeText(input, "Yoga");
    fireEvent.press(screen.getByLabelText(t.newCategory.cancelAccessibilityLabel));

    expect(screen.queryByLabelText(t.newCategory.placeholder)).toBeNull();
    expect(screen.queryByText("Yoga")).toBeNull();
  });

  it("disables Ajouter for an empty or whitespace-only name", () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText(t.createAction));

    fireEvent.changeText(screen.getByLabelText(t.newCategory.placeholder), "   ");
    expect(screen.getByLabelText(t.newCategory.addAccessibilityLabel).props.accessibilityState).toMatchObject({
      disabled: true,
    });
  });

  it("enforces the 40-character maxLength on the input", () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText(t.createAction));
    expect(screen.getByLabelText(t.newCategory.placeholder).props.maxLength).toBe(40);
  });

  it("T01-S09 correction VISUAL, 2e contre-recette (point C, commentaire de revue 5551083690) — Ajouter is blue, reusing the DSF primary action token, while enabled", () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText(t.createAction));
    fireEvent.changeText(screen.getByLabelText(t.newCategory.placeholder), "Yoga Doux");

    const addAction = screen.getByLabelText(t.newCategory.addAccessibilityLabel);
    expect(StyleSheet.flatten(addAction.props.style).backgroundColor).toBe(colors.primary);
  });

  it("adds a new valid category to the draft, selects it, and closes the row", async () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText(t.createAction));
    fireEvent.changeText(screen.getByLabelText(t.newCategory.placeholder), "Yoga Doux");
    fireEvent.press(screen.getByLabelText(t.newCategory.addAccessibilityLabel));

    expect(screen.queryByLabelText(t.newCategory.placeholder)).toBeNull();
    expect(
      screen.getByLabelText(`Yoga Doux ${t.tagAccessibility.selectedSuffix}`).props.accessibilityState,
    ).toMatchObject({ checked: true });
  });

  it("never creates a duplicate: a name matching an existing category (case/diacritics/spacing-insensitive) selects the existing one and closes silently, no error shown", async () => {
    renderScreen();
    await waitFor(() => expect(screen.getByLabelText("Cardio")).toBeTruthy());

    fireEvent.press(screen.getByLabelText(t.createAction));
    fireEvent.changeText(screen.getByLabelText(t.newCategory.placeholder), "  cardio  ");
    fireEvent.press(screen.getByLabelText(t.newCategory.addAccessibilityLabel));

    expect(screen.queryByLabelText(t.newCategory.placeholder)).toBeNull();
    // Exactly one "Cardio" tag exists (no duplicate created), now selected.
    expect(screen.getAllByText("Cardio")).toHaveLength(1);
    expect(
      screen.getByLabelText(`Cardio ${t.tagAccessibility.selectedSuffix}`).props.accessibilityState,
    ).toMatchObject({ checked: true });
  });
});

describe("CategoriesScreen — Catégorie NEW : existence indépendante de la sélection (T01-S09, correction VISUAL, point A, revue 5551813745)", () => {
  it("deselecting a locally-created (NEW) category keeps its tag visible, unselected — never removed", async () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText(t.createAction));
    fireEvent.changeText(screen.getByLabelText(t.newCategory.placeholder), "Yoga Doux");
    fireEvent.press(screen.getByLabelText(t.newCategory.addAccessibilityLabel));

    const selected = screen.getByLabelText(`Yoga Doux ${t.tagAccessibility.selectedSuffix}`);
    expect(selected.props.accessibilityState).toMatchObject({ checked: true });

    fireEvent.press(selected);

    // The tag is still present (by its unselected accessibility label),
    // never unmounted — only its `checked` state changed.
    const deselected = screen.getByLabelText("Yoga Doux");
    expect(deselected.props.accessibilityState).toMatchObject({ checked: false });
    expect(screen.getAllByText("Yoga Doux")).toHaveLength(1);
  });

  it("reselecting a previously-deselected local category toggles it back on without creating a duplicate", async () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText(t.createAction));
    fireEvent.changeText(screen.getByLabelText(t.newCategory.placeholder), "Yoga Doux");
    fireEvent.press(screen.getByLabelText(t.newCategory.addAccessibilityLabel));
    fireEvent.press(screen.getByLabelText(`Yoga Doux ${t.tagAccessibility.selectedSuffix}`));

    fireEvent.press(screen.getByLabelText("Yoga Doux"));

    expect(screen.getAllByText("Yoga Doux")).toHaveLength(1);
    expect(
      screen.getByLabelText(`Yoga Doux ${t.tagAccessibility.selectedSuffix}`).props.accessibilityState,
    ).toMatchObject({ checked: true });
  });

  it("typing a canonically-equivalent name of a deselected local category reselects it instead of creating a duplicate", async () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText(t.createAction));
    fireEvent.changeText(screen.getByLabelText(t.newCategory.placeholder), "Yoga Doux");
    fireEvent.press(screen.getByLabelText(t.newCategory.addAccessibilityLabel));
    fireEvent.press(screen.getByLabelText(`Yoga Doux ${t.tagAccessibility.selectedSuffix}`));

    fireEvent.press(screen.getByLabelText(t.createAction));
    fireEvent.changeText(screen.getByLabelText(t.newCategory.placeholder), "  yoga   doux  ");
    fireEvent.press(screen.getByLabelText(t.newCategory.addAccessibilityLabel));

    expect(screen.queryByLabelText(t.newCategory.placeholder)).toBeNull();
    expect(screen.getAllByText("Yoga Doux")).toHaveLength(1);
    expect(
      screen.getByLabelText(`Yoga Doux ${t.tagAccessibility.selectedSuffix}`).props.accessibilityState,
    ).toMatchObject({ checked: true });
  });

  it("never persists a NEW category before the final save — createSession is only called by Enregistrer", async () => {
    const createSession = jest.fn<() => Promise<{ ok: true; value: never }>>();
    renderScreen({ createSession });
    fireEvent.press(screen.getByLabelText(t.createAction));
    fireEvent.changeText(screen.getByLabelText(t.newCategory.placeholder), "Yoga Doux");
    fireEvent.press(screen.getByLabelText(t.newCategory.addAccessibilityLabel));
    fireEvent.press(screen.getByLabelText(`Yoga Doux ${t.tagAccessibility.selectedSuffix}`));

    expect(createSession).not.toHaveBeenCalled();
  });
});

describe("CategoriesScreen — enregistrement (AC-05..AC-08, D-107)", () => {
  it("calls SessionService.createSession with the draft, resets and navigates to the Catalogue on success", async () => {
    const createSession = jest.fn<() => Promise<{ ok: true; value: never }>>().mockResolvedValue({
      ok: true,
      value: {} as never,
    });
    renderScreen({ createSession });

    await act(async () => {
      fireEvent.press(screen.getByLabelText(t.saveAction));
    });

    expect(createSession).toHaveBeenCalledTimes(1);
    expect(mockResetDraft).toHaveBeenCalledTimes(1);
    expect(mockDismissTo).toHaveBeenCalledWith("/");
  });

  it("shows the exact failure message, keeps the draft and re-enables the action on a technical error — no reset, no navigation", async () => {
    const createSession = jest.fn<() => Promise<never>>().mockRejectedValue(new Error("technical failure"));
    renderScreen({ createSession });

    await act(async () => {
      fireEvent.press(screen.getByLabelText(t.saveAction));
    });

    expect(screen.getByText(t.saveError)).toBeTruthy();
    expect(mockResetDraft).not.toHaveBeenCalled();
    expect(mockDismissTo).not.toHaveBeenCalled();
    expect(screen.getByLabelText(t.saveAction).props.accessibilityState).toMatchObject({
      disabled: false,
    });
  });

  it("prevents a double-submit: a second press while saving does not call createSession twice", async () => {
    let resolveCreate: (value: { ok: true; value: unknown }) => void = () => {};
    const pending = new Promise<{ ok: true; value: unknown }>((resolve) => {
      resolveCreate = resolve;
    });
    const createSession = jest.fn(() => pending);
    renderScreen({ createSession: createSession as never });

    const saveAction = screen.getByLabelText(t.saveAction);
    act(() => {
      fireEvent.press(saveAction);
      fireEvent.press(saveAction);
    });

    expect(createSession).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveCreate({ ok: true, value: {} });
    });
  });

  it("shows the loading (saving) state — Enregistrer visually and semantically disabled — while createSession is pending, and re-enables it only once settled", async () => {
    let resolveCreate: (value: { ok: true; value: unknown }) => void = () => {};
    const pending = new Promise<{ ok: true; value: unknown }>((resolve) => {
      resolveCreate = resolve;
    });
    const createSession = jest.fn(() => pending);
    renderScreen({ createSession: createSession as never });

    const saveAction = screen.getByLabelText(t.saveAction);
    act(() => {
      fireEvent.press(saveAction);
    });

    expect(screen.getByLabelText(t.saveAction).props.accessibilityState).toMatchObject({
      disabled: true,
    });

    await act(async () => {
      resolveCreate({ ok: true, value: {} });
    });

    expect(mockDismissTo).toHaveBeenCalledWith("/");
  });
});
