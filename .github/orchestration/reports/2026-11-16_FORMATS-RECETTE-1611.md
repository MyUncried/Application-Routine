# 2026-11-16 — FORMATS-RECETTE-1611 et AMRAP-REGLAGES-BLOCS-20260116

## Identifiant et objectif

- **FORMATS-RECETTE-1611** : corriger les écarts notés par Hermann à la recette iPhone du 16/11/2026 des Formats à tableau (cahier en ligne, section « fmt-tableau-1511 »). Le For time (« ftu-* ») est entièrement OK.
- **AMRAP-REGLAGES-BLOCS-20260116** (identifiant donné par Hermann) : rétablir « Nombre d'AMRAP », « Repos entre deux AMRAP » et « Repos après chaque tour de boucle » dans le cadre « Paramètres d'exécution » de l'AMRAP.

## Branche et commit de départ

- Dépôt de travail : `C:\Dev\PRE10-SON`, branche `pre11-formats` (locale, non poussée).
- Commit de départ : `57aa2f0c` (rapport FORMATS-TABLEAU-UNIQUE). Le code des missions For time et Formats à tableau n'est toujours pas commité, conformément à la consigne « Ne commite pas sans validation ».
- Sources normatives lues sur `origin/main` `69d5c267` (non fusionné) :
  - `7c2914f1`, `21a5a026`, `69d5c267` : ch07 « AMRAP — réglages conservés (16/11/2026) » et « AMRAP — plusieurs AMRAP » ;
  - ch13 CE-FMT-02 §8.

## Périmètre demandé

Notes du cahier (texte de Hermann) :

- **fmt-entree**, tous les Formats, tous les tableaux :
  - séparateurs sur toute la largeur ;
  - réordonner par appui long ;
  - focus sur la première case après le choix de l'unité.
- **fmt-entree**, Tabata :
  - durée non éditable, sans popover ;
  - charge dans la police des objectifs, sans parenthèses ;
  - charge orange quand elle est active et vide.
- **fmt-entree**, Déroulé : hauteur relative des séries en Répétitions.
- **fmt-entree**, autres Formats :
  - AMRAP : « Par tour » devient « ± / tour » ;
  - Superset : « + Ajouter » devient « Modifier », actif ;
  - À l'échec : ajouter la Durée.
- **fmt-unite-tabata** : pas de popover ; « à l'échec » sur deux lignes.
- **fmt-un-mouvement** : « Départ et incrément : trait horizontal, fond rouge ».
- **fmt-superset** : « + Ajouter doit se transformer en Modifier ».
- **fmt-amrap-reglages** : la mission AMRAP-REGLAGES-BLOCS-20260116 ci-dessus. Le reste de l'écran AMRAP est à préserver (PRESERVE).
- **Autres constats, a)** : « Il faut pouvoir rouvrir le questionnaire d'un format par glisser gauche, comme pour un circuit. »

## Périmètre réellement traité

Tout, sauf le constat a). Ce constat demande une décision : il modifie une donnée enregistrée, ce qui n'est pas un simple correctif. Voir « Non corrigé ».

## Contrôle des acquis (PRESERVE / CHANGE / FORBIDDEN)

### PRESERVE

- Rendu et comportement du For time, sauf le trait de séparation (demandé pour « tous les tableaux ») et l'appui long.
- Popover d'unité natif (`Menu` SwiftUI) pour toutes les unités au choix.
- Colonnes à dimensions et colonnes de séries.
- Déroulé de l'AMRAP et du For time.
- Le reste de l'écran AMRAP.

### CHANGE

- `ForTimeBlocks.tsx` :
  - trait de séparation ;
  - geste d'appui long ;
  - unité fixe ;
  - libellé du lien d'en-tête ;
  - texte sur deux lignes.
- `FormatModelScreen.tsx` :
  - lignes AMRAP ;
  - focus après le choix de l'unité ;
  - case de charge ;
  - unités de l'À l'échec ;
  - « Modifier » du Superset ;
  - Death by ;
  - réordonnancement.
