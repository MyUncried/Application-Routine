---
title: "Revue adversariale du PRD PRE-5 et de son addendum"
date: 2026-10-19
objet: "prd.md et addendum.md (prd-kodjo-pre5-2026-10-19)"
references: "table-delta.md (§6 prime sur §3) ; PRE5_BMAD_Decisions_v2.md ; spécification consolidée des phases ; spécification de la charge v3 (CA-01, CH-05, CH-08, DU-01) ; code au HEAD 52382b04"
fait_faisant_foi: "Δ50 (19/10) : minimum et pas de 1 s pour toute durée positive, maxima conservés, somme des phases 1..3535 s"
mode: "lecture seule ; seul ce fichier est écrit"
---

# Revue adversariale du PRD PRE-5

## Verdict

**Pas prêt pour les stories en l'état.** Le PRD est bien construit et sa couverture des lignes Δ est complète. Il contient toutefois une contradiction critique avec la décision finale du 19/10 (FR-8). Plusieurs FR se contredisent entre elles (FR-3 contre FR-9, FR-42 contre FR-18, FR-42 contre FR-10). La liste des remplacements du §7 ne couvre pas tous les changements de comportements validés que le PRD exige pourtant, alors que NFR-1 et NFR-8 interdisent tout autre remplacement. Enfin, l'affirmation « Aucune question produit nouvelle » (§9) est inexacte : au moins six points obligeraient le développeur à fixer lui-même une règle produit.

La plupart des constats se corrigent sans décision, en reprenant des décisions existantes ou en précisant une préséance. Six d'entre eux supposent un arbitrage de Hermann.

| Gravité | Nombre |
|---|---|
| Critique | 1 |
| Haute | 8 |
| Moyenne | 16 |
| Basse | 13 |
| **Total** | **38** |

Légende des indications : **[SD]** = corrigeable sans décision ; **[DP]** = suppose une décision produit.

---

## 1. Critique

### C-1 — FR-8 rétablit une restauration des phases que la décision finale du 19/10 abandonne [SD]

- **Emplacement :** FR-8, 5e puce ; cohérence avec FR-5 et FR-2.
- **Citation (PRD) :** « **Revenir à Avec tant que la Feuille est ouverte** restaure les phases. Elles ne sont supprimées qu'au ✓. »
- **Source qui fait foi :** `table-delta.md` §6, QP5-04, arbitrage final du 19/10 : « revenir à Avec crée une seule phase, à la durée actuelle de la série, sans mémoriser les anciennes phases » ; « La restauration tant que la Feuille reste ouverte, prévue en (d) de la §3, est abandonnée. »
- **Problème :** FR-8 reprend la recommandation (d) de §3, que §6 a explicitement abandonnée. Il contredit la règle de préséance du §0 du PRD. Il crée aussi deux conflits internes :
  - **avec FR-5 :** « Passer à Avec sans phase existante crée Phase 1 avec la durée de série courante ». Le développeur ne peut pas savoir si des phases « en réserve » comptent comme « existantes » ;
  - **avec FR-2 :** « Si des phases existent, Répétitions, À l'échec et Variables sont indisponibles ». Sous Sans avec des phases en réserve, ces options sont-elles disponibles ? Si oui, que devient la réserve quand l'utilisateur passe en Répétitions puis revient à Avec ?
- **Correction :** remplacer la 5e puce par la règle de §6 : sous Sans, les phases sont retirées du brouillon et leur somme devient la durée de série, modifiable. Revenir à Avec crée une seule phase à la durée courante, sans mémoire des anciennes. Seul ✕ restaure la configuration antérieure. FR-2 et FR-5 deviennent alors cohérents sans autre modification.

---

## 2. Haute

### H-1 — FR-3 rétablit le blocage des phases à zéro abandonné par §6 ; FR-5 et FR-9 décrivent deux mécanismes incompatibles [SD]

- **Emplacement :** FR-3, 3e puce ; FR-5, 2e puce ; FR-9 ; FR-1.
- **Citations :**
  - FR-3 : « La somme est comprise entre 1 et 3 535 s (FR-45). Une somme hors bornes rend la validation (✓) indisponible » ;
  - FR-9 : « les phases à 0 s sont retirées, sans message ni blocage ; […] une liste vide ou entièrement nulle revient à « Aucune » » ;
  - FR-5 : « « Phase 1 » est créée à renseigner : fond rouge pâle, ✓ indisponible ».
