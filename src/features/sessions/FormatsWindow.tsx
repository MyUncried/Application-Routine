import { Image } from "expo-image";
import { createContext, useContext, useState, type ReactElement } from "react";
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";

import type { ElementFormatKey, PreconfigurationKey } from "@/domain/sessions/formats";
import { strings } from "@/shared/i18n";
import { CloseCircleAction } from "@/shared/ui/ScreenShell";

/**
 * PRE-9 C.2 — fenêtre « Formats d'entraînement » (référence Formats du 02/11/2026 §7, CE-FMT-01,
 * Figma `9977:19613`, lecture seule).
 *
 * Ouverte par « Utiliser un format d'entraînement » du menu Créer de la Composition : le menu s'efface,
 * la fenêtre s'affiche sur la Composition, sous le même voile, avec une marge à gauche et à droite.
 * Titre et croix dans la fenêtre ; la croix ou un toucher sur le voile ferment la fenêtre et ramènent à
 * la Composition, sans rien ajouter. Une seule grille de deux colonnes, sans distinction visible entre
 * Formats spécialisés et préconfigurations : Tabata, 30/30, EMOM, AMRAP, For time, Death by,
 * Renforcement, Superset, Progression, À l'échec. Aucune carte Un exercice, Une séance, Libre ni
 * Gainage · Mobilité (MENU-FMT-01 et ARB-05 remplacés). Le choix d'une carte ouvre le questionnaire du
 * modèle en plein écran (C.3). [C.2 du 01/11 : écran « Créer » à trois groupes (`8598:29271`), ouvert par
 * le Catalogue — remplacé le 02/11/2026 ; les motifs des cartes sont repris.]
 *
 * Fenêtre rendue dans un `Modal` natif transparent (primitive de l'OS, P-4).
 */

/** Modèle de la fenêtre : Format spécialisé ou préconfiguration standard (FMT-01, FMT-02). */
export type FormatModelKey = ElementFormatKey | PreconfigurationKey;

type Band = (props: { readonly color: string }) => ReactElement;

type SessionModel = {
  readonly key: FormatModelKey;
  readonly background: string;
  readonly band: string;
  readonly Motif: Band;
};

const t = () => strings.screens.sessionModels;

// Valeurs du nœud Figma `9977:19613` : fenêtre 370 × 647 (rayon 28) posée à 16 / 128 ; cartes 163 × 105
// (rayon 20), bande de motif 46, écart de 12 entre colonnes et de 10 entre rangées ; titre 17 Medium.
const WINDOW_MARGIN = 16;
const WINDOW_RADIUS = 28;
const WINDOW_PADDING = 16;
const GRID_TOP = 66;
const CARD_HEIGHT = 105;
const CARD_RADIUS = 20;
const BAND_HEIGHT = 46;
const MOTIF_WIDTH = 110;
const COLUMN_GAP = 12;
const ROW_GAP = 10;
const TITLE_COLOR = "#14171C";
const SUBTITLE_COLOR = "#5C636E";
const WINDOW_TITLE_COLOR = "#3A3A3F";
const SCRIM = "rgba(31, 33, 41, 0.42)";
const WHITE_85 = "rgba(255,255,255,0.85)";
const WHITE_50 = "rgba(255,255,255,0.5)";
const WHITE_35 = "rgba(255,255,255,0.35)";

const FOR_TIME_MOTIF = require("../../../assets/models/modele-for-time-motif.svg");

/**
 * Teinte des formes : blanc translucide sur la bande des cartes ; teinte du modèle pour l'illustration de
 * la zone de contexte des questionnaires (Figma `8624:29999` : mêmes formes, ×1,75, teinte du modèle).
 */
const MotifTintContext = createContext<string | null>(null);

function tinted(color: string, tint: string | null): string {
  if (tint === null) return color;
  const alpha = /rgba\(255,\s*255,\s*255,\s*([0-9.]+)\)/.exec(color)?.[1];
  return alpha === undefined ? color : tint.replace("ALPHA", alpha);
}

/** Forme absolue du motif, dans la boîte de 110 × 46 alignée à droite de la bande. */
function Shape(props: { left: number; top: number; width: number; height: number; color: string; radius?: number }) {
  const tint = useContext(MotifTintContext);
  return (
    <View
      style={[
        styles.shape,
        {
          left: props.left,
          top: props.top,
          width: props.width,
          height: props.height,
          borderRadius: props.radius ?? 5,
        },
        { backgroundColor: tinted(props.color, tint) },
      ]}
    />
  );
}

