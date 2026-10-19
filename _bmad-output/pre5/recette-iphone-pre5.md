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
- **RC-2 — Pas d'ouverture automatique.** Passer la charge à Avec (identiques ou variables) n'ouvre pas le clavier et ne sélectionne aucune cellule. Le clavier s'ouvre seulement au toucher d'un champ Charge. Remplace « focus sur le premier champ » (story 2.2 AC5, story 2.7).
- **RC-3 — Sélection au focus.** Toute la valeur d'un champ Charge est sélectionnée quand il prend le focus.
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

- **RC-11 — Changement de côté, options de même largeur.** Les options « Avec » et « Sans » du segmenté « Changement de côté » ont la même largeur : la plus petite suffisante pour que la notation choisie et son chevron tiennent dans Avec (police réduite conservée), au lieu de 144 / 62 (RC-6). **Appliquée (option 3 de Hermann, voir « Correction RC-11 ») : options de 104, libellé sur deux lignes, notation raccourcie `(D1→D2) (G1→G2)` / `(D1→G1) (D2→G2)`.**
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

Décision de Hermann du 19/10 (option 3) : options Avec et Sans de même largeur, libellé sur deux lignes, notation raccourcie pour tenir. Aucun constat iPhone n’est encore consigné pour elle.

- Mesures (métriques d’Inter de l’application, Semi Bold 10 ; « → » est dans Inter, « ➜ » ne l’est pas) ; contenu de l’option = notation + écart 6 + chevron 10 ; segmenté = 2W + 8 ; place de la ligne 301 à 375 de large (328 à 402), moins l’écart de 8 avec le libellé ; « Changement » 72,6, « Changement de » 90,3 (Regular 12) ; il faut W ≤ 106 à 375 :
  - `(D1 → D2) ➜ (G1 → G2)` (D-431) : 96,9 hors « ➜ » + « ➜ » de repli (environ 10) ; W ≈ 124–128, écarté ;
  - `(D1 → D2) (G1 → G2)` (« ➜ » remplacé par une espace) : 96,9, W ≥ 113 ; tient à 402 (86 restants pour le libellé), pas à 375 (59 restants), écarté ;
  - `(D1→D2) (G1→G2)` / `(D1→G1) (D2→G2)` (espaces autour de « → » retirées) : 86,9 (86,2 en Regular quand Sans est choisi), contenu 102,9 ; **retenue**, parenthèses, ordre et sens conservés.
- Appliqué : `INLINE_OPTION_WIDTHS.notation` = 104 (102,9 arrondi, environ 1 pt de marge de rendu) pour Avec **et** Sans ; segmenté de 216 (au lieu de 214). Reste au libellé : 77 à 375 → « Changement » / « de côté » ; 104 à 402 → « Changement de » / « côté » (coupure naturelle de Figma). Libellé à retour automatique (Regular 12/15, deux lignes = 30), ligne de 44 inchangée, segmenté centré sur le libellé (RC-8).
- Notation raccourcie partout où elle s’affiche : option Avec, menu natif SwiftUI de RC-6 (et `Alert` Android / web), `sideOrderSubtitles` (`src/shared/i18n/index.ts`), tests. Noms accessibles inchangés (« Avec, <libellé neutre> », items neutres). `SegmentedControl` réutilisé (prop `optionWidth`), `tokens.ts` inchangé.
- Documentation : annotation de D-431 (ch. 07), passages cités des ch. 08, 10, 13 et du PRD, ligne RC-11 dans l’AC2 de la story 2.5 (`epics.md`).
- À vérifier sur iPhone : à 375 et à 402, libellé sur deux lignes sans mot coupé, notation entière sur une ligne dans Avec avec son chevron, Avec et Sans de même largeur, menu des notations raccourcies.

## D-434 — saisie au clavier numérique des cellules du tableau des séries variables (branche `bmad/pre5-depuis-pre4`)

Décision de Hermann du 19/10 (D-434, ch. 07) et réponses validées le 19/10 à QD-434-1 à 4. Aucun constat iPhone n'est encore consigné pour elle ; les tests Jest ne prouvent ni le clavier, ni l'absence des poignées, ni la barre, ni la révélation réels.

