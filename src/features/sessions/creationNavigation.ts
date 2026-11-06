import type { useRouter } from "expo-router";

/**
 * Règle permanente de Hermann du 06/11/2026 (registre ch07) : « Je veux qu’on suive l’ordre des écrans et des modèles lorsqu’on
 * les ouvre et qu’on les ferme en fonction des décisions qu’ils ont prises. Je ne veux pas qu’on ouvre un écran pour rien en
 * prévision d’un scénario où l’on souhaite qu’il apparaisse après une annulation ou une validation. »
 *
 * La modale « Créer un exercice », les questionnaires et récapitulatifs de Format et la fiche d'un mouvement sont des feuilles
 * de la pile racine, posées au-dessus de l'écran qui les ouvre (Catalogue des séances ou Composition). Une validation (Format
 * enregistré, exercice créé) les retire toutes : si une Composition est ouverte dessous, on y revient ; sinon (ouverture par
 * « Créer » du Catalogue), la Composition s'ouvre alors, avec le brouillon que la validation vient de remplir.
 */
type Router = ReturnType<typeof useRouter>;
type RootNavigation = {
  readonly getState: () => { readonly index?: number; readonly routes: readonly { readonly name: string }[] } | undefined;
};

/** Nom, dans la pile racine, du groupe d'écrans de création (Composition et ses écrans poussés). */
export const CREATION_GROUP_ROUTE = "(creation)";

export function closeCreationModals(router: Router, navigation: RootNavigation): void {
  const state = navigation.getState();
  const routes = state?.routes ?? [];
  const index = state?.index ?? routes.length - 1;
  const at = routes.map((route) => route.name).lastIndexOf(CREATION_GROUP_ROUTE);
  if (at >= 0) {
    if (index > at) router.dismiss(index - at);
    return;
  }
  // Ouverture par « Créer » du Catalogue : les feuilles se retirent, puis la Composition s'ouvre sur le brouillon rempli.
  if (index > 0) router.dismiss(index);
  router.push({ pathname: "/composition", params: { keepDraft: "1" } });
}
