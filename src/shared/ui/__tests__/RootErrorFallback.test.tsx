import { render, screen } from "@testing-library/react-native";
import { describe, expect, it } from "@jest/globals";

import { strings } from "@/shared/i18n";
import { RootErrorFallback } from "@/shared/ui/RootErrorFallback";

describe("RootErrorFallback", () => {
  it("displays the exact generic, non-technical message", () => {
    render(<RootErrorFallback />);

    expect(
      screen.getByText("Impossible d'afficher KODJO. Fermez puis relancez l'application."),
    ).toBeTruthy();
    expect(screen.getByText(strings.errors.root.message)).toBeTruthy();
  });
});
