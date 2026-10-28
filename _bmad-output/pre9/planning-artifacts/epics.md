# PRE-9 — Epics et stories (proposition)

> **Statut : plan en revue (ChatGPT, puis Hermann). Aucune story n'est lancée.** Références : `prd-pre9.md`, `architecture-pre9.md`, `arbitrages-pre9.md`, `etat-initial-et-ecarts.md`. Chaque story applique la règle permanente de synchronisation code / documentation (classe A à D consignée dans sa spec ; documentation de classe B mise à jour dans la même livraison).

## Ordre recommandé

`DOC.0` (dès validation) → `Q.0` → `A.1` → (`B.1`, `D.1`, `C.1` en parallèle possible) → `B.2` → `A.2` → `B.3` → `B.4` → `B.5` → `B.6` → `B.7` → `B.8` → `B.9` → `C.2` → `C.3` → `C.4` → `C.5` → `C.6` → `D.2` → `D.3` → `D.4` → `D.5` → `A.4` → `A.3` → `A.5` → `DOC.1` → `Q.1`

Points de contrôle iPhone : après B.2 (structure éditable), après B.6 (Composition complète), après C.4 (premier Format complet), en fin de PRE-9 (passe ciblée).

---

## Epic Q — Qualification transverse

### Q.0 — Vérification globale fractionnée (dette PRE-8)
Activité distincte, **recommandée avant A.1**, non bloquante pour la validation du plan.
- Suite Jest complète exécutée par lots (domaines, infrastructure, fonctionnalités) et ESLint global ; résultats consignés.
- Toute anomalie est qualifiée (PRE-8 ou préexistante) avant de démarrer A.1.

### Q.1 — Qualification de fin de PRE-9
- Suite complète fractionnée et ESLint verts ; recette iPhone ciblée (§ Stratégie) validée par Hermann ; critères de sortie du PRD vérifiés.

---

## Epic A — Séance simplifiée

### A.1 — Brouillon, service et dépôt sur la structure générale (fondation)
Dépend de : —. Arbitrages : —.
- Le brouillon porte une `SessionStructure` ; création, modification, consultation, duplication et réouverture passent par le chemin structuré.
- Une Séance existante (ancien modèle) se rouvre à l'identique ; une Séance à Cycles et multi-Circuits (créée en test) se rouvre, se consulte et se duplique sans erreur.
- L'écran de Composition conserve exactement son comportement actuel (tous les tests d'intégration existants verts) : le changement est interne.
- Réserve de séries par Circuit ; points d'arrêt de l'ancien modèle conservés à leurs positions.

### A.2 — Créer un Exercice depuis un Mouvement
Dépend de : A.1, B.2 (menu Créer).
- « Créer un nouvel exercice » ouvre la création de Mouvement puis les paramètres de l'Exercice, dans la Séance ; « Utiliser un mouvement existant » ouvre la sélection des Mouvements (catalogue PRE-8, actifs seulement, Q6).
- Plus aucune lecture d'`activity_definitions` dans la Composition ; `ActivitySelectionScreen` et les parcours `catalogueDefinitionId` ne sont plus atteignables depuis la Composition.

### A.4 — Conversion E.8-b
Dépend de : A.2, ARB-01 (option A).
- Migration testée sur copie de base réelle : chaque définition devient une Séance d'un Exercice (titre Q-E1), Mouvement, paramètres et associations conservés ; retrait de la définition dans la même transaction ; annulation complète en cas d'échec ; rapport dans `migration_notices`.

### A.3 — Retrait des parcours d'Exercices autonomes
Dépend de : A.4.
- Commande « Modifier » (E.8-a), parcours `/exercise?catalogueDefinitionId=` et écritures `ActivityDefinitionService` retirés ; `ExerciseScreen` limité à l'édition d'un Exercice de Séance ; `ActivityDefinitionService` réduit aux services Mouvements et référentiels encore utilisés (ou renommé).

### A.5 — Retrait de la table des définitions
Dépend de : A.3, une version stable. Arbitrage : ARB-01.
- Migration distincte supprimant `activity_definitions` et `activity_definition_body_zones` ; garde de non-régression sur toutes les migrations antérieures.

---

## Epic B — Composition D-451

### B.1 — Rendu de la structure : Cycles, Circuits, Exercices directs
Dépend de : A.1. Arbitrages : ARB-12, ARB-13, ARB-19 (rendus).
- Affichage des trois niveaux, en-têtes (nom, chevron, compteur, durée), lettres (pas de lettre pour un conteneur unique), hiérarchie par les fonds, Circuit replié (seconde ligne des noms, 68 pt), Cycle non repliable — Figma `10717:20056`, `10725:20142`, `10744:20108`.
- Comptes Circuit et Cycle 1..99 éditables (stepper au toucher du nombre), nature éditable par l'adjectif.

