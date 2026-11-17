# Cadrage — Gestion de compte KODJO (lancement du chantier)

## Identification

- **Identifiant :** CADRAGE-GESTION-COMPTE
- **Date :** 17/11/2026
- **Type :** cadrage, état des lieux et benchmark. Aucune correction, aucun fichier applicatif modifié.
- **Objectif :** lancer le chantier « gestion de compte ». Il s'agit d'établir ce que disent déjà les sources, ce qui existe dans le code, de comparer les architectures d'autres applications, puis d'identifier les arbitrages nécessaires avant tout plan d'implémentation.
- **Branche :** `claude/blissful-meitner-iauzaf`
- **Commit de départ :** `5ed7b5a`

## Périmètre

- **Demandé :** « lancer le chantier de la mise en œuvre de la gestion de compte dans Kodjo ».
- **Réellement traité :**
  - lecture ciblée des spécifications (ch. 01, 02, 05, 07, 08, 12) et des documents Bibliothèques/partage des 10, 11 et 17/11 ;
  - inventaire du schéma local (`users`, `profiles`) ;
  - échanges de cadrage avec Hermann ;
  - benchmark de 12 applications et de trois points techniques et juridiques.
- **Non traité :** plan d'implémentation, choix du backend, maquettes. Rien n'est encore arbitré.

## 1. Ce que disent les sources (constats)

| Source | Contenu |
|---|---|
| Ch. 05, « Utilisateur prioritaire du MVP » | MVP « sans compte utilisateur obligatoire », sans synchronisation, sans partage. |
| Ch. 05, V3 « Synchronisation et transmission entre utilisateurs (cible à réviser) » | Besoins listés **sans architecture** : créer un compte, se connecter de manière sécurisée, synchroniser les routines, programmations et séances, retrouver ses données sur plusieurs appareils, sauvegarder et restaurer ses données. Transmission individuelle (KIN-01). |
| Ch. 12, §12.1 | Application mobile **iOS et Android** ; le MVP n'a ni backend ni compte. |
| Ch. 12, §12.7 | Identifiant Utilisateur interne UUID local, `ownerId` sur les racines d'agrégat. Cible : séparer Utilisateur, Compte et Fournisseur d'identité, et rattacher un Utilisateur local existant à un compte sans recréer ses données. Apple et Google sont prioritaires, Facebook est écarté. Constat : « sans compte ni sauvegarde distante », la perte de l'appareil entraîne la perte des données. |
| Ch. 12, §12.20 | Aucun mot de passe géré dans le MVP. Une revue sécurité et données personnelles est obligatoire avant la mise en production de comptes, d'une synchro cloud ou de données de santé. |
| Ch. 12, §12.21 | La synchronisation future devra définir la source de vérité, les conflits, le hors ligne, les suppressions, les médias et le multi-appareils. |
| BIB-18 (Conception Bibliothèques du 10/11) | Comptes, diffusion, modération et paiements relèvent du post-MVP ; le MVP local n'en dépend pas. |
| Décisions consolidées du 17/11, Étape 2 | « Un catalogue par compte », créé automatiquement ; identité `(catalogueId, sheetId)`. Le compte est donc un **prérequis du partage**. |
| Documents Bibliothèques (10/11) | Serveur central : identité, registre des fiches, droits, médias, modération. **Backend non arbitré** ; PostgreSQL/Supabase y figure comme option à évaluer. |

**Code :**
- `users` est une table singleton (`id`, `created_at`, migration 001) ; `owner_id` y fait référence.
- `profiles` est une table singleton des préférences (migration 007).
- Aucune dépendance d'authentification, de stockage sécurisé ou de backend dans `package.json`.

## 2. Décisions et précisions de Hermann (17/11/2026)

- **Android est prévu dès le départ.** C'est conforme au ch. 12 §12.1 et aux décisions D-087, D-393 et D-400 : ce n'est pas une règle nouvelle (classe A).
- **Le serveur central sert au partage** des données entre utilisateurs (orientation exprimée par Hermann ; elle rejoint la cible Bibliothèques déjà écrite).
- **Benchmark vérifié demandé avant de décider** de l'architecture de sauvegarde. Il est fait, voir §4.

