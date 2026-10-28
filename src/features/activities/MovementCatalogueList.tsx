import { Image } from "expo-image";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Animated,
  Modal,
  Pressable,
  type ScrollView,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { decodeInstructionSteps } from "@/domain/activities/instructionSteps";
import type { MovementFamilyOutcome, MovementPriorMemberships } from "@/domain/activities/MovementRepository";
import type { MovementLevelPosition } from "@/domain/activities/movementSuggestion";
import { fillTemplate } from "@/features/activities/movementChoicePresentation";
import type { VariantPlacement } from "@/features/activities/MovementResultCard";
import { useActivityDefinitionService } from "@/features/activities/ActivityDefinitionServiceContext";
import { MediaPreview, firstMediaPreviewSource, useMediaUriResolver } from "@/features/activities/MediaPreview";
import { levelPastilleLabel } from "@/features/activities/MovementLevelMenu";
import {
  familyPositionOf,
  type MovementCatalogueEntry,
  type MovementCatalogueService,
  type MovementLifecycleResult,
} from "@/features/activities/MovementCatalogueService";
import { MOTION_EASING, MOTION_SHIFT_DURATION_MS } from "@/features/sessions/compositionMotion";
import { DecisionDialog } from "@/features/sessions/DecisionDialog";
import { strings } from "@/shared/i18n";
import { TransientNotification } from "@/shared/ui/TransientNotification";
import { colors, dimensions, fixedRadii, layout, minTouchTarget, spacing, type } from "@/shared/ui/tokens";
import { useReduceMotion } from "@/shared/ui/useReduceMotion";

import {
  movedTo,
  reorderedFamilyIds,
  visibleMovementItems,
  type MovementCatalogueFilters,
  type MovementCatalogueItem,
} from "./movementCatalogueView";
import { autoScrollDirection, dragIntent, placedOrder, previewLevels, reorderAnchor, type DragIntent, type DragSlot } from "./movementFamilyDrag";
import { SheetMotionProvider, SheetMotionScrollView, SheetMotionView } from "./SheetMotion";
import { SWIPE_ACTION_WIDTH, SwipeActionsRow, type SwipeAccessibilityAction, type SwipeAction } from "./SwipeActionsRow";

/**
 * PRE-8 — segment « Mouvements » du Catalogue : catalogue d'ENTRETIEN des Mouvements persistants,
 * distinct du Catalogue des Séances et sans contenu lançable (B.3), complété par les arbitrages de
 * Hermann du 27/10/2026 :
 *
 * - **B.5 Piles** (Figma `10266:20575`, `10471:23291`) : une famille d'au moins deux membres
 *   affichés est une pile, rang le plus haut en tête (Q-B2) ; toucher une pile fermée la déplie ;
 *   dépliée, chaque carte ouvre sa fiche et la marge gauche (filet de famille) la replie. La
 *   recherche présente les mêmes piles dépliables. Rangs de la famille complète, archivés compris.
 * - **B.6 Actions glissées** (`10475:47634`) : « Partager » grisé (non opérationnel), « Ajouter un
 *   niveau » déploie le choix Plus facile / Plus difficile sous les actions puis ouvre la fiche du
 *   nouveau Niveau, « Archiver ».
 * - **B.7 Recherche et filtres** (Q1 à Q4, Q3 définitif) : `visibleMovementItems` ; la saisie est
 *   portée par la zone de contexte du Catalogue (`query`).
 * - **B.8 Archives** (Q5 à Q8, `10495:24054` à `10500:23772`) : archivage refusé tant qu'un
 *   Exercice persisté utilise le Mouvement (« Archivage impossible »), annulation immédiate de
 *   l'archivage et de la restauration, suppression définitive confirmée, sans annulation ni cascade.
 *
 * Recette A/B du 27/10 (Figma `10579:21580`, `10465:23141`) :
 * - B01–B04, B07 : carte `Carte — Mouvement` pleine largeur utile, fond `#F9FAFC`, bordure 0,5
 *   `#CCD1E0`, rayon 12, ombre 8 % 0/2/10 ; titre 15/18 ; deux premières étapes de la
 *   description, une ligne chacune, tronquées indépendamment ; 8 entre média et texte.
 * - B05 : déploiement, repli, insertion et retrait par les animations de mise en page communes
 *   (`SheetMotion`), neutralisées par « Réduire les animations ».
 * - B06 : toute la marge gauche de la pile déployée (filet compris), sur sa hauteur, la replie.
 * - B08 : appui long sur une carte d'une pile déployée, puis glisser : réordonnancement de la
 *   famille (`MovementCatalogueService.reorderFamily`), actions accessibles équivalentes.
 * - B09 : la carte du dessus d'une pile condensée ne glisse pas.
 * - B11, B12 : « Ajouter un niveau » ; choix Figma `10579:21707` / `10579:21709` déployé dans le
 *   Catalogue, qui repousse les cartes suivantes et allonge le filet.
 *
 * PRE-8, familles de niveaux (règles A à E du 28/10/2026, DSF « Composition et ordre des familles »,
 * CE-MVT-03) — un seul geste, l'appui long puis le glisser, sur toute carte active :
 * - A : dans l'emprise du filet, réordonnancement (pile repliée dépliée d'abord, niveaux recalculés
 *   en direct, aucun message) ; seule la clé du Mouvement déplacé est écrite ;
 * - B, D : au-delà du filet, sortie (filet raccourci, cartes refermées, pastille retirée) ; sortie
 *   du dernier couple : famille dissoute ; le Mouvement libéré reprend sa place par nom ;
 * - C : un Mouvement sans famille posé sur une carte sans famille forme une famille, sur un membre
 *   il y entre ; le côté de la carte visée fixe le niveau ; filet de formation et niveaux
 *   provisoires ; une pile repliée se déplie à l'approche ; un membre ne se pose sur aucune carte ;
 * - E : appliqué au relâchement ; message de 3 s avec Annuler quand l'appartenance change.
 * Ordre du Catalogue : par nom (Trier grisé) ; aucune position manuelle des entrées (B5).
 */

const t = strings.screens.movement.catalogue;
const tVariant = strings.screens.activities.editor.movementSuggestion;

type LoadState =
  | { readonly status: "loading" }
  | { readonly status: "error" }
  | { readonly status: "ready"; readonly entries: readonly MovementCatalogueEntry[] };

/** Entrées du Catalogue des Mouvements, relues à chaque `reloadToken`. */
export function useMovementCatalogue(reloadToken: number): {
  readonly state: LoadState;
  readonly reload: () => void;
  readonly catalogue: MovementCatalogueService | null;
} {
  const service = useActivityDefinitionService();
  const catalogue = useMemo(() => service.movementCatalogue, [service]);
  // Sans service de Mouvement : erreur dès l'état initial (aucune écriture d'état synchrone en effet).
  const [state, setState] = useState<LoadState>(() => (catalogue ? { status: "loading" } : { status: "error" }));
  const generation = useRef(0);
  const reload = useCallback(() => {
    const current = ++generation.current;
    if (!catalogue) return;
    catalogue.listEntries().then(
      (entries) => {
        if (generation.current === current) setState({ status: "ready", entries });
      },
      (error: unknown) => {
        console.error("Le catalogue des mouvements n'a pas pu être chargé.", error);
        if (generation.current === current) setState({ status: "error" });
      },
    );
  }, [catalogue]);
  useEffect(() => {
    reload();
  }, [reload, reloadToken]);
  return { state, reload, catalogue };
}

