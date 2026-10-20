# Propagation de la borne minimale de 1 s (décision du 19/10/2026)

Clone `C:\Dev\KODJO-BMAD-PRE5`, branche `bmad/pre5-depuis-pre4`. Le périmètre est la documentation seulement (consigne 1). Rien n’est committé. Le code, les tests, l’historique et le protocole VNext ne sont pas modifiés.

## 1. Décision enregistrée

**D-430 — Bornes minimales des durées.** Elle est ajoutée au registre (ch. 07, l. 17-18), après D-429, dans le même format `### D-xxx — titre`. D-427 à D-429 étaient les derniers numéros utilisés, et aucun D-430 n’existait dans `docs/`.

- **Contenu :** la décision de Hermann reformulée sans changement de sens. Minimum de 1 s pour toute durée strictement positive. Zéro conservé là où il est déjà prévu. Pas de 1 s, sans palier minimal de 5 s. Maxima conservés. Somme des phases comprise entre 1 et 3 535 s. Durées imposées par un format soumises au format.
- **Supersession :** D-430 remplace D-232 et RM-234 sur le seul point du minimum de 5 s.
- **Convention suivie :** le texte d’une décision remplacée n’est pas réécrit ; son statut indique le remplacement (ch. 07, « Arbitrages du 16/10 »). Le statut de D-232 reçoit donc la mention « borne minimale de durée remplacée sur ce point par D-430 le 19/10/2026 ».
- **Aucune nouvelle RM n’est créée.** RM-234, qui porte ces bornes, est amendée en place avec renvoi à D-430. La règle de somme des phases y est ajoutée. Le dernier numéro de règle reste RM-250.
- **Index des identifiants :** non complété, car il ne recense pas non plus D-425 à D-429.

## 2. Modifications (8 fichiers, 26 lignes ajoutées, 21 supprimées)

Les numéros de ligne sont ceux du fichier après modification.

