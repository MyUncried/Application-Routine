import { useEffect, useState } from "react";

import { generateVideoPoster, type PosterImage, type VideoPosterHandle } from "@/infrastructure/media/VideoPoster";

/**
 * PRE-4 story 4.4 (D-264, FR-21-02, ch. 13 §4.11) — image de couverture d'une
 * vidéo pour la vignette de la carte du Catalogue, par le générateur d'affiche
 * EXISTANT (`generateVideoPoster` : lecteur muet jamais lancé, libéré aussitôt ;
 * aucun nouveau générateur, aucune lecture).
 *
 * Cache par URI d'affichage, pour la durée du processus : une carte remontée
 * par la liste (défilement, retour au Catalogue) ne régénère pas l'affiche.
 * Coût assumé : une affiche (≤ 256 px, `POSTER_MAX_SIZE`) gardée en mémoire par
 * vidéo distincte affichée en tête d'une carte, jamais libérée avant la fin du
 * processus ; un échec (`null`, ou rejet inattendu capturé ici) est mis en
 * cache aussi, pour ne pas relancer à chaque montage l'attente de 10 s d'une
 * vidéo illisible. La galerie de l'Éditeur garde son propre cycle de vie
 * (`VideoPreview`, libéré au démontage), indépendant de ce cache.
 */
const covers = new Map<string, Promise<VideoPosterHandle | null>>();

/** Couverture de la vidéo `uri` : une seule génération par URI ; jamais de rejet. */
export function loadCatalogueVideoCover(uri: string): Promise<VideoPosterHandle | null> {
  let cover = covers.get(uri);
  if (!cover) {
    cover = Promise.resolve()
      .then(() => generateVideoPoster(uri))
      .catch(() => null);
    covers.set(uri, cover);
  }
  return cover;
}

/** Tests seulement : vide le cache en libérant les affiches générées. */
export async function clearCatalogueVideoCovers(): Promise<void> {
  const pending = [...covers.values()];
  covers.clear();
  for (const handle of await Promise.all(pending)) {
    handle?.release();
  }
}

export type CatalogueVideoCover =
  | { readonly status: "loading" }
  | { readonly status: "ready"; readonly image: PosterImage }
  | { readonly status: "failed" };

/** État de la couverture de `uri` pour un composant monté (aucune mise à jour après démontage). */
export function useCatalogueVideoCover(uri: string | null): CatalogueVideoCover {
  // Résultat rattaché à son URI : une autre URI repart en `loading` sans remise à zéro dans l'effet.
  const [result, setResult] = useState<{ readonly uri: string; readonly cover: CatalogueVideoCover } | null>(null);
  useEffect(() => {
    if (uri === null) {
      return;
    }
    let active = true;
    void loadCatalogueVideoCover(uri).then((handle) => {
      if (active) {
        setResult({ uri, cover: handle ? { status: "ready", image: handle.image } : { status: "failed" } });
      }
    });
    return () => {
      active = false;
    };
  }, [uri]);
  return result !== null && result.uri === uri ? result.cover : { status: "loading" };
}
