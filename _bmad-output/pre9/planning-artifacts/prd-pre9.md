# PRD — PRE-9 : Composition simplifiée, configuration des Formats et contrat de séance

> **Statut : proposition soumise à la revue de ChatGPT et à la validation de Hermann. Aucun développement avant validation.** Fondé exclusivement sur les décisions existantes ; toute règle absente renvoie à `arbitrages-pre9.md`. Baseline `main @ 547bb7ef`.
>
> **Révision 1 du 29/10/2026** : décisions de Hermann intégrées (`arbitrages-pre9.md` §0), dont ARB-03 — plusieurs Formats successifs dans une Séance, Format porté par un Circuit ou un Exercice. Les exigences remplacées sont annotées entre crochets.
>
> **Révision 2 du 29/10/2026** : ARB-01, ARB-02a/b, ARB-10b, ARB-23, ARB-24, ARB-25 validés (`arbitrages-pre9.md` §0 bis) ; restent ouverts ARB-04, ARB-22c et trois questions d'application limitées à C.4 (ARB-26 à ARB-28).

> **Clarification ciblée (29/10/2026) :** les formulations antérieures du PRD « Format porté par Circuit ou Exercice » sont remplacées par la propriété **par Exercice uniquement**, et la présentation replié/déplié s'appuie sur Figma ; le plan historique reste traçable dans le registre.

## 1. Objectif

À l'issue de PRE-9, KODJO permet de **créer, modifier, organiser, enregistrer et rouvrir** les Séances du MVP, libres ou configurées par un Format, selon le modèle simplifié (D-449) et la Composition à conteneurs (D-451) ; une Séance peut réunir plusieurs éléments formatés et libres, directement ou dans des Cycles (ARB-03). Leur structure, leurs contraintes et leur instantané sont assez définis pour que PRE-10 développe le moteur commun sans reconstruire le modèle de Séance.

PRE-9 **représente et configure** ; il n'exécute pas. Aucun Format n'est annoncé comme exécutable (cadrage §1, principe 2).

## 2. Utilisateur et valeur

Hermann, utilisateur unique sur iPhone, compose ses séances d'entraînement : il veut des Cycles répétés, plusieurs Circuits et des Exercices directs dans une même Séance, et partir d'un Format (Tabata, EMOM…) dont les règles sont respectées et lisibles.

## 3. Périmètre

### Inclus
- **Chantier A — Séance simplifiée** : Composition, consultation, duplication et réouverture sur la structure générale (Exercices directs de Cycle compris) ; création d'Exercice uniquement depuis un Mouvement ; fin des parcours `activity_definitions` ; conversion E.8-b et titres Q-E1 selon ARB-01 ; suppression des tables historiques seulement sous conditions (A.5).
- **Chantier B — Composition D-451** : Cycles, multi-Circuits, Exercices directs (Séance et Cycle), séries groupées/alternées, comptes, menu Créer à six actions (dont « Format », ARB-23), création par enveloppe (ARB-06), replié/déployé, glisser-déposer entre conteneurs et déplacement d'un Cycle entier avec défilement automatique, suppression, duplication d'Exercice, pauses et points d'arrêt (ARB-02), durées et synthèses, reprise d'une Séance existante, nom à trois états.
- **Chantier C — Formats** : sélection du modèle (cartes Exercice et Séance, Formats, départs rapides), paramètres imposés, récapitulatif, Composition préremplie, états verrouillé / réglable / calculé / libre / non applicable, validation des contraintes **par élément formaté**, édition, duplication, réouverture, persistance — pour Tabata, Intervalles 30/30, EMOM, AMRAP, For time, Death by, les cinq départs rapides et Libre. Mise à disposition de chaque Format et départ rapide conditionnée à ses valeurs (ARB-04, ARB-22c).
- **Chantier D — Contrat** : développement déterministe des plans finis, instantané de Séance versionné, descripteurs de capacités par Format, validité de configuration distinguée de la disponibilité du moteur.

### Exclu (PRE-10, PRE-11 ou autre)
Moteur, écrans d'exécution, horloges, audio, haptique, résultats persistés, reprise d'exécution (PRE-10) ; comportements spécialisés et règles R-01 à R-04 (PRE-11) ; VoiceOver (lot de fin de MVP) ; Planification, Programmes, Historique ; Trier ; emplacement pointillé (écart accepté PRE-8) ; duplication de Circuit ou de Cycle (ARB-08) ; génération des occurrences des Formats progressifs (PRE-10/11).

## 4. Exigences fonctionnelles (références)

