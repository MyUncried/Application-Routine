import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { Text } from "react-native";

import { SwipeActionsRow } from "@/features/activities/SwipeActionsRow";
import { SwipeScrollLockContext } from "@/shared/ui/swipeScrollLock";

/**
 * Recette iPhone du 16/11/2026 (constats e et f, Hermann : « Lorsque dans un catalogue (de mouvements / de séances) je fais un glisser
 * gauche sur une carte, la liste ne doit pas défiler et rester stable ») : la carte prend le verrou de défilement de sa liste dès que
 * son glissement horizontal est engagé, et le rend au relâchement ; un geste vertical le laisse à la liste.
 */

const touch = (x: number, y: number) => ({ nativeEvent: { pageX: x, pageY: y, touches: [] } });

function renderRow(lock: (locked: boolean) => void) {
  render(
    <SwipeScrollLockContext.Provider value={lock}>
      <SwipeActionsRow
        actions={[{ key: "delete", label: "Supprimer", backgroundColor: "#E5484D", onPress: () => undefined }]}
        revealed={false}
        onReveal={() => undefined}
        onHide={() => undefined}
        onPress={() => undefined}
        accessibilityLabel="Carte"
        testID="row"
      >
        <Text>Carte</Text>
      </SwipeActionsRow>
    </SwipeScrollLockContext.Provider>,
  );
  return screen.getByTestId("row");
}

describe("SwipeActionsRow — défilement de la liste figé pendant le glissement (constats e et f du 16/11/2026)", () => {
  it("glissement horizontal : verrou pris une seule fois, rendu au relâchement", () => {
    const lock = jest.fn<(locked: boolean) => void>();
    const row = renderRow(lock);
    fireEvent(row, "touchStart", touch(200, 100));
    fireEvent(row, "touchMove", touch(170, 102));
    fireEvent(row, "touchMove", touch(140, 104));
    expect(lock.mock.calls).toEqual([[true]]);
    fireEvent(row, "touchEnd", touch(140, 104));
    expect(lock.mock.calls).toEqual([[true], [false]]);
  });

  it("geste vertical : la liste garde son défilement", () => {
    const lock = jest.fn<(locked: boolean) => void>();
    const row = renderRow(lock);
    fireEvent(row, "touchStart", touch(200, 100));
    fireEvent(row, "touchMove", touch(198, 160));
    fireEvent(row, "touchEnd", touch(198, 160));
    expect(lock).not.toHaveBeenCalled();
  });

  it("toucher annulé : le verrou est rendu", () => {
    const lock = jest.fn<(locked: boolean) => void>();
    const row = renderRow(lock);
    fireEvent(row, "touchStart", touch(200, 100));
    fireEvent(row, "touchMove", touch(150, 100));
    fireEvent(row, "touchCancel", touch(150, 100));
    expect(lock.mock.calls).toEqual([[true], [false]]);
  });
});
