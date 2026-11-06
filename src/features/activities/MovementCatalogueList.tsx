import { Image } from "expo-image";
import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
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
import Reanimated, {
  Easing as ReanimatedEasing,
  LinearTransition,
  ReduceMotion,
  withDelay,
  withTiming,
  type EntryAnimationsValues,
  type ExitAnimationsValues,
  type LayoutAnimation,
} from "react-native-reanimated";

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
import {
  MOTION_EASING,
  MOTION_FADE_DURATION_MS,
  MOTION_FADE_EASING,
  MOTION_SHIFT_DURATION_MS,
} from "@/features/sessions/compositionMotion";
import { DecisionDialog } from "@/features/sessions/DecisionDialog";
import { useDragAutoScroll } from "@/features/sessions/useDragAutoScroll";
import { strings } from "@/shared/i18n";
import { TransientNotification } from "@/shared/ui/TransientNotification";
import { colors, dimensions, fixedRadii, layout, minTouchTarget, spacing, type } from "@/shared/ui/tokens";
import { useReduceMotion } from "@/shared/ui/useReduceMotion";

import {
  movedTo,
  reorderedFamilyIds,
  visibleMovementItems,
  type MovementCatalogueFilters,
  type MovementStatusFilter,
  type MovementCatalogueItem,
} from "./movementCatalogueView";
import {
  applyMovementCounter,
  movementCatalogueSummary,
  pileKeysOf,
  pilesHidingIds,
  type MovementCatalogueSummary,
  type MovementCounter,
} from "./movementCatalogueCounters";
import { dragIntent, placedOrder, previewLevels, reorderAnchor, type DragIntent, type DragSlot } from "./movementFamilyDrag";
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
  /** Doigt, centre et haut de la carte au départ ; relevés au premier déplacement (gestionnaire du doigt). */
  readonly origin: { readonly y: number; readonly center: number; readonly top: number } | null;
  /**
   * Déplacement du doigt seul. Le défilement automatique accumulé s'y ajoute hors rendu (`scrollFollow`,
   * `scrollDelta`) : recette du 28/10 (f3-01), redessiner tout le Catalogue à chaque image faisait
   * trembler la carte portée.
   */
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

/** D-508 (Figma `10124:21979`) : carte et feuilles de pile de 72. [Avant : 80 — remplacé.] */
const CARD_HEIGHT = 72;
/** Écart entre les cartes d'une pile déployée (Figma `10579:21580` : 4). */
const MEMBER_GAP = spacing[4];
/** Écart entre deux entrées du Catalogue, sous l'épaisseur d'une pile (Figma : 12). */
const ITEM_GAP = spacing[12];
/** Débord de l'épaisseur d'une pile condensée, par feuille (Figma : 6 puis 12) ; retrait 8 puis 16. */
const LEAF_STEP = 6;
const LEAF_INSET = spacing[8];
/** Familles, règle E5 du 28/10/2026 : fenêtre d'annulation des changements d'appartenance. */
const FAMILY_NOTICE_MS = 3000;
/** Recette du 28/10 : zone de touche du filet élargie vers la carte (une carte s'ouvrait par mégarde). */
const COLLAPSE_HIT_EXTRA = 12;
/** Recette du 28/10 : arrêt sur une famille repliée avant qu'elle se déplie (valeur technique, non spécifiée). */
const EXPAND_DWELL_MS = 500;
/**
 * Recette iPhone du 06/11/2026 (t-glisser, Hermann : « Cela ne doit arriver que lorsqu'on arrête consciemment la carte au
 * dessus d'une autre, pas seulement quand on passe dessus. » ; décision validée : « ok, on testera ce que ça donne ») : le
 * filet de placement dans une famille (C1, C2) et le décalage de la carte visée n'apparaissent que si la carte portée reste
 * immobile environ 0,4 s au-dessus d'une autre. Passer dessus sans s'arrêter ne déclenche rien ; le relâchement n'applique
 * que la place annoncée. [Avant : filet et décalage dès le survol — remplacé.]
 */
export const PLACE_DWELL_MS = 400;
/** t-glisser : tremblement du doigt toléré pendant l'arrêt (valeur technique, non spécifiée). */
const PLACE_DWELL_TOLERANCE = 6;

