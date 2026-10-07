# VNext — couverture ciblée des écueils PRE-1

Date : 2026-09-30. Base de ce complément : PR #268, HEAD
`7176904974bffd1b5f01252724323a0fb2287442`, paquet source du run
`36711704646`, artefact `11094685301`. Aucun changement de PRE-1, #250/#252,
Figma ou code applicatif. Les responsabilités anciennes sont examinées
uniquement pour leur disposition VNext, pas pour rouvrir leur audit global.

## Point de récupération vérifié

- #265 est ouverte en draft : HEAD `9a16a86dc95b1bd13afc704e6c01cc5f3a4137a5`,
  base `protocol/vnext-10-cutover-preparation-20260930`.
- #268 est ouverte en draft : HEAD `7176904974bffd1b5f01252724323a0fb2287442`,
  base `protocol/vnext-11-audit-convergence-20260930`. Le run #641
  `36711704646` : job Linux `109874796195` SUCCESS ; suite Windows, queue
  PowerShell et preflight jetable SUCCESS dans job `109875241623` ; ce job
  reste FAILURE sur le téléchargement de l'artefact historique
  `kodjo-v2-recovery-34606534268-1`. Aucun PASS global revendiqué.
- Le run #623 `36692242379` présente la même distinction pour #265.
- #267 est ouverte, HEAD `771f5a40d231281188e5d470d6268f364ab7fd36`, base main.
  Les runs `36715298578` et `36715298661` étaient IN_PROGRESS à la récupération.
  Ne pas les relancer. L'acceptation propriétaire exacte est consignée dans
  le commentaire `5911351354`, sans modifier le verdict REVISE historique.
- PRE-1 #249 est ouverte. Le run `36692529098`, job `109812807048`, a échoué
  à l'assemblage du scope/contrat après succès du draft. Log exact :
  `UI_PLAN_ASSERTION_PROOF_INVALID: UI-2AC8EDB67087-AE9A073319318: RELATION exige VISUAL_COMPARE`.
  Aucun PLAN_OUTPUT publié par ce run. Sa classification générique
  ORCHESTRATION_FAILURE ne prouve aucune ambiguïté produit.
- Des branches alternatives #264/#266 sont également ouvertes. Le présent
  travail suit la chaîne #265→#268 ; aucune fusion de variantes ni bascule.
  L'inventaire des 30 runs récents a trouvé la qualification PRE-1 concurrente,
  pas un audit d'architecture VNext. Ce n'est pas une preuve d'absence globale
  de runs legacy ; cette preuve complète reste exigée au retrait.

## Diagnostic causal du rapport #267

Source : rapport `.github/orchestration/reports/2026-09-30_INDEPENDENT_AUDIT_36705478288_1.md`
au commit `478b022f9e170d4df9f14fa468bc8bed4b8a19a5`, candidat
`3a7039ef03190e15a3878178aaf65edbf4c319bf`.

| Constat historique | Nature démontrée par le rapport | Disposition ici |
|---|---|---|
| F-01 : normalisation des frontières absente du prompt | Défaut producteur/consommateur reproduit ; règles invisibles au producteur | Paquet VNext avec fermeture transitive des consommateurs ; intégration modèle à exercer dans VNext-12 |
| F-02 : résolution non supportée classée FAIL | Défaut de taxonomie du vérificateur, pas preuve que le composant applicatif est défectueux | Résultat VNext NON_VERIFIABLE et gate WAIT_FOR_PROOF ; le vérificateur legacy n'est pas modifié |
| F-03 : workflows `kodjo-slice-*` exclus | Même réserve que F-01 #250, pas un nouveau défaut à compter deux fois | Reprendre la garantie #268 et compléter la preuve de retrait ; pas refaire le lot |
| F-04 : cinq workflows ne déclenchent pas le pilote | Défaut de routage CI observé statiquement | CI VNext dédiée incluant tous les workflows ; ancien contrôle de rétention non présent dans cette branche, reprise de responsabilité à qualifier |
| F-05/F-07 et correctif PRE-1 | Corrections ciblées dans #267, dont témoin négatif LF/CRLF | Ne pas modifier ici ni annoncer sa qualification finale |
| Artefact recovery introuvable | Preuve indisponible observée dans un job, pas reproduction d'une défaillance recovery | NON VERIFIABLE pour cette certification ; aucun PASS recovery |