| Fichier:ligne | Avant | Après |
|---|---|---|
| `docs/PRODUCT.md:506` | Durée par Série = `5 s..58 min 55 s`. | `1 s..58 min 55 s` (minimum porté de 5 à 1 s par D-430, 19/10/2026). |
| `07 – Registre…:17-18` | — | Nouvelle décision D-430 |
| `07 – Registre…:324` (D-232, colonne Statut) | Supersédée sur ces points le 02/10/2026 | + « ; borne minimale de durée remplacée sur ce point par D-430 le 19/10/2026 (5 s → 1 s, maximum inchangé) ». Texte de la décision non réécrit. |
| `07 – Registre…:624` (réception du §4.5) | …D-232, RM-234 et les contrats sont corrigés. | + « Depuis le 19/10/2026, le sélecteur commence à 1 s (D-430). » Le récit du 13/10 est conservé. |
| `08 – Conception…:243` (Phases, Structure) | — | Nouvelle puce : phase validée ≥ 1 s, pas de 1 s, somme 1..3 535 s (D-430). Le zéro temporaire et la dernière phase calculée d’un format suivent les règles existantes. |
| `08 – Conception…:343` (Compléments, point 1) | « La durée minimale et le pas propres aux phases ne sont pas explicitement arbitrés. Une phase de 3 s… borne minimale documentaire de 5 s par série. » | « Durée minimale et pas des phases arbitrés le 19/10/2026 par D-430 : 1 s, pas de 1 s, somme 1..3535 s ; la borne de 5 s par série est supprimée. » La suite du point (arrondis à zéro, budget trop court) est inchangée. |
| `08 – Conception…:346` (Compléments, point 4) | …Cette divergence n’est pas créée par les phases. | + « Depuis D-430 (19/10/2026), la borne spécifiée est 1..3535 s. » |
| `08 – Conception…:370` (tableau des champs, Durée) | ouverture du sélecteur à 00:05… \| 5 s à 58 min 55 s | ouverture à 00:01… \| 1 s à 58 min 55 s, pas de 1 s (D-430) |
| `08 – Conception…:390` | Les bornes et pas suivent D-232, | Les bornes et pas suivent D-232 (minimum de durée porté à 1 s par D-430), |
| `09 – Modèle de données…:374` (Phases) | Les bornes et pas spécifiques restent à préciser au chapitre 08. | Chaque phase validée dure au moins 1 s, au pas de 1 s, et la somme des phases est comprise entre 1 et 3 535 s (D-430, 19/10/2026) ; les autres cas limites restent à préciser au chapitre 08. |
| `09 – Modèle de données…:536` | durée par Série `∈ [5,3535] s`, | `∈ [1,3535] s` (minimum porté de 5 à 1 s par D-430, 19/10/2026), somme des phases d’exercice `∈ [1,3535] s` (D-430), |
| `10 – Règles métier…:523` | Durée par Série : roulette `5 s..58 min 55 s` ; | roulette `1 s..58 min 55 s`, pas de 1 s (D-430) ; |
| `10 – Règles métier…:2192` (RM-234) | Durée par Série `5..3535 s`; | `1..3535 s` (minimum porté de 5 à 1 s par D-430, 19/10/2026); phases d’exercice : chaque phase validée ≥ 1 s, somme des phases `1..3535 s` (D-430); |
| `10 – Règles métier…:2208` | Durée par Série `5 s..58 min 55 s`, | `1 s..58 min 55 s` (minimum de 1 s, D-430), |
| `11 – API…:112` (validation des phases) | éligibilité, six phases maximum, libellés 20 caractères, cohérence avec la durée imposée | + « chaque phase validée ≥ 1 s et somme des phases comprise entre 1 et 3 535 s (D-430) » |
| `11 – API…:522` (API-PARAM-01) | durée par Série `5..3535 s`; | `1..3535 s` (D-430); somme des phases `1..3535 s` (D-430); |
| `12 – Architecture…:1522` | durée 5..3535 s, | durée 1..3535 s (minimum porté de 5 à 1 s par D-430), somme des phases 1..3535 s (D-430), |
| `13 – Contrats d’écran…:1130` (CE-UI-10, validation) | roulette de cible par pas de 1 s dès 5 s. … Ti5..3535 s, | dès 1 s (D-430, 19/10/2026 ; auparavant 5 s). … Ti1..3535 s, somme des phases 1..3535 s (D-430), |
| `13 – Contrats d’écran…:1191` (ligne 2b Phases) | …durée de série calculée ; | + « chaque phase validée ≥ 1 s, somme des phases 1..3535 s (D-430) ; » |
| `13 – Contrats d’écran…:1204` | sélectionnée : 00:05 en Durée, | 00:01 en Durée (D-430), |
| `13 – Contrats d’écran…:1212` (tableau des bornes) | \| Durée par Série \| 5..3535 s \| | \| 1..3535 s (minimum porté de 5 à 1 s par D-430, 19/10/2026) \| |
| `13 – Contrats d’écran…:1213` (tableau des bornes) | — | Nouvelle ligne « Phase d’exercice » : chaque phase validée ≥ 1 s ; somme 1..3535 s (D-430) ; pas de 1 s ; 0 s reste un état temporaire de saisie, retiré à la validation (D-373) |
| `13 – Contrats d’écran…:1229` | La roulette propose les valeurs de 5 à 3535 s par pas de 1 s ; | de 1 à 3535 s par pas de 1 s (minimum porté de 5 à 1 s par D-430, 19/10/2026 ; la borne 00:05 confirmée le 13/10 est remplacée sur ce seul point) ; |
| `13 – Contrats d’écran…:2774` (recette T03) | Durée 5 s (borne minimale de saisie)… ; vérifier séparément la conservation d’une cible historique à 1 s non modifiée…, sans considérer cette valeur comme saisissable lors d’une nouvelle édition ; | Durée 1 s (borne minimale de saisie, D-430)… ; vérifier séparément la conservation d’une cible historique hors bornes non modifiée lorsqu’elle existe (D-383) ; |

Les fichiers du ch. 07 à 13 sont dans `docs/Specifications-fonctionnelles/`.

**Recherche sans résultat dans :** `AGENTS.md`, `docs/AGENTS.md`, `docs/INDEX.md` et `openspec/specs/` (gouvernance-documentaire, integration-specifications-externes). Aucune modification n’y était nécessaire. `openspec/changes/` ne contient que `archive/`.

## 3. Mentions laissées volontairement

### 3.1 « 5 s » qui ne sont pas des bornes minimales

Ces mentions sont hors du champ de la décision. Elles ne sont pas touchées.

