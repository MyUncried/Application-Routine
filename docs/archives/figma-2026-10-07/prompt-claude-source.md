# KODJO — Prompt de mise à jour : documentation, DSF, développement

**Objet** : consolider l'ensemble des modifications de conception réalisées sur le fichier Figma `G6RY5Ebhgwb4AHIOYDwwvg` (page « Prototype MVP ») afin de (1) mettre à jour la documentation fonctionnelle, (2) mettre à jour le Design System Figma (DSF), (3) aligner le développement React Native.

**Périmètre couvert** : refonte du mécanisme de pause (récupération + point d'arrêt), paramètre de cadence des répétitions, phrase de synthèse générée, système d'états d'icônes (repos / activé), nouvelles familles d'icônes.

**Hors périmètre** : écrans communautaires (lot C et suite), états d'exécution des séries cadencées, promotion des cartes dans le DSF.

---

## Comment utiliser ce document

Trois destinataires, trois lectures :

| Destinataire | Sections à lire |
|---|---|
| Rédaction documentaire | 1, 2, 4, 5, 7 |
| Design System (Figma) | 2, 3, 4.4 |
| Développement | 1, 5, 6, 8 |

Les identifiants de nœuds Figma (`7059:13302`) sont donnés pour permettre la vérification directe dans le fichier. Les valeurs chiffrées sont celles mesurées dans le fichier, pas des intentions.

---

## 1. Concepts et comportements modifiés

### 1.1 Unification récupération / point d'arrêt sous le concept de « pause »

**Avant** : deux mécanismes distincts. La récupération était posée automatiquement après chaque activité avec une valeur par défaut ; le point d'arrêt se posait via un écran de placement dédié.

**Après** : un seul mécanisme de placement, un seul écran, deux types de pause.

Règles :

1. Il n'y a **aucune récupération par défaut** dans une séance. Une séance nouvellement composée n'en comporte pas.
2. La récupération se pose par le même geste que le point d'arrêt : on entre en mode placement, les emplacements inter-activités s'affichent en pointillés, on sélectionne.
3. Chaque emplacement propose **deux blocs côte à côte** : un bloc « Récupération » et un bloc « Point d'arrêt ». Les deux blocs ont une largeur identique et des marges gauche/droite identiques par rapport au cadre de l'exercice.
4. **La sélection est multiple** : plusieurs récupérations et plusieurs points d'arrêt peuvent être posés en une seule entrée en mode placement.
5. Lorsqu'une récupération est sélectionnée, **la modale de durée s'ouvre immédiatement** et doit être renseignée. La valeur proposée est `0 min 30 s`.
6. Le bouton de confirmation porte le décompte : « Confirmer 2 pauses ajoutées ». Le bouton d'annulation reste « Annuler » (il ne devient pas « Confirmer »).
7. La valeur par défaut `30 s` s'applique **au moment de l'ajout** d'une récupération, pas à la séance. Autrement dit : la récupération n'existe pas tant qu'elle n'a pas été ajoutée ; c'est sa *valeur* qui a un défaut, pas sa *présence*.
8. Une récupération se supprime comme un point d'arrêt se supprime (même geste, même format d'écran de confirmation).

**Conséquence sur les séances existantes** : aucune reprise prévue. Le projet est en phase de conception, la migration des séances déjà composées n'est pas traitée — décision explicite.

### 1.2 Règles d'affichage de la récupération à zéro

Trois cas, à appliquer partout dans la composition de séance :

| Cas | Comportement |
|---|---|
| Récupération = 0 s **et** aucun point d'arrêt à cet emplacement | La **ligne entière est supprimée** et la composition se réordonne (les activités se rapprochent). |
| Récupération = 0 s **et** un point d'arrêt présent | La **mention « Récupération 30 s » et son icône sont supprimées** ; le point d'arrêt reste. Le trait horizontal s'étend vers la gauche jusqu'au niveau du bord gauche de l'emplacement d'icône désormais vide. |
| Récupération = 0 s **après la dernière activité** | La ligne est supprimée (la séance se termine sur la dernière activité). |

