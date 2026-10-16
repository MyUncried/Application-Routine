# Tasks — révision documentaire KODJO (plan révisé, révision 2)

**État :** proposition. **Aucune tâche des lots 1 à 6 n'est exécutée.** `/opsx:apply` ne sera lancé qu'après la revue ChatGPT de cette révision et l'accord de Hermann sur le lot concerné.

**Base d'analyse conservée :** `main` `6656fefc58330955f5ad74d513ce616ea51809b0`, inchangé au 16/10, revérifié par `git ls-remote`. Les évolutions postérieures sont consignées dans [diagnostic.md §7](diagnostic.md) sans être intégrées.

**Légende :**
- Classes (design G10) : `DOC`, `DOC-AUTORITÉ`, `FONCT-ARBITRÉ`, `FONCT-À-ARBITRER`.
- `[PRE4]` : fichier figé par PRE-4 (`caa2a5cf`). Toute modification exige l'accord explicite **A-PRE4** (voir [arbitrages.md](arbitrages.md)).
- `[PR370]`, `[PR371]` : fichier également modifié par la PR ouverte indiquée.

## 0. Préparation

- [x] 0.1 Clone, branche `docs/openspec-revision`, OpenSpec 1.14.2, séparation des instructions
- [x] 0.2 Passe 1, cohérence : analyse terminée, synthèse produite ([diagnostic.md](diagnostic.md))
- [x] 0.3 Passe 2, qualité : analyse terminée, synthèse produite ([qualite.md](qualite.md))
- [x] 0.4 Revue ChatGPT des deux diagnostics : orientation retenue, plan à réviser (16/10)
- [x] 0.5 Révision 2 : gouvernance ajustée ([design.md](design.md)), arbitrages réexaminés ([arbitrages.md](arbitrages.md)), dépendances contrôlées, constats R-06 et R-07
- [ ] 0.6 Revue ChatGPT de la révision 2
- [ ] 0.7 Accord de Hermann : A-PRE4 pour le lot 1, et réponses aux arbitrages restants

## 1. Lot 1 — Restauration et traçabilité des décisions historiques (premier lot, délimité)

**Périmètre :** un seul fichier, `docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md` `[PRE4]` `[PR370]` `[PR371]`.

**Classe :** `DOC`. Les textes restaurés existent à l'identique dans Git, et **aucun statut n'est modifié**.

**Inventaire exact :** [constats/LOT-1-registre.tsv](constats/LOT-1-registre.tsv), produit par `outils/inventaire-lot1-registre.mjs`.

- [ ] 1.1 **G1 — 24 décisions vidées le 07/10** (`37e372cd`) : D-237, D-252, D-268–D-271, D-274–D-277, D-279–D-286, D-288, D-292, D-295, D-296, D-302, D-305.
  - Conserver la mention actuelle « Prescription courante : Bip v2 et D-308–313 ; … ».
  - Ajouter à sa suite « Texte d'origine : « … » », copié de `37e372cd^`.
  - Ne changer ni la colonne Statut ni la colonne Traçabilité.
  - *Justification :* ces décisions sont toujours citées (D-237 une quinzaine de fois ; D-302 et D-305 comme remplaçantes de D-208, D-209, D-217 et D-238), et leur contenu est aujourd'hui illisible sans Git.
  - *Hors tâche :* le statut de D-237 et D-252, dont l'objet (appuis, pas des steppers) n'est pas la cadence, est traité en Q-M ([arbitrages.md](arbitrages.md)).
- [ ] 1.2 **G2 — D-357 à D-369 : colonnes effacées le 14/10** (`7a89220f`). Restaurer depuis `7a89220f^` les éléments suivants :
  - le repère `DEC-nn` et l'horodatage d'arbitrage en tête du texte ;
  - la colonne Statut (« Validée le 14/10/2026 par Hermann ; … ») ;
  - la colonne de trace `FMT-nn`.

  Les colonnes `FMT-nn` renvoient aux règles `RM-FMT-nn` rétablies au lot 3 : tant que le lot 3 n'est pas appliqué, elles restent des identifiants d'origine sans cible, ce qui est signalé dans le commit.
