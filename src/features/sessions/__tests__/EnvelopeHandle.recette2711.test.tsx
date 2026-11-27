import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { StyleSheet, type Animated } from "react-native";

import { EnvelopeHandle } from "@/features/sessions/EnvelopePerimeter";
import type { DragAutoScroll } from "@/features/sessions/useDragAutoScroll";

/**
 * Recette iPhone du 27/11/2026 (matin), Hermann : « Lorsqu'on relâche le bord du circuit, il se déplace à sa position
 * initiale et revient à la position finale. Pareil pour le cycle. » — la translation du trait (et du bord du cadre qui la
 * suit) n'est plus remise à 0 avant le rendu du périmètre calé, mais après. Jest ne prouve pas l'image affichée sur iPhone.
 */

const autoScroll: DragAutoScroll = { begin: () => undefined, attach: () => undefined, track: () => 0, end: () => undefined };

function liveTranslateY(): number {
  const transform = ((StyleSheet.flatten(screen.getByTestId("handle").props.style) ?? {}) as { transform?: Record<string, unknown>[] }).transform ?? [];
  const entry = transform.find((item) => item.translateY !== undefined)?.translateY;
  return typeof entry === "number" ? entry : (entry as { __getValue: () => number }).__getValue();
}

function element(onDragStart: (translation: Animated.Value) => void, onDragEnd: (pageY?: number) => void) {
  return (
    <EnvelopeHandle
      edge="BOTTOM"
      label="Bord bas du circuit"
      value="1 contenu"
      extendLabel="Étendre vers le bas"
      reduceLabel="Réduire par le bas"
      onStep={() => undefined}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      autoScroll={autoScroll}
      testID="handle"
    />
  );
}

describe("Recette du 27/11/2026 (matin) — relâchement du bord d'un périmètre sans retour à la position de départ", () => {
  it("au relâchement, la translation reste à la position atteinte jusqu'au rendu suivant, puis revient à 0", () => {
    let translation: Animated.Value | null = null;
    const seenAtEnd: number[] = [];
    const onDragStart = (value: Animated.Value) => {
      translation = value;
    };
    const onDragEnd = jest.fn(() => {
      seenAtEnd.push((translation as unknown as { __getValue: () => number }).__getValue());
    });
    const view = render(element(onDragStart, onDragEnd));
    fireEvent(screen.getByTestId("handle"), "responderGrant", { nativeEvent: { pageY: 100 } });
    fireEvent(screen.getByTestId("handle"), "responderMove", { nativeEvent: { pageY: 160 } });
    expect(liveTranslateY()).toBe(60);
    fireEvent(screen.getByTestId("handle"), "responderRelease", { nativeEvent: { pageY: 160 } });
    expect(onDragEnd).toHaveBeenCalledWith(160);
    // Avant correction : 0 (retour à la place de départ avant le rendu du périmètre calé).
    expect(seenAtEnd).toEqual([60]);
    // Rendu qui suit le relâchement (nouveau périmètre) : remise à 0.
    view.rerender(element(onDragStart, onDragEnd));
    expect(liveTranslateY()).toBe(0);
  });

  it("un nouveau glisser part de 0 même si le rendu attendu n'a pas eu lieu", () => {
    const view = render(element(() => undefined, () => undefined));
    fireEvent(screen.getByTestId("handle"), "responderGrant", { nativeEvent: { pageY: 100 } });
    fireEvent(screen.getByTestId("handle"), "responderMove", { nativeEvent: { pageY: 140 } });
    fireEvent(screen.getByTestId("handle"), "responderRelease", { nativeEvent: { pageY: 140 } });
    fireEvent(screen.getByTestId("handle"), "responderGrant", { nativeEvent: { pageY: 300 } });
    expect(liveTranslateY()).toBe(0);
    fireEvent(screen.getByTestId("handle"), "responderMove", { nativeEvent: { pageY: 310 } });
    expect(liveTranslateY()).toBe(10);
    view.unmount();
  });
});
