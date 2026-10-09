# PRE-3 — résultat de revue initiale et préparation de révision

Opération existante #340. Aucun nouvel appel modèle, run, audit, développement ni validation propriétaire du plan.

## Preuve réelle

Session Claude `ebde720a-8c4a-4685-95b4-407b2116ff58`, producteur `1d42479181586d926a9970867a41d35d44cc4661`. Reçu logique `56568e7ae81d44c60cb5185d0b69f3099fb64650953804dbf322e478d3845ce9` ; le hash `2a52e7b6...` transmis en premier était celui du conteneur de transport, pas celui du reçu logique.

`verifyReceipt` canonique a vérifié le reçu fourni contre le paquet publié `603de045...`, le résultat brut Claude, les hashes Plan/UI, le rapport recalculé et les observations natives. Résultat : **CLARIFICATION_REQUIRED, 15 constats, 13 bloquants, coverage_status COMPLETE, aucune cible pending**. COMPLETE est la couverture déclarée et validée structurellement ; ce n'est pas une preuve externe que chaque cible a été correctement examinée. Les 11 observations natives retournées sont verified=false ; aucune approbation native inférée.

Le résultat brut exact est conservé dans `revue-initiale-resultat-claude.json`. La projection lisible `revue-initiale-rapport.json` conserve les constats complets, le nombre et le digest des cibles, et les observations natives ; elle ne remplace pas le reçu canonique. Le reçu complet peut être reconstruit avec `vnext-live-chain.validateReviewResponse(produced, rawResult)`, puis contrôlé par `verifyReceipt`. Les cibles ne sont ni omises de la revue ni supprimées du contrat : cette projection documentaire évite seulement leur répétition dans Git.

## Corrections identifiées

| Groupe | Défaut démontré | Correction et vérification attendue |
|---|---|---|
| Sources/exigences | 6384 exigences UI, aucun kind métier/préservation ; 37 états documentaires affectés par défaut à P3-20 | Typage explicite des obligations métier/données/migration/préservation, rattachement exact des 95 états aux règles P3 ; contrôles de reconstruction et de couverture sans réduction de périmètre |
| Interaction/native | Zéro INTERACTION ; quatre choix wheel sans assertion ni preuves admissibles | Assertions fonctionnelles par contrôle, source FUNCTIONAL et preuves FUNCTIONAL_TEST ; liaison des branches natives et observation du code de la baseline |
| Consommateurs | 106 candidats du catalogue sans contenu transporté ; preserve_scope vide | Observer le contenu Git exact des 179 candidats, classifier préservation/écriture/tests, préserver PRE-1/PRE-2 et les consommateurs hors refonte |
| Tests/calculs | Une obligation globale migration ; 4710 obligations sur une seule feuille ; inversion sans test domaine | Attendus distincts par scénario SQLite/migration/rollback, cas numériques indépendants et 276 phrases ; tests au niveau du fichier réellement propriétaire |
| Intention/fichiers | Géométrie de feuille copiée sur i18n et tokens ; tests existants exclus des écritures | Intention et obligation propres à chaque fichier ; ADAPT justifié pour les suites existantes concernées, RUN_EXISTING pour les suites préservées |
| UI/accessibilité | Attributs Figma internes non observables sous VISUAL_COMPARE ; preuves accessibilité agrégées | Garder les sources complètes ; définir un oracle livrable par propriété observable et une justification pour le contexte non asserté ; risques et preuves par surface interactive |
| Rédaction | Valeurs collées aux mots ; anciennes notes historiques de blocage ; deux captures identiques | Séparateurs à valeurs constantes, statut actuel explicite ; comparaison des deux arbres/rendus avant regroupement éventuel, sans supprimer l'extraction |

Chaque constat reste OPEN jusqu'à preuve de résolution causale et nouvelle revue indépendante ; le registre de travail n'est pas un RevisionPatch canonique.

## Cause structurelle à traiter dans le parcours existant

`vnext-figma-launch.js::requirements` impose actuellement `kind:'UI'` aussi aux états documentaires FUNCTIONAL. `validateCheckpoint` recalcule cette liste et refuse une surcharge dans la recette. La correction ne peut donc pas se limiter à changer le PlanContract à la main. Le typage doit être traité à la frontière source/Launch avec tests ciblés et compatibilité des anciens paquets, puis la préparation PRE-3 reconstruite. Cela constitue un blocage démontré lié à PRE-3, pas une autorisation de refonte générale ou d'audit global.

Le constructeur PRE-3, pour les états documentaires adossés aux frames, déduit encore P3-03/P3-20 du chemin de la surface. Cette heuristique explique la règle d'inversion mal affectée et doit être remplacée par un rattachement explicite aux règles et attendus. Le défaut de fins de ligne est déjà vérifié corrigé sur Windows : Plan/UI/conteneur exacts avant la revue réelle.

## Préparation réalisée et jalon propriétaire

Séparateurs des exemples signalés rétablis dans `assertions-recette.json`, `inventaire-etats-scenarios.json` et `schema-et-ecritures.md`, sans changement des valeurs ni règles. Vérification automatique : après retrait des espaces, seule la graphie explicite `alpha 0.34` et le développement `separator` diffèrent ; JSON valide ; vérificateur de préparation 23/59/95/6725 PASS ; oracle 13/276 PASS. Ces changements documentaires préparatoires ne sont pas encore propagés au paquet source Git figé et n'autorisent pas de développement.

Le constat `FND-2aa59b7187ade34c38f136a7` est catégorisé PRODUCT_AMBIGUITY / USER_DECISION. `revision-contract.js::earliestStage` refuse donc toute révision canonique automatique avec `VNEXT_REVISION_USER_DECISION_REQUIRED`. Une décision ouverte valide est publiée dans `decision-revue-numeriques-ouverte.json`. Proposition A : confirmer la correction des séparateurs uniquement, à valeurs et règles constantes. Option B : signaler une valeur précise réellement ambiguë. Ce jalon ne vaut pas approbation du plan ni changement du périmètre. La classification de la revue est conservée, pas neutralisée pour contourner le gate.
