# Catalogue / Bibliothèques — baseline documentaire réconciliée (11/11/2026)

## Identifiant et objectif

- **Mission :** `CATALOGUE-BIBLIOTHEQUES-BASELINE-RECONCILIEE`.
- **Objectif :** réunir les deux lignes documentaires issues de `b3249287` (ligne **A–H** et ligne **K**), enregistrer les décisions A-1 à A-6 de Hermann du 11/11/2026 au registre (chapitre 07), les propager de façon ciblée, puis contrôler par une seconde passe l'absence de formulations contradictoires.
- **Type :** mission documentaire. Aucun code, aucun fichier Figma modifié ; aucune fusion vers `main`, aucune PR ouverte.

## Branche et commits de départ

| Élément | Valeur |
|---|---|
| Worktree | `C:/Dev/KODJO-DOCS-BIB` |
| Branche | `docs/catalogue-bibliotheques-baseline-20261111` |
| Départ (ligne A–H) | `7929f256` (= `origin/docs/mouvements-reconciliation-A-H-20261111`, 103 commits depuis `b3249287`) |
| Ligne K fusionnée | `origin/docs/bibliotheques-consolidation-simplification-20261110` = `a4d6e50e` (17 commits depuis `b3249287`) |
| Base commune | `b3249287` |

## Périmètre demandé / traité

Demandé : fusion K → branche avec résolution des conflits en conservant les deux lignes ; section registre A-1 à A-6 + choix techniques P0 + points À CLARIFIER ; propagation (04, 06, 08, 09, 10, 11, 12, 13, PRODUCT, INDEX, annexes) ; seconde passe ; rapport.
Traité : intégralement. Propagation également nécessaire dans 01, 02, 03 et 05 (passages contradictoires trouvés par recherche ciblée).

## 1. Fusion et résolution des conflits

`git merge --no-ff origin/docs/bibliotheques-consolidation-simplification-20261110` : **22 zones de conflit dans 10 fichiers** (rendues en style diff3 pour voir la base). Règle de résolution : formulation K pour l'interdiction de copie/duplication/modification des fiches reçues et la redistribution à l'identique ; apports A–H (MOUV-D3, réconciliation historique CA-3 des 60, plan en six étapes, BIB-19 à 23) conservés ; formulation unique jamais plus faible que l'une ou l'autre ; texte d'origine remplacé conservé en annotation datée lorsqu'une règle du registre ou des documents Bibliothèques est réécrite.

