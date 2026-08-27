import { act, renderHook } from "@testing-library/react-native";
import { beforeEach, describe, expect, it, jest } from "@jest/globals";

import { useCompositionExitGuard } from "@/features/sessions/useCompositionExitGuard";

/**
 * `usePreventRemove` mocké au niveau du module : ces tests portent
 * exclusivement sur le comportement de notre propre code
 * (`useCompositionExitGuard`), pas sur le mécanisme de prévention lui-même
 * — celui-ci est exercé avec un vrai navigateur par
 * `CompositionNavigationGuard.integration.test.tsx` (plan §10.3).
 */
const preventRemoveCallback: { current: ((event: { data: { action: unknown } }) => void) | null } = {
  current: null,
};
const mockUsePreventRemove = jest.fn(
  (_shouldBlock: boolean, callback: (event: { data: { action: unknown } }) => void) => {
    preventRemoveCallback.current = callback;
  },
);
jest.mock("expo-router/react-navigation", () => ({
  usePreventRemove: (shouldBlock: boolean, callback: (event: { data: { action: unknown } }) => void) =>
    mockUsePreventRemove(shouldBlock, callback),
}));

const mockDispatch = jest.fn();
jest.mock("expo-router", () => ({
  useNavigation: () => ({ dispatch: mockDispatch }),
}));

function fireInterceptedAction(action: unknown) {
  preventRemoveCallback.current?.({ data: { action } });
}

beforeEach(() => {
  mockUsePreventRemove.mockClear();
  mockDispatch.mockClear();
  preventRemoveCallback.current = null;
});

