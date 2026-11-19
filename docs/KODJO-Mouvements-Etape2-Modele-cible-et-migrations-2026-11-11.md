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

## Réconciliation fonctionnelle du 17 novembre 2026

Cette mise à jour documentaire part de main au commit 91961aa42ad63f9f84be27cda7daa02caa3ab411 (fusion du lot Bibliothèques, PR #437). Les décisions de suppression du texte alternatif et le parcours de partage précisés par Hermann dans les échanges des 12–13 novembre sont reportés ci-dessous. Les critères d'acceptation de développement précédents restent des exigences à vérifier. La présente passe ne certifie pas leur réalisation.

### Fiche complète, stockage et usages

La fiche Mouvement comprend les attributs d'usage portés par `Movement` et, pour une fiche éditoriale installée, les données de `CatalogueSheet` reliées par l'identité source `(catalogueId, sheetId)`. Le registre `installed_sheets` conserve la fiche complète dans `kodjo-catalogue-registry.db`, séparée provisoirement de `kodjo.db`. Les dix champs de `Movement` ne constituent donc pas l'inventaire de toutes les informations conservées pour une fiche.

| Données | Porteur et usage documentés |
|---|---|
| Identifiant local, nom, étapes, alias, catégorie, zones, médias, phases et famille | Mouvement utilisé par les Exercices et Séances. |
| Matériel, sécurité, notes internes | Contenu de la fiche éditoriale. Leur disponibilité dans une consultation mobile doit être vérifiée champ par champ. |
| Spécialités, familles gestuelles, problèmes cliniques, cibles anatomiques | Identifiants structurés dans la classification éditoriale. Les filtres supplémentaires validés sont spécialités, familles gestuelles, problèmes cliniques et cibles anatomiques ; leur présentation sera définie dans Figma. |
| Auteur, provenance, validation, droits et révisions | Métadonnées de la fiche et de ses médias, utilisées pour l'administration et le suivi éditorial. |
| Composition des Bibliothèques | Références aux fiches, avec un ordre propre à chaque Bibliothèque. |
| Famille de niveaux | Appartenance et clé de tri propres à la fiche ; rang affiché dérivé, indépendant de l'ordre dans une Bibliothèque. |

Le format catalogue §5 et §9.3 décrit cinq champs projetés pour la réconciliation historique. Les médias et familles suivent les traitements spécifiques documentés dans ce format. La projection historique vide des phases est supersédée pour la cible : phases source administrables et transmises à l'installation et aux mises à jour acceptées. Une information persistée n'établit pas à elle seule l'existence d'un filtre, d'un tri ou d'un champ d'édition mobile. Le contenu exact accessible par le bouton Livre est à vérifier sur l'interface et son raccordement avant de le déclarer couvert.

### Suppression décidée du texte alternatif saisi pour les photos

Le champ éditorial `media[].alt` et son obligation pour une photo sont supprimés de la cible du modèle, de l'administration et du format d'échange. Cette décision supersède les exigences contraires de CA-1. Les règles d'accessibilité existantes utilisant le nom du mouvement ou de l'exercice comme libellé de vignette restent applicables.

La compatibilité avec les fichiers déjà exportés contenant `alt`, les empreintes et les révisions doit être traitée lors de la correction technique. Le mécanisme précis de migration reste à définir ; aucun rejet des anciennes bibliothèques ni aucune réinitialisation des installations n'est décidé ici. Le code de main consulté conserve encore `CatalogueMedia.alt` dans `MovementCatalogueFile.ts` ; la suppression documentaire ne vaut donc pas suppression du code.

La liste finale des champs est fixée ci-dessous par MOUV-ADM-20261117 ; les usages validés mais reportés sont conservés.

### Partage individuel et personnalisation — cible ultérieure

Le partage d'un mouvement seul est prévu, ainsi que le partage d'une Bibliothèque. Dans le partage standard, les destinataires reçoivent la fiche avec ses médias communs, sous réserve des règles de diffusion existantes.

Parcours personnalisé décrit par Hermann le 13 novembre 2026 :
1. Sélectionner un mouvement dans le Catalogue et choisir Partager.
2. Choisir Partage personnalisé.
3. Joindre une photo ou une vidéo, prise directement ou sélectionnée parmi les médias existants.
4. Ajouter éventuellement un texte.
5. Sélectionner la personne destinataire et envoyer.

Le média personnalisé est rattaché au mouvement pour ce destinataire. Il reste distinct des médias communs et des personnalisations destinées à d'autres personnes. Ce rattachement ne confère aucun droit d'édition de la fiche importée. Le texte facultatif supersède l'exclusivité des consignes orales de KIN-01. La fréquence reste un texte facultatif, sans planification automatique. Le suivi partagé est facultatif, autorisé par le destinataire par relation, désactivé par défaut et révocable ; il porte seulement sur les contenus reçus et leurs résultats effectivement enregistrés (durée, répétitions, charge selon l'exercice).

