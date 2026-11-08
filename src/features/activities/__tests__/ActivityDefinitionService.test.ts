import { describe, expect, it } from "@jest/globals";

import { ActivityDefinitionService } from "@/features/activities/ActivityDefinitionService";
import { ActivityMediaImportService } from "@/domain/media/ActivityMediaImportService";
import { MediaDraftLeases } from "@/domain/media/MediaDraftLeases";

/*
 * [PRE-9 A.3 du 04/11/2026 : les cas des anciennes définitions du Catalogue (création, modification,
 * lecture, transmission des médias au dépôt des définitions) sont retirés avec elles — décision de
 * Hermann du 04/11/2026 : « Hermann abandonne la conversion sans perte prévue par A.4 : les anciens
 * exercices concernés par cette conversion peuvent être supprimés plutôt que migrés. »]
 */
describe("ActivityDefinitionService — PRE-3 (médias)", () => {
  it("abandon confirmé : seules les préparations non référencées sont nettoyées ; une lecture de référence en échec conserve le fichier", async () => {
    const leases = new MediaDraftLeases();
    const deleted: string[] = [];
    const importService = new ActivityMediaImportService(
      { pickFromLibrary: async () => ({ status: "CANCELED" }) },
      {
        copyToInternal: async (_source, assetId) => ({ uri: `kodjo-media/${assetId}`, sizeBytes: 1 }),
        availableBytes: () => null,
        deletePrepared: async (uri) => {
          deleted.push(uri);
        },
      },
      () => "unused",
      () => "now",
      leases,
    );
    const picked = { uri: "file:///x", kind: "PHOTO" as const, mimeType: null, fileName: null, sizeBytes: 1, durationMs: null, width: null, height: null, nativeAssetId: null };
    for (const key of ["a", "b", "c"]) {
      await importService.retry("draft-1", { key, state: "FAILED", picked, error: "COPY_FAILED" });
    }
    const countReferences = async (assetId: string) => {
      if (assetId === "c") throw new Error("io");
      return assetId === "b" ? 1 : 0;
    };
    const service = new ActivityDefinitionService(undefined, undefined, undefined, {
      importService,
      repository: { countReferences },
    });
    expect(service.supportsMediaImport).toBe(true);
    expect(await service.abandonMediaDraft("draft-1")).toEqual(["a"]);
    expect(deleted).toEqual(["kodjo-media/a"]);
    expect(service.resolveMediaUri("kodjo-media/a")).toBe("kodjo-media/a");
    // Sans adaptateurs : aucune suppression, aucun import.
    const bare = new ActivityDefinitionService();
    expect(bare.supportsMediaImport).toBe(false);
    expect(await bare.abandonMediaDraft("draft-1")).toEqual([]);
  });
});