Cette règle s'applique de manière uniforme : dans la composition affichée, dans l'écran de placement de pause, et après sortie de l'écran de placement.

### 1.3 Cadence des répétitions

**Nouveau paramètre optionnel**, disponible **uniquement en mode d'exécution « Répétitions »**.

| Propriété | Valeur |
|---|---|
| Plage | 1 à 60 secondes par répétition |
| Valeur par défaut | aucune (le paramètre est « Aucune ») |
| Unité affichée | « par répétition » |
| Contrôle | ligne autonome sous « Répétitions », avec valeur modifiable |
| Modale | roulette de secondes, variante dédiée du composant Roulette |

Comportement du contrôle : la valeur affiche « Aucune » ; un appui ouvre la roulette ; la sélection renseigne la valeur ; il n'y a pas d'interrupteur préalable (décision prise après comparaison avec la variante « interrupteur puis ligne »).

**Terminologie** : le mot retenu est **cadence**, et non *rythme* ni *fréquence*. Cadence est le terme sportif établi pour une récurrence d'un geste dans le temps (cadence de foulée, cadence de pédalage, cadence de coups). Les définitions des trois mots doivent figurer au glossaire de la documentation, avec *fréquence* mentionnée comme synonyme technique non retenu pour l'interface.

**Conséquence sur le symbole de durée totale** — hiérarchie à quatre niveaux :

| Situation | Rendu |
|---|---|
| Durée entièrement déterminée (mode Durée, séries fixes ou variables) | aucun symbole, durée exacte |
| Mode Répétitions **avec** cadence renseignée | `≈` (la durée devient estimable) |
| Mode Répétitions **sans** cadence | `≥` (minorant seulement) |
| Mode Jusqu'à l'échec | **durée totale omise** — aucune valeur, aucun symbole |

Le mode Jusqu'à l'échec n'a pas de minorant affichable : la ligne « Durée totale » disparaît. Elle n'affiche pas `≥ 0`, ni un tiret.

Ce changement de symbole est à appliquer sur **tous** les écrans affichant une durée totale en mode Répétitions.

**Comportement pendant l'exécution** — point à inscrire dans la documentation :

La cadence est un paramètre **déclaratif**. Elle ne pilote pas l'exécution : elle ne fait pas avancer le compteur de répétitions, ne déclenche aucun signal, et ne termine pas la série. C'est l'utilisateur qui termine sa série.

Sa seule manifestation à l'exécution est une **durée cible** (`répétitions × cadence`, par exemple `36 s` pour 12 répétitions à 3 s), affichée **sur la ligne de temps écoulé existante**, dans le **même style que le compte à rebours**. L'utilisateur voit s'il est en avance ou en retard ; rien ne l'y contraint.

En l'absence de cadence renseignée, l'écran d'exécution reste inchangé — pas de durée cible, donc pas de comparaison.

**Aucun écran d'exécution n'est à créer ni à maquetter** : l'écran existant porte déjà la ligne et le style nécessaires. Aucun nouvel état de moteur n'est introduit — un affichage de temps, pas une horloge directrice.

Option explicitement écartée : un guidage actif au tempo (compteur auto-avançant, signal par répétition). La cadence n'est pas un mécanisme de guidage à l'intérieur de l'exercice.

### 1.4 Phrase de synthèse

**Avant** : une collection de nœuds texte juxtaposés (valeurs dans des cadres gris modifiables, connecteurs en texte simple), assemblés visuellement.

**Après** : **un seul nœud texte généré** à la validation des paramètres.

Règles :

