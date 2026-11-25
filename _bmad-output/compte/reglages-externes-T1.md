# Réglages externes nécessaires à T1 (Compte)

**Avancement au 24/11/2026 :** §1 fait. Projet Supabase `kodjo-dev` (`https://qiruzadtbqcdewvsaizo.supabase.co`, Paris `eu-west-3`, Free), adresses de retour enregistrées, clé publique relevée. §2 fait le 25/11/2026 : capacité Sign in with Apple sur `com.ankusha.kodjo` (identifiant principal) et sur les variantes groupées ; Services ID `com.ankusha.kodjo.signin` ; clé « KODJO Sign in with Apple » ; fournisseur Apple activé dans Supabase, Services ID en premier ; « Allow users without an email » désactivé. Rappel de régénération de la clé secrète : à la charge de Hermann. §5 fait le 25/11/2026 : variables `EXPO_PUBLIC_SUPABASE_URL` et `EXPO_PUBLIC_SUPABASE_ANON_KEY` (clé `sb_publishable_…`) dans EAS, pour les trois environnements. §4 : texte provisoire dans `docs/legal/KODJO-Politique-confidentialite-PROVISOIRE-2026-11-25.md`, à héberger sur le site Ankusha (OVH). §0 décidé le 25/11/2026 : identifiants Android identiques aux identifiants iOS (`com.ankusha.kodjo` et variantes), « Oui, pourquoi en changer ? ». §3 fait le 25/11/2026 : projet Google Cloud `kodjo`, client OAuth « Application Web » avec l'adresse de retour Supabase ; fournisseur Google activé dans Supabase ; « Skip nonce checks » et « Allow users without an email » désactivés.

Guide suivi par Hermann (§0 à §3 et §5 déclarés faits). **Ces réglages sont déclarés, pas encore vérifiés par un essai** : les vérifications restantes figurent dans le plan, T1, « Configuration et recette ». Routine et Routine Dev partagent le schéma `routine` ; un schéma `routine-dev` pourra être ajouté après vérification (plan T1). **Aucun secret ne doit être collé dans une conversation ni committé dans le dépôt.** Les secrets vont dans les tableaux de bord concernés (Supabase, EAS).

**Sources :**
- documentation Supabase lue dans le dépôt officiel `supabase/supabase` (17/11/2026) : guides `auth/social-sign-in/auth-apple.mdx` et `auth-google.mdx`, `platform/regions.mdx`, `platform/free-project-pausing.mdx` ;
- configuration KODJO actuelle (`app.json`, `app.config.js`).

Les libellés exacts des consoles Apple, Google et Supabase peuvent différer légèrement : ils sont cités de mémoire.

## 0. Décision préalable : identifiant Android

`app.json` n'a pas d'identifiant Android (`android.package`). Il est obligatoire pour publier sur Google Play et pour certains réglages Google.

**Proposition :** reprendre les identifiants iOS existants.

| Variante | iOS (existant) | Android (proposé) | Schéma de lien (existant) |
|---|---|---|---|
| Routine | `com.ankusha.kodjo` | `com.ankusha.kodjo` | `routine` |
| Routine Dev | `com.ankusha.kodjo.dev` | `com.ankusha.kodjo.dev` | `routine` |
| Routine BMAD | `com.ankusha.kodjo.bmad` | `com.ankusha.kodjo.bmad` | `routine-bmad` |
| Routine Catalogue | `com.ankusha.kodjo.catalogue` | `com.ankusha.kodjo.catalogue` | `routine-catalogue` |

**Attention :** un identifiant Android ne peut plus être changé une fois l'app publiée sur Google Play.

## 1. Supabase

1. Créer un compte sur supabase.com, puis une organisation.
2. **Créer un projet de développement**, par exemple `kodjo-dev` :
   - choisir la **région précise « West EU (Paris) » (`eu-west-3`)**, pas la région générale « Europe », qui peut placer le projet à Londres ou Zurich ;
   - formule **Free**, suffisante pour le développement ;
   - mot de passe de la base : le conserver dans un gestionnaire de mots de passe.
3. Plus tard, avant la mise en production : un second projet `kodjo-prod`, en région Paris et formule **Pro** (25 $/mois). Un projet Free est mis en pause après 7 jours de faible activité.
4. Relever deux valeurs **publiques** dans les réglages du projet (Settings → API) :
   - l'**URL du projet** (`https://<ref>.supabase.co`) ;
   - la **clé publique** (*anon* ou *publishable*).

   Elles iront dans EAS (§5).
