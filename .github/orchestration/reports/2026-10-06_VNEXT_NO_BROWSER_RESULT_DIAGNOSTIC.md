# VNEXT_NO_BROWSER_RESULT_DIAGNOSTIC

## Mission

Demande du 6 octobre 18 h 35 Paris : comprendre l’instabilité du protocole de test. Départ f6f02b72f306a2695c884b248cf1d7615c579cd6, branche protocol/vnext-proof-stability-20260930 ; contrôleur distant 37e85e0e6dc6b7cd7785c1e285a2a38245ace779, code f15aa64eef32549e2c37b2fa242a6541146fa460. Diagnostic seulement, sans changement exécutif, publication ou relance. Aucun appareil, application, PRE-1 ou tâche 3 concerné.

## Résultat vérifié

Run 37491799216 FAILURE. Sélection et admission SUCCESS ; qualification préalable 37490564500, 329 PASS sur chaque plateforme, zéro FAIL/SKIP. Job réel 112366331664 : VNEXT_LIVE_REVIEW_NOT_APPROVED: REVISE. Claude termine normalement, exit status 0, erreur null, 408768 ms (6 min 49 s), plafond 7200000 ms. Quatre constats dont trois bloquants. Refus avant implémentation, aucune correction exécutée. Historiques SKIPPED selon la séquence prévue. Artefact 11426097501 récupéré, reçu/process/status conservés. Aucun navigateur ni test visuel humain requis dans ce run fonctionnel.

## Constats et confrontation au code

1. TEST_GAP : la consigne du test de sentinelle dit de vider deux caches puis remplacer l’export, mais omet le rechargement du module partagé entre ces étapes. La formulation précédente de 90c59050 le précisait. Cette omission déclarative est introduite dans f15aa64e pendant la simplification du contrat sans navigateur. Le helper effectif preservedExportAssertion recharge bien le module partagé et teste ensuite la sentinelle ; l’absence dans le texte ne démontre donc pas un défaut de ce helper.
2. PROOF_GAP sur préservation : la revue décrit la propriété comme dépendant exclusivement du test livré. Le code la vérifie aussi dans un processus Node orchestré : assertDelta appelle assertPreservedExport, qui appelle preservedExportAssertion avec égalité normale et identité sentinelle. La garantie existe, mais le plan et le reçu n’explicitent pas un résultat de preuve autonome pour cette garantie. Origine : contrôle déjà antérieur au retrait navigateur ; remplacement de contrat f15aa64e n’a pas intégré ce chemin dans la description des preuves. Attribuer une panne à l’exécution serait excessif ; lacune de présentation et d’attestation distincte démontrée.
3. PROOF_GAP sur ordre des transitions : le texte générique de f15aa64e dit « independent isolated Node transition calls ». Le code observe réellement deux appels ordonnés sur la même instance dans un seul processus et compare true puis false. Le plan a aussi une contrainte « toggle twice in a fresh Node process ». Le reviewer demande un lien explicite premier appel → toggle-off-on, second appel → toggle-on-off dans l’obligation de preuve elle-même. Ambiguïté déclarative ; aucune observation de faux PASS ou reset par scénario dans ce code.
4. Suggestion non bloquante CREATE/MODIFY : justification héritée de la création d’une surface de rendu, désormais module fonctionnel existant ; préciser que CREATE concerne le symbole toggle, pas la réécriture du module. Ne pas confondre cette suggestion avec les trois blocages.

## Pourquoi les échecs se succèdent

La principale source observée est un banc d’essai et un contrat de preuve changeants, corrigés par fragments : comportement du driver, obligations du plan, observations, reçus et accès du reviewer ne sont pas revérifiés systématiquement comme un tout. Les qualifications mécaniques prouvent les cas codés ; elles ne détectent pas toutes les ambiguïtés de langage et omissions d’attestation que le reviewer sémantique examine. Le passage au reviewer expose ces lacunes et bloque légitimement ou exige clarification, mais un blocage de plan n’est pas une panne d’exécution du moteur.

La modification appelée optimisation a été un lot mixte b0bf7edf : optimisation Git, transport et observateur navigateur. Ce dernier a créé des contraintes non demandées, puis des corrections répétées (cf80, 988, a1ab, 8e6, 187, bd34, 90c). Le navigateur est maintenant retiré conformément à la demande, mais son retrait f15aa64e a lui-même condensé des consignes et omis des détails nécessaires. Les causes actuelles ne sont donc pas des contrôles navigateur restants ni une causalité démontrée du batch Git. Elles sont, pour l’omission sentinelle et le texte des transitions, liées au dernier correctif ; pour l’attestation de préservation, une lacune de contrat plus ancienne rendue visible dans la nouvelle rédaction.

Succès antérieurs réels conservés : INITIAL 37115247745/08cb8b93 et REVISION 36881458781/3a931996. Ce sont d’autres parcours. Le premier Figma comparable conservé 37325776512/e0c766fe échouait déjà avant b0bf. Ne pas nier les succès anciens, ni présenter comme démontrée la régression du même scénario sans preuve de succès strictement comparable. Aucune comparaison répétée du même plan avec plusieurs reviewers n’a été faite : la variabilité du modèle n’est pas établie comme cause principale.

## Correctif à préparer, non appliqué dans cette mission

Stabiliser d’abord le scénario fonctionnel et son périmètre ; reconstruire une correspondance unique obligation → contrôle réellement exécuté → résultat conservé → preuve accessible au reviewer. Reprendre l’ordre exact du helper pour la sentinelle ; expliciter un unique processus et le lien des deux appels aux deux scénarios ; déclarer et attester séparément le contrôle orchestré de préservation déjà existant. Tester cette correspondance sur le plan réellement généré, ses reçus et le dossier de revue, avec des cas négatifs et une réalisation fonctionnelle de référence, avant une nouvelle revue indépendante. Ne pas ajouter de navigateur, de validation visuelle humaine pour ce test ni de nouvelle promesse de durée. Ne pas supprimer les gates de revue pour obtenir un run vert.

## Livraison et limites

Rapport, preuves et checkpoint terminal seulement. Aucun fichier applicatif ou script exécutable modifié, aucune opération externe mutante. Lectures Git/API et comparaison des versions ; aucun nouveau test de code applicable. La réussite du parcours fonctionnel complet reste à démontrer. Git propre après commit documentaire local, sans déplacement du HEAD PR ; hash final communiqué dans la réponse.
