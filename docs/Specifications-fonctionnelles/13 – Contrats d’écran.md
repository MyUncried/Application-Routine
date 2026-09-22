# 13 – Contrats d’écran

## 1. Objet et statut normatif

Ce chapitre constitue la **spécification déterministe des écrans de production du produit**, toutes tranches confondues. Les contrats qu’il contient aujourd’hui sont issus de T03 ; sa couverture du produit est donc **partielle** et publiée en section 17. Il transforme les décisions produit, règles métier, modèle de données, API fonctionnelles, architecture, Design System Figma et frames de référence en comportements directement exploitables par le développement et la recette.

Un écran T03 n’est considéré comme spécifié que si son contrat définit explicitement : contexte d’entrée, sorties, données et leurs sources, valeurs Figma, structure, éléments obligatoires, layout, responsive, états, contrôles, gestes, validation, brouillon/persistance, navigation/conservation d’état, erreurs, accessibilité, invariants, recette et traçabilité.

Les contrats actuellement actifs sont `CE-T03-01` à `CE-T03-17`. Ils conservent ces identifiants comme alias permanents afin de ne pas casser les références existantes.

## 1 bis. Identifiants produit et alias

Le chapitre 13 est le référentiel de contrats d’écran de tout le produit (D-192). Chaque contrat porte un identifiant produit stable `CE-<DOMAINE>-<nn>` en plus de son alias historique `CE-T03-nn`. La tranche est un attribut du contrat, pas son identité. Les identifiants `CE-T01-xx`, `CE-T02-xx` et `CE-T04-xx` d’un référentiel antérieur supprimé sont historiques et ne constituent pas des contrats actifs.

## 2. Sources et ordre d’application

Pour T03 :

1. décisions validées dans le chapitre 07, notamment D-143 à D-200, avec priorité aux décisions supersédantes les plus récentes ;
2. modèle fonctionnel / modèle de données / règles métier ;
3. API fonctionnelles ;
4. architecture technique ;
5. chapitre 06 pour navigation/interaction et corrections UX T03 ;
6. présent chapitre 13 ;
7. Figma pour le rendu visuel et les états effectivement représentés.

Figma ne transforme jamais une valeur de démonstration en règle métier. Inversement, un comportement métier ne permet pas d’inventer un composant graphique absent de Figma. Tout détail visuel non représenté et non arbitré est `NON VÉRIFIABLE` ou `À CLARIFIER`.

## 3. Structure canonique obligatoire

Chaque contrat comporte **exactement les 22 rubriques suivantes**, même lorsqu’une rubrique renvoie à une règle commune :

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
21. Traçabilité ;
22. Implémentation — rattachement de l’écran aux modules qui l’implémentent (D-193).

## 4. Règles communes

### 4.1 Classification des valeurs Figma

Toute valeur visible est classée :

- `LIBELLÉ STATIQUE OBLIGATOIRE` : texte d’interface traduit via i18n ;
- `DONNÉE MÉTIER DYNAMIQUE` : valeur provenant du modèle, d’un brouillon ou d’un calcul ;
- `VALEUR DE DÉMONSTRATION FIGMA` : valeur uniquement illustrative, interdite en dur.

Les noms d’Activités/Séances, catégories, zones corporelles, durées, nombres de Séries/répétitions, commentaires, ressentis, dates et ordre des cartes montrés dans les maquettes sont dynamiques/démonstratifs sauf mention contraire.

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

Recherche, filtres, tri implicite et scroll sont conservés pendant l’aller-retour courant. Ils ne survivent pas à un relaunch complet. Un relaunch revient au segment `Séances`.

### 4.5 Commandes Catalogue `Créer` / `Filtrer` / `Trier`

`Créer`, `Filtrer` et `Trier` forment la rangée commune de commandes d’entrée des Catalogues représentés en T03. Dans la référence Figma `402 × 874 pt` :

- `Créer` = `108 × 32 pt` ;
- `Filtrer` = `108 × 32 pt` ;
- `Trier` = `108 × 32 pt` ;
- gap horizontal = `8 pt` ;
- ensemble centré horizontalement.

Les positions Figma vérifiées `x=31`, `147`, `263` sur la largeur `402 pt` sont des **preuves de rendu**, pas des coordonnées absolues d’implémentation React Native. Le responsive suit §4.2 et chaque action conserve une cible tactile ≥ `48 × 48 pt` même si sa forme visible mesure `32 pt` de haut.

`Filtrer` et `Trier` sont communs à `Activités / Séances / Circuits`; leur représentation d’entrée est commune. `Créer` reste actif. Dans le MVP, `Filtrer` propose uniquement `Archivées` sur les Catalogues Séances et Activités ; l’application/désactivation est immédiate et ferme le panneau. Source DSF : `Overlay / Catalogue Filter — Source exact` (`4170:6608`), variantes `4170:6570` / `4170:6589`. `Trier` reste visible mais disabled.

Pour T03 / `Activités` :

- `Filtrer` est fonctionnel au minimum pour `Archivées` ;
- aucune autre option de filtre n’est définie ;
- `Trier` est visible mais disabled ;
- le tri réellement appliqué reste `updatedAt DESC` ;
- aucun menu de tri n’est ouvert ;
- aucune préférence de tri n’est persistée ;
- aucun critère non arbitré n’est inventé.

`Créer` est contextuel au Catalogue affiché : un tap ouvre directement la création de l’objet correspondant, sans écran ni arbre intermédiaire. Dans `1992:10129 — Recherche globale — Champ déployé`, la rangée `Créer / Filtrer / Trier` reste visible dans le Catalogue d’arrière-plan sous le contexte de recherche et le clavier.

Les **contrôles d’entrée** sont conçus et vérifiables dans Figma. Le panneau ouvert `Filtrer` est couvert par `4170:6608`, `4170:11315` et `4170:11443`. `Trier` reste disabled et aucun panneau de tri MVP ne doit être inventé.

### 4.6 Roulettes

Roulette ouverte : scrim bloquant arrière-plan et scroll ; CTA principal fixe reste visuellement normal mais fonctionnellement et accessibilité-inactif ; `Annuler` restaure ; `Confirmer` applique puis recalcule. Les valeurs restent brouillon jusqu’à confirmation.

### 4.7 Swipe contextuel

Swipe gauche : la carte suit le doigt et révèle progressivement les actions derrière tandis que le bloc d’actions reste fixe. Une seule carte peut exposer ses actions. Les autres contrôles restent actifs, mais un autre swipe gauche n’ouvre pas un second contexte. Tap fond = aucun effet. Tap surface de carte ouverte hors actions = aucun effet. Seul un swipe droit commencé sur la carte ouverte referme.

État ouvert de référence : `10 pt` entre le bord droit de la carte déplacée et le bord gauche du bloc d’actions, et `10 pt` entre le bord droit du bloc d’actions et le bord droit du conteneur. Le premier bouton du groupe porte les rayons haut-gauche et bas-gauche ; le dernier porte les rayons haut-droit et bas-droit. Si une seule action est affichée, ses quatre coins sont arrondis.

Cette règle s’applique aux états représentés de Composition, Calendrier Semaine et Catalogues. Pour une confirmation destructive déclenchée depuis une action de swipe, le voile modal conserve l’état ouvert sous-jacent : carte déplacée et action déclenchante visibles jusqu’à décision. Références Figma courantes : `2028:11808`, `1992:5962`, `2094:86`, `1992:10518`, `1992:10628`, `2234:88` et `2234:189`.

### 4.8 Cartes structurelles Composition

`Compte à rebours initial` et `Fin de séance` : jamais déplaçables, aucun appui long, aucune poignée de drag.

### 4.9 Transition canonique

Avancement vers l’écran suivant : cible entre depuis la droite, écran courant sort vers la gauche. Ne pas recréer localement une autre animation.

