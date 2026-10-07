# KODJO — corrections de l’audit transverse documentaire du 06/10/2026

Mission : `CORRECTIONS_AUDIT_TRANSVERSE_DOCUMENTAIRE`. Objectif : traiter les écarts établis G-01 à G-05 du pack reçu, sans anticiper l’analyse fonctionnelle encore en cours chez Claude.

Branche : `docs/cadence-dsf-2026-10-06`. Commit de départ et cible de l’audit reçu : `4665654580740059eacd649cc79e615fd07b9a66`. PR documentaire : [#323](https://github.com/MyUncried/Application-Routine/pull/323), brouillon, vers main. Main observé avant livraison : `6d03f5be579f2d0e2e7602b6abf1c2b46f4c740b`.

## État récupéré et sources conservées

La branche documentaire et ses modifications antérieures sont réutilisées. Les captures et les sources archivées ne sont pas régénérées globalement. Le rapport d’audit et son JSON de preuves sont conservés **à l’identique**, à côté du présent rapport. Leurs SHA-256, ainsi que celui du patch fourni, figurent dans [les preuves de correction](2026-10-06_CORRECTIONS_AUDIT_TRANSVERSE_DOCUMENTAIRE_PREUVES.json). Le patch ajoute seulement ces deux fichiers : sa recevabilité a été contrôlée ; il n’a pas été appliqué comme une seconde opération de correction.

Aucune opération accessible ne bloquait l’écriture sur cette branche. Le statut de la conversation interrompue et les processus externes de Claude ne peuvent pas être prouvés depuis ce poste. L’utilisateur indique une analyse fonctionnelle en cours ; son résultat reste attendu. Cette analyse porte sur le commit immuable ci-dessus ; les corrections sont publiées dans son prolongement.

## Corrections

| Constat | Correction et preuve | Résultat |
|---|---|---|
| G-01 — captures obsolètes | Réexport direct des frames `4997:6113` et `5021:5994`, PNG natifs 402 × 874. Comparaison pixel à pixel : exactement 66 pixels changés par image, limités aux trois repères. RGB opaque des repères sur blanc : `(190,194,204)` → `(215,217,223)`, conforme à `#BEC2CC` à 62 %. Matrice courante et registre des captures actualisés. | Corrigé. Planche `6451:10942` réexportée pour comparaison : 0 pixel différent, fichier existant conservé. |
| G-02 — exemples incomplets | CAD-T01 explicite les cinq frames `7059:13302`, `7061:13383`, `7119:27855`, `7069:13464`, `7069:13573`, relues dans Figma. Deux totaux 4 min 45 s sont qualifiés face au total intrinsèque normatif 5 min. L’exemple bilatéral vaut 6 min 18 s + PC, dont la valeur n’est pas visible. Les deux arrière-plans sont distingués des paramètres de leur feuille ouverte. | Corrigé documentairement, sans changer les calculs ni Figma. Les exemples statiques ne sont pas des oracles métier. |
| G-03 — terminologie périmée | Chapitres 06 et 13, ainsi que la matrice historique : le remplacement de Parcours par Circuit dans les 17 occurrences de Composition est enregistré au 05/10 (journal §8). La demande Figma devenue obsolète est retirée. | Corrigé. L’entité autonome Parcours et l’écart séparé de récupération visible sont préservés. |
| G-04 — rapports non reliés | INDEX et README relient la vérification F-09 et la clarification F-14 ; l’audit transverse et le présent rapport sont aussi accessibles. | Corrigé. Statut fonctionnel encore en attente explicite. |
| G-05 — couleur historique | La ligne Carte empilée du DSF Séries variables prescrit `surfaceSubtle #F9FAFC` et qualifie l’ancien `#FCFCFE` comme historique avant fusion (journal §5.3). | Corrigé à l’endroit signalé. |
| G-06 — opérations concurrentes non vérifiables dans l’audit | Lecture GitHub de la branche, PR et Actions : aucun run de cette branche au contrôle préalable. Publication avec vérification de la tête attendue, sans écrasement. | Vérifiable pour GitHub accessible ; sessions privées et processus externes de Claude non vérifiables. |

## Contrôles et limites

Les formules de CAD-T01 sont recoupées avec Paramètres v13 §§4–5 et 9 : pause finale incluse dans le total intrinsèque, convention 2 s avec `≈` sans cadence, PC conservée pour le bilatéral, Compte à rebours et Fin exclus. La feuille de création ne calcule pas la récupération d’une occurrence de Séance. Aucun arbitrage ni règle métier n’a été modifié.

Contrôles déterministes : décodage/dimensions/empreintes des 136 exports (133 frames et 3 ensembles), dont 134 fichiers conservés et 2 renouvelés ; références du chapitre 06 ; 30 contrats comportant chacun leurs 21 rubriques non vides ; unicité des IDs de décisions et règles actives ; liens locaux des fichiers modifiés ; ancres Markdown des documents actifs. Ces contrôles prouvent la structure et l’intégrité, **pas** une conformité fonctionnelle totale des chapitres et contrats.

Le périmètre est exclusivement documentaire. Aucun code applicatif, token de code, protocole VNext/V2/PRE-2/PRE-3 ou Figma n’est modifié. Aucun parcours de qualification, appel Claude ou revue indépendante de clôture n’est lancé. Tests applicatifs et vérifications sur appareil : non applicables à ces corrections documentaires.

**Réserve restante :** la lecture fonctionnelle des chapitres 01 à 05 et 08 à 11 et du contenu des 30 contrats reste attendue. Son résultat doit être rapproché de ce delta ; l’alignement total et la clôture ne sont pas déclarés. L’harmonisation éditoriale des textes de démonstration Figma est distincte et ne bloque pas l’application des spécifications au développement. Les sources d’audit antérieures et les relevés explicitement historiques ne sont pas réécrits.

## Fichiers concernés et livraison

- `docs/MATRICE-CADENCE-FIGMA-2026-10-06.md`, `docs/MATRICE-COUVERTURE-FIGMA-CHAPITRE-06.md` ;
- `docs/DSF-SERIES-VARIABLES-2026-10-02.md`, `docs/INDEX.md`, `docs/README.md` ;
- chapitres fonctionnels 06 et 13 ;
- registre des captures et les deux PNG `figma-4997-6113.png`, `figma-5021-5994.png` ;
- deux fichiers d’audit reçus inchangés, ce rapport et son JSON de preuves.

Commit de livraison : le commit qui introduit ce rapport (son SHA exact est indiqué dans la PR #323 et dans le bilan de livraison ; un fichier ne peut contenir sa propre empreinte Git). Publication sur la branche documentaire existante uniquement, avec contrôle de la tête distante ; PR conservée en brouillon. Main et le PC de l’utilisateur ne sont pas synchronisés.

Prochaine action : recevoir la seconde passe fonctionnelle de Claude, qualifier ses constats sur le commit audité et ce delta, puis corriger les écarts établis avant de demander une clôture documentaire.
