# Modèle et migration T03 — Catalogue des activités

Ce complément précise les impacts de T03 sur le modèle de données, les services et l’architecture. Il complète les chapitres 09, 11 et 12 sans modifier le périmètre des contrats d’écran. **Pour le périmètre T03, toute formulation antérieure de ces chapitres qui classerait `ActivityDefinition`, l’origine `ACTIVITY`, l’Exécution directe ou leur migration en V2 est supersédée par ce document et par D-167 à D-183. Les révisions D-201 à D-206 du 22 septembre 2026 supersèdent en outre les règles de création locale de `SessionActivity`, de Catégories de Séance et de référentiel figé des Zones corporelles.** Les formulations restant relatives aux médias multiples et aux Circuits conservent leur caractère post-MVP.

## ActivityDefinition et SessionActivity

`ActivityDefinition` est la référence persistante autonome du Catalogue des activités. `SessionActivity` est une copie appartenant à une Séance. La définition porte en plus un Compte à rebours d’activité, une Fin d’activité, zéro ou une Catégorie et zéro ou plusieurs Zones corporelles. Les deux phases temporelles propres à l’Activité ne sont pas copiées dans la `SessionActivity` ; la Catégorie et les Zones corporelles le sont.

Lors d’une insertion depuis le Catalogue, la copie reprend toutes les propriétés métier applicables au moment de la validation : nom, Description, mode et cible, nombre de Séries, Pause, Récupération, Zones corporelles, direction propre `UNILATERAL | RIGHT_LEFT | LEFT_RIGHT` et tout autre champ métier persistant applicable. Après insertion, aucune synchronisation ni propagation n’existe entre la définition et la copie.

Depuis D-205, une Activité ajoutée depuis une Composition provient toujours d’une `ActivityDefinition` persistante. `Ajouter une activité` ouvre directement la sélection du Catalogue ; `Créer une activité` depuis cette modale crée d’abord l’`ActivityDefinition`, puis ajoute sa copie indépendante à la Séance.

## Cycle de vie de la définition persistante

Une `ActivityDefinition` peut être :

1. créée ;
2. consultée et modifiée ;
3. archivée ;
4. restaurée depuis les archives ;
5. supprimée définitivement depuis les archives.

La suppression définitive retire la définition et ses relations propres au Catalogue. Elle ne supprime ni ne modifie :

- les `SessionActivity` déjà créées par copie ;
- les Exécutions historiques ;
- les Instantanés immuables ;
- les résultats historiques.

## Migration T03

La migration T03 historique introduit les structures nécessaires aux `ActivityDefinition`, à leurs relations et à l’origine d’Exécution `ACTIVITY`. Elle reste immuable. D-201 à D-206 sont portées par une migration additive ultérieure : champs temporels et Catégorie de l’ActivityDefinition, Classification de Séance et référentiels administrables. Le projet n’exige aucune conversion sémantique des anciennes Catégories de Séance vers les Classifications.

La migration doit être idempotente, compatible avec la base locale existante et préserver l’intégralité des Séances et Exécutions antérieures.

## Exécution directe

Une Exécution directe :

- a `origin = ACTIVITY` ;
- référence un instantané autonome immuable de l’`ActivityDefinition` au lancement ;
- ne crée aucune Séance technique ou artificielle ;
- applique une préparation fixe de `5 s` ;
- développe les Séries, Pauses, côtés et Récupération selon les règles existantes ;
- ne contient ni Tour, ni Cycle, ni phase `SESSION_END` ;
- alimente le Suivi général et les statistiques compatibles sans augmenter les compteurs de Séances.

Le sous-ensemble moteur nécessaire à cette Exécution doit être conçu pour être réutilisable par T04 sans anticiper l’orchestration complète des Séances.

## Sélection multiple

L’API de sélection multiple reçoit les identifiants sélectionnés mais restitue/insère les copies selon l’ordre courant de présentation de la liste filtrée au moment de la validation. L’ordre des touchers n’est jamais un ordre métier.

Une validation sans sélection est invalide et ne crée aucune donnée.

## Frontière post-MVP

Les médias multiples `0..n` et les Circuits fonctionnels restent hors T03. Les structures introduites ne doivent pas empêcher leur ajout ultérieur, mais aucun comportement fonctionnel correspondant n’est activé dans cette tranche.
