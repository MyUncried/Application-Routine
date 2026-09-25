# 13

> **Règle documentaire :** le chapitre 13 ne contient aucune copie d’écran. Les captures et copies physiques d’écrans/modales sont centralisées exclusivement dans le chapitre 06. Le chapitre 13 conserve uniquement les contrats, états, règles et références de nodes Figma nécessaires à la recette. – Contrats d’écran

## 1. Objet et statut normatif

Ce chapitre constitue la **spécification déterministe des écrans de production de T03**. Il transforme les décisions produit, règles métier, modèle de données, API fonctionnelles, architecture, Design System Figma et frames de référence en comportements directement exploitables par le développement et la recette.

Un écran T03 n’est considéré comme spécifié que si son contrat définit explicitement : contexte d’entrée, sorties, données et leurs sources, valeurs Figma, structure, éléments obligatoires, layout, responsive, états, contrôles, gestes, validation, brouillon/persistance, navigation/conservation d’état, erreurs, accessibilité, invariants, recette et traçabilité.

Les contrats T03 actifs sont `CE-T03-01` à `CE-T03-17`. Le présent chapitre constitue l’unique référence active des contrats d’écran T03. Aucun chapitre historique parallèle n’est requis pour l’application des contrats courants.

## 2. Sources et ordre d’application

Pour T03 :

1. décisions validées dans le chapitre 07, notamment D-143 à D-186, avec priorité aux décisions supersédantes D-167 à D-186 ;
2. modèle fonctionnel / modèle de données / règles métier ;
3. API fonctionnelles ;
4. architecture technique ;
5. chapitre 06 pour navigation/interaction et corrections UX T03 ;
6. présent chapitre 13 ;
7. Figma pour le rendu visuel et les états effectivement représentés.

Figma ne transforme jamais une valeur de démonstration en règle métier. Inversement, un comportement métier ne permet pas d’inventer un composant graphique absent de Figma. Tout détail visuel non représenté et non arbitré est `NON VÉRIFIABLE` ou `À CLARIFIER`.

## 3. Structure canonique obligatoire

Chaque contrat comporte **exactement les 21 rubriques suivantes**, même lorsqu’une rubrique renvoie à une règle commune :

1. Identification ;
2. Finalité fonctionnelle ;
3. Contexte d’entrée ;
4. Contexte de sortie / destinations ;
5. Données affichées et source de vérité ;
6. Classification des valeurs Figma ;
7. Structure de l’écran ;
8. Éléments obligatoires ;
9. Layout déterministe ;
10. Responsive, Safe Areas, texte, scroll et clavier ;
11. États de l’écran ;
12. Contrôles et interactions ;
13. Gestes ;
14. Validation ;
15. Brouillon et persistance ;
16. Navigation et conservation d’état ;
17. Erreurs et cas limites ;
18. Accessibilité ;
19. Invariants ;
20. Recette déterministe ;
21. Traçabilité.

## 4. Règles communes T03

### 4.1 Classification des valeurs Figma

Toute valeur visible est classée :

- `LIBELLÉ STATIQUE OBLIGATOIRE` : texte d’interface traduit via i18n ;
- `DONNÉE MÉTIER DYNAMIQUE` : valeur provenant du modèle, d’un brouillon ou d’un calcul ;
- `VALEUR DE DÉMONSTRATION FIGMA` : valeur uniquement illustrative, interdite en dur.

Les noms d’Exercices/Séances, catégories, zones corporelles, durées, nombres de Séries/répétitions, commentaires, ressentis, dates et ordre des cartes montrés dans les maquettes sont dynamiques/démonstratifs sauf mention contraire.

### 4.2 Responsive

- référence Figma standard : `402 × 874 pt` ;
- validations obligatoires : largeur `360`, `402`, `440` ;
- contenu centré au-delà selon architecture ;
- Safe Areas et Bottom Navigation selon chapitre 12 ;
- aucune coordonnée Figma n’est copiée comme position absolue React Native ;
- cibles tactiles ≥ `48 × 48 pt` sauf exception documentée ;
- aucun élément obligatoire sous le clavier, la navigation ou une zone système.

### 4.3 Navigation globale

Destination basse permanente : `Catalogues`, `Calendrier`, `Suivi`, `Profil` + Recherche.

Composant : `Navigation / Bottom — Source exact` (`2537:214`). Les quatre dessins de destination mesurent au maximum `24 pt`, centrés dans une boîte optique `32 × 32 pt`. Aucune substitution par glyphe/emoji/système.

### 4.4 Conservation d’état Catalogue

Recherche, filtre appliqué, tri implicite et scroll sont conservés pendant la session applicative courante et les allers-retours. Au relaunch, aucun filtre n’est appliqué et le Catalogue revient au segment `Séances`.

### 4.5 Commandes Catalogue `Créer` / `Filtrer` / `Trier`

`Créer`, `Filtrer` et `Trier` forment la rangée commune de commandes d’entrée des Catalogues représentés en T03. Dans la référence Figma `402 × 874 pt` :

- `Créer` = `108 × 32 pt` ;
- `Filtrer` = `108 × 32 pt` ;
- `Trier` = `108 × 32 pt` ;
- gap horizontal = `8 pt` ;
- ensemble centré horizontalement.

Les positions Figma vérifiées `x=31`, `147`, `263` sur la largeur `402 pt` sont des **preuves de rendu**, pas des coordonnées absolues d’implémentation React Native. Le responsive suit §4.2 et chaque action conserve une cible tactile ≥ `48 × 48 pt` même si sa forme visible mesure `32 pt` de haut.

`Filtrer` et `Trier` sont communs à `Exercices / Séances / Parcours`; leur représentation d’entrée est commune, leurs options peuvent être contextuelles. Le filtre inactif est un bouton rond blanc. Un appui l’étend en `Filtres / Aucun` sans modifier la liste. Après sélection d’un critère, le contrôle actif est bleu et étendu ; le rond bleu retire le filtre, tandis que la zone texte ouvre la modale. `Réinitialiser` revient à `Aucun`. `Créer` reste actif. `Trier` reste visible mais disabled en T03.

Pour T03 / `Exercices` :

- `Filtrer` propose les critères contextuels validés : statut (`Actives` / `Archivées`), Catégories et Zones corporelles ;
- `Trier` est visible mais disabled ;
- le tri réellement appliqué reste `updatedAt DESC` ;
- aucun menu de tri n’est ouvert ;
- aucune préférence de tri n’est persistée ;
- aucun critère non arbitré n’est inventé.

`Créer` est contextuel au Catalogue affiché : un tap ouvre directement la création de l’objet correspondant, sans écran ni arbre intermédiaire. Dans `1992:10129 — Recherche globale — Champ déployé`, la rangée `Créer / Filtrer / Trier` reste visible dans le Catalogue d’arrière-plan sous le contexte de recherche et le clavier.

Les **contrôles d’entrée** et les panneaux ouverts de `Filtrer` sont conçus et vérifiables dans Figma. `Trier` reste visible mais désactivé dans le périmètre T03.

### 4.6 Roulettes

Toutes les roulettes actives utilisent la famille de **modales basses** du DSF. Les anciennes représentations centrées ne constituent plus une référence active.

Roulette ouverte : **modale basse standardisée** avec scrim bloquant arrière-plan et scroll ; CTA principal fixe reste visuellement normal mais fonctionnellement et accessibilité-inactif ; `Annuler` restaure ; `Confirmer` applique puis recalcule. Les valeurs restent brouillon jusqu’à confirmation.

### 4.7 Swipe contextuel

Swipe gauche : la carte suit le doigt et révèle progressivement les actions derrière. Une seule carte peut exposer ses actions. Les autres contrôles restent actifs, mais un autre swipe gauche n’ouvre pas un second contexte. Tap fond = aucun effet. Tap surface de carte ouverte hors actions = aucun effet. Seul un swipe droit commencé sur la carte ouverte referme.

### 4.8 Cartes structurelles Composition

`Compte à rebours initial` et `Fin de séance` : jamais déplaçables, aucun appui long, aucune poignée de drag.

### 4.9 Transition canonique

Avancement vers l’écran suivant : cible entre depuis la droite, écran courant sort vers la gauche. Ne pas recréer localement une autre animation.

### 4.10 Référentiels — appui long et suppression

Les modales `Étiquettes`, `Catégorie` et `Zones corporelles` partagent le même contrat :

- appui court sur une option : sélection/désélection selon le contexte ;
- appui long : aucun changement de sélection et ouverture d’un `Overlay / Decision Dialog` destructif à deux actions ;
- titre dynamique : `Supprimer « {nom} » ?` ;
- message dynamique : si la valeur est utilisée, préciser qu’elle sera retirée des objets courants qui l’utilisent et que l’historique restera inchangé ;
- actions : `Annuler` à gauche, `Supprimer` à droite ;
- toutes les valeurs sont concernées, y compris les valeurs initiales fournies par KODJO ;
- après `Supprimer`, revenir à la modale de sélection restée ouverte, avec la valeur supprimée absente ;
- la suppression retire aussi la valeur de la sélection courante lorsqu’elle y était sélectionnée ;
- aucune restauration automatique d’une valeur initiale supprimée.

La recette doit couvrir au minimum une Étiquette, une Catégorie et une Zone corporelle, chacune dans un cas utilisé et non utilisé.

Références Figma : `4861:6145` (Étiquette), `4861:6259` (Catégorie), `4861:6348` (Zone corporelle).

---

# 5. B1 — Catalogue multi-type

## CE-T03-01 — Catalogue des séances — état T03

### 1. Identification

| Propriété | Valeur |
|---|---|
| Bloc | B1 |
| États | S01 + état vide/liste + retour Catégories + recherche globale déployée |
| T03-E | E01, E02, E04, E05, E06, E19, E67, E68, E69 |
| Frames | `2117:86`, `1992:9910`, `1992:10129` |
| Shell | `Shell / Screen`, Context On, Bottom Navigation |
| Nature | Écran existant modifié |

### 2. Finalité fonctionnelle

Faire du Catalogue des séances le segment d’entrée par défaut du Catalogue multi-type, avec navigation `Catalogues`, segment Exercices désormais actif, Parcours visible disabled, rangée déterministe `Créer / Filtrer / Trier` et action `Créer` contextuelle.

### 3. Contexte d’entrée

Entrées : fin Splash, tap `Catalogues`, retour d’un parcours Séance, retour après enregistrement depuis Catégories. Au relaunch, segment = `Séances` même si l’utilisateur avait quitté sur `Exercices`.

### 4. Contexte de sortie / destinations

- segment Exercices → `CE-T03-02` ;
- segment Séances → reste ;
- Parcours → aucune navigation ;
- Créer → règle contextuelle `CE-T03-03` puis création directe d’une Séance ;
- carte Séance → parcours existant T01/T02 ;
- Recherche → expérience de Recherche globale existante ;
- navigation basse → destination choisie.

