# 2026-10-06 — AUDIT_COMPLETUDE_COHERENCE_DOCUMENTAIRE_CADENCE_DSF

## Identifiant et objectif

- Mission : `AUDIT_COMPLETUDE_COHERENCE_DOCUMENTAIRE_CADENCE_DSF` — audit en lecture seule, sans correction.
- Objectif : vérifier que les changements Figma validés (composants, variantes, tokens, alias, couleurs, opacités, typographie par rôle, géométrie, icônes, règles de cartes, vocabulaire) sont reportés correctement dans la documentation active de la PR n° 323, et relever les contradictions et omissions.

## Départ

- Dépôt : `MyUncried/Application-Routine`.
- Têtes distantes vérifiées au démarrage (`git ls-remote`) : `refs/heads/docs/cadence-dsf-2026-10-06` = `12940315c30663988447b7f78572f62418bfc509` = `refs/pull/323/head` ; `refs/heads/main` = `6d03f5be579f2d0e2e7602b6abf1c2b46f4c740b`.
- Commit audité : `12940315c30663988447b7f78572f62418bfc509`, soit 4 commits depuis `main` (806536a, acb68bd, b06248d, 1294031), 188 fichiers, +2 902 / −393 lignes.
- Checkout séparé : worktree détaché sur le commit audité (`/tmp/audit-wt`), à partir d'un clone distinct ; aucune modification locale existante n'a été écrasée.
- Figma : fichier `G6RY5Ebhgwb4AHIOYDwwvg`, lecture seule, relevé du 2026-10-06.

## Périmètre

