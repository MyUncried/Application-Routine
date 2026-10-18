# Extraction ED-13 à ED-17 — calculs de durée, inversion, agrégation, phrase, corpus

Extraction en lecture seule, établie le 2026-10-16 pour la préparation BMad du PRD PRE-4. Aucune règle n'est déduite de Figma, d'Excel ni de la section exclue du ch. 13 (l. 4346-5996, Q7), qui n'a pas été lue. Les numéros de ligne ont été relevés par `grep -n` ou `awk NR` sur les fichiers indiqués.

## 0. Conventions

**Abréviations de chemins.** Sauf mention contraire, les chemins sont relatifs à `docs/preparation/PRE-4/bmad/sources-caa2a5cf/docs/` (sources normatives `caa2a5cf`).

| Abrév. | Fichier |
|---|---|
| C07 | `Specifications-fonctionnelles/07 – Registre des décisions de conception.md` |
| C08 | `Specifications-fonctionnelles/08 – Conception fonctionnelle détaillée.md` |
| C09 | `Specifications-fonctionnelles/09 – Modèle de données fonctionnel.md` |
| C10 | `Specifications-fonctionnelles/10 – Processus métier et règles métier transverses.md` |
| C11 | `Specifications-fonctionnelles/11 – API fonctionnelles.md` |
| C12 | `Specifications-fonctionnelles/12 – Architecture technique.md` |
| C13 | `Specifications-fonctionnelles/13 – Contrats d’écran.md` (lignes < 4346 seulement) |
| C04 | `Specifications-fonctionnelles/04 – Modèle fonctionnel.md` |
| DSF-DM | `DSF-DEUX-MODES-ECHEC-2026-10-13.md` |
| DSF-PH | `DSF-PHRASES-V15-2026-10-07.md` |
| MAT-DM | `MATRICE-DEUX-MODES-ECHEC-2026-10-13.md` |
| B-PH1 | base `docs/Specifications-fonctionnelles/SPECIFICATION-PHRASE-PARAMETRES-EXECUTION-v1.md` |
| B-PH10 | base `docs/Specifications-fonctionnelles/SPECIFICATION-PHRASE-PARAMETRES-EXECUTION-v10.2.md` (HISTORIQUE, l. 1) |
| B-BIP | base `docs/Specifications-fonctionnelles/SPECIFICATION-BIP-CADENCE-v2.md` |
| B-DM | base `docs/Specifications-fonctionnelles/SPECIFICATION-DEUX-MODES-ECHEC-PAR-SERIE-2026-10-13.md` |
| B-CONS | base `docs/Specifications-fonctionnelles/CONSOLIDATION-EVOLUTIONS-V15-2026-10-07.md` |
| CORPUS | `docs/archives/evolutions-v15-2026-10-07/phrases-276.json` (+ `README.md` du même dossier) |
| PROMPT | `docs/archives/deux-modes-echec-2026-10-13/KODJO_Prompt_Deux-modes-et-echec_2026-10-13_complet.md` (historique, non normatif) |

**Statuts.** **N** = normatif actif ; **E** = exemple ou recette normative (valeur attendue, pas règle générale) ; **H** = historique / superseded, cité pour la traçabilité ; **B** = contenu perdu à `caa2a5cf`, repris depuis la base (classement « Base » de `sources-retenues.md` §5).

**Notations (C10 l. 603).** N = Séries par côté ; Ti = travail calculable de la Série i ; Pi = Pause de la Série i ; PN = Pause de la dernière Série ; PC = Pause entre les côtés ; R = Récupération de l'occurrence (Séance) ; b = bip de cadence (s) ; Ri = répétitions cibles ; Tv = total saisi.

---

## ED-13 — Calcul exact / estimé / partiel (≥) / omis

### Travail par Série

| ID | Règle atomique testable | Source | Statut | Contradiction / remarque |
|---|---|---|---|---|
| R13-01 | Durée, cible chiffrée : Ti = durée prescrite (travail connu). | C10 l. 603, 660, 698 ; B-BIP l. 34 | N | — |
| R13-02 | Répétitions chiffrées avec bip b > 0 : Ti = Ri × b (travail estimable). | C10 l. 603, 660, 699 | N | — |
| R13-03 | Cible À l'échec : travail inconnu, quel que soit le mode et quel que soit le bip. | C10 l. 700 ; C08 l. 1046 (« Le bip en À l'échec ne rend pas la durée calculable ») | N | — |
| R13-04 | Répétitions sans bip (b = 0) : travail inconnu, même avec cible numérique. | C10 l. 701, 660 | N | — |
| R13-05 | Aucune estimation forfaitaire de répétition (pas de rythme standard r). | C10 l. 660 ; C07 l. 312 (D-232), l. 475 (Q-07) | N | L'ancienne formule `R × r` de B-PH10 l. 88 est historique (H). |
| R13-06 | En Durée chiffrée, le bip n'a aucun effet sur le total. Ex. N4, Ti 60 s, b 4 s, p 15 s → 300 s exact. | C10 l. 632 | E | — |

### Nature du résultat d'Exercice

