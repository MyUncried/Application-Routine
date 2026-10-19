# Réconciliation PRD PRE-5 ↔ table de delta et décisions du 19/10

**Date :** 2026-10-19. **Lecture seule** des documents comparés ; seul ce fichier est écrit.
**Comparé :** `prd.md` et `addendum.md` (ce dossier).
**Références :** `table-delta.md` (§1 à §6 ; §6 prime sur §3) ; `sources-2026-10-19/PRE5_BMAD_Decisions_v2.md` ; `sources-2026-10-19/KODJO_PRE5_Reponses_QP5-01_a_QP5-09_et_consigne_BMAD_2026-10-19.md`. Pour vérifier un détail, j'ai aussi consulté la spécification des phases (§2) et la spécification de la charge v3 (AR-01, RO-01, CH-05).
**Fait postérieur pris pour acquis :** Δ50, bornes minimales des durées. Il n'est pas signalé comme écart. Il remplace D-232/RM-234 pour les durées et la lecture « 5..3535 » de QP5-04.

Légende : **OK** = couverture fidèle et détaillée ; **Mineur** = détail perdu ou formulation à préciser, sans contresens ; **Écart** = contresens, invention ou question tranchée sans décision.

---

## 1. Écarts principaux (par gravité)

### E-1 — FR-8 contredit l'arbitrage final de QP5-04 sur Avec → Sans (contresens)

- **PRD, FR-8, dernière puce :** « Revenir à Avec tant que la Feuille est ouverte restaure les phases. Elles ne sont supprimées qu'au ✓. » Sources citées : « QP5-04 (d) ».
- **Décision (`table-delta.md` §6, QP5-04, arbitrage final du 19/10) :**
  - revenir à Avec crée **une seule phase**, à la durée actuelle de la série, **sans mémoriser les anciennes phases** ;
  - « La restauration tant que la Feuille reste ouverte, prévue en (d) de la §3, est **abandonnée** » ;
  - seule l'annulation de la Feuille (✕) restaure la configuration précédente.
- **Détails perdus du même arbitrage :**
  - la durée obtenue (somme) reste modifiable selon les règles existantes ;
  - les autres paramètres sont conservés ;
  - si aucune durée valide ne peut être déduite, rien n'est inventé ;
  - exemple de recette : 6 + 3 + 5 s → 14 s.
- **Correction :** réécrire FR-8 :
  - « Passer à Sans retire les phases ; leur somme devient la durée unique de la série (6 + 3 + 5 s → 14 s), modifiable selon les règles existantes ; les autres paramètres sont conservés. » ;
  - « Revenir ensuite à Avec crée une seule phase à la durée actuelle de la série, sans restaurer les anciennes phases. » ;
  - « Seul ✕ restaure la configuration antérieure. Si aucune durée valide ne peut être déduite, rien n'est inventé. »
  - Remplacer « QP5-04 (d) » par « QP5-04, arbitrage final du 19/10 ».

### E-2 — FR-5 et FR-9 : « ✓ indisponible » pour une Phase 1 à renseigner, mécanisme non décidé et en tension avec la normalisation

- **FR-5 :** sans durée de série, « Phase 1 » est créée à renseigner, avec « fond rouge pâle, ✓ indisponible ».
- **FR-9 :** les phases à 0 s sont retirées « sans message ni blocage » ; une liste vide ou nulle revient à « Aucune » ; si la cible reste absente ou invalide, « la validation existante s'applique ».
- **Décision QP5-04 (§6) :** « à défaut, Phase 1 reste à renseigner (§2.2) … Si la cible reste absente ou invalide, la validation existante s'applique ». La spécification des phases §2.2 va dans le même sens : « une liste entièrement vide ou nulle revient à Aucune ; aucune durée positive n'est inventée et les règles existantes de complétude de l'exercice restent applicables ».
- **Problème :** le « ✓ indisponible » vient de la recommandation (c) de §3. Le §6 l'a reformulée : le blocage passe par la cible de série absente (validation existante), pas par la phase elle-même. Dans le PRD, une Phase 1 vide est à la fois bloquante (FR-5) et retirée sans blocage (FR-9). Les stories hériteraient de deux mécanismes concurrents.
- **Correction :** dans FR-5, remplacer « fond rouge pâle, ✓ indisponible » par « la durée est à renseigner (fond rouge pâle, convention existante) ; à la validation, une phase non renseignée suit FR-9 et, si la cible de série reste absente, la validation existante s'applique ». Mettre FR-9 en cohérence avec cette phrase.

