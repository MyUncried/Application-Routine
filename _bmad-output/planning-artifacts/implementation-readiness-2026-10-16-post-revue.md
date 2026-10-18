# PRE-4 — Porte de préparation à l'implémentation, après la revue ChatGPT

Date : 2026-10-16. Porte : `bmad-sprint-planning`, `references/readiness-gate.md`. Revue en lecture seule, ciblée sur les zones modifiées après la revue indépendante ChatGPT (R1 à R4) et les décisions Q27 à Q30. L'ancienne porte (`implementation-readiness.md`) reste historique, sans modification. Ce document n'est ni une nouvelle revue ChatGPT ni une autorisation de développement : celle-ci appartient à Hermann.

Question de la porte : **un développeur pourrait-il implémenter ces epics sans inventer de décisions non enregistrées ?**

Documents relus : `_bmad-output/revue-chatgpt/revue-chatgpt-2026-10-16.md` et `journal-corrections-2026-10-16.md` ; `docs/preparation/PRE-4/bmad/questions-ouvertes.md` ; PRD `prds/prd-kodjo-pre4-2026-10-16/prd.md` ; spine `architecture/architecture-kodjo-pre4-2026-10-16/ARCHITECTURE-SPINE.md` ; `epics.md` et `epics-parts/` ; `implementation-artifacts/sprint-status.yaml` ; ch. 13 consolidé l. 4090-4106 ; `src/features/activities/ActivityMediaList.tsx` (comportement de départ des tuiles Médias, pour R3).

## Verdict

**CONCERNS.** Aucun constat critique ni élevé. R1 et R4 sont corrigés de façon cohérente dans tous les documents actifs ; R3 est tranché par Q27 et porté par une story dédiée ; Q29 et Q30 sont répercutés, et les calculs refaits sont justes. Il reste trois constats moyens, dont deux dans la zone R2 (table de transitions d'AD-15 incomplète pour les champs ± hors tableau) et un dans la zone R3 (geste qui déclenche la lecture d'un Média). Ils ne bloquent ni l'Epic 1 ni l'Epic 2. Ils doivent être levés avant le démarrage des stories 3.6 et 4.5, sans quoi le développeur devrait choisir lui-même un comportement.

## Constats

### Critiques

Aucun.

### Élevés

Aucun.

### Moyens

**M1 — AD-15 : les transitions d'un `stepper(champ)` ouvert ne sont pas modélisées, et deux lignes de la table contredisent FR-03-05.**
- *Emplacement :* spine AD-15, table T1-T19 (lignes T10, T13, T16, T18) ; PRD FR-03-05 (deuxième et troisième conséquences), FR-10-05 ; story 3.6 AC9 (dernier « And »).
- *Constat :* `openSurface` comprend `stepper(champ)` (N, Pause commune, Pause au changement de côté, Bip, Compte à rebours, Fin), mais aucune ligne ne traite un appui pendant qu'un stepper est ouvert :
  - T10 a pour condition `openSurface ≠ none`. Toucher une cellule pendant qu'un stepper est ouvert ferme donc le stepper **sans activer** la cellule. Or FR-03-05 exige que « l'appui sur une autre valeur ferme le précédent et ouvre le nouveau en un seul geste », et FR-10-05 étend ce modèle au tableau.
  - Rien ne couvre un stepper ouvert quand l'utilisateur touche une autre valeur hors tableau : T16 exige `openSurface = none`. Rien ne couvre non plus la fermeture d'un stepper par un appui extérieur : T7 ne vaut que pour un rappel natif de Popover, et T13 exige `openSurface = none`.
  - T18 range « N diminué » sous la condition `openSurface = none`, avec `openSurface` à `none` après. Mais N ne diminue que par le stepper de N, qui est alors ouvert. Lue à la lettre, la ligne referme le stepper à chaque appui sur −.
  - Story 3.6 AC9 dit qu'un appui extérieur, pendant qu'un Sélecteur ou un popover est ouvert, « peut activer dans le même geste une cible inoffensive ». T10 dit le contraire pour le Sélecteur.
