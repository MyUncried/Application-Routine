# Recette PRE-9 n° 1 — corrections (29/10/2026)

Résultats de Hermann : cahier de recette en ligne (https://claude.ai/artifact/8E8rRdCBYzVRx5n6rK6T1k), 29/10/2026 — KO : base-3, ent-3, obs-3 ; notes : cre-figma, obs-4 ; constats a) à k) ; demande complémentaire en conversation (carte d'Exercice ouverte depuis une Séance). Décisions recopiées au registre : ch07 « Recette PRE-9 n° 1 — décisions de Hermann du 29/10/2026 ».

## Livré

1. **Déroulement A.2 (constat k, classe B)** : aucune feuille de paramètres ouverte automatiquement ; toucher une carte « à compléter » (même signal que le fond rouge, D-448 point 7) ouvre directement `ExecutionParametersSheet` ; carte complète : ouverture de l'Exercice. `useMovementExerciseIntake` (`openParameters`), `movementExercises.ts` (`isExerciseParametersIncomplete`, `inheritsCircuitSeriesCount`, `isPersistedMovementOccurrence`), `handleEditActivity`.
2. **Exercice ouvert depuis une Séance (classe A, CE-MVT-01)** : gabarit Mouvement (média derrière la zone de contexte, description, phases), Mouvement enregistré en lecture seule sans crayon, carte « Paramètres d'exécution » vers la feuille existante (sans Compte à rebours ni Fin, ch13 l.2594). Route `/exercise?exerciseId=` inchangée. Création par l'ancien chemin et parcours du Catalogue inchangés (A.3).
3. **Points d'arrêt (KO base-3, constat j)** : non reproduit avec un seul Circuit (rouvert depuis SQLite, posé par « Ajouter un circuit », point préexistant). Bouton inactif dans une Séance à plusieurs conteneurs : limite planifiée jusqu'à B.6. À 1 tour, RM-219 interdit un Point en tête d'un Circuit qui ouvre la Séance et en fin d'un Circuit qui la ferme. Tests de non-régression ajoutés.
4. **Circuit et Cycle (KO obs-3, Figma `10744:20108`, `10744:20270`)** : ligne d'en-tête de 18, marges de 14, Circuit replié de 68 au total ; nombre et unité contigus en gras, cible unique ; durée noire et en gras ; adjectif en gras ; ouverture (450 ms) et fermeture (700 ms) animées, réduction des animations respectée ; Cycle à bords arrondis (18), double cercle, fond `#E0E2EF` ; pictogrammes de Figma `10744:20160`, `10744:20166`.
5. **Choix de nature (KO ent-3)** : description sous chaque option, plus petite (iOS : second texte SwiftUI du bouton ; Android : déjà présente).
6. **Menu Créer (cre-figma, obs-4, constat f)** : axe bleu jusqu'à Annuler ; options inactives opaques (`#E5E8F0`, contour `#BABFCC`, libellé `#5C6170`) ; « Annuler » en `colors.primary` ; apparition en fondu de 600 ms.
7. **Carte à compléter** : texte sur deux lignes, chronomètre à sa place, liseré rouge de 1.
8. **Zone de contexte (constat a)** : `ContextBand` `fadeToTransparent` — couleur de la zone puis dégradé vers la transparence (Catalogue des Séances, Composition). Le fondu blanc datait de D-356 (PRE-3), aucune régression récente.
9. **Catalogues (constats d, e)** : Mouvements : Créer | Rechercher | Trier | Filtrer ; Séances : rangée de 44, boutons à la hauteur de ceux des Mouvements.
10. **Fiche Mouvement (constats b, g)** : invite « Nom du mouvement » en gris clair (`#AEB3BA`) ; nom d'un Mouvement archivé : « Un mouvement **archivé** porte déjà ce nom. ».
11. **Paramètres d'exécution (constat h)** : nouvel Exercice en Durée, côté Sans (données existantes non modifiées) ; roulette d'une cible vide ouverte à 00:00, ✓ inactif jusqu'à une valeur ; barre du clavier 52 (marges 8), fond `#E1E4E8` (Figma `9295:43707`) ; colonnes Libellé / Durée réparties ; tableau des phases refermé par tout autre contrôle de la feuille (animation de sortie existante, 350 ms).

## À CLARIFIER (classe C — choix provisoires en place)

1. **Carte à compléter** : la seconde ligne du texte occupe la place de la récupération, qui n'est plus dessinée (lue par VoiceOver).
2. **Fond du Circuit** `#EBEDF5` (Figma `#F3F4F9`), choisi pour le contraste demandé.
3. **Options inactives du menu** : traitement gris choisi (Figma ne montre pas d'état inactif) ; pictogramme voilé de gris.
4. **Exercice depuis une Séance** (aucune maquette ; la plus proche, `10419:22924`, montre encore un crayon) : carte « Paramètres d'exécution » sous les phases ; titre « Mouvement » (lecture seule) ou « Modifier le mouvement » (Mouvement nouveau non enregistré, ou ancien Exercice sans Mouvement) ; « Réordonner les niveaux » conservé dans le menu Niveau.
5. **Roulette de durée** ouverte à 00:00 ; couleur de la barre du clavier (le clavier iOS est translucide).
6. **Frange dégradée du Cycle** (COMP §4) toujours non rendue.

## Questions ouvertes à Hermann

1. Constat b : « Créer un nouvel exercice » n'apparaît pas sur la fiche Mouvement (titre « Créer un mouvement ») ; seule l'entrée du menu Créer de la Composition porte ce texte. Est-ce elle à renommer ?
2. Constat e (recherche « Squat ») : non reproduit, dans les deux contextes, saisi d'un coup ou lettre à lettre. Hypothèse non démontrée : panneau de suggestions rogné quand le message rouge s'affiche. Un Mouvement « Squat » archivé existait-il ?
3. KO base-3 : la Séance avait-elle plusieurs Circuits ou un Cycle, ou un Circuit à 1 tour en début ou fin de Séance ?

## Synchronisation code / documentation

- **Classe A** : CE-MVT-01 (Exercice depuis une Séance) ; Figma (Circuit, Cycle, pictogrammes) ; D-224 (dégradé) ; ch08 « Changement de côté » défaut Sans.
- **Classe B** : registre ch07 (nouvelle section) ; annotations datées : ch10 RM-021 (l.895) et en-tête (l.1063) ; ch07 D-184 (l.455), D-356 (l.807), D-448 point 7 (l.1073), ARB-22a (l.1180) ; ch03 l.319 ; ch08 Mode (l.333) et Durée (l.335) ; ch13 l.1536, l.1806, l.2032 ; `PRODUCT.md` l.147 ; `KODJO-Composition-conteneurs-2026-10-28.md` l.32, l.48 ; `epics.md` A.2 ; `spec-a-2` point 1.
- **Classe C** : points ci-dessus.
- **Classe D** : `useCircuitCardsReveal` (Reanimated), `ContextBand.fadeToTransparent`, `namePrompt`.
- Story B.4b ajoutée au plan et au suivi.

## Tests

Nouveaux : `CompositionScreen.recette1` (7), `CreateMenu`, `OccurrenceCardIncomplete`, `ExerciseScreen.sessionMovement.integration` (6), cas ajoutés à `MovementScreen.b2.integration`, `ExecutionParametersSheet.phases`, `movementExercises.a2`. Tests du crayon depuis une Séance (r4, r9, r10) retirés (CE-MVT-01). Suite complète : voir le message de commit. Aucune vérification sur iPhone.
