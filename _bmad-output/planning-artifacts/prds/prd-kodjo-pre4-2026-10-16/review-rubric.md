# Revue qualité du PRD — PRE-4 : Finalisation de l'éditeur Exercice et cible À l'échec par série

> Historique — revue interne du 2026-10-16, antérieure à la revue ChatGPT ; non mise à jour.

Revue faite le 2026-10-16 selon `.claude/skills/bmad-prd/assets/prd-validation-checklist.md`, sur `prd.md` (2 761 lignes, 194 FR) et `addendum.md`. Sources de contrôle : `docs/preparation/PRE-4/bmad/questions-ouvertes.md` et `extracts/code-depart.md`. Cette revue est une validation interne par la grille BMad. **Ce n'est pas la revue indépendante ChatGPT** exigée par `CLAUDE.md`.

## Verdict global

Le PRD est solide sur l'essentiel. La thèse est nette : « À l'échec » devient un type de Cible par Série. Presque chaque conséquence est testable, avec une valeur exacte et une source ; les montants de durée recalculés (R01 105 s, R02 74 s, cas A à D, 761 s du cas 144…) sont tous justes. Chaque renvoi Q, P et H se résout dans `questions-ouvertes.md`. Deux points font courir un risque à la suite (architecture, stories, revue ChatGPT) :
- deux contradictions internes à fort effet : la règle de non-remplacement (NFR-03) face aux remplacements de contrôles PRE-3 que le PRD exige, et le Bip « par Série » des FR de données face au Bip commun ;
- une zone non tranchée : l'enregistrement, sans modification, d'un Exercice qui porte une valeur historique hors bornes.

À cela s'ajoute une dette de lisibilité : quatre notations de citation, la collision « P3 », des littéraux dont l'apostrophe varie, et des exigences en double d'une section à l'autre. Elle ne fausse pas le produit, mais elle rendra l'extraction des stories plus coûteuse et plus sujette à erreur.

## Aptitude à la décision — adéquat

Les décisions sont énoncées comme telles et rattachées à leur arbitre : Q8 et Q11 à Q21 pour Hermann, P1 à P38 pour les règles de priorité. Les renoncements sont presque toujours nommés. Les blocs « Non repris » de chaque section disent ce qui a été écarté et pourquoi (par exemple FR-03-11 : « sans seconde validation » de `[08]:1573` remplacé par Q12). Q19 assume la perte des Exercices illisibles et en tire toutes les conséquences (FR-18-20, NFR-05, NFR-07, SM-2). La règle P33 donne aussi une sortie honnête au conflit entre le rendu natif et les valeurs du DSF.

Deux tensions majeures restent toutefois esquivées. La première : NFR-03 interdit de remplacer un composant déjà accepté en PRE-3, alors que le PRD remplace le `Switch` natif « Séries variables », les `SegmentedControl` (Mode, côtés) et les steppers en ligne de la Feuille PRE-3 (`extracts/code-depart.md`, `ExecutionParametersSheet.tsx:412-685`). La seconde : le PRD exige un « popover ancré » au mécanisme natif, roulette comprise avec ses propres ✕/✓ (FR-03-10, FR-03-11), sans dire quoi faire si aucune primitive native ne fournit ce mécanisme sur iPhone.

### Constats
- **[high]** Contradiction non arbitrée entre NFR-03 et les remplacements exigés (§5.1 NFR-03 ; FR-03-07, FR-04-01, FR-07-03, FR-03-05) — NFR-03 dit : « Un composant ou une primitive déjà acceptés en PRE-3 ne sont pas remplacés ». Or le PRD supprime le `Switch` natif (« Aucun interrupteur "Séries variables" »), remplace le segmenté de Changement de côté par un popover (« jamais par un segmenté ») et remplace le stepper Répétitions par une roulette. Un agent de développement qui applique AGENTS.md à la lettre peut bloquer, ou au contraire invoquer FR-03-07 pour justifier d'autres remplacements. *Correction :* préciser dans NFR-03 que la règle vise la réimplémentation d'un mécanisme accepté. Les changements de contrôle décidés par ED-03, ED-04 et ED-07 (P9, P10, P11, Q8) sont des décisions produit explicites. Lister ces remplacements autorisés et nommer les composants conservés (`DurationWheelPicker`, `NumberWheelPicker` et leurs garde-fous zéro `ScrollView`).
- **[medium]** Aucune règle de repli si la primitive native du popover ancré n'existe pas (FR-03-10, FR-03-11, FR-22-03 Notes) — P33 couvre un écart de *rendu*, pas l'absence du *mécanisme* (popover ancré qui contient une roulette et ses ✕/✓). L'architecture tranchera sans critère produit. *Correction :* demander à Hermann la conduite à tenir et la noter en P ou en Q : feuille native, menu natif, ou signalement avant implémentation.

