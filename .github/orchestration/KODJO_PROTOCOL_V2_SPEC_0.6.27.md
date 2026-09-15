# KODJO V2 — Addendum 0.6.27 : admission à trois références Git

## Objet

L'admission d'une reprise d'un paquet applicatif distingue trois références immuables :

- `source_head` de la demande : état protocolaire et documentaire autorisé ;
- `planning_application_head` du bootstrap : code applicatif effectivement analysé par le plan ;
- `source_head` de l'attestation : origine du paquet restauré.

Ces références peuvent être différentes. Elles ne sont jamais substituables.

## Règle exécutable

Pour tout plan portant `KODJO_PLAN_IMPACT_JSON`, avant Claude :

1. `planning_application_head` existe et est un SHA Git complet ;
2. il est strictement égal à `scan_revision` de la matrice d'impact approuvée ;
3. le replay du scan est exécuté à ce HEAD applicatif, et non au `source_head` protocolaire ;
4. en `RESUME_DELTA`, il est strictement égal à `application_pr_head` de l'attestation de migration ;
5. toute absence, divergence ou révision illisible produit un refus avant Claude.

Le rôle existant de `source_head` reste inchangé pour l'ascendance du plan, la présence de l'attestation et la certification des changements intermédiaires. Le correctif n'ajoute aucune liste blanche, aucun chemin documentaire général, aucune revue supplémentaire et aucun appel réseau ou IA.

## Diagnostics

- `PLAN_APPLICATION_HEAD_INVALID`
- `PLAN_APPLICATION_HEAD_MISMATCH`
- `RECOVERY_MIGRATION_APPLICATION_HEAD_MISMATCH`
- diagnostics existants du replay, dont `PLAN_SCAN_PATH_INVALID`

## Non-régression obligatoire

T-107 couvre la famille exacte du run `34943819818`, une matrice synthétique à trois HEAD, les divergences du bootstrap, du plan et de l'attestation, puis une admission prospective construite en mémoire depuis la demande consommée. Cette preuve ne publie aucune nouvelle demande et n'invoque jamais Claude.

