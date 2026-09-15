# KODJO Protocol V2 — Addendum 0.6.28 — correction visuelle sur PR existante

Date : 2026-09-15

Cet addendum complète le protocole V2 sans modifier les règles fonctionnelles de l’application. Il définit le chemin canonique de reprise d’une correction visuelle bornée après livraison applicative et avant fusion utilisateur.

## 1. Objet

Une correction visuelle constatée après une livraison certifiée ne doit pas :

- repasser par une révision de plan lorsque le constat reste dans le périmètre déjà approuvé ;
- créer une nouvelle PR applicative ;
- rejouer le paquet historique déjà matérialisé dans la PR existante ;
- utiliser un workflow ad hoc contournant les protections de staging, de CRLF, de scope ou de contrôles ;
- fusionner automatiquement la PR après livraison.

Elle est représentée dans Lean Queue par :

- `mode=RESUME_DELTA` ;
- `operation_kind=VISUAL_CORRECTION` ;
- `retry_reason.code=VISUAL_CORRECTION` ;
- une `delivery_target` de type `EXISTING_PR` ;
- un `delivery_checkpoint` certifié et relu sur GitHub avant Claude.

## 2. Références immuables distinctes

La reprise porte simultanément deux HEAD qui ne sont jamais confondus :

1. `source_head` de la demande Lean = HEAD protocolaire autorisant l’exécution ;
2. `delivery_target.application_head` = HEAD applicatif exact de la PR existante à corriger.

Le superviseur local exécute la correction sur le second tout en conservant le premier dans la traçabilité, les autorisations et le checkpoint produit.

Toute discordance entre le checkpoint, la cible applicative, la PR réellement ouverte, sa branche ou son HEAD bloque avant Claude ou avant toute publication.

## 3. Checkpoint de livraison opposable

Pour `VISUAL_CORRECTION`, `delivery_checkpoint` est obligatoire. Il doit désigner un commentaire `[KODJO_V2] APPLICATION_CHECKPOINT` certifié sur l’Issue de la tranche et porter au minimum :

- tranche ;
- PR applicative ;
- HEAD applicatif ;
- HEAD protocolaire ;
- run et artefact du paquet livré ;
- attestation de migration ;
- `delivery_head` identique au HEAD applicatif certifié.

Le commentaire est relu sur GitHub lors de l’admission. Une structure locale cohérente sans commentaire GitHub concordant ne vaut pas preuve.

## 4. Reprise sans rejeu du paquet historique

Le paquet historique référencé par le checkpoint a déjà été matérialisé dans `application_head`. Le restaurer à nouveau sur ce même HEAD dupliquerait un delta déjà livré.

Le protocole matérialise donc une baseline de reprise vide, liée à :

- la tranche ;
- la session Claude ;
- la baseline ;
- le HEAD applicatif ;
- le `request_id`.

Cette baseline vide est protégée par l’intégrité du mécanisme de recovery existant. Elle signifie « aucun fichier historique à restaurer », pas « aucune preuve exigée ».

## 5. Runtime protocolaire indépendant du checkout applicatif

Le HEAD applicatif peut précéder le HEAD protocolaire qui introduit la correction de procédure. Avant toute bascule vers la PR applicative, le superviseur fige le runtime `scripts/kodjo` sous `${RUNNER_TEMP}`.

Après la bascule, toutes les opérations du protocole sont exécutées depuis cette copie immuable. Le contenu du dossier `scripts/kodjo` présent dans la PR applicative n’est jamais utilisé comme autorité protocolaire pour ce run.

## 6. Livraison sur la PR existante

Avant Claude, le superviseur vérifie via GitHub :

- PR ouverte ;
- base `main` ;
- branche exacte ;
- HEAD exact identique à `delivery_target.application_head`.

Après contrôles verts :

- le delta est stagé avec `core.autocrlf=false` ;
- le scope réel de l’index est vérifié ;
- `git diff --cached --check` est exécuté avec `core.whitespace=cr-at-eol` ;
- le commit est créé ;
- le push est un fast-forward non forcé vers la branche de la PR existante ;
- la PR est relue et doit rester ouverte avec le nouveau HEAD effectivement observé.

Aucun `--force`, aucune nouvelle PR et aucune fusion ne sont autorisés par ce chemin.

## 7. Contrôles

La correction utilise les contrôles canoniques déclarés dans la demande Lean (`jest`, `typescript`, `lint`) via le runner KODJO existant. Un workflow ad hoc ne peut pas substituer un lint global ou une commande non gouvernée aux contrôles canoniques.

Les règles de conservation d’octets et de CRLF déjà qualifiées restent obligatoires ; elles ne sont pas réimplémentées dans une voie parallèle.

## 8. Nouveau checkpoint après livraison

Après le push et après téléversement du paquet de récupération du run courant, Lean Queue publie automatiquement un nouveau `[KODJO_V2] APPLICATION_CHECKPOINT` lié :

- au nouveau HEAD applicatif ;
- à la même PR existante ;
- au HEAD protocolaire ;
- au nouvel artefact de récupération ;
- au plan, à la revue et au gate utilisateur déjà autorisés ;
- au checkpoint précédent.

Ce nouveau checkpoint devient l’unique référence d’une éventuelle correction visuelle suivante.

## 9. Gate utilisateur et fusion

La livraison se termine avec la PR ouverte. La revue visuelle humaine est obligatoire. Le protocole ne fusionne jamais automatiquement une `VISUAL_CORRECTION`.

La fusion n’est permise qu’après validation explicite du HEAD exact par l’utilisateur.

## 10. Qualification minimale avant activation

L’activation de cette route exige au minimum :

- admission positive `RESUME_DELTA + VISUAL_CORRECTION + EXISTING_PR + checkpoint` ;
- refus d’un mode INITIAL, checkpoint absent/incohérent, PR/branche/HEAD discordants et retry reason non visuel ;
- preuve que le paquet historique n’est pas rejoué ;
- preuve que le runtime protocolaire survit à la bascule sur un HEAD applicatif plus ancien ;
- preuve de staging exact et contrôle CRLF ;
- push non forcé vers la PR existante ;
- nouveau checkpoint après artefact de récupération ;
- absence de fusion automatique.