- **Problème :** une somme nulle est « hors bornes ». Selon FR-3, ✓ est donc indisponible. La normalisation de FR-9, qui se déclenche « au ✓ », ne peut alors jamais s'appliquer à une liste entièrement nulle. On retombe sur la recommandation (e), que §6 et la note de FR-9 déclarent abandonnée. FR-5 va dans le même sens : il rend ✓ indisponible pour une phase non renseignée, là où la spécification des phases (§2.2) la retire à la validation, puis applique la complétude existante. Le développeur doit choisir l'ordre :
  - option a : bornes, puis normalisation ;
  - option b : normalisation, puis bornes de la cible résultante.

  Il doit aussi décider si « ✓ indisponible » signifie un bouton désactivé ou un ✓ pressé puis refusé. Enfin, FR-1 dit que « le zéro n'existe que dans le brouillon ». Une phase « à renseigner » est-elle à 0, ou sans valeur ? Selon la réponse, FR-9 la retire, ou non.
- **Correction :** préciser que la borne 1..3 535 s s'applique à la somme **après** normalisation (§6 : « Si la cible reste absente ou invalide, la validation existante s'applique »). Seule une somme supérieure à 3 535 s, ou l'absence de durée de série une fois revenu à « Aucune », rend ✓ indisponible. Aligner FR-5 sur ce mécanisme, et dire si « à renseigner » vaut 0 s ou sans valeur.

### H-2 — Le §7 n'énumère pas plusieurs changements de comportements PRE-4 validés que des FR exigent, alors que NFR-1 et NFR-8 les interdisent [SD]