| Fichier | Zones | Résolution |
|---|---|---|
| `KODJO-Bibliotheques-Conception-fonctionnelle-technique-donnees-Revue-Claude-2026-11-10.md` | 5 | BIB-06–08 : K + MOUV-D3/A-2 + texte d'origine annoté ; PU-03/04 : K (référencer sans copier) + duplication de sa propre fiche (A–H) ; droits sur la fiche : K + « lot de partage futur » (A–H) ; plan : tableau en six étapes A–H conservé, lots L1–L6 supersédés comme plan, avec rappel des règles K pour leur reprise ultérieure ; T-03 : refus systématique (A–H) + référencement multiple autorisé (K). |
| `KODJO-Bibliotheques-Parcours-utilisateurs-cibles-2026-11-10.md` | 9 | Règles générales fusionnées (interdiction copie/modification + droit Redistribuer à l'identique + paramètres d'Exercice indépendants) ; **matrice des droits d'une fiche reçue** à trois lignes (création personnelle, reçue non redistribuable, reçue redistribuable) ; PU-02/03 fusionnés ; **PU-04** titré « Référencer sans copier un Mouvement reçu ; dupliquer uniquement un Mouvement personnel » ; contrôle n° 5 fusionné. |
| `KODJO-Conception-Bibliotheques-Mouvements-Partage-2026-11-10.md` | 9 | **BIB-06, BIB-07, BIB-11, BIB-13** : formulation K, référence MOUV-D3/A-2, textes d'origine annotés ; BIB-13 conserve la réconciliation historique des 60 (A–H) ; **matrice §2.1 « droits des fiches reçues »** (K) avec ligne création personnelle (A–H) ; paragraphe des droits, points ouverts 2/3 et « déjà définis » fusionnés. |
| `docs/PRODUCT.md` | 1 | K (ni modifiable ni duplicable ; redistribution à l'identique si accordée) + supersession des quatre modes (A–H). |
| `04 – Modèle fonctionnel.md` | 1 | Fusion K + A–H (références d'Exercice paramétrables, modes supersédés, publication initiale du propriétaire). |
| `05 – Versions du produit.md` | 1 | Fusion K + A–H. |
| `07 – Registre des décisions de conception.md` | 2 | BIB-06 et BIB-07/08 : « Règle révisée le 11/11/2026 (MOUV-D3, A-2) » + texte d'origine annoté ; BIB-08 explicitement maintenue ; BIB-12/13 : K + réconciliation historique CA-3 (A–H). |
| `08 – Conception fonctionnelle détaillée.md` | 2 | Catalogue : duplication des seuls Mouvements personnels (A–H) + référencement multiple et redistribution à l'identique (K) ; Bibliothèque reçue : Mouvements personnels distincts (K) + adaptations historiques des 60 (A–H). |
| `10 – Processus métier et règles métier transverses.md` | 2 | Point 3 « Droits » et point 6 « Composition reçue » fusionnés. |
| `12 – Architecture technique.md` | 1 | K + garde de lecture seule au niveau service (A–H / P0). |

Fichiers fusionnés automatiquement (vérifiés, sans doublon) : `INDEX.md`, `09 – Modèle de données fonctionnel.md`, `11 – API fonctionnelles.md`.

Commit de fusion : `8eed89cf`.

## 2. Décisions enregistrées

Nouvelle section du chapitre 07 : **« Décisions A-1 à A-6 — reprise du chantier Catalogue autonome (11/11/2026) »**, placée après « Réconciliation du plan Catalogue autonome / Bibliothèques ».

- **A-1** (classe B) : Bibliothèque = collection logique identifiable de références (citation exacte) ; aucune restriction fonctionnelle du modèle ; fiche non dupliquée entre Bibliothèques ; distinctions de vocabulaire ; corpus pilote des 60 privé et non publié. Le premier lot reste limité par BIB-19 (limite de périmètre, pas du modèle).
- **A-2** (classe B) : citation exacte ; règles de lecture seule, référencement sans copie, redistribution à l'identique si autorisée, paramètres d'Exercice libres, Mouvements personnels modifiables, préservation des identités/références des 60 ; interdiction de réintroduire les quatre modes, une permission de copie ou `LOCAL_DERIVED` ; transition « Mouvement personnel envoyé puis catalogué » **À CLARIFIER**.
- **A-3** : branche d'intégration `catalogue/integration-pre10-20261111` depuis `composition-phases-duree` (`f5bb4316`). Vérifié en lecture : `migration024.ts` sur `f5bb4316`, `migration025`–`027` sur `pre10-son-voix` (locale).
- **A-4** (classe B) : 21 écrans Figma listés ; « Mes bibliothèques », « Bibliothèques partagées » et désinstallation reportées hors du premier lot, écrans conservés ; Profil ≠ éditeur de Mouvement ; deux variantes du Profil (`12116:25015`, `12119:25611`) ; premier lot = `12119:25611` sans toast de désinstallation ; **l'À CLARIFIER de l'axe G** (réconciliation A–H) est déclaré résolu.
- **A-5** : réemploi sélectif des PR #421 à #434, sans fermeture avant vérification.
- **A-6** (classe B) : Wi-Fi = canal de transport du même format et des mêmes validations.
- **Choix techniques P0** (classe D, non normatifs métier) : format catalogue v2 `2.0.0` ; registre `kodjo-catalogue-registry.db` schéma v2 séparé ; garde de lecture seule côté service ; référence par chemin à `docs/KODJO-Format-catalogue-mouvements-v1.md` § 10 de la branche `catalogue/connecte-dev-20261111` (fichier absent de la présente branche, non recopié).

## 3. Propagation (recherche ciblée)

| Document | Modification |
|---|---|
| 07 | Points ouverts du plan en six étapes, BIB-20, BIB-21, limites de validation BIB-19–23, colonne migration (024–027 utilisées, ≥ 028) : annotations datées. |
| 06, 13 | Entrées « Mes bibliothèques » / « Bibliothèques partagées » : À CLARIFIER annoté « Résolu par A-4 » (texte conservé) ; « Rendu Figma non validé » / « Écrans à concevoir » annotés ; 13 : phrase « mode Protégé » remplacée (texte d'origine conservé). |
| 08 | État des entrées Profil : résolu par A-4. |
| 09, 12, Revue Claude | Migration 024 : précision 024–027 utilisées, ≥ 028 ; 09 : registre v2 séparé ; 12 : choix techniques P0 et A-6. |
| 01 | Glossaire : « Copie personnelle » supersédée (texte d'origine conservé) ; Bibliothèque = collection logique (A-1). |
| 02, 03, 11, Parcours, Conception, Revue Claude (T-04) | Vestiges du mode « Protégé » remplacés par le droit de redistribution, textes d'origine annotés. |
| 02, 03, 04, 05, 06, 08, 09, 10, 11, 12, INDEX, PRODUCT, Parcours, Conception | Bandeau « Désinstallation et adaptations locales À CLARIFIER » : annotation A-2/A-4 (texte conservé). |
| INDEX | Nouvelle entrée renvoyant à la section A-1 à A-6. |
| Annexe – Index des identifiants | BIB-06/07 mis à jour (libellé antérieur conservé) ; lignes A-1 à A-6 ajoutées. |
| Annexe – Matrice de traçabilité | Ligne MOUV-D3 précisée ; lignes A-1, A-2, A-4, A-6 ajoutées. |
| 10 | Déjà cohérent après fusion (aucun ajout hors bandeau). |

## 4. Seconde passe indépendante

Recherches ciblées (hors `docs/preparation` et `docs/archives`, instantanés historiques) : `copie personnelle`, `copies personnelles`, `Libre localement`, `quatre modes`, `Copier est toujours`, `Copier localement`, `adaptation locale autoris`, `adaptations personnelles`, `LOCAL_DERIVED`, `authors[]`, `024`, `Mes bibliothèques`, `fichier physique`, `Protégé`, `permissions héritées`, `Modifier/Redistribuer`, `Partageable`.

- **Contradictions trouvées et corrigées :** `02` l. « permissions destinataires Protégé » ; `03` « mode destinataire Protégé » ; `01` glossaire « Copie personnelle » ; `11` « Publier sa propre fiche … Protégé » ; `13` « mode Protégé » ; Parcours (PU partage, contrôle 13) ; Conception §2.2 « fiches propres Protégées » ; Revue Claude T-04 ; Revue Claude constat `authors[]` annoté comme historique (tranché par MOUV-D1).
- **Occurrences restantes légitimes :** mentions dans des textes d'origine annotés ou dans la liste d'interdits d'A-2 ; `authors[]` uniquement comme format historique à remplacer ; « copies personnelles » de `03` l. 569 concernant les Séances partagées (hors fiches Mouvement) ; `024` uniquement dans des identifiants (B-024, D-024, RM-024, nœuds Figma) ou annotés ; « fichier physique » des médias (D-066, D-437), sans rapport avec A-1.
- **Marqueurs de conflit :** `git grep -n '^<<<<<<<\|^>>>>>>>\|^=======$'` → aucun résultat.
- **Liens :** 3 625 liens relatifs Markdown des 20 fichiers modifiés vérifiés (décodage `%20`/Unicode) → **0 lien cassé**.
- **Fins de ligne :** CRLF conservé dans tous les fichiers modifiés (aucun avertissement Git).

## Hypothèses non démontrées

- La correspondance entre les nœuds Figma listés et leur contenu provient de la décision A-4 transmise ; Figma n'a pas été relu dans cette mission.
- Les choix techniques P0 sont décrits d'après la consigne et le titre du § 10 constaté sur `catalogue/connecte-dev-20261111` (« Format v2 `2.0.0` (P0, 11/11/2026) ») ; le code n'a pas été relu.

## Points restant À CLARIFIER (non décidés)

1. Transition de statut d'un Mouvement personnel envoyé à l'administrateur puis catalogué (A-2).
2. Ajout d'un niveau (famille) à côté d'un Mouvement importé (permis dans le code, à confirmer).
3. Choix fiche par fiche en cas de conflit avec une adaptation historique pendant la mise à jour d'une Bibliothèque (non représenté dans Figma ; canal de revue existant).
4. Migration des homonymes `movements.normalized_name` (additive, ≥ 028, à coordonner avec PRE-10).
5. Toujours ouvert depuis le plan en six étapes : modalités détaillées d'import/export depuis Profil.

## Éléments non corrigés / hors périmètre

- Le rapport `2026-11-11_MOUVEMENTS_RECONCILIATION_DOCUMENTAIRE_A_H.md` (axe G « Restant : À CLARIFIER ») n'est pas réécrit (rapport d'une autre mission) ; la résolution est portée par le registre et les chapitres 06/08/13.
- Instantanés `docs/preparation/**` et `docs/archives/**` non modifiés (historiques).
- Les mentions génériques « permissions destinataires » (révision, contrôle serveur) sont conservées : elles désignent désormais le seul droit de redistribution et ne contredisent pas A-2.

## Preuves et tests

Mission documentaire : aucun test applicatif applicable. Contrôles exécutés : résolution des conflits par script avec comptage strict des zones, absence de marqueurs, vérification des liens, recherches de la seconde passe, vérification en lecture des migrations PRE-10 (`git ls-tree`).

## Vérifications restant à effectuer sur appareil réel

Aucune pour cette mission documentaire. Les contrôles d'implémentation (lecture seule des fiches importées, Profil `12119:25611`) relèvent des lots de développement.

## Fichiers modifiés

20 fichiers sous `docs/` (voir tableaux ci-dessus) et le présent rapport.

## Commits et état Git

- Fusion : `8eed89cf`.
- Décisions, propagation et rapport : commit qui suit `8eed89cf` sur `docs/catalogue-bibliotheques-baseline-20261111` (hash communiqué dans le compte rendu de mission ; un rapport ne peut pas contenir le hash de son propre commit).
- Poussé : `origin/docs/catalogue-bibliotheques-baseline-20261111`. Aucune fusion dans `main`, aucune PR.
