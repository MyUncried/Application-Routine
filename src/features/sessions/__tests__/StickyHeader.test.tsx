import { describe, expect, it, jest } from "@jest/globals";
import { render, screen } from "@testing-library/react-native";
import { Animated, Text } from "react-native";

import {
  StickyHeaderFrame,
  StickyScrollContext,
  stickyCollapseOffset,
  stickyRange,
  type StickyRange,
  type StickyScroll,
} from "@/features/sessions/StickyHeader";

/** PRE-9 B.4c (COMP §7, CS-D2 à CS-D8) : en-têtes collantes de Circuit et de Cycle. */
describe("stickyRange", () => {
  it("CS-D2 : colle quand le haut du conteneur dépasse le seuil, jusqu'à ce que son bas (moins sa marge) rejoigne le bas de l'en-tête", () => {
    // Conteneur à 300 dans le contenu, 400 de haut ; en-tête jusqu'à 70 ; marge basse 14 ; seuil 24.
    expect(stickyRange({ containerY: 300, containerHeight: 400, headerBottom: 70, bottomInset: 14, stickTop: 24 })).toEqual({
      start: 276,
      travel: 316,
    });
  });

  it("CS-D4 : dans un Cycle, le Circuit colle sous l'en-tête collé du Cycle (seuil abaissé)", () => {
    const alone = stickyRange({ containerY: 500, containerHeight: 300, headerBottom: 70, bottomInset: 14, stickTop: 24 });
    const nested = stickyRange({ containerY: 500, containerHeight: 300, headerBottom: 70, bottomInset: 14, stickTop: 24 + 62 });
    expect(nested!.start).toBe(alone!.start - 62);
  });

  it("sans mesure, ou sans place pour coller (conteneur replié réduit à son en-tête), aucun en-tête collant", () => {
    expect(stickyRange({ containerY: null, containerHeight: 300, headerBottom: 70, bottomInset: 14, stickTop: 24 })).toBeNull();
    expect(stickyRange({ containerY: 0, containerHeight: null, headerBottom: 70, bottomInset: 14, stickTop: 24 })).toBeNull();
    expect(stickyRange({ containerY: 0, containerHeight: 300, headerBottom: null, bottomInset: 14, stickTop: 24 })).toBeNull();
    expect(stickyRange({ containerY: 0, containerHeight: 84, headerBottom: 70, bottomInset: 14, stickTop: 24 })).toBeNull();
  });
});

describe("stickyCollapseOffset", () => {
  const range: StickyRange = { start: 276, travel: 316 };

  it("CS-D6 : collé, le repliage ramène le défilement au début de la zone collante — l'en-tête reste sous le doigt", () => {
    expect(stickyCollapseOffset(range, 400)).toBe(276);
  });

  it("non collé (ou géométrie inconnue) : aucun recalage", () => {
    expect(stickyCollapseOffset(range, 276)).toBeNull();
    expect(stickyCollapseOffset(range, 100)).toBeNull();
    expect(stickyCollapseOffset(null, 400)).toBeNull();
  });
});

describe("StickyHeaderFrame", () => {
  const scroll = (enabled: boolean): StickyScroll => ({
    scrollY: new Animated.Value(0),
    offset: () => 0,
    scrollTo: jest.fn(),
    top: 24,
    enabled,
  });

  function renderFrame(sticky: StickyScroll | null, range: StickyRange | null = { start: 276, travel: 316 }) {
    const frame = (
      <StickyHeaderFrame
        range={range}
        enabled
        color="#EBEDF5"
        outsetLeft={16}
        outsetRight={16}
        insetTop={14}
        extension={24}
        rail={{ centerX: 24, ringY: 21, outerRing: 16 }}
        testID="frame"
      >
        <Text>En-tête</Text>
      </StickyHeaderFrame>
    );
    return render(sticky === null ? frame : <StickyScrollContext.Provider value={sticky}>{frame}</StickyScrollContext.Provider>);
  }

  it("l'en-tête reste rendu (commandes actives, CS-D5) ; fond opaque à la couleur du conteneur, qui couvre la marge haute et la part fondue", () => {
    renderFrame(scroll(true));
    expect(screen.getByText("En-tête")).toBeTruthy();
    const surface = screen.getByTestId("frame-sticky-surface", { includeHiddenElements: true });
    const style = Object.assign({}, ...[surface.props.style].flat(Infinity)) as Record<string, unknown>;
    expect(style).toMatchObject({ position: "absolute", left: -16, right: -16, top: -38, bottom: 0, backgroundColor: "#EBEDF5" });
    // Le rail traverse la zone collante (« Le rail doit rester lisible »).
    expect(screen.getByTestId("frame-sticky-rail", { includeHiddenElements: true })).toBeTruthy();
  });

  it("au repos (sans défilement fourni, ou décollé pendant un déplacement — CS-D7), aucune translation", () => {
    const resting = (sticky: StickyScroll | null, range?: StickyRange | null) => {
      sticky?.scrollY.setValue(400);
      const { unmount } = renderFrame(sticky, range);
      const style = Object.assign({}, ...[screen.getByTestId("frame").props.style].flat(Infinity)) as { transform: { translateY: number }[] };
      unmount();
      return style.transform[0]!.translateY;
    };
    expect(resting(null)).toBe(0);
    expect(resting(scroll(false))).toBe(0);
    expect(resting(scroll(true), null)).toBe(0);
  });

  it("collé : translation interpolée du défilement, bornée par le bas du conteneur (relève par poussée, CS-D3)", () => {
    const at = (offset: number) => {
      const sticky = scroll(true);
      sticky.scrollY.setValue(offset);
      const { unmount } = renderFrame(sticky);
      const style = Object.assign({}, ...[screen.getByTestId("frame").props.style].flat(Infinity)) as { transform: { translateY: number }[] };
      const value = style.transform[0]!.translateY;
      unmount();
      return value;
    };
    expect(at(0)).toBe(0);
    expect(at(276)).toBe(0);
    expect(at(376)).toBe(100);
    expect(at(592)).toBe(316);
    expect(at(900)).toBe(316);
  });
});
