# Claude Code — planification : grille de créneaux, Répétition, Rappel (18/11/2026)

Mission : appliquer à l'application les décisions D-519 à D-526 (`docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md`), règles RM-253 à RM-264 (chapitre 10, dont D-527 : cycle, nom, migration) et contrat CE-UI-12 (chapitre 13). Lis d'abord ces trois sources, `docs/AGENTS.md` (docs Expo v57) et `CLAUDE.md`. Travaille sur une branche dédiée, jamais sur main ; ne fusionne pas.

## Baseline gelée (change control)
PRESERVE : tout écran, composant ou comportement non cité ci-dessous ; le moteur de génération des occurrences, les Exécutions et Instantanés historiques ; la sélection des contenus (modale à cases, coche d'en-tête, D-499) ; l'Agenda et le Calendrier ; les primitives natives existantes.
CHANGE : écrans de planification d'un parcours et d'une séance seule (CE-UI-12).
FORBIDDEN : remplacer une primitive native par une imitation React Native ; réécrire les tests en masse ; toucher à l'Agenda, au Catalogue ou à la Composition ; décider les points À CLARIFIER. Toute substitution jugée nécessaire → arrêt `CHANGE_REQUEST_REQUIRED` avant code ; tout diff hors composant ciblé → `SCOPE_EXPANSION_REQUIRED`.

## À réaliser
1. **Quatre cartes grises** : Programme + Début le ; Répétition ; Séance par créneau ; Rappel. Fond et trait de la carte du Profil, rayon 12, marges 12, marges d'écran 16 (D-521).
2. **Zone de contexte** : nom libre, unique (D-522, RM-258 : copie auto du nom de séance quand planifiée depuis « Planifier » du glisser à gauche, ou quand une seule séance est sélectionnée ; sinon vide et obligatoire) ; synthèse 14 px, durée en premier, sans point final ni majuscule, sans « Prochain créneau », « X jours par semaine » si les jours ne tiennent pas (RM-259). Planifier un parcours / une séance = modale iOS.
3. **Répétition sans interrupteur** (D-520, RM-257) : valeur modifiable « toutes les » / « tous les » (accord avec l'unité) / « aucune », nombre, unité, « jusqu'au » + date. Rangée des jours pour l'unité semaines seulement, de « toutes les » au bord droit, sans séparateur.
4. **Grille créneaux × rotation** (D-519, RM-253 à RM-256) : « Séance par créneau » (non gras) au-dessus du tableau ; en-tête avec « Changer » toujours visible et colonnes #1 à #7 (seul #1 actif au départ) ; une ligne par séance ; points = séance jouée ; au moins un point par colonne et par ligne ; mention « à chaque fois » / « x fois sur n » calculée en direct ; plusieurs séances dans un créneau = un lancement dans l'ordre des lignes (= ordre de sélection) ; toucher un numéro de colonne ouvre le sélecteur numéroté (DSF « Sélecteur numéroté », Figma 12626:2111) qui règle la longueur du cycle. Remplace le réglage « x fois sur n » par contenu (CE-UI-11).
5. **Roulettes** : nombre de semaines et Rappel personnalisé = roulette native iOS `@expo/ui/swift-ui`, `pickerStyle("wheel")`, en popover près du champ, fond grisé, ni titre, ni bouton, ni unité. Supprimer le stepper du nombre de semaines. Respecter la règle « primitives natives » de `.github/AI_ORCHESTRATION.md` (équivalent Android natif si la plateforme l'exige, sans fallback silencieux).
6. **Rappel sans interrupteur** : Sans / 15 min / 30 min / 1 h / Autre (D-524) : « 5 min » retirée, « Sans » désactive le rappel, roulette de « Autre » sans unité.
7. **Écrans retirés** (D-523) : anciens écrans Planifier un parcours, Fréquence, Sélectionner plusieurs séances (anciennes versions), Rappel personnalisé sélectionné, Sans répétition.

Références Figma (fichier `G6RY5Ebhgwb4AHIOYDwwvg`, page Prototype MVP) : grille `12650:27854`, ~~cycle étendu `12624:29713`~~ (écran supprimé le 19/11/2026 : le cycle étendu se déduit de la même grille avec plus de colonnes), sélecteur numéroté `7599:14197` (ancien `12628:34456` supprimé le 19/11/2026), séance seule `12652:28035`, date `12652:28155`, Rappel `12652:28306`, semaines `12652:28447`. Le Figma définit le rendu ; il ne crée pas de règle métier.

## Décisions complémentaires du 18/11/2026
Occurrences passées rejouables, elles ne disparaissent pas (D-525, remplace RM-049) ; unité « mois » retirée, restent jours et semaines (D-526). Ces deux points touchent l'Agenda et le calcul des occurrences : n'applique que ce qui relève de la planification et signale tout impact Agenda par `SCOPE_EXPANSION_REQUIRED`.

## Tests et preuves
Tests ciblés : règles de la grille (≥ 1 point, cycle 1..7, calcul « x fois sur n »), accord « toutes/tous les », nom (cas de copie et cas vide obligatoire), jours seulement pour semaines, roulette native réellement utilisée (aucun fallback). Une suite verte ne remplace pas la validation sur iPhone.

## Livraison
Synchronisation code/documentation (classe A : le code rejoint D-519 à D-526). Rapport de mission dans `.github/orchestration/reports/` avec liste PRESERVE/CHANGE/FORBIDDEN démontrée, commit, état Git ; vérifications à faire sur iPhone : roulettes, popovers, grille à 7 colonnes, modale iOS.
