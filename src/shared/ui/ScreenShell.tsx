import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View, type StyleProp, type TextStyle, type ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import { colors, dimensions, layout, minTouchTarget, spacing, type } from "@/shared/ui/tokens";

/**
 * `Screen Shell` Foundation partagé (doc12 §12.26, `Shell / Screen`,
 * `Header / Fixed`) — correction `CMP-01` (contre-recette iPhone, Phase 2
 * Composition consolidée, `[ChatGPT] DIAGNOSTIC APPROVED — PHASE02
 * CONSOLIDATED REWORK02`, 2026-09-03).
 *
 * Extrait à l'identique de `CatalogueScreen.tsx` (rendu déjà accepté sur
 * device réel, `PHASE01_DEVICE_ACCEPTED_WITH_RESIDUAL`) — aucune valeur de
 * style n'a été changée pendant cette extraction, uniquement déplacée ici
 * pour être réutilisée par `CompositionScreen.tsx` sans duplication locale
 * de `header`/`headerSeparator`/`contextBand`, interdite par la correction
 * Foundation. Toute divergence future entre écrans passe par les props de
 * ces composants, jamais par une redéfinition locale équivalente.
 */
export function ScreenShell({ children }: { children: ReactNode }) {
  return <View style={styles.container}>{children}</View>;
}

export type FixedHeaderProps = {
  title: string;
  /** Action Retour — omise (aucun cercle rendu) sur les écrans racines de la navigation basse (Catalogue). */
  onBack?: () => void;
  backAccessibilityLabel?: string;
  /**
   * PRE-4 story 4.2 (FR-02-03, AC4) : l'action de gauche affiche le ✕ de
   * `Action / Fermer` (`icon/fermer`, `6959:15825`) au lieu du chevron Retour.
   * Prop LOCALE, `false` par défaut : seul l'Éditeur d'Exercice la passe ; le
   * cercle, la cible 48 et le `hitSlop` sont inchangés, les autres écrans aussi.
   */
  closeIcon?: boolean;
  /**
   * PRE-4 story 4.2 (FR-02-04, AC5) : marge latérale de l'en-tête — 24 par
   * défaut (inchangé) ; l'Éditeur d'Exercice passe 16 sous la largeur 390. PRE-8, recette A/B
   * (A01) : le défaut est désormais `layout.screenGutter` (16) à toutes les largeurs.
   */
  horizontalPadding?: number;
  /**
   * PRE-5 story 3.2 (arbitrage G-1 de Hermann du 19/10) : surcharges LOCALES de l'en-tête
   * de l'Éditeur d'Exercice — retrait gauche et écart cercle → titre (`layoutStyle`), style
   * du cercle (`backCircleStyle`) et du titre (`titleStyle`). Absentes : rendu inchangé
   * pour tous les autres écrans.
   */
  layoutStyle?: StyleProp<ViewStyle>;
  backCircleStyle?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  /** PRE-5 story 3.2 (G-1) : teinte locale du trait de l'icône du cercle (absente : export inchangé). */
  backIconTintColor?: string;
  /**
   * PRE-7 story A2.2 (D-438, Figma `9891:39982`) : action placée à droite du titre — crayon
   * « Modifier le geste » de l'Éditeur en création sur geste repris. Absente : rendu inchangé.
   */
  trailing?: ReactNode;
  /**
   * Recette n° 3 bis du 03/11/2026 (f3s-fiche, Hermann : « Il y a une gros espace entre le haut de la modale et
   * le titre ») : marge haute de l'en-tête — dans une feuille, 0 au lieu de la zone sûre de l'écran.
   */
  topInset?: number;
  /**
   * PRE-9 CAT.1 (zones de contexte des Catalogues, CE-CAT-CTX-01 : « Masquer le titre de page
   * individuel ») : contenu rendu à la place du titre (navigation Mouvements / Séances / Programmes
   * des Catalogues). Absent : titre inchangé.
   */
  content?: ReactNode;
};

/**
 * `Header / Fixed`. Le bouton Retour (`CMP-01`) est présenté dans un cercle
 * de fond pâle (`colors.selectionSurface`, même token que les bandes
 * Context) — auparavant un chevron nu sans conteneur.
 *
 * Correction **R4-02** (`Action / Back`, `2624:3105`, `[ChatGPT] REWORK04
 * IMPLEMENTATION AUTHORIZED — DESIGN COMPLEMENTS REVIEWED`, 2026-09-03) :
 * la cible tactile (`minTouchTarget`, `48×48`) reste inchangée, mais n'est
 * plus la boîte visuelle elle-même — le cercle visible est
 * `dimensions.backAction.visualCircle`, centré dans la cible via `hitSlop`
 * (même patron que `addActivityAction`/`CreateAction` déjà établi dans ce
 * projet).
 *
 * **T02-S02 (D-142)** : ce cercle passe de `28 × 28` à `38 × 38` et l'icône
 * est fixée à `24 × 24` — « Les actions circulaires Retour, Annuler et
 * Valider/Confirmer utilisent un cercle visible `38 × 38`, une icône
 * `24 × 24` et une cible tactile `48 × 48` ». Seule la valeur du token
 * change : ni la structure de l'en-tête, ni la cible tactile, ni le
 * mécanisme de `hitSlop` ne sont touchés (`hitSlop` se réduit
 * mécaniquement de `10` à `5`, la cible restant exactement `48`).
 */
