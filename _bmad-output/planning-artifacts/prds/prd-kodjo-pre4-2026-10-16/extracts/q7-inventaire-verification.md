# Q7 — Vérification de l'« Inventaire opposable PRE-4 » contre les sources normatives

Établi le 2026-10-16, en lecture seule, à la suite de la décision Q7 de Hermann : l'inventaire du ch. 13 consolidé (l. 4346-5996, JSON `kodjo.screen-states.v1`, 83 états : 32 FIGMA + 51 DOCUMENT_ONLY) devient une **source produit commune**, mais seulement après vérification de sa cohérence avec les spécifications normatives. Ne sont pas repris : les contrats générés, les `state_id` et `scenario_id`, les verdicts, les preuves et `proof_required`.

Ce document décompose chaque attendu en assertions et classe chacune d'elles. Il ne tranche aucune question produit : les classes D et X sont à arbitrer par Hermann.

## Conventions

**Classes**
- **R** (règle sourcée) : l'assertion figure dans une section normative, citée par `fichier:ligne`.
- **C** (calcul vérifié) : montant recalculé depuis les formules normatives, avec le calcul.
- **T** (mécanisme ou solution technique) : n'est pas reprise comme exigence. Elle est transmise à l'architecture comme hypothèse non contraignante (CLAUDE.md : ne pas présupposer la solution technique).
- **D** (déduction non validée) : aucune source normative. Le commentaire indique si l'assertion est cohérente, contradictoire ou seulement non sourcée.
- **X** (contradiction) : l'assertion contredit une source normative. Les deux sources sont citées.

**Abréviations des sources.** Sauf mention contraire, les chemins sont relatifs à `docs/preparation/PRE-4/bmad/sources-caa2a5cf/docs/`.

| Abr. | Fichier |
|---|---|
| C04, C06, C07, C08, C09, C10, C12, C13 | `Specifications-fonctionnelles/0x – … .md` (ch. 13 hors l. 4346-5996) |
| DSF2M | `DSF-DEUX-MODES-ECHEC-2026-10-13.md` |
| DSFG | `DSF-INTERFACE-GENERALE-2026-10-08.md` |
| MAT | `MATRICE-DEUX-MODES-ECHEC-2026-10-13.md` |
| P | `docs/preparation/PRE-4/perimetre-et-couverture.md` (ED-01 à ED-22 : l. 19 à 40) |
| P3 | `docs/preparation/PRE-3/perimetre-et-couverture.md` |
| CORPUS | `docs/archives/evolutions-v15-2026-10-07/phrases-276.json` |
| Q8 | décision de Hermann du 2026-10-16 : en Répétitions, roulette à une colonne, option échec en tête, puis 1 à 100 |

**Méthode.** Une assertion = une proposition vérifiable de l'`expected` ou du `then`, ou un paramètre de recette du `given` ou du `when` lorsqu'il porte une règle. Les états dont l'attendu est identique sont regroupés : ED-01 (quatre parcours) et ED-20 (Catégorie, Zones). La fin commune aux quatre états ED-22 est factorisée (ED-22/commun). Les champs `reason` (formule VNext identique pour les 51 états) et `proof_required` ne sont pas comptés comme assertions : ils sont écartés en bloc (§3, T-0).

---

## 1. Les 51 états DOCUMENT_ONLY

### ED-01 — catalogue-create, catalogue-edit, session-create, session-edit (attendu identique, ×4)

