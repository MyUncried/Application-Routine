# KODJO V2 — rapport de changement 0.6.12 → 0.6.16

Origine : audit indépendant du 2026-09-10, revue de ChatGPT Protocole, réserves de la revue du lot 1.

| Constat | Correction |
|---|---|
| `KV2-01` | Clé d'amorce omise lorsque la file ne la porte pas ; `retry_of_run_id` transmis ; garde de type conservée intacte |
| `KV2-02` | `git status --porcelain=v2 -z` ; origine et destination d'un renommage contrôlées séparément ; publication bornée en pathspec littéral |
| `KV2-03` | Paquet transportable — patch binaire borné, manifeste hashé — téléversé ; reprise possible après disparition du disque |
| `KV2-04` | Écriture atomique, empreinte de charge utile, lecture défensive candidat par candidat |
| `KV2-05` | `source_head` devient clé de sélection du paquet |
| `KV2-06` | Conservation avant le contrôle d'intégrité ; `integrity_status` ; paquet `REFS_MUTATED` conservé mais jamais restauré |
| `KV2-07` | Périmètre revérifié après les contrôles, sur empreinte de contenu |
| `KV2-08` | Amorce consommée seulement après production d'un paquet exploitable |
| `KV2-09` | Retrait du jeton dans un `finally` ; motif `extraheader` ajouté au scanner |
| `KV2-10` | Admission : ajout seul, `request_id` unique, relance refusée, reprise déclarée |
| `KV2-11` | Section normative `PARCOURS-LEAN` ; requalification de `contents: read` |
| `KV2-12` | 56 tests ajoutés ; banc exerçant le vrai parcours PowerShell |
| `KV2-13` | `limits_effective` et hash calculé dessus |
| `KV2-14` | Verdict requalifié `NO_UNDECLARED_REMOTE_WRITE_CAPABILITY` |
| `KV2-15` | `lstatSync` à la capture et à la restauration |
| `KV2-19` | `npm ci` après la bascule ; empreinte du verrou consignée ; mutation du dépôt refusée |
| `KV2-22` | `verify-authorizations.js` ; trois niveaux nommés ; `evidence_kind` obligatoire |
| `KV2-23` | Contrat exécutable unique ; schéma projeté et comparé ; propriétés inconnues refusées |
| `KV2-24` | `slice-bootstrap.schema.json` réparé et analysable |

Réserves de la revue du lot 1 : chemins strictement littéraux, détection des modifications et suppressions produites par un contrôle, vérification de l'index final, refus d'une mutation du dépôt causée par `npm ci`.

Demandes historiques : les six demandes de `V2-BILAT-01` sont **conservées inchangées**, marquées `consumed.status = OBSOLETE_NON_REPLAYABLE`, et définitivement non rejouables.

Restent hors périmètre : `KV2-16`, `KV2-17`, `KV2-18` partiellement, `KV2-20`, `KV2-21`.


## Révision après revue `CHANGES_REQUIRED` du 2026-09-11

| # | Demande | Traitement |
|---|---|---|
| 1 | Restaurer les six demandes historiques à l'octet près | Fichiers restaurés, six blob OID conformes au manifeste du HEAD. Obsolescence enregistrée dans `queue/v2-consumed-registry.json`, liée au chemin **et** au blob OID. L'anti-rejeu refuse par l'un ou l'autre. Le marqueur `consumed` est retiré du contrat : un seul mécanisme. |
| 2 | Vérification du 👍 obligatoire en production | `KODJO_VERIFY_GITHUB: '1'` posé par le workflow. Sans client injecté ni variable, l'admission échoue en `GITHUB_VERIFICATION_REQUIRED`. Réaction absente, illisible ou d'un autre compte : refus. |
| 3 | Identité GitHub autorisée obligatoire | `user_login` devient obligatoire et doit désigner le propriétaire du dépôt. Un 👍 d'un autre compte est refusé, et le nom du poseur est rapporté. La revue indépendante est vérifiée par son fichier et ses empreintes Git. |
| 4 | Index incomplet | `KODJO_QUEUE_STAGED_INCOMPLETE` : un chemin autorisé absent de l'index fait désormais échouer la publication. Test adverse ajouté. |
| 5 | Spécification `0.6.16` | Version courante corrigée. Huit formulations supersédées explicitement : interdiction générale d'écriture distante, activation liée au writer de preuves, limite de trois workflows. Chaque supersession nomme sa portée et renvoie au §PARCOURS-LEAN. |
| 6 | Preuve de revue réellement contrôlée | Première rédaction : contrôle via un commentaire GitHub. **Révisée** : la revue est prouvée par le fichier `independent-review.md` et son empreinte Git exacte, sans système de preuve supplémentaire. |

La limite `REVIEW_ACTOR_INDEPENDENCE_NOT_GUARANTEED` demeure : le contrôle établit que le reviewer est habilité, non qu'il est une autre personne.


## Seconde révision après revue `CHANGES_REQUIRED`

Le point 5 de la revue écarte le contrôle de la revue par commentaire GitHub, introduit à tort : le dépôt contient déjà la preuve. `independent_review` devient `{ review_path, review_blob_oid, reviewed_plan_blob_oid, verdict, evidence_kind }`, et `reviewer_login` est retiré.

Cinq contrôles, tous purement Git :

1. `review_blob_oid` est bien formé ;
2. le fichier existe au commit d'approbation du plan **avec exactement cette empreinte** ;
3. son contenu porte le verdict annoncé ;
4. son contenu nomme le plan approuvé ;
5. lorsqu'il déclare la révision du plan examinée, cette révision porte bien le plan exécuté — `REVIEW_PLAN_REVISION_MISMATCH` sinon.

La vérification GitHub reste obligatoire pour la seule validation métier, qui n'est pas un artefact du dépôt.
