import { Pressable, StyleSheet, View } from "react-native";

import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import { colors, dimensions, minTouchTarget } from "@/shared/ui/tokens";

export type DisclosureControlProps = {
  /** `false` = `State=Collapsed` (`2537:1033`) ; `true` = `State=Expanded` (`2537:1038`). */
  expanded: boolean;
  disabled?: boolean;
  onPress?: () => void;
  /**
   * Obligatoire dans l'usage nominal (contrôle autonome). Optionnel
   * UNIQUEMENT lorsque `decorative` est vrai — voir ci-dessous.
   */
  accessibilityLabel?: string;
  /**
   * T02-S02 : le contrôle est imbriqué DANS un élément déjà pressable et
   * déjà nommé (l'en-tête de section repliable de `ExerciseScreen`). Deux
   * nœuds accessibles superposés dupliqueraient le nom de l'en-tête et
   * rendraient toute requête d'accessibilité ambiguë. `decorative` retire
   * donc le nœud de l'arbre d'accessibilité (`accessible={false}`, aucun
   * rôle, aucun état, aucun libellé) tout en CONSERVANT `onPress` — le
   * chevron reste tapable, la sémantique étant portée une seule fois par
   * l'en-tête hôte. Par défaut `false` : les consommateurs existants
   * (`SessionCard`, Catalogue) sont strictement inchangés.
   */
  decorative?: boolean;
  /** Préfixe des `testID` internes (`${testID}-frame`/`${testID}-chevron`) — le `Pressable` racine lui-même ne porte pas de `testID` propre, déjà ciblable sans ambiguïté par `accessibilityLabel`. */
  testID?: string;
};

const HIT_SLOP = (minTouchTarget - dimensions.catalogueDisclosure.frame) / 2;

/**
 * Instance de `Controls / Disclosure — Source exact` (T01-S09, correction
 * VISUAL — commentaire de revue faisant suite à `1f28a09`, alignement du
 * Catalogue sur `12 – Architecture technique.md`, § « Le contrôle `Controls
 * / Disclosure — Source exact` est la référence normative de tout bouton de
 * déploiement ou de repli utilisant cette famille... sans copie graphique
 * locale »).
 *
 * Remplace l'ancien cadre ad hoc de `SessionCard.tsx` (`colors.tourSurface`
 * emprunté à `Activity / Parameter Row`, opacité `0.45` non documentée) —
 * défaut signalé : aucune de ces deux valeurs n'est sourcée pour CE
 * contrôle, distinct de `Forms / Select Field`.
 *
 * Géométrie et couleurs canoniques, vérifiées directement sur les deux
 * nœuds Figma référencés par la documentation (`2537:1033`/`2537:1038`),
 * jamais une valeur locale improvisée :
 * - cible tactile `48 × 48` (`minTouchTarget`, partagé) ;
 * - cadre visible centré `28 × 28`, rayon `6`, fond `#FBFCFF`
 *   (`colors.disclosureBackground`) — identique dans les deux états ;
 * - `State=Collapsed` : bordure `#D6D9E3` sur `1` point
 *   (`colors.disclosureBorderCollapsed`), chevron bas `8 × 4` teinté
 *   `#8282F2` (`colors.disclosureChevronCollapsed`) ;
 * - `State=Expanded` : bordure `#8283F2` sur `2` points
 *   (`colors.disclosureBorderExpanded`), chevron haut `8 × 4` de la même
 *   couleur — un seul token réutilisé pour la bordure et le chevron ouvert,
 *   la documentation précisant explicitement « chevron haut de même
 *   couleur ».
 *
 * Le chevron `8 × 4` réutilise l'asset SVG existant
 * `control-chevron-down`/`control-chevron-up` (jamais redessiné) : son
 * `viewBox` `24 × 24` dessine un tracé de `12 × 6` en son centre — l'afficher
 * à `dimensions.catalogueDisclosure.chevronDisplaySize` (`16 = 24 × 8/12`)
 * fait donc apparaître ce tracé exactement à `8 × 4`, sans nouvelle
 * géométrie. `tintColor` (`expo-image`) recolore fiablement ce glyphe
 * monochrome (même mécanisme déjà utilisé pour le chevron blanc du contrôle
 * Tour, `CompositionScreen.tsx`).
 *
 * Les destinations et réactions de Déployer/Replier restent définies par
 * l'écran hôte (`onPress`/`disabled` transmis tels quels) — ce composant ne
 * porte aucun comportement métier propre, conformément à la documentation
 * (« elles ne sont pas héritées comme comportement métier du composant »).
 */
export function DisclosureControl({
  expanded,
  disabled = false,
  onPress,
  accessibilityLabel,
  decorative = false,
  testID,
}: DisclosureControlProps) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      // `accessible={false}` seul — jamais `importantForAccessibility=
      // "no-hide-descendants"` : ce dernier MASQUERAIT tout le sous-arbre, y
      // compris le cadre et le chevron, alors que le contrôle doit rester
      // visible et inspectable (rendu strictement identique). Le nœud cesse
      // simplement d'être un élément d'accessibilité à part entière.
      accessible={decorative ? false : undefined}
      accessibilityRole={decorative ? undefined : "button"}
      accessibilityState={decorative ? undefined : { disabled, expanded }}
      accessibilityLabel={decorative ? undefined : accessibilityLabel}
      hitSlop={HIT_SLOP}
      style={styles.pressable}
    >
      <View
        style={[styles.frame, expanded ? styles.frameExpanded : styles.frameCollapsed]}
        testID={testID ? `${testID}-frame` : undefined}
      >
        <KodjoIcon
          name={expanded ? "control-chevron-up" : "control-chevron-down"}
          size={dimensions.catalogueDisclosure.chevronDisplaySize}
          tintColor={expanded ? colors.disclosureBorderExpanded : colors.disclosureChevronCollapsed}
          testID={testID ? `${testID}-chevron` : undefined}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    alignItems: "center",
    justifyContent: "center",
  },
  frame: {
    width: dimensions.catalogueDisclosure.frame,
    height: dimensions.catalogueDisclosure.frame,
    borderRadius: dimensions.catalogueDisclosure.radius,
    backgroundColor: colors.disclosureBackground,
    alignItems: "center",
    justifyContent: "center",
  },
  frameCollapsed: {
    borderWidth: 1,
    borderColor: colors.disclosureBorderCollapsed,
  },
  frameExpanded: {
    borderWidth: 2,
    borderColor: colors.disclosureBorderExpanded,
  },
});
