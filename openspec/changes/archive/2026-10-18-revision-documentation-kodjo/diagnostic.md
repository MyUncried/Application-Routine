# Diagnostic de cohérence — documentation KODJO

- **Base documentaire :** `main` distant `6656fefc58330955f5ad74d513ce616ea51809b0` (vérifiée par `git ls-remote` le 2026-10-16).
- **Branche :** `docs/openspec-revision`, clone `C:\Dev\KODJO-OPENSPEC-DOCS`.
- **Nature :** diagnostic et proposition seulement. Aucune spécification produit n'est modifiée.
- **Constats détaillés et passages exacts :** dossier [`constats/`](constats/). Chaque constat y donne les citations verbatim avec `fichier:ligne`, sa qualification, une analyse, une proposition et, si nécessaire, une question à Hermann.

## 0. Corrections récentes prises en compte (non rediagnostiquées)

| Source | État au 16/10 | Effet sur le diagnostic |
|---|---|---|
| `7a89220f` (14/10) — consolidation des `SPECIFICATION-*.md` dans les chapitres 01 à 13 | fusionné | Cause des références rompues R-01 (fichiers supprimés). |
| `d8985d6e` (14/10) — clarification d'autorité ch. 13 | fusionné | Intégré à l'inventaire des règles de priorité (R6). |
| `768dbaa7` (14/10) — 129 captures actualisées | fusionné | Hors analyse visuelle. |
| PR #371 (ouverte, brouillon) — Q11 à Q18, paramètres d'exécution | non fusionnée | Q11–Q18 considérés comme **arbitrés**. Les écarts restants sont qualifiés « intégration pendante ». Deux divergences entre la PR et les décisions sont signalées (X-06, X-07). |
| PR #370 (ouverte) — phases d'exercice | non fusionnée | Non rediagnostiqué. Elle ajoute D-370 à D-375 sans colonne Statut, sur le modèle de D-357 à D-369 (H-12). |
| PR #363 (ouverte) — 44 captures Figma | non fusionnée | Hors analyse. |
| Décisions de Hermann Q1 à Q23 du 16/10 (préparation PRE-4 BMAD, clone `KODJO-BMAD-PRE4`, fichier non committé lu en lecture seule) | décisions prises, hors documentation normative | Considérées comme **arbitrées**. Q8 et Q19 à Q23 ne figurent dans aucune PR documentaire : X-05, X-07, X-01. |

**Références figées PRE-4 :** PRE-4 BMAD lit ses sources au commit `caa2a5cf` (branche `plan/pre4-vnext-20261013`). À cette date, les chapitres 01 et 04 à 12, ainsi que les DSF Interface, Circuits, Deux modes et Phrases v15 et la matrice Deux modes, ont **le même blob** sur `main`. Le chapitre 13 **diffère** : `main` n'a pas la section « Inventaire opposable PRE-4 » (1 653 lignes, l. 4346 à 5996 à `caa2a5cf`), que PRE-4 a retenue comme source produit commune (décision Q7). Toute correction de ces fichiers est donc marquée `touche_PRE4`.

## 1. Inventaire des sources normatives

L'inventaire complet, avec la citation qui déclare le statut de chaque fichier, est dans [`constats/H-hierarchie.md` §1](constats/H-hierarchie.md).