| ID | Exigence | Source |
|---|---|---|
| FR-A1 | La Séance est le seul contenu enregistré, planifiable et lançable ; l'Exercice est un composant de la Séance | D-449 §1-2, SU-01…02 |
| FR-A2 | Toute Séance (Cycles avec Exercices directs, multi-Circuits, Exercices directs, éléments formatés) s'ouvre, se consulte, se duplique et se rouvre sans perte | D-449, D-451, R-E6, ARB-17 |
| FR-A3 | Un Exercice se crée depuis un nouveau Mouvement ou un Mouvement existant, dans la Séance ; aucun parcours n'écrit ni ne lit d'Exercice autonome | D-449, COMP §5 |
| FR-A4 | Les anciennes définitions sont traitées selon ARB-01, sans effacement implicite ; titre Q-E1 ; conversion automatique, transactionnelle et sans perte (Mouvements, paramètres, médias, associations) ; la conversion ne supprime aucune donnée historique ; la suppression des tables exige justification de non-utilisation, preuve de conservation et autorisation de Hermann | D-449 §5, Q-E1, ARB-01 |
| FR-B1 | Séance : Exercices, Circuits, Cycles dans leur ordre ; Cycle : Exercices directs et Circuits ; Circuit : Exercices ; pas d'imbrication au-delà | D-451, RM-025…029 |
| FR-B2 | Comptes Circuit et Cycle 1..99, défaut 1 ; RM-252 pour l'exécution des Exercices de Cycle | RM-026, RM-028, RM-252 |
| FR-B3 | Séries groupées/alternées, N commun en alternées, conversions avec confirmation si perte | COMP §2, ch10 l.1026-1156 |
| FR-B4 | Cibles à 0 autorisées, tiret bloquant, bornes du 28/10 | COMP §3, RM-234 |
| FR-B5 | Menu Créer à six actions + Annuler, dont « Format » qui réutilise le flux de Format (ARB-23) ; nouvel Exercice après le dernier Exercice entré, dans son conteneur ; création par enveloppe : conteneur posé sur un premier contenu, puis contenus ajoutés par glisser-déposer depuis toute position, sans contiguïté ni parent commun ; jamais de conteneur vide ; aucune action « supprimer le conteneur » ; pas de duplication de conteneur | COMP §5, G5, G6, ARB-06, ARB-07, ARB-08, ARB-23 |
| FR-B6 | En-têtes, lettres et hiérarchie des fonds ; Circuit replié : **deuxième ligne existante** listant les Exercices et, pour chacun, son Format éventuel ; déplié : cartes individuelles visibles ; aucun titre commun dérivé du Format ni état de repli persisté ; Cycle non repliable | COMP §4 ; Figma `10717:20056`, `10725:20142` ; clarification 29/10 |
| FR-B7 | Glisser-déposer G1–G8, déplacement d'un Cycle entier, Point d'arrêt déposé dans un conteneur, défilement automatique, en-têtes collantes CS-D1–CS-D8 | COMP §6-7, D-442, ARB-06, ARB-09 |
| FR-B8 | Pauses (récupérations) et points d'arrêt selon RM-209/210/219/220/251, D-441, D-442 appliquées à toute la structure ; Point interne à un Cycle rencontré à chaque répétition, Point au niveau Séance non répété ; frontières, exceptions, demande de choix et retraits des répétitions de Cycle comme pour le Circuit, par le même mécanisme | D-441, D-442, ARB-02a/b |
| FR-B9 | Durées exactes/≈/≥, agrégats sur le plan développé, durée visible dans les en-têtes, arrondi D-443, Cycle selon les règles de la Séance | ch10 l.937, D-391, D-443, ARB-11 |
| FR-B10 | Reprise d'une Séance existante : copie au niveau principal, nouveaux identifiants, mêmes Mouvements, sans synchronisation ; éléments formatés copiés avec Format et paramètres | D-449 §3, SU-03, ARB-16 |
| FR-B11 | Nom de séance à trois états ; nom du Format comme nom initial proposé ; titre personnalisé jamais remplacé | ch08 l.849-855, ARB-14, ARB-15 |
| FR-B12 | Brouillon : seule « Continuer » enregistre ; validité = au moins un Exercice valide sans cible manquante ; Séance archivée en consultation | D-388, D-380, PRE-8 r2-02 |
| FR-C0 | Une Séance peut enchaîner des Exercices de plusieurs Formats, directement ou dans des Circuits/Cycles ; **seul l'Exercice porte son Format** ; le Circuit organise ses membres (groupées/alternées, compte), sans Format propre. Un Circuit groupé répète les passages de ses membres ; le Cycle répète sa séquence ; les prescriptions internes du Format restent applicables ; aucun nouveau compteur de répétition de Format | ARB-03/25 précisés par Hermann, 29/10 ; ch07 clarification |
| FR-C1 | Le Format est choisi et persisté **sur chaque Exercice** avec ses réglages ; il n'est ni porté ni déduit par le Circuit. L'origine de création reste sur la Séance ; un Exercice formaté conserve ses réglages lors des déplacements, copies et duplications ; une adoption par un second Exercice demande un choix explicite et n'est jamais produite par simple dépose | FMT-03/04, ARB-16/17, décision `c458dac6`, ch09 cible |
| FR-C2 | Paramètres imposés présentés et grisés avec leur raison ; réglables éditables après composition ; calculés jamais saisis | DSF §3, FMT-04/05/17 |
| FR-C3 | Composition préremplie : une Séance contenant un ou plusieurs Exercices formatés selon le modèle choisi ; chaque Exercice conserve ses contraintes après édition ; le Circuit n'ajoute pas de Format aux membres | CE-FMT-03 §14, clarification 29/10 |
| FR-C4 | Départs rapides : préremplissages d'éléments libres sans verrouillage, par un seul mécanisme couvrant paramètres seuls, Mouvements et paramètres, contenu variable par départ ; contenu de chaque départ EN ATTENTE DE DÉFINITION FONCTIONNELLE | FMT-28 ; ARB-22b, ARB-22c |
| FR-C7 | Choix des Mouvements dans le flux d'un Format et de la carte Exercice par le parcours existant du Catalogue ; les Mouvements choisis deviennent des Exercices configurés | ch03 l.646 ; ARB-22a |
| FR-C8 | Grille de création avec deux cartes Exercice (Séance contenant initialement un seul Exercice) et Séance (Composition à plusieurs éléments), non fusionnées | CE-FMT-01 ; ARB-05 |
| FR-C5 | Un élément formaté n'est jamais converti silencieusement en élément libre avec perte de contraintes | Mission PRE-9 §4.C ; ARB-03 |
| FR-C9 | Déposes et insertions : contrôler la compatibilité du Format **de chaque Exercice** avec la nature et le compte du Circuit avant mutation ; refuser une dépose incompatible sans altération. **Adoption volontaire** d'un Format par un nouvel Exercice distincte d'une simple dépose ; confirmation avant perte de valeurs selon les règles existantes ; ni transmission ni effacement implicite du Format. Aucune classification obligatoire des Circuits en homogènes/mixtes | D-05/D-07/D-12, décision `c458dac6`, CE-FMT-03 §14 |
| FR-C6 | Aucun Format n'est présenté comme exécutable avant PRE-10/PRE-11 ; « Lecture indisponible » conservé, sans développement transitoire | Cadrage §2.B, l.47 (non décisionnel) ; ARB-21 |
| FR-D1 | Développement déterministe des plans finis : Séance → Cycles (répétitions) → Circuits (groupées/alternées) → séries → côtés → R → point d'arrêt ; séries nulles sautées sans leur récupération associée (pauses indépendantes conservées) ; Cycle × k = k développements complets, sans autre facteur ; points consécutifs dédoublonnés ; éléments progressifs (AMRAP, Death by) représentés par un segment, sans occurrence générée | RM-252, ch10 l.1014-1015, l.1130, RM-234, RM-251, ch12 l.1829 |
| FR-D2 | Instantané de Séance figé, versionné, indépendant des modifications ultérieures des Mouvements | SU-07, ch09 l.593-598 |
| FR-D3 | Pour chaque Format **porté par un Exercice** : expansion finie ou progressive, références temporelles et échéances nécessaires, déclencheurs, expiration (règle existante ou NON DÉFINI), fin, progression, résultats pertinents (motif, résultat réalisé, achèvement), interruptions et reprise, familles d'événements de signal — documentés par capacité, non implémentés en PRE-9 | ch11 l.315, ch12 l.1824-1834, clarification 29/10 |
| FR-D4 | Validité de configuration (par élément et pour la Séance, avec motifs) distincte de la disponibilité du moteur | Mission du 29/10 §10.5 ; CE-FMT-02/04 §14 |

