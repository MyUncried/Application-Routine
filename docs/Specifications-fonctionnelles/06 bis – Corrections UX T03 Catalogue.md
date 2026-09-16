# Corrections UX T03 — Catalogue et parcours associés

Ce document complète les chapitres `03 – Parcours utilisateur`, `06 – Ecrans et navigation de la V1` et `08 – Conception fonctionnelle détaillée` pour les corrections UX intégrées à T03. **Toute formulation historique de ces trois chapitres qui diverge des règles ci-dessous est supersédée par ce document et par `07 bis – Arbitrages T03 du 15 septembre 2026.md`.** Elle ne constitue plus une règle active, notamment les anciennes descriptions « carte immobile / actions en superposition ».

## 1. Navigation principale

Le libellé permanent du premier onglet de navigation est **`Catalogues`**. Le titre de l’écran reste contextuel : `Catalogue des séances`, `Catalogue des activités` ou `Catalogue des circuits`.

Le composant DSF canonique est `Navigation / Bottom — Source exact` (`2537:214`). Les variantes de destination sont :

| Destination | Variante DSF | Libellé | Boîte optique | Dessin interne | Cible tactile | État |
|---|---|---|---:|---:|---:|---|
| Catalogues | `2537:86 — Active=Catalogue` | `Catalogues` | `32 × 32 pt` | max `24 pt`, centré | ≥ `48 × 48 pt` | actif lorsque le Catalogue est la destination courante |
| Calendrier | `2537:118 — Active=Calendar` | `Calendrier` | `32 × 32 pt` | max `24 pt`, centré | ≥ `48 × 48 pt` | actif sur Calendrier |
| Suivi | `2537:150 — Active=History` | `Suivi` | `32 × 32 pt` | max `24 pt`, centré | ≥ `48 × 48 pt` | actif sur Suivi |
| Profil | `2537:182 — Active=Profile` | `Profil` | `32 × 32 pt` | max `24 pt`, centré | ≥ `48 × 48 pt` | actif sur Profil |
| Recherche globale | `2736:2 — Active=Search` | aucun libellé de destination | contrôle `58 × 58 pt` | pictogramme vectoriel DSF | `58 × 58 pt` | état Recherche |

Les quatre dessins de destination ont été corrigés dans le composant source Figma le 15 septembre 2026 : leur dimension maximale est `24 pt` et ils sont recentrés dans la boîte optique `32 × 32 pt`. Aucune substitution par un glyphe texte, emoji ou pictogramme système n’est autorisée.

Le Catalogue s’ouvre sur le segment `Séances`. Une relance complète de l’application rétablit ce segment ; le dernier segment utilisé n’est pas mémorisé entre deux lancements complets.

## 2. Cartes du Catalogue des activités

Chaque carte :

- porte une barre verticale bleue ;
- ouvre la consultation/modification par sa surface principale ;
- présente un bouton Lecture indépendant qui lance exclusivement l’Exécution directe ;
- présente le contrôle `Déployer` **visible mais désactivé** en T03 ;
- n’affiche aucune poignée ou icône de déplacement ;
- réserve la même zone droite aux contrôles, afin de conserver l’alignement des contenus.

`Déployer` réutilise exactement le composant DSF du Catalogue des séances `2537:1033 — State=Collapsed`, cible `48 × 48 pt`. Son activation fonctionnelle est reportée au lot Médias.

Une Récupération visible sur la première carte d’une maquette Figma est une donnée de démonstration : dans l’application, toute carte l’affiche uniquement lorsque l’`ActivityDefinition` concernée possède une Récupération non nulle.

### 2.1 Contrôles communs `Créer`, `Filtrer` et `Trier`

Les Catalogues `Activités / Séances / Circuits` utilisent un même bandeau de trois actions, dans cet ordre : `Créer`, `Filtrer`, `Trier`. Le même bandeau reste visible sous le voile de `Recherche globale — Champ déployé`.

À la largeur Figma de référence `402 pt` :

