# PRD — PRE-9 : Composition simplifiée, configuration des Formats et contrat de séance

> **Statut : proposition soumise à la revue de ChatGPT et à la validation de Hermann. Aucun développement avant validation.** Fondé exclusivement sur les décisions existantes ; toute règle absente renvoie à `arbitrages-pre9.md`. Baseline `main @ 547bb7ef`.

## 1. Objectif

À l'issue de PRE-9, KODJO permet de **créer, modifier, organiser, enregistrer et rouvrir** les Séances du MVP, libres ou configurées par un Format, selon le modèle simplifié (D-449) et la Composition à conteneurs (D-451). Leur structure, leurs contraintes et leur instantané sont assez définis pour que PRE-10 développe le moteur commun sans reconstruire le modèle de Séance.

PRE-9 **représente et configure** ; il n'exécute pas. Aucun Format n'est annoncé comme exécutable (cadrage §1, principe 2).

## 2. Utilisateur et valeur

Hermann, utilisateur unique sur iPhone, compose ses séances d'entraînement : il veut des Cycles répétés, plusieurs Circuits et des Exercices directs dans une même Séance, et partir d'un Format (Tabata, EMOM…) dont les règles sont respectées et lisibles.

## 3. Périmètre

### Inclus
- **Chantier A — Séance simplifiée** : Composition, consultation, duplication et réouverture sur la structure générale ; création d'Exercice uniquement depuis un Mouvement ; fin des parcours `activity_definitions` ; conversion E.8-b et titres Q-E1 selon ARB-01.
- **Chantier B — Composition D-451** : Cycles, multi-Circuits, Exercices directs (Séance et Cycle), séries groupées/alternées, comptes, menu Créer à cinq actions, création par enveloppe, replié/déployé, glisser-déposer entre conteneurs avec défilement automatique, suppression et duplication, pauses et points d'arrêt (ARB-02), durées et synthèses, reprise d'une Séance existante, nom à trois états.
- **Chantier C — Formats** : sélection du modèle, paramètres imposés, récapitulatif, Composition préremplie, états verrouillé / réglable / calculé / libre / non applicable, validation des contraintes, édition, duplication, réouverture, persistance — pour Tabata, Intervalles 30/30, EMOM, AMRAP, For time, Death by, les cinq départs rapides et Libre.
- **Chantier D — Contrat** : développement déterministe du plan, instantané de Séance versionné, descripteurs de capacités par Format, validation d'exécutabilité.

### Exclu (PRE-10, PRE-11 ou autre)
Moteur, écrans d'exécution, horloges, audio, haptique, résultats persistés, reprise d'exécution (PRE-10) ; comportements spécialisés et règles R-01 à R-04 (PRE-11) ; VoiceOver (lot de fin de MVP) ; Planification, Programmes, Historique ; Trier ; emplacement pointillé (écart accepté PRE-8).

## 4. Exigences fonctionnelles (références)

