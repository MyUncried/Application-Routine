# 13 – Contrats d’écran

## 1. Objet et statut normatif

Ce chapitre constitue la **spécification déterministe des écrans de production** de KODJO. Il transforme les décisions fonctionnelles, règles métier, modèle de données, API fonctionnelles, architecture, Design System Figma et frames de référence en critères directement exploitables par le développement et la recette.

Pour T03, un écran n’est considéré comme spécifié que si son contrat définit sans interprétation implicite : son contexte d’entrée et de sortie, ses données et leurs sources, ses états, ses contrôles, ses gestes, ses règles de validation et de persistance, son accessibilité, ses invariants et ses tests de conformité.

Les contrats T03 actifs sont `CE-T03-01` à `CE-T03-17`. Ils couvrent le Catalogue multi-type, le Catalogue des activités, le cycle de vie de `ActivityDefinition`, l’ajout depuis la Composition, la sélection multiple, les corrections UX transverses, l’Exécution directe d’une Activité, la Synthèse, le Suivi, la sortie Catégories et la navigation globale.

L’ancien chapitre 13 est conservé sans transformation dans `13A – Contrats d’écran hérités avant T03 Catalogue.md` à seule fin de traçabilité. Il reste applicable aux contrats T01/T02 qui ne sont pas supersédés par le présent chapitre. Ses anciens contrats `CE-T03-01` à `CE-T03-13`, relatifs au moteur d’Exécution des Séances, sont **renumérotés fonctionnellement T04** et ne constituent plus des contrats T03.

### 1.1 Remapping obligatoire des anciens contrats d’Exécution

| Ancien identifiant historique | Identifiant courant | Périmètre courant |
|---|---|---|
| `CE-T03-01` … `CE-T03-13` de l’annexe 13A | `CE-T04-01` … `CE-T04-13` | Moteur d’Exécution complet des Séances, hors T03 |

Aucun développement T03 ne doit utiliser l’ancien numéro T03 pour justifier une fonctionnalité d’orchestration de Séance.

## 2. Sources et ordre d’application

Pour chaque contrat T03, les sources sont lues conjointement dans l’ordre suivant :

1. décisions D-167 à D-183 et décisions antérieures qu’elles confirment ;
2. chapitres 08 à 11 pour les comportements, données et API ;
3. chapitre 06 et `06 bis – Corrections UX T03 Catalogue.md` pour navigation et interactions ;
4. chapitre 12 pour Shells, composants, tokens, architecture et accessibilité ;
5. présent contrat ;
6. frame Figma identifiée, référence visuelle du rendu représenté.

Figma ne crée pas une règle métier à partir d’une valeur de démonstration. La documentation ne remplace pas un composant visuel Figma par une approximation locale. Toute divergence non arbitrée est `À CLARIFIER` avant développement.

## 3. Structure canonique obligatoire d’un contrat

Chaque contrat T03 couvre les sections suivantes :

1. Identification ;
2. Finalité fonctionnelle ;
3. Contexte d’entrée ;
4. Contexte de sortie / destinations ;
5. Données affichées et source de vérité ;
6. Classification des valeurs Figma ;
7. Structure de l’écran ;
8. Éléments obligatoires ;
9. Layout déterministe ;
10. Responsive `360 / 402 / 440`, Safe Areas, texte, scroll et clavier ;
11. États de l’écran ;
12. Contrôles et interactions ;
13. Gestes ;
14. Validation ;
15. Brouillon et persistance ;
16. Navigation et conservation d’état ;
17. Erreurs et cas limites ;
18. Accessibilité ;
19. Invariants ;
20. Recette déterministe ;
21. Traçabilité.

Lorsqu’une section n’a aucun comportement spécifique, elle reste présente et renvoie explicitement aux règles communes ; elle ne peut pas être omise silencieusement.

## 4. Règles communes T03

### 4.1 Données Figma

Chaque valeur visible appartient à une classe :

- `LIBELLÉ STATIQUE OBLIGATOIRE` : peut être codé comme texte d’interface via i18n ;
- `DONNÉE MÉTIER DYNAMIQUE` : provient d’une entité, d’un brouillon ou d’un calcul ;
- `VALEUR DE DÉMONSTRATION FIGMA` : illustre un cas et ne peut jamais être codée en dur.

Les noms d’Activités/Séances, catégories, zones corporelles, durées, répétitions, séries, dates, commentaires, ressentis et positions de cartes représentés dans Figma sont des données dynamiques ou de démonstration, sauf mention contraire dans un contrat.

### 4.2 Layout et responsive

- Surface Figma standard : `402 × 874 pt`.
- Références adaptatives obligatoires : `360`, `402`, `440` points.
- Les coordonnées Figma servent à la comparaison de la surface 402 ; elles ne deviennent pas des coordonnées absolues React Native.
- Les Shells, marges, Safe Areas, scrolls et zones fixes du chapitre 12 prévalent.
- Aucun élément obligatoire ne peut être tronqué, recouvert ou placé sous la navigation/action fixe.
- Une cible interactive est au minimum `48 × 48 pt`, sauf exception documentée.

### 4.3 Navigation globale T03

Le libellé permanent du premier onglet est `Catalogues`. Les titres contextuels sont `Catalogue des séances`, `Catalogue des activités` et `Catalogue des circuits`.

Composant DSF : `Navigation / Bottom — Source exact` (`2537:214`). Les dessins des destinations ont une dimension maximale `24 pt`, centrée dans une boîte optique `32 × 32 pt` ; aucune substitution glyphe/emoji/système n’est admise.

### 4.4 Conservation d’état Catalogue

Recherche, filtres, tri et scroll sont conservés pendant un aller-retour de parcours courant. Ils ne sont pas persistés après fermeture complète/relaunch. À l’ouverture initiale ou au relaunch, le segment `Séances` est sélectionné.

### 4.5 Roulettes

Une roulette ouverte applique un scrim qui bloque les interactions arrière-plan. Le CTA fixe inférieur reste visuellement dans son apparence active normale, mais est fonctionnellement désactivé et non déclenchable via VoiceOver/TalkBack. `Annuler` restaure l’état calculé antérieur ; `Confirmer` applique puis recalcule.

### 4.6 Swipe contextuel

Un swipe gauche déplace réellement la carte et révèle progressivement les actions derrière. Une seule carte peut exposer des actions. Les autres contrôles restent utilisables ; un swipe gauche sur une autre carte n’ouvre pas un deuxième contexte. Le fond ne ferme pas l’état. Le tap sur la surface principale de la carte ouverte, hors actions, n’exécute rien. Seul un swipe droit commencé sur la carte ouverte la referme.

### 4.7 Cartes structurelles Composition

`Compte à rebours initial` et `Fin de séance` ne sont jamais déplaçables : aucun appui long, aucune poignée de déplacement, aucune cible de drag.

---

# 5. Bloc B1 — Catalogue multi-type

## CE-T03-01 — Catalogue des séances — état T03

### 1. Identification

| Propriété | Valeur |
|---|---|
| Bloc | B1 — Catalogue multi-type |
| Écrans/états couverts | S01, état vide S01/S03 équivalent, liste standard, retour Catégories |
| Contenus T03 | E01, E02, E04, E05, E06, E19, E67, E68, E69 |
| Frames | `2117:86` état vide ; `1992:9910` liste ; `3841:8375` arbre Créer |
| Shell | `Shell / Screen`, `Context=On`, `Bottom=Navigation` |
| Nature | Modification d’un écran existant |

### 2. Finalité fonctionnelle

