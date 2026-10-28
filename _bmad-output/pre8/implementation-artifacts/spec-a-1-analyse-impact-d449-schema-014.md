# Story A.1 — Analyse d'impact D-449 et conception du schéma 014

> Statut : done. Exigée par ch09 (« le schéma physique et la reprise des données seront analysés avant développement ») et ch12 (« une analyse d'impact précédera l'implémentation »). Base : `pre8-bmad/dev` @ `082390c0`.

## 1. Écarts entre le code livré et la cible D-449

| Cible D-449 | Code livré (schéma 013) | Écart | Story |
|---|---|---|---|
| Mouvement partagé, identité et contenu propres | `movements`, alias, phases, Zones, médias, groupes ; nom UNIQUE | Aucun écart de modèle | — |
| L'Exercice est un composant de Séance, avec ses paramètres locaux | `activities` : occurrence avec paramètres, référence RESTRICT à `movements` | Conforme | — |
| Aucun Exercice autonome de Catalogue | `activity_definitions` + segment Exercices du Catalogue | Écart réel, mais son traitement dépend de l'interface du Catalogue unique (E) et d'un titre de conversion (Q-E1) | E |
| Séance = seul contenu lançable ou planifiable | Aucun code de planification ni de lancement | Rien à adapter | — |
| Plusieurs Cycles successifs contenant des Circuits ; Circuits et Exercices au niveau principal ; aucune imbrication | `cycles` : une ligne par Séance, `CHECK position = 1`, `repeat_count = 1` ; `tours` : une ligne par Cycle ; `activities.structural_position` dans BEFORE, IN ou AFTER | Écart de schéma et de domaine | A.2 à A.4 |
| Instantanés autonomes figés au démarrage | `exerciseSnapshot.ts` (domaine pur, sans moteur) | Inchangé | — |

## 2. Modèle de domaine retenu (A.2)

`SessionStructure` est la séquence ordonnée des éléments du niveau principal :

- `EXERCISE` : un Exercice (occurrence `Activity`) ;
- `CIRCUIT` : `{ id, repeatCount 1..99, nature TOURS | SERIES, exercises[] }` ;
- `CYCLE` : `{ id, repeatCount ≥ 1, circuits[] }`, qui contient des Circuits et rien d'autre.

L'absence d'imbrication est garantie par les types : un Cycle ne contient que des Circuits, et un Circuit que des Exercices. Aucun plafond de Cycles ni de répétitions de Cycle n'est fixé (D-449 §4 : « aucun nouveau plafond arbitraire »). Seule la borne existante du Circuit, 1..99, est conservée.

Points d'arrêt : `{ id, circuitId | null, position }`. La position est le nombre d'éléments du conteneur qui le précèdent : au niveau principal, les Exercices, Circuits et Cycles ; dans un Circuit, ses Exercices. Les règles RM-219, RM-251 et D-442 restent appliquées par le validateur existant lorsque la structure est représentable dans l'ancien modèle. Pour une structure plus riche, leur généralisation relève de l'interface de composition (Epic C) : dans A, une telle structure n'accepte aucun Point d'arrêt (garde explicite plutôt que règle inventée).

**Projection compatible (interface actuelle inchangée).** L'ancien modèle `cycle.beforeTour / tour / afterTour` est exactement la structure `[Exercices…, Circuit, Exercices…]` à un seul Circuit et sans Cycle. Les conversions dans les deux sens sont pures et sans perte :

- avant → `[BEFORE…, CIRCUIT(tour), AFTER…]` (le Circuit est toujours présent, même vide, pour l'aller-retour exact) ;
- Points d'arrêt : `(BEFORE, p)` → `(null, p)` ; `(IN, p)` → `(tour, p)` ; `(AFTER, p)` → `(null, nB + 1 + p)`.

Le Cycle technique `position = 1, repeat_count = 1` n'est pas un Cycle utilisateur : il ne devient pas un élément `CYCLE`.

Comptes D-449 §6 : nombre d'Exercices définis dans la composition, sans multiplier par séries, tours, côtés ni répétitions de Cycle. Deux exercices du même Mouvement comptent pour deux. La durée réutilise les contributions existantes (`computeActivityDurationResult`, `seriesCircuitContribution`) : la multiplicité est le produit des répétitions du Circuit et de celles de son Cycle.

## 3. Schéma physique 014 (A.3)

Tables reconstruites en transaction exclusive (patron 012/013). Les migrations 001 à 013 restent intactes.

- `cycles` (Cycles utilisateur) : `id`, `session_id` (FK CASCADE), `position ≥ 0` (rang au niveau principal), `repeat_count ≥ 1`, `UNIQUE(id, session_id)`.
- `tours` (Circuits) : `id`, `session_id`, `cycle_id` NULL (FK `(cycle_id, session_id)` CASCADE), `position ≥ 0` (rang au niveau principal si `cycle_id` est NULL, sinon rang dans le Cycle), `repeat_count` 1..99, `side_mode` (colonne technique conservée), `nature` TOURS | SERIES, `UNIQUE(id, session_id)`.
- `activities` (Exercices) : colonnes 013 inchangées, sauf `cycle_id` et `structural_position`, qui sont retirées ; `tour_id` NULL (FK `(tour_id, session_id)` CASCADE), avec `position` au niveau principal si NULL, sinon rang dans le Circuit. CHECK composite repris à l'identique. FK RESTRICT vers `movements` conservée.
- `session_stop_points` : `id`, `session_id`, `tour_id` NULL (FK CASCADE), `position ≥ 0`.
- Unicité des rangs : index uniques partiels par conteneur (Circuit dans un Cycle, Exercice dans un Circuit, Point d'arrêt par conteneur). L'unicité d'un rang du niveau principal entre trois tables est garantie à l'écriture par le domaine (positions contiguës) et contrôlée à la lecture : un trou ou un doublon est une erreur structurelle, jamais une lecture silencieuse.

**Conversion des données (aucune réinitialisation).** Chaque Séance garde son identité, ses Exercices (mêmes identifiants, paramètres et références au Mouvement), son Circuit (même identifiant que le Tour, nature et compte conservés) et ses Points d'arrêt (identité conservée, emplacement converti selon §2). `activity_definitions`, `movements` et tables filles, référentiels, Profil, médias et avis ne sont pas touchés. Contrôles : comptes avant et après égaux, `foreign_key_check` vide, sinon erreur structurelle avec annulation complète (`user_version` reste à 13).

## 4. Risques

- Le `CompositionScreen` (6 000 lignes) et le brouillon lisent `session.cycle`. La projection est donc produite par le repository : aucune modification de l'interface dans A.
- Les tests qui écrivent du SQL brut sur `cycles`, `tours` ou `activities` à la dernière version doivent suivre le schéma 014 ; les tests des migrations historiques s'arrêtent à leur version (`targetVersion`).
- Une Séance plus riche que l'ancien modèle ne peut pas être ouverte par l'interface actuelle. Aucune ne peut être créée avant l'Epic C ; la projection lève une erreur typée plutôt que de tronquer.