| ID | Règle atomique testable | Source | Statut | Contradiction / remarque |
|---|---|---|---|---|
| R13-07 | Quatre résultats typés : exact / estimated / lowerBound / omitted ; omitted n'a aucun montant. | C09 l. 1164, 1272 ; C11 l. 379, 405, 446 ; C12 l. 1549 | N | — |
| R13-08 | Durée, toutes cibles chiffrées, bip 0 ou positif → exact, rendu sans symbole. | C10 l. 645, 707 | N | — |
| R13-09 | Répétitions, toutes cibles chiffrées, bip > 0 → estimated, rendu « ≈ valeur ». | C10 l. 647, 709 | N | — |
| R13-10 | Répétitions, bip 0, toutes configurations de cibles (chiffrées, mixtes, tout échec) → omitted. | C10 l. 646, 711 ; B-DM l. 18 (EC-04) | N | — |
| R13-11 | Toutes cibles À l'échec, les deux modes, bip 0 ou positif → omitted. | C10 l. 648, 712 | N | — |
| R13-12 | Mélange chiffré/échec en Durée → lowerBound, rendu « ≥ total partiel ». | C10 l. 649, 708 | N | — |
| R13-13 | Mélange chiffré/échec en Répétitions avec bip > 0 → lowerBound (≥). | C10 l. 649, 710 | N | — |
| R13-14 | Le total partiel d'un mélange calculable = Σ travail connu ou estimable + toutes les pauses réellement prévues (y compris la pause qui suit une Série À l'échec et la pause terminale). Le travail inconnu n'est remplacé par aucune estimation. | C10 l. 613, 714 ; RM-129 C10 l. 72 | N | La pause suivant une Série à l'échec n'est pas citée explicitement ; elle découle de « pauses réellement prévues » et de la pause après chaque série (C10 l. 662). Confirmée par R01 (C10 l. 726 : 105 s = 75 + 3×10). |
| R13-15 | Priorité : ≥ prime sur ≈ (un Exercice Répétitions avec bip contenant au moins une cible échec est ≥, jamais ≈). | C10 l. 613, 654 ; C08 l. 655 ; C07 l. 604 | N | — |
| R13-16 | Les pauses chronométrées changent le montant, jamais la nature du résultat. | C10 l. 654 | N | — |
| R13-17 | omitted = absence de ligne, de valeur, de zéro et de tiret. | C10 l. 654 ; C08 l. 647 | N | Voir R14-15 (ligne Total de la feuille). |
| R13-18 | Une erreur de saisie (cible vide/invalide) est un état de validation distinct : jamais un résultat temporel ni « omitted », jamais une fausse valeur ; elle interdit ✓. | C10 l. 613, 654, 718 ; C13 l. 2979 | N | Le rendu du total en Durée pendant une cible incomplète n'est pas défini (voir M-06). |
| R13-19 | En Répétitions sans bip, la ligne de total reste absente même si une cible est incomplète ; l'erreur reste portée par la cible. | C10 l. 654 | N | — |
| R13-20 | Une cible À l'échec explicitement sélectionnée est valide sans nombre. | C10 l. 654 | N | — |
| R13-21 | « ≥ » sur des répétitions cadencées exprime un total prévisionnel partiel incluant une estimation, pas une borne mathématique du temps réel ; ne pas le présenter comme une mesure. | C10 l. 674, 716 | N | — |
| R13-22 | ≥ est autorisé au niveau Exercice pour le mélange calculable. | C10 l. 72 (RM-129), 75 (RM-132), 654 ; C07 l. 604 ; C13 l. 2979, 2991, 3171 (E51) | N (Δ1, Δ9 retenus) | **Contradiction** : C07 l. 475 (Q-07) et l. 482 (D-309) « ≥ seulement Séance » ; C09 l. 211 « ≥ seulement à la Séance » ; C13 l. 277, 378, 764, 850, 2167, 2259 (contrats Catalogue/Composition/Calendrier) « ≥ seulement à la Séance avec travail inconnu » ; C10 l. 135 (RM-072) ne mentionne pas lowerBound à l'Exercice. Résolution retenue (Δ9) : C07 l. 604 remplace « l'interdiction d'un total partiel à l'Exercice » ; B-BIP l. 54 « Q-07 est amendé » (perdu à `caa2a5cf`). |
| R13-23 | Une durée réelle réalisée reste réelle, sans symbole prévisionnel ; l'historique n'est jamais réécrit. | C10 l. 656, 611 (« Temps réalisé jamais réécrit ») | N | — |
| R13-24 | Les calculs proviennent des spécifications ; aucun calcul issu de Figma ou d'Excel. | C10 l. 72, 635 ; C07 l. 448 (D-300) | N | — |

### Formules de total intrinsèque

| ID | Règle atomique testable | Source | Statut | Contradiction / remarque |
|---|---|---|---|---|
| R13-25 | Pause après chaque Série, dernière comprise, même avec N = 1 et même avec PC. | C10 l. 64 (RM-036), 599, 662 ; C07 l. 371 (D-248), 494 (D-314) ; C08 l. 241 | N | Δ5 retenu. |
| R13-26 | Pi = 0 ne crée aucune phase positive (et ne fait pas apparaître de SERIES_PAUSE). | C10 l. 662 ; C09 l. 688 | N | — |
| R13-27 | Unilatéral : T = Σ(Ti + Pi) ; uniforme N×(d+p). Succession S1→P1→…→SN→PN. | C10 l. 607, 666 | N | — |
| R13-28 | Un côté après l'autre : T = 2Σ(Ti + Pi) + PC ; uniforme 2N×(d+p)+PC. PN du 1er côté puis PC se cumulent. | C10 l. 608, 667, 670 ; RM-036 l. 64 | N | C10 l. 597 écrit « D3→PN→PC », l. 667 « D3→P3→PC » : même séquence. |
| R13-29 | Les deux côtés à chaque série, N ≥ 2 : T = 2ΣTi + ΣPi + N×PC ; uniforme N×(2d+p+PC). Pi suit la paire ; PC dans chaque paire ; pas de PC au retour. | C10 l. 609, 668, 670 | N | — |
| R13-30 | N = 1 bilatéral est normalisé « Un côté après l'autre » dès le brouillon : T = 2(d+p)+PC. | C10 l. 670 ; C08 l. 261 ; C07 l. 373 (D-250) ; B-CONS l. 26 (90/15/10 → 220 s) | N | — |
| R13-31 | PC = 0 ne supprime ni ne remplace Pi ; aucun repli de PC vers la Pause. | C10 l. 670 ; RM-037 l. 65 | N | L'ancien `côté = pC>0 ? pC : pS` de B-PH10 l. 83 est H. |
| R13-32 | Compte à rebours et Fin d'exercice sont exclus du total intrinsèque. | C10 l. 611, 662 ; RM-129 l. 72 | N | — |
| R13-33 | Les cibles et pauses variables proviennent de la ligne courante, dans l'ordre effectif après déplacement ; la nouvelle dernière ligne porte PN. | RM-037 C10 l. 65 ; C08 l. 257 ; C10 l. 672 | N | — |
| R13-34 | Recettes normatives : A unilatéral 30/45/60 s, pauses 10/20/30 → 195 s ; B (A + R 120) → 285 s ; C (A par côté, PC 15) → 405 s ; D (A par paire, PC 15) → 375 s ; E Répétitions 12/10/8 bip 0 → omitted, 135 s de pauses connues ; F À l'échec bip 0 ou 4 → omitted ; N3 d90 p15 → 315 s ; bilatéral PC10 → 640 s par côté / 615 s par paire ; N1 bilatéral d90 p15 PC10 → 220 s, R30 → 235 s ; 12 séries travail 390 s, pause 10 → 510 s ; Répétitions N4 R15 b4 p15 → ≈ 300 s ; une Série Ti30 p15 → 45 s. | C10 l. 619-633 | E | Toutes recalculées : conformes aux formules R13-27 à R13-30 et R15-03. |
| R13-35 | Recettes mixtes : R01 Durée 30/45/échec, pauses 10, unilatéral direct → ≥ 1 min 45 s, total non éditable ; R02 Répétitions 10/12/échec, bip 2, mêmes pauses → ≥ 1 min 14 s ; R03 même exercice bip 0 → aucun total ; R04 trois échecs, pauses positives, chaque mode, avec/sans bip → aucun total, pauses conservées dans le plan et l'agrégat ; R14 cible vide/invalide → validation bloquée, pas de conversion en échec. | C10 l. 726-729, 739 | E | Ces montants (105 s, 74 s) sont dans C10, hors section exclue ; voir C-03. |
| R13-36 | Les durées et formules ne dépendent ni de Figma ni des montants Excel ; tester les deux directions/ordres, p0/PC0, R0/positive, N1/99, bascules, déplacement de la dernière ligne, copie et snapshot. | C10 l. 635 | N | — |

**Total ED-13 : 36 règles.**

---

## ED-14 — Total et inversion

