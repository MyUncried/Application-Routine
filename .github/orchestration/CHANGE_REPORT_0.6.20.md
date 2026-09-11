# Rapport de changement KODJO V2 0.6.20

## Cause

Après fusion de 0.6.19, le paquet non vide du run #16 (`10266968512`) restait lié à `32e0fbb38d32c94fdc22c7c1c059f82106431e5e`. Une reprise depuis le HEAD protocolaire corrigé était donc refusée avant Claude. La qualification 0.6.19 avait exercé une fixture, pas cet artefact réel.

## Correctif

- séparation explicite de la base du paquet et du HEAD d’exécution ;
- migration limitée aux descendants dont l’intervalle est exclusivement protocolaire ;
- refus de toute évolution applicative, recouvrement, non-ascendance ou conflit ;
- `git apply --check` conservé, sans fusion à trois voies ;
- preuve de migration dans l’invocation et le résultat ;
- banc Windows téléchargeant l’artefact réel du run #16.

## Qualification

- local réaligné sur les blobs 0.6.19 : 179/179 PASS ; workflows valides ;
- premier banc réel : run `34611535515`, téléchargement PASS, dry-run FAIL à cause d’un checkout sans historique ;
- banc corrigé : run `34611834316` SUCCESS ; Ubuntu `103303973342` PASS ; Windows PowerShell 5.1 `103303973778` PASS ;
- artefact source réellement téléchargé : `10266968512`, digest GitHub `84025cf1b5961ca4d97aab81222afebc79ce7689e075bac8823b53f7800e77da` ;
- preuve produite : `10269012308`, statut PASS, 13 chemins restaurés, `claude_invoked=false`.
- HEAD documentaire avec validation canonique : run `34612786612` SUCCESS, Ubuntu `103307173240`, Windows `103307173669`, preuve réelle `10268579775`.

## Frontière de preuve

Cette qualification prouve le déblocage pré-Claude du paquet réel. Elle ne prouve pas encore une invocation Claude réelle, une branche GitHub applicative ou une PR applicative. Ces preuves restent NON RETESTÉES jusqu’aux deux tranches jetables prévues.

## Durcissement après banc de tranche jetable

Le banc autonome du 2026-09-11 a démontré trois défauts supplémentaires avant toute invocation externe :

- une trace du superviseur contenait un double encodage UTF-8 ;
- PE-22 utilisait un statut hors de la liste fermée du backlog, sans validation automatique ;
- `inScope()` comparait des chaînes sans imposer un chemin Git relatif canonique, ce qui admettait une traversée lexicale et un nom POSIX contenant des antislashs.

Le correctif remplace le marqueur corrompu, valide désormais tous les statuts PE et refuse les candidats de scope absolus, dot/dotdot, NUL, lecteurs Windows, segments vides ou antislashs ambigus. INC-090 à INC-092 et T-063 à T-065 en assurent la non-régression. La tranche jetable reste bloquée jusqu’à qualification du HEAD corrigé puis exécution de ses scénarios réels.
