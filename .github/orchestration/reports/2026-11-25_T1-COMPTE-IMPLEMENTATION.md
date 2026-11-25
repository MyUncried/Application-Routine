# T1 — Compte : implémentation (rapport de mission, en cours)

## Identification

- **Mission :** T1-COMPTE-IMPLEMENTATION. Fusion documentaire de la PR #446, puis implémentation de T1 seule (`_bmad-output/compte/plan-lot-compte.md`).
- **Autorisation :** verdict `PLAN_APPROVED` de ChatGPT, [PR #446, commentaire 7160668623](https://github.com/MyUncried/Application-Routine/pull/446#issuecomment-7160668623), plan approuvé au commit `05d923a0adc95126707f91f4b73a0bc6dcd22273`.
- **Mode :** CLOUD.
- **Écrivain :** session Claude Code cloud.

## 1. Fusion et baseline

| Élément | Valeur |
|---|---|
| PR #446 avant fusion | ouverte, HEAD `05d923a0` (identique au HEAD approuvé), base `main@aaaa4b63`, `mergeable_state = clean` |
| Delta depuis l'approbation | aucun |
| Fusion | commit de fusion `a48622d3e5ad85f901c8bbe48f83ada9f113fb20` (méthode *merge*, HEAD attendu contrôlé) |
| Baseline effective | `main@a48622d3` |

## 2. Branche et préflight

| Contrôle | Résultat |
|---|---|
| Branche | `compte/lot-1`, absente auparavant chez `origin`, créée depuis `origin/main@a48622d3` |
| HEAD au départ | `a48622d3` |
| Répertoire de travail | propre (`git status` sans modification) |
| Dernière migration locale | `migration039.ts`, `DATABASE_VERSION = 39` (`src/infrastructure/database/constants.ts:200`) |
| **Prochain numéro libre** | **040**, conforme au plan |

## 3. Première étape obligatoire : jeton Apple en connexion web Android

**Résultat : NON VÉRIFIABLE sur le parcours réel depuis le cloud.** La disponibilité est en revanche **établie par le code source** de Supabase Auth.

**Ce qui empêche l'essai réel :**
- il faut une connexion interactive avec un identifiant Apple réel, dans un navigateur ;
- cette session cloud n'a ni identifiant Apple, ni appareil, ni navigateur pour se connecter à Apple.

**Preuve documentaire** : dépôt officiel `supabase/auth`, commit `83865c14a595aa616af30549ddf4477de0a0d732` du 24/11/2026, lu dans le bac à sable.
1. `internal/api/provider/apple.go`, `GetOAuthToken` : échange standard du code d'autorisation sur le point d'accès des jetons Apple, avec l'identifiant client (Services ID) et le secret client.
2. `internal/api/external_oauth.go` (environ l. 140-146) : la réponse de cet échange est conservée, avec `refreshToken: token.RefreshToken`. Apple ne fait aucun traitement particulier qui l'écarterait.
3. `internal/api/external.go`, l. 200 et 286-293 :
   - en flux implicite, `provider_refresh_token` est ajouté à l'adresse de retour s'il n'est pas vide ;
   - l. 243 : en flux PKCE, il est conservé dans `flowState.ProviderRefreshToken` ;
   - `internal/api/token.go` l. 347-348 : il est rendu à l'échange du code PKCE (`token.ProviderRefreshToken`).

**Limites :**
- la présence effective d'un `refresh_token` dans la réponse d'Apple pour ce Services ID, et son acceptation par `/auth/revoke`, restent à démontrer par un essai réel ;
- la version de Supabase Auth déployée sur le projet n'est pas vérifiée.

**Manipulation minimale demandée à Hermann** (aucun jeton à transmettre) :
1. Supabase → Authentication → URL Configuration → Redirect URLs : ajouter **temporairement** `http://localhost:3999/`.
2. Sur le **téléphone Android**, dans Chrome, ouvrir :
   `https://qiruzadtbqcdewvsaizo.supabase.co/auth/v1/authorize?provider=apple&redirect_to=http://localhost:3999/`
3. Se connecter avec Apple. La page finale ne se charge pas, c'est normal. **Sans copier ni photographier l'adresse**, vérifier seulement si la barre d'adresse contient le texte `provider_refresh_token=` suivi d'une valeur non vide.
4. Répondre « présent » ou « absent ».
5. Ensuite :
   - retirer `http://localhost:3999/` des Redirect URLs ;
   - supprimer l'utilisateur de test dans Authentication → Users ;
   - fermer l'onglet.

**Décision selon le résultat :**
- **présent** : disponibilité démontrée, l'implémentation de T1 se poursuit ;
- **absent** : `CHANGE_REQUEST_REQUIRED`. L'alternative est celle prévue au plan : flux OAuth Apple Android porté par une fonction serveur KODJO qui conserve le jeton.

**Résultat de l'essai réel (Hermann, 25/11/2026) : `provider_refresh_token` PRÉSENT.**
- Parcours : navigateur Chrome d'ordinateur → `…/auth/v1/authorize?provider=apple` → page de consentement Apple « KODJO Sign in with Apple » (Services ID) → retour `http://localhost:3999/` avec `provider_refresh_token=` non vide dans l'adresse.
- Aucun jeton n'a été transmis.
- **Disponibilité démontrée** pour le flux web Apple de Supabase, utilisé par Android. L'implémentation se poursuit.
- **Restent à vérifier en recette** :
  - le retour vers l'app Android par lien profond ;
  - l'acceptation de ce jeton par `/auth/revoke` lors d'une suppression réelle.

Nettoyage demandé à Hermann : retirer `http://localhost:3999/` des Redirect URLs, supprimer l'utilisateur de test dans Supabase, et révoquer « KODJO Sign in with Apple » dans les réglages de l'identifiant Apple (facultatif).

## 4. Implémentation (plan T1 approuvé)

| Commit | Contenu |
|---|---|
| `bad9f2ac` | Schéma serveur : tables, RLS, `link_account` idempotent, purge 90 jours ; tests SQL |
| `5672f63b` | Fonctions serveur `delete-account`, `deletion-status`, `apple-token`, `apple-notifications` : logique pure dans `supabase/functions/_shared/`, points d'entrée Deno ; fonctions SQL `store_apple_token`, `apple_event_begin`, `apple_event_done`, `deletion_begin`, `deletion_purge_data`, `revoke_user_sessions` |
| `8fdfc0d1` | Migration locale **040** (`account_link`, `account_lifecycle`), `SqliteAccountRepository`, `AccountService` (porte, R1 à R6, CPT-32, suppression reprenable, retour réseau) |
| `ef140209` | Client et passerelle Supabase, É1 (`SignInScreen`), porte `AccountGate`, É4 et É4-R5, É2 (`AccountSection`) avec É3, configuration (`usesAppleSignIn`, plugin `expo-apple-authentication`, `android.package` par variante), textes fr/en |
| commit de documentation | Chapitres 06, 12 et 13 (CE-CPT-01 à CE-CPT-05), rapport |

**Conformité au plan :**
- **Règles appliquées** : la migration 040 est additive et `users.id` n'est jamais réécrit. Sont appliqués R1 à R6, CPT-32 (empreinte de l'identifiant du compte supprimé), la suppression dans l'ordre, la reprise (cas a, b1, b2), `deletion-status` sur preuve et le cas c, avec `indeterminate` qui conserve l'écran et le lien.
- **Notifications Apple** : (iss, jti), transaction, `received`/`done`, reprise d'un `account-delete` après purge, `not_required` après `consent-revoked` sans nouveau jeton, nouveau jeton révoqué.
- **Configuration conservée** : le retrait de `aps-environment` est conservé, donc les notifications locales du planning sont inchangées.

