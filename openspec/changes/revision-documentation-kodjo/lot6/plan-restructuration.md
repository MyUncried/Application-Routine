# Lot 6A — conception de la restructuration documentaire

- **Nature :** conception seulement. **Aucun document produit n'est modifié** par le lot 6A ; aucune section n'est déplacée.
- **Base analysée :** `docs/Specifications-fonctionnelles/` au commit `49526414` (`docs/openspec-revision`), dont les chapitres intègrent les lots 1 à 5 et les arbitrages D-376 à D-401. `main` distant : `6656fefc`, inchangé.
- **PR ouvertes prises en compte :** #363 (`d2386c8d`, ch. 06), #370 (`6cf3634a`, 13 chapitres et 3 DSF), #371 (`2c050d0e`, brouillon : ch. 06, 07, 08, 13 et 2 DSF).
- **Statut :** proposition soumise à Hermann et à la revue indépendante. L'architecture recommandée n'est **pas** une décision ; les questions QR-1 à QR-9 (§10) doivent être tranchées avant toute exécution.

## Livrables du lot 6A

| Fichier | Contenu | Produit par |
|---|---|---|
| [inventaire-sections.tsv](inventaire-sections.tsv) | 998 sections des 13 chapitres (titres de niveau 1 à 3 ; un contrat du ch. 13 = une section) : plage de lignes, taille, identifiants définis, renvois, titre daté, liens entrants | `outils/inventaire-structure.mjs` |
| [base-conservation.tsv](base-conservation.tsv) | 782 identifiants définis et 7 441 lignes de contenu (empreinte), rattachés à leur section : état de référence de la conservation | `outils/inventaire-structure.mjs` |
| [classification/](classification/) et [classification.tsv](classification.tsv) | Pour chaque section : type de contenu, domaine, caractère normatif, accrétion, recouvrements vérifiés, constats existants, défauts structurels | 6 sous-agents en lecture seule, brief `outils/brief-L6A-classification.md` |
| [recouvrements-mecaniques.tsv](recouvrements-mecaniques.tsv) | 228 paires de sections dont le texte se recouvre à ≥ 50 % (6-grammes de mots) | `outils/recouvrements-sections.mjs` |
| [correspondance.tsv](correspondance.tsv) | **Table de correspondance** : destination de chacune des 998 sections, action, étape, renvois et divergences à conserver | `outils/correspondance-cible.mjs` |
| [copies-lignes.tsv](copies-lignes.tsv) | 97 lignes (paragraphes ou lignes de tableau) copiées dans plusieurs sections ; occurrence à conserver et 247 occurrences à remplacer par un renvoi | `outils/copies-lignes.mjs` |
| [divergences.tsv](divergences.tsv) | 204 paires de sections au contenu divergent, à conserver côte à côte jusqu'à décision (design G3) | consolidation de la classification |
| `outils/verifier-conservation.mjs`, `outils/verifier-correspondance.mjs` | Contrôles de chaque étape d'exécution (§7) | lot 6A, autotestés |

Les tableaux ci-dessous résument ces fichiers ; **en cas d'écart, le fichier fait foi**.

## 1. Analyse structurelle des 13 chapitres

### 1.1 Mesures

| Ch. | Lignes | Sections | Mots | Titres datés | Sections empilées¹ | Type dominant (part des mots)² | Contenu hors domicile² |
|---|---|---|---|---|---|---|---|
| 01 | 449 | 29 | 7 114 | 1 | 7 | CONCEPT 71 % (glossaire) | PÉRIMÈTRE 12 %, RÈGLE 8 % |
| 02 | 246 | 24 | 2 554 | 3 | 5 | BESOIN 86 % | PARCOURS 5 % |
| 03 | 563 | 81 | 6 374 | 10 | 13 | PARCOURS 63 % | PÉRIMÈTRE 11 %, RÈGLE 10 %, RENDU 7 % |
| 04 | 459 | 36 | 5 965 | 1 | 9 | CONCEPT 59 % | RÈGLE 16 %, RENDU 9 %, DONNÉE 5 % |
| 05 | 284 | 32 | 3 378 | 10 | 20 | PÉRIMÈTRE 77 % | RENDU 15 % |
| 06 | 2 794 | 182 | 24 363 | 11 | 20 | CONTRAT 26 %, NAVIGATION 19 % | CONVENTION-UI 12 %, RÈGLE 9 %, RENDU 9 % |
| 07 | 688 | 48 | 23 677 | 23 | 35 | DÉCISION 99 % | — |
| 08 | 1 850 | 160 | 25 822 | 4 | 68 | RÈGLE 48 % | CONTRAT 16 %, CONCEPT 7 %, CONVENTION-UI 4 % |
| 09 | 1 274 | 135 | 15 847 | 2 | 21 | DONNÉE 61 % | RÈGLE 18 %, RENDU 4 % |
| 10 | 784 | 79 | 13 323 | 5 | 16 | RÈGLE 60 %, CALCUL 22 % | RENDU 5 % |
| 11 | 463 | 38 | 8 130 | 2 | 14 | API 79 % | RÈGLE 6 %, RENDU 6 % |
| 12 | 1 623 | 97 | 21 604 | 7 | 23 | ARCHITECTURE 40 % | **RENDU 41 %**, CONVENTION-UI 8 % |
| 13 | 4 351 | 57 | 40 681 | 1 | 19 | CONTRAT 75 % | CONVENTION-UI 11 %, RÈGLE 5 % |

¹ Complément daté ou ajouté à côté de la rubrique thématique au lieu d'y être intégré (jugement des sous-agents, colonne `accretion`). Au ch. 07, l'ordre chronologique est voulu : ce n'est pas un défaut.
² Classification par section, pondérée par le nombre de mots (`classification.tsv`). La table de domicile actuelle est celle de design G2.

**Défauts structurels relevés section par section** (colonne `defauts`, une section peut en cumuler plusieurs) : DOUBLON 266 ; MÉLANGE 144 ; SANS-ID 131 ; HORS-DOMICILE 125 ; TITRE-DATÉ 90 ; RENVOI-ABSENT 69 ; TITRE-NUM 48 ; ALIAS 48 ; TABLEAU-COUPÉ 12 ; ORPHELIN 1.

**Recouvrements vérifiés entre sections** (relations orientées) : COPIE 675, PARAPHRASE 1 483, DIVERGENCE 291, RÉSUMÉ 86. Le contrôle mécanique indépendant trouve 228 paires à ≥ 50 % de texte commun, dont 221 entre chapitres différents et 143 copies à ≥ 90 %.

