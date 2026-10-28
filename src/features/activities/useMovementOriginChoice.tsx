import { useEffect, useMemo, useState, type ReactNode } from "react";

import { findMovementNameConflict, normalizeMovementName } from "@/domain/activities/Movement";
import { rankMovements, type MovementSearchContext } from "@/domain/activities/movementSuggestion";
import { strings } from "@/shared/i18n";

import type { ActivityDefinitionService, MovementChoice } from "./ActivityDefinitionService";
import type { MovementResultActionLabels, VariantPlacement } from "./MovementResultCard";
import { MovementSearchScreen } from "./MovementSearchScreen";
import { MovementSuggestionPanel } from "./MovementSuggestionPanel";

/** R04 : cinq résultats au maximum dans le panneau sous le nom. */
const PANEL_RESULT_LIMIT = 5;

/** Nom d'un mouvement pour le contrôle d'unicité (identifiant et nom tel que saisi). */
export type MovementNameEntry = { readonly id: string; readonly name: string };

export type MovementOriginChoiceOptions = {
  readonly service: ActivityDefinitionService;
  /** Nom en cours de saisie (brouillon de l'éditeur). */
  readonly name: string;
  /**
   * Panneau de résultats et recherche disponibles : création, aucun choix d'origine fait, aucune
   * saisie détaillée (description, médias, paramètres) — MFN-06 (« sélection explicite, jamais
   * fusion ni écrasement silencieux des informations saisies »). Catégorie et Zones peuvent être
   * renseignées : ce sont les signaux de classement de R02.
   */
  readonly available: boolean;
  /** Contrôle d'unicité pendant la saisie (C01). */
  readonly uniqueness: {
    /** Mouvement en cours d'édition, exclu de sa propre collision ; `null` pour une création distincte. */
    readonly excludedMovementId: string | null;
    /**
     * Mouvements du brouillon de Séance encore référencés (`NEW`, `EDITED`) : ils remplacent, par
     * identifiant, le nom enregistré, ou s'ajoutent à la liste. Absent : aucun.
     */
    readonly draftMovements?: readonly MovementNameEntry[];
    /** Contrôle suspendu : contenu verrouillé (nom non modifiable). */
    readonly suspended?: boolean;
    /**
     * Message masqué, contrôle maintenu : invite grise « (compléter le nom) » affichée (C02) — elle
     * « ne satisfait pas l'unicité » et tient lieu d'explication ; `Terminer` reste indisponible
     * tant que le nom conservé est celui d'un mouvement existant.
     */
    readonly messageHidden?: boolean;
  };
  /** R02 : Catégorie et Zones renseignées dans le brouillon (bonus de classement). */
  readonly context?: MovementSearchContext;
  /** « Utiliser ce mouvement » (panneau ou écran de recherche). */
  readonly onSameMovement: (choice: MovementChoice) => void;
  /** « Créer une variante » puis Plus facile / Plus difficile. */
  readonly onVariant: (choice: MovementChoice, placement: VariantPlacement) => void;
  /**
   * Recette A/B B.10 (remarque 6) : libellés des actions des cartes du panneau (fiche Mouvement) ;
   * absent : libellés de l'éditeur d'Exercice, inchangés.
   */
  readonly actionLabels?: MovementResultActionLabels;
};

export type MovementOriginChoiceState = {
  /**
   * Recherche explicite disponible. PRE-7 (R-8, D-448 point 2) : le lien de l'éditeur est retiré ;
   * écran et fonction conservés sans point d'entrée dans l'interface, en attendant un autre accès.
   */
  readonly canSearch: boolean;
  readonly openSearch: () => void;
  /** Fin de la saisie du nom (Entrée, clavier fermé) : le panneau se ferme, aucune sélection. */
  readonly onNameEndEditing: () => void;
  /** Nom déjà utilisé (C01) : message affiché, `Terminer` indisponible. */
  readonly nameTaken: boolean;
  /**
   * Création DISTINCTE avec ce nom (« Créer un nouveau mouvement ») : contrôle sans exclusion — « une
   * création distincte doit disposer d'une clé différente des mouvements existants » (v7 l.67). Faux :
   * le nom est signalé comme déjà utilisé, rien n'est écrit.
   */
  readonly checkDistinctName: (name: string) => boolean;
  /** `DuplicateMovementNameError` à l'enregistrement (écriture concurrente) : nom signalé. */
  readonly markNameTaken: (name: string) => void;
  /** Panneau sous le nom (rendu par l'éditeur en surimpression), `null` : aucun. */
  readonly nameAssist: ReactNode;
  /** Écran de recherche à rendre par l'écran. */
  readonly overlays: ReactNode;
};

