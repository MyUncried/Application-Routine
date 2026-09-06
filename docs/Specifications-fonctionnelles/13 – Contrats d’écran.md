# 13 – Contrats d’écran

## 1. Objet

Ce chapitre transforme les spécifications fonctionnelles, les règles de navigation, le Design System et les frames Figma en critères déterministes de développement et de recette pour chaque écran de production.

Un contrat d’écran ne remplace ni Figma ni les autres chapitres. Il précise, pour une frame donnée, ce que l’implémentation doit afficher, calculer, rendre interactif et vérifier pour être déclarée conforme. Il vise notamment à empêcher :

- l’utilisation d’un logo, d’une icône ou d’un composant de substitution ;
- l’omission d’un texte, d’un contrôle ou d’un cadre obligatoire ;
- les valeurs de démonstration Figma conservées comme valeurs statiques ;
- les contrôles visibles mais inactifs, ou reliés à la mauvaise action ;
- le mauvais positionnement du titre, des commandes ou des zones fixes ;
- les chevauchements, troncatures et contenus masqués ;
- une navigation ou un état de données différent de celui spécifié.

Les contrats sont rédigés et validés progressivement, selon les tranches verticales de la roadmap. La présente version couvre les seize frames dont la construction principale est affectée à T01 ainsi que les neuf contrats fonctionnels de réouverture et de modification bout en bout de T01-S10. Ces contrats S10 réutilisent les frames T01 existantes et ne créent aucune représentation Figma supplémentaire.

## 2. Sources et ordre d’application

Pour développer ou valider une frame, les sources suivantes doivent être lues ensemble :

1. les règles métier et fonctionnelles des chapitres 08 à 11 ;
2. les écrans, la navigation et les règles adaptatives du chapitre 06 ;
3. les composants, tokens et règles techniques du chapitre 12 ;
4. le contrat de la frame dans le présent chapitre ;
5. la frame Figma identifiée par son ID, comme référence visuelle standard.

Le contrat rend les exigences contrôlables mais ne peut pas contredire une règle métier. En cas d’écart apparent :

- la donnée et le comportement métier proviennent des spécifications fonctionnelles ;
- la structure adaptative provient des règles communes et des Screen Shells ;
- le composant et ses états proviennent du Design System ;
- la composition visuelle propre à l’écran provient de la frame Figma ;
- le présent contrat précise les éléments obligatoires et les critères de recette.

Une ambiguïté résiduelle ne doit pas être résolue silencieusement par une valeur codée en dur ou un composant improvisé. Elle doit être signalée avant développement.

## 3. Règles communes à tous les contrats

### 3.1 Référence visuelle et données de démonstration

La surface Figma standard mesure `402 × 874` points logiques. Les coordonnées de la frame servent à la comparaison sur cette surface ; elles ne sont pas généralisées comme coordonnées absolues sur tous les appareils.

Les noms de Séance, catégories, dates, heures, durées, nombres d’Activités et nombres de Tours visibles dans Figma sont des données de démonstration. Ils doivent provenir du stockage local ou d’un calcul métier, sauf lorsqu’un contrat les déclare comme texte statique exact.

### 3.2 Présence des éléments obligatoires

Chaque élément déclaré obligatoire doit :

- être présent dans l’arbre rendu ;
- être visible dans son état attendu ;
- utiliser la bonne ressource, le bon composant et le bon libellé ;
- rester dans la zone sûre et ne pas être masqué par un autre élément ;
- conserver sa relation de layout sur les largeurs `360`, `402` et `440`.

Un élément invisible, transparent, placé hors écran ou recouvert est considéré comme absent.

### 3.3 Contrôles et zones tactiles

Un contrôle visible doit posséder une action réelle ou un état explicitement désactivé. Aucun contrôle ne peut seulement imiter visuellement le Figma.

Chaque action doit être testée sur sa cible réelle. Les zones tactiles distinctes ne se recouvrent pas et mesurent au minimum `48 × 48` points logiques, sauf exception documentée. L’icône visible peut être plus petite que sa cible.

### 3.4 Layout

Le contrat décrit prioritairement des relations : alignement, ordre, ancrage, largeur utile, espacement, zone fixe ou défilante. Les valeurs de la frame `402 × 874` sont utilisées lorsqu’elles sont nécessaires pour empêcher une interprétation erronée ou permettre une comparaison visuelle.

Les règles suivantes sont bloquantes :

- aucun élément obligatoire tronqué ou superposé ;
- aucun titre placé dans le contenu défilant lorsqu’il appartient à l’en-tête fixe ;
- aucun contenu interactif masqué par la navigation basse, une action fixe ou une Safe Area ;
- aucune ressource déformée ;
- aucune largeur de contenu calculée à partir d’une coordonnée fixe lorsque le Screen Shell ou le composant prévoit une largeur flexible.

### 3.5 Preuve de conformité

La validation d’un contrat comprend au minimum :

1. des tests fonctionnels des états, données et interactions ;
2. une capture de l’implémentation sur la surface ou l’émulateur de référence ;
3. une comparaison visuelle avec la frame Figma ;
4. un contrôle aux largeurs `360`, `402` et `440` ;
5. un contrôle d’agrandissement du texte sur les écrans qui contiennent des commandes ou des données variables.

Une capture seule ne prouve pas le fonctionnement des contrôles. Un test fonctionnel seul ne prouve pas la conformité visuelle.

## 4. Statuts de conformité

| Statut | Définition |
| --- | --- |
| Conforme | Tous les critères obligatoires sont satisfaits et les preuves sont disponibles. |
| Conforme avec écart accepté | Un écart explicite est documenté et validé ; il ne peut pas être déduit d’une simple différence d’implémentation. |
| Non conforme | Au moins un critère bloquant échoue. |
| Non testé | La réalisation existe mais tout ou partie des preuves manque. |

## 5. Contrats T01

### CE-T01-01 — Splash screen

#### Identification

| Propriété | Valeur |
| --- | --- |
| Frame Figma | `1992:469` — `Splash — Kodjo (proposition métallisée)` |
| Surface de référence | `402 × 874` |
| Screen Shell | Aucun ; exception explicite |
| Ressource logo obligatoire | `images branding/logo_icon_only_transparent_1024.png` |
| Entrée | Lancement ou relancement complet de l’application |
| Sortie | `Catalogue des séances` |
| Interaction utilisateur | Aucune |
| Défilement | Aucun |

#### Éléments obligatoires

| ID | Élément | Type | Valeur ou ressource exacte | Règle |
| --- | --- | --- | --- | --- |
| SPL-01 | Fond | Surface | Bleu KODJO provenant du token du Design System | Couvre toute la surface, sans bande ni écran blanc intermédiaire perceptible. |
| SPL-02 | Logo KODJO | Image | `images branding/logo_icon_only_transparent_1024.png` | Aucune ressource de substitution, aucun logo recréé, aucun étirement. |
| SPL-03 | Nom | Texte statique | `KODJO` | Casse et orthographe exactes. |
| SPL-04 | Signature | Texte statique | `Keep On. Do Just One.` | Ponctuation et casse exactes. |
| SPL-05 | Sous-titre | Texte statique | `Votre assistant du quotidien` | Orthographe et casse exactes. |

L’absence ou la substitution de SPL-02, SPL-03, SPL-04 ou SPL-05 rend l’écran non conforme.

#### Contrat de layout

Le splash utilise deux groupes indépendants afin que l’ancrage du sous-titre ne déplace pas le bloc de marque :

1. un bloc d’identité composé du logo, de `KODJO` et de la signature ;
2. le sous-titre ancré dans la partie basse de la zone sûre.

| Élément ou relation | Référence `402 × 874` | Règle adaptative obligatoire |
| --- | --- | --- |
| Axe horizontal | `x = 201` | Logo et trois textes centrés horizontalement dans la zone sûre. Tolérance de recette : `±2` points. |
| Logo | `200 × 200`, `x = 101`, `y = 278` | Ratio `1:1` conservé. Sur `402`, taille `200 × 200` avec une tolérance de `±2` points. Sur largeur différente, sa taille peut diminuer pour préserver les zones sûres mais ne peut pas être étirée. |
| `KODJO` | Sous le logo, `y = 478` | Appartient au bloc d’identité ; aucune superposition et aucun remplacement par une image contenant du texte. |
| Signature | `y = 531` | Centrée sous `KODJO` ; espacement vertical de référence conservé à `±2` points sur la surface standard. |
| Sous-titre | `y = 831`, hauteur `16`, fin à `27` points du bas de la frame | Ancré au-dessus de l’inset inférieur réel et centré. Il reste indépendant du bloc d’identité. Tolérance verticale de comparaison : `±4` points sur la référence. |

Sur une hauteur plus courte, les espaces flexibles diminuent avant la taille du logo. Aucun élément ne peut sortir de la zone sûre, être tronqué ou se superposer. Le mode paysage est hors périmètre du MVP tant qu’aucune règle spécifique n’est validée.

#### Comportement

