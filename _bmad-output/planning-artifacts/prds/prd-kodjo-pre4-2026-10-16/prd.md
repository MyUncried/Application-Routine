---
title: PRE-4 — Finalisation de l'éditeur Exercice et cible À l'échec par série
status: final
created: 2026-10-16
updated: 2026-10-17
---

# PRD : PRE-4 — Finalisation de l'éditeur Exercice et cible À l'échec par série

## 0. Objet du document

Ce PRD décrit ce que doit faire l'application KODJO (Routine) à l'issue de PRE-4 : la finalisation de l'Éditeur d'Exercice et l'introduction de la cible À l'échec par série. Il est limité au périmètre ED-01 à ED-22 de `docs/preparation/PRE-4/perimetre-et-couverture.md`, avec les exclusions de ce document. Il sert d'entrée aux skills BMad suivants (architecture, epics et stories, sprint planning), puis à la revue indépendante par ChatGPT exigée par `CLAUDE.md` avant tout développement.

Le PRD n'invente aucune règle. Chaque conséquence testable cite sa source :
- une ligne des sources normatives consolidées de `caa2a5cf`, copiées sous `docs/preparation/PRE-4/bmad/sources-caa2a5cf/` (notation `[13]:3015` = ch. 13, ligne 3015 ; `DSF2M` = DSF Deux modes du 13/10 ; toutes les abréviations sont définies dans la table de correspondance unique en tête du §4 ; voir aussi `sources-retenues.md` §4) ;
- une décision de Hermann (Q1 à Q30) ;
- une règle de priorité écrite (P1 à P45) ;
- une hypothèse signalée (H4 à H33), marquée `[ASSUMPTION]` ; H5, confirmée par Q29, et H30, remplacée par Q30, ne sont plus des hypothèses.

Q, P et H sont définis dans `docs/preparation/PRE-4/bmad/questions-ouvertes.md`. Les extractions complètes, règle par règle et ligne par ligne, sont dans `extracts/` à côté de ce fichier. Les tables de couverture, qui relient chaque règle extraite à une exigence ou expliquent pourquoi elle n'est pas reprise, sont regroupées dans l'annexe A, une sous-section par groupe de fonctionnalités. Hors le point 6 du §9 (libellé du résumé de carte d'un Exercice tout à l'échec, en attente de Hermann), le PRD ne contient plus de point sans décision, règle ni hypothèse. Les questions ouvertes restantes sont au §9.

Le vocabulaire suit le glossaire du §3. La solution technique n'est pas décrite ici : elle relève de l'architecture. Les indications techniques trouvées dans les sources sont regroupées, à titre non contraignant, dans `addendum.md`.

## 1. Vision

PRE-4 achève l'Éditeur d'Exercice : un seul écran, servant les quatre Parcours d'édition, conforme aux références visuelles courantes et dont chaque contrôle passe par la primitive native du système quand elle existe. La feuille Paramètres d'exécution y gagne des popovers ancrés, un Régime choisi explicitement et un Tableau des séries variables piloté par un Pied commun, sans steppers permanents dans chaque cellule.

Le changement de fond porte sur le modèle : « À l’échec » cesse d'être un troisième Mode et devient un **type de Cible, choisi Série par Série**. Un Exercice peut alors enchaîner deux Séries de 10 et 12 répétitions, puis une Série menée jusqu'à l'échec, ce que l'ancien modèle interdisait. Tout ce qui dépend des Cibles suit ce changement : le Sélecteur de cible, les calculs de Durée totale (avec un total partiel ≥ quand une Cible à l'échec rend le total inconnu), la Phrase des paramètres, l'enregistrement et les copies.

Ce qui existe doit survivre intact. Les Exercices créés avant PRE-4, y compris en ancien mode À l'échec, leurs Copies en Séance, leurs Médias et leurs référentiels sont migrés sans perte, sans valeur inventée et sans conversion silencieuse. Seule exception, décidée par Hermann (Q19) : un Exercice dont les paramètres sont illisibles est écarté, sans lien orphelin ni suppression d'une Séance entière, et leur nombre est signalé. Les 276 phrases de référence restent exactes.

## 2. Utilisateur cible

### 2.1 Tâches à accomplir

- **Fonctionnelle :** décrire un Exercice tel qu'il sera réellement exécuté, y compris quand certaines Séries se font jusqu'à l'échec et d'autres sur un objectif chiffré.
- **Fonctionnelle :** lire d'un coup d'œil, dans la phrase et la Durée totale, ce que l'Exercice demande et ce qu'il durera, ou au moins combien de temps il durera au minimum.
- **Contextuelle :** régler tout cela au pouce, sur iPhone, avec les roulettes et menus du système, sans perdre un réglage à cause d'un changement de Mode ou du nombre de Séries.
- **Confiance :** retrouver après la mise à jour tous ses Exercices, Séances, Médias et référentiels tels qu'ils étaient.

### 2.2 Non-utilisateurs

PRE-4 ne vise ni l'exécution d'une Séance (moteur, chronomètre, sons), ni le suivi des performances, ni la composition de Séances au-delà de ce que les nouvelles Cibles rendent nécessaire (Q4).

### 2.3 Parcours utilisateur clés

L'application a un seul rôle utilisateur et ne compte pas de persona ; les parcours ci-dessous suivent les quatre Parcours d'édition d'ED-01.

- **UJ-1. Hermann crée au Catalogue un gainage dont la dernière Série va jusqu'à l'échec.** Depuis le Catalogue, il ouvre l'Éditeur d'Exercice, nomme l'Exercice, choisit une Catégorie et ses Zones corporelles, puis touche la Carte Paramètres d'exécution. Dans la Feuille, il choisit le Mode Durée, 3 Séries et le Régime variables, puis touche chaque cellule de Cible : 30 s, 45 s, et pour la dernière, « Aucune durée, à l’échec ». Le bloc minutes-secondes passe au grisé, mais reste manipulable. La phrase indique « 3 séries de durée variable (30 s, 45 s puis jusqu’à l’échec) » et la Durée totale s'affiche précédée de ≥. Il valide par ✓, puis touche Terminer. **Cas limite :** il passe au Mode Répétitions : la Cible à l'échec est conservée, les deux Cibles en secondes passent à renseigner, et le ✓ reste indisponible jusqu'à ce qu'il les renseigne. (ED-01 à ED-08, ED-10, ED-11, ED-13, ED-16)
- **UJ-2. Hermann modifie au Catalogue un ancien Exercice « À l’échec ».** Après la mise à jour, l'Exercice apparaît en Mode Répétitions, toutes ses Cibles à l'échec. Pauses, côtés, Médias et référentiels sont inchangés, et la phrase « 3 séries menées jusqu’à l’échec » est identique. Il passe au Régime variables et remplace la première Cible par 12 répétitions. La phrase énumère alors les Cibles dans l'ordre, et la Durée totale reste omise faute de Bip. (ED-18, ED-04, ED-10, ED-13, ED-16)
- **UJ-3. Hermann ajoute un Exercice à une Séance, puis modifie la copie.** Dans Composition, il ajoute un Exercice du Catalogue, ouvre la Copie en Séance et change une Cible. Le même Éditeur s'ouvre. Terminer revient à Composition, et la copie est enregistrée au Continuer de Composition. La Définition d'Exercice au Catalogue reste inchangée, et la carte de Composition affiche la durée selon Q17. (ED-01, ED-19, ED-15)
- **UJ-4. Hermann crée un Exercice depuis une Séance.** Le parcours de création dans une Séance, accepté en PRE-3 (dans Composition, `Ajouter un exercice` puis `Un nouvel exercice`, FR-01-03), ouvre le même Éditeur ; Terminer place l'Exercice créé dans le brouillon de Composition, sans l'ajouter au Catalogue, et aucune Récupération n'est ajoutée automatiquement. (ED-01, P8, P15)

## 3. Glossaire

Termes employés tels quels dans tout le PRD et dans les documents qui en dérivent. Ils suivent le glossaire produit (ch. 01 §8 à `caa2a5cf`) : le terme métier « Set » est proscrit (D-077) ; « Exercice » remplace « Activité » à l'interface, les identifiants techniques `ActivityDefinition` et `ACTIVITY` restant inchangés (D-201, D-202).

- **Exercice** — Unité d'entraînement paramétrée : nom, Catégorie, Zones corporelles, Paramètres d'exécution, description, Médias. Il existe sous deux formes : Définition d'Exercice et Copie en Séance.
- **Définition d'Exercice** — Exercice enregistré au Catalogue. Il est la source des copies et n'est jamais modifié par l'édition d'une copie.
- **Copie en Séance** — Exercice placé dans une Séance, copié depuis une Définition d'Exercice ou créé dans la Séance. La copie est isolée : la modifier ne change ni la Définition ni les autres copies.
- **Séance** — Suite planifiée d'Exercices, de récupérations et de phases, composée dans Composition. Sa refonte est hors périmètre.
- **Circuit** — Conteneur de Séance répété ; un **Tour** est une répétition du Circuit (D-209 ; glossaire ch. 01 §8, « Set → Circuit »). On distingue le circuit de séries et le circuit de tours (`questions-ouvertes.md` §4). Le terme sert aux calculs d'agrégation (FR-15-03, FR-15-04) et à la compatibilité d'un N hérité (FR-01-09, FR-12-07) ; aucun libellé « Circuit » ni « Tour » n'apparaît dans l'Éditeur d'Exercice. Les identifiants techniques historiques `tour*` et `IN_TOUR` ne sont pas renommés (D-201, D-202, NFR-13).
- **Éditeur d'Exercice** — L'écran unique qui crée ou modifie un Exercice, dans les quatre Parcours d'édition.
- **Parcours d'édition** — Les quatre entrées de l'Éditeur d'Exercice : créer au Catalogue, modifier au Catalogue, créer dans une Séance, modifier une Copie en Séance.
- **Carte Paramètres d'exécution** — Bloc de l'Éditeur d'Exercice qui affiche la Phrase des paramètres et les lignes Compte à rebours et Fin, et ouvre la Feuille Paramètres d'exécution (Q11).
- **Feuille Paramètres d'exécution** — Surface modale qui règle le Mode, N, le Régime, les Cibles, les Pauses, les côtés, le Bip, la Durée totale, le Compte à rebours et la Fin. Elle travaille sur son propre Brouillon, appliqué à l'Éditeur par son ✓ (Q11, Q12).
- **Mode** — Unité de la Cible numérique : **Durée** (secondes) ou **Répétitions** (nombre). Il n'existe que ces deux Modes ; « À l’échec » n'est plus un Mode mais un type de Cible (ED-05).
- **Série** — Une exécution de la Cible, suivie de sa Pause. N désigne le nombre de Séries de l'Exercice.
- **Régime** — Choix explicite entre **identiques** (une Cible et une Pause communes à toutes les Séries) et **variables** (une Cible et une Pause par Série, dans un ordre). Le Régime se choisit par popover et ne se déduit jamais de l'égalité des valeurs (ED-04).
- **Cible** — Objectif d'une Série, typé : **numérique** (une valeur entière dans les bornes du Mode), **à l'échec** (sans valeur), ou **à renseigner** (état de brouillon, jamais enregistrable). Une Cible à renseigner, nulle ou invalide n'est jamais convertie en Cible à l'échec (ED-06).
- **Cible mixte** — Ensemble ordonné des Cibles d'un Exercice en Régime variables qui mêle des Cibles numériques et des Cibles à l'échec.
- **Sélecteur de cible** — Roulette native de choix d'une Cible, avec ses propres ✕/✓ (Q12). En Durée : roulette minutes-secondes et option « Aucune durée, à l’échec » au-dessus. En Répétitions : roulette à une colonne dont la première ligne est « Aucune répétition, à l’échec », suivie de 1 à 100 (Q8, Q14).
- **Grisé manipulable** — Rendu atténué à 45 % du bloc minutes-secondes du Sélecteur de cible en Durée quand la Cible à l'échec est choisie. Le bloc reste manipulable : le faire tourner choisit à nouveau une Cible numérique, sans déverrouillage (ED-08). Le terme ne désigne pas un contrôle désactivé.
- **Tableau des séries variables** — Liste des Séries en Régime variables : poignée, numéro, Cible, Pause et retrait par ligne.
- **Cellule active** — La seule cellule (Cible ou Pause) du Tableau des séries variables sur laquelle agit le Pied commun.
- **Pied commun** — Commandes − valeur + situées sous le Tableau des séries variables, qui agissent sur la seule Cellule active (ED-10).
- **Pause** — Repos après une Série, dernière comprise, réglé en secondes ; 0 est valide.
- **Changement de côté**, **Ordre des côtés**, **Pause au changement de côté** — Réglages de bilatéralité : sans changement, ou les deux côtés ; par paire (un côté puis l'autre à chaque Série) ou par côté (toutes les Séries d'un côté puis de l'autre) ; repos entre les côtés.
- **Bip** — Cadence sonore, de 0 (Aucun) à 10 s, commune à l'Exercice et conservée d'un Mode à l'autre. Il n'a d'effet sur le calcul et la phrase qu'en Répétitions, où il rend estimable la durée d'une Série.
- **Compte à rebours** et **Fin** — Phases d'entrée et de sortie de l'Exercice, affichées sur des lignes séparées de la Carte et exclues du total intrinsèque.
- **Durée totale** — Total intrinsèque de l'Exercice, de nature **exacte** (sans symbole), **estimée** (≈), **partielle** (≥, plancher calculable d'un mélange de Cibles numériques et à l'échec, prioritaire sur ≈) ou **omise** (aucun montant). Elle exclut Compte à rebours et Fin.
- **Inversion du total** — Choix d'une Durée totale par roulette, qui calcule le nombre de Séries N ; la Cible reste inchangée (ch. 10 l. 615, RM-130). Elle n'existe qu'en Durée, Régime identiques, Cible numérique ; elle est indisponible dès qu'une Cible est à l'échec (ED-14).
- **Récupération** (R) — Repos de Séance après un Exercice ; une Récupération positive remplace la Pause terminale de cet Exercice dans le plan de la Séance.
- **Phrase des paramètres** — Texte généré à l'affichage, jamais enregistré, qui décrit les Paramètres d'exécution, valeurs et unités en gras (ED-16).
- **Corpus 276** — Les 276 phrases de référence v15 (`docs/archives/evolutions-v15-2026-10-07/phrases-276.json`), oracle de non-régression de la Phrase des paramètres (ED-17).
- **Brouillon** — État non enregistré : Brouillon de la Feuille (appliqué par ✓, perdu par ✕), Brouillon de l'Éditeur (enregistré par Terminer au Catalogue), Brouillon de Composition (enregistré au Continuer de Composition, pour une Copie en Séance).
- **Réserve** — Mémoire temporaire du Brouillon de la Feuille qui conserve des valeurs mises de côté (Cibles d'un autre Mode, lignes retirées par diminution de N, tableau variable mis de côté) pour les restaurer sans conversion.
- **Catégorie** et **Zone corporelle** — Référentiels de classement de l'Exercice, gérés depuis l'Éditeur (ED-20). Au moins une Zone corporelle (D-211).
- **Média** — Photo ou vidéo locale attachée à un Exercice dans un ordre ; le fichier physique est partagé entre copies et n'est jamais supprimé tant qu'une référence existe (ED-21). Dans l'Éditeur, un Média se consulte en plein écran en touchant sa tuile, une vidéo par le lecteur natif, sans lecture automatique ; l'appui long ouvre son menu (Q27, Q31, FR-21-05).
- **Instantané** — Représentation versionnée et immuable d'un Exercice à un instant, lue selon sa version et jamais réécrite (ED-19).
- **Ancien mode À l'échec** — Troisième Mode des données antérieures à PRE-4. La migration le convertit en Mode Répétitions avec toutes les Cibles à l'échec (ED-18).

## 4. Fonctionnalités

Les exigences fonctionnelles sont organisées par exigence d'édition du périmètre (ED-01 à ED-22), une sous-section par ED, de 4.1 (ED-01) à 4.22 (ED-22). La sous-section 4.21b rassemble la partie données d'ED-21, juste après sa partie interface (4.21). Chaque exigence est numérotée `FR-{ED}-{rang}` (par exemple FR-07-04 pour la quatrième exigence d'ED-07) ; pour ED-21, les rangs 01 à 49 sont réservés à l'interface et la partie données commence à FR-21-50. Chaque exigence énonce une capacité, puis ses conséquences testables ; chaque conséquence cite sa source entre `*source :*` (ligne d'une source normative, décision Q, règle de priorité P, hypothèse `[ASSUMPTION: Hn]`). Les références visuelles Figma ne fixent que le rendu (D-255, D-300). Les tables de couverture sont regroupées dans l'annexe A ; les indications techniques non contraignantes sont dans `addendum.md`.

Les sous-sections ont été rédigées en quatre groupes, chacun avec sa propre notation de citation, reproduite ci-dessous. Toutes les notations désignent les fichiers de la table de correspondance unique qui suit.

### Table de correspondance des abréviations de sources

Recensement fait par recherche dans ce PRD le 2026-10-16. Plusieurs abréviations désignent le même fichier : elles sont équivalentes. `l` désigne un numéro de ligne, écrit `:l` ou ` l. l`.

| Abréviation(s) employée(s) | Fichier désigné |
|---|---|
| `S/NN…:l`, `[NN]:l`, `CNN l. l`, `chNN:l` (NN = 01, 04 à 13) | `docs/preparation/PRE-4/bmad/sources-caa2a5cf/docs/Specifications-fonctionnelles/NN – <titre>.md` (copies consolidées de `caa2a5cf`). Ch. 13 : lignes 1-4345 seulement ; la section l. 4346-5996 est reprise via la vérification Q7 (ligne `Q7` ci-dessous). |
| `S/` | Dossier `docs/preparation/PRE-4/bmad/sources-caa2a5cf/docs/Specifications-fonctionnelles/` |
| `D/` | Dossier `docs/preparation/PRE-4/bmad/sources-caa2a5cf/docs/` |
| `[DSF2M]`, `DSF-DM`, `DSF-2M`, `D/DSF-DEUX-MODES…` | `…/sources-caa2a5cf/docs/DSF-DEUX-MODES-ECHEC-2026-10-13.md` |
| `[DSFCIR]`, `D/DSF-CIRCUITS…` | `…/sources-caa2a5cf/docs/DSF-CIRCUITS-CONTROLES-2026-10-12.md` |
| `D/DSF-INTERFACE…` | `…/sources-caa2a5cf/docs/DSF-INTERFACE-GENERALE-2026-10-08.md` |
| `DSF-PH` | `…/sources-caa2a5cf/docs/DSF-PHRASES-V15-2026-10-07.md` |
| `[MAT2M]`, `MAT-2M`, `MAT-DM` | `…/sources-caa2a5cf/docs/MATRICE-DEUX-MODES-ECHEC-2026-10-13.md` |
| `B/`, `B/06…:l` | Base `c32e360d`, `docs/Specifications-fonctionnelles/` (traçabilité seulement) ; `B/06…` = ch. 06 de la base |
| `[B-2M]`, `B-DM` | Base, `docs/Specifications-fonctionnelles/SPECIFICATION-DEUX-MODES-ECHEC-PAR-SERIE-2026-10-13.md` |
| `[B-v13]` | Base, `docs/Specifications-fonctionnelles/SPECIFICATION-PARAMETRES-MODALE-v13.md` |
| `B-PH1` | Base, `docs/Specifications-fonctionnelles/SPECIFICATION-PHRASE-PARAMETRES-EXECUTION-v1.md` |
| `B-PH10` | Base, `docs/Specifications-fonctionnelles/SPECIFICATION-PHRASE-PARAMETRES-EXECUTION-v10.2.md` (historique) |
| `B-BIP` | Base, `docs/Specifications-fonctionnelles/SPECIFICATION-BIP-CADENCE-v2.md` |
| `CORPUS`, `CORPUS id n`, `CORPUS README` | `docs/archives/evolutions-v15-2026-10-07/phrases-276.json` et `README.md` du même dossier |
| `PERIM:l` | `docs/preparation/PRE-4/perimetre-et-couverture.md` |
| `PRE3-PERIM:l`, `PRE3-PERIM §n` | `docs/preparation/PRE-3/perimetre-et-couverture.md` ; `PRE3-PERIM:l (P3-nn)` cite la ligne `l` de la matrice de couverture PRE-3 qui porte l'identifiant `P3-nn` |
| `references-figma.json`, `recette-iphone.md` | `docs/preparation/PRE-4/references-figma.json` ; `docs/preparation/PRE-4/bmad/recette-iphone.md` |
| `[FIG] nœud`, `8328:…`, `8470:…`, `7119:…`, `5544:…`, `8452:…`, `8129:…` | Nœud Figma, fichier « Application Routine » ; références visuelles seulement (D-255, D-300) |
| `Qn`, `Pn`, `Hn` | `docs/preparation/PRE-4/bmad/questions-ouvertes.md` (§1, §2, §5). **`P3` désigne exclusivement la règle de priorité P3** (libellé « tout échec ») |
| `Q7:n.m`, `Q7 n.m`, et dans 4.18-4.21b `n.m` seul (ex. `18m.1`, `21.6`) | Assertions de `extracts/q7-inventaire-verification.md` (section « Inventaire opposable PRE-4 », ch. 13 l. 4346-5996) |
| `Q-07` | Question Q-07 du ch. 07 (C07 l. 475), distincte de la décision Q7 de Hermann |
| `Δn` | Écarts relevés dans `docs/preparation/PRE-4/bmad/sources-retenues.md` |
| `D-nnn`, `RM-nnn`, `API-…`, `CE-…`, `CIR-nn` | Décisions (ch. 07), règles métier (ch. 10), API (ch. 11), contrats d'écran (ch. 13), décisions Circuits (ch. 07) |
| `EDnn-nn` | `extracts/ed01-04-20-22-ui.md` |
| `EDnn-Rnn`, `ED04L-Rnn` | `extracts/ed05-12-cibles.md` |
| `R13-xx` à `R17-xx` | `extracts/ed13-17-calculs-phrases.md` |
| `DT15-xx`, `R18-xx`, `R19-xx`, `R21-xx`, `C-xx`, `M-xx`, `T-xx` | `extracts/ed18-19-21-donnees.md` (`DT15-xx` : partie ED-15, §4) |
| `AGENTS.md`, `CLAUDE.md` | Fichiers d'instructions du dépôt |

**Apostrophe des littéraux.** Dans les textes d'interface et les gabarits littéraux (entre accents graves ou guillemets « »), l'apostrophe est l'apostrophe typographique `’` (U+2019) du Corpus 276 et du lexique existant. Les noms de frames Figma de la table de 4.22 sont des identifiants de recherche, pas des textes d'interface.

### Conventions de citation par groupe

**Sous-sections 4.1 à 4.3 et 4.20 à 4.22 (Éditeur, Feuille, référentiels, Médias côté interface, fidélité et accessibilité).** Rédigées le 2026-10-16 à partir de l'extrait `extracts/ed01-04-20-22-ui.md`, de la vérification Q7 (`extracts/q7-inventaire-verification.md`), des décisions Q1-Q21, des points P1-P38 et des hypothèses H4-H26 de `docs/preparation/PRE-4/bmad/questions-ouvertes.md`. Les termes en capitale initiale sont ceux du glossaire (§3).

**Conventions de citation** (reprises de l'extrait) :
- `S/` = `docs/preparation/PRE-4/bmad/sources-caa2a5cf/docs/Specifications-fonctionnelles/` ; `S/13…` = ch. 13 Contrats d'écran, `S/07…` = ch. 07 Registre des décisions, `S/06…` = ch. 06 Écrans et navigation, `S/08…` = ch. 08 Conception détaillée, `S/09…`, `S/10…`, `S/11…`, `S/12…` = ch. 09 à 12, `S/01…` = ch. 01 Glossaire.
- `D/` = `docs/preparation/PRE-4/bmad/sources-caa2a5cf/docs/` (DSF et matrice : `D/DSF-CIRCUITS…`, `D/DSF-DEUX-MODES…`, `D/DSF-INTERFACE…`).
- `PRE3-PERIM` = `docs/preparation/PRE-3/perimetre-et-couverture.md` ; `PERIM` = `docs/preparation/PRE-4/perimetre-et-couverture.md`. (L'ancienne notation `P3 l. n` de ce groupe, qui entrait en collision avec la règle de priorité P3, est remplacée partout par `PRE3-PERIM:n`.)
- `Q7:n.m` = assertion de la vérification Q7, classée R (règle sourcée) ou C (calcul vérifié). Les assertions T sont mentionnées en note seulement ; les assertions D ne sont reprises que par une hypothèse H.
- Les numéros de frame (`8328:…`) sont des références visuelles (D-255, D-300). Aucune mesure lue sur une capture n'est une règle de calcul ou de comportement.

**Règles transverses à ces sous-sections** (AGENTS.md, `S/13…:17-27`) :
- Lorsqu'une primitive native iOS ou Android existe pour l'interaction demandée, elle est utilisée plutôt qu'une réimplémentation ou une imitation graphique ; le mécanisme d'interaction d'une primitive native déjà acceptée n'est pas remplacé, et un contrôle PRE-3 n'est changé que lorsqu'une ED ou une décision Q le prescrit (NFR-03, FR-22-03).
- Une suite de tests verte ne vaut jamais preuve visuelle ou tactile sur appareil réel ; la validation visuelle et tactile appartient à Hermann (FR-22-02).
- Tous les textes d'interface, libellés d'accessibilité compris, passent par le lexique de clés ; MVP en français (FR-22-12).

**Sous-sections 4.4 à 4.12 (Régime, deux Modes, Cible typée, Sélecteur de cible, tableau variable, Brouillons). Conventions de citation.** Les sources sont citées `[abréviation]:ligne`. Sources normatives (copies `caa2a5cf` sous `docs/preparation/PRE-4/bmad/sources-caa2a5cf/docs/`) : [01], [04], [06], [07], [08], [09], [10], [11], [12], [13] = chapitres correspondants de `Specifications-fonctionnelles/` (ch. 13 seulement l. 1-4345 ; la section l. 4346-5996 est reprise via la vérification Q7, citée « Q7 n° ») ; [DSF2M] = `DSF-DEUX-MODES-ECHEC-2026-10-13.md` ; [DSFCIR] = `DSF-CIRCUITS-CONTROLES-2026-10-12.md` ; [MAT2M] = `MATRICE-DEUX-MODES-ECHEC-2026-10-13.md`. Base `c32e360d`, en traçabilité : [B-2M] = `docs/Specifications-fonctionnelles/SPECIFICATION-DEUX-MODES-ECHEC-PAR-SERIE-2026-10-13.md` ; [B-v13] = `docs/Specifications-fonctionnelles/SPECIFICATION-PARAMETRES-MODALE-v13.md`. Q, P et H renvoient à `docs/preparation/PRE-4/bmad/questions-ouvertes.md`. « Q7 n° » renvoie aux assertions R ou C de `extracts/q7-inventaire-verification.md`. [FIG] `nœud` = référence visuelle Figma, jamais une règle (D-255).

Les décisions de Hermann (Q8, Q12 à Q15, Q21) et les points P priment sur les sources qu'ils tranchent.

**Sous-sections 4.13 à 4.17 (calculs de durée, Inversion du total, agrégation de Séance, Phrase des paramètres, Corpus 276).** Rédigées le 2026-10-16 à partir de l'extraction `extracts/ed13-17-calculs-phrases.md` (identifiants `R13-xx` à `R17-xx`), de la partie ED-15 de `extracts/ed18-19-21-donnees.md` §4 (identifiants repris ici sous la forme `DT15-xx` pour les distinguer des `R15-xx` de l'extraction des calculs) et des assertions R et C de `extracts/q7-inventaire-verification.md` (identifiants `13d.1`, `15k.2`…).

**Conventions de lecture.**

- Les chemins abrégés suivent l'extraction : `C08` = `docs/preparation/PRE-4/bmad/sources-caa2a5cf/docs/Specifications-fonctionnelles/08 – Conception fonctionnelle détaillée.md`, de même `C04`, `C07`, `C09`, `C10`, `C11`, `C12`, `C13` (ch. 13 hors l. 4346-5996) ; `DSF-DM` = `…/sources-caa2a5cf/docs/DSF-DEUX-MODES-ECHEC-2026-10-13.md` ; `CORPUS` = `docs/archives/evolutions-v15-2026-10-07/phrases-276.json` ; `B-PH1`, `B-DM` = spécifications Phrase v1 et Deux modes de la base.
- Les gabarits et phrases attendues sont littéraux : espaces, virgules, points et apostrophe typographique `’` (U+2019) compris, comme dans le Corpus 276 et le ch. 08 (« ponctuation conforme aux 276 cas », C08 l. 622). Les décisions de Hermann (Q16) sont reproduites avec cette apostrophe.
- Les montants chiffrés des conséquences sont des **attendus de recette** recalculés depuis les formules normatives. La formule et sa source sont données à chaque fois ; aucun montant n'est lu dans Figma ni dans Excel (D-255, D-300, RM-129).
- Notation (C10 l. 603) : N = Séries par côté ; Ti = travail calculable de la Série i ; Pi = Pause de la Série i ; PN = Pause de la dernière Série ; PC = Pause au changement de côté ; R = Récupération de l'occurrence ; b = Bip (s) ; Ri = répétitions cibles ; Tv = Durée totale choisie.

**Sous-sections 4.18, 4.19 et 4.21b (persistance, migration, copies et Médias côté données).** Elles décrivent ce que les données doivent garantir, sans choisir la solution technique : ni format, ni schéma, ni numéro de migration. Le transport vers la Séance et l'agrégation (ED-15) sont en 4.15. La partie interface d'ED-21 (import, erreurs affichées, réessai, réordonnancement à l'écran) est en 4.21 (FR-21-01 à FR-21-49) ; 4.21b commence à FR-21-50.

**Abréviations des sources.** `chNN:l` désigne la ligne `l` du chapitre `NN` dans les copies consolidées de `caa2a5cf` (`docs/preparation/PRE-4/bmad/sources-caa2a5cf/docs/Specifications-fonctionnelles/`). `DSF-2M` et `MAT-2M` désignent le DSF et la Matrice Deux modes du 13/10 dans le même dossier. `PERIM:l` désigne `docs/preparation/PRE-4/perimetre-et-couverture.md`. `PRE3-PERIM:l` désigne `docs/preparation/PRE-3/perimetre-et-couverture.md`. Les identifiants `R18-xx`, `R19-xx`, `R21-xx`, `C-xx`, `M-xx` et `T-xx` renvoient à `extracts/ed18-19-21-donnees.md`. Les identifiants `18m.x`, `18r.x`, `18d.x`, `18s.x`, `19c.x`, `19s.x`, `19n.x` et `21.x` renvoient aux assertions de la section Q7 vérifiées dans `extracts/q7-inventaire-verification.md` (classes R ou C seulement ; les classes T sont reportées dans les indications pour l'architecture de `addendum.md`, et les classes D sont signalées comme telles).

---

### 4.1 Quatre Parcours d'édition (ED-01)

**Description :** Un seul Éditeur d'Exercice sert les quatre Parcours d'édition : créer au Catalogue, modifier au Catalogue, créer dans une Séance, modifier une Copie en Séance. Le comportement PRE-3 accepté est conservé (P8) : au Catalogue, `Terminer` enregistre la Définition d'Exercice ; en Séance, `Terminer` écrit dans le Brouillon de Composition, enregistré au `Continuer` de Composition. Aucun nouveau parcours n'est créé (Q4). La Copie en Séance reste isolée de sa Définition d'Exercice.

**Exigences fonctionnelles :**

#### FR-01-01 : Créer un Exercice au Catalogue
L'utilisateur peut, depuis le Catalogue des exercices, ouvrir directement l'Éditeur d'Exercice en création par un appui sur `Créer`.
**Conséquences (testables) :**
- Lorsque le segment Exercices est actif, un appui sur `Créer` ouvre l'Éditeur d'Exercice en création d'une Définition d'Exercice, sans écran ni arbre intermédiaire, sans voile, sans liste d'options et sans `Annuler` intermédiaire. — *source : `S/13…:458,466,482,498` ; D-187 `S/07…:234` ; `S/08…:194`*
- Sur les autres segments du Catalogue, `Créer` garde son comportement de départ (liste d'options existante). — *source : Q33*
- Deux appuis rapprochés sur `Créer` n'ouvrent qu'un seul Éditeur d'Exercice. — *source : `S/13…:532`*
- L'appui sur `Créer` n'enregistre aucune donnée ; seul un Brouillon de l'Éditeur est initialisé. — *source : `S/13…:510`*
- Le segment appelant, les filtres et la position de défilement du Catalogue sont restitués au retour avant validation ; après un `Terminer` réussi, l'utilisateur revient à Catalogues / Exercices. — *source : `S/13…:514,624`*
- Abandonner l'Éditeur ouvert par `Créer` (FR-02-12) restaure le Catalogue appelant sans créer d'Exercice. — *source : `S/13…:466`*

#### FR-01-02 : Modifier un Exercice au Catalogue
L'utilisateur peut ouvrir une Définition d'Exercice en modification par un appui sur sa carte du Catalogue.
**Conséquences (testables) :**
- Un appui sur une carte du Catalogue des exercices, hors bouton Lecture, ouvre l'Éditeur d'Exercice en modification ; le bouton Lecture reste désactivé, comme dans le code de départ, et son appui n'ouvre pas l'Éditeur ; l'Exécution directe relève du moteur d'Exécution, hors périmètre. — *source : `S/06…:268` ; RM-162 `S/10…:227` ; Q34*
- L'Éditeur ouvert en modification affiche les données existantes de la Définition d'Exercice : nom, Catégorie, Zones corporelles, Paramètres d'exécution, description, Médias dans leur ordre. — *source : `S/06…:1117` ; Q7:01.4*

#### FR-01-03 : Créer et modifier un Exercice dans une Séance
L'utilisateur peut, depuis Composition, modifier une Copie en Séance par un appui court sur sa carte, et créer un Exercice dans la Séance par le parcours PRE-3 existant.
**Conséquences (testables) :**
- Dans Composition, un appui court sur une carte Exercice ouvre directement l'Éditeur d'Exercice sur la Copie en Séance ; un appui long déclenche la réorganisation et n'ouvre pas l'Éditeur. — *source : `S/06…:852` ; RM-021 `S/10…:38` ; D-127 `S/07…:159`*
- **Créer dans une Séance, point d'entrée de recette** (celui du code de départ, accepté en PRE-3) : dans Composition, l'action `Ajouter un exercice` ouvre le choix `Un nouvel exercice` / `Un exercice existant` / `Annuler` ; `Un nouvel exercice` ouvre l'Éditeur d'Exercice en création, sans Exercice source (route de l'Éditeur sans paramètre) ; `Terminer` place le nouvel Exercice dans le Brouillon de Composition, à la suite des Exercices affichés, sans l'ajouter au Catalogue (FR-01-05, FR-01-06) ; `Un exercice existant` ouvre la sélection multiple du Catalogue. PRE-4 ne modifie pas cet enchaînement et n'ajoute aucun point d'entrée. — *source : P8 ; Q4 ; D-170 `S/07…:217` ; constat du code de départ, en lecture seule : `CompositionScreen.tsx` (action `Ajouter un exercice`, lexique `fr.ts` l. 310 ; choix `Un nouvel exercice` / `Un exercice existant`, `fr.ts` l. 252-253), `ExerciseScreen.tsx:198-208` (sans paramètre : Éditeur de Copie en Séance), `appendActivityAfterLastDisplayed` (`composition.ts:88`)*
- **Écart signalé, non résolu par ce PRD :** D-194 (`S/07…:241`), `S/08…:202`, `S/06…:274,822` disent que `Ajouter un exercice` ouvre directement la sélection du Catalogue et que la création locale à la Séance n'est pas exposée ; le code de départ accepté en PRE-3 l'expose par le choix ci-dessus. PRE-4 conserve le comportement accepté (P8) sans nouveau parcours (Q4) ; l'arbitrage de cette divergence revient à Hermann. — *source : D-194 ; P8 ; Q4*
- Les quatre Parcours d'édition (créer au Catalogue, modifier au Catalogue, créer dans une Séance, modifier une Copie en Séance) ouvrent le même Éditeur d'Exercice et la même Feuille Paramètres d'exécution. — *source : P8 ; `S/13…:548,2967` ; `S/08…:196-198` ; Q7:01.1*

**Hors périmètre :** nouveau parcours de création en Séance, adaptation d'une Copie placée dans un circuit (Composition, Q4, §4 de questions-ouvertes) ; libellé « Un circuit » de l'écran d'options du Catalogue (hors PRE-4 sauf demande de Hermann).

#### FR-01-04 : Contexte d'ouverture explicite
L'Éditeur d'Exercice connaît le contexte d'ouverture (Définition d'Exercice ou Copie en Séance) par son point d'entrée, jamais par son apparence.
**Conséquences (testables) :**
- Pour un même contenu affiché, l'Éditeur ouvert depuis le Catalogue agit sur la Définition d'Exercice et l'Éditeur ouvert depuis Composition agit sur la Copie en Séance. — *source : `S/08…:198`*

#### FR-01-05 : Terminer et retour selon le contexte
L'utilisateur peut valider l'Éditeur par `Terminer`, avec un effet et un retour qui dépendent du Parcours d'édition.
**Conséquences (testables) :**
- Ouvert depuis le Catalogue, `Terminer` crée ou met à jour la Définition d'Exercice, puis revient au Catalogue restauré (FR-01-01). — *source : `S/08…:198` ; `S/13…:552,624` ; Q7:01.6*
- Ouvert depuis Composition, `Terminer` écrit uniquement dans le Brouillon de Composition, puis revient à Composition ; la Séance n'est enregistrée qu'au `Continuer` de Composition. — *source : P8 ; `S/06…:329` ; `S/13…:988`*
- Aucune Exécution historisée n'est modifiée par `Terminer`. — *source : `S/13…:624`*

#### FR-01-06 : Copie isolée
L'utilisateur peut modifier une Copie en Séance sans effet sur sa Définition d'Exercice, et inversement.
**Conséquences (testables) :**
- Isolation de la copie dans les deux sens : voir **FR-19-01** (exigence de référence, qui porte aussi D-171 et Q7:01.3). — *source : renvoi*
- Une Copie en Séance n'apparaît jamais comme doublon dans le Catalogue des exercices ; un Exercice créé dans une Séance n'est pas ajouté au Catalogue. — *source : `S/01…:319` ; D-114 `S/07…:146` ; `S/08…:208`*

#### FR-01-07 : Relecture à l'identique
L'utilisateur peut rouvrir un Exercice enregistré et retrouver exactement ce qu'il a validé.
**Conséquences (testables) :**
- Après `Terminer`, fermeture et réouverture, le nom, la Catégorie, les Zones corporelles, la description, les Médias dans leur ordre et les Paramètres d'exécution typés (Mode, Régime, Cibles numériques et à l'échec, Pauses, côtés, Bip, Compte à rebours, Fin) sont relus à l'identique, dans les quatre Parcours d'édition. — *source : `S/13…:620,646` ; `S/09…:1230` ; Q7:01.2, 01.4*
- Scénario de recette : enregistrer puis rouvrir après bascules de Mode, déplacement de Série et passage à N = 1, puis vérifier l'indépendance de la Définition et de la Copie. — *source : `S/13…:646`*

#### FR-01-08 : Aucune Récupération automatique
L'Éditeur d'Exercice ne crée ni ne propose de Récupération.
**Conséquences (testables) :**
- Créer ou insérer un Exercice ne crée aucune Récupération ; une Récupération n'est proposée, au défaut du Profil, que lors de son ajout explicite dans Composition. — *source : D-304, D-307 `S/07…:466,469` ; `S/06…:830` ; `S/13…:940` ; PRE3-PERIM:86 ; P15 ; Q7:01.5*
- L'Éditeur et la Feuille ne contiennent aucun réglage de Récupération après Exercice ; la Pause au changement de côté est le seul repos intrinsèque entre côtés, visible en bilatéral seulement. — *source : D-198 `S/07…:245` ; `S/06…:2284` ; `S/08…:245`*

#### FR-01-09 : Compatibilité avec l'héritage de N par circuit
L'Éditeur d'Exercice reste compatible avec une Copie dont N serait hérité d'un circuit de séries, sans implémenter cet héritage. PRE-4 ne produit aucun N hérité : il exige seulement que le modèle et l'Éditeur ne l'empêchent pas (exigence de référence : FR-12-07).
**Conséquences (testables) :**
- Compatibilité vérifiable par un test du modèle, sans parcours d'interface : des Paramètres d'exécution dont N est marqué hérité (forme du marquage laissée à l'architecture) sont acceptés et relus sans erreur, N inchangé (détail en FR-12-07). — *source : `S/13…:2971,2989,3017,3019` ; `S/06…:1125` ; questions-ouvertes §4 ; FR-12-07*
- Aucun libellé « Circuit » ni « Tour » n'est ajouté à l'Éditeur. — *source : questions-ouvertes §4*

**Hors périmètre :** la production d'un N hérité (compteur de circuit, tranche Composition) ; le comportement de l'Éditeur sous N hérité (± indisponibles, total en lecture seule, retrait de Série impossible) ; l'affichage de la mention d'origine du N hérité (sans référence visuelle, `S/13…:2997`). Même délimitation qu'en FR-12-07.

#### FR-01-10 : Source supprimée en parallèle
L'Éditeur d'Exercice signale l'absence d'une source supprimée pendant l'édition.
**Conséquences (testables) :**
- Si la Définition d'Exercice ou la Copie éditée a disparu, `Terminer` signale une erreur, ne recrée rien implicitement, et aucun contenu de démonstration ne remplace les données manquantes. — *source : `S/13…:628`*

**Référence visuelle :** `8328:35698` (Ajouter un exercice — Initial). Aucune frame « Modifier un exercice » parmi les 32 (`S/06…:1335`).

**Notes :**
- Non repris : D-171 et D-213 (initialisation automatique de la Récupération depuis le Profil), supersédées par D-304 et D-307 (P15).
- L'arbre « Une nouvelle exercice / Un exercice existant / Annuler » de `S/08…:204-206` n'est pas repris comme règle nouvelle (D-187 pour `Créer` au Catalogue, D-194 pour Composition). Le choix équivalent du code de départ (`Un nouvel exercice` / `Un exercice existant` / `Annuler`), accepté en PRE-3, est conservé sans modification comme point d'entrée du parcours « créer dans une Séance » (P8, Q4) ; la divergence avec D-194 est signalée en FR-01-03.
- Non repris : la mention `Déployer` de RM-162, contredite par D-261, hors ED.

---

### 4.2 Composition de l'écran principal de l'Éditeur (ED-02)

**Description :** L'Éditeur d'Exercice présente, de haut en bas : l'en-tête fixe avec fermeture et titre, le bandeau du nom avec les accès Catégorie et Zones corporelles, la Description, la Carte Paramètres d'exécution, les Médias et `Terminer` (ordre P7). La Carte affiche une Phrase des paramètres unique et, à part, les lignes Compte à rebours et Fin. Quitter avec des modifications non enregistrées demande une confirmation (Q18).

**Exigences fonctionnelles :**

#### FR-02-01 : Titre selon l'action
L'Éditeur d'Exercice affiche un titre qui dit s'il crée ou modifie.
**Conséquences (testables) :**
- Titre `Créer un exercice` en création, `Modifier un exercice` en modification, dans les quatre Parcours d'édition. — *source : D-325 `S/07…:517` ; `S/13…:119` ; `S/01…:405-410`*
- Les noms de frames Figma (« Ajouter un exercice… ») ne sont jamais affichés comme titre. — *source : D-325*
- Le rendu du titre (taille, graisse, couleur) suit les captures de `caa2a5cf`, Figma en direct en lecture seule servant d'arbitre visuel ; il est validé par Hermann sur appareil. — *source : Q9 (non bloquant) ; `8328:35698`*

#### FR-02-02 : Structure et ordre des blocs
L'utilisateur voit les blocs de l'Éditeur dans un ordre fixe, quel que soit le Parcours d'édition.
**Conséquences (testables) :**
- Ordre vertical : en-tête fixe → bandeau nom + accès Catégorie / Zones corporelles → Description → Carte Paramètres d'exécution (Phrase des paramètres + lignes Compte à rebours et Fin) → Médias → `Terminer`. — *source : P7 ; `S/06…:1123` ; `S/08…:1556,1826` ; `S/13…:576,584` (blocs) ; Q7:02.1*
- Le champ Nom est le premier élément du bandeau ; aucun contexte « Séance · {nom} » n'est affiché. — *source : `S/06…:2206` ; D-105 `S/07…:137` (partie conservée) ; `S/08…:196`*
- Aucun contrôle de type d'Exercice n'est affiché. — *source : `S/06…:223,2206`*
- Le placeholder du nom est `Nom de l’exercice` ; nom, Catégorie, Zones, description, Médias et montants ne sont jamais des valeurs de démonstration codées en dur (ex. « Squats sautés », « Renforcement », « Cuisses . Fessier »). — *source : `S/13…:70,560,570` ; `S/06…:2208`*

#### FR-02-03 : En-tête et fermeture
L'utilisateur peut fermer l'Éditeur par une action circulaire en haut à gauche.
**Conséquences (testables) :**
- L'action de fermeture est un ✕ circulaire en haut à gauche, de cible tactile 48 × 48 (cercle visible 38 × 38, icône 24, halo DSF blanc 59,28). — *source : D-142 `S/07…:174` ; D-226 `S/07…:306` ; `S/06…:129`*
- Aucun liseré sous l'en-tête ni autour du champ Nom ; la zone de contexte a une courbure et un fondu, sans bande visible. — *source : D-348 `S/07…:566` ; `S/06…:178`*
- La zone de contexte porte un dégradé `#EAEAFF` → transparent sur ses 20 % inférieurs ; un séparateur de 1 px n'est retiré que si ce dégradé assure la séparation. — *source : D-224 `S/07…:304` ; `S/06…:2301`*
- Le nom porté par la zone de contexte est posé à la même hauteur que dans les autres écrans (référence `Ajouter un exercice — Initial`) ; 18 entre le bas géométrique du dégradé et la première ligne de texte. — *source : `D/DSF-INTERFACE…:20,34,36`*

#### FR-02-04 : Grille verticale et adaptation aux largeurs
L'Éditeur respecte la grille verticale commune et s'adapte à la largeur d'écran.
**Conséquences (testables) :**
- Espacements : 20 entre le dernier élément d'un bloc et le titre suivant, 13 entre un titre de section et son bloc, 12 de bloc à bloc ; les espaces internes des composants ne relèvent pas de cette grille. — *source : D-327 `S/07…:524` ; `D/DSF-INTERFACE…:8,18-23`*
- Aucune coordonnée Figma n'est reprise en position absolue ; contrôle à 360, 402 et 440 ; marge latérale 24 à partir de 390, 16 admise jusqu'à 389. — *source : `S/13…:74-78` ; `S/06…:94-98`*

#### FR-02-05 : Accès Catégorie et Zones corporelles
L'utilisateur peut ouvrir la sélection de Catégorie et celle des Zones corporelles depuis le bandeau du nom.
**Conséquences (testables) :**
- Les deux accès sont des boutons qui ouvrent leur sélection (FR-20-02, FR-20-03). Non renseignés, ils affichent une icône et un libellé ; après sélection, l'accès Catégorie affiche une pilule (pastille colorée + nom) et l'accès Zones affiche les noms des Zones choisies. — *source : `S/08…:1554-1555,1826`*
- Les icônes Catégorie et Zones ont deux états : contour au repos, plein pendant l'ouverture de la sélection ; le cercle ne change pas ; elles reviennent au repos après ✓ ou ✕. — *source : `S/13…:588,2901,2947` ; D-306 `S/07…:468`*
- Une seule silhouette, celle du Profil (homme par défaut) ; jamais deux boutons homme / femme dans l'Éditeur. — *source : `S/13…:588,2901` ; D-236 `S/07…:321` ; `S/06…:2271`*
- Le libellé de l'accès Zones non renseigné, le séparateur entre Zones choisies dans le bandeau et la présence d'une icône `+` suivent les captures de `caa2a5cf` (libellé « Zone corporelle », séparateur et icône tels que montrés par `8328:35698`, `8328:36278`, `8328:37022`) ; les formes divergentes de `S/06…:2206,2269` et `S/13…:2885` ne sont pas reprises pour le bandeau. Rendu validé par Hermann sur appareil. — *source : P35 ; D-255 ; `8328:35698`, `8328:37022`*

**Notes :**
- Libellé, séparateur et icône `+` de l'accès Zones : présentation visuelle tranchée par P35 (captures de `caa2a5cf` de référence). Le point médian de `S/06…:2269` reste la règle des cartes consommatrices, hors bandeau.

#### FR-02-06 : Carte Paramètres d'exécution
L'utilisateur peut ouvrir la Feuille Paramètres d'exécution en touchant n'importe quel point de la Carte, qui résume les Paramètres d'exécution validés.
**Conséquences (testables) :**
- Le libellé de section au-dessus de la Carte est `Paramètres d’exécution` ; le texte « Modalités d’exécution » des captures n'est pas repris. — *source : Q11 ; `S/13…:570`*
- La Carte vide initiale est une zone unique qui ouvre la Feuille ; elle est rendue comme en PRE-3, sans texte d'invite ; dès qu'un Mode est validé par le ✓ de la Feuille, la Phrase des paramètres s'affiche. — *source : `S/13…:580` ; Q55 (décision de Hermann du 2026-10-18, qui retire l'invite H22 « Appuyez pour définir les séries et les durées » de `8328:35698`)*
- Après le ✓ de la Feuille, la Carte affiche **une seule** Phrase des paramètres (ED-16), valeurs et unités en gras, Inter 13, interligne 20 ; largeur de référence 324 à 402 (x39) ; hauteur intrinsèque, sans plafond ni troncature ; le contenu situé dessous suit. — *source : `S/13…:580,586,4265` ; D-322 `S/07…:507`*
- La Phrase passe à la ligne avant « Durée totale » sans changer sa grammaire ; aucune virgule isolée en début de ligne ; les segments forment un même flux de texte. — *source : `S/13…:4265,4269`*
- La zone entière ouvre la Feuille ; aucun mot ni nombre de la Phrase n'est un contrôle autonome ; la Carte a un seul focus, de libellé accessible `Modifier les paramètres d’exécution`. — *source : `S/13…:580,604,632,4265` ; D-298*
- Aucun bouton ni nom du Mode n'est affiché à droite du titre de section : le bouton `Choisir un mode` du code de départ, absent des frames et des sources, est retiré ; la Carte est une seule zone touchable. Le Mode reste visible dans la Phrase et se choisit dans la Feuille, par son popover. — *source : Q23*
- Les lignes `Compte à rebours` et `Fin d’exercice` restent séparées de la Phrase, dans la Carte. — *source : `S/13…:570,576,580,4265` ; P17*
- Avec un Mode renseigné, la Phrase reflète l'état validé ; sans Mode, la Phrase est vide et `Terminer` est inactif (FR-02-09). — *source : `S/08…:1557,1808`*
- Exemple de non-régression : la phrase longue de référence (224 caractères, `7119:27855`) tient sur cinq lignes de 20 à la largeur 324 sans troncature ; ces hauteurs sont des constats, jamais des hauteurs fixes. — *source : `S/13…:590,4267`*

**Notes :**
- Le rendu des lignes Compte à rebours et Fin est `NON VÉRIFIABLE` sur Figma (`8328:37022` ne les montre pas) ; la règle écrite est maintenue (P17).
- Le texte d'invite de la Carte vide ne figure que dans la capture `8328:35698` ; aucune source écrite ne le fixe. Il est repris par [ASSUMPTION: H22], que Hermann peut infirmer. Réserve de la revue ChatGPT (terme « durées » inadapté au cas Répétitions) : sans objet, puisque l'invite n'est affichée qu'avant tout choix de Mode (H22 précisée) ; le texte n'est pas changé.

#### FR-02-07 : Description
L'utilisateur peut saisir une description facultative de l'Exercice.
**Conséquences (testables) :**
- Le champ `Description de l’exercice` est facultatif, multiligne, de 1000 caractères au plus. — *source : `S/08…:1556` ; `S/13…:570`*
- La saisie reste celle acceptée en PRE-3 : texte libre où la touche Retour fait un retour à la ligne ; la structure en étapes numérotées des captures (« 1. Décrivez la première étape », « Étape suivante ») n'est pas reproduite comme comportement. — *source : P18 ; D-351 `S/07…:576`*
- Pendant la saisie, un bouton d'envoi ↑ standard dans le champ ferme le clavier ; le texte est déjà dans le Brouillon de l'Éditeur ; ↑ n'enregistre pas l'Exercice et ne remplace pas `Terminer`. — *source : D-351 `S/07…:576` ; `S/06…:178`*
- Clavier ouvert, la Description se place juste au-dessus du clavier, curseur visible. — *source : D-349 `S/07…:567` ; `S/06…:178`*

#### FR-02-08 : Bouton Terminer et clavier
L'utilisateur dispose d'un bouton `Terminer` principal en bas de l'Éditeur.
**Conséquences (testables) :**
- `Terminer` est un bouton principal sur toute la largeur utile, hauteur 48, rayon 24, libellé centré ; référence à 402 : 354 × 48, sans position absolue. — *source : `S/06…:143` ; D-327 ; `D/DSF-INTERFACE…:42-48,93`*
- Clavier ouvert, `Terminer` reste en bas, sous le clavier, et ne remonte pas ; il redevient accessible à la fermeture du clavier. Le corps reste défilable. — *source : D-349 `S/07…:567` ; `S/06…:178` ; P15 ; Q7:02.2*

**Notes :** Non repris : « Terminer accessible avec le clavier » (`S/13…:594`, `S/06…:222-223`), remplacé pour cet écran par D-349.

#### FR-02-09 : Validation avant Terminer
`Terminer` n'est actif que si l'Exercice est valide.
**Conséquences (testables) :**
- `Terminer` est inactif tant que l'une de ces conditions manque : nom de 1 à 80 caractères ; exactement une Catégorie ; au moins une Zone corporelle (nouvel Exercice) ; Paramètres d'exécution exécutables validés par la Feuille. — *source : `S/13…:612` ; D-211 `S/07…:286` ; RM-214 `S/10…:264` ; `S/08…:1553,1567`*
- La couleur de `Terminer` dans les captures (`8328:35698` actif à vide, `8328:35740` pâle rempli) ne vaut pas règle de validation. — *source : `S/13…:612`*
- En modification, une Catégorie ou une Zone retirée de son référentiel (D-210) reste affectée et enregistrable ; une valeur retirée ne peut pas recevoir de nouvelle affectation. — *source : `S/13…:612,2921` ; D-210 `S/07…:285` ; RM-215 `S/10…:265`*
- Exercice ancien portant une valeur hors bornes **non modifiée** (Cible de 5999 s, 150 répétitions, Bip de 11) : cette valeur ne rend pas `Terminer` inactif ; l'Exercice est enregistrable et la valeur est réenregistrée telle quelle (règle complète en FR-09-05). Une Cible absente reste à renseigner : faute de Paramètres d'exécution exécutables, `Terminer` reste inactif jusqu'à ce qu'elle soit renseignée. — *source : [ASSUMPTION: H25] ; H7 ; FR-09-05*

#### FR-02-10 : Enregistrement atomique et erreur d'écriture
L'utilisateur enregistre l'Exercice en une seule opération par `Terminer`.
**Conséquences (testables) :**
- `Terminer` enregistre ensemble, ou pas du tout, le nom, les référentiels, la description, les Paramètres d'exécution validés et les associations Médias ordonnées (en Séance : dans le Brouillon de Composition, FR-01-05). — *source : `S/13…:560,604,618-620,636`*
- Fermer la Feuille par ✓ n'enregistre rien en base : voir **FR-18-17** (exigence de référence pour les écritures) ; aucune Phrase des paramètres ni segment n'est enregistré : voir **FR-18-05**. — *source : `S/13…:604,636` ; renvoi*
- En cas d'échec d'écriture : le Brouillon de l'Éditeur est conservé, l'utilisateur reste dans l'Éditeur et peut réessayer ; aucun enregistrement partiel ni doublon. Le message affiché et son texte sont ceux du code de départ (PRE-3), inchangés. — *source : `S/13…:628` ; PRE3-PERIM:99 ; P34*
- Une seule opération d'enregistrement est en cours à la fois (pas de doublon sur appuis répétés). — *source : `S/13…:628` ; PRE3-PERIM:99*

**Notes :** Le texte du message d'échec d'écriture n'est défini par aucune source ; P34 conserve celui du code de départ.

#### FR-02-11 : États à couvrir
L'Éditeur présente correctement chacun de ses états, illustrés ou non.
**Conséquences (testables) :**
- États exigés : vide ; nom seul ; Catégorie renseignée ; nom, description et Média renseignés ; modification d'un Exercice existant ; résumé identiques ; résumé variables en Durée, en Répétitions, à l'échec et Cible mixte ; bilatéral dans chaque Ordre des côtés ; abandon confirmé et annulé ; erreur d'enregistrement. L'absence de capture ne retire aucun état. — *source : `S/13…:598-600`*

#### FR-02-12 : Abandon avec confirmation
L'utilisateur peut quitter l'Éditeur ; s'il a des modifications non enregistrées, une confirmation lui est demandée.
**Conséquences (testables) :**
- Fermeture ou retour sans modification à perdre : sortie immédiate, sans dialogue. — *source : `S/13…:552` ; `S/06…:310,1117` ; `S/08…:1594`*
- Avec des modifications non enregistrées : dialogue de décision centré, deux actions sur une ligne, `Annuler` (neutre) et `Confirmer` (destructif, rouge). — *source : D-094 `S/07…:128` ; D-102 `S/07…:134` ; `S/06…:209-213,1289` ; `S/08…:1750` ; Q18*
- En création : titre `Abandonner la création ?`, message `Les informations saisies seront perdues et l’exercice ne sera pas créé.` — *source : Q18*
- En modification : titre `Abandonner les modifications ?`, message `Les modifications apportées à cet exercice seront perdues.` — *source : Q18*
- `Annuler` ferme le dialogue et conserve le formulaire et le Brouillon de l'Éditeur ; `Confirmer` quitte sans enregistrer. — *source : D-094 ; D-102 ; PRE3-PERIM:99*

#### FR-02-13 : Propriétés visuelles de chaque bloc
L'utilisateur voit chaque bloc de l'Éditeur avec la typographie, les couleurs, le contour et l'ombre de sa frame de référence.
**Conséquences (testables) :**
- Pour chaque bloc — en-tête, champ Nom, accès Catégorie / Zones corporelles, Description, Carte Paramètres d'exécution, Médias, `Terminer`, dialogue d'abandon — et pour chacun de ses états, la typographie (famille, taille, graisse, interligne), la couleur (texte, fond, icône), le contour et l'ombre sont ceux des frames de référence de la table de 4.22 et des styles et variables Figma qu'elles emploient. — *source : `PERIM:20` (ED-02, attendus « typographie, couleur, contour/ombre ») ; Q7:02.1, F.2 ; PRE3-PERIM:155 ; D-255, D-300*
- Ces propriétés sont relevées élément par élément, dans les stories et avant le développement, depuis `docs/preparation/PRE-4/bmad/sources-caa2a5cf/docs/preparation/PRE-4/figma/fermeture-maitres-et-variables.json.gz` (maîtres, styles et variables) et les arbres des frames `docs/preparation/PRE-4/figma/*.json.gz` ; une mention « conforme Figma » ne remplace pas ce relevé (FR-22-01). — *source : PRE3-PERIM:155 ; `S/13…:194-196` ; FR-22-01*
- Le rendu passe par les jetons existants de `src/shared/ui/tokens.ts`. Ces jetons sont verrouillés par `tokensSpecification.test.ts` : une valeur Figma qui diffère d'un jeton est signalée comme écart, jamais corrigée en modifiant silencieusement le jeton ni en codant la valeur en dur. — *source : `AGENTS.md` (jetons verrouillés) ; PRE3-PERIM:164*
- La conformité de ces propriétés est validée visuellement par Hermann sur iPhone ; un test fonctionnel vert ne la prouve pas (NFR-04). — *source : NFR-04 ; Q5*

**Référence visuelle :** `8328:36711`, `8328:36853`, `8328:37022`, `8328:35698`, `8328:35740`, `8328:36278`, `8328:36781` (voir la table des frames en 4.22).

**Notes :**
- Non repris : titres « Ajouter un exercice » (D-105) et « Ajouter / Modifier une activité » (`S/08…:1552`, terme interdit), remplacés par D-325.
- Non repris : textes d'abandon de D-094 (« cette exercice ») et de la capture `8328:36781` (« l’activité ne sera pas créé »), remplacés par Q18.
- Non repris : ordre « carte Paramètres → Description » de `S/13…:576`, remplacé par P7.
- Non repris : Q7:02.3 (« pas d'accordéon ni de carte en grille », D non sourcée) : constat à faire dans le code, sans exigence propre ; FR-02-02 fixe déjà la structure.
- Q7:02.4 (largeur de référence 402) est repris en FR-02-04 et FR-22-06 ; la notion de propriétés « figées » est un mécanisme VNext (T), non repris.

---

### 4.3 Feuille Paramètres d'exécution et popovers Mode, Changement de côté, Ordre des côtés, Régime (ED-03)

**Description :** La Feuille Paramètres d'exécution s'ouvre depuis la Carte sur un Brouillon de la Feuille. Son en-tête ✕ / `Paramètres d’exécution` / ✓ reste fixe et son corps défile dans un ordre défini. Le Mode, le Changement de côté, l'Ordre des côtés et le Régime se choisissent par des popovers ancrés à leur ligne, avec le mécanisme de la primitive native iOS (P9, P10). Les roulettes de Cible et de Durée totale ont leurs propres ✕ / ✓ (Q12). Il n'y a aucun interrupteur « Séries variables » (ED-04).

**Exigences fonctionnelles :**

#### FR-03-01 : Ouverture de la Feuille sur un Brouillon
L'utilisateur peut ouvrir la Feuille en touchant la Carte Paramètres d'exécution ; la Feuille travaille sur une copie du Brouillon de l'Éditeur.
**Conséquences (testables) :**
- Un appui sur la Carte ouvre la Feuille avec une copie du Brouillon de l'Éditeur ; ouvrir puis fermer par ✕ laisse le Brouillon de l'Éditeur inchangé. — *source : `S/13…:604,2963` ; `S/08…:251`*
- À l'ouverture : voile en fondu sur place et Feuille montant du bas ; avec « Réduire les animations », la Feuille apparaît en place. — *source : D-342 `S/07…:553` ; `S/13…:4085`*
- Voile modal `#1F2129` à 34 %, distinct de l'ombre de carte déplacée de Composition. — *source : `S/13…:127,2999` ; D-299 `S/07…:447`*
- Feuille ouverte : l'Éditeur est inerte et hors du parcours de focus ; le focus reste dans la Feuille ; à la fermeture, il revient à la Carte. — *source : `S/13…:594,632,3047` ; Q7:22s.1, 22e.4*
- Aucune navigation vers un autre écran (cadence ou autre) et aucune nouvelle route depuis la Feuille. — *source : `S/13…:3037`*

#### FR-03-02 : En-tête et ordre du corps
L'utilisateur trouve les réglages de la Feuille dans un ordre fixe, sous un en-tête toujours accessible.
**Conséquences (testables) :**
- En-tête fixe : ✕ à gauche, titre `Paramètres d’exécution`, ✓ à droite ; le corps défile ; l'en-tête reste accessible avec le texte agrandi. — *source : Q11 ; `S/13…:2985,3005,4085` ; `S/06…:1123`*
- Ordre du corps : `Mode d’exécution` → `Séries` (Régime, chevron en variables, nombre) → Cible et `Pause après chaque série` communes, ou Tableau des séries variables → `Changement de côté` → `Ordre des côtés` et `Pause entre les côtés` (bilatéral) → `Bip de cadence` → `Durée totale` (si applicable) → `Compte à rebours` → `Fin d’exercice`. Exigence de référence pour l'ordre de la Feuille (FR-10-08 y renvoie). — *source : `S/13…:2985,4071-4083` ; `S/06…:1123` ; `S/08…:241-244,474` ; `D/DSF-CIRCUITS…:25` ; D-253*
- Le `Bip de cadence` est au premier niveau, juste avant `Durée totale` ; sans ligne `Durée totale`, juste avant `Compte à rebours`. Le retrait de la ligne `Durée totale` raccourcit la Feuille de 42 par le haut, bas ancré. — *source : `S/13…:2999,4080,4253` ; P24*
- Aucun interrupteur « Séries variables » : le Régime se choisit par le champ de la ligne `Séries` et son popover (FR-03-09, ED-04). — *source : `S/13…:2983,4075` ; `D/DSF-CIRCUITS…:5,25`*

**Notes :** Non repris : l'ancien ordre « Séries → Séries variables → … → Pause entre les côtés → Total » (`S/08…:196`), supersédé.

#### FR-03-03 : Annuler ou appliquer la Feuille
L'utilisateur peut annuler toute l'ouverture par ✕ ou appliquer un état valide par ✓.
**Conséquences (testables) :**
- Effet de ✕, du retour système et de ✓ sur le Brouillon (annulation de toute l'ouverture, bascules de Mode et déplacements compris ; application en une fois de l'état actif valide, Phrase régénérée, rien en base) : voir **FR-11-01** (exigence de référence). — *source : renvoi*
- ✓ est indisponible tant que le Mode ou une Cible exigée est à renseigner ou invalide ; la cellule ou la ligne concernée prend le fond `#FFF1F0` (`color.dangerSurface`), sans contour — *source : Q35* ; **aucun message en ligne**. Une Pause de 0 s est valide. Une valeur ancienne hors bornes **non modifiée** n'est pas invalide au sens de cette règle et ne rend pas ✓ indisponible (FR-09-05). — *source : D-337 `S/07…:548` ; `S/13…:4100` ; P4 ; [ASSUMPTION: H25] (valeur ancienne non modifiée)*
- Replier le Tableau des séries variables ne contourne jamais la validation et ne modifie aucune donnée. — *source : `S/13…:4085,4100` ; PRE3-PERIM:96 ; Q7:04.5*

**Notes :** Non repris : « erreur nommant la Série » (`S/13…:3027`, D-251, PRE3-PERIM:96), remplacé par D-337 (P4).

#### FR-03-04 : Valeurs initiales en création
L'utilisateur part d'une Feuille sans valeur implicite en création.
**Conséquences (testables) :**
- Valeurs initiales en création (Mode, Cible Durée et Changement de côté à `—`, N = 1, Pause 0 s, Bip `Aucun`, aucun tempo implicite, Cible Répétitions initiale 1, Changement de côté `—` enregistré comme `Sans changement` au ✓) : voir **FR-11-05** (exigence de référence). — *source : renvoi*
- Mode qui ne revient plus à `—` une fois choisi : voir **FR-05-02**. — *source : renvoi*

#### FR-03-05 : Réglage des valeurs numériques par ±
L'utilisateur peut régler une valeur numérique de la Feuille par des commandes ± qui n'apparaissent qu'à l'appui sur cette valeur.
**Conséquences (testables) :**
- Au repos, seule la valeur est visible ; l'appui sur la valeur fait apparaître − et + à sa droite, la valeur se décalant. Les Cibles se règlent par le Sélecteur de cible (ED-07, Q8, Q13). — *source : `S/13…:2989,4085,4199-4203` ; `D/DSF-CIRCUITS…:11` ; P11*
- Un seul champ actif à la fois : l'appui sur une autre valeur ferme le précédent et ouvre le nouveau en un seul geste ; un appui à l'extérieur range l'outil, sans bouton Annuler ; les valeurs réglées restent dans le Brouillon de la Feuille. — *source : `S/13…:3017,4205-4211,4219`*
- L'appui qui range l'outil n'active jamais une cible destructive (croix de retrait d'une Série) ; il peut fermer l'outil et agir sur une cible inoffensive (autre valeur, chevron) en un seul geste. — *source : `S/13…:4217` ; `S/08…:555` ; `D/DSF-CIRCUITS…:39`*
- Appui bref : pas de 1 ; maintien : répétition après ≈ 500 ms, paliers de 5 après ≈ 2 s puis de 10 après ≈ 4 s ; saturation aux bornes ; `Bip de cadence`, `Compte à rebours` et `Fin d’exercice` restent au pas de 1 ; arrêt au relâchement ou à la sortie de la cible. Les pas propres aux Cibles relèvent d'ED-09 et d'ED-10. — *source : `S/13…:4098,4255-4257` ; D-312, D-336*

**Notes :** Non repris : steppers permanents (`S/08…:1559-1561`, `S/12…:833`, état PRE-3 de `S/13…:4087`), supersédés (P11, Δ6).

#### FR-03-06 : Popover Mode d'exécution
L'utilisateur peut choisir le Mode par un popover à deux options.
**Conséquences (testables) :**
- Options (exactement `Durée` puis `Répétitions`, sans « À l’échec ») et même popover en Régime identiques et variables : voir **FR-05-01** (exigence de référence). — *source : renvoi*
- Rendu de référence : 184 × 99, hauteur automatique (visuel seulement) ; le rendu propre de la primitive native prime, un écart visible est signalé à Hermann à la recette. — *source : `S/13…:2995` ; P33*

#### FR-03-07 : Popover Changement de côté
L'utilisateur peut choisir le Changement de côté par un popover.
**Conséquences (testables) :**
- Le Changement de côté se choisit par un popover, jamais par un segmenté en ligne. — *source : P10 ; `D/DSF-CIRCUITS…:5,25` ; `S/06…:1125` ; `8328:37972`*
- Présentation sur iOS : panneau sans flèche, ouvert juste sous le champ sélectionné, aligné à droite sur lui, au-dessus du contenu (aucune ligne ne se décale), dans la Feuille ; il contient le segmenté accepté, inchangé (mêmes options, libellés et libellés accessibles) ; un choix applique au Brouillon et ferme le panneau (cadre D-4) ; un toucher hors du panneau le ferme sans appliquer. iOS ne fournissant pas de popover natif sans flèche, le panneau est un conteneur de positionnement, jamais une réimplémentation du segmenté. Android et web : segmenté en ligne, dans le cadre de sélection de sa ligne. — *source : Q41 (décision de Hermann du 2026-10-17, recette iPhone, écart E-15 : « remplacés par des modales du type popover, sans le cône, qui doivent apparaître sous le champ sélectionné »)*
- Options exactes : `Sans changement`, `Droite puis gauche`, `Gauche puis droite`. — *source : `S/08…:242`*
- Les libellés accessibles développent complètement la direction (pas d'abréviation D/G). — *source : D-143 `S/07…:175`*

**Notes :** Non repris : segmenté de `S/13…:4077` (P10) ; options « Aucun, D→G, G→D » (`S/06…:2246`, `S/08…:1562`), historiques.

#### FR-03-08 : Popover Ordre des côtés
L'utilisateur peut choisir l'Ordre des côtés par un popover, en bilatéral seulement.
**Conséquences (testables) :**
- La ligne `Ordre des côtés` n'existe qu'avec un Changement de côté bilatéral ; options `Un côté après l’autre` (par défaut) et `Les deux côtés à chaque série`. — *source : `S/13…:4078` ; `S/08…:243`*
- Comportement à N = 1 (ligne masquée à N = 1 ; l'Ordre choisi est conservé et réaffiché dès N ≥ 2 — source : Q38 ; ordre effectif `Un côté après l’autre`) : voir **FR-12-04** (exigence de référence). — *source : renvoi ; Q38*
- Sous-titres des options, repris de Figma comme référence visuelle : `(D1 → D2) → (G1 → G2)` et `(D1 → G1) → (D2 → G2)`. — *source : `8328:38953` (E)*
- Présentation : celle du Changement de côté (FR-03-07) — sur iOS, panneau sans flèche sous le champ, aligné à droite, contenant le segmenté accepté (options et sous-titres inchangés) ; choix appliqué puis fermeture ; toucher extérieur sans application. — *source : Q41*

#### FR-03-09 : Popover Régime des séries
L'utilisateur peut choisir le Régime par le champ de la ligne `Séries` et son popover.
**Conséquences (testables) :**
- Entrées du popover, sous-titres et comportement : voir **FR-04-01** (exigence de référence) ; règles du Régime (chevron, N = 1, égalité des valeurs) : ED-04 (FR-04-02 à FR-04-05). — *source : renvoi*

#### FR-03-10 : Comportement commun des popovers
L'utilisateur manipule les quatre popovers selon le comportement de la primitive native iOS.
**Conséquences (testables) :**
- Le mécanisme des popovers Mode, Changement de côté, Ordre des côtés et Régime est celui de la primitive native iOS : fermeture par appui à l'extérieur, une seule surface ouverte, retour du focus au déclencheur, conformément à son comportement natif. — *source : P9 ; AGENTS.md ; [ASSUMPTION: H13] (retour du focus)* *Depuis Q41 (2026-10-17), le Changement de côté et l'Ordre des côtés s'ouvrent dans un panneau sans flèche sous le champ (FR-03-07, FR-03-08), qui reprend ce comportement (fermeture par toucher extérieur sans application, une seule surface ouverte, modal pour VoiceOver) ; le Mode garde le popover natif validé ; le Régime n'est pas concerné.*
- Un seul popover ou une seule roulette ouvert à la fois ; jamais deux surfaces interactives simultanées dans la Feuille. — *source : `S/13…:3019,4085` ; `D/DSF-CIRCUITS…:21` ; Q7:03.1*
- Chaque popover est ancré à sa ligne et s'adapte à l'espace disponible. — *source : `D/DSF-DEUX-MODES…:7` (shell, ancrage, voile) ; `D/DSF-CIRCUITS…:18` ; Q7:03.2*
- Pendant l'ouverture d'un popover ou d'une roulette, la ligne déclenchante est désignée comme active (référence visuelle : barre d'accent à gauche et fond de ligne). — *source : `S/08…:1586` ; captures `8328:37092`, `37972`, `38953`, `37862`*
- Une ligne sélectionnée de la Feuille porte le fond de sélection (`colors.stepperSurface`, rayon 12), sans aucun contour ni liseré ; aucun texte ne bouge. — *source : Q40 (décision de Hermann du 2026-10-17, recette iPhone, écart E-14)*
- Sélectionner ou désélectionner une ligne ne change ni marge, ni padding, ni largeur, ni position du texte, et ne joue aucune transition de place : le fond de sélection est dessiné en arrière-plan, sans modifier la mise en page. Un contrôle affiché sur une ligne sous le champ sélectionné (sélecteur ou roulette en ligne, Android et web) est dans le même cadre coloré que la ligne : un seul fond couvre la ligne et son contrôle. — *source : Q41 (décision de Hermann du 2026-10-17, recette iPhone, écart E-15)*
- Un choix dans un popover s'applique au Brouillon de la Feuille seulement ; rien n'est enregistré avant le ✓ de la Feuille, ni en base avant `Terminer`. — *source : P9 ; `S/13…:3037` ; Q7:03.4*
- Voile et fermeture d'un popover : le voile éventuel est celui de la primitive native, sans voile ajouté ni imité. Un appui à l'extérieur d'un popover ouvert le ferme **sans appliquer** de choix : l'option précédemment choisie reste en place (ex. Mode `Durée`, popover ouvert, appui extérieur → Mode toujours `Durée`) ; l'appui extérieur n'active pas en même temps le contrôle situé dessous s'il est destructif (FR-10-04). Aucun choix fait dans un popover n'est persisté avant le ✓ de la Feuille : ✕ de la Feuille après un choix rétablit l'état d'avant l'ouverture de la Feuille. — *source : P9 ; `D/DSF-DEUX-MODES…:7` (shell, ancrage, voile) ; `PERIM:21` (ED-03 : « voile, fermeture ») ; Q7:03.2, 03.4 ; `S/13…:4217`*

**Notes :**
- Non repris : D-339 (application immédiate et fermeture progressive) et D-341 (typographie des options), classés supersédés par `S/13…:4087` (P9).
- Q7:03.3 (retour du focus au déclencheur d'un popover), déduction D, est repris par [ASSUMPTION: H13].
- Dimensions de référence (popover Mode 184 × 99) et sous-titres d'options (Régime, Ordre des côtés) : tranché par P33. Le mécanisme et le rendu natifs priment ; les valeurs de Figma et du DSF servent de référence visuelle. Si la primitive native retenue ne permet pas ces sous-titres ou cette géométrie, l'écart est signalé à Hermann à la recette ; il ne justifie jamais une réimplémentation (AGENTS.md).

#### FR-03-11 : Roulettes de Cible et de Durée totale dans la Feuille
L'utilisateur règle la Cible et la Durée totale par une roulette native déployée dans la Feuille, validée par ses propres ✕ / ✓ puis par le ✓ de la Feuille.
**Conséquences (testables) :**
- Les roulettes de la Feuille (Cible commune en Durée, dite « Durée d’une série », et, par cohérence, Cible Répétitions et Cible d'une Cellule active) et celle de Durée totale apparaissent, sur iOS, dans un panneau sans flèche, ouvert juste sous leur champ, cadre aligné à droite sur le champ, au-dessus du contenu (aucune ligne ne se décale), dans la Feuille, sans `Modal` supplémentaire ni animation de hauteur ; la roulette native et sa barre ✕ / ✓ sont inchangées (largeur propre 330) ; si le panneau dépasse le bas du contenu, une réserve vide est ajoutée sous le dernier groupe (et le corps défile jusqu'au bas si la Feuille est à sa hauteur maximale), sans déplacer aucune ligne. Android et web : roulette en ligne, sous son champ, dans le cadre de sélection de la ligne. — *source : Q41 (décision de Hermann du 2026-10-17, recette iPhone, écart E-15 : « Le popover de la durée ne doit pas avoir de cône, et il doit apparaître juste en dessous du champ durée (le cadre aligné à droite) » ; « La modale de la roulette de la durée totale a une animation saccadée ») ; `S/13…:2995,4213` ; `D/DSF-DEUX-MODES…:19,41` ; `8328:37862`, `8328:38084`* *Rendu remplacé deux fois : « popover ancré sous leur ligne » (historique), puis couche centrée `WheelPickerOverlay` sur voile (Q37), puis panneau sans flèche sous le champ (Q41). `WheelPickerOverlay` reste le rendu des roulettes de Composition, inchangé.*
- Une roulette ouverte se ferme par son ✓ (qui applique), par son ✕ ou par un toucher hors du panneau (qui n'appliquent rien). — *source : Q41 (remplace, pour la Feuille, la fermeture « par ✕ ou ✓ seulement » de Q37)*
- Portée : toutes les roues de la Feuille — Cible Durée commune, Cible Répétitions (FR-07-03), Cible d'une Cellule active (FR-10-02) et Durée totale — s'ouvrent dans ce même panneau sans flèche, sous leur champ ou leur cellule, aligné à droite ; la couche centrée de Q37 n'est plus le rendu d'aucune roue de la Feuille. — *source : Q41, décision de cohérence consignée le 2026-10-17*
- Le ✓ de la roulette applique la valeur au Brouillon de la Feuille ; le ✕ de la roulette restaure la valeur d'avant son ouverture ; le ✓ de la Feuille applique ensuite à l'Éditeur (FR-03-03). — *source : Q12*
- Aucune roulette n'utilise l'ancienne modale basse séparée ; le voile garde la couleur et l'opacité communes. — *source : `S/13…:127,129` ; `S/06…:2199`*
- Chaque cran de roulette donne un retour haptique léger, indépendant du réglage Vibrations. — *source : D-076 `S/07…:117` ; `S/08…:1569`*
- Contenu des roulettes (option échec en tête, bornes, grisé manipulable, ✓ indisponible sur `00:00`) : ED-07, ED-08, ED-09, ED-14 (Q8, Q14, Q15). — *source : renvoi*
- **Règle de repli.** Si la primitive native retenue ne permet pas d'imbriquer une roulette native et ses ✕ / ✓ dans un popover ancré, l'écart est signalé à Hermann (P33), avant l'implémentation de la surface concernée ; il n'est jamais comblé par une réimplémentation de la roulette ou du popover (NFR-02, NFR-03). — *source : P33 ; `AGENTS.md` (primitives natives, non-remplacement)* *Sans objet pour les roulettes depuis Q37 (elles ne sont plus imbriquées dans un popover) ; la règle reste valable pour les popovers de choix. Q41 : iOS n'offre pas de popover natif sans flèche ; le panneau sans flèche est un conteneur de positionnement autour des primitives acceptées (segmenté, roulette native), jamais leur réimplémentation.*

**Notes :** Non repris : « validation par ✓ de la feuille, annulation par ✕ » sans ✓ de roulette (`S/13…:3015`, `D/DSF-DEUX-MODES…:21,33`), « sans seconde validation » (`S/08…:1573`) et D-193 (modale basse pour toutes les roulettes) : remplacés par Q12 et `S/13…:127-129`.

#### FR-03-12 : Tableau des séries variables : déplacement et Pied commun (rendu)
L'utilisateur peut déplacer une Série et régler la Cellule active par le Pied commun.
**Conséquences (testables) :**
- Pendant le glisser d'une Série, le corps de la Feuille reste immobile et un repère d'insertion (trait bleu Kodjo de 2) apparaît entre les lignes. — *source : D-345 `S/07…:563` ; `S/13…:4085` ; `8328:39279`*
- Chaque ligne porte poignée, numéro, Cible, Pause et retrait ; une seule Cellule active ; le Pied commun affiche à gauche le libellé de la Cellule active sous la forme `Série i · <champ>` (ex. `Série 1 · Durée`) et − / + à droite, qui n'agissent que sur cette cellule ; aucun stepper permanent dans les cellules. Règles détaillées : ED-10, ED-12. — *source : `S/13…:2997,4076,4223` ; `D/DSF-CIRCUITS…:27-37` ; P11, P23*

**Référence visuelle :** `8328:36923`, `8328:37092`, `8328:37760`, `8328:37862`, `8328:37972`, `8328:38084`, `8328:38193`, `8328:38301`, `8328:38513`, `8328:38953`, `8328:39279`, `8328:39390`.

#### FR-03-13 : Décisions de recette PRE-3 maintenues dans la Feuille
L'utilisateur retrouve dans la Feuille les règles PRE-3 acceptées que PRE-4 ne supersède pas.
**Conséquences (testables) :**
- Les règles PRE-3 non supersédées restent appliquées ; chacune est rattachée à l'exigence PRE-4 qui la porte. Inventaire des règles PRE-3 qui touchent la Feuille (`PRE3-PERIM`) :

| Règle PRE-3 maintenue | `PRE3-PERIM` | Exigence PRE-4 |
|---|---|---|
| Ouvrir copie le Brouillon parent ; ✕ ou retour annule toute l'ouverture ; ✓ applique atomiquement ; seul `Terminer` enregistre | l. 90 | FR-03-01, FR-11-01, FR-18-17 |
| Activer `variables` copie la Cible et la Pause uniformes ; revenir en `identiques` reprend la première ligne ; réactiver avant ✓ restaure le tableau | l. 91 | FR-04-03, FR-04-04 |
| Diminuer N retire les dernières lignes ; remonter N avant ✓ les restaure dans leur ordre, puis copie la dernière ligne | l. 92 | FR-12-01, FR-12-02 |
| Déplacer une ligne déplace ses paramètres, renumérote, recalcule la dernière Pause ; ✕ annule les déplacements | l. 93 | FR-12-03 |
| Changer de Mode conserve N, Pauses et Bip ; Cibles incompatibles non renseignées, jamais zéro ; retour avant ✓ restaure | l. 94 | FR-11-03, FR-11-04 |
| N = 1 normalise immédiatement (uniforme, `Un côté après l’autre`), calculs compris ; contrôles sans effet atténués (*Ordre des côtés : masqué à N = 1 ; l'Ordre choisi est conservé et réaffiché dès N ≥ 2 — source : Q38*) | l. 95 | FR-12-04 |
| Replier le tableau ne change ni données ni validité | l. 96 | FR-04-02, FR-03-03 |
| Bip au premier niveau juste avant le total applicable ; total absent → avant Compte à rebours ; voile `#1F2129` à 34 % | l. 159 | FR-03-02, FR-03-01 |
| Phrase Inter 13, interligne 20, valeurs Semi Bold, texte long intégral | l. 149, 161 | FR-02-06, FR-16-11 |
| En-tête accessible, corps défilant, Safe Areas, clavier, texte agrandi | l. 162 | FR-03-02, FR-22-05, FR-22-06 |
| Appui au pas 1, maintien après ≈ 500 ms, accélération 1/5/10, Bip / Compte à rebours / Fin au pas 1, arrêt au relâchement | l. 163 | FR-03-05, FR-09-04 |
| Réutiliser les composants et jetons existants | l. 164 | NFR-03, FR-02-13 |

— *source : `PERIM:21` (ED-03 : « maintien des décisions de recette non supersédées ») ; `docs/preparation/PRE-3/perimetre-et-couverture.md` §4, §5, §7, §8*
- Règles PRE-3 de la Feuille **supersédées** par PRE-4, et seulement elles : steppers « en place » et steppers permanents des cellules (l. 159 ; ED-10, P11) ; message identifiant la Série incomplète (l. 96 ; D-337, P4) ; Mode à trois valeurs et Bip « dans les trois modes » (l. 69, 79 ; ED-05) ; Cible Durée 1..5999 s (l. 72 ; ED-09, Q15) ; retraits x52 des groupes pour le tableau (l. 160 ; P23) ; segmentés intégrés (l. 153 ; ED-03, P9, P10) ; présentations D-339 et D-341 (P9). — *source : `PRE3-PERIM` ; P4, P9, P10, P11, P23 ; Q15*
  - *Précision du 2026-10-18 (story 3.8) :* pour D-339, seule la présentation en segmenté intégré et la fermeture progressive propre au popover sont supersédées ; le cadre D-4 d'un sélecteur en ligne (valeur choisie visible, puis repli) reste, porté à 350 ms (Q40, 3.8 AC9). Q44 rétablit les ± permanents des cellules du tableau.

---

### 4.4 Régime des séries (ED-04)

**Description :** L'utilisateur choisit explicitement le Régime de l'Exercice dans la Feuille Paramètres d'exécution : **identiques** (une Cible et une Pause communes) ou **variables** (une Cible et une Pause par Série). Le choix se fait par un popover porté par la ligne `Séries`, et non plus par un interrupteur. Le Régime ne se déduit jamais de l'égalité des valeurs ni du Mode. En variables, un chevron permet de masquer ou d'afficher le Tableau des séries variables sans rien changer aux données. Le passage d'un Régime à l'autre copie ou reprend les valeurs selon des règles fixes, et l'état mis de côté reste disponible dans la Réserve jusqu'au ✓ de la Feuille.

**Exigences fonctionnelles :**

#### FR-04-01 : Choisir le Régime par popover
L'utilisateur peut choisir le Régime `identiques` ou `variables` dans un popover à deux entrées, porté par un champ de la ligne `Séries`, lorsque N ≥ 2.

**Conséquences (testables) :**
- Le popover propose exactement deux entrées : `identiques`, sous-titre « toutes les séries ont la même valeur », et `variables`, sous-titre « chaque série a sa propre valeur » (sous-titres : référence visuelle, P33). Exigence de référence du popover de Régime (FR-03-09 y renvoie). — *source : [08]:467-474 ; [13]:4075 ; [FIG] 8328:39390 ; Q7 04.2*
- Aucun interrupteur « Séries variables » n'est présent dans la Feuille. — *source : [DSFCIR]:5 ; [B-v13]:145 ; Q7 04.1*
- Le popover se comporte comme la primitive native du système : fermeture par appui extérieur, retour du focus au champ, une seule surface ouverte à la fois ; aucun choix n'est persisté avant le ✓ de la Feuille. — *source : P9 ; [13]:4085 ; Q7 03.1 ; [ASSUMPTION: H13] (retour du focus)*
- Le Régime est explicite : un Exercice en `variables` dont toutes les lignes portent la même Cible et la même Pause (par exemple 3 × 30 s, Pause 10 s) reste en `variables` après ✓, après Terminer et à la réouverture. — *source : [09]:445, 1248 ; [13]:4145, 4181-4185 ; Q7 04.4*
- Changer de Mode ne change pas le Régime. — *source : [09]:445, 1140*

#### FR-04-02 : Afficher et replier le Tableau des séries variables
L'utilisateur peut, en `variables`, masquer ou afficher le Tableau des séries variables par un chevron.

**Conséquences (testables) :**
- Trois états d'affichage existent : `identiques`, sans chevron ; `variables` avec tableau visible (chevron déployé) ; `variables` avec tableau masqué (chevron replié). Référence visuelle du tableau replié : [FIG] 8328:39181 (« Séries variables (tableau replié) »). — *source : [08]:476-484 ; [13]:2985, 4075 ; Q7 04.3 ; [FIG] 8328:39181 (visuel seulement)*
- Replier le tableau ne modifie aucune donnée et ne fait pas quitter le Régime `variables` ; déplié de nouveau, le tableau montre les mêmes lignes, Cibles, Pauses et erreurs. — *source : [13]:4085 ; [08]:478-484 ; Q7 04.5*
- Une cellule à renseigner dans un tableau replié laisse le ✓ de la Feuille indisponible : le repli ne contourne jamais la validation. — *source : [13]:4100*

#### FR-04-03 : Passer en Régime variables
L'utilisateur peut passer de `identiques` à `variables`.

**Conséquences (testables) :**
- À l'activation, chacune des N lignes copie la Cible et la Pause uniformes courantes, Cible à l'échec comprise (identiques 3 × à l'échec, Pause 20 s → 3 lignes `à l’échec` / 20 s). — *source : [08]:253 ; [13]:3019*
- Le Bip commun continue de s'appliquer à toutes les Séries. — *source : [07]:420 (D-272) ; [13]:3019*

#### FR-04-04 : Revenir en Régime identiques
L'utilisateur peut revenir de `variables` à `identiques`, puis éventuellement de nouveau en `variables` avant ✓.

**Conséquences (testables) :**
- Le retour à `identiques` se fait sans confirmation ni message temporaire. — *source : [08]:253, 532*
- L'état uniforme reprend la Cible **et** la Pause de la première ligne dans l'ordre courant, y compris après un réordonnancement. — *source : [08]:253, 257, 532 ; Q7 12g.1*
- Repasser en `variables` avant ✓ restitue le dernier tableau variable (lignes, ordre, Cibles, Pauses). — *source : [08]:253, 532 ; Q7 12g.2*
- Si ✓ valide en `identiques`, les valeurs variables mises en Réserve ne sont pas enregistrées : la réouverture de la Feuille puis le passage en `variables` copient les valeurs uniformes (FR-04-03), sans retrouver l'ancien tableau. — *source : [08]:253 ; [09]:446*
- Fermer la Feuille par ✕ laisse l'Éditeur inchangé. — *source : [13]:3033 ; Q7 12g.3*

#### FR-04-05 : Valeurs par défaut et lecture du Régime
L'Éditeur d'Exercice peut présenter le Régime d'un Exercice nouveau ou existant.

**Conséquences (testables) :**
- Un Exercice créé est en `identiques` ; à N = 1, le Régime effectif est `identiques`. — *source : [09]:445 ; [08]:461*
- Un Exercice enregistré avant PRE-4, sans Régime explicite, s'ouvre en `identiques`. — *source : [09]:1142*
- En `identiques`, la Feuille montre une ligne de Cible commune et la ligne `Pause après chaque série` ; la ligne de Cible s'intitule `Durée d’une série` en Durée et `Nombre de répétitions` en Répétitions. — *source : [08]:241, 247, 1559 ; [13]:4076 ; [FIG] 8328:37760 ; H14*
- À N = 1, le champ de Régime n'est pas modifiable (voir FR-12-04). — *source : P16 ; [08]:261*

**Hors périmètre :** l'ajout d'un Exercice à un circuit (Composition). La règle « un Exercice nouvellement créé et ajouté à un circuit est en identiques » ([08]:461) est une contrainte de compatibilité, sans parcours PRE-4 (Q4).

**Référence visuelle :** `8328:39390` (popover de Régime), `8328:37760` (identiques, Durée), `8328:38632`, `8328:38741` (variables), `8328:39181` (tableau replié, FR-04-02), `8328:39072` (une seule série, FR-04-05 et FR-12-04) — visuel seulement (D-255).

**Notes :** [ASSUMPTION: H14 — libellé `Nombre de répétitions` de la ligne de Cible commune en Répétitions, symétrique de `Durée d’une série` ; aucune capture.] Non repris : l'« interrupteur visuellement désactivé » de D-250 ([07]:373) et le message en ligne de D-251 ([07]:374), supersédés par le DSF du 12/10 et D-337 (P4, P16).

---

### 4.5 Deux Modes seulement (ED-05)

**Description :** Un Exercice a un seul Mode, **Durée** ou **Répétitions**. « À l’échec » n'est plus un troisième Mode : c'est un type de Cible de Série, disponible dans les deux Modes (ED-06). Le Mode n'est pas renseigné à la création ; tant qu'il manque, la Phrase des paramètres est vide et `Terminer` est indisponible. Changer de Mode n'enregistre rien. Le Bip existe dans les deux Modes. Les cartes et les copies continuent d'identifier le Mode, même quand toutes les Cibles sont à l'échec.

**Exigences fonctionnelles :**

#### FR-05-01 : Choisir un Mode parmi deux
L'utilisateur peut choisir le Mode dans le popover du champ `Mode d’exécution` de la Feuille Paramètres d'exécution.

**Conséquences (testables) :**
- Le popover propose exactement deux options, `Durée` puis `Répétitions`, dans cet ordre, en Régime `identiques` comme en `variables` (même popover). Exigence de référence du popover de Mode (FR-03-06 y renvoie). — *source : [13]:4073, 3015, 2995 ; [DSF2M]:7 ; [06]:223 ; ordre : [FIG] 8328:37092, 8328:38513 ; Q7 05.1*
- Aucune option « À l’échec » n'apparaît dans ce popover. — *source : [13]:4073 ; [DSF2M]:7 ; Q7 05.2*
- La Cible à l'échec reste choisissable dans les deux Modes, par le Sélecteur de cible (FR-07-02, FR-07-03). — *source : [10]:61 (RM-033) ; [09]:607 ; [07]:604*
- Le popover de Mode suit le mécanisme natif du système : appui extérieur pour fermer, une seule surface ouverte ; la fermeture progressive de D-339 et la typographie de D-341 ne sont pas des exigences. — *source : P9 ; [13]:4087*

#### FR-05-02 : Mode initial non renseigné
L'Éditeur d'Exercice peut créer un Exercice sans Mode, tant que l'utilisateur n'en a pas choisi.

**Conséquences (testables) :**
- À la création, le champ `Mode d’exécution` affiche `—`, la Phrase des paramètres est vide et `Terminer` est indisponible. — *source : [13]:4085 ; [08]:1557, 1567, 1595, 1808*
- Après un premier choix de Mode, aucune action ne ramène le Mode à l'état non renseigné. — *source : [08]:1557*

#### FR-05-03 : Changer de Mode sans rien enregistrer
L'utilisateur peut changer de Mode dans la Feuille sans effet hors du Brouillon de la Feuille.

**Conséquences (testables) :**
- Changer de Mode puis fermer la Feuille par ✕ laisse le Mode et les Cibles de l'Éditeur inchangés ; seul le ✓ de la Feuille applique, et seul `Terminer` enregistre (règles détaillées en 4.11). — *source : [13]:2967, 3037*
- Le Bip, de 0 (`Aucun`) à 10 s, existe dans les deux Modes ; il est conservé au changement de Mode, même après ✓. — *source : [13]:3019, 3033, 4080 ; [07]:481 (D-308) ; Q7 11.3*

#### FR-05-04 : Mode distinct de la Phrase et de la Cible à l'échec
L'Éditeur d'Exercice peut exprimer l'échec sans élément d'interface dédié autre que la Cible.

**Conséquences (testables) :**
- La Phrase des paramètres ne répète pas le Mode ; le champ `Mode d’exécution` reste distinct de la Phrase. — *source : [08]:1595 ; [13]:570, 636*
- Aucun interrupteur ni ligne métier « échec » n'est ajouté à la Feuille, et aucun écran propre à la « Série à l’échec » uniforme n'existe : le Sélecteur de cible l'exprime. — *source : [B-2M]:147 ; [DSF2M]:49 ; [13]:3009 ; [MAT2M]:22 (E14)*
- Le libellé « À l’échec » est retiré de la liste des Modes du lexique, mais le texte « à l’échec » n'est pas supprimé du lexique : il reste valide pour désigner une Cible, jamais un Mode. — *source : [B-2M]:191*

#### FR-05-05 : Mode transporté et identifiable
L'utilisateur peut retrouver le Mode d'un Exercice partout où l'Exercice est présenté ou copié.

**Conséquences (testables) :**
- Après Terminer, réouverture, copie en Séance ou Instantané, l'Exercice a le même Mode et la même Cible typée pour chaque Série. — *source : [11]:267, 405 ; [09]:607 ; [12]:1359*
- Un Exercice enregistré dans l'Ancien mode À l'échec est lu, puis converti en Mode Répétitions avec toutes ses Cibles à l'échec (exigences de migration en ED-18). — *source : [09]:607, 1256 ; [10]:144 (RM-127) ; Q7 05.3*
- Une carte Catalogue d'un Exercice dont toutes les Cibles sont à l'échec garde la formulation `N séries à l’échec` (ex. `3 séries à l’échec`). — *source : [13]:556 ; [08]:1814 ; P3*
- Le Mode reste identifiable sur les cartes même quand toutes les Cibles sont à l'échec. — *source : [B-2M]:157 ; [06]:842*

**Hors périmètre :** la grille Volumes de Composition ([13]:4130) (Q4).

**Référence visuelle :** `8328:37092`, `8328:38513` (popover de Mode). Popover de référence 184 × 99 en hauteur automatique, au lieu de 136 ([DSF2M]:7 ; [MAT2M]:17) — visuel seulement.

**Notes :** Non repris : les formulations à trois Modes de [08]:1580, 1564, 488 ; [09]:455 ; [01]:207, 29 ; [06]:1664, 2208 (supersédées, P20). D-339 et D-341 ([07]:550, 552) : présentations PRE-3 supersédées (P9). Hors PRD, pour l'architecture : la forme de sérialisation et d'adaptateur de l'ancien format (Q7 05.4, classe T).

---

### 4.6 Cible typée par Série (ED-06)

**Description :** Chaque Série effective porte une Cible typée : **numérique** (secondes en Durée, nombre de répétitions en Répétitions), **à l'échec** (sans nombre, la fin est décidée par l'utilisateur), ou **à renseigner** (`—`, état de Brouillon jamais enregistrable). Une Cible à renseigner, nulle ou invalide n'est jamais convertie en Cible à l'échec. En `identiques`, toutes les Séries ont la même Cible ; en `variables`, la suite ordonnée des couples Cible/Pause est la seule vérité et peut mêler numérique et échec. La Cible typée accompagne chaque Série dans toutes les copies et tous les Instantanés.

**Exigences fonctionnelles :**

#### FR-06-01 : Attribuer une Cible typée à chaque Série
L'utilisateur peut donner à chaque Série une Cible numérique ou une Cible à l'échec.

**Conséquences (testables) :**
- Une Cible numérique est un entier dans l'unité du Mode : secondes en Durée, répétitions en Répétitions. — *source : [09]:1240-1242 ; Q7 06.2*
- Une Cible à l'échec n'a aucun nombre et est valide : elle ne bloque pas le ✓ de la Feuille ni `Terminer`. — *source : [09]:1243 ; [13]:3027 ; [10]:654 ; [08]:536 ; Q7 06.1*
- Une Série ne porte jamais à la fois un nombre et l'échec. — *source : [09]:1196 ; [13]:4104*
- 0 n'est jamais une Cible ; la distinction entre numérique et échec ne repose jamais sur 0, sur un texte ni sur une absence de valeur. — *source : [09]:1196, 1246 ; [13]:4104*
- Relu après Terminer et réouverture, chaque Série retrouve exactement son type et sa valeur. — *source : [13]:620 ; [09]:1230 ; Q7 01.2*

#### FR-06-02 : Refuser une Cible à renseigner ou invalide sans la convertir
L'Éditeur d'Exercice peut signaler une Cible à renseigner ou invalide sans jamais la transformer.

**Conséquences (testables) :**
- Une Cible à renseigner (`—`), 0, une valeur non numérique, un texte ou un type inconnu ne sont jamais enregistrés et ne sont jamais convertis en Cible à l'échec. — *source : [09]:1244-1246 ; [10]:739 (R14) ; [13]:3041 ; Q7 06.3, 06.4*
- Une Cible invalide bloque le ✓ de la Feuille ; elle n'est pas traitée comme une Durée totale omise et aucun montant n'est inventé. — *source : [13]:2979 ; [10]:613, 654 ; [B-2M]:100*
- En Répétitions sans Bip, la ligne Durée totale reste absente même si une Cible est à renseigner ; l'erreur reste portée par la Cible et le ✓ est indisponible. — *source : [10]:654*

#### FR-06-03 : Cible commune ou Cibles ordonnées selon le Régime
L'utilisateur peut régler une Cible commune en `identiques`, ou une Cible par Série en `variables`.

**Conséquences (testables) :**
- En `identiques`, toutes les Séries ont la même Cible, Cible à l'échec comprise. — *source : [09]:1248 ; [B-2M]:38*
- En `variables`, la suite ordonnée des N couples Cible/Pause est la seule source de vérité ; elle peut mêler Cibles numériques et à l'échec (ex. 10, 12, à l'échec), et l'ordre saisi est conservé après Terminer. Il n'existe aucune valeur commune doublée de surcharges par ligne. — *source : [09]:1248 ; [08]:247 ; [07]:370 (D-247)*
- Des Cibles momentanément égales ne changent pas le Régime (voir FR-04-01). — *source : [09]:445, 1248*
- Les quatre combinaisons Durée/Répétitions × `identiques`/`variables` admettent des Cibles à l'échec. — *source : [09]:1248 ; Q7 06.5*

#### FR-06-04 : Cible typée en bilatéral
L'utilisateur peut régler des Cibles pour un Exercice avec Changement de côté.

**Conséquences (testables) :**
- En bilatéral, N désigne N Séries **par côté** ; les deux côtés reçoivent les mêmes Cibles. — *source : [08]:238 ; [09]:1140, 1250*

#### FR-06-05 : Présenter une Cible à l'échec
L'utilisateur peut identifier une Cible à l'échec dans la Feuille.

**Conséquences (testables) :**
- Une cellule de Cible à l'échec affiche `à l’échec`, sans valeur numérique ; l'en-tête de la colonne reste celui du Mode (`Durée` ou `Répétitions`). — *source : [DSF2M]:45 ; [13]:2995 ; [MAT2M]:20 (E12) ; [FIG] 8328:38848, 8470:13303*
- Le tableau garde ses deux colonnes Cible et Pause, même quand toutes les Cibles sont à l'échec. — *source : [DSF2M]:45 ; Q7 10.1*
- Une Cible à l'échec n'est pas une valeur réglable par − et + : les ± du Pied commun sont indisponibles sur elle (FR-10-04). — *source : [DSFCIR]:41 ; [13]:4076 ; Q13*

#### FR-06-06 : Cible typée dans les copies et les Instantanés
L'utilisateur peut copier un Exercice sans perdre le type de ses Cibles.

**Conséquences (testables) :**
- La Cible typée appartient à chaque Série effective, à chaque Copie en Séance et à chaque Instantané ; le Mode appartient à l'Exercice (exigences de copie en ED-19). — *source : [09]:1196 ; [11]:405 ; [13]:31 ; P27*

**Hors périmètre :** les cibles d'intensité (charge, RPE…) ([08]:247) ; la valeur relevée après exécution, distincte de la prescription ([09]:1196 ; [B-2M]:106), dont les relevés sont hors PRE-4.

**Notes :** Hors PRD, pour l'architecture : le nom technique de l'état à renseigner (Q7 06.6, classe T).

---

### 4.7 Sélecteur de cible (ED-07)

**Description :** Le Sélecteur de cible est une roulette native du système, avec ses propres ✕ et ✓, qui permet de choisir une Cible numérique ou la Cible à l'échec. En Durée, il présente l'option « Aucune durée, à l’échec » au-dessus d'une roulette minutes-secondes. En Répétitions, c'est une roulette à une colonne dont la première ligne est « Aucune répétition, à l’échec », suivie de 1 à 100. Il s'ouvre toujours sur la Cible courante. Son ✓ applique au Brouillon de la Feuille ; le ✓ de la Feuille applique ensuite à l'Éditeur. Il s'ouvre depuis la ligne de Cible commune ou depuis une cellule de Cible du Tableau des séries variables.

**Exigences fonctionnelles :**

#### FR-07-01 : Ouvrir le Sélecteur de cible
L'utilisateur peut ouvrir le Sélecteur de cible depuis la ligne de Cible commune en `identiques`, ou en touchant une cellule de Cible du Tableau des séries variables.

**Conséquences (testables) :**
- En `identiques`, toucher la valeur de la ligne `Durée d’une série` ou `Nombre de répétitions` ouvre le Sélecteur. — *source : [13]:4076 ; [FIG] 8328:37760, 8328:37862 ; H14*
- En `variables`, toucher une cellule de Cible la rend Cellule active et ouvre le même Sélecteur que la Cible commune, en Durée comme en Répétitions. — *source : Q13*
- Un seul popover ou une seule roulette est ouvert à la fois. — *source : [13]:4085, 3019 ; Q7 03.1*

#### FR-07-02 : Variante Durée
L'utilisateur peut, en Mode Durée, choisir une Cible numérique en minutes et secondes, ou l'échec.

**Conséquences (testables) :**
- La surface montre, de haut en bas : l'option « Aucune durée, à l’échec », centrée ; un filet ; la roulette minutes-secondes. La roulette de Durée totale n'en fait pas partie. — *source : [DSF2M]:13-21 ; [13]:2995, 3015 ; Q7 07f.1*
- Le libellé de l'option est exactement « Aucune durée, à l’échec », jamais « À l’échec » seul ni « Aucune durée » seul. — *source : [13]:3015 ; [DSF2M]:21 ; P6*
- La roulette a deux colonnes, `minutes` et `secondes` ; les secondes avancent par pas de 1 (à la seconde) ; les valeurs proposées vont de 00:05 à 58:55. — *source : [08]:1558 ; [13]:4093, 4106 ; [DSF2M]:37 ; Q36 (le pas de 5 initial est levé)*
- La colonne des minutes va de 00 à 58 ; à 58 minutes, la colonne des secondes s'arrête à 55. La valeur 59 n'est jamais proposée. — *source : P21 ; [MAT2M]:65 (R06)*
- La roue des minutes ne reboucle pas de 58 à 00. — *source : H15*

#### FR-07-03 : Variante Répétitions
L'utilisateur peut, en Mode Répétitions, choisir une Cible de 1 à 100 répétitions, ou l'échec, dans une roulette native à une colonne.

**Conséquences (testables) :**
- La roue a une seule colonne : la première ligne est « Aucune répétition, à l’échec », suivie des entiers 1 à 100 dans l'ordre croissant. — *source : Q8 ; Q14 ; [13]:3015 ; [DSF2M]:21 ; Q7 07r.1-07r.3*
- La roue arrêtée sur la ligne de tête choisit la Cible à l'échec ; arrêtée sur un nombre, elle choisit ce nombre. — *source : Q14*
- La sélection est rendue par la roue native, sans grisé ajouté ; ni filet, ni libellé séparé, ni position `00:00` n'existent dans cette variante. — *source : Q14*
- Elle remplace, pour la Cible, le stepper en ligne prévu par [13]:125, [06]:186, 2199, D-219 ([07]:294) et [08]:1559, 1573. — *source : Q8*

#### FR-07-04 : Ouvrir sur la Cible courante, une seule sélection
L'utilisateur peut retrouver, à l'ouverture du Sélecteur, la Cible actuellement choisie.

**Conséquences (testables) :**
- Le Sélecteur s'ouvre toujours sur l'état courant, jamais sur une position neutre. — *source : [13]:3015, 4104 ; [DSF2M]:21, 33*
- Durée, Cible numérique (ex. 30 s) : roulette active sur 00:30, option échec à 45 % d'opacité. — *source : [13]:4104 ; [DSF2M]:31, 33 ; Q7 07n.1, 07n.2*
- Durée, Cible à l'échec : option échec à 100 %, bloc minutes-secondes affiché `00:00` et atténué à 45 %. — *source : [13]:4104 ; [DSF2M]:33, 35 ; Q7 07f.2, 07f.3*
- Répétitions : roue sur le nombre courant (ex. 12), ou sur la ligne de tête si la Cible est à l'échec. — *source : Q8 ; Q14*
- À tout instant exactement une Cible est sélectionnée ; aucune coche n'est affichée. — *source : [13]:3015, 4104 ; [DSF2M]:21, 33 ; Q7 07n.3, 07r.4*
- Cible historique hors plage : le Sélecteur s'ouvre sur la valeur valide la plus proche, c'est-à-dire la valeur bornée à 5 s – 58 min 55 s en Durée (à la seconde, sans multiple de 5) et à 1 – 100 en Répétitions. Exemples : Cible 5999 s → ouverte sur 58:55 ; Cible 150 répétitions → roue ouverte sur 100 ; Cible 7 s, désormais valide → roulette ouverte sur 00:07. — *source : Q21 ; Q36*
- Dans ce cas, rien ne change tant que le ✓ du Sélecteur n'est pas touché : la Cible affichée dans la Feuille reste 5999 s (ou 150 rép.) pendant l'ouverture ; ✕ laisse la valeur ancienne intacte (5999 s ouvert, ✕ → 5999 s) ; ✓ sans avoir tourné la roue applique la valeur affichée par la roue (5999 s ouvert sur 58:55, ✓ → 3535 s ; 150 ouvert sur 100, ✓ → 100). — *source : Q21 ; Q12 ; Q36 (exemples 7 s remplacés, 7 s étant valide)*
- **Cible à renseigner (`—`)** (création en Durée, P19 ; ligne après un changement de Mode, P37 ; donnée ancienne sans Cible, H25) : le Sélecteur s'ouvre sur la plus petite valeur valide, sélectionnée en numérique. Durée : roulette active sur 00:05, option échec à 45 %, ✓ du Sélecteur disponible. Répétitions : roue sur 1 (et non sur la ligne de tête). Rien n'est appliqué avant le ✓ : pendant l'ouverture, la Cible affichée dans la Feuille reste `—` ; ✕ laisse la Cible à renseigner ; ✓ sans avoir tourné la roue applique 5 s (Durée) ou 1 (Répétitions). Vaut pour la Cible commune comme pour une cellule du tableau (FR-10-03). — *source : Q25 ; Q12*

#### FR-07-05 : Valider ou annuler dans le Sélecteur, puis dans la Feuille
L'utilisateur peut valider ou annuler son choix dans le Sélecteur, puis valider ou annuler la Feuille.

**Conséquences (testables) :**
- Le Sélecteur a ses propres ✕ et ✓. — *source : Q12 ; [13]:4213 ; [FIG] 8328:37862*
- Le ✓ du Sélecteur applique la Cible au Brouillon de la Feuille seulement : l'Éditeur ne change pas tant que le ✓ de la Feuille n'est pas touché. — *source : Q12 ; [13]:2967, 3033 ; [08]:251 ; Q7 07v.1*
- Le ✕ du Sélecteur restaure la Cible d'avant son ouverture (ex. ouvert sur 30 s, tourné vers 45 s, ✕ → 30 s). — *source : Q12 ; [B-2M]:236 ; Q7 08.3*
- Le ✓ de la Feuille applique ensuite le Brouillon à l'Éditeur ; le ✕ de la Feuille annule tout, y compris les choix validés dans le Sélecteur. — *source : Q12 ; [13]:3033*
- La même double validation vaut pour la roulette de Durée totale. La mention « sans seconde validation par roulette » de [08]:1573 n'est pas suivie. — *source : Q12*
- Quitter l'Éditeur sans `Terminer` en confirmant l'abandon conserve la version enregistrée. — *source : [13]:552, 620 ; Q7 07v.2*

#### FR-07-06 : Roulette native et retour haptique
L'utilisateur peut manipuler les deux variantes du Sélecteur comme une roulette native du système.

**Conséquences (testables) :**
- Les deux variantes utilisent la roulette native du système (roue), et non une imitation. — *source : [DSF2M]:35 ; [MAT2M]:48 (R02) ; AGENTS.md (primitives natives)*
- Aucun état de la roue n'est rendu par une désactivation native qui bloquerait ses gestes : la roue reste manipulable dans tous les états. — *source : [DSF2M]:35 ; [MAT2M]:48*
- Chaque changement effectif de valeur déclenche un retour haptique léger et bref, une seule fois par cran, quelle que soit la préférence `Vibrations` du Profil. — *source : [08]:1569*

#### FR-07-07 : Roulette de Durée totale distincte
L'utilisateur peut continuer à régler la Durée totale par sa propre roulette, distincte du Sélecteur de cible.

**Conséquences (testables) :**
- La roulette de Durée totale n'a pas d'option échec et n'est pas remplacée par le Sélecteur de cible (règles d'inversion en ED-14). — *source : [DSF2M]:41 ; [13]:2995 ; [MAT2M]:41*

#### FR-07-08 : Accessibilité du Sélecteur
L'utilisateur d'une technologie d'assistance peut choisir une Cible numérique ou à l'échec.

**Conséquences (testables) :**
- L'option échec est annoncée « sélectionnée » ou « non sélectionnée » ; l'état n'est jamais transmis par le gris seul. — *source : [13]:3047 ; [DSF2M]:53 ; Q7 22t.1, 22t.4*
- Le bloc atténué reste manipulable avec VoiceOver. — *source : [DSF2M]:33-35 ; Q7 22t.2*
- La valeur et son unité sont annoncées. — *source : H13*
- Focus contenu dans la surface modale ; texte agrandi pris en charge ; cibles tactiles d'au moins 44 × 44 pt, indépendamment des 30 px dessinés de l'option ; alternative aux gestes fins. — *source : [13]:3047 ; [DSF2M]:53 ; P30*

**Référence visuelle :** `8328:37862` (Sélecteur, Durée, Cible numérique) ; maître `8452:13297`. Valeurs du DSF, visuel seulement : popover hôte 354 × 249 en hauteur automatique (au lieu de 216 ; depuis Q37, la roue est présentée dans la couche `WheelPickerOverlay`, centrée, sans flèche, et non dans un popover ancré ; depuis Q41, la roue de Durée de la Cible commune est présentée sur iOS dans un panneau sans flèche juste sous son champ, aligné à droite — FR-03-11) ; maître 330 × 181 ; option échec 330 × 30 à y0, texte centré, Inter Regular 20, marge verticale 3 ; filet 330 × 1 à y30, couleur des séparateurs de popover ; roulette 330 × 150 à y31 ([DSF2M]:13-19 ; [MAT2M]:18). Roulette de Durée totale `5544:5118`, 330 × 150 dans un popover 354 × 216 ([DSF2M]:41). Aucune capture de la variante Répétitions. La colonne des minutes affichant 59 dans Figma n'est pas suivie (P21).

**Notes :** [ASSUMPTION: H13 — annonce de la valeur et de l'unité.] [ASSUMPTION: H14 — libellé `Nombre de répétitions`.] [ASSUMPTION: H15 — la roue des minutes ne boucle pas.] Position d'ouverture sur une Cible historique hors grille ou hors plage : tranchée par Q21 (valeur valide la plus proche, FR-07-04) ; la règle générale « ouvrir sur la Cible courante » vaut pour toute Cible de la grille.

---

### 4.8 Transitions et grisé manipulable (ED-08)

**Description :** Dans le Sélecteur de cible, passer de l'échec au numérique et inversement ne demande aucun geste de déverrouillage. En Durée, toucher l'option échec la sélectionne et ramène la roulette à `00:00` en l'atténuant à 45 % ; faire tourner ce bloc atténué sélectionne la valeur atteinte. Le grisé exprime la non-sélection, jamais une interdiction (Grisé manipulable). `00:00` n'est jamais une Cible. En Répétitions, la transition se fait en tournant la roue entre la ligne de tête et un nombre.

**Exigences fonctionnelles :**

#### FR-08-01 : Passer à la Cible à l'échec (Durée)
L'utilisateur peut choisir l'échec en touchant l'option « Aucune durée, à l’échec ».

**Conséquences (testables) :**
- Toucher l'option sélectionne l'échec : l'option passe à 100 %, la roulette revient à `00:00` et tout le bloc minutes-secondes est atténué à 45 %. — *source : [13]:3015, 4104 ; [DSF2M]:33, 35 ; [07]:610 ; Q7 08.1*

#### FR-08-02 : Revenir au numérique sans déverrouillage (Durée)
L'utilisateur peut revenir à une Cible numérique en faisant tourner directement le bloc atténué.

**Conséquences (testables) :**
- Depuis l'échec, tourner la roulette jusqu'à 00:30 sélectionne 30 s ; l'option échec repasse à 45 % et la roulette reprend son rendu actif. — *source : [13]:3015, 4104 ; [DSF2M]:33 ; Q7 08.2*
- Aucun geste préalable (appui long, déverrouillage, double appui) n'est nécessaire : le bloc atténué est manipulable (P5). — *source : [13]:3015, 3055 ; [DSF2M]:33, 35 ; [MAT2M]:48, 61 ; Q7 07f.4*
- Le traitement à 45 % s'applique au bloc entier tant qu'il n'est pas sélectionné. — *source : [DSF2M]:35*

#### FR-08-03 : Transitions en Répétitions
L'utilisateur peut passer de l'échec à un nombre, ou l'inverse, en tournant la roue.

**Conséquences (testables) :**
- Tourner de la ligne de tête vers 12 sélectionne 12 ; revenir sur la ligne de tête sélectionne l'échec ; aucun grisé n'est ajouté au rendu natif. — *source : Q14 ; Q8*

#### FR-08-04 : `00:00` n'est jamais une Cible
L'Éditeur d'Exercice peut empêcher de valider `00:00` comme Cible, sans le convertir en échec.

**Conséquences (testables) :**
- En Durée, si la roue est sur `00:00` alors que la sélection est numérique (l'option échec à 45 %), le ✓ du Sélecteur est indisponible ; la Cible n'est pas convertie en échec. — *source : Q15 ; [13]:4104, 4106 ; [13]:3055*
- Amener la roue sur `00:00` ne sélectionne pas l'échec. — *source : [DSF2M]:33, 37 ; [09]:1244 ; Q7 09d.3*
- Une Pause de 0 s reste valide. — *source : [13]:3009, 4100 ; Q7 09h.4*

#### FR-08-05 : Annuler ou valider une transition
L'utilisateur peut annuler une transition par le ✕ du Sélecteur, ou l'appliquer par son ✓.

**Conséquences (testables) :**
- Scénario de recette : ouvrir sur 30 s (roulette sur 00:30, option à 45 %) ; toucher l'option (option à 100 %, bloc `00:00` à 45 %) ; tourner vers 00:30 (Cible 30 s, option à 45 %) ; ✓ puis rouvrir : 30 s ; choisir l'échec, ✓ puis rouvrir : option à 100 %, `00:00` à 45 % ; changer puis ✕ : état d'avant ouverture restauré. — *source : [B-2M]:236 ; [13]:3055 ; Q7 08.3*
- Le même scénario vérifie le refus de `00:00` sans conversion, le traitement à 45 % et l'annonce de la sélection (FR-07-08). — *source : [13]:3055*

#### FR-08-06 : Aucun écran supplémentaire
L'utilisateur peut régler une Série uniforme à l'échec sans écran dédié.

**Conséquences (testables) :**
- Aucun écran « Série à l’échec » n'existe ; le Sélecteur exprime cet état. — *source : [DSF2M]:49 ; [MAT2M]:22*

**Référence visuelle :** `8328:37862`. Rendu documenté de la roulette Durée ([DSF2M]:23-31 ; [MAT2M]:19), visuel seulement : lignes remplies en `#1a1a1f`, dégradé par l'opacité ; sélection 100 % / 20 px, voisine 45 % / 16 px, distance 2 20 % / 14 px, distance 3 10 % / 12 px ; option échec 100 % sélectionnée, 45 % sinon, en 20 px.

**Notes :** Rendu ligne par ligne de la roulette Durée (niveaux 100/45/20/10 %, tailles 20/16/14/12 px du DSF) : tranché par P33. Le mécanisme et le rendu natifs de la roulette priment ; les valeurs du DSF servent de référence visuelle ; un écart visible est signalé à Hermann à la recette iPhone et ne justifie jamais une réimplémentation. Restent exigés pour Durée : l'option à 45 %/100 % et le bloc atténué à 45 % (FR-07-04, FR-08-01, FR-08-02).

---

### 4.9 Bornes indépendantes des Pauses et des totaux (ED-09)

**Description :** Chaque valeur réglable de la Feuille a ses bornes et son pas propres. Une Cible Durée va de 5 à 3535 s, à la seconde (Q36) ; une Cible Répétitions de 1 à 100 ; N de 1 à 99. Les Pauses, le Bip, le Compte à rebours et la Fin gardent leurs règles. Les valeurs historiques hors grille ou hors plage sont affichées et calculées telles quelles tant qu'on ne les modifie pas ; les modifier impose une valeur valide. Aucune saisie ni erreur ne laisse un état partiel.

**Exigences fonctionnelles :**

#### FR-09-01 : Bornes de la Cible Durée
L'utilisateur peut choisir une nouvelle Cible Durée entière entre 5 et 3535 s, à la seconde. — *source : Q36*

**Conséquences (testables) :**
- Valeurs acceptées comme nouvelle Cible : 5, 7, 30, 31, 3535 s ; refusées : 0, 1, 4, 3536, 3540 s. Une valeur entière dans les bornes est valide, qu'elle soit ou non multiple de 5. — *source : [13]:4093, 4106, 3027 ; [10]:281 (RM-234) ; [09]:1116 ; [07]:312 (D-232) ; [DSF2M]:37 ; Q7 09d.1, 09d.2 ; Q36 (le refus des non-multiples de 5 est levé)*
- Le maximum proposé est 58 min 55 s ; 59:55 et 5999 s ne sont jamais proposés. — *source : [13]:4106 ; [MAT2M]:65 (R06) ; P21*

#### FR-09-02 : Bornes de la Cible Répétitions
L'utilisateur peut choisir une Cible Répétitions entière de 1 à 100.

**Conséquences (testables) :**
- 1 et 100 acceptés ; 0, 101 et 1,5 refusés. — *source : [13]:4092, 4106, 3027 ; [10]:281 ; [09]:1116 ; Q7 09r.1*

#### FR-09-03 : Bornes de N, des Pauses, du Bip, du Compte à rebours et de la Fin
L'utilisateur peut régler les autres valeurs de la Feuille dans leurs bornes propres.

**Conséquences (testables) :**
- N : 1 à 99, pas 1, valeur par défaut 1. — *source : [13]:4074, 4091 ; [09]:442, 1116*
- Pause après chaque série et Pause entre les côtés : 0 à 300 s, appui 1 s, maintien accéléré ; 0 est valide. — *source : [13]:4094, 4100 ; [10]:281 ; [08]:1808*
- Bip : entier de 0 à 10 s, pas 1, sans accélération ; 0 s'affiche `Aucun` ; −1, 11 et les fractions sont refusés, sans correction silencieuse. — *source : [13]:4095, 3027 ; [09]:1270 ; P32*
- Compte à rebours et Fin d'exercice : 0 à 60 s, pas 1, sans accélération. — *source : [13]:4096 ; [07]:379 (D-256), 547 (D-336)*

#### FR-09-04 : Comportement des commandes − et +
L'utilisateur peut ajuster une valeur par appui ou par maintien sur − ou +.

**Conséquences (testables) :**
- Un appui change la valeur d'un pas de 1 (1 s pour une Cible Durée). — *source : [13]:4098 ; Q15 ; Q36 (le pas de base 5 s de la Cible Durée est levé)*
- Maintien : après environ 500 ms, répétition toutes les 150 ms ; paliers de 5 après environ 2 s et de 10 après environ 4 s, arrondis au multiple dans le sens du geste ; saturation aux bornes, sans rebouclage. — *source : [13]:4098, 4255-4257 ; [07]:485 (D-312) ; [08]:1822*
- Le relâchement arrête la répétition et rétablit le pas de base, sans pas supplémentaire. — *source : [13]:4098*
- Bip, Compte à rebours et Fin restent au pas 1, sans accélération. — *source : [13]:4098*
- Cible Durée : un appui change la valeur de 1 s ; le maintien accélère par paliers de 5 s puis de 10 s (politique d'accélération existante), dans les bornes 5 à 3535 s, avec saturation aux bornes. — *source : Q15 ; [13]:4098 ; [ASSUMPTION: H19] ; Q36*
- Aucune valeur n'est arrondie à l'ouverture de la Feuille ni au chargement. — *source : [13]:4098*
- Aucune accélération ne s'applique aux roulettes. — *source : [13]:4098, 4257*

#### FR-09-05 : Valeurs historiques hors grille ou hors plage
L'utilisateur peut ouvrir un Exercice dont une valeur enregistrée sort de la grille ou des bornes actuelles, sans la voir modifiée.

**Conséquences (testables) :**
- Une Cible Durée historique hors plage (ex. 5999 s) est affichée et utilisée dans les calculs telle quelle tant qu'on ne la modifie pas. Une Cible historique dans les bornes mais non multiple de 5 (ex. 7 s) est une valeur valide. — *source : Q15 ; [13]:4106, 3041 ; [DSF2M]:37 ; [09]:1270 ; Q7 09h.1 ; Q36*
- Aucune lecture ni migration ne l'arrondit, ne la tronque ni ne la borne. — *source : [13]:4106 ; [09]:1116, 1256, 1270 ; Q7 09h.5*
- La modifier impose une valeur entière dans les bornes (de 5 à 3535 s, à la seconde). — *source : Q15 ; Q36*
- Les ± depuis une Cible Durée hors plage mènent à la valeur voisine dans le sens du geste, dans les bornes : − depuis 5999 s → 3535 s ; + depuis 7 s → 8 s et − depuis 7 s → 6 s (7 s étant valide). — *source : Q21 ; Q36*
- Depuis une Cible au-dessus de la borne haute (5999 s, 150 répétitions), + est indisponible ; − depuis 150 répétitions → 100. — *source : Q21, P38*
- Par le Sélecteur, une Cible hors grille s'ouvre sur la valeur valide la plus proche et reste inchangée sans ✓ (FR-07-04). — *source : Q21*
- Une Cible Répétitions hors 1..100 ou un Bip hors 0..10 hérités sont traités de même : affichés tels quels, jamais convertis en échec, une valeur valide étant exigée pour les modifier. — *source : H7 ; [09]:1270 ; [13]:4106*
- **Enregistrer sans modifier la valeur ancienne.** Une valeur ancienne hors bornes **non modifiée** (Cible de 5999 s, Cible de 150 répétitions, Bip de 11) n'empêche ni le ✓ de la Feuille ni `Terminer`, et elle est réenregistrée telle quelle. Seule une valeur **modifiée** doit respecter les bornes. Attendus : Exercice ancien à Cible 5999 s, seul le nom est changé, `Terminer` → enregistré, Cible relue 5999 s ; même Exercice, Feuille ouverte puis ✓ sans toucher la Cible → ✓ disponible, Cible toujours 5999 s ; Exercice ancien à Bip 11, Pause changée puis ✓ et `Terminer` → Bip relu 11 ; Cible 150 répétitions passée par − à 100 → seule la valeur 100 est enregistrée. — *source : [ASSUMPTION: H25] ; H7 ; [13]:4106 ; Q15 ; Q21*
- Une Cible **absente** (ex. ancienne donnée en Répétitions sans nombre) s'affiche à renseigner (`—`) et n'est jamais convertie en échec ; elle bloque le ✓ de la Feuille, avec le fond `#FFF1F0` (`color.dangerSurface`) sans contour de FR-10-06 (Q35), jusqu'à ce qu'elle soit renseignée. — *source : [ASSUMPTION: H25] ; H7 ; [09]:1244 ; FR-06-02*
- **Tableau unique de la tolérance historique** (révisé après la revue ChatGPT R1) : la comparaison se fait champ par champ avec la valeur relue à l'ouverture ; ni le renommage de l'Exercice, ni la modification d'une Pause ou d'un autre champ ne transforment une valeur inchangée en nouvelle saisie. — *source : [ASSUMPTION: H25] ; FR-09-02 ([13]:4092) ; Q15*

  | Champ (bornes de saisie) | Valeur | Verdict |
  |---|---|---|
  | Cible Répétitions (1..100) | ancienne 150, inchangée | tolérée |
  | Cible Répétitions (1..100) | nouvelle 100 (150 → 100) | valide |
  | Cible Répétitions (1..100) | nouvelle 101 ou 120 (150 → 101, 150 → 120) | refusée |
  | Cible Durée (5..3535, à la seconde, Q36) | ancienne 5999, inchangée ; nouvelle 3535 ; nouvelle 31 ; nouvelle 5995 | tolérée ; valide ; valide ; refusée |
  | Bip (0..10) | ancien 11, inchangé ; nouveau 10 ; nouveau 12 | toléré ; valide ; refusé |

#### FR-09-06 : Indépendance des bornes et absence d'état partiel
L'Éditeur d'Exercice peut appliquer les bornes de Cible sans toucher aux autres contrôles.

**Conséquences (testables) :**
- Les bornes de Cible ne modifient ni les bornes des Pauses ni celles de la Durée totale. — *source : [13]:4106 ; [DSF2M]:37 ; [MAT2M]:65*
- Le pas de l'interface ne limite pas les valeurs enregistrables (voir FR-09-05). — *source : [09]:1116*
- Une saisie hors borne, une Cible manquante, une double validation, une interruption ou une erreur d'enregistrement ne laissent aucun état partiel : l'Éditeur et l'Exercice enregistré restent dans leur état complet antérieur. — *source : [13]:3041*

**Notes :** [ASSUMPTION: H7 — valeurs anciennes invalides conservées telles quelles et jamais converties en échec.] [ASSUMPTION: H25 — une valeur ancienne hors bornes non modifiée n'empêche ni ✓ ni `Terminer` et est réenregistrée telle quelle ; seule une valeur modifiée respecte les bornes ; une Cible absente bloque ✓.] [ASSUMPTION: H19 — maintien sur ± d'une Cible Durée : paliers de 5 s puis de 10 s, dans les bornes ; pas de base 1 s, Q36.] Valeur atteinte par ± depuis une Cible Durée hors plage : tranchée par Q21, adaptée par Q36 (valeur voisine dans le sens du geste, sans multiple de 5).
Cible au-dessus de la borne haute : application de Q21 (« valeur valide voisine dans le sens du geste, dans les bornes »), consignée en P38. Aucune valeur valide n'existe au-dessus de la borne, donc **+ est indisponible** depuis 5999 s ou depuis 150 répétitions ; **− ramène à la borne haute** : 3535 s, ou 100 répétitions.

---

### 4.10 Tableau des séries variables et Pied commun (ED-10)

**Description :** En `variables`, la Feuille présente le Tableau des séries variables : une ligne par Série, avec poignée, numéro, cellule de Cible, cellule de Pause et retrait. Les cellules n'ont pas de commandes permanentes : une seule Cellule active à la fois, désignée par une barre d'accent, un fond de colonne et sa mention dans le Pied commun. Toucher une cellule de Cible ouvre le Sélecteur de cible ; les − et + du Pied commun ajustent la valeur numérique de la Cellule active. Une cellule à renseigner prend le fond `#FFF1F0` (`color.dangerSurface`), sans contour (Q35), et rend le ✓ de la Feuille indisponible, sans message.

**Exigences fonctionnelles :**

#### FR-10-01 : Structure du tableau
L'utilisateur peut voir et régler, en `variables`, une Cible et une Pause pour chaque Série.

**Conséquences (testables) :**
- Le tableau est rattaché au champ de Régime ; chaque ligne, numérotée de 1 à N, comporte une poignée, un numéro, une cellule de Cible, une cellule de Pause et une commande de retrait. — *source : [13]:4076 ; [DSFCIR]:29 ; [06]:1125 ; [07]:374 (D-251) ; Q7 10.2*
- Le tableau est sélectionné quand Hermann l'ouvre (activation des séries variables, dépliage) ou agit dedans ; il cesse de l'être dès qu'un autre champ hors du tableau est sélectionné, ou quand il se replie ou se ferme ; il ne l'est pas à l'ouverture de la Feuille. Sélectionné, le groupe « Séries variables » (champ et tableau) prend le fond d'une ligne sélectionnée, sans contour ; sinon il est à l'état normal, sans fond ni contour (le cadre fixe X-3 du code de départ est retiré). — *source : Q40 (décision de Hermann du 2026-10-17, recette iPhone, écart E-14)*
- En-têtes de colonnes : `Durée` ou `Répétitions` selon le Mode, puis `Pause` ; deux colonnes même quand toutes les Cibles sont à l'échec ; aucune variante à une colonne. — *source : [DSF2M]:45 ; [13]:2995 ; [FIG] 8328:38632, 8328:38741, 8328:38848 ; Q7 10.1*
- Une cellule de Cible affiche sa valeur au format des durées (ex. `30 s`, `1 min`) en Durée, au format `12 rép.` en Répétitions, ou `à l’échec`. — *source : [08]:609-618 ; [DSF2M]:45 ; [FIG] 8328:38741, 8328:38848*
- La disposition est celle de la grille à cellules du DSF du 12/10 : les anciens retraits x52 des contrôles variables ne s'appliquent pas au tableau. — *source : P23 ; [13]:2997-2999*
- Le tableau ne défile pas indépendamment du corps de la Feuille. — *source : [DSFCIR]:39*

#### FR-10-02 : Une seule Cellule active, désignée trois fois

*Q44 (décision de Hermann du 2026-10-17) : l'exigence de Cellule active n'est pas réalisée. Les cellules de Cible et de Pause gardent leurs − et + permanents ; il n'y a ni Cellule active ni Pied commun. Toucher la valeur d'une cellule de Cible ouvre son Sélecteur (FR-10-03, Q41) ; les ± d'une cellule suivent `stepTarget` (AD-16) et sont indisponibles sur une Cible à l'échec.*

L'utilisateur peut rendre active une cellule de Cible ou de Pause en la touchant.

**Conséquences (testables) :**
- Les cellules n'ont pas de − et + permanents. — *source : [13]:2997 ; [DSFCIR]:5, 29 ; P11*
- Une seule Cellule active à la fois : toucher une autre cellule désactive la première et active la seconde d'un seul geste. — *source : [13]:3017, 4205-4207 ; [DSFCIR]:39 ; Q7 10.3*
- La Cellule active est désignée par une barre d'accent sur sa ligne, un fond coloré sur sa colonne et sa mention dans le Pied commun. — *source : [13]:4223, 3045*
- La mention suit le format `Série <i> · <champ>`, où champ vaut `Durée`, `Répétitions` ou `Pause` (ex. `Série 1 · Durée`). — *source : [13]:4223, 3045 ; [DSFCIR]:35 ; Q7 10.4*
- L'accessibilité identifie la Cellule active par sa ligne et sa colonne, pas seulement par la couleur, et annonce la mention du Pied. — *source : [13]:4223, 3045*

#### FR-10-03 : Régler une cellule de Cible par le Sélecteur

*Q44 (décision de Hermann du 2026-10-17) : les conséquences de cette exigence relatives à la Cellule active et au Pied commun (cellule restant active après le Sélecteur, ± du Pied, leur indisponibilité pendant que le Sélecteur est ouvert) sont sans objet. Le Sélecteur s'ouvre en touchant la valeur de la cellule de Cible ; ✓ n'applique qu'à cette ligne ; ✕ et l'appui extérieur ferment sans appliquer.*
L'utilisateur peut faire passer une cellule de Cible à l'échec, ou l'en faire revenir, en la touchant.

**Conséquences (testables) :**
- Toucher une cellule de Cible l'active et ouvre le Sélecteur de cible (variante du Mode), avec l'option échec en tête, ouvert sur la Cible de la cellule (sur la valeur valide la plus proche si elle est hors plage, Q36, sur la valeur minimale 00:05 ou 1 si elle est à renseigner, FR-07-04). — *source : Q13 ; FR-07-01 ; Q21 ; Q25*
- Valider le Sélecteur sur l'échec fait afficher `à l’échec` dans la cellule ; le valider sur un nombre y affiche ce nombre ; ✕ laisse la cellule inchangée. — *source : Q13 ; Q12*
- Seule la cellule touchée change ; les autres lignes ne sont pas modifiées. — *source : [MAT2M]:24 (E16)*
- Après le ✓ ou le ✕ du Sélecteur, la cellule reste la Cellule active : les − et + du Pied commun agissent ensuite sur elle (sur une Cible à renseigner, + donne la valeur minimale). Une fermeture du Sélecteur par appui extérieur ferme sans appliquer et range l'outil : plus aucune Cellule active (FR-10-04). Pendant que le Sélecteur est ouvert, les − et + du Pied sont indisponibles (FR-22-11). — *source : Q13 ; Q12 ; Q26 ; FR-10-04 ([13]:4217) ; revue ChatGPT R2 (transitions : architecture AD-15)*

#### FR-10-04 : Ajuster la Cellule active par le Pied commun

*Q44 (décision de Hermann du 2026-10-17) : l'exigence de Pied commun n'est pas réalisée. Les cellules de Cible et de Pause gardent leurs − et + permanents ; il n'y a ni Cellule active ni Pied commun. Toucher la valeur d'une cellule de Cible ouvre son Sélecteur (FR-10-03, Q41) ; les ± d'une cellule suivent `stepTarget` (AD-16) et sont indisponibles sur une Cible à l'échec.*

L'utilisateur peut ajuster la valeur numérique de la Cellule active avec les − et + du Pied commun.

**Conséquences (testables) :**
- Le Pied commun présente à gauche la mention de la Cellule active et à droite le groupe − / + ; les ± agissent uniquement sur la Cellule active. — *source : [DSFCIR]:34-36 ; [13]:2997 ; Q7 10.4*
- Pas et bornes selon la cellule : Cible Durée, appui 1 s et maintien accéléré (paliers 5 puis 10) dans 5 à 3535 s ; Cible Répétitions, pas de 1 dans 1 à 100 ; Pause, appui 1 s et maintien accéléré dans 0 à 300 s ; saturation aux bornes. — *source : Q15 ; [13]:4092-4094, 4098 ; Q36 (pas de 5 levé)*
- Sur une cellule de Cible à l'échec, les − et + sont indisponibles. — *source : Q13 ; [DSFCIR]:41*
- **Sans Cellule active** (ouverture du tableau avant tout toucher, ou après qu'un appui extérieur a rangé l'outil) : le Pied commun reste affiché, sans mention de cellule, et ses − et + sont indisponibles. Aucune cellule n'est active à l'ouverture de la Feuille ni au passage en `variables` (au repos, aucun champ n'est actif). Faute de Cellule active, la mention `Série <i> · <champ>` n'a rien à nommer et n'est pas affichée. — *source : Q26 ; FR-10-05 ([13]:4199-4207)*
- **Cellule active dont la Cible est à renseigner (`—`)** : + donne la valeur minimale (5 s en Durée, 1 en Répétitions) ; − est indisponible. Cellule de Pause : inchangé (une Pause n'est jamais à renseigner). — *source : Q26*
- Chaque appui sur − ou + est acquis dans le Brouillon de la Feuille ; aucun bouton Annuler n'est proposé ; ces appuis restent annulés par le ✕ de la Feuille. — *source : [13]:4209-4219 ; [B-v13]:145*
- Un appui extérieur range l'outil. S'il tombe sur une commande destructive (retrait d'une ligne), il ne la déclenche pas ; s'il tombe sur une cible inoffensive (autre valeur, chevron), il peut l'activer dans le même geste. — *source : [13]:4217 ; [08]:555 ; [DSFCIR]:39*

#### FR-10-05 : Valeurs numériques hors tableau
L'utilisateur peut régler N, la Pause commune, la Pause entre les côtés, le Bip, le Compte à rebours et la Fin selon le même modèle d'activation.

**Conséquences (testables) :**
- Au repos, une ligne montre seulement son libellé et sa valeur ; les − et + apparaissent à l'appui sur la valeur, à droite de celle-ci, qui recule d'une translation constante. — *source : [13]:4199-4203, 4085, 2989 ; [B-v13]:145*
- Un seul champ actif dans toute la Feuille, tableau compris. — *source : [13]:4205-4207, 4085*
- Pendant qu'un champ hors tableau est ouvert : toucher une autre valeur ferme le premier et ouvre le second d'un seul geste ; toucher une cellule du tableau ferme le champ et active la cellule d'un seul geste (FR-03-05) ; les − et + du champ ouvert ne le ferment pas, y compris le − de N qui retire les dernières lignes du tableau (FR-12-02) ; un appui extérieur le range. Pendant qu'un popover ou un Sélecteur est ouvert, en revanche, un appui extérieur le ferme seulement, sans activer le contrôle touché (FR-03-10, FR-22-11). — *source : [13]:4205-4211, 4217 ; FR-03-05 ; transitions : architecture AD-15 (T10, T20 à T23)*

#### FR-10-06 : Signaler une cellule à renseigner
L'Éditeur d'Exercice peut signaler une cellule à renseigner sans message.

**Conséquences (testables) :**
- Une cellule ou une ligne de Cible à renseigner (`—`), en Durée ou en Répétitions, en séries identiques ou variables, prend le fond `#FFF1F0` (jeton `color.dangerSurface`), sans contour ni liseré ; le ✓ de la Feuille est indisponible et l'indice VoiceOver « Valeur à renseigner » est inchangé. — *source : Q35 (décision de Hermann du 2026-10-17, remplace le contour orange `#FF8D28` de 1,5 de P4) ; [07]:548 (D-337) ; [13]:4100*
- Aucun message en ligne n'apparaît : ni « Renseignez la durée… », ni « Renseignez les répétitions », ni message nommant la Série. — *source : [07]:548 ; [13]:4100 ; P4*

#### FR-10-07 : Réordonner une ligne par glisser
L'utilisateur peut déplacer une ligne en la glissant par sa poignée, ou par une alternative accessible.

**Conséquences (testables) :**
- Glisser la poignée déplace la ligne entière ; le corps de la Feuille ne défile pas pendant le glisser. — *source : [07]:563 (D-345) ; [13]:4085, 3023*
- Un repère d'insertion, trait bleu Kodjo d'épaisseur 2, montre la position de dépôt entre deux lignes. — *source : [07]:563 (D-345) ; [DSFCIR]:30*
- Une alternative accessible au glisser permet le même déplacement. — *source : [13]:3023, 3047*
- Effets sur les données : FR-12-03.

#### FR-10-08 : Bip commun et ordre de la Feuille
L'utilisateur peut retrouver les lignes de la Feuille dans un ordre fixe, le Bip restant commun.

**Conséquences (testables) :**
- Le Bip est commun à l'Exercice : il est hors du tableau et aucune ligne ne porte de Bip propre. Exigence de référence pour le Bip commun dans la Feuille. — *source : [13]:4080, 2975, 2985 ; [B-v13]:139 ; P22*
- Position du `Bip de cadence` (premier niveau, juste avant la Durée totale applicable) et ordre complet de la Feuille : voir **FR-03-02** (exigence de référence). — *source : renvoi*

**Référence visuelle :** `8328:38632` (Durée, cellule active), `8328:38741` (Répétitions), `8328:38848` et `8470:13303` (Cibles à l'échec). Valeurs du DSF à 402 de large, visuel seulement : ligne `8129:31593` de 334 × 36 ; poignée à x0/y9, 12 × 18 ; numéro à x24/y10, 24 × 17, texte 14 ; cellules à x79/y6 et x175/y6, 76 × 24 ; zone de retrait à x294/y0, 36 × 36 ; icône `8129:31604` 24 × 24, trait 14 px ; Pied commun `8129:31601` 354 × 48, libellé à x12/y17 en texte 12, groupe ± à x254/y6, 88 × 36 ; groupe à x24, largeur 354, Bip à x36 ; aucune hauteur fixe ne rogne le texte ([DSFCIR]:29-37 ; [13]:2997-2999, 3005). Le texte de Phrase de `8328:38848`, qui énumère des Pauses variables, n'est pas à reproduire (P1).

**Notes :** Non repris : steppers permanents par cellule ([08]:1559-1561, P11) ; retraits x52 de [13]:4253 pour le tableau (P23) ; message en ligne de D-251 et [13]:3027 (P4). Non repris, faute d'hypothèse validée : Q7 10.5 (« modifier une Pause ne change aucune Cible »), déduction D cohérente avec FR-10-03 et FR-10-04 mais non énoncée.

---

### 4.11 Brouillons et changements de Mode (ED-11)

**Description :** La Feuille Paramètres d'exécution travaille sur un Brouillon, copie des paramètres de l'Éditeur. ✕ ou le retour système l'abandonnent entièrement ; ✓ l'applique d'un bloc à l'Éditeur, qui régénère la Phrase. Seul `Terminer` enregistre au Catalogue ; pour une Copie en Séance, `Terminer` écrit dans le Brouillon de Composition. Un changement de Mode conserve N, les Pauses, le Régime, le Bip, les réglages de côtés, le Compte à rebours, la Fin et les Cibles à l'échec, et remplace les Cibles numériques par `—` sans conversion ; la Réserve permet de retrouver les Cibles d'un Mode en y revenant avant ✓. La Réserve n'est jamais enregistrée.

**Exigences fonctionnelles :**

#### FR-11-01 : Travailler sur un Brouillon de Feuille
L'utilisateur peut modifier les Paramètres d'exécution dans la Feuille, puis les appliquer ou les abandonner d'un bloc.

**Conséquences (testables) :**
- ✕ ou le retour système abandonnent toute l'ouverture : changements de Mode, de Régime et de N, appuis −/+, choix validés dans le Sélecteur, déplacements et suppressions ; l'Éditeur est inchangé. Exigence de référence pour l'effet de ✕ et de ✓ de la Feuille (FR-03-03 y renvoie). — *source : [08]:251, 257 ; [13]:2967, 3033, 3037, 620 ; [07]:372 (D-249) ; Q7 11.6 ; PRE3-PERIM:90*
- ✓ applique d'un bloc l'état actif et valide à l'Éditeur, puis régénère la Phrase des paramètres ; il n'enregistre rien en base ; une bascule de Mode seule n'enregistre rien. — *source : [08]:251, 257 ; [13]:2967, 3033, 3037 ; Q7 03.4*
- Quelle écriture a lieu, et quand (`Terminer` au Catalogue, `Continuer` de Composition pour une Copie en Séance) : voir **FR-18-17** (exigence de référence). — *source : renvoi*
- Au retour dans l'Éditeur, la position et le contenu de l'Éditeur sont conservés, et la Phrase est régénérée. — *source : [13]:3037*

#### FR-11-02 : Réserve jamais enregistrée
L'Éditeur d'Exercice peut garder en Réserve des états mis de côté pendant l'ouverture de la Feuille, sans jamais les enregistrer.

**Conséquences (testables) :**
- Cibles de l'autre Mode, tableau variable masqué par le passage en `identiques`, lignes retirées par diminution de N ou suppression, état d'avant N = 1 : aucun n'est enregistré par Terminer. — *source : [08]:251 ; [13]:3033 ; [09]:446, 1142, 1149*
- Après ✓, la Réserve est vidée : rouvrir la Feuille ne permet plus de retrouver ces états. — *source : [08]:253, 255*

#### FR-11-03 : Changer de Mode sans conversion
L'utilisateur peut changer de Mode en conservant ce qui ne dépend pas de l'unité.

**Conséquences (testables) :**
- N, les Pauses, le Régime et le Bip sont conservés. — *source : [08]:259 ; [09]:1252 ; [13]:3019 ; Q7 11.3, 11.4*
- Sont aussi conservés au changement de Mode : le Changement de côté, l'Ordre des côtés, la Pause au changement de côté, le Compte à rebours et la Fin. Attendu : Durée, N = 3, Pauses 10 / 20 / 30 s, Bip 2 s, `Droite puis gauche`, `Les deux côtés à chaque série`, PC 5 s, Compte à rebours 10 s, Fin 5 s → passage en Répétitions : N = 3, Pauses 10 / 20 / 30 s, Bip 2 s, `Droite puis gauche`, `Les deux côtés à chaque série`, PC 5 s, Compte à rebours 10 s, Fin 5 s, seules les Cibles numériques passant à `—`. — *source : [ASSUMPTION: H26] ; Q7 11.5 ; `PERIM:29` (ED-11, « Bip conservé ») ; [08]:259*
- Chaque Cible numérique devient `—` (à renseigner), sans conversion entre secondes et répétitions (ex. 30 s → `—`, jamais 30 rép.). — *source : [08]:259 ; [09]:1252 ; [13]:3019 ; [B-v13]:38 ; Q7 11.2*
- Chaque Cible à l'échec reste à l'échec. — *source : [09]:1252 ; [13]:3015 ; [B-2M]:42 ; Q7 11.1*
- `—` n'est jamais traité comme 0 : le ✓ de la Feuille reste indisponible tant qu'une Cible active vaut `—`, et la cellule ou la ligne concernée est signalée par le fond `#FFF1F0` (`color.dangerSurface`), sans contour (Q35), sans message. — *source : [08]:259, 536 ; [13]:4100*
- En `variables`, un changement de Mode n'introduit aucune Cible implicite. — *source : [13]:4085*

#### FR-11-04 : Retrouver les Cibles d'un Mode en y revenant
L'utilisateur peut revenir au Mode précédent avant ✓ et retrouver ses dernières Cibles.

**Conséquences (testables) :**
- Durée (30 s, 45 s, à l'échec) → Répétitions (`—`, `—`, à l'échec) → Durée avant ✓ : 30 s, 45 s, à l'échec. — *source : [08]:259, 1808 ; [13]:3019 ; Q7 11.2*
- La Réserve suit l'identité de chaque ligne : revenir à un Mode restaure, pour chaque ligne encore présente, sa dernière Cible numérique de ce Mode ; une Cible à l'échec est conservée dans tous les Modes. — *source : H4 ; [08]:259*
- Pendant l'ouverture de la Feuille, les paramètres communs et les dernières valeurs propres à chaque Mode sont conservés. — *source : [08]:1808*

#### FR-11-05 : Valeurs initiales à la création
L'Éditeur d'Exercice peut présenter des Paramètres d'exécution initiaux sans valeur implicite.

**Conséquences (testables) :**
- À la création : Mode `—`, N = 1, Pause 0 s, Régime `identiques`, Bip `Aucun` (0), Changement de côté non renseigné (`—`), aucun tempo implicite. Exigence de référence pour les valeurs initiales (FR-03-04 y renvoie). — *source : [13]:4085, 2963 ; [09]:445 ; P19*
- Un Changement de côté laissé à `—` est enregistré comme `Sans changement` au ✓ de la Feuille. — *source : [13]:4085*
- Cible Durée initiale : `—`, aucune valeur implicite (la valeur 1 min de [08]:1558 n'est pas suivie). — *source : P19 ; [13]:4085*
- Cible Répétitions commune initiale : 1, uniquement pour une Cible Répétitions créée sans Cible préalable (Mode choisi directement en Répétitions). — *source : [13]:4085 ; P37*
- Passage de Durée à Répétitions en `identiques` avec une Cible Durée `—` : la Cible reste `—` (à renseigner), elle ne devient pas 1 ; le ✓ de la Feuille reste indisponible tant qu'elle n'est pas renseignée. — *source : P37 ; FR-11-03 ; P19*
- Le Bip à 0 est distinct d'une Cible à renseigner. — *source : [13]:2963*

#### FR-11-06 : Copies sans mutation partielle
L'utilisateur peut dupliquer ou copier un Exercice avec son Bip et ses Cibles typées.

**Conséquences (testables) :**
- Duplication, Copie en Séance et Instantané contiennent le Bip commun de l'Exercice et la Cible typée de chaque Série, sans état intermédiaire (exigences détaillées en ED-19). — *source : [13]:3033 ; [09]:1196 ; P27 ; P22*

**Notes :** [ASSUMPTION: H4 — Réserve par Mode suivant l'identité de chaque ligne, Cible à l'échec conservée dans tous les Modes.] [ASSUMPTION: H26 — au changement de Mode, N, les Pauses, le Bip, le Changement de côté, l'Ordre des côtés, la Pause au changement de côté, le Compte à rebours et la Fin sont conservés.] Q7 11.5 (« côtés, Compte à rebours et Fin conservés à la bascule »), déduction D, est désormais reprise via H26 (FR-11-03). Cible Durée `—` puis passage en Répétitions : tranché par P37 (la Cible reste `—`, FR-11-05).

---

### 4.12 Variations de N, suppression et réordonnancement (ED-12)

**Description :** En `variables`, augmenter N rétablit d'abord les lignes retirées, puis copie la dernière ligne ; diminuer N retire les dernières lignes et les garde en Réserve jusqu'au ✓. Le glisser déplace une ligne avec sa Cible et sa Pause, renumérote les lignes et donne la Pause terminale à la nouvelle dernière ligne. À N = 1, l'état effectif devient uniforme dès le Brouillon, et le Régime n'est plus modifiable. La croix d'une ligne la supprime immédiatement, avec un « Annuler » discret.

**Exigences fonctionnelles :**

#### FR-12-01 : Augmenter N
L'utilisateur peut augmenter N avec le + de la ligne `Séries`.

**Conséquences (testables) :**
- Les lignes retirées pendant l'ouverture de la Feuille sont rétablies d'abord, dans leur ordre relatif d'origine : 5 → 3 → 5 restitue la ligne 4 puis la ligne 5, jamais 5 puis 4. — *source : [08]:255 ; Q7 12c.3*
- Au-delà, chaque nouvelle ligne copie la Cible et la Pause de la dernière ligne active dans l'ordre courant ; une Cible à l'échec est copiée comme Cible à l'échec, sans nombre inventé. — *source : [08]:255, 488, 534 ; [13]:3017 ; [09]:1250 ; [B-2M]:40 ; Q7 12o.4*
- N ne dépasse pas 99. — *source : [13]:4091*

#### FR-12-02 : Diminuer N
L'utilisateur peut diminuer N avec le − de la ligne `Séries`.

**Conséquences (testables) :**
- Les dernières lignes de la liste active sont retirées ; leur Cible, leur Pause et leur ordre sont gardés en Réserve pour une restauration avant ✓. — *source : [08]:255 ; [07]:372 (D-249)*
- Après ✓, les lignes retirées ne sont plus conservées. — *source : [08]:255, 520*
- N ne descend pas sous 1. — *source : [13]:4091*

#### FR-12-03 : Effets d'un déplacement de ligne
L'utilisateur peut réordonner les lignes du tableau (geste : FR-10-07).

**Conséquences (testables) :**
- La Cible et la Pause de la ligne se déplacent ensemble ; le Bip étant commun, son « déplacement » n'a aucun effet observable. — *source : [08]:257 ; [13]:3023 ; P22 ; Q7 12o.1*
- Les lignes sont renumérotées de 1 à N dans le nouvel ordre ; la nouvelle dernière ligne porte la Pause terminale PN. — *source : [08]:257 ; [07]:372 ; Q7 12o.2*
- Les lignes déplacées gardent leur nouvel ordre quand des lignes retirées sont restaurées ; celles-ci sont réinsérées en fin, dans leur ordre conservé. — *source : [08]:257*
- Passer en `identiques` après un déplacement reprend la nouvelle première ligne. — *source : [08]:257*
- ✕ de la Feuille annule les déplacements. — *source : [08]:257*

#### FR-12-04 : N = 1
L'utilisateur peut ramener N à 1, puis le remonter avant ✓ sans perdre l'état précédent.

**Conséquences (testables) :**
- À N = 1, l'état effectif est uniforme sur la première ligne de l'ordre courant, et l'Ordre des côtés effectif est « Un côté après l’autre », **dès le Brouillon et ses calculs** (Phrase, Durée totale). — *source : [08]:261, 255 ; [07]:373 (D-250) ; Q7 12c.1, 12c.2*
- À N = 1, le champ de Régime n'est pas modifiable ; en bilatéral, la ligne `Ordre des côtés` est masquée à N = 1 (ni ligne, ni séparateur propre, ni sélecteur ; un sélecteur ouvert se ferme) ; l'Ordre choisi est conservé et réaffiché dès N ≥ 2 — source : Q38 ; aucun texte explicatif n'est affiché. Exigence de référence pour N = 1 (FR-03-08 y renvoie). Référence visuelle : [FIG] 8328:39072 (« Une seule série »). — *source : [08]:261 ; [13]:4075, 4078, 2985 ; P16 ; PRE3-PERIM:95 (§5) ; [FIG] 8328:39072 (visuel seulement)*
- Remonter N à 2 ou plus avant ✓ restaure l'état `variables`, ses lignes et l'ancien Ordre des côtés. — *source : [08]:261 ; [07]:373 ; Q7 12c.3*
- Valider à N = 1 n'enregistre qu'une Série uniforme et l'Ordre des côtés par défaut. — *source : [08]:261*

#### FR-12-05 : Supprimer une ligne par sa croix
L'utilisateur peut supprimer une ligne du tableau par sa commande de retrait, et annuler cette suppression.

**Conséquences (testables) :**
- La suppression est immédiate, sans confirmation ; la ligne part avec sa Pause, et les lignes suivantes sont renumérotées. — *source : [08]:551 ; [13]:4219 ; H5*
- Le message discret « Série supprimée — Annuler » s'affiche, selon la convention de notification existante, sans durée ni écran nouveaux. — *source : [08]:551 ; [B-v13]:149 ; [07]:599 (CIR-11)*
- `Annuler` restaure la ligne à sa position, avec sa Cible et sa Pause, jusqu'à la modification suivante du Brouillon de la Feuille ou la fermeture de la Feuille. — *source : [13]:4219, 3017 ; H5 confirmée par Q29 ; Q7 10.6, 12o.3*
- La croix est indisponible à N = 1 ; une suppression qui ramène N à 1 applique au ✓ la normalisation de FR-12-04. — *source : H5 confirmée par Q29 ; [08]:261*
- L'appui qui range un outil −/+ ouvert ne déclenche pas la croix (FR-10-04). — *source : [13]:4217*
- Les bornes de validité restent applicables (N ≥ 1). — *source : [08]:551*
- Invalident `Annuler` toutes les modifications du Brouillon de la Feuille : Cible, Pause, N, Mode, Régime, Bip, Pause commune, réordonnancement, autre retrait. Seules l'ouverture et la fermeture d'un popover ou du Sélecteur de cible, sans application, ne l'invalident pas. — *source : Q29*
- Toucher `Annuler` pendant qu'une Cellule est active ou qu'un champ ± est ouvert restaure la ligne sans ranger l'outil : la Cellule active le reste, sa ligne existant toujours. La restauration elle-même n'invalide rien ; activer une cellule sans la modifier n'est pas une modification du Brouillon. — *source : Q29 (seule une modification du Brouillon invalide `Annuler`) ; transitions : architecture AD-15 (T27)*

#### FR-12-06 : Affichage de N et recette des variations
L'utilisateur peut lire N au singulier ou au pluriel.

**Conséquences (testables) :**
- La valeur de la ligne `Séries` s'affiche `N séries`, ou `1 série` au singulier. Ce texte vient des captures, faute de source écrite : il est repris comme texte du lexique, comme l'invite de la Carte vide (H22), et validé par Hermann à la recette. — *source : [FIG] 8328:37760, 8328:38632 ; [ASSUMPTION: H22, par analogie — texte de capture repris au lexique, validé par Hermann]*
- Cas de recette obligatoires : N à 1 et à 99 ; réduction, augmentation et restauration ; réordonnancement de la dernière Série ; changement de la dernière ligne après déplacement (PN) ; copie et Instantané après ces opérations. — *source : [B-v13]:135 ; [13]:3061*

#### FR-12-07 : Compatibilité avec un N hérité d'un circuit de séries
PRE-4 ne produit aucun N hérité. Le modèle des Paramètres d'exécution et l'Éditeur d'Exercice ne doivent pas empêcher qu'une tranche Composition ultérieure en produise un. Exigence de référence pour la compatibilité (FR-01-09 y renvoie).

**Conséquences (testables) :**
- Test du modèle, sans parcours d'interface : des Paramètres d'exécution dont N est marqué hérité (la forme du marquage relève de l'architecture) sont acceptés, validés et relus sans erreur ; N, les Cibles, les Pauses et l'ordre des lignes sont relus inchangés ; aucune règle du modèle n'exige, pour accepter cet état, de modifier N, de supprimer une ligne ni de purger une Réserve. — *source : [08]:514-520, 553 ; [13]:4074, 3017, 2989 ; [DSFCIR]:45 ; questions-ouvertes §4*
- Hors héritage, le ✓ de la Feuille vide la Réserve (FR-11-02). — *source : [08]:520 ; FR-11-02*

**Rappel pour la tranche Composition, non exigé en recette PRE-4 :** sous N hérité, N est visible et non modifiable, la suppression locale d'une ligne est indisponible, les déplacements restent possibles, toute Durée totale affichable est en lecture seule, et la Réserve créée par le compteur du circuit appartient au Brouillon de Composition, si bien que valider la Feuille d'un Exercice ne la purge pas ([08]:514-520, 553 ; [13]:4074, 3017, 2989 ; [DSFCIR]:45 ; [B-v13]:149).

**Hors périmètre :** la création d'un circuit de séries, le compteur de circuit et la production d'un N hérité ; le comportement de l'Éditeur sous N hérité rappelé ci-dessus ; l'affichage d'une mention d'origine du N hérité, dont le placement n'est fixé par aucune référence visuelle ([DSFCIR]:47 ; `S/13…:2997`) ; tout libellé « Circuit » ou « Tour » dans l'Éditeur (Q4 ; questions-ouvertes §4). Même délimitation qu'en FR-01-09. FR-12-07 se vérifie par un test du modèle, sans parcours Composition nouveau.

**Référence visuelle :** `8328:38632`, `8328:38741`, `8328:38848` (tableau) ; `8328:39072` (une seule série, FR-12-04) ; aucune référence pour la mention d'origine ([DSFCIR]:47).

**Notes :** H5, confirmée et précisée par Hermann (Q29, 2026-10-16), n'est plus une hypothèse : la ligne part avec sa Pause ; Annuler la restaure jusqu'à la modification suivante du Brouillon de la Feuille ou la fermeture de la Feuille ; croix indisponible à N = 1 ; normalisation N = 1 au ✓. Non repris : l'« interrupteur » de D-250 ([07]:373), historique (P16).

---

### 4.13 Calcul de la Durée totale : exacte, estimée, partielle, omise (ED-13)

**Description :** La Durée totale d'un Exercice se calcule à partir de ses Paramètres d'exécution, Série par Série. Le travail d'une Série est connu (Cible numérique en Durée), estimable (Cible numérique en Répétitions avec un Bip) ou inconnu (Cible à l'échec, ou Répétitions sans Bip). Le résultat prend l'une de quatre natures : exacte (sans symbole), estimée (≈), partielle (≥) ou omise (aucun montant). La nature partielle est nouvelle au niveau de l'Exercice : elle s'applique à un mélange de Cibles numériques et de Cibles à l'échec dont une partie est calculable, et elle prime sur ≈. Le montant partiel additionne le travail connu ou estimable et toutes les Pauses prévues, sans jamais estimer le travail inconnu. Une Cible à renseigner n'est jamais un résultat de durée : c'est une erreur de saisie qui bloque la validation.

**Exigences fonctionnelles :**

#### FR-13-01 : Déterminer le travail de chaque Série

Le système peut déterminer, pour chaque Série, si son travail est connu, estimable ou inconnu, à partir du Mode, de la Cible et du Bip.

**Conséquences (testables) :**
- Mode Durée, Cible numérique d : Ti = d, travail connu — *source : C10 l. 603, 698*
- Mode Répétitions, Cible numérique Ri, Bip b > 0 : Ti = Ri × b, travail estimable — *source : C10 l. 603, 699*
- Cible à l'échec, en Durée comme en Répétitions, avec ou sans Bip : travail inconnu — *source : C10 l. 700 ; C08 l. 1046*
- Mode Répétitions, Bip 0 (Aucun) : travail inconnu, même avec une Cible numérique — *source : C10 l. 701, 660*
- Aucune estimation forfaitaire d'une répétition n'est utilisée : en Répétitions sans Bip, aucun montant de travail n'apparaît, quelle que soit la Cible (ni « 2 s par répétition », ni autre rythme) — *source : C10 l. 660 ; D-232 (C07 l. 312) ; Q7 15b.4*
- En Durée, le Bip ne change pas le total. Attendu : N = 4, Ti = 60 s, b = 4 s, Pause 15 s → 4 × (60 + 15) = **300 s**, exacte, affichée `5 min` — *source : C10 l. 632*

#### FR-13-02 : Qualifier la nature de la Durée totale de l'Exercice

Le système peut qualifier la Durée totale d'un Exercice comme exacte, estimée, partielle ou omise, selon le Mode, le Bip et les Cibles.

**Conséquences (testables) :**
- Durée, toutes les Cibles numériques, Bip 0 ou positif → exacte, montant affiché sans symbole — *source : C10 l. 645, 707*
- Répétitions, Bip > 0, toutes les Cibles numériques → estimée, affichée `≈ {montant}` — *source : C10 l. 647, 709*
- Durée, mélange de Cibles numériques et à l'échec → partielle, affichée `≥ {montant partiel}` — *source : C10 l. 649, 708*
- Répétitions, Bip > 0, mélange de Cibles numériques et à l'échec → partielle (≥), jamais estimée (≈) : ≥ prime sur ≈ — *source : C10 l. 613, 654, 710 ; C08 l. 655 ; Q7 13b.1*
- Répétitions, Bip 0, quelles que soient les Cibles (toutes numériques, mélange, toutes à l'échec) → omise — *source : C10 l. 646, 711 ; B-DM l. 18*
- Toutes les Cibles à l'échec, en Durée comme en Répétitions, Bip 0 ou positif, Pauses positives ou nulles → omise — *source : C10 l. 648, 712, 729 (R04) ; Q7 13f.1*
- Le montant d'une Pause change le montant affiché, jamais la nature — *source : C10 l. 654*
- La nature partielle (≥) est admise au niveau de l'Exercice ; les textes qui la réservaient à la Séance (Q-07, D-309, C09 l. 211) sont amendés. RM-072 (C10 l. 135, « omitted … À l’échec ») se lit comme portant sur le tout échec ; RM-129 et RM-132, plus spécifiques, régissent le mélange (≥) — *source : RM-129 (C10 l. 72), RM-132 (C10 l. 75) ; C07 l. 604 ; Δ9 de `sources-retenues.md` ; P25*
- L'annonce du ≥ ne le présente jamais comme une mesure : c'est un « total prévisionnel partiel », qui peut inclure du travail estimé (Répétitions cadencées) — *source : C10 l. 674, 716 ; C13 l. 3047*
- Une durée réellement réalisée reste affichée sans symbole prévisionnel ; un historique n'est jamais recalculé — *source : C10 l. 656, 611*

#### FR-13-03 : Calculer le total partiel d'un mélange

Le système peut calculer le montant partiel d'un Exercice à Cible mixte calculable comme la somme du travail connu ou estimable et de toutes les Pauses prévues.

**Conséquences (testables) :**
- Montant partiel = Σ Ti des Séries à travail connu ou estimable + Σ Pi de **toutes** les Séries, y compris la Pause qui suit une Série à l'échec et la Pause terminale ; le travail inconnu n'ajoute rien — *source : C10 l. 613, 662, 714 ; RM-129*
- **Attendu R01** — Durée, Régime variables, Cibles 30 s / 45 s / à l'échec, Pauses 10 s / 10 s / 10 s, unilatéral, Exercice seul : (30 + 45) + (10 + 10 + 10) = **105 s**, nature partielle, affiché **`≥ 1 min 45 s`**, Durée totale en lecture seule — *formule : Σ(Ti + Pi) sur le connu, C10 l. 607, 714 ; source : C10 l. 726 (R01) ; Q7 13d.1-13d.3*
- **Attendu R02** — Répétitions, Cibles 10 / 12 / à l'échec, Bip 2 s, Pauses 10 s / 10 s / 10 s : (10 × 2 + 12 × 2) + 30 = 44 + 30 = **74 s**, partielle (et non estimée), affiché **`≥ 1 min 14 s`** — *formule : Ti = Ri × b, C10 l. 699 ; source : C10 l. 727 (R02) ; Q7 13b.2*
- **Attendu R03** — même Exercice avec Bip 0 : aucune Durée totale (omise) ; les **30 s** de Pauses (3 × 10 s) restent des contributions connues pour la Séance (voir FR-15-03) — *source : C10 l. 728 (R03), 674, 718 ; Q7 13n.1, 13n.2*
- **Attendu R04** — trois Cibles à l'échec, Pauses 10 s / 10 s / 10 s, en Durée et en Répétitions, Bip 0 ou 2 s : aucune Durée totale ; **30 s** de Pauses conservées dans le plan et dans l'agrégat — *source : C10 l. 729 (R04) ; Q7 13f.2*
- **Attendu mixte Figma** — Durée, Cibles 30 s / 45 s / à l'échec, Pauses 10 s / 20 s / 30 s : 75 + 60 = **135 s**, affiché **`≥ 2 min 15 s`**, en lecture seule ; le montant est obtenu par la règle, pas copié de la capture — *source : DSF-DM l. 47 ; C13 l. 3055 ; RM-129 ; Q7 13m.1, 13m.2*
- **Attendu tout numérique (contrôle)** — Durée 30 s / 45 s / 60 s, Pauses 10 s × 3 : 135 + 30 = **165 s**, exacte, **`2 min 45 s`** ; Répétitions 10 / 12 / 15, Bip 2 s, Pauses 10 s × 3 : (37 × 2) + 30 = **104 s**, estimée, **`≈ 1 min 44 s`** — *formule : C10 l. 607, 645, 647 ; Q7 13a.1, 13a.2*

#### FR-13-04 : Appliquer les formules du total intrinsèque

Le système peut calculer le total intrinsèque d'un Exercice selon la bilatéralité, avec une Pause après chaque Série, dernière comprise.

**Conséquences (testables) :**
- Une Pause suit chaque Série, la dernière comprise, même à N = 1 et même avec une Pause au changement de côté — *source : RM-036 (C10 l. 64), C10 l. 662 ; D-248, D-314*
- Une Pause de 0 s ne crée aucune phase de pause — *source : C10 l. 662 ; C09 l. 688*
- Unilatéral : T = Σ(Ti + Pi) ; uniforme N × (d + p) ; succession S1 → P1 → … → SN → PN — *source : C10 l. 607, 666*
- Un côté après l'autre : T = 2Σ(Ti + Pi) + PC ; PN du premier côté puis PC se cumulent ; uniforme 2N × (d + p) + PC — *source : C10 l. 608, 667, 670*
- Les deux côtés à chaque série, N ≥ 2 : T = 2ΣTi + ΣPi + N × PC ; Pi suit la paire ; aucune PC au retour au premier côté ; uniforme N × (2d + p + PC) — *source : C10 l. 609, 668, 670*
- N = 1 bilatéral est normalisé en « Un côté après l’autre » : T = 2(d + p) + PC — *source : C10 l. 670 ; C08 l. 261 ; D-250*
- PC = 0 ne supprime ni ne remplace Pi ; aucune Pause ne se substitue à PC — *source : C10 l. 670 ; RM-037 (C10 l. 65)*
- Compte à rebours et Fin sont exclus du total intrinsèque — *source : C10 l. 611, 662 ; Q7 13a.3*
- En Régime variables, Cibles et Pauses viennent de chaque ligne dans l'ordre effectif ; après un déplacement, la nouvelle dernière ligne porte PN — *source : RM-037 ; C08 l. 257 ; C10 l. 672*
- **Attendus normatifs** (C10 l. 619-633), recalculés par les formules ci-dessus :

| Cas | Paramètres | Attendu |
|---|---|---|
| A | unilatéral, 30 s / 45 s / 60 s, Pauses 10 / 20 / 30 s | 135 + 60 = **195 s** = `3 min 15 s` |
| B | A suivi d'une Récupération de 120 s | 195 − 30 + 120 = **285 s** = `4 min 45 s` |
| C | A, un côté après l'autre, PC 15 s | 270 + 120 + 15 = **405 s** = `6 min 45 s` |
| D | A, les deux côtés à chaque série, PC 15 s | 270 + 60 + 45 = **375 s** = `6 min 15 s` |
| E | Répétitions 12 / 10 / 8, Bip 0, Pauses 30 / 45 / 60 s | omise ; **135 s** de Pauses connues dans le plan |
| F | toutes à l'échec, Bip 0 ou 4 s, Pauses 30 / 45 / 60 s | omise, même avec Bip |
| Uniforme | N 3, d 90 s, p 15 s | 270 + 45 = **315 s** = `5 min 15 s` |
| Bilatéral | N 3, d 90 s, p 15 s, PC 10 s | un côté après l'autre **640 s** ; les deux côtés à chaque série **615 s** |
| N 1 bilatéral | d 90 s, p 15 s, PC 10 s | **220 s** ; suivi d'une Récupération de 30 s → **235 s** |
| Douze séries | travail total 390 s, Pause 10 s | 390 + 120 = **510 s** = `8 min 30 s` |
| Répétitions avec Bip | N 4, Ri 15, b 4 s, p 15 s | 240 + 60 = **300 s**, `≈ 5 min` |
| Une Série | Ti 30 s, p 15 s | **45 s** |

#### FR-13-05 : Distinguer l'omission de l'erreur de saisie

Le système peut distinguer une Durée totale omise, qui n'affiche rien, d'une Cible à renseigner, qui est une erreur de saisie et bloque la validation.

**Conséquences (testables) :**
- Une Durée totale omise n'affiche ni ligne, ni montant, ni `0 s`, ni tiret — *source : C10 l. 654 ; C08 l. 647*
- Une Cible à l'échec explicitement choisie est valide sans nombre — *source : C10 l. 654*
- Une Cible à renseigner, vide ou invalide n'est jamais un résultat de durée, n'est jamais traitée comme omise, n'est jamais convertie en Cible à l'échec, et rend le ✓ de la Feuille indisponible — *source : C10 l. 613, 654, 718, 739 (R14) ; C13 l. 2979*
- En Répétitions sans Bip, la ligne de Durée totale reste absente même si une Cible est à renseigner ; l'erreur reste portée par la Cible — *source : C10 l. 654*
- Pendant qu'une Cible est à renseigner, en Durée ou en Répétitions avec Bip, aucune ligne de Durée totale ni aucun montant n'est affiché, et le ✓ de la Feuille est indisponible — *source : H10 ; C10 l. 613 (« aucune fausse valeur »)*
- Une Cible héritée à renseigner (donnée migrée, Définition ou Copie en Séance) : l'Exercice n'affiche aucun total ; dans l'agrégation de Séance ou de Circuit, le travail de la Série à renseigner est inconnu, le travail connu des autres Séries et les Pauses contribuent, comme pour un mélange avec échec (FR-13-03), et le total est partiel (≥) (FR-15-03, FR-15-04). Ce n'est pas une omission — *source : Q30 (remplace H30) ; H10, H28*

#### FR-13-06 : Tirer les calculs des seules spécifications

Le système peut produire tous les montants à partir des règles écrites, indépendamment des exemples Figma et Excel.

**Conséquences (testables) :**
- Aucun montant n'est repris d'une capture Figma ni d'une colonne Excel ; un exemple de capture est une donnée de démonstration — *source : RM-129 (C10 l. 72) ; C10 l. 635 ; D-300 ; DSF-DM l. 47*
- Les calculs sont vérifiés dans les deux directions et les deux Ordres des côtés, avec Pause 0 et PC 0, Récupération nulle et positive, N = 1 et N = 99, après bascules de Mode, après déplacement de la dernière ligne, sur une copie et sur un Instantané — *source : C10 l. 635*

**Hors périmètre :** les relevés d'exécution R05 à R13 de C10 l. 730-738 (Bip en exécution, répétitions déclarées, temps cumulé) relèvent du moteur d'exécution, hors PRE-4.

**Référence visuelle :** Figma `8470:13303` (cas mixte, `≥ 2 min 15 s` en lecture seule) — visuel seulement ; le montant vient de la règle (D-255).

**Notes :** [ASSUMPTION: H10 — pendant qu'une Cible est incomplète, aucune ligne de total ni montant, ✓ indisponible.] Les montants 105, 74 et 135 s figurent en toutes lettres dans des sources normatives hors section Q7 (C10 l. 726-727, DSF-DM l. 47, C13 l. 3055). *Note pour l'architecture (classe T de Q7, non contraignante) : 13d.4 et 13n.2 évoquent un registre de contributions indépendant ; seule la règle de calcul est exigée ici.*

---

### 4.14 Durée totale dans la Feuille et Inversion du total (ED-14)

**Description :** La Feuille Paramètres d'exécution montre une ligne Durée totale dont la forme dépend du Mode, du Régime et des Cibles. En Durée, Régime identiques, Cible numérique et N libre, la ligne est une roulette : choisir une Durée totale recalcule le nombre de Séries N (Inversion du total), avec un message d'ajustement si le total obtenu diffère du total choisi. Dès qu'une Cible est à l'échec, l'Inversion du total est indisponible : le total partiel s'affiche en lecture seule, et un total omis n'a pas de ligne. Le Régime variables et le Mode Répétitions restent en lecture seule, comme aujourd'hui. La roulette de Durée totale ne propose jamais d'option à l'échec.

**Exigences fonctionnelles :**

#### FR-14-01 : Afficher la ligne Durée totale de la Feuille selon le cas

L'utilisateur peut voir, dans la Feuille Paramètres d'exécution, une ligne Durée totale dont la forme suit le Mode, le Régime, le Bip et les Cibles du Brouillon de la Feuille.

**Conséquences (testables) :**
- Durée, Régime identiques, Cible numérique, N libre → ligne Durée totale modifiable par roulette — *source : C13 l. 4081 ; C10 l. 615*
- N hérité d'un circuit de séries (compatibilité seulement, FR-12-07), Régime variables (Cibles toutes numériques), ou Répétitions avec Bip et Cibles toutes numériques → ligne en lecture seule (≈ en Répétitions) — *source : C13 l. 4081 ; RM-131 (C10 l. 74) ; C10 l. 615*
- Mélange calculable → ligne en lecture seule, montant précédé de `≥`. Attendu : Cibles 30 s / 45 s / à l'échec, Pauses 10 / 20 / 30 s → `≥ 2 min 15 s` en lecture seule — *source : C13 l. 4081, 3055 ; DSF-DM l. 47 ; formule FR-13-03*
- Répétitions sans Bip, ou toutes les Cibles à l'échec → **aucune ligne Durée totale** dans la Feuille — *source : C13 l. 4081, 4253 ; P24*
- Régime identiques avec la Cible à l'échec → total omis, sans roulette ; un mélange n'existe qu'en Régime variables, déjà en lecture seule : aucune nouvelle composante d'interface n'est créée pour l'interdiction de l'Inversion du total — *source : DSF-DM l. 47 ; C13 l. 3055*
- La ligne Durée totale se recalcule à chaque modification du Brouillon de la Feuille (Cible, Pause, N, côtés, Bip, Mode) — *source : C13 l. 4081 ; C10 l. 613*

#### FR-14-02 : Restreindre l'Inversion du total

L'utilisateur peut choisir une Durée totale par roulette seulement en Mode Durée, Régime identiques, Cible numérique et N libre.

**Conséquences (testables) :**
- Inversion du total disponible uniquement en Durée, Régime identiques, Cible numérique, N non hérité d'un circuit de séries — *source : C10 l. 615 ; RM-130 (C10 l. 73)*
- Dès qu'une Cible est à l'échec (Régime identiques ou variables), aucune Inversion du total n'est disponible ; le total applicable est en lecture seule ; un total omis reste absent — *source : C10 l. 720 ; B-DM l. 102 ; Q7 14i.1-14i.3*
- Régime variables : aucune Inversion du total — *source : RM-130*
- Mode Répétitions : Durée totale non modifiable — *source : RM-131 ; C10 l. 615*
- N hérité d'un circuit de séries : total calculé en lecture seule, aucune Inversion du total, aucun ajustement implicite de la Cible, y compris avec des Cibles à l'échec. PRE-4 ne produisant pas de N hérité (FR-12-07, Composition hors périmètre), cette conséquence est une exigence de compatibilité du modèle, vérifiée seulement par un test du domaine — *source : C10 l. 615, 720 ; C13 l. 4081 (compatibilité seulement, voir §4 de `questions-ouvertes.md`) ; P42*

#### FR-14-03 : Calculer N à partir d'une Durée totale choisie

Le système peut déterminer, pour une Durée totale choisie Tv, le nombre de Séries N dont le total est le plus proche.

**Conséquences (testables) :**
- N ∈ 1..99. Candidats : unilatéral `arrondi(Tv / (d + p))` ; un côté après l'autre `arrondi((Tv − PC) / (2(d + p)))` ; les deux côtés à chaque série `arrondi(Tv / (2d + p + PC))` ; N = 1 est aussi évalué avec l'Ordre normalisé par côté ; le total réalisable le plus proche de Tv est retenu ; à égalité, le plus grand N — *source : C10 l. 615 ; RM-130 ; C13 l. 3098*
- Un N = 1 issu de l'Inversion du total est normalisé (Régime identiques, par côté si bilatéral) — *source : RM-130 ; C10 l. 615*
- Bornes de la roulette : de T(1) à T(99) pour les paramètres courants, et non 58 min 55 s ; granularité d'une seconde ; la colonne des minutes va jusqu'à T(99), sans colonne ni contrôle supplémentaire — *source : C10 l. 615 ; C13 l. 3098*
- **Attendu** — unilatéral, d = 30 s, p = 10 s : T(N) = 40 × N ; T(1) = `40 s`, T(99) = 3 960 s = `66 min` (format H8) — *formule : N × (d + p), C10 l. 607*
- **Attendu** — même Exercice, Tv = 160 s → N = 4, T(4) = 160 s, aucun message — *formule : arrondi(160 / 40) = 4*
- **Attendu** — même Exercice, Tv = 180 s → candidats N = 4 (160 s) et N = 5 (200 s) à égale distance de 20 s → N = 5 retenu, T(5) = 200 s = `3 min 20 s` — *formule : égalité vers le plus grand N, C10 l. 615*
- La roulette de Durée totale reste la variante numérique, distincte du Sélecteur de cible, **sans option à l'échec** ; ses autres règles sont inchangées — *source : DSF-DM l. 41 ; MAT-DM l. 41 ; C13 l. 4106, 2995 ; Q7 14i.5, 14u.3*

#### FR-14-04 : Signaler et annuler un ajustement

L'utilisateur peut voir qu'une Durée totale choisie a été ajustée à un nombre entier de Séries, et annuler cet ajustement.

**Conséquences (testables) :**
- Si T(N) ≠ Tv, message littéral : `Durée ajustée à {T(N)} pour respecter un nombre entier de séries.` ; sinon aucun message ; T(N) est réaffiché. Attendu avec l'exemple précédent : `Durée ajustée à 3 min 20 s pour respecter un nombre entier de séries.` — *source : C10 l. 615 ; RM-130*
- Le message porte `Annuler` ; `Annuler` restaure les valeurs antérieures à l'ajustement (N, Durée totale) ; toucher le reste du message le ferme sans annuler — *source : C10 l. 615*
- Présentation de `Annuler` : capsule sans contour, blanc transparent à 90 %, demi-cercles, marges droite, haut et bas égales (rendu, à valider sur appareil) — *source : C10 l. 615*

#### FR-14-05 : Annoncer la nature du total à l'accessibilité

L'utilisateur de VoiceOver peut entendre la nature de la Durée totale et son caractère non modifiable.

**Conséquences (testables) :**
- ≈ est annoncé « estimation » ; ≥ est annoncé « total prévisionnel partiel » — *source : C13 l. 3047 ; Q7 14u.1*
- Le caractère non modifiable d'une Durée totale en lecture seule est annoncé ; l'état n'est jamais transmis par le gris seul — *source : DSF-DM l. 53 ; C13 l. 3047*

**Hors périmètre :** l'implémentation de l'héritage de N par un circuit de séries (tranche Composition) ; seule la compatibilité est exigée.

**Référence visuelle :** roulette de Durée totale `5544:5118` (330 × 150, popover 354 × 216 ; présentée dans la couche `WheelPickerOverlay` depuis Q37, puis, depuis Q41, sur iOS dans un panneau sans flèche juste sous le champ Durée totale, aligné à droite, sans animation saccadée, FR-03-11) ; message d'ajustement `8328:38409` ; cas mixte en lecture seule `8470:13303` — visuel seulement (D-255).

**Notes :** Non repris de C13 l. 3098 : « la ligne Total reste présente dans la feuille en Durée/Répétitions » (texte du 01/10), remplacé par la règle du 13/10 (P24). [ASSUMPTION: H8 — au-delà de 59 min, les minutes continuent (`66 min`).]

---

### 4.15 Agrégation de Séance, Pauses et transport vers la Séance (ED-15)

**Description :** Les nouvelles Cibles (à l'échec, mixtes) doivent traverser sans perte la Copie en Séance et les consommateurs de Séance qui calculent ou affichent une durée : Composition, détail de Séance, cartes Catalogue. Ces adaptations restent minimales (Q4) : transport, persistance, calculs et affichage des nouvelles Cibles, sans refonte de Composition. Un Exercice dont la Durée totale est omise garde ses Pauses : elles contribuent au total partiel de la Séance ou du Circuit. Une Récupération positive qui suit l'Exercice remplace seulement sa Pause terminale. La Séance prend la nature la plus faible de ses contributions : ≥ dès qu'un travail est inconnu, sinon ≈ dès qu'une contribution est estimée, sinon exacte. Les cartes consommatrices affichent une durée partielle précédée de ≥ (Q17).

**Exigences fonctionnelles :**

#### FR-15-01 : Transporter le Mode et les Cibles typées dans la Copie en Séance

Le système peut transmettre à la Copie en Séance le Mode commun et la Cible typée de chaque Série, et les consommateurs de Séance peuvent les lire.

**Conséquences (testables) :**
- Une Copie en Séance conserve le Mode (Durée ou Répétitions) et, pour chaque Série, sa Cible numérique ou à l'échec ; validation, édition, copie et Instantané partagent la même représentation — *source : C11 l. 405, 362 ; C09 l. 1232 (DT15-01)*
- Les consommateurs de Séance (Composition, détail, calcul) acceptent Durée et Répétitions avec des Cibles mixtes, sans troisième Mode — *source : C11 l. 267 ; RM-033 (C10 l. 61) ; Q4 (DT15-02)*
- Rouvrir une Copie en Séance redonne les mêmes Cibles et recalcule le même montant — *source : C09 l. 1192, 1232 ; C13 l. 3031 ; Q7 15k.7*
- La nature de la Durée totale d'une Copie en Séance suit FR-13-02 à l'identique (même calcul que l'Éditeur d'Exercice) — *source : C10 l. 705-712 ; C11 l. 369 (DT15-03)*

#### FR-15-02 : Remplacer la seule Pause terminale par une Récupération positive

Le système peut calculer la durée d'une occurrence d'Exercice dans une Séance en remplaçant sa seule Pause terminale par la Récupération positive qui la suit.

**Conséquences (testables) :**
- To = T − PN + R si R > 0 ; sinon To = T. R n'est jamais ajoutée deux fois ; R = 0 ne crée aucune phase et ne supprime pas PN ; la Pause du premier côté reste intacte — *source : C10 l. 611, 672 ; RM-038 (C10 l. 66) ; D-314*
- Une phase de Pause existe après chaque Série dont la Pause est positive, dernière comprise, sauf substitution terminale par une Récupération positive — *source : C09 l. 688 (Δ5) ; DT15-06, DT15-07*
- Retirer la Récupération rétablit la dernière Pause configurée ; après un déplacement de Séries, la nouvelle dernière ligne est déterminée avant la substitution — *source : C10 l. 672 ; RM-038*
- Exercice exécuté seul : aucune Récupération contextuelle, PN reste exécutée — *source : C10 l. 672 ; C08 l. 1784*
- Aucune Récupération n'est créée automatiquement — *source : RM-038 ; C08 l. 245 ; D-307 ; Q7 15k.6*
- **Attendu** — Durée 30 s / 45 s / à l'échec, Pauses 10 s × 3, unilatéral, suivi d'une Récupération de 40 s : total intrinsèque partiel **105 s** ; occurrence 105 − 10 + 40 = **135 s**, partielle (`≥ 2 min 15 s`) — *formule : To = T − PN + R, C10 l. 611 ; Q7 15k.1, 15k.2 ; P31*

#### FR-15-03 : Faire contribuer les Pauses d'un Exercice omis ou partiel

Le système peut ajouter au total de la Séance ou du Circuit les Pauses et phases chronométrées d'un Exercice, même quand sa Durée totale propre est omise ou qu'une de ses Cibles est à renseigner (Q30).

**Conséquences (testables) :**
- Les Pauses prévues, PC et R d'un Exercice omis contribuent au total partiel de la Séance et du Circuit ; l'omission du total d'Exercice ne supprime ni ses phases, ni ses données, ni leur exécution — *source : C10 l. 611, 674, 678, 684, 716, 718 ; R04 C10 l. 729 (DT15-04)*
- Le travail inconnu n'ajoute aucun montant ; chaque phase chronométrée et chaque travail estimable sont comptés une seule fois — *source : C10 l. 674 ; B-BIP l. 48*
- **Attendu** — Répétitions 10 / 12 / à l'échec, Bip 0, Pauses 10 s × 3, unilatéral : contribution connue **30 s** à la Séance ; suivi d'une Récupération R > 0 : 10 + 10 + R — *formule : Σ Pi puis To = T − PN + R ; C10 l. 611, 674 ; Q7 13n.2*
- **Attendu** — trois Cibles à l'échec, Pauses 10 s × 3 : contribution **30 s**, la Séance est partielle (≥) — *source : C10 l. 729 ; Q7 13f.2*
- **Attendu bilatéral** — Durée, Régime variables, N = 2 par côté, Cibles 30 s / à l'échec, Ordre `Les deux côtés à chaque série`, Pauses 10 s / 10 s, PC 5 s : travail connu 2 × 30 = **60 s** (la Série à l'échec, sur les deux côtés, n'ajoute rien) ; total intrinsèque partiel par T = 2ΣTi + ΣPi + N × PC sur le connu = 2 × 30 + (10 + 10) + 2 × 5 = **90 s**, affiché `≥ 1 min 30 s` ; suivi d'une Récupération de 40 s, la Pause terminale est remplacée : To = T − PN + R = 90 − 10 + 40 = **120 s**, affiché `≥ 2 min` ; toutes les Pauses et PC réellement planifiées (succession D1 → PC → G1 → P1 → D2 → PC → G2 → P2) comptées une fois ; aucune estimation forfaitaire de répétition — *formule : C10 l. 609 (les deux côtés à chaque série), l. 611 (To) ; source : C08 l. 238 ; C10 l. 660, 668, 672, 674 ; Q7 15b.1-15b.4*
- Contrôle du même cas en « Un côté après l’autre », Pauses 10 s, PC 5 s : 2 × (30 + 10 + 10) + 5 = **105 s** intrinsèque partiel ; occurrence 105 − 10 + 40 = **135 s** (≥) — *formule : 2Σ(Ti + Pi) + PC, C10 l. 608 ; Q7 15b.1 (contrôle)*
- La cible typée s'applique aux deux côtés ; les formules bilatérales de FR-13-04 restent valables — *source : C09 l. 461, 1250 (DT15-08)*
- Copie en Séance dont une Cible héritée est à renseigner : le travail de la Série à renseigner est inconnu ; le travail connu des autres Séries et toutes les Pauses contribuent, comme pour un mélange avec échec (FR-13-03), sans que l'Exercice soit omis ni affiche un total (FR-13-05). **Attendu** — Durée 30 s / à renseigner / 45 s, Pauses 10 s × 3, unilatéral, sans Récupération : contribution connue Σ Ti connus + Σ Pi = (30 + 45) + (10 + 10 + 10) = **105 s** — *formule : FR-13-03 (C10 l. 613, 714) ; source : Q30 (remplace H30)*

#### FR-15-04 : Qualifier la nature du total de Séance et de Circuit

Le système peut qualifier le total d'une Séance ou d'un Circuit à partir des natures de ses contributions.

**Conséquences (testables) :**
- Séance : exacte si toutes les contributions sont exactes ; estimée (≈) si au moins une est estimée et aucun travail n'est inconnu ; partielle (≥) dès qu'un travail est inconnu — *source : C10 l. 613, 650-652 ; RM-072 (C10 l. 135), lu selon P25 (DT15-05) ; P25*
- Un Exercice partiel (≥, qui a un montant) rend la Séance partielle : dans les agrégats, ≥ prime sur ≈, qui prime sur exacte ; l'omission reste propre à l'Exercice concerné — *source : C10 l. 333, 613*
- Circuit : même règle ; Répétitions avec Bip 0 ou toute Cible à l'échec = travail inconnu ; le symbole est préfixé au montant, aucun en exacte — *source : C10 l. 684*
- Un Exercice placé dans un Circuit répété compte autant de fois que le Circuit est répété, sans multiplicateur double ; les Récupérations internes au Circuit s'exécutent à chaque répétition sans être ajoutées deux fois — *source : C10 l. 611, 672 ; RM-213 (C10 l. 263) ; C11 l. 418 ; C12 l. 1589 (DT15-09)*
- Une saisie invalide reste une erreur de validation, jamais une contribution omise — *source : C10 l. 654, 716 (DT15-10)*
- Une Copie en Séance persistée dont une Cible héritée est à renseigner rend la Séance et le Circuit partiels (≥) : le travail de cette Série est inconnu, son travail connu et ses Pauses sont comptés ; ce n'est pas une omission. **Attendu** — Exercice exact de 165 s et Copie de FR-15-03 (contribution connue 105 s) : 165 + 105 = **270 s**, partielle — *source : Q30 (remplace H30)*

#### FR-15-05 : Respecter le périmètre de chaque mesure de durée

Le système peut calculer séparément la Durée totale intrinsèque, la durée d'occurrence, la Durée synthétique des cartes et la Durée estimée d'exécution, chacune avec son périmètre.

**Conséquences (testables) :**
- Dans une Séance, le Compte à rebours et la Fin propres de l'Exercice ne sont ni exécutés ni comptés ; seuls le Compte à rebours initial et la Fin de séance appartiennent au plan de la Séance — *source : C10 l. 611, 676 ; D-214*
- Durée estimée d'exécution de la Séance : plan complet, Compte à rebours initial et Fin de séance compris — *source : RM-071 (C10 l. 134) ; C08 l. 362-376*
- Durée synthétique des cartes : exclut le Compte à rebours initial et la Fin de séance ; Catalogue = durée intrinsèque (Pause au changement de côté comprise) ; Composition = durées d'occurrence avec R, répétitions de Circuit développées sans ajouter R deux fois ; chaque carte garde son rendu actuel des durées exactes et estimées (P41 : carte Catalogue en minutes et secondes, `2 min 45 s` pour 165 s ; résumé de Composition et cartes de Séance par leur formateur actuel) ; sur les cartes Catalogue et Composition, une durée partielle s'écrit en minutes et secondes, sans arrondi (FR-15-06, Q20) ; la carte de Séance garde son formateur pour toutes les natures (P41) — *source : RM-159 (C10 l. 141) ; C08 l. 380-384 ; Q20 ; P41*
- **Attendu (P31)** — l'Exercice de FR-15-02 (occurrence ≥ 135 s), seul dans une Séance avec un Compte à rebours initial de 10 s et une Fin de séance de 5 s : Durée estimée d'exécution 135 + 10 + 5 = **150 s**, partielle. L'attendu porte sur le montant et la nature ; l'affichage de la Séance suit son formateur actuel (P41). Le montant 135 s est celui de l'occurrence, pas le total intrinsèque (105 s). Chaque carte affiche sa propre mesure — *formule : C10 l. 611, 652 ; source : P31 ; P41 ; C04 l. 188 ; Q7 15k.4*

#### FR-15-06 : Afficher la durée et le résumé des nouvelles Cibles sur les cartes consommatrices

L'utilisateur peut voir, sur les cartes Catalogue et Composition, la durée et le résumé d'un Exercice à Cible à l'échec ou mixte, issus du calcul commun.

**Conséquences (testables) :**
- Une durée partielle est précédée de `≥`, comme dans l'Éditeur d'Exercice ; un total omis n'affiche aucune ligne de durée — *source : Q17 ; C13 l. 202*
- Sur les cartes Catalogue et Composition, une durée partielle s'écrit en minutes et secondes, **sans arrondi** à la minute (format FR-17-01) (Q20). Les durées exactes et estimées gardent le rendu actuel de chaque carte (P41) : carte Catalogue en minutes et secondes, résumé de Composition par son formateur actuel ; aucun arrondi n'est introduit là où il n'existait pas. La carte de Séance garde son formateur pour toutes les natures. Attendus : total partiel de 105 s → `≥ 1 min 45 s` (et non `≥ 2 min`) ; total partiel de 135 s → `≥ 2 min 15 s` ; carte Catalogue, total exact de 165 s → `2 min 45 s`, inchangé ; total estimé de 104 s → `≈ 1 min 44 s`, inchangé — *source : Q20 ; P41 ; NFR-03*
- Résumé des Séries d'un Exercice mixte : la branche existante `{N} séries variables` ; Exercice tout à l'échec : `{N} séries à l’échec` ; jamais `0 s` ni `0 rép.`. Attendu : Durée 30 s / 45 s / à l'échec → `3 séries variables` — *source : [ASSUMPTION: H20] ; C08 l. 1814 ; Q17*
- Les six contrats de cartes (C13 l. 277, 378, 764, 850, 2167, 2259 : « ≥ seulement à la Séance ») sont lus comme amendés sur ce point — *source : Q17*
- Durée et symbole viennent du calcul commun, sans formule locale ni nombre Figma ; périmètre intrinsèque (Catalogue) ou d'occurrence (Composition) — *source : C13 l. 202*
- Le résumé des Séries n'affiche jamais `0 s` ni `0 rép.` pour une Cible à l'échec — *source : Q17*
- Un Exercice tout à l'échec garde la formulation de carte `{N} séries à l’échec` (par ex. `3 séries à l’échec`) ; les huit cartes du Catalogue et leurs filtres sont conservés dans cette passe (DSF-DM l. 49 : « Les huit cartes catalogue, ses filtres […] sont conservés ») — *source : C08 l. 1814 ; C13 l. 556 ; DSF-DM l. 49 ; P3 ; DT15-13*
- **Attendu** — carte Catalogue de l'Exercice Durée 30 s / 45 s / à l'échec, Pauses 10 s × 3 : durée partielle de 105 s, affichée `≥ 1 min 45 s` ; même Exercice en Répétitions Bip 0 : aucune ligne de durée — *source : Q17 ; Q20 ; formule FR-13-03*

#### FR-15-07 : Ne rien recalculer de l'historique

Le système peut appliquer les nouvelles règles sans réécrire les résultats passés.

**Conséquences (testables) :**
- La politique de Pauses s'applique aux Exercices existants, sans recalcul des résultats historiques ; un temps réalisé n'est jamais réécrit — *source : D-254 (C07 l. 377) ; C10 l. 611, 656*
- Bip v2 gouverne les calculs ; les formules de Pauses et de Récupération ne changent que par Ti — *source : RM-072 ; C10 l. 305*

**Hors périmètre :** refonte de Composition, nouveaux parcours, Volumes, placement complet des Récupérations et Points d'arrêt (Q4) ; synthèse des Exercices mixtes sur les cartes de Composition au-delà de la durée et de l'interdiction du zéro (relève de la grille Volumes) ; moteur d'exécution, progression et poids des phases (RM-077, RM-126) ; règle de passage des circuits de séries (C10 l. 686 : 75 s, 85 s, 225 s, 255 s), compatibilité seulement.

**Référence visuelle :** aucune frame propre ; cartes Catalogue existantes (C13 l. 556), visuel seulement.

**Notes :** Aucun libellé « Tour » ni « Circuit » n'est exposé par cette section ; la contradiction D-077 / D-209 ne la concerne pas (`questions-ouvertes.md` §4). Arrondi d'une durée partielle sur les cartes Catalogue et Composition : tranché par Q20 (aucun arrondi, FR-15-05, FR-15-06) ; rendu des totaux exacts et estimés : P41 (rendu actuel de chaque carte conservé). Point ouvert pour Hermann : le code de départ affiche `{N} séries jusqu’à l’échec` sur les cartes, et non `{N} séries à l’échec` (P3, H20) ; voir la liste des points ouverts des epics (C-E2-6). [ASSUMPTION: H20 — résumé d'un Exercice mixte sur une carte : branche existante `{N} séries variables` ; tout échec `{N} séries à l’échec`.]

---

### 4.16 Phrase des paramètres (ED-16)

**Description :** La Carte Paramètres d'exécution affiche une Phrase des paramètres, générée à chaque affichage et jamais enregistrée. Elle suit l'ordre : nombre de Séries, contenu, Pause, côtés, Durée totale ; valeurs et unités en gras. Le générateur examine les Cibles ordonnées : le Mode ne choisit plus une branche « À l’échec ». Jusqu'à trois Cibles mixtes, il les énumère dans l'ordre en écrivant « jusqu’à l’échec » à la place de la valeur ; au-delà, il compacte le mélange au minimum numérique. Un Exercice tout à l'échec garde son gabarit existant, sans clause de Bip. La Durée totale s'écrit après le point final, sans symbole, avec ≈ ou avec ≥, ou ne s'écrit pas.

**Exigences fonctionnelles :**

#### FR-16-01 : Générer la Phrase à l'affichage, sans la stocker

Le système peut générer la Phrase des paramètres à partir des seuls Paramètres d'exécution et du résultat de durée, à chaque affichage.

**Conséquences (testables) :**
- Mêmes Paramètres d'exécution et même résultat de durée → même Phrase, segments et gras compris ; aucune Phrase si aucune n'est applicable — *source : C09 l. 1168 ; C11 l. 457 ; D-316*
- Aucune Phrase ni aucun segment n'est enregistré dans une Définition d'Exercice, une Copie en Séance ou un Instantané ; la Phrase est régénérée à chaque affichage, notamment après le ✓ de la Feuille ; un ancien Exercice relu prend la grammaire courante — *source : C11 l. 461 ; C09 l. 1114, 1170 ; C08 l. 670 ; Q7 16d.3*
- La Phrase est découpée en segments `{texte, gras}` ; la concaténation des textes restitue la Phrase exacte ; deux valeurs identiques restent deux segments distincts ; le gras est décidé par le gabarit, jamais par recherche de sous-chaîne — *source : C11 l. 457 ; C09 l. 1168 ; C12 l. 1623*
- Brouillon incomplet : aucune Cible inventée dans la Phrase, ✓ indisponible ; Compte à rebours et Fin sont des lignes séparées, hors de la Phrase et du total — *source : C11 l. 463 ; DSF-PH l. 15*
- Le Mode est affiché à part et n'ouvre pas la Phrase ; seul le français est produit (MVP) — *source : C08 l. 622 ; D-317 ; C12 l. 1617*

#### FR-16-02 : Mettre en gras les valeurs et les unités

L'utilisateur peut distinguer dans la Phrase les valeurs et unités paramétrées, en gras, du texte grammatical.

**Conséquences (testables) :**
- Valeurs et unités en gras, texte grammatical normal. Attendu pour `3 séries de 30 s` : segments `3` (gras), ` séries de ` (normal), `30 s` (gras) — *source : C11 l. 457, 459 ; D-298 ; Q7 16o.2*
- Dans `4 séries variables, de 10 rép. à l’échec`, `10 rép.` est en gras ; `à l’échec` est normal. Dans `(30 s, 45 s puis jusqu’à l’échec)`, `jusqu’à l’échec` est normal — *source : H9*
- Le symbole `≥` ou `≈` suit le style du montant de la Durée totale — *source : H9*

#### FR-16-03 : Écrire les Cibles numériques selon les gabarits v15

Le système peut écrire le contenu d'un Exercice à Cibles toutes numériques selon les gabarits du ch. 08.

**Conséquences (testables) :**
- Ordre : nombre de Séries → contenu → Pause → côtés → Durée totale ; accords `série`/`séries`, `menée`/`menées` — *source : C08 l. 622 ; RM-152 (C10 l. 212)*
- Durée, Régime identiques : `{N} séries de {durée}` ; `1 série de {durée}` à N = 1. Attendu : `1 série de 1 min 30 s.` — *source : C08 l. 626 ; CORPUS id 1*
- Durée, Régime variables, 2 ou 3 Cibles : `{N} séries de durée variable ({d1}, {d2} puis {d3})` ; à 2 Cibles : `({d1} puis {d2})`. Attendu : `3 séries de durée variable (30 s, 45 s puis 1 min).` — *source : C08 l. 627 ; CORPUS id 58*
- Durée, Régime variables, plus de 3 Cibles : `{N} séries variables, de {min} à {max}`, min et max calculés sur les Cibles, pas sur la première et la dernière ligne. Attendu : `6 séries variables, de 30 s à 1 min 45 s` — *source : C08 l. 628, 639 ; CORPUS id 91*
- Répétitions, Régime identiques : `{N} séries de {R} répétitions`. Attendu : `3 séries de 12 répétitions, enchaînées sans pause.` — *source : C08 l. 629 ; CORPUS id 105*
- Répétitions, Régime variables, 3 Cibles ou moins : `{N} séries de {r1}, {r2} puis {r3} répétitions`. Attendu : `3 séries de 12, 10 puis 8 répétitions` — *source : C08 l. 630 ; CORPUS id 151*
- Répétitions, Régime variables, plus de 3 Cibles : `{N} séries variables, de {min} à {max} répétitions`. Attendu : `6 séries variables, de 6 à 15 répétitions` — *source : C08 l. 631 ; CORPUS id 180*
- N = 1 est normalisé en Régime identiques avant génération ; aucune ellipse après trois valeurs — *source : C08 l. 639*

#### FR-16-04 : Écrire la cadence du Bip

Le système peut ajouter la clause de cadence du Bip aux seules Cibles numériques en Répétitions.

**Conséquences (testables) :**
- Répétitions, Bip b > 0, Cibles toutes numériques : `cadencées toutes les {b}` accolé aux répétitions. Attendus : `3 séries de 12, 10 puis 8 répétitions cadencées toutes les 4 s.` ; `6 séries variables, de 6 à 15 répétitions cadencées toutes les 4 s.` — *source : C08 l. 632 ; CORPUS id 160, 180*
- En Durée, le Bip n'ajoute aucune clause. Attendu : Durée, N = 1, Bip 4 s → `1 série de 1 min 30 s.` — *source : C08 l. 641 ; CORPUS id 7*
- Tout à l'échec avec Bip : aucune clause de cadence, même en Mode Répétitions — *source : P26 ; C08 l. 632, 633, 641*
- Mélange en Répétitions, 3 Cibles ou moins, avec Bip : voir FR-16-08 (forme Q16, avec virgule)
- Mélange en Répétitions, plus de 3 Cibles, avec Bip : `, cadencées toutes les {b}` après la forme compactée. Attendu : 10 / 12 / 15 / à l'échec, Bip 2 s → `4 séries variables, de 10 rép. à l’échec, cadencées toutes les 2 s` — *source : [ASSUMPTION: H16] ; Q16 ; C08 l. 632*

#### FR-16-05 : Écrire la clause de Pause

Le système peut écrire la clause de Pause selon le Régime, N et la valeur de la Pause.

**Conséquences (testables) :**
- Régime identiques, Pause positive, N ≥ 1 : `, avec {pause} de pause après chaque série`. Attendu : `1 série de 1 min 30 s, avec 15 s de pause après chaque série. Durée totale : 1 min 45 s.` — *source : C08 l. 634 ; CORPUS id 4*
- Régime identiques, Pause nulle, N > 1 : `, enchaînées sans pause` — *source : C08 l. 635 ; CORPUS id 105, 201*
- Régime identiques, Pause nulle, N = 1 : aucune clause de Pause — *source : C08 l. 636*
- Régime variables, tous Modes, y compris tout à l'échec et Cibles mixtes : aucune clause de Pause et aucune énumération des Pauses — *source : C08 l. 637, 639, 653 ; D-338 ; P1 ; Q7 16o.3*
- Omettre les Pauses dans la Phrase ne les retire jamais du plan ni du calcul — *source : C08 l. 639*

#### FR-16-06 : Écrire la clause des côtés

Le système peut écrire la clause des côtés selon le Changement de côté, l'Ordre des côtés, le côté de départ et la Pause au changement de côté.

**Conséquences (testables) :**
- Sans changement de côté : aucune clause — *source : C08 l. 645*
- N = 1 bilatéral, départ droit : `, en faisant le côté droit puis le gauche`. Attendu : `1 série de 1 min 30 s, en faisant le côté droit puis le gauche. Durée totale : 3 min.` — *source : C08 l. 645 ; CORPUS id 2*
- N > 1, les deux côtés à chaque série, départ droit : `, en alternant le côté droit puis le gauche à chaque série` — *source : C08 l. 645 ; CORPUS id 20*
- N > 1, un côté après l'autre, départ droit : `, en faisant d’abord toutes les séries à droite, puis à gauche` — *source : C08 l. 645 ; CORPUS id 41*
- Départ gauche : directions inversées, soit `en faisant le côté gauche puis le droit`, `en alternant le côté gauche puis le droit à chaque série`, `en faisant d’abord toutes les séries à gauche, puis à droite` — *source : C08 l. 645 (« Inverser les directions »)*
- PC > 0 : ajouter `, avec {PC} de pause au changement de côté` ; PC = 0 : aucun suffixe. Attendu : `3 séries de 1 min 30 s, avec 15 s de pause après chaque série, en alternant le côté droit puis le gauche à chaque série, avec 5 s de pause au changement de côté. Durée totale : 10 min.` — *source : C08 l. 645 ; CORPUS id 20 ; total recalculé 3 × (180 + 15 + 5) = 600 s, formule C10 l. 609*

#### FR-16-07 : Conserver le gabarit tout à l'échec

Le système peut écrire un Exercice dont toutes les Cibles sont à l'échec avec le gabarit existant, dans les deux Modes.

**Conséquences (testables) :**
- `1 série menée jusqu’à l’échec` ; `{N} séries menées jusqu’à l’échec` (jamais `{N} séries jusqu’à l’échec`) — *source : C08 l. 633 ; CORPUS ; P3 ; Q7 16f.1 (X, résolu par P3)*
- Les clauses de Pause (Régime identiques) et de côtés existantes sont conservées. Attendus : `3 séries menées jusqu’à l’échec, enchaînées sans pause, en faisant d’abord toutes les séries à droite, puis à gauche, avec 5 s de pause au changement de côté.` (CORPUS id 201) ; Régime identiques, Pause 10 s : `3 séries menées jusqu’à l’échec, avec 10 s de pause après chaque série.` — *source : C08 l. 633-637, 653 ; Q7 16f.2*
- Régime variables, Pauses variables : `3 séries menées jusqu’à l’échec`, aucune clause de Pause, aucune Durée totale — *source : C08 l. 662 ; P1*
- Aucune Durée totale, aucun Bip écrit, en Durée comme en Répétitions, Bip 0 ou 4 s — *source : C08 l. 647 ; P26 ; Q7 16f.3*
- Le même Exercice tout à l'échec produit la même Phrase en Mode Durée et en Mode Répétitions — *source : C08 l. 653 (« le mode ne sélectionne plus une branche »)*

#### FR-16-08 : Énumérer un mélange de 3 Cibles ou moins

Le système peut énumérer, dans l'ordre, un mélange de 2 ou 3 Cibles en écrivant « jusqu’à l’échec » à la place de chaque Cible à l'échec.

**Conséquences (testables) :**
- Durée, 3 Cibles : `{N} séries de durée variable ({c1}, {c2} puis {c3})`. Attendus : `3 séries de durée variable (30 s, 45 s puis jusqu’à l’échec)` ; échec en tête : `3 séries de durée variable (jusqu’à l’échec, 30 s puis 45 s)` ; échec au milieu : `3 séries de durée variable (30 s, jusqu’à l’échec puis 45 s)` — *source : C08 l. 653, 659 ; Q7 16o.1, 16o.4*
- Durée, 2 Cibles : `2 séries de durée variable (30 s puis jusqu’à l’échec)` — *source : C08 l. 627, 653*
- Répétitions, 3 Cibles ou moins : gabarit à parenthèse `{N} séries de répétitions variables ({c1}, {c2} puis {c3})`, quelle que soit la position de l'échec. Attendus : échec en fin `3 séries de répétitions variables (10, 12 puis jusqu’à l’échec)` ; échec en tête `3 séries de répétitions variables (jusqu’à l’échec, 10 puis 12)` ; **échec au milieu** `3 séries de répétitions variables (10, jusqu’à l’échec puis 12)` ; 2 Cibles `2 séries de répétitions variables (10 puis jusqu’à l’échec)` — *source : Q16 (« la forme vaut quelle que soit la position de l’échec ») ; Q7 16o.4*
- Répétitions avec Bip : `, cadencées toutes les {b}` après la parenthèse. Attendus : `3 séries de répétitions variables (10, 12 puis jusqu’à l’échec), cadencées toutes les 2 s` ; échec au milieu : `3 séries de répétitions variables (10, jusqu’à l’échec puis 12), cadencées toutes les 2 s` — *source : Q16 ; Q7 16o.4*
- **Attendu de Phrase complète** — Durée 30 s / 45 s / à l'échec, Pauses 10 s × 3, unilatéral : `3 séries de durée variable (30 s, 45 s puis jusqu’à l’échec). Durée totale : ≥ 1 min 45 s.` — *source : C08 l. 647, 653 ; formule FR-13-03 (R01)*
- **Attendu de Phrase complète** — Répétitions 10 / 12 / à l'échec, Bip 2 s, Pauses 10 s × 3 : `3 séries de répétitions variables (10, 12 puis jusqu’à l’échec), cadencées toutes les 2 s. Durée totale : ≥ 1 min 14 s.` ; même Exercice Bip 0 : `3 séries de répétitions variables (10, 12 puis jusqu’à l’échec).` — *source : Q16 ; C08 l. 655 ; formule FR-13-03 (R02, R03)*
- Ces formes avec parenthèse ne s'appliquent qu'aux mélanges : un Régime variables tout numérique en Répétitions garde `3 séries de 12, 10 puis 8 répétitions` — *source : C08 l. 630 ; Q16 (« Phrase d'un mélange »)*

#### FR-16-09 : Compacter un mélange de plus de 3 Cibles

Le système peut compacter un mélange de plus de 3 Cibles au minimum des Cibles numériques.

**Conséquences (testables) :**
- Répétitions : `{N} séries variables, de {minimum numérique} rép. à l’échec` ; Durée : `{N} séries variables, de {minimum numérique formaté} à l’échec` — *source : C08 l. 653 ; RM-232 (C10 l. 278) ; Q7 16c.1*
- Le minimum est celui des Cibles numériques, pas la première valeur. Attendus : 10 / 12 / à l'échec / 20 → `4 séries variables, de 10 rép. à l’échec` (min(10, 12, 20) = 10) ; 90 s / 120 s / à l'échec / 150 s → `4 séries variables, de 1 min 30 s à l’échec` (min = 90 s, format FR-17-01) — *source : C08 l. 639, 653, 661 ; Q7 16c.2-16c.4*
- **Attendu** — Durée 30 s / 45 s / 60 s / à l'échec, Pauses 10 s × 4 : `4 séries variables, de 30 s à l’échec. Durée totale : ≥ 2 min 55 s.` — *formule : 135 + 40 = 175 s, FR-13-03 ; source : C08 l. 660*
- **Attendu** — Répétitions 10 / 12 / 15 / à l'échec, Bip 0 : fragment `4 séries variables, de 10 rép. à l’échec`, aucune Durée totale ; avec Bip 2 s et Pauses 10 s × 4 : Durée totale `≥ 1 min 54 s` ((10 + 12 + 15) × 2 + 40 = 114 s) — *source : C08 l. 661 ; formule FR-13-03*
- La compaction est rédactionnelle : elle ne suggère pas une performance supérieure au maximum numérique — *source : B-DM l. 153*
- Plus de 3 Cibles toutes numériques et toutes égales (min = max) : le gabarit actuel du générateur est conservé, sans nouvelle forme ; le cas figure en recette — *source : [ASSUMPTION: H17] ; C12 l. 1621*

#### FR-16-10 : Écrire la Durée totale dans la Phrase

Le système peut ajouter la Durée totale après le point final de la Phrase selon sa nature, ou l'omettre.

**Conséquences (testables) :**
- Exacte : `Durée totale : {total}.` sans symbole ; estimée : `Durée totale : ≈ {total}.`. Attendu : `… Durée totale : ≈ 1 min 41 s.` (CORPUS id 101) — *source : C08 l. 647*
- Partielle : gabarit `Durée totale : ≥ {total}.`, le montant précédé de `≥`, prioritaire sur `≈`. Attendus : `Durée totale : ≥ 1 min 45 s.` ; `Durée totale : ≥ 2 min 15 s.` — *source : C08 l. 647, 655 ; RM-232 ; C10 l. 726 (forme `≥ 1 min 45 s`) ; [ASSUMPTION: H18] (gabarit littéral)*
- Omise (Répétitions sans Bip, tout à l'échec) : aucune clause `Durée totale`, ni zéro ni tiret — *source : C08 l. 647, 655 ; C13 l. 3172 ; Q7 16f.4*
- Redondance : la Durée totale n'est omise que pour une Série unique en Durée, sans Changement de côté **et** sans Pause. Attendus : `1 série de 1 min 30 s.` (Pause 0, CORPUS id 1) ; `1 série de 1 min 30 s, avec 15 s de pause après chaque série. Durée totale : 1 min 45 s.` (CORPUS id 4) ; bilatéral : `… Durée totale : 3 min.` (CORPUS id 2). Cette exception ne masque pas la durée de la carte Catalogue — *source : C08 l. 647, 1790 ; C10 l. 656 ; C13 l. 3098*
- La Récupération de Séance ne modifie pas la Phrase : celle-ci décrit l'Exercice, avec son total intrinsèque — *source : C08 l. 649 ; B-PH1 l. 9*

#### FR-16-11 : Afficher la Phrase en entier

L'utilisateur peut lire la Phrase complète dans la Carte Paramètres d'exécution, à toutes les largeurs et en texte agrandi.

**Conséquences (testables) :**
- Zone de la carte touchable d'un seul tenant, segments non interactifs ; nom accessible unique « Modifier les paramètres d’exécution » — *source : C13 l. 4265*
- Inter 13 Regular, interligne 20, valeurs Semi Bold ; hauteur intrinsèque, aucun plafond de caractères, aucune troncature à 360, 402 et 440 pt, ni en texte agrandi, **partout où la Phrase des paramètres est affichée** : dans le périmètre PRE-4, la Carte Paramètres d'exécution de l'Éditeur d'Exercice — *source : C13 l. 4265, 586 ; DSF-PH l. 7, 9 ; D-322 ; Q7 16d.1, 16d.2*
- Les cartes consommatrices existantes (Catalogue, Composition) n'affichent pas la Phrase : elles affichent leur résumé et leur durée (FR-15-06), aucune phrase longue n'y étant injectée (C13 l. 1012). Si une carte existante affiche la Phrase, la règle d'intégralité ci-dessus s'y applique à l'identique ; PRE-4 n'ajoute la Phrase à aucune carte — *source : C13 l. 1012 ; Q7 16d.1 (« éditeur et cartes existantes ») ; Q4*
- Aucune virgule seule en début de ligne ; segments dans un même flux de texte, sans espace ajoutée avant la ponctuation ; le retour à la ligne avant « Durée totale » est une propriété de rendu, pas du texte — *source : C13 l. 4269*
- Compte à rebours et Fin restent sur leurs lignes et ne sont jamais rognés par une Phrase longue — *source : C13 l. 4267*

**Hors périmètre :** énumération des Pauses variables (évolution ultérieure, D-338, P1) ; formats For time, Tabata et EMOM (C08 l. 672-676) ; gabarits dans une autre langue (D-317).

**Référence visuelle :** carte Paramètres `8328:37022` ; cas mixte `8470:13303` ; Phrase longue `7119:27855` ; `8328:38848` pour le rendu seulement — son texte de fond, qui énumère les Pauses variables, n'est **pas** reproduit (P1 ; Q7 F.6). Visuel seulement (D-255).

**Notes :** [ASSUMPTION: H9 — « rép. » en gras comme unité ; « jusqu’à l’échec » et « à l’échec » sans gras ; ≥ et ≈ au style du montant. À vérifier sur Figma 8470:13303.] [ASSUMPTION: H10 — aucun total pendant une Cible incomplète.] [ASSUMPTION: H8 — minutes au-delà de 59.] [ASSUMPTION: H16 — clause de Bip après la forme compactée d'un mélange en Répétitions de plus de 3 Cibles, par extension de Q16.] [ASSUMPTION: H17 — min = max sur plus de 3 Cibles numériques : gabarit actuel conservé.] [ASSUMPTION: H18 — gabarit littéral `Durée totale : ≥ {total}.`, par analogie avec `≈`.]

---

### 4.17 Format des durées, Corpus 276 et variantes (ED-17)

**Description :** Toutes les durées de la Phrase et des totaux suivent un format unique en secondes et minutes. Le Corpus 276 reste l'oracle de non-régression des formulations : ses 276 phrases sont conservées à l'identique, le montant de chaque total étant remplacé par le total calculé selon les règles. Les 92 anciennes entrées « À l’échec » se lisent désormais comme un Mode Répétitions dont toutes les Cibles sont à l'échec, avec le même texte. Le corpus ne couvre pas les cas nouveaux : des variantes s'y ajoutent (mélanges, positions de l'échec, N = 2, départ gauche…).

**Exigences fonctionnelles :**

#### FR-17-01 : Formater une durée

Le système peut écrire une durée de x secondes selon un format unique.

**Conséquences (testables) :**
- x = 0 → `0 s` ; x < 60 → `{x} s` (15 → `15 s`) ; x multiple de 60 → `{x/60} min` (60 → `1 min`, jamais `60 s`) ; sinon `{minutes} min {secondes} s` (90 → `1 min 30 s`, 1 265 → `21 min 5 s`) — *source : C08 l. 609-618 ; vérifié sur 520 durées du Corpus 276, 0 écart (extraction §6)*
- Au-delà de 59 min, les minutes continuent sans heures : 3 665 → `61 min 5 s` ; 4 500 → `75 min` — *source : H8*
- `0 s` n'apparaît jamais dans la Phrase : une Pause nulle s'écrit `enchaînées sans pause` ou s'omet, une PC nulle omet le suffixe — *source : C08 l. 635, 636, 645 ; extraction §6*

#### FR-17-02 : Conserver les 276 phrases de référence

Le système peut reproduire exactement les 276 phrases du Corpus 276, chaque montant de total étant remplacé par le total calculé.

**Conséquences (testables) :**
- Les 276 textes sont reproduits sans altération, ponctuation comprise ; le montant d'exemple de chaque total est remplacé par le total métier calculé avant comparaison — *source : C12 l. 1621 ; B-PH1 l. 68 ; Q7 17.1*
- Le montant du corpus est un exemple, jamais un oracle de calcul ; les tests de durée sont indépendants d'Excel (colonne J, feuille « Calcul des durées ») — *source : D-315 ; D-321 ; B-PH1 l. 11 ; C10 l. 635 ; Q7 17.5*
- Répartition à conserver : 140 phrases sans total, 46 estimées (≈), 90 exactes, aucune partielle ; 184 cas Durée et Répétitions numériques inchangés en texte et en nature — *source : B-PH1 l. 11 ; CORPUS README l. 5 ; extraction §7.1, §7.2*
- Aucune clause n'est ajoutée aux 120 cas en Régime variables (aucune Pause énumérée) — *source : C12 l. 1621 ; C08 l. 637*
- Le fichier Excel source n'est pas modifié ; les 276 sorties ne sont pas présentées comme une recette exhaustive du nouveau modèle — *source : C08 l. 655, 670*
- Deux fichiers portent le corpus, aux 276 phrases identiques (vérifié le 2026-10-16) : `docs/archives/evolutions-v15-2026-10-07/phrases-276.json` est l'oracle source ; `docs/preparation/PRE-3/planification/attendus-phrases-276.json` en est l'encodage de test. Aucun des deux n'est modifié ; un test vérifie leur identité — *source : P43*

#### FR-17-03 : Relire les anciennes entrées « À l’échec »

Le système peut produire, pour les 92 entrées du corpus en ancien Mode « À l’échec », le même texte une fois ces entrées lues comme Mode Répétitions avec toutes les Cibles à l'échec.

**Conséquences (testables) :**
- Entrée relue : Mode Répétitions, toutes les Cibles à l'échec ; N, Pause, Bip, côtés, Ordre des côtés et PC conservés — *source : C09 l. 607, 1256 ; B-DM l. 163 ; C10 l. 740 (R15)*
- Sortie identique au corpus. Attendus : `3 séries menées jusqu’à l’échec, en faisant d’abord toutes les séries à droite, puis à gauche, avec 5 s de pause au changement de côté.` (CORPUS id 251, Bip 4 s) ; `6 séries menées jusqu’à l’échec, en faisant d’abord toutes les séries à droite, puis à gauche, avec 5 s de pause au changement de côté.` (CORPUS id 276) — *source : C09 l. 1256 ; C08 l. 653*
- Les 46 entrées avec Bip 4 s restent sans clause de cadence et sans Durée totale — *source : P26 ; R13-11 (C10 l. 712)*

#### FR-17-04 : Compléter le corpus par les variantes des cas nouveaux

Le système peut produire les Phrases attendues des cas absents du corpus, vérifiées indépendamment du générateur.

**Conséquences (testables) :**
- Mélange en Durée, 2 Cibles et 3 Cibles avec l'échec en position 1, 2 et 3, Durée totale ≥ (FR-16-08) — *source : C08 l. 664 ; C10 l. 741 (R16) ; Q7 16o.4, 17.3*
- Mélange en Durée, plus de 3 Cibles, compaction et ≥ (FR-16-09) — *source : C08 l. 660*
- Mélange en Répétitions, 3 Cibles ou moins (forme Q16) avec l'échec en position 1, 2 (`3 séries de répétitions variables (10, jusqu’à l’échec puis 12)`, et sa variante avec Bip `…, cadencées toutes les 2 s`) et 3, et plus de 3 Cibles ; Bip 0 (aucun total) et Bip positif (≥) (FR-16-08) — *source : C08 l. 661 ; Q16 ; Q7 16o.4, 17.3*
- Tout à l'échec en Durée et en Répétitions, Régime identiques et variables, Bip 0 et 4 s, avec et sans Pause : texte identique au corpus (FR-16-07) — *source : C08 l. 653 ; P26*
- N = 1 normalisé, N = 2, N > 6 ; Pause 0 et positive ; N = 1 avec et sans Pause ; PC 0 et positive ; Bip 0 et positif dans les deux Modes — *source : C12 l. 1621 ; B-PH1 l. 68 ; B-DM l. 159*
- Départ gauche, dans les deux Ordres et à N = 1 (FR-16-06) — *source : C12 l. 1621 ; C08 l. 645*
- Redondance : Durée, N = 1, unilatéral, Pause 0 (total omis) contre Pause positive (total affiché) ; Durée, N = 1, bilatéral (total affiché) (FR-16-10) — *source : C08 l. 647*
- Segments et gras : deux valeurs identiques à des positions différentes ; segments `jusqu’à l’échec` et `à l’échec` (FR-16-02) — *source : C12 l. 1623 ; H9*
- Relecture d'un ancien Exercice ; absence de toute Phrase enregistrée ; accès au clavier et au lecteur d'écran ; aucune troncature à 360, 402 et 440 pt — *source : C12 l. 1621-1623 ; B-PH1 l. 68-70*
- Totaux de 1 h ou plus (FR-17-01) — *source : H8*

#### FR-17-05 : Afficher la Phrase la plus longue

L'utilisateur peut lire en entier la Phrase la plus longue du corpus dans la Carte Paramètres d'exécution.

**Conséquences (testables) :**
- Le cas 144 (224 caractères, maximum du corpus) s'affiche en entier : `6 séries de 12 répétitions cadencées toutes les 4 s, avec 15 s de pause après chaque série, en faisant d’abord toutes les séries à droite, puis à gauche, avec 5 s de pause au changement de côté. Durée totale : ≈ 12 min 41 s.` ; aucune hauteur ni nombre de caractères maximal — *source : C13 l. 4267 ; DSF-PH l. 9 ; D-322 ; total recalculé 2 × 6 × (48 + 15) + 5 = 761 s, formule C10 l. 608*

**Hors périmètre :** la stratégie de test (matrice Mode × Bip × Régime × Cible × N × côtés × Pauses, forme des données de test) relève de l'architecture.

**Référence visuelle :** Phrase longue `7119:27855` (largeur 324 px, cinq lignes de 20 px à 402 pt), mesures constatées et non hauteurs fixes (C13 l. 4267) — visuel seulement (D-255).

**Notes :** [ASSUMPTION: H8 — format des durées d'une heure ou plus.] [ASSUMPTION: H9 — gras des segments nouveaux.] *Note pour l'architecture (classe T de Q7, non contraignante) : 17.2 (adaptation des données de test des anciennes entrées) et 17.6 (matrice de test).* L'assertion D 17.4 de Q7 n'est pas reprise comme telle : son contenu (N = 1 normalisé, chaque Ordre, Pauses nulles ou variables) est déjà exigé par C12 l. 1621.

---

### 4.18 Persistance et migration (ED-18)

**Description :** Un Exercice enregistré, qu'il soit Définition d'Exercice ou Copie en Séance, conserve exactement ses Paramètres d'exécution : Mode, Régime, N, pour chaque Série sa Cible typée (numérique ou à l'échec) et sa Pause, dans leur ordre, et le Bip, valeur unique commune à l'Exercice. Les données antérieures à PRE-4 sont préservées. L'Ancien mode À l'échec devient le Mode Répétitions avec toutes les Cibles à l'échec, sans rien perdre ni rien inventer. Seules les données utilisables sont migrées : un Exercice dont les paramètres sont illisibles est écarté, sans lien orphelin ni suppression d'une Séance entière, et le nombre d'Exercices écartés est signalé (Q19). Une erreur structurelle de migration, elle, annule tout et ne change rien. Une Cible à renseigner, nulle ou invalide n'est jamais enregistrée, et n'est jamais convertie en Cible à l'échec. Rien n'est écrit tant que l'utilisateur n'a pas validé l'enregistrement.

**Exigences fonctionnelles :**

#### FR-18-01 : Deux Modes seulement dans les données
Le système enregistre et relit le Mode d'un Exercice avec deux valeurs seulement : Durée ou Répétitions. Aucun troisième Mode n'est enregistré pour une donnée créée, modifiée ou migrée. L'Ancien mode À l'échec n'est accepté qu'en lecture, comme format historique à migrer.
**Conséquences (testables) :**
- Après toute création ou modification d'une Définition d'Exercice ou d'une Copie en Séance, le Mode relu vaut Durée ou Répétitions. — *source : `ch09:607` ; `ch10:61` (RM-033) ; `ch12:1359` ; `ch09:1238` ; R18-01 ; 18m.1*
- Une tentative d'enregistrer l'Ancien mode À l'échec comme Mode d'une donnée nouvelle est refusée, sans écriture. — *source : `ch11:267` ; `ch11:405` ; R18-32*
- Après migration, aucune Définition d'Exercice ni aucune Copie en Séance ne porte l'Ancien mode À l'échec. — *source : `ch09:1256` ; `ch09:1258` ; R18-20 ; R18-23*

#### FR-18-02 : Cible typée enregistrée de façon explicite
Le système enregistre, pour chaque Série effective, une Cible de l'un des deux types enregistrables : numérique (secondes en Durée, nombre de répétitions en Répétitions) ou à l'échec (sans valeur). Le type est porté explicitement : ni la valeur 0, ni un texte placé dans une valeur numérique, ni la seule absence de valeur ne suffisent à le distinguer.
**Conséquences (testables) :**
- Une Cible à l'échec enregistrée puis relue est une Cible à l'échec, sans valeur numérique associée. — *source : `ch09:1240-1243` ; `ch04:344` ; R18-02*
- Une Cible numérique enregistrée puis relue garde sa valeur exacte et son type numérique. — *source : `ch09:1240-1243` ; R18-02*
- Une même Série ne peut pas être relue à la fois avec une valeur numérique et le type à l'échec ; une donnée qui porterait les deux est refusée à l'écriture. — *source : `ch09:1196` ; `ch09:1140` ; R18-05*
- La valeur 0 n'est jamais enregistrée comme Cible, ni comme représentation de l'échec. Le `00:00` du Sélecteur de cible n'atteint jamais les données. — *source : `ch09:1196` ; `DSF-2M:37` ; R18-06*
- Une Cible à l'échec explicitement choisie est valide sans nombre et n'empêche pas l'enregistrement. — *source : `ch10:654` ; R18-14*
- La lecture « Cible absente » de `ch09:446` porte sur la valeur numérique ; le type reste explicite. — *source : `ch09:446` ; `ch09:1246` ; R18-04 ; C-02*

#### FR-18-03 : Cible à renseigner refusée de façon atomique
Le système refuse d'enregistrer un Exercice dont une Série porte une Cible à renseigner, nulle ou invalide. Le refus est atomique : aucune Série, aucun paramètre, aucun lien n'est écrit. La Cible fautive n'est jamais convertie en Cible à l'échec, ni à la saisie, ni à l'enregistrement, ni à la migration.
**Conséquences (testables) :**
- Une demande d'enregistrement contenant une Cible à renseigner laisse la base strictement identique à son état précédent : aucune ligne, aucune Série, aucun lien Catégorie, Zone ou Média ajouté ou modifié. — *source : `ch13:3041` ; `ch09:1232` ; 18d.2 ; R18-13*
- Une Cible à renseigner n'est jamais relue comme Cible à l'échec après un enregistrement refusé ou réussi. — *source : `ch09:1244` ; `ch10:739` (R14) ; `ch10:654` ; R18-03*
- Les paramètres et la collection des Séries sont écrits ensemble ou pas du tout : aucune Série n'est écrite partiellement. — *source : `ch09:1232` ; `ch09:1156` ; `ch11:72` (API-ACT-01) ; R18-13*

#### FR-18-04 : Régime et collection ordonnée enregistrés explicitement
Le système enregistre le Régime (identiques ou variables) indépendamment du Mode et des valeurs. En Régime variables, la collection ordonnée des N Séries (Cible, Pause) est la seule source effective des Cibles et des Pauses, sans valeur commune enregistrée au-dessus. Le Bip, lui, est une valeur unique de l'Exercice.
**Conséquences (testables) :**
- **Invariant du Bip.** Le Bip est une valeur unique, commune à toutes les Séries de l'Exercice. Si la représentation enregistrée le porte Série par Série, toutes les Séries portent la même valeur ; un Exercice relu n'a jamais deux Séries de Bips différents. — *source : glossaire §3 (« Bip ») ; FR-10-08 ; P22 ; `ch13:2975` ; D-273 ; PRE3-PERIM:79 (« commun à toutes les Séries »)*
- Un Exercice en Régime variables dont toutes les Cibles sont égales est relu en Régime variables ; un Exercice en Régime identiques est relu en Régime identiques. — *source : `ch09:1248` ; `ch09:445` ; R18-07*
- En Régime identiques, toutes les Séries relues ont la même Cible, à l'échec comprise. — *source : `ch09:1248` ; `ch09:1140` ; R18-07*
- En Régime variables, une Cible mixte (numériques et à l'échec) est relue avec ses types et dans son ordre exact. — *source : `ch09:1248` ; `ch09:1140` ; R18-07*
- Aucune Cible ni Pause commune enregistrée ne vient modifier la collection d'un Exercice en Régime variables. — *source : `ch09:446` ; `ch09:1230` ; `ch07:370` (D-247) ; `ch09:1150` ; R18-08*

#### FR-18-05 : Aucun Brouillon ni aucune valeur dérivée enregistrés
Le système n'enregistre ni le contenu de la Réserve, ni les Cibles mémorisées pour l'autre Mode, ni les lignes retirées, ni une valeur temporaire de restauration. Il n'enregistre comme vérité ni la Phrase des paramètres, ni ses segments, ni la Durée totale, que ce soit dans une Définition d'Exercice, une Copie en Séance ou un Instantané.
**Conséquences (testables) :**
- Après enregistrement puis réouverture, la Réserve de la Feuille est vide : un changement de Mode fait avant l'enregistrement ne restaure aucune Cible de l'autre Mode. — *source : `ch09:446` ; `ch09:1142` ; `ch11:362` ; `ch09:1149` ; R18-09*
- La Phrase des paramètres et la Durée totale affichées après réouverture sont recalculées depuis les Paramètres d'exécution relus, et non lues depuis une valeur enregistrée. — *source : `ch09:607` ; `ch09:448` ; `ch11:461` ; `ch09:1170` ; R18-10*
**Notes :** les mesures affichées (Durée totale intrinsèque, durée d'occurrence) sont celles définies au ch. 10 (P31) ; elles ne sont jamais enregistrées.

#### FR-18-06 : Bip enregistré et relu sans correction silencieuse
Le système enregistre le Bip dans les deux Modes, avec une valeur entière de 0 (Aucun) à 10 s. Une donnée ancienne sans Bip est relue avec un Bip à 0. Une valeur −1, 11 ou fractionnaire **nouvellement saisie ou modifiée** est refusée à l'écriture, sans correction silencieuse ; une valeur ancienne hors bornes non modifiée est réenregistrée telle quelle (H25).
**Conséquences (testables) :**
- Un Bip de 0 à 10 enregistré en Durée ou en Répétitions est relu identique. — *source : `ch09:1148` ; `ch09:1156` ; R18-11*
- Une donnée antérieure sans Bip est relue avec le Bip Aucun (0). — *source : `ch09:1156` ; `ch11:371` ; R18-11 ; C-06*
- Une demande d'enregistrement dont le Bip est **nouveau ou modifié** et vaut −1, 11 ou une fraction est refusée sans écriture et sans valeur corrigée. — *source : `ch09:1270` ; `ch13:3027` ; R18-11 ; P32 ; [ASSUMPTION: H25]*
- Un Exercice ancien dont le Bip vaut 11 et n'a pas été modifié est enregistré avec son Bip relu 11 (ex. seul le nom est changé avant `Terminer`) ; aucune correction silencieuse vers 10. — *source : [ASSUMPTION: H25] ; H7 ; `ch09:1270`*
**Notes :** le Bip est commun à l'Exercice, sans surcharge par Série observable (P22 ; invariant en FR-18-04). Sa forme enregistrée relève de l'architecture.

#### FR-18-07 : Valeurs historiques relues sans arrondi
Le système relit une valeur historique telle qu'elle a été enregistrée, même hors des bornes actuelles (Durée de 5 à 3535 s, à la seconde — source : Q36 ; Répétitions de 1 à 100). Les données sans les nouveaux attributs sont relues en Régime identiques et avec l'ordre de côtés « un côté après l’autre », leur quantité de travail, leurs Cibles, leurs Pauses et leur direction étant conservées.
**Conséquences (testables) :**
- Une Cible Durée historique de 7 s ou de 5999 s est relue à 7 s ou 5999 s, sans arrondi ni bornage. — *source : `DSF-2M:37` ; `ch07:610` ; `ch09:1270` ; R18-12 ; Q15*
- Une valeur historique hors grille ou hors bornes non modifiée est réenregistrée telle quelle par un enregistrement de l'Exercice (ex. Cible de 5999 s, seul le nom changé, `Terminer` → relue 5999 s) ; seule une valeur modifiée doit respecter la grille et les bornes, selon le tableau unique de FR-09-05 (ancienne 150 inchangée → tolérée ; nouvelle 100 → valide ; nouvelle 101 ou 120 → refusée). — *source : [ASSUMPTION: H25] ; H7 ; Q15*
- Une donnée antérieure sans Régime ni ordre de côtés explicite est relue en Régime identiques et en « un côté après l’autre », avec N, Cibles, Pauses et direction inchangés. — *source : `ch09:1142` ; `ch09:1226` ; `ch12:1505` ; R18-31*
**Notes :** la modification d'une valeur historique hors bornes impose une valeur dans les bornes (Q15, ED-09 ; à la seconde depuis Q36) ; ce comportement d'édition est rédigé avec ED-09.

#### FR-18-08 : Aller-retour exact d'une Définition d'Exercice
Le système relit une Définition d'Exercice exactement telle qu'elle a été enregistrée : Mode, Régime, N, type et valeur de chaque Cible, Pauses, Bip, Changement de côté, Ordre des côtés, Pause au changement de côté, Compte à rebours, Fin, nom, description, Catégorie, Zones corporelles et Médias, dans leur ordre.
**Conséquences (testables) :**
- Pour chaque combinaison de Mode (Durée, Répétitions) et de Régime (identiques, variables), avec des Cibles toutes numériques, toutes à l'échec et mixtes à différentes positions, l'Exercice relu après réouverture sur une base SQLite réelle est égal à l'Exercice enregistré, types et ordre compris. — *source : `ch09:1230` ; `PERIM:36` ; 18d.1*
- L'ordre des Cibles d'une Cible mixte est relu inchangé (par exemple numérique, numérique, à l'échec reste dans cet ordre). — *source : `ch09:1248` ; `ch09:1230` ; 18d.1*

#### FR-18-09 : Aller-retour exact d'une Copie en Séance
Le système relit une Copie en Séance exactement telle qu'elle a été enregistrée au Continuer de Composition : mêmes éléments que FR-18-08, plus la Récupération qui la suit. Un échec d'enregistrement de la Séance ne laisse aucun lien orphelin.
**Conséquences (testables) :**
- Après enregistrement de la Séance et réouverture, les Paramètres d'exécution (Cibles typées et ordre compris) et la Récupération de chaque Copie en Séance sont exacts. — *source : `ch09:1230` (« R reste dans l'occurrence ») ; 18s.1*
- La Catégorie, les Zones corporelles et les Médias ordonnés de la Copie en Séance sont conservés. — *source : `ch09:907` ; 18s.2*
- Un échec provoqué pendant l'enregistrement d'une Séance laisse la base dans son état précédent, sans lien Zone, Catégorie ou Média orphelin. — *source : `ch09:1232` ; `ch13:628` ; 18s.3*

#### FR-18-10 : Migration de l'Ancien mode À l'échec
Le système migre chaque Exercice enregistré dans l'Ancien mode À l'échec en un Exercice en Mode Répétitions dont toutes les Séries ont une Cible à l'échec. Après migration, le comportement observable de cet Exercice est inchangé.
**Conséquences (testables) :**
- Un Exercice antérieur en Ancien mode À l'échec avec N Séries est relu en Répétitions, avec N Cibles à l'échec. — *source : `ch09:1256` ; `ch09:607` ; `ch09:1198` ; `ch10:740` (R15) ; `ch11:267` ; `ch12:1359` ; `MAT-2M:15` (E07) ; `PERIM:36` ; R18-20 ; 18m.2*
- Après migration, la Durée totale de cet Exercice est omise, chaque Série se termine par Suivant, et sa Phrase des paramètres reste « N séries menées jusqu’à l’échec » (carte : « N séries à l’échec »). — *source : `ch09:1256` ; `ch09:1122` ; `ch10:712` ; R18-22 ; P3 ; P26*
- Un ancien Exercice en Régime variables dans l'Ancien mode À l'échec, s'il en existe, garde son Régime et sa collection, chaque ligne recevant une Cible à l'échec. — *source : `ch09:1248` ; R18-07 ; M-03*

#### FR-18-11 : Conservation de tous les paramètres par la migration
Le système conserve, lors de la migration, tous les paramètres de l'Exercice autres que l'Ancien mode : N, Pauses, Bip, Changement de côté, Ordre des côtés, Pause au changement de côté, Régime, collection ordonnée, direction, Compte à rebours, Fin, nom, description, Catégorie, Zones corporelles et Médias ordonnés.
**Conséquences (testables) :**
- Pour un Exercice migré, chacun des paramètres énumérés est identique avant et après migration. — *source : `ch09:1256` ; `ch09:1230` ; `ch09:410-450` ; R18-21 ; 18m.3*
- Les liens vers la Catégorie, les Zones corporelles et les Médias, leur nombre et leur ordre sont identiques avant et après migration, pour les Exercices migrés comme pour les autres. — *source : `ch09:1260` ; `ch09:498` ; `ch10:68` (RM-040) ; 18m.7*
- Un Exercice antérieur sans Bip enregistré est migré avec le Bip Aucun (0). — *source : `ch09:1156` ; C-06*
- Les Exercices en Durée ou en Répétitions sont relus après migration avec des paramètres identiques à ceux d'avant migration. — *source : `ch12:1505` ; R18-31*
**Notes :** la liste explicite combine `ch09:1256` (« et autres paramètres ») et le modèle persistant de `ch09:1230` (C-06).

#### FR-18-12 : Définitions et Copies migrées, identités stables
Le système applique la migration aux Définitions d'Exercice et aux Copies en Séance. Les identifiants des Exercices restent les mêmes. Aucune Copie en Séance n'est promue en Définition d'Exercice, et aucune référence de Catalogue n'est créée.
**Conséquences (testables) :**
- Une Copie en Séance en Ancien mode À l'échec est migrée selon FR-18-10 et FR-18-11, comme une Définition d'Exercice. — *source : `ch09:1258` ; `ch12:1597` ; R18-23 ; 18m.6 ; P28*
- L'ensemble des identifiants des Définitions d'Exercice et des Copies en Séance migrées, des Catégories, des Zones corporelles et des Médias est identique avant et après migration ; le nombre d'Exercices au Catalogue ne change pas, hors les Définitions d'Exercice écartées selon FR-18-20. — *source : `ch09:429` ; `ch04:112` ; `ch12:1359` ; R18-24 ; `PERIM:36` (« tous paramètres conservés ») ; [ASSUMPTION: H21] ; Q19*
- La migration n'ajoute aucune Séance, aucune Copie en Séance ni aucune Définition d'Exercice, et ne supprime aucune Séance. Elle ne supprime une Définition d'Exercice ou une Copie en Séance que si ses paramètres sont illisibles (FR-18-20). — *source : `ch09:1256` ; `ch12:1505` ; Q19 (amende ce point)*
**Notes :** la stabilité des identifiants n'est écrite nulle part explicitement ; elle est cohérente avec `ch09:429` et la règle de non-promotion (C-09, assertion 18m.4 de classe D), et reprise par [ASSUMPTION: H21]. La phrase « aucune reprise des anciennes séances » (`ch11:435`, `ch12:1565`) relève du lot Pauses et ne dispense pas de migrer les Copies (P28, C-04).

#### FR-18-13 : Aucune valeur factice
Le système n'invente aucune valeur pendant la migration : aucune Cible numérique pour une Série à l'échec, aucun relevé reconstitué, aucun zéro à la place d'un relevé absent.
**Conséquences (testables) :**
- Aucune Série migrée ne porte de valeur numérique de Cible. — *source : `ch09:607` (« sans inventer ») ; `ch09:1246` ; 18m.5*
- Aucun nombre de répétitions n'est calculé à partir d'une durée globale, et un relevé absent n'est pas remplacé par 0. — *source : `ch09:607` ; `ch09:1196` ; `ch09:1198` ; `ch09:1260` ; `ch10:734` (R09) ; R18-25*

#### FR-18-14 : Donnée ancienne invalide jamais convertie en échec
Le système ne convertit jamais en Cible à l'échec une donnée ancienne invalide (par exemple Répétitions sans nombre, Durée hors 5 à 3535 s, Bip hors 0 à 10). Hors la conversion de l'Ancien mode À l'échec, la migration conserve cette donnée telle quelle ; elle est affichée telle quelle, et la modifier impose une valeur valide.
**Conséquences (testables) :**
- Une donnée ancienne en Répétitions sans nombre, ou en Durée sans valeur, n'est jamais relue avec une Cible à l'échec après migration. — *source : `ch09:1244` ; `PERIM:36` ; R18-28*
- Une Durée ancienne de 5999 s ou de 3 s est relue à cette valeur après migration, sans conversion ni bornage. — *source : `ch09:1270` ; `ch13:4106` ; R18-12 ; H7*
- Une valeur numérique ancienne **positive** hors grille ou hors bornes (Cible de 7 s, 5999 s ou 150 répétitions, Bip 11, Pause 400 s) est lisible et conservée telle quelle, qu'elle soit portée par un JSON v1 ou par les colonnes scalaires ; elle ne rend pas l'Exercice illisible (FR-18-20), sauf le cas de valeur non représentable de P45 (projection d'une Copie en Séance hors de la contrainte de sa table). Seule une Cible absente, `null` ou 0 devient à renseigner. — *source : Q15 ; Q21 ; H7 ; H25 ; P45 ; Q28*
- Un enregistrement après modification de cette donnée n'est accepté qu'avec une valeur valide (FR-18-03). — *source : `ch09:1270` ; H7*
- Un enregistrement **sans modification** de cette donnée la réenregistre telle quelle : une Durée de 5999 s, 150 répétitions ou un Bip de 11 non modifiés n'empêchent ni le ✓ de la Feuille ni `Terminer`. Une Cible absente (Répétitions sans nombre, Durée sans valeur) s'affiche à renseigner et bloque le ✓ de la Feuille jusqu'à ce qu'elle soit renseignée (FR-09-05). — *source : [ASSUMPTION: H25] ; H7*
- Une valeur numérique ancienne **négative ou non entière** (Cible, Pause, Pause au changement de côté, Bip, Compte à rebours, Fin), dans une Définition d'Exercice ou une Copie en Séance, quelle que soit la ligne, n'est pas conservée : l'Exercice est écarté et dénombré selon FR-18-20. Aucun calcul n'utilise une valeur négative. — *source : Q28 (remplace P40 et amende P44)*
**Notes :** [ASSUMPTION: H7 — la donnée ancienne invalide est conservée telle quelle par la migration, affichée telle quelle, et sa modification impose une valeur valide ; elle n'est jamais convertie en échec.] Frontière avec Q19 : une donnée **lisible** mais hors des règles actuelles (Répétitions sans nombre, Durée positive hors 5 à 3535 s, Bip positif hors 0 à 10) relève de FR-18-14 et est conservée ; une donnée **illisible** (paramètres corrompus, impossibles à relire, ou valeur numérique négative ou non entière selon Q28) relève de FR-18-20 et l'Exercice est écarté.

#### FR-18-15 : Migration atomique, annulation complète en cas d'erreur structurelle
Le système exécute la migration de façon atomique : elle se termine entièrement, données illisibles écartées selon FR-18-20 comprises, ou elle ne laisse aucune modification. Une **erreur structurelle** de migration (échec d'une étape de transformation, d'une écriture ou d'une contrainte, et non la rencontre d'un Exercice illisible) est un échec : la base reste dans son état d'avant migration, l'échec est signalé par le comportement d'erreur de démarrage existant, et aucun repli silencieux n'a lieu. Un Exercice aux paramètres illisibles n'est pas une erreur structurelle et ne provoque pas cette annulation (Q19).
**Conséquences (testables) :**
- Une erreur structurelle provoquée à n'importe quelle étape de la migration laisse la base, ses Exercices, ses Séances et ses liens identiques à leur état d'avant migration, y compris les Exercices illisibles, qui ne sont alors pas écartés. — *source : `ch09:1262` ; `ch12:1597` ; `ch12:434-436` ; `ch13:3041` ; `PERIM:36` ; R18-27 ; 18r.1 ; Q19 ; H6*
- Après un échec structurel, l'application n'ouvre pas une base partiellement migrée et n'affiche pas de données d'avant migration comme si elles étaient migrées. — *source : [ASSUMPTION: H6] ; Q19 ; 18r.3 (classe D)*
- La présence d'un ou plusieurs Exercices illisibles, sans autre erreur, ne fait pas échouer la migration : les autres données sont migrées (FR-18-20). — *source : Q19*
- Au lancement suivant un échec structurel, la migration est de nouveau tentée sur la base intacte. — *source : [ASSUMPTION: H6] (conséquence directe de H6 : la base restée dans son état d'avant migration n'est pas marquée migrée, et le comportement de démarrage existant rejoue la migration)*
**Notes :** [ASSUMPTION: H6 — échec **structurel** : la transaction est annulée, la base reste dans son état d'avant migration, et l'application garde le comportement d'erreur de démarrage existant, sans repli silencieux.] Pour les données illisibles, Q19 remplace l'obligation antérieure de tout annuler (FR-18-20). La quatrième conséquence (nouvelle tentative au lancement suivant) est rattachée à H6 : elle découle de la base laissée dans son état d'avant migration et du comportement de démarrage existant ; elle n'a pas d'autre source.

#### FR-18-16 : Aucune réinitialisation des données
Le système préserve les données existantes : aucune réinitialisation, aucune suppression ni recréation de la base n'accompagne PRE-4.
**Conséquences (testables) :**
- Après installation de la version PRE-4 sur une base contenant des données antérieures, toutes les Séances, Catégories, Zones corporelles et fichiers de Médias antérieurs sont présents, ainsi que toutes les Définitions d'Exercice et Copies en Séance lisibles ; seuls manquent les Exercices aux paramètres illisibles écartés selon FR-18-20, dont le nombre a été signalé. — *source : `ch12:1505` ; `recette-iphone.md` §2 ; R18-30 ; P29 ; Q19 (amende ce point)*
**Notes :** D-208 (base « réinitialisable », `ch12:600`, `ch12:1471`) est historique et hors PRE-4 (P29, C-07). L'écart d'un Exercice illisible (Q19) n'est pas une réinitialisation : il ne touche que cet Exercice et ses liens.

#### FR-18-17 : Écriture seulement à l'enregistrement validé
Le système n'écrit en base qu'à l'enregistrement validé : Terminer au Catalogue, Continuer de Composition pour une Copie en Séance. Le ✓ de la Feuille Paramètres d'exécution applique au Brouillon de l'Éditeur sans écrire. Le ✕ de la Feuille, sa fermeture et un abandon confirmé de l'Éditeur n'écrivent rien.
**Conséquences (testables) :**
- Après ✓ de la Feuille puis fermeture de l'application sans Terminer, la base est inchangée. — *source : `ch13:620` ; `ch13:604` ; `ch08:1832` ; `ch11:461` ; R18-40 ; P8*
- Après ✕ de la Feuille, les paramètres du Brouillon de l'Éditeur et la base sont inchangés. — *source : `ch13:620` ; `ch13:636` ; `ch11:461` ; R18-41*
- Après ✕ de la Feuille ou un abandon confirmé de l'Éditeur, dans les quatre Parcours d'édition, la base est identique à son état d'avant ouverture. — *source : `ch13:552` ; `ch13:598` ; `ch13:620` ; `ch13:636` ; `ch13:3031` ; `ch08:1594` ; R18-42 ; Q18 ; 19n.1*
- En Séance, Terminer écrit dans le Brouillon de Composition ; la Copie en Séance n'est écrite en base qu'au Continuer de Composition. — *source : `ch06:329` ; `ch13:988` ; P8*
- Note Q54 (décision de Hermann du 2026-10-18) : l'écran « Catégories de la séance », vestige, est supprimé ; le `Continuer` de Composition est remplacé par `Enregistrer la séance`, qui enregistre la Séance (et ses Copies) puis revient au Catalogue. Partout dans ce PRD, « Continuer de Composition » se lit `Enregistrer la séance`. — *source : Q54*
**Notes :** exigence de référence pour les écritures en base ; FR-02-10, FR-11-01 et FR-19-13 y renvoient.

#### FR-18-18 : Échec d'écriture sans perte du Brouillon
Le système, lorsqu'une écriture échoue, conserve le Brouillon, garde l'Éditeur affiché et permet une nouvelle tentative, sans écrire de donnée partielle. Si la Définition d'Exercice source a été supprimée entre-temps, il signale une erreur, sans la recréer.
**Conséquences (testables) :**
- Un échec d'écriture provoqué à Terminer laisse la base inchangée, l'Éditeur affiché avec toutes les valeurs saisies, et une nouvelle tentative réussie enregistre ces valeurs. — *source : `ch13:628` (§17) ; `ch12:434-436` ; R18-43*
- La modification d'une Définition d'Exercice supprimée entre-temps produit une erreur, et aucune Définition n'est recréée. — *source : `ch13:628` ; R18-44*

#### FR-18-19 : Preuve sur une vraie base SQLite contenant des données antérieures
La migration, son annulation et les allers-retours de FR-18-08 et FR-18-09 sont démontrés sur une vraie base SQLite contenant des données antérieures à PRE-4, et non sur une base vide ni sur une simulation de la persistance.
**Critères d'acceptation :**
- La base de départ contient au moins : des Définitions d'Exercice et des Copies en Séance en Ancien mode À l'échec, en Durée et en Répétitions ; des Exercices avec côtés, Bip, Pauses, Catégorie, plusieurs Zones corporelles et plusieurs Médias ordonnés ; des Médias partagés entre une Définition d'Exercice et une Copie en Séance ; des données anciennes sans Bip ni Régime explicite. — *source : `PERIM:36` ; R18-29 ; M-08 ; T-13*
- Une variante de cette base contient en plus au moins une Définition d'Exercice et une Copie en Séance aux paramètres illisibles, parmi des Exercices lisibles, avec Catégorie, Zones et Médias dont l'un est partagé avec un Exercice lisible ; elle démontre FR-18-20. — *source : Q19*
- Après migration réussie, FR-18-10 à FR-18-14, FR-18-20 et FR-21-57 sont vérifiés sur cette base. — *source : `PERIM:36` ; 18m.2, 18m.3, 18m.6, 18m.7 ; Q19*
- Une erreur structurelle provoquée pendant la migration de cette base démontre FR-18-15 : état relu identique à l'état de départ, Exercices illisibles compris. — *source : `PERIM:36` ; 18r.1 ; Q19*
- Les allers-retours de FR-18-08 et FR-18-09 sont relus depuis la base après réouverture, et non depuis un état en mémoire. — *source : `PERIM:36` ; 18d.1 ; 18s.1*
- Avant livraison sur appareil, les données réellement présentes sont contrôlées ; la recette sur iPhone part d'une installation contenant des données antérieures. — *source : `ch12:1565` ; `recette-iphone.md` §2 ; T-13*
**Notes :** ce critère est une exigence de preuve du cadrage (R18-29, statut CAD), sans valeur chiffrée dans les spécifications. Une suite de tests verte ne vaut pas preuve visuelle ou tactile sur appareil (AGENTS.md).

#### FR-18-20 : Exercices aux paramètres illisibles écartés par la migration (Q19)
Le système migre uniquement les données utilisables. Un Exercice, Définition d'Exercice ou Copie en Séance, dont les Paramètres d'exécution sont illisibles est écarté par la migration, sans sauvegarde de récupération ni quarantaine. L'intégrité des données migrées est préservée : aucun lien orphelin ne subsiste, et aucune Séance entière n'est supprimée en cascade. Le nombre d'Exercices écartés est signalé à l'utilisateur. Pour ce cas, cette exigence remplace l'obligation antérieure de tout annuler ; une erreur structurelle reste régie par FR-18-15.
**Conséquences (testables) :**
- Base de test contenant trois Définitions d'Exercice, dont une aux paramètres illisibles : après migration, les deux Définitions lisibles sont présentes et migrées selon FR-18-10 à FR-18-14 ; la Définition illisible n'existe plus ; la migration est réussie (pas d'erreur de démarrage). — *source : Q19*
- Aucune copie de sauvegarde, table, fichier ou état de quarantaine de l'Exercice écarté n'est créé. — *source : Q19*
- Les liens de l'Exercice écarté vers sa Catégorie, ses Zones corporelles et ses Médias sont supprimés avec lui : aucun lien ne référence plus un Exercice absent. Les entrées de référentiel elles-mêmes (Catégorie, Zones) restent présentes et inchangées, y compris si l'Exercice écarté était leur seul utilisateur. — *source : Q19 ; FR-18-09 (aucun lien orphelin)*
- Les fichiers physiques de Médias ne sont pas supprimés par l'écart : un fichier encore référencé par une autre Définition d'Exercice, une Copie en Séance ou un Instantané reste présent et lisible depuis ces références ; un fichier qui n'était référencé que par l'Exercice écarté n'est pas non plus supprimé par la migration. — *source : Q19 ; FR-21-55 ; FR-21-57*
- Séance contenant deux Copies en Séance, dont une aux paramètres illisibles : après migration, la Séance existe toujours, avec son identifiant, ses paramètres et la Copie lisible ; seule l'occurrence illisible est retirée, avec la Récupération qui lui appartient ; l'ordre relatif des occurrences restantes est conservé. — *source : Q19 (« aucun lien orphelin ») : la Récupération appartient à l'occurrence (`ch09:1230`, « R reste dans l'occurrence ») et ne peut lui survivre sans devenir orpheline ; [ASSUMPTION: H24] pour le seul signalement*
- Séance dont toutes les Copies en Séance sont illisibles : la Séance existe toujours après migration, sans occurrence ; elle n'est pas supprimée. Elle reste visible dans la liste des Séances et s'ouvre, vide. — *source : Q19 (aucune suppression en cascade d'une Séance entière) ; P39*
- Une Copie en Séance lisible dont la Définition d'Exercice source est illisible et écartée reste présente et intacte (FR-19-06) ; inversement, une Définition lisible n'est pas touchée par l'écart d'une de ses Copies. — *source : Q19 ; FR-19-06 ; FR-19-01*
- Après une migration ayant écarté des Exercices, le nombre total d'Exercices écartés (Définitions et Copies en Séance) est signalé à l'utilisateur ; sans Exercice écarté, aucun signalement n'apparaît. Exemple : une Définition et une Copie illisibles → nombre signalé 2. — *source : Q19*
- Sont illisibles, et seulement eux : un JSON non analysable, une version inconnue, des types impossibles (texte à la place d'un nombre, par exemple), un nombre de lignes incohérent avec N, un Mode inconnu ; une valeur que la base ou le modèle ne peuvent pas représenter (P45) : un nombre de Séries N non entier (ex. 2,5), dans une Définition d'Exercice comme dans une Copie en Séance, ou une Copie en Séance dont la projection d'une valeur positive sur ses colonnes scalaires violerait la contrainte de la table des Copies (ex. Cible ou Pause de première ligne de 6 000 s, portée par le seul JSON v1) ; et une valeur numérique **négative ou non entière** de la Cible, d'une Pause, de la Pause au changement de côté, du Bip, du Compte à rebours ou de la Fin, dans une Définition ou une Copie, quelle que soit la ligne (Q28 ; ex. Pause −5 s en ligne 2, Bip 2,5). Hors ces cas, une valeur numérique positive hors grille ou hors bornes est lisible et conservée (FR-18-14). Ces cas ne sont pas productibles par le code PRE-3 ; chacun est démontré par un test. — *source : P44 amendée par Q28 ; P45 ; Q19 ; Q28*
- Le signalement est un message d'information unique, affiché au premier lancement qui suit la migration, avec un seul bouton de fermeture. Une fois fermé par ce bouton, il ne réapparaît plus ; si l'application est quittée avant, il réapparaît au lancement suivant (H24). Son texte vient du lexique et indique le nombre, par exemple : « 2 exercices illisibles n’ont pas pu être repris. » — *source : [ASSUMPTION: H24] ; Q19 (« simplement signalé »)*
- Une donnée lisible mais invalide selon les règles actuelles (FR-18-14) n'est pas écartée. — *source : H7 ; Q19 (« données utilisables »)*
- Les identifiants des Exercices, Catégories, Zones et Médias conservés restent ceux d'avant migration (FR-18-12). — *source : [ASSUMPTION: H21]*
- Effets d'un écart selon Q28, par donnée : au Catalogue, la Définition écartée disparaît ; en Séance, l'occurrence écartée est retirée et la Séance conservée (P39) ; aucun calcul de durée ni aucun enregistrement n'utilise la valeur négative ou non entière ; l'écart est compté dans le nombre signalé. Exemple : une Définition à Pause −5 s en ligne 2 et une Copie à Bip 2,5 → les deux sont écartées, nombre signalé 2 ; une Définition à Cible 150 répétitions est conservée. — *source : Q28 ; P39 ; Q19*
**Notes :** cohérence avec ED-21 : FR-21-55 interdit seulement de supprimer un fichier encore référencé ; Q19 ne demande aucune suppression physique, et le code de départ n'en fait aucune (indication T-10). L'écart ne supprime que des liens, ce que FR-21-54 admet déjà pour un retrait. FR-21-57 (liens et fichiers inchangés par la migration) est amendé en conséquence pour les seuls Exercices écartés. Exigences amendées par Q19 : FR-18-12 (aucune suppression d'Exercice), FR-18-15 (annulation complète réservée à l'erreur structurelle), FR-18-16 (toutes les Définitions et Copies présentes), FR-21-57 ; et, hors de cette section, NFR-05, NFR-07, SM-2 et le texte de cadrage de la tête du PRD.
[ASSUMPTION: H24 — Q19 dit seulement que le nombre est « simplement signalé ». La forme minimale retenue est un message d'information unique, au premier lancement après la migration, dont le texte vient du lexique (RM-092).]

---

### 4.19 Copies, duplications et Instantanés (ED-19)

**Description :** Ajouter une Définition d'Exercice à une Séance crée une Copie en Séance complète et isolée : toutes les propriétés de la Définition sont copiées, Catégorie, Cibles typées, Régime, Bip, côtés et ordre compris, et la modifier ne touche ni la Définition ni les autres copies. Les duplications conservent le même état complet. Les Instantanés existants ne sont jamais réécrits, restent lisibles selon leur version, et aucune performance n'est inventée pour un ancien résultat. Annuler n'écrit rien.

**Exigences fonctionnelles :**

#### FR-19-01 : Copie complète et isolée du Catalogue vers la Séance
Le système crée, à l'ajout d'une Définition d'Exercice à une Séance, une Copie en Séance complète et indépendante. Aucune modification ultérieure ne se propage, ni de la Définition vers la copie, ni de la copie vers la Définition ou vers les autres copies.
**Conséquences (testables) :**
- La Copie en Séance porte le nom, la description, la Catégorie, les Zones corporelles et les Médias ordonnés de la Définition d'Exercice. — *source : `ch04:342` ; `ch04:110` ; `ch11:262` (API-COPY-01) ; `ch09:1142` ; `ch09:1230` ; R19-04 ; P27*
- Après modification de la Définition d'Exercice, la Copie en Séance est inchangée. — *source : `ch04:110` ; `ch10:195` (RM-113) ; `ch07:145` (D-113) ; `ch07:218` (D-171) ; R19-01 ; Q7:01.3*
- Après modification puis `Terminer` d'une Copie en Séance, la Définition d'Exercice source et les autres copies sont inchangées. — *source : `ch09:609` ; `ch13:548` ; `ch09:1232` ; `ch08:524` ; R19-05 ; 19c.4 ; Q7:01.3*
**Notes :** exigence de référence pour l'isolation de la copie (FR-01-06 y renvoie). L'énumération partielle de `ch09:609` (sans Catégorie ni paramètres complets) est supplantée par la règle générale de copie complète (P27, C-01).

#### FR-19-02 : Paramètres d'exécution copiés à l'identique
Le système copie dans la Copie en Séance tous les Paramètres d'exécution : Mode, Régime, N, collection ordonnée avec le type et la valeur de chaque Cible, Pauses, Bip, direction, Changement de côté, Ordre des côtés, Pause au changement de côté, Compte à rebours et Fin.
**Conséquences (testables) :**
- Pour une Définition d'Exercice à Cible mixte en Régime variables, la Copie en Séance relue porte les mêmes types de Cible, les mêmes valeurs et le même ordre. — *source : `ch09:1196` ; `ch11:405` ; `ch11:362` ; R19-02 ; 19c.1*
- Chacun des paramètres énumérés est égal entre la Définition et sa Copie en Séance juste après la copie. — *source : `ch09:1142` ; `ch09:1230` ; `ch09:1150` ; `ch04:427` ; R19-03*
- La copie est profonde : modifier une Cible, une Pause ou l'ordre des Séries de la copie ne change pas la collection de la Définition. — *source : `ch09:1230` ; `ch13:3033` ; 19c.1*

#### FR-19-03 : Édition d'une Copie en Séance sans synchronisation
Le système ouvre une Copie en Séance dans le même Éditeur d'Exercice, sans aucune synchronisation vers la Définition d'Exercice ; le retour se fait vers la Composition.
**Conséquences (testables) :**
- Terminer sur une Copie en Séance ne modifie aucune Définition d'Exercice. — *source : `ch13:548` (§3) ; `ch13:624` (§16) ; R19-09 ; P8*

#### FR-19-04 : Propriétés propres à la Copie en Séance
Le système ne crée la position dans la Séance et la Récupération qui suit que sur la Copie en Séance. Une copie ne reçoit aucune Récupération automatique : en l'absence de Récupération explicite, elle vaut 0.
**Conséquences (testables) :**
- Une Copie en Séance créée depuis le Catalogue a une Récupération de 0 tant qu'aucune Récupération explicite n'est posée. — *source : `ch09:609` ; `ch04:110` ; `ch04:251` ; R19-06 ; P15 (D-307)*
- La Définition d'Exercice ne porte ni position de Séance, ni Récupération. — *source : `ch09:609` ; R19-06*

#### FR-19-05 : Copie groupée atomique et ordonnée
Le système copie un ensemble de Définitions d'Exercice vers une Séance de façon atomique, dans l'ordre de présentation de la liste filtrée.
**Conséquences (testables) :**
- Un échec provoqué pendant une copie groupée laisse la Composition inchangée, sans aucun sous-ensemble inséré. — *source : `ch11:302` (API-COMP-SEL-03) ; `ch10:228` (RM-163) ; R19-07*
- Les copies réussies apparaissent dans l'ordre de présentation de la liste filtrée. — *source : `ch11:296` ; R19-07*
**Notes :** exigence de non-régression ; le parcours de sélection appartient à Composition (Q4) et n'est pas modifié.

#### FR-19-06 : Suppression d'une Définition sans effet sur les copies et l'historique
Le système ne propage pas la suppression définitive d'une Définition d'Exercice à ses Copies en Séance, ni aux Instantanés, exécutions ou résultats.
**Conséquences (testables) :**
- Après suppression définitive d'une Définition d'Exercice, ses Copies en Séance restent présentes et intactes, Cibles typées et Médias compris. — *source : `ch04:114` ; `ch13:718` ; R19-08*

#### FR-19-07 : Duplication d'un Exercice de Séance
Le système crée, à la duplication d'une Copie en Séance, une nouvelle Copie en Séance indépendante, avec un nouvel identifiant, insérée juste après la source. Les propriétés de l'Exercice et sa Récupération sont copiées ; rien n'est créé au Catalogue.
**Conséquences (testables) :**
- La duplication produit un Exercice d'identifiant différent, placé immédiatement après la source, avec des Paramètres d'exécution (Cibles typées et ordre compris), une Récupération, une Catégorie, des Zones corporelles et des Médias ordonnés égaux à ceux de la source. — *source : `ch11:78` (API-ACT-07) ; `ch10:38` (RM-021) ; `ch10:255` (RM-210) ; R19-20 ; R19-22*
- Le nombre de Définitions d'Exercice au Catalogue est inchangé. — *source : `ch11:78` ; R19-20*
- Modifier la copie dupliquée ne change pas la source, et inversement. — *source : `ch11:78` ; 19c.4*

#### FR-19-08 : Toute duplication conserve l'état complet
Le système conserve, dans toute duplication déjà offerte par l'application (Exercice de Séance ; Séance et Exercice du Catalogue seulement si le code de départ les offre, P36), l'état complet des Paramètres d'exécution : Régime explicite, collection ordonnée, Cibles typées, Bip, Changement de côté et Ordre des côtés.
**Conséquences (testables) :**
- Pour chaque duplication offerte par l'application, l'Exercice dupliqué relu porte les mêmes Paramètres d'exécution que la source, Cibles à l'échec et ordre compris. — *source : `ch09:1142` ; `ch09:1150` ; `ch11:362` ; `ch11:275` (API-SIDE-03) ; R19-22*
- Une Séance dupliquée est indépendante, avec de nouveaux identifiants, une copie de sa Composition et de ses paramètres ; aucune Routine ni exécution n'est dupliquée. — *source : `ch11:51` (API-SEA-05) ; `ch10:18` (RM-006) ; R19-21*
- La duplication d'un Exercice du Catalogue suit les mêmes règles de conservation. — *source : `ch10:227` (RM-162) ; `ch09:1142` ; R19-24 ; M-05*
**Notes :** tranché par P36. L'état des lieux du code de départ ne trouve ni duplication de Séance ni duplication d'Exercice au Catalogue (`extracts/code-depart.md` §5) ; seule la duplication d'un Exercice de Séance existe. Cette exigence porte sur la conservation des Cibles typées et des Médias dans les copies et duplications **déjà offertes** ; elle ne crée aucun parcours (Q4). Les deuxième et troisième conséquences ne s'appliquent que si ces duplications existent dans le code de départ ; à défaut, elles sont sans objet pour PRE-4.

#### FR-19-09 : Copie d'une ligne à l'échec à l'augmentation de N
Le système copie, lorsqu'une augmentation de N clone la dernière ligne et que celle-ci porte une Cible à l'échec, le type à l'échec et la Pause de cette ligne, sans inventer de nombre.
**Conséquences (testables) :**
- Passer de N à N + 1 quand la dernière Série est à l'échec ajoute une Série à l'échec, avec la même Pause et sans valeur numérique ; après Terminer, elle est relue ainsi. — *source : `ch09:1250` ; R19-23*
**Notes :** le comportement d'édition est rédigé avec ED-12 ; seul son effet sur les données est repris ici.

#### FR-19-10 : Instantanés existants jamais réécrits, lus selon leur version
Le système ne réécrit jamais un Instantané existant, ni par la migration, ni par une modification de la source. Il relit chaque Instantané selon sa version ; un Instantané ancien sans Bip est lu non cadencé, et un Instantané ancien en Ancien mode À l'échec reste lisible.
**Conséquences (testables) :**
- Un Instantané de version antérieure est relu après la migration et après modification de sa Définition source, avec un contenu identique à celui d'avant. — *source : `ch09:1228` ; `ch09:1258` ; `ch09:1260` ; `ch09:585-586` ; R18-26 ; R19-31 ; 19s.1 ; P28*
- Un Instantané ancien sans Bip est lu avec un Bip Aucun. — *source : `ch09:1151` ; `ch11:375` ; `ch12:418` ; R19-31*
- Un Instantané ancien contenant l'Ancien mode À l'échec est lu sans erreur et sans performance inventée. — *source : `ch09:1198` ; `ch09:1258` ; `PERIM:37` ; 19s.2 ; M-04*
**Notes :** [ASSUMPTION: H11 — le code de départ n'enregistre aucun Instantané en base ; l'exigence se limite à la lecture versionnée des Instantanés de version antérieure existant en mémoire et à l'encodage typé des nouveaux.] La « migration copies/snapshots compris » de `ch12:1597` se lit comme une compatibilité de lecture versionnée, non comme une réécriture (P28, C-03). L'affichage d'un ancien Instantané dans l'historique relève du Suivi, hors périmètre (M-04).

#### FR-19-11 : Nouveaux Instantanés avec Cibles typées et Médias ordonnés
Le système encode, dans un nouvel Instantané, la Cible typée de chaque Série et de chaque côté, le Bip commun de l'Exercice (invariant de FR-18-04) et les références ordonnées des Médias. L'Instantané est immuable une fois créé.
**Conséquences (testables) :**
- Un Instantané créé à partir d'un Exercice à Cible mixte, puis relu, restitue les mêmes types, valeurs, ordre et Bip. — *source : `ch09:1196` ; `ch09:1151` ; `ch09:560` ; R19-30 ; 19s.3*
- Il restitue les Médias dans leur ordre, par référence, sans copie de fichier. — *source : `ch09:565` ; `ch09:588` ; 19s.4 ; R21-07*
- Modifier ensuite l'Exercice source ne change pas l'Instantané relu. — *source : `ch09:585-586` ; R19-30*
**Notes :** la création des Instantanés à l'exécution relève du moteur, hors périmètre ; seule la forme des données transportées est exigée ici.

#### FR-19-12 : Anciens résultats sans performance inventée
Le système ne réécrit aucun résultat historique et n'invente aucune performance : aucun nombre de répétitions n'est déduit d'une durée globale, un relevé absent reste absent, sans zéro. L'historique se lit depuis l'Instantané, jamais par recalcul depuis la source actuelle.
**Conséquences (testables) :**
- Après migration, aucun résultat historique n'est modifié, ajouté ou complété. — *source : `ch09:1196` ; `ch09:1260` ; `ch09:1226` ; `ch10:157` (RM-084) ; `ch11:362` ; `ch11:423` ; R19-32*
- Un ancien résultat en Ancien mode À l'échec ne reçoit aucun nombre de répétitions, et un relevé absent n'est pas lu comme 0. — *source : `ch09:1198` ; `ch09:1260` ; `ch09:1153` ; `ch11:373` ; R19-33 ; 19s.2*
- Modifier la Définition source ne change pas ce que l'historique affiche pour une exécution passée. — *source : `ch09:587` ; `ch11:423` ; R19-34*

#### FR-19-13 : Aucune écriture à l'annulation
Le système n'écrit rien en base et ne supprime aucun fichier de Média référencé lorsque l'utilisateur annule la Feuille Paramètres d'exécution ou abandonne l'Éditeur d'Exercice.
**Conséquences (testables) :**
- Base identique à son état d'avant ouverture après ✕ de la Feuille ou abandon confirmé de l'Éditeur : voir **FR-18-17** (exigence de référence, qui porte `ch13:3031` et 19n.1). — *source : renvoi*
- Après un abandon, aucun fichier de Média encore référencé par une Définition d'Exercice, une Copie en Séance ou un Instantané n'est supprimé. — *source : `ch09:498` ; 19n.2*

**Hors périmètre (ED-19) :**
- L'adaptation d'une Copie en Séance à un circuit de séries (ajout ou retrait de lignes) relève de Composition (R19-10 ; Q4 ; questions-ouvertes §4).
- Les relevés qualifiés (estimé, déclaré) et la distinction dernière tentative / cumul relèvent du moteur et des relevés (R19-35 ; `PERIM:46`). Le modèle de données ne doit pas les rendre impossibles.

---

### 4.20 Catégorie et Zones corporelles depuis l'Éditeur ; clavier continu (ED-20)

**Description :** Depuis le bandeau du nom, l'utilisateur ouvre la sélection de Catégorie (choix unique) ou de Zones corporelles (choix multiple), sans perdre son Brouillon de l'Éditeur. Il peut y créer une entrée sans fermer le clavier, la modifier ou la supprimer par appui long. Les règles PRE-3 acceptées sont conservées (P12-P15).

**Exigences fonctionnelles :**

#### FR-20-01 : Ouverture sans perte du Brouillon
L'utilisateur peut ouvrir et fermer une sélection de référentiel sans perdre ce qu'il a saisi.
**Conséquences (testables) :**
- Ouvrir puis fermer la sélection de Catégorie ou de Zones conserve tout le Brouillon de l'Éditeur, Paramètres d'exécution variables compris. — *source : `S/06…:1117` ; `S/13…:2871`*
- La sélection est une feuille ancrée en bas, en-tête ✕ / titre / ✓ et séparateur. — *source : D-343 `S/07…:554` ; `S/13…:147,2875` ; `S/06…:1289`*

#### FR-20-02 : Choisir une Catégorie
L'utilisateur peut marquer une Catégorie puis la confirmer par ✓.
**Conséquences (testables) :**
- Toucher une Catégorie la marque sans fermer la feuille ; ✓ affecte la Catégorie marquée et ferme progressivement (fermeture immédiate avec « Réduire les animations ») ; ✕ ferme et conserve la Catégorie d'avant l'ouverture. — *source : D-343 `S/07…:554` ; P14 ; Q7:20.5*
- Chaque Catégorie affiche une pastille colorée et son nom ; la couleur est toujours accompagnée du nom. — *source : `S/13…:2879,2937` ; D-212*
- Ordre : Catégories prédéfinies selon leur ordre d'affichage, puis Catégories personnelles par date de création croissante ; une sélection ne change pas l'ordre. — *source : RM-106 `S/10…:188` ; API-REF-01 `S/11…:161`*

**Notes :** Non repris : sélection fermée au toucher sans ✓ (D-222, D-228, RM-200, `S/06…:198`, `S/08…:1592,1800`, `S/13…:2913`), remplacée par D-343 (P14).

#### FR-20-03 : Choisir des Zones corporelles
L'utilisateur peut sélectionner plusieurs Zones et appliquer la sélection par ✓.
**Conséquences (testables) :**
- Chaque appui sur une Zone bascule sa sélection ; ✓ applique la sélection ; ✕ restaure la sélection d'avant l'ouverture. — *source : `S/13…:147,2875,2913` ; D-347 ; Q7:20.5*
- Les Zones n'ont pas de couleur ; aucune silhouette n'est répétée dans chaque option. — *source : `S/13…:2897` ; PRE3-PERIM:158*
- Le jeu initial de Zones est celui des dix valeurs de D-093, jeu de départ et non liste fermée ; « Fessier » des captures est une donnée de démonstration. — *source : D-093, D-199 ; `S/13…:2881,2885`*

#### FR-20-04 : Une Catégorie et au moins une Zone
L'Exercice a exactement une Catégorie et au moins une Zone corporelle.
**Conséquences (testables) :**
- Un nouvel Exercice exige exactement une Catégorie et au moins une Zone pour activer `Terminer` (FR-02-09) ; Catégorie et Zones sont sans effet sur l'exécution. — *source : D-211 `S/07…:286` ; `S/13…:2893,2921` ; RM-214 ; P15*
- Une Zone retirée de son référentiel et déjà affectée à un Exercice ne bloque ni l'enregistrement de l'Exercice (Définition ou Copie), ni son ajout à une Séance, ni l'enregistrement de la Séance ; la Copie conserve l'affectation ; aucun écran d'erreur système. L'Éditeur n'affiche aucun avis textuel ni annonce VoiceOver à son sujet (Q53 (9), décision de Hermann du 2026-10-18 : « ce n'est pas un besoin »). Dans la feuille des Zones de cet Exercice, elle reste visible, cochée et interactive, sur fond `#FFF1F0`, sans mention « Retirée » ; elle peut être conservée, remplacée ou retirée (règle « au moins une Zone » et son message inchangés). Elle n'est jamais proposée pour une nouvelle affectation à un Exercice qui ne l'a pas. — *source : Q53 (décision de Hermann du 2026-10-18, remplace Q49 b ; avis retiré par Q53 (9)) ; D-199, D-210*

**Notes :** Non repris : « Zéro à plusieurs zones » (API-ACT-05 `S/11…:76`), remplacé par D-211 (P15). Annotation Q53 (décision de Hermann du 2026-10-18, qui remplace Q49 b pour les Zones) : la désaffectation d'une Zone retirée depuis la feuille (D-199 `S/07…:246`) est reprise ; le besoin PRE-4 explicite est la recette iPhone (Séance impossible à enregistrer, `RetiredBodyZoneError`, écart PRE-3 révélé). L'avis textuel d'abord prévu (et sa formulation au pluriel) est retiré par Q53 (9), décision de Hermann du 2026-10-18 (« ce n'est pas un besoin »), pour la Zone, la Catégorie et l'Étiquette ; restent le fond rouge clair et le nom accessible « {nom}, retirée de la liste des choix ». Persistance : une Copie nouvellement créée garde une Zone retirée déjà affectée à au moins une Définition ou une occurrence (affectation héritée de sa source) ; une Zone retirée affectée nulle part reste refusée (D-210).

#### FR-20-05 : Liste longue
L'utilisateur peut parcourir une longue liste de Catégories ou de Zones.
**Conséquences (testables) :**
- Avec une liste longue, la feuille monte jusqu'au bord haut de la zone de contexte ; la liste défile ; le clavier et les actions restent visibles ; un nom long reste lisible en entier par l'accessibilité. — *source : D-228 `S/07…:308` ; `S/13…:2905`*

#### FR-20-06 : Créer une entrée sans quitter le clavier
L'utilisateur peut créer une Catégorie ou une Zone depuis la sélection, sans fermer le clavier ni la feuille.
**Conséquences (testables) :**
- Le formulaire de création est un champ texte avec une action ↑ dans le champ. ↑ enregistre la nouvelle entrée **sans fermer le clavier ni la feuille** ; le champ est vidé ; un envoi crée une seule entrée, même sur appuis répétés. — *source : D-350 `S/07…:575` ; `S/13…:2889` ; Q7:20.2*
- Une Catégorie créée est marquée comme choisie et ✓ l'affecte ; elle reste dans le référentiel même si la feuille est fermée par ✕. Une Zone créée rejoint la sélection et ✓ l'applique. — *source : D-343, D-350 ; `S/13…:2875`*
- Le formulaire de création n'a pas de bouton `Annuler` : le ✕ de l'en-tête ferme la feuille (Catégorie précédente conservée, sélection de Zones antérieure restaurée). Clavier ouvert, l'espace entre le formulaire et le clavier est réduit. — *source : D-347 `S/07…:565` ; `S/13…:2889`*
- Nom vide : l'action d'ajout ↑ est inactive, **sans message d'erreur**. — *source : P12 ; PRE3-PERIM:98 ; Q7:20.4, 22r.1*
- Création de Catégorie : une seule barre de couleurs sous le champ, sans pastille séparée, avec les 12 couleurs de D-026 (valeurs de D-026, pas de Figma). Les Zones n'ont pas de palette. — *source : D-344 `S/07…:555` ; `S/13…:2897` ; P14*

**Notes :**
- Non repris : message d'erreur sur nom vide (CE-UI-09 §17, `S/13…:2909,2933`), remplacé par P12.
- Non repris : icône KODJO et couleur blanche fixes (RM-124, API-REF-02/03), remplacées par D-344, D-212, D-259 (P14).
- Non repris : Q7:20.3 (« annulation sans fermer le clavier », D non sourcée ; D-347 supprime l'`Annuler` du formulaire). Le maintien du clavier à l'annulation du dialogue d'appui long est couvert par FR-20-08.
- Traitement d'un nom **dupliqué** à la création (message ou action inactive, texte) : non défini par les sources (`S/13…:2933` parle d'un message, P12 ne vise que le nom vide). P34 conserve le comportement et le texte du code de départ (FR-20-07).
- La barre de couleurs de `8328:36056` semble compter plus de 12 cases. Traitement indexé : le nombre de couleurs est une règle, D-026 (12 couleurs), et non une lecture de capture (NFR-01, D-255) ; la présentation de la barre suit la capture (P35, par analogie : présentation visuelle tirée des captures de `caa2a5cf`) ; l'écart de nombre est signalé à Hermann, qui valide le rendu à la recette (NFR-04).

#### FR-20-07 : Unicité et réactivation
L'utilisateur ne peut pas créer deux entrées de même nom dans un référentiel ; recréer un nom retiré réactive l'entrée.
**Conséquences (testables) :**
- Un nom est non vide et unique dans son référentiel, selon une clé normalisée. — *source : D-257 `S/07…:380` ; `S/13…:155,2921` ; API-REF-06*
- Créer un nom qui correspond à une entrée retirée la réactive : même identifiant, associations conservées, sans confirmation ; pour une Catégorie, la couleur choisie à cette création est appliquée. — *source : D-257 ; `S/13…:155`*
- Ni le démarrage ni une migration ne réactivent ou ne recréent une entrée supprimée. — *source : `S/13…:155,2933` ; D-200, D-257*
- La règle de normalisation de la clé (casse, accents, espaces) et le traitement d'un nom dupliqué (comportement et texte) sont ceux du code de départ, inchangés. — *source : P34*

**Notes :** La normalisation de la clé n'est définie par aucune source ; P34 conserve celle du code de départ.

#### FR-20-08 : Appui long : modifier une entrée
L'utilisateur peut, par appui long sur une entrée, ouvrir un menu ✕ / `Modifier` / `Supprimer`.
**Conséquences (testables) :**
- Un appui long sur une option ne change ni la sélection ni l'affectation ; il ouvre un dialogue de décision avec un ✕ rond en haut à gauche, puis `Modifier` (fond bleu Kodjo) et `Supprimer` (fond rouge), texte blanc, sur une ligne (référence : 147 × 48 dans un dialogue de 354, adaptés à la largeur). — *source : D-354 `S/07…:579` ; D-259 `S/07…:382` ; `S/13…:148,151` ; P13*
- Le menu s'affiche dans la fenêtre de la feuille ; un clavier déjà affiché reste affiché, y compris quand le menu est fermé par ✕. — *source : D-354 ; `S/13…:148` ; Q7:20.1, 22r.3*
- `Modifier` ouvre la saisie du nom de l'entrée visée dans le formulaire de création (texte conservé), avec la palette pour une Catégorie ; renommer conserve l'identifiant. — *source : `S/13…:151,2913` ; D-259 ; API-REF-07*
- Changer la couleur d'une Catégorie s'applique aux objets courants, jamais aux Instantanés. — *source : `S/13…:2913` ; D-212 ; RM-216*

**Notes :** Non repris : menu `Annuler` / `Supprimer` (`S/06…:198-205,2190-2194`, D-200, RM-200, `S/08…:1745`, captures `8328:35932`, `8328:36441`), remplacé par D-354 (P13). Aucune des 32 frames ne montre le menu D-354 : son rendu est validé par Hermann sur appareil.

#### FR-20-09 : Supprimer une entrée
L'utilisateur peut supprimer une entrée de référentiel après confirmation.
**Conséquences (testables) :**
- `Supprimer` demande une confirmation destructive de titre `Supprimer « {nom} » ?`. Si l'entrée est utilisée, le message indique qu'elle n'est plus proposée mais reste attachée aux objets existants avec son nom et sa dernière couleur ; l'historique est inchangé. Textes de référence : `Cette catégorie ne sera plus proposée. Les exercices qui l’utilisent actuellement la conserveront.` et `Cette zone corporelle ne sera plus proposée. Les exercices qui l’utilisent actuellement la conserveront.` — *source : `S/13…:149-151` ; `S/06…:2190` ; D-210 ; `8328:35932`, `8328:36441`*
- Après confirmation : retour à la sélection restée ouverte, sans l'entrée supprimée. Catégorie (Q53 (8)) : dans l'Exercice depuis lequel la suppression est effectuée, elle disparaît immédiatement du sélecteur et de la sélection, qu'elle soit utilisée ailleurs ou non (avis `Cette valeur a été retirée. Choisissez-en une autre.` ; `Terminer` inactif tant qu'aucune Catégorie n'est choisie) ; dans les autres Exercices qui l'ont, elle reste affectée, choisie sur fond `#FFF1F0` dans leur feuille, sans menu d'appui long, sans avis textuel sous l'accès Catégorie (Q53 (9)) ; une Copie nouvelle la conserve ; elle n'est plus proposée pour de nouvelles affectations ; aucune erreur système ni sauvegarde bloquée. Zone : dans l'Exercice depuis lequel la suppression est effectuée, la Zone disparaît immédiatement du sélecteur et de la sélection, sans rester affichée en rouge ; dans les autres Exercices auxquels elle était déjà affectée, l'affectation est conservée et la Zone apparaît sur fond `#FFF1F0` dans leur sélecteur, où l'utilisateur peut la conserver, la remplacer ou la décocher ; elle n'est plus proposée pour de nouvelles affectations ; si c'était la seule Zone de l'Exercice courant, « au moins une Zone requise » s'applique (`Terminer` inactif, message existant), sans erreur système. Annuler la suppression laisse la sélection intacte. — *source : `S/13…:153-154,2929` ; Q7:20.6 ; Q53 (7)*
- Toutes les entrées sont supprimables, y compris les valeurs initiales fournies par KODJO. — *source : `S/13…:152` ; D-200*
- Pour une entrée non utilisée, la confirmation et son texte sont ceux du code de départ, inchangés. — *source : P34*

**Notes :** Aucune source ne rédige le message de confirmation pour une entrée **non utilisée** ; P34 conserve celui du code de départ. Annotation Q53 (décision de Hermann du 2026-10-18, qui remplace Q49 b), précisée par Q53 (7) le même jour : pour les Zones, l'affectation existante supprimée (`S/13…:153-154`) est conservée dans les AUTRES Exercices qui l'avaient (fond rouge dans leur sélecteur) ; dans l'Exercice depuis lequel la suppression est faite, elle disparaît du sélecteur et de la sélection (comportement PRE-3).

#### FR-20-10 : Erreurs de référentiel et séparation des enregistrements
Les opérations de référentiel sont confirmées séparément de l'enregistrement de l'Exercice.
**Conséquences (testables) :**
- Une création, modification ou suppression confirmée est enregistrée dans le référentiel indépendamment de `Terminer` ; l'Exercice, lui, n'est enregistré qu'à `Terminer`. — *source : `S/13…:2925,2933`*
- En cas d'erreur de création ou de suppression : message, Brouillon de l'Éditeur conservé, Exercice non enregistré. Les textes des messages sont ceux du code de départ, inchangés. — *source : `S/13…:2925,2933` ; P34*
- Aucun glisser dans les référentiels ; une action destructive n'est jamais déclenchée par une simple sélection. — *source : `S/13…:2917`*

**Notes :** Les textes des messages d'erreur de référentiel ne sont pas définis par les sources ; P34 conserve ceux du code de départ.

#### FR-20-11 : Scénarios de recette des référentiels
**Conséquences (testables) :**
- Une Catégorie et une Zone, chacune utilisée et non utilisée ; Catégorie choisie, annulée, créée, recolorée ; Zones 0, 1 et N ; noms vide et dupliqué ; suppression d'une valeur initiale et d'une valeur personnelle ; ancienne affectation retirée enregistrée ; nouvelle affectation d'une valeur retirée impossible ; renommage sans changement d'identifiant ; silhouette du Profil dans ses deux variantes. — *source : `S/13…:157,2945-2947`*

**Hors périmètre :** Étiquettes et Profil (PRE3-PERIM §3). Exception, décision Q53 (8) de Hermann (2026-10-18) : la règle des valeurs retirées s'applique aussi à l'Étiquette de Séance (spec 4.3, Spec Change Log).

**Référence visuelle :** `8328:35810`, `8328:35932`, `8328:36056`, `8328:36348`, `8328:36441`, `8328:36536` (`8328:35932` et `8328:36441` sont antérieures à D-354).

---

### 4.21 Médias, côté interface (ED-21)

**Description :** L'utilisateur ajoute des photos ou vidéos locales depuis la zone Média de l'Éditeur ; elles sont enregistrées avec l'Exercice, dans leur ordre, à `Terminer`. Le comportement PRE-3 accepté est conservé, sans invention de limite, de source ni de permission (P18). ED-21 est une exigence de non-régression, complétée par une capacité de consultation dans l'Éditeur décidée par Hermann (Q27, FR-21-05) : lecture d'une vidéo et plein écran par le lecteur natif, sans lecture automatique. Les règles de données (associations, fichiers partagés, copies, suppression physique) sont rédigées dans la section données, à partir de FR-21-50 ; elles ne sont pas répétées ici.

**Exigences fonctionnelles :**

#### FR-21-01 : Ajouter un Média depuis l'Éditeur
L'utilisateur peut ajouter un Média local depuis la zone Média de l'Éditeur.
**Conséquences (testables) :**
- La zone Média propose l'ajout de Médias locaux dans les quatre Parcours d'édition ; les Médias ajoutés sont enregistrés avec l'Exercice à `Terminer` (au Brouillon de Composition en Séance). — *source : D-333 `S/07…:539` ; `S/13…:544,564` ; `S/08…:220` ; FR-01-05*
- Aucune caméra n'est activée implicitement ; aucune limite (nombre, taille, durée) n'est ajoutée ; les sources système, formats et permissions restent ceux du code de départ. — *source : `S/13…:564` ; `S/04…:348` ; `S/11…:255,263` ; P18*
- Un nouveau Média s'affiche en dernière position. — *source : D-115 ; `S/09…:496,613` (détail : FR-21-50 et suivants)*

#### FR-21-02 : Galerie, ordre affiché et actions de consultation
L'utilisateur voit ses Médias dans leur ordre, dans une galerie horizontale ; il consulte un Média en touchant sa tuile (lecture d'une vidéo, plein écran d'une photo, FR-21-05) et ouvre le menu Retirer / Monter / Descendre par un appui long (Q31).
**Conséquences (testables) :**
- Rendu de référence : galerie horizontale ordonnée, aperçu du Média suivant tronqué, tuile d'ajout avec l'icône vectorielle `icon/ajouter` (jamais un « + » typographique). — *source : `S/12…:829-832` ; `8328:35698`, `8328:35740`*
- Toucher la tuile d'une vidéo la lit en plein écran par le lecteur natif ; toucher la tuile d'une photo l'affiche en plein écran ; leur comportement est celui de FR-21-05. Aucun bouton n'est ajouté sur la tuile : les pictogrammes de lecture et de plein écran de la référence visuelle, s'ils sont rendus, sont une indication non touchable, et la tuile entière est la cible. Aucune lecture ne démarre sans ce toucher ; un appui long ne lance aucune lecture. — *source : Q27 ; Q31 (D-335 amendée) ; `S/12…:829-832` (aperçu et galerie) ; `8328:35740` (pictogrammes, visuel seulement)*
- Un appui long sur une tuile ouvre le menu contextuel natif `Retirer` / `Monter` / `Descendre`, sans `Monter` sur le premier Média ni `Descendre` sur le dernier ; un toucher simple n'ouvre plus ce menu. Les actions VoiceOver `Retirer {item}`, `Monter {item}`, `Descendre {item}` restent l'alternative à l'appui long (FR-22-09). — *source : Q31 (D-335 amendée sur le geste) ; code de départ `ActivityMediaList.tsx:190-229` (options et actions accessibles) ; NFR-03*
- La zone Média reste sous la Carte Paramètres d'exécution en cas de chevauchement. — *source : `S/08…:220,1566`*
- Après `Terminer`, fermeture et réouverture, les Médias réapparaissent dans le même ordre et avec la même identité. — *source : `S/09…:613` ; D-115 ; Q7:21.1*
- Le premier Média de la galerie (image de couverture pour une vidéo) est la vignette de la carte du Catalogue : l'ordre défini dans l'Éditeur la détermine. — *source : D-264 `S/07…:398` ; `S/13…:165`*
- Retirer ou réordonner un Média reste possible sans régression, par le menu de l'appui long et par les actions VoiceOver ; seul le geste d'ouverture du menu change (Q31) ; le retrait ne supprime que l'association (FR-21-50 et suivants). — *source : P18 ; Q31 ; `S/11…:263` ; `S/09…:498`*

#### FR-21-03 : Import annulé ou en erreur
L'utilisateur peut annuler un import ou réessayer après une erreur, sans perdre son Brouillon.
**Conséquences (testables) :**
- Un import annulé ne modifie ni la galerie ni le Brouillon de l'Éditeur. — *source : `S/13…:564` ; PRE3-PERIM:248 (P3-23)*
- Un import en erreur laisse le Brouillon intact et l'utilisateur peut relancer l'ajout. — *source : PERIM:39 (« erreurs/réessai ») ; Q7:21.2 ; P18*
- Scénarios de recette : import nominal, annulé, en erreur ; conservation à la réouverture ; ordre ; Copies indépendantes. — *source : `S/13…:564` ; PRE3-PERIM:248 (P3-23)*

**Notes :**
- Non repris : Q7:21.3 (erreurs « bornées », D non définie ; `S/13…:564` interdit d'inventer une limite). Q7:21.4 (« leases » de brouillon) est un mécanisme technique (T), transmis à l'architecture. Q7:21.5 et Q7:21.6 relèvent de la section données.
- Rappel : le rendu de l'état d'erreur d'import et de l'action de réessai, ainsi que du réordonnancement et du retrait, n'a ni capture ni règle d'écran (`S/13…:564` « À CLARIFIER ») ; P18 conserve le comportement PRE-3 (menu natif), ouvert désormais par appui long (Q31). Ce rendu est soumis à la validation visuelle de Hermann à la recette iPhone.

#### FR-21-04 : Pas de lecture d'exécution
Le système n'ajoute aucune lecture de Média pendant l'Exécution. Cette exclusion ne vise que l'Exécution : la consultation d'un Média dans l'Éditeur relève de FR-21-05 (Q27).
**Conséquences (testables) :**
- PRE-4 n'ajoute aucun moteur de lecture des Médias pendant l'exécution (D-203, D-216, contrats CE-MEDIA-EXEC-01/02 hors périmètre). — *source : `S/13…:636` ; PRE3-PERIM:58 ; Q27*
- La consultation dans l'Éditeur (FR-21-05) n'importe, ne crée et ne modifie aucun module d'Exécution. — *source : Q27*

#### FR-21-05 : Consulter un Média dans l'Éditeur (lecteur natif)
L'utilisateur peut, depuis la galerie de l'Éditeur, lire une vidéo et la voir en plein écran par le lecteur natif du système, ou afficher une photo en plein écran, sans lecture automatique et sans perdre son Brouillon.
**Conséquences (testables) :**
- Aucune lecture automatique : ouvrir l'Éditeur, faire défiler la galerie, ouvrir ou fermer la Feuille ne lit aucune vidéo et n'émet aucun son. — *source : Q27 (« sans lecture automatique ») ; par analogie, `S/13…:1957` (« aucun flash/autoplay »)*
- Lecture à la demande : toucher la tuile d'une vidéo la lit dans le lecteur natif du système, en plein écran natif, avec ses contrôles natifs ; aucune commande de lecture ni aucun plein écran n'est réimplémenté (NFR-02). — *source : Q27 ; Q31 ; NFR-02 ; `AGENTS.md`*
- Photo : toucher la tuile d'une photo l'affiche entière en plein écran, avec une action de fermeture. — *source : Q27 ; Q31*
- Menu à l'appui long : un appui long sur la tuile ouvre le menu contextuel natif `Retirer` / `Monter` / `Descendre` (FR-21-02) et ne lance aucune consultation ; aucun bouton n'est ajouté sur la tuile. — *source : Q31 (D-335 amendée)*
- Retour sans perte : fermer le plein écran revient à l'Éditeur dans son état antérieur ; le Brouillon de l'Éditeur, l'ordre des Médias et la base sont inchangés. — *source : Q27 ; FR-18-17*
- Indépendance de l'Exécution : la consultation n'a aucun effet sur le moteur d'Exécution, qui reste hors périmètre (FR-21-04). — *source : Q27*
- Vidéo illisible ou fichier absent : un état d'erreur s'affiche, sans plantage ni fermeture de l'Éditeur ; le lien du Média n'est pas supprimé (FR-21-58). — *source : Q27 ; FR-21-58 ; par analogie, `S/13…:1953` (« Erreur locale visible à la place du média »)*
- Accessibilité : l'activation VoiceOver de la tuile consulte le Média ; la consultation est annoncée « Lire la vidéo » ou « Agrandir le média », par analogie avec le contrat d'écran d'Exécution, textes du lexique ; les actions VoiceOver `Retirer {item}`, `Monter {item}`, `Descendre {item}` restent disponibles sur la tuile, comme alternative à l'appui long ; la tuile a une cible d'au moins 44 × 44 pt ; le focus revient à la tuile à la fermeture du plein écran. — *source : par analogie, `S/13…:1957` (« Labels … Lire la vidéo et Agrandir le média ») ; Q31 ; NFR-09 ; [ASSUMPTION: H13] ; [ASSUMPTION: H23]*

**Notes :** décision de Hermann du 2026-10-16 (Q27), prise après la revue ChatGPT (R3) : les sources ne définissent la lecture et le plein écran que pendant l'Exécution (D-203, D-216, CE-MEDIA-EXEC-01/02, hors périmètre) ; pour l'Éditeur, elles prévoient un aperçu et une galerie (`S/12…:829-832`), et la capture `8328:35740` montre des pictogrammes de lecture et de plein écran. Le choix du lecteur relève de l'architecture (AD-17). Le geste a été fixé par Hermann le 2026-10-16 (Q31), après la porte post-revue (M2) : toucher la tuile consulte, l'appui long ouvre le menu ; D-335 (« aucun bouton supplémentaire ») est amendée sur le seul geste du menu, sans bouton ajouté. Le contrat d'écran d'Exécution n'est cité que par analogie, pour les libellés et l'absence d'autoplay ; ses autres règles (changement de face, pagination, ducking, moteur) ne s'appliquent pas.

**Référence visuelle :** `8328:35698`, `8328:35740`. Le plein écran natif n'a pas de frame (`NON VÉRIFIABLE` sur Figma, jugé par Hermann).

---

### 4.21b Préservation des Médias, côté données (ED-21)

**Description :** Un Exercice porte de 0 à n Médias dans un ordre. Les fichiers ne sont pas dans la base ; ils sont partagés entre la Définition d'Exercice, ses Copies en Séance, les duplications et les Instantanés. Aucun fichier encore référencé n'est jamais supprimé. La migration de PRE-4 ne touche ni les Médias, ni leur ordre, ni les fichiers.

**Exigences fonctionnelles :**

#### FR-21-50 : Médias ordonnés, ordre conservé
Le système conserve pour chaque Exercice une liste ordonnée de 0 à n Médias, chacun à une position unique. Un Média ajouté prend la dernière position ; réordonner ne touche que les positions de cet Exercice. L'ordre est conservé à l'enregistrement, à la réouverture, à la copie et à la duplication.
**Conséquences (testables) :**
- Après import, réordonnancement, Terminer et réouverture, les Médias sont relus dans l'ordre affiché avant Terminer, avec la même identité. — *source : `ch09:611-613` ; `ch09:496` ; `ch13:564` ; `PERIM:39` ; R21-01 ; R21-08 ; 21.1*
- Deux Médias d'un même Exercice n'ont jamais la même position. — *source : `ch09:613` ; R21-01*
- Réordonner les Médias d'un Exercice ne change pas l'ordre des Médias d'une copie de cet Exercice. — *source : `ch09:496` ; R21-01*
- La vignette de carte utilise le premier Média dans l'ordre enregistré. — *source : `ch04:403` ; `PRE3-PERIM:248` (P3-23) ; R21-08*

#### FR-21-51 : Fichiers hors base, référence stable
Le système ne stocke pas les fichiers de Médias dans la base ; il conserve pour chaque Média une référence interne stable, son type photo ou vidéo, une miniature éventuelle et ses métadonnées.
**Conséquences (testables) :**
- Après enregistrement, la base ne contient aucun contenu de fichier ; chaque Média relu pointe vers un fichier existant par une référence inchangée depuis l'import. — *source : `ch09:613` ; `ch12:1355` ; `ch12:692` ; R21-02*

#### FR-21-52 : Médias enregistrés avec l'Exercice
Le système conserve dans le Brouillon de l'Éditeur les Médias existants et ajoutés, dans leur ordre, et ne les enregistre qu'avec l'Exercice, à l'enregistrement validé (FR-18-17).
**Conséquences (testables) :**
- Avant Terminer, aucun lien de Média ajouté dans l'Éditeur n'existe en base ; après Terminer, tous existent dans l'ordre du Brouillon. — *source : `ch13:560` (§5) ; `ch13:564` ; R21-03*

#### FR-21-53 : Copies et duplications partagent les fichiers
Le système crée, à la copie ou à la duplication d'un Exercice ou d'une Séance, de nouveaux liens de Médias qui référencent les mêmes fichiers physiques, sans dupliquer ni supprimer de fichier.
**Conséquences (testables) :**
- Après copie Catalogue → Séance ou duplication, le nombre de fichiers de Médias sur l'appareil est inchangé, et la copie référence les mêmes fichiers que la source, dans le même ordre. — *source : `ch09:497` ; `ch09:915-917` ; `ch10:197` (RM-115) ; `ch07:103` (D-066) ; `ch07:105` (D-068) ; `ch07:147` (D-115) ; `ch12:393` ; R21-04 ; 19c.2 ; 19c.3*
**Notes :** « nouvelle association/entité Média » (`ch09:497`) se lit comme un nouveau lien ; le fichier est partagé (C-10).

#### FR-21-54 : Retirer un Média ne retire que son lien
Le système, lorsqu'un Média est retiré d'un Exercice, ne supprime que le lien de cet Exercice vers ce Média.
**Conséquences (testables) :**
- Après retrait d'un Média d'une Copie en Séance puis Continuer, la Définition d'Exercice source et les autres copies gardent ce Média, et le fichier existe toujours. — *source : `ch09:498` ; `ch07:103` (D-066) ; R21-05 ; 21.5*

#### FR-21-55 : Aucun fichier encore référencé supprimé
Le système ne supprime un fichier de Média que lorsque plus aucune Définition d'Exercice, Copie en Séance ou Instantané ne le référence, en comptant les usages actifs et historiques avant tout nettoyage. Un Exercice ou une Séance archivés comptent comme références.
**Conséquences (testables) :**
- Un fichier référencé par au moins une Définition d'Exercice, une Copie en Séance ou un Instantané existe toujours après toute opération de PRE-4 (enregistrement, retrait, suppression d'un autre Exercice, abandon, migration). — *source : `ch09:498` ; `ch09:613` ; `ch09:917` ; `ch12:1355` ; `ch11:263` (API-MED-01..05) ; `ch07:539` (D-333) ; `PERIM:39` ; R21-06 ; 21.5*
- Un fichier référencé uniquement par un Instantané est conservé. — *source : `ch09:552` ; `ch09:565` ; `ch09:588` ; `ch11:147` ; `ch12:416` ; R21-07*
- Un fichier référencé uniquement par un Exercice ou une Séance archivés est conservé. — *source : H12 ; M-09*
**Notes :** [ASSUMPTION: H12 — un Média reste « référencé » tant qu'une Définition d'Exercice ou une Séance, même archivée, le référence.]

#### FR-21-56 : Import annulé ou en erreur sans lien ni fichier orphelin
Le système, lorsqu'un import de Média est annulé ou échoue, ne crée aucun lien de Média et ne laisse aucun fichier référencé orphelin. Un réessai réussi produit un seul Média, à la dernière position.
**Conséquences (testables) :**
- Après un import annulé, puis Terminer, l'Exercice relu a les mêmes Médias qu'avant l'import. — *source : `ch13:564` ; `PRE3-PERIM:248` (P3-23) ; R21-09*
- Après un import en erreur puis un réessai réussi et Terminer, l'Exercice relu porte un seul Média de plus, à la dernière position. — *source : `ch13:564` ; `PERIM:39` (« erreurs/réessai ») ; R21-09 ; 21.2*
**Notes :** le comportement détaillé des erreurs et du réessai (messages, sources, formats, permissions) n'est pas spécifié (M-06, `ch13:564` « À CLARIFIER ») : le comportement accepté de PRE-3 fait référence (P18), sans invention de limite. L'assertion « erreurs bornées » (21.3, classe D) n'est pas reprise : le terme n'est pas défini et `ch13:564` interdit d'inventer une limite. Le devenir d'un fichier importé seulement pour un Brouillon abandonné suit le cycle existant de PRE-3.

#### FR-21-57 : Migration sans effet sur les Médias
Le système ne modifie, lors de la migration de l'Ancien mode À l'échec et de la refonte des Paramètres d'exécution, ni les liens de Médias des Exercices migrés, ni leur ordre, ni les fichiers. Seuls les liens de Médias d'un Exercice écarté pour paramètres illisibles sont supprimés avec lui (FR-18-20, Q19).
**Conséquences (testables) :**
- Sur la base de FR-18-19, les liens de Médias de chaque Exercice migré, leur nombre et leur ordre sont identiques avant et après migration. — *source : `ch09:1256` (« autres paramètres ») ; `ch09:410-450` ; `ch09:1260` ; R21-10 ; 18m.7*
- Sur la variante de FR-18-19 contenant des Exercices illisibles, aucun lien de Média ne référence plus un Exercice écarté. — *source : Q19*
- Les fichiers de Médias présents avant migration existent tous après migration, avec un contenu inchangé, y compris ceux des Exercices écartés. — *source : FR-21-55 (aucun fichier encore référencé n'est supprimé) ; règle « aucune suppression physique » de la migration (Q19 ne prescrit aucune suppression physique ; FR-18-20, quatrième conséquence ; `ch09:498` : retirer une association ne supprime que l'association)*
**Notes :** la troisième conséquence est rattachée à FR-21-55 et à la règle « aucune suppression physique » de la migration ; l'assertion 21.6 de classe D (« la migration ne touche aucun média ») lui est cohérente mais n'en est pas la source.

#### FR-21-58 : Média indisponible sans perte de lisibilité
Le système relit un Exercice, une Copie en Séance ou un Instantané même si l'un de ses fichiers de Médias est indisponible ; le lien n'est pas supprimé pour autant.
**Conséquences (testables) :**
- Un Exercice dont un fichier de Média a disparu est relu avec tous ses autres paramètres et tous ses liens de Médias, sans erreur de lecture. — *source : `ch12:403` ; `ch10:248` (RM-203.11) ; R21-11*
**Notes :** la consultation en exécution relève du moteur, hors périmètre.

**Non repris dans cette sous-section :** la capture caméra non activée implicitement (R21-12, `ch05:199`, `ch11:263`) relève de la partie interface d'ED-21 (FR-21-01 à FR-21-49).

---

### 4.22 Fidélité et accessibilité (ED-22)

**Description :** Chaque surface de l'Éditeur, de la Feuille, des Sélecteurs de cible et des référentiels est conforme à son contrat, état par état, et utilisable avec VoiceOver, le texte agrandi et sans geste exclusif, aux largeurs 360, 402 et 440. Les tests automatisés, les comparaisons de captures et la perception sur appareil sont trois preuves distinctes ; la validation visuelle et tactile appartient à Hermann.

**Exigences fonctionnelles :**

#### FR-22-01 : Conformité complète, état par état
Chaque surface livrée satisfait son contrat, les règles communes, les règles métier et le DSF.
**Conséquences (testables) :**
- Une ressemblance partielle ne suffit pas ; l'absence ou la substitution d'un élément obligatoire est bloquante. — *source : `S/06…:81-83`*
- Chaque contrôle est vérifié par état avec ses propriétés observées : composant et variante, jeton, géométrie, typographie, couleurs, effets, comportement adaptatif, frame Figma de référence ; une mention « conforme Figma » ne suffit pas. — *source : PRE3-PERIM:155 ; PERIM:40 ; `S/13…:194-196`*
- Chacune des 32 frames de référence (table ci-dessous) est présentée dans le périmètre de l'Éditeur, rendue selon ses propriétés visuelles (position relative, marges, typographie, couleur, contour), sans coordonnées absolues ; données métier indépendantes des exemples des captures. Pour l'écran principal, le relevé bloc par bloc est exigé par FR-02-13. — *source : `references-figma.json` ; `S/06…:57,98` ; `S/12…:709,727` ; `S/10…:72,635` ; `S/13…:2979` ; Q7:F.1, F.2, F.4*
- Les interactions documentées et les actions accessibles sont conservées dans chaque état. — *source : PERIM:40 ; Q7:F.5*
- Le texte de fond de `8328:38848` qui énumère des pauses variables n'est pas reproduit ; la Phrase suit la règle écrite (ED-16). — *source : P1 ; `S/08…:637,664` ; Q7:F.6*
- Une frame de référence de composant n'est jamais promue au rang d'écran ou de modale. — *source : `B/06…:2307` (Δ10)*
- Aucun composant graphique absent de Figma n'est inventé : il est classé `NON VÉRIFIABLE` ou `À CLARIFIER`. — *source : `S/13…:27` ; `S/06…:2238`*

#### FR-22-02 : Trois preuves séparées
La conformité visuelle et tactile n'est jamais déduite des tests.
**Conséquences (testables) :**
- Les résultats de tests automatisés, les comparaisons de captures et la perception sur appareil réel sont consignés séparément. — *source : PERIM:40 ; PRE3-PERIM:155*
- Une suite de tests verte ne vaut jamais, à elle seule, preuve visuelle ou tactile sur appareil réel ; un test de calcul ne prouve pas le layout ; la validation visuelle appartient à Hermann (recette iPhone, Q5). — *source : AGENTS.md ; `S/10…:784` ; `S/13…:196` ; Q5*

**Notes :** Q7:F.3 et F.10 (propriétés « figées », `proof_required`) sont des mécanismes VNext (T), non repris.

#### FR-22-03 : Primitives natives
L'interface utilise les primitives natives iOS ou Android disponibles et ne remplace pas un composant déjà accepté.
**Conséquences (testables) :**
- Lorsqu'une primitive native existe pour l'interaction (roulettes, popovers, menus), elle est utilisée plutôt qu'une réimplémentation, un assemblage de défilements ou une imitation graphique ; une adaptation de rendu se fait autour de la primitive, sans remplacer son mécanisme. — *source : AGENTS.md ; P9*
- Le mécanisme d'interaction d'une primitive native déjà acceptée (roulettes natives existantes, glisser des lignes, menus natifs des Médias) n'est pas remplacé ; un contrôle PRE-3 n'est changé que lorsqu'une ED ou une décision Q le prescrit (liste fermée en NFR-03) ; une difficulté de style, une absence de test ou l'impossibilité d'obtenir une capture ne justifient jamais un remplacement. Les garde-fous existants (aucun défilement de substitution sur iOS) restent verts et ne sont pas affaiblis. — *source : AGENTS.md ; NFR-03 ; D-219 `S/07…:294` ; `S/12…:1481` ; RM-104 `S/10…:186`*
- La roulette dont le bloc minutes-secondes est en Grisé manipulable n'est pas désactivée nativement : elle reste manipulable (ED-08). Sa qualification native et accessible se fait sur appareil. — *source : `D/DSF-DEUX-MODES…:33-35` ; `S/12…:1597` ; `S/13…:3055` ; Q7:22t.2*

**Notes :** Le choix de la primitive native des popovers n'est pas présupposé ici : il relève de l'architecture.

#### FR-22-04 : Cibles tactiles
L'utilisateur peut toucher chaque contrôle sans erreur.
**Conséquences (testables) :**
- Chaque cible tactile mesure au moins 44 × 44 pt, sans chevauchement ; les cibles spécifiques de 48 × 48 sont conservées (fermeture et actions circulaires, Disclosure) ; 8 pt entre cibles adjacentes. — *source : P30 ; D-087, D-234 ; RM-095 ; `S/13…:79,3047` ; `S/06…:129,144-147` ; `D/DSF-INTERFACE…:87`*
- La cible tactile est indépendante du dessin : la poignée (12 × 18), les cellules (76 × 24) et l'option échec (30 de haut) ont une cible d'au moins 44 × 44 sans que leur dessin soit agrandi. — *source : `D/DSF-DEUX-MODES…:53` ; `D/DSF-CIRCUITS…:30` ; `S/12…:1145` ; Q7:22.7*

**Notes :** Non repris : cible commune de 48 pt (section Q7, `S/12…:1089`), contradiction X1 résolue par P30.

#### FR-22-05 : Texte agrandi
L'utilisateur peut utiliser l'Éditeur et la Feuille avec le texte agrandi du système.
**Conséquences (testables) :**
- Le texte suit le réglage de taille du système, sans réduction automatique ; vérification à 100 %, 135 % et ≈ 200 %. — *source : `S/12…:978,1165-1175` ; `S/13…:3005` ; `D/DSF-DEUX-MODES…:53` ; Q7:22.2*
- Aucune hauteur fixe ne rogne un texte, une Phrase des paramètres ou des commandes ± ; l'en-tête de la Feuille reste accessible. — *source : `S/12…:1165-1175` ; `S/13…:3005` ; Q7:22.5*

#### FR-22-06 : Largeurs d'écran
L'interface reste complète sur les largeurs de référence.
**Conséquences (testables) :**
- Contrôle à 360, 402 et 440 (et 390, 430) : aucun chevauchement, aucune action essentielle masquée, aucun contenu sous le clavier ou les barres système, aucun débordement horizontal. — *source : `S/12…:1165-1175` ; `S/13…:75,80,594,3005` ; `S/06…:94` ; Q7:22.1, 22.5*
- Seule exception : `Terminer` reste sous le clavier ouvert (FR-02-08). — *source : D-349*

#### FR-22-07 : VoiceOver dans l'Éditeur
L'utilisateur de VoiceOver peut parcourir et modifier l'Éditeur.
**Conséquences (testables) :**
- La Carte Paramètres d'exécution a un seul focus, de libellé `Modifier les paramètres d’exécution`, et sa Phrase est lue en entier ; aucune valeur estimée n'est annoncée comme saisissable ; le focus revient à la Carte à la fermeture de la Feuille. — *source : `S/13…:632,4265` ; Q7:22e.4*
- Le champ Nom, le champ Description, l'action de fermeture et chaque accès Catégorie / Zones ont un libellé accessible ; les accès annoncent la Catégorie et les Zones choisies. — *source : [ASSUMPTION: H13] ; Q7:22e.1, 22e.2*
- Ordre de lecture : en-tête → Nom → accès Catégorie et Zones → Description → Carte Paramètres d'exécution → Médias → `Terminer`. — *source : [ASSUMPTION: H13] ; P7 ; Q7:22e.3*

#### FR-22-08 : VoiceOver dans la Feuille et les Sélecteurs de cible
L'utilisateur de VoiceOver peut régler tous les Paramètres d'exécution.
**Conséquences (testables) :**
- Le focus reste confiné dans la Feuille ouverte (FR-03-01) ; ✕ et ✓ ont un libellé accessible ; le Régime variables est annoncé. — *source : `S/13…:3047` ; [ASSUMPTION: H13] ; Q7:22s.1, 22s.2, 22s.3*
- Une valeur en lecture seule est annoncée avec sa valeur et son origine (jamais un tiret) ; la Cellule active est identifiée par sa ligne et sa colonne (`Série i · Durée`), pas seulement par la couleur. — *source : `S/13…:3045,4223`*
- `Bip de cadence` : nom accessible `Bip de cadence`, valeur `Aucun` ou intervalle en secondes ; augmenter, diminuer et limites annoncés. — *source : `S/13…:3047`*
- Total ≈ annoncé comme estimation, total ≥ comme total prévisionnel partiel, et le total comme non modifiable. — *source : `S/13…:3047` ; `D/DSF-DEUX-MODES…:53` ; Q7:22s.5*
- L'option échec (`Aucune durée, à l’échec`, `Aucune répétition, à l’échec`) est annoncée sélectionnée ou non sélectionnée ; une Cible à l'échec est annoncée ; le grisé n'est jamais le seul indicateur. — *source : `S/13…:3047` ; `D/DSF-DEUX-MODES…:53` ; Q7:22s.4, 22t.1, 22t.4*
- La valeur et l'unité de la Cible sont annoncées dans le Sélecteur de cible. — *source : [ASSUMPTION: H13] ; Q7:22t.3*
- Les directions du Changement de côté sont annoncées en toutes lettres (FR-03-07). — *source : D-143*
- Les textes exacts des annonces VoiceOver sont créés dans le lexique (RM-092, D-081), avec le vocabulaire du glossaire ; Hermann les valide à la recette. — *source : [ASSUMPTION: H23] ; RM-092*

**Notes :** Les textes d'annonce exacts ne sont définis par aucune source ; ils relèvent de [ASSUMPTION: H23].

#### FR-22-09 : Alternatives aux gestes
L'utilisateur peut effectuer toute action sans geste exclusif (maintien, glisser).
**Conséquences (testables) :**
- Réordonner une Série, la retirer et régler une valeur au-delà du pas simple sont possibles sans glisser ni maintien, y compris avec VoiceOver ; la poignée a une alternative accessible. — *source : `S/13…:3023,3047` ; `D/DSF-CIRCUITS…:30` ; PRE3-PERIM:246 (P3-21) ; PERIM:40 ; Q7:22.4, 22s.6*
- Le menu des Médias, ouvert par appui long (Q31), a pour alternative les actions VoiceOver `Retirer {item}`, `Monter {item}`, `Descendre {item}` de la tuile ; l'activation de la tuile consulte le Média (FR-21-05). — *source : Q31 ; code de départ `ActivityMediaList.tsx:228-229`*

**Notes :** La forme de l'alternative (actions personnalisées VoiceOver, boutons) est un choix de solution, non présupposé.

#### FR-22-10 : Référentiels accessibles
L'utilisateur de VoiceOver peut choisir, créer, modifier et supprimer des Catégories et des Zones.
**Conséquences (testables) :**
- Chaque option annonce son nom et son état sélectionné ; la couleur d'une Catégorie est toujours accompagnée de son nom ; les actions ont des libellés accessibles ; toutes les Zones sélectionnées sont lisibles. — *source : `S/13…:2905,2937`*
- Le focus est confiné à la feuille ou au dialogue ouvert ; il va au dialogue à son ouverture, puis revient à la liste. — *source : `S/13…:2905,2937`*
- L'action d'ajout inactive (nom vide) est perçue comme désactivée autrement que par la couleur. — *source : `S/06…:148` ; Q7:22r.1*
- À la fermeture d'une feuille de référentiel, le focus revient à l'accès Catégorie ou Zones qui l'a ouverte. — *source : [ASSUMPTION: H13] (retour du focus à la fermeture d'une feuille) ; Q7:22r.4*

#### FR-22-11 : Surface ouverte et actions extérieures
Pendant qu'une roulette est ouverte, aucune action extérieure n'est déclenchable.
**Conséquences (testables) :**
- Une roulette ouverte rend `Terminer` et les autres actions extérieures inactifs, aussi par VoiceOver et TalkBack ; dans la Feuille, l'Éditeur est déjà inerte (FR-03-01). — *source : D-174 `S/07…:221` ; RM-164 `S/10…:234` ; `S/06…:181` ; `S/13…:129,594`*

#### FR-22-12 : États, appuis et lexique
L'utilisateur perçoit les états des contrôles sans dépendre de la couleur.
**Conséquences (testables) :**
- États actif, pressé, désactivé, sélectionné et destructif exprimés par des jetons sémantiques, jamais par la seule couleur. — *source : `S/06…:148`*
- Appui : dilatation au contact, action au relâchement, aucune action si le doigt sort de la cible ; avec « Réduire les animations », rendu par opacité seule. — *source : D-237 ; `S/06…:89` ; `S/13…:167`*
- Tous les textes, y compris les libellés d'accessibilité, passent par le lexique de clés ; MVP en français sans sélecteur de langue. — *source : D-081, RM-091, RM-092 ; `S/12…:52`*

#### Table des 32 frames de référence

Noms tirés de `docs/preparation/PRE-4/references-figma.json` (tous au ch. 06, `S/06…:1129-1331`). Toutes relèvent aussi d'ED-22. Figma ne fixe que le visuel (D-255, D-300) ; les textes « Modalités d’exécution » des captures ne sont pas repris (Q11).

| # | Frame | Nom | ED illustrés |
|---|---|---|---|
| 1 | `8328:36711` | Création exercice — Avant Paramètres d'exécution | ED-02 |
| 2 | `8328:36853` | Création exercice — Paramètres — Champ vide | ED-02 |
| 3 | `8328:37022` | Création exercice — Paramètres — Résumé affiché | ED-02, ED-16 (lignes Compte à rebours / Fin absentes : P17) |
| 4 | `8328:35698` | Ajouter un exercice — Initial | ED-02, ED-21, ED-01 |
| 5 | `8328:35740` | Ajouter un exercice — Nom Description Media | ED-02, ED-21 |
| 6 | `8328:36278` | Ajouter un exercice — Catégorie renseignée | ED-02, ED-20 |
| 7 | `8328:36923` | Création exercice — Paramètres (modale) — Champs vides | ED-03, ED-04 |
| 8 | `8328:37092` | Création exercice — Paramètres (modale) — Mode d'exécution (popover) | ED-03, ED-05 |
| 9 | `8328:37760` | Création exercice — Paramètres (modale) — Série en durée | ED-03, ED-09 |
| 10 | `8328:37862` | Création exercice — Paramètres (modale) — Durée d'une série (roulette) | ED-07, ED-08, ED-03 |
| 11 | `8328:37972` | Création exercice — Paramètres (modale) — Changement de côté (popover) | ED-03 |
| 12 | `8328:38084` | Création exercice — Paramètres (modale) — Durée totale (roulette) | ED-14, ED-03 |
| 13 | `8328:38193` | Création exercice — Paramètres (modale) — Un côté après l'autre | ED-03, ED-13 |
| 14 | `8328:38301` | Création exercice — Paramètres (modale) — Les deux côtés à chaque série | ED-03, ED-13 |
| 15 | `8328:38409` | Création exercice — Paramètres (modale) — Durée totale ajustée (message) | ED-14 |
| 16 | `8328:38513` | Création exercice — Paramètres (modale) — Mode d'exécution (popover) — séries variables | ED-03, ED-05, ED-10 |
| 17 | `8328:38632` | Création exercice — Paramètres (modale) — Séries variables en durée | ED-04, ED-10 |
| 18 | `8328:38741` | Création exercice — Paramètres (modale) — Séries variables en répétitions | ED-04, ED-10 |
| 19 | `8328:38848` | Création exercice — Paramètres (modale) — Séries variables à l'échec | ED-06, ED-10, ED-13 (texte de fond non normatif, P1) |
| 20 | `8470:13303` | Modalités d'exécution — Séries variables, cas mixte | ED-06, ED-13, ED-14 |
| 21 | `8328:38953` | Création exercice — Paramètres (modale) — Ordre des côtés (popover) | ED-03 |
| 22 | `8328:39072` | Création exercice — Paramètres (modale) — Une seule série | ED-12, ED-04 (FR-12-04 : N = 1 normalisé, Régime non modifiable ; FR-04-05) |
| 23 | `8328:39181` | Création exercice — Paramètres (modale) — Séries variables (tableau replié) | ED-04 (FR-04-02 : tableau replié par le chevron, en `variables`) |
| 24 | `8328:39279` | Création exercice — Paramètres (modale) — Séries variables (déplacement) | ED-12, ED-03 |
| 25 | `8328:39390` | Création exercice — Paramètres (modale) — Mode des séries (popover) | ED-04, ED-03 |
| 26 | `8328:35810` | Ajouter un exercice — Catégories | ED-20 |
| 27 | `8328:35932` | Ajouter un exercice — Catégorie — Appui long — Confirmation suppression | ED-20 (antérieure à D-354) |
| 28 | `8328:36056` | Ajouter un exercice — Nouvelle catégorie | ED-20 |
| 29 | `8328:36348` | Ajouter un exercice — Zones corporelles | ED-20 |
| 30 | `8328:36441` | Ajouter un exercice — Zones corporelles — Appui long — Confirmation suppression | ED-20 (antérieure à D-354) |
| 31 | `8328:36536` | Ajouter un exercice — Nouvelle zone corporelle | ED-20 |
| 32 | `8328:36781` | Création exercice — Abandon (confirmation) | ED-02 (textes remplacés par Q18) |

États exigés sans frame parmi les 32 : « Modifier un exercice » ; menu d'appui long ✕ / `Modifier` / `Supprimer` (D-354) ; erreur d'import, réordonnancement et retrait d'un Média ; N hérité ; validation incomplète (fond `#FFF1F0`, Q35) ; douze Séries avec défilement ; phrase longue ; Répétitions avec option échec (Q8, Q14) ; abandon en modification. Leur rendu est validé par Hermann sur appareil (`S/06…:1335`).

---

## 5. Exigences transverses

### 5.1 Autorité des sources et rendu

- **NFR-01 — Règles contre Figma.** Les règles métier, calculs et comportements viennent des spécifications ; Figma ne définit que le layout et le rendu. Un chiffre lu sur une capture n'est jamais une règle (D-255, D-300). Un composant absent de Figma n'est pas inventé : il est classé NON VÉRIFIABLE (ch. 13).
- **NFR-02 — Primitives natives.** Quand une primitive native iOS existe pour l'interaction demandée (roulette, menu ou popover, feuille, interrupteur, champ texte), elle est utilisée plutôt qu'une réimplémentation ou une imitation graphique. Une difficulté de rendu se corrige autour de la primitive, sans remplacer son mécanisme d'interaction (`AGENTS.md`).
- **NFR-03 — Non-remplacement.** La règle vise le **mécanisme d'interaction des primitives natives déjà acceptées** : les roulettes natives (`DurationWheelPicker`, `NumberWheelPicker`, avec leurs garde-fous de test : zéro `ScrollView` sur iOS, `AGENTS.md`, « Pièges connus »), le glisser des lignes du Tableau des séries variables accepté en PRE-3 et les menus natifs des Médias (P18). Ce mécanisme n'est ni réimplémenté, ni remplacé, ni affaibli. Un contrôle PRE-3 n'est retiré ou changé que lorsqu'une exigence ED-01 à ED-22 ou une décision Q le prescrit explicitement ; liste fermée des changements prescrits :
  - interrupteur « Séries variables » retiré, Régime choisi par popover (ED-04 ; FR-04-01) ;
  - segmentés de Mode et de Changement de côté remplacés par des popovers ancrés (ED-03 ; P9, P10 ; FR-05-01, FR-03-07) ; depuis Q41, sur iOS, le Changement de côté et l'Ordre des côtés gardent le segmenté accepté, présenté dans un panneau sans flèche sous le champ (FR-03-07, FR-03-08) ;
  - stepper en ligne de la Cible Répétitions remplacé par une roulette native à une colonne (Q8, Q14 ; FR-07-03) ;
  - steppers permanents des cellules remplacés par le Pied commun et ± affichés à l'appui sur une valeur (ED-10 ; P11 ; FR-10-02, FR-03-05).

  Le nouveau contrôle est lui-même une primitive native quand elle existe (NFR-02). Aucun autre remplacement n'est admis ; une difficulté de style, une absence de couverture de test ou l'impossibilité d'obtenir une capture sur appareil ne le justifient jamais. Si la primitive native ne fournit pas le mécanisme prescrit, l'écart est signalé à Hermann (P33 ; FR-03-11).
- **NFR-04 — Preuve.** Une suite de tests verte ne vaut jamais preuve visuelle ou tactile sur appareil réel. La conformité visuelle et tactile est validée par Hermann sur iPhone (Q5, `recette-iphone.md`). Les tests, les comparaisons de captures et la perception sur appareil sont trois preuves distinctes, jamais substituées l'une à l'autre.
- **NFR-14 — Ordre de lecture des sources.** Chaque story et chaque implémentation d'écran lisent les sources dans cet ordre : ch. 07 (décisions validées, priorité aux supersédantes) → ch. 04, 09, 10 (modèle, données, règles métier) → ch. 11 (API) → ch. 12 (architecture) → ch. 06 (navigation, captures) → ch. 13 (contrat d'écran) → Figma en dernier, pour le visuel seulement. Les décisions Q de Hermann et les règles de priorité P de `questions-ouvertes.md` priment sur les sources qu'elles tranchent. (`AGENTS.md` ; ch. 13 §2 ; P4.)

### 5.2 Données

- **NFR-05 — Préservation.** Aucune donnée existante n'est perdue, réinitialisée ou réécrite sans nécessité : Définitions d'Exercice, Copies en Séance, Catégories, Zones corporelles, Médias, ordre, identifiants (P29, ED-18, ED-19, ED-21). **Seule exception, décidée par Hermann (Q19) :** un Exercice dont les paramètres sont illisibles est écarté par la migration, sans lien orphelin ni suppression en cascade d'une Séance, et le nombre d'Exercices écartés est signalé. Une valeur numérique négative ou non entière rend les paramètres illisibles (Q28) ; une valeur positive hors bornes ne les rend pas illisibles.
- **NFR-06 — Pas de valeur inventée.** Aucune Cible, aucune durée et aucune performance ne sont inventées pour combler une absence. Une valeur invalide n'est jamais convertie en Cible à l'échec ni arrondie silencieusement (ch. 09 l. 1246, 1270 ; ch. 13 l. 4106).
- **NFR-07 — Atomicité.** Un enregistrement ou une migration réussit entièrement ou ne laisse aucune trace partielle (ED-18). Pour la migration, l'écart d'un Exercice aux paramètres illisibles fait partie de la migration réussie et n'est pas un échec (Q19, FR-18-20) ; seule une erreur structurelle provoque l'annulation complète (FR-18-15, H6).

### 5.3 Interface et accessibilité

- **NFR-08 — Lexique.** Tous les textes d'interface passent par le lexique de clés (RM-092), en français, sans sélecteur de langue (RM-091). Les termes interdits du glossaire §8 n'apparaissent pas : « Set » comme terme métier (D-077), « Activité » à l'interface. Les textes d'interface et les gabarits de la Phrase emploient l'apostrophe typographique `’` (U+2019), comme le Corpus 276 et le lexique existant (C08 l. 622).
- **NFR-09 — Accessibilité.** Cibles tactiles d'au moins 44 × 44 pt (P30), libellés VoiceOver, état sélectionné annoncé sans dépendre de la seule couleur, alternatives aux gestes (glisser, appui long), texte agrandi sans troncature ni action finale inaccessible, aux largeurs 360, 402 et 440 pt (ED-22, ch. 06 l. 94, DSF2M l. 53).
- **NFR-10 — Animations.** Le réglage « Réduire les animations » du système est respecté par les feuilles, popovers et fermetures (D-343, comportement PRE-3). Dans la Feuille Paramètres d'exécution, l'apparition et la disparition d'une ligne, d'un sélecteur en ligne, d'une roulette en ligne, du tableau des séries variables et de ses lignes, ou du message d'ajustement sont fluides et **sans aucun fondu** (aucune opacité animée) : l'élément monte de bas en haut, révélé par un cadre de découpe dont la limite basse est la barre horizontale (séparateur) située sous lui — il sort de sous cette barre vers le haut — et disparaît en redescendant sous la même barre, pendant que les lignes voisines et la feuille glissent vers leur nouvelle place, sans saut ni fondu (même durée, même courbe) ; durée unique de 350 ms, sur le fil UI, sans animation exécutée sur le fil JavaScript ; le cadre D-4 d'un sélecteur dure aussi 350 ms ; un simple changement de sélection ne joue aucune transition de place ; les panneaux sans flèche (FR-03-07, FR-03-08, FR-03-11) apparaissent et disparaissent sans fondu ni mouvement ; avec « Réduire les animations », le changement est immédiat. — *source : Q39 (décision de Hermann du 2026-10-17, recette iPhone, écart E-13), durée et sens remplacés par Q40 (écart E-14), fondu supprimé et révélation par le bas sous la barre par Q41 (écart E-15)*

### 5.4 Qualité du code livré

- **NFR-11 — Contrôles.** Un changement n'est terminé qu'avec `npm test`, `npx tsc --noEmit` et `npm run lint` verts (`AGENTS.md`). Le push est bloqué ; ces trois contrôles locaux sont le seul filet.
- **NFR-12 — Persistance.** Tout accès à la persistance passe par les repositories, sans ORM (D-043). Le schéma initial `migration001` n'est jamais modifié ; un changement de schéma passe par une nouvelle migration numérotée à la suite des migrations existantes (`AGENTS.md`).
- **NFR-13 — Identifiants historiques.** Les identifiants techniques historiques (`ActivityDefinition`, `ACTIVITY`, `tour*`, `IN_TOUR`) ne sont pas renommés (D-201, D-202, D-207).

## 6. Non-objectifs

PRE-4 ne livre pas :
- la refonte de Composition, ses nouveaux parcours, les circuits de tours ou de séries, la grille Volumes, le placement complet des Récupérations et des Points d'arrêt (Q4, périmètre « Hors périmètre ») ;
- le moteur d'exécution, le chronomètre, les sons, la lecture des Médias en exécution ;
- le comptage des relevés, la saisie, correction ou restauration de performances, la Synthèse, le Suivi, la charge, l'étalon ;
- la refonte du Catalogue, du Profil ou du Calendrier ;
- le lot Formats (D-357 à D-369, CE-FMT) ;
- l'énumération des Pauses variables dans la Phrase des paramètres (P1, D-338) ;
- une nouvelle frame ou un état « Série à l’échec » uniforme (P2) ;
- l'héritage de N depuis un circuit de séries : la compatibilité est préservée, la fonction n'est pas implémentée (questions-ouvertes §4) ;
- tout libellé « Tour » ou « Circuit » dans l'Éditeur d'Exercice ;
- toute publication EAS, tout push, tout workflow et toute modification de Figma.

## 7. Périmètre

### 7.1 Dans le périmètre

ED-01 à ED-22 (§4), et les adaptations minimales des consommateurs de Séance qu'ils rendent nécessaires : transport, persistance, copies, calculs, affichage des nouvelles Cibles sur les cartes Catalogue et Composition (Q4, Q17).

### 7.2 Hors périmètre

Voir le §6. Une adaptation d'un consommateur doit être justifiée par une exigence de l'Éditeur ; elle ne doit pas étendre la tranche en silence.

## 8. Mesures de succès

L'application a un seul utilisateur, et PRE-4 est une tranche de finalisation : les mesures sont des critères d'acceptation de la tranche, relevés à la livraison. Le journal de comparaison les consigne (Q6, `journal-comparaison.md`).

**Principales**
- **SM-1 — Recette sur iPhone.** Chaque scénario de recette dérivé des stories (au moins un par ED, dans les quatre Parcours d'édition) est jugé conforme par Hermann sur iPhone. Toute anomalie est consignée avec sa capture. Valide l'ensemble des FR.
- **SM-2 — Préservation des données.** Sur une installation contenant des données créées avec la version de base `c32e360d`, en ancien mode À l'échec compris, aucun Exercice, aucune Copie en Séance, aucun lien Catégorie, Zone ou Média, aucun ordre et aucun fichier ne sont perdus après la mise à jour, hors les Exercices illisibles écartés et dénombrés selon Q19. Valide les FR d'ED-18, ED-19 et ED-21.
- **SM-3 — Corpus.** Les 276 phrases de référence restent identiques, avec une adaptation explicite des 92 anciennes entrées À l'échec, et les variantes ajoutées passent. Valide les FR d'ED-16 et ED-17.

**Secondaires**
- **SM-4 — Contrôles locaux.** `npm test`, `npx tsc --noEmit` et `npm run lint` sont verts à la livraison (NFR-11).
- **SM-5 — Régressions.** Aucune régression constatée sur les parcours PRE-3 existants (Catalogue, Composition, référentiels, Médias).

**Contre-mesures (à ne pas optimiser)**
- **SM-C1 — Nombre de tests.** Un nombre de tests élevé ou une suite verte ne prouvent ni la fidélité visuelle ni le comportement tactile (NFR-04). Contrebalance SM-4.
- **SM-C2 — Ressemblance pixel.** Une ressemblance à une capture ne justifie ni de remplacer une primitive native ni de reproduire une règle lue sur Figma, comme l'énumération des Pauses (NFR-01, NFR-02, P1). Contrebalance SM-1.

## 9. Questions ouvertes

1. **Q9 — Titre d'en-tête « Créer un exercice ».** Il diffère entre les PNG du 13/10 et du 14/10. Non bloquant : les captures de `caa2a5cf` et Figma en direct servent de référence visuelle, et Hermann valide sur appareil.
2. **Hypothèses H4 à H33** (§10), à côté des règles de priorité P1 à P45. H5 (confirmée par Q29) et H30 (remplacée par Q30) sont désormais des décisions. Elles sont adoptées pour avancer et restent révocables par la revue ChatGPT ou par Hermann. Aucune n'invente une règle contraire à une source.
3. **Point d'entrée « créer dans une Séance ».** Le code de départ accepté en PRE-3 l'expose (`Ajouter un exercice` → `Un nouvel exercice`), alors que D-194 dit qu'il n'est pas exposé. PRE-4 conserve le comportement accepté (P8, Q4) ; la divergence est signalée à Hermann (FR-01-03). Non bloquant pour la rédaction.
4. **Revue indépendante.** La table de correspondance entre les sources produit et ce PRD est à construire par ChatGPT (`CLAUDE.md`). Aucune revue n'est déclarée effectuée tant que son résultat n'a pas été transmis.
5. **Q22 et Q23, tranchées le 2026-10-16.** Q22 : la recette se fait dans le dev client « Routine Dev » déjà installé ; sa compatibilité avec le code natif de PRE-4 est vérifiée en ouverture de la story de faisabilité S0, et un nouveau build éventuel est signalé à Hermann ; ce point ne bloque pas les documents. Q23 : bouton de Mode retiré de la Carte (FR-02-06).
6. **Libellé du résumé de carte d'un Exercice tout à l'échec : tranché (Q24).** La carte affiche `{N} séries à l’échec`, selon les sources (P3), en Régime identiques comme en Régime variables. Le texte PRE-3 `{N} séries jusqu’à l’échec` (`fr.ts:380`) et la branche `{N} séries variables` d'un tout échec sont donc remplacés : c'est un changement visible assumé.
7. **Valeur ancienne non représentable : tranché (P45).** Une Cible ou une Pause de première ligne hors du CHECK d'`activities`, ou un N non entier, est classée illisible (Q19). Ces cas ne sont pas productibles par le code PRE-3. Repris dans la liste fermée de FR-18-20 et dans FR-18-14.
8. **Cible à renseigner dans le Sélecteur et le Pied commun : tranché (Q25, Q26, 2026-10-16).** Q25 : sur une Cible à renseigner, le Sélecteur s'ouvre sur la valeur minimale sélectionnée (00:05 ou 1), rien n'étant appliqué avant le ✓ (FR-07-04, FR-10-03). Q26 : sans Cellule active, le Pied commun reste affiché avec ± indisponibles ; sur une Cellule active à renseigner, + donne la valeur minimale et − est indisponible (FR-10-04).
9. **Révision après revue ChatGPT du 2026-10-16 (R1-R4, Q27-Q30).** R1 : la tolérance historique suit un tableau unique (ancienne 150 inchangée → tolérée ; nouvelle 100 → valide ; nouvelle 101 ou 120 → refusée), FR-09-05 et FR-18-07. R2 : la Cellule active reste active après le ✓ ou le ✕ du Sélecteur, et une fermeture extérieure range l'outil (FR-10-03 ; transitions dans l'architecture, AD-15). R3, tranché par Q27 : consultation d'un Média dans l'Éditeur par le lecteur natif (FR-21-02, nouvelle FR-21-05 ; FR-21-04 n'exclut que l'Exécution). R4, tranché par Q28 : une valeur numérique négative ou non entière rend l'Exercice illisible, écarté et dénombré (FR-18-14, FR-18-20, NFR-05) ; P40 est remplacée et P44 amendée. Q29 confirme H5 (FR-12-05). Q30 remplace H30 (FR-13-05, FR-15-03, FR-15-04 : 105 s de contribution, Séance 270 s ≥). Aucune autorisation de développement n'en découle.
10. **Révision après la porte post-revue du 2026-10-16 (M1 à M3, Q31).** M1 : FR-10-05 précise le comportement d'un champ ± ouvert (un seul geste vers une autre valeur ou une cellule, ± sans fermeture, N diminué sans fermer le champ) et FR-12-05 l'`Annuler` du retrait avec une Cellule active (Q29) ; transitions dans l'architecture, AD-15 (T1 à T27). M2, tranché par Q31 : toucher la tuile consulte le Média, le menu Retirer / Monter / Descendre passe à l'appui long (menu contextuel natif), actions VoiceOver conservées (FR-21-02, FR-21-05, FR-22-09) ; D-335 amendée sur ce point. M3 : H22 précisée, l'invite n'apparaît que sur la Carte vide, avant tout Mode (FR-02-06), texte inchangé. Aucune autorisation de développement n'en découle.
11. **Révision du 2026-10-17 (développement et recette iPhone, Q33 à Q36).** Q33 : sur le segment Exercices, `Créer` ouvre directement l'Éditeur d'Exercice ; liste d'options inchangée sur les autres segments (FR-01-01). Q34 : le bouton Lecture reste désactivé ; on vérifie seulement que son appui n'ouvre pas l'Éditeur (FR-01-02). Q35 : la Cible à renseigner est signalée par un fond rouge léger `#FFF1F0` (`color.dangerSurface`), sans liseré ; le reste de D-337 est inchangé (aucun message, ✓ indisponible, indice VoiceOver). Q36 : une Cible Durée n'est pas obligatoirement un multiple de 5 s ; bornes inchangées, 5 à 3535 s, à la seconde ; roulette au pas de 1 s ; ± au pas de base 1 avec l'accélération existante (paliers 5 puis 10) ; une ancienne valeur hors bornes s'ouvre sur la valeur bornée et les ± mènent à la valeur voisine dans le sens du geste (FR-07-02, FR-07-04, FR-09-01, FR-09-04, FR-09-05, FR-10-03, FR-10-04, FR-18-07). Décisions de Hermann ; elles remplacent les règles antérieures concernées.
12. **Révision du 2026-10-17 (recette iPhone, Q37 ; écarts E-10 et E-11).** La roue d'un Sélecteur de la Feuille (Cible Durée, et par cohérence Cible Répétitions, Cible d'une Cellule active et Durée totale) s'affiche sans flèche, centrée horizontalement sur la page, sur un voile atténué, dans la couche `WheelPickerOverlay` acceptée en PRE-3 ; elle se ferme par son ✕ ou son ✓ seulement, le voile n'étant pas pressable (FR-03-11 ; référence visuelle de FR-07 et de FR-14 annotée). Les popovers de choix (Mode, Changement de côté, Ordre des côtés, Régime) restent des popovers natifs ancrés (FR-03-10, inchangée). La règle de repli de FR-03-11 ne vise plus les roulettes. Décision de Hermann ; changement de rendu décidé, pas une régression.
13. **Révision du 2026-10-17 (recette iPhone, Q38 ; écart E-12).** En bilatéral, la ligne `Ordre des côtés` est masquée à N = 1 au lieu d'être atténuée et non modifiable ; l'Ordre choisi est conservé dans le Brouillon et réaffiché dès N ≥ 2 (FR-12-04, FR-03-08). La normalisation effective `Un côté après l’autre` à N = 1, calculs et ✓ compris, est inchangée. Décision de Hermann ; amélioration décidée, pas une régression.
14. **Révision du 2026-10-17 (recette iPhone, Q39 ; écart E-13).** Les apparitions et disparitions de la Feuille Paramètres d'exécution, sèches ou saccadées, deviennent fluides : entrée en fondu avec léger déploiement, sortie en fondu avec repli, glissement des lignes voisines et de la feuille, durée courte et unique, sur le fil UI ; aucune animation avec « Réduire les animations » (NFR-10). Le comportement D-4 du sélecteur (valeur choisie visible 220 ms, puis repli) est conservé. Décision de Hermann ; amélioration décidée, pas une régression.
15. **Révision du 2026-10-17 (recette iPhone, Q40 ; écart E-14).** Durée et sens de Q39 remplacés : 350 ms (entrée, sortie, transition de place, cadre D-4), entrée par le bas et sortie vers le bas en fondu simultané, l'espace se refermant pendant le fondu (NFR-10). Lignes sélectionnées de la Feuille : fond de sélection sans liseré. Tableau des séries variables : fond d'une ligne sélectionnée quand il est ouvert ou utilisé, état normal dès qu'un autre champ est sélectionné ; cadre fixe X-3 retiré. Décision de Hermann ; amélioration décidée, pas une régression.
16. **Révision du 2026-10-17 (recette iPhone, Q41 ; écart E-15).** Le fondu de Q39 et Q40 est supprimé : une ligne ou un contrôle de la Feuille monte de bas en haut, révélé par un cadre de découpe borné par la barre horizontale du dessous, et redescend sous elle à la disparition (NFR-10). Le fond de sélection ne modifie plus la mise en page : aucun mouvement du texte à la sélection ; un contrôle en ligne sous le champ sélectionné est dans le même cadre coloré (FR-03-10). Sur iOS, le Changement de côté, l'Ordre des côtés (segmenté accepté inchangé), la roue de « Durée d’une série » et celle de la Durée totale (`DurationWheelPicker` inchangé) s'ouvrent dans un panneau sans flèche juste sous le champ, aligné à droite, au-dessus du contenu ; un toucher hors du panneau le ferme sans appliquer (FR-03-07, FR-03-08, FR-03-11 ; références visuelles de FR-07 et de FR-14 annotées ; FR-09-06 ne mentionne pas la présentation et reste inchangée). Le popover natif du Mode est inchangé. Portée, par cohérence : toutes les roues de la Feuille (Cible Durée, Cible Répétitions, Cellule active, Durée totale) dans ce même panneau ; Q37 ne s'applique plus à aucune roue de la Feuille. Décision de Hermann ; amélioration décidée, pas une régression.
17. **Révision du 2026-10-17 (recette iPhone, Q42 ; écart E-16).** Les lignes de la Feuille et du tableau des séries variables ont une hauteur minimale de 44 pt (NFR-09 : cibles tactiles verticales des ± et des pastilles), au lieu des 42 pt du DSF. Aucun jeton modifié.

## 10. Index des hypothèses

| ID | Résumé | Utilisée dans |
|---|---|---|
| H4 | Mémoire des Cibles par Mode et par ligne ; une Cible à l'échec traverse les Modes | ED-11 (FR-11-04) |
| H5 | **Confirmée par Q29 (décision, non plus hypothèse).** Retrait d'une ligne : Annuler jusqu'à toute modification du Brouillon de la Feuille (liste de Q29) ; croix indisponible à N = 1 ; normalisation N1 au ✓ | ED-12 (FR-12-05) |
| H6 | Échec structurel de la migration : annulation complète, comportement d'erreur de démarrage existant (données illisibles : Q19) | ED-18 (FR-18-15) |
| H7 | Donnée ancienne invalide conservée, affichée telle quelle, à corriger pour la modifier | ED-02 (FR-02-09), ED-09 (FR-09-05), ED-18 (FR-18-06, FR-18-07, FR-18-14, FR-18-20) |
| H8 | Durées d'une heure ou plus : minutes au-delà de 59 | ED-14 (FR-14-03), ED-16 (notes 4.16), ED-17 (FR-17-01, FR-17-04) |
| H9 | Gras : « rép. » en gras ; « jusqu’à l’échec » sans gras ; symbole au style du total | ED-16 (FR-16-02), ED-17 (FR-17-04) |
| H10 | Cible incomplète : aucune ligne de total, ✓ indisponible | ED-13 (FR-13-05), ED-16 (notes 4.16) |
| H11 | Instantanés : lecture versionnée seulement, aucun stockage persistant dans le code de départ | ED-19 (FR-19-10) |
| H12 | Un Média référencé par un objet archivé reste référencé | ED-21 (FR-21-55) |
| H13 | Libellés VoiceOver, ordre de lecture, retour du focus au déclencheur | ED-03 (FR-03-10), ED-04 (FR-04-01), ED-07 (FR-07-08), ED-21 (FR-21-05), ED-22 (FR-22-07, FR-22-08, FR-22-10) |
| H14 | Ligne de Cible commune en Répétitions : « Nombre de répétitions » | ED-04 (FR-04-05), ED-07 (FR-07-01) |
| H15 | La roue des minutes ne boucle pas ; à 58 min, secondes jusqu'à 55 | ED-07 (FR-07-02) |
| H16 | Clause de Bip après une compaction mixte en Répétitions | ED-16 (FR-16-04) |
| H17 | Compaction min = max : gabarit actuel conservé | ED-16 (FR-16-09) |
| H18 | « Durée totale : ≥ {total}. » | ED-16 (FR-16-10) |
| H19 | Maintien appuyé sur ± d'une Cible Durée : paliers 5 s puis 10 s | ED-09 (FR-09-04) |
| H20 | Résumé de carte d'un Exercice mixte : « {n} séries variables » | ED-15 (FR-15-06) |
| H21 | Identifiants stables lors de la migration | ED-18 (FR-18-12, FR-18-20) |
| H22 | Invite de la Carte vide reprise de la capture 8328:35698, affichée seulement sur la Carte vide, avant tout Mode (précision du 2026-10-16) ; par analogie, libellés `N séries` / `1 série` | ED-02 (FR-02-06), ED-12 (FR-12-06, par analogie) |
| H23 | Textes des annonces VoiceOver à créer dans le lexique | ED-21 (FR-21-05), ED-22 (FR-22-08) |
| H24 | Signalement des Exercices écartés (Q19) : message d'information unique au premier lancement après la migration ; ne réapparaît plus une fois fermé par son bouton ; réapparaît si l'application est quittée avant | ED-18 (FR-18-20) |
| H25 | Valeur ancienne hors bornes non modifiée : n'empêche ni ✓ ni `Terminer`, réenregistrée telle quelle ; seule une valeur modifiée respecte les bornes ; Cible absente = à renseigner, bloque ✓ | ED-02 (FR-02-09), ED-03 (FR-03-03), ED-09 (FR-09-05), ED-18 (FR-18-06, FR-18-07, FR-18-14) |
| H26 | Au changement de Mode : N, Pauses, Bip, Changement de côté, Ordre des côtés, Pause au changement de côté, Compte à rebours et Fin conservés | ED-11 (FR-11-03) |
| H27 | Retour dans un Mode : le dernier choix explicite l'emporte ; une Cible à l'échec n'est pas remplacée par le nombre mémorisé | ED-11 |
| H28 | Carte ou résumé d'un Exercice à Cible ancienne à renseigner : aucune durée, texte « Paramètres à compléter. » | ED-15 |
| H29 | Copie en Séance d'une Définition à Cible ancienne à renseigner : ajout permis, `Continuer` refusé tant qu'elle n'est pas renseignée | ED-19 |
| H30 | **Remplacée par Q30 (décision).** Copie en Séance à Cible ancienne à renseigner : aucun total d'Exercice ; dans l'agrégation, travail de la Série à renseigner inconnu, travail connu des autres Séries et Pauses comptés (105 s pour 30 s / — / 45 s, Pauses 10 s × 3), total partiel (≥) ; pas une omission. *Texte initial, historique : Pauses seules comptées.* | ED-13 (FR-13-05), ED-15 (FR-15-03, FR-15-04) |

*Révision après revue ChatGPT du 2026-10-16 (R1-R4, Q27-Q30) : H5 confirmée par Q29 ; H30 remplacée par Q30 ; P40 remplacée par Q28. Les autres hypothèses restent ouvertes à la revue et à Hermann.*

*Ajoutées après l'architecture (2026-10-16) : H27, puis H28 et H29, avec les règles P39 (Séance vidée par Q19, visible et ouvrable) et P40 (Pause invalide d'une Définition, conservée ; remplacée depuis par Q28). Puis, à la passe de cohérence finale : H30, H24 précisée, P41 (rendu des totaux exacts et estimés des cartes), P42 (N hérité, test du domaine), P43 (deux fichiers de corpus), P44 (prédicat d'illisibilité), Q22 et Q23. Elles sont reprises dans les epics et stories.*

## Annexe A — Tables de couverture

Chaque table relie les règles extraites des sources (identifiants des fichiers `extracts/`) et les assertions de la vérification Q7 aux exigences du §4, ou dit pourquoi une règle n'est pas reprise. Une sous-section par groupe de rédaction. Les hypothèses et règles de priorité mobilisées par chaque groupe sont listées à la suite de sa table.

### A.1 Sous-sections 4.1 à 4.3 et 4.20 à 4.22 (Éditeur, Feuille, référentiels, Médias côté interface, fidélité et accessibilité)

Règles de l'extrait `ed01-04-20-22-ui.md` (ED-04 rédigé ailleurs, sauf ED04-01 cité en FR-03-02) et assertions de la vérification Q7 pour ED-01, 02, 03, 20, 21, 22 et le bloc FIGMA.

| Règle | Couverte par | Remarque |
|---|---|---|
| ED01-01 | FR-01-01 | |
| ED01-02 | FR-01-01 | |
| ED01-03 | FR-01-01 | |
| ED01-04 | FR-01-01 | |
| ED01-05 | FR-01-01 | |
| ED01-06 | FR-01-02 | `Déployer` de RM-162 non repris (D-261) |
| ED01-07 | FR-01-02 | |
| ED01-08 | FR-01-03 | |
| ED01-09 | FR-01-03 | |
| ED01-10 | FR-01-05 | |
| ED01-11 | FR-01-04 | |
| ED01-12 | FR-01-06 | |
| ED01-13 | FR-01-06 | |
| ED01-14 | FR-01-05 | |
| ED01-15 | FR-01-07 | |
| ED01-16 | FR-01-08 | D-171, D-213 non repris (P15) |
| ED01-17 | FR-01-08 | |
| ED01-18 | FR-01-03 | Résolu par P8 ; ancien arbre non repris |
| ED01-19 | FR-01-05 | Résolu par P8 |
| ED01-20 | FR-01-09 | |
| ED01-21 | FR-01-10 | |
| ED02-01 | FR-02-01 | D-105, `S/08…:1552` non repris |
| ED02-02 | FR-02-01 | Q9 non bloquant |
| ED02-03 | FR-02-02 | Résolu par P7 |
| ED02-04 | FR-02-02 | |
| ED02-05 | FR-02-02 | |
| ED02-06 | FR-02-03 | |
| ED02-07 | FR-02-03, FR-22-07 | Libellé accessible : H13 |
| ED02-08 | FR-02-03 | |
| ED02-09 | FR-02-03 | |
| ED02-10 | FR-02-04 | |
| ED02-11 | FR-02-04, FR-22-06 | |
| ED02-12 | FR-02-05 | Icône `+` : P35 (captures) |
| ED02-13 | FR-02-05 | |
| ED02-14 | FR-02-05 | |
| ED02-15 | FR-02-05 | Libellé : P35 (captures) |
| ED02-16 | FR-02-05 | Séparateur : P35 (captures) |
| ED02-17 | FR-02-06 | Texte d'invite : H22 |
| ED02-18 | FR-02-06 | |
| ED02-19 | FR-02-06 | |
| ED02-20 | FR-02-06 | P17, rendu NON VÉRIFIABLE |
| ED02-21 | FR-02-06 | Résolu par Q11 |
| ED02-22 | FR-02-06 | Exemple, pas une hauteur fixe |
| ED02-23 | FR-02-06 | |
| ED02-24 | FR-02-07 | Étapes : P18 |
| ED02-25 | FR-02-07 | |
| ED02-26 | FR-02-07 | |
| ED02-27 | FR-02-08 | |
| ED02-28 | FR-02-08 | D-349 ; `S/13…:594` non repris |
| ED02-29 | FR-02-09 | |
| ED02-30 | FR-02-09 | |
| ED02-31 | FR-02-09 | |
| ED02-32 | FR-02-10 | |
| ED02-33 | FR-02-10 | Texte du message : P34 (code de départ) |
| ED02-34 | FR-02-02 | |
| ED02-35 | FR-02-11 | |
| ED02-36 | FR-02-12 | |
| ED02-37 | FR-02-12 | |
| ED02-38 | FR-02-12 | Résolu par Q18 |
| ED03-01 | FR-03-01 | |
| ED03-02 | FR-03-02 | |
| ED03-03 | FR-03-02 | Ancien ordre non repris |
| ED03-04 | FR-03-01 | |
| ED03-05 | FR-03-01 | |
| ED03-06 | FR-03-01 | |
| ED03-07 | FR-03-03 | |
| ED03-08 | FR-03-03 | P4 |
| ED03-09 | FR-03-04 | P19 |
| ED03-10 | FR-03-04, FR-02-06 | |
| ED03-11 | FR-03-05 | P11 |
| ED03-12 | FR-03-05 | |
| ED03-13 | FR-03-05 | |
| ED03-14 | FR-03-02 | P24 |
| ED03-15 | FR-03-05 | |
| ED03-16 | FR-03-01 | |
| ED03-17 | FR-03-06 | |
| ED03-18 | FR-03-07 | P10 |
| ED03-19 | FR-03-07 | |
| ED03-20 | FR-03-08 | Sous-titres : référence visuelle |
| ED03-21 | FR-03-09 | |
| ED03-22 | FR-03-10 | |
| ED03-23 | FR-03-10 | |
| ED03-24 | FR-03-10 | |
| ED03-25 | Non repris | D-339 supersédé (`S/13…:4087`, P9) ; mécanisme natif |
| ED03-26 | Non repris | D-341 supersédé (P9) |
| ED03-27 | FR-03-10 | P9 ; focus : H13 |
| ED03-28 | FR-03-11 | Q12 |
| ED03-29 | FR-03-11 | D-193 non repris pour la Feuille |
| ED03-30 | FR-03-11 | |
| ED03-31 | FR-03-12 | |
| ED03-32 | FR-03-12 | Détail ED-10 |
| ED04-01 | FR-03-02 (citation) | Rédigé dans la section ED-04 |
| ED04-02 à ED04-08 | Section ED-04 | Hors de cette section |
| ED20-01 | FR-20-01 | |
| ED20-02 | FR-20-01, FR-20-02 | P14 |
| ED20-03 | FR-20-03 | |
| ED20-04 | FR-20-04 | P15 ; API-ACT-05 non repris |
| ED20-05 | FR-20-04 | |
| ED20-06 | FR-20-02, FR-20-03 | |
| ED20-07 | FR-20-03 | |
| ED20-08 | FR-20-05 | |
| ED20-09 | FR-20-02 | |
| ED20-10 | FR-20-03 | |
| ED20-11 | FR-20-06 | |
| ED20-12 | FR-20-06 | |
| ED20-13 | FR-20-06 | |
| ED20-14 | FR-20-06 | P14 ; RM-124, API-REF-02/03 non repris |
| ED20-15 | FR-20-06, FR-20-07 | P12 ; nom dupliqué : P34 |
| ED20-16 | FR-20-07 | Clé normalisée : P34 |
| ED20-17 | FR-20-07 | |
| ED20-18 | FR-20-08 | P13 |
| ED20-19 | FR-20-08 | |
| ED20-20 | FR-20-08 | |
| ED20-21 | FR-20-08 | |
| ED20-22 | FR-20-09 | Variante non utilisée : P34 |
| ED20-23 | FR-20-09 | |
| ED20-24 | FR-20-09 | |
| ED20-25 | FR-20-10 | Textes : P34 |
| ED20-26 | FR-20-10 | |
| ED20-27 | FR-20-11 | |
| ED21-01 | FR-21-01 | |
| ED21-02 | FR-21-01, FR-21-03 | P18 ; rendu d'erreur validé par Hermann à la recette |
| ED21-03 | FR-21-03 | |
| ED21-04 | FR-21-01, FR-21-02 ; données FR-21-50+ | Réordonnancement UI : P18 |
| ED21-05 | FR-21-02 (renvoi) ; données FR-21-50+ | |
| ED21-06 | Données FR-21-50+ | |
| ED21-07 | FR-21-02 | |
| ED21-08 | FR-21-02 | |
| ED21-09 | FR-21-02 | |
| ED21-10 | FR-21-04 | |
| Q27 (décision du 2026-10-16, revue ChatGPT R3) ; `S/12…:829-832` ; `8328:35740` ; `S/13…:1953, 1957` (analogie) | FR-21-02, FR-21-05 ; FR-21-04 précisée | Consultation dans l'Éditeur par le lecteur natif ; Exécution hors périmètre |
| Q31 (décision du 2026-10-16, porte post-revue M2) ; D-335 amendée ; `ActivityMediaList.tsx:167-229` (code de départ) | FR-21-02, FR-21-05, FR-22-09 | Toucher la tuile consulte ; menu Retirer / Monter / Descendre à l'appui long (menu contextuel natif) ; actions VoiceOver conservées ; aucun bouton ajouté |
| ED22-01 | FR-22-01 | |
| ED22-02 | FR-22-02 | |
| ED22-03 | FR-22-03 | |
| ED22-04 | FR-22-03 | |
| ED22-05 | FR-22-04 | P30 |
| ED22-06 | FR-22-05 | |
| ED22-07 | FR-22-06 | |
| ED22-08 | FR-22-07 | |
| ED22-09 | FR-22-08 | |
| ED22-10 | FR-22-08 | Textes d'annonce : H23 |
| ED22-11 | FR-22-08 | |
| ED22-12 | FR-22-09 | |
| ED22-13 | FR-22-10 | |
| ED22-14 | FR-22-11 | |
| ED22-15 | FR-03-07, FR-22-08 | |
| ED22-16 | FR-22-12 | |
| ED22-17 | FR-22-12 | |
| ED22-18 | FR-22-12 | |
| ED22-19 | FR-22-01 | |
| ED22-20 | FR-22-01 | |
| ED22-21 | FR-22-01 | |
| Q7:01.1 à 01.6 (R) | FR-01-03, FR-01-07, FR-01-06, FR-01-02, FR-01-08, FR-01-05 | |
| Q7:02.1, 02.2, 02.4 (R) | FR-02-02, FR-02-08, FR-02-04 / FR-22-06 | |
| Q7:02.3 (D) | Non repris | Non sourcé, constat de code |
| Q7:03.1, 03.2, 03.4 (R) | FR-03-10 | |
| Q7:03.3 (D) | FR-03-10 | Via H13 |
| Q7:04.2, 04.5 (R) | FR-03-09, FR-03-03 | Le reste d'ED-04 : section ED-04 |
| Q7:20.1, 20.2, 20.4, 20.5, 20.6 (R) | FR-20-08, FR-20-06, FR-20-06, FR-20-02 / FR-20-03, FR-20-09 | |
| Q7:20.3 (D) | Non repris | Non sourcé (D-347) |
| Q7:21.1, 21.2 (R) | FR-21-02, FR-21-03 | |
| Q7:21.3 (D) | Non repris | Limite non définie (`S/13…:564`) |
| Q7:21.4 (T) | Non repris | Mécanisme technique, transmis à l'architecture |
| Q7:21.5 (R), 21.6 (D) | Section données (FR-21-50+) | |
| Q7:22.1 à 22.5, 22.7 (R) | FR-22-06, FR-22-05, FR-22-07 / FR-22-08, FR-22-09, FR-22-06, FR-22-04 | |
| Q7:22.6 (X) | Non repris | 48 pt remplacé par 44 × 44 (P30) |
| Q7:22e.1 à 22e.3 (D) | FR-22-07 | Via H13 |
| Q7:22e.4 (R) | FR-22-07, FR-03-01 | |
| Q7:22s.1, 22s.4, 22s.5, 22s.6 (R) | FR-03-01, FR-22-08, FR-22-08, FR-22-09 | |
| Q7:22s.2, 22s.3 (D) | FR-22-08 | Via H13 |
| Q7:22t.1, 22t.2, 22t.4 (R) | FR-22-08, FR-22-03, FR-22-08 | |
| Q7:22t.3 (D) | FR-22-08 | Via H13 |
| Q7:22r.1, 22r.3 (R) | FR-20-06 / FR-22-10, FR-20-08 | |
| Q7:22r.2 (D) | FR-22-10 | Repris par la règle sourcée `S/06…:148` (désactivé jamais par la seule couleur) |
| Q7:22r.4 (D) | FR-22-10 | Via H13 (retour du focus à la fermeture d'une feuille) |
| Q7:F.1, F.2, F.4, F.5 (R) | FR-22-01 | |
| Q7:F.3, F.10 (T) | Non repris | Mécanismes VNext |
| Q7:F.6 (X) | FR-22-01 | Texte de fond exclu (P1) |
| Q7:F.7 (C), F.8 (R) | Sections ED-13 / ED-14 | Hors de cette section |
| Q7:F.9 (D) | FR-02-01 | Q9, non bloquant |

**Hypothèses H utilisées dans cette section :**
- **H13** — Accessibilité : libellés VoiceOver du nom, de la description, de ✕ et ✓, de l'état variable, de la valeur et de l'unité ; ordre de lecture en-tête → nom → référentiels → description → Carte Paramètres → Médias → `Terminer` (ordre de P7) ; retour du focus au déclencheur à la fermeture d'un popover ou d'une feuille. Utilisée dans FR-03-10, FR-22-07, FR-22-08, FR-22-10 (et, hors de cette section, FR-04-01, FR-07-08).
- **H22** — Texte d'invite de la Carte vide : « Appuyez pour définir les séries et les durées », repris de la capture `8328:35698` comme texte du lexique, faute de source écrite. L'invite ne s'affiche que sur la Carte vide, Mode non choisi : elle précède tout cas Répétitions (précision du 2026-10-16, réserve de la revue ChatGPT). Utilisée dans FR-02-06 jusqu'à Q55 (2026-10-18) : invite retirée, Carte vide rendue comme en PRE-3.
- **H23** — Annonces VoiceOver : leurs textes exacts sont à créer dans le lexique (RM-092), avec le vocabulaire du glossaire ; Hermann les valide à la recette. Utilisée dans FR-22-08.

- **H25** — Valeur ancienne hors bornes non modifiée : n'empêche ni ✓ ni `Terminer`, réenregistrée telle quelle. Utilisée dans FR-02-09, FR-03-03 (et FR-09-05, FR-18-06, FR-18-07, FR-18-14).

**Règles de priorité utilisées en plus des précédentes :** P33 (rendu natif des popovers et règle de repli, FR-03-06, FR-03-10, FR-03-11), P34 (textes et comportements du code de départ, FR-02-10, FR-20-06 à FR-20-10), P35 (présentation de l'accès Zones, FR-02-05 ; par analogie, barre de couleurs, FR-20-06).

**Ajouts de la révision du 2026-10-16 dans cette section :** FR-02-13 (propriétés visuelles des blocs, ED-02) ; FR-03-13 (décisions de recette PRE-3 maintenues, ED-03) ; conséquence voile et fermeture des popovers (FR-03-10) ; règle de repli (FR-03-11) ; point d'entrée « créer dans une Séance » et écart D-194 signalé (FR-01-03).

Aucune autre hypothèse (H4 à H12, H14 à H21, H24, H26) n'est mobilisée ici ; elles relèvent des sections ED-05 à ED-19.

### A.2 Sous-sections 4.4 à 4.12 (Régime, deux Modes, Cible typée, Sélecteur de cible, tableau variable, Brouillons)

| Règle de l'extrait | Couverte par |
|---|---|
| ED05-R01 | FR-05-01 |
| ED05-R02 | FR-05-01 |
| ED05-R03 | Référence visuelle 4.5 (V) |
| ED05-R04 | FR-05-02 |
| ED05-R05 | Non repris (D-339 supersédée, P9) ; remplacé par le comportement natif, FR-05-01 |
| ED05-R06 | Non repris (D-341 supersédée, valeurs non validées, P9) |
| ED05-R07 | FR-05-03, FR-11-01 |
| ED05-R08 | FR-05-03, FR-11-03 |
| ED05-R09 | FR-05-05 |
| ED05-R10 | FR-05-04 |
| ED05-R11 | FR-05-04, FR-08-06 |
| ED05-R12 | FR-05-04 |
| ED05-R13 | FR-05-05 |
| ED05-R14 | FR-05-05 (grille Volumes hors périmètre) |
| ED06-R01 | FR-06-01, FR-06-02 |
| ED06-R02 | FR-06-01 |
| ED06-R03 | FR-06-01 |
| ED06-R04 | FR-06-03 |
| ED06-R05 | FR-06-03 |
| ED06-R06 | FR-06-03, FR-04-01 |
| ED06-R07 | FR-06-04 |
| ED06-R08 | FR-06-01 |
| ED06-R09 | FR-06-02 |
| ED06-R10 | FR-06-02 |
| ED06-R11 | FR-06-06 |
| ED06-R12 | FR-06-05 |
| ED06-R13 | FR-06-05, FR-10-04 |
| ED06-R14 | Hors périmètre 4.6 |
| ED06-R15 | Hors périmètre 4.6 |
| ED07-R01 | FR-07-02 |
| ED07-R02 | Référence visuelle 4.7 (V) ; cible tactile FR-07-08 |
| ED07-R03 | FR-07-02, FR-07-03 |
| ED07-R04 | FR-07-02, FR-07-03 |
| ED07-R05 | FR-07-04 (hors grille : Q21) |
| ED07-R06 | FR-07-04 |
| ED07-R07 | FR-07-04 |
| ED07-R08 | FR-07-05 (précisé par Q12) |
| ED07-R09 | FR-07-02 |
| ED07-R10 | FR-07-03, FR-07-04 |
| ED07-R11 | FR-07-06 |
| ED07-R12 | FR-07-06 |
| ED07-R13 | FR-07-07 |
| ED07-R14 | FR-07-08 |
| ED07-R15 | FR-07-01, FR-04-05 (H14) |
| ED07-R16 | FR-07-01 |
| ED08-R01 | FR-08-02 |
| ED08-R02 | FR-08-01 |
| ED08-R03 | FR-08-02 |
| ED08-R04 | Référence visuelle 4.8 (V) ; 45 %/100 % de l'option dans FR-07-04, FR-08-01 ; niveaux de la roulette : P33 |
| ED08-R05 | FR-08-02 |
| ED08-R06 | FR-08-04 (mécanisme fixé par Q15) |
| ED08-R07 | FR-08-05, FR-07-05 |
| ED08-R08 | FR-08-05 |
| ED08-R09 | FR-07-03, FR-08-03 (précisé par Q14) |
| ED08-R10 | FR-08-06 |
| ED09-R01 | FR-09-01, FR-07-02 |
| ED09-R02 | FR-09-01 |
| ED09-R03 | FR-09-02 |
| ED09-R04 | FR-09-03 |
| ED09-R05 | FR-09-03 |
| ED09-R06 | FR-09-03 |
| ED09-R07 | FR-09-03 |
| ED09-R08 | FR-09-04 (H19) |
| ED09-R09 | FR-09-04 |
| ED09-R10 | FR-09-05 (Q15, Q21, H7) ; + au-dessus de la borne haute : P38 |
| ED09-R11 | FR-09-06 |
| ED09-R12 | FR-09-06 |
| ED09-R13 | FR-09-06 |
| ED10-R01 | FR-10-01 |
| ED10-R02 | Référence visuelle 4.10 (V) |
| ED10-R03 | FR-10-01 |
| ED10-R04 | FR-10-02 |
| ED10-R05 | FR-10-04 (pas fixés par Q15) |
| ED10-R06 | FR-10-02 |
| ED10-R07 | FR-10-02 |
| ED10-R08 | FR-10-05 |
| ED10-R09 | FR-10-02, FR-10-05 |
| ED10-R10 | FR-10-04 |
| ED10-R11 | FR-10-04, FR-12-05 |
| ED10-R12 | FR-10-01 |
| ED10-R13 | FR-04-02 |
| ED10-R14 | FR-10-06 |
| ED10-R15 | FR-06-05, FR-10-04 |
| ED10-R16 | FR-10-07 |
| ED10-R17 | FR-10-08 |
| ED10-R18 | FR-10-01 (P23) ; Référence visuelle 4.10 (V) |
| ED10-R19 | FR-10-08 |
| ED11-R01 | FR-11-01 |
| ED11-R02 | FR-11-02 |
| ED11-R03 | FR-11-03 |
| ED11-R04 | FR-11-03 |
| ED11-R05 | FR-11-04 (H4) |
| ED11-R06 | FR-11-03 |
| ED11-R07 | FR-11-05 (P19, P37) ; FR-11-03 |
| ED11-R08 | FR-11-03, FR-05-03 (côtés, Compte à rebours et Fin : H26) |
| ED11-R09 | FR-11-03 |
| ED11-R10 | FR-11-04 |
| ED11-R11 | FR-11-01 |
| ED11-R12 | FR-11-01 |
| ED11-R13 | FR-11-02 |
| ED11-R14 | FR-11-06 |
| ED12-R01 | FR-12-01 |
| ED12-R02 | FR-12-02 |
| ED12-R03 | FR-12-01 |
| ED12-R04 | FR-12-02 |
| ED12-R05 | FR-12-01 |
| ED12-R06 | FR-12-03 (P22) |
| ED12-R07 | FR-12-03 |
| ED12-R08 | FR-12-03 |
| ED12-R09 | FR-12-03 |
| ED12-R10 | FR-12-04 (P16) |
| ED12-R11 | FR-12-04 |
| ED12-R12 | FR-12-05 (H5 confirmée par Q29) |
| ED12-R13 | FR-12-07 |
| ED12-R14 | FR-12-07 |
| ED12-R15 | FR-12-06 |
| ED12-R16 | FR-12-06 |
| ED04L-R01 | FR-04-01 |
| ED04L-R02 | FR-04-02 |
| ED04L-R03 | FR-04-01 |
| ED04L-R04 | FR-04-03 |
| ED04L-R05 | FR-04-04 |
| ED04L-R06 | FR-04-04 |
| ED04L-R07 | FR-04-04 |
| ED04L-R08 | FR-04-05 (H14) |
| ED04L-R09 | FR-04-05 |
| ED04L-R10 | FR-04-01 |

Assertions Q7 reprises (R) : 03.1, 04.1-04.5, 05.1-05.3, 06.1-06.5, 07n.1-07n.3, 07f.1-07f.4, 07r.1-07r.4, 07v.1-07v.2, 08.1-08.3, 09d.1-09d.3, 09r.1, 09h.1, 09h.4, 09h.5, 10.1-10.4, 10.6, 11.1-11.4, 11.6, 12c.1-12c.3, 12o.1-12o.4, 12g.1-12g.3, 22t.1, 22t.2, 22t.4. Assertions D reprises via une hypothèse : 11.5 (via H26, FR-11-03) ; 22t.3 (via H13, FR-07-08 et FR-22-08). Non reprises : 05.4 et 06.6 (T, hors PRD, pour l'architecture) ; 09h.2 (D, exemples) ; 09h.3 (D, tranchée par Q15, Q21 et précisée par H25) ; 10.5 (D, sans hypothèse).

Hypothèses utilisées : H4, H7, H13, H14, H15, H19, H22 (par analogie, FR-12-06), H25, H26. Décisions et règles ajoutées le 2026-10-16 : Q21 (FR-07-04, FR-09-05), P33 (4.8), P37 (FR-11-05) ; après la revue ChatGPT : Q29 (H5 confirmée, FR-12-05), tableau unique de tolérance historique (R1, FR-09-05), Cellule active après le Sélecteur (R2, FR-10-03).

### A.3 Sous-sections 4.13 à 4.17 (calculs de durée, Inversion du total, agrégation de Séance, Phrase des paramètres, Corpus 276)

| Règle de l'extrait | FR | Remarque |
|---|---|---|
| R13-01, R13-02, R13-03, R13-04, R13-05, R13-06 | FR-13-01 | |
| R13-07, R13-08, R13-09, R13-10, R13-11, R13-12, R13-13, R13-15, R13-16, R13-21, R13-22, R13-23 | FR-13-02 | R13-22 : C-01 résolu par Δ9, Q17 |
| R13-14, R13-35 | FR-13-03 | R13-35 R14 → FR-13-05 |
| R13-17, R13-18, R13-19, R13-20 | FR-13-05 | M-06 → H10 |
| R13-24, R13-36 | FR-13-06 | |
| R13-25 à R13-34 | FR-13-04 | |
| R14-01, R14-02, R14-03, R14-04, R14-08, R14-12 | FR-14-02, FR-14-03 | |
| R14-05, R14-06, R14-16 | FR-14-01 | |
| R14-07, R14-09, R14-13 | FR-14-03 | |
| R14-10, R14-11 | FR-14-04 | |
| R14-14 | FR-14-05 | |
| R14-15 | FR-14-01, FR-16-10 | Partie « ligne Total toujours présente » non reprise (P24, C-04) |
| R15-01, R15-03, R15-04, R15-05 | FR-15-02 | |
| R15-02 | FR-15-02, FR-15-03 | |
| R15-06, R15-07, R15-16 | FR-15-03 | |
| R15-08, R15-09, R15-10, R15-11 | FR-15-04 | M-08 résolu par C10 l. 333 |
| R15-12 | Non repris | Circuit de séries : Composition hors périmètre (Q4), compatibilité seulement |
| R15-13, R15-14, R15-15 | FR-15-05 | M-09 résolu par Q20 |
| R15-17, R15-18 | FR-15-06 | C-01 résolu par Q17 ; arrondi : Q20 ; M-10 → H20 |
| R15-19, R15-20 | FR-15-07 | |
| DT15-01, DT15-02, DT15-03 | FR-15-01 | |
| DT15-04 | FR-15-03 | |
| DT15-05 | FR-15-04 | |
| DT15-06, DT15-07 | FR-15-02 | |
| DT15-08 | FR-15-03 | |
| DT15-09 | FR-15-04 | Multiplicité de Circuit, sans libellé (`questions-ouvertes.md` §4) |
| DT15-10 | FR-15-04, FR-13-05 | |
| DT15-11 | FR-14-02 | |
| DT15-12 | Non repris | Progression et poids du moteur (RM-077, RM-126) : moteur hors périmètre |
| DT15-13 | FR-15-06 | Mixte sur carte : H20 |
| R16-01, R16-02, R16-04, R16-05, R16-08, R16-09 | FR-16-01 | |
| R16-03 | FR-16-02 | M-03 → H9 |
| R16-06, R16-07 | FR-16-11 | |
| R16-10 à R16-16, R16-22 | FR-16-03 | |
| R16-17 | FR-16-04 | M-02 (i), (ii) ≤ 3 → Q16 ; (iii) → P26 ; > 3 → H16 |
| R16-18, R16-32 | FR-16-07 | C-05 → P3 |
| R16-19, R16-20, R16-21 | FR-16-05 | P1 |
| R16-23 | FR-16-06 | M-07 départ gauche → FR-17-04 |
| R16-24, R16-25, R16-26, R16-27, R16-28 | FR-16-10 | M-01 → H18 |
| R16-29, R16-30 | FR-16-08 | |
| R16-31 | FR-16-09 | M-05 → H17 |
| R16-33 | FR-16-08, FR-17-04 | |
| R17-01 | FR-17-01 | M-04 → H8 |
| R17-02, R17-03, R17-05, R17-06, R17-09 | FR-17-02 | |
| R17-04, R17-07 | FR-17-04 | |
| R17-08 | FR-17-03 | |
| R17-10 | FR-17-05 | |
| Q7 13d.1-13d.3, 13b.1-13b.2, 13n.1-13n.2, 13f.1-13f.2, 13a.1-13a.3, 13m.1-13m.2 | FR-13-02, FR-13-03, FR-13-04 | 13d.4 (T) en note |
| Q7 14i.1-14i.5, 14u.1-14u.3 | FR-14-02, FR-14-03, FR-14-05 | |
| Q7 15k.1, 15k.2, 15k.4, 15k.6, 15k.7 ; 15b.1-15b.4 | FR-15-01, FR-15-02, FR-15-03, FR-15-05 | 15k.3 (X) et 15k.5 (D) résolus par P31 ; 15b.5 (T) en note |
| Q7 16o.1-16o.4, 16c.1-16c.4, 16f.2-16f.4, 16d.1-16d.3 | FR-16-01 à FR-16-11 | 16f.1 (X) résolu par P3 |
| Q7 17.1, 17.3, 17.5 | FR-17-02, FR-17-04 | 17.2, 17.6 (T) en note ; 17.4 (D) couvert par C12 l. 1621 |
| Q7 F.6, F.7 | FR-16-05, FR-13-03 | F.6 (X) résolu par P1 |
| R13-35 (R05-R13 de C10 l. 730-738) | Non repris | Relevés d'exécution : moteur hors périmètre |

**Non repris :** R15-12 et DT15-12 (raisons ci-dessus) ; formule historique `R × r` (B-PH10 l. 88) et repli `côté = pC > 0 ? pC : pS` (B-PH10 l. 83), supersédés par R13-05 et R13-31 ; omission historique du total à N = 1 sans tenir compte de la Pause (B-PH10 l. 127), remplacée par Δ2 (R16-27) ; « ≥ seulement à la Séance » (Q-07, D-309, C09 l. 211, six contrats de cartes), amendé par Δ9 et Q17 ; texte de fond de `8328:38848` énumérant les Pauses (P1) ; « 3 séries jusqu’à l’échec » (P3) ; ligne Total toujours présente (C13 l. 3098, P24) ; 135 s qualifiés d'intrinsèques (P31).

#### Hypothèses utilisées

- **H8** — Durées d'une heure ou plus : minutes au-delà de 59 (`61 min 5 s`). FR-14-03, FR-16-11 (notes), FR-17-01, FR-17-04.
- **H9** — Gras : « rép. » en gras ; « jusqu’à l’échec » et « à l’échec » sans gras ; ≥ et ≈ au style du montant. FR-16-02, FR-17-04.
- **H10** — Cible incomplète : aucune ligne de total ni montant, ✓ indisponible. FR-13-05, FR-16-01.
- *Q30 (décision du 2026-10-16, remplace H30)* — Cible ancienne à renseigner : le travail connu des autres Séries et les Pauses contribuent à l'agrégat (30 s / — / 45 s, Pauses 10 s × 3 → 105 s ; Séance ≥). FR-13-05, FR-15-03, FR-15-04.
- **H16** — Clause de Bip d'un mélange en Répétitions de plus de 3 Cibles : `…, de 10 rép. à l’échec, cadencées toutes les 2 s`, par extension de Q16. FR-16-04.
- **H17** — Plus de 3 Cibles numériques toutes égales (min = max) : gabarit actuel du générateur conservé. FR-16-09.
- **H18** — Gabarit littéral du total partiel : `Durée totale : ≥ {total}.`, par analogie avec `≈`. FR-16-10.
- **H20** — Résumé des Séries d'un Exercice mixte sur une carte : branche existante `{N} séries variables` ; tout échec `{N} séries à l’échec` ; jamais `0 s` ni `0 rép.` (Q17). FR-15-06.

**Décision ajoutée le 2026-10-16 :** Q20 (durée partielle des cartes Catalogue et Composition en minutes et secondes, sans arrondi), FR-15-05, FR-15-06. *Rectification :* les totaux exacts et estimés ne relèvent pas de Q20 mais de P41 (rendu actuel de chaque carte conservé, carte Catalogue `2 min 45 s` pour 165 s ; carte de Séance inchangée pour toutes les natures).

**Révision du 2026-10-16 :** P25 (lecture de RM-072) cité en FR-13-02 et FR-15-04 ; attendu bilatéral « Les deux côtés à chaque série » chiffré en FR-15-03 (90 s, occurrence 120 s) ; assertion 16o.4 complétée par l'échec au milieu en Répétitions (FR-16-08, FR-17-04) ; assertion 16d.1 précisée « partout où la Phrase est affichée » (FR-16-11, C13 l. 1012).

### A.4 Sous-sections 4.18, 4.19 et 4.21b (persistance, migration, copies et Médias côté données)

| Règle | Exigence | Remarque |
|---|---|---|
| R18-01 | FR-18-01 | |
| R18-02 | FR-18-02 | |
| R18-03 | FR-18-03 | |
| R18-04 | FR-18-02 | avec C-02 |
| R18-05 | FR-18-02 | |
| R18-06 | FR-18-02 | |
| R18-07 | FR-18-04, FR-18-10 | |
| R18-08 | FR-18-04 | |
| R18-09 | FR-18-05 | |
| R18-10 | FR-18-05 | |
| R18-11 | FR-18-06 | |
| R18-12 | FR-18-07, FR-18-14 | |
| R18-13 | FR-18-03 | |
| R18-14 | FR-18-02 | |
| R18-20 | FR-18-10 | |
| R18-21 | FR-18-11 | liste combinée (C-06) |
| R18-22 | FR-18-10 | |
| R18-23 | FR-18-12 | |
| R18-24 | FR-18-12 | C-09 → H21 ; écart Q19 |
| R18-25 | FR-18-13 | |
| R18-26 | FR-19-10 | |
| R18-27 | FR-18-15, FR-18-20 | annulation réservée à l'erreur structurelle (H6) ; données illisibles : Q19 |
| R18-28 | FR-18-14 | |
| R18-29 | FR-18-19 | critère d'acceptation |
| R18-30 | FR-18-16 | amendé par Q19 |
| R18-31 | FR-18-07, FR-18-11 | |
| R18-32 | FR-18-01 | |
| R18-40 | FR-18-17 | |
| R18-41 | FR-18-17 | |
| R18-42 | FR-18-17 | |
| R18-43 | FR-18-18 | |
| R18-44 | FR-18-18 | |
| R19-01 | FR-19-01 | |
| R19-02 | FR-19-02 | |
| R19-03 | FR-19-02 | |
| R19-04 | FR-19-01 | P27, C-01 |
| R19-05 | FR-19-01 | |
| R19-06 | FR-19-04 | |
| R19-07 | FR-19-05 | |
| R19-08 | FR-19-06 | |
| R19-09 | FR-19-03 | |
| R19-10 | non repris | hors périmètre : Composition (Q4) |
| R19-20 | FR-19-07 | |
| R19-21 | FR-19-08 | duplication absente du code : P36 |
| R19-22 | FR-19-07, FR-19-08 | |
| R19-23 | FR-19-09 | |
| R19-24 | FR-19-08 | M-05, P36 |
| R19-30 | FR-19-11 | création par le moteur hors périmètre |
| R19-31 | FR-19-10 | |
| R19-32 | FR-19-12 | |
| R19-33 | FR-19-12 | |
| R19-34 | FR-19-12 | |
| R19-35 | non repris | hors périmètre : moteur et relevés ; compatibilité seulement |
| R21-01 | FR-21-50 | |
| R21-02 | FR-21-51 | |
| R21-03 | FR-21-52 | |
| R21-04 | FR-21-53 | C-10 |
| R21-05 | FR-21-54 | |
| R21-06 | FR-21-55 | |
| R21-07 | FR-21-55, FR-19-11 | |
| R21-08 | FR-21-50 | |
| R21-09 | FR-21-56 | comportement détaillé : M-06, P18 |
| R21-10 | FR-21-57, FR-18-11 | amendé par Q19 pour les Exercices écartés |
| R21-11 | FR-21-58 | consultation en exécution hors périmètre |
| R21-12 | non repris ici | partie interface d'ED-21 |
| C-01 | FR-19-01 | résolu par P27 |
| C-02 | FR-18-02 | sans conflit |
| C-03 | FR-19-10 | résolu par P28 |
| C-04 | FR-18-12 | résolu par P28 |
| C-05 | Indications pour l'architecture | sans effet produit |
| C-06 | FR-18-06, FR-18-11 | |
| C-07 | FR-18-16 | résolu par P29 |
| C-08 | non repris | ED-15 (transport), rédigé ailleurs |
| C-09 | FR-18-12 | H21 |
| C-10 | FR-21-53 | |
| M-01 | FR-18-15, FR-18-20 | H6 (structurel) ; Q19 (illisible) ; forme du signalement : H24 en FR-18-20 |
| M-02 | FR-18-14 | H7 |
| M-03 | FR-18-10 | à constater sur les données réelles |
| M-04 | FR-19-10 | lecture seulement ; affichage du Suivi hors périmètre |
| M-05 | FR-19-08 | P36 |
| M-06 | FR-21-56 | P18 |
| M-07 | non repris | ED-15 et Composition, rédigés ailleurs |
| M-08 | FR-18-19 | |
| M-09 | FR-21-55 | H12 |
| 18m.1, 18m.2, 18m.3, 18m.5, 18m.6, 18m.7 | FR-18-01, FR-18-10, FR-18-11, FR-18-13, FR-18-12, FR-18-11 | classe R |
| 18m.4 | FR-18-12 | classe D, signalée |
| 18r.1 | FR-18-15 | classe R |
| 18r.3 | FR-18-15, FR-18-20 | classe D ; « corruption signalée » remplacée par Q19 (Exercice écarté, nombre signalé) |
| 18d.1, 18d.2 | FR-18-08, FR-18-03 | classe R |
| 18s.1, 18s.2, 18s.3 | FR-18-09 | classe R |
| 19c.1 à 19c.4 | FR-19-02, FR-21-53, FR-21-53, FR-19-01 | classe R |
| 19s.1 à 19s.4 | FR-19-10, FR-19-10 et FR-19-12, FR-19-11, FR-19-11 | classe R |
| 19n.1, 19n.2 | FR-19-13 | classe R |
| 21.1, 21.2, 21.5 | FR-21-50, FR-21-56, FR-21-54 et FR-21-55 | classe R (21.2 : partie données) |
| 21.3 | non repris | classe D, terme non défini |
| 21.6 | FR-21-57 | classe D, cohérente, signalée |
| 18m.8, 18m.9, 18m.10, 18r.2, 18r.4, 18d.3, 19s.5, 19n.3, 21.4 | non repris | classe T : indications pour l'architecture |
| Q19 (décision) | FR-18-20 ; amende FR-18-12, FR-18-15, FR-18-16, FR-21-57 | forme du signalement : H24 |

#### Hypothèses utilisées

- **H6** — Échec **structurel** de la migration : annulation complète, base laissée dans son état d'avant migration, comportement d'erreur de démarrage existant, aucun repli silencieux (FR-18-15). Les données illisibles relèvent de Q19 (FR-18-20).
- **H7** — Donnée ancienne invalide conservée telle quelle, affichée telle quelle, jamais convertie en échec ; la modifier impose une valeur valide (FR-18-14).
- **H11** — Aucun Instantané enregistré en base dans le code de départ ; exigence limitée à la lecture versionnée et à l'encodage typé (FR-19-10).
- **H12** — Un Média reste référencé tant qu'une Définition d'Exercice ou une Séance, même archivée, le référence (FR-21-55).
- **H21** — Les identifiants des Exercices, des Copies en Séance, des Catégories, des Zones et des Médias sont stables lors de la migration (FR-18-12, FR-18-20).
- **H24** — Signalement des Exercices écartés : message d'information unique au premier lancement après la migration ; ne réapparaît plus une fois fermé par son bouton, réapparaît si l'application est quittée avant (FR-18-20).
- **H25** — Valeur ancienne hors bornes non modifiée réenregistrée telle quelle, sans bloquer ✓ ni `Terminer` ; Cible absente bloquant ✓ (FR-18-06, FR-18-07, FR-18-14).

Règles de priorité appliquées : P3, P8, P15, P18, P22, P26, P27, P28, P29, P31, P32, P36, P44 (amendée par Q28), P45. Décisions : Q4, Q15, Q18, Q19, Q28 (remplace P40 : valeur négative ou non entière → Exercice écarté, FR-18-14, FR-18-20).