- **Emplacement :** §7 (« Seuls ces remplacements sont admis ») ; NFR-1 (« Les seuls remplacements admis sont ceux du §7 ») ; NFR-8.
- **Changements exigés sans R correspondant :**
  - **FR-26 :** la Feuille, validée en PRE-4 sous la forme d'un seul groupe, est découpée en quatre cadres. L'ordre des lignes change (Mode et Condition d'arrêt passent dans Exécution ; Phases passent en tête de Séries) ;
  - **FR-37 :** `Terminer` est abaissé, alors que sa position a été validée en PRE-4 ;
  - **FR-38 :** des écarts E-V1 à E-V16 sont corrigés, alors que Q48 en avait arbitré certains en PRE-4 (voir H-3) ;
  - **FR-21 :** la ligne de cible commune est masquée à l'échec. R-09 et R-10 ne retirent que l'**option** des roues ;
  - **FR-28 :** le `DisclosureControl` indépendant (`Sheet:1538-1552`) est remplacé par des chevrons intérieurs. R-03 ne couvre que Variables ;
  - **FR-29 :** le fond blanc sans contour des tableaux n'est pas couvert. R-06 ne vise que la hauteur ;
  - **FR-33 :** l'invite et l'état vide de la Description changent. R-13 couvre-t-il l'invite ?
- **Problème :** lus littéralement, NFR-1 et NFR-8 interdisent FR-26, FR-37, FR-38 et FR-21. Un relecteur ou un développeur prudent bloquerait ces stories, ou les accepterait en violant une NFR.
- **Correction :** ajouter les remplacements manquants, par exemple R-18 « un groupe → quatre cadres », R-19 « position de Terminer », R-20 « ligne de cible commune masquée à l'échec », R-21 « DisclosureControl → chevron intérieur ». Chacun doit citer sa source (D-413, cadrage l. 27, D-419, D-410). Ou bien reformuler NFR-1 et NFR-8 : « remplacements du §7 et changements de présentation explicitement exigés par un FR sourcé ».

### H-3 — FR-38 tranche implicitement Q48 alors que §9 le déclare « non décidé » ; « Aucune question produit nouvelle » est inexact [DP]

- **Emplacement :** FR-38 ; §9, en-tête et « Point signalé ».
- **Citations :** FR-38 : « Les écarts E-V1 à E-V16 retenus sont corrigés. » §9 : « **Aucune question produit nouvelle.** » puis « **Point signalé, non décidé : Δ06 et Q48.** »
- **Problème :** « retenus » ne dit ni par qui, ni lesquels. En PRE-4, Q48 a arbitré écart par écart, et certains écarts ont été conservés volontairement (grille D-327, libellé « Retour »). FR-38 ne permet pas d'écrire de critères d'acceptation. Le développeur devrait décider lui-même quels écarts corriger. Le §9 se contredit : il n'annonce aucune question, puis il en signale une. Les constats H-5, H-6, H-8, M-7, M-9 et M-13 montrent d'autres points à arbitrer.
- **Correction :** lister les écarts E-V à corriger, ou bien poser explicitement la question à Hermann avant la story 4.1. Remplacer « Aucune question produit nouvelle » par la liste des points ouverts.

### H-4 — FR-42 garantit les 276 phrases intactes alors que FR-18 et R-16 modifient les phrases bilatérales [SD]

- **Emplacement :** FR-42, dernière puce ; FR-18 ; R-16 ; FR-43 (« Sans phases, la Phrase ne change pas »).
- **Citations :** FR-42 : « Les 276 phrases sans charge restent intactes. » R-16 : « Phrase « côté droit puis le gauche » → « côté 1 / côté 2 » ».
- **Problème :** une partie des 276 cas est bilatérale et change par FR-18. Le test de non-régression du corpus ne peut pas être à la fois « intact » et « mis à jour ». Le développeur ne sait pas quel test faire passer.
- **Correction :** « Les 276 phrases sans charge ni phases restent intactes, sauf la clause de côté des cas bilatéraux, mise à jour par FR-18 (S-3). » Indiquer si la mise à jour du corpus est une story distincte.

### H-5 — Condition d'arrêt : résultat dérivé incomplet et transitions entre types de série non définies (FR-19 / FR-20) [DP]

- **Emplacement :** FR-19 ; FR-20, tableau et 2e puce.
- **Citations :** FR-20 : « Une cellule vide n'est pas comptée. Un tableau incomplet suit la convention des résultats calculés incomplets (D-384). »
- **Problèmes :**
  1. **Les deux phrases s'excluent.** Prenons [échec, vide]. Si le vide « n'est pas compté », toutes les cellules comptées sont à l'échec : résultat « À l'échec ». Si le tableau est « incomplet » (D-384), le résultat est « — » ou rien. Que montre la ligne quand **toutes** les cellules sont vides : deux options sans sélection, « — », ou rien ?
  2. **Variables → identiques avec [10, échec, 12].** Quelle Condition d'arrêt la ligne affiche-t-elle ensuite, et quelle cible commune s'applique ? FR-19 ne le dit pas. FR-11 renvoie aux « opérations du brouillon » sans le préciser pour la cible.
  3. **Identiques à l'échec → variables.** Toutes les lignes passent-elles à `FAILURE` ? FR-20 affiche-t-il alors « À l'échec » ?
- **Correction :** dire si [échec, vide] donne « À l'échec » ou l'état incomplet, et décrire le rendu du cas tout vide **[DP]**. Pour 2 et 3, citer la règle PRE-4 de changement de type de série, si elle existe, et la reprendre telle quelle **[SD]**. Sinon, poser la question **[DP]**.

### H-6 — Cadence : « l'option reflète la valeur » est incompatible avec « Autre » quand la valeur vaut 0, 1, 2 ou 5 (FR-30) [DP]

- **Emplacement :** FR-30.
- **Citations :** « l'option sélectionnée reflète la valeur courante » ; « Autre révèle le mécanisme ± existant : 0 à 10 » ; « Sans puis Autre ne restaure rien ».
- **Problème :** si Autre est choisi depuis Sans et ne restaure rien, la valeur reste 0. Puisque l'option reflète la valeur, c'est Sans qui est sélectionné, pas Autre : le stepper ne s'ouvre jamais. De même, sous Autre, le ± peut atteindre 5, 2, 1 ou 0. La sélection saute-t-elle alors vers « 5 s », et le ± disparaît-il pendant la manipulation ? CA-01 renvoie lui-même « au contrôle existant ou à sa référence Figma, sans inventer un nouvel état ». Le PRD ne reprend pas ce renvoi.
- **Correction :** fixer la valeur prise en choisissant Autre et le comportement quand ± atteint une valeur rapide **[DP]**. Une option simple : Autre reste sélectionné tant que le ± est ouvert ; le reflet ne s'applique qu'à l'ouverture de la Feuille. Citer CA-01 et la frame Figma de référence.

### H-7 — FR-24 : « le tableau reste entièrement visible au-dessus du clavier » est irréalisable, et la fermeture du clavier décimal n'est pas définie [DP]

- **Emplacement :** FR-24, 2e et 3e puces ; FR-32.
- **Citations :** « le tableau reste entièrement visible au-dessus du clavier, avec la marge de la frame `9292:18077` » ; « le clavier décimal se ferme sans touche Retour ».
- **Problèmes :**
  1. **Visibilité.** Le tableau variable peut compter jusqu'à 99 lignes (`seriesCount.max = 99`, `EP:81`). Six phases s'y ajoutent, et FR-32 prévoit le défilement. Avec le clavier, la Feuille et quatre cadres, l'exigence n'est ni réalisable ni testable au-delà de quelques lignes. La frame illustre un cas à trois séries.
  2. **Fermeture.** « Sans touche Retour » dit ce qui n'existe pas, pas comment le clavier se ferme : bouton « OK » dans la barre Précédent/Suivant, toucher hors du champ, ou les deux ? Le développeur devrait choisir une interaction visible.
- **Correction :** remplacer 1 par « la cellule active et sa ligne restent visibles au-dessus du clavier avec la marge Figma ; le reste du tableau défile ». C'est corrigeable sans décision si Hermann accepte cette lecture. Pour 2, fixer le geste de fermeture **[DP]**, en privilégiant la primitive native (NFR-1).

### H-8 — Charge : transitions entre types de série, zéro et passage automatique à Sans non définis (FR-11 / FR-14) [DP]

- **Emplacement :** FR-11 ; FR-14, « Zéro » ; FR-13 ; FR-25.
- **Citations :** FR-14 : « En séries identiques, zéro désactive la charge » ; « Si toutes les séries passent à zéro, l'Exercice passe à Sans. » FR-11 : « Elle est traitée comme les autres valeurs de la série. […] Aucune propagation automatique particulière. »
- **Problèmes :**
  1. **Variables [0 ; 20 ; 15] → identiques.** Si la règle existante reprend la première ligne, la charge commune vaut 0. Par FR-14, la charge devient Sans. Une charge réelle disparaît par simple changement de type. Est-ce voulu ?
  2. **Moment du passage à Sans.** Quand la dernière cellule passe à 0, le passage se fait-il à la frappe, à la sortie du champ ou au ✓ ? Avec FR-13 (« Sans masque la colonne ») et FR-25 (navigation clavier), la colonne pourrait disparaître sous la cellule focalisée.
  3. **Identiques → variables avec une charge Sans conservée.** Les lignes reçoivent-elles la valeur commune conservée ? D'éventuelles valeurs par ligne mises en réserve (Q29) l'emportent-elles ?
- **Correction :** fixer le moment, par cohérence avec l'arrondi : « à la sortie du champ ou à la validation ». C'est corrigeable sans décision si l'on reprend CH-05. Pour 1 et 3, citer la règle PRE-4 de conversion de type de série appliquée à la cible, puis demander à Hermann si la conséquence « commune à 0 → Sans » est acceptée **[DP]**.

---

## 3. Moyenne

### M-1 — FR-45 applique « minimum et pas de 1 s » à la Durée de l'exercice, qui n'est pas une saisie libre (FR-31, Q46) [SD]

- **Emplacement :** FR-45, 1re phrase ; FR-31 ; FR-3.
- **Citation :** « durée de série, durée de phase, durée de l'exercice et toute autre durée de ce type ».
- **Problème :** la Durée de l'exercice est un résultat calculé, T = N × (D + P), inversé par N seulement (FR-3). Sa roue propose les valeurs T(1) à T(99) (Q46), pas un pas de 1 s. Lu littéralement, FR-45 changerait ce mécanisme, ce que FR-45 exclut lui-même (« Les règles de calcul […] ne changent pas »). Δ50 dit « exercice ». Il faut préciser l'effet : seul T(1) peut maintenant valoir moins de 5 s, par l'effet de D ≥ 1.
- **Correction :** « Pour la Durée de l'exercice, le minimum découle de D ≥ 1 s ; la roue T(1)..T(99) est inchangée. »

### M-2 — FR-45 : périmètre non énumérable (« etc. », « toute autre durée de ce type ») et pas des durées à zéro autorisé ambigu [SD]

- **Emplacement :** FR-45, 1re puce et 1re phrase.
- **Citations :** « Toute durée strictement positive a un minimum de 1 s et un pas de réglage de 1 s » ; « Zéro reste autorisé là où il l'était déjà : Pause, Compte à rebours, Fin, etc. »
- **Problème :** en citant Pause, Compte à rebours et Fin, la phrase les fait entrer dans le périmètre de la règle. Leur pas de réglage passe-t-il à 1 s ? Ces lignes sont pourtant déclarées NR (Δ38), avec leurs steppers inchangés. « etc. » n'est pas testable. Le rapport `propagation-borne-1s.md`, cité par `table-delta.md` Δ50, est introuvable dans le clone (recherche sur `C:\Dev\KODJO-BMAD-PRE5`, hors `node_modules`).
- **Correction :** énumérer les champs concernés (cible Durée commune et par cellule, phase) et ceux qui ne le sont pas (Pause, Pause entre les côtés, Compte à rebours, Fin, Cadence : bornes et pas inchangés). Joindre ou citer le rapport de propagation.

### M-3 — R-17 et FR-45 décrivent un « pas de 5 s » que PRE-4 a déjà supprimé [SD]

- **Emplacement :** R-17 ; FR-45 (« Le minimum et le palier de 5 s sont supprimés ») ; addendum, « Bornes minimales des durées ».
- **Fait de code :** `EP:82-88` : « Décision Q36 de Hermann du 2026-10-17 (recette iPhone) : une durée n'est pas obligatoirement un multiple de 5 s ; le pas de 5 s de Q15 et P21 est levé » ; `durationTarget: { min: 5, max: 3535 }`.
- **Problème :** seul le minimum de 5 s subsiste. Un développeur pourrait chercher un pas de 5 s ailleurs (roues, steppers) et toucher des comportements NR. R-17 décrit mal l'état PRE-4 remplacé.
- **Correction :** R-17 : « minimum de 5 s (le pas de 1 s est acquis depuis Q36) → minimum de 1 s ». Demander à l'architecture de confirmer qu'aucune roue de durée ne garde un pas de 5 s.

### M-4 — Durée de phase : maximum de la roue et retour visuel d'une somme supérieure à 3 535 s non définis (FR-7, FR-3) [SD]

- **Emplacement :** FR-7, 3e puce ; FR-3.
- **Citation :** « aucune borne propre à la phase en dehors de celle de la somme ».
- **Problème :** une roue a un maximum. Est-ce 3 535 s, ou 3 535 moins la somme des autres phases (borne dynamique) ? Si c'est 3 535, la somme peut dépasser la borne, et ✓ devient indisponible sans signal : le fond rouge pâle de Q35 signale une valeur **manquante**, pas une valeur hors bornes. La décision v2 note d'ailleurs que l'application exacte de 3 535 à une somme « reste à formaliser ».
- **Correction :** choisir l'option qui n'invente pas de règle, sans doute le maximum dynamique (3 535 moins les autres phases). La somme ne peut alors jamais dépasser 3 535, et il n'y a plus de cas d'erreur à signaler. À défaut, préciser le signal d'erreur.

### M-5 — Condition d'arrêt : changement de Mode et absence de « dernière valeur chiffrée » [SD]

- **Emplacement :** FR-19 ; addendum Q-A6.
- **Citations :** « Le choix s'applique à toutes les séries, selon le Mode » ; « Revenir à À la cible restaure la dernière valeur chiffrée connue pendant l'édition ».
- **Problèmes :**
  - **Changement de Mode.** La Condition d'arrêt est-elle propre à chaque Mode (cibles typées par Mode, `TargetsByMode`) ou commune aux deux ? À l'échec en Durée, puis passage en Répétitions : la ligne reste-t-elle À l'échec ? Selon `table-delta.md` Δ25, `targetFor` renvoie aujourd'hui la `FAILURE` telle quelle (`Draft:401-402`). La réponse existe donc peut-être, mais le PRD ne la cite pas ;
  - **Absence de valeur.** Un Exercice enregistré à l'échec puis rouvert n'a aucune valeur chiffrée connue. Que montre À la cible : « — » avec le fond rouge pâle ? « Pendant l'édition » désigne-t-il la Feuille ou l'éditeur ?
- **Correction :** citer le comportement PRE-4 de `setMode`/`targetFor` comme conservé. Préciser qu'en l'absence de valeur connue, la cible est `UNSET` et que la validation existante s'applique.

### M-6 — FR-42 affiche une charge nulle, que FR-10 interdit d'afficher « 0 kg » [SD]

- **Emplacement :** FR-42, 2e puce ; FR-10, 4e puce ; FR-14, « Zéro ».
- **Citations :** FR-42 : « Une charge nulle d'une série est affichée. » FR-10 : « L'absence de charge se lit Sans, jamais 0 kg. »
- **Problème :** en variables, une série à 0 signifie « sans charge pour cette série » (FR-14). FR-42 l'affiche, donc « 0 kg » dans la Phrase. FR-10 l'interdit. Le développeur ne sait pas quel test écrire. Il ne sait pas non plus ce que montre la cellule à 0 dans le tableau : « 0 », « 0 kg », vide ou « Sans » ?
- **Correction :** restreindre FR-10 à l'activation (« L'Exercice sans charge se lit Sans, jamais 0 kg »), confirmer que la Phrase écrit « 0 » dans la liste des charges variables (D-422/423), et dire ce qu'affiche la cellule.

