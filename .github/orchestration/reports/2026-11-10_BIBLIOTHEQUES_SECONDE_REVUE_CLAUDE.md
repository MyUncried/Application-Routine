# KODJO — Seconde revue ciblée : conception consolidée des Bibliothèques

**Date :** 10 novembre 2026 · **Nature :** audit différentiel exclusivement (aucun développement, aucune modification de conception, de code ou de Figma, aucune fusion, aucune PR).
**Destinataire :** ChatGPT (consolidation et corrections documentaires), avec les arbitrages de Hermann listés en §5.

## 0. Périmètre vérifié et limites

| Élément | Valeur vérifiée |
|---|---|
| Dépôt | `MyUncried/Application-Routine` |
| Documentation examinée | `docs/bibliotheques-consolidation-simplification-20261110` → `b324928762cc6db78af1aa4f0b53b7593e1ea078` (tête distante identique au SHA demandé) |
| Code `main` | `7e5fb6a29b2c6ba1de23d6b55dad9d8ff670d88d` · `DATABASE_VERSION = 23` |
| Pilote catalogue | `catalogue/integration-60-main-20261109` → `7b43c2d5dec3f6f37556b1fbc3e2ea26776f2b07` (3 commits de retard sur `main`) |
| Moteur | `pre10-bmad/dev` → `47e78378b6167813ba65a783e6b8ccc86d1b0eac` : **11 commits d'avance et 3 de retard** sur `main`, base `901d7b4c` (la même que le pilote) ; `DATABASE_VERSION = 24` |
| Première revue | `e78431d10bbcc1ab3a37f62f8b802c6c6e12aa81` (C-01 à C-28) |

**Lus intégralement :** conception technique et données, parcours PU-01 à PU-17, conception fonctionnelle, première revue. **Lus par différentiel (`acb32663` → `b3249287`) et recherche ciblée :** registre 07, chapitres 02, 03, 05, 09 à 12, PRODUCT, INDEX, annexes. **Code lu :** `main` (migration013, `SqliteMovementRepository`, `Movement`, `MovementCatalogueService`, usages du nom normalisé), pilote (`catalogueLoadPlan`, `CatalogueLoadService`, `SqliteCatalogueRegistry` et leurs tests), PRE-10 (`migration024`, `constants`, `sessionSnapshot`, `ExecutionService`, `ExecutionScreen`).
**Non exécuté :** aucune suite Jest (dépendances non installées). Aucune affirmation « le test passe » ; les propositions de test sont des **à-écrire**. Un état « NON VÉRIFIABLE » signale qu'une preuve exige une exécution ou un code serveur inexistant.

Légende de complexité : faible (< 1 jour, un fichier ou une migration simple), moyenne (plusieurs couches, tests de non-régression), forte (refonte ou second mécanisme).

---

## 1. Synthèse et corrections de ma première revue

**Verdict : À CORRIGER AVANT DÉVELOPPEMENT, par corrections ciblées. Aucune révision structurelle.** La conception simplifiée est cohérente : F4-G supprime le cas le plus coûteux (versions concurrentes) et l'architecture est celle que je recommandais. Le lot L1 (Bibliothèques personnelles) peut démarrer dès que la règle de numérotation des migrations (R-01) est consignée.

**Points solides confirmés.** Une révision active par fiche et par appareil est déjà **la structure du registre pilote** (PK `(catalogue_id, sheet_id)` et `movement_id UNIQUE`, `SqliteCatalogueRegistry` l. 30-39). Le protocole « intention durable → écriture du Mouvement → confirmation atomique » est testé en reprise après coupure, avant et après l'écriture (`CatalogueLoadService.sqlite.test.ts` l. 273 et 293, non exécutés). Les instantanés d'Exécution de PRE-10 sont indépendants des modifications ultérieures des Mouvements (`sessionSnapshot.ts` l. 1-12) : F4-G ne les atteint pas.

**Corrections de ma première revue (erreurs ou estimations à rectifier).**