### 1.2 Constats

Chaque constat réutilise les diagnostics existants ([diagnostic.md](../diagnostic.md), [qualite.md](../qualite.md), `constats/`) et ajoute la mesure du lot 6A.

| ID | Constat structurel | Preuves | Constats repris |
|---|---|---|---|
| **L6-01** | **Chaque nouvelle fonctionnalité a été écrite comme un complément dans presque tous les chapitres.** Formats, Cadence, Paramètres d'exécution et Planification apparaissent dans les 13 chapitres ; Circuits et Exécution dans 9 à 12. Le plan par type de contenu est conservé en tête de chapitre, mais il est doublé en fin de chapitre d'un plan par date. | `classification.tsv`, colonne `domaine` × chapitre ; 270 sections empilées ; 80 titres datés | QS-03, QS-11, P-21, P-22, H-14 |
| **L6-02** | **Des blocs entiers sont recopiés dans 7 à 10 chapitres.** 18 groupes de sections copiées (≥ 70 %), notamment : bloc cartes du 30/09 (RG-10 à RG-13, D-239 en pixels) dans 10 chapitres ; « Ancienne cible autonome retirée » (Parcours) dans 10 sections ; « Saisie des paramètres — D-246 » dans 7 chapitres ; bandeau d'archivage du 08/10 en tête de 6 chapitres ; « Contrat technique de phrase » dans les ch. 09, 11 et 12 ; règles FMT-01 à FMT-38 du ch. 08 identiques à RM-FMT-01 à 38 du ch. 10. Au niveau des lignes : 97 lignes en 344 occurrences. | `recouvrements-mecaniques.tsv`, `copies-lignes.tsv` | P-13, P-14, H-19, QS-10, QF-04, X-13 |
| **L6-03** | **Les ch. 08 et 10 ont le même objet.** 48 % du ch. 08 sont des règles. Une grande partie est déjà portée par une RM du ch. 10 : cycle de vie (RM-003 à RM-011), exécution (RM-055 à RM-077, RM-125), suivi, Profil (RM-085 à RM-092), médias (RM-203). Les règles FMT y sont des copies mot pour mot. Le reste n'existe qu'au ch. 08, sans identifiant : brouillons N=1, natures tours et séries, placement des pauses, grammaire de la phrase, relevés, fréquence de planification, pause prolongée de 30 min, bip des 3 dernières secondes. Les contradictions S-01, S-03, S-04 et S-05 sont nées de cette double source. | `classification/ch08.tsv` (colonnes `recouvrements`, `note`) | S-01, S-03 à S-05, S-11, S-14, QS-04, QS-10, QS-15 |
| **L6-04** | **Le ch. 06 décrit les écrans une seconde fois, en parallèle du ch. 13.** Les sections par écran (26 % de contrats, 12 % de conventions, 9 % de règles, 9 % de rendu) recoupent les contrats CE-xx et divergent sur au moins 6 écrans : Splash (2,5 s), Planifier sans bouton de validation, « Ajouter N exercice(s) », Récupération en Exécution directe, Référentiels (D-343, D-355, D-259, D-354 non intégrées), cibles tactiles 48 contre 44. | `classification/ch06.tsv` ; `divergences.tsv` | P-15, P-22, X-09 |
| **L6-05** | **Le rendu visuel n'a pas de domicile documentaire.** Il représente 41 % du ch. 12, 15 % du ch. 05 et 9 % des ch. 04 et 06. Les règles d'interface communes sont réparties entre le ch. 06 (« Contrat d'affichage commun », Status/Badge, Titres affichés), le ch. 13 (§4 et 6 blocs placés après les contrats), le ch. 12 (Screen Shells, segmentés, interface générale) et les DSF, qui portent RG-1 à RG-13. | `classification.tsv` (RENDU, CONVENTION-UI) | P-17, H-03, H-19, G8, G4 |
| **L6-06** | **Les définitions sont triplées.** Le glossaire (ch. 01), les « Concepts métier » (ch. 04) et les rubriques « Définition » (ch. 09) divergent : Occurrence planifiée, Média, catégories de Séance, bornes de Routine, liste des Préférences, « Non commencée » ou « Non exécutée », Zones corporelles « une ou plusieurs » ou « zéro à plusieurs ». Le glossaire se contredit aussi sur l'Exercice bilatéral et l'Exercice de référence. | `classification/ch01-05.tsv`, `ch09-10.tsv` ; `divergences.tsv` | P-19, QF-09, QF-10, S-12 |
| **L6-07** | **Le ch. 13 est un ensemble de contrats homogènes entouré d'ajouts non contractuels.** Les 40 contrats suivent le gabarit à 20 rubriques. Plusieurs défauts s'y ajoutent :<br>- l'inventaire n'en liste que 31 (absents : CE-CIR-01 à 03 et CE-FMT-01 à 06), et deux libellés diffèrent ;<br>- 6 blocs placés après les contrats complètent ou modifient CE-UI-10, CE-T03-08, CE-CIR-01 et CE-CIR-03, CE-UI-04, 05 et 11, CE-FMT-02 à 05 ;<br>- CE-UI-10 porte 9 notes datées empilées, CE-T03-08 en porte 8 ;<br>- 8 blocs sont copiés dans 3 à 7 contrats ;<br>- 38 contrats sur 40 ne citent aucune RM. | `classification/ch13.tsv` | P-21, QS-09, QS-15, report « inventaire des contrats » |
| **L6-08** | **La numérotation et la hiérarchie des titres sont cassées.** Le ch. 08 passe de §4 à §6 et mêle « 2 bis », « 8.x » et des titres non numérotés. Le ch. 10 a deux « 12. ». Le ch. 03 a deux « Parcours complémentaire 3 ». Le ch. 09 a 09.14 avant 09.7.1. Au total : 48 sections TITRE-NUM, 12 tableaux coupés (S-11) et 1 titre orphelin. | `classification.tsv` (`TITRE-NUM`, `TABLEAU-COUPE`) | QS-02, S-11 |
| **L6-09** | **La navigation et la traçabilité sont absentes.** Aucune table des matières ; aucun index des identifiants ; aucun lien des besoins (non identifiés) vers les règles, ni des règles vers les écrans et les recettes. Les en-têtes des chapitres répètent un même bandeau au lieu de décrire leur contenu. | QS-01, QS-06, QS-08, QS-09, QS-15 ; groupe G10 de `recouvrements-mecaniques.tsv` | QS-01, QS-06, QS-08, QS-09, QS-15 |
| **L6-10** | **Le contenu historique est mêlé au contenu normatif.** On compte 29 sections HISTORIQUE hors registre (journaux, preuves Figma, transmissions, « clôtures ») et 48 sections qui emploient un alias de version (« v13 », « Bip v2 », « Phrase v1 ») comme référence. | `classification.tsv` (`HISTORIQUE`, `ALIAS`) | H-06, H-07, H-18, QF-11, QF-12, report « alias » |
| **L6-11** | **Des contraintes extérieures portent sur les noms de fichiers des chapitres.** Voir §2.2. | recherche dans le dépôt | — |
| **L6-12** | **30 paires divergentes, situées dans des sections qu'aucun constat existant ne vise**, ont été relevées par la classification : par exemple le ch. 08 contre RM-221 et les contrats (recherche) ; S08-0549 contre RM-016 (couleur) ; S08-0456 contre RM-037 (ordre des côtés) ; RM-144 contre RM-211 ; RM-114 contre RM-162. Elles sont listées, **pas tranchées**. | `divergences.tsv` (colonne `section_deja_visee_par_un_constat` = non) | nouveaux ; à instruire au §10 (QR-9) |

### 1.3 Ce que la mesure ne permet pas d'affirmer

- La classification est un jugement de sous-agents sur un texte lu section par section. Les recouvrements de type PARAPHRASE et DIVERGENCE sont des repérages vérifiés par lecture, **pas un audit exhaustif des contradictions**.
- Les seuils mécaniques (6-grammes, 0,5, 0,7, 0,9) sont des choix d'outil.
- Certains constats repris citent des lignes antérieures aux corrections des lots 1 à 5. Les sous-agents les ont rattachés par le contenu ; plusieurs sont déjà corrigés (S-03, S-04, S-05, S-13, P-03, P-05, H-02 en partie).

## 2. Évaluation du découpage actuel

### 2.1 Par chapitre

| Ch. | Objet annoncé | Verdict | Motif |
|---|---|---|---|
| 01 | Vision et glossaire | **Pertinent**, à nettoyer | Domicile naturel des définitions ; contient des règles, du périmètre et des copies |
| 02 | Besoins | **Pertinent** | Contenu homogène (86 %) ; besoins non identifiés (QS-06) |
| 03 | Parcours | **Pertinent**, à réordonner | 13 sections empilées ; règles et rendu hors domicile |
| 04 | Modèle fonctionnel | **Pertinent si recentré** | Concepts, structures et relations ; les règles (16 %) et le rendu (9 %) en sortent ; les définitions renvoient au glossaire |
| 05 | Versions | **Pertinent**, à renforcer | Seul domicile possible du périmètre par version (P-02, P-04, P-05, P-07, P-09, P-10) ; 20 sections empilées ; 15 % de rendu |
| 06 | Écrans et navigation | **Trop large** | Il duplique le ch. 13 ; garder la navigation, l'inventaire et les captures |
| 07 | Registre | **Pertinent, intouchable** | Chronologique par nature ; textes non réécrits (G5) |
| 08 | Conception détaillée | **Redondant** | Son objet recouvre le ch. 10 (règles) et le ch. 13 (écrans) ; 92 % de son contenu a un autre domicile |
| 09 | Données | **Pertinent** | 96 % du contenu reste ; complément empilé et copies |
| 10 | Règles et calculs | **Pertinent, à élargir** | Domicile naturel de toutes les règles identifiées (RM, RM-FMT) |
| 11 | API | **Pertinent** | Compléments à intégrer ; rendu à retirer |
| 12 | Architecture | **Pertinent si recentré** | 41 % de rendu, dont les design tokens, liés à un test (K1) |
| 13 | Contrats d'écran | **Pertinent** | Contrats homogènes ; ajouts à réintégrer ; inventaire incomplet |

**Conclusion :** le découpage par **type de contenu** n'est pas en cause. C'est un découpage classique d'ingénierie des exigences (IREB CPRE, produits de travail ; ISO/IEC/IEEE 29148, structure d'une spécification), et 9 chapitres sur 13 ont un contenu dominant cohérent. Les défauts tiennent à :
- l'**absence de frontière** entre les ch. 08, 10 et 13 et entre les ch. 06 et 13 ;
- l'**absence de domicile** pour les conventions d'interface et le rendu ;
- l'**accrétion** par compléments datés ;
- la **copie** au lieu du renvoi.

