# KODJO — Cahier de recette T1 (Compte)

Sources : plan approuvé `_bmad-output/compte/plan-lot-compte.md` (T1), décisions CPT-01 à CPT-34 (chapitre 07, « Gestion de compte — premier lot »), contrats d'écran CE-CPT-01 à CE-CPT-05 (chapitre 13). Branche : `compte/lot-1`, PR #460.

**Mode d'emploi**
- Statuts : `À FAIRE`, `PASS`, `FAIL` (avec renvoi au défaut), `BLOQUÉ` (prérequis manquant), `N/A`.
- Preuve : capture, ligne du journal Supabase, valeur d'une colonne. **Jamais** de secret (clé `.p8`, clé de service, `KODJO_TOKEN_KEY`, `KODJO_SWEEP_TOKEN`) ni le contenu de `apple_tokens`.
- Les vérifications « tableau de bord » se font dans Supabase › Table Editor, Authentication › Users, Edge Functions › *fonction* › Logs.
- Un test sur build de développement (« Routine Dev » + Metro) ne vaut pas test hors ligne à froid : le code de l'app vient de Metro.
- Les résultats détaillés et les analyses de défauts sont dans le rapport `.github/orchestration/reports/2026-11-25_T1-COMPTE-IMPLEMENTATION.md`, section 5.

**Prérequis**

| ID | Prérequis | Statut |
|---|---|---|
| P-01 | Migrations 1 à 4 appliquées (`supabase db push --remote`) | PASS (25/11) |
| P-02 | Fonctions `apple-token`, `delete-account`, `deletion-status`, `apple-notifications` déployées à jour | PASS (25/11, après `ffbdf046`) |
| P-03 | Secrets des fonctions renseignés (liste : `supabase/README.md`) | PASS (25/11, déclaré) |
| P-04 | Tâche planifiée `apple-notifications` : en-tête `Authorization: Bearer <KODJO_SWEEP_TOKEN>`, réponse 200 dans son historique | À FAIRE |
| P-05 | Adresse des notifications serveur à serveur renseignée chez Apple | À FAIRE |
| P-06 | `.env.local` présent sur le poste pour Metro (`eas env:pull --environment development`) | PASS (25/11) |
| P-07 | Testeur Android ajouté comme utilisateur de test Google (écran de consentement en mode test) | À FAIRE |

## A. Connexion (É1)

| ID | Plateforme | Étapes | Résultat attendu | Statut |
|---|---|---|---|---|
| A-01 | iPhone | Première ouverture, « Continuer avec Apple » | Feuille Apple native ; app ouverte ; une ligne dans `accounts`, `account_local_users`, `catalogues`, `apple_tokens` | PASS (25/11) |
| A-02 | iPhone | Apple, en choisissant « Masquer mon e-mail » | Section Compte : adresse relais + mention de l'adresse masquée ; `email_is_private_relay = true` | À FAIRE |
| A-03 | iPhone | Apple, en refusant de partager le nom | Section Compte sans ligne « Nom », aucune valeur inventée | À FAIRE |
| A-04 | iPhone | « Continuer avec Google » (installation vierge, sans compte supprimé) | Page Google **sans** fenêtre système iOS (CPT-34) ; saisie de l'identifiant ; app ouverte ; `apple_tokens` vide | À FAIRE (nécessite réinstallation : efface les données de Routine Dev) |
| A-05 | iPhone | Fenêtre système « … souhaite utiliser … » avant la page Google | Absente (CPT-34) | PASS (25/11) |
| A-06 | iPhone, Android | Annuler la connexion (Apple ou Google) | Retour à É1 sans message | À FAIRE |
| A-07 | iPhone, Android | Mode avion puis « Continuer avec… » | Message hors ligne de É1, aucune tentative | À FAIRE |
| A-08 | iPhone | Installation qui contient déjà des séances (avant T1) | Texte « installation existante » de É1 ; données conservées après connexion | À FAIRE |
| A-09 | Android | « Continuer avec Google » | Page Google ; retour dans l'app ; app ouverte | À FAIRE |
| A-10 | Android | « Continuer avec Apple » | Page Apple web ; retour dans l'app par lien profond ; une ligne `apple_tokens` (jeton web) | À FAIRE |

## B. Section Compte (É2)

| ID | Plateforme | Étapes | Résultat attendu | Statut |
|---|---|---|---|---|
| B-01 | iPhone | Profil › Modifier le profil | « Connecté avec Apple », nom, e-mail, « Pseudo public » grisé, « Supprimer mon compte », aucune déconnexion (CPT-13, CPT-15) | PASS (25/11) |
| B-02 | iPhone, Android | Même écran, compte Google | « Connecté avec Google », nom et e-mail Google | À FAIRE |
| B-03 | iPhone | Section Compte en mode avion | Contenu affiché à l'identique (lecture locale) | À FAIRE |

## C. Suppression (É3)

