import { useLayoutEffect, useState } from "react";
import { Animated, Easing } from "react-native";

/** PRE-6 (story 2.3b) : durée d'un décalage animé pendant le glisser (fourchette 150–200 ms). */
export const DRAG_SHIFT_DURATION_MS = 180;

/**
 * PRE-6 (story 2.3b, story 5.2) : translations animées PARTAGÉES de la séquence de la Composition,
 * une par élément (clé stable : occurrence, en-tête et bas du Circuit, rangée « après le Circuit »,
 * Fin de séance). Translation seule — aucun recalcul de mise en page —, 180 ms, courbe douce,
 * pilote natif. Remplace le décalage par élément de la story 2.3b (`useAnimatedShift`, retiré).
 *
 * Pourquoi un registre : le lien de rail d'un élément s'étire de la différence entre SA translation
 * et celle de son prédécesseur (`compositionRail.ts`). Il lui faut donc la valeur animée même de
 * son prédécesseur — l'objet qui translate ce prédécesseur —, pas une copie : une copie démarrée à
 * un autre instant, ou créée quand le prédécesseur change (retour d'un dépôt refusé, « Annuler »
 * d'une confirmation de perte), divergerait le temps de l'animation.
 *
 * Démarrage différé d'une microtâche : React Native détache les propriétés animées d'un composant
 * démonté dans une microtâche (`createAnimatedPropsHook`). Les valeurs étant partagées, le graphe
 * animé relie plusieurs éléments ; une animation native démarrée dans le même rendu qu'un démontage
 * (un lien de rail qui disparaît, une occurrence supprimée pendant le geste) atteindrait les
 * propriétés encore attachées du composant démonté (« Unable to find node on an unmounted
 * component »). L'ordre des microtâches n'étant pas un contrat, le démarrage revérifie au moment
 * venu que la clé est toujours visée, à la même cible, avec la même valeur (jeton par clé) ; sinon
 * il est abandonné. Une pose immédiate (`animated` faux) reste synchrone, avant l'affichage.
 */
export class AnimatedShiftRegistry {
  private readonly values = new Map<string, Animated.Value>();
  /** Dernière cible posée par clé. */
  private readonly applied = new Map<string, number>();
  private readonly running = new Map<string, Animated.CompositeAnimation>();
  /** Démarrage différé en attente, par clé (jeton) : une pose ultérieure de la même clé l'annule. */
  private readonly pending = new Map<string, number>();
  private nextToken = 0;
  private settledListeners: (() => void)[] = [];

  /**
   * Valeur animée d'une clé ; créée au besoin à `initial` (sa cible courante) — un élément qui
   * apparaît est déjà à sa place. Appelée pendant le rendu : la création est idempotente (même clé,
   * même objet ; un double rendu ne crée rien de plus) et sans effet observable (aucune animation,
   * aucun abonnement) ; `apply`, dans un effet, pose ensuite les cibles.
   */
  value(key: string, initial: number): Animated.Value {
    let shift = this.values.get(key);
    if (shift === undefined) {
      shift = new Animated.Value(initial);
      this.values.set(key, shift);
      this.applied.set(key, initial);
    }
    return shift;
  }

  /**
   * Pose les cibles : seule une clé dont la cible change est relancée, depuis sa position courante ;
   * `animated` faux la pose immédiatement (et fige une animation en cours vers la même cible). Les
   * clés disparues sont libérées.
   */
  apply(targets: ReadonlyMap<string, number>, animated: boolean): void {
    for (const [key, target] of targets) {
      const shift = this.value(key, target);
      const busy = this.running.has(key) || this.pending.has(key);
      if (this.applied.get(key) === target && (animated || !busy)) continue;
      this.applied.set(key, target);
      this.cancel(key);
      if (!animated) {
        shift.stopAnimation();
        shift.setValue(target);
        continue;
      }
      const token = ++this.nextToken;
      this.pending.set(key, token);
      queueMicrotask(() => this.start(key, token, shift, target));
    }
    for (const key of [...this.values.keys()]) {
      if (targets.has(key)) continue;
      this.cancel(key);
      this.values.delete(key);
      this.applied.delete(key);
    }
    this.notifyIfSettled();
  }

  /**
   * Arrête tout (démontage) : animations en cours et démarrages en attente. Les cibles posées sont
   * oubliées : un `apply` suivant relance chaque clé depuis sa position courante.
   */
  stopAll(): void {
    for (const animation of this.running.values()) animation.stop();
    this.running.clear();
    this.pending.clear();
    this.applied.clear();
    this.notifyIfSettled();
  }

  /**
   * PRE-6 (story 5.2, revue) : appelle `listener` une fois toutes les animations terminées (aucune
   * en cours ni en attente) — au plus tôt dans une microtâche. Rend la désinscription.
   */
  whenSettled(listener: () => void): () => void {
    this.settledListeners.push(listener);
    queueMicrotask(() => this.notifyIfSettled());
    return () => {
      this.settledListeners = this.settledListeners.filter((candidate) => candidate !== listener);
    };
  }

  private start(key: string, token: number, shift: Animated.Value, target: number): void {
    if (this.pending.get(key) !== token || this.values.get(key) !== shift || this.applied.get(key) !== target) {
      return;
    }
    this.pending.delete(key);
    const animation = Animated.timing(shift, {
      toValue: target,
      duration: DRAG_SHIFT_DURATION_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    this.running.set(key, animation);
    animation.start(() => {
      if (this.running.get(key) === animation) this.running.delete(key);
      this.notifyIfSettled();
    });
  }

  private cancel(key: string): void {
    const animation = this.running.get(key);
    this.running.delete(key);
    this.pending.delete(key);
    animation?.stop();
  }

  private notifyIfSettled(): void {
    if (this.running.size > 0 || this.pending.size > 0 || this.settledListeners.length === 0) return;
    const listeners = this.settledListeners;
    this.settledListeners = [];
    for (const listener of listeners) listener();
  }
}

/**
 * Registre des translations de la séquence, cibles posées dans un effet de mise en page : la remise
 * à 0 d'un dépôt appliqué précède l'affichage de la nouvelle disposition, sans saut.
 */
export function useAnimatedShiftRegistry(targets: ReadonlyMap<string, number>, animated: boolean): AnimatedShiftRegistry {
  const [registry] = useState(() => new AnimatedShiftRegistry());
  useLayoutEffect(() => {
    registry.apply(targets, animated);
  }, [animated, registry, targets]);
  useLayoutEffect(() => () => registry.stopAll(), [registry]);
  return registry;
}
