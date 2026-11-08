import { describe, expect, it } from "@jest/globals";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { StyleSheet } from "react-native";

import type { ModelMovement, MovementValues } from "@/domain/sessions/formatModels";
import { AmrapTable, DeathByTable, ObjectivePauseTable, SeriesTable, TABLE_LAYOUT, formatPrimeDuration, type CellBinding } from "@/features/sessions/FormatTables";

/**
 * Spécification de Hermann du 08/11/2026 (recette du 08/11/2026 — spécifications des tableaux, texte complet au registre ch07) :
 * A — tableau « séries en colonnes » (référence EMOM, Figma `8624:30392`) ; B — tableau « paramètres en colonnes » (référence AMRAP,
 * Figma `8624:30521`). « Appliquer ces valeurs exactement. » ; « Tout ce qui est commun doit rester identique. »
 *
 * Note de recette b-emom-table (Hermann, 08/11/2026) : « Quand on appui sur (+kg) la ligne des charges s'affiche mais s'éloigne de la
 * ligne du nom du mouvement. C'est une régression. […] Mesurer une bonne fois pour toute cet écart et arrêter d'en changer à chaque
 * fois. » — les positions verticales des deux états sont figées ici (A §4.4, B §4.4).
 *
 * Jest vérifie les valeurs de style (largeurs, écarts, positions) ; il ne prouve pas le rendu sur iPhone.
 */
const cell: CellBinding = () => ({ inputRef: () => undefined, onFocus: () => undefined, onBlur: () => undefined, active: false });
const movement = (id: string, values: MovementValues): ModelMovement => ({ exercise: { id, name: id }, values }) as unknown as ModelMovement;
const style = (testID: string) => StyleSheet.flatten(screen.getByTestId(testID).props.style);

describe("format des durées (A §1, B §1)", () => {
  it("M′SS″ à partir d'une minute, S″ en dessous ; prime U+2032 et double prime U+2033, aucun espace", () => {
    expect(formatPrimeDuration(60)).toBe("1′00″");
    expect(formatPrimeDuration(360)).toBe("6′00″");
    expect(formatPrimeDuration(1359)).toBe("22′39″");
    expect(formatPrimeDuration(720)).toBe("12′00″");
    expect(formatPrimeDuration(30)).toBe("30″");
    expect(formatPrimeDuration(5)).toBe("5″");
    expect(formatPrimeDuration(99 * 60 + 59)).toBe("99′59″");
  });
});

describe("géométrie commune des deux tableaux (A §4, B §4)", () => {
  it("constantes : colonnes de 44, écart de 12 (pas de 56), marges de 16, en-tête de 28, lignes de 44, marge basse de 3,5", () => {
    expect(TABLE_LAYOUT).toMatchObject({
      columnWidth: 44,
      columnGap: 12,
      sideInset: 16,
      nameGap: 12,
      headerHeight: 28,
      headerTextTop: 6.5,
      rowHeight: 44,
      bottomInset: 3.5,
      nameTop: 6.5,
      tagTop: 24.5,
      cellTop: 10,
      cellTopCharged: 2.5,
      cellHeight: 24,
      chargeTop: 24.5,
      radioTop: 12,
    });
    // Avec 3 colonnes dans un cadre de 370 : 198–242, 254–298, 310–354 (dernière à 16 du bord droit).
    const starts = [0, 1, 2].map((at) => 370 - TABLE_LAYOUT.sideInset - TABLE_LAYOUT.columnWidth - (2 - at) * (TABLE_LAYOUT.columnWidth + TABLE_LAYOUT.columnGap));
    expect(starts).toEqual([198, 254, 310]);
    // Hauteur avec 2 mouvements : 28 + 44 × 2 + 3,5 = 119,5.
    expect(TABLE_LAYOUT.headerHeight + 2 * TABLE_LAYOUT.rowHeight + TABLE_LAYOUT.bottomInset).toBe(119.5);
  });
});

