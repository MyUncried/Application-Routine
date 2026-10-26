# KODJO — Séance comme objet unique : décisions consolidées

Décision D-449 — 26 octobre 2026. **Validée par Hermann. Les six points sont clos.**

Ce document fixe la cible fonctionnelle. Il ne décrit pas une évolution déjà livrée dans PRE-7. Les écrans Figma seront adaptés après cette consolidation ; aucune capture ancienne ne vaut validation du nouveau parcours. Il remplace les propositions contraires de la formalisation v2, notamment le qualificatif « exercice » dérivé de la composition et la limitation à un cycle.

## 1. Mouvement, exercice et séance

- **Mouvement** : identité et contenu partagé du mouvement (nom, description, médias, catégorie, zones, structure des phases, appartenance éventuelle à un groupe de niveaux). Le mot Mouvement est utilisé dans le modèle et dans l’interface ; « geste » n’est pas un concept distinct.
- **Exercice** : référence à un mouvement avec ses paramètres d’exécution, à une position de la composition. Les paramètres comprennent notamment mode, séries, cibles, charges, pauses, côtés et durées des phases. La récupération reste contextuelle suivant les règles existantes. « Ligne de séance » est remplacé par Exercice dans le vocabulaire fonctionnel.
- **Séance** : seul type de contenu d’entraînement enregistré, planifiable et lançable. Elle contient un ou plusieurs exercices, directement ou dans des circuits et cycles.

L’exercice est un composant de séance, pas un second objet autonome de catalogue. Les mouvements restent des objets partagés persistants : « objet unique » désigne le contenu d’entraînement lançable, pas la disparition de toutes les autres entités. Le mouvement survit à la suppression des exercices qui l’utilisent et conserve sa recherche et ses règles d’intégrité.

## 2. Identité stable

Une séance reste une séance avec un seul exercice comme avec plusieurs. Ajouter ou retirer un exercice ne change ni sa nature ni son identifiant. Les routines conservent leur référence ; les instantanés historiques ne sont pas réécrits. Aucun mécanisme de conversion Exercice ↔ Séance n’est introduit.

Le titre facultatif proposé par la v2 n’est pas un nouvel arbitrage de cette clôture : les règles de saisie du titre existantes ne sont pas modifiées par D-449.

## 3. Reprendre une séance dans une autre

L’utilisateur choisit une séance source et insère une copie de sa composition à l’endroit choisi, au niveau principal de la séance destinataire. Les exercices, circuits et cycles sont conservés avec leurs paramètres et réglages de répétition. La séance source ne devient pas un conteneur imbriqué ; ses éléments rejoignent directement la composition destinataire.

- Les nouveaux éléments de composition reçoivent leurs propres identifiants.
- Les exercices conservent les mêmes références aux mouvements et une copie indépendante de leurs paramètres.
- Les réglages propres de début et de fin de la séance source ne sont pas importés ; ceux de la séance destinataire s’appliquent.
- Les routines, exécutions et résultats passés de la source ne sont pas copiés.
- La source reste inchangée. Aucune synchronisation des compositions ou des paramètres n’est créée.
- Les éléments insérés peuvent ensuite être réorganisés selon les règles ordinaires de composition ; aucune conversion ou imbrication automatique n’est introduite.

**Filiation :** les futurs résultats restent regroupables par identité du mouvement, sous réserve des conditions de comparabilité. La copie ne crée pas un nouveau mouvement. Une correction du mouvement partagé reste visible dans toutes les compositions qui le référencent ; les instantanés restent figés. L’indépendance des compositions ne signifie pas une copie privée du contenu du mouvement.

## 4. Plusieurs cycles successifs, sans imbrication

Une séance peut contenir des exercices, des circuits et plusieurs cycles successifs. Un cycle contient un ou plusieurs circuits et possède son propre nombre de répétitions. Un circuit contient des exercices. Un cycle ne contient jamais un autre cycle ; aucun circuit imbriqué ni séance imbriquée n’est introduit.

Exemple : échauffement, cycle A (circuits 1 puis 2, trois répétitions), cycle B (circuits 3 puis 4, deux répétitions), retour au calme. La reprise d’une séance contenant un cycle reste possible dans une séance qui en contient déjà un.

La contrainte du cycle technique unique fixé à 1 et la limitation au circuit unique sont remplacées dans la cible. Aucun nouveau plafond arbitraire n’est fixé ici.

## 5. Lancement

