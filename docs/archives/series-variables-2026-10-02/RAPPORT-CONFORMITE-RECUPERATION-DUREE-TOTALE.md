> Archive du commit8fc58a4. Texte historique ; seuls les liens relatifs ont été figés vers le commit d’origine. Les règles actives sont dans v12.

> **HISTORIQUE — SUPERSEDÉ PAR D-208 (25/09/2026).** Ce rapport atteste l’ancien modèle de récupération générique attachée à l’Activité. Il ne doit plus être utilisé comme état courant pour les axes Pause/Récupération/Durée totale. La source normative courante est D-208 et les chapitres PRODUCT/00–13 mis à jour.

> **ÉTAT COURANT D-208.** Documentation fonctionnelle/technique : **CONFORME** au modèle à trois concepts après propagation du 25/09/2026. Figma : **PARTIELLEMENT CONFORME** sur l’axe récupération et à réaligner. Point **À CLARIFIER** : valeur initiale de `sideRecoverySeconds` lors de l’activation `D→G/G→D`. Les chiffres et formules du rapport ci-dessous sont conservés uniquement comme historique pré-D-208.

# Rapport de conformité final — Activité, Récupération et Durée totale

> **Correspondance de roadmap (D-166)** — Le Catalogue des Exercices constitue désormais T03 du MVP. Toute référence au moteur d’Exécution dans ce livrable est portée par T04, anciennement T03. L’ancienne T04 et les tranches suivantes sont décalées à partir de T05.

## 1. Périmètre et références

- Baseline documentaire exclusive : commit Git `917c53d91c4564d9b5047d6a301a5f4067883806`, branche `feat/creation-seance-catalogue`.
- Référence de conception : fichier Figma `G6RY5Ebhgwb4AHIOYDwwvg`, contrôlé le 8 septembre 2026.
- Périmètre fonctionnel : suppression du type d’Activité, Récupération attachée, Durée totale dépendante du nombre de Séries, écran Activité unifié, Composition, Exécution T04, DSF et captures associées.
- Opérations Git : aucun commit, push ou sync effectué.

## 2. Résultat de la seconde passe indépendante

| Mesure | Résultat |
| --- | ---: |
| Points de la matrice | 98 |
| Corrigés avec preuve | 98 |
| Non applicables | 0 |
| À clarifier | 0 |
| Couvertures partielles | 0 |

