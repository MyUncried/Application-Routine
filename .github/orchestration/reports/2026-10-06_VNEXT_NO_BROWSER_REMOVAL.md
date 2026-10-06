# VNEXT_NO_BROWSER_REMOVAL

## Vérification demandée à 17 h 59 Paris

Départ a15b22b5d1073313818c65c1fd9ceafb7dda939e, Git propre. Lecture fraîche du run et des jobs GitHub : 37491799216 reste IN_PROGRESS, conclusion null ; admission SUCCESS, étape réelle IN_PROGRESS depuis 15:58:07 UTC, aucun artefact terminal disponible. Les enveloppes 37491798811 (V2) et 37491798526 (proof) sont SKIPPED, pas des échecs. Le dernier échec réel conservé est 37486926450, ancienne version avec navigateur, déjà diagnostiqué et corrigé par le retrait et le reçu Node accessible. Aucun nouvel échec de la version sans navigateur ne peut être diagnostiqué à ce point. Pas de modification du code, de publication ou de nouvelle relance pendant un parcours actif ; uniquement ce relevé documentaire local. Tests non applicables, état terminal et preuves à récupérer après fin effective. SHA de suivi communiqué dans la réponse.

## Mission et périmètre

Instruction explicite utilisateur du 6 octobre 2026 à 17 h 37 Paris : retirer définitivement le navigateur et ses contrôles du parcours de test. Départ local 85910db7acf14eb55f8caa7f943aa71e372e0a06 ; branche protocol/vnext-proof-stability-20260930 ; HEAD distant 0e4850d90bc4be6b8689a22fc368cca1296d8a93. Périmètre : driver réel tâche 2, qualification et historiques, contrat et instructions du projet. Aucun changement applicatif, appareil, PRE-1 ou tâche 3. Les instructions de diagnostic/correction/relance automatique restent applicables, avec contrôles exacts avant nouvelle demande.

## Origine et dernier résultat

Le navigateur a été introduit par choix d’implémentation dans b0bf7edf (commit mixte observateur et optimisation Git), pas par une obligation utilisateur. La demande de retrait HTML du 6 octobre 14 h 44 a été interprétée trop étroitement dans 187b8846 : seuls les contrôles de structure HTML ont été supprimés. Les contrôles navigateur ont ensuite entraîné des prescriptions et corrections supplémentaires (bd34c389, 90c59050). Aucun succès strictement comparable du parcours Figma complet n’est conservé ; les succès des parcours génériques antérieurs ne sont pas reclassés. La présente instruction résout explicitement le périmètre : ne pas conserver le navigateur comme intégration obligatoire ou option activable implicitement.

Dernier run 37486926450 terminé avant modification : REVISE avant implémentation, deux findings bloquants et deux suggestions. Risque technique : injection de largeur non universelle au regard des formes CSS autorisées (origine 187b8846, pas optimisation Git). Proof gap : reçu du test Node enregistré hors du dossier accessible au reviewer (origine 90c59050). Reçu et diagnostic Claude conservés. L’injection de rendu est retirée et remplacée par une faute fonctionnelle explicite. Le reçu Node est désormais embarqué dans execution.json, artefact hash-bound lu par le reviewer, et ses empreintes sont vérifiées contre les sources exécutées. Les suggestions sur le découpage des subprocess et le binding documentaire sont distinctes ; suppression de render élimine le premier découpage ambigu, aucune certification de changement de schema documentaire revendiquée.

## Changements

