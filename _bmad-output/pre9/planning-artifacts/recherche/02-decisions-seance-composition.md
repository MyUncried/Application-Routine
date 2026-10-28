# PRE-9 — Règles validées : Séance simplifiée (A) et Composition (B)

Recherche en lecture seule — 28/10/2026. Base : `pre9-bmad/plan` = `main @ 547bb7ef` (PR #409 PRE-8 fusionnée). Aucune décision inventée. `strategie.md` est un document de cadrage : il n'est cité qu'à titre de contexte, jamais comme source de règle.

**Statuts** : **DÉCIDÉ** (décision validée et tracée) · **À CLARIFIER** (absent, réservé ou contradictoire) · **DÉP. TECH.** (règle connue, réalisation conditionnée au code ou aux données) · **HORS PÉRIMÈTRE** (reporté explicitement).

**Abréviations des sources**
- `D449doc` = `docs/KODJO-Seance-Objet-Unique-Decisions-2026-10-26.md`
- `COMP` = `docs/KODJO-Composition-conteneurs-2026-10-28.md` (référence consolidée)
- `SRC` = `docs/KODJO-Conteneurs-composition-2026-10-28-source.md` (source verbatim)
- `REVUE` = `docs/REVUE-COMPOSITION-2026-10-28.md` : **propositions et réserves, pas des décisions** (ch07 l.1145)
- `ch07`/`ch10`/… = `docs/Specifications-fonctionnelles/NN – …md`
- `EPE` = `_bmad-output/pre8/planning-artifacts/epic-e-catalogue-seances.md`

---

## A. Passage définitif à la Séance simplifiée (D-449)

| # | Règle | Source exacte | Statut |
|---|---|---|---|
| A1 | Mouvement = contenu partagé ; Exercice = référence à un mouvement + paramètres d'exécution, à une position de la composition ; Séance = seul contenu enregistré, planifiable et lançable. « Ligne de séance » est remplacé par Exercice. | D449doc §1 l.9-13 ; ch07 D-449 l.1085 ; ch10 SU-01 l.43 | DÉCIDÉ |
| A2 | L'Exercice n'est **pas** un objet autonome de catalogue. Le Mouvement survit à la suppression des exercices qui l'utilisent. | D449doc §1 l.13 ; ch09 l.19 | DÉCIDÉ |
| A3 | Identité stable : une séance reste la même avec 1 ou N exercices ; les routines gardent leur référence ; aucune conversion Exercice↔Séance **dans le modèle cible**. | D449doc §2 l.17 ; SU-02 | DÉCIDÉ |
| A4 | Lancement de la séance entière uniquement ; aucun lancement isolé ; pas de seconde voie `ACTIVITY`. | D449doc §5 l.44-46 ; SU-05 ; CE-SU-04 (ch13 l.279) | DÉCIDÉ |
| A5 | Fin des Exercices autonomes : `ActivityDefinition`, `SessionActivity` et `ACTIVITY` restent cités pour comprendre le code ; ce ne sont pas des concepts cibles. **Ni renommage mécanique, ni migration de réinitialisation prescrits.** | D449doc l.74 ; ch07 l.1089 ; ch12 l.81 | DÉCIDÉ (cible) / DÉP. TECH. (réalisation) |
| A6 | **Conservation des données** : « aucun effacement de données n'est autorisé par cette décision » ; le traitement des anciennes données relève d'une analyse d'impact. | D449doc §5 l.46 ; ch12 l.81 (« Aucun […] effacement de données n'est autorisé implicitement ») ; ch09 l.19 (« schéma physique et reprise des données seront analysés avant développement ») | DÉCIDÉ (interdit) ; règle de migration À CLARIFIER |
| A7 | La réinitialisation unique de D-440 (migration 012) ne vaut **pas** pour les démarrages suivants. | ch07 D-440 l.117-119 | DÉCIDÉ |
| A8 | E.8-a (déjà livré dans PRE-8) : 3 segments ; anciennes définitions conservées, consultables et modifiables par une commande Modifier dans la sélection d'Exercices de la Composition ; « raccordement transitoire, retiré quand l'epic C remplacera ce parcours ». | ch07 l.56 ; EPE l.215-242 | DÉCIDÉ (transitoire) |
| A9 | **E.8-b (conversion)** : « **Proposition de conversion, à arbitrer à ce moment.** » Migration testée sur une copie de base ; chaque définition devient une Séance d'un exercice ; retrait de la définition dans la même transaction ; annulation complète en cas d'échec ; retrait des composants, puis de la table par une migration distincte. | EPE l.244-249 ; sprint-status l.36 (« autorisation distincte ») | **À CLARIFIER** : la conversion elle-même n'est pas validée ; seul son titre (A10) l'est |
| A10 | **Q-E1** : une Séance issue de la conversion d'un Exercice du Catalogue prend le titre de son premier Exercice. | ch07 l.19 (« (Epic E) ») ; epics.md l.60 (« Tranché le 27/10 ») ; sprint-status l.99 | DÉCIDÉ |
| A11 | Condition préalable de E.8-b : la sélection de la Composition passe par les Mouvements, donc plus aucun parcours ne lit `activity_definitions`. | EPE l.55, l.245 ; spec-b-1-b-2-b-3 l.51 | DÉP. TECH. |
| A12 | Articulation entre A3 (« aucune conversion ») et A9 : D-449 vise le modèle cible ; E.8-b est une migration de données héritées. Aucun texte ne les oppose explicitement, mais aucun ne valide non plus la conversion. | D449doc l.17 vs EPE l.246 | À CLARIFIER (faible) |
| A13 | Vues filtrées Un exercice / Plusieurs d'une seule collection ; on compte les exercices de la composition (sans séries, tours, côtés ni cycles) ; un exercice dans un conteneur compte pour un. | D449doc §6 l.50-54 ; SU-06 ; ch07 l.1121 | DÉCIDÉ (livré E) |
| A14 | Nom de séance en trois états : nom du format (gris, non modifiable) → nom du 1er exercice (modifiable) → invite « Entrer un nom de séance » au 2e exercice. Aucun suffixe de niveau. Remplace la réserve de D-449 §2. | ch07 l.1125 ; ch08 l.849-855 ; Spec carte §8 l.97-105 | DÉCIDÉ ; « à traiter dans le lot Composition » |
| A15 | Titre après retrait d'exercices ; conservation d'un titre déjà personnalisé. | ch08 l.855 (« ne sont pas spécifiés […] aucune règle supplémentaire ») | À CLARIFIER |
| A16 | Reprendre une séance : copie de la composition au niveau principal, à l'endroit choisi ; nouveaux identifiants ; mêmes `movementId` ; paramètres copiés indépendamment ; ni début/fin propres, ni routines, ni résultats ; aucune synchronisation. | D449doc §3 l.23-32 ; SU-03 ; CE-SU-03 | DÉCIDÉ ; réalisation = epic D (README PRE-8 l.67) |
| A17 | Séance existante vidée : la règle actuelle est conservée ; aucune autorisation d'enregistrer une séance vide. | D449doc l.54 ; EPE l.257-258 (Q-E6) | DÉCIDÉ |
| A18 | Routines : elles utilisent la dernière version ; contenu résolu et figé au démarrage ; ni dates ni récurrence modifiées. | D449doc « Règles conservées » l.58 ; SU-07 | DÉCIDÉ |
| A19 | Une séance plus riche que l'ancien modèle ne peut pas être ouverte par l'interface actuelle (erreur de projection) ; les points d'arrêt hors circuit unique sont refusés (`STRUCTURE_STOP_POINTS_UNSUPPORTED`). | spec-a-1 l.53 ; spec-a-3-a-4 l.28 | DÉP. TECH. (état du code à lever) |