Ce parcours est une cible fonctionnelle ultérieure au lot Bibliothèques fusionné. Les écrans, libellés définitifs, droits de consultation et mécanismes de distribution restent à concevoir ou à vérifier. Aucun état Figma ni développement du partage n'est déclaré validé par cette mise à jour.

### MOUV-ADM-20261117 — inventaire arbitré des champs

Décisions explicitement validées par Hermann le 17/11/2026. Cette section remplace les exigences contraires des contrats antérieurs sur ces champs. Elle décrit la cible à développer, pas une migration déjà livrée.

| N° initial | Champ | Décision cible |
|---|---|---|
| 1 | Alias | Conservés et administrables depuis la fiche. |
| 2 | Position de départ | Champ dédié supprimé ; reprendre les valeurs existantes au début des étapes, sans doublon. |
| 3 | Matériel | Champ distinct facultatif conservé. |
| 4 | Consignes de sécurité | Champ distinct facultatif pour les précautions générales ; indications propres à une étape dans cette étape. |
| 5 | Notes éditoriales | Conservées, internes à l'administration, non affichées au destinataire. |
| 6 | Fondement des valeurs | Supprimé. |
| 7 | Revue de classification : statut, indicateurs, note | Supprimée ; aucun circuit de relecture de classification imposé. |
| 8–9 | Classification d'origine ; spécialités proposées à l'origine | Supprimées ; le classeur demeure une référence historique extérieure à la fiche. |
| 10 | Identifiant de geste | Supprimé ; identité stable de fiche conservée, ainsi que les familles gestuelles de classification. |
| 11 | Origine | Conservée, gérée automatiquement. |
| 12 | Amont : catalogue, fiche et révision source | Conservé, renseigné automatiquement à l'import. |
| 13, 26 | Diffuseur de fiche et de catalogue | Supprimé comme champ distinct. |
| 14 | Ayant droit | Conservé, facultatif ; propriétaire repris par défaut avec possibilité d'indiquer un tiers, sans double saisie. |
| 15 | Licence de la fiche | Facultative : « Non renseignée » par défaut ou « Licence ou conditions connues » avec nom et lien, ou texte. Pas de liste de licences prédéfinie. Porte sur le texte ; les médias gardent leurs droits propres. Ne change pas automatiquement les permissions. |
| 16 | Statut éditorial | Supprimé ; distinct de l'autorisation système de publication conservée. |
| 17 | Visibilité du mouvement | Champ saisi supprimé ; accès déduit des partages actifs (règle ci-dessous). |
| 18 | Sources : référence documentaire et contexte de prescription d'origine | Section et deux champs supprimés ; ne pas supprimer la provenance d'import ni les droits. |
| 19 | Installation | Section retirée de la fiche d'administration ; données techniques nécessaires conservées. |
| 20, 24 | Historique fiche et bibliothèque | Conservé et consultable en lecture seule pour identifier les changements et leurs auteurs/dates. |
| 21 | Éditeur de bibliothèque | Champ distinct supprimé ; propriétaire identifié conservé. |
| 22 | Visibilité de bibliothèque | Conservée : personnelle, partagée, publique. |
| 23, 27 | Publication autorisée bibliothèque/catalogue | Synthèse de l'autorisation système portée par les révisions de fiches ; pas d'autorisations indépendantes ni de cases que l'auteur peut cocher. Contrôle central reporté au lot de partage. |
| 25 | Gestionnaire administratif du catalogue | Champ distinct supprimé ; gestion par le compte propriétaire. |
| 28 | Notes du catalogue | Conservées, facultatives, internes à l'administration. |
| 29 | Empreinte et version lue | Données conservées ; masquées dans l'interface courante, consultables dans un volet de diagnostic. |
| 30 | Glossaire | Gestion conservée ; accès utilisateur reporté au chantier des aides à l'utilisation, sans parcours imposé aujourd'hui. |

