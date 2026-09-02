# T01-S09 — préparation technique V1.4 LOCAL

Date : 2026-09-02

Statut : **PRÊT TECHNIQUEMENT — BARrière documentaire/fonctionnelle maintenue avant reprise métier**.

Ce document fige uniquement les contrôles techniques indépendants de la rédaction des contrats d’écrans. Il n’autorise aucun appel Claude ni aucune écriture métier.

## 1. Branche et état métier de référence

Branche métier : `feat/creation-seance-catalogue`.

Baseline initiale de l’Issue #17 : `c3af9990c8a35013bbad372c2eca2ce16d66d138`.

Dernier HEAD auquel le plan T01-S09 a été approuvé et l’autorisation d’implémentation V1.3 a été construite : `34b3e53879d0ac20a3057da932df6b948d6030c9`.

Le fil de l’Issue #17 établit qu’entre `c3af999...` et `34b3e538...`, les changements étaient limités à l’orchestration V1.2→V1.3 et `CLAUDE.md`; aucun fichier métier T01-S09 n’avait été modifié.

HEAD actuel observé de `feat/creation-seance-catalogue` : `640f2c91d0a219e88ca010d8feb9e6c181fa4db1` (`docs: record T1-T9 closure evidence`).

Comparaison GitHub `34b3e538... → 640f2c91...` : la branche a avancé par des commits d’orchestration/tests/traçabilité V1.3 ; les comparaisons contrôlées ne montrent pas de reprise du code métier T01-S09. Le commit terminal `640f2c91...` ajoute la preuve de clôture T1→T9 et déclare explicitement que T01-S09 n’a pas été repris pendant ce test.

Conséquence : le dernier état métier stable reste celui analysé pour le plan T01-S09 approuvé ; le HEAD Git actuel a toutefois changé et **doit être revalidé comme nouveau `authorized_head` au moment de la reprise**, après intégration/contrôle des nouvelles sources documentaires.

## 2. Dernier état protocolaire T01-S09

Plan final : commentaire Issue #17 `5460956149`.

Plan approuvé : commentaire `5460962004`.

L’implémentation monolithique autorisée ensuite a échoué techniquement (`error_max_turns`). L’autorisation d’écriture a été explicitement invalidée.

Dernier checkpoint actif retrouvé dans l’Issue #17 :

- `state=ORCHESTRATION_FAILURE` ;
- `last_stable_state=PLAN_APPROVED` ;
- `implementation_authorized=false` ;
- `mode=CLOUD_READ_ONLY` ;
- `writer=NONE` ;
- ancien `head=34b3e53879d0ac20a3057da932df6b948d6030c9` ;
- reprise prévue historiquement en Phase A/B/C après nouvelle revalidation.

Les anciennes preuves `PLAN_APPROVED`, `SOURCE_ATTESTATION`, dry-run et autorisation Cloud sont **historiques seulement**. Aucune ne vaut autorisation V1.4 LOCAL.

## 3. Décomposition technique conservable

Après l’échec monolithique, la reprise avait été décomposée sans changement de périmètre produit :

- Phase A : fondations Catégorie + migration/seed/repository et tests ciblés ;
- Phase B : persistance/généralisation Séance + services Catégorie et tests ;
- Phase C : UI/navigation/enregistrement final + Catalogue + documentation + tests d’intégration/finalisation.

Cette décomposition reste techniquement pertinente comme borne de sécurité. Elle n’est pas une nouvelle décision fonctionnelle et devra être réévaluée uniquement si les nouveaux contrats d’écrans changent réellement les dépendances de la tranche.

## 4. Ancien workflow : non réutilisable tel quel

L’ancien workflow temporaire T01-S09 est V1.3 Cloud :

- `runs-on: ubuntu-latest` ;
- `anthropics/claude-code-action@v1` ;
- mode `CLOUD_WRITE` ;
- autorisation liée au HEAD historique `34b3e538...` ;
- logique de contexte conçue pour Claude Cloud et `/tmp/kodjo-context`.

Il ne doit pas être relancé ni simplement réarmé.

V1.4 doit utiliser un workflow local distinct ou une réécriture explicite de ce workflow avec :