describe("tableau « séries en colonnes » (A) — EMOM", () => {
  const render2 = (loadOn: boolean) =>
    render(
      <SeriesTable
        model="EMOM"
        movements={[
          movement("Squats sautés", { mode: "REPETITIONS", cells: [{ repetitions: 10, loadKg: null }, { repetitions: 10, loadKg: null }, { repetitions: 10, loadKg: null }] }),
          movement("Fentes avant", { mode: "DURATION", loadOn, cells: [{ repetitions: 1359, loadKg: 12 }, { repetitions: 1359, loadKg: 12 }, { repetitions: null, loadKg: 12 }] }),
        ]}
        count={3}
        withLoad
        onChange={() => undefined}
        cell={cell}
      />,
    );

  it("en-tête de 28, texte Inter Medium 12 #595E66 à y = 6,5 ; lignes de 44 avec séparateur de 1 #DEE3E5 en haut ; marge basse 3,5", () => {
    render2(false);
    expect(style("format-emom-table")).toMatchObject({ paddingBottom: 3.5, flexDirection: "row" });
    expect(style("format-emom-head")).toMatchObject({ height: 28, gap: 12, paddingLeft: 12, paddingRight: 16 });
    const head = screen.getByText("S1");
    expect(StyleSheet.flatten(head.props.style)).toMatchObject({ fontFamily: "Inter_500Medium", fontSize: 12, lineHeight: 15, color: "#595E66", top: 6.5, textAlign: "center" });
    expect(StyleSheet.flatten(screen.getByText("Mouvement").props.style)).toMatchObject({ fontFamily: "Inter_500Medium", fontSize: 12, top: 6.5 });
    expect(style("format-emom-1-values")).toMatchObject({ height: 44, gap: 12 });
    expect(style("format-emom-1-name")).toMatchObject({ height: 44, paddingLeft: 16 });
    const separators = screen.UNSAFE_root.findAll((node) => typeof node.type === "string" && StyleSheet.flatten(node.props.style)?.backgroundColor === "#DEE3E5");
    // Un séparateur par ligne, de chaque côté (noms, colonnes défilantes) : en haut, 1 px.
    expect(separators.length).toBe(4);
    for (const separator of separators) expect(StyleSheet.flatten(separator.props.style)).toMatchObject({ position: "absolute", top: 0, height: 1, left: 0, right: 0 });
  });

  // c-emom-recap (08/11/2026 après-midi) : « Le titre mouvement n'est pas correctement aligné » — le titre, en position absolue
  // directement dans un conteneur à marge gauche de 16, était à x = 0 ; il est dans une zone au retrait de 16, comme les noms.
  // [« Au focus le cadre de la valeur charge est trop large » : champ de 44 fixe — remplacé le 08/11/2026 soir (e-emom-focus,
  // e-tabata-kg : « 12,25 kg est rogné ») : voir le test « recette du 08/11 soir » ci-dessous.]
  it("c-emom-recap : « Mouvement » dans la même zone de retrait que les noms", () => {
    render2(true);
    const head = screen.getByTestId("format-emom-head-name");
    expect(StyleSheet.flatten(screen.getByTestId("format-emom-head-zone").props.style)).toMatchObject({ flex: 1 });
    expect(StyleSheet.flatten(screen.getByTestId("format-emom-head-zone-outer").props.style)).toMatchObject({ paddingLeft: 16 });
    expect(StyleSheet.flatten(screen.getByTestId("format-emom-1-name").props.style)).toMatchObject({ paddingLeft: 16 });
    expect(StyleSheet.flatten(head.props.style)).toMatchObject({ position: "absolute", left: 0 });
    expect(StyleSheet.flatten(screen.getByTestId("format-emom-1-name-title").props.style)).toMatchObject({ position: "absolute", left: 0 });
  });

  // Recette du 08/11/2026 soir (e-emom-focus, e-tabata-kg, Hermann : « 12,25 kg est rogné ») : au repos, la charge garde sa largeur
  // naturelle (aucune largeur imposée, une seule ligne, sans cadre), centrée sous la cellule ; en saisie, cadre ajusté au texte, au
  // moins 44, marge de 4 ; jamais 80. Les colonnes gardent 44. Jest ne mesure pas le texte : la largeur réelle est à voir sur iPhone.
  it("recette du 08/11 soir : « (12,25 kg) » jamais rognée — largeur du texte au repos, cadre ajusté au focus (44 au moins)", () => {
    render(
      <SeriesTable
        model="EMOM"
        movements={[movement("Fentes avant", { mode: "REPETITIONS", loadOn: true, cells: [{ repetitions: 10, loadKg: 12.25 }, { repetitions: 10, loadKg: 12 }] })]}
        count={2}
        withLoad
        onChange={() => undefined}
        cell={cell}
      />,
    );
    const load = screen.getByTestId("format-emom-0-0-load");
    expect(load.props.value).toBe("(12,25 kg)");
    const rest = StyleSheet.flatten(load.props.style);
    expect(rest.width).toBeUndefined();
    expect(rest.minWidth).toBe(0);
    expect(rest).toMatchObject({ backgroundColor: "transparent", paddingHorizontal: 0, fontSize: 11 });
    // Le texte invisible qui dimensionne le champ porte la valeur entière, sur une ligne.
    const sizer = screen.UNSAFE_root.findAll(
      (node) => typeof node.type === "string" && node.props.children === "(12,25 kg)" && node.props.numberOfLines === 1 && StyleSheet.flatten(node.props.style)?.opacity === 0,
    );
    expect(sizer.length).toBe(1);
    // Zone de centrage sous la cellule, plus large que la colonne ; colonnes inchangées.
    expect(style("format-emom-0-0-slot-charge")).toMatchObject({ alignItems: "center", top: 24.5 });
    expect(style("format-emom-0-0-slot")).toMatchObject({ width: 44 });
    fireEvent(load, "focus");
    // En saisie : le texte qui dimensionne (« 12,25 kg ») porte la largeur minimale de 44 et la marge de 4 ; le champ le recouvre.
    const sizing = screen.UNSAFE_root.findAll(
      (node) => typeof node.type === "string" && node.props.children === "12,25 kg" && StyleSheet.flatten(node.props.style)?.opacity === 0,
    );
    expect(sizing.length).toBe(1);
    expect(StyleSheet.flatten(sizing[0]!.props.style)).toMatchObject({ minWidth: 44, paddingHorizontal: 4 });
    const focus = StyleSheet.flatten(screen.getByTestId("format-emom-0-0-load").props.style);
    expect(focus).toMatchObject({ position: "absolute", left: 0, right: 0, paddingHorizontal: 4 });
    expect(focus.width).toBeUndefined();
  });

  it("plus de colonne Unité : étiquette « (rép., +kg) » / « (durée, −kg) » sous le nom, mot en gris, reste en bleu, Semi Bold 11", () => {
    render2(true);
    expect(screen.queryByText("Unité")).toBeNull();
    expect(screen.getByTestId("format-emom-0-unit")).toHaveTextContent("(rép., +kg)");
    expect(screen.getByTestId("format-emom-1-unit")).toHaveTextContent("(durée, −kg)");
    const word = screen.getAllByText("durée")[0]!;
    expect(StyleSheet.flatten(word.props.style)).toMatchObject({ color: "#595E66" });
    const toggle = screen.getByText("−kg");
    expect(StyleSheet.flatten(toggle.props.style)).toMatchObject({ fontFamily: "Inter_600SemiBold", fontSize: 11, color: "#0508E5" });
    // Nom : une seule ligne, points de suspension.
    const name = screen.getByTestId("format-emom-1-name-title");
    expect(name.props.numberOfLines).toBe(1);
    expect(name.props.ellipsizeMode).toBe("tail");
    expect(StyleSheet.flatten(name.props.style)).toMatchObject({ fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 16, color: "#141414" });
  });

  it("cellules de 44 × 24 sans fond, durées M′SS″ ; cellule vide « — » rouge (#D92D20) sur #FFF1F0", () => {
    render2(false);
    const filled = screen.getByTestId("format-emom-1-0-reps");
    expect(filled.props.value).toBe("22′39″");
    expect(StyleSheet.flatten(filled.props.style)).toMatchObject({ width: 44, height: 24, borderRadius: 10, paddingHorizontal: 0, backgroundColor: "transparent", color: "#0508E5", fontSize: 13 });
    const empty = screen.getByTestId("format-emom-1-2-reps");
    expect(empty.props.value).toBe("");
    expect(empty.props.placeholder).toBe("—");
    expect(empty.props.placeholderTextColor).toBe("#D92D20");
    expect(StyleSheet.flatten(empty.props.style)).toMatchObject({ width: 44, backgroundColor: "#FFF1F0" });
  });

  // b-emom-table (Hermann, 08/11/2026) : « Mesurer une bonne fois pour toute cet écart et arrêter d'en changer à chaque fois. »
  it("positions verticales figées : sans charge, cellule à 10 ; avec charge, cellule à 2,5 et charge à 24,5 sans cadre ; ligne de 44, nom et étiquette immobiles", () => {
    const view = render2(false);
    const before = {
      row: style("format-emom-1-values").height,
      names: style("format-emom-1-name").height,
      title: style("format-emom-1-name-title").top,
      tag: style("format-emom-1-name-tag").top,
    };
    expect(style("format-emom-1-0-slot-cell")).toMatchObject({ top: 10, height: 24, width: 44 });
    expect(screen.queryByTestId("format-emom-1-0-load")).toBeNull();
    view.unmount();
    render2(true);
    expect(style("format-emom-1-0-slot-cell")).toMatchObject({ top: 2.5, height: 24, width: 44 });
    expect(style("format-emom-1-0-slot-charge")).toMatchObject({ top: 24.5, height: 13 });
    const load = screen.getByTestId("format-emom-1-0-load");
    expect(load.props.value).toBe("(12 kg)");
    // « Enlever le cadre blanc autour des valeurs de charge » : charge sans fond, Regular 11, bleu, hauteur 13.
    expect(StyleSheet.flatten(load.props.style)).toMatchObject({ backgroundColor: "transparent", fontFamily: "Inter_400Regular", fontSize: 11, lineHeight: 13, height: 13, color: "#0508E5" });
    // La ligne garde 44 dans les deux états ; nom (6,5) et étiquette (24,5) ne bougent pas.
    expect({
      row: style("format-emom-1-values").height,
      names: style("format-emom-1-name").height,
      title: style("format-emom-1-name-title").top,
      tag: style("format-emom-1-name-tag").top,
    }).toEqual(before);
    expect(before).toEqual({ row: 44, names: 44, title: 6.5, tag: 24.5 });
    // Écart entre la ligne des valeurs et celle des charges : texte de la cellule à 2,5 + 4 = 6,5 (hauteur 16), charge à 24,5 :
    // 24,5 − (6,5 + 16) = 2. Étiquette alignée sur la charge, nom sur la valeur.
    expect(TABLE_LAYOUT.chargeTop - (TABLE_LAYOUT.cellTopCharged + 4 + 16)).toBe(2);
    expect(TABLE_LAYOUT.tagTop).toBe(TABLE_LAYOUT.chargeTop);
    expect(TABLE_LAYOUT.cellTopCharged + 4).toBe(TABLE_LAYOUT.nameTop);
  });
});