Présenter les Séances tout en devenant l’entrée par défaut du Catalogue multi-type. T03 n’altère pas les règles métier des cartes de Séance hors corrections transverses ; il active le segment `Activités`, laisse `Circuits` désactivé, remplace le libellé de navigation basse par `Catalogues` et fait de `Créer` une entrée vers l’arbre multi-type.

### 3. Contexte d’entrée

- fin du Splash ;
- tap `Catalogues` depuis une autre destination ;
- retour d’un parcours de Séance ;
- retour après `Enregistrer la séance` depuis Catégories.

Au lancement/relaunch, `Séances` est sélectionné indépendamment du dernier segment utilisé avant fermeture.

### 4. Sorties / destinations

| Action | Destination |
|---|---|
| Segment `Activités` | `CE-T03-02` Catalogue des activités |
| Segment `Séances` | reste sur l’état courant |
| Segment `Circuits` | aucune navigation ; contrôle désactivé |
| `Créer` | `CE-T03-03`, contexte Catalogue des séances |
| carte Séance | parcours existant T01/T02 |
| bottom nav | destination correspondante |

La transition vers un écran suivant suit D-178 : cible depuis la droite, courant vers la gauche.

### 5. Données / source de vérité

Liste, filtres et cartes proviennent des repositories/services Séance existants. Aucune carte de démonstration ne peut être injectée pour remplir l’écran.

### 6. Classification Figma

`Catalogue des séances`, `Activités`, `Séances`, `Circuits`, `Créer`, `Catalogues` = libellés statiques. Noms, catégories, durées et nombres de cartes = données dynamiques / démonstration Figma.

### 7. Structure

Header fixe → segmenté 3 types → action `Créer` → Body liste/état vide → Bottom Navigation.

### 8. Éléments obligatoires

- titre `Catalogue des séances` ;
- segments égaux `Activités / Séances / Circuits` ;
- `Séances` sélectionné, `Activités` actif, `Circuits` visible disabled ;
- action `Créer` avec icône DSF Ajouter ;
- navigation `Catalogues / Calendrier / Suivi / Profil` + Recherche.

### 9. Layout déterministe

Conserver le Shell et les relations Figma existantes. Le segmenté occupe la largeur utile. `Créer` est centré. Le Body ne passe pas sous la Bottom Navigation.

### 10. Responsive

Appliquer les marges `16 pt` en compact et `24 pt` dès 390 ; contrôle segmenté flexible ; labels non tronqués ; navigation DSF recalculée selon largeur.

### 11. États

- vide réel ;
- liste réelle ;
- retour Catégories avec `Séances` sélectionné ;
- ouverture arbre Créer ;
- relaunch : état par défaut Séances.

### 12. Contrôles

`Activités` navigue ; `Séances` recharge/maintient ; `Circuits` disabled ; `Créer` ouvre l’arbre ; nav globale fonctionnelle selon capacités déjà livrées.

### 13. Gestes

Les cartes de Séance suivent la règle T03 de swipe contextuel commune lorsqu’elles exposent des actions.

### 14. Validation

Aucune validation locale pour changer de segment. `Circuits` ne peut produire aucun événement métier.

### 15. Brouillon / persistance

Aucune persistance du segment courant au relaunch. L’arbre `Créer` ne crée aucun objet tant qu’une option active n’est pas choisie.

### 16. Navigation / conservation

Retour de Catégories force `Catalogue des séances`, segment `Séances`; les autres retours restaurent l’état prévu par leur parcours.

### 17. Erreurs / limites

Erreur de chargement : ne pas substituer de fausses cartes. État vide uniquement si la requête réelle est vide.

### 18. Accessibilité

`Circuits` expose disabled. `Catalogues` est l’intitulé accessible de la destination. Chaque segment et icône possède rôle et état sélectionné/disabled appropriés.

### 19. Invariants

- `Séances` est le segment initial/relaunch ;
- `Activités` est actif T03 ;
- `Circuits` reste inactif ;
- bottom nav = `Catalogues`, jamais `Séances`.

### 20. Recette

1. lancement avec 0 puis N Séances ;
2. vérifier segment initial Séances ;
3. ouvrir Activités ;
4. vérifier Circuit non activable ;
5. ouvrir `Créer` ;
6. revenir/annuler sans mutation ;
7. relaunch après avoir quitté sur Activités : retour Séances ;
8. 360/402/440 + texte agrandi ;
9. test négatif : `Séances` en bottom nav = échec.

### 21. Traçabilité

| T03-E | Décisions / règles | Figma / DSF | Modèle/API | Tests |
|---|---|---|---|---|
| E01–E06 | D-167, D-179 | 2117:86, 1992:9910, 2537:214 | Catalogue/Séance | CE-T03-01-T01..T09 |
| E67–E69 | D-168, D-178 | 2028:11204 → Catalogue | API-SEA-03/04 | retour Catégories |

---

## CE-T03-02 — Catalogue des activités — liste, recherche, tri et cartes

### 1. Identification

| Propriété | Valeur |
|---|---|
| Bloc | B1 |
| États | S02–S12 |
| T03-E | E03, E07–E12, E32–E36, E58–E62, E73 |
| Frame principale | `3786:5093` |
| État contextuel | `3787:5209` |
| Composant Déployer | `2537:1033 — State=Collapsed` |
| Navigation | `2537:214` |
| Nature | Nouvel écran fonctionnel T03 |

### 2. Finalité

Lister les `ActivityDefinition` persistantes, permettre recherche/tri/filtrage, consultation/modification et lancement direct d’une Activité, sans confondre la surface de carte, Lecture et `Déployer`.

### 3. Entrées

Segment `Activités` depuis Catalogue, retour éditeur, retour Exécution directe, retour archives. Lors d’un aller-retour courant, restaurer query/filtres/tri/scroll.

### 4. Sorties

- surface principale carte → `CE-T03-04` modification ;
- Lecture → `CE-T03-09` ;
- `Créer` → `CE-T03-03` ;
- swipe actions → `CE-T03-05` selon état ;
- segment `Séances` → CE-T03-01.

### 5. Données

Source : `ActivityDefinitionRepository` / services Catalogue. Tri par défaut : dernière modification décroissante. Une exécution ne change pas la date de modification. La Récupération affichée dépend uniquement de la définition concernée.

### 6. Classification Figma

Noms d’Activités, séries, durées, zones, récupération de la première carte = démonstration/données dynamiques. `Catalogue des activités`, `Créer`, segments = statiques.

### 7. Structure

Header → segmenté → `Créer` → liste scrollable → navigation. Chaque carte : barre verticale bleue, contenu métier, zone `Déployer`, zone Lecture.

### 8. Éléments obligatoires

- barre bleue ;
- contenu aligné identiquement entre cartes ;
- `Déployer` visible disabled sur chaque carte ;
- zone réservée identique ;
- Lecture active indépendante ;
- aucune poignée/marge de déplacement.

### 9. Layout

`Déployer` et Lecture sont ancrés à droite selon Figma/DSF. Aucune variation de largeur utile liée au contenu. Les cartes grandissent si le texte l’exige.

### 10. Responsive

Liste et cartes utilisent la largeur utile 360/402/440. Les cibles tactiles restent ≥48. Le texte peut passer sur deux lignes selon règles communes.

### 11. États

liste, vide, recherche, filtre/tri, retour restauré, carte en swipe, carte ouverte, archives via CE-T03-05.

### 12. Contrôles

Surface principale = consultation/modification. Lecture = Exécution directe uniquement. `Déployer` = aucun déclenchement et état accessible disabled. `Créer` = arbre. Les contrôles des autres cartes restent actifs lorsqu’une carte est ouverte en swipe, sauf second swipe contextuel.

### 13. Gestes

Appliquer exactement §4.6. Aucun drag/appui long de déplacement sur carte Catalogue.

### 14. Validation

