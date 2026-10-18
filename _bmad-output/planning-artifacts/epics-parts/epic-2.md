## Epic 2 : Des durées et des phrases justes pour les Cibles à l'échec

**Objectif.** Pour tout Exercice, y compris à Cibles mixtes ou tout à l'échec, l'application calcule la Durée totale exacte, estimée (≈), partielle (≥) ou omise, avec un seul calcul et un seul formateur (AD-5). La Séance et le Circuit prennent la nature la plus faible de leurs contributions. Les Pauses d'un Exercice omis y contribuent toujours, et une Récupération positive remplace seulement la Pause terminale. La Phrase des paramètres décrit les Cibles dans l'ordre (Q16) avec un seul générateur (AD-6). Les 276 phrases de référence restent identiques, et des variantes couvrent les cas nouveaux (AD-10). Les cartes Catalogue et Composition affichent la durée selon Q17, Q20 et P41, sans « 0 s » ni « 0 rép. ».

**S'appuie sur :** Epic 1, en particulier 1.1 (type `SeriesTarget` `NUMBER | FAILURE | UNSET`, Mode à deux valeurs, lecteurs v1 et v2, `validateForSave` structurel, adaptation mécanique des consommateurs) et 1.3 (copies, duplications et Instantanés à Cibles typées).

**Conventions de l'epic.**
- Les attendus chiffrés sont recalculés **par formule dans le test**, jamais par `executionCalculations` ni repris d'une capture Figma ou d'Excel (AD-10, FR-13-06, FR-17-02, D-300).
- Les gabarits sont cités entre accents graves, au caractère près, avec l'apostrophe typographique ’.
- **Points signalés.** Les écarts relevés entre le PRD, la spine et le code de départ sont repérés `C-E2-n`. Ils sont listés en fin d'epic, avant la table de couverture, avec la décision ou la règle qui les tranche. Un critère qui dépend d'un point encore ouvert le dit ; il ne doit pas être développé dans une autre lecture sans arbitrage.

---

### Story 2.1 : Nature et montant de la Durée totale d'un Exercice

En tant que Hermann (utilisateur de KODJO),
je veux que la Durée totale de chaque Exercice soit calculée Série par Série, y compris quand certaines Cibles sont à l'échec,
afin de connaître le temps prévu exact, estimé ou partiel sans jamais lire un montant inventé.

**Exigences :** FR-13-01, FR-13-02, FR-13-03, FR-13-04, FR-13-05, FR-13-06 ; FR-14-02, FR-14-03 (partie domaine) ; NFR-05, NFR-06, NFR-11, NFR-13 ; P25, P42, H10, Q30, Q7 (13a, 13b, 13d, 13f, 13m, 13n, 14i).
**Architecture :** AD-5 (propriétaire unique du résultat `exact | estimated | lowerBound | omitted | incomplete`, disponibilité de l'Inversion du total), AD-1 (Cible typée), AD-10 (attendus par formule). Fichiers principalement touchés (indicatif) : `src/domain/activities/executionCalculations.ts` et ses tests ; consommateurs existants du résultat, en adaptation de type seulement : `src/domain/sessions/calculations.ts`, `src/features/activities/ActivityCard.tsx`, `src/features/activities/ExecutionParametersSheet.tsx`, `src/domain/activities/executionPhrase.ts`.
**Dépend de :** 1.1, 1.3 (l'AC8 rejoue le calcul après une copie de Définition vers Séance et sur un Instantané v2, livrés par 1.3, antérieure dans l'ordre arrêté).
**Hypothèses non validées :** H8, H10, H28 — à confirmer par la revue ChatGPT/Hermann avant développement.

**Critères d'acceptation :**

**AC1 — Travail de chaque Série (FR-13-01)**
**Given** des Paramètres d'exécution à Cibles typées
**When** le domaine détermine le travail de chaque Série
**Then** Mode Durée, Cible `NUMBER` d → Ti = d, travail connu
**And** Mode Répétitions, Cible `NUMBER` Ri, Bip b > 0 → Ti = Ri × b, travail estimable
**And** Cible `FAILURE`, en Durée comme en Répétitions, avec ou sans Bip → travail inconnu
**And** Mode Répétitions, Bip 0 → travail inconnu, même avec une Cible `NUMBER`
**And** aucun forfait par répétition n'est utilisé : en Répétitions sans Bip, aucun montant de travail n'apparaît, quelle que soit la Cible (D-232, Q7 15b.4)
**And** en Durée, le Bip ne change pas le total : N = 4, Ti = 60 s, b = 4 s, Pause 15 s → 4 × (60 + 15) = **300 s**, nature exacte.

**AC2 — Nature de la Durée totale de l'Exercice (FR-13-02, P25)**
**Given** un Exercice dont toutes les Cibles sont renseignées (`NUMBER` ou `FAILURE`)
**When** sa Durée totale intrinsèque est calculée
**Then** la nature suit exactement ce tableau :

| Mode | Bip | Cibles | Nature |
|---|---|---|---|
| Durée | 0 ou > 0 | toutes `NUMBER` | `exact` |
| Répétitions | > 0 | toutes `NUMBER` | `estimated` |
| Durée | 0 ou > 0 | mélange `NUMBER` et `FAILURE` | `lowerBound` |
| Répétitions | > 0 | mélange `NUMBER` et `FAILURE` | `lowerBound`, jamais `estimated` (≥ prime sur ≈) |
| Répétitions | 0 | toutes `NUMBER`, mélange ou toutes `FAILURE` | `omitted` |
| Durée ou Répétitions | 0 ou > 0 | toutes `FAILURE`, Pauses positives ou nulles | `omitted` |

**And** la nature `lowerBound` porte le montant connu ; `omitted` ne porte aucun montant, mais conserve les contributions connues (Pauses, Pause au changement de côté) pour l'agrégation (2.2)
**And** le montant d'une Pause change le montant, jamais la nature
**And** RM-072 « omitted … À l’échec » est appliqué au seul cas tout à l'échec ; le mélange suit RM-129 et RM-132 (P25).

**AC3 — Total partiel d'un mélange (FR-13-03)**
**Given** un Exercice à Cibles mixtes, unilatéral, seul (sans Récupération)
**When** son total est calculé
**Then** montant = Σ Ti des Séries à travail connu ou estimable + Σ Pi de **toutes** les Séries, y compris la Pause qui suit une Série à l'échec et la Pause terminale ; le travail inconnu n'ajoute rien
**And** R01 — Durée, Régime variables, Cibles 30 s / 45 s / `FAILURE`, Pauses 10 s × 3 → (30 + 45) + 30 = **105 s**, `lowerBound`
**And** R02 — Répétitions, Cibles 10 / 12 / `FAILURE`, Bip 2 s, Pauses 10 s × 3 → (10 × 2 + 12 × 2) + 30 = **74 s**, `lowerBound` (et non `estimated`)
**And** R03 — même Exercice qu'en R02 avec Bip 0 → `omitted`, aucun montant ; contributions connues **30 s**
**And** R04 — trois Cibles `FAILURE`, Pauses 10 s × 3, en Durée et en Répétitions, Bip 0 et 2 s (quatre combinaisons) → `omitted` ; contributions connues **30 s**
**And** mixte Figma — Durée, Cibles 30 s / 45 s / `FAILURE`, Pauses 10 s / 20 s / 30 s → 75 + 60 = **135 s**, `lowerBound` (montant obtenu par la règle, NFR-01, D-255)
**And** contrôles tout numériques — Durée 30 s / 45 s / 60 s, Pauses 10 s × 3 → 135 + 30 = **165 s**, `exact` ; Répétitions 10 / 12 / 15, Bip 2 s, Pauses 10 s × 3 → 37 × 2 + 30 = **104 s**, `estimated`
**And** plus de 3 Cibles — Durée 30 s / 45 s / 60 s / `FAILURE`, Pauses 10 s × 4 → 135 + 40 = **175 s**, `lowerBound` ; Répétitions 10 / 12 / 15 / `FAILURE`, Bip 2 s, Pauses 10 s × 4 → 37 × 2 + 40 = **114 s**, `lowerBound` (montants repris par la Phrase en 2.3, FR-16-09).

**AC4 — Formules du total intrinsèque, Cibles typées (FR-13-04)**
**Given** les formules unilatérale, un côté après l'autre, les deux côtés à chaque série et N = 1 bilatéral normalisé
**When** les attendus normatifs sont recalculés avec des Cibles `NUMBER`
**Then** ils valent tous :

| Cas | Paramètres | Attendu |
|---|---|---|
| A | unilatéral, 30 s / 45 s / 60 s, Pauses 10 / 20 / 30 s | **195 s** |
| B | A suivi d'une Récupération de 120 s (durée d'occurrence) | **285 s** |
| C | A, un côté après l'autre, PC 15 s | **405 s** |
| D | A, les deux côtés à chaque série, PC 15 s | **375 s** |
| E | Répétitions 12 / 10 / 8, Bip 0, Pauses 30 / 45 / 60 s | `omitted`, **135 s** de Pauses connues |
| F | toutes `FAILURE`, Bip 0 puis 4 s, Pauses 30 / 45 / 60 s | `omitted` dans les deux cas |
| Uniforme | N 3, d 90 s, p 15 s | **315 s** |
| Bilatéral | N 3, d 90 s, p 15 s, PC 10 s | un côté après l'autre **640 s** ; les deux côtés à chaque série **615 s** |
| N 1 bilatéral | d 90 s, p 15 s, PC 10 s | **220 s** ; suivi d'une Récupération de 30 s → **235 s** |
| Douze séries | travail total 390 s, Pause 10 s | **510 s** |
| Répétitions avec Bip | N 4, Ri 15, b 4 s, p 15 s | **300 s**, `estimated` |
| Une Série | Ti 30 s, p 15 s | **45 s** |

