# PRE-9 — Epics et stories (proposition)

> **Statut : plan en revue (ChatGPT, puis Hermann). Aucune story n'est lancée.** Références : `prd-pre9.md`, `architecture-pre9.md`, `arbitrages-pre9.md`, `etat-initial-et-ecarts.md`. Chaque story applique la règle permanente de synchronisation code / documentation (classe A à D consignée dans sa spec ; documentation de classe B mise à jour dans la même livraison).
>
> **Révision 1 du 29/10/2026** : décisions de Hermann intégrées (`arbitrages-pre9.md` §0) ; aucune story ajoutée, supprimée ni fusionnée ; A.5 devient conditionnelle ; Q.0 sort du chemin critique. Le plan compte **29 unités de travail** : 24 stories de développement (A.1–A.5 dont A.5 conditionnelle, B.1–B.9, C.1–C.6, D.1–D.4), 3 unités documentaires (D.5, DOC.0, DOC.1) et 2 activités de qualification (Q.0, Q.1). [Le compte rendu du 28/10 annonçait « 31 stories » : erreur de décompte, corrigée.] Les passages remplacés sont annotés entre crochets.

## Ordre recommandé

`DOC.0` (dès validation) → `A.1` → (`B.1`, `C.1`) → `D.1` → `B.2` → `A.2` → `B.3` → `B.4` → `B.5` → `B.6` → `B.7` → `B.8` → `B.9` → `C.2` → `C.3` → `C.4` → `C.5` → `C.6` → `D.2` → `D.3` → `D.4` → `D.5` → `A.4` → `A.3` → `DOC.1` → `Q.1`

Hors chemin critique : `Q.0` (activité distincte, à tout moment) ; `A.5` (conditionnelle, après `A.3`, seulement si ses conditions sont réunies).

[Ordre du 28/10 : `DOC.0` → `Q.0` → `A.1` → (`B.1`, `D.1`, `C.1`) → … → `A.4` → `A.3` → `A.5` → `DOC.1` → `Q.1`. Modifié le 29/10 : Q.0 non bloquant ; D.1 après C.1 (segments des éléments formatés progressifs) ; A.5 conditionnelle.]

Points de contrôle iPhone : après B.2 (structure éditable), après B.6 (Composition complète), après C.4 (premier Format complet), en fin de PRE-9 (passe ciblée).

---

## Epic Q — Qualification transverse

### Q.0 — Vérification globale fractionnée (dette PRE-8)
Activité distincte, **hors chemin critique** : ne bloque ni la validation du plan ni A.1. [28/10 : « recommandée avant A.1 » ; « toute anomalie est qualifiée avant de démarrer A.1 » — remplacé le 29/10.]
- Suite Jest complète exécutée par lots (domaines, infrastructure, fonctionnalités) et ESLint global ; résultats consignés.
- Toute anomalie est qualifiée (PRE-8 ou préexistante) et traitée séparément ; une anomalie qui touche une story en cours lui est signalée.

### Q.1 — Qualification de fin de PRE-9
- Suite complète fractionnée et ESLint verts ; recette iPhone ciblée (§ Stratégie) validée par Hermann ; critères de sortie du PRD vérifiés.

---

## Epic A — Séance simplifiée

### A.1 — Brouillon, service et dépôt sur la structure générale (fondation)
Dépend de : —. Arbitrages : —. Migration 016.
- Le brouillon porte une `SessionStructure` ; création, modification, consultation, duplication et réouverture passent par le chemin structuré.
- **Exercices directs de Cycle** représentés dans le domaine et en base (D-451 « Cycle : Exercices directs et Circuits » ; lacune constatée le 29/10 : `StructureCycle` ne porte que des Circuits, `activities` n'a pas de `cycle_id`) ; emplacement de Point d'arrêt à l'intérieur d'un Cycle (`session_stop_points.cycle_id`, ARB-06). Migration 016 testée en mémoire et sur copie de base réelle.
- Une Séance existante (ancien modèle) se rouvre à l'identique ; une Séance à Cycles (avec Exercices directs) et multi-Circuits (créée en test) se rouvre, se consulte et se duplique sans erreur.
- L'écran de Composition conserve exactement son comportement actuel (tous les tests d'intégration existants verts) : le changement est interne.
- Réserve de séries par Circuit ; points d'arrêt de l'ancien modèle conservés à leurs positions.

