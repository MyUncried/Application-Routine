import { describe, expect, it, jest } from "@jest/globals";
import { act, fireEvent, render, screen } from "@testing-library/react-native";
import { useState } from "react";
import { DeviceEventEmitter, Platform } from "react-native";

import {
  durationEntryResult,
  InlineDurationField,
  InlineDurationKeyboardBar,
  useDurationKeyboardFrame,
  type DurationEntry,
} from "@/features/sessions/CarrierDurationSheet";

/**
 * Décision de Hermann du 06/11/2026 (constat c : « … plus aucune roulette ou popover. Idem pour la durée d'un circuit formaté
 * dans la composition de séances. ») et recette iPhone du 07/11/2026 (a-bornes-clavier : « Une fenêtre volante se présente en
 * haut de l'écran. La supprimer. Le focus est directement dans le champ sélectionné… ») — saisie en place au clavier, dans la
 * case des Formats (`TableCell`), avec la barre du clavier des Formats. Jest ne prouve que l'arbre JS : clavier, barre et
 * remontée réels relèvent de la recette iPhone.
 */

const INPUT = "carrier-duration-input";

/** Frappe d'une touche dans la case (texte natif = texte affiché + touche, curseur à droite). */
function type(keys: string) {
  for (const key of [...keys]) {
    const input = screen.getByTestId(INPUT);
    fireEvent.changeText(input, String(input.props.value ?? "") + key);
  }
}

const entryOf = (seconds: number | null, allowsNone = false): DurationEntry => ({
  seconds,
  value: seconds,
  allowsNone,
  label: "Durée de chaque bloc",
  durationMin: 1,
});

/** Case en place et barre (iOS), état tenu comme dans la Composition. */
function Harness({ initial, onCommit }: { readonly initial: DurationEntry; readonly onCommit: (result: ReturnType<typeof durationEntryResult>) => void }) {
  const [entry, setEntry] = useState<DurationEntry | null>(initial);
  const frame = useDurationKeyboardFrame(entry !== null);
  const commit = (current: DurationEntry) => {
    setEntry(null);
    onCommit(durationEntryResult(current));
  };
  if (entry === null) return null;
  return (
    <>
      <InlineDurationField
        entry={entry}
        onChange={(value) => setEntry({ ...entry, value })}
        onBlur={() => commit(entry)}
        keyboardTop={frame?.screenY ?? null}
        barHeight={52}
        scrollBy={() => undefined}
      />
      <InlineDurationKeyboardBar
        keyboardFrame={frame}
        allowsNone={entry.allowsNone}
        noneSelected={entry.allowsNone && entry.value === null}
        onNone={() => commit({ ...entry, value: null })}
        onClose={() => commit(entry)}
        onHeight={() => undefined}
      />
    </>
  );
}

function renderEntry(seconds: number | null, allowsNone = false) {
  const onCommit = jest.fn<(result: ReturnType<typeof durationEntryResult>) => void>();
  render(<Harness initial={entryOf(seconds, allowsNone)} onCommit={onCommit} />);
  fireEvent(screen.getByTestId(INPUT), "focus");
  return onCommit;
}

const blur = () => fireEvent(screen.getByTestId(INPUT), "blur");

function withIos(run: () => void) {
  const os = Platform.OS;
  Object.defineProperty(Platform, "OS", { configurable: true, get: () => "ios" });
  try {
    run();
  } finally {
    Object.defineProperty(Platform, "OS", { configurable: true, get: () => os });
  }
}

const showKeyboard = () =>
  act(() => {
    DeviceEventEmitter.emit("keyboardWillShow", { endCoordinates: { screenX: 0, screenY: 500, width: 390, height: 344 }, duration: 0 });
  });

describe("Saisie en place d'une durée de la Composition (07/11/2026 et 08/11/2026)", () => {
  it("aucune fenêtre ni roulette : la case en place, clavier numérique « MM:SS » rempli par la droite", () => {
    renderEntry(720);
    expect(screen.queryByTestId("carrier-duration-sheet")).toBeNull();
    expect(screen.queryByTestId("carrier-duration-card")).toBeNull();
    expect(screen.queryByTestId("duration-wheel-validate")).toBeNull();
    expect(screen.getByTestId(INPUT).props.keyboardType).toBe("number-pad");
    expect(screen.getByTestId(INPUT).props.value).toBe("12:00");
    type("1");
    expect(screen.getByTestId(INPUT).props.value).toBe("00:01");
    type("30");
    expect(screen.getByTestId(INPUT).props.value).toBe("01:30");
  });

  it("la saisie est appliquée à la perte du focus", () => {
    const onCommit = renderEntry(720);
    type("1500");
    blur();
    expect(onCommit).toHaveBeenCalledWith({ changed: true, next: 15 * 60 });
  });

  it("valeur inchangée : rien n'est écrit", () => {
    const onCommit = renderEntry(720);
    blur();
    expect(onCommit).toHaveBeenCalledWith({ changed: false, next: 720 });
  });

  it("case vidée : la valeur précédente est gardée (bloc, tour) ; Temps limite : « Sans limite »", () => {
    expect(durationEntryResult({ ...entryOf(720), value: null })).toEqual({ changed: false, next: 720 });
    expect(durationEntryResult({ ...entryOf(600, true), value: null })).toEqual({ changed: true, next: null });
    expect(durationEntryResult({ ...entryOf(10), value: 130, durationMax: 60 })).toEqual({ changed: true, next: 60 });
  });

  it("Temps limite sans valeur : « Sans limite » en texte de la case", () => {
    renderEntry(null, true);
    expect(screen.getByTestId(INPUT).props.placeholder).toBe("Sans limite");
  });

  it("barre du clavier (iOS) : « Fermer » applique la saisie ; Précédent / Suivant indisponibles", () => {
    withIos(() => {
      const onCommit = renderEntry(720);
      showKeyboard();
      expect(screen.getByTestId("execution-sheet-keyboard-previous").props.accessibilityState).toMatchObject({ disabled: true });
      expect(screen.queryByTestId("carrier-duration-no-limit")).toBeNull();
      type("45");
      fireEvent.press(screen.getByTestId("execution-sheet-keyboard-close"));
      expect(onCommit).toHaveBeenCalledWith({ changed: true, next: 45 });
    });
  });

  it("w-circuit-duree : « Sans limite » dans la barre, à gauche de « Précédent », pour le Temps limite", () => {
    withIos(() => {
      const onCommit = renderEntry(600, true);
      showKeyboard();
      fireEvent.press(screen.getByTestId("carrier-duration-no-limit"));
      expect(onCommit).toHaveBeenCalledWith({ changed: true, next: null });
    });
  });
});
