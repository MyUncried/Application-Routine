# PRE-9 — Proposition d'architecture technique

> **Proposition à valider**, non décision. Privilégie la réutilisation de l'existant (`recherche/01-etat-du-code.md`) et la solution la plus simple compatible avec les capacités requises. Le schéma fonctionnel du cadrage (§6) est une hypothèse de travail, pas une prescription de modules.

## 1. Principes

1. **Une seule représentation** : `SessionStructure` (`src/domain/sessions/structure.ts`) devient le modèle unique du brouillon, du service, du dépôt et de l'écran. L'ancien modèle « avant / Circuit / après » ne subsiste que comme lecture de compatibilité, puis disparaît.
2. **Domaine pur d'abord** : chaque règle (insertion, enveloppe, déplacement, conversion de nature, points d'arrêt, développement, validation de Format) est une fonction pure testée avant l'interface, comme `composition.ts` et `placement.ts` aujourd'hui.
3. **Données déclaratives pour les Formats** : un registre décrit chaque Format (paramètres, états de verrouillage, structure admise, capacités d'exécution). Aucune règle de Format codée dans l'interface.
4. **Pas de moteur** : PRE-9 produit les entrées du moteur (plan développé, instantané, descripteurs) sans état d'exécution.

## 2. Domaine Séance

| Module | Évolution | Réutilisation |
|---|---|---|
| `structure.ts` | Borne haute du Cycle 1..99 ; opérations pures sur l'arbre : insérer, envelopper (circuit/cycle), déplacer (positions autorisées G1–G8), supprimer (conteneur vidé retiré), dupliquer, changer nature/compte ; identifiants stables | `validateStructureShape`, `computeStructureDuration`, `countStructureExercises` |
| `SessionDraft.ts` | Remplacé par un brouillon structuré : `structure`, `stopPoints` (positions dans l'arbre), réserve de séries **par Circuit** (`circuitSeriesReserve` devient une table indexée par Circuit), Mouvements du brouillon, Format (C.1) | Champs de réglages de Séance, Mouvements du brouillon |
| `circuit.ts` | Opérations de nature (`applyNatureChange`, `setCircuitCount`, `circuitVolumes`) appliquées à **un Circuit identifié** de l'arbre | Règles groupées/alternées, conversion avec perte, réserve |
| `StopPoint.ts`, `placement.ts` | Positions généralisées (niveau Séance, intérieur de Circuit, et selon ARB-02 intérieur de Cycle) ; RM-219/251 et D-442 évalués par conteneur ; garde `STRUCTURE_STOP_POINTS_UNSUPPORTED` retirée | `isStopPointAllowed`, dédoublonnage, mode Placement |
| `composition.ts` | Zones structurelles (`STRUCTURAL_ZONES`) remplacées par des chemins dans l'arbre | `moveOccurrence`, `duplicateOccurrence`, numéro de copie |
| `structureFromLegacy` / `legacyFromStructure` | Conservés pour la lecture des anciennes données et les tests ; `legacyFromStructure` retiré des chemins de production | — |

## 3. Services et persistance

- **`SessionService`** : `createSession` / `updateSession` / `getSessionForEdit` / `getSessionForConsultation` / `duplicateSession` passent sur `createStructured` / `updateStructured` / `findStructuredById`. Aucune Séance n'est plus projetée vers l'ancien modèle ; `SessionStructureNotRepresentableError` cesse d'être atteignable.
- **Catalogue (PRE-8)** : `listCatalogue` lit déjà la structure générale ; inchangé.
- **Validation** : `validateStructuredSessionInput` (existant) cesse de passer par l'équivalent ancien modèle (`equivalentLegacyInput`) et valide directement l'arbre.

### Migrations proposées (aucune n'est créée dans cette mission ; numéros indicatifs, attribués à la livraison selon les arbitrages retenus)

| Migration | Contenu | Story | Condition |
|---|---|---|---|
| 016 | `sessions.format_key` (NULL = Libre sans origine), `format_origin`, `format_settings` (JSON validé par le domaine) ; `format_rule_version` sur la Séance = **choix technique proposé** (ch09 l.593-598 ne place la version de règle que dans l'instantané) | C.1 | Validation du plan |
| 017 | Points d'arrêt dans un Cycle : `session_stop_points.cycle_id` nullable (+ index uniques partiels) | B.6 | ARB-02 option B |
| 018 | Conversion E.8-b : chaque `activity_definitions` → Séance d'un Exercice (titre Q-E1), retrait de la ligne dans la même transaction, rapport `migration_notices`, annulation complète en cas d'échec | A.4 | ARB-01 option A |
| 019 | Suppression de `activity_definitions` et `activity_definition_body_zones` | A.5 | Après 018 et une version stable |

Chaque migration : test sur base en mémoire et **sur copie d'une base réelle** (pattern `preservation.story1*`), compatibilité ascendante, aucune réinitialisation (D-440 ne se rejoue pas).

## 4. Interface de Composition

- **Découpage de `CompositionScreen.tsx` (6 060 lignes)** : extraction de composants par niveau (`SessionLevelList`, `CycleBlock`, `CircuitBlock`, `ExerciseRow`, en-têtes), l'écran gardant l'orchestration (brouillon, navigation, barre d'action). Objectif : changer de modèle sans régression, par étapes couvertes par les tests d'intégration existants.
- **Gestes** : `compositionGesture.ts` (`resolveDropTarget`, `resolveDragShifts`) généralisé des trois zones vers des positions d'arbre ; `useDragAutoScroll` réutilisé tel quel ; la carte portée suivie hors rendu (leçon PRE-8 f3-01).
- **Réutilisation** : `SheetMotion` (repli/dépli), `DisclosureControl`, `CircuitHeader`, `OccurrenceCard`, rail, sélecteurs à roue, `ExecutionParametersSheet`, `DecisionDialog`, `TransientNotification`, `SessionCompositionTree` (rendu de référence déjà testé).
- **Menu Créer** : feuille d'actions native (primitive iOS) à cinq actions + Annuler ; mode « enveloppe » comme état de l'écran (trait plein/pointillé, barre « Confirmer le circuit / le cycle »).

## 5. Formats

- **Registre** `src/domain/sessions/formats/` : pour chaque Format, descripteur pur `{ key, origin, parameters: [{ id, lock: LOCKED|ADJUSTABLE|CALCULATED|FREE|NOT_APPLICABLE, bounds, default? }], admissibleStructure, organisation, prefill(), validate(structure, settings), capabilities }`. `sessionFormats.ts` (PRE-8, vignettes) en devient la projection d'affichage.
- **Structure admise** : selon ARB-03 (recommandation : structure canonique par Format spécialisé ; départs rapides et Libre = toute structure D-451).
- **Verrouillage** : `ExecutionParametersSheet` reçoit un masque de verrouillage par champ (état grisé et raison, Figma `8747:14451`), refus métier d'une constante modifiée (CE-FMT-04 §14).
- **Écrans** : sélection (CE-FMT-01), paramètres et récapitulatif (CE-FMT-02), Composition préremplie (CE-FMT-03) ; route dans le groupe `(creation)` existant.

## 6. Contrat de passage Composition → Exécution (indépendant de l'implémentation)

| Élément | Contenu | Règle source | Livré en |
|---|---|---|---|
| Instantané de Séance | Type et constructeur purs (sérialisation versionnée reportée à PRE-10, premier consommateur) ; version de schéma ; identité de Séance ; Format, origine, réglages effectifs, version de règle ; structure complète (identifiants stables) ; contenu des Mouvements résolu (nom, phases, médias) ; paramètres d'exécution par Exercice ; réglages de début et de fin | SU-07, ch09 l.593-598, ch11 l.13, `exerciseSnapshot.ts` (v3) | D.2 |
| Plan développé | Suite ordonnée d'occurrences exécutables `{ id stable dérivé (chemin + indices de répétition, de tour, de série, de côté), Exercice, série, côté, cible, phases, récupération, point d'arrêt, contexte (Cycle i/n, Circuit t/N) }` ; séries nulles sautées ; points consécutifs dédoublonnés ; compte à rebours et fin aux seules frontières | RM-252, ch10 l.1014-1015, l.1130, l.1136, RM-234, RM-251, RM-083 | D.1 |
| Descripteur de capacités | Table documentaire sourcée + type minimal (pas de logique) : expansion `FINITE` ou `PROGRESSIVE` ; horloges (étape, fenêtre, globale) ; déclencheurs (échéance, appui, Suivant, borne, arrêt déclaré) ; fin ; progression fixe/dynamique ; résultats attendus et partiels ; interruptions et reprise (RM-066…070 ; R-01 « NON DÉFINI ») ; familles d'événements de signal (interface, audio, haptique) | ch11 l.315, ch12 l.1824-1834, FMT, ch10 l.1594-1600 | D.3, D.5 |
| Exécutabilité | `ready` / `incomplete` (cible manquante, structure invalide) / `notExecutableYet` (Format sans moteur) — l'interface n'annonce jamais un lancement possible tant que PRE-10/11 ne l'ont pas livré ; information utilisateur selon ARB-21 | cadrage §2.C (l.47) ; CE-FMT-02 §14, CE-FMT-04 §14 | D.4 |

Le **plan progressif** (AMRAP, Death by) n'est représenté que par son descripteur et sa règle de génération ; aucune liste infinie n'est créée (CE-FMT-05 §15).

## 7. Matrice Format × capacité (synthèse, détails et sources : `recherche/03-formats.md` §1)

| Format | Expansion | Horloges | Déclencheurs | Fin | Progression | Ouvert |
|---|---|---|---|---|---|---|
| Libre et départs rapides | Finie | Étape (Durée), phases | Fin de cible, Suivant, échéance d'étape | Plan parcouru | Fixe | Valeurs préremplies (ARB-04) |
| Tabata | Finie | Étape 20 s, pause 10 s | Échéance | Plan parcouru | Fixe | Répétition de l'ensemble sous D-451 (ARB-03) |
| Intervalles 30/30 | Finie | Étape 30 s, pause 30 s | Échéance | Plan parcouru | Fixe | Organisation et séries (ARB-18) |
| EMOM | Finie (N × E fenêtres) | Fenêtre indépendante de l'étape | Échéance de fenêtre ; appui = fin du travail | Dernière fenêtre | Fixe | Fenêtre non terminée (A4, PRE-11) |
| AMRAP | Progressive jusqu'à la borne | Échéance globale | Borne globale | Borne | Répétition | Tour partiel, étape à l'échéance (A4) |
| For time | Finie | Chronomètre global | Fin du travail | Travail accompli | Fixe (échelle) | Limite de temps (aucune règle) |
| Death by | Progressive | Fenêtre, rang par horloge | Échéance, appui, arrêt déclaré | Arrêt déclaré | Dynamique (q0 + (rang−1)·d) | Suite après fenêtre non acquise (A4) ; plusieurs exercices (R-03) |

Questions à instruire **avant PRE-10** : A2 (coexistence d'horloges), A4 (représentation d'une étape interrompue par une borne), A6 (schéma minimal des trois axes motif / résultat / achèvement). Règles précises : PRE-11.

## 8. Orientation PRE-10 (non engagée)

Le moteur PRE-10 consommerait l'instantané et le plan développé (D.1, D.2) et les descripteurs (D.3) ; il implémenterait seulement l'expansion finie, l'horloge d'étape et les déclencheurs de Libre, en gardant des points d'extension pour la fenêtre, la borne globale et la génération progressive. Les tables d'exécution et de résultats (A6) sont conçues en PRE-10. Aucun de ces éléments n'est développé en PRE-9.

## 9. Risques techniques

| Risque | Maîtrise |
|---|---|
| Régression de la Composition (6 060 lignes, 19 tests d'intégration) | Découpage progressif ; tests d'intégration existants gardés verts à chaque story ; nouveaux tests par niveau |
| Perte de données à la migration du brouillon et à E.8-b | Tests sur copie de base réelle ; transaction unique ; rapport de migration ; aucune réinitialisation |
| Performance du glisser-déposer imbriqué | Carte portée hors rendu ; mesures sur iPhone dès B.4 |
| Ambiguïtés Formats × D-451 | ARB-03 tranché avant C.3 |
| Rendus non dessinés (stepper, éclairage, Cycle déployé) | ARB-19 ; rendu provisoire recetté |
| Mémoire lors de la suite complète | Exécution fractionnée (Q.0) |
| Documents normatifs contradictoires | Lot documentaire de classe B à chaque story (règle permanente) |