| ID | Plateforme | Étapes | Résultat attendu | Statut |
|---|---|---|---|---|
| C-01 | iPhone | Supprimer mon compte › lire le texte | Texte CPT-16 + delta CPT-29 ; boutons Annuler / Supprimer (destructif) | PASS (25/11) |
| C-02 | iPhone | Annuler | Rien ne change | À FAIRE |
| C-03 | iPhone | Supprimer (compte Apple) | Retour direct à É1, sans message (CE-CPT-03) ; tables du compte vides ; `account_deletions` : `apple_revocation = done`, `data_purged_at` et `auth_deleted_at` renseignés ; utilisateur absent de Authentication › Users | PASS (25/11, après corrections `581e5ec1` et `ffbdf046`) |
| C-04 | iPhone | Réglages › [nom] › Connexion et sécurité › Se connecter avec Apple | L'app n'apparaît plus | À FAIRE |
| C-05 | iPhone | Après suppression : séances, routines, historique | Toujours présents sur le téléphone | À FAIRE |
| C-06 | iPhone | Mode avion puis Supprimer | Message « nécessite une connexion Internet » ; compte intact ; reprise automatique au prochain lancement avec réseau | À FAIRE |
| C-07 | iPhone, Android | Supprimer un compte Google | `apple_revocation = not_applicable` ; tables vides | À FAIRE |
| C-08 | Android | Supprimer un compte Apple (jeton web) | `apple_revocation = done` | À FAIRE |
| C-09 | iPhone | Supprimer puis revenir aussitôt dans l'app (bouton + reprise simultanés) | Une seule suppression, aucun message d'erreur | À FAIRE (défaut corrigé par `ffbdf046`, à confirmer) |

## D. Règles de rattachement

| ID | Plateforme | Étapes | Résultat attendu | Statut |
|---|---|---|---|---|
| D-01 | iPhone | Après suppression d'un compte Apple, « Continuer avec Apple » (même identifiant) | Nouveau compte ; données locales conservées (CPT-32) | PASS (25/11) |
| D-02 | iPhone | Après suppression, « Continuer avec Google » | Refus É4-R5, texte validé CPT-32, sans fournisseur ni e-mail | PASS (25/11) |
| D-03 | Deux téléphones | Même compte sur un second téléphone | Accepté ; chaque téléphone garde ses données (R3) | À FAIRE |
| D-04 | Deux téléphones | Compte déjà utilisé ailleurs, sur un téléphone lié à un autre compte | Impossible depuis É1 (l'app est ouverte) ; à tester après suppression : refus CPT-32 | À FAIRE |

## E. Hors ligne et retour du réseau

| ID | Plateforme | Étapes | Résultat attendu | Statut |
|---|---|---|---|---|
| E-01 | iPhone | App ouverte, mode avion, aller à l'accueil puis revenir | App ouverte, pas de É1 | PASS (25/11) |
| E-02 | iPhone | Build de recette ou TestFlight : app fermée, mode avion, ouverture | App ouverte directement | À FAIRE (impossible sur build de développement) |
| E-03 | Deux téléphones | Supprimer le compte sur A ; B, hors ligne pendant la suppression, revient en ligne | B passe à É1 (cas c) ; données de B conservées | À FAIRE |

## F. Notifications Apple (serveur à serveur)

| ID | Plateforme | Étapes | Résultat attendu | Statut |
|---|---|---|---|---|
| F-01 | iPhone | Réglages › Se connecter avec Apple › l'app › Arrêter d'utiliser | Ligne `apple_notification_events` (`consent-revoked`, `done`) ; `apple_tokens_invalidated_at` renseigné ; app : É1 au retour du réseau | À FAIRE (prérequis P-05) |
| F-02 | iPhone | Après F-01, reconnexion Apple puis suppression | Nouveau jeton révoqué : `apple_revocation = done` | À FAIRE |
| F-03 | Serveur | Historique de la tâche planifiée | Réponses 200 | À FAIRE (prérequis P-04) |

## G. Variantes installées ensemble

| ID | Plateforme | Étapes | Résultat attendu | Statut |
|---|---|---|---|---|
| G-01 | iPhone ou Android | Routine et Routine Dev installées ; connexion Google ou Apple web dans Routine Dev | Le retour ouvre Routine Dev, pas Routine | À FAIRE |

## H. Points ouverts liés à la recette

- Écran du catalogue affiché environ une seconde avant É1 lors de la reprise d'une suppression en suspens : conforme au plan, à réexaminer plus tard (Hermann, 25/11).
- Message de confirmation après une suppression réussie : non prévu (CE-CPT-03) ; nouvelle décision si souhaité.
- Texte d'erreur de suppression (« La suppression du compte n'a pas abouti. Réessayez plus tard. ») : à valider.
- Logo « G » du bouton Google ; URL de la politique de confidentialité (`EXPO_PUBLIC_PRIVACY_POLICY_URL`).
- Message « connexion Internet nécessaire » apparu une fois sans appel serveur visible (25/11) : non expliqué ; le journal de l'app (`WARN Fonction …`) le qualifiera s'il se reproduit.