export function MovementCatalogueList({
  reloadToken,
  query,
  filters,
  onOpenMovement,
  onCreateVariant,
  selection,
  topInset,
  counter,
  onSummaryChange,
  newMovementIds,
  scrollTarget = null,
  onScrollTargetHandled,
}: {
  readonly reloadToken: number;
  /**
   * D-510 (Hermann, 06/11/2026) : fiches créées depuis la dernière sortie du catalogue des mouvements, badge « New »
   * (`newMovementMarks`, en mémoire, non persisté). Absent hors de l'onglet Mouvements du catalogue (règle 9).
   */
  readonly newMovementIds?: ReadonlySet<string>;
  /**
   * D-510, règle 8 : dernière fiche créée vers laquelle la liste se positionne au retour (sa pile si elle est repliée, sans la
   * déployer). Une fiche exclue par les filtres ou la recherche n'est pas rendue visible : la cible est alors abandonnée.
   */
  readonly scrollTarget?: string | null;
  /** D-510 : la cible a été atteinte (ou n'est pas affichée). */
  readonly onScrollTargetHandled?: (id: string) => void;
  /** Contre-recette n° 2 du 30/10 : réserve en tête de liste quand la liste défile sous la zone de contexte. */
  readonly topInset?: number;
  /** PRE-9 CAT.1 (CE-CAT-CTX-01) : compteur actif de la zone de contexte ; absent : aucun. */
  readonly counter?: MovementCounter | null;
  /** PRE-9 CAT.1 : compteurs de la liste affichée (`null` tant qu’elle n’est pas prête). */
  readonly onSummaryChange?: (summary: MovementCatalogueSummary | null) => void;
  /** Recherche saisie dans la zone de contexte du Catalogue (D02). */
  readonly query: string;
  readonly filters: MovementCatalogueFilters;
  readonly onOpenMovement: (movementId: string) => void;
  readonly onCreateVariant: (originId: string, placement: VariantPlacement) => void;
  /**
   * PRE-9 A.2 (ARB-22a : « La sélection des Mouvements réutilise le parcours existant du
   * Catalogue ») — même liste, mêmes piles, même recherche et mêmes filtres, en mode sélection pour
   * une Séance : Mouvements actifs seulement, quel que soit le filtre d'état (Q6 : un Mouvement
   * archivé n'est jamais proposé pour créer un Exercice) ; le toucher d'une carte la coche ou la
   * décoche (une pile repliée se déplie d'abord) ; ni actions glissées, ni réordonnancement, ni
   * fiche ouverte. `bottomInset` : réserve sous la liste (zone d'action de l'écran hôte).
   */
  readonly selection?: {
    readonly selectedIds: ReadonlySet<string>;
    /** Contre-recette du 30/10 (Hermann) : Mouvements déjà présents dans la Séance, marqués « Dans la séance ». */
    readonly inSessionIds?: ReadonlySet<string>;
    readonly onToggle: (movement: MovementCatalogueEntry["movement"]) => void;
    readonly bottomInset: number;
  };
}) {
  const { state, reload, catalogue } = useMovementCatalogue(reloadToken);
  // PRE-9 A.2 (Q6) : en sélection, le filtre d'état est ramené à « Actifs » (défaut, Q2).
  const selecting = selection !== undefined;
  const shownFilters = useMemo(
    () => (!selecting ? filters : { ...filters, statuses: new Set<MovementStatusFilter>() }),
    [filters, selecting],
  );
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
  // D-510, règle 8 : défilement vers la fiche nouvelle, en attente de la mesure de son entrée.
  const onItemMeasured = useRef<(() => void) | null>(null);
  const recordItemBox = useCallback((key: string, event: LayoutChangeEvent) => {
    const { y, height } = event.nativeEvent.layout;
    itemBoxes.current.set(key, { y, height });
    onItemMeasured.current?.();
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
  // Défilement automatique pendant le geste : celui de la Composition (PRE-6 story 7.4, recetté),
  // partagé. La carte portée suit le défilement par une valeur animée, sans redessiner la liste.
  const scrollRef = useRef<ScrollView>(null);
  const viewportRef = useRef<View>(null);
  const autoScroll = useDragAutoScroll({
    scrollTo: (offset) => scrollRef.current?.scrollTo({ y: offset, animated: false }),
    measure: (callback) => viewportRef.current?.measureInWindow((_x, top, _width, height) => callback(top, height)),
  });
  const [scrollFollow] = useState(() => new Animated.Value(0));
  // Recette du 05/11/2026 au soir (m-carte, Hermann : « Régression : déplacer un mouvement dans le catalogue, le mouvement suit le
  // doigt mais n’est pas fluide ») : la carte portée suit aussi le doigt par une valeur animée, hors rendu ; la liste n'est
  // redessinée que si la décision du geste (place visée, famille survolée) ou la place de la carte portée change — comme pour le
  // défilement (f3-01).
  const [fingerFollow] = useState(() => new Animated.Value(0));
  const liftedFollower = useMemo(() => Animated.add(scrollFollow, fingerFollow), [scrollFollow, fingerFollow]);
  const gesture = useRef({ dy: 0 });
  const scrollDelta = useRef(0);
  const scrollLatest = useRef<((delta: number) => void) | null>(null);
  // Famille repliée survolée par la carte portée, et son dépliage différé.
  const expandHover = useRef<{ key: string; timer: ReturnType<typeof setTimeout> } | null>(null);
  // t-glisser (06/11/2026) : place visée (C1, C2) en attente d'un arrêt de `PLACE_DWELL_MS`, et position de la carte portée
  // (déplacement total depuis le départ, doigt et défilement) au début de l'arrêt.
  const placeDwell = useRef<{ key: string; total: number; timer: ReturnType<typeof setTimeout> } | null>(null);
  const clearPlaceDwell = () => {
    if (placeDwell.current !== null) clearTimeout(placeDwell.current.timer);
    placeDwell.current = null;
  };
  useEffect(
    () => () => {
      if (placeDwell.current !== null) clearTimeout(placeDwell.current.timer);
    },
    [],
  );

  const items = useMemo(() => {
    if (state.status !== "ready") return [];
    // PRE-9 CAT.1 : le compteur actif (« familles » / « mouvements ») se cumule à la recherche et aux filtres.
    const visible = applyMovementCounter(visibleMovementItems(state.entries, query, shownFilters), counter ?? null);
    if (override === null || override.entries !== state.entries) return visible;
    return visible.map((item): MovementCatalogueItem => {
      if (item.kind !== "PILE" || item.key !== override.pileKey) return item;
      const byId = new Map(item.members.map((member) => [member.movement.id, member]));
      const members = override.ids.map((id) => byId.get(id)).filter((member) => member !== undefined);
      return members.length === item.members.length ? { ...item, members } : item;
    });
  }, [state, query, shownFilters, override, counter]);

  // Recette iPhone CAT.1 du 30/10/2026 (Hermann, cat-bascule : « appuyer sur mouvements déplie toutes
  // les listes affichées ») : à l'activation du compteur « mouvements », toutes les piles affichées se
  // déplient ; à sa désactivation (ou au passage à « familles »), l'état de dépliage d'avant revient
  // (choix minimal, non spécifié). Ajusté pendant le rendu : aucune image intermédiaire repliée.
  const activeCounter = counter ?? null;
  const [seenCounter, setSeenCounter] = useState<MovementCounter | null>(activeCounter);
  const [expandedBeforeMovements, setExpandedBeforeMovements] = useState<ReadonlySet<string> | null>(null);
  if (seenCounter !== activeCounter) {
    setSeenCounter(activeCounter);
    if (activeCounter === "MOVEMENTS") {
      setExpandedBeforeMovements(expanded);
      setExpanded(new Set([...expanded, ...pileKeysOf(items)]));
    } else if (seenCounter === "MOVEMENTS" && expandedBeforeMovements !== null) {
      setExpanded(expandedBeforeMovements);
      setExpandedBeforeMovements(null);
    }
  }
  // Recette iPhone CAT.1 du 30/10/2026, constat a) (Hermann : « les piles où se trouvent un ou des
  // mouvements déjà utilisés doivent être dépliées si le ou les mouvements ne sont pas visibles ») :
  // en sélection, à la première lecture du Catalogue, une pile dont un membre masqué est déjà dans la
  // Séance s'ouvre dépliée. Les gestes de l'utilisateur ne sont plus surchargés ensuite.
  const inSessionIds = selection?.inSessionIds;
  const [inSessionUnfolded, setInSessionUnfolded] = useState(false);
  if (!inSessionUnfolded && state.status === "ready" && inSessionIds !== undefined) {
    setInSessionUnfolded(true);
    const hiding = pilesHidingIds(items, inSessionIds);
    if (hiding.length > 0) setExpanded((current) => new Set([...current, ...hiding]));
  }

  // PRE-9 CAT.1 (CE-CAT-CTX-01) : compteurs dérivés de la liste courante elle-même (familles affichées,
  // Mouvements des piles repliées compris, cartes affichées). Remontés à l’écran hôte (zone de contexte).
  const summary = useMemo(() => movementCatalogueSummary(items, expanded), [items, expanded]);
  const ready = state.status === "ready";
  useEffect(() => {
    onSummaryChange?.(ready ? summary : null);
  }, [onSummaryChange, ready, summary]);
  // D-510, règle 8 : au retour après une création, la liste se positionne sur la fiche nouvelle, ou sur sa pile repliée
  // (carte de tête), sans la déployer ; tri, filtres et piles inchangés. La position vient de la mise en page mesurée de
  // l'entrée (`itemBoxes`) et, dans une pile dépliée, de la carte (`memberBoxes`, repère de la pile).
  const scrollTargetItem =
    scrollTarget === null || state.status !== "ready"
      ? null
      : (items.find((item) =>
          item.kind === "SINGLE" ? item.entry.movement.id === scrollTarget : item.members.some((member) => member.movement.id === scrollTarget),
        ) ?? null);
  const pendingScroll = useRef<{ readonly id: string; readonly itemKey: string } | null>(null);
  const scrollToPending = useCallback(() => {
    const pending = pendingScroll.current;
    if (pending === null) return;
    const box = itemBoxes.current.get(pending.itemKey);
    if (box === undefined) return;
    const member = expanded.has(pending.itemKey) ? memberBoxes.current.get(pending.id) : undefined;
    pendingScroll.current = null;
    scrollRef.current?.scrollTo({ y: Math.max(0, box.y + (member?.y ?? 0) - spacing[12]), animated: !reduceMotion });
    onScrollTargetHandled?.(pending.id);
  }, [expanded, onScrollTargetHandled, reduceMotion]);
  useEffect(() => {
    if (scrollTarget === null || state.status !== "ready") return;
    if (scrollTargetItem === null) {
      // Règle 7 : fiche exclue par un filtre actif ou par la recherche — elle ne s'affiche pas, aucun défilement.
      if (state.entries.some((entry) => entry.movement.id === scrollTarget)) onScrollTargetHandled?.(scrollTarget);
      return;
    }
    pendingScroll.current = { id: scrollTarget, itemKey: scrollTargetItem.key };
    scrollToPending();
  }, [scrollTarget, scrollTargetItem, state, onScrollTargetHandled, scrollToPending]);
  useEffect(() => {
    onItemMeasured.current = scrollToPending;
  }, [scrollToPending]);

  // Recette iPhone du 06/11/2026 (t-catalogue, Hermann : « Afficher la liste des mouvements de manière progressive (la c'est
  // une apparition brute) ») : à son apparition, la liste entre en fondu avec une courte montée (durée et courbe de fondu
  // du projet, `MOTION_FADE_DURATION_MS`) ; immédiate sous « Réduire les animations ». [Avant : apparition d'un coup — remplacé.]
  const [listAppear] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (!ready) return;
    if (reduceMotion) {
      listAppear.setValue(1);
      return;
    }
    const animation = Animated.timing(listAppear, {
      toValue: 1,
      duration: MOTION_FADE_DURATION_MS,
      easing: MOTION_FADE_EASING,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [listAppear, ready, reduceMotion]);
  const listAppearStyle = useMemo(
    () => ({
      opacity: listAppear,
      transform: [{ translateY: listAppear.interpolate({ inputRange: [0, 1], outputRange: [LIST_APPEAR_RISE, 0] }) }],
    }),
    [listAppear],
  );

  const entryById = useMemo(
    () => new Map(state.status === "ready" ? state.entries.map((entry) => [entry.movement.id, entry]) : []),
    [state],
  );
  const groupSizes = useMemo(() => {
    const sizes = new Map<string, number>();
    if (state.status === "ready") {
      // Décision de Hermann du 03/11/2026 : seuls les membres actifs comptent — le seul actif d'une
      // famille dont les autres sont archivés (D4) est libre.
      for (const entry of state.entries) {
        const groupId = entry.movement.levelGroup?.groupId;
        if (groupId && !entry.archived) sizes.set(groupId, (sizes.get(groupId) ?? 0) + 1);
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
    // Le déplacement du doigt est relu au premier mouvement (`moveDrag`).
    fingerFollow.setValue(0);
    setDrag({ id, pileKey, ids, from, origin: null, dy: 0, drift: 0, intent: { kind: "NONE" } });
  };

  const liftedTop = (current: Drag) => liftedTopIn(current, itemBoxes.current, memberBoxes.current);

  /** Départ du geste : doigt au toucher initial, centre et haut de la carte portée dans le repère de la liste. */
  const originOf = (current: Drag, slots: readonly DragSlot[]) => {
    const slot = slots.find((candidate) => candidate.id === current.id);
    const pile = current.pileKey !== null ? itemBoxes.current.get(current.pileKey) : undefined;
    const center = slot ? slot.top + slot.height / 2 : (pile?.y ?? 0) + CARD_HEIGHT / 2;
    return { y: lastTouchY.current, center, top: liftedTop(current) ?? 0 };
  };

  /** Ce que ferait le relâchement, carte portée décalée de `total` (doigt et défilement) depuis le départ. */
  const intentAt = (current: Drag, origin: NonNullable<Drag["origin"]>, slots: readonly DragSlot[], total: number): DragIntent => {
    const entry = entryById.get(current.id);
    return dragIntent({
      slots,
      draggedId: current.id,
      familyKey: current.pileKey,
      centerY: origin.center + total,
      reorderTo: Math.max(0, Math.min(current.ids.length - 1, current.from + Math.round(total / memberStep))),
      free: current.pileKey === null && entry !== undefined && isFree(entry),
    });
  };

  /** C5, recette du 28/10 : une famille repliée ne se déplie que si la carte portée s'arrête dessus. */
  const hoverFamily = (hovered: string | null, restart: boolean) => {
    if (hovered === expandHover.current?.key && !restart) return;
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
  };

  /**
   * t-glisser (06/11/2026) : décision du geste annoncée. Une pose sur une carte (`PLACE`) n'est annoncée — filet, décalage,
   * niveaux provisoires — qu'après un arrêt de `PLACE_DWELL_MS` sur la même place ; tout déplacement au-delà de la
   * tolérance relance l'attente. Une place déjà annoncée le reste tant que la carte ne la quitte pas. Les autres décisions
   * (réordonnancement dans le filet, sortie, approche d'une famille repliée) restent immédiates.
   */
  const announcedIntent = (current: Drag, raw: DragIntent, total: number): DragIntent => {
    if (raw.kind !== "PLACE" || sameIntent(raw, current.intent)) {
      clearPlaceDwell();
      return raw;
    }
    const key = JSON.stringify(raw);
    const pending = placeDwell.current;
    if (pending === null || pending.key !== key || Math.abs(total - pending.total) > PLACE_DWELL_TOLERANCE) {
      clearPlaceDwell();
      const draggedId = current.id;
      placeDwell.current = {
        key,
        total,
        timer: setTimeout(() => {
          placeDwell.current = null;
          setDrag((latest) => (latest === null || latest.id !== draggedId ? latest : { ...latest, intent: raw }));
        }, PLACE_DWELL_MS),
      };
    }
    return { kind: "NONE" };
  };

  const moveDrag = (pageY: number) => {
    if (drag === null) return;
    const slots = slotsNow();
    if (drag.origin === null) {
      // Premier déplacement : départ du défilement automatique, que la carte portée suit.
      autoScroll.begin();
      autoScroll.attach((delta) => scrollLatest.current?.(delta));
      scrollFollow.setValue(0);
    }
    const origin = drag.origin ?? originOf(drag, slots);
    const dy = pageY - origin.y;
    scrollDelta.current = autoScroll.track(pageY);
    const top = liftedTop(drag);
    const drift = top === undefined ? drag.drift : top - origin.top;
    const total = dy + scrollDelta.current;
    const raw = intentAt(drag, origin, slots, total);
    hoverFamily(raw.kind === "EXPAND" ? raw.familyKey : null, false);
    const intent = announcedIntent(drag, raw, total);
    gesture.current.dy = dy;
    fingerFollow.setValue(dy - drift);
    if (drag.origin === null || drift !== drag.drift || !sameIntent(intent, drag.intent)) setDrag({ ...drag, origin, dy, drift, intent });
  };

  /**
   * Défilement automatique, à chaque image : la carte portée suit par sa valeur animée ; la liste
   * n'est redessinée que si la décision du geste change. Défiler n'est pas s'arrêter : le dépliage
   * d'une famille survolée attend la fin du défilement (recette du 28/10, f3-01).
   */
  const onAutoScrolled = (delta: number) => {
    scrollDelta.current = delta;
    scrollFollow.setValue(delta);
    if (drag === null || drag.origin === null) return;
    const total = gesture.current.dy + delta;
    const raw = intentAt(drag, drag.origin, slotsNow(), total);
    hoverFamily(raw.kind === "EXPAND" ? raw.familyKey : null, true);
    // t-glisser : défiler n'est pas s'arrêter — la position change à chaque image, l'attente d'une pose repart.
    const intent = announcedIntent(drag, raw, total);
    if (!sameIntent(intent, drag.intent)) setDrag({ ...drag, intent });
  };

  useEffect(() => {
    scrollLatest.current = onAutoScrolled;
    dragRef.current = drag;
  });
  // FAM-05 : la place de la carte portée a changé (pile dépliée au-dessus) — la valeur animée la garde sous le doigt.
  const liftedDrift = drag === null || drag.origin === null ? null : drag.drift;
  useLayoutEffect(() => {
    if (liftedDrift !== null) fingerFollow.setValue(gesture.current.dy - liftedDrift);
  }, [fingerFollow, liftedDrift]);

  const stopDrag = () => {
    setDrag(null);
    autoScroll.end();
    scrollDelta.current = 0;
    if (expandHover.current !== null) clearTimeout(expandHover.current.timer);
    expandHover.current = null;
    clearPlaceDwell();
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
    openOrExpand: () => void,
    catalogueOptions: {
      readonly pileCount?: number;
      readonly swipe: boolean;
      readonly onLongPress?: () => void;
      readonly reorderActions?: readonly SwipeAccessibilityAction[];
      /** D-510 : pile repliée dont un niveau caché est nouveau (« New ↓ » sur la tête). */
      readonly hidesNew?: boolean;
    },
  ) => {
    // PRE-9 A.2 (ARB-22a) : en sélection, une carte (hors pile repliée) se coche au toucher ; ni
    // actions glissées, ni appui long, ni réordonnancement.
    const choosing = selection !== undefined && catalogueOptions.pileCount === undefined;
    const onPress = choosing ? () => selection.onToggle(entry.movement) : openOrExpand;
    const options: typeof catalogueOptions =
      selection === undefined ? catalogueOptions : { pileCount: catalogueOptions.pileCount, swipe: false };
    const selected = choosing && selection.selectedIds.has(entry.movement.id);
    const inSession = choosing && (selection.inSessionIds?.has(entry.movement.id) ?? false);
    const id = entry.movement.id;
    const level = levelPreview?.has(id) ? levelPreview.get(id)! : entry.level;
    const levelLabel = level !== null ? levelPastilleLabel(level) : null;
    // D-510 (règles 6 et 9) : « New » sur une fiche nouvelle ; « New ↓ » sur la tête d'une pile repliée dès qu'un niveau caché
    // est nouveau ; jamais en sélection pour une Séance (ni hors de l'onglet Mouvements, où `newMovementIds` est absent).
    const newState: NewState =
      selection !== undefined ? "NO" : catalogueOptions.hidesNew === true ? "IN_PILE" : (newMovementIds?.has(id) ?? false) ? "YES" : "NO";
    // D-510 (accessibilité) : « nouveau » avec le nom ; « contient un niveau nouveau » pour une tête signalant un niveau caché.
    const newAccessibility = newState === "YES" ? t.newAccessibility : newState === "IN_PILE" ? t.newInPileAccessibility : null;
    const label =
      options.pileCount !== undefined
        ? [fillTemplate(t.pileAccessibilityLabel, { name: entry.movement.name, count: String(options.pileCount) }), newAccessibility]
            .filter(Boolean)
            .join(", ")
        : [
            entry.movement.name,
            levelLabel,
            entry.archived ? t.archivedAccessibility : null,
            newAccessibility,
            inSession ? strings.screens.activities.selection.inSessionAccessibility : null,
          ]
            .filter(Boolean)
            .join(", ");
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
          accessibilityHint={
            options.pileCount !== undefined ? t.pileExpandHint : choosing ? undefined : options.reorderActions ? t.reorderHint : t.openAccessibilityHint
          }
          {...(choosing ? { accessibilityState: { selected } } : {})}
          testID={`movement-card-${id}`}
        >
          <MovementCatalogueCard
            entry={entry}
            level={level}
            selection={choosing ? (selected ? "CHECKED" : "EMPTY") : "NONE"}
            inSession={inSession}
            newState={newState}
          />
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
              // t-catalogue (06/11/2026) : au repli, l'épaisseur de la pile n'apparaît qu'une fois les cartes rentrées.
              <Reanimated.View
                key={`leaf-${depth}`}
                entering={reduceMotion ? undefined : leafEntering}
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
            hitSlop={{ right: COLLAPSE_HIT_EXTRA }}
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
                  hidesNew: item.members.some((other, rank) => rank > 0 && (newMovementIds?.has(other.movement.id) ?? false)),
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
            // Recette iPhone du 06/11/2026 (t-catalogue, Hermann : « appuyer sur le bouton pile : replier et déplier les
            // mouvements lentement avec un glissement des carte ») : au dépliage, chaque carte glisse depuis la carte du
            // dessus jusqu'à sa place, sous les cartes qui la précèdent ; au repli, elle remonte sous la carte du dessus.
            // [Avant : révélation par le bas, 350 ms (B05) — remplacé.]
            <CatalogueMotionView
              key={member.movement.id}
              appear={index > 0 ? { slideFrom: -index * memberStep } : false}
              transition={!settling}
              raised={isLifted}
              style={[
                index > 0 ? styles.memberSpacing : null,
                drag === null ? { zIndex: item.members.length - index } : null,
                isLifted ? styles.liftedFrame : null,
              ]}
              onLayout={(event: LayoutChangeEvent) => {
                recordMemberBox(member.movement.id, event);
                if (index === 0 && isExpanded) setMemberStep(event.nativeEvent.layout.height + MEMBER_GAP);
              }}
              testID={`movement-pile-${item.key}-member-${member.movement.id}`}
            >
              {/* Recette du 27/10 (r10-glisser) : une seule enveloppe pour la carte portée et ses voisines —
                  changer d'enveloppe au début du glisser démontait la carte sous le doigt et figeait le geste. */}
              <DragShift
                shift={isLifted ? 0 : shift}
                follower={isLifted ? liftedFollower : null}
                active={drag !== null}
                follow={isLifted}
                reduceMotion={reduceMotion}
                style={isLifted ? styles.lifted : null}
                testID={isLifted ? `movement-pile-${item.key}-lifted` : `movement-card-${member.movement.id}-slot`}
              >
                {row}
              </DragShift>
            </CatalogueMotionView>
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
          shift={isLifted ? 0 : opening !== null && opening.itemKey === id ? opening.anchorShift : 0}
          follower={isLifted ? liftedFollower : null}
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
          <CatalogueMotionContext.Provider value={!reduceMotion}>
            {/* Place de la liste à l'écran : défilement automatique pendant le geste. */}
            <Animated.View style={[styles.viewport, listAppearStyle]} testID="movement-catalogue-appear">
              <View ref={viewportRef} style={styles.viewport} collapsable={false}>
                <SheetMotionScrollView
                  ref={scrollRef}
                  contentContainerStyle={[
                    styles.list,
                    selection !== undefined ? { paddingBottom: selection.bottomInset } : null,
                    topInset !== undefined ? { paddingTop: spacing[4] + topInset } : null,
                  ]}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                  scrollEnabled={drag === null}
                  onScroll={(event) => autoScroll.handleScroll(event.nativeEvent.contentOffset.y)}
                  scrollEventThrottle={16}
                  onContentSizeChange={(_width, height) => autoScroll.handleContentSize(height)}
                  onLayout={(event: LayoutChangeEvent) => autoScroll.handleLayout(event.nativeEvent.layout.height)}
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
                        // t-catalogue (06/11/2026) : mêmes durée et courbe que le glissement des cartes d'une pile, pour que les
                        // entrées suivantes descendent et remontent avec elles.
                        <CatalogueMotionView
                          key={item.key}
                          appear="reveal"
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
                            follower={null}
                            reduceMotion={reduceMotion}
                            style={null}
                            testID={`movement-item-${item.key}-shift`}
                          >
                            {renderItem(item)}
                          </DragShift>
                        </CatalogueMotionView>
                      );
                    })}
                  </View>
                </SheetMotionScrollView>
              </View>
            </Animated.View>
          </CatalogueMotionContext.Provider>
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

/** Même décision du geste (évite de redessiner la liste à chaque image du défilement). */
function sameIntent(left: DragIntent, right: DragIntent): boolean {
  return JSON.stringify(left) === JSON.stringify(right);
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
  follower,
  reduceMotion,
  style,
  testID,
  children,
}: {
  readonly shift: number;
  readonly active: boolean;
  /** Carte portée : suit le doigt, sans animation. */
  readonly follow: boolean;
  /** Carte portée : défilement automatique accumulé, ajouté hors rendu (`null` sinon). */
  readonly follower: Parameters<typeof Animated.add>[1] | null;
  readonly reduceMotion: boolean;
  readonly style: StyleProp<ViewStyle>;
  readonly testID: string | undefined;
  readonly children: ReactNode;
}) {
  const [offset] = useState(() => new Animated.Value(0));
  const translation = useMemo(() => (follower === null ? offset : Animated.add(offset, follower)), [offset, follower]);
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
    <Animated.View style={[style, { transform: [{ translateY: translation }] }]} testID={testID}>
      {children}
    </Animated.View>
  );
}

/**
 * Recette iPhone du 06/11/2026 (t-catalogue, Hermann : « replier et déplier les mouvements lentement avec un glissement des
 * carte ») : animations de mise en page du Catalogue des Mouvements, sur le fil UI (Reanimated), à la durée de fondu du projet
 * (`MOTION_FADE_DURATION_MS`, 450 ms) et sur la courbe des glissements (`MOTION_EASING`, Bézier 0,33 ; 1 ; 0,68 ; 1). Même
 * principe que `SheetMotionView` (B05 : révélation par le bas des entrées qui apparaissent, transition de place des
 * voisines), plus lent ; les membres d'une pile glissent depuis la carte du dessus (`slideFrom`). Aucune animation sous
 * « Réduire les animations » (`CatalogueMotionContext` faux).
 */
const CATALOGUE_MOTION_MS = MOTION_FADE_DURATION_MS;
const CATALOGUE_TIMING = {
  duration: CATALOGUE_MOTION_MS,
  easing: ReanimatedEasing.bezier(0.33, 1, 0.68, 1),
  reduceMotion: ReduceMotion.System,
};
const catalogueLayout = LinearTransition.duration(CATALOGUE_MOTION_MS)
  .easing(ReanimatedEasing.bezier(0.33, 1, 0.68, 1))
  .reduceMotion(ReduceMotion.System);
/** Vrai : animations de mise en page actives (faux sous « Réduire les animations »). */
const CatalogueMotionContext = createContext(false);
/** t-catalogue : la liste monte de 12 pendant son fondu d'apparition. */
const LIST_APPEAR_RISE = spacing[12];

function revealFrameEntering(values: EntryAnimationsValues): LayoutAnimation {
  "worklet";
  return { initialValues: { height: 0 }, animations: { height: withTiming(values.targetHeight, CATALOGUE_TIMING) } };
}
function revealFrameExiting(values: ExitAnimationsValues): LayoutAnimation {
  "worklet";
  return { initialValues: { height: values.currentHeight }, animations: { height: withTiming(0, CATALOGUE_TIMING) } };
}
function revealContentEntering(values: EntryAnimationsValues): LayoutAnimation {
  "worklet";
  return {
    initialValues: { transform: [{ translateY: values.targetHeight }] },
    animations: { transform: [{ translateY: withTiming(0, CATALOGUE_TIMING) }] },
  };
}
function revealContentExiting(values: ExitAnimationsValues): LayoutAnimation {
  "worklet";
  return {
    initialValues: { transform: [{ translateY: 0 }] },
    animations: { transform: [{ translateY: withTiming(values.currentHeight, CATALOGUE_TIMING) }] },
  };
}
/** t-catalogue : un membre de pile part de la carte du dessus (`offset` négatif) et glisse jusqu'à sa place. */
function slideEntering(offset: number) {
  return (): LayoutAnimation => {
    "worklet";
    return {
      initialValues: { transform: [{ translateY: offset }] },
      animations: { transform: [{ translateY: withTiming(0, CATALOGUE_TIMING) }] },
    };
  };
}
/** t-catalogue : au repli, le membre remonte sous la carte du dessus. */
function slideExiting(offset: number) {
  return (): LayoutAnimation => {
    "worklet";
    return {
      initialValues: { transform: [{ translateY: 0 }] },
      animations: { transform: [{ translateY: withTiming(offset, CATALOGUE_TIMING) }] },
    };
  };
}
/** t-catalogue : l'épaisseur d'une pile repliée apparaît à la fin du repli (fondu court). */
function leafEntering(): LayoutAnimation {
  "worklet";
  return {
    initialValues: { opacity: 0 },
    animations: {
      opacity: withDelay(CATALOGUE_MOTION_MS - MOTION_FADE_DURATION_MS / 3, withTiming(1, { duration: MOTION_FADE_DURATION_MS / 3 })),
    },
  };
}

/**
 * t-catalogue : cadre animé d'une entrée ou d'un membre de pile.
 * - `appear="reveal"` : comme `SheetMotionView` — cadre de découpe (`testID`) et contenu (`${testID}-content`, porte `style`) ;
 * - `appear={{ slideFrom }}` : une seule vue, qui glisse depuis `slideFrom` à l'apparition et y retourne à la disparition ;
 * - `appear={false}` : une seule vue, transition de place seule.
 */
function CatalogueMotionView({
  appear,
  transition = true,
  clip = true,
  bleed = 0,
  raised = false,
  onLayout,
  style,
  testID,
  children,
}: {
  readonly appear: "reveal" | { readonly slideFrom: number } | false;
  readonly transition?: boolean;
  readonly clip?: boolean;
  readonly bleed?: number;
  readonly raised?: boolean;
  readonly onLayout?: (event: LayoutChangeEvent) => void;
  readonly style?: StyleProp<ViewStyle>;
  readonly testID?: string;
  readonly children?: ReactNode;
}) {
  const animated = useContext(CatalogueMotionContext);
  const layoutTransition = animated && transition ? catalogueLayout : undefined;
  const slideFrom = appear !== false && appear !== "reveal" ? appear.slideFrom : null;
  const slide = useMemo(
    () => (slideFrom === null ? null : { entering: slideEntering(slideFrom), exiting: slideExiting(slideFrom) }),
    [slideFrom],
  );
  if (appear !== "reveal") {
    return (
      <Reanimated.View
        entering={animated && slide !== null ? slide.entering : undefined}
        exiting={animated && slide !== null ? slide.exiting : undefined}
        layout={layoutTransition}
        onLayout={onLayout}
        style={[style, raised ? styles.raisedFrame : null]}
        testID={testID}
      >
        {children}
      </Reanimated.View>
    );
  }
  return (
    <Reanimated.View
      entering={animated ? revealFrameEntering : undefined}
      exiting={animated ? revealFrameExiting : undefined}
      layout={layoutTransition}
      onLayout={onLayout}
      style={[
        clip ? styles.clipFrame : null,
        bleed > 0 ? { marginHorizontal: -bleed, paddingHorizontal: bleed } : null,
        raised ? styles.raisedFrame : null,
      ]}
      testID={testID}
    >
      <Reanimated.View
        entering={animated ? revealContentEntering : undefined}
        exiting={animated ? revealContentExiting : undefined}
        style={style}
        testID={testID === undefined ? undefined : `${testID}-content`}
      >
        {children}
      </Reanimated.View>
    </Reanimated.View>
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
 * Carte d'un Mouvement — D-508 (Hermann, 06/11/2026 ; Figma « Carte — Mouvement » `10124:21979`) : 72 de haut, photo 64 à 4
 * du bord (rayon 8), nom et description à 8 de la photo, nom à 8 du haut, Niveau à 12 du bord droit sur la ligne de base du
 * nom (en sélection : 12 avant la case, centrée verticalement), fond blanc, liseré à 50 %. Deux premières étapes de la
 * description, une par ligne, tronquées indépendamment (B03). [Avant : 80 de haut, photo à 8 du bord, rayon 12, fond
 * `#F9FAFC`, Niveau bleu, sélection par fond et contour bleus — remplacé.]
 *
 * D-510 : état « Nouveau » du composant (Non / Oui / Dans la pile) — badge « New » ou « New ↓ » en onglet au coin bas droit.
 */
function MovementCatalogueCard({
  entry,
  level,
  selection = "NONE",
  inSession = false,
  newState = "NO",
}: {
  readonly entry: MovementCatalogueEntry;
  readonly level: MovementLevelPosition | null;
  /** D-508 : case de sélection pour une Séance (Figma « Sélection » : Absente / Vide / Cochée). */
  readonly selection?: "NONE" | "EMPTY" | "CHECKED";
  /**
   * Contre-recette n° 2 du 30/10 (Hermann) : Mouvement déjà présent dans la Séance marqué par un
   * coin replié bleu Kodjo dans l'angle inférieur droit, à l'intérieur du contour (bordure continue,
   * arrondi de l'angle épousé, dimensions inchangées) ; remplace la mention « Dans la séance ».
   */
  readonly inSession?: boolean;
  /** D-510 : Non / Oui (« New ») / Dans la pile (« New ↓ », tête d'une pile repliée dont un niveau caché est nouveau). */
  readonly newState?: NewState;
}) {
  const resolveUri = useMediaUriResolver();
  const { movement } = entry;
  const preview = firstMediaPreviewSource(movement.media);
  const steps = decodeInstructionSteps(movement.description).slice(0, 2);
  const levelLabel = level !== null ? levelPastilleLabel(level) : null;
  const badge = newState === "NO" ? null : NEW_BADGES[newState];
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
        <View style={[styles.titleRow, selection === "NONE" ? styles.titleRowEnd : styles.titleRowBeforeChoice]} testID={`movement-card-title-${movement.id}`}>
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
          <Text
            key={index}
            style={[styles.description, badge !== null ? { marginRight: badge.descriptionInset } : null]}
            numberOfLines={1}
            testID={`movement-card-step-${movement.id}-${index + 1}`}
          >
            {step}
          </Text>
        ))}
      </View>
      {selection !== "NONE" ? (
        <Image
          source={selection === "CHECKED" ? RADIO_CHECKED : RADIO_EMPTY}
          style={styles.choice}
          accessible={false}
          testID={`movement-card-choice-${movement.id}-${selection === "CHECKED" ? "checked" : "empty"}`}
        />
      ) : null}
      {badge !== null ? (
        // D-510 : onglet logé dans le coin bas droit, découpé par l'arrondi de la carte ; pas une cible tactile.
        <View style={styles.newBadgeClip} pointerEvents="none" testID={`movement-card-badge-clip-${movement.id}`}>
          <View style={[styles.newBadge, { width: badge.width }]} testID={`movement-card-new-${movement.id}`}>
            <Image source={badge.shape} style={[styles.newBadgeShape, { width: badge.width }]} accessible={false} />
            <Text style={styles.newBadgeLabel} testID={`movement-card-badge-label-${movement.id}`}>
              {badge.label}
            </Text>
          </View>
        </View>
      ) : null}
      {inSession ? (
        <View style={styles.foldedCorner} pointerEvents="none" testID={`movement-card-in-session-${movement.id}`}>
          <View style={styles.foldedCornerTriangle} />
        </View>
      ) : null}
    </View>
  );
}

