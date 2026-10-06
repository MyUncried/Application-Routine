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

## Reprise et revue finale du 06/10/2026

Le chantier a été retrouvé dans `/workspace/scratch/80107acc5c6f/cadence-doc-update/work`, accompagné du plan, des sources, du manifeste des captures et des contrôles. Ce dossier est un export de travail, pas un dépôt Git local : aucun commit local supplémentaire ne peut y être attesté. Ses 181 fichiers sont identiques octet pour octet au commit GitHub `806536ad2278d69157a7f64e27305d966d78ee9e`, effectivement publié sur `docs/cadence-dsf-2026-10-06` et dans la [PR #323](https://github.com/MyUncried/Application-Routine/pull/323), en brouillon. Les blobs ont donc été assemblés dans un arbre et un commit, puis la branche a été publiée ; ils ne sont pas seulement des blobs isolés. L’état interne de l’ancienne conversation et d’éventuels appels distants non publiés reste non vérifiable.

La reprise utilise un checkout séparé dans `/workspace/scratch/1dd8ead422bb/cadence-recovery`, sans écraser le dossier précédent. Le plan joint par le propriétaire est identique au plan récupéré (révision2). Les cinq sources demandées ont été récupérées et comparées aux archives : toutes sont identiques, classeur compris. Les versions précédentes de POINTS ne sont pas intégrées comme de nouvelles exigences.

### Corrections de cohérence après récupération

| Sujet relu | Correction / preuve normative |
|---|---|
| Progression | Chapitres06/12 : exception cadencée ajoutée aux anciennes descriptions génériques ; progression temporelle, fin nominale distincte de Suivant, fraction abandonnée à Pause. Cadence v1 §§3–4, RM-077, contrat13 R-01. |
| Reset et suspension | Chapitre08 et RM-062 : Série unilatérale / bloc du côté bilatéral / récupération courante ; autre côté et temps réel conservés. D-029/D-150, v13 §7, CAD-22/23. D-045 est explicitement historique sur l’ancienne clôture automatique sans réponse ; contrat13 R-03 conservé. |
| Calcul des agrégats | RM-071/RM-159 rapprochées de v13 §5 : To=T si R=0, sinon T−PN+R ; ni Pause terminale ni R comptée deux fois. Les formules D-248 sont inchangées. |
| Phrase et validation | PRODUCT, INDEX, RM-152 et API-ACT-03 renvoient à D-298/Phrase v1 ; texte dérivé à✓, annulé à✕, total fourni par calcul. Suppression des anciennes affirmations ≥ pour toute Répétition et estimation2s pour les Séries cadencées. |
| Référence rédactionnelle | Lecture des100 formulations de la feuille Toutes les phrases, sans reprendre leurs totaux ni la feuille Calcul des durées. Formulation «menée/menées jusqu’à l’échec» rétablie dans Phrase v1. Accords, cadence, deux ordres, pauses, énumérations et plages rapprochés des règles rédactionnelles ; exceptions de calcul C04/C06 du plan conservées. |
| Éditeur et témoins historiques | Chapitre06 et registre des captures : ancien déploiement média et ancienne frame3561:7802 qualifiés historiques ; feuille v13/CE-UI-10 active, roulettes inline, Profil à steppers. Aucun nouveau contrôle de suppression de cadence inventé. |
| Unicité des règles | Ancienne ligne RM-221 de phrase qualifiée historique ; une seule RM-221 active pour les Catalogues. Aucun nouvel identifiant de décision ni arbitrage produit ajouté. |

### Contrôles renouvelés

- 136 fichiers PNG décodés : dimensions, SHA-256 et empreinte Git identiques au manifeste conservé ; IDs et chemins uniques ; tous affichés dans le chapitre06. Aucun PNG réexporté ou retouché pendant la reprise.
- Inventaire Figma en lecture seule : mêmes133IDs de frames et3IDs d’ensembles que le manifeste. Le relevé Cadence reste limité aux paramètres ; il ne démontre pas la matérialisation des trois états d’exécution manquants. Les planches conservées ont été relues ; elles ne certifient pas chaque propriété graphique ni une identité pixel à pixel avec un nouvel export.
- 30 contrats, rubriques1..21 dans l’ordre et renseignées ; références contrat des133frames valides, trois ensembles reliés par la matrice ; aucune image dupliquée dans les contrats.
- Relecture transverse des familles création/paramètres, Catalogue/composition, exécution directe/Séance, média, synthèse/suivi et calendrier : mêmes règles de cadence, total intrinsèque/occurrence, fin explicite et temps réel. Le décompte des rubriques ne vaut pas recette applicative.
- Aucun lien local de fichier manquant dans les Markdown actifs modifiés contrôlés ; IDs D et RM actifs uniques. Les ancres internes ne sont pas certifiées par ce contrôle. Diff limité à `docs/` ; contrôle de whitespace sans erreur sur les documents actifs après retrait des lignes vides finales héritées. Les archives sont préservées à l’identique, y compris les sauts de ligne Markdown par espaces terminaux et une ligne vide finale historique ; code, protocoles, assets applicatifs et Figma inchangés.
- Destinations contrôlées : branche documentaire existante vers main, PR323 ouverte et non fusionnée. Les workflows V2/qualification sont filtrés sur les fichiers de protocole, non sur `docs/` ; la synchronisation locale n’intervient qu’à la fermeture de PR. Aucun lancement manuel, appel Claude, fusion ou synchronisation du PC dans cette reprise.

Les réserves CAD-V01–04, CAD-T01, rôles typographiques, assets et prototype ci-dessus restent à traiter dans des chantiers distincts. La livraison documentaire est reviewable dans la PR ; la conformité graphique complète et la livraison applicative ne sont pas déclarées.
