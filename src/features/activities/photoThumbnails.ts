import { Image, type ImageRef } from "expo-image";
import { useEffect, useState } from "react";

/**
 * Miniatures de photos gardées en mémoire (recette iPhone du 19/11/2026 : latence à l'ouverture du Catalogue des
 * Mouvements et des Séances, barre de navigation bloquée pendant ce temps ; Hermann : « Oui » à la correction).
 *
 * Une vignette (64 à 87 pt) affichait la photo d'origine (1206 × 987) : `expo-image` la relisait et la décodait à
 * chaque affichage, son cache par défaut n'étant pas en mémoire. Même mécanisme que les icônes du 08/11/2026
 * (`KodjoIcon.tsx`, `Image.loadAsync`). Ici, la photo est chargée une fois, réduite à `THUMBNAIL_MAX_PIXELS`, et
 * l'image native est gardée en mémoire pour la durée de l'application : les affichages suivants sont immédiats.
 * Rien n'est écrit sur le disque : une seule photo par média sur le téléphone (décision du 19/11/2026).
 *
 * Plus grand côté utile d'une vignette : 87 pt × 3 (iPhone) = 261 px ; 288 px laisse le recadrage `cover` net.
 */
export const THUMBNAIL_MAX_PIXELS = 288;

type Entry = { readonly status: "ready"; readonly ref: ImageRef } | { readonly status: "failed" };

const ready = new Map<string, Entry>();
const pending = new Map<string, Promise<Entry>>();

function canLoad(): boolean {
  return typeof (Image as unknown as { loadAsync?: unknown }).loadAsync === "function";
}

/** Charge (une fois) la miniature d'une photo ; un échec est retenu et l'appelant affiche la photo d'origine. */
export function loadPhotoThumbnail(uri: string): Promise<Entry> {
  const known = ready.get(uri);
  if (known) return Promise.resolve(known);
  const running = pending.get(uri);
  if (running) return running;
  const task: Promise<Entry> = (canLoad()
    ? Image.loadAsync({ uri }, { maxWidth: THUMBNAIL_MAX_PIXELS, maxHeight: THUMBNAIL_MAX_PIXELS })
        .then((ref): Entry => ({ status: "ready", ref }))
        .catch((): Entry => ({ status: "failed" }))
    : Promise.resolve<Entry>({ status: "failed" })
  ).then((entry) => {
    ready.set(uri, entry);
    pending.delete(uri);
    return entry;
  });
  pending.set(uri, task);
  return task;
}

/** Préchargement des miniatures d'une liste (sans attente, erreurs ignorées). */
export function preloadPhotoThumbnails(uris: readonly string[]): void {
  for (const uri of uris) void loadPhotoThumbnail(uri);
}

/**
 * Miniature d'une photo : `undefined` pendant le premier chargement, l'image native ensuite, `null` si la
 * miniature n'a pas pu être produite (l'appelant affiche alors la photo d'origine, comme avant).
 */
export function usePhotoThumbnail(uri: string | null): ImageRef | null | undefined {
  const lookup = (value: string | null) => {
    if (value === null) return null;
    const entry = ready.get(value);
    return entry === undefined ? undefined : entry.status === "ready" ? entry.ref : null;
  };
  const [state, setState] = useState<{ readonly uri: string | null; readonly value: ImageRef | null | undefined }>(
    () => ({ uri, value: lookup(uri) }));
  // URI changée : nouvel état lu dans le cache (ajustement au rendu, sans effet).
  const current = state.uri === uri ? state : { uri, value: lookup(uri) };
  if (current !== state) setState(current);
  useEffect(() => {
    if (uri === null || current.value !== undefined) return;
    let active = true;
    void loadPhotoThumbnail(uri).then((entry) => {
      if (active) setState({ uri, value: entry.status === "ready" ? entry.ref : null });
    });
    return () => {
      active = false;
    };
  }, [uri, current.value]);
  return current.value;
}

/** Tests : cache vidé. */
export function resetPhotoThumbnailsForTests(): void {
  ready.clear();
  pending.clear();
}