/** D-510 : états « Nouveau » de la carte Mouvement. */
type NewState = "NO" | "YES" | "IN_PILE";

/**
 * D-510 (Figma `11762:2205`, `11765:2101`) : onglet vert `color/status/positive-text` de 32 de haut (corps de 24, raccord
 * inversé de rayon 8 au-dessus), 55 de large pour « New », 69 pour « New ↓ » ; libellé à 18,5 du bord gauche de l'onglet, 12
 * du haut. Description arrêtée à 8 du corps de l'onglet (55 et 69 depuis le bord extérieur de la carte, moins les 4 de bord et
 * de marge intérieure).
 */
const NEW_BADGES = {
  YES: {
    label: t.newBadge,
    width: 55,
    descriptionInset: 55 - 4,
    shape: require("../../../assets/icons/catalogue-badge-nouveau.svg"),
  },
  IN_PILE: {
    label: t.newInPileBadge,
    width: 69,
    descriptionInset: 69 - 4,
    shape: require("../../../assets/icons/catalogue-badge-nouveau-pile.svg"),
  },
} as const;
/** D-508 : case de sélection (Figma « DSF / Controls / Radio », `5544:4736`, `5544:4739`). */
const RADIO_CHECKED = require("../../../assets/icons/radio-selectionne.svg");
const RADIO_EMPTY = require("../../../assets/icons/radio-non-selectionne.svg");

