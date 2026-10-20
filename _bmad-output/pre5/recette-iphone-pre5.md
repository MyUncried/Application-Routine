# PRE-5 : recette iPhone

## Séance 1 — 19/10, commit `9417aabb` (stories 1.1, 2.1 à 2.4, 2.6)

Application « Routine BMAD » (dev client), Metro en tunnel depuis le worktree `C:\Dev\KODJO-BMAD-PRE5-recette`. Constats de Hermann, retranscrits tels quels (OK = réussi).

| Point | Constat |
|---|---|
| A.1 Exercice PRE-4 relu | OK |
| B.2 Roue à 00:01, 00:00 non validable | OK |
| C.3 Quatre cadres, segmentés, chevron de Variables | OK |
| C.4 Stepper « Nombre de séries » | S'ouvre, change, se ferme au toucher d'une autre partie de l'écran ; **ne se ferme pas au toucher de la valeur elle-même (il devrait)** |
| C.5 Cellule Cible → roue | OK |
| C.5 Cellule Pause → ± sous la ligne | OK (question : est-ce le comportement demandé ? Oui : Δ34, D-413 / D-417, « stepper de Pause pour cette cellule ») |
| C.5 Poignée, glisser | Fonctionne, mais : la ligne déplacée est transparente ; après l'appui long, rien n'indique que la ligne est saisie (effet de couleur ou d'ombre attendu) ; à la dépose, la ligne doit s'insérer plus lentement, mouvement visible, et les autres lignes se déplacer plus lentement, mouvement visible |
| C.5 Croix, Annuler | OK |
| D.6 Charge Avec (variables) | 0,25 kg OK ; **le clavier s'ouvre automatiquement sur la première valeur : il doit rester fermé, aucune valeur sélectionnée** ; fond violet OK ; **KO : aucune barre Précédent / Suivant / Fermer, seulement le clavier** ; ligne active visible au-dessus du clavier OK |
| D.7 Précédent / Suivant | KO, non vérifiable (barre absente) |
| D.8 « 1,3 » → 1,5 kg | OK |
| D.9 Ligne 7 remontée au-dessus du clavier | OK |
| D.10 ✓ / ✕ absorbés | KO, non vérifiable |
| E.11 Charge Avec (identiques) | **KO : le clavier ne doit pas s'ouvrir automatiquement, seulement au toucher d'un champ Charge** ; barre absente |
| E.12 « 1,3 » → 1,5 kg | OK |
| E.13 Champ vidé → Sans | OK (fermé par un toucher ailleurs, pas par « Fermer ») |

Réponses de Hermann :
- **Sélection au focus :** oui, toute la valeur est sélectionnée quand le champ prend le focus.
- **Toucher direct :** passer d'une cellule Charge à l'autre sans fermer le clavier : OK ; changer de colonne ferme le clavier et ouvre l'autre contrôle : OK.

## Décisions de recette (font foi, appliquées partout)

- **RC-1 — Barre du clavier.** La barre Précédent / Suivant / « Fermer » doit apparaître. `InputAccessoryView` ne s'affiche pas dans la `Modal` de la Feuille : la barre est rendue par la Feuille au-dessus du clavier (position suivant la hauteur du clavier, événements `Keyboard` standards). Décision déjà prise (story 2.2 corrigée) : aucun nouvel arbitrage.
- **RC-2 — Pas d'ouverture automatique.** Passer la charge à Avec (identiques ou variables) n'ouvre pas le clavier et ne sélectionne aucune cellule. Le clavier s'ouvre seulement au toucher d'un champ Charge. Remplace « focus sur le premier champ » (story 2.2 AC5, story 2.7). [Charge commune : remplacée par RC-14 le 20/10.]
- **RC-3 — Sélection au focus.** Toute la valeur d'un champ Charge est sélectionnée quand il prend le focus. [Remplacée par D-434 dans le tableau, puis par RC-14 le 20/10 pour la charge commune.]
- **RC-4 — Stepper révélé.** Toucher la valeur d'un stepper révélé ouvert le referme (Nombre de séries ; même mécanisme pour les autres steppers révélés de la Feuille).
- **RC-5 — Glisser une ligne.** Ligne saisie opaque, avec un effet visible dès l'appui long (couleur ou ombre) ; à la dépose, insertion plus lente et visible, déplacement plus lent et visible des autres lignes. S'applique aux tableaux qui partagent ces briques (séries, puis phases en 2.8).

À rejouer après correction : D.6, D.7, D.10, E.11, C.4, C.5 (glisser).

## Corrections du 19/10 (branche `bmad/pre5-recette1`)

Appliquent RC-1 à RC-5 ; aucun constat iPhone n'est encore consigné pour elles (à rejouer : D.6, D.7, D.10, E.11, C.4, C.5 glisser).

- **RC-1** : barre Précédent / Suivant / « Fermer » rendue par la Feuille (iOS), en position absolue au bas de la zone de la `Modal`, remontée de la hauteur du clavier (`keyboardWillShow` / `keyboardWillChangeFrame` / `keyboardWillHide`), montée animée avec le clavier ; `InputAccessoryView` retiré. La révélation de la ligne active retire la hauteur mesurée de la barre (marge 12). Android et web : clavier natif seul, comme avant.
- **RC-2** : Avec (identiques et variables) ne donne plus le focus ; aucune cellule active.
- **RC-3** : toute la valeur d'un champ Charge est sélectionnée au focus.
- **RC-4** : toucher la valeur d'un stepper révélé ouvert le referme (tous les steppers révélés de la Feuille et la Pause d'une cellule ; action « activer » de VoiceOver de même).
- **RC-5** : ligne saisie opaque (`#EAEAFF`), ombre, au-dessus des autres ; à la dépose, insertion de la ligne et décalage des autres en 280 ms ; aucune animation sous « Réduire les animations ».

## Décisions de Hermann du 19/10 sur la story 2.5

