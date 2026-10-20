---
title: "Revue éditoriale — PRD PRE-5 et addendum"
created: 2026-10-19
skill: "bmad-review lenses=structure,prose"
contenu: "prd.md (9 167 mots), addendum.md (973 mots)"
---

# Revue éditoriale — PRD PRE-5 et addendum

**Lecture du but.** Ces documents servent à Hermann, à la revue indépendante par ChatGPT et aux étapes BMad suivantes (architecture, épopées, stories) : ils fixent, en différentiel et par renvoi aux sources (Δxx, D-xxx, RM-xxx), ce que PRE-5 change par rapport à PRE-4, et ce qui reste à l'architecture.

**Modèle de structure retenu.** Strategic/Context (Pyramid) pour le PRD ; Reference/Database pour le corps des FR (accès direct par identifiant, schéma règle → *Sources*) et pour l'addendum.

**Contraintes respectées.** Contenu sacré : aucune règle n'est modifiée. Pas de recopie des sources, pas de retrait de l'annexe de couverture, pas de renumérotation des FR / NFR / R / Q-A. Lecteur : humains (style de référence : Microsoft Writing Style Guide, adapté au français).

**Choix de style à préserver** (relevés avant la passe prose) : phrases courtes déclaratives au présent ; listes à puces avec point-virgule ; libellés d'interface en majuscule initiale sans guillemets (Avec, Sans, À la cible) ; nombres de géométrie sans unité (8, 12, 36, 44 = points) ; renvois en italique *Sources :* en fin de FR ; orthographe rectifiée « Enchainement » pour le libellé produit.

Les constats sont triés par impact sur la compréhension, à l'intérieur de chaque lentille.

---

## Lentille structure (9 constats)