- Demandé : composants, tokens, typographie par rôle, couleurs/opacités/espacements/rayons/dimensions, règles de cartes et vocabulaire, assets, cohérence transverse ; matrice « changement source → décision ou preuve → document et section → résultat → correction ».
- Traité : tous les points ci-dessus avec des contrôles automatisés (recherche textuelle, comparaison d'empreintes, export direct de Figma) et des lectures ciblées. Non traité : lecture exhaustive des 57 documents actifs (voir § « Hypothèses et limites »).
- Exclus par la mission : correction des documents, du code ou de Figma ; interactions de prototype ; fusion, synchronisation, workflows VNext/V2/PRE-2/PRE-3, qualification, revue automatique.

## Pièces sources

| Pièce | Retrouvée | Preuve |
|---|---|---|
| Journal des modifications Figma | oui, `docs/archives/cadence-2026-10-06/journal-dsf-source.md` | SHA-256 identique à la pièce de travail du 05/10 (`ea9022a7…`, 19 087 octets) |
| Points à réintégrer | oui, `points-documentaires-source.md` | identique (`b7e6e8e7…`, 9 027 octets) |
| Rapport de corrections de l'audit | oui, `rapport-corrections-source.md` | identique (`85992951…`, 13 780 octets) |
| Brief `BRIEF-ALIGNEMENT-CODE-FIGMA-2026-10-05-v2` (v2.1) | **non conservé dans les archives** | NON VÉRIFIABLE : version consommée par la mise à jour non démontrée. La copie de travail de l'auditeur (`5e90753e…`, 43 933 octets) a été utilisée ; rien n'établit qu'elle soit identique à « v2(1) ». |
| Audit indépendant `AUDIT-DSF-SECONDE-PASSE-2026-10-05` | non conservé dans les archives | copie utilisée : `dac735e0…` |
| Plan documentaire validé | **absent du dépôt** | cité par le rapport de mission comme récupéré hors dépôt ; non consultable ici |

Les sept pièces archivées (README et empreintes) sont cohérentes avec ce qu'indique `archives/cadence-2026-10-06/README.md`.

## Résumé exécutif

- **Changements intégralement reportés** : couleurs et tokens créés (tableau couleurs du chapitre 12), alias `divider`/`iconNeutral`/`mediaSurface`, danger, scrims, typographie des rôles principaux (`compactCardTitle` 15/18, `cardTitle` 16, `caption`/`navLabel` 11/13, exceptions d'interligne), `DSF / Card title` obsolète, glyphes « photo » remplacés, assets (7/7 fichiers identiques à l'export Figma du jour), vocabulaire Circuit/Parcours (glossaire § « Circuit » et « Parcours »), zones corporelles (« Fessier » ajout utilisateur), état courant de Figma (133 frames + 3 jeux, 350/432/4 variables, 51 styles).
- **Contradictions ou omissions restantes** : 4 constats bloquants avant fusion (F-01 à F-04), 6 constats à corriger de préférence (F-05 à F-10), 5 mineurs (F-11 à F-15).
- **Écarts réservés à l'alignement du code** : voir la section dédiée.

| Statut | Nombre de lignes de la matrice |
|---|---:|
| CONFORME | 33 |
| PARTIEL | 13 |
| NON CONFORME | 7 |
| NON VÉRIFIABLE | 3 |

(56 lignes ; une ligne mixte est comptée selon son premier statut.)

## Constats

Gravité : **Majeure** (contradiction normative ou omission bloquante), **Moyenne** (valeur périmée ou omission à corriger), **Mineure** (formulation ou traçabilité).

### F-01 — Majeure — NON CONFORME — Échelles d'espacement et de rayon non mises à jour

- Source : journal § 3 (espacements 10, 14, 20 ; rayons 14, 17, 646 rayons et 763 espacements liés) ; brief D5 ; points #10 ; DSF-CADENCE § 2 (« 10, 14, 20 ajoutés à l'échelle ; rayons 14, 17 ajoutés »).
- Fichier/section : `docs/Specifications-fonctionnelles/12 – Architecture technique.md`, « Espacements et rayons », l. 940 (espacements `2, 4, 6, 8, 12, 16, 24, 32`), l. 941 (rayons fixes `6, 8, 10, 12, 16, 20, 24`), l. 974 (« Les valeurs `10`, `14`, `18`, `26`, `29` et `30` … ne sont pas des tokens »), l. 1007 (« Les valeurs historiques `9`, `9,4`, `14` et `18,8` … rationalisées vers `10`, `16` ou `20` »).
- Preuve : recherche de `spacing/10`, `spacing/14`, `spacing/20`, `radius/14`, `radius/17` dans les documents actifs : 0 occurrence ; DSF-CADENCE § 2 affirme l'inverse.
- Impact : contradiction directe entre le chapitre normatif et le DSF courant ; un développeur suivant le chapitre 12 refuse 10, 14, 20 et rayons 14, 17. Le renvoi général de l'introduction (l. 841) ne résout pas la contradiction écrite dans les tableaux.
- Correction recommandée : ajouter 10, 14 et 20 au tableau et à l'échelle des usages, 14 et 17 aux rayons (17 notamment pour le contrôle Tri), corriger les l. 974 et 1007 en les alignant sur la décision D5.

### F-02 — Majeure — NON CONFORME — Composants archivés, fusionnés ou renommés cités comme références actives

- Source : journal § 6.2, § 6.3, § 6.4 et annexe G du brief (tableaux de renommage) ; 13 familles archivées, 18 composants renommés, 659 instances fusionnées.
- Fichier/section : chapitre 12, « Composants et contrôles réutilisables », l. 793 (`Header / Fixed`), 797 (`Button / Primary — Source exact`, `State=Active/Disabled`), 798 (`Controls / Switch — Source exact`), 799 (`Controls / Disclosure — Source exact`), 800 (`Controls / Segmented`), 801 (`Forms / Text Field — Source exact`), 804 (`Overlay / Decision Dialog`), 811 (`Composition / Boundary Activity — Source exact`), 812 (`Activity / Name Field — Source exact`), 820 et 1035 (`Selection / Category Tag`), titres l. 756 et 775 (`Shell / Screen`, `Shell / Execution`) ; l. 824 déclare même `Controls / Disclosure — Source exact` « référence normative ».
- Preuve : dans Figma (relevé du jour), `DSF V2 — Archive / Composants fusionnés (lot 5)` contient 16 éléments (13 familles et 3 masters résiduels) et `DSF V2 — Primitives et gabarits` 18 ; les jeux DSF courants ont des variantes `État = …` (par exemple `Actions / Bouton primaire` 2, `Controls / Interrupteur` 2, `Controls / Segmenté` 6, `Overlays / Confirmation` 4, `Status & Tags / Statut d'exécution` 7, `Catégorie sélectionnable` 4). Aucune de ces références n'utilise le nom courant.
- Impact : références actives vers des composants que le DSF n'emploie plus ; variantes citées inexactes (`State=Active/Disabled` contre `État = Actif/Désactivé`).
- Correction recommandée : remplacer par les composants DSF courants (noms, variantes, identifiants) et qualifier les anciens noms d'historiques ; garder explicitement les exceptions conservées (6 dialogues sur l'ancien composant, `En-tête fixe (ancien)`, `En-tête fixe — exécution`).
- Réserve : les familles non renommées par le journal (`Picker / Popover`, `Forms / Select Field`, `Composition / Tour Section`, `Action / Add Media`, `Media / Gallery`, `Session / Name Field`) n'ont pas été reclassées ici (NON VÉRIFIÉ).

