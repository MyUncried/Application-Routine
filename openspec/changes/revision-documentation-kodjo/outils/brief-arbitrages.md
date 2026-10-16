# Brief — réexamen des questions Q-A à Q-N (lecture seule)

Dépôt : C:\Dev\KODJO-OPENSPEC-DOCS, branche docs/openspec-revision. Base d'analyse : main 6656fefc58330955f5ad74d513ce616ea51809b0 (inchangée au 16/10, revérifiée).
INTERDITS : ne modifier AUCUN fichier du dépôt ni d'un autre clone. Écrire seulement votre fichier de sortie dans le scratchpad.

Questions à réexaminer : openspec/changes/revision-documentation-kodjo/tasks.md §1C (texte des questions) ; contexte : diagnostic.md et constats/*.md du même change.

Sources à consulter pour chercher une réponse EXISTANTE :
- chapitres docs/Specifications-fonctionnelles/01..13 et docs/*.md à la base ;
- registre ch. 07 (décisions D-xxx, y compris leur texte d'origine dans Git : `git show <commit>^:<chemin>` ; commits utiles 37e372cd (07/10, texte de 24 décisions remplacé), 7a89220f (14/10, consolidation : a supprimé les SPECIFICATION-*.md et effacé des identifiants FMT-nn/REC-nn), f8088616 (14/10, formats)) ;
- spécifications supprimées, lisibles via `git show 7a89220f^:docs/Specifications-fonctionnelles/SPECIFICATION-<…>.md` ;
- PR ouvertes non fusionnées (têtes inchangées depuis le diagnostic) : scratchpad/pr/pr363.diff, pr370.diff, pr371.diff et *-body.md ;
- décisions de Hermann de la préparation PRE-4 BMAD (fichier non versionné, copie figée du 16/10 17:31) : scratchpad/pre4-bmad-questions-ouvertes-r2.md (Q1–Q26, P1–P45, H*, F*). Q24–Q26 sont postérieures au diagnostic.

Règles :
- Pour chaque question : (1) décision attendue, formulée en une phrase ; (2) sources qui apportent déjà une réponse, avec citation verbatim ≤ 3 lignes et `fichier:ligne` (ou `commit:chemin:ligne`, ou `pre4-r2:Qxx`) vérifiés ; (3) sources qui la contredisent ; (4) classement : RÉSOLUE_PAR_SOURCES (une décision explicite ou une règle non contredite répond déjà ; préciser laquelle et si elle est seulement à reporter dans la doc) / RECOMMANDATION_DOCUMENTAIRE (choix d'organisation ou de rédaction sans effet sur une règle produit ; proposer la recommandation) / ARBITRAGE_PRODUIT (une décision produit de Hermann reste nécessaire) ; (5) si ARBITRAGE_PRODUIT : question minimale fermée à poser, options avec leurs sources, recommandation éventuelle marquée comme telle ; (6) dépendances (PR, PRE-4) ; (7) niveau de certitude.
- Une décision PRE-4 BMAD est une décision de Hermann pour la préparation PRE-4 : indiquer si sa portée est limitée à PRE-4 ou générale (citer le texte qui le dit), sans l'étendre implicitement.
- La récence ne vaut pas remplacement. Le domicile d'une règle ne tranche pas une contradiction.
- Ne pas inventer de règle. En cas de doute : le dire.

Format de sortie : un tableau récapitulatif (ID, décision attendue, classement, preuve principale, question résiduelle), puis une section par question. Terminer par « Couverture » (ce qui a été cherché, commandes grep principales).
