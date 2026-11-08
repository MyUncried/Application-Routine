import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";

import type { ElementFormat } from "@/domain/sessions/formats";
import type { CircuitNature } from "@/domain/sessions/circuit";
import { CircuitHeader } from "@/features/sessions/CircuitHeader";
import { carrierHeaderOf } from "@/features/sessions/carrierPresentation";

/**
 * PRE-9 C.4 (référence Formats du 02/11/2026 §5, §11, §12 ; CE-FMT-03, `11270:19541`, `11411:20181`) —
 * en-tête d'un Circuit porteur : nom du Format, « N bloc(s) », nature fixée, durée bleue modifiable ;
 * For time « Sans limite » ; Death by « jusqu'à l'échec », sans durée en alternance.
 */

function renderCarrier(format: ElementFormat, nature: CircuitNature, count: number, onPress = jest.fn()) {
  render(
    <CircuitHeader
      nature={nature}
      count={count}
      duration="≈ 40′00″"
      isCounterOpen={false}
      onToggleCounter={jest.fn()}
      onChangeCount={jest.fn()}
      isNatureMenuOpen={false}
      natureFocusRequest={0}
      onOpenNatureMenu={jest.fn()}
      onCloseNatureMenu={jest.fn()}
      onSelectNature={jest.fn()}
      isCollapsed={false}
      onToggleCollapsed={jest.fn()}
      memberNames={[]}
      carrier={carrierHeaderOf({ nature, format }, onPress)}
      testID="header"
    />,
  );
  return onPress;
}

describe("CircuitHeader — Circuit porteur", () => {
  it("AMRAP · 3 blocs · groupées, durée de chaque bloc 12′00″ touchable ; nature sans menu", () => {
    const onPress = renderCarrier({ key: "AMRAP", settings: { blockSeconds: 720, restBetweenBlocksSeconds: 120 } }, "TOURS", 3);
    expect(screen.getByTestId("header-title")).toHaveTextContent("AMRAP");
    expect(screen.getByTestId("header-counter-unit")).toHaveTextContent("blocs");
    expect(screen.getByTestId("header-counter-adjective")).toHaveTextContent("groupées");
    expect(screen.queryByTestId("header-counter-nature")).toBeNull();
    expect(screen.getByTestId("header-duration")).toHaveTextContent("12′00″");
    fireEvent.press(screen.getByTestId("header-duration"));
    expect(onPress).toHaveBeenCalled();
  });

  it("For time sans temps limite : « Sans limite » ; avec : « ≤ 15′00″ »", () => {
    renderCarrier({ key: "FOR_TIME", settings: { restBetweenRoundsSeconds: 0 } }, "SERIES", 3);
    expect(screen.getByTestId("header-duration")).toHaveTextContent("Sans limite");
  });

  // Contre-recette n° 3 ter du 03/11/2026 (Hermann : « Changer "jusqu'à l'échec" par "à l'échec" »).
  it("Death by alterné : « à l'échec », aucune durée d'en-tête (A2)", () => {
    renderCarrier({ key: "DEATH_BY", settings: {} }, "SERIES", 1);
    expect(screen.getByTestId("header-title")).toHaveTextContent("Death by");
    expect(screen.getByTestId("header-counter-open")).toHaveTextContent("à l’échec");
    expect(screen.getByTestId("header-duration")).toHaveTextContent("");
  });
});
