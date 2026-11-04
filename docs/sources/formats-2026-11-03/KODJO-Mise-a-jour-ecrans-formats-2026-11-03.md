# KODJO — Mise à jour des écrans Formats du 3 novembre 2026 (documentation et développement)

**Constat :** ces modifications Figma ne sont **pas encore reportées** dans le dépôt. Sur `main` @ `88f3ffc7`, `docs/KODJO-Formats-entrainement-2026-11-02.md` décrit encore :
- des questionnaires en plein écran, avec le nom de la Séance ;
- le libellé « Ouvrir le catalogue » ;
- une modale de catalogue séparée ;
- aucun tableau de répétitions EMOM ni Death by.

**Destinataire :** ChatGPT.
1. Mettre à jour la documentation (référence Formats, ch06, ch08, ch13, PRODUCT).
2. Préparer les corrections du développement en cours, sur les Formats PRE-9 (C.2 à C.6).

**Source :** Figma `G6RY5Ebhgwb4AHIOYDwwvg`, page « Prototype MVP », rangée des Formats. Chaque règle ci-dessous est représentée dans les écrans cités.

---

## 1. Questionnaires et récapitulatifs présentés en modale

**Règle.** Le parcours Format (questionnaire, puis récapitulatif) est appelé depuis la Composition de la Séance : c'est une **modale**, pas un écran.

