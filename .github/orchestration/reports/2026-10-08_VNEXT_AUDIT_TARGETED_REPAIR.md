# VNext — réparation ciblée des constats de #334

## Base et autorisation

Base publiée : `27a8a1a3339f3980899c6e3d0be9d14f181e0067`, arbre `285cf03f70bd6d89beb7b6d1766f5ea6cd8a252a`. L’index local était identique à cet arbre avant modification. Le propriétaire a demandé le 8 octobre 2026 le diagnostic, la correction des problèmes, le traitement des corrections trop locales et la relance du test. Aucun run n’était actif sur ce candidat. Aucun développement produit, lancement PRE-3, fusion ou nouvel audit global n’est inclus.

Le rapport indépendant concerné est celui du run `37746114185`, candidat `7ab07cef`, commit d’évidence `c50dd5b996097e15ffcb9d57b1074e19bbad6fdd`. Son verdict reste historiquement REVISE : 1 bloquant, 3 majeurs, 5 mineurs. La présente réparation ne réécrit ni ce verdict ni ce rapport.

## Registre unique des constats existants

| ID | Sévérité d’origine | Problème et cause racine | Correction existante | Preuve / SHA | État actuel | Action restante |
|---|---|---|---|---|---|---|
| IA-F01 | Bloquant | Les statuts déclarés ne consommaient pas la provenance de tests ; défaut étendu à la clôture générique | Vérificateur partagé run/tentative/job/ZIP/digest/arbre ; producteur read-only ; provenance durable | b9f6e34 ; runs 37771627017 et 37777593561 ; revue 37778468901 ; commentaire 6060798965 de #334 | Qualifié à distance et RESOLVED par revue ciblée ; intégré dans 6be6082e | Aucun correctif demandé ; clôture produit réelle non revendiquée |
| IA-F02 | Majeur | Deux lecteurs Figma et une dépendance indirecte échappaient au parsing partagé | Parser partagé ; doublons identiques admis, contradictions refusées ; snapshot dépendant complété | b9f6e34 ; revue 37778468901 RESOLVED | Qualifié à distance et clos sur le périmètre ciblé | Aucun sans preuve nouvelle de régression |
| IA-F03 | Majeur | Transport par plages sans preuve réelle réussie à l’audit | Deux appels réels REVISE → correction causale → APPROVE et préparation transport | 37756456606 sur 27a8a1a3, requalification 37771627024 sur b9f6e34 ; revue 37778468901 RESOLVED | Qualifié à distance et clos | L’attestation sémantique n’est pas une preuve mécanique de lecture ; pas d’implémentation produit déduite |
| IA-F04 | Majeur | Consommateur permissif pour des attestations true sans producteur qualifié | false exigé dans les deux portées, tests négatifs avant toute écriture | b9f6e34 ; clôture 37777593561 ; revue 37778468901 RESOLVED | Qualifié à distance et clos | Producteur appareil/humain true toujours absent : limitation explicite, hors correction conservatrice |
| IA-F05 | Mineur | Deux fixtures pouvaient échouer sur la tolérance avant le rebuild testé | Neutralisation des seuls IDs optionnels orphelins ; assertion précise REBUILD_MISMATCH | b9f6e34 ; tests architecture-closure et audit-convergence rejoués localement pendant cette reprise | Corrigé, vérifié localement ; qualification #334 acquise ; disposition ciblée finale à vérifier | Inclure dans qualification distante et revue de cette réparation, sans recréer le constat |
| IA-F06 | Mineur | Base de certification libre dans une demande versionnée | main/base protocolaire admises ; autre base exige justification versionnée liée à campagne/branche ; justification durable | Tests vnext-github-closure : absence, vide, mauvais binding, cas positif ; nouvelle PR basée sur 17d9774a | Corrigé et vérifié localement ; non clos à distance | Qualification du candidat publié et revue ciblée |
| IA-F07 | Mineur | Les omissions scellées dans le reçu perdaient leur transport et leur consommateur durable | Contexte/rapport validés → plan approuvé → finaliseur exact Git → record local et FINAL_OUTPUT/SLICE_CLOSED ; reprise conserve les omissions | Tests vnext-minor-reserves, entrée réelle Final.execute avec Git et API injectée, deux publications et idempotence ; nouveau candidat basé sur 17d9774a | Corrigé et vérifié localement ; non clos à distance | Qualification Linux/Windows et revue ciblée ; aucun parcours réel sans omission utilisé pour prouver cette propagation |
| IA-F08 | Mineur | Refus legacy seulement dans le validateur de demande | Contrôle dans validateConfig autoritatif, partagé par les entrées | b9f6e34 ; test direct V2-CAT-01 rejoué localement ; aucune tranche legacy exécutée | Corrigé, vérifié localement ; qualification #334 acquise ; disposition ciblée finale à vérifier | Qualification/revue ciblées de la preuve du refus |
| IA-F09 | Mineur | continue-on-error sur certification d’un paquet historique présent | Tolérance réservée au téléchargement ; certification invalide échoue ; absence SKIP et invalidité FAIL distinctes | Workflow VNext historique ; tests du job et de non-régression des autres étapes legacy | Corrigé et vérifié localement ; non clos à distance | Qualification native Windows du bloc modifié, tests positifs/négatifs et revue ciblée |

