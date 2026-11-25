/**
 * Média persistable (V2-PRE-1, plan §3.3/§13) : identité et métadonnées
 * indépendantes d'un média, distinctes de son association à un Exercice
 * (`ActivityMedia`). Aucun comportement de lecture vidéo, galerie, plein
 * écran ou exécution n'est modélisé ici — hors périmètre.
 *
 * **PRE-3 (D-333/D-334/D-335, `schema-et-ecritures.md` §Médias)** : identité
 * durable et métadonnées NATIVES nullables — un ancien asset sans
 * métadonnées reste valide et lisible sous son URI. `uri` est soit une URI
 * RELATIVE au dossier document de l'application (copie interne PRE-3,
 * résistante au changement de chemin du conteneur iOS), soit une ancienne
 * URI absolue conservée telle quelle. Jamais l'URI du cache du sélecteur.
 */

export type MediaKind = "PHOTO" | "VIDEO";

export const MEDIA_KINDS: readonly MediaKind[] = ["PHOTO", "VIDEO"];

/** Métadonnées natives facultatives — `null` quand la plateforme ne les fournit pas (jamais une erreur seule). */
export type MediaAssetMetadata = {
  readonly kind?: MediaKind | null;
  readonly mimeType?: string | null;
  readonly fileName?: string | null;
  readonly sizeBytes?: number | null;
  /** Vidéo uniquement, en millisecondes. */
  readonly durationMs?: number | null;
  readonly width?: number | null;
  readonly height?: number | null;
};

/**
 * Vue retenue d'une photo (marquage des photos, D-600, 24-25/11/2026) : rectangle en pourcentage de l'image (0 à 100).
 * Venue du catalogue (rectangle vérifié à la publication), jamais calculée par l'application. Absente : image entière.
 */
export type MediaView = {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
};

/** Rectangle de vue valide : nombres finis, largeur et hauteur positives, entièrement dans l'image. */
export function isValidMediaView(view: unknown): view is MediaView {
  if (typeof view !== "object" || view === null || Array.isArray(view)) return false;
  const { x, y, width, height } = view as Record<string, unknown>;
  const n = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);
  if (!n(x) || !n(y) || !n(width) || !n(height)) return false;
  const EPSILON = 1e-6;
  return x >= 0 && y >= 0 && width > 0 && height > 0 && x + width <= 100 + EPSILON && y + height <= 100 + EPSILON;
}

export type MediaAsset = MediaAssetMetadata & {
  readonly id: string;
  readonly uri: string;
  readonly createdAt: string;
  /** Vue retenue (D-600) ; `null`/absente : image entière. */
  readonly view?: MediaView | null;
};

/** Préfixe des URI internes relatives au dossier document (copie stable PRE-3). */
export const INTERNAL_MEDIA_URI_PREFIX = "kodjo-media/";

export function isInternalMediaUri(uri: string): boolean {
  return uri.startsWith(INTERNAL_MEDIA_URI_PREFIX);
}

/**
 * Valide un asset à créer (avant écriture SQLite) : identité, URI interne
 * non vide, type connu ou absent, nombres entiers positifs ou absents.
 * Aucun plafond produit de taille/durée (D-335).
 */
export function isValidNewMediaAsset(asset: MediaAsset): boolean {
  const optionalNumber = (value: number | null | undefined) =>
    value === null || value === undefined || (Number.isInteger(value) && value >= 0);
  return (
    asset.id.trim().length > 0 &&
    asset.uri.trim().length > 0 &&
    asset.createdAt.trim().length > 0 &&
    (asset.kind === null || asset.kind === undefined || MEDIA_KINDS.includes(asset.kind)) &&
    optionalNumber(asset.sizeBytes) &&
    optionalNumber(asset.durationMs) &&
    optionalNumber(asset.width) &&
    optionalNumber(asset.height) &&
    (asset.view === null || asset.view === undefined || isValidMediaView(asset.view))
  );
}