- *Effet :* la preuve de 3.6 (« un test par transition T1 à T19 ») ne fixe pas ces cas. Le développeur devrait inventer le comportement du stepper dans le réducteur.
- *Correction :* dans AD-15, ajouter des lignes pour le `stepper(champ)` ouvert : appui sur une autre valeur hors tableau → `stepper(autre)` dans le même geste ; appui sur une cellule → T2, T3 ou T4 dans le même geste (FR-03-05) ; appui extérieur → `none` ; ± du stepper → `openSurface` inchangé. Restreindre T10 aux surfaces natives (`popover`, `selector`). Corriger T18 pour N, avec `openSurface = stepper(N)` conservé. Aligner la dernière phrase de 3.6 AC9 sur T10. Skill : `bmad-architecture`, puis report dans `epics-parts/epic-3.md` et dans l'assemblage.

**M2 — Q27 / FR-21-05 / AD-17 / story 4.5 : le geste qui lance la consultation n'est pas fixé par rapport au menu existant de la tuile.**
- *Emplacement :* `questions-ouvertes.md` Q27 (« toucher une vidéo la lit ») ; PRD FR-21-02, deuxième conséquence (« action de lecture … aux pictogrammes de la référence visuelle ») ; AD-17 (« au toucher de l'action « Lire la vidéo » de la tuile ») ; story 4.5 AC2 et AC3 ; story 4.4 AC3 (« menu natif existant »).
- *Constat :* dans le code de départ, un appui sur la tuile ouvre le menu natif Retirer / Monter / Descendre, et le commentaire de `MediaTile` précise : « Aucun bouton supplémentaire n'est dessiné sur la galerie » (`ActivityMediaList.tsx:166-170`, D-335). Les documents révisés posent un pictogramme d'action, avec une cible tactile de 44 × 44 pt (FR-21-05). Ils ne disent pas :
  - si le toucher de la tuile reste réservé au menu, comme le veulent P18 et NFR-03 ;
  - si un pictogramme touchable s'ajoute sur la tuile, ce qui contredit le commentaire D-335 ;
  - ce que signifie le « toucher une vidéo » de Q27.
- *Correction :* écrire dans FR-21-05, AD-17 et 4.5 la règle retenue. Proposition cohérente avec FR-21-02, Figma 8328:35740 et P18 : un bouton-pictogramme distinct sur la tuile, avec une cible de 44 × 44 pt, lance la consultation ; le reste de la tuile ouvre toujours le menu natif. Le commentaire D-335 est amendé. Si Hermann entendait que le toucher de la tuile lise la vidéo, le menu change de geste, et c'est à lui de le confirmer. Skill : `bmad-prd` (FR-21-05), puis `bmad-architecture` (AD-17) et les epics.

**M3 — Réserve de la revue sur H22 (terme « durées » de l'invite de la Carte vide) ni traitée ni consignée.**
- *Emplacement :* revue ChatGPT §4 (« H22 ne doit pas imposer un terme « durée » inadapté au cas Répétitions sans vérification ») ; `questions-ouvertes.md` H22 (inchangée) ; `journal-corrections-2026-10-16.md` (aucune ligne H22) ; PRD FR-02-06 ; story 4.2 AC6.
- *Constat :* H22 est bien marquée comme hypothèse, ce qui la distingue d'une décision. Mais la réserve précise de la revue n'apparaît nulle part : ni vérification, ni question à Hermann, ni mention dans le journal. Le développeur codera « Appuyez pour définir les séries et les durées » sans savoir si ce texte est contesté.
- *Correction :* ajouter la réserve à H22 dans `questions-ouvertes.md` et dans le journal. Soit Hermann tranche (texte de la capture conservé, ou texte neutre), soit le point est inscrit comme à valider en recette R-4.2. Non bloquant pour les Epics 1 à 3.

### Faibles (6)

- **F1 — AD-15, T19, condition « — ».** La ligne admet le ✓ ou le ✕ de la Feuille avec une surface ouverte. Or 3.8 AC5 et FR-22-11 disent que, roulette ouverte, ✓ de la Feuille n'est pas déclenché. Le popover natif absorbe l'appui, donc sans effet pratique ; préciser la condition `openSurface = none`, ou ajouter le renvoi à T7. *(spine AD-15)*
- **F2 — `Annuler` du retrait pendant qu'une Cellule est active.** T18 suppose « outil rangé » et T13 ne cite pas `Annuler` parmi les cibles inoffensives. Après R-3.6-04 (Sélecteur fermé par ✕, donc `activeCell` conservée par T6), on ignore si un appui sur `Annuler` restaure la ligne ou range seulement l'outil. À préciser dans T13. *(spine AD-15 ; story 3.6 R-3.6-04)*
- **F3 — Sélecteurs `commonTarget` et `total` absents de la table.** Leur ouverture, leur ✓ et leur ✕ ne sont décrits que pour `rowTarget` (T2 à T6). La règle générale et FR-07-05 suffisent à les déduire ; deux lignes les rendraient explicites. *(spine AD-15)*
- **F4 — Traçabilité secondaire.** Cinq renvois principaux de la couverture consolidée ne sont pas cités dans le texte de la story visée : FR-03-03 → 3.2, FR-20-11 → 4.6, FR-22-04 → 4.3, FR-22-06 → 4.2, FR-18-13 → 1.4 (couvert par la plage « FR-18-10 à FR-18-16 »). S'y ajoutent sept renvois secondaires, entre parenthèses : FR-02-13 → 4.3/4.4, FR-13-05 → 2.2, FR-17-02/03 → 1.1, FR-19-06/09 → 1.1, FR-22-03 → 4.5. La table E4 donne aussi « FR-22-03 | 4.5 AC2 », alors que 4.5 AC2 ne cite pas FR-22-03. Chaque FR a par ailleurs une story principale qui la cite. *(epics.md, couverture consolidée et Couverture E4)*
- **F5 — Dépendance de 2.1.** Le squelette donne « 2.1 dépend de 1.1 », et la story « 1.1, 1.3 ». La dépendance reste orientée vers l'arrière ; aligner le squelette. *(epics-parts/00-squelette.md ; story 2.1)*
- **F6 — `LISEZ-MOI-REVUE.md` périmé** pour l'archive révisée : il indique 196 FR, 16 décisions AD et 21 stories, au lieu de 197, 17 et 22. À mettre à jour avant de transmettre la nouvelle archive. *(`_bmad-output/revue-chatgpt/LISEZ-MOI-REVUE.md:31, 35, 37, 39`)*

Deux points mineurs ne sont pas comptés comme constats. La liste de Q29, dite « exhaustive » en 3.2 AC10, ne cite ni le Changement de côté, ni l'Ordre des côtés, ni la Pause au changement de côté, ni le Compte à rebours, ni la Fin ; l'en-tête « toute modification du Brouillon » de Q29 et de FR-12-05 les couvre. FR-18-20 ne cite pas `sideMode` ou `sideOrder` inconnus, que la spine AD-4 (d) précise.

## Réexamen des zones modifiées

### 1. R1 — Tolérance historique

- Story 1.1 AC7, tableau unique : 150 inchangée → tolérée ; 150 → 100 valide ; 150 → 101 et 150 → 120 refusées ; 5999 inchangée tolérée, 5995 refusée, 3535 valide ; Bip 11 toléré, 12 refusé, 10 valide. Comparaison champ par champ ; ni le renommage ni une Pause ne transforment une valeur inchangée en nouvelle saisie ; tolérance liée au Mode de la ligne de base.
- Même contenu dans PRD FR-09-05 (dernière conséquence et tableau) et dans FR-18-07 (deuxième conséquence) ; cohérence avec FR-09-02 (1, 100 acceptés ; 101 refusé) et 1.1 AC6.
- Sources. Ch. 13 l. 4092 : « Répétitions par Série | 1..100 ». L. 4106 : bornes du 13/10 et « valeurs historiques ne sont pas arrondies silencieusement à la lecture ». Conformes.
- Décisions. H25 : seule une valeur modifiée respecte les bornes. Q21 : le Sélecteur s'ouvre sur 100 depuis 150, et ✓ applique 100, valeur valide. Concordant.
- Recherche dans le PRD, la spine, `epics.md` et `recette-iphone.md` : aucun autre exemple n'accepte une nouvelle valeur hors borne (`→ 120`, `120 accept`, `→ 5999`, `Bip 12` n'apparaissent que comme refus).

### 2. R2 — AD-15 (`openSurface` et `activeCell`)

AD-15 sépare les deux états et donne une table T1 à T19 avec une règle contre les rappels tardifs (`surfaceKey` et génération). Elle est cohérente avec :
- FR-10-02 : une seule Cellule active ;
- FR-10-03 : après ✓ ou ✕ la cellule reste active ; un appui extérieur range l'outil ; ± indisponibles pendant le Sélecteur ;
- FR-10-04 : Pied sans Cellule active, ± indisponibles ; `UNSET` + → minimum ;
- FR-22-11, Q13, Q25 et Q26 ;
- les stories 3.3 (AC7 : T8, T15), 3.6 (AC3, AC4, AC9) et 3.8 (AC5).

Les stories 1.1 à 3.5 ne mentionnent plus l'ancienne union `activeSurface` (seule trace : l'historique de la spine). Séquences jouées pas à pas :

