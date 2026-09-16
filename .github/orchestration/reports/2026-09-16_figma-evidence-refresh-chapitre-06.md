# 2026-09-16 — Réexport exhaustif des preuves visuelles Figma et uniformisation du chapitre 06

## 1. Identification et objectif

- **Identifiant de mission** : `figma-evidence-refresh-chapitre-06`
- **Type** : production documentaire (réexport de preuves visuelles, structuration, traçabilité)
- **Objectif** : réexporter depuis le Figma courant toutes les copies d’écran nécessaires à la documentation, uniformiser le chapitre 06 (numérotation, titre, image, node source), traiter le composant transverse `Status / Badge`, mettre à jour le registre d’évidences et les références documentaires dépendantes, puis contrôler fichiers, dimensions, liens, Unicode et état Git.

## 2. Baseline

- **Branche** : `main`
- **HEAD initial** : `d37ac7d31a38f550521359d689fdde109c432e02`
- **État Git initial** (constaté, non modifié par cette mission) :

```
 M app.json
 M docs/Specifications-fonctionnelles/03 – Parcours utilisateur.md
 M docs/Specifications-fonctionnelles/04 – Modèle fonctionnel.md
 M docs/Specifications-fonctionnelles/05 – Versions du produit.md
 M docs/Specifications-fonctionnelles/06 – Ecrans et navigation de la V1.md
 M docs/Specifications-fonctionnelles/13 – Contrats d’écran.md
 M start-kodjo.ps1
?? build-kodjo-preview.ps1
```

- **Confirmation** : aucune resynchronisation n’a été effectuée. Aucun `git pull`, `git reset`, `git checkout`, `git restore`, changement de branche ni récupération depuis `origin/main`. Seuls `git status --short`, `git rev-parse HEAD`, `git diff` et `git show HEAD:<fichier>` (lecture) ont été utilisés avant modification. L’arbre de travail local issu du ZIP est la seule base employée.

## 3. Source Figma

- Fichier : `G6RY5Ebhgwb4AHIOYDwwvg`
- Pages : `Prototype MVP` (`510:101`) et `Design system — Fondations` (`2291:2`)
- La page `Prototype MVP` contient **100 frames de premier niveau** au moment du contrôle.
- Accès Figma authentifié et fonctionnel (compte `Hermann`, plan `hermann Adjou Moumouni's team`).

## 4. Périmètre demandé et périmètre traité

| Phase demandée | Traitée | Observation |
| --- | --- | --- |
| 1 — Inventaire documentaire | Oui | 110 références d’image dans le chapitre 06, 11 dans le chapitre 13, 103 fichiers image physiques inventoriés. |
| 2 — Inventaire des écrans Figma | Oui | Correspondance node ↔ écran établie par nom de frame, contenu visuel et nodes déjà documentés. Aucun node n’a été soumis à l’utilisateur. |
| 3 — Export des copies d’écran | Oui | 86 frames d’écran exportées à l’échelle native `402 × 874 px`. |
| 4 — Numérotation et titres | Oui | Convention `Écran N` existante prolongée ; sous-états en `Na`, `Nb`… ; modales numérotées `Modale 1` à `Modale 7`. |
| 5 — Fichiers image | Oui | Aucun renommage de fichier existant. 3 fichiers ajoutés. |
| 6 — Composant `Status / Badge` | Oui | `3959:5970` exporté en PNG ×2, composant unique conservé, 7 variantes visibles. |
| 7 — Preuves d’usage | Oui | `1992:8843`, `1992:8996`, `1992:10320` réexportés en `402 × 874 px`. |
| 8 — Tous les autres écrans | Oui | Toutes les copies d’écran du chapitre 06 traitées. |
| 9 — Icônes / branding | Oui, sans modification | Voir § 9. |
| 10 — Chapitre 06 | Oui | Voir § 7. |
| 11 — Registre / manifeste | Oui | `README-T03-FIGMA.md` entièrement reconstruit. |
| 12 — Documents transverses | Oui | `INDEX.md` et chapitre 13 mis à jour ; `PRODUCT.md` inchangé (aucune dépendance devenue fausse). |
| 13 — Contrôle indépendant | Oui | Voir § 10. |
| 14 — Contrôle Git | Oui | Voir § 11. Aucun commit applicatif, aucun push, aucune PR. |