describe("tableau « paramètres en colonnes » (B) — AMRAP", () => {
  const renderAmrap = (loadOn: boolean) =>
    render(
      <AmrapTable
        movements={[
          movement("Squats sautés", { mode: "REPETITIONS", repetitions: 10, increment: 2, max: false }),
          movement("Fentes avant", { mode: "REPETITIONS", repetitions: 10, increment: 0, max: true, loadOn, loadKg: 12 }),
        ]}
        increasing
        withLoad
        onChange={() => undefined}
        cell={cell}
      />,
    );

  it("colonnes Objectif | Par tour | Max de 44, écart de 12, plus de colonne Charge ; titres centrés", () => {
    renderAmrap(true);
    expect(screen.queryByText("Charge")).toBeNull();
    for (const head of ["Objectif", "Par tour", "Max"]) {
      expect(StyleSheet.flatten(screen.getByText(head).props.style)).toMatchObject({ textAlign: "center", top: 6.5, fontFamily: "Inter_500Medium", fontSize: 12 });
    }
    for (const id of ["format-amrap-0-obj", "format-amrap-0-inc", "format-amrap-max-0"]) expect(style(id)).toMatchObject({ width: 44 });
    expect(style("format-amrap-row-0")).toMatchObject({ height: 44, paddingHorizontal: 16, flexDirection: "row" });
  });

  it("valeurs sans unité (« 10 », « + 2 ») ; ligne cochée en Max : Objectif et Par tour en #BFC2CC ; charge non grisée", () => {
    renderAmrap(true);
    expect(screen.getByTestId("format-amrap-reps-0").props.value).toBe("10");
    expect(screen.getByTestId("format-amrap-increment-0").props.value).toBe("+ 2");
    expect(style("format-amrap-reps-1")).toMatchObject({ color: "#BFC2CC" });
    expect(style("format-amrap-increment-1")).toMatchObject({ color: "#BFC2CC" });
    expect(style("format-amrap-load-1")).toMatchObject({ color: "#0508E5" });
  });

  it("positions : cellules à 10 / 2,5, charge sous l'Objectif à 24,5, radio Max toujours à 12 ; nom et étiquette immobiles", () => {
    const view = renderAmrap(false);
    expect(style("format-amrap-1-obj-cell")).toMatchObject({ top: 10 });
    expect(style("format-amrap-1-inc-cell")).toMatchObject({ top: 10 });
    expect(style("format-amrap-radio-1")).toMatchObject({ top: 12, width: 20, height: 20, left: 12 });
    expect(style("format-amrap-row-1-title")).toMatchObject({ top: 6.5 });
    expect(style("format-amrap-row-1-tag")).toMatchObject({ top: 24.5 });
    view.unmount();
    renderAmrap(true);
    expect(style("format-amrap-1-obj-cell")).toMatchObject({ top: 2.5 });
    expect(style("format-amrap-1-inc-cell")).toMatchObject({ top: 2.5 });
    expect(style("format-amrap-1-obj-charge")).toMatchObject({ top: 24.5 });
    expect(screen.queryByTestId("format-amrap-1-inc-charge")).toBeNull();
    expect(screen.getByTestId("format-amrap-load-1").props.value).toBe("(12 kg)");
    expect(style("format-amrap-radio-1")).toMatchObject({ top: 12 });
    expect(style("format-amrap-row-1")).toMatchObject({ height: 44 });
    expect(style("format-amrap-row-1-title")).toMatchObject({ top: 6.5 });
    expect(style("format-amrap-row-1-tag")).toMatchObject({ top: 24.5 });
  });
});