- **Préparation directe fixe de 5 s** (D-158, RM-098, CE-T03-09, E39 ; ch. 01, 02, 03, 04, 05, 08, 09, 11, 12, 13, PRODUCT). C’est une durée système fixe, pas un minimum.
- **Valeurs par défaut de 5 s.** Fin de séance (D-004, RM-031, ch. 01, 09, 10, 13 et PRODUCT) et Fin d’exercice (D-240, D-256, D-265 ; CE-UI-10 l. 1202). Leurs bornes 0..60 s au pas de 1 s sont inchangées.
- **Choix rapide « 5 s » de la Cadence** (D-408, RM-245 ; ch. 01, 03, 05, 06, 08, 10, 13, PRODUCT). C’est un intervalle de bip, dont les bornes sont 0..10 s.
- **Maintien accéléré 1/5/10 des steppers** (D-313, DSF Bip ; RM-234, ch. 09, 10, 12, 13, PRODUCT). Le tap reste à 1 s. Le palier de 5 n’apparaît qu’après 2 s de maintien : ce n’est ni un minimum, ni un pas imposé. Comportement validé, donc conservé (consigne 3).
- **Valeurs d’exemple** : Pause de 5 s dans les phrases, exemple 5 + 7 + 8 des phases, etc.
- **Annexe – Historique des consolidations l. 130 (V-11)** : la mention « pas Fin 5 s contre prescription 1 s » est un écart Figma historique.

### 3.2 Mentions historiques contraires à D-430, conservées sans modification

- **`07 – Registre…:324`, texte de D-232** (« durée5..3535s »). Il n’est pas réécrit, par convention du registre : seul son statut est amendé.
- **`07 – Registre…:624`** : « Sélecteur dès 5 s ». C’est le récit de la réception du 13/10 ; une phrase de renvoi à D-430 y est ajoutée.
- **`13 – Contrats d’écran…:1229`** : « Bornes confirmées le13/10 : cible Durée de00:05 à58:55 (5–3535s) ». Ce constat daté est conservé ; la phrase normative de la même ligne est corrigée et le renvoie à D-430.
- **`08 – Conception…:346`, point 4** : le constat daté de l’écart doc/code au commit 6656fefc est conservé, avec une phrase de mise à jour.
- **`12 – Architecture…:320`** : « Les bornes de durée actuelles du code divergent de RM-234 ». Cela reste vrai : le code a un minimum de 5 s (`EP:88`), RM-234 un minimum de 1 s. Non modifié.
- **`Annexe – Matrice de traçabilité.md:451`** contient `Ti5..3535 s` et `Durée par Série 5..3535 s`. Cette annexe est non normative et générée par `openspec/changes/archive/…/tracabilite.mjs` ; elle n’est pas éditée à la main. Elle sera à jour au prochain recalcul.
- **`docs/DSF-DEUX-MODES-ECHEC-2026-10-13.md:39, 43`** contient `00:05` et `5–3535s`. C’est un DSF source daté du 13/10, conservé comme source historique.
- **`docs/preparation/PRE-3/planification/candidate-manifest.json`, `docs/preparation/PRE-4/**`, `docs/archives/**`, `openspec/changes/archive/**`** : historique, non modifié.
- **`_bmad-output/pre5/sources-2026-10-19/KODJO-Phases-specification-consolidee-2026-10-15.md:241`** : copie de source datée, non modifiée.
- **`_bmad-output/pre5/inventaire-sources.md:253`** : inventaire daté, non modifié. Le PRD en cours (`planning-artifacts/`) n’est pas touché non plus.

## 4. Code et tests concernés (consigne 2, à reprendre dans les stories PRE-5)

Rien n’est modifié. L’essentiel du code tire sa borne de `EXECUTION_BOUNDS.durationTarget`. Abaisser `min` à 1 propage donc la règle aux roues, à la validation, au Brouillon et au stepper. Les adaptations restantes portent sur les commentaires, les tests et les phases à venir.

### 4.1 Code