### M-7 — Phrase : ordre des clauses quand la charge et les phases coexistent [DP]

- **Emplacement :** FR-42 (« après la valeur par série ») ; FR-43 (« Après la durée de série, une parenthèse »).
- **Problème :** les deux clauses visent le même point d'insertion. Avec des phases et une charge (cas permis : identiques, Durée, À la cible), l'ordre n'est pas fixé. Faut-il écrire « 3 séries de 9 s (Descente : 6 s - Maintien : 3 s) avec une charge de 20 kg, avec une pause… » ou l'inverse ? Ni la ponctuation ni le corpus ne sont fixés. CH-08 laisse « le positionnement exact du groupe de mots » à intégrer.
- **Correction :** donner une phrase de référence pour le cas combiné et l'ajouter au corpus.

### M-8 — Anciennes descriptions : comportement observable non défini ; SM-3 contredit FR-35 [SD]

- **Emplacement :** FR-35 ; SM-3 ; NFR-10.
- **Citations :** FR-35 : « L'ancien texte n'est réutilisé que si les mécanismes disponibles le permettent simplement. » SM-3 : « une donnée PRE-4 relue après PRE-5 ne perd ni ne change aucun paramètre ».
- **Problème :** « si […] simplement » laisse le résultat au jugement du développeur. Un Exercice PRE-4 rouvert peut montrer son ancien texte en étape 1, découpé, ou rien du tout. S'il ne montre rien, le premier `Terminer` sans modification efface-t-il l'ancien texte ? La détection de modification de FR-34 se déclenche-t-elle à l'ouverture ? Les copies en Séance sont-elles touchées ? SM-3, lu seul, interdit toute perte, alors que FR-35 tolère celle de la description.
- **Correction :** demander à l'architecture (Q-A5) de fixer le résultat observable, et l'écrire dans FR-35 : au minimum, pas de plantage et pas d'effacement silencieux d'un Exercice non modifié. Ajouter à SM-3 « hors descriptions (FR-35) ».

