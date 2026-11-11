/**
 * A1 — État de session des parcours Bibliothèques (mémoire de l'application, jamais persisté) :
 * source courante (fichier choisi ou administration appairée), fichiers catalogue reçus et
 * dernière adresse connue du PC. Les écrans de la pile Profil → Bibliothèques le partagent.
 */
import type { CatalogueIssue, MovementCatalogueFile } from "@/domain/catalogue/MovementCatalogueFile";
import type { LibraryPreview } from "@/domain/catalogue/libraryPlan";
import type { AdminSession, AvailableLibraryEntry } from "@/features/catalogue/adminClient";

export type LibrarySource =
  | { readonly kind: "FILE"; readonly file: MovementCatalogueFile }
  | {
      readonly kind: "ADMIN";
      readonly session: AdminSession;
      readonly entries: readonly AvailableLibraryEntry[];
      readonly refreshedAt: number;
    };

type State = {
  source: LibrarySource | null;
  files: Map<string, MovementCatalogueFile>;
  knownHosts: string[];
  /** Derniers aperçus calculés (pastille « Mettre à jour » du Profil). */
  previews: Map<string, LibraryPreview>;
  /** Dernier fichier refusé (écran « Fichier invalide »). */
  invalid: { readonly issues: readonly CatalogueIssue[]; readonly raw: unknown } | null;
};

const state: State = { source: null, files: new Map(), knownHosts: [], previews: new Map(), invalid: null };
const previewKey = (catalogueId: string, libraryId: string) => catalogueId + "/" + libraryId;

export const librarySession = {
  source(): LibrarySource | null {
    return state.source;
  },
  setSource(source: LibrarySource | null): void {
    state.source = source;
    if (source?.kind === "FILE") state.files.set(source.file.catalogue.id, source.file);
    if (source?.kind === "ADMIN") {
      state.knownHosts = [source.session.host, ...state.knownHosts.filter((host) => host !== source.session.host)].slice(0, 3);
    }
  },
  adminSession(): AdminSession | null {
    return state.source?.kind === "ADMIN" ? state.source.session : null;
  },
  file(catalogueId: string): MovementCatalogueFile | null {
    return state.files.get(catalogueId) ?? null;
  },
  rememberFile(file: MovementCatalogueFile): void {
    state.files.set(file.catalogue.id, file);
  },
  knownHosts(): readonly string[] {
    return state.knownHosts;
  },
  rememberPreviews(previews: readonly LibraryPreview[]): void {
    for (const preview of previews) state.previews.set(previewKey(preview.catalogueId, preview.libraryId), preview);
  },
  preview(catalogueId: string, libraryId: string): LibraryPreview | null {
    return state.previews.get(previewKey(catalogueId, libraryId)) ?? null;
  },
  setInvalid(invalid: State["invalid"]): void {
    state.invalid = invalid;
  },
  invalid(): State["invalid"] {
    return state.invalid;
  },
  /** Tests uniquement. */
  reset(): void {
    state.source = null;
    state.files.clear();
    state.knownHosts = [];
    state.previews.clear();
    state.invalid = null;
  },
};