**On lance une séance, avec tout son contenu, qu’elle comporte un ou plusieurs exercices.** Aucun lancement isolé d’un exercice depuis la composition n’est introduit. Un entraînement autonome limité à un exercice est une séance contenant cet exercice.

La cible ne conserve pas une seconde voie de lancement autonome `ACTIVITY`. Les descriptions T03/ACTIVITY de l’ancien modèle sont des références de l’état antérieur, pas une fonctionnalité à reconduire au titre de D-449. Leur adaptation technique et le traitement des anciennes données relèvent de l’analyse d’impact ; aucun effacement de données n’est autorisé par cette décision.

## 6. Catalogue et vues filtrées

Une seule collection contient les séances. Des vues filtrées distinguent les séances contenant un exercice de celles en contenant plusieurs ; elles ne créent pas deux natures d’objet. Les libellés définitifs seront fixés dans Figma.

Le compte porte sur les exercices définis dans la composition, sans développer les séries, tours, côtés ou répétitions de cycles. Deux exercices référençant le même mouvement comptent pour deux. Un exercice placé dans un circuit ou un cycle reste un seul exercice dans ce compte. Modifier la composition peut changer l’appartenance à une vue, jamais l’identité de la séance.

La gestion des séances existantes devenues vides conserve sa règle actuelle ; ce filtre n’introduit pas de nouvelle autorisation d’enregistrer une séance vide.

## Règles conservées

- Les routines utilisent automatiquement la dernière version de la séance. Les occurrences futures prennent en compte les modifications ; le contenu est résolu et figé au démarrage. Les exécutions démarrées et passées restent inchangées. Modifier la composition ne modifie pas les dates ni la récurrence.
- Aucun dialogue général supplémentaire n’est ajouté du seul fait que la séance est planifiée ou déjà exécutée. Le dialogue du mouvement partagé conserve ses déclencheurs propres (D-445 et compléments PRE-7).
- Les circuits de tours et de séries sont conservés. Une cible reste définie par série ; le nombre de passages est dérivé, jamais un paramètre de saisie. La table de cibles indexée par passage et bouclée, proposée en v2, est retirée.
- L’assouplissement du nombre de séries imposé par un circuit de séries n’est pas décidé par les six points : ne pas le développer implicitement.
- Pauses, récupérations, côtés, charges, formats, phases cycliques et niveaux conservent leurs règles existantes. Les propositions de refonte de ces règles dans la v2 ne sont pas validées par cette clôture.

## Conséquences documentaires et techniques

| Référence | Adaptation cible |
| --- | --- |
| Chapitres 03, 04, 08 | Vocabulaire, composition, reprise d’une séance et identité stable |
| Chapitres 06, 13 | Une collection avec vues filtrées, lancement de séance, insertion de composition, cycles successifs ; visuels Figma à adapter ultérieurement |
| Chapitres 09, 11, 12 | Exercice subordonné à une séance ; références directes aux mouvements ; un seul contenu lançable/planifiable ; aucune synchronisation de compositions |
| Chapitre 10 | Règles SU-01 à SU-08 et maintien des règles de planification/instantané |
| Chapitre 07 | D-449, remplacement ciblé des anciennes dispositions |

Les anciens identifiants `ActivityDefinition`, `SessionActivity` et `ACTIVITY` restent mentionnés pour comprendre le code livré et préparer son évolution. Ils ne sont pas trois concepts fonctionnels à maintenir dans la cible. D-449 ne prescrit ni renommage mécanique de toutes les classes, ni nouvelle migration de réinitialisation.

## Critères de vérification pour la réalisation

Ces critères sont spécifiés, pas exécutés sur l’application actuelle.

1. Une séance contenant un exercice est enregistrable, planifiable et lançable comme toute séance.
2. Ajouter un second exercice conserve l’identité et les références des routines ; seul le résultat du filtre peut changer.
3. Reprendre une composition crée des identifiants distincts et conserve les identifiants des mouvements et les paramètres.
4. Modifier les paramètres d’un exercice repris ne modifie pas ceux de la source ; corriger le mouvement partagé reste visible des deux côtés.
5. Deux cycles successifs répètent chacun leurs circuits selon leur propre compte ; aucune imbrication n’est proposée.
6. Lancer la séance exécute son contenu complet ; aucune commande de lancement isolé n’est ajoutée.
7. Modifier une séance planifiée affecte les prochains démarrages sans modifier sa planification, les exécutions en cours ni les résultats passés.
8. Les filtres comptent les exercices de composition, sans multiplier par séries, tours, côtés ou cycles.
