import { useLayoutEffect, useState } from "react";
import { Animated } from "react-native";

import { MOTION_EASING, MOTION_SHIFT_DURATION_MS } from "@/features/sessions/compositionMotion";

/**
 * PRE-6 (story 2.3b) : durée d'un décalage animé pendant le glisser. Story 7.6 : celle du jeu de
 * mouvements partagé (`compositionMotion.ts`, 320 ms, courbe à décélération marquée).
 */
export const DRAG_SHIFT_DURATION_MS = MOTION_SHIFT_DURATION_MS;

/** Revue 7.6 : retard estimé du départ natif d'une animation (une image). */
const NATIVE_START_LAG_MS = 16;

/**
 * PRE-6 (story 2.3b, story 5.2) : translations animées PARTAGÉES de la séquence de la Composition,
 * une par élément (clé stable : occurrence, en-tête et bas du Circuit, rangée « après le Circuit »,
 * Fin de séance). Translation seule — aucun recalcul de mise en page —, durée et courbe partagées
 * (story 7.6, `compositionMotion.ts`),
 * pilote natif. Remplace le décalage par élément de la story 2.3b (`useAnimatedShift`, retiré).
 *
 * Pourquoi un registre : le lien de rail d'un élément s'étire de la différence entre SA translation
 * et celle de son prédécesseur (`compositionRail.ts`). Il lui faut donc la valeur animée même de
 * son prédécesseur — l'objet qui translate ce prédécesseur —, pas une copie : une copie démarrée à
 * un autre instant, ou créée quand le prédécesseur change (retour d'un dépôt refusé, « Annuler »
 * d'une confirmation de perte), divergerait le temps de l'animation. Story 5.2b : la carte relâchée
 * revient par ce même registre (pose de départ `release`, puis cible 0), synchronisée avec ses
 * voisines, et reste dans la chaîne du rail.
 *
 * Démarrage différé d'une microtâche : React Native détache les propriétés animées d'un composant
 * démonté dans une microtâche (`createAnimatedPropsHook`). Les valeurs étant partagées, le graphe
 * animé relie plusieurs éléments ; une animation native démarrée dans le même rendu qu'un démontage
 * (un lien de rail qui disparaît, une occurrence supprimée pendant le geste) atteindrait les
 * propriétés encore attachées du composant démonté (« Unable to find node on an unmounted
 * component »). L'ordre des microtâches n'étant pas un contrat, le démarrage revérifie au moment
 * venu que la clé est toujours visée, à la même cible, avec la même valeur (jeton par clé) ; sinon
 * il est abandonné. Une pose immédiate (`animated` faux) reste synchrone, avant l'affichage.
 *
 * PRE-6 story 7.4 (commentaires 13 et 14 de la recette du 22/10) — cohérence avec le pilote natif.
 * Sous Fabric, chaque rendu d'une vue animée porte dans l'arbre la valeur JS de ses valeurs animées
 * (`AnimatedProps.__getValueWithStaticProps`) ; or, sur le pilote natif, la valeur JS n'avance pas
 * pendant l'animation. À l'ARRÊT d'une animation, le rappel de fin est appelé aussitôt
 * (`TimingAnimation.stop`), mais le module natif renvoie PLUS TARD la valeur atteinte, que React
 * Native recopie dans la valeur JS (`Animation.js` l. 144-151 → `__onAnimatedValueUpdateReceived`)
 * avant de rerendre les vues (`createAnimatedPropsHook.js` l. 135-143). Deux conséquences, corrigées :
 * - une pose immédiate faite après l'arrêt (`setValue` d'un dépôt appliqué, `reset` d'un nouveau
 *   geste) était écrasée par cette valeur intermédiaire : carte figée à mi-chemin, rail discontinu,
 *   bords du Circuit décalés, jusqu'au `reset` du soulèvement suivant. Chaque valeur du registre
 *   filtre donc cette recopie (`guardNativeEcho`) : reçue alors qu'aucune animation n'est en cours
 *   ni en attente pour la clé, elle est ramenée à la cible posée, avant le rendu qu'elle déclenche ;
 * - une nouvelle disposition (dépôt appliqué, confirmation) était rendue avec les translations de
 *   l'aperçu, remises à 0 seulement après le rendu : le Circuit agrandi apparaissait avec ses bords
 *   encore décalés. `prepareLayoutCommit`, appelé AVANT les écritures d'état, arrête les animations
 *   et met les valeurs JS à 0 : le rendu de la nouvelle disposition porte des translations nulles ;
 *   le pilote natif est mis à 0 juste après, par `apply`.
 */
