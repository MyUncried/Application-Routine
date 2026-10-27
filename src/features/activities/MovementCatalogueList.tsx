import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { decodeInstructionSteps } from "@/domain/activities/instructionSteps";
import { rankMovements } from "@/domain/activities/movementSuggestion";
import { useActivityDefinitionService } from "@/features/activities/ActivityDefinitionServiceContext";
import { MediaPreview, firstMediaPreviewSource, useMediaUriResolver } from "@/features/activities/MediaPreview";
import { levelPastilleLabel } from "@/features/activities/MovementLevelMenu";
import { groupFamilies, type MovementCatalogueEntry } from "@/features/activities/MovementCatalogueService";
import { strings } from "@/shared/i18n";
import { colors, fixedRadii, minTouchTarget, spacing, type } from "@/shared/ui/tokens";

/**
 * PRE-8 (story B.3, DSF Mouvements §1 « accès minimal au catalogue et ouverture de la fiche,
 * recherche au fil du nom » ; Figma `10266:20575` pour la carte) — segment « Mouvements » du
 * Catalogue : catalogue d'ENTRETIEN des Mouvements persistants, distinct du Catalogue des Séances
 * et sans contenu lançable. Mouvements sans Exercice compris.
 *
 * - Liste : les membres d'une famille de Niveaux sont contigus, dans l'ordre de la famille ; la
 *   pastille « Niveau N » porte le rang dérivé de la famille COMPLÈTE (jamais de la vue). Un
 *   Mouvement indépendant n'a pas de pastille (Figma « Fentes avant »).
 * - Recherche au fil du nom et des alias, par le classement unique R02 (`rankMovements`), un
 *   résultat par Mouvement ; elle ne reclasse aucun rang.
 * - Toucher une carte ouvre la fiche (`/movement`, consultation puis crayon).
 *
 * Non développés ici, règles non arrêtées (DSF §1 « hors de ce lot », DSF Niveaux « restent à
 * spécifier ») : présentation en piles et leur navigation, filtres, tri, réordonnancement des
 * familles, actions glissées (partage, archivage, suppression). Aucune commande factice n'est
 * affichée pour eux.
 */

const t = strings.screens.movement.catalogue;

type LoadState =
  | { readonly status: "loading" }
  | { readonly status: "error" }
  | { readonly status: "ready"; readonly entries: readonly MovementCatalogueEntry[] };

/** Entrées du Catalogue des Mouvements, relues à chaque `reloadToken`. */
export function useMovementCatalogue(reloadToken: number): { readonly state: LoadState; readonly reload: () => void } {
  const service = useActivityDefinitionService();
  // Sans service de Mouvement : erreur dès l'état initial (aucune écriture d'état synchrone en effet).
  const [state, setState] = useState<LoadState>(() => (service.movementCatalogue ? { status: "loading" } : { status: "error" }));
  const generation = useRef(0);
  const reload = useCallback(() => {
    const catalogue = service.movementCatalogue;
    const current = ++generation.current;
    if (!catalogue) return;
    catalogue.listEntries().then(
      (entries) => {
        if (generation.current === current) setState({ status: "ready", entries });
      },
      (error: unknown) => {
        console.error("Le catalogue des mouvements n'a pas pu être chargé.", error);
        if (generation.current === current) setState({ status: "error" });
      },
    );
  }, [service]);
  useEffect(() => {
    reload();
  }, [reload, reloadToken]);
  return { state, reload };
}

/** Ordre affiché : familles contiguës (ordre de la famille), ou résultats de la recherche R02. */
export function visibleMovementEntries(entries: readonly MovementCatalogueEntry[], query: string): readonly MovementCatalogueEntry[] {
  if (query.trim().length === 0) {
    return groupFamilies(entries).flatMap((family) => family.members);
  }
  const byId = new Map(entries.map((entry) => [entry.movement.id, entry]));
  return rankMovements(
    query,
    entries.map((entry) => entry.movement),
  ).map((ranked) => byId.get(ranked.id)!);
}