Chaque ligne de [`MATRICE-TRACABILITE-RECUPERATION-DUREE-TOTALE.md`](https://github.com/MyUncried/Application-Routine/blob/8fc58a466679a85ea74752f0273939f901efa1b8/docs/MATRICE-TRACABILITE-RECUPERATION-DUREE-TOTALE.md) contient l’exigence ou la contradiction, la décision finale, les documents et sections concernés, la règle attendue, les références Figma ou captures, le statut et une preuve documentaire localisée. Le statut `Corrigé` n’a été retenu qu’en présence de cette preuve.

La seconde passe a également détecté et corrigé quatre résidus qui contredisaient le modèle cible : définition de la Récupération comme Activité de repos dans le chapitre 06, décision D-054 encore marquée valide, comptage séparé des Récupérations dans le chapitre 09 et type de phase `EXERCISE` non aligné sur `ACTIVITY` dans le chapitre 04.

## 3. Couverture par couche documentaire

| Couche | Preuve principale |
| --- | --- |
| Produit et vision | `PRODUCT.md` §§ Exercices, Exécution, durées et roadmap ; `01 – Vision Générale.md` |
| Glossaire | `00 – Glossaire.md` : Activité, Pause entre Séries, Récupération, Durée totale et métriques temporelles |
| Besoins et parcours | `02 – Utilisateurs et besoins.md` ; `03 – Parcours utilisateur.md` |
| Versions et roadmap | `05 – Versions du produit.md` ; `INDEX.md` §10 |
| Décisions | `07 – Registre des décisions de conception.md`, D-135 à D-141 et décisions antérieures explicitement révisées |
| Modèle fonctionnel | `04 – Modèle fonctionnel.md` : Activité, phases et calculs |
| Conception détaillée | `08 – Conception fonctionnelle détaillée.md` : écran unifié, pilotes, Composition et Exécution |
| Données | `09 – Modèle de données fonctionnel.md`, DM-001 et DM-013 à DM-016 |
| Règles métier | `10 – Processus métier et règles métier transverses.md`, RM-033 à RM-038, RM-129 à RM-132 |
| API | `11 – API fonctionnelles.md`, API-ACT-01 à 07, API-EXE-04/05/08 |
| Architecture et stockage | `12 – Architecture technique.md` : Plan, migration `004`, `DATABASE_VERSION = 4`, valeurs persistées et dérivées |
| Contrats d’écran | `13 – Contrats d’écran.md`, CE-T01-13 à 15, CE-T02-01/02 et CE-T04-01 à 13 |
| DSF, variables et tokens | `12 – Architecture technique.md` : composants exacts, nodes et alias `VariableID:2290:52` → `VariableID:2290:3` |
| Captures Figma | `06 – Ecrans et navigation de la V1.md` et dossier `Specifications-fonctionnelles/images` |

## 4. Règles structurantes contrôlées

- Le modèle ne possède aucun type d’Activité `Exercice` ou `Récupération`.
- Pour `C` Séries, la Pause intervient `C` fois si `R = 0`, y compris après la dernière Série, ou `C − 1` fois si `R > 0`; la Récupération positive intervient ensuite une fois après toutes les Séries.
- En mode Durée, `D = C × A + P(C,R) × B + R`, avec `P(C,R) = C` si `R = 0`, sinon `C − 1`.
- Avec une Durée totale cible, `Cth = D / (A + B)` si `R = 0`, sinon `Cth = (D − R + B) / (A + B)` ; le résultat est arrondi au plus proche avec `.5` vers le haut et minimum `1`, puis `D` est recalculée à sa valeur réalisable.
- Séries est le pilote implicite initial ; le dernier contrôle confirmé devient le pilote ; cet état n’est pas persisté.
- Durée totale est masquée en Répétitions et À l’échec sans déplacer les autres contrôles.
- Une Récupération positive forme une phase `RECOVERY` attachée ; elle est copiée, déplacée et supprimée avec l’Activité, mais ne compte pas comme Activité.
- T04 conserve une seule Série et un seul Tour ; l’exécution multi-Séries et multi-Tours relève de T04.
- Les durées estimée, synthétique et réelle restent distinctes ; seule la Pause manuelle est exclue du temps réel.
- La cible Média post-T05 conserve le bouton visible mais désactivé et masque la section au runtime MVP.

## 5. DSF et références exactes

| Élément | Référence |
| --- | --- |
| `Activity / Name Field — Source exact` | `3382:4303` |
| `Action / Add Media — Source exact` | `3382:60` |
| Vecteur `icon/ajouter` | `3382:61`, `16 × 16` |
| `Media / Preview` | `3382:59` |
| `Media / Gallery — Source exact` | `3382:64` |
| `Media / Section — Source exact` | `3382:71` |
| `Controls / Segmented` | `2586:2759` |
| `Composition / Activity Row with Recovery` | `3572:64` |
| États Séries/Durée totale/ajustement | `3580:4733`, `3580:4845`, `3580:4957` |
| Token sémantique de sélection | `color/selection`, `VariableID:2290:52` |
| Alias primitif | `color/blue/selection-5F60EE`, `VariableID:2290:3` |
| Surface Média | `color/media/surface-F6F6FF` → `color/media/surface` |
| Bordure Média | `color/media/border-CDCEFA` → `color/media/border` |
| Voile de modale | `color/overlay/scrim-1F2129-34` → `color/overlay/scrim` |

Le tableau DSF du chapitre 12 couvre explicitement `Mode=Duration/Repetitions/ToFailure` et la rangée sans cible chiffrée pour `ToFailure`.

## 6. Fichiers modifiés, ajoutés et supprimés

### Documents modifiés

- `PRODUCT.md`
- `INDEX.md`
- les quatorze chapitres `Specifications-fonctionnelles/00` à `13`.

### Documents ajoutés

- `MATRICE-TRACABILITE-RECUPERATION-DUREE-TOTALE.md`
- `RAPPORT-CONFORMITE-RECUPERATION-DUREE-TOTALE.md`

### Captures ajoutées

- `composition-appui-long.png`
- `creation-activite-description.png`
- `creation-activite-zone-corporelle.png`
- `creation-activite-series-pilote.png`
- `creation-activite-duree-totale-pilote.png`
- `creation-activite-duree-ajustee.png`

### Captures remplacées

- `composition-seance.png`
- `composition-actions-glissees.png`
- `creation-activite-exercice.png`
- `creation-activite-repetitions.png`
- `creation-activite-a-l-echec.png`
- `creation-activite-duree-ouverte.png`
- `creation-activite-pause-ouverte.png`
- `creation-activite-series-ouvert.png`
- `creation-activite-repetitions-ouvert.png`

### Captures supprimées explicitement

- `creation-activite-informations.png`
- `creation-activite-recuperation.png`
- `creation-recuperation-duree-ouverte.png`

Aucun fichier applicatif, de protocole ou d’audit n’a été ajouté ou modifié dans le livrable.

## 7. Contrôles techniques finaux

| Contrôle | Résultat |
| --- | --- |
| Matrice | 98/98 lignes `Corrigé`, aucune couverture partielle |
| Anciennes formulations | anciennes nodes et formulations contradictoires recherchées transversalement ; aucun résidu normatif actif |
| Captures affectées | 15/15 PNG valides, `402 × 874`, réexportées depuis les nodes Figma courants |
| Références d’images | 79 références contrôlées, 0 fichier absent |
| UTF-8 | tous les fichiers Markdown valides |
| Liens internes | cibles de l’INDEX et liens documentaires présents |
| Intégrité du ZIP | `unzip -t` : aucune erreur sur les 115 entrées de l’archive finale |
