# KODJO — Registre des modifications · Création d'activité

**Date :** 10/10/2026
**Fichier Figma :** `G6RY5Ebhgwb4AHIOYDwwvg`
**Pages traitées :** `Conception — Hors MVP` (`6464:10219`) puis `Prototype MVP` (`510:101`)
**État : les deux pages sont alignées.** Contrôle de parité en fin de document.

Ce registre existe pour que la reprise sur `Prototype MVP` se fasse sans écart. Chaque modification est décrite par son **sélecteur** (nom de nœud ou critère de style), pas par des identifiants : les ids diffèrent d'une page à l'autre, les noms non.

---

## Périmètre retenu

Deux points de portée ont été arbitrés avant exécution.

**Règle de titre de section** → appliquée à la **famille Création activité** seule : les cadres de la page dont le nom correspond au sélecteur de famille. Le reste de la page conserve Semi Bold 16.

### Sélecteur de famille — ne pas sélectionner par le nom

**À utiliser pour toutes les passes, sur `Prototype MVP` comme ailleurs :** est un écran de la famille tout cadre de premier niveau contenant un nœud nommé **`Contenu du formulaire`** ou **`Zone bleue — Nom de l'exercice et média`**.

Le sélecteur par expression régulière sur le nom a échoué **deux fois**, et chaque échec a coûté une passe de rattrapage :

| passe | sélecteur utilisé | écrans manqués |
|---|---|---|
| demandes 1 à 7 | sans `^Résumé` | `Résumé — 15`, `Résumé — 17` |
| demandes 8 à 14 | avec `^Résumé` | **`Modal — Abandonner la création de l'activité`**, **`Modifier un exercice`** |

Aucun nom ne contient « Création activité » ou « Ajouter un exercice » dans ces quatre cas, alors que les quatre écrans portent le formulaire complet. Le critère structurel en recense **43**, là où le dernier sélecteur par nom en voyait 39.

**« L'écran principal »** → **tous les écrans où la synthèse apparaît**, modale ouverte comme fermée, soit la même famille de 39 cadres.

Un cadre de la sélection, `Composition séance — Standard — Séries variables`, ne portait aucun des nœuds visés : il est resté inchangé. Les 38 autres ont été modifiés.

---

## Demande 1 — Titre de section

> Couleur de texte : text-secondary. Typo : Inter Regular 11. L'accoler au cadre de la section qui suit avec une légère marge.

**Sélecteur :** nœud `TEXT` dont le style est `Inter Semi Bold 16` et dont le bord gauche est à **≤ 30 px** du bord du cadre d'écran. Ce critère isole les titres de section et exclut les titres de modale, qui sont centrés.

**Opérations par nœud :**

| propriété | avant | après |
|---|---|---|
| `fontName` | Inter Semi Bold | **Inter Regular** |
| `fontSize` | 16 | **11** |
| `fills` | couleur en dur | **liée à la variable `color/text-secondary`** (`VariableID:2290:58` → `color/neutral/text-secondary-595E66`, #595E66) |

La couleur est **liée à la variable**, pas posée en dur : `figma.variables.setBoundVariableForPaint`.

**Rapprochement du cadre :** l'écart est porté par l'auto-layout **grand-parent** du titre — le titre est dans un cadre d'en-tête, lui-même dans le bloc de section. `itemSpacing` du grand-parent passe de **8 à 4**.

**Volumétrie :** **75 titres** modifiés, **75 écarts** ramenés de 8 à 4. Tous étaient à 8 avant, sans exception.

---

## Demande 2 — Suppressions sur l'écran principal

> Supprimer « Durée », « Compte à rebours » et la valeur, « Fin d'exercice » et la valeur, la barre horizontale après Durée totale.

Deux nœuds portent l'ensemble.

**La pastille « Durée »** — instance `Valeur modifiable`, sœur du nœud `TEXT` « Paramètres d'exécution » dans le cadre d'en-tête. Sélecteur : parcourir les parents du titre et retirer l'instance `Valeur modifiable` de même fratrie.
→ **38 supprimées.**

**Le bloc bas de la carte** — cadre nommé `Groupe — Compte à rebours / Fin de séance`. Il contient **le filet** (`Séparateur`) **et** les deux couples libellé/valeur. Le supprimer satisfait trois des quatre demandes d'un coup.
→ **37 supprimés** (un écran ne le portait pas).

**Attention à la reprise :** le filet demandé est bien celui **dans** la carte, après « Durée totale ». Il n'y a pas d'autre séparateur à retirer.

---

## Demande 3 — Ordre des sections

> Mettre la description de l'exercice avant les paramètres d'exécution.

**Sélecteur :** cadre `Contenu du formulaire` (auto-layout VERTICAL, `itemSpacing` 16). Ses enfants étaient, dans cet ordre :

1. `Paramètres — Phrase éditable`
2. `Accordéon — Description de l'exercice`
3. `Accordéon — Médias — Déployé`

**Opération :** `insertChild(0, <Accordéon — Description>)`. L'ordre devient Description, Paramètres, Médias.
→ **38 écrans réordonnés**, 38 vérifiés conformes, 0 écart.

---

## Demande 4 — Libellé

> Remplacer « Paramètres d'exécution » par « Modalités d'exécution ».

**Sélecteur :** tout nœud `TEXT` dont le contenu exact est `Paramètres d'exécution` (apostrophe typographique `’`).

→ **62 occurrences** remplacées, réparties ainsi :

| emplacement | nombre | style conservé |
|---|---|---|
| titre de section | 38 | Regular 11 (demande 1) |
| **titre de modale** | **24** | **Semi Bold 18, inchangé** |

**Point à noter pour la reprise :** le remplacement a aussi touché les **titres de modale**, ce qui est cohérent — le mot disparaît partout — mais ces 24 nœuds ne doivent **pas** recevoir le style de la demande 1. Le critère des 30 px les exclut automatiquement.

Vérification : **0 occurrence** de l'ancien libellé subsiste.

---

## Demande 5 — Corps des cadres de synthèse

> Augmenter la taille des textes dans les cadres de synthèse des paramètres d'exécution et de description de l'exercice : taille Mixte / Regular 15.

**Sélecteurs :**

- `TEXT` nommé `Phrase — texte` — la phrase des modalités, en style **mixte** (les valeurs sont en gras, le reste en Regular). Seul `fontSize` est modifié, les styles de plage sont conservés.
- tout `TEXT` à l'intérieur d'une instance dont le nom commence par `Champ — Description de l` — la description.

**Opération :** charger toutes les polices de plage via `getRangeAllFontNames`, puis `fontSize = 15`.

→ **27 phrases** et **38 descriptions** portées à 15. Tailles avant : 63 nœuds à 13, 2 déjà à 15.

---

## Demande 6 — Placeholder du champ Modalités d'exécution

> Dans le champ de texte Modalités d'exécution, écrire en gris « Cliquez ici pour définir les paramètres » lorsque le champ est vide.

**Libellé retenu :** `Appuyez ici pour définir les modalités` — « appuyez » plutôt que « cliquez » sur mobile, et « modalités » pour reprendre le libellé de la section.

**Critère d'application — le champ est vide :** le cadre `Phrase` du bloc `Paramètres — Phrase éditable` ne contient **pas** de nœud `Phrase — texte`. C'est le seul marqueur fiable de l'état vide ; ne pas se fier au nom de l'écran.

**Opération :** création d'un `TEXT` nommé `Phrase — consigne` dans le cadre `Phrase`, style **Inter Regular 15**, couleur liée à la variable `color/text-secondary` (même variable que la demande 1).

→ **11 écrans** concernés sur les 38. Les 27 autres portaient déjà une phrase.

---

## Demande 7 — Zone image

> Agrandir un peu la taille du champ réservé à l'image. Ajouter l'icône d'agrandissement en bas à droite de l'image. Ajouter la petite icône de démarrage de la vidéo au centre.

**Sélecteur :** instance `Media / Preview — Illustration activité`, dans `Media / Gallery — Source exact` sous `Médias — Aperçus`.

**7a — Agrandissement.** `rescale(1.115)` et non `resize` : `rescale` met à l'échelle les enfants proportionnellement, `resize` les laisse en place et casse la composition interne de l'aperçu.
→ **38 aperçus** agrandis.

**7b — Icône d'agrandissement.** Le fichier possède déjà le composant : `DSF / Actions / Bouton d'action circulaire`, variante **`Action=Plein écran`** (`5613:5346`). Une **instance** est posée, nommée `Média — Plein écran`, **32 px**, `layoutPositioning = 'ABSOLUTE'`, inset de **8 px** par rapport aux bords bas et droit de l'aperçu.
→ **38 instances.**

**Erreur à ne pas refaire :** j'avais d'abord dessiné le glyphe à la main (quatre barres d'angle), ce qui donnait un carré plein parce que les barres se chevauchaient. Le composant existe, il faut l'utiliser. Ses autres variantes : `Basculer le côté` 5613:5341, `Fermer le plein écran` 5613:5351, `Fermer` 5613:5356.

**7c — Bouton de lecture vidéo.** La source est l'écran `Exécution d'un exercice — Média plein écran` (`5009:6069`), nœuds **`Bouton — Lire`** (ELLIPSE `5047:5954`, 56×56, fill #0F0F14 **opacité 0,55**) et son frère **`▶`** (TEXT `5047:5955`, 24×24, blanc). Les deux sont **clonés** — ce ne sont pas des composants — et nommés `Média — Lecture` et `Média — Lecture — Triangle`, en `layoutPositioning = 'ABSOLUTE'`, cercle centré dans l'aperçu, triangle à **+18 / +16** du coin du cercle.
→ **38 couples** posés.

**Erreur à ne pas refaire :** ne **pas** utiliser `Démarrer` (`5018:6059`, 48 px, bleu **opaque**) — c'est l'icône « démarrer l'exercice », pas « démarrer la vidéo ». Le cercle de lecture est translucide.

**Dette ouverte :** les 38 boutons de lecture sont des copies, pas des instances. Une variante `Action=Lecture` ajoutée au `Bouton d'action circulaire` supprimerait cette dette — à arbitrer **avant** la reprise sur `Prototype MVP`, sinon la dette est dupliquée sur les deux pages.

---

## Demande 8 — Composant du bouton de lecture

> Créer le composant qu'il faut pour le bouton démarrer la vidéo.

**Ce qui est créé :** une cinquième variante dans le jeu existant `DSF / Actions / Bouton d'action circulaire` (`5613:5357`) — **`Action=Lecture`**, `7872:14696`, **56×56**.

| enfant | spécification |
|---|---|
| `ELLIPSE` `Bouton — Lecture` | 56×56 à (0,0), fill **#0F0F14 opacité 0,55** |
| `TEXT` `▶` | 24×24 à **(18,16)**, blanc, **Inter Regular 20**, `textAutoResize = HEIGHT`, alignement **CENTER / CENTER** |

Le jeu accueille déjà des variantes de tailles différentes (32 et 48), une variante à 56 ne le déséquilibre pas. Les options de la propriété `Action` sont désormais : `Basculer le côté`, `Plein écran`, `Fermer le plein écran`, `Fermer`, **`Lecture`**.

**Piège rencontré :** le nœud texte doit être en `textAutoResize = HEIGHT` **et** CENTER / CENTER, comme la source `5047:5955`. Créé en LEFT / TOP, le glyphe se décale dans sa boîte de 24 px. L'écart ne se voit qu'à la loupe, mais il se répète sur toutes les instances.

**Décalage du triangle :** le +18 / +16 n'est pas un centrage. La boîte du glyphe est volontairement **2 px à droite** du centre du cercle, pour compenser la masse visuelle d'un triangle pointant à droite. Reproduire la valeur, ne pas la recalculer.

→ Les copies posées à la demande 7c sont remplacées par des **instances** : **39 remplacements**. La dette des copies est soldée.

---

## Demande 9 — Présence de l'icône de lecture

> Retirer l'icône « démarrer la vidéo » lorsqu'il n'y a pas de photo. Il y a deux écrans où il manque l'icône, leur titre commence par « Résumé ».

**Critère « pas de photo » :** l'aperçu `Media / Preview — Illustration activité` contient un enfant dont le nom commence par **`Icône photo`** (l'instance `Icône photo — ajouter`) au lieu du cadre `Illustration activité — …`. C'est le seul marqueur fiable de l'état vide ; ne pas se fier au nom de l'écran.
→ **1 écran** concerné : `Ajouter un exercice — Initial`. Icône de lecture retirée.