1. Le texte est produit par une fonction de génération côté application, à partir des paramètres validés. Il n'est pas composé de segments positionnés.
2. Les **cadres gris sont supprimés**. Les variables sont en **gras**, la couleur reste noire. Il n'y a plus de distinction visuelle entre « texte modifiable » et « texte non modifiable » : la modale s'ouvre désormais pour tous les champs, la distinction n'a plus d'objet.
3. Le texte occupe plusieurs lignes ; la **durée totale est sur la dernière ligne** du même bloc.
4. Pas d'espace supplémentaire avant la ligne « Durée totale ».
5. Une virgule ne doit jamais se retrouver isolée en début de ligne (gestion des césures).
6. Marges haute et basse du bloc équivalentes ; trait horizontal entre « Durée totale » et la ligne suivante recentré.

**Caractéristiques typographiques mesurées** :

| Propriété | Valeur |
|---|---|
| Police | Inter Regular 13 |
| Interligne | 20 |
| Largeur du bloc | 324 px |
| Capacité | ~45 caractères par ligne |
| Maximum observé | 211 caractères = 5 lignes = bloc de 192 px |

Un écran de référence a été créé pour le cas long : **« Création activité — Phrase longue (198 caractères) »** (`7119:27855`).

### 1.5 Grammaire de la phrase de synthèse

La phrase se construit en cinq groupes, dans cet ordre fixe :

| Groupe | Contenu | Exemple |
|---|---|---|
| 1 | Séries | `3 séries` |
| 2 | Contenu de la série (selon le mode) | `de durée variable (de 30 s, 45 s et 1 min)` |
| 3 | Pauses | `avec 30 s de pause entre les séries` |
| 4 | Côtés | `en alternant le côté droit puis gauche à chaque série` |
| 5 | Durée totale | `Durée totale ≈ 3 min` (ligne distincte) |

Règles d'énumération : **on énumère jusqu'à 3 valeurs**, au-delà on donne un **intervalle**.

| Nombre de séries variables | Formulation |
|---|---|
| ≤ 3 | `de durée variable (de 30 s, 45 s et 1 min)` |
| > 3 | `de durées variables, de 30 s à 1 min 15 s` |

Formulations de référence validées :

- `3 séries de durée variable (de 30 s, 45 s et 1 min), en alternant le côté droit puis gauche à chaque série.`
- `3 séries de durée variable (de 30 s, 45 s et 1 min), d'abord toutes du côté droit, puis du gauche.`
- `6 séries de durées variables, de 30 s à 1 min 15 s, en alternant le côté droit puis gauche à chaque série.`
- `3 séries de 12 répétitions cadencées toutes les 3 s, avec 30 s de pause entre les séries.`
- `1 série menée jusqu'à l'échec.`

Les anciennes formulations abrégées (`D→G`, etc.) sont **abandonnées**.

Le fichier **`generateur-phrase-activite_v13.xlsx`** (joint) contient les 100 combinaisons de paramètres et leur phrase, sur trois feuilles : *Grammaire* (les règles), *Toutes les phrases* (les 100 cas), *Calcul des durées* (la dérivation de la durée totale et du symbole). Ce fichier est la référence d'implémentation de la fonction de génération.

### 1.6 États des boutons d'action contextuelle : repos / activé

**Nouveau principe uniforme** : la différence entre un bouton au repos et un bouton activé est portée par **l'icône seule**.

| État | Icône | Cercle |
|---|---|---|
| Repos | icône **au trait** (contour) | fond blanc, contour fin |
| Activé | icône **pleine** (remplie de bleu) | **inchangé** — fond blanc, même contour |

Options écartées en cours d'exploration, à ne pas réintroduire :

- cercle à fond bleu (lecture « bouton pressable » trompeuse) ;
- contour de cercle épaissi ;
- fond pâle.

L'écran de référence est **« Boutons d'action contextuelle — repos et activé »** (`7245:13718`). Il pose, pour chaque bouton, les deux états côte à côte. Cet écran est la source de vérité : tout nouveau bouton contextuel doit y être ajouté avec ses deux états avant déploiement.

**Cas du signe `+`** : pas de version pleine. Le besoin d'un état activé pour le `+` n'a pas de cas d'usage identifié — décision de ne pas en créer.

---

