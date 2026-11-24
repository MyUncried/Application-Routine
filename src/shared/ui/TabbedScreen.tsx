import type { ReactNode } from "react";
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from "react-native";

import { CatalogueNavigation, type CatalogueNavigationOption } from "@/features/sessions/CatalogueNavigation";
import { CONTEXT_LINE_SELECTED, CONTEXT_SEPARATOR, CONTEXT_SEPARATOR_GAP, CONTEXT_TEXT_COLOR, CONTEXT_ZONE_GEOMETRY } from "@/shared/ui/catalogueContext";
import { colors, minTouchTarget, spacing, type } from "@/shared/ui/tokens";
import { CatalogueContextZone } from "@/shared/ui/CatalogueContextZone";
import type { FloatingCreateVariant } from "@/shared/ui/FloatingCreateButton";
import { FloatingCreateSlot } from "@/shared/ui/FloatingCreateHost";
import { ContextBand, FixedHeader, ScreenShell } from "@/shared/ui/ScreenShell";

/**
 * Haut d'écran à onglets (« EcranAOnglets », demande de Hermann du 19/11/2026 : « Crée ce composant partagé pour le haut
 * d'écran […] ET APPLIQUE LE PARTOUT OÙ IL DOIT ÊTRE UTILISÉ » ; choix B : Catalogues compris). Un seul assemblage pour
 * tous les écrans à barre de titre à onglets (DSF Barre de titre à onglets du 19/11/2026, D-532) : Catalogues
 * (Mouvements · Séances · Programmes), Calendrier (Journal · Agenda ; D-542 : « Vue d'ensemble » retirée le 20/11/2026), Profil (Profil · Préférences ·
 * Communauté).
 *
 * Assemblage repris à l'identique du Catalogue validé (`CatalogueScreen`) — aucune valeur nouvelle :
 * - `ScreenShell` + `FixedHeader` dont le contenu est la navigation `CatalogueNavigation` sur toute la largeur et toute la
 *   hauteur de l'en-tête (D-502) ; l'onglet sélectionné prend la couleur de la zone ;
 * - zone de contexte `ContextBand` (402 × 115, fondu vers la transparence sur les 20 % inférieurs, D-224) de la couleur de
 *   la palette, marges verticales `CONTEXT_ZONE_GEOMETRY` (CE-CAT-CTX-01) ;
 * - contenu standard `CatalogueContextZone` : ligne 1 compteurs (et « N résultats »), ligne 2 Rechercher, Filtre, Tri,
 *   bouton d'action (`CommandCircle`).
 *
 * Seuls changent d'un écran à l'autre : le titre, les onglets, la palette et le contenu de la zone. Une zone dont le
 * contenu n'est pas celui d'un catalogue (Agenda : navigation de période ; Modifier le profil : identité) passe par
 * `kind: "custom"`, toujours dans la même bande. Sans zone (Préférences) : la bande courte sous les onglets.
 */
export type TabbedScreenPalette = {
  /** Zone de contexte et onglet sélectionné. */
  readonly context: string;
  /** Fond de l'écran ; il couvre aussi la barre d'état et l'en-tête (D-501). Absent : fond par défaut. */
  readonly background?: string;
  /** En-tête et barre d'état, quand ils diffèrent du fond de l'écran (Calendrier : `#F7F7FF` sur fond blanc). */
  readonly header?: string;
};

export type TabbedScreenTabs<T extends string> = {
  readonly options: readonly CatalogueNavigationOption<T>[];
  readonly value: T;
  readonly onChange: (value: T) => void;
  readonly testID: string;
  /** D-542 : emplacements de cette part de la largeur, centrés (Calendrier à deux onglets). Absent : Catalogues, inchangé. */
  readonly slotFraction?: number;
};

/**
 * UI-FAB-01 (D-558, D-559) : bouton flottant « Créer » de l'écran, en bas à droite au-dessus de la barre de navigation.
 * [Bouton d'action de la ligne 2 (`TabbedScreenAction` : Créer des catalogues, Planifier du calendrier, cercle standard) —
 * remplacé le 24/11/2026 : la création quitte la zone de contexte.]
 */
export type TabbedScreenFloatingCreate = {
  readonly variant: FloatingCreateVariant;
  /** Nom VoiceOver propre à l'écran (« Créer un mouvement »…). */
  readonly label: string;
  readonly onPress: () => void;
};

