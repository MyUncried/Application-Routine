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

La création d’une Séance, d’une Activité ou d’une Récupération doit pouvoir être réalisée en quelques secondes, avec un minimum de saisies et de touchers.

L’application privilégie :

- des valeurs par défaut immédiatement utilisables ;
- l’affichage initial des seuls paramètres indispensables ;
- l’ajout direct d’un élément à l’endroit choisi dans la Séance ;
- la possibilité de modifier ou d’enrichir ultérieurement chaque élément ;
- un accès secondaire aux consignes et informations complémentaires.

La création rapide constitue le parcours principal. L’ajout d’une consigne, de zones corporelles ou d’informations complémentaires reste facultatif.

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

| Shell | Variante | Zones de référence |
| --- | --- | --- |
| `Shell / Screen` | `Context=On, Bottom=Navigation` | Header `0–92` ; Context `92–207` ; Body `207–797` ; Bottom Navigation `797–874` |
| `Shell / Screen` | `Context=Off, Bottom=Navigation` | Header `0–92` ; Body `92–797` ; Bottom Navigation `797–874` |
| `Shell / Screen` | `Context=On, Bottom=Action` | Header `0–92` ; Context `92–207` ; Body `207–790` ; Bottom Action `790–874` |
| `Shell / Screen` | `Context=Off, Bottom=Action` | Header `0–92` ; Body `92–790` ; Bottom Action `790–874` |
| `Shell / Execution` | `Mode=Run` | Header `0–92` ; Content `92–782` ; Footer `782–874` |
| `Shell / Execution` | `Mode=Summary` | Header `0–92` ; Content `92–874` |

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

### Listes et cartes

- Les listes utilisent toute la largeur utile et défilent verticalement.
- Deux cartes successives d’une liste compacte utilisent un écart de `8` points. Un regroupement chronologique de plusieurs cartes, notamment dans le Suivi, sépare ses groupes de dates de `16` points.
- Les cartes grandissent verticalement lorsque leur contenu passe sur plusieurs lignes ; aucune hauteur de carte contenant du texte variable n’est considérée comme fixe.
- Un groupe d’actions placé à droite d’une carte est ancré au bord droit intérieur de cette carte, avec une marge de `6` points. L’écart entre ses actions reste constant lorsque la carte s’élargit ; les actions ne sont ni distribuées sur la largeur de la carte ni positionnées depuis le bord de l’écran.
- Les actions révélées par glissement se superposent à la carte conformément au Figma ; elles ne provoquent pas une réduction permanente de sa largeur.
- Les états condensé et déployé conservent les mêmes marges horizontales.
- Après ajout, restauration, archivage ou suppression, la position de défilement reste stable lorsque cela ne masque pas le résultat de l’action.

### Formulaires, roulettes et clavier

- Les champs occupent la largeur utile et leurs libellés restent visibles lorsque la valeur est saisie.
- L’ouverture du clavier déplace ou fait défiler le contenu afin que le champ actif et l’action finale restent accessibles.
- Les contrôles disposés côte à côte restent horizontaux tant que chacun conserve sa largeur minimale lisible ; en mode compact, ils peuvent passer sur plusieurs lignes.
- Un cadre de synthèse ou d’aide occupe la largeur utile de son formulaire. Son texte utilise la largeur intérieure après déduction de ses marges internes et augmente la hauteur du cadre si plusieurs lignes sont nécessaires ; il ne peut ni dépasser horizontalement ni être masqué par une hauteur fixe.
- Une roulette ou un pop-up compact est ancré au contrôle déclencheur sans dépasser les Safe Areas. S’il n’existe pas assez d’espace, il est repositionné au-dessus ou transformé en présentation basse défilante.
- La roulette compacte de durée ou d’heure mesure `190` points de haut : barre d’actions supérieure de `40` points et zone de roulette native de `150` points. Sa largeur reste celle du contrôle ou du panneau hôte (`330` points dans les formulaires d’Activité et environ `310` points en Planification).
- La barre d’actions place Annuler à gauche et Valider à droite. Chaque action possède une cible tactile de `48 × 48` points ; sa représentation est un cercle de `28 × 28`, gris neutre avec une croix sombre pour Annuler, bleu primaire avec une coche blanche pour Valider. La barre est placée en haut conformément aux usages iOS : les actions sont identifiées avant le défilement et restent éloignées de l’indicateur d’accueil.
- La roulette conserve une seule zone de sélection visible : le cadre gris natif. Aucun cadre bleu ne se superpose à cette zone. Les unités `min`, `s` ou `h` sont en gras, rapprochées de leur colonne et alignées verticalement sur la valeur centrée.
- Toucher une valeur ou la zone de sélection ne ferme pas la roulette. Le défilement modifie uniquement un brouillon local. Annuler ferme sans enregistrer ; Valider enregistre exactement les valeurs centrées puis ferme. Toute carte ou synthèse liée reste inchangée pendant le défilement et n’est actualisée qu’après validation. Une réouverture restitue la dernière valeur validée.

### Modales et bottom sheets

- Un bottom sheet occupe la largeur disponible et intègre l’inset inférieur.
- Sa hauteur est déterminée par son contenu, dans la limite de `85 %` de la hauteur sûre. Au-delà, son contenu interne défile tandis que le titre et les actions essentielles restent accessibles.
- Une action destructrice et son action d’annulation ne doivent jamais être masquées par l’indicateur d’accueil ou le clavier.
- Le premier bouton d’action est placé `16` points après le message de confirmation. Les actions suivantes conservent l’espacement interne défini par leur groupe.
- Le fond de contexte reste visible selon l’état Figma de référence, mais n’est pas interactif tant que la modale est ouverte.

### Exceptions adaptatives par famille d’écran

