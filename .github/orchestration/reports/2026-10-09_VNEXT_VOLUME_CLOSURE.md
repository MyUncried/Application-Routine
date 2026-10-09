# VNext — clôture du correctif de volume du 9 octobre 2026

## Résultat livré

Le correctif du protocole est intégré dans main et dans la branche de planification PRE-3. Aucun run PRE-3, reconstruction du plan, appel de revue Claude, approbation du propriétaire ou développement applicatif n'a été lancé par ce chantier.

Le calcul canonique travaille sans chaîne JSON géante. Le transport répartit les valeurs complètes dans des fichiers bornés et contrôlés par hash ; les vues documentaires restent navigables. Aucun requirement, critère ou assertion n'est supprimé. Les lecteurs de production, reprise, admission Git et plan autorisé sont raccordés ; dépendances du gate, inventaire et pins exacts sont reconciliés. Les fichiers de transport gardent leurs octets sous Git Windows. Les chemins courts et la lecture cat-file blob évitent les limites observées ; les anciens manifestes restent lisibles.

## Intégrations qualifiées

| Destination | PR | Candidat exact | Run VNext | Run pilots |
| --- | --- | --- | --- | --- |
| main | [#342](https://github.com/MyUncried/Application-Routine/pull/342) | 1f2d59e930a63ea00116345e431593352259516a | [37894915206](https://github.com/MyUncried/Application-Routine/actions/runs/37894915206) | [37894915185](https://github.com/MyUncried/Application-Routine/actions/runs/37894915185) |
| plan/pre3-vnext-20261008 | [#341](https://github.com/MyUncried/Application-Routine/pull/341) | ad5b9086ec66a714166ab7923a3c26a57ba93c36 | [37894899370](https://github.com/MyUncried/Application-Routine/actions/runs/37894899370) | [37894899464](https://github.com/MyUncried/Application-Routine/actions/runs/37894899464) |

Les deux runs VNext couvrent Linux, Windows, l'équivalence historique et la couverture entre plateformes. Les deux runs pilots exécutent la suite complète et le précontrôle local Windows sans Claude. La qualification jetable avec Claude et les audits indépendants ne sont pas exécutés. Les anciens candidats en échec sont conservés comme diagnostics et ne servent pas de preuves de qualification finale.

La suite locale finale compte 1458 tests : 1453 PASS, zéro échec et 5 skips. Chaque contrôle VNext Windows natif compte 471 PASS, zéro échec et zéro skip. La suite historique Windows du candidat main compte 1455 PASS, zéro échec et 3 skips. Les skips ne sont pas comptés comme des réussites ; le gate de couverture historique est exécuté. Les preuves exactes, leurs artefacts et leurs empreintes sont consignés dans [le registre JSON](evidence/2026-10-09_VNEXT_VOLUME_CLOSURE.json).

La relecture de code est une revue ciblée de l'agent. Aucune revue indépendante de modèle ni certification générale de l'exploitation de VNext n'est revendiquée. La preuve historique conserve son statut NOT_CERTIFIED_FOR_OPERATIONAL_VNEXT.

## Réserves conservées

Le précontrôle du protocole est PASS/PREFLIGHT_ONLY et claude_invoked=false. Sa baseline applicative Windows a 1526 tests Jest PASS et un échec de gel de migration dû aux fins de ligne CRLF ; TypeScript et lint sont PASS. Le fichier migration001.ts a le même blob Git avant et après cette correction. Son SHA-256 LF est 2b3b1bab6399ef0cd688886d8530588ab73eef377e0bb90335dff48ddfa66add ; la conversion CRLF reproduit exactement le hash reçu 15df08e3b406243a946edd4b8513748e57d202f01c35f24a5df309c13a4c67bf. Aucun fichier applicatif n'est corrigé dans ce chantier et aucun PASS applicatif complet n'est inventé.

L'artefact historique run 16 indisponible reste une réserve du workflow ; sa récupération n'est pas attestée. La capacité d'une revue indépendante à traiter les 304638 cibles du paquet PRE-3 reste non démontrée.

## Raccordement à PRE-3

[#340](https://github.com/MyUncried/Application-Routine/issues/340) reste en pause. Le périmètre P3-01 à P3-23, les décisions D-334 (photothèque seule) et D-335 (A, sélection multiple), la source gelée 3019c5f8c4a38efb83865635e0a8d67d48a5b5ab et les 95 états (41 frames, 54 états documentaires) sont conservés.

La lecture seule du paquet historique existant a conservé 6384 requirements, 243974 assertions et les hashes chaîne/Plan/UI ; elle n'atteste pas une nouvelle production sur le protocole corrigé. Une reprise ultérieure devra identifier sa révision de protocole corrigée, produire et revoir ses propres objets exacts puis obtenir la validation du propriétaire. Ces étapes ne sont pas lancées par cette clôture.

Le registre est un ajout documentaire après les intégrations. Les runs ci-dessus qualifient les candidats de code exacts ; ils ne sont pas attribués rétroactivement au commit documentaire du registre.

## Commits de fusion

- main : `f532f21918975293c11ae36442a5ea778f808e36` ; arbre `7bc8494e23c2deb4b96de5c4c779d4e5b67f7711`.
- plan/pre3-vnext-20261008 : `1d42479181586d926a9970867a41d35d44cc4661` ; arbre `77873287f7e0ba9b3b42c85cc2c94ce0116edbef`.

Les deux précontrôles ont PASS/PREFLIGHT_ONLY, `claude_invoked=false`, nettoyage PASS et la même réserve de baseline Jest Windows.