## Substance plutôt que mise en scène — solide

La vision (§1) est propre au produit : l'exemple « deux Séries de 10 et 12 répétitions, puis une Série menée jusqu'à l'échec » ne s'applique à aucun autre éditeur. Le PRD n'a pas de persona superflu : §2.3 dit qu'il n'y a qu'un rôle, et les quatre parcours suivent les quatre Parcours d'édition. Les NFR sont chiffrées et propres au produit : 44 × 44 pt (P30), largeurs 360/402/440, zéro `ScrollView` iOS, `migration001` intouchable. Aucune section d'innovation n'est plaquée. Rien à signaler.

## Cohérence stratégique — solide

Toutes les sections découlent de la thèse du §1. Le type de Cible (4.6) entraîne le Sélecteur (4.7 et 4.8), les calculs ≥ (4.13 et 4.14), la Phrase (4.16 et 4.17), puis la persistance et la migration (4.18). La portée est cohérente pour une tranche de finalisation brownfield. Les mesures de succès (§8) sont des critères d'acceptation, ce qui convient à un seul utilisateur. Les contre-mesures SM-C1 et SM-C2 visent précisément les deux dérives connues du projet : la suite verte prise pour une preuve, et le pixel Figma pris pour une règle.

### Constats
- **[low]** Le parcours UJ-1 décrit un retour impossible (§2.3 UJ-1) — « **Cas limite :** il *revient* au Mode Répétitions ». Or Hermann a commencé en Durée et n'a jamais été en Répétitions. *Correction :* écrire « il passe au Mode Répétitions ».

## Clarté de l'état « terminé » — solide

C'est le point fort du document. Les conséquences portent des valeurs exactes (bornes 5 à 3535 s, 1 à 100, N 1 à 99, Bip 0 à 10, contour `#FF8D28` de 1,5, opacité 45 %). Les phrases attendues sont littérales, avec leur apostrophe typographique, et les montants sont recalculés avec leur formule (tableau de FR-13-04, FR-14-03 Tv = 180 s → N = 5, FR-15-05 150 s). Les cas hors grille sont fermés par des exemples (Q21, P38 : « + depuis 7 s → 10 s ; − depuis 5999 s → 3535 s »). Il reste quatre trous testables, dont un important.

### Constats
- **[high]** Enregistrer sans modification un Exercice qui porte une valeur historique hors bornes n'est pas défini (FR-09-05, FR-18-06, FR-18-07, FR-18-14, FR-02-09, FR-03-03). Les FR se contredisent sur ce cas :
  - FR-18-06 refuse à l'écriture un Bip de 11 « sans correction silencieuse » ;
  - FR-09-05 et FR-18-14 conservent ces valeurs « tant qu'on ne les modifie pas » ;
  - FR-03-03 rend le ✓ indisponible si une Cible est « invalide ».

  Rien ne dit donc si un Exercice ancien avec une Cible de 5999 s, 150 répétitions ou un Bip de 11 peut être enregistré par `Terminer` après un simple changement de nom. Rien ne dit non plus si son ✓ de Feuille est disponible, ni comment s'affiche une donnée « Répétitions sans nombre ». Le cas est fréquent après la migration et touche directement les stories ED-09 et ED-18. *Correction :* ajouter une conséquence, éventuellement par une nouvelle règle P :
  - une valeur historique non modifiée est réenregistrable telle quelle et ne bloque ni ✓ ni `Terminer`, ou bien elle bloque, à choisir et écrire ;
  - FR-18-06 refuse seulement une valeur *nouvellement saisie* hors bornes ;
  - un exemple chiffré pour chaque cas.
