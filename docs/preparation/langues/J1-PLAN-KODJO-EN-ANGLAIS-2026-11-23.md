# J1 — KODJO en anglais (interface) : plan

> Chantier « Gestion des langues », étape 1 (`PLAN-GESTION-DES-LANGUES-2026-11-23.md` § 7, lots T2 + traduction anglaise de l'interface). Base : `98c0ae7` sur `claude/exciting-lovelace-iyn2wf` (= `main` `fe7d71d` + T1). Mode CLOUD, écrivain : cette session.
> **STATUT : PLAN_APPROVED** (23/11/2026). Réponses de Hermann : « j'ai validé les termes. » ; « oui je suis d'accord pour l'écran de lancement » ; « oui, je suis d'accord » (ligne Langue après fusion des Programmes).

## TÂCHE

L'application suit la langue du téléphone (français ou anglais), avec repli anglais ; voix dans la langue de l'interface ; formats régionaux ; ligne Langue dans Profil › Compte ; interface traduite en anglais. Règles : chapitre 07, « Gestion des langues — décisions de Hermann du 23/11/2026 », règles 1 à 4 et 8.

## RÉSULTAT ATTENDU SUR IPHONE

- iPhone en français : **aucun changement** (recette T1 reprise).
- iPhone en anglais (ou en langue non prise en charge, par exemple japonais) : interface et annonces vocales en anglais.
- Réglages iOS › Routine › Langue : propose Français / English ; changer relance l'app dans la langue choisie.
- **Restent en français en anglais, c'est prévu** : la phrase de synthèse des exercices (J2), les Catégories, Zones, Formats et contenus KODJO (J4), les contenus saisis par l'utilisateur (règle 5).

## PÉRIMÈTRE / FICHIERS

| # | Élément | Fichiers |
|---|---|---|
| 1 | Dépendance `expo-localization` (SDK 57, `npx expo install`) et config plugin `supportedLocales` : `fr`, `en` uniquement (une langue n'est déclarée qu'une fois traduite) | `package.json`, `app.json` |
| 2 | Résolution de la langue au démarrage : première langue du téléphone prise en charge, sinon anglais ; balise régionale (`fr-FR`, `en-GB`…) pour les formats et la voix. Fixe pendant la session (iOS relance l'app au changement). | nouveau `src/shared/i18n/locale.ts` |
| 3 | Catalogue par langue : `en.ts`, `enExecution.ts`, `enLibraries.ts`, et `executionParameters` sorti d'`index.ts` vers `frExecutionParameters.ts` / `enExecutionParameters.ts`. `strings` = langue résolue, complétée par l'anglais pour toute clé absente (repli, règle 3). | `src/shared/i18n/` |
| 4 | Accords : fonction `plural(n, { one, other })` par langue (fr et pt : 0 et 1 au singulier ; en, es, it, de : 1 seul). Remplace les choix `n > 1 ? pluriel : singulier` (résultat français identique). Les choix `=== 1` restent (déjà justes en anglais). | `src/shared/i18n/plural.ts`, sites d'appel |
| 5 | Formats : séparateur décimal et dates via `Intl` et la balise régionale, à la place de `"fr-FR"` / `replace(".", ",")` dans les écrans. Les formats du domaine (`exerciseLoad.ts`, phrase) restent français jusqu'à J2/J3. | `ImportedMovementBadge`, `FormatTables`, `useSheetKeyboard`, `frExecution` (`load`), tri `localeCompare` |
| 6 | Voix liée (règle 4) : langue de la synthèse = balise de l'interface ; meilleure voix installée de cette langue (généralisation de `bestFrenchVoice`). | `src/infrastructure/speech/ExecutionVoice.ts` |
| 7 | Textes iOS traduits : description du réseau local et des photos (`locales` d'Expo, `CFBundleAllowMixedLocalizations`). | `app.json`, nouveaux `locales/fr.json`, `locales/en.json` |
| 8 | Écran de lancement : « Votre assistant du quotidien » rejoint le catalogue. **Demande d'approbation explicite** : adapter `visualAssets.test` pour vérifier le texte dans le catalogue et non dans la source (seule attente de test modifiée). | `KodjoSplash.tsx`, `visualAssets.test.ts` |
| 9 | Largeur des options de charge : la table de lettres françaises de `loadOptionWidth.ts` est complétée pour les lettres anglaises (même police), sans changer les largeurs françaises. | `loadOptionWidth.ts` |
| 10 | **Ligne Langue** dans Profil › Compte : nom de la langue dans sa propre langue (« Français », « English »), toucher ouvre le réglage iOS de l'app. **Faite en dernier**, après fusion des Programmes dans `main` (l'onglet Compte n'existe que sur leur branche) et selon Figma. | écran Compte |
| 11 | Traduction anglaise de tous les textes du catalogue (≈ 2 900 lignes) par IA, à partir du **glossaire validé** (`GLOSSAIRE-EN-2026-11-23.md`). | `en*.ts` |
| 12 | Garde-fous : même jeu de clés et mêmes variables `{x}` en anglais qu'en français ; tests de résolution de langue, de repli, d'accords et de choix de voix. Les tests existants tournent en français (langue simulée). | tests |

**PRESERVE** : affichage et voix en français identiques ; mises en page, composants, primitives natives ; données (aucune migration). **FORBIDDEN** : sélecteur de langue dans KODJO, préférence de langue stockée (règle 2), traduction des contenus utilisateur, modification de la phrase de synthèse, des référentiels ou du domaine partagé avec l'administration.

## PLAN D'IMPLÉMENTATION (commits successifs)

1. Dépendance, config plugin et `locale.ts` + tests (résolution, repli).
2. Restructuration du catalogue par langue, sans traduction (anglais = copie temporaire du français, tests verts).
3. `plural`, formats régionaux, voix liée.
4. Textes iOS, écran de lancement (si approuvé), largeur des options.
5. Traduction anglaise selon le glossaire ; garde-fou de parité.
6. Ligne Langue dans Compte (après fusion des Programmes et Figma).
7. Cahier de recette J1 (BMAD) incluant la recette T1, rapport, build EAS à lancer par Hermann.

## MIGRATION / DONNÉES

Aucune.

## TESTS PRÉVUS

tsc, lint, suite Jest complète (référence 6 168 tests) ; nouveaux tests unitaires (§ 12) ; recette iPhone sur build EAS : français inchangé, anglais complet, réglage iOS, voix anglaise, langue non prise en charge → anglais.

## RISQUES

- **Textes anglais plus longs ou plus courts** : contrôle visuel en recette (boutons, pilules, segmentés, cartes).
- **Fusion des Programmes** (137 commits non fusionnés) : leurs nouveaux textes devront passer au catalogue et être traduits ; le garde-fou de T1 les signalera. Conflits possibles dans `fr.ts`.
- `Intl.PluralRules` non documenté par Hermes : évité (règles écrites à la main).
- Build natif nécessaire (`expo-localization`) : nouvelle installation sur l'iPhone.

## QUESTIONS POUR HERMANN

1. Valider le glossaire anglais (`GLOSSAIRE-EN-2026-11-23.md`).
2. Approuver la modification de `visualAssets.test` (élément 8), ou laisser l'écran de lancement en français jusqu'à plus tard.
3. Ligne Langue : attendre la fusion des Programmes (recommandé) ; Figma ou reprise d'une ligne existante du Compte ?

## STATUT

PLAN_READY_FOR_REVIEW