## 2. Icônes

### 2.1 Couples contour / plein créés

Chaque couple doit exister dans le DSF comme un composant à deux variantes (`État = Repos | Activé`), pas comme deux composants séparés.

| Icône | Source | Contour | Plein |
|---|---|---|---|
| Étiquette | bootstrap-icons | `bi:tag` | `bi:tag-fill` |
| Catégorie | SVG fourni (proposition A) | `icone_categorie_proposition_A_contour.svg` | `icone_categorie_proposition_A_plein.svg` |
| Zone corporelle — homme | SVG fourni | `icone_zone_corporelle_homme_contour.svg` | `icone_zone_corporelle_homme_plein.svg` |
| Zone corporelle — femme | SVG fourni | `icone_zone_corporelle_femme_contour.svg` | `icone_zone_corporelle_femme_plein.svg` |
| Sablier (pause) | Material Symbols Light | `material-symbols-light:hourglass-outline-rounded` | `material-symbols-light:hourglass-rounded` |

Notes d'intégration :

- Les SVG fournis sont en 24 × 24, `viewBox="0 0 24 24"`. Le contour homme a `fill-rule="evenodd"`, le plein `fill-rule="nonzero"` — à respecter lors de la conversion, sinon les formes internes se bouchent.
- Couleur bleue de référence : `#0508E5`.
- La silhouette corporelle en version contour est un **tracé avec stroke** (`fills = []`, `strokes = #0508E5`, épaisseur 0.8), pas une forme pleine évidée. La version pleine est bien un remplissage.
- Les SVG fournis portent des métadonnées C2PA ; elles sont inoffensives mais peuvent alourdir les fichiers — à nettoyer à l'export.

### 2.2 Icône de pause générique composée

C'est une icône **construite**, pas une icône de bibliothèque. Elle combine le sablier et le symbole de pause pour représenter « les deux types de pause » sur le bouton générique.

Construction, sur une grille de 24 px :

| Élément | Géométrie | Couleur |
|---|---|---|
| Sablier | 20 × 20 à la position (0, 1) | trait bleu `#0508E5` (version repos : `hourglass-outline-rounded` ; version activée : `hourglass-rounded`) |
| Halo | ellipse 14 × 14, centrée en (18, 18) | blanc opaque — sert à ce que le cercle ne croise pas le trait du sablier |
| Pastille | ellipse 11 × 11, centrée en (18, 18) | fond **blanc**, contour bleu 1 px |
| Barres de pause | 2 rectangles 1,4 × 4,6 ; rayon 0,7 ; écart 2,2 ; centrés en (18, 18) | orange `#FF8D28` |

Contraintes de construction, issues des itérations :

- Le trait du cercle doit être **aussi fin que celui du sablier** (1 px, pas plus).
- Le cercle doit être **entouré d'un espace blanc** pour que ses traits ne croisent pas celui du sablier — c'est le rôle du halo.
- L'icône doit être **centrée dans le cercle** (vérifier l'optique, pas seulement les coordonnées).
- Le fond du cercle reste **blanc**, jamais bleu. Les barres restent **orange**, jamais blanches ni bleues.

**Erreur à ne pas reproduire** : un effet `DROP_SHADOW` orange de rayon 0 avait été appliqué sur le cadre du bouton, produisant un halo rouge visible autour de l'icône. À l'intégration, vérifier que `effects` est vide sur le conteneur du bouton.

**Version à traits blancs** : sur les cartes de placement d'une pause (fond bleu), l'icône utilise des traits blancs. C'est la seule variante colorimétrique autorisée.

### 2.3 Icônes remplacées

| Emplacement | Avant | Après |
|---|---|---|
| Durée, sur les cartes calendrier et suivi (6 variantes) | sablier | **chronomètre** `iconmind:study-timer-outline-thin` |
| Récupération, dans la composition de séance (52 repères) | sablier précédent | `material-symbols-light:hourglass-outline-rounded`, 13 px |

