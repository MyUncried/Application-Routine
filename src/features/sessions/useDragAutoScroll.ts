import { useEffect, useState } from "react";

import {
  autoScrollVelocity,
  clampScrollOffset,
  type AutoScrollViewport,
} from "@/features/sessions/compositionGesture";

/**
 * PRE-6 story 7.4 (D-437, commentaire 3 de la recette du 22/10) : défilement automatique de la liste
 * de la Composition pendant le glisser d'une carte ou d'un Point d'arrêt.
 *
 * Quand le doigt approche du bord haut ou bas de la zone visible de la liste (bande de bord,
 * `autoScrollVelocity`), la liste défile à chaque trame (`requestAnimationFrame`, `scrollTo` sans
 * animation : React Native n'offre aucun défilement automatique natif pendant un geste, et aucune
 * bibliothèque n'est ajoutée). Le défilement s'arrête hors de la bande, au bord du contenu, et à la
 * fin du geste (`end` : dépôt, annulation — un dialogue n'apparaît qu'après le dépôt).
 *
 * Repères : les positions relevées au début du geste (`originLayout`) sont dans le repère du CONTENU
 * défilant ; la translation de l'élément soulevé l'est aussi. Le défilement accumulé depuis le début
 * du geste (`track`, rappel de trame) s'ajoute donc au déplacement du doigt : l'élément reste sous le
 * doigt, et l'emplacement visé, les décalages des voisines, le rail et le Circuit, calculés dans le
 * repère du contenu, suivent sans autre changement.
 *
 * Pendant le geste, le défilement par l'utilisateur est coupé (`scrollEnabled`) : seul ce module
 * déplace la liste, et il tient lui-même son décalage (les événements `onScroll`, en retard d'une
 * trame, sont ignorés tant qu'un geste est en cours).
 */
export type DragAutoScroll = {
  /** Début du geste (élément soulevé) : origine du défilement accumulé ; zone visible relevée. */
  begin(): void;
  /** Rappel de trame de l'élément soulevé (défilement accumulé), pour le suivre sans mouvement du doigt. */
  attach(listener: ((scrollDelta: number) => void) | null): void;
  /** Position du doigt (`pageY`) ; rend le défilement accumulé depuis `begin`. */
  track(pageY: number): number;
  /** Fin du geste : arrêt du défilement. */
  end(): void;
};

/** Accès au conteneur défilant (injecté : testable sans vue native). */
export type AutoScrollTarget = {
  readonly scrollTo: (offset: number) => void;
  /** Zone visible dans le repère de l'écran ; rappel absent si la mesure est impossible. */
  readonly measure: (callback: (top: number, height: number) => void) => void;
  /**
   * PRE-6 story 7.10 (D-439) : hauteur recouverte au bas de la zone visible par une zone fixe
   * (zone d'action principale) — elle remonte la bande du bas du défilement automatique ; le
   * décalage maximal, lui, reste calculé sur la hauteur pleine du conteneur. 0 par défaut.
   */
  readonly bottomObstruction?: () => number;
};

/** Durée d'une première trame (aucune trame précédente), et borne d'une trame tardive (ms). */
const NOMINAL_FRAME_MS = 1000 / 60;
const MAX_FRAME_MS = 50;

export class DragAutoScrollController implements DragAutoScroll {
  private offset = 0;
  private contentHeight = 0;
  private layoutHeight = 0;
  private viewport: AutoScrollViewport = { top: 0, height: 0 };
  private active = false;
  private startOffset = 0;
  private pointerY: number | null = null;
  private frame: number | null = null;
  private lastTime: number | null = null;
  private listener: ((scrollDelta: number) => void) | null = null;

  constructor(private readonly target: AutoScrollTarget) {}

  /** `onScroll` du conteneur (hors geste seulement : pendant le geste, ce module tient le décalage). */
  handleScroll(offset: number): void {
    if (!this.active && Number.isFinite(offset)) this.offset = offset;
  }

  /** `onContentSizeChange` du conteneur. */
  handleContentSize(height: number): void {
    if (Number.isFinite(height)) this.contentHeight = height;
  }

  /** `onLayout` du conteneur : hauteur visible ; zone relevée dans le repère de l'écran. */
  handleLayout(height: number): void {
    if (Number.isFinite(height)) this.layoutHeight = height;
    this.measureViewport();
  }

  begin(): void {
    this.stopLoop();
    this.active = true;
    this.startOffset = this.offset;
    this.pointerY = null;
    this.listener = null;
    this.measureViewport();
  }

  attach(listener: ((scrollDelta: number) => void) | null): void {
    if (this.active) this.listener = listener;
  }

  track(pageY: number): number {
    if (!this.active) return 0;
    this.pointerY = pageY;
    if (this.frame === null && this.velocity() !== 0) {
      this.lastTime = null;
      this.frame = requestAnimationFrame(this.step);
    }
    return this.offset - this.startOffset;
  }

  end(): void {
    this.active = false;
    this.pointerY = null;
    this.listener = null;
    this.stopLoop();
  }

  private measureViewport(): void {
    this.target.measure((top, height) => {
      const measured = height > 0 ? height : this.layoutHeight;
      if (Number.isFinite(top) && measured > 0) this.viewport = { top, height: measured };
    });
  }

  private viewportHeight(): number {
    return this.viewport.height > 0 ? this.viewport.height : this.layoutHeight;
  }

  /** Vitesse de la trame : nulle au bord du contenu dans le sens du défilement. */
  private velocity(): number {
    if (this.pointerY === null) return 0;
    const obstruction = Math.max(0, this.target.bottomObstruction?.() ?? 0);
    const visible = { top: this.viewport.top, height: Math.max(0, this.viewport.height - obstruction) };
    const speed = autoScrollVelocity(this.pointerY, visible);
    const max = clampScrollOffset(Number.POSITIVE_INFINITY, this.contentHeight, this.viewportHeight());
    if ((speed < 0 && this.offset <= 0) || (speed > 0 && this.offset >= max)) return 0;
    return speed;
  }

  private readonly step = (time: number): void => {
    this.frame = null;
    if (!this.active) return;
    const speed = this.velocity();
    if (speed === 0) return;
    const elapsed =
      this.lastTime === null || !Number.isFinite(time) ? NOMINAL_FRAME_MS : Math.min(MAX_FRAME_MS, Math.max(0, time - this.lastTime));
    this.lastTime = Number.isFinite(time) ? time : null;
    const next = clampScrollOffset(this.offset + (speed * elapsed) / 1000, this.contentHeight, this.viewportHeight());
    if (next !== this.offset) {
      this.offset = next;
      this.target.scrollTo(next);
      this.listener?.(next - this.startOffset);
    }
    this.frame = requestAnimationFrame(this.step);
  };

  private stopLoop(): void {
    if (this.frame !== null) cancelAnimationFrame(this.frame);
    this.frame = null;
    this.lastTime = null;
  }
}

/** Contrôleur stable de l'écran ; arrêté au démontage. */
export function useDragAutoScroll(target: AutoScrollTarget): DragAutoScrollController {
  const [controller] = useState(() => new DragAutoScrollController(target));
  useEffect(() => () => controller.end(), [controller]);
  return controller;
}