- `formatTimeline.ts` : hauteurs du Déroulé.
- `formatReedit.ts` : Death by à un mouvement.
- `fr.ts` : trois libellés.
- Tests ciblés.

### FORBIDDEN, respecté

- Aucune nouvelle primitive : geste natif `react-native-gesture-handler`, celui des anciennes cartes ; popover natif conservé.
- Aucune fusion de `main`.
- Aucun commit de code.

## Constats et modifications

1. **Séparateurs.**
   - Cause : le trait de la ligne du nom était dessiné sous la ligne glissable, dont le fond opaque le masquait. Seul le côté des valeurs était visible.
   - Correction : le trait est posé au-dessus (`format-line-N-separator`), For time compris.
2. **Appui long.**
   - `useRowDrag` reprend le geste des anciennes cartes : `Pan` activé après 500 ms d'appui. La ligne portée suit le doigt, les lignes franchies se décalent de 48.
   - Le déplacement reste à l'intérieur du bloc.
   - Branché pour tous les Formats et le For time (`onReorder`).
3. **Focus après le choix de l'unité.** Après le rendu, le clavier s'ouvre sur la première case de la ligne. Pour un Death by à un mouvement, c'est le Départ.
4. **Tabata et 30/30.** L'unité « durée » s'affiche en texte gris, sans popover (`RowKit.fixedUnit`).
5. **Charge (colonnes à dimensions).**
   - Case `TableCell` dans la police des objectifs, « 12 kg » sans parenthèses.
   - `pending` (orange, « à vérifier ») tant qu'elle est vide.
6. **Déroulé.**
   - Les blocs en Répétitions sont proportionnels au plus grand volume de tout le Déroulé : Renforcement (objectif propre à chaque mouvement), Progression, EMOM, Superset.
   - Durée et « à renseigner » sont inchangés.
   - AMRAP et For time sont inchangés.
7. **AMRAP.**
   - Le titre de colonne devient « ± / tour » ; VoiceOver lit toujours « Par tour ».
   - Cadre des paramètres :
     - Durée ;
     - Nombre d'AMRAP ;
     - Repos entre deux AMRAP, si le nombre d'AMRAP dépasse 1 ;
     - Repos après chaque tour de boucle.
   - Les valeurs initiales existantes sont reprises : 1, 2′00″ et 0″.
   - Construction du Circuit inchangée (plusieurs AMRAP avec un seul mouvement : Circuit).
8. **Superset.**
   - Dès deux mouvements, le lien affiche « Modifier », actif.
   - Le mode catalogue s'ouvre avec les deux mouvements cochés.
   - « Valider la sélection » garde les mouvements conservés avec leurs valeurs, retire les décochés et ajoute les nouveaux.
9. **À l'échec.**
   - Unités Répétitions ou Durée (le domaine les gérait déjà).
   - « à l'échec » s'affiche sur deux lignes.
10. **Death by à un mouvement.**
    - Cause non reproduite en test : le Départ affiche « 1 » à l'ajout.
    - Deux causes possibles corrigées :
      - à la réouverture, Départ et Incrément enregistrés n'étaient pas relus ; les valeurs initiales 1 / + 1 les remplaçaient ;
      - quand on retire un mouvement sur deux, Départ et Incrément du mouvement restant deviennent les réglages communs.
    - L'affichage reprend les valeurs du mouvement à défaut de réglage commun.
    - Après un changement d'unité, les cases restent à renseigner : c'est la règle du 05/11, §13.
11. **Unité à choisir.** Validée à la recette (fmt-unite-rouge OK) ; les annotations sont mises à jour.

## Synchronisation documentaire