1. Le splash devient visible immédiatement au lancement, sans dépendre du chargement de données secondaires.
2. L’application initialise l’accès minimal au stockage local pendant son affichage.
3. La durée nominale d’affichage est de `2,5 s`.
4. Une transition `DISSOLVE` de `0,3 s` ouvre automatiquement le Catalogue.
5. Si aucune Séance non archivée n’existe, le Catalogue affiche l’état vide `2117:86`.
6. Si au moins une Séance non archivée existe, le Catalogue affiche la liste par défaut `1992:9910`, alimentée par les données locales.
7. Une erreur secondaire ne doit pas bloquer indéfiniment le splash. Une erreur empêchant l’accès aux données suit la stratégie technique d’erreur ; elle ne doit pas être masquée par une navigation forcée avec des données fictives.

#### Recette minimale obligatoire

| Test | Précondition et action | Résultat attendu |
| --- | --- | --- |
| SPL-T01 | Lancer l’application | Les cinq éléments SPL-01 à SPL-05 sont visibles. |
| SPL-T02 | Comparer à la frame `1992:469` sur `402 × 874` | Bon logo, ordre, centrage, proportions, couleurs et espacements conformes. |
| SPL-T03 | Inspecter le logo | La ressource imposée est utilisée et son ratio reste `1:1`. |
| SPL-T04 | Lancer avec stockage sans Séance active | Transition vers l’état vide `2117:86`. |
| SPL-T05 | Lancer avec au moins une Séance active | Transition vers la liste `1992:9910` contenant les données réelles. |
| SPL-T06 | Tester sur `360`, `402` et `440` | Aucun élément absent, tronqué, déformé, superposé ou hors zone sûre. |

#### Non-conformités bloquantes spécifiques

- mauvais logo ou logo recréé ;
- absence de `KODJO`, de la signature ou du sous-titre ;
- texte incorporé dans l’image à la place de vrais nœuds de texte ;
- logo déformé ;
- écran blanc perceptible avant le splash ;
- splash bloqué ;
- destination imposée avec une liste statique ou un état vide statique.

---

### CE-T01-02 — Catalogue des séances — État vide

#### Identification

| Propriété | Valeur |
| --- | --- |
| Frame Figma | `2117:86` — `Catalogue des séances — État vide` |
| Surface de référence | `402 × 874` |
| Screen Shell | `Shell / Screen`, `Context=On`, `Bottom=Navigation` |
| Condition | Vue `Toutes` sélectionnée et aucune Séance non archivée |
| Entrées principales | Fin du splash ; retour d’un parcours ; sélection du filtre `Toutes` |
| Sortie principale | `Composition d’une séance — création` |

#### Structure et éléments obligatoires

| Zone | Élément | Valeur ou composant | Visibilité |
| --- | --- | --- | --- |
| Header fixe `0–92` sur la référence | Titre | `Catalogue des séances`, token `type.screenTitle` | Toujours |
| Context `92–207` | Contrôle segmenté | `Toutes`, `Planifiées`, `Archivées` | Toujours |
| Context | Action contextuelle | Icône `+` et libellé `Créer` | Toujours |
| Body `207–797` | Cadre d’état vide | Composant d’état vide, largeur utile | Lorsque le résultat du filtre est vide |
| Body | Message | `Vous verrez ici la liste de vos séances dès que vous aurez commencé à les créer.` | État vide de `Toutes` |
| Bottom Navigation fixe `797–874` | Navigation principale | `Séances`, `Calendrier`, `Suivi`, `Profil` et recherche distincte | Toujours |
| Bottom Navigation | Onglet actif | Icône et libellé `Séances` dans la capsule active | Toujours sur cet écran |

Le titre appartient à l’en-tête fixe. Il ne doit pas être ajouté dans le contenu défilant. Les icônes `+`, `Séances`, `Calendrier`, `Suivi`, `Profil` et `Recherche` proviennent des composants du Design System ; elles ne peuvent pas être omises ou remplacées par du texte improvisé.

#### Contrat de layout

| Élément ou relation | Référence Figma | Règle adaptative obligatoire |
| --- | --- | --- |
| Titre | `x = 24`, ligne de base dans le Header | Aligné sur la marge horizontale du Shell ; `16` en compact, `24` à partir de `390`. Header fixe. |
| Contrôle segmenté | `x = 24`, `y = 104`, `354 × 42` | Occupe la largeur utile. Trois segments égaux ; libellés centrés dans leur segment. |
| Action `Créer` | cadre visuel `90 × 32`, centré à `y = 162` | Groupe centré horizontalement. Cible tactile réelle au moins `48` points de haut sans recouvrir le contrôle segmenté. |
| Cadre d’état vide | `x = 36`, `y = 385`, `330 × 96` | Centré dans la largeur utile ; hauteur extensible si le texte grandit. Il ne dépend pas d’une coordonnée absolue sur les autres hauteurs. |
| Message | marge interne horizontale `20`, centré | Centré horizontalement et verticalement dans le cadre, multiligne, jamais tronqué. |
| Navigation basse | `y = 797`, hauteur de région `77` | Fixe au-dessus de l’inset inférieur réel. Le Body s’arrête avant elle. |

Seule la zone Body peut défiler lorsque la hauteur ou l’agrandissement du texte l’exige. Le Header, le Context et la Bottom Navigation restent fixes. Aucun contenu ne passe sous la navigation basse.

#### Données et conditions d’état

- La sélection initiale est `Toutes`.
- `Toutes` interroge les Séances non archivées.
- L’état vide est produit par un résultat réellement vide du stockage local ; il n’est pas commandé par un booléen de démonstration indépendant des données.
- Une Séance archivée n’empêche pas l’état vide de `Toutes`.
- Au retour d’une création enregistrée, la requête est réexécutée et l’écran devient la liste par défaut.
- Au retour d’une création abandonnée, l’état vide reste affiché.

#### Contrôles et résultats attendus

| Contrôle | État | Action attendue |
| --- | --- | --- |
| `Toutes` | Sélectionné | Recharge les Séances non archivées. |
| `Planifiées` | Disponible | Affiche les Séances ayant au moins une Routine ; utilise son état vide si le résultat est vide. |
| `Archivées` | Disponible | Affiche uniquement les Séances archivées ; utilise son état vide si le résultat est vide. |
| `Créer` | Disponible | Ouvre `Composition d’une séance` en mode création, sans ID de Séance existante. |
| `Séances` | Actif | Conserve le Catalogue et son état courant. |
| `Calendrier` | Présent mais désactivé dans la livraison partielle T01 | Ne produit aucune navigation ; porte l’état désactivé du composant et l’état d’accessibilité correspondant. Devient actif dans la tranche qui livre le Calendrier. |
| `Suivi` | Présent mais désactivé dans la livraison partielle T01 | Ne produit aucune navigation ; porte l’état désactivé du composant et l’état d’accessibilité correspondant. Devient actif dans la tranche qui livre le Suivi. |
| `Profil` | Présent mais désactivé dans la livraison partielle T01 | Ne produit aucune navigation ; porte l’état désactivé du composant et l’état d’accessibilité correspondant. Devient actif dans la tranche qui livre le Profil. |
| Recherche | Présente mais désactivée dans la livraison partielle T01 | Ne produit aucune navigation et ne peut pas afficher de faux résultats ; porte l’état désactivé du composant et l’état d’accessibilité correspondant. Devient active dans la tranche qui livre la recherche globale. |

La désactivation ci-dessus est un état transitoire de recette de T01, pas le comportement du MVP terminé. Un contrôle non livré ne doit pas être rendu comme disponible puis rester silencieusement inactif.

#### Recette minimale obligatoire

| Test | Précondition et action | Résultat attendu |
| --- | --- | --- |
| CAT-V-T01 | Stockage sans Séance non archivée | Titre, trois filtres, `Créer`, message et navigation complète présents. |
| CAT-V-T02 | Toucher `Créer` | Ouverture du parcours de création ; aucun bouton factice. |
| CAT-V-T03 | Enregistrer la première Séance puis revenir | Disparition du message et affichage d’une carte alimentée par les données enregistrées. |
| CAT-V-T04 | Abandonner la première création | Retour à l’état vide sans carte fictive. |
| CAT-V-T05 | Stockage contenant seulement une Séance archivée | `Toutes` reste vide ; `Archivées` contient la Séance. |
| CAT-V-T06 | Comparer à `2117:86` sur `402 × 874` | Titre, cadres, contrôles, icônes, alignements et zones fixes conformes. |
| CAT-V-T07 | Tester `360`, `402`, `440` et texte agrandi | Aucun chevauchement ; message complet ; navigation et action atteignables. |

#### Non-conformités bloquantes spécifiques

- titre absent, dupliqué ou placé dans le Body ;
- filtre affiché sans changer la requête ;
- `Créer` inactif ou sans icône `+` ;
- message différent, tronqué ou remplacé par des cartes de démonstration ;
- navigation basse ou icône de recherche manquante ;
- élément du Body masqué par la navigation fixe ;
- état vide affiché alors que la requête `Toutes` retourne une Séance active.

---

### CE-T01-03 — Catalogue des séances — Liste par défaut

#### Identification

| Propriété | Valeur |
| --- | --- |
| Frame Figma | `1992:9910` — `Catalogue des séances — Liste par défaut` |
| Surface de référence | `402 × 874` |
| Screen Shell | `Shell / Screen`, `Context=On`, `Bottom=Navigation` |
| Condition | Vue `Toutes` sélectionnée et au moins une Séance non archivée |
| État initial des cartes | Condensé |
| Tri | Dernière utilisation décroissante ; dernière modification pour une Séance jamais exécutée |