export function MovementCatalogueList({
  reloadToken,
  onOpenMovement,
}: {
  readonly reloadToken: number;
  readonly onOpenMovement: (movementId: string) => void;
}) {
  const { state, reload } = useMovementCatalogue(reloadToken);
  const [query, setQuery] = useState("");
  const visible = useMemo(() => (state.status === "ready" ? visibleMovementEntries(state.entries, query) : []), [state, query]);

  return (
    <View style={styles.container} testID="movement-catalogue">
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder={t.searchPlaceholder}
        placeholderTextColor={colors.textSecondary}
        accessibilityLabel={t.searchAccessibilityLabel}
        autoCorrect={false}
        style={styles.search}
        testID="movement-catalogue-search"
      />
      {state.status === "loading" ? (
        <View style={styles.centered} testID="movement-catalogue-loading">
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : null}
      {state.status === "error" ? (
        <View style={styles.centered} testID="movement-catalogue-error">
          <Text style={styles.message}>{t.loadError}</Text>
          <Pressable onPress={reload} accessibilityRole="button" accessibilityLabel={t.retry} style={styles.retry} testID="movement-catalogue-retry">
            <Text style={styles.retryLabel}>{t.retry}</Text>
          </Pressable>
        </View>
      ) : null}
      {state.status === "ready" ? (
        <FlatList
          data={visible}
          keyExtractor={(entry) => entry.movement.id}
          renderItem={({ item }) => <MovementCatalogueCard entry={item} onPress={() => onOpenMovement(item.movement.id)} />}
          contentContainerStyle={styles.list}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <Text style={styles.message} testID="movement-catalogue-empty">
              {state.entries.length === 0 ? t.empty : t.noResult}
            </Text>
          }
          testID="movement-catalogue-list"
        />
      ) : null}
    </View>
  );
}

/** Carte d'un Mouvement (Figma « Carte — Mouvement », 80 de haut : photo 64, nom, description, Niveau). */
function MovementCatalogueCard({ entry, onPress }: { readonly entry: MovementCatalogueEntry; readonly onPress: () => void }) {
  const resolveUri = useMediaUriResolver();
  const { movement, level } = entry;
  const preview = firstMediaPreviewSource(movement.media);
  const description = decodeInstructionSteps(movement.description).join(" ");
  const levelLabel = level !== null ? levelPastilleLabel(level) : null;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={[movement.name, levelLabel].filter(Boolean).join(", ")}
      accessibilityHint={t.openAccessibilityHint}
      style={styles.card}
      testID={`movement-card-${movement.id}`}
    >
      <View style={styles.thumbnail}>
        {preview ? (
          <MediaPreview
            uri={resolveUri(preview.uri)}
            isVideo={preview.isVideo}
            imageStyle={styles.thumbnailImage}
            fallbackStyle={[styles.thumbnailImage, styles.thumbnailFallback]}
            imageTestID={`movement-card-image-${movement.id}`}
            fallbackTestID={`movement-card-fallback-${movement.id}`}
          />
        ) : (
          <View style={[styles.thumbnailImage, styles.thumbnailFallback]} testID={`movement-card-empty-${movement.id}`} />
        )}
      </View>
      <View style={styles.texts}>
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={1} testID={`movement-card-name-${movement.id}`}>
            {movement.name}
          </Text>
          {levelLabel ? (
            <Text style={styles.level} testID={`movement-card-level-${movement.id}`}>
              {levelLabel}
            </Text>
          ) : null}
        </View>
        {description.length > 0 ? (
          <Text style={styles.description} numberOfLines={2}>
            {description}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const CARD_HEIGHT = 80;
const THUMBNAIL_SIZE = 64;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  search: {
    ...type.body,
    marginHorizontal: spacing[24],
    marginTop: spacing[8],
    marginBottom: spacing[12],
    minHeight: 44,
    paddingHorizontal: spacing[16],
    borderRadius: fixedRadii[12],
    backgroundColor: colors.surface,
    color: colors.textPrimary,
  },
  list: {
    paddingHorizontal: spacing[24],
    paddingBottom: spacing[24],
    gap: spacing[10],
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing[12],
  },
  message: {
    ...type.body,
    color: colors.textSecondary,
    textAlign: "center",
    paddingVertical: spacing[24],
  },
  retry: {
    minHeight: minTouchTarget,
    justifyContent: "center",
    paddingHorizontal: spacing[16],
  },
  retryLabel: {
    ...type.button,
    color: colors.primary,
  },
  card: {
    minHeight: CARD_HEIGHT,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[12],
    padding: spacing[8],
    borderRadius: fixedRadii[12],
    borderWidth: 1,
    borderColor: colors.mediaBorder,
    backgroundColor: colors.background,
  },
  thumbnail: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    borderRadius: fixedRadii[12],
    overflow: "hidden",
  },
  thumbnailImage: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
  },
  thumbnailFallback: {
    backgroundColor: colors.surface,
  },
  texts: {
    flex: 1,
    gap: spacing[4],
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing[8],
  },
  name: {
    ...type.sectionTitle,
    flex: 1,
    color: colors.textPrimary,
  },
  level: {
    ...type.label,
    color: colors.primary,
  },
  description: {
    ...type.supporting,
    color: colors.textSecondary,
  },
});
