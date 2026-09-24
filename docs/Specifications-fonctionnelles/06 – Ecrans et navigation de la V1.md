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

La création d’une Séance ou d’une Activité, y compris son éventuelle durée de Récupération, doit pouvoir être réalisée en quelques secondes, avec un minimum de saisies et de touchers.

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
- Les noms de Séance et d’Activité utilisent au maximum deux lignes dans une carte. Au-delà, ils sont tronqués avec une ellipse et leur contenu complet reste disponible dans l’écran de détail ou d’édition.
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
- La recherche conserve un bouton circulaire distinct. La barre principale absorbe la variation de largeur tandis que la recherche conserve sa cible tactile.
- Les quatre destinations principales occupent quatre emplacements répartis régulièrement entre les marges internes de la barre principale. Leur distribution est recalculée à partir de la largeur réelle de cette barre ; elle n’inclut pas la zone réservée à la recherche.
- Les pictogrammes conservent leur taille visuelle. Sur écran compact, c’est l’espacement entre leurs emplacements qui diminue ; aucun pictogramme, libellé actif ou halo de sélection ne peut chevaucher la recherche.
- L’onglet actif peut afficher son libellé ; les autres conservent uniquement leur pictogramme. Le libellé actif ne doit pas chevaucher les pictogrammes voisins avec l’agrandissement du texte.
- Le composant canonique est `Navigation / Bottom — Source exact` (`2537:214`). Les destinations utilisent les variantes `2537:86` Catalogues, `2537:118` Calendrier, `2537:150` Suivi et `2537:182` Profil. Chaque dessin reste ≤ `24 pt`, centré dans une boîte optique `32 × 32 pt`, avec cible tactile ≥ `48 × 48 pt`. La Recherche utilise `2736:2` dans un contrôle `58 × 58 pt`. Aucun glyphe, emoji ou pictogramme système ne remplace ces vecteurs DSF.

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
- Tout contrôle historique de type `pull-up`, `pull-down` ou menu numérique ouvre désormais la variante `Type=Numeric wheel` du composant DSF `Picker / Popover — Source exact`. Cette variante native OS comporte une seule colonne, mesure `144 × 203`, conserve une zone de sélection de `56 × 34` et les deux actions canoniques Annuler/Confirmer. Le contrôle fermé continue d’afficher uniquement la dernière valeur confirmée.

### Modales basses / bottom sheets

Les modales basses utilisent le gabarit DSF commun : en-tête de `60` points, zone utile de `378` points dans une largeur de référence `402`, avec `12` points de marge latérale de chaque côté. Le premier élément fonctionnel visible du contenu est placé à `spacing/modal-content-top-inset = 16` points sous l’en-tête. Le dernier élément fonctionnel visible conserve `spacing/modal-bottom-inset = 22` points avant le bas de la modale.

Ces insets sont des règles de composition du contenu et ne doivent pas être recalculés depuis la taille des zones tactiles. Lorsqu’un contrôle compact possède une cible tactile `48 × 48` plus grande que sa représentation visible, l’espacement vertical ou horizontal avec le contrôle voisin est mesuré entre les boîtes visuelles ; la zone tactile transparente ne constitue pas une marge supplémentaire. La hauteur de la modale suit son contenu et n’ajoute pas de vide structurel au-delà de ces insets, sous réserve de la limite maximale de hauteur de la famille.

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
| Composition, Activité, Catégories, Planification | En-tête et action finale fixes ; le formulaire central défile. Avec le clavier ouvert, l’action reste atteignable sans recouvrir le champ actif. |
| Activité | Aucun contrôle de type n’est affiché. `Description de l’activité`, `Zone corporelle`, `Mode d’exécution` et `Médias` sont des sections repliables ; Mode est déployé par défaut. Le segment `Durée / Répétitions / À l’échec` utilise trois zones égales. Les rangées `Séries / cible / Pause` et `Côté / Récupération / Durée totale` conservent leurs emplacements. La synthèse et l’action `Terminer` restent fixes. |
| Planification | `Aucun` et `Personnalisé` restent fixes aux extrémités du contrôle de rappel. Les raccourcis intermédiaires occupent une zone horizontale défilante et extensible. Le récapitulatif de planification reste contenu dans son cadre avec ses marges internes. |
| Calendrier Semaine | La barre des jours reste lisible sur la largeur compacte ; les sept jours se répartissent la largeur disponible sans défilement horizontal. La liste journalière défile verticalement, utilise `8` points entre ses cartes et s’arrête `16` points avant la séparation de navigation. |
| Calendrier Mois | Les sept colonnes se répartissent la largeur disponible ; une cellule peut grandir verticalement mais ne défile pas horizontalement. |
| Exécution | Les commandes essentielles restent visibles sans défilement à la taille de texte standard. Le libellé du temps écoulé est séparé de la progression par Tours de `24` points. Avec agrandissement accessible, le contenu peut défiler, mais l’Activité courante, le temps et les commandes restent atteignables. |
| Synthèse | Le choix du ressenti reste composé de trois options de largeur égale. Les séparations verticales structurantes utilisent `16` points entre statut et date, `32` points avant la section Ressenti et `24` points avant la section Commentaire. Sur écran compact ou texte agrandi, les libellés explicatifs se placent sous les icônes sans réduire leur cible tactile. |
| Suivi | `Séances` et `Vue d’ensemble` occupent deux segments égaux. Le groupe `Filtrer / Trier` est centré comme un ensemble et précède la liste de `32` points. Les groupes de dates sont séparés de `16` points. Les actions de chaque carte restent ancrées à droite et la liste défile dans une zone arrêtée au moins `16` points avant la navigation basse. |
| Recherche globale | Le champ utilise la largeur disponible entre Retour et les limites sûres ; les résultats défilent indépendamment de l’en-tête. Dans l’état `1992:10129 — Recherche globale — Champ déployé`, la rangée Catalogue `Créer / Filtrer / Trier` reste visible dans le Catalogue d’arrière-plan. |
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

`Catalogues` est le libellé permanent du premier onglet. Dans cet espace, les titres contextuels sont `Catalogue des séances`, `Catalogue des activités` et `Catalogue des circuits`. Après le splash et après une relance complète, le Catalogue s’ouvre sur le segment `Séances`; le dernier segment utilisé n’est pas persisté entre deux lancements complets.

L’onglet `Calendrier` permet de visualiser les Séances planifiées et d’accéder à la création et à la gestion des Routines.  
L’onglet `Suivi` permet de consulter les Exécutions enregistrées.  
L’onglet `Profil` permet d’accéder aux informations utilisateur et aux Préférences globales de l’application.

La barre de navigation principale utilise le composant DSF canonique décrit plus haut. L’onglet actif est matérialisé par la variante active correspondante ; aucune substitution par glyphe ou emoji système n’est autorisée.

### Parcours de création d’une Séance

Depuis `Catalogues`, segment `Séances`, l’utilisateur peut créer une Séance.

La création suit le parcours suivant :

1. saisie du nom, choix de la couleur et composition de la Séance dans l’écran unique `Composition d’une séance` ;
2. ajout d’au moins un Exercice valide ;
3. action `Continuer` ;
4. sélection facultative d’une ou plusieurs Catégories ;
5. retour au `Catalogue des séances`, segment `Séances`, après validation.

Aucune Routine n’est créée automatiquement. La transition canonique d’avancement fait entrer l’écran cible depuis la droite et sortir l’écran courant vers la gauche.

### Parcours du Catalogue des Activités — MVP T03

Depuis le Catalogue, l’utilisateur sélectionne `Activités` pour consulter la bibliothèque persistante. La surface d’une carte ouvre l’Activité en consultation ou modification ; son bouton Lecture lance l’Exécution directe. L’action `Créer` est contextuelle : dans le Catalogue des Activités, elle ouvre directement la création d’une Activité persistante, sans écran ni arbre intermédiaire.

La rangée commune de commandes d’entrée est `Créer / Filtrer / Trier`. Le contrôle Filtrer démarre replié et blanc sans filtre. Un appui l’étend et affiche `Filtre / Aucun` sans modifier la liste ; un filtre sélectionné est conservé pendant la session courante, puis réinitialisé à `Aucun` au relaunch. Dans la référence Figma `402 pt`, chacun mesure visuellement `108 × 32 pt`, avec `8 pt` entre contrôles et un ensemble centré (`x=31`, `147`, `263` comme mesures de preuve uniquement, jamais comme coordonnées absolues RN). Les cibles tactiles restent ≥ `48 × 48 pt`. Pour `Activités`, `Filtrer` est fonctionnel au minimum pour `Archivées`; aucune autre option ne doit être inventée. `Trier` reste visible mais désactivé et le tri appliqué reste `updatedAt DESC`. Recherche, filtre Archives, tri implicite et scroll sont conservés pendant l’aller-retour courant, mais perdus au relaunch.

Depuis la Composition d’une Séance, `Ajouter une activité` ouvre les choix `Une nouvelle activité / Une activité existante / Annuler`. La première action ouvre l’éditeur d’une Activité de Séance ; la seconde ouvre la sélection multiple du Catalogue des Activités. La validation copie les Activités dans leur ordre visible et restaure la Composition.

### Parcours d’ouverture et de modification d’une Séance

Dans le `Catalogue des séances`, toucher la zone principale d’une carte active ouvre directement la Séance en mode modification dans `Composition d’une séance`. Cette action est disponible que la carte soit condensée ou déployée.

Le déploiement de la carte est facultatif et sert uniquement à consulter rapidement son contenu.

Le chevron déploie ou replie la carte. La zone `Démarrer` lance le parcours d’Exécution. Ces zones tactiles conservent chacune leur comportement propre.

### Parcours d’Exécution

Ouvrir une Séance depuis le Catalogue, ou demander l’Exécution d’une occurrence depuis une Routine, ouvre d’abord l’écran d’Exécution.

L’ouverture de cet écran ne démarre pas immédiatement la première Activité.

L’utilisateur déclenche l’Exécution depuis l’écran lui-même. Le Compte à rebours initial est alors exécuté, s’il est configuré avec une durée supérieure à zéro, puis la première Activité commence.

Lorsque la Séance se termine, l’écran de synthèse est affiché. L’action `Terminer` ramène ensuite l’utilisateur au `Suivi`.

### Parcours de consultation du Suivi

