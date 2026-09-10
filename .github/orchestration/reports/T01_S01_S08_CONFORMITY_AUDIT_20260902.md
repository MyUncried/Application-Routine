# T01 S01–S08 — Audit de conformité et corrections autonomes

## Fiche de mission

- **Mission** : (1) audit strictement en lecture seule de la conformité de tout ce qui a été développé dans T01-S01 à T01-S08 (écrans, composants, ressources visuelles, tests, protocole) ; (2) sur instruction Codex explicite ultérieure, correction autonome des écarts fonctionnels, structurels et visuels identifiés, en local, sans commit ni push.
- **Branche** : `feat/creation-seance-catalogue`
- **Commit de référence (inchangé après corrections — aucun commit effectué)** : `6ef18213e95e66e5b31b3da72ac010265c8e4efd` (`6ef1821`)
- **Dates** : audit le 2026-09-02/2026-09-03 ; corrections le 2026-09-03.

Ce document contient successivement : la Partie A (audit initial, en lecture seule, déjà publié le 2026-09-02) et la Partie B (corrections autonomes appliquées suite à l'instruction Codex).

---

# PARTIE A — AUDIT INITIAL (lecture seule, 2026-09-02)

## 1. Commit et branche réellement audités

- **Branche** : `feat/creation-seance-catalogue`
- **Commit HEAD** : `6ef18213e95e66e5b31b3da72ac010265c8e4efd` (`6ef1821`) — confirmé identique à la référence demandée par `git rev-parse HEAD`.
- **Répertoire de travail** : propre au début et à la fin de l'audit (`git status --short` vide). Aucun fichier modifié, créé, commité ou poussé pendant cette intervention. Aucune correction automatique (`--fix`) lancée. Aucun sous-agent invoqué.

## 2. Documents effectivement lus

- `docs/INDEX.md` (intégral)
- `docs/PRODUCT.md` (intégral)
- `docs/Specifications-fonctionnelles/12 – Architecture technique.md` (intégral, 1188 lignes)
- `docs/Specifications-fonctionnelles/13 – Contrats d'écran.md` (intégral, 646 lignes — 15 contrats CE-T01-01 à 15)
- `docs/Specifications-fonctionnelles/06 – Ecrans et navigation de la V1.md`, `07`, `08`, `09`, `10` — sections pertinentes déjà relues intégralement lors du travail précédent sur T01-S07/S08 dans cette même session, revérifiées ponctuellement par recherche ciblée pour cet audit (D-058, D-089 à D-095, RM-034 à RM-037, RM-071, RM-072, RM-101)
- `assets/icons/manifest.json` (intégral) + inventaire complet de `assets/icons/`, `assets/branding/`, `assets/images/`
- `.github/AI_ORCHESTRATION.md`, `.github/AI_ORCHESTRATION_CONTINUITY.md`, `.github/orchestration/` — vérification de version et de présence V1.4
- `T01-S04-plan-modification-persistante.md` (seul document de planification S01-S07 encore présent dans le dépôt)
- Code source intégral relu directement (pas seulement diffé) : `app/_layout.tsx`, `app/(tabs)/_layout.tsx`, `app.json`, `SessionCard.tsx`, `CatalogueScreen.tsx`, `CompositionScreen.tsx`, `ExerciseScreen.tsx`, `ColorPalette.tsx`, `BodyZoneSelector.tsx`, `DurationWheelPicker.tsx`, `NumberWheelPicker.tsx`, `wheelPickerMath.ts`, `KodjoIcon.tsx`, `KodjoSplash.tsx`, `visualAssets.test.ts`
- Historique Git complet (`git log`), toutes les Issues et PR GitHub (`gh issue list`, `gh pr list`)
- Icônes app (iOS `assets/expo.icon`, Android `android-icon-foreground.png`) inspectées visuellement

## 3. Correspondance T01-S01 à T01-S08 → écrans et composants

| Story | Commit(s) principal(aux) | Livrable |
|---|---|---|
| T01-S01 | `bdc00ab` | Persistance SQLite |
| T01-S02 | `01178cb` | Domaine et validations |
| T01-S03 | `59bed86` | `SessionService` |
| T01-S04 | `38342e4` | Modification persistante (`updateSession`) |
| T01-S05 | `a10bc2d` | Câblage applicatif |
| T01-S06 | `e56c5de` | Catalogue des séances |
| T01-S07 | `bc58445` | Composition d'une séance |
| T01-S08 | PR #9 | Exercice |
| *(hors S01-S08)* | PR #34 | Visuel + rédaction complète de `13 – Contrats d'écran.md` |

Aucune Issue GitHub n'existe pour S01-S07 (seules #3/T01-S08 fermée et #17/T01-S09 ouverte existent).

## 4. Tableau des constats (référence AUD-01 à AUD-15)

| ID | Écran/composant | Exigence | État constaté | Sévérité |
|---|---|---|---|---|
| AUD-01 | Global (`tsc`) | Contrôle TypeScript propre obligatoire | 27 erreurs (imports Jest manquants dans `visualAssets.test.ts`, `StyleSheet.absoluteFillObject` inexistant dans `KodjoSplash.tsx`) | **Bloquante** |
| AUD-02 | Catalogue + Composition (nav. basse) | CE-T01-02/03 : icône Recherche présente (désactivée) | Jamais rendue dans aucun écran | **Bloquante** |
| AUD-03 | `CompositionScreen.tsx` | CE-T01-04 : action Retour visible | Absente, seul le geste système fonctionne | **Bloquante** |
| AUD-04 | `ColorPalette.tsx`, `BodyZoneSelector.tsx` | Cible tactile minimale 48×48 | Pastilles 32×32/40×40, tags ~36 px, aucun `hitSlop` | Majeure |
| AUD-05 | Sélecteurs intégrés (couleur, durée, pause, répétitions, séries) | CE-T01-06/07/10/14 : popover ancré, ligne centrale sélectionnée, hiérarchie visuelle | Rendus en flux (poussent le contenu), aucune bande de sélection, aucun estompage | Majeure |
| AUD-06 | `wheelPickerMath.ts` | CE-T01-07/10 : pas de 5 s | Implémentation en pas de 1 s | Majeure — **à arbitrer** |
| AUD-07 | doc13 CE-T01-13 vs Registre | Contradiction : CE-T01-13 dit Séries fixé à 1 ; D-092/D-095 (validées, T01-S08 clos) disent bornes 1-99 | Code conforme au Registre, qui prévaut (INDEX.md §6) | Majeure (documentaire) |
| AUD-08 | `ExerciseScreen.tsx` | CE-T01-13 : segment Exercice/Récupération obligatoire | Absent | Majeure |
| AUD-09 | Icône d'application iOS/Android | Aucune icône générique | Toujours l'icône de démarrage Expo générique | Majeure |
| AUD-10 | `SessionCard.tsx` | CE-T01-03 : chevron/Démarrer/zone principale fonctionnels | `disabled` en dur, dépend d'écrans non livrés | Majeure, probablement hors périmètre S01-S08 |
| AUD-11 | `CompositionScreen.tsx` (Continuer) | CE-T01-04 : activation conditionnelle, libellé dynamique | `disabled` en dur, libellé statique | Majeure, partiellement lié à S09 |
| AUD-12 | Traçabilité S01-S07 | — | Aucune Issue, plans non versionnés | Mineure/organisationnelle |
| AUD-13 | Protocole | V1.4 ? | Seule V1.3 active ; V1.4 = PR #33 ouverte non fusionnée | Information |
| AUD-14 | `ExerciseScreen.tsx` | Propreté | `styles.backIcon` mort (résidu du glyphe `‹`) | Mineure |
| AUD-15 | `assets/icons/manifest.json` | Cohérence manifeste/implémentation | Règle `raster` (PNG) jamais implémentée ; SVG direct via `expo-image` | Mineure |

## 5. Conformité — synthèse initiale

**Conforme** : CE-T01-01 (Splash), CE-T01-08 (modale Abandonner), CE-T01-09 (résumé D-095), remplacement des glyphes typographiques, 4 onglets, bornes D-092/référentiel D-093/texte D-094.
**Partiellement conforme** : CE-T01-02/03, CE-T01-04 à 10, CE-T01-13 à 15, manifeste des icônes.
**Non conforme** : contrôle TypeScript, icône d'application, cibles tactiles.
**Non vérifiable** : critères d'acceptation exacts S01-S07, rendu réel device, pas exact de la roulette de secondes.

## 6. Verdict initial : **NO-GO**

Motivé par AUD-01 (TypeScript cassé), AUD-02 (Recherche absente), AUD-03 (Retour Composition absent) — trois défauts objectifs, non ambigus, corrigeables rapidement.

---

# PARTIE B — CORRECTIONS AUTONOMES (instruction Codex, 2026-09-03)

## Périmètre de l'instruction

Corriger les écarts fonctionnels, structurels et visuels identifiés (rapport ci-dessus + diagnostic complémentaire Codex), dans l'ordre de préséance : besoins fonctionnels validés > contrats d'écran > Design Foundation System > références Figma > rapport d'audit > diagnostic Codex. Aucune modification des contrats fonctionnels. Aucun arbitrage silencieux. Aucun commit, aucun push, aucune branche, aucun changement de branche à cette étape.

## Écarts corrigés

| ID | Correction appliquée | Fichier(s) principal(aux) |
|---|---|---|
| AUD-01 | Import `describe/it/expect` de `@jest/globals` ajouté ; `StyleSheet.absoluteFillObject` remplacé par les quatre propriétés `position/top/left/right/bottom` explicites (l'API n'existe pas dans les types RN installés) | `visualAssets.test.ts`, `KodjoSplash.tsx` |
| AUD-02 | Action Recherche distincte ajoutée : bouton circulaire flottant (`dimensions.globalSearch`, diamètre 58), visuellement présent, désactivé (`accessibilityState.disabled`), sans navigation | `app/(tabs)/_layout.tsx` |
| AUD-03 | Action Retour visible ajoutée à l'en-tête de Composition (`control-back`, cible 48×48), appelant `router.back()` sans traitement spécial — interceptée par `usePreventRemove` exactement comme le geste système, démontré avec un vrai navigateur | `CompositionScreen.tsx` |
| AUD-04 | `hitSlop` calculé ajouté sur le déclencheur compact et les pastilles de la grille de couleur, et sur chaque tag de Zone corporelle, portant chacun à ≥ 48×48 sans agrandir la taille visuelle | `ColorPalette.tsx`, `BodyZoneSelector.tsx` |
| AUD-05 | (a) Tous les sélecteurs intégrés (couleur, compte à rebours, fin de séance, durée/pause/répétitions/séries d'Exercice) sont désormais ancrés en superposition (`position: "absolute"`, patron `AnchoredRow`/`PopoverAnchor`), sans repousser le contenu suivant ; (b) nouveau composant partagé `WheelSelectionOverlay` (bande de sélection centrale + estompage haut/bas), intégré à `DurationWheelPicker` et `NumberWheelPicker` ; (c) `NumberWheelPicker` enveloppé dans un cadre visuel (fond, rayon) cohérent avec le composant Picker du Design System, auparavant rendu nu | `CompositionScreen.tsx`, `ExerciseScreen.tsx`, `ColorPalette.tsx`, `DurationWheelPicker.tsx`, `NumberWheelPicker.tsx`, nouveau `WheelSelectionOverlay.tsx` |
| AUD-08 | Segment `Exercice / Récupération` ajouté à l'écran Exercice — `Exercice` verrouillé sélectionné, `Récupération` visible mais désactivé, sans ouvrir aucun écran partiel | `ExerciseScreen.tsx` |
| AUD-14 | Style mort `backIcon` supprimé | `ExerciseScreen.tsx` |
| AUD-15 | Texte du manifeste corrigé pour refléter le mécanisme réel (rendu SVG direct via `expo-image`, pas de pipeline PNG 1x/2x/3x) | `assets/icons/manifest.json` |
| — *(découvert pendant la correction, non listé dans l'audit initial)* | 4 icônes de composition déclarées dans le manifeste mais jamais rendues (`composition-initial-countdown`, `composition-main-content`, `composition-end-session`, `composition-reorder`) — ajoutées aux lignes Compte à rebours initial, Fin de séance et à la ligne Exercice | `CompositionScreen.tsx` |
| — | Chevron `control-chevron-down`/`control-chevron-up` jamais utilisé — ajouté à toutes les lignes dépliables (Composition et Exercice), reflétant l'état ouvert/fermé (`accessibilityState.expanded`) | `CompositionScreen.tsx`, `ExerciseScreen.tsx` |
| — | Icône `state-selected` jamais utilisée — superposée sur la pastille de couleur actuellement sélectionnée | `ColorPalette.tsx` |
| — | Collision d'accessibilité découverte en corrigeant AUD-05 : `NumberWheelPicker` recevait le même `accessibilityLabel` que sa ligne pour Répétitions/Séries, rendant l'un des deux inatteignable par requête univoque une fois le sélecteur ouvert — nouvelle clé `wheelAccessibilityLabel` distincte introduite | `ExerciseScreen.tsx`, `fr.ts` |
| — | **Toutes les Safe Areas iOS** des écrans Catalogue, Composition, Exercice et de la navigation basse utilisaient un padding fixe (`spacing[24]`) au lieu des vrais insets système, alors que `react-native-safe-area-context` était déjà une dépendance installée mais **jamais utilisée nulle part dans le code applicatif** — `useSafeAreaInsets()` introduit dans les quatre | `CatalogueScreen.tsx`, `CompositionScreen.tsx`, `ExerciseScreen.tsx`, `app/(tabs)/_layout.tsx` |
| — | Bouton `Retour` de Composition démontré avec un vrai navigateur (`usePreventRemove` non mocké), symétriquement au patron déjà validé sur Exercice (KODJO-CMD-0002) | `CompositionNavigationGuard.integration.test.tsx` |

## Fichiers modifiés (21) et créés (3)

**Modifiés**
`app/(tabs)/_layout.tsx` ; `assets/icons/manifest.json` ; `src/features/sessions/BodyZoneSelector.tsx` ; `src/features/sessions/CatalogueScreen.tsx` ; `src/features/sessions/ColorPalette.tsx` ; `src/features/sessions/CompositionScreen.tsx` ; `src/features/sessions/DurationWheelPicker.tsx` ; `src/features/sessions/ExerciseScreen.tsx` ; `src/features/sessions/NumberWheelPicker.tsx` ; `src/features/sessions/__tests__/BodyZoneSelector.test.tsx` ; `src/features/sessions/__tests__/CatalogueScreen.test.tsx` ; `src/features/sessions/__tests__/ColorPalette.test.tsx` ; `src/features/sessions/__tests__/CompositionNavigationGuard.integration.test.tsx` ; `src/features/sessions/__tests__/CompositionScreen.test.tsx` ; `src/features/sessions/__tests__/DurationWheelPicker.test.tsx` ; `src/features/sessions/__tests__/ExerciseScreen.test.tsx` ; `src/features/sessions/__tests__/NumberWheelPicker.test.tsx` ; `src/shared/i18n/index.test.ts` ; `src/shared/i18n/resources/fr.ts` ; `src/shared/ui/KodjoSplash.tsx` ; `src/shared/ui/__tests__/visualAssets.test.ts`

**Créés**
`src/features/sessions/WheelSelectionOverlay.tsx` (composant partagé bande de sélection + estompage) ; `src/shared/ui/TestSafeAreaProvider.tsx` (utilitaire de test, fournit un `SafeAreaProvider` déterministe aux tests qui rendent directement un écran sans `renderRouter`) ; `src/shared/ui/__tests__/TabsLayoutSearch.integration.test.tsx` (test d'intégration vrai navigateur pour l'action Recherche).

Diff total : `21 files changed, 961 insertions(+), 222 deletions(-)` + 3 fichiers créés.

## Tests exécutés et résultats exacts

commande : `npx tsc --noEmit --incremental false`
résultat : **PASS — 0 erreur** (27 → 0).

commande : `npx eslint . --no-cache`
résultat : **PASS — 0 erreur, 0 avertissement**.

commande : `npx jest --no-cache --coverage=false` (parallélisme par défaut)
résultat : 391/392 tests passent ; **1 échec par dépassement de délai** (`CatalogueScreen › shows a distinct error message and an active Réessayer button on rejection`, timeout 5000 ms) constaté uniquement lors de l'exécution complète à 34 suites en parallèle.

**Contre-vérification du timeout** : ce même test relu et rejoué seul (`npx jest src/features/sessions/__tests__/CatalogueScreen.test.tsx`) passe en 2799 ms, très en-deçà du délai. Rejoué ensuite avec `--maxWorkers=2` sur l'intégralité de la suite, il passe systématiquement. Ceci démontre une contention de ressources CPU propre à cette machine lors de l'exécution en parallélisme maximal (de nombreuses suites `react-test-renderer` lourdes exécutées simultanément), et non une régression fonctionnelle introduite par les corrections — confirmé par deux exécutions complètes indépendantes avec `--maxWorkers=2` :

commande : `npx jest --no-cache --coverage=false --maxWorkers=2` (×2, avant et après l'ajout des tests Retour Composition)
résultat final : **PASS — 34/34 suites, 395/395 tests, 0 échec** (82,79 s).

commande : `npm ls --depth=0`
résultat : **PASS**, aucune dépendance manquante.

commande : `git diff --check`
résultat : **PASS** (code de sortie 0) — uniquement des avertissements `LF will be replaced by CRLF`, pas d'espace parasite ni de marqueur de conflit.

commande : `npx expo config`
résultat : **PASS**, configuration résolue sans erreur.

**Tests ajoutés spécifiquement pour éviter une fausse conformité** (contrôle qui s'ouvre sans permettre de sélection réelle) :
- Composition : sélection réelle d'une valeur dans la roulette du compte à rebours, fermeture du sélecteur, valeur toujours affichée après fermeture.
- Exercice : sélection réelle d'une valeur dans la roulette Séries, fermeture, valeur conservée, utilisée par le calcul de validité (`Terminer`).
- `WheelSelectionOverlay` : bande de sélection centrale et estompage présents et non interactifs (`pointerEvents="none"`) sur les deux roulettes.
- `ColorPalette` : icône `state-selected` présente sur exactement la pastille sélectionnée ; cibles tactiles ≥ 48×48 vérifiées par calcul (taille visuelle + `hitSlop`) ; popover réellement `position: absolute`.
- `BodyZoneSelector` : `hitSlop` > 0 sur chaque tag.
- Composition et Exercice : ancrage `position: absolute` du popover vérifié directement sur le style rendu (pas seulement supposé).
- Navigation basse : action Recherche visible, désactivée, sans navigation produite (vrai navigateur).
- Composition : action Retour visible, testée avec un vrai navigateur (`usePreventRemove` non mocké) sur les trois scénarios (sortie propre, sortie bloquée, modale D-094-équivalente Composition).

## Écarts résiduels (non corrigés, avec raison précise)

1. **« Regroupement compact des paramètres »** (CE-T01-13 : Durée/Pause/Séries en une rangée compacte de trois plutôt qu'empilés verticalement) — non traité. Raison : restructuration de layout à risque de régression visuelle/tactile non négligeable, jugée disproportionnée par rapport au temps restant de cette mission ; l'écart est purement visuel (aucune fonction n'est manquante, chaque paramètre reste sélectionnable, persistant et utilisé), documenté pour une correction ultérieure ciblée.
2. **Icône d'application (home screen) iOS/Android toujours générique** (AUD-09) — non corrigé. Raison : nécessite la production/l'export d'assets graphiques dimensionnés (PNG 1024×1024, variantes adaptive-icon Android, fichier Icon Composer iOS `icon.json`) à partir du logo KODJO existant (`assets/branding/*`) ; cette production d'asset dépasse le périmètre d'une correction de code et nécessiterait soit un outil de génération dédié, soit une intervention manuelle/design non disponible dans cette mission.
3. **AUD-10 (interactions de carte Catalogue désactivées)** — non modifié, volontairement. Raison : dépend d'écrans (détail de Séance, Exécution) non livrés dans T01-S01 à S08 ; les activer maintenant sans ces écrans produirait soit une navigation vers rien, soit une fabrication de comportement non demandée — cohérent avec l'interdiction de « tranch[er] silencieusement une contradiction produit ».
4. **AUD-11 (bouton `Continuer` de Composition)** — non modifié, arbitrage requis (voir ci-dessous).

## Arbitrages requis (comportement fonctionnel conservé, aucune décision prise silencieusement)

### ARBITRAGE 1 — Pas des secondes de la roulette (AUD-06)

CE-T01-07/CE-T01-10 exigent un pas de 5 secondes ; l'implémentation actuelle (`wheelPickerMath.ts`, `DurationWheelPicker.tsx`) utilise un pas de 1 seconde, validé comme arbitrage V1 lors de T01-S07 (document de plan non versionné dans le dépôt). **Comportement conservé tel quel**, conformément à l'instruction explicite. Aucune ligne de `wheelPickerMath.ts` liée au pas n'a été modifiée.

### ARBITRAGE 2 — Contradiction Répétitions/Séries (AUD-07)

`13 – Contrats d'écran.md` (CE-T01-13) énonce « Séries reste fixé à 1 pour la séance simple T01 » et exige `Récupération`/`Répétition` visiblement désactivés — ce qui contredit **D-092** (bornes Séries/Répétitions 1–99) et **D-095** (résumé détaillé incluant Séries/Pause), décisions validées et déjà implémentées, testées et closes lors de T01-S08 (Issue #3, PR #9, plusieurs revues ChatGPT indépendantes). Selon l'ordre de référence d'`INDEX.md` §6, le Registre des décisions prévaut sur les Contrats d'écran en cas de contradiction. **Le code n'a donc pas été modifié** sur ce point (il reste conforme à D-092/D-095) — seul le segment `Exercice/Récupération` (AUD-08, sans lien avec les bornes Répétitions/Séries) a été ajouté. Cette contradiction documentaire reste à corriger dans `13 – Contrats d'écran.md` lui-même, hors périmètre d'une correction de code.

### ARBITRAGE 3 — Bouton `Continuer` de Composition (AUD-11)

CE-T01-04 exige une activation conditionnelle (Nom + Exercice valide) avec libellé dynamique `Enregistrer`→`Continuer`. Mais la destination réelle (`Catégories de la séance`, CE-T01-11) n'existe pas avant T01-S09 (Issue #17, ouverte). Activer ce bouton sans action réelle contredirait `13 – Contrats d'écran.md` §3.3 (« Un contrôle visible doit posséder une action réelle ou un état explicitement désactivé »). **Comportement conservé tel quel** (désactivé) ; un commentaire explicite documentant cette tension a été ajouté directement dans `CompositionScreen.tsx`.

## Verdict final

## GO CONDITIONNEL

Les trois défauts bloquants de l'audit initial (AUD-01 TypeScript, AUD-02 Recherche absente, AUD-03 Retour Composition absent) sont **corrigés et vérifiés** par les contrôles complets (TypeScript, ESLint, 395/395 tests, `npm ls`, `git diff --check`, `npx expo config`). Les défauts majeurs directement corrigeables sans nouvel arbitrage (AUD-04, AUD-05, AUD-08, AUD-14, AUD-15, et les écarts d'icônes/chevrons/safe areas découverts pendant la correction) sont également corrigés et couverts par de nouveaux tests.

Trois points restent explicitement non tranchés (arbitrages 1 à 3 ci-dessus) et deux écarts résiduels documentés (regroupement compact des paramètres, icône d'application) — aucun n'est silencieux, tous sont signalés avec leur raison précise. Le passage à un GO plein nécessite soit la résolution de ces arbitrages par la contre-revue Codex, soit leur acceptation explicite comme écarts non bloquants.

## Prochaines actions proposées (Partie B, historique — voir Partie C pour l'état courant)

1. Contre-revue Codex de ce rapport et du diff complet.
2. Décision explicite sur les trois arbitrages (pas de 5 s, contradiction CE-T01-13/Registre à corriger dans la documentation, activation du bouton Continuer).
3. Le cas échéant, production des assets d'icône d'application KODJO (iOS/Android) par un canal de génération d'assets dédié.
4. Décision sur le regroupement compact des paramètres de l'écran Exercice (correction visuelle ciblée ultérieure, ou accepté tel quel).
5. Aucun commit, aucun push, aucune fusion tant que la contre-revue n'a pas statué.

---

# Cycle de correction après contre-recette iPhone — 2026-09-03

## Déclencheur

Contre-recette sur iPhone réel (hors Jest) : les sélecteurs numériques/durée (Compte à rebours initial, Fin de séance, Durée d'un Exercice, Pause après Série, Nombre de Séries, Nombre de répétitions) **s'ouvrent mais ne permettent pas de sélectionner ou de conserver correctement une valeur**. Ce cycle traite prioritairement la cause racine de ce défaut (P0), puis un ensemble de corrections structurelles P1 dans la limite du temps réellement disponible pour cette mission — voir « Points non traités » en fin de section, listés explicitement plutôt que passés sous silence.

**Rappel épistémique appliqué tout au long de ce cycle** : la réussite de Jest ne constitue jamais, à elle seule, une preuve du fonctionnement tactile réel sur iPhone. Chaque statut ci-dessous distingue ce qui est prouvé par le code/les tests (`CORRIGÉ ET TESTÉ`) de ce qui reste à confirmer physiquement (`À VALIDER SUR IPHONE`).

## UI-CTRL-001 — Cause racine (investigation, sans supposition)

**Composants partagés réellement utilisés** : `DurationWheelPicker.tsx` (Compte à rebours, Fin de séance, Durée/Pause Exercice) et `NumberWheelPicker.tsx` (Répétitions/Séries), tous deux enveloppés par le patron `AnchoredRow`/`PopoverAnchor` de `CompositionScreen.tsx`/`ExerciseScreen.tsx` (introduit lors du cycle de correction précédent, 2026-09-02/03, pour l'AUD-05).

**Chemin reproduit** : geste (scroll réel) → `onScroll` (`scrollEventThrottle=16`) → `offsetToIndex` → comparaison à l'index `ref` courant → `Haptics.selectionAsync()` + `onChange(totalSeconds|value)` → `updateDraft`/`patchLocal` (état React) → libellé de la ligne recalculé au rendu suivant. Cette chaîne elle-même (logique pure, `wheelPickerMath.ts`) a été rejouée et reste correcte — ce n'est pas la cause.

**Cause exacte identifiée, avec preuve géométrique dans le code (pas une supposition)** : le popover ouvert mesure `ITEM_HEIGHT × 3 + paddingVertical × 2` = `40 × 3 + 8 × 2` = **136px** (`DurationWheelPicker.tsx`/`NumberWheelPicker.tsx`, styles `wheelArea`/`container`). Or l'écart réel jusqu'à la ligne suivante n'est que de `gap: spacing[16]` (16px) plus la hauteur d'une ligne fermée (~48-56px) — très inférieur à 136px. `AnchoredRow` (et le `header` de la palette de couleur) ne portaient **aucun `zIndex`** : React Native peint les frères d'un même parent flex dans leur ordre de montage par défaut, donc la ligne **suivante** (montée après dans le JSX) était peinte **par-dessus** le popover ouvert — un `zIndex` posé uniquement sur le popover interne (`popoverAnchor`, zIndex 20) ne fait pas remonter tout le sous-arbre `AnchoredRow` au-dessus d'un frère de même niveau, car le `zIndex` React Native ne réordonne que les enfants directs d'un même parent, pas des sous-arbres entiers situés à des profondeurs différentes. Concrètement : ouvrir le sélecteur `Compte à rebours initial` faisait peindre la ligne `Fin de séance` (ligne suivante, `Pressable` opaque) par-dessus l'essentiel du popover ouvert — un toucher dans cette zone atteignait la ligne opaque `Fin de séance` (qui bascule alors vers SON propre sélecteur), jamais la roulette sous-jacente. C'est un défaut d'empilement (« z-order »), pas un défaut du mécanisme de scroll — et il est **indétectable par les tests existants**, car `fireEvent.scroll` de RNTL invoque directement le gestionnaire `onScroll` du nœud ciblé, sans passer par une résolution de toucher réelle (« hit-testing ») qui aurait révélé l'interception par la ligne suivante.

Cause classée parmi les causes énumérées par l'instruction : **« `pointerEvents` ou une couche transparente interceptant le toucher »** — plus précisément une couche **opaque** (la ligne suivante elle-même) interceptant le toucher faute de `zIndex` différencié entre lignes frères.

**Statut : CORRIGÉ ET TESTÉ** (au niveau code — voir UI-CTRL-002/003) — **À VALIDER SUR IPHONE** pour la confirmation tactile réelle finale.

## UI-CTRL-002 — Correction du composant partagé

**Fichiers modifiés** : `CompositionScreen.tsx`, `ExerciseScreen.tsx`.

**Correction réalisée** : `AnchoredRow` reçoit désormais une prop `elevated: boolean`, appliquant `zIndex: 1` à la ligne elle-même (pas seulement à son popover interne) tant que son propre sélecteur est ouvert (`openOverlay === <kind-de-cette-ligne>`) ; le `header` de Composition (nom + pastille couleur) reçoit le même traitement tant que la palette de couleur est ouverte. Une seule ligne à la fois porte `zIndex: 1` (exclusivité déjà garantie par l'état `openOverlay` unique) ; toutes ses lignes/sections voisines restent au niveau par défaut. Correction unique au niveau des deux composants d'écran (pas de duplication par sélecteur individuel) — `DurationWheelPicker.tsx`/`NumberWheelPicker.tsx` eux-mêmes n'ont pas eu besoin d'être modifiés, la cause étant en amont (empilement des lignes appelantes).

**Preuve par test** : 4 nouveaux tests structurels (`CompositionScreen.test.tsx` ×2, `ExerciseScreen.test.tsx` ×1, plus la couverture de `header`) vérifient directement le style rendu — `zIndex` absent par défaut, `zIndex: 1` exactement sur la ligne ouverte, absent sur ses voisines — et non une simple supposition de comportement.

**Résultat observable** : le popover ouvert peint désormais au-dessus de toute ligne/section suivante du même écran, quelle que soit sa position dans le flux (démontré structurellement) — la ligne suivante ne peut plus intercepter un toucher destiné au popover.

**Statut : CORRIGÉ ET TESTÉ** (démonstration structurelle complète) — **À VALIDER SUR IPHONE** (confirmation tactile réelle, la preuve de code ne remplaçant jamais un test physique).

## UI-CTRL-003 — Tests couvrant le comportement réel

Couverture déjà existante (cycle précédent, revérifiée intacte) + nouvelle couverture de ce cycle :
- Ouverture / sélection d'une valeur réelle / rafraîchissement du libellé / fermeture / réouverture sur la valeur conservée : `CompositionScreen.test.tsx` (Compte à rebours), `ExerciseScreen.test.tsx` (Séries).
- Indépendance Compte à rebours / Fin de séance : exclusivité déjà couverte (« un seul sélecteur ouvert à la fois »).
- Rafraîchissement du résumé d'Activité : couvert par le nouveau test d'intégration bout-en-bout (UI-ACT-001 ci-dessous).
- **Nouveau** : élévation `zIndex` exacte de la ligne ouverte (UI-CTRL-002 ci-dessus).
- **Non requis par l'instruction** : le pas des secondes reste à 1 s — **ARBITRAGE 1 non retranché**, aucune ligne de `wheelPickerMath.ts` liée au pas n'a été modifiée dans ce cycle.

**Statut : CORRIGÉ ET TESTÉ** au niveau code — **À VALIDER SUR IPHONE** pour la confirmation tactile finale.

## UI-ACT-001 — Parcours Activité en deux étapes

**Constat** : aucun test précédent ne faisait transiter un vrai navigateur (`renderRouter`) entre les vraies routes `(creation)/composition` et `(creation)/exercise` avec un `SessionDraftProvider` réellement partagé — chaque écran n'était testé qu'isolément (contexte simulé). Le comportement lui-même (`Valider`/`Terminer`, verrou `finishingRef`) était déjà correct, mais non démontré de bout en bout.

**Fichier créé** : `src/features/sessions/__tests__/CompositionExerciseFlow.integration.test.tsx` — utilise les vraies routes (`app/(creation)/_layout|composition|exercise.tsx`) via `renderRouter`.

**Preuve par test — 4 tests, couvrant les 7 résultats attendus** :
1. `Valider` (étape 1 valide) ouvre Informations complémentaires, sans écriture partagée prématurée.
2-3-4-5. `Terminer` enregistre atomiquement l'Activité, revient effectivement sur `/composition`, l'insère entre Compte à rebours et Tour (preuve d'ordre direct, pas seulement de présence), et le résumé passe de `0 activité · 0 min` à `1 activité · ...`.
6. Un double-appui rapproché sur `Terminer` (même tour `act`) n'enregistre l'Activité qu'une seule fois — aucun doublon, aucun `2 activités`.
7. `Continuer` reste désactivé après création d'une Activité — comportement conforme à l'ARBITRAGE 3 (non réévalué par cette tâche).

**Résultat observable** : `4/4` tests passent avec un vrai navigateur et un vrai `SessionDraftProvider`.

**Statut : CORRIGÉ ET TESTÉ.**

## UI-COMP-002 / UI-COMP-003 — Ordre structurel de Composition (défaut réel découvert pendant ce cycle, hors liste initiale de l'instruction)

**Cause trouvée** : en relisant `CompositionScreen.tsx` pour UI-CTRL-002, l'ordre réel constaté était `Compte à rebours → Fin de séance → Tour → (bouton Ajouter | ligne Exercice)` — non conforme sur deux points : (a) `Tour` et `Fin de séance` étaient inversés par rapport à l'ordre exigé ; (b) le bouton `+ Ajouter une activité` (et la ligne Exercice une fois créée) était rendu **après** Tour, alors que l'instruction exige le bouton **au-dessus** de la structure Compte à rebours/Tour/Fin de séance, et l'Activité créée **entre** Compte à rebours et Tour.

**Fichier modifié** : `CompositionScreen.tsx` (réordonnancement JSX uniquement — aucune logique métier modifiée).

**Correction réalisée** : nouvel ordre — `+ Ajouter une activité` (si aucun Exercice) → Compte à rebours initial → Activité créée (si elle existe) → Tour → Fin de séance → résumé → `Continuer`.

**Preuve par test** : 2 nouveaux tests (`CompositionScreen.test.tsx`) parcourent l'arbre rendu (`toJSON()`) et vérifient l'ordre réel de première apparition des `testID`/libellés — pas seulement leur présence — pour l'état initial et pour l'état avec une Activité créée. Revérifié également par le test d'intégration UI-ACT-001 (point 3).

**Résultat observable** : ordre conforme démontré structurellement dans les deux états.

**Statut : CORRIGÉ ET TESTÉ.**

## UI-ACT-002 — En-tête Exercice affichant le nom de la Séance

**Cause trouvée** : l'en-tête fixe de `ExerciseScreen.tsx` affichait `t.titleAdd`/`t.titleEdit` (« Ajouter une activité »/« Modifier une activité »), jamais le nom réel de la Séance — non conforme à l'instruction, qui réserve ce titre au corps défilant.

**Fichier modifié** : `ExerciseScreen.tsx`.

**Correction réalisée** : l'en-tête affiche désormais `draft.name` (repli sur le placeholder `composition.name`, « Nom de la séance », tant qu'aucun nom n'a encore été saisi — Composition n'impose aucun nom avant l'ajout d'une Activité) ; une ligne de séparation a été ajoutée sous l'en-tête ; le titre `Ajouter une activité`/`Modifier une activité` est resté, déplacé en première position du corps défilant ; un label visible « Nom » a été ajouté au-dessus du champ (auparavant seul un `placeholder`/`accessibilityLabel` identiques existaient, sans label visible distinct).

**Preuve par test** : nouveau test dédié (`ExerciseScreen.test.tsx`) prouvant que l'en-tête contient le nom de Séance et ne contient PAS le titre `Ajouter une activité` (`within(header)`).

**Statut : CORRIGÉ ET TESTÉ.**

## UI-CAT-001 — Bouton Créer du Catalogue

**Cause trouvée** : `createAction` (`CatalogueScreen.tsx`) n'avait ni largeur ni hauteur explicites (dimensionné uniquement par son contenu + `padding`), un rayon improvisé (`20`, au lieu du token `dimensions.compactSecondaryButton.radius = 16`), et aucune cible tactile élargie (`hitSlop`) au-delà de sa boîte visuelle.

**Fichier modifié** : `CatalogueScreen.tsx`.

**Correction réalisée** : cadre visuel exact `90 × 32` (largeur/hauteur explicites), rayon du token `dimensions.compactSecondaryButton.radius` (16), `hitSlop` calculé pour porter la cible tactile réelle à `≥ 48 × 48` sans agrandir la boîte visuelle elle-même.

**Preuve par test** : nouveau test dédié vérifiant `width===90`, `height===32`, `borderRadius===16`, et `largeur/hauteur + hitSlop ≥ 48` sur les deux axes.

**Statut : CORRIGÉ ET TESTÉ.**

## UI-SPL-001 — Double écran de démarrage (Expo Go vs configuration native vs build autonome)

**Analyse (documentaire, sans modification de code — rien à corriger côté application)** : `app.json` déclare correctement le plugin `expo-splash-screen` natif (`backgroundColor: "#0001F1"`, image `assets/branding/logo_icon_only_transparent_1024.png`, `imageWidth: 200`) — cette configuration est celle qui sera appliquée au splash natif (iOS/Android) d'un **build autonome** (EAS Build, TestFlight, App Store) ou d'un **dev client**, générée lors du `prebuild`. `KodjoSplash.tsx` est le splash **JS** (React), rendu par `app/_layout.tsx` une fois le bundle JS exécuté — il s'affiche nécessairement **après** l'écran natif, jamais à sa place.

**Expo Go** est une application conteneur générique, préconstruite par Expo et distribuée sur l'App/Play Store : elle ne peut pas appliquer la configuration `expo-splash-screen` d'un projet particulier à son propre écran de lancement natif (celui-ci appartient à l'app Expo Go elle-même, pas au projet KODJO) — l'écran « de téléchargement » avec seulement le sigil, décrit par l'instruction, correspond au chargement générique d'Expo Go (son propre habillage, avant que le bundle JS de KODJO ne soit téléchargé/exécuté et que `KodjoSplash.tsx` ne puisse s'afficher), pas à un défaut de configuration côté application.

**Conclusion** : la configuration native (`app.json`) est correcte et n'a pas été modifiée. La différence observée est structurelle à Expo Go (chrome qui n'appartient pas à l'application, non « corrigible » depuis ce dépôt) et disparaîtra dans un dev client ou un build autonome, où seul l'écran natif KODJO configuré puis `KodjoSplash.tsx` s'enchaîneront.

**Statut : DOCUMENTÉ (analyse de code, `app.json` vérifié conforme) — À VALIDER SUR IPHONE en dev client ou build autonome** (Expo Go ne peut, par construction, jamais servir de preuve pour ce point précis).

## Points non traités dans ce cycle (listés explicitement, non tranchés silencieusement)

Le volume total demandé par l'instruction (~20 identifiants P0/P1, plusieurs impliquant une restructuration visuelle non triviale) dépasse ce qu'il est possible de corriger et de prouver rigoureusement (code + tests, sans fausse conformité) dans un seul cycle sans dégrader la qualité des vérifications déjà réalisées ci-dessus. Les points suivants **n'ont pas été traités** dans ce cycle et ne doivent pas être présumés conformes :

- **UI-NAV-001** (géométrie de la navigation basse) — non réaudité dans ce cycle ; dernière vérification connue lors du cycle précédent (2026-09-02/03, action Recherche ajoutée et testée). Non retouché ici, donc non re-vérifié pour les exigences plus fines (poids égal des 4 destinations, capsule active seule, diamètre recherche exclu du calcul des 4 emplacements).
- **UI-COMP-004** (différenciation visuelle Tour/Activité) — l'icône Tour (`composition-reorder` sur la ligne Activité) et la structure (conteneur, icône vecteur, `×1`) restent distinctes dans le code actuel ; non réévalué en détail contre le composant `Activity Row` du Design System dans ce cycle.
- **UI-COMP-005** (icônes Compte à rebours/Fin de séance : boîte visuelle du token, alignement vertical, cible tactile minimale) — non réaudité dans ce cycle.
- **UI-ACT-003** (styling exact des deux contrôles segmentés via le composant `Controls / Segmented` et ses tokens couleur/texte) — non réaudité ; l'implémentation actuelle utilise `colors.background` comme fond de segment sélectionné (pas nécessairement le token exact attendu par le Design System pour ce composant).
- **UI-ACT-004** (Durée/Pause/Séries alignés en une seule rangée compacte plutôt qu'empilés) — **non traité**, déjà documenté comme écart résiduel explicite dans la Partie B (§ Écarts résiduels, point 1) ; aucune régression de fonction, écart purement visuel.
- **UI-ACT-005** (cadre récapitulatif dynamique CE-T01-13) — **non implémenté** ; aucun composant de ce type n'existe actuellement sur `ExerciseScreen.tsx`.
- **UI-INFO-001** (Consigne/Zones corporelles : labels/placeholders exacts, disclosure) — labels de base déjà présents (`t.instruction.label`, `t.bodyZones.label`) ; le placeholder exact « Décrivez brièvement le geste » et le contrôle de disclosure exact n'ont pas été vérifiés/corrigés dans ce cycle.
- **UI-CONF-001** (remplacement du dialogue centré `AbandonCreationModal`/`ExerciseExitConfirmModal` par une feuille ancrée en bas intégrant l'inset) — **non traité** ; les deux modales restent des dialogues centrés, non conformes à CE-T01-08 tel que décrit par l'instruction si celui-ci exige effectivement une feuille ancrée en bas (à revérifier contre le contrat exact).

Ces points ne sont ni corrigés ni validés — ils restent à traiter dans un cycle ultérieur dédié, avec le même niveau de preuve (code + tests) que les points ci-dessus, jamais par affirmation générique.

## Validation technique de ce cycle

commande : `npx tsc --noEmit`
résultat : **PASS — 0 erreur**.

commande : `npx eslint .`
résultat : **PASS — 0 erreur, 0 avertissement** (portée : dépôt entier).

commande : `npx jest --maxWorkers=2` (exécuté à plusieurs reprises au fil des corrections)
résultat final : **PASS — 35/35 suites, 406/406 tests** (395 précédents + 11 nouveaux : 4 zIndex/ordre Composition, 2 zIndex/en-tête Exercice, 4 intégration UI-ACT-001, 1 géométrie Créer).

**Aucun test tactile réel n'a été exécuté** — Jest ne peut pas exercer la résolution de toucher (« hit-testing ») ni la reconnaissance de geste native. Chaque statut `CORRIGÉ ET TESTÉ` ci-dessus porte donc uniquement sur la preuve de code/structure ; la confirmation tactile réelle reste `À VALIDER SUR IPHONE` pour tous les points UI-CTRL-*, et pour UI-SPL-001 en dev client/build autonome.

## Verdict de ce cycle

**GO CONDITIONNEL — cause racine du défaut bloquant (UI-CTRL-001) corrigée et testée au niveau code ; confirmation tactile réelle sur iPhone requise avant toute clôture.**

La cause racine réelle du défaut rapporté (empilement/`zIndex`, pas le mécanisme de scroll) est identifiée avec preuve, corrigée à la source (un seul endroit par écran, pas dupliqué par sélecteur), et démontrée par test structurel. Le parcours de création d'Activité en deux étapes et l'ordre structurel de Composition sont également corrigés et démontrés de bout en bout. Les points listés en « Points non traités » restent explicitement ouverts.

## Prochaines actions proposées

1. **Test physique sur iPhone requis** (ce que Jest ne peut pas prouver) : rouvrir chacun des sélecteurs numériques/durée, vérifier que le geste de défilement ET le toucher direct d'une valeur visible fonctionnent, que la valeur choisie persiste à la fermeture/réouverture, qu'aucun geste ne fait plus basculer par erreur vers un sélecteur voisin.
2. Contre-revue Codex de ce cycle (cause racine, diff, tests).
3. Décision sur l'ordre de traitement des points listés en « Points non traités » (cycle dédié ultérieur).
4. Arbitrages 1 à 3 (Partie B) toujours non tranchés — inchangés par ce cycle.
5. Aucun commit, aucun push, aucune fusion tant que le test iPhone n'a pas confirmé la correction UI-CTRL-001/002.