Lecture est disponible uniquement pour une définition exécutable valide selon les règles métier ; sinon l’état/retour d’éligibilité prévu s’applique, sans Séance artificielle.

### 15. Persistance

La liste n’altère pas les définitions lors de navigation. Les critères UI ne sont pas persistés au-delà du relaunch.

### 16. Conservation

Édition/Exécution puis retour : restaurer recherche/filtres/tri/scroll. Relaunch : perdre cet état et revenir segment Séances.

### 17. Erreurs

Définition supprimée entre rendu et action : rafraîchir la liste et signaler l’indisponibilité, sans créer de copie fantôme.

### 18. Accessibilité

Lecture : `Exécuter l’activité <nom>`. Déployer : disabled/non activable. Carte : `Ouvrir l’activité <nom>`. Actions de swipe accessibles par équivalent d’action si le framework le permet.

### 19. Invariants

Déployer visible mais disabled ; Lecture indépendante ; aucune poignée ; première carte avec Récupération n’est pas une règle de position.

### 20. Recette

Tester 0/N cartes, données diverses, récupération 0/>0, Lecture, surface carte, Déployer impossible, swipe, retour état, relaunch, responsive, contenu long. Tests négatifs : absence de Déployer, Déployer actif, poignée visible, récupération forcée sur première carte = échecs.

### 21. Traçabilité

E03/E07–E12 → D-167/D-168/D-169 ; E32–E36 → D-173 ; E58–E62 → D-175 ; Figma `3786:5093`, `3787:5209`; API Catalogue/ActivityDefinition; tests CE-T03-02.

![Catalogue des activités](./images/CE-ACT-EXE-01a-catalogue-activites-liste-t03.jpg)

---

## CE-T03-03 — Catalogue — arbre `Créer`

### 1. Identification

| Propriété | Valeur |
|---|---|
| Bloc | B1 |
| États | S13–S17 |
| T03-E | E19–E21, E71, E72 |
| Frame Activités | `3787:5148` |
| Frame Séances | `3841:8375` |
| Nature | Nouvel état contextuel partagé |

### 2. Finalité

Permettre de choisir explicitement le type de contenu à créer sans muter le Catalogue avant choix.

### 3. Entrée

Tap `Créer` depuis Catalogue activités ou séances, avec contexte complet courant mémorisé.

### 4. Sorties

Ordre exact : `Une nouvelle activité` → CE-T03-04 création ; `Une séance` → Composition création ; `Un circuit` disabled ; `Annuler` → retour exact contexte précédent.

### 5. Données

Aucune donnée métier n’est créée à l’ouverture. Le fond conserve visuellement le Catalogue d’origine.

### 6. Classification Figma

Les quatre libellés sont statiques obligatoires. Les cartes visibles derrière sont dynamiques/démonstration.

### 7. Structure

Fond Catalogue sous scrim + arbre d’actions contextuel. Les quatre options respectent l’ordre défini.

### 8. Éléments obligatoires

Icônes vectorielles DSF ; `Annuler` = icône Ajouter tournée 45°, pas un X texte ; Circuit visible disabled ; aucune substitution système.

### 9. Layout

Positions et perspectives suivent les frames Figma ; l’arbre reste rattaché au bouton Créer sans sortir de la Safe Area.

### 10. Responsive

Sur 360, conserver cibles ≥48 et libellés complets ; l’arbre peut ajuster son placement, jamais réduire les cibles.

### 11. États

ouvert sur fond Activités ; ouvert sur fond Séances ; Circuit disabled ; retour Annuler.

### 12. Contrôles

Seules Activité, Séance et Annuler sont activables. Circuit annonce disabled.

### 13. Gestes

Tap uniquement ; scrim/fond n’est pas une action de fermeture implicite si le contrat ne le prévoit pas.

### 14. Validation

Aucune validation métier à l’ouverture ; chaque option active initialise son propre brouillon après sélection.

### 15. Brouillon

Aucun draft créé avant choix ; Annuler ne crée/modifie rien.

### 16. Conservation

Annuler restaure exactement segment, recherche, filtres, tri, scroll et contexte avant ouverture.

### 17. Erreurs

Échec d’initialisation d’un brouillon : rester/restaurer Catalogue sans donnée partielle.

### 18. Accessibilité

Ordre de focus = ordre visuel ; Circuit disabled ; Annuler nommé explicitement.

### 19. Invariants

Ordre exact ; Circuit non fonctionnel ; Annuler sans mutation ; mêmes vecteurs DSF.

### 20. Recette

Tester deux fonds, quatre lignes, navigation active, Circuit disabled, Annuler exact, 360/402/440. Négatif : X texte, ordre différent, création Circuit, perte de scroll = échec.

### 21. Traçabilité

E19–E21/E72 → D-167/D-168/D-183 ; Figma `3787:5148`, `3841:8375`; aucune écriture API à l’ouverture.

![Arbre Créer — Catalogue activités](./images/CE-ACT-EXE-01b-catalogue-creer-arbre-actions-t03.jpg)

---

# 6. Bloc B2 — CRUD / cycle de vie ActivityDefinition

## CE-T03-04 — Éditeur `ActivityDefinition` — créer / modifier

### 1. Identification

| Propriété | Valeur |
|---|---|
| Bloc | B2 |
| États | S18–S27 |
| T03-E | E12–E14, E30, E41, E50–E57, E71 |
| Frames persistant | `3879:5947`, `3879:6079` |
| Durée | `3542:4656` |
| Répétitions | `3561:4695` |
| À l’échec | `3561:7802` |
| D→G / G→D | `3679:4880`, `3724:5428` |
| Roulettes | `3556:7645`, `3556:7712`, `3556:7801`, `3561:7673` |
| Responsive | `2296:91`, `2296:173`, `2296:255` |

### 2. Finalité

Créer ou modifier une définition persistante complète sans exposer les médias fonctionnels T03 et sans changer les calculs bilatéraux validés.

### 3. Entrée

Création depuis CE-T03-03 ou modification depuis carte CE-T03-02.

### 4. Sorties

`Terminer` valide puis retourne au Catalogue activités ; Retour/abandon suit le comportement de brouillon déjà défini pour l’éditeur.

### 5. Données

Nom, Description, mode, cible, Séries, Pause, Récupération, zones, `sideMode`, Durée totale calculée. Création = brouillon ; modification = copie éditable de l’ActivityDefinition existante jusqu’à validation.

### 6. Classification Figma

Valeurs numériques/noms/zones = dynamiques/démonstration. Titres de sections, modes, `Séries`, `Pause`, `Récupération`, `Durée totale`, `Terminer` = statiques.

### 7. Structure

Nom → Ajouter média visible disabled → accordéons Description / Zone / Mode / Médias selon règles → paramètres `Séries / cible / Pause`, puis `Côté / Récupération / Durée totale` → Synthèse fixe → `Terminer`.

### 8. Éléments obligatoires

- mode segmenté 3 options égales ;
- `Durée totale` visible dans les 3 modes ;
- en Reps/Échec : `≥ durée connue` ;
- nom de l’Activité **en gras dans la Synthèse uniquement** ;
- Ajouter média visible disabled, section Médias masquée selon MVP ;
- contrôle côté 74×42 hors Tour ;
- roues canonique Annuler/Confirmer.

### 9. Layout

Réutiliser DSF et grilles ; aucun offset compensatoire local. En Reps/Échec, aligner `Durée totale` avec Pause et centrer la valeur cible selon Figma ; zone de sélection Mode suit exactement le contrôle.

### 10. Responsive

Frames de validation 360/402/440 font foi pour l’organisation. Contenu central scrollable, synthèse/action restent accessibles ; clavier ne masque pas le champ actif.

