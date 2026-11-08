import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { act } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";

import type { ModelMovement, MovementValues } from "@/domain/sessions/formatModels";
import { AmrapTable, ObjectivePauseTable, SeriesTable, TableCell, tableCellOrder, type CellBinding } from "@/features/sessions/FormatTables";
import { toVerifyColors } from "@/shared/ui/toVerifyColors";

/**
 * Recette iPhone du 06/11/2026 (Hermann) — tableaux des Formats :
 * - t-coche-direct : « retirer (+kg), mettre les cadres oranges avec un trait sur les champs charge qui ne sont pas renseignés » ;
 *   « il faut que le bouton Suivant mette aussi le focus sur charge (Objectif > Pause > Charge > Ligne suivante) » ;
 * - r-suivant (réponse C) : Tabata, 30/30, Renforcement, Death by « et s'il y a un autre format que j'ai oublié » ;
 * - t-coche-q : « supprimer la dernière barre verticale d'un cadre si elle existe » ;
 * - n-cadres, r-colonnes, constat d : dernière colonne calée à droite avec les autres textes ;
 * - t-emom-duree, t-coche-direct : pastilles assez larges pour leur texte, en saisie comme au repos.
 * [Remarque générale e du 06/11/2026 (homogénéité des tableaux, convention des champs de valeur) : colonnes de même largeur, calées à
 * droite, valeur centrée, aucun liseré — remplace « dernière colonne calée à droite » et le liseré orange.]
 */
const cell: CellBinding = () => ({ inputRef: () => undefined, onFocus: () => undefined, onBlur: () => undefined, active: false });
const movement = (id: string, values: MovementValues): ModelMovement => ({ exercise: { id, name: id }, values }) as unknown as ModelMovement;

describe("charges des tableaux à une ligne par mouvement (t-coche-direct)", () => {
  // t-coche-direct (06/11/2026) toujours en vigueur pour Tabata, 30/30, Renforcement, À l'échec et Death by (« Aucun comportement
  // fonctionnel existant ne change ») ; seule la présentation suit la spécification de Hermann du 08/11/2026 (B) : plus de colonne
  // Charge, charge sous l'Objectif, Regular 11 sans cadre quand elle est renseignée, cadre orange avec un trait quand elle est vide.
  it("Tabata à deux mouvements, « Avec charge » : pas de « +kg », charge toujours présente sous l'Objectif ; vide : trait dans un cadre orange ; une saisie applique la charge", () => {
    const onChange = jest.fn();
    render(
      <ObjectivePauseTable
        model="TABATA"
        movements={[movement("a", { mode: "DURATION", repetitions: 20 }), movement("b", { mode: "DURATION", repetitions: 20, loadOn: true, loadKg: 12 })]}
        objectiveFallback={20}
        pauseFallback={() => 10}
        withLoad
        onChange={onChange}
        onAddLoad={() => undefined}
        cell={cell}
      />,
    );
    expect(screen.queryByTestId("format-objective-0-charge")).toBeNull();
    expect(screen.getByTestId("format-objective-0-unit")).toHaveTextContent("(durée)");
    const empty = screen.getByTestId("format-objective-load-0");
    expect(empty.props.placeholder).toBe("—");
    expect(StyleSheet.flatten(empty.props.style)).toMatchObject({ borderWidth: 0, backgroundColor: toVerifyColors.surface, width: 44 });
    const load = screen.getByTestId("format-objective-load-1");
    expect(load.props.value).toBe("(12 kg)");
    expect(StyleSheet.flatten(load.props.style)).toMatchObject({ backgroundColor: "transparent", fontSize: 11, fontFamily: "Inter_400Regular" });
    fireEvent(empty, "focus");
    fireEvent.changeText(empty, "8");
    expect(onChange).toHaveBeenLastCalledWith(0, expect.objectContaining({ loadKg: 8, loadOn: true }));
  });

  it("Suivant : Objectif → Pause → Charge → ligne suivante, charge toujours parcourue (Tabata, Death by) ; AMRAP : charge affichée seulement", () => {
    const two = [movement("a", { mode: "DURATION", repetitions: 20 }), movement("b", { mode: "DURATION", repetitions: 20 })];
    expect(tableCellOrder("TABATA", two, { withLoad: true })).toEqual(["obj-0", "pause-0", "load-0", "obj-1", "pause-1", "load-1"].map((key) => `${key}-0`));
    expect(tableCellOrder("DEATH_BY", two, { withLoad: true })).toEqual(["start-0", "sinc-0", "load-0", "start-1", "sinc-1", "load-1"].map((key) => `${key}-0`));
    // AMRAP (spécification B, « (rép., +kg) ») : seule une charge affichée par « +kg » est parcourue. [Charge toujours parcourue —
    // remplacé le 08/11/2026 pour l'AMRAP.]
    expect(tableCellOrder("AMRAP", two, { withLoad: true })).toEqual(["obj-0", "obj-1"].map((key) => `${key}-0`));
    const loaded = [movement("a", { mode: "REPETITIONS", repetitions: 10, loadOn: true }), movement("b", { mode: "REPETITIONS", repetitions: 10 })];
    expect(tableCellOrder("AMRAP", loaded, { withLoad: true })).toEqual(["obj-0", "load-0", "obj-1"].map((key) => `${key}-0`));
    // Sans « Avec charge » : pas de case de charge.
    expect(tableCellOrder("TABATA", two, { withLoad: false })).toEqual(["obj-0", "pause-0", "obj-1", "pause-1"].map((key) => `${key}-0`));
  });
});

