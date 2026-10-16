# Tasks — révision documentaire KODJO (plan révisé, révision 2)

**État (16/10) :** révision 2 validée.
- Lot 1 exécuté et publié (`4668e215` sur `origin/docs/openspec-revision`).
- Lots 2 à 5 autorisés, en cours, avec livraison par lot.
- Lot 6 non autorisé.
- **Aucun lot n'est considéré comme validé avant le retour de la revue ChatGPT.**

**Fonctionnement autorisé par Hermann (16/10) :**
- publier les commits sur `docs/openspec-revision`, sans merge vers `main` ;
- enchaîner les lots 2 à 5 ;
- appliquer les corrections purement documentaires et les corrections fonctionnelles couvertes par une décision explicite ;
- isoler les arbitrages non résolus ;
- aucune modification des autres clones ni des sources figées PRE-4 ;
- aucun code, Figma, BMAD ni VNext ;
- aucune restructuration générale (lot 6).

**Interprétation retenue de « sources figées PRE-4 » :** le commit `caa2a5cf`, la branche `plan/pre4-vnext-20261013` et les copies `docs/preparation/PRE-4/**` (dont le dossier `sources-caa2a5cf` du clone PRE-4 BMAD). Elles ne sont pas touchées. Les chapitres de cette branche restent modifiables dans le périmètre des lots 2 à 5 ; c'est la condition pour exécuter ces lots, et le lot 1 l'a déjà fait sur le ch. 07. *Interprétation signalée pour confirmation.*

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
- [x] 0.6 Revue ChatGPT de la révision 2 : **avis favorable** (16/10), avec deux réserves de contrôle :
  - ne pas confondre restauration historique et réactivation d'une décision ;
  - vérifier les évolutions Git concurrentes avant application.
- [x] 0.7a Décision de Hermann (16/10) : **A-PRE4 AUTORISÉE pour le lot 1 uniquement.**
  - Fichier autorisé : `docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md`.
  - Toute autre modification de règle produit, tout changement de statut non prévu, toute résolution de contradiction fonctionnelle et toute intervention sur un autre clone restent interdits sans nouvel arbitrage.
- [ ] 0.7b Réponses de Hermann aux autres questions d'[arbitrages.md §2](arbitrages.md) (questions 2 à 11) : en attente

## 1. Lot 1 — Restauration et traçabilité des décisions historiques (premier lot, délimité)

**Périmètre :** un seul fichier, `docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md` `[PRE4]` `[PR370]` `[PR371]`.

**Classe :** `DOC`. Les textes restaurés existent à l'identique dans Git, et **aucun statut n'est modifié**.

**Inventaire exact :** [constats/LOT-1-registre.tsv](constats/LOT-1-registre.tsv), produit par `outils/inventaire-lot1-registre.mjs`.

- [x] 1.1 **G1 — 24 décisions vidées le 07/10** (`37e372cd`) : D-237, D-252, D-268–D-271, D-274–D-277, D-279–D-286, D-288, D-292, D-295, D-296, D-302, D-305.
  - Conserver la mention actuelle « Prescription courante : Bip v2 et D-308–313 ; … ».
  - Ajouter à sa suite « Texte d'origine : « … » », copié de `37e372cd^`.
  - Ne changer ni la colonne Statut ni la colonne Traçabilité.
  - *Justification :* ces décisions sont toujours citées (D-237 une quinzaine de fois ; D-302 et D-305 comme remplaçantes de D-208, D-209, D-217 et D-238), et leur contenu est aujourd'hui illisible sans Git.
  - *Hors tâche :* le statut de D-237 et D-252, dont l'objet (appuis, pas des steppers) n'est pas la cadence, est traité en Q-M ([arbitrages.md](arbitrages.md)).
- [x] 1.2 **G2 — D-357 à D-369 : colonnes effacées le 14/10** (`7a89220f`). Restaurer depuis `7a89220f^` les éléments suivants :
  - le repère `DEC-nn` et l'horodatage d'arbitrage en tête du texte ;
  - la colonne Statut (« Validée le 14/10/2026 par Hermann ; … ») ;
  - la colonne de trace `FMT-nn`.

  Les colonnes `FMT-nn` renvoient aux règles `RM-FMT-nn` rétablies au lot 3 : tant que le lot 3 n'est pas appliqué, elles restent des identifiants d'origine sans cible, ce qui est signalé dans le commit.