Dans le MVP, le `Suivi` affiche la liste des Exécutions enregistrées.

La future `Vue d’ensemble` reste visible dans le sélecteur mais elle est grisée et inactive. Elle est prévue pour une version ultérieure.

Chaque carte peut être déployée individuellement pour consulter le détail de l’Exécution directement dans la liste.

Les commandes `Vue d’ensemble`, `Filtrer` et `Trier` sont visibles mais désactivées dans le MVP. Les fonctions correspondantes restent post-MVP. Cette règle du Suivi est distincte du Catalogue T03, où `Filtrer` est fonctionnel pour `Archivées` sur Activités.

### Écrans principaux

Les écrans principaux du MVP sont :

1. `Profil` ;
2. `Catalogue des séances` ;
3. `Composition d’une séance`, incluant le nom et la couleur ;
4. `Création / modification d’une Activité — Exercice` ;
5. numéro réservé — ancien écran autonome Récupération supprimé ;
6. `Catégories de la séance` ;
7. `Calendrier` ;
8. `Planifier une séance` ;
9. `Exécution de séance`, incluant les états et commandes d’interruption ;
10. `Synthèse de séance` ;
11. `Suivi — Séances`.

Les écrans principaux ajoutés ou activés en T03 sont :

12. `Catalogue des Activités — Liste` ;
13. supprimé — ancien `Catalogue — Créer — Arbre d’actions`, conservé uniquement comme évidence historique ;
14. `Composition — Sélectionner plusieurs Activités existantes` ;
15. `Création / modification d’une Activité persistante`, qui réutilise l’éditeur d’Activité ;
16. `Exécution directe d’une Activité — Préparation 5 s` ;
17. `Exécution directe d’une Activité — En cours` ;
18. `Synthèse d’une Activité directe`, avant et après sélection du Ressenti.

La création/modification fonctionnelle d’un Circuit reste hors T03/MVP ; son segment et son entrée peuvent être visibles mais désactivés.

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
- l’Activité et la Série en cours pendant une Exécution ;
- la position dans le Suivi.

Après la fermeture d’une modale, l’utilisateur retrouve le contexte depuis lequel elle a été ouverte.

### Enregistrement automatique

Les modifications d’objets existants sont enregistrées automatiquement lorsque l’écran ne prévoit pas explicitement une action `Valider`, `Terminer` ou `Enregistrer`.

Les écrans de création ou les modales comportant une action explicite ne valident les données qu’après cette action.

### Navigation pendant une Exécution

Pendant l’Exécution, la navigation principale n’est pas affichée.

L’utilisateur dispose de trois commandes principales :

- `Réinitialiser l’activité` ;
- `Pause` ;
- `Activité suivante`.

Il n’existe pas de bouton `Quitter` ou `Arrêter` directement sur l’écran d’Exécution. L’action `Arrêter la séance` est accessible uniquement depuis la modale de pause.

L’utilisateur ne peut pas revenir à une Activité déjà exécutée.

### Cohérence des libellés

Les mêmes termes sont utilisés dans toute l’application :

- `Séance` : contenu complet d’un entraînement ;
- `Routine` : planification d’une Séance ;
- `Activité` : action élémentaire exécutée en mode Durée, Répétitions ou À l’échec, avec Pause entre Séries et Récupération facultatives ;
- `Exercice` : Activité physique ;
- `Récupération` : phase chronométrée facultative attachée à une Activité, exécutée après tous les côtés d’une Activité autonome ou après chaque passage de côté d’un Tour bilatéral ;
- `Série` : répétition propre à un Exercice ;
- `Tour` : groupe ordonné d’Activités exécuté intégralement un nombre défini de fois ;
- `Cycle` : structure technique unique, fixée à une répétition et jamais affichée dans le MVP ; elle ordonne les Activités placées avant le Tour, le Tour et les Activités placées après le Tour ;
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
- `Notifications` et rappels.

Les préférences de Compte à rebours initial et de Fin de séance servent de valeurs proposées lors de la création d’une nouvelle Séance. Elles restent modifiables au niveau de chaque Séance.

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

L’état de résultats de la recherche globale est illustré par :

![[images/ecran-2a-recherche-globale-resultats.png|260]]

*Écran 2a — Recherche globale — Résultats affichés — Figma `1992:10320`*

### États Figma de référence

| N° | État | Capture | Règle matérialisée | Node Figma |
| --- | --- | --- | --- | --- |
| Écran 2b | Séance déployée | ![[images/ecran-2b-catalogue-seance-deployee.png\|220]] | Consultation de la Composition sans quitter le Catalogue | `1992:10014` |
| Écran 2c | Champ de recherche déployé | ![[images/ecran-2c-recherche-globale-champ.png\|220]] | État de saisie précédant les résultats globaux ; la rangée `Créer / Filtrer / Trier` reste visible dans le Catalogue d’arrière-plan (`1992:10129`) | `1992:10129` |
| Écran 2d | Carte condensée avec actions | ![[images/ecran-2d-catalogue-condense-actions.png\|220]] | La carte se déplace avec le glissement et révèle `Planifier`, `Dupliquer` et `Archiver` derrière | `1992:10518` |
| Écran 2e | Carte déployée avec actions | ![[images/ecran-2e-catalogue-deployee-actions.png\|220]] | Même convention de glissement avec déplacement réel de la carte | `1992:10628` |
| Écran 2f | Liste des Séances archivées | ![[images/ecran-2f-catalogue-archivees.png\|220]] | Contexte dans lequel restauration et suppression deviennent disponibles | `1992:10749` |
| Écran 2g | Séance restaurée | ![[images/ecran-2g-catalogue-seance-restauree.png\|220]] | Snackbar de restauration et action `Annuler` | `1992:10848` |
| Écran 2h | Catalogue après archivage | ![[images/ecran-2h-catalogue-apres-archivage.png\|220]] | Résultat attendu après retrait de `Renforcement du genou` de la liste active | `1992:10937` |

### Objectif

Permettre à l’utilisateur de consulter son Catalogue de Séances, d’effectuer une recherche globale, de créer une nouvelle Séance et d’accéder rapidement à la modification, à l’Exécution, à la consultation détaillée ou aux actions de gestion.

Cet écran constitue l’accueil de l’application.

### Recherche et filtres

Le Catalogue présente le sélecteur `Activités / Séances / Circuits`, avec `Séances` sélectionné par défaut, `Activités` actif en T03 et `Circuits` visible mais désactivé. Sous ce sélecteur, la rangée commune `Créer / Filtrer / Trier` utilise trois contrôles visuels de `108 × 32 pt`, séparés de `8 pt` et centrés comme ensemble dans la référence `402 pt`; les cibles tactiles restent ≥ `48 × 48 pt`. `Trier` reste visible mais désactivé en T03. Le contenu détaillé des panneaux/options ouverts `Filtrer` et `Trier` n’est pas encore défini visuellement et ne doit pas être inventé.

La recherche globale possède un état de saisie puis un écran de résultats. Une même Séance peut y apparaître sous les formes `Catalogue`, `Planifiée`, `Exécutée` et `Archivée`, identifiées par leurs badges.

L’écran de résultats n’affiche pas de sous-titre. Dans l’application, Retour ramène à l’écran depuis lequel la recherche a été ouverte ; dans le prototype MVP, il revient au Catalogue condensé.

Les Séances archivées restent exclues de la liste active et ne sont accessibles que par le mécanisme de filtrage prévu. T03 n’invente aucune option de filtre supplémentaire propre aux Séances au-delà de ce qui est explicitement arbitré.

### Carte de Séance — vue condensée

Chaque carte affiche notamment :

- le nom de la Séance ;
- ses Catégories lorsqu’elles existent, suivies de ` : ` puis de l’union dédupliquée des Zones corporelles de tous ses Exercices lorsqu’au moins une zone existe ; si un seul groupe existe, aucun séparateur n’est affiché ;
- le nombre d’Activités ;
- sa durée synthétique des Activités, qui exclut toujours le Compte à rebours initial et la Fin de séance ;
- le nombre de répétitions du Tour (`xN`) ;
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

Le déploiement est facultatif et permet de consulter les Activités de la Séance sans changer d’écran.

La zone principale de la carte conserve la même action que dans la vue condensée : elle ouvre la Séance en mode modification. Le chevron sert uniquement à déployer ou replier la carte et la zone `Démarrer` ouvre l’écran initial d’Exécution.

Aucun bouton `Ouvrir` n’est affiché dans la vue déployée.

Chaque ligne d’Activité présente :

- le nom de l’Activité à gauche ;
- un groupe compact aligné à droite sous la forme `durée/reps · xN`.

`xN` n’est affiché que lorsque le nombre de Séries est supérieur à 1. En mode Répétition, l’abréviation `reps` est utilisée.

Exemples : `12 reps · x3`, `45 s · x2` ou simplement `30 s` lorsque le nombre de Séries vaut 1.

### Création d’une Séance

Toucher l’action de création ouvre un nouvel écran `Composition d’une séance` réunissant le nom, la couleur et la composition.

La création suit ensuite le parcours défini dans la section de navigation générale.

Après `Enregistrer la séance` sur l’écran des Catégories, l’utilisateur revient directement au `Catalogue des séances`, segment `Séances`, avec la transition canonique d’avancement.

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

Lorsque la recherche globale ne retourne aucun résultat, l’écran conserve le bouton Retour, le titre et la requête saisie, puis affiche un message d’absence de correspondance. Aucun résultat fictif, filtre supplémentaire ou sous-titre n’est ajouté.

Ces deux états sont fonctionnellement requis mais ne possèdent pas de frame dédiée dans le `Prototype MVP`. Ils réutilisent le composant d’état vide et la structure de leurs écrans parents ; aucune capture non issue de Figma n’est créée.

## Écran 3 – Composition d’une séance

![[images/ecran-3-composition-seance.png|260]]

*Écran 3 — Composition d’une séance — Figma `2028:11700`*

L’état révélant les actions d’une Activité est illustré par :

![[images/ecran-3a-composition-actions-glissees.png|260]]

*Écran 3a — Composition — Actions glissées — Figma `2028:11808`*

### États Figma de référence

