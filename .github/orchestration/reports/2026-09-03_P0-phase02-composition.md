# Phase 2 — Composition d'une séance (état initial)

## Identifiant et objectif

- **Identifiant** : `P0-phase02-composition`
- **Issue** : #35, autorisée par `[ChatGPT] PHASE01_DEVICE_ACCEPTED_WITH_RESIDUAL — OPEN PHASE02 COMPOSITION` (2026-09-03T12:13:11Z) + addendum `[ChatGPT] PHASE02 ADDENDUM — NAV LABEL CORRECTION` (`RES-NAV-LABEL-01`, 2026-09-03T12:14:30Z).
- **Objectif** : recomposer l'état initial de `Composition d'une séance` selon les 12 critères obligatoires (`LAY-02` à `LAY-05` + interactions), appliquer `CTRL-01` aux roulettes de cet écran uniquement, et corriger `RES-NAV-LABEL-01` (« Mes séances » → « Séances »).

## Écart de méthode signalé explicitement (transparence, pas dissimulé)

Le checkpoint exigeait de produire la matrice atomique **avant** modification. Dans ce cycle, l'analyse et l'implémentation ont été menées en un seul passage continu, puis la matrice ci-dessous a été rédigée **rétrospectivement** à partir du diff réel plutôt que publiée séparément en amont comme point d'arrêt distinct. Le contenu de la matrice est exact et complet, mais l'ordre de production ne respecte pas littéralement la méthode anti-récidive demandée — signalé ici pour que la revue puisse en tenir compte, plutôt que de prétendre à une conformité méthodologique qui n'a pas eu lieu.

## Branche et commit de départ

- **Branche** : `feat/creation-seance-catalogue`
- **Baseline exigée** : `9177f70c824d9d0b2350e3e3ec169917ce820ad0`
- **Précondition Git vérifiée avant tout code** : `git fetch` + `git rev-parse origin/feat/creation-seance-catalogue` = `9177f70...`, identique ; `git status --short` vide.

## Matrice atomique — critère → référence → composant actuel → cause → modification → test → preuve device attendue

| Critère | Référence | Composant actuel (avant) | Cause | Modification | Test | Preuve device attendue |
|---|---|---|---|---|---|---|
| `RES-NAV-LABEL-01` | Addendum ChatGPT, 2026-09-03T12:14:30Z | `strings.nav.sessions = "Mes séances"` (`fr.ts`) | Libellé jamais mis à jour vers la forme canonique demandée | `"Mes séances"` → `"Séances"`, source i18n uniquement | `src/shared/i18n/index.test.ts` (assertion exacte mise à jour) | Libellé visible, centré, non rogné dans son slot de navigation |
| `LAY-02.1/.4` — Header + titre statique | Contrat Phase 2 (1), (4) ; `composition.title` déjà présent dans `fr.ts`, jamais rendu | Pas de titre d'écran ; le nom saisi ne le remplaçait pas non plus faute d'exister | Titre jamais implémenté depuis la création de l'écran | `header` dédié : Retour + `Text` statique `composition.title`, jamais lié à `draft.name` | Nouveau test : titre présent, inchangé après saisie d'un nom | Titre visible en permanence, jamais remplacé visuellement par le nom |
| `LAY-02.2` — Séparateur | Contrat Phase 2 (2) | Aucun séparateur | Jamais implémenté | `headerSeparator` (1px, `colors.divider`) sous le Header | Nouveau test : présence + fond distinct du fond général | Ligne fine visible sous le Header |
| `LAY-02.3` — Bande Context | Contrat Phase 2 (3) | Nom/couleur en flux direct, fond général uniforme | Écran jamais recomposé selon le Shell | `contextBand` (`colors.selectionSurface`) regroupant nom, couleur, Ajouter | Nouveau test : fond distinct, contient les 3 contrôles | Bande teintée visible, distincte du corps |
| `LAY-03` — Bouton Ajouter | Contrat Phase 2 (5) | `addActivityAction` : hauteur/rayon improvisés (padding générique, rayon `20`), aucun fond propre | Jamais aligné sur le token `compactSecondaryButton` (contrairement au bouton Créer du Catalogue, `UI-CAT-001`) | Hauteur `32`/rayon `16` (`dimensions.compactSecondaryButton`), fond `colors.background` explicite, `hitSlop` vertical calculé pour `≥48` | Nouveau test : hauteur/rayon/fond/bordure + `hitSlop` | Boîte compacte blanche, bordure/icône/texte bleus, appui confortable |
| `LAY-04` — Carte Tour | Contrat Phase 2 (7) ; doc12 §12.26 `Composition / Tour Section — Source exact` | `tourRow` générique (fond `surfaceSubtle`, `opacity:0.6`, aucune icône) | Composant DS jamais implémenté visuellement (déjà signalé dans le plan P0 initial) | `TourCard` dédiée : fond `colors.selectionSurface`, libellé et `×1` en slots distincts | Nouveau test : fond distinct, libellé + `×1` présents, jamais l'icône d'Activité | Carte visuellement distincte ; **icône Tour absente, bloquée (voir ci-dessous)** |
| `LAY-04` (icône) | Contrat Phase 2 (7) | Aucune icône | **Asset canonique introuvable** — recherche exhaustive de `assets/icons/` et `assets/icons/manifest.json` : aucun `tour.*` | Slot d'icône laissé vide (`tourCardIconSlot`, `24×24`), jamais un glyphe de substitution ni l'icône d'une Activité | Test négatif : `composition-exercise-icon` absent de la carte Tour | **BLOQUÉ** — nécessite un export Figma dédié ou une décision explicite d'accepter la carte sans icône |
| `LAY-05` — Boundary Activity | Contrat Phase 2 (8) ; doc12 §12.26 (aucune poignée documentée pour ce composant, à la différence de `Composition / Activity Row`) | `DurationRow` : icône+libellé groupés à gauche, valeur+chevron groupés à droite (2 slots, pas 3) | Ligne conçue comme générique, jamais recomposée en 3 slots indépendants | `BoundaryActivityRow` : slot icône (gauche) / titre (centre, `flex:1`) / valeur+chevron (droite) — poignée absente par choix documenté (doc12 ne documente aucune variante de réorganisation pour ce composant) | Nouveau test : icône, titre, chevron chacun indépendamment localisables | Icône de rôle et chevron ne se déplacent jamais l'un l'autre |
| `CTRL-01` (Composition uniquement) | `2026-09-03_P0-diagnostic-controles-interactifs.md`, point 1 ; autorisé pour Composition par `PHASE01_DEVICE_ACCEPTED_WITH_RESIDUAL` | `DurationWheelPicker` : items `View`/`Text` sans `onPress` | Cause déjà démontrée (diagnostic antérieur), jamais corrigée pour Composition | Chaque item devient un `Pressable` ; `applyColumnIndex` partagé entre glissement et appui, `alignColumn` recentre après un appui | 4 nouveaux tests (`DurationWheelPicker.test.tsx`) : appui direct, no-op si valeur déjà courante, indépendance minutes/secondes, coexistence avec le glissement | Compte à rebours et Fin de séance sélectionnables par appui ET glissement |

## Points hors modification, avec justification

- **Ordre du corps** (critère 6) : déjà conforme (`Compte à rebours → Activité éventuelle → Tour → Fin de séance`), établi lors du cycle de correction précédent (`UI-COMP-002/003`) — revérifié, non retouché, tests d'ordre existants toujours verts.
- **Synthèse indépendante de Tour** (critère 9) : déjà structurellement indépendante (`Text` séparé, jamais à l'intérieur de `TourCard`) — non modifiée, revérifiée.
- **Bouton `Continuer`** (critère 10) : `ARBITRAGE REQUIS` déjà documenté (rapport du 02/09) — non retranché ici, hors périmètre explicite de cette phase (« ne pas implémenter les catégories/persistance hors périmètre »).
- **Tour ouvrable/fermable** (interaction obligatoire « si la référence le prévoit ») : **non implémenté, aucune évidence trouvée qu'il le faille**. Le catalogue de composants doc12 §12.26 documente `Composition / Tour Section — Source exact` sans variante d'état (contrairement à `Catalogue / Session Card`, qui documente explicitement `State=Collapsed/Expanded`) — absence de variante documentée retenue comme preuve suffisante qu'aucune interaction d'ouverture/fermeture n'est attendue pour ce composant en l'état actuel des sources. Comportement conservé (`×1` fixe, non interactif).
- **Icône Réglages flottante** (critère 12) : appartient à Expo Go (chrome de développement), pas à l'application — déjà établi dans une instruction antérieure de cette session (« ne pas corriger, ne fait pas partie de l'app »). Aucune action possible depuis le code applicatif.
- **`RES-NAV-PROFILE-ASSET-01`** (écart résiduel de la Phase 1) : non traité, hors périmètre explicite de cette phase, différé jusqu'au remplacement de l'asset canonique.

## Preuves et tests

- `npx tsc --noEmit` → **PASS, 0 erreur**.
- `npx eslint .` (dépôt entier) → **PASS, 0 erreur, 0 avertissement**.
- `npx jest --maxWorkers=2` → **PASS, 35/35 suites, 423/423 tests** (415 précédents + 4 `CTRL-01` DurationWheelPicker + 4 `LAY-02/03/04/05` CompositionScreen). Aucune régression — les 30 tests `CompositionScreen` déjà existants avant cette phase restent tous verts (1 seul renommage de testID attendu : `composition-header` → `composition-context-band` pour le test d'élévation `zIndex` de la couleur, la zone ayant changé de rôle).
- **Captures normalisées** : `NON_VERIFIABLE_DEVICE` — aucun outil de rendu visuel disponible dans cet environnement.

## Hypothèses non démontrées

- Teinte exacte de `colors.selectionSurface` pour la bande Context et la carte Tour — non confirmée contre la frame Figma `2028:11137`.
- Absence de poignée dans `Boundary Activity` — déduite de l'absence de variante documentée dans doc12, pas d'une confirmation Figma directe.
- Absence d'interaction ouverture/fermeture pour Tour — même nature de déduction, pas une confirmation directe.
- Comportement réel du composant tiers `expo-router/js-tabs` non concerné par cette phase (Bottom Shell déjà traité en Phase 1).

## Fichiers modifiés

- `src/shared/i18n/resources/fr.ts` (`RES-NAV-LABEL-01`)
- `src/shared/i18n/index.test.ts`
- `src/features/sessions/CompositionScreen.tsx` (`LAY-02`, `LAY-03`, `LAY-04`, `LAY-05`)
- `src/features/sessions/__tests__/CompositionScreen.test.tsx`
- `src/features/sessions/DurationWheelPicker.tsx` (`CTRL-01`)
- `src/features/sessions/__tests__/DurationWheelPicker.test.tsx`
- `.github/orchestration/reports/2026-09-03_P0-phase02-composition.md` (créé — ce rapport)

## Commit final

Voir la réponse de clôture pour les hashes exacts.

## État Git

Voir la réponse de clôture pour `git status --short`, HEAD local et HEAD distant vérifié après push.

## Statut

`PHASE02_IMPLEMENTED_AWAITING_DEVICE_VERIFICATION`

Arrêt obligatoire ici. Aucun travail sur l'écran Exercice ni les autres phases.