- [ ] 1.3 **G3 — renvois effacés dans le texte de 8 décisions** (`7a89220f`) : D-089 (D-004/D-005), D-091 (D-081), D-209 (D-328), D-217 (D-238), D-256 (D-089), D-265 (D-256, D-252), D-350 (D-343), D-355 (D-343). Remettre la ligne de `7a89220f^` : c'est la seule différence, vérifiée par forme normalisée.
- [ ] 1.4 **G3 mixtes — D-029 et D-248.** La consolidation y a remplacé un alias de version (« v13 §7 », « Paramètres v13 ») par un renvoi au ch. 08, ce qui est légitime, **et** a effacé des renvois (RM-062, D-150 ; D-314, D-311). Réinsérer seulement les renvois effacés, sans toucher à la nouvelle formulation.
- [ ] 1.5 **G4 — D-334 et D-335, décisions validées perdues lors d'une fusion.** Elles sont présentes à `341f4d41` (ch. 07 l. 550 et 552), second parent de la fusion `ae50aaed` du 09/10, et absentes de `main`.
  - Les réinsérer à l'identique entre D-333 et D-336.
  - Aucune décision ultérieure ne les remplace, d'après l'analyse G (Q-M) ; ce point est à revérifier au moment de l'application.
  - Sources de la validation : `decision-modalites-import.json`, « responded_by: Hermann », et les commits `fa62fc49` et `acc07c1f` (voir [constats/arbitrages/G-gouvernance.md](constats/arbitrages/G-gouvernance.md) Q-M).
- [ ] 1.6 **Hors restauration, à ne pas modifier :** D-337 et D-338, dont les renvois vers une spécification supprimée ont été remplacés par le ch. 08, ce qui est une mise à jour légitime.
- [ ] 1.7 **Contrôles :**
  - le diff ne contient que des ajouts de texte d'origine et d'identifiants ;
  - `outils/comparer-registre.mjs <racine> 7a89220f^ HEAD` ne montre plus d'écart pour G2 et G3, hors D-029, D-248, D-337 et D-338 ;
  - `outils/links.mjs` est rejoué ;
  - le nombre de décisions passe de 365 à 367 (G4), sans autre ajout ni suppression.
