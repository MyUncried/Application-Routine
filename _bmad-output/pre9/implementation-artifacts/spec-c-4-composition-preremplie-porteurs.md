# C.4 — Composition préremplie, Circuits porteurs et compatibilité

Story PRE-9, epic C. Reprise du 02/11/2026 : `docs/KODJO-Formats-entrainement-2026-11-02.md` §1, §5, §6, §6.1, §7.5, §11, §13 ; CE-FMT-03, CE-FMT-04 ; epics § C.4. Branche `pre9-bmad/dev`. Figma en lecture seule : `11270:19541` (AMRAP avec buy-in), `11410:20123` (sortie), `11411:20181` (Death by alterné). Aucune migration.

## Réalisé

- **Ajout au brouillon** (avec C.3) : « Enregistrer dans la séance » ajoute la structure à la fin de la Composition multi-conteneurs (`appendModelToDraft`) ; sauvegarde définitive depuis la Composition ; nom du modèle suggéré, nom personnalisé jamais remplacé (B.9).
- **En-tête d'un Circuit porteur** (`CircuitHeader` prop `carrier`, `carrierPresentation.ts`) : nom du Format d'origine ; « N bloc(s) » (AMRAP) ou tours ; « jusqu'à l'échec » pour le Death by (sans stepper) ; nature fixée (texte, sans menu) ; durée portée par le Circuit en bleu, modifiable par une roulette native (`CarrierDurationSheet`) — durée de chaque bloc, durée de chaque tour, temps limite For time (« Sans limite » / « ≤ X min ») ; aucune durée pour le Death by alterné.
- **Nature fixée** : `applyLayoutNatureChange` sans effet sur un Circuit porteur. **Réglage** : `setLayoutCircuitFormatSetting` (le Format reste).
- **Entrée** (`carrierMembership.enterCarrier`, appliquée par `settleLayoutCircuitMembership`) : clé du Format d'origine, paramètres compatibles repris (cible commune, charge commune, Mode Durée en AMRAP, incrément, Intervalle), le reste à compléter ; aucune somme, moyenne, conversion ni confirmation ; déplacement direct entre deux Circuits porteurs : règle d'arrivée seule.
- **Sortie** (`exitCarrier`, issue `FORMAT_EXIT_CHOICE` de `moveLayoutItem`) : dialogue natif à trois actions « Conserver le format X » (par défaut) / « Adopter un format libre » / « Annuler » ; buy-in et buy-out sortent libres sans choix ; AMRAP en Durée : objectif de répétitions à renseigner, aucune conversion.
- **Buy-in / buy-out** : mention « Buy-in » / « Buy-out » sur la troisième ligne de la carte, à la place de la récupération ; non duplicables.
- **For time porteur, N modifié** : lignes ajoutées à compléter, surplus retiré, sans confirmation (A6) ; buy-in / buy-out à une exécution.
- **§6.1** : EMOM autonome dans un Circuit standard alterné — compte de séries adapté (perte confirmée comme pour un Exercice standard) ; AMRAP, For time et Death by alternés refusés sans mutation ; groupées admises.
- **Durées** : membre d'un Circuit AMRAP sans Durée propre compté par le Circuit (pas 12 min par carte).

## Écarts restants (C.4)

1. **Modale de l'Exercice (CE-FMT-04)** : les réglages de Format ne sont pas encore éditables dans la feuille de paramètres — Passage (À chaque tour / Une fois), Incrément par tour / par intervalle, Intervalle (EMOM autonome, Death by autonome et membre alterné), Durée de l'exercice AMRAP, « Durée maximum du For time », borne héritée grisée, Cadence AMRAP/For time. La feuille ne transporte que les paramètres d'exécution ; le raccordement (éditeur, brouillon) reste à faire. Les valeurs posées par le questionnaire sont correctes et persistées.
2. Passage au format libre volontaire depuis la modale d'un Exercice formaté autonome : dépend du point 1.
3. Buy-in / buy-out : non réordonnables à l'intérieur du Circuit et aucune insertion avant le buy-in ni après le buy-out — non encore imposé au glisser.
4. Réordonnancement par appui long au récapitulatif (C.3) ; police « Mali » (C.3).

## Synchronisation

Classe **A** (référence active). Aucun document modifié.

## Tests

`carrierMembership.c4` (12), `CircuitHeaderCarrier.c4` (3), `formatModels.c3` (ajout au brouillon), `layoutOperations.b3` (EMOM alterné adapté, nature), `structure.b7` (membre AMRAP).