### F-03 — Majeure — NON CONFORME — Fusion, archivage et renommage des composants non consignés dans la documentation active

- Source : journal § 6.2 à § 6.4 ; points #19 et #21 (renvoyant au journal § 6.1 et § 6.3).
- Fichier/section : `docs/DSF-CADENCE-2026-10-06.md` § 1 (ne mentionne que les copies résiduelles) ; `06 – Ecrans et navigation de la V1.md` l. 2343 renvoie « aux références courantes … selon l'inventaire DSF-CADENCE » ; `docs/Specifications-fonctionnelles/images/README…` l. 117–123 présente `Status / Badge — Source exact` (`3959:5970`) comme preuve canonique.
- Preuve : recherche dans les documents actifs de `DSF / Primitives`, `DSF / Gabarits`, `Primitives et gabarits`, `Archive / Composants fusionnés`, `13 familles`, `31 familles`, `DSF / Overlays / Confirmation`, `Bouton primaire`, `Catégorie sélectionnable`, `Statut d'exécution` : 0 occurrence.
- Impact : le renvoi de la section 06 vers DSF-CADENCE est sans objet (renvoi sans destination) ; aucune correspondance ancien nom → nom courant → identifiant n'est disponible pour la documentation ni pour le lot code.
- Correction recommandée : ajouter à DSF-CADENCE une section de correspondance des composants (ancien nom, nom courant, variantes, identifiant, statut, exceptions), à partir du journal et de l'annexe G.

### F-04 — Majeure — PARTIEL — Fusion de tokens listée sans valeurs ni effets visuels, et anciennes valeurs encore actives

- Source : journal § 5.3 (fusions et écarts : 4, 4, 4, 8, 20, 0, 0, 0), § 5.2 (renommage `text-on-primary` en `on-primary`).
- Fichier/section : DSF-CADENCE § 2 (tableau des fusions, sans valeur ni effet) ; valeurs anciennes dans `06 – Ecrans…` l. 2481, `07 – Registre…` l. 312, chapitre 12 l. 1407 (`Badge replié #F4F4F8`, devenu `surface` `#F5F7FA`) ; `DSF-CARTES-ICONES-APPUIS-2026-09-30.md` l. 32 et 58 (`#FCFCFE`, devenu `surfaceSubtle` `#F9FAFC`).
- Preuve : les noms sont bien listés (8/8), le renommage `text-on-primary` → `on-primary` n'est pas mentionné ; les en-têtes « État courant 06/10 » des documents anciens parlent de valeurs « historiques lorsqu'elles sont remplacées » sans désigner lesquelles.
- Impact : un lecteur ne sait pas que le fond des cartes, le badge replié, le repère du chronomètre (`#BABDD1` → `#BEC2CC`) et le gris atténué (`#6B6E7A` → `#7A7A80`) ont changé ; risque de réutiliser les valeurs anciennes comme prescriptions.
- Correction recommandée : compléter le tableau des fusions (valeur ancienne, valeur courante, écart, usage concerné) et marquer ces valeurs comme historiques aux endroits cités.

### F-05 — Moyenne — NON CONFORME — Couleur des icônes neutres : valeur périmée dans des documents actifs