1. **Migration 024.** Ma première revue place les tables `library` et `library_member` en « migration 024, `DATABASE_VERSION` 23 → 24 » (C-06, C-28, §D.3, §G L1). `pre10-bmad/dev` porte déjà `migration024` (tables `executions` et `execution_results`) et `DATABASE_VERSION = 24` (`constants.ts` l. 143-146). Le dépôt applique la règle « prochaine version disponible » (`constants.ts` l. 122-123 et 140). Le numéro des Bibliothèques n'est donc pas 024 (R-01).
2. **PRE-10 « non développé ».** Mon C-28 le tenait pour non vérifiable parce qu'absent. Il existe sur `pre10-bmad/dev` ; sa compatibilité est examinée en §2 (axe E).
3. **Index d'unicité du nom.** J'avais classé la migration de `movements.normalized_name` en « complexité forte » et recommandé un suffixe numéroté. L'unicité est un **index autonome** (`migration013.ts` l. 102), pas une contrainte de table : le remplacer ne demande pas de reconstruire la table. Le coût réside dans les couches applicatives qui doublent la contrainte (axe B). Le suffixe numéroté stocké de C-02 est **caduc** : il visait à préserver l'index global, et la décision close l'écarte.
4. **Placement du pointeur de release et de `moderation_block`.** Je les plaçais dans le registre. Le registre est provisoire (en-tête de `SqliteCatalogueRegistry`, décision du 10/11) : y ajouter de l'état durable augmente la dette de migration. Ils vont dans la base principale (axes C et D).

**Nouveaux constats (N-01 à N-08).**

| ID | Gravité | Constat | Lot butoir |
|---|---|---|---|
| N-01 | Important | Collision de numérotation des migrations avec PRE-10 et le plan A.5 (correction 1) | L1 |
| N-02 | Important | Coût réel de l'homonymie : 5 couches applicatives + planificateur du pilote (axe B) | L4 |
| N-03 | Important | Droits locaux des copies : le registre ne peut pas les porter (axe A, S-04) | L2 |
| N-04 | Important | Mise à jour de lot : l'ordre des écritures suffit, mais la reprise est limitée à un catalogue (axe C) | L5 |
| N-05 | Amélioration | « Espace de noms local persistant non affiché » (§5.4) inutile : à écarter (axe B) | — |
| N-06 | Amélioration | Document technique : 40 occurrences de backticks échappés (`\`` ) : les blocs de code ne s'affichent pas | — |
| N-07 | Important | Chapitres 02, 03, 05 : persona « professionnel de santé » avec suivi d'exécution des patients, contraire à KIN-01 et à la neutralité santé | avant L2 |
| N-08 | Amélioration | Le mot « membre » désigne à la fois une fiche de la composition et une personne destinataire | — |

---

## 2. Revue par axe

### Axe A — Simplification du modèle de données (S-01 à S-09)