### A.2 — Créer un Exercice depuis un Mouvement
Dépend de : A.1, B.2 (menu Créer). Arbitrage : ARB-22a.
- « Créer un nouvel exercice » ouvre la création de Mouvement puis les paramètres de l'Exercice, dans la Séance ; « Utiliser un mouvement existant » ouvre la sélection des Mouvements par le parcours existant du Catalogue (PRE-8, actifs seulement, Q6 ; ARB-22a). L'Exercice est inséré après le dernier Exercice entré, dans son conteneur (ARB-07).
- Plus aucune lecture d'`activity_definitions` dans la Composition ; `ActivitySelectionScreen` et les parcours `catalogueDefinitionId` ne sont plus atteignables depuis la Composition.

### A.4 — Conversion E.8-b
Dépend de : A.2, **ARB-01 confirmé** (option A). Migration 018.
- Migration testée sur copie de base réelle : chaque définition devient une Séance d'un Exercice (titre Q-E1), Mouvement, paramètres et associations conservés ; annulation complète en cas d'échec ; rapport dans `migration_notices`.
- **Aucune ligne historique n'est retirée ni supprimée** par la conversion. [28/10 : « retrait de la définition dans la même transaction » — remplacé le 29/10 : conversion distinguée de la suppression.]
- Si ARB-01 retient l'option B ou C, la story est réécrite selon l'option retenue avant d'être lancée.

### A.3 — Retrait des parcours d'Exercices autonomes
Dépend de : la décision ARB-01 ; si option A, de A.4.
- Commande « Modifier » (E.8-a), parcours `/exercise?catalogueDefinitionId=` et écritures `ActivityDefinitionService` retirés ; `ExerciseScreen` limité à l'édition d'un Exercice de Séance ; `ActivityDefinitionService` réduit aux services Mouvements et référentiels encore utilisés (ou renommé).
- Test de garde : plus aucune lecture ni écriture d'`activity_definitions` hors migration.