| ID | Exigence | Source |
|---|---|---|
| FR-A1 | La Séance est le seul contenu enregistré, planifiable et lançable ; l'Exercice est un composant de la Séance | D-449 §1-2, SU-01…02 |
| FR-A2 | Toute Séance (Cycles, multi-Circuits, Exercices directs) s'ouvre, se consulte, se duplique et se rouvre sans perte | D-449, D-451, R-E6 |
| FR-A3 | Un Exercice se crée depuis un nouveau Mouvement ou un Mouvement existant, dans la Séance ; aucun parcours n'écrit ni ne lit d'Exercice autonome | D-449, COMP §5 |
| FR-A4 | Les anciennes définitions sont traitées selon ARB-01, sans effacement implicite ; titre Q-E1 | D-449 §5, Q-E1 |
| FR-B1 | Séance : Exercices, Circuits, Cycles dans leur ordre ; Cycle : Exercices directs et Circuits ; Circuit : Exercices ; pas d'imbrication au-delà | D-451, RM-025…029 |
| FR-B2 | Comptes Circuit et Cycle 1..99, défaut 1 ; RM-252 pour l'exécution des Exercices de Cycle | RM-026, RM-028, RM-252 |
| FR-B3 | Séries groupées/alternées, N commun en alternées, conversions avec confirmation si perte | COMP §2, ch10 l.1026-1156 |
| FR-B4 | Cibles à 0 autorisées, tiret bloquant, bornes du 28/10 | COMP §3, RM-234 |
| FR-B5 | Menu Créer à cinq actions + Annuler ; création par enveloppe ; jamais de conteneur vide ; aucune action « supprimer le conteneur » | COMP §5, G5, G6 |
| FR-B6 | En-têtes, lettres, hiérarchie par les fonds, Circuit replié (68 pt), Cycle non repliable | COMP §4 |
| FR-B7 | Glisser-déposer G1–G8, défilement automatique, en-têtes collantes CS-D1–CS-D8 | COMP §6-7, D-442 |
| FR-B8 | Pauses (récupérations) et points d'arrêt selon RM-209/210/219/251 et ARB-02 | D-441, D-442, ARB-02 |
| FR-B9 | Durées exactes/≈/≥, agrégats sur le plan développé, durée visible dans les en-têtes, arrondi D-443 | ch10 l.937, D-391, D-443 |
| FR-B10 | Reprise d'une Séance existante : copie au niveau principal, nouveaux identifiants, mêmes Mouvements, sans synchronisation | D-449 §3, SU-03 |
| FR-B11 | Nom de séance à trois états | ch08 l.849-855 |
| FR-B12 | Brouillon : seule « Continuer » enregistre ; validité = au moins un Exercice valide sans cible manquante ; Séance archivée en consultation | D-388, D-380, PRE-8 r2-02 |
| FR-C1 | Le Format est choisi à la création, persisté avec son origine, ses réglages et son organisation, jamais déduit d'un titre ni converti par édition ordinaire | FMT-03, FMT-40, ch09 l.593-598 |
| FR-C2 | Paramètres imposés présentés et grisés avec leur raison ; réglables éditables après composition ; calculés jamais saisis | DSF §3, FMT-04/05/17 |
| FR-C3 | Composition préremplie conforme au Format et à sa structure admise (ARB-03) ; contraintes réappliquées après édition | CE-FMT-03 §14, ARB-03 |
| FR-C4 | Départs rapides : préremplissages Libre sans verrouillage ; contenu prérempli selon ARB-22 | FMT-28 ; ARB-22 |
| FR-C7 | Choix des Exercices (Mouvements) dans le flux d'un Format | ch03 l.646 ; ARB-22 |
| FR-C5 | Une Séance formatée n'est jamais convertie silencieusement en Libre avec perte de contraintes | Mission PRE-9 §4.C |
| FR-C6 | Aucun Format n'est présenté comme exécutable avant PRE-10/PRE-11 ; l'information exacte affichée relève d'ARB-21 | Cadrage §2.B, l.47 (non décisionnel) ; ARB-21 |
| FR-D1 | Développement déterministe : Séance → Cycles (répétitions) → Circuits (groupées/alternées) → séries → côtés → R → point d'arrêt ; séries nulles sautées ; points consécutifs dédoublonnés | RM-252, ch10 l.1014-1015, l.1130, RM-234, RM-251 |
| FR-D2 | Instantané de Séance figé, versionné, indépendant des modifications ultérieures des Mouvements | SU-07, ch09 l.593-598 |
| FR-D3 | Pour chaque Format : expansion finie ou progressive, familles d'horloges et de déclencheurs, fin, progression, résultats attendus et partiels, interruptions et reprise, familles d'événements de signal — définis (table sourcée), non implémentés | ch11 l.315, ch12 l.1824-1834, ch10 l.1594-1600 |

## 5. Exigences non fonctionnelles

- **Conservation des données** : aucune perte à la migration ; toute incompatibilité détectée explicitement (cadrage §2.C).
- **Performance** : glisser-déposer fluide sur iPhone avec plusieurs conteneurs (référence : correctif PRE-8 f3-01, pas de rendu complet par image).
- **Primitives natives** privilégiées ; animations « Réduire les animations » respectées (B05).
- **Texte agrandi** et largeurs 360 / 402 / 440 ; cibles ≥ 44 pt sauf exception documentée (COMP l.56).
- **Synchronisation code / documentation** : chaque livraison applique `.claude/rules/synchronisation-code-documentation.md`.

## 6. Critères de sortie de PRE-9

1. Toutes les stories `done`, recette iPhone ciblée validée par Hermann.
2. Plus aucun parcours actif ne lit ou n'écrit `activity_definitions` (selon ARB-01).
3. Une Séance Libre à Cycles et multi-Circuits et une Séance par Format s'enregistrent et se rouvrent à l'identique.
4. Le contrat de passage (instantané, développement, descripteurs) est testé et documenté ; les critères d'entrée en PRE-10 du cadrage §7 sont vérifiables.
5. Suite Jest complète et ESLint global exécutés (fractionnés) et verts.