| # | Assertion | Cl. | Source ou calcul | Commentaire |
|---|---|---|---|---|
| 01.1 | Le même éditeur sert aux quatre parcours | R | P:19 ; C13:548 (CE-T03-04 §3) ; C13:2967 (« même feuille pour création/modification et copie d'Exercice dans Séance ») | |
| 01.2 | Paramètres typés et métadonnées relus à l'identique après Terminer, fermeture et réouverture | R | P:19 ; C13:620 ; C09:1230 | |
| 01.3 | Copie isolée : Catalogue et occurrence de Séance distincts | R | C09:609 (« la copie n'a plus de lien fonctionnel ») ; C13:548 (« sans synchronisation ») | |
| 01.4 | Médias ordonnés conservés (given) | R | C09:613 ; C07:147 (D-115) | |
| 01.5 | Aucune récupération ajoutée automatiquement | R | C08:245 (R « ajoutée explicitement ») ; C10:66 (RM-038) ; C08:271 | Contrairement à l'hypothèse de départ, cette assertion est sourcée. |
| 01.6 | Retour au contexte appelant | R | C13:624 (CE-T03-04 §16) | Pour session-create et session-edit, l'adaptation d'une copie placée dans un circuit relève de Composition, hors périmètre (questions-ouvertes §4). |

### ED-02/whole-editor

| # | Assertion | Cl. | Source ou calcul | Commentaire |
|---|---|---|---|---|
| 02.1 | Composition complète de chaque état selon ses propriétés Figma : nom, Catégorie/Zones, Paramètres, description, médias, Terminer | R | P:20 ; C13:576 (ordre de structure) | Figma ne fixe que le visuel (D-255, D-300). |
| 02.2 | Corps défilable et action finale accessible | R | C13:594 ; C07:567 (D-349) | |
| 02.3 | Pas de sections en accordéon héritées, ni de carte en grille conservée par défaut | D | — (aucune occurrence normative de « accordéon » ou « en grille » pour l'éditeur) | Cohérent avec C13:576, mais non sourcé. Vise sans doute l'état du code PRE-3 : c'est un constat à faire dans le code, pas une règle. |
| 02.4 | Référence à la largeur 402, sur les 32 références figées | R | C06:57, 79 ; `references-figma.json` ; MAT:21 (E13 : 32 captures) | « Figées » est un mécanisme de preuve VNext (T-0). |

### ED-03/anchored-popovers

| # | Assertion | Cl. | Source ou calcul | Commentaire |
|---|---|---|---|---|
| 03.1 | Un seul popover ouvert à la fois (Mode, Côté, Ordre, Régime) | R | C13:4085 | |
| 03.2 | Ancré à son contrôle ; voile et fermeture cohérents | R | P:21 ; DSF2M:7 (« conserver shell, ancrage, voile ») ; C13:2999 (voile) | La fermeture par un toucher extérieur n'est écrite que pour les steppers (C13:4211). Pour les popovers, elle est cohérente mais implicite. |
| 03.3 | Le focus revient au déclencheur | D | — | Cohérent : C13:3047 et C13:632 imposent le retour du focus pour la feuille et l'éditeur, mais rien n'est écrit pour un popover. |
| 03.4 | Aucune écriture persistée | R | C13:3037 (« une bascule de mode seule ne sauvegarde rien ») ; C13:620, 636 | |

### ED-04/explicit-regime

| # | Assertion | Cl. | Source ou calcul | Commentaire |
|---|---|---|---|---|
| 04.1 | Aucun interrupteur « Séries variables » | R | P:22 ; C13:4075 | |
| 04.2 | Choix identiques/variables par popover | R | C13:4075 | |
| 04.3 | Chevron indépendant seulement en variable | R | C13:4075 ; C13:2985 (« identiques sans chevron ») | |
| 04.4 | L'égalité des valeurs ne normalise pas le régime | R | C09:1248 ; C08:240 | |
| 04.5 | Replier le tableau ne modifie pas les données | R | C13:4085 ; P3:96 | |

### ED-05/two-modes

| # | Assertion | Cl. | Source ou calcul | Commentaire |
|---|---|---|---|---|
| 05.1 | Exactement deux modes : Durée et Répétitions | R | C10:61 (RM-033) ; C09:607 ; DSF2M:7 | |
| 05.2 | L'ancien mode À l'échec est absent des options | R | C13:4073 ; DSF2M:7 | |
| 05.3 | L'ancien mode reste lisible (lu puis migré) | R | C09:607, 1256 | |
| 05.4 | Absent du « format v2 », lu « uniquement par l'adaptateur v1 » | T | — | Forme de sérialisation et d'adaptateur : présuppose une solution. |

### ED-06/typed-targets

| # | Assertion | Cl. | Source ou calcul | Commentaire |
|---|---|---|---|---|
| 06.1 | Cible échec explicite, sans valeur | R | C09:1243 ; C13:3027 | |
| 06.2 | Cible chiffrée : entier dans l'unité du mode | R | C09:1242 | |
| 06.3 | Cible absente, 0, NaN, chaîne ou type inconnu refusés à la persistance | R | C09:1244-1246 (« ni 0, ni une chaîne, ni un simple null ambigu ») ; C10:739 (R14) ; C13:3041 | |
| 06.4 | Jamais convertis en échec | R | C09:1244 ; P:36 | |
| 06.5 | Couverture Durée/Répétitions × uniforme/variable | R | C09:1248 | |
| 06.6 | `UNSET` comme nom de l'état non renseigné | T | — | Nom technique. Le fonctionnel dit « — », « à renseigner » (C08:259). |

### ED-07/numeric

| # | Assertion | Cl. | Source ou calcul | Commentaire |
|---|---|---|---|---|
| 07n.1 | À l'ouverture, roulette active sur la valeur courante (30 s) | R | DSF2M:33 ; C13:4104 | |
| 07n.2 | Libellé échec à 45 % | R | DSF2M:31, 33 | Figma 8328:37862 : remplissage #1a1a1f, opacité 0,45. |
| 07n.3 | Aucune coche | R | DSF2M:21 | |

### ED-07/failure

| # | Assertion | Cl. | Source ou calcul | Commentaire |
|---|---|---|---|---|
| 07f.1 | Libellé « Aucune durée, à l'échec » | R | DSF2M:21 ; C13:3015 ; Figma 8328:37862 (nœud TEXT `I8328:37967;8452:13320`) | **Contrairement à Q7 et Q10, ce libellé ne vient pas seulement de la section exclue : il est normatif.** |
| 07f.2 | Option active (100 %) | R | DSF2M:31, 33 | |
| 07f.3 | Bloc numérique affiché à 00:00, à 45 % | R | DSF2M:33, 35 ; C13:3009 | |
| 07f.4 | Le bloc reste toujours manipulable | R | DSF2M:33, 35 ; MAT:48 (R02) | |

### ED-07/repeat

| # | Assertion | Cl. | Source ou calcul | Commentaire |
|---|---|---|---|---|
| 07r.1 | Libellé « Aucune répétition, à l'échec » | R | DSF2M:21 ; C13:3015 | Aucune capture Figma ne le montre. |
| 07r.2 | Option échec en tête | R | DSF2M:21 ; Q8 | |
| 07r.3 | Roulette d'entiers 1 à 100 | R | C13:4092 ; C13:4108 ; Q8 | C13:125 (« stepper inline » pour « Nombre de répétitions ») est la contradiction tranchée par Q8. |
| 07r.4 | Une seule sélection à la fois | R | DSF2M:33 | |

### ED-07/validation

| # | Assertion | Cl. | Source ou calcul | Commentaire |
|---|---|---|---|---|
| 07v.1 | ✓ applique au brouillon parent seulement, sans persister | R | C13:2967, 3033 ; C08:251 | |
| 07v.2 | Quitter l'éditeur sans Terminer et confirmer l'abandon restaure la version persistée | R | C13:552 (confirmation d'abandon) ; C13:620 ; P3:99 | |

### ED-08/failure-to-number

| # | Assertion | Cl. | Source ou calcul | Commentaire |
|---|---|---|---|---|
| 08.1 | Toucher l'option échec ramène la roulette à 00:00 et grise tout le bloc à 45 % | R | DSF2M:33, 35 | |
| 08.2 | Tourner la roulette sans geste de déverrouillage sélectionne la valeur (30 s) et grise le libellé | R | DSF2M:33 ; C13:4104 | |
| 08.3 | Annuler (✕) restaure la cible initiale (30 s) | R | DSF2M:21 ; C13:3033 ; C13:3055 (« réouverture fidèle et annulation/restauration ») | |

### ED-09/duration

| # | Assertion | Cl. | Source ou calcul | Commentaire |
|---|---|---|---|---|
| 09d.1 | Seuls les entiers de 5 à 3535 s, par pas de 5, sont de nouvelles cibles Durée valides | R | C13:4093, 4108 ; DSF2M:37 | |
| 09d.2 | 0, 1, 4, 3540 et un non-multiple de 5 refusés ; 5, 30 et 3535 acceptés | R | Dérivé direct des bornes C13:4093 | Les valeurs de test elles-mêmes ne sont que des exemples. |
| 09d.3 | 00:00 ne sélectionne pas l'échec et n'est jamais une cible | R | DSF2M:33, 37 ; C09:1244 | |

### ED-09/repeat

| # | Assertion | Cl. | Source ou calcul | Commentaire |
|---|---|---|---|---|
| 09r.1 | Seuls les entiers de 1 à 100 sont valides ; 0, 101 et 1,5 refusés | R | C13:4092 ; C13:3027 (« fraction invalides ») | |

### ED-09/historic

| # | Assertion | Cl. | Source ou calcul | Commentaire |
|---|---|---|---|---|
| 09h.1 | Une valeur historique hors grille est lue exactement, sans arrondi | R | DSF2M:37 ; C13:4108, 3041 ; C09:1270 | |
| 09h.2 | Valeurs d'exemple 31 s et 5999 s | D | — | Valeurs de test, pas des règles. 5999 s est l'ancienne borne qualifiée de « coquille » (DSF2M:37) : cohérent comme donnée héritée, mais son existence en base reste à constater dans le code. |
| 09h.3 | Le champ affiche l'ancienne valeur et exige une valeur valide pour la modifier | D | — | Cohérent avec C13:3041 (« à traiter explicitement, jamais tronquées silencieusement »), mais la présentation n'est pas spécifiée : une roulette au pas de 5 ne sait pas afficher 31 s. **À arbitrer.** |
| 09h.4 | Pause 0 toujours valide | R | DSF2M:33 ; C13:4100 | |
| 09h.5 | Aucune migration ne borne les valeurs | R | C09:1256, 1270 ; DSF2M:37 | |

### ED-10/active-cell

| # | Assertion | Cl. | Source ou calcul | Commentaire |
|---|---|---|---|---|
| 10.1 | Deux colonnes cible/Pause, même avec une cible échec | R | DSF2M:45 ; C13:2995 | |
| 10.2 | Poignée, numéro et retrait présents | R | P:28 ; C13:4076 | |
| 10.3 | Un seul champ actif | R | C13:3017, 4205 | |
| 10.4 | Le pied commun n'agit que sur la cellule active, désignée aussi par un texte (« Série 1 · Durée ») | R | C13:2997, 4223 ; P:28 | |
| 10.5 | Modifier une Pause ne change aucune cible, échec compris | D | — | Cohérent : les champs sont indépendants, et MAT:24 (E16) exclut « une mutation de plusieurs cibles par un seul appui ». Non énoncé tel quel. |
| 10.6 | Suppression immédiate, avec Annuler | R | C13:4219 | |

### ED-11/mode-reservations

| # | Assertion | Cl. | Source ou calcul | Commentaire |
|---|---|---|---|---|
| 11.1 | Une cible échec reste échec lors de la bascule de mode | R | C09:1252 ; C13:3015 | |
| 11.2 | Les cibles chiffrées incompatibles deviennent « — » (à renseigner), sans conversion, puis sont restaurées au retour avant ✓ | R | C08:259 ; C09:1252 ; C13:3019 | |
| 11.3 | Bip conservé | R | C13:3019 ; P3:94 | |
| 11.4 | N et Pauses conservés | R | C08:259 ; P3:94 | |
| 11.5 | Côtés et phases (Compte à rebours, Fin) conservés | D | — | Cohérent : aucune règle ne les modifie à la bascule, mais ce n'est pas énoncé explicitement. |
| 11.6 | Annulation complète (✕) | R | C13:3033 | |

### ED-12/count

| # | Assertion | Cl. | Source ou calcul | Commentaire |
|---|---|---|---|---|
| 12c.1 | À N=1, état effectif uniforme sur la première ligne de l'ordre courant | R | C08:261 ; C08:255 (la réduction retire les dernières lignes) | |
| 12c.2 | À N=1, ordre effectif « Un côté après l'autre » dès le brouillon | R | C08:261 ; P3:95 | `BY_SIDE` est l'identifiant du code (`ExecutionParameters.ts:25`). |
| 12c.3 | Remonter N avant ✓ restaure les lignes retirées dans leur ordre relatif | R | C08:255, 261 | |

### ED-12/reorder

| # | Assertion | Cl. | Source ou calcul | Commentaire |
|---|---|---|---|---|
| 12o.1 | Déplacer une ligne déplace sa cible, sa Pause et son bip ensemble | R | C08:257 ; C13:3023 | |
| 12o.2 | La nouvelle dernière ligne porte PN | R | C08:257 | |
| 12o.3 | Supprimer puis Annuler restaure la position et les paramètres | R | C13:4219, 3017 | |
| 12o.4 | Augmenter N copie le type (échec compris) et la Pause de la dernière ligne active, sans nombre inventé | R | C09:1250 ; C08:255 | |

### ED-12/regime

| # | Assertion | Cl. | Source ou calcul | Commentaire |
|---|---|---|---|---|
| 12g.1 | Variable → identiques reprend la cible et la Pause de la première ligne dans l'ordre courant | R | C08:253 ; C08:532 | |
| 12g.2 | Revenir à variable avant ✓ restaure le tableau | R | C08:253 | |
| 12g.3 | Fermer sans ✓ laisse le parent intact | R | C13:3033 | |

### ED-13/duration

| # | Assertion | Cl. | Source ou calcul | Commentaire |
|---|---|---|---|---|
| 13d.1 | Durée 30/45/échec, pauses 10/10/10, unilatéral → lowerBound | R | C10:649, 708 | |
| 13d.2 | 105 s, affichés « ≥ 1 min 45 s » | C | Travail connu 30+45 = 75 ; pauses après chaque série, dernière comprise (C10:662) : 10+10+10 = 30 ; Σ(Ti+Pi) sur le connu (C10:605) = 105 s ; format « m min s s » (C08:618) → 1 min 45 s. Identique à R01 (C10:726). | **OK** |
| 13d.3 | Aucune estimation du travail inconnu | R | C10:660, 714 | |
| 13d.4 | « Ledger indépendant » | T | — | Structure de calcul. |

### ED-13/repeat-beep

| # | Assertion | Cl. | Source ou calcul | Commentaire |
|---|---|---|---|---|
| 13b.1 | lowerBound ; ≥ prioritaire sur ≈ | R | C10:654, 710 | |
| 13b.2 | 74 s, affichés « ≥ 1 min 14 s » | C | Ti = Ri×b (C10:603) : 10×2 + 12×2 = 44 ; pauses 30 ; 44+30 = 74 s = 1 min 14 s. Identique à R02 (C10:727). | **OK** |

### ED-13/repeat-no-beep

| # | Assertion | Cl. | Source ou calcul | Commentaire |
|---|---|---|---|---|
| 13n.1 | omitted à l'Exercice | R | C10:646, 711, 728 (R03) | |
| 13n.2 | 30 s de pauses connues conservées pour l'agrégat | C | 3×10 = 30 s ; règle C10:674, 718 | **OK.** Le support « ledger » est T. |

### ED-13/all-failure

| # | Assertion | Cl. | Source ou calcul | Commentaire |
|---|---|---|---|---|
| 13f.1 | omitted dans chaque mode, bip 0 ou 2, même avec des pauses positives | R | C10:648, 654, 712, 729 (R04) | |
| 13f.2 | 30 s de pauses connues | C | 3×10 = 30 s ; C10:729 (« pauses conservées dans le plan et l'agrégat ») | **OK** |

### ED-13/all-numeric

| # | Assertion | Cl. | Source ou calcul | Commentaire |
|---|---|---|---|---|
| 13a.1 | Durée 30/45/60, pauses 10/10/10 → exact 165 s | C | 30+45+60 = 135 ; +30 = 165 s (2 min 45 s) ; exact : C10:645 | **OK** |
| 13a.2 | Répétitions 10/12/15, bip 2 → estimated 104 s | C | (10+12+15)×2 = 74 ; +30 = 104 s (≈ 1 min 44 s) ; estimated : C10:647 | **OK** |
| 13a.3 | Compte à rebours et Fin exclus du total intrinsèque | R | C10:611, 662 | |

### ED-13/figma-mixed

| # | Assertion | Cl. | Source ou calcul | Commentaire |
|---|---|---|---|---|
| 13m.1 | Durée 30/45/échec, pauses 10/20/30 → lowerBound 135 s = 2 min 15 s | C | 75 + (10+20+30) = 135 s = 2 min 15 s ; DSF2M:47 ; C13:3055 ; le texte Figma 8470:13303 indique « ≥ 2 min 15 s » | **OK** |
| 13m.2 | Montant obtenu par la règle, pas copié du PNG | R | C10:72 (RM-129, « aucun calcul issu de Figma ») ; C10:635 | |

### ED-14/inverse

| # | Assertion | Cl. | Source ou calcul | Commentaire |
|---|---|---|---|---|
| 14i.1 | Dès qu'une cible est échec (uniforme ou variable), aucun calcul inverse | R | C10:720 | |
| 14i.2 | Total affichable en lecture seule | R | C10:720 ; C13:4081 | |
| 14i.3 | Total omitted absent | R | C10:654, 720 | |
| 14i.4 | En Durée uniforme toute chiffrée, avec N libre, l'inverse et son arrondi documenté sont conservés | R | C10:615 (inversion, arrondi, égalité vers le haut) ; RM-130 | |
| 14i.5 | Roulette du total sans option échec | R | DSF2M:41 ; MAT:41 | |

### ED-14/inverse-ui

| # | Assertion | Cl. | Source ou calcul | Commentaire |
|---|---|---|---|---|
| 14u.1 | Total partiel annoncé en lecture seule (« total prévisionnel partiel »), sans popover inverse | R | C13:3047 ; DSF2M:53 | |
| 14u.2 | Total omitted non rendu | R | C10:654 | |
| 14u.3 | Roulette du total distincte de la roulette de cible | R | DSF2M:41 ; C13:2995 | |

### ED-15/known-pauses

| # | Assertion | Cl. | Source ou calcul | Commentaire |
|---|---|---|---|---|
| 15k.1 | La dernière Pause (10) est remplacée par R40 | R | C10:611, 672 | |
| 15k.2 | Occurrence : 135 s connus | C | T intrinsèque connu = 30+45 + 3×10 = 105 ; To = T − PN + R = 105 − 10 + 40 = 135 s (C10:611) | **OK sur le montant.** |
| 15k.3 | 135 s qualifiés de total « intrinsèque » | X | C10:603-611 : le total intrinsèque vaut ici 105 s ; 135 s est le total d'occurrence To | Erreur de terme dans l'inventaire. |
| 15k.4 | +15 s de phases de Séance (10+5) = 150 s, lowerBound | C | 135 + 10 + 5 = 150 s ; lowerBound : C10:652 | **OK**, mais seulement pour la Durée estimée d'exécution (plan complet, C04:188 ; C10:611). |
| 15k.5 | Métrique à laquelle s'applique le montant de 150 s | D | C04:188 ; C10:678 | Non précisé. Pour la Durée synthétique des Exercices (Catalogue, Composition), qui exclut le Compte à rebours initial et la Fin, on obtient ≥ 135 s, pas 150 s. **À préciser.** |
| 15k.6 | Aucune nouvelle R créée | R | C10:66 (RM-038) ; C08:245 | |
| 15k.7 | Recalcul identique après réouverture | R | C09:1192, 1232 ; C13:3031 | |

### ED-15/bilateral

| # | Assertion | Cl. | Source ou calcul | Commentaire |
|---|---|---|---|---|
| 15b.1 | Travail connu 60 s | C | N=2 par côté (C08:238), cibles 30/échec, deux côtés : 2×30 = 60 s | **OK.** À titre de contrôle, hors attendu : en « Un côté après l'autre », 2Σ(Ti+Pi)+PC sur le connu = 2×(30+10+10)+5 = 105 ; To = 105 − 10 + 40 = 135 s, lowerBound. |
| 15b.2 | Toutes les pauses réellement planifiées comptées une fois | R | C10:674 | |
| 15b.3 | Pause terminale remplacée par R40 | R | C10:672 | |
| 15b.4 | Aucune estimation forfaitaire (2 s par répétition) | R | C10:660 | |
| 15b.5 | « Ledger » annoté par côté et par ligne | T | — | |

### ED-16/ordered

| # | Assertion | Cl. | Source ou calcul | Commentaire |
|---|---|---|---|---|
| 16o.1 | Jusqu'à trois cibles, énumération dans l'ordre réel, « jusqu'à l'échec » à la place de la valeur | R | C08:653, 659 | |
| 16o.2 | Valeurs et unités en gras | R | C13:558 ; C13:4265 | |
| 16o.3 | Aucune énumération des pauses variables | R | C08:637, 653 | |
| 16o.4 | Échec à chaque position, dans chaque mode | R | C08:664 | |

### ED-16/compact

| # | Assertion | Cl. | Source ou calcul | Commentaire |
|---|---|---|---|---|
| 16c.1 | Au-delà de trois cibles mixtes, compaction « de {min} rép. à l'échec » ou « de {min formaté} à l'échec » | R | C08:653 | |
| 16c.2 | 10/12/échec/20 → « de 10 rép. à l'échec » | C | min(10, 12, 20) = 10 ; forme C08:653, exemple C08:661 | **OK** |
| 16c.3 | 90/120/échec/150 s → « de 1 min 30 s à l'échec » | C | min = 90 s ; format C08:618 : 90 = 1×60 + 30 → « 1 min 30 s » | **OK** |
| 16c.4 | Minimum numérique, pas la première valeur | R | C08:639 (« min/max viennent des cibles actives ») | |

### ED-16/all-failure

| # | Assertion | Cl. | Source ou calcul | Commentaire |
|---|---|---|---|---|
| 16f.1 | Formulation « 3 séries jusqu'à l'échec » | X | C08:633 et CORPUS (« 3 séries menées jusqu'à l'échec », 72 occurrences vérifiées) ; C13:556 (huit cartes tout échec) | « menées » manque. L'intention (gabarit existant) est R ; le libellé littéral est X (cf. P3 de questions-ouvertes). |
| 16f.2 | Clauses existantes de pause et de côtés conservées | R | C08:633-637, 653 | |
| 16f.3 | Aucun total | R | C08:647 | |
| 16f.4 | Répétitions sans bip : jamais de total, même en cas mixte | R | C08:655 ; C10:711 | |

### ED-16/full-display

| # | Assertion | Cl. | Source ou calcul | Commentaire |
|---|---|---|---|---|
| 16d.1 | Phrase intégrale, sans troncature, à 360 et en texte agrandi, dans l'éditeur et sur les cartes | R | C13:4265-4269 ; C13:586 | |
| 16d.2 | Segments en gras corrects | R | C13:4265 | |
| 16d.3 | Aucune phrase persistée | R | C13:3031 ; C09:607 | |

### ED-17/corpus

| # | Assertion | Cl. | Source ou calcul | Commentaire |
|---|---|---|---|---|
| 17.1 | Les 276 cas historiques sont conservés | R | P:35 ; C08:655-657 | |
| 17.2 | Adaptation explicite des anciennes entrées « À l'échec » | T | C08:657 (« ne pas modifier rétroactivement le fichier source ») ; C09:1256 (phrase existante préservée) | Choix d'écriture des fixtures, cohérent avec les sources. |
| 17.3 | Nouveaux cas : échec à toutes les positions (≤ 3 et > 3), mélanges, bip 0 ou positif, côtés | R | C08:664 ; C10:741 (R16) | |
| 17.4 | Nouveaux cas : normalisation N=1, chaque ordre, pauses nulles ou variables | D | — | Cohérent : extension de couverture au-delà de C08:664. |
| 17.5 | Oracle indépendant du moteur testé | R | P:35 ; C10:741 ; C10:72 | |
| 17.6 | Matrice mode × bip × régime × cible × N × côté × pauses | T | — | Stratégie de test. |

### ED-18/migration

| # | Assertion | Cl. | Source ou calcul | Commentaire |
|---|---|---|---|---|
| 18m.1 | Deux modes dans les données | R | C09:607 | |
| 18m.2 | Ancien mode À l'échec → Répétitions avec toutes les cibles échec | R | C09:607, 1256 ; P:36 | |
| 18m.3 | Tous les paramètres conservés (nombre, pauses, bip, côté, ordre…) | R | C09:1256 | |
| 18m.4 | Identifiants conservés | D | — | Cohérent : « conserver » (C09:1256), et C09:1016 dit « sans dupliquer » pour une migration analogue. Non énoncé. |
| 18m.5 | Aucune cible fictive | R | C09:607 (« sans inventer ») ; C09:1246 | |
| 18m.6 | Définitions et copies transformées | R | C09:1258 | |
| 18m.7 | Liens, comptes et ordre des Catégories, Zones et médias inchangés | R | C09:1260 ; C09:498 ; C10:68 (RM-040) | |
| 18m.8 | Format JSON « v2 » ; base « v9 » migrée en « v10 » | T | — | Présuppose le format et le numéro de migration. Contraire à CLAUDE.md ; C09:1260 et 1274 laissent le numéro au code. |
| 18m.9 | Scalaires numériques nullable si la cible est échec | T | — | Attention : C09:1246 interdit qu'un « null ambigu » porte seul la distinction. Acceptable seulement en complément d'un type explicite. |
| 18m.10 | Empreintes des fichiers inchangées ; `foreign_key_check` vide | T | — | Mécanismes de preuve. Le fonctionnel sous-jacent (aucun média touché) est en 21.5. |

### ED-18/rollback

| # | Assertion | Cl. | Source ou calcul | Commentaire |
|---|---|---|---|---|
| 18r.1 | En cas d'échec, transaction intégralement annulée, sans état partiel | R | P:36 ; C09:1260 (« transformation atomique ») ; C13:3041 | |
| 18r.2 | `user_version` 9 conservé ; octets et relations identiques | T | — | Forme de preuve ; numéro présupposé. |
| 18r.3 | Corruption signalée ; aucun repli silencieux | D | — | Cohérent avec C09:1270 (« pas de troncature silencieuse ») et C13:3041. Le traitement d'un JSON corrompu n'est pas spécifié (message, blocage ?). **À préciser.** |
| 18r.4 | Échec injecté après reconstruction, avant COMMIT | T | — | |

### ED-18/definition-roundtrip

| # | Assertion | Cl. | Source ou calcul | Commentaire |
|---|---|---|---|---|
| 18d.1 | Après réouverture sur SQLite réelle, types et ordre exacts | R | C09:1230 ; P:36 (« SQLite réelle ») | |
| 18d.2 | Rejet atomique d'une cible non renseignée, sans écriture partielle | R | C13:3041 ; C09:1232 | |
| 18d.3 | « JSON v2 » et scalaires cohérents | T | — | |

### ED-18/session-roundtrip

| # | Assertion | Cl. | Source ou calcul | Commentaire |
|---|---|---|---|---|
| 18s.1 | Paramètres et R exacts après sauvegarde de la Séance et réouverture | R | C09:1230 (« R reste dans l'occurrence ») | |
| 18s.2 | Catégorie, Zones et médias conservés | R | C09:907 | |
| 18s.3 | Un échec de sauvegarde ne laisse aucun lien orphelin | R | C09:1232 ; C13:628 | |

### ED-19/copies

| # | Assertion | Cl. | Source ou calcul | Commentaire |
|---|---|---|---|---|
| 19c.1 | Copie et duplication profondes des collections (cibles typées, ordre) | R | P:37 ; C09:1230 ; C13:3033 | |
| 19c.2 | Mêmes fichiers physiques référencés, sans duplication ni suppression | R | C09:497, 915-917 ; C07:147 (D-115) | |
| 19c.3 | Ordre des médias conservé | R | C09:613 ; D-115 | |
| 19c.4 | Source et autres copies intactes après la modification d'une copie | R | C09:609 ; C13:548 | |

### ED-19/snapshot

| # | Assertion | Cl. | Source ou calcul | Commentaire |
|---|---|---|---|---|
| 19s.1 | Ancien instantané et résultats inchangés | R | C09:1228, 1258 | |
| 19s.2 | Lecture versionnée de l'ancien instantané, sans performance inventée | R | C09:1198, 1258 ; P:37 | |
| 19s.3 | Le nouvel instantané encode la cible typée | R | C09:1151, 1196 | |
| 19s.4 | Le nouvel instantané encode les médias ordonnés (références) | R | C09:565, 588 | |
| 19s.5 | « Octet », « empreinte », « v1/v2 » | T | — | |

### ED-19/no-write-on-cancel

| # | Assertion | Cl. | Source ou calcul | Commentaire |
|---|---|---|---|---|
| 19n.1 | Annuler la feuille ou l'éditeur n'écrit rien | R | C13:620, 636, 3031 | |
| 19n.2 | Aucune suppression physique de média à l'annulation | R | C09:498 | |
| 19n.3 | Hash des fichiers et tables inchangés | T | — | |

### ED-20 — Catégorie et Zones (attendu identique, ×2)

| # | Assertion | Cl. | Source ou calcul | Commentaire |
|---|---|---|---|---|
| 20.1 | Appui long : le clavier déjà affiché reste visible | R | C13:148 | |
| 20.2 | Enregistrement (↑ création en ligne) sans fermer le clavier | R | C07:575 (D-350) | |
| 20.3 | Annulation sans fermer le clavier | D | — | Non sourcé. D-347 (C07:565) supprime le bouton Annuler du formulaire de création et fait fermer la feuille par ✕. L'assertion n'est cohérente que pour l'annulation du dialogue d'appui long (C13:148). **À préciser.** |
| 20.4 | Nom vide : Ajouter désactivé, sans erreur | R | P3:98 ; P:38 | |
| 20.5 | ✓ applique au parent ; l'annulation préserve le choix antérieur et les données | R | C07:554 (D-343), 565 (D-347), 575 (D-350) | |
| 20.6 | Retour correct à la modale de sélection | R | C13:148 (« revenir à la modale de sélection restée ouverte ») | |

### ED-21/media-preservation

| # | Assertion | Cl. | Source ou calcul | Commentaire |
|---|---|---|---|---|
| 21.1 | Ordre et identité des médias conservés (import, réordonnancement, sauvegarde, réouverture) | R | P:39 ; C09:613 ; D-115 | |
| 21.2 | Erreurs réessayables | R | P:39 (« erreurs/réessai ») | |
| 21.3 | Erreurs « bornées » | D | — | Terme non défini. C13:564 demande de ne pas inventer de limite. |
| 21.4 | « Leases » de brouillon libérées selon le cycle existant | T | — | |
| 21.5 | Un fichier physique encore référencé n'est jamais supprimé ; retirer une seule référence n'efface pas le fichier partagé | R | C09:498, 917 ; P:39 | |
| 21.6 | La migration ne touche aucun média | D | — | Cohérent, comme conséquence de C09:498. Non énoncé. |

### ED-22/commun (fin commune à editor, sheet, target et referentials)

| # | Assertion | Cl. | Source ou calcul | Commentaire |
|---|---|---|---|---|
| 22.1 | Largeurs 360, 402 et 440 | R | C06:94 ; DSF2M:53 ; DSFG:8 ; C13:594, 3005 | Contrairement à l'hypothèse de départ, ces largeurs sont sourcées. |
| 22.2 | Texte agrandi | R | DSF2M:53 ; C13:594, 3005 | |
| 22.3 | Parcours VoiceOver (libellés, focus, lecture seule) | R | P:40 ; C13:3047 | |
| 22.4 | Toutes les actions sont possibles sans geste exclusif | R | P:40 ; C13:3023, 3047 | |
| 22.5 | Aucun débordement ; l'action finale reste accessible | R | C13:594, 3005 | |
| 22.6 | Cible tactile « DSF général 48 pt » | X | D-087 (C07:71), D-234 (C07:319), RM-095 (C10:178), C13:3047 (« cibles 44 minimum »), C12:1145 : **minimum commun 44×44**, et 48×48 seulement pour les dimensions spécifiques existantes. À l'inverse, C12:1089 retient « 48×48 commune ». | Les sources se contredisent entre elles. Le ch. 07 prime selon l'ordre de lecture (C13 §2). Le DSF général ne pose pas 48 comme règle commune : il ne le fait que pour Disclosure (DSFG:87, 119). |
| 22.7 | Sans agrandir artificiellement le dessin de 30 px | R | DSF2M:53 ; C12:1145 | |

### ED-22/editor

| # | Assertion | Cl. | Source ou calcul | Commentaire |
|---|---|---|---|---|
| 22e.1 | Nom et description annoncés | D | — | Cohérent ; aucun libellé d'accessibilité n'est spécifié pour ces champs (C13:632 ne traite que la phrase). |
| 22e.2 | Catégories et Zones annoncées avec leur état | D | — | Cohérent, non sourcé. |
| 22e.3 | Ordre de lecture : en-tête → nom → référentiels → paramètres → description → médias → Terminer | D | C13:576 (ordre de structure) | Cohérent : reprend l'ordre visuel, mais aucun texte n'en fait un ordre de focus. |
| 22e.4 | Focus restauré après la fermeture de la feuille | R | C13:632, 3047 | |

### ED-22/sheet

| # | Assertion | Cl. | Source ou calcul | Commentaire |
|---|---|---|---|---|
| 22s.1 | Focus « piégé » dans la feuille | R | C13:3047 (« focus modal contenu ») ; C13:594 (« parent inerte et hors parcours de focus ») ; DSF2M:53 | La formule de l'inventaire équivaut à la règle. |
| 22s.2 | ✕ et ✓ nommés | D | — | Cohérent, non sourcé. |
| 22s.3 | État variable annoncé | D | — | Cohérent. C13:3047 n'annonce que la cellule active et la lecture seule. |
| 22s.4 | Cible échec annoncée | R | C13:3047 | |
| 22s.5 | Total partiel annoncé en lecture seule | R | C13:3047 ; DSF2M:53 | |
| 22s.6 | Alternatives accessibles à la suppression et au réordonnancement | R | C13:3023, 3047 | |

### ED-22/target

| # | Assertion | Cl. | Source ou calcul | Commentaire |
|---|---|---|---|---|
| 22t.1 | Option sélectionnée annoncée explicitement | R | DSF2M:53 ; C13:3047 | |
| 22t.2 | Bloc grisé manipulable, y compris en accessibilité | R | DSF2M:33-35 | |
| 22t.3 | Valeur et unités annoncées | D | — | Cohérent. Pour le Bip, C13:3047 exige l'annonce de l'« intervalle en secondes » ; rien n'est écrit pour la roulette de cible. |
| 22t.4 | L'état n'est jamais transmis par le gris seul | R | DSF2M:53 ; C13:3047 | |

### ED-22/referentials

| # | Assertion | Cl. | Source ou calcul | Commentaire |
|---|---|---|---|---|
| 22r.1 | Nom vide : Ajouter désactivé, sans erreur | R | P3:98 | |
| 22r.2 | … et cet état est annoncé | D | — | Cohérent, non sourcé. |
| 22r.3 | Clavier préservé lors des actions | R | C13:148 ; D-350 | Même réserve que 20.3 pour l'annulation. |
| 22r.4 | Focus préservé ; après création ou édition, retour au contrôle d'origine | D | — | Cohérent avec C13:632 (éditeur). Non spécifié pour les référentiels. |

---

## 2. Les 32 états FIGMA (traitement en bloc)

Les 32 états partagent le même `expected`, à la frame près : « présenter l'état … selon les propriétés figées de la frame … ». Ils ont aussi le même `reason`, le même `given` (« données métier indépendantes des exemples PNG ») et le même `then` (« tous éléments visibles réalisés selon propriétés ; interactions documentées et actions accessibles conservées »). Les frames vont de 8328:35698 à 8328:39390, plus 8470:13303.

| # | Assertion | Cl. | Source ou calcul | Commentaire |
|---|---|---|---|---|
| F.1 | Chacune des 32 frames de référence est présentée dans le périmètre de l'éditeur | R | `references-figma.json` ; P:20, 40 ; MAT:21 (E13 : 19 états de feuille, 32 captures) | |
| F.2 | Rendu selon les propriétés de la frame : position, marges, typographie, couleur, contour | R | P:20 ; C06:57 ; C12:709, 727 | Figma pour le visuel seulement (D-255, D-300). Pas de coordonnées absolues (C06:57, 98). |
| F.3 | Propriétés « figées » (arbres du 13/10 comme oracle) | T | — | Mécanisme de comparaison VNext. Les données Figma restent des entrées communes. |
| F.4 | Données métier indépendantes des exemples PNG | R | C10:72, 635 ; C13:2979 | |
| F.5 | Interactions documentées et actions accessibles conservées | R | P:40 | |
| F.6 | 8328:38848, texte de fond « 3 séries menées jusqu'à l'échec, avec des pauses de 30 s, 45 s et 1 min. » (arbre Figma) | X | C08:637, 664 ; MAT:49 (R03) ; décision P1 de Hermann | Le reproduire « selon propriétés » contredirait la règle. Le préambule de la section (C13:4348, « les prescriptions sources prévalent … notamment les clauses de pauses variables ») le neutralise : à reprendre explicitement dans l'exigence. |
| F.7 | 8470:13303, « ≥ 2 min 15 s » | C | Cf. 13m.1 : 135 s | **OK** |
| F.8 | 8328:38409, message « Durée ajustée » | R | C10:615 ; C07 (D-340, D-346) | |
| F.9 | Titre d'en-tête « Créer un exercice » | D | — | Écart entre les PNG du 13/10 et du 14/10 (Δ11, Q9) : référence visuelle à arbitrer par Hermann sur appareil. |
| F.10 | `proof_required` FUNCTIONAL_TEST + VISUAL_COMPARE | T | — | Écarté (§3, T-0). Une suite verte ne vaut pas preuve visuelle (AGENTS.md). |

Le préambule (C13:4348) mentionne aussi « Portée autorisée #352 ». C'est du pilotage VNext, sans valeur produit (H3 de questions-ouvertes).

---

## 3. Libellé de l'option échec dans les données Figma locales

Recherche effectuée dans les 32 `docs/preparation/PRE-4/figma/*.json.gz` (gzip, JSON, champ `characters` des nœuds TEXT) :

- **8328:37862** (« Durée d'une série (roulette) ») : nœud TEXT `I8328:37967;8452:13320`, `characters` = **« Aucune durée, à l'échec »**. Police Inter Regular, 330×24 à y=3, remplissage #1a1a1f à **45 %** d'opacité : c'est l'état « cible chiffrée sélectionnée », conforme à DSF2M:31-33.
- **Aucune frame ne contient « Aucune répétition, à l'échec »** : aucune capture ne montre Répétitions avec l'option échec (Q8).
- 8328:38848 et 8470:13303 n'affichent que « à l'échec » dans les cellules du tableau. On y trouve aussi les phrases citées en F.6 et F.7.
- Les autres occurrences de « Aucun » correspondent au Bip (0 = Aucun).
- `fermeture-maitres-et-variables.json.gz`, cité dans sources-retenues §4, **n'est pas présent** dans `docs/preparation/PRE-4/figma/` de ce clone. Le maître 8452:13297 n'a donc pas pu être lu.

**Conséquence pour Q10.** Le libellé est fixé par les sources normatives (DSF2M:21 et C13:3015, CE-UI-10 §12) **et** par Figma pour la Durée. La prémisse de Q7 et Q10 (libellés « présents seulement dans la section exclue ») est inexacte : à corriger dans `questions-ouvertes.md`.

---

## 4. Synthèse

### 4.1 Comptes

Les assertions uniques sont comptées. Les états regroupés (ED-01 ×4, ED-20 ×2) et la fin commune d'ED-22 ne sont comptés qu'une fois.

| Bloc | R | C | T | D | X | Total |
|---|---|---|---|---|---|---|
| 51 DOCUMENT_ONLY | 150 | 12 | 15 | 21 | 3 | 201 |
| 32 FIGMA (bloc) | 5 | 1 | 2 | 1 | 1 | 10 |
| **Ensemble** | **155** | **13** | **17** | **22** | **4** | **211** |

### 4.2 Calculs (tous recalculés depuis C10:603-611, 660-662 et C08:613-618)

| Attendu | Calcul | Résultat |
|---|---|---|
| 105 s / ≥ 1 min 45 s | 30+45 + 3×10 | OK (= R01) |
| 74 s / ≥ 1 min 14 s | (10+12)×2 + 30 | OK (= R02) |
| 30 s de pauses (sans bip, tout échec) | 3×10 | OK |
| 165 s exact | 30+45+60 + 30 | OK |
| 104 s estimated | (10+12+15)×2 + 30 | OK |
| 135 s / 2 min 15 s (mixte Figma) | 75 + 10+20+30 | OK |
| 135 s « intrinsèque » + 15 = 150 s | intrinsèque 105 ; To = 105−10+40 = 135 ; +10+5 = 150 | Montants OK. **Écart de terme** (135 = occurrence, pas intrinsèque) ; métrique non précisée (150 en plan complet, 135 en durée synthétique). |
| 60 s de travail connu, bilatéral | 2 côtés × 30 | OK |
| « de 10 rép. à l'échec » | min(10,12,20) | OK |
| « de 1 min 30 s à l'échec » | min = 90 s → 1 min 30 s | OK |

### 4.3 Attendus repris comme exigences (R et C)

Tous les R et C du §1 et du §2 peuvent être repris, avec leur source normative comme référence. Les plus structurants pour le PRD :

- **ED-07 et ED-08 :** libellés « Aucune durée, à l'échec » et « Aucune répétition, à l'échec » ; option échec en tête, sans coche ; opacités 100 % et 45 % ; bloc 00:00 grisé mais manipulable ; tourner la roulette revient au numérique ; ✕ restaure ; Répétitions en roulette 1 à 100 (Q8).
- **ED-09 :** Durée de 5 à 3535 s au pas de 5, Répétitions de 1 à 100, 00:00 refusé, pause 0 valide, valeurs historiques lues sans arrondi.
- **ED-10 à ED-12 :** deux colonnes même en tout échec ; un champ actif ; pied commun sur la cellule active ; bascules, réserves, N=1 et réordonnancement selon C08:251-261.
- **ED-13 à ED-15 :** natures exact, estimated, lowerBound et omitted ; montants 105, 74, 165, 104 et 135 s ; pauses conservées dans l'agrégat ; inverse interdit dès qu'une cible est échec ; remplacement de la Pause terminale par R.
- **ED-16 et ED-17 :** énumération jusqu'à trois cibles, compaction au minimum numérique ; tout échec en « menées jusqu'à l'échec » ; aucune phrase persistée ; corpus de 276 cas conservé, oracle indépendant.
- **ED-18, ED-19 et ED-21 :** migration conservatrice et atomique ; définitions et copies ; snapshots versionnés immuables ; médias partagés jamais supprimés tant qu'ils sont référencés.
- **ED-20 et ED-22 :** clavier maintenu à l'appui long et à la création ; nom vide → Ajouter désactivé sans erreur ; largeurs 360, 402 et 440 ; texte agrandi ; focus modal ; annonces de l'option, du total partiel et de la lecture seule ; jamais par le gris seul.

### 4.4 Liste T, pour l'architecture (hypothèses non contraignantes)

- **T-0 :** `state_id`, `scenario_id`, `reason`, `proof_required` (FUNCTIONAL_TEST, VISUAL_COMPARE, ACCESSIBILITY_CHECK, DEVICE_CHECK), « propriétés figées » comme oracle.
- **Format :** JSON `v1/v2`, adaptateur v1 (05.4, 18m.8, 18d.3, 19s.5).
- **Migration :** « base v9 → v10 », `user_version 9` (18m.8, 18r.2). Le code contient déjà `migration001` à `migration009` ; le numéro n'est pas une exigence.
- **Scalaires numériques nullable** si la cible est échec (18m.9), sous la contrainte C09:1246 : pas de `null` ambigu porteur seul de la distinction.
- **`UNSET`** comme nom de l'état non renseigné (06.6).
- **`ledger`** de contributions, annoté par côté et par ligne (13d.4, 13n.2, 15b.5).
- **`foreign_key_check`**, empreintes et hash de fichiers, octets identiques, injection d'échec avant COMMIT (18m.10, 18r.2, 18r.4, 19n.3).
- **`leases`** de médias en brouillon (21.4).
- Fixtures adaptées du corpus et matrice de test (17.2, 17.6).
- `BY_SIDE` et `sideRecovery` : identifiants du code (`ExecutionParameters.ts:25`, `sideRecoverySeconds` C08:244), sans valeur d'exigence.

### 4.5 Liste D, à signaler à Hermann

| # | Déduction | Nature |
|---|---|---|
| 09h.3 | Présentation d'une valeur historique hors grille (31 s) dans une roulette au pas de 5, avec une valeur valide exigée pour la modifier | Cohérente mais **non spécifiée**. Arbitrage UX nécessaire. |
| 15k.5 | Métrique du montant de 150 s : plan complet (Durée estimée d'exécution) ou Durée synthétique (135 s) | **À préciser** |
| 18r.3 | JSON corrompu à la migration : « signalé, sans repli silencieux » | Cohérente ; le comportement visible n'est pas spécifié. |
| 20.3 / 22r.3 | Clavier maintenu lors d'une « annulation » | Non sourcé. D-347 supprime l'Annuler du formulaire de création. |
| 21.3 | Erreurs média « bornées » | Terme non défini ; C13:564 interdit d'inventer des limites. |
| 02.3 | Pas d'accordéon ni de carte en grille par défaut | Non sourcé ; constat de code. |
| 03.3 | Retour du focus au déclencheur d'un popover | Cohérente |
| 22e.1-3, 22s.2-3, 22t.3, 22r.2, 22r.4 | Libellés d'accessibilité (nom, description, ✕, ✓, état variable, valeur et unités), ordre de lecture VoiceOver, focus des référentiels | Cohérentes, non sourcées |
| 10.5, 11.5, 18m.4, 21.6, 17.4 | Pause indépendante des cibles ; côtés et phases conservés à la bascule ; identifiants conservés ; migration sans effet sur les médias ; couverture étendue du corpus | Cohérentes, implicites |
| 09h.2 | Valeurs de test 31 s et 5999 s | Exemples, pas des règles |
| F.9 | Titre « Créer un exercice » (Δ11 / Q9) | Ouvert |

Les éléments que la consigne présentait comme des D probables se sont révélés **sourcés** : « Aucune durée » et « Aucune répétition » (DSF2M:21, C13:3015), 360/402/440 (C06:94, DSF2M:53), « aucune récupération ajoutée automatiquement » (C08:245, RM-038), « focus piégé » (C13:3047, « focus modal contenu »).

### 4.6 Liste X, contradictions

| # | Assertion de l'inventaire | Source contredite | Proposition |
|---|---|---|---|
| 22.6 | Cible tactile « DSF général 48 pt » | D-087 (C07:71), D-234 (C07:319), RM-095 (C10:178), C13:3047 : minimum 44×44, avec 48 conservé pour les dimensions spécifiques. Le ch. 12 se contredit lui-même : C12:1089 (48 commune) contre C12:1145 (44 minimum). | Le ch. 07 prime. Exiger 44×44 minimum et conserver les 48×48 spécifiques. **À confirmer par Hermann**, à cause de la contradiction interne du ch. 12. |
| 16f.1 | « 3 séries jusqu'à l'échec » | C08:633, CORPUS (« menées jusqu'à l'échec ») | Reprendre la forme du corpus (déjà retenue en P3). |
| 15k.3 | 135 s qualifiés de total « intrinsèque » | C10:603-611 (intrinsèque 105 s ; 135 s = occurrence To) | Ne garder que les montants, avec les bons termes. |
| F.6 | Reproduire 8328:38848 « selon propriétés », pauses énumérées comprises | C08:637, 664 ; MAT:49 (R03) ; P1 | Exclure explicitement le texte de fond, comme le préambule l'indique. |

Une contradiction préalable est résolue et non comptée : C13:125 (stepper en ligne pour « Nombre de répétitions ») contre la roulette de cible en Répétitions, tranchée par Q8.
