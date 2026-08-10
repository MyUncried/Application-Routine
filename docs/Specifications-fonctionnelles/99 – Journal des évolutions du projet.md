# 99 – Journal des évolutions du projet

## Objectif

Cette note remplace les anciennes notes **Synthèse de la mise à jour** et **Historique des modifications**.

Elle constitue le journal unique des évolutions fonctionnelles du projet. Chaque entrée décrit les principales décisions validées, les documents impactés et les points restant à traiter.

# Version v16 – Refonte du modèle métier (août 2026)

## Principales évolutions

- Distinction entre **Séance** (modèle), **Routine** (planification) et **Exécution de séance**.
- Nouvelle structure : **Séance → Cycle → Bloc → Activités**.
- Remplacement de la notion de **Série** par **Bloc**.
- Les activités sont de type **Exercice** ou **Récupération**.
- La pause après un exercice devient un paramètre de l'activité.
- L'historique repose désormais sur les **Exécutions de séance**.
- Le modèle de données (chapitre 09) a été entièrement reconstruit.
- Les écrans, parcours et règles métier ont été harmonisés avec ces nouvelles définitions.

## Documents impactés

- 02 – Parcours utilisateur
- 03 – Modèle fonctionnel
- 05 – Écrans et navigation
- 08 – Règles détaillées et comportements
- 09 – Modèle de données fonctionnel
- 10 – Processus métier et règles métier transverses

## Points restant avant le développement

- Finaliser les réponses aux questions de revue de conception.
- Harmoniser les derniers libellés Figma.
- Vérifier la cohérence terminologique de l'ensemble de la documentation.
- Geler les spécifications du MVP.
# Historique des versions

## v15
- Première formalisation complète du modèle de données (version désormais remplacée par la refonte v16).

## v13
- Consolidation du chapitre 08.
- Création d'une séance : nom obligatoire avant composition.
- Revue qualité consolidée.

## v6
- Mise en place du registre des décisions.
- Mise en place du journal des modifications.

## Principe de maintenance

Pour chaque nouvelle version :

1. Mettre à jour le registre des décisions.
2. Mettre à jour ce journal.
3. Lister les chapitres modifiés.
4. Vérifier que toutes les décisions validées sont répercutées dans la documentation.

## 2026-08-10 – Résolution des points B de la revue Claude

- MVP confirmé monolingue français, avec architecture préparée pour l’internationalisation future des textes et de la synthèse vocale.
- Organisation du code validée par domaines fonctionnels, avec séparation routes / domaine / infrastructure / partagé.
- Accessibilité, responsive mobile et design tokens intégrés dès le socle ; portrait pour le MVP, paysage préparé pour une évolution ultérieure.
- Un seul layout est développé dans le MVP ; séparation du design system et de la logique fonctionnelle pour faciliter les refontes futures.
- Ordre de développement incrémental validé, avec spike timer/audio/arrière-plan placé avant la construction complète du produit.
- Stratégie de robustesse du moteur d’Exécution validée : temps fondé sur des horodatages persistés et recalcul déterministe, horloge abstraite et adaptateurs natifs.
- Spike technique iOS / Android rendu obligatoire avant développement complet du moteur, avec résultats documentés et validation sur appareils réels ; une validation complète est également requise avant livraison du MVP.


## 2026-08-10 – Séries propres à l'Activité et simplification de la création d'un Exercice

- Réintroduction du terme **Série** comme paramètre d'exécution propre à une Activité de type Exercice, sans création d'une nouvelle entité structurelle.
- Ajout d'un **nombre de Séries** propre à chaque Exercice.
- Une Série exécute la Durée ou les Répétitions de l'Exercice puis sa pause éventuelle.
- La pause est répétée après chaque Série ; la pause finale est omise lorsque l'étape suivante est une Récupération explicite.
- Refonte du parcours de création/modification d'un Exercice en deux écrans :
  1. paramètres essentiels : type, nom, mode, durée/répétitions, pause, Séries ;
  2. informations complémentaires facultatives : consigne et Zones corporelles.
- `Valider` ouvre le second écran ; `Terminer` enregistre l'Activité et revient à la composition.
- Figma et la documentation fonctionnelle ont été alignés sur ce nouveau parcours.

## 2026-08-10 – Revue de cohérence transversale

- Harmonisation du vocabulaire **Pause après Série** dans l'ensemble de la documentation.
- Suppression des références résiduelles à un mode d'Exercice autonome **Manuel** : les seuls modes d'Exercice sont **Durée** et **Répétition**.
- Conservation de l'action `Terminé` pour les Exercices en mode Répétition et adaptation des règles de durée estimée (`≈`).
- Correction d'une incohérence résiduelle : le **Bloc** et le **Cycle** appartiennent à la **Séance**, et non à la Routine.
- Complément des règles métier transverses sur le nombre de Séries et la pause après Série.
- Harmonisation du modèle de données et des préférences avec la nouvelle notion de Série.

