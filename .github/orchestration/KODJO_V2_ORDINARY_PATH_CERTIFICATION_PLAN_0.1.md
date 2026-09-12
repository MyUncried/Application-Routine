# Campagne KODJO V2 — certification du parcours ordinaire 0.1

Statut : **PRÉPARATION — AUCUNE EXÉCUTION AUTORISÉE PAR CE DOCUMENT**  
Base : `e8df643fd9b556452fcd54ef2762aeee04990611`  
Tranche prévue : `V2-PROD-00`

## 1. Objet et frontière de preuve

La certification déjà clôturée démontre le parcours jetable INITIAL → interruption contrôlée → restauration → `RESUME_DELTA`. Elle ne démontre pas le parcours ordinaire de la file jusqu'à la création d'une pull request.

Cette campagne exerce le chemin réel :

`queue/v2` → admission → vérification GitHub du 👍 → checkout Windows → `npm ci` → Claude → conservation → contrôles → index borné → commit → push → PR.

Les branches et PR de campagne sont réelles, temporaires, jamais fusionnées, puis fermées et supprimées. Aucun scénario n'autorise une modification fonctionnelle de `main`.

## 2. Décisions humaines requises

Avant le premier run :

1. activation unique de `V2-PROD-00` ;
2. issue réelle portant le plan, sa revue indépendante et le commentaire soumis au 👍 ;
3. 👍 réel de l'utilisateur, vérifié par l'API GitHub ;
4. autorisation explicite de créer puis supprimer les branches et PR jetables ;
5. interdiction de fusion confirmée.

Une IA ou un automatisme ne peut pas produire le 👍 au nom de l'utilisateur.

## 3. Périmètre jetable visible par les contrôles

Les fixtures `tests/fixtures/qualif*/` ne conviennent pas : elles sont hors Jest, TypeScript et lint. La campagne utilise des fichiers de test autonomes sous `tests/kodjo-prod-qualif/`, sans import de `src/**` ni `app/**`.

Avant activation, un préflight doit démontrer que :

- Jest collecte un `*.test.ts` de ce répertoire ;
- TypeScript le type-vérifie ;
- lint le parcourt ;
- aucun fichier n'est importé par l'application ;
- aucun artefact de ce répertoire n'entre dans un build applicatif.

## 4. Niveaux de preuve

Tous les refus ne doivent pas être provoqués en production.

| Niveau | Usage | Exemples |
|---|---|---|
| Parcours réel | comportement sûr et déterministe | nominal, contrôle rouge, admission refusée, reprise par artefact |
| Qualification jetable | interruption ou dérive contrôlée | interruption après conservation, dérive créée par un contrôle |
| Test déterministe | corruption ou mutation dangereuse | patch partiel, mutation de refs, altération d'index entre ajout et vérification |

Critère général : chaque invariant possède une preuve positive et une preuve négative au niveau le plus réaliste compatible avec une provocation sûre et déterministe.

## 5. Première vague — cœur du parcours

### C1 — nominal jusqu'à la PR

- demande INITIAL admise par la file réelle ;
- un fichier de test autonome et vert est produit ;
- une seule invocation Claude ;
- suite complète verte ;
- index égal au pathspec autorisé ;
- commit, branche distante et PR uniques ;
- PR jamais fusionnée, puis fermée et branche supprimée.

### C2 — contrôle rouge, aucune publication

- le delta produit un test Jest réellement collecté et rouge ;
- paquet de reprise écrit avant les contrôles ;
- verdict `IMPLEMENTED_WITH_FAILED_CHECKS` ;
- `publishable_paths` vide et pathspec de publication absent ;
- aucune branche **distante** et aucune PR ; la branche locale temporaire peut exister dans le checkout du run ;
- delta récupérable depuis l'artefact.

### C3 — reprise de production par `retry_of_run_id`

- nouvelle demande `RESUME_DELTA`, nouveau `request_id`, `retry_of_run_id` lié à C2 ;
- téléchargement du paquet C2 par le workflow réel ;
- restauration exacte du delta et même `session_id` ;
- exactement une invocation Claude dans le run C3, avec `--resume <session_id>` ;
- aucune nouvelle session et aucune seconde invocation dans C3 ;
- empreinte du patch restauré égale à celle du paquet source avant correction complémentaire ;
- PR créée uniquement si le delta final et tous les contrôles sont verts.

L'interruption après conservation est un scénario distinct C4. Elle ne doit pas être simulée par une annulation pendant Claude : le paquet n'est écrit qu'après le retour de l'invocation.

### C4 — interruption contrôlée sur le chemin ordinaire