| ID | Règle atomique testable | Source | Statut | Contradiction / remarque |
|---|---|---|---|---|
| R14-01 | L'inversion (saisie Tv → N) est réservée à Durée uniforme avec nombre de séries libre. | C10 l. 615 ; RM-130 l. 73 | N | — |
| R14-02 | Dès qu'une cible est À l'échec, aucun calcul inverse depuis un total saisi n'est disponible ; le total applicable est en lecture seule ; omitted reste absent. | C10 l. 720 ; B-DM l. 102 | N | — |
| R14-03 | Sous compte hérité d'un circuit de séries : total calculé en lecture seule, aucune inversion ni ajustement implicite de la cible ; ce verrouillage reste applicable avec les cibles échec. | C10 l. 615, 720 ; C13 l. 4081 | N | Héritage N par circuit : compatibilité seulement (périmètre l. 46). |
| R14-04 | Total variable et total Répétitions : non éditables (lecture seule). | C10 l. 615 ; RM-131 l. 74 ; C13 l. 4081 | N | — |
| R14-05 | Rendu de la ligne Durée totale dans la feuille : Durée uniforme chiffrée N libre → roulette ; N hérité, variable, Répétitions avec bip → lecture seule ; Répétitions sans bip et toutes cibles À l'échec → absente ; mélange calculable → ≥ en lecture seule. | C13 l. 4081 | N | — |
| R14-06 | Séries identiques toutes À l'échec : le total est omis (pas de roulette) ; un mélange n'existe qu'en variable, déjà en lecture seule : aucune nouvelle composante d'interface. | DSF-DM l. 47 ; PROMPT l. 147 (H) | N | — |
| R14-07 | Calcul inverse : N ∈ 1..99 au plus proche ; candidats unilatéral arrondi(Tv/(d+p)) ; succession arrondi((Tv−PC)/(2(d+p))) ; par paire arrondi(Tv/(2d+p+PC)) ; comparer les candidats réalisables et N = 1 calculé avec l'ordre normalisé par côté ; total le plus proche ; égalité → N le plus grand. | C10 l. 615 ; RM-130 l. 73 (« égalité vers le haut ») | N | C13 l. 3098 « arrondi .5 vers le haut » : compatible. |
| R14-08 | N = 1 issu de l'inversion est normalisé (uniforme, par côté). | RM-130 C10 l. 73 ; C10 l. 615 | N | — |
| R14-09 | Bornes de la roulette Durée totale : extrêmes réalisables T(1)..T(99) pour les paramètres courants, et non 58 min 55 s ; colonne minutes jusqu'à T(99), sans nouvelle colonne ni contrôle ; granularité seconde. | C10 l. 615 ; C13 l. 3098 | N | T(99) peut dépasser 59 min (voir Δ4). |
| R14-10 | Si T(N) ≠ Tv : message « Durée ajustée à {T(N)} pour respecter un nombre entier de séries. » ; sinon aucun message. Réafficher T(N). | C10 l. 615 ; RM-130 l. 73 | N | — |
| R14-11 | Le message porte « Annuler » (capsule sans contour, blanc transparent à 90 %, demi-cercles, marges égales) ; Annuler restaure les valeurs antérieures à l'ajustement ; toucher le reste du message le ferme sans annuler. | C10 l. 615 | N | Présentation : visuel. |
| R14-12 | En variable, aucune inversion. | RM-130 C10 l. 73 | N | — |
| R14-13 | La roulette Durée totale reste la variante numérique `5544:5118` (330×150, popover 354×216) : aucune option À l'échec ; ses règles propres restent inchangées. | DSF-DM l. 41 ; MAT-DM l. 41 ; C13 l. 4106 | N | — |
| R14-14 | Accessibilité : ≥ annoncé « total prévisionnel partiel », ≈ annoncé « estimation » ; caractère non éditable du total annoncé. | C13 l. 3047 ; DSF-DM l. 53 | N | — |
| R14-15 | En Durée uniforme, une diminution à N = 1 ne masque le total du résumé (phrase) que s'il égale effectivement la cible ; la ligne Total reste présente dans la feuille. | C13 l. 3098 | N | **Contradiction partielle** : « la ligne Total reste présente dans la feuille en Durée/Répétitions » (texte du 01/10) contre C13 l. 4081 et l. 4253 (ligne absente en Répétitions sans bip et tout échec ; feuille raccourcie de 42 px). Lecture : C13 l. 4081 (13/10) postérieure et spécifique. |
| R14-16 | Recette : mixte 30/45/échec avec pauses 10/20/30 → ≥ 2 min 15 s en lecture seule ; tout échec sans total ; Répétitions sans bip sans total. | C13 l. 3055 ; DSF-DM l. 47 | E | DSF-DM l. 47 : « les chiffres restent des données de démonstration ; le moteur détermine les montants ». |

**Total ED-14 : 16 règles.**

---

## ED-15 — Agrégation (Séance, Circuit) et pauses

