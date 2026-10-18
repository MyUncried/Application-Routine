# Lot 6A — conception de la restructuration documentaire (révision 2)

- **Nature :** conception seulement. **Aucun document produit n'est modifié** ; aucune section n'est déplacée.
- **Base analysée :** `docs/Specifications-fonctionnelles/`, identique à `49526414` et à `1122bb9d`, qui intègrent les lots 1 à 5 et D-376 à D-401. `main` distant : `6656fefc`, inchangé.
- **PR ouvertes prises en compte :**
  - #363 `d2386c8d` ;
  - #370 `6cf3634a` ;
  - #371 `2c050d0e` (brouillon).

  Les autres PR ouvertes ne touchent aucun chapitre.
- **Statut :** proposition révisée, soumise à Hermann et à la revue indépendante. L'architecture recommandée **n'est pas une décision**.

## Révision 2 — réponse à la revue indépendante (PARTIELLEMENT CONFORME)

Les analyses, inventaires et matrices de la révision 1 sont conservés. Seuls changent les points suivants.

| Réserve ou réexamen | Correction | Où |
|---|---|---|
| **1.** Traitement concret de chaque défaut, y compris dans les sections CONSERVER | Nouvelle colonne `traitements` dans `correspondance.tsv` : 1 180 traitements (défaut → étape → action) pour les 652 sections qui ont au moins un défaut, dont 302 sections conservées en place. Aucun défaut n'est sans traitement. Les codes libres `AUTRE:` sont rattachés par famille. | §5, §9 ; `outils/correspondance-cible.mjs` |
| **2.** Pas de suppression sur un simple seuil de similarité | La similarité ne sert qu'à repérer un candidat. Un renvoi n'est retenu que si les trois conditions suivantes sont réunies :<br>- **toutes** les lignes de la section figurent à l'identique dans la copie conservée ;<br>- les **portées** sont identiques (MVP courant / hors MVP / historique) ;<br>- les **autorités** sont compatibles : une section normative ne pointe jamais vers une copie non normative ou archivée.<br>Résultat : 21 renvois au lieu de 32 ; 11 copies partielles conservées, avec leurs écarts. Au niveau des lignes, on retient les 89 occurrences de même contexte ; les 158 autres sont « à vérifier » et restent en place. | §5, §6 ; `correspondance.tsv` (colonne `copie`), `copies-lignes.tsv` ; `outils/copies-lignes.mjs` |
| **3.** Contrôle du sens, des références et de l'autorité | Trois contrôles bloquants ajoutés à `verifier-conservation.mjs` :<br>- C5 : portée de chaque ligne ;<br>- C6 : marqueurs d'autorité ;<br>- C7 : identifiants cités et résolus.<br>S'y ajoutent la validation des motifs de justification et un nouvel outil `verifier-redaction.mjs`, qui contrôle les invariants de sens des corrections rédactionnelles. Les cinq scénarios d'autotest donnent le résultat attendu. | §7 |
| **4.** Traitement systématique des défauts de qualité restants | Inventaire de chaque défaut QF, QC et QS, puis séparation entre **corrections rédactionnelles** (étape 6K, DOC, contrôle des invariants) et **décisions produit** (6J, liste unique soumise à Hermann). | §10 |
| Rôle du ch. 08 | La table de renvoi est abandonnée. Le ch. 08 devient la **conception fonctionnelle par fonctionnalité** : enchaînements, états et transitions, qui citent les règles du ch. 10 sans les reformuler. | §4.2 |
| Justification du ch. 14 | Le ch. 14 est abandonné. Les conventions d'interface vont au **ch. 06**, libéré de ses descriptions d'écran. Le design system technique reste au ch. 12. | §4.3 |
| Dépendances aux PR | Elles sont mesurées section par section (`dependances-pr.tsv`) : 35 sections touchées (#363 : 5, #370 : 16, #371 : 16). **Seules ces sections attendent**, et non les étapes entières. | §8.2 |
| Points d'arrêt | Une seule autorisation globale avant l'exécution. Ensuite, les étapes s'enchaînent, contrôlées automatiquement. Arrêt seulement en cas d'échec d'un contrôle bloquant, ou pour les décisions produit, regroupées. | §8.3 |

## Livrables

| Fichier | Contenu | Produit par |
|---|---|---|
| [inventaire-sections.tsv](inventaire-sections.tsv) | 998 sections : plage, taille, identifiants définis, titre daté, liens entrants | `outils/inventaire-structure.mjs` |
| [base-conservation.tsv](base-conservation.tsv) | 782 identifiants définis et 7 441 lignes de contenu (empreinte) rattachés à leur section | `outils/inventaire-structure.mjs` |
| [classification/](classification/), [classification.tsv](classification.tsv) | Pour chaque section : type, domaine, caractère normatif, accrétion, recouvrements vérifiés, constats, défauts | 6 sous-agents en lecture seule (`outils/brief-L6A-classification.md`) |
| [recouvrements-mecaniques.tsv](recouvrements-mecaniques.tsv) | 228 paires de sections à ≥ 50 % de texte commun | `outils/recouvrements-sections.mjs` |
| [correspondance.tsv](correspondance.tsv) | **Destination, action, étape et traitement de chaque défaut** pour les 998 sections ; copies partielles ; portée ; PR | `outils/correspondance-cible.mjs` |
| [copies-lignes.tsv](copies-lignes.tsv) | 97 lignes copiées : occurrence conservée, occurrences remplaçables (même contexte), occurrences à vérifier (motif) | `outils/copies-lignes.mjs` |
| [divergences.tsv](divergences.tsv) | 204 paires de passages divergents, conservées côte à côte jusqu'à décision (G3) | classification |
| [dependances-pr.tsv](dependances-pr.tsv) | Sections réellement modifiées par les PR #363, #370 et #371 | `outils/dependances-pr.mjs` |
| `outils/verifier-conservation.mjs`, `verifier-correspondance.mjs`, `verifier-redaction.mjs` | Contrôles des étapes (§7) | autotestés |

En cas d'écart entre ce plan et un fichier, **le fichier fait foi**.

## 1. Analyse structurelle des 13 chapitres

### 1.1 Mesures

| Ch. | Lignes | Sections | Mots | Titres datés | Sections empilées¹ | Type dominant² | Contenu hors domicile² |
|---|---|---|---|---|---|---|---|
| 01 | 449 | 29 | 7 114 | 1 | 7 | CONCEPT 71 % (glossaire) | PÉRIMÈTRE 12 %, RÈGLE 8 % |
| 02 | 246 | 24 | 2 554 | 3 | 5 | BESOIN 86 % | PARCOURS 5 % |
| 03 | 563 | 81 | 6 374 | 10 | 13 | PARCOURS 63 % | PÉRIMÈTRE 11 %, RÈGLE 10 %, RENDU 7 % |
| 04 | 459 | 36 | 5 965 | 1 | 9 | CONCEPT 59 % | RÈGLE 16 %, RENDU 9 %, DONNÉE 5 % |
| 05 | 284 | 32 | 3 378 | 10 | 20 | PÉRIMÈTRE 77 % | RENDU 15 % |
| 06 | 2 794 | 182 | 24 363 | 11 | 20 | CONTRAT 26 %, NAVIGATION 19 % | CONVENTION-UI 12 %, RÈGLE 9 %, RENDU 9 % |
| 07 | 688 | 48 | 23 677 | 23 | 35 | DÉCISION 99 % | — |
| 08 | 1 850 | 160 | 25 822 | 4 | 68 | RÈGLE 48 %, CONTRAT 16 %, COMPORTEMENT 12 % | CONCEPT 7 %, CONVENTION-UI 4 % |
| 09 | 1 274 | 135 | 15 847 | 2 | 21 | DONNÉE 61 % | RÈGLE 18 %, RENDU 4 % |
| 10 | 784 | 79 | 13 323 | 5 | 16 | RÈGLE 60 %, CALCUL 22 % | RENDU 5 % |
| 11 | 463 | 38 | 8 130 | 2 | 14 | API 79 % | RÈGLE 6 %, RENDU 6 % |
| 12 | 1 623 | 97 | 21 604 | 7 | 23 | ARCHITECTURE 40 %, RENDU 41 % | CONVENTION-UI 8 % |
| 13 | 4 351 | 57 | 40 681 | 1 | 19 | CONTRAT 75 % | CONVENTION-UI 11 %, RÈGLE 5 % |

¹ Complément daté ou ajouté à côté de sa rubrique (colonne `accretion`). Au ch. 07, l'ordre chronologique est voulu.
² Pondéré par le nombre de mots (`classification.tsv`). Au ch. 12, le « rendu » est pour l'essentiel le design system (Screen Shells, composants, tokens), qui relève de l'architecture de l'interface (§4.3).

**Défauts relevés par section :**

| Défaut | Sections |
|---|---|
| DOUBLON | 266 |
| MÉLANGE | 144 |
| SANS-ID | 131 |
| HORS-DOMICILE | 125 |
| TITRE-DATÉ | 90 |
| RENVOI-ABSENT | 69 |
| TITRE-NUM | 48 |
| ALIAS | 48 |
| TABLEAU-COUPÉ | 12 |
| ORPHELIN | 1 |
| codes libres `AUTRE:` | 246 |

**Recouvrements vérifiés :** COPIE 675, PARAPHRASE 1 483, DIVERGENCE 291, RÉSUMÉ 86. Le contrôle mécanique trouve 228 paires à ≥ 50 % de texte commun, dont 221 entre chapitres différents.

### 1.2 Constats

| ID | Constat structurel | Preuves | Constats repris |
|---|---|---|---|
| **L6-01** | **Chaque nouvelle fonctionnalité a été écrite comme complément dans presque tous les chapitres.** Formats, Cadence, Paramètres et Planification apparaissent dans les 13 chapitres ; Circuits et Exécution dans 9 à 12. Le plan par type de contenu est doublé en fin de chapitre d'un plan par date. | `classification.tsv` (domaine × chapitre) ; 270 sections empilées ; 80 titres datés | QS-03, QS-11, P-21, P-22, H-14 |
| **L6-02** | **Des blocs entiers sont recopiés dans 7 à 10 chapitres.** On compte 18 groupes de sections copiées, notamment : cartes du 30/09, « Ancienne cible autonome retirée », « Saisie des paramètres — D-246 », bandeau du 08/10, « Contrat technique de phrase », et FMT-01 à 38 du ch. 08 identiques à RM-FMT-01 à 38. Au niveau des lignes : 97 lignes en 344 occurrences. | `recouvrements-mecaniques.tsv`, `copies-lignes.tsv` | P-13, P-14, H-19, QS-10, QF-04, X-13 |
| **L6-03** | **Les ch. 08 et 10 énoncent les mêmes règles.** 48 % du ch. 08 sont des règles, souvent déjà portées par une RM. Les règles FMT y sont copiées mot pour mot. D'autres n'existent qu'au ch. 08, sans identifiant : brouillons N=1, natures tours et séries, placement des pauses, grammaire de la phrase, relevés, fréquence de planification. | `classification/ch08.tsv` | S-01, S-03 à S-05, S-11, S-14, QS-04, QS-10, QS-15 |
| **L6-04** | **Le ch. 06 décrit les écrans une seconde fois, en parallèle du ch. 13**, avec au moins 6 divergences d'écran : Splash, Planifier, « Ajouter N exercice(s) », Récupération en Exécution directe, Référentiels, cibles tactiles 48 contre 44. | `classification/ch06.tsv` ; `divergences.tsv` | P-15, P-22, X-09 |
| **L6-05** | **Les conventions d'interface n'ont pas de domicile.** Elles sont réparties entre le ch. 06 (contrat d'affichage commun, Status/Badge, Titres affichés), le ch. 13 (§4 et 6 blocs placés après les contrats), des copies dans 10 chapitres (RG-10 à 13, D-239) et les DSF (RG-1 à RG-13). | `classification.tsv` (RENDU, CONVENTION-UI) | P-17, H-03, H-19, G8, G4 |
| **L6-06** | **Les définitions sont triplées et divergent** entre le glossaire (ch. 01), les concepts (ch. 04) et les rubriques « Définition » (ch. 09). | `classification/ch01-05.tsv`, `ch09-10.tsv` ; `divergences.tsv` | P-19, QF-09, QF-10, S-12 |
| **L6-07** | **Le ch. 13 entoure des contrats homogènes d'ajouts non contractuels** :<br>- l'inventaire liste 31 contrats sur 40 ;<br>- 6 blocs non contractuels suivent les contrats ;<br>- CE-UI-10 porte 9 notes datées, CE-T03-08 en porte 8 ;<br>- 8 blocs sont copiés dans 3 à 7 contrats ;<br>- 38 contrats sur 40 ne citent aucune RM. | `classification/ch13.tsv` | P-21, QS-09, QS-15 |
| **L6-08** | **La numérotation et la hiérarchie des titres sont cassées** : 48 sections TITRE-NUM, 12 tableaux coupés (S-11), 1 titre orphelin. | `classification.tsv` | QS-02, S-11 |
| **L6-09** | **La navigation et la traçabilité sont absentes** : aucune table des matières, aucun index des identifiants, besoins non identifiés, aucun lien règle → écran → recette ; même bandeau en tête de 6 chapitres. | QS-01, QS-06, QS-08, QS-09, QS-15 | idem |
| **L6-10** | **Le contenu historique est mêlé au contenu normatif** : 29 sections HISTORIQUE hors registre ; 48 sections qui utilisent un alias de version comme référence. | `classification.tsv` | H-06, H-07, H-18, QF-11, QF-12 |
| **L6-11** | **Des contraintes extérieures portent sur les noms de fichiers** (§2.2). | recherche dans le dépôt | — |
| **L6-12** | **30 paires divergentes dans des sections qu'aucun constat existant ne vise**, par exemple : recherche (ch. 08 contre RM-221) ; S08-0549 contre RM-016 ; S08-0456 contre RM-037 ; RM-144 contre RM-211 ; RM-114 contre RM-162. Elles sont listées, **pas tranchées**. | `divergences.tsv` | nouveaux (QR-9) |

### 1.3 Limites de la mesure

- La classification est un jugement de sous-agents, vérifié pour la forme (998 lignes, valeurs autorisées, identifiants existants). Les PARAPHRASE et DIVERGENCE sont des repérages vérifiés par lecture, **pas un audit exhaustif des contradictions**.
- Les seuils mécaniques sont des choix d'outil. Depuis la révision 2, ils ne décident plus d'aucune suppression (§5, R2).
- Plusieurs constats repris sont déjà corrigés en partie : S-03, S-04, S-05, S-13, P-03, P-05, H-02.

## 2. Évaluation du découpage actuel

### 2.1 Par chapitre

| Ch. | Verdict | Motif |
|---|---|---|
| 01 | Pertinent, à nettoyer | Domicile des définitions ; contient des règles, du périmètre et des copies |
| 02 | Pertinent | Contenu homogène ; besoins non identifiés (QS-06) |
| 03 | Pertinent, à réordonner | Compléments empilés ; règles et rendu hors domicile |
| 04 | Pertinent si recentré | Concepts, structures et relations ; les règles et le rendu en sortent |
| 05 | Pertinent, à renforcer | Seul domicile possible du périmètre par version (P-02, P-04, P-05, P-07, P-09, P-10) |
| 06 | Trop large aujourd'hui ; **domicile naturel de l'interface transverse** | Ses descriptions d'écran doublent le ch. 13. Il garde la navigation, l'inventaire et les captures, et reçoit les conventions d'interface (§4.3) |
| 07 | Pertinent, intouchable | Chronologique ; textes non réécrits (G5) |
| 08 | **Double source des règles** ; rôle à recentrer | Ses règles doublent le ch. 10 et ses champs d'écran doublent le ch. 13. Sa part de comportements par fonctionnalité (12 %) n'a pas d'autre domicile (§4.2) |
| 09 | Pertinent | 96 % restent en place |
| 10 | Pertinent, à élargir | Domicile de toutes les règles testables |
| 11 | Pertinent | Compléments à intégrer |
| 12 | Pertinent | Architecture et design system technique (K1) ; copies à retirer |
| 13 | Pertinent | Contrats homogènes ; ajouts à réintégrer ; inventaire incomplet |

**Conclusion.** Le découpage par type de contenu n'est pas en cause (IREB CPRE ; ISO/IEC/IEEE 29148). Les défauts viennent de quatre causes :
- l'**absence de frontière** entre les ch. 08, 10 et 13, et entre les ch. 06 et 13 ;
- l'**absence de domicile** des conventions d'interface ;
- l'**accrétion** des compléments ;
- la **copie** au lieu du renvoi.

### 2.2 Contraintes externes

| ID | Contrainte | Preuve | Conséquence |
|---|---|---|---|
| K1 | Un test du code lit la table « Design tokens canoniques » du ch. 12 par le nom du fichier | `src/shared/ui/__tests__/tokensSpecification.test.ts:13-17` | Nom du fichier du ch. 12 et section S12-0897 inchangés |
| K2 | Trois workflows lisent les ch. 06 à 13 par leur nom | `.github/workflows/kodjo-v14-s09-*.yml` | Noms des fichiers des ch. 06 à 13 conservés |
| K3 | Le manifeste de migration liste les chapitres | `scripts/kodjo/lib/initial-product-source-migrations.json:14-27` | Noms conservés |
| K4 | Le registre cite des chapitres par leur numéro (33 mentions, dont 15 du ch. 08) | ch. 07 ; G5 | Chaque chapitre cité conserve un objet reconnaissable ; table de correspondance publiée |
| K5 | Le code cite chapitres et contrats dans ses commentaires | `app/_layout.tsx`, `src/domain/sessions/*.ts` | Identifiants stables |
| K6 | PRE-4 et PRE-5 lisent des copies figées et citent « ch. NN, l. NNN » | design, contraintes transverses | Calendrier à arbitrer (QR-8) |
| K7 | 35 sections sont modifiées par les PR ouvertes | `dependances-pr.tsv` | Ces sections seulement attendent (§8.2) |

## 3. Options d'architecture

| Critère | A — 13 chapitres nettoyés sur place | B — Un dossier par domaine | **C — Couches à domiciles exclusifs (recommandée, révisée)** | D — C avec fusions 01+02+05 et 04+09 |
|---|---|---|---|---|
| Domicile unique par type | partiel : 08/10/13 et 06/13 restent ambigus | non pour les règles transverses | **oui** | oui |
| Fin de l'accrétion et des copies | oui | oui | oui | oui |
| Chapitres à lire pour un écran (QS : 10 aujourd'hui) | ≈ 6 | 1 à 2 | **≈ 4** : contrat, conventions (06), règles (10), données (09) | ≈ 4 |
| Respect de K1 à K5 | oui | non | **oui** : aucun fichier renommé ni vidé ; un seul fichier créé (annexe historique) | non |
| Volume déplacé entre fichiers | ≈ 0 | ≈ 15 800 lignes | **≈ 3 250 lignes**, plus ≈ 2 300 intégrées dans leur fichier | ≈ 6 000 lignes |
| Conflits avec les PR | faibles | maximaux | limités aux 35 sections touchées | élevés |

**Recommandation : option C révisée.** Par rapport à la révision 1, le ch. 08 garde un objet propre et aucun ch. 14 n'est créé. L'option B rompt K1 à K5. L'option D apporte un gain faible pour un risque élevé. L'option A laisse en place les doubles domiciles, à l'origine de S-01 à S-05.

## 4. Architecture cible (option C révisée)

### 4.1 Fichiers cibles

Aucun fichier n'est renommé (K1 à K3). Les titres proposés pour les ch. 01, 05, 06, 08 et 10 sont soumis à QR-2.

| Fichier | Titre proposé | Contenu exclusif | Taille estimée¹ |
|---|---|---|---|
| `01 – Vision Générale.md` | Vision et glossaire | Vision, principes ; **glossaire, seule source des définitions** ; table des termes canoniques et proscrits | ≈ 380 |
| `02 – Utilisateurs et besoins.md` | inchangé | Profils et besoins (B-xx si QR-7) | ≈ 230 |
| `03 – Parcours utilisateur.md` | inchangé | Parcours illustratifs selon le plan de domaine | ≈ 540 |
| `04 – Modèle fonctionnel.md` | inchangé | Concepts, structures et relations ; renvois au glossaire | ≈ 530 |
| `05 – Versions du produit.md` | Versions et périmètre | Vocabulaire MVP / V1 / tranche ; **matrice fonctionnalité → version** | ≈ 420 |
| `06 – Ecrans et navigation de la V1.md` | Interface : navigation, écrans et conventions communes | Navigation, inventaire écran → contrat, captures ; **conventions d'interface communes** ; règles RG des DSF, au fil de leur transfert (G4) | ≈ 2 000 |
| `07 – Registre des décisions de conception.md` | inchangé | Décisions chronologiques ; index thématique ajouté | ≈ 690 |
| `08 – Conception fonctionnelle détaillée.md` | Conception fonctionnelle par fonctionnalité | **Enchaînements, états et transitions** de chaque fonctionnalité, selon le plan de domaine ; **cite** les règles du ch. 10, sans les énoncer | ≈ 600 |
| `09 – Modèle de données fonctionnel.md` | inchangé | Entités, attributs, invariants, intégrité, cycles de vie des données, migration | ≈ 1 310 |
| `10 – Processus métier et règles métier transverses.md` | Règles métier et calculs | **Toutes les règles testables** (RM, RM-FMT, règles venues des ch. 06 et 08), calculs, formats d'affichage, recettes REC | ≈ 1 970 |
| `11 – API fonctionnelles.md` | inchangé | Contrats de services | ≈ 420 |
| `12 – Architecture technique.md` | inchangé | Architecture ; design system technique (Screen Shells, composants, design tokens : K1) | ≈ 1 620 |
| `13 – Contrats d’écran.md` | inchangé | 40 contrats selon le plan de domaine, inventaire complet ; ajouts réintégrés dans leur contrat | ≈ 4 820 |
| `Annexe – Historique des consolidations.md` | *nouveau, non normatif* | Journaux, preuves datées, anciennes cibles retirées, à l'identique | ≈ 190 |

¹ En lignes, avant dédoublonnage.

### 4.2 Rôle cible du ch. 08 (réexamen)

| Option | Description | Évaluation |
|---|---|---|
| a. Table de renvoi (révision 1) | Le ch. 08 ne contient plus que l'ancien → nouveau emplacement | Perd un contenu utile sans autre domicile (déroulement d'une Exécution, cycle de vie d'une Séance) ; 66 liens entrants et 15 mentions du registre pointeraient vers une table |
| **b. Conception par fonctionnalité (recommandée)** | Pour chaque fonctionnalité, selon le plan de domaine : déclencheurs, enchaînement des étapes, états et transitions, cas d'interruption. Chaque règle appliquée est **citée** par son identifiant (RM-xxx). Une règle testable seule (condition → résultat) va au ch. 10. Un champ ou un contrôle d'écran va au ch. 13 | Frontière vérifiable (« le ch. 08 n'énonce aucune règle, il les cite ») ; garde la vue d'ensemble que ni le ch. 10, liste de règles, ni le ch. 13, découpé par écran, ne donnent ; respecte K4 |
| c. Conservé en l'état | Ch. 08 et ch. 10 gardent tous deux des règles | Maintient la double source (L6-03) |

**Effet de l'option b :**
- le ch. 08 garde 23 % de ses lignes (comportements et titres) ;
- il envoie 904 lignes de règles au ch. 10, 188 au ch. 13, 172 au ch. 04 et 63 au ch. 09 ;
- il reçoit 182 lignes de comportements venues des ch. 06 et 04.

Les règles sans identifiant qui quittent le ch. 08 restent sans identifiant (G6). Elles sont inscrites à l'index des règles sans identifiant (6G).

### 4.3 Conventions d'interface : ch. 06 plutôt qu'un ch. 14 (réexamen)

| Option | Évaluation |
|---|---|
| Ch. 14 dédié (révision 1) | Crée un 14e fichier et un nouveau domicile. Sa justification tenait au volume (≈ 950 lignes), mais ce volume incluait le design system technique du ch. 12, qui relève de l'architecture |
| Partie I du ch. 13 | Le ch. 13 dépasserait 5 200 lignes ; ces conventions ne sont pas des contrats |
| **Ch. 06 (recommandée)** | Une fois ses descriptions d'écran transférées au ch. 13, le ch. 06 traite déjà de l'interface dans son ensemble : navigation, inventaire, captures. Ses propres conventions (contrat d'affichage commun, Status/Badge, Titres affichés) y sont déjà. Aucun nouveau fichier ; 415 lignes reçues, dont 297 du ch. 13 §4 |

Le design system technique (Screen Shells, composants, design tokens) reste au ch. 12. Le rendu propre à un écran reste dans son contrat. Figma reste la référence du rendu (G8).

*Variante soumise à QR-3 :* garder le ch. 13 §4 « Règles communes » dans le ch. 13, où les contrats le citent (§4.x). Cette variante crée deux domiciles pour les conventions ; elle n'est pas recommandée.

### 4.4 Plan de domaine commun

Les ch. 03, 04, 08, 09, 10, 11 et 13 suivent le même ordre de parties :

0. Produit et gouvernance
1. Séances
2. Exercices
3. Paramètres d'exécution
4. Composition
5. Circuits
6. Formats
7. Bilatéralité
8. Exécution
9. Médias pendant l'Exécution
10. Planification
11. Suivi et synthèse
12. Profil et préférences
13. Référentiels
14. Calculs transverses
15. Interface transverse
16. Hors MVP
17. Technique

Une partie vide n'est pas créée. La colonne `partie_cible` de `correspondance.tsv` donne la partie de chaque section.

### 4.5 Règles de domicile (remplacent le tableau de design G2 après validation)

| Type de contenu | Domicile | Exceptions |
|---|---|---|
| Vision | 01 | — |
| Définition | 01 (glossaire) ; structures et relations : 04 | Rubriques « Définition » du ch. 09 conservées ; renvoi seulement si identiques au glossaire |
| Besoin | 02 | — |
| Parcours | 03 | — |
| Périmètre par version | 05 | Le périmètre propre à un parcours, une donnée, une API, une technique ou un écran reste avec son objet |
| Navigation, inventaire, captures, conventions d'interface | 06 | Inventaire des contrats : 13 ; design system technique : 12 |
| Décision | 07 | Résumés de décisions hors registre laissés en place, à remplacer par des renvois |
| Comportement d'une fonctionnalité (enchaînement, états) | 08 | Comportements des ch. 09 à 13 : restent chez eux |
| Règle testable, calcul, recette | 10 | Règles d'intégrité des données (09), de service (11), techniques (12), propres à un écran (13) |
| Donnée | 09 | Persistance technique : 12 |
| API | 11 | — |
| Architecture, design system | 12 | — |
| Contrat d'écran | 13 | — |
| Historique | Annexe | Registre : 07 |

### 4.6 Invariants

1. Les identifiants D-, RM-, RM-FMT-, CE-, REC-, CIR-, DM- et API- ne changent pas. Chacun reste défini une seule fois.
2. Le texte du registre ne change pas.
3. Un déplacement ne réécrit pas le texte. Seuls changent les titres, les renvois de localisation et les cibles de liens.
4. Deux passages divergents restent tous deux en place, côte à côte, marqués `À CLARIFIER` (G3).
5. Un passage n'est remplacé par un renvoi qu'après **équivalence complète** : même texte, même portée, autorité compatible.
6. Une ligne ne change jamais de portée (MVP courant / hors MVP / historique) ni d'autorité (normative / historique).
7. Un DSF reste applicable jusqu'au transfert vérifié de ses règles (G4).

## 5. Correspondance section par section

[correspondance.tsv](correspondance.tsv) contient une ligne par section, soit 998 lignes.

**Colonnes :**
- identification : `id`, `chapitre`, `niveau`, `titre`, `lignes`, `type`, `domaine` ;
- destination : `action`, `fichier_cible`, `partie_cible`, `etape`, `classe` ;
- dédoublonnage : `renvoi_vers`, `divergences`, `copie` ;
- défauts : `defauts`, `traitements` ;
- contexte : `portee`, `pr` ;
- traçabilité de la règle appliquée : `regle`, `justification`.

**Règles (`outils/correspondance-cible.mjs`)** :
- **R1** — Exception nommée : S12-0897 (design tokens, K1).
- **R2 (révisée)** — La similarité ≥ 0,9 (6-grammes de mots) ne fait que désigner un candidat. Le renvoi exige trois conditions :
  - **toutes** les lignes de contenu de la section figurent à l'identique dans la copie conservée ;
  - même portée ;
  - autorité compatible : une section normative ne pointe pas vers une copie non normative ou archivée.

  Une section qui définit un identifiant n'est jamais remplacée, et le registre n'est jamais concerné. Si une condition manque, la section suit R3 ou R4 et la colonne `copie` décrit l'écart.
- **R3** — Historique hors registre : la section va dans l'annexe.
- **R4** — Domicile du type (§4.5) :
  - **CONSERVER** si la section est déjà dans son domicile ;
  - **INTÉGRER** si c'est un complément empilé ;
  - **DÉPLACER** sinon.

**Bilan des actions :**

| Action | Sections | Lignes | Étape |
|---|---|---|---|
| CONSERVER | 589 | 9 982 | — (défauts traités selon `traitements`) |
| RENVOI (équivalence complète vérifiée) | 21 | 134 | 6D |
| INTÉGRER (dans le même fichier) | 110 | 2 284 | 6E |
| DÉPLACER vers le ch. 06 (conventions) | 11 | 380 | 6F1 |
| DÉPLACER depuis le ch. 08 | 96 | 1 412 | 6F2 |
| DÉPLACER du ch. 06 vers le ch. 13 | 46 | 586 | 6F3 |
| DÉPLACER (autres) | 93 | 873 | 6F4 |
| ARCHIVER | 32 | 190 | 6F5 |

Copies partielles conservées : 11 (colonne `copie`). Elles se répartissent ainsi :
- 3 ont des lignes propres ;
- 8 diffèrent par la portée ou l'autorité, par exemple la même phrase sous un titre « hors MVP » dans une section et sous un titre courant dans une autre.

**Part de chaque chapitre qui reste en place :**

| 01 | 02 | 03 | 04 | 05 | 06 | 07 | 08 | 09 | 10 | 11 | 12 | 13 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 72 % | 92 % | 84 % | 66 % | 86 % | 57 % | 100 % | 23 % | 96 % | 93 % | 88 % | 98 % | 93 % |

**Principaux flux (en lignes) :**

| Flux | Lignes |
|---|---|
| 08 → 10 | 904 |
| 06 → 13 | 586 |
| 13 → 06 | 297 |
| 06 → 10 | 199 |
| 08 → 13 | 188 |
| 08 → 04 | 172 |
| 06 → 08 | 151 |
| 08 → 09 | 63 |
| 01 → 05 | 61 |

**À lever à l'exécution :**
- Une section dont la justification porte la mention « à scinder si nécessaire » se scinde sans changement de texte, et la scission est consignée.
- Une section du ch. 06 classée RÈGLE va au ch. 10, sauf si elle ne concerne qu'un écran doté d'un contrat : elle va alors au ch. 13.
- Toute correction de destination est consignée dans `correspondance.tsv`, avec la règle `R1` et sa justification, **sans point d'arrêt** (§8.3).

## 6. Opérations planifiées

| Famille | Opération | Volume | Étape |
|---|---|---|---|
| **Déplacements** | Règles des ch. 08 et 06 vers le ch. 10 | 1 103 lignes | 6F2, 6F4 |
| | Écrans du ch. 06 et champs du ch. 08 vers les contrats du ch. 13, avec les divergences conservées | 774 lignes | 6F3, 6F2 |
| | Conventions du ch. 13 §4 et des autres chapitres vers le ch. 06 | 415 lignes | 6F1 |
| | Comportements des ch. 06 et 04 vers le ch. 08 | 182 lignes | 6F4 |
| | Concepts vers 04, données vers 09, périmètre vers 05, parcours vers 03 | — | 6F2, 6F4 |
| | Historique vers l'annexe | 190 lignes | 6F5 |
| **Regroupements** | Compléments empilés intégrés dans leur rubrique (P-21, P-22), dont CE-UI-10 et CE-T03-08 ; les 6 blocs placés après les contrats | 110 sections | 6E |
| **Dédoublonnages** | Sections à équivalence complète | 21 sections | 6D |
| | Lignes de même contexte | 89 occurrences | 6D |
| | Lignes « à vérifier » : la revue établit au cas par cas, dans l'étape, que le renvoi ne change ni la règle ni la portée ; sinon l'occurrence reste en place | 158 occurrences | 6D |
| | Copies partielles : les écarts sont rapprochés dans un tableau ; une différence de règle devient une divergence (6J) | 11 sections | 6D |
| | FMT-01 à 38 (ch. 08) : la copie conservée est RM-FMT (ch. 10) | 5 sections | 6D, 6F2 |
| **Navigation** | Tables des matières ; INDEX.md ; inventaire des 40 contrats ; inventaire écran → contrat ; renumérotation des **titres de section** (pas des identifiants) ; tableaux coupés réparés | 14 fichiers | 6C, 6G |
| **Traçabilité** | Table de correspondance publiée dans INDEX.md (K4, K6) ; index des identifiants et du registre (générés) ; index des règles sans identifiant ; rubrique « Règles applicables » des contrats, limitée aux RM déjà citées ou démontrées | 782 identifiants, 131 sections, 40 contrats | 6G |

## 7. Garantie de conservation : texte, sens, références, autorité

**Ce qui est conservé :**
- toutes les lignes de contenu normatif ;
- toutes les décisions ;
- toutes les règles (identifiées ou non) et leur **portée** ;
- leur **autorité** (normative ou historique ; marqueurs `À CLARIFIER`, « remplacée par », « prévaut ») ;
- leurs **références** (identifiants cités et définis).

**Contrôles automatiques de chaque étape** (ils durent moins d'une minute) :

| Contrôle | Outil | Critère | Bloquant |
|---|---|---|---|
| C1 Identifiants | `verifier-conservation.mjs` | Chaque identifiant défini une seule fois ; aucun identifiant nouveau sans justification | oui |
| C2 Texte | idem | Chaque ligne de référence présente à l'identique (N1), aux renvois de localisation près (N2), ou justifiée (motif contrôlé) | oui |
| C3 Copies retirées | idem | Liste des baisses d'occurrences, rapprochée de `copies-lignes.tsv` | informatif |
| C4 Registre | idem | Texte des 393 décisions identique | oui |
| **C5 Portée** | idem | Aucune ligne ne gagne une portée (hors MVP → courant, historique → normatif) ; une ligne non retirée n'en perd aucune | oui |
| **C6 Autorité** | idem | Aucune ligne portant un marqueur d'autorité ne disparaît | oui |
| **C7 Références** | idem | Chaque identifiant cité reste cité ; aucun renvoi vers un identifiant disparu | oui |
| C8 Place | `verifier-correspondance.mjs` | Chaque section de l'étape est dans son fichier cible ; chaque renvoi pointe vers la copie conservée | oui |
| C9 Liens | `links.mjs` | Aucune nouvelle anomalie (2 anomalies historiques connues) | oui |
| C10 Rédaction (6K) | `verifier-redaction.mjs` | Nombres et unités, identifiants, libellés, négations et modalités identiques entre l'ancien et le nouveau texte ; sinon la correction est classée FONCT avec sa décision | oui |
| C11 PR | `git merge-tree` | Conflits listés par section | informatif |
| C12 OpenSpec | `openspec validate --strict` | Réussite | oui |

**Ce que les contrôles ne prouvent pas, et comment c'est couvert :**
- Un texte identique, placé dans un contexte de même portée, garde son sens : C2 et C5 le garantissent mécaniquement.
- Le sens peut aussi changer à cause du **voisinage**, par exemple une règle placée sous une autre règle qui la restreint. Pour le couvrir, la revue de l'étape lit le diff de chaque section déplacée, dans son nouveau voisinage. C'est une lecture, pas une validation supplémentaire.

**Autotests (17/10) :**
- `verifier-conservation.mjs` :

  | Scénario | Résultat |
  |---|---|
  | Arbre inchangé | vérifié |
  | Ch. 02 fusionné dans le ch. 01 | vérifié |
  | Parcours hors MVP placés sous un titre courant | **C5 en échec** (56 lignes) |
  | Règle courante placée dans l'annexe | **C5 en échec** |
  | D-246 effacée | **C1, C2, C4, C6 et C7 en échec** |
  | `À CLARIFIER` retiré | **C2 et C6 en échec** |

- `verifier-redaction.mjs` : un changement d'espaces et la levée d'un pronom ambigu sont acceptés ; « doit » devenu « peut », une négation retirée et un identifiant changé sont **rejetés**. Rejouées sur les 12 corrections fonctionnelles B1 à B5, les 12 sont toutes reconnues comme non rédactionnelles.
- `verifier-correspondance.mjs` : les sections conservées sont conformes ; les sections non encore déplacées sont signalées.

## 8. Plan d'exécution

### 8.1 Étapes

| Étape | Périmètre | Classe | Dépend de | Contrôles |
|---|---|---|---|---|
| **6B Préparation** | Écriture de `appliquer-deplacements.mjs` (déplacement d'une section à l'identique, d'après la table) et de `reecrire-liens.mjs` ; révision 3 de design (G1, G2) | DOC-AUTORITÉ | autorisation globale (§8.3) | autotest hors dépôt |
| **6C Corrections dans chaque fichier** | Titres de section, niveaux, numérotation ; 12 tableaux coupés ; titre orphelin ; renvois internes vides ou rompus ; D-047 ; inventaire des 40 contrats ; tables des matières | DOC | 6B | C1–C9 |
| **6D Dédoublonnage** | 21 renvois ; 89 occurrences de lignes ; examen des 158 occurrences « à vérifier » et des 11 copies partielles ; FMT ; bandeaux ; titres « D-246 » ; renvois absents ajoutés | DOC | 6C | C1–C9 ; C3 rapproché de `copies-lignes.tsv` |
| **6E Intégration** | 110 sections empilées et 6 blocs placés après les contrats, intégrés dans leur rubrique ; scissions dans un même fichier | DOC | 6D | C1–C9 |
| **6F1 Conventions vers le ch. 06** | 11 sections, dont le ch. 13 §4 | DOC | 6E | C1–C9 |
| **6F2 Recentrage du ch. 08** | 96 sections vers 10, 13, 04, 09, 05 et 06 | DOC | 6F1 | C1–C9 ; divergences S-01, S-14, S-15, S-18, S-19 côte à côte |
| **6F3 Écrans du ch. 06 vers le ch. 13** | 46 sections | DOC | 6F2 | C1–C9 ; 6 divergences d'écran côte à côte |
| **6F4 Autres déplacements** | 93 sections | DOC | 6F3 | C1–C9 |
| **6F5 Annexe historique** | 32 sections | DOC | 6F4 | C1–C9 ; C5 : aucune ligne normative dans l'annexe |
| **6G Navigation et traçabilité** | INDEX, table de correspondance, index des identifiants, du registre et des règles sans identifiant ; inventaire écran → contrat ; « Règles applicables » | DOC ; DOC-AUTORITÉ pour « Règles applicables » | 6F5 | C1–C9 ; chaque RM citée existe |
| **6H Reports antérieurs** | 214 lignes « à examiner » de R-06 ; alias ; RM-131 (#370) ; ch. 08 l. 1573 (#371) ; PRODUCT.md (Q-C) | DOC ou FONCT-ARBITRÉ | 6G | méthode des lots 3 et 5 ; C10 |
| **6I Transfert des DSF** | RG-1 à RG-13 et autres règles applicables des DSF vers le ch. 06, règle par règle (G4) | DOC | 6F1 | même commit pour le transfert et le renvoi |
| **6K Corrections rédactionnelles** | Liste du §10.1 | DOC | 6E (peut suivre chaque fichier) | C10 et C1–C9 |
| **6J Décisions produit** | Liste du §10.2 ; 204 divergences | FONCT-À-ARBITRER | Hermann | selon la décision |

### 8.2 Dépendances réelles aux PR

[dependances-pr.tsv](dependances-pr.tsv) donne les sections modifiées par chaque PR. Chaque PR est rattachée à sa section par le titre exact.

| PR | Sections | Exemples |
|---|---|---|
| #363 | 5 (ch. 06) | « États de référence actuels », « Formulaire — vues principales et résumé » |
| #370 | 16 (13 chapitres) | S08-0460 « Brouillon, bascules et normalisation » (118 lignes), CE-UI-10 (44), RM du ch. 10 §4 (20) |
| #371 | 16 (ch. 06, 07, 08, 13) | 1 à 4 lignes par section (CE-T03-01/02/04/06/07, CE-UI-02/03/10…) |

**Règle :** une étape traite toutes ses sections, **sauf** celles que modifie une PR encore ouverte. Celles-ci sont laissées en place et reprises après la fusion ou la fermeture de la PR, dans un rattrapage de l'étape. Ce rattrapage passe par les mêmes contrôles, sans autorisation nouvelle.

- Sur les 35 sections concernées, 24 sont conservées en place : seuls leurs défauts sont traités.
- 11 sont à intégrer ou à déplacer : 5 en 6E, 2 en 6F2, et 1 chacune en 6F1, 6F3, 6F4 et 6F5.

Aucune étape n'est donc bloquée en entier.

### 8.3 Points d'arrêt

| Moment | Arrêt | Ce qui est demandé |
|---|---|---|
| Avant 6B | **Une seule autorisation globale** | Décisions QR-1 à QR-9, qui valent autorisation des étapes DOC 6B à 6I et 6K |
| Entre deux étapes | **aucun** | Publication sur la branche après réussite des contrôles automatiques ; journal d'étape dans `tasks.md` |
| Échec d'un contrôle bloquant que l'étape ne peut pas corriger à l'identique | arrêt de l'étape seule | Constat consigné ; question ajoutée à la liste 6J |
| Décisions produit (6J) | **une liste groupée** | Questions présentées ensemble, et non une à une |
| Fin de 6G | une revue indépendante | Revue de l'ensemble restructuré |

## 9. Couverture des défauts structurels

### 9.1 Par section

Chaque défaut relevé dans une section a un traitement concret dans la colonne `traitements` de `correspondance.tsv`, **quelle que soit l'action de la section**. Le contrôle de la table donne : 0 défaut sans traitement, 0 code non couvert.

| Défaut | Traitement | Étape |
|---|---|---|
| TITRE-NUM | renuméroter le titre de section | 6C |
| TITRE-DATÉ | retitrer selon l'objet ; la date passe dans le texte ou au registre | 6C |
| HORS-DOMICILE | placer la partie hors domicile dans son domicile | étape du déplacement, ou 6E s'il s'agit d'une scission dans le même fichier |
| MÉLANGE | scinder par type de contenu, sans changer le texte | idem |
| DOUBLON | renvoi après équivalence complète ; sinon rapprochement, écarts conservés | 6D |
| SANS-ID | index des règles sans identifiant ; numérotation seulement si QR-7 | 6G |
| TABLEAU-COUPÉ | réparer ; replacer le fragment intercalé | 6C |
| ORPHELIN | supprimer ou rattacher le titre | 6C |
| ALIAS | renvoi au lieu de l'alias (table 2.6) | 6H |
| RENVOI-ABSENT | ajouter la citation de la règle source | 6D |
| `AUTRE:` identifiants | copie FMT/RM-FMT en 6D ; homonymies (R-01 à R-05) levées par le préfixe du contexte, sans renumérotation | 6C |
| `AUTRE:` compléments et fragments | intégrer ou replacer | 6E |
| `AUTRE:` renvois et titres | réparer | 6C |
| `AUTRE:` typographie | correction rédactionnelle | 6K |
| `AUTRE:` fond (portée, statut, contradiction) | question produit, signalée sans être tranchée | 6J |

**Répartition des 1 180 traitements :**

| Étape | Traitements |
|---|---|
| 6C | 312 |
| 6D | 335 |
| 6E | 164 |
| 6F | 125 |
| 6G | 131 |
| 6H | 48 |
| 6J | 59 |
| 6K | 6 |

Sur ces traitements, 302 concernent des sections qui restent en place.

### 9.2 Par constat

| Défauts | Traitement | Étape |
|---|---|---|
| L6-01, QS-03, QS-11, P-21, P-22, H-14 | traité | 6E ; G5 ; H-14 encadré par D-376 |
| L6-02, P-13, H-19, QS-10, QF-04, X-13 | traité | 6D avec équivalence complète. Le texte de QS-10 (trois règles au même texte) exige une décision : 6J |
| P-14 | traité (rapprochement) ; ordre à décider | 6D ; 6J |
| L6-03, QS-04, S-11 | traité | 6F2 ; 6C |
| L6-04, P-15, X-09 | traité (structure) ; divergences | 6F3 ; 6J |
| L6-05, P-17, H-03 | traité | 6F1 ; 6I ; G8 |
| L6-06, P-19, QF-09, QF-10, S-12 | traité (domicile) ; définitions divergentes | 01 ; 6K pour les termes déjà proscrits par le glossaire ; 6J pour le reste |
| L6-07, QS-09, QS-15 | traité | 6C, 6E, 6G |
| L6-08, QS-02 | traité | 6C |
| L6-09, QS-01, QS-06, QS-08 | traité | 6C, 6G ; QS-06 selon QR-7 |
| L6-10, H-06, H-07, H-18, QF-11, QF-12 | traité | 6F5 ; 6H ; 6K |
| L6-11 | contrainte respectée | §2.2 |
| L6-12 | décision | QR-9, 6J |
| QS-05, H-15, H-16, H-17, H-20, P-12, P-16, P-18 | traité en partie | 6I (DSF), 6H (PRODUCT.md). Les documents de traçabilité hors chapitres ne sont pas restructurés (G7) |
| QS-07, QF-03, R-03, R-06, R-07, H-13, S-10 | déjà traité aux lots 1 et 3 | reste : 214 lignes (6H) |
| R-01, R-02, R-04, R-05 ; H-01, H-02 ; H-04, H-05, H-08 à H-12, R-08 | déjà traité aux lots 1, 2 et 4 et par les arbitrages du 16/10 | borne « jusqu'à D-255 » : hors lot 6 |
| P-01 à P-11 | traité (domicile du périmètre) ; contenu | 6F4 ; 6J |
| P-20, S-09 | traité | 6D, 6F2 |
| S-01 à S-05, S-14, S-15, S-18 à S-22 | décision (selon la classification, S-03, S-04 — D-388 — et S-05 — D-380 — sont déjà corrigées dans le texte) | 6J ; les passages restent côte à côte |
| QS-12, QS-13, QS-14 ; QF ; QC ; X-xx | voir §10 | 6K ou 6J |

**Reports au lot 6 :**

| Report | Étape |
|---|---|
| Titres « D-246 » | 6D |
| Inventaire du ch. 13 | 6C |
| Alias | 6H |
| PRODUCT.md | 6H |
| RM-131 | 6H |
| Ch. 08 l. 1573 | 6H |
| 214 lignes de R-06 | 6H |
| P-13, P-14, H-19, QS-10 | 6D |
| P-21, P-22 | 6E |
| D-047 | 6C |
| Message de migration ; nombre d'Exercices | 6J |

## 10. Défauts de qualité restants

**Principe de séparation :** une correction est **rédactionnelle** (6K, DOC) si elle laisse inchangés les cinq éléments porteurs de sens contrôlés par C10 :
- nombres et unités ;
- identifiants ;
- libellés ;
- négations ;
- modalités.

Elle s'appuie alors sur une source existante. Dans le cas contraire, c'est une **décision produit** (6J).

Les corrections 6K sont écrites en JSON (`ancien`, `nouveau`), comme aux lots 1 à 5. Elles passent par C10 puis par C1–C9. Elles sont couvertes par l'autorisation globale.

### 10.1 Corrections rédactionnelles (6K)

| Défaut | Correction | Méthode |
|---|---|---|
| QS-14, QF-13 — espaces manquantes (≈ 326), accords (≈ 38) | Passe scriptée ; C10 rejette toute modification de nombre ou d'unité | script et JSON |
| QF-17 — attendus de recette écrits « 3min15s » | Format normatif existant « 3 min 15 s » (ch. 08, format des durées) | JSON ; C10 contrôle les nombres et unités |
| QF-06 — pronoms ambigus (par exemple CE-T03-04 §12 « ✕ le conserve ») | Remplacer le pronom par son référent quand le texte le désigne sans ambiguïté | JSON ; sinon 6J |
| QF-09, QF-10 — termes non stabilisés, termes proscrits par le glossaire §8 | Terme canonique déjà fixé par le glossaire ou par une décision (par exemple D-209 et D-387 pour Circuit/Tour) | JSON avec citation |
| QF-11, H-07 — alias de version | Renvoi vers la section (table 2.6) | 6H |
| QF-12 — méta-texte de rédaction dans des prescriptions (« prompt », « ci-dessous ») | Retrait du méta-texte non normatif ; texte d'origine conservé dans l'annexe | JSON ; C2 justifié HISTORIQUE-ARCHIVE |
| QF-15 — unité absente sur une borne | Unité ajoutée seulement si la même règle ou sa source la donne | JSON avec source ; sinon 6J |
| QF-01, QF-02, QF-05 — règles longues à plusieurs obligations | Découpage en puces **sans changer les mots**, une obligation par puce ; aucune nouvelle numérotation sans QR-7 | JSON ; C10 |
| QS-12 — divergence interne due à une révision non propagée | Si une décision explicite tranche : alignement (FONCT-ARBITRÉ, déjà couvert par la décision) ; sinon 6J | lots 5 |

### 10.2 Décisions produit (6J, liste groupée pour Hermann)

| Défaut | Décision nécessaire |
|---|---|
| QF §2.0 — convention d'obligation | Choix des mots (« doit » / « peut » / présent descriptif). Son application ultérieure est rédactionnelle (6K) |
| QF-07, QF-08 — termes vagues, « si nécessaire » | Valeur ou condition précise |
| QF-14 — négations et absolus | Aucune réécriture systématique proposée ; cas signalés seulement si ambigus |
| QF-16, QC-14 — tolérances et précision temporelle | Valeurs chiffrées |
| QF-17 (cas ≥ 1 h), QF-19 — format au-delà d'une heure, arrondi de l'inversion | Règle |
| QC-01 à QC-05 — arrière-plan, mode silencieux, appel entrant, reprise, persistance | Comportements et contrat d'écran de reprise |
| QC-06 — parcours au format Cockburn | Choix de format (rédaction ensuite en 6K) |
| QC-07 à QC-13, QC-15 — notification, sauvegarde, fuseau, migration, écran actif, planification, données de santé, contraste | Exigences |
| QS-13 — statut fermé du registre (Active / Amendée / Remplacée / Retirée) | Décision de gouvernance (DOC-AUTORITÉ) |
| QS-10, P-14, S-01 à S-22, L6-12, et les 204 divergences | Décision par paire, les deux passages restant en place |
| Contrat d'écran du message de migration ; emplacement du nombre d'Exercices (D-399) | Décision |

## 11. Questions à trancher (autorisation globale)

| ID | Question | Recommandation |
|---|---|---|
| QR-1 | Architecture cible : A, B, C révisée ou D | C révisée |
| QR-2 | Titres proposés pour les ch. 01, 05, 06, 08 et 10 ; rôle du ch. 08 (§4.2 : a, b ou c) | titres proposés ; rôle b |
| QR-3 | Conventions d'interface : ch. 06 avec le ch. 13 §4, ch. 06 sans le §4, ch. 14 ou ch. 13 partie I | ch. 06 avec le ch. 13 §4 |
| QR-4 | Historique non normatif : annexe ou suppression | annexe |
| QR-5 | PR : sections touchées laissées en place jusqu'à la fusion de la PR (§8.2) | oui |
| QR-6 | Rôle de PRODUCT.md (Q-C) | synthèse sans ordre de référence |
| QR-7 | Nouvelle numérotation : B-xx seulement ; B-xx et règles par famille ; aucune | B-xx seulement |
| QR-8 | Calendrier par rapport à PRE-4 et PRE-5 (K6) | à décider par Hermann |
| QR-9 | 30 divergences nouvelles : constats ajoutés au diagnostic avant 6B, ou directement en 6J | au diagnostic, avant 6B |

## 12. Hypothèses non démontrées

- Le gain de lecture (« ≈ 4 chapitres pour un écran ») et les tailles cibles sont estimés, avant dédoublonnage.
- La classification n'a pas été relue ligne à ligne par un second lecteur. La revue peut en échantillonner une partie.
- La portée est lue dans les titres par motifs (« hors MVP », « V2 », « historique »…). Une portée écrite seulement dans le corps d'un paragraphe n'est pas détectée par C5 : elle reste dans la ligne elle-même, qui est conservée à l'identique (C2).
- Le rattachement des PR aux sections se fait par titre exact (37 rattachements sur 37). Une PR modifiée après le 17/10 doit être recalculée avec `dependances-pr.mjs`.
