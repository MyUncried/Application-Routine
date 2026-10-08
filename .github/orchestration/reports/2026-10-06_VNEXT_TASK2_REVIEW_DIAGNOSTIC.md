# Diagnostic de la revue réelle — tâche 2

Mission : VNEXT_TASK2_REVIEW_DIAGNOSTIC. Demande : « fais le diagnostic ». Branche `protocol/vnext-proof-stability-20260930`, PR #269 ; départ local `85b3d03756d9a1f2c52c1f7495d47983c6321ae0`, contrôleur exécuté `6ec750620a690b777884d255200ca43bd2a3ae43`. Diagnostic documentaire, sans correction applicative, appel Claude, relance, acquisition Figma ou rejeu de demande consommée.

## Conclusion

Le run 37386304781 échoue dans la première revue du plan INITIAL, après admission VERIFIED. La limite du processus de revue est atteinte : ETIMEDOUT, SIGTERM, 600 056 ms, stdout et stderr vides. Aucun reçu valide de revue, aucune implémentation et aucune correction. La qualification 37385093752 demeure réussie ; la tâche 2 réelle demeure inachevée.

La cause profonde du dépassement n'est pas démontrée. Le diagnostic identifie une revue déjà proche de sa limite dans le run précédent, une charge importante, une instruction inexécutable avec les outils disponibles et un manque de traces permettant de distinguer travail, attente réseau ou problème de démarrage. Ces constats concernent le dispositif de revue ; ils ne démontrent pas un défaut applicatif.

## Preuves confrontées

| Mesure | Run antérieur 37325776512 | Run actuel 37386304781 |
| --- | ---: | ---: |
| Entrée réellement transmise | 1 074 678 octets | 1 081 989 octets |
| Cibles à examiner | 430 | 435 |
| Durée processus | 588 534 ms | 600 056 ms |
| Fin | Code 0, réponse rejetée par validateur | ETIMEDOUT / SIGTERM |
| Sortie stdout | 45 150 octets | 0 octet |

L'ancien processus avait donc rendu sa réponse seulement 11 466 ms avant la limite, avec dix tours déclarés dans sa sortie. Le nouveau dossier augmente de 7 311 octets (0,68 %) et cinq cibles. Cela rend plausible un dépassement de durée d'une revue effectivement active ; cela ne prouve ni son activité pendant le nouveau run ni la cause du dépassement. L'ancienne réponse était invalide (`VNEXT_REVIEW_FINDING_DEPENDENCY_UNKNOWN: PLAN_CONTRACT`), et ne constitue pas une revue approuvée.

L'ancien résultat déclare 39 594 tokens de sortie dont 27 765 de réflexion, et 678 347 tokens de création de cache agrégés. Ces compteurs historiques ne mesurent pas le prompt initial ni la consommation du nouveau run. Aucune consommation ni aucun modèle effectivement utilisé n'est observable pour le run arrêté.

## Composition du dossier actuel

Reconstruction hors ligne via `compactReviewDossier(produced)` exporté du contrôleur, à partir du `produced.json` de l'archive scellée. Aucune invocation de modèle. Le dossier compact de base mesure 1 078 245 octets ; l'entrée enregistrée, avec instructions et chemins des ressources matérialisées, mesure 1 081 989 octets. Ces deux valeurs désignent des objets différents.

| Sous-objet du dossier compact | Octets JSON UTF-8 |
| --- | ---: |
| Contrat UI/Figma compacté | 599 615 |
| Sources de 28 consommateurs de contrats | 329 161 |
| Enveloppe de planification | 42 875 |
| Registre des exigences | 41 013 |
| Manifest des candidats compacté | 25 568 |
| Catalogue des cibles | 14 081 |

Les deux premiers sous-objets représentent environ 86 % de l'entrée enregistrée. Le catalogue conserve 223 SOURCE_UNIT, 184 CANDIDATE, 3 REQUIREMENT, 6 IMPACT, 3 PLAN_ITEM, 3 TEST, 5 PROOF, 3 CRITERION, 4 ASSERTION et 1 PLAN_CONTRACT : total 435. La charge vient principalement de la fermeture de contexte et des contrats, alors que la fixture porte trois exigences et quatre assertions. Aucun octet n'est converti ici arbitrairement en nombre de tokens, et aucune cible obligatoire ne peut être supprimée pour obtenir une approbation.

