# KPB-001 — contrat unique de génération des plans UI

Base protocolaire examinée : 8105f7a48aec8a749d7c7bcec6f49c4dac6e0de7.
Périmètre : générateur INITIAL/REVISION/fermeture, contrat UI partagé, validateur et tests du protocole. Aucun code applicatif ni décision produit V2-CAT-01 modifié.

## Diagnostic et correction

Cause structurelle confirmée : la révision et sa fermeture généraient du Markdown libre. INITIAL contraignait uniquement une chaîne `ui_criteria_matrix_json`, dont le contenu restait libre. Les erreurs risk_types et reuse_search étaient découvertes seulement après génération.

`lib/ui-criteria-contract.js` centralise désormais le schéma structurel et les contrôles déterministes historiques, déplacés sans suppression. Le générateur fournit la matrice comme objet imbriqué dans une sortie structurée stricte. Le prompt reçoit le schéma et les règles exécutables issus de ce même module. Le récepteur vérifie structure, conditions, unicité, chemins et couverture avant de rendre les balises. Refus, sortie incomplète, champs inconnus et balises concurrentes échouent explicitement. Aucun mécanisme de correction silencieuse ni retry automatique ajouté.

Limite technique explicite : Structured Outputs ne supporte pas toutes les conditions JSON Schema (`if/then/else` notamment). Les conditions transversales sont donc imposées par le même validateur à la frontière de génération. Le scope définitif ne peut être contrôlé qu'après fermeture déterministe des imports : le contrôle final existant est conservé avant publication. Documentation : https://developers.openai.com/api/docs/guides/structured-outputs.

## Invariants

Contrat v1, empreintes normalisées, provenance protocolaire, couverture des modules UI, correspondance risques/preuves, tests FUNCTIONAL, recherche de réutilisation, préservation et scope fermé restent obligatoires. Le validateur n'est pas assoupli. Les fichiers applicatifs et PR181 restent hors périmètre. Aucune nouvelle planification avant qualification Linux/Windows et intégration.

## Vérifications

37 tests ciblés réussis localement sous Linux, dont 26 cas négatifs rejoués par génération et validation déterministe. Les deux défauts observés sont reproduits (enum de risque invalide, reuse_search objet). Vérification des workflows réussie.

La suite complète locale présente des échecs liés à la copie de travail incomplète (fichiers applicatifs et historique Git absents). Elle ne constitue pas une qualification complète ; les contrôles Linux et Windows du checkout GitHub complet sont requis avant intégration. La qualification Windows et l'intégration ne sont pas encore acquises à la rédaction de ce rapport.

## Second défaut — correction dédiée nécessaire

DÉFAUT_CONFIRMÉ : `verify-v2-finalization.js` accepte VISUAL_APPROVED avec une revue VISUAL_CORRECTION_DELTA et produit READY_TO_CLOSE sans contrat de revue global. `kodjo-slice-finalize.yml` saute alors le rejeu de conformité par critère. Le checkpoint du delta prouve une livraison, pas la conformité globale. Aucun événement conjoint déterministe ne conserve le succès ciblé tout en imposant une requalification complète. Le parcours utilisé jusqu'ici dépend du pilotage de ChatGPT.

Ce défaut est séparé de KPB-001 : il touche finalisation, marqueurs, checkpoints, transition de planification et consommateurs de READY_TO_CLOSE. Ce n'est pas un garde-fou local.

Périmètre attendu de la correction dédiée : événement explicite d'approbation ciblée et requalification ; preuve immuable liée au HEAD, à la revue et à l'approbation humaine ; état global REQUALIFICATION_REQUIRED distinct du résultat DELTA_VALIDATED ; transition automatique vers la planification canonique sans administration de queue ; blocage de toute clôture globale issue d'une simple revue différentielle ; conservation des preuves ciblées dans le nouveau cycle. Le langage naturel peut être traduit en événement structuré par le pilote, mais les transitions et interdictions doivent être vérifiées par le protocole.

Tests attendus Linux/Windows : coexistence des deux états, conservation des preuves, rejet des HEAD/revues/identités incohérents et événements ambigus, idempotence, déclenchement de requalification sans queue, impossibilité READY_TO_CLOSE/fusion/synchronisation stable depuis le seul succès delta, clôture globale uniquement après revue complète et approbation de portée globale. Aucun changement produit ni autorisation de fusion applicative.
