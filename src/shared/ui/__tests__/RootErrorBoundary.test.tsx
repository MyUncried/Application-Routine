import { render, screen } from "@testing-library/react-native";
import { describe, expect, it, jest } from "@jest/globals";
import { Text } from "react-native";

import { RootErrorBoundary } from "@/shared/ui/RootErrorBoundary";

function Bomb(): null {
  throw new Error("boom");
}

describe("RootErrorBoundary", () => {
  it("renders its children normally when nothing throws", () => {
    render(
      <RootErrorBoundary fallback={<Text>Erreur</Text>}>
        <Text>Contenu normal</Text>
      </RootErrorBoundary>,
    );

    expect(screen.getByText("Contenu normal")).toBeTruthy();
    expect(screen.queryByText("Erreur")).toBeNull();
  });

  it("renders the fallback and calls onError exactly once when a descendant throws during render", () => {
    const onError = jest.fn();
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => {});

    try {
      render(
        <RootErrorBoundary fallback={<Text>Erreur</Text>} onError={onError}>
          <Bomb />
        </RootErrorBoundary>,
      );

      expect(screen.getByText("Erreur")).toBeTruthy();
      expect(onError).toHaveBeenCalledTimes(1);
      expect(onError).toHaveBeenCalledWith(expect.any(Error));
    } finally {
      consoleErrorSpy.mockRestore();
    }
  });
});
