## Objectif de conception

L’interface du produit fini doit être principalement visuelle, intuitive et utilisable avec le moins de touchers possible.

L’utilisateur doit notamment pouvoir ouvrir rapidement une séance, comprendre immédiatement l’action attendue pendant une Exécution et accéder facilement aux fonctions courantes.

Pendant l’Exécution, le guidage visuel est complété par des signaux sonores et des annonces vocales afin que l’utilisateur puisse suivre la séance sans regarder constamment l’écran.

La conception du MVP respecte les principes suivants :

- limiter le nombre d’écrans et d’étapes intermédiaires ;
- donner un accès direct aux actions les plus fréquentes ;
- privilégier les icônes et les indicateurs visuels ;
- limiter les textes affichés pendant l’Exécution ;
- hiérarchiser clairement les informations selon leur importance pendant l’effort ;
- enregistrer automatiquement les modifications lorsque la validation explicite d’un formulaire n’est pas nécessaire ;
- éviter les confirmations inutiles ;
- afficher clairement l’action principale de chaque écran ;
- rendre les commandes essentielles facilement accessibles avec le pouce ;
- placer les paramètres moins fréquents dans un niveau secondaire.

### Rapidité de création

La création d’une Séance ou d’un Exercice, y compris son éventuelle durée de Récupération, doit pouvoir être réalisée en quelques secondes, avec un minimum de saisies et de touchers.

L’application privilégie :

- des valeurs par défaut immédiatement utilisables ;
- l’affichage initial des seuls paramètres indispensables ;
- l’ajout direct d’un élément à l’endroit choisi dans la Séance ;
- la possibilité de modifier ou d’enrichir ultérieurement chaque élément ;
- des sections facultatives repliables pour la Description et les Zones corporelles d’exécution.

La création rapide constitue le parcours principal. L’ajout d’une Description ou de Zones corporelles reste facultatif.

## Contrat d’affichage commun aux écrans du MVP

Les captures Figma définissent l’apparence de référence à une largeur de `402` points logiques. Elles ne doivent pas être reproduites avec des coordonnées absolues. Les valeurs partagées, les Screen Shells et les composants réutilisables sont centralisés dans le Design System décrit au chapitre 12 ; les règles ci-dessous définissent le comportement fonctionnel attendu lorsque la taille disponible change.

La spécification d’un écran suit la composition canonique suivante :

1. **Screen Shell** : structure les zones fixes et les slots disponibles ;
2. **composants et contrôles du Design System** : portent les règles visuelles et interactives communes ;
3. **règles spécifiques de l’écran** : définissent son contenu, ses états et son comportement fonctionnel.

Une règle déjà portée par le Screen Shell ou un composant commun n’est pas redéfinie localement. Une valeur ou un état propre au métier reste documenté dans l’écran ou la spécification fonctionnelle concernée, et non dans le composant générique.

### Contrats d’écran et conformité de l’implémentation

Chaque frame de production est complétée par un contrat d’écran dans le chapitre `13 – Contrats d’écran`. Le contrat constitue la checklist exécutable de développement et de recette de la frame concernée. Il identifie notamment :

- la frame Figma de référence et, lorsqu’elle est imposée, la ressource graphique exacte à utiliser ;
- les éléments obligatoires, leurs libellés exacts et leurs conditions de visibilité ;
- la source de chaque donnée affichée afin d’interdire les valeurs de démonstration codées en dur ;
- les contrôles, leurs zones tactiles, leurs états et leur résultat attendu ;
- les règles de layout propres à la frame, exprimées en relations adaptatives plutôt qu’en copie générale de coordonnées absolues ;
- les critères de conformité fonctionnelle, visuelle, technique et d’accessibilité ;
- les cas de recette qui doivent échouer lorsqu’un élément obligatoire manque, lorsqu’un contrôle ne produit pas son effet ou lorsque l’écran ne respecte pas sa structure.

Figma demeure la référence visuelle de la surface standard `402 × 874`. Le présent chapitre définit les comportements, la navigation et les règles adaptatives communes ; le chapitre 13 rend ces exigences vérifiables frame par frame. Les textes, noms, dates, durées et catégories visibles dans Figma sont des données de démonstration, sauf lorsqu’un contrat les déclare explicitement comme libellés statiques obligatoires.

Pour être déclaré conforme, un écran doit satisfaire simultanément son contrat, les règles communes du présent chapitre, les règles fonctionnelles et métier applicables, et les composants du Design System. Une simple ressemblance partielle avec la capture Figma ne suffit pas. À l’inverse, un choix d’implémentation peut différer des coordonnées absolues de la capture s’il respecte les relations de layout, les composants et le rendu attendu sur les largeurs de référence.

L’absence ou la substitution d’un logo, d’une icône, d’un texte ou d’un contrôle déclaré obligatoire est une non-conformité bloquante. Il en va de même pour une valeur métier codée en dur, une zone tactile inactive, une mauvaise destination de navigation, un chevauchement ou un contenu masqué par une zone fixe.

### Unités et largeur utile

- Les dimensions de l’interface sont exprimées en points logiques React Native (`dp` côté Android, points côté iOS), jamais en pixels physiques.
- La largeur minimale cible du MVP est `360` points. Les trois modes de référence Figma sont `Compact 360`, `Standard 402` et `Grand téléphone 440`. Les largeurs intermédiaires, notamment `390` et `430`, restent couvertes par la matrice de contrôle d’implémentation du chapitre 12 sans constituer des modes Figma supplémentaires.
- Jusqu’à `389` points, l’écran est considéré comme **compact** : la marge horizontale standard peut passer de `24` à `16` points.
- À partir de `390` points, la marge horizontale standard est de `24` points.
- Au-delà de `440` points, le contenu principal est centré avec une largeur maximale de `440` points ; l’interface spécifique tablette reste hors MVP.
- Les cartes, champs et boutons principaux occupent la largeur utile disponible. La largeur Figma de `354` points correspond à `402 − 2 × 24` et ne doit pas être codée en dur.

### Structure verticale standard et Screen Shells

Un écran standard est composé de trois zones indépendantes :

1. un en-tête placé sous la Safe Area supérieure ;
2. un contenu central, défilant lorsqu’il ne tient pas dans la hauteur disponible ;
3. selon le parcours, une navigation basse fixe ou une zone d’action finale fixe, complétée par la Safe Area inférieure.

Le contenu central ne doit jamais passer sous la navigation ou l’action finale. Son espacement inférieur comprend la hauteur réelle de l’élément fixe, l’inset système et au moins `16` points de respiration.

À la référence Figma `402 × 874`, ces zones sont matérialisées par les Screen Shells suivants :

| Shell               | Variante                         | Zones de référence                                                              |
| ------------------- | -------------------------------- | ------------------------------------------------------------------------------- |
| `Shell / Screen`    | `Context=On, Bottom=Navigation`  | Header `0–92` ; Context `92–207` ; Body `207–797` ; Bottom Navigation `797–874` |
| `Shell / Screen`    | `Context=Off, Bottom=Navigation` | Header `0–92` ; Body `92–797` ; Bottom Navigation `797–874`                     |
| `Shell / Screen`    | `Context=On, Bottom=Action`      | Header `0–92` ; Context `92–207` ; Body `207–790` ; Bottom Action `790–874`     |
| `Shell / Screen`    | `Context=Off, Bottom=Action`     | Header `0–92` ; Body `92–790` ; Bottom Action `790–874`                         |
| `Shell / Execution` | `Mode=Run`                       | Header `0–92` ; Content `92–782` ; Footer `782–874`                             |
| `Shell / Execution` | `Mode=Summary`                   | Header `0–92` ; Content `92–874`                                                |

Le `Shell / Modal Fullscreen`, utilisé par le parcours de planification, possède un gabarit interne `378 × 822` : Header `0–60`, Content `60–752`, Bottom Action `752–822`. Ces coordonnées décrivent la composition de référence dans Figma ; l’implémentation adapte les insets et la hauteur disponible au système sans déformer ni redimensionner proportionnellement le gabarit.

Tous les écrans et états représentés dans la page Figma `Prototype MVP` utilisent l’un de ces Shells. Le Splash constitue l’unique exception explicite.

### En-têtes

- Dans le gabarit Figma de référence, la région d’en-tête fixe mesure `92` points. Elle contient une zone utile de `48` points et la place réservée à la zone système de référence. À l’exécution, cette seconde partie est remplacée par l’inset supérieur réel ; la hauteur système n’est jamais codée en dur.
- Le titre d’écran utilise le token `type.screenTitle`, reste aligné sur la grille horizontale et peut occuper deux lignes sur un écran compact.
- Lorsqu’un bouton Retour est présent, sa cible tactile reste distincte du titre et mesure au minimum `48 × 48` points logiques sur toutes les plateformes du MVP.
- Une action placée à droite de l’en-tête conserve la même cible tactile minimale.
- La ligne de démarcation reste attachée au bas de l’en-tête, quelle que soit la hauteur de la Safe Area.

### Textes et contenus longs

- Les textes utilisateur autorisent l’agrandissement système.
- Un titre d’écran ou de modale peut passer sur deux lignes ; il n’est jamais tronqué silencieusement.
- Les noms de Séance et d’Exercice utilisent au maximum deux lignes dans une carte. Au-delà, ils sont tronqués avec une ellipse et leur contenu complet reste disponible dans l’écran de détail ou d’édition.
- Les libellés d’action ne sont pas réduits pour tenir. Un bouton principal peut augmenter sa hauteur ou son libellé peut passer sur deux lignes si nécessaire.
- Les valeurs numériques et leurs unités restent regroupées autant que possible ; elles ne doivent pas être séparées sur deux lignes de manière ambiguë.

### Boutons et zones tactiles

- Un bouton principal occupe la largeur utile, possède une hauteur minimale de `48` points et un rayon de `24` points.
- Un bouton secondaire compact peut avoir une hauteur visuelle de `32` points et un rayon de `16` points, mais il est placé dans une cible tactile d’au moins `48 × 48` points logiques sur toutes les plateformes du MVP.
- Une icône seule possède la même cible tactile minimale, même si son dessin est plus petit.
- Un champ, un contrôle segmenté ou une autre commande visuelle de `32` à `42` points conserve sa hauteur visuelle lorsqu’elle est intentionnelle. Son composant interactif utilise néanmoins un conteneur tactile ou un `hitSlop` portant sa cible effective à `48 × 48` au minimum, sans chevauchement avec une cible voisine.
- Deux actions adjacentes conservent au moins `8` points entre leurs cibles. Si elles ne tiennent plus, elles passent verticalement plutôt que de réduire leur surface tactile.
- Les états actif, pressé, désactivé, sélectionné et destructif utilisent les tokens sémantiques ; leur signification ne repose jamais uniquement sur la couleur.

### Contrôles segmentés

- Chaque option occupe une fraction égale de la largeur intérieure du contrôle, y compris lorsqu’une option est désactivée dans le MVP.
- Le fond sélectionné occupe exactement une option ; il ne doit jamais dépasser la moitié disponible dans un contrôle à deux options.
- Le libellé de chaque option est centré horizontalement et verticalement dans sa propre zone, et non par rapport au gabarit d’écran ou au contrôle complet.
- Les segments utilisent une mise en page flexible. Les largeurs et positions observées dans le gabarit `402` ne sont pas codées en dur.

### Navigation basse

- La région de navigation du Screen Shell mesure `77` points dans le gabarit `402 × 874`. Elle contient la barre principale visuelle de `66` points et la place réservée à l’inset inférieur de référence. À l’exécution, la navigation est positionnée avec l’inset inférieur réel, qui n’est jamais codé en dur.
- Sa largeur s’adapte à la largeur disponible. Les positions horizontales des quatre destinations ne sont pas codées depuis le gabarit Figma.
- Les quatre destinations principales `Catalogues`, `Calendrier`, `Suivi`, `Profil` occupent les quatre emplacements du composant de navigation. Aucun contrôle Recherche n’est présent dans le MVP (D-221/D-225).
- L’onglet actif peut afficher son libellé ; les autres conservent uniquement leur pictogramme. Le libellé actif ne doit pas chevaucher les pictogrammes voisins avec l’agrandissement du texte.
- Le composant canonique est `Navigation / Bottom — Source exact` (`2537:214`). Les destinations utilisent les variantes `2537:86` Catalogues, `2537:118` Calendrier, `2537:150` Suivi et `2537:182` Profil. Chaque dessin reste ≤ `24 pt`, centré dans une boîte optique `32 × 32 pt`, avec cible tactile ≥ `48 × 48 pt`. Aucun glyphe, emoji ou pictogramme système ne remplace ces vecteurs DSF.

### Listes et cartes

- Les listes utilisent toute la largeur utile et défilent verticalement.
- Deux cartes successives d’une liste compacte utilisent un écart de `8` points. Un regroupement chronologique de plusieurs cartes, notamment dans le Suivi, sépare ses groupes de dates de `16` points.
- Les cartes grandissent verticalement lorsque leur contenu passe sur plusieurs lignes ; aucune hauteur de carte contenant du texte variable n’est considérée comme fixe.
- Un groupe d’actions placé à droite d’une carte est ancré au bord droit intérieur de cette carte, avec une marge de `6` points. L’écart entre ses actions reste constant lorsque la carte s’élargit ; les actions ne sont ni distribuées sur la largeur de la carte ni positionnées depuis le bord de l’écran.
- Lors d’un glissement gauche contextuel, la carte suit visiblement le geste et révèle progressivement les actions placées derrière ; au seuil d’ouverture elle se stabilise ouverte. Une seule carte peut exposer simultanément ses actions. Les autres contrôles restent actifs. Un tap sur le fond ne referme pas la carte et un tap sur la surface principale d’une carte ouverte, hors actions, n’exécute rien. Seul un glissement droit commencé sur la carte ouverte la referme.
- Les états condensé et déployé conservent les mêmes marges horizontales.
- Après ajout, restauration, archivage ou suppression, la position de défilement reste stable lorsque cela ne masque pas le résultat de l’action.

### Formulaires, roulettes et clavier

- Les champs occupent la largeur utile et leurs libellés restent visibles lorsque la valeur est saisie.
- L’ouverture du clavier déplace ou fait défiler le contenu afin que le champ actif et l’action finale restent accessibles.
- Les contrôles disposés côte à côte restent horizontaux tant que chacun conserve sa largeur minimale lisible ; en mode compact, ils peuvent passer sur plusieurs lignes.
- Un cadre de synthèse ou d’aide occupe la largeur utile de son formulaire. Son texte utilise la largeur intérieure après déduction de ses marges internes et augmente la hauteur du cadre si plusieurs lignes sont nécessaires ; il ne peut ni dépasser horizontalement ni être masqué par une hauteur fixe.
- Toute roulette numérique ouverte est rendue dans une **modale basse standardisée**, indépendante de la position du déclencheur et du défilement du contenu. Un voile atténue le fond et bloque ses interactions ainsi que son défilement jusqu’à `Annuler` ou `Confirmer`. Une action principale fixe inférieure (`Continuer`, `Terminer`, etc.) conserve son apparence visuelle normale sous le voile, mais devient fonctionnellement et accessibilité-inactive jusqu’à fermeture de la roulette.
- La variante canonique `Type=Duration` mesure `330 × 203` points : barre d’actions supérieure de `53` points et zone de roulette native de `150` points. Les sélecteurs d’heure de la Planification conservent la géométrie propre à leur référence Figma, d’environ `310 × 201`, sans modifier les dimensions canoniques de `Type=Duration`.
- La barre d’actions place Annuler à gauche et Confirmer à droite. Chaque action possède une cible tactile de `48 × 48` points ; sa représentation est un cercle de `38 × 38`, gris neutre avec une croix sombre pour Annuler, bleu primaire avec une coche blanche pour Confirmer, contenant une icône `24 × 24`. Le conteneur de mise en page peut mesurer `48 × 53` pour conserver `7,5` points de respiration verticale autour du cercle : cette hauteur ne redéfinit pas la cible tactile, qui reste `48 × 48`. La barre est placée en haut conformément aux usages iOS : les actions sont identifiées avant le défilement et restent éloignées de l’indicateur d’accueil.
- La roulette conserve deux zones de sélection grises distinctes, une par colonne numérique. Chaque zone mesure `56 × 34` points, avec un rayon de `17`, et couvre uniquement les chiffres centrés. Les unités `min`, `s` ou `h` restent hors de ces zones, en gras, rapprochées de leur colonne et alignées verticalement sur la valeur centrée. Aucun cadre gris continu ni cadre bleu supplémentaire ne doit apparaître.
- Toucher une valeur ou la zone de sélection ne ferme pas la roulette. Le défilement modifie uniquement un brouillon local. Annuler ferme sans enregistrer ; Confirmer enregistre exactement les valeurs centrées puis ferme. Toute carte ou synthèse liée reste inchangée pendant le défilement et n’est actualisée qu’après confirmation. Une réouverture restitue la dernière valeur confirmée.
- Les durées utilisent la variante de roulette en modale basse du DSF. Conformément à D-219, les entiers simples `Nombre de Séries`, `Nombre de répétitions` et `Nombre de Tours` utilisent un stepper inline et n’ouvrent aucune roulette.

### Modales basses / bottom sheets

Les modales basses utilisent le gabarit DSF commun : en-tête de `60` points, zone utile de `378` points dans une largeur de référence `402`, avec `12` points de marge latérale de chaque côté. Le premier élément fonctionnel visible du contenu est placé à `spacing/modal-content-top-inset = 16` points sous l’en-tête. Le dernier élément fonctionnel visible conserve `spacing/modal-bottom-inset = 22` points avant le bas de la modale.

Ces insets sont des règles de composition du contenu et ne doivent pas être recalculés depuis la taille des zones tactiles. Lorsqu’un contrôle compact possède une cible tactile `48 × 48` plus grande que sa représentation visible, l’espacement vertical ou horizontal avec le contrôle voisin est mesuré entre les boîtes visuelles ; la zone tactile transparente ne constitue pas une marge supplémentaire. La hauteur de la modale suit son contenu et n’ajoute pas de vide structurel au-delà de ces insets, sous réserve de la limite maximale de hauteur de la famille.

### Gestion des référentiels dans les modales de sélection

Les modales `Étiquettes`, `Catégorie` et `Zones corporelles` utilisent la même règle de gestion :

- appui court sur une option : sélectionner ou désélectionner selon le contexte ;
- appui long sur une option : ne pas modifier sa sélection et ouvrir une modale de confirmation de suppression ;
- toutes les options sont supprimables, y compris celles fournies initialement par KODJO ;
- la modale de confirmation affiche le nom de l’option et propose `Annuler` à gauche et `Supprimer` à droite dans le ton destructif ;
- si l’option est utilisée, le message indique qu’elle sera retirée des objets courants concernés et que l’historique restera inchangé ;
- `Annuler` ferme la confirmation et restitue la modale de sélection sans changement ;
- `Supprimer` retire la valeur du référentiel, de la sélection courante et des associations courantes concernées, puis restitue la modale de sélection actualisée ;
- aucune restauration automatique d’une valeur initiale supprimée n’est effectuée.


