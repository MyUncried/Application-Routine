import { useState, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { ContextBand, FixedHeader } from "@/shared/ui/ScreenShell";

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
 *
 * C'est le dispositif de `FilterSheetFrame` en feuille native (`nativeHeader` absolu au premier plan, `nativeScrollHost`,
 * `paddingTop` mesuré), sorti en composant pour les deux feuilles de la planification. L'enveloppe seule, sans en-tête
 * posé par-dessus, ne suffit pas (contre-recette iPhone du 18/11/2026, `6777b886` : liste encore sous la recherche).
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

/**
 * Haut standard d'une feuille native à zone de contexte (recette Planification du 18/11/2026, k2c, Hermann : « UTILISER LE
 * COMPOSANT DE LA ZONE DE CONTEXTE » ; « utilises-tu un composant unique standard / une fonction standard, qu'il suffit
 * d'appeler pour présenter une modale, et une pour la zone de contexte ? ») : un seul appel compose les composants
 * standards, sans option à oublier —
 * - en-tête `FixedHeader` de modale : ✕ à gauche, titre centré (demande du 05/11/2026), coche `validate` à droite ;
 * - zone de contexte `ContextBand` du Catalogue : fondu vers la transparence, halo et courbure sous ✕ (`backHalo`) et
 *   sous la coche (`validateHalo`), de la couleur de l'en-tête ;
 * - posés par-dessus la liste (`SheetFixedTop`).
 * D-545 (« Rattacher un programme », 23/11/2026) : `validate` absent — feuille sans bouton Valider, ni coche ni halo à droite.
 */
export function NativeSheetTop({
  title,
  onClose,
  closeAccessibilityLabel,
  validate,
  headerBackground,
  bandColor,
  bandPadding,
  band,
  below,
  renderScroll,
}: {
  readonly title: string;
  readonly onClose: () => void;
  readonly closeAccessibilityLabel: string;
  readonly validate?: { readonly onPress: () => void; readonly enabled: boolean; readonly accessibilityLabel: string };
  /** Fond de l'en-tête, repris par les halos. */
  readonly headerBackground: string;
  /** Couleur de la zone (défaut de `ContextBand`). */
  readonly bandColor?: string;
  readonly bandPadding?: { readonly top: number; readonly bottom: number };
  readonly band: ReactNode;
  /** Contenu fixe sous la zone de contexte (au-dessus de la liste qui défile), facultatif. */
  readonly below?: ReactNode;
  readonly renderScroll: (topHeight: number) => ReactNode;
}) {
  return (
    <SheetFixedTop
      top={
        <>
          <View style={{ backgroundColor: headerBackground }}>
            <FixedHeader title={title} closeIcon topInset={0} onBack={onClose} backAccessibilityLabel={closeAccessibilityLabel} {...(validate !== undefined ? { validate } : {})} />
          </View>
          <ContextBand
            fadeToTransparent
            backHalo={headerBackground}
            {...(validate !== undefined ? { validateHalo: headerBackground } : {})}
            {...(bandColor !== undefined ? { color: bandColor } : {})}
            {...(bandPadding !== undefined ? { padding: bandPadding } : {})}
          >
            {band}
          </ContextBand>
          {below ?? null}
        </>
      }
      renderScroll={renderScroll}
    />
  );
}

const styles = StyleSheet.create({
  scrollHost: { flex: 1 },
  top: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 2 },
});