### M-9 — Description en étapes : gestes non définis (FR-33) [DP]

- **Emplacement :** FR-33.
- **Problèmes :**
  - **Entrée au milieu d'un texte :** coupe-t-elle l'étape, ou crée-t-elle une étape vide après ?
  - **Entrée sur une étape vide :** crée-t-elle une nouvelle étape vide, ou ne fait-elle rien ?
  - **Retour arrière au début d'une étape non vide :** fusion avec l'étape précédente, ou rien ?
  - **Collage d'un texte multiligne :** une étape, ou plusieurs ?
  - **« Étape suivante » :** est-ce l'invite de l'étape vide qui vient d'être créée, ou une ligne fantôme permanente sous la dernière étape ? Le registre v25 parle de « Ligne d'invitation ».
- **Correction :** fixer chaque cas. Les réponses les plus simples, compatibles avec QP5-02, sont : coupure au curseur, aucune nouvelle étape vide après une étape vide, fusion au retour arrière, collage en une seule étape. Elles restent à valider par Hermann.

### M-10 — Étapes : détection de modification et compatibilité de la limite de 1 000 avec le CHECK [SD]

- **Emplacement :** FR-34 ; addendum Q-A5.
- **Problèmes :**
  - **Détection de modification.** Une étape vide créée par Entrée, puis abandonnée, rend-elle l'éditeur « modifié » ? Il faut comparer des listes normalisées (vides retirées) ;
  - **Limite et CHECK.** La limite porte sur les textes, numérotation exclue. Si l'encodage stocké dans `instruction` (`CHECK ≤ 1000`, `migration010.ts:548`) ajoute des séparateurs, un texte de 1 000 caractères répartis sur plusieurs étapes dépasse le CHECK. La limite produit deviendrait alors inférieure à 1 000, ce qui suppose une décision.
