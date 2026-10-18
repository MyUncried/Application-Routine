# Correspondance des alias de documents supprimés (lot 2, tâche 2.6)

Les chapitres citent encore des documents supprimés par la consolidation `7a89220f` (14/10/2026) sous des noms courts : « Bip v2 », « v13 », « Phrase v1 », etc. Cette table indique, pour chaque alias :
- le document d'origine, par un permalien vers le parent `3623466a`, état d'origine ;
- les sections des chapitres où son contenu a été intégré.

**Statut :** table de lecture. Elle ne modifie aucune règle et ne déclare aucun ordre d'autorité. Le remplacement des alias dans le texte des chapitres relève du lot 6 (`tasks.md` 6.4).

**Méthode :** `outils/localiser-specifications-integrees.mjs`. Pour chaque section d'une spécification supprimée, on recherche dans les chapitres les lignes de contenu de plus de 60 caractères, après normalisation (identifiants, ponctuation et espaces retirés).
- Résultat brut : [constats/R-09-localisation-specifications.tsv](constats/R-09-localisation-specifications.tsv).
- Une ligne non retrouvée n'est pas forcément perdue : elle peut avoir été reformulée ou volontairement retirée (PR #360 : « audit historique redondant retiré »).

| Alias dans les chapitres | Occurrences (ch. 01–13) | Document d'origine (permalien) | Contenu retrouvé dans les chapitres | Destinations principales (ancre) |
|---|---|---|---|---|
| « Bip v2 », « spécification Bip » | 47 | [SPECIFICATION-BIP-CADENCE-v2.md](https://github.com/MyUncried/Application-Routine/blob/3623466af5a6dcf44dfe676f0ae8019b9c56bf76/docs/Specifications-fonctionnelles/SPECIFICATION-BIP-CADENCE-v2.md) | 35/44 lignes | ch. 08 `#bip-execution` ; ch. 10 `#resultats-temporels` ; ch. 09, ch. 13 |
| « v13 », « paramètres v13 » | 52 | [SPECIFICATION-PARAMETRES-MODALE-v13.md](https://github.com/MyUncried/Application-Routine/blob/3623466af5a6dcf44dfe676f0ae8019b9c56bf76/docs/Specifications-fonctionnelles/SPECIFICATION-PARAMETRES-MODALE-v13.md) | 40/55 lignes | ch. 08 `#parametres-exercice` ; ch. 10 `#calculs-durees` ; ch. 09 ; ch. 13 |
| « Phrase v1 », « phrase v1 » | 10 | [SPECIFICATION-PHRASE-PARAMETRES-EXECUTION-v1.md](https://github.com/MyUncried/Application-Routine/blob/3623466af5a6dcf44dfe676f0ae8019b9c56bf76/docs/Specifications-fonctionnelles/SPECIFICATION-PHRASE-PARAMETRES-EXECUTION-v1.md) | 26/32 lignes | ch. 08 `#phrases` ; ch. 12 `#generateur-phrase` ; ch. 11, ch. 13 |
| « v12 » | 12 | [SPECIFICATION-PARAMETRES-MODALE-v12.md](https://github.com/MyUncried/Application-Routine/blob/3623466af5a6dcf44dfe676f0ae8019b9c56bf76/docs/Specifications-fonctionnelles/SPECIFICATION-PARAMETRES-MODALE-v12.md) | 0/1 (fichier réduit à un renvoi) | Historique : README:68 « v12 et v10.2 sont historiques » |
| « v10.2 » | 3 | [SPECIFICATION-PHRASE-PARAMETRES-EXECUTION-v10.2.md](https://github.com/MyUncried/Application-Routine/blob/3623466af5a6dcf44dfe676f0ae8019b9c56bf76/docs/Specifications-fonctionnelles/SPECIFICATION-PHRASE-PARAMETRES-EXECUTION-v10.2.md) | 0/119 lignes | Historique (README:68) ; non intégré |
| « v15 » | 13 | Pas de spécification supprimée de ce nom : corpus de phrases v15, [DSF-PHRASES-V15-2026-10-07.md](../../../docs/DSF-PHRASES-V15-2026-10-07.md), toujours présent | — | Document présent : pas de correspondance à établir |
| « EC-01 » … « EC-10 » | 2 | [SPECIFICATION-DEUX-MODES-ECHEC-PAR-SERIE-2026-10-13.md](https://github.com/MyUncried/Application-Routine/blob/3623466af5a6dcf44dfe676f0ae8019b9c56bf76/docs/Specifications-fonctionnelles/SPECIFICATION-DEUX-MODES-ECHEC-PAR-SERIE-2026-10-13.md) (décisions EC-01 à EC-10) | 62/111 lignes | ch. 08 `#releves-execution` ; ch. 09 `#cibles-typees` ; ch. 10 `#cibles-mixtes` |
| « spécification Circuits » | — | [SPECIFICATION-CIRCUITS-TOURS-SERIES-2026-10-12.md](https://github.com/MyUncried/Application-Routine/blob/3623466af5a6dcf44dfe676f0ae8019b9c56bf76/docs/Specifications-fonctionnelles/SPECIFICATION-CIRCUITS-TOURS-SERIES-2026-10-12.md) | 80/177 lignes | ch. 08 `#circuits` ; ch. 13 `#controles-circuit` |
| « spécification Formats du 14/10 » | — | [SPECIFICATION-FORMATS-SEANCES-2026-10-14.md](https://github.com/MyUncried/Application-Routine/blob/3623466af5a6dcf44dfe676f0ae8019b9c56bf76/docs/Specifications-fonctionnelles/SPECIFICATION-FORMATS-SEANCES-2026-10-14.md) (FMT-01–42, REC-01–28, §12, SRC-01–08) | 96/201 lignes | ch. 08 `#formats-conception` ; ch. 10 (RM-FMT) ; ch. 06, 07, 13 |
| « spécification Planification » | — | [SPECIFICATION-PLANIFICATION-2026-10-08.md](https://github.com/MyUncried/Application-Routine/blob/3623466af5a6dcf44dfe676f0ae8019b9c56bf76/docs/Specifications-fonctionnelles/SPECIFICATION-PLANIFICATION-2026-10-08.md) | 66/98 lignes | ch. 08 `#planification` ; ch. 13 `#controles-planification` ; ch. 06 |
| « spécification Pauses » | — | [SPECIFICATION-PAUSES-SYMBOLES-2026-10-07.md](https://github.com/MyUncried/Application-Routine/blob/3623466af5a6dcf44dfe676f0ae8019b9c56bf76/docs/Specifications-fonctionnelles/SPECIFICATION-PAUSES-SYMBOLES-2026-10-07.md) | 27/34 lignes | ch. 08 `#pauses-composition` ; ch. 11 |
| « Glossaire », « chapitre 00 » | — | [00 – Glossaire.md](https://github.com/MyUncried/Application-Routine/blob/3623466af5a6dcf44dfe676f0ae8019b9c56bf76/docs/Specifications-fonctionnelles/00%20%E2%80%93%20Glossaire.md) | 136/139 lignes | ch. 01 `#glossaire` |

**Lecture :**
- Les taux de lignes retrouvées sont des indicateurs de localisation, pas une mesure de complétude.
- Les lignes non retrouvées des spécifications Formats, Circuits et Deux modes comprennent notamment des tableaux de provenance, de décisions et de recettes. La consolidation les a reformatés ou retirés. Exemple : la table REC-01–28, dont le texte se retrouve au ch. 10 sans sa colonne Repère (lot 3, tâche 3.3).
