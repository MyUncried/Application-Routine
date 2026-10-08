# Spécification — planification à plusieurs contenus — 08/10/2026

**Statut : conception cible, non déclaration de développement livré.** Source : [brief du 08/10](../archives/planification-2026-10-08/demande-source.md), décisions D-327 à D-332 et D-222/D-223 révisées. Les règles métier viennent de ce texte ; Figma décrit leur présentation et les états représentés. Les dates, montants et durées illustratifs ne définissent aucun calcul.

Les renvois du brief au « §0 » désignent désormais le [DSF général](../DSF-INTERFACE-GENERALE-2026-10-08.md), qui est l’unique définition des règles générales. Les §1–§7 ci-dessous reprennent la numérotation source pour la traçabilité. Les prescriptions anciennes d’une source unique, de la seule unité Semaine, de l’objet autonome Parcours, des options Aucune/Aucun et de la validation immédiate au toucher en planification sont remplacées.

## Synthèse du parcours

Depuis Calendrier ou Planifier sur une carte, choisir un ou plusieurs contenus par cases puis Ajouter n éléments. Le formulaire présente Programme facultatif, Début, Répétition, les contenus ordonnés s’ils sont plusieurs, puis Rappel. Chaque contenu peut filtrer les occurrences du créneau par un motif x fois sur n. Le récapitulatif reste visible au-dessus d’Enregistrer. Enregistrer valide le brouillon complet ; ouvrir une modale ou changer un réglage ne persiste pas une Routine. Les exécutions et instantanés historiques restent préservés.

## 1. Le concept central : un créneau peut porter plusieurs contenus

### 1.1 Ce qui change

Jusqu'ici, planifier revenait à poser **une** séance ou **un** exercice sur un créneau. Désormais un créneau porte une **liste ordonnée de contenus**, qui peuvent être des séances, des exercices, ou un mélange des deux.

### 1.2 L'invariant, qui ne bouge pas

> **Le créneau produit les occurrences ; le contenu ne fait que les filtrer.**

Aucun contenu ne peut créer une occurrence que le créneau n'a pas produite. Cet invariant commande tout le reste, en particulier le modèle de fréquence (§ 2).

### 1.3 « Parcours » : un mot, pas un objet

Le mot **parcours** réapparaît dans l'interface, mais **uniquement comme vocabulaire**. L’ancien objet autonome Parcours est retiré de la conception :

> Le parcours n'est pas une entité du modèle. Il n'a ni identité, ni persistance propre, ni écran de détail, ni rattachement. Il désigne **ce que produit** la planification de plusieurs contenus liés sur un même créneau. C'est un résultat nommé, pas une classe.

À distinguer soigneusement du **Programme**, qui est, lui, un conteneur réel (§ 4).

L’ancien usage de **circuit** pour cet objet autonome est supprimé. Le **Circuit interne à une Séance** reste conservé : un Tour en est une répétition (D-209). Ne pas supprimer ni renommer les identifiants techniques historiques dans cette mission documentaire.

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

À clarifier avant de finaliser l’implémentation concernée ; aucun choix implicite n’est autorisé.

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

**Pourquoi deux lignes.** L’exemple mesuré dans le brief — « Toutes les 12 semaines jusqu'au 23 septembre 2026 » — mesure **410 px** au corps des titres de section, pour une largeur utile de **354 px**. Détacher « Toutes les » sur sa propre ligne ramène la ligne porteuse à **352 px**, sur le gabarit de référence. Les autres tailles d’écran et le texte agrandi doivent rester lisibles sans réduire la police. La règle à écrire est donc : *la phrase tient sur une seule ligne porteuse, le préfixe est posé au-dessus*.

### 3.4 `jusqu'au` / `pendant` : un paramètre, pas un mot fixe

C'est un point de modèle à documenter explicitement.

> La borne de fin est introduite par un **paramètre à deux valeurs** : **`jusqu'au`** et **`pendant`**.

| valeur | ce que porte la borne | exemple |
|---|---|---|
| `jusqu'au` | une **date** | Toutes les 2 semaines **jusqu'au** 23 août 2026 |
| `pendant` | un **nombre d'unités** | Toutes les 2 semaines **pendant** 12 semaines |

Le même emplacement porte donc deux types de valeur selon le paramètre choisi. La bascule devra assurer une conversion dans les deux sens ; sa formule et ses cas limites restent à spécifier avant développement.

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

Dix états de référence ont été identifiés sur les pages Prototype MVP et communautaire. Le brief annonce une parité complète ; la lecture du 08/10 relève toutefois des contenus d’exemple différents dans la sélection à un élément. L’identité stricte des deux pages n’est donc pas attestée. Les identifiants et les captures réellement repris figurent dans la matrice du 08/10.

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