- **Correction :** préciser que la comparaison porte sur la liste normalisée. Demander à Q-A5 de garantir 1 000 caractères de texte en plus des séparateurs, ou de signaler l'écart à Hermann.

### M-11 — Phases : « Aucune » ou Sans, et disparition de l'annulation à la suppression de la dernière phase (FR-8) [SD]

- **Emplacement :** FR-8, 2e et 4e puces ; FR-4 ; glossaire « Phase ».
- **Problème :** FR-4 décrit un segmenté Avec / Sans, alors que FR-8 et FR-9 parlent de « ramener la ligne à « Aucune » ». Supprimer la dernière phase sélectionne-t-il Sans, et le tableau se replie-t-il ? Si oui, le bandeau « supprimée — Annuler » (FR-4 : « suppression avec annulation ») disparaît avec le tableau, et l'annulation promise par FR-8 (4e puce) devient impossible pour ce cas.
- **Correction :** poser « Aucune » ≡ Sans sélectionné. Préciser que le bandeau d'annulation reste affiché après la suppression de la dernière phase, ou que l'annulation n'est pas offerte dans ce cas.

### M-12 — « Phase 1 » : libellé réel ou invite ? [SD]

- **Emplacement :** FR-5, 1re puce ; FR-9, 2e puce ; spécification des phases §2.2.
- **Citation :** « crée « Phase 1 » avec la durée de série courante ».
- **Problème :** la spécification crée une ligne au **libellé vide**, remplacé par « Phase n » à la validation, selon la position finale. Si « Phase 1 » est un vrai libellé, une phase déplacée en position 2 garde le texte « Phase 1 », ce qui contredit l'esprit de FR-9. Pour une phase ajoutée, FR-5 ne dit rien du libellé.
- **Correction :** « crée une phase au libellé vide (invite « Phase n ») » ; même règle pour l'ajout.

