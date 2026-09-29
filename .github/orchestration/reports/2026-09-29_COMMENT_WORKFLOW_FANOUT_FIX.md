# Suppression des runs de commentaires sans travail utile

## Diagnostic GitHub

Baseline technique lue sur GitHub : `6ba8262cc7f3ae0b1217bb7449d81649759b873b`.
Les workflows de `main` possèdent 32 abonnements natifs `issue_comment.created`.
Les runs associés au commentaire de livraison `5899349308` sont créés avant
l'évaluation des conditions de jobs, puis immédiatement ignorés. Routine Dev
reçoit aussi la fin du run de revue ignoré via `workflow_run`.
Ajouter une condition de job ou supprimer l'historique des runs ne corrige pas
ce mécanisme de création.

## Correction

Un seul abonnement natif reste : `kodjo-v2-comment-router.yml`. Les 32 traitements
deviennent des workflows réutilisables. Le routeur reproduit la disjonction des
conditions de leurs jobs racines et appelle seulement les traitements concernés.
Chaque appel conserve les permissions initiales du traitement ; le routeur n'a
aucune étape d'écriture et ses permissions par défaut sont `contents: read`.
Le scanner autorise uniquement les délégations vers les écrivains déjà existants,
et refuse un job exécutable, une autre cible ou une permission globale d'écriture.
Les jobs, contrôles d'auteur, concurrence, déclencheurs manuels et dispatchs des
32 traitements sont conservés. Le contexte du commentaire reste celui de l'appelant.

Routine Dev reste un observateur. Le routeur l'appelle après le succès du job de
revue, sans créer un run supplémentaire. Le résolveur exige le job de revue exact,
terminé avec succès, obtenu via l'API de la tentative exacte, puis un commentaire
bot unique lié aux mêmes run/tentative, publié dans la fenêtre de cette revue et
portant `APPROVE`. Les liens vers l'implémentation, la PR et le HEAD restent vérifiés.
Le déclencheur historique `workflow_run` reste pour les revues autonomes déclenchées
par `repository_dispatch` ; elles ne sont plus créées par des commentaires ordinaires.

Un commentaire ordinaire peut encore créer le run léger du routeur : GitHub ne
filtre pas nativement `issue_comment` sur le texte. Il n'entraîne aucune allocation
de runner si tous les appels sont ignorés. L'objectif est la suppression de la
rafale de runs distincts, sans supprimer les commandes de protocole utiles.

## Vérifications avant livraison

- Comparaison indépendante des snapshots GitHub : corps des jobs des 32 traitements
  identiques octet pour octet ; concurrence et autres événements inchangés.
- Analyse YAML complète de tous les workflows, puis contrôle du graphe et des
  permissions avec le parseur du dépôt.
- Tests négatifs : commentaires ordinaires, liens de livraison, auteur non autorisé,
  confusion START_INITIAL_PLAN/START_INITIAL_PLAN_REVIEW, délégation détournée.
- Tests causaux Routine Dev : job absent/ignoré/échoué/autre run, tentative différente,
  doublon et commentaire postérieur à la revue sont rejetés.
- Tests locaux répétés avec fins de ligne LF puis CRLF ; scanner des écrivains.
- Simulation de fusion du scanner avec le HEAD de #250 : aucun conflit ; les
  autorisations du routeur et de l'écrivain de publication d'audit se composent.
- Qualification Linux/Windows à vérifier sur le commit livré avant activation.

Cette correction ne modifie ni les branches #250/#252 ni l'issue PRE-1 #249,
ni sa baseline produit ou ses commentaires causaux. Les preuves de qualification
et l'activation sont à lire sur GitHub ; leur succès n'est pas présumé ici.
