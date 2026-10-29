# PRE-9 — Proposition d'architecture technique

> **Proposition à valider**, non décision. Privilégie la réutilisation de l'existant (`recherche/01-etat-du-code.md`) et la solution la plus simple compatible avec les capacités requises. Le schéma fonctionnel du cadrage (§6) est une hypothèse de travail, pas une prescription de modules.
>
> **Révision 1 du 29/10/2026** (décisions de Hermann, `arbitrages-pre9.md` §0) : le Format n'est plus porté par la Séance mais par un **Circuit ou un Exercice** (ARB-03) ; migrations renumérotées et une lacune de structure corrigée (Exercices directs de Cycle, §2) ; D.1 limité aux plans finis ; validité de configuration distinguée de la disponibilité du moteur ; aucune nouvelle couche. Les passages remplacés sont annotés entre crochets.
>
> **Révision 2 du 29/10/2026** (`arbitrages-pre9.md` §0 bis) : répétition intégrale d'un élément formaté par le **Cycle** seulement (ARB-25, aucun compteur ajouté) ; compatibilité des déposes et passage du Format au Circuit (ARB-24) ; entrée « Format » du menu Créer (ARB-23) ; Points dans les Cycles (ARB-02a/b) ; récupération d'une occurrence sautée (ARB-10b) ; conversion E.8-b validée (ARB-01).

## 1. Principes