### Dialogues d’action et modales plein écran

- Une décision contextuelle s’affiche dans un dialogue flottant centré, jamais dans une feuille ancrée au bas de l’écran. Le dialogue mesure `354` points de large, possède un rayon de `18` et une ombre ; le voile laisse le contexte visible mais non interactif.
- Sa hauteur est déterminée par son contenu. Le dernier paragraphe est séparé de la première ligne d’actions par `spacing/16`, soit `16` points, et la dernière action conserve un inset inférieur de `24` points.
- Une action destructrice et son action d’annulation ne doivent jamais être masquées par l’indicateur d’accueil ou le clavier.
- Avec deux choix, les boutons `147 × 48` sont alignés sur une ligne et séparés de `12` points. Avec trois choix, les deux décisions destructives occupent la première ligne ; `Annuler`, neutre, occupe seul la seconde ligne en pleine largeur `306 × 48`, avec `12` points d’écart vertical.
- Les libellés sont centrés horizontalement et verticalement dans leur cadre. Une action principale est bleue, une action destructive est rouge avec texte blanc et une action neutre est grise avec texte sombre.
- Le fond de contexte reste visible selon l’état Figma de référence, mais n’est pas interactif tant que la modale est ouverte.

### Exceptions adaptatives par famille d’écran

| Famille d’écran | Règle adaptative spécifique |
| --- | --- |
| Splash | Logo et textes sont centrés dans la zone sûre ; le logo conserve ses proportions et ne doit jamais être étiré. Aucun défilement n’est prévu. |
| Catalogue, Calendrier, Suivi, Profil | En-tête et navigation basse fixes ; seule la zone centrale défile. Les listes conservent un espace final d’au moins `16` points avant la séparation ou la navigation, en plus de l’inset inférieur applicable. |
| Composition, Exercice, Catégories, Planification | En-tête et action finale fixes ; le formulaire central défile. Avec le clavier ouvert, l’action reste atteignable sans recouvrir le champ actif. |
| Exercice | Aucun contrôle de type n’est affiché. Les accès `Catégorie` et `Zones corporelles`, le `Mode d’exécution` et la zone Média suivent le Figma courant. Le segment `Durée / Répétitions / À l’échec` utilise trois zones égales. Les rangées `Séries / cible / Pause` et `Changement de côté / Récupération / Durée totale` conservent leurs emplacements. La synthèse et l’action `Terminer` restent fixes. |
| Planification | `Aucun` et `Personnalisé` restent fixes aux extrémités du contrôle de rappel. Les raccourcis intermédiaires occupent une zone horizontale défilante et extensible. Le récapitulatif de planification reste contenu dans son cadre avec ses marges internes. |
| Calendrier Semaine | La barre des jours reste lisible sur la largeur compacte ; les sept jours se répartissent la largeur disponible sans défilement horizontal. La liste journalière défile verticalement, utilise `8` points entre ses cartes et s’arrête `16` points avant la séparation de navigation. |
| Calendrier Mois | Les sept colonnes se répartissent la largeur disponible ; une cellule peut grandir verticalement mais ne défile pas horizontalement. |
| Exécution | Les commandes essentielles restent visibles sans défilement à la taille de texte standard. Le libellé du temps écoulé est séparé de la progression par Tours de `24` points. Avec agrandissement accessible, le contenu peut défiler, mais l’Exercice courant, le temps et les commandes restent atteignables. |
| Synthèse | Le choix du ressenti reste composé de trois options de largeur égale. Les séparations verticales structurantes utilisent `16` points entre statut et date, `32` points avant la section Ressenti et `24` points avant la section Commentaire. Sur écran compact ou texte agrandi, les libellés explicatifs se placent sous les icônes sans réduire leur cible tactile. |
| Suivi | `Séances` et `Vue d’ensemble` occupent deux segments égaux. Le groupe `Filtrer / Trier` est centré comme un ensemble et précède la liste de `32` points. Les groupes de dates sont séparés de `16` points. Les actions de chaque carte restent ancrées à droite et la liste défile dans une zone arrêtée au moins `16` points avant la navigation basse. |
| Modales d’Exécution ou de suppression | Les actions passent en pile verticale si elles ne tiennent pas horizontalement ; l’ordre fonctionnel défini par le Figma est conservé. |

Ces règles communes prévalent sur les coordonnées des captures. Une exception non décrite doit être résolue avec les mêmes tokens et principes, puis ajoutée à ce chapitre si elle affecte le comportement utilisateur.

## Navigation principale et articulation des écrans

## Écran 0 – Splash KODJO

![[images/ecran-0-splash-kodjo.png|260]]

*Écran 0 — Splash KODJO — Figma `1992:469`*

Le splash affiche exactement `KODJO`, `Keep On. Do Just One.` et `Votre assistant du quotidien`. Il reste affiché 2,5 secondes puis ouvre automatiquement le `Catalogue des séances` avec une transition `DISSOLVE` de 0,3 seconde. Le type `Séances` est sélectionné ; le Catalogue présente l’état vide lorsqu’aucune Séance non archivée n’existe, sinon la liste par défaut alimentée par les données locales.

### Navigation principale

La navigation principale donne accès à quatre destinations :

- `Catalogues` ;
- `Calendrier` ;
- `Suivi` ;
- `Profil`.

`Catalogues` est le libellé permanent du premier onglet. Dans cet espace, les titres contextuels sont `Catalogue des séances`, `Catalogue des exercices` et `Catalogue des parcours`. Après le splash et après une relance complète, le Catalogue s’ouvre sur le segment `Séances`; le dernier segment utilisé n’est pas persisté entre deux lancements complets.

L’onglet `Calendrier` permet de visualiser les **Séances et Exercices planifiés** et d’accéder à la création et à la gestion des Routines.  
L’onglet `Suivi` permet de consulter les Exécutions enregistrées.  
L’onglet `Profil` permet d’accéder aux informations utilisateur et aux Préférences globales de l’application.

La barre de navigation principale utilise le composant DSF canonique décrit plus haut. L’onglet actif est matérialisé par la variante active correspondante ; aucune substitution par glyphe ou emoji système n’est autorisée.

### Parcours de création d’une Séance

Depuis `Catalogues`, segment `Séances`, l’utilisateur peut créer une Séance.

La création suit le parcours suivant :

1. saisie du nom et construction de la Composition dans l’écran unique `Composition d’une séance` ;
2. sélection facultative de l’Étiquette de Séance dans la modale intégrée ; la couleur de l’Étiquette devient la couleur de la Séance ;
3. ajout d’au moins un Exercice valide ;
4. action `Continuer` pour valider et enregistrer ;
5. retour au `Catalogue des séances`, segment `Séances`.

Aucune Routine n’est créée automatiquement. La transition canonique d’avancement fait entrer l’écran cible depuis la droite et sortir l’écran courant vers la gauche.

### Parcours du Catalogue des Exercices — MVP T03

Depuis le Catalogue, l’utilisateur sélectionne `Exercices` pour consulter la bibliothèque persistante. La surface d’une carte ouvre l’Exercice en consultation ou modification ; son bouton Lecture lance l’Exécution directe. L’action `Créer` est contextuelle : dans le Catalogue des Exercices, elle ouvre directement la création d’un Exercice persistant, sans écran ni arbre intermédiaire.

La rangée commune de commandes d’entrée est `Créer / Filtrer / Trier`. Le contrôle Filtrer démarre replié et blanc sans filtre. Un appui l’étend et affiche `Filtres / Aucun` sans modifier la liste ; un filtre sélectionné est conservé pendant la session courante, puis réinitialisé à `Aucun` au relaunch. Dans la référence Figma `402 pt`, chacun mesure visuellement `108 × 32 pt`, avec `8 pt` entre contrôles et un ensemble centré (`x=31`, `147`, `263` comme mesures de preuve uniquement, jamais comme coordonnées absolues RN). Les cibles tactiles restent ≥ `48 × 48 pt`. Pour `Exercices`, les critères contextuels sont statut (`Actives` / `Archivées`), Catégories et Zones corporelles. Pour `Séances`, le filtre couvre le statut et les Étiquettes. `Trier` reste visible mais désactivé et le tri appliqué reste `updatedAt DESC`. Filtre appliqué, tri implicite et scroll sont conservés pendant la session courante ; au relaunch, le filtre revient à `Aucun`. Aucune recherche Catalogue n’est incluse dans le MVP.

Depuis la Composition d’une Séance, `Ajouter un exercice` ouvre directement la sélection multiple du Catalogue des Exercices. La validation copie les Exercices dans leur ordre visible et restaure la Composition. La capacité historique de création directe d’un Exercice local à la Séance reste conservée fonctionnellement et techniquement mais n’est pas exposée dans ce parcours courant.

### Parcours d’ouverture et de modification d’une Séance

Dans le `Catalogue des séances`, toucher la zone principale d’une carte active ouvre directement la Séance en mode modification dans `Composition d’une séance`. Cette action est disponible que la carte soit condensée ou déployée.

Le déploiement de la carte est facultatif et sert uniquement à consulter rapidement son contenu.

Le chevron déploie ou replie la carte. La zone `Démarrer` lance le parcours d’Exécution. Ces zones tactiles conservent chacune leur comportement propre.

### Parcours d’Exécution

Ouvrir une Séance depuis le Catalogue, ou demander l’Exécution d’une occurrence depuis une Routine, ouvre d’abord l’écran d’Exécution.

L’ouverture de cet écran ne démarre pas immédiatement le premier Exercice.

L’utilisateur déclenche l’Exécution depuis l’écran lui-même. Le Compte à rebours initial est alors exécuté, s’il est configuré avec une durée supérieure à zéro, puis le premier Exercice commence.

Lorsque la Séance se termine, l’écran de synthèse est affiché. L’action `Terminer` ramène ensuite l’utilisateur au `Suivi`.

### Parcours de consultation du Suivi

Dans le MVP, le `Suivi` affiche la liste des Exécutions enregistrées.

La future `Vue d’ensemble` reste visible dans le sélecteur mais elle est grisée et inactive. Elle est prévue pour une version ultérieure.

Chaque carte peut être déployée individuellement pour consulter le détail de l’Exécution directement dans la liste.

Les commandes `Vue d’ensemble`, `Filtrer` et `Trier` sont visibles mais désactivées dans le MVP. Les fonctions correspondantes restent post-MVP. Cette règle du Suivi est distincte du Catalogue T03, où `Filtrer` est fonctionnel pour `Archivées` sur Exercices.

### Écrans principaux

Les écrans principaux du MVP sont :

1. `Profil` ;
2. `Catalogue des séances` ;
3. `Composition d’une séance`, incluant le nom et la couleur ;
4. `Création / modification d’un Exercice — Exercice` ;
5. numéro réservé — ancien écran autonome Récupération supprimé ;
6. `Étiquettes de la séance` dans la Composition ;
7. `Calendrier` ;
8. `Planifier un contenu` — Séance ou Exercice ;
9. `Exécution de séance`, incluant les états et commandes d’interruption ;
10. `Synthèse de séance` ;
11. `Suivi — Séances`.

Les écrans principaux ajoutés ou activés en T03 sont :

12. `Catalogue des Exercices — Liste` ;
13. supprimé — ancien `Catalogue — Créer — Arbre d’actions`, conservé uniquement comme évidence historique ;
14. `Composition — Sélectionner plusieurs Exercices existants` ;
15. `Création / modification d’un Exercice persistant`, qui réutilise l’éditeur d’Exercice ;
16. `Exécution directe d’un Exercice — Préparation 5 s` ;
17. `Exécution directe d’un Exercice — En cours` ;
18. `Synthèse d’un Exercice directe`, avant et après sélection du Ressenti.

La création/modification fonctionnelle d’un Parcours reste hors T03/MVP ; son segment et son entrée peuvent être visibles mais désactivés.

Les modales servent aux actions courtes réalisées sans quitter le contexte courant, notamment :

- confirmer l’abandon d’une création ;
- confirmer la suppression d’une Séance archivée ;
- gérer les options d’une Routine ;
- confirmer une suppression ;
- gérer les interruptions pendant l’Exécution.

### Retour et fermeture

En dehors d’une Exécution en cours, revenir à l’écran précédent ne nécessite pas de confirmation lorsque les modifications ont déjà été enregistrées ou lorsqu’aucune donnée temporaire ne risque d’être perdue.

La modale `Abandonner la création d’une séance` concerne la création en cours dans l’écran `Composition d’une séance`.

Pendant une Exécution, aucune sortie directe vers la navigation principale n’est proposée. L’arrêt de la Séance est accessible uniquement après mise en pause.

### Conservation du contexte

L’application conserve autant que possible le contexte de l’utilisateur :

- la Séance précédemment consultée ;
- l’état déployé ou replié d’une carte tant que l’utilisateur reste dans la vue concernée ;
- l’Exercice et la Série en cours pendant une Exécution ;
- la position dans le Suivi.

Après la fermeture d’une modale, l’utilisateur retrouve le contexte depuis lequel elle a été ouverte.

### Enregistrement automatique

Les modifications d’objets existants sont enregistrées automatiquement lorsque l’écran ne prévoit pas explicitement une action `Valider`, `Terminer` ou `Enregistrer`.

Les écrans de création ou les modales comportant une action explicite ne valident les données qu’après cette action.

### Navigation pendant une Exécution

Pendant l’Exécution, la navigation principale n’est pas affichée.

L’utilisateur dispose de trois commandes principales :

- `Réinitialiser l’exercice` ;
- `Pause` ;
- `Exercice suivant`.

Il n’existe pas de bouton `Quitter` ou `Arrêter` directement sur l’écran d’Exécution. L’action `Arrêter la séance` est accessible uniquement depuis la modale de pause.

L’utilisateur ne peut pas revenir à un Exercice déjà exécutée.

### Cohérence des libellés

Les mêmes termes sont utilisés dans toute l’application :

- `Séance` : contenu complet d’un entraînement ;
- `Routine` : planification d’une Séance ou d’un Exercice persistant ;
- `Exercice` : action élémentaire exécutée en mode Durée, Répétitions ou À l’échec, avec Pause entre Séries et, en bilatéral, Pause au changement de côté éventuelle ;
- `Exercice` : Exercice physique ;
- `Pause au changement de côté` : durée intrinsèque facultative d’un Exercice bilatéral, exécutée une seule fois entre le premier et le second côté ;
- `Récupération après exercice` : durée contextuelle portée par chaque occurrence d’Exercice dans une Séance/Parcours, visible y compris à `0 s` et exécutée après l’occurrence lorsqu’elle est positive ;
- `Série` : répétition propre à un Exercice ;
- `Tour` : groupe ordonné d’Exercices exécuté intégralement un nombre défini de fois ;
- `Cycle` : structure technique unique, fixée à une répétition et jamais affichée dans le MVP ; elle ordonne les Exercices placés avant le Circuit, le Tour et les Exercices placés après le Circuit ;
- `Exécution de séance` : réalisation effective d’une Séance.

## Écran 1 – Profil

![[images/ecran-1-profil.png|260]]

*Écran 1 — Profil — Vue d’ensemble (Vibration désactivée) — Figma `1992:375`*

L’écran de modification du Profil est illustré par :

![[images/ecran-1a-modifier-profil.png|260]]

*Écran 1a — Profil — Modifier le profil — Figma `1992:778`*

### États Figma de référence

Les états complémentaires suivants font partie de la référence de développement :

| N° | État | Capture | Règle matérialisée | Node Figma |
| --- | --- | --- | --- | --- |
| Écran 1b | Vibration activée | ![[images/ecran-1b-profil-vibration-activee.png\|220]] | Valeur initiale fonctionnelle de la préférence `Vibration` | `1992:684` |
| Écran 1c | Sélecteur du compte à rebours | ![[images/ecran-1c-profil-compte-rebours-ouvert.png\|220]] | Choix intégré des secondes, avec `10 s` sélectionné | `1992:474` |
| Écran 1d | Sélecteur de fin de séance | ![[images/ecran-1d-profil-fin-seance-ouverte.png\|220]] | Choix intégré des secondes, avec `5 s` sélectionné | `1992:579` |
| Écran 1e | Profil d’un parcours encore vide | ![[images/ecran-1e-profil-parcours-vide.png\|220]] | Présentation du Profil avant que l’utilisateur ait créé du contenu | `2139:86` |
| Contrôle 1f | Compte à rebours d’Exercice | — | Valeur globale proposée pour le Compte à rebours propre d’une nouvelle Exercice ; pas de frame plein écran distincte | `4179:9550` |
| Contrôle 1g | Fin d’exercice | — | Valeur globale proposée pour la Fin propre d’une nouvelle Exercice ; pas de frame plein écran distincte | `4179:9556` |

### Objectif

Permettre à l’utilisateur de consulter les informations générales de son compte et de définir les préférences globales de l’application.

### Contenu

L’écran comporte notamment :

- l’avatar ou les initiales, le nom d’affichage et l’action `Modifier` ;
- `Sons` ;
- `Annonces vocales` ;
- `Vibration` ;
- la durée par défaut du `Compte à rebours initial` ;
- la durée par défaut de la `Fin de séance` ;
- le `Compte à rebours d’exercice` ;
- la `Fin d’exercice` ;
- `Notifications` et rappels.

Les préférences de Compte à rebours initial et de Fin de séance servent de valeurs proposées lors de la création d’une nouvelle Séance. Elles restent modifiables au niveau de chaque Séance. Les contrôles Figma `4179:9550` et `4179:9556` matérialisent de la même manière le Compte à rebours d’Exercice et la Fin d’exercice pour les nouvelles Exercices ; ces phases restent modifiables au niveau de chaque Exercice.

Les valeurs initiales de l’application sont `10 s` pour le Compte à rebours initial, `5 s` pour la Fin de séance et `activée` pour Vibration. L’état désactivé montré dans le parcours Figma illustre une modification utilisateur et ne définit pas la valeur initiale.

Le feedback haptique des roulettes est systématique dans le MVP et reste indépendant de la préférence `Vibration`, réservée aux vibrations fonctionnelles de séance.

Le MVP est disponible uniquement en français et n’affiche aucun sélecteur de langue. Tous les textes destinés à l’utilisateur sont référencés par des clés de traduction centralisées, sans texte fonctionnel codé directement dans les écrans. Les traductions futures peuvent ainsi être ajoutées sans modifier les composants. Les pluriels, variables, dates, heures, nombres, notifications et libellés d’accessibilité utilisent également ce mécanisme d’internationalisation.

### Comportement