## 5. Constats

### 5.1 Formats non conformes avant la mission

Sur les 82 fichiers dont le binaire a été remplacé :

- **13** étaient stockés en `804 × 1748 px` (export ×2 inutile pour un écran complet) ;
- **12** étaient stockés en `185 × 402 px` (recadrage très en dessous de la convention, famille `creation-activite-*`) ;
- **57** étaient déjà en `402 × 874 px` mais leur contenu Figma avait changé.

### 5.2 Fichiers de preuve inexploitables

`CE-ACT-EXE-01a-catalogue-activites-liste-t03.jpg` et `CE-ACT-EXE-01b-catalogue-creer-arbre-actions-t03.jpg` mesurent **`41 × 88 px`**. Ils étaient embarqués comme preuve visuelle courante dans les contrats `CE-T03-02` et `CE-T03-03` du chapitre 13. Leur statut au registre était `À RÉEXPORTER`. Le réexport ayant été réalisé, les deux références du chapitre 13 ont été réorientées vers les fichiers `.png` correspondants ; les `.jpg` sont conservés physiquement et déclarés `SUPERSEDED`.

### 5.3 Preuves déjà courantes

`CE-ACT-EXE-02-preparation-5-s.png`, `CE-ACT-EXE-03-execution-en-cours.png`, `CE-ACT-EXE-04-synthese-ressenti-requis.png` et `CE-ACT-EXE-05-synthese-ressenti-selectionne.png` ont été réexportés depuis leurs nodes courants : leur binaire est **strictement identique** à l’existant. Ils étaient donc déjà courants ; ils n’apparaissent pas dans le diff.

### 5.4 Écran 15 non illustré

L’Écran 15 (`Création ou modification d’une Activité persistante`) ne disposait d’aucune capture. Deux frames dédiées existent dans le Figma courant : `3879:5947` (création) et `3879:6079` (modification). Elles ont été exportées et intégrées.

## 6. Composant `Status / Badge`

- **Node canonique** : `3959:5970`, `Status / Badge — Source exact`, `687 × 64 pt`.
- **Fichier** : `docs/Specifications-fonctionnelles/images/status-badge-composant.png`.
- **Export** : PNG **×2** → `1374 × 128 px` (mesuré sur le binaire).
- **Composant unique conservé** : aucun scindement, aucun fichier PNG par variante, aucune variante inventée.
- **Sept variantes contrôlées visuellement sur l’export** :

| Famille sémantique | Variantes | Nodes |
| --- | --- | --- |
| Statuts d’exécution | `Terminée`, `Partielle`, `Interrompue` | `3959:5966`, `3959:5963`, `3959:5969` |
| Statuts d’élément / provenance | `Catalogue`, `Planifiée`, `Exécutée`, `Archivée` | `3959:5951`, `3959:5954`, `3959:5957`, `3959:5960` |

- **Preuves d’usage** (distinctes de la preuve du composant, ne s’y substituant pas) :

| Node | Fichier | Dimensions | Variantes visibles contrôlées |
| --- | --- | --- | --- |
| `1992:8843` | `suivi-condense.png` | `402 × 874` | `Terminée`, `Partielle`, `Interrompue` |
| `1992:8996` | `suivi-deploye.png` | `402 × 874` | `Terminée`, `Partielle`, `Interrompue` |
| `1992:10320` | `recherche-globale-resultats.png` | `402 × 874` | `Catalogue`, `Planifiée`, `Exécutée`, `Archivée` |

`recherche-globale-resultats.png` était en `804 × 1748 px` ; il est désormais en `402 × 874 px`.

## 7. Chapitre 06