| Fichier:ligne | Nature de l’adaptation |
|---|---|
| `src/domain/activities/ExecutionParameters.ts:88` | `durationTarget: { min: 5, max: 3535 }` devient `{ min: 1, max: 3535 }`. **C’est le seul changement de valeur nécessaire.** Il propage la règle à `targetBounds` (l. 511-512), `nearestGridValue` (l. 258), `selectorOpeningPosition` (l. 278, « — » ouvre sur 00:01), `stepTarget` (l. 325-330, + depuis « — » donne 1 s) et à la validation INPUT `checkInputBounds` (l. 647). |
| `src/domain/activities/ExecutionParameters.ts:83-87, 254-255, 270, 317` | Commentaires à mettre à jour : « 5 s à 58 min 55 s », « 4 → 5 », « 5 s en Durée », « 5..3535 s ». |
| `src/features/activities/ExecutionParametersSheet.tsx:1057, 1931-1932` | Aucun changement de code : la roue (`targetBounds`) et l’`InlineStepper` d’une cellule lisent `EXECUTION_BOUNDS`. Commentaire l. 1042-1043 à corriger (« — » → 00:05, « 5..3535 »). |
| `src/features/sessions/DurationWheelPicker.tsx:150, 216, 231` | Roue générique. Avec min = 1, les secondes à 0 min deviennent `00`, puis 01..59. `00:00` reste une position non validable (`isBelowMin`, l. 231). La branche `min >= 60` (l. 216) n’est pas concernée. Commentaire l. 150 à corriger. |
| `src/features/sessions/wheelPickerMath.ts:184, 193, 225` | `boundedSecondsValues` et `snapBoundedSeconds` sont génériques : seuls les commentaires changent (« 05..59 », « 00:05 pour 5..3535 »). À 0 min, le recalage visera 00:01. |
| `src/features/sessions/NumberWheelPicker` (Répétitions 1..100) | Non concerné. |
| `src/domain/activities/ExecutionParametersDraft.ts` (Brouillon) | Aucune borne de durée propre : il passe par `ExecutionParameters`. Aucun changement attendu hors phases. |
| `src/domain/sessions/validation.ts:43-44, 66-67` | Déjà `EXERCISE_DURATION_MIN_SECONDS = 1` et `RECOVERY_DURATION_MIN_SECONDS = 1` (niveau Séance/stockage). Aucun changement. |
| `src/domain/activities/ExecutionParameters.ts:102-108` (`ACTIVITY_STORAGE_BOUNDS`) et `projectScalars` (l. 856-869) | Le stockage admet déjà `durationTarget 1..5999` : une cible de 1 s se projette sans violation. Pour les phases, la somme 1..3535 projetée en `duration_seconds` reste dans le CHECK. Aucun changement. |
| `src/infrastructure/database/repositories/SqliteSessionRepository.ts:1378-1400` (`satisfiesActivityCheck`) | Bornes de stockage 1..5999, aucun changement. |
| Phases (non encore présentes dans `src/` ; Δ09, Δ10, Δ14, Δ40 de `table-delta.md`) | À implémenter avec : chaque phase validée ≥ 1 s ; pas de 1 s ; somme 1..3535 s ; ✓ indisponible hors de ces bornes ; 0 s comme état temporaire retiré à la validation (D-373). Réutiliser la roue de durée existante avec des `targetBounds` adaptées, sans nouveau composant (consigne 4). |
| `src/domain/preferences/Profile.ts:118-134` (`PAUSE_GRID_VALUES`) | Grille du Profil : pas de 1 s jusqu’à 5 s, puis 5 s jusqu’à 120 s, puis 30 s jusqu’à 300 s. Non modifié ; voir l’ambiguïté A1. |

### 4.2 SQL et migrations

- Aucune contrainte SQL n’est touchée et aucune migration n’est nécessaire.
- Les CHECK existants imposent déjà `duration_seconds BETWEEN 1 AND 5999` : `migration001.ts:105, 122`, `migration003.ts:94, 117`, `migration004.ts:139, 162`, `migration010.ts:73-74, 526, 541`.
- Le minimum de 5 s n’existait qu’au niveau de la saisie (`EP:88`).
- `migration001` et les migrations existantes restent intactes.
- Les valeurs historiques de 1 à 4 s, jusqu’ici hors bornes de saisie (D-383), deviennent simplement valides.

### 4.3 Tests qui vérifient aujourd’hui le minimum de 5 s