### Décisions de premier lot (17/11/2026, inscrites au ch. 07 « Gestion de compte — premier lot »)

| ID | Décision |
|---|---|
| CPT-01 | Premier lot : compte seul |
| CPT-02 | Compte obligatoire |
| CPT-03 | Apple et Google uniquement ; Apple doit fonctionner sur Android |
| CPT-04 | Android dès le départ |
| CPT-05 | Supabase, sous réserve de vérification (région UE, coût, Expo 57) |
| CPT-06 | Lot sauvegarde/restauration serveur juste après |

Ces décisions referment les arbitrages 1 à 3 et 5 du §6. L'arbitrage 4 (copie lisible ou chiffrée) est reporté au lot sauvegarde.

## 3. Ce qui vient de Claude et non des sources (hypothèses non validées)

1. Découpage proposé :
   - **socle** : compte facultatif et rattachement de l'Utilisateur local ;
   - **sauvegarde/restauration** ;
   - **synchronisation**.
2. Lecture de « sauvegarder et restaurer » comme une copie restaurable sans mise à jour continue. La synchronisation reste distincte.
3. Le contenu partagé (fiches reçues, Bibliothèques) n'a pas à figurer dans la sauvegarde : il est récupéré depuis le serveur avec ses droits.

Aucune de ces propositions n'est une règle. Celle qui sera retenue relève de la **classe B** : mise à jour du ch. 05 et du registre (ch. 07) avant tout développement.

## 4. Benchmark (consulté le 17/11/2026)

**Limite de preuve.** Le réseau de la session n'a permis de lire en entier que `developer.android.com` et le registre npm. Les autres pages officielles n'ont été vues **que par extraits de moteur de recherche** limités aux domaines officiels. Une relecture complète est nécessaire avant de citer ces éléments dans une décision engageante.

### 4.1 Patrons observés

| Patron | Applications | Points saillants |
|---|---|---|
| **1. Compte obligatoire, serveur éditeur comme source de vérité** | Hevy, Strong, Fitbod, Nike Training Club ; coach → client : TrainHeroic, TrueCoach, SugarWOD | Le compte sert à la fois de sauvegarde, de synchro et de passage iOS ↔ Android. Partage par lien ou flux côté serveur. Pas de chiffrement de bout en bout documenté. Problème récurrent : comptes en double quand l'utilisateur change de fournisseur, connexion Apple difficile sur Android (Hevy, Strong). |
| **2. Local, sans compte, cloud de la plateforme** | Seconds (sauvegardes iCloud, export par fichier), minuteurs sans collecte | Pas de récupération de ses propres données lors d'un changement de téléphone iOS ↔ Android (le partage entre utilisateurs par fichier ou lien reste possible). |
| **3. Local, compte facultatif, sync propriétaire non chiffrée de bout en bout** | Things 3 | Apple uniquement, dernier état seulement. |
| **4. Local, compte facultatif, serveur chiffré côté client** | Day One, Obsidian Sync | Partage possible (journaux et coffres partagés). Une clé perdue rend les données irrécupérables (Day One). |

Sources détaillées : help.hevyapp.com, help.strongapp.io, help.fitbod.me, manual.runloop.com, support.trainheroic.com, help.truecoach.co, help.sugarwod.com, nike.com, dayoneapp.com, culturedcode.com, obsidian.md. Le tableau application par application est conservé dans le compte rendu de l'agent de benchmark de cette session.

### 4.2 Points techniques

- **Android Auto Backup** (developer.android.com, lu en entier) :
  - **25 Mo par application** ; au-delà, aucune sauvegarde n'est faite ;
  - dernière sauvegarde seulement, environ une fois par 24 h, sans garantie ;
  - comprend la base SQLite par défaut ;
  - Expo active `allowBackup` par défaut ;
  - les médias personnels devront être exclus, sinon toute la sauvegarde échoue.
- **Expo et cloud des plateformes** : aucun module Expo officiel pour CloudKit ou Google Drive, seulement des modules communautaires :
  - `react-native-cloud-storage` 3.3.0 : iCloud Drive et Google Drive `appDataFolder` ;
  - `expo-cloudkit` : iOS seulement ;
  - `expo-sqlite-cloudkit` 0.2.0 : très jeune.

  Une sauvegarde par la plateforme imposerait **deux mécanismes**, sans récupération des données lors d'un changement de téléphone iOS ↔ Android.
