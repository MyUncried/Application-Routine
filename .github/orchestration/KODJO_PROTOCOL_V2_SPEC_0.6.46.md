# KODJO Protocol V2 — spécification 0.6.46

Date : 2026-09-19  
Base : 0.6.45  
Objet : synchronisation automatique, strictement latérale, des environnements Routine Dev et Routine.

## 1. Portée stricte

0.6.46 **ne modifie pas le flux principal V2**.

Elle n’ajoute, ne retire et ne renomme :
- aucun état protocolaire ;
- aucune transition ;
- aucun gate PLAN / IMPLEMENT / REVIEW / VISUAL / FINAL ;
- aucune règle de préflight ;
- aucune règle de queue, recovery, retry ou checkpoint ;
- aucune règle de validation humaine/device ;
- aucune condition de clôture.

Elle observe uniquement deux jalons déjà produits par le protocole et déclenche une action technique d’environnement sans effet causal en retour sur le protocole.

## 2. Synchronisation Routine Dev

Jalon observé :
- fin réussie du workflow de revue, observée par `workflow_run.completed` (correction audit F05) ;
- commentaire existant `[KODJO_SLICE] IMPLEMENTATION_REVIEW_OUTPUT` ;
- `verdict=APPROVE` ;
- `STATUT : IMPLEMENTATION_REVIEW_APPROVED` ;
- source `IMPLEMENTATION_OUTPUT` V2 Lean Queue ;
- PR applicative ouverte sur `main` ;
- branche et HEAD toujours exacts.

Le commentaire reste la preuve métier. Le sidecar le lie au `source_review_run_id` et au `source_review_run_attempt` exacts, vérifie son auteur, son horodatage et tous les contrats ci-dessous. Aucun déclenchement ne repose sur un `issue_comment` produit avec `GITHUB_TOKEN`. Une fin de workflow sans approbation applicable ne publie rien.

Action latérale :
- si le diff est OTA-compatible : publication EAS Update iOS sur le channel `review` ;
- si le diff contient un changement natif/configuration : soumission d’une nouvelle build interne `review` de Routine Dev.

La publication ne modifie aucun commentaire, aucune Issue, aucune PR et aucun état protocolaire.

## 3. Synchronisation Routine stable

Jalon observé :
- événement GitHub `pull_request.closed` avec `merged=true` vers `main` ;
- la PR fusionnée doit être reliée à un `FINAL_OUTPUT` V2 déjà existant ;
- ce `FINAL_OUTPUT` doit contenir `STATUT : READY_TO_CLOSE` ;
- son contrat final doit désigner exactement la même PR, branche et HEAD applicatif.

Action latérale :
- si le diff est OTA-compatible : publication EAS Update iOS sur le channel `stable` depuis le commit exact de fusion dans `main` ;
- si le diff contient un changement natif/configuration : soumission d’une nouvelle build interne `preview` de Routine.

Une PR protocolaire, documentaire, tooling ou autre PR fusionnée sans preuve V2 `FINAL_OUTPUT` exacte est `NOT_APPLICABLE` pour ce sidecar et ne provoque aucune action Routine.

## 4. Configuration EAS

Source de vérité persistante :
- EAS projectId : `0ee44f86-bd22-4b92-8780-e265b72907d9` ;
- updates URL : `https://u.expo.dev/0ee44f86-bd22-4b92-8780-e265b72907d9` ;
- runtimeVersion : politique `appVersion`.

Identités :
- Routine : `com.ankusha.kodjo` ;
- Routine Dev : `com.ankusha.kodjo.dev`.

Profils :
- `development` : développement local historique, conservé ;
- `review` : build interne Routine Dev destinée aux revues distantes, channel `review` ;
- `preview` : Routine stable/interne, channel `stable`.

## 5. Compatibilité OTA

Le sidecar classe le diff livré :
- `OTA_COMPATIBLE` ;
- `NATIVE_REBUILD_REQUIRED`.

Sont considérés natifs/sensibles au minimum :
- `package.json` ;
- `package-lock.json` ;
- `app.json` ;
- `app.config.js` ;
- `eas.json` ;
- `ios/**` ;
- `android/**` ;
- `plugins/**` ;
- `modules/**`.

Cette classification ne devient pas un état du protocole.

## 6. Isolation du flux principal

Les sidecars :
- n’émettent aucun `repository_dispatch` ;
- ne publient aucun commentaire GitHub ;
- ne modifient aucune PR ;
- n’écrivent pas dans le dépôt ;
- ne sont invoqués par aucun workflow principal V2.