- **[medium]** Le cas bilatéral « les deux côtés à chaque série » n'a pas de montant attendu (FR-15-03, 5e puce) — seul le travail connu est chiffré (« 2 × 30 = **60 s** ») ; les Pauses et PC ne sont pas donnés et le total n'est pas calculé (« toutes les Pauses réellement planifiées comptées une fois »). Seul le cas de contrôle « un côté après l'autre » est chiffré (105 s → 135 s). *Correction :* fixer Pi = 10 s et PC = 5 s, puis donner le total. Par la formule de FR-13-04 : 2 × 30 + 20 + 2 × 5 = 90 s, occurrence 90 − 10 + 40 = 120 s (≥).
- **[medium]** Les exigences de compatibilité ne sont pas vérifiables en l'état (FR-01-09, FR-12-07, FR-14-02 5e puce) — « Aucune règle de l'Éditeur ne rend impossible… » n'est pas une condition observable. Les conséquences de FR-12-07 (« mention discrète de son origine », « suppression locale indisponible ») supposent un état « N hérité » que PRE-4 ne sait pas produire, alors que la section affirme « FR-12-07 se vérifie sans parcours Composition nouveau ». *Correction :* reformuler en contrat vérifiable. Exemple : l'Éditeur accepte un indicateur « N imposé » en entrée et, dans ce cas, rend ± de N, la croix et l'Inversion du total indisponibles ; le test injecte cet indicateur. Ou bien classer ces FR en contrainte d'architecture, sans conséquence de recette.
- **[low]** Les délais sont donnés sans tolérance (FR-03-05, FR-09-04) — « ≈ 500 ms », « environ 2 s », « environ 4 s ». *Correction :* reprendre la valeur nominale de `[13]:4098` et dire si le test l'applique exactement ou avec une marge.
- **[low]** FR-18-10 décrit un comportement d'exécution hors périmètre — « chaque Série se termine par Suivant » relève du moteur (§6) et n'est pas vérifiable dans PRE-4. *Correction :* déplacer la phrase en note ou en compatibilité.

## Honnêteté du périmètre — solide

Le §6 (non-objectifs) et les blocs « Hors périmètre » par section font un vrai travail : Volumes, circuits, moteur, énumération des Pauses (P1), état « Série à l'échec » (P2). Les 21 hypothèses (H4 à H24) sont balisées `[ASSUMPTION]` et indexées au §10. Le §9 ne garde que Q9, non bloquant. La densité d'éléments ouverts est élevée pour un PRD qui doit autoriser le développement (21 H, 38 P), mais elle est assumée : §9.2 rend les H révocables par Hermann et ChatGPT. Quelques réserves restent cachées dans le corps du texte.

### Constats
- **[medium]** Des réserves ouvertes ne sont pas indexées :
  - FR-12-06 : « libellés relevés dans Figma, à confirmer au lexique » (`N séries` / `1 série`). C'est un libellé lu sur une capture, et il n'a ni H ni P ;
  - FR-20-06, notes : « La barre de couleurs… semble compter plus de 12 cases… à vérifier visuellement » ;
  - FR-16-02 (H9) : « À vérifier sur Figma 8470:13303 ».

  *Correction :* créer une H pour chacune (ou les rattacher à H9) et les reporter au §10.
- **[low]** Des exigences restent conditionnelles alors que le code de départ est connu (FR-19-08, FR-21-02, FR-21-53) :
  - FR-21-02 : « Retirer ou réordonner un Média, si le code de départ le permet », alors que FR-21-50 teste un « réordonnancement » sans condition ;
  - FR-21-53 : vise « une Séance », alors que P36 et `code-depart.md` §5 constatent l'absence de duplication de Séance.

  *Correction :* trancher à partir de `extracts/code-depart.md` (`ActivityMediaList`, `duplicateActivity`), puis retirer la condition ou marquer explicitement la conséquence « sans objet ».

## Utilisabilité en aval — adéquat

