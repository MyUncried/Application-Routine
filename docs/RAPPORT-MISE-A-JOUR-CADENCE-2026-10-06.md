# Mise à jour documentaire Cadence — 6 octobre 2026

## Résultat et portée

La documentation cible intègre la conception Cadence, les formulations du classeur, les changements de layout et le rapport de corrections DSF. Base distante vérifiée au début puis avant publication : `6d03f5be579f2d0e2e7602b6abf1c2b46f4c740b`. Travail réalisé séparément ; aucun changement du code applicatif, du manifeste d’assets, de Figma ou du répertoire local `/dev` de l’utilisateur.

Références actives : [Paramètres v13](Specifications-fonctionnelles/SPECIFICATION-PARAMETRES-MODALE-v13.md), [Cadence v1](Specifications-fonctionnelles/SPECIFICATION-CADENCE-REPETITIONS-v1.md), [Phrase v1](Specifications-fonctionnelles/SPECIFICATION-PHRASE-PARAMETRES-EXECUTION-v1.md), [DSF courant](DSF-CADENCE-2026-10-06.md) et [matrice Figma courante](MATRICE-CADENCE-FIGMA-2026-10-06.md). Les versions de ces documents sont indépendantes de la version du classeur.

## Travaux réalisés

| Lot | Résultat |
|---|---|
| Sources | Pièces reçues conservées dans les archives avec empreintes ; doublon POINTS traité une seule fois ; ancien v12 figé et entrée redirigée vers v13 |
| Phrase | Grammaire, accords, énumération jusqu’à trois puis min/max, côtés, omissions et zone unique ; total fourni par le calcul métier |
| Métier | Chapitres 00–05 et 07–11, PRODUCT et renvois repris ; cadence facultative par Série, aucune valeur par défaut ; Ti, symboles, progression, Pause/Reprise, reset et sécurité cohérents avec la conception |
| Données et API | Cadence, propagation, validation, brouillon transactionnel, copies, instantanés immuables et temps réel cumulé documentés ; compatibilité sans cadence implicite |
| Décisions | CAD-01 à CAD-30 transcrites en D-268 à D-297 ; D-298 à D-300 pour consolidation phrase/DSF/autorité ; D-266/D-267 préexistantes préservées |
| Écrans | 133 frames courantes et 3 ensembles de composants exportés ; cinq nouvelles frames intégrées dans la famille créer/modifier ; captures centralisées dans le chapitre 06 |
| Contrats | 30 contrats relus pour la portée de l’évolution ; modifications dans les rubriques concernées, règles communes actualisées ; 21 rubriques conservées et renseignées pour chacun |
| DSF | Relevé actuel des variantes, tokens, polices, rôles, archives et statuts A01–A15 ; mapping d’icônes qualifié comme préparatoire, pas publié comme certain |

Les formules de pauses/côtés/Récupération de D-248 sont conservées ; seule la contribution Ti évolue avec la cadence. Les règles Séances sans photo, listes mixtes sans photo et distinction Circuit/Tour/Parcours restent conservées. Les anciennes clauses contradictoires sur l’ordre bilatéral unique, l’interdiction générale de cumuler les pauses et l’arrêt automatique faute de réponse ont été alignées sur les décisions déjà closes.

## Vérifications effectuées

- Présence et décodage des 136 PNG ; empreintes SHA-256 et Git calculées ; correspondance de chacun avec une référence affichée dans le chapitre 06.
- Contrôle visuel des nouvelles captures Cadence et revue des planches des 133 frames ; exports conservés fidèles, aucun nombre ou texte retouché dans les PNG.
- Contrôle structurel des 30 contrats : rubriques 1 à 21 dans l’ordre, sans rubrique vide ; aucune capture dupliquée dans le chapitre 13.
- Contrôle des liens locaux des documents actifs modifiés contre l’arbre du dépôt de baseline et les nouveaux fichiers : aucun lien de fichier manquant. Les ancres internes et le code applicatif ne sont pas qualifiés par ce contrôle.
- Unicité des identifiants de décision et couverture des trente décisions CAD ; recherche et correction des anciennes règles actives sur les symboles, le bip minute, la reprise et la progression.
- Classeur conservé octet pour octet : aucune vérification de ses montants, aucun recalcul des pauses, aucun enrichissement numérique exigé. Il reste exclusivement rédactionnel.

Ces vérifications portent sur la documentation et ses artefacts, pas sur le fonctionnement d’une application ou une recette iOS/Android.

## Limites explicites de la clôture

| Sujet | Statut restant |
|---|---|
| CAD-V01 — suppression de cadence | Fonction décidée et documentée ; aucun contrôle exact de suppression identifié dans Figma. Son emplacement ne peut être certifié ni inventé. |
| CAD-V02–04 — exécution cadencée | Avant nominal, après nominal et Pause/Reprise : comportements documentés dans les contrats hôtes, mais aucune frame dédiée identifiée. |
| CAD-T01 — textes d’exemple | Plusieurs phrases Figma restent antérieures à la formulation finale ; Phrase v1 gouverne le texte. Les captures montrent l’état réel. |
| Typographie | compactCardTitle 15/18 et cardTitle 16 dans son rôle sont consignés ; `caption` 11/13 reste présenté avec le statut de confirmation de la source ; certains rôles/interlignes restent à mesurer avant migration du code. |
| Assets | Six rôles sans source actuelle établie et dimensions de navigation divergentes ; tracés et exports à qualifier dans le lot assets. Aucun mapping « probable » promu canonique. |
| Prototype | Recréation des interactions et version Figma nommée non démontrées ; anciennes décisions non rouvertes. |
| Livraison | Implémentation Cadence, migration, son en arrière-plan et reprise sur appareil restent à réaliser et tester ; cette mise à jour ne les déclare pas livrés. |

La consolidation documentaire est effectuée pour les décisions établies. La clôture graphique complète ne peut pas être annoncée tant que les réserves ci-dessus ne sont pas matérialisées ou qualifiées. Aucun nouveau design n’a été entrepris.