### B.2 — Menu Créer et création par enveloppe
Dépend de : B.1. Arbitrages : ARB-06, ARB-07.
- Menu à cinq actions + Annuler (COMP §5 ; Figma `10705:20223`) ; « Ajouter un circuit / un cycle » ouvre le mode enveloppe (Figma `10819:20344`, `10836:20478`) ; « Confirmer » crée le conteneur avec au moins un membre ; jamais de conteneur vide ; une Séance commence sans Circuit (D-451 « aucun cycle implicite », COMP l.19, ch09 l.134 ; rendu Figma `10818:20175`).

### B.3 — Séries groupées / alternées par Circuit, cibles à 0
Dépend de : B.1. Arbitrage : ARB-10.
- Règles COMP §2 et ch10 l.1026-1156 appliquées à chaque Circuit (N commun, conversions avec confirmation si perte, réserve jusqu'à l'enregistrement, ajout ou déplacement vers un Circuit alterné).
- Cibles à 0, tiret bloquant, bornes du 28/10 (COMP §3).
- Modification d'un Exercice dans un conteneur : feuille de paramètres, N en lecture seule dans un Circuit alterné, pas de suppression locale de série qui romprait N (ch10 l.1142, l.1182).

### B.4 — Glisser-déposer entre conteneurs et défilement
Dépend de : B.2. Arbitrages : ARB-09, ARB-19.
- G1–G8 (Exercice vers Circuit, Cycle ou Séance ; Circuit replié entre Cycles ou vers la Séance ; Circuit déployé replié au début du geste) ; éclairage de la destination ; défilement automatique (`useDragAutoScroll`) ; en-têtes collantes CS-D1–CS-D8 ; conteneur source vidé retiré au relâchement.
- Déplacement pas à pas existant (`stepOccurrence`) généralisé aux positions de l'arbre (ou retiré explicitement, décision consignée).

### B.5 — Suppression et duplication
Dépend de : B.2. Arbitrage : ARB-08.
- Suppression d'un Exercice (dernier membre : conteneur retiré ; points d'arrêt devenus interdits retirés sans message) ; duplication d'un Exercice (D-441) ; duplication d'un conteneur selon ARB-08.

### B.6 — Pauses et points d'arrêt sur toute la structure
Dépend de : B.4. Arbitrage : **ARB-02** (bloquant). Migration 017 si option B.
- Mode Placement sur tous les niveaux autorisés ; RM-219, RM-251, D-442 évalués par conteneur ; récupération attachée à l'occurrence (RM-209/210).

### B.7 — Durées et synthèses
Dépend de : B.1. Arbitrage : ARB-11.
- Durée par Circuit et par Cycle dans les en-têtes, total de Séance (≈/≥, D-443) calculés sur le plan développé (D.1) ; aucune valeur Figma prise comme oracle.

### B.8 — Utiliser une Séance existante
Dépend de : B.2. Arbitrage : ARB-16.
- Copie de la composition au niveau principal à l'endroit choisi, nouveaux identifiants, mêmes Mouvements, paramètres copiés, sans début/fin propres ni synchronisation (D-449 §3).

### B.9 — Nom de séance à trois états
Dépend de : B.2. Arbitrage : ARB-14.
- Nom du Format (gris) → nom du premier Exercice (modifiable) → invite au deuxième Exercice (ch08 l.849-855).

---

## Epic C — Configuration des Formats

### C.1 — Persistance et registre des Formats
Dépend de : A.1. Migration 016.
- Format, origine, réglages, organisation et version de règle persistés et relus ; registre déclaratif des 12 modèles (paramètres, états de verrouillage, bornes) ; une Séance sans Format reste Libre.

### C.2 — Sélection du modèle
Dépend de : C.1. Arbitrage : **ARB-05**.
- Grille de référence ; Libre ouvre la Composition vide ; chaque modèle ouvre son écran de paramètres (CE-FMT-01).

### C.3 — Paramètres imposés et récapitulatif
Dépend de : C.2. Arbitrages : **ARB-03**, **ARB-04**, ARB-18, ARB-22.
- Choix des Exercices dans le flux du Format selon ARB-22.
- Par Format : constantes affichées et grisées avec leur raison ; réglables bornés ; calculés en direct (ex. EMOM `N × E × W`) ; organisation Par exercice / En alternance quand elle existe ; For time sans segment (CE-FMT-02, Figma `8624:*`).

### C.4 — Composition préremplie et verrouillage
Dépend de : C.3, B.3. Arbitrages : ARB-15, ARB-22.
- Composition préremplie conforme à la structure admise (ARB-03) ; modale de paramètres avec champs verrouillés (Figma `8747:14451`) ; contraintes réappliquées après édition ; refus métier d'une constante modifiée ; jamais de passage silencieux en Libre.

### C.5 — Départs rapides
Dépend de : C.2. Arbitrages : ARB-04, ARB-22 (exercices et valeurs préremplis).
- Renforcement, Gainage · Mobilité, Superset, Progression, À l'échec préremplissent une Séance Libre sans verrouillage (FMT-28).