| N° | État | Capture | Règle matérialisée | Node Figma |
| --- | --- | --- | --- | --- |
| Écran 3b | Composition initiale | ![[images/ecran-3b-composition-etat-initial.png\|220]] | Nom vide, Tour initial avec synthèse intégrée et action principale désactivée | `2028:11137` |
| Écran 3c | Nom renseigné | ![[images/ecran-3c-composition-nom-renseigne.png\|220]] | Le nom seul ne suffit pas à activer `Continuer` | `2028:12003` |
| Écran 3d | Palette de couleurs ouverte | ![[images/ecran-3d-composition-couleur-ouverte.png\|220]] | Sélection intégrée, sans navigation vers un écran séparé | `2028:11921` |
| Écran 3e | Compte à rebours ouvert | ![[images/ecran-3e-composition-compte-rebours-ouvert.png\|220]] | Réglage minutes/secondes avec Annuler et Confirmer circulaires | `2028:11375` |
| Écran 3f | Fin de séance ouverte | ![[images/ecran-3f-composition-fin-seance-ouverte.png\|220]] | Réglage indépendant avec Annuler et Confirmer circulaires | `2028:11457` |
| Écran 3g | Nombre de Tours | ![[images/ecran-3g-composition-nombre-tours.png\|220]] | Roulette native compacte à une colonne avec Annuler/Confirmer | `2028:11580` |
| Écran 3h | Appui long — carte soulevée | ![[images/ecran-3h-composition-appui-long.png\|220]] | État transitoire précédant et accompagnant le déplacement d’une Activité | `3518:4576` |

### Objectif

Permettre à l’utilisateur de définir la structure et l’ordre d’Exécution d’une Séance.

L’écran de Composition ne lance pas directement l’Exécution.

### Structure affichée

La Composition est présentée comme une structure hiérarchique ordonnée et non comme un parcours de type niveaux.

Elle comprend dans le MVP :

- un `Compte à rebours initial` ;
- zéro, une ou plusieurs Activités placées avant le Tour ;
- un `Tour` unique, qui peut lui-même contenir des Activités ;
- zéro, une ou plusieurs Activités placées après le Tour ;
- une `Fin de séance`.

Le Compte à rebours initial et la Fin de séance sont des éléments structurels obligatoires et ne constituent pas des Activités. Ils sont non déplaçables : aucun appui long ni aucune poignée de déplacement ne leur est associé.

Le modèle conserve un Cycle technique unique dont le nombre de répétitions vaut toujours 1. Il n’est jamais affiché ni modifiable dans le MVP.

### En-tête

L’écran affiche notamment :

- le champ `Nom de la séance` ;
- un contrôle de couleur compact placé à côté du nom ;
- une palette de 12 couleurs organisée en grille 4 × 3 ;
- le résumé `N activité(s) · durée des Activités`, intégré sous `Nombre de tours` dans le conteneur Tour.

Le champ `Nom de la séance` mesure `354 × 42`. Dans tous les états de Composition, son fond est transparent afin de laisser apparaître la couleur de la séance ; il possède un liseré blanc intérieur de `1` point (`color.sessionNameBorder`). Le texte et le contrôle de couleur conservent leurs styles et positions canoniques.

Une couleur est proposée par défaut. L’ouverture de la palette ne grise pas le reste de l’écran.

### Paramètres du Tour

L’icône affichée à gauche de `Nombre de tours` est exclusivement une instance de `Icon / Tour` (`3066:4685`). Son dessin canonique est celui validé dans `Nouvelle séance — Nom renseigné` (`2028:12003`, source graphique historique `2028:12040`) : cadre visuel `18 × 18`, quatre tracés, trait `1,35`, couleur `color.textPrimary` (`#141414`). Les copies vectorielles locales et l’ancien pictogramme Tour ne sont pas autorisés. L’actif exportable correspondant est uniquement `assets/icons/icon-tour.svg`, clé de registre `icon.tour`.

Le Tour possède un nombre de répétitions compris entre **1 et 99**, avec **1** comme valeur par défaut.

Dans l’interface, le nombre est affiché sans préfixe `x` ni signe `×`, dans un contrôle compact placé à droite du bloc de textes. Le bord droit du contrôle est aligné avec le bord droit des cartes d’Activité. Ce bloc affiche `Nombre de tours`, puis immédiatement dessous la synthèse calculée `N activité(s) · X min`. Cette synthèse compte uniquement les Activités et additionne uniquement leurs durées déterminables ; elle exclut toujours le `Compte à rebours initial` et la `Fin de séance`, éléments structurels hors Tour. La synthèse reprend le format du sous-libellé d’une carte : Inter Regular `11/13`, couleur secondaire et espacement vertical de `4` points sous le titre. Le bloc de textes est centré verticalement avec le sélecteur `66 × 34` ; le carré violet mesure `28 × 28` et conserve `3` points de marge en haut, à droite et en bas. L’icône du sélecteur reprend strictement la couleur de la référence `Nouvelle séance — Nom renseigné` (`2028:12003`, vecteur `2028:12051`, `#CDCEFA`). Aucun chevron de repli pointant vers le haut n’est affiché dans cet en-tête.

La synthèse n’est plus affichée isolément au bas de l’écran. Elle est recalculée uniquement après une modification validée qui affecte les Activités ou le nombre de Tours. La confirmation du `Compte à rebours initial` ou de la `Fin de séance` actualise seulement la carte structurelle concernée et ne modifie jamais cette synthèse. Celle-ci reste attachée au conteneur Tour dans ses états fermé et déployé.

Un appui sur le contrôle de valeur ouvre `Picker / Popover — Source exact`, variante `Type=Numeric wheel` (`3210:49`). Le défilement ne modifie qu’un brouillon ; Annuler ferme sans enregistrer et Confirmer applique la valeur centrée.

### Retour haptique des roulettes

Toute roulette numérique de l’application produit un retour haptique léger et bref à chaque franchissement effectif d’un cran, c’est-à-dire à chaque changement de la valeur sélectionnée. Un seul retour haptique est déclenché par changement de valeur. Ce retour est systématique et indépendant du réglage `Vibration` du Profil, qui ne pilote que les vibrations fonctionnelles de séance.

### Ajout d’une Activité

Un seul bouton secondaire `+ Ajouter une activité` est affiché en haut de l’écran de Composition.

Aucun bouton `＋` intermédiaire n’est affiché dans le Tour ou entre les Activités.

Un appui sur `Ajouter une activité` ouvre l’arbre `Une nouvelle activité / Une activité existante / Annuler`. `Une nouvelle activité` crée une Activité propre à la Séance ; `Une activité existante` ouvre la sélection multiple des références persistantes. La validation est désactivée lorsque la sélection est vide et les Activités validées sont insérées dans l’ordre courant de la liste filtrée, non dans l’ordre des touchers.

La première Activité créée est insérée immédiatement après le Compte à rebours initial et avant le Tour. Les Activités suivantes sont insérées après la dernière Activité ajoutée, dans la même zone. L’utilisateur peut ensuite les déplacer manuellement avant le Tour, dans le Tour ou après le Tour. La réorganisation est déclenchée par un appui long sur l’ensemble de la carte ; la poignée reste un indicateur visuel et ne constitue pas la seule zone de déclenchement.

La poignée de chaque carte d’Activité est exclusivement une instance du composant DSF `Icon / Structure / Movable` (`3066:4676`) : dessin `20 × 20` centré dans un slot `28 × 28`, opacité `50 %`, couleur `color.iconNeutral`. Le dessin local historique `icon/réorganiser` en `16 × 16` et l’application du token `icon.compact` à cette poignée sont interdits.

Le MVP ne propose pas de menu d’ajout rapide `Pause 15 s / 30 s / 45 s`.

Aucune Récupération n’est ajoutée implicitement. Une phase `RECOVERY` est créée uniquement lorsque le paramètre Récupération de l’Activité est supérieur à `0 s`.

Si deux Activités s’enchaînent sans Pause entre Séries ni Récupération, un avertissement discret et non bloquant peut être affiché selon la règle existante.

### Résumé de la ligne d’une Activité (D-095)

La ligne d’une Activité dans la Composition affiche :

- le nom de l’Activité ;
- ses Zones corporelles, sur une ligne dédiée, sans Catégorie et sans couleur ; les valeurs sont séparées par ` · ` ;
- un résumé compact de sa configuration essentielle (nombre de Séries, Durée, Répétitions ou À l’échec, Pause entre Séries).

La Description ne figure jamais dans la ligne. Les Zones corporelles ne sont pas intégrées au résumé de configuration : elles sont affichées séparément entre le nom et ce résumé. Lorsque la Récupération est supérieure à `0 s`, une carte `Récupération X min Y s` de `24` points de haut est attachée immédiatement sous la carte principale ; l’ensemble mesure `354 × 93` et constitue un seul bloc fonctionnel.

Format :

- mode Durée : `N série(s) de X min Y s avec Z min Y s de pause par série` ;
- mode Répétitions : `N série(s) de X répétition(s) avec Z min Y s de pause par série` ;
- mode À l’échec : `N série(s) jusqu’à l’échec, avec Z s de pause entre les séries` ; le nom, déjà affiché séparément sur la ligne, n’est pas répété. La proposition relative à la pause est omise lorsque la pause vaut zéro ou lorsqu’une seule Série ne crée aucun intervalle entre Séries.

La clause de pause est entièrement omise lorsque la Pause vaut `0 s` ou lorsqu’une seule Série ne crée aucun intervalle. La Récupération est affichée dans sa carte attachée et intégrée aux durées calculées, mais elle n’augmente pas le nombre d’Activités. Les segments minutes ou secondes nuls d’une durée sont omis (`45 s`, `1 min`), jamais affichés comme `0 min` ou `0 s`. Le singulier/pluriel de `série`/`répétition` s’accorde à la valeur.

Exemples : `3 séries de 1 min 30 s avec 15 s de pause par série` ; `3 séries de 12 répétitions avec 20 s de pause par série` ; `1 série de 45 s`.

### Consultation et modification d’une Activité

Un appui court sur une carte Activité ouvre directement son parcours de modification. Un appui long sur l’ensemble du bloc Activité–Récupération déclenche sa réorganisation sans ouvrir la modification. Un glissement gauche déplace le bloc avec le geste et révèle progressivement les actions `Dupliquer` et `Supprimer` placées derrière. `Dupliquer` crée une Activité de Séance indépendante avec un nouvel identifiant, reprend tous les paramètres de la source, y compris Pause et Récupération, la nomme `{nom} (copie)` puis `{nom} (copie 2)`, etc., sans collision, et l’insère immédiatement après la source dans la même zone structurelle. Cette action ne crée aucune Activité dans le catalogue. `Supprimer` retire le bloc du brouillon ; la suppression n’est persistée qu’avec l’enregistrement final de la Séance et l’abandon restitue la version persistée.

