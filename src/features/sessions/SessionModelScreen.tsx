import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, type ReactElement } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";

import type { SessionOrigin } from "@/domain/sessions/formats";
import { useSessionDraft } from "@/features/sessions/SessionDraftContext";
import { strings } from "@/shared/i18n";
import { FixedHeader, ScreenShell } from "@/shared/ui/ScreenShell";

/**
 * PRE-9 C.2 — « Créer » : choix du modèle et du format (CE-FMT-01, Figma `8598:29271`, lecture seule).
 *
 * Trois groupes de cartes : les deux cartes de création **Exercice** et **Séance**, non fusionnées
 * (ARB-05) ; les six Formats ; les départs rapides actifs (Renforcement, Superset, Progression,
 * À l'échec — **Gainage · Mobilité retiré**, D-25 ; Libre = carte Séance). Séance ouvre la
 * Composition vide ; Exercice mène, par la sélection d'un Mouvement du Catalogue (ARB-22a), à une
 * Séance contenant ce seul Exercice ; un Format ou un départ rapide ouvre son écran de paramètres
 * (C.3, CE-FMT-02). Le nom d'une carte n'est jamais un identifiant métier : la clé est l'origine
 * (`SessionOrigin`, FMT-02).
 */

export type SessionModelKey = Exclude<SessionOrigin, "CORE_MOBILITY">;

type Band = (props: { readonly color: string }) => ReactElement;

type SessionModel = {
  readonly key: SessionModelKey;
  readonly background: string;
  readonly band: string;
  readonly Motif: Band;
};

const t = () => strings.screens.sessionModels;

// Valeurs du nœud Figma `8598:29271` (cartes 110 × 106, rayon 20, bande de motif 46).
const CARD_HEIGHT = 106;
const CARD_RADIUS = 20;
const BAND_HEIGHT = 46;
const MOTIF_WIDTH = 110;
const COLUMNS = 3;
const SIDE_MARGIN = 16;
const COLUMN_GAP = 20;
const ROW_GAP = 12;
const GROUP_GAP = 32;
const GRID_TOP = 20;
const TITLE_COLOR = "#14171C";
const SUBTITLE_COLOR = "#5C636E";
const WHITE_85 = "rgba(255,255,255,0.85)";
const WHITE_50 = "rgba(255,255,255,0.5)";
const WHITE_35 = "rgba(255,255,255,0.35)";

const FOR_TIME_MOTIF = require("../../../assets/models/modele-for-time-motif.svg");

/** Forme absolue du motif, dans la boîte de 110 × 46 alignée à droite de la bande. */
function Shape(props: { left: number; top: number; width: number; height: number; color: string; radius?: number; dashed?: boolean }) {
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
        props.dashed === true ? styles.dashed : { backgroundColor: props.color },
      ]}
    />
  );
}

function Hatched({ left, top, height, band }: { left: number; top: number; height: number; band: string }) {
  // Repos hachuré (EMOM) : traits à 45° de la couleur de la bande.
  const lines = Array.from({ length: Math.ceil((height + 12) / 5) }, (_, index) => index);
  return (
    <View style={[styles.shape, styles.hatched, { left, top, width: 12, height, backgroundColor: WHITE_85 }]}>
      {lines.map((index) => (
        <View
          key={index}
          style={[styles.hatch, { top: index * 5 - 12, backgroundColor: band, transform: [{ rotate: "-45deg" }] }]}
        />
      ))}
    </View>
  );
}

const MODELS_CREATION: readonly SessionModel[] = [
  {
    key: "EXERCISE_CARD",
    background: "#F1F2F5",
    band: "#E3E5EB",
    Motif: () => (
      <>
        <Shape left={46} top={6} width={62} height={34} color="" radius={8} dashed />
        <Shape left={67} top={13} width={20} height={20} color={WHITE_85} />
      </>
    ),
  },
  {
    key: "SESSION_CARD",
    background: "#F1F2F5",
    band: "#E3E5EB",
    Motif: () => (
      <>
        <Shape left={46} top={6} width={62} height={34} color="" radius={8} dashed />
        {[12, 20.5, 29].map((top) => (
          <View key={top}>
            <Shape left={55.5} top={top} width={5} height={5} color={WHITE_85} radius={1.5} />
            <Shape left={64.5} top={top + 1} width={34} height={3} color="rgba(255,255,255,0.6)" radius={1.5} />
          </View>
        ))}
      </>
    ),
  },
];

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

