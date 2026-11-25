# Plan — Lot Compte et Communauté (MVP)

**Statut : voir § STATUT en fin de document (T1 seule).** Révisé le 25/11/2026 en réponse aux revues ChatGPT `PLAN_CHANGES_REQUESTED` (revue initiale, puis contre-revue F1 à F3) (`.github/orchestration/reports/2026-11-25_PLAN_REVIEW_COMPTE_T1.md`, candidat `06650dba`). T2 à T6 restent des esquisses. Aucun code avant `PLAN_APPROVED`.

**Sources normatives :**
- chapitre 07, décisions **CPT-01 à CPT-28** (section « Gestion de compte — premier lot » ; CPT-01 révisée, CPT-11 retirée, CPT-26 remplacée, CPT-28 corrigée) ;
- `docs/KODJO-Conception-Fonctionnalite-Communautaire-V1.md`, précisé par CPT-17 à CPT-28 ;
- règles Bibliothèques et Mouvements encore en vigueur : MOUV-D2/D3, MOUV-ACC restreint par CPT-17, MOUV-PART, BIB-01 à BIB-13, F4 ;
- chapitre 12, §12.7 et §12.20 ;
- rapport `.github/orchestration/reports/2026-11-17_CADRAGE-GESTION-COMPTE.md`.

## 1. Périmètre du lot (CPT-20)

1. **Compte** obligatoire, connexion Apple ou Google, suppression du compte.
2. **Relations** :
   - Follow unidirectionnel, désactivable globalement ;
   - Ami réciproque sur demande ;
   - blocage ;
   - identité publique à la première ouverture de l'onglet Communauté : pseudo obligatoire et unique sans suggestion, prénom et nom, rôle déclaré (CPT-18, CPT-25) ; recherche par prénom, nom ou pseudo ; « Apparaître dans la recherche » et « Follow public » choisis explicitement (CPT-27) ; affichage constant pseudo puis prénom et nom (CPT-26).
3. **Espaces relationnels** : 2 à n membres, sur invitation ou demande d'adhésion, rôles Administrateur et Membre, découvrables mais à contenu privé.
4. **Partage de contenus** vers un Ami ou dans un espace :
   - Mouvements, Bibliothèques, Séances, Circuits, Programmes, Modèles ;
   - ajout explicite par le destinataire ;
   - contenu reçu conservé selon CPT-17 ;
   - partage personnalisé : média et texte facultatif (MOUV-PART).
5. **Publication publique** d'une Bibliothèque, directe (CPT-22).
6. **Fil d'activité** :
   - exécutions réalisées visibles par défaut, privées par exception, au moment de l'exécution ou après coup ;
   - **douleurs jamais affichées** (CPT-21) ;
   - fil global et fil d'espace, commentaires, réactions ;
   - pas de publication rétroactive des exécutions antérieures (D16).
7. **Modération minimale** (CPT-19) : bouton « Signaler », retrait manuel par KODJO, y compris sur les copies conservées (CPT-17).

**Hors lot :** messagerie, QR codes, liens d'invitation, classements, paiements, sauvegarde et synchronisation (lot suivant, CPT-06).

## 2. Découpage en tranches

Toutes les tranches font partie du MVP. Chacune est livrée et recettée sur iPhone et Android avant la suivante.

| Tranche | Contenu | Dépend de |
|---|---|---|
| **T1** | Compte (détail ci-dessous) : connexion Apple ou Google, enregistrement du prénom et du nom fournis à la première connexion **sans écran supplémentaire**, rattachement, section Compte, suppression | — |
| **T2** | Identité publique (écran « Comment les autres vous voient », CPT-25 à CPT-27), recherche par prénom, nom ou pseudo, Follow, demandes d'Ami, blocage, signalement d'un utilisateur, **notifications push** (première demande d'autorisation à la première activation de la Communauté, CPT-30) | T1 |
| **T3** | Partage de contenus vers un Ami : envoi, réception, ajout explicite, médias, conservation CPT-17, mises à jour volontaires, signalement d'un contenu | T2 |
| **T4** | Espaces relationnels : création, invitation et demande d'adhésion, rôles, partage dans un espace | T3 |
| **T5** | Fil d'activité : publication des résumés d'exécution sans douleurs, visibilité par défaut et privée, fils global et d'espace, commentaires, réactions | T2 (T4 pour le fil d'espace) |
| **T6** | Publication publique d'une Bibliothèque et sa découverte (carte « Publique ») ; **suite de T6** : envoi du catalogue officiel KODJO vers un compte KODJO, téléchargé après la première connexion (CPT-33) | T3 |
| **Transverse** | Outil de retrait KODJO (CPT-19) : fonction serveur et procédure ; tableau de bord Supabase pour consulter les signalements | T2 |

## 3. Modèle serveur (Supabase, Paris), vue d'ensemble

Le détail sera fixé dans chaque tranche. Les règles d'accès (RLS) sont vérifiées côté serveur pour chaque table.

- T1 : `accounts`, `account_local_users`, `catalogues`, `apple_tokens` (détail en T1). T2 : `profiles` (pseudo unique, prénom et nom affichés, photo, rôle déclaré, choix de recherche et de Follow public).
- `follows`, `friend_requests`, `friendships`, `blocks`.
- `spaces`, `space_members` (rôle), `space_join_requests`, `space_invitations`.
- `shared_items` : contenu partagé, avec sa charge utile au format d'échange existant `KODJO_MOVEMENT_CATALOGUE`, étendu aux Séances et aux Programmes, son empreinte et sa révision. `shares` : destinataire, Ami ou espace, plus le texte facultatif.
- Stockage privé des médias, avec URL temporaires selon les droits.
- `feed_executions` : résumé d'exécution, **sans douleurs ni localisations** (CPT-21), visibilité. `comments`, `reactions`.
- `reports` (signalements) et `removals` (retraits par KODJO, propagés aux copies).