#### Structure commune obligatoire

Le Header, le Context et la Bottom Navigation sont identiques au contrat CE-T01-02. Le passage entre l’état vide et la liste ne doit modifier ni la position du titre, ni le contrôle segmenté, ni l’action `Créer`, ni la navigation basse. Seul le contenu du Body change.

#### Données d’une carte condensée

| Élément | Source | Condition et format |
| --- | --- | --- |
| Identifiant de carte | `Séance.id` | Utilisé pour toutes les actions ; jamais déduit de l’index visuel. |
| Barre latérale | `Séance.couleur` | Toujours ; couleur réelle enregistrée. |
| Nom | `Séance.nom` | Toujours ; une ou deux lignes, puis ellipse si nécessaire. |
| Métadonnées Catégories/Zones | Associations de Catégories et Zones corporelles des Exercices | Une seule ligne sous le nom. Catégories dans la couleur de la Séance ; union dédupliquée des Zones de tous les Exercices ; ` : ` entre les groupes seulement s’ils existent tous les deux ; ellipse si le contenu dépasse. |
| Nombre d’Activités | Composition calculée | Toujours ; accord singulier/pluriel. |
| Durée estimée | Calcul métier de la durée déterminable | Toujours selon les règles fonctionnelles ; jamais une chaîne statique. |
| Nombre de Tours | Composition calculée | Affiché selon le format défini ; accord singulier/pluriel. |
| Prochaine occurrence | Calcul de planification | Uniquement si elle existe ; date et heure relatives selon le formateur commun. |
| Chevron | Instance de `Controls / Disclosure — Source exact` : `State=Collapsed` (`2537:1033`) ou `State=Expanded` (`2537:1038`) | Toujours ; état condensé au premier affichage de la liste par défaut. |
| Démarrer | Composant d’action | Actif seulement si la Séance contient au moins un Exercice valide. |

Les exemples Figma `Renforcement du genou`, `Dos et mobilité`, `Etirements`, leurs catégories, leurs métriques et `Demain à 18 h` ne sont jamais utilisés comme valeurs de production par défaut.

#### Composition et layout d’une carte

| Élément ou relation | Référence Figma | Règle adaptative obligatoire |
| --- | --- | --- |
| Liste | Body à partir de `y = 207` | Défile verticalement dans le Body, entre le Context et la Bottom Navigation. |
| Carte | largeur `354`, marge `24` | Occupe la largeur utile ; marge `16` en compact et `24` à partir de `390`. Hauteur déterminée par son contenu. |
| Écart entre cartes | Le gabarit Figma illustre la composition ; la règle commune du chapitre 06 fixe l’écart à `8` | Utilise le token de liste compacte du Design System ; valeur identique entre toutes les cartes. |
| Barre de couleur | largeur visuelle `4`, bord gauche | Suit la hauteur réelle de la carte et ne recouvre pas son contenu. |
| Contenu textuel | marge gauche interne après la barre | Ne passe jamais sous les actions ancrées à droite. |
| Chevron | instance DSF `Controls / Disclosure — Source exact`, cible `48 × 48`, ancrée à droite avant Démarrer ; cadre visible centré `28 × 28`, rayon `6`, fond `#FBFCFF` ; fermé : bordure `#D6D9E3` sur `1` point et chevron bas `#8282F2` ; ouvert : bordure `#8283F2` sur `2` points et chevron haut `#8283F2` | Zone indépendante de la zone principale et de Démarrer. Aucune copie graphique locale n’est admise. |
| Démarrer | cible `48 × 48`, ancrée au bord droit | Zone indépendante ; icône centrée dans sa cible. |
| Fin de liste | au-dessus de la Bottom Navigation | Espace final d’au moins `16` points, en plus de l’inset applicable. |

Le titre, le Context et la Bottom Navigation restent fixes pendant le défilement. Les cartes ne passent pas sous la navigation. Une augmentation de la hauteur d’une carte décale les cartes suivantes ; elle ne crée ni chevauchement ni position absolue persistante.

#### Zones d’interaction d’une carte active

| Zone | Action | Résultat |
| --- | --- | --- |
| Zone principale | Toucher | Ouvre `Composition d’une séance` en modification avec le bon `Séance.id`. |
| Chevron | Toucher | Déploie uniquement la carte concernée ; un second toucher la replie. |
| Démarrer | Toucher | Ouvre l’état initial d’Exécution avec le bon `Séance.id` ; ne démarre pas automatiquement la première Activité. |
| Carte | Glissement gauche | Révèle les actions disponibles dans la tranche courante conformément aux contrats de leurs états dédiés. |

Les zones sont mutuellement exclusives. Toucher le chevron ne doit pas ouvrir la modification. Toucher Démarrer ne doit ni déployer la carte ni ouvrir la modification. Une action utilise l’identifiant de la carte touchée, même après tri ou rafraîchissement de la liste.

Dans T01, une action secondaire qui n’est pas encore livrée ne doit pas apparaître comme disponible. Les actions `Planifier`, `Dupliquer` et `Archiver` deviennent obligatoires dans les tranches et contrats qui livrent leurs parcours complets.

#### Chargement, rafraîchissement et états

1. À l’ouverture, la liste interroge le stockage local et affiche les Séances non archivées.
2. Le tri est appliqué aux données, pas à l’ordre des exemples Figma.
3. Au retour d’une création ou d’une modification enregistrée, la requête et les calculs de cartes sont réexécutés.
4. Si la dernière Séance active disparaît de `Toutes`, le Body bascule vers CE-T01-02.
5. Une Séance sans Exercice peut être ouverte et modifiée, mais son action Démarrer est désactivée selon le composant prévu ; aucune navigation d’Exécution n’est produite.
6. Le défilement reste utilisable quel que soit le nombre de cartes.
7. Aucune donnée fictive n’est injectée pour remplir visuellement la liste.

#### Recette minimale obligatoire

| Test | Précondition et action | Résultat attendu |
| --- | --- | --- |
| CAT-L-T01 | Créer trois Séances avec des noms, couleurs et compositions différents | Trois cartes reflètent exactement les données et calculs enregistrés. |
| CAT-L-T02 | Modifier le nom, la couleur ou la Composition d’une Séance | La carte correspondante est rafraîchie sans valeur résiduelle. |
| CAT-L-T03 | Toucher successivement la zone principale, le chevron et Démarrer | Chaque zone produit uniquement son action propre avec le bon ID. |
| CAT-L-T04 | Tester une Séance sans Exercice valide | Carte visible et modifiable ; Démarrer indisponible et sans navigation. |
| CAT-L-T05 | Ajouter assez de Séances pour dépasser la hauteur | Défilement du Body ; Header, Context et Bottom Navigation fixes ; dernière carte accessible. |
| CAT-L-T06 | Archiver ou retirer la dernière Séance active | Bascule vers l’état vide sans carte de démonstration. |
| CAT-L-T07 | Comparer à `1992:9910` sur `402 × 874` | Structure, cadres, couleurs, titres, métriques, chevrons, icônes Démarrer et alignements conformes. |
| CAT-L-T08 | Tester `360`, `402`, `440`, noms longs et texte agrandi | Aucun chevauchement ni contenu masqué ; cibles tactiles distinctes et atteignables. |
| CAT-L-T09 | Rechercher dans le code ou inspecter les données rendues | Aucun exemple Figma utilisé comme donnée de production statique. |

#### Non-conformités bloquantes spécifiques

- carte alimentée par des valeurs statiques ou par l’index visuel ;
- mauvaise Séance ouverte ou démarrée après un tri ;
- chevron, icône Démarrer ou barre de couleur manquants ;
- contrôle visible mais inactif ;
- Démarrer actif sur une Séance non exécutable ;
- titre ou Context qui défile avec la liste ;
- carte, texte ou action recouvert par une autre zone ;
- dernière carte inaccessible sous la navigation ;
- données archivées visibles dans `Toutes` ;
- différences de structure entre l’état vide et la liste hors contenu du Body.

### CE-T01-04 — Nouvelle séance — État initial

#### Identification

| Propriété | Valeur |
| --- | --- |
| Frame Figma | `2028:11137` — `Nouvelle séance — État initial` |
| Screen Shell | `Shell / Screen`, `Bottom=Action` |
| Condition | Ouverture de la création sans brouillon préexistant |
| Sorties | Création d’Activité ; abandon ; Catégories lorsque la Composition devient valide |

#### Structure et données initiales obligatoires

L’écran affiche, dans cet ordre : en-tête fixe avec Retour et `Composition d’une séance` ; champ `Nom de la séance` et sélecteur de couleur ; action vectorielle `Ajouter une activité` ; `Compte à rebours initial` à `10 secondes` ; conteneur `Nombre de tours` à `1`, dont le sous-libellé affiche le résumé calculé `0 activité · 0 min` ; `Fin de séance` à `5 s` ; action finale. Ce résumé compte et totalise exclusivement les Activités : les durées du Compte à rebours initial et de la Fin de séance en sont toujours exclues. Aucun résumé séparé n’est affiché au bas de l’écran.