1. **Une seule représentation** : `SessionStructure` (`src/domain/sessions/structure.ts`) devient le modèle unique du brouillon, du service, du dépôt et de l'écran. L'ancien modèle « avant / Circuit / après » ne subsiste que comme lecture de compatibilité, puis disparaît.
2. **Domaine pur d'abord** : chaque règle (insertion, enveloppe, déplacement, conversion de nature, points d'arrêt, développement, validation de Format) est une fonction pure testée avant l'interface, comme `composition.ts` et `placement.ts` aujourd'hui.
3. **Données déclaratives pour les Formats** : un registre décrit chaque Format (paramètres, états de verrouillage, porteur admis, capacités d'exécution). Aucune règle de Format codée dans l'interface. Le Format est un **attribut facultatif** des éléments existants (Circuit, Exercice) : pas de nouveau type de conteneur « Bloc de Format » (ARB-03).
4. **Pas de moteur** : PRE-9 produit les entrées du moteur (plan développé, instantané, descripteurs) sans état d'exécution.

## 2. Domaine Séance

| Module | Évolution | Réutilisation |
|---|---|---|
| `structure.ts` | **Exercices directs de Cycle** : `StructureCycle` ne contient aujourd'hui que des Circuits (`structure.ts:52-56`, refus d'un Cycle sans Circuit `:355`) alors que D-451 admet « Cycle : Exercices directs et Circuits » — le Cycle reçoit une liste ordonnée d'éléments (Exercice ou Circuit) ; emplacement de Point d'arrêt étendu au Cycle (`cycleId`) ; borne haute du Cycle 1..99 ; Format facultatif sur Circuit et Exercice (`format?: { key, settings }`) ; opérations pures sur l'arbre : insérer (ARB-07), poser un conteneur sur un premier contenu (ARB-06), déplacer un Exercice, un Circuit, un Cycle (ARB-09) ou un Point vers toute position autorisée, supprimer (conteneur vidé retiré), dupliquer un Exercice (ARB-08 : pas de conteneur), changer nature/compte ; identifiants stables | `validateStructureShape`, `computeStructureDuration`, `countStructureExercises` |
| `SessionDraft.ts` | Remplacé par un brouillon structuré : `structure`, `stopPoints` (positions dans l'arbre), réserve de séries **par Circuit** (`circuitSeriesReserve` devient une table indexée par Circuit), Mouvements du brouillon, Format et réglages de chaque élément formaté (C.1), origine de création de la Séance | Champs de réglages de Séance, Mouvements du brouillon |
| `circuit.ts` | Opérations de nature (`applyNatureChange`, `setCircuitCount`, `circuitVolumes`) appliquées à **un Circuit identifié** de l'arbre | Règles groupées/alternées, conversion avec perte, réserve |
| `StopPoint.ts`, `placement.ts` | Positions généralisées (niveau Séance, intérieur de Circuit, intérieur de Cycle — ARB-06) ; RM-219/251 et D-441/D-442 évalués sur la séquence fonctionnelle de toute la structure (`arbitrages-pre9.md` ARB-02) ; Point interne à un Cycle rencontré à chaque répétition, exceptions de début et de fin et demande de choix comme pour le Circuit, par le même code (ARB-02a/b) ; garde `STRUCTURE_STOP_POINTS_UNSUPPORTED` retirée | `isStopPointAllowed`, dédoublonnage, mode Placement |
| `composition.ts` | Zones structurelles (`STRUCTURAL_ZONES`) remplacées par des chemins dans l'arbre | `moveOccurrence`, `duplicateOccurrence`, numéro de copie |
| `structureFromLegacy` / `legacyFromStructure` | Conservés pour la lecture des anciennes données et les tests ; `legacyFromStructure` retiré des chemins de production | — |

## 3. Services et persistance

- **`SessionService`** : `createSession` / `updateSession` / `getSessionForEdit` / `getSessionForConsultation` / `duplicateSession` passent sur `createStructured` / `updateStructured` / `findStructuredById`. Aucune Séance n'est plus projetée vers l'ancien modèle ; `SessionStructureNotRepresentableError` cesse d'être atteignable.
- **Catalogue (PRE-8)** : `listCatalogue` lit déjà la structure générale ; inchangé.
- **Validation** : `validateStructuredSessionInput` (existant) cesse de passer par l'équivalent ancien modèle (`equivalentLegacyInput`) et valide directement l'arbre.

### Migrations proposées (aucune n'est créée dans cette mission ; numéros indicatifs, attribués à la livraison selon les arbitrages retenus)

| Migration | Contenu | Story | Condition |
|---|---|---|---|
| 016 | **Structure D-451 complète** : `activities.cycle_id` nullable (Exercice direct de Cycle ; FK composite vers `cycles`, comme `tours.cycle_id`) et `session_stop_points.cycle_id` nullable (Point à l'intérieur d'un Cycle) ; index uniques partiels de position par Cycle ; contrainte « au plus un parent » | A.1 | Validation du plan (ARB-06 rend la colonne de Point nécessaire quelle que soit la réponse à ARB-02a/b) |
| 017 | **Format porté par l'élément** : `tours.format_key`, `tours.format_settings`, `activities.format_key`, `activities.format_settings` (NULL = élément libre ; réglages en JSON validé par le domaine, sur le modèle d'`execution_parameters`, avec leur version de schéma) ; `sessions.origin` nullable (provenance de création : carte Exercice, carte Séance, Format, départ rapide — FMT-02, ch09 l.593-598). La version de règle n'est figée que dans l'instantané (ch09 l.593-598) | C.1 | Validation du plan |
| 018 | Conversion E.8-b : chaque `activity_definitions` → Séance d'un Exercice (titre Q-E1), Mouvement et paramètres conservés, rapport `migration_notices`, annulation complète en cas d'échec ; médias et associations conservés ; transactionnelle ; **aucune ligne historique retirée** | A.4 | ARB-01 validé (révision 2) |
| 019 | Suppression de `activity_definitions` et `activity_definition_body_zones` — **conditionnelle** : justification de non-utilisation (test de garde), preuve de conservation (comparaison sur copie de base réelle), autorisation explicite de Hermann | A.5 | Hors engagement PRE-9 par défaut |

[Version initiale remplacée le 29/10 : 016 = Format sur `sessions` (`format_key`, `format_origin`, `format_settings`, `format_rule_version`) ; 017 = `session_stop_points.cycle_id` sous condition d'ARB-02 option B ; 018 = conversion avec retrait de la ligne dans la même transaction ; 019 = suppression « après 018 et une version stable ». Motifs : ARB-03 (Format porté par l'élément), ARB-06 (Point dans un conteneur), ARB-01 (conversion distinguée de la suppression), lacune des Exercices directs de Cycle constatée le 29/10.]