## Alternative aux corrections trop locales

La correction suit la règle et ses consommateurs, pas seulement les lignes signalées :

| Chaîne | Producteur / transport | Consommateurs / gates | Dépendances vérifiées |
|---|---|---|---|
| Preuve de tests | produce-vnext-test-evidence.js → reçu exécuté → artefact GitHub | finalize-vnext-delivery.js et close-vnext-github-delivery.js → vérification commune → record durable | Job read-only avant job writer ; actions:read ; identité/tentative/job/digest ; politique d’artefact ; blob writer épinglé |
| Blocs Figma | Projection de plan → blocs atomicité et registre | consume() aux trois stades + préparation de revue d’implémentation | Parser commun ; ressources non écrites en cas de conflit ; snapshot récursif du module partagé |
| Attestations | Finaliseur existant : false | Préparation et publication de clôture : false | Refus des deux booléens true ; conservation de PENDING_DEVICE et acceptation fonctionnelle réservée |
| Revue réelle | Benchmark négatif → correction unique → nouvelle revue | Reçus scellés et vérifiés ; handoff seulement | Même périmètre ; deux appels maximum ; pas d’implémentation, pas d’audit global |

Les contrôles de dépendances existants ont détecté avant publication deux raccordements : module machine-block absent du snapshot transporté et nouveau nom d’artefact non classé. Ces deux dépendances sont corrigées dans le même candidat ; aucun workflow distant n’a été lancé entre ces corrections. Le changement du snapshot legacy est uniquement l’ajout de cette dépendance partagée : aucun parcours applicatif V2 n’est relancé.

## Vérifications du lot historique b9f6e34 (supersédées par les preuves distantes)

- Première passe ciblée : 72 tests PASS / 0 FAIL.
- Tests des raccordements artefacts/dépendances et de clôture : 33 PASS / 0 FAIL.
- Métadonnées de writers et équivalence historique : 13 PASS / 0 FAIL.
- 71 workflows YAML acceptés ; invariants de workflows valides ; 55 uploads conformes à la politique de conservation.
- Références historiques : seules les empreintes/positions des tests réellement modifiés sont mises à jour ; aucun sujet, protection ou preuve historique n’est remplacé.
- Suite complète locale : 1 430 tests, 1 425 PASS, 0 FAIL, 5 SKIP. Les tests ignorés restent signalés. Qualification distante à établir. Les tests utilisant un service injecté ne sont pas présentés comme un appel GitHub réel ou une revue réelle.
- Le job générique de tests/clôture n’a pas été exécuté sur une livraison produit. Les qualifications ciblées ne valent ni clôture réelle produit ni autorisation de fusion.