- Suppression de scripts/kodjo/lib/vnext-figma-browser-observer.js et tests/kodjo/vnext-figma-browser-observer.pilot.js ; récupérables dans Git. Aucun Edge/Chrome/CDP, profil temporaire, serveur HTML, screenshot ou mesure automatique de rendu dans les suites.
- Driver conservé au même chemin pour la continuité : sources Figma complètes conservées en contexte OBSERVED_ONLY ; seule l’exigence documentaire toggle est exécutée, aucun VISUAL_COMPARE automatique annoncé ou PASS inventé. Ce n’est plus une certification des trois anciennes propriétés graphiques : retrait de périmètre explicitement demandé.
- Module fonctionnel Existing + toggle ; test Node et observations de transitions dans des processus frais ; préservation, scope, hashes, références et barrières de revue inchangés. Défaut injecté : toggle forcé à false, rejet vérifié puis une correction causale.
- Recette : retrait de l’alternative de preuve par observateur navigateur ; origine des faits fonctionnels Node explicite, reçu visible au reviewer. Workflow, identifiants et séquence conservés ; le libellé historique Figma désigne désormais la source conservée, pas un rendu automatique.
- CLAUDE.md : interdiction de réintroduire navigateur ou contrôles de rendu sans nouvelle autorisation explicite. Validation visuelle exclusivement utilisateur. Tests de non-réintroduction et de reçu Node inclus.

## Vérifications et limites

Précheck réel sans modèle : une exigence, une assertion, deux scénarios, sources Figma conservées et empreintes égales. Pas de rendu ni de contrôle visuel. Suite locale VNext complète à consigner ci-dessous ; qualification Linux/Windows exacte requise avant publication de la demande réelle. Les tests des contrats visuels restants sont des tests de règles/données, pas une exécution de navigateur ou une validation d’écran. Validation sur appareil réel et conformité visuelle non exécutées, réservées à l’utilisateur. Aucun succès Claude anticipé. Les anciennes preuves ne sont pas effacées.

## Livraison

Fichiers : driver, recette, tests superviseur, suppression observateur/tests navigateur, CLAUDE.md, rapport/checkpoint et preuves. Commit final et état Git communiqués en réponse après livraison. Aucun changement de la branche applicative ou de main.

Le contrôle local intermédiaire du changement de libellé YAML a détecté une dérive d’empreinte du producteur protégé : 329 cas, 317 PASS, 12 FAIL. Aucun candidat publié ni appel Claude. Le changement cosmétique de libellé a été retiré, sans toucher la politique de sécurité ni ses contrôles ; nouvelle suite complète exécutée sur le code final. Le workflow fonctionnel appelle le même chemin de driver, dont le navigateur est supprimé.

Suite finale sur version committée : 329 PASS, 0 FAIL, 0 SKIP. Les deux échecs intermédiaires restants visaient encore le HEAD incluant les anciens libellés ; version committée après retrait entièrement verte. validateTree VALIDATED, politique de sécurité PASS_WITH_FROZEN_LEGACY, 420 sujets historiques, aucune unité PowerShell modifiée. Précontrôle sans modèle réussi. Qualification exacte Linux/Windows à suivre.

Qualification exacte 37490564500 SUCCESS : Linux et Windows chacun 329 PASS, 0 FAIL, 0 SKIP. PowerShell 5.1 natif et invariants de workflows validés. Candidat f15aa64eef32549e2c37b2fa242a6541146fa460, tree 5166acb6dc4c94f1950b98ff8ac921328996cb68. Admission vérifiée ; fenêtre distante sans run actif (222 runs examinés). Requête fraîche génération 63 préparée et admise pour un seul nouveau parcours fonctionnel réel, sans navigateur ni contrôle de rendu. Historiques conditionnés à son succès, validation visuelle utilisateur non exécutée.

Publication finale : contrôleur 37e85e0e6dc6b7cd7785c1e285a2a38245ace779, code exact qualifié f15aa64eef32549e2c37b2fa242a6541146fa460, mêmes bytes vérifiés. Run fonctionnel 37491799216 IN_PROGRESS ; admission 112366232402 SUCCESS, job réel 112366331664 démarré. Les enveloppes V2/proof sont SKIPPED, aucune duplication lourde. Historiques seulement après succès fonctionnel ; aucun PASS visuel automatique ni verdict Claude anticipé. Libellé Figma historique du job conservé pour ne pas modifier le producteur gelé ; son driver n’utilise plus de navigateur. Suivi documentaire committé localement sans déplacer le HEAD PR pendant l’exécution. Git propre après commit ; SHA documentaire communiqué dans la réponse. Les deux fichiers supprimés sont récupérables dans Git.
