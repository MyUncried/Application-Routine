import { useState, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { dimensions } from "@/shared/ui/tokens";

/**
 * Haut fixe (en-tête + zone de contexte) d'un écran présenté en feuille native iOS (`formSheet`).
 *
 * Dans une feuille, `react-native-screens` étend la liste défilante à toute la hauteur de la feuille : posée sous un
 * en-tête dans le flux, elle remonte derrière lui et capte ses touchers (recette Planification du 18/11/2026, Hermann :
 * « Le catalogue des séances s'ouvre en modale mais avec un bug d'affichage. Et la fenêtre ne peut plus se fermer » ;
 * même constat sur les feuilles de filtres le 04/11/2026, `FilterSheetPrimitives`). Le haut est donc posé par-dessus la
 * liste, qui reçoit sa hauteur mesurée pour décaler son contenu (`renderScroll(topHeight)`), et la liste est enveloppée
 * pour ne pas être le premier élément de la feuille.
 */
export function SheetFixedTop({ top, renderScroll }: { readonly top: ReactNode; readonly renderScroll: (topHeight: number) => ReactNode }) {
  const [topHeight, setTopHeight] = useState<number>(dimensions.header.contentHeight + dimensions.contextBand.height);
  return (
    <>
      <View style={styles.scrollHost} collapsable={false}>
        {renderScroll(topHeight)}
      </View>
      <View style={styles.top} pointerEvents="box-none" onLayout={(event) => setTopHeight(event.nativeEvent.layout.height)} testID="sheet-fixed-top">
        {top}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  scrollHost: { flex: 1 },
  top: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 2 },
});