La modale part de **y 36** (sous la barre d'état) et descend à 874. Coins supérieurs **carrés**. Elle ne laisse plus voir l'écran appelant.

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

À consigner comme dette de design : ce contrôle est un contrôle segmenté construit à la main, et le DSF n'offre aucune variante au-delà de trois éléments (DSF général, § 8.3).

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

## 7. Décisions révisées

### 7.1 D-222 — rappel

Amendée dans le registre le 08/10 : la sélection multiple n'est plus réservée à la Composition, le CTA s'appelle « Ajouter n éléments ». La forme au singulier est incluse.

### 7.2 D-223 — le titre de planification a maintenant trois branches

**Ancienne formulation, remplacée :**

> Le titre de planification est contextuel : `Planifier` tant que le type d'objet n'est pas connu, puis `Planifier une séance` ou `Planifier un exercice` selon la source choisie.

**Règle courante :**

> Le titre de planification dépend du nombre et du type des contenus retenus :
>
> | contenus retenus | titre |
> |---|---|
> | une seule séance | **Planifier une séance** |
> | un seul exercice | **Planifier un exercice** |
> | plusieurs contenus, de même type ou de types différents | **Planifier un parcours** |
>
> `Planifier` seul reste le titre tant qu'aucun contenu n'est retenu.

« Parcours » est un **libellé**, pas un objet (§ 1.3).

### 7.3 Nouvelle décision — l'option « Aucune » de la répétition est supprimée

Décision enregistrée :

> Le contrôle binaire `Aucune / Périodique` de la répétition est remplacé par un **interrupteur** et un **contrôle segmenté d'unité** (Jour · Semaine · Mois). L'absence de répétition est portée par l'état de l'interrupteur, et replie la section. La même règle s'applique au Rappel, dont l'option « Aucun » est supprimée au profit d'un interrupteur.

### 7.4 Nouvelle décision — la fréquence d'un contenu

> La fréquence d'un contenu au sein d'un créneau s'exprime en **x fois sur n**, sans unité de temps. Elle filtre la suite des occurrences produites par le créneau. Le cas x = n s'écrit « à chaque fois ».

### 7.5 Nouvelle décision — la borne de fin est un paramètre

> La borne de fin d'une récurrence est introduite par un paramètre à deux valeurs, `jusqu'au` (une date) et `pendant` (un nombre d'unités).

### 7.6 Nouvelle décision — règles d'interface de portée fichier

D-327 renvoie au [DSF général](../DSF-INTERFACE-GENERALE-2026-10-08.md). Les règles générales ne sont pas redéfinies dans ce document de planification.

## 9. Ce que ce document ne demande pas

Cette mise à jour décrit une conception cible et ne certifie aucune livraison de code. Elle ne réintroduit ni objet autonome Parcours ni récurrence horaire. Les règles communes d’interface sont définies dans le DSF général ; les points ouverts ci-dessous doivent être complétés avant l’implémentation concernée.

## 10. Points ouverts, à consigner comme tels

1. **x : plafond ou résultat ?** Le premier stepper et le nombre de pastilles cochées expriment la même information (§ 2.6).
2. **La rangée L M M J V S D sous les unités Jour et Mois** — masquée ou remplacée (§ 3.5).
3. **Les trois écrans du parcours Programme** : création, proposition de rattachement, avertissement hors période (§ 4.4).
4. **La conversion `jusqu'au` ↔ `pendant`** dans les deux sens, quand l'utilisateur bascule le paramètre (§ 3.4).
5. **Le décalage de 3 px du carré de Disclosure** dans les variantes `Cadre=Oui`, soit 196 instances annoncées par le brief (DSF général, § 8.1).

---


## Limites de spécification à traiter avant développement

La borne hebdomadaire existante 1..12 et le calcul ancré sur la semaine contenant le début restent applicables à Semaine ; ils ne fixent pas automatiquement les bornes de Jour/Mois ou des steppersx/n. Les règles de fin de mois, l’ancrage précis du motif après édition/suppression, les résultats partiels d’un créneau à plusieurs contenus et l’effet de l’archivage d’un seul contenu nécessitent une spécification complémentaire. Les anciens traitements mono-source ne peuvent pas être généralisés implicitement à toute la liste.

Une fréquence valide doit décrire x positions parmi n ; le comportement d’interaction qui garantit cette cohérence reste le point ouvert 1. Ne pas inventer de sélection automatique après remise au gris. Pas d’unité Heure ; plusieurs heures par jour est une piste, pas une capacité livrée.

Le document Programme / Modèle de Programme V1.2 cité par le brief n’a pas été retrouvé dans le dépôt lu. Une recherche des fichiers a retrouvé la V1.1 du 18/09, mais pas la V1.2. La V1.1 ne suffit pas à attester les clauses V1.2 : son §29.2 porte sur la réalisation à date et son §32 prévoit encore le recalcul rétroactif ; ne pas les substituer au gel de l’échu annoncé par le nouveau brief. Le rattachement facultatif, la fenêtre bornant les dates et le gel des données échues sont les exigences explicitement fournies ; aucune autre clause de cette source n’est reconstituée de mémoire. Les trois écrans manquants restent à concevoir.

## Vérification visuelle après correction

Le titre « Éléments planifiés » a été retiré des deux pages à la demande du propriétaire le 08/10. Le propriétaire a ensuite confirmé la correction terminée par Claude. Les deux pages ont été relues : blocs gris sans trait, liste sans titre et pied protégé observés. Les captures de Planifier un parcours et Fréquence sont reprises ; la lecture de ce dernier confirme le fond corrigé. Les captures sont des preuves du rendu observé, pas une certification de conformité de toutes les règles.