| Famille d’écran | Règle adaptative spécifique |
| --- | --- |
| Splash | Logo et textes sont centrés dans la zone sûre ; le logo conserve ses proportions et ne doit jamais être étiré. Aucun défilement n’est prévu. |
| Catalogue, Calendrier, Suivi, Profil | En-tête et navigation basse fixes ; seule la zone centrale défile. Les listes conservent un espace final d’au moins `16` points avant la séparation ou la navigation, en plus de l’inset inférieur applicable. |
| Composition, Activité, Catégories, Planification | En-tête et action finale fixes ; le formulaire central défile. Avec le clavier ouvert, l’action reste atteignable sans recouvrir le champ actif. |
| Activité | Les contrôles `Type d’activité` et `Mode d’exécution` utilisent deux segments strictement égaux. La rangée `Durée / Pause / Séries` s’adapte à la largeur utile et le récapitulatif occupe cette même largeur. |
| Planification | `Aucun` et `Personnalisé` restent fixes aux extrémités du contrôle de rappel. Les raccourcis intermédiaires occupent une zone horizontale défilante et extensible. Le récapitulatif de planification reste contenu dans son cadre avec ses marges internes. |
| Calendrier Semaine | La barre des jours reste lisible sur la largeur compacte ; les sept jours se répartissent la largeur disponible sans défilement horizontal. La liste journalière défile verticalement, utilise `8` points entre ses cartes et s’arrête `16` points avant la séparation de navigation. |
| Calendrier Mois | Les sept colonnes se répartissent la largeur disponible ; une cellule peut grandir verticalement mais ne défile pas horizontalement. |
| Exécution | Les commandes essentielles restent visibles sans défilement à la taille de texte standard. Le libellé du temps écoulé est séparé de la progression par Tours de `24` points. Avec agrandissement accessible, le contenu peut défiler, mais l’Activité courante, le temps et les commandes restent atteignables. |
| Synthèse | Le choix du ressenti reste composé de trois options de largeur égale. Les séparations verticales structurantes utilisent `16` points entre statut et date, `32` points avant la section Ressenti et `24` points avant la section Commentaire. Sur écran compact ou texte agrandi, les libellés explicatifs se placent sous les icônes sans réduire leur cible tactile. |
| Suivi | `Séances` et `Vue d’ensemble` occupent deux segments égaux. Le groupe `Filtrer / Trier` est centré comme un ensemble et précède la liste de `32` points. Les groupes de dates sont séparés de `16` points. Les actions de chaque carte restent ancrées à droite et la liste défile dans une zone arrêtée au moins `16` points avant la navigation basse. |
| Recherche globale | Le champ utilise la largeur disponible entre Retour et les limites sûres ; les résultats défilent indépendamment de l’en-tête. |
| Modales d’Exécution ou de suppression | Les actions passent en pile verticale si elles ne tiennent pas horizontalement ; l’ordre fonctionnel défini par le Figma est conservé. |

Ces règles communes prévalent sur les coordonnées des captures. Une exception non décrite doit être résolue avec les mêmes tokens et principes, puis ajoutée à ce chapitre si elle affecte le comportement utilisateur.

## Navigation principale et articulation des écrans

## Écran de lancement – Splash KODJO

![[images/splash-kodjo.png|260]]

Le splash affiche exactement `KODJO`, `Keep On. Do Just One.` et `Votre assistant du quotidien`. Il reste affiché 2,5 secondes puis ouvre automatiquement le `Catalogue des séances` avec une transition `DISSOLVE` de 0,3 seconde. Le Catalogue présente l’état vide lorsqu’aucune Séance correspondant à la vue `Toutes` n’existe ; sinon, il présente la liste par défaut alimentée par les données locales.

### Navigation principale

La navigation principale donne accès à quatre onglets :

- `Séances` ;
- `Calendrier` ;
- `Suivi` ;
- `Profil`.

Après le splash, le `Catalogue des séances` constitue l’écran d’accueil par défaut. Le splash affiche `KODJO`, `Keep On. Do Just One.` et `Votre assistant du quotidien`, puis ouvre automatiquement le Catalogue après 2,5 s avec une transition de fondu de 0,3 s. L’état affiché est déterminé par les données locales et ne peut pas être imposé par une liste ou un état vide codé en dur.

L’onglet `Calendrier` permet de visualiser les Séances planifiées et d’accéder à la création et à la gestion des Routines.  
L’onglet `Suivi` permet de consulter les Exécutions enregistrées.  
L’onglet `Profil` permet d’accéder aux informations utilisateur et aux Préférences globales de l’application.

La barre de navigation principale comporte quatre destinations. L’onglet actif est matérialisé par une capsule arrondie contenant son pictogramme et son libellé. Les destinations non actives sont représentées par leur pictogramme centré verticalement dans la barre, sans libellé visible.

### Parcours de création d’une Séance

Depuis `Séances`, l’utilisateur peut créer une Séance.

La création suit le parcours suivant :

1. saisie du nom, choix de la couleur et composition de la Séance dans l’écran unique `Composition d’une séance` ;
2. ajout d’au moins un Exercice valide ;
3. action `Continuer` ;
4. sélection facultative d’une ou plusieurs Catégories ;
5. retour au `Catalogue des séances` après validation.

Aucune Routine n’est créée automatiquement.

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

Les commandes `Vue d’ensemble`, `Filtrer` et `Trier` sont visibles mais désactivées dans le MVP. Les fonctions correspondantes restent post-MVP.

### Écrans principaux

Les écrans principaux du MVP sont :

1. `Profil` ;
2. `Catalogue des séances` ;
3. `Composition d’une séance`, incluant le nom et la couleur ;
4. `Création / modification d’une Activité — Exercice` ;
5. `Création / modification d’une Activité — Récupération` ;
6. `Catégories de la séance` ;
7. `Calendrier` ;
8. `Planifier une séance` ;
9. `Exécution de séance`, incluant les états et commandes d’interruption ;
10. `Synthèse de séance` ;
11. `Suivi — Séances`.

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
- `Activité` : action élémentaire, de type Exercice ou Récupération ;
- `Exercice` : Activité physique ;
- `Récupération` : Activité de repos chronométrée ;
- `Série` : répétition propre à un Exercice ;
- `Tour` : groupe ordonné d’Activités exécuté intégralement un nombre défini de fois ;
- `Cycle` : structure technique unique, fixée à une répétition et jamais affichée dans le MVP ; elle ordonne les Activités placées avant le Tour, le Tour et les Activités placées après le Tour ;
- `Exécution de séance` : réalisation effective d’une Séance.

## Écran 1 – Profil

![[images/profil.png|260]]

L’écran de modification du Profil est illustré par :

![[images/modifier-profil.png|260]]

### États Figma de référence

Les états complémentaires suivants font partie de la référence de développement :

| État | Capture | Règle matérialisée |
| --- | --- | --- |
| Vibration activée | ![[images/profil-vibration-activee.png\|220]] | Valeur initiale fonctionnelle de la préférence `Vibration` |
| Sélecteur du compte à rebours | ![[images/profil-compte-rebours-ouvert.png\|220]] | Choix intégré des secondes, avec `10 s` sélectionné |
| Sélecteur de fin de séance | ![[images/profil-fin-seance-ouverte.png\|220]] | Choix intégré des secondes, avec `5 s` sélectionné |
| Profil d’un parcours encore vide | ![[images/profil-parcours-vide.png\|220]] | Présentation du Profil avant que l’utilisateur ait créé du contenu |

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