| # | Emplacement | Disposition | Texte actuel | Texte proposé | Motif | Impact (mots) |
|---|---|---|---|---|---|---|
| S-1 | PRD §9, intro (l. 790-792) | CONDENSE | « Toutes les QP5 sont décidées : […]. Le PRD ne crée aucune question produit. Restent seulement les points signalés plus bas, que les sources laissent ouverts. » puis « Restent deux types de points : » | « Toutes les QP5 sont décidées : […]. Le PRD ne crée aucune question produit. Restent trois types de points : » (puis les deux puces existantes, et l'intertitre « Points signalés, non décidés » devient la troisième catégorie annoncée) | L'intro annonce d'abord « seulement les points signalés », puis « deux types », alors que la section en contient trois (architecture, Figma, points signalés). Le lecteur ne sait pas lequel des deux comptages croire. | ≈ −15 |
| S-2 | PRD §0, « Règle de préséance » (l. 35) | CONDENSE (en liste ordonnée) | Paragraphe de quatre phrases enchaînant « priment sur §6 pour QP5-04 », « priment sur §3 », « priment aussi sur les sources plus anciennes », « Figma fixe le rendu ». | « **Règle de préséance**, de la plus forte à la plus faible : 1. les deux décisions complémentaires de Hermann du 19/10, pour QP5-04 : bornes minimales des durées (Δ50, FR-45) et Phases Avec → Sans (FR-8) ; 2. les décisions de Hermann du 19/10 (`table-delta.md` §6, `PRE5_BMAD_Decisions_v2.md`) ; 3. les recommandations de `table-delta.md` §3 et les sources plus anciennes, pour ce que ces décisions corrigent. Figma fixe le rendu, jamais une règle. » | Règle consultée à chaque arbitrage ; une échelle à trois niveaux se lit d'un coup d'œil et lève l'ambiguïté « les décisions du 19/10 » (qui inclut ou non les deux complémentaires). Même contenu. | ≈ 0 |
| S-3 | PRD §0, « Organisation » (l. 24-31) | CONDENSE (compléter) | Liste §3 à §8, puis « Les choix techniques sont dans `addendum.md`. » | Ajouter : « - §1 et §2 : vision et utilisateur ; - §9 : questions ouvertes et points signalés ; - §10 : critères de réussite ; - l'annexe : couverture des lignes Δ01 à Δ50. » | Le plan omet §9, §10 et l'annexe, alors que l'annexe est le point d'entrée du réviseur (table de correspondance) et §9 le point d'entrée de Hermann. | ≈ +25 |
| S-4 | PRD §4.8, FR-45 (l. 684) | MOVE (sans renuméroter) | FR-45 « Minimum de 1 s pour toute durée positive » sous « 4.8 Persistance, copies, Phrase et lexique ». | Placer FR-45 sous un nouvel intertitre « ### 4.9 Bornes des durées » (après FR-44, numéro FR-45 inchangé). | Règle transverse (durée de série, phases, Durée de l'exercice) rangée dans une section thématique qui ne la concerne pas. §10 SM-1 la rattache d'ailleurs au lot Feuille (« FR-1 à FR-32 et FR-45 »). Un intertitre suffit, sans déplacer de numéro. | ≈ +4 |
| S-5 | PRD §9, dernier paragraphe (l. 837) | MOVE vers FR-20 | « Pour FR-20, un tableau incomplet ou vide et le passage de Variables à Identiques suivent les conventions PRE-4 existantes (D-384 et la normalisation N1). L'architecture les relève dans le code ; aucune règle nouvelle n'est posée. » | Dans FR-20, compléter la puce existante : « Une cellule vide n'est comptée ni comme cible, ni comme échec. Un tableau incomplet ou vide suit la convention des résultats calculés incomplets (D-384) ; le passage de Variables à Identiques suit la normalisation N1. L'architecture relève ces conventions dans le code ; aucune règle nouvelle n'est posée. » Retirer le paragraphe de §9. | Paragraphe orphelin après la liste numérotée, hors de toute catégorie annoncée ; il précise une règle (FR-20) plutôt qu'il n'ouvre une question. Une partie (D-384) duplique déjà FR-20. | ≈ −15 |
| S-6 | Addendum Q-A6, 2e paragraphe (l. 87) | MOVE | « Le résultat AR-01 (FR-20) est calculé par une fonction pure, lue par la Feuille, à partir des prédicats existants (`EP:226-238`). Cette fonction doit traiter le cas `UNSET` […]. » | Déplacer vers « Vérifications techniques demandées à l'architecture », sous une puce **Résultat dérivé (FR-20, AR-01) :** avec le même texte. | Q-A6 porte sur la mémoire de la dernière valeur chiffrée ; ce paragraphe traite un autre sujet (le résultat dérivé) et n'est pas une question. | 0 |
| S-7 | Addendum Q-A4 et Q-A5 | MOVE (question en tête) | Q-A4 et Q-A5 commencent par des faits ; la question (« Faut-il une nouvelle valeur […] ? », « Quel encodage pour la liste […] ? ») arrive en fin ou en milieu de section. | Mettre la question en première ligne, comme Q-A1 à Q-A3 : Q-A4 « Faut-il une nouvelle valeur de `SideMode`, ou une lecture des valeurs historiques comme Avec ? » puis les faits ; Q-A5 « Quel encodage pour la liste des étapes : dans les colonnes existantes, ou dans une autre structure ? » puis les faits. | Schéma incohérent entre entrées d'une référence ; l'architecte cherche la question d'abord. | 0 |
| S-8 | PRD §4.3, §4.6, §4.7, §4.8 | QUESTION | Ces intertitres n'ont aucune phrase d'introduction (0 mot), alors que §4.1, §4.2, §4.4 et §4.5 en ont une. | Consider : ajouter une phrase d'orientation d'une ligne, ou assumer l'asymétrie (les intros existantes portent des règles, pas une simple orientation) ? | Schéma inégal ; faible impact. Les intros existantes portent du contenu normatif (ex. §4.2 « identiques en Mode Durée et en Mode Répétitions ») : ne pas les retirer pour harmoniser. | 0 à +40 |
| S-9 | PRD Glossaire « Ligne NR » / §6 intro ; FR-5 dernière puce / §9 liste Figma | PRESERVE | Doublons apparents (définition de Ligne NR répétée en §6 ; contrôle d'ajout `9207:18817` cité en FR-5 et en §9). | Conserver. | Ce ne sont pas des redondances vraies : FR-5 pose la règle de repli, §9 le relevé à faire ; §6 rappelle la conséquence (pas de story) au point d'usage. | 0 |

**Synthèse structure.** 9 recommandations (7 actionnables, 1 question, 1 PRESERVE). Réduction estimée si toutes sont acceptées : environ 0 mot net sur 10 140 (les ajouts de S-3 et S-4 compensent les coupes de S-1 et S-5) ; aucun objectif de longueur fourni. Aucun compromis de compréhension : aucune coupe ne retire d'orientation ni d'exemple.

---

## Lentille prose (14 constats)

Passe faite sur la structure ci-dessus : les correctifs dans les passages déplacés (S-5) sont rattachés à leur emplacement cible.

| # | Emplacement | Texte actuel | Texte proposé | Motif |
|---|---|---|---|---|
| P-1 | PRD FR-1, 1re puce (l. 106) | « L'absence de phases se lit « Aucune ». Une seule phase est autorisée. » | « L'absence de phases se lit « Aucune ». Un Exercice peut ne porter qu'une seule phase. » | « Une seule phase est autorisée » peut se lire « une phase au maximum », ce qui contredit « de 0 à 6 phases » deux lignes plus haut. |
| P-2 | PRD §0 (l. 33) | « Les choix techniques sont dans `addendum.md`. » | « Les questions techniques laissées à l'architecture sont dans `addendum.md`. » | L'addendum dit lui-même qu'« aucune réponse n'est présupposée » : il porte des questions, pas des choix. |
| P-3 | PRD §10, SM-1 (l. 845) | « Les FR de Phrase et de transport (FR-18, FR-39 à FR-44) » | « Les FR de Phrase, de persistance, de transport et de lexique (FR-18, FR-39 à FR-44) » | FR-39/FR-40 (persistance, projection) et FR-44 (lexique) ne sont ni « Phrase » ni « transport » ; l'étiquette ne couvre pas la plage citée. |
| P-4 | PRD FR-11, liste « Sont conservés » (l. 229-232) | « - D-249, la non-persistance des variantes cachées, qui ne s'applique pas à la charge, conservée sous Sans. » | « - D-249 (non-persistance des variantes cachées), qui ne s'applique pas à la charge : celle-ci reste conservée sous Sans. » | Trois appositions enchaînées : on ne sait pas si « conservée » qualifie D-249 ou la charge, ni pourquoi une règle « conservée » « ne s'applique pas ». |
| P-5 | PRD FR-17, 6e puce (l. 316) | « La ligne n'est visible qu'avec Avec et N > 1. » | « La ligne n'est visible que si le Changement de côté vaut Avec et N > 1. » | « qu'avec Avec » se lit mal et ne dit pas de quel Avec il s'agit (Phases, Charge et Changement de côté ont tous un Avec). |
| P-6 | PRD FR-18, 2e puce (l. 325) | « L'indicateur de côté de la Composition ne porte plus de direction : seul son point de passage change, son rendu suit Figma (S-2). » | Consider : « L'indicateur de côté de la Composition ne porte plus de direction. C'est le seul point de passage modifié dans la Composition ; son rendu suit Figma (S-2). » ? | « seul son point de passage change » est obscur : le « point de passage » est l'indicateur lui-même (cf. §8, « Seuls les points de passage nécessaires changent »). |
| P-7 | PRD §0, Règle de préséance (l. 35) — si S-2 n'est pas retenu | « Les décisions de Hermann du 19/10 (`table-delta.md` §6, `PRE5_BMAD_Decisions_v2.md`) priment sur […]. Elles priment aussi sur […]. » | « Les autres décisions de Hermann du 19/10 (`table-delta.md` §6, `PRE5_BMAD_Decisions_v2.md`) priment sur […]. Elles priment aussi sur […]. » | Lève l'ambiguïté avec les « deux décisions complémentaires du 19/10 » de la phrase précédente. |
| P-8 | PRD FR-3, 1re puce (l. 127) | « T = N × (D + P). L'exemple 6 + 3 s, 3 séries et pause de 15 s donne 72 s. » | « T = N × (D + P). Exemple : phases de 6 s et 3 s, 3 séries, pause de 15 s : T = 3 × (9 + 15) = 72 s. » | Le lecteur doit refaire le calcul pour relier l'exemple à la formule ; le détail rend la vérification immédiate. |
| P-9 | PRD FR-31, 2e puce (l. 501) | « Ouvrir ou fermer la section ne modifie pas la valeur de durée ; c'est indépendant de son édition. » | « Ouvrir ou fermer la section ne modifie pas la valeur de durée et reste indépendant de son édition. » | « c' » n'a pas d'antécédent clair (l'ouverture ? la valeur ?). |
| P-10 | PRD FR-45, 1er paragraphe (l. 686) | « La décision cite la durée de série, la durée de phase et la durée de l'exercice, avec un « etc. ». » | « La décision de Hermann du 19/10 cite nommément la durée de série, la durée de phase et la durée de l'exercice, suivies d'un « etc. ». » | « La décision » n'est identifiée qu'en *Sources*, en fin de FR ; la nommer à la première mention. |
| P-11 | PRD §9, point 1, 2e sous-puce (l. 808) | « FR-38 l'applique dans les contraintes de NFR-1 et NFR-3. » | « FR-38 l'applique en respectant les contraintes de NFR-1 et NFR-3. » | « applique dans les contraintes » est un calque ; sens inchangé. |
| P-12 | Addendum Q-A7, 4e puce (l. 96) | « l'enchaînement du focus pour Précédent / Suivant, avec les primitives natives ; » | « l'ordre du focus pour Précédent / Suivant, avec les primitives natives ; » | « enchaînement » (focus) côtoie « Enchainement » (paramètre des côtés) dans le même corpus ; « ordre du focus » évite la confusion de terme. |
| P-13 | Addendum, intro, abréviations (l. 11) ; Q-A5 (l. 75) | « `Draft` = `ExecutionParametersDraft.ts` ; […] `Form` = `ActivityEditorForm.tsx` » ; « (`validation.ts:42`, `:368-381`) » | « `Draft` = `src/domain/activities/ExecutionParametersDraft.ts` ; […] `Form` = `src/features/activities/ActivityEditorForm.tsx` » ; « (`src/domain/sessions/validation.ts:42`, `:368-381`) » | Chemins incomplets alors que `EP` et `Sheet` sont complets ; deux fichiers `validation.ts` existent (`src/domain/categories/` et `src/domain/sessions/`), celui qui porte `INSTRUCTION_MAX_LENGTH` est `src/domain/sessions/validation.ts`. Même remarque pour la puce « `validation.ts` » des vérifications FR-45 (l. 110) : consider préciser lequel ? |
| P-14 | PRD annexe, ligne Δ50 (l. 907) | « FR-45 (et FR-3, FR-7) » | « FR-45 ; FR-3, FR-7 » | Format aligné sur les autres lignes (Δ40 « FR-3, FR-40, FR-45 », Δ24 « NR (§6) ; FR-17 ») ; la parenthèse est réservée ailleurs aux précisions de traitement. |

Aucun autre défaut de prose bloquant : orthographe, accords et ponctuation sont propres ; les unités implicites (8, 12, 36, 44) sont un choix constant et compris dans ce contexte, donc conservées.

---

## Totaux

- Structure : 9 constats (S-1 à S-9 ; dont 1 QUESTION et 1 PRESERVE).
- Prose : 14 constats (P-1 à P-14).
- Recoupement entre lentilles : S-2 et P-7 portent sur la même phrase (P-7 n'est utile que si S-2 est refusé) ; S-1 et S-5 touchent tous deux §9.