- chaque surface visuelle mesure `108 × 32 pt` ;
- l’espace entre deux surfaces est `8 pt` ;
- le groupe complet mesure `340 pt` et est centré horizontalement ;
- les positions Figma de référence sont `x=31`, `x=147`, `x=263` ; ces coordonnées sont des évidences de maquette et non des positions absolues à coder ;
- `Créer` et `Filtrer` utilisent l’état actif bleu représenté dans Figma ;
- `Trier` reste visible dans son état désactivé gris T03.

La dimension visuelle `32 pt` de hauteur ne déroge pas à l’exigence transverse de cible accessible ≥ `48 × 48 pt`.

`Filtrer` et `Trier` restent des contrôles communs aux trois contextes du Catalogue ; le contenu de leurs options peut dépendre du segment actif.

Pour T03, dans `Catalogue des activités` :

- `Filtrer` est fonctionnel **au minimum pour accéder à `Archivées`** ;
- aucune autre option de filtre n’est définie à ce stade et aucune ne doit être inventée ;
- `Trier` reste **visible mais désactivé** ;
- le tri automatique appliqué reste `date de dernière modification décroissante` ;
- un aller-retour courant conserve recherche / filtre Archives / tri implicite / scroll ;
- un relaunch complet ne conserve pas cet état.

Le **contrôle d’entrée** `Créer / Filtrer / Trier` est désormais représenté et vérifiable dans Figma. En revanche, le détail graphique des panneaux/options ouverts de `Filtrer` et `Trier` n’est toujours pas conçu : il reste `NON VÉRIFIABLE` visuellement. Aucune modale, feuille, popover ou liste locale ne doit être inventée avant arbitrage Figma/documentaire.

## 3. Arbre `Créer` depuis le Catalogue

Ordre exact :

1. `Une nouvelle activité` — actif T03 ;
2. `Une séance` — actif ;
3. `Un circuit` — visible, désactivé ;
4. `Annuler`.

`Annuler` restaure exactement l’état antérieur du Catalogue. L’icône d’annulation est le composant Ajouter tourné de `45°`, conformément au DSF ; aucun `X` texte ou système ne le remplace. Le fond grisé conserve le contexte du Catalogue actif.

Lorsque l’arbre est ouvert, le contrôle `Créer` conserve la géométrie du bandeau commun `108 × 32 pt` et devient l’ancrage visuel de l’arbre. `Filtrer` et `Trier` restent visibles derrière le scrim, à leurs positions communes, mais le scrim bloque leur interaction jusqu’à fermeture de l’arbre.

## 4. Ajouter une Activité depuis une Composition

L’arbre propose :

1. `Une nouvelle activité` ;
2. `Une activité existante` ;
3. `Annuler`.

`Une nouvelle activité` crée une Activité propre à la Séance. `Une activité existante` ouvre une sélection multiple de références persistantes. La validation est désactivée tant que la sélection est vide. Les références validées sont insérées selon leur ordre visible dans la liste filtrée et non selon l’ordre des touchers. Chaque insertion devient une copie indépendante.

## 5. Roulettes

Lorsqu’une roulette est ouverte :

- le voile grisé bloque les interactions et le défilement de l’arrière-plan ;
- l’action principale fixe inférieure (`Continuer`, `Terminer`, etc.) reste visible avec son apparence active normale ;
- cette action est néanmoins fonctionnellement désactivée ;
- elle est aussi indisponible pour VoiceOver/TalkBack ;
- `Annuler` restaure l’état calculé avant ouverture ;
- `Confirmer` applique les valeurs centrées puis recalcule l’état de l’écran.

Aucun style disabled additionnel du bouton principal n’est introduit : le voile grisé matérialise l’indisponibilité de l’arrière-plan.

## 6. Actions révélées par glissement

Le glissement gauche d’une carte déplace visiblement la carte avec le geste et révèle progressivement les actions placées derrière. Lorsque le seuil d’ouverture est atteint, la carte se stabilise dans son état ouvert.

Dans cet état :