**And** une Pause suit chaque Série, la dernière comprise, même à N = 1 et avec une PC ; une Pause de 0 s ne crée aucune phase ; PC = 0 ne supprime ni ne remplace Pi
**And** Compte à rebours et Fin sont exclus du total intrinsèque
**And** en Régime variables, Cibles et Pauses viennent de chaque ligne dans l'ordre effectif ; après déplacement de la dernière ligne, la nouvelle dernière ligne porte PN.

**AC5 — Cible à renseigner : ni durée, ni omission (FR-13-05, H10, Q30)**
**Given** un Exercice dont au moins une Cible est `UNSET` (brouillon, ou héritée de `migration010`)
**When** sa Durée totale est demandée, en Durée ou en Répétitions avec ou sans Bip
**Then** le domaine rend l'issue `incomplete`, distincte des quatre natures et d'`omitted` : aucun montant de Durée totale d'Exercice, donc aucune ligne ni aucun total affiché pour cet Exercice (H10, H28)
**And** `incomplete` porte, pour l'agrégation de 2.2, les contributions connues de l'Exercice calculées comme pour un mélange avec échec (AC3, FR-13-03) : travail connu ou estimable des Séries dont la Cible est `NUMBER`, plus toutes les Pauses (et PC) ; le travail de la Série `UNSET` est inconnu et n'ajoute rien (Q30). Attendu : Durée, Régime variables, Cibles 30 s / `UNSET` / 45 s, Pauses 10 s × 3, unilatéral → `incomplete`, contributions connues (30 + 45) + (10 + 10 + 10) = **105 s** ; même Exercice en Répétitions Bip 0, Cibles 10 / `UNSET` / 12 → contributions connues **30 s** (Pauses seules, travail inconnu sans Bip)
**And** la Cible n'est jamais convertie en `FAILURE` ni lue comme 0
**And** une Cible `FAILURE` explicitement choisie reste valide sans nombre (AC2).

**AC6 — Disponibilité de l'Inversion du total (FR-14-02, partie domaine, P42)**
**Given** des Paramètres d'exécution
**When** le domaine qualifie la disponibilité de l'Inversion du total
**Then** elle est disponible **si et seulement si** Mode Durée, Régime identiques, Cible `NUMBER` et N non hérité
**And** elle est indisponible pour une Cible `FAILURE` (Régime identiques) ou `UNSET`, en Régime variables (quelles que soient les Cibles) et en Mode Répétitions
**And** N hérité d'un circuit de séries : la fonction de disponibilité reçoit un indicateur d'héritage en entrée (forme introduite ici, non persistée en v2, reprise par 3.2 AC14) ; avec l'indicateur vrai, l'Inversion est indisponible, y compris avec des Cibles à l'échec. PRE-4 ne produisant aucun N hérité (FR-12-07, Composition hors périmètre), cette conséquence est une exigence de compatibilité du modèle, vérifiée par un test du domaine seulement, sans parcours d'interface ni recette (P42)
**And** l'appel de l'Inversion sur des paramètres non disponibles est une entrée invalide (levée), jamais un résultat silencieux.

**AC7 — Calcul de N à partir d'une Durée totale choisie (FR-14-03, partie domaine)**
**Given** un Exercice en Durée, Régime identiques, Cible `NUMBER` d, Pause p
**When** une Durée totale Tv est demandée
**Then** N ∈ 1..99 ; candidats unilatéral `arrondi(Tv / (d + p))`, un côté après l'autre `arrondi((Tv − PC) / (2(d + p)))`, les deux côtés à chaque série `arrondi(Tv / (2d + p + PC))`, et N = 1 évalué avec l'Ordre normalisé par côté ; le total réalisable le plus proche est retenu ; à égalité, le plus grand N
**And** un N = 1 issu de l'Inversion est normalisé (Régime identiques, par côté si bilatéral)
**And** bornes : de T(1) à T(99) pour les paramètres courants, au pas d'une seconde, sans plafond à 58 min 55 s. Attendu : unilatéral, d = 30 s, p = 10 s → T(1) = **40 s**, T(99) = **3 960 s** (formaté `66 min` par 2.2, H8)
**And** Tv = 160 s → N = 4, T(4) = 160 s, ajustement faux
**And** Tv = 180 s → N = 4 (160 s) et N = 5 (200 s) à égale distance → N = 5, T(5) = **200 s**, ajustement vrai (message littéral et `Annuler` : story 3.7, FR-14-04)
**And** les bornes et l'Inversion ne s'appliquent qu'à une Cible `NUMBER` ; aucune valeur à l'échec n'entre ni ne sort de ce calcul (roulette sans option à l'échec : story 3.7).

**AC8 — Calculs tirés des seules règles (FR-13-06)**
**Given** la suite de tests de `executionCalculations`
**When** elle s'exécute
**Then** chaque attendu de AC1 à AC7 est une constante écrite ou une formule calculée dans le test ; aucun n'est produit par la fonction testée, lu dans Figma ni dans la colonne J d'Excel
**And** la matrice couvre : unilatéral, `RIGHT_LEFT` et `LEFT_RIGHT`, chacun en `BY_SIDE` et `BY_SERIES` ; Pause 0 et PC 0 ; Récupération nulle et positive ; N = 1 et N = 99 ; Cibles mixtes en tête, au milieu et en fin
**And** le même Exercice, après un changement de Mode aller-retour par la fonction du Brouillon existante, après le déplacement de sa dernière ligne, après une copie de Définition vers Séance (1.3) et relu depuis un Instantané v2 (1.3), donne le même montant et la même nature que l'original, à paramètres identiques.