Dans l’état Figma `Composition d’une séance — actions glissées` (`2028:11808`), la carte/bloc suit le geste. L’action `Dupliquer` reprend son rayon DSF et un espace visuel sépare son bord gauche de la portion encore visible de la carte, laissant apparaître le fond du conteneur Tour. Aucun overlay immobile ne remplace ce mouvement réel.

### Réorganisation

Les Activités peuvent être réorganisées dans leur zone ou déplacées par glisser-déposer avant le Tour, dans le Tour ou après le Tour. Le geste commence par un appui long sur le bloc complet ; l’Activité et sa Récupération attachée passent ensemble dans l’état soulevé, puis suivent le glissement jusqu’à une position de dépose valide. Un toucher court conserve son comportement d’ouverture de l’Activité en modification. Le déplacement conserve l’identifiant et tous les paramètres, met à jour la position structurelle et renumérote continûment les positions de chaque zone. Il ne persiste rien avant l’enregistrement final.

L’état Figma `Composition d'une séance — Appui long — carte soulevée` (`3518:4576`) matérialise ce retour visuel. Avec Récupération, le bloc actif passe de `354 × 93` à `362 × 97`, reste centré dans la section (`x = 6`, contre `x = 10` au repos), utilise le fond bleu très clair `#F7F7FF`, un contenu atténué, un contour `1` point `#D1D1D6`, un rayon `12` et une ombre périphérique `#14171F` à `22 %`, décalage `0 / 0`, flou `10`, étalement `2`. L’ombre et le contour entourent l’Activité et sa Récupération. Les autres cartes et éléments structurels restent inchangés.

La poignée `Icon / Structure / Movable` reste l’indice visuel du caractère déplaçable, mais le geste d’activation porte sur la carte. L’état soulevé est uniquement transitoire : il ne modifie ni l’ordre ni la position structurelle avant la dépose.

Le Tour reste structurel. Le Compte à rebours initial et la Fin de séance sont explicitement non déplaçables, sans appui long ni poignée de déplacement.

### Validation de la Composition

L’écran ne comporte pas de bouton `Démarrer`.

L’action `Continuer` valide la Composition. Elle reste désactivée tant que le nom n’est pas renseigné, qu’aucune couleur n’est sélectionnée ou que la Composition ne contient pas au moins une Activité valide.

En création, elle ouvre l’écran `Catégories de la séance`.

En modification d’une Séance existante, le parcours de validation conserve les catégories existantes et permet, le cas échéant, de les revoir conformément au flux Figma.

La Séance n’est exécutable que si elle contient au moins une Activité valide.

### Enregistrement

Les modifications internes sont conservées au fur et à mesure, sous réserve des validations explicites prévues par les écrans d’édition.

## Écran 4 – Création / modification d’une Activité

![[images/ecran-4-creation-activite-duree.png|260]]

*Écran 4 — Activité — Durée / Pause / Séries — Figma `3542:4656`*

La capture Figma matérialise la structure cible commune. Dans le MVP, la section Médias reste visible et repliable ; son contrôle `Déployer / Condenser` et son placeholder média sont désactivés et aucune fonction d’import, capture, lecture ou stockage n’est active. Le Design System conserve la section et ses composants pour l’activation fonctionnelle du lot Média post-MVP. Le bouton réutilise `Action / Add Media — Source exact` (`3382:60`) et son icône vectorielle DSF `icon/ajouter` (`3382:61`) en `16 × 16` ; aucun caractère typographique `+` n’est utilisé.

### États Figma de référence

La frame principale est `3542:4656`. Les états Description et Zone corporelle sont `3553:4704` et `3553:4768`. Les roulettes canoniques sont `3556:7645`, `3556:7712`, `3556:7801` et `3561:7673`. Les modes Répétitions et À l’échec sont `3561:4695` et `3561:7802`. L’état vide de référence est `3943:6064`. Les états de calcul sont `3580:4733`, `3580:4845` et `3580:4957`.

| N° | État | Capture | Règle matérialisée | Node Figma |
| --- | --- | --- | --- | --- |
| Écran 4a | Mode Répétitions | ![[images/ecran-4a-creation-activite-repetitions.png\|220]] | Remplacement de la durée cible par un nombre de répétitions ; contrôle `Durée totale >=` visible | `3561:4695` |
| Écran 4b | Mode À l’échec | ![[images/ecran-4b-creation-activite-a-l-echec.png\|220]] | Aucun objectif chiffré ; ordre `Séries` → cadre `à l’échec` → `Pause`; contrôle `Durée totale >=` visible | `3561:7802` |
| Écran 4c | Durée ouverte | ![[images/ecran-4c-creation-activite-duree-ouverte.png\|220]] | Roulette compacte minutes/secondes avec validation explicite | `3556:7645` |
| Écran 4d | Pause ouverte | ![[images/ecran-4d-creation-activite-pause-ouverte.png\|220]] | Réglage de la Pause entre Séries avec validation explicite | `3556:7712` |
| Écran 4e | Nombre de Séries ouvert | ![[images/ecran-4e-creation-activite-series-ouvert.png\|220]] | Roulette native compacte à une colonne avec Annuler/Confirmer | `3556:7801` |
| Écran 4f | Répétitions ouvertes | ![[images/ecran-4f-creation-activite-repetitions-ouvert.png\|220]] | Roulette native compacte à une colonne avec Annuler/Confirmer | `3561:7673` |
| Écran 4g | Description déployée | ![[images/ecran-4g-creation-activite-description.png\|220]] | Champ facultatif intégré au même écran | `3553:4704` |
| Écran 4h | Zone corporelle déployée | ![[images/ecran-4h-creation-activite-zone-corporelle.png\|220]] | Référentiel facultatif intégré au même écran | `3553:4768` |
| Écran 4i | Séries pilote | ![[images/ecran-4i-creation-activite-series-pilote.png\|220]] | `Séries` pilote et `Durée totale` calculée | `3580:4733` |
| Écran 4j | Durée totale pilote | ![[images/ecran-4j-creation-activite-duree-totale-pilote.png\|220]] | `Durée totale` pilote et Séries calculées | `3580:4845` |
| Écran 4k | Durée ajustée | ![[images/ecran-4k-creation-activite-duree-ajustee.png\|220]] | Message temporaire après arrondi à un nombre entier de Séries | `3580:4957` |

### Objectif

Permettre à l’utilisateur de créer ou modifier une Activité dans un écran unique. `Récupération` n’est plus un type sélectionnable.

### Ouverture

L’écran est ouvert lorsque l’utilisateur :

- ajoute une Activité depuis la Composition ;
- choisit `Modifier` sur une Activité ;
- crée ou modifie une `ActivityDefinition` persistante depuis le Catalogue des activités.

Le contexte d’ouverture détermine la destination de retour et le type d’objet édité ; il ne doit jamais être déduit de la seule apparence de l’écran.

Dans le parcours courant de Composition, l’interface expose la sélection d’Activités du Catalogue. La capacité existante de créer directement une Activité locale à la Séance reste conservée mais n’est pas exposée dans cet enchaînement d’écrans.

### Contenu et sections

L’en-tête fixe porte un titre fonctionnel : `Ajouter une activité` en création et `Modifier une activité` en modification. Le nom de la Séance n’est pas utilisé comme titre d’écran.

Sous l’en-tête, un bandeau bleu de `402 × 115` points, sans espace avec le séparateur horizontal de l’en-tête, contient uniquement :

- le champ du nom d’Activité, placé à `12` points du haut, de même hauteur et au même alignement que le champ `Nom de la séance` de la Composition ;
- deux accès `Catégorie` et `Zones corporelles`, chacun avec une icône `+` séparée du libellé ; le caractère `+` ne fait pas partie du texte.

`Renforcement du genou` visible dans les états renseignés est une **valeur de démonstration Figma**, jamais un libellé statique ni une valeur codée en dur. Seul l’état vide `3943:6064` utilise `Nom de l’activité` comme placeholder/état vide.

Le reste du formulaire affiche ensuite, dans cet ordre :

- section repliable `Description de l’activité`, fermée par défaut, contenant un champ multiligne facultatif ;
- accès `Catégorie` permettant de sélectionner la Catégorie de l’Activité ;
- accès `Zones corporelles` permettant la multisélection du référentiel facultatif ;
- section repliable `Mode d’exécution`, déployée par défaut ;
- segment `Durée / Répétitions / À l’échec` ;
- cadre `Séries / cible du mode / Pause` ;
- cadre bleu, ligne 2 : `Changement de côté / Récupération / Durée totale` ;
- zone Média conforme au Figma courant ; le cadre de synthèse reste au-dessus en cas de chevauchement. L’affichage média déployé du Catalogue fait partie du MVP ; cette règle ne crée pas à elle seule une fonction d’import/capture supplémentaire dans l’éditeur ;
- synthèse calculée de l’Activité, immuable et ancrée en bas de l’écran ;
- bouton final fixe `Terminer`.

Le nom est obligatoire.

Le contrôle `Durée / Répétitions / À l’échec` partage sa largeur en trois zones égales. Le texte de chaque option reste centré. Les titres des sections utilisent la même typographie que `Mode d’exécution` et le chevron DSF de déploiement. Le contenu central défile indépendamment de la synthèse et du bouton final. Le texte récapitulatif utilise `KODJO / Body` (`14/20`, Regular), occupe la largeur utile complète et conserve sa position fixe ; le contenu défilant maintient au moins `spacing/16` avant la synthèse.

Dans le premier cadre, l’ordre horizontal est invariant : `Séries` à gauche, cible du mode au centre (`Durée`, `Répétitions` ou cadre informatif `à l’échec`), puis `Pause` à droite. Cet ordre reste inchangé lorsqu’une roulette est ouverte. Dans la seconde ligne du même cadre bleu, `Changement de côté` occupe le premier emplacement, puis `Récupération` et `Durée totale`. La géométrie suit le Figma courant et le DSF actif. En mode Durée, le contrôle porte `Durée totale`. En Répétitions et À l’échec, il reste visible et porte le libellé court **`Durée totale >=`**.

