import { Button as SwiftUIButton, ContextMenu, Host, RNHostView, Section } from "@expo/ui/swift-ui";
import { contentShape, shapes } from "@expo/ui/swift-ui/modifiers";
import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from "expo-glass-effect";
import { Image } from "expo-image";
import { useEffect, useRef, useState, type ReactElement } from "react";
import {
  AccessibilityInfo,
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import type { DraftMediaItem } from "@/domain/media/ActivityMedia";
import type { ImportItem } from "@/domain/media/ActivityMediaImportService";
import { PhotoConsultation, VideoConsultation } from "@/features/activities/MediaConsultation";
import { generateVideoPoster, type VideoPosterHandle } from "@/infrastructure/media/VideoPoster";
import { strings } from "@/shared/i18n";
import { KodjoIcon } from "@/shared/ui/KodjoIcon";
import { colors, fixedRadii, minTouchTarget, spacing, type } from "@/shared/ui/tokens";

/**
 * PRE-3 (D-333/D-334/D-335, P3-23) — médias ORDONNÉS de l'Exercice dans
 * l'éditeur : aperçus de la galerie (`Media / Gallery`), tuile d'ajout
 * depuis la photothèque, éléments en cours d'importation ou en erreur
 * locale avec Réessayer, et commandes accessibles Retirer / Monter /
 * Descendre (alternative au glisser). Composant contrôlé : l'ordre de
 * `media` est celui du brouillon parent ; aucune écriture SQLite ici.
 */
export type MediaNotice = "PERMISSION_DENIED" | "PERMISSION_DENIED_FINAL" | "LIMITED" | "ERROR" | null;

export type ActivityMediaListProps = {
  readonly media: readonly DraftMediaItem[];
  /** Imports en cours ou en échec — affichés après les médias prêts, dans l'ordre de sélection. */
  readonly pending: readonly ImportItem[];
  readonly notice: MediaNotice;
  readonly canImport: boolean;
  readonly resolveUri: (uri: string) => string;
  readonly onAdd: () => void;
  readonly onRemove: (index: number) => void;
  readonly onMove: (from: number, to: number) => void;
  readonly onRetry: (item: ImportItem) => void;
  /**
   * PRE-7 story A2.2 (D-437, MFN-09, MFN/AC28) : `false` pour un contenu de geste verrouillé —
   * consultation conservée (toucher), mais ni ajout, ni menu Retirer / Monter / Descendre, ni
   * actions d'accessibilité équivalentes. Défaut `true` (rendu antérieur inchangé).
   */
  readonly editable?: boolean;
  /**
   * Story 4.5 (AD-17) : menu de l'appui long sur iOS. Par défaut
   * `IOS_LONG_PRESS_MENU` ; prop réservée aux tests du repli.
   */
  readonly iosLongPressMenu?: IosLongPressMenu;
  /**
   * PRE-8 (B.2, CE-MVT-01 §7 et §9, « DSF / Médias / Gabarit photo » `10450:24378`) : la liste
   * adopte l'emplacement et les dimensions du gabarit photo de la fiche Mouvement — une page
   * pleine largeur par média, tuile d'ajout comprise, défilement par page. Présentation SEULE :
   * ajout, consultation, retrait et réordonnancement (appui long, actions VoiceOver) inchangés.
   * Absent : galerie de l'éditeur d'Exercice, inchangée.
   */
  readonly template?: { readonly width: number; readonly height: number };
};

/** Taille imposée des tuiles en gabarit photo (PRE-8, B.2), sinon `null`. */
type TileSize = { readonly width: number; readonly height: number } | null;

/**
 * Story 4.5 (AD-17, AC9) — menu ouvert par l'appui long sur iOS :
 * `"contextMenu"` = menu contextuel natif `ContextMenu` d'`@expo/ui`
 * (voie retenue, à valider sur iPhone par R-4.5-00) ; `"actionSheet"` = REPLI
 * d'AD-17 si l'essai échoue : la feuille d'actions native existante
 * (`ActionSheetIOS`), ouverte par `onLongPress`. Le repli s'active en
 * changeant cette seule constante ; le toucher (consultation), les options,
 * leurs effets et les actions VoiceOver sont identiques dans les deux voies.
 */
export type IosLongPressMenu = "contextMenu" | "actionSheet";
export const IOS_LONG_PRESS_MENU: IosLongPressMenu = "contextMenu";

const m = strings.executionParameters.media;

function itemLabel(kind: DraftMediaItem["asset"]["kind"], rank: number, total: number): string {
  return m.item
    .replace("{type}", kind === "VIDEO" ? m.video : m.photo)
    .replace("{rank}", String(rank))
    .replace("{total}", String(total));
}

export function ActivityMediaList({
  media,
  pending,
  notice,
  canImport,
  resolveUri,
  onAdd,
  onRemove,
  onMove,
  onRetry,
  editable = true,
  iosLongPressMenu = IOS_LONG_PRESS_MENU,
  template,
}: ActivityMediaListProps) {
  const total = media.length;
  const size: TileSize = template ?? null;
  const sized = size ? [size, styles.templatePreview] : null;
  const visiblePending = pending.filter((item) => item.state !== "READY");
  return (
    <View style={styles.container} testID="media-list">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={size ? null : styles.gallery}
        style={size ? styles.templateFrame : styles.galleryFrame}
        pagingEnabled={size !== null}
        accessibilityLabel={m.section}
        testID="media-gallery"
      >
        {media.map((item, index) => {
          const label = itemLabel(item.asset.kind, index + 1, total);
          return (
            <MediaTile
              key={item.assetId}
              item={item}
              index={index}
              total={total}
              label={label}
              uri={resolveUri(item.asset.uri)}
              onRemove={() => onRemove(index)}
              onMove={(to) => onMove(index, to)}
              editable={editable}
              iosLongPressMenu={iosLongPressMenu}
              size={size}
            />
          );
        })}

        {visiblePending.map((item, index) => {
          const label = itemLabel(item.picked.kind, total + index + 1, total + visiblePending.length);
          return (
            <View key={item.key} style={[styles.tile, size]} testID={`media-pending-${index + 1}`}>
              <View style={[styles.preview, styles.previewPending, sized]} accessible accessibilityLabel={label}>
                {item.state === "IMPORTING" ? (
                  <>
                    <ActivityIndicator color={colors.primary} />
                    <Text style={styles.pendingText} accessibilityLiveRegion="polite">
                      {m.importing}
                    </Text>
                  </>
                ) : item.state === "FAILED" ? (
                  <>
                    <Text style={styles.errorText} accessibilityLiveRegion="polite" testID={`media-pending-${index + 1}-error`}>
                      {m.errors[item.error]}
                    </Text>
                    <Pressable
                      onPress={() => onRetry(item)}
                      accessibilityRole="button"
                      accessibilityLabel={m.retryAccessibilityLabel.replace("{item}", label)}
                      style={styles.retryAction}
                      testID={`media-pending-${index + 1}-retry`}
                    >
                      <Text style={styles.retryLabel}>{m.retry}</Text>
                    </Pressable>
                  </>
                ) : null}
              </View>
            </View>
          );
        })}

        {canImport && editable ? (
          <Pressable
            onPress={onAdd}
            accessibilityRole="button"
            accessibilityLabel={m.add}
            style={[styles.preview, styles.addTile, sized]}
            testID="media-add"
          >
            <KodjoIcon name="action-add" tintColor={colors.textSecondary} />
          </Pressable>
        ) : null}
      </ScrollView>

      {notice ? (
        <View style={styles.notice} accessibilityLiveRegion="polite" testID="media-notice">
          <Text style={styles.noticeText}>
            {notice === "LIMITED"
              ? m.limitedAccess
              : notice === "ERROR"
                ? m.errors.ERROR
                : m.permissionDenied}
          </Text>
          {notice === "PERMISSION_DENIED_FINAL" || notice === "LIMITED" ? (
            <Pressable
              onPress={() => {
                Linking.openSettings().catch(() => undefined);
              }}
              accessibilityRole="button"
              accessibilityLabel={m.openSettings}
              hitSlop={OPEN_SETTINGS_HIT_SLOP}
              testID="media-open-settings"
            >
              <Text style={styles.retryLabel}>{m.openSettings}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

/**
 * Aperçu d'un média (D-335 amendée par Q31, story 4.5, AD-17). Le TOUCHER de
 * la tuile consulte le Média (vidéo lue en plein écran natif, photo en plein
 * écran : `MediaConsultation.tsx`) ; l'APPUI LONG ouvre le menu Retirer /
 * Monter / Descendre, bornes exclues : menu contextuel natif sur iOS
 * (`NativeTileContextMenu`, ou repli `IOS_LONG_PRESS_MENU`), alerte ailleurs.
 * VoiceOver : l'activation consulte, l'indication annonce la consultation
 * puis l'appui long, et les actions nommées Retirer / Monter / Descendre pour
 * CE média restent l'alternative à l'appui long (FR-22-09). Aucun bouton
 * supplémentaire n'est dessiné sur la galerie ; la tuile entière est la cible.
 * Média illisible ou introuvable (FR-21-58) : erreur locale dans la tuile,
 * lien conservé ; un nouveau toucher réessaie.
 */
function MediaTile({
  item,
  index,
  total,
  label,
  uri,
  onRemove,
  onMove,
  editable,
  iosLongPressMenu,
  size,
}: {
  item: DraftMediaItem;
  index: number;
  total: number;
  label: string;
  uri: string;
  onRemove: () => void;
  onMove: (to: number) => void;
  editable: boolean;
  iosLongPressMenu: IosLongPressMenu;
  size: TileSize;
}) {
  const [consulting, setConsulting] = useState(false);
  // Photo : la présentation reste montée, masquée, jusqu'à son retrait complet (iOS : `onDismiss`).
  const [photoVisible, setPhotoVisible] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const errorToAnnounce = useRef(false);
  const tileRef = useRef<View>(null);
  const isVideo = item.asset.kind === "VIDEO";
  const isIOS = Platform.OS === "ios";
  // Voie du menu calculée au rendu et réutilisée telle quelle par les rappels (jamais relue à l'appui).
  // PRE-7 story A2.2 : contenu verrouillé — ni menu natif, ni appui long, ni actions.
  const nativeContextMenu = editable && isIOS && iosLongPressMenu === "contextMenu";
  function consult() {
    setUnavailable(false);
    errorToAnnounce.current = false;
    setConsulting(true);
    if (!isVideo) setPhotoVisible(true);
  }
  /**
   * Fin de consultation, plein écran retiré : focus VoiceOver rendu à la tuile
   * (H13), puis, s'il y a lieu, l'erreur annoncée en file, après ce retour,
   * pour qu'iOS ne la perde pas pendant la fermeture.
   */
  function finishConsultation() {
    setConsulting(false);
    if (tileRef.current) AccessibilityInfo.sendAccessibilityEvent(tileRef.current, "focus");
    if (errorToAnnounce.current) {
      errorToAnnounce.current = false;
      AccessibilityInfo.announceForAccessibilityWithOptions(m.unavailable, { queue: true });
    }
  }
  function closeVideo() {
    setUnavailable(false);
    finishConsultation();
  }
  /** Vidéo : appelé une fois le plein écran quitté (`MediaConsultation.tsx`). */
  function failVideo() {
    setUnavailable(true);
    errorToAnnounce.current = true;
    finishConsultation();
  }
  /** Photo : masque la présentation ; sur iOS, la fin attend `onDismiss`, ailleurs elle est immédiate. */
  function closePhoto() {
    setPhotoVisible(false);
    if (!isIOS) finishConsultation();
  }
  function failPhoto() {
    setUnavailable(true);
    errorToAnnounce.current = true;
    closePhoto();
  }
  const options = !editable
    ? []
    : [
        { key: "remove", label: m.menuRemove, run: onRemove, destructive: true },
        ...(index > 0 ? [{ key: "moveUp", label: m.menuMoveUp, run: () => onMove(index - 1), destructive: false }] : []),
        ...(index < total - 1
          ? [{ key: "moveDown", label: m.menuMoveDown, run: () => onMove(index + 1), destructive: false }]
          : []),
      ];
  function openMenu() {
    if (isIOS) {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: label,
          options: [...options.map((option) => option.label), m.menuCancel],
          cancelButtonIndex: options.length,
          destructiveButtonIndex: 0,
        },
        (selected) => options[selected]?.run(),
      );
      return;
    }
    Alert.alert(label, undefined, [
      ...options.map((option) => ({
        text: option.label,
        style: option.destructive ? ("destructive" as const) : ("default" as const),
        onPress: option.run,
      })),
      { text: m.menuCancel, style: "cancel" as const },
    ]);
  }
  const actionLabels: Record<string, string> = {
    remove: m.remove.replace("{item}", label),
    moveUp: m.moveUp.replace("{item}", label),
    moveDown: m.moveDown.replace("{item}", label),
  };
  const tile = (
    <Pressable
      ref={tileRef}
      onPress={consult}
      // Menu contextuel natif : SwiftUI gère l'appui long ; ce rappel vide empêche seulement
      // le relâché d'un appui long de déclencher aussi `onPress` (aucune consultation, AC8).
      onLongPress={() => {
        if (nativeContextMenu || !editable) return;
        openMenu();
      }}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={editable ? (isVideo ? m.videoHint : m.photoHint) : isVideo ? m.videoHintLocked : m.photoHintLocked}
      accessibilityValue={unavailable ? { text: m.unavailable } : undefined}
      accessibilityActions={options.map((option) => ({ name: option.key, label: actionLabels[option.key] }))}
      onAccessibilityAction={(event) => options.find((option) => option.key === event.nativeEvent.actionName)?.run()}
      style={[styles.preview, size ? [size, styles.templatePreview] : null]}
      testID={`media-item-${index + 1}`}
    >
      {item.asset.kind === "VIDEO" ? (
        <VideoPreview uri={uri} />
      ) : (
        <Image
          source={{ uri }}
          style={styles.image}
          contentFit="cover"
          accessible={false}
          testID={`media-item-${index + 1}-image`}
        />
      )}
      {unavailable ? (
        <View style={styles.unavailable} testID={`media-item-${index + 1}-unavailable`}>
          <Text style={styles.errorText}>{m.unavailable}</Text>
        </View>
      ) : null}
      {size ? (
        // Recette A/B B.10 (remarque 4) : gabarit photo de la fiche Mouvement — compteur « rang /
        // total » à la place du badge « Vidéo » (le nom accessible donne déjà le rang et le total).
        <Text
          style={styles.kindBadge}
          accessible={false}
          importantForAccessibility="no"
          testID={`media-item-${index + 1}-counter`}
        >
          {strings.screens.movement.mediaCounter.replace("{rank}", String(index + 1)).replace("{total}", String(total))}
        </Text>
      ) : item.asset.kind === "VIDEO" ? (
        // Badge rendu après le voile d'erreur : la nature du Média reste visible.
        <Text style={styles.kindBadge}>{m.video}</Text>
      ) : null}
    </Pressable>
  );
  const consultationTestID = `media-item-${index + 1}-consultation`;
  return (
    <View style={[styles.tileFrame, size]}>
      {nativeContextMenu ? (
        <NativeTileContextMenu label={label} options={options} size={size} testID={`media-item-${index + 1}-context-menu`}>
          {tile}
        </NativeTileContextMenu>
      ) : (
        tile
      )}
      {size && isVideo ? (
        <MediaPlayButton
          size={size}
          onPress={consult}
          label={strings.screens.movement.playVideo}
          testID={`media-item-${index + 1}-play`}
        />
      ) : null}
      {consulting && isVideo ? (
        <VideoConsultation uri={uri} onClose={closeVideo} onError={failVideo} testID={consultationTestID} />
      ) : null}
      {consulting && !isVideo ? (
        <PhotoConsultation
          uri={uri}
          label={label}
          visible={photoVisible}
          onClose={closePhoto}
          onDismissed={finishConsultation}
          onError={failPhoto}
          testID={consultationTestID}
        />
      ) : null}
    </View>
  );
}

/**
 * PRE-4 story 4.5 (AC8, AC9, AD-17 `[ASSUMPTION]`), iOS seulement, si
 * `IOS_LONG_PRESS_MENU` vaut `"contextMenu"` : menu contextuel natif `ContextMenu` d'`@expo/ui` 57.0.13
 * (SwiftUI `contextMenu`, API relue dans la documentation versionnée SDK 57)
 * enveloppant la tuile React Native existante.
 *
 * Voie d'intégration : `Host` (taille de la tuile) → `ContextMenu` →
 * `ContextMenu.Trigger` → `RNHostView matchContents` → `Pressable` de la tuile,
 * inchangé (toucher, libellé, indication, actions VoiceOver). `RNHostView` est
 * le mécanisme documenté pour héberger une vue React Native dans une vue
 * SwiftUI. Aucun `ContextMenu.Preview` : iOS soulève la tuile elle-même comme
 * aperçu, aux coins de la tuile (`contentShape` de type `contextMenuPreview`).
 * `ContextMenu.Items` reprend les options de la tuile (mêmes libellés, ordre et
 * rappels que la feuille d'actions, bornes exclues), sous une `Section` titrée
 * du libellé du Média ; aucune option nouvelle, aucun `Annuler` (l'appui
 * extérieur ferme le menu natif).
 *
 * Le toucher simple consulte le Média (phase B) ; l'appui long ouvre CE menu.
 * À constater sur iPhone (R-4.5-00), sans
 * conclusion tirée de Jest : menu et aperçu à l'appui long, toucher simple
 * reçu par le `Pressable` à travers `RNHostView` (une première version du
 * popover de Mode, story 3.1, ne le recevait pas), défilement horizontal de la
 * galerie intact. En cas d'échec : repli d'AD-17 (`IOS_LONG_PRESS_MENU =
 * "actionSheet"` : appui long → feuille d'actions native existante), signalé à
 * Hermann ; jamais de menu réimplémenté.
 */
function NativeTileContextMenu({
  label,
  options,
  testID,
  children,
  size = null,
}: {
  label: string;
  options: readonly { key: string; label: string; run: () => void; destructive: boolean }[];
  testID: string;
  children: ReactElement;
  size?: TileSize;
}) {
  return (
    <Host style={[styles.contextMenuHost, size]} testID={testID}>
      <ContextMenu modifiers={[contentShape(shapes.roundedRectangle({ cornerRadius: fixedRadii[12] }), "contextMenuPreview")]}>
        <ContextMenu.Items>
          <Section title={label}>
            {options.map((option) => (
              <SwiftUIButton
                key={option.key}
                label={option.label}
                role={option.destructive ? "destructive" : "default"}
                onPress={option.run}
                testID={`${testID}-${option.key}`}
              />
            ))}
          </Section>
        </ContextMenu.Items>
        <ContextMenu.Trigger>
          <RNHostView matchContents>{children}</RNHostView>
        </ContextMenu.Trigger>
      </ContextMenu>
    </Host>
  );
}

/**
 * Affiche régénérée à l'ouverture (expo-video SDK 57), libérée au démontage ;
 * aucune lecture ni audio. Vidéo illisible : tuile neutre avec son type.
 */
function VideoPreview({ uri }: { uri: string }) {
  const [poster, setPoster] = useState<VideoPosterHandle | null>(null);
  useEffect(() => {
    let active = true;
    let handle: VideoPosterHandle | null = null;
    generateVideoPoster(uri).then((generated) => {
      handle = generated;
      if (active) {
        setPoster(generated);
      } else {
        generated?.release();
      }
    });
    return () => {
      active = false;
      handle?.release();
    };
  }, [uri]);
  return poster ? (
    <Image source={poster.image as never} style={styles.image} contentFit="cover" accessible={false} />
  ) : (
    <View style={[styles.image, styles.videoFallback]} />
  );
}

const PREVIEW_WIDTH = 260;
const PREVIEW_HEIGHT = 213;

/**
 * PRE-4 story 4.6 (FR-22-04, AC4 ; revue) : `Ouvrir les réglages` n'est qu'un libellé de 17 de
 * haut (`type.button`), dernier élément de l'avis, lui-même dernier bloc du défilement. Sur
 * iOS, un `hitSlop` qui sort des limites du parent ne reçoit pas le toucher : le débord n'est
 * donc pris qu'en haut, sur le texte de l'avis (au moins 17 + écart 4, qui n'est pas une
 * cible ; la galerie reste à plus de 8). Cible portée à 31 (17 + 14), sans changer le rendu
 * PRE-3 ; les 44 ne sont pas atteints sans agrandir le lien ou l'avis : écart consigné (Q52).
 */
export const OPEN_SETTINGS_HIT_SLOP = { top: 14, bottom: 0, left: 0, right: 0 } as const;

/**
 * PRE-8, recette A/B (27/10, spécification de Hermann ; arbitrage B : `expo-glass-effect`, déjà
 * présent) — bouton de lecture du gabarit photo de la fiche Mouvement, Figma « DSF / Actions /
 * Bouton d'action circulaire », Action=Lecture (`7872:14696`) : Ø 72 centré, verre natif iOS 26
 * (`GlassView` « clear », clair) sous un voile blanc 22 %, contour blanc 35 %, triangle blanc 30
 * décalé de 2 vers la droite ; ni ombre, ni couleur de marque. Sans Liquid Glass (iOS antérieur,
 * API absente) : voile et contour seuls. Cible tactile = le cercle de 72, sans zone étendue.
 * L'appui ouvre le lecteur système plein écran existant (`VideoConsultation`).
 */
const PLAY_BUTTON_SIZE = 72;
const PLAY_GLYPH_OFFSET = 2;
const PLAY_GLYPH = require("../../../assets/icons/media-lecture.svg");

function liquidGlassAvailable(): boolean {
  if (Platform.OS !== "ios") return false;
  try {
    return isGlassEffectAPIAvailable() && isLiquidGlassAvailable();
  } catch {
    // Module natif absent de la build : voile seul.
    return false;
  }
}

function MediaPlayButton({
  size,
  onPress,
  label,
  testID,
}: {
  readonly size: { readonly width: number; readonly height: number };
  readonly onPress: () => void;
  readonly label: string;
  readonly testID: string;
}) {
  const [glass] = useState(liquidGlassAvailable);
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[
        styles.playButton,
        { left: (size.width - PLAY_BUTTON_SIZE) / 2, top: (size.height - PLAY_BUTTON_SIZE) / 2 },
      ]}
      testID={testID}
    >
      {glass ? (
        <GlassView
          glassEffectStyle="clear"
          colorScheme="light"
          pointerEvents="none"
          style={StyleSheet.absoluteFill}
          testID={`${testID}-glass`}
        />
      ) : null}
      <View pointerEvents="none" style={styles.playVeil} testID={`${testID}-veil`} />
      <Image source={PLAY_GLYPH} style={styles.playGlyph} accessible={false} testID={`${testID}-glyph`} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  playButton: {
    position: "absolute",
    width: PLAY_BUTTON_SIZE,
    height: PLAY_BUTTON_SIZE,
    borderRadius: PLAY_BUTTON_SIZE / 2,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  playVeil: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: PLAY_BUTTON_SIZE / 2,
    borderWidth: 1,
    borderColor: colors.mediaPlayBorder,
    backgroundColor: colors.mediaPlaySurface,
  },
  playGlyph: {
    width: 26,
    height: 30,
    marginLeft: PLAY_GLYPH_OFFSET,
  },
  container: {
    gap: spacing[8],
  },
  galleryFrame: {
    backgroundColor: colors.mediaSurface,
    borderRadius: fixedRadii[16],
  },
  /** PRE-8 (B.2) : gabarit photo pleine largeur, sans cadre propre. */
  templateFrame: {
    backgroundColor: colors.mediaSurface,
  },
  templatePreview: {
    borderRadius: 0,
    borderWidth: 0,
  },
  gallery: {
    padding: spacing[8],
    gap: spacing[8],
  },
  tile: {
    width: PREVIEW_WIDTH,
    gap: spacing[4],
  },
  preview: {
    width: PREVIEW_WIDTH,
    height: PREVIEW_HEIGHT,
    borderRadius: fixedRadii[12],
    borderWidth: 1,
    borderColor: colors.mediaBorder,
    backgroundColor: colors.background,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  /** Story 4.5 : `Host` du menu contextuel natif, à la taille exacte de la tuile, sans habillage propre. */
  contextMenuHost: {
    width: PREVIEW_WIDTH,
    height: PREVIEW_HEIGHT,
  },
  /** Story 4.5 : cadre de la tuile, porteur de la surface du plein écran vidéo superposée. */
  tileFrame: {
    width: PREVIEW_WIDTH,
    height: PREVIEW_HEIGHT,
  },
  /** Story 4.5 (FR-21-58) : erreur locale à la place du Média (rendu NON VÉRIFIABLE, sans frame). */
  unavailable: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing[12],
  },
  previewPending: {
    gap: spacing[8],
    padding: spacing[12],
  },
  addTile: {
    borderColor: colors.mediaBorder,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  videoFallback: {
    backgroundColor: colors.surface,
  },
  kindBadge: {
    ...type.supporting,
    position: "absolute",
    left: spacing[8],
    bottom: spacing[8],
    color: colors.background,
    backgroundColor: colors.snackbar,
    borderRadius: fixedRadii[6],
    overflow: "hidden",
    paddingHorizontal: spacing[6],
    paddingVertical: 2,
  },
  pendingText: {
    ...type.body,
    color: colors.textSecondary,
  },
  errorText: {
    ...type.body,
    color: colors.danger,
    textAlign: "center",
  },
  retryAction: {
    minHeight: minTouchTarget,
    justifyContent: "center",
    paddingHorizontal: spacing[12],
  },
  retryLabel: {
    ...type.button,
    color: colors.primary,
  },
  notice: {
    gap: spacing[4],
  },
  noticeText: {
    ...type.body,
    color: colors.textSecondary,
  },
});