### 5. Données affichées et source de vérité

Liste issue des services/repositories Séance. Noms, catégories, zones, durées et statuts sont dynamiques. Aucune carte d’exemple ne doit être ajoutée pour remplir l’écran.

### 6. Classification des valeurs Figma

`Catalogue des séances`, `Exercices`, `Séances`, `Parcours`, `Créer`, `Filtrer`, `Trier`, `Catalogues` = statiques. Contenus de cartes et valeur de recherche = dynamiques/démonstration.

### 7. Structure de l’écran

Header fixe → segmenté trois types → rangée commandes Catalogue (`Créer`, `Filtrer`, `Trier`) → liste/état vide → Bottom Navigation. En recherche globale déployée, cette structure reste le contexte d’arrière-plan représenté par `1992:10129`.

### 8. Éléments obligatoires

Titre contextuel ; segments égaux ; Séances selected ; Exercices enabled ; Parcours disabled ; rangée `Créer / Filtrer / Trier` ; navigation basse `Catalogues`. `Trier` visible disabled T03 ; `Filtrer` suit le comportement défini pour le contexte sans inventer d’options non arbitrées.

### 9. Layout déterministe

Segmenté sur largeur utile. Rangée Catalogue conforme §4.5 : trois contrôles visibles `108 × 32 pt`, gap `8 pt`, ensemble centré dans la référence `402 pt`. Liste dans Body scrollable, jamais sous navigation. La géométrie est commune à celle du Catalogue des exercices ; elle ne devient pas un jeu de coordonnées absolues RN.

### 10. Responsive, Safe Areas, texte, scroll et clavier

Appliquer §4.2. Segmenté flexible ; libellés complets ; contenu liste scrollable. Dans `Recherche globale — Champ déployé`, le clavier/contexte de recherche ne supprime pas la rangée du Catalogue d’arrière-plan et ne réduit pas ses cibles tactiles sous `48 × 48 pt`.

### 11. États de l’écran

Vide réel ; liste ; recherche globale déployée ; retour Catégories ; retour d’un sous-parcours ; relaunch sur Séances.

### 12. Contrôles et interactions

Exercices navigue ; Séances maintient ; Parcours disabled ; `Créer` initialise directement le parcours de création d’une Séance. Sur une Séance active, `Archiver` agit immédiatement lorsqu’aucune Routine n’est associée et affiche ensuite un snackbar `Séance archivée` avec `Annuler`. Si au moins une Routine est associée, une confirmation explicite précède obligatoirement l’archivage et la suppression de ces Routines ; après confirmation, aucun snackbar d’annulation n’est affiché. `Trier` reste non déclenchable en T03. T03 n’invente aucune nouvelle option Filtrer/Trier propre aux Séances.

### 13. Gestes

Cartes de Séance utilisant des actions contextuelles suivent §4.7. Aucun geste sur le segment désactivé.

### 14. Validation

Aucune validation pour changer de segment. Parcours et `Trier` ne déclenchent aucun événement métier. Créer n’écrit aucune donnée à l’ouverture. Pour `Archiver`, la confirmation est requise si et seulement si au moins une Routine est associée à la Séance. Le snackbar d’annulation est affiché si et seulement si l’archivage a été réalisé sans dialogue de confirmation.

### 15. Brouillon et persistance

Aucun état de segment persisté au relaunch. Le brouillon de création de Séance n’est initialisé qu’après tap sur `Créer`. État Recherche suit §4.4.

### 16. Navigation et conservation d’état

Retour Catégories impose `Catalogue des séances` / Séances. Les autres retours suivent leur contrat. Transition canonique §4.9. La recherche/filtres/tri implicite/scroll ne sont conservés que pendant l’aller-retour courant.

### 17. Erreurs et cas limites

Erreur de chargement : afficher état d’erreur prévu, pas un faux état vide. 0 résultat réel = état vide.

### 18. Accessibilité

Parcours annonce disabled ; Séances selected ; `Catalogues` est le label accessible du premier onglet ; `Trier` annonce disabled ; focus cohérent et cibles ≥48 malgré la hauteur visuelle `32 pt` des commandes.

### 19. Invariants

Séances = défaut/relaunch ; Exercices = actif T03 ; Parcours = disabled ; bottom label = `Catalogues`, jamais `Séances` ; rangée Catalogue = trois commandes présentes selon §4.5 ; `Trier` disabled.

### 20. Recette déterministe

Tester 0/N Séances, segment initial, navigation Exercices, Parcours impossible, géométrie `Créer / Filtrer / Trier`, `Trier` disabled, `Créer` ouvrant directement la création d’une Séance sans intermédiaire, archivage sans Routine sans confirmation avec snackbar `Séance archivée` + `Annuler`, annulation de cet archivage, archivage avec ≥ 1 Routine avec confirmation puis suppression des Routines et absence de snackbar d’annulation, Recherche globale `1992:10129`, retour Catégories, relaunch, 360/402/440, texte agrandi. Négatifs : écran/arbre intermédiaire après `Créer`, absence Filtrer/Trier, `Trier` actif, `Séances` en bottom nav, Parcours activable, persistance du segment Exercices après relaunch.

### 21. Traçabilité

E01–E06 → D-167/D-179/D-184/D-187 ; E67–E69 → D-168/D-178 ; Figma `2117:86`, `1992:9910`, `1992:10129`; l’ancienne frame d’arbre `3841:8375` est historique/supersédée.

---

## CE-T03-02 — Catalogue des exercices — liste, recherche, filtres et cartes

> Mise à jour 24/09/2026 : actions glissées actives = `Planifier / Dupliquer / Archiver`; dans les archives = `Supprimer`. Le média déployé fait partie du MVP.

### 1. Identification

| Propriété | Valeur |
|---|---|
| Bloc | B1 |
| États | S02–S12 |
| T03-E | E03, E07–E12, E32–E36, E58–E62, E73 |
| Frames | `3786:5093`, recherche globale `1992:10129` pour le pattern de fond Catalogue |
| Déployer | `2537:1033` |
| Navigation | `2537:214` |
| Nature | Nouvel écran T03 |

L’ancienne référence `3787:5209` n’existe plus dans l’état Figma courant du 16 septembre 2026 et n’est plus une preuve active.

### 2. Finalité fonctionnelle

Lister les `ActivityDefinition`, permettre recherche, accès aux archives, consultation/modification, affichage média déployé et lancement direct, tout en séparant surface carte, Déployer et Lecture.

### 3. Contexte d’entrée

Segment Exercices depuis Catalogue ; retour éditeur ; retour Exécution directe ; retour archives. L’état du parcours courant est restitué.

### 4. Contexte de sortie / destinations

Surface carte → `CE-T03-04`; Lecture → `CE-T03-09`; `Créer` → règle contextuelle `CE-T03-03` puis création directe `CE-T03-04`; Filtrer>Archivées → `CE-T03-05`; segment Séances → `CE-T03-01`.

### 5. Données affichées et source de vérité

Source : `ActivityDefinitionRepository` / `API-CAT-01`. Défaut : non archivées, `updatedAt DESC`. Exécuter ne modifie pas `updatedAt`. Récupération affichée seulement si présente sur la définition.

### 6. Classification des valeurs Figma

Noms, zones, séries, durées, récupération de la première carte = dynamiques/démonstration. Titre, segments, Créer, Filtrer, Trier = statiques. La première carte n’a aucune règle métier liée à sa position.

### 7. Structure de l’écran

Header → segmenté → rangée commandes Catalogue (`Créer`, `Filtrer`, `Trier`) → liste scrollable → navigation. Carte : barre bleue, contenu, zone Déployer, zone Lecture.

### 8. Éléments obligatoires

Barre de Catégorie colorée ; zone droite constante ; Déployer actif pour afficher/masquer le média ; Lecture active indépendante ; aucune poignée ; `Créer` actif ; Filtrer actif ; Trier visible disabled ; rangée commune conforme §4.5.

### 9. Layout déterministe

Rangée Catalogue : `Créer`, `Filtrer`, `Trier` visibles chacun en `108 × 32 pt`, gap `8 pt`, ensemble centré dans la référence `402 pt`, avec même représentation que Catalogue des séances. Déployer et Lecture sont ancrés selon Figma/DSF avec même largeur utile pour toutes les cartes. Cartes peuvent croître verticalement si texte. Les panneaux ouverts de `Filtrer` suivent les frames Figma courantes ; `Trier` reste disabled T03.

### 10. Responsive, Safe Areas, texte, scroll et clavier

§4.2. Liste et cartes prennent largeur utile. Recherche gère clavier sans masquer le contexte nécessaire ; le pattern `1992:10129` montre la rangée Catalogue conservée en arrière-plan. Cibles ≥48 même pour les commandes visuelles hautes de 32 pt. Texte long peut passer sur plusieurs lignes selon DSF.

### 11. États de l’écran

Liste active ; vide ; recherche ; filtre étendu `Aucun` ; filtre contextuel appliqué ; Archives appliqué ; Trier visible disabled ; carte en swipe ; carte média déployée ; retour restauré ; relaunch sans filtre.

### 12. Contrôles et interactions

Surface carte = ouvrir/modifier. Lecture = direct execution. Déployer = afficher/masquer le média associé. Filtrer = ouvre les options contextuelles validées pour le Catalogue courant ; `Archivées` reste un critère disponible lorsque pertinent. Trier = aucun événement. `Créer` ouvre directement la création d’une Activité persistante.

### 13. Gestes

Swipe selon §4.7. Aucun appui long/drag de carte Catalogue. Tap Déployer alterne l’état média condensé/déployé.

### 14. Validation

Lecture seulement si définition exécutable. Filtrer>Archivées ne modifie aucune donnée. Trier reste désactivé quel que soit l’état de liste.

### 15. Brouillon et persistance

Recherche/filtre/scroll = état UI mémoire du parcours. Aucun stockage persistant après relaunch. Aucun tri utilisateur persisté.

### 16. Navigation et conservation d’état

Édition/Execution/Archives puis retour : restaurer recherche, filtre, tri implicite et scroll. Relaunch : perdre état et revenir globalement Séances.

### 17. Erreurs et cas limites

Définition supprimée entre rendu et action : rafraîchir et indiquer indisponibilité. Filtre Archives sans résultat = état vide Archives, pas retour automatique aux actives.

### 18. Accessibilité

Carte : `Ouvrir l’activité <nom>` ; Lecture : `Exécuter l’activité <nom>` ; Déployer annonce l’état condensé/déployé ; Filtrer expose son état ; Trier reste disabled/non déclenchable par technologie d’assistance ; commandes de la rangée conservent des cibles ≥48.

