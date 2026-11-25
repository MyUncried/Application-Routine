import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";

import { colors } from "@/shared/ui/tokens";

const CALENDAR = require("../../../assets/icons/icon-aujourdhui.svg");

/** Gris foncé de l'état « Jour courant » du composant Figma `icon/aujourd'hui` (`12779:24842`). */
const CURRENT_DAY_COLOR = "#333333";

/**
 * Icône « Aujourd'hui » de la zone de contexte de l'Agenda (D-538, DSF Agenda § 2, 20/11/2026 ; Figma `icon/aujourd'hui`,
 * variantes « Jour courant » `12779:24842` et « Autre jour » `12783:24674`) : même calendrier que l'icône « Planifier »
 * (trait 1,5), le chiffre du jour à la place du « + ». Gris foncé quand le jour sélectionné est le jour courant, bleu (couleur
 * de « Planifier ») sinon. Le chiffre suit la date du jour (la maquette affiche 20).
 */
export function TodayIcon({ day, current, testID }: { readonly day: number; readonly current: boolean; readonly testID: string }) {
  const color = current ? CURRENT_DAY_COLOR : colors.primary;
  return (
    <View style={styles.box} testID={testID}>
      <Image source={CALENDAR} style={[styles.calendar, { tintColor: color }]} contentFit="contain" accessible={false} testID={`${testID}-${current ? "current" : "other"}`} />
      {/* Chiffre dans la partie du calendrier sous le bandeau (y 10 à 23), Inter gras 9. */}
      <View style={styles.numberZone} pointerEvents="none">
        <Text style={[styles.number, { color }]} allowFontScaling={false} testID={`${testID}-number`}>
          {day}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { width: 24, height: 24 },
  calendar: { width: 24, height: 24 },
  numberZone: { position: "absolute", left: 2, right: 2, top: 10, bottom: 1, alignItems: "center", justifyContent: "center" },
  number: { fontFamily: "Inter_700Bold", fontWeight: "700", fontSize: 9, lineHeight: 11 },
});
