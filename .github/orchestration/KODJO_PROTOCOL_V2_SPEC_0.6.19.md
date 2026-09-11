# KODJO Protocol V2 — spécification normative 0.6.19

Cette version complète et supersède `KODJO_PROTOCOL_V2_SPEC_0.6.18.md` pour la gouvernance de la durée logique d’une invocation Claude. Les autres invariants 0.6.18 restent applicables.

## Absence de plafond protocolaire de tours

KODJO n’impose aucun nombre maximal de tours à Claude et n’émet jamais l’argument `--max-turns`. La fin normale ou contrainte de l’invocation relève de Claude, de la fenêtre de contexte et des droits d’usage effectifs de l’abonnement.

Le champ `max_turns` est interdit dans toute nouvelle demande de file ou requête locale. Il ne peut être ignoré silencieusement, normalisé vers une valeur par défaut ou réintroduit par une projection.

Les diagnostics d’invocation et de résultat publient :

```json
{
  "turn_limit_effective": {
    "source": "CLAUDE_SUBSCRIPTION",
    "protocol_max_turns": null,
    "cli_argument_emitted": false
  }
}
```

## Garde-fous conservés

La suppression du plafond de tours ne modifie pas :

- `max_ai_calls: 1` par demande immuable ;
- l’anti-rejeu et l’exclusion mutuelle ;
- le verrou propriétaire et la gestion des interruptions ;
- le périmètre de fichiers et les permissions positives ;
- les budgets de prompt et l’absence de rollover implicite ;
- le timeout de sécurité contre un processus suspendu ;
- la conservation du delta avant contrôles et le refus de publication si les contrôles échouent.

Le timeout est un garde-fou d’infrastructure et ne doit pas être utilisé comme un budget fonctionnel de tours.

## Qualification

T-059 vérifie sans appeler Claude :

1. qu’une demande sans `max_turns` est admise et normalisée ;
2. qu’une demande portant `max_turns`, quelle que soit sa valeur, est refusée explicitement ;
3. que les arguments effectifs ne contiennent pas `--max-turns` ;
4. que `max_ai_calls: 1` et les autres bornes de sécurité sont inchangés ;
5. que la preuve `turn_limit_effective` est présente dans l’intention et le résultat.