### 2.2 Contraintes externes sur les fichiers

| ID | Contrainte | Preuve | Conséquence |
|---|---|---|---|
| K1 | Un test du code lit la table « Design tokens canoniques » dans le fichier du ch. 12 par son nom exact | `src/shared/ui/__tests__/tokensSpecification.test.ts:13-17` | Nom du fichier du ch. 12 et section S12-0897 **inchangés** (aucune modification du code n'est permise) |
| K2 | Trois workflows lisent les fichiers des ch. 06 à 13 par leur nom | `.github/workflows/kodjo-v14-s09-plan-local.yml:68`, `…-plan-review-independent.yml:78-85`, `…-review.yml:53` | Les fichiers des ch. 06 à 13 doivent exister sous leur nom ; `.github/` est hors périmètre |
| K3 | Le manifeste de migration des sources liste les chapitres et leurs empreintes | `scripts/kodjo/lib/initial-product-source-migrations.json:14-27` | Mêmes noms ; manifeste historique, non modifié |
| K4 | Le registre cite des chapitres par leur numéro (33 mentions, dont 15 du ch. 08) et ne peut pas être réécrit | ch. 07 ; design G5 | Une table de renvoi par section est nécessaire si un chapitre perd son contenu |
| K5 | Le code cite des chapitres et des contrats dans ses commentaires | `app/_layout.tsx`, `src/domain/sessions/*.ts` | Les identifiants (CE-, RM-, D-) restent stables ; commentaires non modifiés |
| K6 | Les préparations PRE-4 et PRE-5 lisent des copies figées et citent « ch. NN, l. NNN » | design, contraintes transverses | Une restructuration rend ces citations caduques côté `main` : calendrier à arbitrer (QR-8) |
| K7 | Les PR #363, #370 et #371 modifient les ch. 06, 07, 08, 13 et les 13 chapitres (#370) | `git merge-tree` à chaque étape | Les déplacements entre fichiers (6F) attendent leur fusion ou leur fermeture (QR-5) |

## 3. Options d'architecture

| Critère | **A — 13 chapitres nettoyés sur place** | **B — Un dossier par domaine** (Séance, Exercice, Exécution…) | **C — Couches resserrées (recommandée)** | **D — C avec fusions supplémentaires** (01+02+05 ; 04+09) |
|---|---|---|---|---|
| Domicile unique par type de contenu | partiel : 08/10/13 et 06/13 restent ambigus | oui par domaine ; non pour les règles transverses (calculs, interface) | **oui** | oui |
| Fin de l'accrétion et des copies | oui | oui | oui | oui |
| Chapitres à lire pour un écran (test CE-UI-10 de QS : 10 chapitres) | ≈ 6 | 1 à 2 | **4** (contrat, conventions, règles, données) | 4 |
| Respect de K1 à K5 | oui | **non** : tous les noms changent | **oui** (noms conservés, 08 devient une table de renvoi, 14 et une annexe sont créés) | non pour 02, 04 et 05 (fichiers vidés) |
| Lien avec le registre (K4) | intact | rompu | **intact** via la table de renvoi du 08 | intact via des tables de renvoi |
| Volume à déplacer (lignes) | ≈ 2 000 (dans un même fichier) | ≈ 15 800 | **≈ 4 250 entre fichiers et ≈ 2 000 dans un même fichier** | ≈ 6 000 |
| Risque de conflit avec les PR | faible | maximal | moyen, concentré sur 6F | élevé |
| Bénéfice spécifique | — | Lecture par fonctionnalité | Résout L6-03, L6-04 et L6-05, sans toucher aux contraintes | Gain faible : 02 et 05 sont homogènes (86 % et 77 %), et 04/09 ont des publics différents (concept et données) |

**Recommandation : option C.** Elle traite toutes les causes du §2 sans renommer de fichier. L'option B est écartée : elle rompt K1 à K5 et laisse sans domicile les règles transverses (calculs, interface), qui sont nombreuses. L'option D n'apporte pas de gain proportionné à son risque. L'option A laisse en place les deux doubles domiciles (08/10/13, 06/13) qui ont produit les contradictions S-01 à S-05.

## 4. Architecture cible (option C)

### 4.1 Fichiers cibles

Les noms de fichiers existants sont conservés (K1 à K3). Les **titres** de certains chapitres changent pour refléter leur nouveau contenu ; le changement de titre est une proposition (QR-2).

| Fichier | Titre proposé | Contenu exclusif | Taille estimée (lignes) |
|---|---|---|---|
| `01 – Vision Générale.md` | Vision et glossaire | Vision, principes d'expérience ; **glossaire, seule source des définitions** ; table « terme canonique / termes proscrits » (QF-09, QF-10) | ≈ 380 |
| `02 – Utilisateurs et besoins.md` | inchangé | Profils et besoins ; identifiants B-xx proposés (QS-06, QR-7) | ≈ 230 |
| `03 – Parcours utilisateur.md` | inchangé | Parcours illustratifs ordonnés selon le plan de domaine ; aucun rendu ni règle | ≈ 530 |
| `04 – Modèle fonctionnel.md` | inchangé | Concepts, structures (Séance, Exercice, Circuit, Format) et relations ; les définitions renvoient au glossaire | ≈ 530 |
| `05 – Versions du produit.md` | Versions et périmètre | Vocabulaire MVP / V1 / tranche (P-02) ; **matrice fonctionnalité → version**, seule source du périmètre | ≈ 410 |
| `06 – Ecrans et navigation de la V1.md` | Écrans et navigation | Navigation, arbre des écrans, **inventaire écran → contrat CE**, captures ; écrans sans contrat | ≈ 1 350 |
| `07 – Registre des décisions de conception.md` | inchangé | Décisions, ordre chronologique ; **index thématique ajouté** (domaine → D-xxx) | ≈ 690 + index |
| `08 – Conception fonctionnelle détaillée.md` | Table de renvoi | **Table de renvoi** : ancienne section du ch. 08 → nouvelle section (K4) ; aucune règle | ≈ 130 |
| `09 – Modèle de données fonctionnel.md` | inchangé | Entités, attributs, invariants, intégrité, cycles de vie des données, migration | ≈ 1 310 |
| `10 – Processus métier et règles métier transverses.md` | Règles fonctionnelles et calculs | **Toutes les règles fonctionnelles** (RM, RM-FMT, règles du ch. 08), calculs, formats d'affichage, recettes REC ; plan de domaine | ≈ 2 450 |
| `11 – API fonctionnelles.md` | inchangé | Contrats de services | ≈ 420 |
| `12 – Architecture technique.md` | inchangé | Architecture ; **design tokens canoniques** (K1) | ≈ 1 360 |
| `13 – Contrats d’écran.md` | inchangé | 40 contrats ordonnés selon le plan de domaine, **inventaire complet** ; ajouts réintégrés dans leur contrat | ≈ 4 740 |
| `14 – Conventions d’interface.md` | *nouveau* | Règles d'interface communes à plusieurs écrans (actuels ch. 13 §4, ch. 06, ch. 12, blocs copiés) ; règles RG des DSF, au fil de leur transfert (G4) | ≈ 950 |
| `Annexe – Historique des consolidations.md` | *nouveau, non normatif* | Journaux, preuves Figma datées, transmissions, anciennes cibles retirées : **texte conservé à l'identique** | ≈ 180 |

### 4.2 Plan de domaine commun

Les chapitres 03, 04, 09, 10, 11 et 13 suivent **le même ordre de parties**. Ainsi, une même fonctionnalité occupe la même place d'un chapitre à l'autre :

0. Produit et gouvernance ;
1. Séances ;
2. Exercices ;
3. Paramètres d'exécution ;
4. Composition ;
5. Circuits ;
6. Formats ;
7. Bilatéralité ;
8. Exécution ;
9. Médias pendant l'Exécution ;
10. Planification ;
11. Suivi et synthèse ;
12. Profil et préférences ;
13. Référentiels ;
14. Calculs transverses ;
15. Interface transverse ;
16. Hors MVP ;
17. Technique.

Une partie sans contenu n'est pas créée. La colonne `partie_cible` de `correspondance.tsv` donne la partie de chaque section.

### 4.3 Règles de domicile (remplacent le tableau indicatif de design G2 après validation)

| Type de contenu | Domicile | Exceptions |
|---|---|---|
| Vision | 01 | — |
| Définition (CONCEPT) | 01 (glossaire) ; structures et relations : 04 | Rubriques « Définition » du ch. 09 : conservées, réduites à un renvoi seulement quand elles sont identiques au glossaire |
| Besoin | 02 | — |
| Parcours | 03 | — |
| Périmètre par version | 05 | Le périmètre propre à un parcours, une donnée, une API, une technique ou un écran reste avec son objet |
| Navigation, inventaire, captures | 06 | Inventaire des contrats : ch. 13 |
| Décision | 07 | Résumés de décisions hors registre : laissés en place, à remplacer par des renvois |
| Règle, comportement, calcul, recette | 10 | Règles d'intégrité des données (09), règles de service (11), techniques (12) et propres à un écran (13) |
| Donnée | 09 | Persistance technique : 12 |
| API | 11 | — |
| Architecture | 12 | — |
| Contrat d'écran | 13 | — |
| Convention d'interface, rendu de référence | 14 | Design tokens : 12 (K1) ; le rendu propre à un écran reste dans son contrat ; Figma reste la référence du rendu (G8) |
| Historique | Annexe | Registre : 07 |

### 4.4 Invariants de l'architecture cible

1. Les identifiants D-, RM-, RM-FMT-, CE-, REC-, CIR-, DM- et API- ne changent pas. Chacun reste défini une seule fois (782 définitions).
2. Le texte du registre ne change pas, à l'exception de l'index ajouté.
3. Un déplacement ne réécrit pas le texte qu'il déplace. Seuls changent les titres, les renvois de localisation et les cibles de liens, et le contrôle N2 le vérifie.
4. Deux passages divergents restent tous deux en place, côte à côte, avec la mention `À CLARIFIER` et la référence de la question ouverte (G3).
5. Une copie n'est remplacée par un renvoi que si son texte est identique à la copie conservée (G2), ce que les contrôles C3 et N1 vérifient.
6. Un DSF reste applicable jusqu'au transfert vérifié de ses règles (G4). Le transfert vers le ch. 14 se fait règle par règle, avec le renvoi dans le DSF posé dans le même commit.

## 5. Correspondance section par section

La table complète est dans [correspondance.tsv](correspondance.tsv). Elle comporte une ligne par section, soit 998 lignes, avec les colonnes suivantes :
- `id`, `chapitre`, `niveau`, `titre`, `lignes` ;
- `type`, `domaine` ;
- `action`, `fichier_cible`, `partie_cible`, `etape`, `classe` ;
- `renvoi_vers`, `divergences`, `defauts` ;
- `regle`, `justification`.

**Règles de calcul de la destination** (`outils/correspondance-cible.mjs`, appliquées dans l'ordre) :
- **R1** — Exceptions nommées. Une seule : S12-0897, les design tokens, restent au ch. 12 (K1).
- **R2** — Copie intégrale. Une section contenue à ≥ 90 % dans une autre section, d'au plus trois fois sa taille, est remplacée par un renvoi vers la copie conservée. La copie conservée est choisie ainsi :
  - celle qui se trouve dans le domicile majoritaire du groupe, de préférence celle qui définit un identifiant ;
  - deux copies imposées : « Saisie des paramètres — D-246 » et le bandeau du 08/10, qui vont au ch. 10.
  - Une section qui définit un identifiant n'est jamais remplacée. Le registre n'est jamais concerné.
- **R3** — Historique hors registre : la section va dans l'annexe.
- **R4** — Domicile du type (§4.3) :
  - **CONSERVER** si la section est déjà dans son domicile ;
  - **INTÉGRER** si c'est un complément empilé, à replacer dans sa rubrique thématique ;
  - **DÉPLACER** sinon.
  - Au ch. 08, les titres restants deviennent la table de renvoi.

**Bilan des actions :**

| Action | Sections | Lignes | Étape |
|---|---|---|---|
| CONSERVER (pas de déplacement) | 513 | 9 425 (avec la table de renvoi) | — |
| RENVOI (copie intégrale remplacée) | 32 | 212 | 6D |
| INTÉGRER (dans le même fichier) | 82 | 1 960 | 6E |
| DÉPLACER vers le ch. 14 | 52 | 946 | 6F1 |
| DÉPLACER depuis le ch. 08 | 119 | 1 661 | 6F2 |
| DÉPLACER du ch. 06 vers le ch. 13 | 46 | 586 | 6F3 |
| DÉPLACER (autres) | 93 | 873 | 6F4 |
| ARCHIVER | 29 | 178 | 6F5 |
| TABLE-DE-RENVOI (titres du ch. 08) | 32 | inclus ci-dessus | 6F2 |

**Part de chaque chapitre qui reste en place :**

| Chapitre | Part en place |
|---|---|
| 01 | 72 % |
| 02 | 92 % |
| 03 | 83 % |
| 04 | 66 % |
| 05 | 86 % |
| 06 | 48 % |
| 07 | 100 % |
| 08 | 0 % (table de renvoi) |
| 09 | 96 % |
| 10 | 93 % |
| 11 | 88 % |
| 12 | 82 % |
| 13 | 91 % |

**Principaux flux entre fichiers (en lignes) :**

| De | Vers | Lignes |
|---|---|---|
| 08 | 10 | 1 194 |
| 08 | 13 | 188 |
| 08 | 04 | 172 |
| 08 | 09 | 63 |
| 06 | 13 | 586 |
| 06 | 10 | 350 |
| 06 | 14 | 231 |
| 13 | 14 | 381 |
| 12 | 14 | 249 |
| 04 | 10 | 79 |

**Limites de la table, à lever à l'exécution :**
- Une section classée avec des types secondaires porte la mention « à scinder si nécessaire » dans `justification`. Sa scission est décidée à l'étape concernée, sans changer son texte.
- Une section du ch. 06 classée RÈGLE est envoyée au ch. 10 (350 lignes). À l'étape 6F3, chacune est revue : si elle ne concerne qu'un écran doté d'un contrat, elle va au ch. 13.
- Une copie noyée dans une section plus large n'est pas une copie intégrale : elle relève de [copies-lignes.tsv](copies-lignes.tsv), à l'étape 6D.
- La destination est **calculée** : la revue d'une étape peut la corriger. Toute correction est consignée dans `correspondance.tsv`, avec la règle `R1` et sa justification.

## 6. Opérations planifiées

| Famille | Opération | Volume | Étape |
|---|---|---|---|
| **Déplacements** | Règles du ch. 08 vers le ch. 10, plan de domaine | 1 194 lignes | 6F2 |
| | Écrans du ch. 06 vers les contrats du ch. 13 (divergences conservées) | 586 lignes | 6F3 |
| | Conventions et rendu vers le nouveau ch. 14 | 946 lignes | 6F1 |
| | Concepts (08, 06, 03) vers 04 ; données (08, 04) vers 09 ; périmètre (01, 04, 06, 08) vers 05 ; parcours (06) vers 03 | 873 lignes | 6F4 |
| | Historique vers l'annexe | 178 lignes | 6F5 |
| **Regroupements** | Compléments empilés intégrés dans leur rubrique (P-21, P-22) ; notes datées de CE-UI-10 (9) et CE-T03-08 (8) | 82 sections | 6E |
| | 6 blocs placés après les contrats du ch. 13 rattachés à leur contrat ou au ch. 14 | 6 sections | 6E et 6F1 |
| **Dédoublonnages** | Sections copiées intégralement | 32 sections | 6D |
| | Lignes copiées (RG-10 à 13, D-239, « Pi est stockée… », formule de durée, clôture du 01/10…) | 247 occurrences | 6D |
| | FMT-01 à FMT-38 (ch. 08) : copie conservée = RM-FMT (ch. 10) ; exemples et tableau « Trois dimensions », propres au ch. 08, déplacés | 5 sections | 6D et 6F2 |
| | Bandeau commun des chapitres remplacé par un en-tête propre à chaque chapitre (objet, contenu, renvois) | 6 chapitres | 6D |
| **Navigation** | Table des matières par chapitre ; INDEX.md mis à jour (fichiers, titres, rôle) ; inventaire complet des 40 contrats ; inventaire écran → contrat au ch. 06 | 14 fichiers | 6C et 6G |
| | Renumérotation des titres **de section** (pas des identifiants) selon le plan de domaine ; tableaux coupés réparés | 48 sections et 12 tableaux | 6C |
| | Ancres explicites : seulement sur les cibles de liens entrants qui changent de fichier (G6) | selon 6F | 6F |
| **Traçabilité** | Table de renvoi du ch. 08, section par section | 160 sections | 6F2 |
| | Index des identifiants, généré (identifiant → fichier et section) ; index thématique du registre | 782 identifiants | 6G |
| | Rubrique « Règles applicables » de chaque contrat : uniquement les RM déjà citées ou démontrées par recouvrement ; toute attribution incertaine est soumise à revue | 40 contrats | 6G (DOC-AUTORITÉ) |
| | Matrice besoin → règle → contrat → recette, si les identifiants B-xx sont acceptés | — | 6G (QR-7) |

## 7. Garantie de conservation

**Ce qui doit être conservé :**
- toutes les **exigences** (lignes de contenu normatif) ;
- toutes les **décisions** (lignes D-nnn du registre) ;
- toutes les **règles** (identifiées ou non) ;
- tous les **identifiants**.

L'état de référence est le commit de départ de chaque étape. Le lot 6A fige aussi celui de `49526414` ([base-conservation.tsv](base-conservation.tsv)).

**Contrôles obligatoires à chaque étape (bloquants) :**

| Contrôle | Outil | Critère |
|---|---|---|
| C1 — Identifiants | `verifier-conservation.mjs` | Chaque identifiant défini à la référence est défini exactement une fois dans la cible ; aucun identifiant nouveau sans justification |
| C2 — Lignes | `verifier-conservation.mjs` | Chaque ligne de contenu de la référence se retrouve dans la cible, à l'identique (N1) ou aux renvois de localisation près (N2). Sinon elle figure dans `justifications.tsv` avec l'un des motifs : COPIE-RETIRÉE (une occurrence subsiste), RENVOI, FUSION-TITRE, HISTORIQUE-ARCHIVÉ, ou CORRECTION-DÉCIDÉE avec sa décision D-xxx |
| C3 — Copies retirées | `verifier-conservation.mjs` | Chaque baisse du nombre d'occurrences d'une ligne est listée et rapprochée de `copies-lignes.tsv` ou de la table |
| C4 — Registre | `verifier-conservation.mjs` | Le texte de chacune des 393 décisions est identique, sans exception possible |
| C5 — Place des sections | `verifier-correspondance.mjs --etapes=…` | Chaque section de l'étape se trouve dans son fichier cible ; chaque RENVOI pointe vers la copie conservée |
| C6 — Liens | `links.mjs` | Aucune nouvelle anomalie (2 anomalies historiques connues) |
| C7 — Divergences | revue de l'étape et `divergences.tsv` | Les deux passages de chaque paire concernée sont présents et marqués `À CLARIFIER` |
| C8 — Contraintes K1 et K2 | contrôle du nom de fichier et `grep` | Fichiers des ch. 06 à 13 présents sous leur nom ; table des design tokens dans le ch. 12 |
| C9 — PR | `git merge-tree` simulé avec #363, #370 et #371 | Conflits listés ; une étape qui en crée attend la décision QR-5 |
| C10 — OpenSpec | `openspec validate --strict` | Réussite avant chaque publication |

**Autotest des outils (17/10) :**
- `verifier-conservation.mjs` sur l'arbre inchangé : 782 identifiants, 7 015 lignes distinctes en N1, résultat « CONSERVATION VÉRIFIÉE ».
- Sur une copie simulée (ch. 02 fusionné dans le ch. 01, copie du ch. 12 remplacée par un renvoi, texte de D-100 altéré), l'outil :
  - accepte la fusion ;
  - signale 3 lignes dont les occurrences baissent ;
  - **rejette** l'altération de D-100 (C2 et C4).
- `verifier-correspondance.mjs` : 545 sections conservées conformes ; les 119 sections de 6F2, non encore déplacées, sont signalées non conformes, comme attendu.

## 8. Plan d'exécution

Chaque étape fait l'objet d'un commit distinct (ou d'une série courte), à partir d'un commit de départ consigné. Elle n'est publiée qu'après la réussite de ses contrôles. Elle ne commence qu'avec l'autorisation explicite de Hermann.

| Étape | Périmètre | Classe | Dépendances | Vérification spécifique |
|---|---|---|---|---|
| **6B — Validation et outillage** | Décisions QR-1 à QR-9 ; révision 3 de design (G1, G2) ; écriture de `reecrire-liens.mjs` (liens et ancres d'après la table) et de `appliquer-deplacements.mjs` (déplacement d'une section à l'identique) ; `justifications.tsv` vide | DOC-AUTORITÉ | Revue ChatGPT du lot 6A | Outils autotestés sur une copie hors dépôt |
| **6C — Corrections dans chaque fichier, sans déplacement** | Numérotation des titres (48) ; tableaux coupés (12, S-11) ; titre orphelin ; D-047 sortie de l'exemple « # Format » ; inventaire des 40 contrats ; tables des matières | DOC | 6B | C1 à C10 ; aucune ligne de contenu changée hors titres (C2 en N1) |
| **6D — Dédoublonnage** | 32 copies intégrales ; 247 occurrences de lignes ; FMT-01 à 38 ; bandeaux ; titres « Saisie des paramètres — D-246 » | DOC | 6C | C3 : chaque baisse correspond à une ligne de `copies-lignes.tsv` ; une copie divergente n'est pas retirée |
| **6E — Intégration des compléments dans leur fichier** | 82 sections empilées, dont CE-UI-10 et CE-T03-08 ; les 6 blocs placés après les contrats | DOC | 6D | C2 en N1 ; les notes qui modifient une rubrique sans décision restent à côté d'elle (G3, G5) |
| **6F1 — Création du ch. 14** | Conventions et rendu (52 sections) ; ch. 13 §4 | DOC | 6E ; QR-3 ; fusion ou fermeture de #370 et #371 (ch. 13) | C5 ; C8 (tokens non déplacés) |
| **6F2 — Répartition du ch. 08** | 119 sections vers 10, 13, 04, 09, 05 et 14 ; table de renvoi | DOC | 6F1 ; QR-1, QR-2 ; #370 et #371 | C5 pour les 160 sections du ch. 08 ; C7 (S-01, S-14, S-15, S-18, S-19 et les divergences nouvelles) |
| **6F3 — Écrans du ch. 06 vers le ch. 13** | 46 sections ; revue des règles du ch. 06 envoyées au ch. 10 | DOC | 6F2 ; #363, #370, #371 | C5 ; C7 (6 divergences d'écran de L6-04) |
| **6F4 — Autres déplacements** | 93 sections (concepts, données, périmètre, parcours) | DOC | 6F3 | C5 |
| **6F5 — Annexe historique** | 29 sections | DOC | 6F4 ; QR-4 | C2 en N1 dans l'annexe |
| **6G — Navigation et traçabilité** | INDEX ; index des identifiants (généré) ; index du registre ; inventaire écran → contrat ; rubriques « Règles applicables » ; B-xx si QR-7 | DOC, DOC-AUTORITÉ pour les rubriques | 6F5 | Index régénéré identique ; chaque RM citée dans un contrat existe |
| **6H — Reports antérieurs au lot 6** | 214 lignes « à examiner » de R-06 ; alias (table 2.6) ; RM-131 après la PR #370 ; ch. 08 l. 1573 après la PR #371 ; `PRODUCT.md` (Q-C) | DOC ou FONCT-ARBITRÉ selon la ligne | 6G ; #370 et #371 | Selon les lots 3 et 5 (rejeu JSON, variantes) |
| **6I — Transfert des règles des DSF** | RG-1 à RG-13 et autres règles applicables des DSF vers le ch. 14, règle par règle (G4, Q-B a) | DOC | 6F1 | Même commit pour le transfert et le renvoi posé dans le DSF |
| **6J — Hors restructuration** | Divergences de `divergences.tsv` ; contrat d'écran du message de migration ; exigences non fonctionnelles (QC) ; convention d'obligation (QF §2.0) ; emplacement du nombre d'Exercices (D-399) | FONCT-À-ARBITRER | Décisions de Hermann | Selon la décision |

**Ordre et parallélisme :**
- 6C, 6D et 6E ne déplacent rien entre fichiers. Elles peuvent commencer dès 6B, mais chacune est soumise à C9.
- Les étapes 6F attendent la fusion ou la fermeture des PR qui touchent leurs fichiers (QR-5).
- 6I peut suivre 6F1 sans attendre 6F2.

## 9. Couverture des défauts structurels

**Classement retenu :**
- **traité** : une étape du lot 6 le corrige ;
- **déjà traité** : corrigé aux lots 1 à 5, selon [tasks.md](../tasks.md) ;
- **fonctionnel** : relève d'une décision produit et n'est donc pas un défaut de structure. Il est conservé et rendu visible, mais pas résolu par la restructuration.

| Défauts | Traitement | Étape ou justification |
|---|---|---|
| L6-01, QS-03, QS-11, P-21, P-22, H-14 (accrétion) | traité | 6E (intégration) ; G5 pour le texte ; H-14 est une règle d'autorité déjà encadrée par D-376 |
| L6-02, P-13, H-19, QS-10 (copies), QF-04, X-13 | traité | 6D. QS-10 (trois règles au même texte, ch. 08) : la correction du texte exige une décision sur la règle d'inversion (6J) ; seul le déplacement relève du lot 6 |
| P-14 (ordre de la feuille Paramètres en 4 versions divergentes) | traité partiellement | 6D les rapproche ; le choix de l'ordre est fonctionnel (6J) |
| L6-03, QS-04, S-11 | traité | 6F2 (un seul domicile pour les règles) ; 6C (tableaux coupés) |
| S-01, S-03, S-04, S-05, S-14, S-15, S-18, S-19, S-20 | fonctionnel | 6J ; les deux passages restent côte à côte après 6F2 (C7). selon la classification du ch. 08, S-03, S-04 (D-388) et S-05 (D-380) sont déjà corrigés dans le texte |
| L6-04, P-15, X-09 | traité (structure) ; fonctionnel (divergences) | 6F3 ; divergences en 6J |
| L6-05, P-17, H-03, H-19 | traité | 6F1 ; 6I (transfert des DSF, G4) ; G8 pour le rendu, que Figma reste seul à définir |
| L6-06, P-19, QF-09, QF-10, S-12 | traité (domicile) ; fonctionnel (définitions divergentes) | Glossaire unique (01) ; divergences en 6J |
| L6-07, QS-09, QS-15, report « inventaire des contrats » | traité | 6C (inventaire), 6E (ajouts), 6G (« Règles applicables ») |
| L6-08, QS-02 | traité | 6C |
| L6-09, QS-01, QS-06, QS-08 | traité | 6C (tables des matières), 6G (index, matrice) ; QS-06 (B-xx) dépend de QR-7 |
| L6-10, H-06, H-07, H-18, QF-11, QF-12, report « alias » | traité | 6F5 (annexe) ; 6H (alias) |
| L6-11 | contrainte, pas un défaut | Respectée par l'option C (§2.2) |
| L6-12 (30 paires nouvelles) | fonctionnel | QR-9, puis 6J |
| QS-05 (contenu normatif hors des chapitres), H-15, H-16, H-17, H-20, P-12, P-16, P-18 | traité en partie | 6I (DSF) et 6H (PRODUCT.md, Q-C). Les MATRICE-, RAPPORT- et autres documents de traçabilité hors chapitres ne sont pas restructurés : statut à ne corriger que s'il trompe (G7) |
| QS-07, QF-03, R-03, R-06, R-07, H-13, S-10 | déjà traité | Lots 1 et 3 (restauration) ; reste à faire : 214 lignes « à examiner » (6H) |
| R-01, R-02, R-04, R-05 | déjà traité ou historique | Lot 2 ; deux anomalies historiques maintenues (C6) |
| H-01, H-02 | déjà traité en partie | D-376 ; la borne « jusqu'à D-255 » reste non tranchée (hors lot 6) |
| H-04, H-05, H-08, H-09, H-10, H-11, H-12, R-08 | déjà traité ou fonctionnel | Lot 1, arbitrages du 16/10 (D-386) ; aucun effet structurel |
| P-01 à P-11 (périmètre) | traité (domicile) ; fonctionnel (contenu) | 6F4 : périmètre centralisé au ch. 05 (matrice fonctionnalité → version). Les contradictions de version restent en 6J |
| P-20, S-09 | traité | 6D et 6F2 (FMT : copie conservée = RM-FMT ; le renvoi en boucle disparaît avec la table de renvoi) |
| QF-01, QF-02, QF-05 (granularité), QF-06 à QF-08, QF-13 à QF-19, QC-01 à QC-15, X-xx | hors structure | Qualité de rédaction ou contenu produit : lot 6J et décisions de Hermann. La restructuration ne réécrit aucune règle (§4.4, invariant 3) |
| QS-12, QS-13, QS-14 | traité en partie | QS-12 : 6E rend visibles les divergences internes. QS-13 (statuts en texte libre) relève du registre : proposition de statut fermé (qualite.md P2), non comprise dans la restructuration, à décider. QS-14 (typographie) : passe scriptée possible après 6F, hors périmètre |
| Défauts par section (`defauts`) : DOUBLON, HORS-DOMICILE, MÉLANGE, TITRE-DATÉ, TITRE-NUM, TABLEAU-COUPÉ, ORPHELIN, ALIAS, RENVOI-ABSENT | traité | Respectivement : 6D ; 6F ; scission à l'étape (§5) ; 6E ; 6C ; 6C ; 6C ; 6H ; 6D et 6G |
| SANS-ID (131 sections) | non traité, justifié | G6 : pas de nouvelle numérotation sans besoin démontré et décision. La restructuration place les règles sans identifiant dans leur domicile ; leur numérotation éventuelle est une proposition distincte (QR-7) |
| Reports au lot 6 (arbitrages.md) | — | Voir le détail ci-dessous |

**Reports au lot 6 (arbitrages.md) :**
- titres « D-246 » : 6D ;
- inventaire du ch. 13 : 6C ;
- alias : 6H ;
- PRODUCT.md : 6H ;
- RM-131 : 6H ;
- ch. 08 l. 1573 : 6H ;
- 214 lignes de R-06 : 6H ;
- doublons P-13, P-14, H-19, QS-10 : 6D ;
- P-21, P-22 : 6E ;
- D-047 : 6C ;
- message de migration et nombre d'Exercices : 6J.

## 10. Questions à trancher avant l'exécution

| ID | Question | Options | Recommandation |
|---|---|---|---|
| QR-1 | Architecture cible | A, B, C, D (§3) | C |
| QR-2 | Ch. 08 : table de renvoi, ou fichier conservé avec un rôle redéfini ; titres de chapitres modifiés (01, 05, 06, 10) | a) table de renvoi et nouveaux titres ; b) table de renvoi, titres inchangés ; c) ch. 08 conservé | a |
| QR-3 | Conventions d'interface : nouveau ch. 14, ou partie I du ch. 13 | a) ch. 14 ; b) ch. 13 partie I (le ch. 13 dépasserait 5 600 lignes) | a |
| QR-4 | Historique non normatif : annexe dans le dossier des chapitres, ou suppression (Git) | a) annexe, texte conservé ; b) suppression | a. La suppression est contraire à l'objectif de conservation vérifiable |
| QR-5 | Ordre des PR #363, #370 et #371 par rapport aux étapes 6F | a) fusion ou fermeture des PR avant 6F ; b) rebase des PR après 6F, à la charge de leurs auteurs | a |
| QR-6 | Rôle de PRODUCT.md (Q-C, déjà ouverte) | Synthèse sans ordre de référence, renvoyant aux chapitres | Q-C |
| QR-7 | Numérotation nouvelle : besoins B-xx (QS-06) ; règles sans identifiant (131 sections) | a) B-xx seulement ; b) B-xx et règles par famille ; c) aucune | a |
| QR-8 | Calendrier par rapport à PRE-4 et PRE-5, dont les copies figées citent des lignes de `main` (K6) | a) après la livraison de PRE-4 ; b) immédiatement, avec la table de correspondance fournie aux préparations | à décider |
| QR-9 | 30 paires divergentes nouvelles (L6-12) : instruction au lot 6J, ou constats intégrés au diagnostic avant 6B | a) diagnostic complété avant 6B ; b) 6J | a |

## 11. Hypothèses non démontrées

- L'estimation « 4 chapitres à lire pour un écran » est un ordre de grandeur, déduit de l'architecture cible. Elle n'a pas été mesurée sur un document restructuré.
- Les tailles cibles du §4.1 sont des sommes de lignes actuelles, avant dédoublonnage.
- La classification par sous-agents n'a pas été relue ligne à ligne par un second lecteur. Seuls les contrôles de forme (998 lignes, valeurs autorisées, identifiants existants) sont mécaniques. La revue indépendante peut en échantillonner une partie.
