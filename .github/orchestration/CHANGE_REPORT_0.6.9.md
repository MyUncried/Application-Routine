# Rapport de changement — KODJO V2 `0.6.8` → `0.6.9`

## Objet

Implémentation ciblée du writer de preuves défini au §4.5, sans intégrer d'adaptateur IA ni activer V2.

## Ajouts

- job `evidence_writer` dans `kodjo-v2-transition.yml` ;
- branche de destination codée en dur : `kodjo/protocol-evidence-v2` ;
- checkout de contrôle et arbre de preuves physiquement séparés ;
- validation stricte de `EvidenceDepositRequest` ;
- allowlist de six objets protocolaires ;
- contrôle des hash avant copie ;
- refus des chemins existants, modifications et suppressions ;
- push explicite vers la seule référence de preuves ;
- reçu de dépôt ;
- six tests dédiés, dont branche fonctionnelle, remplacement, fichier applicatif, hash faux et push paramétrable.

## Vérifications locales

- 63 tests sur 63 réussis ;
- trois workflows parsés et validés ;
- scanner : `NO_REMOTE_FUNCTIONAL_WRITE_CAPABILITY`, l'exception writer étant limitée à quatre lignes exactes du seul workflow de transition ;
- aucune modification du workflow fonctionnel KODJO ni intégration d'un adaptateur Claude.

## Reste à qualifier sur GitHub

1. dépôt réel sur la branche fixe ;
2. second dépôt sur le même chemin refusé ;
3. règles du dépôt interdisant au principal writer toute écriture sur les branches fonctionnelles ;
4. récupération et recalcul des hash depuis un clone vierge de la branche de preuves.

Jusqu'à ces preuves, le diagnostic normatif `EVIDENCE_WRITER_ABSENT` reste actif au sens « aucun writer qualifié disponible » et V2 n'est pas activable.
