import { useEffect, useState } from "react";

import { generateVideoPoster, type PosterImage, type VideoPosterHandle } from "@/infrastructure/media/VideoPoster";

/**
 * PRE-4 story 4.4 (D-264, FR-21-02, ch. 13 §4.11) — image de couverture d'une
 * vidéo pour la vignette de la carte du Catalogue, par le générateur d'affiche
 * EXISTANT (`generateVideoPoster` : lecteur muet jamais lancé, libéré aussitôt ;
 * aucun nouveau générateur, aucune lecture). PRE-6 story 5.1b : partagée avec le
 * gabarit des cartes d'occurrence de la Composition (`MediaPreview`).
 *
 * Cache par URI d'affichage, pour la durée du processus : une carte remontée
 * (défilement, retour au Catalogue ou à la Composition, glisser d'une zone à
 * l'autre) ne régénère pas l'affiche. Coût assumé : une affiche (≤ 256 px,
 * `POSTER_MAX_SIZE`) gardée en mémoire par vidéo distincte affichée en tête
 * d'une carte, jamais libérée avant la fin du processus.
 *
 * Revue de la story 5.1b :
 * - au plus `MAX_CONCURRENT_GENERATIONS` générations à la fois, les suivantes
 *   attendent dans une file FIFO (une liste de vidéos ne crée plus autant de
 *   lecteurs natifs que de cartes) ;
 * - un ÉCHEC (affiche absente, délai dépassé, rejet) n'est plus gardé : l'entrée
 *   est retirée, un montage ultérieur réessaie (une vidéo d'abord illisible —
 *   fichier en cours de copie, lecteur indisponible — peut le devenir) ; le
 *   montage qui a échoué reste en `failed` ;
 * - les affiches RÉSOLUES sont gardées à part : le hook les lit au rendu, de
 *   façon synchrone — une carte remontée affiche son affiche dès le premier
 *   rendu, sans passer par la place réservée.
 */
export const MAX_CONCURRENT_GENERATIONS = 2;

/** Affiches générées, par URI (lecture synchrone au rendu). */
const resolved = new Map<string, VideoPosterHandle>();
/** Générations en cours ou en file, par URI (une seule par URI). */
const pending = new Map<string, Promise<VideoPosterHandle | null>>();
/** File FIFO des générations en attente d'une place. */
const waiting: (() => void)[] = [];
let running = 0;

/** Lance `task` dès qu'une place est libre (au plus `MAX_CONCURRENT_GENERATIONS`), dans l'ordre d'arrivée. */
function runLimited<T>(task: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const start = () => {
      running += 1;
      task()
        .then(resolve, reject)
        .finally(() => {
          running -= 1;
          waiting.shift()?.();
        });
    };
    if (running < MAX_CONCURRENT_GENERATIONS) start();
    else waiting.push(start);
  });
}

/** Affiche déjà générée pour `uri`, sans attente ; `undefined` sinon. */
export function peekCatalogueVideoCover(uri: string): VideoPosterHandle | undefined {
  return resolved.get(uri);
}

/** Couverture de la vidéo `uri` : une seule génération en cours par URI ; jamais de rejet. */
export function loadCatalogueVideoCover(uri: string): Promise<VideoPosterHandle | null> {
  const done = resolved.get(uri);
  if (done) return Promise.resolve(done);
  let cover = pending.get(uri);
  if (!cover) {
    cover = runLimited(() => Promise.resolve().then(() => generateVideoPoster(uri)))
      .catch(() => null)
      .then((handle) => {
        pending.delete(uri);
        if (handle) resolved.set(uri, handle);
        return handle;
      });
    pending.set(uri, cover);
  }
  return cover;
}

/** Tests seulement : attend les générations en cours, vide le cache et libère les affiches. */
export async function clearCatalogueVideoCovers(): Promise<void> {
  const inFlight = await Promise.all([...pending.values()]);
  const handles = [...resolved.values(), ...inFlight];
  pending.clear();
  resolved.clear();
  for (const handle of new Set(handles)) {
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
    if (uri === null || resolved.has(uri)) {
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
  if (uri === null) return { status: "loading" };
  // Revue 5.1b : une affiche déjà générée est rendue dès le premier rendu (aucun clignotement).
  const cached = resolved.get(uri);
  if (cached) return { status: "ready", image: cached.image };
  return result !== null && result.uri === uri ? result.cover : { status: "loading" };
}
