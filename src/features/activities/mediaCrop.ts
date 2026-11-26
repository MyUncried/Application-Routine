import type { MediaView } from "@/domain/media/MediaAsset";

/** Position de l'image entière dans sa case (coordonnées de la case, l'image débordant est rognée par la case). */
export type CropFrame = { readonly left: number; readonly top: number; readonly width: number; readonly height: number };

/**
 * Recadrage d'une image dans une case (règle de Hermann du 24/11/2026, D-600) : la vue retenue (rectangle en pourcentage de
 * l'image, ou l'image entière sans rectangle) est utilisée entière ; si la forme de la case ne le permet pas, ses bords sont
 * réduits autour de son centre, sans déformation. La vue couvre donc la case : à l'échelle où sa largeur et sa hauteur
 * atteignent au moins celles de la case, centrée. Exemple du DSF (§ 3) : dans une case carrée, une vue verticale perd du
 * haut et du bas.
 * Aucune détection : le rectangle vient du catalogue tel qu'il a été vérifié à la publication.
 */
export function cropFrame(
  box: { readonly width: number; readonly height: number },
  image: { readonly width: number; readonly height: number },
  view: MediaView | null | undefined,
): CropFrame {
  const v = view ?? { x: 0, y: 0, width: 100, height: 100 };
  const viewWidth = (image.width * v.width) / 100;
  const viewHeight = (image.height * v.height) / 100;
  if (!(viewWidth > 0) || !(viewHeight > 0) || !(box.width > 0) || !(box.height > 0)) {
    return { left: 0, top: 0, width: box.width, height: box.height };
  }
  const scale = Math.max(box.width / viewWidth, box.height / viewHeight);
  const viewLeft = (image.width * v.x) / 100;
  const viewTop = (image.height * v.y) / 100;
  return {
    left: -viewLeft * scale - (viewWidth * scale - box.width) / 2,
    top: -viewTop * scale - (viewHeight * scale - box.height) / 2,
    width: image.width * scale,
    height: image.height * scale,
  };
}
