# KODJO — Prompt de mise à jour documentaire : règles d'interface de portée fichier, planification à plusieurs contenus, fréquence, programme

**Date :** 08/10/2026
**Fichier Figma :** `G6RY5Ebhgwb4AHIOYDwwvg`
**Pages :** « Prototype MVP » et « Communautaire — Conception — Hors MVP »
**Dépôt :** `MyUncried/Application-Routine`

---

## Comment utiliser ce document

Tu dois mettre à jour la documentation du dépôt pour refléter le travail réalisé le 08/10/2026 dans Figma. **Figma fait foi** : les écrans sont construits, vérifiés et identiques sur les deux pages.

Ce document porte **deux natures de changement**, qu'il ne faut pas mélanger dans la documentation :

1. **§ 0 — des règles d'interface de portée fichier.** Elles ne concernent pas la planification : elles ont été appliquées à 111 écrans, 49 sections et 173 boutons de l'ensemble du prototype. Elles doivent être documentées comme **règles générales d'interface / DSF**, pas dans la documentation de la planification.
2. **§ 1 à § 8 — la refonte de la planification** et les changements de composants qu'elle entraîne.

Tu es autonome. Localise toi-même les fichiers concernés, décide des emplacements, et rédige. Les fichiers connus à ce jour sont :

- `docs/PRODUCT.md`
- `docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md`
- `docs/DSF-CARTES-ICONES-APPUIS-2026-09-30.md`
- `MATRICE-FIGMA-2026-10-07.md`, `MATRICE-ECRANS-CARTES-2026-09-30.md`
- `INDEX.md`

**Ce document ne demande aucune modification de code.** Voir § 9.

**Trois décisions enregistrées deviennent fausses** et doivent être amendées : D-222, D-223, et la règle de l'option « Aucune » dans la répétition. Voir § 7. Le § 11 liste les énoncés devenus faux à corriger partout où ils figurent.

---

## 0. Règles d'interface de portée fichier

> **Avertissement de rédaction.** Les quatre règles de cette section ont été appliquées à **tout le prototype**, pas à la planification. Les écrire dans la documentation de la planification serait une erreur de classement : elles valent pour les catalogues, le Suivi, le Profil, la Composition, et tout écran futur. Elles appartiennent à la documentation d'interface / DSF. La documentation de la planification doit s'y **référer**, pas les redéfinir.

### 0.1 Grille d'écartement vertical

| distance | valeur |
|---|---|
| bas de la zone de contexte → première ligne de texte | **18 px** |
| dernier élément d'un bloc → titre de la section suivante | **20 px** |
| titre de section → son bloc | **13 px** |
| bloc → bloc, sans titre entre eux | **12 px** |

**Portée et ampleur du redressement**, à consigner car elle mesure l'incohérence corrigée :

- la première distance a été portée à 18 px sur **111 écrans** ; elle comptait **cinq valeurs distinctes** ;
- la seconde a été portée à 20 px sur **49 sections** ; elle comptait **dix-huit valeurs distinctes**.

**Le 12 px n'est pas une invention** : c'est l'écart standard entre deux cartes, relevé sur 24 paires consécutives dans les catalogues, sans exception. La grille s'aligne sur l'existant plutôt que de le contredire.

**Une seule exception, à documenter explicitement :** sur les **écrans de Profil**, la distance de 20 px n'est **pas** appliquée. Leurs contenus sont déjà encadrés et portent leur propre écartement. La distance de 18 px, elle, leur est bien appliquée.

