# KODJO — Revue indépendante : Mouvements, Bibliothèques, droits, mises à jour, modération, Espaces professionnels

**Date :** 10 novembre 2026 · **Nature :** audit exclusivement (aucun développement, aucune correction de spécification, aucune modification Figma, aucune fusion).
**Destinataire :** ChatGPT (consolidation, arbitrages avec Hermann, corrections documentaires).

## 0. Périmètre vérifié et méthode

| Élément | Valeur vérifiée |
|---|---|
| Dépôt | `MyUncried/Application-Routine` |
| Branche auditée | `docs/conception-bibliotheques-partage-moderation-20261110` → `acb32663a8456544b5775460af1041feb72361a2` (46 commits d'avance, basée sur la tête actuelle de `main`, `7e5fb6a2`) |
| Baseline code | `main` → `7e5fb6a29b2c6ba1de23d6b55dad9d8ff670d88d` (PR #436) |
| Source complémentaire | `catalogue/integration-60-main-20261109` → `7b43c2d5dec3f6f37556b1fbc3e2ea26776f2b07` (14 commits d'avance, **3 commits de retard** sur `main` ; fusion à blanc dans `main` sans conflit, `git merge-tree`) |
| Figma | `G6RY5Ebhgwb4AHIOYDwwvg`, lecture seule, page Prototype MVP `510:101` et autres pages |

**Lus intégralement :** PU-01 à PU-17 ; dossier de conception fonctionnelle, technique et données ; conception initiale (BIB-01 à 18) ; documents de provenance et de format de catalogue (branche catalogue) ; plan `CATALOGUE-CONNECTÉ` (branche catalogue, `.github/orchestration/reports/2026-11-10_CATALOGUE-CONNECTE-PLAN.md`).
**Lus par différentiel ciblé (changements de la branche) :** registre 07, chapitres 05, 09, 10, 11, 12 ; recherche transversale de BIB/F4/KIN-01 dans PRODUCT, INDEX, chapitres 01 à 13 et annexes. Les chapitres 02, 03, 04, 08, 13 n'ont été contrôlés que par recherche de termes (pas de relecture intégrale) : **partiellement vérifié**.
**Code lu :** `MovementEditorialProvenance.ts`, `MovementCatalogueFile.ts` (extraits), `catalogueLoadPlan.ts`, `CatalogueLoadService.ts` (extraits), `SqliteCatalogueRegistry.ts` (branche catalogue) ; migrations 012/013 et constantes de base (main). Corpus `kodjo-pilote-60.catalogue.json` analysé.
**Non exécuté :** les tests Jest des deux branches (dépendances non installées). Aucune affirmation « le test passe » n'est faite ; statut NON VÉRIFIABLE là où la preuve serait un test.
**Vérifications externes (obligations) :** Apple App Review Guidelines (1.2, 5.1.1(v)) ; politique Google Play « User Generated Content » ; DSA article 19 ; HDS (article L.1111-8 CSP, esante.gouv.fr). Sources en annexe. Chaque point est classé *obligation vérifiée* ou *recommandation de conception*.

Légende gravité : **Bloquant** = à lever avant de démarrer le développement du lot indiqué (pas forcément de tout le projet) ; **Important** = à corriger avant la fin de conception, sans arrêter un lot ; **Amélioration** = utile, différable.

---

## A. Synthèse exécutive

**État global : À CORRIGER AVANT DÉVELOPPEMENT** (pas de révision structurelle).

**Points solides.**
1. Le cœur fonctionnel est cohérent et bien arbitré : références sans copie (BIB-03), droits de fiche séparés des droits d'accès (BIB-06 / F4-C), mise à jour volontaire (BIB-12 / F4-A), conservation locale (F4-B), archivage ≠ diffusion (F4-E/F), modération prioritaire (BIB-16/17).
2. La séparation en cinq domaines logiques sans microservices est proportionnée. Le choix d'un backend modulaire unique est le bon.
3. Le dossier distingue honnêtement décisions validées, propositions et « À CLARIFIER », et ne déclare aucun parcours Figma validé (vérifié : aucun écran Bibliothèque / partage / modération dans Figma).
4. KIN-01 est correctement cadré : pas de prescription numérique, pas de Bibliothèque fictive.
5. L'intégrité des Séances est **déjà garantie par le schéma de `main`** : `activity_definitions.movement_id … ON DELETE RESTRICT` (migration013 l. 135-141) ; retirer un Mouvement d'une composition n'affecte donc ni Exercices ni Séances.

**Principales faiblesses.**
1. **Le mécanisme proposé pour « une même fiche dans plusieurs Bibliothèques à versions différentes » (pointeur de révision *par Bibliothèque*) est incompatible avec le modèle local réel** : un Mouvement n'a qu'un contenu, que les Séances référencent par `Movement.id`, et `movements.normalized_name` est unique (C-01). Il faut une seule révision active par fiche source et par appareil.
2. **Les permissions Modifier/Redistribuer n'ont aucun support local** : ni dans `main`, ni dans le format pilote (qui ne porte qu'une `license`). Sans point d'application local unique, « Protégé » n'est pas garanti (C-03), et leur portée (fiche ou révision, défaut, changement) n'est pas arbitrée (C-04).
3. **Collision de noms** entre fiches de sources différentes : contrainte d'unicité de `main` structurante, pas de politique d'installation (C-02).
4. **Schéma cible surdimensionné** : 3 tables locales et 3 tables serveur sans nécessité démontrée (C-17) ; groupes exigés (F4-C, T-06) mais non modélisés (C-08).
5. **Kiné-patient** : concept juste, modèle minimal absent (relation, consentement, transfert) ; **données de santé / HDS non analysées** (C-10, C-11).
6. **Obligations des stores et DSA** (blocage d'utilisateur, contact, suppression de compte, notification-et-action) non reprises (C-12).
7. **Propagation documentaire incomplète** : règles obsolètes subsistant en ch. 05/10 ; décisions absentes des annexes d'identifiants et de traçabilité (C-15).

**Décompte :** 4 bloquants, 13 importants, 11 améliorations (dont 5 constats CONFORME) = **28 constats**. Détail en fin de document (§H).

**Conséquence pratique.** Les Bibliothèques **locales personnelles** (PU-01, 02, 13) peuvent démarrer sans attendre, sous réserve de C-06 (placement des tables) et de C-16 (retirer la « copie à permissions héritées » du lot L1). Tout ce qui touche à la réception, aux droits, à la mise à jour et au kiné est conditionné par les arbitrages du §E.

---

## Constats détaillés

> Format : `ID · Axe · Gravité · Statut · Arbitrage`, puis Constat / Évidence / Conséquence / Correction proposée.

### C-01 — Pointeur de révision par Bibliothèque incompatible avec un Mouvement local unique
**Axe :** Mise à jour et intégrité (5) · **Gravité :** Bloquant (lot L5) · **Statut :** NON CONFORME · **Arbitrage nécessaire :** Oui
**Constat.** Le dossier propose « plusieurs révisions immuables par `sheet_id` avec un pointeur de version **par Bibliothèque reçue** » (§6.2) et le test T-12 exige « aucun changement silencieux dans la Bibliothèque non mise à jour ». Or l'exécution lit un **seul Mouvement local** : une fiche installée donne une ligne `movements`, référencée par `Movement.id` depuis `activity_definitions`. Le contenu d'une Séance ne peut pas dépendre de la Bibliothèque par laquelle on l'a atteint. Deux Mouvements locaux pour deux révisions sont impossibles tel quel (index unique de nom) et casseraient « une fiche source → un Mouvement local » (PU-08, formulé « pas systématiquement », ce qui est ambigu).
**Évidence.** Conception §6.2 (l. 232-238) et §5.2 `local_sheet_revision_cache` (l. 185) ; PU-08 (« ne crée pas systématiquement plusieurs Mouvement locaux ») ; T-12 (l. 372) ; `main` migration013 l. 102 (`movements_normalized_name_unique`) et l. 135-141 ; registre pilote `installed_sheets … movement_id TEXT NOT NULL UNIQUE`, PK `(catalogue_id, sheet_id)` (SqliteCatalogueRegistry l. 33-39), qui implémente déjà « une révision installée par fiche ».
**Conséquence.** Implémenter le pointeur par Bibliothèque ajouterait un cache de révisions et une projection sans consommateur réel, tout en laissant la question centrale (quelle version une Séance utilise-t-elle ?) sans réponse.
**Correction proposée (une seule révision active par fiche source et par appareil).**
- Option A *(recommandée, complexité faible)* : la mise à jour de la Bibliothèque A installe la révision cible de chaque fiche, y compris celles que B référence. L'aperçu de mise à jour (PU-10) **liste explicitement** les fiches partagées avec d'autres Bibliothèques reçues (« aussi présente dans B »). Les Bibliothèques B affichent alors la fiche à la révision installée ; leur propre pastille ne concerne plus que leur composition. Aucun changement n'est silencieux : il découle d'une action explicite avec avertissement. Ajuster T-12 en conséquence.
- Option B *(complexité moyenne)* : une fiche partagée avec une Bibliothèque restée en retard n'est **pas** avancée (report par fiche, sémantique `DEFERRED` du pilote) ; la mise à jour de A applique le reste et signale « fiche conservée à la révision r, utilisée par B ». Réutilise le plan de chargement existant, au prix d'un état « verrouillée par une autre Bibliothèque ».
- Option C *(complexité forte, déconseillée)* : plusieurs Mouvements locaux par fiche. Exige de lever l'unicité de nom, de redéfinir les références des Séances. Rejetée.
- Retirer `local_sheet_revision_cache` du schéma local : le registre conserve déjà l'instantané installé (`sheet_json`). Une révision plus récente n'est téléchargée qu'au moment d'« Mettre à jour ».

### C-02 — Collision de noms entre fiches de sources différentes sans politique d'installation
**Axe :** Données (4) · **Gravité :** Bloquant (lot L4) · **Statut :** À CLARIFIER · **Arbitrage :** Oui
**Constat.** `movements.normalized_name` est unique (migration013 l. 102). Deux sources proposant « Squat » ne peuvent coexister. Le dossier (§5.4, T-17) interdit l'écrasement et la renumérotation cachée mais ne donne pas de règle. Le pilote bloque déjà (`NAME_CONFLICT`, `TO_RECONCILE`, catalogueLoadPlan l. 147, 370, 404-408) : c'est une **règle de développement du pilote, non une règle produit**.
**Évidence.** Conception §5.4 (l. 214), T-17 (l. 377), PU-04 « Réserve » ; catalogueLoadPlan l. 366-372.
**Conséquence.** Sans règle, une Bibliothèque reçue contenant « Squat » ne peut s'installer si l'utilisateur en possède un : blocage de PU-08 pour un cas banal (les coachs nomment leurs fiches comme les autres).
**Correction proposée.** Conserver l'index unique (pas de migration d'une contrainte transversale). À l'installation, attribuer automatiquement un **suffixe numéroté** au nom local (« Squat (2) »), sans confirmation, selon la convention déjà utilisée pour « (copie) ». Le numéro est attribué une fois et ne change plus. Le nom reste modifiable localement ; traité comme champ modifié localement, il n'est pas écrasé par une mise à jour (seul ce champ est reporté si la source le renomme). La source reste visible dans la provenance de la fiche. Complexité : faible.
Alternative déconseillée : index unique `(normalized_name, source)` (migration d'une contrainte utilisée par création, copie, import et recherche ; complexité forte).

### C-03 — Permissions Modifier / Redistribuer sans support local ni point d'application
**Axe :** Données / compatibilité (4, 7) · **Gravité :** Bloquant (lots L2 et L4) · **Statut :** NON CONFORME (absent) · **Arbitrage :** Non
**Constat.** Ni `main` (aucune occurrence de permission d'édition ou de redistribution dans `src`) ni le format pilote (`license` seule, `MovementEditorialProvenance` l. 60) ne portent `canEdit` / `canRedistribute`. L'édition d'un Mouvement local n'interroge aucun garde. « Protégé : copie non modifiable » (PU-04, critère 5) n'est donc pas applicable aujourd'hui. `permissions_snapshot` est prévu (§5.2) mais aucun consommateur n'est désigné.
**Évidence.** Conception §5.1 `editorial_sheet.can_edit` (l. 156), §5.2 `local_sheet_installation.permissions_snapshot` (l. 184) ; absence de code constatée par recherche dans `main`.
**Conséquence.** Les quatre modes resteraient déclaratifs : un destinataire pourrait modifier une fiche Protégée via les écrans existants.
**Correction proposée.** Stocker les droits dans l'enregistrement d'installation (registre, dans l'instantané de fiche) et créer **un seul point** `isMovementEditable(movementId)` appelé par les cas d'usage d'édition de Mouvement. Aucune ligne dans le registre = création locale = éditable. Une copie hérite de l'enregistrement. Complexité : faible à moyenne (un garde, pas de refonte). Aucune dépendance au moteur PRE-10.

### C-04 — Portée, défaut et évolution des permissions (A3/A4) : à fixer avant le modèle serveur
**Axe :** Fonctionnel / données · **Gravité :** Bloquant (lot L2) · **Statut :** À CLARIFIER · **Arbitrage :** Oui
**Constat.** Les permissions sont portées par `editorial_sheet` (§5.1), donc **par fiche et non par révision**. Un changement de permission n'est ni versionné ni validé ; il s'appliquerait rétroactivement et silencieusement aux installations, ce qui contredit F4-A et la règle « un changement de permission ne doit jamais révéler rétroactivement un contenu » (conception initiale §2.2). Le défaut à la création (A4) et la sémantique de retrait (A3) sont ouverts.
**Évidence.** Conception §5.1 (l. 156-157), §13 A3/A4 (l. 386-387) ; conception initiale §2.2, §7.4 et 7.6.
**Conséquence.** Impossible de figer `sheet_revision` (contenu immuable) ni de calculer la projection distribuée sans connaître cette règle.
**Correction proposée.**
- Porter `can_edit` / `can_redistribute` **sur la révision** (immuable, approuvée avec son empreinte) : un changement de droits = nouvelle révision, validée, proposée par « Mettre à jour ». Cohérent avec F4-A et avec la validation centrale.
- Défaut à la création locale : « Libre localement » (aucune redistribution tant que l'utilisateur ne la décide pas). Défaut des fiches issues d'un import externe de provenance inconnue : « Protégé » et non diffusable (déjà imposé par `owner = null`).
- Retrait du droit de redistribuer : n'agit que sur les **futures** diffusions ; les installations existantes gardent leurs droits d'usage (F4-C).
À valider par Hermann (§E-4).

### C-05 — Neutralisation locale d'un contenu modéré : aucun état de support
**Axe :** Sécurité / compatibilité (6, 7) · **Gravité :** Important · **Statut :** PARTIELLEMENT CONFORME · **Arbitrage :** Non
**Constat.** La règle est juste (BIB-17 : neutraliser sans détruire les références). Mais `activity_definitions.movement_id` est `ON DELETE RESTRICT` : un Mouvement référencé **ne peut pas** être supprimé, et `movements` n'a aucun statut de blocage. `local_moderation_registry` est prévu (§5.2) sans préciser l'emplacement (base principale ou registre) ni qui le consulte au rendu.
**Évidence.** Conception §5.2 (l. 188), PU-15 ; migration013 l. 135-141.
**Conséquence.** Sans consommateur défini, la neutralisation reste théorique ; la lecture croisée de deux bases SQLite à chaque affichage est coûteuse et fragile (incident de relecture du 9/11, cf. en-tête de `SqliteCatalogueRegistry`).
**Correction proposée.** Table `moderation_block` dans le registre, **chargée en mémoire au démarrage et à la synchronisation** ; les écrans et le service Mouvement masquent description et médias d'un contenu bloqué mais gardent nom et identifiant (les Séances restent lisibles). Ne rien supprimer. Le moteur PRE-10 n'étant pas développé, sa tolérance à une fiche neutralisée est **NON VÉRIFIABLE** : à inscrire comme exigence de PRE-10, sans refonte.

### C-06 — Placement des tables locales et intégrité sur deux bases SQLite
**Axe :** Architecture / compatibilité (3, 7) · **Gravité :** Important · **Statut :** PARTIELLEMENT CONFORME · **Arbitrage :** Non (recommandation)
**Constat.** Le registre pilote est une **base distincte provisoire** (`kodjo-catalogue-registry.db`, décision de Hermann), sans clé étrangère vers `movements`. Les tables locales de Bibliothèque (§5.2) ne précisent pas leur base. Les Bibliothèques personnelles (PU-01/02, hors réseau) doivent référencer des Mouvements avec cascade à la suppression. Le « journal de mise à jour » (`local_update_journal`) est proposé alors que le protocole du pilote (`beginPending` → écriture Mouvement → `commit`, `recoverInterrupted`) couvre déjà la reprise par fiche (`CatalogueLoadService` l. 105-114, 250 ; état `INTERRUPTED`).
**Évidence.** SqliteCatalogueRegistry l. 1-26, 121 ; CatalogueLoadService l. 105-114 ; Conception §6.4 (l. 247-252), §5.2.
**Conséquence.** Placer les associations dans le registre priverait les Bibliothèques de l'intégrité référentielle ; ajouter un second journal doublerait un mécanisme qui fonctionne.
**Correction proposée.**
- **`library` + `library_member` dans la base principale** (migration 024, `DATABASE_VERSION` 23 → 24, FK `ON DELETE CASCADE` vers `movements`) : pas de dépendance réseau, démarrage possible dès L1.
- Dans le registre : `installed_sheets` (existant, enrichi des droits, C-03), `installed_library` (pointeur de release installée) et `moderation_block`.
- **Supprimer `local_update_journal`.** La mise à jour d'une Bibliothèque = N opérations par fiche (déjà reprenables) puis écriture du pointeur de release **en dernier** ; le plan est recalculable après interruption et l'état est dérivé (toutes les fiches `UP_TO_DATE` ou reportées). Idempotence assurée par la comparaison d'empreintes.
- Alternative (complexité moyenne) : fusionner le registre dans la base principale (migration 024) pour une vraie transaction unique. À réévaluer après PRE-10, comme décidé ; non nécessaire pour L1 à L5.

### C-07 — Accès « public / gratuit » incompatible avec `library_access_grant` par destinataire
**Axe :** Données (4) · **Gravité :** Important · **Statut :** PARTIELLEMENT CONFORME · **Arbitrage :** Non
**Constat.** `library_access_grant` est défini pour des destinataires nominatifs. Une Bibliothèque publique gratuite (PU-09) n'a pas de grant. Or F4-F (« destinataires existants ») et la mise à jour exigent que le serveur **connaisse** les destinataires d'une Bibliothèque publique. `distribution_record` couvre ce besoin, mais sans lien explicite avec la source d'accès.
**Évidence.** Conception §5.1 (l. 164-165) ; F4-F ; PU-14 (« Destinataires d'une Bibliothèque publique après arrêt »).
**Correction proposée.** Fusionner `library_access_grant` et `distribution_record` en une seule table `library_recipient(library_id, recipient_actor_id, via INVITE|PUBLIC|PURCHASE, status, first_release_id)`. L'accès payant (PURCHASE) se raccordera plus tard sans modifier la table. Complexité : plus faible qu'aujourd'hui.

### C-08 — Groupes exigés par F4-C et T-06 mais non modélisés
**Axe :** Fonctionnel (1) · **Gravité :** Important · **Statut :** PARTIELLEMENT CONFORME · **Arbitrage :** Oui
**Constat.** F4-C et T-06 (« coach accorde la Bibliothèque à un groupe ») supposent des groupes ; §5.1 note que « les groupes ne sont qu'une interface d'extension » ; PU « À CLARIFIER » liste la gouvernance des groupes comme non tranchée.
**Évidence.** F4-C (registre), Conception §5.1 (l. 175), T-06 (l. 366), PU §5 (l. 208).
**Conséquence.** Le test T-06 n'est pas réalisable et la table des destinataires reste à moitié spécifiée.
**Correction proposée.** Premier lot de réception : destinataires **nominatifs ou par lien d'invitation**. Groupes = lot ultérieur. Réécrire T-06 et F4-C pour dire « utilisateurs (puis groupes lorsqu'ils existeront) ». Arbitrage Hermann requis (§E-3).

### C-09 — Droits des médias non articulés avec la permission « Redistribuer » de la fiche
**Axe :** Sécurité / droits (6) · **Gravité :** Important · **Statut :** NON CONFORME (absent) · **Arbitrage :** Oui
**Constat.** Le format pilote porte un statut de droits **par média** (`rightsStatus` : `UNVERIFIED`, `PERMISSION_CONFIRMED`, `RESTRICTED`, `MovementCatalogueFile` l. 32, 65, 561-564). La conception ne relie ni ce statut ni la permission de fiche à la distribution des médias : seul le retrait par modération est traité. Une fiche « Libre » peut contenir un média `RESTRICTED`.
**Correction proposée.** Règle minimale, sans nouvelle permission : un média n'est distribué que si la fiche est redistribuable **et** son `rightsStatus` vaut `PERMISSION_CONFIRMED` (ou média créé par l'auteur) ; sinon la fiche est distribuée **sans ce média**, comme pour un retrait de modération. À valider (§E-5).

### C-10 — KIN-01 : besoins réels non modélisés (relation, consentement, transfert)
**Axe :** Coach et kinésithérapeute (2) · **Gravité :** Important · **Statut :** PARTIELLEMENT CONFORME · **Arbitrage :** Oui
**Constat.** La distinction coach/kiné est claire et correcte (pas de `library_id` fictif, pas de prescription). Mais aucune entité ne représente l'Espace, la relation patient, le consentement ni l'acte de transmission, alors que PU-17 et T-19 les supposent. « Étoile » est une topologie, pas une table.
**Évidence.** PU-17 (l. 160-166), Conception §0 et §2 « Distinction professionnelle », §5.1 (aucune table), T-19 (l. 379).
**Besoins réellement indispensables (et rien de plus) :**
1. Un **Espace** appartenant à un professionnel (identité vérifiée selon la politique à définir).
2. Une **relation individuelle** Espace ↔ patient : invitation par le kiné (code), acceptation par le patient (consentement explicite horodaté), statut (invité / actif / terminé).
3. Un **transfert** = (expéditeur, destinataire, fiche, révision, horodatage). Il emprunte la **même chaîne** que la distribution de Bibliothèque : droit « Redistribuer » de la fiche (ou fiche propre du kiné), validation centrale, projection sans médias interdits, installation locale, mêmes règles de mise à jour et de modération.
4. **Fin de relation :** le patient conserve ce qui est installé (cohérent avec F4-B/F4-C) ; le kiné ne peut plus transmettre.
5. **Mises à jour :** pas de canal automatique ; le kiné peut **re-transmettre** une nouvelle révision, que le patient installe par une action explicite (cohérent avec PU-11).
**Mutualisation minimale.** Service commun `deliver(révisions approuvées, destinataire)`, deux « portes d'entrée » : `release + library_recipient` (coach) et `transfer` (kiné). Même `local_installation`. Rien d'autre n'est partagé : pas de grant par Bibliothèque pour le kiné.
**Correction proposée.** Ajouter au modèle cible `workspace`, `workspace_member` et `transfer` (§D). Une table `workspace_member` suffit pour représenter l'étoile : plusieurs lignes pour un même `workspace_id`, sans visibilité croisée (critère 16).

### C-11 — Données de santé : analyse RGPD / HDS absente pour la relation kiné-patient
**Axe :** Sécurité / conformité (6) · **Gravité :** Important · **Statut :** À CLARIFIER · **Arbitrage :** Oui
**Constat.** Le dossier demande de « ne pas propager les données de santé » mais ne dit pas ce que le serveur stockera. Le seul lien (kiné X → patient Y → Mouvement Z) révèle une relation de soins. **Obligation vérifiée :** l'hébergement de données de santé recueillies lors d'activités de prévention, de diagnostic, de soins ou de suivi, pour le compte des professionnels ou des patients, exige un hébergeur certifié HDS (article L.1111-8 du Code de la santé publique, esante.gouv.fr). **Non vérifié :** si une simple transmission de fiches Mouvements dans un Espace tombe sous ce régime ; l'ANS indique qu'il faut l'apprécier au cas par cas. Supabase / PostgreSQL « non décidés » (§4) : le choix d'hébergeur dépend de cette réponse.
**Correction proposée.** (i) Minimiser : le serveur ne stocke que acteur kiné, acteur patient, fiche, révision, horodatage — pas de texte libre, pas de consignes, pas de résultats. (ii) Obtenir un **avis juridique avant le lot kiné** (RGPD art. 9, HDS, rôle responsable de traitement / sous-traitant). (iii) Ne pas bloquer L1 à L5 (coach et Bibliothèques) par cette question.

### C-12 — Obligations des stores, DSA et suppression de compte non reprises dans les exigences
**Axe :** Sécurité, droits, modération (6) · **Gravité :** Important · **Statut :** PARTIELLEMENT CONFORME · **Arbitrage :** Oui (suppression de compte)
**Constat.** Le dossier renvoie à une « revue juridique dédiée » et à PU-15. **Obligations vérifiées** (sources en annexe) :
- Apple, guideline 1.2 (contenus générés par les utilisateurs) : méthode de filtrage, mécanisme de signalement avec réponse dans un délai raisonnable, **possibilité de bloquer les utilisateurs abusifs**, **coordonnées publiées**. Apple 5.1.1(v) : si l'application permet de créer un compte, elle doit permettre de **le supprimer dans l'application**.
- Google Play, politique UGC : modération « robuste, efficace et continue », conditions d'utilisation acceptées avant création de contenu, **signalement et blocage dans l'application**.
- DSA : l'exemption de l'article 19 écarte les obligations de la section 3 (articles 20 à 28) pour les micro et petites plateformes ; celles des sections 1 et 2 (intermédiaires, hébergeurs) **restent applicables** (la page consultée ne détaille pas les articles 16-17 : à confirmer par l'avis juridique, notamment pour la notification des contenus illicites et l'exposé des motifs).
**Évidence.** Conception §7.2 (« prévoir informations de contact, signalement, traitement des recours »), §9 ; PU-15. Absents : blocage d'utilisateur, conditions d'utilisation acceptées, suppression de compte.
**Conséquence.** Une application qui expose des fiches d'autres utilisateurs, même en partage privé, devra probablement satisfaire ces points pour passer la revue des stores. Le plan de lots les situe implicitement dans L3 sans les nommer.
**Correction proposée.** Ajouter à L3 la liste : signalement dans l'application, blocage d'un utilisateur, conditions acceptées, coordonnées, suppression de compte. **Suppression de compte d'un propriétaire :** proposition par défaut — le serveur cesse de distribuer ses fiches et Bibliothèques ; les copies **déjà installées** restent chez les destinataires (cohérent F4-B), l'auteur apparaît comme « auteur supprimé », données personnelles effacées. Arbitrage Hermann (§E-6). *Recommandation de conception, non obligation vérifiée :* conserver un journal de décisions de modération avec motif et date.

### C-13 — Réconciliation du modèle pilote avec la cible (auteur, visibilité, statuts, révisions, espace de noms)
**Axe :** Données / compatibilité (4, 7) · **Gravité :** Important · **Statut :** PARTIELLEMENT CONFORME · **Arbitrage :** Non
**Constat.** Écarts constatés entre `MovementEditorialProvenance` / `MovementCatalogueFile` (branche catalogue) et la cible :
| Sujet | Pilote | Cible |
|---|---|---|
| Auteur | `authors[]` 0..n (l. 54) | un auteur max (BIB-02) |
| Visibilité | par fiche : `PRIVATE/UNLISTED/PUBLIC` (l. 64) | par **Bibliothèque** : personnelle / partagée / publique |
| Statut | `DRAFT/IN_REVIEW/APPROVED/RETIRED` (l. 62) | approuvée / à contrôler / refusée / suspendue (modération) |
| Révision | chaîne opaque (« 1 », « 2026-10-27 ») | `revision_number` entier |
| Identité | `(catalogueId, sheetId)` | `(source_namespace, sheet_id)` |
| Droits | `license` seule | `can_edit`, `can_redistribute` |
Impact **mesuré sur le corpus** `kodjo-pilote-60.catalogue.json` : 60 fiches, `authors = []` pour 60, `owner = null` pour 60, `visibility = PRIVATE` pour 60, `origin = EXTERNAL_IMPORTED` pour 60, aucun média, `publicationAllowed = false`. **Aucune perte de données** n'est à craindre : le format v1 n'est pas distribué.
**Correction proposée (tant que le format n'est pas distribué, coût minimal).** Passer `authors[]` à `author` (nullable) dans le format v1 ; considérer `visibility` de fiche comme une indication à supprimer à terme ; distinguer `review_status` (par révision) de l'état de modération (par cible) ; définir `catalogueId` comme espace de noms éditorial stable (jamais l'identifiant d'une Bibliothèque : sinon la même fiche dans deux Bibliothèques donnerait deux lignes `installed_sheets`). Ne pas modifier le pilote avant décision ; **documenter la correspondance** pour ChatGPT.

### C-14 — « Mettre à jour » global (F4-D) et acceptation fiche par fiche du pilote : périmètres à distinguer
**Axe :** Mise à jour (5) · **Gravité :** Important · **Statut :** PARTIELLEMENT CONFORME · **Arbitrage :** Oui (confirmation)
**Constat.** F4-D : une seule commande applique composition et révisions. Le pilote : acceptation **fiche par fiche** avec report par défaut en cas de conflit (`recommended: "DEFER"`, catalogueLoadPlan l. 165, 362) ; décision de Hermann du 10/11. Le registre 07 écarte « Accepter/Refuser/Reporter » pour la distribution. Les deux sont compatibles à condition de les cantonner.
**Évidence.** PU-10 (l. 110-117), registre 07 (supersession), catalogueLoadPlan (en-tête), CatalogueLoadService.
**Conséquence.** Risque de réintroduire des choix par fiche dans l'écran Bibliothèque ou, à l'inverse, d'écraser une adaptation locale.
**Correction proposée.** « Mettre à jour » applique toutes les fiches **sans conflit** ; une fiche modifiée localement sur le même champ reste **inchangée et reportée**, signalée au résultat (réutilise le plan du pilote, sans fusion). L'acceptation fiche par fiche reste propre au chargement d'un fichier catalogue (canal de recette). Fiches Protégées : jamais en conflit (non modifiables localement, C-03). Seules cinq propriétés sont projetées sur le Mouvement (nom, alias, étapes, catégorie, zones : `PROJECTED_FIELDS`, l. 79) ; **les médias ne sont pas projetés** : leur installation locale est à concevoir en L4/L5 (`movement_media` → `media_assets` existent dans `main`).

### C-15 — Propagation documentaire incomplète et règles obsolètes subsistantes
**Axe :** Cohérence fonctionnelle (1) · **Gravité :** Important · **Statut :** NON CONFORME · **Arbitrage :** Oui (numérotation)
**Constat.**
- Ch. 10, l. 2757 : « **À CLARIFIER** : archivage et suspension d'une Bibliothèque, retrait d'un Mouvement de la composition source » — résolu par F4-B, F4-E, F4-F.
- Ch. 05, l. 562 : « le statut des Bibliothèques archivées reste à arbitrer » — résolu par F4-E.
- Annexe « Index des identifiants », « Matrice de traçabilité », « Correspondance des sections », « Historique des consolidations », ch. 06 : **0** occurrence de BIB / F4 / KIN-01 (ch. 13 : 2 ; ch. 01 : 1 ; INDEX : 5 ; PRODUCT : 4).
- Le registre 07 précise que les identifiants BIB « n'appropriant pas de numéros D-xxx » : ils échappent au système d'indexation par D-xxx utilisé par les annexes.
- PU-08 : « pas systématiquement plusieurs Mouvement locaux » (ambigu, cf. C-01).
**Correction proposée.** Voir plan §F. Décision à prendre : attribuer des D-xxx aux décisions BIB/F4/KIN-01 (recommandé, pour la traçabilité existante) ou étendre les annexes aux préfixes BIB/F4/KIN.

### C-16 — Plan de lots : copie à permissions héritées en L1, absence de lot kiné et de lot identité
**Axe :** Compatibilité / planification (7) · **Gravité :** Important · **Statut :** PARTIELLEMENT CONFORME · **Arbitrage :** Non
**Constat.** L1 inclut « copie avec permissions héritées » alors que le modèle de permissions n'existe qu'en L2 (C-03/C-04) : la copie locale d'un Mouvement n'a aucun droit à hériter. Aucun lot ne couvre l'identité (comptes, authentification, suppression de compte, C-12) ni le transfert kiné (PU-17). L3 conditionne L4 sans lister les exigences des stores.
**Correction proposée.** Voir plan §G : L1 réduit à PU-01, 02, 13 (références, archivage local) ; copie à permissions héritées déplacée en L2 ; identité intégrée à L2 ; lot kiné « L4-K » après avis juridique (C-11) ; exigences de stores listées en L3.

### C-17 — Surcomplexité du schéma proposé
**Axe :** Architecture / modèle de données (3, 4) · **Gravité :** Important · **Statut :** PARTIELLEMENT CONFORME · **Arbitrage :** Non
**Constat et suppressions proposées (justifiées).**
| Table proposée | Proposition | Justification |
|---|---|---|
| `library_draft_member` (serveur) | **Retirer** | Le brouillon est la Bibliothèque **locale** du propriétaire ; le serveur ne reçoit que des releases publiées. |
| `library_access_grant` + `distribution_record` | **Fusionner** (`library_recipient`) | Voir C-07. |
| `publication_submission` + `moderation_case` | **Fusionner** (`review_case` avec `kind` PUBLICATION / REPORT) | Même cycle (ouvert → décision), mêmes acteurs ; garde `moderation_decision`. |
| `local_update_journal` | **Retirer** | Voir C-06. |
| `local_sheet_revision_cache` | **Retirer** | Voir C-01 (option A). |
| `local_access_receipt` | **Différer** | Utile seulement pour l'expiration d'un accès payant (A1/A9, chantier commercial) ; F4-B suffit tant que rien n'expire. |
| `local_moderation_registry` | **Conserver**, sous le nom `moderation_block` | Voir C-05. |
Résultat : 14 tables serveur proposées → 12 (dont une vue d'état de modération), plus 3 pour l'Espace et le transfert ; 7 tables locales proposées → 4 nouvelles (cf. §D).

### C-18 — Terminologie « Catalogue / catalogue / Bibliothèque » et écran Profil
**Axe :** Cohérence fonctionnelle / Figma (1) · **Gravité :** Amélioration · **Statut :** À CLARIFIER · **Arbitrage :** Oui
**Constat.** Trois sens coexistent : « Catalogue » (liste de tous les Mouvements/Séances locaux, ex. écrans « Catalogue des séances »), « catalogue » (fichier de fiches du pilote, `catalogueId`), « Bibliothèque » (composition par références, cible). Le plan `CATALOGUE-CONNECTÉ` prévoit un écran « **Profil → Catalogues** » (tranche A1) ; dans Figma, l'onglet Profil actuel (nœud `12044:50048`) n'expose que « Mes données » : Mouvements / Séances / Programmes. Aucune entrée Bibliothèque ni Catalogues. La conception les distingue dans le texte mais l'utilisateur ne verra qu'un mot.
**Correction proposée.** Glossaire utilisateur : « Mes Mouvements », « Bibliothèques » (composition, cible) et, pour le canal de recette, « Sources de fiches ». Trancher avant de maquetter l'écran Profil. À ne pas transformer en exigence graphique : seulement le vocabulaire.

### C-19 — Canal « CATALOGUE-CONNECTÉ » : second chemin de distribution à cantonner
**Axe :** Compatibilité (7) · **Gravité :** Amélioration · **Statut :** À CLARIFIER · **Arbitrage :** Non
**Constat.** Le plan (A2 « Envoyer mes mouvements à l'administration », W2 réseau local) crée un chemin application ↔ administration sans validation centrale, cohérent avec « je gère l'ensemble seul, données de test » mais distinct de BIB-14/15.
**Correction proposée.** Le déclarer **canal de recette de développement** (hors cible produit), partageant le même registre `installed_sheets` et le même format ; ne pas en faire la base de la distribution entre utilisateurs. Vérifier que « Ajouter au catalogue » (propriétaire de la fiche créée) n'attribue pas d'identité par défaut (`owner = null` reste admis tant qu'aucune publication).

### C-20 — Branche pilote en retard sur `main` ; tests non exécutés
**Axe :** Compatibilité (7) · **Gravité :** Amélioration · **Statut :** NON VÉRIFIABLE (tests) · **Arbitrage :** Non
**Constat.** `catalogue/integration-60-main-20261109` a pour base `901d7b4c`, 3 commits derrière `main` (`4f48d9c0` relecture du Mouvement créé, `70dd1211`, `7e5fb6a2`). La fusion à blanc dans `main` est sans conflit (`git merge-tree`). Le différentiel affiche une suppression de `SqliteMovementRepository.readback.test.ts` (-87) qui n'est qu'un artefact du retard. Le pilote modifie `SqliteMovementRepository.ts` (+14) et `ActivityDefinitionService.ts` (+14). Les tests (`CatalogueLoadService.sqlite.test.ts`, 384 l. ; `catalogueLoadPlan.test.ts`, 244 l.) existent mais n'ont pas été exécutés par cette revue.
**Correction proposée.** Aucune fusion sans accord. Avant L1b : rebaser/fusionner depuis `main`, exécuter la suite en CI, puis réévaluer.

### C-21 — Contrôles serveur : compléments à la liste
**Axe :** Sécurité (6) · **Gravité :** Amélioration · **Statut :** PARTIELLEMENT CONFORME · **Arbitrage :** Non
**Constat.** La liste de §8 et §9 est bonne (autorisation serveur, projection sans fuite). Compléments : (i) **recalculer la redistribuabilité au moment de la livraison**, pas seulement à la publication de la release (une release publiée avant un retrait de droit reste servie sinon, cf. C-04) ; (ii) lier la release à un condensat (`digest`) vérifié par le client avant écriture ; (iii) clé d'idempotence sur l'installation ; (iv) ne jamais renvoyer le nombre total de membres de la composition source (fuite de l'inventaire interdit, déjà cité en §5.1 note 4 : l'étendre explicitement au manifeste) ; (v) URL de média à durée courte vérifiant le droit **du destinataire**.

### C-22 — Bibliothèque sans fiche redistribuable, arrêt puis reprise de diffusion (A2, A8)
**Axe :** Fonctionnel (1) · **Gravité :** Amélioration · **Statut :** À CLARIFIER · **Arbitrage :** Non
**Correction proposée (règles par défaut, à confirmer en relecture).** Bibliothèque « zéro contenu » : la demande de diffusion est refusée avec un message à l'émetteur (qui connaît sa composition ; aucune fuite). Reprise après arrêt : la diffusion repart de la release courante, les destinataires existants reprennent les mises à jour, les nouveaux peuvent installer. À valider sans arbitrage dédié.

### C-23 — Fiches du pilote (60) et Bibliothèque officielle KODJO : propriété à déclarer
**Axe :** Fonctionnel / droits (1, 6) · **Gravité :** Amélioration · **Statut :** À CLARIFIER · **Arbitrage :** Oui (différable)
**Constat.** `owner = null`, `authors = []`, `publicationAllowed = false` pour les 60 fiches ; la règle « jamais KODJO par défaut » est cohérente avec `hasUnknownOwner` (MovementEditorialProvenance l. 77). PU-09 prévoit pourtant une Bibliothèque officielle KODJO. Il faudra une **déclaration explicite de titularité** avant toute diffusion (qui déclare, sous quelle forme, avec quelle responsabilité).
**Correction proposée.** À traiter avant L6 seulement ; aucune action avant.

### C-24 — Références sans copie, associations multiples (BIB-03, PU-02)
**Axe :** Fonctionnel · **Gravité :** Amélioration · **Statut :** CONFORME · **Arbitrage :** Non
Association `library_member` sans duplication ; schéma `main` compatible (FK vers `movements`). Tests T-01/T-02 réalisables.

### C-25 — Conservation locale et intégrité des Séances (F4-B, T-10)
**Axe :** Mise à jour · **Gravité :** Amélioration · **Statut :** CONFORME · **Arbitrage :** Non
`activity_definitions.movement_id … ON DELETE RESTRICT` (migration013 l. 135-141) : retirer l'association ou la Bibliothèque ne peut pas supprimer le Mouvement ni casser une Séance.

### C-26 — Archivage indépendant de la diffusion (F4-E/F4-F)
**Axe :** Fonctionnel · **Gravité :** Amélioration · **Statut :** CONFORME · **Arbitrage :** Non
Deux dimensions bien séparées (`archived_at` local ; `distribution_state` serveur). Les modèles d'état « Brouillon/Active/Inactive » sont explicitement écartés. Appliquer C-07 pour l'arrêt côté serveur.

### C-27 — Aucune mise à jour silencieuse (F4-A, BIB-12)
**Axe :** Mise à jour · **Gravité :** Amélioration · **Statut :** CONFORME (règle) · **Arbitrage :** Non
La règle est cohérente et testable (T-08). Sa garantie dépend de la résolution de C-01 (une révision active par fiche).

### C-28 — Moteur d'Exécution PRE-10 et MVP non impactés
**Axe :** Compatibilité · **Gravité :** Amélioration · **Statut :** CONFORME (périmètre) / NON VÉRIFIABLE (tolérance PRE-10) · **Arbitrage :** Non
Rien n'impose de modifier PRE-10 : références Séances → Mouvement inchangées, nouvelles tables additionnelles (migration 024) sans toucher aux tables existantes. La tolérance de PRE-10 à une fiche neutralisée ne peut être vérifiée (non développé) : à porter en exigence (C-05).

---

## B. Matrice de conformité (décisions ↔ parcours ↔ données ↔ architecture ↔ tests)

| Décision | Parcours | Modèle de données (cible révisée §D) | Composant | Tests | Statut | Constat |
|---|---|---|---|---|---|---|
| BIB-01 | PU-01, 03 | `library`, Mouvement local | client | T-01 | CONFORME | — |
| BIB-02 | PU-03 | `sheet.author/owner/rights_holder` nullables | catalogue éditorial | — | PARTIELLEMENT CONFORME | C-13 (`authors[]`) |
| BIB-03 | PU-02 | `library_member`, `library_release_member` | client / serveur | T-01, T-02 | CONFORME | C-24 |
| BIB-04 | PU-01, 02, 08 | `library_member` → Mouvement local | client | T-01 | PARTIELLEMENT CONFORME | C-01, C-02 (mélange de sources) |
| BIB-05 | PU-01, 05, 09, 17 | `library.visibility/access_class` ; kiné hors Bibliothèque | serveur | — | PARTIELLEMENT CONFORME | C-07 |
| BIB-06 | PU-03, 04 | `sheet_revision.can_edit/can_redistribute` | garde local + serveur | T-03 | NON CONFORME | C-03, C-04 |
| BIB-07 | PU-04 | `upstream`, droits hérités | client | T-03 | PARTIELLEMENT CONFORME | copie de Mouvement à permissions non vérifiée (C-03) |
| BIB-08 | PU-02, 03 | `activity_definitions.execution_parameters` indépendants | client | critère 13 | CONFORME | schéma `main` |
| BIB-09 | PU-08 | `library.read_only` + refus dans les cas d'usage | client | T-05 | PARTIELLEMENT CONFORME | C-06 (verrou unique insuffisant) |
| BIB-10 | PU-05 | projection `library_release_member` filtrée | serveur | T-04 | CONFORME (règle) | C-21 |
| BIB-11 | PU-05 | `can_redistribute` ; `can_edit = false` ⇒ contenu identique | serveur | T-04 | CONFORME | — |
| BIB-12 | PU-10, 11 | `installed_library.release`, `installed_sheets.revision` | client | T-08 | CONFORME (règle) | C-01, C-27 |
| BIB-13 | PU-10 | variantes `LOCAL_DERIVED`, champs modifiés localement | client | T-11 | PARTIELLEMENT CONFORME | C-14 |
| BIB-14 | PU-07 | `review_case` PUBLICATION | serveur | T-07 | CONFORME | — |
| BIB-15 | PU-07 | approbation liée à l'empreinte | serveur | T-07 | CONFORME | — |
| BIB-16 | PU-15 | `review_case` REPORT + `review_decision` | serveur | T-15 | PARTIELLEMENT CONFORME | C-12 |
| BIB-17 | PU-15 | `moderation_block` | client | T-15 | PARTIELLEMENT CONFORME | C-05 |
| BIB-18 | tous | tables additionnelles, pas de dépendance réseau | architecture | T-18 | CONFORME | C-28 |
| F4-A | PU-10 | pointeur de release installée | client | T-08 | CONFORME (règle) | C-27 |
| F4-B | PU-10, 12 | FK `RESTRICT` Séances | client | T-09, T-10 | CONFORME | C-25 |
| F4-C | PU-08, 12 | `library_recipient` | serveur | T-06 | PARTIELLEMENT CONFORME | C-07, C-08 |
| F4-D | PU-10 | plan par fiche (pilote) + pointeur en dernier | client | T-09, T-11 | PARTIELLEMENT CONFORME | C-14 |
| F4-E | PU-13 | `library.archived_at` local | client | T-13 | CONFORME | C-26 |
| F4-F | PU-14 | `library.distribution_state`, `library_recipient` | serveur | T-14 | CONFORME (règle) | C-07, C-22 |
| KIN-01 | PU-17 | `workspace`, `workspace_member`, `transfer` | serveur + client | T-19 | PARTIELLEMENT CONFORME | C-10, C-11 |

---

## C. Analyse des risques techniques (priorisée)

| # | Risque | Probabilité / impact | Alternatives (complexité) | Recommandation |
|---|---|---|---|---|
| R1 | Versions divergentes d'une fiche partagée (C-01) | Élevée / fort | A : une révision active + avertissement (faible) ; B : report par fiche (moyenne) ; C : plusieurs Mouvements (forte) | A, B si Hermann refuse l'avancement croisé |
| R2 | Permissions non appliquées localement (C-03/C-04) | Élevée / fort (droits) | Garde unique `isMovementEditable` (faible-moyenne) ; ligne de permissions par table (moyenne) | Garde unique + droits dans l'instantané |
| R3 | Collision de noms bloquant l'installation (C-02) | Élevée / moyen | Suffixe numéroté automatique (faible) ; index composite (forte) | Suffixe numéroté |
| R4 | Intégrité multi-bases (C-06) | Moyenne / moyen | Pointeur en dernier + plan recalculable (faible) ; fusion des bases (moyenne) | Pointeur en dernier ; fusion à réévaluer après PRE-10 |
| R5 | Neutralisation inapplicable localement (C-05) | Moyenne / fort (conformité) | Drapeau en mémoire au démarrage (faible) ; colonne en base (moyenne) | Drapeau chargé au démarrage |
| R6 | Données de santé / HDS (C-11) | Moyenne / fort (juridique) | Minimisation + avis ; hébergeur certifié (moyenne à forte) | Avis avant lot kiné |
| R7 | Rejet des stores faute de blocage/contact/suppression de compte (C-12) | Moyenne / fort | Fonctions minimales dans L3 (moyenne) | Inclure dans L3 |
| R8 | Fuite d'inventaire interdit par canal secondaire (C-21) | Faible-moyenne / fort | Projection serveur + manifeste sans comptage (faible) | Appliquer C-21 |
| R9 | Révocation impossible sur copies hors ligne iOS | Certaine / limité | Neutralisation au démarrage et à la synchronisation (faible) | Déjà bien décrit (§7.2) ; ne rien promettre |

---

## D. Modèle cible recommandé (sans développement)

### D.1 Principes
Un backend modulaire unique ; cinq domaines logiques conservés. Une seule révision active par fiche et par appareil. Droits portés par la **révision**. Distribution et modération mutualisées entre coach (Bibliothèque) et kiné (transfert).

### D.2 Serveur (12 tables + 3 pour l'Espace)
| Table | Colonnes essentielles | Contraintes / index |
|---|---|---|
| `actor` | `actor_id`, `kind` (USER/ORGANIZATION/PLATFORM), `display_name`, `deleted_at` | PK `actor_id` |
| `sheet` | `sheet_id`, `namespace`, `author_actor_id NULL`, `owner_actor_id NULL`, `rights_holder_actor_id NULL`, `origin`, `upstream_sheet_id NULL`, `upstream_revision_no NULL` | UNIQUE `(namespace, sheet_id)` ; diffusion interdite si `owner NULL` |
| `sheet_revision` | `revision_id`, `sheet_id FK`, `revision_no`, `digest`, `content_json`, `can_edit`, `can_redistribute`, `review_status`, `created_at` | UNIQUE `(sheet_id, revision_no)`, UNIQUE `(sheet_id, digest)` ; contenu immuable |
| `media_asset` | `media_id`, `digest`, `kind`, `storage_key`, `rights_status`, `moderation_status` | stockage privé, pas d'URL permanente |
| `sheet_revision_media` | `revision_id`, `media_id`, `position` | PK `(revision_id, media_id)` |
| `library` | `library_id`, `owner_actor_id`, `title`, `description`, `visibility`, `access_class`, `distribution_state` | index `(owner_actor_id)` |
| `library_release` | `release_id`, `library_id`, `release_no`, `digest`, `published_at` | UNIQUE `(library_id, release_no)` ; immuable |
| `library_release_member` | `release_id`, `sheet_id`, `revision_id`, `position` | PK `(release_id, sheet_id)` ; ne contient que du redistribuable et approuvé |
| `library_recipient` | `library_id`, `recipient_actor_id`, `via` (INVITE/PUBLIC/PURCHASE), `status`, `first_release_id` | PK `(library_id, recipient_actor_id)` ; `group_id` ajoutable plus tard |
| `review_case` | `case_id`, `kind` (PUBLICATION/REPORT), `target_type`, `target_id`, `state`, `reporter_actor_id NULL`, `opened_at` | index `(target_type, target_id, state)` |
| `review_decision` | `decision_id`, `case_id`, `outcome`, `actor_id`, `statement_of_reasons`, `decided_at` | historique non modifiable |
| `moderation_state` (vue ou colonne) | état courant par cible, version de décision | sert à synchroniser `moderation_block` |
| *(Espace)* `workspace` | `workspace_id`, `owner_actor_id`, `kind` (PRO) | — |
| *(Espace)* `workspace_member` | `workspace_id`, `member_actor_id`, `status` (INVITED/ACTIVE/ENDED), `consent_at`, `ended_at` | PK `(workspace_id, member_actor_id)` ; pas de lecture croisée entre membres |
| *(Espace)* `transfer` | `transfer_id`, `sender_actor_id`, `recipient_actor_id`, `workspace_id`, `sheet_id`, `revision_id`, `created_at`, `state` | contrôle : fiche redistribuable, approuvée, relation ACTIVE |

### D.3 Client
- **Base principale (migration 024, `DATABASE_VERSION` 24) :** `library(id, name, description, source_library_id NULL, read_only, archived_at, created_at)` ; `library_member(library_id FK CASCADE, movement_id FK CASCADE, position)`, PK `(library_id, movement_id)`.
- **Registre (v2) :** `installed_sheets` (existant, enrichi des droits dans l'instantané), `installed_library(library_id, source_library_id, installed_release_id, release_digest, installed_at)`, `moderation_block(target_type, target_id, decision_version, state, synced_at)`.

### D.4 Relations (cardinalités)
```text
Actor 1─N Library 1─N LibraryRelease 1─N ReleaseMember N─1 SheetRevision N─1 Sheet
Library 1─N LibraryRecipient N─1 Actor              (via INVITE | PUBLIC | PURCHASE)
Actor(kiné) 1─N Workspace 1─N WorkspaceMember N─1 Actor(patient)
Workspace 1─N Transfer N─1 SheetRevision
Sheet 1─N SheetRevision N─N MediaAsset
ReviewCase 1─N ReviewDecision                       (cible : révision, média ou Bibliothèque)
Client : Movement 1─0..1 InstalledSheet ; Library N─N Movement (library_member) ; InstalledLibrary 1─1 Library
```

### D.5 Identités
`Movement.id` (local, inchangé, référencé par les Séances) — `(namespace, sheet_id)` (identité éditoriale, jamais l'identifiant d'une Bibliothèque) — `revision_id` (état précis). Une copie locale reçoit un nouveau `Movement.id` et une provenance `upstream` (origine `LOCAL_DERIVED` existante).

---

## E. Arbitrages à soumettre à Hermann (décisions fonctionnelles réellement manquantes)

1. **Versions divergentes (C-01).** Quand je mets à jour la Bibliothèque A, une fiche qu'elle partage avec B peut-elle passer à la nouvelle révision (avec avertissement explicite dans l'aperçu) ? *Recommandé : oui.* Sinon la fiche reste à l'ancienne révision tant que B n'est pas à jour.
2. **Homonymes (C-02).** À l'installation d'une fiche dont le nom existe déjà chez l'utilisateur, accepte-t-on un suffixe numéroté automatique (« Squat (2) »), sans confirmation, renommable ensuite ? *Recommandé : oui.*
3. **Groupes (C-08).** Pour la première version de partage : destinataires nominatifs ou par lien d'invitation seulement, groupes plus tard ? *Recommandé : oui.*
4. **Permissions (C-04).** Portées par la révision ; défaut à la création « Libre localement » ; un retrait de « Redistribuer » ne vaut que pour les futures diffusions. *Recommandé : oui.*
5. **Médias (C-09).** Un média n'est redistribué que si ses droits sont confirmés, sinon la fiche part sans média. *Recommandé : oui.*
6. **Suppression du compte d'un propriétaire (C-12).** Les copies déjà installées restent chez les destinataires, l'auteur apparaît comme supprimé. *Recommandé : oui.*
7. **Kiné (C-10, C-11).** (a) Le kiné ne transmet que des fiches dont la redistribution est permise ou qu'il a créées ; (b) l'invitation vient du kiné, le patient consent explicitement ; (c) à la fin de la relation le patient conserve ; (d) pas de canal de mise à jour automatique : re-transmission explicite. *Recommandé : oui aux quatre.* **Préalable non décisionnel :** avis juridique sur HDS / RGPD avant tout développement du lot kiné.
8. **Vocabulaire (C-18).** « Bibliothèques » pour la composition cible ; le canal de recette (fichier / administration locale) ne porte pas ce mot.
9. *(Différable)* Déclaration de titularité des 60 fiches pour la Bibliothèque officielle KODJO (C-23).

Les autres points « À CLARIFIER » du dossier (accès payant expiré, retransmission sur nouvel appareil, détails UX) relèvent du chantier commercial ou de Figma et **ne nécessitent aucun arbitrage avant L5**.

---

## F. Plan de correction documentaire

**Ordre recommandé :** arbitrages §E → conception cible → parcours → registre → chapitres → annexes.

| # | Fichier | Passage | Correction |
|---|---|---|---|
| 1 | `KODJO-Bibliotheques-Conception-fonctionnelle-technique-donnees-Revue-Claude-2026-11-10.md` | §5.1, §5.2, §5.3 | Remplacer par le modèle §D de ce rapport ; retirer `library_draft_member`, `local_update_journal`, `local_sheet_revision_cache`, `local_access_receipt` (différé) ; fusionner grant + distribution ; fusionner soumission + dossier de modération ; ajouter Espace/transfert |
| 2 | idem | §6.2 | Remplacer le pointeur par Bibliothèque par la règle « une révision active par fiche » selon arbitrage E-1 ; ajuster T-12 |
| 3 | idem | §1.1 F4-C, §12 T-06, §13 A7 | « utilisateurs (groupes ultérieurement) » selon E-3 |
| 4 | idem | §11 | Lots révisés (§G) ; copie à permissions héritées déplacée de L1 à L2 ; lot identité ; lot kiné |
| 5 | idem | §9 | Ajouter exigences des stores / DSA / suppression de compte (C-12) et minimisation kiné (C-11) |
| 6 | `KODJO-Bibliotheques-Parcours-utilisateurs-cibles-2026-11-10.md` | PU-04, PU-08, PU-10, PU-11, PU-17, §5 | « jamais plusieurs Mouvements locaux pour une même fiche source » ; aperçu de mise à jour des fiches partagées ; précision des conflits ; relation kiné (E-7) ; retirer de §5 les points résolus |
| 7 | `KODJO-Conception-Bibliotheques-Mouvements-Partage-2026-11-10.md` | §2.1, §5, §7 | Portée des permissions (E-4) ; nettoyer les interrogations supersédées (§7) ; mention du canal de recette |
| 8 | `Specifications-fonctionnelles/07 – Registre des décisions de conception.md` | sections « Décisions validées le 10/11/2026 », KIN-01 | Décider de la numérotation (D-xxx ou préfixes référencés) ; consigner E-1 à E-7 |
| 9 | `10 – Processus métier…` | l. 2757 | Retirer l'« À CLARIFIER » résolu par F4-B/E/F ; garder paiement et droits distribués |
| 10 | `05 – Versions du produit.md` | l. 562 | Retirer « statut des Bibliothèques archivées » (F4-E) |
| 11 | `09`, `11`, `12` | sections ajoutées le 10/11 | Aligner sur le modèle §D (révision, `library_recipient`, Espace, transfert) |
| 12 | `13 – Contrats d'écran`, `06 – Écrans…`, `01 – Vision Générale` | occurrences BIB/F4/KIN-01 | Vérifier la cohérence et ajouter la mention « pas d'écran validé » |
| 13 | Annexes (Index des identifiants, Matrice de traçabilité, Correspondance des sections, Historique des consolidations) | — | Ajouter BIB-01 à 18, F4-A à F, KIN-01 |
| 14 | `PRODUCT.md`, `INDEX.md` | références | Mettre à jour après 1-13 |
| 15 | Documents de la branche catalogue (Provenance, Format v1) | — | Ne pas modifier avant décision : documenter la correspondance du C-13 |

**Propagation transverse nécessaire :** toute modification des permissions (E-4), du modèle de destinataires (C-07) et de la règle de révision active (E-1) doit être répercutée dans conception, parcours, registre, ch. 09, 10, 11, 12 et annexes en une seule passe.

---

## G. Plan de développement révisé

| Lot | Contenu | Dépendances | Points bloquants | Différable |
|---|---|---|---|---|
| **L0 — Décisions** | Arbitrages E-1 à E-8 ; glossaire ; corrections §F | — | — | — |
| **L1 — Bibliothèques personnelles locales** | PU-01, 02, 13 (créer, composer par références, archiver) ; migration 024 (`library`, `library_member`, FK CASCADE) ; recherche et sélection dans le Catalogue local | L0 partiel (placement C-06, vocabulaire C-18) | — | copie à permissions (→ L2) |
| **L1b — Rapprochement du pilote** | Mise à niveau de la branche catalogue depuis `main` ; `author` unique ; droits dans l'instantané ; `moderation_block` | L1 ; C-13, C-20 | CI de la suite catalogue | UI Profil |
| **L2 — Identité et droits** | Comptes (création, connexion, **suppression**), acteurs, `sheet`, `sheet_revision` avec droits, copie à permissions héritées, garde `isMovementEditable` | E-4 ; avis juridique de base | choix d'hébergeur (C-11) | groupes |
| **L3 — Validation et modération** | Stockage privé, `review_case/decision`, contrôles automatiques, file humaine, signalement, **blocage d'utilisateur**, coordonnées, conditions acceptées | L2 ; C-12 | exigences des stores | recours détaillés |
| **L4 — Réception** | `library_release`, `library_recipient`, installation en lecture seule, homonymes (E-2), médias | L2 + L3 ; E-1, E-2, E-3, E-5 | aucun autre | achats, groupes |
| **L4-K — Transmission kiné** | `workspace`, `workspace_member`, `transfer` | L2 + L3 ; avis HDS/RGPD ; E-7 | **avis juridique** | notifications évoluées |
| **L5 — Mises à jour** | Pastille, aperçu (fiches partagées), « Mettre à jour » global, reprise, retirés conservés, `moderation_block` synchronisé | L4 ; E-1 | PRE-10 (tolérance neutralisation, exigence) | — |
| **L6 — Publique / payante** | Découverte, droits commerciaux (raccordement `via = PURCHASE`) | L3 à L5 ; chantier commercial ; C-23 | commerce | tout le lot |

**Éléments différables :** groupes, achat et expiration d'accès (`local_access_receipt`), fusion des bases SQLite, notifications silencieuses, console de modération avancée.
**Sans impact sur PRE-10 :** tous les lots (tables additionnelles ; seule exigence : tolérance à une fiche neutralisée).

---

## H. Décompte et recommandation finale

| Gravité | Nombre | Constats |
|---|---|---|
| Bloquant | 4 | C-01, C-02, C-03, C-04 |
| Important | 13 | C-05, C-06, C-07, C-08, C-09, C-10, C-11, C-12, C-13, C-14, C-15, C-16, C-17 |
| Amélioration | 11 | C-18 à C-28 (dont 5 CONFORME : C-24, C-25, C-26, C-27, C-28) |
| **Total** | **28** | |

**Recommandation finale : À CORRIGER AVANT DÉVELOPPEMENT.** La conception est cohérente dans ses principes ; les corrections sont localisées (modèle local, droits, versions concurrentes, kiné, conformité). Le lot L1 peut démarrer dès L0 partiel ; les lots L2 et suivants sont conditionnés par les arbitrages.

---

## Annexe — Sources consultées

- Apple, App Review Guidelines (1.2, 5.1.1(v)) : https://developer.apple.com/app-store/review/guidelines/
- Google Play, politique « User Generated Content » : https://support.google.com/googleplay/android-developer/answer/9876937
- DSA, article 19 (exemption section 3 pour micro et petites plateformes) : https://presencis.com/regulations/dsa/article-19/ — la page ne détaille pas les articles 16-17 ; à confirmer par l'avis juridique.
- ANS / esante.gouv.fr, champ d'application de l'hébergement de données de santé (article L.1111-8 CSP) : https://esante.gouv.fr/faq/quel-est-le-champ-dapplication-de-la-legislation-relative-lhebergement-de-donnees-de-sante-caractere-personnel

**Limites de la revue.** Tests non exécutés ; chapitres 02, 03, 04, 08, 13 contrôlés par recherche de termes ; aucune vérification juridique n'a valeur d'avis ; aucune modification de Figma, de code, de spécification ni de la branche audité.
