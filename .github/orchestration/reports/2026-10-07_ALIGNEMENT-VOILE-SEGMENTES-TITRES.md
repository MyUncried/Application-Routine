# Rapport de mission — Complément d’alignement : voile, repères, segmentés, titres

| | |
|---|---|
| Identifiant | `ALIGNEMENT-VOILE-SEGMENTES-TITRES` (2026-10-07) |
| Objectif | Appliquer au code les ajouts A, B, C et D de `DIFF-ALIGNEMENT-CODE-VOILE-2026-10-07.md`, puis prévisualiser sur Routine Dev |
| Cadre | Cadre alternatif maintenu par Hermann : analyse ciblée → alignement direct → vérifications → PR → prévisualisation Routine Dev. Aucun cycle V2/VNext, aucun workflow de planification ou de revue, aucun fichier de protocole modifié. |
| Branche | `feat/alignement-voile-segmentes-2026-10-07` (worktree dédié `C:/Dev/Application-routine-dsf-voile`) |
| Commit de départ | `a0a07602` (`origin/main`, fusion de la PR #326) |
| Figma | `G6RY5Ebhgwb4AHIOYDwwvg`, lecture seule |

## 1. État de départ

- PR #326 fusionnée dans `main` (`a0a07602`, vérifié par `git merge-base --is-ancestor`).
- Checkout principal (`main` local à `ce7d641d`, sans modification locale) non touché.
- Opérations actives : un seul run en cours, `KODJO VNext-12 disposable preparation` (branche de protocole, sans EAS). Aucune publication Routine Dev en cours.
- PR #328 (`docs/voile-modal-2026-10-07`, non fusionnée) : documentation seule sur les mêmes sujets, **aucun fichier de code** — pas de doublon. Elle prévoit aussi le passage du catalogue à deux options (FUNC-SEG-02) : changement fonctionnel, **hors périmètre** (le nombre d’options est préservé ici). Elle modifie le chapitre 12 : un conflit textuel avec les trois lignes ajoutées ici est possible à la fusion de l’une ou de l’autre.

## 2. Périmètre

**Demandé** : ajouts A, B, C, D uniquement. **Exclu** : rubrique « Éléments issus des audits », pauses, récupération, exécution directe, recherche, couleur des Séances, Tours, tout changement fonctionnel, de données, de navigation ou de calcul, placement du stepper (réserve reportée), anciens brief v2 et journal.

## 3. Références Figma consultées (lecture seule)

| Référence | Usage |
|---|---|
| Variable `color/overlay/scrim` (`#1F2129` à 34 %) et `color/overlay-scrim` (`#14171F` plein) | Ajout A |
| `Exécution d’un exercice — Initial - Cercle avec Texte` `5021:5994`, repères `I6452:9958;6451:9961` à `…9967` | Ajout B : nature de « 62 % » |
| `DSF / Controls / Segmenté` `5548:9818` (8 variantes) ; `Deux options — 1 sélectionné` `7388:13779` et ses nœuds `7388:13780` à `7388:13783` ; ancienne variante `6981:14877` | Ajout C |
| Variable `VariableID:2290:54` = `color/background` ; `VariableID:6935:11530` = `color/text-label` | Ajout C |

## 4. Tableau des ajouts

| Ajout | Ce qui a été fait | Fichiers modifiés | Vérifications | Absent ou laissé inchangé |
|---|---|---|---|---|
| **A — Voile modal unique** | `colors.overlayScrim` : `rgba(20, 20, 20, 0.5)` → `rgba(31, 33, 41, 0.34)` (`color/overlay/scrim`). Tous les voiles existants consomment déjà ce token (8 consommateurs : `DecisionDialog` — dialogues d’abandon et de sortie d’exercice —, `WheelPickerOverlay`, `CatalogueCreateOptions`, `CompositionScreen` (options d’ajout), `BodyZonePickerModal`, `CategoryPickerModal`, `LabelPickerModal`, `ReferenceValueDialog`). Recherche : **aucune valeur locale de voile** restante dans `src` et `app`. `compositionDraggedCardShadow` (`#14171F` plein) inchangé, utilisé uniquement pour l’ombre de la carte déplacée. | `tokens.ts` ; chapitre 12 (ligne `color.overlayScrim`) | `tokensSpecification.test` ; tests `AbandonCreationModal`, `ExerciseExitConfirmModal` (voile = token, valeur exacte) | Le fond transparent de la zone de fermeture de la palette de couleur (Composition) n’est pas un voile visible : inchangé. Interactions, ouverture et fermeture des modales inchangées. Voiles des écrans non codés (calendrier, filtres, CE-UI-10) : absents du code. |
| **B — Repères du chronomètre** | **Aucune modification** : aucun chronomètre ni repère n’existe dans le code (écrans d’Exécution non codés). Figma établit que « 62 % » est l’**opacité du remplissage** `#BEC2CC` (`color/disabled`) des repères quart, moitié et trois quarts ; l’opacité du nœud reste 100 % (le repère de départ est `#8283F2` à 72 %, les repères intermédiaires ont une opacité de nœud de 40 %). | — | Recherche dans `src` et `app` (`chrono`, `timer`, `repère`, `tick`, `marker`) | Absent du code ; aucun écran créé. |
| **C — Contrôles segmentés** | `SegmentedControl` (composant partagé) : cadre blanc à 50 % (`color/background`, opacité de remplissage — pas d’opacité de conteneur), sans contour, rayon 14 ; marge 4, écart 4, hauteur 42, options 34 de rayon 10 ; option sélectionnée `#5F60EE` (`colors.selection`, inchangé) texte blanc ; options inactives sur fond `#EAEAFF` (couche fixe sous l’indicateur animé) texte `color/text-label` ; libellés Inter Semi Bold 16/20 (`type.segmentedLabel`). Nouveaux tokens `colors.segmentedSurface`, `colors.segmentedInactiveSurface`, `type.segmentedLabel` ; `dimensions.segmentedControl` : rayon 12 → 14, écart 14 → 4. | `SegmentedControl.tsx`, `tokens.ts` ; chapitre 12 (3 lignes) | `SegmentedControl.test` (3 nouveaux tests : pastilles, cadre, libellés ; centrage vertical adapté à un cadre sans contour) ; `CatalogueScreen.test`, `ExerciseScreen.test` (cadre) | Consommateurs : sélecteur de type de contenu du Catalogue (3 options, « Parcours » toujours désactivé) et Mode d’exécution de la Création d’activité. Nombre d’options, libellés, valeurs, sélection, animation, désactivation, accessibilité et répartition `flex: 1` inchangés. **Exceptions** : « Changement de côté » (`SideModeControl`, composant distinct) **non modifié** ; « Ordre des côtés » absent du code. Calendrier, Suivi, Statut des séances : non codés. |
| **D — Titres d’écran** | `screens.composition.title` « Composition d’une séance » → « Composer une séance » ; `screens.activities.editor.titleAdd` et `screens.exercise.titleAdd` « Ajouter un exercice » → « Créer un exercice ». « Modifier un exercice » inchangé. | `fr.ts` | `i18n` test (2 attentes adaptées) | La Composition affiche le même titre en création et en modification : le code ne porte pas de titre « Modification d’une séance », donc aucun titre « Modifier une séance » n’a été créé. Le bouton `composition.addActivity` « Ajouter un exercice » (action, pas un titre) et tous les identifiants sont inchangés. |

## 5. Tests adaptés — justification

| Test | Changement | Justification |
|---|---|---|
| `AbandonCreationModal`, `ExerciseExitConfirmModal` | voile attendu = `colors.overlayScrim` = `rgba(31, 33, 41, 0.34)` | Ajout A |
| `CatalogueScreen` (CAT-R01) | cadre du segmenté attendu blanc 50 % au lieu de blanc opaque | Ajout C (décision du diff, qui remplace la valeur de la contre-recette du 03/09) |
| `ExerciseScreen` (Mode d’exécution) | cadre blanc 50 %, contour 0 | Ajout C |
| `SegmentedControl` | épaisseur de contour 0 dans le calcul de centrage ; 3 nouveaux tests | Ajout C |
| `i18n` | « Composer une séance », « Créer un exercice » | Ajout D |

## 6. Résultats techniques

Base de comparaison : résultat de fusion `ce7d641d` + `6399a62d` contrôlé lors de la clôture de la PR #326 (même code applicatif que `a0a07602`), mêmes `node_modules`.

| Contrôle | Branche | Comparaison avec la base |
|---|---|---|
| `tsc --noEmit` | 1 erreur : `expo-image-picker` introuvable (`profilePhoto.ts`) | identique, aucune nouvelle erreur |
| `expo lint` | 1 erreur, même cause | identique |
| `jest --ci` | 85 suites, 3 en échec ; 1501 tests, 1500 réussis, 1 échec (`targetSchema`, CRLF du checkout Windows) ; `ProfileScreen.test` et `profilePhoto.test` non chargés (`expo-image-picker`) | mêmes échecs ; 3 tests ajoutés, tous réussis |

Aucune régression introduite. Les échecs listés sont préexistants et relèvent de l’environnement local. `ProfileScreen` ne consomme ni le segmenté ni le voile modifiés.

## 7. Hypothèses non démontrées et vérifications sur iPhone

- Libellés 16/20 dans des options étroites : à 360 pt, le catalogue (3 options) laisse environ 99 pt par option ; « Exercices » tient à la taille standard, le comportement à police agrandie n’est pas vérifié.
- Rendu du blanc à 50 % sur la zone de contexte du Catalogue et sur le fond blanc de la Création d’activité.
- Aucun rendu observé dans cette mission (pas de simulateur ni d’appareil).

## 8. Fichiers modifiés

`src/shared/ui/tokens.ts`, `src/shared/ui/SegmentedControl.tsx`, `src/shared/i18n/resources/fr.ts`, `docs/Specifications-fonctionnelles/12 – Architecture technique.md`, tests `SegmentedControl.test.tsx`, `CatalogueScreen.test.tsx`, `ExerciseScreen.test.tsx`, `AbandonCreationModal.test.tsx`, `ExerciseExitConfirmModal.test.tsx`, `src/shared/i18n/index.test.ts`, et ce rapport.

## 9. Commit et état Git

- Commit de livraison : `5b3fff072bac93356ee7d9ca73157f62523df302` (parent `a0a07602`), PR #331 ouverte vers `main`, **non fusionnée**.
- Le présent paragraphe et le § 10 sont ajoutés par un commit documentaire ultérieur, rattaché à `5b3fff07` ; il ne modifie que ce rapport.

## 10. Prévisualisation Routine Dev

**Autorisation** : Hermann a choisi la publication locale (« Local comme pour #326 ») et autorisé explicitement, le 2026-10-07, la publication OTA de la tête `5b3fff07` de la PR #331 sur le canal `review` de Routine Dev.

**Méthode** : le workflow `kodjo-routine-dev-environment-sync.yml` n’est pas applicable (il exige un run de revue V2 approuvé). Ses étapes de publication ont été reproduites à l’identique en local, sans modifier ni lancer de workflow : worktree détaché propre à `5b3fff07` (tête et propreté vérifiées), `npm ci`, vérification de la configuration Routine Dev (mêmes assertions que le workflow), puis `eas update --channel review --platform ios --environment development --non-interactive --json` avec `APP_VARIANT=development` et `eas-cli@21.7.1`. Il n’existe donc pas de run GitHub Actions pour cette publication.

| Contrôle préalable | Résultat |
|---|---|
| Tête de la PR #331 | `5b3fff072bac93356ee7d9ca73157f62523df302`, ouverte |
| Opérations actives | aucun run en cours ; aucune autre publication Routine Dev |
| Compatibilité avec le build installé (build iOS 5 `0a3ff6a7-a994-412d-aa07-cd11296ee8a7`, commit `10ac761e`, `runtimeVersion 1.1.0`) | `OTA_COMPATIBLE` (`classify-environment-update.js`), aucun fichier natif modifié ; `runtimeVersion` de la tête : `1.1.0` — **aucun build natif nécessaire** |
| Configuration Routine Dev | nom, bundle `com.ankusha.kodjo.dev`, projet EAS, URL de mise à jour, profil `review` autonome : conformes |

| Résultat | Valeur |
|---|---|
| Statut | **Publié** (« Published! », code 0) |
| Mise à jour EAS iOS | `01a1184a-65db-7b4d-8264-74e82e3b9af5` |
| Groupe | `bb450c53-5915-4f57-b173-eb2e400d53b0` |
| Canal / branche | `review` / `review` |
| Commit publié | `5b3fff072bac93356ee7d9ca73157f62523df302` (`gitCommitHash` enregistré par EAS) |
| Manifeste | https://u.expo.dev/update/01a1184a-65db-7b4d-8264-74e82e3b9af5 |
| Créée le | 2026-10-07T21:34:51Z |
| Contrôle après publication | `eas channel:view review` : mise à jour la plus récente du canal |

Non fait : fusion de la PR #331, modification de Routine stable, cycle V2/VNext. Le worktree temporaire de publication a été retiré.

**Charger la mise à jour sur iPhone** : ouvrir Routine Dev (build 5) avec le réseau actif, attendre 10 à 20 secondes, fermer complètement l’app depuis le sélecteur d’apps, la rouvrir ; recommencer une fois si rien ne change. Repère : le titre « Composer une séance » en création de séance.

**Vérifications iPhone limitées aux propriétés modifiées** (non vérifiées à ce jour) :

1. A — voile plus clair et légèrement bleuté (`#1F2129` à 34 %) derrière les dialogues d’abandon, la roulette, les feuilles Catégorie, Zones corporelles et Étiquettes, et les options de création du Catalogue.
2. C — sélecteur du Catalogue et Mode d’exécution de la Création d’activité : cadre blanc translucide sans contour, options inactives lavande `#EAEAFF`, libellés Semi Bold 16, sélection indigo qui glisse comme avant ; « Parcours » toujours grisé et inactif.
3. D — titres « Composer une séance » et « Créer un exercice ».

## 11. Clôture — validation et fusion (2026-10-07)

**Décision d’Hermann** : le complément d’alignement A à D, publié sur Routine Dev depuis `5b3fff07` (mise à jour EAS `01a1184a-65db-7b4d-8264-74e82e3b9af5`), est **validé** ; clôture et fusion de la PR #331 autorisées. Cette validation est **limitée au complément livré** : elle n’atteste pas une conformité globale à Figma et ne rouvre aucun écart précédemment reporté (notamment la réserve du stepper du Profil, PR #326). Aucune recette supplémentaire, aucun correctif, aucune republication.

### 11.1 Résultat de fusion avec `main`

- `main` a avancé pendant la mission : PR #328 (documentation) fusionnée (`009d74b1`).
- Conflit unique : chapitre 12, ligne `color.overlayScrim`. Même valeur des deux côtés (`rgba(31, 33, 41, 0.34)`) ; résolution : description normative de #328 conservée (voile unique, y compris CE-UI-10) + trace de son application dans le code par l’ajout A. Commit de résolution `2be9be4c` (fusion de `origin/main` dans la branche).
- Le Catalogue à deux options documenté par #328 (FUNC-SEG-02) **n’est pas introduit** dans le code : le sélecteur garde ses trois options.
- Code applicatif (`src`, `app`, `assets`, configuration) **identique** à `5b3fff07`, la tête publiée (`git diff` vide).

### 11.2 Contrôles sur le résultat de fusion (`2be9be4c`)

| Contrôle | Résultat | Comparaison avec la base |
|---|---|---|
| `tsc --noEmit` | 1 erreur : `expo-image-picker` introuvable | identique, aucune nouvelle |
| `expo lint` | 1 erreur, même cause | identique |
| `jest --ci` | 3 suites en échec (`targetSchema` CRLF ; `ProfileScreen`, `profilePhoto` non chargés) ; 1500/1501 | mêmes échecs d’environnement |
| `tokensSpecification.test` sur le chapitre 12 fusionné | réussi | — |

Aucune nouvelle régression ; seuls les échecs d’environnement déjà reproduits sur la base subsistent.

### 11.3 Restant ouvert

- Écarts reportés de la PR #326 (stepper du Profil, points du § 6 de son rapport) : non rouverts.
- Catalogue à deux options (FUNC-SEG-02) : évolution fonctionnelle à traiter séparément.
- Repères du chronomètre (ajout B) et voiles/segmentés des écrans non codés : à appliquer lors du développement de ces écrans.
- Échecs d’environnement locaux (`expo-image-picker` absent des `node_modules` partagés ; empreinte `targetSchema` faussée par CRLF).

Le commit de fusion de la PR #331 est communiqué dans un commentaire de la PR et dans le message de clôture.