**Les deux écrans « Résumé ».** `Résumé — 15 Durée variable bilatérale Par série` et `Résumé — 17 À l'échec variable` n'avaient pas l'icône parce que **le sélecteur de famille des demandes 1 à 7 ne couvrait pas le préfixe `Résumé`**. Le sélecteur est corrigé et porte désormais aussi `|^Résumé`.
→ **2 instances ajoutées.**

**À reprendre impérativement sur `Prototype MVP` :** utiliser le sélecteur **corrigé**, sinon ces deux écrans seront de nouveau oubliés.

**Deux écarts résiduels sur ces deux écrans, non traités faute de demande :**

- l'**icône d'agrandissement** y est également absente — ils sont les seuls de la famille dans ce cas ;
- leur aperçu média mesure **260×213** et non 290×237 : ils n'ont pas reçu le `rescale(1.115)` de la demande 7a, pour la même raison de sélecteur.

---

## Demande 10 — Description en liste d'étapes (modèle A)

> On utilise le modèle « description en liste A ».

Deux maquettes avaient été construites pour arbitrage, conservées comme référence sur la page : `Création activité — Description en liste — A Saisie fluide` (`7867:14511`) et `… — B Réorganisable` (`7867:14580`). **A est retenu.** Ce ne sont pas des écrans à rejouer, seulement le modèle.

**Ce qui remplace quoi :** l'instance `Champ — Description de l'exercice — Facultatif` est remplacée par un **cadre** `Champ — Description — Liste d'étapes`. Un cadre et non une instance, parce qu'on ne peut pas ajouter d'enfants à une instance.

**Spécification du cadre** — reprise à l'identique de l'ancien champ : fill blanc lié à `VariableID:2290:54`, stroke lié à `VariableID:2290:62` épaisseur 1, rayon 8, padding 14 sur les quatre côtés. Auto-layout **VERTICAL**, `itemSpacing` **8**, largeur FILL, hauteur HUG.

**Spécification d'une ligne** — cadre `Étape n`, auto-layout HORIZONTAL, `itemSpacing` 8, `counterAxisAlignItems` MIN, fond transparent, largeur FILL / hauteur HUG :

| enfant | spécification |
|---|---|
| numéro | `TEXT` Inter **Medium 15**, **#595E66**, largeur **fixe 16**, aligné à **droite** |
| libellé | `TEXT` Inter **Regular 15**, couleur reprise de l'ancien `Valeur — Consigne`, largeur **FILL** |

**Ligne d'invitation** — dernier enfant du cadre, nommé `Étape suivante — invitation` : numéro `5.` et libellé `Étape suivante`, tous deux en **#AEB3BA**. C'est elle qui porte le fait qu'**aucun bouton « + Ajouter une étape » n'existe** : la touche Entrée crée l'étape suivante, le coût en clics est donc identique au texte libre.

**Contenu posé** (4 étapes, reprise du texte libre de « Squats sautés ») :
1. Descendez en squat, dos droit, cuisses parallèles au sol.
2. Poussez sur les jambes et sautez verticalement.
3. Atterrissez souplement, genoux fléchis.
4. Enchaînez sans pause jusqu'à la fin de la série.

**État vide** — un seul écran, `Ajouter un exercice — Initial`, portait le texte d'amorce « Décrivez ce qu'il faut faire… ». Critère de détection : le texte commence par `Décrivez`. Il reçoit **une seule ligne grise** `1.` / `Décrivez la première étape`, sans ligne d'invitation. Hauteur **48** au lieu de 206.

**Volumétrie :** **39 écrans convertis** (carte à **206 px**), **1 état vide** (48 px), **2 maquettes de référence** déjà au modèle, **1 écran sans champ de description** (`Composition séance — Standard — Séries variables`) laissé tel quel. **0 ancien champ restant.**

**Conséquence de place, mesurée.** La carte passe de 136 à 206 px, soit **+70**. La gouttière du numéro prend 24 px de largeur, donc les mêmes phrases s'enroulent sur 7 lignes au lieu de 6 ; les interlignes ajoutent 24 ; la ligne d'invitation 26. Sur **tous** les écrans la section Médias descend maintenant sous le bouton d'action, et **6 écrans sont rognés par le cadre** de 9 à 29 px :

| écran | perte |
|---|---|
| `Création activité — Paramètres en modale — 9 Avec changement` | 9 |
| `Création activité — Paramètres en modale — 9b Avec changement` | 9 |
| `Ordre des côtés — 7 Sélection : Un côté après l'autre` | 9 |
| `Une seule série — 10 Options sans effet` | 9 |
| `Résumé — 15 Durée variable bilatérale Par série` | 20 |
| `Création activité — Phrase longue (224 caractères)` | 29 |

Le levier pour revenir à une seule hauteur de vue n'est pas la description — resserrée au maximum elle ne rend que 30 px — mais **l'accordéon Médias replié par défaut**, qui pèse 253 px. **Arbitrage non rendu à ce jour.**

---

## Demande 11 — Icône dans la pastille de zone corporelle

> Mettre l'icône de la zone corporelle à l'intérieur du cadre étendu qui accueille les textes cuisses fessier, de la même manière qu'on a la pastille de couleur à l'intérieur du cadre de la catégorie.