**Corollaire sur la zone de contexte :** le titre porté par la zone de contexte (nom de l'exercice, nom de la séance, nom de la planification) est posé à la **même hauteur** dans tous les écrans, mesurée depuis le haut de la zone. L'écran de référence est `Ajouter un exercice — Initial`.

**Point de méthode indispensable**, car il fera trébucher toute vérification automatique future : la zone de contexte porte **trois noms de calque différents** selon les écrans — « Zone de contexte », « Zone bleue — Nom de l'exercice et média », « Fond gris — zone contenu Profil ». **Chercher par le nom donne un résultat faux.** Le seul critère fiable est la **forme** : un rectangle pleine largeur, en dégradé à trois arrêts — 0 % opaque, 80 % opaque, 100 % transparent — posé sous l'en-tête. Le bord visible est à 80 %, mais la référence de mesure est le **bas géométrique** du rectangle.

### 0.2 Le bouton d'action

| propriété | valeur |
|---|---|
| position | **y802**, x24 |
| dimensions | 354 × 48 |
| libellé | centré sur les deux axes |

Harmonisé sur **173 boutons** du fichier, qui occupaient **six positions différentes** entre y786 et y807. L'écran de référence est `Gabari bouton d'action`.

**Le centrage du libellé est une règle, pas un réglage par écran.** Il est désormais porté par le composant (§ 8.2) ; les boutons construits à la main hors composant doivent le respecter.

### 0.3 Fond des modales

**Toutes les modales du fichier sont blanches**, sans exception. Les modales de planification faisaient exception avec un fond #F9FAFC ; elles sont alignées sur la règle générale.

Corollaire : un bloc de section posé dans une modale est **gris** sur **fond blanc** (§ 6.2), et non l'inverse.

### 0.4 Blocs de section

Spécification unique, valable partout où un groupe de lignes est encadré — Profil, planification, et tout écran futur :

| propriété | valeur |
|---|---|
| position / largeur | x24, 354 |
| rayon | **12** |
| fond | **#F9FAFC** |
| trait | **aucun** |
| séparateurs internes | x36, largeur 330, 1 px, **#E0E3E8** |

Le titre de section est **à l'extérieur** du bloc, 13 px au-dessus.

---

## 1. Le concept central : un créneau peut porter plusieurs contenus

### 1.1 Ce qui change

Jusqu'ici, planifier revenait à poser **une** séance ou **un** exercice sur un créneau. Désormais un créneau porte une **liste ordonnée de contenus**, qui peuvent être des séances, des exercices, ou un mélange des deux.

### 1.2 L'invariant, qui ne bouge pas

> **Le créneau produit les occurrences ; le contenu ne fait que les filtrer.**

Aucun contenu ne peut créer une occurrence que le créneau n'a pas produite. Cet invariant commande tout le reste, en particulier le modèle de fréquence (§ 2).

### 1.3 « Parcours » : un mot, pas un objet

Le mot **parcours** réapparaît dans l'interface, mais **uniquement comme vocabulaire**. Il faut l'écrire explicitement dans la documentation, parce que l'objet Parcours a été supprimé le matin même et ne revient pas :

> Le parcours n'est pas une entité du modèle. Il n'a ni identité, ni persistance propre, ni écran de détail, ni rattachement. Il désigne **ce que produit** la planification de plusieurs contenus liés sur un même créneau. C'est un résultat nommé, pas une classe.

À distinguer soigneusement du **Programme**, qui est, lui, un conteneur réel (§ 4).

Le terme **circuit**, ancienne terminologie du parcours, reste supprimé et ne doit réapparaître nulle part.

### 1.4 Ordre des contenus

La liste est ordonnée et réordonnable. Chaque ligne porte une poignée de réordonnancement (icône `icon/poignee`, 12 × 18), le nom du contenu, et sa fréquence propre.

---

## 2. La fréquence d'un contenu : « x fois sur n »

### 2.1 La forme retenue

La fréquence d'un contenu au sein d'un créneau s'exprime **exclusivement** sous la forme :

> **x fois sur n**

Exemples : « à chaque fois », « 1 fois sur 2 », « 2 fois sur 3 ».

### 2.2 Pourquoi cette forme, et pas « tous les 2 jours »

Une formulation comme « 2 fois tous les 3 jours » décrit une **périodicité**, qui est l'affaire du créneau. Le contenu, lui, ne connaît pas les jours : il ne voit qu'une suite d'occurrences produites par le créneau, et il en retient certaines.

**Conséquence majeure à documenter : la fréquence d'un contenu n'a pas d'unité.** Changer le créneau de « tous les jours » à « toutes les semaines » ne modifie pas la fréquence du contenu — seule change la nature des occurrences filtrées.

### 2.3 Le cas par défaut

Quand x = n, la fréquence s'écrit **« à chaque fois »**, en minuscule. C'est la valeur par défaut d'un contenu ajouté à un créneau.

### 2.4 Le réglage : combien, puis lesquelles

L'écran de réglage comporte deux niveaux :

1. **Deux steppers** — le premier pour x, le second pour n — reliés par le mot « fois sur », en corps plus grand que les libellés voisins.
2. **n pastilles numérotées** de 1 à n, dont l'utilisateur sélectionne celles qu'il retient.

Cela rend exprimables des motifs que le seul couple (x, n) ne permettait pas : « la 1re et la 3e sur 3 » (●○●) se distingue de « les deux premières sur 3 » (●●○).

**Règle de réinitialisation :** modifier l'un des deux steppers **remet toutes les pastilles au gris**. Les paramètres définissent le cadre, la sélection le remplit. Il n'y a donc aucune règle de troncature à écrire quand n diminue.

**Nombre de pastilles affichées :** n. Une variante à 2n avec un séparateur visuel (un point) entre les deux cycles a été envisagée comme repli si n est petit ; elle n'est pas retenue pour l'instant.

**Aucun texte explicatif** n'accompagne le réglage. La forme « x fois sur n » et les pastilles se suffisent.

### 2.5 Ce que montre la liste

Dans la liste des contenus du créneau, la fréquence s'affiche sous sa **forme générique** — « à chaque fois », « 2 fois sur 3 ». Le motif détaillé (quelles occurrences) n'apparaît que :

- dans la feuille de réglage de la fréquence ;
- dans le calendrier, qui montre les occurrences réelles.

### 2.6 Point ouvert à consigner comme tel

Le x du premier stepper et le nombre de pastilles sélectionnées expriment la même information. Deux comportements sont possibles et ne sont pas tranchés :

- le stepper **plafonne** la sélection (on ne peut pas cocher plus de x pastilles) ;
- ou le stepper **se met à jour** quand l'utilisateur coche.

À trancher au développement.

---

## 3. La répétition du créneau

### 3.1 Un interrupteur, puis une unité

La ligne de section « Répétition » porte à droite un **interrupteur** et, **à côté du titre**, un **chevron de repli**.

- Interrupteur sur **Non** → la section est repliée, rien à régler.
- Interrupteur sur **Oui** → le paramétrage apparaît.

**L'option « Aucune » n'existe plus.** Elle appartenait à un contrôle binaire `Aucune / Périodique` qui est supprimé. C'est désormais l'état de l'interrupteur qui porte l'absence de répétition.

### 3.2 L'unité de récurrence

Un **contrôle segmenté à trois éléments** : **Jour · Semaine · Mois**.

Une quatrième unité « Heure » a été étudiée et **écartée pour l'instant**. Raisons à consigner, car elles resserviront :

- elle est la seule unité qui ne borne pas le nombre d'occurrences par jour ;
- la rangée L M M J V S D devient inopérante et appellerait un contrôle d'heures distinct ;
- le volume d'occurrences explose (≈ 1 000 sur trois mois contre 13 en hebdomadaire), ce qui pèse sur le stockage, la vue Jour, le Suivi et le calcul d'appartenance à un programme ;
- un rappel par occurrence dépasse rapidement le plafond de notifications programmables du système ;
- la borne « jusqu'au », qui est une date, ne suffirait plus.

**Alternative identifiée si le besoin revient** (rééducation, mobilisation pluriquotidienne) : ne pas ajouter d'unité, mais permettre **plusieurs heures dans une journée** sur l'unité Jour — « tous les jours à 8 h, 12 h et 16 h ». Ensemble borné, occurrences bornées, et cela reste un filtre, donc compatible avec l'invariant du § 1.2. À défaut, **plusieurs créneaux le même jour** répondent déjà au besoin sans rien changer au modèle.

### 3.3 La phrase éditable

La phrase de récurrence se compose sur **deux lignes** :

```
Toutes les
[2]  semaines  [jusqu'au]  [23 août 2026]
```

- **« Toutes les »** est un libellé libre, seul sur sa propre ligne, en **Medium 12**.
- **[2]** est une valeur modifiable (le multiplicateur), en **16**.
- **« semaines »** est un libellé libre accordé à l'unité sélectionnée, en **Medium 12**.
- **[jusqu'au]** est une **valeur modifiable à deux valeurs**, en **16** — voir § 3.4.
- **[23 août 2026]** est la borne, en **16**.

**Pourquoi deux lignes.** Le libellé le plus long — « Toutes les 12 semaines jusqu'au 23 septembre 2026 » — mesure **410 px** au corps des titres de section, pour une largeur utile de **354 px**. Détacher « Toutes les » sur sa propre ligne ramène la ligne porteuse à **352 px**, et toutes les combinaisons tiennent. La règle à écrire est donc : *la phrase tient sur une seule ligne porteuse, le préfixe est posé au-dessus*.

### 3.4 `jusqu'au` / `pendant` : un paramètre, pas un mot fixe

C'est un point de modèle à documenter explicitement.

> La borne de fin est introduite par un **paramètre à deux valeurs** : **`jusqu'au`** et **`pendant`**.

| valeur | ce que porte la borne | exemple |
|---|---|---|
| `jusqu'au` | une **date** | Toutes les 2 semaines **jusqu'au** 23 août 2026 |
| `pendant` | un **nombre d'unités** | Toutes les 2 semaines **pendant** 12 semaines |

Le même emplacement porte donc deux types de valeur selon le paramètre choisi. La bascule entre les deux formes est une conversion que le code devra assurer dans les deux sens.

### 3.5 Les jours de la semaine

La rangée **L M M J V S D** filtre les occurrences d'une récurrence. Elle n'a de sens que sous l'unité **Semaine**. Son comportement sous les unités Jour et Mois reste à définir : masquée, ou remplacée par un filtre adapté.

### 3.6 Accord grammatical

Le préfixe s'accorde à l'unité : « **toutes les** 2 semaines », « **tous les** 3 jours », « **tous les** 2 mois ». Règle déjà consignée, rappelée ici parce que le contrôle segmenté la rend systématique.

---

## 4. Le Programme

### 4.1 Première apparition dans l'interface

Le Programme apparaît pour la **première fois** dans l'interface, sur l'écran de planification. C'est un point à souligner dans la documentation : le concept existait dans la conception (document `Programme / Modèle de Programme` V1.2) mais n'était représenté nulle part.

### 4.2 Forme et position

Une **ligne de valeur** — libellé « Programme » à gauche, valeur à droite — en **première position du formulaire**, au-dessus de « Début le ».

Valeur par défaut : **« Aucun »**. Le rattachement est facultatif.

### 4.3 Pourquoi en première position

Ce n'est pas un choix de mise en page mais une conséquence du modèle :

> La fenêtre du programme **borne** les dates qui le suivent. Le choisir après les dates reviendrait à valider à rebours une saisie déjà faite. Un conteneur se déclare avant son contenu.

Référence : document de conception `Programme / Modèle de Programme` V1.2, § 9 (borne de début) et § 29.2 (gel de l'échu).

### 4.4 Ce qui reste à concevoir

Trois écrans du parcours Programme n'existent pas encore et doivent être signalés comme tels :

- la **création** d'un programme (nom, intention, période) ;
- la **proposition de rattachement** automatique des occurrences existantes tombant dans la période ;
- l'**avertissement** lorsqu'une occurrence tombe hors de la période du programme choisi.

---

## 5. Les écrans

Dix écrans, **rigoureusement identiques sur les deux pages** (vérifié nœud par nœud : mêmes éléments, positions, dimensions, textes et propriétés d'instance).

| # | nom | ce qu'il montre |
|---|---|---|
| 1 | Planifier une séance — Création | le formulaire complet, contenu unique |
| 2 | Modal — Planifier une séance — Sélectionner une séance | la modale de choix, **une** séance cochée, CTA « Ajouter 1 élément » |
| 3 | Planifier une séance — Sélecteur de date ouvert | le popover calendrier ouvert sous le bloc Créneau |
| 4 | Planifier une séance — Rappel personnalisé ouvert | la roulette de rappel, option « Autre » retenue |
| 5 | Planifier une séance — Stepper du nombre de semaines | le stepper ouvert sur le multiplicateur |
| 6 | Planifier une séance — Rappel personnalisé sélectionné | une valeur personnalisée retenue — « 20 min » |
| 7 | Planifier une séance — Sans répétition | interrupteur sur Non, section repliée |
| 8 | Modal — Planifier un parcours — Sélectionner plusieurs séances | **deux** séances cochées, CTA « Ajouter 2 éléments » |
| 9 | Planifier un parcours | le formulaire à plusieurs contenus, avec la section des éléments planifiés |
| 10 | Modal — Planifier un parcours — Fréquence | la feuille de réglage « x fois sur n » par-dessus l'écran 9 |

Deux écrans supplémentaires, `PROG — 2` et `PROG — 3`, existent sur la seule page hors MVP et sont **en construction** : ils n'ont pas reçu le design décrit ici et ne doivent pas être documentés comme acquis.

### 5.1 Renommages à répercuter

Les noms suivants ont changé et peuvent apparaître dans la documentation existante :

| ancien nom | nouveau nom | raison |
|---|---|---|
| Planifier une séance — **Test picker** date ouvert | Sélecteur de date ouvert | vocabulaire de dispositif de test, en anglais |
| Planifier une séance — Stepper **Nombre de semaines** | Stepper du nombre de semaines | — |
| Planifier une séance — **Aucune répétition** | **Sans répétition** | « Aucune » désignait une option supprimée |
| Planifier une séance — **Chioisir la séance** | *supprimé*, remplacé par l'écran 2 | faute de frappe + sélection simple remplacée |
| Modal — Choisir une séance | Modal — Planifier une séance — Sélectionner une séance | symétrie avec l'écran 8 |
| Modal — Choisir une séance — Planification — **Multi-choix** | *fondu* dans les écrans 2 et 8 | il n'y a plus de variante mono/multi (§ 5.2) |

### 5.2 La modale de choix est la même dans les deux cas

Écrans 2 et 8 : **un seul et même écran**, qui diffère uniquement par le nombre d'éléments cochés et par le décompte du bouton. Il n'existe pas de variante « sélection simple » et « sélection multiple ». C'est le décompte qui porte la différence, et c'est lui qui détermine le titre de l'écran suivant (§ 7.2).

### 5.3 La section des éléments planifiés disparaît à contenu unique

Quand le créneau ne porte qu'un seul contenu, la section n'est pas affichée — ni titre ni ligne. Elle n'apparaît qu'à partir de deux contenus.

Corollaire : **la section n'a pas de titre.** Le libellé « Éléments planifiés » a été écrit puis retiré : deux lignes portant un nom et une fréquence, sous le bloc de répétition, se comprennent sans en-tête. Le titre n'améliorait pas la lisibilité, il consommait une ligne.

---

## 6. Règles d'interface propres à la planification

> Les règles d'écartement, de position du bouton, de fond de modale et de spécification des blocs **ne sont pas ici** : elles sont de portée fichier et figurent au § 0. Cette section ne porte que ce qui est propre à la planification.

### 6.1 La modale de planification occupe toute la hauteur

La modale part de **y36** (sous la barre d'état) et descend à 874. Coins supérieurs **carrés**. Elle ne laisse plus voir l'écran appelant.

Justification à consigner : le bandeau résiduel ne montrait qu'un titre générique, sans le jour ni le créneau visés ; il coûtait 56 px pour une information que l'en-tête de la modale donne déjà. Et le formulaire, qui porte cinq sections et s'achève par un engagement, relève de la page plutôt que de la feuille.

### 6.2 Les blocs du formulaire

Le formulaire applique la spécification de blocs du § 0.4. Deux blocs **ne portent pas de titre**, parce que leur contenu est autoporteur :

- le bloc **Créneau** — ligne Programme + ligne Début le, séparées par un filet. Le titre « Créneau » a été écrit puis retiré ;
- le bloc des **éléments planifiés** (§ 5.3).

Dans la section Répétition, les deux blocs successifs sont séparés par l'écart standard entre deux cartes, **12 px** (§ 0.1).

### 6.3 Ordre des sections du formulaire

1. **Créneau** — Programme, puis Début le
2. **Répétition**
3. **Éléments planifiés** (à partir de deux contenus)
4. **Rappel**

Le Rappel est en dernier : il porte sur ce qui a été planifié, il ne peut donc pas précéder la liste des éléments. L'ordre est une conséquence de la lecture, pas une préférence.

### 6.4 La ligne Rappel

Même forme que la ligne Répétition : **interrupteur à droite** du titre.

**L'option « Aucun » du contrôle segmenté est supprimée** — comme pour la répétition, c'est l'interrupteur qui porte l'absence. Les options restantes se **répartissent sur toute la largeur, à largeur égale**.

À consigner comme dette de design : ce contrôle est un contrôle segmenté construit à la main, et le DSF n'offre aucune variante au-delà de trois éléments (§ 8.3).

### 6.5 Échelle typographique du formulaire

| élément | style |
|---|---|
| titre de section | **Inter Semi Bold 16** |
| valeurs de paramètre — date, heure, `jusqu'au`, borne, multiplicateur | **16** |
| libellés de ligne, lignes des éléments planifiés | **Medium 14** |
| libellés d'appoint — « Toutes les », le mot d'unité | **Medium 12** |

La règle à retenir : **une valeur que l'utilisateur peut modifier est au corps des titres de section**, pas au corps du libellé qui l'introduit. Les mots de liaison, eux, sont en petit.

### 6.6 Le récapitulatif de planification

> Le récapitulatif est **toujours visible** et **jamais chevauché**. Il est posé sur une zone protégée, immédiatement au-dessus du bouton d'action.

| élément | géométrie |
|---|---|
| dégradé de transparence | 40 px, au-dessus du récapitulatif |
| fond opaque | du haut du récapitulatif jusqu'au bas de l'écran |
| récapitulatif | hauteur ajustée à son texte, **16 px** au-dessus du bouton |

Le contenu du formulaire **défile sous** cette zone et s'efface dans le dégradé. C'est ce qui permet au formulaire de dépasser la hauteur de l'écran sans que le récapitulatif ni le bouton ne soient repoussés. C'est aussi ce qui a dissous le problème de débordement : il n'y a plus de hauteur maximale à respecter pour le formulaire.

**Règle fonctionnelle associée :** le récapitulatif se recompose selon les sections actives. Quand la répétition est désactivée, il ne doit pas annoncer de récurrence.

### 6.7 Sélection

- Cases à cocher, **jamais de pastilles radio**, y compris quand un seul élément est attendu.
- CTA bas portant le décompte : **« Ajouter 1 élément »** au singulier, **« Ajouter n éléments »** au pluriel.
- Le titre de la modale de choix suit l'option active du contrôle segmenté : « Choisir des séances » / « Choisir des exercices ».
- **Style de l'état retenu**, valable pour le contrôle segmenté comme pour les pastilles de fréquence : fond **#5F60EE**, texte **blanc Semi Bold**. État non retenu : fond **#F9FAFC**, texte **#141414 Regular**.

---

## 7. Décisions enregistrées à amender

### 7.1 D-222 — rappel

Déjà amendée dans un prompt précédent : la sélection multiple n'est plus réservée à la Composition, le CTA s'appelle « Ajouter n éléments ». Vérifier que l'amendement est bien en place, et compléter avec la forme au singulier.

### 7.2 D-223 — le titre de planification a maintenant trois branches

**Texte actuel :**

> Le titre de planification est contextuel : `Planifier` tant que le type d'objet n'est pas connu, puis `Planifier une séance` ou `Planifier un exercice` selon la source choisie.

**Amendement à rédiger :**

> Le titre de planification dépend du nombre et du type des contenus retenus :
>
> | contenus retenus | titre |
> |---|---|
> | une seule séance | **Planifier une séance** |
> | un seul exercice | **Planifier un exercice** |
> | plusieurs contenus, de même type ou de types différents | **Planifier un parcours** |
>
> `Planifier` seul reste le titre tant qu'aucun contenu n'est retenu.

Préciser dans la foulée que « parcours » est ici un **libellé** et non un objet (§ 1.3).

### 7.3 Nouvelle décision — l'option « Aucune » de la répétition est supprimée

À enregistrer comme décision nouvelle :

> Le contrôle binaire `Aucune / Périodique` de la répétition est remplacé par un **interrupteur** et un **contrôle segmenté d'unité** (Jour · Semaine · Mois). L'absence de répétition est portée par l'état de l'interrupteur, et replie la section. La même règle s'applique au Rappel, dont l'option « Aucun » est supprimée au profit d'un interrupteur.

### 7.4 Nouvelle décision — la fréquence d'un contenu

> La fréquence d'un contenu au sein d'un créneau s'exprime en **x fois sur n**, sans unité de temps. Elle filtre la suite des occurrences produites par le créneau. Le cas x = n s'écrit « à chaque fois ».

### 7.5 Nouvelle décision — la borne de fin est un paramètre

> La borne de fin d'une récurrence est introduite par un paramètre à deux valeurs, `jusqu'au` (une date) et `pendant` (un nombre d'unités).

### 7.6 Nouvelle décision — règles d'interface de portée fichier

À enregistrer comme décision de portée générale, en renvoyant au § 0 :

> La grille d'écartement vertical (18 / 20 / 13 / 12), la position du bouton d'action (y802, 354 × 48, libellé centré), le fond blanc de toutes les modales et la spécification des blocs de section (x24, 354, rayon 12, fond #F9FAFC, sans trait) sont des règles d'interface uniformes, appliquées à l'ensemble du prototype. Seule exception : les écrans de Profil n'appliquent pas la distance de 20 px.

---

## 8. Changements du design system

Trois composants ont été modifiés. À documenter dans une note DSF datée, selon la convention du dossier, avec son entrée dans `INDEX.md`.

### 8.1 `DSF / Controls / Disclosure` — nouvel axe `Cadre`

Passe de 3 à **6 variantes** : `État` (Replié / Déployé / Désactivé) × **`Cadre` (Oui / Non)**, `Oui` par défaut.

- `Cadre=Oui` — le carré de 28 × 28 conserve son fond #FBFCFF et sa bordure #8283F2 de 2 px. **196 instances**, toutes les cartes du prototype.
- `Cadre=Non` — fond et bordure retirés, le chevron seul subsiste. **25 instances**, les lignes de formulaire.

Motif du nouvel axe : dans un formulaire, le cadre rend le repli trop proéminent — seul le chevron est nécessaire. Plutôt que de créer un second composant, l'axe a été ajouté à l'existant.

Le carré a par ailleurs été **recentré** dans les variantes `Cadre=Non` : il était à y7 dans un composant de 48 de haut, soit 3 px au-dessus de son propre centre. Le même décalage subsiste dans les variantes `Cadre=Oui` — à corriger un jour, sachant que cela déplacerait un élément sur toutes les cartes.

**Note d'implémentation :** la cible tactile de 28 × 28 est conservée en `Cadre=Non`, seul son habillage disparaît. Le code doit garder la zone de frappe, pas seulement le glyphe de 14 px.

### 8.2 `DSF / Actions / Bouton primaire` — variante `État=Actif` en auto-layout

La variante `État=Désactivé` était en auto-layout centré ; la variante `État=Actif` ne l'était pas, son libellé étant posé à une position calculée pour le mot « Enregistrer ». Elle est alignée sur sa jumelle, en auto-layout centré sur les deux axes. **41 instances** corrigées, dont 38 « Continuer » qui étaient décentrées de 4 px.

À consigner comme règle : **le centrage du libellé est porté par le composant.** Une position de texte posée à la main dans un bouton est un défaut, pas un réglage.

### 8.3 `DSF / Forms / Ligne interrupteur`

Composant canonique de la ligne « titre + chevron de repli + interrupteur ». Ses 9 variantes croisent `État` (Désactivé / Activé / Grisé) et `Repli` (Aucun / Replié / Déployé).

**À documenter :** `Repli` n'est pas une apparence mais trois situations distinctes.

| `Repli` | sens |
|---|---|
| Aucun | pas de contenu à déployer — aucun chevron |
| Replié | du contenu existe, il est caché — chevron bas |
| Déployé | du contenu existe, il est visible — chevron haut |

**Dettes à consigner :**

1. Les lignes « Répétition » et « Rappel » des écrans de planification reproduisent ce composant à la main (titre, chevron et interrupteur en calques séparés). Elles gagneront à être remplacées par une instance quand la forme sera figée.
2. Le libellé du composant est en Medium 14 alors que les titres de section du panneau sont en Semi Bold 16 — l'écart est surchargé sur chaque instance.
3. Le contrôle segmenté du Rappel est construit à la main : le composant `DSF / Controls / Segmenté` ne propose aucune variante au-delà de trois éléments.

---

## 9. Ce que ce document ne demande pas

**Aucune modification de code.** L'écran de planification n'existe pas dans le dépôt : `src/features/planning/` ne contient qu'un README et l'onglet Calendrier rend un `PlaceholderScreen`. Il n'y a rien à réaligner.

**Ne pas réintroduire le Parcours comme objet.** Pas d'entité, pas d'onglet, pas d'écran de détail, pas de rattachement. Le mot est un libellé d'interface, rien de plus (§ 1.3).

**Ne pas documenter la planification horaire** comme une fonctionnalité prévue. Elle est explicitement écartée, avec ses raisons (§ 3.2).

**Ne pas écrire les règles du § 0 dans la documentation de la planification.** Elles sont de portée fichier et appartiennent à la documentation d'interface / DSF.

---

## 10. Points ouverts, à consigner comme tels

1. **x : plafond ou résultat ?** Le premier stepper et le nombre de pastilles cochées expriment la même information (§ 2.6).
2. **La rangée L M M J V S D sous les unités Jour et Mois** — masquée ou remplacée (§ 3.5).
3. **Les trois écrans du parcours Programme** : création, proposition de rattachement, avertissement hors période (§ 4.4).
4. **La conversion `jusqu'au` ↔ `pendant`** dans les deux sens, quand l'utilisateur bascule le paramètre (§ 3.4).
5. **Le décalage de 3 px du carré de Disclosure** dans les variantes `Cadre=Oui`, soit 196 instances (§ 8.1).

---

## 11. Énoncés devenus faux

À corriger partout où ils figurent, y compris hors documentation de la planification pour les quatre dernières lignes.

| énoncé | statut |
|---|---|
| Un créneau porte un seul contenu | faux — il porte une liste ordonnée |
| Le titre de planification nomme toujours le type d'objet (D-223) | faux — trois branches, dont « Planifier un parcours » |
| Le Parcours est un objet du modèle | faux — c'est un libellé, l'objet reste supprimé |
| La répétition propose une option « Aucune » | faux — c'est un interrupteur |
| Le Rappel propose une option « Aucun » | faux — c'est un interrupteur |
| La récurrence se borne par une date | incomplet — `jusqu'au` ou `pendant`, au choix |
| La fréquence d'un contenu s'exprime en jours | faux — en occurrences, sans unité |
| La modale de planification laisse voir l'écran appelant | faux — elle occupe toute la hauteur |
| Le Programme n'est représenté sur aucun écran | faux — première ligne du formulaire de planification |
| Une modale a un fond gris, ou de couleur | faux — **toutes** les modales du fichier sont blanches (§ 0.3) |
| Un écart vertical autre que 18 / 20 / 13 / 12 px est spécifié | faux — grille unique sur tout le fichier, sauf le 20 px sur Profil (§ 0.1) |
| Le bouton d'action est posé à une hauteur propre à l'écran | faux — y802 partout, 173 boutons (§ 0.2) |
| Un bloc de section porte un liseré | faux — fond #F9FAFC, aucun trait (§ 0.4) |
| `DSF / Controls / Disclosure` compte 3 variantes | faux — 6, avec l'axe `Cadre` |