### A.5 — Retrait de la table des définitions (**conditionnelle**)
Dépend de : A.3. Arbitrage : ARB-01. Migration 019. **Hors engagement PRE-9 par défaut.**
- Lancée seulement si trois conditions sont réunies : (1) justification de non-utilisation — le test de garde de A.3 est vert et aucun parcours ne lit la table ; (2) conservation des données démontrée — comptage et comparaison source → Séances sur copie de base réelle (A.4) ; (3) autorisation explicite de Hermann.
- Sinon la table est conservée, sans parcours actif ; l'état est consigné à la clôture de PRE-9.
- Si lancée : migration distincte supprimant `activity_definitions` et `activity_definition_body_zones` ; garde de non-régression sur toutes les migrations antérieures.
- [28/10 : « Dépend de : A.3, une version stable » — reclassée le 29/10 : la suppression n'est pas automatiquement autorisée.]

---

## Epic B — Composition D-451

### B.1 — Rendu de la structure : Cycles, Circuits, Exercices directs
Dépend de : A.1. Arbitrages : ARB-12, ARB-13, ARB-19 (décidés).
- Affichage des trois niveaux, Exercices directs de Séance et de Cycle, en-têtes (nom, chevron, compteur, durée), lettres (pas de lettre pour un conteneur unique ; après Z : AA, AB…, réattribuées selon l'ordre de Composition — ARB-13), hiérarchie par les fonds, Circuit replié (seconde ligne des noms, 68 pt), Cycle non repliable — Figma `10717:20056`, `10725:20142`, `10744:20108`.
- État replié/déplié non persisté ; Circuit déplié à l'ouverture ; aucun contenu du brouillon perdu pendant un repli (ARB-12).
- Comptes Circuit et Cycle 1..99 éditables (stepper au toucher du nombre), nature éditable par l'adjectif.
- Composants existants réutilisés (`CircuitHeader`, `OccurrenceCard`, `DisclosureControl`, stepper) ; un rendu non dessiné qui empêche une décision est signalé précisément, sans blocage général (ARB-19).

### B.2 — Menu Créer et création par enveloppe
Dépend de : B.1. Arbitrages : ARB-06, ARB-07 (décidés).
- Menu à cinq actions + Annuler (COMP §5 ; Figma `10705:20223`) ; un nouvel Exercice est inséré après le dernier Exercice entré, dans son conteneur (ARB-07).
- « Ajouter un circuit / un cycle » : l'utilisateur **pose le conteneur sur un premier contenu** ; le conteneur est créé autour de ce contenu ; jamais de conteneur vide ; une Séance commence sans Circuit (D-451 « aucun cycle implicite », COMP l.19, ch09 l.134 ; rendu Figma `10818:20175`). Contenus éligibles, déduits des règles d'imbrication D-451 : pour un Circuit, un Exercice du niveau Séance ou d'un Cycle ; pour un Cycle, un Exercice ou un Circuit du niveau Séance. Exercice formaté : ARB-24 (a).
- Le rendu Figma du mode enveloppe (`10819:20344`, `10836:20478`) est réutilisé pour désigner le premier contenu ; aucune sélection multiple n'est développée.
- [28/10 : « mode enveloppe […] Confirmer crée le conteneur avec au moins un membre » avec sélection contiguë sous un même parent — remplacé le 29/10 par ARB-06 ; les contenus suivants rejoignent le conteneur par glisser-déposer (B.4).]
- Détail local : présentation de l'action lorsqu'aucun contenu n'est éligible (Séance vide) — traitement existant des actions indisponibles réutilisé.

### B.3 — Séries groupées / alternées par Circuit, cibles à 0
Dépend de : B.1. Arbitrage : ARB-10 (décidé).
- Règles COMP §2 et ch10 l.1026-1156 appliquées à chaque Circuit (N commun, conversions avec confirmation si perte, réserve jusqu'à l'enregistrement, ajout ou déplacement vers un Circuit alterné).
- Cibles à 0 permises selon les règles, volume total de l'Exercice non nul (ARB-10, COMP §3 l.40), tiret bloquant, bornes du 28/10 (COMP §3).
- Modification d'un Exercice dans un conteneur : feuille de paramètres, N en lecture seule dans un Circuit alterné, pas de suppression locale de série qui romprait N (ch10 l.1142, l.1182).

### B.4 — Glisser-déposer entre conteneurs et défilement
Dépend de : B.2. Arbitrages : ARB-06, ARB-09 (décidés), ARB-24 (deux déposes seulement).
- G1–G8 (Exercice vers Circuit, Cycle ou Séance ; Circuit replié entre Cycles ou vers la Séance ; Circuit déployé replié au début du geste) ; éclairage de la destination ; défilement automatique (`useDragAutoScroll`) ; en-têtes collantes CS-D1–CS-D8 ; conteneur source vidé retiré au relâchement.
- **Remplir un conteneur** (ARB-06) : tout contenu peut y être déposé depuis une position non contiguë ou un autre conteneur, sans contrainte de contiguïté ni de parent commun, dans le respect des règles d'imbrication D-451.
- **Déplacement d'un Cycle entier** par le même geste (ARB-09). [28/10 : « ARB-09 : hors PRE-9 ou appui long » — remplacé.]
- **Point d'arrêt déposé dans un conteneur**, selon les règles de sa position de destination (ARB-06, B.6).
- Éléments formatés (en coordination avec C.4) : Circuit ou Exercice formaté déplacé comme tout élément, y compris dans un Cycle, Format et paramètres conservés (ARB-03) ; Exercice libre déposé dans un Circuit formaté et Exercice formaté déposé dans un Circuit : selon ARB-24 — ces deux seules déposes attendent la décision.
- Déplacement pas à pas existant (`stepOccurrence`) conservé et généralisé aux positions de l'arbre ; son retrait éventuel demanderait une décision de Hermann (comportement qualifié). [28/10 : « ou retiré explicitement, décision consignée » — corrigé le 29/10.]

### B.5 — Suppression et duplication
Dépend de : B.2. Arbitrages : ARB-08, ARB-17 (décidés).
- Suppression d'un Exercice (dernier membre : conteneur retiré ; points d'arrêt devenus interdits retirés sans message) ; duplication d'un Exercice (D-441), Format et paramètres conservés pour un Exercice formaté (ARB-17).
- Pas de duplication de Circuit ni de Cycle dans PRE-9 (ARB-08). [28/10 : « duplication d'un conteneur selon ARB-08 » — remplacé.]

### B.6 — Pauses et points d'arrêt sur toute la structure
Dépend de : B.4. Arbitrage : ARB-02 (partiellement décidé). Colonne de Point dans un Cycle : migration 016 (A.1).
- Mode Placement sur tous les niveaux ; RM-219, RM-251, D-441, D-442 évalués sur la séquence fonctionnelle de toute la structure, frontières de chaque conteneur comprises (proposition minimale ARB-02) ; récupération attachée à l'occurrence (RM-209/210).
- Points au niveau Séance et à l'intérieur d'un Circuit : développables sans attendre.
- Points à l'intérieur d'un Cycle (répétition, exception RM-219) : **ARB-02a/b**, seule partie bloquée.
- [28/10 : « ARB-02 (bloquant). Migration 017 si option B » — remplacé.]

### B.7 — Durées et synthèses
Dépend de : B.1, D.1. Arbitrage : ARB-11 (décidé).
- Durée par Circuit et par Cycle dans les en-têtes, total de Séance (≈/≥, D-443) calculés sur le plan développé (D.1) ; durée et arrondi du Cycle selon les règles de la Séance (ARB-11) ; un élément AMRAP contribue par sa durée imposée ; un élément Death by, sans durée calculable, est traité comme un Exercice sans durée conventionnelle, préfixe « ≥ » (application de D-070, à confirmer en revue) ; aucune valeur Figma prise comme oracle.

### B.8 — Utiliser une Séance existante
Dépend de : B.2, C.1. Arbitrage : ARB-16 (décidé).
- Copie de la composition au niveau principal à l'endroit choisi, nouveaux identifiants, mêmes Mouvements, paramètres copiés, sans début/fin propres ni synchronisation (D-449 §3).
- Éléments formatés copiés avec leur Format et leurs paramètres spécifiques (ARB-16). [28/10 : « copie sans le Format » — remplacé.] Ajout direct d'un nouvel élément formaté depuis la Composition : ARB-23 (ouvert, hors de cette story).

### B.9 — Nom de séance à trois états
Dépend de : B.2. Arbitrages : ARB-14, ARB-15 (décidés).
- Nom du Format (gris) → nom du premier Exercice (modifiable) → invite au deuxième Exercice (ch08 l.849-855) ; nom du Format comme nom initial proposé (ARB-15).
- Titre personnalisé jamais remplacé automatiquement ; titre encore suggéré recalculé selon les règles existantes (ARB-14).
- Point signalé (ch08 l.851 suppose un Format unique) : titre suggéré d'une Séance réunissant plusieurs éléments formatés, ou ouverte préremplie de plusieurs Exercices — appliquer ARB-14/ARB-15 sans règle nouvelle ; si elles ne suffisent pas, le cas précis est présenté à Hermann au moment de la story.

---

## Epic C — Configuration des Formats

### C.1 — Persistance et registre des Formats
Dépend de : A.1. Migration 017.
- **Format porté par l'élément** (ARB-03) : Format et réglages persistés sur le Circuit ou l'Exercice porteur, relus à l'identique ; origine de création de la Séance (FMT-02) ; version de règle figée dans l'instantané seulement (D.2). Un élément sans Format est libre ; une Séance peut contenir plusieurs éléments formatés, directement ou dans un Cycle.
- Registre déclaratif des 12 modèles (paramètres, états de verrouillage, bornes, porteur — `architecture-pre9.md` §5, table à confirmer en revue), défauts comme données (ARB-04 : un Format sans défauts reste indisponible) ; support de la répétition de l'ensemble Tabata selon ARB-25.
- Format conservé par déplacement, insertion dans une autre Séance (ARB-16) et duplication (ARB-17) : test d'aller-retour stockage par cas.
- [28/10 : « Format, origine, réglages, organisation et version de règle persistés » sur la Séance — remplacé le 29/10.]

### C.2 — Sélection du modèle
Dépend de : C.1, A.2. Arbitrage : ARB-05 (décidé).
- Grille CE-FMT-01 (entrée `8598:29271`) avec les deux cartes **Exercice** et **Séance**, non fusionnées (ARB-05) : Séance ouvre la Composition vide ; Exercice mène, par la sélection d'un Mouvement (parcours Catalogue, ARB-22a), à une Séance contenant ce seul Exercice ; chaque Format ou départ rapide ouvre son écran de paramètres.
- Présentation définitive (dont libellé « Mobilité » / « Gainage · Mobilité ») confrontée à Figma pendant la story, sans modification de Figma ni blocage (ARB-19). Enchaînement exact des écrans de la carte Exercice : à confronter à Figma, signalé s'il manque.
- Format dont les défauts manquent (ARB-04) ou départ rapide non défini (ARB-22c) : vignette indisponible, comme en PRE-8.

### C.3 — Paramètres imposés et récapitulatif
Dépend de : C.2. Arbitrages : ARB-03, ARB-18, ARB-22a (décidés) ; ARB-04 (défauts, par Format) ; ARB-25 (Tabata).
- Choix des Exercices dans le flux du Format par le parcours Catalogue existant (ARB-22a) ; le porteur (Exercice ou Circuit) suit la table du registre, **à confirmer en revue** (`architecture-pre9.md` §5 ; conséquence liée à ARB-24).
- Tabata : répétition de l'ensemble selon ARB-25 (ce seul réglage attend la décision).
- Par Format : constantes affichées et grisées avec leur raison ; réglables bornés ; calculés en direct (ex. EMOM `N × E × W`, par élément) ; organisation Par exercice / En alternance quand elle existe (nature du Circuit porteur) ; 30/30 : nombre commun de séries dans le Circuit (ARB-18a) ; For time sans segment, zéro admis dans l'échelle avec volume total non nul (ARB-18b) (CE-FMT-02, Figma `8624:*`).

### C.4 — Composition préremplie et verrouillage
Dépend de : C.3, B.3, B.4. Arbitrages : ARB-15 (décidé) ; ARB-24 (deux déposes).
- Composition préremplie : une Séance contenant **un élément formaté** (Circuit ou Exercice porteur) nommé du nom du Format ; nom de Séance initial = nom du Format (ARB-15) ; l'utilisateur peut ensuite ajouter des éléments libres, ou insérer une Séance formatée (B.8), avant, après ou autour, y compris dans un Cycle ; entrée directe d'un nouvel élément formaté : ARB-23.
- Modale de paramètres avec champs verrouillés (Figma `8747:14451`) ; contraintes réappliquées après édition **de l'élément** (CE-FMT-03 §14) ; refus métier d'une constante modifiée ; un élément formaté n'est jamais converti silencieusement en élément libre.
- Exercice ajouté dans un Circuit formaté (création, ARB-07) : contraintes du Format appliquées (EMOM : N conservé, durée recalculée, FMT-22). Déposes ARB-24 : selon la décision.
- Détail graphique local : place du nom du Mouvement dans la carte d'un Exercice formaté (ARB-19).
- [28/10 : « Composition préremplie conforme à la structure admise (ARB-03) » — remplacé le 29/10.]

### C.5 — Départs rapides
Dépend de : C.2. Arbitrages : ARB-22b (décidé) ; ARB-22c (**EN ATTENTE DE DÉFINITION FONCTIONNELLE**).
- Un seul mécanisme de préremplissage piloté par des données (`architecture-pre9.md` §5), capable des cas A (paramètres seuls), B (Mouvements et paramètres) et C (contenu variable par départ), testé sur des données de test ; aucun parcours propre à un départ.
- Renforcement, Gainage · Mobilité, Superset, Progression, À l'échec préremplissent une Séance d'éléments libres, sans verrouillage (FMT-28).
- Le contenu de chaque départ est ajouté comme donnée à la réception de sa définition ; un départ non défini reste indisponible. Seule cette activation est bloquée ; aucune valeur n'est inventée.

### C.6 — Modifier, dupliquer, rouvrir une Séance contenant des éléments formatés
Dépend de : C.4. Arbitrages : ARB-17, ARB-21 (décidés).
- Format et réglages de chaque élément conservés à l'enregistrement, à la réouverture et à la duplication de la Séance (ARB-17) ; changement d'organisation après composition (Tabata, EMOM, Progression ; interdit For time — ch11 l.313).
- « Lecture indisponible » inchangé, sans développement transitoire (ARB-21). [28/10 : « aucun Format présenté comme exécutable, information selon ARB-21 » — ARB-21 décidé.]

---

## Epic D — Contrat d'exécution

### D.1 — Développement du plan sur toute la structure (plans finis)
Dépend de : A.1, C.1. Arbitrages : ARB-02a/b (Points internes à un Cycle seulement) ; ARB-10b (signalé, non tranché).
- Fonction pure remplaçant `expandComposition` mono-Circuit : ordre C2, RM-252 (Exercices directs de Cycle compris), groupées/alternées, côtés, séries nulles sautées, points dédoublonnés, identité stable d'occurrence, contexte de Cycle (RM-083), élément formaté de rattachement ; tests de tableaux (exemple RM-252 : E0, cycle×2[E1, circuit×3[A,B]], E2).
- **Seuls les plans finis sont développés.** Un élément AMRAP ou Death by produit un segment progressif (élément, Format, réglages), répété avec son Cycle, sans occurrence générée ni liste non bornée. [28/10 : développement sans distinction des éléments progressifs — précisé le 29/10.]
- Occurrence sautée suivie d'une récupération (ARB-10b) : cas signalé dans le plan, sans règle inventée.

### D.2 — Instantané de Séance
Dépend de : D.1, C.1.
- Type versionné et constructeur purs (sur le modèle de `exerciseSnapshot` v3), indépendants des modifications ultérieures des Mouvements ; Format, réglages effectifs et version de règle **par élément formaté** ; sérialisation et persistance reportées à PRE-10, premier consommateur.

### D.3 — Descripteurs de capacités par Format
Dépend de : C.1.
- Table documentaire sourcée et type minimal, sans logique d'exécution, pour les 12 modèles appliqués à leur élément porteur : porteur, expansion, références temporelles et échéances nécessaires (A2), déclencheurs, comportement à l'expiration lorsqu'il est défini (A4), fin, progression, résultats pertinents — motif de fin, résultat réalisé, niveau d'achèvement (A6) —, `executionAvailable` (faux en PRE-9) ; « NON DÉFINI » explicite là où les sources sont muettes.

### D.4 — Validité de configuration
Dépend de : D.1, D.3.
- Validité de configuration par élément et pour la Séance (`valid` / `invalid` + motifs lisibles : cible manquante, volume nul, constante modifiée, structure invalide), sans réparation silencieuse ; utilisée par Continuer et par les contraintes réappliquées (C.4).
- Disponibilité du moteur **distincte** : lue dans le descripteur (D.3), jamais déduite de la validité ; aucun affichage nouveau (ARB-21).
- [28/10 : état unique `ready` / `incomplete` / `notExecutableYet` — remplacé le 29/10.]

### D.5 — Instruction des capacités d'exécution (document, sans code)
Dépend de : D.3.
- Pour les dimensions 3 à 10 du cadrage : règle source, capacité minimale, Formats concernés, état (DÉFINI / PARTIELLEMENT DÉFINI / NON DÉFINI), conséquence PRE-10 / PRE-11 ; interruptions et reprise (RM-066…070, R-01), résultats (motif, résultat réalisé, achèvement), familles d'événements de signal (interface, audio, haptique).
- A2, A4, A6 documentés **par Format** à partir des règles existantes ; seuls les cas réellement non définis sont présentés à Hermann (`arbitrages-pre9.md` §3), dont la suite de la Séance après un élément AMRAP ou Death by. [28/10 : « questions A2, A4, A6, A7 présentées à Hermann avant PRE-10 » — remplacé le 29/10.]

---

## Epic DOC — Documentation

### DOC.0 — Traçabilité PRE-8 et décisions du 29/10 (dès validation du plan)
- Mentions « PRE-8 non fusionnée » actualisées (`_bmad-output/pre8/README.md`, `sprint-status.yaml`, `epics.md`, bilan E) ; E.8-b / Q-E1 réexprimés « PRE-9, chantier A » (ch07, artefacts PRE-8).
- Décisions validées du 29/10 (`arbitrages-pre9.md` §0) consignées dans le registre (ch07), classe B ; aucune question ouverte n'y est inscrite comme décision.

### DOC.1 — Lot documentaire de clôture
- Contradictions D-451, ARB-03 et Formats listées dans `arbitrages-pre9.md` § 4 corrigées ou annotées selon les décisions prises ; seconde passe indépendante.

---

## Stratégie de qualification

**Automatisée**
- Domaine pur d'abord : tests unitaires de l'arbre (insertion, pose d'un conteneur sur un premier contenu, déplacement d'un Exercice, d'un Circuit, d'un Cycle et d'un Point, suppression, duplication d'Exercice, natures, points d'arrêt, développement, Formats par élément) avec cas limites (0, volume nul, N commun, conteneur vidé, frontières, élément formaté dans un Cycle répété).
- Base de données réelle (`NodeSqliteDatabase`) : chaque migration testée en mémoire **et sur copie d'une base réelle** ; aller-retour structure → stockage → structure sans perte, Format des éléments compris.
- Intégration écran : tests existants de la Composition gardés verts à chaque story ; nouveaux flux par epic (création par enveloppe, glisser entre conteneurs, Format bout en bout).
- Gardes : non-régression des migrations 001–015 ; pas de lecture `activity_definitions` hors migration (test de garde) après A.3.
- Suite complète exécutée par lots (contrainte mémoire constatée en PRE-8).

**Recette iPhone ciblée** (pas de recette générale ; Hermann ; page de recette avec résultats en base comme en PRE-8)
1. Après B.2 : créer une Séance à deux Cycles (avec Exercices directs), Circuits multiples et Exercices directs ; enregistrer, rouvrir, dupliquer.
2. Après B.6 : remplir un conteneur par glisser-déposer depuis des positions non contiguës, déplacer un Cycle entier, défilement, pauses et points d'arrêt, durées.
3. Après C.4 : Tabata (Circuit) et EMOM (Exercice) de bout en bout ; champs verrouillés ; élément formaté déplacé dans un Cycle ; réouverture.
4. Fin de PRE-9 : chaque Format disponible et départ rapide défini, Séance à plusieurs Formats, conversion E.8-b sur les données réelles (si ARB-01 = A), non-régression Catalogue PRE-8.

## Risques de planification
- Arbitrages encore ouverts et opérations bloquées (`arbitrages-pre9.md` §2 bis) : ARB-01 (A.4, forme de A.3, A.5) ; ARB-02a/b (Points internes à un Cycle dans B.6 et D.1) ; ARB-04 (mise à disposition des Formats concernés) ; ARB-22c (activation des départs rapides) ; ARB-24 (deux déposes dans B.4/C.4) ; ARB-25 (répétition de l'ensemble Tabata, C.1/C.3) ; ARB-23 (entrée Format dans la Composition, aucune story en cours) ; ARB-10b (un cas signalé dans D.1). Aucune story n'est bloquée en entier. [28/10 : « ARB-01 à ARB-05 conditionnent environ 11 stories » — remplacé.]
- Le volume du chantier B est le plus élevé ; la découpe B.1–B.9 permet une recette intermédiaire.
- A.1 porte désormais une migration (016) en plus du changement de modèle : tests sur copie de base réelle obligatoires.
- La dette de vérification globale PRE-8 (Q.0) est traitée séparément ; une régression constatée pendant A.1 est qualifiée avec Q.0 si elle n'est pas encore faite.