export class AnimatedShiftRegistry {
  private readonly values = new Map<string, Animated.Value>();
  /** Dernière cible posée par clé. */
  private readonly applied = new Map<string, number>();
  private readonly running = new Map<string, Animated.CompositeAnimation>();
  /** Démarrage différé en attente, par clé (jeton) : une pose ultérieure de la même clé l'annule. */
  private readonly pending = new Map<string, number>();
  private nextToken = 0;
  /** Dernière pose de départ consommée (identité) : une pose n'est appliquée qu'une fois. */
  private lastRelease: ShiftRelease | null = null;
  private settledListeners: (() => void)[] = [];
  /** Story 7.4 : clés dont la valeur JS a été posée sans le pilote natif (`prepareLayoutCommit`). */
  private readonly nativeStale = new Set<string>();
  private nativeSyncTimer: ReturnType<typeof setTimeout> | null = null;
  /**
   * Story 7.6 : mouvement en cours par clé (départ, cible, instant), pour ESTIMER la position atteinte
   * — la valeur JS n'avance pas sur le pilote natif — et position de départ reportée d'une clé dont
   * l'animation, relancée, n'a pas encore démarré.
   */
  private readonly motions = new Map<string, { readonly from: number; readonly to: number; readonly start: number }>();
  private readonly carried = new Map<string, number>();
  /** Revue 7.6 : clés dont l'animation arrêtée doit encore renvoyer sa valeur atteinte. */
  private readonly echoExpected = new Set<string>();

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
      this.guardNativeEcho(key, shift);
      this.values.set(key, shift);
      this.applied.set(key, initial);
    }
    return shift;
  }

  /**
   * Pose les cibles : seule une clé dont la cible change est relancée, depuis sa position courante ;
   * `animated` faux la pose immédiatement (et fige une animation en cours vers la même cible). Les
   * clés disparues sont libérées.
   *
   * PRE-6 story 5.2b : `release` (consommée une seule fois, par identité) pose d'abord, sans
   * animation, la translation de départ d'une clé — la carte relâchée, prise là où le doigt l'a
   * laissée — ; sa cible est ensuite posée comme les autres (retour animé vers 0, ou maintien).
   */
  apply(targets: ReadonlyMap<string, number>, animated: boolean, release: ShiftRelease | null = null): void {
    if (release !== null && release !== this.lastRelease) {
      this.lastRelease = release;
      if (targets.has(release.key)) {
        const shift = this.value(release.key, release.from);
        this.cancel(release.key);
        shift.stopAnimation();
        shift.setValue(release.from);
        this.applied.set(release.key, release.from);
        this.carried.set(release.key, release.from);
      }
    }
    for (const [key, target] of targets) {
      const shift = this.value(key, target);
      if (this.nativeStale.delete(key)) {
        // Story 7.4 : le pilote natif rejoint la valeur JS posée avant le rendu.
        shift.setValue(this.applied.get(key) ?? target);
      }
      const busy = this.running.has(key) || this.pending.has(key);
      if (this.applied.get(key) === target && (animated || !busy)) continue;
      // Story 7.6 : position atteinte, d'où repart l'animation suivante.
      const at = this.position(key);
      this.applied.set(key, target);
      this.cancel(key);
      if (!animated) {
        shift.stopAnimation();
        shift.setValue(target);
        this.carried.delete(key);
        continue;
      }
      this.carried.set(key, at);
      const token = ++this.nextToken;
      this.pending.set(key, token);
      queueMicrotask(() => this.start(key, token, shift, target));
    }
    for (const key of [...this.values.keys()]) {
      if (targets.has(key)) continue;
      this.cancel(key);
      this.values.delete(key);
      this.applied.delete(key);
      this.nativeStale.delete(key);
      this.carried.delete(key);
      this.motions.delete(key);
    }
    this.clearNativeSyncIfIdle();
    this.notifyIfSettled();
  }

  private clearNativeSyncIfIdle(): void {
    if (this.nativeStale.size === 0 && this.nativeSyncTimer !== null) {
      clearTimeout(this.nativeSyncTimer);
      this.nativeSyncTimer = null;
    }
  }

  /**
   * PRE-6 story 7.4 : à appeler AVANT les écritures d'état qui produisent une nouvelle disposition
   * (dépôt appliqué, confirmation d'un dialogue, entrée en placement) avec toutes les translations
   * à 0. Arrête les animations et met les valeurs JS à 0 sans passer par le pilote natif : le rendu
   * de la nouvelle disposition porte des translations nulles (sous Fabric, la mise en page et les
   * translations arrivent ensemble), et l'écran garde jusque-là l'aperçu affiché (le pilote natif
   * reste à la position atteinte). Le pilote natif est mis à 0 par l'`apply` qui suit le rendu, à
   * défaut au plus tard une tâche plus tard.
   *
   * PRE-6 story 7.6 : `pose` — l'élément déposé n'est pas posé à 0 mais à la translation qui le
   * garde là où le doigt l'a lâché dans la NOUVELLE disposition (`from`) ; l'`apply` animé qui suit
   * le ramène à 0 : il glisse jusqu'à sa place au lieu d'y sauter. Story 7.6 encore : avec
   * `continueExcept` (non nul : l'`apply` qui suit est animé), une clé encore en mouvement (dépôt
   * pendant le décalage des voisines) est posée au reste de son chemin (position atteinte estimée
   * moins sa cible) au lieu de sauter à sa place — sauf les clés de `continueExcept` ; l'`apply`
   * animé suivant achève ce chemin. Sans `continueExcept` : tout à 0 (story 7.4).
   */
  prepareLayoutCommit(pose: ShiftRelease | null = null, continueExcept: ReadonlySet<string> | null = null): void {
    for (const [key, shift] of this.values) {
      const remaining =
        continueExcept === null || continueExcept.has(key) ? 0 : this.position(key) - (this.applied.get(key) ?? 0);
      const posed = pose !== null && pose.key === key ? pose.from : Math.abs(remaining) < 0.5 ? 0 : remaining;
      // Revue 7.4 : seules les clés déplacées ou en mouvement (au repos, rien à poser).
      if (posed === 0 && this.applied.get(key) === 0 && !this.running.has(key) && !this.pending.has(key) && jsValueOf(shift) === 0) {
        continue;
      }
      this.cancel(key);
      shift.stopAnimation();
      // Cible posée d'abord : la recopie filtrée (`guardNativeEcho`) la reconnaît.
      this.applied.set(key, posed);
      setJsValue(shift, posed);
      this.carried.set(key, posed);
      this.nativeStale.add(key);
    }
    if (this.nativeSyncTimer === null && this.nativeStale.size > 0) {
      this.nativeSyncTimer = setTimeout(() => {
        this.nativeSyncTimer = null;
        for (const key of [...this.nativeStale]) {
          this.nativeStale.delete(key);
          this.values.get(key)?.setValue(this.applied.get(key) ?? 0);
        }
      }, 0);
    }
    this.notifyIfSettled();
  }

  /**
   * PRE-6 story 7.5 (recette J6, d-17) : renvoie au pilote natif la cible posée des clés `keys`
   * (celles qui ne sont ni en animation ni en attente), après un changement de TAILLE de leur vue.
   *
   * Sous Fabric iOS, la translation d'une vue animée par le pilote natif n'est plus appliquée par
   * les commits (`RCTViewComponentView.mm` l. 351-353, `propKeysManagedByAnimated`) ; mais quand la
   * taille de la vue change, Fabric RECALCULE sa translation à partir des propriétés qu'il a gardées
   * (l. 650-658), qui peuvent porter une translation périmée de l'aperçu — le fond du Circuit
   * (`CircuitSurface`, bande étirée : zone grise sur la carte du dessus, ou rectangle blanc dans le
   * Circuit) reste alors décalé jusqu'à la prochaine pose native (un appui long : `reset`). Une pose
   * native, même à la même valeur, rétablit la translation de la vue.
   */
  resyncNative(keys: readonly string[]): void {
    for (const key of keys) {
      const shift = this.values.get(key);
      const target = this.applied.get(key);
      if (shift === undefined || target === undefined || this.running.has(key) || this.pending.has(key)) continue;
      this.nativeStale.delete(key);
      shift.setValue(target);
    }
    this.clearNativeSyncIfIdle();
  }

  /**
   * PRE-6 story 5.2b : nouveau geste pendant un retour — arrête toutes les animations et pose
   * toutes les valeurs à 0, de façon synchrone : l'écran rejoint la mise en page mesurée avant le
   * relevé du geste (`originLayout`).
   */
  reset(): void {
    for (const [key, shift] of this.values) {
      this.cancel(key);
      shift.stopAnimation();
      shift.setValue(0);
      this.applied.set(key, 0);
      this.nativeStale.delete(key);
      this.carried.delete(key);
    }
    this.clearNativeSyncIfIdle();
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
    this.nativeStale.clear();
    this.carried.clear();
    this.motions.clear();
    this.echoExpected.clear();
    if (this.nativeSyncTimer !== null) clearTimeout(this.nativeSyncTimer);
    this.nativeSyncTimer = null;
    this.notifyIfSettled();
  }

  /**
   * PRE-6 story 5.2b : appelle `listener` une fois toutes les animations terminées (aucune en
   * cours ni en attente) — au plus tôt dans une microtâche. Sert seulement à garder au premier
   * plan la carte qui revient, le temps de son retour. Rend la désinscription.
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
    const from = this.carried.get(key) ?? jsValueOf(shift) ?? target;
    this.carried.delete(key);
    // Revue 7.6 : l'animation native ne part qu'à l'image suivante — l'estimation en tient compte.
    this.motions.set(key, { from, to: target, start: Date.now() + NATIVE_START_LAG_MS });
    const animation = Animated.timing(shift, {
      toValue: target,
      duration: DRAG_SHIFT_DURATION_MS,
      // Story 7.6 : arrêt progressif, sans rebond (`compositionMotion.ts`).
      easing: MOTION_EASING,
      useNativeDriver: true,
    });
    this.running.set(key, animation);
    animation.start(() => {
      if (this.running.get(key) === animation) {
        this.running.delete(key);
        this.motions.delete(key);
      }
      this.notifyIfSettled();
    });
  }

  /**
   * Story 7.6 : position estimée d'une clé — en mouvement : d'après sa courbe et le temps écoulé
   * (le pilote natif ne renvoie pas la position en continu) ; relancée sans avoir démarré : la
   * position reportée ; au repos : sa cible posée.
   */
  private position(key: string): number {
    const motion = this.motions.get(key);
    if (this.running.has(key) && motion !== undefined) {
      const progress = Math.min(1, Math.max(0, (Date.now() - motion.start) / DRAG_SHIFT_DURATION_MS));
      return motion.from + (motion.to - motion.from) * MOTION_EASING(progress);
    }
    return this.carried.get(key) ?? this.applied.get(key) ?? 0;
  }

  /**
   * PRE-6 story 7.4 (commentaire 13) : filtre de la recopie native d'une valeur atteinte. React
   * Native appelle `__onAnimatedValueUpdateReceived` à la fin native d'une animation (achevée : la
   * cible ; arrêtée : la valeur atteinte, plus tard que le rappel de fin) puis rerend les vues. Reçue
   * quand aucune animation de la clé n'est en cours ni en attente, une valeur différente de la cible
   * posée est périmée : la valeur JS est ramenée à cette cible (le module natif l'a déjà reçue par
   * `setValue`), avant le rendu. Méthode interne de React Native : sans elle, rien n'est filtré.
   */
  private guardNativeEcho(key: string, shift: Animated.Value): void {
    const internal = shift as unknown as { __onAnimatedValueUpdateReceived?: (value: number, offset?: number) => void };
    const receive = internal.__onAnimatedValueUpdateReceived;
    if (typeof receive !== "function") return;
    internal.__onAnimatedValueUpdateReceived = (value: number, offset?: number) => {
      receive.call(shift, value, offset);
      if (this.values.get(key) !== shift) return;
      const moving = this.running.has(key) || this.pending.has(key);
      if (moving && this.echoExpected.delete(key)) {
        // Revue 7.6 : recopie d'une animation arrêtée pendant qu'une autre a repris la clé — valeur
        // de l'ancienne course ; la valeur JS est ramenée au départ de la nouvelle.
        const restart = this.motions.get(key)?.from ?? this.carried.get(key);
        if (restart !== undefined && value !== this.applied.get(key)) receive.call(shift, restart);
        return;
      }
      this.echoExpected.delete(key);
      if (moving) return;
      const target = this.applied.get(key);
      if (target !== undefined && value !== target) receive.call(shift, target);
    };
  }

  private cancel(key: string): void {
    const animation = this.running.get(key);
    this.running.delete(key);
    this.pending.delete(key);
    // Revue 7.6 : la recopie native de l'animation arrêtée arrivera plus tard (`guardNativeEcho`).
    if (animation !== undefined) this.echoExpected.add(key);
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
 * PRE-6 story 7.4 : valeur JS courante d'une valeur animée (`AnimatedValue.__getValue`, interne de
 * React Native, aucune API publique ne la lit sans passer par le pilote natif). `null` si absente.
 */