Le chronomètre sur les cartes : trait **gris**, lié à la **même variable** que l'icône de catégorie située au-dessus.

| Propriété | Valeur |
|---|---|
| Variable Figma | `VariableID:6754:11533` |
| Valeur | `#9499A8` |
| Épaisseur de trait | 0,9 px |
| Taille | 16 × 16 |

Instances modifiées sur la page « Composants — Cartes » (`6214:3519`) : `7192:13800`, `7192:13806`, `7192:13812`, `7192:13818`, `7192:13824`, `7192:13830`.

### 2.4 Hiérarchie des gris sur une carte — à documenter

Trois gris coexistent actuellement sur une même carte, sans règle écrite :

| Gris | Usage | Référence |
|---|---|---|
| `#14141A` | icône de nature (quasi-noir) | `color/cards/nature-icon` |
| `#9499A8` | icône de catégorie, chronomètre | `VariableID:6754:11533` |
| `#595E66` | texte de durée | variable texte-durée |

**Action documentaire** : écrire la règle qui justifie ces trois niveaux (ou en réduire le nombre). En l'état, un intégrateur ne peut pas deviner lequel appliquer à un nouvel élément.

### 2.5 Icône féminine supprimée

Sur l'écran « Ajouter un exercice — Initial », l'icône de zone corporelle féminine a été retirée. L'écran ne présente plus qu'une silhouette. Cette suppression est à refléter dans la documentation de l'écran.

---

## 3. Design System Figma (DSF)

### 3.1 Composants modifiés

**`DSF / Forms / Valeur modifiable`** (`6944:26423`)

Nouvel axe de variante **`État`** avec deux valeurs : `Normal` | `Grisé`.

| Variante | Nœud | Couleur |
|---|---|---|
| Grisé | `7092:13604`, `7092:13606` | liée à `color/disabled` = `#BEC2CC` |