describe("grammaire commune aux autres formats « paramètres en colonnes » (Death by, Tabata…)", () => {
  it("Death by : Départ | Incrément de 44, valeurs sans unité, durées M′SS″, étiquette sous le nom", () => {
    render(
      <DeathByTable
        movements={[movement("a", { mode: "REPETITIONS", start: 1, startIncrement: 1 }), movement("b", { mode: "DURATION", start: 10, startIncrement: 70 })]}
        withLoad={false}
        onChange={() => undefined}
        cell={cell}
      />,
    );
    expect(screen.getByTestId("format-death-by-start-0").props.value).toBe("1");
    expect(screen.getByTestId("format-death-by-increment-0").props.value).toBe("+ 1");
    expect(screen.getByTestId("format-death-by-start-1").props.value).toBe("10″");
    expect(screen.getByTestId("format-death-by-increment-1").props.value).toBe("+ 1′10″");
    expect(screen.getByTestId("format-death-by-1-unit")).toHaveTextContent("(durée)");
    expect(style("format-death-by-1-start")).toMatchObject({ width: 44 });
    expect(style("format-death-by-row-1")).toMatchObject({ height: 44 });
  });

  // c-tabata-recap (08/11/2026 après-midi) : « +kg » / « −kg » par mouvement, comme l'AMRAP. [t-coche-direct (06/11/2026) : charge
  // toujours présente, cadre orange avec un trait — remplacé le 08/11/2026.]
  it("Death by « Avec charge » : « +kg » sous le nom ; après « +kg », charge sous Départ (y = 24,5), cellules à 2,5 ; ligne de 44, nom et étiquette immobiles", () => {
    render(
      <DeathByTable
        movements={[movement("a", { mode: "REPETITIONS", start: 1, startIncrement: 1 }), movement("b", { mode: "REPETITIONS", start: 1, startIncrement: 1, loadOn: true, loadKg: 20 })]}
        withLoad
        onChange={() => undefined}
        cell={cell}
      />,
    );
    expect(screen.getByTestId("format-death-by-0-unit")).toHaveTextContent("(rép., +kg)");
    expect(screen.getByTestId("format-death-by-1-unit")).toHaveTextContent("(rép., −kg)");
    expect(screen.queryByTestId("format-death-by-load-0")).toBeNull();
    expect(style("format-death-by-0-start-cell")).toMatchObject({ top: 10 });
    expect(style("format-death-by-1-start-cell")).toMatchObject({ top: 2.5 });
    expect(style("format-death-by-1-sinc-cell")).toMatchObject({ top: 2.5 });
    expect(style("format-death-by-1-start-charge")).toMatchObject({ top: 24.5 });
    for (const index of [0, 1]) {
      expect(style(`format-death-by-row-${index}`)).toMatchObject({ height: 44 });
      expect(style(`format-death-by-row-${index}-title`)).toMatchObject({ top: 6.5 });
      expect(style(`format-death-by-row-${index}-tag`)).toMatchObject({ top: 24.5 });
    }
    expect(screen.getByTestId("format-death-by-load-1").props.value).toBe("(20 kg)");
    expect(style("format-death-by-load-1")).toMatchObject({ backgroundColor: "transparent", fontSize: 11 });
  });

  // c-tabata-recap (08/11/2026 après-midi) : « Mettre les Parenthèse en gris » — dans toutes les étiquettes ; virgule et ±kg en bleu.
  it("étiquette : parenthèses et mot en gris #595E66, virgule et « +kg » en bleu (tous les tableaux)", () => {
    render(
      <AmrapTable movements={[movement("a", { mode: "REPETITIONS", repetitions: 10, max: false })]} increasing={false} withLoad onChange={() => undefined} cell={cell} />,
    );
    const tag = screen.getByTestId("format-amrap-0-unit");
    const texts = tag.findAll((node) => typeof node.type === "string" && typeof node.props.children === "string");
    const colorOf = (text: string) => texts.filter((node) => node.props.children === text).map((node) => StyleSheet.flatten(node.props.style).color);
    expect(colorOf("(")).toEqual(["#595E66"]);
    expect(colorOf("rép.")).toEqual(["#595E66"]);
    expect(colorOf(")")).toEqual(["#595E66"]);
    expect(colorOf("+kg")).toEqual(["#0508E5"]);
  });

  it("Tabata : Objectif | Pause de 44, pause M′SS″ / S″, objectif vide « — » rouge", () => {
    render(
      <ObjectivePauseTable
        model="TABATA"
        movements={[movement("a", { mode: "DURATION", repetitions: 20, pause: 90 }), movement("b", { mode: "REPETITIONS", pause: 10 })]}
        objectiveFallback={20}
        pauseFallback={() => 10}
        withLoad={false}
        onChange={() => undefined}
        onAddLoad={() => undefined}
        cell={cell}
      />,
    );
    expect(screen.getByTestId("format-objective-0").props.value).toBe("20″");
    expect(screen.getByTestId("format-pause-0").props.value).toBe("1′30″");
    expect(screen.getByTestId("format-objective-1").props.placeholderTextColor).toBe("#D92D20");
    expect(style("format-objective-1-pause")).toMatchObject({ width: 44 });
  });
});