La synthèse ne préfixe jamais la phrase par le type d’Activité ni par le mode d’exécution. Le **nom de l’Activité est en gras uniquement dans cette Synthèse**. Elle suit les formes fonctionnelles existantes pour les Séries, cibles, directions, Pauses et Récupération.

Pour une direction propre bilatérale, ajouter après la cible du mode — après `jusqu’à l’échec` — et avant toute Pause : `, à droite, puis à gauche` ou `, à gauche, puis à droite`. Ne rien ajouter en `UNILATERAL` ni pour une direction seulement héritée du Tour.

Lorsque la Récupération est non nulle, ajouter `, puis {récupération} de récupération`. En mode Durée, ajouter sur une seconde ligne `Durée totale : {durée totale}`. En modes Répétitions et À l’échec, afficher **`Durée totale : ≥ {durée connue}`** ; cette formulation de Synthèse reste distincte du libellé court UI `Durée totale >=`.

### Mode d’Exécution

L’utilisateur choisit entre :

- `Durée` ;
- `Répétitions` ;
- `À l’échec`.

En mode `Durée`, la section comporte des roulettes de sélection pour la cible de durée, la Pause, le nombre de Séries, la Récupération et la Durée totale.

En mode `Répétition`, la Durée est remplacée par le Nombre de répétitions. Le Nombre de répétitions, la Pause et le Nombre de Séries sont sélectionnés par roulettes. `Durée totale >=` reste visible comme borne connue.

En mode `À l’échec`, aucun contrôle Durée ou Nombre de répétitions n’est affiché. La rangée conserve trois emplacements : `Séries` à gauche, cadre informatif transparent bordé portant `à l’échec` au centre, puis `Pause` à droite. La seconde rangée conserve `Changement de côté`, `Récupération` et `Durée totale >=`.

Le nombre de Séries est toujours compris entre 1 et 99 (D-092). Pour toute nouvelle Activité, sa valeur par défaut est `1`.

Une Série correspond à l’Exécution de la cible du mode. Pour une Activité bilatérale autonome, le nombre de Séries est un nombre par côté. La Pause est exécutée uniquement entre les Séries d’un même côté ; aucune Pause n’est ajoutée entre les côtés. La Récupération est exécutée une seule fois après les deux côtés.

### Dépendance Séries / Durée totale

Avant toute interaction, tous les contrôles sont utilisables et aucun contour pilote n’est affiché. `Séries` est néanmoins le pilote interne par défaut. Après confirmation d’une roulette, le contrôle modifié devient pilote et reçoit un contour `2` points lié à `color/selection`; le contrôle calculé conserve son contour standard et reste tactile. Ce choix n’est pas persisté : à la réouverture, `Séries` redevient pilote implicite.

La formule d’une occurrence autonome est `D = L × [C × A + P(C,R) × B] + R`, avec `P(C,R) = C` si `R = 0`, sinon `C − 1`, `L = 1` en unilatéral et `L = 2` en bilatéral, `A` durée par Série, `B` Pause, `C` nombre entier de Séries par côté, `R` Récupération et `D` Durée totale globale. Si `D` pilote, `C théorique = D / [L × (A + B)]` lorsque `R = 0`, sinon `C théorique = ((D − R) / L + B) / (A + B)`. `C` est arrondi à l’entier le plus proche, `.5` vers le haut, avec un minimum de `1`; `D` est ensuite recalculée à la valeur atteignable. Le recalcul intervient uniquement après `Confirmer`. Une correction affiche temporairement : `Durée ajustée à {D} pour respecter un nombre entier de Séries.`

La Description et les Zones corporelles sont facultatives. Les Zones proviennent du référentiel prédéfini et ne sont ni créées, ni renommées, ni supprimées ici.

### Modification d’une Activité

Lorsqu’une Activité existante est modifiée, ses valeurs sont préremplies. Le nombre de Séries persistant rétablit la Durée totale calculée.

Les Exécutions déjà historisées ne sont jamais modifiées.

## Écran 5 — Réservé

L’ancien écran autonome `Création / modification d’une Activité — Récupération` est supprimé. Le numéro reste réservé afin de ne pas renuméroter silencieusement les écrans et références historiques. La Récupération se règle dans l’Écran 4 et ne possède aucun écran autonome.

## Écran 6 – Catégories de la séance


![[images/ecran-6-categories-seance.png|260]]

*Écran 6 — Catégories de la séance — Figma `2028:11204`*

L’état de création intégrée d’une nouvelle Catégorie est illustré par :

![[images/ecran-6a-categories-nouvelle-inline.png|260]]

*Écran 6a — Catégories — Nouvelle catégorie inline — Figma `2028:11248`*

### Objectif

Permettre d’associer zéro, une ou plusieurs Catégories à une Séance.

Les Catégories facilitent l’organisation, la recherche et le filtrage. Elles n’ont aucun impact sur l’Exécution.

### Contenu et comportement

- les Catégories sont proposées sous forme de tags sélectionnables ;
- les Catégories prédéfinies suivent leur `displayOrder`, puis les Catégories personnalisées sont affichées par date de création croissante ; leur sélection ne change pas leur position et aucune réorganisation manuelle n’est proposée dans le MVP ;
- la sélection est multiple ;
- aucune Catégorie n’est obligatoire ;
- `+ Créer une catégorie` ouvre une ligne de création intégrée comportant `Nom de la catégorie`, `Annuler` et `Ajouter` ; une nouvelle Catégorie est ajoutée au brouillon et sélectionnée automatiquement ; sa désélection ne la supprime pas, elle reste visible et peut être resélectionnée sans doublon ;
- Retour vers la Composition puis retour aux Catégories conserve séparément les Catégories temporaires existantes et les identifiants sélectionnés ; aucune Catégorie nouvelle n’est persistée avant l’enregistrement final ;
- `Enregistrer la séance` persiste atomiquement la Séance, sa Composition, les nouvelles Catégories sélectionnées et leurs associations, puis ramène directement au `Catalogue des séances`, segment `Séances`, avec la transition canonique faisant entrer la cible depuis la droite et sortir l’écran courant vers la gauche ;
- en cas d’échec, aucune donnée partielle n’est conservée, le brouillon reste intact, l’action est réactivée et le message `La séance n’a pas pu être enregistrée. Réessayez.` est affiché.

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

En vue Jour, toucher une carte ouvre sa planification ; aucune action glissée n’est proposée. En vue Semaine, toucher la zone principale d’une occurrence ouvre la modification de sa Routine dans l’écran de planification prérempli. La carte possède également une zone distincte pour la déployer ou la replier, une zone `Démarrer`, et révèle uniquement `Dupliquer` et `Supprimer` par glissement gauche. `Dupliquer` identifie la Routine source à partir de l’occurrence, crée un brouillon reprenant la même Séance et tous ses paramètres de planification, puis ouvre ce brouillon en modification. Aucune nouvelle Routine n’est persistée avant validation explicite de l’utilisateur.

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

Créer ou modifier une Routine, c’est-à-dire la planification d’une Séance.

### Ouverture

L’écran est accessible :

- depuis `Calendrier > + Planifier une séance` ;
- depuis `Modifier la planification` sur une Routine existante ;
- depuis l’action glissée `Planifier` d’une Séance active dans le Catalogue.

### Paramètres

La planification comporte :

- la Séance associée ;
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

Une Routine ne possède qu’une seule heure d’Exécution. Si l’utilisateur souhaite plusieurs horaires pour une même Séance, il crée plusieurs Routines distinctes.

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

Un seul layout standard est utilisé pour les Activités en Durée, en Répétitions et À l’échec ainsi que pour leur phase de Récupération. Le comportement temporel s’adapte à la phase du Plan d’Exécution sans changer la structure générale de l’écran.

### Entrée dans l’écran et démarrage

L’écran peut être ouvert :

- depuis la zone principale d’une carte du Catalogue ;
- depuis l’action `Démarrer` d’une occurrence planifiée, y compris lorsqu’une occurrence future est exécutée en avance.

L’ouverture de l’écran ne démarre pas immédiatement l’Activité.

Avant le démarrage, l’utilisateur déclenche la Séance depuis la commande centrale.

Avant le démarrage, Retour renvoie dans l’application à l’écran depuis lequel l’Exécution a été lancée. Dans le prototype MVP, toutes les zones du bouton Retour renvoient explicitement au `Catalogue des séances — Séance déployée` (`1992:10014`) ; aucune ne pointe vers l’état vide du Catalogue.

Le Compte à rebours initial est alors exécuté s’il est configuré avec une durée supérieure à zéro, puis la première Activité commence.

### Hiérarchie des informations affichées

L’écran affiche, de haut en bas :

- le nom de la Séance ;
- l’état des sons / annonces vocales ;
- le nom de l’Activité en cours ;
- le compteur de Série lorsque l’Activité est un Exercice ;
- l’indicateur temporel principal ;
- la Série sous l’indicateur principal, à gauche, et le Tour à droite. À partir de `360` points et avec le texte à `100 %` ou `135 %`, les deux valeurs restent sur une même ligne dans deux zones flexibles symétriques, séparées par un repère central de largeur fixe ;
- une progression discrète du Tour ;
- la zone `À suivre` avec le nom et la durée ou le nombre de reps de l’Activité suivante ;
- les commandes `Réinitialiser`, `Pause` et `Activité suivante` ;
- le temps total écoulé et la durée estimée d’exécution de la Séance ; le temps écoulé inclut toutes les phases effectivement exécutées, Compte à rebours initial et Fin de séance compris, mais exclut les Pauses manuelles ; si le plan contient au moins un Exercice en mode Répétitions ou À l’échec, la durée estimée d’exécution est affichée sous forme de borne minimale, par exemple `≥ 18 min` ;
- une barre de progression globale structurée en segments correspondant aux Tours, conformément au prototype Figma. Elle occupe exactement la largeur utile sans débordement. Les segments se répartissent dans cette largeur après déduction des espacements et ne conservent jamais la largeur fixe du gabarit `402`. Le remplissage représente l’avancement dans le Plan d’Exécution complet, Compte à rebours initial et `SESSION_END` compris, selon la pondération définie dans les chapitres 08 et 10 ; il n’est pas le simple rapport `temps écoulé / durée estimée d’exécution`. Il atteint `100 %` uniquement à l’achèvement de `SESSION_END`. Dans T04, les étapes chronométrées sont pondérées par leur durée planifiée ; la part d’une occurrence en Répétitions ou À l’échec est acquise avec `Suivant`. Les Pauses manuelles n’augmentent pas le remplissage.