| Axe | Décision ou contrainte | État | Évidence | Problème restant | Correction minimale | Complexité | Arbitrage |
|---|---|---|---|---|---|---|---|
| **S-01** Révisions locales | Une révision active par fiche source et par appareil ; pas de cache par Bibliothèque | CONFORME | Registre l. 30-39 ; conception §6.2 l. 242-252, §5.1 l. 184, T-12 l. 386 ; PU-08 l. 101 | L'aperçu doit lister les autres Bibliothèques référentes : registre (autre base) puis `library_member` par `Movement.id`, sans jointure inter-bases | Aperçu en deux lectures ; aucune table | faible | non |
| **S-02** Identité | `(source_namespace, sheet_id)` stable, indépendante du nom ; `Movement.id` inchangé | PARTIELLEMENT CONFORME | §5.4 l. 216-224 ; ch. 09 « Identité » ; migration013 l. 102 | Voir axe B | Voir axe B | moyenne | oui (n° 2, §5) |
| **S-03** Bibliothèques locales | Une table `library` + une table d'association vers `movements` | PARTIELLEMENT CONFORME | §5.2 l. 190 ; `activity_definitions.movement_id … ON DELETE RESTRICT` (migration013 l. 137) | La lecture seule d'une Bibliothèque reçue n'est qu'applicative ; la suppression locale d'un Mouvement installé retire sa référence (cohérent avec `WITHDRAWN_LOCALLY`, `catalogueLoadPlan` l. 141 et 379) | `library(id, name, description, source_library_id NULL, read_only, archived_at, installed_release_id NULL, target_release_id NULL, created_at)` et `library_member(library_id FK CASCADE, movement_id FK CASCADE, position)`, base principale ; un seul service refuse les mutations d'une Bibliothèque `read_only` | faible | non |
| **S-04** Registre | Réemployer `installed_sheets` pour provenance, révision, droits | CONFORME (provenance, révision, empreinte) / PARTIELLEMENT (droits) | Registre l. 30-39 : une copie (BIB-07) n'a pas de ligne, car `movement_id` est unique et la clé est `(catalogue_id, sheet_id)` ; les permissions n'existeraient que dans `sheet_json` | Une copie doit hériter des droits sans fiche source dans le registre ; une garde d'édition lisant une autre base serait asynchrone et fragile | Colonnes `can_edit`, `can_redistribute`, `origin_namespace` dans `movements` (base principale), écrites avec la fiche ; garde unique `isMovementEditable` dans `MovementCatalogueService` (`update`, `createVariant`) ; **le registre reste inchangé** | faible à moyenne | non |
| **S-05** Mises à jour | Réemployer les opérations par fiche ; mécanisme de lot seulement si nécessaire | PARTIELLEMENT CONFORME | Voir axe C | Voir axe C | Ordre d'écriture + deux colonnes ; pas de journal de lot | faible à moyenne | oui (n° 1) |
| **S-06** Diffusion | Pipeline commun fiche/révision/média, Bibliothèque et transmission | NON VÉRIFIABLE (aucun code serveur dans aucune branche) ; CONFORME en conception | §8 l. 304-322 ; PU-06 l. 83-88 | Aucun | Conserver un service commun `deliver(révisions approuvées, destinataire)` à deux portes d'entrée | moyenne | non |
| **S-07** Accès | Droit au niveau Bibliothèque ; transfert par relation individuelle ; commerce séparé | PARTIELLEMENT CONFORME | §5.1 l. 180-181 ; PU-17 l. 161-166 | Le mot « membre » est ambigu (N-08) ; la « preuve de réception » n'a pas de consommateur avant le commerce | Une table `library_recipient(library_id, recipient_actor_id, via, status, first_release_id)`. Le statut `REMOVED` couvre « conserve l'installé, ne reçoit plus de mise à jour ». Preuve distincte différée jusqu'à l'expiration d'accès (A1/A9) | faible | non |
| **S-08** Modération | Contrôle central partagé ; état de blocage local consultable | PARTIELLEMENT CONFORME | §5.2 l. 193 ; PU-15 l. 148-153 ; instantanés PRE-10 contenant les médias (`sessionSnapshot.ts` l. 8-10) | Le placement local et le consommateur ne sont pas fixés ; une neutralisation ne peut pas réécrire les instantanés d'Exécutions reprenables (`READY`, `RUNNING`, `PAUSED`) | Table `moderation_block` en **base principale**, chargée en mémoire au démarrage et à la synchronisation ; la neutralisation s'applique **à l'affichage** (Catalogue, Séance) et jamais par réécriture ; l'écran d'Exécution n'affiche aucun média aujourd'hui (aucune occurrence dans `ExecutionScreen.tsx`) : la garde sera exigée si un média y est affiché | faible | non |
| **S-09** Groupes | Réception nominative d'abord ; groupes reportables | PARTIELLEMENT CONFORME | §4 l. 161 ; T-06 l. 380 | T-06 exige encore un groupe : non réalisable en premier lot | Réécrire T-06 « utilisateurs (puis groupes) » | faible | oui (n° 4) |