### 11. États

création/modification ; Durée/Reps/Échec ; D→G/G→D/UNILATERAL ; roues ouvertes ; Séries pilote ; Durée totale pilote ; ajustement temporaire ; Description/Zone déployées.

### 12. Contrôles

Tout contrôle modifie le brouillon. Wheel ouverte : appliquer §4.5. `Terminer` ne persiste qu’un état valide.

### 13. Gestes

Tap/scroll ; pas de swipe métier dans l’éditeur. Haptique roulette à chaque changement effectif selon règle existante.

### 14. Validation

Nom obligatoire ; mode valide ; cible requise selon mode ; Séries 1..99 ; Pause/Récupération ≥0. D-155/D-156 gouvernent calculs. À l’échec n’a aucune cible chiffrée.

### 15. Brouillon / persistance

Création persiste `ActivityDefinition` seulement à `Terminer`. Modification persiste atomiquement. Annulation d’une roulette ne modifie pas le brouillon calculé précédent.

### 16. Navigation

Retour réussi → Catalogue activités avec état aller-retour restauré. Pas de création de `SessionActivity` dans ce contexte.

### 17. Erreurs

Échec persistance : rester dans l’éditeur, conserver brouillon, réactiver action, aucun enregistrement partiel.

### 18. Accessibilité

Modes exposent selected ; roues masquent/inactivent background ; CTA derrière non focusable pendant roulette ; textes dynamiques annoncés avec unité.

### 19. Invariants

Aucun média fonctionnel ; nom gras seulement dans Synthèse ; `Durée totale` toujours visible ; aucune nouvelle logique bilatérale.

### 20. Recette

Créer/éditer chaque mode ; roues Annuler/Confirmer ; calculs ; 3 sideModes ; échec persistance ; responsive ; texte agrandi. Tests négatifs : Durée totale masquée, CTA wheel activable, média fonctionnel, nom non gras dans Synthèse = échecs.

### 21. Traçabilité

E12–E14/E30 → D-169/D-171 ; E41 → D-143..D-156 ; E50–E57 → D-174/D-181/D-182 ; API-ACT-01..03 ; frames ci-dessus.

---

## CE-T03-05 — Cycle de vie ActivityDefinition — archiver / restaurer / supprimer

### 1. Identification

Bloc B2 ; états S28–S33 ; T03-E E15–E18, E58–E62. Aucun frame Activity-archives dédié n’existe dans Figma courant ; la présentation réutilise le pattern validé des archives Séance (`1992:10749`, `2234:88`, `1992:10848`, `2234:189`) et les composants partagés. Cette réutilisation ne transforme pas le contenu Séance en règle Activity.

### 2. Finalité

Permettre l’archivage, la restauration et la suppression définitive depuis les archives sans cascade vers copies ou historique.

### 3. Entrée

Swipe sur ActivityDefinition active → Archiver ; vue/filtre Archives → Restaurer/Supprimer.

### 4. Sorties

Archivage retire de la liste active ; Restaurer remet active et affiche feedback ; Supprimer définitif après confirmation reste dans archives/liste recalculée.

### 5. Données

Source = statut/date d’archivage ActivityDefinition. Historique et SessionActivity ne sont jamais requis pour reconstruire la carte active.

### 6. Classification

Nom Activity = dynamique ; `Archiver`, `Restaurer`, `Supprimer`, confirmation = statiques.

### 7–9. Structure / éléments / layout

Réutiliser les composants de swipe, archives, snackbar et confirmation Séance en substituant uniquement les données/libellés métier Activity appropriés. La carte suit le swipe ; actions derrière ; aucune deuxième carte ouverte.

### 10. Responsive

Pattern partagé 360/402/440 ; boutons destructifs conservent cibles ≥48.

### 11. États

active, archivée, snackbar restaurée, confirmation suppression, liste après suppression.

### 12–13. Contrôles / gestes

Swipe selon §4.6. Supprimer n’existe que depuis archives. Confirmation destructive explicite.

### 14–15. Validation / persistance

Archiver/Restaurer/Supprimer sont transactionnels. Suppression définitive interdit toute cascade vers `SessionActivity`, snapshots, Results/Executions.

### 16. Navigation

Conserver filtre Archives/scroll dans le parcours courant après action lorsque possible.

### 17. Erreurs

Échec d’écriture : conserver l’état affiché cohérent avec stockage ; ne pas masquer la carte sans succès confirmé.

### 18. Accessibilité

Destructif annoncé ; confirmation focusée ; swipe dispose d’équivalents accessibles.

### 19. Invariants

Suppression uniquement depuis archives ; copies/historique intacts.

### 20. Recette

Archiver → vérifier disparition active ; restaurer → feedback ; supprimer → confirmer ; vérifier copie Session existante et historique ; échec DB ; swipe concurrence. Négatif : suppression directe active ou cascade = échec.

### 21. Traçabilité

E15–E18 → D-121/D-169 ; E58–E62 → D-175 ; modèle 09 bis ; API ActivityDefinition lifecycle.

---

# 7. Bloc B3 — Ajouter depuis Composition

## CE-T03-06 — Composition — arbre `Ajouter une activité`

### 1. Identification

Bloc B3 ; états S34–S36 ; T03-E E22–E24 ; frame `3788:5258`.

### 2. Finalité

Choisir entre création Session-only et sélection d’ActivityDefinition existantes sans mutation préalable du draft de Séance.

### 3. Entrée

Tap `+ Ajouter une activité` depuis Composition.

### 4. Sorties

Ordre exact : `Une nouvelle activité` → éditeur SessionActivity ; `Une activité existante` → CE-T03-07 ; `Annuler` → Composition inchangée.

### 5–6. Données / classification

Aucune écriture à l’ouverture. Les trois libellés sont statiques. Contenu Composition derrière = données dynamiques.

### 7–9. Structure / éléments / layout

Arbre contextuel conforme Figma, `Annuler` gris, deux actions principales selon disposition Figma, vecteurs DSF uniquement.

### 10. Responsive

Cibles ≥48, libellés complets, contexte visible sans sortir de la Safe Area.

### 11. États

ouvert, Annuler, navigation nouvelle, navigation existante.

### 12–13. Contrôles / gestes

Tap uniquement ; fond ne mutile pas le draft. `Annuler` ferme.

### 14–15. Validation / brouillon

Aucune mutation du draft Session avant choix. `Une nouvelle activité` crée un brouillon SessionActivity, jamais ActivityDefinition. Aucun `Enregistrer dans le catalogue` T03.

### 16. Navigation

Retour depuis sous-parcours rétablit Composition et son scroll/état.

### 17. Erreurs

Échec d’ouverture sous-parcours → Composition intacte.

### 18. Accessibilité

Ordre focus = ordre visuel ; Annuler explicite.

### 19. Invariants

Nouvelle = Session-only ; aucun save-to-catalogue.

### 20. Recette

Tester les 3 choix, abandon, état Draft inchangé, retour. Négatif : création ActivityDefinition depuis `Une nouvelle activité` = échec.

### 21. Traçabilité

E22–E24 → D-170 ; Figma `3788:5258`; API-COM-03.

---

## CE-T03-07 — Sélection multiple d’Activités existantes

### 1. Identification

Bloc B4 ; états S47–S54 ; T03-E E25–E31 ; frames `3789:5349`, `3789:5405`; image `CE-COMP-SEL-01-selection-activites-existantes.png`.

### 2. Finalité

Sélectionner zéro à N ActivityDefinition, conserver la sélection pendant recherche/filtre et insérer des copies indépendantes dans l’ordre de présentation de la liste filtrée au moment de la validation.

### 3. Entrée

`Une activité existante` depuis CE-T03-06.