Dans tous les états de cet écran, l’icône du conteneur Tour est une instance de `Icon / Tour` (`3066:4685`), issue de la référence validée `Nouvelle séance — Nom renseigné` (`2028:12003`, ancien nœud source `2028:12040`). L’actif de développement unique est `assets/icons/icon-tour.svg`, clé `icon.tour` ; aucune copie vectorielle locale n’est admise.

Les valeurs `10 s`, `x1` et `5 s` sont les valeurs initiales métier. Le nom est vide. Le champ `Nom de la séance` réutilise `Session / Name Field — Source exact` (`2537:1480`) : `354 × 42`, fond transparent laissant apparaître la couleur de séance et liseré blanc intérieur `1` lié à `color/session-name-border`. La couleur proposée par défaut est une vraie valeur du brouillon et non un simple décor. Le Cycle technique reste invisible.

Sur la référence, l’en-tête occupe `0–92`, le bloc nom/couleur `92–154`, le contexte `154–207`, le corps commence à `207` et l’action finale occupe `790–874`. L’en-tête et l’action finale restent fixes ; le corps défile. Les lignes structurelles ont une hauteur visuelle de `60`, le Tour est contenu dans le cadre prévu par le Design System et le résumé reste intégré sous `Nombre de tours`.

| Contrôle | Résultat |
| --- | --- |
| Retour | Ouvre CE-T01-08 si le brouillon contient une donnée à perdre ; sinon revient directement au Catalogue. |
| Nom | Donne le focus au champ et met à jour le brouillon à chaque changement. |
| Couleur | Ouvre CE-T01-06, sans navigation. |
| `Ajouter une activité` | Ouvre CE-T01-13 en création d’un Exercice par défaut. |
| Compte à rebours | Ouvre CE-T01-07. |
| `x1` | Contrôle présent ; la modification du nombre de Tours appartient à T03 et ne doit pas être simulée dans la recette partielle T01. |
| Fin de séance | Ouvre CE-T01-10. |
| Action finale | Affichée désactivée tant que le nom et au moins un Exercice valide ne sont pas présents. Son libellé suit le composant Figma de l’état : `Enregistrer` avant validation complète, puis `Continuer` lorsque la Composition est valide. |

Tests bloquants : valeurs initiales exactes ; aucune Activité fictive ; aucune mention de Cycle ; bouton Ajouter avec l’icône vectorielle `action-add` ; action finale réellement désactivée ; clavier ne masquant ni le champ ni l’action ; conformité visuelle à `2028:11137` sur `402 × 874`.

---

### CE-T01-05 — Nouvelle séance — Nom renseigné

#### Identification et héritage

| Propriété | Valeur |
| --- | --- |
| Frame Figma | `2028:12003` — `Nouvelle séance — Nom renseigné` |
| Hérite de | CE-T01-04 |
| Condition | Nom non vide, aucune Activité |

Le champ affiche la valeur réellement saisie. `Renforcement du genou` est uniquement l’exemple Figma. Le résumé intégré sous `Nombre de tours` reste `0 activité · 0 min` et l’action finale reste désactivée : renseigner le nom ne suffit jamais à rendre la Composition valide. Effacer ou réduire le nom à des espaces ramène à l’état vide du champ.

La saisie ne doit déplacer ni le sélecteur de couleur ni l’action Ajouter. Un nom long utilise l’espace disponible sans recouvrir la couleur ; il est limité conformément au modèle de données et reste éditable avec le clavier ouvert.

Tests bloquants : persistance exacte de la saisie dans le brouillon ; absence de donnée d’exemple codée en dur ; validation toujours impossible sans Exercice ; Retour ouvrant CE-T01-08 ; conformité à `2028:12003`.

---

### CE-T01-06 — Composition — Sélecteur de couleur ouvert

#### Identification

| Propriété | Valeur |
| --- | --- |
| Frame Figma | `2028:11921` — `Composition d’une séance — sélecteur couleur ouvert` |
| Déclencheur | Appui sur le contrôle couleur dans CE-T01-04, 05 ou 09 |
| Composant | `Popover — Choisir une couleur — 12 couleurs` |

La palette de `12` couleurs est une grille `4 × 3`. Sur la référence, elle mesure `174 × 132`, est ancrée au contrôle déclencheur et commence vers `x=204, y=145`. Elle ne grise pas le reste de l’écran, ne crée pas une route et ne modifie pas la disposition du contenu sous-jacent.

Toucher une couleur met à jour immédiatement `Séance.couleur`, ferme la palette et actualise le contrôle. La couleur sélectionnée possède un indicateur distinct de la couleur seule. Toucher hors du popover ou le déclencheur le ferme sans modifier la valeur. Une seule couleur est active. Le popover reste intégralement dans la zone sûre ; sur largeur compacte, il se réaligne plutôt que de déborder.

Tests bloquants : exactement 12 valeurs provenant du Design System ; grille et indicateur visibles ; sélection persistée dans le brouillon ; fermeture sans perte du reste de la Composition ; aucune couleur arbitraire ou saisie libre ; conformité à `2028:11921`.

---

### CE-T01-07 — Compte à rebours initial — Sélecteur ouvert

#### Identification

| Propriété | Valeur |
| --- | --- |
| Frame Figma | `2028:11375` — `Modal — Paramétrer le compte à rebours initial` |
| Nature | Contrôle intégré, malgré le nom historique de la frame |
| Déclencheur | Appui sur la ligne `Compte à rebours initial` |

Le composant `Picker / Popover — Source exact`, variante `Type=Duration` (`2537:1110`), mesure `330 × 190` : barre d’actions `40` et primitive native `150`. Il comporte deux roulettes, les unités `min` et `s`, une valeur centrale sélectionnée et deux valeurs voisines de chaque côté. Les secondes vont de `00` à `59` par pas de `1`. Deux cadres gris distincts `56 × 34`, rayon `17`, couvrent uniquement les chiffres centrés ; les unités restent hors des cadres.

Le reste de la Composition demeure visible et ne reçoit pas d’action tant qu’un geste appartient aux roulettes. Chaque changement effectif de cran déclenche un unique retour haptique léger. La valeur est mise à jour uniquement dans le brouillon local pendant le défilement ; le sous-libellé de la ligne ne change qu’après Confirmer. La confirmation actualise uniquement la carte `Compte à rebours initial` : elle ne modifie ni le nombre ni la durée affichés dans la synthèse sous `Nombre de tours`. `0 s` rend la phase instantanée sans supprimer l’élément structurel.

Toucher un chiffre ou la zone sélectionnée ne ferme pas le sélecteur. Annuler ferme sans enregistrer ; Confirmer enregistre exactement les valeurs centrées puis ferme. L’ouverture d’un autre sélecteur ferme celui-ci sans confirmer son brouillon. Le contrôle est rendu dans un overlay centré dans la zone utile, indépendamment du déclencheur et de la position de défilement. Le voile atténue et bloque le fond, y compris son défilement, et la roulette ne peut pas être masquée par l’action finale.

Tests bloquants : deux roulettes fonctionnelles ; bornes et pas conformes aux règles métier ; retour haptique une fois par cran ; conservation de `0 s` ; fermeture et réouverture sur la dernière valeur ; conformité à `2028:11375`.

---

### CE-T01-08 — Abandonner la création de la séance

#### Identification et contenu exact

| Propriété | Valeur |
| --- | --- |
| Frame Figma | `2028:11298` — `Modal — Abandonner la création de la séance` |
| Composant | `Overlay / Decision Dialog`, variante primaire/destructive à deux actions (`2590:2960`) |
| Déclencheur | Retour depuis une nouvelle Composition contenant des données temporaires |

La Composition reste visible, assombrie et non interactive. Le dialogue flottant mesure `354 × 194`, possède un rayon de `18` et est centré dans l’écran.

| Élément | Texte exact |
| --- | --- |
| Titre | `Abandonner la création ?` |
| Message | `Les informations saisies seront perdues et la séance ne sera pas créée.` |
| Action non destructive | `Annuler` |
| Action destructive | `Confirmer` |

`Annuler` ferme le dialogue et restitue le brouillon à l’identique, focus et défilement inclus lorsque possible. `Confirmer` supprime uniquement la nouvelle Séance et son contenu temporaire, puis revient au Catalogue dont les données sont rechargées. Le geste Retour système est traité comme `Annuler` ; toucher le voile ne valide jamais l’action destructive.

Le dernier paragraphe est séparé des actions par `spacing/16`. Les deux boutons `147 × 48` sont alignés ; `Annuler` est gris neutre et `Confirmer` rouge avec texte blanc. Chaque libellé est centré horizontalement et verticalement.

Tests bloquants : quatre libellés exacts ; fond réellement bloqué ; aucune suppression avant confirmation ; restauration exacte après Annuler ; suppression complète du brouillon après Confirmer ; absence d’effet sur une Séance existante ; conformité à `2028:11298`.

---

### CE-T01-09 — Composition d’une séance — Séance simple renseignée

#### Identification

| Propriété | Valeur |
| --- | --- |
| Frame Figma | `2028:11700` — `Composition d’une séance — sans Cycle` |
| Condition | Nom, couleur et au moins un Exercice valide |
| Hérite de | CE-T01-04 à 07 |