### 19. Invariants

Rangée `Créer / Filtrer / Trier` conforme §4.5 ; Déployer actif pour le média ; Lecture indépendante ; aucune poignée ; Filtrer utilise les options contextuelles validées ; Trier disabled ; tri effectif `updatedAt DESC`.

### 20. Recette déterministe

0/N cartes ; récupération 0/>0 ; géométrie rangée ; surface/Lecture/Déployer ; média condensé/déployé ; Filtrer contextuel ; Trier sans action ; recherche ; swipe `Planifier / Dupliquer / Archiver` sur actives et `Supprimer` dans archives ; retour état ; relaunch sans filtre ; responsive.

### 21. Traçabilité

E03/E07–E12 → D-167/D-168/D-169/D-184 ; E32–E36 → D-173 ; E58–E62 → D-175 ; Figma `3786:5093`, pattern recherche `1992:10129`; `API-CAT-01`.



---

## CE-T03-03 — Catalogue — action `Créer` contextuelle

### 1. Identification

Bloc B1 ; T03-E E19–E21, E72 ; action contextuelle partagée entre Catalogues. Les anciennes frames `3787:5148` et `3841:8375` décrivent l’écran intermédiaire supprimé et sont conservées uniquement comme évidences historiques.

### 2. Finalité fonctionnelle

Ouvrir directement la création de l’objet correspondant au Catalogue courant, sans écran ni arbre intermédiaire.

### 3. Contexte d’entrée

Tap `Créer` depuis le Catalogue courant. Le type de Catalogue affiché détermine la destination.

### 4. Contexte de sortie / destinations

- Catalogue `Exercices` → `CE-T03-04` en création ;
- Catalogue `Séances` → parcours de création d’une Séance ;
- Catalogue `Parcours` → parcours de création d’un Parcours lorsque ce Catalogue devient fonctionnel.

Dans T03/MVP, `Parcours` reste désactivé : cette règle n’active ni le Catalogue ni la création de Parcours.

### 5. Données affichées et source de vérité

Aucun écran intermédiaire et aucune donnée métier intermédiaire. La destination est dérivée du type de Catalogue courant.

### 6. Classification des valeurs Figma

`Créer` est un libellé statique obligatoire. Les anciennes valeurs de l’arbre `Une nouvelle activité / Une séance / Un parcours / Annuler` ne sont plus des contrôles de l’interface des Catalogues.

### 7. Structure de l’écran

Aucune structure d’écran supplémentaire : le tap sur `Créer` déclenche directement la navigation vers le parcours de création correspondant.

### 8. Éléments obligatoires

Le bouton `Créer` reste dans la rangée commune `Créer / Filtrer / Trier`. Aucun scrim, aucune liste d’options et aucun bouton `Annuler` intermédiaire ne sont affichés.

### 9. Layout déterministe

La géométrie de la rangée Catalogue reste celle de §4.5. La suppression de l’écran intermédiaire ne modifie pas les dimensions ni l’alignement du bouton `Créer`.

### 10. Responsive, Safe Areas, texte, scroll et clavier

Appliquer les règles du Catalogue courant. Aucun layout responsive propre à un écran intermédiaire n’existe.

### 11. États de l’écran

Action disponible depuis les Catalogues actifs. Dans T03 : `Exercices` et `Séances` ; `Parcours` reste disabled.

### 12. Contrôles et interactions

Un tap sur `Créer` produit une navigation directe. Aucun second choix utilisateur n’est demandé avant d’entrer dans le parcours de création.

### 13. Gestes

Tap simple sur `Créer`. Aucun geste ou scrim intermédiaire.

### 14. Validation

Aucune validation métier avant l’entrée dans le parcours de création. Les validations propres à l’objet créé restent dans son écran de création.

### 15. Brouillon et persistance

Le brouillon du nouvel objet peut être initialisé au déclenchement du parcours de création. Aucune donnée persistée n’est créée par le seul tap sur `Créer`.

### 16. Navigation et conservation d’état

Le retour depuis le parcours de création suit le contrat du Catalogue d’origine et restaure son contexte lorsque ce comportement est prévu. Aucun état d’arbre intermédiaire n’est conservé.

### 17. Erreurs et cas limites

Si le parcours cible ne peut pas être initialisé, aucune donnée partielle n’est persistée et le Catalogue d’origine reste utilisable.

### 18. Accessibilité

`Créer` expose son rôle de bouton et un libellé accessible. La navigation directe supprime tout ordre de focus propre à l’ancien arbre.

### 19. Invariants

Destination déterminée par le Catalogue courant ; aucun écran/arbre intermédiaire ; aucun choix transversal d’un autre type d’objet ; Parcours non activés par cette règle en T03.

### 20. Recette déterministe

Depuis `Exercices`, tap `Créer` → éditeur ActivityDefinition en création. Depuis `Séances`, tap `Créer` → création de Séance. Vérifier l’absence totale de l’ancien arbre. Négatifs : apparition de `Une nouvelle activité / Une séance / Un parcours / Annuler`, création d’un type différent du Catalogue courant, activation implicite de Parcours.

### 21. Traçabilité

E19–E21/E72 → D-187, D-167, D-183 ; anciennes frames `3787:5148` et `3841:8375` = historiques/supersédées ; aucune API d’écriture supplémentaire.

---

# 6. B2 — CRUD et cycle de vie ActivityDefinition

## CE-T03-04 — Éditeur ActivityDefinition — créer / modifier

### 1. Identification

Bloc B2 ; états S18–S27 ; T03-E E12–E14, E30, E41, E50–E57, E71 ; références courantes `4217:6980` (création, paramètres repliés), `4279:7044` (paramètres dépliés), `4734:6342` (modification), `4332:7095` (roulette Durée), modèles de paramètres `4367:7128`, `4367:7276`, `4367:7906`, `4367:8052`, `4367:8193`, `4490:6757`, `4490:6903`, sélection Catégorie `4474:7157`, Zones corporelles `4478:7209` et création de zone `4683:6336`.

### 2. Finalité fonctionnelle

Créer/modifier une définition persistante complète, en réutilisant l’éditeur d’Activité et les règles de calcul existantes. L’éditeur courant n’expose plus de bouton `Ajouter un média` ; la zone Média reste affichable selon les données et le rendu Figma courant.

### 3. Contexte d’entrée

Création depuis CE-T03-03 ou modification depuis CE-T03-02. Création = nouveau brouillon ; modification = copie de travail de la définition existante.

### 4. Contexte de sortie / destinations

`Terminer` valide/persiste puis retourne CE-T03-02 avec état Catalogue restauré. Retour/abandon suit décision de modifications non enregistrées existante.

### 5. Données affichées et source de vérité

Nom, Description, Catégorie, Zones corporelles, mode, cible, Séries, Pause, Récupération, `Changement de côté`, Durée totale, Compte à rebours d’Activité, Fin d’activité et données média affichables. Source = brouillon ; persistance seulement à validation.

### 6. Classification des valeurs Figma

Noms, zones et valeurs numériques = dynamiques/démonstration. **`Renforcement du genou` est une `VALEUR DE DÉMONSTRATION FIGMA` du nom d’Activité** dans les états renseignés et ne doit jamais être codée en dur. `Nom de l’activité` est l’état vide/placeholder visible dans `3943:6064`. Titres, modes, Séries, Pause, Récupération, libellés de Durée totale et Terminer = statiques.

### 7. Structure de l’écran

Nom → accès Catégorie / Zones corporelles → paramètres Séries/cible/Pause → deuxième rangée Changement de côté/Récupération/Durée totale → zone Média → Synthèse fixe → Terminer.

### 8. Éléments obligatoires

Mode 3 options égales ; Durée totale visible tous modes ; en mode Durée le contrôle porte `Durée totale`; en Répétitions/À l’échec le contrôle porte **`Durée totale >=`** ; la Synthèse conserve la formulation **`Durée totale : ≥ {durée connue}`** ; nom en gras dans Synthèse uniquement ; accès `Catégorie` et `Zones corporelles` distincts ; zone Média conforme au Figma courant et placée sous la Synthèse en cas de chevauchement ; contrôle Changement de côté avec `Aucun / D→G / G→D` au niveau Activité uniquement ; roulettes en modale basse Annuler/Confirmer.

### 9. Layout déterministe

DSF/grilles sans compensation locale. En Répétitions/À l’échec, `Durée totale >=` est le troisième élément de la deuxième rangée, après `Changement de côté` puis `Récupération`, conformément aux frames `3561:4695`, `3561:7673`, `3561:7802`. Centrer nombre répétitions ; sélection Mode coïncide avec contrôle externe. La valeur Figma `5 min 30 s`, lorsqu’elle apparaît, est illustrative et ne devient pas une valeur métier par défaut.

### 10. Responsive, Safe Areas, texte, scroll et clavier

Références 360/402/440. Formulaire scrollable ; synthèse/action restent accessibles ; clavier ne masque pas champ. Texte agrandi ne chevauche pas contrôles.

### 11. États de l’écran

Création/modification ; état vide avec `Nom de l’activité` ; états renseignés avec nom métier ; DURATION/REPS/FAILURE ; `Aucun` / `D→G` / `G→D` ; roulettes ouvertes ; Séries pilote ; Durée totale pilote ; message ajustement ; Description/Zone ouverts. ; sélection Zones corporelles ; création inline d’une Zone avec clavier.

### 12. Contrôles et interactions

Tous les champs modifient le brouillon. Le champ Nom affiche la donnée du brouillon et non un libellé de démonstration. Roulettes selon §4.6. `Terminer` est actif seulement si le brouillon est valide. Aucun bouton `Ajouter un média` n’est exposé dans l’éditeur courant. La modale `Zones corporelles` permet la sélection multiple et la création inline d’une nouvelle Zone ; la frame `4683:6336` matérialise l’état de saisie avec clavier. Le référentiel autorise aussi le renommage et la suppression d’une Zone ; ces deux opérations sont fonctionnellement requises mais ne disposent pas de frame dédiée dans le Prototype MVP.

### 13. Gestes

Tap, scroll, saisie ; pas de swipe métier ; haptique roulette par cran selon décision existante.

### 14. Validation

Nom requis ; mode valide ; cible selon mode ; Séries 1..99 ; Pause/Récupération ≥0 ; FAILURE sans cible chiffrée ; calculs D-155/D-156. Le signe `>=` du libellé UI n’ajoute aucune nouvelle règle de calcul : il rend visible la borne déjà définie. Une nouvelle Zone corporelle exige un nom non vide et unique ; un renommage conserve l’identifiant ; une suppression utilisée demande confirmation et ne modifie pas l’historique.

### 15. Brouillon et persistance

Création persiste ActivityDefinition à Terminer uniquement. Modification atomique. Annuler roulette ne change pas dernière valeur confirmée.

