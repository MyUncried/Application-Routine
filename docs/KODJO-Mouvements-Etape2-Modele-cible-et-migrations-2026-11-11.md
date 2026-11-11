# KODJO — Étape 2 : modèle de données cible des fiches Mouvement

**Date :** 11 novembre 2026. **Statut :** spécification de développement documentaire — décisions confirmées par Hermann ; aucune implémentation ni test exécuté ici.
**Baseline :** `docs/mouvements-fiche-donnees-preparation-20261111`. **Périmètre :** modèle éditorial, format catalogue autonome, import CA-3, persistance et médias. Hors périmètre : moteur PRE-10, partage communautaire, nouvelles maquettes Figma, développement Web dans cette étape.

## 1. Arbitrages fonctionnels confirmés

**MOUV-D1 — Un seul auteur.** Chaque fiche possède `author: EditorialActorRef | null` (cardinalité 0..1). `null` indique auteur inconnu, sans auteur fictif. **Supersède la représentation `authors[]`**, et confirme BIB-02 sur la cardinalité. Préserver les champs indépendants `owner`, `publisher`, `rightsHolder`, `license`, `upstream`, `revision`. L'historique de révisions peut continuer à identifier l'auteur de chaque *révision* : il ne représente pas des coauteurs de la fiche. Convertir les 60 fiches sans inventer d'auteur. Refuser avec diagnostic explicite une éventuelle entrée existante à plusieurs auteurs plutôt qu'en perdre un silencieusement.

**MOUV-D2 — Médias hybrides.** La fiche éditoriale conserve **toutes** les métadonnées de ses photos/vidéos, y compris attribution, licence, statut des droits et ordre. La référence principale est distante ; à l'utilisation, **chargement à la demande** et **cache local** lorsque le média est disponible et autorisé. Pas de téléchargement intégral automatique des vidéos avec la Bibliothèque. La commande explicite de téléchargement des Bibliothèques ou Séances pour usage hors ligne est **reportée**. Le cache est une optimisation, pas la seule copie éditoriale ; si réseau absent et média non caché, afficher un état d'indisponibilité sans perdre la fiche ni bloquer l'Exercice. Le transfert ou la diffusion d'un média dont les droits requis ne sont pas confirmés est interdit ; préserver ses métadonnées en privé sans le publier. Éviter que le remplacement d'une révision efface des actifs personnels non liés à cette fiche. La stratégie de cache (tailles, quota, purge, format, URL expirantes) est **à spécifier techniquement**, sans en faire une nouvelle règle produit.

**Compatibilité CA-1 historique et MOUV-D2.** Le format d'échange pilote v1 autorise encore `EMBEDDED` et `REMOTE`, y compris des photographies intégrées ; il reste lisible comme donnée historique. **La stratégie d'accès cible est distante**, avec chargement à la demande/cache local, et ne suppose ni suppression des photos embarquées historiques ni téléchargement des vidéos à l'installation. Une transformation de stockage, la purge et la gestion des URL expirantes sont des mécanismes techniques à tester, non des attributs d'auteur ni des droits implicites.

**MOUV-D3 — Fiche importée protégée.** Une fiche Mouvement importée ne peut **ni être modifiée ni être dupliquée** par l'utilisateur, quel que soit son nom ou ses autres attributs. Les paramètres d'exécution de l'**Exercice** qui la référence restent indépendants et modifiables. Un Mouvement créé personnellement reste éditable et duplicable selon les règles locales existantes. La **redistribution éventuelle** d'une fiche importée reste subordonnée à une autorisation explicite de sa source et appartient à un lot futur : ne pas développer maintenant de partage. **Supersède pour les fiches importées** les modes destinataire antérieurs BIB-06 et BIB-07 autorisant modification ou copie, sans supprimer la traçabilité des droits ni les références historiques. BIB-08 reste applicable : les paramètres d'Exercice restent modifiables.

**MOUV-D4 — Mise à jour des fiches importées.** Leur contenu est en lecture seule pour l'utilisateur : les mises à jour éditoriales ordinaires viennent de la source et sont appliquées sur action explicite. Le conflit d'édition locale ne doit pas se produire pour les **nouvelles** fiches importées. Conserver néanmoins les mécanismes CA-3 de reconnaissance et de réconciliation des 60 Mouvements **antérieurement installés et éventuellement modifiés** ; ils ne doivent être ni écrasés, ni dupliqués ni perdus. L'identité locale des Mouvements et les références de Séances restent inchangées.

## 2. Modèle cible et séparation des responsabilités

