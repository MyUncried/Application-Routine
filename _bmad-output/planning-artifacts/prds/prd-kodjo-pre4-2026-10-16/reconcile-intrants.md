# Rapprochement des intrants du PRD PRE-4

> Historique — revue interne du 2026-10-16, antérieure à la revue ChatGPT ; non mise à jour.

Date : 2026-10-16. Objet : vérifier que `prd.md` (avec `addendum.md`) couvre chaque élément des intrants. Le contrôle est en lecture seule : le PRD n'est pas modifié. Aucune revue ChatGPT n'est déclarée effectuée.

Statuts : **OK** = une FR (ou NFR) porte l'élément avec une conséquence testable ; **PARTIEL** = couverture incomplète, explication donnée ; **MANQUE** = aucune FR ; **NOTE** = couvert, avec une remarque de traçabilité.

Intrants : (a) `docs/preparation/PRE-4/perimetre-et-couverture.md` ; (b) section « Inventaire opposable PRE-4 », ch. 13 de `caa2a5cf`, l. 4346-5996, avec son classement `extracts/q7-inventaire-verification.md` ; (c) `docs/preparation/PRE-4/references-figma.json` ; (d) `docs/preparation/PRE-4/bmad/questions-ouvertes.md` (Q1-Q21, P1-P38, H4-H24) ; (e) les qualités non fonctionnelles.

---

## (a) Périmètre et couverture, ED-01 à ED-22

Chaque ligne ED est découpée en éléments atomiques : P = colonne « Prescription », R = colonne « Attendu de recette ».

### ED-01 — Quatre parcours

| Élément | Col. | FR couvrante | Statut | Explication |
|---|---|---|---|---|
| Créer au Catalogue | P | FR-01-01 | OK | |
| Modifier au Catalogue | P | FR-01-02 | OK | |
| Créer dans une Séance | P | FR-01-03 (2ᵉ conséquence), UJ-4 | PARTIEL | « Capacité conservée du code de départ, sans nouveau point d'entrée exposé » : la conséquence ne dit pas par quel geste on ouvre ce parcours, donc la recette ne peut pas le jouer. Le code de départ le porte (`ExerciseScreen.tsx` → `CompositionExerciseEditor`, `appendActivityAfterLastDisplayed`) : il faut nommer le point d'entrée existant, ou dire qu'il n'est pas atteignable. |
| Modifier une Copie en Séance | P | FR-01-03 (1ʳᵉ conséquence) | OK | |
| Même éditeur | R | FR-01-03 (3ᵉ), FR-19-03 | OK | |
| Sauvegarde puis réouverture | R | FR-01-07, FR-18-08, FR-18-09 | OK | |
| Retour correct | R | FR-01-05, FR-01-01 (restauration du Catalogue) | OK | |
| Copie isolée | R | FR-01-06, FR-19-01, FR-19-02 | OK | |

### ED-02 — Composition de l'écran principal

| Élément | Col. | FR couvrante | Statut | Explication |
|---|---|---|---|---|
| Composition entière selon les références courantes | P | FR-02-02, FR-22-01, table des frames | OK | |
| En-tête et fermeture | R | FR-02-03, FR-02-01 | OK | |
| Nom | R | FR-02-02 (placeholder, 1ᵉʳ élément du bandeau) | PARTIEL | Aucune propriété visuelle propre (typographie, couleur, état focalisé) : seulement l'absence de liseré (FR-02-03). |
| Catégorie / Zones | R | FR-02-05 | OK | |
| Carte Paramètres | R | FR-02-06 | OK | Inter 13 / 20, largeur de référence, un seul focus. |
| Description | R | FR-02-07 | OK | |
| Médias | R | FR-21-02 | OK | Rendu de référence. |
| Terminer | R | FR-02-08, FR-02-09 | OK | |
| Position, marges | R | FR-02-04, FR-02-02 | OK | |
| Typographie | R | FR-02-06 (Carte) ; FR-02-01 (titre, renvoyé aux captures) | PARTIEL | Nom, Description, libellés de section et Médias : aucune typographie écrite. Elle est renvoyée à FR-22-01 et aux frames, alors que l'attendu demande de l'écrire avant le développement. |
| Couleur | R | FR-02-03 (dégradé `#EAEAFF`) | PARTIEL | Couleurs de la Carte, du champ Nom et de `Terminer` non énoncées. Seule l'interdiction d'en déduire une règle est écrite (FR-02-09). |
| Contour / ombre | R | FR-22-01 (« effets », générique) | PARTIEL | Aucun contour ni aucune ombre de Carte, de champ ou de bouton n'est fixé ou explicitement renvoyé à une frame. |
| États définis | R | FR-02-11 | OK | |

### ED-03 — Feuille et popovers

| Élément | Col. | FR couvrante | Statut | Explication |
|---|---|---|---|---|
| Organisation des boutons et champs | P | FR-03-02, FR-10-08 | OK | |
| Popover Mode | P | FR-03-06, FR-05-01 | OK | |
| Popover Changement de côté | P | FR-03-07 | OK | P10 |
| Popover Ordre des côtés | P | FR-03-08 | OK | |
| Popover Régime | P | FR-03-09, FR-04-01 | OK | |
| Ancrage | R | FR-03-10 (3ᵉ) | OK | |
| Voile | R | FR-03-01 (voile de la Feuille) | PARTIEL | Le voile des **popovers** n'a aucune conséquence testable. FR-03-10 cite `DSF2M:7 (shell, ancrage, voile)` mais n'exige que l'ancrage. P9 non plus ne mentionne pas le voile. Il faut dire si le voile est celui de la primitive native, ou s'il n'y en a pas. |
| Fermeture | R | FR-03-10 | OK | Par appui extérieur, mécanisme natif (P9). |
| Focus | R | FR-03-10, FR-22-08 | OK | [ASSUMPTION: H13] |
| Une seule surface interactive | R | FR-03-10 (2ᵉ), FR-07-01 | OK | |
| Maintien des décisions de recette non supersédées | R | FR-03-01 (D-342), FR-03-03 (D-337), FR-03-05 (D-312, D-336), FR-03-12 (D-345) ; notes D-339/D-341 | PARTIEL | Les décisions maintenues ne sont pas inventoriées comme telles. Seules les supersédées sont listées (D-339, D-341, D-193, D-250, D-251). La revue ne peut pas vérifier qu'aucune décision PRE-3 acceptée n'a été oubliée. |

### ED-04 — Suppression de l'interrupteur Séries variables

| Élément | Col. | FR couvrante | Statut | Explication |
|---|---|---|---|---|
| Interrupteur supprimé | P | FR-04-01 (2ᵉ), FR-03-02 (4ᵉ) | OK | |
| Choix identiques / variables par popover | R | FR-04-01 | OK | |
| Chevron indépendant, seulement en variables | R | FR-04-02 | OK | |
| Aucune déduction depuis l'égalité des valeurs | R | FR-04-01 (4ᵉ), FR-06-03, FR-18-04 | OK | |

### ED-05 — Deux Modes

| Élément | Col. | FR couvrante | Statut | Explication |
|---|---|---|---|---|
| Deux Modes seulement | P | FR-05-01, FR-18-01 | OK | |
| Durée / Répétitions dans tous les sélecteurs | R | FR-05-01, FR-03-06 | OK | |
| … dans les validations | R | FR-18-01 (2ᵉ), FR-02-09 | OK | |
| … dans les consommateurs | R | FR-15-01 (2ᵉ) | OK | |
| Échec reste une Cible | R | FR-05-01 (3ᵉ), FR-05-04 | OK | |

### ED-06 — Cible typée par Série

| Élément | Col. | FR couvrante | Statut | Explication |
|---|---|---|---|---|
| Cible typée par Série | P | FR-06-01, FR-18-02 | OK | |
| Numérique distinct d'une saisie vide ou invalide | R | FR-06-02, FR-13-05 | OK | |
| Échec distinct d'une saisie vide ou invalide | R | FR-06-02, FR-18-03 | OK | |
| Identiques : Cible commune | R | FR-06-03 (1ʳᵉ) | OK | |
| Variables : mixte ordonné | R | FR-06-03 (2ᵉ), FR-18-04 | OK | |

### ED-07 — Sélecteur de cible