- **Copies d’écran remplacées** : toutes celles référencées par le chapitre, soit 87 des 90 références (3 fichiers déjà identiques à l’export courant).
- **Copies ajoutées** : `creation-activite-persistante-creation.png` (Écran 15), `creation-activite-persistante-modification.png` (Écran 15a), `status-badge-composant.png` (preuve de composant).
- **Numérotation** :
  - titre `## Écran de lancement – Splash KODJO` renommé `## Écran 0 – Splash KODJO` (aucune référence croisée à ce titre ailleurs) ;
  - numérotation `Écran 1` à `Écran 18` **inchangée** — les références croisées `06 Écran 4`, `06 Écran 5` de `MATRICE-TRACABILITE-RECUPERATION-DUREE-TOTALE.md` et du chapitre 08 restent valides ;
  - sous-états numérotés `Na`, `Nb`, … en prolongement de la convention ;
  - sept sections modales renommées `Modale 1` à `Modale 7` (aucune référence croisée hors chapitre 06, vérifié).
- **Légendes** : 41 captures principales portent désormais une légende `*N° — Titre — Figma \`node\`*`. Contrôle automatique : 41 légendes bien formées, 0 anomalie de structure.
- **Tableaux d’états** : les 7 tableaux `États Figma de référence` ont reçu une colonne `N°` et une colonne `Node Figma`, soit 49 états tracés.
- **Homogénéité d’affichage** : les captures des Écrans 12 à 18, précédemment en image Markdown pleine largeur, sont converties au format wikilink `|260` commun. Trois captures principales affichées à `220` (`categories-nouvelle-inline`, `synthese-evaluation-initiale`, `suivi-vide`) sont passées à `260`. Les vignettes de tableau restent à `220`. La preuve de composant est affichée à `700` pour rester lisible.
- **Ajouts de contenu** : une section `Composant transverse Status / Badge` et une section `Points À CLARIFIER relevés lors du contrôle visuel du 16 septembre 2026`.
- **Aucune règle fonctionnelle n’a été modifiée.** Le diff du chapitre ne supprime que des titres de section, des en-têtes/lignes de tableau et des lignes d’image ; aucune ligne de prose fonctionnelle n’est supprimée.

## 8. Images

- **Ajoutés (3)** :
  - `status-badge-composant.png` — `1374 × 128` — `3959:5970` — preuve canonique du composant demandée par la mission.
  - `creation-activite-persistante-creation.png` — `402 × 874` — `3879:5947` — Écran 15 jusqu’ici non illustré.
  - `creation-activite-persistante-modification.png` — `402 × 874` — `3879:6079` — Écran 15a.
- **Remplacés (82)** : tous en `402 × 874`, liste exhaustive dans `git status`. Justification : mise en conformité avec le Figma courant et avec la convention d’export.
- **Réexportés sans changement binaire (4)** : `CE-ACT-EXE-02/03/04/05`.
- **Supprimés (0)** : aucun fichier image n’a été supprimé.
- **Non réexportés, conservés (7)** : `CE-ACT-EXE-01a-…-t03.jpg`, `CE-ACT-EXE-01b-…-t03.jpg` (SUPERSEDED) ; `CE-ACT-EXE-01c-…-t03.jpg`, `CE-ACT-EXE-01c-catalogue-action-contextuelle-directe.png` (node `3787:5209` disparu) ; `creation-activite-informations.png`, `creation-activite-recuperation.png`, `creation-recuperation-duree-ouverte.png` (référencés uniquement par un rapport de conformité explicitement historique).

## 9. Icônes / branding

**Aucune modification n’était nécessaire et aucune n’a été effectuée.**

Le répertoire `docs/Specifications-fonctionnelles/images branding/` contient 13 fichiers (`logo*`, `sigil*`). Une recherche sur l’ensemble de `docs/` et `.github/` n’a trouvé **aucune référence Markdown** vers ce répertoire ni vers ces fichiers. Aucun lien cassé, aucune icône individuelle référencée et obsolète, aucune preuve visuelle séparée d’icône exigée par la documentation. Conformément à la consigne, aucune icône visible dans une copie d’écran n’a été exportée séparément.

## 10. Documentation transverse modifiée

