# Séparation déterministe validation ciblée / requalification globale

Diagnostic : **DÉFAUT_CONFIRMÉ** sur main 8105f7a48aec8a749d7c7bcec6f49c4dac6e0de7. Correction séparée de KPB-001, car elle touche plusieurs parcours, les marqueurs, les checkpoints et la finalisation.

## Preuve du défaut

Le test historique `ui-e2e-finalization.pilot.js` affirmait explicitement qu'une VISUAL_CORRECTION restait finalisable avec une revue différentielle. Le vérificateur produisait READY_TO_CLOSE sans matrice globale et le workflow évitait le rejeu complet. VISUAL_APPROVED pouvait donc être interprété comme une approbation globale. Il n'existait pas de transition déterministe représentant simultanément succès ciblé et non-conformité globale ; ChatGPT devait éviter manuellement la clôture et relancer la planification.

## Parcours corrigé

L'événement humain `TARGETED_VISUAL_APPROVED_REQUALIFY` porte les champs exacts : slice_id, head, source_review_comment_id, validation_scope=DELTA, targeted_result=PASS, global_conformance=NON_CONFORME, requalification_scope=FULL_SLICE, targeted_requirement, source_head et bootstrap_path.

Le protocole rejoue les bindings de revue, implémentation, queue, checkpoint de livraison, PR et HEAD. Il vérifie les auteurs et l'Issue des commentaires. Il conserve un checkpoint `kodjo.targeted-validation.v1` avec la preuve ciblée, son empreinte et les références originales. Le statut global est REQUALIFICATION_REQUIRED ; global_approval, merge_authorized et close_authorized restent false. Aucune queue n'est créée ou modifiée.

Le workflow d'entrée publie ou retrouve exactement ce checkpoint, puis déclenche le parcours canonique de révision complète par workflow_dispatch. Un checkpoint déjà admis ne crée pas un deuxième run. L'entrée de planification relit et recalcule les preuves, refuse leur altération et transmet explicitement la portée FULL_SLICE au générateur. L'authentification, le bootstrap, les trois HEAD, les sources et les portes de revue existantes restent requis.

Une demande en langage naturel est traduite par le pilote en cet événement structuré (comme les autres intentions du protocole). L'exécution des transitions et l'interdiction de clôture sont désormais codées et testées ; elles ne reposent plus uniquement sur une règle conversationnelle. Le pilote ne doit pas remplacer une approbation ciblée par VISUAL_APPROVED.

## Finalisation et conservation

Une revue VISUAL_CORRECTION_DELTA avec VISUAL_APPROVED est refusée avec V2_FINAL_GLOBAL_REQUALIFICATION_REQUIRED. Une finalisation globale exige une revue CRITERION_COMPLETE. Si une requalification a été enregistrée pour cette PR/tranche, un nouveau plan et des approbations postérieures au checkpoint sont requis. Ce contrôle est rejoué avant les vérifications finales et avant publication, depuis un script protocolaire gelé. La synchronisation stable refuse également la voie delta et rejoue les requalifications enregistrées.

Les preuves ciblées demeurent dans le fil et sont transmises au cycle suivant ; elles ne sont ni effacées ni promues en conformité globale. Le plan issu de la requalification doit être revu puis soumis à l'utilisateur avant implémentation applicative.

## Périmètre et invariants

Seuls scripts, workflows, tests et rapports du protocole changent. Aucun changement applicatif, produit, plan approuvé, queue existante ou PR181. KPB-001 reste une PR distincte. Aucun nouveau plan V2-CAT-01 lancé avant qualification Linux et Windows et intégration des deux corrections.

Tests ciblés : succès ciblé/global non conforme, refus du marqueur ambigu historique, HEAD/revue/portée/duplications invalides, preuve conservée, record/replay idempotent avec API simulée, auteur incohérent, checkpoint altéré, queue inchangée, passage automatique au générateur, ancien plan ou anciennes approbations refusés. Les tests de finalisation globale existants restent positifs. Qualification complète GitHub Linux/Windows requise avant intégration ; non acquise à la rédaction de ce rapport.