![[images/catalogue-seances.png|260]]

L’état de résultats de la recherche globale est illustré par :

![[images/recherche-globale-resultats.png|260]]

### États Figma de référence

| État | Capture | Règle matérialisée |
| --- | --- | --- |
| Séance déployée | ![[images/catalogue-seance-deployee.png\|220]] | Consultation de la Composition sans quitter le Catalogue |
| Champ de recherche déployé | ![[images/recherche-globale-champ.png\|220]] | État de saisie précédant les résultats globaux |
| Carte condensée avec actions | ![[images/catalogue-condense-actions.png\|220]] | Superposition de `Planifier`, `Dupliquer` et `Archiver` sans déplacement de la carte |
| Carte déployée avec actions | ![[images/catalogue-deployee-actions.png\|220]] | Même convention de glissement sur une carte déployée |
| Liste des Séances archivées | ![[images/catalogue-archivees.png\|220]] | Contexte dans lequel restauration et suppression deviennent disponibles |
| Séance restaurée | ![[images/catalogue-archivees-seance-restauree.png\|220]] | Snackbar de restauration et action `Annuler` |
| Catalogue après archivage | ![[images/catalogue-apres-archivage.png\|220]] | Résultat attendu après retrait de `Renforcement du genou` de la liste active |

### Objectif

Permettre à l’utilisateur de consulter son Catalogue de Séances, d’effectuer une recherche globale, de créer une nouvelle Séance et d’accéder rapidement à la modification, à l’Exécution, à la consultation détaillée ou aux actions de gestion.

Cet écran constitue l’accueil de l’application.

### Recherche et filtres


Le MVP comporte :

- une action de recherche globale ;
- le sélecteur `Toutes`, `Planifiées` et `Archivées`.

La recherche globale possède un état de saisie puis un écran de résultats. Une même Séance peut y apparaître sous les formes `Catalogue`, `Planifiée`, `Exécutée` et `Archivée`, identifiées par leurs badges.

L’écran de résultats n’affiche pas de sous-titre. Dans l’application, Retour ramène à l’écran depuis lequel la recherche a été ouverte ; dans le prototype MVP, il revient au Catalogue condensé.

Le filtre `Toutes` affiche toutes les Séances actives, qu’elles soient planifiées ou non. Il **n’affiche pas les Séances archivées**. Les Séances archivées ne sont accessibles que via le filtre `Archivées`.

### Carte de Séance — vue condensée

Chaque carte affiche notamment :

- le nom de la Séance ;
- sa Catégorie lorsqu’elle existe ;
- le nombre d’Activités ;
- sa durée estimée ;
- le nombre de répétitions du Tour (`xN`) ;
- la prochaine occurrence planifiée lorsqu’elle existe ;
- un chevron de déploiement ;

Les Séances sont présentées par défaut selon leur dernière utilisation, de la plus récente à la plus ancienne. Pour une Séance jamais exécutée, la date de dernière modification est utilisée.

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

Après `Enregistrer la séance` sur l’écran des Catégories, l’utilisateur revient directement au `Catalogue des séances`.

### Actions secondaires

Sur une Séance active, un glissement gauche révèle `Planifier`, `Dupliquer` et `Archiver`. La carte reste immobile : les boutons d’action apparaissent en superposition sur sa partie droite, conformément au prototype. Ces actions ne sont pas généralisées aux autres contextes.

Depuis `Archivées`, `Restaurer` affiche un snackbar `Séance restaurée` avec l’action `Annuler`.

### Suppression d’une Séance

Une Séance ne peut pas être supprimée depuis `Toutes` ou `Planifiées`. Elle doit d’abord être archivée.

Depuis `Archivées`, un glissement gauche superpose l’action `Supprimer` à la carte, sans déplacer celle-ci. L’action ouvre une modale de confirmation sur le fond de la liste archivée laissant l’option `Supprimer` visible.

La suppression demande toujours une confirmation explicite. Dans le prototype MVP, seul `Annuler` est relié et revient à la liste `Archivées` ; le bouton de confirmation ne possède pas de lien tant qu’un état actualisé de la liste n’est pas représenté.

Si des Routines utilisent la Séance, le message précise qu’elles seront également supprimées.

Après confirmation :

- la Séance est supprimée ;
- toutes les Routines qui la référencent sont supprimées ;
- les occurrences futures cessent d’être calculées ;
- les Exécutions déjà enregistrées restent conservées dans le Suivi grâce à leur Instantané.

### Archivage

L’archivage retire la Séance de la liste principale.

Si la Séance est utilisée par une ou plusieurs Routines, celles-ci sont supprimées après confirmation.

La restauration d’une Séance archivée ne restaure aucune ancienne Routine.

Une Séance archivée est consultable mais ne peut être ni modifiée, ni exécutée, ni planifiée. Elle peut être restaurée ou supprimée selon les interactions propres à la vue `Archivées`.

### Séance vide

Le MVP ne comporte pas de statut `Brouillon`.

Une Séance existe dès validation de son nom et de sa couleur.

Tant qu’elle ne contient aucun Exercice :

- elle peut être modifiée, archivée ou supprimée ;
- elle ne peut pas être exécutée.

### État vide

![[images/catalogue-vide.png|260]]

Si aucune Séance n’a encore été créée, l’écran affiche : `Vous verrez ici la liste de vos séances dès que vous aurez commencé à les créer.` Il présente également l’action permettant de créer la première Séance.

Le filtre `Archivées` possède également un état vide lorsque aucune Séance n’est archivée. Il conserve l’en-tête et les commandes du Catalogue, remplace la liste par un message d’absence de Séance archivée et ne propose pas d’action de suppression ou de restauration.

Lorsque la recherche globale ne retourne aucun résultat, l’écran conserve le bouton Retour, le titre et la requête saisie, puis affiche un message d’absence de correspondance. Aucun résultat fictif, filtre supplémentaire ou sous-titre n’est ajouté.

Ces deux états sont fonctionnellement requis mais ne possèdent pas de frame dédiée dans le `Prototype MVP`. Ils réutilisent le composant d’état vide et la structure de leurs écrans parents ; aucune capture non issue de Figma n’est créée.

## Écran 3 – Composition d’une séance

![[images/composition-seance.png|260]]

L’état révélant les actions d’une Activité est illustré par :

![[images/composition-actions-glissees.png|260]]

### États Figma de référence