const THUMBNAIL_SIZE = 64;
/** Coin replié (contre-recette n° 2) : côté de la zone triangulaire, découpe à 45°. */
const FOLDED_CORNER_SIZE = 18;
/** D-508 : photo à 3,5 dans une bordure de 0,5 — 4 du bord extérieur. [Avant : 8 du bord — remplacé.] */
const CARD_BORDER = 0.5;
const CARD_PADDING = spacing[4] - CARD_BORDER;
/** D-508 : liseré existant (`color/cards/border`, #CCD1E0) à 50 % d'opacité, carte et feuilles de pile. */
const CARD_BORDER_COLOR = "rgba(204, 209, 224, 0.5)";
/** Figma : filet de 2, à 8 des cartes, du milieu de la première au milieu de la dernière carte. */
const RAIL_WIDTH = 2;
const RAIL_TO_CARD = spacing[8];
/** t-catalogue : plan de la zone de repli, au-dessus de toute carte d'une pile. */
const COLLAPSE_ZONE_Z = 1000;

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
  // D-508 : feuilles de pile de 72, blanches, liseré 0,5 à 50 % et même ombre que la carte (chaque couche ombre la suivante),
  // en retrait de 8 puis 16 (écarts conservés). [Figma `Pile — feuille 1/2` : bordure 1 `#E0E3ED`, sans ombre — remplacé.]
  leaf: {
    position: "absolute",
    height: CARD_HEIGHT,
    borderRadius: fixedRadii[12],
    borderWidth: CARD_BORDER,
    borderColor: CARD_BORDER_COLOR,
    backgroundColor: colors.background,
    shadowColor: colors.movementCardShadow,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  // B06 : marge gauche entière de la pile déployée (du bord de l'écran au bord des cartes).
  collapseZone: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: -layout.screenGutter,
    width: layout.screenGutter,
    // t-catalogue (06/11/2026) : au-dessus des cartes de la pile, ordonnées du dessus vers le dessous (`zIndex` décroissant) —
    // la zone de touche élargie vers la carte reste prioritaire. [Avant : 1 — remplacé.]
    zIndex: COLLAPSE_ZONE_Z,
  },
  clipFrame: {
    overflow: "hidden",
  },
  raisedFrame: {
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
  // D-508 : `Carte — Mouvement` — fond blanc, liseré 0,5 à 50 %, rayon 12, ombre 8 % 0/2/10.
  // [B04 : fond `#F9FAFC`, liseré `#CCD1E0` plein — remplacé.]
  card: {
    height: CARD_HEIGHT,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing[8],
    padding: CARD_PADDING,
    borderRadius: fixedRadii[12],
    borderWidth: CARD_BORDER,
    borderColor: CARD_BORDER_COLOR,
    backgroundColor: colors.background,
    shadowColor: colors.movementCardShadow,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  // D-508 : sélection pour une Séance par la case (Figma « Sélection » Vide / Cochée), à 8 du bord droit, centrée.
  // [PRE-9 A.2 : fond et contour de sélection (`colors.selectionSurface`, `colors.selection`) — remplacé.]
  choice: {
    width: 20,
    height: 20,
    alignSelf: "center",
    marginRight: spacing[8] - CARD_PADDING - CARD_BORDER,
  },
  cardArchived: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  faded: {
    opacity: 0.6,
  },
  // D-508 : rayon 8, concentrique à la carte (12 − 4).
  thumbnail: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    borderRadius: fixedRadii[8],
    overflow: "hidden",
  },
  thumbnailImage: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
  },
  thumbnailFallback: {
    backgroundColor: colors.surface,
  },
  // D-508 : nom à 8 du haut de la carte (4 de bord et de marge, 4 ici), description à 4 sous le nom.
  texts: {
    flex: 1,
    paddingTop: spacing[8] - CARD_PADDING - CARD_BORDER,
  },
  // D-508 : Niveau sur la ligne de base du nom, à 12 du bord droit (ou à 12 avant la case en sélection).
  titleRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: spacing[8],
    marginBottom: spacing[4],
  },
  titleRowEnd: {
    marginRight: spacing[12] - CARD_PADDING - CARD_BORDER,
  },
  titleRowBeforeChoice: {
    marginRight: spacing[12] - spacing[8],
  },
  name: {
    ...type.compactCardTitle,
    flex: 1,
    color: colors.textPrimary,
  },
  // D-508 (Figma `10124:21979`) : Niveau en `#141414`. [Avant : bleu KODJO — remplacé.]
  level: {
    ...type.movementCardLevel,
    color: colors.textPrimary,
  },
  description: {
    ...type.movementCardDescription,
    color: colors.movementCardDescription,
  },
  // D-510 : l'onglet couvre le liseré et suit l'arrondi du coin bas droit de la carte (découpe propre au badge : l'ombre de
  // la carte reste intacte).
  newBadgeClip: {
    position: "absolute",
    top: -CARD_BORDER,
    left: -CARD_BORDER,
    right: -CARD_BORDER,
    bottom: -CARD_BORDER,
    borderRadius: fixedRadii[12],
    overflow: "hidden",
  },
  newBadge: {
    position: "absolute",
    right: 0,
    bottom: 0,
    height: 32,
  },
  newBadgeShape: {
    position: "absolute",
    top: 0,
    left: 0,
    height: 32,
  },
  // D-510 : « New », Inter Medium 12, blanc, sans gras ni majuscules forcées. [Recette du 06/11 : rouge, « NEW » — remplacé.]
  newBadgeLabel: {
    ...type.movementCardLevel,
    position: "absolute",
    left: 18.5,
    top: 12,
    lineHeight: 16,
    color: colors.background,
  },
  // Positionné dans la boîte intérieure à la bordure : le contour de la carte reste continu ; le
  // rayon intérieur (rayon extérieur moins la bordure) épouse l'arrondi de l'angle.
  foldedCorner: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: FOLDED_CORNER_SIZE,
    height: FOLDED_CORNER_SIZE,
    borderBottomRightRadius: fixedRadii[12] - CARD_BORDER,
    overflow: "hidden",
  },
  foldedCornerTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: FOLDED_CORNER_SIZE,
    borderLeftColor: "transparent",
    borderBottomWidth: FOLDED_CORNER_SIZE,
    borderBottomColor: colors.primary,
  },
});
