# KODJO — Taxonomie de mouvements V0 (proposition non normative)

> **Revue des 60 propositions (07/11/2026).** [Matrice de qualification et 9 arbitrages prioritaires](REVUE-preclassement-60-2026-11-07.md). Les 60 candidats restent tous à valider et aucun problème clinique n'est automatiquement attribué.

**Date :** 7 novembre 2026. **Statut :** PROPOSÉ — pour arbitrage, pas d'incorporation automatique dans l'application.

## Principes retenus

- **Catégorie KODJO = objectif principal** dans la classification métier : une et une seule Catégorie existante par Mouvement, avec sa couleur. **Pas de second référentiel « Objectif ».**
- Les **Zones corporelles** restent celles de KODJO, avec leurs dix identifiants historiques persistants ; aucune nouvelle hiérarchie d'anatomie n'est décidée.
- **Spécialité** : rattachement multiple, permettant par exemple qu'une même fiche soit pertinente en HYROX et en CrossFit ; aucun mouvement n'est dupliqué pour cette raison.
- **Famille gestuelle** : type de geste (squat, fente, tirage…), **sans relation de substitution** avec les familles de Niveaux (`levelGroup`) de KODJO.
- **Problème traité** : référentiel distinct à finalité clinique, avec type `DIAGNOSIS`, `SYMPTOM` ou `FUNCTIONAL_DEFICIT`. Les indications nécessitent validation clinique ; leur présence dans l'échantillon ne valide aucune prescription.
- **Cible anatomique** : association facultative à un muscle, un groupe musculaire, une articulation ou une structure ; ce n'est pas un sous-niveau obligatoire des Zones.
- Le glossaire de contenu sportif/anatomique reste distinct du glossaire métier du chapitre 01 et des alias existants des Mouvements.

## Contenu livré pour arbitrage

`taxonomie-v0-proposition.json` propose :
- **6 spécialités** (rééducation, CrossFit, HYROX, Pilates, Yoga, stretching) ;
- **19 familles gestuelles** ;
- **6 problèmes cliniques** (typés, associations soumises à validation) ;
- **9 cibles anatomiques** ;
- **12 exemples** issus des 60 candidats, soit deux par spécialité initiale.

Les exemples ne sont **pas** des règles de validation applicatives et ne valent pas « correspondances validées ». Certaines fiches peuvent relever de plusieurs spécialités. Le fichier complet des 60 candidats conserve leur classification de source sans remplacement. Le mapping des 60 dans la taxonomie attend une revue métier.

## Contrôle structurel indépendant de la base

```bash
node scripts/catalogue/validate-taxonomy.mjs
node --test scripts/catalogue/__tests__/validate-taxonomy.test.mjs
```

Le validateur contrôle l'intégrité du brouillon (ID uniques, références entre axes, types reconnus et publication interdite). Il **ne valide pas** les correspondances aux identifiants KODJO réellement actifs, ni les effets sur le moteur et les filtres mobiles. Ces contrôles doivent utiliser les services réels lors d'une phase d'intégration ultérieure.

## Réserves et décisions futures

1. Cardinalités minimum pour publication, différentes de celles autorisées en brouillon.
2. Liste et définitions finales des familles gestuelles, en particulier mouvements combinés et cas limites.
3. Validité des 6 catégories de problèmes et des indications des fiches de rééducation.
4. Faut-il des caractéristiques additionnelles sur un mouvement (matériel, difficulté, statut officiel d'atelier), et sont-elles filtres ou simples attributs ?
5. Coexistence d'homonymes de fiches de coachs et unicité locale actuelle du nom de `Movement`.
6. Conditions de distribution de paquets par spécialité et droits sur le contenu.
7. Détails UX des nouveaux filtres, non déduits automatiquement de cette taxonomie (Figma inchangé).

## Dépendances et séparation du moteur

La taxonomie proposée prépare l'outil d'administration Web locale et le catalogue central versionné. Les catégories/zonages restent administrables par utilisateur suivant les règles existantes. Aucun backend, aucune migration SQLite, aucune création de nouvelle propriété obligatoire dans `Movement.ts`, aucune modification de Figma ou du moteur d'exécution n'est réalisée ici.

Référence : [provenance et propriété des fiches](../../docs/KODJO-Provenance-propriete-fiches-mouvements-2026-11-06.md) ; [corpus pilote](../pilote/README.md).