- [x] 1.3 **G3 — renvois effacés dans le texte de 8 décisions** (`7a89220f`) : D-089 (D-004/D-005), D-091 (D-081), D-209 (D-328), D-217 (D-238), D-256 (D-089), D-265 (D-256, D-252), D-350 (D-343), D-355 (D-343). Remettre la ligne de `7a89220f^` : c'est la seule différence, vérifiée par forme normalisée.
- [x] 1.4 **G3 mixtes — D-029 et D-248.** **SANS OBJET, constaté à l'application (16/10) : rien à restaurer, lignes non modifiées.**
  - Le plan prévoyait de réinsérer les renvois effacés (RM-062, D-150 ; D-314, D-311), sans toucher au remplacement légitime de l'alias de version (« v13 §7 », « Paramètres v13 ») par un renvoi au ch. 08.
  - Une comparaison mot à mot avec `7a89220f^` montre que **aucun renvoi n'a été effacé** : RM-062, D-150, D-314 et D-311 sont toujours présents. La seule différence est ce remplacement légitime.
  - Origine de l'erreur : l'outil `plan-restauration-identifiants.mjs` liste tous les identifiants des lignes qu'il ne peut pas apparier, et pas seulement ceux qui ont disparu. Voir le journal ci-dessous, anomalie A1.
- [x] 1.5 **G4 — D-334 et D-335, décisions validées perdues lors d'une fusion.** Elles sont présentes à `341f4d41` (ch. 07 l. 550 et 552), second parent de la fusion `ae50aaed` du 09/10, et absentes de `main`.
  - Les réinsérer à l'identique entre D-333 et D-336.
  - Aucune décision ultérieure ne les remplace, d'après l'analyse G (Q-M) ; ce point est à revérifier au moment de l'application.
  - Sources de la validation : `decision-modalites-import.json`, « responded_by: Hermann », et les commits `fa62fc49` et `acc07c1f` (voir [constats/arbitrages/G-gouvernance.md](constats/arbitrages/G-gouvernance.md) Q-M).
- [x] 1.6 **Hors restauration, à ne pas modifier :** D-337 et D-338, dont les renvois vers une spécification supprimée ont été remplacés par le ch. 08, ce qui est une mise à jour légitime.
- [x] 1.7 **Contrôles :**
  - le diff ne contient que des ajouts de texte d'origine et d'identifiants ;
  - `outils/comparer-registre.mjs <racine> 7a89220f^ HEAD` ne montre plus d'écart pour G2 et G3, hors D-029, D-248, D-337 et D-338 ;
  - `outils/links.mjs` est rejoué ;
  - le nombre de décisions passe de 365 à 367 (G4), sans autre ajout ni suppression.
- [ ] 1.8 **Coordination — PARTIELLEMENT RÉALISÉE.** Les PR #370 et #371 ajoutent ou modifient d'autres lignes du ch. 07 (D-370 à D-375 ; D-094, D-309). Aucune des lignes du lot 1 n'est modifiée par elles (vérifié).
  - *Fait :* fusions simulées (`git merge-tree`) du lot 1 avec #363, #370 et #371 : **0 conflit**. Après fusion : 373 décisions uniques avec #370, 367 avec #371 ; les lignes du lot 1 sont conservées.
  - *Reste ouvert :* l'ordre de fusion (question 10 d'[arbitrages.md](arbitrages.md)). Les lignes D-370 à D-375 de la PR #370 sont dans un tableau à 2 colonnes, sans Statut : à signaler à la PR, sans la modifier depuis ce change.
  - Après le lot 1, le tableau des décisions du 14/10 a de nouveau 4 colonnes ; la PR #370 ajoute le sien, distinct. Il n'y a pas de collision.