## Invocation et observabilité

`scripts/kodjo/lib/vnext-live-chain.js` appelle `spawnSync` avec stdin JSON, `shell:false`, limite 600 000 ms et tampon 64 Mo. La revue emploie `-p --output-format json --json-schema …`, sans sortie événementielle ni fichier de debug archivé. Le diagnostic de fin capture les flux seulement après le retour du processus. L'archive ne fournit donc ni progression, ni premier événement, ni détail des tours, ni PID, ni version effective du binaire, ni état d'authentification ou du service au moment du blocage. Une sortie finale absente n'est pas une preuve d'inactivité.

La documentation officielle distingue JSON final et `stream-json` événementiel, et propose `--verbose`, `--include-partial-messages` et `--debug-file` pour les traces. Références consultées : https://code.claude.com/docs/en/headless et https://code.claude.com/docs/en/cli-reference. Cette documentation courante ne prouve pas la version effectivement installée sur le runner ; toute option future doit être vérifiée contre ce binaire.

## Incohérence entre instructions et outils

Le prompt exige explicitement « appeler unpackUi du consommateur fourni » avant vérification des empreintes. Or l'invocation limite les outils à `Read,Glob,Grep`, interdit tous les MCP et active `--restricted`. Aucun outil d'exécution de JavaScript ou de commandes n'est exposé. Lire la fonction est possible ; l'exécuter pour attester les reconstructions et hashes ne l'est pas avec ces outils. Cette incohérence est confirmée dans le code exécuté, mais aucun événement du run actuel ne prouve que Claude s'y soit arrêté.

La correction à préparer consiste à matérialiser et vérifier les projections canoniques hors modèle, puis à fournir les fichiers et observations exacts au reviewer. Elle ne consiste pas à ouvrir largement les permissions ou à accepter des hashes imaginés par le modèle.

L'ancienne réponse archive aussi deux refus Read, sur le manifeste Figma et la capture PNG temporaires. L'invocation actuelle comporte `--add-dir configDir` : cette différence interdit de reporter automatiquement ces refus sur le nouveau run. L'accessibilité réelle actuelle des ressources reste à observer, sans conclure qu'elle est acquise parce que l'argument existe.

## Suite recommandée avant nouvelle tentative

1. Ajouter des traces de processus exploitables et bornées, avec progression persistée pendant l'appel, version effective et identifiant de session, sans exposer de secrets. Conserver la validation finale stricte du reçu et les sorties d'échec.
2. Supprimer l'instruction d'exécution impossible en fournissant une reconstruction canonique déterministe, vérifiée hors modèle, et contrôler effectivement la lecture des ressources nécessaires.
3. Réduire le contexte transporté ou organiser sa consultation de manière bornée, en conservant les identités, empreintes, fermeture et couverture intégrale exigées. Mesurer l'effet sans présenter une réduction d'octets comme une preuve de succès réel.
4. Une fois le correctif qualifié, préparer une nouvelle demande autorisée ; ne pas rejouer l'UUID consommé `86d8f6ce-e621-47b1-9e11-f9d67d32aa52`. Ne pas augmenter mécaniquement le délai de dix minutes.

Un contrôle de santé local du runner et une tentative instrumentée seront nécessaires pour départager les hypothèses réseau, authentification, démarrage et charge de revue. Ils n'ont pas été exécutés dans cette mission de diagnostic.

## Livraison et deuxième passe

### Complément demandé : origine de la croissance et de la reconstruction

Comparaison des deux `produced.json` archivés, projetés avec le même `compactReviewDossier`. Ancien dossier compact 1 071 227 octets ; nouveau 1 078 245 : +7 018. Le commit `b0bf7edf` ajoute exactement 293 octets d'instruction concernant `dependency_target_indices`, afin d'éviter l'identifiant de type `PLAN_CONTRACT` rejeté précédemment. Total +7 311, identique à la différence des deux entrées réellement enregistrées.

