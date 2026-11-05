import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { StyleSheet } from "react-native";

import { MODAL_HEADER_ACTION_SIZE, ModalHeader, ModalValidateAction } from "@/shared/ui/ModalHeaderActions";
import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import { FixedHeader } from "@/shared/ui/ScreenShell";
import { colors } from "@/shared/ui/tokens";
import { TestSafeAreaProvider } from "@/shared/ui/TestSafeAreaProvider";

/**
 * Complément du 5 novembre 2026 (Hermann), §18–§19 : une modale qui crée ou modifie se valide par la coche de son en-tête,
 * en face de la croix ; coche bleue (couleur de marque) si la validation est possible, grise sinon.
 */
const background = (testID: string) => StyleSheet.flatten(screen.getByTestId(testID).props.style).backgroundColor;

describe("ModalValidateAction", () => {
  it("bleue et active quand la validation est possible", () => {
    const onPress = jest.fn();
    render(<ModalValidateAction onPress={onPress} enabled accessibilityLabel="Valider" testID="check" />);
    expect(background("check")).toBe(colors.wheelActionValidateBackground);
    expect(StyleSheet.flatten(screen.getByTestId("check").props.style)).toMatchObject({ width: MODAL_HEADER_ACTION_SIZE, height: MODAL_HEADER_ACTION_SIZE });
    expect(screen.getByTestId("check").props.accessibilityState).toMatchObject({ disabled: false });
    fireEvent.press(screen.getByTestId("check"));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it("grise et inactive quand un paramètre manque ou est incohérent", () => {
    const onPress = jest.fn();
    render(<ModalValidateAction onPress={onPress} enabled={false} accessibilityLabel="Valider" testID="check" />);
    expect(background("check")).toBe(colors.disabled);
    expect(screen.getByTestId("check").props.accessibilityState).toMatchObject({ disabled: true });
    fireEvent.press(screen.getByTestId("check"));
    expect(onPress).not.toHaveBeenCalled();
  });
});

describe("ModalHeader", () => {
  it("croix à gauche, titre, coche à droite", () => {
    const onCancel = jest.fn();
    const onValidate = jest.fn();
    render(
      <ModalHeader title="Titre" onCancel={onCancel} cancelLabel="Annuler" onValidate={onValidate} validateEnabled validateLabel="Valider" testIDPrefix="m" />,
    );
    const header = screen.getByTestId("m-header");
    const ids = (header.props.children as { props: { testID: string } }[]).map((child) => child.props.testID);
    expect(ids).toEqual(["m-cancel", "m-title", "m-validate"]);
    fireEvent.press(screen.getByTestId("m-cancel"));
    fireEvent.press(screen.getByTestId("m-validate"));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onValidate).toHaveBeenCalledTimes(1);
  });
});

describe("FixedHeader — variante « Fermer et valider »", () => {
  it("✕ à gauche et coche à droite ; coche grise tant que la validation est impossible", () => {
    const onValidate = jest.fn();
    const view = render(
      <TestSafeAreaProvider>
        <FixedHeader title="Planifier une séance" onBack={() => undefined} validate={{ onPress: onValidate, enabled: false, accessibilityLabel: "Enregistrer" }} />
      </TestSafeAreaProvider>,
    );
    expect(screen.UNSAFE_getAllByType(KodjoIcon)[0]!.props.name).toBe("control-close");
    expect(background("screen-header-validate")).toBe(colors.disabled);
    fireEvent.press(screen.getByTestId("screen-header-validate"));
    expect(onValidate).not.toHaveBeenCalled();
    view.rerender(
      <TestSafeAreaProvider>
        <FixedHeader title="Planifier une séance" onBack={() => undefined} validate={{ onPress: onValidate, enabled: true, accessibilityLabel: "Enregistrer" }} />
      </TestSafeAreaProvider>,
    );
    expect(background("screen-header-validate")).toBe(colors.wheelActionValidateBackground);
    fireEvent.press(screen.getByTestId("screen-header-validate"));
    expect(onValidate).toHaveBeenCalledTimes(1);
  });

  it("absente : aucune coche (rendu inchangé)", () => {
    render(
      <TestSafeAreaProvider>
        <FixedHeader title="Catalogue" onBack={() => undefined} />
      </TestSafeAreaProvider>,
    );
    expect(screen.queryByTestId("screen-header-validate")).toBeNull();
  });
});
