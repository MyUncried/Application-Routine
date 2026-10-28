# PRE-9 — État initial, matrice des écarts et dépendances (28/10/2026)

Baseline : `main @ 547bb7ef` (PR #409, PRE-8 intégrée). Cadrage : `docs/KODJO-Strategie-PRE9-PRE10-PRE11-Cadrage-Moteur-2026-10-28.md` (branche `docs/pre9-strategie-moteur-20261028` @ `10b4d6ee`, lu sans fusion ; **document de cadrage, non décisionnel**). Preuves détaillées : `recherche/01` à `04` (fichier:ligne, décisions, nodes Figma).

## 1. Synthèse de l'état initial

- **Données et domaine prêts, interface en retard.** La structure générale D-449 (Exercices directs, plusieurs Circuits, plusieurs Cycles) existe dans le domaine (`src/domain/sessions/structure.ts:45-74`) et en base (migration 014 : `cycles`, `tours.cycle_id`, `activities.tour_id` nullables). Le dépôt offre `createStructured`, `updateStructured`, `findStructuredById`, **sans aucun appelant hors tests**. Le brouillon, le service et l'écran de Composition (6 060 lignes) restent sur l'ancien modèle « avant / Circuit unique / après ».
- **Risque latent** : une Séance plus riche que l'ancien modèle ne peut être ni rouverte, ni consultée, ni dupliquée (`SessionStructureNotRepresentableError`, aucun écran ne la gère). Aucune Séance de ce type n'est créable aujourd'hui par l'interface.
- **Points d'arrêt** : interdits dès que la structure dépasse le Circuit unique (`STRUCTURE_STOP_POINTS_UNSUPPORTED`).
- **Anciens Exercices autonomes** : segment retiré du Catalogue (E.8-a), mais la sélection d'Exercices de la Composition lit encore `activity_definitions` et la commande « Modifier » ouvre `ExerciseScreen` en écriture sur cette table.
- **Formats** : 12 vignettes (`sessionFormats.ts`), seul Libre disponible ; aucune persistance, aucun paramètre, aucun écran de configuration.
- **Exécution** : aucun moteur ni écran ; briques pures réutilisables (développement `expandComposition` mono-Circuit, registre et calculs de durée, instantané d'Exercice v3, phrases, guidage des phases).
- **Documentation** : D-449 et D-451 décidés ; règles Formats du 14/10 actives dans ch10 (FMT-01…42) mais écrites pour un bloc unique ; 15 contradictions ou résidus non annotés ; une référence normative rompue (ch08 → spécification Formats supprimée).
- **Figma** : écrans de conteneurs du 28/10 présents et conformes à la documentation ; écrans Formats complets par modèle ; plusieurs frames anciennes (circuit par défaut, exercice autonome) ; deux grilles de modèles contradictoires.
- **Tests** : 65 fichiers de tests Séances (19 d'intégration), 27 base de données ; dette PRE-8 : suite Jest complète et ESLint global non revérifiés.

## 2. Matrice des écarts

Statuts : **QUALIFIÉ** (développé et qualifié) · **PARTIEL** · **DOC NON DÉV.** (documenté, non développé) · **À ADAPTER** · **À CLARIFIER** · **HORS PRE-9**.

### Chantier A — Séance simplifiée

| Élément | État actuel | Cible PRE-9 | Écart | Source de vérité | Impact technique | Traitement proposé |
|---|---|---|---|---|---|---|
| Structure D-449 en base et domaine | Tables et types complets (014) | Inchangée | Aucun | D-449, DM-003/004, migration 014 | — | **QUALIFIÉ** — réutiliser |
| Brouillon, service, lecture/écriture UI | Ancien modèle (Circuit unique) | Structure générale de bout en bout | Brouillon et service à refaire sur `SessionStructure` | D-449, D-451 | Cœur de PRE-9 ; touche Composition, consultation, duplication | **À ADAPTER** — story A.1 |
| Réouverture d'une Séance riche | Erreur non gérée | Rouvrir, consulter, dupliquer toute Séance | Bloquant dès qu'une Séance riche existe | D-449, R-E6 (PRE-8) | `findStructuredById` partout | **À ADAPTER** — A.1 |
| Création d'un Exercice | Via `/exercise` et sélection `activity_definitions` | Depuis un Mouvement (nouveau ou existant), dans la Séance | Lecture/écriture `activity_definitions` encore actives | D-449 §1, menu Créer (COMP §5, Figma `10705:20223`) | `ActivitySelectionScreen`, `ExerciseScreen`, `ActivityDefinitionService` | **À ADAPTER** — A.2 |
| Commande transitoire « Modifier » (E.8-a) | Active | Retirée | Parcours à supprimer | ch07 (E.8-a « transitoire ») | Après A.4 | **À ADAPTER** — A.3 |
| Conversion E.8-b | Proposition non validée | Selon arbitrage | Décision manquante | EPE l.244-249 ; D-449 §5 | Migration de données | **À CLARIFIER** — ARB-01 |
| Titre Q-E1 des Séances converties | Décidé | Appliqué par la conversion | — | ch07 Q-E1 | Dans la migration | **DOC NON DÉV.** — A.4 |
| Table `activity_definitions` | Présente | Retirée après conversion | — | EPE (migration distincte) | Migration distincte | **À CLARIFIER** — A.5 (ARB-01) |
| Reprise d'une Séance existante | Décidée (D-449 §3), non développée | Menu « Utiliser une séance existante » | — | D-449 §3, SU-03, CE-SU-03 | Copie de structure, nouveaux identifiants | **DOC NON DÉV.** — B.8 |
| Nom de séance à trois états | Décidé, non développé | Appliqué | — | ch07, ch08 l.849-855 | Composition | **DOC NON DÉV.** — B.9 |

### Chantier B — Composition D-451

| Élément | État actuel | Cible PRE-9 | Écart | Source de vérité | Impact technique | Traitement proposé |
|---|---|---|---|---|---|---|
| Cycles visibles, plusieurs Circuits, Exercices directs (séance et cycle) | Lecture seule dans la carte du Catalogue (`SessionCompositionTree`) | Édition complète | Toute l'édition | D-451, RM-025…029, RM-252 | Refonte du rendu de la Composition | **DOC NON DÉV.** — B.1 |
| Comptes 1..99 (Cycle et Circuit) | Circuit seulement ; Cycle ≥ 1 sans maximum dans le domaine | 1..99 pour les deux | Borne haute du Cycle | RM-026, RM-028 | `structure.ts:40-43` | **À ADAPTER** — B.1 |
| En-têtes, lettres, replié/déployé, hiérarchie par les fonds | Absent (Composition) | COMP §4 | Tout | COMP §4, ch07 l.1138-1139, Figma `10717:20056`, `10744:20108` | Composants | **DOC NON DÉV.** — B.1 ; ARB-12, ARB-13, ARB-19 |
| Menu Créer à 5 actions, création par enveloppe | Arbre à 3 options | COMP §5 | Tout | COMP §5, Figma `10705:20223`, `10819:20344`, `10836:20478` | Mode de sélection d'enveloppe | **DOC NON DÉV.** — B.2 ; ARB-06, ARB-07 |
| Séries groupées / alternées, N commun, conversions | Un Circuit | Par Circuit | Généraliser | COMP §2, ch10 l.1026-1156 | `circuit.ts` à généraliser | **PARTIEL** — B.3 |
| Glisser-déposer + défilement automatique | Un Circuit, 3 zones | Entre conteneurs (G1–G8), en-têtes collantes (CS-D1–D8) | Cibles et décalages multi-niveaux | COMP §6-7, D-442 | `compositionGesture.ts`, `useDragAutoScroll` | **PARTIEL** — B.4 ; ARB-09 |
| Suppression / duplication | Exercice seulement | Exercice ; conteneur vidé qui disparaît | Conteneurs | G6, D-441, RM-210 | — | **PARTIEL** — B.5 ; ARB-08 |
| Pauses et points d'arrêt | Circuit unique | Toute la structure | Règle manquante | RM-219, RM-251, D-442 | `StopPoint.ts`, `placement.ts`, garde `structure.ts:384` | **À CLARIFIER** — B.6 ; ARB-02 |
| Durées et synthèses | Séance et Circuit | + Cycle, en-têtes | Durée de Cycle | ch10 l.937, D-391, D-443 | `computeStructureDuration` existe | **PARTIEL** — B.7 ; ARB-11 |
| Cibles à 0, tiret, bornes du 28/10 | À vérifier dans le code | COMP §3, RM-234 | Probable (minimum 0) | ch07 l.1141-1142 | Validation des paramètres | **À ADAPTER** — B.3 ; ARB-10 |
| Brouillon, Continuer, consultation archivée | Qualifié (ancien modèle) | Conservé sur la structure | Portage | D-388, D-380, PRE-8 r2-02 | A.1 | **QUALIFIÉ** (comportement) / **À ADAPTER** (modèle) |

### Chantier C — Formats

| Élément | État actuel | Cible PRE-9 | Écart | Source de vérité | Impact technique | Traitement proposé |
|---|---|---|---|---|---|---|
| Persistance du Format | Aucune colonne | Format facultatif, origine, réglages, organisation, version de règle | Tout | ch09 l.593-598, FMT-42 | **Migration** `sessions` | **DOC NON DÉV.** — C.1 |
| Sélection du modèle | Vignettes pour le filtre seulement | Écran de choix | Tout | CE-FMT-01, Figma `9977:19613` / `8598:29271` | — | **À CLARIFIER** — C.2 ; ARB-05 |
| Paramètres imposés et récapitulatif | Absent | CE-FMT-02 par modèle | Tout | FMT-10…38, Figma `8624:*`, `8656:*` | Registre de Formats | **DOC NON DÉV.** — C.3 ; ARB-03, ARB-04 |
| Composition préremplie, verrouillage | Absent | CE-FMT-03/04, modale grisée | Tout | DSF §3, FMT-17, Figma `8747:14451` | Feuille de paramètres : état verrouillé | **DOC NON DÉV.** — C.4 |
| Contraintes réappliquées après édition | Absent | CE-FMT-03 §14 | Règle par Format sous D-451 | I-8 | Validation | **À CLARIFIER** — ARB-03 |
| Départs rapides | Absent | Préremplissages Libre | Valeurs à fixer | FMT-28, ch10 l.1524 | Aucun moteur | **DOC NON DÉV.** — C.5 |
| Modification, duplication, réouverture | Absent | Format conservé | Duplication non définie | FMT-03/40, ch09 l.617 | — | **DOC NON DÉV.** — C.6 ; ARB-16, ARB-17 |
| Information « exécution non disponible » | Lecture indisponible partout (PRE-8) | Selon ARB-21 | Contrat d'information non défini (cadrage l.47) | cadrage §2.B (non décisionnel) | — | **À CLARIFIER** — C.6 ; ARB-21 |
| Choix des Exercices dans le flux d'un Format ; contenu des départs rapides | Absent | Flux CE-FMT-02/03 | Règle non définie hors Tabata | ch03 l.646 ; Figma `8624:29980`, `8624:30040` | Sélection de Mouvements | **À CLARIFIER** — C.3–C.5 ; ARB-22 |

### Chantier D — Contrat avec le futur moteur

| Élément | État actuel | Cible PRE-9 | Écart | Source de vérité | Impact technique | Traitement proposé |
|---|---|---|---|---|---|---|
| Développement du plan (ordre) | `expandComposition`, Circuit unique, tests seulement | Toute la structure, ordre C2 | Cycles, multi-Circuits, Exercices de Cycle | RM-252, ch10 l.1014-1015, l.1130, l.992 | Fonction pure | **PARTIEL** — D.1 |
| Instantané de Séance | Instantané d'Exercice v3 inutilisé | Instantané de Séance versionné (structure, Format, réglages effectifs, version de règle) | Niveau Séance | SU-07, ch09 l.593-598, ch11 l.13 | Type et sérialisation | **PARTIEL** — D.2 |
| Descripteurs de capacités par Format | Absent | Matrice Format × capacité (expansion, horloges, déclencheurs, fin, résultats) | Tout | ch11 l.315, ch12 l.1824-1834, FMT | Données déclaratives | **DOC NON DÉV.** — D.3 |
| Validation d'exécutabilité | `validateStructureShape` | Contrôle « prête pour l'exécution » | Règles ch10 | cadrage §2.C (l.47) ; CE-FMT-02/04 §14 | Pur | **PARTIEL** — D.4 |
| Résultats attendus et partiels, horloges, interruptions et reprise, signaux (interface, audio, haptique) | Absent | **Capacités définies** (table sourcée), non implémentées | Définition à produire | A2, A4, A6, A7, R-01, RM-066…070 | Aucun code | **DOC NON DÉV.** — D.3, D.5 (implémentation : PRE-10/11) |

## 3. Analyse des dépendances

```text
Q.0 vérification globale fractionnée (activité distincte, recommandée avant A.1)
A.1 brouillon/service/dépôt sur la structure ──┬─> B.1 rendu D-451 ──> B.2 menu et enveloppe ──> B.4 glisser-déposer
                                               │                     └─> B.3 séries par Circuit ──┐  └─> B.5 suppression/duplication
                                               │                     └─> B.7 durées                  B.6 points d'arrêt (ARB-02)
                                               │                     └─> B.8 reprise, B.9 nom
                                               ├─> A.2 Exercice depuis Mouvement ──> A.4 conversion (ARB-01) ──> A.3 retrait des parcours ──> A.5 retrait de la table
                                               ├─> D.1 développement du plan ──> D.2 instantané ──> D.4 exécutabilité
                                               └─> C.1 persistance du Format ──> C.2 sélection (ARB-05) ──> C.3 paramètres (ARB-03, ARB-04, ARB-22) ──> C.4 préremplie et verrous (+ B.3) ──> C.6 édition/duplication (ARB-21)
                                                        │                                 └─> C.5 départs rapides (ARB-22)
                                                        └─> D.3 descripteurs (ARB-03) ──> D.4 exécutabilité ;  D.5 instruction des capacités d'exécution
```

Dépendances externes : décisions ARB-01 à ARB-05 ; maquettes non dessinées (ARB-19) ; instruction A2, A4, A6 avant PRE-10 (n'empêche pas PRE-9).

**Ajustement du découpage indicatif** : le chantier A est scindé. Sa partie « fondation » (A.1) précède tout le reste, car Composition, Formats et contrat lisent et écrivent la même structure ; sa partie « fin des anciens Exercices » (A.2–A.5) suit le menu Créer de la Composition, qui fournit le parcours de remplacement. Sans ce réordonnancement, B et C seraient développés sur un brouillon voué à disparaître.