| État | Capture | Règle matérialisée |
| --- | --- | --- |
| Composition initiale | ![[images/composition-etat-initial.png\|220]] | Nom vide, Tour initial et action principale désactivée |
| Nom renseigné | ![[images/composition-nom-renseigne.png\|220]] | Le nom seul ne suffit pas à activer `Continuer` |
| Palette de couleurs ouverte | ![[images/composition-couleur-ouverte.png\|220]] | Sélection intégrée, sans navigation vers un écran séparé |
| Compte à rebours ouvert | ![[images/composition-compte-rebours-ouvert.png\|220]] | Réglage minutes/secondes avec Annuler et Valider circulaires |
| Fin de séance ouverte | ![[images/composition-fin-seance-ouverte.png\|220]] | Réglage indépendant avec Annuler et Valider circulaires |
| Nombre de Tours | ![[images/composition-nombre-tours.png\|220]] | Sélection compacte du nombre de répétitions du Tour |
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

Le Compte à rebours initial et la Fin de séance sont des éléments structurels obligatoires et ne constituent pas des Activités.

Le modèle conserve un Cycle technique unique dont le nombre de répétitions vaut toujours 1. Il n’est jamais affiché ni modifiable dans le MVP.

### En-tête

L’écran affiche notamment :

- le champ `Nom de la séance` ;
- un contrôle de couleur compact placé à côté du nom ;
- une palette de 12 couleurs organisée en grille 4 × 3 ;
- le résumé `N activités · durée estimée`, centré en bas de la Composition.

Une couleur est proposée par défaut. L’ouverture de la palette ne grise pas le reste de l’écran.

### Paramètres du Tour


Le Tour possède un nombre de répétitions compris entre **1 et 99**, avec **1** comme valeur par défaut.

Dans l’interface, le nombre est affiché sous la forme d’un contrôle compact `xN`, placé immédiatement à droite de l’intitulé `Tour`. Les anciens boutons `+ / −` ne sont pas utilisés.

Un appui sur le contrôle `xN` ouvre un picker / une roulette permettant de sélectionner le nombre de répétitions.

### Retour haptique des roulettes

Toute roulette numérique de l’application produit un retour haptique léger et bref à chaque franchissement effectif d’un cran, c’est-à-dire à chaque changement de la valeur sélectionnée. Un seul retour haptique est déclenché par changement de valeur. Ce retour est systématique et indépendant du réglage `Vibration` du Profil, qui ne pilote que les vibrations fonctionnelles de séance.

### Ajout d’une Activité


Un seul bouton secondaire `+ Ajouter une activité` est affiché en haut de l’écran de Composition.

Aucun bouton `＋` intermédiaire n’est affiché dans le Tour ou entre les Activités.

Un appui sur `＋` ouvre l’écran de création d’Activité, dans lequel l’utilisateur choisit le type `Exercice` ou `Récupération`.

La première Activité créée est insérée immédiatement après le Compte à rebours initial et avant le Tour. Les Activités suivantes sont insérées après la dernière Activité ajoutée, dans la même zone. L’utilisateur peut ensuite les déplacer manuellement avant le Tour, dans le Tour ou après le Tour, au moyen de la poignée de glisser-déposer.

Le MVP ne propose pas de menu d’ajout rapide `Pause 15 s / 30 s / 45 s`.

Aucune Récupération explicite n’est ajoutée implicitement par l’application. La seule exception est la matérialisation technique d’une pause après Série configurée sur un Exercice.

Si deux Exercices s’enchaînent sans pause après Série ni Activité de type Récupération, un avertissement discret et non bloquant est affiché.

### Résumé de la ligne d’une Activité de type Exercice (D-095)

La ligne d’une Activité de type Exercice dans la Composition affiche :

- le nom de l’Exercice ;
- un résumé compact de sa configuration essentielle (nombre de Séries, Durée ou Répétitions, Pause après Série).

La Consigne et les Zones corporelles ne figurent jamais dans ce résumé.

Format :

- mode Durée : `N série(s) de X min Y s avec Z min Y s de pause par série` ;
- mode Répétitions : `N série(s) de X répétition(s) avec Z min Y s de pause par série`.

La clause de pause est entièrement omise lorsque la Pause après Série vaut `0 s`. Les segments minutes ou secondes nuls d’une durée sont omis (`45 s`, `1 min`), jamais affichés comme `0 min` ou `0 s`. Le singulier/pluriel de `série`/`répétition` s’accorde à la valeur.

Exemples : `3 séries de 1 min 30 s avec 15 s de pause par série` ; `3 séries de 12 répétitions avec 20 s de pause par série` ; `1 série de 45 s`.

### Consultation et modification d’une Activité

Toucher une carte Activité ouvre directement son parcours de modification. Un glissement gauche révèle les actions `Dupliquer` et `Supprimer`.

### Réorganisation

Les Activités peuvent être réorganisées par glisser-déposer avant le Tour, dans le Tour ou après le Tour.

Le Tour, le Compte à rebours initial et la Fin de séance restent des éléments structurels fixes dans le MVP.

### Validation de la Composition

L’écran ne comporte pas de bouton `Démarrer`.

L’action `Continuer` valide la Composition. Elle reste désactivée tant que le nom n’est pas renseigné, qu’aucune couleur n’est sélectionnée ou que la Composition ne contient pas au moins un Exercice valide.

En création, elle ouvre l’écran `Catégories de la séance`.

En modification d’une Séance existante, le parcours de validation conserve les catégories existantes et permet, le cas échéant, de les revoir conformément au flux Figma.

La Séance n’est exécutable que si elle contient au moins un Exercice valide.

### Enregistrement

Les modifications internes sont conservées au fur et à mesure, sous réserve des validations explicites prévues par les écrans d’édition.

## Écran 4 – Création / modification d’une Activité (Exercice)


![[images/creation-activite-exercice.png|260]]

### États Figma de référence

| État | Capture | Règle matérialisée |
| --- | --- | --- |
| Mode Répétitions | ![[images/creation-activite-repetitions.png\|220]] | Remplacement de la durée cible par un nombre de répétitions |
| Durée ouverte | ![[images/creation-activite-duree-ouverte.png\|220]] | Roulette compacte minutes/secondes avec validation explicite |
| Pause ouverte | ![[images/creation-activite-pause-ouverte.png\|220]] | Réglage de la pause après Série avec validation explicite |
| Nombre de Séries ouvert | ![[images/creation-activite-series-ouvert.png\|220]] | Sélecteur compact du nombre de Séries |
| Répétitions ouvertes | ![[images/creation-activite-repetitions-ouvert.png\|220]] | Sélecteur compact de la cible de répétitions |
| Informations complémentaires | ![[images/creation-activite-informations.png\|220]] | Deuxième étape facultative : Consigne et Zones corporelles |
### Objectif