export function FixedHeader({
  title,
  onBack,
  backAccessibilityLabel,
  closeIcon = false,
  horizontalPadding,
  layoutStyle,
  backCircleStyle,
  titleStyle,
  backIconTintColor,
  trailing,
  content,
  topInset,
}: FixedHeaderProps) {
  const insets = useSafeAreaInsets();
  const top = topInset ?? insets.top;
  const backHitSlop = (minTouchTarget - dimensions.backAction.visualCircle) / 2;

  return (
    <View
      testID="screen-header"
      style={[
        styles.header,
        // X-4 (recette PRE-3, 12/10) : hauteur MINIMALE — identique à taille normale,
        // elle grandit avec le texte agrandi au lieu de rogner le titre.
        { paddingTop: top, minHeight: top + dimensions.header.contentHeight },
        horizontalPadding === undefined ? null : { paddingHorizontal: horizontalPadding },
        layoutStyle,
      ]}
    >
      {onBack ? (
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel={backAccessibilityLabel}
          hitSlop={backHitSlop}
          style={[styles.backCircle, backCircleStyle]}
          testID="screen-header-back"
        >
          <KodjoIcon
            name={closeIcon ? "control-close" : "control-back"}
            size={dimensions.backAction.icon}
            tintColor={backIconTintColor}
            testID="screen-header-back-icon"
          />
        </Pressable>
      ) : null}
      {content !== undefined ? (
        content
      ) : (
        <Text style={[styles.title, titleStyle]} accessibilityRole="header">
          {title}
        </Text>
      )}
      {trailing ?? null}
    </View>
  );
}

/**
 * Action circulaire « Fermer » standard (D-142 : cercle visible 38, icône 24, cible 48), la même que le ✕
 * de `FixedHeader` — PRE-9, recette iPhone n° 3 du 02/11/2026 (f3-fenetre, Hermann : « Le bouton Annuler
 * n'est pas au format standard de ce bouton, il existe un composant ») : pour les fenêtres sans en-tête
 * d'écran (fenêtre Formats).
 */
export function CloseCircleAction({ onPress, accessibilityLabel, style, testID }: { onPress: () => void; accessibilityLabel: string; style?: StyleProp<ViewStyle>; testID: string }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={(minTouchTarget - dimensions.backAction.visualCircle) / 2}
      style={[styles.backCircle, style]}
      testID={testID}
    >
      <KodjoIcon name="control-close" size={dimensions.backAction.icon} testID={`${testID}-icon`} />
    </Pressable>
  );
}

/** Séparateur horizontal sous le Header — un seul token (`colors.divider`) pour tous les écrans consommateurs. */
export function HeaderSeparator() {
  return <View testID="screen-header-separator" style={styles.separator} />;
}

/** Bande Context canonique — même fond, hauteur et géométrie pour tous les écrans consommateurs. */
export function ContextBand({
  children,
  elevated = false,
  fadeToTransparent = false,
  padding,
}: {
  children: ReactNode;
  /** Élève la bande au-dessus de ses frères (mêmes besoins de superposition que `CompositionScreen`'s `AnchoredRow`). */
  elevated?: boolean;
  /**
   * Recette iPhone du 29/10/2026 (Hermann : « le dégradé vers la transparence en bas de la zone de
   * contexte n'existe plus, il y a un dégradé vers du blanc à 100 % à la place ») — ch. 12 / D-224 :
   * « Zone de contexte `#EAEAFF`→transparent sur les 20 % inférieurs ». Le fond de la bande n'est
   * plus peint d'un bloc : sa couleur couvre les 80 % supérieurs, puis des couches de la MÊME
   * couleur, superposées (aucun interstice), dont la couverture cumulée descend vers 0 au bas de la
   * zone — la bande devient réellement transparente, au lieu d'un voile blanc posé par-dessus.
   * Positions en points (hauteur fixe `dimensions.contextBand.height`), sans pourcentage imbriqué.
   * Sous le contenu, sans interaction ni VoiceOver.
   *
   * Contre-recette n° 2 du 30/10/2026 (Hermann : « Liste qui défile derrière ») : la bande passe
   * AU-DESSUS du corps de l'écran ; le corps remonte de `CONTEXT_BAND_FADE_HEIGHT` (à l'écran
   * hôte de le faire) et sa liste défile derrière la part fondue. Les touchers de la part fondue
   * hors commandes traversent la bande (`box-none`) jusqu'aux cartes.
   */
  fadeToTransparent?: boolean;
  /**
   * PRE-9 CAT.1 (zones de contexte des Catalogues, CE-CAT-CTX-01) : marges verticales du contenu
   * (première ligne à 26 sous le haut de la bande, cibles de la deuxième ligne à 8 du bas). Absentes :
   * marges canoniques inchangées.
   */
  padding?: { readonly top: number; readonly bottom: number };
}) {
  return (
    <View
      testID="screen-context-band"
      pointerEvents={fadeToTransparent ? "box-none" : "auto"}
      style={[
        styles.contextBand,
        fadeToTransparent ? styles.contextBandTransparent : null,
        elevated || fadeToTransparent ? styles.elevated : null,
        padding === undefined ? null : { paddingTop: padding.top, paddingBottom: padding.bottom },
      ]}
    >
      {fadeToTransparent ? (
        <View
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={styles.contextBandFill}
          testID="screen-context-band-fill"
        >
          <View style={styles.contextBandSolid} />
          <View style={styles.contextBandFade} testID="screen-context-band-fade">
            {CONTEXT_BAND_FADE_LAYERS.map((layer) => (
              <View key={layer.height} style={[styles.contextBandFadeLayer, { height: layer.height, opacity: layer.opacity }]} />
            ))}
          </View>
        </View>
      ) : null}
      {children}
    </View>
  );
}