| Famille | Fichiers | Statut déclaré | Observation |
|---|---|---|---|
| Chapitres 01 à 13 | `docs/Specifications-fonctionnelles/` | Normatifs (INDEX.md:3) | Seule couche déclarée normative par INDEX.md. 1,44 Mo, dont ch. 13 à 287 ko et ch. 06 à 197 ko. |
| Registre des décisions | ch. 07 | Arbitrages (PRODUCT R4 rang 1, ch. 13 R5 rang 1 « jusqu'à D-255 ») | 365 décisions, dont 24 vidées de leur texte (H-04, H-05). |
| PRODUCT.md | `docs/PRODUCT.md` | « synthèse » mais porte un ordre de référence (l. 434–442) et des « Références courantes » | Synthèse devenue concurrente (H-16, P-12). |
| README.md / INDEX.md | `docs/` | Navigation | README « Références actives » renvoie à un DSF qui se déclare lui-même dépassé (H-15). |
| DSF-* | 17 fichiers | Hétérogène : certains « normatifs », d'autres sans statut | 10 chapitres déclarent qu'un DSF prévaut sur leur propre texte (R9, H-03). |
| MATRICE-*, RAPPORT-*, REPORT-*, REVUE-*, JOURNAL-*, VERIFICATION-*.json | ~40 fichiers | Traçabilité ; certains « courant » et « historique » à la fois (H-17) | Plusieurs portent encore des règles (H-18, H-19). |
| Figma | Hors dépôt | Rendu visuel (INDEX, README, R13) | Des valeurs par défaut sont justifiées par « le Figma de référence » (P-16). |

### 1.1 Règles de priorité écrites

Il existe 18 règles de priorité écrites, citées dans `H-hierarchie.md` §2. Elles ne forment pas un ordre unique :

- **PRODUCT.md:434–442** : « 1. registre des décisions … 2. glossaire, modèle fonctionnel et modèle de données ; 3. conception fonctionnelle détaillée ; 4. écrans et navigation ; 5. contrats d'écran du chapitre 13 ; … »
- **ch. 13:19** : « 1. décisions validées dans le chapitre 07, jusqu'à D-255, avec priorité aux décisions explicitement supersédantes ; … » ; le ch. 13 se place lui-même au rang 6, sous les API et l'architecture.
- **ch. 08:33** : « Les champs, contrôles et comportements spécifiques des écrans sont définis au chapitre 13. »
- **ch. 07:559** : « Les décisions récentes prévalent, dans leur portée, sur les présentations antérieures » (critère de récence).
- **R9 (10 chapitres)** : « Ces règles finales [DSF Cartes, icônes et appuis] prévalent sur les anciennes formulations d'affichage du présent chapitre dans ce périmètre uniquement. »

### 1.2 Décisions qui en remplacent d'autres

Le tableau des chaînes de remplacement est dans `H-hierarchie.md` §3.2. Points saillants :

- **Remplacements explicites et sains**, par exemple D-311 « Supersédée par D-314 », sans citation résiduelle.
- **Chaînes qui aboutissent à une décision elle-même supersédée** : D-204 → D-232 → (02/10).
- **Remplaçants vides** : D-302 et D-305 remplacent D-208, D-209, D-217 et D-238. Leur propre texte a été écrasé le 07/10 par « Prescription courante : Bip v2 et D-308–313 ; ancienne version conservée dans Git. » (commit `37e372cd`, vérifié). Le même texte a été posé sur 24 décisions, dont D-237 (animations d'appui), sans rapport avec le Bip.
- **Remplacements non reportés** sur la décision remplacée : D-251 par D-337, D-222 et D-228 par D-343 et D-355, D-298 par D-315 et D-321.
- **Remplacements par des DSF**, sans décision Dxxx : ch. 13:4087 pour D-339 et D-341.
- **Remplaçant inexistant** : D-111 est déclarée remplacée par « EC-01/02 », que rien ne définit.

## 2. Synthèse des constats

83 constats d'analyse et 2 familles mécaniques. Qualification selon le brief : contradiction réelle / complément / différence de périmètre / doublon / référence rompue / ambiguïté de périmètre.

### 2.1 Références rompues (contrôle mécanique, `constats/R-liens-ancres.tsv`, outil `outils/links.mjs`)

| ID | Constat | Volume | touche_PRE4 |
|---|---|---|---|
| R-01 | Liens vers des fichiers supprimés par la consolidation `7a89220f` (`SPECIFICATION-PARAMETRES-MODALE-v11/v12/v13`, `SPECIFICATION-CADENCE-REPETITIONS-v1`, `SPECIFICATION-BIP-CADENCE-v2`, `SPECIFICATION-PHRASE-PARAMETRES-EXECUTION-v1/v10.2`, `SPECIFICATION-PLANIFICATION-2026-10-08`, `CONSOLIDATION-EVOLUTIONS-V15`, `00 – Glossaire`) | 26 liens dans 17 fichiers de traçabilité, plus 2 mentions en texte | non |
| R-02 | Ancres `#ce-fmt-01` à `#ce-fmt-06` inexistantes : les titres `## CE-FMT-01 — Choix du modèle et du format` produisent des ancres longues | 120 liens dans `MATRICE-FORMATS-SEANCES-2026-10-14.md` et 46 dans le ch. 06 | ch. 06 : oui |
| R-03 | 42 titres `### RM-` sans numéro au ch. 10 (l. 341 et suivantes, ancres `fmt-01` à `fmt-42`). Les exclusions « Hors règles propres des formats (RM-et RM-) » de RM-071, RM-072, RM-075, RM-125 et RM-126 sont donc vides (vérifié) | 47 occurrences | oui |
| R-04 | Ch. 08 : la « spécification Formats du 14/10 » renvoie à elle-même. §12, SRC-01/04/05 et REC-xx n'ont pas de destination (S-09, P-20) | 1 lien, plusieurs identifiants | oui |
| R-05 | « chapitre 00 » cité par REVUE-COHERENCE-FORMATS et MATRICE-FORMATS ; « §9.5 » inexistant (X-14) | — | partiel |

### 2.2 Constats d'analyse par qualification

Les gravités sont celles des fichiers de constats.

**Contradictions réelles — bloquantes ou majeures**

| ID | Objet | Sources en conflit | Décision nécessaire ? |
|---|---|---|---|
| H-01 / P-01 | Ordre de priorité entre chapitres | PRODUCT.md:434 ↔ ch. 13:19 ↔ ch. 08:33 | **Oui** : quel ordre, ou quel principe de domicile |
| H-02 | Priorité des décisions bornée à D-255 | ch. 13:19 | Oui, avec H-01 |
| H-03 | DSF prévalant sur des chapitres et des décisions | 10 chapitres (R9), ch. 13:4087 | Oui : statut des DSF |
| H-04 / H-05 | 24 décisions vidées, dont des remplaçantes | ch. 07 l. 329 à 467 | Non pour la restauration du texte ; oui pour le statut de chacune |
| H-10 / H-11 | Règles remplacées encore énoncées (appui court ; D-232 et D-246) | RM-200, ch. 08:1573, 1592 et 1595, PRODUCT:304 | Non (P14 déjà arbitré) |
| X-01 / S-13 | Arrondi à la minute supérieure (RM-159, D-090) ↔ min/s sans arrondi | ch. 10:141 ↔ Q20/P41 | Arbitré pour PRE-4 (Q20) ; intégration pendante |
| X-02 | ≥ sur les cartes, Q17 propagé partiellement | DSF-CARTES-DUREE:18, CE-T03-01/02/05, ch. 06:1119, RM-072 | Arbitré (Q17) |
| X-04 | Valeur historique hors bornes : conservée (Q15) ↔ invalide (CE-UI-10, API-PARAM-01) | ch. 13, ch. 11 | **Oui** |
| X-08 | D-092 « Validée » : répétitions 1–99 ↔ 1..100 | ch. 07 ↔ sources actives | Non (alignement) |
| X-09 | Roulettes « sous la ligne » ↔ en popover (13/10) | ch. 08, ch. 13 §4.6, ch. 06 | Oui, si le popover n'est pas acté par une décision |
| S-01 | Statut `Partielle` défini de trois façons | ch. 08:996, ch. 08:1386, ch. 03 | **Oui** |
| S-03 | Suppression directe d'une Séance ↔ archivage préalable obligatoire (RM-007) | ch. 08 §2.5 ↔ ch. 10 | **Oui** |
| S-04 | Composition enregistrée automatiquement ↔ brouillon et `Continuer` | ch. 08 §3.10 ↔ le reste | **Oui** |
| S-05 | Séance contenant un exercice invalide : enregistrable ? | ch. 08 §3.8 ↔ RM-017, CE-T03-08 | **Oui** |
| S-06 / P-08 / P-11 | Tour en tant que conteneur, contre D-209 | RM-025 ↔ RM-026, ch. 04, 05, 09, 11, D-032 | Non (D-209 explicite) |
| S-08 | RM-027 et le « stepper Nombre de tours » subsistent après leur remplacement du 12/10 | ch. 10 | Non |
| S-14 | Montant de l'en-tête du Circuit : durée du Circuit ou de la Séance ? | ch. 08 ↔ ch. 13 | **Oui** |
| S-20 | Résultat `incomplete` (ch. 11) ↔ « pas de cinquième résultat temporel » (ch. 10) | ch. 11 ↔ ch. 10 | Oui |
| P-03 | Segment Exercices « désactivé au MVP » | ch. 12:1365 ↔ ch. 05, ch. 06 | Non |
| P-04 / P-05 / P-07 / P-10 | Fonction rangée dans deux versions : recherche, médias en exécution, calcul, récurrence mensuelle | ch. 01, 02, 03, 05, PRODUCT | Oui pour P-05 |
| P-12 | PRODUCT.md et ch. 05 : trois modes, 99 min 59 s, « ≥ réservé aux agrégats » | PRODUCT, ch. 05 ↔ 13/10 et Q15 | Non |
| P-15 / P-17 | Préférences du Profil : 4 listes ; 3 rendus de groupes | ch. 06, CE-UI-07, DSF Interface | Oui pour la liste |

**Différences de périmètre et ambiguïtés**

- **P-02 :** MVP, V1 et « tranche » ne sont définis nulle part ; « V2 » a au moins cinq sens.
- **P-09 :** Formats, Circuits de séries et Cadence sont spécifiés sans version assignée ; la page Figma « Prototype MVP » est lue comme un périmètre.
- **S-02 :** le statut d'Exécution d'un achèvement « incomplet » en Death by reste réellement ouvert.
- **S-21 :** le nombre de tours d'un Tabata « Par exercice » est-il réglable ?
- **S-22 :** types de phase du Plan.
- **X-13 :** résumé d'un Exercice mixte sur les cartes.
- **P-18 :** l'ordre des éléments relève-t-il du comportement écrit ou du layout Figma ?

**Doublons, risques de divergence**

- **P-13 :** formule « Durée intrinsèque calculable » en 15 copies dans 8 fichiers ; paragraphe « Pi est stockée… » en 11 copies ; bloc D-239 en pixels dans 10 chapitres.
- **P-14 :** ordre de la feuille Paramètres écrit à 4 endroits, déjà divergents.
- **H-19 :** RG-1 à RG-13 recopiées dans 10 chapitres.
- **X-13 :** synthèse Catalogue en 4 exemplaires.

**Compléments empilés (remplacement implicite par ajout)**

- **P-21 :** dans CE-UI-10, 12 notes datées sont posées au-dessus d'un corps inchangé. Par exemple, la l. 3027 « erreur nommant la Série » n'est remplacée qu'à la l. 4100.
- **P-22 :** au ch. 06, 12 sections datées en fin de chapitre.
- **H-14 :** un critère de récence est érigé en règle.

**Frontière documentation / Figma**

- **P-16 :** valeurs par défaut de 10 s et 30 s justifiées par « le Figma de référence », y compris dans RM-212.
- **P-17 :** rendu visuel (px, couleurs, polices) recopié dans les chapitres de données et d'API.
- **X-19 :** couleur #595E66 ↔ #141414.

**Mineurs :** H-06, H-07, H-08, H-12, H-17, H-18, H-20, S-11, S-12, S-15 à S-19, X-10 à X-12, X-14 à X-18, P-06, P-19, P-20.

### 2.3 Points vérifiés cohérents (pas de constat)

- Les formules et scénarios de calcul du ch. 10 (A à F, R01 = 105 s, R02 = 74 s) ont été recalculés et sont justes (X).
- Les bornes des cibles, pauses, Bip, Compte à rebours et Fin concordent dans les sources actives (X).
- Aucun identifiant D-xxx ou RM-xxx n'est défini deux fois (H).
- Les 11 corrections de REVUE-COHERENCE-FORMATS sont présentes dans les chapitres, avec les réserves S-02 et S-10.

## 3. Couverture réelle

| Analyse | Lu intégralement ou ciblé | Non lu |
|---|---|---|
| H (hiérarchie) | En-têtes de tous les fichiers `docs/*.md` ; ch. 07 entier ; règles de priorité par recherche | Corps des DSF et matrices au-delà des statuts |
| X (exercice) | ch. 08 paramètres et phrases, ch. 10, ch. 09 cibles, CE-T03-04, CE-UI-09 et CE-UI-10, DSF du périmètre | ch. 01, 02, 05 ; CE-T03-09 à CE-T03-15 |
| S (séances) | ch. 03, 04, 08 et 10 sur leur périmètre, CE-FMT, CE-EXEC-SESSION-01, CE-UI-08 et CE-UI-11, DSF Formats et Circuits | ch. 06 hors lignes ciblées, la plupart des autres contrats du ch. 13, ch. 02, ch. 05, JSON |
| P (périmètre) | ch. 05, PRODUCT, passages ciblés des ch. 01, 02, 03, 06, 12 et 13 | Voir `P-perimetre.md` « Couverture » |
| R (liens) | 78 fichiers `.md` de `docs/` hors archives, préparation et sources | Liens en texte brut non balisés ; images |

## 4. Errata (rapports bruts conservés tels quels)

| Date | Rapport | Passage | Correction | Vérification |
|---|---|---|---|---|
| 2026-10-16 | `constats/H-hierarchie.md` §3.3 | « 37 titres CE-… distincts ont été comptés dans ch13 » | Le ch. 13 compte **40** contrats, comme il l'annonce l. 13. L'écart avec README:66 « 30 contrats » reste valable. | `grep -c '^## CE-'` = 40 ; 40 identifiants distincts ; 40 rubriques `### 20.` |

## 5. Conclusion de couverture

La lecture est ciblée. Elle ne permet pas d'affirmer qu'il n'existe pas d'autres contradictions, en particulier dans les contrats du ch. 13 non lus et dans les parties du ch. 06 non ciblées.

## 6. Compléments de la révision 2 (16/10) : origine Git des pertes d'identifiants et de statuts

Ces constats ont été établis en vérifiant l'historique Git, après la revue ChatGPT. Ils **requalifient** plusieurs constats de la passe 1 : des défauts présentés comme des manques de rédaction sont en réalité des **pertes restaurables**.

| ID | Constat | Preuve | Constats requalifiés |
|---|---|---|---|
| R-06 | La consolidation `7a89220f` (PR #360, 14/10) a effacé des identifiants dans les 13 chapitres. Familles touchées, d'après `outils/compter-identifiants.mjs <racine> 7a89220f^ 7a89220f` : D-nnn −360 ; FMT-nn −162 ; RM-FMT −52 ; DEC-nn −13 ; CE-… −43. Sur les lignes concernées, 244 ne diffèrent de leur version d'origine **que** par des identifiants, et toutes portent une trace d'effacement mécanique (espace orpheline avant ponctuation, parenthèse vide, libellé « **.** »). 6 lignes sont ambiguës, et 214 ont aussi été reformulées ou supprimées. | [constats/R-06-restauration-identifiants.tsv](constats/R-06-restauration-identifiants.tsv), `outils/plan-restauration-identifiants.mjs` | R-03, H-13, S-10, QF-03, QS-07 (titres `### RM-` : `RM-FMT-01`…`42` à `7a89220f^`, 42 appariements ancre/numéro vérifiés) ; QF-18 (REC-01…28 présentes à `7a89220f^:…/SPECIFICATION-FORMATS-SEANCES-2026-10-14.md` l. 248 et suivantes ; leurs 28 situations figurent au ch. 10 sans la colonne Repère) ; H-08 (EC-01…EC-10 définies dans `7a89220f^:…/SPECIFICATION-DEUX-MODES-ECHEC-PAR-SERIE-2026-10-13.md`) |
| R-07 | La même consolidation a modifié 25 lignes du registre. Elle a effacé, pour D-357 à D-369, le repère `DEC-nn`, l'horodatage, **la colonne Statut** (« Validée le 14/10/2026 par Hermann ; … ») et la trace `FMT-nn`, et a retiré des renvois dans 8 autres décisions. Aucune ligne du registre n'a été modifiée depuis (`comparer-registre.mjs 7a89220f 6656fefc` : 0). | [constats/R-07-registre-7a89220f.tsv](constats/R-07-registre-7a89220f.tsv), [constats/LOT-1-registre.tsv](constats/LOT-1-registre.tsv) | H-12 (« D-357 à D-369 n'ont pas de colonne Statut ») |
| R-08 | Sur les 24 décisions vidées par `37e372cd` (07/10), 22 portent sur la Cadence (D-268 à D-305 : 20 portent un repère CAD-nn, entre CAD-01 et CAD-29, plus D-302 et D-305) et relèvent d'un remplacement **explicite** par « Bip v2 et D-308–313 ». Deux n'ont pas cet objet : D-237 (animations d'appui) et D-252 (pas des steppers, qui « maintien D-237 conservé »). D-312 traite aussi des steppers. | `git show 37e372cd^:…/07 – …md` ; ch. 07 D-308 à D-313 | H-04 précisé : la restauration du texte d'origine est documentaire ; le statut de D-237 et D-252 reste une question (Q-M) |

**Texte d'origine des exclusions (R-06)** — `7a89220f^`, ch. 10 :
> | RM-071 | Hors règles propres des formats (RM-FMT-20–27 et RM-FMT-33–38), La Durée estimée d'exécution agrège les étapes contri…

Texte actuel : « Hors règles propres des formats (RM-et RM-), … ». La plage n'est donc **pas à décider** : elle est à restaurer. La proposition de la révision 1, qui la soumettait à Hermann, est retirée.

**Intention de la consolidation :** la PR #360 annonce « Rubriques de traçabilité des contrats et audit historique redondant retirés ; historique conservé dans Git ». Elle n'annonce ni l'effacement des numéros de règles, ni celui des recettes, ni celui des statuts de décisions. L'effacement des renvois D-nnn dans le texte courant n'est pas annoncé non plus, mais il peut relever de la même intention : question Q-O dans [arbitrages.md](arbitrages.md).

## 7. Évolutions postérieures à la base d'analyse (consignées, non intégrées)

Relevé du 16/10, après la revue ChatGPT.

| Élément | État à la base du diagnostic | État au 16/10 (révision 2) | Traitement |
|---|---|---|---|
| `main` distant | `6656fefc` | `6656fefc` (inchangé) | Base conservée |
| PR #363 | ouverte, tête `d2386c8d` | ouverte, tête `d2386c8d` ; **base `caeee0ef`, antérieure à `main`** ; ne modifie que le ch. 06 | Inchangée ; rebase nécessaire avant toute fusion (constat, pas une action de ce chantier) |
| PR #370 | ouverte, tête `6cf3634a` | inchangée ; 17 fichiers ; ajoute D-370 à D-375 **sans colonne Statut**, dans le même format que les lignes tronquées par R-07 | Signalé en Q-L |
| PR #371 | brouillon, tête `2c050d0e` | inchangée ; modifie D-094 et D-309 au ch. 07 | Signalé en Q-L ; écarts X-06 et X-07 maintenus |
| Décisions PRE-4 BMAD (fichier non versionné `KODJO-BMAD-PRE4/docs/preparation/PRE-4/bmad/questions-ouvertes.md`) | Q1 à Q23 (copie du 16/10, empreinte SHA-256 `d96654c4…`) | Q1 à Q26, plus P45, F9, H31 à H33 (copie du 16/10 17:31, empreinte SHA-256 `ceadbee3…`) | Nouvelles décisions **Q24** (résumé « {N} séries à l'échec »), **Q25** (ouverture de la roulette sur la valeur minimale), **Q26** (± sans Cellule active). Consignées ici et dans Q-L, **non intégrées** aux constats de la passe 1. |
| Décisions PRE-4 BMAD, relevé du 16/10 en fin de journée | — | Fichier committé dans le clone PRE-4 (`e0e8ce58`, non publié), Q1 à Q31 (SHA-256 du contenu : `abb9de8f…`) | Q27 à Q31 consignées dans [arbitrages.md](arbitrages.md) (état au 16/10). Q31 amende D-335. **Non intégrées.** |
| Lignes des PR qui recouvrent les restaurations R-06 et R-07 | — | 0 ligne restaurable modifiée par #363, #370 ou #371 | Les PR ne font pas doublon avec les lots 1 et 3 |