function Hatched({ left, top, height, band }: { left: number; top: number; height: number; band: string }) {
  // Repos hachuré (EMOM) : traits à 45° de la couleur de la bande.
  const lines = Array.from({ length: Math.ceil((height + 12) / 5) }, (_, index) => index);
  return (
    <View style={[styles.shape, styles.hatched, { left, top, width: 12, height, backgroundColor: tinted(WHITE_85, useContext(MotifTintContext)) }]}>
      {lines.map((index) => (
        <View
          key={index}
          style={[styles.hatch, { top: index * 5 - 12, backgroundColor: band, transform: [{ rotate: "-45deg" }] }]}
        />
      ))}
    </View>
  );
}

const MODELS_FORMATS: readonly SessionModel[] = [
  {
    key: "TABATA",
    background: "#FDECEC",
    band: "#FAD8D8",
    Motif: () => (
      <>
        {[61.75, 74.62, 87.49, 100.35].map((left) => (
          <Shape key={`a${left}`} left={left} top={12.87} width={10.29} height={10.29} color={WHITE_85} radius={3.2} />
        ))}
        {[61.75, 74.62, 87.49, 100.35].map((left, index) => (
          <Shape key={`b${left}`} left={left} top={27.02} width={10.29} height={10.29} color={index === 0 ? WHITE_85 : WHITE_50} radius={3.2} />
        ))}
      </>
    ),
  },
  {
    key: "INTERVALS_30_30",
    background: "#E6F5EF",
    band: "#CDEBDF",
    Motif: () => (
      <>
        {[
          [61.75, 21.87, 19.3],
          [70.76, 9.01, 32.16],
          [79.77, 27.02, 14.15],
          [88.77, 3.86, 37.31],
          [97.78, 19.3, 21.87],
          [106.78, 29.59, 11.58],
        ].map(([left, top, height]) => (
          <Shape key={left} left={left!} top={top!} width={6.43} height={height!} color="rgba(255,255,255,0.75)" radius={3.2} />
        ))}
      </>
    ),
  },
  {
    key: "EMOM",
    background: "#E8F3FB",
    band: "#D3E7F7",
    Motif: ({ color }) => (
      <>
        {[
          [48, 35, 13, 31],
          [64, 25, 23, 21],
          [80, 29, 19, 25],
          [96, 14, 34, 10],
        ].map(([left, workTop, workHeight, restHeight]) => (
          <View key={left}>
            <Shape left={left!} top={workTop!} width={12} height={workHeight!} color={WHITE_85} />
            <Hatched left={left!} top={4} height={restHeight!} band={color} />
          </View>
        ))}
      </>
    ),
  },
  {
    key: "AMRAP",
    background: "#E6EBFB",
    band: "#D0DAF7",
    Motif: () => (
      <>
        {[47, 61, 75, 89].map((left) => (
          <Shape key={left} left={left} top={12} width={10} height={36} color={WHITE_85} />
        ))}
        <Shape left={103} top={12} width={5} height={36} color={WHITE_35} />
      </>
    ),
  },
  {
    key: "FOR_TIME",
    background: "#EEF7E8",
    band: "#D9EFCC",
    Motif: () => <Image source={FOR_TIME_MOTIF} style={styles.motifImage} accessible={false} />,
  },
  {
    key: "DEATH_BY",
    background: "#FAEAF3",
    band: "#F2CFE4",
    Motif: () => (
      <>
        <Shape left={56} top={34} width={10} height={14} color={WHITE_85} />
        <Shape left={70} top={24} width={10} height={24} color={WHITE_85} />
        <Shape left={84} top={14} width={10} height={34} color={WHITE_85} />
        <Shape left={98} top={18} width={10} height={30} color={WHITE_85} />
        <Shape left={98} top={4} width={10} height={14} color={WHITE_35} />
      </>
    ),
  },
];

