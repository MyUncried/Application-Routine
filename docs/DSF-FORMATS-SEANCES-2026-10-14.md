# DSF — Formats de séances — 14 octobre 2026

Statut : extension documentaire du DSF courant. Aucun composant Figma modifié par ce lot. Sources de layout : Prototype MVP, fichier G6RY5Ebhgwb4AHIOYDwwvg, inventaire/captures du chapitre 06. Comportements : spécification Formats, D-357…369. Le moteur n’est pas livré.

## 1. Portée et familles

CE-FMT-01 : cartes de choix de modèle. CE-FMT-02 : paramètres globaux/récapitulatif. CE-FMT-03 : composition. CE-FMT-04 : modales contextualisées. CE-FMT-05/06 : compléments fonctionnels d’exécution/arrêt ; layouts spécifiques non qualifiés, ne pas inventer une maquette.

Les cartes illustrées du sélecteur de modèles ne changent pas la règle des cartes du catalogue : pas de visuel de séance ; visuel réservé aux cartes d’exercices, absent dans une liste mixte séances/exercices. Le modèle de départ est une entrée de création, pas un média persistant de la séance.

## 2. Choix d’organisation

Libellé « Exécution ». Options « Par exercice » et « En alternance ». Dernière ligne du bloc de paramètres ; dans le récapitulatif Tabata, après Durée totale. Séparateur avant cette dernière ligne ; distribution verticale régulière. Libellé et options sur une même ligne ; taille du texte identique aux paramètres voisins.

Relevé du contrôle courant : conteneur segmenté 236 × 28, texte 13 ; ligne 34. Ce sont des repères de la maquette 402 × 874, pas des dimensions imposées à tous les appareils. Réutiliser le composant segmenté du DSF (`5548:9818`, variantes `7388:13779`/`7388:13786`) selon l’état sélectionné ; conserver couleurs, arrondis et alignements de la source. Adapter aux Safe Areas et au texte agrandi sans rogner une option.

Tabata : « Séries par exercice — 8 », compatible avec les deux choix. EMOM : durée calculée en direct. Progression : répétitions par série ; alternance comptée en séries. For time : aucun segment d’organisation ; « Volume par tour ».

## 3. Valeur imposée mais effective

État distinct d’une valeur inactive sans effet : valeur réelle visible, non modifiable, raison à l’appui. Pour Tabata, Durée, 8, 20 s et 10 s sont grisées conformément à l’arbitrage et à la modale `8747:14451`. Elles restent effectives : aucun tiret. Un contrôle désactivé ne suffit pas à expliquer la cause ; la raison du format doit être lisible et accessible.

Ce cas complète les états de lignes de la modale existante (famille `7092:13605`), sans annoncer qu’un nouveau composant maître a été créé. Il ne remplace pas les règles de tiret pour une donnée réellement sans effet, ni les règles d’héritage du nombre de séries par le circuit. Préserver contraste, nom/valeur/état accessibles, voile et tailles de la modale courante.

## 4. Volumes, cartes et phrases

Tabata par exercice : carte `8 × 20 s`, sans pause dans ce volume ; pas de cadre autour de la durée. La pause de 10 s demeure visible dans la modale comme « Pause après chaque série ». Ne pas créer une récupération pour la rendre visible sur la composition.

EMOM par exercice : garder le compte global de passages distinct de la représentation locale ; aucune multiplication série × tour supplémentaire. Progression alternée : séries ; For time : volume par tour.

Les phrases sont rendues en segments `{texte, gras}`, issus des paramètres, non stockées. Le texte For time normatif est conservé dans le corpus Formats associé. Un calcul illustratif faux dans Figma n’est pas une nouvelle règle ; les écarts de libellé/unité/constante sont suivis séparément.

## 5. Preuves et limites

46 captures et leurs empreintes dans `Specifications-fonctionnelles/images/formats-2026-10-14/manifest.json`. Les écarts F-01…04 sont dans la revue transverse. Aucun layout spécifique de confirmation/résultat Death by n’est qualifié par cette galerie. Ne pas considérer ces contrats comme entièrement prêts à développer tant que leurs raccordements explicitement incomplets ne sont pas résolus.

Voir [matrice](MATRICE-FORMATS-SEANCES-2026-10-14.md), [revue transverse](REVUE-COHERENCE-FORMATS-2026-10-14.md) et [spécification](Specifications-fonctionnelles/SPECIFICATION-FORMATS-SEANCES-2026-10-14.md).