- Source : décision D7 (journal § 5.4 : `iconNeutral` = `textSecondary`, `#595E66`) ; chapitre 12 l. 857 (`#595E66`, conforme) ; `DSF-CARTES-ICONES-APPUIS` mis à jour à `#595E66`.
- Fichier/section : `06 – Ecrans…` l. 907 (« Sélection des exercices — modale » : palette `#0508E5/#5C636E/#C2C4D1`), `MATRICE-ECRANS-CARTES-2026-09-30.md` l. 146 (`#5C636E`) ; `06` l. 2478 (section du 28 septembre, `inactif #5C636E`, marquée par sa date mais sans mention de remplacement).
- Preuve : recherche de `5C636E` dans les documents actifs : 3 lignes.
- Impact : contradiction interne avec le chapitre 12 et avec DSF-CARTES.
- Correction recommandée : aligner les deux lignes actives sur `#595E66` ou les qualifier d'historiques ; ajouter une note de remplacement à la ligne datée.

### F-06 — Moyenne — PARTIEL — Typographie : rôles Roboto Condensed et graisses absents du tableau normatif

- Source : brief D1 et annexe D (Roboto Condensed Bold 100 et 158, Bold et SemiBold 30, Medium 24, SemiBold 16/22, Medium 16 et 17, SemiBold 12 ; trois graisses Medium, SemiBold, Bold).
- Fichier/section : chapitre 12, tableau l. 892–908 : une seule ligne Roboto (`Temps principal`, l. 894) ; l. 888 dit « graisses effectivement utilisées » sans les lister ; compteurs (30) et indication média (24) ne figurent que dans DSF-CADENCE § 3 et `06` l. 2485 ; le corps 158 n'apparaît dans aucun document actif.
- Preuve : lecture du tableau (valeurs effectivement écrites) et recherche de `Roboto` : 15 lignes, dont aucune ne liste les trois graisses dans le chapitre 12.
- Impact : le chargement de la police et les tokens des compteurs ne sont pas déductibles du chapitre normatif.
- Correction recommandée : ajouter les rôles compteurs et indication média au tableau et énumérer Medium, SemiBold et Bold ; consigner ou écarter explicitement le corps 158.

### F-07 — Moyenne — PARTIEL — Couleur `cards/border` et dimensions structurantes non documentées

- Source : brief annexe A.4 (`color/cards/border` `#CCD1E0`, 109 usages) et annexe C (`size/header-fixed-height` 95, `size/main-navigation-region-height` 77, `size/modal-bottom-action-height` 70, `size/content-max-width` 440, `size/modal-height` 822).
- Fichier/section : tableau des couleurs l. 847–880 ; « Dimensions structurantes » l. 1009 et suivantes.
- Preuve : recherche de `cards/border`, `cardsBorder`, `header-fixed-height`, `modal-bottom-action-height`, `content-max-width`, `main-navigation-region` : seule la valeur brute `#CCD1E0` apparaît dans des descriptions de cartes ; `size/modal-width` (378) et `size/modal-header-height` (60) sont bien présents.
- Impact : omission pour le lot code.
- Correction recommandée : ajouter le token et les dimensions, avec la réserve que `header-fixed-height` inclut la barre d'état et ne s'implémente pas tel quel.

### F-08 — Moyenne — PARTIEL — Opacités et règles du chronomètre non consignées

- Source : journal § 7.1 et § 9 (repères principaux 62 %, 16 petits traits 40 %, contrôles segmentés 50 %, contrôle Tri 72 et 75 %, `Rappel / Option` 82 %, roulettes 20 et 45 %) ; brief annexe H.1.
- Fichier/section : aucun chapitre actif ; DSF-CADENCE § 5 (A01) n'évoque que « 6 repères revenus à 62 % ».
- Preuve : recherche de `62 %`, `40 %`, `petits traits`, `repère du chronomètre` : une seule ligne utile.
- Impact : les opacités sont des valeurs de présentation nécessaires au rendu ; sans elles, l'alignement du code ne peut pas les reproduire.
- Correction recommandée : tableau des opacités par composant dans le DSF courant.

### F-09 — Moyenne — NON CONFORME (document contre Figma) — A01 présenté comme corrigé alors que Figma montre 100 %

