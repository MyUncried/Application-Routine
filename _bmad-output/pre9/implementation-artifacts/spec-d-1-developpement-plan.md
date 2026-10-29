# D.1 — Développement du plan sur toute la structure (plans finis)

Story PRE-9, epic D. Autorisation : mission de Hermann « KODJO — PRE-9 : lancement du développement BMAD » (29/10/2026). Plan : `../planning-artifacts/epics.md` § D.1 ; architecture : `../planning-artifacts/architecture-pre9.md` §6 (« Plan développé »). Dépend de : A.1, C.1 (`done`). Arbitrages : ARB-02a/b, ARB-10b, ARB-25 (validés).

## Objectif

Une fonction pure qui développe le plan fini d'une Séance sur toute sa structure D-451 (Exercices, Circuits, Cycles), sans moteur d'exécution (PRE-10). Aucun changement visible.

## Critères d'acceptation et preuves

| Critère (epics.md § D.1) | Livré | Preuve (`src/domain/sessions/__tests__/planExpansion.d1.test.ts`) |
|---|---|---|
| Ordre de la structure ; RM-252 (Exercices directs de Cycle) ; exemple E0, cycle × 2 [E1, circuit × 3 [A, B]], E2 | `expandStructure` (`src/domain/sessions/planExpansion.ts`) | « exemple RM-252 » : E0 et E2 une fois, E1 deux fois, six passages du Circuit |
| Séries groupées / alternées | Groupées : chaque Exercice joue toutes ses séries à chaque tour ; alternées : série i au tour i | « 18 / 6 occurrences » (COMP §9) |
| Côtés | Ordre du registre de l'Exercice (`buildExecutionLedger` : un côté après l'autre ou alternance par série) ; une étape par série et par côté | « côtés » |
| Séries nulles sautées ; occurrence sautée sans sa récupération, pauses indépendantes conservées (ARB-10b) | Cible numérique 0 : série sautée ; aucune série exécutée : ni étape ni récupération, l'occurrence ne sépare pas deux Points | « A = [10, 0, 14] » (COMP §9), « occurrence entièrement sautée » |
| Points dédoublonnés ; Point interne à un Cycle à chaque répétition (ARB-02a) | Points à leur emplacement à chaque passage de leur conteneur ; jamais deux Points successifs, ni en tête ni en fin (RM-219, RM-251, D-441, D-442) | « Point interne à un Cycle » (dont début et fin de répétition : un seul arrêt entre deux répétitions) |
| Identité stable d'occurrence ; contexte de Cycle (RM-083) ; élément formaté de rattachement | `stepId` dérivé du chemin et des indices (répétition, tour, série, côté) ; `context` = Cycle i/n, Circuit t/N, élément formaté | « exemple RM-252 », « Tabata » |
| Seuls les plans finis ; AMRAP et Death by en segment progressif, répété avec leur Cycle | `PROGRESSIVE_SEGMENT` `{ élément, Format, réglages }`, aucune occurrence générée | « élément AMRAP ou Death by » |
| Cycle × k reproduit k fois, sans autre facteur ; Tabata A, B dans un Cycle × 2 : 16 séries par Exercice, 960 s, même volume dans les deux organisations (ARB-25, ch11 l.314) | | « Tabata A, B dans un Cycle × 2 » |
| Compte à rebours et Fin aux seules frontières | Étapes `COUNTDOWN` / `FINAL_PHASE` en tête et en fin, une fois, lorsqu'elles sont fournies | « exemple RM-252 » |

## Choix techniques (classe D)

- **Granularité** : une étape par série et par côté exécutés ; les pauses de série et le changement de côté restent dans le registre de l'Exercice (`buildExecutionLedger`), qui en est la source unique. La récupération positive de l'occurrence est une étape, après sa dernière série jouée, à chaque passage.
- **Segment progressif** : il sépare deux Points comme un Exercice (il exécute des Exercices).
- **`expandComposition` conservé** (ancien modèle à Circuit unique) : ses appelants (durées, comptes, contrôle des Points) restent inchangés ; leur passage au plan général relève de B.6 (Points sur toute la structure) et B.7 (durées sur le plan développé). Mécanisme de compatibilité non retiré prématurément.
- Ancienne Récupération autonome ou Mode inconnu : jouée en entier, une étape (`series: null`), lecture défensive identique à celle de la durée.

## Synchronisation code / documentation

- **Classe A** : RM-252, COMP §1-§3 (natures, cibles nulles), RM-219 / RM-251 / D-441 / D-442 appliqués au plan, ARB-02a et ARB-25 (déjà au registre, DOC.0).
- **Classe B (ARB-10b)** : ch10 l.2616 annotée (réserve sur la récupération levée, réserve « tours entièrement nuls » maintenue) ; COMP §3 (`docs/KODJO-Composition-conteneurs-2026-10-28.md`) annoté. Texte d'origine conservé.
- **Classe D** : module `planExpansion.ts`, granularité (ci-dessus).

## Limites

- La réserve sur les **tours entièrement nuls** reste ouverte (ch10 l.2616) : le plan les développe par la règle existante (séries nulles sautées, Points dédoublonnés), sans règle nouvelle.
- La sémantique temporelle des Formats finis (fenêtre EMOM, chronomètre) relève du descripteur (D.3) ; le plan ne porte que leur structure.
- Aucun consommateur de production en PRE-9 (instantané D.2, moteur PRE-10).

## Tests

- `planExpansion.d1.test.ts` : 9 tests verts. `tsc --noEmit` et ESLint sans erreur. Régression : suite complète à la livraison groupée (voir `sprint-status.yaml`).
