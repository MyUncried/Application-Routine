import { fireEvent, screen } from "@testing-library/react-native";

import type { ExecutionMode } from "@/domain/activities/ExecutionParameters";

/** Libellés d'interface des deux Modes (lexique `executionParameters.sheet.modes`). */
const MODE_BY_LABEL: Readonly<Record<string, ExecutionMode>> = {
  Durée: "DURATION",
  Répétitions: "REPETITIONS",
};

/**
 * Choisit le Mode dans la Feuille Paramètres d'exécution. PRE-5 story 2.4
 * (AD-27) : le Mode est un segmenté en ligne sur toutes les plateformes (le
 * popover natif de PRE-4 est retiré) ; l'option est pressée directement. Lève
 * une erreur sur un libellé inconnu, pour ne jamais choisir un Mode par défaut.
 */
export function chooseExecutionMode(label: string): void {
  const mode = MODE_BY_LABEL[label];
  if (mode === undefined) {
    throw new Error(`chooseExecutionMode : libellé de Mode inconnu « ${label} »`);
  }
  fireEvent.press(screen.getByTestId(`execution-sheet-mode-control-${mode}`));
}

/**
 * PRE-4 story 3.3 (AC8, FR-03-05) : ouvre le champ ± `testID` de la Feuille (N,
 * Pauses, Bip, Compte à rebours, Fin) s'il est fermé, en touchant sa valeur
 * (`${testID}-toggle`). Au repos, seule la valeur est visible ; ses − et +
 * n'apparaissent qu'à l'appui. Sans effet si le champ est déjà ouvert. PRE-5 story
 * 2.6 (AD-27) : les cellules du tableau n'ont plus de ± permanents (Q44 remplacé) ;
 * la cellule Pause d'une ligne s'ouvre de même par `…-pause-toggle`.
 */
export function openExecutionSheetField(testID: string): void {
  if (screen.queryByTestId(`${testID}-increment`)) return;
  fireEvent.press(screen.getByTestId(`${testID}-toggle`));
}

/**
 * PRE-4 story 3.3 : appui bref (`pressIn` puis `pressOut`) sur un − ou un + de la
 * Feuille (`…-increment`, `…-decrement`), après avoir ouvert son champ s'il est fermé.
 * Remplace l'appui direct sur des ± toujours visibles (PRE-3).
 */
export function tapExecutionSheetStep(buttonTestID: string): void {
  const match = /^(.*)-(increment|decrement)$/.exec(buttonTestID);
  if (!match) {
    throw new Error(`tapExecutionSheetStep : « ${buttonTestID} » n'est ni un − ni un +`);
  }
  openExecutionSheetField(match[1]!);
  fireEvent(screen.getByTestId(buttonTestID), "pressIn");
  fireEvent(screen.getByTestId(buttonTestID), "pressOut");
}

/**
 * Type de série par libellé, en minuscules (lexique PRE-4 « identiques » /
 * « variables ») ou capitalisé (lexique PRE-5 `executionParameters.sheet.seriesTypes`).
 */
const SERIES_TYPE_BY_LABEL: Readonly<Record<string, "UNIFORM" | "VARIABLE">> = {
  identiques: "UNIFORM",
  variables: "VARIABLE",
  Identiques: "UNIFORM",
  Variables: "VARIABLE",
};

/**
 * Choisit le Type de série (ex-Régime) dans la Feuille. PRE-5 story 2.4 (AD-27) :
 * segmenté en ligne « Type de série » sur toutes les plateformes (le panneau du
 * Régime est retiré) ; l'option est pressée directement. Lève une erreur sur un
 * libellé inconnu.
 */
export function chooseExecutionRegime(label: string): void {
  const seriesType = SERIES_TYPE_BY_LABEL[label];
  if (seriesType === undefined) {
    throw new Error(`chooseExecutionRegime : libellé de Type de série inconnu « ${label} »`);
  }
  fireEvent.press(screen.getByTestId(`execution-sheet-series-type-control-${seriesType}`));
}

type TestInstance = ReturnType<typeof screen.getByTestId>;

/**
 * Appuie sur un élément de la Feuille. PRE-4 story 3.1 tenait compte du contenu
 * du popover natif du Mode (ancre en `pointerEvents="none"`) ; PRE-5 story 2.4
 * (AD-27) a retiré ce popover : la Feuille n'a plus aucun popover natif et
 * l'appui est délégué directement à `fireEvent.press`. Le helper est conservé
 * pour ses appelants (✕ / ✓ des roues, options des panneaux).
 */
export function pressInExecutionSheet(element: TestInstance): void {
  fireEvent.press(element);
}
