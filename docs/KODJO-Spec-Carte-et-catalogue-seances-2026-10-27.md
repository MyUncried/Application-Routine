# KODJO — Carte de séance et catalogue des séances

Lot à verser à la documentation. Il remplace et complète `KODJO-Spec-Carte-seance-deployee-2026-10-27.md`, qui ne couvrait que l'état déployé.

Périmètre : la carte de séance dans le contexte Catalogue, l'écran du catalogue des séances et son panneau de filtres. Les contextes Calendrier, Suivi et Choix ne sont pas modifiés.

> **Limite de portée après les décisions PRE-9 du 29–30/10 :** [Format par Exercice et Formats multiples par Séance](KODJO-PRE9-Arbitrages-Composition-Formats-Consolides-2026-10-30.md). Les prescriptions historiques de cette spécification parlant d'une « séance à format » ou de « la vignette du format de la séance » ne peuvent pas être interprétées comme la création d'un Format unique au niveau Séance. Elles décrivent les exemples de séances ayant un Format identifiable ; **le choix d'une vignette ou d'un libellé unique pour une Séance contenant plusieurs Formats différents n'est pas décidé par le présent lot**. Ne pas inventer une règle de priorité entre les Formats des Exercices. Les autres règles de cartes et de filtres restent inchangées.

---

## 1. Une seule carte pour toutes les séances

Il n'existe plus qu'un gabarit de carte, qu'une séance contienne un exercice ou plusieurs. C'est la traduction visuelle de D-449 §6 : une collection unique, des vues filtrées, pas deux natures d'objet.

**Le visuel carré**, 64 points, à gauche. Sa cascade : la photo de l'exercice quand la séance n'en contient qu'un, sinon la photo du premier exercice qui en possède une, sinon la vignette du format de la séance, sinon la vignette du format Libre.

**Le nom**, suivi d'un chevron **seulement lorsque la séance contient plusieurs exercices**. Une séance d'un seul exercice n'a rien à déployer, donc pas de chevron. Le chevron du nom est le seul contrôle de déploiement : le bouton chevron encadré qui existait à droite est supprimé.

**Les catégories**, sur la ligne suivante, précédées de leur pastille. Elles sont dédupliquées, ordonnées par première apparition dans la composition, et terminées par `+N` lorsqu'elles dépassent la largeur disponible, jamais tronquées en milieu de mot. Les zones corporelles ne figurent pas sur la carte : elles se multiplient avec le nombre d'exercices et deviennent illisibles.

**L'étiquette n'est pas présentée.** C'est un critère de filtre, pas une information de carte. Cette disposition remplace l'affichage actuel de l'étiquette sur la carte de séance.

**La ligne de synthèse**, deux emplacements :
- le premier porte le **nom du format** quand la séance en a un, sinon le **nombre d'exercices**, sinon, pour une séance d'un seul exercice, son **volume** dans l'unité de l'exercice (`3 × 1 min 30 s`, `1 × 45 s`). « 1 exercice » n'apprend rien et n'est jamais affiché ;
- le second porte la **durée**, y compris sur une séance à format : « EMOM » seul ne dit pas si la séance dure dix minutes ou une demi-heure. Pour For time et Death by, où la durée n'est pas déterminable, l'emplacement reste vide, selon la règle existante des durées non calculables.

**Le bouton de lecture** est présent sur toutes les cartes, y compris les séances d'un seul exercice : on lance une séance entière et jamais un exercice isolé (D-449 §5). Sa zone tactile s'arrête à 8 points du bord, comme le visuel à gauche.

**Cette disposition remplace D-260 et D-261** sur un point précis : « les Séances ne portent jamais de visuel » ne s'applique plus au catalogue, où la carte unique porte une photo ou une vignette. Les listes mixtes, le Calendrier et le Suivi restent sans visuel.

---

## 2. L'état déployé

L'en-tête ne change pas ; le chevron du nom pointe vers le haut. Sous un filet de séparation, la carte affiche **la composition de la séance sur toute la largeur utile**, de marge à marge : elle passe sous le visuel, qui n'occupe que l'en-tête.

**La structure est montrée, pas aplatie.** Les conteneurs apparaissent en lignes d'en-tête, « Cycle · N répétitions » et « Circuit · N tours », en gris et sans valeur. Leurs membres sont décalés de 16 points par niveau et reliés par un filet vertical placé dans la marge gauche dégagée, le même motif que les familles de niveaux du catalogue des mouvements. La profondeur étant fermée à trois par SU-04, il n'y a jamais plus de deux décalages.

