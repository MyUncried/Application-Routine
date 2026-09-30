# PRE-1 — Lancement de la revue ciblée du plan corrigé

Objectif : exécuter une seule revue indépendante du plan corrigé après le run 36734142447, sans audit global ni relance automatique. Autorisation utilisateur : « lance la revue ciblée de ce plan corrigé ».

Départ main : 0caceff167598ff5e048735170220bc2ad5f1640. Les modifications documentaires déjà intégrées par l’autre chantier sont conservées. Baseline applicative : e216294506bed87dd80855937e3fabfbfa322b82.

Candidat : commit 990103188f2936bb2ed7d766fabe56ab0b779210, chemin .github/orchestration/v2-slices/V2-PRE-1/correction-review-36734142447/corrected-plan.md, blob 8ed0768ccfcf9ec157b2aa8d5cc177be5f97d426, SHA-256 a5f78c7bd25fa2bf35d758e8cce6769fcfce392d1b523a67dcd512be805f5019, taille 226423 octets. Publication humaine sur issue249 : commentaire5916079168. Cette publication n’est pas un verdict indépendant.

Constat de reprise : aucune revue PRE-1 active dans les runs in_progress/queued vérifiés avant lancement. Une ancienne Lean Queue distincte était queued ; elle n’a pas été relancée ou modifiée.

Corrections nécessaires au lancement :

- recover-published-pre1-plan.js reconnaît séparément la nouvelle publication, vérifie auteur, dépôt, issue, URL, commit/arbre, blob, taille et empreinte, et produit le contrat local canonique à partir du fichier exact. Le chemin de récupération de l’ancien candidat reste intact.
- kodjo-v2-slice-initial-plan-review.yml applique au nouveau candidat le prompt ciblé des onze constats. Il charge les findings et le registre par leurs blobs épinglés, demande une table de fermeture et limite les nouveaux blocages aux conséquences directes ou régressions démontrées. Une REVISE arrête ce cycle, sans génération ou revue automatique supplémentaire.
- materialize-approved-plan-handoff.js accepte cette publication vérifiée, sans supprimer l’exigence d’un APPROVE provenant du bot de revue indépendant. Le handoff pourra poursuivre le processus existant si la revue approuve.

Contrôles : 12 cas autorité/intégrité du nouvel adaptateur PASS ; syntaxe Node des deux scripts PASS ; syntaxe YAML PASS. Le plan et son scan ont leurs preuves dans le rapport de correction précédent. Aucun test applicatif de développement ni vérification sur appareil n’est applicable à ce raccordement. L’exécution réelle des gates reste contrôlée par le run.

Fichiers modifiés : les trois fichiers ci-dessus et le présent rapport. Aucun fichier app/ ou src/ modifié. Aucun chantier VNext, aucune modification Figma, aucune réouverture de 250/252.

État de ce rapport au commit : raccordement préparé et vérifié, commande de lancement à publier après vérification du HEAD déployé. Le commentaire de lancement et le run GitHub constituent le reçu d’exécution ; ne pas déclarer APPROVE avant lecture du résultat réel. Le hash de livraison et le lien du run seront communiqués dans la réponse de lancement.
