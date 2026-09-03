# T01-S09 — préparation technique V1.4 LOCAL

Date : 2026-09-03

Statut : **PRÊT TECHNIQUEMENT — REPRISE T01-S09 VOLONTAIREMENT DIFFÉRÉE**.

Ce document fige les contrôles techniques déjà réalisés. Il n’autorise aucun appel Claude ni aucune écriture T01-S09.

## 1. Branche et état métier de référence

Branche métier : `feat/creation-seance-catalogue`.

Baseline initiale de l’Issue #17 : `c3af9990c8a35013bbad372c2eca2ce16d66d138`.

Dernier HEAD auquel le plan T01-S09 a été approuvé et l’autorisation d’implémentation V1.3 a été construite : `34b3e53879d0ac20a3057da932df6b948d6030c9`.

HEAD observé lors de la préparation : `640f2c91d0a219e88ca010d8feb9e6c181fa4db1`. Les contrôles réalisés n’ont pas montré de reprise du code métier T01-S09 après l’échec d’orchestration ; le commit terminal de clôture T1→T9 déclare explicitement que T01-S09 n’a pas été repris pendant ce test.

Le HEAD devra être revalidé au moment où T01-S09 sera effectivement repris.

## 2. Dernier état protocolaire T01-S09

Plan final historique : commentaire Issue #17 `5460956149`.

Plan approuvé historique : commentaire `5460962004`.

L’implémentation monolithique autorisée ensuite a échoué techniquement (`error_max_turns`). L’autorisation d’écriture a été explicitement invalidée.

Dernier checkpoint actif retrouvé : `state=ORCHESTRATION_FAILURE`, `last_stable_state=PLAN_APPROVED`, `implementation_authorized=false`, `writer=NONE`.

Les anciennes preuves et autorisations Cloud sont historiques seulement. Aucune ne vaut autorisation V1.4 LOCAL.

## 3. Décomposition technique conservable

La reprise avait été décomposée en :

- Phase A : fondations Catégorie + migration/seed/repository et tests ciblés ;
- Phase B : persistance/généralisation Séance + services Catégorie et tests ;
- Phase C : UI/navigation/enregistrement final + Catalogue + documentation + tests d’intégration/finalisation.

Cette décomposition reste une référence historique de sécurité. Elle devra être réévaluée au moment de T01-S09 au regard de l’état alors validé du produit et de la documentation.

## 4. Ancien workflow Cloud

L’ancien workflow temporaire T01-S09 V1.3 (`ubuntu-latest`, `anthropics/claude-code-action@v1`, `CLOUD_WRITE`, HEAD historique) ne doit pas être relancé ni réarmé.

Sous V1.4 option 3, **aucun workflow de lancement automatique de Claude local n’est requis**. Claude Code reste local et son réveil est manuel minimal.

Instruction canonique :

`Reprends le protocole KODJO depuis le dernier checkpoint GitHub.`

## 5. Infrastructure locale déjà démontrée

La configuration runner/Claude Local et la continuité inter-runs restent figées comme preuves techniques dans :

- `.github/orchestration/KODJO_CLAUDE_LOCAL_SESSION_RESUME_03_EVIDENCE.md` ;
- `.github/orchestration/KODJO_ORCHESTRATION_V1_4_LOCAL.md` ;
- `.github/orchestration/KODJO_V1_4_LOCAL_WORKFLOW_ADAPTATION.md`.

Le self-hosted runner n’est toutefois plus le moteur nominal de réveil Claude. Aucun nouveau micro-test de continuité n’est requis pour l’option 3.

## 6. Transport retour vers Work

La preuve historique V1.3 `pull_request:synchronize → Work` reste une preuve de transport indépendante de l’exécuteur Claude. Elle peut être réutilisée sous ses conditions démontrées pour automatiser la sollicitation de ChatGPT/Work.

Elle ne réveille pas Claude local sous l’option 3.

## 7. Éléments obsolètes / à ne pas réactiver

- mode `CLOUD_WRITE` ;
- `anthropics/claude-code-action@v1` comme exécuteur nominal ;
- ancienne autorisation d’implémentation `5461702840` ;
- ancien HEAD `34b3e538...` comme autorisation actuelle ;
- ancien déclencheur Phase A Cloud ;
- fallback Cloud ;
- lancement automatique de Claude local via self-hosted runner dans le chemin nominal option 3.

Ils restent des preuves historiques et ne sont pas effacés rétroactivement.

## 8. Nouvelle priorité produit

Les contrats d’écrans et la documentation ont été mis à jour.

La décision de séquencement est désormais : **ne pas commencer T01-S09 avant d’avoir corrigé et validé le produit existant jusqu’à S08**.

Conséquence : T01-S09 reste en attente volontaire même si sa préparation technique historique est disponible. Le prochain usage effectif de V1.4 doit porter sur la remise en conformité du produit S01→S08, pas sur T01-S09.

Au moment futur de reprendre T01-S09, il faudra recontrôler les sources fraîches, le delta depuis le plan historique et le HEAD réel ; aucune ancienne autorisation ne sera réactivée automatiquement.

## 9. Verdict

- préparation technique historique T01-S09 : **CONSERVÉE** ;
- ancien workflow Cloud : **OBSOLETE / NE PAS RÉACTIVER** ;
- Claude Code local : **EXÉCUTEUR RETENU** ;
- réveil Claude : **MANUEL MINIMAL — OPTION 3** ;
- transport GitHub → Work : **preuve historique disponible sous ses conditions démontrées** ;
- reprise T01-S09 maintenant : **NON AUTORISÉE PAR DÉCISION DE SÉQUENCEMENT** ;
- prochaine cible : **remise en conformité S01→S08**.
