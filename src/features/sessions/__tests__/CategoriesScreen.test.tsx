import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { useCallback, useMemo, useState } from "react";

import type { SessionDraft } from "@/domain/sessions/SessionDraft";
import { createExerciseDraft } from "@/domain/sessions/SessionDraft";
import { CategoriesScreen } from "@/features/sessions/CategoriesScreen";
import { SessionDraftContext, type SessionDraftContextValue } from "@/features/sessions/SessionDraftContext";
import { SessionServiceContext } from "@/features/sessions/SessionServiceContext";
import type { SessionService } from "@/features/sessions/SessionService";
import { strings } from "@/shared/i18n";
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

const t = strings.screens.categories;

function aValidDraft(overrides: Partial<SessionDraft> = {}): SessionDraft {
  return {
    name: "Séance simple",
    labelId: null,
    initialCountdownSeconds: 10,
    finalPhaseSeconds: 5,
    exercises: [{ ...createExerciseDraft("ex-1"), name: "Gainage", durationSeconds: 30 }],
    ...overrides,
  };
}

function StatefulDraftWrapper({
  initialDraft,
  createSession,
  children,
}: {
  initialDraft: SessionDraft;
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
        createSession,
      }) as unknown as SessionService,
    [createSession],
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
  createSession = jest.fn<() => Promise<{ ok: true; value: never }>>(),
}: {
  draft?: SessionDraft;
  createSession?: (draft: SessionDraft) => ReturnType<SessionService["createSession"]>;
} = {}) {
  return render(
    <TestSafeAreaProvider>
      <StatefulDraftWrapper initialDraft={draft} createSession={createSession}>
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

/**
 * V2-PRE-1 (plan §3.3, UI-8CB4E7976CBA) : la relation historique Catégorie
 * de Séance N:N et la couleur autonome associée sont retirées de cet écran
 * — il ne lit ni n'écrit plus `draft.categoryDrafts`/`draft.selectedCategoryIds`.
 * Aucune fonctionnalité d'écran nouvelle n'est introduite : seules
 * subsistent la navigation `Retour` (non destructive) et l'enregistrement
 * final de la Séance, couverts ci-dessous.
 */
describe("CategoriesScreen — navigation", () => {
  it("Retour navigates back without resetting the draft (non-destructive)", async () => {
    renderScreen();
    fireEvent.press(screen.getByLabelText(t.backAccessibilityLabel));
    expect(mockBack).toHaveBeenCalledTimes(1);
    expect(mockResetDraft).not.toHaveBeenCalled();
  });
});

describe("CategoriesScreen — enregistrement (AC-05..AC-08, D-107)", () => {
  it("Enregistrer is never disabled by default", () => {
    renderScreen();
    expect(screen.getByLabelText(t.saveAction).props.accessibilityState).toMatchObject({
      disabled: false,
    });
  });

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
    // V2-CAT-01 (UI-CAT-R-005/006) : la cible reste `Catalogue des séances`
    // (`pathname: "/"`), désormais accompagnée du signal PONCTUEL
    // `catalogueSegment: "sessions"` — consommé une seule fois par
    // `CatalogueScreen`, il force le retour déterministe sur `Séances`
    // indépendamment du segment actif avant l'ouverture du parcours.
    expect(mockDismissTo).toHaveBeenCalledWith({
      pathname: "/",
      params: { catalogueSegment: "sessions" },
    });
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

  // Correction REVISION tentative 4 (commentaire de revue 5559366973, point
  // 2) : le scénario de succès (test précédent) enchaîne sur
  // `router.dismissTo("/")`, qui démonte l'écran — `disabled: false` n'y
  // serait donc jamais réellement observable après résolution, seulement
  // déduit. Ce test utilise à la place un rejet technique (jamais de
  // navigation, `mockDismissTo` non appelé — même chemin que le test
  // « shows the exact failure message... » ci-dessus), qui laisse l'écran
  // monté : `disabled=true` pendant l'attente puis `disabled=false` après
  // résolution sont donc tous deux directement observés sur le même
  // composant, sans hypothèse. La protection anti-double-submit pendant
  // cette même fenêtre `pending` est couverte séparément par le test
  // « prevents a double-submit » ci-dessus (référencé ici plutôt que
  // dupliqué).
  it("shows the loading (saving) state — Enregistrer disabled=true while createSession is pending — then disabled=false once settled, observed on the same still-mounted screen (technical failure path, which never navigates away)", async () => {
    let rejectCreate: (error: Error) => void = () => {};
    const pending = new Promise<{ ok: true; value: unknown }>((_resolve, reject) => {
      rejectCreate = reject;
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
      rejectCreate(new Error("technical failure"));
    });

    // Toujours monté (aucune navigation sur échec) : `disabled: false` est
    // donc une observation directe du même composant, pas une déduction.
    expect(mockDismissTo).not.toHaveBeenCalled();
    expect(screen.getByLabelText(t.saveAction).props.accessibilityState).toMatchObject({
      disabled: false,
    });
  });
});