Permettre à l’utilisateur de créer ou modifier une Activité de type `Exercice`.

La saisie se déroule en deux étapes :

1. paramètres essentiels ;
2. informations complémentaires facultatives.

### Ouverture

L’écran est ouvert lorsque l’utilisateur :

- ajoute un Exercice depuis la Composition ;
- choisit `Modifier` sur une Activité de type Exercice.

Le retour ramène à la Composition.

### Étape 1 — Paramètres essentiels

L’écran comporte notamment :

- Type d’Activité ;
- Nom ;
- Mode d’Exécution ;
- `Paramètres de l’activité`, regroupant les valeurs d’exécution ;
- bouton `Terminer`.

Le nom est obligatoire.

Les contrôles `Exercice / Récupération` et `Durée / Répétition` partagent chacun leur largeur intérieure en deux zones égales. Le texte de chaque option reste centré dans sa zone, quel que soit le palier de largeur. Le texte récapitulatif des paramètres est placé dans un cadre de largeur utile complète ; il conserve ses marges internes et le cadre grandit verticalement si le texte occupe plusieurs lignes.

### Mode d’Exécution

L’utilisateur choisit entre :

- `Durée` ;
- `Répétition`.

En mode `Durée`, la section `Paramètres de l’activité` comporte des roulettes de sélection pour :

- minutes ;
- secondes ;
- pause après Série ;
- nombre de Séries.

En mode `Répétition`, la Durée est remplacée par le Nombre de répétitions. Le Nombre de répétitions, la Pause et le Nombre de Séries sont sélectionnés par roulettes. La Pause et le Nombre de Séries restent disponibles.

Le nombre de Séries est toujours compris entre 1 et 99 (D-092). Pour tout nouvel Exercice, sa valeur par défaut est `1`.

Une Série correspond à l’Exécution de la durée ou du nombre de répétitions défini pour l’Exercice, suivie de sa pause éventuelle.

La pause est exécutée après chaque Série. Après la dernière Série, elle est omise lorsque l’étape suivante du plan d’Exécution est une Récupération explicite.

### Étape 2 — Informations complémentaires

L’écran comporte :

- `Consigne` ;
- `Zones corporelles` ;
- bouton `Terminer`.

La Consigne et les Zones corporelles sont facultatives.

Les Zones corporelles sont sélectionnées dans un référentiel prédéfini. Elles ne sont ni créées, ni renommées, ni supprimées par l’utilisateur dans le MVP.

`Terminer` enregistre l’Activité puis revient à la Composition.

### Modification d’une Activité

Lorsqu’un Exercice existant est modifié, ses valeurs sont préremplies.

Les Exécutions déjà historisées ne sont jamais modifiées.

## Écran 5 – Création / modification d’une Activité (Récupération)

![[images/creation-activite-recuperation.png|260]]

L’état du sélecteur de durée ouvert est la référence du composant de saisie :

![[images/creation-recuperation-duree-ouverte.png|220]]

### Objectif

Permettre de créer ou modifier une Activité de type `Récupération`.

### Contenu


L’écran comporte :

- le type `Récupération` ;
- `Nom` ;
- `Paramètres de l’activité` ;
- `Durée`, sélectionnée par une roulette minutes/secondes ;
- bouton `Valider`.

Le nom proposé par défaut est `Récupération`. Il peut être modifié par l’utilisateur.

Une Récupération est toujours chronométrée. Elle ne propose pas de mode Répétition ni de fin manuelle : sa fin temporelle est automatique.

Elle ne possède pas de Zones corporelles.

`Terminer` enregistre l’Activité puis revient à la Composition, y compris lorsque le sélecteur de durée est ouvert.

### Validation

L’action de validation enregistre l’Activité et revient à la Composition.

L’utilisateur peut utiliser la commande `Activité suivante` avant la fin d’une Récupération. Après confirmation, la Récupération est enregistrée avec le statut `Partielle` selon les règles générales des Activités chronométrées.

### Modification et actions secondaires

La modification utilise le même écran avec les valeurs préremplies.

La duplication et la suppression sont accessibles par glissement gauche sur la carte de l’Activité dans la Composition.

## Écran 6 – Catégories de la séance

![[images/categories-seance.png|260]]

L’état de création intégrée d’une nouvelle Catégorie est illustré par :

![[images/categories-nouvelle-inline.png|220]]

### Objectif

Permettre d’associer zéro, une ou plusieurs Catégories à une Séance.

Les Catégories facilitent l’organisation, la recherche et le filtrage. Elles n’ont aucun impact sur l’Exécution.

### Contenu et comportement

- les Catégories sont proposées sous forme de tags sélectionnables ;
- la sélection est multiple ;
- aucune Catégorie n’est obligatoire ;
- `+ Créer une catégorie` ouvre une ligne de création intégrée comportant `Nom de la catégorie`, `Annuler` et `Ajouter` ;
- `Enregistrer la séance` enregistre la sélection et ramène directement au `Catalogue des séances`.

## Écran 7 – Calendrier

![[images/calendrier-jour.png|260]]

La vue Semaine est illustrée par :

![[images/calendrier-semaine.png|260]]

La vue Mois est illustrée par :

![[images/calendrier-mois.png|260]]

### États Figma de référence

| État | Capture | Règle matérialisée |
| --- | --- | --- |
| Appui long en vue Jour | ![[images/calendrier-jour-appui-long.png\|220]] | Sélection d’une plage horaire avant planification |
| Choix de la Séance | ![[images/calendrier-choisir-seance.png\|220]] | Bottom sheet défilant ouvert par `+ Planifier` |
| Créneau à planifier | ![[images/calendrier-creneau-a-planifier.png\|220]] | Étape intermédiaire issue de la plage sélectionnée |
| Jour après planification | ![[images/calendrier-jour-apres-planification.png\|220]] | Résultat attendu après enregistrement |
| Jour suivant | ![[images/calendrier-jour-suivant.png\|220]] | Résultat d’un glissement gauche ou du chevron suivant |
| Semaine, mardi sélectionné | ![[images/calendrier-semaine-mardi.png\|220]] | Mardi placé en tête ; lundi se trouve au-dessus et n’est plus visible |
| Séance hebdomadaire déployée | ![[images/calendrier-semaine-deployee.png\|220]] | Détail d’une occurrence et zone `Démarrer` |
| Actions glissées | ![[images/calendrier-semaine-actions.png\|220]] | `Dupliquer` et `Supprimer` sur une occurrence hebdomadaire |
| Actions sur Étirements | ![[images/calendrier-etirements-actions.png\|220]] | Même interaction appliquée à une autre occurrence représentée |
| Après suppression | ![[images/calendrier-apres-suppression.png\|220]] | Liste hebdomadaire actualisée après suppression |
| Calendrier vide | ![[images/calendrier-vide.png\|220]] | État sans occurrence planifiée |

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