## B. Composition (D-451 et complément du 28/10)

### B.1 Structure et répétition

| # | Règle | Source | Statut |
|---|---|---|---|
| B1 | Séance : exercices, circuits et cycles, dans leur ordre. Cycle : exercices directs et circuits. Circuit : exercices. Plusieurs circuits et plusieurs cycles successifs dans le MVP. | ch07 D-451 l.1132 ; COMP §1 l.9-15 ; RM-025, RM-028, RM-029 (ch10 l.906-910) ; DM-003/004 (ch09 l.1368-1369) | DÉCIDÉ |
| B2 | Pas de cycle dans un cycle, de circuit dans un circuit, ni de séance imbriquée. Le cycle technique invisible disparaît ; aucun cycle implicite. | D-451 ; SU-04 ; ch12 l.5 | DÉCIDÉ |
| B3 | Comptes : circuit de 1 à 99 tours (défaut 1) ; cycle de 1 à 99 répétitions (défaut 1). | RM-026, RM-028 | DÉCIDÉ |
| B4 | RM-252 : un exercice direct de cycle est exécuté une fois par répétition du cycle ; un exercice de séance, une fois ; le cycle répète le développement complet de ses circuits. Exemple : E0, cycle×2[E1, circuit×3[A,B]], E2 → E1 deux fois, circuit six passages. | ch10 l.2614 ; COMP §1 l.17 | DÉCIDÉ |
| B5 | Les comptes se multiplient (3 répétitions × 3 tours = 9 passages) ; les deux comptes restent visibles. | SRC §9.1 D4 l.286 ; CS-D4 | DÉCIDÉ |
| B6 | Compte à rebours initial et Fin de séance : hors conteneurs, présents une fois, non déplaçables ; 0..60 s. | COMP l.17 ; RM-030 ; D-443 l.151 | DÉCIDÉ |
| B7 | Pas de plafond arbitraire du nombre de conteneurs ; le comportement au-delà de la lettre Z n'est pas défini. | D449doc l.40 ; COMP §4 l.52 | À CLARIFIER (au-delà de Z) |
| B8 | Données : identifiant stable, parent, ordre et compte pour Cycle et Circuit ; nature pour le Circuit ; l'Exercice a un parent séance, cycle ou circuit ; le parent est unique ; l'état replié relève de la présentation ; la lettre affichée n'est pas un identifiant. | ch09 l.126-134, l.138-140 | DÉCIDÉ |
| B9 | Les identifiants techniques persistés (tours/séries) ne sont pas migrés ; enums non renommés automatiquement. | COMP §2 l.28 ; ch12 l.5 | DÉCIDÉ / DÉP. TECH. |