/**
 * PRE-7 story R-5 (D-445 C01, C02, v7 §6 R02 à R05 ; `9882:19049`, `10175:20349`, `10140:20180`)
 * — choix explicite de l'origine du mouvement à la création et unicité du nom, communs aux
 * éditeurs Catalogue et Séance (remplace la suggestion de fin de saisie d'A2.3) :
 * - la liste des mouvements disponibles, locaux compris, est lue une fois (`listMovementChoices`)
 *   puis parcourue en mémoire à chaque frappe (R02, `rankMovements`) ;
 * - « la saisie du nom déclenche la recherche » (R03) : le panneau s'ouvre de lui-même dès qu'un
 *   mouvement atteint le seuil haut, avec cinq résultats au plus (R04) ; il se ferme à la fin de la
 *   saisie (Entrée ne sélectionne rien) et se rouvre à la frappe suivante ; l'ordre affiché est
 *   figé tant qu'un doigt est posé sur le panneau ;
 * - le nom déjà utilisé (C01, clé canonique, identité éditée exclue) est signalé dès la frappe et
 *   reste affiché tant qu'il dure ; dans une création, le panneau garde alors ses cartes (« reprenez
 *   ce mouvement ou choisissez un autre nom ») ;
 * - la recherche explicite reste dans le code (R03), sans point d'entrée depuis R-8 (D-448 point 2) ;
 *   rien n'est écrit : l'écran applique le choix à son brouillon, `Terminer` seul persiste ;
 * - PRE-7 (R-8, D-448 point 1, cr-8) : une correspondance par début de mot ouvre aussi le panneau ;
 *   l'étape de variante n'est annulée ni par la fin de saisie ni par un texte inchangé.
 */
