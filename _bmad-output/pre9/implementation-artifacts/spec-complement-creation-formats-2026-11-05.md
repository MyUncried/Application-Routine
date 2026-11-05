# PRE-9 — Évolution « Complément parcours de création et Formats » du 5 novembre 2026

- **Nature** : évolution fonctionnelle demandée par Hermann le 05/11/2026, après la recette des Formats ; réalisée avant toute autre story PRE-9 et avant le moteur PRE-10/11.
- **Source normative** : `main` @ `aab49948` — `docs/sources/formats-2026-11-05/KODJO-Complement-Parcours-creation-2026-11-05.md` (le complément), référence `docs/KODJO-Formats-entrainement-2026-11-02.md`, chapitres 03, 04, 06–13, CE-CREATION-01, CE-T03-08, CE-FMT, plan, architecture et arbitrages PRE-9, conception consolidée du moteur.
- **Branche** : `pre9-bmad/dev`. Départ `303c7e4b` ; fusion de `main` `aab49948` : `20a8f313`.
- **Périmètre déjà recetté** (Formats et parcours, recettes du 04 et du 05/11) : non réinitialisé ; seules les règles que le complément remplace sont modifiées, avec annotation datée.

## 1. Décisions de Hermann prises pendant la réalisation (05/11/2026)

Questions posées sur deux contradictions réelles entre les annotations de recette et le complément ; réponses recopiées telles quelles.