## 5. Exigences non fonctionnelles

- **Conservation des données** : aucune perte à la migration ; toute incompatibilité détectée explicitement (cadrage §2.C).
- **Performance** : glisser-déposer fluide sur iPhone avec plusieurs conteneurs (référence : correctif PRE-8 f3-01, pas de rendu complet par image).
- **Primitives natives** privilégiées ; animations « Réduire les animations » respectées (B05).
- **Texte agrandi** et largeurs 360 / 402 / 440 ; cibles ≥ 44 pt sauf exception documentée (COMP l.56).
- **Synchronisation code / documentation** : chaque livraison applique `.claude/rules/synchronisation-code-documentation.md`.

## 6. Critères de sortie de PRE-9

1. Toutes les stories `done`, recette iPhone ciblée validée par Hermann.
2. Plus aucun parcours actif ne lit ou n'écrit `activity_definitions` (selon ARB-01) ; données historiques conservées sauf suppression autorisée (A.5).
3. Une Séance libre à Cycles (avec Exercices directs) et multi-Circuits, et une Séance réunissant plusieurs éléments formatés dont un dans un Cycle répété, s'enregistrent et se rouvrent à l'identique ; chaque Format mis à disposition fonctionne de bout en bout jusqu'à « Lecture indisponible ».
4. Le contrat de passage (instantané, développement, descripteurs) est testé et documenté ; les critères d'entrée en PRE-10 du cadrage §7 sont vérifiables.
5. Suite Jest complète et ESLint global exécutés (fractionnés) et verts.