À l’introduction de 0.6.46, les workflows suivants étaient inchangés :
- `kodjo-v2-lean-queue.yml` ;
- `kodjo-slice-implementation-review.yml` ;
- `kodjo-slice-finalize.yml`.

La correction bornée de l’audit ajoute au commentaire de review les identifiants techniques du run producteur. Elle ne fait pas appeler les sidecars par les workflows principaux et ne crée aucun nouvel état ou gate protocolaire. Les corrections des défauts préexistants de ces workflows sont tracées séparément dans le rapport de correction.

Une panne Expo/EAS échoue uniquement le workflow de synchronisation d’environnement concerné ; elle ne transforme pas, ne réouvre pas et n’altère pas l’état V2 déjà atteint.

## 7. Bootstrap

L’ajout d’`expo-updates` est un changement natif initial.

Une nouvelle build doit donc être installée une fois pour :
- Routine Dev, via le profil `review` ;
- Routine, via le profil `preview`.

Après ce bootstrap, les livraisons JS/TS/assets compatibles peuvent être reçues via EAS Update sans Metro.

### Livraison historique antérieure au bootstrap

Une livraison applicative exacte peut avoir été produite avant l'introduction de la configuration Routine Dev et d'`expo-updates`. Le sidecar ne doit ni la déclarer OTA-compatible à tort, ni modifier sa PR.

Dans ce seul cas, si le delta applicatif est initialement `OTA_COMPATIBLE` et si les manifests de dépendances sont identiques au contrat courant hors ajout d'`expo-updates`, le sidecar matérialise dans son workspace jetable les cinq fichiers d'environnement versionnés `app.json`, `app.config.js`, `eas.json`, `package.json` et `package-lock.json`. Il conserve séparément :

- `application_head`, identité immuable du code applicatif revu ;
- `environment_contract_head`, identité du contrat Routine Dev courant ;
- les empreintes avant/après de chaque fichier superposé.

Cette matérialisation force `NATIVE_REBUILD_REQUIRED` et une nouvelle build interne `review`. Elle ne produit jamais une OTA sur un runtime non bootstrapé, ne pousse aucun commit et ne déplace aucune branche. Toute autre dérive de dépendances est refusée au lieu d'être fusionnée implicitement.

## 8. Qualification

La qualification 0.6.46 doit démontrer :
1. identités Routine / Routine Dev exactes ;
2. projectId EAS unique et persistant ;
3. `expo-updates` présent et lockfile cohérent ;
4. sidecar Routine Dev lié à un APPROVE V2 + PR/branche/HEAD exacts ;
5. sidecar Routine stable lié à une PR fusionnée + FINAL_OUTPUT READY_TO_CLOSE exact ;
6. PR non applicative => aucune action d’environnement ;
7. changement natif => rebuild et non OTA ;
8. aucun raccord ajouté aux workflows V2 principaux ;
9. Linux et Windows protocol suites inchangées et vertes.

## 9. Décisions normatives post-audit — D1 et D2 (19 septembre 2026)

Ces deux décisions explicites de Hermann tranchent G1/G2 du rapport final d'audit. Elles ne modifient aucun autre état, transition, gate ou règle V2 héritée.

### D1 — Consommation durable par request_id (F10)

Une requête consommée ne peut être exécutée de nouveau, même par un nouveau workflow run avec attempt=1. Toute reprise légitime exige un nouveau request_id et les références causales retry/recovery/RESUME_DELTA déjà prescrites par le contrat.

Le superviseur, après vérification du préflight et avant checkout mutable/agent, crée atomiquement `refs/tags/kodjo-consumed/<request_id normalisé en minuscules>` dans le dépôt courant. Le tag annoté contient le run/attempt, le commit et le blob exacts de la queue, son chemin, source_head et la provenance de reprise. Il est relu avant de poursuivre. Le registre historique de refus par chemin/blob/request_id reste opposable. Aucun changement de main ou de la queue n'est nécessaire.

Seule une création réussie et relue autorise cette invocation ; une référence existante, une erreur API ou une réponse incertaine refuse l'exécution. Le protocole ne met jamais à jour ni ne supprime ces références. Elles font partie des preuves durables et ne doivent pas être supprimées par un nettoyage de tags. Une suppression administrative hors protocole invaliderait cette garantie. Les permissions GitHub `contents: write` du superviseur existent déjà ; Claude n'en hérite pas.