---

### 4.10 Pastilles de statut

Toute pastille de statut est une instance du composant `Status / Badge — Source exact` (`3959:5970`). Aucune pastille n’est redessinée localement. Les couleurs sont liées aux variables `color/status/*` et respectent le seuil WCAG AA documenté par D-194 à D-196.

# 5. B1 — Catalogue multi-type

## CE-T03-01 — Catalogue des séances — état T03

### 1. Identification

Identifiant produit : `CE-CAT-01` — alias T03 `CE-T03-01`.

| Propriété | Valeur |
|---|---|
| Bloc | B1 |
| États | S01 + état vide/liste + retour Catégories + recherche globale déployée |
| T03-E | E01, E02, E04, E05, E06, E19, E67, E68, E69 |
| Frames | `2117:86`, `1992:9910`, `1992:10129` |
| Shell | `Shell / Screen`, Context On, Bottom Navigation |
| Nature | Écran existant modifié |

### 2. Finalité fonctionnelle

Faire du Catalogue des séances le segment d’entrée par défaut du Catalogue multi-type, avec navigation `Catalogues`, segment Activités désormais actif, Circuits visible disabled, rangée déterministe `Créer / Filtrer / Trier` et action `Créer` contextuelle.

### 3. Contexte d’entrée

Entrées : fin Splash, tap `Catalogues`, retour d’un parcours Séance, retour après enregistrement depuis Classification. Au relaunch, segment = `Séances` même si l’utilisateur avait quitté sur `Activités`.

### 4. Contexte de sortie / destinations

- segment Activités → `CE-T03-02` ;
- segment Séances → reste ;
- Circuits → aucune navigation ;
- Créer → règle contextuelle `CE-T03-03` puis création directe d’une Séance ;
- carte Séance → parcours existant T01/T02 ;
- Recherche → expérience de Recherche globale existante ;
- navigation basse → destination choisie.

### 5. Données affichées et source de vérité

Liste issue des services/repositories Séance. Noms, Classification éventuelle, zones, durées et statuts sont dynamiques. Aucune carte d’exemple ne doit être ajoutée pour remplir l’écran.

### 6. Classification des valeurs Figma

`Catalogue des séances`, `Activités`, `Séances`, `Circuits`, `Créer`, `Filtrer`, `Trier`, `Catalogues` = statiques. Contenus de cartes et valeur de recherche = dynamiques/démonstration.

### 7. Structure de l’écran

Header fixe → segmenté trois types → rangée commandes Catalogue (`Créer`, `Filtrer`, `Trier`) → liste/état vide → Bottom Navigation. En recherche globale déployée, cette structure reste le contexte d’arrière-plan représenté par `1992:10129`.

### 8. Éléments obligatoires

Titre contextuel ; segments égaux ; Séances selected ; Activités enabled ; Circuits disabled ; rangée `Créer / Filtrer / Trier` ; navigation basse `Catalogues`. `Trier` visible disabled T03 ; `Filtrer` suit le comportement défini pour le contexte sans inventer d’options non arbitrées.

### 9. Layout déterministe

Segmenté sur largeur utile. Rangée Catalogue conforme §4.5 : trois contrôles visibles `108 × 32 pt`, gap `8 pt`, ensemble centré dans la référence `402 pt`. Liste dans Body scrollable, jamais sous navigation. La géométrie est commune à celle du Catalogue des activités ; elle ne devient pas un jeu de coordonnées absolues RN.

### 10. Responsive, Safe Areas, texte, scroll et clavier

Appliquer §4.2. Segmenté flexible ; libellés complets ; contenu liste scrollable. Dans `Recherche globale — Champ déployé`, le clavier/contexte de recherche ne supprime pas la rangée du Catalogue d’arrière-plan et ne réduit pas ses cibles tactiles sous `48 × 48 pt`.

### 11. États de l’écran

Vide réel ; liste ; recherche globale déployée ; retour Classification ; retour d’un sous-parcours ; relaunch sur Séances.

### 12. Contrôles et interactions

Activités navigue ; Séances maintient ; Circuits disabled ; `Créer` initialise directement le parcours de création d’une Séance. `Trier` reste non déclenchable en T03. T03 n’invente aucune nouvelle option Filtrer/Trier propre aux Séances.

### 13. Gestes

Cartes de Séance utilisant des actions contextuelles suivent §4.7. Aucun geste sur le segment désactivé.

### 14. Validation

Aucune validation pour changer de segment. Circuits et `Trier` ne déclenchent aucun événement métier. Créer n’écrit aucune donnée à l’ouverture.

### 15. Brouillon et persistance

Aucun état de segment persisté au relaunch. Le brouillon de création de Séance n’est initialisé qu’après tap sur `Créer`. État Recherche suit §4.4.

### 16. Navigation et conservation d’état

Retour Classification impose `Catalogue des séances` / Séances. Les autres retours suivent leur contrat. Transition canonique §4.9. La recherche/filtres/tri implicite/scroll ne sont conservés que pendant l’aller-retour courant.

### 17. Erreurs et cas limites

Erreur de chargement : afficher état d’erreur prévu, pas un faux état vide. 0 résultat réel = état vide.

### 18. Accessibilité

Circuits annonce disabled ; Séances selected ; `Catalogues` est le label accessible du premier onglet ; `Trier` annonce disabled ; focus cohérent et cibles ≥48 malgré la hauteur visuelle `32 pt` des commandes.

### 19. Invariants

Séances = défaut/relaunch ; Activités = actif T03 ; Circuits = disabled ; bottom label = `Catalogues`, jamais `Séances` ; rangée Catalogue = trois commandes présentes selon §4.5 ; `Trier` disabled.

### 20. Recette déterministe

Tester 0/N Séances, segment initial, navigation Activités, Circuit impossible, géométrie `Créer / Filtrer / Trier`, `Trier` disabled, `Créer` ouvrant directement la création d’une Séance sans intermédiaire, Recherche globale `1992:10129`, retour Classification, relaunch, 360/402/440, texte agrandi. Négatifs : écran/arbre intermédiaire après `Créer`, absence Filtrer/Trier, `Trier` actif, `Séances` en bottom nav, Circuit activable, persistance du segment Activités après relaunch.

### 21. Traçabilité

E01–E06 → D-167/D-179/D-184/D-187 ; E67–E69 → D-168/D-178 ; Figma `2117:86`, `1992:9910`, `1992:10129`; l’ancienne frame d’arbre `3841:8375` est historique/supersédée.

### 22. Implémentation

- Chemins source : `À RENSEIGNER`.
- Composants partagés consommés : `À RENSEIGNER`.
- Suites de tests attachées : `À RENSEIGNER`.
- Révision de dernière vérification : `À RENSEIGNER`.

---

## CE-T03-02 — Catalogue des activités — liste, recherche, filtres et cartes

### 1. Identification

Identifiant produit : `CE-CAT-02` — alias T03 `CE-T03-02`.

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

Lister les `ActivityDefinition`, permettre recherche, accès aux archives, consultation/modification et lancement direct, tout en séparant surface carte, Déployer disabled et Lecture active.

### 3. Contexte d’entrée

Segment Activités depuis Catalogue ; retour éditeur ; retour Exécution directe ; retour archives. L’état du parcours courant est restitué.

### 4. Contexte de sortie / destinations

Surface carte → `CE-T03-04`; Lecture → `CE-T03-09`; `Créer` → règle contextuelle `CE-T03-03` puis création directe `CE-T03-04`; Filtrer>Archivées → `CE-T03-05`; segment Séances → `CE-T03-01`.

### 5. Données affichées et source de vérité

Source : `ActivityDefinitionRepository` / `API-CAT-01`. Défaut : non archivées, `updatedAt DESC`. Exécuter ne modifie pas `updatedAt`. Récupération affichée seulement si présente sur la définition.