### 16. Navigation et conservation d’état

Succès → Catalogue exercices restauré. Aucun SessionActivity créé dans ce contexte.

### 17. Erreurs et cas limites

Échec persistance : rester éditeur, conserver brouillon, réactiver action, aucune écriture partielle. Définition supprimée en parallèle : erreur explicite, pas de recréation implicite.

### 18. Accessibilité

Modes selected ; contrôles disabled annoncés ; wheel bloque focus arrière-plan ; unités annoncées ; CTA arrière inaccessible pendant wheel. Le libellé accessible de la borne doit conserver la sémantique « durée totale supérieure ou égale à la durée connue » même si le visuel affiche `>=`.

### 19. Invariants

Aucun média fonctionnel ; nom gras Synthèse ; `Renforcement du genou` jamais statique ; `Nom de l’activité` réservé à l’état vide/placeholder représenté ; Durée totale toujours visible ; contrôle Reps/Échec = `Durée totale >=` ; Synthèse Reps/Échec = `Durée totale : ≥ {durée connue}` ; pas de nouvelle formule bilatérale ; ActivityDefinition distincte d’une SessionActivity.

### 20. Recette déterministe

Créer/éditer trois modes, trois sideModes, état vide vs renseigné, vérifier absence de nom démo codé en dur, vérifier `Durée totale` en Durée et `Durée totale >=` en Reps/Échec, vérifier Synthèse `Durée totale : ≥ …`, roues Annuler/Confirmer, calculs, échec DB, abandon, responsive, texte agrandi. Négatifs : `Renforcement du genou` statique, `Nom de l’activité` sur état renseigné, Durée totale masquée, libellé Reps/Échec sans `>=`, CTA wheel activable, média fonctionnel, nom non gras Synthèse.

### 21. Traçabilité

E12–E14/E30 → D-169/D-171 ; E41 → D-143..156 ; E50–E57 → D-174/D-181/D-182 ; API-ACT-REF/API-ACT ; Figma `3561:4695`, `3561:7673`, `3561:7802`, `3943:6064` et autres frames citées.

---

## CE-T03-05 — ActivityDefinition — archiver / restaurer / supprimer

### 1. Identification

Bloc B2 ; états S28–S33 ; T03-E E15–E18, E58–E62 ; pattern visuel de référence Séances `1992:10749`, `2234:88`, `1992:10848`, `2234:189`; aucun frame Activity-archives dédié actuellement.

### 2. Finalité fonctionnelle

Gérer le cycle de vie d’une définition persistante : archiver depuis active, puis restaurer ou supprimer définitivement depuis Archives, sans cascade.

### 3. Contexte d’entrée

Archiver : action contextuelle sur carte active. Archives : `Filtrer > Archivées` depuis CE-T03-02. Restaurer/Supprimer : depuis carte archivée.

### 4. Contexte de sortie / destinations

Archiver → reste Catalogue actif avec carte retirée ; Restaurer → reste vue Archives, carte retirée après succès ; Supprimer confirmé → reste Archives recalculées.

### 5. Données affichées et source de vérité

ActivityDefinition + statut/archivedAt éventuel. Copies Session et historique ne pilotent pas la carte.

### 6. Classification des valeurs Figma

Nom/paramètres = dynamiques. Libellés Archiver/Restaurer/Supprimer/confirmation = statiques. Valeurs des Séances du pattern = démonstration et ne doivent pas être reprises.

### 7. Structure de l’écran

Vue Catalogue filtrée Archives ; cartes de définitions archivées ; actions cycle de vie ; confirmation destructive. Le panneau détaillé Filtrer reste visuellement non vérifiable.

### 8. Éléments obligatoires

Accès Archives via Filtrer ; Restaurer ; Supprimer uniquement depuis Archives ; confirmation avant suppression définitive ; feedback succès selon pattern commun.

### 9. Layout déterministe

Réutiliser composants partagés des archives Séances lorsque génériques. Aucun nouveau design local du panneau Filtrer. Cartes restent dans grille Catalogue.

### 10. Responsive, Safe Areas, texte, scroll et clavier

360/402/440 ; cibles ≥48 ; liste scrollable ; aucun clavier sauf recherche si utilisée conjointement.

### 11. États de l’écran

Active ; swipe Archiver ; Archives avec N ; Archives vide ; Restaurer succès ; confirmation Supprimer ; suppression succès ; erreur écriture.

### 12. Contrôles et interactions

Filtrer ouvre Archives ; Archiver/Restaurer exécutent action atomique ; Supprimer demande confirmation ; Trier demeure disabled même dans Archives.

### 13. Gestes

Swipe selon §4.7. Actions accessibles par tap. Aucun drag.

### 14. Validation

Supprimer autorisé seulement si archivée. Restaurer seulement si archivée. Archiver seulement si active.

### 15. Brouillon et persistance

Actions écrivent immédiatement de façon atomique après confirmation requise. Filtre Archives n’est qu’état UI. Suppression ne cascade pas.

### 16. Navigation et conservation d’état

Filtre Archives et scroll conservés pendant la session courante. Après restaurer/supprimer, rester Archives. Au relaunch, le filtre revient à `Aucun`.

### 17. Erreurs et cas limites

Échec écriture : ne pas masquer carte ; état visuel reflète stockage. Dernière archive supprimée/restaurée → état vide Archives. Définition déjà modifiée/supprimée → rafraîchir.

### 18. Accessibilité

Actions nommées ; Supprimer annoncé destructif ; dialogue focusé ; filtre Archives annoncé actif ; équivalents aux gestes disponibles.

### 19. Invariants

Suppression seulement Archives ; aucune suppression de SessionActivity, snapshot, Result ou Execution ; accès Archives via Filtrer ; Trier disabled.

### 20. Recette déterministe

Archiver → disparition active ; Filtrer>Archivées ; Restaurer ; Supprimer/Annuler/Confirmer ; vérifier copies/historique ; erreur DB ; Archives vide ; responsive. Négatifs : suppression directe active, cascade, navigation Archives distincte du filtre.

### 21. Traçabilité

E15–E18 → D-169/D-184 ; E58–E62 → D-175 ; modèle 09 ; API-ACT-REF/API-CAT-01 ; pattern Figma Séances cité.

---

# 7. B3/B4 — Ajout depuis Composition et sélection multiple

## CE-T03-06 — Composition — `Ajouter une activité` vers le Catalogue

### 1. Identification

Bloc B3 ; parcours courant de Composition ; frame cible `3789:5349`. Les anciennes frames d’arbre `3788:5258` et `3933:5780` sont historiques/supersédées et ne constituent plus une cible d’implémentation.

### 2. Finalité fonctionnelle

Ouvrir directement la sélection des Exercices persistantes du Catalogue depuis la Composition, sans arbre intermédiaire.

### 3. Contexte d’entrée

Tap `+ Ajouter une activité` dans la Composition.

### 4. Contexte de sortie / destinations

Ouverture directe de CE-T03-07 ; `Annuler` dans CE-T03-07 restitue la Composition inchangée.

### 5. Données affichées et source de vérité

Aucune donnée métier n’est créée à l’ouverture. Le brouillon de Composition existant est conservé.

### 6. Classification des valeurs Figma

Les anciennes options `Une nouvelle activité / Une activité existante / Annuler` appartiennent à des frames historiques et ne sont plus des contrôles du parcours courant.

### 7. Structure de l’écran

Aucun écran intermédiaire : transition directe de la Composition vers la sélection Catalogue.

### 8. Éléments obligatoires

Action `Ajouter une activité` dans la Composition ; écran de sélection CE-T03-07.

### 9. Layout déterministe

Aucun layout d’arbre contextuel à implémenter.

### 10. Responsive, Safe Areas, texte, scroll et clavier

Conforme à la Composition puis à CE-T03-07.

### 11. États de l’écran

Composition → sélection Catalogue → retour/validation.

### 12. Contrôles et interactions

Le tap ouvre CE-T03-07. Aucun choix préalable n’est demandé.

### 13. Gestes

Tap sur `Ajouter une activité`.

### 14. Validation

La validation métier est portée par CE-T03-07 ; aucune mutation à l’ouverture.

### 15. Brouillon et persistance

Le brouillon de Composition est conservé. La capacité existante de création directe d’une `SessionActivity` locale reste fonctionnellement et techniquement conservée mais n’est pas exposée dans cet enchaînement.

### 16. Navigation et conservation d’état

`Annuler` depuis CE-T03-07 restitue Composition et scroll ; valider insère les copies puis revient à la Composition.

### 17. Erreurs et cas limites

Échec d’ouverture du Catalogue → Composition inchangée.

### 18. Accessibilité

`Ajouter une activité` annonce l’ouverture de la sélection d’Exercices.

### 19. Invariants

Aucun arbre intermédiaire ; aucune suppression du mécanisme technique de `SessionActivity` locale.

### 20. Recette déterministe

Vérifier l’ouverture directe de CE-T03-07 et l’absence de l’ancien arbre.

### 21. Traçabilité

D-194 ; Figma `3789:5349` ; anciennes frames `3788:5258` / `3933:5780` historiques ; API-COMP-SEL.

---

## CE-T03-07 — Sélection multiple d’Exercices existantes

### 1. Identification

Bloc B4 ; états S47–S54 ; T03-E E25–E31 ; frames `3789:5349`, `3789:5405`; preuve `ecran-14-selection-activites-existantes.png`.

### 2. Finalité fonctionnelle

Sélectionner 0..N ActivityDefinition et insérer des copies indépendantes dans l’ordre courant de la liste filtrée, jamais dans l’ordre des touchers.

### 3. Contexte d’entrée

Ouverture directe depuis `Ajouter une activité` dans CE-T03-06.

### 4. Contexte de sortie / destinations

Annuler → Composition sans mutation. Valider N>0 → insertion atomique puis CE-T03-08.

### 5. Données affichées et source de vérité

Liste ActivityDefinition actives ; sélection = Set d’IDs en mémoire ; ordre final recalculé depuis liste visible filtrée au moment de validation.

### 6. Classification des valeurs Figma

Noms/paramètres = dynamiques. Compteur = calculé. Libellés/actions = statiques. Exemples = démonstration.

### 7. Structure de l’écran

Modale/liste, recherche, éventuels filtres déjà définis pour ce contexte, indicateurs de sélection, compteur, Annuler/Valider.

### 8. Éléments obligatoires

Check vectoriel canonique ; compteur ; validation disabled à 0 ; état sélectionné ; Annuler.

### 9. Layout déterministe

Liste scrollable ; action de validation accessible ; aucun chevauchement. Ne pas inventer de réordonnancement.

### 10. Responsive, Safe Areas, texte, scroll et clavier