### B.2 Séries groupées / alternées

| # | Règle | Source | Statut |
|---|---|---|---|
| B10 | Groupées = toutes les séries de A puis toutes celles de B (ancien « de tours ») ; alternées = la série i de chaque membre au tour i (ancien « de séries »). Exemple : `(A1A2A3B1B2B3)×3` / `A1B1A2B2A3B3`. | COMP §2 l.23-30 ; ch10 l.1026, l.1050-1052 | DÉCIDÉ |
| B11 | En alternées, N est commun à tous les membres : le point B est clos le 28/10, contrainte maintenue, écran de confirmation conservé. | SRC §4 bis l.119 ; COMP l.34 (« décidé ; il ne reste pas ouvert ») ; ch07 l.1140 | DÉCIDÉ |
| B12 | Conversion groupées → alternées : on garde N, on étend par la dernière valeur, on tronque au-delà ; confirmation si et seulement si une valeur est perdue ; Annuler restitue tout ; les séries tronquées ne sont pas restaurées. Alternées → groupées : sans confirmation, tout est conservé. | COMP l.34 ; ch10 l.1065-1081 | DÉCIDÉ |
| B13 | Diminuer N sans conversion : réserve dans le brouillon jusqu'à l'enregistrement. | ch10 l.1144-1148 | DÉCIDÉ |
| B14 | Ajout ou déplacement vers un circuit alterné : adaptation à N ; confirmation en cas de perte ; Annuler conserve l'emplacement et les données d'origine ; Confirmer applique déplacement et adaptation ensemble. Le conteneur source vidé disparaît avec le déplacement appliqué. | ch10 l.1152-1156 ; COMP §6 l.72 | DÉCIDÉ |
| B15 | Le régime identiques/variables est indépendant de la nature ; un exercice nouveau dans un circuit est « identiques » par défaut ; SU-08 interdit la table de cibles par passage. | ch10 l.1083-1089 ; SU-08 | DÉCIDÉ |
| B16 | En-tête « N tours · groupées/alternées » ; sélecteur « Séries groupées / Séries alternées » avec ses sous-titres ; « Passer en séries alternées ? ». | COMP §2 l.32 ; SRC §4 l.105-107 | DÉCIDÉ |

### B.3 Valeur nulle et valeur manquante (paramètres)