const MODELS_QUICK_STARTS: readonly SessionModel[] = [
  {
    key: "STRENGTH",
    background: "#F3E9FA",
    band: "#E7D4F5",
    Motif: () => (
      <>
        {[36, 62, 88].flatMap((left) =>
          [40, 32, 24, 16, 8].map((top) => <Shape key={`${left}-${top}`} left={left} top={top} width={20} height={6} color={WHITE_85} />),
        )}
      </>
    ),
  },
  {
    key: "SUPERSET",
    background: "#E3F4F6",
    band: "#C9E9ED",
    Motif: () => (
      <>
        <Shape left={42.46} top={10.29} width={28.3} height={30.88} color="rgba(255,255,255,0.9)" radius={9} />
        <Shape left={70.76} top={10.29} width={28.3} height={30.88} color={WHITE_50} radius={9} />
      </>
    ),
  },
  {
    key: "PROGRESSION",
    background: "#FBF3E4",
    band: "#F6E6C8",
    Motif: () => (
      <>
        {[
          [56, 36, 12],
          [67, 28, 20],
          [78, 20, 28],
          [89, 12, 36],
          [100, 4, 44],
        ].map(([left, top, height]) => (
          <Shape key={left} left={left!} top={top!} width={8} height={height!} color={WHITE_85} />
        ))}
      </>
    ),
  },
  {
    key: "UNTIL_FAILURE",
    background: "#FDEFE6",
    band: "#F9DCC8",
    Motif: () => (
      <>
        {[
          [62, 11, 37],
          [79, 21, 27],
          [96, 28, 20],
        ].map(([left, top, height]) => (
          <View key={left}>
            <Shape left={left!} top={top!} width={12} height={height!} color={WHITE_85} />
            <Shape left={left!} top={top! - 7} width={12} height={7} color={WHITE_35} />
          </View>
        ))}
      </>
    ),
  },
];


/** Teinte des formes de l'illustration (gabarit `rgba(r, g, b, ALPHA)`), par modèle. */
const ILLUSTRATION_TINTS: Readonly<Record<FormatModelKey, string>> = {
  TABATA: "rgba(243, 195, 195, ALPHA)",
  INTERVALS_30_30: "rgba(170, 214, 196, ALPHA)",
  EMOM: "rgba(176, 208, 236, ALPHA)",
  AMRAP: "rgba(178, 192, 238, ALPHA)",
  FOR_TIME: "rgba(186, 222, 166, ALPHA)",
  DEATH_BY: "rgba(232, 172, 206, ALPHA)",
  STRENGTH: "rgba(212, 184, 236, ALPHA)",
  SUPERSET: "rgba(160, 212, 220, ALPHA)",
  PROGRESSION: "rgba(236, 210, 160, ALPHA)",
  UNTIL_FAILURE: "rgba(240, 190, 160, ALPHA)",
};

/** Couleurs du modèle : fond de carte (zone de contexte), bande, nuances des mouvements du Déroulé. */
export function formatModelColors(key: FormatModelKey): { readonly background: string; readonly band: string } {
  const model = [...MODELS_FORMATS, ...MODELS_QUICK_STARTS].find((item) => item.key === key)!;
  return { background: model.background, band: model.band };
}

/** Illustration de la zone de contexte : motif de la carte agrandi (×1,75), teinte du modèle, opacité 0,55. */
export function FormatModelIllustration({ model: key }: { readonly model: FormatModelKey }) {
  const model = [...MODELS_FORMATS, ...MODELS_QUICK_STARTS].find((item) => item.key === key)!;
  const { Motif } = model;
  return (
    <View style={styles.illustration} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={styles.illustrationScale}>
        <MotifTintContext.Provider value={ILLUSTRATION_TINTS[key]}>
          <Motif color={model.background} />
        </MotifTintContext.Provider>
      </View>
    </View>
  );
}

/** Cartes de la fenêtre, dans l'ordre de Figma (deux colonnes, lecture par rangée). */
export const FORMAT_MODEL_ORDER: readonly FormatModelKey[] = [...MODELS_FORMATS, ...MODELS_QUICK_STARTS].map((model) => model.key);