- **Exception récente** : Android 16 QPR2 (API 36.1) permet un transfert de données d'application vers ou depuis iOS au changement d'appareil (`cross-platform-transfer`). Il est limité aux appareils récents et demande un développement des deux côtés : il n'est pas retenu comme solution à ce stade.

### 4.3 Données de santé (France)

- Un historique avec **douleurs déclarées** relève **plausiblement** des données de santé au sens de l'article 9 du RGPD. Ce point n'est pas tranché par une source officielle trouvée. S'il est confirmé : consentement explicite, minimisation, analyse d'impact (AIPD) possible.
- La CNIL exclut les données conservées **uniquement en local** pour un usage personnel. Une sauvegarde sur le serveur KODJO sort de ce cas.
- **HDS probablement non applicable** à une application grand public sans activité de prévention, de soins ou de suivi. La bascule est possible si une fonction de prévention des blessures ou un partage avec un kiné apparaissent : à rapprocher de KIN-01.
- Les fiches CNIL sont anciennes et Légifrance n'a pas pu être lu : **avis juridique ou DPO recommandé**.

## 5. Analyse provisoire

Avec Android dès le départ, une sauvegarde par iCloud ou Google ne permet pas de passer d'un iPhone à un Android et oblige à maintenir deux mécanismes. **La sauvegarde sur le serveur KODJO devient l'option naturelle**, alignée sur le patron 4 (compte facultatif, local d'abord) déjà cohérent avec le ch. 12.

Le choix restant est le suivant :

| | Copie lisible par KODJO | Copie chiffrée côté téléphone |
|---|---|---|
| Simplicité | Plus simple | Gestion de clé à prévoir |
| Future synchronisation | La prépare | La complique |
| Exposition RGPD (art. 9) | Forte | Fortement réduite |
| Risque pour l'utilisateur | Aucune perte liée à une clé | Clé perdue = données perdues |

Le socle (compte et serveur de partage) précède la sauvegarde dans les deux cas.

## 6. Arbitrages ouverts (à Hermann)

1. **Objectif du premier lot :**
   - socle pour le partage ;
   - socle et sauvegarde/restauration serveur ;
   - socle et synchronisation.
2. **Compte facultatif ou obligatoire.**
3. **Moyens de connexion :** Apple, Google, lien e-mail, e-mail avec mot de passe. Apple est imposé sur iOS si un fournisseur tiers est proposé. Le benchmark signale des difficultés avec la connexion Apple sur Android.
4. **Sauvegarde serveur :** copie lisible ou chiffrée côté téléphone.
5. **Backend :** étude comparative ou Supabase directement. La localisation des données en UE est un critère RGPD.
6. **Avis juridique ou DPO** sur le statut des douleurs déclarées.

## 7. Décisions complémentaires (17/11/2026)

- **CPT-07** : le lot Compte fait partie du MVP.
- **CPT-08** : en cas de suppression du compte, les données locales restent sur le téléphone. Les données du compte sur le serveur sont supprimées. Le principe est validé ; les modalités du §8 restent à valider.

## 8. Suppression du compte — bonnes pratiques et modalités proposées

**Obligations des plateformes et du RGPD.** Les éléments suivants sont cités de mémoire et sont à vérifier sur les textes en vigueur avant le plan :
- **App Store** (règle 5.1.1(v)) : une app qui permet de créer un compte doit permettre de le supprimer depuis l'app. La suppression porte sur le compte et les données associées, pas sur une simple désactivation. Avec Sign in with Apple, les jetons doivent être révoqués auprès d'Apple.
- **Google Play** : suppression depuis l'app, et aussi depuis une page web accessible sans réinstaller l'app.
- **RGPD**, article 17 : effacement des données personnelles détenues par KODJO, sauf obligation légale de conservation.

**Analyse de CPT-08.** Garder les données locales est conforme à ces obligations. Elles sont sur l'appareil de l'utilisateur, qui les contrôle, et non chez KODJO. Elles disparaissent si l'utilisateur supprime l'app.

**Modalités proposées par Claude, à valider :**
1. **Serveur** : suppression immédiate du compte, du lien avec l'identité Apple/Google et du catalogue de compte.
2. **Contenu partagé ou publié par l'utilisateur** : retiré. Chez ses destinataires, on applique la règle déjà validée de **perte du dernier accès** (décisions du 17/11) : indisponibilité, séances à corriger, avertissement, historique conservé, médias personnalisés conservés. L'alternative serait de conserver ce contenu de manière anonyme. Elle n'est pas retenue, car l'utilisateur garde la maîtrise de ce qu'il a créé.
3. **Fiches reçues d'autres comptes et Bibliothèques KODJO** : sans compte, les droits ne peuvent plus être vérifiés. On applique la même règle de perte d'accès.
4. **Après la suppression** : comme le compte est obligatoire, l'app ramène à l'écran de connexion. À la création d'un nouveau compte, l'Utilisateur local existant y est rattaché (mécanisme du §12.7). Les données locales sont ainsi retrouvées.
5. **Dialogue de confirmation** : il indique ce qui est supprimé du serveur et ce qui reste sur le téléphone. Pour tout effacer, il suffit de supprimer l'application. Aucune option d'effacement local n'est ajoutée au premier lot, par simplicité.

## 9. Analyse — douleurs déclarées et maintien des données en local

**Constat.** La douleur est déjà spécifiée (D-427 à D-429, ch. 04 et 09) pour une exécution lancée dans un Programme avec l'option active :
- douleur initiale et finale de 0 à 10 ;
- localisations par zones corporelles, avec la latéralité ;
- effort perçu.

Une douleur chiffrée et localisée décrit un état de santé physique. Il s'agit **très probablement d'une donnée de santé « par nature »** au sens de la CNIL et de l'article 9 du RGPD. Le benchmark ne trouve pas de source officielle qui tranche explicitement ce cas.

**Lot Compte (CPT-01).** Le serveur ne reçoit que l'identité et le contenu partagé (fiches, Bibliothèques). Aucune Exécution, aucun Historique, aucune douleur. Les douleurs restent sur le téléphone, pour un usage personnel. La CNIL exclut ce cas du champ de la loi (« données conservées uniquement en local… à des fins exclusivement personnelles »). **Pour le lot Compte, KODJO ne traite donc pas de données de santé**, et les obligations de l'article 9 ne s'appliquent pas à ce lot.

**Conditions pour que cela reste vrai :**
- aucune remontée d'Historique ou de douleurs vers le serveur, ni par la télémétrie, ni par les rapports de plantage (Sentry), ni par des journaux ;
- le contenu partagé ne transporte aucune donnée d'Exécution. C'est déjà le cas avec KIN-01 : « ne pas remonter les Exécutions, douleurs, résultats ».

**Lot Sauvegarde (CPT-06).** Envoyer l'Historique sur le serveur fait sortir de l'exemption. Trois options pour y préparer :

| Option | Article 9 pour KODJO | Contrepartie |
|---|---|---|
| A. Exclure douleurs, localisations et effort de la sauvegarde | Évité | Ces valeurs sont perdues lors d'un changement de téléphone |
| B. Sauvegarde chiffrée côté téléphone (KODJO sans la clé) | Fortement réduit. KODJO héberge toutefois des données chiffrées : leur qualification reste à faire confirmer | Clé perdue = sauvegarde perdue |
| C. Sauvegarde lisible avec consentement explicite | Applicable : consentement exprès, information, minimisation, AIPD probable, sécurité renforcée | Charge de conformité la plus lourde, mais restauration complète |

L'hébergement certifié des données de santé (HDS) reste probablement non applicable : application grand public, sans activité de soins, de prévention ou de suivi par un professionnel. Le risque de bascule existe si le partage avec un kiné ou une finalité de prévention des blessures apparaît (cible KIN-01).

**Recommandation.** Inscrire dès le lot Compte une règle technique : « aucune donnée d'Exécution ne quitte le téléphone », y compris dans les rapports de plantage. Choisir entre A, B et C au lot Sauvegarde, après avis juridique ou DPO sur l'option retenue.

Cette analyse n'est pas un avis juridique.

## 10. Révision des modalités 2 et 3 du §8 (CPT-09)

Hermann a contesté les modalités 2 et 3 : « Si je partage une séance avec quelqu'un, puis que je supprime mon compte, pourquoi est ce que les mouvements et séances devraient être supprimées ? »

**Analyse.** La règle de perte du dernier accès (MOUV-ACC-20261117) vise la révocation volontaire par un auteur. La suppression d'un compte est un cas différent. Bonne pratique, sur le modèle de WhatsApp : le serveur efface ce qu'il détient ; les copies déjà présentes chez les destinataires restent. Cette pratique est cohérente avec l'article 17 du RGPD, qui porte sur les données détenues par KODJO.

**Décision CPT-09, validée par Hermann.** Les modalités 2 et 3 sont remplacées :
- les contenus déjà sur un téléphone restent utilisables, **figés** : aucune mise à jour, aucune redistribution, auteur « Compte supprimé » ;
- c'est une exception à MOUV-ACC-20261117, annotée dans ce document et dans le document Conception Bibliothèques.

**Validés ensuite par Hermann (« Je valide ces points ») :**
- **CPT-10** : modalités 1, 4 et 5 du §8 ;
- **CPT-11** : règle du §9, « aucune donnée d'Exécution ne quitte le téléphone ».

## 11. Vérification Supabase (CPT-05)

**Sources.** Les sites `supabase.com` et `docs.expo.dev` sont bloqués par le réseau de la session. J'ai lu à la place :
- les **sources officielles de la documentation** dans les dépôts GitHub `supabase/supabase` (commit `f78870c`, 17/11/2026 ; fichiers `apps/docs/content/guides/...` et `packages/shared-data/{plans,regions}.ts`) et `expo/expo` (`docs/pages/guides/using-supabase.mdx`, branche `main`) ;
- le registre npm.

La page de tarifs publique n'a pas été lue. Les prix viennent des fichiers de données du dépôt.

**Verdict : aucun obstacle à Supabase.** Quatre points restent à traiter dans le plan.

### Région UE

- Régions précises disponibles dans l'UE :
  - Paris `eu-west-3` ;
  - Francfort `eu-central-1` ;
  - Irlande `eu-west-1` ;
  - Stockholm `eu-north-1`.
- La région générale « Europe » peut placer le projet à Londres ou Zurich, hors UE. La documentation le dit explicitement et précise que le choix de région « n'est pas une preuve de conformité ».
- **Recommandation :** une région précise, Paris.
- Supabase propose un contrat de sous-traitance (DPA) et un guide RGPD, et se déclare SOC 2 Type 2.
- Non vérifié : Supabase étant une société américaine, la question des transferts et de l'accès par des autorités étrangères relève de l'avis juridique déjà prévu.

### Coût

| Formule | Prix mensuel | Utilisateurs actifs inclus | Stockage inclus | Au-delà |
|---|---|---|---|---|
| Free | 0 $ | 50 000 | 1 Go | — |
| Pro | 25 $ | 100 000 | 100 Go | 0,00325 $ par utilisateur actif, 0,0213 $ par Go et par mois, sortie de données 0,09 $ par Go (non mis en cache) |
| Team | 599 $ | 100 000 | 100 Go | Idem |

- Un projet Free est **mis en pause après 7 jours de faible activité**. La formule Free convient au développement, pas à la production.
- Pour le lot Compte, qui ne stocke que l'identité et le contenu partagé, la formule Pro à 25 $ par mois suffit largement.
- Le coût de calcul au-delà des crédits inclus n'a pas été vérifié.

### Connexion Apple

- **Sur iOS**, connexion native : `expo-apple-authentication` (version 57.0.2 publiée pour le SDK 57) puis `signInWithIdToken`. Aucune rotation de clé n'est nécessaire.
- **Sur Android**, Apple n'existe pas en natif : la connexion passe par une page web (`signInWithOAuth`) avec un lien de retour vers l'app. CPT-03 est donc réalisable.
- **Conséquence pour Android : maintenance.** Apple impose de configurer un Services ID et une clé de signature, puis de **régénérer la clé secrète tous les 6 mois**. Sans cette régénération, la connexion Apple cesse de fonctionner sur Android. Il faut un rappel récurrent et un responsable désigné.

### Connexion Google

- Méthode documentée par Supabase pour Expo : `@react-native-google-signin/google-signin` (17.0.0, compatible Expo ≥ 52) puis `signInWithIdToken`.
- La documentation se contredit : le guide de démarrage Expo de Supabase indique que la version gratuite de cette bibliothèque ne permet pas de transmettre de *nonce* sur iOS et Android.
- Trois options, à trancher dans le plan :
  - **(a)** bibliothèque gratuite et option Supabase « Skip nonce check », avec une protection réduite contre le rejeu d'un jeton ;
  - **(b)** version Premium de la bibliothèque, sur abonnement payant ;
  - **(c)** connexion par page web `signInWithOAuth`, gratuite et sûre, mais moins fluide qu'un choix de compte natif.

**Décision CPT-12 (Hermann, « option c) »)** : la connexion Google se fait par page web sur iOS et Android.

