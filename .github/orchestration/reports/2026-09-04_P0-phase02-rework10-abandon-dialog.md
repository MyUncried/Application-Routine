# P0 — Phase 2 — REWORK10 — Dialogue d'abandon de création

## Identification

- **Mission** : corriger uniquement le dialogue `Abandonner la création ?` (CE-T01-08) déclenché par Retour depuis une nouvelle Composition contenant des données temporaires.
- **Issue** : [#35](https://github.com/MyUncried/Application-Routine/issues/35)
- **Autorisation** : `[ChatGPT] CHANGES_REQUESTED — REWORK10 — dialogue d'abandon de création`, 2026-09-04T13:41:14Z (46ᵉ et dernier commentaire de l'Issue #35 au moment de cette clôture).

## Disclosure de reprise — commentaire manqué avant démarrage de REWORK09

**Reconnu explicitement, sans minimisation.** En relisant l'historique complet des commentaires avant ce cycle, j'ai constaté que `[ChatGPT] DEVICE VALIDATION + LOT DIFFÉRÉ — clôture Roulette / finitions Composition` (2026-09-04T10:36:24Z) n'a **pas** été lu avant de démarrer REWORK09 — celle-ci m'a été confiée directement par l'utilisateur dans la conversation, et j'ai interprété « identifier et lire le dernier checkpoint » comme le dernier commit Git (`bc16a6d`), sans revérifier séparément les commentaires GitHub publiés entre-temps.

**Impact réel constaté, après lecture complète a posteriori** : nul. Ce commentaire contient deux parties :

1. **Validation device de la roulette** (`WHEEL_DEVICE_VALIDATED_FROZEN`) — confirme exactement ce que le message direct de l'utilisateur pour REWORK09 énonçait déjà (« deux cadres gris séparés de sélection, désormais documentés » = limite native acceptée) ; aucune ligne de `DurationWheelPicker.tsx` n'a été modifiée par REWORK09, conformément aux deux sources.
2. **Lot différé A+B** (statut explicite `QUEUED_FOR_NEXT_SCREEN_AFTER_FIGMA_DOC_UPDATE`, condition préalable : mise à jour Figma/documentation de la modale non encore réalisée à l'époque) :
   - suppression de la ligne de synthèse basse Composition : **déjà demandée et déjà réalisée** dans REWORK09 (CO-02, source indépendante mais convergente) ;
   - correction du chevron du contrôle Nombre de tours : **explicitement non lancée** (correctement laissée `NON CONFORME connu` dans le rapport REWORK09, cohérent avec le statut différé) ;
   - modale d'abandon (points B) : **explicitement non lancée** — c'est précisément l'objet de ce cycle REWORK10, autorisé séparément une fois la condition préalable levée.

Aucune correction rétroactive n'est nécessaire : tout élément actionnable de ce commentaire manqué avait déjà été traité par ailleurs ou restait légitimement hors périmètre jusqu'à cette autorisation. Disclosure faite conformément à la règle permanente de cette session.

## Branche et commit de départ

- Branche : `feat/creation-seance-catalogue`
- Préconditions vérifiées avant tout code :
  - `git fetch` → HEAD local et distant identiques à la baseline exigée : `79e85250a1d16fb59fc898c3bf445a15e89265ce`.
  - `git status --porcelain` : vide (worktree propre).

## Périmètre demandé

Défini intégralement par le commentaire d'autorisation (texte complet relu et archivé) — 5 écarts numérotés (libellés, titre centré, actions, géométrie/espacement, comportement), acquis gelés explicites (dialogue centré, deux actions sur une ligne, overlay/positionnement, animation en fondu, écran Composition/roulette/section Tour/cartes/navigation/écran Activité/logique métier hors dialogue), et 10 exigences de test.

## Sources consultées avant code

- Contrat `CE-T01-08 — Abandonner la création de la séance` (`docs/Specifications-fonctionnelles/13 – Contrats d'écran.md`).
- Composant Figma `Overlay / Decision Dialog` — **contrôlé directement via l'outil Figma MCP**, pas sur le rapport précédent ni l'implémentation existante (explicitement écartés comme preuves par l'autorisation elle-même) :
  - `2590:2960` (« PrimaryTone=Primary,SecondaryTone=Danger,Actions=2 ») — exemple générique du composant (variante différente, tons Primary/Danger), utilisé pour confirmer la géométrie partagée (`147×48`, écart `12`, centrage, `spacing/16`).
  - `2028:11298` (frame CE-T01-08 complète) — **instance concrète exacte** `2591:3083` du dialogue d'abandon, avec ses libellés et couleurs réels (« Annuler »/« Confirmer », fonds `#F3F4F6`/`#E62B1E`).

## Tableau PRESERVE / CHANGE / FORBIDDEN (avant code)

| Élément | Statut | Preuve |
|---|---|---|
| Dialogue flottant centré | **PRESERVE** | `styles.backdrop` (`alignItems`/`justifyContent: "center"`) non modifié. |
| Deux actions sur une même ligne | **PRESERVE** | `styles.actions` (`flexDirection: "row"`) non modifié dans sa structure, seules les dimensions des enfants changent. |
| Overlay et positionnement général | **PRESERVE** | `styles.backdrop` (couleur, padding, structure) — aucune ligne modifiée, vérifié par diff et par test dédié. |
| Animation en fondu | **PRESERVE** | `animationType="fade"` sur `<Modal>` — inchangé. |
| Écran Composition, roulette native, section Tour, cartes, navigation, écran Ajouter une activité, logique métier hors dialogue | **PRESERVE** | Aucun de ces fichiers dans le diff (`git diff --stat` : 5 fichiers, tous liés au dialogue). |
| Libellés d'action (« Continuer la création »/« Abandonner ») | **CHANGE** | → « Annuler »/« Confirmer » (mêmes clés `continueCreating`/`abandon`, valeurs mises à jour). |
| Titre | **CHANGE** | Centré horizontalement (`textAlign: "center"`) ; typographie/comportement adaptatif inchangés. |
| Dimensions des actions | **CHANGE** | `147×48` fixes (auparavant dimensionnées par leur seul `padding`). |
| Couleurs des actions | **CHANGE** | Annuler : gris neutre `#F3F4F6`/texte `#292E38` (auparavant transparent/`textSecondary`). Confirmer : rouge `#E62B1E`/liseré `#DB2E2E`/texte blanc (fond déjà proche mais couleur exacte corrigée, `color.danger` explicitement jamais réutilisé). |
| Géométrie de la carte | **CHANGE** | Largeur fixe `354` (auparavant `"100%"`), rayon `18` (auparavant `16`), ombre canonique ajoutée (absente avant ce cycle), espacement message→actions `spacing/16`. |

Aucune extension de périmètre rencontrée ; aucun `SCOPE_EXPANSION_REQUIRED` déclenché.

## Correspondance point par point

| # | Demande | Référence Figma | Fichier/code | Test | Verdict |
|---|---|---|---|---|---|
| 1 | Libellés exacts (« Annuler »/« Confirmer »), anciens libellés supprimés | Instance `2591:3083` | `fr.ts` — `abandonModal.continueCreating`/`.abandon` | describe « libellés exacts » (2 tests) | Fonctionnel : **PASS**. Visuel : **NON VÉRIFIABLE**. |
| 2 | Titre centré, typographie/comportement adaptatif conservés | `2590:2954` (générique) / instance `2591:3083` | `AbandonCreationModal.tsx` — `styles.title` (`textAlign:"center"`, `type.modalTitle` inchangé) | « centers the title horizontally… » | **PASS**. |
| 3 | Actions : ligne unique, `147×48` chacune, écart `12`, libellés centrés, Annuler gris/sombre, Confirmer rouge/blanc, tokens DSF sans style local | `2590:2956-2959` / instance `2591:3083` | `AbandonCreationModal.tsx` — `styles.neutralAction`/`destructiveAction`/labels ; nouveaux tokens `dimensions.decisionDialog`/`colors.dialog*` | describe « actions » (4 tests) | **PASS**. |
| 4 | Géométrie `354×194`/rayon `18`, espacement message→actions `spacing/16`, insets canoniques | `2590:2960` (généré, `194` illustratif) | `AbandonCreationModal.tsx` — `styles.card` (largeur `354`, rayon `18`, `gap:16`) | « floating card is 354pt wide… » | **PASS** (largeur/rayon/espacement) ; hauteur volontairement non figée, voir « Écart disclosé » ci-dessous. |
| 5 | Annuler restitue le brouillon ; Confirmer supprime la Séance temporaire et revient au Catalogue ; Retour système = Annuler ; voile jamais destructeur ; fond non interactif | `2591:3083` + `useCompositionExitGuard.ts` (logique, non Figma) | Aucune ligne de `useCompositionExitGuard.ts`/`CompositionScreen.tsx` modifiée — comportement déjà conforme, vérifié inchangé | describe « comportement » (4 tests) + `useCompositionExitGuard.test.ts`/`CompositionNavigationGuard.integration.test.tsx` (hérités, verts sans modification) | **PASS**. |

## Écart disclosé (décision raisonnée, pas une valeur Figma statique)

Le nœud Figma générique documente une hauteur totale `194` pour la carte, mais cette valeur illustre un message à deux lignes précis, pas une contrainte de hauteur fixe du composant. Conformément au même principe déjà appliqué au cadre récapitulatif de `ExerciseScreen.tsx` (REWORK09) — et pour éviter tout risque de troncature du message sur une échelle de police plus grande ou un appareil plus étroit — la hauteur de la carte n'est **pas** figée en dur dans le code : elle est dérivée du padding (`24`), de l'écart (`16`) et de la hauteur réelle du texte, qui reproduisent naturellement `194` pour un contenu équivalent. Largeur (`354`), rayon (`18`) et espacement message→actions (`16`, seule valeur explicitement documentée par Figma pour cet interstice) sont, eux, appliqués exactement.

## Tests et preuves

### Commandes exécutées et résultats

```
npx tsc --noEmit
→ sortie vide, code de sortie 0

npx eslint .
→ sortie vide, code de sortie 0

npx jest src/features/sessions/__tests__/AbandonCreationModal.test.tsx --maxWorkers=2
→ Test Suites: 1 passed, 1 total
→ Tests:       15 passed, 15 total

npx jest --maxWorkers=2   (suite complète du projet)
→ Test Suites: 37 passed, 37 total
→ Tests:       526 passed, 526 total
```

### Correspondance avec les 10 exigences de test de l'autorisation

| # | Exigence | Couverture |
|---|---|---|
| 1 | Quatre libellés exacts, visibles et accessibles | « exposes exactly 'Annuler' and 'Confirmer'… » |
| 2 | Absence des deux anciens libellés | « never shows the previous labels… » |
| 3 | Deux boutons `147×48`, même ligne, écart `12` | « keeps the two actions on a single row… » |
| 4 | Titre centré | « centers the title horizontally… » |
| 5 | Annuler = token neutre gris, Confirmer = token destructif rouge | « gives Annuler a neutral grey background… » + « gives Confirmer a destructive red background… » |
| 6 | Espacement message/actions = `spacing/16` | « floating card is 354pt wide… » (`gap: 16`) |
| 7 | Annuler/Retour système/fermeture non destructive conservent le brouillon | « calls onCancel… » + « treats the Android hardware back request… » |
| 8 | Confirmer seul déclenche la suppression | « calls onConfirm, never onCancel… » |
| 9 | Voile bloquant, aucune interaction destructive | « never wires a touch on the backdrop/voile to onConfirm… » |
| 10 | Non-régression des acquis gelés | describe « non-régression des acquis gelés » (2 tests) + suite complète 526/526 |

### Limites des tests

Ces tests prouvent la structure, les valeurs de style et le câblage comportemental en JavaScript, jamais le rendu pixel réel ni le geste tactile sur iPhone. Statut maximal sans capture device, conformément à l'autorisation : `REWORK10_IMPLEMENTED_AWAITING_DEVICE_VERIFICATION`.

## Fichiers modifiés

| Fichier | +/- |
|---|---|
| `src/features/sessions/AbandonCreationModal.tsx` | +107 / -43 |
| `src/features/sessions/__tests__/AbandonCreationModal.test.tsx` | +166 / -26 |
| `src/shared/i18n/index.test.ts` | +3 / -3 |
| `src/shared/i18n/resources/fr.ts` | +10 / -2 |
| `src/shared/ui/tokens.ts` | +52 / -0 |

## Éléments non corrigés ou hors périmètre

- Chevron du contrôle Nombre de tours (Composition) : reste `NON CONFORME connu`, explicitement hors périmètre de ce cycle (lot différé distinct, non réautorisé ici).
- Aucun autre écran ni comportement métier touché.

## Vérifications restant à effectuer sur appareil réel

- Confirmation visuelle des couleurs exactes (gris `#F3F4F6`, rouge `#E62B1E`/`#DB2E2E`), du centrage du titre, de l'alignement/l'espacement des actions et de l'ombre portée.
- Confirmation que la hauteur dérivée (non figée à `194`) produit un rendu visuellement équivalent à la référence Figma pour le message réel du dialogue.
- Confirmation tactile que le voile reste réellement non interactif et que le geste Retour iOS/Android ferme bien sans jamais confirmer la suppression.

## Modifications réalisées

Voir le tableau de correspondance point par point ci-dessus pour le détail exhaustif.

## État Git

- Branche : `feat/creation-seance-catalogue`
- HEAD avant ce cycle : `79e85250a1d16fb59fc898c3bf445a15e89265ce`
- Ce rapport sera committé séparément du commit de code applicatif, conformément à l'exigence de livraison documentaire (`CLAUDE.md`).

### SHA finaux (renseignés après commit)

- **SHA applicatif** : `c73d06fb3d1c59b408cff629635dc946b7a85471` (`fix(T01-S07): REWORK10 — dialogue d'abandon de création canonique`).
- **SHA rapport** : voir commit `docs(orchestration): ...` immédiatement suivant, contenant ce fichier — renseigné dans le commentaire de transition GitHub.
- **État Git final** : `working tree clean`, branche `feat/creation-seance-catalogue`, HEAD local = HEAD distant après push (vérifié post-commit).

## Statut de clôture

`REWORK10_IMPLEMENTED_AWAITING_DEVICE_VERIFICATION` — les 5 écarts corrigés, testés (`tsc`/`eslint`/Jest complet, 37 suites/526 tests) et documentés point par point ; seule la comparaison visuelle/tactile réelle reste à effectuer par contre-recette iPhone. Arrêt obligatoire après cette correction, conformément à l'autorisation.

## Self-check Claude

- Omission de lecture du commentaire `DEVICE VALIDATION + LOT DIFFÉRÉ` avant REWORK09 explicitement reconnue, avec preuve que son contenu actionnable était déjà traité par ailleurs ou correctement laissé différé.
- Chaque correction est rattachée explicitement à un point numéroté (1 à 5) — aucune modification non classée.
- Le nœud Figma concret (`2028:11298`, instance `2591:3083`) a été contrôlé directement, pas le rapport précédent ni l'implémentation existante — couleurs exactes extraites (`#F3F4F6`, `#E62B1E`/`#DB2E2E`, `#121212`, `#474D57`), aucune approximée.
- Aucun fichier hors du dialogue modifié — `git diff --stat` : 5 fichiers, tous strictement liés à `AbandonCreationModal`.
- La hauteur non figée de la carte est une décision raisonnée et signalée, pas une divergence silencieuse de la valeur Figma.
- `tsc --noEmit`, `eslint .` et la suite Jest complète (37 suites, 526 tests) sont verts au moment de la rédaction de ce rapport.