**Fusions de tables serveur (C-07, C-17).** Fusionner accès et preuve en `library_recipient` préserve les invariants : F4-C (l'usage acquis est local, car les Mouvements restent installés) et F4-F (le serveur connaît les destinataires actuels et leur statut). Fusionner soumission et signalement en un dossier unique avec `kind` reste traçable à condition que **les décisions restent des lignes distinctes** reliées au dossier ; les acteurs (déposant, signalant) diffèrent et sont donc nullables par `kind`. Ces choix sont **différables** à la conception serveur de L3/L4 : le dossier ne doit pas les figer (il ne le fait pas : §5.1 l. 188).

### Axe B — Identité et homonymes

**Décision attendue.** Des fiches de sources différentes peuvent porter le même nom ; `Movement.id` ne change pas ; ni fusion ni renommage imposé.
**État : PARTIELLEMENT CONFORME** (règle posée, coût de réalisation non mesuré dans la conception).

**Évidence (le nom unique est garanti à cinq endroits).**
1. Base : `CREATE UNIQUE INDEX movements_normalized_name_unique ON movements(normalized_name)` (migration013 l. 102) ; test d'unicité `migration013.test.ts` l. 306-317.
2. Dépôt : `assertNameAvailable` (`SqliteMovementRepository.ts` l. 99-107) et `withNameUniqueness` (l. 111-120), appelés à la création et à la modification.
3. Domaine : `findMovementNameConflict` (`Movement.ts` l. 605-614) et contrat `DuplicateMovementNameError` (`MovementRepository.ts`).
4. Interface : `useMovementOriginChoice.tsx` (l. 198, 244, 329), `CompositionScreen.tsx` (l. 1403), contrôle de brouillon `validation.ts` (l. 594-634), `SessionDraft.ts` (l. 651).
5. Pilote : `localByName` est une `Map` indexée par nom, où **la dernière entrée écrase les autres** (`catalogueLoadPlan.ts` l. 335) ; `NAME_CONFLICT` bloque l'écriture (l. 366-372) ; `TO_RECONCILE` propose le rapprochement d'un homonyme local (l. 404-408).

Ne dépendent pas du nom : la recherche (`instr(normalized_name, ?)` avec tri `normalized_name, id`, l. 510-516, déterministe en présence de doublons), les alias (non uniques globalement, migration013 l. 33-34) et les références des Séances (par `Movement.id`). Seul `SqliteMovementRepository` utilise `normalized_name` hors tests (recherche transversale dans `src`).

**Problème restant.** La migration est simple côté base et diffuse côté application. Si elle n'est pas bornée, elle ouvre la porte à des doublons parmi les créations locales de l'utilisateur, ce que l'application interdit aujourd'hui et que la décision close ne remet pas en cause.

**Correction minimale proposée (complexité moyenne).**
- Ajouter `movements.origin_namespace TEXT NULL` (NULL = création locale ou copie ; renseigné = fiche installée) et remplacer l'index global par un **index unique partiel** : `CREATE UNIQUE INDEX … ON movements(normalized_name) WHERE origin_namespace IS NULL`. Les créations locales gardent exactement la règle actuelle (aucune règle nouvelle) ; les fiches installées ne peuvent jamais échouer à cause d'un homonyme, y compris deux fiches de même nom publiées par un même coach. Le support des index partiels par le SQLite embarqué et par celui des tests est **NON VÉRIFIABLE** ici : à confirmer par un test de migration.
- Dépôt et domaine : l'écriture reçoit l'origine ; `assertNameAvailable` et `findMovementNameConflict` ne contrôlent que les créations locales.
- Pilote : `localByName` devient multivalué ; `NAME_CONFLICT` ne vise que les homonymes **locaux** ; `TO_RECONCILE` est **conservé** (adopter un Mouvement local identique est utile) et l'option « installer séparément » s'ajoute une fois l'index migré.
- Identité : ne pas élargir le type `Movement` ; l'origine se lit par une requête dédiée utilisée pour afficher la source dans les listes.
- **Copie (BIB-07).** `createAsNew` (`MovementCatalogueService.ts` l. 261) existe déjà. La copie est une création locale qui garde provenance et droits ; si un Mouvement local porte déjà son nom, le comportement actuel s'applique (l'utilisateur choisit un autre nom).
- **Écarter** (N-05) l'« espace de noms local persistant non affiché » (§5.4 l. 219) : une création locale n'est enregistrée nulle part avant sa première publication. À cet instant, le serveur alloue un `source_namespace` **opaque** (jamais l'identifiant de l'acteur gestionnaire, pour qu'un transfert de gestion ne change pas l'identité) et `sheet_id` reprend le `Movement.id` d'origine.

**Tests à écrire :** migration (index partiel, données existantes intactes) ; deux fiches installées de même nom ; local + installé de même nom ; deux locaux refusés ; planificateur avec plusieurs homonymes ; recherche et tri avec doublons ; familles et niveaux inchangés.
**Arbitrage :** oui, sur l'affichage des homonymes et le nom des copies (§5, n° 2).

### Axe C — Synchronisation et cohérence

**Décision attendue.** Un « Mettre à jour » applique composition et révisions, sans mise à jour silencieuse, de façon idempotente et reprenable, en préservant retraits et adaptations.
**État : PARTIELLEMENT CONFORME.**

**Ce que le pilote garantit, preuve à l'appui.**
- Par fiche : `beginPending` → écriture du Mouvement → `commit` dans une transaction exclusive du registre (`SqliteCatalogueRegistry` l. 134-180 ; `CatalogueLoadService.write` l. 241-260). Reprise : `recoverInterrupted` confirme ce qui a été écrit (`sameProjected`) et abandonne le reste (l. 114-139), appelée par `prepare` (l. 105).
- Idempotence : une fiche à révision et empreinte identiques est `UP_TO_DATE` (`catalogueLoadPlan.ts` l. 380-383) ; rejouer une mise à jour terminée ne change rien.

**Ce qu'il ne garantit pas.**
- Aucun lot : l'acceptation est fiche par fiche ; il n'existe ni composition ni pointeur de release.
- La reprise est **limitée à un catalogue** : `snapshot(catalogueId)` ne lit que les opérations en cours de ce catalogue (registre l. 117-118). Une Bibliothèque redistribuée mêle des fiches de plusieurs espaces de noms.
- Les décisions `REFUSED`/`DEFERRED` du canal « fichier catalogue » rendraient une fiche `REFUSED_REVISION` (`catalogueLoadPlan.ts` l. 395) ; BIB-12 écarte Accepter/Refuser/Reporter pour la distribution.
- Seuls cinq champs sont projetés sur le Mouvement : nom, alias, étapes, catégorie, zones (`PROJECTED_FIELDS` l. 79) ; médias, phases et famille ne sont jamais modifiés (en-tête de `CatalogueLoadService`). Les médias reçus sont à concevoir.