La seconde passe est une vérification ciblée des règles, anciennes formulations, consommateurs, snapshots, politique writers, artefacts, contrats et références. Elle ne crée pas un nouvel audit global ni un nouveau cycle de conception.

## Reprise du 8 octobre 2026 après intégration

Base de cette réparation : main `17d9774a31429bc2bee4eb834e4ed1e9aafa68ec`, arbre `e1444a5f9780d56569ad6b742fd9193f0c0433e2`. #334 a été fusionnée en `6be6082efde244b14b9b3b6befc5d22db021c445`, après APPROVE ciblé de `b9f6e34acffe0576c4cd2c624de3e7ffdf42a09e`. #338 ne modifie que la documentation produit ; aucune nouvelle certification n’en est déduite. L’audit global 37746114185 reste REVISE sur 7ab07cef. Les formulations « à établir » des sections historiques décrivent leur état antérieur, pas l’état actuel du tableau ci-dessus.

État lu avant mutation : aucun run in_progress/waiting ; une Lean Queue V2 34748621746 restait queued depuis le 13 septembre sur 1093ad9b. Aucun replay, annulation ni modification de cette demande legacy. Les PR ouvertes concernent une documentation PRE-3 et d’anciens lots empilés ; aucune réparation concurrente des trois réserves détectée. Aucune nouvelle surveillance créée ; aucun suivi VNext actif constaté.

Autres registres relus : registre cumulatif PR250 du 30 septembre (familles historiques, reports explicites), registre protocolaire général, cases d’incidents de la campagne et campaign-state. Le cycle réel du 7 octobre est CYCLE_CLOSED (37688962970), mais ses anciennes mentions NOT_ALL_EXERCISED/NOT_OBTAINED ne prouvent pas chaque scénario opérationnel. La clôture #335 du 8 octobre est celle d’une livraison de qualification, avec reprise idempotente ; elle ne clôture aucune tranche produit. Les reports de audit-deferrals.json restent des reports, sans audit global supplémentaire ni fermeture inventée de familles historiques.

Validation locale de la reprise : 41 contrôles de clôture/finalisation/réserves PASS ; 23 contrôles de reprise/callees PASS ; suite complète finale 1 437 tests, 1 432 PASS, 0 FAIL, 5 SKIP. 72 workflows YAML valides ; invariants et politique writers PASS_WITH_FROZEN_LEGACY, zéro finding. Un premier lancement complet a échoué avant installation du tokenizer épinglé et sur deux raccordements : exception ciblée du diagnostic IA-F09 et reconstruction du plan approuvé après acceptation. Causes corrigées puis suite complète rejouée. Aucun affaiblissement de tolérance, protection historique ou gate d’écriture.

La correction IA-F09 porte sur le consommateur VNext read-only ; le workflow V2 gelé n’est pas changé. Le test de comparaison exige une identité de toutes les autres étapes et une différence explicitement contrôlée pour ce diagnostic.

Les tests d’omissions utilisent des revues synthétiques explicitement nommées fixtures ; ils prouvent la chaîne mécanique avec omissions, pas un nouvel appel de reviewer réel ni une clôture GitHub distante. La revue ciblée réelle et la qualification distante du nouveau candidat restent à obtenir. VNext n’est pas entièrement finalisé à ce stade. PRE-3 n’est ni lancé ni modifié.

La revue indépendante ciblée IA-F05..09 est raccordée au workflow dédié réutilisant la sérialisation et les mécanismes de #334 : un seul appel réel, outils Read/Glob/Grep, après qualification Linux/Windows et historique du SHA exact. Son verdict ne remplace pas l’audit global historique. Les preuves sont préservées même en échec ; aucune relance automatique du reviewer.
