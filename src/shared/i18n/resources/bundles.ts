/**
 * J1 « Gestion des langues » (23/11/2026) : un catalogue complet par langue. Le français est la langue source :
 * sa forme définit les clés. L'anglais est complet (repli, règle 3 de « Gestion des langues », ch. 07) ; une
 * langue ajoutée plus tard peut être partielle, l'anglais complète alors ses clés absentes.
 */
import { en as enBase } from "./en";
import { execution as enExecution, voice as enVoice } from "./enExecution";
import { executionParameters as enExecutionParameters } from "./enExecutionParameters";
import { libraries as enLibraries } from "./enLibraries";
import { fr } from "./fr";
import { execution, voice } from "./frExecution";
import { executionParameters } from "./frExecutionParameters";
import { libraries } from "./frLibraries";
import type { Widen } from "./types";

export type { Widen } from "./types";

export const frBundle = { ...fr, executionParameters, execution, voice, libraries };

export type StringBundle = Widen<typeof frBundle>;

/** Catalogue partiel d'une langue ajoutée plus tard, complété par l'anglais. */
export type PartialBundle<T = StringBundle> = T extends (...args: never[]) => unknown
  ? T
  : T extends readonly unknown[]
    ? T
    : T extends object
      ? { readonly [K in keyof T]?: PartialBundle<T[K]> }
      : T;

export const enBundle: StringBundle = {
  ...enBase,
  executionParameters: enExecutionParameters,
  execution: enExecution,
  voice: enVoice,
  libraries: enLibraries,
};