Motif : un champ non renseignable devait apparaître grisé ; la correction était auparavant appliquée localement sur chaque écran, ce qui produisait des divergences (notamment un « Séries variables » grisé sans raison sur l'écran « Une seule série — 10 Options sans effet »).

**`DSF / Forms / Roulette`** (`5544:5146`)

Nouvelle variante **`État = Secondes avec unité`** (`7130:13496`), dimensions 330 × 150.

Caractéristiques : l'unité n'apparaît **que sur le chiffre sélectionné**, et elle est **attachée à l'étiquette « par répétition »** plutôt que répétée sur chaque ligne de la roulette. C'est le format déjà en vigueur sur la modale « 7 Durée totale activée (roulette ouverte) » — la nouvelle variante l'applique aux secondes.

### 3.2 Composants à créer

| Composant | Variantes | Contenu |
|---|---|---|
| `DSF / Icons / Étiquette` | Repos, Activé | `bi:tag` / `bi:tag-fill` |
| `DSF / Icons / Catégorie` | Repos, Activé | SVG proposition A contour / plein |
| `DSF / Icons / Zone corporelle` | Homme-repos, Homme-activé, Femme-repos, Femme-activé | SVG fournis |
| `DSF / Icons / Pause générique` | Repos, Activé, Repos-sur-fond-bleu | icône composée, cf. 2.2 |
| `DSF / Icons / Sablier` | Repos, Activé | Material Symbols Light hourglass |
| `DSF / Icons / Chronomètre` | — | iconmind study-timer-outline-thin |
| `DSF / Buttons / Action contextuelle` | Repos, Activé — × type d'icône | règle de 1.6 |

### 3.3 Dette de construction identifiée

Les boutons d'action contextuelle sont **dessinés écran par écran**, pas instanciés depuis un composant. Le déploiement d'une seule modification d'icône a exigé **19 éditions individuelles**, et le déploiement de l'icône de récupération **52 repères**. Chaque déploiement futur coûtera le même prix et comporte le même risque d'oubli.

**Action DSF** : componentiser ces boutons avant la prochaine campagne de modification d'icône. C'est le poste de dette le plus coûteux du fichier.

Autre point de méthode découvert : certains conteneurs portent un `layoutMode` autolayout non voulu, qui repositionne silencieusement les enfants (un bouton dont le label passe à droite de l'icône, un bloc poussé hors cadre par un padding de 14 px). À l'audit du DSF, vérifier le `layoutMode` de chaque conteneur de bouton.

### 3.4 Composants restant à promouvoir

Non traité, signalé pour mémoire : `Carte séance`, `Carte exercice`, `Ressenti` sont dessinés hors DSF.

---

## 4. Écrans

### 4.1 Écrans créés

| Nœud | Nom | Objet |
|---|---|---|
| `7059:13302` | Création activité — Paramètres en modale — 13 Répétitions avec cadence | ligne Cadence renseignée |
| `7061:13383` | Création activité — Paramètres en modale — 14 Cadence (roulette ouverte) | modale de sélection de la cadence |
| `7069:13464` | 9b Avec changement de côté (copie) | hiérarchie des titres et indentations |
| `7069:13573` | 10b Répétitions (copie) | hiérarchie des titres et indentations |
| `7119:27855` | Création activité — Phrase longue (198 caractères) | cas limite de la phrase générée |
| `7167:13503` | Composition d'une séance — Placement d'une pause | écran unifié récupération + point d'arrêt |
| `7173:13521` | Composition d'une séance — Durée de récupération (modale) | modale ouverte à la sélection d'une récupération |
| `7245:13718` | Boutons d'action contextuelle — repos et activé | planche de référence des deux états |
| `7174:13554` | Icônes retenues — Récupération / Durée / Point d'arrêt / Générique | planche des icônes validées |
| `7296:13696` | Composition séance — Retirer une récupération | symétrique de « Retirer un point d'arrêt » |

### 4.2 Écran supprimé

`4893:6675` — « Composition d'une séance — Placement d'un point d'arrêt ». Remplacé par `7167:13503`, qui porte le mécanisme unifié.

### 4.3 Écrans modifiés

Environ 60 écrans touchés, regroupés par nature de modification :

| Nature | Portée |
|---|---|
| Indentation des titres de paramètres | « Séries variables », « Durée d'une série », « Ordre des côtés », « Pause entre les côtés », « Pause après chaque série », « Répétitions », « Cadence » — sur tous les écrans de paramètres |
| Barres horizontales | raccourcies à gauche pour commencer à l'aplomb du texte qui suit ; barre manquante ajoutée au-dessus de « Séries » sur l'ensemble des écrans de paramètres |
| Ligne Cadence déployée | tous les écrans en mode Répétitions |
| Symbole de durée totale | `≥` → `≈` partout où la cadence rend la durée estimable |
| Phrase de synthèse | cadres gris retirés, variables en gras, texte unique |
| Icône de récupération | 52 repères |
| Icône de pause générique au repos | tous les écrans portant ce bouton |
| Icône de catégorie pleine | « Catégories », « Catégories — Appui long », « Nouvelle Catégorie » |
| Icône de zone corporelle homme pleine | « Ajouter un exercice — Zones corporelles », « — Appui long — Confirmation suppression », « — Nouvelle zone corporelle » |
| Suppression de la récupération à 0 s | « Composition séance — Standard », « — Actions glissées », « — Fin », et tous les écrans de composition |
| Chronomètre | 6 variantes de cartes sur « Composants — Cartes » |
| Nettoyage | contrôle segmenté et format de sélection du mode d'exécution retirés de « 14 Cadence (roulette ouverte) », « 10b Répétitions (copie) », « 13 Répétitions avec cadence » ; texte « Renseignez la durée de la série 2 pour valider. » supprimé de « Validation impossible — 12 Série incomplète » ; carte série en avant-plan parasite supprimée de « Séries variables — 14 Déplacement d'une série » |

### 4.4 Règles de mise en page des modales de paramètres

À inscrire au DSF comme règles, pas seulement comme résultat :

1. **Hiérarchie par indentation** : un paramètre dépendant d'un autre est indenté sous lui. « Séries variables » sous « Séries » ; « Durée d'une série » sous « Séries variables » ; « Ordre des côtés » et « Pause entre les côtés » sous « Changement de côté » ; « Cadence » sous « Répétitions ».
2. **Barre horizontale** : elle commence à l'aplomb du texte de la ligne qui la suit, pas au bord du cadre. Une barre existe au-dessus de chaque groupe de premier niveau, « Séries » compris.
3. **Valeurs alignées à droite**.
4. **Bords des cadres de séries variables** : ils ne doivent pas être masqués par une barre horizontale ni par un stepper. Vérifier l'ordre de superposition.
5. Les modales de valeur s'ouvrent **sous le champ**, pas en modale pleine — cohérence avec les modes d'exécution de séance.

### 4.5 Décision de modélisation

Le déplacement d'une série n'est **pas modélisé étape par étape** dans Figma. L'écran « Séries variables — 14 Déplacement d'une série » montre un état, pas une séquence. Décision explicite : on ne maquette pas toutes les étapes d'un déplacement.

---

## 5. Champs et modèle de données

### 5.1 Champ à ajouter

| Champ | Type | Contraintes | Porteur |
|---|---|---|---|
| `repetitionIntervalSeconds` | entier, nullable | 1 à 60 ; non nul uniquement si mode = Répétitions | `SeriesParameters` |

`null` signifie « aucune cadence », pas « cadence de 0 ».

### 5.2 Retour de durée à quatre niveaux

La fonction de calcul de durée totale doit retourner un niveau de certitude, non une seule valeur :

| Niveau | Condition | Rendu |
|---|---|---|
| `exact` | mode Durée | valeur, sans symbole |
| `estimated` | mode Répétitions **avec** cadence | `≈ valeur` |
| `lowerBound` | mode Répétitions **sans** cadence | `≥ valeur` |
| `omitted` | mode Jusqu'à l'échec | **rien** — la ligne « Durée totale » n'est pas rendue |

`omitted` est un niveau de retour, pas une valeur nulle à formater côté rendu : la fonction dit que la durée n'est pas affichable, elle ne renvoie pas `0` avec un drapeau.

### 5.3 Récupération comme objet explicite

La récupération n'est plus une propriété implicite de l'intervalle entre deux activités. Elle devient un **objet de pause** posé dans la séance, de type `recovery` ou `breakpoint`, avec sa position et, pour `recovery`, sa durée.

Conséquence sur le moteur d'exécution : l'état du moteur doit distinguer « en récupération » de « à l'arrêt sur point d'arrêt », et l'absence de pause entre deux activités devient un cas normal et non une récupération de durée nulle.

### 5.4 Prérequis bloquant

Le modèle actuel porte des scalaires sur `ActivityDefinition` : `repetitionCount`, `seriesCount`, `pauseSeconds`. Ces champs ne peuvent pas représenter des séries variables, ni une cadence, ni des pauses posées à des emplacements choisis.

**Les migrations s'arrêtent à `008`.** La migration qui introduit `SeriesParameters` et les objets de pause est le prérequis de tout le reste de ce document côté développement. Rien de ce qui précède n'est implémentable sur le schéma actuel.

Stack de référence confirmée : React Native 0.86, Expo SDK 57, `expo-sqlite`.

---

## 6. Ce qu'il faut vérifier dans le code

Liste de contrôle pour la revue, dans l'ordre de dépendance :

1. Migration `009` : `SeriesParameters`, objets de pause, `repetitionIntervalSeconds`.
2. Suppression de toute création automatique de récupération à la composition d'une séance.
3. Fonction de génération de la phrase de synthèse, confrontée aux 100 cas du fichier `generateur-phrase-activite_v13.xlsx`.
4. Fonction de durée totale : retour à quatre niveaux, et sélection du symbole côté rendu. Vérifier que le mode Jusqu'à l'échec **n'affiche pas** de ligne « Durée totale ».
5. Validation de la cadence : bornes 1–60, rejet hors mode Répétitions.
6. Exécution d'une série cadencée : la durée cible (`répétitions × cadence`) se calcule et s'affiche sur la ligne de temps écoulé ; vérifier qu'aucun minuteur ne pilote le compteur de répétitions ni la fin de série.
7. Écran de placement de pause : sélection multiple, ouverture de la modale de durée à la sélection d'une récupération, décompte sur le bouton de confirmation.
8. Règles d'affichage de la récupération à zéro (les trois cas de 1.2) — à tester comme règles d'affichage, pas comme règles de données : la récupération à 0 existe en base, elle ne s'affiche pas.
9. Suppression d'une récupération : parité fonctionnelle avec la suppression d'un point d'arrêt.
10. États repos/activé des boutons : l'icône change, le cercle ne change pas.
11. Variable de gris des icônes de carte : une seule source, `#9499A8`.

---

## 7. Documentation à mettre à jour

### 7.1 Contradictions à lever

| Document | Énoncé devenu faux |
|---|---|
| Spécification de composition de séance | « une récupération est ajoutée après chaque activité » |
| Spécification de composition de séance | le point d'arrêt comme mécanisme distinct de la récupération |
| Spécification de création d'activité | la phrase de synthèse comme assemblage de champs modifiables |
| Spécification de création d'activité | la durée totale en mode Répétitions toujours notée `≥` |
| Spécification de création d'activité | une durée totale affichée en mode Jusqu'à l'échec |
| Charte d'icônes | le sablier comme icône de durée sur les cartes |

### 7.2 Sections à écrire

1. **Pause** — définition du concept chapeau, ses deux types, le mécanisme de placement unique, la sélection multiple.
2. **Cadence** — définition, plage, exclusivité au mode Répétitions, le glossaire cadence / rythme / fréquence, et son **comportement à l'exécution** : paramètre déclaratif, durée cible sur la ligne de temps écoulé, aucun guidage au tempo (cf. §1.3).
3. **Phrase de synthèse** — les cinq groupes, la règle d'énumération à 3, les formulations de référence, le renvoi au fichier Excel comme spécification exécutable.
4. **Symbole de durée** — la hiérarchie à quatre niveaux et sa justification, omission du mode Jusqu'à l'échec comprise.
5. **États d'icônes** — le principe repos/activé, les options écartées et pourquoi.
6. **Hiérarchie des gris** — la règle manquante identifiée en 2.4.
7. **Règles de mise en page des modales** — les cinq points de 4.4.

### 7.3 Pièces jointes de référence

| Fichier | Rôle |
|---|---|
| `generateur-phrase-activite_v13.xlsx` | spécification exécutable de la phrase de synthèse (100 cas) |
| `KODJO_Dossier_Cadence_et_Phrase_de_synthese.md` | dossier de conception de la cadence |
| `KODJO_Dossier_Revue_Code_Alignement_Figma_DSF.md` | dossier de revue de code |

---

## 8. Non traité

Points ouverts qui ont un effet sur le développement ou le DSF :

1. **Écrans communautaires** — lot C à finir, étapes 2 à 6 non entamées. Indépendant de ce document.
2. **Ligne de récupération à zéro sur l'ancien écran de point d'arrêt** — une 8ᵉ occurrence de structure différente n'a pas été traitée avant la suppression de l'écran `4893:6675` ; vérifier qu'aucun autre écran ne porte cette structure.

*Les états d'exécution des séries cadencées ne figurent plus ici : la décision est prise (cadence déclarative, durée cible sur la ligne de temps écoulé existante), aucun écran n'est à créer et le moteur n'est pas bloqué. Voir §1.3.*

*La colonne « repos » de la planche `7245:13718` ne figure plus ici non plus : vérification faite, les six cellules portent bien les SVG fournis, contour et plein étant le même tracé. La planche est source de vérité.*
