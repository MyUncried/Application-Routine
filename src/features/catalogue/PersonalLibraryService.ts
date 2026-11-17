/**
 * Bibliothèques personnelles (12/11/2026) — création, modification et suppression sur le registre (v3). L'auteur est
 * l'identifiant invisible de ce téléphone (décision de Hermann du 12/11/2026) ; une Bibliothèque ne référence que des
 * Mouvements, ne les copie jamais, et sa suppression n'en supprime aucun.
 */
import type { PersonalLibrary } from "@/domain/catalogue/personalLibrary";
import type { SqliteCatalogueRegistry } from "@/infrastructure/catalogue/SqliteCatalogueRegistry";

export class PersonalLibraryService {
  constructor(
    private readonly deps: {
      readonly registry: Pick<
        SqliteCatalogueRegistry,
        "localAuthorId" | "personalLibraries" | "savePersonalLibrary" | "deletePersonalLibrary"
      >;
      readonly newId: () => string;
    },
  ) {}

  /** Identifiant d'auteur de ce téléphone, créé au premier appel. */
  authorId(): Promise<string> {
    return this.deps.registry.localAuthorId(this.deps.newId);
  }

  list(): Promise<readonly PersonalLibrary[]> {
    return this.deps.registry.personalLibraries();
  }

  async get(libraryId: string): Promise<PersonalLibrary | null> {
    return (await this.list()).find((library) => library.libraryId === libraryId) ?? null;
  }

  /** Crée (`libraryId` absent) ou modifie une Bibliothèque ; refus `DuplicateLibraryTitleError` sur un nom déjà pris. */
  async save(input: {
    readonly libraryId?: string;
    readonly title: string;
    readonly movementIds: readonly string[];
  }): Promise<PersonalLibrary> {
    const authorId = await this.authorId();
    return this.deps.registry.savePersonalLibrary({
      libraryId: input.libraryId ?? this.deps.newId(),
      authorId,
      title: input.title,
      movementIds: input.movementIds,
    });
  }

  delete(libraryId: string): Promise<void> {
    return this.deps.registry.deletePersonalLibrary(libraryId);
  }
}
