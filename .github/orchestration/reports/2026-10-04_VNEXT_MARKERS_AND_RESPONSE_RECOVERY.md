# VNext — marqueurs, conservation et reprise des réponses

Périmètre : PR #269, étape 3, parent exact `4c3047368926f19af61a8260d4c56c9514ca9b2b`. PRE-2/V2 reste hors périmètre. Aucun FINAL, merge ou activation.

## Vérification et conception préalable

VNext produit son plan canonique depuis les contrats structurés ; il n'utilise pas le décodeur V2 de plan_markdown dans ce parcours. Le défaut démontré est en aval : extractTaggedJson voit aussi les délimiteurs cités dans la narration ou les chaînes JSON. Une citation peut donc provoquer un refus de projection. La correction reste dans les renderers VNext, sans modifier le lecteur partagé V2.

La représentation narrative encode `<` en `&lt;`. Les valeurs JSON encodent `<` en `\u003c`, échappement JSON standard dont le décodage restitue exactement la chaîne originale. Les blocs machine actifs restent émis exclusivement par le renderer. Les contrats et leurs hashes ne sont pas réécrits. Le lecteur partagé continue à refuser les blocs actifs supplémentaires.

## Changements

- `lib/plan-contract.js` : protège les textes/champs narratifs et le JSON canonique projeté.
- `lib/vnext-legacy-queue-adapter.js` : protège les chaînes de tous les blocs JSON aval, y compris exigences, tests et sources.
- `lib/vnext-live-chain.js` : conserve stdout/stderr complets séparément du diagnostic borné, avant validation. Le contrat réponse scellé lie le dossier produit, le reviewer packet, le hash stdout et l'état du processus. Un timeout reste un refus, même si une sortie JSON a été reçue.
- Le validateur de réponse est partagé entre invocation et récupération. Un JSON valide reste refusé si les règles de couverture/résolution ne sont pas remplies.
- Les deux drivers et le CLI utilisent la réponse déjà conservée plutôt qu'un nouvel appel. `recover-review` permet la revalidation explicite du même dossier. Le CLI exige un répertoire de preuves externe. Un appel direct de review refuse d'écraser une réponse existante.
- La revalidation est tracée séparément, avec `model_invoked=false`. Aucun nettoyage, ajout de finding, changement de verdict ni réparation sémantique n'est effectué.
- Une sauvegarde secondaire qui échoue ne remplace plus la cause initiale de validation ; les deux erreurs restent remontées, y compris dans le driver de révision.

## Tests et preuves

Régressions locales : 240 tests VNext/superviseurs PASS, 0 FAIL. Les tests ciblés finaux couvrent citations de balises appariées et ouvrantes seules, copie d'ancien bloc machine, PLAN_STATUS cité, égalité du JSON décodé, refus d'un bloc actif supplémentaire, JSON valide mais couverture refusée, réponse complète >128 KiB, reprise valide sans appel modèle, refus sur un dossier différent, JSON malformé, sortie reçue avant timeout et validation suivie d'une erreur de sauvegarde. Ce sont des tests de comportement des vrais renderers, lecteurs et validateurs ; les appels modèle y sont injectés, aucune revue réelle n'est revendiquée.

Invariants workflows PASS ; parseur YAML indépendant : 64 workflows acceptés. Aucun workflow ni dépendance ajouté/modifié. Les 420 sujets historiques et les preuves runtime acquises sont préservés. Les métadonnées de politique et correspondances historiques sont revérifiées avant publication.

Les trois runs du parent sont SUCCESS : [qualification 37189525174](https://github.com/MyUncried/Application-Routine/actions/runs/37189525174), [pilote 37189525201](https://github.com/MyUncried/Application-Routine/actions/runs/37189525201), [drivers 37189525262](https://github.com/MyUncried/Application-Routine/actions/runs/37189525262). Pilote Linux 980 PASS/0 FAIL/1 SKIP ; Windows 977 PASS/0 FAIL/4 SKIP. Contrats/drivers : 214 PASS sur chaque plateforme. Ils qualifient le parent, pas le nouveau candidat.

## Limites et suite

La conservation complète exige que le stockage accepte l'écriture. Si le stockage entier ou l'upload GitHub est indisponible, aucune garantie de durabilité n'est inventée ; le défaut est remonté, et une reprise de conservation reste nécessaire. L'upload réel en échec n'est pas injecté dans ces tests. La réponse est la sortie UTF-8 reçue par le launcher, pas une capture binaire du flux OS. Une réponse ambiguë ou issue d'un processus interrompu reste rejetée. Il n'existe pas de réparation automatique de contenu.

L'artefact historique V2 `kodjo-v2-recovery-34606534268-1` demeure introuvable et NON_CERTIFIED ; le SUCCESS global ne le certifie pas. La requête de ce candidat reste QUALIFY_ONLY. Une qualification réelle Linux/Windows du nouveau candidat précède la nouvelle préparation REVISION (vraie revue REVISE, une correction causale, vraie APPROVE), puis qualification du dossier/transport et EXECUTE_REVISION. Aucun ancien receipt n'est retargeté ; aucune requête INITIAL consommée n'est rejouée.
