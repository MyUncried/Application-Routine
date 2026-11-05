import { useFocusEffect, useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useCallback, useEffect, useRef } from "react";

import { CompositionScreen } from "@/features/sessions/CompositionScreen";
import { useSessionDraft } from "@/features/sessions/SessionDraftContext";

/**
 * Route `Composition d'une séance` (T01-S07 ; T01-S10 : mode modification).
 *
 * Un paramètre `sessionId` optionnel déclenche la réhydratation du brouillon
 * partagé depuis la Séance persistée (CE-T01-S10-01/02) — sans écriture à
 * l'ouverture. Son absence conserve le parcours de création. `sessionId` est
 * transmis exclusivement par la navigation ; la Séance complète n'est jamais
 * sérialisée dans la route.
 *
 * Complément du 5 novembre 2026 (Hermann, §1–§2, CE-CREATION-01) : « Créer » du Catalogue des séances ouvre la
 * modale de création commune (`create=1`) sur un nouveau brouillon, en mémoire seulement. Tant qu'aucun contenu n'y
 * est posé, revenir sur la Composition (croix de la modale, du questionnaire ou de la fiche de création) ramène au
 * Catalogue : aucune Séance enregistrée n'est créée ni modifiée. Une fois un Exercice ou un Format posé, la
 * Composition du nouveau brouillon est l'écran d'arrivée ; la sauvegarde reste celle de la Composition.
 * [« Créer » ouvrait directement une Composition vide — remplacé.]
 */
export default function CompositionRoute() {
  const params = useLocalSearchParams<{ sessionId?: string; keepDraft?: string; create?: string }>();
  const { draft, hydrateFromSession } = useSessionDraft();
  const router = useRouter();
  const navigation = useNavigation();
  const sessionId =
    typeof params.sessionId === "string" && params.sessionId.length > 0 ? params.sessionId : null;

  // PRE-9 C.2 : ouverte depuis « Créer » (CE-FMT-01), la Composition reprend le brouillon que la
  // grille vient d'initialiser (vierge, ou avec l'Exercice choisi) au lieu d'en créer un nouveau.
  const keepDraft = params.keepDraft === "1" && sessionId === null;
  const fromCatalogue = params.create === "1" && sessionId === null;

  useEffect(() => {
    if (keepDraft) return;
    hydrateFromSession?.(sessionId);
  }, [keepDraft, sessionId, hydrateFromSession]);

  // Modale de création présentée une seule fois à l'arrivée depuis le Catalogue ; tant que le brouillon reste vide,
  // tout retour sur la Composition est un abandon de la création : retour au Catalogue des séances.
  const awaitingContent = useRef(fromCatalogue);
  const presented = useRef(false);
  const exerciseCount = useRef(draft.exercises.length);
  const count = draft.exercises.length;
  useEffect(() => {
    exerciseCount.current = count;
    if (count > 0) awaitingContent.current = false;
  }, [count]);
  useFocusEffect(
    useCallback(() => {
      if (!awaitingContent.current) return;
      if (!presented.current) {
        presented.current = true;
        router.push("/formats-window");
        return;
      }
      // Contenu remis au retour (Mouvement choisi, Format enregistré) : lu après sa prise en compte.
      const check = setTimeout(() => {
        if (!awaitingContent.current || exerciseCount.current > 0 || !navigation.isFocused()) return;
        awaitingContent.current = false;
        router.dismissTo({ pathname: "/", params: { catalogueSegment: "sessions" } });
      }, 0);
      return () => clearTimeout(check);
    }, [navigation, router]),
  );

  // Correction non-flash (LOT_3_OF_3) : `sessionId` est désormais transmis
  // EN PROP, et pas seulement via l'effet de réhydratation ci-dessus. Cet
  // effet ne s'exécute qu'APRÈS le premier commit ; sans cette prop, ce
  // premier rendu affichait le formulaire de création et ses valeurs par
  // défaut le temps d'une frame, avant que `editStatus` ne passe à
  // `"loading"`. Voir `CompositionScreenProps.sessionId`.
  return <CompositionScreen sessionId={sessionId} />;
}