**Les lignes** portent le nom à gauche et le volume à droite, aligné sur la marge. Les récupérations occupent une ligne à leur position, en gris clair, avec leur durée ; elles ne comptent pas dans le nombre d'exercices de l'en-tête, conformément à la règle de comptage de D-449 §6.

La hauteur de la carte suit le nombre de lignes.

**Un conteneur n'apparaît que lorsqu'il change quelque chose**, c'est-à-dire s'il se répète ou s'il contient plus d'un exercice. Un circuit d'un seul tour autour d'un seul exercice n'introduit donc aucune ligne, son exercice est listé directement. Cette règle ne vaut que pour cette lecture et ne modifie pas l'écran de composition, où D-442 impose un compteur toujours affiché.

---

## 3. L'état archivé

La carte archivée ne porte **aucune action** : l'icône ronde de restauration est retirée, et la colonne de texte reprend la place libérée jusqu'à la marge. Toutes les actions passent par le glissé, comme pour les mouvements archivés.

---

## 4. L'écran du catalogue

**Contrôle segmenté à trois entrées**, Mouvements, Séances, Programmes, sur tous les écrans du catalogue.

**Bascule de vue**, sur la première ligne de la zone de contexte : « Un exercice N | Plusieurs N ». Les libellés conservent la bascule existante (aucun actif par défaut ; toucher la sélection active la désactive) ; les compteurs N, **purement informatifs**, ne deviennent pas cliquables. Les chiffres reflètent les nombres de Séances de chaque vue, et non les exemples 2 et 3 du prototype. Texte de 14 pt, libellés inactifs #595E66, actifs #0508E5 gras, compteurs #333333 Regular, séparateur | #9499A8 à x127. Voir [spécification PRE-9 de la zone de contexte](KODJO-Zones-contexte-catalogues-PRE9-2026-10-30.md).

*Limite acceptée :* le retour à la collection complète se fait en désélectionnant l'option active, ce qui ne se devine pas. Une troisième option « Toutes » le résoudrait mais ne tient pas sur la ligne, qui doit laisser la place au contrôle de filtre déployé. La disposition est conservée en l'état.

**Contrôles ronds**, rangés à droite dans cet ordre de gauche à droite : filtre, tri, créer. Le bouton de création est le plus à droite et se termine sur la marge. Le même ordre s'applique au catalogue des mouvements.

**Mise en page**, commune à tout le prototype : marge latérale de **16 points**, cartes de **370** de large, **12 points** entre deux cartes quelle que soit leur hauteur.

---

## 5. Les actions glissées

Le glissé porte sur la séance et non sur son contenu : **les options conservent 80 points de haut quelle que soit la hauteur de la carte**, alignées sur son bord supérieur. Elles forment un bloc jointif qui se termine sur la marge droite, et la carte glissée s'arrête 8 points avant lui.

Sur une séance active : Planifier, Dupliquer, Archiver. Sur une séance archivée : **Restaurer** puis **Supprimer**, dans cet ordre, le bleu-violet non destructif avant le rouge, comme pour les mouvements archivés.

---

## 6. Le panneau de filtres

Les sections portent **un chevron accolé à leur titre**, et non aligné à droite : le chevron commande la section placée juste en dessous, pas une navigation, et le titre lui-même est le bouton.

Sections, dans l'ordre : Statut des séances, **Catégories**, **Zones corporelles**, Étiquettes, Format. Les deux sections du milieu sont nouvelles.

**Format compact.** Une section dont les options tiennent sur une ligne les porte à droite de son titre, en pastilles arrondies, sur la même ligne, comme les lignes de la feuille des paramètres d'exécution. C'est le cas du statut. Les sections à options multiples gardent leurs pastilles sous le titre, hauteur 36. Le panneau passe ainsi de 679 à 536 points de contenu.

**Sections ouvertes à l'ouverture :** celles qui portent un filtre actif, les autres repliées. Quand aucun filtre n'est posé, seul le statut est ouvert.

**Réinitialiser est fixé en pied de modale**, comme sur le panneau des mouvements, et ne défile pas avec le contenu.

---

## 7. Ce qui disparaît

**Le catalogue des exercices**, sept écrans : la liste, son panneau de filtres, ses deux états de filtre, ses actions glissées, sa carte déployée avec média, et `Modifier un exercice`. Il est remplacé par la vue « Un exercice » du catalogue des séances. Le jeu de composants `DSF / Cards / Exercice` n'a plus d'usage dans le MVP.