### Points utiles pour la suppression du compte (CPT-10)

- Suppression côté serveur par `auth.admin.deleteUser()`, avec la clé de service, donc dans une fonction serveur et jamais dans l'app.
- **Un utilisateur qui possède des fichiers dans Supabase Storage ne peut pas être supprimé** : il faut supprimer ses fichiers d'abord.
- La révocation des jetons Apple exigée par l'App Store n'est pas décrite par Supabase : elle est à implémenter par un appel à l'API Apple. Mécanisme à vérifier.

### Session sur le téléphone

- Le guide Expo stocke la session Supabase avec `expo-sqlite/localStorage`. KODJO utilise déjà `expo-sqlite`.
- Variante possible : `expo-secure-store` (57.0.4 pour le SDK 57). Choix à faire dans le plan.

## 12. Plan du lot Compte

Rédigé dans `_bmad-output/compte/plan-lot-compte.md`. Statut : **PLAN_READY_FOR_REVIEW**. Cinq ambiguïtés sont à arbitrer avant `PLAN_APPROVED`. Aucun code n'a été écrit.

## Hypothèses non démontrées

- Le statut juridique des douleurs (§4.3).
- La couverture effective de KODJO par la sauvegarde iCloud de l'appareil. Non vérifiée : essai de restauration à faire sur un appareil réel.

