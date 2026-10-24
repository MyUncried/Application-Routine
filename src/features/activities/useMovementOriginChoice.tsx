import { useEffect, useRef, useState, type ReactNode } from "react";
import { Platform } from "react-native";

import { normalizeMovementName } from "@/domain/activities/Movement";
import { findCloseMovement } from "@/domain/activities/movementSuggestion";

import type { ActivityDefinitionService, MovementChoice } from "./ActivityDefinitionService";
import { MovementSearchScreen } from "./MovementSearchScreen";
import { MovementSuggestionSheet, type MovementOriginChoice } from "./MovementSuggestionSheet";

export type MovementOriginChoiceOptions = {
  readonly service: ActivityDefinitionService;
  /**
   * Suggestion et recherche disponibles : création, aucun choix d'origine fait, brouillon ne
   * portant que le nom (« avant la saisie détaillée », MFN-06 ; aucune sélection ne peut alors
   * écraser une autre saisie). Relu au rendu : une feuille en attente n'est plus montrée dès que
   * la disponibilité tombe.
   */
  readonly available: boolean;
  /** « Même geste, autres paramètres » ou sélection d'un résultat de recherche. */
  readonly onSameMovement: (choice: MovementChoice) => void;
  /** « Variante de ce geste ». */
  readonly onVariant: (choice: MovementChoice) => void;
};

export type MovementOriginChoiceState = {
  /** Recherche disponible (lien du formulaire). */
  readonly canSearch: boolean;
  /** Fin de saisie du nom : propose un geste proche, une seule fois par geste. */
  readonly proposeFor: (name: string) => void;
  readonly openSearch: () => void;
  /** Feuille de suggestion et écran de recherche à rendre par l'écran. */
  readonly overlays: ReactNode;
};

type PendingAfterDismiss = "SEARCH" | null;

/**
 * PRE-7 story A2.3 (MFN-05, MFN-06, D-439 ; `9882:19049`, `9959:19623`) — choix explicite de
 * l'origine du geste à la création, commun aux éditeurs Catalogue et Séance :
 * - à la fin de la saisie du nom, un geste au nom proche (`findCloseMovement`, lexical) est proposé
 *   une seule fois dans la feuille à trois choix ; « Geste indépendant » ou le retour système la
 *   ferment sans rien changer, et le geste n'est plus reproposé ;
 * - la recherche explicite reste accessible sans similarité (lien du formulaire, ou « Rechercher
 *   un autre geste ») ; sa sélection reprend le geste choisi ;
 * - rien n'est écrit : l'écran applique le choix à son brouillon, `Terminer` seul persiste.
 *
 * iOS : la feuille en fondu reste montée invisible jusqu'à `onDismiss` avant que l'écran de
 * recherche ne soit présenté (deux présentations natives simultanées échouent) — même procédé que
 * `useReferenceSheet`.
 */
export function useMovementOriginChoice({
  service,
  available,
  onSameMovement,
  onVariant,
}: MovementOriginChoiceOptions): MovementOriginChoiceState {
  const enabled = available && service.supportsMovementSearch;
  const [suggestion, setSuggestion] = useState<MovementChoice | null>(null);
  const [isSuggestionVisible, setIsSuggestionVisible] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const proposedIds = useRef(new Set<string>());
  const requestRef = useRef(0);
  const pendingRef = useRef<PendingAfterDismiss>(null);
  const enabledRef = useRef(enabled);
  const overlayRef = useRef(false);
  useEffect(() => {
    enabledRef.current = enabled;
    overlayRef.current = suggestion !== null || isSearchOpen;
  }, [enabled, suggestion, isSearchOpen]);

  function runPending() {
    const pending = pendingRef.current;
    pendingRef.current = null;
    setSuggestion(null);
    if (pending === "SEARCH" && enabledRef.current) {
      setIsSearchOpen(true);
    }
  }

  function closeSuggestion(then: PendingAfterDismiss) {
    pendingRef.current = then;
    setIsSuggestionVisible(false);
    if (Platform.OS !== "ios") runPending();
  }

  function proposeFor(name: string) {
    if (!enabled || normalizeMovementName(name).length === 0 || suggestion !== null || isSearchOpen) {
      return;
    }
    const request = requestRef.current + 1;
    requestRef.current = request;
    service.searchMovements("").then(
      (choices) => {
        // Revue : réponse tardive ignorée si la création n'est plus « nom seul », ou si une feuille
        // (même en fondu de fermeture) ou la recherche est présente : jamais deux présentations.
        if (requestRef.current !== request || !enabledRef.current || overlayRef.current) return;
        const close = findCloseMovement(
          name,
          choices.map((choice) => choice.movement),
          proposedIds.current,
        );
        const found = close ? choices.find((choice) => choice.movement.id === close.id) : undefined;
        if (!found) return;
        proposedIds.current.add(found.movement.id);
        setSuggestion(found);
        setIsSuggestionVisible(true);
      },
      (error: unknown) => {
        // Suggestion facultative : un échec de lecture n'empêche pas la création.
        console.error("La suggestion de geste n'a pas pu être calculée.", error);
      },
    );
  }

  function choose(choice: MovementOriginChoice) {
    const current = suggestion;
    closeSuggestion(null);
    if (current === null) return;
    if (choice === "SAME_MOVEMENT") onSameMovement(current);
    if (choice === "VARIANT") onVariant(current);
  }

  const overlays = (
    <>
      {suggestion !== null && enabled ? (
        <MovementSuggestionSheet
          visible={isSuggestionVisible}
          suggestion={suggestion}
          onChoose={choose}
          onSearch={() => closeSuggestion("SEARCH")}
          onDismiss={() => closeSuggestion(null)}
          onDismissed={runPending}
        />
      ) : null}
      {isSearchOpen && enabled ? (
        <MovementSearchScreen
          service={service}
          onSelect={(choice) => {
            setIsSearchOpen(false);
            onSameMovement(choice);
          }}
          onClose={() => setIsSearchOpen(false)}
        />
      ) : null}
    </>
  );

  return {
    canSearch: enabled,
    proposeFor,
    openSearch: () => {
      // Revue : aucune présentation tant que la feuille est montée (fondu de fermeture iOS compris).
      if (enabled && suggestion === null) setIsSearchOpen(true);
    },
    overlays,
  };
}