/** Groupes de la grille, dans l'ordre de Figma (Gainage · Mobilité retiré, D-25). */
export const SESSION_MODEL_GROUPS: readonly (readonly SessionModelKey[])[] = [
  MODELS_CREATION.map((model) => model.key),
  MODELS_FORMATS.map((model) => model.key),
  MODELS_QUICK_STARTS.map((model) => model.key),
];

function ModelCard({ model, width, onPress }: { model: SessionModel; width: number; onPress: () => void }) {
  const texts = t().cards[model.key];
  const { Motif } = model;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${texts.title}, ${texts.subtitle}`}
      style={({ pressed }) => [styles.card, { width, backgroundColor: model.background }, pressed ? styles.cardPressed : null]}
      testID={`session-model-${model.key}`}
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

export function SessionModelScreen() {
  const router = useRouter();
  const { hydrateFromSession, updateDraft } = useSessionDraft();
  const { width: windowWidth } = useWindowDimensions();
  const cardWidth = Math.floor((windowWidth - 2 * SIDE_MARGIN - (COLUMNS - 1) * COLUMN_GAP) / COLUMNS);
  // CE-FMT-01 §12 : aucune double création par double appui ; réarmé au retour sur l'écran.
  const busyRef = useRef(false);
  useFocusEffect(
    useCallback(() => {
      busyRef.current = false;
    }, []),
  );
  // Nouvelle création : brouillon vierge à l'ouverture de la grille.
  useEffect(() => {
    hydrateFromSession?.(null);
  }, [hydrateFromSession]);

  const select = (key: SessionModelKey) => {
    if (busyRef.current) return;
    busyRef.current = true;
    switch (key) {
      case "SESSION_CARD":
        updateDraft({ origin: key });
        router.push({ pathname: "/composition", params: { keepDraft: "1" } });
        return;
      case "EXERCISE_CARD":
        updateDraft({ origin: key });
        router.push({ pathname: "/movement-selection", params: { single: "1", then: "composition" } });
        return;
      default:
        // D-22/D-23 : aucun Mouvement présélectionné — choix dans le Catalogue (ARB-22a), puis paramètres (C.3).
        router.push({ pathname: "/movement-selection", params: { then: "format-parameters", model: key } });
    }
  };

  const groups = [MODELS_CREATION, MODELS_FORMATS, MODELS_QUICK_STARTS];
  return (
    <ScreenShell>
      <FixedHeader title={t().title} onBack={() => router.back()} backAccessibilityLabel={t().closeAccessibilityLabel} closeIcon />
      <ScrollView contentContainerStyle={styles.content} testID="session-models">
        {groups.map((group, index) => (
          <View key={index} style={[styles.group, index > 0 ? styles.groupGap : null]} testID={`session-model-group-${index}`}>
            {group.map((model) => (
              <ModelCard key={model.key} model={model} width={cardWidth} onPress={() => select(model.key)} />
            ))}
          </View>
        ))}
      </ScrollView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: SIDE_MARGIN,
    paddingTop: GRID_TOP,
    paddingBottom: GRID_TOP,
  },
  group: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: COLUMN_GAP,
    rowGap: ROW_GAP,
  },
  groupGap: {
    marginTop: GROUP_GAP,
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
  dashed: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: "rgba(255,255,255,0.8)",
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
  title: {
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600",
    fontSize: 13,
    color: TITLE_COLOR,
    marginTop: 8,
    marginHorizontal: 10,
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontWeight: "400",
    fontSize: 11,
    lineHeight: 16,
    color: SUBTITLE_COLOR,
    marginTop: 10,
    marginHorizontal: 10,
  },
});
