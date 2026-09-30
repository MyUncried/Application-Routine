# PRE-1 — Correctif du transport CLI et reprise de la revue ciblée

Autorisation : « corrige et relance ». Départ main : 9fdc16b8b1e2c411c786f7625420555dca3ec298. Mission : corriger exclusivement le transport du prompt et reprendre la revue déjà autorisée, sur le même plan, la même baseline et les onze constats.

Échec source : run36750556401, job110007785640. Tous les gates de source, impact, contrat plan et contrat UI ont réussi. Le lancement Claude a échoué en quatre secondes avec unknown option '->', avant toute revue ; publication skipped, preuves artifact11115105360. Aucun verdict APPROVE/REVISE n’existe pour ce run.

Cause : le prompt complet, contenant texte libre et guillemets, était transmis comme argument natif à travers Windows PowerShell. Son contenu a été reparsé comme des options. La correction retire intégralement le prompt de argv.

Modifications :

- Nouveau scripts/kodjo/run-plan-review-cli.js : lit le fichier UTF-8, appelle l’exécutable Claude par Node spawnSync avec shell=false et input=prompt ; seuls les arguments CLI fixes et une éventuelle session validée passent dans argv. stdout/stderr sont enregistrés, le code de retour propagé, les erreurs de spawn/terminaison explicites. Aucun retry.
- Workflow initial-plan-review : archive le prompt UTF-8, résout explicitement claude.exe, copie le lanceur avant checkout produit et l’utilise pour transmettre le prompt. Aucun changement du prompt ciblé, des sources épinglées ou des gates.
- Test de régression : vraie exécution d’un processus Node de substitution, contrôle de réception exacte de plus de 350Ko incluant Unicode, CRLF/LF, guillemets, JSON, ->, faux arguments et métacaractères ; contrôle d’argv INITIAL et RESUME ; propagation exit7/stderr ; rejet d’une session invalide.

Résultats : test de transport PASS ; syntaxe Node PASS ; syntaxe YAML PASS. Aucun appel IA pendant les tests. Tests effectués dans l’environnement Linux de préparation : le nouvel appel réel Windows reste à constater dans le run de reprise ; ne pas déclarer cette exécution réussie par anticipation.

Fichiers : scripts/kodjo/run-plan-review-cli.js ; .github/workflows/kodjo-v2-slice-initial-plan-review.yml ; tests/kodjo/plan-review-stdin.pilot.js ; présent rapport. Aucun fichier applicatif, aucun changement Figma, aucun chantier VNext.

Reprise : nouvelle commande de lancement seulement après déploiement et vérification qu’aucune revue PRE-1 n’est active. Candidat inchangé : commentaire5916079168, commit990103188f2936bb2ed7d766fabe56ab0b779210, blob8ed0768ccfcf9ec157b2aa8d5cc177be5f97d426. Un seul appel de revue ; aucune relance automatique sur REVISE. Le hash de livraison et le run de reprise seront communiqués après leur lecture distante.
