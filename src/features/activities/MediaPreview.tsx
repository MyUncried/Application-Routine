import { Image } from "expo-image";
import { useContext, useState, type ReactNode } from "react";
import { View, type ImageStyle, type StyleProp, type ViewStyle } from "react-native";

import type { MediaAsset } from "@/domain/media/MediaAsset";
import { ActivityDefinitionServiceContext } from "@/features/activities/ActivityDefinitionServiceContext";
import { useCatalogueVideoCover } from "@/features/activities/catalogueVideoCover";

/**
 * Premier média à afficher en vignette (PRE-4 story 4.4, D-264 ; PRE-6 story 5.1b, D3 remplacé par
 * Hermann le 21/10/2026) : le PREMIER média dans l'ordre de la galerie, photo ou vidéo. `null` sans
 * média. L'URI est celle du stockage (relative), résolue à l'affichage par `useMediaUriResolver`.
 */
export type MediaPreviewSource = {
  readonly uri: string;
  readonly isVideo: boolean;
};

/**
 * Premier média d'une liste ordonnée (définition ou occurrence), `null` si la liste est vide ou
 * absente. Revue 5.1b : sans `kind` (ancien asset, métadonnées nullables PRE-3), le type MIME
 * décide (`video/*` = vidéo) ; sans l'un ni l'autre, photo.
 */
export function firstMediaPreviewSource(
  media: readonly { readonly asset: Pick<MediaAsset, "kind" | "uri" | "mimeType"> }[] | undefined,
): MediaPreviewSource | null {
  const first = media?.[0];
  if (!first) return null;
  const { kind, mimeType, uri } = first.asset;
  const isVideo = kind != null ? kind === "VIDEO" : typeof mimeType === "string" && mimeType.toLowerCase().startsWith("video/");
  return { uri, isVideo };
}

/**
 * Résolution d'URI d'affichage d'un Média (URI interne relative → absolue) par
 * `ActivityDefinitionService.resolveMediaUri` (repris de `ActivityCard`, PRE-4 story 4.4) :
 * `useContext` brut, jamais le Hook qui lève — service absent ou partiel : URI inchangée, jamais
 * d'exception (tests du Catalogue et de la Composition sans service complet). Revue 5.1b : une
 * résolution qui lève rend aussi l'URI brute (la vignette tombe alors au pire en erreur de photo).
 */
export function useMediaUriResolver(): (uri: string) => string {
  const activityDefinitionService = useContext(ActivityDefinitionServiceContext);
  if (!activityDefinitionService || typeof activityDefinitionService.resolveMediaUri !== "function") {
    return (uri) => uri;
  }
  return (uri) => {
    try {
      return activityDefinitionService.resolveMediaUri(uri);
    } catch {
      return uri;
    }
  };
}

export type MediaPreviewProps = {
  /** URI d'AFFICHAGE (déjà résolue). */
  readonly uri: string;
  readonly isVideo: boolean;
  /**
   * Image : toujours hors de l'accessibilité (`accessible={false}`, aucun libellé) ; le texte
   * alternatif est le nom porté par la surface qui la contient (carte du Catalogue, carte
   * d'occurrence). Remplit la vignette, recadrée sans déformation (`contentFit="cover"`, centré). */
  readonly imageStyle: StyleProp<ImageStyle>;
  /**
   * Place réservée : pendant le chargement (affiche en génération) et, sans `unavailable`, aussi
   * quand le média est définitivement indisponible (photo illisible, vidéo sans affiche) — rendu du
   * Catalogue.
   */
  readonly fallbackStyle: StyleProp<ViewStyle>;
  /**
   * Revue 5.1b : rendu d'un média DÉFINITIVEMENT indisponible (photo en erreur, vidéo sans affiche),
   * à la place de la place réservée — la carte d'occurrence y met l'icône générique. Absent : place
   * réservée (Catalogue, inchangé).
   */
  readonly unavailable?: ReactNode;
  readonly imageTestID: string;
  readonly fallbackTestID: string;
};

/**
 * Contenu de la vignette d'un média (PRE-4 story 4.4, extrait de `ActivityCard` par PRE-6 story
 * 5.1b, rendu du Catalogue inchangé) :
 * - photo : `expo-image` sur l'URI ; erreur de lecture (`onError`) → place réservée, rattachée à
 *   l'URI (une autre photo en tête repart sans repli) ;
 * - vidéo : image d'affiche du générateur existant (`useCatalogueVideoCover` → `generateVideoPoster` :
 *   lecteur muet, jamais lancé, libéré aussitôt ; cache mémoire par URI, rien de persisté) ; place
 *   réservée pendant la génération et en cas d'échec.
 * Aucune lecture vidéo, aucun son, aucune cible tactile propre : le cadre appartient à l'appelant.
 */
export function MediaPreview({
  uri,
  isVideo,
  imageStyle,
  fallbackStyle,
  unavailable,
  imageTestID,
  fallbackTestID,
}: MediaPreviewProps) {
  // Échec rattaché à l'URI. Revue 5.1b : il est oublié dès que l'URI change (ajustement d'état au
  // rendu, sans effet) — revenir ensuite à la première URI la recharge au lieu de rester en échec.
  const [failedUri, setFailedUri] = useState<string | null>(null);
  if (failedUri !== null && failedUri !== uri) {
    setFailedUri(null);
  }
  const photoFailed = failedUri === uri;
  const cover = useCatalogueVideoCover(isVideo ? uri : null);
  const fallback = <View style={fallbackStyle} testID={fallbackTestID} />;
  const missing = unavailable !== undefined ? unavailable : fallback;
  if (isVideo) {
    if (cover.status === "ready") {
      return (
        <Image source={cover.image as never} style={imageStyle} contentFit="cover" accessible={false} testID={imageTestID} />
      );
    }
    return cover.status === "failed" ? missing : fallback;
  }
  return photoFailed ? (
    missing
  ) : (
    <Image
      source={{ uri }}
      style={imageStyle}
      contentFit="cover"
      accessible={false}
      onError={() => setFailedUri(uri)}
      testID={imageTestID}
    />
  );
}
