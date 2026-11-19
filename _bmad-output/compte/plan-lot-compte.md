# Plan — Lot Compte (MVP)

**Statut : PLAN_READY_FOR_REVIEW.** Aucun code avant `PLAN_APPROVED`.

**Sources :**
- décisions CPT-01 à CPT-12, chapitre 07, section « Gestion de compte — premier lot » ;
- chapitre 12, §12.7 (Utilisateur / Compte / Fournisseur d'identité), §12.20 et §12.21 ;
- MOUV-ACC-20261117 et l'exception CPT-09 ;
- rapport de cadrage `.github/orchestration/reports/2026-11-17_CADRAGE-GESTION-COMPTE.md`, notamment §8, §9 et §11.

**Base Git :** branche `claude/blissful-meitner-iauzaf`, `6a2d91c`. Elle contient `main` (`5ed7b5a`).

---

## TÂCHE

Lot Compte du MVP. Création du compte et connexion obligatoires par Apple ou Google. Rattachement de l'Utilisateur local. Catalogue de compte côté serveur. Suppression du compte. Backend Supabase.

## COMPRÉHENSION

- **Identité locale actuelle.** L'Utilisateur local est créé par `migrateDatabase` (`src/infrastructure/database/migrateDatabase.ts:100`). Son identifiant `usr_<32 hex>` est stocké dans `users`, une table singleton. Les agrégats y sont rattachés par `owner_id`.
- **Ce que le lot ajoute.** Le **Compte** (identité Supabase), distinct de l'Utilisateur interne (§12.7). Les fournisseurs sont Apple et Google (CPT-03).
- **Données envoyées au serveur.** Dans ce lot, seuls l'identité et le lien Compte ↔ Utilisateur sont envoyés (périmètre du lot ; les données d'Exécution arrivent avec le lot sauvegarde, CPT-06). Le contenu partagé arrivera avec le chantier partage.
- **Fonctionnement hors ligne.** Le compte est obligatoire (CPT-02), mais l'app reste utilisable hors ligne après la première connexion.
- **Suppression.** Suppression complète côté serveur, données locales conservées, retour à l'écran de connexion (CPT-08 à CPT-10).
- **Modes de connexion :**

| Fournisseur | iOS | Android |
|---|---|---|
| Apple | Natif (`expo-apple-authentication` puis `signInWithIdToken`) | Page web (`signInWithOAuth`), CPT-03 |
| Google | Page web (`signInWithOAuth`), CPT-12 | Page web (`signInWithOAuth`), CPT-12 |

## PÉRIMÈTRE / FICHIERS IMPACTÉS

### A. Backend (nouveau dossier `supabase/`, versionné, sans secret)

- `supabase/migrations/0001_accounts.sql`, avec RLS :
  - table `accounts` (`auth_user_id` PK → `auth.users`, `local_user_id`, `created_at`) ;
  - table `catalogues` (`id`, `owner_auth_user_id` unique, `created_at`) : un catalogue par compte, créé automatiquement.
  - Aucune autre table. Pas de table d'Exécution : hors périmètre du lot.
- `supabase/functions/delete-account/` (Edge Function, clé de service côté serveur uniquement). Dans l'ordre :
  1. supprimer les objets Storage de l'utilisateur ;
  2. supprimer le catalogue, puis `accounts` ;
  3. révoquer le jeton Apple si le compte est Apple ;
  4. appeler `auth.admin.deleteUser()`.
- `supabase/config.toml` : fournisseurs Apple et Google, URLs de redirection par variante d'app.

### B. Application

