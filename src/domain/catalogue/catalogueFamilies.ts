/**
 * Familles de niveaux des fiches importées (décision de Hermann du 11/11/2026, extension de MFN-05 / D-439).
 * Module pur : aucune E/S.
 *
 * - Identité : la famille d'une fiche est propre à son catalogue. Sur le téléphone, son identifiant de groupe
 *   est `catalogue:<catalogue.id>#<groupId>` : deux catalogues indépendants qui emploient la même clé ne
 *   fusionnent jamais, et un nouvel import retrouve la même famille.
 * - Ordre : la progression appartient aux fiches (clé de tri de l'administration, croissante = niveau
 *   croissant). Les membres importés de la famille occupent leurs emplacements dans l'ordre de leurs clés ;
 *   un Mouvement local placé par l'utilisateur dans cette famille garde son emplacement.
 * - Adaptations locales (CA-3, décision du 10/11/2026) : une appartenance modifiée sur le téléphone depuis
 *   l'installation n'est jamais écrasée ; une fiche dont la famille n'a pas changé ne touche à rien.
 */
import type { CatalogueLevelGroup } from "@/domain/catalogue/MovementCatalogueFile";

/** Identifiant local du groupe de niveaux d'une famille de catalogue. */
export function catalogueFamilyGroupId(catalogueId: string, groupId: string): string {
  return "catalogue:" + catalogueId + "#" + groupId;
}

export type CatalogueFamilyAction =
  /** Rien à faire : pas de famille, ou famille inchangée depuis l'installation. */
  | { readonly kind: "NONE" }
  /** Appartenance modifiée sur le téléphone : conservée. */
  | { readonly kind: "KEEP_LOCAL" }
  /** La fiche a quitté sa famille : le Mouvement en sort (dissolution du dernier couple, règle D2). */
  | { readonly kind: "LEAVE" }
  /** Placer le Mouvement dans la famille ; `leaveFirst` : il quitte d'abord une autre famille importée. */
  | { readonly kind: "PLACE"; readonly groupId: string; readonly leaveFirst: boolean };

const sameGroup = (a: CatalogueLevelGroup | null, b: CatalogueLevelGroup | null) =>
  a === null || b === null ? a === b : a.groupId === b.groupId && a.sortKey === b.sortKey;

/**
 * Action à appliquer au Mouvement d'une fiche acceptée.
 * `base` : famille de la fiche installée auparavant (`null` = aucune) ; `undefined` = aucune installation
 * connue (installation ou rattachement d'un Mouvement existant).
 * `localGroupId` : groupe actuel du Mouvement sur le téléphone.
 */
export function catalogueFamilyAction(input: {
  readonly catalogueId: string;
  readonly base: CatalogueLevelGroup | null | undefined;
  readonly incoming: CatalogueLevelGroup | null;
  readonly localGroupId: string | null;
}): CatalogueFamilyAction {
  const { catalogueId, base, incoming, localGroupId } = input;
  const incomingId = incoming === null ? null : catalogueFamilyGroupId(catalogueId, incoming.groupId);
  if (base === undefined) {
    if (incomingId === null) return { kind: "NONE" };
    if (localGroupId === null || localGroupId === incomingId) return { kind: "PLACE", groupId: incomingId, leaveFirst: false };
    return { kind: "KEEP_LOCAL" };
  }
  if (sameGroup(base, incoming)) return { kind: "NONE" };
  const baseId = base === null ? null : catalogueFamilyGroupId(catalogueId, base.groupId);
  if (localGroupId !== baseId) return { kind: "KEEP_LOCAL" };
  if (incomingId === null) return { kind: "LEAVE" };
  return { kind: "PLACE", groupId: incomingId, leaveFirst: localGroupId !== null && localGroupId !== incomingId };
}

/** Membre actuel du groupe local ; `sortKey` : clé de sa fiche dans la famille, `null` s'il n'en vient pas. */
export type FamilySlot = { readonly movementId: string; readonly sortKey: number | null };

/**
 * Ordre complet du groupe après placement de `movementId` (clé `sortKey`) : il s'insère avant le premier
 * membre importé de clé supérieure (à la fin sinon), puis les membres importés sont rangés par clé dans
 * leurs emplacements ; les autres membres ne bougent pas.
 */
export function orderedCatalogueFamily(current: readonly FamilySlot[], movementId: string, sortKey: number): readonly string[] {
  const others = current.filter((slot) => slot.movementId !== movementId);
  const after = others.findIndex((slot) => slot.sortKey !== null && slot.sortKey > sortKey);
  const at = after < 0 ? others.length : after;
  const slots: FamilySlot[] = [...others.slice(0, at), { movementId, sortKey }, ...others.slice(at)];
  const imported = slots
    .map((slot, index) => ({ slot, index }))
    .filter((entry) => entry.slot.sortKey !== null);
  const sorted = [...imported].sort((a, b) =>
    (a.slot.sortKey as number) - (b.slot.sortKey as number) || a.slot.movementId.localeCompare(b.slot.movementId));
  imported.forEach((entry, position) => { slots[entry.index] = sorted[position]!.slot; });
  return slots.map((slot) => slot.movementId);
}