1. *Question* : « Le 04/11 tu as décidé que les modèles sans tableau (Tabata, 30/30, Renforcement, À l'échec, Superset) s'enregistrent depuis le questionnaire, sans récapitulatif. Le complément du 5/11 leur donne maintenant un tableau (Objectif | Pause | Charge, ou par tour pour le Superset), et « Valider les paramètres » pour le Superset. Quelle règle appliquer ? » — *Réponse* : « Récap si tableau (Recommandé) » : principe du 04/11 gardé ; Superset toujours un récapitulatif ; Tabata, 30/30, Renforcement, À l'échec : récapitulatif dès deux mouvements ; un seul mouvement : enregistrement depuis le questionnaire, ligne Charge sous Durée totale.
2. *Question* : « AMRAP, incrément par tour : la référence de main dit « +0 par défaut, ligne toujours présente », alors que ta contre-recette du 03/11 dit « cases d'incrément rouges, avec + seulement, sans 0 ; au focus, pas de 0 déjà renseigné ». Avec l'incrément signé, que doit afficher une case d'incrément non saisie ? » — *Réponse* : « Vide, rouge (Recommandé) » : case « + » vide sur fond rouge, à renseigner quand « Volume croissant » est activé ; la saisie accepte ± (5, 3, 1, 1…).

## 2. Réalisation et classement (règle de synchronisation)

| # | Évolution | Classe | Réalisation | Fichiers principaux |
|---|---|---|---|---|
| 1 | Modale de création commune (CE-CREATION-01) | B | Titre « Créer un exercice », carte « Exercice libre » pleine largeur, section « Formats d'entraînement » ; Catalogue « Créer » → Composition d'un brouillon neuf (`create=1`, en mémoire) et modale présentée ; retour sans contenu → Catalogue sans rien enregistrer ; contenu posé → Composition d'arrivée, sauvegarde à sa validation | `FormatsWindow.tsx`, `app/(creation)/composition.tsx`, `formats-window.tsx`, `CatalogueScreen.tsx` |
| 2 | Menu Créer à trois options ; œil et CE-CIR-03 retirés | B | Créer un exercice (modale commune) / Créer un circuit / Créer un cycle ; feuille « Volumes du circuit » et sa présentation supprimées | `CompositionScreen.tsx`, `CompositionContextHeader.tsx`, `fr.ts` |
| 3 | Photo d'un Exercice : fiche en lecture seule « Dans cette séance » | B | Titre « Fiche de l'exercice » ; section sous le média : Phrase des paramètres + « Récupération de X avant l'exercice suivant. » | `ExerciseSheet.tsx`, `ActivityEditorForm.tsx` |
| 4 | Charges : interrupteur dans les dix questionnaires ; (+ kg) / (− kg) | B | `loadOn` par mouvement ; charges entre parenthèses ; valeurs gardées dans le brouillon du modèle (restauration temporaire) ; cases toutes vidées → ligne retirée à la fermeture du clavier ; réouverture : état effectif (`loadEnabled`) | `formatModels.ts`, `formatReedit.ts`, `FormatTables.tsx`, `FormatModelScreen.tsx` |
| 5 | AMRAP : incrément signé, borne à 1 | B | `amrapRoundTarget` (5/3/1/1…), registre sans minimum, « ± » de la barre sur Par tour ; buy-in et Max sans incrément | `formatModels.ts`, `formats/registry.ts`, `formatTimeline.ts` |
| 6 | Superset : deux mouvements, alterné, 3 tours | B | Circuit standard `SERIES` × N, chaque membre N séries (pas de N×N) ; tableau par tour, S1 recopiée ; « Récupération après le tour » = dernier Exercice ; absente → à renseigner, 0 conservé ; « + Ajouter » désactivé dès deux ; réouverture avec trois membres | `formatModels.ts`, `formatReedit.ts`, `FormatModelScreen.tsx` |
| 7 | EMOM par série | B | Tableau Unité \| S1…Sn (`cells`), aucun incrément ; S1 recopiée sur les séries vides ou restées égales ; contrôle par rang (somme des membres dans l'intervalle commun, bilatéral et pause entre côtés) dans le formulaire et la validité ; plan : au tour k, la série k | `formatModels.ts`, `configurationValidity.ts`, `planExpansion.ts`, `carrierMembership.ts` |
| 8 | Death by Répétitions ou Durée | B | Mode par Exercice, « Objectif de départ », incrément ≥ 1 dans l'unité ; avertissement non bloquant du premier rang ; contrôle EMOM non appliqué ; colonne Charge | `formatModels.ts`, `configurationValidity.ts`, `formats/registry.ts`, `FormatTables.tsx` |
| 9 | Tableaux dans leur cadre ; Tabata / 30/30 / Renforcement / À l'échec | B | Cadre « avant » (nombre de séries / tours / intervalle / durée), cadre du tableau, cadre « après », écarts de 8 ; tableau Mouvement \| Objectif \| Pause \| Charge ; Progression 10/12/14 et échelle For time conservées | `FormatModelScreen.tsx`, `FormatTables.tsx` |
| 10 | Capacités et contrat d'exécution | B (descriptif) | D.3 : `prescription` (EMOM par série, AMRAP signé borné, Death by Rép./Durée et arrêt avant rang), résultat `INTERVAL_LIMIT_REACHED` ; contrat `deathByLimit.ts` (non exécuté) | `formats/capabilities.ts`, `deathByLimit.ts` |

## 3. Interprétations à confirmer (classe C, non promues en règle)

1. **EMOM « dans chaque intervalle »** : la référence garde « Circuit porteur, 6 tours groupés » et le §17 impose « séries variables : cible et charge de la série k ». Réalisation : chaque membre porte N séries et joue sa série k au tour k (comme le For time), sans N×N ; un ancien membre à une seule série la rejoue à chaque tour.
2. **Copie de S1** (EMOM, Superset) : une valeur saisie en S1 se reporte sur les séries encore vides ou restées égales à l'ancienne S1 ; une série modifiée garde sa valeur.
3. **Superset** : la Pause de série des membres reste celle de l'Exercice de base (comme avant) ; seule la Récupération du dernier membre porte « Récupération après le tour ».
4. **Death by à un mouvement** : l'unité se choisit dans la barre du clavier de l'« Objectif de départ » ; changer d'unité remet départ et incrément à renseigner.
5. **Récupération à 0** dans la fiche « Dans cette séance » : « Aucune récupération avant l'exercice suivant. » ; non renseignée : rien n'est affiché (aucun format écrit dans les sources).
6. **Texte du message EMOM** : aucune source active n'en donne ; le texte précédent est conservé.
7. **Mode catalogue du Superset** : la sélection multiple garde le message « Deux exercices au maximum » au-delà de deux (le lien « + Ajouter » est, lui, désactivé).

## 4. Dépendances d'exécution différées (PRE-10/11, non livrées)

- Death by : arrêt avant un rang dont le travail prévu atteint la fenêtre, résultat « limite de l'intervalle atteinte », durée tenue renseignée à la clôture d'une fenêtre réellement tentée — **contrat préparé** (`src/domain/sessions/deathByLimit.ts`, tests), aucun moteur.
- AMRAP : application du plancher à l'exécution (le Déroulé et le plan l'appliquent ; aucune horloge).
- EMOM : exécution des prescriptions par série (le plan développé les ordonne).

## 5. Écarts documentaires et Figma relevés (non corrigés : documentation sous la responsabilité de `main`)

- ch13 (l. ≈ 5898) : « Tabata et 30/30 n'ont pas cet interrupteur » et « interrupteur For time / AMRAP / EMOM seulement » — contraires au §16 ; ch08 l. ≈ 955 : ordre de Suivant EMOM « Objectif → Charge → + / série » périmé.
- Paragraphes « axe qui s'arrête à Ajouter un cycle », « MENU-FMT-01 … fenêtre Formats », ch07 CIR-10 « œil permanent », ARB-22c « Libre = Séance vide », ch13 l. 554 (nœud CE-CIR-03) : restes de l'ancien menu.
- Formats §12 (un mouvement) : « Mode Répétitions (Durée grisé) », « Nombre de répétitions 1 » ; tableau Death by sans colonne Charge (l. ≈ 662).
- Validité et capacités (architecture-pre9 §6–§7, moteur §20) non mises à jour pour le 5 novembre — complétées ici dans le code (descriptif).
- Figma : interrupteurs « Avec charge » dessinés activés (valeur de démonstration) ; fonds des tableaux et écarts entre cadres non uniformes (8 / 4 / 12) — l'écart de 8 est appliqué partout.

## 6. Tests

- Domaine : `formats.complement0511.test.ts` (20 : charges et restauration, AMRAP 5/3/1/1, EMOM par série et fenêtres bilatérales, Superset alterné rouvert à trois membres, Death by et contrat de limite, valeurs initiales conservées) ; tests adaptés (`formatModels.c3`, `reprise0411`, `recette0411`, `configurationValidity.d4`) avec la règle remplacée citée.
- Interface : `compositionCreateEntry.test.tsx` (entrée Catalogue, annulation, arrivée) ; `CompositionScreen*.test.tsx` (menu à trois options, œil retiré) ; `FormatsWindow.c2` (Exercice libre) ; `ExerciseSheet` (« Dans cette séance ») ; `FormatModelScreen.c3` adapté.
- Résultats : voir le rapport de mission.

## 7. Recette iPhone ciblée à faire

Voir le rapport de mission, § « Vérifications restant à effectuer sur appareil ».
