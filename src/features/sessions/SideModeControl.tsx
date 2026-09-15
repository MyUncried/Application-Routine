import { Pressable, StyleSheet, Text, View } from "react-native";

import { cycleSideMode, type SideMode } from "@/domain/sessions/sideMode";
import { strings } from "@/shared/i18n";
import { colors, dimensions, minTouchTarget, spacing, type } from "@/shared/ui/tokens";

export type SideModeControlProps = {
  readonly value: SideMode;
  /** Reçoit directement la valeur SUIVANTE (`cycleSideMode(value)`, déjà calculée) — jamais l'appelant qui recalcule le cycle. */
  readonly onChange: (next: SideMode) => void;
  /**
   * Nom accessible COMPLET du contrôle, entièrement composé par l'appelant
   * (plan V2-BILAT-01, `## UI`) : l'Activité (`Côté : …`) et le Tour
   * (`Direction du Tour : …`) portent des textes distincts, jamais dérivés
   * ici — seules les valeurs VISIBLES (`D→G`/`G→D`/vide) sont partagées.
   */
  readonly accessibilityLabel: string;
  /**
   * Titre visible au-dessus du contrôle — `null` (défaut) omet entièrement
   * la ligne de titre. Le contrôle Tour n'affiche aucun titre (« Côté »/
   * « Côtés » proscrit par le plan pour ce contexte) ; le contrôle Activité
   * transmet `Côté`.
   */
  readonly title?: string | null;
  /**
   * Enfant `IN_TOUR` d'un Tour bilatéral (plan `## UI`, « enfant visible,
   * désactivé, proprement `UNILATERAL` ») : le contrôle reste visible mais
   * n'accepte plus aucun appui. `value` doit alors déjà valoir `UNILATERAL`
   * (remis par `applyTourSideModeTransition` au moment de l'activation) —
   * ce composant ne le force pas lui-même, il reste purement présentational.
   */
  readonly disabled?: boolean;
  /** Largeur locale du contrôle — `74` par défaut (Activité, `narrowColumnWidth`) ; le Tour transmet `42`. */
  readonly width?: number;
  /** Hauteur locale du contrôle — `42` par défaut (Activité, `controlHeight`) ; le Tour transmet `34`. */
  readonly height?: number;
  /**
   * Correction bornée (plan `## 3`, « Le contexte Tour est ajouté de manière
   * optionnelle ») : `false` par défaut — le rendu Activité, notamment
   * `UNILATERAL` visuellement VIDE, reste alors STRICTEMENT inchangé, tous
   * les appels Activité existants restant valides sans modification.
   * `true` (transmis uniquement par `CompositionScreen`) : `UNILATERAL`
   * affiche un tiret CENTRÉ (`strings.shared.sideMode.tour.valueLabels`)
   * plutôt qu'un affichage vide, et l'espacement interne du cadre est réduit
   * pour que `D→G`/`G→D` restent ENTIÈREMENT visibles dans la géométrie
   * locale `42 × 34` (jamais tronqués).
   */
  readonly isTourContext?: boolean;
  readonly testID?: string;
};

/**
 * Contrôle `Côté`/`Direction du Tour` (V2-BILAT-01, `sideMode.ts`) — un seul
 * appui fait AVANCER la direction d'un cran (`cycleSideMode` : `Unilatéral →
 * D→G → G→D → Unilatéral`), jamais un sélecteur à trois options distinctes.
 * Partagé par `ExerciseScreen` (Activité, ligne 2/colonne 1 de la grille de
 * paramètres, sous `Séries`) et `CompositionScreen` (Tour, immédiatement à
 * droite du sélecteur `Nombre de tours`) — un seul composant, jamais deux
 * copies locales pouvant diverger. Titre, nom accessible et géométrie sont
 * des props explicites (plan `## UI`, les deux contextes portant des textes
 * et des dimensions différents) ; seules les valeurs VISIBLES (`D→G`/`G→D`/
 * vide pour `UNILATERAL`) sont calculées ici, partagées par construction.
 *
 * Anatomie minimale, cohérente avec les contrôles compacts déjà établis
 * (`ParameterField` d'`ExerciseScreen.tsx`, `Nombre de tours` de
 * `CompositionScreen.tsx`) : libellé court optionnel au-dessus, valeur
 * affichée dans un cadre pressable en dessous. Aucune référence Figma dédiée
 * n'accompagne cette tranche (plan `V2-BILAT-01` — configuration préalable à
 * T03, hors recette visuelle) : la géométrie Activité réutilise donc des
 * tokens déjà canoniques (`dimensions.exerciseParameterRow`, revue
 * indépendante) plutôt que d'en publier de nouveaux ; la géométrie Tour
 * (`42 × 34`), elle, n'a pas d'équivalent canonique existant — écart
 * disclosé dans le rapport de mission.
 */