**Options comparées.**

| Option | Mécanisme | Complexité | Verdict |
|---|---|---|---|
| 1 | Ordre d'écriture : (a) toutes les fiches par le protocole existant ; (b) **une transaction de la base principale** qui remplace la composition et avance `installed_release_id` ; reprise par relecture | faible à moyenne | **Recommandée** |
| 2 | Enregistrement de lot (`pending_library_update`) dans le registre | moyenne | Écartée : duplique `pending_operations` pour un gain nul |
| 3 | Fusion du registre dans la base principale (transaction unique) | forte | Écartée maintenant (à réévaluer après PRE-10, comme décidé) |

**Pourquoi l'option 1 suffit.**
- Les clés étrangères de `library_member` vers `movements` imposent que chaque fiche existe avant la composition : l'invariant « aucun membre vers une fiche absente » (§6.1 l. 240) est garanti par le schéma.
- `installed_release_id` n'avance que dans la transaction finale ; `target_release_id` est renseigné au début et effacé à la fin : une mise à jour interrompue est **visible** (`target_release_id` non nul) et jamais présentée comme réussie.
- Coupure entre deux fiches : les fiches terminées sont `UP_TO_DATE`, la relance continue. Coupure avant la transaction finale : composition ancienne conservée, relance sans effet sur les fiches terminées. Coupure pendant la transaction : SQLite garantit tout ou rien.
- Seul effet observable d'une interruption : des Mouvements nouvellement installés apparaissent dans le Catalogue avant d'être dans la composition ; la reprise automatique au démarrage le résorbe.
- Les retraits ne suppriment que des lignes d'association : Mouvements et Séances restent (F4-B).

**Correction minimale (complexité faible à moyenne).** Colonnes `installed_release_id` et `target_release_id` (déjà prévues en S-03) ; `recoverAll` (toutes les opérations en cours, tous espaces de noms) appelé au démarrage et avant « Mettre à jour » ; le planificateur de la Bibliothèque ignore les décisions du canal fichier ; aucun journal de lot.
**Tests à écrire :** coupure entre deux fiches ; coupure avant la transaction finale ; relance après réussite (aucun changement) ; Bibliothèque mêlant deux espaces de noms ; fiche en conflit local ; Mouvement retiré conservé ; F4-G (l'instantané d'une Exécution existante est inchangé après mise à jour).
**Arbitrage :** oui, sur le sort d'une fiche en conflit local (§5, n° 1).

### Axe D — Permissions et distribution

| Cas | Règle documentée | État | Évidence | Reste |
|---|---|---|---|---|
| Première publication par le propriétaire habilité | Publiable même « Protégée » pour les destinataires ; droits choisis à la première diffusion | CONFORME (règle) | Registre BIB-06 ; PU-05 l. 78-80 ; PU-06 l. 86 | « Propriétaire habilité » non défini (parcours §5 l. 211). Définition minimale : l'acteur qui a alloué le `source_namespace` de la fiche, ou l'organisation qu'il y a désignée explicitement. **Une copie ou une adaptation d'une fiche tierce n'est jamais « propre » : sa diffusion relève du droit Redistribuer** |
| Redistribution par un destinataire | Droit Redistribuer de la révision, contrôle serveur | CONFORME (règle) | PU-05, §8 l. 322 | Recalculer la redistribuabilité à la livraison, non seulement à la publication (C-21) |
| Accès par Bibliothèque | Droit au niveau Bibliothèque, usage acquis conservé | PARTIELLEMENT CONFORME | F4-C ; §3.1 l. 92 | Vocabulaire « membre » (N-08) ; groupes (S-09) ; statut `REMOVED` à documenter |
| Transmission individuelle (Espace en étoile) | Relation orientée, invitation acceptée, refus, blocage, pas de rôle professionnel ni de prescription | PARTIELLEMENT CONFORME | PU-17 l. 161-166 ; §5.1 l. 181 | Fin de relation, conservation, mises à jour restent « À CLARIFIER » (l. 166) : voir §5, n° 5 |
| Suspension de modération | Prioritaire sur droits, achats et mises à jour | CONFORME (règle) | BIB-16/17 ; PU-15 | Placement local : S-08 |
| Droits propres aux médias | Les droits d'une fiche ne suffisent pas à publier un média tiers | NON CONFORME (règle de distribution absente) | §5.1 l. 178 ; le format pilote porte `rightsStatus` par média (`MovementCatalogueFile.ts` l. 32, 65, 561-564) | Règle minimale : un média ne part que si la fiche est redistribuable **et** son droit confirmé (ou média de l'auteur) ; sinon la fiche part sans média, comme pour un retrait de modération (§5, n° 3) |

