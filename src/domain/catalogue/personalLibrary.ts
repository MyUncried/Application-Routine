/**
 * Bibliothèques personnelles (spécification « Mes bibliothèques » du 12/11/2026 ; écrans Figma « Créer une
 * bibliothèque » 12206:26111 / 12206:26333, « Ma bibliothèque » 12210:26150, « Modifier » 12217:26131).
 *
 * Décisions de Hermann du 12/11/2026 :
 * - auteur : identifiant invisible créé une fois sur l'iPhone (remplacé plus tard par celui du compte) ; nom affiché =
 *   Nom du Profil ;
 * - une Bibliothèque référence des Mouvements, elle ne les copie jamais ; la supprimer ne supprime aucun Mouvement ;
 * - un même auteur ne peut pas avoir deux Bibliothèques du même nom (comparaison sans casse) ;
 * - « Suivre les écrans Figma » : l'ordre des membres est celui de la liste du Catalogue (aucun réordonnancement).
 */

export type PersonalLibrary = {
  readonly libraryId: string;
  readonly authorId: string;
  readonly title: string;
  /** Mouvements référencés, dans l'ordre de présentation du Catalogue au moment de l'enregistrement. */
  readonly movementIds: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
};

/** Nom saisi : espaces de bord retirés, espaces intérieurs réduits à un seul. */
export function normalizeLibraryTitle(raw: string): string {
  return raw.normalize("NFC").replace(/\s+/g, " ").trim();
}

/** Clé d'unicité d'un nom pour un même auteur : normalisé, sans casse. */
export function libraryTitleKey(title: string): string {
  return normalizeLibraryTitle(title).toLocaleLowerCase("fr");
}

export type PersonalLibraryIssue = "EMPTY_TITLE" | "NO_MOVEMENT" | "DUPLICATE_TITLE";

/**
 * Ce qui empêche « Créer » ou « Valider » : nom vide, aucun Mouvement choisi, ou nom déjà porté par une autre
 * Bibliothèque du même auteur (`libraryId` : la Bibliothèque modifiée, qui garde son propre nom).
 */
export function personalLibraryIssue(input: {
  readonly title: string;
  readonly movementCount: number;
  readonly authorId: string;
  readonly existing: readonly PersonalLibrary[];
  readonly libraryId?: string;
}): PersonalLibraryIssue | null {
  const title = normalizeLibraryTitle(input.title);
  if (title.length === 0) return "EMPTY_TITLE";
  const key = libraryTitleKey(title);
  const taken = input.existing.some(
    (library) => library.authorId === input.authorId && library.libraryId !== input.libraryId && libraryTitleKey(library.title) === key,
  );
  if (taken) return "DUPLICATE_TITLE";
  if (input.movementCount === 0) return "NO_MOVEMENT";
  return null;
}

/** Message affiché sous le nom lorsqu'il est déjà pris (spécification, règle d'unicité). */
export function duplicateLibraryTitleMessage(title: string): string {
  return `Vous avez déjà une bibliothèque nommée « ${normalizeLibraryTitle(title)} ».`;
}

/** Refus d'écriture du registre : nom déjà porté par une autre Bibliothèque du même auteur. */
export class DuplicateLibraryTitleError extends Error {
  constructor(readonly title: string) {
    super(duplicateLibraryTitleMessage(title));
    this.name = "DuplicateLibraryTitleError";
  }
}