La Composition affiche les données réelles dans l’ordre enregistré : Compte à rebours ; Activités avant le Tour ; Tour ; Activités du Tour ; Activités après le Tour ; Fin de séance. Le Cycle technique reste invisible et vaut toujours `1`. Dans T01, le Tour reste `x1` dans les données de recette même si la frame illustre `x3`.

Chaque ligne d’Exercice affiche son nom et le résumé défini par D-095. La Consigne et les Zones corporelles n’y figurent pas. La ligne utilise le composant `Composition / Activity Row` ; son slot structurel gauche `28 × 28` contient exclusivement une instance de `Icon / Structure / Movable` (`3066:4676`) : actif `assets/icons/composition-reorder.svg`, dessin `20 × 20`, opacité `50 %`, couleur `color.iconNeutral`. Le token `icon.compact = 16 × 16` et toute copie locale historique `icon/réorganiser` sont interdits pour cette poignée. Toucher le corps de la ligne ouvre l’Activité en modification. Les actions par glissement non livrées en T01 ne doivent pas apparaître actives.

Le bouton `Ajouter une activité` reste unique et placé au-dessus de la structure. Une nouvelle Activité est insérée après le Compte à rebours, avant le Tour, puis peut être déplacée. Les éléments structurels ne sont ni déplaçables ni supprimables. Deux Exercices successifs sans pause produisent l’avertissement non bloquant prévu.

Le résumé intégré au conteneur Tour est calculé exclusivement depuis les Activités ; `5 activités · 19 min` est un exemple. Il exclut toujours la durée du Compte à rebours initial et celle de la Fin de séance, éléments structurels hors Tour. Il est placé sous `Nombre de tours`, au format du sous-libellé des cartes (`11/13`, gris secondaire, écart `4`). Le groupe de textes est centré verticalement avec le sélecteur `66 × 34`. `Continuer` est actif et ouvre CE-T01-11 sans enregistrer de données fictives. La liste centrale défile entre l’en-tête et l’action fixe ; aucun élément ne passe sous l’action.

Tests bloquants : ordre et calculs issus du brouillon ; Tour `x1` pour T01 ; aucune ligne Cycle ; ajout, ouverture et réorganisation avec le bon ID ; chaque carte d’Activité utilise `Icon / Structure / Movable` (`3066:4676`) en `20 × 20` dans un slot `28 × 28`, sans icône locale `16 × 16` ; résumés et accords exacts ; activation conditionnelle de Continuer ; conformité à `2028:11700`.

---

### CE-T01-10 — Fin de séance — Sélecteur ouvert

#### Identification

| Propriété | Valeur |
| --- | --- |
| Frame Figma | `2028:11457` — `Modal — Paramétrer la fin de séance` |
| Nature | Contrôle intégré, malgré le nom historique de la frame |
| Déclencheur | Appui sur `Fin de séance` |

Le composant et les règles sont identiques à CE-T01-07. La variante `Type=Duration` mesure `330 × 190` et sélectionne initialement `00 min 05 s`. Elle est rendue dans le même overlay centré et bloquant que CE-T01-07, indépendamment de la ligne Fin de séance et du défilement.

La valeur est stockée séparément du Compte à rebours initial. `0 s` rend la phase instantanée mais ne supprime ni la ligne ni l’élément du Plan d’Exécution. Une modification de ce contrôle ne change aucune Activité et ne modifie ni le nombre ni la durée affichés dans la synthèse sous `Nombre de tours` ; seule la carte `Fin de séance` est actualisée.

Tests bloquants : valeur initiale `5 s` ; indépendance avec le Compte à rebours ; deux roulettes et haptique conformes ; dernière valeur conservée ; aucune superposition avec l’action finale ; conformité à `2028:11457`.

---

### CE-T01-11 — Catégories de la séance

#### Identification

| Propriété | Valeur |
| --- | --- |
| Frame Figma | `2028:11204` — `Nouvelle séance — Catégories` |
| Entrée | `Continuer` depuis une Composition valide |
| Sortie | Catalogue après enregistrement |
| Screen Shell | `Shell / Screen`, `Bottom=Action` |

L’en-tête fixe affiche Retour et `Catégories de la séance`. Le corps affiche directement le libellé `Catégories`, les Catégories réelles sous forme de tags multisélection, l’action `+ Créer une catégorie` et l’action fixe `Enregistrer la séance`. Aucun texte introductif supplémentaire n’est affiché.

Les libellés visibles dans la frame sont des données du référentiel, pas une liste codée dans l’écran. Les Catégories prédéfinies suivent leur `displayOrder`, puis les Catégories personnalisées sont affichées par date de création croissante. Une sélection ne change pas leur position et aucune réorganisation manuelle n’est disponible dans le MVP. Chaque tag est une instance du composant DSF `Selection / Category Tag` (`3302:4166`), variante `State=Unselected` ou `State=Selected`. Les tags passent automatiquement à la ligne dans la largeur utile avec `8` points d’écart horizontal. Leur pilule visuelle mesure `30` points de haut et est centrée dans une cible tactile de hauteur minimale `48`; deux rangées utilisent donc un pas vertical minimal de `48` et leurs cibles ne se chevauchent pas. L’état sélectionné combine le style du composant et un indicateur accessible ; il ne repose pas uniquement sur la couleur.

Toucher un tag inverse uniquement son association temporaire. Zéro, une ou plusieurs Catégories sont autorisées. Une Catégorie `NEW` est sélectionnée automatiquement à sa création ; la désélection ne la supprime pas du brouillon, elle reste visible et peut être resélectionnée sans doublon. Retour ramène à la Composition en conservant séparément les Catégories temporaires existantes et les identifiants sélectionnés. `Créer une catégorie` ouvre CE-T01-12. `Enregistrer la séance` réalise une transaction unique comprenant la Séance, sa Composition, les nouvelles Catégories sélectionnées du brouillon et leurs associations, puis recharge CE-T01-03. Un double appui ne peut créer aucun doublon.

En cas d’échec, aucune donnée partielle n’est conservée : l’écran reste affiché, le brouillon complet est conservé, l’action est réactivée et le message `La séance n’a pas pu être enregistrée. Réessayez.` est affiché. Une nouvelle tentative réutilise exactement le même brouillon.

Tests bloquants : multisélection réelle ; ordre prédéfini puis personnalisé stable ; aucune réorganisation manuelle ; enregistrement sans Catégorie autorisé ; référentiel chargé depuis les données ; Retour non destructif ; transaction unique et retour sur la bonne carte ; échec sans donnée partielle, avec brouillon conservé, action réactivée et message exact ; action finale toujours atteignable avec défilement, clavier et texte agrandi ; conformité à `2028:11204`.

---

### CE-T01-12 — Catégories — Nouvelle catégorie inline

#### Identification

| Propriété | Valeur |
| --- | --- |
| Frame Figma | `2028:11248` — `Catégories de la séance — nouvelle catégorie inline` |
| Déclencheur | `+ Créer une catégorie` dans CE-T01-11 |
| Nature | État intégré ; aucune nouvelle route ni modale |

L’action de création est remplacée à son emplacement par une ligne contenant le champ `Nom de la catégorie`, `Annuler` et `Ajouter`. Le champ reçoit immédiatement le focus et le clavier ne masque ni la ligne ni `Enregistrer la séance`.

`Annuler` ferme la ligne sans créer de donnée ni modifier les sélections. `Ajouter` reste désactivé pour une valeur vide ou composée d’espaces et la saisie est limitée à `40` caractères après trim. Après normalisation canonique de comparaison, un nom déjà existant ne crée pas de doublon : la Catégorie existante est sélectionnée et la ligne se ferme. Un nom valide et nouveau ajoute une Catégorie personnalisée `NEW` au brouillon, la place après les Catégories prédéfinies et après les personnalisées plus anciennes, la sélectionne pour la Séance et ferme la ligne. Sa désélection ultérieure ne la supprime pas : elle reste visible et resélectionnable. Aucune Catégorie nouvelle n’est persistée avant `Enregistrer la séance` ; seules les nouvelles Catégories sélectionnées participent à la transaction finale.

Retour système avec le clavier ouvert ferme d’abord le clavier ; un second Retour suit CE-T01-11. Les erreurs restent attachées au champ et ne déplacent pas les tags par position absolue.

Tests bloquants : focus initial ; Annuler sans écriture ; Ajouter désactivé à vide ; limite de `40` caractères après trim ; ajout au brouillon et sélection d’un nom valide ; ordre stable ; sélection automatique de l’existante en cas de doublon normalisé ; aucune persistance avant l’enregistrement final ; aucun doublon ni Catégorie orpheline après abandon ou échec ; conservation de la Composition ; action Enregistrer atteignable ; conformité à `2028:11248`.

---

### CE-T01-13 — Création d’un Exercice — Paramètres essentiels

#### Identification

| Propriété | Valeur |
| --- | --- |
| Frame Figma | `1992:9132` — `Création activité — Durée / Pause / Séries — avec mode` |
| Entrée | `Ajouter une activité` depuis la Composition |
| Type initial | `Exercice` |
| Mode initial T01 | `Durée` |