| Fichier:ligne | Adaptation |
|---|---|
| `src/domain/activities/__tests__/ExecutionParameters.test.ts:250, 292, 333, 356, 364, 407, 425` | Cas « 4 s refusé », « valeur historique 3 s sous le minimum » et `details: { min: 5, max: 3535 }`. Passer à min 1. Les exemples hors bornes deviennent 0 (refusé) ou 3536. |
| `…/ExecutionParameters.test.ts:476-492` | `nearestGridValue` : 4 → 5, −∞/NaN/−30 → 5 deviennent 4 → 4, puis → 1. |
| `…/ExecutionParameters.test.ts:504, 531` | Ouverture « — » sur 00:05 et + depuis « — » à 5 s deviennent 00:01 et 1 s. |
| `…/ExecutionParameters.test.ts:554-559` | `stepWithinBounds(…, 5, 3535)` : arguments explicites, à aligner sur 1..3535. Optionnel, car ces tests portent sur la fonction générique. |
| `src/domain/activities/__tests__/ExecutionParametersDraft.test.ts:950, 972, 983, 1018-1019` | Valeur historique 3 s et `details: { min: 5, max: 3535 }` : passer à min 1, avec une autre valeur hors bornes. |
| `src/features/activities/__tests__/ExecutionParametersSheet.test.tsx:783, 1158-1159, 1213-1214` | « 4 s hors bornes » : choisir une autre valeur invalide (par exemple 3536 s). |
| `…/ExecutionParametersSheet.test.tsx:2839, 2853` | Ouverture « — » sur 00:05, ✓ → « 5 s » : devient 00:01 et « 1 s ». |
| `src/features/sessions/__tests__/DurationWheelPicker.test.tsx:659, 702, 792, 835, 876, 924-942, 1078-1080` | `BOUNDS = { min: 5, max: 3535 }`, secondes « 00 puis 05..59 », recalage 00:05 → 5 : à passer à min 1 (« 00 puis 01..59 », recalage 00:01). |
| `src/features/sessions/__tests__/wheelPickerMath.test.ts:222, 228, 236, 242, 273-276` | `TARGET = { min: 5, max: 3535 }` et `snapBoundedSeconds(2 ou 1, 0) → 5` : à aligner. Le cas `{ min: 5, max: 40 }` (l. 236) est générique et peut rester. |
| `src/shared/ui/__tests__/ProfileStepper.test.ts:158-166` | `steppedValue(…, 5, 3535)` : arguments explicites ; « 2 → 5 » à revoir si on aligne sur 1..3535. Optionnel. |
| `src/shared/ui/__tests__/ProfileStepper.test.tsx:392-404` | « 5 s, minimum atteint » et « 4 s hors bornes » : à vérifier selon les bornes passées au test. Probablement des bornes génériques. |

Tests à ajouter (Δ50) :

- 1 s acceptée ;
- 0 refusé pour une Durée par Série ;
- roue de cible à 0 min proposant 01..59 ;
- phases : une phase de 1 s acceptée, une somme de 0 refusée, une somme de 3536 s refusée ;
- recette iPhone : roue au minimum.

## 5. Ambiguïtés à soumettre à Hermann (non tranchées)

- **A1 — Grilles à pas de 5 s des pauses et récupérations.**
  - La grille du Profil (Pause entre les côtés et Récupération après exercice par défaut) va de 1 s en 1 s jusqu’à 5 s, puis de 5 s en 5 s jusqu’à 120 s, puis de 30 s en 30 s jusqu’à 300 s (`Profile.ts:118-134`).
  - CE Composition décrit la même grille pour la Récupération (ch. 13 l. 1496 : « grille 1 s jusqu’à 5,5 s jusqu’à 120,30 s jusqu’à 300 »).
  - Ce n’est pas un minimum, et zéro y est admis. Mais c’est un pas de 5 s, et la décision dit « Pas de réglage : 1 seconde, sans imposer de palier minimal de 5 secondes ».
  - Non modifié. À arbitrer : la grille est-elle concernée ? La refonte de Composition est hors périmètre.
- **A2 — Phases dans un format à durée imposée.**
  - Avec un minimum de 1 s par phase, un budget imposé inférieur au nombre de phases (par exemple 6 phases dans 5 s) ne peut plus être respecté.
  - De même, l’adaptation proportionnelle peut arrondir une phase sous 1 s.
  - La décision soumet ces durées aux contraintes du format, mais la règle d’arrondi reste ouverte (ch. 08, point 1, inchangé).
- **A3 — Dernière phase calculée à 0 s dans un format** (D-372 : « peut temporairement valoir zéro »).
  - Retirée à la validation (D-373) : c’est cohérent avec « zéro temporaire ».
  - Il faut confirmer que ce retrait silencieux s’applique aussi quand il rend la somme inférieure à la durée imposée.
- **A4 — « Exercice » cité dans la décision.**
  - Aucune durée d’exercice saisie directement n’a de minimum documenté de 5 s. La Durée de l’exercice est calculée, et le réglage inverse de la Durée totale choisit N.
  - Je n’ai donc rien modifié à ce titre. À confirmer qu’aucune autre durée n’est visée.
- **A5 — Maintien accéléré 1/5/10.**
  - Je l’ai interprété comme hors champ : le tap reste à 1 s, et le comportement est validé (D-313).
  - Si Hermann vise aussi ce palier, D-313 et `EXECUTION_ACCELERATED_HOLD_POLICY` (`ProfileStepper.tsx:56-60`) seraient concernés.