Le Cycle n’est jamais affiché. Le nombre total d’étapes et la position sous la forme `x sur y` ne sont pas affichés dans le MVP.

Le moteur d’Exécution peut néanmoins conserver ces informations pour son fonctionnement interne.

### Activité définie par une durée

Pour une Activité en mode Durée ou une phase de Récupération, le temps est présenté sous forme de compte à rebours.

Lorsque le compte à rebours atteint zéro, l’Activité se termine normalement et l’Exécution passe à la suite.

Si l’utilisateur appuie sur `Activité suivante` avant zéro, une confirmation est demandée. Après confirmation, l’Activité est enregistrée avec le statut métier `Partielle` et l’Exécution continue.

### Activité définie par un nombre de répétitions

Pour un Exercice défini par un nombre de répétitions, l’écran conserve le même layout que pour un Exercice chronométré.

Le temps actif est affiché par un chronomètre croissant à partir de `00:00`. Il n’existe pas de durée cible.

Le cercle du minuteur effectue une rotation complète par minute :

- une rotation complète représente 60 secondes ;
- à `01:00`, il recommence une nouvelle rotation ;
- le chronomètre continue à croître (`01:01`, `01:02`, etc.).

Un bip est émis à chaque minute écoulée. Dans le MVP, ce bip est fixe et non paramétrable.

`Pause` suspend le chronomètre et la rotation du cercle. `Reprendre` les relance depuis l’état exact où ils ont été suspendus.

L’utilisateur termine normalement chaque Série avec `Suivant`. Cette action ne crée pas une Activité Partielle : elle valide la fin normale de la Série en mode Répétitions ou À l’échec.

### Séries

Lorsqu’une Activité possède plusieurs Séries :

- `Série x/y` indique la Série en cours ;
- chaque Série exécute la durée cible, les répétitions cibles ou se poursuit jusqu’à l’échec selon le mode ;
- pour `C` Séries, la Pause est appliquée `C` fois si `R = 0`, y compris après la dernière Série, ou `C − 1` fois si `R > 0` ;
- après la dernière Série, la Récupération non nulle est exécutée une fois.

T04 développe toutes les Séries, les répétitions de Tour et les passages de côté dans le Plan d’Exécution avant le démarrage.

### Récupération

Une Récupération non nulle crée une phase `RECOVERY` chronométrée après tous les côtés d’une Activité autonome, ou après chaque passage de côté lorsque l’Activité appartient à un Tour bilatéral. Elle utilise le même écran standard, annonce `Récupération`, joue les sons standards de fin et se termine automatiquement à zéro. Elle s’applique également après la dernière Activité, avant `SESSION_END`.

La zone `À suivre` permet de préparer l’Activité suivante ou la Fin de séance. `Activité suivante` avant zéro demande confirmation ; l’Exercice reste `Terminé`, tandis que `recoveryElapsedSeconds` conserve le temps partiel de Récupération.

### Commandes principales

Les trois emplacements de commande restent identiques. Pendant une Activité, ils affichent :

- `Réinitialiser l’activité` ;
- `Pause` ;
- `Activité suivante`.

Pendant la Récupération, la première commande devient `Réinitialiser la récupération`.

Leur position et leur rôle visuel ne changent pas entre Durée et Répétition.

### Réinitialiser l’Activité

L’action ouvre la modale de confirmation.

Après confirmation :

- la Série / Activité courante recommence depuis son état initial ;
- pour une Activité chronométrée, le compte à rebours retrouve sa durée initiale ;
- pour une Activité en Répétitions ou À l’échec, le chronomètre d’Activité revient à `00:00` ;
- la cible de répétitions n’est pas modifiée ;
- le temps total déjà écoulé dans la Séance reste conservé ;
- le Tour et le Cycle courants restent inchangés.

Pendant `RECOVERY`, la confirmation réinitialise uniquement le compte à rebours de Récupération. Elle ne rejoue pas l’Activité terminée et ne modifie pas les résultats antérieurs.

### Mise en pause

Toucher `Pause` suspend immédiatement l’Exécution et ouvre la modale `Séance en pause`.

La pause suspend :

- le compte à rebours ou le chronomètre d’Activité ;
- l’enchaînement automatique ;
- le temps actif ;
- les bips et annonces liés à la progression ;
- les animations de progression.

La modale propose :

- `Reprendre la séance` ;
- `Arrêter la séance`.

`Reprendre la séance` restaure l’état exact de l’Activité.

`Arrêter la séance` termine l’Exécution avec le statut `Interrompue`. Dans T04, il ouvre l’écran de fin minimale ; l’ouverture de la Synthèse appartient à la tranche qui livre cette dernière.

Il n’existe pas de commande directe d’arrêt depuis l’écran principal d’Exécution.

### Activité suivante

Le comportement dépend de la phase courante :

- **Exercice en Répétitions ou À l’échec** : termine normalement la Série courante et passe à la pause, à la Série suivante ou à l’Activité suivante selon le plan ;
- **Activité chronométrée avant zéro** : ouvre la modale de confirmation ; après confirmation, l’Activité est enregistrée avec le statut `Partielle`, puis l’Exécution continue ;
- **Récupération avant zéro** : ouvre la même confirmation ; après confirmation, l’Activité reste `Terminée`, la Récupération est partielle et l’Exécution continue ;
- **Activité chronométrée arrivée à zéro** : la transition est automatique.

### Navigation pendant l’Exécution

L’ordre d’Exécution est déterminé par le Plan d’Exécution.

L’utilisateur ne peut pas sélectionner librement une autre Activité ni revenir à une Activité déjà terminée.

### Guidage sonore

Dans T04, Sons et Annonces vocales sont activés par défaut au début de chaque Exécution. Leur état peut être changé pendant l’Exécution, mais cette tranche ne lit ni n’enregistre encore de préférence utilisateur correspondante ; leur configuration depuis le Profil appartient à une tranche ultérieure.

Au début d’une Activité, son nom peut être annoncé vocalement lorsque les Annonces vocales sont actives. Au début d’une phase `RECOVERY`, l’annonce est `Récupération`.

Pour les Activités chronométrées, les signaux sonores de fin de compte à rebours sont appliqués conformément aux règles métier définies pour le MVP.

Pour un Exercice en Répétitions ou À l’échec, aucun signal de fin de compte à rebours n’est utilisé puisqu’il n’existe pas de temps cible. Un bip fixe est toutefois émis à chaque minute écoulée dans le MVP.

### Arrière-plan et verrouillage

Si l’application passe en arrière-plan ou si l’écran se verrouille :

- le Plan d’Exécution continue selon ses horodatages de référence ;
- l’Activité chronométrée ne se fige pas ;
- au retour, l’application reconstitue l’Activité et la position temporelle qui auraient dû être atteintes, plutôt que de reprendre le compteur à l’endroit où l’interface a été suspendue ;
- les sons et annonces sont maintenus dans la mesure permise par iOS et Android.

Une mise en pause de sécurité est appliquée en cas d’inactivité prolongée :

- pour une Activité chronométrée, si aucune interaction n’a eu lieu 30 minutes après sa fin théorique ;
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

### Objectif

Présenter un bilan immédiatement compréhensible et recueillir le ressenti obligatoire avant de quitter l’écran.

### Contenu

L’écran affiche notamment :

- le nom de la Séance ;
- le statut de l’Exécution ;
- la durée réellement exécutée ;
- le nombre d’Activités réalisées ;
- le nombre d’Activités partielles, uniquement s’il est supérieur à zéro ;
- le choix du ressenti ;
- un champ `Commentaire` facultatif ;
- le bouton `Terminer`.

Les Tours et Cycles ne sont pas affichés dans la Synthèse du MVP.

Aucun parcours détaillé des Activités n’est affiché sur cet écran dans le MVP.

### Statut

Une Exécution terminant normalement son Plan peut être `Terminée` ou `Partielle` selon les Activités réellement réalisées.

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

Présenter à terme des indicateurs synthétiques de progression et d’activité.

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

Le filtrage par Catégories, Zones corporelles, période ou statut est reporté à une version ultérieure. La commande `Filtrer` reste visible mais désactivée.

### Tri

La fonction de tri est reportée à une version ultérieure. La commande `Trier` reste visible mais désactivée. L’ordre d’affichage initial reste chronologique, du plus récent au plus ancien.

### État vide

Si aucune Exécution ne correspond à la recherche, l’écran affiche un message indiquant qu’aucun résultat ne correspond.

Si aucune Exécution n’existe encore, l’écran affiche : `Vous verrez ici vos séances exécutées dès que vous aurez terminé votre première séance.`

## Écrans 12 à 18 — Catalogue des Activités et Exécution directe — MVP T03

### Écran 12 — Catalogue des Activités — Liste

La frame `3786:5093` utilise le même Screen Shell et le même contrôle de type que le Catalogue des Séances, avec `Activités` sélectionné. La liste contient les Activités persistantes et conserve recherche, filtres, tri implicite et position de défilement dans l’état de navigation du parcours courant.

La rangée `Créer / Filtrer / Trier` est identique au Catalogue des Séances : trois contrôles `108 × 32 pt`, gap `8 pt`, ensemble centré en référence `402 pt`, cibles tactiles ≥ `48 × 48 pt`. `Filtrer` est actif au minimum pour `Archivées`; `Trier` est visible disabled. Les panneaux/options ouverts ne sont pas encore définis visuellement et restent `NON VÉRIFIABLE` / `À CLARIFIER`.

Chaque carte présente une barre verticale bleue. Sa surface principale ouvre la consultation ou la modification ; le bouton Lecture, dans une cible séparée, lance uniquement l’Exécution directe. Le contrôle `Déployer` reste **visible mais fonctionnellement désactivé** en T03 et réutilise le composant canonique `2537:1033 — State=Collapsed`, avec une zone droite réservée identique sur toutes les cartes. Aucune poignée de déplacement n’est affichée.

![[images/ecran-12-catalogue-activites-liste.png|260]]

*Écran 12 — Catalogue des Activités — Liste — Figma `3786:5093`*