type Notice = { readonly message: string; readonly undo: () => void; readonly durationMs?: number };
type Refusal = { readonly kind: "ARCHIVE" | "DELETE"; readonly exerciseCount: number };
/**
 * B08, familles (A à C) : carte portée — membre d'une pile déployée (`pileKey`) ou Mouvement sans
 * famille (`pileKey` nul) ; `originCenter` : centre de la carte au départ, dans le repère de la liste.
 */
type Drag = {
  readonly id: string;
  readonly pileKey: string | null;
  readonly ids: readonly string[];
  readonly from: number;
  /**
   * Doigt, centre et haut de la carte, défilement de la liste, au départ ; relevés au premier
   * déplacement (gestionnaire du doigt).
   */
  readonly origin: { readonly y: number; readonly center: number; readonly top: number; readonly scroll: number } | null;
  /** Déplacement du doigt dans le repère du contenu (défilement compris). */
  readonly dy: number;
  /**
   * Recette du 28/10 (FAM-05) : déplacement de la place de la carte portée depuis le départ — une pile
   * dépliée au-dessus d'elle la fait descendre ; retranché du décalage pour qu'elle reste sous le doigt.
   */
  readonly drift: number;
  readonly intent: DragIntent;
};
type Box = { readonly y: number; readonly height: number };
/** B08 : ordre affiché juste après une dépose, valable pour les entrées lues avant elle. */
type OrderOverride = { readonly entries: readonly MovementCatalogueEntry[]; readonly pileKey: string; readonly ids: readonly string[] };

const CARD_HEIGHT = 80;
/** Écart entre les cartes d'une pile déployée (Figma `10579:21580` : 4). */
const MEMBER_GAP = spacing[4];
/** Écart entre deux entrées du Catalogue, sous l'épaisseur d'une pile (Figma : 12). */
const ITEM_GAP = spacing[12];
/** Débord de l'épaisseur d'une pile condensée, par feuille (Figma : 6 puis 12) ; retrait 8 puis 16. */
const LEAF_STEP = 6;
const LEAF_INSET = spacing[8];
/** Familles, règle E5 du 28/10/2026 : fenêtre d'annulation des changements d'appartenance. */
const FAMILY_NOTICE_MS = 3000;
/** Recette du 28/10 (FAM, limites) : bande des bords qui fait défiler la liste pendant le geste, et pas par image. */
const AUTO_SCROLL_EDGE = 72;
const AUTO_SCROLL_STEP = 8;
/** Recette du 28/10 : arrêt sur une famille repliée avant qu'elle se déplie (valeur technique, non spécifiée). */
const EXPAND_DWELL_MS = 500;