Le point de consommation précède l'exécution : une interruption après création peut donc laisser une requête consommée sans exécution réussie. Il n'existe pas de transaction atomique entre GitHub et Claude. La garantie démontrable est **au plus une autorisation d'exécuter par request_id**, et non une promesse de succès exactement une fois. La reprise se fait avec un nouvel identifiant causal, jamais en libérant l'ancien.

Les références sont créées seulement pour les consommations postérieures à l'activation de cette correction. L'historique antérieur reste soumis au registre existant ; aucune réussite historique n'est inventée ni rétroactivement certifiée.

### D2 — Portée de VISUAL_APPROVED

`[KODJO_SLICE] VISUAL_APPROVED` valide uniquement les critères de la tranche courante dont le plan approuvé exige une preuve humaine/device, notamment `VISUAL_COMPARE` et `DEVICE_CHECK`, pour le HEAD et la revue explicitement liés. Ce marqueur ne constitue jamais une validation générale du développement. Les preuves techniques, fonctionnelles, de scope et de préservation doivent déjà être satisfaites par leurs mécanismes propres ; aucune approbation humaine ne remplace une preuve technique manquante. Le format du marqueur et les gates existants sont conservés.

### Traçabilité du rapport IMPLEMENT (F12)

Le bloc final déjà exigé par N39 est encodé en JSON entre `<KODJO_IMPLEMENTATION_CONFORMANCE>` et `</KODJO_IMPLEMENTATION_CONFORMANCE>`, avec un tableau `criteria`. Chaque criterion_id du plan apparaît exactement une fois, avec les sept champs existants non vides : implementation_status, files_or_symbols, component_used, tests_run, proof_status, preserve_status, residual_status. Le marqueur final KODJO_STOP_STATUS existant est conservé.

Le runner transporte la sortie réelle et un diagnostic structurel. La revue la compare à la liste exacte du plan. Une absence, duplication, couverture incomplète, identité/hash divergent, troncature ou marqueur absent produit une preuve NON_VERIFIABLE et impose REVISE dans le contrat de revue existant ; aucun nouveau stop runtime n'est inventé. Les anciens rapports sans encodage structuré ne sont pas présentés comme vérifiés automatiquement. La complétude syntaxique n'établit pas la vérité des déclarations : la contre-vérification sémantique indépendante du plan/diff/tests demeure nécessaire.

## Décision normative du 19 septembre 2026 — INITIAL irrécupérable

Un nouvel `IMPLEMENT / INITIAL` causal est admis exclusivement après démonstration
concordante de toutes les conditions suivantes : ancienne requête déjà consommée
durablement, invocation liée exactement au run et à la requête en état
`EXTERNAL_CALL_SENT`, aucun résultat final réutilisable, aucune session Claude
récupérable, aucun paquet de recovery exploitable, aucune activité ni aucun verrou
actif ou ambigu, contexte autorisé encore compatible (plan, revue, gate, scope,
HEADs applicables). Une donnée absente, non lisible ou non liée au bon objet ne
constitue pas une preuve d'absence. Une ancienne trace sans session liée reste
non vérifiable ; il est interdit de fabriquer cette provenance rétroactivement.

Le nouveau `request_id` est différent de l'ancien, y compris après normalisation
de casse. Le reçu durable de l'ancienne requête demeure intact et opposable. La
nouvelle requête traverse ses propres préflight, autorisations et consommation
atomique avant toute exécution. Ce cas ne libère et ne rejoue jamais l'ancienne
requête ; il n'assimile jamais une issue inconnue à une exécution nulle.

Le champ distinct est :

```json
"initial_restart": {
  "code": "IRRECOVERABLE_INITIAL_RESTART",
  "source_run_id": "<run GitHub source>",
  "source_run_attempt": 1,
  "source_request_id": "<UUID de la requête source>"
}
```

`retry_of_run_id` et `retry_reason` restent exclusivement réservés à
`RESUME_DELTA`, y compris pour un INITIAL causal. `initial_restart` est interdit
pour RESUME_DELTA et VISUAL_CORRECTION. Les autres règles, limites, préservations,
revues, finalization et gates humains demeurent applicables.

Cette décision précise l'interdiction historique des versions 0.6.11, 0.6.12 et
0.6.16 selon laquelle `EXTERNAL_CALL_SENT` sans résultat bloque tout nouvel appel :
elle demeure intégralement applicable à l'ancienne requête et à tout cas non
prouvé. Seul un nouvel INITIAL satisfaisant toutes les conditions ci-dessus peut
être admis. Aucune formulation historique n'est supprimée.