### 6. Classification des valeurs Figma

Noms, zones, séries, durées, récupération de la première carte = dynamiques/démonstration. Titre, segments, Créer, Filtrer, Trier = statiques. La première carte n’a aucune règle métier liée à sa position.

### 7. Structure de l’écran

Header → segmenté → rangée commandes Catalogue (`Créer`, `Filtrer`, `Trier`) → liste scrollable → navigation. Carte : barre bleue, contenu, zone Déployer, zone Lecture.

### 8. Éléments obligatoires

Barre bleue ; zone droite constante ; Déployer visible disabled ; Lecture active indépendante ; aucune poignée ; `Créer` actif ; Filtrer actif ; Trier visible disabled ; rangée commune conforme §4.5.

### 9. Layout déterministe

Rangée Catalogue : `Créer`, `Filtrer`, `Trier` visibles chacun en `108 × 32 pt`, gap `8 pt`, ensemble centré dans la référence `402 pt`, avec même représentation que Catalogue des séances. Déployer et Lecture sont ancrés selon Figma/DSF avec même largeur utile pour toutes les cartes. Cartes peuvent croître verticalement si texte. Seuls les panneaux/options ouverts Filtrer/Trier restent non définis visuellement : aucun layout local n’est inventé.

### 10. Responsive, Safe Areas, texte, scroll et clavier

§4.2. Liste et cartes prennent largeur utile. Recherche gère clavier sans masquer le contexte nécessaire ; le pattern `1992:10129` montre la rangée Catalogue conservée en arrière-plan. Cibles ≥48 même pour les commandes visuelles hautes de 32 pt. Texte long peut passer sur plusieurs lignes selon DSF.

### 11. États de l’écran

Liste active ; vide ; recherche ; Filtrer ouvert lorsque son panneau sera défini ; Archives appliqué ; Trier visible disabled ; carte en swipe ; carte ouverte ; retour restauré ; relaunch perdu.

### 12. Contrôles et interactions

Surface carte = ouvrir/modifier. Lecture = direct execution. Déployer = aucun événement. Filtrer = ouvre le contrôle partagé ; `Archivées` est la seule option dont le comportement est défini T03. Trier = aucun événement. `Créer` ouvre directement la création d’une Activité persistante.

### 13. Gestes

Swipe selon §4.7. Aucun appui long/drag de carte Catalogue. Tap Déployer disabled ne déclenche rien.

### 14. Validation

Lecture seulement si définition exécutable. Filtrer>Archivées ne modifie aucune donnée. Trier reste désactivé quel que soit l’état de liste.

### 15. Brouillon et persistance

Recherche/filtre/scroll = état UI mémoire du parcours. Aucun stockage persistant après relaunch. Aucun tri utilisateur persisté.

### 16. Navigation et conservation d’état

Édition/Execution/Archives puis retour : restaurer recherche, filtre, tri implicite et scroll. Relaunch : perdre état et revenir globalement Séances.

### 17. Erreurs et cas limites

Définition supprimée entre rendu et action : rafraîchir et indiquer indisponibilité. Filtre Archives sans résultat = état vide Archives, pas retour automatique aux actives.

### 18. Accessibilité

Carte : `Ouvrir l’activité <nom>` ; Lecture : `Exécuter l’activité <nom>` ; Déployer disabled ; Filtrer bouton actif avec état appliqué ; Trier disabled/non déclenchable par technologie d’assistance ; commandes de la rangée conservent des cibles ≥48.

### 19. Invariants

Rangée `Créer / Filtrer / Trier` conforme §4.5 ; Déployer visible disabled ; Lecture indépendante ; aucune poignée ; Filtrer donne accès à Archivées ; Trier disabled ; tri effectif `updatedAt DESC`; aucune option supplémentaire inventée.

### 20. Recette déterministe

0/N cartes ; récupération 0/>0 ; géométrie rangée 108/108/108 avec gap 8 et centrage ; surface/Lecture/Déployer ; Filtrer>Archivées ; Trier tap/clavier/VoiceOver sans action ; recherche avec rangée d’arrière-plan ; swipe ; retour état ; relaunch ; ordre updatedAt DESC ; responsive. Négatifs : `Créer` seul centré, Filtrer/Trier absents, Déployer actif/absent, Trier fonctionnel, option de filtre inventée, poignée, récupération forcée première carte.

### 21. Traçabilité

E03/E07–E12 → D-167/D-168/D-169/D-184 ; E32–E36 → D-173 ; E58–E62 → D-175 ; Figma `3786:5093`, pattern recherche `1992:10129`; `API-CAT-01`.

![Catalogue des activités](./images/ecran-12-catalogue-activites-liste.png)

*Export du 16 septembre 2026, node `3786:5093`, 402 × 874 px.*

### 22. Implémentation

- Chemins source : `À RENSEIGNER`.
- Composants partagés consommés : `À RENSEIGNER`.
- Suites de tests attachées : `À RENSEIGNER`.
- Révision de dernière vérification : `À RENSEIGNER`.

---

## CE-T03-03 — Catalogue — action `Créer` contextuelle

### 1. Identification

Identifiant produit : `CE-CAT-03` — alias T03 `CE-T03-03`.

Bloc B1 ; T03-E E19–E21, E72 ; action contextuelle partagée entre Catalogues. Les anciennes frames `3787:5148` et `3841:8375` décrivent l’écran intermédiaire supprimé et sont conservées uniquement comme évidences historiques.

### 2. Finalité fonctionnelle

Ouvrir directement la création de l’objet correspondant au Catalogue courant, sans écran ni arbre intermédiaire.

### 3. Contexte d’entrée

Tap `Créer` depuis le Catalogue courant. Le type de Catalogue affiché détermine la destination.

### 4. Contexte de sortie / destinations

- Catalogue `Activités` → `CE-T03-04` en création ;
- Catalogue `Séances` → parcours de création d’une Séance ;
- Catalogue `Circuits` → parcours de création d’un Circuit lorsque ce Catalogue devient fonctionnel.

Dans T03/MVP, `Circuits` reste désactivé : cette règle n’active ni le Catalogue ni la création de Circuit.

### 5. Données affichées et source de vérité

Aucun écran intermédiaire et aucune donnée métier intermédiaire. La destination est dérivée du type de Catalogue courant.

### 6. Classification des valeurs Figma

`Créer` est un libellé statique obligatoire. Les anciennes valeurs de l’arbre `Une nouvelle activité / Une séance / Un circuit / Annuler` ne sont plus des contrôles de l’interface des Catalogues.

### 7. Structure de l’écran

Aucune structure d’écran supplémentaire : le tap sur `Créer` déclenche directement la navigation vers le parcours de création correspondant.

### 8. Éléments obligatoires

Le bouton `Créer` reste dans la rangée commune `Créer / Filtrer / Trier`. Aucun scrim, aucune liste d’options et aucun bouton `Annuler` intermédiaire ne sont affichés.

### 9. Layout déterministe

La géométrie de la rangée Catalogue reste celle de §4.5. La suppression de l’écran intermédiaire ne modifie pas les dimensions ni l’alignement du bouton `Créer`.

### 10. Responsive, Safe Areas, texte, scroll et clavier

Appliquer les règles du Catalogue courant. Aucun layout responsive propre à un écran intermédiaire n’existe.

### 11. États de l’écran

Action disponible depuis les Catalogues actifs. Dans T03 : `Activités` et `Séances` ; `Circuits` reste disabled.

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

Destination déterminée par le Catalogue courant ; aucun écran/arbre intermédiaire ; aucun choix transversal d’un autre type d’objet ; Circuits non activés par cette règle en T03.

### 20. Recette déterministe