**Écarts et points ouverts (aucun arbitrage produit nouveau) :**
1. **Logo « G » de Google** absent du dépôt : le bouton Google est blanc, texte seul. Le logo officiel est à ajouter depuis le kit de Google.
2. **Icône du fournisseur** dans É2 : aucun pictogramme Apple ou Google dans le dépôt, la ligne est en texte seul.
3. **Lien « Politique de confidentialité »** : il est masqué tant que `EXPO_PUBLIC_PRIVACY_POLICY_URL` n'est pas renseignée dans EAS (URL à publier).
4. **Texte d'échec de suppression autre que l'absence de réseau** : « La suppression du compte n'a pas abouti. Réessayez plus tard. » Ce texte est **à valider** ; aucun texte validé n'existait pour ce cas.
5. **Jeton Apple non enregistré** à la connexion : la connexion aboutit ; la suppression d'un compte Apple reste bloquée (`apple_token_missing`) jusqu'à une nouvelle connexion Apple. C'est un choix technique, conforme à la règle « aucune suppression sans révocation ».
6. **Contradiction relevée hors T1** : D-552 (onglet Confidentialité, « Partage communautaire ») mentionne « nom privé », alors que CPT-26 affiche le prénom et le nom sous le pseudo. À arbitrer avant T2.
7. **Clés de texte devenues inutilisées** : `screens.profileEdit.accountRows` (ancienne carte grisée). Conservées, sans effet.

## 5. Recette restant à faire sur appareils réels

Aucune n'a été réalisée :
- **Déploiement du serveur par Hermann** (`supabase/README.md`) : `db push`, déploiement des fonctions, secrets, planification de la reprise et adresse des notifications Apple.
- **iPhone** :
  - connexion Apple native ;
  - connexion Google par page web ;
  - nom enregistré à la première connexion ;
  - relais « Masquer mon e-mail » ;
  - app ouverte hors ligne ;
  - suppression avec révocation, vérifiée dans les réglages Apple.
- **Android** :
  - connexion Google par page web ;
  - connexion Apple par page web et retour vers l'app par lien profond ;
  - suppression avec révocation du jeton web.
- **Routine et Routine Dev installées ensemble** : vérifier que le retour ouvre la bonne app, faute de quoi le schéma `routine-dev` est à ajuster.
- **Cas de reprise réels** : coupure réseau pendant la suppression ; suppression depuis le téléphone A puis retour en ligne du téléphone B.
- **Notification Apple réelle** : retrait de l'autorisation dans les réglages de l'identifiant Apple.

## Tests

Aucun test exécuté à ce stade : aucun code n'a été modifié.

## Fichiers modifiés

- `.github/orchestration/reports/2026-11-25_T1-COMPTE-IMPLEMENTATION.md` (création)

## Commit et état Git

Communiqués à chaque étape sur la PR d'implémentation et dans la conversation.