describe("présentation des tableaux (t-coche-q ; remarque e du 06/11 ; spécification du 08/11)", () => {
  // [Trait sous chaque ligne sauf la dernière ; colonnes mesurées (56 au moins) ; Max de 26 calé à droite — remplacés le 08/11/2026 :
  // séparateur en haut de chaque ligne, colonnes de 44, radio centré (spécification de Hermann, B §4.1 à §4.4).]
  it("AMRAP : cellules de 44 sans fond ; Max de 44, radio centré ; tableau sans fond propre", () => {
    render(
      <AmrapTable
        movements={[movement("a", { mode: "REPETITIONS", repetitions: 10, max: false }), movement("b", { mode: "REPETITIONS", repetitions: 8, max: false })]}
        increasing={false}
        withLoad={false}
        onChange={() => undefined}
        cell={cell}
      />,
    );
    const objective = StyleSheet.flatten(screen.getByTestId("format-amrap-reps-1").props.style);
    expect(objective).toMatchObject({ width: 44, textAlign: "center", height: 24, borderRadius: 10, borderWidth: 0, paddingHorizontal: 0, backgroundColor: "transparent" });
    expect(StyleSheet.flatten(screen.getByTestId("format-amrap-max-1").props.style)).toMatchObject({ width: 44 });
    expect(StyleSheet.flatten(screen.getByTestId("format-amrap-radio-1").props.style)).toMatchObject({ width: 20, top: 12, left: 12 });
    expect(StyleSheet.flatten(screen.getByTestId("format-amrap-table").props.style).backgroundColor).toBeUndefined();
  });

  it("tableau des séries : toutes les séries au même cadre de 44, centré, sans fond (Progression)", () => {
    render(
      <SeriesTable
        model="PROGRESSION"
        movements={[movement("a", { mode: "REPETITIONS", cells: [{ repetitions: 10, loadKg: null }, { repetitions: 12, loadKg: null }, { repetitions: 14, loadKg: null }] })]}
        count={3}
        withLoad={false}
        onChange={() => undefined}
        cell={cell}
      />,
    );
    const last = StyleSheet.flatten(screen.getByTestId("format-progression-0-2-reps").props.style);
    const first = StyleSheet.flatten(screen.getByTestId("format-progression-0-0-reps").props.style);
    expect(last).toMatchObject({ textAlign: "center", backgroundColor: "transparent", width: 44 });
    expect(first.width).toBe(last.width);
    expect(StyleSheet.flatten(screen.getByTestId("format-progression-table").props.style).backgroundColor).toBeUndefined();
  });
});