Les préférences sont enregistrées immédiatement. L’écran `Modifier le profil — MVP` permet de modifier la photo et le nom d’affichage, puis demande une action explicite `Enregistrer`.

Les préférences ne modifient pas rétroactivement les Séances existantes ni une Exécution déjà en cours.

Les notifications ne sont pas autorisées par défaut. La demande d’autorisation du système d’exploitation est présentée lorsque l’utilisateur active pour la première fois un rappel lors d’une planification. En cas de refus, le rappel n’est pas activé et l’application indique que l’autorisation peut être modifiée dans les réglages du système.

### Navigation

L’écran est accessible depuis l’onglet **Profil** de la barre de navigation inférieure.

Il s’agit d’un onglet principal : aucun bouton `Retour` spécifique n’est nécessaire pour revenir à un autre onglet.

## Écran 2 – Catalogue des séances

![[images/ecran-2-catalogue-seances.png|260]]

*Écran 2 — Catalogue des séances — Liste par défaut — Figma `1992:9910`*


### États Figma de référence

| N° | État | Capture | Règle matérialisée | Node Figma |
| --- | --- | --- | --- | --- |
| Écran 2b | Séance déployée | ![[images/ecran-2b-catalogue-seance-deployee.png\|220]] | Consultation de la Composition sans quitter le Catalogue | `1992:10014` |
| Écran 2d | Carte condensée avec actions | ![[images/ecran-2d-catalogue-condense-actions.png\|220]] | La carte se déplace avec le glissement et révèle `Planifier`, `Dupliquer` et `Archiver` derrière | `1992:10518` |
| Écran 2e | Carte déployée avec actions | ![[images/ecran-2e-catalogue-deployee-actions.png\|220]] | Même convention de glissement avec déplacement réel de la carte | `1992:10628` |
| Écran 2f | Liste des Séances archivées | ![[images/ecran-2f-catalogue-archivees.png\|220]] | Contexte dans lequel restauration et suppression deviennent disponibles | `4549:6742` |
| Écran 2g | Séance restaurée | ![[images/ecran-2g-catalogue-seance-restauree.png\|220]] | Snackbar de restauration et action `Annuler` | `1992:10848` |
| Écran 2h | Catalogue après archivage | ![[images/ecran-2h-catalogue-apres-archivage.png\|220]] | Résultat attendu après retrait de `Renforcement du genou` de la liste active | `1992:10937` |
| Écran 2i | Filtres — panneau ouvert | — | Modale de filtres contextuels Séances : statut et Étiquettes | `4168:11149` |
| Écran 2j | Filtre inactif étendu | — | État `Filtres / Aucun`, liste inchangée | `4549:6382` |
| Écran 2k | Filtre actif `Archivées` | — | État actif du contrôle et liste filtrée | `4549:6742` |

Référence complémentaire de variante d’actions glissées : `4592:6217 — Catalogue des séances — Liste condensée — actions glissées — Dos et mobilité`. Cette frame matérialise le même contrat d’actions que l’Écran 2d et ne crée pas un nouvel écran fonctionnel.

### Objectif

Permettre à l’utilisateur de consulter son Catalogue de Séances, de le filtrer et le trier selon les fonctions disponibles, de créer une nouvelle Séance et d’accéder rapidement à la modification, à l’Exécution, à la consultation détaillée ou aux actions de gestion.

Cet écran constitue l’accueil de l’application.

### Filtres

Les Catalogues du MVP ne comportent aucune recherche globale ni recherche locale. Les filtres restent contextuels au Catalogue et suivent les règles décrites ci-dessous.

Les Séances archivées restent exclues de la liste active et ne sont accessibles que par le mécanisme de filtrage prévu. T03 n’invente aucune option de filtre supplémentaire propre aux Séances au-delà de ce qui est explicitement arbitré.

### Carte de Séance — vue condensée

Chaque carte affiche notamment :

- le nom de la Séance ;
- sa seconde ligne de métadonnées sous la forme `Étiquette · Catégorie` selon les données disponibles et le rendu Figma courant ;
- le nombre d’Exercices ;
- sa durée synthétique des Exercices, qui exclut toujours le Compte à rebours initial et la Fin de séance ;
- le nombre de Tours du Circuit (`xN`) ;
- la prochaine occurrence planifiée lorsqu’elle existe ;
- un chevron de déploiement ;

Les Séances sont présentées par défaut selon leur date de dernière modification, de la plus récente à la plus ancienne. Une exécution ne modifie pas cet ordre.

### Actions sur une carte

La carte distingue trois zones d’action :

- **zone principale de la carte** : ouvre la Séance en mode modification ;
- **chevron** : déploie ou replie la carte sans ouvrir l’Exécution ;
- **zone `Démarrer`** : ouvre l’écran initial d’Exécution.

La zone principale constitue une cible tactile large. Il n’est pas nécessaire d’afficher un bouton ou une icône `Ouvrir`.

### Carte de Séance — vue déployée

Le déploiement est facultatif et permet de consulter les Exercices de la Séance sans changer d’écran.

La zone principale de la carte conserve la même action que dans la vue condensée : elle ouvre la Séance en mode modification. Le chevron sert uniquement à déployer ou replier la carte et la zone `Démarrer` ouvre l’écran initial d’Exécution.

Aucun bouton `Ouvrir` n’est affiché dans la vue déployée.

Chaque ligne d’Exercice présente :

- le nom de l’Exercice à gauche ;
- un groupe compact aligné à droite sous la forme `durée/reps · xN`.

`xN` n’est affiché que lorsque le nombre de Séries est supérieur à 1. En mode Répétition, l’abréviation `reps` est utilisée.

Exemples : `12 reps · x3`, `45 s · x2` ou simplement `30 s` lorsque le nombre de Séries vaut 1.

### Création d’une Séance

Toucher l’action de création ouvre `Composition d’une séance`, qui réunit le nom, l’Étiquette/couleur et la Composition.

La création suit ensuite le parcours défini dans la section de navigation générale. `Continuer` valide la Séance ; l’ancien écran autonome de classification de la Séance n’est plus utilisé en sortie de Composition.

### Actions secondaires

Sur une Séance active, un glissement gauche déplace visiblement la carte et révèle progressivement `Planifier`, `Dupliquer` et `Archiver` placés derrière. Au seuil d’ouverture, la carte se stabilise. Une seule carte peut exposer ses actions à la fois ; un glissement droit ne referme le contexte que s’il commence sur la carte ouverte.

Depuis le résultat du filtre `Archivées`, `Restaurer` affiche un snackbar `Séance restaurée` avec l’action `Annuler`.

### Suppression d’une Séance

Une Séance non archivée ne peut pas être supprimée. Elle doit d’abord être archivée.

Depuis le résultat du filtre `Archivées`, un glissement gauche déplace la carte et révèle l’action `Supprimer` placée derrière. L’action ouvre une modale de confirmation sur le fond de la liste archivée.

La suppression demande toujours une confirmation explicite. Si des Routines utilisent la Séance, le message précise qu’elles seront également supprimées.

Après confirmation :

- la Séance est supprimée ;
- toutes les Routines qui la référencent sont supprimées ;
- les occurrences futures cessent d’être calculées ;
- les Exécutions déjà enregistrées restent conservées dans le Suivi grâce à leur Instantané.

### Archivage

L’archivage retire la Séance de la liste principale.

Si aucune Routine n’est associée, l’archivage est immédiat et ne demande pas de confirmation. Un snackbar `Séance archivée` est affiché avec l’action `Annuler`. `Annuler` restaure immédiatement la Séance dans la liste active.

Si la Séance est utilisée par une ou plusieurs Routines, une confirmation explicite est demandée avant l’archivage ; après confirmation, toutes les Routines associées sont supprimées. Dans ce cas, aucun snackbar `Séance archivée` avec `Annuler` n’est affiché.

La restauration d’une Séance archivée ne restaure aucune ancienne Routine.

Une Séance archivée est consultable mais ne peut être ni modifiée, ni exécutée, ni planifiée. Elle peut être restaurée ou supprimée depuis le résultat du filtre `Archivées`.

### Séance vide

Le MVP ne comporte pas de statut `Brouillon`.

Une Séance existe dès validation de son nom et de sa couleur.

Tant qu’elle ne contient aucun Exercice :

- elle peut être modifiée, archivée ou supprimée ;
- elle ne peut pas être exécutée.

### État vide

![[images/ecran-2i-catalogue-vide.png|260]]

*Écran 2i — Catalogue des séances — État vide — Figma `2117:86`*

Si aucune Séance n’a encore été créée, l’écran affiche : `Vous verrez ici la liste de vos séances dès que vous aurez commencé à les créer.` Il présente également l’action permettant de créer la première Séance.

Le filtre `Archivées` possède également un état vide lorsque aucune Séance n’est archivée. Il conserve l’en-tête et les commandes du Catalogue, remplace la liste par un message d’absence de Séance archivée et ne propose pas d’action de suppression ou de restauration.


Ces deux états sont fonctionnellement requis mais ne possèdent pas de frame dédiée dans le `Prototype MVP`. Ils réutilisent le composant d’état vide et la structure de leurs écrans parents ; aucune capture non issue de Figma n’est créée.

## Écran 3 – Composition d’une séance

![[images/ecran-3-composition-seance.png|260]]

*Écran 3 — Composition d’une séance — Figma `2028:11700`*

L’état révélant les actions d’un Exercice est illustré par :

![[images/ecran-3a-composition-actions-glissees.png|260]]

*Écran 3a — Composition — Actions glissées — Figma `2028:11808`*

### États Figma de référence

| N° | État | Capture | Règle matérialisée | Node Figma |
| --- | --- | --- | --- | --- |
| Écran 3b | Composition initiale | ![[images/ecran-3b-composition-etat-initial.png\|220]] | Nom vide, Tour initial avec synthèse intégrée et action principale désactivée | `2028:11137` |
| Écran 3c | Nom renseigné | ![[images/ecran-3c-composition-nom-renseigne.png\|220]] | Le nom seul ne suffit pas à activer `Continuer` | `2028:12003` |
| Écran 3d | Étiquettes ouvertes | — | Sélection de l’Étiquette ; la couleur de la Séance est celle de l’Étiquette | `2028:11204` |
| Écran 3e | Compte à rebours ouvert | ![[images/ecran-3e-composition-compte-rebours-ouvert.png\|220]] | Réglage minutes/secondes avec Annuler et Confirmer circulaires | `2028:11375` |
| Écran 3f | Fin de séance ouverte | ![[images/ecran-3f-composition-fin-seance-ouverte.png\|220]] | Réglage indépendant avec Annuler et Confirmer circulaires | `2028:11457` |
| Écran 3g | Nombre de Tours | ![[images/ecran-3g-composition-nombre-tours.png\|220]] | Stepper inline ; aucune modale/roulette | `2028:11580` |
| Écran 3h | Appui long — carte soulevée | ![[images/ecran-3h-composition-appui-long.png\|220]] | État transitoire précédant et accompagnant le déplacement d’un Exercice | `3518:4576` |
| Écran 3i | Point d’arrêt | — | Point d’arrêt inséré dans la Composition, sans écran dédié ; élément déplaçable | `3722:5061` |
| Écran 3j | Nouvelle étiquette | — | Création d’une Étiquette depuis la modale | `4640:6308` |
| Écran 3k | Étiquette sélectionnée | — | Étiquette et couleur visibles dans la Composition | `4581:6404` |
| Écran 3l | Étiquette — confirmation de suppression | — | Appui long sur une Étiquette ; confirmation destructive `Annuler / Supprimer` | `4861:6145` |

### Objectif

Permettre à l’utilisateur de définir la structure et l’ordre d’Exécution d’une Séance.

L’écran de Composition ne lance pas directement l’Exécution.

### Structure affichée

La Composition est présentée comme une structure hiérarchique ordonnée et non comme un parcours de type niveaux.

Elle comprend dans le MVP :

- un `Compte à rebours initial` ;
- zéro, une ou plusieurs Exercices placés avant le Circuit ;
- un `Tour` unique, qui peut lui-même contenir des Exercices ;
- zéro, une ou plusieurs Exercices placés après le Circuit ;
- une `Fin de séance`.

Le Compte à rebours initial et la Fin de séance sont des éléments structurels obligatoires et ne constituent pas des Exercices. Ils sont non déplaçables : aucun appui long ni aucune poignée de déplacement ne leur est associé.

Le modèle conserve un Cycle technique unique dont le nombre de répétitions vaut toujours 1. Il n’est jamais affiché ni modifiable dans le MVP.

### En-tête

L’écran affiche notamment :

- le champ `Nom de la séance` ;
- l’accès à la modale `Étiquettes` ;
- l’Étiquette sélectionnée, lorsqu’elle existe, affichée sous le nom de la Séance ;
- le résumé `N exercice(s) · durée des Exercices`, intégré sous `Nombre de tours` dans le conteneur Circuit.

Le champ `Nom de la séance` mesure `354 × 42`. Son fond reste transparent. Lorsqu’une Étiquette est sélectionnée, sa couleur devient la couleur affichée de la Séance ; il n’existe pas de palette de couleur indépendante de l’Étiquette dans le parcours courant.

L’ouverture de la modale Étiquettes conserve la Composition en arrière-plan et ne modifie aucune autre valeur tant qu’une sélection ou création n’est pas validée.

### Paramètres du Tour

L’icône affichée à gauche de `Nombre de tours` est exclusivement une instance de `Icon / Tour` (`3066:4685`). Son dessin canonique est celui validé dans `Composition séance — Nom saisi` (`2028:12003`) ; l’ancienne sous-référence graphique supprimée n’est plus utilisée comme preuve active : cadre visuel `18 × 18`, quatre tracés, trait `1,35`, couleur `color.textPrimary` (`#141414`). Les copies vectorielles locales et l’ancien pictogramme Tour ne sont pas autorisés. L’actif exportable correspondant est uniquement `assets/icons/icon-tour.svg`, clé de registre `icon.tour`.

Le Circuit possède un nombre de Tours compris entre **1 et 99**, avec **1** comme valeur par défaut.

Dans l’interface, le nombre est affiché sans préfixe `x` ni signe `×`, dans un contrôle compact placé à droite du bloc de textes. Le bord droit du contrôle est aligné avec le bord droit des cartes d’Exercice. Ce bloc affiche `Nombre de tours`, puis immédiatement dessous la synthèse calculée `N exercice(s) · X min`. Cette synthèse compte uniquement les Exercices et additionne uniquement leurs durées déterminables ; elle exclut toujours le `Compte à rebours initial` et la `Fin de séance`, éléments structurels hors Circuit. La synthèse reprend le format du sous-libellé d’une carte : Inter Regular `11/13`, couleur secondaire et espacement vertical de `4` points sous le titre. Le bloc de textes est centré verticalement avec le sélecteur `66 × 34` ; le carré violet mesure `28 × 28` et conserve `3` points de marge en haut, à droite et en bas. L’icône du sélecteur reprend strictement la couleur de la référence `Nouvelle séance — Nom renseigné` (`2028:12003`, vecteur `2028:12051`, `#CDCEFA`). Aucun chevron de repli pointant vers le haut n’est affiché dans cet en-tête.

La synthèse n’est plus affichée isolément au bas de l’écran. Elle est recalculée uniquement après une modification validée qui affecte les Exercices ou le nombre de Tours. La confirmation du `Compte à rebours initial` ou de la `Fin de séance` actualise seulement le jalon structurel concerné et ne modifie jamais cette synthèse. Celle-ci reste attachée au conteneur Circuit dans ses états applicables.

Le contrôle du nombre de Tours est un stepper inline : les actions d’incrément/décrément modifient directement le brouillon de Composition dans les bornes `1..99`; aucune modale de roulette n’est ouverte.

### Retour haptique des roulettes

Toute roulette numérique de l’application produit un retour haptique léger et bref à chaque franchissement effectif d’un cran, c’est-à-dire à chaque changement de la valeur sélectionnée. Un seul retour haptique est déclenché par changement de valeur. Ce retour est systématique et indépendant du réglage `Vibration` du Profil, qui ne pilote que les vibrations fonctionnelles de séance.

### Ajout d’un Exercice

Un seul bouton secondaire `+ Ajouter un exercice` est affiché en haut de l’écran de Composition.

Aucun bouton `＋` intermédiaire n’est affiché dans le Circuit ou entre les Exercices.

Un appui sur `Ajouter un exercice` ouvre directement la sélection multiple des références persistantes du Catalogue. La validation est désactivée lorsque la sélection est vide et les Exercices validées sont insérées dans l’ordre courant de la liste filtrée, non dans l’ordre des touchers. Le mécanisme de création directe d’un Exercice local à la Séance est conservé dans le produit mais n’est pas proposé par l’enchaînement d’écrans courant.

Le premier Exercice créé est inséré immédiatement après le Compte à rebours initial et avant le Circuit. Les Exercices suivants sont insérés après le dernier Exercice ajouté, dans la même zone. L’utilisateur peut ensuite les déplacer manuellement avant le Circuit, dans le Circuit ou après le Circuit. La réorganisation est déclenchée par un appui long sur l’ensemble de la carte ; la poignée reste un indicateur visuel et ne constitue pas la seule zone de déclenchement.

La poignée de chaque carte d’Exercice est exclusivement une instance du composant DSF `Icon / Structure / Movable` (`3066:4676`) : dessin `20 × 20` centré dans un slot `28 × 28`, opacité `50 %`, couleur `color.iconNeutral`. Le dessin local historique `icon/réorganiser` en `16 × 16` et l’application du token `icon.compact` à cette poignée sont interdits.

Le MVP ne propose pas de menu d’ajout rapide `Pause 15 s / 30 s / 45 s`.

Chaque occurrence possède explicitement `postActivityRecoverySeconds`, initialisé depuis le défaut global. La valeur `0 s` reste affichée dans la Composition ; une phase `POST_ACTIVITY_RECOVERY` chronométrée n’est créée que si cette valeur est positive.

Si deux Exercices s’enchaînent sans Pause entre Séries et avec une récupération après exercice à `0 s`, un avertissement discret et non bloquant peut être affiché selon la règle existante.

### Résumé de la ligne d’un Exercice (D-095)

La ligne d’un Exercice dans la Composition affiche :

- le nom de l’Exercice ;
- sa Catégorie suivie de ses Zones corporelles, sur une ligne dédiée ; la Catégorie porte sa couleur sémantique et les valeurs sont séparées par ` · ` ;
- un résumé compact de sa configuration essentielle (nombre de Séries, Durée, Répétitions ou À l’échec, Pause entre Séries).

La Description ne figure jamais dans la ligne. Les Zones corporelles ne sont pas intégrées au résumé de configuration : elles sont affichées séparément entre le nom et ce résumé. Une ligne légère `Récupération X min Y s` est affichée immédiatement sous chaque occurrence, y compris lorsque la valeur vaut `0 s`. Elle constitue la représentation de `postActivityRecoverySeconds` et accompagne le bloc fonctionnel de l’occurrence.

