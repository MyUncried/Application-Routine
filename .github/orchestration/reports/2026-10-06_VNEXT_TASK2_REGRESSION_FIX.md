# VNEXT_TASK2_REGRESSION_FIX — correction et relancement

Autorisation du 6 octobre 2026 à 08:50 Paris : lire l’analyse des origines, confirmer le diagnostic, appliquer les correctifs et relancer le test. Départ local 0c882bac1abad36a905f82ec57649c3944ced7f2, distant bb6dcf7b0927242a0612c6ac11cdc7de99109b09, branche protocol/vnext-proof-stability-20260930, PR #269 draft. Dépôt propre et 192 runs de branche terminés vérifiés avant modification. Aucun second écrivain observé.

## Diagnostic confirmé

Analyse transmise lue et confrontée aux sources/preuves précédentes. Le parcours Figma comparable échouait déjà sur e0c766fe : qualification historique verte et revue initiale réelle ne sont pas équivalentes. Pas de rollback global du scanner Git : aucune régression de ses données démontrée. Le nouveau transport par indices décode correctement mais n’excluait pas suffisamment la cible courante des dépendances. Le navigateur comportait une mutation commandée par le sujet. La preuve de dimensions ne distinguait pas un rendu relatif et l’obligation Node était imprécise. EPERM Windows prouve un défaut de nettoyage ; l’identité du détenteur du verrou précédent n’est pas établie.

## Corrections appliquées

Transport : description du schéma et instruction explicite anti-autodépendance, distinction avec couverture de revue complète ; vérification dès décodage et refus canonique conservé. Aucune dépendance d’une réponse originale/scellée n’est supprimée silencieusement.

Preuves Figma : observateur ne lit plus __figmaWidthDelta ni n’ajuste le DOM. Défaut négatif injecté dans render() (402px → 403px) ; correction bornée supprime uniquement le bloc et exige l’identité exacte avec l’implémentation précédente. Mesure au viewport requis 402x874 puis au viewport indépendant 503x971, deux captures/faits conservés, refus d’une géométrie relative. Contrat Node exige valeurs exactes et titre exact ; contrôle exécuté par le driver, sans imposer cette convention CSS au protocole générique. Contrainte d’observateur indépendant propagée à chaque item du plan jetable.

Navigateur : fermeture CDP, attente de sortie réelle, terminaison forcée du seul arbre isolé si nécessaire puis attente effective. Windows : inventaire borné des processus dont la ligne de commande contient le profil temporaire unique, attente de disparition avant suppression. Diagnostic de fermeture/descendants, stderr et profil retenus sur échec. Le nettoyage ne remplace pas l’erreur principale. Pas de suppression/terminaison d’un navigateur utilisateur.

PRESERVE : scanner Git, contrats canoniques, coverage complète, UUID consommé, plafonds Claude 2 heures/job 120 minutes, application réelle et référence Figma figée. CHANGE : transport de revue, observer/driver/recette jetable, tests ciblés, branche de qualification et preuves/checkpoint. FORBIDDEN : tâche 3, application native, activation, clôture, V2/PRE-2/PRE-3.

## Vérifications

Première suite ciblée : 38 tests, 36 PASS, 0 FAIL, 2 SKIP navigateur absent localement. Vérification finale du fichier navigateur après derniers ajouts : 10 tests, 8 PASS, 0 FAIL, 2 SKIP ; exactitude des dimensions, refus de compensation dans le navigateur, preuve relative et nettoyage/processus couverts par les cas ciblés. Les deux cas de navigateur effectif ne sont pas certifiés localement : ils doivent passer dans la qualification Linux et Windows. Précheck Figma PASS, 3 exigences, 4 assertions, deux scénarios, aucun appel IA. Syntaxe JS et whitespace vérifiés. Tests historique/contrats distants et lancement réel restent à observer. Aucun test appareil applicable, acquisition Figma live hors périmètre.

## Publication et suite

Fichiers : scripts/kodjo/lib/vnext-live-chain.js, vnext-figma-browser-observer.js, vnext-figma-recipe.js, scripts/kodjo/qualify-vnext-figma-real-path.js, tests/kodjo/vnext-figma-browser-observer.pilot.js, workflow proof-stability (branche uniquement), ce rapport/checkpoint/preuves. Zéro correspondance historique nommée pour le fichier de tests modifié ; registre et protections inchangés. Qualification requise sur la tête de code corrigée puis nouvelle demande génération 53 / UUID neuf, une seule exécution. L’ancien UUID n’est jamais rejoué. Publication après validation tree/fenêtre et relecture séparée. Démarrage du run ne vaut pas réussite du parcours.

Commit final du rapport et état Git fournis en conversation, disponibles par git log -1 --format=%H -- ce rapport. Les observations suivantes seront ajoutées sans remplacer les preuves antérieures.

## Qualification lancée

Candidat cf80c57c69a1f74e0ff3e4b6c62da169a1fd30c9, arbre c5ec130ed51ae865e8903a14cfb32f922e725e54 identique au local ; tree VALIDATED, 420 protections historiques, policy PASS_WITH_FROZEN_LEGACY. Fenêtre HEAD/checkpoint et 192 runs vérifiés avant publication. Qualification 37426909256 lancée une fois par branche dédiée. Preuves du run précédent publiées avec les corrections. Aucun appel Claude ni nouvelle demande runtime à cette étape.

## Qualification acquise

Run 37426909256 SUCCESS, cinq jobs requis exact-head vérifiés. Contrats 322/322 PASS sur Linux et Windows, zéro échec/skip ; contre-exemples navigateur réellement exécutés sur les deux OS. Historique 1 089 tests par OS, Linux 1 088 PASS/1 SKIP, Windows 1 086 PASS/3 SKIP, aucun échec. Comparaison des preuves interplateformes réussie ; archives SHA-256 et ZIP vérifiés. Nouvelle demande génération 53, UUID 99afa62c-632d-4670-9bd1-f3ed857b1d87 ; démarrage réel encore à vérifier. Aucun résultat de parcours ni stabilité absolue du PC physique revendiqués.

## Test réel relancé une fois

Contrôleur 4311eabe62bf83de724eb99ef5056c34ce21307c publié, arbre 5cbed405864e97949feec8dae5d7145fcb613291 identique au local et VALIDATED ; fenêtre HEAD/checkpoint, 192 runs vérifiés avant publication. Admission EXACT_SAME_PROTOCOL_CODE avec le candidat qualifié cf80c57c69a1f74e0ff3e4b6c62da169a1fd30c9 vérifiée. UUID 99afa62c-632d-4670-9bd1-f3ed857b1d87, génération 53. Run 37428291785, tentative 1, job 112152955517 en cours sur KODJO-LOCAL-RUNNER ; étape Qualify admission then execute the disposable Figma path once observée en cours à 2026-10-06T07:14:55.069Z. Claim interne, appels Claude et résultat final restent à vérifier dans les preuves terminales ; démarrage ne vaut pas réussite du parcours. Plafonds Claude 7 200 000 ms et job 120 minutes cumulatives conservés. Aucun appel ajouté pour mesurer la performance.

Seconde passe : code qualifié identique au code exécuté, protections historiques conservées, contre-exemples réellement exécutés sur les deux OS, une demande neuve et aucun rejeu du run consommé. Git propre vérifié après commit documentaire final. Rapport final conservé localement pendant les runs actifs ; aucune publication concurrente de checkpoint. Résultat du test réel reste à récupérer au terme du run 37428291785.
