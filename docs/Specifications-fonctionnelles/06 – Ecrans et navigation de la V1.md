# Écrans et navigation

**Évolutions v15 du07/10 :**36captations vérifiées, dont15PNG changés depuis main72d1bf4. , [DSF phrases](../DSF-PHRASES-V15-2026-10-07.md). Vue longue renommée224caractères ; les calculs déjà décidés sont conservés.

## Organisation et lecture

Les familles sont identifiées par leur **titre**, sans numérotation d’écran. Les noms physiques des images sont conservés pour préserver les références existantes. Chaque famille rassemble ses règles et toutes ses captures :

- **Vues principales et états intégrés** : écran de base, variantes, déplacement, sélection ou valeur modifiée ;
- **Modales, panneaux et confirmations** : contenu superposé à l’écran parent, y compris sélection, création d’une valeur, roulette et confirmation ;
- **Bulle contextuelle** : action attachée à un élément précis, sans nouvelle page ;
- **Variantes Information et Média** : rangées dans Exécution, avec leur statut de livraison propre.

Une frame Figma de 402 × 874 peut représenter une modale et son arrière-plan ; sa taille n’en fait pas un écran autonome. Les captures sont intégrées en Markdown standard, affichables hors Obsidian. La  sert d’inventaire ; les images se trouvent dans les familles ci-dessous, sans seconde galerie en fin de chapitre.

### Mise à jour Cadence et DSF du06/10/2026

Baseline documentaire6d03f5be579f2d0e2e7602b6abf1c2b46f4c740b ;133 frames courantes de Prototype MVP recensées et captures renouvelées sans retouche.  : chaque frame, fichier et contrat hôte. Les références datées précédentes restent des preuves historiques, notamment les états retirés ou horsMVP.

