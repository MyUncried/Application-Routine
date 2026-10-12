# PRE-3 (#340) — application des décisions du propriétaire du 12/10

## Identité de la mission

| Élément | Valeur |
|---|---|
| Identifiant | `PRE3-340_DECISIONS-PROPRIETAIRE` |
| Objectif | Consigner les décisions D-1 à D-9 de Hermann, les appliquer dans le périmètre autorisé, mettre à jour la documentation concernée, consolider les extensions encore nécessaires et préparer une recette ciblée. |
| Branche | `feat/pre3-exercice-20261009` (sans PR) |
| Tête de départ | `c8f81d9c` |
| Plan approuvé | `43e7b344` |
| Écrivain | Claude Code local, seul, worktree isolé sans conversion des fins de ligne |
| Limites | Aucune fusion, aucun `VISUAL_APPROVED`, aucun PRE-4. Les extensions X-1 à X-4 ne sont pas appliquées (les décisions ne valent pas accord global). |

## Périmètre

**Demandé** :
- consigner les décisions comme décisions explicites du propriétaire ;
- les appliquer dans le périmètre autorisé ;
- mettre à jour la documentation après réalisation ;
- consolider les extensions encore nécessaires (D-6 avec X-1) ;
- préparer une recette ciblée.

**Traité** :
- décisions consignées au registre du projet (D-336 à D-344) et au registre de recette (§7) ;
- réalisées : D-2, D-4, D-5, D-7, D-8 ; D-1, D-3 et D-9 n’exigeaient aucun changement de code ;
- **D-6 bloquée par X-1**, valeurs proposées sans être appliquées ;
- documentation mise à jour ;
- recette v3 préparée.

## Constats

- **D-8 et Catégorie créée puis ✕** : le contrat CE-UI-09 §4 et §5 et le comportement existant (création immédiate dans le référentiel) suffisent à trancher. ✕ n’annule que l’affectation ; la Catégorie créée reste dans le référentiel. Aucune ambiguïté restante, aucune suppression silencieuse.
- **D-2 et accessibilité** : sans message, la valeur à renseigner reste annoncée sur le réglage (« Valeur à renseigner ») et ✓ « indisponible ».
- **« Réduire les animations »** : aucune gestion n’existait dans le code. Un hook unique `useReduceMotion` a été ajouté et exporté par la feuille Paramètres, puis réutilisé par la feuille Catégorie, pour rester dans le périmètre.
- **Analyse historique** : il s’agit de changements de besoin décidés par le propriétaire, pas de défauts. Aucune attribution de régression n’est à faire.

## Modifications

**Code** (`4f1feebef8024fb2a8021d8df66594388af312d9`) :
- `ExecutionParametersSheet.tsx` : D-2, D-4 (`ClosingSelector`), D-5, D-7 et le hook `useReduceMotion`.
- `CategoryPickerModal.tsx` : D-8 (choix local, ✓ avec fermeture progressive, ✕, création marquée).
- `i18n/index.ts` : libellé « Confirmer la catégorie ».

**Tests** :
- Sept tests ajoutés pour D-4, D-5, D-7 et D-8, dont « Réduire les animations ».
- Cinq tests d’obligation amendés par décision (titres précédents tracés). Deux tests de la Catégorie (sélection et création) réécrits pour D-8.
- P3-11 et REV-01 : réouverture du sélecteur entre deux choix, assertions inchangées.
- Trois aides de geste complétées par ✓ : `ExerciseScreen.test.tsx` (dans le périmètre), et les deux suites d’intégration (extension bornée de la revue 1, assertions inchangées).

**Documentation** (demandée par Hermann, hors chemins du contrôle de portée produit) :
- `07 – Registre des décisions de conception.md` : nouvelle section, D-336 à D-344.
- `SPECIFICATION-PARAMETRES-MODALE-v13.md` : passages amendés pour D-337, D-339, D-340, D-341 et D-342.
- `13 – Contrats d’écran.md` : règle générale l.151, CE-UI-09 §4, §7, §9 et note l.3169.
- `06 – Ecrans et navigation de la V1.md` : l.1338.

**Preuves** :
- `registre-recette1.md` §7 et §8 ;
- `procedure-retest-recette1-v3.md` ;
- `resultats-tests-recette1c.json` ;
- `couverture-obligations-recette1c.json` ;
- `controle-portee-recette1c.json`.

## Preuves et tests

| Commande | Résultat |
|---|---|
| `npx tsc --noEmit -p .` | PASS |
| `npx eslint src app` | PASS |
| `npx jest --json`, après la mise à jour documentaire | **97/97 suites, 1936/1936 tests** |
| `verifier-passe2.cjs` | PASS (2143) |
| Obligations `@43e7b344` | **442/442 PASS**, dont 5 amendées par décision |
| `controle-portee.cjs` | `OUTSIDE_APPROVED_SCOPE` attendu, et seulement, pour les 2 suites d’intégration de l’extension revue 1 |
| Contrôle étendu | PASS : 38 chemins, aucun hors périmètre |

## Hypothèses non démontrées

- Le rendu des animations sur iPhone n’est pas observé : durées, fluidité, « Réduire les animations ».
- Les valeurs D-6 proposées ne sont pas validées.
- F-02 n’est toujours pas reproduit.

## Non réalisé ou hors périmètre

- **X-1** (avec D-6), **X-2**, **X-3** et **X-4** : en attente d’approbation (`registre-recette1.md` §8).
- **Fond rouge de la cellule incomplète** : reporté par D-337 à une tranche ultérieure, après définition dans Figma.
- **Pauses variables dans les phrases** (D-338) : évolution ultérieure.

## Vérifications restant à faire sur appareil

`procedure-retest-recette1-v3.md`, RT-01 à RT-19.

## Commit final et état Git

Commit de code `4f1feebe`. Le commit documentaire, la publication et la mise à jour OTA sont consignés dans la section « Publication » ajoutée après leur exécution.

## Publication

| Étape | Résultat |
|---|---|
| Publication Git | Sans force, `c8f81d9c..9707c42a` (`4f1feebe` code, `9707c42a` documentation). Relu par `ls-remote` : `9707c42a…`. |
| Compatibilité | `OTA_COMPATIBLE` par rapport à `9f5cee0e` (build 7), aucun fichier natif (`compatibilite-ota-recette1c.json`) |
| Mise à jour EAS iOS | `01a12f01-4c7b-72f4-9a96-d4cf9d4830b3`, groupe `db603662-6554-4027-842b-2717cbf0a5b0`, canal `review`, `runtimeVersion` 1.1.0, `gitCommitHash` **`9707c42a64836eea0731062fd188dd8d42d3f8d4`** ; https://u.expo.dev/update/01a12f01-4c7b-72f4-9a96-d4cf9d4830b3 (`publication-ota-recette1c.json`) |
| Contrôle | `update:list --branch review` : c’est la mise à jour la plus récente du canal |
| Correspondance | Build 7 (`e1deb07e…`) + OTA `01a12f01…` = code de `9707c42a` |

Le commit qui ajoute cette section est documentaire seulement.

**Prochaine action** : recette v3 par Hermann ; approbation ou refus de X-1 (avec les valeurs D-6), X-2, X-3 et X-4. Ensuite, une seconde revue indépendante (ChatGPT). Aucune opération en cours.
