# KODJO V2 — PRE-1 — Spécification source de planification

## 1. Objet

Cette spécification constitue la source produit figée de la tranche `V2-PRE-1`.

PRE-1 prépare les fondations du modèle cible avant les tranches UI et avant le moteur d’Exécution.

Chaîne cible :

`Modèle de données`
→ `Invariants Domaine`
→ `Services`
→ `UX productrice de données`
→ `Composition déterministe`
→ `Gate pré-moteur`
→ `Générateur de Plan d’Exécution`
→ `Moteur d’Exécution`
→ `UI d’Exécution`

PRE-1 couvre uniquement les fondations de données, Domaine, persistance, contrats Repository, services non visuels nécessaires, calculs métier directement affectés et tests correspondants.

## 2. Contraintes de périmètre

PRE-1 ne doit pas :

- développer le Générateur de Plan d’Exécution ;
- développer le Moteur d’Exécution ;
- développer l’UI d’Exécution ;
- modifier Figma ;
- anticiper une UI dont les contrats d’écran sont encore en cours de mise à jour ;
- reconstruire la conception fonctionnelle déjà tranchée ;
- introduire une fonctionnalité de planification/Routine ;
- introduire une recherche Catalogue ;
- étendre le périmètre à l’évolution Parcours.

Si une dépendance UI devient réellement nécessaire et n’est pas déterminable depuis les contrats stabilisés, le point est classé `À CLARIFIER` plutôt qu’inventé.

## 3. Décision sur les données de développement

Les données de développement existantes n’ont pas à être conservées ni migrées fonctionnellement.

Conséquences :

- aucune migration sémantique des anciennes Catégories de Séance ;
- aucune conservation des anciennes couleurs propres aux Séances ;
- aucune conversion de l’ancien `ActivityDefinition.recoverySeconds` ;
- aucune reprise des anciens `tour.sideMode` bilatéraux ;
- les données incompatibles peuvent être supprimées ou réinitialisées ;
- les référentiels cibles peuvent être reseedés proprement.

Les migrations historiques existantes ne doivent pas être réécrites silencieusement. L’évolution doit conduire une base existante et une installation neuve vers le même schéma cible, sans logique de compatibilité métier inutile.

## 4. Terminologie structurante

- `Exercice` remplace `Activité` dans la terminologie fonctionnelle visible.
- `Circuit` = groupe ordonné d’Exercices interne à une Séance.
- `Tour` = une répétition complète du Circuit.
- `Nombre de Tours` = nombre de répétitions du Circuit.
- `Parcours` = entité autonome distincte ; ce terme ne désigne jamais le Circuit interne.
- `Cycle` = structure technique historique, non exposée, répétition = 1.
- Les identifiants techniques historiques ne sont pas renommés sans nécessité.

## 5. Référentiels persistants

Trois référentiels distincts doivent être représentables et persistants.

### Étiquette

- associée à une Séance ;
- cardinalité `0..1` ;
- porte une couleur ;
- administrable ;
- retirable ;
- une valeur retirée n’est plus disponible pour les nouvelles affectations ;
- les références existantes restent représentables ;
- le nom et la dernière couleur restent conservés pour les objets existants.

### Catégorie

- associée à un Exercice ;
- exactement `1` pour un nouvel Exercice valide ;
- porte une couleur ;
- administrable ;
- retirable ;
- mêmes principes de conservation historique que l’Étiquette.

### Zone corporelle

- associée à un Exercice ;
- cardinalité `1..N` pour un nouvel Exercice valide ;
- plusieurs Zones possibles ;
- aucune couleur ;
- administrable ;
- retirable ;
- les valeurs statiques actuelles doivent devenir un véritable référentiel persistant ou un mécanisme fonctionnellement équivalent.

Une valeur retirée ne provoque aucune réaffectation automatique.

## 6. `ActivityDefinition` cible

Un Exercice de référence persistant doit pouvoir porter :

- identité ;
- nom ;
- description/consigne ;
- mode `DURATION | REPETITIONS | TO_FAILURE` ;
- durée cible lorsque applicable ;
- répétitions lorsque applicable ;
- nombre de Séries ;
- Pause entre Séries ;
- Changement de côté propre ;
- `sideRecoverySeconds` lorsque bilatéral ;
- exactement une Catégorie ;
- `1..N` Zones corporelles ;
- Compte à rebours propre à l’Exercice ;
- Fin propre à l’Exercice ;
- associations médias ordonnées ;
- statut nécessaire à son futur cycle de vie Catalogue si le choix de schéma retenu l’exige dès PRE-1.