L’en-tête fixe utilise le titre fonctionnel `Ajouter une activité` et un contrôle Retour. En modification, le même écran utilise `Modifier une activité`. Un bandeau bleu `402 × 115`, accolé sans intervalle au séparateur de l’en-tête, affiche `Séance · {nom de la séance}` en Inter Regular `14/17` puis, à `spacing/24`, le champ Nom transparent à liseré blanc. La valeur du champ adopte le token canonique `KODJO / Screen title` (`20/24`, Semi Bold), exactement comme `Nom de la séance`. Le shell porte explicitement un padding inférieur `spacing/16` (`16` points) entre le bas du champ et la limite du bandeau ; cette marge ne doit jamais être obtenue indirectement par l’interligne.

Le reste du corps affiche, dans cet ordre : titre `Type d’activité` et segment `Exercice / Récupération` ; titre `Mode d’exécution` et segment `Durée / Répétition` ; titre `Paramètres de l’activité` ; contrôles `Durée`, `Pause`, `Séries` ; cadre récapitulatif ancré en bas. L’action finale fixe suit le libellé Figma `Valider`.

Les deux contrôles segmentés divisent strictement leur largeur intérieure en deux parts égales. La rangée des trois paramètres reste lisible ; en largeur compacte elle peut se réorganiser sans réduire les cibles sous `48 × 48`. Le récapitulatif occupe la largeur utile, possède des marges internes, grandit avec le texte et reste à `spacing/24` au-dessus de l’action finale.

En T01, seul le parcours Exercice en mode Durée est requis de bout en bout. Les choix Récupération et Répétition restent visibles selon la frame mais doivent porter un état explicitement désactivé jusqu’aux tranches qui livrent leurs contrats ; ils ne peuvent ouvrir un écran partiel. `Séries` reste fixé à `1` pour la séance simple T01. Le nom et une durée strictement positive sont obligatoires. La Pause peut valoir `0 s`.

`Durée` ouvre CE-T01-14. Les contrôles Pause et Séries n’ouvrent pas de sélecteur non livré dans T01. `Valider` reste désactivé tant que l’Exercice est invalide ; lorsqu’il est valide, il ouvre CE-T01-15 en conservant les paramètres dans le brouillon d’Activité.

Le récapitulatif est calculé et suit les valeurs confirmées ; le texte de la frame n’est jamais statique. Il utilise `KODJO / Body` (`14/20`) et ne commence jamais par le type d’Activité ni par le mode. En Durée : `{N} série(s) de {activité} de {durée}`. En Répétitions : `{N} série(s) de {X} {activité}`. Si la pause est non nulle, ajouter `, avec {pause} de pause`, puis ` entre les séries` seulement si `N > 1`. Retour avec modifications non enregistrées ouvre CE-T01-16 ; aucune donnée ne peut être supprimée silencieusement.

Tests bloquants : titre fonctionnel ; contexte de Séance présent dans le bandeau ; champ Nom transparent et typographie conforme ; segments égaux et états accessibles ; synthèse calculée et ancrée en bas ; aucune valeur Figma statique ; `Séries=1` pour T01 ; validation conditionnelle ; brouillon transmis à l’étape 2 ; conformité à `1992:9132`.

---

### CE-T01-14 — Création d’un Exercice — Durée ouverte

#### Identification

| Propriété | Valeur |
| --- | --- |
| Frame Figma | `1992:9430` — `Création activité — Durée — sélecteur ouvert` |
| Déclencheur | Appui sur `Durée` dans CE-T01-13 |
| Composant | `Picker / Popover — Source exact`, `Type=Duration` (`2537:1110`), `330 × 190` |

Le sélecteur est rendu dans un overlay centré et bloquant, indépendant du contrôle Durée et du défilement, et présente une seule instance canonique. Il présente les deux roulettes, unités et cinq valeurs visibles selon le même contrat que CE-T01-07. La valeur centrale de la frame est `1 min 30 s`, donnée d’illustration et non valeur initiale imposée. Aucune seconde barre Annuler/Confirmer, seconde roulette ou bordure locale ne peut être superposée.

Pendant l’ouverture, les autres paramètres et segments utilisent l’état visuel non prioritaire prévu par Figma et ne déclenchent aucune action concurrente. Chaque cran effectif produit un retour haptique léger unique. La durée sélectionnée reste locale pendant le défilement ; le contrôle et le récapitulatif ne sont actualisés qu’après Confirmer. Une durée totale de `0 s` laisse la validation de l’Activité désactivée après application.

Toucher une valeur ou le cadre sélectionné ne ferme pas le sélecteur. Annuler ferme sans enregistrer ; Confirmer applique la valeur puis ferme. Le clavier est fermé avant l’ouverture. Le sélecteur reste dans les zones sûres et au-dessus de l’action finale.

Tests bloquants : overlay centré et fond bloqué, roulettes et unités corrects ; mise à jour du récapitulatif ; validation impossible à `0 s` ; haptique une fois par cran ; absence de modification de Pause ou Séries ; conformité à `1992:9430`.

### Contrat transverse — Sélections numériques compactes

Tout contrôle scalaire auparavant décrit comme `pull-up`, `pull-down`, menu numérique ou pop-up numérique utilise désormais `Picker / Popover — Source exact` (`2537:1174`), variante `Type=Numeric wheel` (`3210:49`). Le contrôle fermé reste le déclencheur compact `Controls / Numeric Selector Trigger — Source exact` (`2745:2`) et affiche la dernière valeur confirmée.

La roulette ouverte mesure `136 × 190` : barre supérieure de `40`, contenu natif de `150`, une seule colonne numérique et une zone sélectionnée de `56 × 34`. Elle apparaît dans un overlay centré dans la zone utile, indépendant du déclencheur et du défilement, avec un voile bloquant les interactions et le défilement du fond. Chaque action possède une cible `48 × 48`, un cercle `28 × 28` et un cadre d’icône `24 × 24`. Annuler détruit le brouillon et ferme ; Confirmer enregistre la valeur centrée et ferme. Toucher la roulette, la zone sélectionnée ou arrêter le défilement ne ferme jamais le sélecteur.

| Usage | Frame Figma ouverte | Valeurs/bornes | Composant et variante |
| --- | --- | --- | --- |
| Profil — Compte à rebours initial | `1992:474` — `Profil — Roulette compte à rebours initial ouverte` | Secondes selon le contrat Profil ; exemple centré `10` | `Picker / Popover`, `Type=Numeric wheel` |
| Profil — Fin de séance | `1992:579` — `Profil — Roulette fin de séance ouverte` | Secondes selon le contrat Profil ; exemple centré `5` | `Picker / Popover`, `Type=Numeric wheel` |
| Nombre de Séries | `1992:9618` — `Création activité — Séries — roulette compacte ouverte` | `1–99`, défaut `1` | `Picker / Popover`, `Type=Numeric wheel` |
| Nombre de Répétitions | `1992:9709` — `Création activité — Répétitions — roulette compacte ouverte` | `1–99`, défaut `1` | `Picker / Popover`, `Type=Numeric wheel` |
| Nombre de Tours | `2028:11580` — `Composition — Nombre de tours — roulette compacte ouverte` | `1–99`, défaut `1` | `Picker / Popover`, `Type=Numeric wheel` |
| Nombre de semaines | `1992:7537` — `Planifier une séance — Roulette nombre de semaines ouverte` | entier `≥ 1`; exemple centré `2` | `Picker / Popover`, `Type=Numeric wheel` |

Tests bloquants communs : une seule instance de roulette ; source native OS ; brouillon distinct de la valeur confirmée ; aucune fermeture au simple défilement ; confirmation explicite ; dernière valeur confirmée restituée ; cibles tactiles conformes ; aucun menu numérique historique restant.

---

### CE-T01-15 — Exercice — Informations complémentaires

#### Identification

| Propriété | Valeur |
| --- | --- |
| Frame Figma | `1992:9292` — `Création activité — Informations complémentaires` |
| Entrée | Validation des paramètres essentiels CE-T01-13 |
| Sortie | Composition CE-T01-09 |

L’en-tête fixe affiche le titre fonctionnel `Informations complémentaires`. Le corps affiche le champ multiligne `Consigne (facultative)` avec l’indication `Décrivez brièvement le geste`, puis `Zones corporelles (facultatif)` et les valeurs du référentiel sous forme de tags multisélection. L’action finale fixe est `Terminer`.

La Consigne et les Zones corporelles sont facultatives. Les zones visibles dans Figma sont le référentiel initial attendu, mais l’écran les charge depuis le service de référentiel ; l’utilisateur ne peut ni les créer, ni les renommer, ni les supprimer. Les tags suivent les mêmes règles adaptatives et tactiles que CE-T01-11. Le champ grandit ou le corps défile sans masquer l’action finale.

`Terminer` enregistre atomiquement l’Activité avec les paramètres conservés de l’étape 1, l’insère immédiatement après le Compte à rebours et avant le Tour, puis revient à CE-T01-09. L’omission de toute information complémentaire est valide. Un double appui ne crée pas deux Activités. Retour ramène à l’étape 1 avec toutes les valeurs conservées ; une sortie du parcours avec modifications non enregistrées ouvre CE-T01-16.