| Séquence | Pas | État obtenu | Résultat |
|---|---|---|---|
| **R-3.6-08** (Durée, `variables`, N = 3, ligne l à `—`) | Ouverture → T1 | `none` / `none` ; ± indisponibles (T12, Q26) | conforme |
| | Toucher `—` → T3 | `selector(rowTarget(l))`, clé k1 / `{ l, target }` ; roue sur 00:05 (Q25) ; ± indisponibles (T12) | conforme |
| | ✕ → T6 | `none` / `{ l, target }` ; Cible `UNSET` | conforme (R2 corrigé) |
| | Rappel natif tardif (k1) → T8 | `openSurface = none` : ignoré ; `activeCell` conservée | conforme |
| | − → T12 | `stepTarget(UNSET, −) = unavailable` : rien | conforme |
| | + → T11 | Cible `NUMBER 5`, contour retiré | conforme |
| | Appui hors du tableau → T13 | `none` / `none` ; ± indisponibles | conforme |
| **S2** : Pause l1, puis Cible l2 (30 s), ✓ sur 45 s, + | T4 → T9/T2 → T5 → T11 | `{ l2, target }` conservée après ✓ ; Cible 45 puis 50 s | conforme |
| **S3** : Cible l3 ouverte, appui sur la croix de l1 | T2 → T10 (= T7, même clé) | `none` / `none` ; croix non déclenchée ; cellule non activée ; rien appliqué | conforme (FR-10-04, FR-22-11) |
| **S4** : stepper de N ouvert, − puis toucher la Cible de l2 | T16 → (N−1 : T18 exige `openSurface = none`, non satisfait) → (toucher la cellule : T10 → ferme, n'active pas) | Transition de N non définie quand un stepper est ouvert ; le toucher de la cellule contredit FR-03-05 (« un seul geste ») | **non conforme : M1** |

### 3. R3 / Q27 — Médias dans l'Éditeur

- PRD. FR-21-02 réécrite : actions de consultation, avec renvoi à FR-21-05. FR-21-04 limitée à l'Exécution, avec la conséquence « n'importe aucun module d'Exécution ». FR-21-05 nouvelle : pas de lecture automatique, lecteur natif, photo en plein écran, retour sans perte, erreur locale, accessibilité. Conforme à Q27.
- Spine AD-17 : `expo-video` ~57.0.5 et son plein écran natif ; photo par `Modal` en plein écran et `expo-image` ; aucune lecture automatique ; lecteur créé à la demande et libéré au démontage ; indépendance du moteur d'Exécution ; état d'erreur ; libellés. Les décisions techniques sont enregistrées.
- Story 4.4 AC4 renvoie à 4.5. La story 4.5 a 7 critères d'acceptation, ses preuves et `R-4.5-01` à `R-4.5-04`, rattachés à `R-51` et `R-52`, présents dans la liste et la matrice ED-21. Elle dépend de 4.4. La story 4.6, ancienne 4.5, dépend de 4.1 à 4.5 et de 3.8, et ses scénarios sont `R-4.6-xx`.
- Aucune référence résiduelle à l'ancienne numérotation n'a été trouvée : les mentions « 4.5 » de la couverture désignent la nouvelle story. `sprint-status.yaml` compte 22 stories, avec `4-5-consulter-un-média-dans-l-éditeur-lecteur-natif` et `4-6-fidélité-accessibilité-et-recette-finale-de-l-éditeur`.
- Reste ouvert : le geste déclencheur, par rapport au menu de la tuile (**M2**).

### 4. R4 / Q28 — Prédicat d'illisibilité

- Spine AD-4 (h) : valeur négative ou non entière de la Cible, de toute Pause, de la Pause au changement de côté, du Bip, du Compte à rebours ou de la Fin, dans les deux tables, quelle que soit la ligne, en JSON v1 comme en scalaires, testée à l'étape 1. Les valeurs positives hors bornes sont conservées, sauf (g) dans `activities`. Cible absente, `null` ou 0 → `UNSET`. Aucun calcul n'utilise une valeur négative.
- AD-13 : une valeur négative ou non entière est une violation structurelle, et une valeur positive héritée reste enregistrable.
- PRD : FR-18-14 (troisième et sixième conséquences, note de frontière) ; FR-18-20 (liste fermée et effets par donnée : Pause −5 s en ligne 2 et Bip 2,5 écartés, total 2 ; Cible 150 conservée).
- Story 1.1 : AC5, structurel, valeurs positives hors bornes acceptées ; AC9 (c11), un test par champ et par forme, lignes 1 et 2, JSON et scalaires ; AC14, positifs conservés, négatifs et non entiers renvoyés à (c11). Story 1.4 AC3 : `count` = 4, dont 2 selon Q28.
- Comportement identique quelle que soit la table ou la ligne : vérifié. Les seuls « −1, 2,5, 1,5 » restants désignent des **refus de saisie** (FR-09-02, FR-09-03, FR-18-06, 1.1 AC6) ou des **cas d'écart** (AC9, 1.4 AC3). Les seuls « 1,5 » restants sont l'épaisseur du contour. **Plus aucune conservation de −5 ni de 2,5 dans les documents actifs.** P40 est remplacée et P44 amendée ; leur texte initial n'est gardé qu'à titre historique et marqué comme tel.

### 5. Q29 et Q30

- **Q29.** FR-12-05 (dernière conséquence), story 3.2 AC10 (un test par cas, et ouverture ou fermeture sans application testée) et story 3.6 AC9 / R-3.6-04 donnent la même liste et la même exception (ouverture ou fermeture d'un popover ou du Sélecteur sans application). H5 apparaît « confirmée par Q29 » et ne figure plus dans les lignes « Hypothèses non validées ». Cohérent.
- **Q30.** FR-13-05 (dernière conséquence), FR-15-03 (attendu 105 s), FR-15-04 (attendu 270 s) ; AD-5 : issue `incomplete` avec `knownSeconds`, pli d'agrégation en `lowerBound` ; stories 2.1 AC5, 2.2 AC4, 2.4 AC3 et AC5 ; C-E2-3. H30 est remplacée et retirée des hypothèses actives. Cohérent. Calculs refaits :

| Cas | Calcul | Documents | Vérifié |
|---|---|---|---|
| 30 s / `UNSET` / 45 s, Pauses 10 s × 3, unilatéral | (30 + 45) + (10 + 10 + 10) = 105 s | 105 s | oui |
| Répétitions Bip 0, 10 / `UNSET` / 12, Pauses 10 s × 3 | Pauses seules = 30 s | 30 s | oui |
| Séance : 165 s exact + Copie de 105 s | 165 + 105 = 270 s, `lowerBound` | 270 s ≥ | oui |
| Contrôle 165 s exact | (30 + 45 + 60) + 30 = 165 s | 165 s | oui |
| 165 s + 104 s estimé | 269 s, `estimated` | 269 s | oui |
| 165 s + Répétitions Bip 0 (Pauses 30 s) | 195 s, `lowerBound` | 195 s | oui |
| Bilatéral « Les deux côtés à chaque série », 30 s / échec, P 10/10, PC 5 | 2 × 30 + 20 + 2 × 5 = 90 s ; 90 − 10 + 40 = 120 s | 90 s, 120 s | oui |
| « Un côté après l'autre », même cas | 2 × (30 + 10 + 10) + 5 = 105 s ; 105 − 10 + 40 = 135 s | 105 s, 135 s | oui |
| Tableau FR-13-04 (A à N 1 bilatéral, douze séries) | 195 ; 285 ; 405 ; 375 ; 315 ; 640 et 615 ; 220 et 235 ; 510 | idem | oui |

### 6. Cohérence générale

| Contrôle | Résultat |
|---|---|
| FR uniques | 197 titres `#### FR-` dans le PRD, aucun doublon |
| Couverture FR → story | 197 FR dans la couverture consolidée, ni manque ni excédent ; inventaire de `epics.md` identique ; chaque FR a au moins une story qui la cite (écarts secondaires : F4) |
| Dépendances | Toutes vers l'arrière (contrôle automatique sur les 22 lignes « Dépend de ») ; 4.5 → 4.4 ; 4.6 → 4.1 à 4.5 et 3.8 |
| Références Q, P et H | Tous les identifiants `Q`, `P` et `H` cités dans le PRD, la spine et `epics.md` existent dans `questions-ouvertes.md` ; Q10 est close par P6 ; P40 et H30 ne sont cités que comme remplacés |
| Parties et assemblage | `epics-parts/epic-1.md` à `epic-4.md` identiques octet pour octet, hors CR, aux sections de `epics.md` |
| `sprint-status.yaml` | 4 epics, 22 stories en `backlog`, clés conformes aux titres, rétrospectives optionnelles |
| Arrêt avant développement | Respecté : aucun document ne vaut autorisation ; `src/` et `app/` non modifiés par la préparation |

## Conditions de clôture de la revue ChatGPT

| Condition (revue §6) | État | Preuve documentaire |
|---|---|---|
| **R1 corrigé de façon cohérente** | **Satisfaite** | Story 1.1 AC7 (tableau unique) ; PRD FR-09-05 (tableau) et FR-18-07 ; cohérent avec ch. 13 l. 4092 et 4106, H25 et Q21 ; aucun autre exemple ne tolère une nouvelle valeur hors borne |
| **R2 corrigé de façon cohérente** | **Satisfaite pour l'écart relevé, avec réserve M1** | AD-15 révisé (`openSurface` et `activeCell` distincts, T1-T19, règle contre les rappels tardifs) ; FR-10-03 ; stories 3.3 AC7 et 3.6 AC3, AC4, AC9 ; R-3.6-08 rejoué conforme. La table reste incomplète pour les steppers hors tableau (M1), hors du cas précis signalé par la revue |
| **R3 résolu explicitement** | **Satisfaite, avec réserve M2** | Q27 (arbitrage de Hermann, qui distingue Éditeur et Exécution) ; FR-21-02, FR-21-04, FR-21-05 ; AD-17 ; stories 4.4 AC4 et 4.5 ; R-51 et R-52. Le geste déclencheur par rapport au menu existant reste à écrire (M2) |
| **R4 arbitré ou démontré couvert** | **Satisfaite** | Q28 (arbitrage de Hermann, exemples concrets et effets sur Catalogue, Séance, calcul et enregistrement) ; AD-4 (h) et AD-13 ; FR-18-14 et FR-18-20 ; 1.1 AC5, AC9 (c11) et AC14 ; 1.4 AC3 ; P40 remplacée et P44 amendée, gardées comme historique |
| **Hypothèses produit retenues distinguées des propositions** | **Partiellement satisfaite** | H5 confirmée par Q29, H30 remplacée par Q30, H2 décrit l'état Git vérifié (`a8ec6c35`) ; les autres hypothèses restent marquées `[ASSUMPTION]` et listées par story. La réserve de la revue sur H22 n'est ni traitée ni consignée (M3) |
| **Réexamen des zones modifiées** | **Satisfaite** | Le présent document (§1 à §6). L'ancienne porte `implementation-readiness.md` reste historique, sans modification. Les revues internes antérieures sont marquées « Historique » |
| Maintien de l'arrêt avant développement | **Satisfaite** | Aucune autorisation de `bmad-build` ; arbitrage final et autorisation réservés à Hermann |

## Suite proposée

1. Corriger M1 (AD-15 et story 3.6), M2 (FR-21-05, AD-17, story 4.5) et M3 (H22, journal) ; les faibles F1 à F6 en même temps. Seul M2 peut demander une confirmation de Hermann.
2. Mettre à jour `LISEZ-MOI-REVUE.md` et l'archive révisée, avec leurs empreintes, avant la vérification par ChatGPT des documents révisés.
3. Hermann décide de la suite : faire vérifier les documents révisés par ChatGPT, et autoriser ou non le développement. Les Epics 1 et 2 ne dépendent d'aucun des constats moyens.

## Traitement (2026-10-16, après Q31)

Traitement des constats ci-dessus, après la décision Q31 de Hermann (geste de consultation d'un Média) et la précision de H22 dans `questions-ouvertes.md`. Le verdict initial (CONCERNS) et les constats restent tels quels ; cette section n'est ni une revue ChatGPT ni une autorisation de développement.

| Constat | Correction | Emplacement |
|---|---|---|
| **M1** — stepper ouvert non modélisé ; T10 et T18 contraires à FR-03-05 | Surfaces natives (`popover`, `selector`, appui absorbé) et `stepper(champ)` (appui reçu par la cible) distinguées. T10 restreinte aux surfaces natives. Nouvelles lignes : T20 (autre valeur → autre stepper, un geste), T21 (cellule → stepper fermé et cellule activée, avec Sélecteur pour une Cible, un geste), T22 (± d'un stepper sans fermeture ; N diminué sans fermer le stepper de N), T23 (appui extérieur : rangement, cible inoffensive activée, jamais la croix). T15, T16 et T13 complétées ; « N diminué » sorti de T18 ; règle défensive « Ligne disparue » | Spine AD-15 (Rule et table T1 à T27), AD-16 ; PRD FR-10-05 ; story 3.3 (Architecture, AC8, preuves, `R-3.3-04`) ; story 3.6 (Architecture, Exigences, AC2, AC3, AC9, preuves, `R-3.6-09`) ; R-28 ; memlog de la spine |
| M1 — 3.6 AC9 contraire à T10 | Phrase scindée : champ ± ou Cellule active → cible inoffensive activée dans le même geste ; Sélecteur ou popover → appui absorbé, rien d'activé | Story 3.6 AC9 |
| **M2** — geste de consultation non fixé | Q31 appliquée : toucher la tuile consulte (vidéo plein écran par le lecteur natif, photo plein écran) ; menu Retirer / Monter / Descendre à l'appui long, menu contextuel natif (`ContextMenu` d'`@expo/ui`, `[ASSUMPTION]` vérifiée en ouverture de 4.5, repli `ActionSheetIOS` à l'appui long signalé à Hermann) ; actions VoiceOver conservées comme alternative ; aucun bouton ajouté ; D-335 amendée ; changement de geste livré atomiquement en 4.5 | PRD glossaire (Média), FR-21-02, FR-21-03 (note), FR-21-05, FR-22-09, §9 point 10, table de traçabilité (ligne Q31) ; spine AD-17, QA-10, carte des capacités ; story 4.4 (Exigences, Architecture, AC1, AC3, AC4, preuves, `R-4.4-02`) ; story 4.5 (Exigences, Architecture, AC2, AC3, AC6, AC7, nouvelles AC8 et AC9, preuves, `R-4.5-05`, hors story) ; story 4.6 AC8 ; R-41, R-51, R-52 ; couverture E4 ; E4-3 ; squelette |
| M2 — non-régression Retirer / Monter / Descendre | Tests de non-régression écrits en 4.4 indépendamment du geste, rejoués en 4.5 par l'appui long et par VoiceOver, attendus inchangés (options selon la position, retrait du seul lien) | Story 4.4 AC3 et preuves ; story 4.5 AC8 ; R-41 |
| **M3** — réserve H22 | H22 précisée reflétée : invite de la seule Carte vide, sans Mode validé, donc avant tout cas Répétitions ; texte d'invite inchangé ; un test vérifie qu'aucune Carte à Mode validé n'affiche l'invite | PRD FR-02-06 (conséquence et note), §10 et annexe A (H22) ; story 4.2 AC6. `journal-corrections-2026-10-16.md` non modifié par cette passe |
| **F1** — condition de T19 | T19 conditionnée à `openSurface` = `none` ou `stepper` ; avec un popover ou un Sélecteur ouvert, renvoi à T10 (appui absorbé, ✓ et ✕ de la Feuille non déclenchés, FR-22-11) | Spine AD-15, T19 |
| **F2** — `Annuler` avec une Cellule active | T27 : `Annuler` ne range rien (ni stepper ni Cellule active, dont la ligne existe toujours) ; la restauration n'invalide rien ; activer une cellule ou ouvrir un stepper n'est pas une modification du Brouillon (Q29). T13 exclut `Annuler` | Spine AD-15 (T13, T27) ; PRD FR-12-05 ; story 3.6 AC9 et `R-3.6-04` |
| **F3** — Sélecteurs commun et du total absents | T24 (ouverture, stepper éventuel rangé), T25 (✓ : Cible commune ou Inversion du total), T26 (✕), ligne de renvoi à T7, T8, T10 (fermeture extérieure, rappel tardif, autre contrôle) | Spine AD-15 ; stories 3.4 et 3.7 (Architecture) ; 3.6 (tests T1 à T27) |
| **F4** — renvois de couverture non cités | Mention ajoutée dans la story visée : FR-03-03 → 3.2 (Exigences, AC11) ; FR-20-11 → 4.6 (Exigences, AC11) ; FR-22-04 → 4.3 (Exigences, AC2) ; FR-22-06 → 4.2 (Exigences, AC5) ; FR-18-13 → 1.4 (Exigences, explicite) ; FR-02-13 → 4.3 et 4.4 (AC1) ; FR-13-05 → 2.2 (Exigences, AC4 ; table E2) ; FR-17-02, FR-17-03, FR-19-06, FR-19-09 → 1.1 (Exigences, « vérifiées sans en être le porteur ») ; FR-22-03 → 4.5 (Exigences, AC2, AC8 ; table E4 corrigée en « 4.5 AC2, AC8 »). Couverture complétée : FR-12-02 → 3.2 (3.6), FR-22-09 → 4.6 (3.6, 4.5) | `epics-parts/epic-1.md` à `epic-4.md` ; `epics.md` (couverture consolidée) |
| **F5** — dépendance de 2.1 | L'AC8 de 2.1 utilise la copie et l'Instantané v2 de 1.3 : story et squelette donnent « 1.1, 1.3 » | Story 2.1 ; `epics-parts/00-squelette.md` |
| **F6** — `LISEZ-MOI-REVUE.md` périmé | Décomptes mis à jour (Q1 à Q31, 197 FR, 17 AD, 22 stories, porte post-revue citée) ; note : l'archive et `MANIFEST-SHA256.txt` de la première transmission restent à régénérer | `_bmad-output/revue-chatgpt/LISEZ-MOI-REVUE.md` |

**Séquence S4 rejouée** (Durée, `variables`, N = 3, Cibles 30 s, 45 s, 60 s, aucune Cellule active) :

| Pas | Transition | État obtenu | Résultat |
|---|---|---|---|
| Toucher la valeur de N | T16 | `stepper(N)`, clé k1 / `none` ; ± du Pied indisponibles (T12) | conforme |
| − | T22 | N = 2, ligne 3 retirée du Brouillon ; `stepper(N)` toujours ouvert, clé k1 ; aucune Cellule à désactiver ; un `Annuler` en attente serait invalidé (Q29) | conforme |
| Toucher la cellule de Cible de la ligne 2 | T21 → T2 | stepper fermé et, dans le même geste, `selector(rowTarget(l2))`, clé k2 / `{ l2, target }` ; roue sur 00:45 ; Brouillon inchangé | **conforme** (FR-03-05 « un seul geste », FR-10-05) |
| Variante : Cible l3 active, puis toucher N, puis − | T13 + T16, puis T22 | `stepper(N)` / `none` ; la ligne 3 disparaît sans Cellule active à perdre | conforme |
| Variante : Sélecteur de l2 ouvert, puis toucher N | T10 | `none` / `none` ; le stepper de N ne s'ouvre pas par ce geste (appui absorbé par la primitive) | conforme (FR-22-11) |

**Contrôles après traitement.** 197 titres `#### FR-` dans le PRD, sans doublon ; couverture consolidée et inventaire de `epics.md` égaux à la liste du PRD ; chaque renvoi « FR → story » de la couverture consolidée, parenthèses comprises, est cité dans le texte de la story visée (contrôle automatique sur les 22 stories) ; dépendances toutes vers l'arrière ; tous les identifiants Q, P et H cités dans le PRD, la spine et `epics.md` existent dans `questions-ouvertes.md`, Q31 comprise ; `epics-parts/epic-1.md` à `epic-4.md` identiques aux sections de `epics.md`. `src/` et `app/` non modifiés.

**Verdict estimé après traitement : PASS**, sous trois réserves qui ne demandent aucune décision non enregistrée : (1) la primitive du menu contextuel natif reste une hypothèse technique, vérifiée sur iPhone en ouverture de 4.5 avec un repli défini et signalé ; (2) l'archive de transmission est à régénérer avant la vérification des documents révisés par ChatGPT ; (3) H22, H13 et H23 restent des hypothèses produit, marquées comme telles. Ce verdict est une estimation de Claude : la vérification par ChatGPT et l'autorisation de développement appartiennent à Hermann.