## Modifications réalisées

- Création de ce rapport.
- **Synchronisation documentaire, classe B** (évolution validée par Hermann) :
  - nouvelle section CPT-01 à CPT-06 au ch. 07, avec trois points À CLARIFIER ;
  - formulations contraires annotées, texte d'origine conservé : ch. 01 (Utilisateur) ; ch. 02 (critère de réussite, question reportée) ; ch. 05 (utilisateur prioritaire du MVP, V3 « Comptes et synchronisation ») ; ch. 12 (§12.0, §12.1, §12.7, table des choix techniques) ; `docs/PRODUCT.md` ; BIB-18.
- Aucun fichier applicatif modifié.

## Éléments non corrigés ou hors périmètre

- Vérification Supabase (CPT-05) : à faire avant le plan.
- Index des identifiants (annexe) : CPT-01 à CPT-06 non encore référencés.
- Plan d'implémentation : il suivra les arbitrages et sera soumis à revue avant tout code.

## Vérifications restant à faire sur appareil réel

- Restauration iOS (sauvegarde iCloud de l'appareil) d'une installation KODJO existante, pour mesurer le risque actuel.
- Comportement d'Android Auto Backup sur une installation KODJO avec médias.

## Tests

Aucun test applicable : mission documentaire, sans code modifié.

## Fichiers modifiés

- `.github/orchestration/reports/2026-11-17_CADRAGE-GESTION-COMPTE.md` (création)
- `docs/Specifications-fonctionnelles/01 – Vision Générale.md`, `02 – Utilisateurs et besoins.md`, `05 – Versions du produit.md`, `07 – Registre des décisions de conception.md`, `12 – Architecture technique.md`
- `docs/PRODUCT.md`, `docs/KODJO-Conception-Bibliotheques-Mouvements-Partage-2026-11-10.md`, `docs/KODJO-Mouvements-Etape2-Modele-cible-et-migrations-2026-11-11.md`
- `_bmad-output/compte/plan-lot-compte.md` (création)

## Commit final et état Git

Hash du commit et état Git final : communiqués dans la conversation à la clôture. Le rapport ne peut pas contenir le hash du commit qui le crée.