### E-3 — Δ48 : les cas de test et de recette explicitement demandés manquent

- **Décision (Δ48, et Décisions v2 « Conséquence BMAD ») :** prévoir explicitement les cas Répétitions × Identiques, Répétitions × Variables et cible À l'échec avec charge, dans les tests **et dans la recette**.
- **PRD :** le préambule du §4.2 pose bien la règle d'identité entre les Modes. Aucun FR, aucune NFR (NFR-5 ou NFR-6) et aucun critère SM-1 n'exige ces cas.
- **Autres points absents :**
  - FR-12 ne précise pas que, en Répétitions × Identiques × À l'échec, la ligne Répétitions est masquée (FR-21) alors que la ligne Charge reste disponible ;
  - FR-12 ne dit pas où se place alors la ligne Charge (après la Pause).
- **Correction :**
  - ajouter à FR-10 ou FR-14 un critère d'acceptation : « Recette et tests couvrent Répétitions × Identiques, Répétitions × Variables et cible À l'échec avec charge » ;
  - ajouter à FR-12 : « la ligne Charge reste disponible quand la ligne Durée ou Répétitions est masquée par À l'échec (FR-21) ».

### E-4 — FR-42 et FR-43 combinés : ordre non décidé, ni signalé

- **Situation :** un Exercice à phases (Durée, Identiques, À la cible) peut porter une charge. FR-42 place la charge « après la valeur par série » ; FR-43 place la parenthèse des phases « après la durée de série ».
- **Sources :** aucune ne fixe l'ordre relatif. D-414/D-422/D-423 sont antérieurs à la décision QP5-09.
- **PRD :** ne le tranche pas, mais ne le signale pas non plus au §9. La story « Phrase » devra donc inventer l'ordre.
- **Correction :** ajouter au §9 un point signalé, non décidé : « ordre de la parenthèse des phases et de la mention de charge dans la Phrase ». À défaut, prévoir un cas de corpus à faire valider par Hermann. Ne pas choisir l'ordre dans le PRD.

### E-5 — Comportements « Conservés » oubliés ou affaiblis

| Δ | Conservé dans la table | État dans le PRD | Correction |
|---|---|---|---|
| Δ14 | D-249 : non-persistance des variantes cachées, sauf la charge | Absent de FR-9 et de FR-11 | Ajouter à FR-11 : « D-249 reste applicable ; seule la charge conserve ses valeurs cachées (D-403) » |
| Δ28 | PickerToolbar des roues | Absent | Ajouter à FR-22 « roue native et PickerToolbar conservées » |
| Δ31 | `Row`, `ValuePill`, `Separator`, `SheetMotion` | Seules les animations sont citées (FR-32) | Ajouter à FR-26 la liste des briques réutilisées |
| Δ10, spécification des phases §2.2 | Les libellés personnalisés restent attachés à leur phase lors d'un déplacement | Absent de FR-4 | Ajouter à FR-4 |
| Δ43 | Grammaire et ponctuation du corpus | Implicite seulement | Ajouter à FR-18 |
| §6, précisions | L'Enchainement appartient aux paramètres de l'Exercice et reste distinct des variantes d'exécution des formats | Seulement une exclusion des formats (§8) | Ajouter une phrase à FR-17 ou au §8 |

### E-6 — Attributions de sources à corriger (mineur, sans effet fonctionnel)

- **FR-7 :** « Elle prime sur D-412 et sur RO-01, dernière phrase. »
  - Pour RO-01, c'est exact : sa dernière phrase demande de ne pas retirer l'option À l'échec de la roue de phase. QP5-03 la remplace bien.
  - En revanche, les Décisions v2 et le §6 citent D-412 **à l'appui** de QP5-03, pas comme une règle contredite.
  - Formulation proposée : « QP5-03 (fondée sur D-370 et D-412) remplace RO-01, dernière phrase, et clôt C-1. »
- **FR-5 :** le contrôle d'ajout ne cite que `9207:18817`. La recommandation (b) de §3, validée globalement le 19/10, prévoyait un repli : « une ligne d'ajout en fin de tableau, indisponible à six ». Il faut le reprendre, ou indiquer explicitement qu'il est abandonné.

---

## 2. Revue ligne à ligne Δ01–Δ49

