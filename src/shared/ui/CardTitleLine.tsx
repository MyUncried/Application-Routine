import { StyleSheet, Text, View } from "react-native";

import { colors, spacing, type } from "@/shared/ui/tokens";

export type CardTitleLineProps = {
  title: string;
  /**
   * Durée déjà formatée par l'appelant. Absente (`null`/`undefined`) : aucun
   * bloc n'est rendu — jamais une durée « 0 ». La règle qui décide si une
   * carte affiche une durée appartient à l'appelant (propriété Figma `Durée`
   * de `DSF / Cards / Séance` et `DSF / Cards / Exercice`).
   */
  duration?: string | null;
  testID?: string;
};

/**
 * Ligne « Titre + durée totale » des cartes de Séance et d'Exercice
 * (`DSF / Cards / Séance` `6214:7276`, `DSF / Cards / Exercice` `6214:7278`,
 * alignement DSF du 07/10/2026, D11) : titre Inter Semi Bold 15 à gauche,
 * durée Inter Semi Bold 12 en `color/text-primary`, SANS cadre, calée à
 * droite sur le bord droit de la colonne de texte (16 du bord de la carte,
 * porté par le padding de l'appelant).
 */
export function CardTitleLine({ title, duration, testID }: CardTitleLineProps) {
  return (
    <View style={styles.line}>
      <Text style={styles.title} numberOfLines={2}>
        {title}
      </Text>
      {duration ? (
        <Text style={styles.duration} testID={testID ? `${testID}-duration` : undefined}>
          {duration}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  line: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing[6],
  },
  title: {
    ...type.listCardTitle,
    flex: 1,
    color: colors.textPrimary,
  },
  // La ligne de base du titre (15/18) et celle de la durée (12/15) sont
  // alignées par le décalage vertical Figma (`y = 14` contre `y = 12`).
  duration: {
    ...type.cardDuration,
    marginTop: spacing[2],
    textAlign: "right",
    color: colors.textPrimary,
  },
});