- les autres contrôles de l’écran restent actifs ;
- un appui normal sur une autre carte conserve son action normale ;
- aucun second glissement gauche ne peut toutefois ouvrir simultanément les options d’une autre carte ;
- un appui sur le fond n’a aucun effet sur l’état contextuel ;
- un appui sur la surface principale de la carte ouverte, hors options, n’exécute aucune action ;
- un glissement droit commencé ailleurs que sur la carte ouverte n’a aucun effet ;
- seul un glissement droit commencé sur la carte ouverte referme ses options, hors sélection explicite d’une option.

La règle historique « carte immobile, options en superposition » est supersédée dans tous les parcours de carte concernés par la correction T03.

Dans `Composition d’une séance — actions glissées`, le cadre `Dupliquer` reprend le rayon DSF/Figma. Un espace visuel sépare son bord gauche du bord droit de la portion encore visible de la carte ; cet espace laisse apparaître le fond du conteneur Tour.

## 7. Compte à rebours initial et Fin de séance

Ces deux cartes structurelles **ne sont jamais déplaçables**. Elles ne répondent à aucun appui long de déplacement et n’utilisent aucune poignée. Leur iconographie doit précisément éviter toute confusion avec les Activités réordonnables. La règle d’appui long de D-127 ne s’applique qu’aux Activités.

## 8. Catégories et transition de navigation

Après `Enregistrer la séance` depuis le parcours Catégories, la destination est `Catalogue des séances`, segment `Séances` sélectionné.

La transition utilisée est la transition canonique d’avancement : l’écran cible entre depuis la droite pendant que l’écran courant sort vers la gauche. Cette transition est commune aux navigations équivalentes et ne doit pas être réimplémentée localement dans l’écran Catégories.

## 9. Éditeur d’Activité

Dans la Synthèse de l’écran Ajouter/Modifier une Activité, le **nom de l’Activité est en gras**. Cette règle est locale à cette Synthèse.

Le texte des cartes de Composition ne développe jamais la direction ; une direction propre bilatérale y est portée uniquement par l’indicateur court `D→G` ou `G→D`. `Durée totale` reste visible dans les trois modes ; en Répétitions et À l’échec : `Durée totale : ≥ {durée connue}`.

Les frames Figma Répétitions `3561:4695`, Répétitions avec roulette ouverte `3561:7673` et À l’échec `3561:7802` affichent désormais explicitement le contrôle et son libellé `Durée totale >=`. Cette graphie de maquette matérialise la borne fonctionnelle `≥ {durée connue}` ; la valeur chiffrée montrée reste une donnée de démonstration.

Dans les écrans `Création activité` renseignés, le nom `Renforcement du genou` est une **valeur de démonstration Figma** destinée à éviter un faux placeholder. Il ne constitue ni une valeur par défaut ni une donnée à coder en dur. Seul l’écran `Création activité — Durée / Pause / Séries — Vide` conserve le placeholder `Nom de l’activité`.

## 10. Évidences Figma

- `3786:5093` — Catalogue des activités — liste ;
- `1992:9910` — Catalogue des séances — liste par défaut ;
- `1992:10129` — Recherche globale — Champ déployé ;
- `3787:5148` — Catalogue des activités — Créer — arbre d’actions ;
- `3841:8375` — Catalogue des séances — Créer — arbre d’actions ;
- `3561:4695` — Création activité — Répétitions / Pause / Séries — avec mode ;
- `3561:7673` — Création activité — Répétitions — roulette compacte ouverte ;
- `3561:7802` — Création activité — À l’échec ;
- `1992:9910` — Catalogue des séances — référence du contrôle `Déployer` ;
- `2537:1033` — composant canonique `Déployer` ;
- `2537:214` — composant canonique de navigation basse.

Le bandeau d’entrée `Créer / Filtrer / Trier` est désormais **CONFORME et vérifiable** dans les frames Catalogue et Recherche citées. Le rendu détaillé des panneaux/options ouverts de `Filtrer` et `Trier` reste `NON VÉRIFIABLE` faute de frame dédiée validée.

Captures documentaires embarquées : [`images/README-T03-FIGMA.md`](./images/README-T03-FIGMA.md).