### M-13 — Charge : champ vide à la sortie, cellule focalisée à l'activation, emplacement du champ en identiques [DP]

- **Emplacement :** FR-12 ; FR-13 ; FR-14, « Activation ».
- **Problèmes :**
  - **Champ vidé à la sortie :** vaut-il zéro (donc Sans), restaure-t-il la valeur précédente, ou remet-il 0,25 ?
  - **Première activation en variables :** quelle cellule reçoit le focus quand « la saisie s'ouvre » ?
  - **Champ en identiques :** « la valeur remplace Avec » place-t-elle le champ de saisie **dans** l'option du segmenté (FR-27), ou dans une cellule à côté ? Le rendu relève du relevé S-2 (« cellule de charge en saisie ») et la spécification v3 note que cet état n'est pas dessiné.
- **Correction :** fixer le champ vide (proposition : restauration de la valeur précédente) et la cellule focalisée (proposition : la première) **[DP]**. Renvoyer explicitement l'emplacement à S-2.

### M-14 — Précédent / Suivant : les « conventions de focus existantes » n'existent pas (FR-25) [SD]

- **Emplacement :** FR-25, 5e puce ; Δ49.
- **Citation :** « Aux extrémités et sur les cellules indisponibles, le comportement suit les conventions de focus existantes ».
- **Problème :** le code ne contient aucun `TextInput` dans la Feuille ni aucun `keyboardType` (Δ11, Δ20). Il n'existe donc aucune convention à suivre. En identiques, il n'y a qu'un champ de charge : Précédent et Suivant y sont-ils affichés, et désactivés ?
- **Correction :** « Aux extrémités, Précédent ou Suivant est désactivé, comme sur iOS ; avec un seul champ, les deux sont désactivés ; il n'y a pas de boucle. »

### M-15 — Changement de côté : valeur par défaut et persistance des valeurs masquées (D-249) [SD]

- **Emplacement :** FR-15 ; FR-10, 3e puce ; `table-delta.md` Δ14 (« D-249 (non-persistance des variantes cachées, hors charge) »).
- **Problèmes :**
  - **Valeur par défaut.** FR-12 et FR-19 donnent leur valeur par défaut, pas FR-15. « Un côté non renseigné est normalisé à Sans » suppose un troisième état, alors que le segmenté n'a que deux options ;
  - **Persistance.** Sous Sans, l'Enchainement et la Pause entre les côtés sont « conservés ». Le sont-ils seulement dans le brouillon, ou aussi après enregistrement ? D-249 dit que les variantes cachées ne sont pas persistées. La charge en est exceptée (FR-10), mais cette exception à D-249 n'est écrite nulle part dans le PRD.
- **Correction :** donner la valeur par défaut d'un nouvel Exercice (Sans, selon D-406). Préciser la persistance des valeurs masquées des côtés en citant D-249. Écrire l'exception de la charge à D-249.

### M-16 — Phrase des charges variables : forme au-delà de trois valeurs ambiguë (FR-42) [SD]

- **Emplacement :** FR-42, 1re puce.
- **Citation :** « Au-delà de trois valeurs, elle prend la forme « (charges : 20, 12 kg, ...) » ».
- **Problème :** l'exemple montre deux valeurs, puis « ... ». Combien de valeurs sont listées avant la troncature ? Quelle forme pour une à trois valeurs ? Que se passe-t-il quand toutes les charges sont égales en variables ?
- **Correction :** citer D-422 et D-423 mot pour mot, et ajouter un exemple par cas au corpus.

---

## 4. Basse