### 4. Sorties

Annuler → Composition sans mutation ; Valider avec N>0 → création de N SessionActivity puis retour Composition enrichie.

### 5. Données

Liste = ActivityDefinition actives. Sélection = ensemble d’IDs du draft UI. Ordre final = ordre visible de la liste filtrée, jamais ordre des taps.

### 6. Classification

Noms/paramètres = dynamiques ; compteur sélection et libellés actions = calculés/statiques ; contenus exemples Figma = démonstration.

### 7. Structure

Modal/liste de sélection, recherche/filtre selon frame, indicateur `Search/Selection Check`, compteur, action Valider.

### 8. Éléments

Sélection visuelle vectorielle canonique ; compteur ; validation disabled à 0 ; état sélectionné par ligne ; Annuler.

### 9. Layout

Liste scrollable indépendante ; footer/action fixe si défini ; aucun chevauchement de la zone sélection avec contenu.

### 10. Responsive

360/402/440 ; lignes extensibles ; clavier de recherche ne masque pas validation ou sélection active.

### 11. États

0 sélection, 1, N, recherche active, filtre, validation active/disabled, retour.

### 12. Contrôles

Tap ligne toggle sélection ; recherche/filtre ne perd pas les IDs déjà sélectionnés ; Valider ne déclenche qu’une fois.

### 13. Gestes

Tap et scroll ; aucun reorder manuel.

### 14. Validation

0 → disabled ; N>0 → active. À valider, recalculer l’ordre depuis la liste filtrée courante.

### 15. Persistance

Aucune SessionActivity créée avant validation. Validation transactionnelle : soit toutes les copies sont insérées, soit aucune.

### 16. Navigation

Retour valide → Composition à l’état antérieur enrichi. Annuler → exact état antérieur.

### 17. Erreurs

Une définition sélectionnée supprimée avant validation : recalculer sélection/liste ; empêcher insertion fantôme et informer/laisser l’utilisateur corriger.

### 18. Accessibilité

Chaque ligne annonce sélectionnée/non sélectionnée ; compteur accessible ; validation disabled annoncée.

### 19. Invariants

Ordre liste filtrée ≠ ordre touch ; copies indépendantes ; pas de synchronisation future.

### 20. Recette

Sélection A puis B dans ordre inverse, appliquer filtre, valider et vérifier ordre présentation ; éditer source puis copie pour vérifier indépendance ; test transaction ; 0 sélection. Négatif : insertion dans ordre taps = échec.

### 21. Traçabilité

E25–E31 → D-165/D-171 ; modèle 09 bis ; API sélection/copie ; Figma `3789:5349`, `3789:5405`.

![Sélection d’Activités existantes](./images/CE-COMP-SEL-01-selection-activites-existantes.png)

---

## CE-T03-08 — Composition après insertion et corrections UX

### 1. Identification

Bloc B3/B9 ; états S37–S46 ; T03-E E31, E53, E58–E66 ; frames `2028:11700`, `2028:11808`, roulettes structurelles existantes.

### 2. Finalité

Afficher les copies insérées et appliquer les règles de direction courte, swipe réel, actions glissées, et non-déplaçabilité des cartes structurelles.

### 3. Entrée

Retour éditeur SessionActivity ou CE-T03-07 ; Composition existante.

### 4. Sorties

Tap Activity → édition ; long press Activity → drag ; swipe → actions ; Continuer → Catégories.

### 5. Données

Toutes les cartes proviennent du draft Session. Direction courte : `D→G`/`G→D` hors Tour bilatéral ; aucune indication en UNILATERAL ; sous Tour bilatéral, la carte ne répète pas la direction.

### 6. Classification

Noms/paramètres/directions = dynamiques ; titres structurels = statiques.

### 7–8. Structure / éléments

CR initial → activités avant Tour → Tour → activités après Tour → Fin séance. `Dupliquer` et autres actions derrière la carte. CR/Fin : iconographie non ambiguë, aucune poignée.

### 9. Layout

Sur `2028:11808`, `Dupliquer` utilise rayon DSF/Figma et un gap laissant voir le fond du Tour entre la portion visible de carte et l’action. Aucun simple overlay sans mouvement de carte.

### 10. Responsive

Bloc Activity+Recovery reste cohérent 360/402/440 ; actions contextuelles accessibles sans sortir de l’écran.

### 11. États

normal, D→G, G→D, swipe en cours, ouvert, roue CR ouverte, roue Fin ouverte.

### 12–13. Contrôles / gestes

Activity : tap édition, long press drag. CR et Fin : tap/roulette seulement, aucun long press/drag. Swipe exactement §4.6.

### 14. Validation

Continuer suit validité Composition existante. Les actions contextuelles n’altèrent pas le draft avant action explicite.

### 15. Persistance

Réordre uniquement à la dépose valide. Duplication indépendante selon règles existantes.

### 16. Navigation

Retour de sous-parcours restaure scroll/zone. Continuer → Catégories.

### 17. Erreurs

Drop invalide = aucune mutation. Swipe interrompu sous seuil revient fermé.

### 18. Accessibilité

CR/Fin ne doivent pas exposer action “déplacer”. Directions accessibles développées même si affichage court.

### 19. Invariants

CR/Fin non déplaçables ; une seule carte swipe ouverte ; pas de direction développée en texte de carte.

### 20. Recette

Drag Activity oui ; drag CR/Fin non ; swipes ; gap Dupliquer ; direction ; roulette et CTA arrière inactif ; responsive. Négatif : poignée CR/Fin, overlay immobile, tap extérieur fermant swipe = échecs.

### 21. Traçabilité

E53 → D-154/D-182 ; E58–E63 → D-175/D-176 ; E64–E66 → D-177 ; Figma `2028:11700`, `2028:11808`.

![Composition — actions glissées](./images/composition-actions-glissees.png)

---

# 8. Bloc B5 — Exécution directe d’une Activité

## CE-T03-09 — Lancement direct et préparation fixe 5 s

### 1. Identification

Bloc B5 ; état S55 ; T03-E E32, E37–E39, E42 ; source Catalogue `3786:5093`; preuve image `CE-ACT-EXE-02-preparation-5-s.png`. Le Shell d’Exécution existant est réutilisé.

### 2. Finalité

Transformer le tap Lecture d’une ActivityDefinition valide en Exécution `origin=ACTIVITY` avec snapshot autonome et préparation système fixe 5 secondes.

### 3. Entrée

Lecture de CE-T03-02 sur définition valide.

### 4. Sortie

À 0 de la préparation → CE-T03-10/11/12 selon mode/direction.

### 5. Données

Snapshot immuable créé au lancement ; `preparationDurationSeconds=5` appartient à l’Exécution, pas à ActivityDefinition.

### 6. Classification

Nom activité = dynamique ; `5 s` est règle système, non une valeur démo ; contenu visuel exemple = démonstration.

### 7–9. Structure / éléments / layout

Réutiliser `Shell / Execution`. Aucun Tour, Cycle, Séance ou `SESSION_END` affiché/créé. Présentation de préparation conforme au Shell et à l’image de preuve.

### 10. Responsive

Shell Execution couvre 360/402/440 ; texte centré non tronqué.

### 11. États

initial 5 → décompte → 0 → transition run.

### 12–13. Contrôles / gestes

Aucune action ne doit lancer une Séance. Commandes système du Shell uniquement si spécifiées par le moteur direct.

### 14. Validation

Vérifier définition exécutable avant création d’Execution. Une source invalide ne crée aucune Execution.

### 15. Persistance

Création atomique Execution + snapshot. Pas de Session temporaire.

### 16. Navigation

L’origine Catalogue et son état courant sont mémorisés pour restauration finale.

