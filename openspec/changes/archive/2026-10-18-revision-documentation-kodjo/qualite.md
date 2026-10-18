# Passe 2 — Qualité de la spécification KODJO (ingénierie des exigences)

- **Base :** `main` `6656fefc58330955f5ad74d513ce616ea51809b0`, branche `docs/openspec-revision`.
- **Nature :** évaluation en lecture seule. Aucune spécification produit n'est modifiée. Les recommandations ci-dessous sont des **propositions méthodologiques soumises à revue**, pas des obligations.
- **Rapports bruts** (évidences complètes, commandes, citations `fichier:ligne`) :
  - [`constats/qualite/QS-structure.md`](constats/qualite/QS-structure.md) : structure, traçabilité, maintenabilité, utilisabilité ;
  - [`constats/qualite/QF-formulation.md`](constats/qualite/QF-formulation.md) : granularité, formulation, vérifiabilité ;
  - [`constats/qualite/QC-contenu.md`](constats/qualite/QC-contenu.md) : contenu, complétude.

  Cette synthèse les résume sans les remplacer : en cas d'écart, le rapport brut fait foi.

## 1. Référentiels utilisés

Aucune certification formelle n'est revendiquée. Les références sont utilisées comme grilles de lecture.

| Référentiel | Clauses mobilisées | Usage |
|---|---|---|
| ISO/IEC/IEEE 29148:2018, *Systems and software engineering — Life cycle processes — Requirements engineering* | §5.2.5 (caractéristiques d'une exigence : necessary, appropriate, unambiguous, complete, singular, feasible, verifiable, correct, conforming) ; §5.2.6 (caractéristiques d'un ensemble : complete, consistent, feasible, comprehensible, able to be validated) ; §5.2.7 (langage des exigences) ; §5.2.8 (attributs : identification, source, rationale…) | Toutes les dimensions |
| INCOSE, *Guide to Writing Requirements* (GtWR), version 4, 2023 | Caractéristiques C3 (unambiguous), C4 (complete), C5 (singular), C7 (verifiable), C13 (comprehensible) ; règles R7 (termes vagues), R8 (clauses échappatoires), R16 (négations), R24 (pronoms), R33 (plages de valeurs), R34 (performance mesurable), etc. | Formulation, vérifiabilité |
| IREB, *CPRE Foundation Level Syllabus*, version 3.x | Niveaux d'exigences (but, exigence, solution), structuration des produits de travail, traçabilité | Structure, traçabilité |
| ISO/IEC 25010:2023, *Product quality model* | Caractéristiques de qualité produit (performance, compatibilité, fiabilité, sécurité, interaction…) | Couverture non fonctionnelle |
| A. Cockburn, *Writing Effective Use Cases*, Addison-Wesley, 2001 | Acteur, préconditions, garanties minimales et de succès, scénario nominal, extensions | Contenu des parcours |