5. **Ne jamais mettre la clé de service** (*service_role* ou *secret*) dans l'app ni dans le dépôt. Elle ne sert qu'aux fonctions serveur.
6. **Accord de sous-traitance RGPD (DPA)** : page https://supabase.com/legal/dpa. Constat de Hermann le 24/11/2026 : rien à signer, aucune signature demandée. Le conserver comme référence.
7. Dans Authentication → URL Configuration, ajouter les adresses de retour vers l'app :
   - `routine://auth/callback`
   - `routine-bmad://auth/callback`
   - `routine-catalogue://auth/callback`

   Les chemins exacts seront confirmés au développement.

## 2. Apple Developer (connexion Apple)

Prérequis : un compte **Apple Developer Program** actif.

1. **Identifiants d'app** (Certificates, Identifiers & Profiles → Identifiers) : pour chaque identifiant iOS du tableau §0, activer la capacité **Sign in with Apple**.
2. **Services ID**, nécessaire pour la connexion Apple sur **Android** (page web) :
   - créer un identifiant de type *Services IDs*, par exemple `com.ankusha.kodjo.signin` ;
   - activer Sign in with Apple, le rattacher à l'App ID principal `com.ankusha.kodjo` ;
   - domaine : `<ref>.supabase.co` ;
   - adresse de retour : `https://<ref>.supabase.co/auth/v1/callback`.
3. **Clé de signature** (Keys) : créer une clé avec Sign in with Apple activé. Télécharger le fichier `.p8`, **une seule fois possible**, et le conserver en lieu sûr. Noter le **Key ID** et le **Team ID**.
4. **Clé secrète** : la générer à partir du `.p8`, du Key ID, du Team ID et du Services ID, avec l'outil de la page Supabase « Login with Apple ». Code source vérifié (`apps/docs/components/AppleSecretGenerator`) : la signature se fait dans le navigateur, sans envoi réseau, et la clé est **valable 180 jours**.
   - **Elle expire au bout de 6 mois** : sans régénération, la connexion Apple cesse de fonctionner sur Android.
   - Créer **dès maintenant un rappel récurrent tous les 5 mois**, et désigner qui le fait.
5. Dans Supabase → Authentication → Providers → **Apple** :
   - activer le fournisseur ;
   - **Client IDs** : **d'abord le Services ID** (`com.ankusha.kodjo.signin`), car Supabase utilise la première entrée pour la connexion par page web ; ensuite les identifiants iOS du §0 (toutes variantes), séparés par des virgules ;
   - **Secret key** : la clé secrète du point 4.
6. Pour un essai avec **Expo Go**, ajouter aussi `host.exp.Exponent` aux Client IDs. Recommandation Supabase ; facultatif si l'on teste uniquement en *development build*.

## 3. Google Cloud (connexion Google, par page web : CPT-12)

1. Créer un projet Google Cloud, par exemple `kodjo`.
2. **Écran de consentement OAuth** (Google Auth Platform → Branding) :
   - nom de l'app ;
   - e-mail d'assistance ;
   - logo (facultatif) ;
   - **URL de la politique de confidentialité**, obligatoire pour la publication ;
   - domaines autorisés ;
   - autorisations : `openid`, `email`, `profile` seulement.
3. **Client OAuth de type « Application Web »** (Clients → Create client) :
   - adresse de redirection autorisée : `https://<ref>.supabase.co/auth/v1/callback` ;
   - relever le **Client ID** et le **Client secret**.
4. Dans Supabase → Authentication → Providers → **Google** : activer, saisir le Client ID et le Client secret.
5. Tant que l'écran de consentement est en mode « Test », seuls les comptes Google ajoutés comme testeurs peuvent se connecter. Ajouter les comptes de recette.

## 4. Politique de confidentialité

Elle doit être publiée à une adresse web publique. Google la demande dès l'écran de consentement ; l'App Store et Google Play l'exigent à la publication.

Pour le développement de T1, une page provisoire suffit. La version définitive est à faire valider juridiquement (avis prévu sur les douleurs et les réglages par défaut, CPT-21 et CPT-27).

## 5. EAS (variables de l'app)

Dans expo.dev → projet → **Environment variables**, pour chaque environnement utilisé (development, preview, production) :
- `EXPO_PUBLIC_SUPABASE_URL` = URL du projet ;
- `EXPO_PUBLIC_SUPABASE_ANON_KEY` = clé publique.

Ces deux valeurs sont publiques par nature : elles sont incluses dans l'app. La sécurité repose sur les règles d'accès (RLS) côté serveur.

## 6. Plus tard (T2 et suivantes, pas pour T1)

- Notifications push (CPT-23) :
  - clé APNs chez Apple ;
  - projet Firebase Cloud Messaging chez Google ;
  - configuration dans EAS.
- Projet Supabase de production en formule Pro.

## Ce que Hermann renvoie à Claude (sans aucun secret)

- l'identifiant Android retenu (§0) ;
- l'URL du projet Supabase de développement (publique) ;
- la confirmation que les fournisseurs Apple et Google sont activés dans Supabase ;
- l'adresse de la politique de confidentialité provisoire.
