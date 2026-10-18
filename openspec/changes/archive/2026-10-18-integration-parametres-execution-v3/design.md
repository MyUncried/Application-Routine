# Design — intégration de la spécification v3.0 des paramètres d’exécution

## Context

- Base : `docs/openspec-revision` au commit `b6ca2321` (documentation restructurée et finalisée, lot 6, F9).
- Source : spécification v3.0 du 18/10/2026, copiée dans [source/](source/KODJO_Charge_Specification_2026-10-18.md). Elle déclare ses arbitrages clos (§8, §12) et désigne ses propositions abandonnées (§11.3).
- Inventaires initiaux (lecture seule) : côtés (783 passages relevés), charge (219), cadence (390), durée et signaux (233), condition d’arrêt (453), présentation de la feuille (155). Vérification Figma en lecture seule de 43 frames de modales, 21 frames d’exécution et des 25 captures du chapitre 06.

## Goals / Non-Goals

**Goals**
- Une source normative par règle : les règles détaillées au chapitre 10 (RM-235 à RM-250), les décisions au registre (D-403 à D-413), l’effet à l’écran au contrat CE-UI-10 et aux contrats concernés ; les autres chapitres citent.
- Remplacement explicite : chaque prescription contredite est mise à jour en citant la décision qui la remplace ; les décisions remplacées gardent leur texte au registre et reçoivent une mention de statut.
- Conservation : calculs, séries, pauses, enchaînements, validations, substitution des signaux en Séance et bornes restent inchangés.

**Non-Goals**
- Pas de chapitre, d’annexe ni de spécification parallèle ; la matrice de couverture reste dans ce change.
- Pas de modification de Figma, du code, des copies figées PRE-4/PRE-5, des PR #363, #370, #371 ; pas de fusion dans `main`.
- Pas d’intégration des variantes de §11.3.

## Decisions

1. **Concepts conservés, libellés visibles remplacés.** « Ordre des côtés », « Bip de cadence » et « Durée totale » restent les noms des concepts (titres, ancres, calculs, phrase de synthèse) ; les libellés visibles deviennent Enchainement, Cadence et Durée de l’exercice (PR-01, DU-01). Renommer les concepts aurait cassé des ancres sans apport de sens.
2. **Côtés.** Le choix de direction disparaît ; la bilatéralité devient Avec / Sans. Les séquences de calcul écrites D1…G3 sont réécrites en prose (côté 1, côté 2), sans nouvelle notation (§9.3). Les données historiques D→G / G→D valent Avec (RM-244).
3. **Présentation segmentée.** GR-01, PR-03 et le scénario 11.2 « Mode d’exécution (sélection segmentée) » valident des contrôles segmentés ; D-413 nomme le remplacement des popovers de D-377 pour Mode, Type de série et Changement de côté. Cette lecture est signalée dans le dossier de questions pour confirmation.
4. **Phases d’exercice.** Elles n’existent que dans la PR #370 (D-370 à D-375 réservés). Les points CV-01 (option Avec des phases), GR-01 (ligne Phases), RO-01 (roulette de phase) sont décidés au registre et marqués « partiel — dépend de #370 » dans la matrice ; le texte à ajouter au report de #370 est donné dans [dependances-pr.md](dependances-pr.md).
5. **Points laissés ouverts par la spécification** (position de la charge dans la phrase, roulette Répétitions en séries identiques, etc.) : la documentation énonce ce qui est décidé et renvoie au [dossier de questions](questions-hermann.md), sans inventer de règle.
6. **Captures.** Les 20 états actuels de la feuille sont exportés de Figma sans retouche dans `images/parametres-2026-10-18/` ; les anciennes images restent dans le dépôt (références des matrices datées).
7. **Traçabilité.** Corrections au format texte (`corrections/`), converties en JSON rejouable (`constats/`), appliquées par `outils/appliquer.mjs`, contrôlées par `outils/controler.sh` qui réutilise les contrôles du lot 6 (rejeu exact, C1–C7, liens, K1, K2, OpenSpec).

## Risks / Trade-offs

- [Lecture « segmentés »] → signalée à Hermann ; réversible par une décision ultérieure.
- [Conflits avec #370/#371] → correctifs repositionnés recalculés et vérifiés par `git apply --check` sur l’état final ; blocs sans objet ou en conflit décrits.
- [Volume des réécritures] → chaque bloc cite sa décision ; la conservation contrôle qu’aucune ligne ne disparaît sans correction déclarée.
