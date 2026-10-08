# VNext — réparation ciblée des constats de #334

## Base et autorisation

Base publiée : `27a8a1a3339f3980899c6e3d0be9d14f181e0067`, arbre `285cf03f70bd6d89beb7b6d1766f5ea6cd8a252a`. L’index local était identique à cet arbre avant modification. Le propriétaire a demandé le 8 octobre 2026 le diagnostic, la correction des problèmes, le traitement des corrections trop locales et la relance du test. Aucun run n’était actif sur ce candidat. Aucun développement produit, lancement PRE-3, fusion ou nouvel audit global n’est inclus.

Le rapport indépendant concerné est celui du run `37746114185`, candidat `7ab07cef`, commit d’évidence `c50dd5b996097e15ffcb9d57b1074e19bbad6fdd`. Son verdict reste historiquement REVISE : 1 bloquant, 3 majeurs, 5 mineurs. La présente réparation ne réécrit ni ce verdict ni ce rapport.

## Registre unique des constats existants

| Constat | Cause racine / diagnostic | Traitement et état de preuve |
|---|---|---|
| IA-F01 — bloquant | Le finaliseur lisait des statuts déclarés ; le consommateur comparait seulement un arbre déclaré à Git. Les références du run et de l’artefact n’étaient pas consommées. La généralisation de la clôture a étendu ce défaut ancien. | Vérificateur commun au finaliseur CLI et à la clôture. Producteur de commandes Jest/TypeScript/lint dans un job séparé en lecture seule. Vérification du run/tentative, job réussi, versions du producteur/workflow, artefact, digest ZIP sur octets et arbre de livraison. Provenance conservée dans FINAL_OUTPUT. Tests positifs et négatifs locaux réussis ; qualification distante à établir. Aucune clôture réelle produit revendiquée. |
| IA-F02 — majeur | Correction de quatre lecteurs sans recensement complet des lecteurs des mêmes blocs ; deux `.exec()` Figma subsistaient. | Parser partagé dans les deux lecteurs Figma et dans la préparation du dossier de revue d’implémentation. Doublons identiques acceptés ; conflits et blocs malformés refusés avant matérialisation. Tests sur PLANNER, IMPLEMENTER et IMPLEMENTATION_REVIEWER réussis. |
| IA-F03 — majeur | Le transport par plages n’avait pas de preuve réelle réussie au moment de l’audit. L’attestation sémantique du reviewer ne devient jamais une preuve automatique d’examen. | Preuve réelle acquise sur `27a8a1a3` : run `37756456606` SUCCESS, base REVISE puis correction causale unique et revue APPROVE, deux sessions réelles, couverture complète, aucun moteur produit appelé. Artefact `kodjo-vnext12-revision-37756456606-1`, SHA-256 `b4b0f6027b0a32adb98b5dec8aaf2678b2d2cae212ad33512866b30bfdd08fe9`, bilan durable commentaire `6058238885`. Le nouveau candidat sera requalifié par le même parcours ciblé. L’échelle de 2 259 cibles reste un test synthétique, pas une revue sémantique réelle de 2 259 fichiers. |
| IA-F04 — majeur | Le consommateur acceptait un booléen `true` que le finaliseur réel ne sait pas produire. Le test positif verrouillait cette permissivité. Aucun bypass vivant n’était démontré. | `false` exigé pour les attestations visuelles et d’accessibilité dans les deux portées de clôture. Tests négatifs produit avant toute écriture, tests de reprise/idempotence et réserves appareil conservés. |
| IA-F05 — mineur | Deux tests pouvaient échouer sur la tolérance avant d’atteindre le contrôle de reconstruction qu’ils prétendaient tester. | Fixtures neutralisant uniquement les identifiants optionnels devenus orphelins ; assertions précises de REBUILD_MISMATCH rétablies. Vérifications ciblées réussies. |
| IA-F06 — mineur | Base de certification configurable par une demande versionnée. | Réserve préexistante conservée, non corrigée par ce lot ; aucune fusion autorisée par le mécanisme de clôture. |
| IA-F07 — mineur | Omissions secondaires non propagées au record durable de clôture. | Réserve conservée, non déclarée corrigée. La preuve du parcours réel actuel est complète, sans omission ; cela ne démontre pas la propagation future d’omissions. |
| IA-F08 — mineur | Le refus de routage legacy était seulement dans le validateur de demande. | Contrôle déplacé dans validateConfig pour les livraisons produit et réutilisé par les entrées. La certification jetable reste explicitement distincte ; les anciennes tranches produit ne sont pas converties. |
| IA-F09 — mineur | Diagnostic historique jetable non gating : certification d’un paquet présent tolérée avec continue-on-error. | Hors des correctifs ciblés ; réserve préexistante conservée, sans affirmer une certification d’un paquet invalide. |

## Alternative aux corrections trop locales

La correction suit la règle et ses consommateurs, pas seulement les lignes signalées :

| Chaîne | Producteur / transport | Consommateurs / gates | Dépendances vérifiées |
|---|---|---|---|
| Preuve de tests | produce-vnext-test-evidence.js → reçu exécuté → artefact GitHub | finalize-vnext-delivery.js et close-vnext-github-delivery.js → vérification commune → record durable | Job read-only avant job writer ; actions:read ; identité/tentative/job/digest ; politique d’artefact ; blob writer épinglé |
| Blocs Figma | Projection de plan → blocs atomicité et registre | consume() aux trois stades + préparation de revue d’implémentation | Parser commun ; ressources non écrites en cas de conflit ; snapshot récursif du module partagé |
| Attestations | Finaliseur existant : false | Préparation et publication de clôture : false | Refus des deux booléens true ; conservation de PENDING_DEVICE et acceptation fonctionnelle réservée |
| Revue réelle | Benchmark négatif → correction unique → nouvelle revue | Reçus scellés et vérifiés ; handoff seulement | Même périmètre ; deux appels maximum ; pas d’implémentation, pas d’audit global |

Les contrôles de dépendances existants ont détecté avant publication deux raccordements : module machine-block absent du snapshot transporté et nouveau nom d’artefact non classé. Ces deux dépendances sont corrigées dans le même candidat ; aucun workflow distant n’a été lancé entre ces corrections. Le changement du snapshot legacy est uniquement l’ajout de cette dépendance partagée : aucun parcours applicatif V2 n’est relancé.

## Vérifications et limites

- Première passe ciblée : 72 tests PASS / 0 FAIL.
- Tests des raccordements artefacts/dépendances et de clôture : 33 PASS / 0 FAIL.
- Métadonnées de writers et équivalence historique : 13 PASS / 0 FAIL.
- 71 workflows YAML acceptés ; invariants de workflows valides ; 55 uploads conformes à la politique de conservation.
- Références historiques : seules les empreintes/positions des tests réellement modifiés sont mises à jour ; aucun sujet, protection ou preuve historique n’est remplacé.
- Suite complète locale : 1 430 tests, 1 425 PASS, 0 FAIL, 5 SKIP. Les tests ignorés restent signalés. Qualification distante à établir. Les tests utilisant un service injecté ne sont pas présentés comme un appel GitHub réel ou une revue réelle.
- Le job générique de tests/clôture n’a pas été exécuté sur une livraison produit. Les qualifications ciblées ne valent ni clôture réelle produit ni autorisation de fusion.

La seconde passe est une vérification ciblée des règles, anciennes formulations, consommateurs, snapshots, politique writers, artefacts, contrats et références. Elle ne crée pas un nouvel audit global ni un nouveau cycle de conception.
