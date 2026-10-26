import { useContext, useEffect, useState, type ReactNode } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { ActivityDefinition } from "@/domain/activities";
import { hasMissingPhaseDuration } from "@/domain/activities/ExecutionParameters";
import { computeIntrinsicDuration } from "@/domain/activities/executionCalculations";
import { totalClauseAmount } from "@/domain/activities/executionPhrase";
import type { BodyZone } from "@/domain/body-zones/BodyZone";
import { ActivityDefinitionServiceContext } from "@/features/activities/ActivityDefinitionServiceContext";
import { MediaPreview, useMediaUriResolver } from "@/features/activities/MediaPreview";
import {
  formatExerciseBodyZones,
  formatExerciseRowSummary,
} from "@/features/sessions/compositionPresentation";
import { strings } from "@/shared/i18n";
import { CardTitleLine } from "@/shared/ui/CardTitleLine";
import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import { colors, fixedRadii, minTouchTarget, spacing, type } from "@/shared/ui/tokens";

/**
 * Référentiel persistant des Zones corporelles (V2-PRE-1, plan §3.1,
 * UI-07F470FC189F) — `ActivityCard` est rendue par `ActivityCatalogueList.tsx`
 * (hors périmètre d'adaptation de PRE-1, cf. plan, classification
 * `TEST_UNAFFECTED` de son test), qui ne peut donc pas lui transmettre les
 * Zones en prop : la carte s'auto-alimente via `ActivityDefinitionService`
 * (même connexion SQLite que `SessionServiceProvider`), à l'identique du
 * mécanisme déjà établi pour les Catégories (`ExerciseScreen.listCategories`).
 * Jamais `BODY_ZONES` : ce module statique n'est plus l'autorité runtime, y
 * compris en repli (revue indépendante 5928437619).
 *
 * Correction (device check Hermann, commentaire 5948936550) : un accès direct
 * à `useSQLiteContext` depuis cette carte levait TOUJOURS en production, cet
 * écran étant rendu HORS de `<SQLiteProvider>` (architecture T01-S05,
 * préservée) — dégradant silencieusement vers un référentiel VIDE. Le
 * référentiel transite désormais par `ActivityDefinitionService.listBodyZones`.
 * `useContext` brut (jamais le Hook `useActivityDefinitionService`, qui lève)
 * — exactement la même dégradation silencieuse vers un référentiel VIDE que
 * l'ancien mécanisme `useSQLiteContext`, préservant la classification
 * `TEST_UNAFFECTED` de `ActivityCatalogueList.test.tsx`/`CatalogueScreen.test.tsx`
 * (hors périmètre d'écriture, `scope_allow`), qui ne fournissent aucun
 * `ActivityDefinitionServiceProvider` : l'application réelle le monte
 * toujours à la racine, où ce référentiel se peuple donc normalement.
 */