Implémenté :

- Cellules Cible (mode Durée : « MM:SS » ; mode Répétitions : entier, QD-434-1), Pause (« MM:SS ») et Charge (décimal) au clavier numérique natif iOS (`number-pad` / `decimal-pad`), dans la cellule ; plus de roue de cellule (Durée ni Répétitions) ni de ± de Pause de cellule. Surfaces `selector(rowTarget)` et `stepper(rowPause)` retirées ; champs `keyboard(rowTarget | rowPause)`.
- Au repos : unités explicites sans zéros inutiles (« 5 s », « 1 min 5 s », « 1 min 30 s », « 12 min », « 0 s ») ; au focus : « MM:SS » sur quatre chiffres dans la même cellule, fond `#EAEAFF`. Chiffres décalés vers la gauche, quatre au plus, « : » inséré ; première frappe qui remplace, suivantes qui composent, Retour arrière qui supprime le dernier chiffre (vaut aussi pour la Charge d'une cellule : remplace RC-3 dans le tableau).
- Sans sélection native : la valeur est dessinée par la cellule ; le `TextInput` natif posé dessus est transparent et ne reçoit aucun toucher (le toucher de la cellule lui donne le focus), curseur masqué, menu d'édition masqué, aucune sélection posée par le code.
- Sortie de la cellule (QD-434-3, QD-434-4) : secondes > 59 reportées (`01:75` → 2 min 15 s) ; valeur hors bornes ramenée à la borne existante (Cible 1 s..58 min 55 s, Répétitions 1..100, Pause 0..5 min) ; cellule vidée → Pause 0 s, Cible « — » à renseigner (`#FFF1F0`) ; Cible à l'échec ou à renseigner : « 00:00 » (« 0 » en Répétitions) atténué au focus, la première frappe remplace ; focus puis sortie sans frappe : aucune modification.
- Barre (RC-1, rendue par la Feuille) : « À l'échec » | « ← Précédent » | « Suivant → » | « Fermer », sur une ligne. « À l'échec » seulement pour une cellule Cible : bascule cible numérique ↔ À l'échec pour cette seule série, valeur numérique mémorisée et restituée (`toggleRowFailure`, mémoire `lastNumberById`) ; annoncé sélectionné quand la cellule est à l'échec (et visuellement en Semi Bold, choix d'intégration). Précédent / Suivant : ligne par ligne, de gauche à droite (Cible, Pause, Charge), sans quitter le tableau (QD-434-2). Si les libellés complets ne tiennent pas (mesure hors écran), flèches seules « ← » / « → », libellés d'accessibilité « Précédent » / « Suivant » ; boutons de 44 × 44 au moins.
- Inchangés : roue Durée d'une série et roue Répétitions des séries identiques, Pause des séries identiques (stepper), charge commune (sélection au focus RC-3, hors tableau selon D-434), modèle, persistance, bornes, `tokens.ts`, aucune migration ; tableau entièrement à l'échec : Durée de l'exercice « — ».
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
12. Charge d'une cellule : première frappe qui remplace « 20 », sans sélection ni poignées ; charge commune (identiques) : sélection au focus inchangée (RC-3).
13. VoiceOver : cellule annoncée « Série n, Durée », valeur au repos puis « 01:05 » ; « À l'échec » annoncé avec son état ; flèches annoncées « Précédent » / « Suivant ».
14. Tableau entièrement à l'échec : Durée de l'exercice « — ».

Risques : la composition se fonde sur le texte natif reçu (insertion en fin de texte) ; une frappe très rapide pendant la mise à jour du texte contrôlé est à éprouver (scénario 1 joué vite). Sur Android (non recetté), la barre n'est pas rendue (RC-1) : « À l'échec » de cellule n'y est pas accessible.

## Issue de l'essai du clavier (story 2.2, AC7) — 19/10

Hermann, sur iPhone, après les corrections RC-1 à RC-9 : « Le clavier fonctionne comme attendu, des changements ergonomiques pourront être demandés plus tard. » Issue **succès** : les composants sont conservés pour la story 2.7, qui est débloquée.