| Objet | Champs / cardinalités | Observations |
|---|---|---|
| `Movement` local | `id` stable ; `name`, `description`, `aliases[]`, `media[]`, `categoryId`, `bodyZoneIds[]`, `phases[]`, `nextPhaseId`, `levelGroup` | Contenu utilisable dans les Exercices/Séances. Pas de métadonnées de propriété intellectuelle inventées dans les paramètres d'exécution. |
| `CatalogueSheet` | `sheetId`, `revision`, `history[]`, `provenance`, `content`, `classification`, `sources`, `validation`, `media[]`, `install` | Fiche éditoriale complète de CA-1. Aucune suppression d'attribut pour simplifier. |
| Identité source | `(catalogue.id, sheetId)` ; révision indépendante du nom | Ne jamais déduire la source à partir du nom et ne jamais remplacer `Movement.id` d'une installation existante. |
| Provenance | `author: ActorRef | null` ; `owner`, `publisher`, `rightsHolder`, `license`, `upstream`, `origin`, `visibility` | Auteur unique ; propriétaire inconnu possible et **non substitué** par le gestionnaire. |
| Registre CA-3 | `installed_sheets`, `pending_operations`, `sheet_decisions`, `saved_local_values` | Réemployé sans refonte ; la conservation de l'ancien canal de recette n'autorise plus l'édition/duplication d'une fiche importée. |
| Médias | Référence distante, métadonnées de licence, identification stable ; cache local séparé | Ne pas mélanger cache effaçable, fichier source et éventuel média personnel. |

**Différencier l'auteur de la fiche de `history[].author`** : celui-ci indique qui a produit une révision, pas un second auteur du Mouvement. Conserver le schéma des métadonnées validées autres que le changement singulier.

## 3. Modifications techniques minimales attendues

1. **Contrat CA-1** : remplacer `provenance.authors[]` par `provenance.author: EditorialActorRef | null` dans `MovementEditorialProvenance`, `MovementCatalogueFile`, sérialisation, validation, conversions et tests. Les champs nuls sont explicites. Adapter `docs/KODJO-Format-catalogue-mouvements-v1.md` dans la branche porteuse du code. Pour un fichier historique `authors[]` avec 0/1 élément, migration déterministe sans perte ; avec plus d'un élément, **rejet explicite**, jamais choix arbitraire. La migration d'entrée n'implique **aucune** gestion multi-auteurs dans le modèle cible.
2. **Persistance** : concevoir une migration **additive**, si requise, préservant les fiches éditoriales complètes et le lien `(catalogueId,sheetId)` → `Movement.id`. Ne pas reconstruire `movements` ni réinitialiser des données. La numérotation est déterminée après inspection réelle du schéma cible, pas réservée à l'avance.
3. **Lecture seule importée** : la garde ne doit pas être uniquement visuelle. Le service métier refuse `update`, `duplicate` ou `createVariant` qui modifieraient/copieraient la fiche importée ; seul le processus d'installation/mise à jour **autorisé par la source** peut appliquer une nouvelle révision. La définition exacte des opérations de variantes liées aux niveaux doit être examinée avant codage pour ne pas altérer une famille existante. Les Exercices utilisant cette fiche demeurent configurables.
4. **Homonymes** : la base actuelle `movements.normalized_name` a un index unique global (migration013). Conserver l'unicité des créations **personnelles**, autoriser des fiches de sources différentes portant le même nom, sans suffixe enregistré. Le schéma proposé (`origin_namespace` nullable + index partiel unique sur les créations locales) nécessite tests et garde cohérente dans dépôt, domaine, formulaires et planificateur CA-3. La provenance d'une copie personnelle historique ne peut pas être inférée uniquement de `origin_namespace=NULL`.
5. **Médias** : le fichier CA-1 porte les métadonnées, mais le pilote CA-3 ne projette aucun média physique. Mettre en place une résolution de références distantes et un cache à la demande, sans téléchargement intégral ni diffusion de médias sans droits confirmés. Ne pas inventer de URL, de licence ou de transfert physique pour les 60 fiches privées. Implémenter un état de fallback hors ligne. Tester conservation des autres médias locaux.
6. **CA-3 et reprise** : préserver l'idempotence et le protocole intention durable → écriture → confirmation dans le registre ; permettre la reconnaissance des 60 fiches via `install.knownLocalMovementIds`, sans dupliquer un `Movement`. Les conflits historiques passent toujours par la voie de réconciliation ; les nouvelles fiches protégées ne sont pas éditables localement.
7. **Fiche mobile** : n'ajouter aucun champ d'interface absent de Figma validé. Présenter l'état lecture seule des Mouvements importés à partir de leur origine **persistée**, sans heuristique sur le nom ; accès au réglage des Exercices maintenu.

