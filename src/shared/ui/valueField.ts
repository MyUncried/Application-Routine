import { StyleSheet } from "react-native";

import { toVerifyColors } from "@/shared/ui/toVerifyColors";
import { colors } from "@/shared/ui/tokens";

/**
 * PRE-9 — convention unique des champs de valeur (recette iPhone du 06/11/2026, remarque générale e, Hermann ; texte recopié
 * au registre ch07, « Homogénéité des tableaux des Formats et convention des champs de valeur ») : « Que la convention soit
 * la même, quel que soit le champ et quelque soit le tableau (créer token et/ou composant standard réutilisable) ».
 *
 * - Fond du cadre : blanc ; orange (à vérifier, `toVerifyColors.surface`) ; rouge (à compléter, `colors.dangerSurface`).
 * - Texte : bleu KODJO (modifiable) ; noir (non modifiable) ; gris (valeur grisée par le Format, Figma « État = Grisé »).
 * - Hauteur : celle du champ « Nombre de séries » de l'EMOM (Figma `11601:21711`, « Valeur modifiable — Tours ») : 24, soit
 *   Inter Semi Bold 13 sur une ligne de 16 et 4 de marge verticale ; rayon 10 ; marge horizontale 10.
 * - Aucun liseré, dans aucune situation.
 * - Dans les tableaux, valeur centrée dans son cadre.
 *
 * `tokens.ts` reste figé : constantes locales, comme `toVerifyColors`.
 */
export const VALUE_FIELD_HEIGHT = 24;
export const VALUE_FIELD_RADIUS = 10;
export const VALUE_FIELD_INSET = 10;
const VALUE_FIELD_LINE = 16;

export const valueFieldColors = {
  surface: "#FFFFFF",
  toVerify: toVerifyColors.surface,
  toComplete: colors.dangerSurface,
  /** Champ en cours de saisie (MAJ 04/11 §4.5 : la case en cours de saisie est surlignée). */
  active: "#E8E9FF",
  editable: colors.primary,
  readOnly: "#141414",
  disabled: "#B4B8C2",
} as const;

export const valueFieldStyles = StyleSheet.create({
  field: {
    minHeight: VALUE_FIELD_HEIGHT,
    paddingHorizontal: VALUE_FIELD_INSET,
    paddingVertical: (VALUE_FIELD_HEIGHT - VALUE_FIELD_LINE) / 2,
    borderRadius: VALUE_FIELD_RADIUS,
    borderWidth: 0,
    backgroundColor: valueFieldColors.surface,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
    fontSize: 13,
    lineHeight: VALUE_FIELD_LINE,
    color: valueFieldColors.editable,
    textAlign: "center",
  },
  toVerify: { backgroundColor: valueFieldColors.toVerify },
  toComplete: { backgroundColor: valueFieldColors.toComplete },
  active: { backgroundColor: valueFieldColors.active },
  readOnly: { color: valueFieldColors.readOnly },
  disabled: { color: valueFieldColors.disabled },
});
