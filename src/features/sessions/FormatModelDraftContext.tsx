import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

import {
  adaptMovementsToAnswers,
  initialAnswers,
  type FormatModelKey,
  type ModelAnswers,
  type ModelMovement,
} from "@/domain/sessions/formatModels";

/**
 * PRE-9 C.3 (référence Formats du 02/11/2026 §7 ; CE-FMT-02) — brouillon d'un modèle de la fenêtre
 * Formats, partagé par son questionnaire et son récapitulatif : le Retour du récapitulatif revient au
 * questionnaire avec les réponses conservées ; la croix du questionnaire quitte le parcours sans rien
 * ajouter. Rien n'est enregistré : seul « Enregistrer dans la séance » ajoute la structure au brouillon
 * de Composition.
 */

export type FormatModelDraft = {
  readonly model: FormatModelKey;
  readonly answers: ModelAnswers;
  readonly movements: readonly ModelMovement[];
  /** Nom saisi dans la zone de contexte ; vide : aucun nom saisi. */
  readonly name: string;
  /** Ouverture du questionnaire qui a créé ce brouillon (recette n° 3 : brouillon neuf à chaque ouverture). */
  readonly opening: string;
};

type FormatModelDraftContextValue = {
  readonly draft: FormatModelDraft | null;
  readonly start: (model: FormatModelKey, opening: string) => void;
  /** Réédition depuis la Composition (MAJ 04/11/2026 §6 sexies) : réponses et mouvements reconstruits. */
  readonly startWith: (model: FormatModelKey, opening: string, answers: ModelAnswers, movements: readonly ModelMovement[]) => void;
  readonly setAnswers: (update: (answers: ModelAnswers) => ModelAnswers) => void;
  readonly setMovements: (update: (movements: readonly ModelMovement[]) => readonly ModelMovement[]) => void;
  readonly setName: (name: string) => void;
  readonly clear: () => void;
};

const FormatModelDraftContext = createContext<FormatModelDraftContextValue | null>(null);

export function FormatModelDraftProvider({ children }: { readonly children: ReactNode }) {
  const [draft, setDraft] = useState<FormatModelDraft | null>(null);
  const start = useCallback((model: FormatModelKey, opening: string) => {
    setDraft({ model, answers: initialAnswers(model), movements: [], name: "", opening });
  }, []);
  const startWith = useCallback((model: FormatModelKey, opening: string, answers: ModelAnswers, movements: readonly ModelMovement[]) => {
    setDraft({ model, answers, movements, name: "", opening });
  }, []);
  const setAnswers = useCallback((update: (answers: ModelAnswers) => ModelAnswers) => {
    setDraft((current) => {
      if (current === null) return current;
      const answers = update(current.answers);
      // A6, §9.3 : N modifié — lignes ajoutées à compléter, surplus retiré, sans confirmation.
      return { ...current, answers, movements: adaptMovementsToAnswers(current.model, answers, current.movements) };
    });
  }, []);
  const setMovements = useCallback((update: (movements: readonly ModelMovement[]) => readonly ModelMovement[]) => {
    setDraft((current) => (current === null ? current : { ...current, movements: update(current.movements) }));
  }, []);
  const setName = useCallback((name: string) => {
    setDraft((current) => (current === null ? current : { ...current, name }));
  }, []);
  const clear = useCallback(() => setDraft(null), []);
  const value = useMemo(
    () => ({ draft, start, startWith, setAnswers, setMovements, setName, clear }),
    [draft, start, startWith, setAnswers, setMovements, setName, clear],
  );
  return <FormatModelDraftContext.Provider value={value}>{children}</FormatModelDraftContext.Provider>;
}

export function useFormatModelDraft(): FormatModelDraftContextValue {
  const value = useContext(FormatModelDraftContext);
  if (value === null) throw new Error("FormatModelDraftProvider manquant.");
  return value;
}
