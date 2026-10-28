# PRE-9 — Arbitrages à soumettre (28/10/2026)

> Points **réellement ouverts** après recherche des décisions existantes (`recherche/02-decisions-seance-composition.md`, `recherche/03-formats.md`, `recherche/04-figma.md`). Les décisions déjà prises ne sont pas rouvertes. Les recommandations sont des propositions de Claude, **non des décisions**. Classement : **STRUCTURANT** (bloque une story ou le contrat avant PRE-10) · **LOCAL** (bloque une seule story, peut être tranché au moment de la story) · **AVANT PRE-10** (n'empêche pas PRE-9).

## 1. Arbitrages structurants (à trancher avant de figer le plan)

### ARB-01 — Conversion E.8-b des anciens Exercices du Catalogue
- **Règle existante** : Q-E1 décidé (titre = premier Exercice, ch07 Q-E1). La conversion elle-même est écrite « Proposition de conversion, à arbitrer à ce moment » (`_bmad-output/pre8/planning-artifacts/epic-e-catalogue-seances.md` l.244-249). D-449 interdit tout effacement implicite de données (D-449 §5 l.46 ; ch12 l.81) et énonce « aucune conversion Exercice↔Séance » pour le **modèle cible** (D-449 §2 l.17).
- **Cas concret** : chaque ligne `activity_definitions` (Mouvement + paramètres) est aujourd'hui modifiable par la commande transitoire « Modifier » (E.8-a). PRE-9 doit retirer ce parcours.
- **Options** :
  - **A — Conversion en Séances d'un Exercice** (proposition E.8-b) : migration testée sur copie ; chaque définition devient une Séance d'un Exercice (titre Q-E1) ; définition retirée dans la même transaction ; annulation complète en cas d'échec ; table supprimée plus tard par une migration distincte.
  - **B — Conservation en lecture seule sans conversion** : table conservée, plus aucun parcours actif ; données inaccessibles à l'utilisateur.
  - **C — Conversion à la demande** (action explicite par définition) : plus de parcours, plus de code transitoire.
- **Impact** : bloque A.4 et A.5 ; B laisse une dette de données ; A est la seule option sans perte visible.
- **Recommandation** : A, avec rapport de migration (`migration_notices`) et test sur copie de base réelle.

### ARB-02 — Points d'arrêt avec plusieurs Circuits et des Cycles
- **Règle existante** : RM-219, RM-251, D-441, D-442 écrites pour **un** Circuit (ch10 l.2541, l.779). Le code PRE-8 refuse tout point d'arrêt hors du modèle à Circuit unique (`STRUCTURE_STOP_POINTS_UNSUPPORTED`, `src/domain/sessions/structure.ts:384`). COMP l.15 : D-451 « n'est pas une extension des positions d'arrêt ».
- **Questions** : point d'arrêt direct dans un Cycle (répété à chaque répétition ?) ; début/fin de répétition de Cycle ; entre deux Circuits successifs ; extension de l'exception RM-219 « début/fin de tour à N ≥ 2 » aux Cycles.
- **Options** :
  - **A — Positions au niveau Séance et à l'intérieur d'un Circuit seulement** (règles actuelles appliquées à chaque Circuit ; aucun point direct dans un Cycle) : minimal, sans nouvelle règle de répétition.
  - **B — Points aussi entre éléments d'un Cycle, répétés à chaque répétition du Cycle** (cohérent avec « interne au conteneur = répété », ch10 l.1021/1030).
  - **C — Report** : points interdits dans tout Cycle en PRE-9.
- **Impact** : bloque B.6 et la partie points d'arrêt de D.1 ; B peut demander une colonne `cycle_id` sur `session_stop_points` (migration).
- **Recommandation** : B, qui suit la règle déjà écrite pour les Circuits (interne = répété) ; à défaut A.

### ARB-03 — Structure admise par chaque Format sous D-451
- **Règle existante** : les règles Formats du 14/10 supposent un bloc ou un Circuit unique (FMT-12/13 Tabata « répétition de l'ensemble », FMT-21 EMOM `N × E × W`, FMT-26 AMRAP « le circuit est répété », FMT-30/31 For time « Volume par tour », Death by « bloc »). D-449 conserve les règles des formats (SU l.62) ; D-451 ouvre Cycles et multi-Circuits ; COMP l.64 reporte explicitement « les formats comme autre porte d'entrée ». Incompatibilités I-1 à I-5 et I-8 (`recherche/03-formats.md` §2).
- **Options** :
  - **A — Structure canonique par Format** (recommandé pour PRE-9) : une Séance d'un Format spécialisé a une structure fixée par le Format (un Circuit, ou une suite d'Exercices directs pour « Par exercice »), sans Cycle ni Circuit ajouté ; ajouter un conteneur est refusé avec un message, ou propose de passer en Libre (perte des contraintes annoncée, jamais silencieuse).
  - **B — Formats appliqués à toute structure D-451** : redéfinir chaque formule (répétition de l'ensemble, `N × E × W`, borne AMRAP, échelle For time, rang Death by) sur Cycles et multi-Circuits. Coût d'arbitrage élevé, nombreuses règles nouvelles.
  - **C — Format porté par un conteneur** (point A reporté de la source Composition, SRC §10).
- **Impact** : bloque C.3, C.4 et le descripteur de Format (D.3). Les départs rapides et Libre ne sont pas concernés (préremplissages Libre, FMT-28).
- **Recommandation** : A pour PRE-9 ; B ou C plus tard si un besoin est démontré.

### ARB-04 — Valeurs par défaut des réglages de Format
- **Règle existante** : constantes Tabata (8 × 20 s / 10 s) et 30/30 (30 s / 30 s) définies ; autres défauts **non définis** (répétition de l'ensemble Tabata, nombre de séries 30/30, W et N EMOM, durée AMRAP, échelle For time, q0/d/W Death by). Les chiffres Figma et des recettes sont des exemples (ch10 l.1524 ; REC-10 ; FMT-33).
- **Options** : A — adopter les exemples Figma/REC comme défauts (EMOM 1 min × 6, Death by 1 + 1/min, For time 21-15-9, AMRAP à fixer) ; B — Hermann fournit la table ; C — pas de défaut, champ à renseigner (tiret, bloquant).
- **Impact** : bloque C.3.
- **Recommandation** : B, ou A explicitement validé valeur par valeur.

### ARB-05 — Grille des modèles et devenir de « Un exercice »
- **Règle existante** : le contrat d'écran actif CE-FMT-01 (ch13, vers l.2305) désigne l'entrée `8598:29271`. Deux grilles Figma se contredisent : `8598:29271` (« Créer », carte « Mobilité », colonnes Exercice / Séance) et `9977:19613` (« Choisissez un format de départ », sans Mobilité, cartes « Un exercice » / « Une séance »). Flux et filtre disent « Gainage · Mobilité ». D-449 supprime l'Exercice autonome : une Séance d'un Exercice est une Séance.
- **Options** : A — `9977:19613` de référence, carte « Gainage · Mobilité » ajoutée, cartes « Un exercice » / « Une séance » fusionnées en « Libre » ; B — `8598:29271` de référence ; C — autre.
- **Impact** : bloque C.2 (écran de sélection). Figma n'est pas modifié par Claude.
- **Recommandation** : A, sous réserve de la mise à jour Figma par Hermann. **L'option A remplace l'entrée désignée par le contrat actif CE-FMT-01** : sa validation entraîne une correction documentaire de classe B (ch13 CE-FMT-01).

## 2. Arbitrages locaux (tranchables au moment de la story)

| ID | Question | Règle existante | Story | Recommandation |
|---|---|---|---|---|
| ARB-06 | Sélection d'enveloppe : contiguïté, enveloppe à cheval sur deux parents, point d'arrêt inclus, actions inéligibles | COMP l.64 ; ch13 l.1768 « explicitement réservées » ; REVUE C10 | B.2 | Contiguë, même parent, point d'arrêt refusé dans l'enveloppe, action grisée si aucun membre éligible |
| ARB-07 | Position d'insertion d'un nouvel Exercice / Mouvement | rien (D-449 §3 fixe seulement la reprise) | B.2 | Fin du niveau Séance, ou fin du conteneur déployé sélectionné |
| ARB-08 | Duplication d'un Circuit ou d'un Cycle | aucune règle | B.5 | Copie juste après la source, membres copiés, points d'arrêt non copiés (comme D-441) |
| ARB-09 | Déplacement d'un Cycle entier | aucun geste (COMP l.72) | B.4 | Hors PRE-9 ; ou appui long sur l'en-tête de Cycle |
| ARB-10 | Cas nuls : récupération après occurrence nulle, tour entièrement nul, extension dont la dernière valeur est 0 | COMP l.44 ; ch10 l.2616 | B.3, D.1 | Récupération sautée avec l'occurrence ; tour nul sauté |
| ARB-11 | Durée et arrondi du Cycle dans l'en-tête | D-443 (séance), COMP l.56 | B.7 | Même règle que la Séance (≈/≥, 15 s) |
| ARB-12 | Persistance de l'état replié — **confirmation seulement** : ch09 l.134 dit déjà que l'état « relève de la présentation » | ch09 l.134 | B.1 | Confirmer : non persistant (déployé à la réouverture) |
| ARB-13 | Lettres au-delà de Z, réattribution après déplacement | COMP l.52 | B.1 | AA, AB… ; réattribution par ordre visible |
| ARB-14 | Titre après retrait d'Exercices ; titre personnalisé | ch08 l.855 « non spécifiés » | B.9 | Un titre saisi n'est jamais remplacé automatiquement |
| ARB-15 | Nom d'une Séance de Format préremplie (nom du Format ou du premier Exercice) | CARTE §8 ; V2 l.143 | C.4 | Garder le nom du Format jusqu'à saisie |
| ARB-16 | Reprise d'une Séance formatée dans une autre (« Utiliser une séance existante ») | D-449 §3 ; I-7 | B.8, C.6 | Copie du contenu sans le Format ni ses contraintes, annoncée |
| ARB-17 | Duplication d'une Séance formatée | ch09 l.617 (général) | C.6 | Format, origine et réglages copiés |
| ARB-18 | Organisation et séries de 30/30 ; cible 0 dans l'échelle For time | FMT-19, I-12 | C.3 | À fournir |
| ARB-19 | Rendus non dessinés : stepper ouvert, éclairage de destination, Cycle déployé/replié, exercice direct de Cycle, glisser entre conteneurs | Figma `recherche/04-figma.md` §1, §7 | B.1, B.4 | Maquettes Figma par Hermann, ou rendu provisoire recetté sur iPhone |
| ARB-21 | Information affichée pour une Séance dont l'exécution n'est pas encore livrée (Libre avant PRE-10, Formats avant PRE-11) | cadrage l.47 : « l'état exact de lancement et son information utilisateur nécessitent un contrat explicite » ; Lecture indisponible (PRE-8, CE-T03-01) | C.6 | Conserver « Lecture indisponible » de PRE-8, sans message propre aux Formats |
| ARB-22 | Choix des Exercices dans le flux d'un Format (Tabata « quels exercices », EMOM « Choisis tes exercices ») et contenu des départs rapides (exercices et valeurs préremplis) | ch03 l.646 (Tabata seulement) ; `recherche/03-formats.md` l.56, l.138 « NON DÉFINI » ; Figma `8624:29980`, `8624:30040` | C.3, C.4, C.5 | Sélection de Mouvements par l'utilisateur dans le flux ; départs rapides : table fournie par Hermann |
| ARB-20 | Frames anciennes : Composition « Initial »/« Standard » à circuit par défaut, catalogue des exercices, exécution/synthèse d'un exercice | `8328:28172`, `8328:28605`, `4521:6220`, `5451:4272`, `4968:*`, `5588:*` | — | Les marquer obsolètes dans Figma (Hermann) |

## 3. Questions à instruire avant PRE-10 (ne bloquent pas PRE-9)

Sur les sept questions A1–A7 du cadrage (`docs/KODJO-Strategie-PRE9-PRE10-PRE11-Cadrage-Moteur-2026-10-28.md` §5, branche `docs/pre9-strategie-moteur-20261028` @ `10b4d6ee`) :

| ID | État des sources | Statut | Moment |
|---|---|---|---|
| A1 Développement progressif | Capacité décidée : plans finis déroulés, AMRAP et Death by générés jusqu'à leur borne (ch12 l.1829 ; ch11 l.315 ; CE-FMT-05 §15) | DÉJÀ DÉCIDÉ | Politique AMRAP × structure : avec ARB-03 |
| A2 Horloges multiples | Fenêtre ≠ bip ≠ audio, échéance globale AMRAP, rang Death by ; coexistence non écrite | À CLARIFIER | Avant la conception PRE-10 |
| A3 Déclencheurs | Familles présentes (échéance, appui, Suivant, borne, arrêt déclaré, Pause) ; R-01 ouvert | DÉJÀ DÉCIDÉ (familles) | R-01 : PRE-11 |
| A4 Fenêtre expirée pendant une étape | EMOM et Death by partiellement réglés ; AMRAP et For time non | À CLARIFIER | Représentabilité avant PRE-10 ; règles PRE-11 |
| A5 Adaptation en cours d'exécution | Instantané figé, plan non manipulable, progression Death by par formule | DÉJÀ DÉCIDÉ | — |
| A6 Exécution partielle et motif | Trois axes motif / résultat / achèvement (ch09 l.606, ch12 l.1833) | DÉJÀ DÉCIDÉ (concept) ; schéma = dépendance technique | Schéma minimal avant PRE-10 |
| A7 Interruptions et reprise | RM-066 à RM-070 ; R-01 pour les fenêtres | DÉJÀ DÉCIDÉ (invariants) | R-01 : PRE-11 |

## 4. Corrections documentaires préparées (après validation du plan)

Selon la règle permanente de synchronisation (classe B), proposées en lot à Hermann, sans modification dans cette mission :
- Contradictions avec D-451 non annotées : ch04 l.9 ; ch09 l.19, l.163-164 (« répétitions du Cycle vaut toujours 1 ») ; ch09 et ch04 « avant / après le Circuit » ; ch10 l.926-928 ; `PRODUCT.md` l.58, l.132, l.134 ; ch07 D-058, D-061 ; document D-449 §4 l.36 ; vocabulaire Tours/Séries (ch10 l.1014-1055, SU-08) — `recherche/02-decisions-seance-composition.md` §D.
- Référence rompue ch08 l.471-474 vers `SPECIFICATION-FORMATS-SEANCES-2026-10-14.md` (supprimé par `7a89220f`) ; texte normatif dans ch10 FMT-01…42 ; ancien §8.2 introuvable dans les chapitres actifs (`recherche/03-formats.md` C0).
- DSF Formats l.33-37 (dernière phase calculée) remplacée par D-446, non annotée (I-11).
- Ids Figma cités par ch13 l.521-524 absents de la page `510:101` (`recherche/04-figma.md` §6).
- Traçabilité PRE-8 : mentions « non fusionnée » et rattachement de E.8-b / Q-E1 à « l'epic C » (`recherche/02-decisions-seance-composition.md` §E) → réexprimer en « PRE-9, chantier A ».