| Élément | Col. | FR couvrante | Statut | Explication |
|---|---|---|---|---|
| Sélecteur de cible courant | P | FR-07-01 à FR-07-08 | OK | |
| Ouverture sur la valeur | R | FR-07-04 | OK | Hors grille : Q21. |
| Libellé selon le Mode | R | FR-07-02 (« Aucune durée, à l'échec »), FR-07-03, FR-04-05 (H14) | OK | |
| Échec en tête | R | FR-07-02, FR-07-03 | OK | |
| Exactement une sélection | R | FR-07-04 | OK | |
| Aucune coche | R | FR-07-04 | OK | |
| ✓ applique au Brouillon | R | FR-07-05 | OK | Q12 |

### ED-08 — Transitions et grisé

| Élément | Col. | FR couvrante | Statut | Explication |
|---|---|---|---|---|
| Transitions sans déverrouillage | P | FR-08-02, FR-08-03 | OK | |
| Grisé manipulable | P | FR-08-02, FR-07-06, FR-22-03 | OK | P5 |
| Nombre actif → option échec à 45 % | R | FR-07-04 (2ᵉ), FR-08-02 | OK | |
| Échec actif → bloc `00:00` à 45 % | R | FR-08-01, FR-07-04 (3ᵉ) | OK | |
| Manipuler la roulette revient au numérique sans déverrouillage | R | FR-08-02 | OK | |
| Annuler restaure | R | FR-07-05 (3ᵉ), FR-08-05 | OK | |
| Variante Répétitions | — | FR-08-03 | OK | Sans grisé (Q14). |

### ED-09 — Bornes

| Élément | Col. | FR couvrante | Statut | Explication |
|---|---|---|---|---|
| Bornes indépendantes des Pauses et des totaux | P | FR-09-06 | OK | |
| Durée de 5 à 3535 s par pas de 5 | R | FR-09-01, FR-07-02 | OK | |
| Répétitions de 1 à 100 | R | FR-09-02, FR-07-03 | OK | |
| `00:00` refusé comme Cible | R | FR-08-04, FR-18-02 | OK | Q15 |
| Pause 0 valide | R | FR-08-04, FR-09-03, FR-03-03 | OK | |
| Anciennes valeurs lues sans arrondi silencieux | R | FR-09-05, FR-18-07 | OK | |

### ED-10 — Tableau variable et Pied commun

| Élément | Col. | FR couvrante | Statut | Explication |
|---|---|---|---|---|
| Tableau variable | P | FR-10-01 | OK | |
| Pied commun | P | FR-10-04, FR-03-12 | OK | |
| Poignée, numéro, Cible, Pause, retrait | R | FR-10-01 (1ʳᵉ) | OK | |
| Un seul champ actif | R | FR-10-02, FR-10-05 | OK | |
| Commandes du pied sur la seule Cellule active | R | FR-10-04 | OK | |
| Pas de steppers permanents par cellule | R | FR-10-02 (1ʳᵉ) | OK | P11 |

### ED-11 — Brouillons et changements de Mode

| Élément | Col. | FR couvrante | Statut | Explication |
|---|---|---|---|---|
| Brouillons | P | FR-11-01, FR-11-02 | OK | |
| Échec conservé entre Modes | R | FR-11-03 (3ᵉ) | OK | |
| Cibles numériques incompatibles mises à renseigner | R | FR-11-03 (2ᵉ) | OK | |
| … restaurées | R | FR-11-04 | OK | [ASSUMPTION: H4] |
| Sans conversion | R | FR-11-03 (2ᵉ) | OK | |
| Bip conservé | R | FR-11-03 (1ʳᵉ), FR-05-03 | OK | |

### ED-12 — Variations de N et réordonnancement

| Élément | Col. | FR couvrante | Statut | Explication |
|---|---|---|---|---|
| Variations de N | P | FR-12-01, FR-12-02 | OK | |
| Réordonnancement | P | FR-12-03, FR-10-07 | OK | |
| Réserves temporaires et restauration | R | FR-12-01 (1ʳᵉ), FR-12-02 | OK | |
| Copie du type Échec | R | FR-12-01 (2ᵉ), FR-19-09 | OK | |
| Copie de la Pause | R | FR-12-01 (2ᵉ), FR-19-09 | OK | |
| N = 1 normalise | R | FR-12-04 | OK | |
| Annuler une suppression restaure position et paramètres | R | FR-12-05 (3ᵉ) | OK | [ASSUMPTION: H5] |

### ED-13 — Calculs

| Élément | Col. | FR couvrante | Statut | Explication |
|---|---|---|---|---|
| Exact | R | FR-13-02 (1ʳᵉ) | OK | Durée numérique |
| Estimé | R | FR-13-02 (2ᵉ) | OK | Répétitions avec Bip |
| Partiel, mixte calculable, ≥ prioritaire sur ≈ | R | FR-13-02 (3ᵉ, 4ᵉ), FR-13-03 | OK | Attendus R01-R04 recalculés |
| Omis : tout Échec | R | FR-13-02 (6ᵉ) | OK | |
| Omis : Répétitions sans Bip | R | FR-13-02 (5ᵉ) | OK | |

### ED-14 — Total et inversion

| Élément | Col. | FR couvrante | Statut | Explication |
|---|---|---|---|---|
| Dès une Cible Échec, aucune inversion | R | FR-14-02 (2ᵉ) | OK | |
| Total affichable en lecture seule | R | FR-14-01 (3ᵉ), FR-14-02 | OK | |
| Roulette du total reste numérique | R | FR-14-03 (dernière), FR-07-07 | OK | |
| Règles propres de la roulette inchangées | R | FR-14-03, FR-14-04 | OK | |

### ED-15 — Agrégation et Pauses

| Élément | Col. | FR couvrante | Statut | Explication |
|---|---|---|---|---|
| Pauses connues conservées malgré l'omission | R | FR-15-03 | OK | |
| Remplacement de la Pause terminale par une R positive | R | FR-15-02 | OK | |
| Bilatéralité préservée | R | FR-15-03 (attendu bilatéral), FR-13-04 | OK | |
| Adaptations minimales des consommateurs, sans refonte de Composition | R | FR-15-01, FR-15-06, §7 | OK | Q4 |

### ED-16 — Phrases et gras

| Élément | Col. | FR couvrante | Statut | Explication |
|---|---|---|---|---|
| Phrase générée à l'affichage | P | FR-16-01 | OK | |
| Gras | P | FR-16-02 | OK | [ASSUMPTION: H9] |
| ≤ 3 Cibles mixtes énumérées dans l'ordre | R | FR-16-08 | OK | Q16 |
| > 3 : compaction du minimum numérique à l'échec | R | FR-16-09 | OK | |
| Tout Échec : formulation existante | R | FR-16-07 | OK | P3, P26 |
| Aucune Phrase persistée | R | FR-16-01 (2ᵉ), FR-18-05 | OK | |
| Aucune troncature | R | FR-16-11, FR-17-05 | OK | |

### ED-17 — Corpus et oracle

| Élément | Col. | FR couvrante | Statut | Explication |
|---|---|---|---|---|
| Conserver les 276 cas historiques non affectés | R | FR-17-02, FR-17-03 | OK | |
| Étendre aux variantes mixtes et aux deux Modes | R | FR-17-04 | OK | |
| Calcul indépendant de la rédaction | R | FR-17-02 (2ᵉ), FR-13-06 | OK | |
| Calcul indépendant des exemples Figma | R | FR-13-06, NFR-01 | OK | |

### ED-18 — Persistance et migration

| Élément | Col. | FR couvrante | Statut | Explication |
|---|---|---|---|---|
| Ancien mode Échec → Répétitions avec toutes les Cibles à l'échec | R | FR-18-10 | OK | |
| Tous les paramètres conservés | R | FR-18-11 | OK | Amendé par Q19 (FR-18-20). |
| Transaction et rollback | R | FR-18-15 | OK | H6 ; 4ᵉ conséquence : voir (d) |
| SQLite réelle | R | FR-18-19 | OK | |
| Invalide jamais converti en Échec | R | FR-18-14, FR-18-03 | OK | H7 |

### ED-19 — Copies, duplications, instantanés

| Élément | Col. | FR couvrante | Statut | Explication |
|---|---|---|---|---|
| Copies au Catalogue et en Séance | R | FR-19-01, FR-19-02 | OK | |
| Duplications | R | FR-19-07, FR-19-08 | OK | P36 : celles du code de départ seulement. |
| Cibles typées conservées | R | FR-19-02, FR-19-08 | OK | |
| Médias ordonnés conservés | R | FR-19-01, FR-21-53 | OK | |
| Historique versionné non réécrit | R | FR-19-10 | OK | H11 |
| Anciens résultats sans performance inventée | R | FR-19-12 | OK | |

### ED-20 — Référentiels et clavier

| Élément | Col. | FR couvrante | Statut | Explication |
|---|---|---|---|---|
| Catégorie et Zones depuis l'Éditeur | R | FR-20-01, FR-02-05 | OK | |
| Règles PRE-3 conservées | R | FR-20-07, FR-20-09, FR-20-10 (P34) | OK | |
| Sélection | R | FR-20-02, FR-20-03 | OK | |
| ✓ | R | FR-20-02, FR-20-03 | OK | |
| Annulation | R | FR-20-02, FR-20-03, FR-20-06 | OK | |
| Création | R | FR-20-06 | OK | |
| Erreurs | R | FR-20-10 | OK | Textes du code de départ (P34). |
| Clavier continu | R | FR-20-06, FR-20-08 | OK | |
| Nom vide : Ajouter désactivé sans erreur | R | FR-20-06 (4ᵉ), FR-22-10 | OK | P12 |

### ED-21 — Médias

| Élément | Col. | FR couvrante | Statut | Explication |
|---|---|---|---|---|
| Import local | R | FR-21-01 | OK | |
| Ordre | R | FR-21-02, FR-21-50 | OK | |
| Erreurs et réessai | R | FR-21-03, FR-21-56 | OK | Rendu non spécifié (P18). Validation à la recette. |
| Sauvegarde | R | FR-21-52 | OK | |
| Copies | R | FR-21-53 | OK | |
| Aucun fichier physique encore référencé supprimé | R | FR-21-55 | OK | H12 |

### ED-22 — Fidélité et accessibilité

| Élément | Col. | FR couvrante | Statut | Explication |
|---|---|---|---|---|
| Tous les contrôles, état par état, propriétés observées | R | FR-22-01 | OK | |
| Viewport | R | FR-22-06 | OK | |
| Texte agrandi | R | FR-22-05 | OK | |
| Libellés | R | FR-22-07, FR-22-08, FR-22-10 | OK | H13, H23 |
| Focus | R | FR-03-01, FR-22-07, FR-22-08, FR-22-10 | OK | |
| Lecture seule | R | FR-22-08 (2ᵉ, 4ᵉ), FR-14-05 | OK | |
| Alternatives aux gestes | R | FR-22-09, FR-10-07 | OK | |
| Tests, captures et perception sur appareil séparés | R | FR-22-02, NFR-04 | OK | |

### Sources opposables (l. 11-13)

| Élément | FR couvrante | Statut | Explication |
|---|---|---|---|
| Borne Durée de 58 min 55 s, pas 59:55 | FR-07-02, FR-09-01 | OK | P21 |
| Bloc grisé manipulable, pas désactivé | FR-08-02, FR-07-06, FR-22-03 | OK | P5 |
| Pas de zéro implicite pour À l'échec | FR-06-01 (4ᵉ), FR-18-02, FR-13-05, FR-15-06 | OK | |
| Pas de nouvelle frame « Série à l'échec » uniforme | FR-05-04, FR-08-06, §6 | OK | P2 |
| Phrase Figma à pauses variables : Phrase v1, pas l'image | FR-16-05, FR-22-01, FR-16-11 (réf. visuelle) | OK | P1 |
| Relevés et moteur = interface future | FR-13-06 (hors périmètre), FR-19-11 (notes), hors périmètre ED-19, §6 ; addendum T-12 | OK | « Le modèle ne doit pas les rendre impossibles » n'est qu'une note : aucune conséquence testable (acceptable pour une interface future). |
| Champs visuels rapprochés individuellement ; un nom de contrôle ou une capture ne prouve rien | FR-22-01 (2ᵉ, 3ᵉ) | OK | |
| CE-T03-04 et CE-UI-10 | FR-01, FR-02 (`S/13…:458-646`) ; FR-03 et FR-10 (`S/13…:2949-3060`) | NOTE | L'identifiant CE-T03-04 n'est jamais nommé dans le PRD ; ses lignes sont citées. |
| Deux modes, Paramètres v13, Phrase v1, corpus v15, Bip v2, DSF Interface, DSF Circuits | [DSF2M], [B-v13], B-PH1, CORPUS, B-BIP, `D/DSF-INTERFACE`, [DSFCIR] | OK | |

### Hors périmètre (l. 46)

| Élément | Où dans le PRD | Statut |
|---|---|---|
| Refonte Composition | §6, FR-15 hors périmètre | OK |
| Circuits de tours et de séries | §6, FR-12-07 hors périmètre | OK |
| Grille Volumes | §6, FR-05-05 hors périmètre | OK |
| Placement complet R et Points d'arrêt | §6 | OK |
| Moteur, chronomètre, sons, lecture des Médias en exécution | §6, FR-21-04 | OK |
| Relevés, performances, Synthèse et Suivi, charge et étalon | §6 | OK |
| Refonte Catalogue, Profil, Calendrier | §6 | OK |
| Adaptateurs minimaux justifiés par une exigence de l'Éditeur | §7.2 | OK |
| Héritage de N par circuit : compatible sans être implémenté | FR-01-09, FR-12-07, FR-14-02 | PARTIEL : **contradiction interne**. FR-01-09 place hors périmètre « l'affichage de la mention d'origine du N hérité », mais FR-12-07 en fait une conséquence testable (« avec une mention discrète de son origine »). |

**Décompte (a) :** 162 éléments vérifiés (ED : 144 ; sources opposables : 9 ; hors périmètre : 9). OK : 153. NOTE : 1 (CE-T03-04). PARTIEL : 8 (ED-01 ×1, ED-02 ×4, ED-03 ×2, hors périmètre ×1). MANQUE : 0.

---

## (b) Inventaire opposable PRE-4 (section Q7)


Rapprochement établi le 2026-10-16, en lecture seule, entre les 211 assertions de `extracts/q7-inventaire-verification.md` (classes R, C, T, D, X) et `prd.md` / `addendum.md` (`_bmad-output/planning-artifacts/prds/prd-kodjo-pre4-2026-10-16/`). Le contenu exact de chaque état a été relu dans `sources-caa2a5cf/.../13 – Contrats d’écran.md` l. 4346-5996 (JSON, 83 états). Décisions et hypothèses : `docs/preparation/PRE-4/bmad/questions-ouvertes.md`.

Statuts : **COUVERT** (R/C : FR avec conséquence testable) ; **PARTIEL** ; **MANQUE** ; **REPRISE VIA H** (D portée par une FR marquée `[ASSUMPTION: Hn]`) ; **RÉSOLUE** (D tranchée par une décision Q ou une règle P) ; **REQUALIFIÉE R** (D reprise par une règle sourcée) ; **ÉCARTÉE** (D explicitement non reprise dans le PRD) ; **NON TRAITÉE** ; **T HORS FR** (T absente des exigences) ; **T DANS FR** ; **X RÉSOLUE (Pn)**.

| Assertion | Classe | Résumé court | Couverture PRD | Statut | Explication |
|---|---|---|---|---|---|
| 01.1 | R | Le même éditeur sert aux quatre parcours | FR-01-03 | COUVERT | Même Éditeur et même Feuille pour les quatre parcours. |
| 01.2 | R | Paramètres typés et métadonnées relus à l'identique après Terminer, fermeture et réouve… | FR-01-07, FR-06-01 | COUVERT | Relecture à l'identique après Terminer/fermeture/réouverture, quatre parcours. |
| 01.3 | R | Copie isolée : Catalogue et occurrence de Séance distincts | FR-01-06, FR-19-01 | COUVERT |  |
| 01.4 | R | Médias ordonnés conservés (given) | FR-01-02, FR-01-07, FR-21-50 | COUVERT |  |
| 01.5 | R | Aucune récupération ajoutée automatiquement | FR-01-08, FR-15-02, FR-19-04 | COUVERT |  |
| 01.6 | R | Retour au contexte appelant | FR-01-05 | COUVERT | Catalogue restauré / Composition. |
| 02.1 | R | Composition complète de chaque état selon ses propriétés Figma : nom, Catégorie/Zones, … | FR-02-02, FR-02-11, FR-22-01 | COUVERT | Ordre P7 (Description avant Carte) au lieu de C13:576 : écart documenté (P7). |
| 02.2 | R | Corps défilable et action finale accessible | FR-02-08, FR-22-06 | COUVERT | Interprété par D-349 : Terminer reste sous le clavier et redevient accessible à sa fermeture ; exception explicite FR-22-06. |
| 02.3 | D | Pas de sections en accordéon héritées, ni de carte en grille conservée par défaut | FR-02-12 (Notes), Annexe A.1 | ÉCARTÉE | Explicitement non reprise (constat de code). |
| 02.4 | R | Référence à la largeur 402, sur les 32 références figées | FR-02-04, FR-22-06 | COUVERT | « Figées » (T) non repris. |
| 03.1 | R | Un seul popover ouvert à la fois (Mode, Côté, Ordre, Régime) | FR-03-10, FR-07-01 | COUVERT |  |
| 03.2 | R | Ancré à son contrôle ; voile et fermeture cohérents | FR-03-10, FR-03-01 | COUVERT | Ancrage, voile et fermeture par appui extérieur (natif, P9). |
| 03.3 | D | Le focus revient au déclencheur | FR-03-10 [ASSUMPTION: H13] | REPRISE VIA H | H13 marqué. Remarque : FR-04-01 énonce aussi « retour du focus au champ » en citant P9/[13]:4085, sans marque H13. |
| 03.4 | R | Aucune écriture persistée | FR-03-03, FR-03-10 | COUVERT |  |
| 04.1 | R | Aucun interrupteur « Séries variables » | FR-04-01, FR-03-02 | COUVERT |  |
| 04.2 | R | Choix identiques/variables par popover | FR-04-01, FR-03-09 | COUVERT |  |
| 04.3 | R | Chevron indépendant seulement en variable | FR-04-02 | COUVERT |  |
| 04.4 | R | L'égalité des valeurs ne normalise pas le régime | FR-04-01, FR-06-03, FR-18-04 | COUVERT | Exemple 3 × 30 s / 10 s testable. |
| 04.5 | R | Replier le tableau ne modifie pas les données | FR-04-02, FR-03-03 | COUVERT |  |
| 05.1 | R | Exactement deux modes : Durée et Répétitions | FR-05-01, FR-18-01 | COUVERT |  |
| 05.2 | R | L'ancien mode À l'échec est absent des options | FR-05-01, FR-03-06 | COUVERT |  |
| 05.3 | R | L'ancien mode reste lisible (lu puis migré) | FR-05-05, FR-18-01, FR-18-10 | COUVERT |  |
| 05.4 | T | Absent du « format v2 », lu « uniquement par l'adaptateur v1 » | Note 4.5 + addendum (« Section Q7, classe T ») | T HORS FR | FR-18-01 dit seulement « accepté qu'en lecture, comme format historique à migrer » : formulation fonctionnelle, sans format ni adaptateur. |
| 06.1 | R | Cible échec explicite, sans valeur | FR-06-01, FR-18-02 | COUVERT |  |
| 06.2 | R | Cible chiffrée : entier dans l'unité du mode | FR-06-01 | COUVERT |  |
| 06.3 | R | Cible absente, 0, NaN, chaîne ou type inconnu refusés à la persistance | FR-06-02, FR-18-03 | COUVERT | « valeur non numérique » couvre NaN. |
| 06.4 | R | Jamais convertis en échec | FR-06-02, FR-18-03, FR-18-14 | COUVERT |  |
| 06.5 | R | Couverture Durée/Répétitions × uniforme/variable | FR-06-03 | COUVERT |  |
| 06.6 | T | `UNSET` comme nom de l'état non renseigné | Note 4.6 | T HORS FR | Aucune occurrence de UNSET dans les FR ; « à renseigner (—) » fonctionnel. |
| 07n.1 | R | À l'ouverture, roulette active sur la valeur courante (30 s) | FR-07-04 | COUVERT |  |
| 07n.2 | R | Libellé échec à 45 % | FR-07-04 | COUVERT |  |
| 07n.3 | R | Aucune coche | FR-07-04 | COUVERT |  |
| 07f.1 | R | Libellé « Aucune durée, à l'échec » | FR-07-02 | COUVERT | Libellé exact exigé (P6). |
| 07f.2 | R | Option active (100 %) | FR-07-04, FR-08-01 | COUVERT |  |
| 07f.3 | R | Bloc numérique affiché à 00:00, à 45 % | FR-07-04, FR-08-01 | COUVERT |  |
| 07f.4 | R | Le bloc reste toujours manipulable | FR-08-02, FR-07-06, FR-22-03 | COUVERT |  |
| 07r.1 | R | Libellé « Aucune répétition, à l'échec » | FR-07-03 | COUVERT |  |
| 07r.2 | R | Option échec en tête | FR-07-03 | COUVERT |  |
| 07r.3 | R | Roulette d'entiers 1 à 100 | FR-07-03, FR-09-02 | COUVERT | Q8/Q14. |
| 07r.4 | R | Une seule sélection à la fois | FR-07-04 | COUVERT |  |
| 07v.1 | R | ✓ applique au brouillon parent seulement, sans persister | FR-07-05 | COUVERT |  |
| 07v.2 | R | Quitter l'éditeur sans Terminer et confirmer l'abandon restaure la version persistée | FR-07-05, FR-02-12, FR-18-17 | COUVERT |  |
| 08.1 | R | Toucher l'option échec ramène la roulette à 00:00 et grise tout le bloc à 45 % | FR-08-01 | COUVERT |  |
| 08.2 | R | Tourner la roulette sans geste de déverrouillage sélectionne la valeur (30 s) et grise … | FR-08-02 | COUVERT |  |
| 08.3 | R | Annuler (✕) restaure la cible initiale (30 s) | FR-07-05, FR-08-05 | COUVERT | Scénario de recette complet. |
| 09d.1 | R | Seuls les entiers de 5 à 3535 s, par pas de 5, sont de nouvelles cibles Durée valides | FR-09-01 | COUVERT |  |
| 09d.2 | R | 0, 1, 4, 3540 et un non-multiple de 5 refusés ; 5, 30 et 3535 acceptés | FR-09-01 | COUVERT | Valeurs 0, 1, 4, 3540, non-multiple ; 5, 30, 3535. |
| 09d.3 | R | 00:00 ne sélectionne pas l'échec et n'est jamais une cible | FR-08-04 | COUVERT |  |
| 09r.1 | R | Seuls les entiers de 1 à 100 sont valides ; 0, 101 et 1,5 refusés | FR-09-02 | COUVERT |  |
| 09h.1 | R | Une valeur historique hors grille est lue exactement, sans arrondi | FR-09-05, FR-18-07 | COUVERT | Exemples 7 s / 5999 s au lieu de 31 s / 5999 s (sans incidence). |
| 09h.2 | D | Valeurs d'exemple 31 s et 5999 s | Annexe A.2 (« Non reprises ») | ÉCARTÉE | Exemples, pas des règles. |
| 09h.3 | D | Le champ affiche l'ancienne valeur et exige une valeur valide pour la modifier | FR-09-05, FR-07-04, FR-18-14 | RÉSOLUE (Q15, Q21) | Tranchée par décisions de Hermann Q15/Q21 (valeur gardée, roulette sur valeur valide la plus proche, valeur valide exigée). |
| 09h.4 | R | Pause 0 toujours valide | FR-08-04, FR-09-03 | COUVERT |  |
| 09h.5 | R | Aucune migration ne borne les valeurs | FR-09-05, FR-18-07, FR-18-14 | COUVERT |  |
| 10.1 | R | Deux colonnes cible/Pause, même avec une cible échec | FR-10-01, FR-06-05 | COUVERT |  |
| 10.2 | R | Poignée, numéro et retrait présents | FR-10-01, FR-03-12 | COUVERT |  |
| 10.3 | R | Un seul champ actif | FR-10-02, FR-10-05 | COUVERT |  |
| 10.4 | R | Le pied commun n'agit que sur la cellule active, désignée aussi par un texte (« Série 1… | FR-10-02, FR-10-04 | COUVERT |  |
| 10.5 | D | Modifier une Pause ne change aucune cible, échec compris | FR-10 (Notes), Annexe A.2 | ÉCARTÉE | Explicitement non reprise « faute d'hypothèse validée ». De fait couverte par FR-10-04 (± sur la seule Cellule active) et FR-10-03 (MAT E16). |
| 10.6 | R | Suppression immédiate, avec Annuler | FR-12-05 [H5] | COUVERT |  |
| 11.1 | R | Une cible échec reste échec lors de la bascule de mode | FR-11-03 | COUVERT |  |
| 11.2 | R | Les cibles chiffrées incompatibles deviennent « — » (à renseigner), sans conversion, pu… | FR-11-03, FR-11-04 [H4] | COUVERT |  |
| 11.3 | R | Bip conservé | FR-05-03, FR-11-03 | COUVERT |  |
| 11.4 | R | N et Pauses conservés | FR-11-03 | COUVERT |  |
| 11.5 | D | Côtés et phases (Compte à rebours, Fin) conservés | FR-11 (Notes), Annexe A.2 | ÉCARTÉE | Explicitement non reprise. Conséquence : aucune FR ne garantit que Changement/Ordre des côtés, PC, Compte à rebours et Fin survivent à une bascule de Mode, alors que l'état source ED-11 l'attend (« côtés et phases conservés »). |
| 11.6 | R | Annulation complète (✕) | FR-11-01, FR-03-03 | COUVERT |  |
| 12c.1 | R | À N=1, état effectif uniforme sur la première ligne de l'ordre courant | FR-12-04 | COUVERT |  |
| 12c.2 | R | À N=1, ordre effectif « Un côté après l'autre » dès le brouillon | FR-12-04, FR-03-08 | COUVERT |  |
| 12c.3 | R | Remonter N avant ✓ restaure les lignes retirées dans leur ordre relatif | FR-12-01, FR-12-04 | COUVERT |  |
| 12o.1 | R | Déplacer une ligne déplace sa cible, sa Pause et son bip ensemble | FR-12-03 | COUVERT |  |
| 12o.2 | R | La nouvelle dernière ligne porte PN | FR-12-03 | COUVERT |  |
| 12o.3 | R | Supprimer puis Annuler restaure la position et les paramètres | FR-12-05 [H5] | COUVERT |  |
| 12o.4 | R | Augmenter N copie le type (échec compris) et la Pause de la dernière ligne active, sans… | FR-12-01, FR-19-09 | COUVERT |  |
| 12g.1 | R | Variable → identiques reprend la cible et la Pause de la première ligne dans l'ordre co… | FR-04-04, FR-12-03 | COUVERT |  |
| 12g.2 | R | Revenir à variable avant ✓ restaure le tableau | FR-04-04 | COUVERT |  |
| 12g.3 | R | Fermer sans ✓ laisse le parent intact | FR-04-04, FR-11-01 | COUVERT |  |
| 13d.1 | R | Durée 30/45/échec, pauses 10/10/10, unilatéral → lowerBound | FR-13-02, FR-13-03 | COUVERT |  |
| 13d.2 | C | 105 s, affichés « ≥ 1 min 45 s » | FR-13-03 (Attendu R01) | COUVERT | 105 s, « ≥ 1 min 45 s ». |
| 13d.3 | R | Aucune estimation du travail inconnu | FR-13-03, FR-13-01 | COUVERT |  |
| 13d.4 | T | « Ledger indépendant » | Note 4.13 | T HORS FR | Aucun « ledger »/registre dans les FR. |
| 13b.1 | R | lowerBound ; ≥ prioritaire sur ≈ | FR-13-02 | COUVERT |  |
| 13b.2 | C | 74 s, affichés « ≥ 1 min 14 s » | FR-13-03 (Attendu R02) | COUVERT | 74 s, « ≥ 1 min 14 s ». |
| 13n.1 | R | omitted à l'Exercice | FR-13-02, FR-13-03 (R03) | COUVERT |  |
| 13n.2 | C | 30 s de pauses connues conservées pour l'agrégat | FR-13-03 (R03), FR-15-03 | COUVERT | 30 s de Pauses pour l'agrégat. |
| 13f.1 | R | omitted dans chaque mode, bip 0 ou 2, même avec des pauses positives | FR-13-02 | COUVERT |  |
| 13f.2 | C | 30 s de pauses connues | FR-13-03 (R04), FR-15-03 | COUVERT |  |
| 13a.1 | C | Durée 30/45/60, pauses 10/10/10 → exact 165 s | FR-13-03 (tout numérique) | COUVERT | 165 s exact. |
| 13a.2 | C | Répétitions 10/12/15, bip 2 → estimated 104 s | FR-13-03 (tout numérique) | COUVERT | 104 s, « ≈ 1 min 44 s ». |
| 13a.3 | R | Compte à rebours et Fin exclus du total intrinsèque | FR-13-04 | COUVERT |  |
| 13m.1 | C | Durée 30/45/échec, pauses 10/20/30 → lowerBound 135 s = 2 min 15 s | FR-13-03, FR-14-01 | COUVERT | 135 s, « ≥ 2 min 15 s » en lecture seule. |
| 13m.2 | R | Montant obtenu par la règle, pas copié du PNG | FR-13-03, FR-13-06 | COUVERT |  |
| 14i.1 | R | Dès qu'une cible est échec (uniforme ou variable), aucun calcul inverse | FR-14-02 | COUVERT |  |
| 14i.2 | R | Total affichable en lecture seule | FR-14-01, FR-14-02 | COUVERT |  |
| 14i.3 | R | Total omitted absent | FR-14-01, FR-14-02 | COUVERT |  |
| 14i.4 | R | En Durée uniforme toute chiffrée, avec N libre, l'inverse et son arrondi documenté sont… | FR-14-02, FR-14-03, FR-14-04 | COUVERT | Arrondi, égalité vers le plus grand N, attendus chiffrés. |
| 14i.5 | R | Roulette du total sans option échec | FR-14-03, FR-07-07 | COUVERT |  |
| 14u.1 | R | Total partiel annoncé en lecture seule (« total prévisionnel partiel »), sans popover i… | FR-14-01, FR-14-05, FR-22-08 | COUVERT |  |
| 14u.2 | R | Total omitted non rendu | FR-14-01 | COUVERT |  |
| 14u.3 | R | Roulette du total distincte de la roulette de cible | FR-14-03, FR-07-07 | COUVERT |  |
| 15k.1 | R | La dernière Pause (10) est remplacée par R40 | FR-15-02 | COUVERT |  |
| 15k.2 | C | Occurrence : 135 s connus | FR-15-02 | COUVERT | 105 − 10 + 40 = 135 s. |
| 15k.3 | X | 135 s qualifiés de total « intrinsèque » | FR-15-02, FR-15-05 (P31) | X RÉSOLUE (P31) | PRD : intrinsèque 105 s, occurrence 135 s ; aucune occurrence de « 135 s intrinsèque ». P31 est une règle de priorité (§2), non une décision de Hermann. |
| 15k.4 | C | +15 s de phases de Séance (10+5) = 150 s, lowerBound | FR-15-05 (Attendu P31) | COUVERT | 150 s, « ≥ 2 min 30 s », Durée estimée d'exécution. |
| 15k.5 | D | Métrique à laquelle s'applique le montant de 150 s | FR-15-05 | RÉSOLUE (P31) | Métrique précisée : plan complet de Séance ; chaque carte sa mesure. |
| 15k.6 | R | Aucune nouvelle R créée | FR-15-02, FR-01-08 | COUVERT |  |
| 15k.7 | R | Recalcul identique après réouverture | FR-15-01 | COUVERT |  |
| 15b.1 | C | Travail connu 60 s | FR-15-03 (Attendu bilatéral + contrôle) | COUVERT | Remarque : la puce principale dit « les deux côtés » sans Pauses ni PC chiffrées ; l'état source est BY_SIDE (Un côté après l'autre), repris seulement dans la puce de contrôle (105 s / 135 s). Formulation ambiguë (« les deux côtés » ≈ « les deux côtés à chaque série »). |
| 15b.2 | R | Toutes les pauses réellement planifiées comptées une fois | FR-15-03 | COUVERT |  |
| 15b.3 | R | Pause terminale remplacée par R40 | FR-15-03, FR-15-02 | COUVERT |  |
| 15b.4 | R | Aucune estimation forfaitaire (2 s par répétition) | FR-13-01, FR-15-03 | COUVERT |  |
| 15b.5 | T | « Ledger » annoté par côté et par ligne | Note 4.13 (via 13d.4) / A.3 | T HORS FR |  |
| 16o.1 | R | Jusqu'à trois cibles, énumération dans l'ordre réel, « jusqu'à l'échec » à la place de … | FR-16-08 | COUVERT |  |
| 16o.2 | R | Valeurs et unités en gras | FR-16-02 | COUVERT |  |
| 16o.3 | R | Aucune énumération des pauses variables | FR-16-05, FR-16-07 | COUVERT |  |
| 16o.4 | R | Échec à chaque position, dans chaque mode | FR-16-08, FR-17-04 | PARTIEL | Durée : positions 1, 2, 3 exigées en attendus et en recette. Répétitions : règle « quelle que soit la position », attendus seulement en tête et en fin ; aucun attendu ni cas de recette FR-17-04 pour l'échec au milieu en Répétitions. |
| 16c.1 | R | Au-delà de trois cibles mixtes, compaction « de {min} rép. à l'échec » ou « de {min for… | FR-16-09 | COUVERT |  |
| 16c.2 | C | 10/12/échec/20 → « de 10 rép. à l'échec » | FR-16-09 | COUVERT |  |
| 16c.3 | C | 90/120/échec/150 s → « de 1 min 30 s à l'échec » | FR-16-09 | COUVERT |  |
| 16c.4 | R | Minimum numérique, pas la première valeur | FR-16-09, FR-16-03 | COUVERT |  |
| 16f.1 | X | Formulation « 3 séries jusqu'à l'échec » | FR-16-07 (P3) | X RÉSOLUE (P3) | « menées jusqu'à l'échec » exigé ; « {N} séries jusqu'à l'échec » interdit ; cartes « N séries à l'échec » (FR-05-05, FR-15-06) conformes à P3. |
| 16f.2 | R | Clauses existantes de pause et de côtés conservées | FR-16-07 | COUVERT |  |
| 16f.3 | R | Aucun total | FR-16-07 | COUVERT |  |
| 16f.4 | R | Répétitions sans bip : jamais de total, même en cas mixte | FR-16-10, FR-13-02 | COUVERT |  |
| 16d.1 | R | Phrase intégrale, sans troncature, à 360 et en texte agrandi, dans l'éditeur et sur les… | FR-16-11, FR-02-06, FR-22-05 | PARTIEL | Exigé dans l'Éditeur seulement ; « sur les cartes » (état ED-16/full-display : « afficher éditeur et cartes existantes ») n'a pas de FR. Les sources citées par Q7 (C13:4265-4269, 586) ne parlent pas des cartes : à trancher (retirer de Q7 ou ajouter une FR). |
| 16d.2 | R | Segments en gras corrects | FR-16-02, FR-16-11 | COUVERT |  |
| 16d.3 | R | Aucune phrase persistée | FR-16-01, FR-18-05 | COUVERT |  |
| 17.1 | R | Les 276 cas historiques sont conservés | FR-17-02 | COUVERT |  |
| 17.2 | T | Adaptation explicite des anciennes entrées « À l'échec » | Note 4.17 | T HORS FR | FR-17-03 exige le résultat fonctionnel (même texte), pas la forme des données de test. |
| 17.3 | R | Nouveaux cas : échec à toutes les positions (≤ 3 et > 3), mélanges, bip 0 ou positif, c… | FR-17-04 | COUVERT |  |
| 17.4 | D | Nouveaux cas : normalisation N=1, chaque ordre, pauses nulles ou variables | FR-17-04 (C12 l. 1621) | REQUALIFIÉE R | Explicitement non reprise comme D : contenu sourcé par C12 l. 1621 (note 4.17). « Pauses variables » couvert indirectement (FR-17-02, mélanges en variables). |
| 17.5 | R | Oracle indépendant du moteur testé | FR-17-02 | COUVERT |  |
| 17.6 | T | Matrice mode × bip × régime × cible × N × côté × pauses | FR-17 Hors périmètre + note | T HORS FR |  |
| 18m.1 | R | Deux modes dans les données | FR-18-01 | COUVERT |  |
| 18m.2 | R | Ancien mode À l'échec → Répétitions avec toutes les cibles échec | FR-18-10 | COUVERT |  |
| 18m.3 | R | Tous les paramètres conservés (nombre, pauses, bip, côté, ordre…) | FR-18-11 | COUVERT |  |
| 18m.4 | D | Identifiants conservés | FR-18-12 [ASSUMPTION: H21], FR-18-20 | REPRISE VIA H | H21 marqué. |
| 18m.5 | R | Aucune cible fictive | FR-18-13 | COUVERT |  |
| 18m.6 | R | Définitions et copies transformées | FR-18-12 | COUVERT |  |
| 18m.7 | R | Liens, comptes et ordre des Catégories, Zones et médias inchangés | FR-18-11, FR-21-57 | COUVERT | Amendé par Q19 pour les seuls Exercices écartés. |
| 18m.8 | T | Format JSON « v2 » ; base « v9 » migrée en « v10 » | Addendum | T HORS FR | PRD 4.18 : « ni format, ni schéma, ni numéro de migration ». |
| 18m.9 | T | Scalaires numériques nullable si la cible est échec | Addendum (T-01) | T HORS FR | FR-18-02 reprend la contrainte fonctionnelle (absence de valeur jamais seule distinction). |
| 18m.10 | T | Empreintes des fichiers inchangées ; `foreign_key_check` vide | Addendum | T HORS FR | Équivalents fonctionnels seulement (FR-18-20 aucun lien orphelin, FR-21-57 fichiers inchangés). |
| 18r.1 | R | En cas d'échec, transaction intégralement annulée, sans état partiel | FR-18-15, FR-18-19 | COUVERT | Remarque : l'état source applique le rollback aussi à une « corruption json » ; Q19 la sort du rollback (Exercice écarté, FR-18-20). Écart assumé par décision de Hermann. |
| 18r.2 | T | `user_version` 9 conservé ; octets et relations identiques | Addendum | T HORS FR |  |
| 18r.3 | D | Corruption signalée ; aucun repli silencieux | FR-18-15 [ASSUMPTION: H6], FR-18-20 (Q19, H24) | REPRISE VIA H | Remplacée par Q19 pour les données illisibles ; H6 pour l'erreur structurelle. |
| 18r.4 | T | Échec injecté après reconstruction, avant COMMIT | Addendum | T HORS FR | FR-18-15/FR-18-19 parlent d'« erreur structurelle provoquée », sans mécanisme (pas de COMMIT ni étape imposée). |
| 18d.1 | R | Après réouverture sur SQLite réelle, types et ordre exacts | FR-18-08, FR-18-19 | COUVERT |  |
| 18d.2 | R | Rejet atomique d'une cible non renseignée, sans écriture partielle | FR-18-03 | COUVERT |  |
| 18d.3 | T | « JSON v2 » et scalaires cohérents | Addendum | T HORS FR |  |
| 18s.1 | R | Paramètres et R exacts après sauvegarde de la Séance et réouverture | FR-18-09 | COUVERT |  |
| 18s.2 | R | Catégorie, Zones et médias conservés | FR-18-09 | COUVERT |  |
| 18s.3 | R | Un échec de sauvegarde ne laisse aucun lien orphelin | FR-18-09 | COUVERT |  |
| 19c.1 | R | Copie et duplication profondes des collections (cibles typées, ordre) | FR-19-02, FR-19-07, FR-19-08 | COUVERT | Duplication de Séance « sans objet » si absente du code (P36) ; l'état source ED-19/copies demande « dupliquer Séance ». |
| 19c.2 | R | Mêmes fichiers physiques référencés, sans duplication ni suppression | FR-21-53 | COUVERT |  |
| 19c.3 | R | Ordre des médias conservé | FR-21-53, FR-21-50 | COUVERT |  |
| 19c.4 | R | Source et autres copies intactes après la modification d'une copie | FR-19-01, FR-19-07 | COUVERT |  |
| 19s.1 | R | Ancien instantané et résultats inchangés | FR-19-10 | COUVERT | Portée réduite par H11 (aucun Instantané stocké). |
| 19s.2 | R | Lecture versionnée de l'ancien instantané, sans performance inventée | FR-19-10, FR-19-12 | COUVERT |  |
| 19s.3 | R | Le nouvel instantané encode la cible typée | FR-19-11 | COUVERT |  |
| 19s.4 | R | Le nouvel instantané encode les médias ordonnés (références) | FR-19-11 | COUVERT |  |
| 19s.5 | T | « Octet », « empreinte », « v1/v2 » | Addendum | T HORS FR |  |
| 19n.1 | R | Annuler la feuille ou l'éditeur n'écrit rien | FR-19-13, FR-18-17 | COUVERT |  |
| 19n.2 | R | Aucune suppression physique de média à l'annulation | FR-19-13 | COUVERT |  |
| 19n.3 | T | Hash des fichiers et tables inchangés | Addendum | T HORS FR |  |
| 20.1 | R | Appui long : le clavier déjà affiché reste visible | FR-20-08 | COUVERT |  |
| 20.2 | R | Enregistrement (↑ création en ligne) sans fermer le clavier | FR-20-06 | COUVERT |  |
| 20.3 | D | Annulation sans fermer le clavier | FR-20-06 (Notes), Annexe A.1 | ÉCARTÉE | Non reprise (D-347) ; maintien du clavier à la fermeture du menu d'appui long couvert par FR-20-08. |
| 20.4 | R | Nom vide : Ajouter désactivé, sans erreur | FR-20-06 | COUVERT |  |
| 20.5 | R | ✓ applique au parent ; l'annulation préserve le choix antérieur et les données | FR-20-02, FR-20-03 | COUVERT |  |
| 20.6 | R | Retour correct à la modale de sélection | FR-20-09, FR-22-10 | COUVERT |  |
| 21.1 | R | Ordre et identité des médias conservés (import, réordonnancement, sauvegarde, réouverture) | FR-21-02, FR-21-50 | COUVERT |  |
| 21.2 | R | Erreurs réessayables | FR-21-03, FR-21-56 | COUVERT |  |
| 21.3 | D | Erreurs « bornées » | FR-21-03 / FR-21-56 (Notes) | ÉCARTÉE |  |
| 21.4 | T | « Leases » de brouillon libérées selon le cycle existant | FR-21-03 (Notes), addendum | T HORS FR |  |
| 21.5 | R | Un fichier physique encore référencé n'est jamais supprimé ; retirer une seule référenc… | FR-21-54, FR-21-55 | COUVERT |  |
| 21.6 | D | La migration ne touche aucun média | FR-21-57 (3e conséquence) | NON TRAITÉE | Reprise comme exigence citant « 21.6 (classe D, cohérente) » sans hypothèse H ni [ASSUMPTION] ; la note de FR-21-57 renvoie par erreur à la « deuxième conséquence » (c'est la troisième). Créer une H ou requalifier en R via ch09:498. |
| 22.1 | R | Largeurs 360, 402 et 440 | FR-22-06, FR-02-04 | COUVERT |  |
| 22.2 | R | Texte agrandi | FR-22-05 | COUVERT |  |
| 22.3 | R | Parcours VoiceOver (libellés, focus, lecture seule) | FR-22-07, FR-22-08 | COUVERT |  |
| 22.4 | R | Toutes les actions sont possibles sans geste exclusif | FR-22-09, FR-10-07 | COUVERT |  |
| 22.5 | R | Aucun débordement ; l'action finale reste accessible | FR-22-05, FR-22-06 | COUVERT | Exception Terminer sous le clavier (D-349). |
| 22.6 | X | Cible tactile « DSF général 48 pt » | FR-22-04 (P30) | X RÉSOLUE (P30) | 44 × 44 minimum, 48 × 48 spécifiques conservés (FR-02-03 cohérent). P30 est une règle de priorité (§2) alors que Q7 demandait une confirmation de Hermann (contradiction interne du ch. 12). |
| 22.7 | R | Sans agrandir artificiellement le dessin de 30 px | FR-22-04 | COUVERT |  |
| 22e.1 | D | Nom et description annoncés | FR-22-07 [ASSUMPTION: H13] | REPRISE VIA H |  |
| 22e.2 | D | Catégories et Zones annoncées avec leur état | FR-22-07 [ASSUMPTION: H13] | REPRISE VIA H |  |
| 22e.3 | D | Ordre de lecture : en-tête → nom → référentiels → paramètres → description → médias → T… | FR-22-07 [ASSUMPTION: H13] | REPRISE VIA H | Ordre adapté à P7 (Description avant Paramètres), différent de l'état source (paramètres → description) ; cohérent avec FR-02-02 et H13. |
| 22e.4 | R | Focus restauré après la fermeture de la feuille | FR-22-07, FR-03-01 | COUVERT |  |
| 22s.1 | R | Focus « piégé » dans la feuille | FR-03-01, FR-22-08 | COUVERT |  |
| 22s.2 | D | ✕ et ✓ nommés | FR-22-08 [ASSUMPTION: H13] | REPRISE VIA H |  |
| 22s.3 | D | État variable annoncé | FR-22-08 [ASSUMPTION: H13] | REPRISE VIA H |  |
| 22s.4 | R | Cible échec annoncée | FR-22-08 | COUVERT |  |
| 22s.5 | R | Total partiel annoncé en lecture seule | FR-22-08, FR-14-05 | COUVERT |  |
| 22s.6 | R | Alternatives accessibles à la suppression et au réordonnancement | FR-22-09, FR-10-07 | COUVERT |  |
| 22t.1 | R | Option sélectionnée annoncée explicitement | FR-07-08, FR-22-08 | COUVERT |  |
| 22t.2 | R | Bloc grisé manipulable, y compris en accessibilité | FR-07-08, FR-22-03 | COUVERT |  |
| 22t.3 | D | Valeur et unités annoncées | FR-07-08, FR-22-08 [ASSUMPTION: H13] | REPRISE VIA H | Annexe A.2 la range à tort sous « Non reprises » tout en disant « reprise via H13 ». |
| 22t.4 | R | L'état n'est jamais transmis par le gris seul | FR-07-08, FR-22-08 | COUVERT |  |
| 22r.1 | R | Nom vide : Ajouter désactivé, sans erreur | FR-20-06, FR-22-10 | COUVERT |  |
| 22r.2 | D | … et cet état est annoncé | FR-22-10 (S/06…:148) | REQUALIFIÉE R | Reprise par une règle sourcée (désactivé jamais par la seule couleur), sans H. |
| 22r.3 | R | Clavier préservé lors des actions | FR-20-06, FR-20-08 | COUVERT |  |
| 22r.4 | D | Focus préservé ; après création ou édition, retour au contrôle d'origine | FR-22-10 [ASSUMPTION: H13] | REPRISE VIA H |  |
| F.1 | R | Chacune des 32 frames de référence est présentée dans le périmètre de l'éditeur | FR-22-01 (table des 32 frames) | COUVERT |  |
| F.2 | R | Rendu selon les propriétés de la frame : position, marges, typographie, couleur, contour | FR-22-01 | COUVERT |  |
| F.3 | T | Propriétés « figées » (arbres du 13/10 comme oracle) | FR-22-02 (Notes), FR-02-12 (Notes) | T HORS FR |  |
| F.4 | R | Données métier indépendantes des exemples PNG | FR-22-01, FR-13-06 | COUVERT |  |
| F.5 | R | Interactions documentées et actions accessibles conservées | FR-22-01 | COUVERT |  |
| F.6 | X | 8328:38848, texte de fond « 3 séries menées jusqu'à l'échec, avec des pauses de 30 s, 4… | FR-22-01, FR-16-11, FR-16-05 (P1) | X RÉSOLUE (P1) | Texte de fond de 8328:38848 explicitement exclu ; aucune énumération de Pauses variables (FR-16-05, FR-16-07). |
| F.7 | C | 8470:13303, « ≥ 2 min 15 s » | FR-13-03, FR-14-01 | COUVERT |  |
| F.8 | R | 8328:38409, message « Durée ajustée » | FR-14-04 | COUVERT | Texte littéral du message et Annuler. |
| F.9 | D | Titre d'en-tête « Créer un exercice » | FR-02-01, §9 (Q9) | RÉSOLUE (Q9 ouverte, non bloquante) | Laissée ouverte à Hermann, validation sur appareil. |
| F.10 | T | `proof_required` FUNCTIONAL_TEST + VISUAL_COMPARE | FR-22-02 (Notes) | T HORS FR | FR-22-02 (trois preuves séparées) est sourcé P:40 / P3 l. 155, pas par proof_required. |

### États JSON non couverts

| state_id | Origine | Constat |
|---|---|---|
| — | — | Aucun. Les 32 états FIGMA sont tous listés dans la « Table des 32 frames de référence » de FR-22-01 (y compris `8328:39072` → FR-12-04 et `8328:39181` → FR-04-02). Les 51 états DOCUMENT_ONLY ont chacun au moins une FR (voir le tableau ci-dessus, groupe par groupe ED-01 à ED-22). |

Couvertures seulement partielles au niveau des états : `PRE4-ED-16/ordered` (Répétitions, échec au milieu sans attendu, 16o.4) ; `PRE4-ED-16/full-display` (« cartes existantes », 16d.1) ; `PRE4-ED-11/mode-reservations` (« côtés et phases conservés », 11.5 écartée) ; `PRE4-ED-10/active-cell` (« aucune cible échec changée par édition de Pause », 10.5 écartée) ; `PRE4-ED-18/rollback` (« corruption json » sortie du rollback par Q19) ; `PRE4-ED-19/copies` (« dupliquer Séance » sans objet si absent du code, P36).

### Décompte

| Classe | Vérifiées | COUVERT | PARTIEL | MANQUE | REPRISE VIA H | RÉSOLUE (Q/P) | REQUALIFIÉE R | ÉCARTÉE | NON TRAITÉE | T HORS FR | T DANS FR | X RÉSOLUE |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| R | 155 | 153 | 2 | 0 | | | | | | | | |
| C | 13 | 13 | 0 | 0 | | | | | | | | |
| D | 22 | | | | 10 | 3 (09h.3, 15k.5, F.9) | 2 (17.4, 22r.2) | 6 (02.3, 09h.2, 10.5, 11.5, 20.3, 21.3) | 1 (21.6) | | | |
| T | 17 | | | | | | | | | 17 | 0 | |
| X | 4 | | | | | | | | | | | 4 (P1, P3, P30, P31) |
| **Total** | **211** | **166** | **2** | **0** | **10** | **3** | **2** | **6** | **1** | **17** | **0** | **4** |

Note sur la ligne D : 10 + 3 + 2 + 6 + 1 = 22 (18r.3 est comptée en REPRISE VIA H : H6 + Q19).

### Incohérences relevées dans le PRD (hors statut d'assertion)

1. FR-04-01 énonce « retour du focus au champ » (déduction D 03.3) en citant P9 et [13]:4085, sans la marque `[ASSUMPTION: H13]` portée par FR-03-10.
2. Annexe A.2 (l. 2572) range 22t.3 parmi les « Non reprises » tout en écrivant « reprise via H13 » ; elle est bien reprise (FR-07-08, FR-22-08).
3. Note de FR-21-57 : « la deuxième conséquence découle de ch09:498 » ; c'est la troisième (fichiers inchangés, 21.6), la deuxième vient de Q19.
4. FR-15-03, attendu bilatéral : « les deux côtés » sans Pauses ni PC chiffrées, alors que l'état source est BY_SIDE ; seule la puce de contrôle chiffre le cas (105 s / 135 s).
5. P30 et P31 sont des règles de priorité (§2 de questions-ouvertes) ; Q7 recommandait une confirmation de Hermann pour 22.6 (contradiction interne du ch. 12, l. 1089 contre l. 1145). Aucune contradiction PRD / P30-P31 : FR-22-04 et FR-02-03 (48 × 48 spécifique) sont cohérents.

Remarque du rapprochement : 8328:39072 et 8328:39181 ne sont reliées à FR-12-04 et FR-04-02 que par la table des frames ; ces FR ne les citent pas (voir (c)).

---

## (c) Les 32 frames de `references-figma.json`

Les 32 `frame_id` du JSON figurent tous dans la « Table des 32 frames de référence » (§4.22), avec un nom identique. Seule l'apostrophe typographique ’ du JSON est rendue ' dans le PRD. Colonne « FR » : nombre de citations hors de la table, dans §4.1-§4.22.

| # | Frame | Table | Citations dans les FR | Statut |
|---|---|---|---|---|
| 1 | 8328:36711 | oui | 1 (réf. visuelle 4.2) | OK |
| 2 | 8328:36853 | oui | 1 (réf. 4.2) | OK |
| 3 | 8328:37022 | oui | 4 | OK |
| 4 | 8328:35698 | oui | 9 | OK |
| 5 | 8328:35740 | oui | 4 | OK |
| 6 | 8328:36278 | oui | 2 | OK |
| 7 | 8328:36923 | oui | 1 (réf. 4.3) | OK |
| 8 | 8328:37092 | oui | 5 | OK |
| 9 | 8328:37760 | oui | 5 | OK |
| 10 | 8328:37862 | oui | 6 | OK |
| 11 | 8328:37972 | oui | 2 | OK |
| 12 | 8328:38084 | oui | 2 | OK |
| 13 | 8328:38193 | oui | 1 (réf. 4.3) | OK |
| 14 | 8328:38301 | oui | 1 (réf. 4.3) | OK |
| 15 | 8328:38409 | oui | 1 (réf. 4.14) | OK |
| 16 | 8328:38513 | oui | 4 | OK |
| 17 | 8328:38632 | oui | 5 | OK |
| 18 | 8328:38741 | oui | 5 | OK |
| 19 | 8328:38848 | oui | 7 | OK |
| 20 | 8470:13303 | oui | 6 | OK |
| 21 | 8328:38953 | oui | 2 | OK |
| 22 | 8328:39072 | oui | **0** | NOTE : table seulement (ED-12, ED-04). FR-12-04 (N = 1) et FR-04-05 ne la citent pas. |
| 23 | 8328:39181 | oui | **0** | NOTE : table seulement (ED-04). FR-04-02 (tableau replié) ne la cite pas. |
| 24 | 8328:39279 | oui | 2 | OK |
| 25 | 8328:39390 | oui | 4 | OK |
| 26 | 8328:35810 | oui | 1 (réf. 4.20) | OK |
| 27 | 8328:35932 | oui | 3 | OK |
| 28 | 8328:36056 | oui | 2 | OK |
| 29 | 8328:36348 | oui | 1 (réf. 4.20) | OK |
| 30 | 8328:36441 | oui | 3 | OK |
| 31 | 8328:36536 | oui | 1 (réf. 4.20) | OK |
| 32 | 8328:36781 | oui | 2 | OK |

**Décompte (c) :** 32 frames vérifiées, 32 couvertes (critère : une FR ou la table). Deux frames ne sont reliées à aucune FR : 8328:39072 et 8328:39181. La table liste aussi les états exigés sans frame (Modifier, menu D-354, N hérité, contour orange, Répétitions avec option échec…).

---

## (d) Décisions Q, P et H

### Décisions de Hermann Q1-Q21

| ID | Reflet dans le PRD | Statut | Remarque |
|---|---|---|---|
| Q1-Q3 | §0 (sources `caa2a5cf`), conventions de citation | OK | |
| Q4 | FR-01-03, FR-15 (description, FR-15-01), §6, §7 | OK | |
| Q5 | FR-22-02, NFR-04, SM-1 | OK | |
| Q6 | §8 | OK | |
| Q7 | Conventions « Q7 n° », FR-22-04 (P30), notes T | voir (b) | |
| Q8 | FR-07-03 (4ᵉ : remplace le stepper) | OK | |
| Q9 | FR-02-01, §9 | OK | Ouverte, non bloquante |
| Q10 | close par P6 ; FR-07-02 | OK | |
| Q11 | FR-02-06 (carte), FR-03-02 (titre de la feuille), glossaire, en-tête de la table des frames | OK | « Modalités d'exécution » ne subsiste que comme nom de frame (#20) et comme texte « non repris ». Aucune contradiction. |
| Q12 | FR-03-11, FR-07-05 (Durée totale comprise), FR-03-03 | OK | |
| Q13 | FR-07-01, FR-10-03, FR-10-04, FR-06-05 | OK | |
| Q14 | FR-07-03, FR-07-04, FR-08-03 | OK | Aucun grisé ajouté en Répétitions. Les 45 % et `00:00` restent propres à la variante Durée (FR-07-04, FR-08-01/02, FR-08 notes). FR-07-08 « bloc atténué manipulable avec VoiceOver » ne vise que la Durée, implicitement. |
| Q15 | FR-08-04, FR-09-04, FR-09-05, FR-10-04 | OK | |
| Q16 | FR-16-08, FR-16-04 | OK | |
| Q17 | FR-15-06 | OK | |
| Q18 | FR-02-12 | OK | |
| Q19 | FR-18-20, FR-18-15, FR-18-12, FR-18-16, FR-21-57, NFR-05, NFR-07, SM-2, §1 | OK | Deux ajouts sans source : FR-18-20 retire « avec la Récupération qui lui appartient » l'occurrence illisible (déduction de `ch09:1230`, non marquée [ASSUMPTION]) ; « ne réapparaît pas aux lancements suivants » prolonge H24. |
| Q20 | FR-15-05, FR-15-06 | OK | |
| Q21 | FR-07-04, FR-09-05, FR-10-03 | OK | |

### Règles de priorité P1-P38

| ID | Reflet | Statut | Remarque |
|---|---|---|---|
| P1 | FR-16-05, FR-16-11, FR-22-01, FR-10 réf. | OK | |
| P2 | §6 | OK | |
| P3 | FR-16-07, FR-05-05, FR-15-06, FR-18-10 | OK | |
| P4 | FR-03-03, FR-10-06 | OK | |
| P5 | FR-08-02 | OK | |
| P6 | FR-07-02 | OK | |
| P7 | FR-02-02, FR-22-07 | OK | |
| P8 | FR-01-03, FR-01-05, FR-11-01, FR-18-17 | OK | |
| P9 | FR-03-10, FR-04-01, FR-05-01 | OK | |
| P10 | FR-03-07 | OK | |
| P11 | FR-03-05, FR-10-02 | OK | |
| P12 | FR-20-06 | OK | |
| P13 | FR-20-08 | OK | |
| P14 | FR-20-02, FR-20-06 | OK | |
| P15 | FR-01-08, FR-02-08, FR-20-04 | OK | |
| P16 | FR-04-05, FR-12-04 | OK | |
| P17 | FR-02-06 | OK | |
| P18 | FR-02-07, FR-21-01 à FR-21-03 | OK | |
| P19 | FR-03-04, FR-11-05 | OK | |
| P20 | FR-05 notes | OK | |
| P21 | FR-07-02, FR-09-01 | OK | |
| P22 | FR-10-08, FR-12-03 | OK | |
| P23 | FR-10-01, FR-03-12 | OK | |
| P24 | FR-14-01, FR-03-02 | OK | |
| P25 | — (FR-15-04 cite RM-072 sans P25) | NOTE | Fond conforme : le ≥ régit le mélange. P25 n'est pas cité, la lecture de RM-072 n'est donc pas tracée. |
| P26 | FR-16-04, FR-16-07, FR-17-03 | OK | |
| P27 | FR-19-01, FR-06-06 | OK | |
| P28 | FR-18-12, FR-19-10 | OK | |
| P29 | FR-18-16 | OK | |
| P30 | FR-22-04, FR-07-08, NFR-09 | OK | Les cibles de 48 × 48 (FR-02-03, D-142/D-226) respectent le minimum de 44. |
| P31 | FR-15-02, FR-15-05 | OK | |
| P32 | FR-09-03, FR-18-06 | OK | |
| P33 | FR-03-06, FR-03-10 notes, FR-08 notes | OK | |
| P34 | FR-02-10, FR-20-07, FR-20-09, FR-20-10 | OK | |
| P35 | FR-02-05 | OK | |
| P36 | FR-19-08 | OK | |
| P37 | FR-11-05 | OK | |
| P38 | FR-09-05 | OK | |

### Hypothèses H4-H24

Toutes sont reprises dans l'index du §10 et portées par au moins une FR : H4 FR-11-04 ; H5 FR-12-05 ; H6 FR-18-15 ; H7 FR-09-05, FR-18-14 ; H8 FR-17-01, FR-14-03 ; H9 FR-16-02 ; H10 FR-13-05 ; H11 FR-19-10 ; H12 FR-21-55 ; H13 FR-03-10, FR-07-08, FR-22-07/08/10 ; H14 FR-04-05, FR-07-01 ; H15 FR-07-02 ; H16 FR-16-04 ; H17 FR-16-09 ; H18 FR-16-10 ; H19 FR-09-04 ; H20 FR-15-06 ; H21 FR-18-12, FR-18-20 ; H22 FR-02-06 ; H23 FR-22-08 ; H24 FR-18-20. **Aucune contradiction de fond.**

Écarts de forme :

| Point | Statut | Explication |
|---|---|---|
| En-tête du PRD (l. 17-18) et conventions (l. 100) : « P1 à P37 », « H4 à H23 » | PARTIEL | Ces plages sont périmées : P38 et H24 existent et sont utilisés (FR-09-05, FR-18-20). Le §9 dit bien « H4 à H24 ». |
| FR-18-15, 4ᵉ conséquence (« migration retentée au lancement suivant ») | PARTIEL | Ce prolongement de H6 n'est pas dans le texte de H6. Le PRD le reconnaît en note, mais ne le marque [ASSUMPTION] que par renvoi à H6. |
| FR-18-20 (Récupération retirée avec l'occurrence illisible ; message non réaffiché) | PARTIEL | Ces déductions ne sont pas couvertes par Q19 ni par H24 telles qu'elles sont écrites. |
| FR-12-06 : libellés `N séries` / `1 série` « relevés dans Figma, à confirmer au lexique » | PARTIEL | Ce texte est lu sur une capture sans hypothèse H (comparer H22, qui encadre un cas analogue). |

---

## (e) Qualités non fonctionnelles exposées à la structure en FR

| Qualité | Où elle survit | Statut | Explication |
|---|---|---|---|
| Primitive native, ni réimplémentation ni imitation | NFR-02, FR-22-03, FR-07-06, FR-03-10, P33 | OK | |
| Non-remplacement d'un composant accepté, garde-fous zéro `ScrollView` | NFR-03, FR-22-03 (2ᵉ) | OK | |
| Preuve visuelle et tactile par Hermann ; tests ≠ preuve | NFR-04, FR-22-02, SM-C1 | OK | |
| Aucun chiffre lu sur une capture n'est une règle | NFR-01, FR-13-06, FR-01 conventions, SM-C2 | OK | Exceptions de texte : FR-12-06 (libellés de N relevés dans Figma, sans H) ; FR-03-08 (sous-titres « (E) », couverts par P33). |
| Ne pas inventer un composant absent de Figma (NON VÉRIFIABLE) | NFR-01, FR-22-01 (dernière) | OK | |
| Ordre de lecture des sources (ch. 07 → 04/09/10 → 11 → 12 → 06 → 13 → Figma) | Conventions §4 (« Q et P priment ») | PARTIEL | L'ordre d'implémentation d'AGENTS.md n'est pas repris comme NFR. Seul P4 l'invoque. |
| Lexique, français, termes interdits (Set, Activité) | NFR-08, FR-22-12 | OK | |
| Identifiants historiques non renommés | NFR-13 | OK | |
| Repositories sans ORM, `migration001` intouchable | NFR-12 | OK | |
| Trois contrôles locaux | NFR-11, SM-4 | OK | |
| Noms de code en anglais rattachables au glossaire (D-035) ; jetons verrouillés par `tokensSpecification.test.ts` ; CRLF | — | NOTE | Ce sont des conventions de code, non reprises. Elles restent dans AGENTS.md et relèvent de l'architecture et des stories. Le verrou des jetons pèse pourtant sur ED-02 : une couleur de Figma différente d'un jeton ne doit pas modifier `tokens.ts`. |
| « Réduire les animations » | NFR-10, FR-03-01, FR-20-02 | OK | |

---

## Synthèse

Section (b) : 211 assertions. R : 153 COUVERT, 2 PARTIEL (16d.1, 16o.4). C : 13 COUVERT. D : 10 via H, 3 résolues par Q ou P, 2 requalifiées R, 6 écartées, 1 NON TRAITÉE (21.6). T : 17 hors FR, 0 dans les FR. X : 4 résolues. Les 83 états JSON ont tous au moins une FR.

Ajouts de la section (b), par ordre d'importance : 21.6 non traitée (FR-21-57 exige la conservation des fichiers en citant une déduction D, sans H) ; 11.5 écartée (conservation des côtés, du Compte à rebours et de la Fin au changement de Mode : aucune FR, à arbitrer) ; 16o.4 (Répétitions, échec au milieu : aucun attendu) ; 16d.1 (Phrase intégrale sur les cartes existantes : aucune FR) ; FR-04-01 (retour du focus sans [ASSUMPTION: H13]) ; annexe A.2 l. 2572 (22t.3 dite « non reprise » à tort) ; FR-15-03 (attendu bilatéral non chiffré dans la puce principale).

Sections a, c, d, e, par ordre d'importance :

1. ED-02 : typographie, couleur et contour/ombre des blocs (Nom, Description, Carte, `Terminer`, Médias) ne sont pas écrits. Ils sont renvoyés à FR-22-01 et aux frames, alors que l'attendu demande de les écrire avant le développement. PARTIEL ×4.
2. Contradiction interne entre FR-01-09 (mention d'origine du N hérité hors périmètre) et FR-12-07 (mention exigée).
3. ED-03 : le voile des popovers n'a aucune conséquence testable.
4. ED-01 : le parcours « créer dans une Séance » n'a pas de point d'entrée testable.
5. ED-03 : les décisions de recette PRE-3 maintenues ne sont pas inventoriées.
6. Ajouts non marqués [ASSUMPTION] : FR-18-20 (Récupération retirée, message non réaffiché), FR-18-15 (nouvelle tentative de migration), FR-12-06 (libellés lus dans Figma).
7. Plages périmées « P1 à P37 / H4 à H23 » dans l'en-tête du PRD.
8. P25 n'est pas cité. Les frames 8328:39072 et 8328:39181 ne sont reliées à aucune FR. L'ordre de lecture des sources d'AGENTS.md n'est pas repris en NFR.
