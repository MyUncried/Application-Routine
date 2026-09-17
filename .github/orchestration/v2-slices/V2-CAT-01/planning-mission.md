# Mission de planification verrouillée — V2-CAT-01

## État protocolaire

- Type : `PLAN_ONLY`
- Statut : `PLANNING_AUTHORIZED`
- Implémentation autorisée : **NON**
- Tranche : `V2-CAT-01`
- Issue : [#150](https://github.com/MyUncried/Application-Routine/issues/150)
- Dépôt : `MyUncried/Application-Routine`
- Source produit/documentaire immuable : `63a3c26ed492f7c0925cfb57419f3dc2dcc5e476`
- Commit d’activation protocolaire : `9827a5a27dbda2c5219b6e5082f3f8118d54854b`
- Branche cible future : `main`
- Identité : `.github/orchestration/v2-slices/V2-CAT-01/slice-bootstrap.json`
- Empreinte d’identité : `16964a2679134baea1f535930899f24702a7e9cf97590486559f1adb7075d3ac`
- Protocole applicable : KODJO Protocol V2, règles courantes jusqu’à l’addendum `0.6.25`

La source du plan reste le HEAD produit/documentaire `63a3c26ed492f7c0925cfb57419f3dc2dcc5e476`. Les commits protocolaires ajoutés ensuite n’autorisent aucune dérive du périmètre ni aucun changement produit implicite.

## Rôle du planificateur

Agir exclusivement comme **planificateur technique**. Examiner le code et les tests existants au HEAD source, confronter leur état aux sources fonctionnelles et visuelles, puis produire un plan d’implémentation détaillé et vérifiable.

Il est interdit pendant cette phase de modifier un fichier métier, créer une branche applicative, implémenter, committer du code applicatif, pousser une PR applicative, lancer une demande d’implémentation ou déposer une demande dans la file V2.

## Sources normatives

Le bootstrap de tranche fixe les sources produit à utiliser. Priorité aux sources suivantes selon le sujet traité :

1. `docs/PRODUCT.md`
2. `docs/INDEX.md`
3. `docs/Specifications-fonctionnelles/03 – Parcours utilisateur.md`
4. `docs/Specifications-fonctionnelles/04 – Modèle fonctionnel.md`
5. `docs/Specifications-fonctionnelles/05 – Versions du produit.md`
6. `docs/Specifications-fonctionnelles/06 – Ecrans et navigation de la V1.md`
7. `docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md`
8. `docs/Specifications-fonctionnelles/08 – Conception fonctionnelle détaillée.md`
9. `docs/Specifications-fonctionnelles/09 – Modèle de données fonctionnel.md`
10. `docs/Specifications-fonctionnelles/09 bis – Modèle et migration T03 Catalogue.md`
11. `docs/Specifications-fonctionnelles/10 – Processus métier et règles métier transverses.md`
12. `docs/Specifications-fonctionnelles/11 – API fonctionnelles.md`
13. `docs/Specifications-fonctionnelles/12 – Architecture technique.md`
14. `docs/Specifications-fonctionnelles/13 – Contrats d’écran.md`
15. `docs/MATRICE-TRACABILITE-T03-CATALOGUE-ACTIVITES.md`
16. `docs/Specifications-fonctionnelles/images/README-T03-FIGMA.md`
17. Figma courant, uniquement pour le rendu visuel et les états d’interface représentés ; les références/nodes cités par la documentation sont à privilégier.
18. Code et tests présents au HEAD source.

Ne jamais utiliser un rapport historique ou une règle supersédée comme exigence courante lorsqu’une source normative plus récente existe.

## Corrections imposées après la revue indépendante du plan initial

La revue `5712601284` a demandé une révision avant développement. Les points suivants sont désormais déterminés et doivent être intégrés au prochain plan sans rouvrir les éléments déjà validés :

- le libellé exact de la première option `Créer` est `Une nouvelle activité` ; l’arbitrage utilisateur est tracé dans l’Issue #150 et les frames Figma `3787:5148` et `3841:8375` ont été resynchronisées le 17 septembre 2026 avec ce libellé exact ;
- la section Médias de l’éditeur est visible et repliable ; `Déployer / Condenser` et le placeholder restent désactivés et aucune fonction média réelle n’entre dans la tranche ;
- `scope_allow` doit rester minimal et correspondre strictement aux fichiers réellement à créer/modifier et aux tests qui doivent réellement s’adapter ; les calculs de bilatéralité déjà validés, notamment `src/domain/sessions/calculations.ts`, sont gelés et hors périmètre ; `src/domain/sessions/Session.ts` ne doit être classé `MODIFY` que si un changement concret indispensable est démontré ; les importeurs d’un contrat inchangé doivent être classés `CONSUMER_UNAFFECTED` ou `TEST_UNAFFECTED` ;
- tout nouveau test exigé par le plan doit apparaître explicitement en `CREATE` dans `modified_modules` et donc dans le scope machine ; aucun test nouveau ne peut être exigé uniquement en prose ;
- `src/features/activities/` est autorisé comme frontière de présentation dédiée aux Activités persistantes : écrans, composants et adaptateurs UI propres à cette feature ; le domaine reste dans `src/domain/activities/`, la persistance SQLite dans `src/infrastructure/database/`, et les composants réellement partagés restent dans les espaces partagés ;
- le libellé permanent de navigation basse `Catalogues` supersède explicitement l’ancien jalon `RES-NAV-LABEL-01` (`Séances`).

Le prochain plan doit énumérer et justifier l’intégralité de son `scope_allow` ; sa section de périmètre technique et l’artefact machine ne doivent pas diverger.

### Corrections imposées après la seconde revue indépendante

La revue `5714616288` a confirmé les corrections précédentes et demande uniquement de fermer les écarts de déterminisme de scope suivants avant développement :

- la liste de scope présentée en prose doit être **strictement identique** au `scope_allow` machine final : même nombre de chemins, mêmes chemins et mêmes statuts d’écriture ; aucune entrée machine ne peut être omise de la section de périmètre technique ;
- si `app/(creation)/composition.tsx`, `src/features/sessions/SessionDraftProvider.tsx`, `src/features/sessions/SessionService.ts` ou `src/features/sessions/__tests__/SessionService.test.ts` restent classés comme modifiés/adaptés par l’artefact final, chacun doit être explicitement listé et justifié dans le plan ; sinon ils doivent être reclassés comme non affectés avec justification déterministe ;
- `src/features/sessions/SessionCard.tsx` est gelé pour cette tranche et `src/features/sessions/__tests__/SessionCard.test.tsx` ne doit pas être ouvert en écriture en l’absence d’un changement concret de contrat démontré ; le simple passage par le barrel i18n ne suffit pas à justifier `MODIFY` ;
- toute entrée ajoutée au scope pour satisfaire un impact direct doit correspondre à un changement réellement requis par la tranche ; aucune écriture de confort ou de régression préventive sur un composant gelé n’est autorisée.

Pour éviter une nouvelle ambiguïté de revue, le prochain plan doit également rendre déterministes les réserves non bloquantes déjà identifiées : ne pas traiter `Lecture`/`Démarrer` au conditionnel lorsqu’une décision ou un contrat d’écran fixe déjà son état ; expliciter l’ancrage de l’arbre `Créer` conformément à D-184 ; couvrir complètement D-168 pour la restauration du contexte Catalogue concerné ; préciser le comportement de validation sans sélection prévu par `09 bis` ; et, si `SegmentedControl` est extrait, imposer la préservation de la traduction visuelle DSF canonique sans refonte.


### Corrections imposées après la troisième revue indépendante

La revue `5714941349` a confirmé les axes précédemment fermés et ne laisse qu'un écart de scope et deux formulations à corriger. Le prochain plan doit appliquer exactement les règles suivantes :

- `src/features/sessions/SessionService.ts` est classé `CONSUMER_UNAFFECTED` pour cette tranche : aucun changement de contrat consommé n'est démontré, `SessionService` ne consomme que `SessionDraft`, `toCreateSessionInput` et `toUpdateSessionInput`, et l'évolution additive du brouillon ne justifie aucune écriture dans ce service ;
- `src/features/sessions/__tests__/SessionService.test.ts` est classé `TEST_UNAFFECTED` : aucun contrat couvert par ce test ne change dans V2-CAT-01 ; il ne doit apparaître ni dans `modified_modules`, ni dans `TEST_MUST_ADAPT`, ni dans `scope_allow` ;
- le `scope_allow` machine final doit être strictement identique à la liste de périmètre technique en prose et à `modified_modules` pour les chemins en écriture ; aucun importeur classé non affecté ne peut rester autorisé en écriture ;
- sur la carte d'Activité du Catalogue, `Lecture`/`Démarrer` doit être présenté comme **présent** lorsque le contrat `CE-T03-02` le fixe, et non sous une formulation conditionnelle ; dans cette tranche il reste systématiquement désactivé et sans handler fonctionnel ;
- dans le parcours de sélection d'Activités existantes depuis la Composition, une validation sans sélection est **invalide**, ne crée aucune donnée et ne modifie ni le brouillon ni le Catalogue ; cette règle doit figurer dans la spécification comportementale du plan, pas seulement dans la stratégie de tests.

Les axes explicitement déclarés conformes par la revue `5714941349` ne doivent pas être rouverts.

## Périmètre fonctionnel inclus

Le périmètre exact est celui de l’Issue #150. Le plan doit le traiter sans l’élargir.

### Catalogues

- `Séances` actif.
- `Activités` actif.
- `Circuits` visible mais désactivé.
- Nouveau Catalogue des Activités limité à : affichage, création, modification.

### Options de création depuis les Catalogues

- Écran/options : `Une nouvelle activité`, `Une séance`, `Un circuit`, `Annuler`.
- `Une nouvelle activité` et `Une séance` disponibles ; `Un circuit` visible mais désactivé ; `Annuler` disponible.
- Apparition progressive et rapide des options.
- Mise à niveau des écrans déjà développés concernés, notamment zone bleue supérieure, boutons d’action et barre de navigation.

### Création / modification d’une Activité

- Création depuis le Catalogue des Activités.
- Création depuis la Composition d’une Séance.
- Modification d’une Activité persistante via le formulaire documenté, prérempli.
- Titres exacts selon le contexte création/modification.
- Nom de l’Activité en gras dans la synthèse.
- Section Médias visible avec contrôle Déployer/Condenser et placeholder désactivé.
- Aucune fonction réelle d’import/ajout média.

### Activité créée depuis la Composition

- Utilisable dans la Séance en cours.
- Aucun enregistrement automatique dans le Catalogue des Activités.
- Architecture compatible avec une future action explicite d’enregistrement dans le Catalogue, sans bouton ni UI supplémentaire dans cette tranche.

### Ajout d’une Activité à une Séance

- Sélection d’une Activité existante depuis le Catalogue des Activités.
- Ou création d’une nouvelle Activité.
- Aucun autre changement fonctionnel du parcours de création de Séance.

### Navigation basse

- Destination `Catalogues` avec nom et icône de référence.
- Hauteur du cadre augmentée.
- Marges verticale haute/basse équilibrées autour de l’ensemble icône + libellé.
- Espace visible entre zone centrale et cadre de navigation.
- Icône Recherche alignée horizontalement sans agrandissement.
- Cadre coloré de sélection visible et animé par glissement continu entre destinations.

### Contrôles segmentés

- Cadre sélectionné centré verticalement avec marges haute/basse équilibrées.
- Déplacement du cadre sélectionné par glissement continu de l’option courante vers la nouvelle.

### Swipe dans la Composition de Séance

- Uniquement sur les cartes d’Activité de la Composition.
- Swipe gauche : carte suivant réellement le geste, révélation progressive du bloc d’actions.
- Swipe droit : véritable geste droit requis, suppression des déclenchements parasites.
- `Dupliquer / Supprimer` restent fonctionnels.
- Coins haut-gauche et bas-gauche du bloc d’actions arrondis.
- Espace entre carte déplacée et bloc d’actions égal à la marge entre bord droit d’une carte dans un Tour et cadre du Tour, avec couleur de fond du cadre du Tour.

### Carte d’Activité — icône `Côté`

- Décaler l’icône vers la droite.
- Viser une marge droite égale à la marge supérieure de la carte.

### Catégories

- Centrer horizontalement `Créer une catégorie`.
- Après validation d’une Catégorie, dernière étape du parcours concerné d’enregistrement de la Séance : nouvel écran entrant depuis la droite et écran courant sortant vers la gauche.

### Préparation des futurs parcours d’exécution

- Préparer les écrans déjà définis pour les futurs parcours `Activité seule` et `Séance`.
- `Déployer` et `Démarrer` présents lorsqu’ils sont prévus mais désactivés/non fonctionnels.
- Aucun nouvel écran à inventer.
- Aucun moteur d’exécution ni aucune exécution réelle.
- Architecture seulement compatible avec les deux futures origines, sans implémenter le moteur.

### Corrections UI des écrans inclus

- Intégrer les corrections UI déjà documentées qui concernent directement les écrans/parcours inclus dans cette tranche.
- Ne pas étendre cette règle aux écrans hors périmètre.

## Hors périmètre impératif

Ne pas planifier dans cette tranche :

- moteur d’exécution d’une Activité ;
- moteur d’exécution d’une Séance ;
- toute exécution réelle ;
- développement fonctionnel des Circuits ;
- recherche, filtre, tri, archivage, restauration ou suppression dans le Catalogue des Activités ;
- swipe et actions contextuelles dans le Catalogue des Séances ;
- swipe et actions contextuelles dans le Catalogue des Activités ;
- fonctions média réelles ;
- bouton/UI futur d’enregistrement dans le Catalogue pour une Activité créée depuis Composition ;
- écrans/fonctionnalités du Suivi ;
- implémentation applicative du composant `Status / Badge` ;
- corrections UI d’écrans hors parcours inclus ;
- toute fonctionnalité future non indispensable aux éléments explicitement inclus ;
- réouverture des éléments de bilatéralité déjà réalisés : contrôle Activité, confirmation conditionnelle du Tour, remplacement `Durée minimale` → `Durée totale`, contrôle Tour ;
- modification des calculs de bilatéralité déjà validés ;
- correction opportuniste étrangère à la tranche.

Toute dépendance indispensable située hors de ces bornes doit être signalée comme risque ou clarification, jamais ajoutée tacitement.

## Analyse demandée

Le planificateur doit :

1. établir l’état réel du code et des tests au HEAD source ;
2. distinguer pour chaque sous-périmètre ce qui existe déjà, ce qui doit être modifié et ce qui doit être créé ;
3. localiser précisément les modèles, repositories, services, providers/stores, navigation, écrans, composants, styles/tokens et tests concernés ;
4. identifier les impacts de persistance nécessaires au Catalogue des Activités sans introduire les fonctions explicitement exclues ;
5. vérifier la séparation entre Activité persistante du Catalogue et Activité créée uniquement dans une Composition ;
6. vérifier les dépendances de navigation et les retours de contexte sans inventer de nouveau parcours ;
7. définir la stratégie de composants réutilisables pour navigation basse, contrôles segmentés et cartes/swipes sans refonte générale ;
8. analyser la préparation structurante des futurs points d’entrée d’exécution sans implémenter de moteur ;
9. relever les corrections UI documentées effectivement applicables aux écrans inclus et seulement à eux ;
10. proposer l’ordre de mise en œuvre minimisant les régressions ;
11. définir tests automatisés et validations manuelles nécessaires ;
12. signaler toute contradiction réelle entre code, documentation et Figma par `CLARIFICATION_REQUIRED`, sans hypothèse.

## Livrable attendu

Produire un plan technique en français comprenant obligatoirement :

1. **Constat de l’existant** — preuves par chemins de fichiers et symboles.
2. **Matrice périmètre → état actuel → écart** pour tous les sous-périmètres inclus.
3. **Périmètre technique exact** — fichiers/modules à créer ou modifier, avec justification.
4. **Plan séquencé** — étapes atomiques, dépendances, résultat vérifiable de chaque étape.
5. **Données / persistance / compatibilité** — uniquement ce qui est nécessaire au Catalogue des Activités et aux parcours inclus.
6. **Navigation et composants UI transverses** — stratégie bornée aux écrans inclus.
7. **Tests** — domaine, repository/persistance, services, composants/UI, navigation, gestes, régression, contrôles finaux.
8. **Critères d’acceptation** — exigence → preuve attendue.
9. **Risques et questions** — uniquement arbitrages réellement nécessaires.
10. **Proposition de `scope_allow`** — chemins minimaux nécessaires à l’implémentation.
11. **Verdict** — `PLAN_READY_FOR_INDEPENDENT_REVIEW` ou `CLARIFICATION_REQUIRED`.

Le plan doit être suffisamment précis pour permettre l’implémentation sans redécouvrir les règles fonctionnelles, mais il ne doit contenir ni implémentation complète ni extension fonctionnelle.

## Règles de bornage

- Le texte de l’Issue #150 détermine **ce qui** est dans la tranche.
- Documentation et Figma déterminent **comment** les éléments inclus sont définis.
- Ne pas chercher dans la documentation de nouvelles fonctionnalités à ajouter.
- Ne pas transformer une fonctionnalité future en exigence courante.
- Ne pas rouvrir un développement déjà réalisé sans écart identifié concernant cette tranche.
- Une inconnue hors périmètre ne bloque pas la tranche.
- Une ambiguïté nécessaire à un élément inclus déclenche `CLARIFICATION_REQUIRED`.

## Suite obligatoire

Le plan produit n’autorise aucune implémentation. Il doit être soumis à la revue indépendante prévue par le protocole V2. Après corrections éventuelles et revue favorable, l’utilisateur devra approuver explicitement le plan final avant toute autorisation d’implémentation.