360/402/440 ; clavier de recherche ne masque pas validation ; lignes s’étendent pour texte ; scroll indépendant.

### 11. États de l’écran

0 sélection ; 1 ; N ; recherche ; liste filtrée ; Valider disabled/active ; retour après validation.

### 12. Contrôles et interactions

Tap ligne toggle ; recherche/filtre conserve IDs ; Valider = une seule soumission ; Annuler = zéro mutation.

### 13. Gestes

Tap et scroll uniquement. Aucun drag/reorder.

### 14. Validation

0 = disabled. N>0 = active. Avant insertion, ordonner IDs selon liste visible courante.

### 15. Brouillon et persistance

Aucune SessionActivity avant validation. Insertion groupée atomique : toutes ou aucune.

### 16. Navigation et conservation d’état

Succès → Composition enrichie, même contexte/scroll autant que possible. Annuler → exact état antérieur.

### 17. Erreurs et cas limites

Définition supprimée entre sélection et validation : la retirer/recalculer, empêcher copie fantôme, informer. Échec d’une copie → rollback total.

### 18. Accessibilité

Ligne annonce selected/non selected ; compteur lisible ; Valider disabled annoncé ; zone check ≥ cible accessible.

### 19. Invariants

Ordre liste filtrée, pas ordre tap ; copies indépendantes ; aucune synchronisation future ; validation vide impossible.

### 20. Recette déterministe

Sélection B puis A alors que liste A/B → insertion A/B ; recherche/filtre avec sélection conservée ; 0 sélection ; rollback ; modifier source puis copie. Négatif : ordre taps, insertion partielle, lien dynamique.

### 21. Traçabilité

E25–E31 → D-165/D-171 ; 09 ; `API-COMP-SEL-01..03`; Figma `3789:5349`, `3789:5405`.


---

## CE-T03-08 — Composition après insertion et corrections UX

> Mise à jour 24/09/2026 : le parcours exposé sélectionne les Exercices dans le Catalogue ; la capacité de création locale à la Séance reste conservée mais n’est pas proposée dans cet enchaînement. La Composition accepte aussi le Point d’arrêt, ainsi que les Compte à rebours / Fin propres aux Exercices.

### 1. Identification

Bloc B3/B9 ; états S37–S46 ; T03-E E31, E53, E58–E66 ; frames `2028:11700`, `2028:11808`, appui long `3518:4576`.

### 2. Finalité fonctionnelle

Afficher les copies insérées et appliquer directions courtes, swipe réel, gap Dupliquer et non-déplaçabilité des cartes structurelles.

### 3. Contexte d’entrée

Retour création SessionActivity, retour CE-T03-07 ou ouverture d’une Composition existante.

### 4. Contexte de sortie / destinations

Tap Activity → éditeur ; long press Activity → déplacement ; swipe → actions ; Continuer → Catégories.

### 5. Données affichées et source de vérité

Draft Session. Direction propre de l’Activité : D→G/G→D ; rien avec `Aucun`. Aucun changement de côté n’est exposé au niveau Tour.

### 6. Classification des valeurs Figma

Noms/paramètres = dynamiques ; titres structurels = statiques ; positions de cartes d’exemple = démonstration.

### 7. Structure de l’écran

CR initial → exercices / Points d’arrêt avant Tour → Tour → exercices / Points d’arrêt après Tour → Fin séance. Actions contextualisées derrière Activity.

### 8. Éléments obligatoires

CR/Fin sans poignée ; Dupliquer arrondi ; gap fond Tour ; indicateur de direction propre sur les cartes Activité ; aucun contrôle de changement de côté exposé au niveau Tour.

### 9. Layout déterministe

Frame `2028:11808` pour swipe : portion visible de carte, gap, action Dupliquer. Aucun overlay immobile. Activity+Recovery = bloc cohérent.

### 10. Responsive, Safe Areas, texte, scroll et clavier

360/402/440 ; scroll Composition ; actions contextuelles restent accessibles ; pas de clavier sauf champs de contexte déjà définis.

### 11. États de l’écran

Normal ; D→G ; G→D ; swipe progressif ; swipe ouvert ; drag Activity ; roue CR ; roue Fin.

### 12. Contrôles et interactions

Activity tap/long press/swipe. CR/Fin : réglage uniquement, jamais déplacement. Roulettes §4.6.

### 13. Gestes

Swipe §4.7 ; long press seulement Activity ; drag avec drop valide ; aucun long press CR/Fin.

### 14. Validation

Continuer dépend validité Composition. Drop invalide n’écrit rien. Actions contextuelles n’agissent qu’après sélection explicite.

### 15. Brouillon et persistance

Réordre au drop ; duplication indépendante ; roues confirmées seulement ; aucun effet swipe seul.

### 16. Navigation et conservation d’état

Retour sous-parcours conserve draft et scroll. Continuer → Catégories via transition canonique.

### 17. Erreurs et cas limites

Swipe sous seuil → fermé ; drop invalide → position d’origine ; erreur duplication → aucun duplicat partiel.

### 18. Accessibilité

CR/Fin n’exposent pas Déplacer ; direction accessible développée ; actions de swipe ont équivalents accessibles ; focus cohérent.

### 19. Invariants

CR/Fin non déplaçables ; une seule carte swipe ouverte ; pas de texte développé direction dans carte ; gap Tour visible.

### 20. Recette déterministe

Drag Activity oui ; CR/Fin non ; swipe progressif/ouvert/fermeture droite ; tap fond sans effet ; Dupliquer gap/rayon ; directions ; roues ; responsive. Négatifs : poignée structurelle, overlay immobile, tap fond ferme contexte.

### 21. Traçabilité

E53 → D-154/D-182 ; E58–E63 → D-175/D-176 ; E64–E66 → D-177 ; Figma `2028:11700`, `2028:11808`, `3518:4576`.


---

# 8. B5 — Exécution directe

## CE-T03-09 — Lancement direct et préparation fixe 5 s

### 1. Identification

Bloc B5 ; état S55 ; T03-E E32, E37–E39, E42 ; source Catalogue `3786:5093`; preuve `ecran-16-preparation-directe-5-s.png`; Shell Execution partagé.

### 2. Finalité fonctionnelle

Lancer une Exécution `ACTIVITY` autonome depuis Lecture, avec snapshot immuable et préparation système fixe 5 s.

### 3. Contexte d’entrée

Tap Lecture sur ActivityDefinition valide dans CE-T03-02.

### 4. Contexte de sortie / destinations

Fin préparation → CE-T03-10/11/12 selon mode/direction. Échec initialisation → Catalogue.

### 5. Données affichées et source de vérité

Snapshot ActivityDefinition, nom, préparation 5. `preparation=5` est règle système, pas propriété de la définition.

### 6. Classification des valeurs Figma

Nom = dynamique ; 5 s = règle statique système ; autres exemples = démonstration.

### 7. Structure de l’écran

Shell Execution ; zone nom/contexte ; compte à rebours préparation ; aucun Tour/Cycle/Séance.

### 8. Éléments obligatoires

Préparation 5 ; nom Activity ; aucune notion SESSION_END ; commandes seulement si prévues par Shell direct.

### 9. Layout déterministe

Réutiliser Shell existant, ne pas créer un écran Session factice. Le compte à rebours reste dans zone centrale prévue.

### 10. Responsive, Safe Areas, texte, scroll et clavier

360/402/440 ; pas de scroll/clavier ; texte centré non tronqué ; Safe Area Shell.

### 11. États de l’écran

Initial 5 ; 4..1 ; 0/transit ; erreur initialisation.

### 12. Contrôles et interactions

Aucune action ne crée une Session. Les commandes présentes suivent moteur commun uniquement.

### 13. Gestes

Tap sur commandes explicites seulement ; aucun swipe Catalogue pendant Execution.

### 14. Validation

Éligibilité avant création Execution. Définition invalide → aucune Execution créée.

### 15. Brouillon et persistance

Création atomique Execution + snapshot ; origin ACTIVITY ; état Catalogue de retour mémorisé en mémoire de parcours.

### 16. Navigation et conservation d’état

Sortie finale reviendra au Catalogue avec son état. Pas de navigation vers un écran Session.

### 17. Erreurs et cas limites

Échec snapshot/persistance = pas d’Execution fantôme. Source supprimée après snapshot n’empêche pas la suite.

### 18. Accessibilité

Décompte annoncé selon guidage ; aucun label Tour/Séance ; nom accessible.

### 19. Invariants

5 s fixes ; origin ACTIVITY ; pas de Session artificielle ; pas SESSION_END.

### 20. Recette déterministe

Vérifier 5 s, snapshot, origin, source supprimée après lancement, absence Session/Tour/Cycle. Négatif : utiliser countdown Session configurable.

### 21. Traçabilité

E37–E39/E42 → D-157/D-172/D-180 ; 09 ; API-ACT-EXE-01/02.


---

## CE-T03-10 — Exécution directe — Durée unilatérale

> Standard typographique d’Exécution : contenu = Roboto Condensed ; titre supérieur et dialogues = Inter. Pour l’Exécution de Séance, le layout courant regroupe chrono circulaire, côté, cible `Sur`, Série/Tour, progression segmentée et bloc `Temps écoulé / À suivre`.

### 1. Identification

Bloc B5 ; état S56 ; T03-E E37–E43 ; Shell visuel `1992:8132` adapté ; preuve `ecran-17-execution-directe-en-cours.png`.

### 2. Finalité fonctionnelle

Exécuter une ActivityDefinition DURATION en autonomie avec Séries, Pauses et Récupération, sans orchestration Session.

### 3. Contexte d’entrée

Fin CE-T03-09 ; mode DURATION ; sideMode UNILATERAL.

### 4. Contexte de sortie / destinations

Série suivante / Pause / Récupération ; dernière phase → CE-T03-13.

### 5. Données affichées et source de vérité

Snapshot uniquement ; série courante, cible temps, temps restant, progression locale.

### 6. Classification des valeurs Figma

Nom/temps/série = dynamiques ; commandes = statiques ; exemples = démonstration.

### 7. Structure de l’écran

Shell Execution, informations Activity, timer, série, commandes moteur. Pas d’information Tour/Cycle.

### 8. Éléments obligatoires

Nom ; timer ; série si C>1 ; Pause/Récupération selon plan ; commandes pause/réinit/suivant selon moteur commun.

### 9. Layout déterministe

Réutiliser groupes visuels du Shell ; supprimer plutôt que remplacer par valeurs fictives les blocs Session-only.

### 10. Responsive, Safe Areas, texte, scroll et clavier

360/402/440 ; pas clavier ; commandes restent dans Safe Area ; pas scroll principal si Shell n’en prévoit pas.

### 11. États de l’écran

Série active ; Pause série ; Récupération ; Pause utilisateur ; reprise ; réinitialisation.