- **RC-6 — Enchainement dans « Changement de côté ».** La ligne « Enchainement » n'est plus nécessaire. Seule la ligne « Changement de côté » reste ; elle porte la valeur de l'enchainement, comme dans la frame Figma `9462:18987` (notations dans l'option Avec). Remplace la ligne Enchainement de D-413 / story 2.5 AC2 ; les notations de D-431 sont inchangées.
- **RC-7 — Compte à rebours et Fin d'un Exercice ouvert depuis une Séance.** Absents de la Feuille ; les valeurs sont conservées sans être utilisées dans l'exécution. Comportement livré en 2.5 confirmé.
- **RC-8 — Segmentés centrés verticalement avec le libellé de leur ligne.** Constat de Hermann : les segmentés `inline` de « Mode », « Condition d'arrêt » et « Cadence » ne sont pas centrés verticalement avec leur libellé. Règle pour toutes les lignes à segmenté `inline` (Type de série, Charge, Changement de côté, Cadence, Phases à venir) : contrôle (32) centré sur le libellé dans la ligne (44), hauteurs inchangées ; pour la Cadence, centré sur la ligne du libellé, pas sur la ligne étendue par le ± révélé.
- **RC-9 — Aucun espace sous la dernière ligne des tableaux.** L'espace d'une hauteur de ligne sous la dernière ligne du tableau des séries variables est supprimé ; remplace cette partie de PR-02 / UX-DR3 / story 2.6 AC2. Vaut aussi pour le tableau des phases (story 2.8 AC3b).
- **RC-10 — Cadence à trois options.** Le segmenté « Cadence » n'a plus que trois options, Autre | 1 s | Sans (ordre de l'existant conservé, Sans à droite comme dans les autres segmentés), chacune de la largeur de l'option « Sans » du segmenté de la Charge (`INLINE_OPTION_WIDTHS.narrow`, 62). 2 s et 5 s ne sont plus des options : une valeur de 2 ou 5 s, comme toute valeur autre que 0 et 1, s'affiche « Autre ». Autre ouvre le ± existant 0..10, inchangé. Aucune donnée migrée. Remplace l'AC3 de la story 2.5 et le point 8 du §9 (« Sans, 1 s, 2 s, 5 s »).

## Correction RC-6 (branche `bmad/pre5-recette1`)

Aucun constat iPhone n'est encore consigné pour elle.

- Ligne « Enchainement » et chevron de repli d'Avec retirés ; Pause entre les côtés visible sous Avec.
- Option Avec de 144 (Sans 62, Figma `9462:18986`) : notation de l'Enchainement (police 10) ; nom accessible « Avec, <libellé neutre> ». Sélectionnée (N > 1), son contenu (notation + chevron) ouvre le menu natif SwiftUI `Menu` d'`@expo/ui` (déjà installé) : deux notations, la choisie cochée, noms accessibles neutres. Android et web : `Alert` native.
- À N = 1 : Avec reprend son libellé, sans menu ; Enchainement conservé (Q38).
- Écart à Figma : le déroulant dessiné (notation choisie en violet, chevron vers le haut, autre notation dessous) est rendu par le menu natif iOS, avec son propre aspect ; le chevron reste vers le bas.
- À vérifier sur iPhone : ouverture du menu au toucher de l'option Avec sélectionnée (déclencheur hébergé par `RNHostView` dans la `Modal` de la Feuille), choix appliqué, toucher extérieur sans effet, VoiceOver (« Enchainement », valeur neutre, items neutres), aspect d'Avec quand Sans est sélectionné (notation grise).

## Correction RC-8 (branche `bmad/pre5-recette1`)

Aucun constat iPhone n'est encore consigné pour elle.

- Cause : la variante `inline` du `SegmentedControl` portait `alignSelf: "flex-end"` (alignement à droite voulu) ; dans la ligne horizontale de la Feuille, cela le posait au bas de la ligne de 44, sous le centre du libellé. Remplacé par `alignSelf: "center"` ; l'alignement à droite vient de la ligne (`space-between`). Hauteurs inchangées (ligne 44, contrôle 32). Composant partagé : la règle vaut pour toutes les lignes à segmenté `inline`, Phases comprises (2.8).
- Cadence : le ± révélé par Autre est rendu sous la ligne, hors de la rangée du libellé ; le segmenté reste centré sur le libellé.
- À vérifier sur iPhone : Mode, Condition d'arrêt, Type de série, Charge, Changement de côté, Cadence (± ouvert et fermé).

## Correction RC-9 (branche `bmad/pre5-recette1`)

Aucun constat iPhone n'est encore consigné pour elle.

- L'espace venait de la brique partagée `tableStyles.block` de `sheetTable.tsx` (`paddingBottom` d'une hauteur de ligne, 36) : retiré là, donc aussi pour le futur tableau des phases (2.8). Marges du bloc inchangées (12 en haut et en bas dans le cadre).
- À vérifier sur iPhone : bas du fond blanc juste sous la dernière ligne ; glisser jusqu'à la dernière place et repère d'insertion en bas du tableau.

