import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "@jest/globals";

import { createSheet } from "@/domain/catalogue/catalogueEditing";
import {
  findInboxCollisions,
  inboxMovementFingerprint,
  inboxMovementToSheetInput,
  MOVEMENT_INBOX_MAX_MOVEMENTS,
  parseMovementInbox,
  proposedClassification,
  type InboxMovement,
} from "@/domain/catalogue/MovementInbox";
import {
  parseMovementCatalogueFile,
  serializeMovementCatalogueFile,
  type MovementCatalogueFile,
} from "@/domain/catalogue/MovementCatalogueFile";

/** W2 (11/11/2026) — contrat de la boîte d'arrivée `KODJO_MOVEMENT_INBOX` 1.0.0. */

const movement = (overrides: Record<string, unknown> = {}) => ({
  movementId: "mv-1",
  name: "Pompe  murale ",
  aliases: ["Wall push-up"],
  steps: ["Face au mur, mains à hauteur d'épaules.", "Fléchissez les coudes, puis poussez."],
  categoryId: "renforcement",
  categoryLabel: "Renforcement",
  bodyZoneIds: ["bras", "epaules"],
  bodyZoneLabels: ["Bras", "Épaules"],
  mediaCount: 2,
  ...overrides,
});

const envelope = (movements: unknown[] = [movement()], overrides: Record<string, unknown> = {}) => ({
  format: "KODJO_MOVEMENT_INBOX",
  formatVersion: "1.0.0",
  sentAt: "2026-11-11T10:15:00.000Z",
  device: { name: "iPhone de Hermann" },
  movements,
  ...overrides,
});

function pilot(): MovementCatalogueFile {
  const text = readFileSync(join(__dirname, "../../../../catalogue/catalogues/kodjo-pilote-60.catalogue.json"), "utf8");
  const parsed = parseMovementCatalogueFile(JSON.parse(text));
  if (!parsed.ok) throw new Error("pilote invalide");
  return parsed.file;
}

describe("parseMovementInbox", () => {
  it("accepte une enveloppe valide et normalise le nom, sans conserver les propriétés inconnues", () => {
    const result = parseMovementInbox(envelope([{ ...movement(), extra: "ignoré" }], { extra: 1 }));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.envelope.movements[0].name).toBe("Pompe murale");
    expect(result.envelope.movements[0]).not.toHaveProperty("extra");
    expect(result.envelope).not.toHaveProperty("extra");
    expect(result.collapsedDuplicates).toBe(0);
  });

  it("refuse format, version, date, appareil et liste invalides", () => {
    expect(parseMovementInbox(null)).toEqual({ ok: false, issues: [{ path: "", code: "INVALID" }] });
    expect(parseMovementInbox(envelope(undefined, { format: "X" }))).toMatchObject({ ok: false, issues: [{ path: "format" }] });
    expect(parseMovementInbox(envelope(undefined, { formatVersion: "2.0.0" }))).toMatchObject({ ok: false });
    expect(parseMovementInbox(envelope(undefined, { sentAt: "hier" }))).toMatchObject({ ok: false, issues: [{ path: "sentAt" }] });
    expect(parseMovementInbox(envelope(undefined, { device: { name: "" } }))).toMatchObject({ ok: false, issues: [{ path: "device.name" }] });
    expect(parseMovementInbox(envelope([]))).toMatchObject({ ok: false, issues: [{ path: "movements", code: "REQUIRED" }] });
    const many = Array.from({ length: MOVEMENT_INBOX_MAX_MOVEMENTS + 1 }, (_, i) => movement({ movementId: "mv-" + i }));
    expect(parseMovementInbox(envelope(many))).toMatchObject({ ok: false, issues: [{ path: "movements", code: "TOO_MANY" }] });
  });

  it("applique les limites du Mouvement : nom ≤ 80, étapes ≤ 1 000 points de code encodés (QN-1), Zones obligatoires", () => {
    const cases: [Record<string, unknown>, string, string][] = [
      [{ name: "x".repeat(81) }, "movements[0].name", "TOO_LONG"],
      [{ name: "  " }, "movements[0].name", "REQUIRED"],
      [{ steps: ["é".repeat(1001)] }, "movements[0].steps", "TOO_LONG"],
      [{ steps: ["Ligne\nsuivante"] }, "movements[0].steps", "INVALID"],
      [{ bodyZoneIds: [] , bodyZoneLabels: [] }, "movements[0].bodyZoneIds", "INVALID"],
      [{ bodyZoneLabels: ["Bras"] }, "movements[0].bodyZoneLabels", "INVALID"],
      [{ aliases: ["A", "a"] }, "movements[0].aliases", "DUPLICATE"],
      [{ mediaCount: -1 }, "movements[0].mediaCount", "INVALID"],
      [{ movementId: "" }, "movements[0].movementId", "INVALID"],
      [{ categoryId: "a\u0000b" }, "movements[0].categoryId", "INVALID"],
    ];
    for (const [override, path, code] of cases) {
      expect(parseMovementInbox(envelope([movement(override)]))).toEqual({ ok: false, issues: [{ path, code }] });
    }
    // Contrat du téléphone : 21 étapes, ou une étape de 120 points de code, sont admises (aucune borne par étape).
    expect(parseMovementInbox(envelope([movement({ steps: Array.from({ length: 21 }, () => "Étape") })])).ok).toBe(true);
    expect(parseMovementInbox(envelope([movement({ steps: ["😀".repeat(120)] })])).ok).toBe(true);
  });

  it("déduplique par movementId : doublon exact fusionné, contenus divergents refusés", () => {
    const same = parseMovementInbox(envelope([movement(), movement()]));
    expect(same).toMatchObject({ ok: true, collapsedDuplicates: 1 });
    if (same.ok) expect(same.envelope.movements).toHaveLength(1);
    expect(parseMovementInbox(envelope([movement(), movement({ name: "Autre" })])))
      .toEqual({ ok: false, issues: [{ path: "movements[1].movementId", code: "DUPLICATE" }] });
  });

  it("empreinte de contenu stable, sensible au contenu", () => {
    const a = parseMovementInbox(envelope()), b = parseMovementInbox(envelope([movement({ steps: ["Autre consigne"] })]));
    if (!a.ok || !b.ok) throw new Error("enveloppes invalides");
    const again = parseMovementInbox(envelope());
    if (!again.ok) throw new Error("enveloppe invalide");
    expect(inboxMovementFingerprint(a.envelope.movements[0])).toBe(inboxMovementFingerprint(again.envelope.movements[0]));
    expect(inboxMovementFingerprint(a.envelope.movements[0])).not.toBe(inboxMovementFingerprint(b.envelope.movements[0]));
  });
});

