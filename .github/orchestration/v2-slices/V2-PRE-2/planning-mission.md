# KODJO V2 — V2-PRE-2 — Mission de planification

## Statut

Activation de la tranche V2-PRE-2 (issue #288), après clôture de V2-PRE-1 (#249). Le plan est préparé localement à partir des sources ci-dessous puis soumis à la revue indépendante V2 ; il n'est pas régénéré par le modèle de planification.

## Identité

- Tranche : `V2-PRE-2` — Référentiels + Profil.
- Baseline : `53cb05c782e17eb19d269f2724a0db3cfbceb1a2` (décisions D-256 à D-259 #285, dépendances photo #286, icônes silhouette #287).
- Sources produit : chapitres 13, 07, 09, 08, 04, spécification v12 et DSF cartes/icônes, aux empreintes du bootstrap.

## Objectif

Rendre les référentiels Étiquettes, Catégories et Zones corporelles administrables et livrer le Profil (six valeurs initiales distinctes, préférences, identité locale, silhouette), avec branchement réel, migration additive et initialisation sans rétroactivité, selon la matrice de couverture du 03/10/2026 (§5 périmètre, §6 critères P2-01 à P2-22).

## Règles impératives

1. Repartir du code réel à la baseline ; ne pas inférer l'implémentation depuis la documentation.
2. Ne pas rouvrir les décisions validées, dont D-256 à D-259.
3. Les deux réglages de phase propre d'Exercice sont livrés dans le Profil ; leur application aux champs d'Exercice relève de PRE-3.
4. La Récupération après exercice est copiée à la création de l'occurrence, jamais écrasée à l'enregistrement.
5. Migration additive : aucune réinitialisation, aucune réactivation ni réensemencement au démarrage ou par migration.
6. Aucune règle tirée d'une valeur de démonstration Figma.

## Frontière

Exclus : séries variables, Ordre des côtés, calculs v12, #282, #283 (PRE-3) ; Composition complète et Points d'arrêt (PRE-4) ; archives, filtres et refonte des cartes ; Exécution ; planification et notifications planifiées ; médias d'Exercice ; comptes et synchronisation ; VNext.