Une augmentation du nombre de findings ne démontre pas à elle seule une
régression. Certaines sondes #267 ont atteint des blocs non inspectés par
l'audit précédent. L'identité règle/cible et l'évidence doivent primer sur le
numéro F local à chaque rapport.

## Tableau des six exigences

Les références de code ci-dessous désignent la présente branche. « Testé »
signifie test contractuel local Linux sauf mention d'un run exact. Cela ne
signifie pas que VNext est activé ni que son E2E GitHub est qualifié.

| Axe / exigence VNext | Référence exacte | Conçu / implémenté / testé | Preuve et résultat | Lacune éventuelle | Correction nécessaire / disposition |
|---|---|---|---|---|---|
| 1. Écritures distantes : scanner indépendant des préfixes, déclaration job/destination, legacy figé, retrait sans runs ni reprise | Spec §22 ; `vnext-remote-write-security.js` : `listExecutionFiles`, `evaluateRemoteWriteSecurity`, `validateRetirementObservation` ; `vnext-cutover-contract.js` : `buildCutoverPlan` | Oui / scanner et gate contractuel / #641 + tests du complément | Tests existants workflow arbitraire, script push, REST, drift, job et dernière slice ; nouveau test absence→FAIL, pending run→FAIL, inventaire incomplet refusé | Analyse statique bornée à workflows/scripts kodjo ; code dynamique, autres chemins, permissions effectivement délivrées et observation API complète non démontrés. Conditions d'autorisation déclarées, pas exécutées par un writer production. Pas de preuve réelle de retrait | Collecteur API paginé, neutralisation prouvée de replay/rerun, responsabilité de chaque writer couvert ou retiré avant PASS_RETIRED. Audit architecture puis E2E ; pas de retrait pendant PRE-1 |
| 2. Défaut / preuve indisponible / succès ; gates séparés | `vnext-proof-result.js` : `buildProofResult` ; `audit-convergence-contract.js` : `buildAuditCoverage`, `buildFinalAuditReport` | Oui / oui au niveau contrats / tests ciblés | Syntaxe non supportée avec déclaration PASS ou FAIL→NON_VERIFIABLE ; preuve requise indisponible→WAIT_FOR_PROOF ; finale→FINAL_PROOF_UNAVAILABLE_TERMINAL ; faux FINAL_APPROVED refusé | Adapter le résultat réel de résolution au contrat reste à exécuter ; la preuve référencée ne s'authentifie pas par son hash seul | Ne pas migrer un ancien FAIL par simple remplacement textuel ; alimenter le résultat depuis une observation réelle dans VNext-12 |
| 3. Chaque entrée contrôlée déclenche la CI | `.github/workflows/kodjo-vnext-proof-stability.yml` : `on.pull_request.paths`, jobs `qualification` | Oui / workflow créé / syntaxe locale + invariants locaux | Toutes les entrées workflows/orchestration/scripts/tests et règles AI incluses, sans exclusion de rapports/backlog/queue dans cette CI VNext ; suite VNext Linux/Windows prévue | Déclenchement réel et succès Windows du nouveau HEAD restent à constater. Le contrôle legacy de rétention du candidat #267 n'existe pas dans la base #268 | Qualifier cette CI distante ; tracer la reprise/retrait de la rétention avant bascule. Ne pas conclure couverture d'un exécutable absent |
| 4. Producteur reçoit toutes les règles conditionnelles, frontières et transports | `vnext-producer-packet.js` : `buildProducerPacket` ; `review-contract.js` : `buildReviewerPacket` ; `ui-atomicity-contract.js` : `validateAssertionProofs` ; `plan-contract.js` : `buildBoundaries` | Oui / fermeture CommonJS + API review / tests | Fermeture réelle contient les validateurs conditionnels UI et frontières ; JSON LF/CRLF conserve le paquet ; dépendance dynamique refusée NON_VERIFIABLE | Aucun appel IA VNext production ne consomme encore ce paquet ; les producteurs requirements/impact/plan/UI sont à raccorder au même mécanisme. Aucun succès sémantique modèle revendiqué | Raccordement exhaustif des producteurs et tests sorties acceptées/refusées avant le vrai E2E ; le paquet doit rester celui du candidat exact |
| 5. Registre cumulatif, réserves persistantes, comparaison causale et sévérité séparée du gate lot/phase | `vnext-audit-register.js` : `buildRegister` ; spec §23 ; ledger historique conservé | Oui / contrat cumulatif / tests | Réserve absente de revue suivante conservée ; nouvelle formulation ne peut rendre bloquant ; NON_VERIFIABLE→défaut sans évidence refusé ; changement cible/phase rouvrant explicité ; acteur tiers refusé | Transport authentifié des décisions et vérification matérielle des références à intégrer ; nouveau registre pas encore requis par tous les consommateurs, ledger v1 conservé | Brancher registre cumulatif dans l'admission/audit/handoff VNext et vérifier l'identité transport ; pas d'acceptation par simple déclaration IA |
| 6. Clôture bornée, fermetures/régressions, autorité et limite des reprises, aucun APPROVE fabriqué | `revision-contract.js` : preserved targets et outcome ; `vnext-audit-register.js` : closure/gate/reentry ; `audit-convergence-contract.js` : finale terminale | Oui / contrats / tests | Disparition ne ferme pas ; RESOLVE exige SUCCESS ; limite figée du cycle non extensible ; auto_retry=false ; finale indisponible terminale ; préservation v07 maintenue | Les bornes/décisions sont des entrées de contrat : leur admission réelle doit être prouvée. Un audit d'architecture en lecture n'est pas une qualification finale | Fermer les lacunes d'intégration réelles avant VNext-12, puis tester clôture et régressions dans le périmètre ; un défaut nouveau prouvé reste recevable |