Format :

- mode Durée : `N série(s) de X min Y s avec Z min Y s de pause par série` ;
- mode Répétitions : `N série(s) de X répétition(s) avec Z min Y s de pause par série` ;
- mode À l’échec : `N série(s) jusqu’à l’échec, avec Z s de pause entre les séries` ; le nom, déjà affiché séparément sur la ligne, n’est pas répété. La proposition relative à la pause est omise lorsque la pause vaut zéro ou lorsqu’une seule Série ne crée aucun intervalle entre Séries.

La clause de pause est entièrement omise lorsque la Pause vaut `0 s` ou lorsqu’une seule Série ne crée aucun intervalle. La Récupération est affichée dans sa carte attachée et intégrée aux durées calculées, mais elle n’augmente pas le nombre d’Exercices. Les segments minutes ou secondes nuls d’une durée sont omis (`45 s`, `1 min`), jamais affichés comme `0 min` ou `0 s`. Le singulier/pluriel de `série`/`répétition` s’accorde à la valeur.

Exemples : `3 séries de 1 min 30 s avec 15 s de pause par série` ; `3 séries de 12 répétitions avec 20 s de pause par série` ; `1 série de 45 s`.

### Consultation et modification d’un Exercice

Un appui court sur une carte Exercice ouvre directement son parcours de modification. Un appui long sur l’ensemble du bloc Exercice–Récupération déclenche sa réorganisation sans ouvrir la modification. Un glissement gauche déplace le bloc avec le geste et révèle progressivement les actions `Dupliquer` et `Supprimer` placées derrière. `Dupliquer` crée un Exercice de Séance indépendante avec un nouvel identifiant, reprend tous les paramètres de la source, y compris Pause et Récupération, la nomme `{nom} (copie)` puis `{nom} (copie 2)`, etc., sans collision, et l’insère immédiatement après la source dans la même zone structurelle. Cette action ne crée aucun Exercice dans le catalogue. `Supprimer` retire le bloc du brouillon ; la suppression n’est persistée qu’avec l’enregistrement final de la Séance et l’abandon restitue la version persistée.

Dans l’état Figma `Composition d’une séance — actions glissées` (`2028:11808`), la carte/bloc suit le geste. L’action `Dupliquer` reprend son rayon DSF et un espace visuel sépare son bord gauche de la portion encore visible de la carte, laissant apparaître le fond du conteneur Circuit. Aucun overlay immobile ne remplace ce mouvement réel.

### Réorganisation

Les Exercices peuvent être réorganisées dans leur zone ou déplacées par glisser-déposer avant le Circuit, dans le Circuit ou après le Circuit. Le geste commence par un appui long sur le bloc complet ; l’occurrence et sa ligne de Récupération après exercice passent ensemble dans l’état soulevé, puis suivent le glissement jusqu’à une position de dépose valide. Un toucher court conserve son comportement d’ouverture de l’Exercice en modification. Le déplacement conserve l’identifiant et tous les paramètres, met à jour la position structurelle et renumérote continûment les positions de chaque zone. Il ne persiste rien avant l’enregistrement final.

L’état Figma `Composition d'une séance — Appui long — carte soulevée` (`3518:4576`) matérialise ce retour visuel. Avec Récupération, le bloc actif passe de `354 × 93` à `362 × 97`, reste centré dans la section (`x = 6`, contre `x = 10` au repos), utilise le fond bleu très clair `#F7F7FF`, un contenu atténué, un contour `1` point `#D1D1D6`, un rayon `12` et une ombre périphérique `#14171F` à `22 %`, décalage `0 / 0`, flou `10`, étalement `2`. L’ombre et le contour entourent l’Exercice et sa Récupération. Les autres cartes et éléments structurels restent inchangés.

La poignée `Icon / Structure / Movable` reste l’indice visuel du caractère déplaçable, mais le geste d’activation porte sur la carte. L’état soulevé est uniquement transitoire : il ne modifie ni l’ordre ni la position structurelle avant la dépose.

Le Tour reste structurel. Le Compte à rebours initial et la Fin de séance sont explicitement non déplaçables, sans appui long ni poignée de déplacement.

### Validation de la Composition

L’écran ne comporte pas de bouton `Démarrer`.

L’action `Continuer` valide la Composition. Elle reste désactivée tant que le nom n’est pas renseigné ou que la Composition ne contient pas au moins un Exercice valide. L’Étiquette est facultative ; lorsqu’elle est sélectionnée, sa couleur devient celle de la Séance.

En création comme en modification, l’Étiquette de la Séance est gérée depuis la Composition par la modale `Étiquettes`. L’Étiquette sélectionnée est affichée sous le nom de la Séance et porte sa couleur.

La Séance n’est exécutable que si elle contient au moins un Exercice valide.

### Enregistrement

Les modifications internes sont conservées au fur et à mesure, sous réserve des validations explicites prévues par les écrans d’édition.

## Écran 4 – Création / modification d’un Exercice

![[images/ecran-4-creation-activite-duree.png|260]]

*Écran 4 — ancienne structure de référence — Figma `3542:4656`*

La structure visuelle courante de l’éditeur d’Exercice est portée par les frames Figma de la série `4217:*` à `4734:*` listées ci-dessous. Elles supersèdent l’ancienne organisation visuelle `3542:4656` pour l’implantation de l’écran, sans modifier les règles métier des paramètres d’exécution. Les accès `Catégorie` et `Zones corporelles` sont distincts, la zone Média reste sous la Synthèse en cas de chevauchement, et toutes les roulettes utilisent une modale basse standardisée.

### États Figma de référence

La frame `3542:4656` et plusieurs états `3553:*` / `3580:*` sont des références historiques de l’ancienne organisation. Les références actives de l’éditeur sont les frames `4217:*`, `4279:*`, `4294:*`, `4332:*`, `4474:*`, `4478:*`, `4683:*` et `4734:*` listées ci-dessous. Les anciens états de calcul restent utiles à la traçabilité des règles métier, mais leurs nodes supprimés ne constituent plus des références visuelles courantes.

| N° | État | Capture | Règle matérialisée | Node Figma |
| --- | --- | --- | --- | --- |
| Écran 4a | Mode Répétitions | ![[images/ecran-4a-creation-activite-repetitions.png\|220]] | Copie historique ; règle fonctionnelle v10.2 = `Durée totale ≥ {estimation}` fondée sur 2 s par répétition | `3561:4695` |
| Écran 4b | Mode À l’échec | ![[images/ecran-4b-creation-activite-a-l-echec.png\|220]] | Aucun objectif chiffré ; aucune Durée totale affichée dans le texte éditable | `3561:7802` |
| Écran 4c | Durée ouverte | ![[images/ecran-4c-creation-activite-duree-ouverte.png\|220]] | Roulette compacte minutes/secondes avec validation explicite | `3556:7645` |
| Écran 4d | Pause ouverte | ![[images/ecran-4d-creation-activite-pause-ouverte.png\|220]] | Réglage de la Pause entre Séries avec validation explicite | `3556:7712` |
| Écran 4e | Nombre de Séries — stepper | ![[images/ecran-4e-creation-activite-series-ouvert.png\|220]] | Stepper inline ; aucune modale/roulette | `3556:7801` |
| Écran 4f | Répétitions — stepper | ![[images/ecran-4f-creation-activite-repetitions-ouvert.png\|220]] | Stepper inline ; aucune modale/roulette | `3561:7673` |
| Écran 4g | Description déployée | ![[images/ecran-4g-creation-activite-description.png\|220]] | Copie documentaire historique ; comportement Description toujours valide | ancien node supprimé |
| Écran 4h | Zone corporelle déployée | ![[images/ecran-4h-creation-activite-zone-corporelle.png\|220]] | Copie documentaire historique ; la sélection courante utilise `4478:7209` | ancien node supprimé |
| Écran 4i | Séries pilote | ![[images/ecran-4i-creation-activite-series-pilote.png\|220]] | Copie documentaire historique ; règle de calcul toujours valide | ancien node supprimé |
| Écran 4j | Durée totale pilote | ![[images/ecran-4j-creation-activite-duree-totale-pilote.png\|220]] | Copie documentaire historique ; règle de calcul toujours valide | ancien node supprimé |
| Écran 4k | Durée ajustée | ![[images/ecran-4k-creation-activite-duree-ajustee.png\|220]] | Message temporaire après arrondi à un nombre entier de Séries | `3580:4957` |
| Écran 4l | Ajouter un exercice — paramètres repliés | — | État courant de l’éditeur avant déploiement des paramètres | `4217:6980` |
| Écran 4m | Paramètres dépliés — vue défilée | — | Organisation actuelle des paramètres d’exécution | `4279:7044` |
| Écran 4n | Invitation à paramétrer | — | État replié avec action `Cliquez pour paramétrer` | `4294:7075` |
| Écran 4o | Modifier un exercice | — | Variante modification de l’éditeur courant | `4734:6342` |
| Écran 4p | Durée de l’Exercice — roulette ouverte | — | Roulette en modale basse dans le nouvel éditeur | `4332:7095` |
| Écran 4q | Catégorie — nouvelle catégorie — clavier ouvert | — | Création d’une Catégorie depuis l’éditeur | `4474:7157` |
| Écran 4r | Zones corporelles | — | Sélection des Zones corporelles | `4478:7209` |
| Écran 4s | Nouvelle zone corporelle — clavier ouvert | — | Création inline d’une Zone corporelle dans le référentiel administrable | `4683:6336` |
| Écran 4t | Catégorie — confirmation de suppression | — | Appui long sur une Catégorie ; confirmation destructive `Annuler / Supprimer` | `4861:6259` |
| Écran 4u | Zone corporelle — confirmation de suppression | — | Appui long sur une Zone corporelle ; confirmation destructive `Annuler / Supprimer` | `4861:6348` |

### Objectif

Permettre à l’utilisateur de créer ou modifier un Exercice dans un écran unique. `Récupération` n’est plus un type sélectionnable.

### Ouverture

L’écran est ouvert lorsque l’utilisateur :

- ajoute un Exercice depuis la Composition ;
- choisit `Modifier` sur un Exercice ;
- crée ou modifie une `ActivityDefinition` persistante depuis le Catalogue des exercices.

Le contexte d’ouverture détermine la destination de retour et le type d’objet édité ; il ne doit jamais être déduit de la seule apparence de l’écran.

Dans le parcours courant de Composition, l’interface expose la sélection d’Exercices du Catalogue. La capacité existante de créer directement un Exercice local à la Séance reste conservée mais n’est pas exposée dans cet enchaînement d’écrans.

### Contenu et sections

L’en-tête fixe porte un titre fonctionnel : `Ajouter un exercice` en création et `Modifier un exercice` en modification. Le nom de la Séance n’est pas utilisé comme titre d’écran.

Sous l’en-tête, un bandeau bleu de `402 × 115` points, sans espace avec le séparateur horizontal de l’en-tête, contient uniquement :

- le champ du nom d’Exercice, placé à `12` points du haut, de même hauteur et au même alignement que le champ `Nom de la séance` de la Composition ;
- deux accès `Catégorie` et `Zones corporelles`, chacun avec une icône `+` séparée du libellé ; le caractère `+` ne fait pas partie du texte.

`Renforcement du genou` visible dans les états renseignés est une **valeur de démonstration Figma**, jamais un libellé statique ni une valeur codée en dur. Seul l’état vide `3943:6064` utilise `Nom de l’exercice` comme placeholder/état vide.

Le reste du formulaire affiche ensuite, dans cet ordre :

- section repliable `Description de l’exercice`, fermée par défaut, contenant un champ multiligne facultatif ;
- accès `Catégorie` permettant de sélectionner la Catégorie de l’Exercice ;
- accès `Zones corporelles` permettant la multisélection du référentiel facultatif ;
- section repliable `Mode d’exécution`, déployée par défaut ;
- segment `Durée / Répétitions / À l’échec` ;
- cadre `Séries / cible du mode / Pause` ;
- cadre bleu, ligne 2 : `Changement de côté / Récupération / Durée totale` ;
- zone Média conforme au Figma courant ; le cadre de synthèse reste au-dessus en cas de chevauchement. L’affichage média déployé du Catalogue fait partie du MVP ; cette règle ne crée pas à elle seule une fonction d’import/capture supplémentaire dans l’éditeur ;
- synthèse calculée de l’Exercice, immuable et ancrée en bas de l’écran ;
- bouton final fixe `Terminer`.

Le nom est obligatoire.

Le contrôle `Durée / Répétitions / À l’échec` partage sa largeur en trois zones égales. Le texte de chaque option reste centré. Les titres des sections utilisent la même typographie que `Mode d’exécution` et le chevron DSF de déploiement. Le contenu central défile indépendamment de la synthèse et du bouton final. Le texte récapitulatif utilise `KODJO / Body` (`14/20`, Regular), occupe la largeur utile complète et conserve sa position fixe ; le contenu défilant maintient au moins `spacing/16` avant la synthèse.

Dans le premier cadre, l’ordre horizontal est invariant : `Séries` à gauche, cible du mode au centre (`Durée`, `Répétitions` ou cadre informatif `à l’échec`), puis `Pause` à droite. Cet ordre reste inchangé lorsqu’une roulette est ouverte. Dans la seconde ligne du même cadre bleu, `Changement de côté` occupe le premier emplacement, puis `Récupération` et `Durée totale`. La géométrie suit le Figma courant et le DSF actif. Dans la phrase de synthèse, le mode est affiché hors phrase. Sans mode, le champ est vide. En Durée, la clause `Durée totale` est présente dès qu’il y a plusieurs Séries ou un changement de côté ; en Répétitions, `Durée totale ≥ {estimation}` utilise 2 s par répétition ; en À l’échec elle est absente. La phrase est régénérée à chaque modification (D-232).

La synthèse ne préfixe jamais la phrase par le type d’Exercice ni par le mode d’exécution. Le **nom de l’Exercice est en gras uniquement dans cette Synthèse**. Elle suit les formes fonctionnelles existantes pour les Séries, cibles, directions, Pauses et Récupération.

Pour une direction propre bilatérale, ajouter après la cible du mode — après `jusqu’à l’échec` — et avant toute Pause : `, à droite, puis à gauche` ou `, à gauche, puis à droite`. Ne rien ajouter en `UNILATERAL` ni pour une direction seulement héritée du Tour.

La phrase intrinsèque n’inclut jamais la Récupération post-activité. Elle mentionne la pause entre Séries seulement si plusieurs Séries, et la pause au changement de côté seulement si un changement de côté est défini et que cette pause est positive. Les fragments et la ponctuation suivent D-232.

### Mode d’Exécution

L’utilisateur choisit entre :

- `Durée` ;
- `Répétitions` ;
- `À l’échec`.

En mode `Durée`, les durées utilisent des roulettes en modale basse ; le Nombre de Séries utilise un stepper inline. La Pause au changement de côté n’est proposée qu’en bilatéral.

En mode `Répétition`, la Durée est remplacée par le Nombre de répétitions. Nombre de répétitions et Nombre de Séries utilisent des steppers inline ; les durées de Pause utilisent des roulettes. `Durée totale ≥` reste visible comme borne connue, calculée à 2 s par répétition.

En mode `À l’échec`, aucun contrôle Durée ou Nombre de répétitions n’est affiché. La rangée conserve trois emplacements : `Séries` à gauche, cadre informatif transparent bordé portant `à l’échec` au centre, puis `Pause` à droite. La seconde rangée conserve `Changement de côté` et, en bilatéral, `Pause au changement de côté` ; aucune `Durée totale` n’est affichée en mode À l’échec.

Le nombre de Séries est toujours compris entre 1 et 99 (D-092). Pour tout nouvel Exercice, sa valeur par défaut est `1`.

Une Série correspond à l’Exécution de la cible du mode. Pour un Exercice bilatéral autonome, le nombre de Séries est un nombre par côté. La Pause est exécutée exactement entre les Séries successives d’un même côté, soit `C−1` fois. En bilatéral, la **Pause au changement de côté** éventuelle est exécutée une seule fois entre les Séries du premier et du second côté.

### Dépendance Séries / Durée totale

Avant toute interaction, tous les contrôles sont utilisables et aucun contour pilote n’est affiché. `Séries` est néanmoins le pilote interne par défaut. Après confirmation d’une roulette, le contrôle modifié devient pilote et reçoit un contour `2` points lié à `color/selection`; le contrôle calculé conserve son contour standard et reste tactile. Ce choix n’est pas persisté : à la réouverture, `Séries` redevient pilote implicite.

La formule intrinsèque d’un Exercice est `D = L × [C × A + (C − 1) × B] + S`, avec `L = 1` en unilatéral et `L = 2` en bilatéral, `S = 0` en unilatéral ou `sideRecoverySeconds` en bilatéral, `A` durée par Série, `B` Pause et `C` nombre entier de Séries par côté. `postActivityRecoverySeconds` est toujours exclu. Si `D` pilote, `C théorique = ((D − S) / L + B) / (A + B)`. `C` est arrondi à l’entier le plus proche, `.5` vers le haut, avec un minimum de `1`; `D` est ensuite recalculée à la valeur atteignable. Le recalcul intervient uniquement après `Confirmer`. Si la durée réalisable recalculée diffère de la cible saisie (`T(N) ≠ Tv`), afficher temporairement : `Durée ajustée à {T(N)} pour respecter un nombre entier de Séries.` Si `T(N) = Tv`, ne pas afficher ce message.

La Description est facultative. Au moins une Zone corporelle est obligatoire ; plusieurs peuvent être sélectionnées. Les Zones proviennent du référentiel utilisateur administrable. La modale `Zones corporelles` permet la sélection multiple et la création inline d’une nouvelle Zone (`4683:6336`). Le référentiel autorise également le renommage et la suppression ; ces deux opérations sont des règles fonctionnelles actives mais ne disposent pas encore d’une frame dédiée dans le Prototype MVP.

### Modification d’un Exercice

Lorsqu’un Exercice existant est modifié, ses valeurs sont préremplies. Le nombre de Séries persistant rétablit la Durée totale calculée.

Les Exécutions déjà historisées ne sont jamais modifiées.

## Écran 5 — Réservé

L’ancien écran autonome `Création / modification d’un Exercice — Récupération` est supprimé. Le numéro reste réservé afin de ne pas renuméroter silencieusement les écrans et références historiques. L’Écran 4 expose uniquement la **Pause au changement de côté**, conditionnelle au bilatéral. La **Récupération après exercice** se règle sur l’occurrence dans la Composition et ne possède aucun écran autonome.

## Écran 6 – Étiquettes de la séance dans la Composition

La gestion des Étiquettes n’est plus un écran autonome de fin de parcours : elle est intégrée à la Composition de séance.