function useBodyZonesReferential(): readonly BodyZone[] {
  const activityDefinitionService = useContext(ActivityDefinitionServiceContext);
  const [zones, setZones] = useState<readonly BodyZone[]>([]);
  useEffect(() => {
    // `typeof ... === "function"` plutôt qu'un simple test de nullité :
    // couvre aussi un service CONSTRUIT mais partiel (hors périmètre
    // d'écriture, `scope_allow` — ex. `CatalogueScreen.test.tsx`, qui double
    // ce service sans encore y ajouter `listBodyZones`), sans jamais lever.
    if (!activityDefinitionService || typeof activityDefinitionService.listBodyZones !== "function") {
      return;
    }
    let cancelled = false;
    activityDefinitionService.listBodyZones().then(
      (result) => {
        if (!cancelled) {
          setZones(result);
        }
      },
      (error: unknown) => {
        if (!cancelled) {
          console.error("Impossible de charger les Zones corporelles.", error);
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [activityDefinitionService]);
  return zones;
}

export type ActivityCardProps = {
  definition: ActivityDefinition;
  /** Ouvre l'édition de la définition — surface principale de la carte (plan §4.1). */
  onOpen?: () => void;
};

/**
 * Carte condensée d'une `ActivityDefinition` (V2-CAT-01, UI-CAT-R-002) —
 * même anatomie que `SessionCard` (bordure/rayon `standardCard`,
 * `DisclosureControl` partagé) avec une marque de couleur FIXE
 * (`colors.primary`, une `ActivityDefinition` ne porte pas de couleur
 * propre — à la différence d'une Séance). Affiche le nom dynamique, les
 * Zones corporelles, le mode et la cible, et les Séries/Pause — mêmes
 * fonctions de présentation déjà éprouvées par la carte Activité de
 * Composition (`compositionPresentation.ts`), jamais reformulées
 * localement. V2-PRE-1 (plan §3.1) : une `ActivityDefinition` ne porte plus
 * aucune récupération propre (désormais exclusive de l'occurrence,
 * `Activity.postActivityRecoverySeconds`) — aucune sous-carte Récupération
 * n'est donc plus rendue ici. `Déployer` et `Lecture` sont visibles mais
 * désactivés, sans handler fonctionnel — la même zone est réservée sur
 * toutes les cartes (plan §4.1). Aucun swipe ni action de gestion.
 *
 * Alignement DSF 07/10/2026 (`DSF / Cards / Exercice`, variante
 * `Contexte=Catalogue, État=Replié` `6214:4111`, annexe I.2 du brief) :
 * - le chevron Déployer, qui n'était qu'un contrôle désactivé sans action,
 *   est retiré : Figma ne le porte plus sur aucune carte d'Exercice ;
 * - titre Inter Semi Bold 15 (`CardTitleLine`, colonne de texte sans
 *   gouttière : 16 de chaque côté) ; PRE-3 : la durée intrinsèque y est
 *   renseignée selon `catalogueDuration` (exacte, ≈, ≥ ou absente) ;
 * - Lecture reste visible et désactivée, en bas à droite ;
 * - conteneur : fond `color/surface-subtle`, contour 0,5
 *   `color/cards/border`, rayon 8.
 * PRE-4 story 4.4 (D-264, FR-21-02, ch. 13 §4.11) : vignette du PREMIER
 * Média dans l'ordre de la galerie (couverture d'une vidéo par le générateur
 * d'affiche existant, en cache : `catalogueVideoCover.ts`), carré 64 recadré sans déformation,
 * texte à 88 du bord ; sans Média, la carte reste celle du départ (aucune
 * gouttière ni icône de nature : spec 4.4, Spec Change Log).
 */
/**
 * PRE-3 (DSF cartes-durée 07/10, phrase v1 §4) : durée INTRINSÈQUE de la
 * définition, par l'autorité Domaine — exacte sans symbole, « ≈ » si
 * estimée (Répétitions avec bip), « ≥ » si partielle (mélange de Cibles
 * numériques et à l'échec, story 2.1), absente si omise (Répétitions sans
 * bip, tout à l'échec) ou à renseigner : jamais un zéro, un tiret ou un libellé
 * de remplacement. PRE-4 : lit les paramètres typés obligatoires (AD-3).
 */
export function catalogueDuration(definition: ActivityDefinition): string | null {
  // PRE-7 (D-446, MFN-08) : un Exercice frère incomplet (durée de phase manquante) garde une
  // durée absente, comme lorsque sa Cible était forcée à `UNSET` avant D-446.
  if (hasMissingPhaseDuration(definition.executionParameters)) {
    return null;
  }
  // Story 2.1 (AC9) : même montant et même symbole que la clause de la Phrase sans arrondi (Q20).
  return totalClauseAmount(computeIntrinsicDuration(definition.executionParameters));
}

export function ActivityCard({ definition, onOpen }: ActivityCardProps) {
  const t = strings.screens.activities.card;
  const bodyZonesReferential = useBodyZonesReferential();
  const bodyZones = formatExerciseBodyZones(definition.bodyZoneIds, bodyZonesReferential);
  const summary = formatExerciseRowSummary(definition);
  const duration = catalogueDuration(definition);
  const firstMedia = definition.media?.[0];
  const resolveUri = useMediaUriResolver();

  return (
    <View style={styles.container} testID={`activity-card-${definition.id}`}>
      <View style={styles.colorBar} testID={`activity-card-color-bar-${definition.id}`} />
      {firstMedia ? (
        <CardThumbnail
          definitionId={definition.id}
          isVideo={firstMedia.asset.kind === "VIDEO"}
          uri={resolveUri(firstMedia.asset.uri)}
          onOpen={onOpen}
        />
      ) : null}
      <View style={styles.body}>
        <View style={styles.mainRow}>
          <ActivityCardMainArea onOpen={onOpen} hasThumbnail={firstMedia !== undefined}>
            <CardTitleLine title={definition.name} duration={duration} testID={`activity-card-${definition.id}`} />
            {bodyZones !== null ? (
              <Text
                style={styles.secondaryLine}
                testID={`activity-card-body-zones-${definition.id}`}
              >
                {bodyZones}
              </Text>
            ) : null}
            {/*
             * VISUAL_CORRECTION (revue indépendante 5753653735, point 1) :
             * synthèse NON tronquée — retour à la ligne, jamais
             * `numberOfLines`, qui coupait la clause Pause/mode/cible sur
             * une carte compacte.
             */}
            <Text style={styles.secondaryLine}>{summary}</Text>
          </ActivityCardMainArea>
          <View style={styles.actions} pointerEvents="box-none">
            <Pressable
              disabled
              accessibilityRole="button"
              accessibilityState={{ disabled: true }}
              accessibilityLabel={t.playAccessibilityLabel}
              style={styles.playButton}
              testID="activity-card-play"
            >
              <KodjoIcon name="action-start" opacity={0.55} testID="activity-card-play-icon" />
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

/**
 * Story 4.4 — vignette du premier Média. Décision de Claude (Q50 e) : elle fait
 * partie de la surface « Modifier l'exercice » (son toucher appelle `onOpen`,
 * comme le reste de la carte) et elle est DÉCORATIVE pour VoiceOver (masquée :
 * aucun arrêt en double du nom, la surface principale porte déjà l'action).
 * Photo illisible (`onError`), couverture vidéo absente, en échec ou en cours :
 * repli neutre (`colors.surface`), jamais un carré vide présenté comme image.
 */
function CardThumbnail({
  definitionId,
  isVideo,
  uri,
  onOpen,
}: {
  definitionId: string;
  isVideo: boolean;
  uri: string;
  onOpen?: () => void;
}) {
  // PRE-6 story 5.1b : choix photo / affiche / place réservée extrait dans `MediaPreview`, partagé
  // avec le gabarit de la carte d'occurrence de la Composition ; rendu du Catalogue inchangé.
  const content = (
    <MediaPreview
      uri={uri}
      isVideo={isVideo}
      imageStyle={styles.thumbnailImage}
      fallbackStyle={[styles.thumbnailImage, styles.thumbnailFallback]}
      imageTestID={`activity-card-thumbnail-image-${definitionId}`}
      fallbackTestID={`activity-card-thumbnail-fallback-${definitionId}`}
    />
  );
  const hidden = {
    accessible: false,
    accessibilityElementsHidden: true,
    importantForAccessibility: "no-hide-descendants" as const,
  };
  const square = (
    <View style={styles.thumbnail} testID={`activity-card-thumbnail-${definitionId}`}>
      {content}
    </View>
  );
  return onOpen ? (
    <Pressable
      onPress={onOpen}
      {...hidden}
      style={styles.thumbnailSlot}
      testID={`activity-card-thumbnail-slot-${definitionId}`}
    >
      {square}
    </Pressable>
  ) : (
    <View {...hidden} style={styles.thumbnailSlot} testID={`activity-card-thumbnail-slot-${definitionId}`}>
      {square}
    </View>
  );
}

function ActivityCardMainArea({
  onOpen,
  hasThumbnail,
  children,
}: {
  onOpen?: () => void;
  hasThumbnail: boolean;
  children: ReactNode;
}) {
  const style = hasThumbnail ? [styles.content, styles.contentAfterThumbnail] : styles.content;
  if (!onOpen) {
    return <View style={style}>{children}</View>;
  }
  return (
    <Pressable
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel={strings.screens.activities.card.openAccessibilityLabel}
      style={style}
      testID="activity-card-open"
    >
      {children}
    </Pressable>
  );
}

/** Hauteur repliée de la variante Figma (91), commune à la rangée et à la vignette. */
const CARD_MIN_HEIGHT = 91;
/** Story 4.4 : vignette carrée de 64 (ch. 13 l. 396, « Photo — cadre carré »). */
const THUMBNAIL_SIZE = 64;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: colors.surfaceSubtle,
    borderWidth: 0.5,
    borderColor: colors.cardsBorder,
    borderRadius: fixedRadii[8],
    overflow: "hidden",
  },
  // UI-CAT-R-002 : marque de couleur FIXE (`colors.primary`) — une
  // `ActivityDefinition` ne porte pas de couleur propre, à la différence
  // d'une Séance (`SessionCard.colorBar`, `session.color`). `alignSelf:
  // "stretch"` couvre toute la hauteur RÉELLE de la carte, Récupération
  // comprise (VISUAL_CORRECTION, revue indépendante 5753653735, point 1).
  colorBar: {
    alignSelf: "stretch",
    width: 4,
    backgroundColor: colors.primary,
  },
  // VISUAL_CORRECTION (revue indépendante 5753653735, point 1) : colonne
  // portant la rangée principale (nom/Zones/synthèse + actions) PUIS,
  // conditionnellement, la sous-carte Récupération — jamais un simple
  // empilement de lignes dans la seule zone pressable.
  body: {
    flex: 1,
  },
  // `minHeight` : hauteur de la variante Figma (91) ; Lecture (48, ancrée
  // en bas à droite) ne recouvre jamais la ligne de titre.
  mainRow: {
    minHeight: CARD_MIN_HEIGHT,
  },
  content: {
    paddingVertical: spacing[12],
    paddingHorizontal: spacing[16],
    gap: spacing[4],
  },
  // Story 4.4 (ch. 13 l. 396) : texte à 88 du bord = barre 4 + 8 + vignette 64 + 12.
  contentAfterThumbnail: {
    paddingLeft: spacing[12],
  },
  // Story 4.4 (ch. 13 §4.11, l. 396 ; `6354:16964`) : carré 64 à 12 du bord
  // (barre 4 + 8), centré dans la hauteur REPLIÉE (91) même quand la carte
  // grandit (texte sur deux lignes) : emplacement de hauteur fixe ancré en haut ; recadré sans déformation (`cover`). Rayon non
  // lisible dans Figma : `fixedRadii[6]`, plus petit rayon existant (E-V22).
  thumbnailSlot: {
    alignSelf: "flex-start",
    height: CARD_MIN_HEIGHT,
    justifyContent: "center",
    marginLeft: spacing[8],
  },
  thumbnail: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    borderRadius: fixedRadii[6],
    overflow: "hidden",
    backgroundColor: colors.surface,
  },
  thumbnailImage: {
    width: "100%",
    height: "100%",
  },
  // Repli neutre (chargement, photo illisible, couverture en échec), même fond que la vignette vidéo de la galerie.
  thumbnailFallback: {
    backgroundColor: colors.surface,
  },
  // Alignement DSF 07/10 : métadonnées en Inter Regular 12
  // (`type.supporting`) ; les lignes basses s'arrêtent avant Lecture.
  secondaryLine: {
    ...type.supporting,
    marginRight: minTouchTarget + spacing[2] - spacing[16],
    color: colors.textSecondary,
  },
  actions: {
    position: "absolute",
    right: spacing[2],
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
  },
  playButton: {
    minWidth: minTouchTarget,
    minHeight: minTouchTarget,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: minTouchTarget / 2,
  },
});