| # | Règle | Source | Statut |
|---|---|---|---|
| B17 | Une cible peut valoir 0 (répétitions ou secondes) à toute position : participation volontairement absente ; étape et pause sautées ; en alternées, l'indice est conservé. | COMP §3 l.38 ; RM-234 (ch10 l.2550) ; ch07 l.1141 | DÉCIDÉ |
| B18 | Une nouvelle ligne porte un tiret (à renseigner, bloquant) ; un exercice au volume numérique entièrement nul est refusé ; « À l'échec » reste un état distinct. | COMP l.40 ; RM-234 | DÉCIDÉ |
| B19 | Bornes : répétitions 0..100 ; durée par série 0..3535 s ; séries 1..99 ; pauses 0..300 s ; phases ≥ 1 s (inchangé). Remplace D-232, D-430 et RM-234 sur le seul minimum. | COMP l.42 ; RM-234 | DÉCIDÉ |
| B20 | Récupération contextuelle après une occurrence nulle ; tour entièrement nul ; pause entre côtés d'une occurrence sautée ; conversion de [10,0,0] ; extension dont la dernière valeur est 0. | COMP l.44 ; ch10 l.2616 ; REVUE §3 l.41 | À CLARIFIER |

### B.4 Création, écran de choix, ajout, suppression, duplication, modification