L’ancien champ `ActivityDefinition.recoverySeconds` ne fait pas partie du modèle cible.

La récupération post-exercice n’appartient jamais à `ActivityDefinition`.

## 7. Occurrence d’Exercice dans une Séance

Une occurrence d’Exercice dans une Séance doit pouvoir représenter une copie indépendante des propriétés intrinsèques applicables de l’Exercice de référence.

Elle porte en plus :

`postActivityRecoverySeconds`

Règles :

- propriété systématique, y compris `0 s` ;
- initialisée à la création de l’occurrence depuis le défaut Profil ;
- ne provient jamais de `ActivityDefinition` ;
- aucune modification ultérieure du Profil ne modifie l’occurrence ;
- aucune modification ultérieure de la source Catalogue ne modifie la copie ;
- elle se déplace, se duplique et se supprime avec l’occurrence.

L’ancien `SessionActivity.recoverySeconds` doit être remplacé conceptuellement par cette sémantique cible.

Aucune conservation de valeur historique n’est requise.

## 8. Bilatéralité

La bilatéralité fonctionnelle appartient exclusivement à l’Exercice.

Valeurs techniques :

- `UNILATERAL` — affichage fonctionnel cible `Aucun` ;
- `RIGHT_LEFT` — `D→G` ;
- `LEFT_RIGHT` — `G→D`.

Le support historique au niveau du Tour peut être conservé pour compatibilité technique uniquement s’il reste :

- non exposé ;
- neutralisé à `UNILATERAL` ;
- sans influence sur la direction propre de l’Exercice.

Aucune logique Domaine ne doit permettre au Tour de prendre le dessus sur le côté de l’Exercice.

## 9. Pauses et récupérations

Trois concepts sont strictement séparés.

### Pause entre Séries

- propriété intrinsèque de l’Exercice ;
- exécutée `C − 1` fois par côté.

### Pause au changement de côté

- `sideRecoverySeconds` ;
- uniquement pour un Exercice bilatéral ;
- exactement une fois entre les deux côtés.

### Récupération après Exercice

- `postActivityRecoverySeconds` ;
- propriété de l’occurrence dans la Séance ;
- exécutée après l’occurrence complète de l’Exercice ;
- indépendante des Pauses entre Séries et de la Pause au changement de côté.

Le calcul intrinsèque d’un Exercice ne doit plus inclure la récupération post-exercice.

## 10. Profil

PRE-1 doit introduire une représentation persistante permettant au minimum :

- Pause au changement de côté par défaut : `10 s` ;
- Récupération après exercice par défaut : `30 s` ;
- Compte à rebours d’Exercice par défaut ;
- Fin d’exercice par défaut ;
- autres paramètres déjà documentés s’ils appartiennent au même agrégat de préférences et n’élargissent pas artificiellement PRE-1.

Règle générale :

> Une préférence initialise un nouvel objet, puis la valeur copiée devient indépendante ; aucune rétroactivité.

PRE-1 traite le modèle et la persistance. L’écran Profil complet est hors périmètre tant que son contrat d’écran n’est pas stabilisé.

## 11. Séance

Le modèle de Séance doit pouvoir représenter :

- Étiquette `0..1` ;
- couleur affichée dérivée de l’Étiquette ;
- Compte à rebours initial ;
- Fin de séance ;
- Cycle technique unique, répétition `1` ;
- Circuit unique ;
- nombre de Tours `1..99` ;
- Exercices ordonnés avant, dans et après Circuit ;
- réglage booléen global déterminant si les Compte à rebours et Fin propres aux Exercices sont inclus dans la future Exécution.

Le booléen global :

- est activé par défaut ;
- ne modifie jamais les `ActivityDefinition` sources ;
- s’applique à tous les Exercices de la Séance.

## 12. Point d’arrêt

Le Point d’arrêt est un élément structurel distinct d’un Exercice et d’une récupération.

PRE-1 doit fournir une représentation de données permettant :

- son identité ;
- son ordre dans la Composition ;
- sa position hors ou dans le Circuit ;
- sa répétition implicite à chaque Tour lorsqu’il est interne au Circuit.

Règles fonctionnelles à préserver pour les tranches ultérieures :

- interdit immédiatement après le Compte à rebours initial ;
- interdit immédiatement avant la Fin de séance ;
- autorisé entre Exercices ;
- autorisé avant Circuit ;
- autorisé après Circuit ;
- autorisé entre Exercices du Circuit ;
- lorsqu’il suit un Exercice, la récupération post-exercice précède le Point d’arrêt.

