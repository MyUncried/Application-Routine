# Traitement des PR #363, #370 et #371 — intégration du 18/10/2026

Les trois PR documentaires sont intégrées à `docs/openspec-revision`, sur la documentation restructurée (lot 6) et la spécification v3.0 (D-403 à D-424). Têtes intégrées : #363 `d2386c8d`, #370 `6cf3634a`, #371 `2c050d0e`, inchangées depuis les 15 et 16/10. Aucune branche de PR n’est fusionnée : leur contenu est reporté par corrections tracées, puis les PR sont fermées.

## Méthode

- Les correctifs repositionnés (`pr-<n>-report.patch`, chapitres) et les diffs des DSF (`diffs/`) sont convertis en corrections rejouables (`outils/patch-vers-corrections.mjs`), motif `INTEGRATION-PR:#n` : lots `V3-14` (#363), `V3-15` et `V3-16` (#370), `V3-17` et `V3-18` (#371).
- Les blocs dont le contexte avait changé et les passages contredits par une décision plus récente sont traités dans `V3-19-adaptations-pr` ; deux renvois de titre dans `V3-20-renvois-pr` ; l’alignement de #371 sur les décisions PRE-4 du 16/10 dans `V3-21-alignement-pre4-pr371`.
- Images : les 4 PNG de #363 sont copiés depuis sa tête (empreintes identiques) ; les phases sont illustrées par deux frames actuelles exportées le 18/10 (`8982:15172`, `9207:18817`).
- Contrôle de complétude : chaque ligne ajoutée par une PR dans `docs/` est présente à l’identique (espaces et cibles de liens ignorés) ou figure dans le tableau ci-dessous.

| PR | Lignes ajoutées | Présentes à l’identique | Adaptées ou sans objet |
|---|---|---|---|
| #363 | 14 | 14 | 0 |
| #370 | 169 | 156 | 13 |
| #371 | 28 | 17 | 11 |

## Passages adaptés ou sans objet

| PR | Passage de la PR | Décision plus récente | Traitement |
|---|---|---|---|
| #370 | Ordre « Mode → Phases → Séries → régime … chevron indépendant … Bip de cadence → Total » (CE-UI-10, rubrique 7) | D-413, D-410 | Sans objet : la rubrique 7 décrit les quatre cadres ; Phases de l’exercice ouvre le cadre Séries |
| #370 | « Phases entre Mode et Séries … Aucune sans chevron ; chevron seulement avec liste existante » (même bloc) | D-410, D-413 | Sans objet, même bloc ; ligne 2b ajoutée au tableau « Feuille et contrôles » |
| #370 | « La ligne Phases se place après Mode d’exécution et avant Séries. Aucune crée la première phase sans chevron » (ch. 06) | D-410, D-413 | Réécrit : Avec / Sans, Phases de l’exercice en tête du cadre Séries, chevron intérieur à Avec |
| #370 | « Les captures existantes ci-dessous ne sont pas des preuves actualisées des phases » (ch. 06) | — | Réécrit : les frames du 18/10 montrent la ligne ; deux frames de phases ajoutées ; report des trois écrans dédiés toujours à faire |
| #370 | « Dans Modalités d’exécution, la ligne Phases suit Mode d’exécution … toucher Aucune » (ch. 03) | D-410, D-413, PRE-4 Q11 | Réécrit : feuille Paramètres d’exécution, Avec crée la première phase |
| #370 | « Zéro signifie « Aucune » », « La ligne « Phases » se trouve entre … « Aucune » ne porte pas de chevron », « ramène la ligne à « Aucune » » (ch. 08) | D-410, D-413 | Réécrit : Sans ; chevron intérieur à Avec |
| #370 | « … ligne active et commandes d’ajout/retrait » (ch. 08) ; « Réutiliser la ligne de tableau à deux colonnes et son pied » (CE-UI-10) ; « … suppression et pied commun » (DSF Deux modes) | D-413 (PR-02) | Réécrit : sans pied ni boutons +/− |
| #370 | « Aucune crée Phase1 à la durée actuelle » (CE-UI-10) | D-410 | Réécrit : Avec crée Phase1 |
| #370 | « C’est la valeur du champ Durée totale des paramètres » (ch. 08) | D-409 | Réécrit : ligne Durée de l’exercice |
| #370 | D-371 « Aucune crée une phase … chevron seulement avec phases » (registre) | D-410, D-413 | Texte de la décision conservé ; note de remplacement sous le tableau des décisions du 15/10 |
| #371 | « Le pied commun reste le réglage de la cellule active » (CE-UI-10) ; « Le pied commun conserve son rôle … » (DSF Circuits) | D-413, D-417 | Réécrit : pied commun retiré, sélecteur de chaque champ |
| #371 | « Le pied ± de cible Durée utilise un pas de 5 s » (CE-UI-10, DSF Deux modes) | D-413 | Réécrit sans le pied ; le pas de 5 s est conservé (voir limite Q36) |
| #371 | D-094 et D-309 : texte des décisions réécrit | Gouvernance (texte des décisions conservé), PRE-4 Q17 et Q18 (D-385) | Texte d’origine conservé ; nouveau contenu porté dans la colonne Statut |
| #371 | Création : « L’exercice ne sera pas créé. » (CE-T03-04, D-094) | PRE-4 Q18 (D-385) | Texte décidé : « Les informations saisies seront perdues et l’exercice ne sera pas créé. » |
| #371 | « Séries `1..99` et Répétitions `1..100` utilisent des steppers » (ch. 08) | PRE-4 Q8 (D-385), D-418 | Répétitions : roulette native à une colonne |
| #371 | Six contrats de cartes : mention Q17 manquante | PRE-4 Q17 (D-385) | « jamais « 0 s » ni « 0 rép. » » ajouté à l’occurrence conservée (CE-T03-01), que les autres contrats citent |
| #371 | DSF Deux modes : ouverture sur une cible à renseigner absente | PRE-4 Q25 (D-385) | Ajoutée |
| #371 | Ligne « Feuille : en-tête fixe ✕ / Modalités … » ; titre et image du cas mixte (ch. 06) | D-413 | Sans objet : la ligne porte déjà « Paramètres d’exécution » ; le cas mixte porte le nom de la frame actuelle |
| #371 | « Libellé : Aucune durée, à l’échec … » (DSF Deux modes) | D-412, D-418 | Texte de #371 intégré derrière le marquage du 18/10 |
| #371 | « Références courantes du 12/10 … Paramètres d’exécution » (ch. 06) | — | Intégré ; diffère seulement par le lien restauré au lot 6 |

## Hors documentation

- Rapports d’orchestration des PR (`.github/orchestration/reports/2026-10-16_PHASES_DOCUMENTATION.md`, `2026-10-16_DOC_Q11-Q18.md`) : `.github/` est hors du périmètre de ce chantier ; ils sont conservés comme pièces de traçabilité dans [rapports-pr/](rapports-pr/).

## Limites

- **PRE-4 Q21 et Q36** : #371 décrit une grille de cible Durée au pas de 5 s et l’affichage exact d’une valeur hors grille. Q21 (16/10) puis Q36 (17/10, cible Durée au pas de 1 s, valeur bornée à l’ouverture) les remplacent en partie. Q36 appartient aux décisions PRE-4 Q33 à Q44, non intégrées et consignées au lot 6 (`revision-documentation-kodjo/lot6/finalisation/pr/dependances-git.md`). Le texte de #371 est intégré tel quel sur ce point.
- **Phases** : le passage de Avec à Sans lorsque des phases existent n’est décrit ni par #370 ni par la spécification v3.0 ; l’accès à l’ajout d’une phase sans boutons +/− suit la référence visuelle du tableau des phases.