## Décisions dérivées, sans nouvelle décision produit

- Autorité d'acceptation : propriétaire explicitement identifié à l'admission,
  repris de la décision PRE-1 ; une recommandation/auditeur ne peut accepter.
  Le contrat vérifie l'acteur reçu ; l'adaptateur doit vérifier le véritable
  auteur du transport. Aucun hash ne remplace cette authentification.
- L'identité du sujet est règle+cible, indépendante du libellé et du numéro
  de finding local. La réouverture compare cible, norme, critère, nouvelle
  évidence et phase ; la note motive chaque requalification.
- La limite de révision est explicite et figée à l'admission, sans seuil
  global nouveau décidé ici. Les tests utilisent un cycle borné à une reprise.
- Une réserve acceptée conserve le défaut et sa gravité ; elle produit
  ACCEPTED_WITH_RESERVES, jamais une modification du verdict en APPROVE.
- Le changement de phase oblige à reconsidérer l'applicabilité. Une preuve
  expirée doit être une nouvelle observation indisponible, pas un défaut
  applicatif. Aucune durée arbitraire d'expiration n'est ajoutée.

## Qualification et suites

Tests locaux du complément : suite VNext 161 tests, 161 PASS, 0 FAIL, 0 SKIP ;
63 workflows acceptés par le parseur YAML indépendant ; invariants workflows
PASS. Les identifiants du nouveau HEAD/run distants seront des preuves
séparées, pas une réécriture de cette baseline de contrôle local.

Audit anticipé prêt : `KODJO_VNEXT_ARCHITECTURE_AUDIT_MISSION.md`, job
`architecture-audit` du workflow dédié. Un seul appel à l'ouverture de la PR,
après les deux qualifications ; rerun/synchronize ne rappelle pas Claude.
Résultats en artefact, sans writer GitHub ni publication automatique de
verdict. Les contraintes CLI sont documentées dans la documentation primaire
[Claude Code CLI](https://code.claude.com/docs/en/cli-reference).

La matrice historique individuelle 165/138 n'est pas déclarée terminée ici.
Le vrai E2E VNext-12 et le cutover ne sont pas lancés. Les six axes restent
PARTIELLEMENT CONFORMES au niveau exécuté tant que les lacunes d'intégration
ci-dessus n'ont pas leurs preuves. Cette vérification ne bloque pas le
développement PRE-1 autorisé séparément.

## Suite de l’audit anticipé

Run `36719499021` : rapport architecture livré ; ce succès ne vaut pas
approbation d’architecture. Le [traitement ciblé](reports/2026-09-30_VNEXT_ARCHITECTURE_CLOSURE.md)
conserve le rapport source, distingue corrections de contrat et lacunes
opérationnelles, et ajoute les dispositions individuelles 165/138.
Les preuves qualifiées au HEAD `a0e7379` ne qualifient pas les corrections
postérieures ; le nouveau HEAD doit être vérifié séparément.