Depuis `Activités`, tap `Créer` → éditeur ActivityDefinition en création. Depuis `Séances`, tap `Créer` → création de Séance. Vérifier l’absence totale de l’ancien arbre. Négatifs : apparition de `Une nouvelle activité / Une séance / Un circuit / Annuler`, création d’un type différent du Catalogue courant, activation implicite de Circuits.

### 21. Traçabilité

E19–E21/E72 → D-187, D-167, D-183 ; anciennes frames `3787:5148` et `3841:8375` = historiques/supersédées ; aucune API d’écriture supplémentaire.


### 22. Implémentation

- Chemins source : `À RENSEIGNER`.
- Composants partagés consommés : `À RENSEIGNER`.
- Suites de tests attachées : `À RENSEIGNER`.
- Révision de dernière vérification : `À RENSEIGNER`.

---

# 6. B2 — CRUD et cycle de vie ActivityDefinition

## CE-T03-04 — Éditeur ActivityDefinition — créer / modifier

### 1. Identification

Identifiant produit : `CE-ACT-01` — alias T03 `CE-T03-04`.

Bloc B2 ; états S18–S27 ; T03-E E12–E14, E30, E41, E50–E57, E71 ; frames `3879:5947`, `3879:6079`, `3542:4656`, `3561:4695`, `3561:7802`, `3679:4880`, `3724:5428`, roulettes `3556:7645`, `3556:7712`, `3556:7801`, `3561:7673`, état vide `3943:6064`; responsive `2296:91/173/255`.

### 2. Finalité fonctionnelle

Créer/modifier une définition persistante complète, en réutilisant l’éditeur d’Activité et les règles de calcul existantes, sans média fonctionnel T03.

### 3. Contexte d’entrée

Création depuis CE-T03-03 ou modification depuis CE-T03-02. Création = nouveau brouillon ; modification = copie de travail de la définition existante.

### 3 bis. Variante D-210 — Paramétrage repliable

Références Figma courantes : `4230:7023` = état initial vide/replié ; `4217:6980` = état renseigné `Squats sautés`, liste repliée avec `Cliquez pour paramétrer` ; `4279:7044` = état renseigné, vue défilée avec paramètres dépliés ; `4294:7075` = état renseigné replié affichant la Synthèse complète et `Cuisses · Fessier`.

Dans cette variante, le bloc `Synthèse de l’activité` est positionné immédiatement après `Description de l’activité`. La section autonome `Mode d’exécution` et son contrôle segmenté sont supprimés. À l’état initial, le bloc de Synthèse est réduit à une ligne, ne contient aucun chevron, et affiche exactement `Cliquez pour paramétrer`. Tap sur le bloc → état déplié ; second tap → état replié. Le passage entre états conserve intégralement le brouillon.

Dans l’état déplié `4279:7044`, le cadre de Synthèse affiche le texte fonctionnel complet. Sous ce cadre, la liste verticale compacte est présentée en deux colonnes et comporte exactement huit lignes visibles dans cet état : `Mode d’exécution` → `Compte à rebours` → `Nombre de séries` → `Durée de l’activité` → `Pause entre chaque série` → `Côté` → `Récupération` → `Durée totale`. La ligne `Mode d’exécution` affiche la valeur `Durée` avec chevron. Les autres valeurs restent alignées à droite avant leur chevron. Le contrôle `Côté` utilise le même alignement ; en `UNILATERAL`, aucune valeur textuelle n’est affichée. `Fin d’activité` n’est pas affichée dans cette liste.

Chaque modification confirmée d’un paramètre met à jour en temps réel le texte de Synthèse à partir du brouillon courant. Le repli ne fige pas une valeur antérieure et ne persiste rien à lui seul.

D-217 révise les deux états renseignés. `4217:6980` conserve nom, description et illustration de démonstration, garde la liste repliée mais affiche la Synthèse fonctionnelle complète. `4279:7044` représente la même Activité après défilement : la Description est au-dessus de la fenêtre visible ; une partie de Médias occupe le haut disponible sous la zone colorée ; `Paramètres d’exécution`, la Synthèse complète et les huit lignes de paramètres sont ensuite visibles intégralement avant `Terminer`. Cette représentation défilée ne supprime pas fonctionnellement la Description.

D-219 précise la géométrie et les contenus : dans `4279:7044`, le défilement masque 91 pt de la section Médias sous la zone colorée et n’en laisse visibles que 75 pt ; la Synthèse et les huit paramètres sont entièrement visibles et la liste se termine 16 pt avant l’action fixe. Dans `4217:6980` et `4294:7075`, la Description de démonstration est `Descendez en squat, puis sautez verticalement. Atterrissez souplement et enchaînez. Gardez les genoux alignés avec les pieds et les jambes.` et sa hauteur suit le contenu. Le nom `Squats sautés` utilise `color/text-primary`. Sur `4279:7044` et `4294:7075`, le contrôle Catégorie renseigné mesure `144 × 32 pt`, affiche `Renforcement`, puis une pastille rouge `24 × 24 pt` séparée de 8 pt et placée à 4 pt des bords haut/bas/droit. `4294:7075` affiche la Synthèse complète et `Cuisses - Fessier` dans Zones corporelles. `Terminer` reste en `color/disabled` sur `4230:7023` et `4217:6980`.

D-220 révise trois éléments : `4217:6980` revient au texte initial `Cliquez pour paramétrer`; dans les quatre états de la variante, les cadres Médias d’ajout n’ont plus de texte et utilisent uniquement le SF Symbol standard `photo.badge.plus`, centré ; sur `4294:7075`, le contrôle Zones corporelles est sans `+` et affiche exactement `Cuisses · Fessier`.

D-221 ajoute un chevron de section à droite du titre `Paramètres d’exécution`. Orientation : bas si la liste est repliée (`4230:7023`, `4217:6980`, `4294:7075`), haut si elle est dépliée (`4279:7044`). Aucun chevron n’est ajouté dans le cadre de Synthèse.

D-222 ajoute l’état `4332:7095` pour `Durée de l’activité` ouverte. Le contexte écran 3 reste visible sous un voile modal. La feuille occupe toute la largeur `402 pt`, est ancrée en bas, avec fond blanc, rayon `24 pt`, poignée `50 × 4 pt` et titre `Durée de l’activité` selon le patron `3789:5405`. Elle contient la roulette canonique de durée `3556:7710`, `330 × 203 pt`, avec ses propres actions Annuler/Confirmer. Les unités visibles sont `minutes` et `secondes`. Les boutons d’action de la modale `Sélectionner les activités` ne sont pas repris.

D-223 fixe le standard unique de la feuille `Durée de l’activité` : `402 × 230 pt`, ancrée en bas ; en-tête standard `378 × 60 pt` à `x=12`, `y=0`; Annuler `x=0`, `y=3` et Confirmer/Valider `x=330`, `y=3` dans l’en-tête, soit `12 pt` des bords écran et `3 pt` du haut de la feuille, identiques à `Classification de la séance`. La poignée `50 × 4 pt` reste centrée à `y=8` et n’introduit aucun décalage. Le titre `Durée de l’activité` est centré exactement sur l’axe `201 pt`. La roulette n’a aucun cadre externe ou interne et sa zone utile mesure `330 × 150 pt`. `minutes` se termine `15 pt` avant la capsule grise secondes ; les écarts aux capsules propres sont `9,5 pt` et `11 pt`.

### 4. Contexte de sortie / destinations

`Terminer` valide/persiste puis retourne CE-T03-02 avec état Catalogue restauré. Retour/abandon suit décision de modifications non enregistrées existante.

### 5. Données affichées et source de vérité

Nom, Description, mode, cible, Séries, Pause, Récupération, zones, sideMode, Durée totale. Source = brouillon ; persistance seulement à validation.

### 6. Classification des valeurs Figma

