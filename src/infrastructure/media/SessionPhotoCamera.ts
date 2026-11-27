import * as ImagePicker from "expo-image-picker";

/**
 * D-578 (27/11/2026) — bouton photo du champ « Des commentaires ? » : appareil photo **natif** du système (`launchCameraAsync`,
 * expo-image-picker SDK 57 ; API vérifiée dans la documentation versionnée v57.0.0), jamais une imitation.
 *
 * Décision de Hermann du 27/11/2026 (« Photo : tu peux utiliser un nouveau Build ») : `app.json` (plugin expo-image-picker) écrit
 * désormais `NSCameraUsageDescription` (`cameraPermission`) ; l'appareil photo est disponible à partir de ce build.
 * [`cameraPermission: false`, bouton indisponible — remplacé le 27/11/2026.]
 *
 * Compression (« compressée », point 4) : `quality` de l'appareil photo (expo-image-manipulator n'est pas installé). [Valeur 0,6 :
 * interprétation technique.]
 */
export const SESSION_CAMERA_IN_BUILD = true;

export const SESSION_PHOTO_QUALITY = 0.6;

/** Ouvre l'appareil photo natif ; renvoie l'adresse locale (temporaire) de la photo prise, ou `null` (refus, annulation). */
export async function takeSessionPhoto(): Promise<string | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) return null;
  const result = await ImagePicker.launchCameraAsync({ mediaTypes: "images", quality: SESSION_PHOTO_QUALITY });
  return result.canceled ? null : (result.assets[0]?.uri ?? null);
}