- runner `[self-hosted, Windows, X64, kodjo-claude-local]` ;
- `powershell` ;
- `claude.cmd` ;
- authentification locale préflightée ;
- `CLAUDE_CONFIG_DIR` stable ;
- `CLAUDE_CODE_PROJECT_DIR_NAME` stable par bloc/tranche/session ;
- premier appel créant une session, appels suivants via `--resume <session_id>` ;
- aucun fallback Cloud ;
- garde-fous de chemins avant commit/push ;
- publication durable du checkpoint/session/resultat ;
- récupération de publication sans nouvel appel IA si le résultat local valide est récupérable.

## 5. Configuration locale déjà démontrée

La configuration runner/Claude Local et la continuité inter-runs sont figées dans :

- `.github/orchestration/KODJO_CLAUDE_LOCAL_SESSION_RESUME_03_EVIDENCE.md` ;
- `.github/orchestration/KODJO_ORCHESTRATION_V1_4_LOCAL.md` ;
- `.github/orchestration/KODJO_V1_4_LOCAL_WORKFLOW_ADAPTATION.md`.

Aucun nouveau micro-test de continuité n’est requis avant T01-S09 sauf changement substantiel de machine, compte Windows, `CLAUDE_CONFIG_DIR`, version/comportement Claude Code ou mécanisme de session.

## 6. Transport retour vers Work

La preuve historique V1.3 `pull_request:synchronize → Work` reste une preuve de transport distincte de Claude Cloud. Elle a été démontrée avec un commit technique isolé publié par `github-actions[bot]`, sans PAT utilisateur.

V1.4 peut conserver ce transport lorsqu’un réveil Work est nécessaire. Il ne doit pas utiliser un simple commentaire bot comme substitut, ce transport n’ayant pas été démontré dans la configuration historique.

## 7. Éléments désormais obsolètes / à ne pas réactiver

- mode `CLOUD_WRITE` pour T01-S09 ;
- `anthropics/claude-code-action@v1` comme exécuteur nominal ;
- ancienne autorisation d’implémentation `5461702840` ;
- ancien HEAD autorisé `34b3e538...` comme autorisation actuelle ;
- attente historique `USER_COST_APPROVAL_PHASE_A` liée au run Claude Cloud ;
- ancien déclencheur Phase A Cloud ;
- fallback Cloud ;
- reconstruction exhaustive du contexte comme mécanisme nominal de continuité Claude.

Ils restent des preuves historiques et ne doivent pas être effacés rétroactivement.

## 8. Barrière volontaire restante

Les contrats d’écrans ne sont pas encore rédigés. Le Design System Foundation a été mis à jour, mais la fraîcheur et la complétude des sources UX/fonctionnelles nécessaires à T01-S09 ne peuvent donc pas encore être déclarées `VERIFIED` pour une reprise métier.

Avant tout premier appel Claude T01-S09 V1.4 LOCAL, il restera uniquement à :

1. disposer des contrats d’écrans concernés ;
2. contrôler leur cohérence avec le Design System Foundation, Figma courant et les décisions applicables ;
3. contrôler le delta documentaire/fonctionnel depuis le plan `5460956149` et déterminer si ce plan reste applicable ou doit être révisé ;
4. revalider le HEAD Git réel de `feat/creation-seance-catalogue` et publier le nouvel `authorized_head` ;
5. publier une nouvelle autorisation explicite `LOCAL_WRITE` / writer `CLAUDE_LOCAL` bornée à la phase autorisée ;
6. seulement alors lancer Claude Local.

## 9. Verdict de préparation technique

- état Git/historique T01-S09 : **CONFORME pour préparation**, sous réserve de revalidation finale du HEAD au lancement ;
- dernier état stable : **PLAN_APPROVED identifié** ;
- ancienne autorisation d’écriture : **invalidée, conforme** ;
- ancien workflow Cloud : **NON CONFORME à V1.4, identifié comme obsolète** ;
- architecture/runner/auth/session locale : **DÉMONTRÉS dans la configuration testée** ;
- stratégie de migration workflow : **PRÊTE** ;
- transport GitHub → Work : **preuve historique disponible et réutilisable sous ses conditions démontrées** ;
- fraîcheur documentaire/UX finale : **EN ATTENTE des contrats d’écrans** ;
- reprise métier T01-S09 maintenant : **NON AUTORISÉE**.

Conclusion : **les contrôles et la préparation purement techniques sont terminés.** Après finalisation des contrats d’écrans, la reprise pourra commencer directement par la barrière de fraîcheur documentaire + revalidation du HEAD + nouvelle autorisation V1.4 LOCAL, sans refaire l’audit technique historique.