Références Figma courantes :
- `2028:11204 — Composition séance — Étiquettes` ;
- `4640:6308 — Composition séance — Nouvelle étiquette` ;
- `4581:6404 — Composition séance — Étiquette sélectionnée`.

### Objectif

Permettre de sélectionner ou créer l’Étiquette de la Séance. L’Étiquette porte la couleur affichée de la Séance ; il n’existe pas de couleur de Séance indépendante de l’Étiquette.

### Contenu et comportement

- l’action Étiquette ouvre une modale basse sur la Composition ;
- la modale affiche les Étiquettes disponibles et l’action `Nouvelle étiquette` ;
- sélectionner une Étiquette ferme le choix et affiche son libellé sous le nom de la Séance ; sa couleur devient la couleur de la Séance ;
- `Nouvelle étiquette` ouvre la saisie `Nom de l’étiquette` dans la modale ; l’action d’envoi ajoute la nouvelle valeur aux choix ;
- les libellés visibles dans Figma (`Marathon`, `Hyrox`, `Vacances d'été`, `Challenge groupe`) sont des données de démonstration, pas des valeurs codées en dur ;
- la navigation et les autres valeurs déjà saisies dans la Composition sont conservées pendant l’ouverture/fermeture de la modale.

La validation de la Séance reste portée par l’action `Continuer` de la Composition ; l’Étiquette est enregistrée avec la Séance dans le même flux de validation.

## Écran 7 – Calendrier

![[images/ecran-7-calendrier-jour.png|260]]

*Écran 7 — Calendrier — Jour — Figma `1992:5510`*

La vue Semaine est illustrée par :

![[images/ecran-7a-calendrier-semaine.png|260]]

*Écran 7a — Calendrier — Semaine — Figma `1992:5101`*

La vue Mois est illustrée par :

![[images/ecran-7b-calendrier-mois.png|260]]

*Écran 7b — Calendrier — Mois — Figma `1992:5237`*

### États Figma de référence

| N° | État | Capture | Règle matérialisée | Node Figma |
| --- | --- | --- | --- | --- |
| Écran 7c | Appui long en vue Jour | ![[images/ecran-7c-calendrier-jour-appui-long.png\|220]] | Sélection d’une plage horaire avant planification | `1992:5602` |
| Écran 7d | Choix de la Séance | ![[images/ecran-7d-calendrier-choisir-seance.png\|220]] | Bottom sheet défilant ouvert par `+ Planifier` | `1992:6249` |
| Écran 7e | Créneau à planifier | ![[images/ecran-7e-calendrier-creneau-a-planifier.png\|220]] | Étape intermédiaire issue de la plage sélectionnée | `1992:5794` |
| Écran 7f | Jour après planification | ![[images/ecran-7f-calendrier-jour-apres-planification.png\|220]] | Résultat attendu après enregistrement | `1992:5697` |
| Écran 7g | Jour suivant | ![[images/ecran-7g-calendrier-jour-suivant.png\|220]] | Résultat d’un glissement gauche ou du chevron suivant | `2059:267` |
| Écran 7h | Semaine, mardi sélectionné | ![[images/ecran-7h-calendrier-semaine-mardi.png\|220]] | Mardi placé en tête ; lundi se trouve au-dessus et n’est plus visible | `2252:86` |
| Écran 7i | Séance hebdomadaire déployée | ![[images/ecran-7i-calendrier-semaine-deployee.png\|220]] | Détail d’une occurrence et zone `Démarrer` | `1992:6389` |
| Écran 7j | Actions glissées | ![[images/ecran-7j-calendrier-semaine-actions.png\|220]] | `Dupliquer` et `Supprimer` sur une occurrence hebdomadaire | `1992:5962` |
| Écran 7k | Actions sur Étirements | ![[images/ecran-7k-calendrier-etirements-actions.png\|220]] | Même interaction appliquée à une autre occurrence représentée | `2094:86` |
| Écran 7l | Après suppression | ![[images/ecran-7l-calendrier-apres-suppression.png\|220]] | Liste hebdomadaire actualisée après suppression | `2074:86` |
| Écran 7m | Calendrier vide | ![[images/ecran-7m-calendrier-vide.png\|220]] | État sans occurrence planifiée | `2128:86` |

### Objectif

Permettre à l’utilisateur de visualiser les Routines planifiées, de naviguer dans le calendrier et d’accéder rapidement à leur gestion.

### Ouverture

L’écran est accessible depuis l’onglet `Calendrier`.

### Contenu

L’écran comporte les vues `Jour`, `Semaine` et `Mois`. L’onglet `Calendrier` ouvre la vue `Jour`.

L’écran affiche :

- un calendrier ;
- uniquement les occurrences futures calculées à partir des Routines ;
- pour chaque occurrence : la Séance, sa couleur et la date / heure ;
- le bouton secondaire `+ Planifier`.

En vue Jour, un glissement horizontal de la grille vers la gauche affiche le jour suivant et un glissement vers la droite le jour précédent. Les chevrons restent disponibles. Un appui long sur une plage horaire prépare une nouvelle planification ; le texte `créneau libre` n’est pas utilisé.

### Comportement

En vue Jour, toucher une carte ouvre sa planification ; aucune action glissée n’est proposée. En vue Semaine, toucher la zone principale d’une occurrence ouvre la modification de sa Routine dans l’écran de planification prérempli. La carte possède également une zone distincte pour la déployer ou la replier, une zone `Démarrer`, et révèle uniquement `Dupliquer` et `Supprimer` par glissement gauche. `Dupliquer` identifie la Routine source à partir de l’occurrence, crée un brouillon reprenant la même source (`SESSION` ou `ACTIVITY`) et tous ses paramètres de planification, puis ouvre ce brouillon en modification. Aucune nouvelle Routine n’est persistée avant validation explicite de l’utilisateur.

L’état obtenu par glissement ne remplace pas la liste : il décale la carte concernée pour révéler ses actions. Les autres jours et occurrences restent rendus à leur position chronologique.

En vue Semaine, la liste est organisée chronologiquement en sections journalières. Lorsque le défilement place un nouveau jour en tête de la liste, le curseur coloré de la barre de semaine sélectionne ce jour. Inversement, sélectionner un jour dans la barre positionne sa section comme première section visible de la liste.

La barre de semaine occupe toute la largeur utile. Les sept jours forment sept colonnes flexibles de même largeur ; aucune largeur de cellule ni position horizontale issue du gabarit `402` n’est conservée en dur. Les espacements s’adaptent afin que les sept jours restent entièrement visibles dès `360` points et utilisent l’espace supplémentaire sur un grand téléphone. La grille de la vue Mois applique la même répartition en sept colonnes égales.

`+ Planifier` ouvre le bottom sheet `Choisir une séance`. La liste y défile si nécessaire et `Sélectionner` poursuit le parcours de planification.

Lorsqu’une occurrence future est exécutée en avance, elle est considérée exécutée pour cette occurrence et n’est plus proposée à son horaire initial.

Lorsqu’une occurrence planifiée arrive à échéance sans avoir été exécutée, elle disparaît de l’interface. Elle n’est pas affichée dans le Suivi du MVP.

La suppression ou modification d’une Routine agit sur les occurrences futures conformément aux règles de planification.

## Écran 8 – Planifier une séance

![[images/ecran-8-planifier-seance.png|260]]

*Écran 8 — Planifier une séance — Création — Figma `1992:6838`*

### États Figma de référence

| N° | État | Capture | Règle matérialisée | Node Figma |
| --- | --- | --- | --- | --- |
| Écran 8a | Date ouverte | ![[images/ecran-8a-planifier-date-ouverte.png\|220]] | Sélecteur de date compact | `1992:6622` |
| Écran 8b | Heure ouverte | ![[images/ecran-8b-planifier-heure-ouverte.png\|220]] | Roulette compacte heures/minutes avec validation explicite | `1992:7006` |
| Écran 8c | Rappel personnalisé ouvert | ![[images/ecran-8c-planifier-rappel-ouvert.png\|220]] | Réglage compact du délai de rappel avec validation explicite | `1992:7187` |
| Écran 8d | Rappel personnalisé sélectionné | ![[images/ecran-8d-planifier-rappel-selectionne.png\|220]] | Valeur répercutée dans le formulaire avant enregistrement | `1992:7369` |
| Écran 8e | Nombre de semaines ouvert | ![[images/ecran-8e-planifier-semaines-ouvert.png\|220]] | Roulette native compacte à une colonne avec Annuler/Confirmer | `1992:7537` |
| Écran 8f | Aucune répétition | ![[images/ecran-8f-planifier-sans-repetition.png\|220]] | Variante de planification unique | `1992:7716` |
| Écran 8g | Changer la Séance | ![[images/ecran-8g-planifier-changer-seance.png\|220]] | Liste de remplacement de la Séance associée | `1992:7861` |

### Objectif

Créer ou modifier une Routine, c’est-à-dire la planification d’une **Séance ou d’un Exercice persistant**.

### Ouverture

L’écran est accessible :

- depuis `Calendrier > + Planifier` ;
- depuis `Modifier la planification` sur une Routine existante ;
- depuis l’action glissée `Planifier` d’une Séance active ou d’un Exercice actif dans son Catalogue.

### Paramètres

La planification comporte :

- la source associée, de type `SESSION` ou `ACTIVITY` ;
- la date de début ;
- l’heure ;
- le mode de répétition ;
- les paramètres de périodicité lorsque nécessaire ;
- une date de fin lorsque nécessaire ;
- le rappel ;
- le bouton `Enregistrer`.

### Modes de planification

Le MVP propose :

- `Aucune` : une seule occurrence ;
- `Périodique` : répétition selon une périodicité hebdomadaire définie par une fréquence en semaines et un ou plusieurs jours de la semaine. Dans le MVP, seule cette périodicité hebdomadaire est disponible.

Il n’existe pas de mode `Quotidien` distinct. Une planification périodique sélectionnant les sept jours toutes les semaines équivaut à une exécution quotidienne.

En mode périodique :

- la fréquence est un entier supérieur ou égal à 1 ;
- un ou plusieurs jours sont sélectionnés ;
- la date de fin est obligatoire.

Dans l’interface, la répétition est présentée de manière compacte avec `Toutes les`, puis `X semaine(s) jusqu’au <date>`, et les jours sélectionnés en dessous. Aucun niveau de titre `Quand ?` n’est affiché ; `Date de début` et `Heure` sont des libellés de blocs au même niveau visuel.

Le contrôle de rappel comporte deux options fixes : `Aucun` à gauche et `Personnalisé` à droite. Les choix rapides intermédiaires (`5 min`, `15 min`, `30 min`, `1 h` dans le MVP) sont placés dans une zone horizontale défilante. Cette zone peut recevoir de nouveaux choix rapides sans déplacer les deux options fixes ni réduire la taille des libellés. Le récapitulatif de planification est multi-ligne et reste intégralement contenu dans son cadre.

La flèche ouvrant le détail du `Rappel` est alignée sur la marge droite du contenu, comme les autres commandes de section. Son pictogramme reste centré dans une boîte visuelle de `24 × 24` et dans une cible tactile d’au moins `48 × 48`.

Une Routine ne possède qu’une seule heure d’Exécution. Si l’utilisateur souhaite plusieurs horaires pour une même source, il crée plusieurs Routines distinctes.

### Validation

`Enregistrer` crée ou met à jour la Routine.

Les occurrences futures sont recalculées à partir de la nouvelle planification. Les occurrences déjà historisées ne sont pas modifiées.

## Écran 9 – Exécution de séance

![[images/ecran-9-execution-seance.png|260]]

*Écran 9 — Exécution de séance — Groupes d’information — Figma `1992:8132`*

### États Figma de référence

| N° | État | Capture | Règle matérialisée | Node Figma |
| --- | --- | --- | --- | --- |
| Écran 9a | Avant démarrage | ![[images/ecran-9a-execution-etat-initial.png\|220]] | La Séance ne démarre pas automatiquement ; Retour mène au Catalogue renseigné dans le prototype | `1992:8626` |
| Écran 9b | Sons et annonces désactivés | ![[images/ecran-9b-execution-sons-annonces-desactives.png\|220]] | État alternatif des deux commandes de guidage sonore | `1992:8530` |

### Objectif

Guider l’utilisateur pendant l’Exécution avec une hiérarchie visuelle adaptée à une lecture rapide et à distance.

Un seul layout standard est utilisé pour les Exercices en Durée, en Répétitions et À l’échec ainsi que pour leur phase de Récupération. Le comportement temporel s’adapte à la phase du Plan d’Exécution sans changer la structure générale de l’écran.

### Entrée dans l’écran et démarrage

L’écran peut être ouvert :

- depuis la zone principale d’une carte du Catalogue ;
- depuis l’action `Démarrer` d’une occurrence planifiée, y compris lorsqu’une occurrence future est exécutée en avance.

L’ouverture de l’écran ne démarre pas immédiatement l’Exercice.

Avant le démarrage, l’utilisateur déclenche la Séance depuis la commande centrale.

Avant le démarrage, Retour renvoie dans l’application à l’écran depuis lequel l’Exécution a été lancée. Dans le prototype MVP, toutes les zones du bouton Retour renvoient explicitement au `Catalogue des séances — Séance déployée` (`1992:10014`) ; aucune ne pointe vers l’état vide du Catalogue.

Le Compte à rebours initial est alors exécuté s’il est configuré avec une durée supérieure à zéro, puis le premier Exercice commence.

### Hiérarchie des informations affichées

L’écran affiche, de haut en bas :

- le nom de la Séance ;
- l’état des sons / annonces vocales ;
- le nom de l’Exercice en cours ;
- le compteur de Série lorsque l’Exercice est un Exercice ;
- l’indicateur temporel principal ;
- la Série sous l’indicateur principal, à gauche, et le Tour à droite. À partir de `360` points et avec le texte à `100 %` ou `135 %`, les deux valeurs restent sur une même ligne dans deux zones flexibles symétriques, séparées par un repère central de largeur fixe ;
- une progression discrète du Tour ;
- la zone `À suivre` avec le nom et la durée ou le nombre de reps de l’Exercice suivant ;
- les commandes `Réinitialiser`, `Pause` et `Exercice suivant` ;
- le temps total écoulé et la durée estimée d’exécution de la Séance ; le temps écoulé inclut toutes les phases effectivement exécutées, Compte à rebours initial et Fin de séance compris, mais exclut les Pauses manuelles ; si le plan contient au moins un Exercice en mode Répétitions ou À l’échec, la durée estimée d’exécution est affichée sous forme de borne minimale, par exemple `≥ 18 min` ;
- une barre de progression globale structurée en segments correspondant aux Tours, conformément au prototype Figma. Elle occupe exactement la largeur utile sans débordement. Les segments se répartissent dans cette largeur après déduction des espacements et ne conservent jamais la largeur fixe du gabarit `402`. Le remplissage représente l’avancement dans le Plan d’Exécution complet, Compte à rebours initial et `SESSION_END` compris, selon la pondération définie dans les chapitres 08 et 10 ; il n’est pas le simple rapport `temps écoulé / durée estimée d’exécution`. Il atteint `100 %` uniquement à l’achèvement de `SESSION_END`. Dans T04, les étapes chronométrées sont pondérées par leur durée planifiée ; la part d’une occurrence en Répétitions ou À l’échec est acquise avec `Suivant`. Les Pauses manuelles n’augmentent pas le remplissage.

Le Cycle n’est jamais affiché. Le nombre total d’étapes et la position sous la forme `x sur y` ne sont pas affichés dans le MVP.

Le moteur d’Exécution peut néanmoins conserver ces informations pour son fonctionnement interne.

### Exercice définie par une durée

Pour un Exercice en mode Durée ou une phase de Récupération, le temps est présenté sous forme de compte à rebours.

Lorsque le compte à rebours atteint zéro, l’Exercice se termine normalement et l’Exécution passe à la suite.

Si l’utilisateur appuie sur `Exercice suivant` avant zéro, une confirmation est demandée. Après confirmation, l’Exercice est enregistrée avec le statut métier `Partielle` et l’Exécution continue.

### Exercice définie par un nombre de répétitions

Pour un Exercice défini par un nombre de répétitions, l’écran conserve le même layout que pour un Exercice chronométré.

Le temps actif est affiché par un chronomètre croissant à partir de `00:00`. Il n’existe pas de durée cible.

Le cercle du minuteur effectue une rotation complète par minute :

- une rotation complète représente 60 secondes ;
- à `01:00`, il recommence une nouvelle rotation ;
- le chronomètre continue à croître (`01:01`, `01:02`, etc.).

Un bip est émis à chaque minute écoulée. Dans le MVP, ce bip est fixe et non paramétrable.

`Pause` suspend le chronomètre et la rotation du cercle. `Reprendre` les relance depuis l’état exact où ils ont été suspendus.

L’utilisateur termine normalement chaque Série avec `Suivant`. Cette action ne crée pas un Exercice Partielle : elle valide la fin normale de la Série en mode Répétitions ou À l’échec.

### Séries

Lorsqu’un Exercice possède plusieurs Séries :

- `Série x/y` indique la Série en cours ;
- chaque Série exécute la durée cible, les répétitions cibles ou se poursuit jusqu’à l’échec selon le mode ;
- pour `C` Séries d’un même côté, la Pause est appliquée exactement `C − 1` fois, uniquement entre Séries successives ;
- si l’Exercice est bilatérale, la Pause au changement de côté éventuelle est exécutée une seule fois entre le premier et le second côté.

T04 développe toutes les Séries, les répétitions de Tour et les passages de côté dans le Plan d’Exécution avant le démarrage.

### Récupérations

Deux phases distinctes peuvent exister. `SIDE_RECOVERY` matérialise la Pause au changement de côté d’un Exercice bilatéral et intervient entre le premier et le second côté. `POST_ACTIVITY_RECOVERY` matérialise la Récupération après exercice portée par l’occurrence de Séance ; elle intervient après l’occurrence, y compris après le dernier Exercice avant `SESSION_END` et après chaque passage dans le Circuit à chaque Tour.

La valeur `postActivityRecoverySeconds = 0` reste visible dans la Composition mais ne crée pas de phase chronométrée positive. La zone `À suivre` prépare l’élément qui succède à la phase courante. Les données de résultat distinguent la pause au changement de côté de la récupération après occurrence.

### Commandes principales

Les trois emplacements de commande restent identiques. Pendant un Exercice, ils affichent :

- `Réinitialiser l’exercice` ;
- `Pause` ;
- `Exercice suivant`.

Pendant la Récupération, la première commande devient `Réinitialiser la récupération`.

Leur position et leur rôle visuel ne changent pas entre Durée et Répétition.

### Réinitialiser l’Exercice

L’action ouvre la modale de confirmation.

Après confirmation :

