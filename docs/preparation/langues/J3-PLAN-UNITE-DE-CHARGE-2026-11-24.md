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

[Proposition du 24/11/2026 — 0,25 kg inchangé, 0,5 lb — remplacée par la décision U1 ci-dessous.]

Décision de Hermann du 24/11/2026 (U1), recopiée telle quelle : « Grille de pas adaptifs à appliquer sur les champs de charges et pour les conversions ».

| Tranche kg | Pas kg | Tranche lb | Pas lb |
|---|---|---|---|
| 0 à 1 kg | 0,25 kg | 0 à 2 lb | 0,5 lb |
| 1 à 5 kg | 0,5 kg | 2 à 10 lb | 1 lb |
| 5 à 20 kg | 1 kg | 10 à 45 lb | 2,5 lb |
| 20 kg et plus | 2,5 kg | 45 lb et plus | 5 lb |

Comment je la lis :
- La grille donne les valeurs admises : en kg, 0,25 · 0,5 · 0,75 · 1 · 1,5 … 5 · 6 … 20 · 22,5 · 25 … ; en lb, 0,5 · 1 … 2 · 3 … 10 · 12,5 … 45 · 50 · 55 …
- Chaque borne (1, 5, 20 kg ; 2, 10, 45 lb) appartient aux deux tranches voisines. Une valeur est donc valide sans ambiguïté si elle tombe sur la grille.
- La grille **s'applique aussi au kg**. Elle remplace le pas unique de 0,25 kg (AD-19) : par exemple, 12,5 kg et 22 kg ne sont plus des valeurs admises.
- La validation (`isValidLoadKg`), l'arrondi de saisie (`roundLoadUp`) et la conversion utilisent cette grille, dans l'unité du profil.

À trancher (U6, U7, section 4) : l'arrondi d'une valeur tapée hors grille et le sort des charges déjà enregistrées hors grille.

### 3.3 Conversion au changement d'unité, arrondi et non-dérive

- Facteur : 1 lb = 0,45359237 kg, valeur exacte.
- Changer l'unité convertit **toutes** les charges stockées (Catalogue, séances, Formats) en une seule transaction. Chaque valeur est arrondie au plus proche multiple du pas de la nouvelle unité. Un échec annule tout et laisse l'unité inchangée.
- Avec la grille U1, chaque valeur convertie est arrondie **au point le plus proche de la grille** de la nouvelle unité. Exemples : 20 kg → 44,09 lb → 45 lb ; 12 kg → 26,46 lb → 27,5 lb ; 100 lb → 45,36 kg → 45 kg.
- Une charge non nulle ne devient jamais 0 : elle prend au minimum le premier point de la grille (0,25 kg ou 0,5 lb).
- [Analyse de dérive au pas unique 0,25 kg / 0,5 lb — devenue sans objet avec la grille U1.] Avec la grille, les allers-retours calculés reviennent à leur valeur (45 lb → 20 kg → 45 lb ; 6 kg → 12,5 lb → 6 kg ; 22,5 kg → 50 lb → 22,5 kg), mais l'arrondi seul ne le garantit pas pour toutes les valeurs. La règle U2 ci-dessous le garantit.
- **Décision de Hermann du 24/11/2026 (U2 : « Ok »)** : à chaque conversion, la valeur d'origine de chaque charge est conservée. Si l'utilisateur revient à l'unité précédente sans avoir modifié cette charge entre-temps, la valeur d'origine est restaurée exactement. [Option B, arrondi seul : écartée.]

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
Réponses de Hermann du 24/11/2026 : U1 = grille de pas adaptatifs (§ 3.2) ; U2 « Ok » ; U4 « Ok » ; U5 « Ok » ; puis U3 « unité de la région du téléphone », U6 « Ok », U7 « Ok ». Toutes les questions sont tranchées.

| # | Question | Proposition | Décision |
|---|---|---|---|
| U1 | Pas de saisie en lb | 0,5 lb | Grille adaptative kg et lb (§ 3.2) |
| U2 | Non-dérive lb → kg → lb | Option A : restauration des valeurs d'origine non modifiées | Ok |
| U3 | Unité par défaut d'une installation neuve | Région du téléphone (États-Unis → lb, sinon kg) ; base existante → kg | « unité de la région du téléphone » — voir À CLARIFIER ci-dessous |
| U6 | Valeur tapée hors grille (ex. 22 kg) | Arrondie au point supérieur de la grille (22,5 kg), comme l'arrondi actuel au 0,25 supérieur | Ok |
| U7 | Charges déjà enregistrées hors grille (ex. 12,5 kg) | Conservées telles quelles jusqu'à leur prochaine modification ou conversion | Ok |
| U4 | Historique des exécutions | Affiché dans l'unité de l'exécution, sans conversion |
| U5 | Changement d'unité | Immédiat, sans fenêtre de confirmation |

Après validation : implémentation sur `feat/unite-charge-20261124`, mise à jour du registre (règle 7 complétée, classe B), du chapitre 12 (choix techniques) et du chapitre 13 (ligne Unité de charge), puis recette iPhone.

**À CLARIFIER (U3, sans bloquer)** : la réponse vaut pour une installation neuve. Pour une base existante, dont toutes les charges sont en kg, sur un téléphone d'une région en livres : faut-il partir en kg (proposition initiale) ou passer en lb en convertissant les charges au premier lancement ? Sur l'iPhone de Hermann (région France), les deux lectures donnent kg.
