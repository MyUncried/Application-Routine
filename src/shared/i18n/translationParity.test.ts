/**
 * J1 « Gestion des langues » (23/11/2026) — garde-fou des traductions : chaque catalogue traduit a les mêmes clés
 * que le français, les mêmes variables `{x}` dans chaque texte, les mêmes fonctions (même nombre d'arguments), et
 * aucun caractère propre au français.
 */
import { describe, expect, it } from "@jest/globals";

import { enBundle, frBundle } from "./resources/bundles";

const PLACEHOLDER = /\{(\w+)\}/g;
const FRENCH_ONLY = /[àâçéèêëîïôùûüœÀÂÇÉÈÊÎÔÙÛŒ«»]/;

type Issue = string;

function placeholders(text: string): string {
  return [...text.matchAll(PLACEHOLDER)].map((match) => match[1]).sort().join(",");
}

function compare(source: unknown, translated: unknown, path: string, issues: Issue[]): void {
  if (typeof source === "string") {
    if (typeof translated !== "string") return void issues.push(`${path} : texte manquant`);
    if (placeholders(source) !== placeholders(translated)) issues.push(`${path} : variables ${placeholders(source)} ≠ ${placeholders(translated)}`);
    // Le nom d'une langue s'écrit dans sa propre langue (« Français ») dans tous les catalogues.
    if (FRENCH_ONLY.test(translated) && !/\.languageNames\./.test(path)) issues.push(`${path} : caractère français dans « ${translated} »`);
    return;
  }
  if (typeof source === "function") {
    if (typeof translated !== "function") return void issues.push(`${path} : fonction manquante`);
    if (source.length !== translated.length) issues.push(`${path} : ${source.length} argument(s) ≠ ${translated.length}`);
    return;
  }
  if (Array.isArray(source)) {
    if (!Array.isArray(translated)) return void issues.push(`${path} : liste manquante`);
    if (source.length !== translated.length) issues.push(`${path} : ${source.length} élément(s) ≠ ${translated.length}`);
    source.forEach((item, index) => compare(item, translated[index], `${path}[${index}]`, issues));
    return;
  }
  if (typeof source === "object" && source !== null) {
    if (typeof translated !== "object" || translated === null) return void issues.push(`${path} : groupe manquant`);
    const sourceKeys = Object.keys(source);
    for (const key of Object.keys(translated)) if (!sourceKeys.includes(key)) issues.push(`${path}.${key} : clé absente du français`);
    for (const key of sourceKeys) compare((source as Record<string, unknown>)[key], (translated as Record<string, unknown>)[key], `${path}.${key}`, issues);
  }
}

describe("J1 — parité des traductions", () => {
  it("anglais : mêmes clés, mêmes variables, aucun caractère français", () => {
    const issues: Issue[] = [];
    compare(frBundle, enBundle, "en", issues);
    expect(issues).toEqual([]);
  });
});