function ModelCard({ model, width, onPress }: { model: SessionModel; width: number; onPress: () => void }) {
  const texts = t().cards[model.key];
  const { Motif } = model;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${texts.title}, ${texts.subtitle}`}
      style={({ pressed }) => [styles.card, { width, backgroundColor: model.background }, pressed ? styles.cardPressed : null]}
      testID={`format-model-${model.key}`}
    >
      <View style={[styles.band, { backgroundColor: model.band }]}>
        <View style={styles.motif}>
          <Motif color={model.band} />
        </View>
      </View>
      <Text style={styles.title} numberOfLines={1}>
        {texts.title}
      </Text>
      <Text style={styles.subtitle} numberOfLines={1}>
        {texts.subtitle}
      </Text>
    </Pressable>
  );
}

export function FormatsWindow({
  onClose,
  onSelect,
}: {
  readonly onClose: () => void;
  readonly onSelect: (key: FormatModelKey) => void;
}) {
  // ESSAI du 04/11/2026 (Hermann : « On garde cette modale native pour les questionnaires, les récapitulatifs, les fiches
  // de mouvement. Applique-la aussi à la modale du format d'entraînement que je voie ce que cela fait de bout en bout ») :
  // la fenêtre est une feuille native iOS (route `formats-window`), pleine largeur, ajustée à son contenu ; le
  // questionnaire s'ouvre par-dessus, comme iOS empile ses feuilles. [Fenêtre centrée dans un `Modal` transparent,
  // voile conservé puis voile relais — remplacés par l'essai.]
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = Math.floor((screenWidth - 2 * WINDOW_PADDING - COLUMN_GAP) / 2);
  const [chosen, setChosen] = useState(false);
  return (
    <View style={styles.sheetWindow} accessibilityViewIsModal testID="formats-window">
      <View style={styles.header}>
        <CloseCircleAction onPress={onClose} accessibilityLabel={t().closeAccessibilityLabel} style={styles.close} testID="formats-window-close" />
        <Text style={styles.windowTitle} accessibilityRole="header">
          {t().title}
        </Text>
      </View>
      <View style={styles.grid} testID="formats-window-grid">
        {[...MODELS_FORMATS, ...MODELS_QUICK_STARTS].map((model) => (
          <ModelCard
            key={model.key}
            model={model}
            width={cardWidth}
            onPress={() => {
              // Un seul questionnaire par toucher (double toucher pendant la présentation).
              if (chosen) return;
              setChosen(true);
              onSelect(model.key);
              setTimeout(() => setChosen(false), 600);
            }}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  scrim: {
    backgroundColor: SCRIM,
  },
  sheetWindow: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: WINDOW_PADDING,
    paddingBottom: 34,
  },
  window: {
    backgroundColor: "#FFFFFF",
    borderRadius: WINDOW_RADIUS,
    paddingHorizontal: WINDOW_PADDING,
    paddingBottom: WINDOW_PADDING,
    shadowColor: "#000000",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  header: {
    height: GRID_TOP,
    flexDirection: "row",
    alignItems: "center",
  },
  // Recette n° 3 (f3-fenetre) : action Fermer standard (cercle 38, cible 48 par hitSlop).
  close: {
    marginTop: -6,
  },
  windowTitle: {
    fontFamily: "Inter_500Medium",
    fontWeight: "500",
    fontSize: 17,
    color: WINDOW_TITLE_COLOR,
    marginLeft: 7,
    marginTop: -6,
    flexShrink: 1,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: COLUMN_GAP,
    rowGap: ROW_GAP,
  },
  card: {
    minHeight: CARD_HEIGHT,
    borderRadius: CARD_RADIUS,
    overflow: "hidden",
    paddingBottom: 10,
  },
  cardPressed: {
    opacity: 0.7,
  },
  band: {
    height: BAND_HEIGHT,
    overflow: "hidden",
  },
  motif: {
    position: "absolute",
    top: 0,
    right: 0,
    width: MOTIF_WIDTH,
    height: BAND_HEIGHT,
  },
  motifImage: {
    width: MOTIF_WIDTH,
    height: BAND_HEIGHT,
  },
  shape: {
    position: "absolute",
  },
  // Figma `8624:29999` : illustration 192 × 90 posée à droite (x 199 de 402, y 11), opacité 0,55.
  illustration: {
    position: "absolute",
    right: 11,
    top: 11,
    width: 192,
    height: 90,
    opacity: 0.55,
    overflow: "hidden",
  },
  illustrationScale: {
    position: "absolute",
    right: 0,
    top: 0,
    width: MOTIF_WIDTH,
    height: BAND_HEIGHT,
    transform: [{ translateX: -MOTIF_WIDTH * 0.375 + 0 }, { translateY: BAND_HEIGHT * 0.375 }, { scale: 1.75 }],
  },
  hatched: {
    overflow: "hidden",
    borderRadius: 2,
  },
  hatch: {
    position: "absolute",
    left: -10,
    width: 32,
    height: 1.5,
  },
  // Titre à 50, sous-titre à 70 (ligne de 16), marge gauche de 16.
  title: {
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
    fontSize: 13,
    color: TITLE_COLOR,
    marginTop: 4,
    marginHorizontal: 16,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontWeight: "400",
    fontSize: 11,
    lineHeight: 16,
    color: SUBTITLE_COLOR,
    marginTop: 4,
    marginHorizontal: 16,
  },
});