export function SideModeControl({
  value,
  onChange,
  accessibilityLabel,
  title = null,
  disabled = false,
  width = dimensions.exerciseParameterRow.narrowColumnWidth,
  height = dimensions.exerciseParameterRow.controlHeight,
  isTourContext = false,
  testID,
}: SideModeControlProps) {
  // Valeur VISIBLE : `RIGHT_LEFT`/`LEFT_RIGHT` affichent toujours `D→G`/
  // `G→D`, partagés entre Activité et Tour. `UNILATERAL` diverge SEUL selon
  // le contexte — vide pour l'Activité (comportement par défaut, INCHANGÉ),
  // tiret centré pour le Tour (`isTourContext`, plan `## 4.2`).
  const valueLabel = isTourContext
    ? strings.shared.sideMode.tour.valueLabels[value]
    : strings.shared.sideMode.valueLabels[value];

  function handlePress() {
    onChange(cycleSideMode(value));
  }

  return (
    <View style={styles.container} testID={testID}>
      {title !== null ? (
        <Text style={styles.label} numberOfLines={1}>
          {title}
        </Text>
      ) : null}
      <Pressable
        disabled={disabled}
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ disabled }}
        hitSlop={hitSlopFor(height)}
        style={[
          styles.control,
          { width, height },
          // Espacement interne RÉDUIT pour le Tour (`42 × 34`, plan `## 3`,
          // « espacement interne réduit localement pour éviter la
          // troncature ») — jamais appliqué à l'Activité (`74 × 42`, marge
          // déjà suffisante), qui garde `styles.control.paddingHorizontal`.
          isTourContext ? styles.controlTourPadding : null,
          disabled ? styles.controlDisabled : null,
        ]}
        testID={testID ? `${testID}-control` : undefined}
      >
        <Text
          style={[styles.value, disabled ? styles.valueDisabled : null]}
          numberOfLines={1}
          testID={testID ? `${testID}-value` : undefined}
        >
          {valueLabel}
        </Text>
      </Pressable>
    </View>
  );
}

/** Complément vertical portant la cible tactile de `height` à `minTouchTarget` (`48`) — jamais négatif si `height` dépasse déjà ce minimum. */
function hitSlopFor(height: number) {
  const vertical = Math.max((minTouchTarget - height) / 2, 0);
  return { top: vertical, bottom: vertical, left: 0, right: 0 };
}

const styles = StyleSheet.create({
  container: {
    gap: dimensions.exerciseParameterRow.labelGap,
  },
  label: {
    ...type.parameterColumnLabel,
    color: colors.exerciseParameterLabelText,
  },
  control: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.exerciseParameterControlBorder,
    borderRadius: dimensions.exerciseParameterRow.controlRadius,
    paddingHorizontal: spacing[12],
  },
  // Correction bornée (plan `## 3`) : `42 × 34` (Tour) ne laisse pas la
  // place du `paddingHorizontal` Activité (`spacing/12` de chaque côté,
  // `24` au total sur une largeur de `42`) sans tronquer `D→G`/`G→D` —
  // réduit au plus petit palier DSF non nul (`spacing/4`), jamais retiré
  // entièrement (le cadre resterait visuellement collé au texte).
  controlTourPadding: {
    paddingHorizontal: spacing[4],
  },
  controlDisabled: {
    opacity: 0.5,
  },
  value: {
    ...type.label,
    color: colors.exerciseParameterValueText,
  },
  valueDisabled: {
    color: colors.disabled,
  },
});
