import * as ImagePicker from "expo-image-picker";

/**
 * D-578 (27/11/2026) — bouton photo du champ « Des commentaires ? » : appareil photo **natif** du système (`launchCameraAsync`,
 * expo-image-picker SDK 57 ; API vérifiée dans la documentation versionnée v57.0.0), jamais une imitation.
 *
 * `SESSION_CAMERA_IN_BUILD` : la configuration actuelle (`app.json`, plugin expo-image-picker, `cameraPermission: false`) n'écrit pas
 * `NSCameraUsageDescription` ; iOS interromprait l'application à l'ouverture de l'appareil photo. Tant qu'un nouveau build natif
 * n'a pas été fait avec ce texte (SCOPE_EXPANSION_REQUIRED, voir le rapport `2026-11-27_FIN-SEANCE-D578`), le bouton est affiché
 * mais indisponible. Passer la constante à `true` après ce build.
 * [À CLARIFIER (D-578) : nombre de photos, aperçu après la prise, conservation et partage — la photo prise n'est pas enregistrée.]
 */
export const SESSION_CAMERA_IN_BUILD = false;

/** Ouvre l'appareil photo natif ; renvoie l'adresse locale de la photo prise, ou `null` (refus, annulation). */
export async function takeSessionPhoto(): Promise<string | null> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) return null;
  const result = await ImagePicker.launchCameraAsync({ mediaTypes: "images" });
  return result.canceled ? null : (result.assets[0]?.uri ?? null);
}