L’ancienne référence Figma `3787:5209 — Catalogue — action contextuelle directe` n’existe plus dans l’état courant et n’est plus une preuve active. Aucun état de remplacement n’est inventé.

### Écran 13 — Supprimé — ancien arbre `Créer` des Catalogues

L’écran/arbre intermédiaire `Une nouvelle activité / Une séance / Un circuit / Annuler` est supprimé par D-187.

Dans chaque Catalogue, `Créer` ouvre directement la création de l’objet correspondant au Catalogue courant :
- `Catalogue des Activités` → création d’une Activité persistante ;
- `Catalogue des Séances` → création d’une Séance ;
- `Catalogue des Circuits` → création d’un Circuit lorsque ce Catalogue devient fonctionnel.

Cette règle n’active pas les Circuits dans T03/MVP. Les anciennes frames Figma `3787:5148` et `3841:8375`, ainsi que leurs captures physiques, sont conservées uniquement pour traçabilité et ne constituent plus des états fonctionnels à implémenter.

### Écran 14 — Composition — Sélectionner plusieurs Activités existantes
### Écran 14 — Composition — Sélectionner plusieurs Activités existantes

Depuis `Ajouter une activité`, le choix `Une activité existante` ouvre la frame `3789:5349` au-dessus de la Composition grisée. La liste seule défile. Les boutons fixes sont `Annuler` à gauche et `Ajouter N activité(s)` à droite.

Les Activités sont insérées selon leur ordre courant de présentation dans la liste filtrée au moment de la validation, indépendamment de l’ordre des touchers. La Recherche utilise `Icon / Search`; l’état sélectionné utilise `Icon / Selection Check`. Aucun glyphe texte ne peut les remplacer.

![[images/ecran-14-selection-activites-existantes.png|260]]

*Écran 14 — Composition — Sélectionner plusieurs Activités existantes — Figma `3789:5349`*

### Écran 15 — Création ou modification d’une Activité persistante

L’écran réutilise l’Écran 4 et ses composants. Ouvert depuis le Catalogue, il crée ou modifie une Activité de référence persistante ; ouvert depuis une Composition, il agit uniquement sur la copie de Séance. Le contexte d’ouverture détermine la destination de retour et interdit toute propagation implicite entre référence et copie.

Les deux contextes disposent d’une frame de référence distincte : `3879:5947` pour la création et `3879:6079` pour la modification. Seul le titre d’en-tête et le contenu de démonstration les distinguent ; la structure reste celle de l’Écran 4.

![[images/ecran-15-creation-activite-persistante.png|260]]

*Écran 15 — Créer une Activité persistante — Figma `3879:5947`*

![[images/ecran-15a-modification-activite-persistante.png|260]]

*Écran 15a — Modifier une Activité persistante — Figma `3879:6079`*

### Écran 16 — Préparation d’une Activité directe

La frame de référence affiche une préparation système fixe de `5 s`. Cette durée n’est pas un attribut de l’Activité. Aucun compteur de Tour ou de Cycle n’est affiché.

![[images/ecran-16-preparation-directe-5-s.png|260]]

*Écran 16 — Exécution directe — Préparation fixe de 5 s — Figma `3835:5385`*

### Écran 17 — Exécution directe en cours

L’écran réutilise le moteur et le Shell d’Exécution. Il développe Séries, Pauses, côtés et Récupération, sans structure de Séance artificielle ni phase `SESSION_END`. Après la dernière phase, un signal ouvre immédiatement la Synthèse.

![[images/ecran-17-execution-directe-en-cours.png|260]]

*Écran 17 — Exécution directe — En cours — Figma `3835:5465`*

### Écran 18 — Synthèse d’une Activité directe

Le Ressenti est obligatoire pour activer `Terminer`; le Commentaire reste facultatif. La finalisation enregistre l’origine `ACTIVITY`, alimente les statistiques compatibles sans compter une Séance et restaure le Catalogue des Activités dans son état précédent.

![[images/ecran-18-synthese-directe-ressenti-requis.png|260]]

*Écran 18 — Synthèse d’une Activité directe — Ressenti requis — Figma `3836:5437`*

![[images/ecran-18a-synthese-directe-ressenti-selectionne.png|260]]

*Écran 18a — Synthèse d’une Activité directe — Ressenti sélectionné — Figma `3836:5503`*

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

### Modale 2 – Abandonner les modifications d’une Activité (D-094)

![[images/modale-2-abandon-modifications-activite.png|260]]

*Modale 2 — Abandonner les modifications d’une Activité — source Figma **À CLARIFIER** (node historique `3224:4082` absent du Figma courant)*

#### Objectif

Éviter la perte accidentelle des modifications apportées à une Activité dans l’écran unique `Création / modification d’une Activité`.

#### Ouverture

La modale s’affiche depuis l’écran Activité lorsque l’utilisateur tente de quitter (Retour, geste de glissement, bouton matériel Android) alors que des modifications non enregistrées existent sur l’Activité en cours d’édition — comparées à son état au moment de l’ouverture de l’écran, jamais au reste de la Composition.

L’écran Activité reste visible en arrière-plan, assombri et non interactif.

#### Contenu

**Titre**

> Abandonner les modifications ?

**Message**

> Les modifications apportées à cette activité seront perdues.

**Actions**

- `Annuler`, action neutre grise
- `Confirmer`, action destructive rouge

#### Comportement

`Annuler` ferme la modale et conserve intégralement les modifications en cours sur l’Activité.

`Confirmer` annule uniquement les modifications locales de l’Activité, puis revient à `Composition d’une séance` — le reste de la Composition (nom, couleur, Compte à rebours initial, Fin de séance, autre Exercice déjà enregistré) n’est jamais affecté. Le geste Retour système est traité comme `Annuler` et toucher le voile ne confirme jamais l’abandon.

La référence de production est la frame Figma `3224:4082`, `Modal — Abandonner les modifications d’une activité`. Elle instancie `Overlay / Decision Dialog`, variante `PrimaryTone=Danger, SecondaryTone=Neutral, Actions=2` (`2590:2934`) : dialogue centré de `354 × 186`, rayon `18`, boutons `147 × 48`, écart horizontal `12` et espacement `16` entre la dernière ligne du message et les actions. Les libellés sont centrés horizontalement et verticalement dans leurs boutons.

### Modale 3 – Confirmer la suppression d’une Séance archivée

![[images/modale-3-seance-archivee-action-supprimer.png|260]]

*Modale 3 — Séance archivée — Action Supprimer révélée — Figma `2234:88`*

L’action `Supprimer` est révélée par glissement gauche : la carte se déplace avec le geste et révèle l’action placée derrière.

![[images/modale-3a-confirmer-suppression-seance-archivee.png|260]]

*Modale 3a — Confirmer la suppression d’une séance archivée — Figma `2234:189`*

Le dialogue flottant centré demande une confirmation explicite. `Annuler` ferme le dialogue et revient au résultat du filtre `Archivées`.

Le bouton destructif porte le libellé `Confirmer`. Dans l’application, sa confirmation supprime la Séance archivée tout en conservant les Exécutions historiques.

### Modale 4 – Suppression d’une planification

![[images/modale-4-suppression-planification-unique.png|260]]

*Modale 4 — Supprimer une planification unique — Figma `1992:5365`*

Pour une planification unique, `Supprimer` ouvre un dialogue centré comportant `Annuler` et `Confirmer`. Après confirmation, la planification est supprimée, la Séance associée et les Exécutions historiques sont conservées.

![[images/modale-4a-suppression-occurrences.png|260]]

*Modale 4a — Supprimer des occurrences — Figma `1992:6102`*

Pour une planification périodique, le dialogue à trois choix présente sur sa première ligne les deux actions destructives `Seulement cette occurrence` et `Toutes les occurrences à venir`, puis `Annuler` en pleine largeur sur une seconde ligne. Les deux choix peuvent mener au même écran de résultat dans le prototype ; la vue Semaine montre ensuite l’occurrence retirée. Les Exécutions historiques restent conservées.

### Modale 5 – Réinitialisation de l’Activité

![[images/modale-5-reinitialiser-activite.png|260]]

*Modale 5 — Réinitialiser l’activité — Figma `1992:8224`*

Référence Figma : `1992:8224`, `Modal — Réinitialiser l’activité`. Le dialogue flottant centré utilise `Overlay / Decision Dialog`, variante `PrimaryTone=Primary,SecondaryTone=Neutral,Actions=2` (`2590:2926`), instance `2591:3047`. Il mesure `354 × 215`.

#### Objectif

Permettre de recommencer l’Activité / Série en cours depuis son état initial sans revenir en arrière dans la Séance.

#### Ouverture

La modale s’affiche après appui sur `Réinitialiser l’activité`.

L’Exécution est suspendue pendant l’affichage de la modale.

#### Contenu

**Titre**

> Réinitialiser l’activité ?

**Message**

> L’activité en cours recommencera depuis le début. La progression de la séance sera conservée.

**Actions**

- `Annuler`, action neutre grise ;
- `Confirmer`, action primaire bleue.

#### Comportement

Après confirmation :

- l’Activité / Série courante reste l’Activité courante ;
- une Activité chronométrée retrouve sa durée initiale ;
- un Exercice en Répétitions ou À l’échec retrouve un chronomètre d’Activité à `00:00` ;
- la cible de répétitions reste inchangée ;
- le temps global déjà écoulé dans la Séance est conservé ;
- le Tour et le Cycle restent inchangés ;
- l’Activité redémarre selon son comportement normal.

`Annuler` ferme la modale et reprend l’Activité à son état précédent.

Les deux boutons `147 × 48` sont alignés sur une ligne avec un écart de `12`. Les libellés sont centrés horizontalement et verticalement. La dernière ligne du message et les actions sont séparées par `spacing/16`.

### Modale 6 – Passage à l’Activité suivante

![[images/modale-6-activite-suivante.png|260]]

*Modale 6 — Passer à l’activité suivante — Figma `1992:8326`*

Référence Figma : `1992:8326`, `Modal — Passer à l’activité suivante`. Le dialogue flottant centré utilise `Overlay / Decision Dialog`, variante `PrimaryTone=Primary,SecondaryTone=Neutral,Actions=2` (`2590:2926`), instance `2591:3058`. Il mesure `354 × 215`.

#### Objectif

Confirmer l’interruption anticipée d’une Activité chronométrée.

#### Ouverture

