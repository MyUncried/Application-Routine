import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";
import { Animated } from "react-native";

import { AnimatedShiftRegistry, DRAG_SHIFT_DURATION_MS } from "@/features/sessions/useAnimatedShift";

/**
 * PRE-6 (story 5.2, revue) : registre des translations partagées de la séquence. `Animated.timing`
 * est remplacé par une animation factice qui enregistre démarrages, arrêts et fins.
 */
type FakeAnimation = {
  readonly toValue: number;
  readonly useNativeDriver: boolean | undefined;
  readonly duration: number | undefined;
  started: boolean;
  stopped: boolean;
  finish: () => void;
};

let animations: FakeAnimation[] = [];

beforeEach(() => {
  animations = [];
  jest.spyOn(Animated, "timing").mockImplementation((_value, config) => {
    let onEnd: Animated.EndCallback | undefined;
    const fake: FakeAnimation = {
      toValue: config.toValue as number,
      useNativeDriver: config.useNativeDriver,
      duration: config.duration,
      started: false,
      stopped: false,
      finish: () => onEnd?.({ finished: true }),
    };
    animations.push(fake);
    return {
      start: (callback?: Animated.EndCallback) => {
        fake.started = true;
        onEnd = callback;
      },
      stop: () => {
        fake.stopped = true;
        onEnd?.({ finished: false });
      },
      reset: () => undefined,
    };
  });
});
afterEach(() => {
  jest.restoreAllMocks();
});

/** Laisse passer les démarrages différés (microtâches). */
const flush = async () => {
  await Promise.resolve();
  await Promise.resolve();
};
const valueOf = (value: Animated.Value) => (value as unknown as { __getValue: () => number }).__getValue();

describe("AnimatedShiftRegistry (story 5.2)", () => {
  it("pose immédiate : synchrone, sans animation", () => {
    const registry = new AnimatedShiftRegistry();
    const shift = registry.value("a", 0);
    registry.apply(new Map([["a", 5]]), false);
    expect(valueOf(shift)).toBe(5);
    expect(animations).toHaveLength(0);
  });

  it("animation : démarrée après les microtâches, pilote natif, 180 ms ; cible inchangée → rien n'est relancé", async () => {
    const registry = new AnimatedShiftRegistry();
    registry.value("a", 0);
    registry.apply(new Map([["a", 5]]), true);
    expect(animations).toHaveLength(0);
    await flush();
    expect(animations).toHaveLength(1);
    expect(animations[0]).toMatchObject({ toValue: 5, useNativeDriver: true, duration: DRAG_SHIFT_DURATION_MS, started: true });
    registry.apply(new Map([["a", 5]]), true);
    await flush();
    expect(animations).toHaveLength(1);
  });

  it("démarrage en attente annulé par une pose immédiate de la même clé", async () => {
    const registry = new AnimatedShiftRegistry();
    const shift = registry.value("a", 0);
    registry.apply(new Map([["a", 5]]), true);
    registry.apply(new Map([["a", 0]]), false);
    await flush();
    expect(animations).toHaveLength(0);
    expect(valueOf(shift)).toBe(0);
  });

  it("clé retirée avant le démarrage : rien ne démarre, et la clé revient avec une nouvelle valeur", async () => {
    const registry = new AnimatedShiftRegistry();
    const shift = registry.value("a", 0);
    registry.apply(new Map([["a", 5]]), true);
    registry.apply(new Map(), true);
    await flush();
    expect(animations).toHaveLength(0);
    expect(registry.value("a", 3)).not.toBe(shift);
  });

  it("deux rendus successifs avant le démarrage : seule la dernière cible démarre", async () => {
    const registry = new AnimatedShiftRegistry();
    registry.value("a", 0);
    registry.apply(new Map([["a", 5]]), true);
    registry.apply(new Map([["a", 7]]), true);
    await flush();
    expect(animations.filter((animation) => animation.started).map((animation) => animation.toValue)).toEqual([7]);
  });

  it("une nouvelle cible arrête l'animation en cours puis repart de la position courante", async () => {
    const registry = new AnimatedShiftRegistry();
    registry.value("a", 0);
    registry.apply(new Map([["a", 5]]), true);
    await flush();
    registry.apply(new Map([["a", 0]]), true);
    expect(animations[0]!.stopped).toBe(true);
    await flush();
    expect(animations[1]).toMatchObject({ toValue: 0, started: true });
  });

  it("stopAll puis apply : les clés sont relancées", async () => {
    const registry = new AnimatedShiftRegistry();
    registry.value("a", 0);
    registry.apply(new Map([["a", 5]]), true);
    await flush();
    registry.stopAll();
    expect(animations[0]!.stopped).toBe(true);
    registry.apply(new Map([["a", 5]]), true);
    await flush();
    expect(animations).toHaveLength(2);
    expect(animations[1]).toMatchObject({ toValue: 5, started: true });
  });

  it("story 5.2b — pose de départ (`release`) : posée sans animation, une seule fois, puis retour animé", async () => {
    const registry = new AnimatedShiftRegistry();
    const a = registry.value("a", 0);
    const release = { key: "a", from: 120 };
    registry.apply(new Map([["a", 0]]), true, release);
    expect(valueOf(a)).toBe(120);
    await flush();
    expect(animations).toHaveLength(1);
    expect(animations[0]).toMatchObject({ toValue: 0, started: true, useNativeDriver: true, duration: DRAG_SHIFT_DURATION_MS });
    // Même pose rejouée (nouveau rendu) : ignorée.
    registry.apply(new Map([["a", 0]]), true, release);
    await flush();
    expect(animations).toHaveLength(1);
    // Maintien : pose de départ égale à la cible, aucune animation.
    const held = { key: "a", from: 40 };
    registry.apply(new Map([["a", 40]]), true, held);
    expect(valueOf(a)).toBe(40);
    await flush();
    expect(animations).toHaveLength(1);
  });

  it("story 5.2b — reset : animations arrêtées et toutes les valeurs à 0, de façon synchrone", async () => {
    const registry = new AnimatedShiftRegistry();
    const a = registry.value("a", 0);
    const b = registry.value("b", 0);
    registry.apply(
      new Map([
        ["a", 30],
        ["b", -30],
      ]),
      false,
    );
    registry.apply(
      new Map([
        ["a", 0],
        ["b", 0],
      ]),
      true,
    );
    await flush();
    expect(animations).toHaveLength(2);
    registry.reset();
    expect(animations.every((animation) => animation.stopped)).toBe(true);
    expect(valueOf(a)).toBe(0);
    expect(valueOf(b)).toBe(0);
  });

  it("story 5.2b — whenSettled : appelé une fois les animations terminées, pas avant ; désinscription", async () => {
    const registry = new AnimatedShiftRegistry();
    registry.value("a", 0);
    registry.apply(new Map([["a", 5]]), true);
    const settled = jest.fn();
    const ignored = jest.fn();
    registry.whenSettled(settled);
    const unsubscribe = registry.whenSettled(ignored);
    unsubscribe();
    await flush();
    expect(settled).not.toHaveBeenCalled();
    animations[0]!.finish();
    expect(settled).toHaveBeenCalledTimes(1);
    expect(ignored).not.toHaveBeenCalled();
    const idle = jest.fn();
    registry.whenSettled(idle);
    expect(idle).not.toHaveBeenCalled();
    await flush();
    expect(idle).toHaveBeenCalledTimes(1);
  });
});