| # | Règle | Source | Statut |
|---|---|---|---|
| B21 | Menu Créer : Créer un nouvel exercice ; Utiliser un mouvement existant ; Utiliser une séance existante ; Ajouter un circuit ; Ajouter un cycle ; Annuler. Les trois premières entrées produisent du contenu ; les deux dernières ouvrent le choix de membres existants. | COMP §5 l.60 ; ch13 l.1768 (« menu à cinq actions ») ; Figma `10705:20223` | DÉCIDÉ (référence courante) |
| B22 | Création par enveloppe : enveloppe choisie en trait plein, candidates en pointillé ; « Confirmer le circuit / le cycle » + Annuler ; au moins un membre ; jamais de conteneur vide. Le cycle accepte circuits et exercices directs. | COMP §5 l.62-64 ; G5 (SRC l.217) ; ch07 l.1142 | DÉCIDÉ |
| B23 | Sélection contiguë ou non, enveloppe à cheval sur deux parents, point d'arrêt pris dans l'enveloppe, présentation des actions inéligibles (menu sans membre éligible, C10). | COMP l.64 ; REVUE C10, §2 l.37 ; ch13 l.1768 (« explicitement réservées ») | À CLARIFIER (priorité haute selon la REVUE) |
| B24 | Les formats comme autre porte d'entrée : reporté à la définition des formats ; ne remplace pas le menu. | COMP l.64 ; SRC §10 A | HORS PÉRIMÈTRE B |
| B25 | Un conteneur à un seul membre est conservé ; le conteneur vidé disparaît ; aucune action « supprimer le conteneur » ; sa disparition ne supprime pas les membres déplacés. | COMP l.19 ; G6 ; ch09 l.134 | DÉCIDÉ |
| B26 | Position d'insertion d'un nouvel exercice ou mouvement (fin de séance ? conteneur courant ?). Seule la reprise de séance est fixée (« à l'endroit choisi, au niveau principal »). | D449doc §3 l.23 ; rien dans COMP §5 | À CLARIFIER |
| B27 | Suppression d'un exercice : appliquée ; les points d'arrêt rendus interdits ou consécutifs sont retirés sans message (le premier est conservé) ; animation douce. Le dernier membre supprimé fait disparaître le conteneur (G6 : « vidé de tous ses membres »). | D-442 l.139 ; RM-251 l.779 ; D-443 l.149 ; G6 | DÉCIDÉ |
| B28 | Duplication d'un exercice : copie juste après la source ; la récupération est copiée, le point d'arrêt ne l'est pas. | D-441 l.128 ; RM-210 | DÉCIDÉ |
| B29 | Duplication d'un circuit ou d'un cycle : aucune règle trouvée. | — (absence vérifiée dans COMP, REVUE, ch10 et ch13) | À CLARIFIER |
| B30 | Modification d'un exercice : feuille des paramètres ; N en lecture seule dans un circuit alterné ; pas de suppression locale de série qui romprait N ; dialogue du mouvement partagé selon ses propres déclencheurs (D-445). Le crayon et la variante depuis une séance ne sont plus des parcours cibles. | ch10 l.1142, l.1182 ; D449doc l.59 ; ch08 l.35-37 | DÉCIDÉ |
| B31 | Paramètres des conteneurs : toucher le nombre révèle le stepper ; l'unité n'est pas interactive ; l'adjectif ouvre le choix de nature ; le cycle a un nombre seul. **L'écran du stepper n'est pas dessiné.** | RM-027 ; COMP §4 ; SRC §3 l.66 ; CS-D5 | DÉCIDÉ ; rendu du stepper À CLARIFIER (Figma) |

### B.5 En-têtes, états replié et déployé

| # | Règle | Source | Statut |
|---|---|---|---|
| B32 | Ligne d'en-tête : nom + chevron (colonne fixe), compteur à abscisse fixe, durée à droite ; nombre 15 pt, unité 13 pt, durée 12 pt ; bleu `color/primary` pour le nombre et la nature. Remplace D-442 (stepper permanent, 44 pt, taille uniforme) et D-443 (durée masquée). | COMP §4 l.48 ; ch07 l.1138-1139 | DÉCIDÉ |
| B33 | Circuit replié : seconde ligne avec les noms des exercices séparés par « · », tronquée ; hauteur de référence 68 pt (80 est périmé). Le cycle ne se replie pas. | COMP l.50 ; REVUE C07 | DÉCIDÉ |
| B34 | Lettres : Circuit A/B, Cycle A ; continuité sur toute la séance ; pas de lettre s'il n'y a qu'un conteneur de ce type. Réattribution après un déplacement : non définie. | COMP l.52 ; REVUE §6 l.53 ; C09 (Figma montre « Cycle A » seul) | DÉCIDÉ / réattribution À CLARIFIER |
| B35 | Hiérarchie par les fonds : cycle pleine largeur, circuit 386, exercice 370 (à 402) ; frange de 4 pt ; borne haute = repère, jamais une poignée. | COMP l.54 | DÉCIDÉ |
| B36 | Persistance de l'état replié à la réouverture : seulement « relève de la présentation ». | ch09 l.134 | À CLARIFIER |
| B37 | Les cibles 48 × 33 pt sont un compromis, pas une preuve d'accessibilité ; le bleu de l'adjectif reste un point ouvert. | COMP l.56 ; SRC §7 l.244 ; REVUE C05 | À CLARIFIER (recette) |

### B.6 Glisser-déposer, défilement automatique, défilement

| # | Règle | Source | Statut |
|---|---|---|---|
| B38 | G1–G4 : appui long, déplacement, relâchement ; un exercice va vers un circuit, un cycle ou le niveau séance ; un circuit replié va entre cycles ou vers la séance ; l'appui long sur un circuit déployé le replie d'abord. | COMP §6 l.68 ; SRC §6 bis | DÉCIDÉ |
| B39 | G7 : éclairage obligatoire de la destination, surtout à la frontière dedans/dehors ; **sa forme visuelle n'est pas dessinée**. | COMP l.70 ; SRC §9.3 l.302 | DÉCIDÉ (règle) / À CLARIFIER (rendu) |
| B40 | Déplacement d'un **cycle entier** : aucun geste spécifié. | COMP l.72 ; REVUE §4 l.45 | À CLARIFIER |
| B41 | Défilement automatique pendant le glisser, près des bords haut et bas. | D-442 l.137 ; ch10 l.988 | DÉCIDÉ |
| B42 | CS-D1–CS-D8 : rien ne colle en bas ; en-tête collante selon le haut et le bas du conteneur entier ; relève par poussée ; deux niveaux au plus ; commandes actives en position collante ; repli avec ajustement du défilement sur la hauteur réelle ; décollement pendant un déplacement ; tout défilement applicatif s'arrête sous la zone collante. | COMP §7 l.78-89 ; ch07 l.1143 | DÉCIDÉ |
| B43 | Rail à travers la zone collante ; hauteur sans valeur fixe de 60 pt ; texte agrandi. | COMP l.89 ; SRC §9.2 | À CLARIFIER (vérification au montage) |
| B44 | Alternative accessible au glisser-déposer pour les conteneurs : recommandation seulement. Monter/Descendre existent pour le point d'arrêt (D-441). VoiceOver est différé au lot de fin de MVP. | REVUE §5 l.49 ; D-441 l.124 ; ch07 l.62 | À CLARIFIER (proposition) / HORS PÉRIMÈTRE (VoiceOver) |

### B.7 Pauses et points d'arrêt

| # | Règle | Source | Statut |
|---|---|---|---|
| B45 | Récupération après exercice : ajoutée explicitement, attachée à l'occurrence (suit les déplacements et les duplications), réglée uniquement en mode Placement ; une valeur positive remplace la dernière pause ; R=0 ne remplace rien. | RM-038, RM-209, RM-210 ; D-442 l.138 ; ch10 l.1132 | DÉCIDÉ |
| B46 | Point d'arrêt : objet distinct, déplaçable par appui long, retiré par désélection en placement ; ordre Exercice → R → Point → suite ; jamais deux points consécutifs (RM-251) ; jamais juste après le compte à rebours ni juste avant la fin (RM-219) ; exception début ou fin de tour à N ≥ 2 avec choix de l'utilisateur. | D-441, D-442 ; RM-219 (ch10 l.2541) ; RM-251 (ch10 l.779) | DÉCIDÉ **pour un circuit unique** |
| B47 | Généralisation de RM-219, RM-251 et D-442 aux frontières de plusieurs circuits et des cycles : point direct dans un cycle répété ou non, début/fin de répétition de cycle, point entre deux membres enveloppés. | REVUE §2 l.37 ; COMP l.15 (« pas une extension des positions d'arrêt ») ; ch13 l.1768 ; epics.md PRE-8 l.22 | **À CLARIFIER** (bloquant pour le multi-conteneur) |
| B48 | Points et récupérations internes à un circuit : répétés à chaque passage ; externes : non répétés ; l'attente d'un point est exclue des durées. | ch10 l.1021, l.1030, l.1134 ; RM-191 | DÉCIDÉ (circuit) ; cas du cycle à déduire, voir B47 |

### B.8 Durées, synthèses, persistance

| # | Règle | Source | Statut |
|---|---|---|---|
| B49 | Calculs : unilatéral Σ(Ti+Pi), etc. ; catégories exact / estimé (≈) / minimum (≥) / omis ; lowerBound prime sur estimated, qui prime sur exact ; agrégats sur le plan développé ; compte à rebours et fin exclus ; aucun calcul tiré de Figma. | ch10 l.937, l.1022, l.784-799 | DÉCIDÉ |
| B50 | Affichage : minutes et secondes sans arrondi supérieur pour les cartes (D-391) ; total de séance ≈/≥ arrondi aux 15 s (D-443) ; durée de nouveau visible dans les en-têtes. | ch07 l.871, l.152, l.1139 | DÉCIDÉ |
| B51 | Durée du cycle, arrondi des en-têtes, non-double multiplication en alternées ; les chiffres Figma (≥19, ≥8, ≥54) ne sont pas des oracles. | COMP l.56 ; REVUE §6 l.53 | À CLARIFIER |
| B52 | Synthèse du catalogue : compte des exercices de la composition ; carte déployée qui masque, dans cette seule lecture, un conteneur non répété contenant un seul exercice. | D449doc §6 ; ch10 l.2611 | DÉCIDÉ (livré E) |
| B53 | Brouillon : seule l'action Continuer enregistre (D-388) ; validité = au moins un exercice valide, sans cible manquante (D-380) ; une séance archivée s'ouvre en consultation seule. | ch10 l.949-957 ; ch07 l.62 | DÉCIDÉ |
| B54 | Ouvrir en Composition une séance multi-conteneurs (aujourd'hui en erreur) ; restitution complète de la structure. | spec-a-1 l.53 ; spec-e l.67 (R-E6) | DÉP. TECH. |

## C. Contrat d'exécution : éléments déjà décidés

| # | Élément | Source | Statut |
|---|---|---|---|
| C1 | Instantané : contenu résolu et figé au démarrage ; exécutions passées et en cours inchangées ; le lancement résout les mouvements et fige toute la séance. | SU-07 ; D449doc l.58 ; ch11 l.13 ; ch12 l.81 | DÉCIDÉ |
| C2 | Ordre de développement : séance → cycles (répétitions, RM-252) → circuits (groupées ou alternées) → séries → côtés (premier côté → PC → second → Pi) → R → point d'arrêt. | RM-252 ; ch10 l.1014-1015, l.1130, l.992 | DÉCIDÉ |
| C3 | Compte à rebours et fin propres à l'exercice jamais exécutés en séance : seuls ceux de la séance, une fois, aux frontières ; aucun booléen. | ch10 l.1136 | DÉCIDÉ |
| C4 | Séries nulles sautées avec leur pause, indice conservé ; déduplication des points consécutifs dans le plan développé, sans modifier la séance enregistrée. | RM-234 ; RM-251 ; ch10 l.2616 | DÉCIDÉ |
| C5 | Un résultat conserve sa position et ses indices de série et de tour ; le contexte de cycle doit rester restituable. | RM-083 (ch10 l.2091) | DÉCIDÉ (exigence) ; rendu à qualifier |
| C6 | Rendu de l'exécution et du suivi pour le cycle. | ch10 l.1627 ; ch13 l.3491, l.3656 | HORS PÉRIMÈTRE PRE-9 (qualification ultérieure) |
| C7 | Portée d'un format sur plusieurs conteneurs (point A). | SRC §10 l.312 ; ch13 l.1766 | HORS PÉRIMÈTRE (définition des formats) |
| C8 | A1–A7 de `strategie.md` (développement progressif, horloges, etc.) : **aucune décision trouvée** dans ces sources. | strategie.md §5 (« Aucun […] n'est déclaré nouvellement validé ») | À CLARIFIER |

## D. Contradictions et résidus entre documents

| # | Passage | Opposé à | Qualification |
|---|---|---|---|
| X1 | ch04 l.9 : « chaque cycle contient des circuits, sans imbrication » | D-451 ; ch04 l.369 (« Un cycle contient des exercices directs et des circuits ») | Contradiction interne au ch04 (bandeau D-449 non mis à jour) |
| X2 | ch09 l.19 : « un cycle contient des circuits, un circuit des exercices » | ch09 l.126 ; DM-004 | Idem |
| X3 | ch09 l.163-164 : « Le cycle et le Circuit ne peuvent pas être supprimés. Le nombre de répétitions du Cycle vaut toujours 1 dans le MVP. » | D-451 (1..99) ; G6 (le conteneur disparaît vidé) | Contradiction réelle ; le remplacement existe (D-451) mais le texte n'est pas annoté |
| X4 | ch09 l.73, 86, 188-189, 323, 325, 531, 819 ; ch04 l.409, l.429 ; PRODUCT l.58, l.132, l.134 : « avant le Circuit / dans le Circuit / après le Circuit », « Tout Tour appartient à un seul cycle », « Une ActivityDefinition du MVP T03 reste autonome » | D-451 ; D-449 | Résidus du modèle à circuit unique ; PRODUCT l.132-134 entoure la nouvelle ligne 3 de lignes à circuit unique |
| X5 | ch10 l.926-928 : « Exercices éventuellement placées avant le Circuit » … « après le Circuit » | même liste, item 3 (D-451) | Incohérence interne |
| X6 | RM-219 (ch10 l.2541), RM-251 (l.779), ch10 l.990 : règles écrites pour « le Circuit » | D-451 multi-conteneur | Ambiguïté ou lacune (B47), non une contradiction |
| X7 | ch10 l.1014 « Nature tours/séries » ; l.1034 « Sa nature est Tours ou Séries » ; l.1044 titre « de tours ou de séries » ; l.1055 « statut … nouveau » ; SU-08 « Circuits Tours/Séries » ; D449doc l.60 | COMP §2 l.28 (« termes historiques, pas une deuxième nomenclature active ») ; ch10 l.1063 | Doublon de vocabulaire (renommage décidé, texte non aligné) |
| X8 | ch10 l.1020 « exercice uniquement en autonome » ; l.1136 « un exercice seul utilise son Compte à rebours » ; l.1000 « Une Exécution directe » | D-449 SU-05 | Remplacé par le bandeau « sur ces seuls points » ; texte non annoté |
| X9 | ch07 D-058 l.313 (« Cycle technique vaut toujours 1 ») ; D-061 l.322 (« avant le Circuit, dans le Circuit ou après ») | D-449 l.1089 ; D-451 | Remplacement explicite, colonne Statut non annotée |
| X10 | D449doc §4 l.36 : « Un cycle contient un ou plusieurs circuits » | D-451 (« Précise et remplace SU-04 ») | Remplacement explicite ; le document D-449 n'est pas annoté |
| X11 | SRC §9.1 D6 l.290 : 80 pt ; SRC §8 l.258 « crée un conteneur vide » ; l.264 « le cycle s'étend par ses bornes » | COMP CS-D6 / 68 pt ; G5 ; G1–G8 | Résolu dans COMP (REVUE C01, C02, C07) ; SRC est verbatim |
| X12 | SRC §10 l.307 « aucun ne reste ouvert » | A (formats) et D (Partager) reportés | REVUE C13 : formulation trompeuse |
| X13 | Figma `10744:20108` : « Cycle A » seul | COMP l.52 (pas de lettre pour un seul conteneur) | Écart Figma, non corrigé (C09) |
| X14 | ch07 l.19 Q-E1 « (Epic E) » ; epics.md l.21, l.60 « application dans l'Epic E » | EPE l.244 ; sprint-status l.99 (E.8-b avec ou après l'epic C) | Référence périmée |
| X15 | ch10 l.937 « Séance/Circuit : agrégation » | D-451 (cycle) | Complément manquant (cycle non cité) |

## E. Mentions `docs` / `_bmad-output` à mettre à jour plus tard (mise à jour minimale)

**Présentent PRE-8 comme non fusionnée dans `main`** (PR #409 fusionnée, `547bb7ef`) :
- `_bmad-output/pre8/README.md` l.3 (« PR vers `main` […] fusion soumise à l'autorisation de Hermann ») ; l.65 (« une fois autorisée ; à défaut, la tête de `pre8-bmad/dev` ») ; l.69 (« décision sur la fusion de la PR PRE-8 ») ; l.20 (cause historique, « non fusionnée », à laisser datée).
- `_bmad-output/pre8/implementation-artifacts/sprint-status.yaml` l.4 (« non fusionnée dans main »).
- `_bmad-output/pre8/planning-artifacts/epics.md` l.50 (« non fusionné dans `main` »).
- `_bmad-output/pre8/bilan-epic-e-2026-10-28.md` l.75 (« `main` non fusionnée » : état daté), l.65.

**Rattachent E.8-b/Q-E1 à l'« epic C »** (libellé PRE-8 ; à réexprimer en chantier A de PRE-9) :
- `docs/Specifications-fonctionnelles/07 – Registre…` l.56 (« retiré quand l'epic C remplacera ce parcours ») et l.19 (« (Epic E) »).
- `_bmad-output/pre8/README.md` l.11 (« Hors autorisation : Epics C (Composition), D ») ; l.57 (« E.8-b et Q-E1 (conversion) avec ou après l'epic C ») ; l.67.
- `_bmad-output/pre8/implementation-artifacts/sprint-status.yaml` l.36, l.99.
- `_bmad-output/pre8/planning-artifacts/epic-e-catalogue-seances.md` l.51, l.55, l.228, l.244-245, l.271.
- `_bmad-output/pre8/planning-artifacts/epics.md` l.21-22, l.46, l.60.
- `_bmad-output/pre8/implementation-artifacts/spec-a-3-a-4-migration-014-repository.md` l.28-29 ; `spec-b-1-b-2-b-3-mouvements.md` l.51 ; `spec-e-catalogue-seances.md` l.33, l.67, l.69.

## F. Synthèse des points À CLARIFIER à soumettre à Hermann

1. Validation de la conversion E.8-b (A9) et de son articulation avec la clause « aucune conversion » de D-449 (A12).
2. Généralisation des points d'arrêt aux circuits multiples et aux cycles (B47), bloquante.
3. Sélection d'enveloppe : contiguïté, frontières, point inclus, éligibilité du menu (B23).
4. Position d'insertion d'un nouvel exercice (B26) ; duplication d'un conteneur (B29) ; déplacement d'un cycle entier (B40).
5. Cas nuls (B20) ; durée et arrondi du cycle (B51) ; persistance de l'état replié (B36) ; lettres au-delà de Z et après un déplacement (B7, B34).
6. Titre après retrait d'exercices ou personnalisation (A15).
7. Rendus non dessinés : stepper ouvert (B31), éclairage de destination (B39).
