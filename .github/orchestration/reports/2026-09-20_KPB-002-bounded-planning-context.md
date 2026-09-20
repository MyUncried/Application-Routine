# KPB-002 — Contexte de planification borné et transport API observable

## Mission et départ

Correctif protocolaire distinct demandé par Hermann le 20 septembre 2026.
Dépôt MyUncried/Application-Routine, main `49052ddc8cc2f05d710d1d6498e06cf3d67bc0b8`.
Branche de livraison : `kodjo/kpb-002-bounded-planning-context`.
Application inchangée : PR181, HEAD `e43004df9f04a10aa091ba28cc681592bea759ca`.

## Diagnostic et limites de preuve

CAUSE_PROBABLE_HAUTE_CONFIANCE : saturation TPM par contexte cumulatif non borné.
Le run 35504379357 échoue avant génération (HTTP429), deux tentatives. Le code exact
n'a pas été archivé par l'ancien curl. Il n'est pas reconstruit ni présenté comme connu.
Les limites et dépenses du projet ont été vérifiées par l'utilisateur : 500000 TPM,
500 RPM, 5000000 TPD, crédit restant 3,69 $, dépense 1,30 $ / 100 $, consommation
journalière 2755648 tokens, pic minute 484542. Ce sont des observations datées,
non une promesse de disponibilité future. Le défaut d'injection de tous les commentaires
est confirmé dans les deux workflows de planification.

## Correction

- Un sélecteur commun choisit commande courante, plan de base retenu, dernière revue
  indépendante de CE plan, checkpoint ciblé lié au HEAD/PR et preuve humaine correspondante.
  Une commande de reprise peut référencer une seule commande antérieure explicitement liée.
  Les IDs explicites base_plan_comment_id/base_review_comment_id évitent de repartir du plan
  historique. En absence de candidat, le couple approuvé versionné reste la base.
- Vérification déterministe auteur, Issue, tranche, HEAD/PR, lien revue-plan, absence
  de doublons et fraîcheur de la revue sélectionnée. Aucune troncature silencieuse.
  Les commentaires non sélectionnés ne sont pas transmis. Leur récupération GitHub
  sert uniquement à la sélection déterministe, pas à la génération.
- Toutes les sources produit déclarées restent intégrales. Paquet borné à 1,5 Mo,
  cinq commentaires sélectionnés au plus (300 ko ensemble, 120 ko par commentaire).
  Manifeste : IDs, rôles, empreintes SHA256, tailles, HEAD.
- Avant CHAQUE appel (draft, closure, initial decisions), comptage local déterministe
  de la requête JSON complète, schéma inclus, avec js-tiktoken 1.0.21/o200k_base verrouillé.
  C'est une estimation locale, pas le décompte serveur exact de gpt-5.6-luna.
  Réservation = ceil(tokens locaux × 1,25) + 4096 + max_output_tokens.
  Budget opérationnel 350000, soit 30 % sous les 500000 TPM observés, en plus de la
  majoration locale. Limite brute 2 Mo avant tokenisation. Dépassement : PROMPT_TOO_LARGE,
  diagnostic archivé, zéro appel modèle. Pas de remplacement du modèle.
- Les appels successifs d'un run partagent un registre de réservations sur 60 secondes.
  Les deux workflows partagent une concurrence GitHub commune. Les autres clients du
  projet peuvent néanmoins consommer le débit : le contrôle local ne garantit pas
  l'absence de tout 429.
- Transport commun : HTTP, error.type/code, Retry-After, x-request-id et en-têtes rate-limit
  autorisés sont archivés même sur échec, sans Authorization, clé, corps brut ni message
  arbitraire susceptible d'exposer des données. Le corps JSON est analysé avant décision.
- Quota, crédit/facturation, plafond de dépense/usage, limite quotidienne et taille
  sont non rejouables. 429 inconnu et issue réseau ambiguë ne sont pas rejoués.
  Erreurs explicitement temporaires : au plus trois appels au total, backoff exponentiel
  et jitter, respect du délai serveur minimum et des resets. Au-delà de 120 s :
  RETRY_DEFERRED, jamais raccourcissement du délai. Épuisement : RETRY_EXHAUSTED.
  Un rerun GitHub aveugle (run_attempt > 1) est refusé avant appel ; reprise par nouvelle
  commande après diagnostic. Aucun workflow ne lance automatiquement un autre run.
- Commande courante conservée dans la fermeture finale ; récit français demandé.
- Dépendances isolées sous scripts/kodjo/openai-runtime ; aucun package applicatif changé.

## Invariants préservés et hors périmètre

KPB-001 (schéma partagé et validateurs déterministes) inchangé. Preuves delta conservées,
conformité globale et autorisations fusion/clôture restent fausses. Aucun changement
applicatif, produit, Figma, queue, machine d'états ou règle d'approbation. Le correctif ne
supprime aucune source normative pour faire rentrer artificiellement le prompt.
Le classement des chemins lors des transitions protocole reste inchangé ; une reprise
après intégration sera liée au nouveau main, avec références explicites à la commande,
au plan et à la revue précédents et vérification des sources protégées.

## Vérifications

Rejeu local sur sources produit GitHub au HEAD exact : 16 sources conservées,
paquet 912613 octets, plan5749116249, revue5749145345, checkpoint5749099214,
preuve5749098109, commande5749154649. Requête structurée (hors court préambule workflow)
233029 tokens locaux ; réservation315383, sous budget350000.
Le préflight réel recalculera la requête complète avec son préambule.
Tests positifs/négatifs : historique arbitrairement long, sélection/authenticité/liens,
revue obsolète, doublons, conservation ciblée, bornes octets/tokens sans appel,
classification crédit/quota/plafonds/taille, headers et secrets, 429→succès, 503 borné,
délais serveur longs, JSON invalide, transport ambigu, pacing, refus rerun et câblage YAML.
Tests locaux ciblés : 114 tests, 113 réussis, 1 skip existant, zéro échec.
Syntaxe indépendante : 62 workflows acceptés ; invariants workflow validés.
Qualification complète Linux ET Windows requise sur le commit publié avant intégration
et avant reprise de la planification. Résultats distants/commit final consignés dans la PR.
Aucun contrôle sur appareil réel applicable à ce correctif ; ceux du plan CAT restent requis.

## Fichiers et état Git

Scripts build-planning-context.js et openai-plan-request.js ; package/lock isolés ;
workflows initial-plan, slice-plan et pilot-tests ; test planning-api-budget.pilot.js, adaptation du contrôle inventaire dans v2-planning-entry.pilot.js ; ce rapport.
Commit final : commit de livraison portant ce rapport, identifié dans la PR et sa preuve CI.
État au rapport : modifications protocole isolées, application non modifiée.

## Références de conception

https://developers.openai.com/api/docs/guides/rate-limits
https://developers.openai.com/api/docs/guides/error-codes
https://developers.openai.com/api/docs/guides/token-counting

Documentation consultée : les compteurs locaux ne comprennent pas exactement toute la
structure serveur ; la marge est explicite. Retry-After ne rend pas rejouable une erreur
financière. Aucun assouplissement des contrats pour contourner un refus.
