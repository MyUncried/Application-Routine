/**
 * J1 « Gestion des langues » (23/11/2026) : forme d'un catalogue traduit — celle du français, chaque texte élargi à
 * `string` (une traduction a ses propres textes, mêmes clés, mêmes fonctions).
 */
export type Widen<T> = T extends string
  ? string
  : T extends (...args: infer A) => infer R
    ? (...args: A) => Widen<R>
    : T extends readonly unknown[]
      ? { readonly [K in keyof T]: Widen<T[K]> }
      : T extends object
        ? { readonly [K in keyof T]: Widen<T[K]> }
        : T;
