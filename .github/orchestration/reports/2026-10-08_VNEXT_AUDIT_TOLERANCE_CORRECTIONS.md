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

## Publication autorisée et qualifications lancées

Le 8 octobre 2026, l’utilisateur a répondu « oui » à la demande explicite de publication de la branche, ouverture de PR et lancement des qualifications/tests réels. Le refus précédent reste une trace historique, et ne décrit plus l’état courant. Le push shell a ensuite échoué faute de credentials ; la publication autorisée a réussi via le connecteur GitHub.

- PR : https://github.com/MyUncried/Application-Routine/pull/334 ; candidat `0df1a9b3188fa022063aac004227ae399cc1c834`.
- Arbre publié égal à l’arbre local testé : `402d63b4e476537937152ec1a2c1199e17498a18`.
- Qualification complète exacte : run `37738297203` ; contrats Linux et équivalence historique Linux SUCCESS, Windows encore actif au relevé.
- Pilotes Linux/Windows : run `37738297210` ; Linux SUCCESS, préflight Windows actif.
- Audit indépendant : run `37738297267` ; attente du pilote exact.
- Benchmark réel : run `37738297359` ; attente de la qualification complète exacte. Aucune invocation du reviewer attestée à ce relevé.

Seconde passe du raccordement de clôture : la provenance héritée désignait systématiquement le workflow disposable. Correction additionnelle préparée : sélection explicite du workflow réel parmi les deux workflows autorisés, vérification de ses bytes au SHA de l’événement, refus d’un workflow différent ou obsolète. Le comportement historique par défaut est conservé. 44 tests ciblés PASS, 0 FAIL. Cette correction change le code du contrôleur : elle doit être publiée et qualifiée à son propre SHA avant utilisation réelle. Ne pas assimiler les résultats du candidat initial à cette qualification additionnelle.

## Résultats initiaux distants et diagnostic avant nouvelle tête

Le candidat publié `0df1a9b3188fa022063aac004227ae399cc1c834` a terminé ses quatre exécutions initiales :

- qualification exacte `37738297203` : SUCCESS, contrats et équivalence historique sur Linux et Windows ;
- pilotes `37738297210` : SUCCESS, suite Linux et préflight Windows compris ;
- audit indépendant `37738297267` : FAILURE avant tout appel reviewer ;
- benchmark réel `37738297359` : FAILURE pendant le premier appel reviewer, avant verdict.

L’audit indépendant a exécuté la suite complète sur le runner Windows pendant environ 31 minutes : 1 411 PASS, 2 FAIL, 4 SKIP. Les deux échecs sont des fixtures d’interruption qui imposaient 300 ms et 500 ms à un nouveau processus Node. Sous cette charge, le processus n’a pas eu le temps de publier ses octets/son premier événement avant la terminaison. Les mêmes contrôles avaient réussi dans le pilote Windows précédent. La correction conserve une vraie interruption et porte les deux délais de fixture à 5 secondes ; elle ne change ni le timeout du reviewer réel ni ses règles d’acceptation.

Le benchmark réel a passé le gate de qualification exacte, puis `prepare-vnext12-revision.js review` s’est arrêté après 37 secondes avec `VNEXT_LIVE_PROCESS_FAILED`. Aucun verdict REVISE ou APPROVE n’est revendiqué. L’artifact `11533009017`, digest `sha256:2ddcf21a98f54168b6a55e0a332b553fd57ac6a59102d5bf9faed30e78ed02a9`, conserve sept fichiers. Le connecteur a fourni la référence de téléchargement mais le stockage temporaire a répondu HTTP 502 lors des tentatives de lecture. Ce défaut est traité comme une indisponibilité transitoire de récupération : aucun second appel reviewer identique n’est lancé avant lecture du statut et de la réponse conservés.

La prochaine tête doit inclure à la fois la correction de provenance IA-004 et la stabilisation des deux fixtures. Les qualifications acquises sur `0df1a9b3` ne seront pas réutilisées comme preuve du nouveau contrôleur.

## Cause racine du benchmark réel — preuve récupérée

Le job de récupération `113206521560`, run `37745692205`, a téléchargé l’artefact initial sans aucun appel modèle. `initial-review-response.json` contient un événement terminal Claude, session `65150b1b-3cb6-4a4b-9bc4-f2c744881179`, `is_error=true`, `terminal_reason=api_error`, `result="Failed to authenticate: OAuth session expired and could not be refreshed"`. Le processus est sorti avec statut 1 et stderr vide. Aucun token d’entrée/sortie ni coût API, aucun verdict. La session OAuth du runner était expirée et non renouvelable ; aucun défaut de plan ni timeout réel n’est démontré.

Cause du diagnostic opaque : le superviseur archivait correctement stdout mais utilisait uniquement error_code ou stderr pour expliquer une sortie non nulle. Le message d’authentification placé dans l’événement terminal stdout était donc masqué. Correction : réutilisation du classifieur existant pour distinguer authentification requise, quota et erreur processus ; tout événement is_error reste rejeté, même avec exit 0. Les preuves originales restent conservées. Un précontrôle sans appel modèle exige une mise à jour des credentials après l’échec OAuth et un auth status connecté avant le prochain benchmark. Une reconnexion interactive sur le PC Windows reste nécessaire ; aucun jeton n’est demandé, imprimé ni remplacé par cette correction.

Les deux fixtures Windows et la provenance de clôture sont publiées dans `93fca46a`, qualification `37745692242`, pilotes `37745692295`, audit `37745692186`. Le benchmark y est volontairement suspendu pour diagnostic ; les résultats de cette tête ne qualifient pas le correctif de classification suivant.

Seconde passe du correctif : 18 tests ciblés PASS, 0 FAIL (capture et classification stdout, quota, erreur générique, exit 0 avec is_error, vrai timeout, reprise des preuves, provenance de clôture). Le contrôle structurel des 71 workflows est PASS. La suite complète locale est en cours ; les résultats GitHub de la prochaine tête restent à établir. Pour reconnecter le contexte exact du runner : PowerShell, `$env:CLAUDE_CONFIG_DIR='C:\Users\hadjo\.claude'`, puis `claude auth login`, puis `claude auth status`. La commande login nécessite la connexion interactive du propriétaire ; l’assistant n’a pas accès à ce PC ni au flux d’authentification.

Suite complète locale finale : **1 414 PASS / 0 FAIL / 5 SKIP**, 1 419 tests en 53,767 s. Les tests ignorés restent explicitement ignorés. Nouvelle qualification distante et revue indépendante requises au SHA exact publié ; preuve réelle de clôture générique toujours restante.