- **RC-11 — Changement de côté, options de même largeur.** Les options « Avec » et « Sans » du segmenté « Changement de côté » ont la même largeur : la plus petite suffisante pour que la notation choisie et son chevron tiennent dans Avec (police réduite conservée), au lieu de 144 / 62 (RC-6). **Appliquée (option 3 de Hermann, voir « Correction RC-11 ») : options de 104, libellé sur deux lignes, notation raccourcie `(D1→D2) (G1→G2)` / `(D1→G1) (D2→G2)`.** Remplacée par RC-12 (notation complète rétablie).
- **RC-12 — Changement de côté, Sans de la largeur des autres Sans.** L'option « Sans » du Changement de côté a la même largeur que les deux autres options « Sans » de la page (Charge et Phases de l'exercice : 62) ; l'option Avec s'étend de la largeur gagnée (104 + 42 = 146), largeur totale du segmenté inchangée. Le raccourcissement de RC-11 n'étant dû qu'à l'égalité des largeurs, la notation complète D-431 est rétablie. **Appliquée (voir « Correction RC-12 »).** Largeurs remplacées par RC-13.
- **RC-13 — Changement de côté (recette du 20/10, remplace RC-11 et RC-12 pour les largeurs).** Texte de Hermann : « Quand Sans est sélectionné (ou Avec non sélectionné), Avec et Sans ont la même largeur (62, comme les autres « Sans » de la page) et Avec affiche le texte « Avec », sans chevron. Quand Avec est sélectionné et qu'une valeur d'enchainement est choisie, l'option Avec affiche cette valeur (notation complète D-431 `(D1 → D2) ➜ (G1 → G2)` / `(D1 → G1) ➜ (D2 → G2)`) avec le chevron, dans une option élargie (146, valeur de RC-12) ; le menu natif reste comme RC-6. En revenant à Sans, Avec reprend le texte « Avec » sans chevron et sa largeur initiale (62). La largeur totale du segmenté varie donc (même logique que le segment Phases : 62 quand Sans, élargi quand Avec). À N = 1 : Avec sélectionné affiche « Avec » (pas de menu, Q38) ; largeur 62 dans ce cas sauf incohérence. Le titre sur deux lignes et le centrage (RC-8) sont conservés. » **Appliquée (voir « Correction RC-13 »).**
- **RC-14 — Charge commune, séries identiques (recette du 20/10).** Texte de Hermann : « Même fonctionnement que les cellules (D-434, mode `cellDecimal` : pas de poignées iOS, première frappe remplace la valeur, Retour arrière supprime le dernier caractère). Appuyer sur Avec sélectionne l'option et ouvre le clavier (focus dans l'option ; ceci remplace RC-2 pour la charge commune uniquement — en séries variables, passer à Avec n'ouvre toujours pas le clavier). À la validation de la valeur (sortie du champ : Fermer, toucher ailleurs, ✓ absorbé), elle remplace le texte « Avec » dans l'option (« 20 kg », comme 2.7) ; pas de chevron. Appuyer de nouveau sur Sans remet l'option au texte « Avec », non sélectionnée. Toucher l'option Avec déjà sélectionnée (valeur affichée) rouvre la saisie. Règles de valeur inchangées (arrondi 0,25 supérieur, zéro → Sans, 1re activation 0,25 kg, réactivation restaurée). Barre RC-1 : Précédent / Suivant indisponibles (champ unique), Fermer, pas d'« À l'échec ». Largeur de l'option Avec de la Charge : 62 si la valeur tient, sinon le strict nécessaire. » **Appliquée (voir « Correction RC-14 »).**
- **RC-15 — Contrôle segmenté Séries (recette du 20/10).** Texte de Hermann, résumé fidèle : un seul segmenté « Variables | Identiques » ; le nombre de séries est intégré au segment sélectionné ; plus de ligne « Nombre de séries » ni de second stepper. Stepper fermé : Identiques sélectionné → « 3 séries identiques » ; Variables sélectionné → « 3 séries variables » et chevron graphique à droite de la valeur, dans le segment ; le segment non sélectionné garde « Variables » ou « Identiques » ; valeur = nombre réel de séries (singulier à N = 1). Appui sur la valeur du segment sélectionné → stepper intégré « − | 3 séries | + » (Figma) ; − et + selon les bornes, pas et règles existants ; à la perte de l'état de réglage (toucher la valeur, RC-4 ; toucher ailleurs ; autre surface), − et + disparaissent et le libellé complet revient. Variables : chevron haut = tableau déployé, bas = replié ; son appui replie ou déploie sans changer nombre ni valeurs, n'ouvre pas le stepper ; le tableau suit N (ajout, retrait, conservation, annulation existants). Identiques : pas de chevron. Passage Identiques ↔ Variables : règles existantes. Rendu : segmenté de 32 au repos, 34 stepper ouvert ; sélectionné `#5F60EE`, non sélectionné `#F5F7FA`, stepper ouvert sur `#F2F2FF` ; rayon 8 ; chevron 10 × 10, tracé 8 × 4. Remplace l'arbitrage Δ38 / revue du 19/10 (« stepper Nombre de séries conservé à l'identique ») pour sa seule présentation et son intégration dans le segmenté ; règles fonctionnelles, transitions de données, bornes et accessibilité conservées. Figma (page Prototype MVP) : `9436:18101`, `9436:18305`, `9439:18307`, `9445:18410` ; modèle `9207:18817`. **Appliquée (voir « Correction RC-15 »).**
- **RC-16 — Contrôle des phases (recette du 20/10).** Texte de Hermann, résumé fidèle — contrôle « Avec / X phases » : (1) élargir l'option pour que ses marges intérieures soient cohérentes avec celles du segment « Sans » ; espace suffisant entre libellé, stepper et chevron, − et + affichés compris ; chevron placé avant le + quand le stepper est ouvert (« − X phases ⌄ + ») ; stepper actif sur fond plus clair, traitement visuel de la Charge active ; place du chevron réservée en permanence. (2) Stepper fermé : appui sur « X phases » → ouvre le stepper ; appui sur le chevron → déploie ou replie le tableau sans ouvrir le stepper ; actions indépendantes. (3) Stepper ouvert : − et + modifient le nombre (2..6) ; le chevron reste visible mais désactivé (état indisponible annoncé) ; appui sur « X phases » ou ailleurs (hors − et +) → ferme ; la fermeture ne change ni le nombre ni l'état déployé / replié. (4) Aucun chevauchement entre valeur, −, + et chevron ; zones tactiles suffisantes et distinctes ; ne pas agrandir inutilement la ligne ni dégrader « Sans » (62). (5) Calculs, durées, structure du tableau et autres contrôles inchangés. Titre de la ligne Phases : inchangé (confirmation demandée par le coordinateur). **Appliquée (voir « Correction RC-16 »).**
- **D-433 — Ligne « Durée de l'exercice » toujours affichée.** Dans tous les modes et états, à la même place : « Non calculable » quand la configuration seule exclut le calcul quelles que soient les valeurs (Répétitions sans cadence ; À l'échec en séries identiques), prioritaire sur « — » ; « — » quand des données manquent (Mode non choisi, Cible à renseigner, saisie invalide) ; sinon la valeur avec son symbole collé avant elle (« ≥ 5 min 30 s », « ≈ 5 min 30 s »), jamais dans le titre. Compte à rebours et Fin repliés sous le chevron de la ligne (absents depuis une Séance, RC-7). Formules, natures, inversion et validation inchangées ; « — » et « Non calculable » ne valent jamais zéro.