**Incertitudes déclarées sur les références :**
- Le GtWR n'est pas en accès libre. Les numéros de règles R* et de caractéristiques C* sont à vérifier contre l'édition détenue.
- Les rapports QS et QF marquent eux-mêmes « clause à vérifier » à plusieurs endroits (section du syllabus IREB ; §5.2.4 ou §5.2.7 de 29148 pour le mot-clé d'obligation). Ces marques sont conservées.

## 2. Couverture réelle

| Volet | Lu ligne à ligne | Mesuré mécaniquement |
|---|---|---|
| QS | ≈ 15 % du volume : INDEX ; CE-UI-10 et CE-FMT-04 en entier ; plages ciblées des ch. 02, 07, 08, 09, 10, 13 ; 6 décisions et 3 contrats échantillonnés | 13 chapitres : titres, identifiants, renvois, répétitions, ancres |
| QF | ≈ 1 100 lignes sur 15 767 : glossaire ch. 01 l. 187–449 ; ch. 08 l. 230–264 et 605–686 ; ch. 10 l. 130–146, 337–360 et 593–757 ; CE-T03-04, CE-UI-10 et CE-FMT-05 en entier ; ch. 03 l. 90–170 | 30 fichiers (≈ 220 000 mots) : marqueurs d'obligation, termes vagues, typographie |
| QC | ≈ 25 % : ch. 02 et 05 en entier ; plages des ch. 03, 08, 09, 10, 12 et 13 ; PRODUCT.md partiel | Recherches d'exigences non fonctionnelles sur tout le corpus |

**Non lus ligne à ligne :** ch. 01 hors glossaire, ch. 04, ch. 06 (sauf lignes isolées), ch. 07 (sauf échantillon), ch. 11, la majorité des 40 contrats du ch. 13, et le corps des DSF.

**Conséquence :** cette passe **ne permet pas de conclure à la complétude ni à la qualité globale** du corpus. Les bilans ci-dessous sont des appréciations fondées sur des échantillons représentatifs et sur des mesures exhaustives par recherche. Une recherche négative prouve l'absence d'un **terme**, pas toujours celle d'un **sujet** ; les rapports bruts le précisent pour chaque cas.

## 3. Bilan par dimension

| Dimension | Appréciation | Justification résumée | Volet |
|---|---|---|---|
| Structure | **faible** | Le découpage en 13 chapitres est clair dans son principe, mais : aucune table des matières sur ≈ 15 500 lignes ; numérotation des titres cassée (ch. 08 passe de §4 à §6, deux `## 12.` au ch. 10, deux « Parcours complémentaire 3 » au ch. 03) ; 91 sections organisées par ajouts datés au lieu d'un plan thématique ; besoins, règles, rendu et technique mêlés (QS-01 à QS-05). | QS |
| Granularité | **faible** | Les règles ont des identifiants, mais beaucoup sont des paragraphes de 60 à 170 mots qui portent 5 à 15 obligations (RM-077 : 168 mots). 42 titres `### RM-` ont perdu leur numéro (QF-01 à QF-05). | QF |
| Formulation | **faible à acceptable** | Le fond est précis (cas limites N=1, PC=0, R=0 traités). La forme dégrade cette précision : aucun marqueur d'obligation stable ; pronoms ambigus ; termes vagues ; vocabulaire non verrouillé ; alias de version employés comme vocabulaire ; méta-texte de rédaction (« prompt ») dans les règles (QF-06 à QF-14). | QF |
| Contenu | **acceptable** | Les 40 contrats du ch. 13 ont tous les rubriques « Erreurs et cas limites » et « Accessibilité », et traitent brouillons, abandons et échecs. Les parcours du ch. 03 sont des récits sans préconditions ni garanties testables. Les interruptions venant du système sont sous-spécifiées (QC-01 à QC-07). | QC |
| Complétude | **acceptable (fonctionnel) / faible (non fonctionnel)** | 14 des 20 capacités annoncées sont couvertes par des règles, des données et un contrat ; 3 sont partielles et déclarées comme telles ; la reprise après interruption n'a pas de contrat d'écran. Les exigences non fonctionnelles sont des principes sans valeur cible (QC-08 à QC-15). | QC |
| Vérifiabilité | **acceptable, solide pour les calculs** | Les oracles numériques sont explicites et justes (recettes A–F, R01, R02 et celle de CE-UI-10 recalculées). Défauts : unités absentes, tolérances non chiffrées (« ≈500ms », « temporairement »), attendus écrits « 3min15s » au lieu du format normatif, REC-xx référencés mais non définis (QF-15 à QF-19). | QF |
| Traçabilité | **faible** | Les besoins du ch. 02 n'ont aucun identifiant. 4 décisions sur 349 citent une RM ; 38 contrats sur 40 ne citent aucune RM ; la colonne Statut du ch. 07 prend 151 valeurs différentes ; les recettes ne sont reliées ni aux écrans ni aux RM. | QS |
| Maintenabilité | **faible** | Le bloc de calcul de durée est recopié ≈ 14 fois dans 8 chapitres et PRODUCT.md, sous trois identifiants (RM-129, DM-002, DM-015). 194 copies redondantes de longs paragraphes. Au ch. 08 l. 1584–1587, trois règles distinctes portent exactement le même texte : la règle propre à la « Durée totale pilotée » est absente. | QS |
| Utilisabilité | **faible** | Test développeur sur CE-UI-10 : 10 chapitres et au moins 5 DSF, ≈ 1 100 lignes ; estimation d'une demi-journée (ordre de grandeur, non chronométré). Test sur la durée totale d'un Exercice : 10 chapitres ; le passage le plus complet (ch. 10 l. 593–743) n'est désigné nulle part comme référence. | QS |

**Points forts relevés par les trois volets :**
- gabarit uniforme de 20 rubriques respecté par les 40 contrats (ch. 13 l. 35–58) ;
- tableaux de recette au bon grain (une situation, un attendu) ;
- table des bornes de l'éditeur (ch. 13 l. 4088–4095) ;
- registre qui conserve les décisions remplacées ;
- temps calculé à partir d'horodatages, signaux manqués non rejoués ;
- garanties en cas d'échec (RM-107, RM-108) ;
- cibles tactiles de 44 × 44 ;
- points ouverts souvent déclarés explicitement.

## 4. Défauts concrets et conséquences (sélection)

La liste complète figure dans les rapports bruts : QS-01 à QS-15, QF-01 à QF-19, QC-01 à QC-15. Chaque défaut y est cité verbatim avec `fichier:ligne`, référentiel et conséquence.

| ID | Défaut (exemple exact dans le rapport) | Référentiel | Conséquence |
|---|---|---|---|
| QS-01 | Aucune table des matières ; ancres explicites absentes sur les contrats | 29148 §5.2.6 comprehensible | Un contrat ne s'atteint que par recherche texte |
| QS-10 / QS-15 | ch. 08 l. 1584–1587 : trois règles avec le même texte | 29148 §5.2.5 correct, singular | Un développeur implémente une règle d'inversion absente ou erronée |
| QS-07 / QF-03 | 42 `### RM-` sans numéro ; « (RM-et RM-) » dans 5 règles | 29148 §5.2.8 identification | La portée de RM-071, 072, 075, 125 et 126 est indéterminable |
| QS-09 | 38 contrats sur 40 sans renvoi aux RM ; recette de CE-UI-10 en prose sans ID | IREB CPRE, traçabilité | Une modification de règle ne permet pas de retrouver les écrans et tests impactés |
| QF-02 | CE-UI-10 §12 : un paragraphe, plusieurs obligations, unités collées (« bornes0..10 », « maintien≈500ms ») | 29148 §5.2.5 singular, verifiable ; GtWR R6, R33 | Plusieurs cas de test implicites ; tolérance invérifiable |
| QF-06 | CE-T03-04 l. 604 : « ✓ applique au brouillon et régénère ; ✕ le conserve » | GtWR R24 (pronoms) | « le » peut désigner le brouillon ou l'état antérieur |
| §2.0 de QF | 0 SHALL/MUST, 5 « doit » sur 182 RM ; obligation exprimée par le présent, des fragments, l'infinitif, « aucun » (1 480 fois) | 29148 §5.2.7 | Impossible de distinguer mécaniquement prescription, description, historique et exemple |
| QF-17 | Attendus « 3min15s » au lieu de « 3 min 15 s » ; aucun format pour une durée ≥ 3 600 s | 29148 §5.2.5 verifiable | Oracle de recette ambigu ; cas ≥ 1 h non testable |
| QC-01 | « dans la mesure permise par le système d'exploitation » (ch. 05 l. 57) | GtWR R8 (clauses échappatoires) | Exigence non testable ; comportement de repli inconnu |
| QC-03 / QC-02 | Aucune règle pour un appel entrant ou une autre source audio (0 occurrence) ; mode silencieux présent seulement dans des listes de tests | ISO/IEC 25010:2023, compatibilité / fiabilité | Comportement imprévisible en usage réel |
| QC-04 | « Reprendre la séance » : 0 occurrence au ch. 13, alors que RM-064 l'exige | 29148 §5.2.6 complete | Écran de reprise non spécifié |
| QC-06 | Parcours du ch. 03 rédigés en récit | Cockburn (préconditions, garanties, extensions) | Le parcours ne peut servir de base de recette |

## 5. Manques démontrés et sujets à confirmer

Les tableaux complets figurent dans QS §10, QF §5 et QC §7.

**Manques démontrés** (recherche négative documentée sur le terme et sur ses variantes listées dans le rapport) :
- table des matières ;
- identifiants des besoins du ch. 02 ;
- format d'affichage d'une durée ≥ 3 600 s ;
- durées chiffrées des messages temporaires ;
- définition de REC-10 à REC-27 et de EC-01/02 dans les chapitres ;
- règle pour un appel entrant ou le focus audio ;
- comportement en mode silencieux ;
- contrat d'écran de reprise ;
- granularité de persistance de l'Exécution ;
- appui sur une notification de rappel ;
- sauvegarde système ou export au MVP ;
- fuseau horaire, heure d'été, format 12/24 h ;
- règle pour « Écran maintenu actif » ;
- tolérances temporelles chiffrées ;
- seuil de contraste.

**Sujets à confirmer** (absence de terme non concluante, ou décision du propriétaire) :
- statut normatif des DSF et des alias « v13 », « v15 », « Bip v2 » ;
- repli audio en arrière-plan (dépend du résultat de RT-001, non consigné) ;
- migration des données utilisateur ;
- qualification des données de santé ;
- versions minimales iOS et Android, batterie, stockage plein ;
- horloge après redémarrage ou changement d'heure ;
- unité de « cibles44 » ;
- planification Jour/Mois et multi-contenus (manque **déclaré** par l'auteur) ;
- correspondance REC-xx ↔ table de recettes du ch. 10.

## 6. Recommandations priorisées

Ces recommandations sont des **propositions**. Aucune n'est appliquée. Elles se recoupent avec le lot 1 et le lot 2 de [tasks.md](tasks.md). Les efforts sont estimés par les volets.

| Prio | Recommandation | Défauts | Effort | Lien avec le plan |
|---|---|---|---|---|
| P1 | Rétablir les identifiants : 42 `RM-` vides, exclusions « (RM-et RM-) », colonne ID dans la table des recettes du ch. 10 (REC-xx), EC-01/02 ; lever les homonymes R-01 / R01 / R06 | QS-07, QF-03, QF-18 | faible | 1B.2, 1B.4, 1B.7 |
| P1 | Domicile unique par règle ; fusionner RM-129, DM-002 et DM-015 ; remplacer les copies par des renvois ; corriger ch. 08 l. 1584–1587 | QS-04, QS-10, QS-15 | moyen | design D2, 2.3 |
| P1 | Rubrique « Règles applicables » (RM, D, DM, API) dans chaque contrat et recette à identifiants stables | QS-09, QS-15 | moyen | 2.6 |
| P1 | Déclarer **une convention d'obligation** en tête des chapitres normatifs. Exemple : « doit » / « ne doit pas » pour l'obligatoire, « peut » pour la permission, présent réservé à la description. Le choix des mots revient à Hermann. | QF §2.0, QF-14 | moyen | 2.6 |
| P1 | Corriger les oracles (format normatif des durées) ; chiffrer les tolérances ; définir le format ≥ 1 h [À CONFIRMER] | QF-16, QF-17 | faible | 2.6 |
| P1 | Spécifier la reprise après interruption (contrat d'écran), les interruptions système (appel, audio, silencieux, écouteurs), la granularité de persistance, et le repli audio en arrière-plan | QC-01 à QC-05 | moyen | 2.6 (décisions produit nécessaires) |
| P2 | Ancres explicites et table des matières ; inventaire du ch. 13 cliquable | QS-01 | faible | 1B.3 |
| P2 | Réécrire en place les compléments datés ; statut fermé au ch. 07 (Active / Amendée / Remplacée par D-xxx / Retirée) et colonne « Destination » | QS-03, QS-08, QS-11, QS-13 | fort | design D3, 2.4 |
| P2 | Découper les règles de plus de 60 mots en exigences unitaires numérotées, condition en tête | QF-01, QF-02, QF-05 | fort | 2.6 |
| P2 | Table « terme canonique → synonymes proscrits » ; remplacer les alias de version par des renvois | QF-09 à QF-11 | moyen | 2.6 |
| P2 | Identifier les besoins du ch. 02 (B-xx) et ajouter une matrice B → RM → CE → recette | QS-06 | moyen | 2.6 |
| P2 | Exigences non fonctionnelles chiffrées : tolérance des bips, temps d'ouverture, contraste, taille de texte, localisation temporelle, notification, sauvegarde et effacement | QC-07 à QC-15 | moyen | décisions produit |
| P3 | Parcours du ch. 03 au gabarit Cockburn, en renvoyant aux RM et CE | QC-06 | fort | — |
| P3 | Passe typographique scriptée (≈ 326 espaces manquantes, ≈ 38 accords) | QF-13, QS-14 | faible | — |

## 7. Exemples avant / après

Les réécritures n'inventent aucune règle : les valeurs absentes du dépôt sont marquées [À CONFIRMER]. Les textes « avant » sont cités exactement. Huit autres exemples figurent dans les rapports bruts (QS §9, QF §4, QC §6).

### 7.1 Contrat d'écran — CE-T03-04 §12 (pronom ambigu, obligations multiples)

**Avant** (`13 – Contrats d'écran.md:604`) :
> Toucher la zone Paramètres ouvre CE-UI-10. Aucun mot ou nombre de la phrase ne sélectionne une ligne indépendamment. ✓ applique au brouillon et régénère ; ✕ le conserve ; Terminer persiste atomiquement.

**Après :**
- **T0304-12-01** — Un toucher n'importe où dans la zone Paramètres ouvre la feuille CE-UI-10.
- **T0304-12-02** — Un toucher sur un mot ou un nombre de la phrase de synthèse a le même effet que T0304-12-01 et ne présélectionne aucune ligne de la feuille.
- **T0304-12-03** — L'action ✓ de la feuille copie les paramètres de la feuille dans le brouillon de l'Exercice, puis régénère la phrase de synthèse. Elle n'écrit rien en base.
- **T0304-12-04** — L'action ✕ de la feuille laisse le brouillon de l'Exercice identique à son état avant l'ouverture de la feuille.
- **T0304-12-05** — L'action Terminer enregistre l'Exercice en une seule opération : soit tous les paramètres du brouillon sont enregistrés, soit aucun ne l'est.

### 7.2 Règle de calcul — trois règles au même texte (ch. 08 l. 1584–1587)

**Avant** (`08 – Conception fonctionnelle détaillée.md:1585`, extrait ; texte identique aux l. 1584 et 1587) :
> | Durée totale pilotée | Durée intrinsèque calculable : unilatéral Σ(Ti+Pi) ; succession des côtés 2Σ(Ti+Pi)+PC ; par paire 2ΣTi+ΣPi+N×PC. N=1 normalisé succession. …

**Après** (contenus repris de ch. 10 l. 72–75 et 615, sans règle nouvelle) :
> | Durée totale calculée | Valeur calculée selon RM-129 (formules) et RM-132 (nature exact / ≈ / ≥ / absente). Non saisie. |
> | Durée totale pilotée | Saisie possible uniquement en mode Durée, séries identiques et nombre de séries libre ; le nombre de séries est recalculé selon la règle d'inversion [RM-130]. Sinon, lecture seule. |
> | Modes non chronométrés | Répétitions sans bip ou toutes cibles À l'échec : aucune ligne de total (résultat « omitted ») selon RM-132. |

### 7.3 Règle d'affichage et oracle de recette — format des durées

**Avant** (`08…md:617-618` et `10…md:621`) :
> | autre | `{minutes} min {secondes} s` | 1 min 30 s |
> | A | Unilatéral ; cibles30/45/60s ; Pauses10/20/30s | 135+10+20+30=195s =3min15s |

**Après :**
- **FMT-D-02** — x = 0 s'affiche `0 s` ; 0 < x < 60 s'affiche `{x} s` ; 60 ≤ x < 3 600 et x multiple de 60 s'affiche `{x/60} min` ; sinon `{⌊x/60⌋} min {x mod 60} s`. Type d'espace : [À CONFIRMER].
- **FMT-D-03** — Format pour x ≥ 3 600 s : [À CONFIRMER].
- **Recette A** — unilatéral ; cibles 30 s, 45 s, 60 s ; Pauses 10 s, 20 s, 30 s → 195 s → **texte attendu `3 min 15 s`**.

### 7.4 Exigence non fonctionnelle — guidage en arrière-plan

**Avant** (`05 – Versions du produit.md:57`) :
> Le guidage sonore doit, dans la mesure permise par le système d'exploitation, continuer lorsque l'écran est verrouillé ou que l'application fonctionne en arrière-plan.

**Après :**
> **ENF-AUDIO-01** — Pendant une Exécution `En cours`, lorsque l'écran est verrouillé ou que l'application passe en arrière-plan, l'application émet les bips et annonces prévus par le Plan d'Exécution, avec un décalage d'au plus [À CONFIRMER] ms par rapport à leur instant théorique.
> **Repli** — Si la plateforme [À CONFIRMER] empêche l'émission audio, l'application [À CONFIRMER : comportement retenu après RT-001], et l'état est recalculé au retour (RM-067).
> **Vérification** — Essai sur appareil réel iOS et Android, écran verrouillé pendant [À CONFIRMER] min.

## 8. Qualité générale ≠ conformité au format OpenSpec

- Le corpus n'emploie ni `### Requirement:`, ni `#### Scenario:`, ni SHALL/MUST. **Ce n'est pas un défaut de qualité** au sens de 29148, de l'INCOSE ou de l'IREB, et ce n'est compté nulle part ci-dessus.
- Les défauts relevés (identifiants, granularité, marqueur d'obligation, traçabilité, vérifiabilité) existent indépendamment de tout outil. Leurs corrections proposées sont écrites en français courant.
- Si le projet décidait un jour de migrer une capacité vers `openspec/specs/` (alternative B de [design.md](design.md), non recommandée maintenant), les exemples 7.1 à 7.3 se transposeraient directement : un `Requirement` par identifiant, un `Scenario` par cas. Cette transposition est une convention d'outil, pas un critère de qualité.
- La spec delta `specs/gouvernance-documentaire/spec.md` emploie le format OpenSpec parce qu'elle est un artefact OpenSpec. C'est une **proposition** de gouvernance, non archivée. Elle ne porte aucune règle produit et ne crée pas de seconde source normative.

## 9. Divergences entre volets et corrections

- **Nombre de contrats du ch. 13 :** QS et QC comptent 40 contrats. La passe 1 (`constats/H-hierarchie.md` §3.3) en comptait 37. Le contrôle du 16/10 donne 40 (`grep -c '^## CE-'` = 40, 40 identifiants distincts, 40 rubriques `### 20.`), ce qui est cohérent avec ch. 13 l. 13. Le chiffre de 37 est **erroné** ; le rapport brut est conservé tel quel et l'erratum est consigné dans [diagnostic.md](diagnostic.md) §4. L'écart avec README « 30 contrats » reste un constat valable.
- **Lignes 2999 et 4253 de CE-UI-10 (indentation x52) :** relevées à la fois par la passe 1 (P-21) et par QS. Le constat est cohérent entre les deux passes.
