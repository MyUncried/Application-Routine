# VNext — exclusions des données opérationnelles du filtre CI

## Autorité

Hermann demande explicitement le13/10 à02:22:21Paris : « peux-tu exclure ces répertoires du filtre ? ». Portée : le workflow kodjo-vnext-proof-stability.yml seulement. Aucun nouveau mécanisme de réutilisation de verdict, aucune suppression de contrôle, aucun autre workflow ni logique d’exécution modifié.

## Changement

Après le motif positif .github/orchestration/**, ajout des exclusions requests/vnext-agent/**, vnext-closure/**, v2-slices/**, vnext12/** et reports/**. Les artefacts Actions vnext-chatgpt-review-* ne sont pas des chemins Git et ne nécessitent aucun motif. Les filtres positifs des workflows, scripts, tests, consignes et configurations restantes sont conservés.

Ces dossiers sont des données opérationnelles ou des preuves ; cette CI de stabilité ne se déclenche plus uniquement pour leur publication. Leurs lecteurs/validateurs et workflows de revue/clôture continuent de les traiter. Aucun fichier n’est déplacé. Les jobs, permissions, workflow_dispatch, create et la concurrence sont identiques au parent.

## Vérification

- validate-workflows.js : PASS.
- validate-workflow-syntax.py :73workflows acceptés par le parseur YAML indépendant.
- vnext-campaign-sequence.pilot.js et vnext-cycle-continuation.pilot.js :18testsPASS,0échec.
- Évaluation des motifs du YAML réel via minimatch :12casPASS. Rapport, demande revue, demande clôture, objet tranche et preuve historique seuls :false. Script, test, workflow, contrat VNext et configuration cutover :true. Rapport+script :true. Code applicatif seul :false pour ce workflow.
- Comparaison des objets YAML : jobs, permissions et autres événements inchangés.
- git diff --check :PASS pour les deux fichiers du correctif.

Ces contrôles vérifient la syntaxe et la sélection des chemins ; ils ne prétendent pas être des événements GitHub réellement reçus. La vérification réelle du prochain événement restera observable dans Actions, sans nouvelle campagne de certification.

## Limite

Le filtre GitHub porte sur le diff complet de la PR. Si celle-ci comprend également une modification de protocole hors des exclusions, cette CI se déclenche toujours, y compris sur une publication ultérieure de rapport. Ce correctif n’invente pas un filtre par dernier commit et ne certifie pas un HEAD à partir du verdict d’un autre.

## Contexte produit

PRE-3/#340 est fusionné par #351 au commitdfc83e6c ; son registre final est publié dansf762a0df et #340 fermée après vérification. #352 conserve l’autorisation de préparation VNext de l’éditeur et cible À l’échec, sans approbation anticipée de plan ni développement.