### 12. Contrôles et interactions

Pause/reprise ; réinitialiser étape ; passage anticipé chronométré avec confirmation existante ; suivi automatique timer.

### 13. Gestes

Tap commandes ; aucun geste structurel de Session.

### 14. Validation

Transitions dérivées du snapshot et plan ; source persistante n’est jamais relue pour modifier le run.

### 15. Brouillon et persistance

Résultats dans Execution ACTIVITY. Aucun SessionActivity créé/persisté par l’exécution.

### 16. Navigation et conservation d’état

Aucune sortie Session ; fin vers CE-T03-13 puis Synthèse.

### 17. Erreurs et cas limites

Background/reprise selon moteur commun ; interruption technique conserve snapshot/résultats ; source absente tolérée.

### 18. Accessibilité

Timer/commandes nommés ; aucun côté annoncé en UNILATERAL ; état pause annoncé.

### 19. Invariants

Aucun Tour/Cycle/SESSION_END ; calculs existants inchangés.

### 20. Recette déterministe

C=1/N ; Pause R=0/R>0 ; Recovery ; reset ; passage anticipé ; pause/reprise ; background. Négatifs : Tour/Cycle/SESSION_END, relecture source modifiée.

### 21. Traçabilité

E40/E43 → D-139/D-140/D-156/D-172 ; API-ACT-EXE-03 ; modèle Execution.


---

## CE-T03-11 — Exécution directe — Répétitions et À l’échec

### 1. Identification

Bloc B5 ; états S57/S58 ; T03-E E40/E43 ; Shell Execution partagé.

### 2. Finalité fonctionnelle

Exécuter REPS ou TO_FAILURE sans minuterie cible fictive, avec Suivant comme fin normale de Série.

### 3. Contexte d’entrée

Fin préparation CE-T03-09 avec mode REPS ou TO_FAILURE.

### 4. Contexte de sortie / destinations

Suivant → fin Série → Pause/Récupération/Série suivante ou CE-T03-13.

### 5. Données affichées et source de vérité

REPS : cible répétitions du snapshot. TO_FAILURE : aucune cible chiffrée. Pauses/Récupérations : durées connues snapshot.

### 6. Classification des valeurs Figma

Cibles REPS = dynamiques ; absence de cible Failure = règle métier ; exemples = démonstration.

### 7. Structure de l’écran

Shell Execution avec variante de contenu adaptée au mode, commandes communes.

### 8. Éléments obligatoires

REPS : nombre cible ; Failure : libellé mode sans nombre cible ; Série ; Suivant ; Pause/Récupération si configurées.

### 9. Layout déterministe

Même architecture visuelle que CE-T03-10 ; ne jamais combler un espace Failure par une durée ou répétition fictive.

### 10. Responsive, Safe Areas, texte, scroll et clavier

360/402/440 ; pas clavier ; labels modes non tronqués.

### 11. États de l’écran

REPS série ; FAILURE série ; Pause ; Recovery ; série suivante ; fin.

### 12. Contrôles et interactions

Suivant termine normalement Série sans confirmation anticipée ; pause/reprise/reset selon moteur.

### 13. Gestes

Tap commandes uniquement.

### 14. Validation

REPS exige cible valide snapshot ; Failure interdit cible ; aucune durée conventionnelle ajoutée.

### 15. Brouillon et persistance

Résultat Série persisté selon mode ; temps éventuellement mesuré sans devenir cible.

### 16. Navigation et conservation d’état

Enchaînement interne du plan ; fin CE-T03-13.

### 17. Erreurs et cas limites

Double tap Suivant idempotent/protégé ; reprise après interruption ne crée pas une Série supplémentaire.

### 18. Accessibilité

Mode et cible utile annoncés ; Failure n’annonce aucune cible fausse ; Suivant clairement nommé.

### 19. Invariants

Failure sans cible ; Suivant normal ; aucune confirmation chronométrée ; pas SESSION_END.

### 20. Recette déterministe

REPS/Failure C=1/N ; Pauses/Récup ; double tap ; absence confirmation ; absence durée fictive. Négatif : minuterie cible Failure ou cible répétitions Failure.

### 21. Traçabilité

D-111/D-139/D-172 ; API-ACT-EXE ; règles mode chapitre 10.

---

## CE-T03-12 — Exécution directe — bilatéralité, Pauses, Récupération

### 1. Identification

Bloc B5 ; états S59–S62 ; T03-E E40–E41 ; Shell Execution ; sous-titre côté validé D-149.

### 2. Finalité fonctionnelle

Exécuter RIGHT_LEFT ou LEFT_RIGHT exactement selon règles existantes : toutes Séries premier côté, puis toutes second, Récupération une fois après tous les côtés d’une Activité autonome.

### 3. Contexte d’entrée

Après préparation d’un snapshot bilatéral.

### 4. Contexte de sortie / destinations

Séries/Pauses premier côté → second côté → Séries/Pauses second → Récupération éventuelle → CE-T03-13.

### 5. Données affichées et source de vérité

sideMode snapshot ; executionSide RIGHT/LEFT ; résultats séparés par côté.

### 6. Classification des valeurs Figma

`Côté droit/gauche` = libellés calculés ; ordre vient sideMode, jamais de la frame d’exemple.

### 7. Structure de l’écran

Shell Execution + nom + sous-titre côté + information Série/mode + commandes.

### 8. Éléments obligatoires

Sous-titre côté ; aucun `1/2`/`2/2`; même rang logique Activity entre côtés ; Pause selon Séries ; Récupération finale autonome.

### 9. Layout déterministe

Sous-titre côté sous nom, centré selon Shell. Ne pas ajouter un bloc latéral ou une nouvelle jauge.

### 10. Responsive, Safe Areas, texte, scroll et clavier

360/402/440 ; sous-titre reste lisible ; aucune collision avec titre ou timer.

### 11. États de l’écran

Premier côté ; Pause intra-côté ; second côté ; Partial side ; Recovery finale ; fin.

### 12. Contrôles et interactions

Réinitialiser = côté courant seulement ; passage anticipé premier côté selon D-150 conserve partiel puis ouvre second ; commandes communes.

### 13. Gestes

Tap commandes uniquement.

### 14. Validation

Aucune Pause ajoutée entre côtés. Ordre sideMode strict. Recovery après second côté pour Activité autonome.

### 15. Brouillon et persistance

Résultats séparés par executionSide ; réinitialisation ne détruit pas résultat autre côté.

### 16. Navigation et conservation d’état

Transitions internes au plan ; aucun écran intermédiaire Session.

### 17. Erreurs et cas limites

Interruption entre côtés ; reprise sur bon side ; side result déjà finalisé ne doit pas être dupliqué.

### 18. Accessibilité

Annonce vocale côté au début et au changement selon règles ; label accessible développé même si UI courte ailleurs.

### 19. Invariants

Toutes Séries d’un côté avant autre ; pas alternance série par série ; pas Pause inter-côté ajoutée ; Recovery autonome une fois après second.

### 20. Recette déterministe

D→G/G→D, C=1/N, R=0/>0, skip premier côté, reset second, interruption/reprise, résultats historiques. Négatifs : alternance, Recovery par côté autonome, Pause artificielle entre côtés.

### 21. Traçabilité

E41 → D-143..D-150/D-156/D-172 ; API-SIDE/API-ACT-EXE ; executionSide modèle 09.

---

## CE-T03-13 — Fin, interruption et retour d’Exécution directe

### 1. Identification

Bloc B5 ; états S63–S65 ; T03-E E43, E44, E49.

### 2. Finalité fonctionnelle

Clore l’Execution ACTIVITY immédiatement après sa dernière phase métier et ouvrir la Synthèse, sans SESSION_END.

### 3. Contexte d’entrée

Dernière Série ou Récupération terminée ; arrêt volontaire ; interruption technique.

### 4. Contexte de sortie / destinations

Fin normale → signal → CE-T03-14 ; arrêt volontaire confirmé → Execution Interrompue puis Synthèse selon règle ; interruption technique peut rester sans Synthèse si règle existante.

### 5. Données affichées et source de vérité

Statut, temps, résultats depuis Execution/snapshot. Aucun objet Session.

### 6. Classification des valeurs Figma

Statut/temps = dynamiques ; libellés confirmation = statiques ; aucune valeur de fin de Séance applicable.

### 7. Structure de l’écran

Commandes/modales communes d’arrêt si utilisées ; transition de fin ; aucun composant SESSION_END.

### 8. Éléments obligatoires

Signal de fin ; persistance statut ; destination Synthèse si applicable ; mécanisme de reprise technique existant.

### 9. Layout déterministe

Réutiliser composants communs. Ne pas ajouter carte/phase Fin de séance.

### 10. Responsive, Safe Areas, texte, scroll et clavier

Selon Shell Execution et dialogue commun ; 360/402/440.

### 11. États de l’écran

Fin normale ; arrêt volontaire avant confirmation ; arrêt confirmé ; interruption technique ; reprise.

### 12. Contrôles et interactions

Arrêt uniquement selon règles moteur communes ; confirmation existante ; aucune action SESSION_END.

### 13. Gestes

Tap commandes/dialogue ; aucun swipe métier.

### 14. Validation

Finalisation seulement après état cohérent des résultats ; double finalisation interdite/idempotente.

### 15. Brouillon et persistance

Sauvegarder Execution/results avant navigation ; ne pas perdre résultats en cas d’erreur transition.

### 16. Navigation et conservation d’état

Synthèse puis Terminer → Catalogue exercices avec état aller-retour. Relaunch ultérieur ne restaure pas ce contexte UI.

### 17. Erreurs et cas limites

Échec finalisation → rester état récupérable ; crash après persistance avant navigation → reprise sans nouvelle Execution.

### 18. Accessibilité

Signal de fin non uniquement sonore ; dialogues lisibles ; focus sur décision.

### 19. Invariants

Aucun SESSION_END ; aucun Session count ; origin ACTIVITY intact.

### 20. Recette déterministe

Fin avec/sans Recovery, arrêt, interruption, idempotence, retour état Catalogue, relaunch. Négatif : création phase SESSION_END ou Session artificielle.

### 21. Traçabilité

E43/E44/E49 → D-158..D-163/D-172 ; API-ACT-EXE-04/05 ; modèle Execution.

---

# 9. B6 — Synthèse Activité

## CE-T03-14 — Synthèse d’Exécution directe

### 1. Identification

Bloc B6 ; états S66–S70 ; T03-E E44–E46, E49 ; frames structure `1992:8718`, `1992:8780`; preuves `CE-ACT-EXE-04/05`.

### 2. Finalité fonctionnelle

Collecter Ressenti obligatoire et Commentaire facultatif avant finalisation UI et retour Catalogue.

### 3. Contexte d’entrée

