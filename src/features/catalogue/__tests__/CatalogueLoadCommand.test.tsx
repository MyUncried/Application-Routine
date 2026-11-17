import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";

import { CatalogueLoadCommand } from "@/features/catalogue/CatalogueLoadCommand";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({ useRouter: () => ({ push: mockPush }) }));

/** CA-4 — la commande de recette ouvre l'écran « Charger un catalogue » (remplace « Importer 60 fiches »). */
describe("CA-4 — commande « Charger un catalogue »", () => {
  it("ouvre la route de recette", () => {
    render(<CatalogueLoadCommand />);
    expect(screen.getByText("Charger un catalogue (test local)")).toBeTruthy();
    fireEvent.press(screen.getByTestId("catalogue-load-open"));
    expect(mockPush).toHaveBeenCalledWith("/catalogue-load");
  });
});
