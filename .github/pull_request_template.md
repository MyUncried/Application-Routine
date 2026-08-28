## TRANCHE

- ID : `Txx-Sxx` (ou bloc `Txx` si la PR couvre plusieurs tranches — voir `.github/AI_ORCHESTRATION.md` § Git et clôture)
- Issue liée :
- Baseline :
- Branche (de bloc ou dédiée, selon la stratégie en vigueur) :
- Mode d’exécution : `LOCAL` | `CLOUD`
- Écrivain désigné (réf. commentaire `[ChatGPT]`) :

## PLAN

Statut : `PLAN_DRAFT | PLAN_CHANGES_REQUESTED | PLAN_APPROVED`

Lien / commentaire contenant le plan :

## IMPLÉMENTATION

Statut : `IMPLEMENTING | IMPLEMENTATION_READY_FOR_REVIEW | CHANGES_REQUESTED | RETEST_REQUIRED | FINAL_VERIFICATION | READY_TO_CLOSE`

### Résumé

...

### Critères d’acceptation

- [ ] `AC-01`
- [ ] `AC-02`

### Tests et preuves

- `commande` → `PASS | FAIL`

### Écarts au plan approuvé

Aucun | ...

### Ressources IA — Claude

- Modèle :
- Décision de modèle : `défaut | renforcé` — justification :
- Contexte : `OK | ÉLEVÉ | À COMPACTER | NON VÉRIFIABLE`
- Quota : `OK | BAS | CRITIQUE | NON VÉRIFIABLE`
- Coût additionnel :
- Prochain reset :
- Action : `CONTINUER | OPTIMISER | ATTENDRE_RESET | ARBITRAGE`

## REVUE CHATGPT

Statut : `À FAIRE | CONFORME | CHANGES_REQUESTED | RETEST_REQUIRED | CLARIFICATION_REQUIRED`

Publiée comme commentaire sur cette PR (ou sur l’Issue liée), préfixé `[ChatGPT]`.

La revue doit confronter : `spécification → plan approuvé → diff réel → tests → résultat`.

## CONTRE-VÉRIFICATION FINALE

Relecture indépendante **du travail** par Claude Code (même lignée que l’implémentation — pas une indépendance d’agent ; la revue ChatGPT ci-dessus reste le seul contrôle par un système distinct).

- [ ] seconde passe indépendante effectuée ;
- [ ] anciennes hypothèses / formulations recherchées ;
- [ ] effets de bord contrôlés ;
- [ ] contradictions résiduelles recherchées ;
- [ ] validation utilisateur effectuée si nécessaire ;
- [ ] aucun `À CLARIFIER` ouvert.

## CLÔTURE

- [ ] `READY_TO_CLOSE`
- [ ] état Git propre, synchronisé avec `origin`, et traçable
- [ ] branche prête à intégrer