export function MovementCatalogueList({
  reloadToken,
  query,
  filters,
  onOpenMovement,
  onCreateVariant,
}: {
  readonly reloadToken: number;
  /** Recherche saisie dans la zone de contexte du Catalogue (D02). */
  readonly query: string;
  readonly filters: MovementCatalogueFilters;
  readonly onOpenMovement: (movementId: string) => void;
  readonly onCreateVariant: (originId: string, placement: VariantPlacement) => void;
}) {
  const { state, reload, catalogue } = useMovementCatalogue(reloadToken);
  const reduceMotion = useReduceMotion();
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());
  const [revealedId, setRevealedId] = useState<string | null>(null);
  const [variantFor, setVariantFor] = useState<string | null>(null);
  const [refusal, setRefusal] = useState<Refusal | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [actionFailed, setActionFailed] = useState(false);
  const [reorderFailed, setReorderFailed] = useState(false);
  const [drag, setDrag] = useState<Drag | null>(null);
  const [override, setOverride] = useState<OrderOverride | null>(null);
  const [memberStep, setMemberStep] = useState(CARD_HEIGHT + MEMBER_GAP);
  const [familyFailed, setFamilyFailed] = useState(false);
  // Familles : place mesurée des entrées (repère de la liste) et des membres (repère de leur pile).
  const itemBoxes = useRef(new Map<string, Box>());
  const memberBoxes = useRef(new Map<string, Box>());
  // Copie de la carte portée pour les gestionnaires de mise en page (mise à jour après chaque rendu).
  const dragRef = useRef<Drag | null>(null);
  const recordItemBox = useCallback((key: string, event: LayoutChangeEvent) => {
    const { y, height } = event.nativeEvent.layout;
    itemBoxes.current.set(key, { y, height });
    // FAM-05 : la place de la carte portée a changé (pile dépliée au-dessus) — elle reste sous le doigt.
    const current = dragRef.current;
    if (current === null || current.origin === null) return;
    const top = liftedTopIn(current, itemBoxes.current, memberBoxes.current);
    if (top === undefined) return;
    setDrag((latest) => (latest === null || latest.origin === null || latest.id !== current.id ? latest : { ...latest, drift: top - latest.origin.top }));
  }, []);
  const recordMemberBox = useCallback((id: string, event: LayoutChangeEvent) => {
    const { y, height } = event.nativeEvent.layout;
    memberBoxes.current.set(id, { y, height });
  }, []);

  // Recette A/B du 27/10 (remarque 4) : au retour dans le Catalogue (`reloadToken`), aucune carte
  // ne reste ouverte ni aucun choix de Niveau déployé ; filtres, recherche et piles dépliées restent.
  const [seenReloadToken, setSeenReloadToken] = useState(reloadToken);
  if (seenReloadToken !== reloadToken) {
    setSeenReloadToken(reloadToken);
    setRevealedId(null);
    setVariantFor(null);
  }
  const lastTouchY = useRef(0);
  // Défilement automatique pendant le geste : liste, place à l'écran, défilement et hauteur du contenu.
  const scrollRef = useRef<ScrollView>(null);
  const viewportRef = useRef<View>(null);
  const scrollY = useRef(0);
  const contentHeight = useRef(0);
  const viewport = useRef<{ top: number; height: number } | null>(null);
  const lastMoveY = useRef(0);
  const moveLatest = useRef<((pageY: number) => void) | null>(null);
  const [autoScroll, setAutoScroll] = useState<-1 | 0 | 1>(0);
  // Famille repliée survolée par la carte portée, et son dépliage différé.
  const expandHover = useRef<{ key: string; timer: ReturnType<typeof setTimeout> } | null>(null);

  const items = useMemo(() => {
    if (state.status !== "ready") return [];
    const visible = visibleMovementItems(state.entries, query, filters);
    if (override === null || override.entries !== state.entries) return visible;
    return visible.map((item): MovementCatalogueItem => {
      if (item.kind !== "PILE" || item.key !== override.pileKey) return item;
      const byId = new Map(item.members.map((member) => [member.movement.id, member]));
      const members = override.ids.map((id) => byId.get(id)).filter((member) => member !== undefined);
      return members.length === item.members.length ? { ...item, members } : item;
    });
  }, [state, query, filters, override]);

  const entryById = useMemo(
    () => new Map(state.status === "ready" ? state.entries.map((entry) => [entry.movement.id, entry]) : []),
    [state],
  );
  const groupSizes = useMemo(() => {
    const sizes = new Map<string, number>();
    if (state.status === "ready") {
      for (const entry of state.entries) {
        const groupId = entry.movement.levelGroup?.groupId;
        if (groupId) sizes.set(groupId, (sizes.get(groupId) ?? 0) + 1);
      }
    }
    return sizes;
  }, [state]);
  /** C1 : sans famille dans les données (un groupe réduit à ce seul Mouvement compte comme libre). */
  const isFree = (entry: MovementCatalogueEntry) =>
    entry.movement.levelGroup === null || (groupSizes.get(entry.movement.levelGroup.groupId) ?? 0) <= 1;

  const run = useCallback(
    (action: () => Promise<MovementLifecycleResult>, onDone: () => void, refusalKind: Refusal["kind"]) => {
      setRevealedId(null);
      setVariantFor(null);
      setActionFailed(false);
      action().then(
        (result) => {
          if (result.status === "DONE") onDone();
          else if (result.status === "REFERENCED") setRefusal({ kind: refusalKind, exerciseCount: result.exerciseCount });
          reload();
        },
        (error: unknown) => {
          console.error("L'action sur le mouvement a échoué.", error);
          setActionFailed(true);
          reload();
        },
      );
    },
    [reload],
  );

  const archive = useCallback(
    (movementId: string) => {
      if (!catalogue) return;
      run(
        () => catalogue.archive(movementId),
        () => setNotice({ message: t.archived, undo: () => run(() => catalogue.restore(movementId), () => undefined, "ARCHIVE") }),
        "ARCHIVE",
      );
    },
    [catalogue, run],
  );

  const restore = useCallback(
    (movementId: string) => {
      if (!catalogue) return;
      run(
        () => catalogue.restore(movementId),
        () => setNotice({ message: t.restored, undo: () => run(() => catalogue.archive(movementId), () => undefined, "ARCHIVE") }),
        "ARCHIVE",
      );
    },
    [catalogue, run],
  );

  const confirmDelete = useCallback(() => {
    const movementId = deleteCandidate;
    setDeleteCandidate(null);
    if (!catalogue || movementId === null) return;
    // Suppression définitive : confirmation préalable, aucune annulation ensuite (Q8).
    run(() => catalogue.deleteArchived(movementId), () => setNotice(null), "DELETE");
  }, [catalogue, deleteCandidate, run]);

  /** B08 : écrit le nouvel ordre affiché d'une pile ; les membres masqués gardent leur place. */
  const commitOrder = (pileKey: string, shownDescending: readonly string[]) => {
    if (!catalogue || state.status !== "ready") return;
    const familyAscending = state.entries
      .filter((entry) => entry.movement.levelGroup?.groupId === pileKey && familyPositionOf(entry) !== null)
      .sort((left, right) => (familyPositionOf(left)?.rank ?? 0) - (familyPositionOf(right)?.rank ?? 0))
      .map((entry) => entry.movement.id);
    setReorderFailed(false);
    setOverride({ entries: state.entries, pileKey, ids: shownDescending });
    catalogue.reorderFamily(pileKey, reorderedFamilyIds(familyAscending, shownDescending)).then(
      (done) => {
        if (!done) {
          setOverride(null);
          setReorderFailed(true);
        }
        reload();
      },
      (error: unknown) => {
        console.error("L'ordre des niveaux n'a pas pu être enregistré.", error);
        setOverride(null);
        setReorderFailed(true);
        reload();
      },
    );
  };

  /** Familles : cartes affichées et leur place, lues au moment du geste (gestionnaires seulement). */
  const slotsNow = (): readonly DragSlot[] => {
    const slots: DragSlot[] = [];
    for (const item of items) {
      const box = itemBoxes.current.get(item.key);
      if (!box) continue;
      if (item.kind === "SINGLE") {
        const entry = item.entry;
        // Toute carte isolée active reçoit un Mouvement libre : sans famille, création (C1) ; singleton subi
        // (membre restant après archivage) ou famille masquée par un filtre, entrée dans son groupe (C2, D4).
        slots.push({ id: entry.movement.id, familyKey: null, collapsedKey: null, joinable: !entry.archived, top: box.y, height: box.height - ITEM_GAP });
      } else if (!expanded.has(item.key)) {
        slots.push({ id: item.members[0]!.movement.id, familyKey: null, collapsedKey: item.key, joinable: false, top: box.y, height: CARD_HEIGHT });
      } else {
        item.members.forEach((member, index) => {
          const own = memberBoxes.current.get(member.movement.id);
          if (!own) return;
          const gap = index > 0 ? MEMBER_GAP : 0;
          slots.push({ id: member.movement.id, familyKey: item.key, collapsedKey: null, joinable: !member.archived, top: box.y + own.y + gap, height: own.height - gap });
        });
      }
    }
    return slots;
  };

  const startDrag = (id: string, pileKey: string | null, ids: readonly string[], from: number) => {
    setRevealedId(null);
    setVariantFor(null);
    setDrag({ id, pileKey, ids, from, origin: null, dy: 0, drift: 0, intent: { kind: "NONE" } });
  };

  const liftedTop = (current: Drag) => liftedTopIn(current, itemBoxes.current, memberBoxes.current);

  /** Départ du geste : doigt au toucher initial, centre et haut de la carte portée dans le repère de la liste. */
  const originOf = (current: Drag, slots: readonly DragSlot[]) => {
    const slot = slots.find((candidate) => candidate.id === current.id);
    const pile = current.pileKey !== null ? itemBoxes.current.get(current.pileKey) : undefined;
    const center = slot ? slot.top + slot.height / 2 : (pile?.y ?? 0) + CARD_HEIGHT / 2;
    return { y: lastTouchY.current, center, top: liftedTop(current) ?? 0, scroll: scrollY.current };
  };

  const moveDrag = (pageY: number) => {
    if (drag === null) return;
    lastMoveY.current = pageY;
    const slots = slotsNow();
    const origin = drag.origin ?? originOf(drag, slots);
    const dy = pageY - origin.y + (scrollY.current - origin.scroll);
    const top = liftedTop(drag);
    const drift = top === undefined ? drag.drift : top - origin.top;
    const direction = autoScrollDirection(pageY, viewport.current, AUTO_SCROLL_EDGE);
    if (direction !== autoScroll) setAutoScroll(direction);
    const reorderTo = Math.max(0, Math.min(drag.ids.length - 1, drag.from + Math.round(dy / memberStep)));
    const entry = entryById.get(drag.id);
    const intent = dragIntent({
      slots,
      draggedId: drag.id,
      familyKey: drag.pileKey,
      centerY: origin.center + dy,
      reorderTo,
      free: drag.pileKey === null && entry !== undefined && isFree(entry),
    });
    // C5, recette du 28/10 : une famille repliée ne se déplie que si la carte portée s'arrête dessus ;
    // la survoler sans s'arrêter ne la déplie pas.
    const hovered = intent.kind === "EXPAND" ? intent.familyKey : null;
    if (hovered !== expandHover.current?.key) {
      if (expandHover.current !== null) clearTimeout(expandHover.current.timer);
      expandHover.current =
        hovered === null
          ? null
          : {
              key: hovered,
              timer: setTimeout(() => {
                expandHover.current = null;
                setExpanded((current) => (current.has(hovered) ? current : new Set(current).add(hovered)));
              }, EXPAND_DWELL_MS),
            };
    }
    setDrag({ ...drag, origin, dy, drift, intent });
  };

  useEffect(() => {
    moveLatest.current = moveDrag;
    dragRef.current = drag;
  });

  // Défilement automatique : la liste défile tant que le doigt reste près d'un bord ; la carte portée suit.
  // Recette du 28/10 (f2-04, défilement saccadé) : une image par pas (`requestAnimationFrame`), et le
  // défilement de référence n'est plus relu des évènements `onScroll` pendant le geste — arrivés en
  // retard, ils ramenaient la liste en arrière et la carte oscillait.
  useEffect(() => {
    if (autoScroll === 0) return;
    let frame = 0;
    const step = () => {
      const max = Math.max(0, contentHeight.current - (viewport.current?.height ?? 0));
      const next = Math.max(0, Math.min(max, scrollY.current + autoScroll * AUTO_SCROLL_STEP));
      if (next !== scrollY.current) {
        scrollRef.current?.scrollTo({ y: next, animated: false });
        scrollY.current = next;
        moveLatest.current?.(lastMoveY.current);
      }
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [autoScroll]);

  const stopDrag = () => {
    setDrag(null);
    setAutoScroll(0);
    if (expandHover.current !== null) clearTimeout(expandHover.current.timer);
    expandHover.current = null;
  };

  /** E : application au relâchement ; message de 3 s avec Annuler quand l'appartenance change. */
  const applyFamily = (action: () => Promise<MovementFamilyOutcome>) => {
    setReorderFailed(false);
    setFamilyFailed(false);
    action().then(
      (outcome) => {
        if (outcome.status !== "OK") {
          setOverride(null);
          setFamilyFailed(true);
        } else {
          const message = familyMessage(outcome.operation);
          if (message !== null) setNotice({ message, durationMs: FAMILY_NOTICE_MS, undo: () => undoFamily(outcome.previous) });
        }
        reload();
      },
      (error: unknown) => {
        console.error("La famille de niveaux n'a pas pu être modifiée.", error);
        setOverride(null);
        setFamilyFailed(true);
        reload();
      },
    );
  };

  const undoFamily = (previous: MovementPriorMemberships) => {
    if (!catalogue) return;
    catalogue.restoreFamilyMemberships(previous).then(
      (restored) => {
        if (!restored) setFamilyFailed(true);
        reload();
      },
      (error: unknown) => {
        console.error("L'annulation n'a pas pu être appliquée.", error);
        setFamilyFailed(true);
        reload();
      },
    );
  };

  const endDrag = () => {
    const current = drag;
    stopDrag();
    if (current === null || !catalogue || state.status !== "ready") return;
    const { intent } = current;
    if (intent.kind === "REORDER" && current.pileKey !== null && intent.to !== current.from) {
      const shown = movedTo(current.ids, current.from, intent.to);
      const anchor = reorderAnchor(shown, current.id);
      if (anchor === null) return;
      setOverride({ entries: state.entries, pileKey: current.pileKey, ids: shown });
      applyFamily(() => catalogue.placeInFamily(current.id, anchor.anchorId, anchor.side));
    } else if (intent.kind === "LEAVE") {
      applyFamily(() => catalogue.leaveFamily(current.id));
    } else if (intent.kind === "PLACE") {
      applyFamily(() => catalogue.placeInFamily(current.id, intent.anchorId, intent.side));
    }
  };

  /** A4, B2, C4 : niveaux annoncés pendant le geste, `null` hors geste structurant. */
  const levelPreview = ((): ReadonlyMap<string, MovementLevelPosition | null> | null => {
    if (drag === null) return null;
    const { intent } = drag;
    const withActivity = (ids: readonly string[]) => ids.map((id) => ({ id, active: entryById.get(id)?.archived !== true }));
    if (intent.kind === "REORDER") return previewLevels(withActivity(movedTo(drag.ids, drag.from, intent.to)));
    if (intent.kind === "LEAVE") {
      const levels = new Map(previewLevels(withActivity(drag.ids.filter((id) => id !== drag.id))));
      levels.set(drag.id, null);
      return levels;
    }
    if (intent.kind === "PLACE") {
      const pile = intent.familyKey === null ? null : items.find((item) => item.kind === "PILE" && item.key === intent.familyKey);
      const displayed = pile && pile.kind === "PILE" ? pile.members.map((member) => member.movement.id) : [intent.anchorId];
      return previewLevels(withActivity(placedOrder(displayed, drag.id, intent.anchorId, intent.side)));
    }
    return null;
  })();

  /**
   * C2, ch10 règle 5, recette du 28/10 (FAM-06) : la place visée s'ouvre pendant une entrée ou une
   * création — membres à partir du rang d'arrivée (`at`) ou carte visée (`anchorShift`), puis entrées
   * suivantes, décalés d'un pas ; places mesurées inchangées (décalage visuel seulement).
   */
  const opening = ((): { readonly itemKey: string; readonly at: number; readonly anchorShift: number } | null => {
    if (drag === null || drag.intent.kind !== "PLACE") return null;
    const { intent } = drag;
    if (intent.familyKey === null) return { itemKey: intent.anchorId, at: -1, anchorShift: intent.side === "ABOVE" ? memberStep : 0 };
    const pile = items.find((item) => item.kind === "PILE" && item.key === intent.familyKey);
    if (!pile || pile.kind !== "PILE") return null;
    const order = placedOrder(pile.members.map((member) => member.movement.id), drag.id, intent.anchorId, intent.side);
    return { itemKey: pile.key, at: order.indexOf(drag.id), anchorShift: 0 };
  })();
  const openingIndex = opening === null ? -1 : items.findIndex((item) => item.key === opening.itemKey);

  const actionsFor = (entry: MovementCatalogueEntry): readonly SwipeAction[] =>
    entry.archived
      ? [
          { key: "restore", label: t.actions.restore, backgroundColor: colors.selection, onPress: () => restore(entry.movement.id) },
          {
            key: "delete",
            label: t.actions.delete,
            backgroundColor: colors.danger,
            onPress: () => {
              setRevealedId(null);
              setDeleteCandidate(entry.movement.id);
            },
          },
        ]
      : [
          // « Partager » : nouveau, non opérationnel — visible et grisé (arbitrage du 27/10).
          { key: "share", label: t.actions.share, backgroundColor: colors.selection, disabled: true, onPress: () => undefined },
          {
            key: "variant",
            label: t.actions.addLevel,
            backgroundColor: colors.movementLevelAction,
            // B11 : la carte reste ouverte ; le choix se déploie sous les actions.
            onPress: () => setVariantFor((current) => (current === entry.movement.id ? null : entry.movement.id)),
          },
          { key: "archive", label: t.actions.archive, backgroundColor: colors.movementArchiveAction, onPress: () => archive(entry.movement.id) },
        ];

  const choose = (originId: string, placement: VariantPlacement) => {
    setVariantFor(null);
    setRevealedId(null);
    onCreateVariant(originId, placement);
  };

  const renderRow = (
    entry: MovementCatalogueEntry,
    onPress: () => void,
    options: {
      readonly pileCount?: number;
      readonly swipe: boolean;
      readonly onLongPress?: () => void;
      readonly reorderActions?: readonly SwipeAccessibilityAction[];
    },
  ) => {
    const id = entry.movement.id;
    const level = levelPreview?.has(id) ? levelPreview.get(id)! : entry.level;
    const levelLabel = level !== null ? levelPastilleLabel(level) : null;
    const label =
      options.pileCount !== undefined
        ? fillTemplate(t.pileAccessibilityLabel, { name: entry.movement.name, count: String(options.pileCount) })
        : [entry.movement.name, levelLabel, entry.archived ? t.archivedAccessibility : null].filter(Boolean).join(", ");
    const actions = actionsFor(entry);
    const choicesOpen = options.swipe && variantFor === id && revealedId === id;
    return (
      <View>
        <SwipeActionsRow
          actions={actions}
          enabled={options.swipe}
          joined={choicesOpen}
          revealed={options.swipe && revealedId === id}
          onReveal={() => {
            setVariantFor(null);
            setRevealedId(id);
          }}
          onHide={() => {
            setVariantFor((current) => (current === id ? null : current));
            setRevealedId((current) => (current === id ? null : current));
          }}
          onPress={onPress}
          onLongPress={options.onLongPress}
          extraAccessibilityActions={options.reorderActions}
          accessibilityLabel={label}
          accessibilityHint={options.pileCount !== undefined ? t.pileExpandHint : options.reorderActions ? t.reorderHint : t.openAccessibilityHint}
          testID={`movement-card-${id}`}
        >
          <MovementCatalogueCard entry={entry} level={level} />
        </SwipeActionsRow>
        {choicesOpen ? (
          <SheetMotionView style={[styles.variantChoices, { width: actions.length * SWIPE_ACTION_WIDTH }]} testID={`movement-card-${id}-variant-choices`}>
            <VariantChoice
              label={tVariant.easier}
              arrow={ARROW_EASIER}
              corner="left"
              onPress={() => choose(id, "BEFORE_ORIGIN")}
              testID={`movement-card-${id}-easier`}
            />
            <VariantChoice
              label={tVariant.harder}
              arrow={ARROW_HARDER}
              corner="right"
              onPress={() => choose(id, "AFTER_ORIGIN")}
              testID={`movement-card-${id}-harder`}
            />
          </SheetMotionView>
        ) : null}
      </View>
    );
  };

  const collapse = (key: string) => {
    setRevealedId(null);
    setVariantFor(null);
    setExpanded((current) => {
      const next = new Set(current);
      next.delete(key);
      return next;
    });
  };

  const renderPile = (item: Extract<MovementCatalogueItem, { kind: "PILE" }>) => {
    const isExpanded = expanded.has(item.key);
    const ids = item.members.map((member) => member.movement.id);
    const pileDrag = drag !== null && drag.pileKey === item.key ? drag : null;
    const dropIndex = pileDrag !== null && pileDrag.intent.kind === "REORDER" ? pileDrag.intent.to : null;
    // B2 : la carte portée hors du filet — les cartes suivantes se referment, le filet raccourcit.
    const leaving = pileDrag !== null && pileDrag.intent.kind === "LEAVE";
    // C2 : un Mouvement entre dans la pile — le filet s'allonge d'une place.
    const joiningAt = opening !== null && opening.itemKey === item.key && opening.at >= 0 ? opening.at : null;
    // Recette A/B du 27/10 (remarque 2) : pendant le glisser et jusqu'à la relecture du nouvel ordre,
    // ni découpe ni transition de place — la carte portée reste visible au-dessus des autres, les
    // voisines se décalent sous elle (`DragShift`) et rien ne saute à la dépose.
    const settling = drag !== null || (override !== null && override.pileKey === item.key && state.status === "ready" && override.entries === state.entries);
    const leaves = Math.min(item.members.length - 1, 2);
    return (
      <View
        style={isExpanded ? null : { paddingBottom: leaves * LEAF_STEP }}
        testID={isExpanded ? `movement-pile-${item.key}-expanded` : `movement-pile-${item.key}`}
      >
        {!isExpanded
          ? Array.from({ length: leaves }, (_, index) => leaves - index).map((depth) => (
              <View
                key={`leaf-${depth}`}
                style={[styles.leaf, { top: depth * LEAF_STEP, left: depth * LEAF_INSET, right: depth * LEAF_INSET }]}
                accessible={false}
                importantForAccessibility="no"
                testID={`movement-pile-${item.key}-leaf-${depth}`}
              />
            ))
          : null}
        {isExpanded ? (
          // B06 : toute la marge gauche, filet compris, sur la hauteur de la pile, la replie.
          <Pressable
            onPress={() => collapse(item.key)}
            accessibilityRole="button"
            accessibilityLabel={t.pileCollapse}
            style={styles.collapseZone}
            testID={`movement-pile-${item.key}-collapse`}
          >
            <View
              style={[styles.rail, leaving ? { bottom: CARD_HEIGHT / 2 + memberStep } : joiningAt !== null ? { bottom: CARD_HEIGHT / 2 - memberStep } : null]}
              testID={`movement-pile-${item.key}-rail`}
            />
          </Pressable>
        ) : null}
        {item.members.map((member, index) => {
          if (!isExpanded && index > 0) return null;
          const isLifted = pileDrag !== null && pileDrag.from === index;
          let shift = 0;
          if (pileDrag !== null && dropIndex !== null && !isLifted) {
            if (index > pileDrag.from && index <= dropIndex) shift = -memberStep;
            else if (index < pileDrag.from && index >= dropIndex) shift = memberStep;
          } else if (leaving && !isLifted && index > pileDrag.from) {
            shift = -memberStep;
          } else if (joiningAt !== null && index >= joiningAt) {
            shift = memberStep;
          }
          const row = !isExpanded
            ? renderRow(
                member,
                () => {
                  setRevealedId(null);
                  setVariantFor(null);
                  setExpanded((current) => new Set(current).add(item.key));
                },
                {
                  pileCount: item.members.length,
                  swipe: false,
                  // A3 : appui long sur une pile repliée — elle se déplie, la carte du dessus est portée.
                  onLongPress: member.archived
                    ? undefined
                    : () => {
                        setExpanded((current) => new Set(current).add(item.key));
                        startDrag(member.movement.id, item.key, ids, 0);
                      },
                },
              )
            : renderRow(member, () => onOpenMovement(member.movement.id), {
                swipe: drag === null,
                onLongPress: member.archived ? undefined : () => startDrag(member.movement.id, item.key, ids, index),
                reorderActions: [
                  ...(index > 0
                    ? [
                        {
                          name: "moveHarder",
                          label: fillTemplate(t.moveHarder, { name: member.movement.name }),
                          onAction: () => commitOrder(item.key, movedTo(ids, index, index - 1)),
                        },
                      ]
                    : []),
                  ...(index < ids.length - 1
                    ? [
                        {
                          name: "moveEasier",
                          label: fillTemplate(t.moveEasier, { name: member.movement.name }),
                          onAction: () => commitOrder(item.key, movedTo(ids, index, index + 1)),
                        },
                      ]
                    : []),
                ],
              });
          return (
            <SheetMotionView
              key={member.movement.id}
              appear={index > 0}
              clip={!settling}
              transition={!settling}
              bleed={layout.screenGutter}
              raised={isLifted}
              style={[index > 0 ? styles.memberSpacing : null, isLifted ? styles.liftedFrame : null]}
              onLayout={(event: LayoutChangeEvent) => {
                recordMemberBox(member.movement.id, event);
                if (index === 0 && isExpanded) setMemberStep(event.nativeEvent.layout.height + MEMBER_GAP);
              }}
              testID={`movement-pile-${item.key}-member-${member.movement.id}`}
            >
              {/* Recette du 27/10 (r10-glisser) : une seule enveloppe pour la carte portée et ses voisines —
                  changer d'enveloppe au début du glisser démontait la carte sous le doigt et figeait le geste. */}
              <DragShift
                shift={isLifted ? pileDrag.dy - pileDrag.drift : shift}
                active={drag !== null}
                follow={isLifted}
                reduceMotion={reduceMotion}
                style={isLifted ? styles.lifted : null}
                testID={isLifted ? `movement-pile-${item.key}-lifted` : `movement-card-${member.movement.id}-slot`}
              >
                {row}
              </DragShift>
            </SheetMotionView>
          );
        })}
      </View>
    );
  };

  /** Familles (C) : carte sans famille, portable ; filet de formation quand elle est la carte visée (C1, C4). */
  const renderSingle = (entry: MovementCatalogueEntry) => {
    const id = entry.movement.id;
    const isLifted = drag !== null && drag.id === id;
    const forming = drag !== null && drag.intent.kind === "PLACE" && drag.intent.familyKey === null && drag.intent.anchorId === id ? drag.intent : null;
    return (
      <View>
        {forming !== null ? (
          <View
            // La place s'ouvre au-dessus (carte visée décalée d'un pas) ou en dessous : le filet relie les deux centres.
            style={[styles.formationRail, { top: CARD_HEIGHT / 2, height: memberStep }]}
            testID={`movement-card-${id}-formation-rail`}
          />
        ) : null}
        <DragShift
          shift={isLifted ? drag.dy - drag.drift : opening !== null && opening.itemKey === id ? opening.anchorShift : 0}
          active={drag !== null}
          follow={isLifted}
          reduceMotion={reduceMotion}
          style={isLifted ? styles.lifted : null}
          testID={isLifted ? `movement-card-${id}-lifted` : `movement-card-${id}-slot`}
        >
          {renderRow(entry, () => onOpenMovement(id), {
            swipe: drag === null,
            onLongPress: entry.archived ? undefined : () => startDrag(id, null, [id], 0),
          })}
        </DragShift>
      </View>
    );
  };

  const renderItem = (item: MovementCatalogueItem) => (item.kind === "SINGLE" ? renderSingle(item.entry) : renderPile(item));

  const searching = query.trim().length > 0;

  return (
    <View style={styles.container} testID="movement-catalogue">
      {/* Familles : échec signalé par le message d'action existant, aucun libellé inventé (CE-MVT-03). */}
      {actionFailed || reorderFailed || familyFailed ? (
        <Text style={styles.actionError} accessibilityLiveRegion="polite" testID="movement-catalogue-action-error">
          {reorderFailed ? t.reorderError : t.actionError}
        </Text>
      ) : null}
      {state.status === "loading" ? (
        <View style={styles.centered} testID="movement-catalogue-loading">
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : null}
      {state.status === "error" ? (
        <View style={styles.centered} testID="movement-catalogue-error">
          <Text style={styles.message}>{t.loadError}</Text>
          <Pressable onPress={reload} accessibilityRole="button" accessibilityLabel={t.retry} style={styles.retry} testID="movement-catalogue-retry">
            <Text style={styles.retryLabel}>{t.retry}</Text>
          </Pressable>
        </View>
      ) : null}
      {state.status === "ready" ? (
        // B05 : monté avec la liste prête — les entrées présentes à l'ouverture ne s'animent pas ;
        // celles qui apparaissent ou disparaissent ensuite (pile dépliée, filtre, archivage) oui.
        <SheetMotionProvider reduceMotion={reduceMotion}>
          {/* Place de la liste à l'écran : défilement automatique pendant le geste. */}
          <View ref={viewportRef} style={styles.viewport} collapsable={false}>
            <SheetMotionScrollView
              ref={scrollRef}
              contentContainerStyle={styles.list}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              scrollEnabled={drag === null}
              onScroll={(event) => {
                // Pendant le geste, seul le défilement automatique fait foi (f2-04).
                if (dragRef.current === null) scrollY.current = event.nativeEvent.contentOffset.y;
              }}
              scrollEventThrottle={16}
              onContentSizeChange={(_width, height) => {
                contentHeight.current = height;
              }}
              testID="movement-catalogue-list"
            >
              {items.length === 0 ? (
                <Text style={styles.message} testID="movement-catalogue-empty">
                  {state.entries.length === 0 ? t.empty : searching ? t.noResult : t.noMatch}
                </Text>
              ) : null}
              {/* Familles : un seul suivi du doigt pour toute la liste — la carte portée peut quitter sa pile. */}
              <View
                onTouchStart={(event) => {
                  lastTouchY.current = event.nativeEvent.pageY;
                  // Place de la liste à l'écran, relevée à chaque toucher (défilement automatique du geste).
                  viewportRef.current?.measureInWindow((_x, top, _width, height) => {
                    viewport.current = { top, height };
                  });
                }}
                onTouchMove={drag !== null ? (event) => moveDrag(event.nativeEvent.pageY) : undefined}
                onTouchEnd={drag !== null ? endDrag : undefined}
                // Geste interrompu par le système : abandon, rien n'est écrit.
                onTouchCancel={drag !== null ? stopDrag : undefined}
                testID="movement-catalogue-items"
              >
                {items.map((item, index) => {
                  const lifted = drag !== null && drag.pileKey === null && item.kind === "SINGLE" && item.entry.movement.id === drag.id;
                  return (
                    <SheetMotionView
                      key={item.key}
                      bleed={layout.screenGutter}
                      clip={drag === null}
                      transition={drag === null}
                      raised={lifted}
                      style={[styles.item, lifted ? styles.liftedFrame : null]}
                      onLayout={(event: LayoutChangeEvent) => recordItemBox(item.key, event)}
                      testID={`movement-item-${item.key}`}
                    >
                      {/* C2 : entrées qui suivent la place ouverte, décalées d'un pas ; même enveloppe hors geste. */}
                      <DragShift
                        shift={openingIndex >= 0 && index > openingIndex && !lifted ? memberStep : 0}
                        active={drag !== null}
                        follow={false}
                        reduceMotion={reduceMotion}
                        style={null}
                        testID={`movement-item-${item.key}-shift`}
                      >
                        {renderItem(item)}
                      </DragShift>
                    </SheetMotionView>
                  );
                })}
              </View>
            </SheetMotionScrollView>
          </View>
        </SheetMotionProvider>
      ) : null}
      <View pointerEvents="box-none" style={styles.noticeAnchor}>
        <TransientNotification
          message={notice?.message ?? null}
          actionLabel={t.undo}
          onAction={() => {
            const undo = notice?.undo;
            setNotice(null);
            undo?.();
          }}
          onDismiss={() => setNotice(null)}
          durationMs={notice?.durationMs}
          testID="movement-catalogue-notice"
        />
      </View>
      {refusal !== null ? <RefusalDialog refusal={refusal} onClose={() => setRefusal(null)} /> : null}
      {deleteCandidate !== null ? (
        <DecisionDialog
          title={t.deleteConfirm.title}
          titleStyle={{ ...type.modalTitle, color: colors.dialogTitleText }}
          message={t.deleteConfirm.message}
          messageStyle={{ ...type.dialogMessage, color: colors.dialogMessageText, textAlign: "center" }}
          cancelLabel={t.deleteConfirm.cancel}
          cancelLabelStyle={{ ...type.dialogNeutralActionLabel, color: colors.dialogNeutralActionText }}
          confirmLabel={t.deleteConfirm.confirm}
          confirmLabelStyle={type.dialogDestructiveActionLabel}
          confirmBordered={false}
          onCancel={() => setDeleteCandidate(null)}
          onConfirm={confirmDelete}
          testIDPrefix="movement-delete-confirm"
        />
      ) : null}
    </View>
  );
}

/** Haut de la carte portée dans le repère de la liste (gestionnaires seulement). */
function liftedTopIn(current: Drag, itemBoxes: ReadonlyMap<string, Box>, memberBoxes: ReadonlyMap<string, Box>): number | undefined {
  if (current.pileKey === null) return itemBoxes.get(current.id)?.y;
  const pile = itemBoxes.get(current.pileKey);
  const own = memberBoxes.get(current.id);
  return pile && own ? pile.y + own.y : undefined;
}

/** Règle E2 : message d'un changement d'appartenance ; aucun pour un simple réordonnancement (E3). */
function familyMessage(operation: Extract<MovementFamilyOutcome, { status: "OK" }>["operation"]): string | null {
  switch (operation) {
    case "CREATED":
      return t.family.created;
    case "DISSOLVED":
      return t.family.dissolved;
    case "LEFT":
      return t.family.left;
    case "JOINED":
      return t.family.joined;
    case "REORDERED":
      return null;
  }
}

/** « Archivage impossible » (Figma `10495:24054`) ; même patron pour un refus de suppression. */
/**
 * Recette A/B du 27/10 (remarque 2) : décalage d'une voisine pendant le glisser d'une pile,
 * progressif (`MOTION_SHIFT_DURATION_MS`, immédiat si « Réduire les animations ») ; à la dépose
 * (`active` faux) il revient à zéro sans animation, la nouvelle place prenant le relais.
 */
function DragShift({
  shift,
  active,
  follow,
  reduceMotion,
  style,
  testID,
  children,
}: {
  readonly shift: number;
  readonly active: boolean;
  /** Carte portée : suit le doigt, sans animation. */
  readonly follow: boolean;
  readonly reduceMotion: boolean;
  readonly style: StyleProp<ViewStyle>;
  readonly testID: string | undefined;
  readonly children: ReactNode;
}) {
  const [offset] = useState(() => new Animated.Value(0));
  // f2-04 : appliqué avant l'affichage, dans la même image que le défilement de la liste.
  useLayoutEffect(() => {
    if (!active || reduceMotion || follow) {
      offset.setValue(active ? shift : 0);
      return;
    }
    const animation = Animated.timing(offset, {
      toValue: shift,
      duration: MOTION_SHIFT_DURATION_MS,
      easing: MOTION_EASING,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [offset, shift, active, follow, reduceMotion]);
  return (
    <Animated.View style={[style, { transform: [{ translateY: offset }] }]} testID={testID}>
      {children}
    </Animated.View>
  );
}

function RefusalDialog({ refusal, onClose }: { readonly refusal: Refusal; readonly onClose: () => void }) {
  const texts = refusal.kind === "ARCHIVE" ? t.archiveRefused : t.deleteRefused;
  const message =
    refusal.exerciseCount === 1 ? texts.messageOne : fillTemplate(texts.messageMany, { count: String(refusal.exerciseCount) });
  return (
    <Modal transparent visible animationType="fade" onRequestClose={onClose}>
      <View style={styles.dialogBackdrop} testID="movement-refusal-dialog">
        <View style={styles.dialogCard} accessibilityRole="alert">
          <Text style={styles.dialogTitle}>{texts.title}</Text>
          <Text style={styles.dialogMessage} testID="movement-refusal-message">
            {message}
          </Text>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel={t.archiveRefused.acknowledge}
            style={styles.dialogAction}
            testID="movement-refusal-acknowledge"
          >
            <Text style={styles.dialogActionLabel}>{t.archiveRefused.acknowledge}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const ARROW_EASIER = require("../../../assets/icons/catalogue-niveau-plus-facile.svg");
const ARROW_HARDER = require("../../../assets/icons/catalogue-niveau-plus-difficile.svg");

/** B11 : `Action glissée — Niveau plus facile / plus difficile` (Figma `10579:21707`, `10579:21709`). */
function VariantChoice({
  label,
  arrow,
  corner,
  onPress,
  testID,
}: {
  readonly label: string;
  readonly arrow: number;
  readonly corner: "left" | "right";
  readonly onPress: () => void;
  readonly testID: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[styles.variantChoice, corner === "left" ? styles.variantChoiceLeft : styles.variantChoiceRight]}
      testID={testID}
    >
      <Text style={styles.variantLabel}>{label}</Text>
      <Image source={arrow} style={styles.variantArrow} accessible={false} />
    </Pressable>
  );
}

/**
 * Carte d'un Mouvement (Figma « Carte — Mouvement », 80 de haut) : photo 64 à 8 du bord, texte à 8
 * de la photo (B07), titre 15/18 (B02) et Niveau à droite, deux premières étapes de la
 * description, une par ligne, tronquées indépendamment (B03).
 */
function MovementCatalogueCard({ entry, level }: { readonly entry: MovementCatalogueEntry; readonly level: MovementLevelPosition | null }) {
  const resolveUri = useMediaUriResolver();
  const { movement } = entry;
  const preview = firstMediaPreviewSource(movement.media);
  const steps = decodeInstructionSteps(movement.description).slice(0, 2);
  const levelLabel = level !== null ? levelPastilleLabel(level) : null;
  return (
    <View style={[styles.card, entry.archived ? styles.cardArchived : null]} testID={`movement-card-surface-${movement.id}`}>
      <View style={[styles.thumbnail, entry.archived ? styles.faded : null]}>
        {preview ? (
          <MediaPreview
            uri={resolveUri(preview.uri)}
            isVideo={preview.isVideo}
            imageStyle={styles.thumbnailImage}
            fallbackStyle={[styles.thumbnailImage, styles.thumbnailFallback]}
            imageTestID={`movement-card-image-${movement.id}`}
            fallbackTestID={`movement-card-fallback-${movement.id}`}
          />
        ) : (
          <View style={[styles.thumbnailImage, styles.thumbnailFallback]} testID={`movement-card-empty-${movement.id}`} />
        )}
      </View>
      <View style={[styles.texts, entry.archived ? styles.faded : null]}>
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={1} testID={`movement-card-name-${movement.id}`}>
            {movement.name}
          </Text>
          {levelLabel ? (
            <Text style={styles.level} testID={`movement-card-level-${movement.id}`}>
              {levelLabel}
            </Text>
          ) : null}
        </View>
        {steps.map((step, index) => (
          <Text key={index} style={styles.description} numberOfLines={1} testID={`movement-card-step-${movement.id}-${index + 1}`}>
            {step}
          </Text>
        ))}
      </View>
    </View>
  );
}

const THUMBNAIL_SIZE = 64;
/** Figma : photo à 7,5 dans une bordure de 0,5 — 8 du bord extérieur. */
const CARD_BORDER = 0.5;
const CARD_PADDING = spacing[8] - CARD_BORDER;
/** Figma : filet de 2, à 8 des cartes, du milieu de la première au milieu de la dernière carte. */
const RAIL_WIDTH = 2;
const RAIL_TO_CARD = spacing[8];

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  actionError: {
    ...type.supporting,
    color: colors.danger,
    marginHorizontal: layout.screenGutter,
    marginBottom: spacing[8],
  },
  list: {
    paddingHorizontal: layout.screenGutter,
    paddingTop: spacing[4],
    paddingBottom: spacing[24],
  },
  item: {
    paddingBottom: ITEM_GAP,
  },
  viewport: {
    flex: 1,
  },
  memberSpacing: {
    paddingTop: MEMBER_GAP,
  },
  // Cadre de la carte portée : au-dessus des voisines (le `raised` du cadre porte le zIndex).
  liftedFrame: {
    zIndex: 2,
    elevation: 8,
  },
  lifted: {
    shadowColor: colors.movementCardShadow,
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[12],
  },
  message: {
    ...type.body,
    color: colors.textSecondary,
    textAlign: "center",
    paddingVertical: spacing[24],
  },
  retry: {
    minHeight: minTouchTarget,
    justifyContent: "center",
    paddingHorizontal: spacing[16],
  },
  retryLabel: {
    ...type.button,
    color: colors.primary,
  },
  // Figma `Pile — feuille 1/2` : blanc, bordure 1 `#E0E3ED`, rayon 12, en retrait de 8 puis 16.
  leaf: {
    position: "absolute",
    height: CARD_HEIGHT,
    borderRadius: fixedRadii[12],
    borderWidth: 1,
    borderColor: colors.movementPileLeafBorder,
    backgroundColor: colors.background,
  },
  // B06 : marge gauche entière de la pile déployée (du bord de l'écran au bord des cartes).
  collapseZone: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: -layout.screenGutter,
    width: layout.screenGutter,
    zIndex: 1,
  },
  // C1, C4 : filet de formation, à la place du filet d'une famille, vers la carte portée.
  formationRail: {
    position: "absolute",
    left: -RAIL_TO_CARD - RAIL_WIDTH,
    width: RAIL_WIDTH,
    borderRadius: 1,
    backgroundColor: colors.movementFamilyRail,
  },
  rail: {
    position: "absolute",
    top: CARD_HEIGHT / 2,
    bottom: CARD_HEIGHT / 2,
    right: RAIL_TO_CARD,
    width: RAIL_WIDTH,
    borderRadius: 1,
    backgroundColor: colors.movementFamilyRail,
  },
  variantChoices: {
    alignSelf: "flex-end",
    flexDirection: "row",
    gap: spacing[2],
    marginTop: spacing[2],
  },
  variantChoice: {
    flex: 1,
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    backgroundColor: colors.movementLevelAction,
  },
  variantChoiceLeft: {
    borderBottomLeftRadius: fixedRadii[12],
  },
  variantChoiceRight: {
    borderBottomRightRadius: fixedRadii[12],
  },
  variantLabel: {
    ...type.swipeActionLabel,
    color: colors.background,
  },
  variantArrow: {
    width: 9,
    height: 12.6,
  },
  noticeAnchor: {
    position: "absolute",
    left: layout.screenGutter,
    right: layout.screenGutter,
    bottom: spacing[16],
    height: minTouchTarget,
  },
  dialogBackdrop: {
    flex: 1,
    backgroundColor: colors.overlayScrim,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing[24],
  },
  dialogCard: {
    width: dimensions.decisionDialog.width,
    maxWidth: "100%",
    backgroundColor: colors.background,
    borderRadius: dimensions.decisionDialog.radius,
    padding: dimensions.decisionDialog.padding,
    gap: dimensions.decisionDialog.gap,
  },
  dialogTitle: {
    ...type.modalTitle,
    color: colors.dialogTitleText,
    textAlign: "center",
  },
  dialogMessage: {
    ...type.dialogMessage,
    color: colors.dialogMessageText,
  },
  dialogAction: {
    height: dimensions.decisionDialog.actionHeight,
    borderRadius: dimensions.decisionDialog.actionRadius,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  dialogActionLabel: {
    ...type.button,
    color: colors.background,
  },
  // B04 : `Carte — Mouvement` — fond `#F9FAFC`, bordure 0,5 `#CCD1E0`, rayon 12, ombre 8 % 0/2/10.
  card: {
    height: CARD_HEIGHT,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing[8],
    padding: CARD_PADDING,
    borderRadius: fixedRadii[12],
    borderWidth: CARD_BORDER,
    borderColor: colors.cardsBorder,
    backgroundColor: colors.surfaceSubtle,
    shadowColor: colors.movementCardShadow,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardArchived: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  faded: {
    opacity: 0.6,
  },
  thumbnail: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    borderRadius: fixedRadii[12],
    overflow: "hidden",
  },
  thumbnailImage: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
  },
  thumbnailFallback: {
    backgroundColor: colors.surface,
  },
  // Figma : titre à 3 du haut du bloc texte (10,5 − 7,5), description à 4 sous le titre.
  texts: {
    flex: 1,
    paddingTop: 3,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[8],
    marginBottom: spacing[4],
  },
  name: {
    ...type.compactCardTitle,
    flex: 1,
    color: colors.textPrimary,
  },
  level: {
    ...type.movementCardLevel,
    color: colors.primary,
  },
  description: {
    ...type.movementCardDescription,
    color: colors.movementCardDescription,
  },
});
