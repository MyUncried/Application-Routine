# VNext — correction des quatre fragilités et tolérance de revue

## Autorisation et base

Instruction utilisateur du 8 octobre 2026 : corriger les quatre fragilités IA-001 à IA-004, introduire des seuils de tolérance, qualifier les corrections et utiliser les parcours jetables/réels si nécessaire. Base exacte : `ab046b9da27d161c181a111ab61c99a9bc7ba13f`. Vérification préalable GitHub : aucun run en cours, aucune PR dédiée à ces correctifs. PRE-3 et la PR documentaire #333 ne sont pas modifiés.

## Conception et corrections

| Réserve | Correction | Vérification attendue |
|---|---|---|
| IA-001 | Catalogue ciblé ; attestation compacte par plages ; omissions secondaires tolérées jusqu’à 3 cibles ET 2 %, consignées sans faux examen | Échelle 2 259 cibles, seuils positifs/négatifs, dépendances, révision, refus de cible essentielle absente |
| IA-002 | Corpus normatif VNext ajouté à l’inventaire ; doublon de titre corrigé | Présence et classification des sources de gouvernance |
| IA-003 | Lecture de tous les blocs ; doublons identiques tolérés ; conflit refusé avant filtrage | Doublon identique, conflit, bloc mal formé, leurre d’une autre tranche |
| IA-004 | Identités de tranche/campagne paramétrées ; branche de base explicite ; workflow de clôture générique | Autre campagne, tranche produit, idempotence, perte de réponse, dérive de tête, finalisation authentifiée |

Le manifeste de candidats complet reste conservé. Les contrôles de préservation hors périmètre restent actifs. Les données de revue ne prétendent jamais que les cibles en attente ont été examinées. La politique distingue risque de blocage et acceptation de fusion.

## Vérifications effectuées

- 37 tests ciblés réussis lors de la première passe (revue, clôture et quatre fragilités).
- Syntaxe indépendante : 71 workflows YAML acceptés ; validation des workflows réussie.
- Scanner d’écritures : `NO_UNDECLARED_REMOTE_WRITE_CAPABILITY`, 258 fichiers examinés.
- Dépendance détectée pendant la suite : le contrat de révision comparait encore le catalogue ciblé au graphe de tous les candidats. Correction : catalogue ciblé recalculé depuis les artefacts ; graphe complet maintenu pour les préservations.
- Trois attentes de tests sont adaptées : transport désormais par plages et refus plus précoce d’un catalogue altéré. Aucun test de protection supprimé.
- Suite complète locale Linux : **1 412 PASS, 0 FAIL, 5 SKIP** (1 417 tests), puis 32 tests ciblés PASS après ajout du garde de qualification et du contrôle de demande générique. Les SKIP restent SKIP.
- Contrats de révision et transport : **29 PASS, 0 FAIL**.
- Qualification complète Linux/Windows, revue indépendante et preuves réelles : EN ATTENTE. Aucun succès réel, jetable ou modèle non exécuté n’est revendiqué.

## Limites et suite

Les tests synthétiques de 2 259 cibles prouvent le transport et la validation, pas une revue réellement effectuée par Claude. La qualification GitHub doit porter sur la tête exacte publiée. Le parcours réel de clôture doit utiliser une identité de test différente de VNEXT-12-QUALIF et une finalisation authentifiée, sans toucher à PRE-3 ni publier Routine.


## Qualification réelle ciblée préparée

Le workflow en lecture seule `kodjo-vnext-audit-tolerance-qualification.yml` attend la qualification complète exacte avant le benchmark existant `prepare-vnext12-revision.js`. Deux appels réels au reviewer sont prévus : proposition négative puis révision causale unique. Les sessions, verdicts, plages attestées et résultats sont archivés dans un artifact protégé. La demande explicite utilisateur est conservée dans `vnext-audit-tolerance/qualification-request.json`. Aucun retry identique automatique, aucun nouveau cycle applicatif, aucune écriture dans le registre ou les sources produit.

Seconde passe ciblée : paramètres de tolérance verrouillés, recomposition du catalogue en révision, conservation du graphe complet, absence de publication applicative dans la clôture, reprise idempotente et refus des blocs JSON nuls/primitifs contrôlés. La revue indépendante GitHub reste requise avant intégration.


## Point d’arrêt — publication refusée

- Commit de code vérifié : `0454d19680375d36e4ce4579a3cd0edbf3065a1c`.
- Suite complète répétée sur cette tête exacte : **1 412 PASS / 0 FAIL / 5 SKIP**, 1 417 tests, 52,196 s.
- Production réelle du dossier depuis cette tête Git, sans reviewer : **2 275 candidats dans le manifeste, 3 candidats pertinents dans la revue, 11 cibles totales**. Les objets Git et consommateurs sont observés par le producteur existant. Ceci ne prouve pas une revue Claude.
- Périmètre contrôlé : 28 fichiers de protocole, aucun fichier applicatif ni document produit sous `docs/` modifié ; UTF-8 et empreintes des consommateurs figés modifiés vérifiés.
- Push vers `MyUncried/Application-Routine`, branche `fix/vnext-audit-tolerance-20261008`, rejeté par le contrôle automatique d’approbation. Motif déclaré : destination externe non explicitement autorisée par la demande de correction et de tests ; risque de publication de code potentiellement sensible.
- Relecture GitHub du ref demandé : absent (404). Aucune PR ni qualification GitHub ni invocation réelle du reviewer lancée par cette mission.
- Aucun contournement ni méthode alternative de publication utilisé. Autorisation explicite de publication nécessaire pour poursuivre les opérations externes. PRE-3 reste inchangée.