Tests bloquants : paramètres essentiels intacts ; Terminer possible sans Consigne ni zone ; multisélection réelle ; aucune création de zone corporelle ; une seule Activité insérée au bon emplacement ; Composition et résumé recalculés ; conformité à `1992:9292`.

---

### CE-T01-16 — Abandonner les modifications d’une Activité

#### Identification et contenu exact

| Propriété | Valeur |
| --- | --- |
| Frame Figma | `3224:4082` — `Modal — Abandonner les modifications d’une activité` |
| Instance | `3224:4140` — `Overlay / Decision Dialog — Abandon activité` |
| Composant | `Overlay / Decision Dialog` (`2590:2961`), variante `PrimaryTone=Danger,SecondaryTone=Neutral,Actions=2` (`2590:2934`) |
| Déclencheur | Tentative de sortie d’un écran Activité contenant des modifications locales non enregistrées |

L’écran Activité reste visible, assombri et non interactif. Le dialogue flottant mesure `354 × 186`, possède un rayon de `18` et est centré dans l’écran.

| Élément | Texte exact |
| --- | --- |
| Titre | `Abandonner les modifications ?` |
| Message | `Les modifications apportées à cette activité seront perdues.` |
| Action non destructive | `Annuler` |
| Action destructive | `Confirmer` |

Les deux boutons `147 × 48` sont disposés sur une ligne avec un écart de `12`. `Annuler` utilise le gris neutre ; `Confirmer` utilise le rouge destructif avec texte blanc. Les libellés sont centrés horizontalement et verticalement. La dernière ligne du message et les actions sont séparées par `spacing/16`.

`Annuler` ferme le dialogue et conserve intégralement la copie de travail locale. `Confirmer` détruit uniquement les modifications locales non enregistrées de l’Activité et revient à la Composition ; aucune autre donnée de la Séance n’est modifiée. Le geste Retour système est traité comme `Annuler`. Toucher le voile ne déclenche jamais `Confirmer`.

Tests bloquants : ouverture uniquement en présence d’un brouillon modifié ; conservation exacte après Annuler ; abandon limité à l’Activité après Confirmer ; voile bloquant ; Retour système non destructif ; textes et géométrie conformes à `3224:4082`.

## 6. Matrice complète de couverture T01

| Contrat | Frame | Fonctionnel | Données réelles | Contrôles | Layout | Ressources | Comparaison visuelle |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CE-T01-01 | `1992:469` | Oui | Routage | Aucun | Oui | Logo et textes | Obligatoire |
| CE-T01-02 | `2117:86` | Oui | État vide | Filtres, Créer, navigation | Oui | Icônes DS | Obligatoire |
| CE-T01-03 | `1992:9910` | Oui | Liste et calculs | Cartes, chevrons, Démarrer | Oui | Icônes DS et couleurs | Obligatoire |
| CE-T01-04 | `2028:11137` | Oui | Brouillon initial | Retour, nom, couleur, ajouter, réglages | Oui | Icônes et composants DS | Obligatoire |
| CE-T01-05 | `2028:12003` | Oui | Nom saisi | Champ, Retour | Oui | Composants DS | Obligatoire |
| CE-T01-06 | `2028:11921` | Oui | Couleur du brouillon | Palette 12 couleurs | Oui | Popover DS | Obligatoire |
| CE-T01-07 | `2028:11375` | Oui | Compte à rebours | Roulettes min/s | Oui | Icône et picker DS | Obligatoire |
| CE-T01-08 | `2028:11298` | Oui | Brouillon à supprimer/conserver | Deux actions de confirmation | Oui | Confirmation Sheet DS | Obligatoire |
| CE-T01-09 | `2028:11700` | Oui | Composition calculée | Ajouter, ouvrir, déplacer, Continuer | Oui | Icônes de structure DS | Obligatoire |
| CE-T01-10 | `2028:11457` | Oui | Fin de séance | Roulettes min/s | Oui | Icône et picker DS | Obligatoire |
| CE-T01-11 | `2028:11204` | Oui | Catégories et associations | Tags, créer, enregistrer | Oui | Tags et Retour DS | Obligatoire |
| CE-T01-12 | `2028:11248` | Oui | Nouvelle catégorie | Champ, Annuler, Ajouter | Oui | Champs et boutons DS | Obligatoire |
| CE-T01-13 | `1992:9132` | Oui | Brouillon Exercice | Segments, champs, paramètres, Valider | Oui | Contrôles DS | Obligatoire |
| CE-T01-14 | `1992:9430` | Oui | Durée Exercice | Roulettes min/s | Oui | Picker DS | Obligatoire |
| CE-T01-15 | `1992:9292` | Oui | Consigne, zones, Activité | Champ, tags, Terminer | Oui | Tags et contrôles DS | Obligatoire |
| CE-T01-16 | `3224:4082` | Oui | Brouillon local d’Activité | Annuler, Confirmer | Oui | Decision Dialog DS | Obligatoire |

Les seize frames dont la construction principale est affectée à T01 possèdent désormais un contrat. Les états repris ultérieurement restent soumis à une revalidation fonctionnelle, technique ou de layout dans leur tranche d’affectation.

## 7. Contrats T01-S10 — Réouverture et modification bout en bout

### 7.1 Règle de réutilisation Figma

T01-S10 ne crée aucune nouvelle structure visuelle. La modification d’une Séance réutilise les frames, composants et variantes du parcours de création T01. Une différence limitée aux données préchargées, au texte d’instance, à l’identifiant persistant ou à l’action métier relève du présent contrat et ne justifie pas une copie de frame.

Le dialogue d’abandon réutilise `Overlay / Decision Dialog` (`2590:2961`), variante `PrimaryTone=Danger,SecondaryTone=Neutral,Actions=2` (`2590:2934`). La frame `2028:11298` reste la référence de production pour sa géométrie dans le contexte Séance ; les textes sont des propriétés d’instance définies par CE-T01-S10-06.

### CE-T01-S10-01 — Ouvrir une Séance existante en modification

#### Identification

| Propriété | Valeur |
| --- | --- |
| Point d’entrée | Carte d’une Séance existante dans `1992:9910` — `Catalogue des séances — Liste par défaut` |
| Écran cible | Réutilisation de CE-T01-04 à CE-T01-10 et de la frame `2028:11700` |
| Précondition | La Séance possède un identifiant persistant valide |

L’action de modification d’une carte ouvre `Composition d’une séance` en mode modification. Elle transmet exclusivement l’identifiant de la Séance sélectionnée ; elle ne crée pas de nouvelle Séance et ne réutilise pas un brouillon appartenant à une autre navigation.

Pendant le chargement, aucune valeur par défaut de création ne doit remplacer une valeur persistée. Si l’identifiant est absent ou inconnu, l’écran de modification n’est pas affiché comme s’il contenait une Séance vide : l’erreur est traitée conformément à la gestion technique des erreurs et le Catalogue reste la destination sûre.

Tests bloquants : bon identifiant transmis ; aucune création anticipée ; aucune donnée d’une autre Séance ; titre fonctionnel `Composition d’une séance` inchangé ; structure visuelle conforme aux frames T01 réutilisées.

### CE-T01-S10-02 — Réhydrater intégralement le brouillon de modification

#### Identification

| Propriété | Valeur |
| --- | --- |
| Déclencheur | Ouverture valide issue de CE-T01-S10-01 |
| Source de données | Agrégat persistant de la Séance identifiée |
| Écran de référence | `2028:11700` — `Composition d’une séance — sans Cycle` |

Avant toute interaction de modification, le brouillon local reçoit une copie complète de la Séance persistée : identifiant, nom, couleur, compte à rebours initial, Activités ordonnées, paramètres de chaque Activité, appartenance au Tour, nombre de Tours, fin de séance et associations de Catégories. Les informations complémentaires des Activités sont également conservées.

La réhydratation ne doit ni remplacer les données persistées par des valeurs par défaut, ni perdre les champs non visibles dans la frame courante. Les résumés affichés sont recalculés depuis le brouillon réhydraté selon les règles actives ; les valeurs de démonstration Figma ne sont jamais injectées.

Tests bloquants : égalité fonctionnelle entre agrégat persistant et brouillon initial ; ordre exact des Activités ; catégories et informations complémentaires conservées ; aucune valeur fictive ; aucune écriture en base pendant la réhydratation.

### CE-T01-S10-03 — Modifier les propriétés générales de la Séance

#### Identification

| Propriété | Valeur |
| --- | --- |
| Écran principal | `2028:11700` — Composition |
| États réutilisés | `2028:11921` — couleur ; `2028:11375` — compte à rebours ; `2028:11457` — fin de séance |
| Brouillon | Copie locale issue de CE-T01-S10-02 |

Le nom, la couleur, le compte à rebours initial, le nombre de Tours, la structure et la fin de séance se modifient avec les mêmes composants, bornes, roulettes et validations que pendant la création. Chaque sélecteur modifie uniquement son brouillon local jusqu’à son action explicite `Confirmer`.

La modification d’un compte à rebours ou d’une fin de séance actualise uniquement la carte structurelle concernée. Elle ne modifie jamais la synthèse placée sous `Nombre de tours`, calculée exclusivement depuis les Activités. Aucune modification locale n’est persistée avant l’enregistrement final défini par CE-T01-S10-07.