- [x] 1.9 **Préalable :** accord A-PRE4 (question 1 d'[arbitrages.md](arbitrages.md)), donné le 16/10 pour le lot 1 uniquement.

### Journal d'exécution du lot 1 (16/10/2026)

**Point de départ :** HEAD `1348415929cc6872f308da4ca4b92dda419b6e83` ; ch. 07 = blob `2b5e02efeae73e06438315d516a25fad023136f5`. Ce blob est identique à la base `6656fefc` et à la source figée PRE-4 `caa2a5cf` ; c'est aussi celui de l'inventaire.

**Vérifications préalables :**
- `main` distant toujours `6656fefc` ;
- PR #363 (`d2386c8d`), #370 (`6cf3634a`) et #371 (`2c050d0e`) inchangées ;
- aucune autre branche distante récente ne touche le ch. 07.

**Méthode :**
- application par `outils/appliquer-lot1-registre.mjs`, qui refuse de s'exécuter si le blob de départ diffère ; tous les textes sont lus dans les objets Git sources ;
- contrôle par une seconde passe indépendante, `outils/verifier-lot1-registre.mjs`, qui repart de la différence réelle et explique chaque ligne par sa source à l'octet près.

**Réalisé :**

| Groupe | Décisions | Opération | Source |
|---|---|---|---|
| G1 | 24 : D-237, D-252, D-268–D-271, D-274–D-277, D-279–D-286, D-288, D-292, D-295, D-296, D-302, D-305 | Après la prescription courante, ajout de : « Texte historique antérieur au 07/10/2026 (`37e372cd^`), restauré pour traçabilité ; il ne remplace pas la prescription courante : « … » ». Colonnes Statut et Traçabilité inchangées. | `37e372cd^` |
| G2 | 13 : D-357 à D-369, plus l'en-tête du tableau | Lignes d'origine restaurées (DEC-nn, horodatage, Statut, Portée) ; en-tête « ID \| Décision / provenance \| Statut \| Portée » restauré, sans quoi les colonnes ne s'affichent pas | `7a89220f^` |
| G3 | 8 : D-089, D-091, D-209, D-217, D-256, D-265, D-350, D-355 | Ligne d'origine restaurée ; seule différence : renvois entre parenthèses (vérifié mot à mot) | `7a89220f^` |
| G4 | 2 : D-334, D-335 | Lignes réinsérées à l'identique, directement après D-333 | `341f4d41` |

**Non modifiées :** D-029, D-248 (tâche 1.4 sans objet), D-337 et D-338 (tâche 1.6).

**Contrôles (tous réussis) :**
- seconde passe indépendante : **139 contrôles réussis, 0 échec**, dont :
  - 365 → 367 décisions, ajout de D-334 et D-335 seulement, aucun doublon ;
  - 45 décisions modifiées, toutes en G1, G2 ou G3, et identiques à leur source ;
  - aucune colonne Statut modifiée hors G2 ;
  - seules lignes hors décisions modifiées : les 2 lignes d'en-tête G2 ;
  - D-029, D-248, D-337 et D-338 inchangées ;
- diff : 47 lignes remplacées et 2 ajoutées, dans le seul ch. 07 ;
- liens : `outils/links.mjs` donne des anomalies identiques avant et après ; aucune ligne ajoutée ne contient de lien ;
- autres fichiers de `docs/`, code, `.github/` : inchangés ; clones PRE-4 et PRE-5 non touchés ; Figma et VNext non utilisés ;
- fusions simulées avec #363, #370 et #371 : 0 conflit, pas de doublon ;
- fins de ligne : copie de travail CRLF homogène ; le blob committé est en LF, comme le reste du dépôt (`core.autocrlf=true`).

**Anomalies résiduelles (signalées, non corrigées) :**
- **A1 — Erreur d'inventaire.** D-029 et D-248 étaient classées « mixtes » à tort (tâche 1.4 sans objet). L'outil `plan-restauration-identifiants.mjs` surestime les identifiants perdus pour les lignes classées À_EXAMINER : ce chiffre doit être relu avant le lot 3.
- **A2 — Mise en forme de la source G4.** Dans `341f4d41`, D-334 et D-335 étaient séparées de D-333 par des lignes vides, ce qui les sortait du tableau Markdown. Elles sont réinsérées sans ligne vide ; leur texte est inchangé.
- **A3 — Références sans cible dans les lignes restaurées.** C'est la conséquence attendue d'une restauration exacte :
Inventaire exact des lignes ajoutées :
  - 13 fois « voir preuve source de la spécification » (G2), qui renvoie à la spécification Formats supprimée ;
  - 15 identifiants `FMT-nn` (G2, colonne Portée), qui renvoient aux règles rétablies au lot 3 ;
  - des renvois de section `§4`, `§10`, `§14`, qui visent cette même spécification ;
  - 1 mention « Q-07 » (G1, D-305 : « Q-07 ouvert »), question historique de la conception Cadence.

À traiter aux lots 2 et 3. Aucun lien Markdown n'est concerné.
- **A4 — Mentions « À CLARIFIER » antérieures à D-334 et D-335.** ch. 05:199 et ch. 13:564 (caméra, sources système) n'ont pas été alignés : ce serait une modification de règle hors lot 1 (lot 5).
- **A5 — Statuts de D-237 et D-252.** La prescription courante « Bip v2 » de ces deux décisions est sans rapport avec leur objet. Le lot 1 ne l'a pas modifiée et n'a pas réactivé leur texte historique (question Q-M).

**Bloqué :** aucune tâche du lot 1.

## 2. Lot 2 — Références et liens rompus

**Classe :** `DOC`.

- [x] 2.1 **R-01** — hors PRE-4 : 26 liens vers des fichiers supprimés le 14/10, dans 17 documents de traçabilité. Les remplacer par un permalien `7a89220f^:<chemin>` (documents historiques), sans ajouter de bandeau.
- [x] 2.2 **R-02, CE-FMT** `[PRE4]` (ch. 13) : 166 liens `#ce-fmt-0x` (120 dans la matrice Formats, 46 au ch. 06). Option recommandée : 6 ancres explicites `<a id="ce-fmt-01"></a>` à `ce-fmt-06` au ch. 13. C'est le seul cas d'ancres explicites proposé (design G6) : il ne touche qu'un fichier et répare les 166 liens. Alternative sans toucher au ch. 13 : corriger les 120 liens de la matrice (hors PRE-4) et les 46 du ch. 06 `[PRE4]` `[PR363]` `[PR370]` `[PR371]`.
- [x] 2.3 **R-04** `[PRE4]` (ch. 08) : remplacer le lien circulaire vers la « spécification Formats du 14/10 » par un permalien `7a89220f^:…/SPECIFICATION-FORMATS-SEANCES-2026-10-14.md`. Ce permalien donne aussi accès à §12 (dispositions des règles antérieures) et à SRC-01 à SRC-08 (constat S-09).
- [x] 2.4 **R-05 — SANS OBJET** (faux positif : REVUE-COHERENCE-FORMATS relit la baseline `55aa3448`, où le chapitre 00 existait ; texte historique exact, non modifié ; MATRICE-FORMATS ne contient pas cette mention). Énoncé initial : « chapitre 00 » dans REVUE-COHERENCE-FORMATS et MATRICE-FORMATS → ch. 01 (hors PRE-4).
- [x] 2.5 **H-15** (hors PRE-4) : `docs/README.md` « Références actives » ne doit plus présenter DSF-CADENCE et MATRICE-CADENCE-FIGMA comme « courants » ; ces deux documents se déclarent eux-mêmes dépassés. C'est la seule correction de statut proposée (design G7).
- [x] 2.6 **Alias de documents supprimés** `[PRE4]` (« Bip v2 », « v13 », « Phrase v1 », « EC-01/02 ») : établir pour chacun la correspondance vers sa section actuelle. Exemple : EC-01…EC-10 sont définis dans `7a89220f^:…/SPECIFICATION-DEUX-MODES-ECHEC-PAR-SERIE-2026-10-13.md`. Le livrable est une **table de correspondance** ; le remplacement dans le texte vient plus tard (lot 6), car il touche de nombreuses lignes.
- [x] 2.7 Contrôle : `outils/links.mjs` → 0 fichier manquant ; 0 ancre CE-FMT manquante.

### Journal d'exécution du lot 2 (16/10/2026)

**Départ :** `4668e215` (lot 1 publié).

**Méthode :** `outils/appliquer-lot2-liens.mjs`. Chaque remplacement exige une correspondance exacte et unique ; la liste des liens morts est recalculée par l'outil, pas saisie à la main.

**Réalisé :**
- **2.1** : 26 liens, dans 15 documents de traçabilité, pointent désormais vers un permalien GitHub au commit `3623466a` (parent de `7a89220f`, état d'origine). Le texte des liens est inchangé. Les 11 permaliens répondent en HTTP 200.
- **2.2** : 6 ancres `<a id="ce-fmt-0n"></a>` ajoutées au ch. 13, **juste après** chaque titre `## CE-FMT-0n`. Une ancre placée avant le titre entrait en conflit avec la PR #370, qui insère du texte juste avant `## CE-FMT-05` (vérifié par `git merge-tree`). Ces ancres réparent 166 liens (120 dans MATRICE-FORMATS, 46 au ch. 06), sans modifier ces fichiers.
- **2.3** : ch. 08, « Source normative : la présente section, issue de la spécification Formats du 14/10 (lien : permalien GitHub vers `3623466a`) intégrée le 14/10/2026, FMT-01–38. ». La version d'origine (`7a89220f^`) pointait vers la spécification ; la consolidation l'avait fait pointer vers la section elle-même et avait effacé « FMT-01–38 ». Le libellé « source normative » désigne la section du chapitre, pas la spécification supprimée : l'autorité reste inchangée.
- **2.5** : README, point 4 des « Références actives ». Les statuts sont repris des en-têtes des documents eux-mêmes : DSF Cadence « actualisé le 13/10 par le DSF Deux modes » ; matrice du 06/10 « inventaire historique ».
- **2.6** : [correspondance-alias.md](correspondance-alias.md), avec la localisation par `outils/localiser-specifications-integrees.mjs` (détail dans `constats/R-09-localisation-specifications.tsv`). Aucun texte des chapitres n'est modifié par cette tâche.

**Contrôles :**
- `links.mjs` : 194 anomalies avant, 2 après ; ce sont deux mentions de chemins en texte brut, dans des documents historiques, conservées.
- Diff mot à mot de 2.1 : seules les cibles des liens changent.
- Fusions simulées avec #363, #370, #371 : 0 conflit.
- Aucun autre fichier modifié.

## 3. Lot 3 — Identifiants de règles, de recettes et de renvois effacés par la consolidation

**Classe :** `DOC`. Restauration à l'identique, **sans nouvelle numérotation**.

**Inventaire :** [constats/R-06-restauration-identifiants.tsv](constats/R-06-restauration-identifiants.tsv), produit par `outils/plan-restauration-identifiants.mjs`.

| Statut | Lignes |
|---|---|
| EXACT | 244 |
| AMBIGU | 6 |
| À EXAMINER | 214 |

- [x] 3.1 `[PRE4]` ch. 10 : rétablir `RM-FMT-01` à `RM-FMT-42` dans les 42 titres `### RM-`. L'appariement se fait par l'ancre `fmt-nn` qui précède chaque titre : 42 appariements vérifiés, 0 écart à `7a89220f^`.
- [x] 3.2 `[PRE4]` ch. 10 : rétablir les exclusions « (RM-FMT-20–27 et RM-FMT-33–38) » dans RM-071, RM-072, RM-075, RM-125 et RM-126. Le texte d'origine est cité dans [diagnostic.md §6](diagnostic.md).
- [x] 3.3 `[PRE4]` ch. 10 : rétablir les colonnes « Repère » (REC-01 à REC-28) et « Exigences » de la table des recettes Formats. Les 28 lignes sont présentes, avec le même texte (28/28 vérifiées).
- [x] 3.4 `[PRE4]` ch. 08 et 09 : rétablir les libellés `FMT-nn` des règles Formats (lignes EXACT de l'inventaire ; libellés vides « **.** » et « **— …** »). Les 6 lignes AMBIGU sont une même note Formats répétée (ch. 08 l. 991 et 1381 ; ch. 09 l. 203, 377, 531 et 630 ; constat S-11), qui a perdu le même identifiant `FMT-38` : la restauration est identique pour chaque occurrence. La réparation des tableaux que cette note coupe (S-11) est une autre tâche (lot 6).
### Journal d'exécution du lot 3a (16/10/2026) — identifiants de règles, de recettes et Formats

**Départ :** `a8714b29` (lot 2 publié).

**Méthode :** `outils/appliquer-lot3-identifiants.mjs --groupe=3a`, avec un critère **plus strict** que la forme normalisée de la révision 2 (correction du défaut A1). Une ligne n'est restaurée que si la ligne actuelle s'obtient à partir de la ligne d'origine (`7a89220f^`) **par suppressions seules** d'identifiants et de leur ponctuation de liaison. Aucune modification légitime n'est donc annulée. Les lignes modifiées par les PR #363, #370 et #371 sont exclues.

**Réalisé (237 lignes dans 4 chapitres) :**
- **3.1** : ch. 10, 42 titres `### RM-` → `### RM-FMT-01` à `### RM-FMT-42`, appariés par l'ancre `fmt-nn` qui précède chaque titre.
- **3.2** : ch. 10, « (RM-FMT-20–27 et RM-FMT-33–38) » rétabli dans RM-071, RM-072, RM-075, RM-125 et RM-126.
- **3.3** : ch. 10, table des recettes Formats, colonnes « Repère » (REC-01 à REC-28) et « Exigences » reprises de la spécification d'origine §11. Le texte des colonnes Situation et Attendu est inchangé (28/28).
- **3.4** : ch. 08 (40 lignes, dont les libellés vides « **.** » et « **— …** » qui retrouvent `FMT-nn`), ch. 09 (4 occurrences de la note Formats : « FMT-38 ; »), ch. 10 (41 autres lignes), ch. 13 (1 ligne).
- Inventaire ligne à ligne : [constats/LOT-3a-restaurations.tsv](constats/LOT-3a-restaurations.tsv).

**Contrôles :**
- Seconde passe indépendante, `outils/verifier-lot3-identifiants.mjs`, fondée sur une différence optimale de Myers et non sur l'alignement glouton de l'outil : **163 paires de lignes vérifiées, 0 échec**. Aucune insertion ; chaque ligne restaurée existe à `7a89220f^` ou dans la spécification d'origine ; seuls des identifiants ont été retirés.
- Nouvelle exécution du plan après application : 0 action (idempotent).
- Aucune ligne restaurée ne réintroduit de lien vers un fichier supprimé ; `links.mjs` : 2 anomalies, inchangé.
- Fusions simulées avec #363, #370, #371 : 0 conflit.

### Journal d'exécution du lot 3b (16/10/2026) — renvois D-nnn (Q-O)

**Départ :** `406fecf1`.

**Fondement :**
- question Q-O, classée recommandation documentaire : la restauration ne change aucune règle et ne fait que remettre des citations de décisions ;
- autorisation de Hermann du 16/10 pour les corrections purement documentaires ;
- commit **séparé**, pour pouvoir être annulé seul si Hermann préfère des chapitres sans renvois.

**Méthode :** `appliquer-lot3-identifiants.mjs --groupe=3b`, même critère strict de suppressions seules. Les lignes modifiées par les PR ouvertes sont exclues, dont ch. 08:1573 (PR #371).

**Réalisé :** 155 lignes dans 12 chapitres (ch. 01 : 4 ; 02 : 2 ; 03 : 6 ; 04 : 5 ; 05 : 5 ; 06 : 23 ; 08 : 29 ; 09 : 16 ; 10 : 9 ; 11 : 10 ; 12 : 17 ; 13 : 29). 43 décisions distinctes sont citées de nouveau, toutes présentes au registre. Inventaire : [constats/LOT-3b-restaurations.tsv](constats/LOT-3b-restaurations.tsv).

**Contrôles :**
- vérification indépendante (Myers) : **155/155** ;
- idempotence ;
- 0 lien mort réintroduit ;
- fusions simulées avec #363, #370, #371 : 0 conflit.

**Réserve R3b-1 :** 6 lignes citent de nouveau D-232 ou D-246, décisions « supersédées sur ces points le 02/10/2026 » :
- ch. 08 : l. 1557, 1559, 1567 ;
- ch. 09 : l. 607, 1114 ;
- ch. 13 : l. 3098.

Ces lignes citent D-232 sur des points qu'elle déclare elle-même conservés (« Bornes conservées : … répétitions 1..100 »), ou sans modifier la prescription de la ligne. Le renvoi rétablit la citation d'origine et ne réactive aucun point remplacé. La désignation du remplaçant pour les points supersédés reste ouverte (H-11).

- [x] 3.5 `[PRE4]` **Renvois D-nnn effacés dans les chapitres** (EXACT, environ 210 occurrences dans les 13 chapitres) : **soumis à Q-O**. La PR #360 annonce le retrait des « rubriques de traçabilité des contrats ». Les 244 lignes EXACT portent toutes une trace d'effacement mécanique (espace orpheline avant ponctuation, parenthèse vide, libellé vide), ce qui suggère une suppression non éditoriale. L'intention reste à confirmer.
- [ ] 3.6 **REPORTÉE au lot 6 (non autorisé).** Les 214 lignes À EXAMINER **ne sont pas restaurées automatiquement**. Elles sont examinées par fichier au lot 6 ; certaines correspondent à des suppressions annoncées par la PR #360.
- [x] 3.7 **Fait :** écart par rapport à `7a89220f^` après les lots 3a et 3b : D-nnn −142 (au lieu de −360), FMT −59 (au lieu de −162), RM-FMT −2 (au lieu de −52), REC +28 ; le reste correspond aux lignes reformulées (3.6). Énoncé initial : Contrôle : `outils/compter-identifiants.mjs <racine> 7a89220f^ HEAD` montre le retour des familles RM-FMT, FMT et REC (D-nnn selon Q-O). `git diff --word-diff` ne contient que des identifiants.

## 4. Lot 4 — Clarification de l'autorité documentaire

**Classe :** `DOC-AUTORITÉ`. Ce lot dépend de Q-A, Q-B et Q-C.

- [x] 4.1 **Fait en partie (16/10) :** `docs/INDEX.md`, section « Autorité documentaire — ce qui est décidé ». Elle regroupe sans ajout ce qui est explicitement décidé (D-255, D-300, ch. 13 « Clarification d’autorité », rang 1 des décisions explicitement supersédantes) et signale deux points non arbitrés (rang ch. 08 / ch. 13 ; borne « jusqu’à D-255 »). Aucun ordre nouveau, aucune règle modifiée. Énoncé initial : Écrire **une** formulation de l'autorité, en un seul endroit, et la citer ailleurs. Elle reprend ce qui est déjà acquis (documentation = comportements et calculs ; Figma = rendu ; décisions explicites ; DSF jusqu'au transfert) et le point tranché en Q-A.
- [ ] 4.2 **ISOLÉE — arbitrage Q-A (question 2 d’arbitrages.md)** : modifier ces passages trancherait le rang ch. 08 / ch. 13 ou la borne D-255 ; non autorisé sans décision. Énoncé initial : Aligner PRODUCT.md:434–442, ch. 13:19 et ch. 08:33 sur cette formulation, en les remplaçant par un renvoi, ou en retirer la borne « jusqu'à D-255 » selon Q-A `[PRE4]`.
- [ ] 4.3 **ISOLÉE — Q-A** : ch. 07:559 vise des « présentations », et non des décisions ; sa reformulation reste une recommandation. Énoncé initial : Ch. 07:559 (critère de récence) : reformuler conformément à design G3, selon Q-A `[PRE4]`.

## 5. Lot 5 — Contradictions fonctionnelles déjà arbitrées

**Classe :** `FONCT-ARBITRÉ`. Chaque tâche cite la décision et sa portée. **Aucune n'est exécutée avant la résolution de Q-L**, qui fixe l'ordre avec les PR #370 et #371. Le détail figure dans [arbitrages.md](arbitrages.md).

- [x] 5.1 **Fait en partie (voir le journal du lot 5).** Énoncé initial : Décisions générales déjà prises mais non reportées partout : D-209 (Tour, constats S-06, S-08, P-08), D-343 et D-355 (appui court, H-10), D-092 et la borne 1..100 (X-08), D-337 et D-251 (H-09).
- [ ] 5.2 **ISOLÉE** (portée générale des décisions PRE-4 non confirmée : question 10 d’arbitrages.md ; PRE-4 contient désormais Q1 à Q31, dont Q31 qui amende D-335). Énoncé initial : Décisions de Hermann prises pour PRE-4 (Q8, Q11 à Q26 de la préparation PRE-4 BMAD) : à reporter dans la documentation **seulement pour celles dont la portée générale est confirmée** (voir Q-L). Q11 à Q18 sont déjà portées par la PR #371, à corriger sur X-06 et X-07.
- [x] 5.3 **Q-E et Q-G appliquées** (décisions explicites D-203, RM-007/D-121 trouvées au réexamen) ; Q-F, Q-H, Q-I, Q-J et Q-K restent isolées. Énoncé initial : Hors de ce lot, en attente de décision produit : Q-E à Q-K, selon [arbitrages.md](arbitrages.md).

### Journal d'exécution du lot 5 (16/10/2026)

**Départ :** `9c24c705` (lot 4 publié).

**Règle appliquée :**
- ne sont corrigés que les passages couverts **exactement** par une décision explicite versionnée dans ce dépôt (D-xxx, RM-xxx, décision écrite dans `docs/`) ;
- les décisions PRE-4 (Q, P, H) ne sont pas utilisées ;
- les lignes modifiées par les PR ouvertes sont exclues ;
- aucun statut n'est changé si la décision remplaçante ne nomme pas la décision remplacée.

**Préparation :** dossiers en lecture seule L5A et L5B (scratchpad), revus un par un. Trois propositions des dossiers ont été **rejetées** (L5A-03, L5B-1.8 pour le ch. 02, L5B-4 ; voir « Isolé »).

**Corrections :** [constats/LOT-5-corrections.json](constats/LOT-5-corrections.json) (42 entrées, avec la décision de référence de chacune). Application par `outils/appliquer-lot5.mjs` : chaque « ancien » est unique au moment de son application, sinon arrêt sans écriture.

| Objet | Décision de référence | Passages |
|---|---|---|
| Médias pendant l'Exécution au MVP (Q-E, P-05) | D-203 « périmètre MVP confirmé le 28/09/2026 » | ch. 01, ch. 10 (RM-203) |
| Suppression d'une Séance active (Q-G, S-03) | RM-007, D-121, RM-008, RM-011 | ch. 08 §2.5 (3 phrases) |
| Recherche absente du MVP (P-04) | D-221 (« Supersède D-163 et D-168 ») | ch. 01, ch. 02 (2) |
| Répétition sans « Aucune », Jour/Semaine/Mois (S-12, P-19) | D-330 ; D-062 « Supersédée par D-330 » | ch. 01 (3) |
| Catalogue des parcours retiré (P-06) | D-328, D-324, D-167 | PRODUCT.md (3), ch. 01, ch. 06 |
| Synthèse d'Exécution directe : `Enregistrer` (S-16) | RM-101 | ch. 03 |
| Pas de Récupération en exécution directe (S-17) | D-172 révisée par D-208, RM-036 | ch. 03 |
| Tour = répétition du Circuit (S-06, P-08) | D-209 « Révise les formulations historiques où Tour désignait le conteneur » ; CIR-01 | ch. 10 (RM-025), ch. 04 (6), ch. 05, PRODUCT.md (§6 Hors MVP) |
| Compteur du Circuit (S-08) | Décision du 12/10 (ch. 08 « Le contrôle ») ; CIR-10 | ch. 10, RM-027 : **mention de remplacement ajoutée, texte d'origine conservé** |
| Appui court en sélection simple (H-10) | D-343, D-355 | ch. 10 (RM-200), ch. 08, PRODUCT.md ; statuts de D-222 et de D-228 (Catégorie seulement) |
| D-341 : valeurs validées | `docs/preparation/PRE-3/…/registre-recette1.md:189` (§9, 12/10) | ch. 07 (statut et texte) |
| Deux modes, ≥ à l'Exercice, borne 58 min 55 s (P-12) | Décision du 13/10 (« remplacent la création d’un troisième mode de D-111 et l’interdiction d’un total partiel à l’Exercice ») ; R06 close ; RM-033 ; RM-132 ; RM-234 | PRODUCT.md (5), ch. 05 |
| « référence active v12 » (H-06), 8 décisions | README:68 « v12 et v10.2 sont historiques » ; ch. 01 « La référence active est … #parametres-exercice » | ch. 07 → « référence active : chapitre 08, paramètres d’exercice » |

**Isolé (aucune correction ; décision nécessaire ou hors périmètre) :**

| Objet | Motif |
|---|---|
| Q-H (a) : ch. 08 « modifications enregistrées automatiquement » contre brouillon + `Continuer` (L5A-03) | La seule source est un contrat du ch. 13 (CE-T03-08 §15) et le ch. 06 ; aucun D-xxx ni RM-xxx. Choisir le ch. 13 reviendrait à trancher le rang ch. 08 / ch. 13 (Q-A). |
| P-03 : ch. 12 « segment Exercices désactivé au MVP » | D-166 (« entrent dans le MVP ») est supersédée par D-183, qui ne dit pas « MVP ». |
| P-04 : ch. 03 recherche dans le Suivi | D-221 ne vise que les Catalogues. |
| D-209 : ch. 02 §8 (besoins futurs : bilatéralité d'un Tour), ch. 05 V2 « plusieurs Tours », ch. 09 et ch. 05 (entité technique `Tour`, que ch. 11 dit ne pas renommer), ch. 06 « stepper Nombre de tours », statut de D-032 | Périmètre futur, nom technique, ou décision qui ne nomme pas le passage |
| Statut de D-228 pour l'Étiquette ; statut de D-251 (message en ligne) | D-355 ne nomme pas D-228 ; D-337 désigne « chapitre 08 » et non D-251 |
| D-092 « 1–99 » pour les répétitions (X-08) | Aucune source ne nomme D-092 (1..100 vient de D-232 et RM-234) |
| H-11 : ch. 08:1573 (PR #371), ch. 08:1595, ch. 13:3099 | PR concurrente, ou aucune décision ne désigne le remplaçant |
| D-309 (P-12) | Ligne modifiée par la PR #371 |
| Décisions PRE-4 (Q8, Q19–Q31, H, P) | Portée générale non confirmée (question 10) ; sources hors de ce dépôt (clone PRE-4, commit local `e0e8ce58`) |

**Contrôles :**
- 42/42 corrections : nouveaux textes présents, anciens absents.
- Fichiers modifiés : PRODUCT.md, ch. 01 à 08 et ch. 10, soit 10 fichiers et 47 lignes.
- `links.mjs` : 2 anomalies, inchangé.
- Fusions simulées avec #363, #370, #371 : 0 conflit.

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