| Élément | Règle |
|---|---|
| Apparition | Par le bas, jusqu'à juste sous le titre de l'écran de Composition (y = 95 sur 874) |
| Forme | Pleine largeur, coins hauts arrondis (24 px), coins bas carrés, sans poignée |
| Fond | La Composition de la Séance reste visible sous le voile modal, comme sous le menu Créer |
| En-tête de la modale | Questionnaire : **croix** (fermer, retour à la Composition) et **nom du Format** en titre. Récapitulatif : **bouton Retour** (retour au questionnaire, réponses conservées) et nom du Format. En-tête transparent, sans trait de séparation, posé sur la zone de contexte. |
| Composant d'en-tête | « DSF / Overlays / En-tête de modale », variante standard **Sélection** (croix et titre, sans bouton de validation) ; titre Inter Semi Bold 18, centré. Sur les récapitulatifs, la croix est remplacée par `icon/retour`. Seuls remplacements locaux : fond transparent et trait masqué, pour se poser sur la zone de contexte. La fiche du mouvement garde fond blanc et trait. |
| Zone de contexte | Part du haut de la modale ; hauteur d'origine (109 px) ; couleur et motif du Format |
| Tagline | 14 px (au lieu de 13), interligne 20, **centrée**, sur deux lignes, juste sous le titre |
| Déroulé et bouton | Calés en bas, positions inchangées (bouton à 802 px du haut de l'écran ; déroulé 25 px au-dessus) |
| Clavier | Au premier plan, au-dessus de la modale, pendant la saisie d'un mouvement |
| Défilement | Si le contenu dépasse, le contenu de la modale défile ; le bouton reste en bas |

**Écrans :** les 13 « … — Questionnaire » et les 18 « … — Récapitulatif » de la rangée des Formats (Tabata, EMOM, AMRAP, Death by, For time, 30/30, Renforcement, Superset, Progression, À l'échec).

**Tagline Death by**, raccourcie pour tenir sur deux lignes : « Une répétition de plus à chaque minute. On continue tant qu'on termine dans la minute. »

## 2. Suppression du nom de la Séance dans le parcours Format

**Règle.** Le questionnaire et le récapitulatif **n'affichent plus le nom de la Séance**, ni son champ. Ils sont appelés depuis la Séance elle-même : le nom s'y règle, dans la Composition. Le bloc « Titre de séance » (nom, couleur, durée, actions) est retiré de ces écrans.

## 2 bis. Bouton du questionnaire : « Valider les paramètres »

**Règle.** Le questionnaire ne mène pas directement à la Séance : il ouvre le récapitulatif. Son bouton d'action s'appelle donc **« Valider les paramètres »**, au lieu de « Enregistrer dans la séance ». **« Enregistrer dans la séance »** reste le libellé du bouton du **récapitulatif**, qui ajoute la structure au brouillon de Composition.

**Écrans :** les 13 « … — Questionnaire » de la rangée des Formats, dont les deux saisies d'un mouvement et « AMRAP — Questionnaire, plusieurs blocs », qui portait jusqu'ici « Valider ».

## 3. Ouverture du catalogue depuis un questionnaire : « mode catalogue »

**Règle.** « Ouvrir le mode catalogue » **ne quitte pas la modale du questionnaire**, et n'ouvre pas de modale séparée.
- La zone de recherche se **détache** : elle reste affichée en permanence, avec le texte déjà saisi et des résultats déjà filtrés.
- Une **croix d'effacement** apparaît dans le champ dès qu'un texte est saisi : pastille grise de 20 px, zone tactile de 44 × 44.
- Sur la ligne de recherche, à droite : **Filtrer**, **Trier** et **Replier / déplier les piles**. Ce dernier contrôle est nouveau, avec le même gabarit (34 × 34) et le même état inactif que Trier.
- Les résultats occupent **toute la hauteur jusqu'en bas de la modale**, directement sous la ligne de recherche, **sans compteur** « n familles · n mouvements » (réservé au Catalogue des mouvements). Ils utilisent la petite carte « Carte — Mouvement sélectionné » (§5), avec le filet des niveaux d'une même famille.
- Le bouton **« Ajouter »** en bas ajoute la sélection et referme le mode catalogue.
- Le lien de section devient **« Fermer le mode catalogue »**, qui revient à la saisie sans rien ajouter.
- Buy-in AMRAP : la section s'intitule « Mouvement du buy-in », et la sélection est unique.

**Libellés.** « Ouvrir le mode catalogue » remplace « Ouvrir le catalogue ». La règle d'ajout d'un mouvement (référence Formats, §7.1) est à mettre à jour en conséquence.

**Écrans :** « P-Tabata — Questionnaire, saisie d'un mouvement », « AMRAP — Questionnaire, saisie d'un mouvement », « P-Tabata — Choix des mouvements », « AMRAP — Choix des mouvements », « AMRAP — Choix du buy-in ».

## 3 bis. Fiche du mouvement en modale depuis le questionnaire ou le récapitulatif

**Règle.** Dans le questionnaire ou le récapitulatif d'un Format, **appuyer sur la photo** d'une carte de mouvement ouvre la **fiche du mouvement en modale**, par-dessus la modale du Format :
- elle apparaît **par le bas**, pleine largeur, coins hauts arrondis (24 px), sur un second voile ;
- son en-tête porte la croix et le titre « Fiche du mouvement » ;
- elle présente la fiche habituelle : nom, catégorie, zones corporelles, niveau, média, description et phases du mouvement ;
- **en consultation seulement**, sans bouton d'action : la croix la ferme et revient au questionnaire ou au récapitulatif, dans le même état ;
- l'appui sur le reste de la carte garde son comportement existant.

**Écran :** « P-Tabata — Récapitulatif, fiche du mouvement (modale) », qui reprend le contenu de « Mouvement — Fiche ».

## 4. EMOM et Death by

### 4.1 EMOM : mode Répétitions imposé
**Règle.** En EMOM, le **Mode est imposé à Répétitions**, Durée est grisée. Il ne s'agit plus seulement d'un mode par défaut.

**Justification :** le repos d'un EMOM est le temps qui reste dans la minute, ce qui n'a de sens que si la durée du travail varie. Un travail de durée fixe dans chaque minute est un intervalle, couvert par le départ rapide 30/30.

**Écrans :** « EMOM — Modale exercice, standard », « EMOM — Modale exercice, dans chaque intervalle ».

À reporter dans la référence Formats, §10 et tableau EMOM.

### 4.2 EMOM : tableau des répétitions par mouvement
**Règle.** Sur les récapitulatifs EMOM à plusieurs mouvements (dans chaque intervalle, en alternance, à la suite), un tableau **« Mouvement | Rép. »** est placé dans les paramètres, juste sous « Nombre de séries ». Chaque mouvement a son propre nombre de répétitions, par exemple Squats sautés 10 et Fentes avant 15.

Présentation identique au tableau des phases : fond blanc arrondi inséré dans le cadre gris, en-têtes gris, séparateurs fins. La colonne Rép. est alignée à droite sur le texte des autres valeurs.

**La ligne « Repos · jusqu'à la cadence » est retirée.** Le repos n'est pas un paramètre (c'est le temps restant dans la fenêtre), et le libellé prêtait à confusion avec la Cadence.

### 4.3 Death by : tableau départ et incrément par mouvement
**Règle.** Sur les récapitulatifs Death by à plusieurs mouvements (dans chaque intervalle, en alternance, à la suite), un tableau **« Mouvement | Départ | Incrément »** est placé juste sous « Intervalle », par exemple Squats sautés 1 / + 1 et Fentes avant 2 / + 2.

Il **remplace** les lignes communes « Nombre de répétitions » et « Incrément par intervalle ». L'incrément reste au minimum de + 1. Le Death by à un seul mouvement garde ses lignes.

## 5. Composant « Carte — Mouvement sélectionné » (petite carte)

**Règle.** Sur la petite carte (370 × 52), la description tronquée sur une ligne est remplacée par les **zones corporelles** du mouvement, précédées de la pastille de zone corporelle, dans le style des cartes de la Composition (12 px, gris).

Ce changement est fait dans le composant (variantes Possible, Bloquée et Aucune), donc partout où la carte est utilisée : résultats de saisie, mode catalogue, récapitulatifs.

## 6. Alignement des valeurs non modifiables

**Règle.** Dans les cadres de paramètres des questionnaires et des récapitulatifs, une **valeur non modifiable** (Durée totale, Condition d'arrêt…) est alignée à droite **sur le texte** des valeurs modifiables, et non sur le bord de leur pastille. Le retrait vaut la marge intérieure de la pastille, soit 10 px.

La même règle vaut pour les colonnes de valeurs des tableaux (§4.2).

---

## 7. Documentation à mettre à jour

| Document | Sections |
|---|---|
| `docs/KODJO-Formats-entrainement-2026-11-02.md` | §7 Parcours de composition (modale, sans nom de Séance, en-têtes) ; §7.1 bouton « Valider les paramètres » (au lieu de « Enregistrer dans la séance ») ; §7.1 (« Ouvrir le mode catalogue », mode catalogue, croix) ; §7.2 et §7.3 (mode catalogue au lieu de la modale du catalogue) ; §10 EMOM (Répétitions imposé, tableau, retrait de la ligne Repos) ; §12 Death by (tableau départ / incrément) ; §7.4 et §7.5 (appui sur la photo d'une carte : fiche du mouvement en modale) ; §16 Inventaire Figma (§5 de ce document ; contrôle Replier / déplier ; écrans reconstruits ; nouvel écran « P-Tabata — Récapitulatif, fiche du mouvement (modale) » ; en-têtes de modale en variante Sélection) |
| ch06 Écrans et navigation | Parcours Format en modale depuis la Composition |
| ch08 Conception détaillée | Questionnaire et récapitulatif modaux ; mode catalogue |
| ch13 Contrats d'écran | Contrats des questionnaires, récapitulatifs et du mode catalogue ; alignement des valeurs |
| `docs/PRODUCT.md` | Parcours Formats : « fenêtre de choix, puis questionnaire et récapitulatif en modale, puis ajout au brouillon » |

## 8. Corrections à prévoir dans le développement (C.2 à C.6)

À vérifier dans le code de la branche de développement, puis à corriger seulement si l'écart est confirmé :
1. **Présentation modale** du questionnaire et du récapitulatif sur la Composition : apparition par le bas, en-têtes croix ou Retour, fond voilé, clavier au premier plan.
2. **Retrait du nom de la Séance** et du bloc titre dans ces deux étapes ; bouton du questionnaire « Valider les paramètres », celui du récapitulatif « Enregistrer dans la séance ».
3. **Mode catalogue** dans la modale :
   - recherche détachée avec croix d'effacement ;
   - Filtrer, Trier et le nouveau Replier / déplier ;
   - petites cartes sur toute la hauteur, Ajouter, « Fermer le mode catalogue » ;
   - sélection unique pour le buy-in.
4. **EMOM** : Mode Durée désactivé ; tableau « Mouvement | Rép. » au récapitulatif, avec une valeur propre à chaque mouvement ; retrait de la ligne Repos.
5. **Death by à plusieurs mouvements** : tableau « Mouvement | Départ | Incrément » au récapitulatif, avec des valeurs propres à chaque mouvement (au minimum + 1).
6. **Petite carte de mouvement** : zones corporelles à la place de la description.
7. **Fiche du mouvement** en modale par appui sur la photo d'une carte, dans le questionnaire et le récapitulatif ; consultation seule.
8. **Alignement** des valeurs non modifiables et des colonnes de tableau sur le texte des valeurs modifiables.

Les règles du moteur ne changent pas. Les valeurs propres à chaque mouvement (répétitions EMOM, départ et incrément Death by) sont celles des Exercices standards déjà portées par chaque Exercice : il n'y a aucun nouveau champ de données.