Cadence et phrase relèvent de [paramètres v13](08%20%E2%80%93%20Conception%20fonctionnelle%20d%C3%A9taill%C3%A9e.md#parametres-exercice), [Règles détaillées](10%20%E2%80%93%20Processus%20m%C3%A9tier%20et%20r%C3%A8gles%20m%C3%A9tier%20transverses.md#resultats-temporels) et [Phrase v1](08%20%E2%80%93%20Conception%20fonctionnelle%20d%C3%A9taill%C3%A9e.md#phrases). Figma fournit le rendu ; Excel seulement les formulations. Aucun chiffre de capture ne constitue une règle de durée. DSF, couleurs, composants, police et Safe Areas : [référence courante](../DSF-CADENCE-2026-10-06.md).

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
- une Description facultative et une sélection obligatoire d’au moins une Zone corporelle.

La création rapide constitue le parcours principal. La Description reste facultative ; un nouvel Exercice exige une Catégorie et au moins une Zone corporelle .

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

### Révision écran par écran — 30 septembre 2026

Les descriptions locales ci-dessous et les contrats CE-T03/CE-UI du chapitre13 intègrent les décisions closes D-233 à D-239. La  relie chaque frame concernée à son contrat et à ses critères. Contrôle exhaustif du 30 septembre 2026 : 113 frames du prototype et les 6 références complémentaires du rapport utilisateur, soit 119 captures Figma. Les 84 écrans du rapport sont couverts (78 dans le prototype). 74 fichiers existants sont actualisés et 45 copies documentaires complètent des écrans déjà présents dans Figma ; aucun écran applicatif ou Figma créé. La  donne les sources et les empreintes ; les captures du chapitre 06 sont regroupées par famille, près de leurs règles.

Sur tous les écrans concernés, les appuis suivent D-237 : dilatation au contact, retour et action immédiate au relâchement ; sortie de cible sans action ; réduction des animations par opacité. Les contrôles désactivés ne deviennent pas actifs par l’animation. L’inventaire des 27 icônes de sélection ne recolore ni visages, ni statuts, ni boutons à fond coloré. Navigation présente : composant6298:12462, traits2, dessins≤24 ; état sélectionné bleu, autre gris.

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
- Les quatre destinations principales `Catalogues`, `Calendrier`, `Suivi`, `Profil` occupent les quatre emplacements du composant de navigation. Aucun contrôle Recherche n’est présent dans le MVP .
- L’onglet actif peut afficher son libellé ; les autres conservent uniquement leur pictogramme. Le libellé actif ne doit pas chevaucher les pictogrammes voisins avec l’agrandissement du texte.
- Le composant canonique est `Navigation / Bottom` (`6298:12462`). Les destinations utilisent les variantes `6298:11827` Catalogues, `6298:11988` Calendrier, `6298:12149` Suivi et `6298:12310` Profil. Chaque dessin reste ≤ `24 pt`, centré dans une boîte optique `32 × 32 pt`, avec cible tactile ≥ `48 × 48 pt`. Aucun glyphe, emoji ou pictogramme système ne remplace ces vecteurs DSF.

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
- L’ouverture du clavier déplace ou fait défiler le contenu afin que le champ actif et l’action finale restent accessibles. Exception Créer / Modifier un exercice  : Terminer reste en bas, sous le clavier, et redevient accessible à sa fermeture ; la Description se place juste au-dessus du clavier, curseur visible. Aucun liseré sous l’en-tête ni autour du champ Nom . Un bouton ↑ dans la Description ferme le clavier sans enregistrer .
- Les contrôles disposés côte à côte restent horizontaux tant que chacun conserve sa largeur minimale lisible ; en mode compact, ils peuvent passer sur plusieurs lignes.
- Un cadre de synthèse ou d’aide occupe la largeur utile de son formulaire. Son texte utilise la largeur intérieure après déduction de ses marges internes et augmente la hauteur du cadre si plusieurs lignes sont nécessaires ; il ne peut ni dépasser horizontalement ni être masqué par une hauteur fixe.
- Toute roulette numérique ouverte est rendue dans une **modale basse standardisée**, indépendante de la position du déclencheur et du défilement du contenu. Le voile `overlayScrim` (`color/overlay/scrim`, #1F2129 à 34 %), commun à tous les dialogues, feuilles et modales y compris CE-UI-10, atténue le fond et bloque ses interactions ainsi que son défilement jusqu’à `Annuler` ou `Confirmer`. Une action principale fixe inférieure (`Continuer`, `Terminer`, etc.) conserve son apparence visuelle normale sous le voile, mais devient fonctionnellement et accessibilité-inactive jusqu’à fermeture de la roulette.
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
- si l’option est utilisée, le message indique qu’elle disparaît des nouveaux choix mais reste attachée aux objets existants, avec son nom et sa dernière couleur éventuelle ; l’historique reste inchangé ;
- `Annuler` ferme la confirmation et restitue la modale de sélection sans changement ;
- `Supprimer` retire la valeur des nouveaux choix, conserve les affectations existantes ainsi que son nom et sa dernière couleur, puis restitue la modale de sélection actualisée ;
- aucune restauration automatique d’une valeur initiale supprimée n’est effectuée.

### Dialogues d’action et modales plein écran

- Une décision contextuelle s’affiche dans un dialogue flottant centré, jamais dans une feuille ancrée au bas de l’écran. Le dialogue mesure `354` points de large, possède un rayon de `18` et une ombre ; le voile `overlayScrim` (#1F2129 à 34 %) laisse le contexte visible mais non interactif.
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
| Composition, Exercice, Planification | En-tête et action finale fixes ; le formulaire central défile. Avec le clavier ouvert, l’action reste atteignable sans recouvrir le champ actif. |
| Exercice | Aucun contrôle de type n’est affiché. Les accès `Catégorie` et `Zones corporelles`, le `Mode d’exécution` et la zone Média suivent le Figma courant. L’import/ajout de médias est actif au MVP dans PRE-3  ; les états système et règles d’import non représentés restent à clarifier. Le popover de mode propose Durée et Répétitions ; À l’échec se sélectionne dans la cible de chaque Série. Le résumé et la feuille de paramètres suivent D-247 à D-255/v13 et CE-T03-04/CE-UI-10 ; aucune ancienne double rangée fixe de synthèse. L’action `Terminer` reste accessible avec le clavier et le texte agrandi. |
| Planification | Rappel par interrupteur, options égales ; récapitulatif protégé et pied fixe. Voir CE-UI-05 et spécification 08/10. |
| Calendrier Semaine | La barre des jours reste lisible sur la largeur compacte ; les sept jours se répartissent la largeur disponible sans défilement horizontal. La liste journalière défile verticalement, utilise `8` points entre ses cartes et s’arrête `16` points avant la séparation de navigation. |
| Calendrier Mois | Les sept colonnes se répartissent la largeur disponible ; une cellule peut grandir verticalement mais ne défile pas horizontalement. |
| Exécution | Les commandes essentielles restent visibles sans défilement à la taille de texte standard. Le libellé du temps écoulé est séparé de la progression par Tours de `24` points. Avec agrandissement accessible, le contenu peut défiler, mais l’Exercice courant, le temps et les commandes restent atteignables. |
| Synthèse | Le choix du ressenti reste composé de trois options de largeur égale. Les séparations verticales structurantes utilisent `16` points entre statut et date, `32` points avant la section Ressenti et `24` points avant la section Commentaire. Sur écran compact ou texte agrandi, les libellés explicatifs se placent sous les icônes sans réduire leur cible tactile. |
| Suivi | `Séances` et `Vue d’ensemble` occupent deux segments égaux. Le groupe `Filtrer / Trier` est centré comme un ensemble et précède la liste de `32` points. Les groupes de dates sont séparés de `16` points. Les actions de chaque carte restent ancrées à droite et la liste défile dans une zone arrêtée au moins `16` points avant la navigation basse. |
| Modales d’Exécution ou de suppression | Les actions passent en pile verticale si elles ne tiennent pas horizontalement ; l’ordre fonctionnel défini par le Figma est conservé. |

Ces règles communes prévalent sur les coordonnées des captures. Une exception non décrite doit être résolue avec les mêmes tokens et principes, puis ajoutée à ce chapitre si elle affecte le comportement utilisateur.

## Navigation principale et articulation des écrans
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

1. saisie du nom et construction de la Composition dans l’écran unique `Composer une séance` ;
2. sélection facultative de l’Étiquette de Séance dans la modale intégrée ; la couleur de l’Étiquette devient la couleur de la Séance ;
3. ajout d’au moins un Exercice valide ;
4. action `Continuer` pour valider et enregistrer ;
5. retour au `Catalogue des séances`, segment `Séances`.

Aucune Routine n’est créée automatiquement. La transition canonique d’avancement fait entrer l’écran cible depuis la droite et sortir l’écran courant vers la gauche.

### Parcours du Catalogue des Exercices — MVP T03

Depuis le Catalogue, l’utilisateur sélectionne `Exercices` pour consulter la bibliothèque persistante. La surface d’une carte ouvre l’Exercice en consultation ou modification ; son bouton Lecture lance l’Exécution directe. L’action `Créer` est contextuelle : dans le Catalogue des Exercices, elle ouvre directement la création d’un Exercice persistant, sans écran ni arbre intermédiaire.

La rangée commune de commandes d’entrée est `Créer / Filtrer / Trier`. Le contrôle Filtrer démarre replié et blanc sans filtre. Un appui l’étend et affiche `Filtres / Aucun` sans modifier la liste ; un filtre sélectionné est conservé pendant la session courante, puis réinitialisé à `Aucun` au relaunch. La référence courante utilise des boutons contextuels visibles de `34 pt`, pictogrammes `20 pt`, gaps `12 pt` et cibles d’au moins `44 × 44 pt` sans chevauchement ; les pilules étendues ont une hauteur de `34 pt`. Pour `Exercices`, les critères contextuels sont statut (`Actives` / `Archivées`), Catégories et Zones corporelles. Pour `Séances`, le filtre couvre le statut et les Étiquettes. `Trier` reste visible mais désactivé et le tri appliqué reste `updatedAt DESC`. Filtre appliqué, tri implicite et scroll sont conservés pendant la session courante ; au relaunch, le filtre revient à `Aucun`.

Aucune recherche globale ou locale de Catalogue n’est active au MVP .

Depuis la Composition d’une Séance, `Ajouter un exercice` ouvre directement la sélection multiple du Catalogue des Exercices. La validation copie les Exercices dans leur ordre visible et restaure la Composition. La capacité historique de création directe d’un Exercice local à la Séance reste conservée fonctionnellement et techniquement mais n’est pas exposée dans ce parcours courant.

### Parcours d’ouverture et de modification d’une Séance

Dans le `Catalogue des séances`, toucher la zone principale d’une carte active ouvre directement la Séance en mode modification dans `Modifier une séance`. Cette action est disponible que la carte soit condensée ou déployée.

Le déploiement de la carte est facultatif et sert uniquement à consulter rapidement son contenu.

Le chevron déploie ou replie la carte. La zone `Démarrer` lance le parcours d’Exécution. Ces zones tactiles conservent chacune leur comportement propre.

### Parcours d’Exécution

Le bouton `Démarrer` d’une Séance dans le Catalogue, ou celui d’une occurrence de Routine, ouvre l’écran d’Exécution. La surface principale d’une carte Catalogue ouvre la Composition en modification.

L’ouverture de cet écran ne démarre pas immédiatement le premier Exercice.

L’utilisateur déclenche l’Exécution depuis l’écran lui-même. Le Compte à rebours initial est alors exécuté, s’il est configuré avec une durée supérieure à zéro, puis le premier Exercice commence.

Lorsque la Séance se termine, l’écran de synthèse est affiché. L’action `Enregistrer` finalise le Ressenti et le Commentaire puis ouvre le `Suivi` (CE-UI-08).

### Parcours de consultation du Suivi

Dans le MVP, le `Suivi` affiche la liste des Exécutions enregistrées.

La future `Vue d’ensemble` reste visible dans le sélecteur mais elle est grisée et inactive. Elle est prévue pour une version ultérieure.

Chaque carte peut être déployée individuellement pour consulter le détail de l’Exécution directement dans la liste.

Les commandes `Filtrer` et `Trier` restent visibles mais désactivées dans le MVP ; la Vue d’ensemble est abandonnée pour le MVP et ne constitue plus un écran à développer. Cette règle du Suivi est distincte du Catalogue T03, où `Filtrer` est fonctionnel pour `Archivées` sur Exercices.

### Familles de vues

Les familles sont identifiées par leur titre : Profil, Catalogues, Composition, éditeur d’exercice, Calendrier, Planification, Exécution, Synthèse et Suivi. Les sélections, confirmations et réglages ouverts restent rattachés à leur famille ; ils ne reçoivent pas de numéro d’écran autonome. L’exécution directe est une variante de l’Exécution.

### Retour et fermeture

En dehors d’une Exécution en cours, revenir à l’écran précédent ne nécessite pas de confirmation lorsque les modifications ont déjà été enregistrées ou lorsqu’aucune donnée temporaire ne risque d’être perdue.

La modale `Abandonner la création d’une séance` concerne la création en cours dans l’écran `Composer une séance`.

Pendant une Exécution, aucune sortie directe vers la navigation principale n’est proposée. L’arrêt de la Séance est accessible uniquement après mise en pause.

### Conservation du contexte

L’application conserve autant que possible le contexte de l’utilisateur :

- la Séance précédemment consultée ;
- l’état déployé ou replié d’une carte tant que l’utilisateur reste dans la vue concernée ;
- l’Exercice et la Série en cours pendant une Exécution ;
- la position dans le Suivi.

Après la fermeture d’une modale, l’utilisateur retrouve le contexte depuis lequel elle a été ouverte.

### Enregistrement automatique

Les modifications d’objets existants sont enregistrées automatiquement lorsque l’écran ne prévoit pas explicitement une action `Continuer`, `Valider`, `Terminer` ou `Enregistrer` ; la Composition conserve toujours un brouillon jusqu’à `Continuer` (CE-T03-08).

Les écrans de création ou les modales comportant une action explicite ne valident les données qu’après cette action.

### Navigation pendant une Exécution

Pendant l’Exécution, la navigation principale n’est pas affichée.

L’utilisateur dispose de trois commandes principales :

- `Réinitialiser l’exercice` ;
- `Pause` ;
- `Exercice suivant`.

Il n’existe pas de bouton `Quitter` ou `Arrêter` directement sur l’écran d’Exécution. L’action `Arrêter la séance` est accessible uniquement depuis la modale de pause.

L’utilisateur ne peut pas revenir à un Exercice déjà exécuté.

### Cohérence des libellés

Les mêmes termes sont utilisés dans toute l’application :

- `Séance` : contenu complet d’un entraînement ;
- `Routine` : créneau portant une liste ordonnée de Séances et/ou Exercices persistants ;
- `Exercice` : action élémentaire exécutée en mode Durée ou Répétitions, avec cible chiffrée ou À l’échec par série, avec Pause après chaque série et, en bilatéral, Pause entre les côtés éventuelle ;
- `Pause entre les côtés` : durée intrinsèque facultative d’un Exercice bilatéral, exécutée selon l’Ordre des côtés ;
- `Récupération après exercice` : durée contextuelle portée par chaque occurrence d’Exercice dans une Séance, non affichée sur les cartes  et exécutée après l’occurrence lorsqu’elle est positive ;
- `Série` : répétition propre à un Exercice ;
- `Circuit` : groupe ordonné d’Exercices exécuté intégralement un nombre défini de fois ;
- `Cycle` : structure technique unique, fixée à une répétition et jamais affichée dans le MVP ; elle ordonne les Exercices placés avant le Circuit, le Circuit et les Exercices placés après le Circuit ;
- `Exécution de séance` : réalisation effective d’une Séance.

## Splash KODJO

Le splash affiche exactement `KODJO`, `Keep On. Do Just One.` et `Votre assistant du quotidien`. Il reste affiché 2,5 secondes puis ouvre automatiquement le `Catalogue des séances` avec une transition `DISSOLVE` de 0,3 seconde. Le type `Séances` est sélectionné ; le Catalogue présente l’état vide lorsqu’aucune Séance non archivée n’existe, sinon la liste par défaut alimentée par les données locales.

### Vues principales et états intégrés

#### Splash — Kodjo

[Source Figma — `1992:469`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-469)

![Splash — Kodjo](images/ecran-0-splash-kodjo.png)

## Profil

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

Les préférences de Compte à rebours initial et de Fin de séance servent de valeurs proposées lors de la création d’une nouvelle Séance. Elles restent modifiables au niveau de chaque Séance. Les lignes `Compte à rebours d’exercice` (ancien nœud `4179:9550`, historique supprimé ; le contrôle fonctionnel reste prescrit) et `Fin d’exercice` (ancien nœud `4179:9556`, historique supprimé ; le contrôle fonctionnel reste prescrit) sont des contrôles intégrés à cet écran Profil, pas des écrans distincts ; leurs valeurs sont proposées à la création d’un Exercice et restent modifiables dans chaque Exercice.

Les valeurs initiales de l’application sont `10 s` pour le Compte à rebours initial, `5 s` pour la Fin de séance et `activée` pour Vibration. L’état désactivé montré dans le parcours Figma illustre une modification utilisateur et ne définit pas la valeur initiale.

Le feedback haptique des roulettes est systématique dans le MVP et reste indépendant de la préférence `Vibration`, réservée aux vibrations fonctionnelles de séance.

Le MVP est disponible uniquement en français et n’affiche aucun sélecteur de langue. Tous les textes destinés à l’utilisateur sont référencés par des clés de traduction centralisées, sans texte fonctionnel codé directement dans les écrans. Les traductions futures peuvent ainsi être ajoutées sans modifier les composants. Les pluriels, variables, dates, heures, nombres, notifications et libellés d’accessibilité utilisent également ce mécanisme d’internationalisation.

### Comportement

Les préférences sont enregistrées immédiatement. L’écran `Modifier le profil — MVP` permet de modifier la photo, le nom d’affichage et la préférence facultative `silhouette`, puis demande une action explicite `Enregistrer`. La préférence est enregistrée avec le Profil. Valeurs : homme/femme ; non renseignée = silhouette homme. Elle ne modifie que l’icône de zone corporelle, sans filtre ni effet sur les données d’exercice.

Les préférences ne modifient pas rétroactivement les Séances existantes ni une Exécution déjà en cours.

Les notifications ne sont pas autorisées par défaut. La demande d’autorisation du système d’exploitation est présentée lorsque l’utilisateur active pour la première fois un rappel lors d’une planification. En cas de refus, le rappel n’est pas activé et l’application indique que l’autorisation peut être modifiée dans les réglages du système.

### Choix de silhouette

Sous l’aide du Nom d’affichage, deux cercles de 64 px espacés de 24 px portent des silhouettes de 44 px. Sélection : contour bleu 2 px, dessin #0508E5 ; non sélection : contour #CCD1E0 1 px, dessin #9499A8. Libellés accessibles : `Silhouette homme` et `Silhouette femme`. Une seule préférence ; absence de saisie autorisée. Vérifier l’effet sur toutes les icônes de zone corporelle après enregistrement et après relance. Les autres états Profil héritent de la navigation et des animations communes. Contrat CE-UI-01.

### Navigation

L’écran est accessible depuis l’onglet **Profil** de la barre de navigation inférieure.

Il s’agit d’un onglet principal : aucun bouton `Retour` spécifique n’est nécessaire pour revenir à un autre onglet.

### Vues principales et états intégrés

#### Profil — Vue d'ensemble - Vibration désactivée

[Source Figma — `1992:375`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-375)

![Profil — Vue d'ensemble - Vibration désactivée](images/ecran-1-profil.png)

#### Profil — Stepper Pause changement de côté

[Source Figma — `1992:474`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-474)

![Profil — Stepper Pause changement de côté](images/ecran-1c-profil-compte-rebours-ouvert.png)

État courant du stepper Pause changement de côté

#### Profil — Stepper Récupération après activité

[Source Figma — `1992:579`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-579)

![Profil — Stepper Récupération après exercice](images/ecran-1d-profil-fin-seance-ouverte.png)

État courant du stepper Récupération après exercice

#### Profil — Vue d'ensemble - Vibration activée

[Source Figma — `1992:684`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-684)

![Profil — Vue d'ensemble - Vibration activée](images/ecran-1b-profil-vibration-activee.png)

Valeur initiale fonctionnelle de la préférence `Vibration`

#### Profil — Modifier le profil — MVP

[Source Figma — `1992:778`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-778)

![Profil — Modifier le profil — MVP](images/ecran-1a-modifier-profil.png)

#### Profil — Vue d'ensemble — Parcours vide

[Source Figma — `2139:86`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=2139-86)

![Profil — Vue d'ensemble — Parcours vide](images/ecran-1e-profil-parcours-vide.png)

Présentation du Profil avant que l’utilisateur ait créé du contenu

## Catalogue des séances

### Objectif

Permettre à l’utilisateur de consulter son Catalogue de Séances, de le filtrer et le trier selon les fonctions disponibles, de créer une nouvelle Séance et d’accéder rapidement à la modification, à l’Exécution, à la consultation détaillée ou aux actions de gestion.

Cet écran constitue l’accueil de l’application.

### Filtres

Le Catalogue présente le sélecteur `Exercices / Séances`, avec `Séances` sélectionné par défaut, `Exercices` actif en T03 et aucun segment `Parcours`. Sous ce sélecteur, la rangée commune `Créer / Filtrer / Trier` utilise les boutons contextuels de `34 pt`, pictogrammes `20 pt`, gaps `12 pt`, cibles ≥ `44 × 44 pt` sans chevauchement. Les panneaux ouverts de `Filtrer` sont définis dans Figma et contextuels au Catalogue. `Trier` reste visible mais désactivé en T03.

Les Catalogues du MVP ne comportent aucune recherche globale ni recherche locale. Les filtres restent contextuels au Catalogue et suivent les règles décrites ci-dessous.

Les Séances archivées restent exclues de la liste active et ne sont accessibles que par le mécanisme de filtrage prévu. T03 n’invente aucune option de filtre supplémentaire propre aux Séances au-delà de ce qui est explicitement arbitré.

### Carte de Séance — vue condensée

Carte standard 354 × 90 px à largeur de référence 402, rayon 8, titre 15 Semi Bold, sans barre verticale ni cercle de nature. Ligne de classement : Étiquette puis catégories issues des exercices ; en l’absence d’Étiquette, afficher les catégories. Pastilles 20 ; pictogramme blanc sur couleur. Ligne des valeurs : `N exercices` et `N tours`, icônes nues 16. Badge durée en haut à droite ; la durée exclut Compte à rebours initial et Fin de séance.

Aucune prochaine planification ni ligne de pause/récupération sur la carte. Les séances restent sans vignette, définitivement . Les listes de catégories utilisent ` · ` puis `…` si nécessaire ; la donnée complète est conservée. Les cartes archivées utilisent fond `color/surface #F5F7FA` (ancienne prescription `#F6F6F6` historique ; référence couleur centralisée au chapitre12) et bord #D9D9D9 ; Restaurer remplace Lecture.

Ces règles s’appliquent aux listes, filtres actifs/inactifs, recherches, états restaurés, actions glissées et arrière-plans de modales. Les actions révélées suivent la hauteur réelle de la carte. Les séances restent triées par dernière modification décroissante ; exécuter ne change pas cet ordre.

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

Toucher l’action de création ouvre `Composer une séance`, qui réunit le nom, l’Étiquette/couleur et la Composition.

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

Si aucune Séance n’a encore été créée, l’écran affiche : `Vous verrez ici la liste de vos séances dès que vous aurez commencé à les créer.` Il présente également l’action permettant de créer la première Séance.

Le filtre `Archivées` possède également un état vide lorsque aucune Séance n’est archivée. Il conserve l’en-tête et les commandes du Catalogue, remplace la liste par un message d’absence de Séance archivée et ne propose pas d’action de suppression ou de restauration.

Ces deux états sont fonctionnellement requis mais ne possèdent pas de frame dédiée dans le `Prototype MVP`. Ils réutilisent le composant d’état vide et la structure de leurs écrans parents ; aucune capture non issue de Figma n’est créée.

### Confirmation — Confirmer la suppression d’une Séance archivée

L’action `Supprimer` est révélée par glissement gauche : la carte se déplace avec le geste et révèle l’action placée derrière.

Le dialogue flottant centré demande une confirmation explicite. `Annuler` ferme le dialogue et revient au résultat du filtre `Archivées`.

Le bouton destructif porte le libellé `Confirmer`. Dans l’application, sa confirmation supprime la Séance archivée tout en conservant les Exécutions historiques.

### Confirmation — Confirmer l’archivage d’une Séance planifiée

Référence Figma : `4593:6285 — Modal — Confirmer l’archivage d’une séance planifiée`.

Cette modale est utilisée lorsqu’une Séance active possède des planifications associées. Elle indique que les planifications seront supprimées tandis que les Séances déjà effectuées restent dans l’historique. Les actions sont `Archiver` et `Annuler`.

### Vues principales et états intégrés

#### Catalogue des séances — Liste par défaut

[Source Figma — `1992:9910`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-9910)

![Catalogue des séances — Liste par défaut](images/ecran-2-catalogue-seances.png)

#### Catalogue des séances — Séance déployée

[Source Figma — `1992:10014`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-10014)

![Catalogue des séances — Séance déployée](images/ecran-2b-catalogue-seance-deployee.png)

Consultation de la Composition sans quitter le Catalogue

#### Catalogue des séances — Liste condensée — actions glissées

[Source Figma — `1992:10518`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-10518)

![Catalogue des séances — Liste condensée — actions glissées](images/ecran-2d-catalogue-condense-actions.png)

La carte se déplace avec le glissement et révèle `Planifier`, `Dupliquer` et `Archiver` derrière

#### Catalogue des séances — Séance déployée — actions glissées

[Source Figma — `1992:10628`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-10628)

![Catalogue des séances — Séance déployée — actions glissées](images/ecran-2e-catalogue-deployee-actions.png)

Même convention de glissement avec déplacement réel de la carte

#### Catalogue des séances — Archivées — Séance restaurée

[Source Figma — `1992:10848`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-10848)

![Catalogue des séances — Archivées — Séance restaurée](images/ecran-2g-catalogue-seance-restauree.png)

Snackbar de restauration et action `Annuler`

#### Catalogue des séances — Liste sans Renforcement du genou

[Source Figma — `1992:10937`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-10937)

![Catalogue des séances — Liste sans Renforcement du genou](images/ecran-2h-catalogue-apres-archivage.png)

Résultat attendu après retrait de `Renforcement du genou` de la liste active

#### Catalogue des séances — État vide

[Source Figma — `2117:86`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=2117-86)

![Catalogue des séances — État vide](images/ecran-2i-catalogue-vide.png)

#### Catalogue des séances — Archivées — actions glissées

[Source Figma — `2234:88`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=2234-88)

![Catalogue des séances — Archivées — actions glissées](images/modale-3-seance-archivee-action-supprimer.png)

#### Catalogue des séances — Liste — Filtre inactif étendu

[Source Figma — `4549:6382`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4549-6382)

![Catalogue des séances — Liste — Filtre inactif étendu](images/figma-4549-6382.png)

État `Filtres / Aucun`, liste inchangée

#### Catalogue des séances — Filtre actif Archivé

[Source Figma — `4549:6742`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4549-6742)

![Catalogue des séances — Filtre actif Archivé](images/ecran-2f-catalogue-archivees.png)

État actif du contrôle et liste filtrée

#### Catalogue des séances — Liste condensée — actions glissées — Dos et mobilité

[Source Figma — `4592:6217`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4592-6217)

![Catalogue des séances — Liste condensée — actions glissées — Dos et mobilité](images/figma-4592-6217.png)

### Modales, panneaux et confirmations

#### Modal — Confirmer la suppression d’une séance archivée

[Source Figma — `2234:189`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=2234-189)

![Modal — Confirmer la suppression d’une séance archivée](images/modale-3a-confirmer-suppression-seance-archivee.png)

Fenêtre restaurée et réexportée le01/10/2026. Titre « Supprimer cette séance ? » ; message « Cette séance archivée sera définitivement supprimée. Cette action est irréversible. » ; Annuler gris#F3F4F6 / Confirmer#B1503C. Les deux actions ne sont pas recâblées dans le prototype ; leur comportement produit reste annuler sans mutation / supprimer définitivement après confirmation.

#### Catalogue des séances — Filtrer — Panneau ouvert

[Source Figma — `4168:11149`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4168-11149)

![Catalogue des séances — Filtrer — Panneau ouvert](images/figma-4168-11149.png)

Modale de filtres contextuels Séances : statut et Étiquettes

#### Modal — Confirmer l’archivage d’une séance planifiée

[Source Figma — `4593:6285`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4593-6285)

![Modal — Confirmer l’archivage d’une séance planifiée](images/figma-4593-6285.png)

## Catalogue des exercices

La frame `3786:5093` utilise le même Screen Shell et le même contrôle de type que le Catalogue des Séances, avec `Exercices` sélectionné. La liste contient les Exercices persistants et conserve filtres, tri implicite et position de défilement dans l’état de navigation du parcours courant.

La rangée `Créer / Filtrer / Trier` est identique au Catalogue des Séances : boutons contextuels `34 pt`, pictogrammes `20 pt`, gap `12 pt`, cibles tactiles ≥ `44 × 44 pt` sans chevauchement. `Filtrer` propose les critères contextuels validés et ses panneaux ouverts sont définis dans Figma ; `Trier` reste visible disabled.

Chaque carte utilise la nouvelle grammaire DSF : aucune barre verticale ; la couleur de Catégorie est portée par sa pastille dans le Catalogue. Sa surface principale ouvre la consultation ou la modification ; le bouton Lecture, dans une cible séparée, lance uniquement l’Exécution directe. La carte d’Exercice possède un seul format à gouttière permanente de64 px dans le Catalogue : photo associée ou icône de nature sans média. Aucun Déployer avec ou sans média ; Lecture reste indépendante. Chargement/erreur conservent la place réservée, texte alternatif = nom de l’exercice. Un glissement gauche expose `Planifier / Dupliquer / Archiver` sur les Exercices actifs et `Supprimer` dans les archives. Aucune poignée de déplacement n’est affichée.

Titre15 Semi Bold, durée sans cadre en haut à droite, seulement si calculable, classement Catégorie puis Zones, valeurs16 et synthèse `N séries de X` / `N séries de N rép.` / `N séries à l’échec`. Bilatéralité par miroir16 à12 après la synthèse. Aucune pause/récupération ni prochaine planification affichée. Format unique : carte354 × 91, gouttière64 à12, titre x88/largeur250, lignes basses de largeur207, catégorie conservée et pictogramme de zone conservé. Variante archivée : fond `color/surface #F5F7FA` (ancienne prescription `#F6F6F6` historique ; référence couleur centralisée au chapitre12), bord #D9D9D9, Restaurer ; l’absence d’écran d’archive dédié est acceptée. Ces règles valent aussi derrière les panneaux de filtres et dans les états glissés ; les actions suivent la hauteur de la carte.

États Figma complémentaires de la famille Catalogue des Exercices :

- `4521:6220 — Catalogue des exercices — État vide` ;
- `4168:11262 — Catalogue des Exercices — Filtrer — Panneau ouvert` ;
- `4544:6344 — Catalogue des Exercices — Liste — Filtre inactif étendu` ;
- `4544:6651 — Catalogue des Exercices — Liste — Filtre actif étendu` ;
- `4738:6209 — Catalogue des Exercices — Liste — actions glissées` ;
- `4738:6355 — Catalogue des Exercices — Liste — Première carte déployée — Média` : référence historique hors MVP .

La frame `4534:6339 — Catalogue des Exercices — Filtre — États du contrôle` est une planche de référence du contrôle, pas un écran utilisateur autonome.

L’ancienne référence Figma `3787:5209 — Catalogue — action contextuelle directe` n’existe plus dans l’état courant et n’est plus une preuve active. Aucun état de remplacement n’est inventé.

### Vues principales et états intégrés

#### Catalogue des Exercices — Liste

[Source Figma — `3786:5093`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=3786-5093)

![Catalogue des Exercices — Liste](images/ecran-12-catalogue-activites-liste.png)

#### Catalogue des exercices — État vide

[Source Figma — `4521:6220`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4521-6220)

![Catalogue des exercices — État vide](images/figma-4521-6220.png)

#### Catalogue des Exercices — Liste — Filtre inactif étendu

[Source Figma — `4544:6344`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4544-6344)

![Catalogue des Exercices — Liste — Filtre inactif étendu](images/figma-4544-6344.png)

#### Catalogue des Exercices — Liste — Filtre actif étendu

[Source Figma — `4544:6651`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4544-6651)

![Catalogue des Exercices — Liste — Filtre actif étendu](images/figma-4544-6651.png)

#### Catalogue des Exercices — Liste — actions glissées

[Source Figma — `4738:6209`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4738-6209)

![Catalogue des Exercices — Liste — actions glissées](images/figma-4738-6209.png)

#### Référence historique hors MVP — Catalogue des Exercices — Liste — Première carte déployée — Média

[Source Figma — `4738:6355`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4738-6355)

![Catalogue des Exercices — Liste — Première carte déployée — Média](images/figma-4738-6355.png)

### Modales, panneaux et confirmations

#### Catalogue des Exercices — Filtrer — Panneau ouvert

[Source Figma — `4168:11262`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4168-11262)

![Catalogue des Exercices — Filtrer — Panneau ouvert](images/figma-4168-11262.png)

## Composer une séance / Modifier une séance

### Objectif

Permettre à l’utilisateur de définir la structure et l’ordre d’Exécution d’une Séance.

L’écran de Composition ne lance pas directement l’Exécution.

### Structure affichée

La Composition est présentée comme une structure hiérarchique ordonnée et non comme un parcours de type niveaux.

Elle comprend dans le MVP :

- un `Compte à rebours initial` ;
- zéro, un ou plusieurs Exercices placés avant le Circuit ;
- un `Circuit` unique, qui peut lui-même contenir des Exercices ;
- zéro, un ou plusieurs Exercices placés après le Circuit ;
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

### Paramètres du Circuit

L’icône affichée à gauche de `Nombre de tours` est exclusivement une instance de `Icon / Tour` (`3066:4685`). Son dessin canonique est celui validé dans `Composition séance — Nom saisi` (`2028:12003`) ; l’ancienne sous-référence graphique supprimée n’est plus utilisée comme preuve active : cadre visuel `18 × 18`, quatre tracés, trait `1,35`, couleur `color.textPrimary` (`#141414`). Les copies vectorielles locales et l’ancien pictogramme Tour ne sont pas autorisés. L’actif exportable correspondant est uniquement `assets/icons/icon-tour.svg`, clé de registre `icon.tour`.

Le Circuit porte une nature tours (défaut) ou séries et un compte de1 à99, initialisé à1.

Le chiffre du compteur ouvre les boutons −/+ ; la pastille portant uniquement tours/séries ouvre le choix de nature. Le bouton œil permanent, sur la ligne du titre, ouvre les volumes. Les captures actuelles et les mesures figurent dans le DSF du 12/10 ; les ± visibles dans ces exemples illustrent l’édition, pas le repos.

La synthèse n’est plus affichée isolément au bas de l’écran. Elle est recalculée uniquement après une modification validée qui affecte les Exercices ou le nombre de Tours. La confirmation du `Compte à rebours initial` ou de la `Fin de séance` actualise seulement le jalon structurel concerné et ne modifie jamais cette synthèse. Celle-ci reste attachée au conteneur Circuit dans ses états applicables.

Le nombre se règle via ± révélés par appui sur le chiffre. La diminution est sans message ; une conversion de nature entraînant une perte exige une confirmation atomique. Les modifications appartiennent au brouillon de Composition jusqu’à son enregistrement ; bornes 1–99 et valeur initiale 1 inchangées.

### Retour haptique des roulettes

Toute roulette numérique de l’application produit un retour haptique léger et bref à chaque franchissement effectif d’un cran, c’est-à-dire à chaque changement de la valeur sélectionnée. Un seul retour haptique est déclenché par changement de valeur. Ce retour est systématique et indépendant du réglage `Vibration` du Profil, qui ne pilote que les vibrations fonctionnelles de séance.

### Ajout d’un Exercice

Un seul bouton secondaire `+ Ajouter un exercice` est affiché en haut de l’écran de Composition.

Aucun bouton `＋` intermédiaire n’est affiché dans le Circuit ou entre les Exercices.

Un appui sur `Ajouter un exercice` ouvre directement la sélection multiple des références persistantes du Catalogue. La validation est désactivée lorsque la sélection est vide et les Exercices validés sont insérés dans l’ordre courant de la liste filtrée, non dans l’ordre des touchers. Le mécanisme de création directe d’un Exercice local à la Séance est conservé dans le produit mais n’est pas proposé par l’enchaînement d’écrans courant.

Le premier Exercice créé est inséré immédiatement après le Compte à rebours initial et avant le Circuit. Les Exercices suivants sont insérés après le dernier Exercice ajouté, dans la même zone. L’utilisateur peut ensuite les déplacer manuellement avant le Circuit, dans le Circuit ou après le Circuit. La réorganisation est déclenchée par un appui long sur l’ensemble de la carte ; la poignée reste un indicateur visuel et ne constitue pas la seule zone de déclenchement.

La poignée de chaque carte d’Exercice est exclusivement une instance du composant DSF `Icon / Structure / Movable` (`3066:4676`) : dessin `20 × 20` centré dans un slot `28 × 28`, opacité `50 %`, couleur `color.iconNeutral`. Le dessin local historique `icon/réorganiser` en `16 × 16` et l’application du token `icon.compact` à cette poignée sont interdits.

Le MVP ne propose pas de menu d’ajout rapide `Pause 15 s / 30 s / 45 s`.

Aucune récupération automatique à la création d’une occurrence. Une récupération explicite est proposée au défaut Profil (30 s initialement) lors de son ajout ; elle reste solidaire de son occurrence. postActivityRecoverySeconds est sa projection de calcul, 0 en l’absence de récupération . Hors placement, le trait de démarcation reste présent, indépendamment du contenu. Récupération absente/0 : aucune information de récupération ; aucun point : aucune information de point. Pendant le choix des emplacements, le trait est masqué au profit des contrôles de placement .

**Avertissement d’enchaînement sans pause .** Lorsque deux Exercices consécutifs n’ont ni pause effective de transition ni Récupération positive après son occurrence, la Composition affiche l’avertissement non bloquant : « Attention, les exercices vont s’enchaîner sans pause. » Il concerne l’enchaînement entre Exercices ; aucun avertissement distinct entre Séries n’est ajouté. Il n’empêche ni l’enregistrement ni l’exécution et ne modifie aucun paramètre.

### Composition — ligne de Série variable — références du03/10

### Résumé de la ligne d’un Exercice (D-095 révisée par D-238)

La ligne présente le nom, la Catégorie puis les Zones corporelles sur une ligne de classement, puis la synthèse :

- Séries identiques : `N × cible` avec unité ; le préfixe N × est conservé sous circuit de séries ;
- Séries variables : cibles séparées par un point médian, unité à la fin ; au plus trois valeurs qui tiennent, puis ellipse ;
- À l’échec : libellé métier conservé sur la carte ; la grille Volumes utilise ✓ pour les cibles À l’échec. Le mode reste identifiable ; le rendu d’unité des lignes mixtes reste à aligner (matrice du13/10).

Le nom n’est pas répété, le mode n’est pas nommé. Aucun texte de pause/récupération dans le corps de la carte. Hors placement, le trait de démarcation reste présent, indépendamment du contenu. Récupération absente/0 : aucune information de récupération ; aucun point : aucune information de point. Pendant le choix des emplacements, le trait est masqué au profit des contrôles de placement . Les valeurs et phases D-208 restent conservées, solidaires de l’occurrence lors des opérations et utilisées dans les calculs. Le réglage de récupération existant sur cette ligne est conservé.

La bilatéralité est indiquée par le miroir dans les variantes concernées ; le paramètre de direction et `Indicator / Sides` ne sont pas supprimés du modèle. Le texte développé « à droite, puis à gauche » reste propre à l’éditeur. La Description est absente des cartes. Texte complet conservé derrière la troncature.

Les commandes contextuelles de Composition font 34 px, dessins 20, gaps 10, cibles 44 sans chevauchement. La bande Durée + actions reste à 32 px : durée immobile, actions à droite et 6 px plus bas. Les états initial, nom saisi, étiquette sélectionnée, modale ouverte, déplacement et actions glissées héritent de cette règle.

### Consultation et modification d’un Exercice

Un appui court sur une carte Exercice ouvre directement son parcours de modification. Un appui long sur la carte de l’occurrence Exercice déclenche sa réorganisation sans ouvrir la modification ; la carte et sa ligne structurelle de Récupération forment le bloc déplacé ; la ligne demeure affichée . Un glissement gauche déplace le bloc avec le geste et révèle progressivement les actions `Dupliquer` et `Supprimer` placées derrière. `Dupliquer` crée un Exercice de Séance indépendant avec un nouvel identifiant, reprend tous les paramètres de la source, y compris Pause et Récupération, la nomme `{nom} (copie)` puis `{nom} (copie 2)`, etc., sans collision, et l’insère immédiatement après la source dans la même zone structurelle. Cette action ne crée aucun Exercice dans le catalogue. `Supprimer` retire le bloc du brouillon ; la suppression n’est persistée qu’avec l’enregistrement final de la Séance et l’abandon restitue la version persistée.

Dans l’état Figma `Composition d’une séance — actions glissées` (`2028:11808`), la carte/bloc suit le geste. L’action `Dupliquer` reprend son rayon DSF et un espace visuel sépare son bord gauche de la portion encore visible de la carte, laissant apparaître le fond du conteneur Circuit. Aucun overlay immobile ne remplace ce mouvement réel.

### Réorganisation

Les Exercices peuvent être réorganisés dans leur zone ou déplacés par glisser-déposer avant le Circuit, dans le Circuit ou après le Circuit. Le geste commence par un appui long sur le bloc complet ; la carte de l’occurrence passe dans l’état soulevé puis suit le glissement ; sa ligne de récupération après exercice reste attachée et visible jusqu’à une position de dépose valide. Un toucher court conserve son comportement d’ouverture de l’Exercice en modification. Le déplacement conserve l’identifiant et tous les paramètres, met à jour la position structurelle et renumérote continûment les positions de chaque zone. Il ne persiste rien avant l’enregistrement final.

L’état Figma `Composition d'une séance — Appui long — carte soulevée` (`3518:4576`) matérialise ce retour visuel. Avec Récupération, le bloc actif passe de `354 × 93` à `362 × 97`, reste centré dans la section (`x = 6`, contre `x = 10` au repos), utilise le fond bleu très clair `#F7F7FF`, un contenu atténué, un contour `1` point `#D1D1D6`, un rayon `12` et une ombre périphérique `#14171F` à `22 %`, décalage `0 / 0`, flou `10`, étalement `2`. L’ombre et le contour entourent l’Exercice et sa Récupération. Les autres cartes et éléments structurels restent inchangés.

La poignée `Icon / Structure / Movable` reste l’indice visuel du caractère déplaçable, mais le geste d’activation porte sur la carte. L’état soulevé est uniquement transitoire : il ne modifie ni l’ordre ni la position structurelle avant la dépose.

Le Circuit reste structurel. Le Compte à rebours initial et la Fin de séance sont explicitement non déplaçables, sans appui long ni poignée de déplacement.

### Validation de la Composition

L’écran ne comporte pas de bouton `Démarrer`.

L’action `Continuer` valide la Composition. Elle reste désactivée tant que le nom n’est pas renseigné ou que la Composition ne contient pas au moins un Exercice valide. L’Étiquette est facultative ; lorsqu’elle est sélectionnée, sa couleur devient celle de la Séance.

En création comme en modification, l’Étiquette de la Séance est gérée depuis la Composition par la modale `Étiquettes`. L’Étiquette sélectionnée est affichée sous le nom de la Séance et porte sa couleur.

La Séance n’est exécutable que si elle contient au moins un Exercice valide.

### Enregistrement

Les modifications internes sont conservées au fur et à mesure, sous réserve des validations explicites prévues par les écrans d’édition.

### Composition — Récupération après exercice — D-208 révisée sur l’affichage

Les cartes ne présentent plus la ligne `Récupération {durée}`, y compris pour une valeur non nulle. La donnée reste solidaire de chaque occurrence lors du déplacement, de la duplication et de la suppression. Son exécution après l’occurrence (y compris fin de Tour/Séance) et les calculs restent ceux de D-208. La disparition de l’affichage ne supprime ni phase ni valeur.

L’éditeur conserve `Récupération entre côtés`, exposée uniquement en D→G/G→D ; aucune récupération post-exercice n’est ajoutée à la synthèse intrinsèque.

### Sélection des exercices — modale

Depuis `Ajouter un exercice`, la frame `3789:5349` ouvre directement la sélection des Exercices du Catalogue au-dessus de la Composition grisée. La liste seule défile. Les boutons fixes sont `Annuler` à gauche et `Ajouter N exercice(s)` à droite.

Les Exercices sont insérés selon leur ordre courant de présentation dans la liste filtrée au moment de la validation, indépendamment de l’ordre des touchers. L’état sélectionné de la sélection multiple utilise le composant DSF dédié ; aucun glyphe texte ne peut le remplacer.

Chaque carte de choix Composition mesure354 × 91, rayon8, titre15, case arrondie20 ; aucun badge durée ni Lecture/Déployer. Cadre des zones corporelles arrêté à8 px de la case, troncature finale par points de suspension . Catégorie/Zones en classement, synthèse et miroir selon bilatéralité. Gouttière permanente64 : photo associée centrée/recadrée, icône de nature sans média/pendant chargement/erreur, texte alternatif nom ; aucune hausse de hauteur. États sélectionné/non sélectionné/inactif suivent la palette #0508E5/#595E66 (iconNeutral/textSecondary ; ancien #5C636E historique)/#C2C4D1, sans remplacer le composant vectoriel par un glyphe. Les règles d’insertion et de validation à0 restent inchangées. Contrat CE-T03-07.

### Étiquettes — sélection et création en modale

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

### Placement et retrait des pauses

Le placement est un état de la Composition, représenté par 7167:13503. Chaque position autorisée propose Récupération et Point d’arrêt côte à côte ; plusieurs ajouts peuvent être confirmés ensemble. Récupération ouvre immédiatement la modale de durée 7173:13521. Le bouton indique « Confirmer N pauses ajoutées » ; Annuler restitue le brouillon antérieur au placement. Les frontières autorisées restent propres à chaque type.

Le retrait utilise une bulle contextuelle : « Retirer la récupération » (7296:13696) ou « Retirer le point d’arrêt » (5301:5443). Toucher hors bulle ferme sans mutation. Il ne s’agit pas de modales de confirmation. Les règles, transactions, états à zéro et critères de recette sont détaillés dans CE-T03-08 et la spécification Pauses et symboles. L’ancien état 4893:6675 est remplacé.

### Confirmation — Abandonner la création d’une séance

#### Objectif

Éviter la perte accidentelle des informations saisies dans la nouvelle `Composer une séance`.

#### Ouverture

La modale s’affiche depuis `Composer une séance` lorsque l’utilisateur appuie sur Retour pendant une création en cours.

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

### Captures courantes — relevé du 12/10/2026

Exports directs des 23 états de Composition retrouvés dans Prototype MVP. Les overlays restent classés avec leur parcours parent. . Les nombres illustrent la mise en page et ne définissent aucun calcul.

### Vues principales et états intégrés

#### Composition séance — Initial

[Source Figma — `8328:28172`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8328-28172)

![Composition séance — Initial](images/circuits-2026-10-12/8328-28172.png)

#### Composition séance — Nom saisi

[Source Figma — `8328:28238`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8328-28238)

![Composition séance — Nom saisi](images/circuits-2026-10-12/8328-28238.png)

#### Composition séance — Standard

[Source Figma — `8328:28605`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8328-28605)

![Composition séance — Standard](images/circuits-2026-10-12/8328-28605.png)

#### Composition séance — Actions glissées

[Source Figma — `8328:28863`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8328-28863)

![Composition séance — Actions glissées](images/circuits-2026-10-12/8328-28863.png)

#### Composition séance — Point d’arrêt

[Source Figma — `8328:29428`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8328-29428)

![Composition séance — Point d’arrêt](images/circuits-2026-10-12/8328-29428.png)

#### Composition séance — Déplacement

[Source Figma — `8328:33546`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8328-33546)

![Composition séance — Déplacement](images/circuits-2026-10-12/8328-33546.png)

#### Composition séance — Étiquette sélectionnée

[Source Figma — `8328:34377`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8328-34377)

![Composition séance — Étiquette sélectionnée](images/circuits-2026-10-12/8328-34377.png)

#### Composition séance — Standard — Séries variables

[Source Figma — `8328:34520`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8328-34520)

![Composition séance — Standard — Séries variables](images/circuits-2026-10-12/8328-34520.png)

#### Modification d'une séance

[Source Figma — `5271:5455`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=5271-5455)

![Modification d'une séance](images/figma-5271-5455.png)

### Placement, réglage et retrait des pauses

#### Composition séance — Placement d’une pause

[Source Figma — `8328:29270`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8328-29270)

![Composition séance — Placement d’une pause](images/circuits-2026-10-12/8328-29270.png)

#### Composition séance — Récupération (modale)

[Source Figma — `8328:28733`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8328-28733)

![Composition séance — Récupération (modale)](images/circuits-2026-10-12/8328-28733.png)

#### Composition séance — Retirer une récupération

[Source Figma — `8328:29133`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8328-29133)

![Composition séance — Retirer une récupération](images/circuits-2026-10-12/8328-29133.png)

#### Composition séance — Retirer un point d’arrêt

[Source Figma — `8328:33689`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8328-33689)

![Composition séance — Retirer un point d’arrêt](images/circuits-2026-10-12/8328-33689.png)

### Sélections, paramètres et confirmations de Composition

#### Composition séance — Compte à rebours

[Source Figma — `8328:28304`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8328-28304)

![Composition séance — Compte à rebours](images/circuits-2026-10-12/8328-28304.png)

#### Composition séance — Abandon (confirmation)

[Source Figma — `8328:28377`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8328-28377)

![Composition séance — Abandon (confirmation)](images/circuits-2026-10-12/8328-28377.png)

#### Composition séance — Sélection exercices

[Source Figma — `8328:28445`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8328-28445)

![Composition séance — Sélection exercices](images/circuits-2026-10-12/8328-28445.png)

#### Composition séance — Fin de séance

[Source Figma — `8328:28998`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8328-28998)

![Composition séance — Fin de séance](images/circuits-2026-10-12/8328-28998.png)

#### Composition séance — Étiquettes

[Source Figma — `8328:33836`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8328-33836)

![Composition séance — Étiquettes](images/circuits-2026-10-12/8328-33836.png)

#### Composition séance — Étiquettes — Appui long — Confirmation suppression

[Source Figma — `8328:34006`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8328-34006)

![Composition séance — Étiquettes — Appui long — Confirmation suppression](images/circuits-2026-10-12/8328-34006.png)

#### Composition séance — Nouvelle étiquette

[Source Figma — `8328:34107`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8328-34107)

![Composition séance — Nouvelle étiquette](images/circuits-2026-10-12/8328-34107.png)

### Circuit — popover, confirmation et volumes

CE-CIR-01/02/03. La confirmation est conditionnée à la perte de valeurs, pas à tout changement de nature. Les deux grilles illustrent des volumes planifiés, pas des résultats. Écarts de preuve : case absente encore vide au lieu du tiret ; direction de côté absente de la grille. Échec ✓, débordement et colonnes fixes restent des exigences sans capture dédiée.

#### Composition séance — Circuit — Nature (popover)

[Source Figma — `8328:34662`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8328-34662)

![Composition séance — Circuit — Nature (popover)](images/circuits-2026-10-12/8328-34662.png)

#### Composition séance — Circuit — Nature (confirmation générique)

[Source Figma — `8328:34813`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8328-34813)

![Composition séance — Circuit — Nature (confirmation générique)](images/circuits-2026-10-12/8328-34813.png)

#### Composition séance — Circuit — Volumes (de séries)

[Source Figma — `8328:34965`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8328-34965)

![Composition séance — Circuit — Volumes (de séries)](images/circuits-2026-10-12/8328-34965.png)

#### Composition séance — Circuit — Volumes (de tours)

[Source Figma — `8328:35135`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8328-35135)

![Composition séance — Circuit — Volumes (de tours)](images/circuits-2026-10-12/8328-35135.png)

## Créer ou modifier un exercice

Références courantes du12/10, complétées le13/10 :32 captures du parcours de création et de ses états de Modalités d’exécution, issues de Prototype MVP. Contrats CE-T03-04, CE-UI-09 et CE-UI-10. Les anciens relevés du 03/10 et du 06/10 restent historiques pour les états remplacés ; .

### Parcours, données et validation

Créer depuis Catalogue ouvre le formulaire ; Modifier reprend les données existantes. Nom, une Catégorie et au moins une Zone sont requis pour un nouvel Exercice. Carte Paramètres → feuille transactionnelle ; ✕/retour annule son brouillon, ✓ applique au parent ; Terminer seul persiste. Abandon du formulaire modifié ouvre la confirmation existante. Ouvrir un référentiel conserve les paramètres, même variables.

Spécification [v13](08%20%E2%80%93%20Conception%20fonctionnelle%20d%C3%A9taill%C3%A9e.md#parametres-exercice) : mode unique, N séries par côté, cibles/Pauses propres à chaque ligne en variable, direction et Ordre des côtés indépendants. N=1 effectif uniforme/Un côté après l’autre ; restauration temporaire avant✓. Déplacement cible/Pause conjoint ; nouvelle première reprise à désactivation, nouvelle dernière Pause stockée et exécutée, sauf substitution par récupération positive. Total variable readonly et — si incomplet ; Répétitions : ≈ avec cadence, omission sans bip à l’Exercice ; À l’échec aucun total.

### Placement et contrôles

Formulaire : conserver les shells et l’ordre visible dans les captures. Toute la zone de phrase ouvre la feuille. Feuille : en-tête fixe ✕ / Modalités d’exécution / ✓ ; corps défilant Mode → Séries (régime, chevron indépendant, nombre) → cible/Pause uniformes ou tableau variable → Changement de côté et Ordre/PC si applicables → Bip de cadence → Total applicable → Compte à rebours → Fin.

Le tableau variable comporte poignée, numéro, cellules cible/Pause et retrait ; une seule cellule active et un pied de réglage commun. Le régime identiques/variables, le mode et les choix de côtés utilisent les popovers représentés. Les roulettes Durée et Total restent des états intégrés. [DSF courant et mesures](../DSF-CIRCUITS-CONTROLES-2026-10-12.md). Les règles et bornes restent celles de v13 et de la spécification Circuits. Sous nombre hérité, nombre et total affichable sont en lecture seule ; aucun écran dédié identifié ne fixe encore l’emplacement de la mention discrète.

### Formulaire — vues principales et résumé

#### Création exercice — Avant Paramètres d'exécution

[Source Figma — `8328:36711`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8328-36711)

![Création exercice — Avant Paramètres d'exécution](images/circuits-2026-10-12/8328-36711.png)

#### Création exercice — Paramètres — Champ vide

[Source Figma — `8328:36853`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8328-36853)

![Création exercice — Paramètres — Champ vide](images/circuits-2026-10-12/8328-36853.png)

#### Création exercice — Paramètres — Résumé affiché

[Source Figma — `8328:37022`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8328-37022)

![Création exercice — Paramètres — Résumé affiché](images/circuits-2026-10-12/8328-37022.png)

#### Ajouter un exercice — Initial

[Source Figma — `8328:35698`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8328-35698)

![Ajouter un exercice — Initial](images/circuits-2026-10-12/8328-35698.png)

#### Ajouter un exercice — Nom Description Media

[Source Figma — `8328:35740`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8328-35740)

![Ajouter un exercice — Nom Description Media](images/circuits-2026-10-12/8328-35740.png)

#### Ajouter un exercice — Catégorie renseignée

[Source Figma — `8328:36278`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8328-36278)

![Ajouter un exercice — Catégorie renseignée](images/circuits-2026-10-12/8328-36278.png)

#### Modifier un exercice

[Source Figma — `4734:6342`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4734-6342)

![Modifier un exercice](images/figma-4734-6342.png)

### Feuille Modalités d’exécution — états intégrés

Ces 19 frames sont des états de CE-UI-10, pas 19 pages applicatives. Quatre références ont été recapturées et le cas mixte ajouté selon la matrice du13/10.

#### Création exercice — Paramètres (modale) — Champs vides

[Source Figma — `8328:36923`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8328-36923)

![Création exercice — Paramètres (modale) — Champs vides](images/circuits-2026-10-12/8328-36923.png)

#### Création exercice — Paramètres (modale) — Mode d’exécution (popover)

[Source Figma — `8328:37092`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8328-37092)

![Création exercice — Paramètres (modale) — Mode d’exécution (popover)](images/echec-2026-10-13/8328-37092.png)

#### Création exercice — Paramètres (modale) — Série en durée

[Source Figma — `8328:37760`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8328-37760)

![Création exercice — Paramètres (modale) — Série en durée](images/circuits-2026-10-12/8328-37760.png)

#### Création exercice — Paramètres (modale) — Durée d’une série (roulette)

[Source Figma — `8328:37862`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8328-37862)

![Création exercice — Paramètres (modale) — Durée d’une série (roulette)](images/echec-2026-10-13/8328-37862.png)

#### Création exercice — Paramètres (modale) — Changement de côté (popover)

[Source Figma — `8328:37972`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8328-37972)

![Création exercice — Paramètres (modale) — Changement de côté (popover)](images/circuits-2026-10-12/8328-37972.png)

#### Création exercice — Paramètres (modale) — Durée totale (roulette)

[Source Figma — `8328:38084`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8328-38084)

![Création exercice — Paramètres (modale) — Durée totale (roulette)](images/circuits-2026-10-12/8328-38084.png)

#### Création exercice — Paramètres (modale) — Un côté après l’autre

[Source Figma — `8328:38193`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8328-38193)

![Création exercice — Paramètres (modale) — Un côté après l’autre](images/circuits-2026-10-12/8328-38193.png)

#### Création exercice — Paramètres (modale) — Les deux côtés à chaque série

[Source Figma — `8328:38301`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8328-38301)

![Création exercice — Paramètres (modale) — Les deux côtés à chaque série](images/circuits-2026-10-12/8328-38301.png)

#### Création exercice — Paramètres (modale) — Durée totale ajustée (message)

[Source Figma — `8328:38409`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8328-38409)

![Création exercice — Paramètres (modale) — Durée totale ajustée (message)](images/circuits-2026-10-12/8328-38409.png)

#### Création exercice — Paramètres (modale) — Mode d’exécution (popover) — séries variables

[Source Figma — `8328:38513`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8328-38513)

![Création exercice — Paramètres (modale) — Mode d’exécution (popover) — séries variables](images/echec-2026-10-13/8328-38513.png)

#### Création exercice — Paramètres (modale) — Séries variables en durée

[Source Figma — `8328:38632`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8328-38632)

![Création exercice — Paramètres (modale) — Séries variables en durée](images/circuits-2026-10-12/8328-38632.png)

#### Création exercice — Paramètres (modale) — Séries variables en répétitions

[Source Figma — `8328:38741`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8328-38741)

![Création exercice — Paramètres (modale) — Séries variables en répétitions](images/circuits-2026-10-12/8328-38741.png)

#### Création exercice — Paramètres (modale) — Séries variables à l’échec

[Source Figma — `8328:38848`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8328-38848)

![Création exercice — Paramètres (modale) — Séries variables à l’échec](images/echec-2026-10-13/8328-38848.png)

Cette capture reflète le layout actuel. Le texte de fond énumérant les pauses variables reste un écart rédactionnel avec Phrase v1 ; voir la matrice Deux modes.

#### Modalités d’exécution — Séries variables, cas mixte

[Source Figma — `8470:13303`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8470-13303)

![Modalités d’exécution — Séries variables, cas mixte](images/echec-2026-10-13/8470-13303.png)

État de CE-UI-10 : mode Durée, cibles30s/45s/échec, pauses10s/20s/30s et total partiel ≥2min15, non modifiable. La cible échec conserve sa colonne ; le mode n’est pas « À l’échec ». [DSF et anatomie du sélecteur](../DSF-DEUX-MODES-ECHEC-2026-10-13.md) ; .

#### Création exercice — Paramètres (modale) — Ordre des côtés (popover)

[Source Figma — `8328:38953`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8328-38953)

![Création exercice — Paramètres (modale) — Ordre des côtés (popover)](images/circuits-2026-10-12/8328-38953.png)

#### Création exercice — Paramètres (modale) — Une seule série

[Source Figma — `8328:39072`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8328-39072)

![Création exercice — Paramètres (modale) — Une seule série](images/circuits-2026-10-12/8328-39072.png)

#### Création exercice — Paramètres (modale) — Séries variables (tableau replié)

[Source Figma — `8328:39181`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8328-39181)

![Création exercice — Paramètres (modale) — Séries variables (tableau replié)](images/circuits-2026-10-12/8328-39181.png)

#### Création exercice — Paramètres (modale) — Séries variables (déplacement)

[Source Figma — `8328:39279`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8328-39279)

![Création exercice — Paramètres (modale) — Séries variables (déplacement)](images/circuits-2026-10-12/8328-39279.png)

#### Création exercice — Paramètres (modale) — Mode des séries (popover)

[Source Figma — `8328:39390`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8328-39390)

![Création exercice — Paramètres (modale) — Mode des séries (popover)](images/circuits-2026-10-12/8328-39390.png)

### Sélections, créations de référentiels et confirmation d’abandon

Catégorie marquée au toucher puis confirmée par ✓ ; ✕ conserve la Catégorie précédente (D-343, 12/10, remplace pour la Catégorie la validation au toucher de D-222) ; Zones multiples avec✓. Création avec clavier et suppression avec confirmation préservent le brouillon d’Exercice. Abandon Annuler conserve le formulaire ; Confirmer le quitte sans sauvegarder.

#### Ajouter un exercice — Catégories

[Source Figma — `8328:35810`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8328-35810)

![Ajouter un exercice — Catégories](images/circuits-2026-10-12/8328-35810.png)

#### Ajouter un exercice — Catégorie — Appui long — Confirmation suppression

[Source Figma — `8328:35932`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8328-35932)

![Ajouter un exercice — Catégorie — Appui long — Confirmation suppression](images/circuits-2026-10-12/8328-35932.png)

#### Ajouter un exercice — Nouvelle catégorie

[Source Figma — `8328:36056`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8328-36056)

![Ajouter un exercice — Nouvelle catégorie](images/circuits-2026-10-12/8328-36056.png)

#### Ajouter un exercice — Zones corporelles

[Source Figma — `8328:36348`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8328-36348)

![Ajouter un exercice — Zones corporelles](images/circuits-2026-10-12/8328-36348.png)

#### Ajouter un exercice — Zones corporelles — Appui long — Confirmation suppression

[Source Figma — `8328:36441`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8328-36441)

![Ajouter un exercice — Zones corporelles — Appui long — Confirmation suppression](images/circuits-2026-10-12/8328-36441.png)

#### Ajouter un exercice — Nouvelle zone corporelle

[Source Figma — `8328:36536`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8328-36536)

![Ajouter un exercice — Nouvelle zone corporelle](images/circuits-2026-10-12/8328-36536.png)

#### Création exercice — Abandon (confirmation)

[Source Figma — `8328:36781`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8328-36781)

![Création exercice — Abandon (confirmation)](images/circuits-2026-10-12/8328-36781.png)

### Couverture et limites

Les états hérités (N et total non modifiables), validation incomplète, douze séries avec défilement, phrase longue et plusieurs résumés spécialisés ne disposent pas d’une nouvelle frame identifiée dans ce relevé. Leurs règles restent requises. Les anciennes captures ne sont pas présentées comme des preuves actuelles de ces états. Les captures de Modifier un exercice `4734:6342` et de Modification d’une séance `5271:5455` sont intégrées ci-dessus dans leur famille d’écran respective ; leurs contrats restent applicables.

Le corpus de phrases et les spécifications déterminent les textes dynamiques, le gras et les calculs ; les valeurs derrière les voiles ne sont pas des recettes. Les captures sont des exports sans retouche.

## Calendrier

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

### Cartes et commandes — vues Jour, Semaine et Mois

| Vue / état | Présentation et règle locale | Contrat |
|---|---|---|
| Jour : initial, appui long, après planification, créneau, jour suivant | Carte à x=80 ; séance 298 × 46, exercice 298 × 48 ; hauteur ajustable selon événement ; barre couleur de l’événement 4 ; nature26 ; titre13 gras ; heure/durée11 (`08 h · 13 min`) ; Lecture26 ; aucun Déployer | CE-UI-02 |
| Semaine : liste, mardi sélectionné, suppression et actions glissées | Carte354 × 95,5, sans barre ; nature26 liste/tai-chi ; badge heure `08:00` ; classement catégorie puis étiquette (séance) ou zones (exercice) ; durée et sablier sur ligne des valeurs | CE-UI-03 |
| Semaine : séance déployée | Hauteur de référence254,5 ; détail des exercices et ligne de récurrence avec calendrier ; badge heure et durée conservés | CE-UI-03 |
| Choisir séance/exercice depuis Calendrier | Cartes de choix à cases à cocher, sans durée ni Déployer/Lecture ; état courant CE-UI-04 et matrice du 08/10 | CE-UI-04 |
| Mois et état vide | Conserver leur structure fonctionnelle ; appliquer segmenté/navigation communs ; ne pas ajouter une carte Jour à une cellule Mois | CE-UI-03 |

Les séances restent sans photo. En Semaine comme en Jour, les cartes d’Exercice restent sans photo et conservent leur icône de nature, même si un média est associé . Les deux modales de suppression conservent les cartes Semaine actualisées en arrière-plan.

Le segmenté Jour/Semaine/Mois mesure354 sur référence402 : padding4, gaps4, options112,67. Aujourd’hui et Planifier restent à32 sans cible44 ajoutée : exception acceptée, à revoir et développer après T04. La navigation utilise les quatre nouveaux dessins DSF. Ces règles ne déplacent pas les jalons fonctionnels existants.

### Comportement

En vue Jour, toucher une carte ouvre sa planification ; aucune action glissée n’est proposée. En vue Semaine, toucher la zone principale d’une occurrence ouvre la modification de sa Routine dans l’écran de planification prérempli. La carte possède également une zone distincte pour la déployer ou la replier, une zone `Démarrer`, et révèle uniquement `Dupliquer` et `Supprimer` par glissement gauche. `Dupliquer` identifie la Routine source à partir de l’occurrence, crée un brouillon reprenant la liste ordonnée des contenus, leurs motifs et tous ses paramètres de planification, puis ouvre ce brouillon en modification. Aucune nouvelle Routine n’est persistée avant validation explicite de l’utilisateur.

L’état obtenu par glissement ne remplace pas la liste : il décale la carte concernée pour révéler ses actions. Les autres jours et occurrences restent rendus à leur position chronologique.

En vue Semaine, la liste est organisée chronologiquement en sections journalières. Lorsque le défilement place un nouveau jour en tête de la liste, le curseur coloré de la barre de semaine sélectionne ce jour. Inversement, sélectionner un jour dans la barre positionne sa section comme première section visible de la liste.

La barre de semaine occupe toute la largeur utile. Les sept jours forment sept colonnes flexibles de même largeur ; aucune largeur de cellule ni position horizontale issue du gabarit `402` n’est conservée en dur. Les espacements s’adaptent afin que les sept jours restent entièrement visibles dès `360` points et utilisent l’espace supplémentaire sur un grand téléphone. La grille de la vue Mois applique la même répartition en sept colonnes égales.

`+ Planifier` ouvre le bottom sheet `Choisir une séance`. La liste y défile si nécessaire ; toucher une Séance valide le choix et ferme la modale sans CTA bas .

Lorsqu’une occurrence future est exécutée en avance, elle est considérée exécutée pour cette occurrence et n’est plus proposée à son horaire initial.

Lorsqu’une occurrence planifiée arrive à échéance sans avoir été exécutée, elle disparaît de l’interface. Elle n’est pas affichée dans le Suivi du MVP.

La suppression ou modification d’une Routine agit sur les occurrences futures conformément aux règles de planification.

### Confirmation — Suppression d’une planification

Pour une planification unique, `Supprimer` ouvre un dialogue centré comportant `Annuler` et `Confirmer`. Après confirmation, la planification est supprimée ; la source associée et les Exécutions historiques sont conservées.

Pour une planification périodique, le dialogue à trois choix présente sur sa première ligne les deux actions destructives `Seulement cette occurrence` et `Toutes les occurrences à venir`, puis `Annuler` en pleine largeur sur une seconde ligne. Les deux choix peuvent mener au même écran de résultat dans le prototype ; la vue Semaine montre ensuite l’occurrence retirée. Les Exécutions historiques restent conservées.

### Vues principales et états intégrés

#### Calendrier — Semaine

[Source Figma — `1992:5101`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-5101)

![Calendrier — Semaine](images/ecran-7a-calendrier-semaine.png)

#### Calendrier — Mois

[Source Figma — `1992:5237`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-5237)

![Calendrier — Mois](images/ecran-7b-calendrier-mois.png)

#### Calendrier — Jour — MVP

[Source Figma — `1992:5510`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-5510)

![Calendrier — Jour — MVP](images/ecran-7-calendrier-jour.png)

#### Calendrier — Jour — Appui long — MVP

[Source Figma — `1992:5602`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-5602)

![Calendrier — Jour — Appui long — MVP](images/ecran-7c-calendrier-jour-appui-long.png)

Sélection d’une plage horaire avant planification

#### Calendrier — Jour — MAJ — MVP

[Source Figma — `1992:5697`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-5697)

![Calendrier — Jour — MAJ — MVP](images/ecran-7f-calendrier-jour-apres-planification.png)

Résultat attendu après enregistrement

#### Calendrier — Jour — Créneau à planifier — MVP

[Source Figma — `1992:5794`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-5794)

![Calendrier — Jour — Créneau à planifier — MVP](images/ecran-7e-calendrier-creneau-a-planifier.png)

Étape intermédiaire issue de la plage sélectionnée

#### Calendrier — Semaine — Actions glissées

[Source Figma — `1992:5962`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-5962)

![Calendrier — Semaine — Actions glissées](images/ecran-7j-calendrier-semaine-actions.png)

`Dupliquer` et `Supprimer` sur une occurrence hebdomadaire

#### Calendrier — Semaine — Séance déployée

[Source Figma — `1992:6389`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-6389)

![Calendrier — Semaine — Séance déployée](images/ecran-7i-calendrier-semaine-deployee.png)

Détail d’une occurrence et zone `Démarrer`

#### Calendrier — Jour suivant — Glissement gauche — MVP

[Source Figma — `2059:267`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=2059-267)

![Calendrier — Jour suivant — Glissement gauche — MVP](images/ecran-7g-calendrier-jour-suivant.png)

Résultat d’un glissement gauche ou du chevron suivant

#### Calendrier — Semaine — Après suppression d’une planification

[Source Figma — `2074:86`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=2074-86)

![Calendrier — Semaine — Après suppression d’une planification](images/ecran-7l-calendrier-apres-suppression.png)

Liste hebdomadaire actualisée après suppression

#### Calendrier — Semaine — Étirements — Actions glissées

[Source Figma — `2094:86`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=2094-86)

![Calendrier — Semaine — Étirements — Actions glissées](images/ecran-7k-calendrier-etirements-actions.png)

Même interaction appliquée à une autre occurrence représentée

#### Calendrier — Jour — État vide

[Source Figma — `2128:86`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=2128-86)

![Calendrier — Jour — État vide](images/ecran-7m-calendrier-vide.png)

État sans occurrence planifiée

#### Calendrier — Semaine — Mardi sélectionné

[Source Figma — `2252:86`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=2252-86)

![Calendrier — Semaine — Mardi sélectionné](images/ecran-7h-calendrier-semaine-mardi.png)

Mardi placé en tête ; lundi se trouve au-dessus et n’est plus visible

### Modales, panneaux et confirmations

#### Modal — Supprimer une planification unique — Calendrier

[Source Figma — `1992:5365`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-5365)

![Modal — Supprimer une planification unique — Calendrier](images/modale-4-suppression-planification-unique.png)

#### Modal — Supprimer des occurrences — Calendrier

[Source Figma — `1992:6102`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-6102)

![Modal — Supprimer des occurrences — Calendrier](images/modale-4a-suppression-occurrences.png)

## Planifier une séance, un exercice ou plusieurs contenus

Le parcours commence depuis Calendrier ou Planifier sur une carte. Les choix utilisent la même modale à cases et CTA « Ajouter 1 élément » / « Ajouter n éléments » (CE-UI-04). Le formulaire CE-UI-05 organise Programme facultatif puis Début, Répétition, contenus si N ≥ 2 sans titre, Rappel ; récapitulatif protégé au-dessus d’Enregistrer. Le mot parcours ne crée pas un objet autonome. La fréquence d’un contenu relève de CE-UI-11.

Règles métier, validations et points ouverts : [spécification du 08/10](08%20%E2%80%93%20Conception%20fonctionnelle%20d%C3%A9taill%C3%A9e.md#planification). Règles générales de mise en page : [DSF commun](../DSF-INTERFACE-GENERALE-2026-10-08.md). Les titres et compteurs dépendent des données ; les exemples Figma ne déterminent aucun calcul. Programme PROG2/3 restent en construction hors MVP.

### États de référence actuels

Captures du 08/10 sauf réserve explicite dans la matrice. Le retrait de « Éléments planifiés » a été réalisé à la demande du propriétaire. Après correction de Claude confirmée terminée, Planifier un parcours et Fréquence ont été relus et leurs captures reprises.

#### Planifier une séance — Création

Frame `1992:6838` ; [Figma](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-6838).

![Planifier une séance — Création](images/figma-1992-6838.png)

#### Modal — Planifier une séance — Sélectionner une séance

Frame `7599:14197` ; [Figma](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=7599-14197).

![Modal — Planifier une séance — Sélectionner une séance](images/figma-7599-14197.png)

Les deux captures « Liste longue » ci-dessous ont été exportées le 15/10/2026. Elles illustrent la présentation des listes, mais montrent encore une sélection unique sans CTA « Ajouter ». Elles ne remplacent pas le contrat CE-UI-04 : sélection à cases et CTA « Ajouter 1 élément » / « Ajouter n éléments ».

#### Modal — Choisir une séance — Planification — Liste longue

[Source Figma — `1992:6249`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-6249)

![Modal — Choisir une séance — Planification — Liste longue](images/figma-1992-6249.png)

#### Modal — Choisir un exercice — Planification — Liste longue

[Source Figma — `5451:4272`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=5451-4272)

![Modal — Choisir un exercice — Planification — Liste longue](images/figma-5451-4272.png)

#### Planifier une séance — Sélecteur de date ouvert

Frame `1992:6622` ; [Figma](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-6622).

![Planifier une séance — Sélecteur de date ouvert](images/figma-1992-6622.png)

#### Planifier une séance — Rappel personnalisé ouvert

Frame `1992:7187` ; [Figma](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-7187).

![Planifier une séance — Rappel personnalisé ouvert](images/figma-1992-7187.png)

#### Planifier une séance — Stepper du nombre de semaines

Frame `1992:7537` ; [Figma](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-7537).

![Planifier une séance — Stepper du nombre de semaines](images/figma-1992-7537.png)

#### Planifier une séance — Rappel personnalisé sélectionné

Frame `1992:7369` ; [Figma](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-7369).

![Planifier une séance — Rappel personnalisé sélectionné](images/figma-1992-7369.png)

#### Planifier une séance — Sans répétition

Frame `1992:7716` ; [Figma](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-7716).

![Planifier une séance — Sans répétition](images/figma-1992-7716.png)

#### Modal — Planifier un parcours — Sélectionner plusieurs séances

Frame `7594:34809` ; [Figma](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=7594-34809).

![Modal — Planifier un parcours — Sélectionner plusieurs séances](images/figma-7594-34809.png)

#### Planifier un parcours

Frame `7594:34531` ; [Figma](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=7594-34531).

![Planifier un parcours](images/figma-7594-34531.png)

#### Modal — Planifier un parcours — Fréquence

Frame `7594:34653` ; [Figma](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=7594-34653).

![Modal — Planifier un parcours — Fréquence](images/figma-7594-34653.png)

## Exécution — séance ou exercice

### Écarts de terminologie constatés

Le vocabulaire d’interface attendu est **Exercice** (glossaire : anciennement Activité). Les captures Figma sont conservées sans retouche : les confirmations `1992:8224` et `1992:8326`, ainsi que certains contrôles de sélection, affichent encore « activité ». Leur rendu n’est donc pas une preuve de conformité terminologique. Les identifiants techniques `ActivityDefinition`, `SessionActivity` et `ACTIVITY` ne sont pas renommés.

**Circuit et Tour — D-209** : le Circuit est le conteneur ordonné d’exercices ; un Tour est une exécution de ce Circuit. Le nombre de Tours règle ses répétitions. Le mot parcours ne désigne plus un objet autonome . Les 17 occurrences du libellé de Composition ont été corrigées en « Circuit » le 05/10/2026 (journal, §8). Les anciens états archivés restent historiques ; le libellé parcours suit désormais D-328.

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
- le compteur de Série lorsque l’élément exécuté est un Exercice ;
- l’indicateur temporel principal ;
- la Série sous l’indicateur principal, à gauche, et le Tour à droite. À partir de `360` points et avec le texte à `100 %` ou `135 %`, les deux valeurs restent sur une même ligne dans deux zones flexibles symétriques, séparées par un repère central de largeur fixe ;
- une progression discrète du Tour ;
- la zone `À suivre` avec le nom et la durée ou le nombre de reps de l’Exercice suivant ;
- les commandes `Réinitialiser`, `Pause` et `Exercice suivant` ;
- le temps total écoulé et la durée estimée d’exécution de la Séance ; le temps écoulé inclut toutes les phases effectivement exécutées, Compte à rebours initial et Fin de séance compris, mais exclut les Pauses manuelles ; durée exacte sans symbole en mode Durée, estimée ≈ avec cadence et borne omission sans bip à l’Exercice ou en présence de composante inconnue ;
- une barre de progression globale structurée en segments correspondant aux Tours, conformément au prototype Figma. Elle occupe exactement la largeur utile sans débordement. Les segments se répartissent dans cette largeur après déduction des espacements et ne conservent jamais la largeur fixe du gabarit `402`. Le remplissage représente l’avancement dans le Plan d’Exécution complet, Compte à rebours initial et `SESSION_END` compris, selon la pondération définie dans les chapitres 08 et 10 ; il n’est pas le simple rapport `temps écoulé / durée estimée d’exécution`. Il atteint `100 %` uniquement à l’achèvement de `SESSION_END`. Dans T04, les étapes chronométrées sont pondérées par leur durée planifiée ; les Séries Répétitions sans cadence et À l’échec acquièrent leur part avec `Suivant`. Les Séries Répétitions avec bip suivent une progression temporelle continue, plafonnée à la fin nominale sans terminer la Série ; `Suivant` acquiert le reste éventuel. La Pause abandonne la fraction d’intervalle pour la progression et la reprise lance un intervalle complet, sans effacer le temps actif réel. Les Pauses manuelles n’augmentent pas le remplissage.

Le Cycle n’est jamais affiché. Le nombre total d’étapes et la position sous la forme `x sur y` ne sont pas affichés dans le MVP.

Le moteur d’Exécution peut néanmoins conserver ces informations pour son fonctionnement interne.

### Exercice défini par une durée

Pour un Exercice en mode Durée ou une phase de Récupération, le temps est présenté sous forme de compte à rebours.

Lorsque le compte à rebours atteint zéro, l’Exercice se termine normalement et l’Exécution passe à la suite.

Si l’utilisateur appuie sur `Exercice suivant` avant zéro, une confirmation est demandée. Après confirmation, l’Exercice est enregistré avec le statut métier `Partielle` et l’Exécution continue.

### Exercice défini par un nombre de répétitions

Pour un Exercice défini par un nombre de répétitions, l’écran conserve le même layout que pour un Exercice chronométré.

Le temps actif est affiché par un chronomètre croissant à partir de00:00. Sans cadence, aucune durée prescrite ; avec cadence, Ri×Ci définit une fin nominale, sans fin automatique de Série.

Sans cadence, le cercle du minuteur effectue une rotation complète par minute :

- une rotation complète représente 60 secondes ;
- à `01:00`, il recommence une nouvelle rotation ;
- le chronomètre continue à croître (`01:01`, `01:02`, etc.).

Bip positif : signal périodique dans les deux modes pendant Série, y compris après le nominal Répétitions ; aucun dernier signal nominal distinct ni bip minute superposé. Bip0 : règles antérieures de signal minute conservées pour les modes concernés. Fin Durée chiffrée au minuteur ; Répétitions et toute cible À l’échec manuelles. Même shell, pas de nouvel écran.

`Pause` suspend le chronomètre et la rotation du cercle. `Reprendre` les relance depuis l’état exact où ils ont été suspendus.

L’utilisateur termine normalement chaque Série avec `Suivant`. Cette action ne crée pas un Exercice au statut Partielle : elle valide la fin normale de la Série en mode Répétitions ou À l’échec.

### Séries

Lorsqu’un Exercice possède plusieurs Séries :

- `Série x/y` indique la Série en cours ;
- chaque Série exécute la durée cible, les répétitions cibles ou se poursuit jusqu’à l’échec selon le mode ;
- Pi est stockée et exécutée après chaque Série, dernière comprise. À la frontière des côtés successifs, PN puis PC se cumulent. Par paire, Pi suit chaque paire, dernière comprise, et PC reste dans chaque paire. Seule la toute dernière Pause est remplacée par la récupération positive qui suit l’occurrence ; aucune récupération en direct. N=1 normalisé uniforme/par côté. Formules et séquences : chapitre 10, Calculs des durées et ordre des phases.
- si l’Exercice est bilatéral, la Pause entre les côtés éventuelle est exécutée selon l’Ordre des côtés.

T04 développe toutes les Séries, les répétitions de Tour et les passages de côté dans le Plan d’Exécution avant le démarrage.

### Récupérations

Deux phases distinctes peuvent exister. `SIDE_RECOVERY` matérialise la Pause entre les côtés d’un Exercice bilatéral et intervient entre le premier et le second côté. `POST_ACTIVITY_RECOVERY` matérialise la Récupération après exercice portée par l’occurrence de Séance ; elle intervient après l’occurrence, y compris après le dernier Exercice avant `SESSION_END` et après chaque passage dans le Circuit à chaque Tour.

La valeur `postActivityRecoverySeconds = 0` ne crée pas de phase chronométrée positive. Les récupérations ne sont plus affichées sur les cartes de Composition , quelle que soit leur valeur. La zone `À suivre` prépare l’élément qui succède à la phase courante. Les données de résultat distinguent la Pause entre les côtés de la récupération après occurrence.

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
- la position dans la séance et la répétition en cours restent inchangées.

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
- **Exercice chronométré avant zéro** : ouvre la modale de confirmation ; après confirmation, l’Exercice est enregistré avec le statut `Partielle`, puis l’Exécution continue ;
- **Phase de récupération avant zéro** : ouvre la même confirmation ; après confirmation, la durée partielle de la phase courante (`SIDE_RECOVERY` ou `POST_ACTIVITY_RECOVERY`) est conservée et le Plan poursuit vers son étape suivante ;
- **Exercice chronométré arrivé à zéro** : la transition est automatique.

### Navigation pendant l’Exécution

L’ordre d’Exécution est déterminé par le Plan d’Exécution.

L’utilisateur ne peut pas sélectionner librement un autre Exercice ni revenir à un Exercice déjà terminé.

### Guidage sonore

Dans T04, Sons et Annonces vocales sont activés par défaut au début de chaque Exécution. Leur état peut être changé pendant l’Exécution, mais cette tranche ne lit ni n’enregistre encore de préférence utilisateur correspondante ; leur configuration depuis le Profil appartient à une tranche ultérieure.

Au début d’un Exercice, son nom peut être annoncé vocalement lorsque les Annonces vocales sont actives. Au début d’une phase de récupération chronométrée (`SIDE_RECOVERY` ou `POST_ACTIVITY_RECOVERY`), l’annonce est `Récupération`.

Pour les Exercices chronométrés, les signaux sonores de fin de compte à rebours sont appliqués conformément aux règles métier définies pour le MVP.

Répétitions sans bip/À l’échec sans bip : aucun signal de fin de compte à rebours, bip minute. À l’échec avec bip : périodique sans bip minute superposé. Répétitions cadencées : signal périodique maintenu après nominal sans signal final distinct, sans transition automatique ni bip minute ; chronomètre toujours croissant.

### Arrière-plan et verrouillage

Si l’application passe en arrière-plan ou si l’écran se verrouille :

- le Plan d’Exécution continue selon ses horodatages de référence ;
- l’Exercice chronométré ne se fige pas ;
- au retour, l’application reconstitue l’Exercice et la position temporelle qui auraient dû être atteintes, plutôt que de reprendre le compteur à l’endroit où l’interface a été suspendue ;
- les sons et annonces sont maintenus dans la mesure permise par iOS et Android.

Une mise en pause de sécurité est appliquée en cas d’inexercice prolongée :

- pour un Exercice chronométré, si aucune interaction n’a eu lieu 30 minutes après sa fin théorique ;
- pour une Série Répétitions cadencée,30min après la fin nominale recalculée sans interaction ;
- pour un Exercice en Répétitions sans cadence ou À l’échec,2h sans interaction depuis son démarrage.

Le comportement précis fait l’objet du spike technique prévu avant le développement complet du moteur d’Exécution.

### Fin de l’Exécution

Lorsque le Plan d’Exécution arrive à son terme, l’Exécution est enregistrée et l’écran `Synthèse de séance` est affiché.

La Séance source et la Routine éventuelle ne sont jamais modifiées par l’Exécution.

### Exercice lancé directement depuis le catalogue

L’Exécution directe conserve une préparation système fixe de `5 s`. Cette durée n’est pas un attribut de l’Exercice. Les anciennes captures dédiées sont retirées de ce parcours ; les variantes actuelles sont présentées ci-dessous.

L’écran réutilise le moteur et le Shell d’Exécution. Il développe Séries, Pauses, côtés et Récupération, sans structure de Séance artificielle ni phase `SESSION_END`. Après la dernière phase, un signal ouvre immédiatement la Synthèse.

### Confirmation — Réinitialisation de l’Exercice

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
- le Circuit, le Tour courant et le Cycle technique restent inchangés ;
- l’Exercice redémarre selon son comportement normal.

`Annuler` ferme la modale et reprend l’Exercice à son état précédent.

Les deux boutons `147 × 48` sont alignés sur une ligne avec un écart de `12`. Les libellés sont centrés horizontalement et verticalement. La dernière ligne du message et les actions sont séparées par `spacing/16`.

### Confirmation — Passage à l’Exercice suivant

Référence Figma : `1992:8326`, `Modal — Passer à l’exercice suivante`. Le dialogue flottant centré utilise `Overlay / Decision Dialog`, variante `PrimaryTone=Primary,SecondaryTone=Neutral,Actions=2` (`2590:2926`), instance `2591:3058`. Il mesure `354 × 215`.

#### Objectif

Confirmer l’interruption anticipée d’un Exercice chronométré.

#### Ouverture

Cette modale s’affiche lorsque l’utilisateur appuie sur `Exercice suivant` avant la fin d’un Exercice chronométré.

Elle ne s’affiche pas pour une Série en mode Répétitions ou à cible À l’échec : dans ce cas, `Suivant` constitue la validation normale de la Série courante.

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

- l’Exercice chronométré est arrêté avant son terme ;
- sa durée réellement exécutée est conservée ;
- son statut métier devient `Partielle` ;
- la progression est mise à jour ;
- l’Exercice suivant démarre selon les règles normales du Plan d’Exécution.

`Annuler` ferme la modale et reprend l’Exercice en cours.

Les deux boutons `147 × 48` sont alignés sur une ligne avec un écart de `12`. Les libellés sont centrés horizontalement et verticalement. La dernière ligne du message et les actions sont séparées par `spacing/16`. Le terme visuel `partiellement exécutée` décrit le résultat à l’utilisateur ; le statut métier enregistré reste `Partielle`.

### Confirmation — Pause / arrêt de l’Exécution

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

Ce texte décrit le temps actif. En cadence, l’intervalle sonore reprend entier et la progression reste au dernier intervalle complet, selon la spécification Cadence ; la fraction déjà dépensée reste comptée au réel.

Le nom d’Exercice est dynamique ; `Squats assistés` est uniquement la donnée d’illustration de la frame.

**Actions**

- `Reprendre la séance`, action primaire bleue
- `Arrêter la séance`, action destructive rouge

Les deux boutons `147 × 48` sont alignés sur une ligne avec un écart de `12`. Les libellés sont centrés horizontalement et verticalement. La dernière ligne du message et les actions sont séparées par `spacing/16`.

#### Reprendre la séance

Ferme la modale et reprend le plan conservé. En cadence, la fraction d’intervalle abandonnée pour la progression n’est pas reprise : nouvel intervalle complet, temps actif cumulé conservé.

Pour un Exercice chronométré, le compte à rebours reprend.  
Pour un Exercice en Répétitions ou À l’échec, le chronomètre croissant reprend.

#### Arrêter la séance

Met fin à l’Exécution :

- la progression réellement effectuée est enregistrée ;
- le statut de l’Exécution devient `Interrompue` ;
- l’écran `Synthèse de séance` est affiché.

La modale ne peut être fermée que par l’une des deux actions prévues.

### Lecture des variantes avec média

Les vues avec cercle et texte, bascule basse avec média, bascule haute avec texte ou média, et média plein écran appartiennent à cette même famille. Les règles de bascule, de lecture et de continuité de l’exécution sont définies dans [Médias pendant l’Exécution](../CONCEPTION-EXECUTION-MEDIA.md), décision D-203. **Périmètre MVP : les états média représentés sont inclus (D-203 corrigée dans #247), sans ajout implicite de parcours d’import.**

### Vues principales et états intégrés

#### Exécution d'une séance — Démarrée

[Source Figma — `1992:8132`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-8132)

![Exécution d'une séance — Démarrée](images/ecran-9-execution-seance.png)

#### Exécution d'un exercice — Démarrée

[Source Figma — `4968:8188`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4968-8188)

![Exécution d'un exercice — Démarrée](images/figma-4968-8188.png)

#### Exécution d'une séance — Démarrée — Bips et vocal désactivés

[Source Figma — `1992:8530`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-8530)

![Exécution d'une séance — Démarrée — Bips et vocal désactivés](images/ecran-9b-execution-sons-annonces-desactives.png)

État alternatif des deux commandes de guidage sonore

#### Exécution d'une séance — Initial

[Source Figma — `1992:8626`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-8626)

![Exécution d'une séance — Initial](images/ecran-9a-execution-etat-initial.png)

La Séance ne démarre pas automatiquement ; Retour mène au Catalogue renseigné dans le prototype

### Modales, panneaux et confirmations

#### Modal — Réinitialiser l’activité

[Source Figma — `1992:8224`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-8224)

![Modal — Réinitialiser l’exercice](images/modale-5-reinitialiser-activite.png)

#### Modal — Passer à l’activité suivante

[Source Figma — `1992:8326`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-8326)

![Modal — Passer à l’exercice suivante](images/modale-6-activite-suivante.png)

#### Modal — Séance en pause

[Source Figma — `1992:8428`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-8428)

![Modal — Séance en pause](images/modale-7-seance-en-pause.png)

### Variantes Information et Média

#### Exécution d'un exercice — Initial — Bascule basse (média) avec Cercle

[Source Figma — `4997:6113`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4997-6113)

![Exécution d'un exercice — Initial — Bascule basse (média) avec Cercle](images/figma-4997-6113.png)

#### Exécution d'un exercice — Initial — Bascule haute avec média

[Source Figma — `5588:4363`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=5588-4363)

![Exécution d'un exercice — Initial — Bascule haute avec média](images/figma-5588-4363.png)

#### Exécution d'un exercice — Média plein écran

[Source Figma — `5009:6069`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=5009-6069)

![Exécution d'un exercice — Média plein écran](images/figma-5009-6069.png)

#### Exécution d'un exercice — Initial - Cercle avec Texte

[Source Figma — `5021:5994`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=5021-5994)

![Exécution d'un exercice — Initial - Cercle avec Texte](images/figma-5021-5994.png)

#### Exécution d'un exercice — Démarré —  Bascule haute avec texte

[Source Figma — `5581:4257`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=5581-4257)

![Exécution d'un exercice — Démarré —  Bascule haute avec texte](images/figma-5581-4257.png)

## Synthèse — séance ou exercice

Variantes partielles illustrées ci-dessous, couvertes par CE-UI-08 :

- `4760:6448 — Synthèse de séance — Partielle — Évaluation initiale` ;
- `4760:6500 — Synthèse de séance — Partielle — Ressenti sélectionné`.

### Objectif

Présenter un bilan immédiatement compréhensible et recueillir le ressenti obligatoire avant de quitter l’écran.

### Contenu

L’écran affiche notamment :

- le nom de la Séance ;
- le statut de l’Exécution ;
- la durée réellement exécutée ;
- le nombre d’Exercices réalisés ;
- le nombre d’Exercices partielles, uniquement s’il est supérieur à zéro ;
- le choix du ressenti ;
- un champ `Commentaire` facultatif ;
- le bouton `Enregistrer`.

Les Tours et Cycles ne sont pas affichés dans la Synthèse du MVP.

Aucun parcours détaillé des Exercices n’est affiché sur cet écran dans le MVP.

### Statut

Une Exécution terminant normalement son Plan peut être `Terminée` ou `Partielle` selon les Exercices réellement réalisés.

Une Exécution arrêtée volontairement depuis la modale de pause est enregistrée avec le statut `Interrompue`.

### Ressenti

Le ressenti est obligatoire.

Le MVP propose trois niveaux, conformément au wireframe.

Le libellé `Comment s’est passée la séance ?` utilise `type.cardTitle` (`16/19`, Semi Bold — interligne Inter Auto depuis l’alignement DSF du 07/10/2026, ancien `16/20`). À la taille système standard, son conteneur occupe la largeur utile et maintient le libellé sur une ligne sur les largeurs prises en charge de `360` à `440` points ; la référence Figma `402` utilise une largeur de `322` points. Avec l’agrandissement d’accessibilité, le conteneur grandit verticalement et autorise le retour à la ligne sans chevaucher les choix de ressenti.

Le bouton `Enregistrer` reste désactivé tant qu’aucun ressenti n’a été sélectionné.

### Commentaire

Le `Commentaire` est facultatif et limité à **200 caractères maximum**.

Le Ressenti est obligatoire dès lors que cet écran de Synthèse est présenté, y compris pour une Exécution `Interrompue`. Il peut être absent uniquement lorsqu’une interruption technique n’a pas permis de présenter la Synthèse.

Il est enregistré avec l’Exécution.

### Navigation

`Enregistrer` enregistre le ressenti et le Commentaire puis ouvre le `Suivi`.

Aucune action `Relancer la séance` n’est prévue dans le MVP.

### Résultat d’un exercice lancé directement

Le Ressenti est obligatoire pour activer `Enregistrer`; le Commentaire reste facultatif. La finalisation enregistre l’origine `ACTIVITY`, alimente les statistiques compatibles sans compter une Séance et restaure le contexte appelant : Catalogue des Exercices dans son état précédent, ou Calendrier avec date/vue conservées (CE-T03-14).

### Vues principales et états intégrés

#### Synthèse de séance — Terminée —  Évaluation initiale

[Source Figma — `1992:8718`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-8718)

![Synthèse de séance — Terminée —  Évaluation initiale](images/ecran-10a-synthese-evaluation-initiale.png)

#### Synthèse de séance — Terminée — Ressenti sélectionné

[Source Figma — `1992:8780`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-8780)

![Synthèse de séance — Terminée — Ressenti sélectionné](images/ecran-10-synthese-seance.png)

#### Synthèse d'exécution — Exercice Terminé —  Évaluation initiale

[Source Figma — `4968:8055`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4968-8055)

![Synthèse d'exécution — Exercice Terminé —  Évaluation initiale](images/figma-4968-8055.png)

#### Synthèse d'exécution — Exercice Terminé —  Ressenti sélectionné

[Source Figma — `4968:8105`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4968-8105)

![Synthèse d'exécution — Exercice Terminé —  Ressenti sélectionné](images/figma-4968-8105.png)

#### Synthèse de séance — Partielle — Évaluation initiale

[Source Figma — `4760:6448`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4760-6448)

![Synthèse de séance — Partielle — Évaluation initiale](images/figma-4760-6448.png)

#### Synthèse de séance — Partielle — Ressenti sélectionné

[Source Figma — `4760:6500`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4760-6500)

![Synthèse de séance — Partielle — Ressenti sélectionné](images/figma-4760-6500.png)

## Suivi — Séances

### Objectif

Permettre à l’utilisateur de consulter les Exécutions enregistrées sur des cartes à deux lignes, sans déploiement .

Les occurrences planifiées non exécutées ne sont pas affichées dans le Suivi du MVP.

### Contenu

L’écran comporte :

- la destination active `Séances` ;
- les commandes `Filtrer` et `Trier`, visibles mais désactivées dans ce contexte ;
- une liste chronologique des Exécutions.

Chaque carte présente deux lignes sans déploiement ; les détails restent conservés dans l’instantané et les résultats, sans carte déployée accessible au MVP.

La Vue d’ensemble est hors MVP ; l’ancien contrôle partagé ne constitue plus une exigence de cette version. Les commandes `Filtrer` et `Trier` conservent leur écart et sont centrées comme un groupe. Dans chaque carte, le Ressenti est un indicateur informatif20 × 20 ancré au bord droit intérieur, sans zone tactile ni action ; il reste lisible sur écran compact et ne s’éloigne pas du bord sur grand téléphone. La liste est la seule zone défilante et s’arrête visuellement au moins `16` points avant la navigation basse fixe.

### Carte d’Exécution

Chaque carte affiche au minimum :

- le nom de la Séance exécutée ;
- sa couleur issue de l’Instantané ;
- la date portée par le groupe chronologique, sans heure dans la carte ;
- la durée réelle ;
- le statut `Terminée`, `Partielle` ou `Interrompue` ;
- le ressenti lorsqu’il a été renseigné.

Présentation commune aux cartes Séance/Exercice : largeur354, hauteur67 à taille standard, titre15, aucune barre verticale ni photo. Ligne1 : nature26, titre, statut76 à droite (x262/y9). Ligne2 : durée réelle, catégorie, indicateur Ressenti20 × 20 à droite (x318/y39). Pas de chevron, heure, zones corporelles ni étiquettes. Les instantanés et résultats complets restent conservés même si la source a disparu. Aucun miroir Catalogue/choix ajouté au Suivi. Filtrer/Trier : boutons34, dessins20, gap12, cibles44 ; état vide et navigation conservés. Contrat CE-T03-15, D-262.

### Filtres avancés

Dans le Suivi, les filtres avancés restent hors du MVP. Cette règle est distincte des filtres fonctionnels des Catalogues, qui sont actifs et contextuels.

### Tri

La fonction de tri est reportée à une version ultérieure. La commande `Trier` reste visible mais désactivée. L’ordre d’affichage initial reste chronologique, du plus récent au plus ancien.

### État vide

Si aucune Exécution ne correspond à la recherche, l’écran affiche un message indiquant qu’aucun résultat ne correspond.

Si aucune Exécution n’existe encore, l’écran affiche : `Vous verrez ici vos séances exécutées dès que vous aurez terminé votre première séance.`

### Vues principales et états intégrés

#### Suivi — Séances — Liste condensée

[Source Figma — `1992:8843`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-8843)

![Suivi — Séances — Liste condensée](images/ecran-11-suivi-condense.png)

`Terminée`, `Partielle`, `Interrompue`

#### Référence historique hors MVP — Suivi — Séances — Vue déployée

[Source Figma — `1992:8996`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-8996)

![Référence historique hors MVP — Suivi — Séances — Vue déployée](images/ecran-11a-suivi-deploye.png)

État conservé pour traçabilité ; aucun chemin d’accès dans le MVP depuis D-262.

`Terminée`, `Partielle`, `Interrompue`

#### Suivi — Séances — État vide

[Source Figma — `2117:190`](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=2117-190)

![Suivi — Séances — État vide](images/ecran-11b-suivi-vide.png)

## Règles communes aux sélections et réglages

### Supprimer une valeur de référentiel
Cette famille de modales est ouverte par appui long sur une option dans les sélecteurs `Étiquettes`, `Catégorie` ou `Zones corporelles`.

Références Figma :
- Étiquette : `4861:6145 — Composition séance — Étiquettes — Appui long — Confirmation suppression` ;
- Catégorie : `4861:6259 — Ajouter un exercice — Catégorie — Appui long — Confirmation suppression` ;
- Zone corporelle : `4861:6348 — Ajouter un exercice — Zones corporelles — Appui long — Confirmation suppression`.

Le dialogue utilise la variante destructive à deux actions de `Overlay / Decision Dialog`. Le titre reprend la valeur concernée sous la forme `Supprimer « {nom} » ?`. Le message précise, lorsque la valeur est utilisée, qu’elle disparaît des nouveaux choix mais reste attachée aux objets existants, avec son nom et sa dernière couleur éventuelle ; l’historique reste inchangé.

Actions :
- `Annuler` : ferme la confirmation sans modifier le référentiel ni la sélection ;
- `Supprimer` : retire la valeur des nouveaux choix et conserve ses affectations existantes, son nom et sa dernière couleur, puis restitue la modale de sélection actualisée.

Cette règle s’applique aux valeurs initiales comme aux valeurs créées ensuite par l’utilisateur.

### Contrôles à roulette – Compte à rebours et fins
Les anciennes modales basses de durée restent des références historiques. Dans la feuille v13, les roulettes s’ouvrent inline sous la ligne active ; dans le Profil, les durées utilisent les steppers validés. Les autres contextes suivent leur contrat propre. Les entiers simples `Nombre de Séries`, `Nombre de répétitions` et `Nombre de Tours` utilisent des steppers inline conformément à D-219. Les sélections d’objets utilisent leurs modales dédiées.

Dans le Profil, les contrôles `Compte à rebours initial`, `Fin de séance`, `Compte à rebours d’exercice` (ancien nœud `4179:9550`, historique supprimé ; le contrôle fonctionnel reste prescrit) et `Fin d’exercice` (ancien nœud `4179:9556`, historique supprimé ; le contrôle fonctionnel reste prescrit) servent de préférences proposées à la création de nouveaux contenus. Ces valeurs suivent la validation des contrôles du Profil (CE-UI-07), sans importer la confirmation des anciennes roulettes.

Les valeurs initiales de l’application sont `10 s` pour le Compte à rebours initial et `5 s` pour la Fin de séance. Une durée de `0 s`, lorsqu’elle est choisie par l’utilisateur, rend la phase instantanée sans supprimer l’élément structurel.

## Règles transverses de l’éditeur d’Exercice
Les écrans Exercice placent le champ Nom en premier dans la zone bleue et suppriment le contexte de Séance. Aucun type d’Exercice n’est affiché. Le mode d’exécution propose `Durée` et `Répétitions`. `À l’échec` est un type de cible de série, sélectionné dans le contrôle de cible, et non un troisième mode. Dans le MVP, la zone Média suit les frames courantes et la carte d’Exercice du Catalogue conserve sa gouttière permanente avec premier média ou icône de nature, sans déploiement . Les capacités d’import/capture restent régies par leur périmètre propre. Les accès `Catégorie` et `Zones corporelles` utilisent une icône `+` séparée de leur libellé.

La frame historique `3561:7802` illustrait l’état À l’échec : ordre `Séries` → cadre informatif `à l’échec` → `Pause`, seconde rangée `Changement de côté / Récupération / Durée totale >=`, sans cible chiffrée. Cette ancienne disposition ne définit plus l’éditeur actif : la feuille v13 utilise les contrôles de CE-UI-10 et aucun total d’Exercice en À l’échec. Les roulettes de cette feuille restent inline ; les contrôles de durée du Profil sont des steppers. Dans les états renseignés, `Renforcement du genou` est une donnée de démonstration ; seul `3943:6064` conserve `Nom de l’exercice` comme placeholder de l’état vide.

## Composant transverse `Status / Badge`
La référence historique du composant est le node `3959:5970`, `Status / Badge — Source exact`. Les références courantes et archivées suivent l’inventaire DSF-CADENCE-2026-10-06 ; l’ancienne référence ne doit pas remplacer le mapping courant. Elle porte les sept variantes de la propriété `Status` dans un composant unique.

*Composant — `Status / Badge — Source exact` — Figma `3959:5970` — export PNG ×2*

Les sept variantes se répartissent en deux familles sémantiques, sans que cette répartition scinde le composant :

| Famille | Variantes | Node de variante |
| --- | --- | --- |
| Statuts d’exécution | `Terminée`, `Partielle`, `Interrompue` | `3959:5966`, `3959:5963`, `3959:5969` |
| Statuts d’élément / provenance | `Catalogue`, `Planifiée`, `Exécutée`, `Archivée` | `3959:5951`, `3959:5954`, `3959:5957`, `3959:5960` |

Les preuves d’usage sont distinctes de la preuve du composant et ne s’y substituent pas :

| N° | Écran | Capture | Variantes visibles | Node Figma |
| --- | --- | --- | --- | --- |
| Suivi — Séances | Suivi : Séances — Liste condensée | Voir les captures dans **Suivi — Séances** ci-dessus | `Terminée`, `Partielle`, `Interrompue` | `1992:8843` |
| Suivi — Séances — historique hors MVP | Suivi : Séances — Vue déployée | Voir les captures dans **Suivi — Séances** ci-dessus | `Terminée`, `Partielle`, `Interrompue` | `1992:8996` |

## Couverture du Prototype MVP et exclusions justifiées
### Périmètre intégré

Les tableaux d’états d’écran contiennent une capture lorsqu’une copie courante existe. Les références sans copie sont explicitement historiques, absentes de Figma ou des composants sans écran autonome.

La page Figma `Prototype MVP` (`510:101`) constitue la source visuelle des frames de production. Une capture ne remplace pas la règle écrite : le présent chapitre définit les comportements, tandis que les captures et le chapitre 13 définissent les références visuelles et critères déterministes.

### Éléments non intégrés comme écrans distincts

Les calques internes, zones tactiles transparentes, cibles de défilement et duplications de liens de prototypage ne constituent pas des écrans distincts. Les états fonctionnels sans frame dédiée réutilisent les composants de leurs écrans parents ; aucune fausse capture Figma ne doit être inventée.

### Règle de maintenance

Lorsqu’une nouvelle frame de premier niveau est ajoutée au `Prototype MVP`, elle doit être soit intégrée dans ce chapitre avec sa règle fonctionnelle, soit explicitement classée hors périmètre avec justification. Une variante ne peut plus être omise silencieusement.

### Mise à jour Bilatéralité — rectifiée le 13 septembre 2026

Le contrôle Exercice porte le libellé `Changement de côté` et propose `Aucun`, `D→G`, `G→D`. Sa géométrie suit le Figma courant et le DSF actif. Aucun contrôle de changement de côté n’est exposé au niveau du Circuit.

Dans la Composition actuelle, aucun contrôle de changement de côté n’est affiché dans l’en-tête du Circuit. Le stepper `Nombre de tours` reste la seule commande numérique de ce groupe ; les anciennes références Figma de direction Tour sont historiques et ne constituent plus la cible active.

Aucune confirmation d’activation bilatérale du Tour n’est exposée dans la version actuelle. Le support technique historique du côté Tour reste conservé pour non-régression, fixé à `UNILATERAL` et non modifiable.

Dans une carte d’Exercice, l’indicateur propre affiche `D→G` ou `G→D` lorsque l’Exercice est bilatéral ; il est absent avec `Aucun`. La phrase complète de l’éditeur suit Phrase v1/corpusv15 : cible, Pause, côtés puis total applicable. La carte de Composition utilise son indicateur compact distinct. Les références géométriques suivent le Figma courant.

Dans la famille Exécution — séance ou exercice, un Exercice effectivement bilatéral affiche `Côté droit` ou `Côté gauche` sous son nom. Les indicateurs de progression gardent leur sémantique ; aucun compteur de côté n’est ajouté. Les frames d’Exécution existantes restent inchangées.

### Évidences Figma T03 — état courant du 16 septembre 2026

Les contrôles d’entrée `Créer / Filtrer / Trier` restent conçus et vérifiables dans Figma pour leur rendu. Les références courantes principales sont `3786:5093` (Catalogue Exercices), `1992:9910` (Catalogue Séances), `1992:10129` (Recherche globale — Champ déployé), `3561:4695`, `3561:7673`, `3561:7802`, `3943:6064` (éditeur Exercice), `2537:1033` (Déployer) et `6298:12462` (Navigation Bottom). Les anciennes frames d’arbre `3787:5148` et `3841:8375` sont supersédées fonctionnellement par D-187.

L’ancienne référence `3787:5209 — Catalogue — action contextuelle directe` n’existe plus dans le Figma courant et ne constitue plus une évidence active. Les panneaux ouverts de `Filtrer` sont désormais conçus et vérifiables dans Figma ; `Trier` reste disabled T03.

### Résolutions postérieures au contrôle visuel du 16 septembre 2026

Les points suivants ont été résolus depuis ce contrôle : la modale d’abandon de création d’Exercice est représentée par `4714:6241`; les panneaux ouverts de `Filtrer` sont conçus ; l’affichage média en gouttière permanente du Catalogue des Exercices appartient au MVP, sans déploiement  ; l’ancien arbre `Créer` reste historique ; la création inline d’une Zone corporelle dans `4683:6336` est désormais cohérente avec D-199. Le contrôle de l’état `2139:86` a confirmé qu’il est redondant avec `1992:684` (`Vibration activée`) ; il n’est plus présenté comme un état d’écran distinct dans le chapitre 06.

## Références transverses des cartes et appuis — 30 septembre 2026
Décisions finales du propriétaire : les 17 points du 30/09 sont clos. Révision des cartes du 03/10/2026 (D-260 à D-264) : un seul format de carte d’Exercice, avec une gouttière permanente de 64 px dans le Catalogue et les listes de sélection d’exercices ; photo si média associé, icône de nature sinon. La vignette utilise le premier média dans l’ordre de la galerie ; si ce média est une vidéo, elle utilise son image de couverture . Les Séances ne portent jamais de visuel. Aucune photo dans les listes mixtes, le Calendrier ou le Suivi. Aucun déploiement d’Exercice ni de carte du Suivi ; le déploiement des Séances reste accessible dans le Catalogue et le Calendrier Semaine. Le Suivi présente deux lignes : nature/titre/statut, puis durée/catégorie/ressenti ; sans heure, zones corporelles ni étiquettes. Le Ressenti y est un indicateur sans action, distinct de sa saisie obligatoire en Synthèse. Les variantes déployées d’Exercice et du Suivi sont historiques, hors MVP. Pauses/récupérations et prochaine planification restent absentes des cartes concernées. Les données, instantanés, calculs et fonctions de planification sont conservés.

Synthèses : « N séries de X », « N séries de N rép. », « N séries à l’échec » ; bilatéralité par miroir dans les variantes concernées. Heure Semaine « 08:00 » ; aucune heure dans la carte du Suivi. Séance sans étiquette : catégories de ses exercices ; listes de catégories/zones séparées par un point médian et tronquées avec « … ». Choix sans badge durée ; récurrence du Calendrier Semaine dans la carte déployée seulement.

RG-10 : le Profil porte une préférence silhouette facultative, homme/femme ; absence = homme affiché. Elle ne pilote que l’icône de zone corporelle, sans filtre, recherche ou effet métier. RG-11 à RG-13 : vignette 64 centrée et recadrée sans déformation (couverture pour une vidéo), place réservée pendant chargement/erreur, texte alternatif égal au nom de l’exercice.

D-239 : Calendrier Jour est une exception compacte (séance 298 × 46, exercice 298 × 48, x=80, hauteur d’instance adaptée à l’événement), avec barre colorée 4, nature 26, titre 13 gras, heure/durée 11, lecture 26 et aucun Déployer. Les deux sets comportent 10 variantes chacun. Suivi — Vue d’ensemble est hors MVP. Les boutons Calendrier Aujourd’hui/Planifier restent à 32, sans cible 44 ajoutée : situation acceptée, à revoir et développer après T04. Les nouvelles icônes sont nommées icon/<nom>, les anciennes ne sont pas renommées ; target est réservé au Programme, pulse aux rapports/Suivi.

Référence normative ciblée : [DSF — Cartes, icônes et appuis](../DSF-CARTES-ICONES-APPUIS-2026-09-30.md). Ces règles finales prévalent sur les anciennes formulations d’affichage du présent chapitre dans ce périmètre uniquement.

Appuis — D-237 : la spécification figée v2 du 29 septembre impose une dilatation au contact, un retour au relâchement et une action immédiate au relâchement, sans attendre le ressort. Annulation hors cible : retour sans action ; nouvel appui : reprise depuis l’état courant. Stepper selon DSF Bip (maintien≈500ms, répétition150ms, paliers1/5/10) et réduction des animations par opacité seule. Paramètres et preuves dans le complément DSF.

La règle vaut également :
- après le dernier Exercice d’un Tour ;
- à chaque Tour du Circuit ;
- après le dernier Exercice de la Séance, avant la Fin de séance.

Dans l’éditeur d’Exercice, le contrôle générique `Récupération` est remplacé par `Pause entre les côtés` et n’est exposé que lorsque `Changement de côté` vaut `D→G` ou `G→D`. La récupération après exercice ne figure ni dans l’éditeur ni dans la synthèse intrinsèque de l’Exercice.

**Interaction Point d’arrêt .** L’action dédiée d’ajout affiche les positions autorisées dans la Composition ; l’utilisateur choisit la position et peut quitter ce mode via le snackbar d’annulation. Un appui long sur un Point d’arrêt existant ouvre une bulle de retrait ; un appui ailleurs referme la bulle sans modification. La Récupération après exercice reste exécutée mais n’est plus affichée sur la carte  ; le Point d’arrêt reste une action distincte.

**Contexte d’Exécution .** La ligne immédiatement sous le nom de l’Exercice est toujours renseignée : nom de Séance et Catégorie de l’Exercice lors d’une Exécution de Séance, Catégorie de l’Exercice seule en Exécution directe. L’indication du côté courant, lorsqu’elle existe, reste distincte.

## Conventions communes d’interface
- **Navigation** : quatre destinations actives seulement — `Catalogues`, `Calendrier`, `Suivi`, `Profil`. Les écrans de Recherche globale sont archivés ; aucune recherche locale de Catalogue n’est active .
- **Sélection en modale** : la planification utilise des cases à cocher et Ajouter n éléments, même pour un seul choix (D-222 révisée). Les référentiels conservent leurs contrats de sélection simple ; la Composition conserve cases à cocher + `Sélectionner` ; filtres = validation explicite + `Réinitialiser`.
- **Planifier** : titre `Planifier` avant connaissance du type, puis `Planifier une séance` ou `Planifier un exercice`. La modale suit le gabarit D-229.
- **Fondations DSF** : fond `#FFFFFF` sauf Splash `#0006F1` et média plein écran `#0A0A0C`; zone de contexte `#EAEAFF`→transparent sur les familles couvertes ; navigation, halo, boutons circulaires, steppers et badges selon D-224 à D-227.
- **Listes/modales** : listes scrollables avec rognage ; feuilles longues alignées en haut sur la zone de contexte ; comportements et dégradés bas selon D-228.
- **Composants spécialisés** : Point d’arrêt, Profil et Exécution suivent D-230 ; les cartes et l’indicateur Ressenti suivent la révision D-260 à D-264 ; les cartes média déployées sont historiques hors MVP.

### Référence DSF V2 détaillée — clôture 28 septembre 2026

- **Navigation basse** : pilule `322 × 62 px`, `color/navigation/pill #F9FAFC` (référence couleur centralisée au chapitre12), stroke blanc 1 px, ombre `rgba(26,26,38,0.08)` blur/rayon 10 offset `0,2`; token `color/navigation/pill`. Icône Profil selon D-233/D-236, dans une boîte de navigation 32×32 ; actif `#0508E5`, inactif `#595E66 (iconNeutral/textSecondary ; ancien #5C636E historique)`. Cadre actif `76 × 50 px`, bleu `#0508E5` à 10 %. Boîtes d’icônes aux abscisses 68/146/224/302 dans la référence 402 px, soit 28 px entre bord de pilule et boîte extrême et 78 px entre centres. Intégration écran : 16 px sous la pilule, bande opaque 16 px puis dégradé transparent→fond sur 40 px ; ces bandes appartiennent à l’écran.
- **Fond / contexte** : écran ordinaire `#FFFFFF`; Splash `#0006F1`; média plein écran `#0A0A0C`. Zone de contexte `#EAEAFF`→transparent sur les 20 % inférieurs pour Catalogues, Composition, Calendrier, Suivi, Profil et Ajout d’exercice. Le séparateur 1 px n’est retiré que si ce dégradé assure la séparation.
- **Halo et action circulaire** : halo Annuler/Retour blanc opaque `59,28 px`, placé devant la zone de contexte et hors du conteneur clippé ; bouton circulaire clair `32 × 32`, la valeur observée référencée au chapitre12, stroke blanc 1 px, ombre `rgba(26,26,38,0.08)` blur 10 offset `0,2`.
- **Stepper / valeur** : variante lavande `#F2F2FF` pour Profil/paramètres, variante blanche pour Tours de Composition ; `−/+` ronds bleus, 12 px autour de la valeur centrale. Le stepper remplace la valeur sur la même ligne sans étirer le groupe ; un seul stepper actif à la fois. Badge replié `#F5F7FA (surface ; ancienne valeur historique #F4F4F8)`, texte bleu Semi Bold 13 px, rayon 6, marges 8 px horizontales et 2 px verticales ; contour bleu 1,5 px lorsque le contrôle est ouvert (DSF V2 lot 3, T4). Le nombre de semaines utilise la pilule de stepper rayon 18.
- **Point d’arrêt** : bouton rond blanc opaque, icône Pause, contour 1 px `#0508E5`; l’action complète porte le contour. Les occurrences de Composition utilisent cette référence commune.
- **Ressenti** : ne pas confondre contrôle de choix et pictogramme de résultat. Résultats : vert Bien, orange Neutre, rouge Mal ; rouge source `#EF4444`. Aucun état actif Figma ne prouve un contrôle « Mal sélectionné ».
- **Profil** : titres de section Semi Bold 16 px ; `Modifier` en `#0508E5`; groupes blancs 126 px ; zone de contexte 115 px ; ouverture d’un stepper sans étirement du groupe.
- **Exécution** : sur les cinq écrans portant `Zone — Progression et suite`, début `y=449`, hauteur `305 px`. Dans la variante haute avec texte, conserver 95 px avant la zone. Variante média : `Série X/3 • Tour X/3` en Roboto Condensed Medium 24 px.
- **Photo sur les cartes** : la prescription historique de carte déployée est remplacée par D-261 : aucun Déployer d’Exercice, avec ou sans média ; l’exécution média conserve ses variantes propres.

### Paramètres — référence courante du 02/10/2026

La [spécification v13](08%20%E2%80%93%20Conception%20fonctionnelle%20d%C3%A9taill%C3%A9e.md#parametres-exercice) remplace le champ éditable v10.2. Les anciennes captures d’éditeur ne constituent plus des écarts à corriger vers la phrase inline. Les limites actuelles sont celles de la feuille (câblage incomplet et données de démonstration), décrites dans la section Créer ou modifier un exercice et CE-UI-10.

## Archives et références hors prototype actif

L’écran/arbre intermédiaire `Une nouvelle exercice / Une séance / Un parcours / Annuler` est supprimé par D-187.

Dans chaque Catalogue, `Créer` ouvre directement la création de l’objet correspondant au Catalogue courant :
- `Catalogue des Exercices` → création d’un Exercice persistant ;
- `Catalogue des Séances` → création d’une Séance ;
- `Catalogue des Parcours` → création d’un Parcours lorsque ce Catalogue devient fonctionnel.

Cette règle n’active pas les Parcours dans T03/MVP. Les anciennes frames Figma `3787:5148` et `3841:8375`, ainsi que leurs captures physiques, sont conservées uniquement pour traçabilité et ne constituent plus des états fonctionnels à implémenter.

### Objectif

Présenter à terme des indicateurs synthétiques de progression et d’exercice.

Cette vue n’est pas fonctionnelle dans le MVP.

### Présence dans le MVP

La vue et ses graphiques sont abandonnés pour le MVP et seront conçus ultérieurement. Les anciennes maquettes de cette vue ne sont pas des écrans à développer ; aucune commande d’accès n’est requise par cette référence.

### Profil — Cible post-MVP

Référence hors prototype actif — Figma `1354:182` ; ne vaut pas activation MVP.

![Profil — Cible post-MVP](images/figma-1354-182.png)

### Référence historique hors MVP — Suivi — Séances — Vue déployée

Référence hors prototype actif — Figma `1842:2` ; ne vaut pas activation MVP.

![Suivi — Séances — Vue déployée](images/figma-1842-2.png)

### Suivi — Vue d’ensemble

Référence hors prototype actif — Figma `3401:86` ; ne vaut pas activation MVP.

![Suivi — Vue d’ensemble](images/figma-3401-86.png)

### Recherche globale — Champ déployé

Référence hors prototype actif — Figma `1992:10129` ; ne vaut pas activation MVP.

![Recherche globale — Champ déployé](images/ecran-2c-recherche-globale-champ.png)

### Recherche globale — Résultats affichés

Référence hors prototype actif — Figma `1992:10320` ; ne vaut pas activation MVP.

![Recherche globale — Résultats affichés](images/ecran-2a-recherche-globale-resultats.png)

### HISTORIQUE — Catalogue Séances — ancien arbre Créer — supersédé D-187

Référence hors prototype actif — Figma `3841:8375` ; ne vaut pas activation MVP.

![HISTORIQUE — Catalogue Séances — ancien arbre Créer — supersédé D-187](images/ecran-13a-catalogue-seances-creer-arbre.png)

> **Clôture des contrats — 01/10/2026.** Les règles consolidées du [chapitre 13, §6](13%20–%20Contrats%20d’écran.md#6-clôture-des-réserves-fonctionnelles-des-contrats) s’appliquent : progression sur le plan complet ; transitions et pauses selon D-248/v13 (ancien repli D-242 retiré) ; fréquence 1..12 semaines ; rappel personnalisé au plus 24 h. En Un côté après l’autre, le reset porte sur le bloc du côté courant ; la même règle s’applique à l’ordre alterné en conservant les résultats de l’autre côté (chapitre13 R-03). Les étapes et calculs ci-dessous se lisent avec ces précisions ; aucune nouvelle disposition d’écran.

### Référence de composant — Stepper — Séries (interactif)

Ensemble6426:10149, export06/10 ; pas un écran autonome.

![Stepper — Séries (interactif)](images/figma-6426-10149.png)

### Référence de composant — Cadre bas — retournement

Ensemble6446:10103, export06/10 ; pas un écran autonome.

![Cadre bas — retournement](images/figma-6446-10103.png)

### Référence de composant — Zone d’exécution — retournements

Ensemble6451:10942, export06/10 ; pas un écran autonome.

![Zone d’exécution — retournements](images/figma-6451-10942.png)

## Titres affichés

| Contexte | Titre visible | Contrat |
|---|---|---|
| Création d’Exercice | Créer un exercice | CE-T03-04 |
| Modification d’Exercice | Modifier un exercice | CE-T03-04 |
| Composition d’une nouvelle Séance | Composer une séance | CE-T03-08 |
| Modification d’une Séance | Modifier une séance | CE-T03-08 |

Les noms de frames Figma et annotations restent des références techniques : ils peuvent conserver « Ajouter un exercice » ou « Composition d’une séance ». Ils ne prescrivent pas le titre affiché. Les actions Ajouter gardent leur sens et leur destination définis par le contrat ; aucun arbre de création supplémentaire. « Créer une activité » n’est pas concerné. D-325.

## Règles générales d’interface —08/10/2026

Les espaces de contexte et de section, les pieds d’action et les surfaces de modales/blocs suivent le [DSF général](../DSF-INTERFACE-GENERALE-2026-10-08.md). Les captures hors de la galerie de planification n’ont pas été réexportées dans cette passe : leurs mesures antérieures ne remplacent pas ces règles.

### Clarification du12/10/2026 — Préparation et fin dans une Séance

Dans une Séance, les Compte à rebours d’exercice et Fin d’exercice ne sont jamais exécutés ; seuls le Compte à rebours initial et la Fin de séance s’appliquent, une fois, par substitution. Aucun booléen ni contrôle d’activation n’existe à cet effet. Les valeurs propres restent conservées pour l’exécution de l’Exercice seul. Aucun contrôle correspondant n’est à ajouter à la Composition ou à l’Exécution. Figma est confirmé aligné par le propriétaire ; cette correction documentaire ne demande aucune nouvelle maquette.

## Évolution des vues de composition —12/10/2026

Les contrats CE-CIR-01 (choix de nature), CE-CIR-02 (confirmation de perte) et CE-CIR-03 (volumes), ajoutés au chapitre13, complètent CE-T03-08 et CE-UI-10. En-tête : chiffre pour ±, pastille d’unité pour nature, œil permanent sur la ligne du titre pour la grille. Les cartes affichent les volumes, pas seulement N séries variables.

**Alignement documentaire du 12/10 :** 54 captures réexportées, [DSF courant](../DSF-CIRCUITS-CONTROLES-2026-10-12.md) et . Les écarts visuels résiduels y sont explicites ; aucune conformité complète de Figma ou de l’application n’est revendiquée. La page modèles `8334:28437` et le parcours Tabata `8388:28362`, `8388:28484`, `8388:32052`, `8388:32181` sont dans Conception — Hors MVP ; cet alignement ne les promeut pas au périmètre MVP.

<a id="formats-galerie"></a>

## Formats de séances — inventaire et captures du 14/10/2026

46 états présents sur Prototype MVP, exportés dans ce lot. Les captures décrivent le layout observé ; les règles de [Formats de séances](08%20%E2%80%93%20Conception%20fonctionnelle%20d%C3%A9taill%C3%A9e.md#formats-conception) priment pour les comportements et les calculs. Les écarts F-01…04 sont suivis dans la revue transverse. Une capture sans écart signalé ne vaut pas recette fonctionnelle. Les écrans d’exécution et de confirmation Death by ne sont pas illustrés par cet inventaire ; leurs contrats restent partiels sur le layout.

Le relevé du 12/10 sur Conception reste historique ; les références ci-dessous décrivent désormais le parcours observé sur Prototype MVP. Leur présence ne change pas le périmètre de livraison PRE-3/PRE-4.

### Pages de choix, paramètres, récapitulatif et composition

<a id="format-8598-29271"></a>

#### Composition séance — Modèles

Nœud [8598:29271](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8598-29271) · Contrat [CE-FMT-01](13%20–%20Contrats%20d’écran.md#ce-fmt-01). Capture du layout courant ; données illustratives.

![Composition séance — Modèles](images/formats-2026-10-14/figma-8598-29271.png)

<a id="format-8624-29980"></a>

#### Composition séance — Modèles — Tabata (quels exercices)

Nœud [8624:29980](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8624-29980) · Contrat [CE-FMT-02](13%20–%20Contrats%20d’écran.md#ce-fmt-02). F-01 : compte présenté comme tours et pause comme récupération ; représentation à aligner.

![Composition séance — Modèles — Tabata (quels exercices)](images/formats-2026-10-14/figma-8624-29980.png)

<a id="format-8598-29503"></a>

#### Composition séance — Modèles — Tabata (sélection des exercices)

Nœud [8598:29503](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8598-29503) · Contrat [CE-FMT-02](13%20–%20Contrats%20d’écran.md#ce-fmt-02). Capture du layout courant ; données illustratives.

![Composition séance — Modèles — Tabata (sélection des exercices)](images/formats-2026-10-14/figma-8598-29503.png)

<a id="format-8624-30306"></a>

#### Composition séance — Modèles — Tabata (récapitulatif)

Nœud [8624:30306](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8624-30306) · Contrat [CE-FMT-02](13%20–%20Contrats%20d’écran.md#ce-fmt-02). F-01 : compte corrigé, récupération encore à distinguer de la pause.

![Composition séance — Modèles — Tabata (récapitulatif)](images/formats-2026-10-14/figma-8624-30306.png)

<a id="format-8624-30749"></a>

#### Composition séance — Tabata (préremplie)

Nœud [8624:30749](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8624-30749) · Contrat [CE-FMT-03](13%20–%20Contrats%20d’écran.md#ce-fmt-03). F-01 : ancienne représentation par tours/récupérations ; ne pas en dériver la prescription.

![Composition séance — Tabata (préremplie)](images/formats-2026-10-14/figma-8624-30749.png)

<a id="format-8624-30040"></a>

#### Composition séance — Modèles — EMOM (paramètres)

Nœud [8624:30040](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8624-30040) · Contrat [CE-FMT-02](13%20–%20Contrats%20d’écran.md#ce-fmt-02). Capture du layout courant ; données illustratives.

![Composition séance — Modèles — EMOM (paramètres)](images/formats-2026-10-14/figma-8624-30040.png)

<a id="format-8624-30392"></a>

#### Composition séance — Modèles — EMOM (récapitulatif)

Nœud [8624:30392](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8624-30392) · Contrat [CE-FMT-02](13%20–%20Contrats%20d’écran.md#ce-fmt-02). Capture du layout courant ; données illustratives.

![Composition séance — Modèles — EMOM (récapitulatif)](images/formats-2026-10-14/figma-8624-30392.png)

<a id="format-8624-30880"></a>

#### Composition séance — EMOM (préremplie)

Nœud [8624:30880](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8624-30880) · Contrat [CE-FMT-03](13%20–%20Contrats%20d’écran.md#ce-fmt-03). Capture du layout courant ; données illustratives.

![Composition séance — EMOM (préremplie)](images/formats-2026-10-14/figma-8624-30880.png)

<a id="format-8624-30143"></a>

#### Composition séance — Modèles — AMRAP (paramètres)

Nœud [8624:30143](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8624-30143) · Contrat [CE-FMT-02](13%20–%20Contrats%20d’écran.md#ce-fmt-02). Capture du layout courant ; données illustratives.

![Composition séance — Modèles — AMRAP (paramètres)](images/formats-2026-10-14/figma-8624-30143.png)

<a id="format-8624-30521"></a>

#### Composition séance — Modèles — AMRAP (récapitulatif)

Nœud [8624:30521](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8624-30521) · Contrat [CE-FMT-02](13%20–%20Contrats%20d’écran.md#ce-fmt-02). Capture du layout courant ; données illustratives.

![Composition séance — Modèles — AMRAP (récapitulatif)](images/formats-2026-10-14/figma-8624-30521.png)

<a id="format-8624-31043"></a>

#### Composition séance — AMRAP (préremplie)

Nœud [8624:31043](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8624-31043) · Contrat [CE-FMT-03](13%20–%20Contrats%20d’écran.md#ce-fmt-03). Capture du layout courant ; données illustratives.

![Composition séance — AMRAP (préremplie)](images/formats-2026-10-14/figma-8624-31043.png)

<a id="format-8624-30198"></a>

#### Composition séance — Modèles — Death by (paramètres)

Nœud [8624:30198](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8624-30198) · Contrat [CE-FMT-02](13%20–%20Contrats%20d’écran.md#ce-fmt-02). F-04 : description du résultat à compléter avec les répétitions partielles.

![Composition séance — Modèles — Death by (paramètres)](images/formats-2026-10-14/figma-8624-30198.png)

<a id="format-8624-30602"></a>

#### Composition séance — Modèles — Death by (récapitulatif)

Nœud [8624:30602](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8624-30602) · Contrat [CE-FMT-02](13%20–%20Contrats%20d’écran.md#ce-fmt-02). Capture du layout courant ; données illustratives.

![Composition séance — Modèles — Death by (récapitulatif)](images/formats-2026-10-14/figma-8624-30602.png)

<a id="format-8624-31157"></a>

#### Composition séance — Death by (préremplie)

Nœud [8624:31157](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8624-31157) · Contrat [CE-FMT-03](13%20–%20Contrats%20d’écran.md#ce-fmt-03). Capture du layout courant ; données illustratives.

![Composition séance — Death by (préremplie)](images/formats-2026-10-14/figma-8624-31157.png)

<a id="format-8624-30255"></a>

#### Composition séance — Modèles — For time (paramètres)

Nœud [8624:30255](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8624-30255) · Contrat [CE-FMT-02](13%20–%20Contrats%20d’écran.md#ce-fmt-02). Capture du layout courant ; données illustratives.

![Composition séance — Modèles — For time (paramètres)](images/formats-2026-10-14/figma-8624-30255.png)

<a id="format-8624-30672"></a>

#### Composition séance — Modèles — For time (récapitulatif)

Nœud [8624:30672](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8624-30672) · Contrat [CE-FMT-02](13%20–%20Contrats%20d’écran.md#ce-fmt-02). Capture du layout courant ; données illustratives.

![Composition séance — Modèles — For time (récapitulatif)](images/formats-2026-10-14/figma-8624-30672.png)

<a id="format-8624-31263"></a>

#### Composition séance — For time (préremplie)

Nœud [8624:31263](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8624-31263) · Contrat [CE-FMT-03](13%20–%20Contrats%20d’écran.md#ce-fmt-03). Capture du layout courant ; données illustratives.

![Composition séance — For time (préremplie)](images/formats-2026-10-14/figma-8624-31263.png)

<a id="format-8656-33799"></a>

#### Composition séance — Modèles — Intervalles 30/30 (paramètres)

Nœud [8656:33799](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8656-33799) · Contrat [CE-FMT-02](13%20–%20Contrats%20d’écran.md#ce-fmt-02). Capture du layout courant ; données illustratives.

![Composition séance — Modèles — Intervalles 30/30 (paramètres)](images/formats-2026-10-14/figma-8656-33799.png)

<a id="format-8656-33857"></a>

#### Composition séance — Modèles — Intervalles 30/30 (récapitulatif)

Nœud [8656:33857](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8656-33857) · Contrat [CE-FMT-02](13%20–%20Contrats%20d’écran.md#ce-fmt-02). Capture du layout courant ; données illustratives.

![Composition séance — Modèles — Intervalles 30/30 (récapitulatif)](images/formats-2026-10-14/figma-8656-33857.png)

<a id="format-8656-33941"></a>

#### Composition séance — Intervalles 30/30 (préremplie)

Nœud [8656:33941](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8656-33941) · Contrat [CE-FMT-03](13%20–%20Contrats%20d’écran.md#ce-fmt-03). Capture du layout courant ; données illustratives.

![Composition séance — Intervalles 30/30 (préremplie)](images/formats-2026-10-14/figma-8656-33941.png)

<a id="format-8656-34196"></a>

#### Composition séance — Modèles — Renforcement (paramètres)

Nœud [8656:34196](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8656-34196) · Contrat [CE-FMT-02](13%20–%20Contrats%20d’écran.md#ce-fmt-02). Capture du layout courant ; données illustratives.

![Composition séance — Modèles — Renforcement (paramètres)](images/formats-2026-10-14/figma-8656-34196.png)

<a id="format-8656-34263"></a>

#### Composition séance — Modèles — Renforcement (récapitulatif)

Nœud [8656:34263](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8656-34263) · Contrat [CE-FMT-02](13%20–%20Contrats%20d’écran.md#ce-fmt-02). Capture du layout courant ; données illustratives.

![Composition séance — Modèles — Renforcement (récapitulatif)](images/formats-2026-10-14/figma-8656-34263.png)

<a id="format-8656-34356"></a>

#### Composition séance — Renforcement (préremplie)

Nœud [8656:34356](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8656-34356) · Contrat [CE-FMT-03](13%20–%20Contrats%20d’écran.md#ce-fmt-03). Capture du layout courant ; données illustratives.

![Composition séance — Renforcement (préremplie)](images/formats-2026-10-14/figma-8656-34356.png)

<a id="format-8656-34494"></a>

#### Composition séance — Modèles — Gainage · Mobilité (paramètres)

Nœud [8656:34494](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8656-34494) · Contrat [CE-FMT-02](13%20–%20Contrats%20d’écran.md#ce-fmt-02). Capture du layout courant ; données illustratives.

![Composition séance — Modèles — Gainage · Mobilité (paramètres)](images/formats-2026-10-14/figma-8656-34494.png)

<a id="format-8656-34548"></a>

#### Composition séance — Modèles — Gainage · Mobilité (récapitulatif)

Nœud [8656:34548](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8656-34548) · Contrat [CE-FMT-02](13%20–%20Contrats%20d’écran.md#ce-fmt-02). Capture du layout courant ; données illustratives.

![Composition séance — Modèles — Gainage · Mobilité (récapitulatif)](images/formats-2026-10-14/figma-8656-34548.png)

<a id="format-8656-34628"></a>

#### Composition séance — Gainage · Mobilité (préremplie)

Nœud [8656:34628](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8656-34628) · Contrat [CE-FMT-03](13%20–%20Contrats%20d’écran.md#ce-fmt-03). Capture du layout courant ; données illustratives.

![Composition séance — Gainage · Mobilité (préremplie)](images/formats-2026-10-14/figma-8656-34628.png)

<a id="format-8656-34753"></a>

#### Composition séance — Modèles — Superset (paramètres)

Nœud [8656:34753](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8656-34753) · Contrat [CE-FMT-02](13%20–%20Contrats%20d’écran.md#ce-fmt-02). Capture du layout courant ; données illustratives.

![Composition séance — Modèles — Superset (paramètres)](images/formats-2026-10-14/figma-8656-34753.png)

<a id="format-8656-34807"></a>

#### Composition séance — Modèles — Superset (récapitulatif)

Nœud [8656:34807](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8656-34807) · Contrat [CE-FMT-02](13%20–%20Contrats%20d’écran.md#ce-fmt-02). Capture du layout courant ; données illustratives.

![Composition séance — Modèles — Superset (récapitulatif)](images/formats-2026-10-14/figma-8656-34807.png)

<a id="format-8656-34887"></a>

#### Composition séance — Superset (préremplie)

Nœud [8656:34887](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8656-34887) · Contrat [CE-FMT-03](13%20–%20Contrats%20d’écran.md#ce-fmt-03). Capture du layout courant ; données illustratives.

![Composition séance — Superset (préremplie)](images/formats-2026-10-14/figma-8656-34887.png)

<a id="format-8656-35005"></a>

#### Composition séance — Modèles — Progression (paramètres)

Nœud [8656:35005](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8656-35005) · Contrat [CE-FMT-02](13%20–%20Contrats%20d’écran.md#ce-fmt-02). Capture du layout courant ; données illustratives.

![Composition séance — Modèles — Progression (paramètres)](images/formats-2026-10-14/figma-8656-35005.png)

<a id="format-8656-35062"></a>

#### Composition séance — Modèles — Progression (récapitulatif)

Nœud [8656:35062](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8656-35062) · Contrat [CE-FMT-02](13%20–%20Contrats%20d’écran.md#ce-fmt-02). Capture du layout courant ; données illustratives.

![Composition séance — Modèles — Progression (récapitulatif)](images/formats-2026-10-14/figma-8656-35062.png)

<a id="format-8656-35145"></a>

#### Composition séance — Progression (préremplie)

Nœud [8656:35145](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8656-35145) · Contrat [CE-FMT-03](13%20–%20Contrats%20d’écran.md#ce-fmt-03). Capture du layout courant ; données illustratives.

![Composition séance — Progression (préremplie)](images/formats-2026-10-14/figma-8656-35145.png)

<a id="format-8656-35273"></a>

#### Composition séance — Modèles — À l’échec (paramètres)

Nœud [8656:35273](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8656-35273) · Contrat [CE-FMT-02](13%20–%20Contrats%20d’écran.md#ce-fmt-02). Capture du layout courant ; données illustratives.

![Composition séance — Modèles — À l’échec (paramètres)](images/formats-2026-10-14/figma-8656-35273.png)

<a id="format-8656-35331"></a>

#### Composition séance — Modèles — À l’échec (récapitulatif)

Nœud [8656:35331](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8656-35331) · Contrat [CE-FMT-02](13%20–%20Contrats%20d’écran.md#ce-fmt-02). Capture du layout courant ; données illustratives.

![Composition séance — Modèles — À l’échec (récapitulatif)](images/formats-2026-10-14/figma-8656-35331.png)

<a id="format-8656-35415"></a>

#### Composition séance — À l’échec (préremplie)

Nœud [8656:35415](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8656-35415) · Contrat [CE-FMT-03](13%20–%20Contrats%20d’écran.md#ce-fmt-03). Capture du layout courant ; données illustratives.

![Composition séance — À l’échec (préremplie)](images/formats-2026-10-14/figma-8656-35415.png)

<a id="format-8747-14320"></a>

#### Composition séance — Tabata (préremplie) — Par exercice

Nœud [8747:14320](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8747-14320) · Contrat [CE-FMT-03](13%20–%20Contrats%20d’écran.md#ce-fmt-03). Capture du layout courant ; données illustratives.

![Composition séance — Tabata (préremplie) — Par exercice](images/formats-2026-10-14/figma-8747-14320.png)

<a id="format-8795-14449"></a>

#### Composition séance — EMOM (préremplie) — Par exercice

Nœud [8795:14449](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8795-14449) · Contrat [CE-FMT-03](13%20–%20Contrats%20d’écran.md#ce-fmt-03). Capture du layout courant ; données illustratives.

![Composition séance — EMOM (préremplie) — Par exercice](images/formats-2026-10-14/figma-8795-14449.png)

<a id="format-8795-14681"></a>

#### Composition séance — Progression (préremplie) — Par alternance

Nœud [8795:14681](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8795-14681) · Contrat [CE-FMT-03](13%20–%20Contrats%20d’écran.md#ce-fmt-03). Capture du layout courant ; données illustratives.

![Composition séance — Progression (préremplie) — Par alternance](images/formats-2026-10-14/figma-8795-14681.png)

### Modales de paramètres d’exercice

<a id="format-8598-30059"></a>

#### Modification activité — Paramètres (modale) — Exercice Tabata

Nœud [8598:30059](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8598-30059) · Contrat [CE-FMT-04](13%20–%20Contrats%20d’écran.md#ce-fmt-04). F-01 : ancienne représentation effort par tour/récupération.

![Modification activité — Paramètres (modale) — Exercice Tabata](images/formats-2026-10-14/figma-8598-30059.png)

<a id="format-8598-30515"></a>

#### Modification activité — Paramètres (modale) — Exercice EMOM

Nœud [8598:30515](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8598-30515) · Contrat [CE-FMT-04](13%20–%20Contrats%20d’écran.md#ce-fmt-04). Capture du layout courant ; données illustratives.

![Modification activité — Paramètres (modale) — Exercice EMOM](images/formats-2026-10-14/figma-8598-30515.png)

<a id="format-8598-30873"></a>

#### Modification activité — Paramètres (modale) — Exercice AMRAP

Nœud [8598:30873](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8598-30873) · Contrat [CE-FMT-04](13%20–%20Contrats%20d’écran.md#ce-fmt-04). Capture du layout courant ; données illustratives.

![Modification activité — Paramètres (modale) — Exercice AMRAP](images/formats-2026-10-14/figma-8598-30873.png)

<a id="format-8598-31210"></a>

#### Modification activité — Paramètres (modale) — Exercice Death by

Nœud [8598:31210](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8598-31210) · Contrat [CE-FMT-04](13%20–%20Contrats%20d’écran.md#ce-fmt-04). Capture du layout courant ; données illustratives.

![Modification activité — Paramètres (modale) — Exercice Death by](images/formats-2026-10-14/figma-8598-31210.png)

<a id="format-8598-31560"></a>

#### Modification activité — Paramètres (modale) — Exercice For time

Nœud [8598:31560](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8598-31560) · Contrat [CE-FMT-04](13%20–%20Contrats%20d’écran.md#ce-fmt-04). F-02 : phrase « à chaque tour » incompatible avec l’échelle par tour validée.

![Modification activité — Paramètres (modale) — Exercice For time](images/formats-2026-10-14/figma-8598-31560.png)

<a id="format-8656-34070"></a>

#### Modification activité — Paramètres (modale) — Exercice Intervalles 30/30

Nœud [8656:34070](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8656-34070) · Contrat [CE-FMT-04](13%20–%20Contrats%20d’écran.md#ce-fmt-04). F-03 : valeur de travail 20 s incompatible avec la constante de format 30 s.

![Modification activité — Paramètres (modale) — Exercice Intervalles 30/30](images/formats-2026-10-14/figma-8656-34070.png)

<a id="format-8747-14451"></a>

#### Modification activité — Paramètres (modale) — Exercice Tabata — Par exercice

Nœud [8747:14451](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8747-14451) · Contrat [CE-FMT-04](13%20–%20Contrats%20d’écran.md#ce-fmt-04). Capture du layout courant ; données illustratives.

![Modification activité — Paramètres (modale) — Exercice Tabata — Par exercice](images/formats-2026-10-14/figma-8747-14451.png)

<a id="format-8795-14588"></a>

#### Modification activité — Paramètres (modale) — Exercice EMOM — Par exercice

Nœud [8795:14588](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=8795-14588) · Contrat [CE-FMT-04](13%20–%20Contrats%20d’écran.md#ce-fmt-04). Capture du layout courant ; données illustratives.

![Modification activité — Paramètres (modale) — Exercice EMOM — Par exercice](images/formats-2026-10-14/figma-8795-14588.png)