| Δ | FR | Verdict | Commentaire |
|---|---|---|---|
| Δ01 | FR-33 | OK | État vide, Entrée, absence de bouton Ajouter, ↑ (D-351), défilement, Terminer immobile et propriétés du registre v25 sont repris. Le curseur placé en fin de l'étape précédente vient de la recommandation de §3, validée globalement : acceptable. |
| Δ02 | FR-34, FR-35 | OK | Copie, duplication et `formValueEquals` (détection de modification) sont couverts. La reprise des anciens textes est exclue (QP5-01). |
| Δ03 | FR-34 | OK | 1 000 caractères au total, numérotation exclue (QP5-02). Le lien avec le CHECK `instruction ≤ 1000` est traité dans l'addendum (Q-A5). |
| Δ04 | FR-36 | OK | — |
| Δ05 | FR-37 | OK | Les couleurs actif et inactif sont conservées. |
| Δ06 | FR-38, §9 | OK | La dépendance à Q48 est bien signalée, pas tranchée. |
| Δ07 | §6 NR | OK | — |
| Δ08 | FR-1 | OK | — |
| Δ09 | FR-3 | OK | Bornes de la somme selon Δ50 ; inversion par N seulement. |
| Δ10 | FR-4, FR-5 | Mineur | Voir E-2 et E-5 (libellés attachés au déplacement) et E-6 (repli du contrôle d'ajout). |
| Δ11 | FR-6 | OK | — |
| Δ12 | FR-7 | OK | Attribution D-412 à corriger (E-6). |
| Δ13 | FR-2 | OK | « L'utilisateur supprime d'abord les phases » est conforme à la spécification des phases §2.1. |
| Δ14 | FR-8, FR-9 | **Écart** | Contresens sur Avec → Sans → Avec (E-1) ; D-249 omis (E-5). |
| Δ15 | §8 | OK | — |
| Δ16 | FR-10 | OK | Les mentions « sans plafond » et « pas de valeur par côté » sont fondées sur la spécification de la charge (CH-05, §2). |
| Δ17 | FR-11 | OK | La remise de `pendingRemoval` à `null` est reportée dans l'addendum. |
| Δ18 | FR-12 | Mineur | Voir E-3 (Charge en Répétitions et À l'échec). |
| Δ19 | FR-13 | OK | — |
| Δ20 | FR-14 | OK | Les scénarios 1,3 → 1,5 ; 0,01 → 0,25 et [0;0;0] sont repris. |
| Δ21 | FR-15 | OK | « Sans masque et conserve » est cohérent avec D-410. |
| Δ22 | FR-16, Q-A4 | OK | — |
| Δ23 | FR-17 | OK | Conforme à QP5-07. |
| Δ24 | §6, FR-17 | OK | — |
| Δ25 | FR-19 | OK | Placement dans le cadre Exécution, À l'échec à gauche. |
| Δ26 | FR-20 | OK | Tableau AR-01 fidèle. Le renvoi à « D-384 » pour un tableau incomplet est une précision ajoutée : AR-01 dit seulement « convention des autres résultats calculés incomplets ». Acceptable, à vérifier. |
| Δ27 | FR-21 | OK | QP5-08 et la restauration des valeurs sont repris. |
| Δ28 | FR-22 | Mineur | PickerToolbar omis (E-5). |
| Δ29 | FR-23, FR-24 | OK | « Le clavier décimal se ferme sans touche Retour » : formulation ambiguë. Il faudrait dire « un moyen de fermer le pavé sans touche Retour est fourni ». |
| Δ30 | §6 NR, §8 | OK | — |
| Δ31 | FR-26 | Mineur | Briques conservées non listées (E-5). |
| Δ32 | FR-27 | OK | Conforme à QP5-06. |
| Δ33 | FR-28 | OK | Conforme à D-410 (centré, haut ou bas). |
| Δ34 | FR-29 | OK | Conforme à QP5-05 et à la réserve tactile. |
| Δ35 | FR-30 | OK | — |
| Δ36 | FR-31 | OK | — |
| Δ37 | FR-32 | OK | — |
| Δ38 | §6 NR | OK | — |
| Δ39 | FR-39, Q-A1 | OK | Le choix entre v2 et v3 est bien laissé à l'architecture, avec les points à traiter. |
| Δ40 | FR-3, FR-40, FR-45 | OK | « Saisie 5..3535 » est remplacée par Δ50 : non signalé. |
| Δ41 | FR-41 | OK | — |
| Δ42 | FR-42 | Mineur | La combinaison avec les phases n'est pas signalée (E-4). |
| Δ43 | FR-18 | OK | Conservé implicite (E-5). |
| Δ44 | FR-43 | OK | Conforme à QP5-09 corrigé (§4.1, exhaustivité, une seule phase, corpus étendu). |
| Δ45 | FR-18 | OK | — |
| Δ46 | FR-44 | OK | — |
| Δ47 | §6 NR | OK | — |
| Δ48 | §4.2 | **Écart** | Exigence de tests et de recette absente (E-3). |
| Δ49 | FR-25, NFR-6 | OK | Fidèle : extrémités sans boucle inventée, accessibilité, roues non transformées. |

## 3. Remplacements R-01–R-16

Les seize remplacements sont présents au §7 du PRD avec un FR cible correct.

- **R-04 et R-07 :** conformes à la décision QP5-07, désormais close.
- **R-06 :** la réserve tactile est reprise (FR-29, NFR-7).
- **R-13 :** QP5-01 est appliquée (FR-35).
- **R-17 :** ajouté par le PRD au titre de Δ50 ; il n'est pas compté comme écart.
  - « Au pas de 5 s » n'est pas écrit dans D-232, qui ne fixe que la borne 5..3535. La formule de Δ50 « sans palier de 5 s » justifie toutefois la mention.
  - La précision « bornes de répétitions et de séries inchangées » est cohérente avec D-232 (répétitions 1..100, N 1..99).
- **Conservés malgré les captures (table §2, fin) :** tous sont repris (§6 du PRD, FR-38, §6 NR).

Aucun écart sur R-01 à R-16.

## 4. Décisions QP5 et compléments

| Décision | PRD | Verdict |
|---|---|---|
| QP5-01 | FR-35, NFR-10, §8 | OK : tolérance limitée aux descriptions |
| QP5-02 | FR-33, FR-34 | OK |
| QP5-03 | FR-7 | OK (attribution, E-6) |
| QP5-04 : phase d'au moins 1 s au pas de 1 s, sans borne propre | FR-1, FR-7 | OK |
| QP5-04 : Avec reprend D, sinon Phase 1 à renseigner | FR-5 | **Écart** de mécanisme (E-2) |
| QP5-04 : ajout reprenant la dernière durée, au plus six | FR-5 | OK |
| QP5-04 : phases à 0 retirées sans message ; liste nulle → Aucune ; validation existante | FR-9 | OK |
| QP5-04 : suppression de la dernière phase → sa durée devient D | FR-8 | OK |
| QP5-04 : arbitrage final Avec → Sans | FR-8 | **Contresens** (E-1) |
| QP5-04 : abandon de (e) | FR-9 | OK |
| QP5-04 : durée imposée non développée | §8 | OK |
| QP5-05 | FR-29, NFR-7 | OK |
| QP5-06 | FR-27, addendum | OK : réutilisation par défaut, natif seulement après vérification |
| QP5-07 | FR-17 | OK : libellés, police réduite, absence de D/G et de C1S1, N > 1, frame non bloquante |
| QP5-08 | FR-21 | OK |
| QP5-09 | FR-43 | OK (combinaison avec la charge, E-4) |
| Δ48 (charge en Répétitions) | §4.2 | Règle OK ; cas de tests et de recette absents (E-3) |
| Δ49 (Précédent / Suivant) | FR-25, NFR-6 | OK |
| Précisions de cohérence (§6) | §6 NR, §9, FR-33, Q-A1, NFR-8 | OK ; distinction entre Enchainement et formats non explicite (E-5) |
| S-3 (corpus côté 1 / côté 2) | FR-18 | OK |

## 5. Inventions et questions tranchées sans décision

- **Aucune règle métier inventée** n'a été relevée, en dehors des points E-1 (règle abandonnée réintroduite) et E-2 (blocage repris de la recommandation (c), reformulée par la décision).
- **Précisions sans source directe, à faible risque :**
  - FR-20, renvoi à D-384 ;
  - FR-45, « les durées imposées par un format suivent leurs propres contraintes ».
  - Les deux sont cohérentes avec les sources. À garder, ou à retirer si l'on veut un PRD strictement sourcé.
- **Question non tranchée, à signaler :** ordre des phases et de la charge dans la Phrase (E-4).
