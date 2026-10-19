import { describe, expect, it } from "@jest/globals";

import { formatPhraseDuration } from "@/domain/activities/durationFormat";
import { EXECUTION_BOUNDS } from "@/domain/activities/ExecutionParameters";
import {
  CELL_DURATION_MAX_DIGITS,
  cellDurationSeconds,
  cellEntryDisplay,
  cellEntryEmpty,
  cellIntegerValue,
  composeCellEntry,
  formatMmss,
  mmssDigitsOf,
  type CellEntryKind,
  type CellEntryState,
} from "@/features/activities/cellEntry";

/**
 * D-434 (décision de Hermann du 19/10 ; QD-434-1 à 4 validées le 19/10) — fonctions pures de
 * la saisie au clavier numérique dans les cellules : formats au repos et en saisie, composition
 * par décalage (première frappe qui remplace, Retour arrière), normalisation à la sortie.
 */

/** Frappes natives successives, curseur en fin de texte (comme le `TextInput` natif) ; « ⌫ » = Retour arrière. */
function press(kind: CellEntryKind, initial: string, keys: string): CellEntryState {
  let state: CellEntryState = { text: initial, fresh: true };
  for (const key of [...keys]) {
    const shown = cellEntryDisplay(kind, state.text);
    state = composeCellEntry(kind, state, shown, key === "⌫" ? shown.slice(0, -1) : shown + key);
  }
  return state;
}

describe("D-434 — formats d'une durée de cellule", () => {
  it("au repos : unités explicites sans zéros inutiles (formateur unique)", () => {
    expect([5, 65, 90, 720, 0].map(formatPhraseDuration)).toEqual(["5 s", "1 min 5 s", "1 min 30 s", "12 min", "0 s"]);
  });

  it("en saisie : « MM:SS » sur quatre chiffres (00:05, 01:05, 01:30, 12:00) ; saisie vide « 00:00 »", () => {
    expect([5, 65, 90, 720].map((seconds) => formatMmss(mmssDigitsOf(seconds)))).toEqual(["00:05", "01:05", "01:30", "12:00"]);
    expect(mmssDigitsOf(3535)).toBe("5855");
    expect(mmssDigitsOf(0)).toBe("0000");
    expect(formatMmss("")).toBe("00:00");
    expect(formatMmss("5")).toBe("00:05");
    expect(formatMmss("130")).toBe("01:30");
    expect(CELL_DURATION_MAX_DIGITS).toBe(4);
  });

  it("valeur ancienne au-delà de 99 minutes : affichée 99:59 en saisie (jamais plus de quatre chiffres)", () => {
    expect(formatMmss(mmssDigitsOf(6000 + 59))).toBe("99:59");
  });

  it("entier (Répétitions) : chiffres frappés, « 0 » atténué pour une saisie vide ; décimal : texte tel quel", () => {
    expect(cellEntryDisplay("integer", "12")).toBe("12");
    expect(cellEntryDisplay("integer", "")).toBe("0");
    expect(cellEntryEmpty("integer", "")).toBe(true);
    expect(cellEntryEmpty("duration", "")).toBe(true);
    expect(cellEntryEmpty("duration", "0")).toBe(false);
    expect(cellEntryDisplay("decimal", "1,3")).toBe("1,3");
    expect(cellEntryEmpty("decimal", "")).toBe(false);
  });
});

