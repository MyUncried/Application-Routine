# features/reference-data

`ReferenceDataService` — CRUD des Catégories et consultation du référentiel
prédéfini des Zones corporelles (§11.9, §12.4).

## Zones corporelles (T01-S08, D-093)

`bodyZones.ts` expose `BODY_ZONES`, le référentiel MVP des Zones corporelles
sélectionnables sur un Exercice : exactement 10 zones (Cou, Épaules, Bras,
Poignets et mains, Dos, Hanches et bassin, Cuisses, Genoux, Jambes, Chevilles
et pieds), chacune avec un `id` stable, un `name` affichable et un `order`
d'affichage. Périmètre MVP délibéré : pas de « Corps entier », pas de
distinction gauche/droite, sélection multiple uniquement.

Ce fichier est la seule source des identifiants/libellés/ordre — jamais codés
en dur ailleurs (`BodyZoneSelector.tsx`, `ExerciseScreen.tsx` le consomment
par les données, pas par une liste recopiée).

## PRE-4 story 4.3

Feuilles `CategoryPickerModal`, `BodyZonePickerModal` et dialogue `ReferenceValueDialog` gardés (comportement PRE-3 constaté par tests). Seuls changements : `ReferenceValueDialog` reçoit une prop optionnelle `usedMessage` (absente : message commun du départ, conservé pour l'Étiquette), par laquelle Catégorie et Zones affichent leurs messages distincts d'entrée utilisée (`deleteConfirm.categoryUsedMessage`, `deleteConfirm.bodyZoneUsedMessage`, FR-20-09). La suppression d'une Zone suit la décision Q53 (ci-dessous), qui remplace Q49 b. Tests `PRE4-4.3/ACn`.

## PRE-4 story 4.6

Compléments d'accessibilité seulement, comportement PRE-3 inchangé (Q49 b). Alternative à l'appui long (FR-22-09) : chaque Catégorie de `CategoryPickerModal` et chaque Zone de `BodyZonePickerModal` (par `BodyZoneSelector`, seulement quand `onEntryMenuAction` est fourni) porte l'action accessible personnalisée `ENTRY_MENU_ACTION` (« entryMenu », `src/shared/ui/entryMenuAction.ts`, jamais l'action standard « longpress »), libellée « Modifier ou supprimer » (`referenceData.longPressDialog.accessibilityAction`, H23) ; elle ouvre le même menu ✕ / `Modifier` / `Supprimer`, sans marquer l'entrée, et elle est ignorée tant que le formulaire de création ou de modification, ou un menu, est ouvert. Pendant le menu, la liste est masquée à l'accessibilité Android (`importantForAccessibility`) ; le dialogue est monté avec `key` = identifiant de l'entrée ; l'usage de l'entrée est remis à faux à chaque ouverture et un résultat asynchrone périmé est ignoré. Focus (FR-22-10) : opt-in `focusOnOpen` de `ReferenceValueDialog`, passé par Catégorie et Zones seulement (la feuille des Étiquettes, en Composition, n'envoie rien) — focus au nom de l'entrée, puis au titre de la confirmation (`sendAccessibilityEvent`, le retour à la liste par `setAccessibilityFocus` étant inchangé) ; après `Modifier`, focus au champ de nom. `useReferenceSheet.ts` : ouverture d'une feuille de référentiel par l'Éditeur ; à la fermeture, la feuille reste montée en `visible={false}` jusqu'à `onDismiss` du `Modal` (iOS), puis le focus est rendu à l'accès qui l'a ouverte (démontage et focus immédiats ailleurs) ; les deux feuilles acceptent pour cela `visible` (vrai par défaut) et `onDismissed`. Cible de `Créer une catégorie` et `Créer une zone corporelle` portée à 44 par un `hitSlop` sous la pilule, dessin inchangé (FR-22-04). Constats non corrigés (options de Catégorie à 30, nuancier, actions de modification à 30, hauteurs fixes sur un texte) : spec 4.6, Q52. Tests `PRE4-4.6/ACn` (`__tests__/ReferentialAccessibility.story46.test.tsx`).

## PRE-4 — décision Q53 (Zone retirée encore affectée)

Décision de Hermann du 2026-10-18, qui remplace Q49 b pour les Zones. `BodyZonePickerModal` liste les Zones actives et les Zones retirées affectées à l’Exercice à l’ouverture (`selectedIds`) ; une Zone retirée affectée reste listée, cochée et interactive (décochée, elle reste listée jusqu’à la fermeture) ; une Zone retirée non affectée n’est jamais proposée. Q53 (7) : une Zone supprimée depuis la feuille quitte immédiatement la liste et la sélection de la feuille, comme en PRE-3, et la sélection de l’Exercice courant par `onZoneRetired` (✕ ne la rétablit pas) ; elle n’apparaît en rouge que dans la feuille des autres Exercices qui l’avaient (Zones retirées avant l’ouverture, relevé `retiredAtOpeningIds`). Seule Zone supprimée : avis « au moins une Zone » ; `ActivityEditorForm` garde `Terminer` inactif jusqu’au choix d’une autre Zone. `BodyZoneSelector` rend une Zone inactive sur fond `colors.dangerSurface`, sans mention visible, avec le nom accessible « {nom}, retirée de la liste des choix » (`referenceData.bodyZone.retiredAccessibilityLabel`), sans appui long ni action « Modifier ou supprimer ». « Au moins une Zone » et son message sont inchangés. Tests `PRE4-Q53/…`.

Q53 (8), même règle pour `CategoryPickerModal` et `LabelPickerModal` : la valeur retirée AVANT l’ouverture et affectée à l’objet est listée, choisie, sur fond `colors.dangerSurface`, nom accessible `referenceData.retiredEntryAccessibilityLabel`, sans appui long ni action de menu ; une valeur supprimée depuis la feuille quitte la liste. Catégorie de l’Exercice courant supprimée : elle quitte toujours la liste, la sélection et le Brouillon (`onCategoryRetired`), qu’elle soit utilisée ailleurs ou non, avec l’avis PRE-3 `retiredValueMessage` ; `ExerciseScreen` garde `Terminer` inactif tant qu’aucune Catégorie n’est choisie. Étiquette de la Séance courante supprimée : elle quitte la sélection et le Brouillon (`onLabelRetired`). Tests `PRE4-Q53/category-…`, `PRE4-Q53/label-…`.