Cette modale s’affiche lorsque l’utilisateur appuie sur `Activité suivante` avant la fin d’une Activité chronométrée.

Elle ne s’affiche pas pour un Exercice en mode Répétitions ou À l’échec : dans ce cas, `Suivant` constitue la validation normale de la Série courante.

#### Contenu

**Titre**

> Passer à l’activité suivante ?

**Message**

> La séance continuera avec l’activité suivante, elle sera enregistrée comme partiellement exécutée.

**Actions**

- `Annuler`, action neutre grise ;
- `Confirmer`, action primaire bleue.

#### Comportement

Après confirmation :

- l’Activité chronométrée est arrêtée avant son terme ;
- sa durée réellement exécutée est conservée ;
- son statut métier devient `Partielle` ;
- la progression est mise à jour ;
- l’Activité suivante démarre selon les règles normales du Plan d’Exécution.

`Annuler` ferme la modale et reprend l’Activité en cours.

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

> L’activité « Squats assistés » est suspendue.  
> Le chronomètre reprendra là où il s’est arrêté.

Le nom d’Activité est dynamique ; `Squats assistés` est uniquement la donnée d’illustration de la frame.

**Actions**

- `Reprendre la séance`, action primaire bleue
- `Arrêter la séance`, action destructive rouge

Les deux boutons `147 × 48` sont alignés sur une ligne avec un écart de `12`. Les libellés sont centrés horizontalement et verticalement. La dernière ligne du message et les actions sont séparées par `spacing/16`.

#### Reprendre la séance

Ferme la modale et reprend l’Activité à l’état exact où elle a été suspendue.

Pour une Activité chronométrée, le compte à rebours reprend.  
Pour un Exercice en Répétitions ou À l’échec, le chronomètre croissant reprend.

#### Arrêter la séance

Met fin à l’Exécution :

- la progression réellement effectuée est enregistrée ;
- le statut de l’Exécution devient `Interrompue` ;
- l’écran `Synthèse de séance` est affiché.

La modale ne peut être fermée que par l’une des deux actions prévues.

### Contrôles intégrés – Compte à rebours initial et Fin de séance

Ces réglages ne sont plus des modales dans le MVP.

Dans la Composition, toucher la ligne `Compte à rebours initial` ou `Fin de séance` ouvre une roulette minutes/secondes intégrée. Ces deux valeurs possèdent des brouillons et des valeurs confirmées indépendants. Dans le Profil, toucher la préférence correspondante ouvre la roulette numérique compacte native à une colonne, avec les valeurs en secondes et les actions Annuler/Confirmer. Le choix ne modifie la préférence qu’après confirmation.

Les valeurs initiales de l’application sont `10 s` pour le Compte à rebours initial et `5 s` pour la Fin de séance. Une durée de `0 s`, lorsqu’elle est choisie par l’utilisateur, rend la phase instantanée sans supprimer l’élément structurel.

## Couverture du Prototype MVP et exclusions justifiées

### Périmètre intégré

La page Figma `Prototype MVP` (`510:101`) constitue la source visuelle des frames de production. Une capture ne remplace pas la règle écrite : le présent chapitre définit les comportements, tandis que les captures et le chapitre 13 définissent les références visuelles et critères déterministes.

### Éléments non intégrés comme écrans distincts

Les calques internes, zones tactiles transparentes, cibles de défilement et duplications de liens de prototypage ne constituent pas des écrans distincts. Les états fonctionnels sans frame dédiée réutilisent les composants de leurs écrans parents ; aucune fausse capture Figma ne doit être inventée.

### Règle de maintenance

Lorsqu’une nouvelle frame de premier niveau est ajoutée au `Prototype MVP`, elle doit être soit intégrée dans ce chapitre avec sa règle fonctionnelle, soit explicitement classée hors périmètre avec justification. Une variante ne peut plus être omise silencieusement.

## Règles transverses de l’éditeur d’Activité

Les écrans Activité placent le champ Nom en premier dans la zone bleue et suppriment le contexte de Séance. Aucun type d’Activité n’est affiché. Le segment Mode contient trois options égales : `Durée`, `Répétitions`, `À l’échec`. Dans le MVP, la section Médias est visible et repliable conformément aux frames courantes ; son contrôle `Déployer / Condenser` et son placeholder média restent désactivés, sans fonction média réelle. Le bouton utilise le composant `3382:60` et son icône vectorielle `3382:61`, sans caractère `+`. Les composants Média du DSF constituent la référence d’activation fonctionnelle post-MVP.

La frame `3561:7802` documente l’état À l’échec : ordre `Séries` → cadre informatif `à l’échec` → `Pause`, seconde rangée `Côté / Récupération / Durée totale >=`, sans cible chiffrée. La frame `3561:4695` et la roulette `3561:7673` appliquent la même visibilité `Durée totale >=` en Répétitions. Dans les états renseignés, `Renforcement du genou` est une donnée de démonstration ; seul `3943:6064` conserve `Nom de l’activité` comme placeholder de l’état vide.

## Mise à jour Bilatéralité — rectifiée le 13 septembre 2026

Le contrôle Activité porte le libellé singulier `Côté` et cycle `UNILATERAL → RIGHT_LEFT → LEFT_RIGHT → UNILATERAL`. Il est déjà placé dans le cadre bleu `354 × 156 pt`, ligne 2 colonne 1, directement sous `Séries`. Il mesure `74 × 42 pt`. La grille utilise deux lignes séparées de `10 pt`, trois colonnes de `74 / 124 / 124 pt` et deux gouttières de `8 pt`. Les états affichent : rien pour `UNILATERAL`, `D→G`, `G→D`. Sous un Tour bilatéral, le contrôle reste visible, propre `UNILATERAL` et désactivé.

Dans la Composition `2028:11700`, le contrôle du Tour est enfant de l’en-tête `2028:11743` (`354 × 34 pt`). Le cadre numérique `2028:11752` est à `x=237`, `y=0`, en `66 × 34 pt`; la direction est immédiatement à droite à `x=311`, `y=0`, en `42 × 34 pt`, avec `8 pt` d’espace. Les bords haut/bas et centres verticaux coïncident. Aucun titre visible `Côté` ou `Côtés`. `UNILATERAL` est vide ; les états bilatéraux affichent uniquement `D→G` ou `G→D`. Références : composant `3705:5021`, frames `3722:5061` et `3722:5207`.

Une confirmation n’est affichée au passage vers un Tour bilatéral que si au moins une Activité contenue possède déjà une direction propre bilatérale. Tour vide ou enfants tous propres `UNILATERAL` : application directe. Sinon, `Annuler` ne modifie rien et `Confirmer` applique la direction au Tour puis remet atomiquement les seules Activités concernées à `UNILATERAL`. Aucune propriété « latéralisable » n’est introduite.

Dans une carte `354 × 69 pt`, l’indicateur propre appartient aux informations secondaires à droite : `x=311`, `y=24,5`, `42 × 20 pt`. Il affiche `D→G` ou `G→D` seulement hors Tour bilatéral ; il est absent pour `UNILATERAL` et sous un Tour bilatéral. La synthèse propre place `à droite, puis à gauche` ou `à gauche, puis à droite` après la cible du mode — après `jusqu’à l’échec` — et avant la Pause. Elle omet cette clause pour une direction héritée. Références : `3706:5020`, `2028:11700`, `3679:4880`, `3724:5428`.

Dans l’Écran 9, une Activité effectivement bilatérale affiche `Côté droit` ou `Côté gauche` sous son nom. Les indicateurs de progression gardent leur sémantique ; aucun compteur de côté n’est ajouté. Les frames d’Exécution existantes restent inchangées.

## Évidences Figma T03 — état courant du 16 septembre 2026

Les contrôles d’entrée `Créer / Filtrer / Trier` restent conçus et vérifiables dans Figma pour leur rendu. Les références courantes principales sont `3786:5093` (Catalogue Activités), `1992:9910` (Catalogue Séances), `1992:10129` (Recherche globale — Champ déployé), `3561:4695`, `3561:7673`, `3561:7802`, `3943:6064` (éditeur Activité), `2537:1033` (Déployer) et `2537:214` (Navigation Bottom). Les anciennes frames d’arbre `3787:5148` et `3841:8375` sont supersédées fonctionnellement par D-187.

L’ancienne référence `3787:5209 — Catalogue — action contextuelle directe` n’existe plus dans le Figma courant et ne constitue plus une évidence active. Seul le détail visuel des panneaux/options **ouverts** `Filtrer` et `Trier` reste `NON VÉRIFIABLE` / `À CLARIFIER`; aucune modale, feuille, popover ou liste locale ne doit être inventée avant arbitrage.

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
| Écran 2a | Recherche globale — Résultats affichés | `Catalogue`, `Planifiée`, `Exécutée`, `Archivée` | `1992:10320` |

## Points `À CLARIFIER` relevés lors du contrôle visuel du 16 septembre 2026

Ces points sont consignés sans modification des règles fonctionnelles. Ils sont détaillés dans `images/README-T03-FIGMA.md`.

1. **Modale 2 — Abandonner les modifications d’une Activité.** Le node `3224:4082` cité par ce chapitre n’existe plus dans le Figma courant et aucune frame de remplacement n’a été identifiée. La capture `modale-2-abandon-modifications-activite.png` est conservée telle quelle comme évidence historique ; elle n’est pas déclarée courante.
2. **Section Médias de l’éditeur d’Activité.** Arbitrage résolu pour V2-CAT-01 : les frames courantes `3542:4656`, `3561:4695` et `3561:7802` font foi pour la présence de la section Médias repliable. La section est visible ; son contrôle `Déployer / Condenser` et son placeholder média restent désactivés, sans import, capture, lecture ni stockage. Les anciennes formulations « section Médias masquée » sont supersédées par D-185.
3. **Écran 13 / 13a — ancien arbre `Créer`.** D-187 supprime cet écran intermédiaire : `Créer` est désormais contextuel et ouvre directement la création correspondant au Catalogue courant. Les frames `3787:5148` et `3841:8375` restent des évidences historiques et ne doivent plus être utilisées comme cible fonctionnelle.
4. **Écran 1e — Profil, parcours encore vide.** La frame `2139:86` produit un export strictement identique à celui de la frame `1992:684` (`Vibration activée`). L’état « parcours vide » n’est donc pas visuellement distinguable dans le Figma courant.

