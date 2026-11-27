/**
 * Photo de fin de séance — décision de Hermann du 27/11/2026 (point 4) : « Conservation : copie locale privée dans l'espace de
 * l'application (pas dans la pellicule), rattachée à l'enregistrement de la séance, compressée, supprimée avec la séance, non
 * synchronisée entre appareils. »
 *
 * - La photo prise (fichier temporaire de l'appareil photo, déjà compressée par `quality`, voir `SessionPhotoCamera`) est copiée
 *   à l'enregistrement dans `Documents/session-photos/<exécution>.jpg` (dossier privé de l'application, hors pellicule, exclu de
 *   toute synchronisation applicative) ; son adresse est enregistrée avec le ressenti (`execution_feedback.photo_path`, migration 045).
 * - `deleteSessionPhoto` : suppression du fichier (photo retirée avant l'enregistrement, ou séance supprimée). [Aucune suppression
 *   d'Exécution n'existe aujourd'hui dans le code : la ligne est supprimée en cascade avec l'Exécution, le fichier par cette
 *   fonction, à appeler par la future suppression de séance — point d'accroche signalé dans le rapport.]
 */
const DIRECTORY = "session-photos";

type FileSystem = typeof import("expo-file-system");

function fileSystem(): FileSystem {
  // Chargé à l'appel : module natif absent des tests.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require("expo-file-system") as FileSystem;
}

/** Copie la photo prise dans le dossier privé de l'application ; renvoie l'adresse de la copie. */
export async function storeSessionPhoto(capturedUri: string, executionId: string): Promise<string> {
  const { Directory, File, Paths } = fileSystem();
  const directory = new Directory(Paths.document, DIRECTORY);
  if (!directory.exists) directory.create({ intermediates: true });
  const target = new File(directory, `${executionId}.jpg`);
  if (target.exists) target.delete();
  await new File(capturedUri).copy(target);
  return target.uri;
}

/** Supprime un fichier de photo (copie privée ou prise non enregistrée) ; absent : sans effet. */
export function deleteSessionPhoto(uri: string): void {
  try {
    const { File } = fileSystem();
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // Fichier déjà absent ou inaccessible : rien à supprimer.
  }
}
