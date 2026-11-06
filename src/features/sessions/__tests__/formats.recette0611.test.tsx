import { describe, expect, it, jest } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
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
 */
const cell: CellBinding = () => ({ inputRef: () => undefined, onFocus: () => undefined, onBlur: () => undefined, active: false });
const movement = (id: string, values: MovementValues): ModelMovement => ({ exercise: { id, name: id }, values }) as unknown as ModelMovement;

describe("charges des tableaux à une ligne par mouvement (t-coche-direct)", () => {
  it("Tabata à deux mouvements, « Avec charge » : plus de « (+ kg) », case vide orange avec un trait ; une saisie applique la charge", () => {
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
    expect(screen.queryByTestId("format-objective-load-0-add")).toBeNull();
    const empty = screen.getByTestId("format-objective-load-0");
    expect(empty.props.placeholder).toBe("—");
    expect(StyleSheet.flatten(empty.props.style)).toMatchObject({ borderColor: toVerifyColors.border, backgroundColor: toVerifyColors.surface });
    // Valeur renseignée : cadre ordinaire.
    expect(StyleSheet.flatten(screen.getByTestId("format-objective-load-1").props.style).borderColor).toBeUndefined();
    fireEvent(empty, "focus");
    fireEvent.changeText(empty, "8");
    expect(onChange).toHaveBeenLastCalledWith(0, expect.objectContaining({ loadKg: 8, loadOn: true }));
  });

  it("Suivant : Objectif → Pause → Charge → ligne suivante, charge toujours parcourue (Tabata, Death by, AMRAP)", () => {
    const two = [movement("a", { mode: "DURATION", repetitions: 20 }), movement("b", { mode: "DURATION", repetitions: 20 })];
    expect(tableCellOrder("TABATA", two, { withLoad: true })).toEqual(["obj-0", "pause-0", "load-0", "obj-1", "pause-1", "load-1"].map((key) => `${key}-0`));
    expect(tableCellOrder("DEATH_BY", two, { withLoad: true })).toEqual(["start-0", "sinc-0", "load-0", "start-1", "sinc-1", "load-1"].map((key) => `${key}-0`));
    expect(tableCellOrder("AMRAP", two, { withLoad: true })).toEqual(["obj-0", "load-0", "obj-1", "load-1"].map((key) => `${key}-0`));
    // Sans « Avec charge » : pas de case de charge.
    expect(tableCellOrder("TABATA", two, { withLoad: false })).toEqual(["obj-0", "pause-0", "obj-1", "pause-1"].map((key) => `${key}-0`));
  });
});

describe("présentation des tableaux (t-coche-q, r-colonnes, n-cadres, constat d)", () => {
  it("pas de trait sous la dernière ligne ; dernière colonne calée à droite ; Max calé à droite", () => {
    render(
      <AmrapTable
        movements={[movement("a", { mode: "REPETITIONS", repetitions: 10, max: false }), movement("b", { mode: "REPETITIONS", repetitions: 8, max: false })]}
        increasing={false}
        withLoad={false}
        onChange={() => undefined}
        cell={cell}
      />,
    );
    expect(StyleSheet.flatten(screen.getByTestId("format-amrap-row-0").props.style).borderBottomWidth).toBeGreaterThan(0);
    expect(StyleSheet.flatten(screen.getByTestId("format-amrap-row-1").props.style).borderBottomWidth).toBe(0);
    expect(StyleSheet.flatten(screen.getByTestId("format-amrap-max-1").props.style)).toMatchObject({ alignItems: "flex-end", paddingRight: 10 });
    // Un seul cadre : le tableau prend la couleur de son cadre (plus de second cadre).
    expect(StyleSheet.flatten(screen.getByTestId("format-amrap-table").props.style)).toMatchObject({ backgroundColor: "transparent", marginHorizontal: 0 });
  });

  it("tableau des séries : dernière série calée à droite, pas de fond blanc (Progression)", () => {
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
    expect(StyleSheet.flatten(screen.getByTestId("format-progression-0-2-reps").props.style)).toMatchObject({ textAlign: "right" });
    expect(StyleSheet.flatten(screen.getByTestId("format-progression-0-0-reps").props.style).textAlign).toBe("center");
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

describe("tableau des séries : la colonne suivante apparaît au focus (t-coche-q)", () => {
  it("focus sur la dernière colonne visible : décalage d'une colonne ; sur la dernière série : aucun décalage de plus", () => {
    const scrollTo = jest.spyOn(ScrollView.prototype, "scrollTo").mockImplementation(() => undefined);
    const cells = Array.from({ length: 6 }, (_, at) => ({ repetitions: 10 + at, loadKg: null }));
    render(<SeriesTable model="PROGRESSION" movements={[movement("a", { mode: "REPETITIONS", cells })]} count={6} withLoad={false} onChange={() => undefined} cell={cell} />);
    // Fenêtre de 229 : trois colonnes de 71 ((229 − 16) / 3).
    fireEvent(screen.getByTestId("format-progression-series"), "layout", { nativeEvent: { layout: { x: 0, y: 0, width: 229, height: 60 } } });
    fireEvent(screen.getByTestId("format-progression-0-2-reps"), "focus");
    expect(scrollTo).toHaveBeenLastCalledWith({ x: 4 * 71 - 229, animated: false });
    fireEvent(screen.getByTestId("format-progression-0-5-reps"), "focus");
    expect(scrollTo).toHaveBeenLastCalledWith({ x: 6 * 71 - 229, animated: false });
    scrollTo.mockRestore();
  });
});