| Fichier | Raison | Nature exacte |
| --- | --- | --- |
| `docs/Specifications-fonctionnelles/06 – Ecrans et navigation de la V1.md` | Chantier principal | Numérotation, légendes, colonnes `N°`/`Node Figma`, homogénéisation d’affichage, sections composant et `À CLARIFIER`. `+283 / −…` sur 4 fichiers Markdown au total : `410` insertions, `147` suppressions. |
| `docs/Specifications-fonctionnelles/13 – Contrats d’écran.md` | Preuve devenue inexploitable et statut d’évidence changé | Deux images `.jpg` de `41 × 88 px` réorientées vers les `.png` réexportés, avec mention du node et des dimensions ; section `16. Évidences Figma embarquées` actualisée (statuts `SUPERSEDED`, liste des réexports, ajout du composant `Status / Badge`). |
| `docs/Specifications-fonctionnelles/images/README-T03-FIGMA.md` | Registre d’évidences | Reconstruit : convention d’export, définition des statuts, inventaire complet de 90 preuves (N°, titre, node, fichier, dimensions, type, statut), section composant `Status / Badge`, fichiers sans statut courant, points `À CLARIFIER`, géométrie de la rangée Catalogue, éditeur Activité, historique des exports. |
| `docs/INDEX.md` | Libellé et description du registre devenus faux | Trois passages actualisés (intitulé du registre, phrase sur l’état des copies binaires au 16 septembre, entrée de l’ordre de lecture). |

`docs/PRODUCT.md` n’a pas été modifié : sa seule mention du registre reste exacte. Les rapports historiques (`RAPPORT-CONFORMITE-*`, `MATRICE-TRACABILITE-*`, rapports d’orchestration) n’ont pas été réécrits.

## 11. Points non résolus — `À CLARIFIER`

1. **Modale 2 — `activite-abandon-modifications.png`.** Le chapitre 06 cite le node `3224:4082` (`Modal — Abandonner les modifications d’une activité`). Vérification directe : **ce node n’existe plus** dans le fichier Figma (erreur `node ID was not found`), et aucune frame équivalente n’existe sur les deux pages. La capture est conservée sans remplacement, statut `À CLARIFIER`.
2. **Panneaux/options ouverts `Filtrer` et `Trier`** : toujours `NON VÉRIFIABLE`, aucune frame dédiée. Aucun élément inventé.
3. **Section Médias de l’éditeur d’Activité** : le chapitre 06 affirme que « dans toutes les frames MVP […] la section Médias est masquée ». Les 14 frames Activité courantes affichent la section Médias repliable (`Photo`, `Vidéo`). Contradiction texte ↔ frame. **Aucune règle fonctionnelle n’a été modifiée.**
4. **Libellé de l’arbre `Créer`** : le chapitre 06 indique `Une nouvelle activité`; les frames `3787:5148` et `3841:8375` affichent `Une activité`. Aucun libellé modifié.
5. **Écran 1e — `profil-parcours-vide.png`** : l’export de `2139:86` est **binairement identique** à celui de `1992:684` (`Vibration activée`). L’état « parcours vide » n’est pas distinguable visuellement dans le Figma courant. Les deux nodes existent ; les deux fichiers sont conservés.
6. **Écran 2h — `catalogue-apres-archivage.png`** : la frame `1992:10937` affiche la snackbar `Séance supprimée`, alors que la légende du chapitre décrit un retrait par archivage.

## 12. Preuves et tests

**Aucun test automatisé n’est applicable** : la mission est exclusivement documentaire et ne touche aucun fichier applicatif, aucun test, aucune configuration de build. Les vérifications réellement exécutées sont les suivantes.