### Collecte et limites d'exécution

`verify-initial-restart.js` relit le tag de consommation, son objet annoté, le blob
de queue lié au commit source, l'état du run, ses jobs et son runner ; il confronte
l'invocation et les fichiers conservés à ces identités. Les autorisations et le
HEAD courant sont relus. Deux observations concordantes sont exigées ; le
superviseur renouvelle le contrôle sous son verrou exclusif avant l'appel Claude.
Les options d'injection d'observations du module servent uniquement aux tests et
ne sont exposées ni comme entrées de workflow ni comme champs de queue.

L'implémentation courante est conservatrice : elle exige le même contexte de
queue hormis identifiant, date et lien causal. Un changement de contexte n'est pas
automatiquement déclaré compatible. Une archive GitHub présente mais non
inspectée, un stockage de session absent/non lisible, une trace ancienne sans
identité de stockage ou un inventaire incomplet provoquent un refus. Aucun de ces
refus n'est un succès E2E. L'invocation conserve désormais son identifiant de
session généré et son contexte de stockage, sans jeton ni contenu de session.

Les conversations locales Claude sont conservées sous le répertoire `projects`
du répertoire de configuration ; la recherche reste en lecture seule et refuse
les liens, données illisibles ou scans incomplets. Référence de stockage :
[documentation Claude Code — sessions](https://code.claude.com/docs/en/how-claude-code-works#work-with-sessions).

### Tests obligatoires

Refus si résultat/session/recovery disponible ou ambigu ; activité ou verrou
présent/ambigu ; même request_id ; causalité erronée ; HEAD/plan/revue/gate/scope
incompatible ; consommation manquante ; blob non lié au commit ; source active ;
archive non inspectée ; changement entre observations. Admission uniquement avec
preuves concordantes et nouveau request_id. Les tests UNIT/INTEGRATION avec
observations injectées ne prouvent pas une invocation Claude réelle.

### Qualification jetable : consommation et identité avant l'appel externe

La garantie D1 s'applique aussi aux appels du harnais jetable. Le superviseur
consomme le nouveau `request_id` sous son verrou d'exécution, avant
`EXTERNAL_CALL_SENT`, dans le même espace atomique `kodjo-consumed/<request_id>`
que la Lean Queue. Une erreur de création, de relecture ou de conservation du
reçu refuse l'appel ; aucun reçu créé n'est libéré, même après un échec.

Le reçu `kodjo.disposable-consumption.v1` contient la requête locale complète,
son empreinte Git blob calculée sur sa sérialisation JSON, le commit qualifié,
le run/tentative et la session prévue. `queue_path: null` et
`evidence_kind: DISPOSABLE_LOCAL_REQUEST` distinguent explicitement cette preuve
d'une admission Lean Queue : la requête locale n'est pas présentée comme un
fichier de queue commité. Ce reçu seul ne peut autoriser une reprise INITIAL
causale de production, dont les preuves de contexte restent requises.

La requête/session et le reçu sont écrits et synchronisés sur disque dans le
répertoire du run et dans les preuves du harnais avant l'appel. Le jeton GitHub
reste dans le superviseur et n'est pas transmis au processus Claude. Le mode
`PreflightOnly` ne consomme aucune requête et n'appelle pas Claude.

Chaque `RESUME_DELTA` jetable possède un nouveau `request_id` et transmet le
run source exact, avec `retry_reason.code: CONTROLLED_INTERRUPTION_AFTER_RECOVERY`
uniquement lorsque les preuves existantes d'interruption et de recovery sont
validées. Cette causalité ne remplace aucun gate de recovery ou de HEAD.

Un appel Claude réel dans ce harnais ne démontre pas à lui seul les étapes
Lean Queue, livraison GitHub, PR, revue indépendante ou finalization.

La qualification jetable conserve l'interdiction de publier du code ou une PR.
Pour appliquer D1, son job d'exécution reçoit `contents: write` exclusivement
pour le registre de consommation ; les permissions globales restent en lecture.
Cette écriture de preuve déclarée remplace l'ancienne affirmation de lecture
seule absolue du harnais, sans ouvrir un second chemin de livraison. Le scanner
borne cette déclaration aux jobs d'exécution nommés des deux workflows jetables
et continue de refuser les autres permissions et opérations de publication.