**AC9 — Consommateurs existants pendant la transition (NFR-06, NFR-11)**
**Given** les consommateurs existants du résultat (`calculations.ts`, `ActivityCard.tsx`, `ExecutionParametersSheet.tsx`, `executionPhrase.ts`)
**When** la nature `lowerBound` d'Exercice est introduite
**Then** chacun compile en traitant les cinq issues (quatre natures et `incomplete`) de façon exhaustive
**And** aucun n'affiche un montant `lowerBound` sans le préfixe `≥ ` ; aucun n'affiche `0 s` ni un tiret pour `omitted` ou une Cible à renseigner
**And** aucun nouveau gabarit ni nouveau formateur n'est introduit ici ; ils viennent de 2.2, 2.3 et 2.4.

**Preuves attendues :** tests unitaires de `executionCalculations` (AC1 à AC8, tableaux littéraux ci-dessus) ; tests existants de calcul et de Séance adaptés, sans affaiblissement ; `npm test`, `npx tsc --noEmit`, `npm run lint` verts. Recette iPhone : **R-2.1-01** — Exercice migré tout à l'échec (données de `recette-iphone.md` §2) ouvert dans l'Éditeur : la carte et la Feuille n'affichent aucune Durée totale, ni `0 s` ni tiret. Une suite verte ne vaut pas recette visuelle (NFR-04).
**Hors story :** format des durées et agrégation de Séance (2.2) ; Phrase (2.3) ; cartes (2.4) ; ligne Durée totale de la Feuille, roulette, message d'ajustement et annonces VoiceOver (3.7 : FR-14-01, FR-14-04, FR-14-05) ; relevés d'exécution R05 à R13 (moteur d'exécution).

---

### Story 2.2 : Format des durées et agrégation de Séance

En tant que Hermann (utilisateur de KODJO),
je veux que toutes les durées s'écrivent de la même façon et que la durée de mes Séances tienne compte des Pauses, des Récupérations et des Exercices à l'échec,
afin que le temps annoncé pour une Séance ne soit jamais faux, gonflé ni minoré à tort.

**Exigences :** FR-17-01 (format) ; FR-15-02, FR-15-03, FR-15-04, FR-15-05 ; FR-13-05 (contribution d'une Cible à renseigner à l'agrégat, AC4, Q30 ; porteur : 2.1) ; NFR-03, NFR-06, NFR-08, NFR-11 ; H8, Q30, P25, P31, P41, Q4, Q7 (13n.2, 15b, 15k).
**Architecture :** AD-5 (formateur unique `durationFormat.ts`, `formatPhraseDuration` adopté ; pli d'agrégation ; `computeOccurrenceDuration` substitue PN par R avant de qualifier la nature ; `formatEstimatedDuration` des cartes de Séance inchangé), AD-10. Fichiers principalement touchés (indicatif) : `src/domain/activities/durationFormat.ts` (nouveau), `src/domain/activities/executionPhrase.ts` (import du formateur), `src/domain/activities/executionCalculations.ts` (`aggregateSessionDuration`, `computeOccurrenceDuration`), `src/domain/sessions/calculations.ts`.
**Dépend de :** 2.1.
**Hypothèses non validées :** H8 — à confirmer par la revue ChatGPT/Hermann avant développement.

**Critères d'acceptation :**

**AC1 — Un seul formateur de durée (FR-17-01, H8)**
**Given** une durée de x secondes entières
**When** elle est formatée
**Then** 0 → `0 s` ; 15 → `15 s` ; 60 → `1 min` (jamais `60 s`) ; 90 → `1 min 30 s` ; 1 265 → `21 min 5 s`
**And** au-delà de 59 min, les minutes continuent sans heures : 3 665 → `61 min 5 s` ; 3 960 → `66 min` ; 4 500 → `75 min`
**And** ce formateur est défini une seule fois, dans `src/domain/activities/durationFormat.ts`, en fonction pure ; la Phrase (2.3), la Feuille et les cartes (2.4) l'importent ; aucun autre module ne formate une durée d'Exercice en minutes et secondes
**And** les 520 durées du Corpus 276 sont produites sans écart (contrôlé par le test du corpus, 2.3).

**AC2 — Récupération positive en remplacement de la seule Pause terminale (FR-15-02)**
**Given** un Exercice de total intrinsèque T, de dernière Pause PN, suivi dans une Séance d'une Récupération R
**When** la durée d'occurrence To est calculée
**Then** To = T − PN + R si R > 0 ; To = T si R = 0 ; R n'est jamais ajoutée deux fois ; R = 0 ne crée aucune phase et ne supprime pas PN ; la Pause du premier côté reste intacte
**And** la substitution précède la qualification de la nature, pour toutes les issues (quatre natures et `incomplete`)
**And** attendu — Durée 30 s / 45 s / `FAILURE`, Pauses 10 s × 3, unilatéral, Récupération 40 s : intrinsèque **105 s** ; occurrence 105 − 10 + 40 = **135 s**, `lowerBound`, formaté `≥ 2 min 15 s`
**And** retirer la Récupération rétablit PN ; après un déplacement de Séries, la nouvelle dernière ligne est déterminée avant la substitution
**And** un Exercice calculé seul n'a aucune Récupération : PN reste comptée ; aucune Récupération n'est créée automatiquement (RM-038, D-307).

**AC3 — Pauses d'un Exercice omis ou partiel dans le total (FR-15-03)**
**Given** un Exercice dont la Durée totale propre est `omitted` ou `lowerBound`
**When** il contribue à une Séance ou à un Circuit
**Then** ses Pauses, sa PC et sa R contribuent ; le travail inconnu n'ajoute rien ; chaque phase chronométrée et chaque travail estimable sont comptés une seule fois
**And** Répétitions 10 / 12 / `FAILURE`, Bip 0, Pauses 10 s × 3, unilatéral → contribution **30 s** ; suivi d'une Récupération de 40 s → 10 + 10 + 40 = **60 s**
**And** trois Cibles `FAILURE`, Pauses 10 s × 3 → contribution **30 s**, Séance `lowerBound`
**And** bilatéral — Durée, Régime variables, N = 2 par côté, Cibles 30 s / `FAILURE`, `Les deux côtés à chaque série`, Pauses 10 s / 10 s, PC 5 s : travail connu 2 × 30 = **60 s** ; intrinsèque 60 + 20 + 2 × 5 = **90 s**, `lowerBound`, `≥ 1 min 30 s` ; suivi d'une Récupération de 40 s → 90 − 10 + 40 = **120 s**, `≥ 2 min` ; succession D1 → PC → G1 → P1 → D2 → PC → G2 → P2 comptée une fois
**And** contrôle `Un côté après l’autre`, mêmes Cibles, Pauses 10 s, PC 5 s → 2 × (30 + 10 + 10) + 5 = **105 s** ; occurrence avec R = 40 s → **135 s**, `lowerBound`
**And** la Cible typée s'applique aux deux côtés.

**AC4 — Nature du total de Séance et de Circuit (FR-15-04, FR-13-05, P25, Q30)**
**Given** les contributions d'une Séance ou d'un Circuit
**When** elles sont agrégées
**Then** nature `lowerBound` si au moins une contribution est `lowerBound`, `omitted` ou `incomplete` ; sinon `estimated` si au moins une est `estimated` ; sinon `exact`
**And** montant = Σ des montants `exact`, `estimated` et `lowerBound` + Σ des contributions connues des `omitted` et des `incomplete` (pour `incomplete` : travail connu ou estimable des Séries numériques et toutes les Pauses, 2.1 AC5)
**And** Copie en Séance dont une Cible héritée est à renseigner (donnée migrée, Q30) : le travail de la Série à renseigner est inconnu ; le travail connu des autres Séries et les Pauses contribuent, comme pour un mélange avec échec ; la Séance est partielle ; ce n'est pas une omission. Attendu : Séance d'un Exercice seul de 165 s `exact` et d'une Copie Durée 30 s / `UNSET` / 45 s, Pauses 10 s × 3, unilatérale, sans Récupération → contribution de la Copie (30 + 45) + (10 + 10 + 10) = 105 s ; Séance 165 + 105 = **270 s**, `lowerBound`
**And** attendus — Séance de deux Exercices seuls, sans Récupération : 165 s `exact` + 104 s `estimated` → **269 s**, `estimated` ; 165 s `exact` + 105 s `lowerBound` → **270 s**, `lowerBound` ; 165 s `exact` + Répétitions Bip 0 (Pauses 30 s connues) → **195 s**, `lowerBound`
**And** un Exercice placé dans un Circuit répété k fois compte k fois, sans multiplicateur double ; une Récupération interne au Circuit est comptée à chaque répétition, jamais deux fois par répétition. Attendu : Circuit répété 2 fois contenant le seul Exercice R01 (105 s, `lowerBound`) → **210 s**, `lowerBound`
**And** l'omission reste propre à l'Exercice concerné : elle ne retire aucune contribution des autres.

**AC5 — Périmètre de chaque mesure (FR-15-05, P31, P41)**
**Given** un Exercice dans une Séance
**When** les mesures de durée sont calculées
**Then** le Compte à rebours et la Fin propres de l'Exercice ne sont ni exécutés ni comptés dans la Séance ; seuls le Compte à rebours initial et la Fin de séance appartiennent au plan de la Séance
**And** la Durée estimée d'exécution de la Séance compte le plan complet, Compte à rebours initial et Fin de séance compris
**And** la mesure intrinsèque (Catalogue, PC comprise) et la mesure d'occurrence (Composition, avec R, répétitions de Circuit développées) sont deux fonctions distinctes, qui excluent le Compte à rebours initial et la Fin de séance
**And** attendu P31 — l'Exercice de l'AC2 (occurrence 135 s), seul dans une Séance avec un Compte à rebours initial de 10 s et une Fin de séance de 5 s : Durée estimée d'exécution 135 + 10 + 5 = **150 s**, `lowerBound` ; le montant de base est l'occurrence (135 s), pas l'intrinsèque (105 s). L'attendu porte sur le montant et la nature ; l'affichage sur la Séance suit son formateur actuel, inchangé (AC6, P41), sans attendu de texte propre à PRE-4.

**AC6 — Cartes de Séance inchangées dans leur forme (AD-5, P41)**
**Given** une Séance dont la nature devient `lowerBound` à cause d'un Exercice partiel, omis ou à Cible à renseigner
**When** sa carte de Séance est affichée
**Then** la durée passe par `formatEstimatedDuration` sans modification de ce formateur, pour toutes les natures, avec le symbole de la nature agrégée ; Q20 ne s'applique pas à la carte de Séance (P41)
**And** les symboles `≈` et `≥` viennent du lexique (NFR-08).

**Preuves attendues :** tests unitaires du formateur (toutes les valeurs de l'AC1), de `computeOccurrenceDuration` et du pli d'agrégation (AC2 à AC5), avec attendus par formule dans le test ; tests de `calculations.ts` et de Séance existants verts sans affaiblissement ; `npm test`, `npx tsc --noEmit`, `npm run lint` verts. Recette iPhone : **R-2.2-01** — Séance contenant un Exercice migré tout à l'échec, avec Pauses : la carte de Séance affiche une durée précédée de `≥`, Pauses comprises, jamais `0 s`. Une suite verte ne vaut pas recette visuelle (NFR-04).
**Hors story :** rendu des durées sur les cartes Catalogue et Composition (2.4, Q20, P41) ; Phrase (2.3) ; refonte de Composition, Volumes, placement complet des Récupérations, Points d'arrêt et règle de passage des circuits de séries (Q4) ; moteur d'exécution, progression et poids des phases (RM-077, RM-126) ; historique non recalculé (FR-15-07, Epic 1).

---

### Story 2.3 : Phrase des paramètres pour les Cibles mixtes et corpus

En tant que Hermann (utilisateur de KODJO),
je veux que la Phrase des paramètres décrive chaque Cible dans l'ordre, y compris « jusqu’à l’échec », avec la bonne Durée totale,
afin de relire d'un coup d'œil ce que je vais faire, sans que les phrases de mes Exercices existants changent.

**Exigences :** FR-16-01 à FR-16-11 ; FR-17-01 (absence de `0 s` dans la Phrase) ; FR-17-02, FR-17-03, FR-17-04, FR-17-05 ; NFR-01, NFR-04, NFR-06, NFR-09, NFR-11, NFR-14 ; Q16, P1, P3, P26, P43, H8, H9, H16, H17, H18.
**Architecture :** AD-6 (générateur unique, segments `{ texte, gras }`, Cible `UNSET` → phrase nulle), AD-5 (formateur et résultat de durée), AD-10 (corpus inchangé sur disque, rejeu des cas `TO_FAILURE` en Répétitions et en Durée, variantes dans `src/domain/activities/__tests__/fixtures/`). Fichiers principalement touchés (indicatif) : `src/domain/activities/executionPhrase.ts`, `src/domain/activities/__tests__/executionPhrase.test.ts`, `src/domain/activities/__tests__/fixtures/` (nouveau), carte Paramètres d'exécution de `src/features/activities/ActivityEditorForm.tsx` (lecture seule de la Phrase, si un ajustement d'affichage est nécessaire).
**Dépend de :** 2.2.
**Hypothèses non validées :** H8, H9, H16, H17, H18 — à confirmer par la revue ChatGPT/Hermann avant développement.

**Critères d'acceptation :**

**AC1 — Génération à l'affichage, sans stockage (FR-16-01)**
**Given** des Paramètres d'exécution et leur résultat de durée
**When** la Phrase est générée deux fois
**Then** les deux sorties sont identiques, segments et gras compris ; la concaténation des textes restitue la Phrase exacte ; deux valeurs identiques restent deux segments distincts ; le gras est décidé par le gabarit, jamais par recherche de sous-chaîne
**And** aucune Phrase ni aucun segment n'est écrit dans une Définition, une Copie en Séance ou un Instantané ; un Exercice ancien relu prend la grammaire courante
**And** une Cible `UNSET` ou un Mode non choisi donne une Phrase nulle : aucune Cible inventée ; Compte à rebours et Fin restent hors de la Phrase
**And** le Mode n'ouvre pas la Phrase ; seul le français est produit.

**AC2 — Gras des valeurs et des unités (FR-16-02, H9)**
**Given** une Phrase générée
**When** ses segments sont lus
**Then** `3 séries de 30 s` donne `3` (gras), ` séries de ` (normal), `30 s` (gras)
**And** dans `4 séries variables, de 10 rép. à l’échec`, `10 rép.` est en gras et ` à l’échec` est normal
**And** dans `(30 s, 45 s puis jusqu’à l’échec)`, `jusqu’à l’échec` est normal
**And** `≥` ou `≈` est dans le même segment gras que le montant de la Durée totale.

**AC3 — Cibles toutes numériques : gabarits inchangés (FR-16-03)**
**Given** un Exercice à Cibles toutes `NUMBER`
**When** sa Phrase est générée
**Then** l'ordre est : nombre de Séries → contenu → Pause → côtés → Durée totale, avec les accords `série`/`séries`
**And** attendus littéraux : `1 série de 1 min 30 s.` ; `3 séries de durée variable (30 s, 45 s puis 1 min).` ; `6 séries variables, de 30 s à 1 min 45 s` (min et max sur les Cibles, pas sur la première et la dernière ligne) ; `3 séries de 12 répétitions, enchaînées sans pause.` ; `3 séries de 12, 10 puis 8 répétitions` ; `6 séries variables, de 6 à 15 répétitions`
**And** N = 1 est normalisé en Régime identiques avant génération ; aucune ellipse après trois valeurs.

**AC4 — Cadence du Bip (FR-16-04, P26, H16)**
**Given** un Exercice avec un Bip b
**When** sa Phrase est générée
**Then** Répétitions, b > 0, Cibles toutes `NUMBER` : `3 séries de 12, 10 puis 8 répétitions cadencées toutes les 4 s.` ; `6 séries variables, de 6 à 15 répétitions cadencées toutes les 4 s.`
**And** en Durée, aucune clause : Durée, N = 1, Bip 4 s → `1 série de 1 min 30 s.`
**And** tout à l'échec avec Bip : aucune clause de cadence, même en Répétitions
**And** mélange en Répétitions de plus de 3 Cibles avec Bip : `4 séries variables, de 10 rép. à l’échec, cadencées toutes les 2 s` (Cibles 10 / 12 / 15 / `FAILURE`, Bip 2 s ; H16)
**And** mélange en Répétitions de 3 Cibles ou moins avec Bip : forme de l'AC8.

**AC5 — Clause de Pause (FR-16-05, P1)**
**Given** un Exercice
**When** sa Phrase est générée
**Then** Régime identiques, Pause positive : `, avec {pause} de pause après chaque série` ; attendu `1 série de 1 min 30 s, avec 15 s de pause après chaque série. Durée totale : 1 min 45 s.`
**And** Régime identiques, Pause nulle, N > 1 : `, enchaînées sans pause` ; N = 1 : aucune clause
**And** Régime variables, tous Modes, y compris tout à l'échec et mélanges : aucune clause de Pause, aucune énumération des Pauses, même si Figma `8328:38848` les énumère (P1)
**And** l'omission des Pauses dans la Phrase ne les retire ni du plan ni du calcul.

**AC6 — Clause des côtés (FR-16-06)**
**Given** un Exercice bilatéral ou non
**When** sa Phrase est générée
**Then** sans changement de côté : aucune clause
**And** départ droit : N = 1 `, en faisant le côté droit puis le gauche` (attendu `1 série de 1 min 30 s, en faisant le côté droit puis le gauche. Durée totale : 3 min.`) ; N > 1 deux côtés à chaque série `, en alternant le côté droit puis le gauche à chaque série` ; N > 1 un côté après l'autre `, en faisant d’abord toutes les séries à droite, puis à gauche`
**And** départ gauche : `en faisant le côté gauche puis le droit`, `en alternant le côté gauche puis le droit à chaque série`, `en faisant d’abord toutes les séries à gauche, puis à droite`
**And** PC > 0 : suffixe `, avec {PC} de pause au changement de côté` ; PC = 0 : aucun suffixe. Attendu `3 séries de 1 min 30 s, avec 15 s de pause après chaque série, en alternant le côté droit puis le gauche à chaque série, avec 5 s de pause au changement de côté. Durée totale : 10 min.` (3 × (180 + 15 + 5) = 600 s).

**AC7 — Tout à l'échec : gabarit existant, dans les deux Modes (FR-16-07, P3, P26)**
**Given** un Exercice dont toutes les Cibles sont `FAILURE`
**When** sa Phrase est générée, en Mode Durée puis en Mode Répétitions, Bip 0 puis 4 s
**Then** les quatre Phrases sont identiques
**And** `1 série menée jusqu’à l’échec.` ; `{N} séries menées jusqu’à l’échec`, jamais `{N} séries jusqu’à l’échec`
**And** attendus : `3 séries menées jusqu’à l’échec, enchaînées sans pause, en faisant d’abord toutes les séries à droite, puis à gauche, avec 5 s de pause au changement de côté.` ; Régime identiques, Pause 10 s : `3 séries menées jusqu’à l’échec, avec 10 s de pause après chaque série.` ; Régime variables, Pauses variables : `3 séries menées jusqu’à l’échec.`
**And** aucune Durée totale ni aucune clause de Bip.

**AC8 — Mélange de 3 Cibles ou moins : énumération (FR-16-08, Q16)**
**Given** un Exercice en Régime variables à Cibles mixtes, 2 ou 3 Cibles
**When** sa Phrase est générée
**Then** Durée : `3 séries de durée variable (30 s, 45 s puis jusqu’à l’échec)` ; `3 séries de durée variable (jusqu’à l’échec, 30 s puis 45 s)` ; `3 séries de durée variable (30 s, jusqu’à l’échec puis 45 s)` ; `2 séries de durée variable (30 s puis jusqu’à l’échec)`
**And** Répétitions, quelle que soit la position de l'échec : `3 séries de répétitions variables (10, 12 puis jusqu’à l’échec)` ; `3 séries de répétitions variables (jusqu’à l’échec, 10 puis 12)` ; `3 séries de répétitions variables (10, jusqu’à l’échec puis 12)` ; `2 séries de répétitions variables (10 puis jusqu’à l’échec)`
**And** Répétitions avec Bip : `3 séries de répétitions variables (10, 12 puis jusqu’à l’échec), cadencées toutes les 2 s` ; `3 séries de répétitions variables (10, jusqu’à l’échec puis 12), cadencées toutes les 2 s`
**And** Phrases complètes : Durée 30 s / 45 s / `FAILURE`, Pauses 10 s × 3, unilatéral → `3 séries de durée variable (30 s, 45 s puis jusqu’à l’échec). Durée totale : ≥ 1 min 45 s.` ; Répétitions 10 / 12 / `FAILURE`, Bip 2 s, Pauses 10 s × 3 → `3 séries de répétitions variables (10, 12 puis jusqu’à l’échec), cadencées toutes les 2 s. Durée totale : ≥ 1 min 14 s.` ; même Exercice Bip 0 → `3 séries de répétitions variables (10, 12 puis jusqu’à l’échec).`
**And** ces formes ne valent que pour un mélange : un Régime variables tout numérique en Répétitions garde `3 séries de 12, 10 puis 8 répétitions`.

**AC9 — Mélange de plus de 3 Cibles : compaction (FR-16-09, H17)**
**Given** un Exercice à Cibles mixtes, plus de 3 Cibles
**When** sa Phrase est générée
**Then** Répétitions : `{N} séries variables, de {minimum numérique} rép. à l’échec` ; Durée : `{N} séries variables, de {minimum numérique formaté} à l’échec`
**And** le minimum est celui des Cibles `NUMBER`, pas la première valeur : 10 / 12 / `FAILURE` / 20 → `4 séries variables, de 10 rép. à l’échec` ; 90 s / 120 s / `FAILURE` / 150 s → `4 séries variables, de 1 min 30 s à l’échec`
**And** Durée 30 s / 45 s / 60 s / `FAILURE`, Pauses 10 s × 4 → `4 séries variables, de 30 s à l’échec. Durée totale : ≥ 2 min 55 s.` (175 s)
**And** Répétitions 10 / 12 / 15 / `FAILURE`, Bip 0 → `4 séries variables, de 10 rép. à l’échec.`, sans Durée totale ; avec Bip 2 s et Pauses 10 s × 4 → Durée totale `≥ 1 min 54 s` (114 s)
**And** plus de 3 Cibles toutes `NUMBER` et toutes égales : le gabarit actuel est conservé (`6 séries variables, de 30 s à 30 s` pour six Cibles de 30 s), sans nouvelle forme (H17).

**AC10 — Durée totale dans la Phrase (FR-16-10, H18)**
**Given** le résultat de durée intrinsèque de l'Exercice (2.1)
**When** la Phrase est générée
**Then** `exact` : ` Durée totale : {total}.` ; `estimated` : ` Durée totale : ≈ {total}.` (attendu `… Durée totale : ≈ 1 min 41 s.`, corpus id 101) ; `lowerBound` : ` Durée totale : ≥ {total}.` (attendus `Durée totale : ≥ 1 min 45 s.`, `Durée totale : ≥ 2 min 15 s.`)
**And** `omitted` (Répétitions sans Bip, tout à l'échec) : aucune clause `Durée totale`, ni zéro ni tiret
**And** redondance : la Durée totale n'est omise que pour une Série unique en Durée, unilatérale **et** sans Pause (`1 série de 1 min 30 s.`) ; avec Pause : `1 série de 1 min 30 s, avec 15 s de pause après chaque série. Durée totale : 1 min 45 s.` ; bilatéral : `… Durée totale : 3 min.`
**And** la Récupération de Séance ne modifie pas la Phrase.

**AC11 — Jamais `0 s` dans la Phrase (FR-17-01)**
**Given** toute Phrase générée par le corpus et les variantes
**When** son texte est examiné
**Then** il ne contient jamais `0 s` : une Pause nulle s'écrit `enchaînées sans pause` ou s'omet ; une PC nulle omet le suffixe.

**AC12 — Corpus 276 conservé (FR-17-02, AD-10, P43)**
**Given** l'oracle source `docs/archives/evolutions-v15-2026-10-07/phrases-276.json` et son encodage de test `docs/preparation/PRE-3/planification/attendus-phrases-276.json` (mêmes 276 phrases, vérifié le 2026-10-16), **aucun des deux modifié sur disque**, et le fichier Excel source, non modifié
**When** le test du corpus s'exécute
**Then** les 276 textes sont reproduits sans altération, ponctuation comprise, et les segments gras attendus sont respectés ; le montant de chaque total est remplacé par le total calculé par formule avant comparaison, jamais lu dans Excel
**And** la répartition est vérifiée : 140 sans total, 46 `≈`, 90 exactes, aucune `≥` ; les 184 cas Durée et Répétitions numériques sont inchangés en texte et en nature
**And** aucune clause n'est ajoutée aux 120 cas en Régime variables
**And** un test vérifie que les 276 phrases de l'encodage de test sont identiques à celles de l'oracle source, et échoue sinon (P43).

**AC13 — Les 92 anciennes entrées « À l’échec » (FR-17-03, P26, P43)**
**Given** les 92 entrées du corpus en ancien Mode `TO_FAILURE`, que le test de 1.1 relit par une adaptation minimale pour rester vert
**When** le test les relit par une adaptation **explicite et nommée** dans le test (et non par une modification de l'un des deux fichiers), qui remplace l'adaptation minimale de 1.1 : Mode Répétitions, toutes les Cibles `FAILURE`, N, Pause, Bip, côtés, Ordre des côtés et PC conservés
**Then** la sortie est identique au corpus. Attendus : `3 séries menées jusqu’à l’échec, en faisant d’abord toutes les séries à droite, puis à gauche, avec 5 s de pause au changement de côté.` (id 251, Bip 4 s) ; `6 séries menées jusqu’à l’échec, en faisant d’abord toutes les séries à droite, puis à gauche, avec 5 s de pause au changement de côté.` (id 276)
**And** chaque entrée est rejouée une seconde fois en Mode Durée, toutes Cibles `FAILURE` : même attendu (FR-16-07)
**And** les 46 entrées avec Bip 4 s restent sans clause de cadence et sans Durée totale
**And** le littéral `TO_FAILURE` n'apparaît dans le test qu'à l'endroit de cette adaptation, conformément au test de garde d'AD-3.

**AC14 — Variantes des cas nouveaux (FR-17-04)**
**Given** un fichier de variantes dans `src/domain/activities/__tests__/fixtures/`, aux attendus littéraux écrits à la main et aux totaux calculés par formule
**When** le test des variantes s'exécute
**Then** il couvre au moins :
- mélange en Durée, 2 Cibles, et 3 Cibles avec l'échec en position 1, 2 et 3, total `≥` (AC8) ;
- mélange en Durée de plus de 3 Cibles, compaction et `≥` (AC9) ;
- mélange en Répétitions de 3 Cibles ou moins, échec en position 1, 2 (`3 séries de répétitions variables (10, jusqu’à l’échec puis 12)` et sa variante `…, cadencées toutes les 2 s`) et 3 ; plus de 3 Cibles ; Bip 0 (aucun total) et Bip positif (`≥`) ;
- tout à l'échec en Durée et en Répétitions, Régime identiques et variables, Bip 0 et 4 s, avec et sans Pause : texte identique au corpus ;
- N = 1 normalisé, N = 2, N > 6 ; Pause 0 et positive ; N = 1 avec et sans Pause ; PC 0 et positive ; Bip 0 et positif dans les deux Modes ;
- départ gauche dans les deux Ordres et à N = 1 ;
- redondance : Durée, N = 1, unilatéral, Pause 0 (total omis) contre Pause positive (total affiché) ; Durée, N = 1, bilatéral (total affiché) ;
- segments : deux valeurs identiques à des positions différentes ; segments `jusqu’à l’échec` et `à l’échec` non gras ;
- relecture d'un ancien Exercice (Instantané v1 lu par `readV1`, 1.3) ; absence de toute Phrase enregistrée ;
- totaux d'une heure ou plus : par exemple Durée uniforme, N = 61, Cible 55 s, Pause 5 s → 61 × 60 = 3 660 s → `Durée totale : 61 min.`.
**And** aucun attendu de variante n'est produit par le générateur ni par `executionCalculations`.

**AC15 — Phrase affichée en entier dans la Carte Paramètres d'exécution (FR-16-11, FR-17-05)**
**Given** la Carte Paramètres d'exécution de l'Éditeur d'Exercice
**When** elle affiche une Phrase
**Then** la Phrase est rendue dans la Carte existante, segments non interactifs, dans un même flux de texte, sans espace ajoutée avant la ponctuation ; la Phrase générée reste une seule suite de segments, sans saut de ligne (le retour de ligne de présentation avant « Durée totale » est un traitement de rendu, porté par 4.2 AC6)
**And** la zone touchable unique de la Carte et son focus d'accessibilité unique ne sont pas exigés ici : ils dépendent du retrait du bouton de Mode (`exercise-parameters-mode`, Q23) et sont portés par 4.2 AC6 et AC14 ; cette story ne modifie ni ce bouton ni le libellé accessible de la Carte
**And** aucun plafond de lignes, de hauteur ni de caractères (aucun `numberOfLines`, aucune hauteur fixe sur le texte, aucun `maxFontSizeMultiplier`) ; Inter 13 Regular, interligne 20, valeurs Semi Bold
**And** le cas 144 du corpus s'affiche en entier : `6 séries de 12 répétitions cadencées toutes les 4 s, avec 15 s de pause après chaque série, en faisant d’abord toutes les séries à droite, puis à gauche, avec 5 s de pause au changement de côté. Durée totale : ≈ 12 min 41 s.` (2 × 6 × (48 + 15) + 5 = 761 s)
**And** Compte à rebours et Fin restent sur leurs lignes et ne sont jamais rognés
**And** aucune carte consommatrice (Catalogue, Composition) ne reçoit la Phrase.

**Preuves attendues :** test du corpus 276 (AC12, AC13, rejeu en Répétitions et en Durée) ; test des variantes (AC14) ; tests unitaires des gabarits (AC1 à AC11) ; test de rendu de la carte (texte complet, aucun `numberOfLines`) ; `npm test`, `npx tsc --noEmit`, `npm run lint` verts. Recette iPhone, à 360, 402 et 440 pt et en texte agrandi (NFR-09) :
- **R-2.3-01** — Exercice migré tout à l'échec : `3 séries menées jusqu’à l’échec…`, sans Bip ni Durée totale ;
- **R-2.3-02** — cas 144 : Phrase lue en entier, sans troncature ni virgule seule en début de ligne ;
- **R-2.3-03** — mélange en Durée, 3 Cibles : `… (30 s, 45 s puis jusqu’à l’échec). Durée totale : ≥ 1 min 45 s.`, gras conforme à H9 (vérification visuelle de H9 sur Figma `8470:13303`) ;
- **R-2.3-04** — mélange en Répétitions avec Bip, échec au milieu ;
- **R-2.3-05** — VoiceOver sur la carte : la Phrase est lue en entier. Le contrôle « un seul élément, nom `Modifier les paramètres d’exécution` » est joué en 4.2 (`R-4.2-03`), après le retrait du bouton de Mode (Q23).

R-2.3-03 et R-2.3-04 ne sont exécutables qu'une fois les Cibles mixtes saisissables dans la Feuille (Epic 3) ; ce n'est pas une dépendance de la story. Une suite verte ne vaut pas recette visuelle ; la validation visuelle appartient à Hermann (NFR-04).
**Hors story :** énumération des Pauses variables (D-338, P1) ; formats For time, Tabata, EMOM ; autre langue (D-317) ; refonte visuelle de la carte (Epic 4, FR-02-06, FR-02-13).

---

### Story 2.4 : Durées et résumés sur les cartes Catalogue et Composition

En tant que Hermann (utilisateur de KODJO),
je veux que les cartes du Catalogue et de la Composition montrent la durée et le résumé de mes Exercices à l'échec ou mixtes comme l'Éditeur,
afin de ne jamais lire « 0 s », « 0 rép. » ni une durée partielle arrondie trompeuse.

**Exigences :** FR-15-06 ; FR-15-05 (conversion des cartes) ; FR-16-11 (aucune Phrase sur les cartes) ; NFR-01, NFR-03, NFR-04, NFR-06, NFR-08, NFR-09, NFR-11, NFR-14 ; Q4, Q17, Q20, Q30, P3, P41, H20, H28.
**Architecture :** AD-5 (rendu PRE-3 de chaque carte conservé pour `exact` et `estimated`, P41 ; `≥` en minutes et secondes sans arrondi pour `lowerBound` sur les cartes Catalogue et Composition, Q20, par le formateur de `durationFormat.ts` ; `formatCompactDuration` et `formatDurationRowValue` cessent de formater une durée d'Exercice ; `formatEstimatedDuration` des cartes de Séance inchangé pour toutes les natures), AD-6 (`formatExerciseRowSummary` lit les Cibles typées), AD-11. Fichiers principalement touchés (indicatif) : `src/domain/activities/durationFormat.ts`, `src/features/activities/ActivityCard.tsx` (`catalogueDuration`), `src/features/sessions/compositionPresentation.ts` (`formatExerciseRowSummary`, `formatCompositionSummary`), `src/shared/i18n/`.
**Dépend de :** 2.2 et 2.3.
**Hypothèses non validées :** H9, H20, H28 — à confirmer par la revue ChatGPT/Hermann avant développement.

**Critères d'acceptation :**

**AC1 — Durée partielle sur la carte Catalogue (FR-15-06, Q17, Q20)**
**Given** une Définition d'Exercice affichée au Catalogue
**When** sa durée intrinsèque (PC comprise) est `lowerBound`
**Then** la carte affiche `≥ {montant}` en minutes et secondes, **sans arrondi** à la minute, par le formateur de 2.2
**And** Durée 30 s / 45 s / `FAILURE`, Pauses 10 s × 3 → `≥ 1 min 45 s` (et non `≥ 2 min`) ; mixte Figma (Pauses 10 / 20 / 30 s) → `≥ 2 min 15 s`
**And** le même Exercice en Répétitions Bip 0 → aucune ligne de durée.

**AC2 — Durées exactes et estimées sur la carte Catalogue : rendu PRE-3 conservé (FR-15-05, FR-15-06, P41)**
**Given** une Définition dont la durée intrinsèque est `exact` ou `estimated`
**When** la carte Catalogue l'affiche
**Then** le montant garde le rendu de la carte Catalogue du code de départ (`catalogueDuration`, `ActivityCard.tsx:114-121`) : minutes et secondes par le formateur de 2.2, sans arrondi à la minute, précédé de `≈` si `estimated`
**And** total exact de 165 s → `2 min 45 s` (et non `3 min`) ; total estimé de 104 s → `≈ 1 min 44 s` ; total exact de 120 s → `2 min`
**And** un test compare ces sorties à celles du code de départ pour les mêmes paramètres numériques (non-régression, NFR-03).

**AC3 — Total omis et Cible à renseigner (FR-15-06, Q17, H28, Q30)**
**Given** une Définition dont la durée est `omitted`, ou `incomplete` parce qu'une Cible est `UNSET`
**When** sa carte est affichée
**Then** aucune ligne de durée n'est rendue : ni `0 s`, ni tiret, ni libellé de remplacement
**And** pour une Cible `UNSET`, le résumé des Séries affiche le texte existant du lexique `Paramètres à compléter.` (H28).

**AC4 — Résumé des Séries lu sur les Cibles typées (FR-15-06, H20, P3, Q17)** — *libellé du tout échec : Q24, `{N} séries à l’échec` en Régime identiques comme variables*
**Given** le résumé compact d'un Exercice (`formatExerciseRowSummary`, partagé par la carte Catalogue et la ligne Exercice de Composition)
**When** il est produit
**Then** il lit les Cibles typées du domaine, jamais les scalaires ni un `?? 0` ; le texte de tout échec du lexique a déjà été changé en 1.1 AC21 (Q24) et n'est pas modifié ici
**And** Régime variables à Cibles mixtes → branche existante `{N} séries variables` (attendu Durée 30 s / 45 s / `FAILURE` → `3 séries variables`) ; avec la bilatéralité propre → `{N} séries variables par côté`
**And** toutes les Cibles `FAILURE`, en Régime identiques comme variables, dans les deux Modes → `{N} séries à l’échec` (attendu `3 séries à l’échec`) ; les autres clauses existantes de la branche (par côté, Pause) restent celles du code de départ
**And** quel que soit le cas, le résumé ne contient jamais `0 s` ni `0 rép.` ; un test le vérifie sur toutes les combinaisons Mode × Régime × position de l'échec
**And** les Cibles numériques d'un résumé sont formatées par le formateur de 2.2 (sortie identique au code de départ pour ces valeurs).

**AC5 — Durée sur la Composition (FR-15-05, FR-15-06, Q20, P41, Q30)**
**Given** le résumé de la Composition, qui porte la durée synthétique des occurrences (avec R, répétitions de Circuit développées, sans Compte à rebours initial ni Fin de séance)
**When** sa nature est `lowerBound` (Exercice partiel, omis ou à Cible héritée à renseigner)
**Then** la durée est précédée de `≥`, en minutes et secondes, sans arrondi, par le formateur de `durationFormat.ts` : Circuit répété 1 fois contenant le seul Exercice R01 sans Récupération → `≥ 1 min 45 s` ; répété 2 fois → `≥ 3 min 30 s`
**And** une nature `exact` ou `estimated` garde le rendu actuel du résumé de Composition (`formatEstimatedDuration`, `compositionPresentation.ts:134`, arrondi à la minute supérieure), inchangé (P41)
**And** le calcul passe par la mesure d'occurrence de 2.2, sans formule locale ni nombre Figma
**And** la ligne Exercice de Composition n'acquiert aucune ligne de durée propre : PRE-4 n'ajoute aucun élément à Composition (Q4).

**AC6 — Source unique et conservation des cartes (FR-15-06, FR-16-11)**
**Given** les cartes Catalogue et Composition
**When** elles affichent durée et résumé
**Then** durée et symbole viennent du calcul commun (2.1, 2.2) ; le montant passe par le formateur de `durationFormat.ts`, sauf les totaux exacts et estimés du résumé de Composition, qui gardent leur formateur actuel (P41) ; aucun module de carte ne recalcule une durée d'Exercice
**And** les six contrats de cartes du ch. 13 (l. 277, 378, 764, 850, 2167, 2259) sont lus comme amendés par Q17 : `≥` admis sur une carte d'Exercice
**And** les huit cartes du Catalogue et leurs filtres sont conservés ; aucune Phrase des paramètres n'est ajoutée à une carte
**And** les cartes de Séance gardent `formatEstimatedDuration`, inchangé
**And** `≈` et `≥` restent des clés du lexique (NFR-08).

**Preuves attendues :** tests unitaires des rendus de carte (AC1, AC2, AC5 : 105 → `≥ 1 min 45 s`, 135 → `≥ 2 min 15 s`, Catalogue 165 → `2 min 45 s`, Catalogue 104 → `≈ 1 min 44 s`, Composition 210 `lowerBound` → `≥ 3 min 30 s`, Composition exacte et estimée inchangées) ; tests de `formatExerciseRowSummary` (AC3, AC4, matrice sans `0 s` ni `0 rép.`) ; tests de rendu d'`ActivityCard` (ligne absente si omise) ; tests existants des cartes adaptés sans affaiblissement ; `npm test`, `npx tsc --noEmit`, `npm run lint` verts. Recette iPhone, à 360, 402 et 440 pt et en texte agrandi (NFR-09) :
- **R-2.4-01** — Catalogue, Exercice migré tout à l'échec : résumé `{N} séries à l’échec` (Q24), aucune ligne de durée ;
- **R-2.4-02** — Catalogue, Exercice exact de 165 s : `2 min 45 s`, comme avant la mise à jour (P41) ;
- **R-2.4-03** — Catalogue, Exercice mixte R01 : `≥ 1 min 45 s` et `3 séries variables` (exécutable après l'Epic 3) ;
- **R-2.4-04** — Composition contenant l'Exercice migré tout à l'échec : ligne Exercice sans `0 s` ni `0 rép.`, résumé de Composition précédé de `≥` ;
- **R-2.4-05** — Catalogue, Définition à Cible héritée à renseigner (données de 1.4) : `Paramètres à compléter.`, aucune durée.

Une suite verte ne vaut pas recette visuelle ; la validation visuelle appartient à Hermann (NFR-04). Ordre de lecture des sources : NFR-14 ; Figma pour le rendu seulement (NFR-01).
**Hors story :** synthèse des Exercices mixtes sur les cartes de Composition au-delà de la durée et de l'interdiction du zéro (grille Volumes) ; refonte de Composition (Q4) ; libellés « Tour » et « Circuit » existants (`questions-ouvertes.md` §4) ; Phrase dans l'Éditeur (2.3).

---

#### Points signalés et leur traitement

| ID | Écart | Traitement | Critères concernés |
|---|---|---|---|
| C-E2-1 | Durée partielle du résumé de Composition : sans arrondi ou par le formateur de Séance (`formatEstimatedDuration`, `compositionPresentation.ts:134`), qui arrondit à la minute supérieure. | **Tranché par Q20 et P41** : partiel en `≥` minutes et secondes sans arrondi sur les cartes Catalogue et Composition ; exact et estimé gardent le formateur actuel de Composition. | 2.4 AC5 |
| C-E2-2 | Affichage de la Durée estimée d'exécution P31 (`≥ 2 min 30 s` au PRD, contre le formateur inchangé de la carte de Séance). | **Tranché par P31 et P41** : l'attendu porte sur le montant (150 s, `lowerBound`) ; l'affichage de la Séance suit son formateur actuel. | 2.2 AC5, AC6 |
| C-E2-3 | Résultat d'une Cible à renseigner et comportement de l'agrégat quand une Copie porte une Cible `UNSET` héritée. | **Tranché par Q30 (remplace H30)** : issue `incomplete`, distincte d'`omitted` ; aucun total d'Exercice ; dans l'agrégation, travail de la Série à renseigner inconnu, travail connu des autres Séries et Pauses comptés, comme pour un mélange avec échec (30 s / — / 45 s, Pauses 10 s × 3 → 105 s), Séance `lowerBound` ; pas une omission (AD-5). | 2.1 AC5, AC9 ; 2.2 AC4 ; 2.4 AC3, AC5 |
| C-E2-4 | Inversion du total sous un N hérité, non produit par PRE-4. | **Tranché par P42** : exigence de compatibilité du modèle, vérifiée par un test du domaine seulement (indicateur d'héritage en entrée, non persisté). | 2.1 AC6 |
| C-E2-5 | La carte Catalogue du code de départ n'arrondit pas un total exact (`2 min 45 s` pour 165 s). | **Tranché par P41** : rendu PRE-3 conservé pour les totaux exacts et estimés ; aucun arrondi RM-159 introduit sur la carte Catalogue. | 2.4 AC2 |
| C-E2-6 | Le PRD (FR-05-05, FR-15-06, P3, H20) présente `{N} séries à l’échec` comme la formulation **conservée** sur les cartes, mais le code de départ produit `{N} séries jusqu’à l’échec` (`exerciseRow.toFailure`, `fr.ts:380`), et `{N} séries variables` pour un tout échec en Régime variables. Suivre P3 et H20 change le texte visible d'une carte acceptée en PRE-3 (NFR-03) ; garder le code contredit P3. | **Tranché par Hermann (Q24) : `{N} séries à l’échec`**, en Régime identiques comme en Régime variables. 2.4 AC4 l'applique ; les clauses existantes de la branche sont conservées, dont la clause de Pause. Le texte PRE-3 change. | 1.1 AC21 ; 2.4 AC4 ; R-2.4-01, R-31 |
| C-E2-7 | Frontière avec le socle pour les 92 cas `TO_FAILURE` du corpus. | **Tranché par P43** : deux fichiers aux phrases identiques, l'archive est l'oracle, le fichier PRE-3 l'encodage de test, aucun n'est modifié ; 1.1 applique l'adaptation minimale qui garde le corpus vert, 2.3 la rend explicite et nommée et ajoute le rejeu en Durée et les variantes. | 1.1 AC21 ; 2.3 AC12, AC13 |

Ambiguïté mineure, sans contradiction : le gras de « répétitions variables » dans la forme Q16 n'est pas fixé par H9. 2.3 le traite comme le texte grammatical ` de durée variable (` du code de départ, donc en style normal. À confirmer sur Figma `8470:13303` lors de R-2.3-04.

#### Couverture E2

| FR | Story / AC |
|---|---|
| FR-13-01 | 2.1 AC1 |
| FR-13-02 | 2.1 AC2 |
| FR-13-03 | 2.1 AC3 |
| FR-13-04 | 2.1 AC4 |
| FR-13-05 | 2.1 AC5, AC9 ; 2.2 AC4 (agrégat, Q30) |
| FR-13-06 | 2.1 AC8 |
| FR-14-02 (domaine) | 2.1 AC6 |
| FR-14-03 (domaine) | 2.1 AC7 |
| FR-15-02 | 2.2 AC2 |
| FR-15-03 | 2.2 AC3 |
| FR-15-04 | 2.2 AC4 |
| FR-15-05 | 2.2 AC5, AC6 ; 2.4 AC2, AC5 |
| FR-15-06 | 2.4 AC1 à AC6 |
| FR-16-01 | 2.3 AC1 |
| FR-16-02 | 2.3 AC2 |
| FR-16-03 | 2.3 AC3 |
| FR-16-04 | 2.3 AC4 |
| FR-16-05 | 2.3 AC5 |
| FR-16-06 | 2.3 AC6 |
| FR-16-07 | 2.3 AC7, AC13 |
| FR-16-08 | 2.3 AC8 |
| FR-16-09 | 2.3 AC9 |
| FR-16-10 | 2.3 AC10 |
| FR-16-11 | 2.3 AC15 ; 2.4 AC6 |
| FR-17-01 | 2.2 AC1 ; 2.3 AC11 |
| FR-17-02 | 2.3 AC12 |
| FR-17-03 | 2.3 AC13 |
| FR-17-04 | 2.3 AC14 |
| FR-17-05 | 2.3 AC15 |
