---
title: 'R-10 — Recette JA3 : nom repris à l''ajout d''un niveau, dialogue C03 au crayon'
type: 'bugfix'
created: '2026-10-26'
status: 'done'
baseline_commit: 'e4737eaba103b34e0635fa396fd48e65cea60200'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/pre7/planning-artifacts/arbitrage-2026-10-26-recette-ja2-d448.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Recette JA3 du 26/10/2026 (cahier « Recette JA3 PRE-7 », remarques de Hermann) :
- **r8-5** : « Du catalogue d'exercice, j'ouvre un exercice, j'appuie sur niveau > ajouter un niveau > plus difficile. Le nom n'est pas repris, ni l'invite grise. Par contre la variante est bien créée avec catégorie et zones corporelles repris. » R-6 avait retenu une « option conservatrice : nom vide, sans invite » (`ExerciseScreen.tsx:578-585`).
- **r9-5** : retoucher le crayon après une modification affiche « Abandonner les modifications ? ». Hermann : « Le message devrait être "Vous avez modifié ce mouvement" avec "X autres exercices utilisent ce mouvement, cette modification s'appliquera à tous." avec les boutons "Annuler" en gris et "Confirmer" en bleu Kodjo. »

**Approach:**
- « Ajouter un niveau » au Catalogue reprend le nom de l'origine, avec l'invite grise « (compléter le nom) », comme la variante créée depuis le panneau (R-5, C02).
- Retoucher le crayon actif après une modification du contenu du mouvement ou de la structure des phases applique la décision de sauvegarde C03, la même que Terminer (`decideMovementSave`), au lieu de la confirmation d'abandon. Les dialogues et leurs boutons sont inchangés.

## Boundaries & Constraints

**Always:**
- **r8-5** : au chargement de « Ajouter un niveau », le nom vaut celui de l'Exercice d'origine et l'invite grise « (compléter le nom) » est affichée (`nameHintVisible`, mécanisme de R-5/R-8). L'invite disparaît dès que le nom change réellement.
  - La règle d'unicité C01 s'applique comme pour la variante du panneau : le nom identique est signalé et Terminer reste indisponible tant qu'il n'est pas complété.
  - Description et médias vierges ; Catégorie, Zones, paramètres et placement avant ou après l'origine : inchangés.
- **r9-5** : crayon actif, retouché.
  - **Aucun changement** de contenu ni de structure des phases (comparaison de R-9) : reverrouillage immédiat, comme aujourd'hui.
  - **Changements** : même décision que `finishUnlocked`, sans quitter l'éditeur :
    - nom modifié → dialogue à deux choix (C03) ;
    - mouvement partagé → « Vous avez modifié ce mouvement » avec le nombre d'autres exercices, Annuler / Confirmer ;
    - mouvement non partagé (décision `SILENT` ou `NONE`) → aucun dialogue.
  - **Après Confirmer, ou sans dialogue** : la correction est inscrite dans le brouillon, comme `commitMovementUpdate` (« Mettre à jour ») ou le remplacement de « Créer un nouveau mouvement ». Le contenu est ensuite reverrouillé, l'éditeur reste ouvert et le crayon redevient inactif. Toutes les occurrences du mouvement dans la Séance montrent la correction.
  - **Annuler** (ou le retour système sur le dialogue) : l'édition reste ouverte, rien n'est inscrit.
  - **Terminer** garde son comportement actuel.
- La confirmation d'abandon de R-9 n'est plus déclenchée par le crayon. Elle reste celle de la sortie d'écran.
- Échec de lecture du nombre d'utilisations : l'édition reste ouverte, comme dans `finishUnlocked`.
- Documentation : chapitre 07 (D-448 point 10) et chapitre 13 (note du crayon, CE-T03-04 §15) annotés « [précisé par la recette JA3 du 26/10/2026 : … dialogue de sauvegarde C03 …] », source `spec-r-10`.

**Never:** modifier les textes ou couleurs des dialogues C03 ; changer le crayon du Catalogue ou de la reprise ; écrire en base avant l'enregistrement de la Séance.

</frozen-after-approval>

## Code Map

- `src/features/sessions/ExerciseScreen.tsx`:
  - `:578-610`, création d'un niveau au Catalogue (`levelOriginDefinitionId`) : `name: ""` est à remplacer par le nom de l'origine, avec `setNameHintVisible(true)`. `:739-742` montre le même schéma pour la variante du panneau.
  - `:1831` `toggleMovementEdit`, `:1850` `abandonMovementEdit` : remplacer la confirmation d'abandon par la décision C03.
  - `:1870` `finishUnlocked` : décision et lecture du nombre d'utilisations, à factoriser pour un mode « rester dans l'éditeur ».
  - `commitMovementUpdate` (juste après) et le remplacement par un nouveau mouvement : ils appellent aujourd'hui `commitFinished`, qui ferme l'éditeur. Le mode crayon doit mettre à jour le brouillon, puis `local` et l'instantané, et reverrouiller (`setUnlockedMovement(null)`) sans fermer.
  - `:2120` dialogues `pendingOccurrenceSave` (CHOICE / CONFIRM) : à réutiliser tels quels, en distinguant leur origine (Terminer ou crayon).
- Tests :
  - `src/features/sessions/__tests__/ExerciseScreen.r9.integration.test.tsx` : les cas d'abandon par le crayon sont à réécrire selon r9-5 ;
  - `ExerciseScreen.r4.integration.test.tsx` : cas C03 et C04 de Terminer, inchangés ;
  - tests d'« Ajouter un niveau » : `ExerciseScreen.r6.integration.test.tsx` et `ExerciseScreen.mfn.a31.integration.test.tsx`.

