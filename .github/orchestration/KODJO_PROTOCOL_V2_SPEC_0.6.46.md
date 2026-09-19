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
- commentaire existant `[KODJO_SLICE] IMPLEMENTATION_REVIEW_OUTPUT` ;
- `verdict=APPROVE` ;
- `STATUT : IMPLEMENTATION_REVIEW_APPROVED` ;
- source `IMPLEMENTATION_OUTPUT` V2 Lean Queue ;
- PR applicative ouverte sur `main` ;
- branche et HEAD toujours exacts.

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

Les workflows suivants restent inchangés par 0.6.46 :
- `kodjo-v2-lean-queue.yml` ;
- `kodjo-slice-implementation-review.yml` ;
- `kodjo-slice-finalize.yml`.

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
