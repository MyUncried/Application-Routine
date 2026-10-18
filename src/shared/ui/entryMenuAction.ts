/**
 * PRE-4 story 4.6 (FR-22-09, AC8) — nom de l'action accessible qui ouvre le menu d'appui long
 * ✕ / `Modifier` / `Supprimer` (D-354) depuis une entrée de référentiel (Catégorie, Zone),
 * sans maintien. Module neutre : partagé par `BodyZoneSelector` (sessions) et les feuilles de
 * `reference-data`, sans dépendance entre ces tranches.
 *
 * Nom personnalisé, volontairement hors des actions standard de React Native (« activate »,
 * « longpress »…) : sur Android, l'action standard « longpress » est aussi traitée par la vue
 * comme un appui long natif, et le menu risquerait de s'ouvrir deux fois. Une action
 * personnalisée n'appelle que `onAccessibilityAction` ; VoiceOver et TalkBack la proposent
 * sous son libellé du lexique (`referenceData.longPressDialog.accessibilityAction`).
 */
export const ENTRY_MENU_ACTION = "entryMenu";
