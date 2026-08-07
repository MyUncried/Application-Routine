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