Les points forts : les ID FR sont uniques et contigus par ED (194 définis, aucun doublon, aucun renvoi FR vers un ID absent ; l'unique « FR-21-49 » est une borne de plage voulue). Tous les Q, P et H cités existent dans `questions-ouvertes.md`. Le glossaire du §3 est présent et précis, et les parcours ont un protagoniste nommé. Mais l'extraction des stories trébuchera sur la notation et sur des doublons.

### Constats
- **[high]** Bip « par Série » dans les FR de données, contre Bip commun dans le glossaire et P22 :
  - la description 4.18 dit : « pour chaque Série sa Cible typée, sa Pause et son Bip » ;
  - FR-18-04 : « la collection ordonnée des N Séries (Cible, Pause, Bip) » ;
  - FR-19-11 : « la Cible typée de chaque Série et de chaque côté avec son Bip » ;
  - face à eux, le §3 dit « Bip — … commun à l'Exercice », FR-10-08 « aucune ligne ne porte de Bip propre », et FR-18-06 Notes « sans surcharge par Série observable (P22) ».

  L'architecture du modèle persistant, partie la plus risquée de PRE-4, lit ces FR en premier. *Correction :* énoncer l'invariant dans FR-18-04 : le Bip est une valeur unique de l'Exercice, et s'il est porté par chaque Série dans la représentation, toutes les Séries ont la même valeur. Aligner ensuite la description 4.18 et FR-19-11.
- **[medium]** Collision de l'identifiant « P3 » (conventions 4.1 à 4.3, l. 105, contre P3 de `questions-ouvertes.md`) — dans le groupe 4.1 à 4.3 et 4.20 à 4.22, `P3` désigne le fichier `PRE-3/perimetre-et-couverture.md` (« P3 l. 99 », « P3 §5 », « P3-23 »). Ailleurs, `P3` est la règle de priorité « Libellé tout échec » (FR-05-05, FR-15-06, FR-16-07, FR-18-10). `P` seul (« P:40 ») désigne en plus le périmètre PRE-4. Une story qui reprend une FR hors de son groupe résoudra mal la source. *Correction :* renommer la notation de fichier en `PRE3:l` et `PERIM:l`, déjà employés en 4.18 et 4.19, sur tout le document.
- **[medium]** Quatre notations de citation pour les mêmes sources (§4, « Conventions de citation par groupe ») — la même ligne s'écrit `S/13…:3015`, `[13]:3015`, `C13 l. 3015` ou `ch13:3015` selon le groupe, et `[DSF2M]`, `DSF-DM`, `DSF-2M` désignent le même DSF. Cela alourdit la table de correspondance que ChatGPT doit construire. *Correction :* normaliser sur une seule notation (par exemple `chNN:l` et `DSF-2M:l`), ou au minimum ajouter une table d'équivalence unique en tête du §4.
- **[medium]** L'apostrophe varie dans des littéraux d'interface censés être exacts (FR-05-05 contre FR-15-06 ; FR-06-05, FR-10-01, FR-07-02 ; UJ-1, UJ-2, FR-18-10) — le PRD fixe l'apostrophe typographique `’` comme littérale en 4.13 à 4.17. Pourtant, le même texte de carte apparaît en `` `N séries à l'échec` `` (FR-05-05, droite) et en `` `{N} séries à l’échec` `` (FR-15-06, courbe). De même, `à l'échec` (cellule), « Aucune durée, à l'échec » et « N séries menées jusqu'à l'échec » (FR-18-10) sont écrits avec l'apostrophe droite. Un test de chaîne exacte échouera selon la FR suivie. *Correction :* décider d'une règle unique pour les textes du lexique, puis la noter en NFR-08 et l'appliquer à tous les littéraux entre accents graves ou guillemets.
- **[medium]** Des exigences sont en double sans propriétaire désigné :
  - ordre de la Feuille : FR-03-02 et FR-10-08 ;
  - popover Mode : FR-03-06 et FR-05-01 ;
  - popover Régime : FR-03-09 et FR-04-01 ;
  - N = 1 : FR-03-08 et FR-12-04 ;
  - écritures et annulation : FR-02-10, FR-11-01, FR-18-17 et FR-19-13 ;
  - copie isolée : FR-01-06 et FR-19-01 ;
  - valeurs initiales : FR-03-04 et FR-11-05.

  Les stories risquent de compter deux fois le même travail, et deux formulations peuvent diverger à la prochaine correction. *Correction :* désigner une FR de référence par règle et réduire les autres à un renvoi (« voir FR-xx-yy »), comme FR-03-09 le fait déjà vers ED-04.
- **[low]** Des abréviations de source ne sont pas définies : `B/06…` (FR-22-01), `DSF-PH` (FR-16-01, FR-16-11, FR-17-05), `B-BIP` (FR-15-03), `MAT-DM` (FR-14-03, au lieu de `MAT-2M`) et `B-PH10` (annexe A.3). Enfin, `Q-07` (FR-13-02) est une question des spécifications, à ne pas confondre avec Q7. *Correction :* les ajouter aux conventions, ou les remplacer par une abréviation définie.

## Adéquation de la forme — adéquat

La forme convient : brownfield, en tête de chaîne, un seul opérateur. Les parcours sont peu nombreux et utiles, et les mesures de succès sont opérationnelles. Les références au code de départ sont reléguées dans `addendum.md` et `extracts/code-depart.md`, et le PRD ne présuppose aucune solution, ce qui respecte `CLAUDE.md`. Les nouveaux comportements et ceux conservés de PRE-3 sont distingués par P8, P18 et P34. Le volume (285 Ko, 194 FR, annexe A de plus de 500 lignes) est lourd pour une tranche d'éditeur. La traçabilité qu'il porte se justifie par la revue ChatGPT, mais les doublons du constat précédent ajoutent du volume sans valeur.

### Constats
- **[low]** Une phrase est corrompue dans FR-15-06 (7e puce) — « les huit cartes Catalogue tout à l'échec, leurs filtres et les cartes Catalogue sont conservés » : le sens et l'origine du nombre huit sont obscurs. *Correction :* reformuler et citer la source du nombre (DSF-DM l. 49 ?).

## Notes mécaniques

- **Plages d'identifiants périmées :** §0 annonce « P1 à P37 » et « H4 à H23 », et les conventions 4.1 à 4.3 disent « P1-P37 et H4-H23 ». Or P38 (FR-09-05) et H24 (FR-18-20) existent. Mettre à jour les trois mentions.
- **Index des hypothèses (§10), colonne « Utilisée dans » incomplète :**
  - H13 est aussi utilisée en ED-03 (FR-03-10) et ED-07 (FR-07-08) ;
  - H14 en ED-04 (FR-04-05) ;
  - H19 en ED-09 (FR-09-04), alors que l'index indique ED-10 ;
  - H8 en ED-14 (FR-14-03) ;
  - H9 en ED-17 (FR-17-04) ;
  - H15 n'apparaît inline qu'en ED-07.

  Toutes les H inline figurent dans l'index, et toutes les entrées de l'index sont utilisées : l'aller-retour est bon, seule la colonne d'usage est à corriger.
- **Glossaire :** « Circuit » et « circuit de séries » (FR-15-04, FR-12-07, FR-14-02) n'ont pas d'entrée, alors que le terme est employé en majuscule comme notion métier. Même chose pour « occurrence », « Durée synthétique » et « Durée estimée d'exécution » (FR-15-05). Les ajouter, ou renvoyer au ch. 01.
- **Glossaire :** « Série » et « séries » alternent en minuscule et en majuscule hors littéraux (FR-03-05 « déplacements de Séries », FR-04-01 « séries »), sans effet bloquant.
- **Termes interdits :** aucun « Set » métier. « Activité » n'apparaît que dans des notes « Non repris ». « Tour » et « Circuit » n'apparaissent que comme interdits d'affichage. Conforme à NFR-08 et NFR-13.
- **Renvois Δ :** Δ2, Δ5, Δ6, Δ9 et Δ10 existent dans `sources-retenues.md`.
- **Protagonistes :** les parcours UJ-1 à UJ-4 ont tous Hermann pour protagoniste, avec le contexte inline.
- **Sections requises :** toutes présentes pour un PRD brownfield en tête de chaîne : vision, utilisateur, glossaire, FR, NFR, non-objectifs, périmètre, mesures de succès et contre-mesures, questions, index des hypothèses, couverture.

## Décompte

| Sévérité | Nombre |
|---|---|
| critical | 0 |
| high | 3 |
| medium | 8 |
| low | 6 |
