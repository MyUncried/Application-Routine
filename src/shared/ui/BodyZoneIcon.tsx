import { resolveSilhouette, type Silhouette } from "@/domain/preferences/Profile";
import { KodjoIcon, type KodjoIconName } from "@/shared/ui/KodjoIcon";

export type BodyZoneIconProps = {
  /** Silhouette du Profil — `null`/absente affiche homme (T13, `resolveSilhouette`). */
  silhouette: Silhouette | null;
  size?: number;
  /**
   * PRE-4 story 4.3 (FR-02-05 ; ch. 13 l. 588, planche `7245:13718`) : état
   * « plein » de la même silhouette, pendant l'ouverture de la sélection des
   * Zones ; absent ou `false` : contour, rendu inchangé pour tous les appelants.
   */
  filled?: boolean;
  testID?: string;
};

/**
 * Résolveur d'icône de Zone corporelle (V2-PRE-1, #287 ; V2-PRE-2, plan
 * §6.5, T13) : une seule famille d'icônes, variante homme/femme selon la
 * silhouette du Profil — absence de silhouette affiche homme. Change
 * uniquement l'icône ; aucune donnée, liste ni calcul de Zone n'est
 * affecté (CE-UI-01 L2805 ; DSF RG-5, RG-10).
 */
export function BodyZoneIcon({ silhouette, size, filled = false, testID }: BodyZoneIconProps) {
  const resolved = resolveSilhouette(silhouette);
  const name: KodjoIconName =
    resolved === "femme"
      ? filled
        ? "body-zone-femme-plein"
        : "body-zone-femme"
      : filled
        ? "body-zone-homme-plein"
        : "body-zone-homme";
  return <KodjoIcon name={name} size={size} testID={testID} />;
}