Noms, zones et valeurs numériques = dynamiques/démonstration. **`Renforcement du genou` est une `VALEUR DE DÉMONSTRATION FIGMA` du nom d’Activité** dans les états renseignés et ne doit jamais être codée en dur. `Comment s’appelle cette activité ?` est le placeholder exact de l’état vide visible dans `3943:6064` ; il utilise `color/text-secondary`. Titres, modes, Séries, Pause, Récupération, libellés de Durée totale et Terminer = statiques.

### 7. Structure de l’écran

Hors variante D-210 à D-223 : Nom → contrôles `Catégorie` / `Zones corporelles` → sections `Description de l’activité` / `Mode d’exécution` / `Médias` → paramètres Séries/cible/Pause → deuxième rangée Côté/Récupération/Durée totale → Synthèse fixe → Terminer. La variante D-210 à D-223 suit l’ordre spécifique défini au §3 bis.

### 8. Éléments obligatoires

Sous le Nom, deux contrôles directs `Catégorie` et `Zones corporelles`, chacun précédé de l’icône vectorielle `+` ouvrent respectivement une modale de sélection unique facultative et une modale de sélection multiple facultative. Quand une sélection existe, le contrôle affiche la ou les valeurs sélectionnées ; un nouveau tap rouvre la modale avec l’état courant. Aucune section repliable Catégorie/Zone corporelle n’est présente. Mode 3 options égales ; Durée totale visible tous modes ; en mode Durée le contrôle porte `Durée totale`; en Répétitions/À l’échec le contrôle porte **`Durée totale >=`** ; la Synthèse conserve la formulation **`Durée totale : ≥ {durée connue}`** ; nom en gras dans Synthèse uniquement ; section Médias visible et repliable, contrôle `Déployer / Condenser` et placeholder média désactivés, aucune fonction média réelle ; le bouton supérieur `Ajouter un média` est absent ; contrôle Côté Activité `74 × 42 pt` quelle que soit sa position structurelle ; aucun contrôle Côté du Tour dans la version actuelle ; roulettes Annuler/Confirmer.

### 9. Layout déterministe

DSF/grilles sans compensation locale. En Répétitions/À l’échec, `Durée totale >=` est le troisième élément de la deuxième rangée, après `Côté` puis `Récupération`, conformément aux frames `3561:4695`, `3561:7673`, `3561:7802`. Centrer nombre répétitions ; sélection Mode coïncide avec contrôle externe. La valeur Figma `5 min 30 s`, lorsqu’elle apparaît, est illustrative et ne devient pas une valeur métier par défaut.

### 10. Responsive, Safe Areas, texte, scroll et clavier

Références 360/402/440. Formulaire scrollable ; synthèse/action restent accessibles ; clavier ne masque pas champ. Texte agrandi ne chevauche pas contrôles.

### 11. États de l’écran

Création/modification ; état vide avec `Comment s’appelle cette activité ?` en `color/text-secondary` ; états renseignés avec nom métier ; DURATION/REPS/FAILURE ; UNILATERAL/D→G/G→D ; roulettes ouvertes ; Séries pilote ; Durée totale pilote ; message ajustement ; Description/Zone ouverts.

### 12. Contrôles et interactions

Tous les champs modifient le brouillon. Le champ Nom affiche la donnée du brouillon et non un libellé de démonstration. Roulettes selon §4.6. Terminer actif seulement si brouillon valide. Les contrôles `Catégorie` et `Zones corporelles` ouvrent leurs modales respectives ; aucun contrôle supérieur d’ajout de média n’est présent.

### 13. Gestes

Tap, scroll, saisie ; pas de swipe métier ; haptique roulette par cran selon décision existante.

### 14. Validation

Nom requis ; mode valide ; cible selon mode ; Séries 1..99 ; Pause/Récupération ≥0 ; FAILURE sans cible chiffrée ; calculs D-155/D-156. Le signe `>=` du libellé UI n’ajoute aucune nouvelle règle de calcul : il rend visible la borne déjà définie.

### 15. Brouillon et persistance

Création persiste ActivityDefinition à Terminer uniquement. Modification atomique. L’éditeur porte zéro ou une Catégorie, zéro ou plusieurs Zones corporelles, un Compte à rebours d’activité et une Fin d’activité propres. Catégorie et Zones sont manipulées exclusivement via les deux contrôles du bandeau supérieur et leurs modales. Les deux durées sont initialisées depuis le Profil pour une nouvelle Activité puis modifiables ici. Annuler roulette ne change pas dernière valeur confirmée.

### 16. Navigation et conservation d’état

Succès → Catalogue activités restauré. Aucun SessionActivity créé dans ce contexte.

### 17. Erreurs et cas limites

Échec persistance : rester éditeur, conserver brouillon, réactiver action, aucune écriture partielle. Définition supprimée en parallèle : erreur explicite, pas de recréation implicite.

### 18. Accessibilité

Modes selected ; contrôles disabled annoncés ; wheel bloque focus arrière-plan ; unités annoncées ; CTA arrière inaccessible pendant wheel. Le libellé accessible de la borne doit conserver la sémantique « durée totale supérieure ou égale à la durée connue » même si le visuel affiche `>=`.

### 19. Invariants

Aucun média fonctionnel ; bouton supérieur `Ajouter un média` absent ; le contenu Médias est masqué sous la Synthèse en cas de chevauchement, avec un masque blanc de même largeur commençant `16 pt` au-dessus du cadre de Synthèse ; `Catégorie` et `Zones corporelles`, chacun précédé de l’icône vectorielle `+` présents sous le Nom ; Catégorie facultative unique ; Zones corporelles multiples ; sélection courante réaffichée dans le contrôle et modifiable par réouverture de la modale ; aucune section Catégorie/Zone corporelle ; nom gras Synthèse ; `Renforcement du genou` jamais statique ; `Comment s’appelle cette activité ?` réservé à l’état vide/placeholder représenté et rendu avec `color/text-secondary` ; Compte à rebours d’activité et Fin d’activité propres ; Durée totale toujours visible ; contrôle Reps/Échec = `Durée totale >=` ; Synthèse Reps/Échec = `Durée totale : ≥ {durée connue}` ; pas de nouvelle formule bilatérale ; ActivityDefinition distincte d’une SessionActivity. La zone Médias est située sous la Synthèse dans l’ordre visuel : tout chevauchement est masqué par le cadre de Synthèse, avec un masque commençant `16 pt` au-dessus du bord supérieur de cette Synthèse.

### 20. Recette déterministe

Créer/éditer trois modes, trois sideModes, état vide vs renseigné, vérifier absence de nom démo codé en dur, vérifier `Durée totale` en Durée et `Durée totale >=` en Reps/Échec, vérifier Synthèse `Durée totale : ≥ …`, roues Annuler/Confirmer, calculs, échec DB, abandon, responsive, texte agrandi. Négatifs : `Renforcement du genou` statique, ancien placeholder `Nom de l’activité`, placeholder vide en couleur de texte principale, Durée totale masquée, libellé Reps/Échec sans `>=`, CTA wheel activable, média fonctionnel, nom non gras Synthèse.

### 21. Traçabilité

D-207 / D-208 ; Figma états éditeur mis à jour, plus `4194:6847` (Modale Catégorie) et `4194:7026` (Modale Zones corporelles).

E12–E14/E30 → D-169/D-171 ; E41 → D-143..156 ; E50–E57 → D-174/D-181/D-182 ; API-ACT-REF/API-ACT ; Figma `3561:4695`, `3561:7673`, `3561:7802`, `3943:6064` et autres frames citées.

### 22. Implémentation

- Chemins source : `À RENSEIGNER`.
- Composants partagés consommés : `À RENSEIGNER`.
- Suites de tests attachées : `À RENSEIGNER`.
- Révision de dernière vérification : `À RENSEIGNER`.

---

## CE-T03-05 — ActivityDefinition — archiver / restaurer / supprimer

### 1. Identification