| Contrôle | Méthode | Résultat |
| --- | --- | --- |
| Correspondance node ↔ écran | Lecture des 100 frames de premier niveau de `Prototype MVP` + nodes déjà documentés + contenu visuel | 89 correspondances établies, 1 impossible (`3224:4082`) |
| Contrôle visuel des exports | Lecture image de **89 exports sur 89** avant intégration | Conformes au contenu documentaire, 6 écarts relevés en § 11 |
| Dimensions des exports | Lecture de l’en-tête PNG (IHDR) | 88 fichiers en `402 × 874`, 1 fichier composant en `1374 × 128` |
| Export ×2 du composant | Mesure binaire de `status-badge-composant.png` | `1374 × 128` = `687 × 64 pt` × 2 — conforme |
| Sept variantes du badge | Contrôle visuel de l’export | 7 variantes visibles et lisibles |
| Variantes des 3 preuves d’usage | Contrôle visuel des 3 exports | Conformes |
| Doublons d’export | `md5sum` sur les 89 exports | 1 seul doublon, documenté en § 11.5 |
| Existence des images référencées | Script Node, 5 documents | 126 cibles valides, **0 cassée** |
| Casse exacte des chemins | Comparaison stricte avec `readdirSync` | 101 références, **0 casse incorrecte** |
| Structure des légendes | Script Node sur le chapitre 06 | 41 légendes bien formées, **0 anomalie** |
| Séquences interdites `#Uxxxx`, `\uXXXX`, caractère de remplacement | `grep` sur les 5 documents | **Aucune occurrence** |
| Encodage | `file` sur les documents modifiés | UTF-8, **aucun BOM** |
| Fins de ligne | Lecture binaire | Inchangées par rapport à la baseline locale (LF dans les fichiers issus du ZIP, CRLF dans `INDEX.md`) ; aucun churn EOL introduit |
| Fichiers temporaires | `git status --porcelain` filtré | **Aucun** |
| Fichiers hors périmètre | `git status --short` | Aucun fichier applicatif modifié |

## 13. Fichiers modifiés par cette mission

**Markdown (4)**

- `docs/INDEX.md`
- `docs/Specifications-fonctionnelles/06 – Ecrans et navigation de la V1.md`
- `docs/Specifications-fonctionnelles/13 – Contrats d’écran.md`
- `docs/Specifications-fonctionnelles/images/README-T03-FIGMA.md`

**Images remplacées (82)** et **images ajoutées (3)** dans `docs/Specifications-fonctionnelles/images/` — voir `git status --short`.

**Aucun fichier supprimé. Aucun fichier applicatif, script ou configuration modifié.**

## 14. Éléments hors périmètre / non corrigés

- Les six points du § 11 ne sont pas corrigés : ils relèvent d’un arbitrage produit ou d’une correction Figma, pas d’une décision documentaire.
- Les fichiers `app.json`, `start-kodjo.ps1`, `build-kodjo-preview.ps1` et les chapitres 03, 04, 05 étaient déjà modifiés dans la baseline locale ; ils n’ont pas été touchés.
- Les rapports et matrices historiques n’ont pas été réalignés sur l’état courant, conformément à la consigne.
- Les 3 frames `PROPOSITION — Exécution séance`, la section `EXPLORATION — Catalogue Activités` et les 2 frames `Comparaison / Avant-Après` de la page `Prototype MVP` sont des supports de travail Figma ; elles ne sont pas intégrées comme preuves documentaires.

## 15. Vérifications restant à effectuer sur appareil réel

- Rendu réel des captures dans Obsidian et dans l’aperçu GitHub (largeurs `260`, `220` et `700`).
- Lisibilité de `status-badge-composant.png` à la largeur d’affichage retenue sur écran de petite taille.
- Conformité perceptive des écrans réexportés par rapport à l’application, lorsque l’implémentation correspondante sera livrée.

## 16. État Git et commit

- **Branche** : `main`
- **HEAD de départ** : `d37ac7d31a38f550521359d689fdde109c432e02`
- **Commits applicatifs créés** : aucun.
- **Commits documentaires de livraison créés** : aucun — l’instruction de mission interdit explicitement de committer les modifications et d’effectuer toute opération de publication. **Les 85 modifications documentaires (4 Markdown + 82 images remplacées + 3 images ajoutées) restent non committées dans l’arbre de travail, en attente d’instruction explicite.**
- **Push** : aucun. **Pull request** : aucune.
- Le présent rapport est committé seul, conformément à l’obligation de livraison documentaire de `CLAUDE.md`, qui précise qu’une instruction ponctuelle de type « ne créer aucun commit » s’interprète comme portant sur les fichiers applicatifs et ne suspend pas la création ni le commit du rapport de mission.

**Point d’arbitrage soumis à l’utilisateur** : si le commit du seul rapport n’était pas souhaité, le préciser explicitement ; l’instruction `EXCEPTION EXPRESSE — AUCUN RAPPORT DE MISSION` lève l’obligation pour les missions ultérieures.