| Origine | Augmentation en octets |
| --- | ---: |
| Sources des consommateurs : nouveau vnext-git-batch (+2 948), nouveau vnext-performance (+1 060), impact-graph modifié (+467) | 4 477 |
| Contrats : candidats +673, impactGraph +1 068, planContract +529, critères UI +111 | 2 381 |
| Catalogue : cinq nouveaux candidats | 160 |
| Instruction sur les indices de dépendance | 293 |
| Total | 7 311 |

Les cinq nouveaux chemins candidats sont `scripts/kodjo/lib/vnext-figma-browser-observer.js`, `scripts/kodjo/lib/vnext-git-batch.js`, `scripts/kodjo/lib/vnext-performance.js`, `scripts/kodjo/measure-vnext-windows.js` et `scripts/kodjo/test-vnext.js`. Les exigences restent trois, les assertions quatre, les SOURCE_UNIT 223. Les références Figma complètes sont identiques entre les deux dossiers ; la croissance n'est donc pas celle du paquet Figma ni celle du périmètre fonctionnel.

La première compaction de revue (candidats en colonnes/lignes et catalogue séparé) vient de `4c304736`, le 4 octobre 2026. La fonction précise `unpackUi`, son inverse `packUi` et l'instruction de l'appeler viennent de `c6bbacad6f3f959dd396be18dcb8753596d4e935`, le 5 octobre à 03:24 Paris : ajout du transport Figma compacté. `pack` partage les noms de propriétés et les valeurs répétées, encode les nœuds/décisions par indices ; `unpackUi` reconstitue les objets complets et les valide avant contrôle des empreintes canoniques. Ce mécanisme est une adaptation technique de transport VNext, pas une nouvelle décision produit ni un changement V2. Il était déjà présent lors du run précédent 37325776512 ; il n'a pas été introduit entre les deux tentatives. Le code antérieur à `c6bbacad` conservait déjà les outils `Read,Glob,Grep` : l'ajout a donc introduit l'incohérence d'instruction identifiée, sans apporter un outil d'exécution au reviewer.

Deuxième passe du complément : somme +7 311 recalculée, chaîne d'instruction mesurée à 293 octets, cinq chemins comparés par identité, références Figma comparées intégralement, commit d'introduction lu directement. Aucune correction ni relance ; seul ce rapport est modifié.

Sources : archive `task2/resume-20261006/runtime-37386304781.zip`, digest SHA-256 `9d7598deb2640b9e1907738ac02208406ebc1c285053a6b207682d15dfb5f0e8`, diagnostics et réponse historiques sous `task2/initial-37325776512/plan-review/`, code du contrôleur et documentation officielle. Les preuves scellées restent inchangées.

Deuxième passe indépendante de rédaction : diagnostic actuel relu directement dans le ZIP ; métriques historiques extraites de la réponse JSON ; somme des cibles et distinction entre dossier compact et entrée réelle revérifiées ; hypothèses séparées des faits ; aucune attribution des anciens refus Read au run actuel. Aucun test applicatif n'est applicable à ce diagnostic documentaire. Les mesures hors ligne et la comparaison des preuves constituent les vérifications effectuées.

PRESERVE : code applicatif, contrôleurs, workflows, fixtures, qualification, preuves, campagne et demandes. CHANGE : ce rapport uniquement. FORBIDDEN : relance Claude, implémentation, tâche 3, clôture, activation V2/PRE-2/PRE-3. Aucune vérification sur appareil réel ; la fixture isolée et la capture Figma figée ne certifient pas une livraison native.

Fichier modifié : `.github/orchestration/reports/2026-10-06_VNEXT_TASK2_REVIEW_DIAGNOSTIC.md`. Commit final : communiqué avec son hash après commit ; retrouvable par `git log -1 --format=%H -- .github/orchestration/reports/2026-10-06_VNEXT_TASK2_REVIEW_DIAGNOSTIC.md`. État Git attendu après commit : propre, rapport committé localement, publication distante non effectuée par cette mission. Au sondage GitHub de diagnostic, aucun run in_progress n'est observé ; la précédente attente de CI ne constitue donc plus une barrière constatée. Cette mission ne modifie pas l'état distant et ne déclare aucune publication réussie.
