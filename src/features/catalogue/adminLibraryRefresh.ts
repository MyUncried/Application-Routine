import type { LibraryPreview } from "@/domain/catalogue/libraryPlan";
import { AdminClient, AdminClientError, type AdminSession, type AvailableLibraryEntry } from "@/features/catalogue/adminClient";
import { librarySession } from "@/features/catalogue/librarySession";
import { currentPairing, forgetStoredPairing } from "@/features/catalogue/pairingStore";
import type { LibraryServices } from "@/features/catalogue/useLibraryServices";

/**
 * Bibliothèques publiées par l'administration (PC) appairée : lecture des catalogues, aperçus des Bibliothèques publiées
 * (installation, mise à jour) retenus dans la session. Partagé par « Bibliothèques disponibles » (Actualiser) et par le
 * Profil (mise à jour silencieuse du statut à l'affichage). Un catalogue refusé par le PC (média aux droits non
 * confirmés) n'est pas signalé sur le téléphone ; un catalogue invalide est retenu comme tel.
 */
export async function fetchAdminPreviews(
  client: AdminClient,
  services: LibraryServices,
  session: AdminSession,
): Promise<{ readonly previews: readonly LibraryPreview[]; readonly entries: readonly AvailableLibraryEntry[] }> {
  const entries = await client.libraries(session);
  const previews: LibraryPreview[] = [];
  for (const catalogueId of [...new Set(entries.map((entry) => entry.catalogueId))]) {
    let raw: unknown;
    try {
      const received = await client.catalogue(session, catalogueId);
      raw = received.raw;
    } catch (reason) {
      if (!(reason instanceof AdminClientError && reason.code === "MEDIA_RIGHTS")) throw reason;
      continue;
    }
    const available = await services.libraries.available(raw);
    if (!available.ok) {
      librarySession.setInvalid({ issues: available.issues, raw });
      continue;
    }
    librarySession.rememberFile(available.file);
    const published = new Set(entries.filter((entry) => entry.catalogueId === catalogueId).map((entry) => entry.libraryId));
    previews.push(...available.previews.filter((preview) => published.has(preview.libraryId)));
  }
  librarySession.rememberPreviews(previews);
  return { previews, entries };
}

const profileClient = new AdminClient();

/**
 * Recette du 15/11/2026 (autres remarques, Hermann : « Ouvrir le Profil : le statut des bibliothèques installées devrait
 * être mis à jour automatiquement à l'affichage de cet écran, sans avoir à passer par Ajouter une bibliothèque ») : avec
 * un appairage valide, relit l'administration en silence. `true` si les aperçus ont été relus. Sans appairage, PC
 * injoignable ou refus : rien n'est affiché (le statut connu reste) ; un appairage refusé est oublié, comme à
 * l'actualisation.
 */
export async function refreshInstalledStatusSilently(services: LibraryServices, client: AdminClient = profileClient): Promise<boolean> {
  const session = await currentPairing();
  if (session === null) return false;
  try {
    const { entries } = await fetchAdminPreviews(client, services, session);
    const source = librarySession.source();
    if (source === null || source.kind === "ADMIN") librarySession.setSource({ kind: "ADMIN", session, entries, refreshedAt: Date.now() });
    return true;
  } catch (reason) {
    if (reason instanceof AdminClientError && reason.code === "UNAUTHORIZED") forgetStoredPairing();
    return false;
  }
}