export type TabbedScreenContext =
  | {
      readonly kind: "catalogue";
      /**
       * Ligne 1 : compteurs propres à l'écran — soit un élément du Catalogue (bascules), soit des compteurs en lecture
       * (`counters`), rendus au format des compteurs des Catalogues (`ContextCounters`).
       */
      readonly summary: ReactNode | { readonly counters: readonly ContextCounter[] };
      readonly results: string | null;
      readonly search: Parameters<typeof CatalogueContextZone>[0]["search"];
      readonly filter: ReactNode;
      readonly sortLabel: string;
      readonly summaryAccessory?: ReactNode;
      readonly onCommandRowLayout?: (event: LayoutChangeEvent) => void;
    }
  | {
      readonly kind: "custom";
      readonly content: ReactNode;
      /**
       * `catalogue` (défaut) : marges verticales des Catalogues (`CONTEXT_ZONE_GEOMETRY`). `centered` : contenu centré
       * verticalement dans la bande (DSF Agenda § 2 : « Trois lignes centrées verticalement »).
       */
      readonly layout?: "catalogue" | "centered";
    };

export function TabbedScreen<T extends string>({
  title,
  tabs,
  palette,
  context,
  floatingCreate,
  children,
}: {
  readonly title: string;
  readonly tabs: TabbedScreenTabs<T>;
  readonly palette: TabbedScreenPalette;
  /** Absent : pas de zone de contexte, bande courte sous les onglets (Préférences). */
  readonly context?: TabbedScreenContext;
  /** Absent : pas de bouton flottant (Plan, Profil). */
  readonly floatingCreate?: TabbedScreenFloatingCreate;
  /** Corps de l'écran, sous la zone de contexte. */
  readonly children?: ReactNode;
}) {
  const centered = context?.kind === "custom" && context.layout === "centered";
  return (
    <ScreenShell {...(palette.background !== undefined ? { backgroundColor: palette.background } : {})}>
      <FixedHeader
        title={title}
        {...(palette.header !== undefined ? { layoutStyle: { backgroundColor: palette.header } } : {})}
        content={
          <View style={styles.headerNavigation}>
            <CatalogueNavigation<T>
              options={tabs.options}
              value={tabs.value}
              onChange={tabs.onChange}
              selectedColor={palette.context}
              {...(tabs.slotFraction !== undefined ? { slotFraction: tabs.slotFraction } : {})}
              testID={tabs.testID}
            />
          </View>
        }
      />
      {context === undefined ? (
        <TabBand color={palette.context} background={palette.background} />
      ) : (
        <ContextBand
          fadeToTransparent
          color={palette.context}
          padding={centered ? { top: 0, bottom: 0 } : { top: CONTEXT_ZONE_GEOMETRY.paddingTop, bottom: CONTEXT_ZONE_GEOMETRY.paddingBottom }}
        >
          {context.kind === "catalogue" ? (
            <CatalogueContextZone
              summary={isCounters(context.summary) ? <ContextCounters counters={context.summary.counters} /> : context.summary}
              results={context.results}
              search={context.search}
              filter={context.filter}
              sortLabel={context.sortLabel}
              // UI-FAB-01 : sans bouton Créer ni Planifier, le champ Rechercher s'élargit (Catalogue des Mouvements, Journal).
              widenSearch
              {...(context.summaryAccessory !== undefined ? { summaryAccessory: context.summaryAccessory } : {})}
              {...(context.onCommandRowLayout !== undefined ? { onCommandRowLayout: context.onCommandRowLayout } : {})}
            />
          ) : centered ? (
            <View pointerEvents="box-none" style={styles.centered} testID="tabbed-screen-centered-context">
              {context.content}
            </View>
          ) : (
            context.content
          )}
        </ContextBand>
      )}
      {children}
      {/* D-594 : bouton confié à l'hôte des onglets (devant la barre de navigation) ; sans hôte, rendu sur place. */}
      {floatingCreate !== undefined ? <FloatingCreateSlot config={floatingCreate} /> : null}
    </ScreenShell>
  );
}

/**
 * `onPress` (recette du 21/11/2026, Journal, Hermann : « Cliquer sur Actives ou Terminées doit filtrer la liste ») : le
 * libellé devient une commande, au format de la bascule des Catalogues (`SessionViewToggle`) — inactif gris Regular, actif
 * (`selected`) bleu Kodjo Semi Bold ; le nombre reste un texte informatif hors de la cible. Absent : compteur en lecture.
 */