/** D-224 : part fondue de la zone de contexte (20 % inférieurs), en points. */
export const CONTEXT_BAND_FADE_HEIGHT = Math.round(dimensions.contextBand.height * 0.2);
/** Hauteur peinte d'un bloc au-dessus de la part fondue. */
const CONTEXT_BAND_SOLID_HEIGHT = dimensions.contextBand.height - CONTEXT_BAND_FADE_HEIGHT;
const CONTEXT_BAND_FADE_LAYER_COUNT = 12;
/**
 * Couches de la couleur de la bande, ancrées en haut de la part fondue : la couche `i` couvre
 * `(1 − i/n)` de cette part. Leurs opacités sont calculées pour que la couverture cumulée de la
 * marche `j` (depuis le haut) vaille `(n − j)/n` : 1 sous la partie peinte, puis vers 0 en bas.
 * Même rampe que la fiche Mouvement (PRE-8 F01, `ActivityEditorForm`), validée sur iPhone.
 */
export const CONTEXT_BAND_FADE_LAYERS = Array.from({ length: CONTEXT_BAND_FADE_LAYER_COUNT }, (_, index) => {
  const before = index / CONTEXT_BAND_FADE_LAYER_COUNT;
  const after = (index + 1) / CONTEXT_BAND_FADE_LAYER_COUNT;
  return {
    height: Number((CONTEXT_BAND_FADE_HEIGHT * (1 - before)).toFixed(4)),
    opacity: Number((1 - (1 - after) / (1 - before)).toFixed(4)),
  };
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[12],
    justifyContent: "flex-start",
    // A01 (recette PRE-8 A/B) : marge standard partagée.
    paddingHorizontal: layout.screenGutter,
  },
  // R4-02, révisé T02-S02 (D-142) : cercle visuel `38×38` — la cible
  // tactile `48×48` reste obtenue via `hitSlop` (voir `FixedHeader`),
  // jamais en agrandissant ce cercle.
  backCircle: {
    width: dimensions.backAction.visualCircle,
    height: dimensions.backAction.visualCircle,
    borderRadius: dimensions.backAction.visualCircle / 2,
    backgroundColor: colors.selectionSurface,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    // r9-a02 (recette PRE-8 A/B) : titre d'écran Medium 17.
    ...type.screenHeaderTitle,
    flex: 1,
    color: colors.textPrimary,
  },
  separator: {
    height: 1,
    backgroundColor: colors.divider,
  },
  contextBand: {
    backgroundColor: colors.selectionSurface,
    // A01 (recette PRE-8 A/B) : marge standard partagée.
    paddingHorizontal: layout.screenGutter,
    height: dimensions.contextBand.height,
    paddingTop: dimensions.contextBand.paddingTop,
    paddingBottom: dimensions.contextBand.paddingBottom,
    justifyContent: "space-between",
  },
  elevated: {
    zIndex: 1,
  },
  // Recette du 29/10/2026 : la couleur est portée par le remplissage, qui s’efface vers le bas.
  contextBandTransparent: {
    backgroundColor: "transparent",
  },
  contextBandFill: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  contextBandSolid: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: CONTEXT_BAND_SOLID_HEIGHT,
    backgroundColor: colors.selectionSurface,
  },
  contextBandFade: {
    position: "absolute",
    left: 0,
    right: 0,
    top: CONTEXT_BAND_SOLID_HEIGHT,
    height: CONTEXT_BAND_FADE_HEIGHT,
  },
  contextBandFadeLayer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    backgroundColor: colors.selectionSurface,
  },
});
