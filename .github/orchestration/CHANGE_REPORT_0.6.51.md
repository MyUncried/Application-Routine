# KODJO V2 — Change report 0.6.51

## Objet

Consolider dans une seule version candidate les évolutions de déterminisme, continuité, correction visuelle, cycle de vie des artifacts et efficience CI préparées après PRE-1.

## Périmètre

- PE-27 : assertions UI atomiques ;
- PE-28 : VISUAL_CORRECTION directe sous contrat inchangé ;
- PE-29 : handoff utilisateur actionnable ;
- PE-30 : clôture ACTIVE → CLOSED ;
- PE-31 : continuité opératoire du cockpit ;
- PE-32 : validation déterministe des paths ;
- PE-33 : révision delta-only après REVISE ;
- PE-34 : requirement/test/boundary contracts et audit de déterminisme ;
- PE-35 : hiérarchie des erreurs et correction résiduelle bornée ;
- PE-36 : politique artifacts/quota ;
- PE-37 : annulation des qualifications supersédées ;
- PE-38 : prévention des qualifications lourdes inutiles.

## Correctif ciblé après exécution

Le préflight Windows du run #566 a réussi ses contrôles courants puis a échoué sur le téléchargement de l’ancien artifact de recovery du run 34606534268, désormais absent. Le téléchargement historique facultatif et sa certification sont bornés ; l’absence est consignée dans une preuve FAIL sans bloquer la qualification du HEAD courant. Aucun contrôle de recovery courant n’est rendu facultatif.

## Déclenchement de l’audit indépendant

Le workflow candidat n’étant pas encore présent sur `main`, son `workflow_dispatch` ne peut pas être utilisé avant activation. Un déclencheur `pull_request` borné à la PR #250 et au fichier d’audit attend un run pilote SUCCESS lié au même HEAD avant d’appeler Claude. Aucun audit d’un HEAD supersédé n’est publié.

Le pré-audit Windows installe le tokenizer isolé avant de rejouer les tests, comme le pilot Windows. Le run d’audit #3 a refusé l’appel Claude lorsque cette dépendance manquait ; ce correctif rétablit le même environnement de qualification.

## État

Implémentation candidate présente dans la PR #250.

La branche n’est pas qualifiée à ce stade. Les tests locaux/statistiques incorporés dans la branche sont des oracles à exécuter ; ils ne constituent pas une preuve PASS tant que la CI Linux/Windows et l’audit indépendant n’ont pas été exécutés.

Statut : **NON RETESTÉ**.