- Source : DSF-CADENCE § 5, A01 : « Correction déclarée : 6 repères revenus à 62 % ».
- Preuve : lecture directe de Figma du 2026-10-06 : les trois repères (`quart`, `moitié`, `trois quarts`) des instances `6452:10039` et `6452:9958` ont une opacité de remplissage de 100 %. La correction du 05/10 avait été relue à 62 % dans un appel distinct ; l'état actuel la contredit (origine du retour à 100 % non établie).
- Impact : la ligne « déclarée » n'est pas vraie à la date de l'audit ; effet visuel faible mais mesurable.
- Correction recommandée : reformuler en « non persistante au 06/10 » ou rétablir 62 % dans Figma (hors périmètre de cette mission).

### F-10 — Moyenne — PARTIEL — Hauteur de ligne de `type.cardTitle` non alignée sur le traitement des autres rôles

- Source : brief D2 / annexe B (`cardTitle` 16, hauteur 19 en « auto ») ; décision du propriétaire : `cardTitle` reste 16 px (la hauteur de ligne n'a pas été tranchée séparément).
- Fichier/section : chapitre 12 l. 900 (`16 / 20`) comparé à l. 899, 903–905 (« 19 Auto ; 20 si style explicite », « 17 Auto ; … »).
- Impact : traitement incohérent entre rôles de même famille ; ambiguïté, pas contradiction avec une décision.
- Correction recommandée : indiquer « 20, rôle historique » avec la raison, ou ajouter « 19 Auto ».

### F-11 — Mineure — PARTIEL — A02 : formulation inexacte

- Source : DSF-CADENCE § 5, A02 : « Rapport contradictoire entre § 1 et § 5 ».
- Preuve : le rapport source § 1 dit « Clos par décision du propriétaire » et § 5 attribue la recréation au propriétaire ; les deux sont cohérents.
- Correction recommandée : reformuler (« recréation manuelle par le propriétaire, base 410/285 »). Les interactions ne sont pas à vérifier pour cet audit.

### F-12 — Mineure — PARTIEL — Index et README

- `docs/INDEX.md` et `docs/README.md` référencent DSF-CADENCE, la matrice, les archives et les trois spécifications, mais pas `RAPPORT-MISE-A-JOUR-CADENCE-2026-10-06.md` ni `assets/icons/figma-current-exports.json`. Liens relatifs : 0 cassé sur les cinq documents contrôlés.

### F-13 — Mineure — PARTIEL — Libellé « N circuits » non localisé

- Figma, relevé du jour : `N circuits` figure sur **1** écran de composition (`4893:6675`), `N tour(s)` sur 15 ; 0 occurrence de « Parcours » et 17 écrans portent « Circuit ». DSF-CADENCE § 4 qualifie le cas d'« exemple » d'écart de libellé sans citer l'écran. Correction recommandée : citer `4893:6675`. Aucune modification de Figma n'est exigée.

### F-14 — Mineure — NON VÉRIFIABLE — Plan documentaire, brief v2.1 et audit indépendant absents des archives

- Voir « Pièces sources ». Correction recommandée : archiver la version exacte du brief et de l'audit (avec empreinte) et lier le plan validé.

### F-15 — Mineure — PARTIEL — Couleurs écrites dans les SVG exportés

- Les exports sont fidèles à Figma, mais portent des couleurs littérales (`#1F2023` pour suivant et précédent, `#141414` pour fermer et retour, `#9499A8` pour tri, `#595E66` pour photo, `#0508E5` pour ajouter). Le document dit que le branchement runtime est inchangé ; il ne précise pas que la teinte sera à reporter par token lors du branchement. Correction recommandée : l'indiquer dans la section assets (lot code).

## Matrice de traçabilité

Légende : C = CONFORME, P = PARTIEL, NC = NON CONFORME, NV = NON VÉRIFIABLE.

### A. Composants

| # | Changement source | Décision / preuve | Document et section | Résultat | Correction |
|---:|---|---|---|---|---|
| 1 | 13 familles archivées | journal § 6.3 ; Figma : cadre d'archive (16) | aucun | NC | F-03 |
| 2 | 18 composants renommés (`DSF / Primitives …`, `Gabarits …`) | journal § 6.3 ; Figma : cadre (18) | aucun | NC | F-03 |
| 3 | 659 instances fusionnées vers les équivalents DSF | journal § 6.3 | aucun | NC | F-03 |
| 4 | Variantes ajoutées et supprimées (Bouton, Segmenté, Badge…) | journal § 6.3 ; Figma : jeux 2/2/6/4/7/4 | chapitre 12 l. 797–820 (anciens noms) | NC | F-02 |
| 5 | Exceptions : 6 dialogues, `En-tête fixe (ancien)`, `En-tête fixe — exécution` | journal § 10 | aucun | P | F-02 |
| 6 | `Valeur modifiable` (2 variantes, relevé courant : 4 avec Grisé) | Figma : 4 variantes | DSF-CADENCE § 1, chapitre 12 l. 813 | C | — |
| 7 | `En-tête fixe` (propriétés `Titre`, `Démarcation`), barre d'état décor | journal § 6.1 | DSF-CADENCE § 4 ; chapitre 13 (4 mentions) ; chapitre 12 | C | — |
| 8 | `Poignée de modale`, `Progression par tours`, `Tri` 34 × 34 | journal § 6.1 ; Figma : Tri 34×34 | DSF-CADENCE § 1 et § 4 | C | — |
| 9 | 3 masters résiduels archivés | Figma : 16 éléments d'archive | DSF-CADENCE § 1 et § 5 (A10) | C | — |
| 10 | `Status / Badge — Source exact` archivé | journal § 6.3 | `06` l. 2343 (historique, renvoi sans destination) ; images README l. 117–123 | P | F-03 |

### B. Tokens

| # | Changement source | Preuve | Document et section | Résultat | Correction |
|---:|---|---|---|---|---|
| 11 | 8 tokens fusionnés et supprimés | journal § 5.3 | DSF-CADENCE § 2 (noms) | P | F-04 |
| 12 | `text-on-primary` renommé `on-primary` | journal § 5.2 | chapitre 12 l. 876 (`color.onPrimary`) | P | F-04 |
| 13 | Alias `divider`, `iconNeutral`, `mediaSurface`, `navigation/pill` | journal § 5.4 | chapitre 12 l. 857, 859, 871 ; DSF-CADENCE § 2 | C | — |
| 14 | Rouge destructif sur `danger` | journal § 5.5 | chapitre 12 l. 864 ; DSF-CADENCE § 2 ; chapitre 13 l. 186 | C | — |
| 15 | Tokens créés (`textLabel`, `textTertiary`, `onPrimary`, `primarySoft`, `calendarMarker`, `breakpoint`) | journal § 5.1 | chapitre 12 l. 874–879 | C | — |
| 16 | `color/cards/border` (`#CCD1E0`) | brief A.4 | valeur brute seulement | P | F-07 |
| 17 | Deux scrims distincts | points #18 | chapitre 12 l. 873 et 880 ; DSF-CADENCE § 2 | C | — |
| 18 | Variables 350 / 432 / 4 ; 51 styles | Figma du jour | chapitre 12 l. 839 ; DSF-CADENCE § 1 | C | — |
| 19 | Primitives `dimension/17`, `observed/ed7314` | journal § 5.1 | non documentées | NV | — (détail d'implémentation Figma) |
| 20 | Valeurs anciennes `#F4F4F8`, `#FCFCFE`, `#5C636E` | journal § 5.3, § 5.4 | `06` l. 907 et 2481, `07` l. 312, chapitre 12 l. 1407, DSF-CARTES l. 32 et 58, MATRICE-ECRANS l. 146 | NC (907, 146) / P (autres, dates) | F-04, F-05 |

### C. Typographie

| # | Changement source | Preuve | Document et section | Résultat | Correction |
|---:|---|---|---|---|---|
| 21 | `compactCardTitle` 15 / 18 | décision propriétaire | chapitre 12 l. 902 ; DSF-CADENCE § 3 ; `13` l. 186 | C | — |
| 22 | `cardTitle` 16 | décision propriétaire | chapitre 12 l. 900 | C (taille) / P (interligne) | F-10 |
| 23 | Titres des nouvelles cartes 15 / 18 | Figma ; spécification | chapitre 12 l. 901 ; DSF-CADENCE § 3 | C | — |
| 24 | `caption` 11 / 13, `navLabel` 11 / 13 | D2 | chapitre 12 l. 907, 908 et 1040 | C | — |
| 25 | `body`, `label`, `button`, `sectionTitle`, `supporting` | D2 + exceptions | chapitre 12 l. 899, 903–906 | C | — |
| 26 | Exceptions d'interligne (14/18, 10/16, Roboto 16/22, Inter 12/15) | brief annexe B | DSF-CADENCE § 3 | C | — |
| 27 | Roboto Condensed (chrono, compteurs, indication média) | D1 | chapitre 12 l. 888 et 894 ; DSF-CADENCE § 3 | P | F-06 |
| 28 | `DSF / Card title` obsolète ; `5017:6051` sur style neutre | journal § 4 ; Figma : 0 usage, description « OBSOLÈTE » | chapitre 12 l. 890 ; DSF-CADENCE § 3 et § 5 | C | — |
| 29 | `type.timerPrimary` non conforme | audit § 3 | chapitre 12 l. 894 | C | — |

### D. Couleurs, opacités, géométrie

| # | Changement source | Preuve | Document et section | Résultat | Correction |
|---:|---|---|---|---|---|
| 30 | Espacements 10, 14, 20 ; rayons 14, 17 | journal § 3 | chapitre 12 l. 940, 941, 974, 1007 | NC | F-01 |
| 31 | Même ajout, vu du DSF | journal § 3 | DSF-CADENCE § 2 | C | — |
| 32 | Opacités (62 %, 40 %, 50 %, 72/75 %, 82 %, 20/45 %) | journal § 7.1, § 9 | aucune | P | F-08 |
| 33 | A01 : repères à 62 % | Figma du jour : 100 % | DSF-CADENCE § 5 | NC | F-09 |
| 34 | Dimensions structurantes | brief annexe C | chapitre 12 « Dimensions structurantes » | P | F-07 |
| 35 | Barre d'état décor, Safe Areas | points #11 | DSF-CADENCE § 4 ; chapitre 13 | C | — |

### E. Icônes et assets

| # | Changement source | Preuve | Document et section | Résultat | Correction |
|---:|---|---|---|---|---|
| 36 | 6 SVG déposés + `action-add.svg` réutilisé | 7/7 identiques à l'export `SVG_STRING` de Figma du jour ; `sha256` et `gitBlob` du JSON tous corrects ; XML et `viewBox` valides | DSF-CADENCE § 6 ; `assets/icons/figma-current-exports.json` | C (présence, provenance) | — |
| 37 | Mapping des 12 identifiants du manifeste | audit A03 | DSF-CADENCE § 6 (mapping préparatoire) | P (voulu) | lot code |
| 38 | Dimensions de navigation | audit A04 | DSF-CADENCE § 6 | P (voulu) | lot code |
| 39 | Manifeste inchangé (25 entrées, 33 SVG, 8 non inscrits) ; `src/` inchangé | `git diff` vide sur `manifest.json` et `src` | DSF-CADENCE § 6 | C (branchement hors périmètre) | lot code |
| 40 | Glyphes « photo » remplacés | Figma : 0 texte SF Pro ; composant 24 × 24 | DSF-CADENCE § 1 et § 5 (A09) | C | — |
| 41 | Couleurs littérales des SVG | analyse des fichiers | non précisé | P | F-15 |

### F. Cartes, vocabulaire, libellés

| # | Changement source | Preuve | Document et section | Résultat | Correction |
|---:|---|---|---|---|---|
| 42 | Parcours (contrôles segmentés) / Circuit (composition) | décision D10 ; Figma : 17 écrans « Circuit », 0 « Parcours » | glossaire l. 51 et 138 ; INDEX l. 189 ; `13` l. 515 ; DSF-CADENCE § 4 | C | — |
| 43 | « N circuits » (écran `4893:6675`) | Figma : 1 écran contre 15 « N tour(s) » | DSF-CADENCE § 4 | P | F-13 |
| 44 | Entrée « Un circuit » de l'arbre de création | décision documentaire antérieure | `13` l. 515 (« retiré ») | C (documentation) | lot code |
| 45 | Zones corporelles de démonstration (11 noms) | Figma : 0 étiquette par défaut | `13` l. 2980 (référentiel 10 + Fessier) | C | — |
| 46 | Pastilles « Actives » / « Archivées » | Figma : rétablies | PRODUCT l. 104 ; `06` l. 268 ; `13` l. 99 | C | — |
| 47 | Règles des cartes (15 pour les nouvelles cartes, 16 hors famille) | chapitre 12 l. 900–901 ; DSF-CADENCE § 3 | C | — |
| 48 | Phrases de démonstration différentes du texte généré | mission | RAPPORT § clarifications ; matrice | C | — |

### G. Cohérence transverse

| # | Contrôle | Preuve | Résultat | Correction |
|---:|---|---|---|---|
| 49 | 133 frames + 3 jeux de Prototype MVP | Figma : 133 + 3, 133 identifiants uniques | C | — |
| 50 | Matrice Cadence ↔ Figma | 136 identifiants présents sur 136 | C | — |
| 51 | 30 contrats, rubriques 1 à 21 | script : 30 contrats, 0 ordre incorrect | C (structure) | — |
| 52 | Captures PNG | PR : 8 ajoutés et 127 modifiés ; fidélité visuelle non rejouée | NV | — |
| 53 | Liens relatifs (INDEX, README, DSF-CADENCE, matrice, rapport) | 0 lien cassé | C | — |
| 54 | Archives = pièces d'origine | 3 sur 3 identiques à mes pièces | C | — |
| 55 | Index et README | rapport et provenance JSON non listés | P | F-12 |
| 56 | Brief v2.1, audit, plan | absents des archives | NV | F-14 |

## Éléments reportés à l'alignement du code (hors correction documentaire)

- `tokens.ts` : valeurs de `divider`, `iconNeutral`, `mediaSurface` ; ajout de `textLabel`, `textTertiary`, `onPrimary`, `primarySoft`, `calendarMarker`, bordure renforcée ; espacements 10, 14, 20 et rayons 14, 17 ; interlignes des rôles ; `compactCardTitle` 15/18 ; `caption` et `navLabel` 13 ; remplacement des couleurs destructives des dialogues par `danger`.
- Polices : chargement de Roboto Condensed (Medium, SemiBold, Bold) et tokens de chronomètre.
- Libellés : le segment de catalogue « Circuits » du code doit devenir « Parcours » ; l'entrée « Un circuit » de l'arbre de création.
- `ProfileStepper.tsx` : « − » et « + » en texte.
- Assets : manifeste (12 identifiants obsolètes, dimensions de navigation, 8 SVG non inscrits), branchement runtime, teinte des icônes par token.

## Hypothèses et limites

- Figma relevé en lecture seule le 2026-10-06 ; il peut avoir évolué depuis (par exemple le retour à 100 % de F-09).
- Les statuts sont établis par recherche textuelle ciblée et lecture des sections concernées ; les 57 documents actifs et les 219 PNG n'ont pas été relus intégralement. L'absence d'une occurrence signifie « non trouvée par recherche », pas « jamais écrite ».
- La fidélité pixel des captures n'a pas été rejouée ; aucun nouvel export PNG n'a été effectué.
- Les comptes du journal (volumes de liaisons) n'ont pas été re-mesurés ; ils sont reportés dans la matrice comme sources.
- Cet audit est mené par l'IA qui a réalisé les modifications Figma ; une relecture indépendante des constats F-01 à F-04 reste utile.
- Aucun test applicatif : mission documentaire, aucun fichier applicatif touché, aucune recette sur appareil.

## Vérifications restant à effectuer sur appareil réel

Aucune pour cette mission documentaire. Pour le lot code ultérieur : rendu du chronomètre en Roboto Condensed, hauteurs de ligne, séparateurs et icônes inactives, icônes de navigation.

## Modifications réalisées

- Création de ce seul fichier de rapport. Aucun document audité, code ou fichier Figma modifié.

## Fichiers modifiés

- `.github/orchestration/reports/2026-10-06_AUDIT_COMPLETUDE_COHERENCE_DOCUMENTAIRE_CADENCE_DSF.md` (nouveau).

## Destination et état Git

- Destination prévue : branche `docs/cadence-dsf-2026-10-06` (PR n° 323, ouverte, non fusionnée).
- **Publication non réalisée** : l'environnement de cette mission n'a aucun accès en écriture à GitHub (aucun identifiant, aucun connecteur).
- Le commit final est local (voir la réponse de la mission pour son hash et l'état Git) ; un patch applicable (`git am`) est fourni.