Le texte alternatif éditorial des photos reste supprimé conformément à la décision précédente. Les champs supprimés le sont du modèle cible, des formulaires et des échanges ; les exceptions d'interface seule sont explicitement indiquées ci-dessus. La compatibilité des anciens fichiers et des empreintes doit être définie techniquement ; ne pas perdre les autres contenus conservés ou réinitialiser les installations. Les notes internes ne doivent pas être exposées au destinataire. La licence et les permissions doivent rester cohérentes, sans assimilation automatique entre elles.

### MOUV-ACC-20261117 — identité, accès et perte du dernier accès

- Un catalogue source par compte utilisateur, créé automatiquement ; les fiches originales appartiennent à ce catalogue. Le nom n'est pas une identité. L'identité stable est `(catalogueId, sheetId)` ; un import conserve cette identité et ne transfère pas la propriété.
- Une fiche peut appartenir à plusieurs bibliothèques thématiques, sans bibliothèque principale. Les références à une même fiche source correspondent à un seul mouvement local.
- L'accès résulte des partages actifs : bibliothèque, partage direct ou séance partagée donnant accès au mouvement. Une séance créée localement ne constitue pas à elle seule un droit d'accès supplémentaire.
- L'accès le plus large s'applique au mouvement : sa présence dans une bibliothèque publique le rend accessible publiquement, sans publier les autres bibliothèques, leurs appartenances privées ou les médias personnalisés. La disparition du dernier accès public laisse seulement les autres accès valides.
- Une fiche reçue reste non modifiable et non duplicable. Le propriétaire peut autoriser ou interdire sa redistribution à l'identique ; même règle en partage direct. Public ne signifie ni modifiable ni redistribuable. Les réglages des Exercices restent personnalisables.
- La suppression volontaire d'une bibliothèque retire son accès ; une autre voie valide maintient le mouvement disponible. [Restreint le 19/11/2026 — CPT-17 : hors relation payante, le contenu reçu est conservé ; la règle qui suit ne s’applique qu’au retrait d’accès dans une relation payante et au retrait par KODJO d’un contenu signalé.] La perte du dernier accès ou la révocation du mouvement par son propriétaire prime sur ses usages : mouvement indisponible et séances dépendantes « À corriger — mouvement indisponible », sans nouvelle exécution tant que le mouvement n'est pas remplacé ou retiré. La suppression directe d'un mouvement importé reste interdite. [Exception du 17/11/2026 — CPT-09, décision de Hermann : la **suppression d’un compte** (auteur ou destinataire) n’est ni une révocation ni une perte d’accès. Les contenus déjà présents sur un téléphone restent utilisables, **figés** (aucune mise à jour, aucune redistribution, auteur « Compte supprimé ») ; seul le serveur efface ce qu’il détient. La règle de perte d’accès reste applicable à la révocation volontaire et à la modération.]
- Préserver les références de composition et l'historique passé, sans imposer une destruction physique qui les casserait. Une exécution déjà commencée se termine, mais ne peut ensuite être relancée sans correction.
- Avant une suppression volontaire, avertir des impacts ; après réception d'une révocation, notifier. Dans les deux cas, accès en un clic aux séances concernées. La révocation distante s'applique dès que l'appareil en a connaissance.
- Les médias personnalisés restent chez le destinataire, consultables même après perte d'accès au mouvement, sans rétablir cet accès. Ils ne sont pas automatiquement redistribués avec une séance ou un mouvement.

Ces règles remplacent la conservation automatique de l'utilisabilité du seul fait d'une installation antérieure ou d'une utilisation dans une séance. L'arrêt d'une nouvelle distribution n'est pas assimilé silencieusement à une révocation des accès existants : ce sont deux actions distinctes.

### MOUV-PART-20261117 — partage et publication, cible ultérieure

