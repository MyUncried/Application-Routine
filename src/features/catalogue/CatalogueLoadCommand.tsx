import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text } from "react-native";

/**
 * CA-4 — Commande de recette « Charger un catalogue » (hors MVP, sans référence Figma), qui
 * remplace « Importer 60 fiches ». Affichée uniquement par une build construite avec
 * `EXPO_PUBLIC_KODJO_CATALOGUE_IMPORT=1` (variante « Routine Catalogue »).
 */
export const CATALOGUE_LOAD_ENABLED = process.env.EXPO_PUBLIC_KODJO_CATALOGUE_IMPORT === "1";

export function CatalogueLoadCommand() {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push("/catalogue-load")}
      accessibilityRole="button"
      accessibilityLabel="Charger un catalogue de mouvements depuis un fichier"
      style={styles.button}
      testID="catalogue-load-open"
    >
      <Text style={styles.label}>Charger un catalogue (test local)</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignSelf: "flex-start",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#B3C4E6",
    borderRadius: 8,
    marginTop: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#2853A0",
  },
});