| # | Emplacement | Citation | Constat | Indication |
|---|---|---|---|---|
| B-1 | FR-1 ; FR-6 | « de 1 à 20 caractères après normalisation » | La « normalisation » (espaces de bord ? espaces répétés ?) et l'unité de compte (caractères visibles, ou unités UTF-16 comme `maxLength`) ne sont pas définies. | [SD] |
| B-2 | FR-14 | « Le séparateur suit la langue de l'interface » ; « Une valeur négative est refusée, selon le comportement standard des champs numériques » | Le pavé décimal iOS affiche le séparateur de la **région**, pas de la langue de l'app : il faut accepter « , » et « . ». Le pavé n'a pas de signe moins, et le projet n'a aucun « champ numérique standard ». | [SD] |
| B-3 | FR-10 | « sans plafond » | Un nombre de chiffres maximal est nécessaire pour l'affichage (cellule, Phrase) et le stockage. Il s'agit d'une limite technique, pas d'un plafond métier. | [SD] |
| B-4 | FR-31 | « Si la ligne est absente » | Le cas d'absence n'est pas défini. DU-01 indique notamment les Exercices ouverts depuis une Séance. | [SD] |
| B-5 | FR-27 ; NFR-1 | « réutilisent le `SegmentedControl` existant » / « Quand une primitive native iOS existe […] elle est utilisée » | Tension apparente : un segmenté natif existe. QP5-06 tranche, mais FR-27 doit se déclarer exception à NFR-1. | [SD] |
| B-6 | FR-7, FR-27, FR-36, FR-40 ; NFR-2, NFR-3, NFR-9 | `DurationWheelPicker` dans `AnchoredPanel`, `computeExercisePlanDuration`, « CHECK de la base », numéros de ligne de tests | Ces choix techniques, noms de composants et lignes de code sont dans le PRD, alors que le §0 les réserve à l'addendum. C'est défendable pour la réutilisation, mais les numéros de ligne (`:371`, `:260`) vieilliront. | [SD] |
| B-7 | FR-23 | « La fenêtre intermédiaire « Charge — Série 1 » est supprimée » | Cette fenêtre n'existe pas dans le code (Δ18 : « Aucune ligne Charge »). Il faut dire qu'elle n'est **pas créée**, puisqu'elle n'existe que dans une capture. | [SD] |
| B-8 | FR-29 | « La cible tactile des lignes de 36 est vérifiée sur appareil avant toute autre géométrie » | Consigne de méthode, non testable comme exigence. Elle ne dit pas que faire si la vérification échoue (repli sur 44 ? question à Hermann ?). | [SD] |
| B-9 | §8, « Clavier » | « il n'est étendu à aucune autre valeur que la charge et le libellé de phase » | La Description (FR-33) utilise aussi le clavier. Il faut préciser « dans la Feuille ». | [SD] |
| B-10 | §10, SM-1 | « lot Feuille (FR-1 à FR-32) et […] lot Éditeur (FR-33 à FR-38) » | FR-18 (Composition, Phrase) et FR-39 à FR-45 (Phrase visible sur la Carte, copies, bornes sur la roue) ne sont rattachés à aucun lot de recette. | [SD] |
| B-11 | §0 | « lignes **Δ01 à Δ49** » | Δ50 existe et fonde FR-45. | [SD] |
| B-12 | Addendum, Q-A6 ; vérifications | « dans le brouillon seulement (`TargetsByMode`), sans persistance ? » ; « selon l'inventaire » | La question oriente la réponse, alors que l'addendum dit qu'« aucune réponse n'est présupposée ». La vérification des bornes s'appuie sur un rapport de propagation absent du clone. | [SD] |
| B-13 | FR-6 | — | Le rôle de la touche Retour du clavier texte (fermer, ou passer au libellé suivant) n'est pas défini pour le libellé de phase. | [SD] |

---

## 5. Points vérifiés sans constat

- **Exclusions du §8 :** formats, exécution, troisième Mode, condition Mixte, refonte de la Composition. Aucune FR ne les contredit. FR-18 et FR-41 restent aux points de passage.
- **Annexe de couverture :** les lignes Δ01 à Δ50 sont toutes rattachées. Δ15 est sans objet, Δ07, Δ24, Δ30, Δ38 et Δ47 sont NR.
- **FR-45 et Δ50 :** le minimum de 1 s, le maximum de 3 535 s et la somme 1..3 535 s sont correctement repris dans FR-3, FR-7 et FR-45. Les réserves portent sur la portée (M-1 à M-4).
- **FR-17 :** conforme à QP5-07 (libellés, police, N > 1, frame `8328:38193` non bloquante).
- **FR-14 :** conforme à CH-05 (arrondi supérieur à la sortie du champ, 0,25 initial, réactivation).
- **Addendum :** il ne tranche aucune question d'architecture. Q-A1 à Q-A7 couvrent les choix laissés ouverts par le PRD.

## 6. Décisions à demander à Hermann

1. **H-3 :** quels écarts E-V1 à E-V16 corriger (Q48).
2. **H-5 :** affichage de la Condition d'arrêt pour un tableau incomplet ou vide, et règle de passage de Variables à Identiques si aucune règle PRE-4 n'existe.
3. **H-6 :** valeur prise et état de « Autre » dans la Cadence.
4. **H-7 :** geste de fermeture du clavier décimal ; acceptation de la lecture « ligne active visible ».
5. **H-8 :** charge commune à 0 après passage Variables → Identiques ; valeurs reprises à l'inverse.
6. **M-7, M-9, M-13 :** phrase avec charge et phases ; gestes d'édition des étapes ; champ de charge vidé à la sortie.
