# PRE-9 — État initial, matrice des écarts et dépendances (28/10/2026)

Baseline : `main @ 547bb7ef` (PR #409, PRE-8 intégrée). Cadrage : `docs/KODJO-Strategie-PRE9-PRE10-PRE11-Cadrage-Moteur-2026-10-28.md` (branche `docs/pre9-strategie-moteur-20261028` @ `10b4d6ee`, lu sans fusion ; **document de cadrage, non décisionnel**). Preuves détaillées : `recherche/01` à `04` (fichier:ligne, décisions, nodes Figma).

> **Révision 1 du 29/10/2026** : décisions de Hermann intégrées (`arbitrages-pre9.md` §0) ; une lacune de l'état initial corrigée (Exercices directs de Cycle, ci-dessous) ; lignes de matrice et dépendances ajustées. Passages remplacés annotés entre crochets.

## 1. Synthèse de l'état initial

- **Données et domaine presque prêts, interface en retard.** La structure générale D-449 (Exercices directs de Séance, plusieurs Circuits, plusieurs Cycles) existe dans le domaine (`src/domain/sessions/structure.ts:45-74`) et en base (migration 014 : `cycles`, `tours.cycle_id`, `activities.tour_id` nullables). **[Correction du 29/10 : les Exercices directs de Cycle (D-451, 28/10, postérieure à la migration 014) ne sont pas représentables — `StructureCycle` ne contient que des Circuits (`structure.ts:52-56`, refus d'un Cycle sans Circuit `:355`) et `activities` n'a pas de `cycle_id` (`migration014.ts:133`) ; `session_stop_points` n'a pas non plus de `cycle_id`. Traitement : A.1, migration 016.]** Le dépôt offre `createStructured`, `updateStructured`, `findStructuredById`, **sans aucun appelant hors tests**. Le brouillon, le service et l'écran de Composition (6 060 lignes) restent sur l'ancien modèle « avant / Circuit unique / après ».
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
| Structure D-449 en base et domaine | Tables et types (014), sans Exercice direct de Cycle ni Point dans un Cycle | Structure D-451 complète | `StructureCycle` sans Exercices directs ; `activities.cycle_id` et `session_stop_points.cycle_id` absents | D-449, D-451, DM-003/004, migration 014 ; ARB-06 | Type de domaine, dépôt, migration 016 | **À ADAPTER** — A.1 [28/10 : « QUALIFIÉ — réutiliser », corrigé le 29/10] |
| Brouillon, service, lecture/écriture UI | Ancien modèle (Circuit unique) | Structure générale de bout en bout | Brouillon et service à refaire sur `SessionStructure` | D-449, D-451 | Cœur de PRE-9 ; touche Composition, consultation, duplication | **À ADAPTER** — story A.1 |
| Réouverture d'une Séance riche | Erreur non gérée | Rouvrir, consulter, dupliquer toute Séance | Bloquant dès qu'une Séance riche existe | D-449, R-E6 (PRE-8) | `findStructuredById` partout | **À ADAPTER** — A.1 |
| Création d'un Exercice | Via `/exercise` et sélection `activity_definitions` | Depuis un Mouvement (nouveau ou existant), dans la Séance | Lecture/écriture `activity_definitions` encore actives | D-449 §1, menu Créer (COMP §5, Figma `10705:20223`) | `ActivitySelectionScreen`, `ExerciseScreen`, `ActivityDefinitionService` | **À ADAPTER** — A.2 |
| Commande transitoire « Modifier » (E.8-a) | Active | Retirée | Parcours à supprimer | ch07 (E.8-a « transitoire ») | Après la décision ARB-01 ; après A.4 si option A | **À ADAPTER** — A.3 |
| Conversion E.8-b | Proposition non validée | Selon arbitrage ; conversion sans retrait de ligne | Confirmation de Hermann attendue (recommandation ChatGPT : conversion automatique) | EPE l.244-249 ; D-449 §5 | Migration de données (018) | **À CLARIFIER** — ARB-01 |
| Titre Q-E1 des Séances converties | Décidé | Appliqué par la conversion | — | ch07 Q-E1 | Dans la migration | **DOC NON DÉV.** — A.4 |
| Table `activity_definitions` | Présente | Conservée sans parcours actif ; suppression seulement si non-utilisation justifiée, conservation prouvée et autorisation de Hermann | — | EPE (migration distincte) ; ARB-01 | Migration conditionnelle (019) | **CONDITIONNEL** — A.5 [28/10 : « Retirée après conversion », remplacé le 29/10] |
| Reprise d'une Séance existante | Décidée (D-449 §3), non développée | Menu « Utiliser une séance existante », éléments formatés copiés avec leur Format | — | D-449 §3, SU-03, CE-SU-03, ARB-16 | Copie de structure, nouveaux identifiants | **DOC NON DÉV.** — B.8 |
| Nom de séance à trois états | Décidé, non développé | Appliqué | — | ch07, ch08 l.849-855 | Composition | **DOC NON DÉV.** — B.9 |

### Chantier B — Composition D-451

| Élément | État actuel | Cible PRE-9 | Écart | Source de vérité | Impact technique | Traitement proposé |
|---|---|---|---|---|---|---|
| Cycles visibles, plusieurs Circuits, Exercices directs (séance et cycle) | Lecture seule dans la carte du Catalogue (`SessionCompositionTree`) | Édition complète | Toute l'édition | D-451, RM-025…029, RM-252 | Refonte du rendu de la Composition | **DOC NON DÉV.** — B.1 |
| Comptes 1..99 (Cycle et Circuit) | Circuit seulement ; Cycle ≥ 1 sans maximum dans le domaine | 1..99 pour les deux | Borne haute du Cycle | RM-026, RM-028 | `structure.ts:40-43` | **À ADAPTER** — B.1 |
| En-têtes, lettres, replié/déployé, hiérarchie par les fonds | Absent (Composition) | COMP §4 | Tout | COMP §4, ch07 l.1138-1139, Figma `10717:20056`, `10744:20108` | Composants | **DOC NON DÉV.** — B.1 ; ARB-12, ARB-13, ARB-19 |
| Menu Créer à 5 actions, création par enveloppe | Arbre à 3 options | COMP §5 ; conteneur posé sur un premier contenu, puis glisser-déposer (ARB-06) ; insertion après le dernier Exercice entré (ARB-07) | Tout | COMP §5, ARB-06, ARB-07, Figma `10705:20223`, `10819:20344`, `10836:20478` | Pose d'un conteneur sur un contenu (pas de sélection multiple) | **DOC NON DÉV.** — B.2, B.4 |
| Séries groupées / alternées, N commun, conversions | Un Circuit | Par Circuit | Généraliser | COMP §2, ch10 l.1026-1156 | `circuit.ts` à généraliser | **PARTIEL** — B.3 |
| Glisser-déposer + défilement automatique | Un Circuit, 3 zones | Entre conteneurs (G1–G8), Cycle entier (ARB-09), Point dans un conteneur (ARB-06), en-têtes collantes (CS-D1–D8) | Cibles et décalages multi-niveaux | COMP §6-7, D-442, ARB-06, ARB-09 | `compositionGesture.ts`, `useDragAutoScroll` | **PARTIEL** — B.4 ; ARB-24 (deux déposes) |
| Suppression / duplication | Exercice seulement | Exercice ; conteneur vidé qui disparaît ; pas de duplication de conteneur (ARB-08) | Suppression dans les conteneurs | G6, D-441, RM-210, ARB-08, ARB-17 | — | **PARTIEL** — B.5 |
| Pauses et points d'arrêt | Circuit unique | Toute la structure | Règles existantes appliquées à toute la structure ; positions internes à un Cycle non définies | RM-219, RM-220, RM-251, D-441, D-442, ARB-06 | `StopPoint.ts`, `placement.ts`, garde `structure.ts:384` | **PARTIEL** — B.6 ; **À CLARIFIER** — ARB-02a/b (Cycle seulement) |
| Durées et synthèses | Séance et Circuit | + Cycle (règles de la Séance, ARB-11), en-têtes | Durée de Cycle | ch10 l.937, D-391, D-443, ARB-11 | `computeStructureDuration` existe | **PARTIEL** — B.7 |
| Cibles à 0, tiret, bornes du 28/10 | À vérifier dans le code | COMP §3, RM-234 ; volume total de l'Exercice non nul (ARB-10) | Probable (minimum 0) | ch07 l.1141-1142, ARB-10 | Validation des paramètres | **À ADAPTER** — B.3 ; ARB-10b (récupération après occurrence sautée) réservé |
| Brouillon, Continuer, consultation archivée | Qualifié (ancien modèle) | Conservé sur la structure | Portage | D-388, D-380, PRE-8 r2-02 | A.1 | **QUALIFIÉ** (comportement) / **À ADAPTER** (modèle) |

### Chantier C — Formats

| Élément | État actuel | Cible PRE-9 | Écart | Source de vérité | Impact technique | Traitement proposé |
|---|---|---|---|---|---|---|
| Persistance du Format | Aucune colonne | Format et réglages portés par le Circuit ou l'Exercice (ARB-03) ; origine de création sur la Séance ; organisation = nature du Circuit ; version de règle dans l'instantané | Tout | ARB-03 ; ch09 l.593-598 (à annoter), FMT-42 | **Migration** 017 sur `tours`, `activities`, `sessions.origin` | **DOC NON DÉV.** — C.1 [28/10 : migration sur `sessions` seulement, remplacé] |
| Sélection du modèle | Vignettes pour le filtre seulement | Écran de choix avec cartes Exercice et Séance (ARB-05) | Tout | CE-FMT-01 (`8598:29271`), ARB-05 | — | **DOC NON DÉV.** — C.2 ; présentation confrontée à Figma (ARB-19) [28/10 : À CLARIFIER] |
| Paramètres imposés et récapitulatif | Absent | CE-FMT-02 par modèle, par élément porteur | Tout | FMT-10…38, ARB-18, Figma `8624:*`, `8656:*` | Registre de Formats | **DOC NON DÉV.** — C.3 ; ARB-04 (défauts) |
| Composition préremplie, verrouillage | Absent | CE-FMT-03/04, modale grisée | Tout | DSF §3, FMT-17, Figma `8747:14451` | Feuille de paramètres : état verrouillé | **DOC NON DÉV.** — C.4 |
| Contraintes réappliquées après édition | Absent | CE-FMT-03 §14, par élément formaté | Validation par élément ; dépose d'éléments formatés dans un Circuit | I-8, ARB-03 | Validation | **DOC NON DÉV.** — C.4 ; ARB-24 (deux déposes) [28/10 : À CLARIFIER — ARB-03] |
| Départs rapides | Absent | Préremplissages d'éléments libres, un seul mécanisme (cas A, B, C) | Contenu des cinq départs | FMT-28, ch10 l.1524, ARB-22b | Aucun moteur | **DOC NON DÉV.** — C.5 ; contenu **EN ATTENTE DE DÉFINITION FONCTIONNELLE** (ARB-22c) |
| Modification, duplication, réouverture | Absent | Format conservé par élément | — | FMT-03/40, ch09 l.617, ARB-16, ARB-17 | — | **DOC NON DÉV.** — C.6 |
| Information « exécution non disponible » | Lecture indisponible partout (PRE-8) | Inchangée (ARB-21) | Aucun | ARB-21 | — | **QUALIFIÉ** — conservé, sans développement [28/10 : À CLARIFIER] |
| Plusieurs Formats dans une Séance | Absent | Éléments formatés successifs, directement ou dans un Cycle (ARB-03) | Entrée d'un nouvel élément formaté depuis la Composition non définie (seule voie existante : reprise d'une Séance formatée, B.8) ; répétition de l'ensemble Tabata (ARB-25) | ARB-03, ARB-16 ; COMP l.64 | Aucune structure nouvelle | **DOC NON DÉV.** — C.1, C.4, B.8 ; **À CLARIFIER** — ARB-23, ARB-25 |
| Choix des Exercices dans le flux d'un Format ; contenu des départs rapides | Absent | Parcours Catalogue existant (ARB-22a) ; contenu des départs selon leur définition | Contenu des départs | ch03 l.646 ; ARB-22a/b/c ; Figma `8624:29980`, `8624:30040` | Sélection de Mouvements réutilisée | **DOC NON DÉV.** — C.3 ; **EN ATTENTE** — C.5 (ARB-22c) |

### Chantier D — Contrat avec le futur moteur

| Élément | État actuel | Cible PRE-9 | Écart | Source de vérité | Impact technique | Traitement proposé |
|---|---|---|---|---|---|---|
| Développement du plan (ordre) | `expandComposition`, Circuit unique, tests seulement | Toute la structure, ordre C2, plans finis seulement ; segments pour AMRAP et Death by | Cycles, multi-Circuits, Exercices de Cycle, éléments formatés | RM-252, ch10 l.1014-1015, l.1130, l.992, ch12 l.1829 | Fonction pure | **PARTIEL** — D.1 |
| Instantané de Séance | Instantané d'Exercice v3 inutilisé | Instantané de Séance versionné (structure ; Format, réglages effectifs et version de règle par élément formaté) | Niveau Séance | SU-07, ch09 l.593-598, ch11 l.13, ARB-03 | Type (sérialisation : PRE-10) | **PARTIEL** — D.2 |
| Descripteurs de capacités par Format | Absent | Matrice Format × capacité (expansion, horloges, déclencheurs, fin, résultats) | Tout | ch11 l.315, ch12 l.1824-1834, FMT | Données déclaratives | **DOC NON DÉV.** — D.3 |
| Validité de configuration | `validateStructureShape` | Validité par élément et pour la Séance, distincte de la disponibilité du moteur | Règles ch10 et par Format | cadrage §2.C (l.47) ; CE-FMT-02/04 §14 | Pur | **PARTIEL** — D.4 |
| Résultats, références temporelles, expiration, interruptions et reprise, signaux (interface, audio, haptique) | Absent | **Capacités définies par Format** (table sourcée), non implémentées | Définition à produire ; cas non définis listés | A2, A4, A6, A7, R-01, RM-066…070 | Aucun code | **DOC NON DÉV.** — D.3, D.5 (implémentation : PRE-10/11) |

## 3. Analyse des dépendances

```text
Q.0 vérification globale fractionnée (activité distincte, hors chemin critique)
A.1 structure D-451 complète (migration 016) ──┬─> B.1 rendu D-451 ──> B.2 menu et enveloppe ──> B.4 glisser-déposer (ARB-24 : deux déposes) ──> B.6 points d'arrêt (ARB-02a/b : Cycle seulement)
                                               │                     │                      └─> B.5 suppression, duplication d'Exercice
                                               │                     │                      └─> B.8 reprise (+ C.1), B.9 nom
                                               │                     └─> B.3 séries par Circuit
                                               │                     └─> B.7 durées (+ D.1)
                                               ├─> A.2 Exercice depuis Mouvement (+ B.2) ··> A.4 conversion (si ARB-01 = A) ──> A.3 retrait des parcours (après ARB-01) ··> A.5 retrait de la table (conditionnel)
                                               └─> C.1 Format porté par l'élément (migration 017) ──┬─> D.1 plans finis ──> D.2 instantané ;  D.1 + D.3 ──> D.4 validité
                                                        │                                         └─> D.3 descripteurs ──> D.5 instruction des capacités
                                                        └─> C.2 sélection (+ A.2) ──> C.3 paramètres (ARB-04 : défauts) ──> C.4 préremplie et verrous (+ B.3, B.4) ──> C.6 édition/duplication
                                                                     └─> C.5 départs rapides (ARB-22c : contenu)
```

Dépendances externes : ARB-01 (A.4, A.3, A.5), ARB-02a/b, ARB-04, ARB-22c, ARB-23, ARB-24, ARB-25, ARB-10b — chacune ne bloque que l'opération citée (`arbitrages-pre9.md` §2 bis). [28/10 : « décisions ARB-01 à ARB-05 ; maquettes non dessinées (ARB-19) ; instruction A2, A4, A6 avant PRE-10 » — remplacé le 29/10.]

**Ajustement du découpage indicatif** : le chantier A est scindé. Sa partie « fondation » (A.1, qui complète aussi la structure D-451 par les Exercices directs de Cycle) précède tout le reste, car Composition, Formats et contrat lisent et écrivent la même structure ; sa partie « fin des anciens Exercices » (A.2–A.5) suit le menu Créer de la Composition, qui fournit le parcours de remplacement. Sans ce réordonnancement, B et C seraient développés sur un brouillon voué à disparaître.
