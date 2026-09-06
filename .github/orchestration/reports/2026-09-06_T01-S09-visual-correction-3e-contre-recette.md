# T01-S09 — correction VISUAL, 3e contre-recette (alignement Disclosure DSF + diagnostic couleur jaune)

## Identifiant et objectif de la mission

Session DEV-S09 `28152cdd-c52e-4452-aed2-728d0439e401`, protocole KODJO V1.4, tranche T01-S09, **3e contre-recette visuelle** (plan révisé `attempt=2`, `supersedes_plan_comment_id=5550898172`, `review_feedback_comment_id=5551083690`, feedback complémentaire post-`1f28a09`).

Objectif : appliquer exclusivement les corrections A/B ci-dessous sur le checkout Git courant pris comme seule source de vérité (la documentation `12`/`13` venant d'être rendue normative et déterministe par le commit `1f28a09`), en distinguant test historique obsolète et régression réelle :

- **A.** Catalogue — contrôle `Déployer` : remplacer le cadre non sourcé par une instance conforme à `Controls / Disclosure — Source exact`, avec géométrie/couleurs exactes pour `State=Collapsed` (`2537:1033`) et `State=Expanded` (`2537:1038`) ; supprimer l'analogie locale avec `exerciseParameterRow.chevronBox` et toute couleur/opacité non documentée (`#CDCEFA`, `0.45`) ; conserver comportements, cible tactile et accessibilité ; adapter les tests aux deux états et aux vrais tokens.
- **B.** Catalogue — couleur des Catégories, cas jaune : diagnostiquer pourquoi une Séance existante n'affiche pas le jaune alors qu'une Séance nouvellement créée le fait ; vérifier toute la chaîne (persistance → repository/service → modèle Catalogue → `SessionCard`), y compris les données historiques ; corriger uniquement si un défaut réel est démontré ; ajouter le test minimal du cas jaune (et, si pertinent, une Séance antérieure à S09) ; ne jamais adapter la couleur au contraste ni créer de variante.
- **C.** Hors périmètre : bouton `Ajouter` déjà conforme (non modifié) ; pas de suppression de Catégorie ; ni `start-kodjo.ps1` ni `migration001.ts` ni tout autre comportement S01-S08 non concerné ; aucune nouvelle décision `D-108` à `D-111` ; aucune modification documentaire hors contradiction factuelle démontrée.

Aucun S10, aucune nouvelle session, aucune modification de workflow, aucune finalisation (`FINALIZE`) — publication `IMPLEMENTATION_READY_FOR_REVIEW` uniquement.

## Branche et commit de départ

- Branche : `feat/creation-seance-catalogue`
- HEAD au début de cette mission (source de vérité annoncée) : `1f28a09ab5ba9f52a3666e17193d0ba99c2aad14` (« docs(s09): aligner le catalogue sur le composant Disclosure du DSF »)
- Worktree strictement propre à l'entrée de cette mission (`git status --short` vide, vérifié).

## Périmètre réellement traité

1. **Point A** : lecture du diff documentaire du commit `1f28a09` (docs `12`/`13`) pour extraire les quatre valeurs canoniques exactes (`#FBFCFF` fond, `#D6D9E3` bordure `1pt` collapsed, `#8283F2` bordure `2pt` expanded, `#8282F2` chevron collapsed, chevron expanded de même couleur que sa bordure). Création d'un composant partagé `src/shared/ui/DisclosureControl.tsx`, instance générique de `Controls / Disclosure — Source exact`, réutilisant l'asset SVG existant `control-chevron-down`/`control-chevron-up` (jamais redessiné) recoloré via `tintColor` et affiché à une taille dérivée (`16`, calculée depuis le `viewBox` réel de l'asset) pour obtenir exactement le chevron `8 × 4` documenté. `SessionCard.tsx` délègue désormais entièrement son contrôle `Déployer` à ce composant, à l'état `expanded={false}` (condensé initial inchangé). Ajout des tokens `colors.disclosure*`/`dimensions.catalogueDisclosure` (4 couleurs, 1 groupe de dimensions) et suppression de toute référence à `colors.tourSurface`/opacité `0.45` pour ce contrôle.
2. **Point B** : audit exhaustif de la chaîne complète — schéma SQL (`sessions.color`, `CHECK` exhaustif sur les 12 valeurs de `SESSION_COLORS`, aucun défaut ni valeur nulle possible), `migration002.ts` (n'altère jamais `sessions`), requête `listActive()` et `mapSummaryRow()` (`SqliteSessionRepository.ts`), jusqu'à `SessionCard.tsx` (rendu direct de `session.color`, aucune transformation). **Aucun défaut de restitution, de valeur par défaut ou de compatibilité de données historiques n'a été démontré dans le code lu** — voir « Constats » ci-dessous. Ajout du test minimal demandé (cas jaune exact `#F7D154`, plus une variante « Séance sans Catégorie ni Zone corporelle », représentative d'une donnée antérieure à la fonctionnalité Catégories de T01-S09) dans `SqliteSessionRepository.test.ts` et `SessionCard.test.tsx` (couleur de la bande ET du segment Catégories).
3. **Point C** : aucune modification hors périmètre ; aucune nouvelle décision créée (`D-108`–`D-111` absents du dépôt, vérifié) ; `start-kodjo.ps1`/`migration001.ts` non touchés ; documentation non modifiée (déjà normative depuis `1f28a09`, aucune contradiction résiduelle trouvée).

## Constats

- **Point A** : le défaut signalé était réel — la 2e contre-recette avait réintégré un cadre visible, mais en empruntant par analogie un token d'un AUTRE composant DSF (`Activity / Parameter Row`, `exerciseParameterRow.chevronBox`/`colors.tourSurface`) et une opacité `0.45` non documentée pour ce contrôle. Corrigé par l'introduction d'un composant dédié réutilisant les quatre valeurs canoniques désormais normatives.
- **Point B** : **aucun défaut de code n'a pu être démontré par lecture statique.** La chaîne complète (contrainte SQL exhaustive sans défaut possible → sélection SQL directe de `sessions.color` sans transformation ni `COALESCE` → recopie telle quelle dans `SessionSummary.color` → rendu direct `backgroundColor`/`color: session.color` dans `SessionCard.tsx`) ne contient, à la lecture, aucun point où une valeur `#F7D154` pourrait être perdue, remplacée par un défaut, ou transformée. Aucune table ni migration n'introduit de valeur par défaut pour cette colonne. Le comportement rapporté (une Séance existante précise n'affichant pas le jaune) n'a donc pas pu être reproduit ni expliqué par le code source disponible dans ce checkout — il relève probablement d'un état de données propre à l'appareil/l'installation ayant servi à la contre-recette (valeur réellement persistée différente de celle attendue par l'utilisateur, ou état antérieur à un correctif déjà présent dans ce commit), non reproductible par analyse statique du dépôt. Conformément à l'instruction explicite (« Corriger uniquement si un défaut... est démontré »), **aucun changement de code spéculatif n'a été appliqué** pour ce point — seule la couverture de test manquante (jusqu'ici `summary.color` n'était jamais assertée par aucun test de `listActive()`) a été ajoutée, verrouillant la chaîne pour la valeur jaune et pour une Séance sans Catégorie/Zone (proxy représentatif d'une donnée antérieure à la fonctionnalité).

## Preuves et tests

- Lecture du diff exact du commit `1f28a09` (`git show HEAD -- "docs/.../12 – Architecture technique.md"` et `"...13 – Contrats d'écran.md"`) pour extraire les valeurs normatives sans aucune approximation.
- Lecture de `control-chevron-down.svg`/`control-chevron-up.svg` (contenu brut) pour vérifier le `viewBox` (`24 × 24`) et les coordonnées exactes du tracé (`M6 9L12 15L18 9` / `M6 15L12 9L18 15`, occupant `12 × 6` en leur centre) — base du calcul `chevronDisplaySize = 24 × (8/12) = 16`, documenté dans le composant.
- Lecture exhaustive de `migration001.ts`/`migration002.ts` (contrainte `CHECK` sur `sessions.color`, absence de toute altération de la table `sessions` par la migration additive), `SqliteSessionRepository.ts` (`listActive()`, `mapSummaryRow()`), `SessionCard.tsx` (rendu direct du champ) — aucune étape de perte/transformation identifiée.
- `grep` exhaustif après modification pour confirmer l'absence de toute référence résiduelle à `colors.tourSurface`/opacité `0.45` pour ce contrôle, l'absence de toute nouvelle décision `D-108`–`D-111`, l'absence de modification de `start-kodjo.ps1`/`migration001.ts`.
- Ajout de `src/shared/ui/__tests__/DisclosureControl.test.tsx` (9 tests : géométrie/couleurs des deux états, cible tactile, comportements `onPress`/`disabled`) ; mise à jour de `SessionCard.test.tsx` (le test de cadre chevron désormais obsolète — `colors.tourSurface`/`28×28`/`radius 6` empruntés à tort — est remplacé par un test vérifiant l'instance `DisclosureControl` avec les vrais tokens ; ajout d'un test dédié à la restitution de la couleur jaune sur la bande ET le segment Catégories) ; ajout de 2 tests dans `SqliteSessionRepository.test.ts` (`listActive()` restitue `#F7D154` exactement, y compris sans Catégorie ni Zone corporelle).
- **Aucune exécution réelle de `Jest`/`tsc` n'a pu être obtenue dans cette session** : `npx jest --runInBand <fichiers ciblés>` et `npx tsc --noEmit` ont été systématiquement refusés par le système de permission (« This command requires approval »), via Bash et PowerShell, identique à la contrainte déjà documentée dans les missions précédentes de cette session.

## Hypothèses non démontrées

- La cause exacte du défaut rapporté au point B (Séance existante n'affichant pas le jaune) reste non résolue : soit une donnée réellement différente de `#F7D154` sur l'appareil ayant servi à la contre-recette, soit un état antérieur déjà corrigé par un commit inclus dans ce checkout, soit un défaut de rendu natif (cache d'image, recomposition différée) non observable par lecture statique. Aucune preuve device n'a été produite dans cette session pour trancher.
- Le comportement d'`expo-image`'s `tintColor` sur les deux SVG monochromes réutilisés (`control-chevron-down`/`-up`) est supposé fiable sur la base du mécanisme déjà em­ployé avec succès pour le chevron du contrôle Tour (`CompositionScreen.tsx`) — non revérifié par capture device dans cette session.

## Modifications réalisées

1. **`src/shared/ui/DisclosureControl.tsx`** (nouveau, applicatif) — composant partagé, instance de `Controls / Disclosure — Source exact`, deux états.
2. **`src/shared/ui/tokens.ts`** (applicatif) — ajout de `colors.disclosureBackground`/`disclosureBorderCollapsed`/`disclosureBorderExpanded`/`disclosureChevronCollapsed` et `dimensions.catalogueDisclosure`.
3. **`src/features/sessions/SessionCard.tsx`** (applicatif) — délègue le contrôle `Déployer` à `DisclosureControl` ; ajout d'un `testID` sur la bande de couleur (`session-card-color-bar`, nécessaire à la nouvelle couverture du point B) ; suppression du cadre ad hoc et de ses styles associés ; documentation mise à jour.
4. **`src/shared/ui/__tests__/DisclosureControl.test.tsx`** (nouveau) — 9 tests.
5. **`src/features/sessions/__tests__/SessionCard.test.tsx`** — test de cadre obsolète remplacé ; test de restitution de la couleur jaune ajouté.
6. **`src/infrastructure/database/__tests__/SqliteSessionRepository.test.ts`** — 2 tests ajoutés à `listActive()` pour la couleur jaune.

Aucun fichier de `S01`–`S08` touché hors `SessionCard.tsx`/tokens partagés déjà dans le périmètre de cette correction. `migration001.ts` et `start-kodjo.ps1` non modifiés. Aucune nouvelle décision créée. Aucun fichier `.github`/workflow modifié. Aucun développement S10.

## Éléments non corrigés ou hors périmètre

- Point B : aucun changement de code appliqué, faute de défaut démontré (voir « Constats »). Si le défaut se reproduit sur un appareil réel après cette mission, une investigation device dédiée (inspection directe de la valeur `sessions.color` en base sur l'appareil concerné) reste nécessaire avant tout correctif supplémentaire.
- Bouton `Ajouter` (point C) : non modifié, conforme.
- Suppression de Catégorie : non développée (MVP bis).

## Vérifications restant à effectuer sur appareil réel

- Exécution réelle des tests ciblés, Jest complet et `npx tsc --noEmit` — **bloqués dans cette session** faute de permission d'exécution de processus.
- Vérification visuelle sur appareil/simulateur réel des deux états `Collapsed`/`Expanded` du contrôle `Déployer` (aucun état `Expanded` n'est aujourd'hui atteignable en usage réel, le contrôle restant désactivé — vérifiable uniquement via l'outillage de développement ou un futur écran de détail).
- Investigation device de la Séance existante concernée par le point B : lecture directe de `sessions.color` en base sur l'appareil réel pour déterminer la valeur réellement persistée.

## Fichiers modifiés

```
 M src/features/sessions/SessionCard.tsx
 M src/features/sessions/__tests__/SessionCard.test.tsx
 M src/infrastructure/database/__tests__/SqliteSessionRepository.test.ts
 M src/shared/ui/tokens.ts
?? src/shared/ui/DisclosureControl.tsx
?? src/shared/ui/__tests__/DisclosureControl.test.tsx
```

## Commit final

Conformément à l'instruction explicite (« Ne committer/pousser que si les contrôles sont verts... »), et les contrôles Jest/TypeScript n'ayant pas pu être exécutés dans cette session (blocage de permission), **aucun des fichiers ci-dessus n'a été commité**.

**`ORCHESTRATION_FAILURE` ponctuel et disclosé** : ce rapport devait être committé isolément malgré l'absence de contrôles verts sur le reste (`DELIVERY_REPORT_GATE`, non suspendu implicitement). `git add`/`git commit` ont été refusés par le système de permission de cette session, identique au blocage déjà rencontré pour l'exécution de tests dans les missions précédentes — **ce rapport reste un fichier non suivi (`??`) dans le worktree**, à committer par l'étape/l'acteur suivant disposant des permissions nécessaires.

## État Git

- Branche : `feat/creation-seance-catalogue`
- HEAD : `1f28a09ab5ba9f52a3666e17193d0ba99c2aad14` (inchangé — aucun commit réalisé dans ce run)
- `git status --short` à l'issue de cette mission :
  ```
   M src/features/sessions/SessionCard.tsx
   M src/features/sessions/__tests__/SessionCard.test.tsx
   M src/infrastructure/database/__tests__/SqliteSessionRepository.test.ts
   M src/shared/ui/tokens.ts
  ?? src/shared/ui/DisclosureControl.tsx
  ?? src/shared/ui/__tests__/DisclosureControl.test.tsx
  ?? .github/orchestration/reports/2026-09-06_T01-S09-visual-correction-3e-contre-recette.md
  ```