/**
 * PRE-6 story 7.4 (commentaire 13 de la recette du 22/10) : sémantique du pilote NATIF reproduite.
 * Sur le pilote natif, la valeur JS d'une `Animated.Value` n'avance pas pendant l'animation ; à
 * l'arrêt (`stop`), le rappel de fin est appelé aussitôt (`TimingAnimation.stop`), mais le module
 * natif renvoie PLUS TARD la valeur atteinte, que React Native recopie dans la valeur JS
 * (`Animation.js` l. 144-151 → `AnimatedValue.__onAnimatedValueUpdateReceived`) avant de rerendre
 * les vues (sous Fabric, ce rendu porte la valeur JS dans l'arbre). Une pose immédiate faite
 * entre-temps (`setValue`) est donc écrasée par une valeur intermédiaire périmée.
 */
describe("AnimatedShiftRegistry — arrêt d'une animation native (PRE-6 story 7.4)", () => {
  type NativeLike = {
    readonly toValue: number;
    readonly value: Animated.Value;
    stopped: boolean;
  };
  let natives: NativeLike[] = [];
  beforeEach(() => {
    // Microtâches réelles : le registre diffère ses démarrages par `queueMicrotask`.
    jest.useFakeTimers({ doNotFake: ["queueMicrotask"] });
    natives = [];
    jest.spyOn(Animated, "timing").mockImplementation((value, config) => {
      const animatedValue = value as Animated.Value;
      const from = valueOf(animatedValue);
      const toValue = config.toValue as number;
      let onEnd: Animated.EndCallback | undefined;
      const native: NativeLike = { toValue, value: animatedValue, stopped: false };
      natives.push(native);
      return {
        start: (callback?: Animated.EndCallback) => {
          onEnd = callback;
        },
        stop: () => {
          native.stopped = true;
          // Rappel de fin aussitôt ; valeur atteinte (mi-course) renvoyée par le module natif plus tard.
          const reached = (from + toValue) / 2;
          onEnd?.({ finished: false });
          onEnd = undefined;
          setTimeout(() => {
            (animatedValue as unknown as { __onAnimatedValueUpdateReceived: (value: number) => void }).__onAnimatedValueUpdateReceived(
              reached,
            );
          }, 0);
        },
        reset: () => undefined,
      };
    });
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it("pose immédiate pendant une animation : la valeur reste à la cible après la fin native tardive", async () => {
    const registry = new AnimatedShiftRegistry();
    const a = registry.value("a", 0);
    registry.apply(new Map([["a", 88]]), true);
    await flush();
    expect(natives).toHaveLength(1);
    // Dépôt appliqué à mi-animation : remise à 0 immédiate.
    registry.apply(new Map([["a", 0]]), false);
    expect(natives[0]!.stopped).toBe(true);
    expect(valueOf(a)).toBe(0);
    jest.runOnlyPendingTimers();
    await flush();
    expect(valueOf(a)).toBe(0);
  });

  it("reset pendant un retour animé : toutes les valeurs restent à 0 après la fin native tardive", async () => {
    const registry = new AnimatedShiftRegistry();
    const a = registry.value("a", 0);
    registry.apply(new Map([["a", 0]]), true, { key: "a", from: 120 });
    await flush();
    registry.reset();
    jest.runOnlyPendingTimers();
    await flush();
    expect(valueOf(a)).toBe(0);
  });

  it("nouvelle cible animée : la fin tardive de l'animation arrêtée ne relance rien", async () => {
    const registry = new AnimatedShiftRegistry();
    registry.value("a", 0);
    registry.apply(new Map([["a", 88]]), true);
    await flush();
    registry.apply(new Map([["a", -88]]), true);
    await flush();
    jest.runOnlyPendingTimers();
    await flush();
    expect(natives).toHaveLength(2);
    expect(natives[1]!.stopped).toBe(false);
  });
});

describe("AnimatedShiftRegistry.prepareLayoutCommit (PRE-6 story 7.4, commentaire 14)", () => {
  beforeEach(() => {
    jest.useFakeTimers({ doNotFake: ["queueMicrotask"] });
  });
  afterEach(() => {
    jest.useRealTimers();
  });

  it("avant le rendu d'une nouvelle disposition : animations arrêtées, valeurs JS à 0 sans pose native ; pose native au `apply` suivant", async () => {
    const registry = new AnimatedShiftRegistry();
    const a = registry.value("a", 0);
    const b = registry.value("b", 0);
    registry.apply(
      new Map([
        ["a", -88],
        ["b", 0],
      ]),
      false,
    );
    registry.apply(
      new Map([
        ["a", -88],
        ["b", 40],
      ]),
      true,
    );
    await flush();
    const setValue = jest.spyOn(Animated.Value.prototype, "setValue");
    registry.prepareLayoutCommit();
    expect(animations[0]!.stopped).toBe(true);
    expect(valueOf(a)).toBe(0);
    expect(valueOf(b)).toBe(0);
    // Aucune pose native avant le rendu (le pilote natif garde l'aperçu affiché).
    expect(setValue).not.toHaveBeenCalled();
    registry.apply(
      new Map([
        ["a", 0],
        ["b", 0],
      ]),
      false,
    );
    expect(setValue.mock.calls.map(([value]) => value)).toEqual([0, 0]);
    await flush();
    expect(animations).toHaveLength(1);
  });

  it("sans `apply` après le rendu : la pose native a lieu une tâche plus tard", () => {
    const registry = new AnimatedShiftRegistry();
    registry.value("a", 0);
    registry.apply(new Map([["a", 30]]), false);
    const setValue = jest.spyOn(Animated.Value.prototype, "setValue");
    registry.prepareLayoutCommit();
    expect(setValue).not.toHaveBeenCalled();
    jest.runOnlyPendingTimers();
    expect(setValue.mock.calls.map(([value]) => value)).toEqual([0]);
  });
});

describe("AnimatedShiftRegistry.resyncNative (PRE-6 story 7.5, d-17)", () => {
  it("renvoie la cible posée des clés au repos (même valeur), jamais celle d'une clé en animation", async () => {
    const registry = new AnimatedShiftRegistry();
    registry.value("a", 0);
    registry.value("b", 0);
    registry.apply(
      new Map([
        ["a", 0],
        ["b", 0],
      ]),
      false,
    );
    registry.apply(
      new Map([
        ["a", 0],
        ["b", 30],
      ]),
      true,
    );
    await flush();
    const setValue = jest.spyOn(Animated.Value.prototype, "setValue");
    registry.resyncNative(["a", "b", "inconnue"]);
    expect(setValue.mock.calls.map(([value]) => value)).toEqual([0]);
    expect(animations[0]!.stopped).toBe(false);
  });
});