Identifiant produit : `CE-ACT-02` — alias T03 `CE-T03-05`.

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

Filtre Archives et scroll conservés pendant parcours courant. Après restaurer/supprimer, rester Archives. Relaunch perd filtre.

### 17. Erreurs et cas limites

Échec écriture : ne pas masquer carte ; état visuel reflète stockage. Dernière archive supprimée/restaurée → état vide Archives. Définition déjà modifiée/supprimée → rafraîchir.

### 18. Accessibilité

Actions nommées ; Supprimer annoncé destructif ; dialogue focusé ; filtre Archives annoncé actif ; équivalents aux gestes disponibles.

### 19. Invariants

Suppression seulement Archives ; aucune suppression de SessionActivity, snapshot, Result ou Execution ; accès Archives via Filtrer ; Trier disabled.

### 20. Recette déterministe

Archiver → disparition active ; Filtrer>Archivées ; Restaurer ; Supprimer/Annuler/Confirmer ; vérifier copies/historique ; erreur DB ; Archives vide ; responsive. Négatifs : suppression directe active, cascade, navigation Archives distincte du filtre.

### 21. Traçabilité

E15–E18 → D-169/D-184 ; E58–E62 → D-175 ; modèle 09 bis ; API-ACT-REF/API-CAT-01 ; pattern Figma Séances cité.


### 22. Implémentation

- Chemins source : `À RENSEIGNER`.
- Composants partagés consommés : `À RENSEIGNER`.
- Suites de tests attachées : `À RENSEIGNER`.
- Révision de dernière vérification : `À RENSEIGNER`.

---

# 7. B3/B4 — Ajout depuis Composition et sélection multiple

## CE-T03-06 — Composition — ajouter une activité depuis le Catalogue

### 1. Identification

Identifiant produit : `CE-COM-ADD-01` — alias T03 `CE-T03-06`.

### 2. Finalité fonctionnelle

Ajouter une ou plusieurs Activités à une Séance exclusivement à partir du Catalogue des Activités.

### 3. Contexte d’entrée

Tap `+ Ajouter une activité` dans Composition.

### 4. Contexte de sortie / destinations

L’action ouvre directement la modale de sélection des `ActivityDefinition` actives. Aucun arbre intermédiaire n’est affiché.

### 5. Données affichées et source de vérité

Liste filtrable des `ActivityDefinition` actives fournie par `ActivityDefinitionRepository`. Les Activités archivées ne sont pas proposées pour une nouvelle affectation.

### 6. Classification des valeurs Figma

Noms, Catégories, Zones corporelles et paramètres d’Activités = dynamiques. `Sélectionner les activités`, `Rechercher une activité`, `Créer une activité`, `Ajouter N activité(s)` et `Annuler` = libellés fonctionnels.

### 7. Structure de la modale

En-tête, recherche, action `Créer une activité`, liste multi-sélectionnable, actions `Ajouter N activité(s)` et `Annuler`.

### 8. Éléments obligatoires

Recherche ; création ; liste ; sélection ; compteur ; validation ; annulation.

### 9. Layout déterministe

Référence active : frame de sélection multiple `3789:5349`. L’ancien arbre `Une nouvelle activité / Une activité existante / Annuler` est historique et supersédé par D-205.

### 10. Responsive, Safe Areas, texte, scroll et clavier

Conserver le contrat adaptatif 360/402/440 ; liste scrollable ; clavier de recherche sans masquer les actions finales.

### 11. États de la modale

Vide ; liste ; recherche ; sélection 1..N ; création d’une nouvelle Activité ; retour après création ; erreur.

### 12. Contrôles et interactions

Tap Activité = sélection/désélection. `Créer une activité` ouvre l’éditeur ActivityDefinition. Après enregistrement réussi, la nouvelle Activité est ajoutée directement à la Séance puis le parcours revient à la Composition. `Ajouter N activité(s)` copie les sélections existantes selon leur ordre visible.

### 13. Gestes

Tap, saisie et scroll uniquement dans la modale.

### 14. Validation

Validation de sélection désactivée si aucune Activité n’est sélectionnée. La création d’une Activité suit CE-T03-04.

### 15. Brouillon et persistance

La sélection reste temporaire jusqu’à validation. Chaque insertion crée une `SessionActivity` indépendante. La Catégorie éventuelle et les Zones corporelles sont copiées ; le Compte à rebours d’activité et la Fin d’activité ne le sont jamais.

### 16. Navigation et conservation d’état

Annuler → Composition intacte. Validation → Composition enrichie. Création réussie depuis la modale → nouvelle ActivityDefinition persistée + copie ajoutée + retour Composition.

### 17. Erreurs et cas limites

Création abandonnée → retour modale sans ajout. Erreur de création → rester dans l’éditeur. ActivityDefinition archivée pendant le parcours → non éligible à l’ajout.

### 18. Accessibilité

Focus modal, liste multi-sélectionnable annoncée, compteur de sélection, action Créer accessible, cibles ≥48.

### 19. Invariants

Aucune création locale de SessionActivity ; aucun arbre intermédiaire ; toute Activité de Séance provient d’une ActivityDefinition persistante.

### 20. Recette déterministe

Vérifier ouverture directe depuis `Ajouter une activité`, multi-sélection, création d’une Activité absente, ajout direct après création, ordre visible, annulation et 360/402/440. Négatifs : apparition de `Une nouvelle activité` ou `Une activité existante`, création d’une Activité de Séance non persistante.

### 21. Traçabilité

D-171 révisée, D-205, RM-160, API-COM-03 ; Figma `3789:5349`.

### 22. Implémentation

- Chemins source : à auditer dans la prochaine tranche corrective.
- Composants partagés consommés : modale de sélection ActivityDefinition, éditeur ActivityDefinition.
- Suites de tests attachées : à compléter lors de l’implémentation.
- Révision de dernière vérification : 22/09/2026.


## CE-T03-07 — Sélection multiple d’Activités existantes

### 1. Identification

Identifiant produit : `CE-CMP-02` — alias T03 `CE-T03-07`.

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

E25–E31 → D-165/D-171 ; 09 bis ; `API-COMP-SEL-01..03`; Figma `3789:5349`, `3789:5405`.

![Sélection Activités](./images/ecran-14-selection-activites-existantes.png)

### 22. Implémentation

- Chemins source : `À RENSEIGNER`.
- Composants partagés consommés : `À RENSEIGNER`.
- Suites de tests attachées : `À RENSEIGNER`.
- Révision de dernière vérification : `À RENSEIGNER`.

---

## CE-T03-08 — Composition après insertion et corrections UX

### 1. Identification

Identifiant produit : `CE-CMP-03` — alias T03 `CE-T03-08`.

Bloc B3/B9 ; états S37–S46 ; T03-E E31, E53, E58–E66 ; frames `2028:11700`, `2028:11808`, appui long `3518:4576`.

### 2. Finalité fonctionnelle

Afficher les copies insérées et appliquer directions courtes, swipe réel, gap Dupliquer et non-déplaçabilité des cartes structurelles.

### 3. Contexte d’entrée

Retour création SessionActivity, retour CE-T03-07 ou ouverture d’une Composition existante.

### 4. Contexte de sortie / destinations

Tap Activity → éditeur ; long press Activity → déplacement ; swipe → actions ; Continuer → Catégories.

### 5. Données affichées et source de vérité

Draft Session. Direction propre de l’Activité : `D→G`/`G→D`; rien en `UNILATERAL`. Le Tour reste techniquement `UNILATERAL` et n’introduit aucune direction héritée dans la version actuelle.

### 6. Classification des valeurs Figma

Noms/paramètres = dynamiques ; titres structurels = statiques ; positions de cartes d’exemple = démonstration.

### 7. Structure de l’écran

CR initial → activités avant Tour → Tour → activités après Tour → Fin séance. Actions contextualisées derrière Activity.

