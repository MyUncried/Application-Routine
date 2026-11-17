import { File } from "expo-file-system";

/** Limite de taille d'un fichier catalogue (photos intégrées comprises), comme l'import pilote. */
export const CATALOGUE_FILE_MAX_BYTES = 24 * 1024 * 1024;

/**
 * Sélection d'un fichier catalogue JSON sur le téléphone (option A). Le sélecteur natif est chargé
 * à l'appel seulement : un import statique ferait échouer l'écran dans un binaire qui ne
 * l'embarque pas (même motif que l'import pilote). Renvoie `null` si l'utilisateur annule.
 */
export async function pickCatalogueFile(): Promise<unknown | null> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const DocumentPicker = require("expo-document-picker") as typeof import("expo-document-picker");
  const selection = await DocumentPicker.getDocumentAsync({
    type: "application/json",
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (selection.canceled || !selection.assets[0]) return null;
  const asset = selection.assets[0];
  const file = new File(asset.uri);
  const size = asset.size ?? file.size;
  if (size > CATALOGUE_FILE_MAX_BYTES) {
    throw new Error("Fichier de " + (size / 1048576).toFixed(1) + " Mo, supérieur à la limite de 24 Mo.");
  }
  try {
    return JSON.parse(await file.text()) as unknown;
  } catch {
    throw new Error("Ce fichier n'est pas un JSON lisible.");
  }
}
