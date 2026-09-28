# Spécification fonctionnelle — Phrase de synthèse des paramètres d'exécution

**Périmètre** : champ « Paramètres d'exécution » des écrans « Ajouter un exercice » et « Modifier un exercice ».
**Statut** : spécification v10.2, 28/09/2026 (classeur v10) ; arbitrages V1/MVP D-232 et condition d'ajustement confirmée.
**Sources de vérité** : classeur `generateur-phrase-activite_v10.xlsx` — feuille « Générateur » pour les calculs, feuille « Bibliothèque de textes » pour les textes. En cas d'écart entre ce document et le classeur, le classeur fait foi.

---

## 1. Objet

La phrase de synthèse décrit en langage naturel la façon dont une activité s'exécute. Elle est **générée** à partir de paramètres : à chaque modification d'un paramètre, elle est recalculée. Ses valeurs éditables se modifient par les contrôles indiqués au §2 ; la durée totale estimée en mode Répétitions reste en lecture seule.

**Le mode d'exécution n'entre pas dans le texte de la phrase** : il est affiché séparément (dans le prototype, par un badge à côté du titre « Paramètres d'exécution »).

**À la création d'un Exercice, aucun mode d'exécution n'est présélectionné.** Le champ du mode d'exécution affiche alors **« Choisir un mode »**. Le champ éditable « Paramètres d'exécution » est présent mais vide : il ne contient aucun texte, ni phrase ni durée totale. Cette absence de contenu concerne uniquement le sélecteur de mode et le champ éditable ; le reste de l'écran de création (nom de l'Exercice, autres paramètres, compte à rebours, fin d'exercice, etc.) reste affiché normalement.

Dès que l'utilisateur sélectionne pour la première fois un mode (`Durée`, `Répétitions` ou `À l'échec`), **« Choisir un mode » n'est plus jamais affiché pour cet Exercice**. Un mode reste ensuite toujours sélectionné, y compris lorsque l'utilisateur change de mode.

**En modification d'un Exercice existant, cet état initial sans mode ne s'applique pas** : un Exercice existant possède par définition un mode d'exécution, et son mode enregistré est affiché à l'ouverture.

Le compte à rebours et la fin d'exercice **n'apparaissent jamais** dans la phrase et **ne sont pas comptés dans la durée totale** : ce sont des lignes distinctes, dont les valeurs par défaut (10 s et 5 s dans le prototype) sont copiées du profil dans l'Exercice à la création ; la pause entre côtés est copiée lorsqu'elle devient applicable (§7.5).

## 2. Paramètres

| Paramètre | Notation | Valeurs | Utilisé quand | Valeur par défaut | Contrôle (prototype) |
|---|---|---|---|---|---|
| Mode d'exécution | — | Durée · Répétitions · À l'échec | toujours | **aucun** (non sélectionné) | 3 pastilles |
| Nombre de séries | N | entier ≥ 1 | dès qu'un mode est choisi | **1** | stepper intégré dans la phrase, sur le nombre seul |
| Durée par série | d | secondes, > 0 | mode Durée | 1 min (D-232) | sélecteur roulette |
| Répétitions par série | R | entier ≥ 1 | mode Répétitions | **1** | stepper intégré dans la phrase, sur le nombre seul |
| Durée standard d'une répétition | r | V1 : constante = 2 s (« paramètre défini en dur ») ; V2 : paramètre du profil (§7.7) | mode Répétitions (calcul du minimum) | 2 s | non éditable en V1 |
| Pause entre séries | pS | secondes, ≥ 0 | N > 1 | **5 s** (valeur fixe : le profil n'a pas de réglage équivalent) | sélecteur roulette |
| Changement de côté | — | Aucun · D→G · G→D | dès qu'un mode est choisi | Aucun (D-232) | contrôle segmenté « Sans changement · Droite puis gauche · Gauche puis droite » dans le champ |
| Pause entre côtés | pC | secondes, ≥ 0 | changement de côté ≠ Aucun | **valeur du profil** (réglage « Pause au changement de côté » : 10 s dans le prototype) | stepper selon D-232 |

Grandeur dérivée : **k = 2** si un changement de côté est défini (côté ≠ Aucun), sinon **k = 1**.

Une pause n'est pas affichée tant qu'elle ne s'applique pas (pause entre séries : N = 1 ; pause entre côtés : côté = Aucun). Elle prend sa valeur par défaut au moment où elle devient applicable ; pour la pause entre côtés, c'est la valeur du profil.

## 3. États du champ et phrases de départ

| État | Contenu du champ |
|---|---|
| **0 — Aucun mode sélectionné** (état initial de création uniquement) | Le sélecteur de mode affiche **« Choisir un mode »**. Le champ éditable est vide : aucun texte, aucune durée totale. Les autres éléments de l'écran restent affichés normalement ; le cadre vide conserve la hauteur d'une ligne. |
| **1 — Un mode vient d'être sélectionné** | **« Choisir un mode » disparaît définitivement pour cet Exercice.** La **phrase de départ** du mode apparaît aussitôt, avec les valeurs par défaut. Elle commence par le nombre de séries. |
| **2 — Paramètres saisis** | L'utilisateur modifie les valeurs ; la phrase est recalculée à chaque modification. |

Phrases de départ (valeurs par défaut du §2) :

| Mode | Phrase de départ |
|---|---|
| Durée | `1 série de 1 min, sans changement de côté.` |
| Répétitions | `1 série de 1 répétition, sans changement de côté. Durée totale ≥ 2 s.` |
| À l'échec | `1 série jusqu'à l'échec, sans changement de côté.` |

Le prototype ne montre pas ces phrases de départ : ses écrans situés après le choix du mode illustrent directement des valeurs cibles. Le mode lui-même n'apparaît pas dans ces phrases. Avec une seule série et sans changement de côté, la clause « pause entre séries » n'apparaît pas et la clause « changement de côté » indique « sans changement de côté ».

Première apparition d'une pause, depuis une phrase de départ (pause entre séries : 5 s ; pause entre côtés : valeur du profil, 10 s dans le prototype) :

| Action de l'utilisateur | Phrase obtenue |
|---|---|
| Mode Durée : nombre de séries 1 → 2 | `2 séries de 1 min, avec 5 s de pause entre les séries, sans changement de côté. Durée totale 2 min 5 s.` |
| Mode Durée : changement de côté Aucun → D→G | `1 série de 1 min, en changeant de côté de D→G après 10 s de pause. Durée totale 2 min 10 s.` |
| Mode À l'échec : nombre de séries 1 → 2 | `2 séries jusqu'à l'échec, avec 5 s de pause entre les séries, sans changement de côté.` |

## 4. Format d'affichage des durées

Une durée x, en secondes, s'écrit :

| Cas | Format | Exemple |
|---|---|---|
| x = 0 | `0 s` | 0 s |
| x < 60 | `{x} s` | 15 s |
| x multiple de 60 | `{x/60} min` | 1 min |
| autre | `{minutes} min {secondes} s` | 1 min 30 s |

## 5. Règles de calcul

Notons `côté = pC` si un changement de côté est défini, sinon `0`.

| Mode | Durée totale | Affichage |
|---|---|---|
| Durée | **T = k × (N × d + (N − 1) × pS) + côté** | exacte |
| Répétitions | **Tmin = k × (N × R × r + (N − 1) × pS) + côté** | minimum estimé, précédé de « ≥ » |
| À l'échec | aucune | **jamais affichée** |

**La durée totale n'inclut ni le compte à rebours, ni la fin d'exercice.** Exemple du prototype : 3 séries de 1 min 30 s avec 15 s de pause donnent 5 min ; le compte à rebours (10 s) et la fin d'exercice (5 s) sont affichés à part.

**Déroulé avec changement de côté (k = 2) : un bloc de séries par côté.** Toutes les séries sont d'abord exécutées sur un côté, avec leurs pauses entre séries ; vient ensuite la pause entre côtés ; puis toutes les séries sont exécutées sur l'autre côté, avec leurs pauses entre séries.

Principes :
- **L'effort et les pauses entre séries sont comptés pour chaque côté** (k = 2), puisque chaque côté déroule son propre bloc de séries.
- **La pause entre côtés est comptée une seule fois**, quel que soit le nombre de séries.
- Le minimum du mode Répétitions ne compte que du temps connu : l'effort au rythme standard `r`, et les pauses.
- Avec une seule série (N = 1), `(N − 1) × pS = 0` : la pause entre séries n'intervient pas.

Exemples :
- Mode Durée, N = 3, d = 90 s, pS = 15 s, D→G avec pC = 5 s : T = 2 × (3 × 90 + 2 × 15) + 5 = 605 s → « 10 min 5 s ».
- Mode Répétitions, N = 3, R = 12, pS = 15 s, D→G avec pC = 5 s : Tmin = 2 × (3 × 12 × 2 + 2 × 15) + 5 = 209 s → « ≥ 3 min 29 s ».

## 6. Construction de la phrase

La phrase est la concaténation de clauses, dans cet ordre. Chaque clause est un **fragment de texte** choisi selon une condition, dans lequel les variables `{…}` sont remplacées par leur valeur formatée. Aucune clause n'est produite tant qu'aucun mode n'est sélectionné.

| Clause | Condition → fragment |
|---|---|
| 1 · Libellé du mode | **hors phrase** : affiché séparément, jamais dans le texte (pas de fragment) |
| 2 · Nombre de séries | N = 1 → 2A · N > 1 → 2B |
| 3 · Valeur par série | Durée → 3A · Répétitions, R = 1 → 3B · Répétitions, R > 1 → 3C · **À l'échec → 3D (« jusqu'à l'échec »)** |
| 4 · Pause entre séries | N = 1 → 4A (vide) · N > 1 et pS > 0 → 4B · N > 1 et pS = 0 → 4C |
| 5 · Changement de côté | Aucun → 5A · côté défini et pC > 0 → 5B · côté défini et pC = 0 → 5C |
| 6 · Durée totale | Durée et (N > 1 ou côté défini) → 6A · Durée, N = 1 et côté Aucun → 6C (vide) · Répétitions et Tmin > 0 → 6B · Répétitions et Tmin = 0 → 6D · **À l'échec → 6E (vide)** |
| 7 · Point final | si la clause 6 est vide → 7A (« . ») |

La numérotation des fragments (2A à 7A) est conservée : la clause 1 n'a plus de fragment. La phrase commence donc directement par le nombre de séries, sans espace initial.

Variables : `{N}` nombre de séries · `{R}` répétitions · `{durée}` durée d'une série · `{pause}` pause entre séries · `{côté}` sens du changement de côté · `{pause côtés}` pause entre côtés · `{total}` durée totale (exacte en mode Durée, minimale en mode Répétitions).

**Ponctuation** : les clauses 6 non vides portent leur propre point final (« . Durée totale … . »). Quand la clause 6 est vide, la clause 7 apporte le point. La phrase se termine donc toujours par un seul point.

**Cas où la durée totale n'est pas affichée** :
- mode **À l'échec** : la durée d'effort est inconnue ;
- mode **Durée avec une seule série et sans changement de côté** : elle égale la durée par série, déjà énoncée. Dès qu'il y a plusieurs séries **ou** un changement de côté, elle diffère de la durée par série et est affichée.

Le fragment 6D (mode Répétitions, minimum nul) est un filet de sécurité : il ne se produit pas tant que `r > 0`.

## 7. Comportements

**7.1 Régénération.** La phrase est recalculée à chaque modification d'un paramètre, à partir de la sélection d'un mode. Le nom de l'Exercice ne fait pas partie de la phrase.

L'état sans mode existe uniquement à l'ouverture de la création d'un nouvel Exercice. Après la première sélection, l'utilisateur peut changer de mode mais ne revient pas à l'état « Choisir un mode ». En modification d'un Exercice existant, le mode enregistré est déjà sélectionné à l'ouverture.

**7.2 Édition de la durée totale (mode Durée uniquement).** L'utilisateur fixe une durée visée `Tv` (sélecteur minutes / secondes). L'application en déduit le nombre entier de séries le plus proche :

`N = max(1, arrondi( (Tv − côté + k × pS) / (k × (d + pS)) ))` (arrondi au plus proche ; à `.5`, vers le haut ; Séries bornées à `1..99` selon D-232)

La durée par série et les pauses ne changent pas. Une fois le nombre entier de Séries `N` calculé, la durée effectivement réalisable `T(N)` est recalculée. **Si `T(N) ≠ Tv`**, afficher temporairement : « Durée ajustée à {T(N)} pour respecter un nombre entier de Séries. » **Si `T(N) = Tv`**, ne pas afficher ce message. La valeur affichée après confirmation est toujours `T(N)`. La comparaison porte sur les durées numériques, avant formatage.

La durée totale n'étant affichée que lorsqu'il y a plusieurs séries ou un changement de côté, elle n'est éditable qu'à ces conditions.

**7.2 bis Contrôles d'édition et fragments activables (prototype).** Le nombre de séries et le nombre de répétitions s'éditent au moyen d'un stepper intégré dans la phrase qui remplace la valeur numérique, tandis que « séries » et « répétitions » restent du texte. La durée par série, la pause entre séries et la durée totale en mode Durée s'éditent au moyen d'une roulette. Le mode se choisit par trois pastilles. Le compte à rebours s'édite par un stepper sur sa ligne, séparée de la phrase ; pendant cette édition, « Fin d'exercice » passe à la ligne suivante.

Pour le changement de côté, le contrôle segmenté est affiché dans le champ, sous la phrase et avant « Durée totale ». Ses options sont « Sans changement », « Droite puis gauche » et « Gauche puis droite ». Dans le fragment 5A, seul « sans » est activable ; dans les fragments 5B et 5C, seule la valeur « D→G » ou « G→D » est activable. Un clic ouvre le contrôle : « Sans changement » maintient la formule « sans changement de côté », les autres options affichent respectivement « D→G » ou « G→D » dans la phrase. Les textes des fragments 5A, 5B et 5C dans l'annexe A restent inchangés.

Tant qu'un contrôle est ouvert, la valeur correspondante prend l'état visuel édité. Lorsqu'un stepper est ouvert, il remplace le badge de valeur.

**7.3 Mode Répétitions.** La durée totale affichée est une estimation en **lecture seule**.

**7.4 Mode À l'échec.** Aucune durée totale n'est affichée ni éditable.

**7.5 Données enregistrées.** Seuls les **paramètres d'exécution** sont enregistrés (mode, N, d, R, pS, côté, pC). Le texte de la phrase et la durée totale ne sont **jamais stockés** : ils sont calculés et affichés à chaque ouverture de l'activité. Conséquences :
- une évolution des textes (bibliothèque) ou des règles de calcul s'applique aussi aux activités déjà créées ;
- l'édition de la durée totale (§7.2) n'enregistre que le nombre de séries qui en résulte.

**Valeurs héritées du profil.** Une valeur par défaut issue du profil (par exemple la pause entre côtés) est **copiée** dans l'activité au moment où le paramètre devient applicable. Un changement ultérieur du profil ne modifie donc pas les activités déjà créées.

**7.6 Parcours d'exécution.** Il suit le même déroulé que le §5 : avec un changement de côté, toutes les séries sont exécutées sur un côté, puis vient la bascule après la pause entre côtés, puis toutes les séries sur l'autre côté.

**7.7 Durée standard d'une répétition : V1 et V2.** En V1, `r` est une constante de 2 s définie en dur. En V2, elle devient un **paramètre du profil** (valeur par défaut 2 s). Pour que ce passage reste simple, dès la V1 :
- une **seule fonction de calcul** des durées, dans laquelle `r` est une donnée d'entrée et non une valeur écrite en dur à plusieurs endroits ;
- `r` en **secondes entières**, comme les autres durées du profil (pas de fraction de seconde, qui obligerait à revoir le format et les arrondis) ;
- cette fonction est la seule utilisée partout où une durée d'activité est estimée (à vérifier : durées de séance du catalogue, telles que « ≥ 11 min 3 s »).

À noter : `r` n'est pas un paramètre éditable de l'Exercice. En V1, sa valeur est fixée à 2 s. La stratégie V2 de lecture dynamique depuis le Profil ou de copie dans chaque Exercice reste à arbitrer (§8) ; seule la lecture dynamique ferait évoluer l'estimation « ≥ » des Exercices existants après un changement du Profil.

## 8. Décisions V1/MVP et point V2 hors MVP

**Aucun point fonctionnel V1/MVP du générateur de phrase ne reste À CLARIFIER.** Les arbitrages V1/MVP sont actés par D-232 : format de durée « 1 min » ; durée par Série initiale 1 min ; côté initial Aucun ; valeurs communes conservées lors d'un changement de mode et dernière valeur propre à chaque mode conservée pendant l'édition ; impossibilité de revenir à « Choisir un mode » après la première sélection ; « Terminer » désactivé avant ce choix ; bornes et pas des contrôles définis dans D-232. La valeur initiale de la pause au changement de côté vient du Profil et est copiée quand la bilatéralité devient applicable. La condition du message temporaire d'ajustement est confirmée au §7.2.

**Seul point ouvert, V2 hors MVP :** la durée standard d'une répétition `r`, devenue un réglage du Profil en V2, sera-t-elle lue dynamiquement lors de chaque calcul ou figée/copiée pour chaque Exercice ? En V1/MVP, `r = 2 s` ; ce choix V2 n'empêche pas la mise en œuvre V1.

**Alignement visuel du prototype :** l'état initial vide, l'exclusion du nom de l'Exercice, l'estimation « ≥ 2 min 45 s » de l'exemple Répétitions et le badge « Répétitions » sont illustrés dans le lot 3. Les écrans après choix du mode montrent des valeurs cibles et non les phrases de départ définies au §3. Les différences éventuelles de libellé ou de contrôle entre le prototype et D-232 relèvent d'un audit de présentation ; elles ne rouvrent pas les décisions fonctionnelles V1.

---

## Annexe A — Textes en vigueur

`␣` = espace significatif. Le classeur (feuille « Bibliothèque de textes ») fait foi.

| ID | Clause | Condition | Texte |
|---|---|---|---|
| 2A | 2 · Nombre de séries | 1 seule série | `{N} série` |
| 2B | 2 · Nombre de séries | Plusieurs séries | `{N} séries` |
| 3A | 3 · Valeur par série | Mode Durée | `␣de {durée}` |
| 3B | 3 · Valeur par série | Mode Répétitions, 1 répétition par série | `␣de {R} répétition` |
| 3C | 3 · Valeur par série | Mode Répétitions, plusieurs répétitions par série | `␣de {R} répétitions` |
| 3D | 3 · Valeur par série | Mode À l'échec | `␣jusqu'à l'échec` |
| 4A | 4 · Pause entre séries | 1 seule série | *(vide)* |
| 4B | 4 · Pause entre séries | Plusieurs séries, pause entre séries > 0 | `, avec {pause} de pause entre les séries` |
| 4C | 4 · Pause entre séries | Plusieurs séries, pause entre séries = 0 | `, sans pause entre les séries` |
| 5A | 5 · Changement de côté | Aucun changement de côté | `, sans changement de côté` |
| 5B | 5 · Changement de côté | Changement de côté, pause entre côtés > 0 | `, en changeant de côté de {côté} après {pause côtés} de pause` |
| 5C | 5 · Changement de côté | Changement de côté, pause entre côtés = 0 | `, en changeant de côté de {côté}` |
| 6A | 6 · Durée totale | Mode Durée, plusieurs séries ou changement de côté | `. Durée totale {total}.` |
| 6B | 6 · Durée totale | Mode Répétitions, durée minimale > 0 | `. Durée totale ≥ {total}.` |
| 6C | 6 · Durée totale | Mode Durée, 1 seule série sans changement de côté | *(vide)* |
| 6D | 6 · Durée totale | Mode Répétitions, durée minimale = 0 | `. Durée totale ≥ {total}.` |
| 6E | 6 · Durée totale | Mode À l'échec (règle v4) | *(vide)* |
| 7A | 7 · Point final | Quand la clause 6 est vide | `.` |

## Annexe B — Jeu de cas de test (7 états d'entrée + 36 cas)

Tous les cas ci-dessous ont été vérifiés contre une implémentation indépendante. **D0 à D3** : états de départ (§3) ; **D4 à D6** : première apparition d'une pause (§3). Durée par série : 1 min 30 s dans les cas 1 à 9 (mode Durée) ; durée standard d'une répétition : 2 s. « — » : paramètre non applicable. Le mode ne figure jamais dans la phrase attendue.

| N° | Mode | Séries | Rép. | Durée / série | Pause séries | Côté | Pause côtés | Phrase attendue |
|---|---|---|---|---|---|---|---|---|
| D0 | (aucun) | — | — | — | — | — | — | *(champ vide)* |
| D1 | Durée | 1 | — | 1 min | — | Aucun | — | 1 série de 1 min, sans changement de côté. |
| D2 | Répétitions | 1 | 1 | — | — | Aucun | — | 1 série de 1 répétition, sans changement de côté. Durée totale ≥ 2 s. |
| D3 | À l'échec | 1 | — | — | — | Aucun | — | 1 série jusqu'à l'échec, sans changement de côté. |
| D4 | Durée | 2 | — | 1 min | 5 s | Aucun | — | 2 séries de 1 min, avec 5 s de pause entre les séries, sans changement de côté. Durée totale 2 min 5 s. |
| D5 | Durée | 1 | — | 1 min | — | D→G | 10 s | 1 série de 1 min, en changeant de côté de D→G après 10 s de pause. Durée totale 2 min 10 s. |
| D6 | À l'échec | 2 | — | — | 5 s | Aucun | — | 2 séries jusqu'à l'échec, avec 5 s de pause entre les séries, sans changement de côté. |
| 1 | Durée | 1 | — | 1 min 30 s | — | Aucun | — | 1 série de 1 min 30 s, sans changement de côté. |
| 2 | Durée | 1 | — | 1 min 30 s | — | D→G | 5 s | 1 série de 1 min 30 s, en changeant de côté de D→G après 5 s de pause. Durée totale 3 min 5 s. |
| 3 | Durée | 1 | — | 1 min 30 s | — | D→G | 0 s | 1 série de 1 min 30 s, en changeant de côté de D→G. Durée totale 3 min. |
| 4 | Durée | 3 | — | 1 min 30 s | 15 s | Aucun | — | 3 séries de 1 min 30 s, avec 15 s de pause entre les séries, sans changement de côté. Durée totale 5 min. |
| 5 | Durée | 3 | — | 1 min 30 s | 15 s | D→G | 5 s | 3 séries de 1 min 30 s, avec 15 s de pause entre les séries, en changeant de côté de D→G après 5 s de pause. Durée totale 10 min 5 s. |
| 6 | Durée | 3 | — | 1 min 30 s | 15 s | D→G | 0 s | 3 séries de 1 min 30 s, avec 15 s de pause entre les séries, en changeant de côté de D→G. Durée totale 10 min. |
| 7 | Durée | 3 | — | 1 min 30 s | 0 s | Aucun | — | 3 séries de 1 min 30 s, sans pause entre les séries, sans changement de côté. Durée totale 4 min 30 s. |
| 8 | Durée | 3 | — | 1 min 30 s | 0 s | D→G | 5 s | 3 séries de 1 min 30 s, sans pause entre les séries, en changeant de côté de D→G après 5 s de pause. Durée totale 9 min 5 s. |
| 9 | Durée | 3 | — | 1 min 30 s | 0 s | D→G | 0 s | 3 séries de 1 min 30 s, sans pause entre les séries, en changeant de côté de D→G. Durée totale 9 min. |
| 10 | Répétitions | 1 | 1 | — | — | Aucun | — | 1 série de 1 répétition, sans changement de côté. Durée totale ≥ 2 s. |
| 11 | Répétitions | 1 | 1 | — | — | D→G | 5 s | 1 série de 1 répétition, en changeant de côté de D→G après 5 s de pause. Durée totale ≥ 9 s. |
| 12 | Répétitions | 1 | 1 | — | — | D→G | 0 s | 1 série de 1 répétition, en changeant de côté de D→G. Durée totale ≥ 4 s. |
| 13 | Répétitions | 3 | 1 | — | 15 s | Aucun | — | 3 séries de 1 répétition, avec 15 s de pause entre les séries, sans changement de côté. Durée totale ≥ 36 s. |
| 14 | Répétitions | 3 | 1 | — | 15 s | D→G | 5 s | 3 séries de 1 répétition, avec 15 s de pause entre les séries, en changeant de côté de D→G après 5 s de pause. Durée totale ≥ 1 min 17 s. |
| 15 | Répétitions | 3 | 1 | — | 15 s | D→G | 0 s | 3 séries de 1 répétition, avec 15 s de pause entre les séries, en changeant de côté de D→G. Durée totale ≥ 1 min 12 s. |
| 16 | Répétitions | 3 | 1 | — | 0 s | Aucun | — | 3 séries de 1 répétition, sans pause entre les séries, sans changement de côté. Durée totale ≥ 6 s. |
| 17 | Répétitions | 3 | 1 | — | 0 s | D→G | 5 s | 3 séries de 1 répétition, sans pause entre les séries, en changeant de côté de D→G après 5 s de pause. Durée totale ≥ 17 s. |
| 18 | Répétitions | 3 | 1 | — | 0 s | D→G | 0 s | 3 séries de 1 répétition, sans pause entre les séries, en changeant de côté de D→G. Durée totale ≥ 12 s. |
| 19 | Répétitions | 1 | 12 | — | — | Aucun | — | 1 série de 12 répétitions, sans changement de côté. Durée totale ≥ 24 s. |
| 20 | Répétitions | 1 | 12 | — | — | D→G | 5 s | 1 série de 12 répétitions, en changeant de côté de D→G après 5 s de pause. Durée totale ≥ 53 s. |
| 21 | Répétitions | 1 | 12 | — | — | D→G | 0 s | 1 série de 12 répétitions, en changeant de côté de D→G. Durée totale ≥ 48 s. |
| 22 | Répétitions | 3 | 12 | — | 15 s | Aucun | — | 3 séries de 12 répétitions, avec 15 s de pause entre les séries, sans changement de côté. Durée totale ≥ 1 min 42 s. |
| 23 | Répétitions | 3 | 12 | — | 15 s | D→G | 5 s | 3 séries de 12 répétitions, avec 15 s de pause entre les séries, en changeant de côté de D→G après 5 s de pause. Durée totale ≥ 3 min 29 s. |
| 24 | Répétitions | 3 | 12 | — | 15 s | D→G | 0 s | 3 séries de 12 répétitions, avec 15 s de pause entre les séries, en changeant de côté de D→G. Durée totale ≥ 3 min 24 s. |
| 25 | Répétitions | 3 | 12 | — | 0 s | Aucun | — | 3 séries de 12 répétitions, sans pause entre les séries, sans changement de côté. Durée totale ≥ 1 min 12 s. |
| 26 | Répétitions | 3 | 12 | — | 0 s | D→G | 5 s | 3 séries de 12 répétitions, sans pause entre les séries, en changeant de côté de D→G après 5 s de pause. Durée totale ≥ 2 min 29 s. |
| 27 | Répétitions | 3 | 12 | — | 0 s | D→G | 0 s | 3 séries de 12 répétitions, sans pause entre les séries, en changeant de côté de D→G. Durée totale ≥ 2 min 24 s. |
| 28 | À l'échec | 1 | — | — | — | Aucun | — | 1 série jusqu'à l'échec, sans changement de côté. |
| 29 | À l'échec | 1 | — | — | — | D→G | 5 s | 1 série jusqu'à l'échec, en changeant de côté de D→G après 5 s de pause. |
| 30 | À l'échec | 1 | — | — | — | D→G | 0 s | 1 série jusqu'à l'échec, en changeant de côté de D→G. |
| 31 | À l'échec | 3 | — | — | 15 s | Aucun | — | 3 séries jusqu'à l'échec, avec 15 s de pause entre les séries, sans changement de côté. |
| 32 | À l'échec | 3 | — | — | 15 s | D→G | 5 s | 3 séries jusqu'à l'échec, avec 15 s de pause entre les séries, en changeant de côté de D→G après 5 s de pause. |
| 33 | À l'échec | 3 | — | — | 15 s | D→G | 0 s | 3 séries jusqu'à l'échec, avec 15 s de pause entre les séries, en changeant de côté de D→G. |
| 34 | À l'échec | 3 | — | — | 0 s | Aucun | — | 3 séries jusqu'à l'échec, sans pause entre les séries, sans changement de côté. |
| 35 | À l'échec | 3 | — | — | 0 s | D→G | 5 s | 3 séries jusqu'à l'échec, sans pause entre les séries, en changeant de côté de D→G après 5 s de pause. |
| 36 | À l'échec | 3 | — | — | 0 s | D→G | 0 s | 3 séries jusqu'à l'échec, sans pause entre les séries, en changeant de côté de D→G. |