PRE-1 n’implémente pas l’interaction UI d’ajout/retrait du Point d’arrêt.

## 13. Médias

La cible doit pouvoir représenter plusieurs médias ordonnés par Exercice.

PRE-1 doit prévoir au minimum :

- `MediaAsset` ;
- association ordonnée de type `ActivityMedia` ou modèle techniquement équivalent ;
- ordre stable des médias d’un Exercice ;
- relation indépendante de l’UI d’Exécution.

Les comportements de lecture vidéo, plein écran, galerie et interaction média pendant l’Exécution sont hors PRE-1.

Les variantes média font partie du MVP ; PRE-1 ne doit donc pas construire un modèle qui empêcherait leur mise en œuvre ultérieure.

## 14. Travaux techniques attendus du plan

Le plan technique PRE-1 doit, avant toute écriture applicative :

1. réinspecter les fichiers nécessaires pour confirmer l’état réel du code ;
2. dresser la liste exhaustive des objets, tables, types et contrats touchés ;
3. définir la stratégie de schéma SQLite cible ;
4. définir l’évolution depuis la DB actuelle en assumant que les données incompatibles peuvent être détruites ;
5. vérifier comment obtenir le même schéma sur installation neuve ;
6. définir les invariants Domaine cibles ;
7. identifier les fonctions et calculs historiques à supprimer ou neutraliser ;
8. définir les tests nécessaires ;
9. construire un plan de développement atomique et ordonné ;
10. effectuer une seconde passe indépendante de cohérence avant passage au développement.

## 15. État du code déjà vérifié à reconfirmer

Les constats suivants ont été vérifiés lors de l’analyse de planification et doivent être reconfirmés contre le HEAD exact avant conclusion :

- `ActivityDefinition` existe et est persistante ;
- elle porte encore `recoverySeconds` ;
- elle ne porte pas encore Catégorie obligatoire, `sideRecoverySeconds`, CR/Fin propres, modèle média ;
- `bodyZoneIds` est déjà une collection mais la validation actuelle ne rend pas les Zones obligatoires ;
- `SessionActivity` porte encore un ancien `recoverySeconds` ;
- le Tour possède encore `sideMode` et peut actuellement prévaloir sur l’Exercice ;
- `BEFORE_TOUR / IN_TOUR / AFTER_TOUR` et `tour.repeatCount` existent ;
- les Catégories actuelles sont des Catégories de Séance N:N ;
- `Session.color` est autonome ;
- les Zones corporelles sont statiques ;
- le Profil est un placeholder ;
- aucun Point d’arrêt applicatif n’a été trouvé ;
- aucun `MediaAsset` / `ActivityMedia` applicatif n’a été trouvé ;
- les médias de l’éditeur sont non fonctionnels ;
- les filtres et cycles de vie Catalogue ne sont pas la priorité de PRE-1 ;
- le moteur ne doit pas être commencé.

## 16. Critère de sortie PRE-1

PRE-1 ne peut être clôturée que si :

- les trois référentiels cibles sont représentables ;
- `ActivityDefinition` ne porte plus de récupération post-exercice ;
- Catégorie et Zones corporelles ont leurs cardinalités cibles ;
- `sideRecoverySeconds` existe indépendamment ;
- `SessionActivity.postActivityRecoverySeconds` existe indépendamment ;
- les préférences Profil nécessaires sont persistables ;
- la Séance porte son Étiquette éventuelle et le booléen global de phases Exercice ;
- le Point d’arrêt est représentable ;
- les associations médias ordonnées sont représentables ;
- le Tour ne possède plus de bilatéralité fonctionnelle active ;
- les calculs Domaine concernés ne contiennent plus les anciennes sémantiques incompatibles ;
- installation neuve et évolution depuis la base courante convergent vers le même schéma cible ;
- les tests Domaine/persistance/migration sont verts ;
- aucun Générateur de Plan d’Exécution ni Moteur d’Exécution n’a été commencé.

## 17. Gate PRE-1

Question de clôture :

> Le code et la persistance représentent-ils désormais sans ambiguïté toutes les données structurelles nécessaires aux futurs Exercices et Séances, sans dépendre d’une règle historique devenue obsolète et sans commencer le moteur ?

Après PRE-1, l’évolution protocolaire PE-27 doit être active avant la planification de PRE-2 afin que les besoins, tests et preuves UI soient définis avec des assertions atomiques.
