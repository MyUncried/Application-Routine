# J3 — Unité de charge (kg · lb) : plan à valider

Date : 24/11/2026. Branche : `feat/unite-charge-20261124`, issue de `main` à `b074c416`. Statut : **plan, aucun code**. Il est à valider par Hermann (`PROMPT-J1-LANGUE-ET-UNITES.md`, partie 2).

Sources :
- registre ch. 07, « Gestion des langues — décisions de Hermann du 23/11/2026 », règle 7, et D-569 ;
- Figma « Profil — Préférences » `1992:684` ;
- `PLAN-GESTION-DES-LANGUES-2026-11-23.md` (§ 2.2, A7).

## 1. Ce que disent les règles

- Une seule unité pour tout le profil, réglée dans Profil › Préférences, section « Langue et unités », par un sélecteur segmenté kg · lb (D-569). Le sélecteur est le contrôle segmenté natif.
- Les charges sont enregistrées et affichées dans cette unité. Elles ne sont converties que quand l'unité change (règle 7, réponse A7 de Hermann).
- Valeur par défaut selon la région du téléphone : ce choix technique est proposé et reste à confirmer.
- Aucun autre écran ne change de forme (D-569). Seule l'unité écrite change.

## 2. État actuel du code (inventaire)

Toutes les charges sont des nombres en kg, au pas de 0,25 (`exerciseLoad.ts` : `LOAD_STEP_KG`, `roundLoadUp`, `formatLoadKg`, `parseLoadText`; `ExecutionParameters.ts` : `isValidLoadKg`).

| Où la charge est stockée | Forme |
|---|---|
| Paramètres d'exécution du Catalogue (`activity_definitions`) et des occurrences de séance (`activities`) | JSON des paramètres, champ `loadKg` (uniforme et lignes de séries variables) |
| Brouillons et modèles de Formats (`formatModels.ts`) | `cells[].loadKg`, `loads[]`, `loadKg` |
| Exécutions (`executions.snapshot_json`) | plan figé de la séance, `loadKg` par étape (`plan.ts`, `projection.ts`) |

| Où la charge est affichée ou saisie | Fichiers |
|---|---|
| Paramètres d'exécution (charge commune, tableau des séries variables) | `ExecutionParametersSheet.tsx`, `KeyboardField.tsx`, `cellEntry.ts`, `loadOptionWidth.ts` |
| Phrase de synthèse de la carte d'exercice (« (charges : 20, 12,5 kg) ») | `executionPhrase.ts` |
| Formats (tableaux, For time, « (+ kg) » / « (− kg) », « +kg » / « −kg ») | `FormatModelScreen.tsx`, `FormatTables.tsx`, `ForTimeBlocks.tsx`, `fr.ts` / `en*.ts` |
| Exécution (affichage et annonce vocale de la charge) | `ExecutionScreen.tsx`, `frExecution.ts` / `enExecution.ts` (`load`) |

Aucune préférence d'unité n'existe aujourd'hui.

## 3. Proposition

### 3.1 Stockage

- **Préférence** : une colonne `load_unit` (`'KG'` ou `'LB'`) dans `guidance_preferences`, la table des préférences à ligne unique (migrations 025 à 039).
  - Migration **040**. Aucune branche distante ne porte de migration 040 (vérifié le 24/11/2026).
  - Une base existante reçoit `'KG'`, puisque toutes ses charges sont en kg.
  - Une installation neuve reçoit l'unité de la région au premier lancement (`measurementSystem` d'`expo-localization` : `us` → lb, sinon kg). Cette unité est écrite tout de suite, pour qu'elle ne change pas si la région du téléphone change ensuite.
- **Charges** : les nombres restent où ils sont et s'entendent dans l'unité du profil, comme le veut la règle 7.
  - Le champ technique `loadKg` garde son nom dans le JSON, ce qui évite de réécrire tous les lecteurs et versions de format.
  - Le domaine l'expose comme « charge dans l'unité du profil ». C'est un choix technique de classe D, à noter au chapitre 12.

### 3.2 Pas de saisie