### 8. Éléments obligatoires

CR/Fin sans poignée ; Dupliquer arrondi ; gap fond Tour ; indicateur direction court sur l’Activité ; aucun contrôle de côté du Tour dans la version actuelle (D-200).

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

![Actions glissées](./images/ecran-3a-composition-actions-glissees.png)


### 22. Implémentation

- Chemins source : `À RENSEIGNER`.
- Composants partagés consommés : `À RENSEIGNER`.
- Suites de tests attachées : `À RENSEIGNER`.
- Révision de dernière vérification : `À RENSEIGNER`.

---

# 8. B5 — Exécution directe

## CE-T03-09 — Lancement direct et préparation fixe 5 s

### 1. Identification

Identifiant produit : `CE-EXE-01` — alias T03 `CE-T03-09`.

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

E37–E39/E42 → D-157/D-172/D-180 ; 09 bis ; API-ACT-EXE-01/02.

![Préparation](./images/ecran-16-preparation-directe-5-s.png)

### 22. Implémentation

- Chemins source : `À RENSEIGNER`.
- Composants partagés consommés : `À RENSEIGNER`.
- Suites de tests attachées : `À RENSEIGNER`.
- Révision de dernière vérification : `À RENSEIGNER`.

---

## CE-T03-10 — Exécution directe — Durée unilatérale

### 1. Identification

Identifiant produit : `CE-EXE-02` — alias T03 `CE-T03-10`.

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

![Exécution directe](./images/ecran-17-execution-directe-en-cours.png)

### 22. Implémentation

- Chemins source : `À RENSEIGNER`.
- Composants partagés consommés : `À RENSEIGNER`.
- Suites de tests attachées : `À RENSEIGNER`.
- Révision de dernière vérification : `À RENSEIGNER`.

---

## CE-T03-11 — Exécution directe — Répétitions et À l’échec

### 1. Identification

Identifiant produit : `CE-EXE-03` — alias T03 `CE-T03-11`.

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

### 22. Implémentation

- Chemins source : `À RENSEIGNER`.
- Composants partagés consommés : `À RENSEIGNER`.
- Suites de tests attachées : `À RENSEIGNER`.
- Révision de dernière vérification : `À RENSEIGNER`.

---

## CE-T03-12 — Exécution directe — bilatéralité, Pauses, Récupération

### 1. Identification

Identifiant produit : `CE-EXE-04` — alias T03 `CE-T03-12`.

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

### 22. Implémentation

- Chemins source : `À RENSEIGNER`.
- Composants partagés consommés : `À RENSEIGNER`.
- Suites de tests attachées : `À RENSEIGNER`.
- Révision de dernière vérification : `À RENSEIGNER`.

---

## CE-T03-13 — Fin, interruption et retour d’Exécution directe

### 1. Identification

Identifiant produit : `CE-EXE-05` — alias T03 `CE-T03-13`.

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

Synthèse puis Terminer → Catalogue activités avec état aller-retour. Relaunch ultérieur ne restaure pas ce contexte UI.

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


### 22. Implémentation

- Chemins source : `À RENSEIGNER`.
- Composants partagés consommés : `À RENSEIGNER`.
- Suites de tests attachées : `À RENSEIGNER`.
- Révision de dernière vérification : `À RENSEIGNER`.

---

# 9. B6 — Synthèse Activité

## CE-T03-14 — Synthèse d’Exécution directe

### 1. Identification

Identifiant produit : `CE-SYN-01` — alias T03 `CE-T03-14`.

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

![Synthèse Ressenti requis](./images/ecran-18-synthese-directe-ressenti-requis.png)

![Synthèse Ressenti sélectionné](./images/ecran-18a-synthese-directe-ressenti-selectionne.png)


### 22. Implémentation

- Chemins source : `À RENSEIGNER`.
- Composants partagés consommés : `À RENSEIGNER`.
- Suites de tests attachées : `À RENSEIGNER`.
- Révision de dernière vérification : `À RENSEIGNER`.

---

# 10. B7 — Suivi

## CE-T03-15 — Suivi général — Exécution ACTIVITY

### 1. Identification

Identifiant produit : `CE-SUI-01` — alias T03 `CE-T03-15`.

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

![Suivi condensé](./images/ecran-11-suivi-condense.png)

![Suivi déployé](./images/ecran-11a-suivi-deploye.png)


### 22. Implémentation

- Chemins source : `À RENSEIGNER`.
- Composants partagés consommés : `À RENSEIGNER`.
- Suites de tests attachées : `À RENSEIGNER`.
- Révision de dernière vérification : `À RENSEIGNER`.

---

# 11. B8 — Catégories et navigation

## CE-T03-16 — Modale Classification — validation et retour Catalogue séances

### 1. Identification

Identifiant produit : `CE-SESSION-CLASS-01` — alias T03 `CE-T03-16`.

### 2. Finalité fonctionnelle

Permettre l’affectation facultative d’une seule Classification à la Séance, la création inline d’une Classification absente, puis finaliser la Séance sans quitter visuellement la Composition.

### 3. Contexte d’entrée

Composition valide → ouverture de la modale Classification au-dessus de la Composition courante.

### 4. Contexte de sortie / destinations

`Annuler` → Composition avec brouillon intact. `Valider` succès → Catalogue des séances / segment Séances. Échec → modale maintenue ouverte.

### 5. Données affichées et source de vérité

Draft Session + référentiel des Classifications actives + Classification sélectionnée éventuelle. Une Classification archivée déjà affectée reste lisible sur une Séance existante mais n’est pas proposée pour une nouvelle affectation.

### 6. Classification des valeurs Figma

Noms de Classifications = dynamiques ; titre `Classification de la séance`, actions d’en-tête et actions inline = statiques ; exemples = démonstration.

### 7. Structure de la modale

Voile modal bloquant ; en-tête fixe `Annuler / Classification de la séance / Valider` ; contenu avec choix unique ; état standard avec `Créer une classification` ; état inline avec champ `Nom de la classification` et actions `Annuler / Ajouter`. Aucun CTA inférieur.

### 8. Éléments obligatoires

Voile ; titre ; Annuler ; Valider ; options ; création inline ; message erreur si persistance échoue. Le patron DSF de l’ancienne modale Catégories est réutilisé.

### 9. Layout déterministe

Références Figma héritées et révisées : `2028:11204` et `2028:11248`.

### 10. Responsive, Safe Areas, texte, scroll et clavier

360/402/440 : conserver marges, titre lisible, actions accessibles et contenu scrollable. Le clavier ne masque pas la création inline.

### 11. États de la modale

Standard ; aucune Classification ; une Classification sélectionnée ; création inline ; saving ; erreur.

### 12. Contrôles et interactions

Sélection exclusive 0..1. Tap sur la Classification sélectionnée la désélectionne. `Créer une classification` ouvre l’état inline. `Ajouter` crée la valeur temporaire et la sélectionne. `Valider` déclenche une transaction finale unique.

### 13. Gestes

Tap, saisie, scroll. Aucun geste spécial local.

### 14. Validation

Classification facultative ; unicité canonique du nom ; pas de double-submit.

### 15. Brouillon et persistance

Avant Valider, sélection et création temporaire restent dans le brouillon. Valider persiste atomiquement Session + Composition + Classification éventuelle.

### 16. Navigation et conservation d’état

Annuler restaure la Composition. Succès → Catalogue des séances / Séances selon transition canonique.

### 17. Erreurs et cas limites

Doublon canonique → réutiliser l’existante. Classification archivée → non proposée à une nouvelle affectation. Suppression d’une Classification utilisée → confirmation, puis Séances concernées sans Classification.

### 18. Accessibilité

Voile bloquant, focus modal, choix unique annoncé, saving/disabled annoncé, erreur live region.

### 19. Invariants