**`Catalogue des séances — Liste — Filtre inactif étendu`** : un contrôle de filtre étendu sans filtre posé n'a pas d'état à montrer.

**`Modification d'une séance`** : sans apport propre.

---

## 8. Le nom d'une séance

Le nom suit trois états, décidés le 27/10. Il s'agit d'une décision nouvelle : D-449 §2 précise que les règles de saisie du titre ne sont pas modifiées par la clôture.

1. **À l'ouverture**, la séance porte le **nom de son format**, en gris, non modifiable.
2. **À l'ajout du premier exercice**, elle prend le **nom de cet exercice**, désormais éditable.
3. **À l'ajout du second exercice**, le nom devient l'invite **« Entrer un nom de séance »**, en gris, éditable : l'obligation de nommer apparaît au moment où le nom d'un exercice ne suffit plus.

Le nom affiché ne porte jamais le suffixe de niveau : D-445 pose que le rang et le suffixe `Nn` sont dérivés et jamais persistés dans le nom. Le niveau peut être affiché ailleurs, dans son propre emplacement, mais il ne figure pas sur la carte de séance, puisqu'une séance de plusieurs exercices n'en a pas.

---

## 9. Écrans et composants touchés

**Composants modifiés.** `DSF / Cards / Séance`, variantes `Contexte=Catalogue` dans ses trois états, Replié, Archivé et Déployé : largeur 370, étiquette masquée, catégories et leur icône, chevron unique sur le nom, emplacement photo, position du bouton de lecture, colonne de texte, composition structurée de l'état déployé, retrait de l'icône ronde de restauration sur l'état archivé. `DSF / Cards / Exercice` n'a plus d'usage dans le MVP.

**Les douze écrans de la ligne du catalogue des séances**, tous touchés par la carte unique, la marge de 16, la largeur de 370 et l'écart de 12 :

| Écran | Ce qui change en propre |
| --- | --- |
| `P-Catalogue des séances — Liste par défaut` | Cinq cartes en instances, photos et vignette de repli, bascule de vue, contrôles rangés à droite, deux séances passées en EMOM et Tabata |
| `P-Catalogue des séances — Séance déployée` | Composition structurée en circuit et cycle, filet de séparation remonté au bord de la carte repliée |
| `Catalogue des séances — Séance déployée — actions glissées` | Options fixées à 80 malgré la carte déployée |
| `Catalogue des séances — Liste condensée — actions glissées` | Bloc d'actions jointif terminé sur la marge, carte glissée recalée |
| `Catalogue des séances — Liste condensée — actions glissées — Dos et mobilité` | Idem |
| `P-Modal — Confirmer l'archivage d'une séance planifiée` | Contrôle segmenté à trois entrées rétabli, options et espacement |
| `Catalogue des séances — Liste sans Renforcement du genou` | Cartes et espacement |
| `Catalogue des séances — Filtre actif Archivé` | Cartes, contrôles, chevron du filtre étendu recentré |
| `Catalogue des séances — Archivées — actions glissées` | Option Restaurer ajoutée avant Supprimer, icône ronde retirée |
| `Catalogue des séances — Archivées — Séance restaurée` | Icône ronde retirée |
| `Modal — Confirmer la suppression d'une séance archivée` | Cartes et espacement |
| `P-Catalogue des séances — Filtrer — Panneau ouvert` | Chevrons accolés aux titres, sections Catégories et Zones corporelles repliées, statut en ligne compacte, Réinitialiser fixé en pied |

**Écrans supprimés.** Les sept du catalogue des exercices : `P-Catalogue des Exercices — Liste`, `— Filtrer — Panneau ouvert`, `— Liste — Filtre inactif étendu`, `— Liste — Filtre actif étendu`, `— Liste — actions glissées`, `S-Catalogue des Exercices — Liste — Première carte déployée — Média` et `Modifier un exercice`. Plus `Catalogue des séances — Liste — Filtre inactif étendu` et `Modification d'une séance`.

**Hors périmètre de ce lot mais appliqué au même moment :** la marge latérale de 16 points a été portée sur toute la page Prototype MVP, soit 593 éléments élargis et 186 recalés.

---

## 10. Réalisations restantes dans Figma

- Les vignettes de format forment un jeu de variantes distinct, à raccorder quand le filtre Format sera traité : une séance EMOM porte aujourd'hui le motif du format Libre avec le bon libellé.
- Le pictogramme de la ligne de synthèse reste l'haltère, y compris devant un nom de format : un format est un type d'exercice, l'haltère garde son sens.
