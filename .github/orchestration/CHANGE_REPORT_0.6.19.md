# Rapport de changement KODJO V2 0.6.19

## Cause démontrée

Les runs #15 et #16 ont tous deux été interrompus par le plafond KODJO `--max-turns 40`, alors que Claude travaillait encore sur la même tranche :

- run #15 `34605322274`, job `103282218903`, diagnostic `10266106260`, reprise `10266091227` ;
- run #16 `34606534268`, job `103286215117`, diagnostic `10266898640`, reprise `10266968512`.

Dans les deux sorties Claude, `terminal_reason=max_turns`, `num_turns=41` et `error_max_turns` sont explicites. Le run #15 avait produit cinq fichiers ; le run #16 a restauré ce delta et porté la reprise à treize fichiers. Les paquets sont `INTACT`. La borne n’a donc pas réduit le travail total : elle l’a fragmenté en deux appels et a imposé une reprise supplémentaire.

## Correction

- suppression de `max_turns` des limites par défaut et des plafonds ;
- suppression de `--max-turns` des arguments Claude ;
- refus explicite de toute nouvelle demande contenant `max_turns` ;
- suppression du champ dans le constructeur PowerShell ;
- preuve explicite `turn_limit_effective` dans l’invocation et le résultat ;
- conservation de l’appel unique par demande, de l’anti-rejeu, du verrou, du scope, des permissions et du timeout de sécurité.

## Qualification

T-059 est PASS sur le run `34608773847` au commit `86cedd33e2579f351ddf2e117ab10ff60ed19ac9` : job Ubuntu `103293703287` PASS, job Windows persistant PowerShell 5.1 `103293703580` PASS, banc de file isolé PASS et artefact de certification `10267286529`. Aucun appel Claude ni demande Lean Queue n’a été effectué par la qualification.

La reprise applicative valide reste le run #16 `34606534268`, artefact `10266968512`. Elle ne sera pas relancée avant fusion et qualification de 0.6.19.
