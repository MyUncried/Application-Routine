# KODJO V2 — Acceptation E2E bornée du parcours PLAN → IMPLEMENT

Date : 2026-09-18
Branche de conception/test : `protocol/v2-initial-handoff-redesign-20260917`

## 1. E2E-INITIAL-PLAN

### Objectif
Valider uniquement la frontière nouvelle tranche → premier `PLAN_OUTPUT` INITIAL, sans review ni implémentation.

### Exécution réelle
- tranche : `V2-CAT-01`
- baseline : `63a3c26ed492f7c0925cfb57419f3dc2dcc5e476`
- trigger : commentaire `5725720153`
- workflow réel : `.github/workflows/kodjo-v2-slice-initial-plan.yml`
- run : `35311869021`
- résultat : `SUCCESS`
- PLAN_OUTPUT produit : commentaire `5725735363`

### Oracles
- `slice_id=V2-CAT-01`
- `source_head=63a3c26ed492f7c0925cfb57419f3dc2dcc5e476`
- `planning_mode=INITIAL`
- `planning_contract=kodjo.plan-impact.v1`
- `STATUT : PLAN_READY_FOR_INDEPENDENT_REVIEW`
- arrêt au PLAN_OUTPUT ; aucune review ou implémentation n’est incluse dans le test.

### Statut
**PASS**

Run :
https://github.com/MyUncried/Application-Routine/actions/runs/35311869021

---

## 2. E2E-PLAN-HANDOFF

### Objectif
Valider le handoff cible commun INITIAL / REVIEW-RÉVISION sans requalifier le moteur V2 stable :

plan approuvé + review APPROVE + gate utilisateur
→ matérialisation Git canonique
→ `lean-request.0.6.13`
→ contrat + autorisations admis
→ STOP avant `run-queued-request.ps1`.

### Entrées réelles
- PLAN_OUTPUT : commentaire `5720329801`
- PLAN_REVIEW_OUTPUT : commentaire `5720519466`
- USER_IMPLEMENTATION_APPROVED : commentaire `5720551793`
- scope approuvé : 70 chemins

### Harnais borné
- workflow : `.github/workflows/kodjo-v2-bounded-plan-handoff-e2e.yml`
- test : `tests/kodjo/v2-plan-handoff-bounded-e2e.js`
- environnement : clone Git jetable
- aucune invocation Claude
- aucune publication applicative
- aucune exécution de `run-queued-request.ps1`

Le test :
1. relit les trois preuves réelles ;
2. ajoute `planning_application_head` dans le clone jetable ;
3. matérialise `technical-plan.md` ;
4. matérialise `independent-review.md` sous enveloppe canonique compatible avec le socle stable ;
5. génère `implementation-mission.md` ;
6. crée un commit de matérialisation et impose `source_head == approved_at_commit` ;
7. dérive `scope_allow` du plan ;
8. produit une `lean-request.0.6.13` ;
9. exécute le vrai `validateQueueRequest` ;
10. exécute le vrai `verify-authorizations.js` avec un client GitHub injecté uniquement pour la réaction utilisateur déjà hors périmètre de requalification ;
11. vérifie la convergence INITIAL / REVIEW hors `request_id` et `created_at` ;
12. s’arrête avant le superviseur.

### Exécution finale
- run : `35312468847`
- résultat : `SUCCESS`

Preuves log :
- `[E2E-PLAN-HANDOFF] PASS`
- `scope_count=70`
- `convergence=INITIAL==REVIEW_EXCEPT_REQUEST_ID_CREATED_AT`
- `STOP=BEFORE_RUN_QUEUED_REQUEST`

### Statut
**PASS**

Run :
https://github.com/MyUncried/Application-Routine/actions/runs/35312468847

---

## 3. Écarts trouvés par les tests et corrigés dans l’architecture

Les tests ont détecté deux défauts de conception avant implémentation :

1. `implementation-mission.md` ne peut pas contenir `approved_at_commit` si ce fichier participe lui-même au commit. La référence a été supprimée de la mission ; `approved_at_commit` reste porté par le gate et la Lean Request.
2. Une copie brute de `PLAN_REVIEW_OUTPUT` n’est pas compatible avec le contrat stable, qui attend `Verdict: APPROVED` et le nom du plan. La matérialisation de `independent-review.md` utilise désormais une enveloppe déterministe qui ajoute ces marqueurs tout en conservant le commentaire source intégral.

Ces corrections sont intégrées dans :
`.github/orchestration/reports/2026-09-17_V2_INITIAL_REVIEW_HANDOFF_ARCHITECTURE.md`.

## 4. Contrôle du périmètre

Diff final de la branche contre `main` au moment de cette acceptation :
- 3 documents de conception/audit ajoutés ;
- 1 workflow de test borné ajouté ;
- 1 script de test borné ajouté.

Aucun composant stable du moteur V2 n’a été modifié :
- `verify-queue-admission.js` : inchangé ;
- `verify-authorizations.js` : inchangé ;
- `run-queued-request.ps1` : inchangé ;
- `start-kodjo-v2.ps1` : inchangé ;
- `run-local-claude.js` : inchangé ;
- Lean Queue : inchangé.

## 5. Conclusion

Les deux frontières nouvelles sont maintenant couvertes par une preuve bornée :

- `E2E-INITIAL-PLAN` : **PASS réel** ;
- `E2E-PLAN-HANDOFF` : **PASS en clone jetable contre les vrais contrats stables**.

Cette acceptation valide la faisabilité et la cohérence de l’architecture cible. Elle ne vaut pas encore qualification de son implémentation de production : après implémentation du handoff commun, le même oracle `E2E-PLAN-HANDOFF` devra être appliqué au code de production du handoff, sans élargir le test au moteur V2 déjà stabilisé.