- **Dépendances :** `@supabase/supabase-js` et `expo-apple-authentication@57.0.2`. `expo-web-browser`, `expo-linking` et `expo-sqlite` sont déjà présents.
- **Configuration :**
  - `app.json` et `app.config.js` : capacité Sign in with Apple (iOS), plugin `expo-apple-authentication`, identifiant Android `package` (**absent aujourd'hui**, nécessaire au client OAuth), schémas de retour par variante ;
  - variables publiques `EXPO_PUBLIC_SUPABASE_URL` / `ANON_KEY` via EAS, hors dépôt.
- **Infrastructure :**
  - `src/infrastructure/account/supabaseClient.ts` : session persistée par `expo-sqlite/localStorage` (guide Expo) ;
  - `src/infrastructure/account/SupabaseAccountGateway.ts` : connexion, déconnexion, appel `delete-account`, lecture et écriture de `accounts`.
- **Migration locale 031 :** table singleton `account_link` (`auth_user_id`, `provider`, `catalogue_id`, `linked_at`). Test de migration associé.
- **Domaine :** `src/domain/account/` avec `AccountService` :
  - `signInWithApple`, `signInWithGoogle` ;
  - `linkLocalUser` (règles de rattachement ci-dessous) ;
  - `deleteAccount`, `currentAccountState`.
  - Le service ne dépend ni de Supabase ni de SQLite directement (ports).
- **Rattachement, proposition :**
  - **Compte neuf :** le serveur enregistre `local_user_id` = Utilisateur local actuel.
  - **Compte existant, téléphone vierge** (réinstallation, nouveau téléphone, aucun agrégat local) : l'Utilisateur local adopte `local_user_id` du compte avant toute donnée.
  - **Compte existant, téléphone avec données d'un autre Utilisateur :** voir ambiguïté 2.
- **Porte d'entrée :**
  - `app/_layout.tsx` affiche l'écran de connexion tant que `account_link` est vide ;
  - un lien local présent suffit pour ouvrir l'app **hors ligne**, même si le jeton n'est pas rafraîchissable faute de réseau.
- **Écrans** (selon les maquettes, ambiguïté 1) :
  - `app/sign-in.tsx` ;
  - section Compte du Profil (`app/(tabs)/profile.tsx`) ;
  - confirmation de suppression (texte CPT-10 : ce qui est supprimé, ce qui reste, mention des contenus partagés figés CPT-09).
- **Lexique :** nouvelles clés de texte dans le lexique centralisé.

### C. Documentation

- Chapitres 06 et 13 : écrans et contrats d'écran Connexion et Compte (classe B, après maquettes).
- Chapitre 12 : architecture compte (classe D).
- Procédure d'exploitation : régénération de la clé secrète Apple tous les 6 mois (§11 du cadrage).

**Hors périmètre :** sauvegarde, synchronisation, partage, publication, modération, e-mail et mot de passe.

## PLAN D'IMPLÉMENTATION

1. **Prérequis à la charge de Hermann**, sans code :
   - créer le projet Supabase (région **Paris `eu-west-3`**, formule Pro 25 $/mois en production, Free pour le développement) ;
   - Apple Developer : capacité Sign in with Apple, Services ID, clé `.p8` ;
   - Google Cloud : client OAuth Web ;
   - choisir l'identifiant Android ;
   - saisir les secrets dans Supabase et EAS.

   Je fournis la liste pas à pas.
2. Backend : migration SQL, RLS, Edge Function `delete-account`, tests SQL et RLS (Supabase local ou base de test).
3. App : client Supabase, port et passerelle, migration 031, `AccountService` et ses règles de rattachement, tests unitaires.
4. Porte d'entrée et écran de connexion. Parcours iOS (Apple natif, Google web) et Android (Apple web, Google web), retour par lien profond.
5. Section Compte du Profil et suppression du compte.
6. Journaux et rapports de plantage : aucune information sensible (règle existante du §12.20).
7. Documentation et synchronisation code / documentation. Rapport de livraison.

## MIGRATION / DONNÉES

- Migration locale **031**, additive : `account_link`. Aucune donnée métier modifiée.
- **Installations existantes** (appareils de recette) : au premier lancement après mise à jour, l'écran de connexion s'affiche, puis l'Utilisateur local existant est rattaché au compte.
- **Côté serveur :** migration 0001, deux tables.

## TESTS PRÉVUS

- **Jest :**
  - migration 031 ;
  - règles de rattachement (compte neuf, téléphone vierge, conflit) ;
  - porte d'entrée en ligne et hors ligne ;
  - suppression : ordre des appels, retour à la connexion, données locales intactes.
- **Backend :** RLS (un compte ne lit ni n'écrit les lignes d'un autre) et Edge Function.
- **Recette sur appareils réels, iPhone et Android :**
  - Apple natif iOS, Apple web Android, Google web sur les deux ;
  - lancement hors ligne après connexion ;
  - réinstallation et rattachement ;
  - suppression du compte.

  Pas de test visuel automatisé.

## RISQUES / EFFETS DE BORD

- Clé secrète Apple non régénérée : panne de la connexion Apple sur Android. Procédure et rappel nécessaires.
- La révocation du jeton Apple suppose de conserver un jeton Apple (code d'autorisation natif ou jeton du fournisseur côté OAuth). Mécanisme exact **à vérifier en début d'étape 2**.
- Liens profonds de retour à vérifier pour chaque variante (`routine`, `routine-bmad`, `routine-catalogue`, Dev).
- Durée de validité de session Supabase et comportement hors ligne prolongé : à mesurer.
- Le compte obligatoire impose le réseau au premier lancement. Risque de refus App Store jugé modéré.

## AMBIGUÏTÉS

Arbitrages de Hermann du 19/11/2026 :
- **Maquettes :** Claude propose des écrans à partir des composants existants, validés ensuite par Hermann. Proposition produite et validée (CPT-16).
- **Changement de compte :** refus si autre compte ; même compte sur deux téléphones accepté (CPT-14).
- **Déconnexion :** pas de bouton au premier lot (CPT-15).
- **Section Compte :** fournisseur, nom et e-mail (CPT-13). Le nom Apple est enregistré à la première connexion.
- **Branches :** PR de la documentation de cadrage vers `main`, puis développement sur `compte/lot-1` depuis `main` à jour.

Conséquences sur le plan :
- `AccountService.linkLocalUser` implémente CPT-14 ;
- aucun écran de déconnexion ;
- stockage du nom et de l'e-mail du compte dans `account_link`.

## PROPOSITION D'ÉCRANS (19/11/2026, validée par Hermann, CPT-16)

**Principes :**
- composants existants et primitives natives (priorité aux primitives natives de l'OS) ;
- aucune frame Figma n'existe pour ces écrans ; tous les textes sont **à valider** ;
- les jetons de couleur existants sont réutilisés : danger `#D92D20`, fond `#F7F7FF`.

### É1 — Écran de connexion (porte d'entrée)

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

### É2 — Section Compte (Profil, onglet Profil, écran « Modifier le profil »)

Elle est ajoutée sous la photo et le nom d'affichage existants. Elle reprend le style des groupes du Profil (`GuidanceSection` : titre de section, lignes séparées).

- **Titre de section :** « Compte ».
- **Ligne fournisseur :** « Connecté avec Apple » ou « Connecté avec Google », avec l'icône du fournisseur.
- **Ligne Nom :** nom du compte (CPT-13).
- **Ligne E-mail :** l'e-mail du compte. Pour une adresse relais Apple, mention dessous : « Adresse masquée par Apple ».
- **Plus bas, isolé :** bouton texte rouge danger « Supprimer mon compte ».
- Aucun bouton « Se déconnecter » (CPT-15).

### É3 — Confirmation de suppression (alerte native, bouton destructif)

**Titre :** « Supprimer votre compte ? »

**Message :**
> Votre compte, votre catalogue et les contenus que vous avez partagés seront supprimés de nos serveurs. Les personnes qui les ont déjà reçus les conservent.
> Vos séances, mouvements et historique restent sur ce téléphone. Pour les effacer, supprimez l'application.

**Boutons :** « Annuler » / « Supprimer » (rouge).

**Ensuite :**
- **Pendant :** indicateur d'activité.
- **Sans réseau :** « La suppression du compte nécessite une connexion Internet. »
- **Succès :** retour à É1.

### É4 — Refus d'un autre compte (alerte native, CPT-14)

**Titre :** « Ce téléphone appartient à un autre compte »

**Message :**
> Ses données sont rattachées au compte {Apple|Google} {e-mail}. Connectez-vous avec ce compte, ou supprimez l'application pour repartir de zéro avec un autre compte. Supprimer l'application efface les données de ce téléphone.

**Bouton :** « OK ».

### Prérequis ajoutés par cette proposition

- **Politique de confidentialité** publiée (URL), exigée par l'App Store, Google Play et le RGPD. **Rédaction à prévoir, à la charge de Hermann ou d'un juriste.**
- **Déclarations de données des stores :** « App Privacy » chez Apple, « Data safety » chez Google. Pour ce lot : identité et contenu partagé ; à mettre à jour au lot sauvegarde.

## STATUT

PLAN_READY_FOR_REVIEW