- la Série / Exercice courant recommence depuis son état initial ;
- pour un Exercice chronométré, le compte à rebours retrouve sa durée initiale ;
- pour un Exercice en Répétitions ou À l’échec, le chronomètre d’Exercice revient à `00:00` ;
- la cible de répétitions n’est pas modifiée ;
- le temps total déjà écoulé dans la Séance reste conservé ;
- le Tour et le Cycle courants restent inchangés.

Pendant `SIDE_RECOVERY` ou `POST_ACTIVITY_RECOVERY`, la confirmation réinitialise uniquement le compte à rebours de la phase de récupération courante. Elle ne rejoue aucune Série déjà acquise et ne modifie pas les résultats antérieurs.

### Mise en pause

Toucher `Pause` suspend immédiatement l’Exécution et ouvre la modale `Séance en pause`.

La pause suspend :

- le compte à rebours ou le chronomètre d’Exercice ;
- l’enchaînement automatique ;
- le temps actif ;
- les bips et annonces liés à la progression ;
- les animations de progression.

La modale propose :

- `Reprendre la séance` ;
- `Arrêter la séance`.

`Reprendre la séance` restaure l’état exact de l’Exercice.

`Arrêter la séance` termine l’Exécution avec le statut `Interrompue`. Dans T04, il ouvre l’écran de fin minimale ; l’ouverture de la Synthèse appartient à la tranche qui livre cette dernière.

Il n’existe pas de commande directe d’arrêt depuis l’écran principal d’Exécution.

### Exercice suivant

Le comportement dépend de la phase courante :

- **Exercice en Répétitions ou À l’échec** : termine normalement la Série courante et passe à la pause, à la Série suivante ou à l’Exercice suivant selon le plan ;
- **Exercice chronométré avant zéro** : ouvre la modale de confirmation ; après confirmation, l’Exercice est enregistrée avec le statut `Partielle`, puis l’Exécution continue ;
- **Phase de récupération avant zéro** : ouvre la même confirmation ; après confirmation, la durée partielle de la phase courante (`SIDE_RECOVERY` ou `POST_ACTIVITY_RECOVERY`) est conservée et le Plan poursuit vers son étape suivante ;
- **Exercice chronométré arrivée à zéro** : la transition est automatique.

### Navigation pendant l’Exécution

L’ordre d’Exécution est déterminé par le Plan d’Exécution.

L’utilisateur ne peut pas sélectionner librement une autre Exercice ni revenir à un Exercice déjà terminée.

### Guidage sonore

Dans T04, Sons et Annonces vocales sont activés par défaut au début de chaque Exécution. Leur état peut être changé pendant l’Exécution, mais cette tranche ne lit ni n’enregistre encore de préférence utilisateur correspondante ; leur configuration depuis le Profil appartient à une tranche ultérieure.

Au début d’un Exercice, son nom peut être annoncé vocalement lorsque les Annonces vocales sont actives. Au début d’une phase de récupération chronométrée (`SIDE_RECOVERY` ou `POST_ACTIVITY_RECOVERY`), l’annonce est `Récupération`.

Pour les Exercices chronométrés, les signaux sonores de fin de compte à rebours sont appliqués conformément aux règles métier définies pour le MVP.

Pour un Exercice en Répétitions ou À l’échec, aucun signal de fin de compte à rebours n’est utilisé puisqu’il n’existe pas de temps cible. Un bip fixe est toutefois émis à chaque minute écoulée dans le MVP.

### Arrière-plan et verrouillage

Si l’application passe en arrière-plan ou si l’écran se verrouille :

- le Plan d’Exécution continue selon ses horodatages de référence ;
- l’Exercice chronométré ne se fige pas ;
- au retour, l’application reconstitue l’Exercice et la position temporelle qui auraient dû être atteintes, plutôt que de reprendre le compteur à l’endroit où l’interface a été suspendue ;
- les sons et annonces sont maintenus dans la mesure permise par iOS et Android.

Une mise en pause de sécurité est appliquée en cas d’inactivité prolongée :

- pour un Exercice chronométré, si aucune interaction n’a eu lieu 30 minutes après sa fin théorique ;
- pour un Exercice en Répétitions ou À l’échec, après 2 heures sans interaction depuis son démarrage.

Le comportement précis fait l’objet du spike technique prévu avant le développement complet du moteur d’Exécution.

### Fin de l’Exécution

Lorsque le Plan d’Exécution arrive à son terme, l’Exécution est enregistrée et l’écran `Synthèse de séance` est affiché.

La Séance source et la Routine éventuelle ne sont jamais modifiées par l’Exécution.

## Écran 10 – Synthèse de séance

![[images/ecran-10-synthese-seance.png|260]]

*Écran 10 — Synthèse de séance — Ressenti sélectionné — Figma `1992:8780`*

L’état initial, avant sélection du ressenti, est illustré par :

![[images/ecran-10a-synthese-evaluation-initiale.png|260]]

*Écran 10a — Synthèse de séance — Évaluation initiale — Figma `1992:8718`*

États Figma complémentaires sans copie documentaire mise à jour à ce stade :

- `4760:6448 — Synthèse de séance — Partielle — Évaluation initiale` ;
- `4760:6500 — Synthèse de séance — Partielle — Ressenti sélectionné`.

### Objectif

Présenter un bilan immédiatement compréhensible et recueillir le ressenti obligatoire avant de quitter l’écran.

### Contenu

L’écran affiche notamment :

- le nom de la Séance ;
- le statut de l’Exécution ;
- la durée réellement exécutée ;
- le nombre d’Exercices réalisées ;
- le nombre d’Exercices partielles, uniquement s’il est supérieur à zéro ;
- le choix du ressenti ;
- un champ `Commentaire` facultatif ;
- le bouton `Terminer`.

Les Tours et Cycles ne sont pas affichés dans la Synthèse du MVP.

Aucun parcours détaillé des Exercices n’est affiché sur cet écran dans le MVP.

### Statut

Une Exécution terminant normalement son Plan peut être `Terminée` ou `Partielle` selon les Exercices réellement réalisées.

Une Exécution arrêtée volontairement depuis la modale de pause est enregistrée avec le statut `Interrompue`.

### Ressenti

Le ressenti est obligatoire.

Le MVP propose trois niveaux, conformément au wireframe.

Le libellé `Comment s’est passée la séance ?` utilise `type.cardTitle` (`16/20`, Semi Bold). À la taille système standard, son conteneur occupe la largeur utile et maintient le libellé sur une ligne sur les largeurs prises en charge de `360` à `440` points ; la référence Figma `402` utilise une largeur de `322` points. Avec l’agrandissement d’accessibilité, le conteneur grandit verticalement et autorise le retour à la ligne sans chevaucher les choix de ressenti.

Le bouton `Terminer` reste désactivé tant qu’aucun ressenti n’a été sélectionné.

### Commentaire

Le `Commentaire` est facultatif et limité à **200 caractères maximum**.

Le Ressenti est obligatoire dès lors que cet écran de Synthèse est présenté, y compris pour une Exécution `Interrompue`. Il peut être absent uniquement lorsqu’une interruption technique n’a pas permis de présenter la Synthèse.

Il est enregistré avec l’Exécution.

### Navigation

`Terminer` enregistre le ressenti et le Commentaire puis ouvre le `Suivi`.

Aucune action `Relancer la séance` n’est prévue dans le MVP.

## Écran post-MVP – Suivi : Vue d’ensemble

### Objectif

Présenter à terme des indicateurs synthétiques de progression et d’exercice.

Cette vue n’est pas fonctionnelle dans le MVP.

### Présence dans le MVP

La commande `Vue d’ensemble` reste visible mais désactivée dans le MVP. La vue analytique et ses graphiques ne sont pas fonctionnels et restent reportés à une version ultérieure.

## Écran 11 – Suivi : Séances

![[images/ecran-11-suivi-condense.png|260]]

*Écran 11 — Suivi : Séances — Liste condensée — Figma `1992:8843`*

La vue déployée est illustrée par :

![[images/ecran-11a-suivi-deploye.png|260]]

*Écran 11a — Suivi : Séances — Vue déployée — Figma `1992:8996`*

L’état sans Exécution enregistrée est illustré par :

![[images/ecran-11b-suivi-vide.png|260]]

*Écran 11b — Suivi : Séances — État vide — Figma `2117:190`*

### Objectif

Permettre à l’utilisateur de consulter les Exécutions de séance enregistrées et de déployer leur détail.

Les occurrences planifiées non exécutées ne sont pas affichées dans le Suivi du MVP.

### Contenu

L’écran comporte :

- la destination active `Séances` ;
- les commandes visibles mais désactivées `Vue d’ensemble`, `Filtrer` et `Trier` ;
- une liste chronologique des Exécutions.

Chaque carte peut être condensée ou déployée individuellement afin d’afficher le détail de l’Exécution directement dans la liste. Aucun contrôle `Déployer tout / Replier tout` n’est affiché dans le MVP.

Le contrôle `Séances / Vue d’ensemble` est divisé en deux zones égales, même si `Vue d’ensemble` est désactivée. Les commandes `Filtrer` et `Trier` conservent leur écart et sont centrées comme un groupe. Dans chaque carte, le chevron et le Ressenti forment un groupe ancré au bord droit intérieur : le Ressenti ne peut pas disparaître sur écran compact et le groupe ne s’éloigne pas du bord sur grand téléphone. La liste est la seule zone défilante et s’arrête visuellement au moins `16` points avant la navigation basse fixe.

### Carte d’Exécution

Chaque carte affiche au minimum :

- le nom de la Séance exécutée ;
- sa couleur issue de l’Instantané ;
- la date et l’heure ;
- la durée réelle ;
- le statut `Terminée`, `Partielle` ou `Interrompue` ;
- le ressenti lorsqu’il a été renseigné.

### Filtres avancés

Dans le Suivi, les filtres avancés restent hors du MVP. Cette règle est distincte des filtres fonctionnels des Catalogues, qui sont actifs et contextuels.

### Tri

La fonction de tri est reportée à une version ultérieure. La commande `Trier` reste visible mais désactivée. L’ordre d’affichage initial reste chronologique, du plus récent au plus ancien.

### État vide

Si aucune Exécution ne correspond à la recherche, l’écran affiche un message indiquant qu’aucun résultat ne correspond.

Si aucune Exécution n’existe encore, l’écran affiche : `Vous verrez ici vos séances exécutées dès que vous aurez terminé votre première séance.`

## Écrans 12 à 18 — Catalogue des Exercices et Exécution directe — MVP T03

### Écran 12 — Catalogue des Exercices — Liste

La frame `3786:5093` utilise le même Screen Shell et le même contrôle de type que le Catalogue des Séances, avec `Exercices` sélectionné. La liste contient les Exercices persistants et conserve filtres, tri implicite et position de défilement dans l’état de navigation du parcours courant.

La rangée `Créer / Filtrer / Trier` est identique au Catalogue des Séances : trois contrôles `108 × 32 pt`, gap `8 pt`, ensemble centré en référence `402 pt`, cibles tactiles ≥ `48 × 48 pt`. `Filtrer` propose les critères contextuels validés et ses panneaux ouverts sont définis dans Figma ; `Trier` reste visible disabled.

Chaque carte présente une barre verticale portant la couleur de sa Catégorie. Sa surface principale ouvre la consultation ou la modification ; le bouton Lecture, dans une cible séparée, lance uniquement l’Exécution directe. Le contrôle `Déployer` est actif dans le MVP et affiche ou masque le média associé. Un glissement gauche expose `Planifier / Dupliquer / Archiver` sur les Exercices actives et `Supprimer` dans les archives. Aucune poignée de déplacement n’est affichée.

![[images/ecran-12-catalogue-activites-liste.png|260]]

*Écran 12 — Catalogue des Exercices — Liste — Figma `3786:5093`*

États Figma complémentaires de la famille Catalogue des Exercices :

- `4521:6220 — Catalogue des exercices — État vide` ;
- `4168:11262 — Catalogue des Exercices — Filtrer — Panneau ouvert` ;
- `4544:6344 — Catalogue des Exercices — Liste — Filtre inactif étendu` ;
- `4544:6651 — Catalogue des Exercices — Liste — Filtre actif étendu` ;
- `4738:6209 — Catalogue des Exercices — Liste — actions glissées` ;
- `4738:6355 — Catalogue des Exercices — Liste — Première carte déployée — Média`.

La frame `4534:6339 — Catalogue des Exercices — Filtre — États du contrôle` est une planche de référence du contrôle, pas un écran utilisateur autonome.

L’ancienne référence Figma `3787:5209 — Catalogue — action contextuelle directe` n’existe plus dans l’état courant et n’est plus une preuve active. Aucun état de remplacement n’est inventé.

### Écran 13 — Supprimé — ancien arbre `Créer` des Catalogues

L’écran/arbre intermédiaire `Une nouvelle exercice / Une séance / Un parcours / Annuler` est supprimé par D-187.

Dans chaque Catalogue, `Créer` ouvre directement la création de l’objet correspondant au Catalogue courant :
- `Catalogue des Exercices` → création d’un Exercice persistant ;
- `Catalogue des Séances` → création d’une Séance ;
- `Catalogue des Parcours` → création d’un Parcours lorsque ce Catalogue devient fonctionnel.

Cette règle n’active pas les Parcours dans T03/MVP. Les anciennes frames Figma `3787:5148` et `3841:8375`, ainsi que leurs captures physiques, sont conservées uniquement pour traçabilité et ne constituent plus des états fonctionnels à implémenter.

### Écran 14 — Composition — Sélectionner plusieurs Exercices existants

Depuis `Ajouter un exercice`, la frame `3789:5349` ouvre directement la sélection des Exercices du Catalogue au-dessus de la Composition grisée. La liste seule défile. Les boutons fixes sont `Annuler` à gauche et `Ajouter N exercice(s)` à droite.

Les Exercices sont insérées selon leur ordre courant de présentation dans la liste filtrée au moment de la validation, indépendamment de l’ordre des touchers. L’état sélectionné de la sélection multiple utilise le composant DSF dédié ; aucun glyphe texte ne peut le remplacer.

![[images/ecran-14-selection-activites-existantes.png|260]]

*Écran 14 — Composition — Sélectionner plusieurs Exercices existants — Figma `3789:5349`*

### Écran 15 — Création ou modification d’un Exercice persistant

L’écran réutilise l’Écran 4 et ses composants. Ouvert depuis le Catalogue, il crée ou modifie un Exercice de référence persistante ; ouvert depuis une Composition, il agit uniquement sur la copie de Séance. Le contexte d’ouverture détermine la destination de retour et interdit toute propagation implicite entre référence et copie.

Les références actives sont désormais `4217:6980 — Ajouter un exercice — paramètres repliés` pour la création et `4734:6342 — Modifier un exercice — Squats sautés` pour la modification. Les anciennes références `3879:5947` et `3879:6079` n’existent plus dans le Figma courant et restent historiques.

![[images/ecran-15-creation-activite-persistante.png|260]]

*Écran 15 — ancienne copie documentaire ; la référence Figma active de création est `4217:6980`.*

![[images/ecran-15a-modification-activite-persistante.png|260]]

*Écran 15a — ancienne copie documentaire ; la référence Figma active de modification est `4734:6342`.*

### Écran 16 — Préparation d’un Exercice directe

L’Exécution directe conserve une préparation système fixe de `5 s`. Cette durée n’est pas un attribut de l’Exercice. Les anciennes frames dédiées `3835:5385` et `3835:5465` n’existent plus dans le Figma courant ; l’Exécution directe réutilise les composants de la famille d’Exécution active. Aucune frame `PROPOSITION` n’est promue silencieusement en référence de production.

![[images/ecran-16-preparation-directe-5-s.png|260]]

*Écran 16 — copie documentaire historique ; aucune frame de premier niveau dédiée active n’est actuellement présente dans Figma.*

### Écran 17 — Exécution directe en cours

L’écran réutilise le moteur et le Shell d’Exécution. Il développe Séries, Pauses, côtés et Récupération, sans structure de Séance artificielle ni phase `SESSION_END`. Après la dernière phase, un signal ouvre immédiatement la Synthèse.

![[images/ecran-17-execution-directe-en-cours.png|260]]

*Écran 17 — copie documentaire historique ; le rendu courant réutilise la famille d’Exécution active.*

### Écran 18 — Synthèse d’un Exercice directe

Le Ressenti est obligatoire pour activer `Terminer`; le Commentaire reste facultatif. La finalisation enregistre l’origine `ACTIVITY`, alimente les statistiques compatibles sans compter une Séance et restaure le Catalogue des Exercices dans son état précédent.

![[images/ecran-18-synthese-directe-ressenti-requis.png|260]]

*Écran 18 — copie documentaire historique ; l’ancienne référence `3836:5437` n’existe plus dans le Figma courant.*

![[images/ecran-18a-synthese-directe-ressenti-selectionne.png|260]]

*Écran 18a — copie documentaire historique ; l’ancienne référence `3836:5503` n’existe plus dans le Figma courant.*

## Les modales

### Modale 1 – Abandonner la création d’une séance

![[images/modale-1-abandon-creation-seance.png|260]]

*Modale 1 — Abandonner la création de la séance — Figma `2028:11298`*

#### Objectif

Éviter la perte accidentelle des informations saisies dans la nouvelle `Composition d’une séance`.

#### Ouverture

La modale s’affiche depuis `Composition d’une séance` lorsque l’utilisateur appuie sur Retour pendant une création en cours.

La Composition reste visible en arrière-plan, assombrie et non interactive.

#### Contenu

**Titre**

> Abandonner la création ?

**Message**

> Les informations saisies seront perdues et la séance ne sera pas créée.

**Actions**

- `Annuler`, action neutre grise
- `Confirmer`, action destructive rouge

#### Comportement

`Annuler` ferme le dialogue et conserve intégralement la création en cours.

`Confirmer` supprime la nouvelle Séance et tout son contenu déjà saisi, puis revient au `Catalogue des séances`.

Ce comportement concerne uniquement le parcours de création. Pour une Séance existante ouverte en modification, Retour ne supprime jamais la Séance.

### Modale 2 – Abandonner la création d’un Exercice

![[images/modale-2-abandon-modifications-activite.png|260]]

*Référence Figma courante : `4714:6241 — Modal — Abandonner la création de l’exercice`. La copie documentaire sera mise à jour dans la phase dédiée aux captures.*

#### Objectif

Éviter la perte accidentelle des informations saisies pendant la création d’un Exercice.

#### Ouverture

La modale s’affiche lorsque l’utilisateur tente de quitter l’écran `Ajouter un exercice` alors qu’une création non enregistrée contient des informations saisies.

#### Contenu

**Titre**

> Abandonner la création ?

**Message Figma**

> Les informations saisies seront perdues et l'exercice ne sera pas créé.

**Actions**