En vue Jour, toucher une carte ouvre sa planification ; aucune action glissée n’est proposée. En vue Semaine, toucher la zone principale d’une occurrence ouvre la modification de sa Routine dans l’écran de planification prérempli. La carte possède également une zone distincte pour la déployer ou la replier, une zone `Démarrer`, et révèle uniquement `Dupliquer` et `Supprimer` par glissement gauche.

L’état obtenu par glissement ne remplace pas la liste : il décale seulement la carte concernée pour révéler ses actions. Les autres jours et occurrences restent rendus à leur position chronologique. Dans l’exemple de référence, la section `Mardi 4 août` et `Mobilité du matin` restent donc visibles sous les cartes du lundi.

En vue Semaine, la liste est organisée chronologiquement en sections journalières. L’exemple affiche les trois Activités du lundi 3 août, puis la section du mardi 4 août avec `Mobilité du matin`. Lorsque le défilement place un nouveau jour en tête de la liste, le curseur coloré de la barre de semaine sélectionne ce jour. Inversement, sélectionner un jour dans la barre positionne sa section comme première section visible de la liste.

La barre de semaine occupe toute la largeur utile. Les sept jours forment sept colonnes flexibles de même largeur ; aucune largeur de cellule ni position horizontale issue du gabarit `402` n’est conservée en dur. Les espacements s’adaptent afin que les sept jours restent entièrement visibles dès `360` points et utilisent l’espace supplémentaire sur un grand téléphone. La grille de la vue Mois applique la même répartition en sept colonnes égales.

`+ Planifier` ouvre le bottom sheet `Choisir une séance`. La liste y défile si nécessaire et `Sélectionner` poursuit le parcours de planification.

Lorsqu’une occurrence future est exécutée en avance, elle est considérée exécutée pour cette occurrence et n’est plus proposée à son horaire initial.

Lorsqu’une occurrence planifiée arrive à échéance sans avoir été exécutée, elle disparaît de l’interface. Elle n’est pas affichée dans le Suivi du MVP.

La suppression ou modification d’une Routine agit sur les occurrences futures conformément aux règles de planification.

## Écran 8 – Planifier une séance

![[images/planifier-seance.png|260]]

### États Figma de référence

| État | Capture | Règle matérialisée |
| --- | --- | --- |
| Date ouverte | ![[images/planifier-date-ouverte.png\|220]] | Sélecteur de date compact |
| Heure ouverte | ![[images/planifier-heure-ouverte.png\|220]] | Roulette compacte heures/minutes avec validation explicite |
| Rappel personnalisé ouvert | ![[images/planifier-rappel-ouvert.png\|220]] | Réglage compact du délai de rappel avec validation explicite |
| Rappel personnalisé sélectionné | ![[images/planifier-rappel-selectionne.png\|220]] | Valeur répercutée dans le formulaire avant enregistrement |
| Nombre de semaines ouvert | ![[images/planifier-semaines-ouvert.png\|220]] | Fréquence hebdomadaire compacte |
| Aucune répétition | ![[images/planifier-sans-repetition.png\|220]] | Variante de planification unique |
| Changer la Séance | ![[images/planifier-changer-seance.png\|220]] | Liste de remplacement de la Séance associée |

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

![[images/execution-seance.png|260]]

### États Figma de référence

| État | Capture | Règle matérialisée |
| --- | --- | --- |
| Avant démarrage | ![[images/execution-etat-initial.png\|220]] | La Séance ne démarre pas automatiquement ; Retour mène au Catalogue renseigné dans le prototype |
| Sons et annonces désactivés | ![[images/execution-bips-vocal-desactives.png\|220]] | État alternatif des deux commandes de guidage sonore |

### Objectif

Guider l’utilisateur pendant l’Exécution avec une hiérarchie visuelle adaptée à une lecture rapide et à distance.

Un seul layout standard est utilisé pour les Activités en Durée, en Répétition et pour les Récupérations. Le comportement temporel s’adapte au type d’Activité sans changer la structure générale de l’écran ni les commandes principales.

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
- le temps total écoulé et la durée estimée de la Séance ; si le plan contient au moins un Exercice en mode Répétition, la durée estimée est affichée sous forme de borne minimale, par exemple `≥ 18 min` ;
- une barre de progression globale structurée en segments correspondant aux Tours, conformément au prototype Figma. Elle occupe exactement la largeur utile sans débordement. Les segments se répartissent dans cette largeur après déduction des espacements et ne conservent jamais la largeur fixe du gabarit `402`. Le remplissage représente l’avancement dans le plan d’Exécution selon la pondération hybride définie dans les chapitres 08 et 10 ; il n’est pas le simple rapport `temps écoulé / durée estimée`.

Le Cycle n’est jamais affiché. Le nombre total d’étapes et la position sous la forme `x sur y` ne sont pas affichés dans le MVP.

Le moteur d’Exécution peut néanmoins conserver ces informations pour son fonctionnement interne.

### Activité définie par une durée


Pour un Exercice ou une Récupération chronométrée, le temps est présenté sous forme de compte à rebours.

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

L’utilisateur termine normalement l’Exercice avec `Activité suivante`. Cette action ne crée pas une Activité Partielle : elle valide la fin normale de l’Exercice en mode Répétition.

### Séries

Lorsqu’un Exercice possède plusieurs Séries :

- `Série x/y` indique la Série en cours ;
- chaque Série exécute la durée ou les répétitions de l’Exercice ;
- la pause après Série est appliquée selon la définition de l’Exercice ;
- après la dernière Série, la pause technique est omise si l’élément suivant est déjà une Récupération explicite.

### Récupération

Une Récupération est toujours chronométrée et se termine automatiquement à zéro.

Elle utilise le même écran standard.

La zone `À suivre` permet de préparer l’Activité suivante.

### Commandes principales

Les trois commandes restent identiques quel que soit le type d’Activité :

- `Réinitialiser l’activité` ;
- `Pause` ;
- `Activité suivante`.

Leur position et leur rôle visuel ne changent pas entre Durée et Répétition.

### Réinitialiser l’Activité