Fin normale ou arrêt volontaire donnant lieu à Synthèse.

### 4. Contexte de sortie / destinations

Terminer, après Ressenti, sauvegarde puis CE-T03-02 restauré.

### 5. Données affichées et source de vérité

Snapshot/results ACTIVITY ; Ressenti draft ; Commentaire 0..200.

### 6. Classification des valeurs Figma

Nom/durée/résultats = dynamiques ; options Ressenti = statiques ; commentaire exemple = démonstration.

### 7. Structure de l’écran

Shell Summary ; résumé Execution ; choix Ressenti ; Commentaire ; CTA Terminer.

### 8. Éléments obligatoires

Type/nom Activity ; données pertinentes uniquement ; Ressenti ; Commentaire ; Terminer disabled/active selon validation.

### 9. Layout déterministe

Réutiliser disposition Summary ; supprimer blocs Session-only plutôt que valeurs fictives ; pas Tour/Cycle/compteur Session.

### 10. Responsive, Safe Areas, texte, scroll et clavier

360/402/440 ; clavier commentaire ne masque pas saisie/CTA ; scroll si nécessaire avec texte agrandi.

### 11. États de l’écran

Ressenti vide ; Ressenti sélectionné ; commentaire vide ; commentaire renseigné ; save en cours ; erreur save.

### 12. Contrôles et interactions

Ressenti exclusif ; champ commentaire ; Terminer disabled jusqu’à Ressenti ; protection double tap.

### 13. Gestes

Tap et saisie/scroll. Aucun swipe métier.

### 14. Validation

Ressenti requis ; Commentaire ≤200 ; Terminer impossible sans Ressenti.

### 15. Brouillon et persistance

Ressenti/commentaire liés à Execution ; sauvegarde atomique à Terminer ; saisie conservée en cas d’échec.

### 16. Navigation et conservation d’état

Succès → état Catalogue mémorisé ; aucun retour Session.

### 17. Erreurs et cas limites

201 caractères empêchés/refusés selon contrôle ; erreur DB = rester Synthèse ; Execution déjà finalisée = éviter doublon.

### 18. Accessibilité

Options selected ; CTA disabled annoncé ; commentaire avec limite ; erreurs annoncées.

### 19. Invariants

Ressenti obligatoire si Synthèse affichée ; commentaire facultatif ; aucun Session count.

### 20. Recette déterministe

Terminer vide/non vide ; commentaire 0/200/201 ; double tap ; erreur save ; retour Catalogue ; responsive. Négatif : Terminer sans Ressenti.

### 21. Traçabilité

E45/E46/E49 → D-160/D-163/D-172 ; API-ACT-EXE-04/05 ; modèle Execution.



---

# 10. B7 — Suivi

## CE-T03-15 — Suivi général — Exécution ACTIVITY

### 1. Identification

Bloc B7 ; états S71–S74 ; T03-E E47–E48 ; frames structure `1992:8843`, `1992:8996`; images `ecran-11-suivi-condense.png`, `ecran-11a-suivi-deploye.png`.

### 2. Finalité fonctionnelle

Afficher les Exécutions directes dans le Suivi général comme type Activité sans compter une Séance.

### 3. Contexte d’entrée

Navigation Suivi ; retour d’autres écrans Suivi.

### 4. Contexte de sortie / destinations

Déployer/replier carte ; navigation globale. Pas de dépendance à l’ActivityDefinition source pour lire l’historique.

### 5. Données affichées et source de vérité

Execution.snapshot/results, origin ACTIVITY, date, durée réelle, statut, Ressenti, Commentaire, sides éventuels.

### 6. Classification des valeurs Figma

Nom/date/durée/statut = dynamiques ; `Activité` = dérivé origin ; exemples de cartes = démonstration.

### 7. Structure de l’écran

Liste Suivi mixte ; cartes condensées/déployées ; contenu historique issu du snapshot.

### 8. Éléments obligatoires

Identification Activité ; date/statut/durée ; détails lors du déploiement ; résultats bilatéraux le cas échéant.

### 9. Layout déterministe

Réutiliser cartes Suivi existantes ; ne pas afficher champs Session-only avec valeurs fictives.

### 10. Responsive, Safe Areas, texte, scroll et clavier

360/402/440 ; liste scrollable ; contenu déployé s’allonge ; aucun clavier hors fonctions existantes.

### 11. États de l’écran

Condensée ; déployée ; liste mix Session/Activity ; source ActivityDefinition supprimée ; résultats bilatéraux.

### 12. Contrôles et interactions

Déployer/replier ; navigation globale ; commandes Suivi existantes selon statut de disponibilité.

### 13. Gestes

Tap déployer ; scroll. Aucun geste modifiant historique.

### 14. Validation

Lecture historique depuis snapshot même si source n’existe plus. Calculs stats doivent respecter sémantique origin.

### 15. Brouillon et persistance

Lecture seule. Aucun changement snapshot/results depuis Suivi.

### 16. Navigation et conservation d’état

Navigation globale standard ; état de déploiement selon règles Suivi existantes.

### 17. Erreurs et cas limites

Source supprimée : carte reste lisible. Snapshot ancien : appliquer compatibilité migration/lecture existante.

### 18. Accessibilité

Type Activité, statut, date et détails annoncés ; déployer/replier accessible.

### 19. Invariants

Historique indépendant source ; origin ACTIVITY ; compteur Séances inchangé.

### 20. Recette déterministe

Execution directe → Suivi ; source supprimée ; mix Session/Activity ; bilateral ; stats. Négatifs : carte disparue après suppression source, Session count +1.

### 21. Traçabilité

E47–E48 → D-161/D-162/D-169 ; modèle snapshot ; API Suivi/Execution.



---

# 11. B8 — Catégories et navigation

## CE-T03-16 — Catégories — enregistrement et retour Catalogue séances

### 1. Identification

Bloc B8 ; états S75–S77 ; T03-E E67–E69 ; frame `2028:11204`; image `ecran-6-categories-seance.png`.

### 2. Finalité fonctionnelle

Finaliser la Séance et revenir déterministement sur Catalogue des séances / segment Séances avec transition canonique.

### 3. Contexte d’entrée

Composition valide → Catégories.

### 4. Contexte de sortie / destinations

Enregistrer succès → CE-T03-01 / Séances. Échec → reste Catégories. Retour arrière selon brouillon existant.

### 5. Données affichées et source de vérité

Draft Session + catégories existantes/nouvelles temporaires et sélection.

### 6. Classification des valeurs Figma

Noms catégories = dynamiques ; titres/actions = statiques ; exemples = démonstration.

### 7. Structure de l’écran

Contrat Catégories existant : titre, tags, création inline éventuelle, CTA Enregistrer.

### 8. Éléments obligatoires

Catégories selon règles existantes ; Enregistrer ; message erreur ; pas de texte introductif supplémentaire.

### 9. Layout déterministe

Conserver Figma Catégories. T03 ne change que destination/transition et protection double save.

### 10. Responsive, Safe Areas, texte, scroll et clavier

360/402/440 ; clavier inline ne masque pas CTA ; scroll selon contrat existant.

### 11. États de l’écran

Draft ; nouvelle catégorie inline ; saving ; erreur ; succès/navigation.

### 12. Contrôles et interactions

Sélection tags ; création inline ; Enregistrer une seule fois ; désactivation/busy pendant sauvegarde.

### 13. Gestes

Tap et saisie/scroll ; aucun geste spécial de transition local.

### 14. Validation

Règles catégories existantes ; transaction valide ; pas double-submit.

### 15. Brouillon et persistance

Transaction Session+Composition+catégories ; erreur = rollback et brouillon intact.

### 16. Navigation et conservation d’état

Succès impose `Catalogue des séances`, Séances, transition §4.9, même si dernier segment global était Exercices.

### 17. Erreurs et cas limites

Erreur save : rester, message, CTA réactivé, aucune donnée partielle. Double tap = une transaction.

### 18. Accessibilité

Saving/disabled annoncé ; erreur live region ; focus clavier correct.

### 19. Invariants

Destination jamais Catalogue Exercices ; segment Séances ; une seule sauvegarde.

### 20. Recette déterministe

Créer/modifier, save, double tap, erreur, destination/animation, dernier segment Exercices préalable. Négatif : retour Exercices après save.

### 21. Traçabilité

E67–E69 → D-168/D-178 ; API-SEA-03/04 ; Figma `2028:11204`.


---

## CE-T03-17 — Navigation principale — inventaire DSF

### 1. Identification

Bloc B8/B9 ; états S78–S82 ; T03-E E05–E06 ; composant `2537:214`.

### 2. Finalité fonctionnelle

Garantir la même navigation globale sur T03 avec libellé `Catalogues` et icônes DSF exactes.

### 3. Contexte d’entrée

Tous écrans utilisant Shell Bottom=Navigation.

### 4. Contexte de sortie / destinations

Tap sur destination active/inactive ouvre la route racine correspondante selon navigation existante ; Recherche ouvre son expérience dédiée.

### 5. Données affichées et source de vérité

Aucune donnée métier. État active dérivé de route.

### 6. Classification des valeurs Figma

`Catalogues`, `Calendrier`, `Suivi`, `Profil` = statiques ; icônes = composants DSF, pas données.

### 7. Structure de l’écran

Barre Bottom Navigation + contrôle Recherche distinct selon composant canonique.

### 8. Éléments obligatoires

| Destination | Variante | Boîte | Dessin | Cible |
|---|---|---:|---:|---:|
| Catalogues | `2537:86` | 32×32 | ≤24 centré | ≥48×48 |
| Calendrier | `2537:118` | 32×32 | ≤24 centré | ≥48×48 |
| Suivi | `2537:150` | 32×32 | ≤24 centré | ≥48×48 |
| Profil | `2537:182` | 32×32 | ≤24 centré | ≥48×48 |
| Recherche | `2736:2` | contrôle 58×58 | vecteur DSF | 58×58 |

### 9. Layout déterministe

Répartition via composant DSF ; dessins centrés ; aucune substitution ou mise à l’échelle >24 pour quatre destinations.

### 10. Responsive, Safe Areas, texte, scroll et clavier

Barre adapte largeur 360/402/440 et inset bas ; aucun chevauchement ; labels accessibles même si présentation visuelle compacte.

### 11. États de l’écran

Catalogue active ; Calendar active ; History active ; Profile active ; Search active.

### 12. Contrôles et interactions

Tap navigation. Destination non disponible dans une livraison partielle doit être explicitement disabled plutôt qu’active sans action.

### 13. Gestes

Tap uniquement ; aucun swipe/long press de navigation.

### 14. Validation

Route courante détermine selected. Aucun état métier ne conditionne le label `Catalogues`.

### 15. Brouillon et persistance

