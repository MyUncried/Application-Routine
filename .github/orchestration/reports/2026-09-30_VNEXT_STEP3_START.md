# VNext-12 — INITIAL préparé et revu, exécution non encore lancée

| Étape | Statut |
| --- | --- |
| 1. Raccorder la chaîne réelle | TERMINÉE ; préflight complété pendant l’étape 3 |
| 2. Qualifier Linux/Windows | TERMINÉE ; correctif de lancement requalifié |
| 3. Tranche jetable INITIAL puis REVISION bornée | EN COURS |
| 4. Audit FINAL indépendant de Claude | NON DÉMARRÉ |
| 5. Activation, bascule et clôture | NON DÉMARRÉE |

## Preuves acquises

- Candidat exact : `7f47ebeafdedce768f4678c1921372034ab56500`.
- [Run VNext-12 36784461402](https://github.com/MyUncried/Application-Routine/actions/runs/36784461402) : SUCCESS.
- Linux `110122405970` et Windows `110122406314` : SUCCESS.
- Préparation réelle Windows `110126840008` : SUCCESS.
- Revue indépendante de plan : APPROVE, session réelle `df7870b7-2891-407b-b4d4-55d8f368d3f7`.
- Artefact `11131610310`, empreinte ZIP vérifiée : `f038294c2fd8225ec342dea9cade0b4a24623d9070deca7ede3334876ab5073c`.
- Reçu et contrats scellés validés ; aucun finding bloquant. Une suggestion de granularité des exigences PRESERVATION est conservée dans le reçu, sans correction requise pour cette tranche.
- Le blocage ENAMETOOLONG du run précédent est levé par une vraie invocation Claude réussie, pas uniquement par les tests.

Le dossier exact revu, ses projections stables, son bootstrap et son transport initial sont matérialisés sur la branche de qualification. Seule l’identité VNEXT-12-QUALIF est ajoutée au registre de cette branche ; toutes les anciennes entrées sont conservées à valeurs identiques, sans changement sur main.

## Ce qui reste à effectuer

Publier le message d’approbation lié au commit immuable qui contient ce dossier ; constater le refus avant implémentation tant que le propriétaire n’a pas approuvé ; obtenir son approbation exacte ; exécuter INITIAL dans une tranche jetable, puis REVISION causale bornée avec limite 1 et conserver les résultats réels.

Le transport conservé possède encore le placeholder `issue_comment:1` : il n’est pas une autorisation. Le commentaire réel devra être observé par le handoff et l’admission canonique avant toute invocation d’implémentation.

Aucune implémentation n’a été lancée par ce run (`implementation_invoked=false`). Aucune approbation utilisateur n’a été observée (`user_approval_observed=false`). Aucun résultat INITIAL/REVISION n’est revendiqué. Aucune fusion, publication applicative, activation sur main, ni audit FINAL.

PRE-1 et ses opérations restent hors périmètre.

## Approbation exacte et lancement INITIAL

Le propriétaire MyUncried a ajouté la réaction +1 `429313735` le `2026-10-01T00:09:42Z` au commentaire [5921521038](https://github.com/MyUncried/Application-Routine/pull/269#issuecomment-5921521038), dont le corps exact a été relu et lié au commit `e47525b70e62b4ea3d4b32b9fae09e306b5e3094` et à la cible `d5ca8d589b886cf4231eea457527729081288d1544c35703ee83f18085db4d59`.

La demande explicite passe à EXECUTE_INITIAL. Le contrôleur possède son propre commit ; les contrats, contrôles d’admission et adaptateurs exécutés proviennent exclusivement du checkout approuvé e47525b7. Aucune revue APPROVE nouvelle n’est fabriquée ou relancée. Le workflow empêche l’annulation d’une implémentation par un commit ultérieur et saute les jobs de préparation pendant EXECUTE_INITIAL.

Le superviseur, validé par trois tests de refus et un contrôle de syntaxe YAML, doit vérifier la vraie admission avant installation ; exécuter deux probes négatives déclarées (absence d’autorité de queue et empreinte de revue invalide) via le vrai run-local-claude ; certifier le verrou persistant ; utiliser un miroir/origin local sans distant GitHub ; exécuter les checks baseline, puis le vrai start-kodjo-v2/run-local-claude avec observations fraîches et consommation atomique du request_id. Le jeton GitHub demeure dans le superviseur et ne rejoint pas Claude.

Le tag protocolaire de consommation est la seule écriture distante autorisée par ce job. Aucun code applicatif, branche applicative ou PR n’est publié. Le patch et le paquet runtime sont conservés avant nettoyage du clone. Le résultat INITIAL, la valeur observée 2, le test Jest direct et la préservation de keep.js seront jugés sur les preuves de ce run, sans anticiper PASS. REVISION reste à effectuer ensuite. Étape 4 et PRE-1 restent hors périmètre.
