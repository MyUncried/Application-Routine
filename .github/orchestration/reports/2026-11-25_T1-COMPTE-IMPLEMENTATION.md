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

**Statut de la mission :** en attente du résultat de cette manipulation, conformément au mandat (« Reprends dès que le résultat est disponible »). Aucun fichier applicatif modifié à ce stade.

## Tests

Aucun test exécuté à ce stade : aucun code n'a été modifié.

## Fichiers modifiés

- `.github/orchestration/reports/2026-11-25_T1-COMPTE-IMPLEMENTATION.md` (création)

## Commit et état Git

Communiqués à chaque étape sur la PR d'implémentation et dans la conversation.