### C.6 — Modifier, dupliquer, rouvrir une Séance formatée
Dépend de : C.4. Arbitrages : ARB-16, ARB-17, ARB-21.
- Format et réglages conservés à l'enregistrement, à la réouverture et à la duplication ; changement d'organisation après composition (Tabata, EMOM, Progression ; interdit For time — ch11 l.314) ; aucun Format présenté comme exécutable, information selon ARB-21.

---

## Epic D — Contrat d'exécution

### D.1 — Développement du plan sur toute la structure
Dépend de : A.1 (ARB-02 pour les points d'arrêt de Cycle).
- Fonction pure remplaçant `expandComposition` mono-Circuit : ordre C2, RM-252, groupées/alternées, côtés, séries nulles sautées, points dédoublonnés, identité stable d'occurrence, contexte de Cycle (RM-083) ; tests de tableaux (exemple RM-252 : E0, cycle×2[E1, circuit×3[A,B]], E2).

### D.2 — Instantané de Séance
Dépend de : D.1, C.1.
- Type versionné et constructeur purs (sur le modèle de `exerciseSnapshot` v3), indépendants des modifications ultérieures des Mouvements ; sérialisation et persistance reportées à PRE-10, premier consommateur.

### D.3 — Descripteurs de capacités par Format
Dépend de : C.1. Arbitrage : ARB-03.
- Table documentaire sourcée et type minimal, sans logique d'exécution : expansion, horloges, déclencheurs, fin, progression, résultats attendus et partiels pour les 12 modèles ; « NON DÉFINI » explicite là où les sources sont muettes.

### D.4 — Validation d'exécutabilité
Dépend de : D.1, D.3.
- `ready` / `incomplete` / `notExecutableYet` ; motifs lisibles ; aucune réparation silencieuse.

### D.5 — Instruction des capacités d'exécution (document, sans code)
Dépend de : D.3.
- Pour les dimensions 3 à 10 du cadrage : règle source, capacité minimale, Formats concernés, état (DÉFINI / PARTIELLEMENT DÉFINI / À CLARIFIER), conséquence PRE-10 / PRE-11 ; interruptions et reprise (RM-066…070, R-01), résultats partiels et motif (trois axes), familles d'événements de signal (interface, audio, haptique) ; questions A2, A4, A6, A7 présentées à Hermann avant PRE-10.

---

## Epic DOC — Documentation

### DOC.0 — Traçabilité PRE-8 (dès validation du plan)
- Mentions « PRE-8 non fusionnée » actualisées (`_bmad-output/pre8/README.md`, `sprint-status.yaml`, `epics.md`, bilan E) ; E.8-b / Q-E1 réexprimés « PRE-9, chantier A » (ch07, artefacts PRE-8).

### DOC.1 — Lot documentaire de clôture
- Contradictions D-451 et Formats listées dans `arbitrages-pre9.md` § 4 corrigées ou annotées selon les décisions prises ; seconde passe indépendante.

---

## Stratégie de qualification

**Automatisée**
- Domaine pur d'abord : tests unitaires de l'arbre (insertion, enveloppe, déplacement, suppression, duplication, natures, points d'arrêt, développement, Formats) avec cas limites (0, N commun, conteneur vidé, frontières).
- Base de données réelle (`NodeSqliteDatabase`) : chaque migration testée en mémoire **et sur copie d'une base réelle** ; aller-retour structure → stockage → structure sans perte.
- Intégration écran : tests existants de la Composition gardés verts à chaque story ; nouveaux flux par epic (création par enveloppe, glisser entre conteneurs, Format bout en bout).
- Gardes : non-régression des migrations 001–015 ; pas de lecture `activity_definitions` hors migration (test de garde) après A.3.
- Suite complète exécutée par lots (contrainte mémoire constatée en PRE-8).

**Recette iPhone ciblée** (pas de recette générale ; Hermann ; page de recette avec résultats en base comme en PRE-8)
1. Après B.2 : créer une Séance à deux Cycles, Circuits multiples et Exercices directs ; enregistrer, rouvrir, dupliquer.
2. Après B.6 : glisser-déposer entre conteneurs, défilement, pauses et points d'arrêt, durées.
3. Après C.4 : Tabata et EMOM de bout en bout ; champs verrouillés ; réouverture.
4. Fin de PRE-9 : chaque Format et départ rapide, conversion E.8-b sur les données réelles, non-régression Catalogue PRE-8.

## Risques de planification
- Les arbitrages ARB-01 à ARB-05 conditionnent environ 11 stories (A.3–A.5, B.6, C.2–C.6, D.3, D.4) ; les autres stories ne dépendent que d'arbitrages locaux ou d'autres stories.
- Le volume du chantier B est le plus élevé ; la découpe B.1–B.9 permet une recette intermédiaire.
- La dette de vérification globale PRE-8 (Q.0) doit être levée tôt pour qualifier les régressions de A.1.