### 17. Erreurs

Échec snapshot/Execution : rester/retourner Catalogue, aucune Exécution partielle fantôme.

### 18. Accessibilité

Décompte annoncé selon règles de guidage ; pas d’élément de Tour/Séance exposé.

### 19. Invariants

5 s fixes ; origin ACTIVITY ; aucun SessionId obligatoire/factice ; aucun SESSION_END.

### 20. Recette

Vérifier 5 s, snapshot, origine, source supprimée après lancement sans impact, absence Session/Tour/Cycle. Négatif : utiliser compte à rebours global de Séance = échec.

### 21. Traçabilité

E37–E39/E42 → D-157/D-172/D-180 ; modèle 09 bis ; API Exécution directe.

![Préparation directe](./images/CE-ACT-EXE-02-preparation-5-s.png)

---

## CE-T03-10 — Exécution directe — mode Durée unilatéral

### 1. Identification

Bloc B5 ; état S56 ; T03-E E37–E43 ; visuel réutilisé du Shell d’Exécution (`1992:8132`) adapté à la source ACTIVITY ; preuve `CE-ACT-EXE-03-execution-en-cours.png`.

### 2. Finalité

Exécuter une ActivityDefinition Durée en autonomie, y compris Séries/Pauses/Récupération, sans orchestration de Séance.

### 3. Entrée

Fin préparation CE-T03-09, `mode=DURATION`, direction effective UNILATERAL.

### 4. Sorties

Série suivante / Pause / Recovery → états moteur ; dernière phase → CE-T03-13.

### 5. Données

Exclusivement snapshot ACTIVITY. Série courante, temps, cible, progression locale de l’Activité.

### 6. Classification

Nom, temps, série, paramètres = dynamiques ; libellés commandes = statiques.

### 7–10. Structure/layout/responsive

Réutiliser Shell Execution, sans informations Tour/Cycle/`Activité X/Y` de Séance si non pertinentes. Conserver groupes visuels, commandes et safe areas existants. 360/402/440.

### 11. États

activité chronométrée, pause série, recovery, pause utilisateur si moteur commun.

### 12–13. Contrôles / gestes

Commandes directes réutilisent comportements existants : pause/reprise, réinitialisation étape, passage anticipé avec confirmation selon règles chronométrées.

### 14. Validation

Transitions moteur dérivées du snapshot, jamais de la source persistante modifiée après lancement.

### 15. Persistance

Résultats série/temps dans Execution ACTIVITY ; pas de SessionActivity persistée.

### 16. Navigation

Pas de sortie vers un écran de Séance. Fin → CE-T03-13 puis Synthèse.

### 17. Erreurs

Reprise après interruption technique selon architecture d’Execution ; source absente ne bloque pas le snapshot.

### 18. Accessibilité

Timer et actions nommés ; aucune information de côté en UNILATERAL.

### 19. Invariants

Aucun Tour, Cycle, SESSION_END ; calculs D-156 inchangés.

### 20. Recette

1/N séries, Pause R=0/R>0, Recovery, réinitialisation, passage anticipé, background/reprise selon moteur commun. Négatif : afficher Tour/Cycle/SESSION_END = échec.

### 21. Traçabilité

E40/E43 → D-139/D-140/D-156/D-172 ; modèle/API Execution ACTIVITY.

![Exécution directe](./images/CE-ACT-EXE-03-execution-en-cours.png)

---

## CE-T03-11 — Exécution directe — Répétitions et À l’échec

### 1. Identification

Bloc B5 ; états S57/S58 ; T03-E E40, E43 ; Shell Execution partagé.

### 2. Finalité

Exécuter les modes non chronométrés avec `Suivant` terminant normalement la Série, sans confirmation de passage anticipé propre aux activités chronométrées.

### 3–4. Entrée / sortie

Après préparation avec mode REPS ou FAILURE. `Suivant` → résultat Série puis Pause/Recovery/Série suivante ou fin directe.

### 5–6. Données / classification

Cible répétitions dynamique pour REPS ; aucune cible chiffrée pour FAILURE. Temps connus de Pauses/Recovery uniquement. Tous exemples Figma numériques = démonstration.

### 7–10. Structure/layout/responsive

Même Shell, variantes de contenu selon mode. Ne jamais afficher une durée cible inventée pour FAILURE ni une cible répétitions en FAILURE.

### 11. États

REPS ; FAILURE ; série N ; pause ; recovery.

### 12–13. Contrôles / gestes

`Suivant` = terminaison normale de Série. Pause/reprise/réinitialisation selon moteur commun.

### 14–15. Validation/persistance

Résultat enregistré selon mode ; aucune convention de durée ajoutée.

### 16–18. Navigation/erreurs/accessibilité

Comme CE-T03-10 ; annoncer mode/cible utile sans information fausse.

### 19. Invariants

FAILURE sans cible ; `Suivant` normal ; aucun SESSION_END.

### 20. Recette

REPS 1/N séries ; FAILURE 1/N ; Pauses/Récup ; vérifier absence confirmation normale ; vérifier aucune durée fictive. Négatif : minuterie cible en Failure = échec.

### 21. Traçabilité

D-111, D-139, D-172 ; RM mode ; API Execution.

---

## CE-T03-12 — Exécution directe — bilatéralité, Pauses et Récupération

### 1. Identification

Bloc B5 ; états S59–S62 ; T03-E E40–E41 ; réutilise Shell et sous-titre côté validé par D-149.

### 2. Finalité

Exécuter exactement `RIGHT_LEFT` ou `LEFT_RIGHT` selon les règles bilatérales existantes : toutes les Séries du premier côté, puis toutes du second, Recovery une fois après le second côté pour une Activité autonome.

### 3–4. Entrée/sorties

Après préparation d’un snapshot bilatéral ; transitions entre séries/pauses/côtés/recovery puis fin.

### 5. Données

`sideMode` snapshot ; `executionSide RIGHT|LEFT`; résultats séparés par côté.

### 6. Classification

`Côté droit` / `Côté gauche` = libellé calculé depuis side ; aucune valeur Figma n’impose le sens.

### 7–10. Structure/layout/responsive

Sous-titre côté centré sous nom ; aucun compteur `1/2`, `2/2`; rang logique Activity ne change pas entre côtés. Shell responsive.

### 11. États

premier côté, second côté, pause intr côté, recovery final, partial side.

### 12–13. Contrôles/gestes

Réinitialiser uniquement côté courant ; passage anticipé du premier côté conserve partiel puis ouvre second selon D-150.

### 14–15. Validation/persistance

Aucune Pause ajoutée spécifiquement entre côtés ; résultats côté persistés séparément ; Recovery après second côté.

### 16–18. Navigation/erreurs/accessibilité

Navigation interne moteur ; annonce vocale côté au début/passage selon règles ; labels accessibles développés.

### 19. Invariants

Ordre strict de `sideMode`; pas de nouvelle formule ; Recovery une fois après second côté autonome ; aucune Session.

### 20. Recette

D→G et G→D, C séries, R=0/R>0, passage anticipé premier côté, reset second, historique sides. Négatif : alternance série par série, Pause inter-côté ajoutée, Recovery par côté autonome = échecs.

### 21. Traçabilité

E41 → D-143–D-150, D-156, D-172 ; modèle results executionSide.

---

## CE-T03-13 — Fin / interruption / retour d’Exécution directe

### 1. Identification

Bloc B5 ; états S63–S65 ; T03-E E43, E44, E49.

### 2. Finalité

Clore une Exécution ACTIVITY immédiatement après sa dernière phase métier, émettre le signal de fin puis ouvrir la Synthèse, sans phase `SESSION_END`.

### 3–4. Entrée/sortie

