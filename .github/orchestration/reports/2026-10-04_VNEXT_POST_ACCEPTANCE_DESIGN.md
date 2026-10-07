# VNext — conception de la révision après recette et qualification par scénario

Périmètre : étapes techniques 1 à 5 autorisées le 4 octobre 2026, PR #269. Aucun appel réel supplémentaire aux modèles, aucune recette utilisateur fabriquée, aucune intervention PRE-2/V2, aucune promotion ni activation dans ce lot.

## Point de départ contrôlé

Sur cbdae163, pilotes Linux/Windows, drivers Linux/Windows, historique Linux/Windows et couverture historique ont réussi. Le job de contrats Windows 111425636031 (run 37198661771) a atteint la limite globale de 15 minutes : démarrage 11:25:01 UTC, annulation 11:40:08 UTC, contrats commencés à 11:25:52 UTC. La validation native de l'arbre a réussi auparavant. Aucun verdict complet des contrats Windows n'est disponible. Le nouveau lot porte cette limite à 40 minutes, comme l'historique ; il ne change aucun timeout d'appel Claude ni contrôle. La consommation CPU/mémoire n'est pas établie et n'est pas invoquée comme cause.

## Décisions dérivées

1. Ajouter une origine `ACCEPTANCE_GAPS` au mode REVISION existant. Ne pas convertir l'ancienne revue APPROVE en REVISE, ni transformer un écart utilisateur en finding Claude.
2. Accepter une baseline de livraison avant clôture uniquement avec une revue d'implémentation technique APPROVE authentifiée, des preuves techniques PASS et les seules preuves appareil différables en attente. Cette baseline n'est pas READY_TO_CLOSE et ne vaut pas validation utilisateur.
3. Le propriétaire publie une décision structurée `AUTHORIZE_REVISION` liée au slice, au HEAD livré, à la revue d'implémentation et aux hashes du plan et de la revue de plan d'origine. Chaque écart a un identifiant, un critère existant, une description, des références de preuve et des chemins d'écriture explicitement autorisés. Un commentaire tiers, une livraison différente, des doublons et une autorisation périmée sont refusés.
4. Relier chaque écart à une exigence active de correction provenant de cette source DECISION. Toutes les modifications doivent relever de ces exigences et de leurs chemins autorisés. Les références de l'ancienne livraison ne deviennent jamais un droit d'écriture.
5. Conserver tous les critères non remplacés, refaire leurs preuves pertinentes et refuser toute régression. Les remplacements doivent concerner les critères réellement visés par les écarts. Les statuts NOT_EXECUTED et dérogations historiques ne sont pas transformés en PASS.
6. Demander à la nouvelle revue indépendante des `acceptance_resolutions` distinctes des `finding_resolutions`. APPROVE exige la couverture complète des écarts et leur résolution observée. Aucun schéma, assembleur ou prompt ne doit demander un bloc machine dans une narration.
7. Construire un outcome spécifique lié à la baseline, aux deux revues exactes, au plan corrigé, aux liaisons écarts/exigences et au registre cumulatif. Garder count=1/limit=1 pour la reprise bornée de qualification ; admission fraîche, propriétaire, gate exact, UUID explicite et consommation existants restent obligatoires.
8. Réutiliser publication/récupération existantes : réponse brute avant validation, reprise à partir des octets conservés, réservation GitHub réconciliée, aucune identité ou publication supplémentaire implicite.

## Qualification et limites opposables

Les scénarios sont distincts : INITIAL, REVISION_APRES_REVIEW_REVISE, REVISION_APRES_RECETTE, WAKE_RESUME. Les preuves existantes sont complétées par des niveaux CONTRAT_TESTE, INTEGRATION_TESTEE, REEL_VERIFIE liés au candidat, aux rapports et, pour le réel, aux runs/sessions/artefacts observés. Un autre scénario ne qualifie pas celui-ci. Les étapes 1–5 peuvent produire des preuves locales et CI ; elles ne peuvent produire REEL_VERIFIE pour les modèles, l'appareil ou le réveil de Work. Un candidat de qualification peut tester un scénario non qualifié, sans autoriser son usage comme parcours de production qualifié.

Les étapes 6–7 devront démontrer les vraies transitions et les réveils à chaque événement nécessitant une reprise. Le signal GitHub seul ne prouve pas un réveil. La disponibilité du transport vers Work et sa reprise effective restent des preuves externes à acquérir ; aucun nouveau service parallèle n'est ajouté dans ce lot. La promotion reste bloquée tant que les scénarios requis ne disposent pas de leur preuve réelle.

## Tests du lot

Nominal composé : décision de recette authentifiée → baseline avant clôture → REVISION → contrats → revue indépendante injectée et explicitement simulée → publication préparée → cible d'approbation → préparation de reprise. Réutiliser les tests du vrai consommateur CLI pour la correction, la revue d'implémentation et la finalisation ; ne pas présenter ces fixtures comme un appel réel Claude ou un contrôle appareil.

Négatifs : mauvaise identité/head/revue, écart inconnu ou sans autorisation, modification hors scope, critère conservé perdu, preuve sans assertion, écart non résolu, registre borné incorrect, tentative INITIAL et reprise en double. Le test historique du consommateur isolé reste inchangé. La copie isolée reçoit uniquement les nouvelles dépendances internes effectivement nécessaires ; les exact blob OID des producteurs changés sont mis à jour dans la politique.

Après ces tests, publier un seul candidat consolidé et exécuter les suites requises sur Linux/Windows. La promotion, les exécutions réelles et les contrôles utilisateur restent hors de cette autorisation 1–5.

## Complément : plan révisé et ancien plan dans une PR existante

Diagnostic du 4 octobre, détaillé dans `2026-10-04_VNEXT_APPROVED_PLAN_TRANSMISSION_DIAGNOSTIC.md`. L'admission vérifie les octets approuvés, mais la mission VNext nomme un chemin du checkout applicatif sans imposer sa révision Git lors des lectures. Le plan approuvé et ce fichier peuvent différer. La projection narrative embarquée dans la mission ne remplace pas tous les blocs machine du plan de compatibilité.

Ce cas complète le même lot, sans nouvelle campagne : étapes 3–4, transmission d'un dossier de plan/mission exact contrôlé avant Claude et suppression du repli sur une copie applicative ancienne ; étape 5, qualification du candidat consolidé Linux/Windows ; étape 6, usage observé lors de la correction réelle d'une livraison existante ; étape 7, reprise conservant le travail et l'unicité de consommation. Les étapes 8–10 restent audit, préparation de promotion et promotion autorisée.

Conditions de la correction : partir de la projection admise et de ses empreintes, fournir les octets complets du plan approuvé avec une référence de lecture sans ambiguïté, vérifier identité/disponibilité avant modification applicative, empêcher les lectures autorisantes de revenir à l'ancien chemin/HEAD, conserver la même identité à la revue d'implémentation. Une consigne ajoutée au prompt seule ne qualifie pas ce mécanisme. Ne pas modifier le plan dans la PR applicative ni élargir son write_scope pour résoudre un défaut de transport. Les mécanismes existants de locks, consommation et récupération restent utilisés ; pas de nouvelle queue, service ni boucle.

Quatre cas de test supplémentaires sont requis avant publication : ancien plan en PR et nouveau plan effectivement fourni/utilisé ; mauvais plan refusé avant modification ; plan indisponible refusé sans repli ; reprise technique conservant le travail et empêchant un double lancement. Ces cas passent dans les tests locaux composés, avec services injectés. Le parcours Claude réel après recette reste non qualifié ; ces tests ne remplacent pas son exécution.
