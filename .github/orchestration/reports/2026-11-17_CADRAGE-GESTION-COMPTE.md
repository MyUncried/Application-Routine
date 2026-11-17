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

## Hypothèses non démontrées

- Le statut juridique des douleurs (§4.3).
- La couverture effective de KODJO par la sauvegarde iCloud de l'appareil. Non vérifiée : essai de restauration à faire sur un appareil réel.

## Modifications réalisées

Création de ce rapport uniquement. Aucun fichier applicatif ni normatif modifié.

## Éléments non corrigés ou hors périmètre

- Mise à jour des spécifications (ch. 05 et 07) : elle suivra les arbitrages, en classe B.
- Plan d'implémentation : il suivra les arbitrages et sera soumis à revue avant tout code.

## Vérifications restant à faire sur appareil réel

- Restauration iOS (sauvegarde iCloud de l'appareil) d'une installation KODJO existante, pour mesurer le risque actuel.
- Comportement d'Android Auto Backup sur une installation KODJO avec médias.

## Tests

Aucun test applicable : mission documentaire, sans code modifié.

## Fichiers modifiés

- `.github/orchestration/reports/2026-11-17_CADRAGE-GESTION-COMPTE.md` (création)

## Commit final et état Git

Hash du commit et état Git final : communiqués dans la conversation à la clôture. Le rapport ne peut pas contenir le hash du commit qui le crée.