- `Annuler` ;
- `Confirmer`, action destructive.

#### Comportement

`Annuler` ferme la modale et conserve le brouillon d’Exercice. `Confirmer` abandonne la création locale en cours et revient au contexte d’origine sans modifier les autres données de la Composition ou du Catalogue.

La confirmation d’abandon d’une **modification** d’Exercice existant reste un comportement fonctionnel distinct lorsqu’il est requis ; elle ne doit pas être déduite de cette frame de création.

### Modale 3 – Confirmer la suppression d’une Séance archivée

![[images/modale-3-seance-archivee-action-supprimer.png|260]]

*Modale 3 — Séance archivée — Action Supprimer révélée — Figma `2234:88`*

L’action `Supprimer` est révélée par glissement gauche : la carte se déplace avec le geste et révèle l’action placée derrière.

![[images/modale-3a-confirmer-suppression-seance-archivee.png|260]]

*Modale 3a — Confirmer la suppression d’une séance archivée — Figma `2234:189`*

Le dialogue flottant centré demande une confirmation explicite. `Annuler` ferme le dialogue et revient au résultat du filtre `Archivées`.

Le bouton destructif porte le libellé `Confirmer`. Dans l’application, sa confirmation supprime la Séance archivée tout en conservant les Exécutions historiques.

### Modale 3b – Confirmer l’archivage d’une Séance planifiée

Référence Figma : `4593:6285 — Modal — Confirmer l’archivage d’une séance planifiée`.

Cette modale est utilisée lorsqu’une Séance active possède des planifications associées. Elle indique que les planifications seront supprimées tandis que les Séances déjà effectuées restent dans l’historique. Les actions sont `Archiver` et `Annuler`.

### Modale 4 – Suppression d’une planification

![[images/modale-4-suppression-planification-unique.png|260]]

*Modale 4 — Supprimer une planification unique — Figma `1992:5365`*

Pour une planification unique, `Supprimer` ouvre un dialogue centré comportant `Annuler` et `Confirmer`. Après confirmation, la planification est supprimée ; la source associée et les Exécutions historiques sont conservées.

![[images/modale-4a-suppression-occurrences.png|260]]

*Modale 4a — Supprimer des occurrences — Figma `1992:6102`*

Pour une planification périodique, le dialogue à trois choix présente sur sa première ligne les deux actions destructives `Seulement cette occurrence` et `Toutes les occurrences à venir`, puis `Annuler` en pleine largeur sur une seconde ligne. Les deux choix peuvent mener au même écran de résultat dans le prototype ; la vue Semaine montre ensuite l’occurrence retirée. Les Exécutions historiques restent conservées.

### Modale 5 – Réinitialisation de l’Exercice

![[images/modale-5-reinitialiser-activite.png|260]]

*Modale 5 — Réinitialiser l’exercice — Figma `1992:8224`*

Référence Figma : `1992:8224`, `Modal — Réinitialiser l’exercice`. Le dialogue flottant centré utilise `Overlay / Decision Dialog`, variante `PrimaryTone=Primary,SecondaryTone=Neutral,Actions=2` (`2590:2926`), instance `2591:3047`. Il mesure `354 × 215`.

#### Objectif

Permettre de recommencer l’Exercice / Série en cours depuis son état initial sans revenir en arrière dans la Séance.

#### Ouverture

La modale s’affiche après appui sur `Réinitialiser l’exercice`.

L’Exécution est suspendue pendant l’affichage de la modale.

#### Contenu

**Titre**

> Réinitialiser l’exercice ?

**Message**

> L’exercice en cours recommencera depuis le début. La progression de la séance sera conservée.

**Actions**

- `Annuler`, action neutre grise ;
- `Confirmer`, action primaire bleue.

#### Comportement

Après confirmation :

- l’Exercice / Série courante reste l’Exercice courant ;
- un Exercice chronométré retrouve sa durée initiale ;
- un Exercice en Répétitions ou À l’échec retrouve un chronomètre d’Exercice à `00:00` ;
- la cible de répétitions reste inchangée ;
- le temps global déjà écoulé dans la Séance est conservé ;
- le Tour et le Cycle restent inchangés ;
- l’Exercice redémarre selon son comportement normal.

`Annuler` ferme la modale et reprend l’Exercice à son état précédent.

Les deux boutons `147 × 48` sont alignés sur une ligne avec un écart de `12`. Les libellés sont centrés horizontalement et verticalement. La dernière ligne du message et les actions sont séparées par `spacing/16`.

### Modale 6 – Passage à l’Exercice suivant

![[images/modale-6-activite-suivante.png|260]]

*Modale 6 — Passer à l’exercice suivante — Figma `1992:8326`*

Référence Figma : `1992:8326`, `Modal — Passer à l’exercice suivante`. Le dialogue flottant centré utilise `Overlay / Decision Dialog`, variante `PrimaryTone=Primary,SecondaryTone=Neutral,Actions=2` (`2590:2926`), instance `2591:3058`. Il mesure `354 × 215`.

#### Objectif

Confirmer l’interruption anticipée d’un Exercice chronométré.

#### Ouverture

Cette modale s’affiche lorsque l’utilisateur appuie sur `Exercice suivant` avant la fin d’un Exercice chronométré.

Elle ne s’affiche pas pour un Exercice en mode Répétitions ou À l’échec : dans ce cas, `Suivant` constitue la validation normale de la Série courante.

#### Contenu

**Titre**

> Passer à l’exercice suivante ?

**Message**

> La séance continuera avec l’exercice suivante, elle sera enregistrée comme partiellement exécutée.

**Actions**

- `Annuler`, action neutre grise ;
- `Confirmer`, action primaire bleue.

#### Comportement

Après confirmation :

- l’Exercice chronométré est arrêtée avant son terme ;
- sa durée réellement exécutée est conservée ;
- son statut métier devient `Partielle` ;
- la progression est mise à jour ;
- l’Exercice suivant démarre selon les règles normales du Plan d’Exécution.

`Annuler` ferme la modale et reprend l’Exercice en cours.

Les deux boutons `147 × 48` sont alignés sur une ligne avec un écart de `12`. Les libellés sont centrés horizontalement et verticalement. La dernière ligne du message et les actions sont séparées par `spacing/16`. Le terme visuel `partiellement exécutée` décrit le résultat à l’utilisateur ; le statut métier enregistré reste `Partielle`.

### Modale 7 – Pause / arrêt de l’Exécution

![[images/modale-7-seance-en-pause.png|260]]

*Modale 7 — Séance en pause — Figma `1992:8428`*

Référence Figma : `1992:8428`, `Modal — Séance en pause`. Le dialogue flottant centré utilise `Overlay / Decision Dialog`, variante `PrimaryTone=Primary,SecondaryTone=Danger,Actions=2` (`2590:2960`), instance `2591:3070`. Il mesure `354 × 194`.

#### Objectif

Suspendre temporairement une Exécution puis permettre soit de la reprendre, soit de l’arrêter.

#### Ouverture

La modale est affichée après appui sur `Pause`.

L’Exécution est immédiatement suspendue.

#### Contenu

**Titre**

> Séance en pause

**Message**

> L’exercice « Squats assistés » est suspendue.  
> Le chronomètre reprendra là où il s’est arrêté.

Le nom d’Exercice est dynamique ; `Squats assistés` est uniquement la donnée d’illustration de la frame.

**Actions**

- `Reprendre la séance`, action primaire bleue
- `Arrêter la séance`, action destructive rouge

Les deux boutons `147 × 48` sont alignés sur une ligne avec un écart de `12`. Les libellés sont centrés horizontalement et verticalement. La dernière ligne du message et les actions sont séparées par `spacing/16`.

#### Reprendre la séance

Ferme la modale et reprend l’Exercice à l’état exact où elle a été suspendue.

Pour un Exercice chronométré, le compte à rebours reprend.  
Pour un Exercice en Répétitions ou À l’échec, le chronomètre croissant reprend.

#### Arrêter la séance

Met fin à l’Exécution :

- la progression réellement effectuée est enregistrée ;
- le statut de l’Exécution devient `Interrompue` ;
- l’écran `Synthèse de séance` est affiché.

La modale ne peut être fermée que par l’une des deux actions prévues.

### Modale 8 – Supprimer une valeur de référentiel

Cette famille de modales est ouverte par appui long sur une option dans les sélecteurs `Étiquettes`, `Catégorie` ou `Zones corporelles`.

Références Figma :
- Étiquette : `4861:6145 — Composition séance — Étiquettes — Appui long — Confirmation suppression` ;
- Catégorie : `4861:6259 — Ajouter un exercice — Catégorie — Appui long — Confirmation suppression` ;
- Zone corporelle : `4861:6348 — Ajouter un exercice — Zones corporelles — Appui long — Confirmation suppression`.

Le dialogue utilise la variante destructive à deux actions de `Overlay / Decision Dialog`. Le titre reprend la valeur concernée sous la forme `Supprimer « {nom} » ?`. Le message précise, lorsque la valeur est utilisée, qu’elle sera retirée des objets courants concernés et que l’historique restera inchangé.

Actions :
- `Annuler` : ferme la confirmation sans modifier le référentiel ni la sélection ;
- `Supprimer` : supprime la valeur, retire sa sélection courante et ses associations courantes, puis restitue la modale de sélection actualisée.

Cette règle s’applique aux valeurs initiales comme aux valeurs créées ensuite par l’utilisateur.

### Contrôles à roulette – Compte à rebours et fins

Toutes les **durées** réglées par roulette utilisent une modale basse standardisée. Les entiers simples `Nombre de Séries`, `Nombre de répétitions` et `Nombre de Tours` utilisent des steppers inline conformément à D-219. Les sélections d’objets utilisent leurs modales dédiées.

Dans le Profil, les contrôles `Compte à rebours initial`, `Fin de séance`, `Compte à rebours d’exercice` (`4179:9550`) et `Fin d’exercice` (`4179:9556`) servent de préférences proposées à la création de nouveaux contenus. Les valeurs ne sont appliquées qu’après `Confirmer`.

Les valeurs initiales de l’application sont `10 s` pour le Compte à rebours initial et `5 s` pour la Fin de séance. Une durée de `0 s`, lorsqu’elle est choisie par l’utilisateur, rend la phase instantanée sans supprimer l’élément structurel.

## Règles transverses de l’éditeur d’Exercice

Les écrans Exercice placent le champ Nom en premier dans la zone bleue et suppriment le contexte de Séance. Aucun type d’Exercice n’est affiché. Le segment Mode contient trois options égales : `Durée`, `Répétitions`, `À l’échec`. Dans le MVP, la zone Média suit les frames courantes et la carte d’Exercice du Catalogue peut être déployée pour afficher le média associé. Les capacités d’import/capture restent régies par leur périmètre propre. Les accès `Catégorie` et `Zones corporelles` utilisent une icône `+` séparée de leur libellé.

La frame `3561:7802` documente l’état À l’échec : ordre `Séries` → cadre informatif `à l’échec` → `Pause`, seconde rangée `Changement de côté / Récupération / Durée totale >=`, sans cible chiffrée. Les états actuels des roulettes utilisent les modales basses standardisées. Dans les états renseignés, `Renforcement du genou` est une donnée de démonstration ; seul `3943:6064` conserve `Nom de l’exercice` comme placeholder de l’état vide.

## Composant transverse `Status / Badge`

La preuve visuelle canonique du composant est le node `3959:5970`, `Status / Badge — Source exact`. Elle porte les sept variantes de la propriété `Status` dans un composant unique.

![[images/status-badge-composant.png|700]]

*Composant — `Status / Badge — Source exact` — Figma `3959:5970` — export PNG ×2*

Les sept variantes se répartissent en deux familles sémantiques, sans que cette répartition scinde le composant :

| Famille | Variantes | Node de variante |
| --- | --- | --- |
| Statuts d’exécution | `Terminée`, `Partielle`, `Interrompue` | `3959:5966`, `3959:5963`, `3959:5969` |
| Statuts d’élément / provenance | `Catalogue`, `Planifiée`, `Exécutée`, `Archivée` | `3959:5951`, `3959:5954`, `3959:5957`, `3959:5960` |

Les preuves d’usage sont distinctes de la preuve du composant et ne s’y substituent pas :

| N° | Écran | Variantes visibles | Node Figma |
| --- | --- | --- | --- |
| Écran 11 | Suivi : Séances — Liste condensée | `Terminée`, `Partielle`, `Interrompue` | `1992:8843` |
| Écran 11a | Suivi : Séances — Vue déployée | `Terminée`, `Partielle`, `Interrompue` | `1992:8996` |

## Couverture du Prototype MVP et exclusions justifiées

### Périmètre intégré

La page Figma `Prototype MVP` (`510:101`) constitue la source visuelle des frames de production. Une capture ne remplace pas la règle écrite : le présent chapitre définit les comportements, tandis que les captures et le chapitre 13 définissent les références visuelles et critères déterministes.

### Éléments non intégrés comme écrans distincts

Les calques internes, zones tactiles transparentes, cibles de défilement et duplications de liens de prototypage ne constituent pas des écrans distincts. Les états fonctionnels sans frame dédiée réutilisent les composants de leurs écrans parents ; aucune fausse capture Figma ne doit être inventée.

### Règle de maintenance

Lorsqu’une nouvelle frame de premier niveau est ajoutée au `Prototype MVP`, elle doit être soit intégrée dans ce chapitre avec sa règle fonctionnelle, soit explicitement classée hors périmètre avec justification. Une variante ne peut plus être omise silencieusement.

## Traçabilité documentaire et contrôles historiques

### État des lieux Figma ↔ chapitre 06 — 24 septembre 2026

Un contrôle direct de la page Figma `Prototype MVP` recense actuellement **122 frames de premier niveau**, dont **13** explicitement nommées `HISTORIQUE`, `PROPOSITION`/`Proposition`, `Comparaison` ou `Avant / Après`. Après ces exclusions nominales, **109 frames de premier niveau actives** restent à qualifier. Le Splash `1992:469` est la référence active et unique de la page `Prototype MVP` conformément à D-218.

Avant cette passe, **77** de ces frames étaient déjà référencées par leur node dans le chapitre 06 et **30** ne l’étaient pas. La présente mise à jour traite ces 30 écarts selon leur nature. Après correction, les **109 frames actives** sont toutes soit référencées explicitement dans ce chapitre, soit classées comme planches de référence de composant lorsqu’elles ne constituent pas un écran autonome.

| Node Figma | Frame | Traitement documentaire |
| --- | --- | --- |
| `4760:6448` | Synthèse partielle — Évaluation initiale | Référencée dans Écran 10 |
| `4760:6500` | Synthèse partielle — Ressenti sélectionné | Référencée dans Écran 10 |
| `3722:5061` | Composition séance — Point d’arrêt | Référencée dans Écran 3 |
| `4168:11149` | Catalogue Séances — Filtrer — Panneau ouvert | Référencée dans Écran 2 |
| `4168:11262` | Catalogue Exercices — Filtrer — Panneau ouvert | Référencée dans Écran 12 |
| `4593:6285` | Confirmer l’archivage d’une séance planifiée | Référencée dans les modales |
| `4217:6980` | Ajouter un exercice — paramètres repliés | Référencée dans Écran 4 |
| `4279:7044` | Ajouter un exercice — paramètres dépliés | Référencée dans Écran 4 |
| `4294:7075` | Ajouter un exercice — invitation à paramétrer | Référencée dans Écran 4 |
| `4734:6342` | Modifier un exercice — Squats sautés | Référencée dans Écran 4 |
| `4332:7095` | Durée de l’Exercice — roulette ouverte | Référencée dans Écran 4 |
| `4474:7157` | Catégorie — Nouvelle catégorie — clavier | Référencée dans Écran 4 |
| `4478:7209` | Zones corporelles | Référencée dans Écran 4 |
| `4683:6336` | Nouvelle zone corporelle — clavier | Référencée dans Écran 4 ; création inline conforme au référentiel administrable |
| `4861:6145` | Étiquette — confirmation suppression | Référencée dans Écran 3 et Modale 8 |
| `4861:6259` | Catégorie — confirmation suppression | Référencée dans Écran 4 et Modale 8 |
| `4861:6348` | Zone corporelle — confirmation suppression | Référencée dans Écran 4 et Modale 8 |
| `4521:6220` | Catalogue Exercices — État vide | Référencée dans Écran 12 |
| `4544:6344` | Exercices — Filtre inactif étendu | Référencée dans Écran 12 |
| `4544:6651` | Exercices — Filtre actif étendu | Référencée dans Écran 12 |
| `4549:6382` | Séances — Filtre inactif étendu | Référencée dans Écran 2 |
| `4549:6742` | Séances — Filtre actif Archivées | Référencée dans Écran 2 |
| `4592:6217` | Séances — actions glissées — Dos et mobilité | Couvert par la famille Écran 2d ; référence complémentaire |
| `4738:6209` | Exercices — actions glissées | Référencée dans Écran 12 |
| `4738:6355` | Exercices — carte déployée — Média | Référencée dans Écran 12 |
| `4367:7128` | Modèle paramètre — Mode Durée | **Pas un écran utilisateur** : planche de référence |
| `4367:7276` | Modèle paramètre — Compte à rebours | **Pas un écran utilisateur** : planche de référence |
| `4367:7906` | Modèle paramètre — Côté | **Pas un écran utilisateur** : planche historique/référence, le libellé actif est `Changement de côté` |
| `4367:8052` | Modèle paramètre — Récupération | **Pas un écran utilisateur** : planche de référence |
| `4367:8193` | Modèle paramètre — Durée totale | **Pas un écran utilisateur** : planche de référence |
| `4490:6757` | Modèle paramètre — À l’échec | **Pas un écran utilisateur** : planche de référence |
| `4490:6903` | Modèle paramètre — Répétitions | **Pas un écran utilisateur** : planche de référence |
| `4534:6339` | Filtre — États du contrôle | **Pas un écran utilisateur** : planche de référence du composant |

Cette distinction est normative pour la documentation : une frame Figma de référence de composant ne doit pas être promue artificiellement au rang d’écran ou de modale. Les **copies d’écrans** restent centralisées exclusivement dans ce chapitre 06 ; la mise à jour physique des captures est une étape séparée.

Le contrôle a également identifié des références documentaires devenues inexistantes dans Figma : `1992:10749`, `2028:11921`, `3879:5947`, `3879:6079`, `3835:5385`, `3835:5465`, `3836:5437`, `3836:5503` et `3787:5209`. Elles ne doivent plus être présentées comme références courantes. Elles ont été soit remplacées par une frame active, soit conservées uniquement comme traces historiques lorsque la fonctionnalité réutilise désormais une autre famille d’écrans.

### Mise à jour Bilatéralité — rectifiée le 13 septembre 2026

