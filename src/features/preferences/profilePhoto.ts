import { File, Paths } from "expo-file-system";
import * as ImagePicker from "expo-image-picker";

/**
 * Adaptateur de sélection et copie locale de la photo du Profil (D3,
 * CE-UI-01 L1981/L2025/L2033) : galerie uniquement (`launchImageLibraryAsync`,
 * images seules, une seule image) ; une annulation ne modifie jamais le
 * brouillon ; une image choisie est copiée dans le stockage local
 * persistant de l'app (`Paths.document`, l'URI renvoyée par le
 * sélecteur est en cache, non persistante) ; une erreur de lecture ou de
 * copie retourne `ERROR` sans jamais lever — le brouillon appelant reste
 * intact.
 */
export type PickProfilePhotoResult =
  | { readonly status: "PICKED"; readonly uri: string }
  | { readonly status: "CANCELED" }
  | { readonly status: "ERROR" };

export async function pickAndCopyProfilePhoto(
  uuidFactory: () => string = () => Date.now().toString(36),
): Promise<PickProfilePhotoResult> {
  try {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: false,
    });
    if (result.canceled || result.assets === null || result.assets.length === 0) {
      return { status: "CANCELED" };
    }
    const picked = result.assets[0]!;
    const source = new File(picked.uri);
    const extension = source.extension.length > 0 ? source.extension : ".jpg";
    const destination = new File(Paths.document, `profile-photo-${uuidFactory()}${extension}`);
    await source.copy(destination);
    return { status: "PICKED", uri: destination.uri };
  } catch (error) {
    console.error("La photo de profil n'a pas pu être copiée.", error);
    return { status: "ERROR" };
  }
}

/** Supprime la copie locale précédente — appelé UNIQUEMENT après un enregistrement réussi (D3 : « l'ancienne copie est supprimée après un enregistrement réussi seulement »). */
export function deletePreviousProfilePhoto(uri: string | null): void {
  if (!uri) {
    return;
  }
  try {
    const file = new File(uri);
    if (file.exists) {
      file.delete();
    }
  } catch (error) {
    console.error("L'ancienne photo de profil n'a pas pu être supprimée.", error);
  }
}

/** Une photo absente ou introuvable affiche les initiales sans bloquer les champs (CE-UI-01 L2033). */
export function profilePhotoFileExists(uri: string | null): boolean {
  if (!uri) {
    return false;
  }
  try {
    return new File(uri).exists;
  } catch {
    return false;
  }
}