Le point d'arrêt `KODJO_CERTIFICATION_STOP_AFTER_RECOVERY`, inactif par défaut, intervient immédiatement après l'écriture atomique du paquet et avant les contrôles. Le code ne l'honore que dans GitHub Actions, en file supervisée, pour la tranche exacte `V2-PROD-00`, et produit alors le statut `CONTROLLED_INTERRUPTION_AFTER_RECOVERY` avec une sortie 75. Le run suivant reprend par `retry_of_run_id` selon les mêmes oracles que C3.

## 6. Deuxième vague — formes de delta

| Scénario | Formes regroupées | Oracles principaux |
|---|---|---|
| D1 | création, modification, suppression, renommage | patch applicable ; origine et destination du renommage contrôlées ; index exact |
| D2 | nom non-ASCII, CRLF, binaire | chemin verbatim ; absence de fausse dérive ; restauration octet à octet |
| D3 | plus de dix fichiers | pathspec NUL ; aucune troncature ; index égal à la liste autorisée |

Chaque scénario produit au plus une branche distante et une PR, jamais fusionnée.

## 7. Refus d'admission et de sécurité

| Scénario | Provocation | Résultat attendu | Niveau |
|---|---|---|---|
| R1 | `request_id` dupliqué | `KODJO_QUEUE_REQUEST_ID_DUPLICATE` avant mutation et avant Claude | parcours réel |
| R2 | 👍 absent | refus GitHub nommé avant mutation et avant Claude | parcours réel |
| R3 | relance du même run | refus de relance avant Claude | parcours réel |
| R4 | fichier hors périmètre créé de façon déterministe pendant un contrôle | delta initial conservé ; dérive/post-scope refusée ; aucune publication | qualification jetable |
| R5 | contenu pré-indexé hors périmètre avant publication | `git reset` le retire ; il n'apparaît ni dans l'index final ni dans le commit | intégration déterministe |
| R6 | altération de l'index après l'ajout borné | `KODJO_QUEUE_STAGED_SCOPE_REFUSED` | test déterministe uniquement |

R5 corrige l'ancien oracle : un contenu pré-indexé ne doit pas nécessairement faire échouer la publication, car le `git reset` est précisément destiné à le neutraliser.

## 8. Décompte prévisionnel

Le plan contient **13 scénarios** : C1 à C4, D1 à D3 et R1 à R6. Ce n'est pas le nombre de runs.

Le décompte réel sera publié avant exécution et après campagne, avec quatre colonnes distinctes : scénarios, runs/tentatives GitHub, invocations Claude, branches/PR. C3 et C4 nécessitent chacun un run source et un run de reprise ; R1 à R3 ne doivent invoquer aucune IA.

## 9. Mesures obligatoires

Sans modifier les verdicts :

- durée checkout, `npm ci`, Claude et chaque contrôle ;
- empreinte `package-lock.json`, versions Node/npm/Jest ;
- nombre de checkouts `_kodjo/`, espace libre du volume et taille du checkout courant avant nettoyage ;
- état courant du cache, sans activer encore un nouveau cache ;
- identité run/tentative/request/session/source ;
- chemins ciblés qui auraient été sélectionnés, uniquement lorsqu'une carte déterministe aura été définie.

Les mesures antérieures à `run-local-claude.js` vivent dans l'artefact séparé `kodjo-v2-infrastructure-<run_id>-<attempt>`, qui contient le fichier `kodjo-v2-infrastructure-<run_id>-<attempt>.json`.

## 10. Critères de sortie

La certification du parcours ordinaire est acquise si :

1. C1, C2 et C3 sont PASS selon leurs oracles ;
2. C4 est démontré séparément sans annulation aveugle pendant Claude ;
3. D1 à D3 et R1 à R6 possèdent leurs preuves au niveau défini ;
4. aucune PR de campagne n'est fusionnée ;
5. toutes les branches temporaires sont supprimées ;
6. le verrou est absent et chaque checkout est supprimé ou diagnostiqué ;
7. le registre canonique et le backlog sont mis à jour avec les identifiants réels.

La sélection ciblée n'est pas activée par cette campagne. Tant que la suite complète reste obligatoire, une passe ciblée constitue uniquement un fail-fast et peut rallonger les runs verts.

## 11. Séquence d'autorisation

1. préparer et qualifier les corrections protocolaires ;
2. revue indépendante du présent plan ;
3. validation humaine et fusion séparée des corrections ;
4. création de l'issue et du commentaire de gate ;
5. 👍 utilisateur ;
6. lancement de C1, puis C2, puis C3 ;
7. décision explicite avant C4 et la seconde vague.
