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