- **Classe A** :
  - réglages AMRAP (ch07 et CE-FMT-02 §8 sur `main`) ;
  - charge « 12 kg » (CE-FMT-02 §8 l'écrivait déjà).
- **Classe B** : les autres demandes de la recette.
  - Les sources normatives sont sur `main`. J'ai préparé un correctif, **non appliqué** : `_bmad-output/pre11/integration-documentaire-main-2026-11-16.patch`.
  - Il ajoute l'entrée ch07 « Formats à tableau — recette iPhone du 16/11/2026 » et met à jour CE-FMT-02 §8, avec annotations « Remplacé le 16/11/2026 ».
  - `git apply --cached --check` est conforme sur un index temporaire construit sur `origin/main` `69d5c267`.
- Spec du lot `_bmad-output/pre11/spec-pre11-formats.md` :
  - point 22 du §5, avec le texte de Hermann recopié ;
  - §7 : (a), (b) et (e) tranchés ; nouveaux points (h) à (m).

## Preuves et tests

- `npx tsc --noEmit` : aucune erreur.
- `npx eslint` sur les fichiers touchés : aucune erreur. Un avertissement existait déjà (`openGeneric`, `formatTimeline.ts`, présent dans `HEAD`).
- `npx jest` (suite complète) : 365 suites, 5 851 tests réussis, 32 ignorés (annotés, déjà ignorés), 0 échec.
- `FormatModelScreen.tableauUnique.test.tsx` : 38/38.
  - Nouveaux tests : AMRAP (réglages et Circuit de 3 tours), Superset « Modifier », À l'échec, séparateur, appui long (Tabata, EMOM, geste annulé), Death by (retrait d'un mouvement).
  - Tests mis à jour : « ± / tour », « 12 kg » et case orange, Tabata sans popover.
- `formatTimeline.recette1611.test.ts` (nouveau) : 4/4.
  - Hauteurs du Déroulé : EMOM, Progression, Renforcement.
  - Réouverture d'un Death by à un mouvement.
- Aucun contrôle visuel automatisé.

## Hypothèses non démontrées

- La cause exacte du « trait horizontal, fond rouge » du Death by n'est pas démontrée (voir point 10).
- La mesure du geste (une ligne = 48) suppose des lignes de 48 sans charge dessous, ce qui correspond au cas de la ligne de mouvement.
- L'ouverture effective du clavier après le choix d'unité n'est pas vérifiable sous Jest.

## Non corrigé ou hors périmètre

- **Constat a)** : rouvrir par glisser gauche un Format qui a produit un Exercice seul (un mouvement, sans Circuit). L'Exercice ne garde pas son Modèle d'origine (`originModel` n'existe que sur le Circuit). Il faut choisir entre deux voies :
  - garder le Modèle sur l'Exercice, ce qui change une donnée enregistrée et demande une migration ;
  - toujours créer un Circuit, ce qui contredit « Exercice posé seul ».
  Les Circuits issus d'un Format ont déjà l'option « Modifier le format ».
- **Plusieurs AMRAP** : Déroulé « Bloc 1 … Bloc n » (décision `69d5c267`) non réalisé, la mission AMRAP étant limitée au cadre des paramètres.
- **Libellé** « Valider la sélection » (Superset) : choix de ma part.

## Vérifications restant à faire sur l'iPhone

Cahier en ligne, section « fmt-recette-1611 » (13 lignes `r16-*`), version 118 : https://claude.ai/artifact/Mp9Tu1rPiRdfebmKfpf8Tq

## Fichiers modifiés (mission)

- `src/features/sessions/ForTimeBlocks.tsx` (non suivi : créé par la mission For time)
- `src/features/sessions/FormatModelScreen.tsx`
- `src/domain/sessions/formatTimeline.ts`
- `src/domain/sessions/formatReedit.ts`
- `src/domain/sessions/formatModels.ts` (annotation)
- `src/shared/i18n/resources/fr.ts`
- `src/features/sessions/__tests__/FormatModelScreen.tableauUnique.test.tsx`
- `src/domain/sessions/__tests__/formatTimeline.recette1611.test.ts` (nouveau)
- `_bmad-output/pre11/spec-pre11-formats.md`
- `_bmad-output/pre11/integration-documentaire-main-2026-11-16.patch` (nouveau)
- Ce rapport.

## Commit final et état Git

- Commit de ce rapport : voir le message de clôture. Il ne contient que ce rapport.
- Code : non commité, en attente de validation par Hermann. Il est mêlé au code des missions For time et Formats à tableau, déjà non commité.
- Branche `pre11-formats`, locale, non poussée.