Le contrôle Exercice porte le libellé `Changement de côté` et propose `Aucun`, `D→G`, `G→D`. Sa géométrie suit le Figma courant et le DSF actif. Aucun contrôle de changement de côté n’est exposé au niveau du Circuit.

Dans la Composition actuelle, aucun contrôle de changement de côté n’est affiché dans l’en-tête du Circuit. Le stepper `Nombre de tours` reste la seule commande numérique de ce groupe ; les anciennes références Figma de direction Tour sont historiques et ne constituent plus la cible active.

Aucune confirmation d’activation bilatérale du Tour n’est exposée dans la version actuelle. Le support technique historique du côté Tour reste conservé pour non-régression, fixé à `UNILATERAL` et non modifiable.

Dans une carte d’Exercice, l’indicateur propre affiche `D→G` ou `G→D` lorsque l’Exercice est bilatérale ; il est absent avec `Aucun`. La synthèse place `à droite, puis à gauche` ou `à gauche, puis à droite` après la cible du mode — après `jusqu’à l’échec` — et avant la Pause. Les références géométriques suivent le Figma courant.

Dans l’Écran 9, un Exercice effectivement bilatérale affiche `Côté droit` ou `Côté gauche` sous son nom. Les indicateurs de progression gardent leur sémantique ; aucun compteur de côté n’est ajouté. Les frames d’Exécution existantes restent inchangées.

### Évidences Figma T03 — état courant du 16 septembre 2026

Les contrôles d’entrée `Créer / Filtrer / Trier` restent conçus et vérifiables dans Figma pour leur rendu. Les références courantes principales sont `3786:5093` (Catalogue Exercices), `1992:9910` (Catalogue Séances), `3561:4695`, `3561:7673`, `3561:7802`, `3943:6064` (éditeur Exercice), `2537:1033` (Déployer) et `2537:214` (Navigation Bottom). Les anciennes frames d’arbre `3787:5148` et `3841:8375` sont supersédées fonctionnellement par D-187.

L’ancienne référence `3787:5209 — Catalogue — action contextuelle directe` n’existe plus dans le Figma courant et ne constitue plus une évidence active. Les panneaux ouverts de `Filtrer` sont désormais conçus et vérifiables dans Figma ; `Trier` reste disabled T03.

### Résolutions postérieures au contrôle visuel du 16 septembre 2026

Les points suivants ont été résolus depuis ce contrôle : la modale d’abandon de création d’Exercice est représentée par `4714:6241`; les panneaux ouverts de `Filtrer` sont conçus ; l’affichage média déployé du Catalogue des Exercices appartient au MVP ; l’ancien arbre `Créer` reste historique ; la création inline d’une Zone corporelle dans `4683:6336` est désormais cohérente avec D-199. Un point d’évidence visuelle reste **NON VÉRIFIABLE** et devra être traité lors de l’inventaire Figma avant réexport :

1. **Écran 1e — Profil, parcours encore vide.** La frame `2139:86` produit un export strictement identique à celui de la frame `1992:684` (`Vibration activée`). La documentation n’en déduit aucune règle fonctionnelle supplémentaire.

## États Figma — conception média pendant l’Exécution

> **Statut roadmap : conception post-MVP à planifier.** Ces frames sont des évidences visuelles de la cible et ne requalifient pas le périmètre MVP courant.

| État | Node Figma | Conséquence fonctionnelle |
| --- | --- | --- |
| Test 2 Exécution d’une séance — Initial — Bascule (info) | `4997:6015` | Face Information ; bouton de changement de face lorsque des médias existent. |
| Test 2 Exécution d’une séance — Initial — Bascule (média) | `4997:6113` | Face Média ; un média à la fois ; bouton de retour ; pagination de galerie. |
| Test 2 Exécution d’une séance — Média plein écran | `5009:6069` | Média plein écran avec contrôles média distincts et cadre flottant d’Exécution. |

La navigation et les comportements associés sont définis par D-203 et `../CONCEPTION-EXECUTION-MEDIA.md`.

### Planification depuis les Catalogues — D-206

Une Séance et un Exercice persistant sont tous deux planifiables directement. L’action `Planifier` d’une carte ouvre le même parcours de planification avec la source préremplie. Le parcours depuis le Calendrier permet de choisir une source planifiable parmi les Séances et les Exercices persistants. La famille d’écran historiquement nommée `Planifier une séance` est donc un gabarit de planification générique ; les frames Figma actuellement nommées avec `séance` constituent l’évidence visuelle de cette variante, mais ne limitent plus le comportement fonctionnel aux seules Séances.

### Prochaine planification dans les Catalogues — D-206

Les cartes des Catalogues `Séances` et `Exercices` appliquent la même règle : si la source possède au moins une occurrence future calculée, la carte affiche la **plus proche** comme `prochaine planification`. Si aucune occurrence future n’existe, cette ligne est entièrement absente et aucun espace n’est réservé. Cette information n’est pas une différence de structure entre les deux Catalogues ; seule la nature de la source (`SESSION` ou `ACTIVITY`) diffère.

### Extension future du parcours de planification — Parcours

Le parcours générique de planification est conçu pour accepter à terme un Parcours comme troisième source. Dans le MVP, les sources actives sont Séance et Exercice ; l’option Parcours reste désactivée tant que la version correspondante n’est pas livrée. Lorsqu’elle le sera, aucune nouvelle famille d’écran de planification ne devra être créée : le même gabarit est réutilisé avec la source Parcours.

### Composition — Récupération après exercice — D-208

Sous chaque occurrence d’Exercice de la Composition, afficher systématiquement une ligne légère `Récupération {durée}`, y compris lorsque la durée vaut `0 s`. Un tap sur la durée ouvre la roulette basse de modification. Cette ligne accompagne l’occurrence lors du déplacement, de la duplication et de la suppression.

La règle vaut également :
- après le dernier Exercice d’un Tour ;
- à chaque Tour du Circuit ;
- après le dernier Exercice de la Séance, avant la Fin de séance.

Dans l’éditeur d’Exercice, le contrôle générique `Récupération` est remplacé par `Pause au changement de côté` et n’est exposé que lorsque `Changement de côté` vaut `D→G` ou `G→D`. La récupération après exercice ne figure ni dans l’éditeur ni dans la synthèse intrinsèque de l’Exercice.


**Interaction Point d’arrêt (D-217).** L’action dédiée d’ajout affiche les positions autorisées dans la Composition ; l’utilisateur choisit la position et peut quitter ce mode via le snackbar d’annulation. Un appui long sur un Point d’arrêt existant ouvre une bulle de retrait ; un appui ailleurs referme la bulle sans modification. La Récupération après exercice et le Point d’arrêt peuvent partager une même ligne visuelle mais restent deux zones et deux concepts distincts.


**Contexte d’Exécution (D-220).** La ligne immédiatement sous le nom de l’Exercice est toujours renseignée : nom de Séance et Catégorie de l’Exercice lors d’une Exécution de Séance, Catégorie de l’Exercice seule en Exécution directe. L’indication du côté courant, lorsqu’elle existe, reste distincte.


## Clôture Figma / DSF — 28 septembre 2026

- **Navigation** : quatre destinations actives seulement — `Catalogues`, `Calendrier`, `Suivi`, `Profil`. Les écrans de Recherche globale sont archivés ; aucune recherche locale de Catalogue n’est active (D-221/D-225).
- **Sélection en modale** : sélection simple = radio exclusif, validation au toucher et fermeture immédiate, sans CTA bas ; sélection multiple de Composition = cases à cocher + `Sélectionner` ; filtres = validation explicite + `Réinitialiser` (D-222/D-228).
- **Planifier** : titre `Planifier` avant connaissance du type, puis `Planifier une séance` ou `Planifier une activité`. La modale suit le gabarit D-229.
- **Fondations DSF** : fond `#FFFFFF` sauf Splash `#0006F1` et média plein écran `#0A0A0C`; zone de contexte `#EAEAFF`→transparent sur les familles couvertes ; navigation, halo, boutons circulaires, steppers et badges selon D-224 à D-227.
- **Listes/modales** : listes scrollables avec rognage ; feuilles longues alignées en haut sur la zone de contexte ; comportements et dégradés bas selon D-228.
- **Composants spécialisés** : Point d’arrêt, Ressenti, Profil, Exécution et carte média déployée suivent les variantes DSF V2 validées par D-230.


### Référence DSF V2 détaillée — clôture 28 septembre 2026

- **Navigation basse** : pilule `322 × 62 px`, `#FCFCFE`, stroke blanc 1 px, ombre `rgba(26,26,38,0.08)` blur/rayon 10 offset `0,2`; token `color/navigation/pill`. Icône Profil `famicons:people-sharp` 24×24 dans boîte 32×32 ; actif `#0508E5`, inactif `#5C636E`. Cadre actif `76 × 50 px`, bleu `#0508E5` à 10 %. Boîtes d’icônes aux abscisses 68/146/224/302 dans la référence 402 px, soit 28 px entre bord de pilule et boîte extrême et 78 px entre centres. Intégration écran : 16 px sous la pilule, bande opaque 16 px puis dégradé transparent→fond sur 40 px ; ces bandes appartiennent à l’écran.
- **Fond / contexte** : écran ordinaire `#FFFFFF`; Splash `#0006F1`; média plein écran `#0A0A0C`. Zone de contexte `#EAEAFF`→transparent sur les 20 % inférieurs pour Catalogues, Composition, Calendrier, Suivi, Profil et Ajout d’exercice. Le séparateur 1 px n’est retiré que si ce dégradé assure la séparation.
- **Halo et action circulaire** : halo Annuler/Retour blanc opaque `59,28 px`, placé devant la zone de contexte et hors du conteneur clippé ; bouton circulaire clair `32 × 32`, `#FCFCFE`, stroke blanc 1 px, ombre `rgba(26,26,38,0.08)` blur 10 offset `0,2`.
- **Stepper / valeur** : variante lavande `#F2F2FF` pour Profil/paramètres, variante blanche pour Tours de Composition ; `−/+` ronds bleus, 12 px autour de la valeur centrale. Le stepper remplace la valeur sur la même ligne sans étirer le groupe ; un seul stepper actif à la fois. Badge replié `#F4F4F8`, texte bleu Semi Bold 13 px, rayon 10, padding 10×4 px. Le nombre de semaines utilise la pilule de stepper rayon 18.
- **Point d’arrêt** : bouton rond blanc opaque, icône Pause, contour 1 px `#0508E5`; l’action complète porte le contour. Les occurrences de Composition utilisent cette référence commune.
- **Ressenti** : ne pas confondre contrôle de choix et pictogramme de résultat. Résultats : vert Bien, orange Neutre, rouge Mal ; rouge source `#EF4444`. Aucun état actif Figma ne prouve un contrôle « Mal sélectionné ».
- **Profil** : titres de section Semi Bold 16 px ; `Modifier` en `#0508E5`; groupes blancs 126 px ; zone de contexte 115 px ; ouverture d’un stepper sans étirement du groupe.
- **Exécution** : sur les cinq écrans portant `Zone — Progression et suite`, début `y=449`, hauteur `305 px`. Dans la variante haute avec texte, conserver 95 px avant la zone. Variante média : `Série X/3 • Tour X/3` en Roboto Condensed Medium 24 px.
- **Carte média déployée** : état réellement déployé avec carte et barre latérale étendues, chevron haut, deux aperçus réduits, chevron entre eux, marge droite 16 px et cartes suivantes repositionnées ; ne pas utiliser l’ancienne carte condensée comme référence de cet état.


### Phrase de synthèse v10.2 — règle fonctionnelle

Le rendu Figma n’est pas la table de vérité du texte. La phrase suit D-232 : vide avant sélection d’un mode ; mode affiché séparément ; ordre `Séries → valeur/jusqu'à l'échec → pause séries → changement de côté → Durée totale éventuelle`; recalcul immédiat à chaque changement. Le classeur v10 fournit les fragments et cas de test de référence. Les arbitrages V1 sont consolidés par D-232 ; seul le choix V2 de lecture/copie de `r` reste À CLARIFIER hors MVP.


#### Contrôles numériques validés — D-232

- Séries : stepper `1..99`.
- Répétitions : stepper `1..100`.
- Durée par Série : roulette `1 s..99 min 59 s`.
- Pause entre Séries et Pause au changement de côté : roulette dans l'Exercice, `0..5 min`, valeurs proposées par `5 s` jusqu’à `2 min`, puis `30 s` jusqu’à `5 min` ; les réglages de durée du Profil utilisent un stepper.
- Pause entre Séries : valeur initiale `5 s` lorsqu’elle devient applicable.
- Pause au changement de côté : valeur courante du Profil copiée dans l’Exercice lorsqu’elle devient applicable.
- Compte à rebours : contrôle séparé de la phrase ; sa valeur et la Fin de séance n’entrent pas dans le calcul de Durée totale.


## Copies d’écran intégrées — campagne du 28 septembre 2026

Ces copies proviennent des frames actives de `Prototype MVP` classées « écran / état utilisateur » dans la matrice de couverture. Les variantes historiques, planches de conception et écrans archivés restent hors export. Chaque copie est rendue à l’échelle native `402 × 874 px`. Le registre des évidences consigne le node et l’empreinte Git du PNG ; la revue des contrats est tracée séparément au chapitre 13.

### Catalogues et sélection

| N° matrice | État Figma | Copie intégrée | Node |
|---:|---|---|---|
| 89 | Catalogue des séances — Filtrer — Panneau ouvert | ![[images/figma-4168-11149.png\|220]] | `4168:11149` |
| 90 | Catalogue des Exercices — Filtrer — Panneau ouvert | ![[images/figma-4168-11262.png\|220]] | `4168:11262` |
| 106 | Catalogue des exercices — État vide | ![[images/figma-4521-6220.png\|220]] | `4521:6220` |
| 108 | Catalogue des Exercices — Liste — Filtre inactif étendu | ![[images/figma-4544-6344.png\|220]] | `4544:6344` |
| 109 | Catalogue des Exercices — Liste — Filtre actif étendu | ![[images/figma-4544-6651.png\|220]] | `4544:6651` |
| 110 | Catalogue des séances — Liste — Filtre inactif étendu | ![[images/figma-4549-6382.png\|220]] | `4549:6382` |
| 116 | Catalogue des Exercices — Liste — actions glissées | ![[images/figma-4738-6209.png\|220]] | `4738:6209` |
| 117 | Catalogue des Exercices — Liste — Première carte déployée — Média | ![[images/figma-4738-6355.png\|220]] | `4738:6355` |
| 134 | Modal — Choisir un exercice — Planification — Liste longue | ![[images/figma-5451-4272.png\|220]] | `5451:4272` |

### Éditeur d'Exercice

| N° matrice | État Figma | Copie intégrée | Node |
|---:|---|---|---|
| 93 | Ajouter une activité — Squats sautés — Paramètres dépliés — Vue défilée | ![[images/figma-4279-7044.png\|220]] | `4279:7044` |
| 96 | Ajouter une activité — Squats sautés — Durée de l’activité — Roulette ouverte | ![[images/figma-4332-7095.png\|220]] | `4332:7095` |
| 102 | Ajouter une activité — Squats sautés — Catégorie — Nouvelle catégorie — Clavier ouvert | ![[images/figma-4474-7157.png\|220]] | `4474:7157` |
| 114 | Ajouter une activité — Squats sautés — Zones corporelles — Nouvelle zone corporelle — Clavier ouvert | ![[images/figma-4683-6336.png\|220]] | `4683:6336` |
| 115 | Modal — Abandonner la création de l’activité | ![[images/figma-4714-6241.png\|220]] | `4714:6241` |
| 120 | Ajouter une activité — Catégorie — Appui long — Confirmation suppression | ![[images/figma-4861-6259.png\|220]] | `4861:6259` |
| 121 | Ajouter une activité — Zones corporelles — Appui long — Confirmation suppression | ![[images/figma-4861-6348.png\|220]] | `4861:6348` |
| 127 | Ajouter un exercice — Catégorie renseignée | ![[images/figma-5088-6398.png\|220]] | `5088:6398` |

### Composition de séance

| N° matrice | État Figma | Copie intégrée | Node |
|---:|---|---|---|
| 47 | Composition séance — Étiquettes | ![[images/figma-2028-11204.png\|220]] | `2028:11204` |
| 75 | Composition séance — Point d’arrêt | ![[images/figma-3722-5061.png\|220]] | `3722:5061` |
| 76 | Composition séance — Étiquette sélectionnée | ![[images/figma-4581-6404.png\|220]] | `4581:6404` |
| 113 | Composition séance — Nouvelle étiquette | ![[images/figma-4640-6308.png\|220]] | `4640:6308` |
| 119 | Composition séance — Étiquettes — Appui long — Confirmation suppression | ![[images/figma-4861-6145.png\|220]] | `4861:6145` |
| 126 | Modification d'une séance | ![[images/figma-5271-5455.png\|220]] | `5271:5455` |
| 128 | Composition d’une séance — Placement d’un point d’arrêt | ![[images/figma-4893-6675.png\|220]] | `4893:6675` |
| 133 | Composition séance — Retirer un point d’arrêt | ![[images/figma-5301-5443.png\|220]] | `5301:5443` |

### Exécution directe et synthèse

| N° matrice | État Figma | Copie intégrée | Node |
|---:|---|---|---|
| 123 | Exécution d'un exercice — Démarrée | ![[images/figma-4968-8188.png\|220]] | `4968:8188` |
| 124 | Synthèse d'exécution — Exercice Terminé — Évaluation initiale | ![[images/figma-4968-8055.png\|220]] | `4968:8055` |
| 125 | Synthèse d'exécution — Exercice Terminé — Ressenti sélectionné | ![[images/figma-4968-8105.png\|220]] | `4968:8105` |
| 130 | Exécution d'un exercice — Initial — Bascule haute avec média | ![[images/figma-5588-4363.png\|220]] | `5588:4363` |
| 131 | Exécution d'un exercice — Initial - Cercle avec Texte | ![[images/figma-5021-5994.png\|220]] | `5021:5994` |
| 132 | Exécution d'un exercice — Démarré — Bascule haute avec texte | ![[images/figma-5581-4257.png\|220]] | `5581:4257` |

### Synthèse de séance

| N° matrice | État Figma | Copie intégrée | Node |
|---:|---|---|---|
| 34 | Synthèse de séance — Partielle — Évaluation initiale | ![[images/figma-4760-6448.png\|220]] | `4760:6448` |
| 35 | Synthèse de séance — Partielle — Ressenti sélectionné | ![[images/figma-4760-6500.png\|220]] | `4760:6500` |

### Autres

| N° matrice | État Figma | Copie intégrée | Node |
|---:|---|---|---|
| 91 | Modal — Confirmer l’archivage d’une séance planifiée | ![[images/figma-4593-6285.png\|220]] | `4593:6285` |
