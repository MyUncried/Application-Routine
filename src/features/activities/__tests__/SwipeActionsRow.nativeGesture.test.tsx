import { fireEvent, render, screen } from "@testing-library/react-native";
import { describe, expect, it, jest } from "@jest/globals";
import { Text } from "react-native";
import { State } from "react-native-gesture-handler";
import { fireGestureHandler, getByGestureTestId } from "react-native-gesture-handler/jest-utils";

import { SwipeActionsRow } from "@/features/activities/SwipeActionsRow";

/**
 * Contre-recette du 23/11/2026 (r3) — rangée glissée dans une feuille native : `nativeGesture` confie le glissement au Pan
 * natif ; l'annulation des touchers de React Native (geste de la feuille, activation du Pan) ne ramène plus la rangée. Jest
 * n'exerce pas l'arbitrage des gestes d'iOS : recette sur iPhone nécessaire.
 */
function row(onReveal: () => void, onHide: () => void, revealed = false) {
  return (
    <SwipeActionsRow
      actions={[{ key: "detach", label: "Retirer", backgroundColor: "#7A5AF8", onPress: () => undefined }]}
      revealed={revealed}
      onReveal={onReveal}
      onHide={onHide}
      onPress={() => undefined}
      accessibilityLabel="Routine"
      actionWidth={90}
      nativeGesture
      testID="row"
    >
      <Text>Routine</Text>
    </SwipeActionsRow>
  );
}

describe("SwipeActionsRow — nativeGesture (r3)", () => {
  it("le Pan natif suit le doigt et ouvre au-delà de la moitié, même après une annulation des touchers", () => {
    const onReveal = jest.fn();
    render(row(onReveal, () => undefined));
    // Activation du Pan : React Native annule ses touchers — sans effet sur la rangée.
    fireEvent(screen.getByTestId("row"), "touchCancel", { nativeEvent: {} });
    fireGestureHandler(getByGestureTestId("row-pan"), [
      { state: State.BEGAN, translationX: 0 },
      { state: State.ACTIVE, translationX: -20, translationY: 6 },
      { state: State.ACTIVE, translationX: -80, translationY: 30 },
      { state: State.END, translationX: -80, translationY: 30 },
    ]);
    expect(onReveal).toHaveBeenCalledTimes(1);
  });

  it("fermeture : glisser à droite referme la rangée ouverte", () => {
    const onHide = jest.fn();
    render(row(() => undefined, onHide, true));
    fireGestureHandler(getByGestureTestId("row-pan"), [
      { state: State.BEGAN, translationX: 0 },
      { state: State.ACTIVE, translationX: 40, translationY: -20 },
      { state: State.ACTIVE, translationX: 90, translationY: -25 },
      { state: State.END, translationX: 90, translationY: -25 },
    ]);
    expect(onHide).toHaveBeenCalledTimes(1);
  });

  it("geste trop court : la rangée revient fermée, sans ouverture", () => {
    const onReveal = jest.fn();
    render(row(onReveal, () => undefined));
    fireGestureHandler(getByGestureTestId("row-pan"), [
      { state: State.BEGAN, translationX: 0 },
      { state: State.ACTIVE, translationX: -20 },
      { state: State.END, translationX: -20 },
    ]);
    expect(onReveal).not.toHaveBeenCalled();
  });
});

/**
 * Lot 4 du 23/11/2026 (x4, Hermann : « le glisser gauche provoque l'ouverture systématique de l'écran de planification d'une
 * séance ») : la fin d'un glissé, non annulée par iOS pour React Native, arrivait à la carte comme un appui.
 */
describe("SwipeActionsRow — nativeGesture : un glissé n'est jamais un appui (x4)", () => {
  function pressableRow(onPress: () => void) {
    return (
      <SwipeActionsRow
        actions={[{ key: "detach", label: "Retirer", backgroundColor: "#7A5AF8", onPress: () => undefined }]}
        revealed={false}
        onReveal={() => undefined}
        onHide={() => undefined}
        onPress={onPress}
        accessibilityLabel="Routine"
        actionWidth={90}
        nativeGesture
        testID="row"
      >
        <Text>Routine</Text>
      </SwipeActionsRow>
    );
  }

  it.each([
    ["ouverture", -80],
    ["glissé court", -20],
  ])("%s : la fin du glissé n'appelle pas onPress", (_label, translationX) => {
    const onPress = jest.fn();
    render(pressableRow(onPress));
    fireEvent(screen.getByTestId("row"), "touchStart", { nativeEvent: { pageX: 200, pageY: 20 } });
    fireGestureHandler(getByGestureTestId("row-pan"), [
      { state: State.BEGAN, translationX: 0 },
      { state: State.ACTIVE, translationX: translationX / 2, translationY: 4 },
      { state: State.ACTIVE, translationX, translationY: 6 },
      { state: State.END, translationX, translationY: 6 },
    ]);
    // iOS livre ensuite la fin du toucher au Pressable (onPressOut → onPress).
    fireEvent.press(screen.getByTestId("row-card"));
    expect(onPress).not.toHaveBeenCalled();
  });

  it("toucher simple, y compris juste après un glissé : onPress est appelé", () => {
    const onPress = jest.fn();
    render(pressableRow(onPress));
    fireEvent(screen.getByTestId("row"), "touchStart", { nativeEvent: { pageX: 200, pageY: 20 } });
    fireEvent.press(screen.getByTestId("row-card"));
    expect(onPress).toHaveBeenCalledTimes(1);
    fireEvent(screen.getByTestId("row"), "touchStart", { nativeEvent: { pageX: 200, pageY: 20 } });
    fireGestureHandler(getByGestureTestId("row-pan"), [
      { state: State.BEGAN, translationX: 0 },
      { state: State.ACTIVE, translationX: -20 },
      { state: State.END, translationX: -20 },
    ]);
    fireEvent.press(screen.getByTestId("row-card"));
    expect(onPress).toHaveBeenCalledTimes(1);
    // Toucher suivant : de nouveau un appui.
    fireEvent(screen.getByTestId("row"), "touchStart", { nativeEvent: { pageX: 200, pageY: 20 } });
    fireEvent.press(screen.getByTestId("row-card"));
    expect(onPress).toHaveBeenCalledTimes(2);
  });
});
