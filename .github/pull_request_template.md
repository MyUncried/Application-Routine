## TRANCHE

- ID : `Txx-Sxx`
- Issue liée :
- Baseline :
- Branche :

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
- Contexte : `OK | ÉLEVÉ | À COMPACTER | NON VÉRIFIABLE`
- Quota : `OK | BAS | CRITIQUE | NON VÉRIFIABLE`
- Coût additionnel :
- Prochain reset :
- Action : `CONTINUER | OPTIMISER | ATTENDRE_RESET | ARBITRAGE`

## REVUE CHATGPT

Statut : `À FAIRE | CONFORME | CHANGES_REQUESTED | RETEST_REQUIRED | CLARIFICATION_REQUIRED`

La revue doit confronter : `spécification → plan approuvé → diff réel → tests → résultat`.

## CONTRE-VÉRIFICATION FINALE

- [ ] seconde passe indépendante effectuée ;
- [ ] anciennes hypothèses / formulations recherchées ;
- [ ] effets de bord contrôlés ;
- [ ] contradictions résiduelles recherchées ;
- [ ] validation utilisateur effectuée si nécessaire ;
- [ ] aucun `À CLARIFIER` ouvert.

## CLÔTURE

- [ ] `READY_TO_CLOSE`
- [ ] état Git propre et traçable
- [ ] branche prête à intégrer
