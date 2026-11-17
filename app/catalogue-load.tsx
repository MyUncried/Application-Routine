import { Stack } from "expo-router";
import { Text, View } from "react-native";

import { CATALOGUE_LOAD_ENABLED } from "@/features/catalogue/CatalogueLoadCommand";
import { CatalogueLoadScreen } from "@/features/catalogue/CatalogueLoadScreen";

/** Route de recette `routine://catalogue-load` (CA-4), active seulement dans la variante « Routine Catalogue ». */
export default function CatalogueLoadRoute() {
  return (
    <>
      <Stack.Screen options={{ title: "Charger un catalogue" }} />
      {CATALOGUE_LOAD_ENABLED ? (
        <CatalogueLoadScreen />
      ) : (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 24 }}>
          <Text>Chargement de catalogue indisponible dans cette build.</Text>
        </View>
      )}
    </>
  );
}