- En kg : 0,25 (inchangé).
- En lb : **0,5** proposé. Les disques en livres vont par 2,5 et 1,25 lb, et ce pas garde des valeurs lisibles.
- Ce pas sert à la validation (`isValidLoadKg` devient dépendant de l'unité), à `roundLoadUp` et à la saisie.

### 3.3 Conversion au changement d'unité, arrondi et non-dérive

- Facteur : 1 lb = 0,45359237 kg, valeur exacte.
- Changer l'unité convertit **toutes** les charges stockées (Catalogue, séances, Formats) en une seule transaction. Chaque valeur est arrondie au plus proche multiple du pas de la nouvelle unité. Un échec annule tout et laisse l'unité inchangée.
- Une charge non nulle ne devient jamais 0 : elle prend au minimum un pas.
- **Aller-retour kg → lb → kg** : sans dérive avec l'arrondi au plus proche. L'écart d'un arrondi en lb vaut au plus 0,25 lb, soit 0,113 kg, ce qui reste sous la moitié du pas kg (0,125). Exemple : 20 kg → 44 lb → 20 kg.
- **Aller-retour lb → kg → lb** : une dérive de 0,5 lb reste possible, car l'écart en kg peut atteindre 0,125 kg, soit 0,276 lb.
- **Proposition contre la dérive (option A)** : à chaque conversion, conserver la valeur d'origine de chaque charge. Si l'utilisateur revient à l'unité précédente sans avoir modifié cette charge entre-temps, la valeur d'origine est restaurée exactement. Exemple : 45,5 lb → 20,75 kg → 45,5 lb, et non 45,5 → 20,75 → 45,75 lb.
- **Option B, plus simple** : arrondi seul, en acceptant une dérive de ±0,5 lb dans quelques cas d'aller-retour.

### 3.4 Historique des exécutions

- Le plan figé d'une exécution (`snapshot_json`) enregistre aussi l'unité au moment de l'exécution.
- Proposition : l'historique affiche chaque exécution passée **dans son unité d'origine**, sans conversion. C'est la valeur réellement soulevée, comme Fitbod (benchmark : « historique conservé dans son unité »).
- Une exécution **en cours** quand l'unité change garde son unité jusqu'à la fin.

### 3.5 Écrans

- **Profil › Préférences** : ligne « Unité de charge », sélecteur segmenté natif kg · lb, selon la maquette `1992:684`. Le changement s'applique tout de suite, sans confirmation. Aucune autre ligne ne change.
- **Partout ailleurs** : seul le texte de l'unité change, sans modification de mise en page.
  - « kg » / « lb », « (+ kg) » / « (+ lb) », « +kg » / « +lb », la Phrase de synthèse.
  - L'annonce vocale : « kilos » / « pounds » selon la langue et l'unité.
  - Un seul formateur, `formatLoad(value, unit)`, remplace `formatLoadKg`.
- **`loadOptionWidth.ts`** : la largeur est recalculée avec « lb ».
- **Textes** : la clé de chaque unité est ajoutée en français et en anglais (glossaire). Les garde-fous `hardcodedUserText` et `translationParity` restent verts.

### 3.6 Tests prévus

- Conversion : aller-retour sans dérive, et restauration exacte des valeurs d'origine avec l'option A.
- Pas et validation selon l'unité, et minimum d'un pas pour une charge non nulle.
- Migration 040 : base existante → `'KG'` ; base neuve → région ; idempotence.
- Transaction de conversion annulée en cas d'échec.
- Exécution figée conservée dans son unité.
- Formateur et textes français et anglais ; écrans de Préférences, Paramètres d'exécution, Formats et Exécution en lb.
- Suite Jest complète et `tsc`.

## 4. À trancher par Hermann

| # | Question | Proposition |
|---|---|---|
| U1 | Pas de saisie en lb | 0,5 lb |
| U2 | Non-dérive lb → kg → lb | Option A : restauration des valeurs d'origine non modifiées |
| U3 | Unité par défaut d'une installation neuve | Région du téléphone (États-Unis → lb, sinon kg) ; base existante → kg |
| U4 | Historique des exécutions | Affiché dans l'unité de l'exécution, sans conversion |
| U5 | Changement d'unité | Immédiat, sans fenêtre de confirmation |

Après validation : implémentation sur `feat/unite-charge-20261124`, mise à jour du registre (règle 7 complétée, classe B), du chapitre 12 (choix techniques) et du chapitre 13 (ligne Unité de charge), puis recette iPhone.