L’action ouvre la modale de confirmation.

Après confirmation :

- la Série / Activité courante recommence depuis son état initial ;
- pour une Activité chronométrée, le compte à rebours retrouve sa durée initiale ;
- pour une Activité en Répétition, le chronomètre d’Activité revient à `00:00` ;
- la cible de répétitions n’est pas modifiée ;
- le temps total déjà écoulé dans la Séance reste conservé ;
- le Tour et le Cycle courants restent inchangés.

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

`Arrêter la séance` termine l’Exécution avec le statut `Interrompue` puis ouvre la Synthèse.

Il n’existe pas de commande directe d’arrêt depuis l’écran principal d’Exécution.

### Activité suivante

Le comportement dépend du type d’Activité :

- **Exercice en Répétition** : termine normalement l’Exercice et passe à la suite ;
- **Activité chronométrée avant zéro** : ouvre la modale de confirmation ; après confirmation, l’Activité est enregistrée avec le statut `Partielle`, puis l’Exécution continue ;
- **Activité chronométrée arrivée à zéro** : la transition est automatique.

### Navigation pendant l’Exécution

L’ordre d’Exécution est déterminé par le Plan d’Exécution.

L’utilisateur ne peut pas sélectionner librement une autre Activité ni revenir à une Activité déjà terminée.

### Guidage sonore

Au début d’une Activité, son nom peut être annoncé vocalement selon les Préférences.

Pour les Activités chronométrées, les signaux sonores de fin de compte à rebours sont appliqués conformément aux règles métier définies pour le MVP.

Pour un Exercice en Répétition, aucun signal de fin de compte à rebours n’est utilisé puisqu’il n’existe pas de temps cible. Un bip fixe est toutefois émis à chaque minute écoulée dans le MVP.

### Arrière-plan et verrouillage

Si l’application passe en arrière-plan ou si l’écran se verrouille :

- le Plan d’Exécution continue selon ses horodatages de référence ;
- l’Activité chronométrée ne se fige pas ;
- au retour, l’application reconstitue l’Activité et la position temporelle qui auraient dû être atteintes, plutôt que de reprendre le compteur à l’endroit où l’interface a été suspendue ;
- les sons et annonces sont maintenus dans la mesure permise par iOS et Android.

Une mise en pause de sécurité est appliquée en cas d’inactivité prolongée :

- pour une Activité chronométrée, si aucune interaction n’a eu lieu 30 minutes après sa fin théorique ;
- pour un Exercice en Répétitions, après 2 heures sans interaction depuis son démarrage.

Le comportement précis fait l’objet du spike technique prévu avant le développement complet du moteur d’Exécution.

### Fin de l’Exécution

Lorsque le Plan d’Exécution arrive à son terme, l’Exécution est enregistrée et l’écran `Synthèse de séance` est affiché.

La Séance source et la Routine éventuelle ne sont jamais modifiées par l’Exécution.

## Écran 10 – Synthèse de séance

![[images/synthese-seance.png|260]]

L’état initial, avant sélection du ressenti, est illustré par :

![[images/synthese-evaluation-initiale.png|220]]

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

![[images/suivi-condense.png|260]]

La vue déployée est illustrée par :

![[images/suivi-deploye.png|260]]

L’état sans Exécution enregistrée est illustré par :

![[images/suivi-vide.png|220]]

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

## Les modales

### Modale – Abandonner la création d’une séance

![[images/abandon-creation.png|260]]

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

- `Continuer la création`
- `Abandonner`

#### Comportement


`Continuer la création` ferme la modale et conserve intégralement la création en cours.

`Abandonner` supprime la nouvelle Séance et tout son contenu déjà saisi, puis revient au `Catalogue des séances`.

Ce comportement concerne uniquement le parcours de création. Pour une Séance existante ouverte en modification, Retour ne supprime jamais la Séance.

### Modale – Abandonner les modifications d’une Activité (D-094)

#### Objectif

Éviter la perte accidentelle des modifications apportées à une Activité de type Exercice, dans l’écran `Création / modification d’une Activité — Exercice`.

#### Ouverture

La modale s’affiche depuis l’écran Exercice lorsque l’utilisateur tente de quitter (Retour, geste de glissement, bouton matériel Android) alors que des modifications non enregistrées existent sur l’Activité en cours d’édition — comparées à son état au moment de l’ouverture de l’écran, jamais au reste de la Composition.

L’écran Exercice reste visible en arrière-plan, assombri et non interactif.

#### Contenu

**Titre**

> Abandonner les modifications ?

**Message**

> Les modifications apportées à cette activité seront perdues.

**Actions**

- `Continuer la modification`
- `Abandonner`

#### Comportement

`Continuer la modification` ferme la modale et conserve intégralement les modifications en cours sur l’Activité.

`Abandonner` annule uniquement les modifications locales de l’Activité, puis revient à `Composition d’une séance` — le reste de la Composition (nom, couleur, Compte à rebours initial, Fin de séance, autre Exercice déjà enregistré) n’est jamais affecté.

### Modale – Confirmer la suppression d’une Séance archivée

![[images/catalogue-archivees-actions.png|260]]

L’action `Supprimer` est révélée par glissement gauche dans la liste `Archivées`. Elle se superpose à la carte sans déplacer celle-ci.

![[images/suppression-seance-archivee.png|260]]

La modale demande une confirmation explicite. L’arrière-plan conserve la liste des Séances archivées et l’option `Supprimer` visible. `Annuler` ferme la modale et revient à la liste `Archivées`.

Dans le prototype MVP, le bouton de confirmation `Supprimer la séance` ne possède volontairement aucun lien tant qu’un état actualisé de la liste n’est pas représenté. Dans l’application, sa confirmation supprime la Séance archivée tout en conservant les Exécutions historiques.

### Modales – Suppression d’une planification

![[images/calendrier-suppression-unique.png|260]]

Pour une planification unique, `Supprimer` ouvre une confirmation. Après validation, la planification est supprimée, la Séance associée et les Exécutions historiques sont conservées.

![[images/calendrier-suppression-periodique.png|260]]

Pour une planification périodique, `Supprimer` propose `Cette occurrence` ou `Cette occurrence et les suivantes`. Les deux choix peuvent mener au même écran de résultat dans le prototype ; la vue Semaine montre ensuite l’occurrence retirée. Les Exécutions historiques restent conservées.

### Modale – Réinitialisation de l’Activité

![[images/execution-reinitialiser.png|260]]

#### Objectif

Permettre de recommencer l’Activité / Série en cours depuis son état initial sans revenir en arrière dans la Séance.

