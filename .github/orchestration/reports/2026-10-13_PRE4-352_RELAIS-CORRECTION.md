# PRE4-352 — Branche de préparation et reprise avant invocation

## Autorisation, base et limites
Hermann, 13 octobre 2026 : « ok, modifie le protocole et débloque ». Base protocole main : 7d832c4c0dbe01b7bc07b63fcc34dc7de29de3fb. Plan PRE-4 conservé à 0ef1ec593343809a41b243850df12e1e91337d49 ; demande unique dece7bcf9174c22f7eda2abf07c725566cc77217b55cb2e279e0ed6f7c1a706d, chaîne540b058a1f20df22eaa500673473c45751cc1a44517e61a2eb72d5d310d31b03. Ni préparation, ni certification globale, ni développement produit relancé.

## Cause, historique et attribution
L'ancienne entrée exigeait source_head ancêtre du commit de demande sur main. Une branche de plan non fusionnée est pourtant le contexte légitime de revue avant approbation. La création de demande validait les contrats mais ne vérifiait pas cette contrainte d'exécution.

Introduction démontrée de la contrainte dans l'entrée de compatibilité : 88a833684725d6a0d732143786f4fb0545b583da. Recopie dans l'entrée commune : 50415ae346647f59eb0db8230b16a6ccefbfaa8f. Partage de la protection des tentatives antérieures avec la compatibilité : ed9fc5104992f97bdd236f0b56be36055f9b101f. Première détection réelle conservée : run38393888751, tentative1, job115284132944, échec à12:02:22Z avant invocation. Aucun succès antérieur comparable disponible ; les tests simulés ne prouvaient pas le parcours branche distincte → demande main.

Erreur du pilote : publication après create réussi sans vérifier la condition supplémentaire d'ascendance. Les sources et le périmètre du plan ne sont pas en cause. Aucun incident n'est attribué à l'optimisation de volume.

## Correction
- Le source_head doit être un vrai commit contenu dans une branche distante origin du dépôt checkout par le workflow de confiance. Il ne doit plus être fusionné sur main. Demande scellée, hashes, dépôt/Issue, checkout propre et HEAD exact restent vérifiés. La revue se déroule sur le source_head exact.
- L'entrée de compatibilité utilise la même règle, sans nouveau parcours V2.
- La récupération historique ne se fonde pas sur une déclaration locale : elle vérifie run terminé en échec, tentative1, acteur, HEAD, workflow, blob exact de l'ancienne entrée et du workflow, divergence d'ascendance, quatre étapes préalables réussies, étape d'exécution échouée et ligne fatale authentifiée des journaux GitHub. Cette combinaison établit l'arrêt au premier guard Git avant toute création d'intent/appel Claude. Toute autre tentative reste ambiguë et bloquée.
- Un contrôle de reprise scellé sous requests/vnext-agent/resume/ référence la demande d'origine et le run terminé. Il n'est pas une seconde demande de revue. Le workflow existant le résout depuis le main courant puis checkout le commit immuable d'origine. Les empreintes ne changent pas et aucun reçu n'est fabriqué. La preuve de récupération est archivée avec le nouvel artefact.
- Le connecteur du pilote n'expose pas workflow_dispatch ; ce contrôle Git fournit le déclenchement automatique via le même workflow et ses permissions de lecture, acteur, runner et verrou existants. Le répertoire est déjà inclus dans l'exclusion opérationnelle vnext-agent/** ; aucune correction supplémentaire du filtre CI.

## Vérifications exécutées avant publication
24/24 tests ciblés PASS, zéro échec : vnext-agent-relay.pilot.js et vnext-chatgpt-plan-review.pilot.js. Les nouveaux cas utilisent de vrais objets et branches Git, l'entrée de production executeRequest, les vrais validateurs de contrat, un processus reviewer simulé explicitement TEST, puis vérification du reçu ; un seul appel de l'adaptateur malgré reprise.

Couverture : branche publiée distincte admise sans fusion/approbation ; commit uniquement local refusé ; demande et plan exacts conservés ; reprise scellée et run authentifié ; mauvais run/empreinte refusés ; erreurs post-invocation/quota et cache perdu toujours refusés ; preuves modifiées refusées ; récupération d'une réponse sans second appel ; compatibilité et workflow existants préservés.

Vérification supplémentaire sur preuves réelles : jobs/metadonnées API de run38393888751 et journal authentifié du job115284132944, objets Git originaux. failedAncestryBeforeInvocation retourne VERIFIED_PRE_INVOCATION pour cette demande ; aucun processus Claude lancé lors de cette vérification. Syntaxe des deux entrées PASS ; git diff --check PASS ; tous YAML workflows parsés. Seconde lecture du diff : aucun fichier applicatif ni contrat PRE-4 modifié, aucune exemption d'appel inconnu, aucun nouveau droit d'écriture au reviewer.

## Livraison et suivi
Fichiers : scripts/kodjo/agent-relay.js, scripts/kodjo/chatgpt-plan-review.js, workflow kodjo-vnext-chatgpt-plan-review.yml, leurs deux suites ciblées, documentation du relais et ce rapport. Commit final = commit contenant ce rapport ; base7d832c4c. État local avant livraison : seuls ces sept fichiers modifiés dans un worktree séparé du plan.

La reprise réelle de #352 doit être déclenchée après intégration du correctif, suivie et son artefact téléchargé/vérifié. Les tests ciblés ne constituent pas une nouvelle certification, ni une preuve de revue Claude réelle, ni une approbation du plan. L'archivage général des erreurs précédant execute reste distinct et hors correctif. Aucun contrôle sur iPhone n'est demandé. Aucun développement sans approbation propriétaire du plan convergé.

## Complément de cohérence révélé par la CI
Le run de CI38398126952 (jobWindows115298468999) échoue avant les tests sur VNEXT_REMOTE_WRITE_DECLARED_PRODUCER_DRIFT : workflow kodjo-vnext-proof-stability.yml, blob réel603eff72bc7b6c88784e7ca8a318d1a2d70fb79f, déclaration ancienne04cc0da9912040423a9b45cdf7cee871c1730220. Attribution démontrée : main96a191a9 a modifié le filtre de chemins sans actualiser cette empreinte. Ce décalage précède le correctif du relais ; aucun lien avec la source PRE-4. Correction bornée : actualiser seulement producer_blob_oid de ce seul workflow dans KODJO_VNEXT_REMOTE_WRITE_POLICY.json. Aucun changement de permission, de capacité, d'autorisation ou de règle de sécurité. La suite ciblée vnext-remote-write-security.pilot.js est rejouée. Le premier échec CI est conservé. Ce fichier de politique s'ajoute aux sept fichiers du correctif.