export type ContextCounter = {
  readonly label: string;
  readonly value: string;
  readonly testID: string;
  readonly onPress?: () => void;
  readonly selected?: boolean;
  readonly accessibilityHint?: string;
};

/** Cible de 44 de haut, comme la bascule des Catalogues (libellé de 17). */
const COUNTER_SLOP = Math.max(0, (minTouchTarget - 17) / 2);

function isCounters(summary: ReactNode | { readonly counters: readonly ContextCounter[] }): summary is { readonly counters: readonly ContextCounter[] } {
  return typeof summary === "object" && summary !== null && "counters" in summary;
}

/**
 * Compteurs en lecture de la ligne 1 (« Actives N · Terminées N »), au format exact des compteurs des Catalogues
 * (`SessionViewToggle`, D-503) : libellé gris, nombre `#333333` à 6 du libellé, « · » `#333333` à 8 de part et d'autre.
 */
export function ContextCounters({ counters }: { readonly counters: readonly ContextCounter[] }) {
  return (
    <View style={styles.counters} testID="context-counters">
      {counters.map((counter, index) => (
        <View key={counter.testID} style={styles.counterGroup}>
          {index > 0 ? <Text style={styles.counterSeparator}>{CONTEXT_SEPARATOR}</Text> : null}
          {counter.onPress !== undefined ? (
            <Pressable
              onPress={counter.onPress}
              accessibilityRole="button"
              accessibilityLabel={counter.label}
              accessibilityState={{ selected: counter.selected === true }}
              {...(counter.accessibilityHint !== undefined ? { accessibilityHint: counter.accessibilityHint } : {})}
              hitSlop={{ top: COUNTER_SLOP, bottom: COUNTER_SLOP }}
              testID={`${counter.testID}-toggle`}
            >
              <Text style={[styles.counterLabel, counter.selected === true ? styles.counterLabelSelected : null]} numberOfLines={1}>
                {counter.label}
              </Text>
            </Pressable>
          ) : (
            <Text style={styles.counterLabel} numberOfLines={1}>
              {counter.label}
            </Text>
          )}
          <Text style={styles.counterValue} testID={counter.testID}>
            {counter.value}
          </Text>
        </View>
      ))}
    </View>
  );
}

/**
 * Bande courte sous les onglets, sans contenu (Préférences, recette du 11/11/2026) : 14 de haut, couleur de l'onglet sur 11
 * puis trois couches vers le fond de l'écran. Reprise à l'identique de `ProfileScreen`.
 */
const TAB_BAND = { height: 14, solid: 11 } as const;
const TAB_BAND_FADE = [0.25, 0.5, 0.75] as const;

function TabBand({ color, background }: { readonly color: string; readonly background: string | undefined }) {
  return (
    <View style={[styles.tabBand, { backgroundColor: color }]} pointerEvents="none" accessible={false} testID="profile-tab-band">
      {background !== undefined
        ? TAB_BAND_FADE.map((opacity, index) => (
            <View key={opacity} style={[styles.tabBandFade, { top: TAB_BAND.solid + index, backgroundColor: background, opacity }]} />
          ))
        : null}
    </View>
  );
}

const styles = StyleSheet.create({
  // D-502 : la navigation occupe toute la largeur et toute la hauteur de l'en-tête ; les onglets reposent sur son bord bas.
  headerNavigation: {
    flex: 1,
    alignSelf: "stretch",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
  },
  // Mêmes styles que les compteurs du Catalogue des séances (`SessionViewToggle`).
  counters: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start" },
  counterGroup: { flexDirection: "row", alignItems: "center" },
  counterSeparator: { ...type.contextLine, color: CONTEXT_TEXT_COLOR, marginHorizontal: CONTEXT_SEPARATOR_GAP },
  counterLabel: { ...type.contextLine, color: colors.textSecondary },
  counterLabelSelected: { ...CONTEXT_LINE_SELECTED, color: colors.primary },
  counterValue: { ...type.contextLine, color: CONTEXT_TEXT_COLOR, marginLeft: spacing[6] },
  tabBand: {
    height: TAB_BAND.height,
    overflow: "hidden",
  },
  tabBandFade: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
  },
});
