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
9. **Catalogues (constats d, e)** : Mouvements : ~~Créer | Rechercher | Trier | Filtrer~~ Rechercher | Filtrer | Trier | Créer (Hermann, 30/10/2026 : « rechercher, filtrer, trier puis créer ») ; Séances : rangée de 44, boutons à la hauteur de ceux des Mouvements.
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

## Contre-recette du 30/10/2026

Résultats lus dans le cahier en ligne : OK r1-k, r1-stop, r1-circuit, r1-nature, r1-catal, r1-fiche, r1-params ; KO r1-carte, r1-cycle, r1-menu, r1-exo, r1-fondu ; nouveaux constats. Demandes recopiées au ch07, « Contre-recette PRE-9 n° 1 ». Suivi : classe, puis réalisation.

1. **r1-catal / ordre** (B) : Rechercher | Filtrer | Trier | Créer (commit `c4c217a6`).
2. **r1-carte** (A, D-448 point 7) : la rangée des valeurs d'une carte incomplète couvre les lignes 2 et 3 (le texte tenait dans une hauteur fixe de 16, coupé par iOS) ; chronomètre dans sa propre boîte de 16, même position sur toutes les cartes. Aucune maquette de carte incomplète dans Figma : disposition à confirmer sur l'iPhone.
3. **r1-cycle** (A) : le cadre d'enveloppe d'un Circuit suit son fond (débord de 16, ou 12 dans un Cycle, rayon 18).
4. **r1-menu** (A pour le « + » unique ; B pour le texte inactif en regular) : le menu mesure le « + » réel et place le sien exactement dessus ; un seul « + » visible. Interprétation de « qui apparaît activé » : affiché normalement, non voilé (Figma `10705:20223`) — À CLARIFIER si un état « enfoncé » était attendu.
5. **r1-exo** (B) : section « Phases du mouvement » retirée de l'Exercice ouvert depuis une Séance ; libellés et structure des phases dans la feuille des paramètres (verrouillés pour un Mouvement enregistré).
6. **r1-fondu** : non corrigé. Historique `main`, `pre8-bmad/dev`, `pre9-bmad/dev` : depuis `ee32191a` / `ce8e35a2` (12/10), le dégradé a toujours fini sur le blanc, le contenu étant placé sous la bande, jamais derrière ; aucun commit de régression trouvé. Seule la fiche Mouvement (F01) fait passer un contenu sous un fondu. À CLARIFIER avec Hermann : quel écran, ou quelle version, montrait le bon rendu.
7. **Cycle progressif** (B) : à la confirmation, fond, anneau et en-tête du Cycle apparaissent en 450 ms (durée choisie, sans maquette) ; ignoré si « Réduire les animations ».
8. **Second appui sur « Ajouter un arrêt »** (B) : applique comme Confirmer ; sans changement, referme seulement (ch08, ch13 annotés).
9. **Paramètres d'exécution, séparateurs** (B) : aucun trait entre la ligne et son tableau déployé (phases, séries) ; trait sous le tableau. Diffère de Figma `9207:18817` (aucun trait sous le tableau des phases) : la demande explicite prévaut.
10. **Recherche de nom** (B) : plus de limite à 5 résultats (DSF Mouvements, ch10, ch13, Règles v7 annotés).
11. **Séance incomplète** (C, interprétation) : une Séance est marquée incomplète (fond rouge, liseré rouge, mêmes jetons que la carte d'Exercice) si l'un de ses Exercices est « Paramètres à compléter ». Aucune règle écrite ni maquette pour cet état : À CLARIFIER.
12. **Menu Créer** (B) : « Créer un nouveau mouvement » (libellé complété et confirmé par Hermann le 30/10).
13. **Choisir un mouvement existant** (B) : mention « Dans la séance » sous le nom des Mouvements déjà présents (rendu choisi par Hermann le 30/10), carte de hauteur constante (une étape de description au lieu de deux) ; le Mouvement reste sélectionnable.
14. **Durées des phases portées par le Mouvement** (B) : story A.2b, après B.3 (décision du 30/10) ; DSF Mouvements §2, MVT-09 et ch13 annotés.

## Contre-recette n° 2 du 30/10/2026

Résultats : OK r1-carte, r1-menu, r2-arret, r2-catal, r2-cycle, r2-cycle-anim, r2-existant, r2-exo, r2-menu, r2-params, r2-recherche, r2-seance (séance incomplète validée : au moins un Exercice à compléter) ; KO r1-fondu, obs-3 ; nouveaux constats a–c et demande sur le voile des filtres. Demandes recopiées au ch07, « Contre-recette PRE-9 n° 2 ».

1. **Coin replié** (B) : « Dans la séance » remplacé par un coin replié bleu Kodjo (`colors.primary`) dans l'angle inférieur droit de la carte du Catalogue des Mouvements, en sélection pour une Séance : triangle de 18 à 45°, dans la boîte intérieure à la bordure (contour continu), arrondi intérieur 11,5 ; deux étapes de description rétablies ; VoiceOver annonce « dans la séance ».
2. **obs-3, marges** (B) : marge basse d'un Circuit déplié (sous la dernière carte) et d'un Cycle (sous son dernier membre) = 8, écart gabarit photo → bord de la carte (`CONTAINER_PADDING_BOTTOM`) ; marges hautes 14 ; Circuit replié inchangé (validé r1-circuit) — à confirmer ; rail recalculé.
3. **Circuit, apparition et disparition** (B) : un Circuit créé par « Confirmer le circuit » apparaît en 700 ms (fond, anneau, en-tête) ; dépliage 450 → 700 ms, repliage 700 → 900 ms (choix, sans maquette). Retrait d'un Circuit de la structure : instantané — À CLARIFIER : « disparition » = repliage (fait) ou retrait (non fait ; retrait de Circuit en structure générale : B.4/B.5).
4. **Exercice directement dans un Cycle** (A, anomalie) : la rangée de la carte n'a plus de fond blanc rectangulaire (fond utile au balayage seulement, désactivé en structure générale jusqu'à B.5).
5. **Fondu** (B) : choix de Hermann « Liste qui défile derrière » ; la zone de contexte passe au-dessus du corps (Catalogue : Mouvements et Séances ; Composition), le corps remonte de la part fondue (23) et sa liste défile derrière le dégradé ; position de repos inchangée ; touchers de la part fondue transmis aux cartes.
6. **Voile des feuilles de filtres** (B) : le voile apparaît en fondu (600 ms, comme le menu Créer), la feuille seule monte du bas (300 ms, choix).