#### Ouverture

La modale s’affiche après appui sur `Réinitialiser l’activité`.

L’Exécution est suspendue pendant l’affichage de la modale.

#### Comportement

Après confirmation :

- l’Activité / Série courante reste l’Activité courante ;
- une Activité chronométrée retrouve sa durée initiale ;
- un Exercice en Répétition retrouve un chronomètre d’Activité à `00:00` ;
- la cible de répétitions reste inchangée ;
- le temps global déjà écoulé dans la Séance est conservé ;
- le Tour et le Cycle restent inchangés ;
- l’Activité redémarre selon son comportement normal.

`Annuler` ferme la modale et reprend l’Activité à son état précédent.

### Modale – Passage à l’Activité suivante

![[images/execution-activite-suivante.png|260]]

#### Objectif

Confirmer l’interruption anticipée d’une Activité chronométrée.

#### Ouverture

Cette modale s’affiche lorsque l’utilisateur appuie sur `Activité suivante` avant la fin d’une Activité chronométrée.

Elle ne s’affiche pas pour un Exercice en mode Répétition : dans ce cas, `Activité suivante` constitue la validation normale de la fin de l’Exercice.

#### Contenu


**Titre**

> Passer à l’activité suivante ?

**Message**

> La séance continuera avec l’activité suivante. L’activité en cours sera enregistrée comme Partielle.

#### Comportement


Après confirmation :

- l’Activité chronométrée est arrêtée avant son terme ;
- sa durée réellement exécutée est conservée ;
- son statut métier devient `Partielle` ;
- la progression est mise à jour ;
- l’Activité suivante démarre selon les règles normales du Plan d’Exécution.

`Annuler` ferme la modale et reprend l’Activité en cours.

### Modale – Pause / arrêt de l’Exécution

![[images/execution-pause.png|260]]

#### Objectif

Suspendre temporairement une Exécution puis permettre soit de la reprendre, soit de l’arrêter.

#### Ouverture

La modale est affichée après appui sur `Pause`.

L’Exécution est immédiatement suspendue.

#### Contenu

**Titre**

> Séance en pause

**Actions**

- `Reprendre la séance`
- `Arrêter la séance`

#### Reprendre la séance

Ferme la modale et reprend l’Activité à l’état exact où elle a été suspendue.

Pour une Activité chronométrée, le compte à rebours reprend.  
Pour un Exercice en Répétition, le chronomètre croissant reprend.

#### Arrêter la séance

Met fin à l’Exécution :

- la progression réellement effectuée est enregistrée ;
- le statut de l’Exécution devient `Interrompue` ;
- l’écran `Synthèse de séance` est affiché.

La modale ne peut être fermée que par l’une des deux actions prévues.

### Contrôles intégrés – Compte à rebours initial et Fin de séance

Ces réglages ne sont plus des modales dans le MVP.

Dans la Composition, toucher la ligne `Compte à rebours initial` ou `Fin de séance` ouvre une roulette minutes/secondes intégrée. Ces deux valeurs possèdent des brouillons et des valeurs validées indépendants. Dans le Profil, toucher la préférence correspondante ouvre un sélecteur intégré présentant visuellement `0 s`, `5 s`, `10 s` et `15 s` ; ce sélecteur historique du Profil n’est pas remplacé par la nouvelle roulette compacte dans la présente décision.

Les valeurs initiales de l’application sont `10 s` pour le Compte à rebours initial et `5 s` pour la Fin de séance. Une durée de `0 s`, lorsqu’elle est choisie par l’utilisateur, rend la phase instantanée sans supprimer l’élément structurel.

## Couverture du Prototype MVP et exclusions justifiées

### Périmètre intégré

La page Figma `Prototype MVP` (`510:101`) contient **74 frames de premier niveau**. Chacune de ces 74 frames possède une capture référencée dans le présent chapitre, à proximité de l’écran ou du comportement qu’elle documente.

Cette couverture comprend notamment :

- les écrans principaux et leurs états vides ;
- les vues condensées et déployées ;
- les sélecteurs et roulettes ouverts ;
- les actions révélées par glissement ;
- les modales de confirmation ;
- les états avant et après une action ;
- les variantes nécessaires à la compréhension des liens du prototype.

Une capture ne remplace pas la règle écrite. Les textes du présent chapitre définissent le comportement à implémenter ; les captures définissent la référence visuelle et l’état représenté.

### Éléments non intégrés comme écrans distincts

Aucune frame de premier niveau du `Prototype MVP` n’est exclue. Les éléments suivants ne font toutefois pas l’objet de captures autonomes :

| Élément non capturé séparément | Justification |
| --- | --- |
| Calques internes d’une frame : textes, icônes, séparateurs, fonds et cartes | Ils sont déjà visibles dans la capture de leur frame parente et ne constituent pas un état d’écran autonome. |
| Zones tactiles transparentes et groupes servant uniquement au prototypage | Leur rôle est documenté par les règles d’interaction et les liens ; une capture serait visuellement identique à celle de l’écran parent. |
| Cibles de défilement internes (`SCROLL_TO`) | Elles représentent une position dans une même liste, pas un nouvel écran. |
| Duplication d’un même lien sur le conteneur du bouton, son icône et son libellé | Ces couches assurent une cible tactile complète ; elles sont consolidées en une seule action fonctionnelle dans la documentation. |
| Écrans situés sur d’autres pages Figma, essais, variantes abandonnées ou références post-MVP | La page `Prototype MVP` est la source de vérité. Les autres pages ne doivent pas être utilisées pour compléter ou contredire le MVP. |
| `Suivi — Vue d’ensemble` analytique | La commande est visible mais désactivée dans le MVP ; aucun écran fonctionnel correspondant n’appartient au parcours MVP de référence. |
| État vide `Archivées` et recherche globale sans résultat | Ces états sont requis et décrits fonctionnellement, mais aucune frame dédiée n’existe dans le `Prototype MVP`. Ils doivent réutiliser les composants documentés de leurs écrans parents ; une fausse capture Figma ne doit pas être inventée. |
| Demande d’autorisation système des notifications | Il s’agit d’une interface native iOS/Android, dont le rendu dépend du système. La documentation précise son déclenchement contextuel mais ne fige pas une capture applicative. |

### Règle de maintenance

Lorsqu’une nouvelle frame de premier niveau est ajoutée au `Prototype MVP`, elle doit être soit intégrée dans ce chapitre avec sa règle fonctionnelle, soit inscrite dans le tableau d’exclusion avec une justification explicite. Une variante ne peut plus être omise silencieusement.