describe("useCompositionExitGuard", () => {
  it("starts with isPendingExit=false, and passes shouldBlock through to usePreventRemove", () => {
    const { result } = renderHook(() => useCompositionExitGuard(true, jest.fn()));

    expect(result.current.isPendingExit).toBe(false);
    expect(mockUsePreventRemove).toHaveBeenCalledWith(true, expect.any(Function));
  });

  it("sets isPendingExit=true and retains the exact intercepted action when the prevention callback fires", () => {
    const { result } = renderHook(() => useCompositionExitGuard(true, jest.fn()));
    const fakeAction = { type: "GO_BACK" };

    act(() => {
      fireInterceptedAction(fakeAction);
    });

    expect(result.current.isPendingExit).toBe(true);
  });

  it("cancelExit clears the pending action and never navigates", () => {
    const onConfirmExit = jest.fn();
    const { result } = renderHook(() => useCompositionExitGuard(true, onConfirmExit));

    act(() => {
      fireInterceptedAction({ type: "GO_BACK" });
    });
    expect(result.current.isPendingExit).toBe(true);

    act(() => {
      result.current.cancelExit();
    });

    expect(result.current.isPendingExit).toBe(false);
    expect(mockDispatch).not.toHaveBeenCalled();
    expect(onConfirmExit).not.toHaveBeenCalled();
  });

  it("confirmExit calls onConfirmExit exactly once, then replays exactly the intercepted action", () => {
    const onConfirmExit = jest.fn();
    const fakeAction = { type: "GO_BACK", source: "route-key" };
    const { result } = renderHook(() => useCompositionExitGuard(true, onConfirmExit));

    act(() => {
      fireInterceptedAction(fakeAction);
    });

    act(() => {
      result.current.confirmExit();
    });

    expect(onConfirmExit).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledWith(fakeAction);
    expect(result.current.isPendingExit).toBe(false);
  });

  it("calls onConfirmExit before dispatching the replayed action (order matters for the draft reset)", () => {
    const callOrder: string[] = [];
    const onConfirmExit = jest.fn(() => callOrder.push("onConfirmExit"));
    mockDispatch.mockImplementation(() => callOrder.push("dispatch"));
    const { result } = renderHook(() => useCompositionExitGuard(true, onConfirmExit));

    act(() => {
      fireInterceptedAction({ type: "GO_BACK" });
    });
    act(() => {
      result.current.confirmExit();
    });

    expect(callOrder).toEqual(["onConfirmExit", "dispatch"]);
  });

  it("prevents a double confirmation: calling confirmExit again with no new interception does nothing", () => {
    const onConfirmExit = jest.fn();
    const { result } = renderHook(() => useCompositionExitGuard(true, onConfirmExit));

    act(() => {
      fireInterceptedAction({ type: "GO_BACK" });
    });
    act(() => {
      result.current.confirmExit();
    });
    expect(mockDispatch).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.confirmExit();
    });

    // No new interception happened since the first confirmExit: still
    // exactly one dispatch, no double navigation.
    expect(mockDispatch).toHaveBeenCalledTimes(1);
    expect(onConfirmExit).toHaveBeenCalledTimes(1);
  });

  it("confirmExit called with no interception ever having fired does nothing (fresh hook, pendingAction starts null)", () => {
    const onConfirmExit = jest.fn();
    const { result } = renderHook(() => useCompositionExitGuard(true, onConfirmExit));

    act(() => {
      result.current.confirmExit();
    });

    expect(mockDispatch).not.toHaveBeenCalled();
    expect(onConfirmExit).not.toHaveBeenCalled();
    expect(result.current.isPendingExit).toBe(false);
  });

  it("cancelExit called several times in a row is idempotent: no crash, never navigates", () => {
    const { result } = renderHook(() => useCompositionExitGuard(true, jest.fn()));

    act(() => {
      fireInterceptedAction({ type: "GO_BACK" });
    });

    act(() => {
      result.current.cancelExit();
      result.current.cancelExit();
      result.current.cancelExit();
    });

    expect(result.current.isPendingExit).toBe(false);
    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it("never replays a stale action from before a cancel: a new interception after cancelExit replaces it entirely", () => {
    const { result } = renderHook(() => useCompositionExitGuard(true, jest.fn()));

    act(() => {
      fireInterceptedAction({ type: "GO_BACK", stale: true });
    });
    act(() => {
      result.current.cancelExit();
    });

    act(() => {
      fireInterceptedAction({ type: "GO_BACK", stale: false });
    });
    act(() => {
      result.current.confirmExit();
    });

    expect(mockDispatch).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledWith({ type: "GO_BACK", stale: false });
  });

  it("two closely-spaced interceptions before any confirm/cancel: only the latest action is retained and replayed once", () => {
    const { result } = renderHook(() => useCompositionExitGuard(true, jest.fn()));

    act(() => {
      fireInterceptedAction({ type: "GO_BACK", attempt: 1 });
      fireInterceptedAction({ type: "GO_BACK", attempt: 2 });
    });
    expect(result.current.isPendingExit).toBe(true);

    act(() => {
      result.current.confirmExit();
    });

    expect(mockDispatch).toHaveBeenCalledTimes(1);
    expect(mockDispatch).toHaveBeenCalledWith({ type: "GO_BACK", attempt: 2 });
  });

  it("unmounting the hook does not throw, and no dispatch/onConfirmExit fires afterwards", () => {
    const onConfirmExit = jest.fn();
    const { result, unmount } = renderHook(() => useCompositionExitGuard(true, onConfirmExit));

    act(() => {
      fireInterceptedAction({ type: "GO_BACK" });
    });

    expect(() => unmount()).not.toThrow();
    expect(mockDispatch).not.toHaveBeenCalled();
    expect(onConfirmExit).not.toHaveBeenCalled();
    void result;
  });

  it("supports a second, independent interception/confirmation cycle after the first one completed", () => {
    const onConfirmExit = jest.fn();
    const { result } = renderHook(() => useCompositionExitGuard(true, onConfirmExit));

    act(() => {
      fireInterceptedAction({ type: "GO_BACK", n: 1 });
    });
    act(() => {
      result.current.confirmExit();
    });

    act(() => {
      fireInterceptedAction({ type: "GO_BACK", n: 2 });
    });
    expect(result.current.isPendingExit).toBe(true);

    act(() => {
      result.current.confirmExit();
    });

    expect(mockDispatch).toHaveBeenCalledTimes(2);
    expect(mockDispatch).toHaveBeenNthCalledWith(2, { type: "GO_BACK", n: 2 });
    expect(onConfirmExit).toHaveBeenCalledTimes(2);
  });
});