describe("rapprochement et création de fiche", () => {
  const received = (overrides: Record<string, unknown> = {}): InboxMovement => {
    const parsed = parseMovementInbox(envelope([movement(overrides)]));
    if (!parsed.ok) throw new Error(JSON.stringify(parsed.issues));
    return parsed.envelope.movements[0];
  };

  it("signale une collision par nom normalisé ou par identifiant local déjà rapproché", () => {
    const file = pilot();
    const sameName = received({ name: "ÉLÉVATION de jambe   tendue" });
    expect(findInboxCollisions(file, sameName)).toEqual([{ sheetId: "REED-001", reason: "SAME_NAME" }]);
    const knownId = received({ movementId: "pilot:REED-002", name: "Nom inédit" });
    expect(findInboxCollisions(file, knownId)).toEqual([{ sheetId: "REED-002", reason: "KNOWN_LOCAL_ID" }]);
    expect(findInboxCollisions(file, received())).toEqual([]);
  });

  it("propose Catégorie et Zones par identifiant puis par libellé, sans invention", () => {
    const file = pilot();
    expect(proposedClassification(file, received())).toEqual({ categoryId: "renforcement", bodyZoneIds: ["bras", "epaules"], unmatchedZones: [] });
    const custom = received({ categoryId: "uuid-perso", categoryLabel: "Cardio", bodyZoneIds: ["z-1", "z-2"], bodyZoneLabels: ["Genoux", "Nuque"] });
    expect(proposedClassification(file, custom)).toEqual({ categoryId: "cardio", bodyZoneIds: ["genoux"], unmatchedZones: ["Nuque"] });
  });

  it("crée une fiche LOCAL_CREATED privée, rapprochée du Mouvement, valide et sans identité inventée", () => {
    const file = pilot();
    const item = received();
    const { file: next, sheet } = createSheet(file, inboxMovementToSheetInput(item, { categoryId: "renforcement", bodyZoneIds: ["bras"] }),
      { date: "2026-11-11", author: null, summary: "Reçu du téléphone" });
    expect(sheet).toMatchObject({
      provenance: { origin: "LOCAL_CREATED", upstream: null, owner: null, author: null, visibility: "PRIVATE", reviewStatus: "DRAFT" },
      content: { name: "Pompe murale", aliases: ["Wall push-up"], steps: item.steps },
      validation: { publicationAllowed: false },
      install: { knownLocalMovementIds: ["mv-1"] },
    });
    expect(sheet.content.notes).toMatch(/2 média\(s\) non transféré/);
    const parsed = parseMovementCatalogueFile(JSON.parse(serializeMovementCatalogueFile(next)));
    expect(parsed.ok).toBe(true);
  });
});