function jsValueOf(value: Animated.Value): number | null {
  const read = (value as unknown as { __getValue?: () => number }).__getValue;
  return typeof read === "function" ? read.call(value) : null;
}

/**
 * PRE-6 story 7.4 : pose la seule valeur JS (`AnimatedValue.__onAnimatedValueUpdateReceived`, le
 * chemin interne par lequel React Native recopie une valeur native dans la valeur JS), sans opération
 * native. À défaut, `setValue` (pose JS et native).
 */
function setJsValue(value: Animated.Value, next: number): void {
  const receive = (value as unknown as { __onAnimatedValueUpdateReceived?: (value: number) => void })
    .__onAnimatedValueUpdateReceived;
  if (typeof receive === "function") receive.call(value, next);
  else value.setValue(next);
}

/** PRE-6 story 5.2b : translation de départ d'une clé, posée sans animation avant ses cibles. */
export type ShiftRelease = { readonly key: string; readonly from: number };

/**
 * Registre des translations de la séquence, cibles posées dans un effet de mise en page : la remise
 * à 0 d'un dépôt appliqué précède l'affichage de la nouvelle disposition, sans saut.
 */
export function useAnimatedShiftRegistry(
  targets: ReadonlyMap<string, number>,
  animated: boolean,
  release: ShiftRelease | null = null,
): AnimatedShiftRegistry {
  const [registry] = useState(() => new AnimatedShiftRegistry());
  useLayoutEffect(() => {
    registry.apply(targets, animated, release);
  }, [animated, registry, release, targets]);
  useLayoutEffect(() => () => registry.stopAll(), [registry]);
  return registry;
}