export function useMovementOriginChoice({
  service,
  name,
  available,
  uniqueness,
  context,
  onSameMovement,
  onVariant,
  actionLabels,
}: MovementOriginChoiceOptions): MovementOriginChoiceState {
  const t = strings.screens.activities.editor.movementSuggestion;
  const searchEnabled = available && service.supportsMovementSearch;
  const [choices, setChoices] = useState<readonly MovementChoice[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  // Nom pour lequel le panneau a été fermé (fin de saisie) : toute frappe le rouvre.
  const [dismissedFor, setDismissedFor] = useState<string | null>(null);
  // Nom refusé par une création distincte ou par le repository, par clé canonique (signalé tant que
  // la clé est la même). `blocking` : faux pour un refus de « Créer un nouveau mouvement » portant
  // sur le nom du mouvement édité lui-même — « Mettre à jour » reste valide, `Terminer` disponible.
  const [takenFor, setTakenFor] = useState<{ readonly key: string; readonly blocking: boolean } | null>(null);
  // Étape de variante, liée au nom pour lequel elle a été ouverte : toute frappe revient à la liste.
  const [variantStep, setVariantStep] = useState<{ readonly movementId: string; readonly name: string } | null>(null);
  const variantOf = variantStep !== null && variantStep.name === name ? variantStep.movementId : null;
  const setVariantOf = (movementId: string | null) =>
    setVariantStep(movementId === null ? null : { movementId, name });
  // R04 : résultats figés pendant un appui sur le panneau (`null` : aucun appui en cours).
  const [frozen, setFrozen] = useState<readonly MovementChoice[] | null>(null);

  useEffect(() => {
    if (!service.supportsMovementSearch) return;
    let cancelled = false;
    service.listMovementChoices().then(
      (found) => {
        if (!cancelled) setChoices(found);
      },
      (error: unknown) => {
        // Recherche et contrôle anticipé facultatifs : l'unicité reste garantie à l'enregistrement.
        console.error("Les mouvements n'ont pas pu être lus.", error);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [service]);

  // PRE-8 (B.8, Q6) : un Mouvement archivé n'est jamais proposé pour créer un Exercice ; il reste
  // compté par le contrôle d'unicité du nom (`entries`, ci-dessous).
  const selectable = useMemo(() => choices.filter((choice) => choice.archived !== true), [choices]);
  const byId = useMemo(() => new Map(selectable.map((choice) => [choice.movement.id, choice])), [selectable]);
  const ranked = useMemo(
    () => (searchEnabled ? rankMovements(name, selectable.map((choice) => choice.movement), context) : []),
    [searchEnabled, name, selectable, context],
  );
  const entries = useMemo(() => {
    const merged = new Map<string, string>(choices.map((choice) => [choice.movement.id, choice.movement.name]));
    for (const entry of uniqueness.draftMovements ?? []) merged.set(entry.id, entry.name);
    return [...merged].map(([id, entryName]) => ({ id, name: entryName }));
  }, [choices, uniqueness.draftMovements]);

  const conflicting =
    uniqueness.suspended !== true ? findMovementNameConflict(name, entries, uniqueness.excludedMovementId) : null;
  const conflict = conflicting !== null;
  const refused = takenFor !== null && takenFor.key === normalizeMovementName(name);
  const nameTaken = conflict || (refused && takenFor.blocking);
  const listed = ranked
    .slice(0, PANEL_RESULT_LIMIT)
    .map((result) => byId.get(result.id))
    .filter((choice): choice is MovementChoice => choice !== undefined);
  // Nom déjà utilisé : le panneau garde ses cartes même après la fin de saisie (reprendre ou corriger).
  // PRE-7 (R-8, D-448 point 1) : une correspondance par début de mot ouvre le panneau comme une
  // suggestion. Étape de variante en cours (cr-8) : le panneau reste ouvert jusqu'au choix Plus
  // facile / Plus difficile, quelle que soit la fin de saisie.
  const live =
    searchEnabled &&
    (conflict ||
      variantOf !== null ||
      (dismissedFor !== name && ranked.some((result) => result.suggested || result.wordPrefix)))
      ? listed
      : [];
  const results = frozen ?? live;
  const showMessage = (conflict || refused) && uniqueness.messageHidden !== true;
  const showPanel = results.length > 0 || showMessage;
  // « Reprenez ce mouvement » seulement si le mouvement en conflit est parmi les cartes affichées.
  const conflictShown = conflicting !== null && results.some((choice) => choice.movement.id === conflicting.id);
  const message = showMessage ? (conflictShown ? t.nameTaken : t.nameTakenEdit) : null;

  function checkDistinctName(candidate: string): boolean {
    const taken = findMovementNameConflict(candidate, entries, null);
    if (taken === null) return true;
    setTakenFor({ key: normalizeMovementName(candidate), blocking: taken.id !== uniqueness.excludedMovementId });
    return false;
  }

  const nameAssist = showPanel ? (
    <MovementSuggestionPanel
      message={message}
      results={results}
      variantOf={variantOf}
      onUse={(choice) => {
        setVariantOf(null);
        setFrozen(null);
        onSameMovement(choice);
      }}
      onCreateVariant={(choice) => setVariantOf(choice.movement.id)}
      onChooseVariant={(choice, placement) => {
        setVariantOf(null);
        setFrozen(null);
        onVariant(choice, placement);
      }}
      onBack={() => setVariantOf(null)}
      onTouchingChange={(touching) => setFrozen(touching ? live : null)}
      {...(actionLabels ? { actionLabels } : {})}
    />
  ) : null;

  const overlays =
    isSearchOpen && searchEnabled ? (
      <MovementSearchScreen
        choices={selectable}
        initialQuery={name}
        context={context}
        onUse={(choice) => {
          setIsSearchOpen(false);
          onSameMovement(choice);
        }}
        onChooseVariant={(choice, placement) => {
          setIsSearchOpen(false);
          onVariant(choice, placement);
        }}
        onClose={() => setIsSearchOpen(false)}
      />
    ) : null;

  return {
    canSearch: searchEnabled,
    openSearch: () => {
      if (searchEnabled) setIsSearchOpen(true);
    },
    onNameEndEditing: () => {
      // PRE-7 (R-8, cr-8) : toucher « Créer une variante » ferme le clavier ; cette fin de saisie
      // (`onEndEditing`, perte du focus) n'annule pas l'étape de variante : `variantOf` est conservé
      // et maintient le panneau ouvert ; la fin de saisie reste notée, si bien que « Retour » ferme
      // le panneau. Seule une modification réelle du nom revient à la liste (`variantStep.name`).
      setDismissedFor(name);
    },
    nameTaken,
    checkDistinctName,
    markNameTaken: (taken: string) => setTakenFor({ key: normalizeMovementName(taken), blocking: true }),
    nameAssist,
    overlays,
  };
}
