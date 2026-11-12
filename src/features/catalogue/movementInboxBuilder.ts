/**
 * A2 — Envoi de Mouvements personnels à l'administration : construction de l'envoi au format partagé
 * `KODJO_MOVEMENT_INBOX` 1.0.0, contrôlé par le même validateur que le serveur (`parseMovementInbox`).
 * Les médias ne sont pas transférés dans ce lot (seul leur nombre l'est, MOUV-D2).
 */
import { decodeInstructionSteps } from "@/domain/activities/instructionSteps";
import type { Movement } from "@/domain/activities/Movement";
import {
  MOVEMENT_INBOX_FORMAT,
  MOVEMENT_INBOX_FORMAT_VERSION,
  parseMovementInbox,
  type MovementInboxParseResult,
} from "@/domain/catalogue/MovementInbox";

export function buildMovementInbox(input: {
  readonly movements: readonly Movement[];
  readonly categoryLabels: ReadonlyMap<string, string>;
  readonly bodyZoneLabels: ReadonlyMap<string, string>;
  readonly deviceName: string;
  readonly sentAt: string;
}): MovementInboxParseResult {
  return parseMovementInbox({
    format: MOVEMENT_INBOX_FORMAT,
    formatVersion: MOVEMENT_INBOX_FORMAT_VERSION,
    sentAt: input.sentAt,
    device: { name: input.deviceName.slice(0, 60) || "iPhone" },
    movements: input.movements.map((movement) => ({
      movementId: movement.id,
      name: movement.name,
      aliases: [...movement.aliases],
      steps: decodeInstructionSteps(movement.description),
      categoryId: movement.categoryId,
      categoryLabel: input.categoryLabels.get(movement.categoryId) ?? movement.categoryId,
      bodyZoneIds: [...movement.bodyZoneIds],
      bodyZoneLabels: movement.bodyZoneIds.map((id) => input.bodyZoneLabels.get(id) ?? id),
      mediaCount: movement.media.length,
    })),
  });
}