describe("pastilles à la largeur de leur texte (t-emom-duree, t-coche-direct)", () => {
  it("une pastille est dimensionnée par un texte invisible identique, en saisie comme au repos", () => {
    render(<TableCell kind="duration" value={750} badge format={() => "12 min 30"} onChange={() => undefined} label="intervalle" testID="interval" />);
    const sizer = () => screen.UNSAFE_getAllByType(Text).find((node) => StyleSheet.flatten(node.props.style).opacity === 0);
    expect(sizer()?.props.children).toBe("12 min 30");
    expect(StyleSheet.flatten(screen.getByTestId("interval").props.style)).toMatchObject({ position: "absolute", left: 0, right: 0 });
    fireEvent(screen.getByTestId("interval"), "focus");
    expect(sizer()?.props.children).toBe("12:30");
  });
});

describe("tableau des séries : la colonne suivante apparaît au focus (t-coche-q), lentement (remarque B du 06/11)", () => {
  it("focus sur la dernière colonne visible : décalage animé d'une colonne ; sur la dernière série : aucun décalage de plus", () => {
    jest.useFakeTimers();
    const scrollTo = jest.spyOn(ScrollView.prototype, "scrollTo").mockImplementation(() => undefined);
    const cells = Array.from({ length: 6 }, (_, at) => ({ repetitions: 10 + at, loadKg: null }));
    render(<SeriesTable model="PROGRESSION" movements={[movement("a", { mode: "REPETITIONS", cells })]} count={6} withLoad={false} onChange={() => undefined} cell={cell} />);
    // Spécification de Hermann du 08/11/2026 (A §4.1) : colonnes de 44 séparées de 12 (pas de 56), trois visibles (44 × 3 + 12 × 2 = 156) ;
    // zone défilante = écart de 12 avec le nom + 156 + marge droite de 16. [Largeur mesurée, écart de 8 — remplacés le 08/11/2026.]
    expect(StyleSheet.flatten(screen.getByTestId("format-progression-series").props.style).width).toBe(12 + 156 + 16);
    fireEvent(screen.getByTestId("format-progression-0-2-reps"), "focus");
    // Pas de saut : après 100 ms, le tableau n'a fait qu'une partie du chemin.
    act(() => {
      jest.advanceTimersByTime(100);
    });
    const midway = (scrollTo.mock.calls.at(-1)?.[0] as { x: number }).x;
    expect(midway).toBeGreaterThan(0);
    expect(midway).toBeLessThan(56);
    act(() => {
      jest.advanceTimersByTime(600);
    });
    // Colonnes 0 à 3 visibles : décalage d'une colonne (44 + 12).
    expect(scrollTo).toHaveBeenLastCalledWith({ x: 56, animated: false });
    fireEvent(screen.getByTestId("format-progression-0-5-reps"), "focus");
    act(() => {
      jest.advanceTimersByTime(600);
    });
    // Dernière série : elle est seulement rendue visible (6 × 56 − 12 − 156).
    expect(scrollTo).toHaveBeenLastCalledWith({ x: 6 * 56 - 12 - 156, animated: false });
    scrollTo.mockRestore();
    jest.useRealTimers();
  });

  // [« largeur par colonne (y-format-cadres, 07/11/2026) : chaque colonne prend son plus large champ » et « a-amrap-table (08/11/2026) :
  // titre mesuré, colonne Charge à la largeur de son titre ou de sa valeur » — remplacés le 08/11/2026 par la spécification de Hermann
  // (A §4.1, B §4.1 : largeur fixe de 44 ; « La largeur ne varie jamais »).]
  it("spécification du 08/11 : largeur fixe de 44 quelle que soit la valeur (durée longue comprise), plus aucune mesure", () => {
    render(
      <AmrapTable
        movements={[movement("a", { mode: "DURATION", repetitions: 1359, max: false }), movement("b", { mode: "REPETITIONS", repetitions: 8, max: false })]}
        increasing
        withLoad
        onChange={() => undefined}
        cell={cell}
      />,
    );
    expect(screen.getByTestId("format-amrap-reps-0").props.value).toBe("22′39″");
    for (const id of ["format-amrap-reps-0", "format-amrap-reps-1", "format-amrap-increment-0"]) {
      expect(StyleSheet.flatten(screen.getByTestId(id).props.style).width).toBe(44);
    }
    expect(screen.queryByTestId("format-amrap-reps-0-measure", { includeHiddenElements: true })).toBeNull();
    expect(StyleSheet.flatten(screen.getByTestId("format-amrap-max-0").props.style).width).toBe(44);
  });
});