**Pourquoi des colonnes sur `tours` et `activities`** plutôt qu'une table dédiée : le Format suit l'élément sans code supplémentaire lors des déplacements, de la reprise dans une autre Séance (ARB-16) et de la duplication (ARB-17), puisque ces opérations copient déjà les lignes de ces tables ; un élément ne porte qu'un Format ; aucun nouveau type d'objet. L'organisation Par exercice / En alternance d'un Circuit formaté est sa **nature** existante (groupées / alternées, `tours.nature`) : aucune colonne d'organisation.

Chaque migration : test sur base en mémoire et **sur copie d'une base réelle** (pattern `preservation.story1*`), compatibilité ascendante, aucune réinitialisation (D-440 ne se rejoue pas).

## 4. Interface de Composition

- **Découpage de `CompositionScreen.tsx` (6 060 lignes)** : extraction de composants par niveau (`SessionLevelList`, `CycleBlock`, `CircuitBlock`, `ExerciseRow`, en-têtes), l'écran gardant l'orchestration (brouillon, navigation, barre d'action). Objectif : changer de modèle sans régression, par étapes couvertes par les tests d'intégration existants.
- **Gestes** : `compositionGesture.ts` (`resolveDropTarget`, `resolveDragShifts`) généralisé des trois zones vers des positions d'arbre ; `useDragAutoScroll` réutilisé tel quel ; la carte portée suivie hors rendu (leçon PRE-8 f3-01).
- **Réutilisation** : `SheetMotion` (repli/dépli), `DisclosureControl`, `CircuitHeader`, `OccurrenceCard`, rail, sélecteurs à roue, `ExecutionParametersSheet`, `DecisionDialog`, `TransientNotification`, `SessionCompositionTree` (rendu de référence déjà testé).
- **Menu Créer** : feuille d'actions native (primitive iOS) à six actions + Annuler — la sixième, « Format », ouvre le flux de Format existant (C.2–C.3) et insère l'élément (ARB-23) [révision 1 : « cinq actions »] ; mode « enveloppe » comme état de l'écran pour désigner le premier contenu sur lequel le conteneur est posé (ARB-06), rendu Figma réutilisé ; aucune sélection multiple. [28/10 : « trait plein/pointillé, barre « Confirmer le circuit / le cycle » » pour une sélection de membres — remplacé.]

## 5. Formats

- **Registre** `src/domain/sessions/formats/` : pour chaque Format, descripteur pur `{ key, parameters: [{ id, lock: LOCKED|ADJUSTABLE|CALCULATED|FREE|NOT_APPLICABLE, bounds, default? }], carrier, organisations, validate(element, settings), capabilities }` ; un seul mécanisme de préremplissage piloté par des données (ARB-22b, ci-dessous). `sessionFormats.ts` (PRE-8, vignettes) en devient la projection d'affichage. [Version initiale : `admissibleStructure`, `prefill()` par Format, `validate(structure, settings)` à l'échelle de la Séance — remplacé le 29/10 par la validation par élément et un préremplissage unique.]
- **Porteur** (application proposée d'ARB-03, à confirmer en revue ; changement de porteur : ARB-27) :

| Format | Un seul Exercice | Plusieurs Exercices | Source |
|---|---|---|---|
| Tabata | Exercice (FMT-11 : « avec un exercice unique la question est inutile ») | Circuit ; Par exercice = groupées, compte 1 ; En alternance = alternées, compte 8 (FMT-12/13) ; répétition intégrale par un Cycle (ARB-25) | FMT-10…18, ARB-25 |
| Intervalles 30/30 | Exercice | Circuit ; nombre commun de séries (ARB-18a) | FMT-19, ARB-18a |
| EMOM | Exercice | Circuit ; N commun, `N × E × W` par élément (FMT-21) | FMT-20…25 |
| AMRAP | Exercice | Circuit répété jusqu'à la borne de l'élément (FMT-26) | FMT-26 |
| For time | Exercice (échelle sur ses séries) | Circuit ; « Volume par tour » = tours du Circuit (FMT-30/31), zéro admis dans l'échelle (ARB-18b) | FMT-30…32 |
| Death by | Exercice | **Réservé** (R-03, ch05 l.484) | FMT-33…38 |
| Départs rapides, Libre | Pas de Format porté : préremplissage d'éléments libres (FMT-28) | idem | FMT-28 |

  Circuit formaté réduit à un Exercice par suppression : reste un Circuit (pas de conversion d'identité, FMT-03/40). Format porté par un Exercice qui reçoit un second Exercice : ARB-27. [Révision 1 : « Cas limites à confirmer […] impossible si ARB-24 (a) est retenu » — remplacé.]
- **Répétition (ARB-25)** : trois responsabilités, aucun compteur nouveau. Le **Circuit** organise les séries (nombre et ordre, groupées ou alternées) ; dans un Circuit formaté, son compte est gouverné par le Format et n'est jamais une répétition de l'ensemble (Tabata : 1 en groupées, 8 en alternées ; autres Formats : représentation confirmée dans C.3, `arbitrages-pre9.md` §0 bis, point 2). Le changement d'organisation d'un Circuit formaté conserve le volume (ch11 l.313) et n'emprunte pas la conversion générique de COMP §2. Le **Cycle** répète intégralement sa séquence (RM-252), éléments formatés compris ; il n'est jamais créé silencieusement. Les **règles du Format** gouvernent ses répétitions internes (fenêtres, échelle, progression, fin). [Révision 1, ARB-25 option A : multiplicateur dans `format_settings` — retiré.]
- **Compatibilité (ARB-24)** : chaque descripteur déclare `accepts(exercise, destination)` — fonction pure évaluée avant toute mutation (dépose, insertion par l'entrée « Format », Circuit posé sur un Exercice formaté) ; résultat : accepté, accepté après confirmation (valeurs renseignées remplacées par des valeurs imposées) ou refusé (aucune altération). Le point d'appel est générique (B.4) ; les règles des éléments formatés sont livrées par C.4 (`arbitrages-pre9.md` §0 bis, point 4 ; ARB-26 à ARB-28).
- **Validation par élément** : chaque élément formaté est validé selon son Format (constantes, bornes, compte commun, volume non nul — ARB-10, ARB-18) ; la Séance est valide si chacun de ses éléments l'est et si elle compte au moins un Exercice valide (FR-B12). Contraintes réappliquées après chaque édition de l'élément (CE-FMT-03 §14). Aucune règle d'enchaînement entre Formats (ARB-03).
- **Nom affiché** : un élément formaté affiche le nom de son Format, dérivé de `format_key` (les Circuits n'ont pas de colonne de nom aujourd'hui ; aucun stockage supplémentaire). La place du nom du Mouvement dans la carte d'un Exercice formaté est un détail graphique de C.4 (ARB-19).
- **Préremplissage (ARB-22b)** : une entrée de grille (Format, départ rapide, carte Exercice, carte Séance) est décrite par une donnée `{ elements?: [{ carrier, format?, movements?: 'choisir' | [ids], parameters? }], sessionTitle? }` ; une seule fonction l'applique au brouillon. Cas A = `parameters` seuls (Mouvements choisis par le parcours Catalogue, ARB-22a) ; cas B = `movements` + `parameters` ; cas C = contenu propre à chaque entrée. Le contenu des cinq départs rapides est **EN ATTENTE DE DÉFINITION FONCTIONNELLE** (ARB-22c) : la donnée de chaque départ est ajoutée à sa réception, sans changement de code.
- **Verrouillage** : `ExecutionParametersSheet` reçoit un masque de verrouillage par champ (état grisé et raison, Figma `8747:14451`), refus métier d'une constante modifiée (CE-FMT-04 §14).
- **Écrans** : sélection (CE-FMT-01, entrée `8598:29271`, cartes Exercice et Séance conservées — ARB-05), paramètres et récapitulatif (CE-FMT-02), Composition préremplie (CE-FMT-03) ; route dans le groupe `(creation)` existant ; sélection des Mouvements par le parcours Catalogue existant (ARB-22a).

## 6. Contrat de passage Composition → Exécution (indépendant de l'implémentation)

| Élément | Contenu | Règle source | Livré en |
|---|---|---|---|
| Instantané de Séance | Type et constructeur purs (sérialisation versionnée reportée à PRE-10, premier consommateur) ; version de schéma ; identité et origine de Séance ; structure complète (identifiants stables) ; **par élément formaté** : Format, réglages effectifs, version de règle ; contenu des Mouvements résolu (nom, phases, médias) ; paramètres d'exécution par Exercice ; réglages de début et de fin | SU-07, ch09 l.593-598, ch11 l.13, `exerciseSnapshot.ts` (v3), ARB-03 | D.2 |
| Plan développé | **Plans finis seulement.** Suite ordonnée d'occurrences exécutables `{ id stable dérivé (chemin + indices de répétition, de tour, de série, de côté), Exercice, série, côté, cible, phases, récupération, point d'arrêt, contexte (Cycle i/n, Circuit t/N), élément formaté de rattachement }` ; séries nulles sautées, sans la récupération directement associée (ARB-10b), pauses indépendantes conservées ; points consécutifs dédoublonnés ; compte à rebours et fin aux seules frontières ; un Cycle × k reproduit k fois le développement de ses éléments, formatés ou libres, sans autre facteur (ARB-25). Un élément AMRAP ou Death by apparaît comme **un segment progressif** `{ élément, Format, réglages }`, une fois par répétition de son Cycle, sans aucune occurrence générée. Les éléments formatés finis (Tabata, 30/30, EMOM, For time) sont développés par leur structure ordinaire (séries, compte, nature) ; leur sémantique temporelle (fenêtre, chronomètre) relève du descripteur | RM-252, ch10 l.1014-1015, l.1130, l.1136, RM-234, RM-251, RM-083, ch12 l.1829 | D.1 |
| Descripteur de capacités | Table documentaire sourcée + type minimal (pas de logique), **par Format, appliqué à l'élément porteur** : porteur ; expansion `FINITE` ou `PROGRESSIVE` ; références temporelles et échéances nécessaires (A2) ; déclencheurs (échéance, appui, Suivant, borne, arrêt déclaré) ; comportement à l'expiration lorsqu'il est défini, « NON DÉFINI » sinon (A4) ; fin ; progression fixe/dynamique ; résultats pertinents — motif de fin, résultat réalisé, niveau d'achèvement (A6) ; interruptions et reprise (RM-066…070 ; R-01 « NON DÉFINI ») ; familles d'événements de signal (interface, audio, haptique) ; `executionAvailable` (faux pour tout Format en PRE-9) | ch11 l.315, ch12 l.1824-1834, FMT, ch10 l.1594-1600 | D.3, D.5 |
| Validité et disponibilité | Deux notions distinctes : **validité de configuration** `valid` / `invalid` + motifs lisibles (cible manquante, volume nul, constante modifiée, structure invalide), par élément et pour la Séance, sans réparation silencieuse ; **disponibilité du moteur**, lue dans le descripteur (`executionAvailable`), indépendante de la validité. Aucun affichage nouveau : « Lecture indisponible » inchangé (ARB-21). [Version initiale : état unique `ready` / `incomplete` / `notExecutableYet` — remplacé le 29/10.] | cadrage §2.C (l.47) ; CE-FMT-02 §14, CE-FMT-04 §14 ; ARB-21 | D.4 |

Le **plan progressif** (AMRAP, Death by) n'est représenté que par son segment, son descripteur et ses réglages ; aucune occurrence n'est générée en PRE-9 et aucune liste infinie n'est créée (CE-FMT-05 §15).

## 7. Matrice Format × capacité (synthèse, détails et sources : `recherche/03-formats.md` §1)

| Format | Porteur | Expansion | Références temporelles (A2) | Déclencheurs | Fin | Progression | Ouvert |
|---|---|---|---|---|---|---|---|
| Libre et départs rapides | — (éléments libres) | Finie | Étape (Durée), phases | Fin de cible, Suivant, échéance d'étape | Plan parcouru | Fixe | Défauts (ARB-04) ; contenu des départs (ARB-22c) |
| Tabata | Exercice ou Circuit | Finie | Étape 20 s, pause 10 s | Échéance | Élément parcouru | Fixe | — (répétition par Cycle, ARB-25) |
| Intervalles 30/30 | Exercice ou Circuit | Finie | Étape 30 s, pause 30 s | Échéance | Élément parcouru | Fixe | Défauts (ARB-04) |
| EMOM | Exercice ou Circuit | Finie (N × E fenêtres) | Fenêtre de l'élément, indépendante de l'étape | Échéance de fenêtre ; appui = fin du travail | Dernière fenêtre | Fixe | Issue d'une fenêtre non terminée (A6, PRE-11) |
| AMRAP | Exercice ou Circuit | Progressive jusqu'à la borne de l'élément | Échéance de l'élément | Borne de l'élément | Borne | Répétition | Tour partiel, étape à l'échéance (A4/A6, PRE-11) |
| For time | Exercice ou Circuit | Finie | Chronomètre de l'élément | Fin du travail | Travail accompli | Fixe (échelle) | — (pas de limite de temps dans les sources) |
| Death by | Exercice (plusieurs : R-03) | Progressive | Fenêtre, rang par horloge | Échéance, appui, arrêt déclaré | Arrêt déclaré | Dynamique (q0 + (rang−1)·d) | Suite après fenêtre non acquise (A4) ; plusieurs exercices (R-03) |

Commun à AMRAP et Death by sous ARB-03 : suite de la Séance après la fin de l'élément lorsqu'il est suivi d'autres éléments — non défini, à présenter avant PRE-11 (`arbitrages-pre9.md` §3, A4). [Version initiale : « Questions à instruire avant PRE-10 : A2 (coexistence d'horloges), A4, A6 » — remplacé le 29/10 : besoins décrits par Format dans le contrat, conception en PRE-10, compléments en PRE-11, sans blocage de PRE-9.]

## 8. Orientation PRE-10 (non engagée)

Le moteur PRE-10 consommerait l'instantané et le plan développé (D.1, D.2) et les descripteurs (D.3) ; il implémenterait seulement l'expansion finie, l'horloge d'étape et les déclencheurs de Libre, en gardant des points d'extension pour la fenêtre, l'échéance d'élément et la génération progressive des segments. Les tables d'exécution et de résultats (A6), rattachées à l'élément formaté le cas échéant, sont conçues en PRE-10. Aucun de ces éléments n'est développé en PRE-9.

## 9. Risques techniques

| Risque | Maîtrise |
|---|---|
| Régression de la Composition (6 060 lignes, 19 tests d'intégration) | Découpage progressif ; tests d'intégration existants gardés verts à chaque story ; nouveaux tests par niveau |
| Perte de données à la migration du brouillon et à E.8-b | Tests sur copie de base réelle ; transaction unique ; rapport de migration ; aucune réinitialisation |
| Performance du glisser-déposer imbriqué | Carte portée hors rendu ; mesures sur iPhone dès B.4 |
| Formats × D-451 | ARB-03, ARB-24, ARB-25 décidés ; compatibilité centralisée dans le registre ; tests de non-double multiplication (Cycle × Circuit × séries) |
| Exercices directs de Cycle absents du domaine et du schéma | Traité dans A.1 (migration 016), avant tout écran |
| Rendus non dessinés (stepper, éclairage, Cycle déployé) | ARB-19 : réutilisation des composants existants ; manque précis signalé par story |
| Mémoire lors de la suite complète | Exécution fractionnée (Q.0, activité distincte) |
| Documents normatifs contradictoires | Lot documentaire de classe B à chaque story (règle permanente) |