## 4. Priorités de développement pour Claude

**Bloc A — immédiatement, sans nouveau choix métier :** type `author`, validateur, conversion sûre des 60 fiches, round-trip du fichier CA-1, règles de permission lecture seule et tests unitaires ; matrice attributs → stockage/projection. **Bloc B — persistance** : migration additive de l'identité/provenance et garde transactionnelle, après vérification du schéma réel ; tests sur base peuplée. **Bloc C — médias** : références distantes, cache local, fallback et contrôle des droits ; spécification technique du cache à documenter et tester. **Bloc D — raccordement CA-3** : installation, mise à jour, reprise et réconciliation de données historiques.

Ne pas coupler artificiellement A et C : l'évolution de l'auteur et de la protection de la fiche doit pouvoir être livrée et testée indépendamment du téléchargement des médias. L'administration Web consommera le même format lors de son étape dédiée ; les conversions/validateurs doivent néanmoins en préparer la compatibilité.

## 5. Critères d'acceptation vérifiables

- Un fichier avec auteur unique ou inconnu est accepté ; une liste ancienne de 0/1 auteur est migrée explicitement, une liste de plusieurs auteurs n'est jamais tronquée.
- Deux fiches importées homonymes et une création locale du même nom peuvent coexister selon les règles d'unicité ; deux créations personnelles homonymes restent refusées.
- Impossible de modifier ou dupliquer une fiche importée par l'UI **ou par appel direct du service** ; un utilisateur peut toujours modifier les paramètres de l'Exercice.
- Révisions de fiches, métadonnées de médias, ordre et références éditoriales préservés à l'aller-retour.
- Média distant disponible et autorisé → chargé à la demande ; cache utilisable hors ligne ; sans cache et hors ligne → état d'indisponibilité sans destruction de données ; média sans droits confirmés → pas de diffusion.
- Les 60 Mouvements installés ne sont ni supprimés, ni dupliqués ni réassignés ; leurs Exercices/Séances restent attachés au même `Movement.id` ; reprise après interruption.
- Tests de migration avec base préexistante, validations, services et non-régression exécutés et documentés. Aucun test « vert » affirmé sans exécution.

## 6. Mandat à Claude pour l'étape 2

**Objectif :** développer la cible du modèle de fiche Mouvement, sans modifier PRE-10.

Prendre le code réel de `catalogue/integration-60-main-20261109` et les décisions normatives BIB-02, MOUV-D1 à MOUV-D4 ci-dessus, en tenant compte des modifications d'autres branches par comparaison Git **avant toute écriture**. Reprendre CA-1/CA-2/CA-3 existants, sans reconstruction, création de modèle concurrent ni migration destructive.

Livrer sur **branche de développement distincte** :
1. modèle `author` unique et validation complète sans perte ;
2. droits de lecture seule des fiches importées, vérifiés au niveau service ;
3. mise en conformité des données et migrations additives justifiées ;
4. tests de round-trip, homonymes, installation/révision/reprise, et conservation des 60 fiches ;
5. plan puis implémentation des médias distants et du cache à la demande, avec contrôle des droits et fallback ;
6. bilan par fichier, SHA, tests réellement exécutés, éventuels points bloquants.

**Interdits :** modifier le moteur PRE-10, fusionner `main`, ouvrir une PR sans autorisation, modifier Figma, réinitialiser les Mouvements existants ou déduire la propriété éditoriale de la source/importateur.

**Incertitudes à signaler, sans inventer :** migration des historiques multi-auteurs si cas effectivement trouvé ; traitement détaillé du retrait/désinstallation ; opérations de duplication des Exercices versus duplication des Mouvements ; choix techniques du cache et de l'URL signée si requis. S'ils ne bloquent pas le bloc A, livrer A indépendamment.

---

**Origine des évidences techniques :** lecture du format `docs/KODJO-Format-catalogue-mouvements-v1.md`, `src/domain/catalogue/MovementCatalogueFile.ts`, `MovementEditorialProvenance.ts`, `catalogueLoadPlan.ts`, `src/features/catalogue/CatalogueLoadService.ts` sur branche CA-3 ; lecture de `Movement.ts` et `migration013.ts`. Ce document fixe les décisions fonctionnelles reçues et propose les contrats de développement ; il ne prouve aucune migration ou exécution de test.