| ID | Règle atomique testable | Source | Statut | Contradiction / remarque |
|---|---|---|---|---|
| R15-01 | Une phase `SERIES_PAUSE` existe après chaque Série dont la pause est positive, dernière comprise, sauf substitution terminale par une récupération positive. | C09 l. 688 | N (Δ5) | Le moteur reste hors périmètre. |
| R15-02 | `SIDE_RECOVERY` entre les côtés si nécessaire ; `POST_ACTIVITY_RECOVERY` après chaque occurrence de Séance si sa durée est positive. | C09 l. 688 ; C09 l. 676 (types de phase) | N | — |
| R15-03 | Occurrence calculable : To = T − PN + R si R > 0 ; sinon To = T. R remplace uniquement la toute dernière Pause, n'est jamais ajouté deux fois ; R = 0 ne crée pas de phase et ne supprime pas PN ; la pause du premier côté reste intacte. | C10 l. 611, 672 ; RM-038 l. 66 ; C07 l. 494 (D-314) | N | — |
| R15-04 | Retirer une récupération rétablit la dernière Pause configurée ; déplacer des Séries : déterminer la nouvelle dernière ligne avant substitution. | C10 l. 672 ; RM-038 l. 66 | N | — |
| R15-05 | Exécution directe (autonome) : aucune Récupération contextuelle, PN reste exécutée. | C10 l. 672 ; C08 l. 1784 | N | — |
| R15-06 | Même si le total d'Exercice est omitted, ses pauses connues (et phases chronométrées : PC, R) contribuent au total partiel de Séance/Circuit. | C10 l. 611, 674, 684, 718 ; R04 l. 729 | N | La contribution exacte d'un Exercice omitted n'a pas de formule écrite ; elle se lit dans le plan (R15-01/02/03). |
| R15-07 | Séance avec travail inconnu : somme une seule fois des phases chronométrées prévues et des travaux estimables ; le travail inconnu n'ajoute aucun montant et impose lowerBound. | C10 l. 674 ; B-BIP l. 48 | N | — |
| R15-08 | Séance : exact si tout exact ; ≈ si au moins une estimation et aucun inconnu ; ≥ si au moins un inconnu. | C10 l. 613, 650-652 ; RM-072 l. 135 | N | Le tableau l. 650-652 qualifie la Séance par « exercice sans durée » ; un Exercice lowerBound (qui a un montant) impose ≥ par l. 613 et l. 333 (« lowerBound prime sur estimated, qui prime sur exact dans les agrégats »). Voir M-08. |
| R15-09 | Circuit : exact si tout le travail est exact ; estimated si au moins une estimation et aucun inconnu ; lowerBound si au moins un inconnu ; Répétitions bip 0 ou toute cible échec = travail inconnu ; symbole préfixé au montant de l'en-tête, aucun en exact. | C10 l. 684 | N | Composition hors périmètre ; calcul seulement. |
| R15-10 | omitted reste propre à l'exercice concerné ; dans les agrégats, lowerBound > estimated > exact. | C10 l. 333 | N | — |
| R15-11 | Les totaux de Séance développent les Tours et les phases réellement prévues ; développer les Tours avant sommation ; les éléments internes au Circuit (occurrence, R, point d'arrêt) s'exécutent à chaque Tour. | C10 l. 611, 672 ; RM-213 l. 263 ; RM-038 l. 66 ; C08 l. 372-374, 601 ; C04 l. 383 | N | Multiplicité IN_TOUR = nombre de Tours : déduite de RM-213 ; `IN_TOUR` n'apparaît qu'en C09 l. 609. |
| R15-12 | Circuit de séries : passage bilatéral 2Ti+PC+Pi, ou 2Ti+PC+R si R>0 ; pas de Pi avant PC ; unilatéral Ti+Pi ou Ti+R. Tests : Ti30 Pi10 PC5 → 75 s ; R20 → 85 s ; trois passages → 225 s / 255 s. | C10 l. 686, 326 ; C08 l. 261 | N / E | Hors périmètre (Composition) ; compatibilité seulement. |
| R15-13 | Dans une Séance, Compte à rebours et Fin d'exercice ne sont jamais exécutés ni comptés ; seuls Compte à rebours initial et Fin de séance appartiennent au plan SESSION. | C10 l. 611, 676 ; C07 l. 289 (D-214) | N | — |
| R15-14 | Durée estimée d'exécution : plan complet, Compte à rebours initial et Fin de séance compris. | RM-071 C10 l. 134 ; C08 l. 362-376 ; C09 l. 211 | N | C09 l. 211 contient « ≥ seulement à la Séance » (voir R13-22). |
| R15-15 | Durée synthétique des Exercices (Catalogue, Composition) : exclut Compte à rebours initial et Fin de séance ; Catalogue = durée intrinsèque avec `sideRecoverySeconds` ; Composition = durées d'occurrence avec R, Tours développés sans ajouter R deux fois ; secondes converties en minutes par arrondi supérieur (`Math.ceil`). | RM-159 C10 l. 141 ; C08 l. 380-384 ; C09 l. 212 | N | Combinaison ceil + symbole ≥/≈ non décrite (M-09). |
| R15-16 | L'omission du total d'Exercice ne supprime ni ses phases, ni ses données, ni leur exécution. | C10 l. 678 | N | — |
| R15-17 | Les contrats Catalogue/Composition/Calendrier affichent durée et symbole issus du calcul commun, sans formule locale ni nombre Figma ; périmètre intrinsèque (ACTIVITY) ou occurrence (SESSION). | C13 l. 202 | N | Les mêmes contrats (l. 277, 378, 764, 850, 2167, 2259) disent « ≥ seulement à la Séance » : contradiction C-01. |
| R15-18 | Les huit cartes Catalogue « tout échec » conservent leur formulation (« N séries à l'échec ») ; les cartes et filtres Catalogue sont conservés. | C13 l. 556 ; DSF-DM l. 49 ; C08 l. 1814 | N | La synthèse de carte d'un Exercice mixte n'est pas définie (M-10). |
| R15-19 | Bip v2 gouverne calculs et périmètres ; les formules de pauses/Récupération ne changent pas hors Ti. | RM-072 C10 l. 135 ; C10 l. 305 | N | — |
| R15-20 | D-254 : la politique de pauses s'applique aux Exercices existants ; aucun recalcul des résultats historiques. | C07 l. 377 | N | — |

**Total ED-15 : 20 règles.**

---

## ED-16 — Phrase des paramètres, gras, Durée totale

### Contrat du générateur

| ID | Règle atomique testable | Source | Statut | Contradiction / remarque |
|---|---|---|---|---|
| R16-01 | Fonction pure : (paramètres métier + résultat de durée + locale française) → `Array<{texte, gras}>` ; mêmes entrées → mêmes segments ; `[]` si aucune phrase applicable. | C09 l. 1168 ; C11 l. 457 ; C07 l. 496 (D-316) | N | — |
| R16-02 | Le gras est décidé par le gabarit à l'émission ; aucune recherche de sous-chaîne ; deux valeurs identiques restent deux occurrences distinctes ; la concaténation des `texte` restitue la phrase exacte. | C11 l. 457 ; C09 l. 1168 ; C12 l. 1623 | N | — |
| R16-03 | Valeurs et unités paramétrées en gras, texte grammatical normal. Exemple : `[{"3",gras},{" séries de ",normal},{"30 s",gras}]`. | C11 l. 457, 459 ; C07 l. 446 (D-298) ; DSF-PH l. 7 | N | Le gras de « jusqu'à l'échec », « à l'échec », des symboles ≈/≥ et du montant total n'est pas défini (M-03). |
| R16-04 | Aucune phrase ni segment stocké (définition, occurrence, instantané) ; régénération à chaque affichage, notamment après ✓ ; un ancien objet relu prend la grammaire courante. | C11 l. 461 ; C09 l. 1114, 1170 ; C08 l. 670 ; C07 l. 496 | N | — |
| R16-05 | Brouillon incomplet : aucune cible inventée, ✓ interdit. Compte à rebours et Fin sont des lignes séparées, hors du texte et du total. | C11 l. 463 ; DSF-PH l. 15 | N | — |
| R16-06 | Rendu : zone cliquable unique, segments non interactifs ; Inter 13, interligne 20, valeurs Semi Bold ; hauteur intrinsèque, aucun plafond de caractères ; texte complet accessible et agrandissable ; aucune troncature à 360/402/440 avec texte agrandi. | C13 l. 4265 ; C12 l. 1623 ; DSF-PH l. 7, 9 ; C07 l. 507 (D-322) | N | — |
| R16-07 | Aucune virgule isolée en début de ligne ; segments dans un même flux Text ; le retour de ligne avant « Durée totale » est une propriété de rendu, pas du texte canonique. | C13 l. 4269 | N | — |
| R16-08 | Le mode est affiché à part, absent du début de phrase ; Excel est exclusivement rédactionnel. | C08 l. 622 ; C07 l. 446, 495, 506 | N | — |
| R16-09 | MVP français uniquement ; l'i18n future exige des gabarits par locale. | C12 l. 1617 ; C07 l. 497 (D-317) ; C09 l. 1172 | N | — |

### Grammaire (gabarits)

| ID | Règle atomique testable | Source | Statut | Contradiction / remarque |
|---|---|---|---|---|
| R16-10 | Ordre : nombre de séries → contenu → pause → côtés → durée applicable ; accords série/séries, menée/menées ; espaces et unités font partie du texte ; ponctuation conforme aux 276 cas. | C08 l. 622 ; RM-152 C10 l. 212 | N | — |
| R16-11 | Durée uniforme : `{N} séries de {durée}` (`1 série de …` à N = 1). | C08 l. 626 ; CORPUS id 1 | N | — |
| R16-12 | Durée variable ≤ 3 : `{N} séries de durée variable ({d1}, {d2} puis {d3})` ; à 2 : « puis » seul. | C08 l. 627 | N | Aucun cas N = 2 dans le corpus. |
| R16-13 | Durée variable > 3 : `{N} séries variables, de {min} à {max}` ; min/max sur les cibles actives, pas première/dernière ligne. | C08 l. 628, 639 | N | min = max non défini (M-05). |
| R16-14 | Répétitions uniformes : `{N} séries de {R} répétitions`. | C08 l. 629 | N | — |
| R16-15 | Répétitions variables ≤ 3 : `{N} séries de {r1}, {r2} puis {r3} répétitions`. | C08 l. 630 | N | — |
| R16-16 | Répétitions variables > 3 : `{N} séries variables, de {min} à {max} répétitions`. | C08 l. 631 | N | — |
| R16-17 | Bip > 0 en Répétitions : accoler `cadencées toutes les {bip}` aux répétitions ; en Durée et À l'échec, le bip n'ajoute aucune clause. | C08 l. 632, 641 | N | Placement dans un mélange Répétitions non défini (M-02). |
| R16-18 | Tout échec : `1 série menée jusqu'à l'échec` / `{N} séries menées jusqu'à l'échec` ; tout échec conserve le gabarit existant et les cartes Catalogue. | C08 l. 633, 653 ; RM-232 C10 l. 278 | N | B-DM l. 151 et PROMPT l. 19 « N séries jusqu'à l'échec » ; cartes « 3 séries à l'échec » : P3 tranché, le corpus fait foi. |
| R16-19 | Uniforme, pause positive, N ≥ 1 : `, avec {pause} de pause après chaque série`. | C08 l. 634 | N | — |
| R16-20 | Uniforme, pause nulle, N > 1 : `, enchaînées sans pause` ; N = 1 et pause nulle : aucune clause. | C08 l. 635-636 | N | — |
| R16-21 | Séries variables, tous modes, y compris tout échec : aucune clause de pause, aucune liste de pauses. | C08 l. 637, 639, 653 ; C07 l. 549 (D-338) ; RM-232 l. 278 | N | P1 : la capture 8328:38848 qui énumère les pauses n'est pas une règle (C08 l. 664 ; MAT-DM l. 49). |
| R16-22 | N = 1 normalisé uniforme avant génération ; aucune ellipse après trois valeurs ; l'omission rédactionnelle des pauses ne les retire pas du calcul. | C08 l. 639 | N | — |
| R16-23 | Côtés : aucune clause sans changement ; N = 1 bilatéral « en faisant le côté droit puis le gauche » ; N > 1 par paire « en alternant le côté droit puis le gauche à chaque série » ; N > 1 par côté « en faisant d'abord toutes les séries à droite, puis à gauche » ; inverser pour un départ gauche ; PC > 0 ajoute `, avec {PC} de pause au changement de côté`. | C08 l. 645 | N | Le corpus ne contient aucun départ gauche (M-07). |

### Durée totale dans la phrase

| ID | Règle atomique testable | Source | Statut | Contradiction / remarque |
|---|---|---|---|---|
| R16-24 | Après le point final : `Durée totale : {total}.` sans symbole en Durée exact ; `Durée totale : ≈ {total}.` en Répétitions avec bip. | C08 l. 647 | N | — |
| R16-25 | Mélange calculable : afficher ≥ (total du moteur, prioritaire sur ≈). | C08 l. 647, 655 ; RM-232 l. 278 ; C07 l. 446 | N (Δ1) | Le gabarit littéral `Durée totale : ≥ {total}.` n'est écrit nulle part (M-01) ; PROMPT l. 75 « Durée totale ≥ 2 min 15 s » (H). |
| R16-26 | Omettre intégralement en Répétitions sans bip et en tout échec ; aucun zéro ni tiret de remplacement. | C08 l. 647, 655 ; C13 l. 3172 (E52) | N | — |
| R16-27 | Redondance (Δ2) : omettre le total uniquement en Durée, une seule Série, sans changement de côté **et** sans pause. Avec une pause positive, une Série seule affiche son total. L'exception ne masque pas la durée de la carte Catalogue. | C08 l. 647, 1790 ; C07 l. 446 ; C10 l. 656 | N (Δ2) | B-PH10 l. 127 (H) ignorait la pause. C13 l. 3098 « ne masque le total que s'il égale la cible » : équivalent. |
| R16-28 | La phrase intrinsèque reste descriptive des paramètres de l'Exercice : la récupération de Séance ne la réécrit pas. | C08 l. 649 ; B-PH1 l. 9 | N | — |

### Extension mixte

| ID | Règle atomique testable | Source | Statut | Contradiction / remarque |
|---|---|---|---|---|
| R16-29 | Le générateur examine les cibles ordonnées ; le mode ne sélectionne plus une branche « À l'échec ». | C08 l. 653 | N | — |
| R16-30 | ≤ 3 cibles : énumérer dans l'ordre, en insérant « jusqu'à l'échec » à la place de la valeur concernée. Ex. `3 séries de durée variable (30 s, 45 s puis jusqu'à l'échec)`. | C08 l. 653, 659 ; RM-232 l. 278 | N / E | Forme Répétitions non illustrée (M-02). |
| R16-31 | > 3 cibles mixtes : compacter en `de {minimum numérique} rép. à l'échec` (Répétitions) ou `de {minimum numérique formaté} à l'échec` (Durée). Ex. `4 séries variables, de 30 s à l'échec` ; `4 séries variables, de 10 rép. à l'échec`. | C08 l. 653, 660-661 ; RM-232 l. 278 ; C07 l. 446 (D-298, EC-05) ; B-DM l. 19 (EC-05), 153 | N | La compaction est rédactionnelle : elle ne suppose pas une performance supérieure au maximum numérique (B-DM l. 153, Δ13 B). |
| R16-32 | Trois cibles échec, pauses variables → `3 séries menées jusqu'à l'échec`, total absent, aucune clause de pauses. | C08 l. 662 | E | — |
| R16-33 | Cas à couvrir : échec en première/deuxième position, bip 0/positif, les deux côtés ; 2/3/> 3 cibles mixtes, segments et gras corrects ; calcul indépendant du corpus. | C08 l. 664 ; C10 l. 741 (R16) | N | — |

**Total ED-16 : 33 règles.**

---

## ED-17 — Format des durées, corpus et variantes

| ID | Règle atomique testable | Source | Statut | Contradiction / remarque |
|---|---|---|---|---|
| R17-01 | Format d'une durée x (s) : x = 0 → `0 s` ; x < 60 → `{x} s` ; x multiple de 60 → `{x/60} min` ; sinon `{min} min {s} s`. | C08 l. 609-618 ; B-PH10 l. 70-79 | N (Δ4) | ≥ 1 h non défini (M-04). |
| R17-02 | Les 276 cas v15 fixent les formulations ; leur total numérique est un exemple injecté, jamais un oracle métier ; Excel exclusivement rédactionnel. | C07 l. 495 (D-315), 506 (D-321) ; C09 l. 1172 ; B-PH1 l. 7 | N | — |
| R17-03 | Recette : 276 cas conservés sans altération, complétés par les cibles mixtes ; injecter le total métier de test à la place du montant d'exemple avant comparaison ; texte et ponctuation exacts ; aucune clause ajoutée aux cas variables. | C12 l. 1621 ; B-PH1 l. 68 | N | — |
| R17-04 | Vérifier : singulier, côtés inversés, 2/3/> 3 cibles, min = max, bip 0/positif dans les deux modes, pause 0/positive, N1 avec/sans pause, PC 0/positive ; segments et gras (deux valeurs identiques) ; relecture d'un objet ancien ; absence de champ persistant ; accès clavier/lecteur d'écran ; pas de troncature à 360/402/440. | C12 l. 1621-1623 ; B-PH1 l. 68-70 | N | — |
| R17-05 | Le corpus v15 ne couvre pas les nouveaux cas mixtes ; ses 276 sorties ne sont pas une recette exhaustive du nouveau modèle ; ne pas modifier le fichier Excel source. | C08 l. 655 ; C08 l. 670 | N | — |
| R17-06 | Répartition historique : 140 phrases sans total, 46 ≈, 90 exacts, aucune ≥. | B-PH1 l. 11 ; CORPUS README l. 5 | B (Δ7) | Vérifié : 140/46/90 (§ 7.1). |
| R17-07 | Le corpus devra couvrir : modes, bip nul/positif, régime identique/variable, tout numérique/tout échec/mixte, positions de l'échec, N = 1/2/3/> 3, bilatéralité et pauses. | B-DM l. 159 | B (Δ7) | Croisement repris partiellement à `caa2a5cf` (C08 l. 664, C12 l. 1621). |
| R17-08 | Anciens cas « mode À l'échec » : un ancien exercice À l'échec se lit comme Répétitions avec toutes ses séries à l'échec ; nombre, pauses, bip, côté, ordre conservés ; omission du total et phrase existante préservées. | C09 l. 607, 1256 ; B-DM l. 163 ; C10 l. 740 (R15) | N | Pour l'oracle : les 92 entrées `mode: "À l'échec"` gardent leur texte exact, à lire avec mode Répétitions et cibles toutes échec (§ 7.3). |
| R17-09 | Les tests de durée restent indépendants de la colonne J et de la feuille « Calcul des durées » ; le calcul est testé depuis les spécifications. | B-PH1 l. 11 ; B-CONS l. 18 ; C10 l. 635 | N | — |
| R17-10 | Cas 144 (224 caractères) = référence de recette « Phrase longue » (7119:27855), sans hauteur maximale ni nombre maximal de caractères. | C13 l. 4267 ; DSF-PH l. 9 ; C07 l. 507 | E | Vérifié : cas 144 = 224 caractères, maximum du corpus. |

**Total ED-17 : 10 règles.**

---

## 6. Vérification Δ4 : règle de format contre le corpus 276

**Méthode.** Script Node en lecture seule (scratchpad, hors dépôt). Les jetons de durée de `phraseSource` sont extraits avec `(\d+) min( (\d+) s)?` ou `(\d+) s`, suivis d'un non-lettre, pour exclure « 1 série ». Chaque jeton est converti en secondes, reformaté par la règle de C08 l. 613-618, puis comparé au texte. Contrôles complémentaires : les champs `pause`, `pauseCotes` et `bip`, ainsi que la reconstruction de `phraseSource` à partir de `phraseGabarit` en injectant le total reformaté.

| Mesure | Résultat |
|---|---|
| Phrases contenant au moins une durée | **216 / 276** (60 phrases sans durée : Répétitions/échec sans pause, sans PC, sans bip ni total) |
| Jetons de durée (cibles, pauses, PC, bip, totaux) | **520**, dont 78 valeurs distinctes |
| Jetons conformes à la règle | **520 / 520 (100 %)** ; **0 non conforme** |
| Répartition par branche | x < 60 : 293 ; multiple de 60 : 55 ; autre (`m min s s`) : 172 ; **x = 0 : 0** |
| Totaux « Durée totale » | 136 (90 exacts + 46 ≈), tous conformes ; maximum 1 265 s = `21 min 5 s` |
| Champs `pause` / `pauseCotes` / `bip` | `0 s`, `5 s`, `15 s`, `4 s` : conformes (`Aucun` hors règle) |
| Gabarit + total reformaté = `phraseSource` | **276 / 276** |

**Exemples d'écart :** aucun. Formes vérifiées : `1 min` (et non `60 s`), `1 min 30 s` (et non `90 s`), `21 min 5 s`, `48 s`, `≈ 1 min 3 s`.

**Limites.**
1. La branche x = 0 (`0 s`) n'apparaît jamais dans le texte : une pause nulle s'écrit « enchaînées sans pause » ou s'omet, et un PC nul omet le suffixe. Le corpus ne la teste donc pas. Elle sert seulement dans les champs d'entrée.
2. Aucune durée ≥ 3 600 s dans le corpus. La règle reste applicable au-delà, par exemple `75 min` pour 4 500 s ou `117 min 50 s` pour 7 070 s, mais aucune source ne dit si une heure doit s'afficher en heures. Or la cible maximale 3 535 s × 2 dépasse déjà 1 h. T(99) dépasse aussi 59 min (C13 l. 3098).

**Vérification croisée complémentaire des totaux du corpus par les formules normatives.** Les 136 totaux ont été recalculés avec R13-27 à R13-30 : 136/136 sont égaux. Pour les variables à N = 3, les cibles figurent dans la phrase. Pour les variables à N = 6, seuls min et max sont visibles. ΣTi = 405 s (Durée) et ΣRi = 60 (Répétitions) ont donc été inférés d'un cas unilatéral, puis vérifiés sur les 19 autres variantes de chaque groupe. Les 140 omissions sont toutes conformes aux règles : Répétitions bip 0, tout échec, et redondance de la Durée en N = 1 unilatéral sans pause (cas 1 et 7). Ce résultat montre que les montants v15 sont compatibles avec D-248/D-314. Il ne fait pas de ces montants un oracle (R17-02).

---

## 7. Corpus 276 : répartition, conservation, adaptation, variantes

### 7.1 Répartition vérifiée (CORPUS)

| Axe | Valeurs |
|---|---|
| Mode | Durée 92, Répétitions 92, À l'échec 92 |
| Régime | Uniforme 156, Variable 120 |
| N | 1 : 36, 3 : 120, 6 : 120 (aucun N = 2, aucun N > 6) |
| Bip | Aucun 138, 4 s 138 |
| Pause | 0 s 138, 15 s 138 (en variable, même pause pour chaque Série, non énumérée) |
| Côtés | Aucun 60, Les deux à chaque série 120, Un côté après l'autre 96 ; **toujours départ droit** |
| PC | 0 s 168, 5 s 108 |
| Total | 140 sans total, 46 ≈, 90 exacts, 0 ≥ |

Ventilation des totaux : Durée exact 90, dont 2 omis par redondance (cas 1 et 7). Répétitions bip 4 s : ≈ 46. Répétitions bip 0 : omis 46. À l'échec : omis 92, dont 46 avec bip 4 s, toujours sans clause « cadencées ». Cibles : Durée uniforme 1 min 30 s ; variable N = 3 : 30 s, 45 s puis 1 min ; N = 6 : de 30 s à 1 min 45 s. Répétitions : 12 ; 12, 10 puis 8 ; de 6 à 15.

### 7.2 À conserver

- Les 276 textes exacts, sans altération, avec injection du total métier calculé à la place du montant d'exemple (R17-03).
- Les 184 cas Durée et Répétitions, entièrement numériques : ils ne sont pas affectés par ED-13 à ED-16, et leur texte comme leur nature de total restent identiques.
- L'absence de clause de pause dans tous les cas variables (120 cas), y compris À l'échec (R16-21).
- L'absence de clause de bip en À l'échec (46 cas avec bip 4 s) et en Durée.

### 7.3 Adaptation des 92 anciennes entrées « À l'échec » (TO_FAILURE)

- **Entrée** : relire `mode: "À l'échec"` comme `executionMode = REPETITIONS` avec toutes les cibles À l'échec. Conserver N, la pause, le bip, les côtés et le PC (C09 l. 1256).
- **Sortie attendue inchangée** : même texte. La phrase et l'omission du total sont préservées (C09 l. 1256, C08 l. 653). Le total reste omis même avec un bip de 4 s (R13-11).
- **Point à expliciter** : en Répétitions avec bip > 0, R16-17 accole « cadencées toutes les {bip} ». Mais le tout échec « conserve le gabarit existant », et C08 l. 641 dit « En Durée et À l'échec, le bip n'ajoute aucune clause ». Les 46 cas migrés exigent donc qu'aucune clause de bip ne soit ajoutée au tout échec, alors que le mode est devenu Répétitions. C'est une conséquence de la conservation, à écrire explicitement dans l'exigence.
- Des variantes Durée + tout échec doivent produire le même texte, puisque le mode ne sélectionne plus la branche (C08 l. 653). C'est une déduction directe : le texte ne contient pas l'unité.

### 7.4 Variantes à ajouter (sources : C08 l. 657-664 ; C10 l. 741 ; C12 l. 1621 ; B-DM l. 159)

1. Durée, mélange ≤ 3 : 2 cibles (`… (30 s puis jusqu'à l'échec)`), puis 3 cibles avec l'échec en position 1, 2 et 3 ; ≥ calculé.
2. Durée, mélange > 3 : `{N} séries variables, de {min formaté} à l'échec`, ≥.
3. Répétitions, mélange ≤ 3 et > 3 (`de 10 rép. à l'échec`), avec bip 0 (total absent) et bip > 0 (≥). Forme ≤ 3 et placement du bip à arbitrer (M-02).
4. Tout échec en Durée et en Répétitions, uniforme et variable, bip 0 et 4 s, avec et sans pause ; texte identique au corpus.
5. N = 2, N = 1 normalisé, N > 6, et min = max en > 3 (M-05).
6. Départ gauche, dans les deux ordres et avec N = 1 (absent du corpus).
7. Redondance Δ2 : Durée N = 1 unilatéral, pause 0 (omis) contre pause positive (affiché) ; Durée N = 1 bilatéral (affiché).
8. Gras : deux valeurs identiques à des positions différentes, segments « jusqu'à l'échec » et « à l'échec » (M-03).
9. Totaux ≥ 1 h (M-04).

---

## 8. Calculs de vérification croisée (a) à (f)

Sauf mention contraire : unilatéral, Exercice autonome (pas de R), Compte à rebours et Fin exclus (C10 l. 662). Formule unilatérale T = Σ(Ti + Pi) (C10 l. 607/666), pause après chaque série dernière comprise (C10 l. 662), Ti selon C10 l. 698-701. Le montant d'un mélange est la somme des travaux connus ou estimables et des pauses prévues (C10 l. 714). Le format suit C08 l. 613-618.

| Cas | Termes (source) | Total | Nature, rendu | Recoupement |
|---|---|---|---|---|
| **(a)** Durée 30/45/échec, pauses 10/10/10, unilatéral | T1 = 30, T2 = 45 (l. 698) ; T3 inconnu (l. 700) ; P1+P2+P3 = 30, P3 après la série en échec incluse (l. 662, 714) | 75 + 30 = **105 s** | lowerBound (l. 708), **`≥ 1 min 45 s`**, lecture seule (l. 720) | = R01 C10 l. 726 |
| **(b)** Répétitions 10/12/échec, bip 2 s, pauses 10/10/10 | T1 = 10×2 = 20, T2 = 12×2 = 24 (l. 699) ; T3 inconnu (l. 700) ; pauses 30 | 44 + 30 = **74 s** | lowerBound, prioritaire sur ≈ (l. 613, 710) ; **`≥ 1 min 14 s`** | = R02 C10 l. 727 |
| **(c)** Répétitions 10/12/échec, bip 0 | T1, T2, T3 inconnus (l. 701, 700) | **aucun** | omitted (l. 711) : aucune ligne ni clause « Durée totale » | = R03 C10 l. 728. En Séance, si les pauses sont de 10/10/10, la contribution connue est de 30 s, ou de 10 + 10 + R avec R > 0, et la Séance est en ≥ (l. 611, 674 ; R15-06). Ce montant de Séance n'est pas une recette écrite. |
| **(d)** 3 échecs, pauses 10/10/10 | Ti inconnus dans les deux modes, avec ou sans bip (l. 700) | **aucun** | omitted (l. 712) ; phrase `3 séries menées jusqu'à l'échec` (+ `, avec 10 s de pause après chaque série` en uniforme ; aucune clause en variable) | = R04 C10 l. 729. Contribution de Séance : 30 s, en ≥ |
| **(e1)** Durée 30/45/60, pauses 10/10/10 | ΣTi = 135 (l. 698) ; ΣPi = 30 | **165 s** | exact (l. 707) ; **`2 min 45 s`** | Formule C10 l. 607 ; recette A (l. 621) avec d'autres pauses |
| **(e2)** Répétitions 10/12/15, bip 2 s, pauses 10/10/10 | ΣTi = 20 + 24 + 30 = 74 (l. 699) ; ΣPi = 30 | **104 s** | estimated (l. 709) ; **`≈ 1 min 44 s`** | Formule l. 607 ; même règle que l'exemple normatif 300 s (l. 680) |
| **(f)** Durée 30/45/échec, pauses 10/20/30 | T1 + T2 = 75 ; P1 + P2 + P3 = 60 | **135 s** | lowerBound ; **`≥ 2 min 15 s`**, lecture seule | = DSF-DM l. 47 et C13 l. 3055 (« ≥ 2 min 15 ») ; PROMPT l. 75 (H) |

**Termes non définis par les sources.**
- Le **gabarit littéral** du ≥ dans la phrase (`Durée totale : ≥ {total}.`, avec une espace) n'est écrit nulle part ; seule l'analogie avec ≈ (C08 l. 647) le suggère (M-01).
- L'inclusion de la **pause suivant une Série à l'échec** découle de règles générales (l. 662, 714). Elle n'est pas formulée explicitement, mais R01 et DSF-DM l. 47 la confirment numériquement.
- La **contribution de Séance d'un Exercice omitted** n'a pas de formule écrite ; elle se lit dans le plan (C09 l. 688).
- Tous les autres termes sont définis.
- Remarque Q7 : les montants 105, 74, 165, 104 et 135 s, que `questions-ouvertes.md` Q7 présente comme « attendus chiffrés propres à cette section », se recalculent intégralement avec les formules normatives hors section exclue. 105, 74 et 135 sont même écrits en toutes lettres dans C10 l. 726-727, DSF-DM l. 47 et C13 l. 3055. Leur reprise ne dépend donc pas de Q7.

---

## 9. Contradictions et manques

### Contradictions

| ID | Contradiction | Sources | Effet / résolution proposée |
|---|---|---|---|
| C-01 | **≥ au niveau Exercice** : la règle active (RM-129/132, C10 l. 649, 654, 708, 710 ; C13 l. 2979, 2991, 3171) contre des textes résiduels « ≥ seulement Séance » : Q-07 C07 l. 475, D-309 l. 482, C09 l. 211, et les contrats Catalogue/Composition/Calendrier C13 l. 277, 378, 764, 850, 2167, 2259. | voir colonne | Δ9 retenu : C07 l. 604 et B-BIP l. 54 amendent Q-07/D-309. Les six passages de C13, qui concernent des **consommateurs** (cartes Catalogue, Composition), ne sont pas couverts par Δ9 tel qu'écrit. **À signaler avant de rédiger ED-15** (affichage d'une durée d'Exercice mixte sur une carte). |
| C-02 | RM-072 (C10 l. 135) : « Exercice : … omitted en Répétitions sans bip et À l'échec », sans lowerBound mixte ; « À l'échec » peut se lire comme « une cible à l'échec ». | C10 l. 135 contre l. 72, 75 | Lire RM-072 comme portant sur le tout échec ; RM-129/132 plus spécifiques. |
| C-03 | `questions-ouvertes.md` Q7 classe 105 s, 74 s et 135 s comme attendus propres à la section exclue. Ils figurent pourtant dans des sources normatives retenues (C10 l. 726-727 ; DSF-DM l. 47 ; C13 l. 3055). De même, Q10 dit que « Aucune durée/répétition, à l'échec » n'existe que dans la section exclue, alors que DSF-DM l. 21 le définit. | questions-ouvertes.md | Corriger Q7/Q10 : ces valeurs et libellés sont normatifs hors Q7. Q10 concerne ED-07, hors de cette extraction, mais l'écart est relevé. |
| C-04 | Ligne Total de la feuille : C13 l. 3098 (« reste présente … en Durée/Répétitions ») contre C13 l. 4081/4253 (absente en Répétitions sans bip et tout échec). | C13 | Appliquer l. 4081 (13/10, spécifique) ; signaler. |
| C-05 | Libellé tout échec : B-DM l. 151 et PROMPT l. 19 « N séries jusqu'à l'échec », cartes « N séries à l'échec » (C08 l. 1814), corpus « séries menées jusqu'à l'échec ». | — | Déjà tranché (P3) : corpus pour la phrase, formulation existante pour les cartes. |

### Manques

| ID | Manque | Effet |
|---|---|---|
| M-01 | Gabarit exact du ≥ dans la phrase (`Durée totale : ≥ {total}.`) et place du symbole (gras ou non) non écrits. | ED-16 : hypothèse par analogie avec ≈, à faire confirmer. |
| M-02 | **Mélange en Répétitions**. (i) Forme ≤ 3 : l'insertion littérale donne `3 séries de 10, 12 puis jusqu'à l'échec répétitions`, grammaticalement douteuse, et aucun exemple Répétitions ≤ 3 n'existe. (ii) Place de `cadencées toutes les {bip}` dans un mélange ≤ 3 ou compacté (`de 10 rép. à l'échec` + suffixe ?). (iii) Bip dans un tout échec en mode Répétitions (§ 7.3). | **Bloquant pour rédiger les attendus textuels de ED-16 en Répétitions** ; question produit à poser. |
| M-03 | Gras des segments nouveaux (« jusqu'à l'échec », « à l'échec », « rép. ») et du montant/symbole du total : la règle se limite à « valeurs et unités paramétrées ». | ED-16 : à arbitrer, ou à relever dans Figma en lecture seule (rendu uniquement). |
| M-04 | Format des durées ≥ 1 h non défini (Δ4). La règle donne `{m} min {s} s` sans plafond, alors que des totaux > 59 min sont atteignables (cible max 3 535 s ; T(99)). | ED-16/17 : appliquer la règle telle quelle (minutes > 59) ou arbitrer un format en heures. |
| M-05 | min = max en compaction > 3 (`de 10 à 10 répétitions` ?) demandé en recette (C12 l. 1621) sans gabarit. | ED-16/17. |
| M-06 | Rendu du total en Durée ou en Répétitions avec bip quand une cible est incomplète : on sait seulement « aucune fausse valeur » et « validation distincte » (C10 l. 613). | ED-13/14 : ligne absente, ou dernier total valide ? |
| M-07 | Le corpus n'a ni départ gauche, ni N = 2, ni N > 6, ni mélange, ni ≥, ni durée ≥ 1 h, ni x = 0 en texte. | ED-17 : variantes à ajouter (§ 7.4). |
| M-08 | Nature de la Séance quand un Exercice est lowerBound (montant présent) : le tableau C10 l. 650-652 ne cite que « exercice sans durée ». | Résolu par C10 l. 333 et l. 613 (≥) ; à expliciter dans l'exigence. |
| M-09 | Durée synthétique Catalogue : combinaison de l'arrondi à la minute supérieure (RM-159) avec ≈/≥, et carte d'un Exercice omitted (ligne absente ?), non décrites. | ED-15 (consommateurs). |
| M-10 | Synthèse de carte Catalogue d'un Exercice mixte : seules « N séries de X », « N séries de N rép. » et « N séries à l'échec » sont définies (C08 l. 1814). | ED-15/16 : signaler ; refonte des cartes hors périmètre. |
| M-11 | C09 l. 1114 liste les entrées de régénération de la phrase sans le bip ni les cibles typées, alors que la phrase en dépend. | Mineur ; C11 l. 457 et B-PH1 l. 9 font foi. |