## Correction RC-10 (branche `bmad/pre5-depuis-pre4`)

Aucun constat iPhone n'est encore consigné pour elle.

- `cadenceOptionOf` : 0 → Sans, 1 → 1 s, toute autre valeur → Autre ; options Autre / 1 s / Sans de 62 (contrôle de 196) ; la largeur `cadence` (46,4) est retirée de `INLINE_OPTION_WIDTHS`. Libellés « 5 s » et « 2 s » retirés du lexique de la Cadence.
- À vérifier sur iPhone : trois options de même largeur que celles de la Charge, centrées sur le libellé (RC-8) ; un Exercice réglé à 2 s ou 5 s affiche Autre, et Autre ouvre le ± à cette valeur.

## Correction D-433 (branche `bmad/pre5-depuis-pre4`)

Aucun constat iPhone n'est encore consigné pour elle.

- Feuille : ligne « Durée de l'exercice » toujours rendue après la Cadence ; titre sans symbole ; valeur « ≈ … » / « ≥ … » / sans symbole, « Non calculable » (Mode choisi et Répétitions avec cadence Sans, ou série identique à cible À l'échec ; prime sur « — »), « — » sinon faute de données (Mode non choisi, Cible à renseigner, saisie invalide). Annonces : « Durée de l'exercice, Non calculable » ; « Durée de l'exercice, données manquantes » ; annonces existantes pour les valeurs. Compte à rebours et Fin repliés sous le chevron, absents depuis une Séance. Domaine (`executionCalculations.ts`) inchangé.
- **À arbitrer :** tableau variable entièrement à l'échec (aujourd'hui sans total, nature `omitted` dépendant des valeurs) : affiché « — », pas « Non calculable ».
- **Signalé, non modifié :** la Carte d'Exercice (`ActivityCard.tsx`, `catalogueDuration`) et la Phrase (`executionPhrase.ts`, clause « Durée totale ») omettent toujours la durée pour `omitted` et `incomplete` ; la Composition de Séance ne la masque pas.
- À vérifier sur iPhone : ligne à la même place dans chaque état (Durée, Répétitions avec et sans cadence, À l'échec, tableau variable), symbole collé à la valeur, chevron et repli.

## Correction RC-11 (branche `bmad/pre5-depuis-pre4`)

Décision de Hermann du 19/10 (option 3) : options Avec et Sans de même largeur, libellé sur deux lignes, notation raccourcie pour tenir. Aucun constat iPhone n’est encore consigné pour elle. **Remplacée par RC-12 : largeurs 146 / 62 et notation complète rétablie (voir « Correction RC-12 »).**

- Mesures (métriques d’Inter de l’application, Semi Bold 10 ; « → » est dans Inter, « ➜ » ne l’est pas) ; contenu de l’option = notation + écart 6 + chevron 10 ; segmenté = 2W + 8 ; place de la ligne 301 à 375 de large (328 à 402), moins l’écart de 8 avec le libellé ; « Changement » 72,6, « Changement de » 90,3 (Regular 12) ; il faut W ≤ 106 à 375 :
  - `(D1 → D2) ➜ (G1 → G2)` (D-431) : 96,9 hors « ➜ » + « ➜ » de repli (environ 10) ; W ≈ 124–128, écarté ;
  - `(D1 → D2) (G1 → G2)` (« ➜ » remplacé par une espace) : 96,9, W ≥ 113 ; tient à 402 (86 restants pour le libellé), pas à 375 (59 restants), écarté ;
  - `(D1→D2) (G1→G2)` / `(D1→G1) (D2→G2)` (espaces autour de « → » retirées) : 86,9 (86,2 en Regular quand Sans est choisi), contenu 102,9 ; **retenue**, parenthèses, ordre et sens conservés.
- Appliqué : `INLINE_OPTION_WIDTHS.notation` = 104 (102,9 arrondi, environ 1 pt de marge de rendu) pour Avec **et** Sans ; segmenté de 216 (au lieu de 214). Reste au libellé : 77 à 375 → « Changement » / « de côté » ; 104 à 402 → « Changement de » / « côté » (coupure naturelle de Figma). Libellé à retour automatique (Regular 12/15, deux lignes = 30), ligne de 44 inchangée, segmenté centré sur le libellé (RC-8).
- Notation raccourcie partout où elle s’affiche : option Avec, menu natif SwiftUI de RC-6 (et `Alert` Android / web), `sideOrderSubtitles` (`src/shared/i18n/index.ts`), tests. Noms accessibles inchangés (« Avec, <libellé neutre> », items neutres). `SegmentedControl` réutilisé (prop `optionWidth`), `tokens.ts` inchangé.
- Documentation : annotation de D-431 (ch. 07), passages cités des ch. 08, 10, 13 et du PRD, ligne RC-11 dans l’AC2 de la story 2.5 (`epics.md`).
- À vérifier sur iPhone : à 375 et à 402, libellé sur deux lignes sans mot coupé, notation entière sur une ligne dans Avec avec son chevron, Avec et Sans de même largeur, menu des notations raccourcies.

## Correction RC-12 (branche `bmad/pre5-depuis-pre4`)

Décision de Hermann du 19/10 : Sans de la largeur des autres Sans de la page, Avec élargi de la largeur gagnée ; notation complète rétablie. Aucun constat iPhone n’est encore consigné pour elle.

- Largeurs : Sans = `INLINE_OPTION_WIDTHS.narrow` (62, comme Sans de la Charge et des Phases de l’exercice) ; Avec = `INLINE_OPTION_WIDTHS.notation`, portée de 104 à 146 (104 + (104 − 62)) ; segmenté 3 + 146 + 2 + 62 + 3 = 216, inchangé. Avec garde 146 à N = 1 (libellé « Avec ») comme quand il porte la notation.
- Mesure (métriques d’Inter de l’application, Semi Bold 10) : `(D1 → D2) ➜ (G1 → G2)` et `(D1 → G1) ➜ (D2 → G2)` font 99,5 hors « ➜ » (absent d’Inter, rendu par une police de repli, environ 10 ; 10,0 en Segoe UI Symbol) ; avec l’écart 6 et le chevron 10, contenu d’environ 126 dans 146 (environ 20 de marge). **Notation complète D-431 rétablie** : option Avec, menu natif SwiftUI de RC-6 (et `Alert` Android / web), `sideOrderSubtitles` (`src/shared/i18n/index.ts`), tests. Noms accessibles inchangés.
- Tenue : largeur totale inchangée, donc place du libellé identique à RC-11 : 77 à 375 (≥ 72,6 de « Changement ») → « Changement » / « de côté » ; 104 à 402 → « Changement de » / « côté ». Libellé sur deux lignes, segmenté centré sur le libellé (RC-8). `tokens.ts` inchangé.
- Documentation : annotation RC-12 de D-431 (ch. 07), passages des ch. 08, 10, 13 et du PRD ramenés à la notation D-431, ligne RC-12 dans l’AC2 de la story 2.5 (`epics.md`).
- À vérifier sur iPhone : à 375 et à 402, Sans de même largeur que les Sans de la Charge et des Phases, notation complète entière sur une ligne dans Avec avec son chevron, menu des notations complètes, libellé sur deux lignes sans mot coupé.

## Correction RC-13 (branche `bmad/pre5-depuis-pre4`)

Décision de Hermann du 20/10. Aucun constat iPhone n’est encore consigné pour elle.

- Avec non sélectionné (Sans, ou Changement de côté non renseigné) : « Avec », sans chevron, de 62 (`INLINE_OPTION_WIDTHS.narrow`), comme Sans ; segmenté de 132 (3 + 62 + 2 + 62 + 3) ; nom accessible « Avec ».
- Avec sélectionné à N > 1 : notation D-431 complète et chevron, déclencheur du menu natif (RC-6), option de 146 (`INLINE_OPTION_WIDTHS.notation`) ; segmenté de 216 ; nom accessible « Avec, <libellé neutre> » inchangé. Retour à Sans : « Avec » de 62. Le cadre de sélection glisse et change de largeur avec l’option (mécanisme des largeurs propres de RC-6).
- À N = 1, Avec sélectionné : « Avec », sans menu (Q38), 62 ; aucune incohérence relevée.
- Libellé sur deux lignes conservé : la ligne réserve la place du segmenté le plus large (216, `SIDE_CONTROL_RESERVED_WIDTH`), le segmenté y est aligné à droite et centré sur le libellé (RC-8) ; sans cette réserve, le segmenté de 132 laisserait « Changement de côté » tenir sur une ligne. Choix d’intégration : un espace vide de 84 reste à gauche du segmenté réduit.
- `tokens.ts` inchangé ; `SegmentedControl` réutilisé sans changement de code (largeur propre d’option, RC-6).
- À vérifier sur iPhone : à 375 et à 402, Avec et Sans de même largeur que les Sans de la Charge et des Phases tant qu’Avec n’est pas sélectionné ; passage à Avec : option élargie, notation entière avec son chevron, menu des deux notations ; retour à Sans ; glissement du cadre de sélection ; libellé sur deux lignes dans tous les états ; N = 1.

## Correction RC-14 (branche `bmad/pre5-depuis-pre4`)

Décision de Hermann du 20/10. Aucun constat iPhone n’est encore consigné pour elle ; les tests Jest simulent le focus natif et ne prouvent ni l’ouverture réelle du clavier, ni l’absence des poignées.

- Charge commune rendue par `KeyboardField` en mode `cellDecimal` (D-434) dans l’option Avec : valeur dessinée par un `Text`, entrée native transparente hors des touchers, curseur et menu masqués, aucune sélection posée ; composition `composeCellEntry` (première frappe qui remplace, Retour arrière, un seul séparateur décimal ; un signe « - » est ignoré). Le mode natif `decimal` (sélection de toute la valeur au focus, RC-3) est retiré, devenu sans usage.
- Avec en séries identiques effectives (N = 1 compris) : `setLoadEnabled` inchangé, puis focus natif demandé à l’entrée de la charge commune après le rendu qui la monte (`useSheetKeyboard.focusField`). En séries variables : aucun focus (RC-2).
- Sortie du champ (Fermer, toucher ailleurs, ✓ ou ✕ absorbé) : application existante (`applyLoadEdit`, puis `normalizeDraftLoad` : 0,25 supérieur, zéro → Sans) ; au repos, « 20 kg » dans l’option, sans chevron. Toucher l’option sélectionnée rouvre la saisie. Sans : « Avec », non sélectionné.
- Barre RC-1 inchangée : seul champ navigable, Précédent et Suivant indisponibles ; Fermer ; « À l’échec » absent (réservé à la Cible d’une cellule).
- Largeur (à signaler) : 62 si le texte tient avec une marge de 4 de chaque côté (`loadOptionWidth`, avances d’Inter Semi Bold 12 de l’application, sans crénage) ; sinon le strict nécessaire, arrondi au point supérieur. Mesures : « 20 kg » 32,8, « 0,25 kg » 43,9, « 99,75 kg » 50,8 → 62 ; « 487,75 kg » 58,0 → 67 ; « 1234567,25 kg » → 95. Pendant la saisie, le plus large du texte au repos et du texte saisi décide (pas de rétrécissement au focus). La charge n’a pas de plafond (AD-19) : sans cet élargissement, une valeur de 5 chiffres et plus déborderait. Cible tactile portée à 44 de haut (`hitSlop` 9).
- `tokens.ts` inchangé ; aucune migration ; gardes zéro-`ScrollView` intactes.
- À vérifier sur iPhone : identiques, Sans → Avec : option sélectionnée, clavier décimal ouvert aussitôt, « 0,25 » (ou la valeur restaurée) dans l’option sur fond `#EAEAFF`, **aucune poignée ni loupe, aucun curseur**, même après un appui long ; première frappe qui remplace, Retour arrière ; Fermer, toucher ailleurs, ✓ : « 1,5 kg » dans l’option ; « 0 » puis Fermer → Sans ; toucher l’option « 20 kg » : saisie rouverte ; barre : Précédent / Suivant grisés, Fermer, pas d’« À l’échec » ; option élargie pour une grande valeur (par exemple 487,75) ; séries variables : Avec n’ouvre pas le clavier ; ouverture du clavier à N = 1.

## Correction RC-15 (branche `bmad/pre5-depuis-pre4`)

Décision de Hermann du 20/10. Aucun constat iPhone n’est encore consigné pour elle ; les tests Jest ne prouvent ni le rendu, ni les gestes, ni les largeurs réelles.

- Relevés Figma (lecture seule, 20/10) : `9436:18101` aucun segment sélectionné, 220 × 32, options 106 ; `9439:18307` « 3 séries identiques » Semi Bold 12 blanc sur `#5F60EE`, option 127 × 26 (marge 8), segmenté 241 × 32 ; `9445:18410` « 3 séries variables » + chevron 10 × 10 à 6, option 134 × 26, segmenté 248 × 32 ; `9436:18305` stepper ouvert 138 × 28 sur `#F2F2FF` (rayon 18 dessiné, soit 14 effectif sur 28 de haut), cercles blancs 28, écart 8, valeur « 3 séries » Semi Bold 13 primaire de 66 (marge 8), segmenté 252 × 34, option non sélectionnée centrée (y = 4).
- Ligne « Nombre de séries » et son `RevealStepper` retirés ; le nombre est le contenu de l’option sélectionnée du Type de série (`selectedContent`). Même brique que le nombre de phases (story 2.8) : `SegmentCountField` (fermé : libellé ; ouvert : `InlineStepper` `appearance="bare"` dans `OpenStepperField`, RC-4, focus VoiceOver) ; les Phases gardent leur rendu (valeur blanche sur le violet, segmenté de 32).
- Comportement : toucher « 3 séries identiques / variables » ou re-choisir l’option sélectionnée ouvre le stepper (surface `stepper(count)` existante) ; toucher sa valeur, toucher ailleurs ou ouvrir une autre surface le referme. Bornes 1..99, pas, maintien accéléré, `setSeriesCount` (le tableau suit N ; retrait et restauration existants) inchangés. Accessibilité : fermé, bouton « Séries, 3 séries identiques » ; ouvert, réglage ajustable « Séries », valeur « 3 séries », bornes annoncées (inchangé). Chevron de Variables : prop `chevron` existante (`control-chevron-up/down` de `KodjoIcon`), indépendant du stepper ; stepper ouvert, il reste visible, en couleur primaire (pas de violet sous lui).
- `SegmentedControl` (ajouts, défaut inchangé) : `height` (34 quand le stepper est ouvert ; options de 26 centrées) et option `ownSurface` (sélectionnée : ni cadre violet ni fond clair, le contenu dessine sa surface). Stepper ouvert : pilule `colors.stepperSurface` rayon 14, valeur avec marge 8 et à 8 des cercles. `tokens.ts` inchangé.
- À N = 1 (P16) : Variables indisponible et annoncé « Variables, sans effet pour une seule série » ; Identiques « 1 série identique » reste réglable (avant : contrôle entier atténué, de rôle texte). L’appui sur la ligne reste absorbé (T23).
- Largeurs (mesures d’Inter de l’application) : option sélectionnée au strict nécessaire — « 3 séries identiques » 126 (Figma 127), « 3 séries variables » + chevron 134, stepper ouvert 138 (+ 16 avec le chevron : 154) ; 2 chiffres : + 8 environ. Option non sélectionnée 106 (Figma), réduite seulement quand le libellé « Type de série » n’aurait plus 47 (deux lignes « Type de » / « série »), jamais sous son texte + 2 × 3. À 402 : identiques fermé, segmenté 240, libellé sur une ligne (80 pour 77,7) ; variables fermé 248, identiques ouvert 252, variables ouvert 266 : libellé sur deux lignes. À 375 : libellé sur deux lignes dans tous les états ; non sélectionnée réduite à 104 (variables fermé), 100 (identiques ouvert), 84 (variables ouvert), 75 avec deux chiffres ; segmenté de 246 au plus, libellé à 47 (« Type de » 46,6 : juste). Le libellé passe d’une à deux lignes selon l’état à 402 (ligne de 44 inchangée).
- Ligne non surlignée quand le stepper est ouvert (Figma `9436:18305` ; le surlignage `#F2F2FF` effacerait la pilule) : écart avec le surlignage des autres champs ± (PRE4-3.3/AC8).
- Écarts à Figma signalés : libellé de ligne « Type de série » conservé (Figma `9436:18101` écrit « Séries ») ; option fermée identiques 126 au lieu de 127 ; état « Variables, stepper ouvert » sans frame Figma (choix : pilule puis chevron primaire à 6) ; option non sélectionnée réduite sous 106 à 375 (et à 402 en variables à deux chiffres, stepper ouvert) pour ne pas déborder.

À jouer sur iPhone (375 et 402 si possible) :

1. Identiques, N = 3 : un seul segmenté « Variables | 3 séries identiques », 32 de haut, centré sur « Type de série » ; aucune ligne « Nombre de séries ».
2. Toucher « 3 séries identiques » : « − | 3 séries | + » dans le segment, fond `#F2F2FF`, segmenté de 34 ; + → 4 ; maintien : pas accéléré comme avant.
3. Toucher « 4 séries » : − et + disparaissent, « 4 séries identiques » revient. Rouvrir, toucher ailleurs (autre ligne, fond) : fermeture. Rouvrir, toucher la Pause : la Pause s’ouvre, le stepper se ferme.
4. − jusqu’à 1 : « 1 série identique », − indisponible ; Variables grisé et sans effet ; + depuis 1 possible.
5. Variables, N = 3 : « 3 séries variables » et chevron vers le haut, tableau déployé ; chevron → tableau replié, chevron vers le bas, nombre inchangé, stepper non ouvert ; chevron → déployé.
6. Variables : ouvrir le stepper, chevron toujours visible à droite (violet primaire) ; + → ligne 4 ajoutée ; − → dernière ligne retirée, comme avant (sans message d’annulation, T22) ; le stepper reste ouvert.
7. Passage Identiques ↔ Variables : valeurs et tableau comme avant ; le segment non sélectionné affiche « Variables » ou « Identiques ».
8. Largeurs : libellé « Type de série » jamais coupé dans un mot ni sur trois lignes, segmenté sans débordement, à 375 et 402, dans les quatre états (identiques / variables, stepper ouvert / fermé), avec 1, 9 et 10 séries ou plus ; zones tactiles de − et + et du chevron sans chevauchement gênant.
9. VoiceOver : « Séries, 3 séries identiques, bouton » ; ouvert, « Séries, 3 séries, ajustable » avec balayages haut/bas et minimum / maximum atteints ; « activer » sur la valeur referme ; chevron « Masquer le tableau des séries ».

## Correction RC-16 (branche `bmad/pre5-depuis-pre4`)

Décision de Hermann du 20/10. Aucun constat iPhone n’est encore consigné pour elle ; les tests Jest ne prouvent ni le rendu, ni les gestes, ni les zones tactiles réelles.

- Option Avec : 104 réglage fermé (marges 17 comme « Sans », libellé, écart 6, chevron), 150 réglage ouvert ; Sans 62 inchangé ; dimensions dans `ajustement-figma-phases.md` (§ RC-16).
- Chevron rendu par le contenu de l’option (plus par le segmenté), place toujours réservée ; même icône `control-chevron-up/down`, mêmes testID et nom accessible (« Masquer / Afficher le tableau des phases »).
- Fermé : toucher « n phases » (44 de haut, jusqu’au bord gauche) ouvre le réglage ; le chevron (44 de haut, jusqu’au bord droit) replie ou déploie le tableau sans ouvrir le réglage.
- Ouvert : « − | n phases | chevron | + » sur `#EAEAFF` (fond de la charge active, `TABLE_CELL_ACTIVE_BACKGROUND`), texte primaire, segmenté de 34 ; − et + règlent 2..6 (bornes, retrait annulable et ajout inchangés) ; chevron gris, indisponible (`accessibilityState.disabled`) ; le réglage restant un seul élément ajustable pour VoiceOver, l’indisponibilité est annoncée par son indice « Tableau des phases : chevron indisponible pendant le réglage ». Toucher la valeur (RC-4), le chevron ou ailleurs ferme le réglage ; nombre et état déployé / replié inchangés. Les petits espaces entre −, valeur, chevron et + absorbent l’appui sans fermer (T22 : un ± à la borne ne ferme jamais le champ).
- `InlineStepper` : props additives `accessory` (élément entre la valeur et le +) et `hint` ; défaut inchangé. `tokens.ts` inchangé ; aucun autre contrôle modifié.
- Non appliqué au contrôle Séries (RC-15) : RC-15 dit que le chevron du tableau « reste indépendant du réglage » ; le désactiver pendant le réglage le contredirait. À arbitrer par Hermann si la même règle est voulue pour les Séries.
- Titre de la ligne : « Phases de l’exercice » inchangé (confirmation de « Séries » en attente).

À jouer sur iPhone :

1. Phases Avec, 3 phases : option « 3 phases ⌃ », marges visuellement égales à celles de « Sans » ; Sans à 62.
2. Toucher « 3 phases » : « − 3 phases ⌃ + » sur fond lavande clair, texte violet, chevron grisé entre la valeur et le + ; aucun chevauchement ; « Phases de l’exercice » sur deux lignes, ligne de 44.
3. − et + : 2..6 ; − à 2 et + à 6 indisponibles ; − retire la dernière avec « Phase supprimée — Annuler ».
4. Toucher le chevron grisé : le réglage se ferme, le tableau ne bouge pas. Rouvrir, toucher « n phases » : fermeture ; rouvrir, toucher ailleurs : fermeture.
5. Réglage fermé : chevron → tableau replié (chevron bas), le réglage ne s’ouvre pas ; chevron → déployé.
6. Zones tactiles : − et + faciles à toucher sans déclencher la valeur ni le chevron ; chevron fermé facile à toucher sans ouvrir le réglage ; à 375 et à 402.
7. VoiceOver : fermé, « Nombre de phases, 3 phases, bouton » puis « Masquer le tableau des phases, bouton » ; ouvert, « Nombre de phases, 3 phases, ajustable » et l’indice du chevron indisponible.

## D-434 — saisie au clavier numérique des cellules du tableau des séries variables (branche `bmad/pre5-depuis-pre4`)

Décision de Hermann du 19/10 (D-434, ch. 07) et réponses validées le 19/10 à QD-434-1 à 4. Aucun constat iPhone n'est encore consigné pour elle ; les tests Jest ne prouvent ni le clavier, ni l'absence des poignées, ni la barre, ni la révélation réels.

Implémenté :

- Cellules Cible (mode Durée : « MM:SS » ; mode Répétitions : entier, QD-434-1), Pause (« MM:SS ») et Charge (décimal) au clavier numérique natif iOS (`number-pad` / `decimal-pad`), dans la cellule ; plus de roue de cellule (Durée ni Répétitions) ni de ± de Pause de cellule. Surfaces `selector(rowTarget)` et `stepper(rowPause)` retirées ; champs `keyboard(rowTarget | rowPause)`.
- Au repos : unités explicites sans zéros inutiles (« 5 s », « 1 min 5 s », « 1 min 30 s », « 12 min », « 0 s ») ; au focus : « MM:SS » sur quatre chiffres dans la même cellule, fond `#EAEAFF`. Chiffres décalés vers la gauche, quatre au plus, « : » inséré ; première frappe qui remplace, suivantes qui composent, Retour arrière qui supprime le dernier chiffre (vaut aussi pour la Charge d'une cellule : remplace RC-3 dans le tableau).
- Sans sélection native : la valeur est dessinée par la cellule ; le `TextInput` natif posé dessus est transparent et ne reçoit aucun toucher (le toucher de la cellule lui donne le focus), curseur masqué, menu d'édition masqué, aucune sélection posée par le code.
- Sortie de la cellule (QD-434-3, QD-434-4) : secondes > 59 reportées (`01:75` → 2 min 15 s) ; valeur hors bornes ramenée à la borne existante (Cible 1 s..58 min 55 s, Répétitions 1..100, Pause 0..5 min) ; cellule vidée → Pause 0 s, Cible « — » à renseigner (`#FFF1F0`) ; Cible à l'échec ou à renseigner : « 00:00 » (« 0 » en Répétitions) atténué au focus, la première frappe remplace ; focus puis sortie sans frappe : aucune modification.
- Barre (RC-1, rendue par la Feuille) : « À l'échec » | « ← Précédent » | « Suivant → » | « Fermer », sur une ligne. « À l'échec » seulement pour une cellule Cible : bascule cible numérique ↔ À l'échec pour cette seule série, valeur numérique mémorisée et restituée (`toggleRowFailure`, mémoire `lastNumberById`) ; annoncé sélectionné quand la cellule est à l'échec (et visuellement en Semi Bold, choix d'intégration). Précédent / Suivant : ligne par ligne, de gauche à droite (Cible, Pause, Charge), sans quitter le tableau (QD-434-2). Si les libellés complets ne tiennent pas (mesure hors écran), flèches seules « ← » / « → », libellés d'accessibilité « Précédent » / « Suivant » ; boutons de 44 × 44 au moins.
- Inchangés : roue Durée d'une série et roue Répétitions des séries identiques, Pause des séries identiques (stepper), charge commune (sélection au focus RC-3, hors tableau selon D-434 ; remplacée par RC-14 le 20/10 : même saisie que les cellules), modèle, persistance, bornes, `tokens.ts`, aucune migration ; tableau entièrement à l'échec : Durée de l'exercice « — ».
- Hors périmètre de ce lot : durées de phase (story 2.8, `KeyboardField` mode `cellDuration` prêt).

À jouer sur iPhone :

1. Séries variables, Durée : toucher une cellule Durée à 1 min 5 s → fond `#EAEAFF`, « 01:05 », clavier numérique, **aucune poignée de sélection ni loupe, aucun curseur**, même après un appui long sur la cellule. Taper 3 → « 00:03 », puis 0 → « 00:30 » ; Retour arrière → « 00:03 ». Fermer → « 30 s ».
2. Taper 1, 7, 5 → « 01:75 » ; Suivant → la cellule affiche « 2 min 15 s » et la Pause de la même ligne est active (« MM:SS »).
3. Taper 9999 → la cellule n'accepte que quatre chiffres ; sortie → « 58 min 55 s ». Taper 0 dans une Cible → « 1 s ».
4. Pause : vider par Retour arrière → « 0 s » ; taper 999 → « 5 min ».
5. Cible : vider par Retour arrière → « — » sur fond rouge pâle, ✓ indisponible.
6. Barre sur une cellule Durée : « À l'échec » à gauche de « ← Précédent | Suivant → | Fermer », sur une seule ligne, à 375 et à 402 ; libellés Précédent / Suivant ou flèches seules selon la largeur (texte agrandi compris) ; zones tactiles confortables.
7. « À l'échec » sur 45 s → la cellule affiche « 00:00 » atténué, « À l'échec » en Semi Bold, Condition d'arrêt « À la cible et à l'échec » ; de nouveau « À l'échec » → « 00:45 » ; Fermer → « 45 s ». Cellule à l'échec : taper 50 → sortie « 50 s ».
8. Sur une Pause et une Charge : « À l'échec » absent de la barre.
9. Suivant / Précédent : parcours Cible → Pause → Charge → ligne suivante, sans fermer ni rouvrir le clavier (le type de clavier change entre numérique et décimal) ; Précédent indisponible sur la première Cible, Suivant sur la dernière cellule.
10. Répétitions : cellule à 12 → « 12 », clavier numérique ; taper 150 → « 100 rép. » ; « À l'échec » → « 0 » atténué puis « à l'échec ».
11. Cellule active visible au-dessus de la barre et du clavier pour la dernière ligne d'un tableau de six séries (révélation existante).
12. Charge d'une cellule : première frappe qui remplace « 20 », sans sélection ni poignées ; charge commune (identiques) : même saisie depuis RC-14 (20/10).
13. VoiceOver : cellule annoncée « Série n, Durée », valeur au repos puis « 01:05 » ; « À l'échec » annoncé avec son état ; flèches annoncées « Précédent » / « Suivant ».
14. Tableau entièrement à l'échec : Durée de l'exercice « — ».

Risques : la composition se fonde sur le texte natif reçu (insertion en fin de texte) ; une frappe très rapide pendant la mise à jour du texte contrôlé est à éprouver (scénario 1 joué vite). Sur Android (non recetté), la barre n'est pas rendue (RC-1) : « À l'échec » de cellule n'y est pas accessible.

## Issue de l'essai du clavier (story 2.2, AC7) — 19/10

Hermann, sur iPhone, après les corrections RC-1 à RC-9 : « Le clavier fonctionne comme attendu, des changements ergonomiques pourront être demandés plus tard. » Issue **succès** : les composants sont conservés pour la story 2.7, qui est débloquée.