Dernière Série/Recovery terminée → signal → CE-T03-14. Arrêt volontaire confirmé → statut Interrompue puis Synthèse selon règle commune. Interruption technique peut ne pas afficher Synthèse selon architecture existante.

### 5–6. Données/classification

Statut/temps/résultats dynamiques ; aucun écran de fin Séance.

### 7–10. Structure/layout/responsive

Réutiliser les modales/commandes communes d’arrêt lorsque applicables ; ne pas introduire de composant SESSION_END.

### 11. États

fin normale, arrêt volontaire, interruption technique/reprise.

### 12–13. Contrôles/gestes

Arrêt uniquement selon les règles communes d’Execution ; confirmations existantes.

### 14–15. Validation/persistance

Statut final déterminé par résultats ; finalisation sauvegarde l’Execution ACTIVITY avant Synthèse/retour approprié.

### 16. Navigation

Après Synthèse `Terminer` → Catalogue activités restauré à l’état aller-retour ; pas de persistance de cet état au relaunch.

### 17. Erreurs

Échec finalisation : ne pas perdre les résultats ; stratégie transactionnelle/reprise.

### 18. Accessibilité

Signal de fin non uniquement sonore ; actions confirmation lisibles.

### 19. Invariants

Aucun SESSION_END ; aucun compteur Session ; origin ACTIVITY conservé.

### 20. Recette

Fin avec/sans Recovery ; arrêt ; interruption ; retour Catalogue état ; relaunch. Négatif : créer phase SESSION_END = échec.

### 21. Traçabilité

E43/E44/E49 → D-158–D-163/D-172 ; RM direct execution.

---

# 9. Bloc B6 — Synthèse Activité

## CE-T03-14 — Synthèse d’Exécution directe

### 1. Identification

Bloc B6 ; états S66–S70 ; T03-E E44–E46, E49 ; frames visuelles réutilisées `1992:8718`, `1992:8780`; preuves `CE-ACT-EXE-04`, `CE-ACT-EXE-05`.

### 2. Finalité

Collecter un Ressenti obligatoire et un Commentaire facultatif avant `Terminer`, puis restaurer le Catalogue activités.

### 3. Entrée

Fin normale ou arrêt volontaire produisant une Synthèse.

### 4. Sortie

`Terminer` uniquement après Ressenti → sauvegarde + CE-T03-02 restauré.

### 5. Données

Détails de l’Execution ACTIVITY depuis snapshot/results ; Ressenti draft requis ; Commentaire max 200 caractères.

### 6. Classification

Nom/durée/résultats = dynamiques ; options Ressenti/libellés = statiques ; exemples commentaire = démonstration.

### 7–10. Structure/layout/responsive

Réutiliser Shell Summary et disposition Figma. Aucun contenu spécifique Séance non applicable (Tour/Cycle/compteur Session) ne doit être inventé. 360/402/440, clavier du commentaire ne masque pas `Terminer`.

### 11. États

Ressenti vide → Terminer disabled ; Ressenti sélectionné → actif ; commentaire vide/renseigné.

### 12–13. Contrôles/gestes

Sélection Ressenti exclusive ; texte commentaire ; Terminer.

### 14. Validation

Ressenti obligatoire ; commentaire 0..200.

### 15. Persistance

Ressenti/commentaire liés à Execution ACTIVITY ; sauvegarde atomique à Terminer selon modèle.

### 16. Navigation

Retour Catalogue état courant sauvegardé en mémoire de parcours seulement.

### 17. Erreurs

Échec sauvegarde → rester Synthèse, conserver saisie.

### 18. Accessibilité

Ressentis exposent selected ; Terminer disabled tant que vide ; commentaire annonce limite.

### 19. Invariants

Ressenti obligatoire si Synthèse affichée ; commentaire facultatif ; aucun Session count.

### 20. Recette

Terminer disabled/active, commentaire 0/200/201, erreur save, retour état. Négatif : terminer sans Ressenti = échec.

### 21. Traçabilité

E45–E46/E49 → D-160/D-163/D-172 ; modèle Execution ; Suivi.

![Synthèse — Ressenti requis](./images/CE-ACT-EXE-04-synthese-ressenti-requis.png)

![Synthèse — Ressenti sélectionné](./images/CE-ACT-EXE-05-synthese-ressenti-selectionne.png)

---

# 10. Bloc B7 — Suivi

## CE-T03-15 — Suivi général — Exécution `ACTIVITY`

### 1. Identification

Bloc B7 ; états S71–S74 ; T03-E E47–E48 ; frames de structure `1992:8843`, `1992:8996`; images `suivi-condense.png`, `suivi-deploye.png`.

### 2. Finalité

Afficher les Exécutions directes dans le même Suivi général que les Séances tout en les identifiant comme Activité et sans augmenter les compteurs/statistiques de Séances.

### 3–4. Entrée/sortie

Navigation Suivi ; cartes condensées/déployées. Aucun retour spécifique à l’ActivityDefinition nécessaire pour reconstruire l’historique.

### 5. Données

Source Execution.snapshot/results, `origin=ACTIVITY`. La source persistante peut avoir été supprimée.

### 6. Classification

Nom/date/durée/feeling/status = dynamiques ; type `Activité` = dérivé de origin.

### 7–10. Structure/layout/responsive

Réutiliser cartes Suivi et layouts existants. Les champs Session-only ne sont pas affichés avec valeurs fictives. 360/402/440.

### 11. États

condensée, déployée, mix Session+Activity, bilateral results.

### 12–13. Contrôles/gestes

Déployer/replier selon Suivi ; pas d’action modifiant l’historique snapshot.

### 14–15. Validation/persistance

Lecture seule ; statistiques compatibles incluent Activity là où sémantiquement valable, excluent nombre de Séances.

### 16. Navigation

Navigation globale standard `Catalogues/Calendrier/Suivi/Profil`.

### 17. Erreurs

Source ActivityDefinition supprimée : carte historique reste lisible depuis snapshot.

### 18. Accessibilité

Type `Activité`, statut et contenu déployé annoncés sans ambiguïté.

### 19. Invariants

Historique indépendant de la source ; origin ACTIVITY ; Session counter inchangé.

### 20. Recette

Créer direct execution, supprimer source, vérifier Suivi ; mix Session/Activity ; bilatéral ; stats. Négatif : historique disparu ou Session count +1 = échec.

### 21. Traçabilité

E47–E48 → D-161/D-162/D-169 ; modèle Execution.snapshot ; Suivi API.

![Suivi condensé](./images/suivi-condense.png)

![Suivi déployé](./images/suivi-deploye.png)

---

# 11. Bloc B8 — Catégories et navigation

## CE-T03-16 — Catégories — enregistrement et retour Catalogue des séances

### 1. Identification

Bloc B8 ; états S75–S77 ; T03-E E67–E69 ; frame `2028:11204`; image `categories-seance.png`.

### 2. Finalité

Finaliser une création/modification de Séance et retourner de manière déterministe vers `Catalogue des séances`, segment Séances, avec transition canonique.

### 3. Entrée

Composition validée → Catégories.

### 4. Sortie

`Enregistrer la séance` succès → Catalogue séances / Séances. Échec → rester Catégories.

### 5. Données

Draft complet Session + catégories sélectionnées/nouvelles temporaires selon règles existantes.

### 6. Classification

Catégories/noms = dynamiques ; action Enregistrer = statique.

### 7–10. Structure/layout/responsive

Conserver contrat existant Catégories. T03 modifie surtout la destination/transition. 360/402/440 et clavier inline catégorie selon contrats existants.

### 11. États

avant save, save en cours/double-submit bloqué, erreur, succès/navigation.

### 12–13. Contrôles/gestes

