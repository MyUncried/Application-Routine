# DSF — Formats de séances — 14 octobre 2026

> **Complément fonctionnel actif PRE-9 du 30/10/2026 :** [décisions D-01 à D-30 et matrice des six Formats](KODJO-PRE9-Arbitrages-Composition-Formats-Consolides-2026-10-30.md). La présente DSF demeure la référence des **éléments graphiques effectivement représentés** dans Figma ; elle ne permet pas d'inférer un Format unique porté par Séance/Circuit, une valeur initiale à partir d'un exemple ou la présence de Gainage · Mobilité comme départ actif. Le Format appartient à l'Exercice. Tabata est répétable en Circuit groupé ou Cycle ; AMRAP possède une durée configurable par passage ; For time indexe le « Volume par tour » sur le passage du Circuit, avec sélection « Par exercice / En alternance » ; les Séries propres aux Exercices restent distinctes. L'exécution spécialisée ne relève pas de PRE-9.

Statut : extension documentaire du DSF courant. Aucun composant Figma modifié par ce lot. Sources de layout : Prototype MVP, fichier G6RY5Ebhgwb4AHIOYDwwvg, inventaire/captures du chapitre 06. Comportements : spécification Formats, D-357…369. Le moteur n’est pas livré.

## 1. Portée et familles

CE-FMT-01 : cartes de choix de modèle. CE-FMT-02 : paramètres globaux/récapitulatif. CE-FMT-03 : composition. CE-FMT-04 : modales contextualisées. CE-FMT-05/06 : compléments fonctionnels d’exécution/arrêt ; layouts spécifiques non qualifiés, ne pas inventer une maquette.

Les cartes illustrées du sélecteur de modèles ne changent pas la règle des cartes du catalogue : pas de visuel de séance ; visuel réservé aux cartes d’exercices, absent dans une liste mixte séances/exercices. Le modèle de départ est une entrée de création, pas un média persistant de la séance.

## 2. Choix d’organisation

Libellé « Exécution ». Options « Par exercice » et « En alternance ». Dernière ligne du bloc de paramètres ; dans le récapitulatif Tabata, après Durée totale. Séparateur avant cette dernière ligne ; distribution verticale régulière. Libellé et options sur une même ligne ; taille du texte identique aux paramètres voisins.

Relevé du contrôle courant : conteneur segmenté 236 × 28, texte 13 ; ligne 34. Ce sont des repères de la maquette 402 × 874, pas des dimensions imposées à tous les appareils. Réutiliser le composant segmenté du DSF (`5548:9818`, variantes `7388:13779`/`7388:13786`) selon l’état sélectionné ; conserver couleurs, arrondis et alignements de la source. Adapter aux Safe Areas et au texte agrandi sans rogner une option.

Tabata : « Séries par exercice — 8 », compatible avec les deux choix. EMOM : durée calculée en direct. Progression : répétitions par série ; alternance comptée en séries. For time : « Volume par tour » et sélecteur d'organisation « Par exercice / En alternance » lorsque plusieurs Exercices sont concernés.

## 3. Valeur imposée mais effective

État distinct d’une valeur inactive sans effet : valeur réelle visible, non modifiable, raison à l’appui. Pour Tabata, Durée, 8, 20 s et 10 s sont grisées conformément à l’arbitrage et à la modale `8747:14451`. Elles restent effectives : aucun tiret. Un contrôle désactivé ne suffit pas à expliquer la cause ; la raison du format doit être lisible et accessible.

Ce cas complète les états de lignes de la modale existante (famille `7092:13605`), sans annoncer qu’un nouveau composant maître a été créé. Il ne remplace pas les règles de tiret pour une donnée réellement sans effet, ni les règles d’héritage du nombre de séries par le circuit. Préserver contraste, nom/valeur/état accessibles, voile et tailles de la modale courante.

## 4. Volumes, cartes et phrases

Tabata par exercice : carte `8 × 20 s`, sans pause dans ce volume ; pas de cadre autour de la durée. La pause de 10 s demeure visible dans la modale comme « Pause après chaque série ». Ne pas créer une récupération pour la rendre visible sur la composition.

EMOM par exercice : garder le compte global de passages distinct de la représentation locale ; aucune multiplication série × tour supplémentaire. Progression alternée : valeurs par série ; For time : valeurs par passage du Circuit, sans modifier le nombre de Séries des Exercices.

Les phrases sont rendues en segments `{texte, gras}`, issus des paramètres, non stockées. Le texte For time normatif est conservé dans le corpus Formats associé. Un calcul illustratif faux dans Figma n’est pas une nouvelle règle ; les écarts de libellé/unité/constante sont suivis séparément.

## Phases dans les modales de format

Pour un exercice éligible et une durée de travail imposée, la dernière phase affiche le restant calculé. Les précédentes sont modifiables dans ce budget. Ajout à0 ; réorganisation conservant les valeurs ; suppression reportant le temps sur la dernière restante. Le style calculé reste distinct d’une option sans effet. Réutiliser le tableau décrit dans le DSF Deux modes et les contrats CE-UI-10/CE-FMT-04.

L’intégration d’un exercice de durée différente affiche le message informatif d’adaptation proportionnelle ; aucune confirmation supplémentaire ni nouveau dialogue bloquant. Le placement du message réutilise la notification existante. Une fenêtre EMOM ne vaut pas automatiquement durée de travail imposée. Les seize modales de format restent sans ligne Phases selon le rapport Figma du15/10 ; aucune capture n’est annoncée conforme à cet ajout.

## 5. Preuves et limites

46 captures et leurs empreintes dans `Specifications-fonctionnelles/images/formats-2026-10-14/manifest.json`. Les écarts F-01…04 sont dans la revue transverse. Aucun layout spécifique de confirmation/résultat Death by n’est qualifié par cette galerie. La couverture des captures ne détermine pas à elle seule la possibilité de développer : appliquer la clarification de portée ci-dessous.

Voir [matrice](MATRICE-FORMATS-SEANCES-2026-10-14.md), [revue transverse](REVUE-COHERENCE-FORMATS-2026-10-14.md) et [spécification](Specifications-fonctionnelles/08%20%E2%80%93%20Conception%20fonctionnelle%20d%C3%A9taill%C3%A9e.md#formats-conception).

## Clarification d’autorité et de portée — 14/10/2026

Les spécifications définissent les règles métier, les calculs et les comportements. Figma illustre les scénarios de présentation des écrans et contrôles. Un scénario absent de Figma ne constitue pas une lacune fonctionnelle lorsque son comportement est spécifié. Les shells, composants, DSF et contrats existants permettent de décliner des états sans dessiner chaque combinaison.

R-01 à R-05 sont des sujets de vérification ciblée, pas cinq blocages démontrés ni un préalable global au développement. R-01 concerne les commandes du moteur à fenêtres ; R-02 son exécution bilatérale ; R-03 l’enchaînement Death by multi-exercices. Leurs réponses doivent être recherchées dans les spécifications avant toute question. R-04 concerne uniquement la synchronisation des champs de l’éditeur For time s’ils sont modifiables séparément ; le contrôle du double comptage EMOM relève de l’implémentation et de ses tests. R-05 ne bloque rien du seul fait de captures absentes : une clarification de présentation n’est nécessaire que si l’implantation d’un élément nouveau ne peut pas être déterminée depuis les contrats et le DSF.

Aucun de ces constats ne suspend globalement la création/composition. Seule une règle effectivement absente ou contradictoire doit être clarifiée avant l’implémentation du comportement concerné. Les mentions de preuve visuelle partielle décrivent la couverture des illustrations, pas une obligation de produire une nouvelle maquette.