Le partage d'un mouvement standard ou personnalisé et le partage d'une séance sont prévus sans bibliothèque fictive par relation. Le partage personnalisé peut joindre une photo/vidéo nouvelle ou existante et un texte facultatif ; les compléments restent propres au destinataire. L'expéditeur peut ajouter ultérieurement un média personnalisé dans l'espace partagé de la relation. Une séance partagée transmet sa composition, ses paramètres et l'accès aux mouvements/médias autorisés ; signaler les éléments non transmissibles avant l'envoi, sans diffuser de données interdites.

La fréquence est exprimable dans le texte facultatif ; aucune fréquence structurée ni création automatique d'occurrences n'est décidée. Le destinataire gère sa planification. Le partage des résultats est désactivé par défaut, activable et révocable par le destinataire pour chaque relation avec un expéditeur ; seuls les contenus reçus et les résultats effectivement enregistrés sont concernés.

L'autorisation de publication est le résultat de contrôles KODJO de conformité, droits et règles de diffusion, porté par la révision de fiche. La bibliothèque et le catalogue en donnent une synthèse sans trois autorisations indépendantes. Elle n'est pas une garantie générale de légalité. La redistribution est une permission distincte accordée par le propriétaire aux destinataires. Les contrôles centraux et le partage interutilisateurs restent dans leur lot futur ; leur conservation documentaire ne vaut pas livraison.

### MOUV-UX-20261117 — phases, recherche et interfaces

Les phases sont gérées dans la fiche source : ordre, libellé et durée par défaut facultative, sous les limites existantes du modèle. Elles sont transférées à l'installation et lors des mises à jour acceptées ; la fiche importée reste en lecture seule. La famille de niveaux est conservée.

Conserver les filtres courants directement accessibles ; ajouter les axes spécialités, familles gestuelles, cibles anatomiques et problèmes cliniques. Le détail des filtres et leurs interactions sera défini dans Figma. Les métadonnées de classification conservées doivent être utilisables sur mobile, pas seulement stockées dans le registre. Aucun tri supplémentaire non arbitré n'est imposé.

### Suites techniques et UX, sans réouverture des arbitrages

- Adapter modèles, contrats d'échange, validateurs, migrations et projections aux décisions ci-dessus ; choisir le versionnement technique et tester la compatibilité historique.
- Définir dans Figma la présentation détaillée des filtres, des droits et des états de séances à corriger. La présente mise à jour ne certifie aucun écran ni le contenu actuel du bouton Livre.
- Définir ultérieurement les aides utilisateur incluant le glossaire.
- Le choix de stockage/transit des médias reste reporté ; la conservation des médias personnalisés chez le destinataire est, elle, décidée.

### Critères de recette de la cible (non exécutés dans cette passe documentaire)

1. Retirer une bibliothèque parmi deux donnant accès à la même fiche : un seul mouvement local reste utilisable ; retirer le dernier accès : mouvement indisponible, séances à corriger identifiables en un clic.
2. Révoquer pendant une exécution : elle se termine ; un nouveau démarrage est refusé tant que la composition n'est pas corrigée. L'historique reste lisible.
3. Rendre publique une bibliothèque contenant une fiche également privée ailleurs : fiche accessible, autre bibliothèque et médias personnalisés non exposés. Retirer le dernier accès public préserve seulement les autres accès valides.
4. Importer une fiche avec phases, puis accepter une révision : ordre, libellés et durées sont transmis, sans autoriser l'édition de la fiche importée.
5. Ouvrir un ancien fichier : reprendre la position de départ dans les étapes sans doublon ; préserver champs conservés, identité source et historique. Les champs abandonnés ne réapparaissent pas dans la nouvelle cible.
6. Consulter une fiche reçue : aucune note interne ; médias personnalisés uniquement pour leur destinataire ; perte d'accès à la fiche sans perte de ces médias personnels.
7. Suivi partagé désactivé : aucun résultat transmis ; activé pour une relation : seulement les contenus reçus et résultats enregistrés ; révocation respectée.
8. Administration : les 30 éléments suivent l'inventaire ; licence à deux choix sans liste standard ; diagnostics séparés ; aucune publication activable librement par l'auteur.
