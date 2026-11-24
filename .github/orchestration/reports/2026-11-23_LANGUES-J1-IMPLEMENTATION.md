# 2026-11-23 — LANGUES-J1-IMPLEMENTATION : KODJO en anglais (interface)

## Identification

- **Mission** : étape J1 du chantier langues, plan approuvé par Hermann le 23/11/2026 (glossaire validé, accord pour `visualAssets.test`, ligne Langue après la fusion des Programmes).
- **Plan** : `docs/preparation/langues/J1-PLAN-KODJO-EN-ANGLAIS-2026-11-23.md`
- **Branche** : `claude/exciting-lovelace-iyn2wf`
- **Commit de départ** : `24c0cb8`

## Périmètre

- **Demandé** : éléments 1 à 12 du plan.
- **Traité** : éléments 1 à 9, 11 et 12.
- **Non traité** : élément 10, la ligne Langue de Profil › Compte. Elle attend la fusion des Programmes ; c'est la décision de Hermann.

## Modifications (commits)

| Commit | Contenu |
|---|---|
| `5e5c4ff` J1.1 | `expo-localization` 57.0.2 et plugin `supportedLocales` (fr, en). `locale.ts` : première langue du téléphone prise en charge, sinon l'anglais ; balise régionale. Simulacre français pour Jest. |
| `a88bf7d` J1.2 | Un catalogue par langue (`resources/bundles.ts`), avec repli anglais clé par clé (`withFallback`). `executionParameters` est sorti à l'identique. |
| `6cdb86f` J1.3 | `plural.ts`, appliqué aux choix « n > 1 » des écrans. `format.ts` : séparateur décimal et dates. Voix de la langue de l'interface (`bestVoiceFor`). |
| `c0f5ea3` J1.4 | Textes iOS traduits (`locales/*.json`, `CFBundleAllowMixedLocalizations`). Sous-titre de l'écran de lancement placé dans le catalogue, et `visualAssets.test` adapté (accord de Hermann). Table de largeur complétée des minuscules mesurées dans la police. |
| `d2964c3` J1.5 | Catalogue anglais complet, environ 1 400 textes, en quatre parties traduites en parallèle selon le glossaire. Tests de parité et de démarrage en anglais. |
| commit final | Documentation (classe D au chapitre 12, glossaire au chapitre 07), suivi, cahier de recette, présent rapport. |

Les changements de lockfile dus à la version de npm de l'environnement (`libc`) ont été écartés : seules les entrées `expo-localization` et `rtl-detect` ont été ajoutées.

## Preuves et tests

- Référence avant J1 : 399 suites, 6 168 tests.
- Après J1 : **405 suites, 6 184 tests passés, 32 ignorés**. `tsc` : 0 erreur. `eslint` : 0 erreur.
- Nouveaux tests :
  - `locale.test`
  - `fallback.test`
  - `plural.test`
  - `format.test`
  - `translationParity.test` (mêmes clés, variables, fonctions ; aucun caractère français en anglais)
  - `englishDevice.test` (téléphone en-GB et ja-JP : catalogue, accords, formats, voix)
  - voix par langue dans `ExecutionSignalAdapter.test`
- **Prebuild iOS d'essai** :
  - `CFBundleLocalizations` contient fr et en, ce qui fait apparaître le réglage Langue de l'application ;
  - `InfoPlist.strings` est généré pour chaque langue.
- **Tests sensibles à la charge** : sur trois exécutions de la suite complète après la traduction, deux ont eu un échec d'un test de focus accessibilité de la Composition. Ce n'était pas le même test d'une fois à l'autre (`CompositionScreen.test` D-442, puis `recette1`), et chacun passe seul. La troisième exécution est entièrement verte. Le groupe Composition passait au commit précédent, sur une seule exécution. Attribution **plausible** : le chargement du catalogue anglais alourdit chaque fichier de test, ce qui expose des tests sensibles au temps. À surveiller.

## Choix de traduction à valider par Hermann

1. « Paramètres d'exécution » → « Execution settings » (« Settings » dans tous les libellés concernés).
2. Ordre des côtés : « DD… → GG… » → « AA… → BB… », et « DG → DG » → « AB → AB » (côtés 1 et 2, sans droite ni gauche).
3. « Passage » d'un cycle → « pass / passes » (terme absent du glossaire).
4. Point d'arrêt → « Hold » (glossaire) ; « Fin de séance » → « Workout end ».
5. « Annonces vocales » et « Guidage sonore » → tous deux « Voice guidance » (glossaire). Deux titres voisins deviennent donc identiques.
6. Ordinaux des annonces au-delà de dix séries : « 21th » au lieu de « 21st » (cas rare, à corriger si besoin).
7. Suppression de séries d'un Circuit : « Sets after set {n} will be deleted… » (pas d'ordinal anglais, la phrase est reformulée).
8. « Annuler » d'un message d'annulation (snackbar) → « Undo » ; partout ailleurs → « Cancel ».
9. « jusqu'à la cadence » → « until tempo » ; « Sur » (`execution.target`, clé inutilisée) → « Of ».

## Hypothèses non démontrées

- Rendu réel sur iPhone : longueurs des textes anglais, voix anglaise, réglage iOS de langue.
- Support de `toLocaleString` / `toLocaleDateString` par Hermes sur iPhone, utilisé pour le séparateur et les dates (documenté par Hermes).

## Restant

- Ligne Langue dans Profil › Compte, après la fusion des Programmes.
- Build EAS et recette : `_bmad-output/langues/implementation-artifacts/recette-iphone-langues-j1.md`, qui reprend la recette T1.
- Revue des choix de traduction ci-dessus.
- Les nouveaux textes de la branche Programmes devront passer au catalogue et être traduits lors de la fusion.

## Synchronisation code / documentation

- Classe **B** (décisions du 23/11) : déjà reportée au chapitre 07 (D0) ; glossaire ajouté comme règle 10.
- Classe **D** (choix techniques) : chapitre 12, section « Internationalisation ».

## Commit final et état Git

Voir le commit qui contient ce rapport sur `claude/exciting-lovelace-iyn2wf`.