**Neutralité santé (C-11).** La conception conserve la limite (PU-17 l. 166). Restent trois écarts documentaires (N-07) : le chapitre 02 l. 125 (« un kinésithérapeute, un coach, un professionnel de santé … transmet une Séance »), le chapitre 03 l. 133 et 571-577 (« Professionnels de santé et coachs », « suivre l'exécution des séances réalisées par un patient ou un client », « gérer plusieurs patients »), le chapitre 05 l. 440, et la conception technique l. 326 (« données de santé associées à un coach/kiné »).

### Axe E — Compatibilité applicative

- **Migrations.** `main` = version 23 ; `pre10-bmad/dev` = 24 (`executions`, `execution_results`, index partiel `executions_unfinished`) ; un plan A.5 « non autorisé » attend la prochaine version (`constants.ts` l. 140). **Quatorze fichiers de test** figent la valeur littérale de `DATABASE_VERSION` (12 fichiers `migrationNNN.test.ts`, `migrateDatabase.test.ts`, `executionParametersV3.roundTrip.test.ts`) : chaque migration les modifie. Règle à consigner (R-01) : le numéro est attribué à la fusion, dans l'ordre d'arrivée, après le numéro courant de `main`.
- **Tables à ajouter** (base principale, additives, aucune table existante modifiée) : `library`, `library_member`, colonnes sur `movements`, `moderation_block`. **Registre pilote inchangé** (schéma v1) : aucune croissance de la base provisoire.
- **PRE-10.** Aucune table ni code du moteur n'est à modifier. Les Exécutions n'ont pas de clé étrangère vers la Séance (`migration024.ts` l. 19-20) et portent un instantané gelé. Limite à consigner dans BIB-17 : une neutralisation s'applique à l'affichage ; l'instantané d'une Exécution reprenable n'est pas réécrit.
- **Import des 60 fiches.** `authors[]` et le défaut de droits restent à rapprocher (C-13) ; le pilote reste fonctionnel tant que `NAME_CONFLICT` est conservé, ce qui est le cas avant migration de l'index. La branche pilote a 3 commits de retard et PRE-10 11 d'avance : l'ordre de fusion (pilote, PRE-10, Bibliothèques) conditionne la numérotation.
- **Risques de régression :** tests d'unicité du nom (migration013), duplication de Mouvement, planificateur du pilote, 14 tests de version. Aucun ne touche le moteur.

---

## 3. Classement des recommandations

| ID | Recommandation | Classe | Lot butoir | Complexité |
|---|---|---|---|---|
| R-01 | Consigner la règle « le numéro de migration est le prochain disponible à la fusion » ; retirer « 024 » des documents et du plan | **INDISPENSABLE AVANT DÉVELOPPEMENT** | L1 | faible |
| R-02 | Migration de l'identité : `origin_namespace`, index unique partiel sur les créations locales, contrôles applicatifs bornés | **INDISPENSABLE AVANT DÉVELOPPEMENT** | L4 | moyenne |
| R-03 | Droits locaux dans `movements` (`can_edit`, `can_redistribute`) et garde unique `isMovementEditable` ; copie qui hérite | **INDISPENSABLE AVANT DÉVELOPPEMENT** | L2 | faible à moyenne |
| R-04 | Mise à jour de lot : ordre d'écriture, `installed_release_id` et `target_release_id`, `recoverAll`, tests de coupure | **INDISPENSABLE AVANT DÉVELOPPEMENT** | L5 | faible à moyenne |
| R-05 | Pilote : `localByName` multivalué ; `NAME_CONFLICT` limité aux homonymes locaux ; `TO_RECONCILE` conservé | **INDISPENSABLE AVANT DÉVELOPPEMENT** | L4 (avec R-02) | faible |
| R-06 | Corrections documentaires listées en §4 (backticks, chapitres 02/03/05, plan de lots, T-06, glossaire) | **INDISPENSABLE AVANT DÉVELOPPEMENT** | avant L2 ; glossaire avant la maquette du Profil | faible |
| R-07 | Règle des fiches en conflit local lors de « Mettre à jour » (arbitrage n° 1) | **INDISPENSABLE AVANT DÉVELOPPEMENT** | L5 | faible |
| R-08 | `library_recipient` unique (accès et preuve) | DIFFÉRABLE | L4 | faible |
| R-09 | Dossier de modération unique avec `kind` et décisions distinctes | DIFFÉRABLE | L3 | faible |
| R-10 | Groupes (réception nominative d'abord) | DIFFÉRABLE | après L4 | moyenne |
| R-11 | Règle des médias sans droit confirmé ; garde d'affichage `moderation_block` | DIFFÉRABLE | L3/L5 | faible |
| R-12 | Suppression de compte, blocage d'utilisateur, conditions acceptées, coordonnées (obligations des stores, C-12) | DIFFÉRABLE | L2/L3 | moyenne |
| R-13 | Restriction ultérieure de droits (A3) : nouvelle révision, installations conservées | DIFFÉRABLE | L2 | faible |
| R-14 | Alignement du format pilote (`author` unique, `visibility`, révisions) ; remise à niveau de la branche pilote et CI | DIFFÉRABLE | L1b/L4 | moyenne |
| R-15 | Remplacer les littéraux `DATABASE_VERSION` des 14 tests par la constante | DIFFÉRABLE | à la prochaine migration | faible |
| R-16 | Journal de lot (`local_update_journal`, `pending_library_update`) | **À ÉCARTER POUR SURCOMPLEXITÉ** | — | — |
| R-17 | Fusion du registre dans la base principale maintenant | **À ÉCARTER POUR SURCOMPLEXITÉ** | — | — |
| R-18 | Espace de noms local persistant non affiché (§5.4) | **À ÉCARTER POUR SURCOMPLEXITÉ** | — | — |
| R-19 | Suffixe numéroté stocké à l'installation (mon C-02) | **À ÉCARTER POUR SURCOMPLEXITÉ** | — | — |
| R-20 | Versions actives par Bibliothèque, `local_sheet_revision_cache`, `library_draft_member` serveur | **À ÉCARTER POUR SURCOMPLEXITÉ** | — | — |
| R-21 | Annexes « Correspondance des sections » et « Historique des consolidations » : y ajouter BIB/F4/KIN | **À ÉCARTER POUR SURCOMPLEXITÉ** | — | — |

---

## 4. Corrections documentaires à transmettre à ChatGPT

1. **Conception technique, blocs de code** : 40 occurrences de `\`` ; le bloc des §4, §5.3 et §7.1 (`\`\`\`text`) s'affiche en texte brut et les diagrammes perdent leurs retours à la ligne (l. 121-145, 200-212, 272-282). Réécrire avec de vrais backticks (N-06).
2. **Même document, §5.2 et §10** : remplacer toute mention d'un numéro de migration par la règle R-01 ; décrire S-03 (colonnes `installed_release_id` et `target_release_id`), S-04 (droits dans `movements`), R-02 et R-04 ; indiquer que le registre pilote reste inchangé.
3. **§5.4** : retirer l'espace de noms local persistant ; dire que `sheet_id` reprend `Movement.id` à la première publication et que le `source_namespace` est alloué par le serveur.
4. **§9 l. 326** : supprimer « données de santé associées à un coach/kiné ».
5. **§11, plan de lots** : L1 cite « copie à permissions héritées après raccordement des droits » (l. 362) et L2 la reprend (l. 363) : la placer en L2 seulement ; ajouter un lot de transmission individuelle (PU-17) et rattacher l'identité (comptes, suppression de compte) à L2 ; lister en L3 les exigences des stores (signalement, blocage, conditions, coordonnées).
6. **§12, T-06** : « à des utilisateurs (puis des groupes) » ; ajouter les tests de §2 (axes B et C).
7. **Chapitres 02 l. 125, 03 l. 133 et 571-577, 05 l. 440** : retirer le suivi d'exécution des patients et la gestion de plusieurs patients (arbitrage n° 6).
8. **Registre 07 (BIB-17) et PU-15** : consigner la limite « neutralisation à l'affichage ; instantané d'Exécution non réécrit ».
9. **Vocabulaire** : réserver « membre » à la personne destinataire et « fiche » à la composition (F4-C l. 44, §3.1 l. 92, `MemberRef` l. 204).
10. **Parcours §5 l. 211** : définir « propriétaire habilité » (axe D).
11. **Annexes** : « Index des identifiants » (26 occurrences BIB/F4/KIN) et « Matrice de traçabilité » (9) sont à jour. Rien à ajouter ailleurs (R-21).

---

## 5. Derniers points à résoudre (arbitrages de Hermann)

| n° | Question | Recommandation | Ce qui fait pencher |
|---|---|---|---|
| 1 | Lors d'un « Mettre à jour », une fiche modifiée localement sur le même champ bloque-t-elle toute la mise à jour ? | **Non** : tout est appliqué sauf cette fiche, conservée telle quelle et signalée au résultat | Tout-ou-rien gèlerait une Bibliothèque entière à cause d'une seule modification personnelle. Les fiches Protégées ne peuvent pas être en conflit |
| 2 | Deux fiches de même nom : comment les distinguer, et comment nommer une copie ? | Aucun suffixe stocké ; la liste affiche la source sous le nom quand des homonymes existent ; une copie garde son nom, et en cas de nom local déjà pris l'utilisateur en choisit un autre (comportement actuel) | Le suffixe « (2) » avait pour seul but de préserver l'index global ; la décision close le rend inutile |
| 3 | Droits : une restriction ultérieure agit-elle sur l'installé ? Un média sans droit confirmé est-il diffusé ? | Restriction = nouvelle révision, installations conservées ; média sans droit confirmé : la fiche part sans le média | Cohérent avec F4-A, F4-B et avec la modération des médias seuls |
| 4 | Groupes dès le premier lot de partage ? | Non : destinataires nominatifs ou par lien d'invitation d'abord | La gouvernance des groupes n'est pas arbitrée ; la table de destinataires l'accepte plus tard |
| 5 | Fin de relation de l'Espace en étoile, suppression du compte d'un expéditeur : que devient l'installé ? | Le destinataire conserve ; plus de transmission ni de mise à jour ; nouvelle version = retransmission explicite | Même principe que F4-B et F4-C |
| 6 | Garde-t-on au chapitres 02, 03 et 05 la vision « professionnels de santé » avec suivi des patients ? | Non : retirer ; garder « utilisateur accompagné » sans notion de professionnel | Suivre l'exécution d'un patient est une donnée de santé, contraire à KIN-01 |
| 7 | Vocabulaire du Profil : quel mot pour la composition reçue, quel mot pour le canal de recette ? | « Bibliothèques » pour la composition ; un autre mot pour le canal de recette (fichier ou administration locale) | À trancher avant de maquetter l'écran du Profil |

Les autres points « À CLARIFIER » du dossier (accès payant, nouvel appareil, détails d'écran) n'exigent aucune décision avant L5.

---

## 6. Statut des constats de la première revue

| Statut | Constats |
|---|---|
| **RÉSOLU** (2) | C-01 (F4-G, PU-08, T-12) ; C-15 (lignes obsolètes retirées des chapitres 05 et 10, annexes d'identifiants et de traçabilité à jour) |
| **CONFORME, confirmé** (4) | C-24, C-25, C-26, C-27 |
| **REMPLACÉ** (1) | C-02 : le suffixe est caduc ; la question devient R-02 et R-05 |
| **CORRIGÉ** (1) | C-28 : PRE-10 existe ; compatibilité vérifiée au §2 ; migration à renuméroter |
| **PARTIELLEMENT RÉSOLU** (6) | C-04 (droits par révision documentés ; reste A3, R-13) ; C-06 (placement posé ; reprise de lot traitée ici) ; C-10 (relation et transfert documentés ; reste la fin de relation) ; C-11 (limite posée ; écarts N-07) ; C-14 (action unique posée ; reste la règle de conflit) ; C-17 (simplifications candidates listées ; fusions différées) |
| **TOUJOURS PERTINENT** (14) | C-03 (R-03) ; C-05 (S-08) ; C-07 (R-08) ; C-08 (R-10) ; C-09 (R-11) ; C-12 (R-12) ; C-13 (R-14) ; C-16 (R-06) ; C-18 (arbitrage n° 7) ; C-19 ; C-20 (aggravé : PRE-10 en avance) ; C-21 ; C-22 ; C-23 |

---

## 7. Décompte et recommandation finale

| Gravité | Nouveaux constats | Détail |
|---|---|---|
| Bloquant | 0 | — |
| Important | 5 | N-01, N-02, N-03, N-04, N-07 |
| Amélioration | 3 | N-05, N-06, N-08 |
| **Total** | **8** | |

Dans la première revue, 4 constats étaient bloquants : un est résolu (C-01), un est remplacé (C-02), un demeure pour le lot L2 (C-03), un est ramené à un point d'arbitrage (C-04, A3).

**Recommandation finale : À CORRIGER AVANT DÉVELOPPEMENT.** Les corrections sont ciblées et ne remettent en cause aucune décision validée. Le lot L1 peut démarrer dès que R-01 est consigné. L2 attend R-03, R-06 et l'arbitrage n° 3. L4 attend R-02, R-05 et l'arbitrage n° 2. L5 attend R-04 et l'arbitrage n° 1.

**Limites de la revue.** Tests non exécutés ; support de l'index partiel non vérifié par exécution ; aucun code serveur n'existe, les points S-06 et S-08 côté serveur sont évalués en conception ; aucune vérification juridique ; aucune modification de Figma, de code, de spécification ni de la branche examinée.