**Où était l'icône.** Elle n'était dans aucune pastille. Le glyphe existe sous le nom **`Zone corporelle — homme, pleine`** (`7413:31166`, FRAME 26×26, un `VECTOR` 9×26 en #0508E5), mais **enfermé dans le bouton rond** `Action contextuelle — Zones corporelles — Icône corps` (34×34, rayon 17, fond blanc, stroke #0508E5) des écrans où aucune zone n'est encore choisie. C'est le glyphe seul qu'il faut reprendre, pas le bouton rond.

**Les deux états à ne pas confondre :**

| état | porteur | écrans |
|---|---|---|
| zone choisie | pastille `Action — Zones corporelles — Cuisses · Fessier`, 173×32 | **34** → icône posée |
| zone non choisie | bouton rond `Action contextuelle — … — Icône corps`, 34×34 | **8** (série `Ajouter un exercice —`) → **inchangés** |

Un écran, `Composition séance — Standard — Séries variables`, ne porte ni l'un ni l'autre.

**Ce qui est posé :** le **bouton rond entier**, cercle compris, et non le glyphe nu. Clone de `Action contextuelle — Zones corporelles — Icône corps` inséré en **index 0** de la pastille, nommé `Zone corporelle — icône cerclée`, `rescale(32/34)` puis `resize(32, 32)`. Le glyphe suit la mise à l'échelle et mesure **24,5** à l'intérieur du cercle.

**Pourquoi 32 et non 24.** Un cercle plus petit que la pastille donne **un trait dans un autre trait** : le liseré du cercle flotte à l'intérieur du liseré de la pastille. Le cercle prend donc la **hauteur exacte de la pastille** — 32 — avec `paddingLeft` à **0**. Les deux rayons valent alors 16 et les deux `strokeAlign` sont `INSIDE`, si bien que **l'arc gauche du cercle se superpose exactement au bord gauche de la pastille** : un seul trait. Le cercle n'est donc pas dimensionné en valeur absolue mais **à partir de `chip.height`**, et son rayon à `height / 2` — si la hauteur de la pastille change, la règle tient toujours.

**Deux propriétés à rétablir après le `rescale` :**

| propriété | effet du rescale | valeur à rétablir |
|---|---|---|
| `strokeWeight` | passe de 1 à 0,7 | **1** |
| `cornerRadius` | 17 × 0,706 ≈ 12 | **12** (à poser explicitement) |

**Piège principal — le positionnement absolu.** Le bouton source est en `layoutPositioning = 'ABSOLUTE'` dans son parent. Le clone hérite de cette propriété et **sort du flux de l'auto-layout** : il part se poser à l'extrémité droite de l'écran (mesuré à x414 au lieu de x180) alors que `insertChild(0, …)` a bien été appelé. Il faut forcer **`layoutPositioning = 'AUTO'`** après le clone, avant toute mesure. Le symptôme est trompeur : l'ordre des enfants est correct, seule la position est fausse.

**Alignement de la pastille :** `primaryAxisAlignItems` **MIN**, `paddingLeft` **0**, `paddingRight` **8**, `itemSpacing` **6**. Le cercle est collé à gauche, bord à bord.

**Largeur inchangée : 173 fixe.** Géométrie obtenue :

| | cadre | pastille / cercle | libellé | marge restante à droite |
|---|---|---|---|---|
| catégorie | 24 → 168 | 28 → 52 (24×24, sans liseré) | 58 → 151 | 17 |
| zones corporelles | 176 → 349 | **176 → 208** (32×32, liseré) | 214 → 328 | 21 |

Glyphe centré dans le cercle : 179,8 → 204,3, centre 192, celui du cercle aussi.

---

## Demande 12 — Libellés des deux pastilles

> Le texte de ces deux boutons doit être noir et pas en gras.

**Sélecteur :** les nœuds `TEXT` enfants directs de `Action — Catégorie …` et de `Action — Zones corporelles …`.

| propriété | avant | après |
|---|---|---|
| `fontName` | Inter **Semi Bold** 14 | **Inter Regular** 14 |
| `fills` | lié à `VariableID:2290:51` (bleu #0508E5) | **lié à `color/text-primary`** (`VariableID:2290:57` → `color/neutral/text-141414`, #141414) |

La couleur est **liée à la variable**, pas posée en dur. Le noir du fichier est #141414, pas #000000.

**Volumétrie :** **71 libellés** — 37 pastilles catégorie et 34 pastilles zones corporelles. Les 37 et les 34 ne coïncident pas : les 8 écrans de la série `Ajouter un exercice —` portent la pastille catégorie mais pas celle des zones, et trois écrans n'ont ni l'une ni l'autre.

**Effet de bord sans conséquence :** le libellé catégorie se resserre de 96 à 93 px, le Regular étant plus étroit que le Semi Bold. La pastille étant à largeur fixe, rien ne se déplace.

**Contrôle :** 71 libellés en Regular et liés à la bonne variable, 34 cercles à la hauteur exacte de leur pastille, 0 écart.

---

## Demande 13 — Classification discrète (option 1)

> Ces deux informations sont trop présentes dans la zone de texte. […] On prend l'option 1.

**Le constat qui fonde la règle.** Dans la zone bleue, le champ de nom — l'information principale — **n'a ni fond ni liseré** : le texte est posé sur le dégradé. Les deux informations secondaires cumulaient fond blanc opaque, liseré bleu 1 px, hauteur 32 et cercle autour du symbole. La hiérarchie était inversée. L'option retenue aligne le secondaire sur la grammaire du principal.

**Trois options avaient été maquettées** sur un écran à part, `Classification — Options de discrétion` (`7896:14505`), conservé comme pièce d'arbitrage et non comme écran du produit. L'option 1 y figure dans son état final.

**Opérations par écran**, sur la ligne `Sélecteurs — Catégorie / Zones corporelles` :

| élément | avant | après |
|---|---|---|
| fond des deux pastilles | #FFFFFF opaque | **aucun** |
| liseré | #0508E5 1 px | **aucun** |
| hauteur de pastille | 32 | **20** |
| marqueur de catégorie | ellipse de couleur 24 | **glyphe plein 18, teinté de la couleur de la catégorie** (voir demande 14) |
| symbole de zone | bouton cerclé 32 | **glyphe nu 18** (`rescale(18/26)` depuis `7413:31166`) |
| libellés | Regular 14 | **Regular 13**, largeur HUG |
| `itemSpacing` interne | 6 | 6 (inchangé) |
| `itemSpacing` entre les deux groupes | 8 | **20** |
| `paddingLeft` de la ligne | 0 | **14** |
| `itemSpacing` de la zone bleue | 12 | **0** |

**Deux règles à ne pas transformer en valeurs en dur :**

- Le **14** de `paddingLeft` n'est pas un 14 : c'est `X(texte du nom) − X(ligne)`, calculé par écran. La pastille de couleur doit tomber à l'aplomb du **texte** « Squats sautés » — x38 — et non du bord du champ, qui est à x24. Si le rembourrage du champ de nom change, la pastille suit.
- Le **0** d'`itemSpacing` de la zone bleue ne colle pas les deux lignes. Le champ de nom mesure 42 px pour un texte de 22, donc 10 px de vide interne subsistent sous le texte. L'écart optique réel est de **16 px**, contre 32 avant resserrage.

**Cibles tactiles — désaxées, et c'est volontaire.** Deux rectangles `Zone tactile — Catégorie` et `Zone tactile — Zones corporelles`, enfants de la **zone bleue** en `layoutPositioning = 'ABSOLUTE'`, fond vide, **48 px** de haut. Ils ne sont **pas centrés sur leur contenu** : ils partent 2 px sous la boîte du champ de nom et descendent, l'espace libre étant entièrement sous la ligne. Résultat : 4 px au-dessus de la pastille, 24 en dessous, aucun recouvrement avec la zone du nom — qui est éditable elle aussi, et où une erreur serait silencieuse.

Leur frontière commune est posée au **milieu du vide de 20 px** entre les deux groupes, ce qui laisse 10 px de marge avant le premier caractère ou le glyphe, contre 4 px dans la version à 8 px d'écart. Largeurs obtenues : **125 et 147 px**, identiques sur les 34 écrans.

**Volumétrie :** **34 écrans traités**, 0 écart sur les onze contrôles (fond, liseré, hauteur, corps, cercle retiré, taille et abscisse de la pastille, nombre, hauteur, chevauchement et débordement des cibles).

**Les 9 écrans non traités, et pourquoi :**

- `Composition séance — Standard — Séries variables` ne porte pas la ligne de classification.
- Les **8 écrans de la série `Ajouter un exercice —`** portent la pastille catégorie mais, côté zones, le **bouton rond** `Action contextuelle — … — Icône corps`, qui est l'affordance de l'état « zone non choisie ». Aplatir la catégorie sans décider du sort de ce bouton aurait produit une ligne mi-légende mi-bouton. **Arbitrage à rendre :** soit le bouton rond devient lui aussi une mention plate du type « + Zone corporelle », soit ces 8 écrans gardent la forme actuelle et assument une grammaire propre à l'état vide. Jusque-là, ces 8 écrans affichent une catégorie en pastille blanche cerclée là où les 34 autres affichent une légende.

---

## Demande 14 — Marqueur de catégorie continu

> L'icône catégorie apparaît la première fois, puis disparaît complètement. […] On a une version de ce symbole plein, il devrait être utilisée. […] On déploie l'icône teintée.

**Le défaut.** La séquence de création faisait coexister deux vocabulaires pour deux dimensions de même rang :

| état | catégorie | zone corporelle |
|---|---|---|
| rien de choisi | icône `icon/categorie` dans un bouton rond | silhouette dans un bouton rond |
| catégorie choisie | **l'icône disparaît**, remplacée par une pastille de couleur | silhouette inchangée |
| les deux choisis | pastille de couleur | silhouette |

La silhouette traverse les trois états, l'icône de catégorie n'existait qu'au premier. Le passage en légende plate l'a rendu voyant : la zone était identifiée par un symbole qui se lit, la catégorie par un point de 12 px dont le sens ne s'acquiert qu'à l'usage.

**La correction.** Dans la légende, la pastille de couleur est remplacée par **le glyphe de catégorie, teinté de la couleur de la catégorie**. Le symbole devient continu du premier écran au dernier et la couleur n'est pas perdue : elle passe du point au glyphe.

**Le bon nœud source — et seulement celui-là.** Le fichier contient deux versions du symbole ; la paire « pleine » est celle à utiliser, car elle répond exactement à `Zone corporelle — homme, pleine` :

| | nœud | nature | verdict |
|---|---|---|---|
| catégorie, tracé | `icon/categorie` (`6296:10530`) | contours fins, couleur sur `strokes` | **à ne pas utiliser** en légende : à 18 px dans une teinte pâle, le tracé se délite |
| catégorie, plein | **`Icône catégorie — pleine` (`7287:13718`)** | FRAME 20×20, un `VECTOR` 12×16 en `fills` | **retenu** |
| zone, plein | `Zone corporelle — homme, pleine` (`7413:31166`) | FRAME 26×26, un `VECTOR` 9×26 en `fills` | déjà en place |

Ces deux nœuds vivent sur la page `Prototype MVP`. Les cloner depuis `Conception — Hors MVP` fonctionne, mais à la reprise il faudra vérifier qu'ils n'ont pas été déplacés.

**La teinte est lue, pas écrite en dur.** Le `fills[0]` de l'ellipse supprimée est copié tel quel sur le `VECTOR` du glyphe — liaison de variable comprise, le cas échéant. Un écran portant une autre catégorie recevra donc sa propre couleur sans intervention. Relevé : **34 écrans, tous en #8FB8FF** (« Renforcement »).

**Piège — le fond blanc des glyphes.** `Icône catégorie — pleine` **et** `Zone corporelle — homme, pleine` portent un `fills` blanc sur leur cadre. Invisible tant que le glyphe est posé dans le bouton rond, qui est blanc lui aussi ; **visible dès qu'il est posé à nu sur le dégradé**, sous la forme d'un carré blanc de 18 px derrière le symbole. Il faut faire `g.fills = []` après chaque clone. Le défaut a existé sur les 34 écrans entre le déploiement de la demande 13 et sa correction.

**Conséquence géométrique.** La pastille catégorie passe de 105 à **111 px** (18 + 6 + libellé au lieu de 12 + 6 + libellé). Les cibles tactiles doivent être **recalculées après coup**, leur frontière étant posée au milieu du vide entre les deux groupes : elles passent de 125/147 à **131/147**.

**Contrôle :** 34 écrans conformes sur dix points — taille des deux glyphes, absence de fond, présence du remplissage vectoriel, disparition de l'ellipse, abscisse du glyphe à x38, écart de 20 px, nombre, hauteur et non-chevauchement des cibles. 0 écart.

**Reste ouvert :** les 8 écrans `Ajouter un exercice —` conservent les deux boutons ronds. La correction ci-dessus règle la continuité du symbole, pas le changement de forme entre le bouton rond de l'état vide et la légende plate de l'état renseigné.

---

## Demande 15 — Espacement du titre « Description de l'exercice »

> Réduire l'espace vertical entre le texte « Description de l'exercice » et son cadre pour qu'il soit identique à l'espacement du texte « Modalités d'exécution » et de son cadre.

**La cause n'était pas l'`itemSpacing`.** Les deux blocs avaient déjà le même : 4. L'écart venait du **cadre d'en-tête** :

| | cadre porteur du titre | hauteur | texte | vide résiduel sous le texte |
|---|---|---|---|---|
| Modalités d'exécution | `Frame` | 13, **HUG** | 13 | 0 |
| Description de l'exercice | `En-tête — Description de l'exercice — Déployé` | **24, FIXED** | 13 | ~5,5 |

**Opération :** `layoutSizingVertical = 'HUG'` sur `En-tête — Description…`. Il n'y a rien d'autre à changer : ni l'`itemSpacing`, ni une position.

**Résultat mesuré sur les 43 écrans :** écart titre → cadre de **4 px** pour la description **comme** pour les modalités. L'accordéon perd 11 px de hauteur au passage, ce qui réduit d'autant le débordement signalé à la demande 10.

**Attention à l'ordre :** passer l'en-tête en HUG **après** avoir changé le corps du titre (demande 1), sinon il épouse un texte de 19 px au lieu de 13.

---

## Demande 16 — Rattrapage des quatre écrans manqués

> La modale « Modal — Abandonner la création de l'activité » n'a pas été déployée.

Le recensement structurel déclenché par cette remarque a montré que **quatre** écrans, et non un, étaient en retard. Voir le sélecteur de famille plus haut : c'est la cause unique.

| écran | demandes manquantes rattrapées |
|---|---|
| `Modal — Abandonner la création de l'activité` | **1 à 14**, intégralement |
| `Modifier un exercice` | 1, 2 (pastille Durée seule), 3, 4, 5, 7, 8, 10, 11 à 14 |
| `Résumé — 15 Durée variable bilatérale Par série` | 1, 2, 3, 4, 7a |
| `Résumé — 17 À l'échec variable` | 1, 2, 3, 4, 7a |

`Modifier un exercice` ne portait pas de `Groupe — Compte à rebours` : rien à supprimer de ce côté.

**Piège rencontré sur les deux écrans `Résumé`.** Ils avaient reçu les icônes de média à la demande 9 mais pas l'agrandissement de l'aperçu à la 7a. Or `rescale(1.115)` met les enfants à l'échelle : appliqué tel quel, il aurait porté le bouton de lecture de 56 à 62 px. La séquence correcte est donc **retirer les icônes, agrandir, reposer les icônes** — c'est celle qui a été appliquée aux quatre écrans.

**Ordre d'exécution du rattrapage**, à rejouer tel quel : libellé (4) → suppressions (2) → style des titres (1) → corps de la phrase (5) → description en liste (10) → ordre des sections (3) → placeholder (6) → en-tête en HUG (15) → médias (7, 8, 9) → classification (11 à 14).

**Contrôle final sur les 43 écrans :** **40 conformes** sur douze points. Les 3 écarts restants sont le régime intermédiaire décrit ci-dessous, laissé en l'état faute d'arbitrage.

---

## Demande 17 — Corps de texte à 14 et cadre de modalités vide

> Passer les textes de description et de modalité d'exécution de 15 px à 14 px. Ajuster la hauteur de la zone de texte vide de modalité d'exécution.

**Corps de texte.** `Phrase — texte`, `Phrase — consigne` et tous les textes de la liste d'étapes — numéros compris — passent à **14**. Les `Phrase — texte` sont en style mixte : charger toutes les polices de plage via `getRangeAllFontNames` avant d'écrire `fontSize`.
→ **32 phrases**, **11 consignes**, **424 textes d'étapes**.

Les libellés de la classification restent à **13** : ils ne font pas partie de la demande.

**La hauteur du cadre vide — ce n'était ni le padding ni le HUG.** Le cadre `Phrase` est en `layoutSizingVertical = HUG` avec un padding nul, et affichait pourtant 40 px pour un texte de 17. La cause est une **`minHeight` de 40** posée sur `Phrase`. Il faut l'annuler : `ph.minHeight = null`.

**Deuxième cause, découverte au contrôle.** Les `Phrase — texte` réels ont un **interligne fixé à 20 px**, alors que le `Phrase — consigne` créé à la demande 6 était en interligne automatique, soit 17. Le placeholder doit porter le même : `lineHeight = { unit: 'PIXELS', value: 20 }`.

**Résultat :** le cadre vide passe de **66 à 46 px**, exactement la hauteur d'un cadre rempli d'une seule ligne. Vide et rempli ne se distinguent plus par la géométrie.

Deux cartes de modalités étaient restées en hauteur fixe : passées en HUG.

---

## Demande 18 — Abandon des boutons ronds

> C'est ok d'abandonner les boutons, et sur l'option 7, pour renforcer l'idée d'action, faire ressortir de nouveau les deux zones avec un fond très légèrement plus clair, qui disparaît lorsque la sélection est faite.

**La règle finale, en une phrase :** la classification n'a qu'une seule forme, et c'est l'état qui change de registre, pas la forme.

| | forme | mot | fond et couleur |
|---|---|---|---|
| à renseigner | glyphe 18 + libellé 13 | l'étiquette : « Catégorie », « Zone corporelle » | voile **blanc à 35 %**, rayon 13, hauteur **26** ; glyphe et texte en **accent #0508E5** |
| renseigné | glyphe 18 + libellé 13 | la valeur : « Renforcement » | **aucun fond**, hauteur **20** ; glyphe teinté de la couleur de la catégorie, texte lié à `color/text-primary` |

**Le point de construction à ne pas rater : rien ne doit bouger entre les deux états.** Le voile **déborde à gauche**, le contenu non. On y parvient en compensant le retrait interne de la pastille sur celui de la ligne :

| | retrait de la ligne | retrait gauche de la pastille | abscisse du glyphe |
|---|---|---|---|
| à renseigner | 6 | 8 | **38** |
| renseigné | 14 | 0 | **38** |

Le glyphe reste donc à l'aplomb du texte du nom dans les deux cas. La hauteur passe de 26 à 20, mais la ligne qui les contient fait 32 et aligne son contenu au centre : le glyphe ne se déplace pas verticalement non plus. En clair, la formule est `paddingLeft(ligne) = X(texte du nom) − X(ligne) − paddingLeft(pastille)`.

**Les boutons ronds disparaissent du parcours.** Toute la famille `Action contextuelle — …` et ses rectangles `Zone tactile — Action contextuelle — …` sont retirés des 8 écrans concernés. Sur `Prototype MVP` il restera à retirer les composants devenus inutiles : `Catégorie — contour`, `Catégorie — pleine` et le bloc `Boutons d'action contextuelle — repos et…`.

**Piège — la source d'un clone ne doit pas être dans l'ensemble modifié.** Le glyphe `Zone corporelle — homme, pleine` (`7413:31166`) vivait **à l'intérieur d'un des boutons ronds supprimés par la passe**. Le premier essai a échoué sur `clone: The node does not exist`. Il faut prendre la source sur un écran que la passe ne touche pas — ici le `Zone corporelle — glyphe` déjà posé sur un écran déployé.

**Volumétrie :** 8 écrans refaits — **5 entièrement vides**, **3 en régime intermédiaire**. Avec les 35 déjà déployés, la page compte **43 écrans conformes, 0 bouton rond restant**, glyphe à x38 sur les 43, cibles de 48 px sans chevauchement.

| état | écrans |
|---|---|
| les deux renseignés | 35 |
| les deux à renseigner | 5 |
| catégorie renseignée, zone à renseigner | 3 |

---

## Point fermé — le régime intermédiaire

Trois écrans — `Ajouter un exercice — Catégorie renseignée`, `— Zones corporelles`, `— Nouvelle zone corporelle` — sont dans l'état **catégorie choisie, zone corporelle pas encore**. Ils portent donc une pastille cerclée avec point de couleur d'un côté et un bouton rond de l'autre, alors que les 40 autres écrans sont en légende plate.

Trois régimes coexistent aujourd'hui, pour deux informations de même rang :

| état | catégorie | zone corporelle |
|---|---|---|
| rien de choisi | bouton rond | bouton rond |
| **un seul choisi** | **pastille cerclée + point de couleur** | **bouton rond** |
| les deux choisis | légende plate, glyphe teinté | légende plate, silhouette |

**Issue retenue :** les trois régimes sont ramenés à un seul, et les boutons ronds abandonnés — voir la demande 18. La catégorie ne change plus d'apparence au cours du parcours ; seuls le mot et le fond changent.

Les planches d'arbitrage restent sur la page à titre de trace : `Classification — Options de discrétion` (`7896:14505`), `Classification — Marqueur de catégorie` (`7909:14511`), `Classification — États intermédiaires` (`7919:14781`). Ce ne sont pas des écrans du produit et elles n'ont pas à être recréées sur `Prototype MVP`.

---

## Demande 19 — Composition de séance : sélections à gauche, actions à droite

> Le bouton étiquette est du même ordre, mais il est combiné avec de vrais boutons d'action. Convention : boutons d'actions alignés à droite, icônes de sélection à gauche sur le format catégorie / zone corporelle.

**Le constat.** La ligne `Durée + actions` portait **trois cercles identiques de 34 px** alignés à droite. Deux sont de vraies actions — `Ajouter un arrêt`, `Ajouter une activité` — et le troisième, `Action contextuelle — Étiquette`, est une **sélection** : il ouvre un choix et affiche ensuite un libellé. Rien ne les distinguait. L'étiquette avait de plus la même double vie que la catégorie — cercle 34 à vide, **pastille cerclée de 98 px** une fois choisie. C'était le dernier porteur de cette forme dans le fichier.

**La règle posée, de portée fichier :** dans une ligne qui mélange les deux genres, **les sélections vont à gauche au format légende, les actions restent à droite au format bouton**.

**Structure installée** — la ligne devient un vrai auto-layout, elle ne l'était pas (tous ses enfants étaient en `ABSOLUTE`) :

```
Durée + actions (HORIZONTAL, SPACE_BETWEEN, CENTER)
  Groupe — Informations (HUG, gap 10 à vide / 20 une fois choisie)
    Étiquette            ← la sélection, au format catégorie / zone
    TEXT ≥ 21 min        ← la métadonnée calculée
  Groupe — Actions (HUG, gap 10)
    Action contextuelle — Ajouter un arrêt
    Action contextuelle — Ajouter une activité
  Zone tactile — … (ABSOLUTE, inchangées pour les actions)
```

**Les boutons d'action n'ont pas bougé.** Ils finissaient à x378 et finissent toujours à x378 sur les 18 écrans : le `SPACE_BETWEEN` les ramène exactement où ils étaient. Seule l'étiquette quitte le groupe.

**L'étiquette au format sélection**, avec la couleur lue sur l'ancien bouton :

| état | contenu | fond |
|---|---|---|
| à choisir | glyphe `cil:tag` 18 en accent + « Étiquette » 13 en accent | voile blanc 35 %, rayon 13, hauteur 26 |
| choisie | glyphe 18 teinté de **la couleur de l'étiquette** (lue sur `Zone ronde — Étiquette`, ici #4678F5) + le libellé 13 lié à `color/text-primary` | aucun, hauteur 20 |

**Ordre retenu : étiquette d'abord, durée ensuite**, et une conséquence géométrique à connaître. Sur l'écran d'activité le voile peut déborder à gauche parce que le texte du nom est en retrait de 14 px dans son champ. Ici le titre de séance est à x24, contre la gouttière : **il n'y a pas de marge où faire déborder le voile**. Deux issues incompatibles :

- voile aligné sur la gouttière à x24, donc **glyphe à x32**, soit 8 px en retrait du titre — *retenu*, parce que le glyphe garde alors la même abscisse dans les deux états et que rien ne bouge à la sélection ;
- glyphe aligné à x24 sur le titre, donc voile débordant à x16, hors gouttière.

Le retrait interne de 8 est donc conservé **dans les deux états**, seul le fond disparaît.

**Volumétrie :** **18 écrans**, glyphe à x32 et titre à x24 sur les 18, écart optique étiquette → durée de 20 px partout. Un écran, `Composition séance — Étiquettes — Appui long — Confirmation`, ne porte pas la ligne.

**À confronter ailleurs :** la règle vaut pour tout écran mêlant sélection et action — catalogue et écrans de programme en premier lieu. Elle a sa place dans le prompt de documentation parmi les règles d'interface de portée fichier.

---

## Demande 21 — Suppression des cadres, le contenant va sur les modalités

> Je trouve que moins on a de cadres et de lignes, plus fluide est le parcours de l'écran. […] Mettre C en place sur un écran avant de déployer.

**Constat de départ :** un écran d'activité portait **trois liserés de trois couleurs différentes** — #BEC2CC pour la description, #E0E3E8 pour les modalités, #CDCEFA pour le média — et **deux rayons**, 8 et 12, pour des objets de même rang.

**La distinction qui commande la réponse :** la description est une **vraie saisie**, les modalités sont le **résumé d'une modale**, donc un objet de la famille des sélections (catégorie, zone, étiquette). Les deux n'appellent pas le même traitement.

**Option C, posée sur `Essai — Sans cadres (option C)` :**

| | avant | après |
|---|---|---|
| modalités | cadre blanc, liseré #E0E3E8, rayon 12, padding 12/14, hauteur 86 | **aucun contenant**, hauteur 60, phrase ramenée de x39 à **x24** |
| description | cadre blanc, liseré #BEC2CC, rayon 8 | **bloc teinté #F9FAFC, rayon 12, sans liseré** — la convention de bloc de section déjà en vigueur dans le fichier |

**Gain mesuré, et il règle un point ouvert :** le bas de la section Médias passe de **y824 à y796**, soit **au-dessus du bouton d'action** à y815. Les 28 px rendus par le cadre des modalités **résorbent le débordement** introduit par le passage de la description en liste d'étapes (demande 10). Le repli de l'accordéon Médias, jusqu'ici la seule issue envisagée, n'est plus nécessaire.

**Inversion retenue après essai.** Le cadre va **sur les modalités**, pas sur la description : c'est là qu'il y a quelque chose à appuyer, et il le dit. La description n'a plus de contenant du tout. L'écran s'appelle `Essai — Cadre sur les modalités`.

| | état final de l'essai |
|---|---|
| description | aucun contenant, `paddingLeft` 0 → **numéros à x24**, au fer des titres de section ; `paddingRight` 24 |
| modalités | bloc **#F9FAFC rayon 12 sans liseré**, `padding` 12 vertical / **24 horizontal** |

**Le retrait de 24 n'est pas arbitraire :** il vaut la gouttière de numérotation, soit la largeur du numéro plus son espacement. La phrase tombe ainsi exactement au fer du texte des étapes. Si la numérotation change de gabarit, le calcul suit.

**Colonnes obtenues :** x24 pour les titres de section, les numéros et le bord du cadre ; **x48** pour le texte des étapes **et** la phrase ; fer droit commun à **x354**. Le nom de l'exercice et le glyphe de catégorie restent à x38, la zone bleue ayant son propre retrait — assumé.

**Piège — le texte de la phrase déborde de son cadre.** `Phrase — texte` est en **largeur fixe de 324 px** sur 32 des 44 écrans. Tant que le cadre avait un rembourrage de 14, le débordement ne se voyait pas. Avec un rembourrage de 24, le texte sort de son cadre et la marge droite réelle tombe à **6 px** au lieu de 24. Il faut passer ces nœuds en **`layoutSizingHorizontal = 'FILL'`** lors du déploiement.

**Marges verticales :** titre de description → première étape porté de 4 à **10**. Pour mémoire, le titre des modalités est à 4 du bord du cadre mais à **16** de la phrase, le rembourrage s'ajoutant.

**Liserés :** les deux `Media / Preview` perdent le leur. C'était un #CDCEFA de 1,1 px sur fond blanc, invisible à l'œil mais comptant dans le total des lignes. **L'écran d'essai ne porte plus aucun liseré.**

**La marge appartient au cadre, pas au texte.** Dernier ajustement avant déploiement : le texte des étapes n'a **aucune marge droite** et court jusqu'à **x378**, le bord de la colonne de contenu. La phrase s'arrête à x354 parce qu'elle est dans un bloc dont le bord est à x378. Les deux textes partent du même fer gauche ; c'est le contenant qui fait la différence à droite.

**Gain cumulé :** la colonne de texte des étapes passe de 306 à 330 px, trois des quatre étapes tiennent sur une ligne, la description tombe de 196 à **134 px** et le bas de la section Médias de y824 à **y764**, soit 38 px au-dessus du bouton. Le débordement introduit par la liste d'étapes est résorbé sans toucher à l'accordéon Médias.

### Déploiement

**Volumétrie :** **44 écrans** — 44 descriptions débarrassées de leur cadre, 44 cadres posés sur les modalités, 43 accordéons portés à un interligne de 10, **32 textes de phrase passés en largeur adaptative**, **86 liserés d'aperçu média retirés**, 44 boutons à y802.

**Fers obtenus, identiques sur les 43 écrans du produit :**

| | gauche | droite |
|---|---|---|
| titres de section, numéros d'étape, bord du cadre | 24 | — |
| texte des étapes | 48 | **378** |
| phrase des modalités | 48 | **354** |

**Un seul écart, sans conséquence :** la maquette d'arbitrage `Description en liste — B Réorganisable` a une gouttière de 20 et non de 24, sa première colonne étant occupée par la poignée de déplacement et non par le numéro. C'est l'option écartée, conservée comme trace ; elle n'a pas à être rejouée.

**Point de méthode pour la reprise :** la gouttière n'est pas une constante. Elle est **lue sur la première étape** — largeur du numéro plus espacement de la ligne — puis reportée en rembourrage horizontal du cadre des modalités. C'est ce calcul qui garantit que la phrase tombe au fer du texte des étapes, quelle que soit la largeur du numéro.

---

## Demande 20 — Hauteur standard du bouton d'action

> Attention au positionnement du bouton de l'écran de test, il n'est pas à hauteur standard.

**Le défaut dépassait largement l'écran de test.** Relevé sur la page : **38 des 44 écrans** avaient dérivé, de **y779 à y903**, pour un standard à **y802**.

**La cause est structurelle, pas accidentelle.** `Action finale` est un enfant **en flux** du cadre d'écran, lequel est en auto-layout **VERTICAL**. Le bouton suit donc la hauteur du formulaire au lieu d'être fixé au bas de l'écran : chaque modification de contenu le déplace. Les demandes 10, 15, 17 et l'essai ci-dessus l'ont déplacé quatre fois.

**La référence :** sur `Prototype MVP`, les 41 écrans équivalents tiennent y802 parce que leur `Action finale` est en **`layoutPositioning = 'ABSOLUTE'`**, posée à y790 pour 84 de haut.

**Correction appliquée :** `Action finale` passée en ABSOLUTE puis recalée pour que le bouton tombe à y802. **44 écrans à y802, 0 écart.** Les écrans de composition de séance ne portent pas ce bouton unique et ne sont pas concernés.

**Règle à retenir pour toute passe future :** tant que `Action finale` est en flux, **toute** modification de hauteur de contenu redéplace le bouton. Vérifier y802 en fin de passe, ou passer la zone en absolu une fois pour toutes — ce qui est désormais le cas sur la page de conception.

---

## Corrections induites, non demandées

Deux conséquences mécaniques ont dû être traitées pour que le résultat soit juste. Elles sont à rejouer à l'identique.

**Le cadre des modalités gardait la hauteur du groupe supprimé.** Le cadre intérieur du bloc `Paramètres — Phrase éditable`, en auto-layout VERTICAL, était en `layoutSizingVertical = FIXED`. Passé à **HUG**, il épouse la phrase seule.
→ **21 cadres** concernés ; les autres étaient déjà en HUG.

**La description débordait au corps 15.** L'instance `Champ — Description de l'exercice` était en hauteur fixe et rognait la dernière ligne. Passée à **HUG**.
→ **38 champs** concernés, aucun n'a nécessité de redimensionnement manuel.

---

## Vérification finale

| contrôle | résultat |
|---|---|
| ancien libellé restant | **0** |
| nouveau libellé | 62 — dont 38 en Regular 11 et 24 en Semi Bold 18 |
| titres en Regular 11 à ≤ 30 px | **76** (75 convertis + 1 préexistant) |
| titres en Semi Bold 16 restants | **0** |
| groupes `Compte à rebours` restants | **0** |
| écrans avec la description en première position | **38 / 38** |

---

## Déploiement sur `Prototype MVP` — fait

Les 21 demandes ont été rejouées dans l'ordre consigné : libellé (4) → suppressions (2) → style des titres (1) → corps de texte (5, 17) → description en liste (10) → ordre des sections (3) → placeholder (6) → en-tête en HUG (15) → médias (7, 8, 9) → classification (11 à 14, 18) → composition (19) → cadres (21) → bouton (20).

**Volumétrie :** 41 écrans de formulaire, 19 de composition. 65 libellés, 41 pastilles Durée, 39 groupes Compte à rebours, 82 titres de section, 40 listes d'étapes, 11 placeholders, 82 aperçus agrandis, 40 couples d'icônes média, 82 liserés d'aperçu retirés, 41 lignes de classification, 41 cadres de modalités, 37 boutons recalés.

### Contrôle de parité

| | Prototype MVP | Conception — Hors MVP |
|---|---|---|
| écrans de formulaire conformes | **41 / 41** | **41 / 41** |
| écrans de composition conformes | **19 / 19** | **19 / 19** |
| bouton d'action | 41 à y802 | 41 à y802 |
| classification : les deux renseignées | 33 | 33 |
| les deux à renseigner | 5 | 5 |
| catégorie seule renseignée | 3 | 3 |
| fers : numéro / texte d'étape / fin | 24 / 48 / 378 | 24 / 48 / 378 |
| fers : phrase / fin de phrase / bord du cadre | 48 / 354 / 378 | 48 / 354 / 378 |
| écarts | **aucun** | **aucun** |

### Deux défauts révélés par le déploiement, corrigés sur les deux pages

**Troisième échec du sélecteur par nom.** `Modification d'une séance` porte la ligne `Durée + actions` mais ne commence pas par « Composition » : l'expression `/^Composition/i` l'avait laissé de côté sur la page de conception. Le critère structurel employé sur `Prototype MVP` — présence d'un nœud `Durée + actions` — l'a trouvé. **Les deux familles doivent être sélectionnées par structure :** `Contenu du formulaire` ou `Zone bleue — Nom de l'exercice et média` pour le formulaire, `Durée + actions` pour la composition.

**Lignes d'étape en `SPACE_BETWEEN`.** Un écran portait des lignes dont l'alignement principal poussait le libellé à droite, avec un texte en largeur fixe : le texte tombait à x78 au lieu de x48. Normalisation appliquée aux **416 lignes des deux pages** : alignement `MIN`, espacement 8, numéro en largeur fixe de 16 aligné à droite, libellé en largeur adaptative.

**Piège spécifique à `Prototype MVP` :** certains `Media / Preview` y sont des sous-nœuds d'instance — sur les écrans `Catalogue des Exercices` — et leur taille n'est pas modifiable. Il faut tester la chaîne des parents et les ignorer, sinon `rescale` lève une erreur et annule toute la transaction.

---

## Demande 22 — Nettoyage des boutons ronds retirés

> Tu peux retirer les composants devenus inutiles.

**Le recensement a contredit l'annonce, et la suppression n'a pas eu lieu telle qu'envisagée.**

**Ce qui n'est pas mort :** la famille `Action contextuelle` compte encore **200 nœuds en service** sur les deux pages — `Ajouter un arrêt`, `Ajouter une activité`, `Aujourd'hui`, `Planifier`, `Créer une séance` — sans compter les pages responsive. Le bloc de documentation `Boutons d'action contextuelle` décrit aussi `Pause` et `Ajouter une activité`, les deux boutons que la demande 19 a justement conservés à droite. **Supprimer le bloc aurait détruit la documentation de composants vivants.**

**Ce qui l'était vraiment :** un seul écran de produit, sur les deux pages.

### Le dernier résidu — `Composition séance — Étiquettes — Appui long — Confirmation`

Cet écran n'a **pas** de ligne `Durée + actions`. Son en-tête est un cadre `Résumé` de 402×53 portant **trois boutons ronds centrés**, sans texte de durée — une variante d'en-tête antérieure. Toutes les passes l'ont donc ignoré, y compris celle de la demande 19, et c'était le dernier endroit du produit affichant l'ancienne affordance.

**Correction appliquée, sur les deux pages :** `Résumé` passe en `SPACE_BETWEEN` avec un rembourrage de 24 à gauche et à droite, et reçoit la même structure à deux groupes que la ligne standard — `Groupe — Informations` avec l'étiquette en invite, `Groupe — Actions` avec Pause puis Ajouter une activité. Les actions finissent à **x378** et le glyphe est à **x32**, aux mêmes valeurs que les 19 autres écrans de composition. L'ordre des deux actions a été normalisé au passage : il était inversé.

### Les vignettes de documentation — conservées avec mention

`Catégorie — contour`, `Catégorie — pleine`, `Zone corporelle — contour` et `— pleine`, et leurs équivalents femme, ne sont plus référencés par aucun écran. Mais ce ne sont pas des composants : ce sont des **vignettes légendées « SVG fournis : contour et plein »**, qui tiennent le registre des fichiers sources livrés. Elles sont conservées, et une **mention de retrait** est posée en bas du bloc sur les deux pages, en #B1540F, rappelant que le motif n'est plus en service, que la catégorie, la zone et l'étiquette s'affichent désormais en légende, et que Pause et Ajouter une activité restent eux en service.

### Contrôle

| | Prototype MVP | Conception — Hors MVP |
|---|---|---|
| boutons ronds retirés, sur un écran de produit | **0** | **0** |
| dans le bloc de documentation | 2 | 2 |
| sur les planches d'arbitrage | 0 | 3 (volontaires) |
| famille `Action contextuelle` en service | 97 | 103 |

---

## Demande 23 — Contrôle segmenté à trois options dans le catalogue

> On revient à un contrôle segmenté à trois options dans le catalogue : exercices, séances, programmes. Dans prototype, programme étant désactivé pour l'instant.

**État de départ :** les écrans de catalogue portaient la variante `Deux options` avec `Exercices | Séances`. Deux écrans `PROG — 7` et `PROG — 8` portaient déjà une variante à trois éléments, mais dans l'ordre **Séances, Exercices, Programmes** — corrigé.

**Opération :** la propriété `État` de l'instance `DSF / Controls / Segmenté` passe à `Trois éléments — n sélectionné`, l'option retenue étant déduite du nom de l'écran :

| écran | option sélectionnée |
|---|---|
| `Catalogue des Exercices — …` | 1 |
| `Catalogue des séances — …` | 2 |
| `PROG — … Catalogue des programmes` | 3 |

Les trois libellés sont réécrits dans l'ordre **Exercices, Séances, Programmes**, le sélectionné en Medium, les autres en Regular.

**Désactivation sur `Prototype MVP` :** l'option Programmes n'y est jamais sélectionnée et son libellé est lié à **`color/text-tertiary`** (#7A7A80). Les écrans `PROG` n'existent pas sur cette page. L'option est donc présente et lisible, mais visiblement inactive.

**Volumétrie :** 21 écrans sur `Conception — Hors MVP` (7 Exercices, 12 Séances, 2 Programmes), 19 sur `Prototype MVP` (7 Exercices, 12 Séances), 0 écart, ordre conforme partout.

### Correction — trois variantes créées dans le DSF

La première bascule a réutilisé les variantes **`Trois éléments`**, qui sont celles du **sélecteur de période** (Jour / Semaine / Mois) : les noms de calques d'origine le montraient. Deux défauts en ont découlé — le **fond #EAEAFF des options non sélectionnées disparaissait**, et le catalogue se trouvait couplé au sélecteur de période, tout restylage de l'un touchant l'autre.

**Trois variantes ont donc été ajoutées** à `DSF / Controls / Segmenté` : **`État=Trois options — 1 / 2 / 3 sélectionné`**, reprenant exactement le style des `Deux options` :

| | valeur |
|---|---|
| cadre extérieur | 354×42, HORIZONTAL, `itemSpacing` 4, padding 4, fond blanc, rayon **14** |
| option | largeur **FILL** → 113, hauteur 34, rayon **10** |
| option sélectionnée | fond **#5F60EE**, libellé blanc |
| option non sélectionnée | fond **#EAEAFF**, libellé **#46464C** |
| libellé | **Inter Semi Bold 15**, centré |

Les fonds et les couleurs de texte sont **recopiés depuis la variante `Deux options`**, liaisons de variables comprises, et non ressaisis.

**Piège rencontré :** `figma.createComponent()` suivi de `layoutMode = 'HORIZONTAL'` met l'axe principal en HUG. Les trois composants se sont repliés à 121 px de large malgré le `resize(354, 42)` initial. Il faut forcer `primaryAxisSizingMode = 'FIXED'` **après** avoir ajouté les enfants, puis redimensionner.

**Corps retenu : Semi Bold 15.** Mesures du libellé le plus long, « Programmes », dans une option de 113 : **99 px à 16** (marge 7 de chaque côté), **93 px à 15** (marge 10).

### Règle de taille pour tous les contrôles segmentés

> 15 doit être appliqué à tous les contrôles segmentés sauf ceux de la modale des paramètres d'exécution qui peut être de 12, et de ceux du Rappel qui ne change pas.

Le relevé initial montrait **cinq tailles cohabitant** sur les 150 instances de `DSF / Controls / Segmenté` : Semi Bold 16, Medium 14, Medium 13, et le 15 du catalogue. La règle les ramène à trois cas.

| contexte | critère de reconnaissance | taille |
|---|---|---|
| **modale des paramètres d'exécution** | un ancêtre nommé `Modale — Paramètres d'exécution…` | **12** |
| **Rappel** | un `TEXT` valant exactement « Rappel » dans les 60 px au-dessus du contrôle | **inchangé** |
| tout le reste | — | **15** |

Le critère du Rappel ne peut pas être l'ancêtre : ce contrôle et le sélecteur de période `Jour / Semaine / Mois` partagent le même parent `Modale — Planifier une séance`. C'est la proximité du libellé qui les sépare. Le contrôle du Rappel n'a par ailleurs **aucun libellé lisible** — ses options ne portent pas de texte.

**Volumétrie :** **98 contrôles portés à 15**, **10 à 12**, **2 laissés** (le Rappel, un par page), 41 déjà conformes. **Aucun débordement** : sur les 150 contrôles, aucun libellé n'excède la largeur de son option.

**Le poids n'a pas été touché**, seule la taille. Il subsiste donc du Medium 15 (16 sélecteurs de période en modale) à côté du Semi Bold 15 (122 autres), et du Medium 12 à côté du Semi Bold 12 dans la modale des paramètres. À harmoniser si vous le souhaitez.

**La page `Archives — Écrans retirés du prototype` a été exclue** — 3 contrôles y restent en Medium 14, sur des écrans sortis du parcours.

**Pour mémoire — l'état antérieur.** « Répétitions » tenait en Semi Bold 16 dans une option de **105** avec 8 px de marge, soit plus serré que « Programmes » à 16 dans 113. La place n'était donc pas la contrainte ; le 15 est un choix de discrétion.

**Pas d'état inactif.** L'option Programmes est **active sur les deux pages**. Les surcharges posées sur `Prototype MVP` ont été retirées par `resetOverrides()` puis repose de la variante — et non en vidant les `fills`, ce qui aurait rendu l'option transparente au lieu de lui redonner le fond du composant. Sur le prototype, aucun écran ne sélectionne Programmes, les écrans `PROG` n'y existant pas : l'option y est simplement non sélectionnée.

---

## Demande 24 — Repère de la ligne en cours de réglage

> Dans la modale des paramètres d'exécution, le liseré gras de couleur autour du cadre de l'option sélectionnée ne rend pas très bien. […] Option B, mais avec le fond pâle qui couvre aussi le contrôle segmenté, ce qui est dépendant.

**Ce que marquait le cadre.** `Cadre sélectionné — …` n'indique pas une option choisie dans une liste : il désigne **la ligne en cours de réglage**, celle à laquelle appartient le contrôle déployé en dessous. L'ancien traitement — liseré **#0508E5 de 2 px** et fond #F4F4FF — encerclait la seule ligne de libellé, laissant le contrôle dépendant hors de la zone.

**Traitement retenu :**

| | avant | après |
|---|---|---|
| liseré | #0508E5, **2 px**, INSIDE | **aucun** |
| fond | #F4F4FF sur 42 px | **#F4F4FF sur toute la hauteur du groupe** |
| repère | — | **barre verticale 3 px** en #0508E5, rayon 1,5, collée au bord gauche, hauteur du cadre moins 16 |

Le repère **désigne au lieu d'encercler**, et la zone englobe la ligne **et** son contrôle, ce qui rend la dépendance visible.

**La hauteur se lit sur le contrôle déployé, et sur rien d'autre.** La zone va du haut de la ligne au **bas du contrôle que cette ligne a ouvert** — un nœud `Roulette — …` ou `Contrôle segmenté — …` — plus 8 px. Valeurs obtenues : **96 px** pour un contrôle segmenté (4 cas), **114** pour celui de l'ordre des côtés, **204** pour une roulette (2 cas).

**État final, après la demande 25.** Le popover a retiré tout contrôle du flux : plus aucune ligne n'ouvre de groupe. Les **7 cadres de chaque page sont ramenés à 42 px**, barre verticale à **26**. La règle de lecture ci-dessus reste consignée parce qu'elle redevient nécessaire si un contrôle se redéploie un jour dans le flux — et parce qu'elle décrit l'état antérieur conservé sur `Essai — Ligne réglée — Référence actuelle`.

**Trois fausses pistes, dont deux ont dû être défaites :**

- *Parcourir l'ordre des calques.* Dans cette modale, l'ordre des enfants ne suit pas l'ordre visuel : chercher le séparateur « suivant » par index avale la ligne d'après et donne 143 px au lieu de 96. **Raisonner sur les ordonnées.**
- *Se caler sur le séparateur suivant.* Semble logique — le filet clôt un groupe — mais un groupe entre filets peut contenir **deux réglages distincts**. Sur `Durée d'une série`, le filet ne vient qu'après « Pause après chaque série » : la zone couvrait 242 px et surlignait un réglage voisin qui n'avait rien ouvert.
- *Borner au libellé de la ligne suivante.* Variante de la précédente, cassée de l'autre côté : elle coupait la zone à 205 px sur `Durée totale`.

**Erreur à ne pas refaire — le retrait de x52 n'est pas lié à la surbrillance.** Deux libellés de la modale, **« Durée d'une série » et « Pause après chaque série »**, sont en retrait à **x52** en permanence, sur tous les écrans et quelle que soit la ligne en cours de réglage. Ce sont des **sous-réglages de « Séries »** : le retrait encode une hiérarchie de réglages, pas un surlignage. Tous les autres libellés de la modale sont à **x36**.

Ce retrait a été pris à tort pour une marque d'appartenance à la zone réglée, puis déplacé deux fois — d'abord 7 libellés de x36 vers x52, ensuite 14 de x52 vers x36 — avant d'être rétabli à son état d'origine : **11 libellés remis à x52, 13 ramenés à x36 par page**. L'état correct est vérifiable sur l'écran `Essai — Ligne réglée — Référence actuelle`, copie prise avant toute intervention.

**Volumétrie :** **7 cadres par page, 14 au total**, mêmes hauteurs des deux côtés, **tous à 42 px** depuis la demande 25. Les écrans `Essai — Ligne réglée` sont conservés : la copie « Référence actuelle » vaut comme état antérieur de la modale.

---

## Demande 25 — Les sélections des paramètres d'exécution passent en popover ancré

> Pour les paramètres d'exécution, y a-t-il un mode ou un format de sélection plus discret que le contrôle segmenté ? […] N'existe-t-il pas une liste qui s'ouvre à l'emplacement exact de la valeur du contrôle, par-dessus le reste ? […] Je garde le popover pour la durée aussi, ça limite les formats et l'apprentissage ne se fait que la première fois. […] Tu peux déjà appliquer le popover aux deux autres contrôles segmentés — je ne parle que des contrôles segmentés de la modale de paramètres d'exécution.

**Déployé sur les deux pages.** Le détail de l'arbitrage et des mesures est conservé ci-dessous ; l'état déployé est décrit à la section « Déploiement » en fin de demande.

Quatre écrans de comparaison sont posés sur `Conception — Hors MVP`, sous les planches précédentes, tous copiés de `Création activité — Paramètres en modale — 4` :

| écran | id | traitement |
|---|---|---|
| `Essai — Sélection — Référence` | `8005:14824` | contrôle segmenté déployé, état actuel |
| `Essai — Sélection — A Pastille` | `8005:14931` | contrôle retiré, la pastille porte seule la valeur |
| `Essai — Sélection — B Segmenté dépouillé` | `8005:15038` | options visibles, sans cadre ni pastille pleine |
| `Essai — Sélection — C Popover ancré` | `8012:14823` | liste ouverte sur la valeur, par-dessus le reste |
| `Essai — Sélection — D Roulette en popover` | `8015:14823` | la roulette traitée au même motif |

**Le constat qui change la question.** La ligne **portait déjà sa valeur** dans une pastille `Valeur modifiable` affichant « Durée », juste à droite du libellé. Le contrôle segmenté répétait donc une information présente une ligne plus haut, au prix de **50 px** et d'un surlignage de groupe destiné à dire à qui il appartenait. La question n'est pas « quel contrôle » mais « faut-il un contrôle déployé ».

**Le motif du popover existe déjà, à deux endroits :**

- **`Date picker — Popover calendrier`** — 310×310, fond **#F6F6F9**, liseré **#C7C7D1 à 70 %**, rayon **16**, par-dessus le voile `Voile modal — Planification` en **#1F2129 à 34 %**. En service sur `Planifier une séance — Sélecteur de date ouvert`. C'est le gabarit à reprendre.
- **`DSF / Overlays / Menu contextuel`** — composant 165×31, liste ancrée sur l'élément qu'elle commande. Stylé en action **destructive** (#D92D20) : à ne pas prendre comme base pour une liste de valeurs.

**Ce que vaut C, mesuré.** Popover de **184 × 140**, trois entrées de 40 px séparées d'un filet, valeur courante en accent Medium, **bord droit aligné sur celui de la pastille** (x366), ouvert 8 px sous elle. Il ne recouvre pas son ancre et ne déborde pas de l'écran. Dans le flux, la ligne retombe à **42 px** et les 50 px sont rendus.

C résout l'arbitrage que les options A et B opposaient : A donne la compacité mais cache les options, B montre les options mais garde la hauteur. **C donne les deux**, au prix d'un appui. L'affichage permanent des options n'a d'intérêt qu'au moment de choisir, c'est-à-dire quand le popover est ouvert.

**Règle d'ancrage à écrire dans le DSF.** La mesure ci-dessus vaut pour une ligne **haute** dans la modale. Pour « Fin d'exercice » ou « Bip de cadence », en bas, le popover devra s'ouvrir **au-dessus** de la pastille. C'est la règle d'ancrage classique, et elle conditionne le développement.

**Piège de construction.** Les cadres d'écran de cette page sont en **auto-layout vertical** : un voile ou un popover ajouté en enfant se range à la suite du formulaire au lieu de se superposer — mesuré à y1650 au lieu de y417. Il faut le passer en **`layoutPositioning = 'ABSOLUTE'`** *et* le réinsérer en fin de liste pour qu'il passe au-dessus.

**Non maquetté, et pourquoi.** La pastille avec feuille de choix et la pastille qui fait défiler sont **visuellement identiques** : elles ne diffèrent que par ce qui se passe à l'appui. Les poser côte à côte aurait reproduit l'erreur commise sur les options 1 et 3 de la description en liste, où deux maquettes présentées comme distinctes ne l'étaient pas.

### Décision prise — le popover pour tous, roulettes comprises

**Pas d'exception pour le sélecteur de mode.** J'avais plaidé pour garder « Durée / Répétitions / À l'échec » visible en permanence, au motif qu'il enseigne l'existence des trois modes. Arbitrage rendu en sens inverse, et il se tient : **l'apprentissage ne se fait qu'à la première création**, alors que le coût de l'affichage permanent est payé à chaque ouverture de la modale. Limiter le nombre de formats vaut mieux qu'optimiser le premier usage.

**Les roulettes suivent le même motif** — maquette `Essai — Sélection — D`, construite depuis `Paramètres en modale — 6 Durée` :

| | avant | après |
|---|---|---|
| roulette | **330×150 déployée dans le flux** | dans un popover de **354×176** |
| ligne | **204 px** | **42 px** |
| gain dans le flux | — | **158 px** |

Le popover de roulette est calé sur la **colonne de contenu x24→378**, et non ancré au bord droit de sa pastille comme celui de la liste : à 354 px de large il n'y a pas d'autre position possible. Les deux popovers partagent le reste — fond #F6F6F9, liseré #C7C7D1 à 70 % en `strokeAlign INSIDE`, rayon 16, voile #1F2129 à 34 %, ouverture 8 px sous la pastille.

**Conséquence sur la modale entière :** plus aucun contrôle ne se déploie dans le flux. Toutes les lignes font 42 px, le `Cadre sélectionné` n'a plus de groupe à couvrir, et la demande 24 — fond pâle et barre sur la hauteur du groupe — se réduit au surlignage d'une ligne simple. **Reprise dans la même passe que le déploiement**, pour ne pas laisser d'état intermédiaire incohérent.

### Validation et annulation du popover de roulette

Une liste a un événement « choisir » — un appui sur une entrée. **Une roulette n'en a pas** : la valeur change en continu et rien ne dit quand c'est fini. Il faut donc des boutons, là où le popover de liste s'en passe.

**Boutons retenus : les deux ronds de l'en-tête de modale**, repris tels quels — `Action / Cancel` et `Action / Validate`, cercles de 38 px — posés **dans les coins hauts du popover, à 8 px des bords**. Ils ne prennent aucun pixel à la roulette, sont déjà connus de l'utilisateur puisqu'ils ferment et valident la modale située derrière, et n'exigent aucun composant nouveau.

Une première tentative plaçait deux boutons de texte dans une barre basse : elle amputait la roulette de 46 px, soit deux rangées de chiffres sur sept. Abandonnée.

**Dégagement entre les boutons et la roulette** — pour qu'un glissé vertical ne déclenche pas une validation par erreur. Le rembourrage haut du popover vaut **le bas des boutons plus 12 px**, et non une valeur en dur : il suit si le gabarit des boutons change. Le popover passe de 176 à **222 px**, largeur inchangée à 354.

**Réserve mesurée :** la zone tactile réelle des boutons fait 48 px là où le cercle n'en fait que 38, soit 5 px de débord invisible. L'écart effectif entre la première rangée de chiffres et la cible du bouton est donc de **13 px**, et non 18. Suffisant pour un glissé, juste pour un appui hésitant ; porter le dégagement à 20 px coûterait 8 px de hauteur.

### La roulette elle-même — composant `DSF / Forms / Roulette`

**Sept rangées au lieu de cinq**, avec quatre niveaux de visibilité :

| distance au centre | corps | opacité |
|---|---|---|
| sélectionné | Medium 20 | 100 % |
| ±1 | Regular 16 | 45 % |
| ±2 | Regular 14 | 20 % |
| ±3 | Regular 12 | **10 %** |

Le rythme passe de 28 à **21 px** entre rangées, ce qui fait tenir sept rangées dans les **150 px d'origine** : le cadre ne bouge pas, donc ni le popover ni les boutons.

**Défaut corrigé au passage :** la rangée haute de la colonne des minutes était un **nœud de texte vide**, de largeur nulle. La colonne n'affichait que quatre chiffres sur cinq, avec un trou en haut.

**Zones de défilement.** Deux rectangles `Zone de défilement — minutes` et `— secondes`, pleine hauteur, partagent la largeur sans zone morte : **x0→187** et **x187→330**. Chacune couvre à la fois les chiffres et le mot d'unité.

**La règle d'usage qui va avec, et qui est le point important :** les deux colonnes défilent, mais **le geste doit se faire sur le mot « minutes » ou « secondes »**, à droite des chiffres, pour que le doigt ne masque pas les valeurs pendant le défilement. La colonne d'unité est donc la zone **recommandée**, non la zone exclusive — rendre les chiffres inertes aurait donné une roulette qui paraît bloquée à qui glisse dessus par réflexe. À documenter dans le DSF comme recommandation, et à soutenir par la largeur de la colonne d'unité.

**Attention à la portée :** ces modifications portent sur le **composant**, variante `État=Minutes secondes` (`5544:5118`), et non sur la seule maquette — on ne peut pas ajouter d'enfants à une instance. Elles se propagent donc à toutes les roulettes du fichier, « Durée totale » comprise.

### Déploiement — fait sur les deux pages

**Portée :** les contrôles **situés dans `Modale — Paramètres d'exécution`**, et eux seuls. Les contrôles segmentés du catalogue, du Rappel et des autres écrans ne sont pas touchés.

**Sélecteur :** dans chaque écran portant un nœud `Modale — Paramètres d'exécution`, tout enfant nommé `Contrôle segmenté — …` ou `Roulette — …`.

**Volumétrie, identique sur les deux pages :** **5 contrôles segmentés** et **2 roulettes** convertis, **7 cadres de ligne** ramenés à 42 px, **aucune anomalie**.

| écran | contrôle d'origine | popover | rendu au flux |
|---|---|---|---|
| `Paramètres en modale — 4` | segmenté Mode | liste 3 entrées, 184×136 @ y417 | **50 px** |
| `Paramètres en modale — 6` | roulette Durée | roulette 354×216 @ y439 | **158 px** |
| `Paramètres en modale — 7` | roulette | roulette 354×216 @ y607 | **158 px** |
| `Paramètres en modale — 8` | segmenté Changement de côté | liste 3 entrées, 184×136 @ y627 | **50 px** |
| `Paramètres en modale — 10` | segmenté Mode | liste 3 entrées, 184×136 @ y459 | **50 px** |
| `Paramètres en modale — 11` | segmenté Mode | liste 3 entrées, 184×136 @ y501 | **50 px** |
| `Ordre des côtés — 7` | segmenté Ordre des côtés | liste 2 entrées, 252×121 @ y553 | **68 px** |

**Opérations par écran, dans cet ordre :**

1. `Cadre sélectionné` ramené à **42 px**, barre verticale à **26 px**, repositionnée à 8 px du haut.
2. Le contrôle segmenté est **supprimé** ; la roulette est **déplacée** dans le popover.
3. Les frères situés **sous** le contrôle remontent de `hauteur du contrôle + 8`.
4. Voile **402×874 en #1F2129 à 34 %**, puis popover — tous deux en `layoutPositioning = 'ABSOLUTE'` et insérés en **dernier** pour passer au-dessus.

**Largeur du popover de liste :** `min(354, max(184, texte le plus long + 32))`. Les trois listes de 3 entrées tiennent en **184** ; celle de l'ordre des côtés demande **252** (voir demande 26).

**Ancrage :** bord droit aligné sur celui de la pastille `Valeur modifiable`, ouverture 8 px sous elle, borné à la colonne de contenu **x24→378** et au bas d'écran à 24 px. Le popover de roulette, à 354 px, est calé sur la colonne.

---

## Demande 26 — Ordre des côtés : libellé sur une ligne et ligne de type

> Pour l'ordre des côtés, élargir la fenêtre pour que le texte tienne sur une ligne, ajouter pour chaque ligne une deuxième ligne avec l'information de type (D D) (G G) écrit en plus petit.

**Largeur.** « Les deux côtés à chaque série » mesure **216 px** en Regular 15 et **218** en Medium 15 — le libellé peut être sélectionné, donc c'est le Medium qui dimensionne. Avec 16 px de marge de chaque côté et 1 px de liseré intérieur : **252 px**. Le popover reste ancré à droite sur la pastille, son bord droit ne bouge pas (x366) : il s'élargit **vers la gauche**, de x182 à **x114**.

**Seconde ligne.** Chaque entrée porte désormais deux textes, dans un empilement vertical de gap 2 :

| | corps | couleur |
|---|---|---|
| libellé | Inter Medium 15 si sélectionné, Regular 15 sinon | text-primary / accent |
| type | **Inter Regular 11** | **`color/text-tertiary`** (`VariableID:6935:11529`, #7A7A80) |

**La notation n'est pas à inventer : elle est dans le DSF.** `DSF V2 / Controls` contient le jeu **`État=Deux détaillé — premier / — second`**, un contrôle segmenté à deux options qui porte déjà ces deux libellés **avec leur sous-titre**, en Inter Regular 11. L'idiome « libellé + notation en plus petit » préexistait donc à la demande, pour ce réglage précis — c'est le contrôle segmenté que le popover a remplacé, et la conversion avait perdu son sous-titre. Les chaînes sont reprises **mot pour mot** :

| libellé | sous-titre, repris du DSF |
|---|---|
| Un côté après l'autre | **`(D1 → D2) → (G1 → G2)`** |
| Les deux côtés à chaque série | **`(D1 → G1) → (D2 → G2)`** |

**Deux séries, pas trois.** Le motif se lit sur deux séries ; la troisième allonge sans rien ajouter — 211 px contre 133 en corps 12. Une première pose utilisait une notation simplifiée de mon fait, `(D D) (G G)` / `(D G) (D G)`, remplacée par celle du DSF pour que les deux endroits disent la même chose.

L'entrée passe de 40 à **49 px** (8 + 18 + 2 + 13 + 8), le popover de 96 à **117**. Le sous-titre mesure 122 px, très en dessous des 218 de largeur utile : **la largeur du popover reste fixée par le libellé**, pas par la notation. Bas du popover à y670, soit 204 px de dégagement avant le bas d'écran.

**Défaut trouvé et corrigé.** Le libellé « Les deux côtés à chaque série » contenait un **saut de ligne forcé** (`U+2028`, séparateur de ligne) entre « côtés » et « à ». Il se repliait donc sur deux lignes quelle que soit la largeur disponible, et aucune largeur de popover n'y aurait changé quoi que ce soit. Le caractère a été remplacé par une espace.

**À retenir pour les passes suivantes :** un libellé qui se replie dans un cadre manifestement assez large porte probablement un saut de ligne en dur. Et un sélecteur par comparaison de chaîne échoue dessus silencieusement — c'est ce qui est arrivé ici au premier essai, où seule la première entrée a été traitée. **Normaliser `U+2028`, `U+2029`, `\n` et `\r` avant toute comparaison de libellé.** À noter aussi que ces échappements ne survivent pas dans un littéral d'expression régulière passé au plugin : passer par `String.fromCharCode`.

**Portée.** Les deux écrans `Ordre des côtés — 7 Sélection : Un côté après l'autre` (une par page) **et** la maquette `Essai — Sélection — G Ordre des côtés`, pour que la pièce d'arbitrage reste conforme au déployé. Les autres popovers de liste — Mode d'exécution, Changement de côté — n'ont **pas** de ligne de type : leurs libellés sont explicites et tiennent déjà sur une ligne en 184.

**Règle à retenir du cas.** Avant d'écrire un libellé ou une notation dans un popover, **chercher si le contrôle remplacé en portait déjà une dans le DSF**. Une conversion de contrôle perd silencieusement les textes secondaires du composant d'origine.

---

## À surveiller lors d'une reprise ultérieure

**Compter avant d'agir.** La page MVP peut contenir un nombre différent d'écrans de la famille. Les totaux ci-dessus sont ceux de la page hors MVP ; un écart de volumétrie signale un écran supplémentaire ou manquant, pas une erreur de sélecteur.

**Le titre préexistant en Regular 11.** Un titre était déjà au bon style avant intervention, d'où 76 et non 75. Si le compte final sur MVP vaut exactement le nombre de titres convertis, c'est que ce cas n'y existe pas — ce n'est pas un problème.

**L'ordre des passes compte.** Supprimer le groupe **avant** de passer les cadres en HUG, sinon le cadre épouse un contenu qui va disparaître. Et agrandir le texte **avant** de passer les champs en HUG, pour la même raison.

**Les apostrophes.** Les libellés utilisent l'apostrophe typographique `’` et non `'`. Un sélecteur avec l'apostrophe droite ne trouve rien.

**Le critère des 30 px** suppose que les cadres d'écran font 402 de large et que les titres de section sont à x24. Si un écran MVP a une autre mise en page, vérifier avant de lancer la passe.

**La variante DSF n'est à créer qu'une fois.** `Action=Lecture` appartient au jeu de composants, pas à une page. Sur `Prototype MVP`, il n'y a que des **instances** à poser — ne pas recréer la variante, au risque d'avoir deux boutons de lecture dans le DSF.

**Poser les icônes avant de convertir la description.** La conversion en liste d'étapes déplace la section Médias vers le bas ; les positions d'ancrage des icônes sont calculées par rapport à l'aperçu, pas à l'écran, donc l'ordre est en principe indifférent — mais la vérification du débordement n'a de sens qu'une fois la description convertie.

**Les deux maquettes de référence** (`Description en liste — A` et `— B`) n'ont pas à être recréées sur `Prototype MVP` : ce sont des pièces d'arbitrage, pas des écrans du produit.