## Tasks & Acceptance

**Execution:**
- [x] `src/features/sessions/ExerciseScreen.tsx` -- nom d'origine et invite à l'ajout d'un niveau -- r8-5.
- [x] `src/features/sessions/ExerciseScreen.tsx` -- crayon retouché : décision C03, inscription sans fermer, reverrouillage ; Annuler garde l'édition -- r9-5.
- [x] Tests (`.r10`) :
  - ajout d'un niveau : nom repris, invite, conflit C01 signalé, invite masquée après saisie ;
  - crayon : partagé (dialogue avec nombre, Confirmer : correction visible sur l'autre occurrence, éditeur ouvert, verrouillé) ;
  - crayon : Annuler (édition ouverte) ;
  - crayon : nom modifié (deux choix ; « Créer un nouveau mouvement » remplace l'occurrence, éditeur ouvert) ;
  - crayon : non partagé (sans dialogue, reverrouillé, correction gardée).
  Réécrire les cas R-9 d'abandon.
- [x] Documentation : chapitres 07 et 13, et README de `src/features/sessions`.

**Acceptance Criteria:**
- Given un Exercice du Catalogue « Squats », when on choisit Niveau > Ajouter un niveau > Plus difficile, then le nom « Squats » s'affiche avec l'invite grise et Terminer reste indisponible tant que le nom n'est pas complété.
- Given une occurrence en Séance d'un mouvement utilisé par un autre exercice, when on touche le crayon, modifie la description et retouche le crayon, then « Vous avez modifié ce mouvement » s'affiche avec le nombre d'autres exercices ; Confirmer reverrouille et laisse l'éditeur ouvert avec la description corrigée.
- Given les trois contrôles, when ils s'exécutent, then ils passent.

## Implementation Notes

## Spec Change Log

## Review Triage Log

Revue du 26/10/2026 : trois couches (Blind Hunter, Edge Case Hunter, Verification Gap) sur le diff depuis `e4737eab`.

| # | Source | Constat | Verdict | Preuve | Route |
|---|---|---|---|---|---|
| 1 | ECH, BH | Après « Créer un nouveau mouvement » au crayon, une nouvelle correction au crayon inscrit le mouvement `NEW` comme `EDITED` : l'enregistrement de la Séance échoue (`MovementNotFoundError`) | high | `movementUpdatePlan` écrit `draftMovementOf(…, "EDITED")` sans regarder l'entrée existante ; l'éditeur reste verrouillé derrière le crayon (`openedOccurrence` inchangé), ce qui rend la séquence atteignable | patch |
| 2 | ECH | Second « Créer un nouveau mouvement » sur un mouvement `NEW` du brouillon : l'ancien `NEW` reste orphelin et est inséré à l'enregistrement | medium | `newMovementPlan` ne retire pas l'entrée `NEW` devenue sans occurrence | patch |
| 3 | ECH, BH | `relockUnlocked` travaille sur l'occurrence capturée avant l'`await` : une saisie pendant la lecture est écrasée, ou mêlée à l'état courant | medium | Le contenu reste modifiable pendant `countMovementUsage` | patch |
| 4 | ECH | Démontage ou sortie confirmée pendant la lecture : inscription après l'abandon | low | Garde de montage, correction directe | patch |
| 5 | BH | L'occurrence remise dans l'éditeur n'est pas relue du brouillon écrit | low | `newMovementPlan` et `movementUpdatePlan` reconstruisent l'occurrence à la main ; la relire par identifiant dans `exercises` | patch |
| 6 | BH | Chapitre 13 : « Le crayon ne persiste rien » n'est pas annoté ; le comportement R-9 est remplacé mais présenté comme « précisé » ; la remarque de Hermann n'est pas citée | low | Règle d'analyse : remplacement explicite. Source : remarque r9-5 de Hermann au cahier JA3, à citer verbatim | patch (doc) |
| 7 | BH | r8-5 non propagé à D-448 ni au contrat de « Ajouter un niveau » | low | Seul le README le porte ; source : remarque r8-5 de Hermann au cahier JA3 | patch (doc) |
| 8 | VG, BH | Tests manquants : garde de sortie non bloquante après une inscription au crayon ; échec de lecture au crayon ; second cycle (déverrouiller de nouveau après une inscription, y compris après un mouvement `NEW`) ; nom pris dans le dialogue à deux choix ouvert au crayon ; insertion avant l'origine pour « Plus facile » | low | Gaps filés | patch (tests) |
| 9 | BH | Libellés périmés : en-tête du test r9 (JA2), commentaire `UnlockedMovement.before`, entrée A3.1 du README contradictoire | low | Lignes citées | patch |
| 10 | BH | Spec muette sur le cas `NONE` et sur le message en cas d'échec de lecture | false | La spec prévoit l'échec de lecture (« l'édition reste ouverte ») ; `NONE` n'a aucun effet visible (reverrouillage sans inscription) | reject |
| 11 | BH | Retour système sur le dialogue et réserve de Circuit non testés au crayon | low | Comportement repris de Terminer ; Circuit de Séries abandonné (recette nv-8) | reject |

## Verification

**Commands:**
- `npx tsc --noEmit` -- expected: aucune erreur
- `npm run lint` -- expected: aucune erreur
- `npx jest --maxWorkers=2` -- expected: toutes les suites vertes