Enregistrer une seule fois ; transition ne doit pas être réimplémentée localement.

### 14–15. Validation/persistance

Transaction Session + Composition + catégories ; aucun doublon/double-save. Échec conserve draft.

### 16. Navigation

Transition forward canonique : cible entre de droite, écran courant sort gauche. Destination impose `Catalogue des séances`, `Séances`, même si le dernier segment Catalogue était Activités.

### 17. Erreurs

Erreur save → écran maintenu, message existant, action réactivée, aucune donnée partielle.

### 18. Accessibilité

État busy/disabled pendant save ; erreur annoncée.

### 19. Invariants

Destination jamais Activity Catalogue ; segment Séances ; une seule sauvegarde.

### 20. Recette

Créer/modifier, save, double tap, erreur, vérifier animation/destination. Négatif : restaurer dernier segment Activités = échec.

### 21. Traçabilité

E67–E69 → D-168/D-178 ; RM-024 ; API-SEA-03/04.

![Catégories](./images/categories-seance.png)

---

## CE-T03-17 — Navigation principale — inventaire DSF déterministe

### 1. Identification

Bloc B8/B9 ; états S78–S82 ; T03-E E05–E06 ; composant source `2537:214`.

### 2. Finalité

Garantir une navigation identique sur tous les écrans T03, avec le nouveau libellé `Catalogues` et les icônes DSF corrigées.

### 3–4. Entrée/sortie

Présente sur les Shells Bottom=Navigation ; chaque destination active ouvre son écran racine, Recherche utilise sa cible distincte.

### 5. Données

Aucune donnée métier ; état actif dérivé de route.

### 6. Classification

`Catalogues`, `Calendrier`, `Suivi`, `Profil` = libellés statiques de destination. Aucun nom de route technique affiché.

### 7–9. Structure/éléments/layout

| Destination | Variante DSF | Boîte | Dessin | Cible |
|---|---|---:|---:|---:|
| Catalogues | `2537:86 — Active=Catalogue` | 32×32 | max 24 pt centré | ≥48×48 |
| Calendrier | `2537:118 — Active=Calendar` | 32×32 | max 24 pt centré | ≥48×48 |
| Suivi | `2537:150 — Active=History` | 32×32 | max 24 pt centré | ≥48×48 |
| Profil | `2537:182 — Active=Profile` | 32×32 | max 24 pt centré | ≥48×48 |
| Recherche | `2736:2 — Active=Search` | contrôle 58×58 | vecteur DSF | 58×58 |

Aucune substitution de vecteur, aucun dessin >24 pt pour les quatre destinations.

### 10. Responsive

La barre répartit les destinations à partir de la largeur disponible ; la Recherche garde sa cible 58. Aucun chevauchement à 360/402/440 et texte agrandi.

### 11. États

Catalogue, Calendar, History, Profile, Search actifs.

### 12–13. Contrôles/gestes

Tap. Aucune action de swipe/long press sur la barre.

### 14–15. Validation/persistance

Route courante détermine active ; aucune persistance métier.

### 16. Navigation

Tap Catalogues depuis autre destination ouvre le Catalogue avec règle initiale du parcours courant ; un relaunch complet impose Séances.

### 17. Erreurs

Une route indisponible dans une livraison partielle doit être explicitement disabled, jamais visuellement active sans action.

### 18. Accessibilité

Role tab ; selected ; label exact ; cible suffisante ; ordre logique.

### 19. Invariants

Premier onglet = Catalogues ; dessins 24 pt max ; DSF exact.

### 20. Recette

Inspecter dimensions, centrage, targets ; naviguer toutes destinations ; 360/402/440 ; texte agrandi. Négatif : libellé `Séances`, emoji/glyphe, icône >24 = échecs.

### 21. Traçabilité

E05–E06 → D-167/D-179 ; Figma `2537:214`; chapitre 12 Navigation.

---

# 12. Couverture exhaustive des contenus élémentaires T03

| Plage | Contrat(s) |
|---|---|
| E01–E06 | CE-T03-01, CE-T03-17 |
| E07–E12 | CE-T03-02 |
| E13–E14 | CE-T03-04 |
| E15–E18 | CE-T03-05 |
| E19–E21 | CE-T03-03 |
| E22–E24 | CE-T03-06 |
| E25–E31 | CE-T03-07, CE-T03-08 |
| E32–E36 | CE-T03-02, CE-T03-09 |
| E37–E49 | CE-T03-09 à CE-T03-15 |
| E50–E57 | CE-T03-04 |
| E58–E63 | CE-T03-02, CE-T03-05, CE-T03-08 |
| E64–E66 | CE-T03-08 |
| E67–E69 | CE-T03-01, CE-T03-16 |
| E70 | 09 bis / migration ; vérifié par les contrats de persistance CE-T03-04/07/09, sans écran autonome |
| E71 | CE-T03-03/04 ; aucun média fonctionnel |
| E72 | CE-T03-01/03 ; Circuits disabled |
| E73 | règle commune §4.1 et tous les contrats affichant des données |

Aucun contenu élémentaire T03 n’est laissé sans propriétaire documentaire. E70 est volontairement non visuel et reste gouverné par le modèle/migration plutôt que par un écran artificiel.

# 13. Frontière T03 / T04 — invariant de tranche

T03 peut construire et exécuter le sous-ensemble autonome suivant :

`Activity snapshot → préparation 5 s → Séries → Pauses → côtés → Récupération → signal de fin → Synthèse → Suivi`.

T03 **ne doit pas** développer :

- orchestration complète d’une Séance ;
- Compte à rebours de Séance comme phase de Session ;
- Activités avant/dans/après Tour comme plan Session ;
- répétitions de Tour/Cycle dans une Execution ACTIVITY ;
- progression complète de Séance ;
- `SESSION_END` dans une Execution ACTIVITY ;
- fin minimale ou Synthèse propre à une Session au titre de T03.

Ces capacités relèvent de T04 et des contrats historiques renumérotés `CE-T04-01..13`.

# 14. Preuve de conformité T03

Pour déclarer un contrat conforme, fournir au minimum :

1. tests fonctionnels nominal + états alternatifs + tests négatifs ;
2. capture implémentation 402 et comparaison Figma ;
3. contrôle 360/402/440 ;
4. accessibilité des contrôles et états disabled ;
5. vérification de la provenance dynamique des valeurs ;
6. preuve de persistance/absence de persistance selon contrat ;
7. absence de fonctionnalité hors périmètre T03.

Les statuts utilisables sont : `CONFORME`, `PARTIELLEMENT CONFORME`, `NON CONFORME`, `NON VÉRIFIABLE`, `À CLARIFIER`.

# 15. Évidences Figma embarquées

Les preuves physiques relatives T03 sont stockées sous `./images/` et référencées par chemins relatifs afin de rester visibles après export/import. Les trois captures Catalogue corrigées et les preuves de sélection/exécution/synthèse sont notamment :

- `CE-ACT-EXE-01a-catalogue-activites-liste-t03.jpg` ;
- `CE-ACT-EXE-01b-catalogue-creer-arbre-actions-t03.jpg` ;
- `CE-ACT-EXE-01c-catalogue-action-contextuelle-t03.jpg` ;
- `CE-COMP-SEL-01-selection-activites-existantes.png` ;
- `CE-ACT-EXE-02-preparation-5-s.png` ;
- `CE-ACT-EXE-03-execution-en-cours.png` ;
- `CE-ACT-EXE-04-synthese-ressenti-requis.png` ;
- `CE-ACT-EXE-05-synthese-ressenti-selectionne.png`.

Figma demeure la source du rendu visuel courant ; ces fichiers sont des copies documentaires pérennes.