Tests bloquants : reprise exacte des composants T01 ; brouillons locaux des sélecteurs ; Annuler sans effet ; Confirmer appliqué au brouillon de Séance seulement ; synthèse du Tour conforme ; aucune persistance intermédiaire.

### CE-T01-S10-04 — Modifier une Activité existante sans la dupliquer

#### Identification

| Propriété | Valeur |
| --- | --- |
| Déclencheur | Appui sur une ligne d’Activité existante dans la Composition |
| Écrans | Réutilisation de CE-T01-13 à CE-T01-16 et des frames Activité correspondantes |
| Titre d’instance | `Modifier une activité` |

L’écran d’Activité reçoit l’identifiant stable de l’Activité sélectionnée et initialise une copie de travail avec toutes ses valeurs. La structure visuelle reste identique à celle de l’ajout ; seul le titre d’instance et le contexte métier changent.

`Valider` puis `Terminer` remplacent dans le brouillon de Séance l’Activité portant le même identifiant, à la même position et dans le même conteneur. Ils ne créent jamais une deuxième Activité. Un retour avec modifications locales ouvre CE-T01-16 ; après `Confirmer`, la version présente dans le brouillon de Séance avant l’ouverture de l’Activité reste intacte.

Tests bloquants : bon identifiant ; valeurs préchargées ; absence de duplication ; position et appartenance au Tour conservées sauf déplacement explicite ; abandon limité à la copie locale ; aucune persistance de Séance à cette étape.

### CE-T01-S10-05 — Modifier les Catégories associées

#### Identification

| Propriété | Valeur |
| --- | --- |
| Écran | Réutilisation de `2028:11204` — `Nouvelle séance — Catégories` |
| État inline | Réutilisation de `2028:11248` |
| Composant | `Selection / Category Tag` (`3302:4166`) |

À l’ouverture, les tags reflètent exactement les associations persistées de la Séance. L’utilisateur peut désélectionner, sélectionner ou créer une Catégorie selon CE-T01-11 et CE-T01-12. Les changements restent dans le brouillon de modification jusqu’à l’enregistrement final.

Une Catégorie créée avec un nom distinct est ajoutée au brouillon selon les règles actives puis sélectionnée pour la Séance. Elle reste non persistée jusqu’à l’enregistrement final. Un nom égal, après normalisation canonique, à une Catégorie existante sélectionne cette Catégorie et ferme la création inline ; aucun doublon n’est créé. Le nom personnalisé est limité à `40` caractères après trim.

Tests bloquants : associations initiales exactes ; multisélection ; zéro Catégorie autorisée ; règle de doublon ; limite de longueur ; aucune modification prématurée des associations persistées de la Séance.

### CE-T01-S10-06 — Abandonner les modifications de la Séance

#### Identification et contenu exact

| Propriété | Valeur |
| --- | --- |
| Référence de géométrie | `2028:11298` — dialogue de décision appliqué à une Séance |
| Composant | `Overlay / Decision Dialog` (`2590:2961`) |
| Variante | `PrimaryTone=Danger,SecondaryTone=Neutral,Actions=2` (`2590:2934`) |
| Déclencheur | Tentative de sortie de la Composition avec un brouillon différent de l’état réhydraté |

| Élément | Texte exact |
| --- | --- |
| Titre | `Abandonner les modifications ?` |
| Message | `Les modifications apportées à cette séance seront perdues.` |
| Action non destructive | `Annuler` |
| Action destructive | `Confirmer` |

La géométrie, les couleurs, les alignements, les espacements et les cibles tactiles sont ceux du composant existant ; aucune nouvelle frame ni nouveau composant ne sont créés. `Annuler` ferme le dialogue et conserve intégralement le brouillon. `Confirmer` détruit le brouillon de modification, conserve la version persistée inchangée et revient au Catalogue. Le Retour système est non destructif et équivaut à `Annuler`. Toucher le voile ne confirme jamais.

Si aucune valeur n’a changé, la sortie revient directement au Catalogue sans afficher le dialogue.

Tests bloquants : dialogue uniquement si le brouillon est modifié ; textes exacts ; conservation après Annuler ; version persistée inchangée après Confirmer ; aucune suppression de la Séance ; Retour système et voile non destructifs.

### CE-T01-S10-07 — Enregistrer atomiquement la Séance modifiée

#### Identification

| Propriété | Valeur |
| --- | --- |
| Action finale | `Enregistrer la séance` dans l’étape Catégories |
| Entrée | Brouillon complet issu de CE-T01-S10-02 à CE-T01-S10-05 |
| Sortie | CE-T01-S10-08 après succès ; CE-T01-S10-09 après échec |

L’enregistrement exécute une mise à jour de la Séance portant l’identifiant d’origine. Il persiste en une transaction cohérente les propriétés générales, Activités et leur ordre, structure du Tour, informations complémentaires, nouvelles Catégories sélectionnées du brouillon et associations de Catégories. Il ne crée aucune seconde Séance et aucun échec ne laisse de Catégorie orpheline.

Le bouton est protégé contre le double appui pendant l’opération. Le brouillon n’est réinitialisé qu’après confirmation du succès de la transaction. Toute erreur provoque l’annulation complète de l’écriture : aucune propriété, Activité ou association partielle ne devient visible comme version enregistrée.

Tests bloquants : opération `update` sur l’identifiant d’origine ; transaction atomique ; absence de duplication ; tous les champs supportés conservés ; double appui sans double écriture ; brouillon réinitialisé uniquement après succès.

### CE-T01-S10-08 — Revenir au Catalogue actualisé

#### Identification

| Propriété | Valeur |
| --- | --- |
| Précondition | Succès confirmé de CE-T01-S10-07 |
| Destination | `1992:9910` — `Catalogue des séances — Liste par défaut` |
| Données | Nouvelle lecture depuis la source persistante |

Après succès, l’application revient au Catalogue et recharge les données persistées. La carte portant l’identifiant de la Séance modifiée reste unique et affiche immédiatement son nom, sa couleur, sa durée, son nombre d’Activités et ses autres informations calculées actualisées.

L’ordre du Catalogue suit la règle métier existante ; T01-S10 ne crée aucune nouvelle règle de tri. Le retour ne repose pas sur une carte construite uniquement depuis l’ancien brouillon en mémoire. Une nouvelle ouverture de la même Séance doit réhydrater les valeurs qui viennent d’être enregistrées.

Tests bloquants : une seule carte pour l’identifiant ; valeurs actualisées ; rechargement observable ; aucun résidu de l’ancienne version ; réouverture conforme à la dernière version persistée.

### CE-T01-S10-09 — Échec de chargement ou d’enregistrement

#### Identification

| Propriété | Valeur |
| --- | --- |
| Cas | Échec de lecture initiale ou échec de la transaction de mise à jour |
| Référence | Règles communes du présent chapitre et gestion technique des erreurs du chapitre 12 |

Un échec de chargement ne présente jamais les valeurs par défaut d’une nouvelle Séance comme si elles provenaient de la Séance demandée. L’utilisateur peut revenir au Catalogue sans mutation de données.

Un échec d’enregistrement maintient l’utilisateur dans le parcours de modification, conserve exactement le brouillon et réactive l’action après la fin de la tentative. Un message utilisateur compréhensible indique que les modifications n’ont pas été enregistrées ; aucun détail technique interne n’est exposé. Une nouvelle tentative réutilise le même brouillon et le même identifiant.

La transaction échouée ne produit aucune modification partielle. Le verrou contre le double appui est toujours libéré après l’échec. Aucun reset, retour automatique au Catalogue ou message de succès n’est autorisé.

Tests bloquants : aucune fausse donnée après échec de lecture ; brouillon conservé après échec d’écriture ; action réactivée ; nouvelle tentative possible ; aucune écriture partielle ; aucune navigation ou confirmation mensongère.

### 7.2 Matrice de couverture T01-S10

| Contrat | Frame ou composant réutilisé | Différence propre à S10 | Nouvelle frame requise |
| --- | --- | --- | --- |
| CE-T01-S10-01 | `1992:9910` | Transmission de l’identifiant et mode modification | Non |
| CE-T01-S10-02 | `2028:11700` | Réhydratation de l’agrégat persistant | Non |
| CE-T01-S10-03 | Frames Composition T01 | Brouillon préchargé, aucune persistance intermédiaire | Non |
| CE-T01-S10-04 | Frames Activité T01 + `3224:4082` | Remplacement par identifiant, titre `Modifier une activité` | Non |
| CE-T01-S10-05 | `2028:11204`, `2028:11248` | Associations existantes présélectionnées | Non |
| CE-T01-S10-06 | `Overlay / Decision Dialog` + géométrie `2028:11298` | Textes et effets métier de l’abandon des modifications | Non |
| CE-T01-S10-07 | Action existante `Enregistrer la séance` | Mise à jour atomique au lieu d’une création | Non |
| CE-T01-S10-08 | `1992:9910` | Carte existante actualisée, sans duplication | Non |
| CE-T01-S10-09 | Règles communes d’erreur | Conservation du brouillon et nouvelle tentative | Non |