Aucune persistance métier. Le segment Catalogue n’est pas une propriété de la nav globale persistée au relaunch.

### 16. Navigation et conservation d’état

Tap Catalogues ouvre espace Catalogue ; relaunch force Séances selon D-167.

### 17. Erreurs et cas limites

Route indisponible = disabled explicite. Éviter double navigation sur double tap.

### 18. Accessibilité

Role tab ; selected ; label exact ; ordre logique ; cibles suffisantes.

### 19. Invariants

Premier onglet = Catalogues ; dessins ≤24 ; DSF exact ; aucune icône système de remplacement.

### 20. Recette déterministe

Mesurer icônes/cibles/centrage ; naviguer toutes destinations ; 360/402/440 ; texte agrandi. Négatifs : libellé Séances, emoji/glyphe, dessin >24.

### 21. Traçabilité

E05–E06 → D-167/D-179 ; Figma `2537:214`; chapitre 12 Navigation.

---

# 12. Référentiel des contenus élémentaires T03

| ID | Contenu élémentaire |
|---|---|
| E01 | Catalogue multi-type `Exercices / Séances / Parcours` |
| E02 | Séances sélectionné par défaut/relaunch |
| E03 | Exercices actif T03 |
| E04 | Parcours visible disabled |
| E05 | Navigation basse `Catalogues` |
| E06 | Icônes navigation conformes DSF |
| E07 | Lister ActivityDefinition |
| E08 | Recherche Catalogue exercices |
| E09 | Rangée Catalogue `Créer / Filtrer / Trier` commune ; Filtrer Archives défini pour Exercices ; Trier disabled ; autres options non définies |
| E10 | Préserver recherche/filtres/tri/scroll pendant aller-retour |
| E11 | Ne pas conserver au relaunch |
| E12 | Ouvrir ActivityDefinition en consultation/modification |
| E13 | Créer ActivityDefinition depuis Catalogue |
| E14 | Modifier ActivityDefinition |
| E15 | Archiver ActivityDefinition |
| E16 | Restaurer ActivityDefinition |
| E17 | Supprimer définitivement depuis archives |
| E18 | Aucune cascade vers copies/historique |
| E19 | Créer contextuel Catalogue |
| E20 | Exercices → création directe ActivityDefinition |
| E21 | Séances → création directe Séance |
| E22 | Arbre Ajouter depuis Composition |
| E23 | Nouvelle activité depuis Composition = SessionActivity |
| E24 | Pas Enregistrer dans Catalogue T03 |
| E25 | Multi-sélection ActivityDefinition |
| E26 | Validation disabled sélection vide |
| E27 | Compteur sélection |
| E28 | Ordre insertion = liste filtrée |
| E29 | Copie indépendante |
| E30 | Copier tout état métier applicable |
| E31 | Retour Composition enrichie |
| E32 | Bouton Lecture Activity |
| E33 | Déployer visible disabled |
| E34 | Déployer même DSF que Séances |
| E35 | Zone droite réservée identique |
| E36 | Pas poignée Catalogue Activity |
| E37 | Execution origin ACTIVITY |
| E38 | Snapshot autonome immuable |
| E39 | Préparation fixe 5 s |
| E40 | Séries / Pauses / côtés / Recovery |
| E41 | Réutiliser règles bilatérales existantes |
| E42 | Pas Session artificielle |
| E43 | Pas SESSION_END |
| E44 | Signal fin → Synthèse |
| E45 | Ressenti obligatoire |
| E46 | Commentaire facultatif |
| E47 | Suivi type Activité |
| E48 | Stats compatibles sans compter Séance |
| E49 | Retour Catalogue exercices état restauré |
| E50 | Nom Activity gras Synthèse éditeur ; nom Figma renseigné = donnée de démonstration |
| E51 | Durée totale visible trois modes ; contrôle Reps/Failure libellé `Durée totale >=` |
| E52 | Synthèse Reps/Failure `Durée totale : ≥ {durée connue}` |
| E53 | Pas texte direction développé cartes Composition |
| E54 | Roulette bloque arrière-plan |
| E55 | CTA visible normal mais fonctionnel/accessibilité disabled |
| E56 | Annuler roulette restaure |
| E57 | Confirmer applique/recalcule |
| E58 | Swipe gauche déplace carte |
| E59 | Actions révélées progressivement |
| E60 | Swipe droit ferme seulement carte ouverte |
| E61 | Autres contrôles restent actifs |
| E62 | Une seule carte expose actions |
| E63 | Dupliquer arrondi + gap fond Tour |
| E64 | CR initial non déplaçable |
| E65 | Fin séance non déplaçable |
| E66 | Aucun long press/poignée cartes structurelles |
| E67 | Après Catégories → Catalogue séances |
| E68 | Segment Séances sélectionné |
| E69 | Transition canonique droite→gauche |
| E70 | Migration sans promotion SessionActivity |
| E71 | Médias multiples hors T03 |
| E72 | Parcours fonctionnels hors T03 |
| E73 | Valeurs Figma démo non codées en dur |

# 13. Couverture des contenus élémentaires

| Plage | Contrats propriétaires |
|---|---|
| E01–E06 | CE-T03-01, CE-T03-17 |
| E07–E12 | CE-T03-02 |
| E13–E14 | CE-T03-04 |
| E15–E18 | CE-T03-05 |
| E19–E21 | CE-T03-03 |
| E22–E24 | CE-T03-06 |
| E25–E31 | CE-T03-07/08 |
| E32–E36 | CE-T03-02/09 |
| E37–E49 | CE-T03-09..15 |
| E50–E57 | CE-T03-04 |
| E58–E63 | CE-T03-02/05/08 |
| E64–E66 | CE-T03-08 |
| E67–E69 | CE-T03-01/16 |
| E70 | invariant non visuel 09 + contrats de persistance |
| E71 | CE-T03-03/04 |
| E72 | CE-T03-01/03 |
| E73 | règle commune §4.1 + tous contrats données |

Aucun contenu élémentaire T03 n’est orphelin. E70 n’a volontairement pas d’écran artificiel.

# 14. Frontière T03 / T04

T03 peut implémenter :

`Activity snapshot → préparation 5 s → Séries → Pauses → côtés → Récupération → signal fin → Synthèse → Suivi`.

T03 ne doit pas implémenter au titre de cette tranche :

- orchestration complète Session ;
- Compte à rebours Session comme phase du plan Session ;
- Exercices avant/dans/après Tour dans une Execution ACTIVITY ;
- répétitions Tour/Cycle dans ACTIVITY ;
- progression globale Session ;
- `SESSION_END` dans ACTIVITY ;
- logique de fin complète Session.

Cela relève de T04.

# 15. Preuve de conformité attendue

Pour chaque contrat :

1. tests nominal + alternatifs + négatifs ;
2. capture implémentation 402 comparée à Figma lorsqu’une frame existe ;
3. contrôle 360/402/440 ;
4. contrôle accessibilité ;
5. preuve que les données de démo ne sont pas codées en dur ;
6. preuve de persistance / absence de persistance ;
7. preuve d’absence de fonctionnalité hors T03.

Statuts : `CONFORME`, `PARTIELLEMENT CONFORME`, `NON CONFORME`, `NON VÉRIFIABLE`, `À CLARIFIER`.

# 16. Références Figma

Le chapitre 13 ne contient et ne référence **aucune copie physique d’écran ou de modale**. Toutes les copies d’écran utilisées dans les spécifications sont centralisées exclusivement dans le chapitre 06.

Les contrats de ce chapitre peuvent uniquement citer :
- le nom fonctionnel de l’état ;
- le node Figma correspondant ;
- le statut courant, historique ou supersédé lorsque nécessaire.

Les références Figma courantes utiles aux contrats T03 comprennent notamment : `3786:5093`, `1992:9910`, `1992:10129`, `4168:11149`, `4168:11262`, `4217:6980`, `4279:7044`, `4734:6342`, `4738:6209`, `4738:6355`, `1992:8132`, `1992:8626`, `1992:8224`, `1992:8326` et `1992:8428`.

Les frames historiques explicitement marquées `HISTORIQUE` dans Figma ne constituent pas des cibles d’implémentation. Les frames `PROPOSITION` ne deviennent une référence active que lorsqu’une décision validée les adopte et que le chapitre 06 les rattache à un écran ou état de production.

Figma reste la source visuelle courante. Le chapitre 06 porte l’inventaire des écrans, états, modales et leurs copies documentaires ; le présent chapitre porte seulement les contrats déterministes de comportement et de recette.

## CE-MEDIA-EXEC-01 — Bascule Information / Média pendant l’Exécution

### 1. Identification

Conception D-203 ; statut post-MVP à planifier. Évidences Figma :
- `4997:6015` — Test 2 Exécution d’une séance — Initial — Bascule (info) ;
- `4997:6113` — Test 2 Exécution d’une séance — Initial — Bascule (média).

### 2. Finalité fonctionnelle

Consulter les médias de l’Exercice en cours sans quitter ni suspendre l’Exécution.

### 3. Conditions d’affichage

Le bouton de changement de face existe uniquement si l’Exercice possède au moins un média. Face Information par défaut au début d’une nouvelle séance.

### 4. Interactions

Bouton dédié → retournement 3D. Swipe horizontal en face Média → média précédent/suivant, exactement un par geste. La galerie ne boucle pas. Un appui sur le média → CE-MEDIA-EXEC-02.

### 5. État

Face et média courant sont mémorisés par Exercice pendant la séance uniquement. Une vidéo ne démarre jamais automatiquement.

### 6. Critères de contrôle

Absence bouton sans média ; ordre galerie ; pagination ; une transition par swipe ; bornes résistantes ; cadrage intégral ; vidéo sans autoplay ; aucune pause du moteur.

---

## CE-MEDIA-EXEC-02 — Média plein écran avec cadre flottant d’Exécution

### 1. Identification

Conception D-203 ; évidence Figma `5009:6069` — Test 2 Exécution d’une séance — Média plein écran.

### 2. Finalité fonctionnelle

Agrandir le média tout en conservant le suivi et les commandes essentielles de l’Exécution.

### 3. Structure fonctionnelle

Le média occupe le plein écran avec ratio conservé. Une couche flottante d’Exécution présente le nom, le côté applicable, le chrono, Série/Tour et les commandes essentielles d’Exécution. La barre média reste distincte et porte Fermer, Lecture/Pause et progression vidéo.

### 4. Comportement

L’orientation suit l’appareil. Le moteur d’Exécution continue. Fermer revient au même média. La fin de l’Exercice ferme automatiquement le plein écran et poursuit la transition normale.

### 5. Audio et erreur

Son vidéo actif par défaut ; ducking pendant les annonces vocales KODJO. Une erreur média reste locale et n’arrête pas l’Exécution.