**Données qui quittent le téléphone, par tranche :**
- **T1** : identité du compte (identifiant, fournisseur, e-mail ou adresse relais, prénom et nom fournis), identifiants des Utilisateurs locaux rattachés, jeton Apple de révocation (côté serveur seulement). Aucune donnée d'Exécution.
- **T2** : profil public et relations. **T3/T4** : contenus partagés et leurs médias. **T5** : résumés d'exécution visibles, **sans douleurs ni localisations** (CPT-21), commentaires et réactions.
- **Lot sauvegarde** (après le lot, CPT-06) : données privées et Historique, sous les conditions RGPD à définir.

## 4. Décisions acquises et arbitrages

Acquis (chapitre 07) : notifications push et pastilles (CPT-23) ; ordre T1 à T6 et écrans listés avant chaque tranche (CPT-24) ; identité publique, recherche et affichage (CPT-25 à CPT-28).

**Différé avant T5, ne conditionne pas T1 :** contenu définitif du résumé d'exécution dans le fil ; annonce éventuelle d'un changement de pseudo dans le fil des abonnés (CPT-28).

**ARBITRAGES** (publiés sur la PR #446, tous tranchés) :
- **A1 — É3, delta de texte** : **validé (CPT-29)**.
- **A2 — Moment de la première demande d'autorisation des notifications push** : **validé (CPT-30)**, à la première activation de la Communauté (T2), jamais en T1.
- **A3 — Téléphone dont le compte a été supprimé, puis compte existant** : **refus validé (CPT-31)**, puis règle précisée par **CPT-32** (seul le même identifiant Apple ou Google retrouve les données).

## 5. Écrans nécessaires — T1 (à vérifier par Hermann dans Figma)

| # | Écran ou état | Existant connu dans le dépôt | Nature |
|---|---|---|---|
| 1 | Connexion, porte d'entrée (É1) | Aucune frame connue | Écran |
| 2 | Connexion : variante installation existante, état sans réseau, erreur (É1) | Aucune frame connue | États |
| 3 | Modifier le profil + section Compte (É2) | « Modifier le profil » `1992:778` ; composant `src/features/preferences/ProfileEditScreen.tsx`, route `app/(tabs)/profile-edit.tsx` ; section Compte absente | Écran existant à compléter |
| 5 | Confirmation de suppression du compte (É3) | Alerte native, rien à dessiner | Alerte |
| 6 | Refus d'un autre compte (É4) | Alerte native, rien à dessiner | Alerte |
| 8 | Politique de confidentialité | Texte provisoire rédigé ; URL à publier | Web |

L'onglet **Communauté** du Profil existe déjà, désactivé (`ProfileScreen.tsx`, « hors MVP, indisponible »). Il servira à partir de T2. La demande d'autorisation des notifications push et l'écran d'identité publique relèvent de T2.

# Tranche T1 — Compte (détail)

### TÂCHE

Compte obligatoire du MVP (CPT-02, CPT-07) :
- connexion par Apple ou Google (CPT-03, CPT-12) ;
- prénom et nom fournis enregistrés à la première connexion, sans écran supplémentaire (CPT-13, CPT-25) ;
- rattachement de l'Utilisateur local (CPT-14) ;
- catalogue de compte côté serveur ;
- section Compte (CPT-13) ;
- suppression du compte (CPT-08 à CPT-10).

**Hors T1 :**
- pseudo, profil public, recherche, relations et notifications push (T2) ;
- partages (T3, T4) ;
- fil d'activité (T5) ;
- publication (T6) ;
- sauvegarde (lot suivant).

### COMPRÉHENSION

**Identité locale actuelle**
- L'Utilisateur local est créé par `migrateDatabase` dans la table singleton `users` (`usr_<32 hex>`).
- Les agrégats le référencent par `owner_id ... REFERENCES users(id) ON UPDATE RESTRICT` (`migration001.ts`).
- Son identifiant **ne peut donc pas être réécrit**. T1 ne le modifie jamais.

**Compte**
- Le Compte (identité Supabase) est distinct de l'Utilisateur (§12.7).
- Un compte peut être rattaché à **plusieurs Utilisateurs locaux** : un par téléphone, sans fusion de données (CPT-14). La fusion relève du lot sauvegarde.

**Réseau en T1**
- Seuls l'identité du compte et les rattachements sont envoyés.
- Aucune donnée d'Exécution.

**Hors ligne**
- La porte d'entrée dépend du **lien local**, pas de la validité du jeton.
- Les jetons de rafraîchissement Supabase n'expirent pas par défaut : ils sont seulement à usage unique (`auth/sessions.mdx`).
- On ne configure ni durée maximale de session ni délai d'inactivité, ce que CPT-02 ne demande pas.

**Modes de connexion**

| Fournisseur | iOS | Android |
|---|---|---|
| Apple | Natif (`expo-apple-authentication`, puis `signInWithIdToken`) | Page web (`signInWithOAuth`) |
| Google | Page web (`signInWithOAuth`) | Page web (`signInWithOAuth`) |

### PÉRIMÈTRE / FICHIERS IMPACTÉS

#### A. Serveur (nouveau dossier `supabase/`, versionné, sans secret)

**Migration `supabase/migrations/0001_t1_accounts.sql`**

RLS activée sur toutes les tables. Aucune écriture directe par l'app : les écritures passent par les fonctions ci-dessous.

| Table | Contenu | Accès |
|---|---|---|
| `accounts` | `auth_user_id` (clé, vers `auth.users`) ; `apple_tokens_invalidated_at` (nullable, renseigné par `consent-revoked`) ; `provider` (`apple` ou `google`) ; `provider_subject` (identifiant `sub` du fournisseur) ; `email` ; `email_is_private_relay` ; `relay_forwarding_enabled` (Apple, nullable) ; `given_name`, `family_name` (nullables) ; `created_at` ; `deletion_requested_at` (nullable) | Lecture de sa propre ligne |
| `account_local_users` | `auth_user_id`, `local_user_id`, `first_linked_at`, clé `(auth_user_id, local_user_id)` | Lecture de ses propres lignes |
| `catalogues` | `id`, `owner_auth_user_id` UNIQUE, `created_at` | Lecture de sa propre ligne |
| `apple_tokens` | `auth_user_id`, `client_id`, `refresh_token` chiffré | **Aucun accès client** (clé de service seulement) |
| `account_deletions` (registre de suppression, **conservé après la suppression**) | `auth_user_id` (clé, sans clé étrangère) ; empreintes (hachages) du reçu de suppression et des `local_user_id` rattachés ; `requested_at`, `apple_revocation` (`done` \| `not_required` \| `not_applicable`), `data_purged_at`, `auth_deleted_at` ; purge automatique 90 jours après `auth_deleted_at` | **Aucun accès client** ; lecture uniquement via `deletion-status` |
| `apple_notification_events` | `iss`, `jti` (clé `(iss, jti)`), `sub`, `type`, `status` (`received` \| `done`), `received_at`, `done_at` ; purge 90 jours après `done_at` | **Aucun accès client** |

**Fonction SQL `link_account(local_user_id, given_name, family_name)`** (`SECURITY DEFINER`)
- L'appelant est déterminé par `auth.uid()`, jamais par un paramètre.
- Elle crée ou complète `accounts` sans écraser un prénom ou un nom déjà enregistré par une valeur vide.
- Elle crée `catalogues` (`ON CONFLICT DO NOTHING`) et ajoute `account_local_users` (`ON CONFLICT DO NOTHING`).
- Elle renvoie le compte, le catalogue et la liste des Utilisateurs locaux déjà rattachés.
- Elle est **idempotente** et sûre en cas de connexions concurrentes ou de reprise.

**Fonction serveur `apple-token`**
- Reçoit le code d'autorisation Apple juste après la connexion.
- L'échange chez Apple (`/auth/token`) contre un jeton de rafraîchissement révocable, selon Apple TN3194.
- Stocke ce jeton dans `apple_tokens`.
- Le secret client est généré côté serveur à partir de la clé `.p8`, stockée comme secret Supabase, pour l'identifiant client concerné : bundle iOS ou Services ID.

**Fonction serveur `delete-account`**, ordre et reprise : voir « Suppression ».

**Fonction serveur `apple-notifications`** (F3)
- Point de réception des notifications serveur à serveur d'Apple ([documentation Apple](https://developer.apple.com/documentation/signinwithapple/processing-changes-for-sign-in-with-apple-accounts)). Son adresse est à renseigner dans « Server-to-Server Notification Endpoint » de `com.ankusha.kodjo`, laissé vide le 24/11/2026.
- **Vérification** du jeton reçu (JWS) : signature par les clés publiques d'Apple, `iss = https://appleid.apple.com`, `aud` égal à l'un des identifiants clients KODJO. Sinon : 400, aucun effet.
- **Identifiant de l'événement** : couple **`(iss, jti)`** du jeton vérifié. Deux utilisateurs produisant le même type d'événement au même instant ont des `jti` distincts et sont **traités séparément**.
- **Traitement idempotent et reprise** (F3) :
  1. **Une transaction de base de données** couvre : l'insertion de `(iss, jti)` (`INSERT … ON CONFLICT DO NOTHING`) avec `status = received`, le verrouillage de la ligne (`SELECT … FOR UPDATE`), les **effets en base** de l'événement (mise à jour de `relay_forwarding_enabled` ; suppression de `apple_tokens` et `apple_tokens_invalidated_at` ; création ou reprise de la ligne `account_deletions` avec `apple_revocation = not_required`) et, pour `email-disabled` / `email-enabled`, le passage à `status = done`. Ces opérations sont atomiques : toutes ou aucune.
  2. **Effets hors base**, non couverts par la transaction : fermeture des sessions (`auth.admin.signOut`) pour `consent-revoked`, purge (Storage, tables, `deleteUser`) pour `account-delete`. Ils sont exécutés **après** la transaction ; chacun est idempotent (une nouvelle fermeture de session est sans effet ; la purge reprend à la première étape non accomplie de `account_deletions`). La ligne passe à `status = done` seulement **après** leur réussite.
  3. **Nouvelle livraison du même événement** : la ligne existe. `status = done` : réponse 200, **aucun effet répété**. `status = received` (interruption après l'enregistrement de `(iss, jti)`) : l'action inachevée est **reprise** à partir des étapes 1 et 2, puis la ligne passe à `done`.
  4. Tant que l'action n'est pas achevée, la réponse est une erreur 5xx, pour qu'Apple livre à nouveau. La politique de nouvelle livraison d'Apple n'est pas documentée dans les sources lues : **une tâche planifiée reprend aussi les événements restés `received`** depuis plus de 15 minutes, sans dépendre d'Apple.
- **Rattachement au compte** : `events.sub` vérifié ↔ `accounts.provider_subject` (fournisseur Apple). Sujet inconnu : 200, journalisé, aucun effet.
- **Événements :**
  - `email-disabled` / `email-enabled` : l'utilisateur coupe ou rétablit le **transfert** de son adresse relais. **L'adresse affichée ne change pas** ; seul `relay_forwarding_enabled` est mis à jour. Pas d'effet visible en T1.
  - `consent-revoked` : Apple a invalidé les jetons. Suppression de la ligne `apple_tokens` (devenue inutile) et fermeture des sessions du compte (`auth.admin.signOut`). Au retour du réseau, l'app constate une session refusée et `deletion-status` répond `active` : nouvelle connexion (voir « Hors ligne »).
  - `account-delete` : l'utilisateur a supprimé son compte Apple ; **Apple a déjà invalidé les jetons**. Purge du compte par la même procédure que `delete-account`, avec `apple_revocation = not_required` : **aucun appel de révocation, donc aucune boucle**.
- Réponse 200 après traitement achevé, y compris pour un événement déjà `done`.

**`supabase/config.toml`** : fournisseurs, adresses de retour autorisées, réglages de session par défaut.

#### B. Application

**Dépendances**
- `@supabase/supabase-js` et `expo-apple-authentication@57.0.2`.
- `expo-web-browser`, `expo-linking` et `expo-sqlite` sont déjà présents.

**Configuration (`app.json`, `app.config.js`)**
- Capacité Sign in with Apple (`ios.usesAppleSignIn`) et plugin `expo-apple-authentication`.
- `android.package` par variante : `com.ankusha.kodjo`, `.dev`, `.bmad`, `.catalogue`.
- **Le retrait de `aps-environment` (`withoutPushEntitlement`) est conservé.** Les notifications **locales** du planning ne doivent pas changer.
- **Schémas de retour : quatre variantes, trois schémas.** Routine et Routine Dev partagent `routine`.
  - Vérifier, les deux apps installées, que le retour OAuth ouvre la bonne.
  - Si ce n'est pas le cas, ajustement ciblé : schéma `routine-dev` pour la seule variante Dev, et ajout de `routine-dev://auth/callback` aux adresses autorisées dans Supabase (action de Hermann).
  - Les comportements des variantes BMAD et Catalogue ne changent pas.

**Infrastructure** (`src/infrastructure/account/`)
- `supabaseClient.ts` : session persistée par `expo-sqlite/localStorage`, selon le guide Expo.
- `SupabaseAccountGateway.ts` : connexion, appel de `link_account`, de `apple-token` et de `delete-account`, rafraîchissement de session avec classification des erreurs (voir « Hors ligne »).

**Migration locale 040** (`migration040.ts`, enregistrée dans `migrateDatabase.ts`, `DATABASE_VERSION = 40`)
- La 039 est la dernière de la chaîne actuelle. Le numéro sera revérifié après la fusion de `main`.
- Elle est **additive** et crée deux tables :
  - `account_link` (singleton) : `auth_user_id`, `provider`, `provider_subject`, `email`, `email_is_private_relay`, `given_name`, `family_name`, `catalogue_id`, `linked_at` ;
  - `account_lifecycle` (singleton) : `state` (`NEVER_LINKED` | `LINKED` | `REAUTH_REQUIRED` | `DELETION_PENDING` | `DELETED_ON_THIS_DEVICE`), `deletion_requested_at`, `deletion_receipt` (reçu aléatoire de suppression, conservé jusqu'à confirmation), `deleted_provider_subject_hash` (empreinte de l'identifiant Apple ou Google du compte supprimé, CPT-32).
- Aucune donnée métier modifiée. Migrations et réparations existantes inchangées.

**Domaine** (`src/domain/account/`)
- `AccountService`, avec ports, sans dépendance directe à Supabase ni à SQLite.
- Opérations : `signIn(provider)`, `link`, `deleteAccount`, `resumePendingDeletion`, `onSessionRefreshResult`, `accountState`.

**Porte d'entrée**
- `app/_layout.tsx` affiche É1 tant que `account_link` est vide. Elle est montée comme `MigrationNoticeGate`, après la base prête.
- **Priorité de la réauthentification** (F2) : un lien présent suffit à ouvrir l'app **sauf** si l'état `REAUTH_REQUIRED` est enregistré (session refusée, compte encore actif ou état non prouvé) ; É1 s'affiche alors **avant** l'ouverture, le lien et les données étant conservés. Hors ligne, cet état ne peut pas apparaître : l'app s'ouvre.
- Écran `app/sign-in.tsx` (É1).

**Section Compte (É2)**
- Elle s'ajoute dans `src/features/preferences/ProfileEditScreen.tsx` (route `app/(tabs)/profile-edit.tsx`).
- Elle lit `account_link`, **hors ligne compris**.
- **Nom absent** : la ligne Nom n'est pas affichée, aucune valeur n'est inventée.

**Lexique** : clés de É1 à É4 dans le lexique centralisé.

#### C. Documentation
- Chapitres 06 et 13 : écrans É1 à É4 (classe B, textes CPT-16).
- Chapitre 12 : architecture compte (classe D).
- Procédure d'exploitation :
  - régénération de la clé secrète Apple (180 jours) ;
  - secrets serveur (`.p8`, identifiants clients).
- Politique de confidentialité : traitements T1 réellement livrés (voir « Configuration et recette »).

### RATTACHEMENT (règles et tests, CPT-14 et CPT-10)

État local considéré :
- présence de `account_link` ;
- `account_lifecycle.state` ;
- présence de données métier, c'est-à-dire au moins un agrégat appartenant à l'Utilisateur local.

État serveur considéré : `account_local_users` du compte qui se connecte.

| # | Situation | Résultat |
|---|---|---|
| R1 | **Compte neuf**, téléphone vierge ou peuplé, jamais rattaché | `link_account` : création du compte et du catalogue, rattachement de l'Utilisateur local. `account_link` est écrit **après** la réponse du serveur. |
| R2 | **Compte existant, téléphone vierge** (réinstallation, nouveau téléphone) | L'Utilisateur local (nouvel identifiant) est **ajouté** aux Utilisateurs du compte. Aucune réécriture de `users.id`. Aucune donnée récupérée (pas de sauvegarde en T1). Prénom et nom sont lus dans `accounts` quand Apple ne les renvoie plus. |
| R3 | **Même compte, téléphone déjà peuplé** avec un autre identifiant local (appareils de recette, installation antérieure à T1) | Accepté. L'Utilisateur local est ajouté. **Chaque téléphone garde ses données et son identifiant**, sans fusion ni perte. |
| R4 | **Autre compte Y**, téléphone lié à X (session expirée ou révoquée, nouvelle connexion avec Y) | **Refus É4**. La session Y est fermée localement. `account_link` de X est intact. **Aucun appel** à `link_account` pour Y. |
| R5 | Téléphone où le compte a été **supprimé** (`DELETED_ON_THIS_DEVICE`), données conservées, **lien local vide** (fournisseur et e-mail effacés) ; seule l'empreinte `deleted_provider_subject_hash` subsiste (CPT-32) | **Même identifiant Apple ou Google** (empreinte identique) : compte neuf créé, rattachement R1. **Autre identifiant**, compte neuf ou existant : **refus**, alerte **É4-R5**, sans appel à `link_account`. |
| R6 | Reprise après coupure pendant le rattachement | `link_account` idempotent. Tant que `account_link` n'est pas écrit, la porte reste sur É1 et le rattachement est rejoué à la connexion suivante. |

**Tests**
- Jest : R1 à R6, dont deux bases peuplées avec des identifiants différents pour le même compte, sans perte de lignes ; R4 (É4 avec fournisseur et e-mail) et **R5 avec lien local vide** : même identifiant (rattaché), autre identifiant neuf ou existant (É4-R5, aucun fournisseur ni e-mail affiché).
- SQL : idempotence de `link_account`, appels concurrents, RLS.

### SUPPRESSION (CPT-08 à CPT-10, Apple TN3194)

**Côté application**
1. Confirmation É3.
2. Génération d'un **reçu de suppression** aléatoire (`deletion_receipt`), `account_lifecycle.state = DELETION_PENDING`. Le lien local est **conservé**.
3. Appel de `delete-account` avec le reçu.
4. Seulement après une réponse `deleted`, ou une preuve `deleted` de `deletion-status` :
   - fermeture de la session (stockage `localStorage` vidé) ;
   - empreinte de `provider_subject` enregistrée dans `deleted_provider_subject_hash` (CPT-32), puis suppression de `account_link` et du reçu ;
   - `account_lifecycle.state = DELETED_ON_THIS_DEVICE` ;
   - retour à É1.
5. **Données métier conservées.**
6. En cas d'échec, de réponse `retryable_error` ou sans réseau : rien n'est effacé localement, message É3 sans réseau ou erreur, nouvelle tentative possible.
7. Au lancement suivant, une suppression en suspens est reprise (`resumePendingDeletion`, voir « Reprise »).

**Côté serveur (`delete-account`)** : chaque étape est enregistrée dans `account_deletions`, qui survit à la suppression. Une nouvelle exécution **reprend à la première étape non accomplie**.

| Étape | Action | En cas d'échec |
|---|---|---|
| 0 | Authentification par le jeton de l'appelant. Sans jeton : 401. L'identifiant n'est jamais passé en paramètre, donc aucune action sur un autre compte. | — |
| 1 | Création ou reprise de la ligne `account_deletions` : empreinte du reçu, empreintes des `local_user_id` rattachés, `requested_at`. | `retryable_error` |
| 2 | **Révocation Apple** (`/auth/revoke`) avec le jeton de `apple_tokens`, si le compte est Apple ; `apple_revocation = done` (ou `not_applicable` pour Google, `not_required` si Apple a déjà invalidé les jetons : `account-delete`, ou `apple_tokens_invalidated_at` renseigné). | `retryable_error`, **rien n'est supprimé** |
| 3 | Suppression des objets Storage du compte (absents en T1 ; prévue car `deleteUser` échoue si le compte en possède). | `retryable_error` |
| 4 | Suppression de `catalogues`, `account_local_users`, `apple_tokens`, `accounts` ; `data_purged_at`. | `retryable_error` |
| 5 | `auth.admin.deleteUser()`, puis `auth_deleted_at` ; réponse `deleted`. **À la reprise**, si `data_purged_at` est renseigné mais pas `auth_deleted_at`, le serveur **vérifie d'abord** l'existence du compte (`auth.admin.getUserById`) : absent, il écrit `auth_deleted_at` sans rappeler `deleteUser` ; présent, il appelle `deleteUser`. | `retryable_error` ; service Auth indisponible : `retryable_error`, aucune conclusion |

**Fonction serveur `deletion-status`** (sans session, pour les cas où la session n'est plus utilisable)
- Entrée : `auth_user_id` du lien local et **une preuve** : le reçu de suppression (téléphone qui a demandé la suppression) ou le `local_user_id` du téléphone (autre téléphone du même compte). Ces valeurs aléatoires de 128 bits ne sont jamais affichées ni publiées.
- Sortie, seulement si la preuve correspond aux empreintes enregistrées ou à `account_local_users` : `deleted` (suppression achevée), `in_progress` (étapes restantes), `active` (compte existant, aucune suppression). Sinon : `unknown`, sans autre information.
- **Suppression interrompue après `deleteUser()`** (F2) : si le registre indique `data_purged_at` sans `auth_deleted_at`, `deletion-status` **vérifie la disparition effective** du compte auprès du service Auth (`auth.admin.getUserById`). Compte absent : il écrit `auth_deleted_at` et répond `deleted`. Compte présent : `in_progress` (la reprise de `delete-account` terminera l'étape 5). **Service Auth indisponible** : réponse 503 `indeterminate`, aucune écriture ; le téléphone **conserve son rattachement** et réessaie plus tard.

**Reprise** (F2), trois situations :

| Situation | Preuve disponible | Action suivante | Lien local | Résultat observable |
|---|---|---|---|---|
| **a. Données serveur effacées, `deleteUser` en échec** (étape 4 faite, étape 5 échouée) | Le compte Auth existe encore : la session reste rafraîchissable ; `account_deletions.data_purged_at` est renseigné | L'app relance `delete-account` avec sa session (au lancement ou au retour du réseau) ; le serveur constate l'étape 4 faite et **reprend à l'étape 5**, sans révocation Apple à refaire (`apple_revocation` déjà renseigné) | **Conservé** (`DELETION_PENDING`) jusqu'à `deleted` | Message d'erreur de É3 au premier échec ; à la reprise réussie, retour à É1 |
| **b1. Suppression achevée, réponse perdue, justificatif expiré** (`auth_deleted_at` écrit) | Plus de session possible. Le téléphone garde son **reçu de suppression** | L'app appelle `deletion-status` avec `auth_user_id` et le reçu ; réponse `deleted` | **Conservé** jusqu'à la réponse, puis effacé | Retour à É1 avec les données conservées, sans erreur |
| **b2. Interruption juste après `deleteUser()`**, avant l'écriture de `auth_deleted_at` (justificatif expiré, compte Auth déjà supprimé) | Le reçu ; le registre indique `data_purged_at` sans `auth_deleted_at` | `deletion-status` vérifie l'absence du compte auprès du service Auth, écrit `auth_deleted_at` et répond `deleted`. Service Auth indisponible : 503 `indeterminate` | `deleted` : effacé. `indeterminate` : **conservé**, nouvel essai | `deleted` : É1, données conservées. `indeterminate` : aucun changement visible ; nouvel essai au retour suivant |
| **c. Retour en ligne avec une session refusée** (jeton de rafraîchissement refusé, sans demande de suppression sur ce téléphone) | Le `local_user_id` du téléphone, rattaché au compte | L'app appelle `deletion-status` avec `auth_user_id` et `local_user_id`. `deleted` : nettoyage local comme une suppression. `active` : `REAUTH_REQUIRED` (session seule révoquée, par exemple `consent-revoked`). `in_progress` ou `unknown` (ex. registre purgé après 90 jours) : `REAUTH_REQUIRED`. `indeterminate` (service Auth indisponible) : traité comme une erreur transitoire, aucun changement, nouvel essai | `deleted` : effacé. Autres cas : **conservé** | `deleted` : É1, données conservées. Sinon : É1 **avant** ouverture (priorité de la réauthentification) ; à la reconnexion, même compte : R3 ; **même `provider_subject` mais nouvel `auth_user_id`** (ancien compte supprimé, compte neuf du même titulaire) : rattachement accepté (CPT-32) ; autre titulaire : R4 |

Tant que la suppression n'est pas **prouvée** (`deleted`), le rattachement est conservé. Une erreur réseau ou 5xx n'est jamais interprétée comme une suppression.

**Jeton Apple révocable** (TN3194) :
- **iOS natif** : le code d'autorisation renvoyé par `expo-apple-authentication` est envoyé **immédiatement** (validité de 5 minutes) à `apple-token`, qui l'échange et stocke le jeton de rafraîchissement. Un ancien code n'est jamais réutilisé.
- **Android (page web)** : Supabase échange lui-même le code. La disponibilité du jeton du fournisseur Apple dans la session (`provider_refresh_token`) **n'est pas documentée pour Apple**, seulement pour Google et Azure. **Vérification en tout premier dans l'étape serveur.**
  - Si le jeton n'est pas disponible, arrêt `CHANGE_REQUEST_REQUIRED`, avec une alternative : flux OAuth Apple Android porté par une fonction serveur KODJO, qui conserve le jeton.
  - Aucune suppression ne réussit pour un compte Apple sans révocation, **sauf lorsque Apple a déjà invalidé les jetons** (`account-delete`, ou `consent-revoked` enregistré dans `apple_tokens_invalidated_at`) : la purge se poursuit alors avec `apple_revocation = not_required`.
- **Nouvelle connexion** d'un compte Apple : le jeton stocké est remplacé.

**Tests**
- Fonction serveur : appel anonyme, tentative sur un autre compte, échec simulé à chaque étape puis reprise à la bonne étape (dont **a** : étape 4 faite, `deleteUser` en échec), ordre des appels.
- `deletion-status` : preuve correcte ou incorrecte (`unknown` sans fuite), reçu après suppression achevée (cas **b1**), **interruption après `deleteUser()` avant `auth_deleted_at`** (cas **b2** : compte absent vérifié → `auth_deleted_at` écrit, `deleted` ; service Auth indisponible → `indeterminate`, aucune écriture), `local_user_id` d'un autre téléphone (cas **c**), registre purgé.
- `delete-account` : reprise de l'étape 5 avec compte déjà absent (pas de second `deleteUser`).
- Jest : données métier intactes ; session et lien effacés seulement après preuve `deleted` ; reprise au lancement ; séquences **a**, **b1** (réponse perdue, session impossible), **b2** (`deleted` puis, service Auth indisponible, `indeterminate` avec lien conservé) et **c** (`deleted`, `active`, `unknown`) ; priorité de `REAUTH_REQUIRED` sur l'ouverture.
- Recette réelle : suppression avec Apple (iOS et Android) et avec Google, puis vérification dans les réglages Apple (« Apps utilisant l'identifiant Apple ») que KODJO n'y figure plus.

### HORS LIGNE ET RETOUR DU RÉSEAU

- **Lancement et exécution hors ligne avec un jeton expiré** : autorisés dès que `account_link` existe.
- **Au retour du réseau**, le rafraîchissement de session est classé :
  - **erreur transitoire** (réseau, délai, 5xx) : aucun changement, nouvel essai plus tard ; l'app reste ouverte ;
  - **jeton refusé** : l'erreur ne distingue pas « compte supprimé » de « session révoquée ». La conclusion vient **uniquement** de `deletion-status` (cas **c** de « Reprise ») : `deleted` → nettoyage local ; `active`, `in_progress` ou `unknown` → `REAUTH_REQUIRED`, lien conservé ; `indeterminate` → aucun changement, nouvel essai, lien conservé.
- **Tests Jest** : expiration hors ligne (l'app s'ouvre), erreur transitoire (aucun changement), compte supprimé ailleurs (`deleted`), session révoquée (`active` → É1 avant ouverture), état indéterminé (`unknown` → É1, lien conservé), reconnexion avec nouvel `auth_user_id` et même `provider_subject` (R5).
- **Tests fonction `apple-notifications`** : signature ou `aud` invalides (400, aucun effet) ; **même événement rejoué** (`jti` identique) traité une fois ; **interruption après l'enregistrement de `(iss, jti)`** et avant la fin de l'action (`status = received`) : la nouvelle livraison, ou la tâche planifiée, achève l'action une seule fois ; événement déjà `done` : 200 sans effet répété ; échec simulé dans la transaction : aucun effet partiel en base ; **deux sujets, même type, même instant** traités séparément ; sujet inconnu ignoré ; `email-disabled` puis `email-enabled` (adresse affichée inchangée) ; `consent-revoked` (sessions fermées, jeton supprimé) ; `account-delete` (purge **sans** appel de révocation, `apple_revocation = not_required`) ; suppression demandée après `consent-revoked` (purge sans révocation).
- **Recette** : suppression sur le téléphone A, puis le téléphone B revient en ligne.

### CONFIGURATION ET RECETTE

**Réglages déclarés faits par Hermann** (`reglages-externes-T1.md`), **non vérifiés par un essai** :
- Supabase `kodjo-dev` (Paris, Free) et adresses de retour (3 schémas) ;
- Apple :
  - App ID primaire `com.ankusha.kodjo`, variantes groupées ;
  - Services ID `com.ankusha.kodjo.signin` ;
  - clé Sign in with Apple ;
  - fournisseur activé, Services ID en premier ;
- Google : client Web, fournisseur activé ;
- EAS : `EXPO_PUBLIC_SUPABASE_URL` et `EXPO_PUBLIC_SUPABASE_ANON_KEY` ;
- identifiant Android `com.ankusha.kodjo`.

**Vérifications restant à faire**, lors de la première recette :
- connexion réelle sur chaque plateforme et chaque fournisseur ;
- validité de la clé secrète Apple ;
- retour vers la bonne app avec Routine et Routine Dev installées ensemble ;
- secrets serveur `.p8` et identifiants clients pour `apple-token` ;
- adresse de `apple-notifications` renseignée chez Apple et réception d'un événement réel (retrait de l'autorisation depuis les réglages Apple de l'iPhone).

**Politique de confidentialité** :
- **texte provisoire rédigé** (`docs/legal/…PROVISOIRE…`) ;
- **URL à publier** sur le site Ankusha ;
- **déclarations des stores** (App Privacy, Data safety) **à faire** ;
- **version de production** après avis juridique.

Traitements T1 à déclarer : identité du compte, prénom et nom, e-mail ou relais, identifiants des Utilisateurs locaux, jeton Apple de révocation.

### PLAN D'IMPLÉMENTATION

1. Créer la branche `compte/lot-1` depuis `main` après fusion de la PR #446. Préflight : HEAD, numéro de migration libre, état propre.
2. **Vérification préalable** : disponibilité du jeton Apple en connexion web Android. Arrêt `CHANGE_REQUEST_REQUIRED` si elle n'est pas disponible.
3. Serveur :
   - migration 0001 et RLS ;
   - `link_account` ;
   - fonctions `apple-token`, `delete-account`, `apple-notifications` ;
   - tests SQL et tests des fonctions.
4. Application :
   - configuration (variantes, schémas, Apple) ;
   - migration 040 ;
   - client et passerelle ;
   - `AccountService` (R1 à R6, suppression, hors ligne) ;
   - tests Jest.
5. Porte d'entrée et É1 ; É2 dans `ProfileEditScreen` ; É3 et É4.
6. Journaux et rapports de plantage : aucune information sensible (§12.20).
7. Documentation (ch. 06, 12, 13, politique), synchronisation code/documentation, rapport de livraison.
8. Recette sur appareils réels, iPhone et Android. Aucun contrôle visuel automatisé.

### MIGRATION / DONNÉES

- **Locale** : migration **040** additive (`account_link`, `account_lifecycle`). Tests :
  - installation neuve ;
  - **mise à niveau d'une base peuplée** (routines, séances, historique, Mouvements, catalogue) avec identifiants et lignes conservés ;
  - non-régression des migrations 001 à 039 et des réparations.
- **Installations existantes** : É1 au premier lancement après la mise à jour, puis R1 ou R3.
- **Serveur** : migration 0001.

### RISQUES / EFFETS DE BORD

- Jeton Apple indisponible en connexion web Android : vérification préalable, étape 2.
- Clé secrète Apple non régénérée : panne de la connexion Apple sur Android. Rappel à la charge de Hermann.
- Schéma `routine` partagé par Routine et Routine Dev : vérification, puis ajustement ciblé.
- Capacité Sign in with Apple : profils de signature à régénérer par EAS. `aps-environment` doit rester retiré.
- Compte obligatoire et réseau au premier lancement : risque App Store jugé modéré.

### ÉCRANS (validés, CPT-16)

Aucune frame Figma. Composants existants et primitives natives : bouton Apple natif, alertes natives. Les textes ci-dessous sont **validés** (CPT-16 ; delta É3 : CPT-29).

#### É1 — Écran de connexion (porte d'entrée)

**Quand :** premier lancement, et installations existantes au premier lancement après la mise à jour.

**Mise en page :**
- même fond et même logo que l'écran de démarrage `KodjoSplash` ;
- **Titre :** « Bienvenue dans KODJO ».
- **Texte :** « Connectez-vous pour créer vos séances et partager vos mouvements. »
- **Variante pour une installation existante :** « Vos séances et votre historique restent sur ce téléphone et seront rattachés à votre compte. »
- **Deux boutons de même taille, en bas d'écran :**

| | Premier bouton | Second bouton |
|---|---|---|
| iOS | « Continuer avec Apple » : bouton **natif** Apple (`AppleAuthenticationButton`, noir) | « Continuer avec Google » : style imposé par Google (blanc, logo G) |
| Android | Google | Apple, au style imposé par Apple |

Les règles d'Apple exigent que son bouton soit au moins aussi visible que les autres.

- **Lien en bas :** « Politique de confidentialité ».

**États :**
- **Sans réseau :** « Une connexion Internet est nécessaire pour vous connecter la première fois. »
- **Annulation par l'utilisateur :** retour silencieux à l'écran.
- **Erreur :** alerte native « La connexion n'a pas abouti. Réessayez. »
- La page web d'Apple ou de Google (Android, et Google sur iOS) s'ouvre dans la fenêtre système du navigateur. Rien à concevoir.

#### É2 — Section Compte (Profil, onglet Profil, écran « Modifier le profil »)

Elle est ajoutée sous la photo et le nom d'affichage existants. Elle reprend le style des groupes du Profil (`GuidanceSection` : titre de section, lignes séparées).

- **Titre de section :** « Compte ».
- **Ligne fournisseur :** « Connecté avec Apple » ou « Connecté avec Google », avec l'icône du fournisseur.
- **Ligne Nom :** nom du compte (CPT-13).
- **Ligne E-mail :** l'e-mail du compte. Pour une adresse relais Apple, mention dessous : « Adresse masquée par Apple ».
- **Plus bas, isolé :** bouton texte rouge danger « Supprimer mon compte ».
- Aucun bouton « Se déconnecter » (CPT-15).

#### É3 — Confirmation de suppression (alerte native, bouton destructif)

**Titre :** « Supprimer votre compte ? »

**Message :**
> Votre compte, votre catalogue et les contenus que vous avez partagés seront supprimés de nos serveurs. Les personnes qui les ont déjà reçus les conservent.
> Vos séances, mouvements et historique restent sur ce téléphone. Pour les effacer, supprimez l'application.

**Delta validé (CPT-29)** : remplacer « Les personnes qui les ont déjà reçus les conservent. » par « Les personnes qui les ont déjà reçus les conservent, y compris les photos et vidéos déjà téléchargées. » Le reste est inchangé.

**Boutons :** « Annuler » / « Supprimer » (rouge).

**Ensuite :**
- **Pendant :** indicateur d'activité.
- **Sans réseau :** « La suppression du compte nécessite une connexion Internet. »
- **Succès :** retour à É1.

#### É4 — Refus d'un autre compte (alerte native, CPT-14)

**Titre :** « Ce téléphone appartient à un autre compte »

**Message :**
> Ses données sont rattachées au compte {Apple|Google} {e-mail}. Connectez-vous avec ce compte, ou supprimez l'application pour repartir de zéro avec un autre compte. Supprimer l'application efface les données de ce téléphone.

**Bouton :** « OK ».

Ce message vaut pour **R4** (téléphone encore lié au compte X : fournisseur et e-mail disponibles). Il reste inchangé.

#### É4-R5 — Refus après suppression du compte (alerte native, CPT-32, validé)

Le lien local est vide : ni fournisseur ni e-mail ne sont affichés.

**Titre :** « Ce téléphone contient les données d'un compte supprimé »

**Message :**
> Pour les retrouver, reconnectez-vous avec le même identifiant Apple ou Google qu'avant la suppression. Pour utiliser un autre compte, supprimez puis réinstallez l'application : cette opération efface les données de ce téléphone.

**Bouton :** « OK ».

## STATUT

**PLAN_READY_FOR_REVIEW** pour T1 : corrections F2 et F3 de la contre-vérification sur `6a4c7457` faites (interruption après `deleteUser()` ; interruption après l'enregistrement d'une notification Apple ; alignement de la règle de révocation). F1 et CPT-33 clos. Prochaine barrière : contre-vérification ChatGPT, puis `PLAN_APPROVED`.