Une Séance porte zéro ou une Classification ; jamais plusieurs. Classification remplace l’ancienne notion de Catégories de Séance.

### 20. Recette déterministe

Vérifier `2028:11204` et `2028:11248`, sélection exclusive, création inline, validation, erreur, destination, 360/402/440. Négatif : multi-sélection ou libellé `Catégories de la séance`.

### 21. Traçabilité

D-203/D-204 ; RM-022/RM-023/RM-107/RM-108 ; API-SEA-03/API-REF-07.

### 22. Implémentation

- Chemins source : à auditer dans la prochaine tranche corrective.
- Composants partagés consommés : patron modal de référentiel existant.
- Suites de tests attachées : à compléter lors de l’implémentation.
- Révision de dernière vérification : 22/09/2026.


## CE-T03-17 — Navigation principale — inventaire DSF

### 1. Identification

Identifiant produit : `CE-NAV-01` — alias T03 `CE-T03-17`.

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
| E01 | Catalogue multi-type `Activités / Séances / Circuits` |
| E02 | Séances sélectionné par défaut/relaunch |
| E03 | Activités actif T03 |
| E04 | Circuits visible disabled |
| E05 | Navigation basse `Catalogues` |
| E06 | Icônes navigation conformes DSF |
| E07 | Lister ActivityDefinition |
| E08 | Recherche Catalogue activités |
| E09 | Rangée Catalogue `Créer / Filtrer / Trier` commune ; Filtrer Archives défini pour Activités ; Trier disabled ; autres options non définies |
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
| E20 | Activités → création directe ActivityDefinition |
| E21 | Séances → création directe Séance |
| E22 | Ajouter une activité ouvre directement la sélection Catalogue |
| E23 | Créer une activité depuis la sélection = ActivityDefinition persistante puis copie ajoutée |
| E24 | Aucune création locale de SessionActivity à la volée |
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
| E49 | Retour Catalogue activités état restauré |
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
| E67 | Après Classification → Catalogue séances |
| E68 | Segment Séances sélectionné |
| E69 | Transition canonique droite→gauche |
| E70 | Migration sans promotion SessionActivity |
| E71 | Médias multiples hors T03 |
| E72 | Circuits fonctionnels hors T03 |
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
| E70 | invariant non visuel 09 bis + contrats de persistance |
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
- Activités avant/dans/après Tour dans une Execution ACTIVITY ;
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

# 16. Évidences Figma embarquées

Les fichiers historiques suivants restent physiquement présents dans le dépôt mais ne sont plus embarqués comme preuve courante ; leur statut est détaillé dans `images/README-T03-FIGMA.md` :

- `./images/CE-ACT-EXE-01a-catalogue-activites-liste-t03.jpg` — **superseded** : remplacé comme preuve courante par `./images/ecran-12-catalogue-activites-liste.png`, réexporté le 16 septembre 2026 depuis `3786:5093`.
- `./images/CE-ACT-EXE-01b-catalogue-creer-arbre-actions-t03.jpg` et `./images/ecran-13-catalogue-activites-creer-arbre.png` — **historiques/superseded** : ils documentent l’ancien écran intermédiaire supprimé par D-187.
- `./images/CE-ACT-EXE-01c-catalogue-action-contextuelle-t03.jpg` — **historique uniquement**, le node source `3787:5209` n’existe plus dans le Figma courant.

Les preuves suivantes ont été réexportées depuis le Figma courant le 16 septembre 2026, au format documentaire `402 × 874 px` :

- `./images/ecran-14-selection-activites-existantes.png` — `3789:5349`, binaire modifié.
- `./images/ecran-16-preparation-directe-5-s.png` — `3835:5385`, binaire inchangé : l’export courant est identique à l’existant.
- `./images/ecran-17-execution-directe-en-cours.png` — `3835:5465`, binaire inchangé.
- `./images/ecran-18-synthese-directe-ressenti-requis.png` — `3836:5437`, binaire inchangé.
- `./images/ecran-18a-synthese-directe-ressenti-selectionne.png` — `3836:5503`, binaire inchangé.
- `./images/ecran-3a-composition-actions-glissees.png` — `2028:11808`, binaire modifié.
- `./images/ecran-6-categories-seance.png` — `2028:11204`, binaire modifié.
- `./images/ecran-11-suivi-condense.png` — `1992:8843`, binaire modifié.
- `./images/ecran-11a-suivi-deploye.png` — `1992:8996`, binaire modifié.

Évidences Figma **courantes vérifiées** le 16 septembre 2026 : `3786:5093`, `1992:9910`, `1992:10129`, `3561:4695`, `3561:7673`, `3561:7802`, `3943:6064`, `2537:1033`, `2537:214`. Les frames `3787:5148` et `3841:8375` restent conservées comme évidences historiques de l’ancien arbre `Créer`, supersédé fonctionnellement par D-187.

Le composant transverse `Status / Badge — Source exact` (`3959:5970`) et ses sept variantes constituent une preuve de composant distincte des preuves d’usage. Sa capture canonique est `./images/status-badge-composant.png` (PNG ×2, `1374 × 128 px`). Ses trois preuves d’usage sont `1992:8843`, `1992:8996` et `1992:10320`.

Figma reste la source visuelle courante. Les contrôles d’entrée `Créer / Filtrer / Trier` sont vérifiables ; seul le détail des panneaux/options ouverts `Filtrer`/`Trier` reste `NON VÉRIFIABLE` / `À CLARIFIER` tant qu’aucune frame dédiée n’est validée.

### 22. Implémentation

- Chemins source : `À RENSEIGNER`.
- Composants partagés consommés : `À RENSEIGNER`.
- Suites de tests attachées : `À RENSEIGNER`.
- Révision de dernière vérification : `À RENSEIGNER`.



# 17. Couverture du référentiel produit

Cette section est le compte exact de ce que le référentiel couvre. Elle ne doit être ni omise ni arrondie. Décision : D-192.

| Écran du chapitre 06 | Contrat | Couverture |
|---|---|---|
| Écran 0 — Splash | — | non contracté |
| Écran 1 — Profil | — | non contracté |
| Écran 2 — Catalogue des séances | `CE-T03-01` | contractée pour le Catalogue et le cycle de vie MVP des Séances |
| Écran 3 — Composition d'une séance | `CE-T03-06`, `07`, `08`, `16` | partielle |
| Écran 4 — Création / modification d'une Activité | `CE-T03-04`, `05` | contractée |
| Écran 7 — Calendrier | — | non contracté |
| Écran 8 — Planifier une séance | — | non contracté |
| Écran 9 — Exécution de séance | — | non contracté ; `CE-T03-09` à `13` couvrent l'exécution directe d'une Activité |
| Écran 10 — Synthèse de séance | — | non contracté ; `CE-T03-14` couvre la synthèse d'exécution directe |
| Écran 11 — Suivi : Séances | `CE-T03-15` | partielle : exécutions `ACTIVITY` |
| Écrans 12 à 18 — Catalogue des Activités et Exécution directe | `CE-T03-02`, `03`, `09` à `14` | contractés |
| Navigation principale | `CE-T03-17` | contractée |

**Conséquence opérationnelle.** Une tranche touchant un écran non contracté ne dispose pas de spécification déterministe : son plan doit soit créer le contrat, soit déclarer explicitement qu'il travaille sur une base narrative.

# 18. Référentiel de contrats antérieur — supprimé

Un référentiel de contrats d'écran antérieur, organisé par tranche, portait les identifiants `CE-T01-xx`, `CE-T02-xx` et `CE-T04-xx`. Il a été supprimé lors de la consolidation du présent chapitre. Ces identifiants subsistent dans certaines matrices de traçabilité.

Ce sont des **références historiques**. Elles ne désignent aucun contrat actif et ne constituent jamais une spécification opposable.