describe("D-434 — composition par décalage (sans sélection native)", () => {
  it("la première frappe remplace la valeur, les suivantes composent ; chiffres décalés vers la gauche", () => {
    expect(press("duration", "0105", "3")).toEqual({ text: "3", fresh: false });
    expect(formatMmss(press("duration", "0105", "3").text)).toBe("00:03");
    expect(formatMmss(press("duration", "0105", "30").text)).toBe("00:30");
    expect(formatMmss(press("duration", "0105", "130").text)).toBe("01:30");
    expect(formatMmss(press("duration", "0105", "1205").text)).toBe("12:05");
  });

  it("quatre chiffres au plus : les frappes suivantes sont refusées", () => {
    expect(formatMmss(press("duration", "", "12345").text)).toBe("12:34");
  });

  it("Retour arrière supprime le dernier chiffre (dès la première frappe, sur la valeur) ; jusqu'à la saisie vide", () => {
    expect(press("duration", "0105", "⌫")).toEqual({ text: "010", fresh: false });
    expect(formatMmss(press("duration", "0105", "⌫").text)).toBe("00:10");
    expect(press("duration", "0105", "⌫⌫⌫⌫⌫")).toEqual({ text: "", fresh: false });
    expect(formatMmss(press("duration", "", "45⌫").text)).toBe("00:04");
    expect(press("integer", "12", "⌫")).toEqual({ text: "1", fresh: false });
    expect(press("decimal", "20", "⌫5")).toEqual({ text: "25", fresh: false });
  });

  it("caractères non numériques ignorés (durée, entier) ; séparateur décimal accepté pour la charge", () => {
    expect(press("duration", "", "1a:2")).toEqual({ text: "12", fresh: false });
    expect(press("decimal", "20", "1,3")).toEqual({ text: "1,3", fresh: false });
    expect(press("integer", "", "1234")).toEqual({ text: "123", fresh: false });
  });

  it("revue : un seul séparateur décimal dans la charge", () => {
    expect(press("decimal", "", "2,5,5")).toEqual({ text: "2,55", fresh: false });
  });

  it("revue : frappes rapides (texte natif en avance sur le texte brut affiché) : chaque chiffre compte une fois, aucun zéro de remplissage", () => {
    // Texte brut « 34 », l'entrée native a déjà reçu 5 puis 6 avant le rendu.
    expect(composeCellEntry("duration", { text: "34", fresh: false }, "34", "3456")).toEqual({ text: "3456", fresh: false });
  });

  it("changement natif sans effet : saisie inchangée (première frappe toujours attendue)", () => {
    const state = { text: "0105", fresh: true };
    expect(composeCellEntry("duration", state, "01:05", "01:05")).toBe(state);
  });

  it("texte natif décalé (curseur hors de la fin, frappes rapides) : seuls les caractères insérés comptent", () => {
    const state = { text: "30", fresh: false };
    expect(composeCellEntry("duration", state, "00:30", "007:30")).toEqual({ text: "307", fresh: false });
    expect(composeCellEntry("duration", state, "00:30", "00:3012")).toEqual({ text: "3012", fresh: false });
  });
});

describe("D-434 — sortie de la cellule (QD-434-3, QD-434-4)", () => {
  const target = EXECUTION_BOUNDS.durationTarget;
  const pause = EXECUTION_BOUNDS.pauseSeconds;

  it("secondes > 59 reportées en minutes : 01:75 → 2 min 15 s", () => {
    expect(cellDurationSeconds("175", target)).toBe(135);
    expect(formatPhraseDuration(cellDurationSeconds("175", target)!)).toBe("2 min 15 s");
    expect(cellDurationSeconds("0105", target)).toBe(65);
    expect(cellDurationSeconds("5", target)).toBe(5);
  });

  it("hors bornes : ramenée à la borne existante (Cible 1..3535, Pause 0..300)", () => {
    expect(cellDurationSeconds("9999", target)).toBe(3535);
    expect(cellDurationSeconds("0", target)).toBe(1);
    expect(cellDurationSeconds("0000", target)).toBe(1);
    expect(cellDurationSeconds("999", pause)).toBe(300);
    expect(cellDurationSeconds("0", pause)).toBe(0);
  });

  it("cellule vidée : 0 s si 0 est permis (Pause), sinon à renseigner (`null`, Cible)", () => {
    expect(cellDurationSeconds("", pause)).toBe(0);
    expect(cellDurationSeconds("", target)).toBeNull();
  });

  it("entier (Répétitions 1..100) : bornes existantes ; vidé → à renseigner", () => {
    const repetitions = EXECUTION_BOUNDS.repetitionTarget;
    expect(cellIntegerValue("12", repetitions)).toBe(12);
    expect(cellIntegerValue("150", repetitions)).toBe(100);
    expect(cellIntegerValue("0", repetitions)).toBe(1);
    expect(cellIntegerValue("", repetitions)).toBeNull();
    expect(cellIntegerValue("", { min: 0, max: 10 })).toBe(0);
  });
});