- [ ] 1.8 **Coordination :** les PR #370 et #371 ajoutent ou modifient d'autres lignes du ch. 07 (D-370 à D-375 ; D-094, D-309). Aucune des lignes du lot 1 n'est modifiée par elles (vérifié). L'ordre d'application est soumis à la question 10 d'[arbitrages.md](arbitrages.md). Les nouvelles lignes D-370 à D-375 de la PR #370 n'ont pas de colonne Statut, comme les lignes tronquées en G2 : à signaler à la PR, sans la modifier depuis ce change.
- [ ] 1.9 **Préalable :** accord A-PRE4 (question 1 d'[arbitrages.md](arbitrages.md)).

## 2. Lot 2 — Références et liens rompus

**Classe :** `DOC`.

- [ ] 2.1 **R-01** — hors PRE-4 : 26 liens vers des fichiers supprimés le 14/10, dans 17 documents de traçabilité. Les remplacer par un permalien `7a89220f^:<chemin>` (documents historiques), sans ajouter de bandeau.
- [ ] 2.2 **R-02, CE-FMT** `[PRE4]` (ch. 13) : 166 liens `#ce-fmt-0x` (120 dans la matrice Formats, 46 au ch. 06). Option recommandée : 6 ancres explicites `<a id="ce-fmt-01"></a>` à `ce-fmt-06` au ch. 13. C'est le seul cas d'ancres explicites proposé (design G6) : il ne touche qu'un fichier et répare les 166 liens. Alternative sans toucher au ch. 13 : corriger les 120 liens de la matrice (hors PRE-4) et les 46 du ch. 06 `[PRE4]` `[PR363]` `[PR370]` `[PR371]`.
- [ ] 2.3 **R-04** `[PRE4]` (ch. 08) : remplacer le lien circulaire vers la « spécification Formats du 14/10 » par un permalien `7a89220f^:…/SPECIFICATION-FORMATS-SEANCES-2026-10-14.md`. Ce permalien donne aussi accès à §12 (dispositions des règles antérieures) et à SRC-01 à SRC-08 (constat S-09).
- [ ] 2.4 **R-05** : « chapitre 00 » dans REVUE-COHERENCE-FORMATS et MATRICE-FORMATS → ch. 01 (hors PRE-4).
- [ ] 2.5 **H-15** (hors PRE-4) : `docs/README.md` « Références actives » ne doit plus présenter DSF-CADENCE et MATRICE-CADENCE-FIGMA comme « courants » ; ces deux documents se déclarent eux-mêmes dépassés. C'est la seule correction de statut proposée (design G7).
- [ ] 2.6 **Alias de documents supprimés** `[PRE4]` (« Bip v2 », « v13 », « Phrase v1 », « EC-01/02 ») : établir pour chacun la correspondance vers sa section actuelle. Exemple : EC-01…EC-10 sont définis dans `7a89220f^:…/SPECIFICATION-DEUX-MODES-ECHEC-PAR-SERIE-2026-10-13.md`. Le livrable est une **table de correspondance** ; le remplacement dans le texte vient plus tard (lot 6), car il touche de nombreuses lignes.
- [ ] 2.7 Contrôle : `outils/links.mjs` → 0 fichier manquant ; 0 ancre CE-FMT manquante.

## 3. Lot 3 — Identifiants de règles, de recettes et de renvois effacés par la consolidation

**Classe :** `DOC`. Restauration à l'identique, **sans nouvelle numérotation**.

**Inventaire :** [constats/R-06-restauration-identifiants.tsv](constats/R-06-restauration-identifiants.tsv), produit par `outils/plan-restauration-identifiants.mjs`.

| Statut | Lignes |
|---|---|
| EXACT | 244 |
| AMBIGU | 6 |
| À EXAMINER | 214 |

- [ ] 3.1 `[PRE4]` ch. 10 : rétablir `RM-FMT-01` à `RM-FMT-42` dans les 42 titres `### RM-`. L'appariement se fait par l'ancre `fmt-nn` qui précède chaque titre : 42 appariements vérifiés, 0 écart à `7a89220f^`.
- [ ] 3.2 `[PRE4]` ch. 10 : rétablir les exclusions « (RM-FMT-20–27 et RM-FMT-33–38) » dans RM-071, RM-072, RM-075, RM-125 et RM-126. Le texte d'origine est cité dans [diagnostic.md §6](diagnostic.md).
- [ ] 3.3 `[PRE4]` ch. 10 : rétablir les colonnes « Repère » (REC-01 à REC-28) et « Exigences » de la table des recettes Formats. Les 28 lignes sont présentes, avec le même texte (28/28 vérifiées).
- [ ] 3.4 `[PRE4]` ch. 08 et 09 : rétablir les libellés `FMT-nn` des règles Formats (lignes EXACT de l'inventaire ; libellés vides « **.** » et « **— …** »). Les 6 lignes AMBIGU sont une même note Formats répétée (ch. 08 l. 991 et 1381 ; ch. 09 l. 203, 377, 531 et 630 ; constat S-11), qui a perdu le même identifiant `FMT-38` : la restauration est identique pour chaque occurrence. La réparation des tableaux que cette note coupe (S-11) est une autre tâche (lot 6).
- [ ] 3.5 `[PRE4]` **Renvois D-nnn effacés dans les chapitres** (EXACT, environ 210 occurrences dans les 13 chapitres) : **soumis à Q-O**. La PR #360 annonce le retrait des « rubriques de traçabilité des contrats ». Les 244 lignes EXACT portent toutes une trace d'effacement mécanique (espace orpheline avant ponctuation, parenthèse vide, libellé vide), ce qui suggère une suppression non éditoriale. L'intention reste à confirmer.
- [ ] 3.6 Les 214 lignes À EXAMINER **ne sont pas restaurées automatiquement**. Elles sont examinées par fichier au lot 6 ; certaines correspondent à des suppressions annoncées par la PR #360.
- [ ] 3.7 Contrôle : `outils/compter-identifiants.mjs <racine> 7a89220f^ HEAD` montre le retour des familles RM-FMT, FMT et REC (D-nnn selon Q-O). `git diff --word-diff` ne contient que des identifiants.

## 4. Lot 4 — Clarification de l'autorité documentaire

**Classe :** `DOC-AUTORITÉ`. Ce lot dépend de Q-A, Q-B et Q-C.

- [ ] 4.1 Écrire **une** formulation de l'autorité, en un seul endroit, et la citer ailleurs. Elle reprend ce qui est déjà acquis (documentation = comportements et calculs ; Figma = rendu ; décisions explicites ; DSF jusqu'au transfert) et le point tranché en Q-A.
- [ ] 4.2 Aligner PRODUCT.md:434–442, ch. 13:19 et ch. 08:33 sur cette formulation, en les remplaçant par un renvoi, ou en retirer la borne « jusqu'à D-255 » selon Q-A `[PRE4]`.
- [ ] 4.3 Ch. 07:559 (critère de récence) : reformuler conformément à design G3, selon Q-A `[PRE4]`.

## 5. Lot 5 — Contradictions fonctionnelles déjà arbitrées

**Classe :** `FONCT-ARBITRÉ`. Chaque tâche cite la décision et sa portée. **Aucune n'est exécutée avant la résolution de Q-L**, qui fixe l'ordre avec les PR #370 et #371. Le détail figure dans [arbitrages.md](arbitrages.md).

- [ ] 5.1 Décisions générales déjà prises mais non reportées partout : D-209 (Tour, constats S-06, S-08, P-08), D-343 et D-355 (appui court, H-10), D-092 et la borne 1..100 (X-08), D-337 et D-251 (H-09).
- [ ] 5.2 Décisions de Hermann prises pour PRE-4 (Q8, Q11 à Q26 de la préparation PRE-4 BMAD) : à reporter dans la documentation **seulement pour celles dont la portée générale est confirmée** (voir Q-L). Q11 à Q18 sont déjà portées par la PR #371, à corriger sur X-06 et X-07.
- [ ] 5.3 Hors de ce lot, en attente de décision produit : Q-E à Q-K, selon [arbitrages.md](arbitrages.md).

## 6. Lot 6 — Amélioration progressive de la qualité des exigences

**Classe :** `DOC` ou `FONCT-*` selon la tâche. Les tâches sont réalisées au fil des révisions, **sans refonte ni nouvelle obligation générale**. Elles reprennent les recommandations de [qualite.md §6](qualite.md) comme propositions.

- [ ] 6.1 Examiner les 214 lignes À EXAMINER du lot 3
- [ ] 6.2 Réécrire en place les compléments datés lorsqu'une révision touche la rubrique (P-21, P-22)
- [ ] 6.3 Copies multiples (P-13, P-14, H-19, QS-10) : citer au lieu de recopier, règle par règle ; corriger ch. 08 l. 1584–1587 (QS-10, trois règles au même texte) **après décision** sur la règle d'inversion à y citer (FONCT)
- [ ] 6.4 Remplacer les alias de version par des renvois (table 2.6)
- [ ] 6.5 Proposer, sans l'imposer, une convention d'obligation et un format des oracles de recette (QF) ; à valider par Hermann
- [ ] 6.6 Exigences non fonctionnelles et interruptions système (QC) : décisions produit nécessaires avant rédaction

## Ce qui n'est pas proposé

- Renumérotation générale.
- Refonte ou fusion de chapitres.
- Bandeaux de statut systématiques.
- Ancres explicites généralisées.
- Migration vers `openspec/specs/`.
- Toute nouvelle règle bloquante.
