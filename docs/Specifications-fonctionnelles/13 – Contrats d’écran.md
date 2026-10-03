# 13 — Contrats d’écran

> **Règle documentaire :** le chapitre 13 ne contient aucune copie d’écran. Les captures et copies physiques d’écrans/modales sont centralisées exclusivement dans le chapitre 06. Le chapitre 13 conserve uniquement les contrats, états, règles et références de nodes Figma nécessaires à la recette.

## 1. Objet et statut normatif

Ce chapitre constitue la **spécification des familles d’écran du MVP, avec séparation des périmètres T03 et T04**. Il transforme les décisions produit, règles métier, modèle de données, API fonctionnelles, architecture, Design System Figma et frames de référence en comportements directement exploitables par le développement et la recette.

Un écran T03 n’est considéré comme spécifié que si son contrat définit explicitement : contexte d’entrée, sorties, données et leurs sources, valeurs Figma, structure, éléments obligatoires, layout, responsive, états, contrôles, gestes, validation, brouillon/persistance, navigation/conservation d’état, erreurs, accessibilité, invariants, recette et traçabilité.

Les 30 contrats actifs sont CE-T03-01 à17, CE-MEDIA-EXEC-01/02, CE-UI-01 à10 et CE-EXEC-SESSION-01. Chacun comporte les 21 rubriques canoniques. CE-T03-16 est désormais le contrat des Étiquettes de Composition ; l’ancien parcours Catégories est retiré. Les règles de clôture §6 complètent les contrats sans modifier le design. Cette correction documentaire ne modifie pas les tranches de réalisation ni leurs autorisations.

## 2. Sources et ordre d’application

Pour les contrats actifs :

1. décisions validées dans le chapitre 07, jusqu’à D-255, avec priorité aux décisions explicitement supersédantes ; D-247 à D-255 et la spécification de paramètres v12 pour l’éditeur ;
2. modèle fonctionnel / modèle de données / règles métier ;
3. API fonctionnelles ;
4. architecture technique ;
5. chapitre 06 pour navigation/interaction et corrections UX T03 ;
6. présent chapitre 13 ;
7. Figma pour le rendu visuel et les états effectivement représentés.

Figma ne transforme jamais une valeur de démonstration en règle métier. Inversement, un comportement métier ne permet pas d’inventer un composant graphique absent de Figma. Tout détail visuel non représenté et non arbitré est `NON VÉRIFIABLE` ou `À CLARIFIER`.

### Portée transverse des paramètres v12

Catalogue et exécution ACTIVITY : durée intrinsèque. Composition, détails de Séance, calendrier SESSION et exécution SESSION : durée d’occurrence avec substitution terminale, sans ajouter R deux fois. Les résumés compacts variables affichent N séries variables ; le tableau détaillé appartient seulement à CE-UI-10. Copie/duplication et instantané conservent l’état variable explicite, les cibles/Pauses ordonnées et l’Ordre des côtés. Ces règles s’appliquent aux contrats hôtes, y compris CE-UI-01/02/03/05 et CE-T03-01/06/07/08. Les règles propres aux cartes et médias sont conservées.

Réinitialiser conserve D-029/D-150 : recommencer le côté courant depuis sa première Série, préserver les résultats de l’autre côté et le temps total écoulé. Cette portée s’applique aussi à Les deux côtés à chaque série ; un passage déjà acquis de l’autre côté n’est pas rejoué. Exemple : gauche2/3 → reprise gauche1/3, résultats droits conservés. Pendant une récupération, RM-062 réinitialise seulement cette phase. Le passage anticipé conserve D-150 : côté courant partiel, poursuite des passages restant à exécuter de l’autre côté ; les résultats acquis ne sont pas effacés. Ces conséquences du périmètre existant ne constituent pas un nouvel arbitrage.

## 3. Structure canonique obligatoire

Chaque contrat comporte **exactement les 21 rubriques suivantes**, même lorsqu’une rubrique renvoie à une règle commune :

1. Identification ;
2. Finalité fonctionnelle ;
3. Contexte d’entrée ;
4. Contexte de sortie / destinations ;
5. Données affichées et source de vérité ;
6. Classification des valeurs Figma ;
7. Structure de l’écran ;
8. Éléments obligatoires ;
9. Layout déterministe ;
10. Responsive, Safe Areas, texte, scroll et clavier ;
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

## 4. Règles communes T03

### 4.1 Classification des valeurs Figma

Toute valeur visible est classée :

- `LIBELLÉ STATIQUE OBLIGATOIRE` : texte d’interface traduit via i18n ;
- `DONNÉE MÉTIER DYNAMIQUE` : valeur provenant du modèle, d’un brouillon ou d’un calcul ;
- `VALEUR DE DÉMONSTRATION FIGMA` : valeur uniquement illustrative, interdite en dur.

Les noms d’Exercices/Séances, catégories, zones corporelles, durées, nombres de Séries/répétitions, commentaires, ressentis, dates et ordre des cartes montrés dans les maquettes sont dynamiques/démonstratifs sauf mention contraire.

### 4.2 Responsive

- référence Figma standard : `402 × 874 pt` ;
- validations obligatoires : largeur `360`, `402`, `440` ;
- contenu centré au-delà selon architecture ;
- Safe Areas et Bottom Navigation selon chapitre 12 ;
- aucune coordonnée Figma n’est copiée comme position absolue React Native ;
- cibles tactiles ≥ `44 × 44 pt`, sans chevauchement ; dimensions spécifiques supérieures conservées ;
- aucun élément obligatoire sous le clavier, la navigation ou une zone système.

### 4.3 Navigation globale

Destination basse permanente : `Catalogues`, `Calendrier`, `Suivi`, `Profil`. Aucun contrôle Recherche n’est présent dans le MVP (D-221/D-225).

Composant : `Navigation / Bottom` (`6298:12462`). Les quatre dessins de destination mesurent au maximum `24 pt`, centrés dans une boîte optique `32 × 32 pt`. Aucune substitution par glyphe/emoji/système.

### 4.4 Conservation d’état Catalogue

Filtre appliqué, tri implicite et scroll sont conservés pendant la session applicative courante et les allers-retours. Au relaunch, aucun filtre n’est appliqué et le Catalogue revient au segment `Séances`.

### 4.5 Commandes Catalogue `Créer` / `Filtrer` / `Trier`

`Créer`, `Filtrer` et `Trier` forment la rangée commune de commandes. Référence du 30 septembre : cercles visibles `34 pt`, pictogrammes `20 pt`, gap visuel `12 pt`, cibles transparentes ≥ `44 × 44 pt` sans chevauchement. Les pilules étendues conservent une hauteur de `34 pt`. Le groupe est centré verticalement dans la zone de contexte existante. Les coordonnées de maquette ne deviennent pas des positions absolues React Native.

`Filtrer` et `Trier` sont communs à `Exercices / Séances / Parcours`; leur représentation d’entrée est commune, leurs options peuvent être contextuelles. Le filtre inactif est un bouton rond blanc. Un appui l’étend en `Filtres / Aucun` sans modifier la liste. Après sélection d’un critère, le contrôle actif est bleu et étendu ; le rond bleu retire le filtre, tandis que la zone texte ouvre la modale. `Réinitialiser` revient à `Aucun`. `Créer` reste actif. `Trier` reste visible mais disabled en T03.

Pour T03 / `Exercices` :

- `Filtrer` propose les critères contextuels validés : statut (`Actives` / `Archivées`), Catégories et Zones corporelles ;
- `Trier` est visible mais disabled ;
- le tri réellement appliqué reste `updatedAt DESC` ;
- aucun menu de tri n’est ouvert ;
- aucune préférence de tri n’est persistée ;
- aucun critère non arbitré n’est inventé.

`Créer` est contextuel au Catalogue affiché : un tap ouvre directement la création de l’objet correspondant, sans écran ni arbre intermédiaire.

Les **contrôles d’entrée** et les panneaux ouverts de `Filtrer` sont conçus et vérifiables dans Figma. `Trier` reste visible mais désactivé dans le périmètre T03.

### 4.6 Roulettes de durée et steppers

Toutes les roulettes de **durée** actives utilisent la famille de modales basses du DSF. Les entiers simples `Nombre de Séries`, `Nombre de répétitions` et `Nombre de Tours` utilisent un **stepper inline** et n’ouvrent aucune roulette. Les anciennes représentations contraires ne constituent plus une référence active.

Hors CE-UI-10 (roulette déployée dans la feuille), roulette ouverte : **modale basse standardisée** avec scrim bloquant arrière-plan et scroll ; CTA principal fixe reste visuellement normal mais fonctionnellement et accessibilité-inactif ; `Annuler` restaure ; `Confirmer` applique puis recalcule. Les valeurs restent brouillon jusqu’à confirmation.

### 4.7 Swipe contextuel

Swipe gauche : la carte suit le doigt et révèle progressivement les actions derrière. Une seule carte peut exposer ses actions. Les autres contrôles restent actifs, mais un autre swipe gauche n’ouvre pas un second contexte. Tap fond = aucun effet. Tap surface de carte ouverte hors actions = aucun effet. Seul un swipe droit commencé sur la carte ouverte referme.

### 4.8 Cartes structurelles Composition

`Compte à rebours initial` et `Fin de séance` : jamais déplaçables, aucun appui long, aucune poignée de drag.

### 4.9 Transition canonique

Avancement vers l’écran suivant : cible entre depuis la droite, écran courant sort vers la gauche. Ne pas recréer localement une autre animation.

### 4.10 Référentiels — appui long et suppression

Les modales `Étiquettes`, `Catégorie` et `Zones corporelles` partagent le même contrat :

- appui court : choix simple Catégorie/Étiquette validé au toucher et fermeture ; choix multiple Zones sélectionné/désélectionné puis confirmé ;
- appui long : aucun changement de sélection et ouverture d’un `Overlay / Decision Dialog` destructif à deux actions ;
- titre dynamique : `Supprimer « {nom} » ?` ;
- message dynamique : si la valeur est utilisée, préciser qu’elle disparaît des nouveaux choix mais reste attachée aux objets existants, avec son nom et sa dernière couleur ; l’historique reste inchangé ;
- actions : `Annuler` à gauche, `Supprimer` à droite ;
- toutes les valeurs sont concernées, y compris les valeurs initiales fournies par KODJO ;
- après `Supprimer`, revenir à la modale de sélection restée ouverte, avec la valeur supprimée absente ;
- une affectation existante reste sélectionnée et peut être conservée à l’enregistrement ; une nouvelle affectation à cette valeur retirée n’est plus permise ;
- aucune restauration automatique d’une valeur initiale supprimée.

La recette doit couvrir au minimum une Étiquette, une Catégorie et une Zone corporelle, chacune dans un cas utilisé et non utilisé.

Références Figma : `4861:6145` (Étiquette), `4861:6259` (Catégorie), `4861:6348` (Zone corporelle).

---


### 4.11 Cartes, médias de carte et appuis — référence courante

D-233–239 et DSF-CARTES-ICONES-APPUIS-2026-09-30 gouvernent le rendu. Carte standard 354 sur 402, rayon 8, fond#FCFCFE/bord 0,5#CCD1E0, titre 15 Semi Bold, pastilles 20 et valeurs 16 ; marges adaptatives, aucune barre verticale hors Jour. Photo d’Exercice : vignette 64 recadrée sans déformation, pas d’augmentation de hauteur, texte décalé 88, place réservée pendant chargement/erreur, texte alternatif nom ; aucun Déployer. La galerie d’Exécution conserve au contraire le média intégral sans recadrage. Séance sans photo (RG-3 reportée). Choix sans badge durée/heure ni Lecture/Déployer. Pauses/récupérations absentes des cartes Catalogue/choix/Composition ; prochaine planification absente des Catalogues ; données et calculs conservés.

Commandes contextuelles 34/dessin 20/cible 44, gaps 12 ou 10 en Composition ; dimensions spécifiques 48 conservées. Jour compact 298×46/48, barre 4, nature 26, titre 13, valeurs 11, Lecture 26 ; pas de déploiement. Aujourd’hui/Planifier 32 restent l’exception acceptée aprèsT04. Action au relâchement, sans attendre le retour animé ; sortie de cible annule ; stepper 450/150 ms ; réduction des animations par opacité sans dilatation. Les dimensions à402 ne sont pas des coordonnées absolues d’implémentation.

### 4.12 Exécution — phases, commandes et finalisation partagées

Le moteur possède la source de vérité temporelle. Le Compte à rebours propre et la Fin propre entourent l’ensemble intrinsèque d’une occurrence d’Exercice ; ils ne sont pas ajoutés entre chaque Série/côté. Dans une Séance, le réglage global D-214 les applique/ignore ensemble sans effacer leurs valeurs. Cette lecture est dérivée du porteur Exercice de D-191/D-214 ; elle ne crée aucun paramètre par occurrence.

| Origine | Séquence normale |
|---|---|
| ACTIVITY | Préparation système 5 s → compte à rebours propre applicable → toutes Séries/pauses du premier côté → transition SIDE_RECOVERY de durée q si bilatéral (§6 R-03) → toutes Séries/pauses du second côté → Fin propre applicable → signal de fin → Synthèse |
| SESSION | Compte à rebours initial → plan avant Circuit → Circuit répété par Tours → plan après Circuit → Fin de séance → Synthèse |
| Occurrence SESSION | Compte à rebours propre si activé → Exercice intrinsèque (Séries/côtés/pauses) → Fin propre si activée → POST_ACTIVITY_RECOVERY → point d’arrêt éventuel → suite |

Durée intrinsèque : unilatéral Σ(Ti+Pi) ; Un côté après l’autre 2×Σ(Ti+Pi)+PC ; Les deux côtés à chaque série (N≥2) 2×ΣTi+ΣPi+N×PC. Répétitions : Ti=2×Ri s pour l’estimation ≥ seulement ; À l’échec : aucun total d’Exercice. Occurrence : T si R=0, T−PN+R si R>0. Compte à rebours propre/Fin propre exclus de ce total. Calcul inverse réservé à Durée uniforme, suivant v12 §5 ; variable : lecture seule et — si incomplet.

| Action/phase | Effet déterminé | Conservation |
|---|---|---|
| Réinitialiser Série unilatérale | Confirmation ; durée cible initiale en Durée, chrono 00:00 en Répétitions/échec | Cible de répétitions, temps global déjà écoulé et autres résultats conservés |
| Réinitialiser Exercice bilatéral | Portée bloc du côté courant conformément D-150, pas l’autre côté | Résultat autre côté, temps global, Tour/Cycle conservés ; reprise à la première Série du côté (§6 R-03) |
| Réinitialiser récupération | Recommencer uniquement phase de récupération courante | Exercice terminé reste terminé |
| Suivant en Répétitions/échec | Terminer normalement Série courante sans confirmation de saut anticipé | Transitions prévues par le plan |
| Suivant chronométré avant terme | Confirmation ; résultat partiel si confirmé | Ne pas effacer résultats précédents ; saut du premier côté selon D-150, transition §6 R-03 |
| Suivant pendant récupération | Confirmation ; récupération partielle, Exercice terminé conservé | Pas de réexécution de l’Exercice |
| Pause / Reprendre | Suspendre / reprendre horloges actives | Position de plan et temps antérieur conservés |
| Arrêter depuis Pause | Confirmation ; clôture Interrompue et Synthèse si présentable | Instantané et résultats atteints conservés |

Instantané immuable au départ, résultats moteur clôturés une fois, puis finalisation Ressenti/Commentaire distincte et atomique. Le bouton courant de Synthèse est Enregistrer ; Terminer reste le bouton de l’éditeur Exercice. SESSION finalisé ouvre Suivi ; ACTIVITY restaure son appelant Catalogue/Calendrier. Une interruption technique sans Synthèse peut ne pas avoir de Ressenti ; une Synthèse présentée l’exige. Ni consultation média, ni paramètres de lecteur vidéo ne modifient le plan.

### 4.13 Usage des références et portée des recettes

Une frame présente peut montrer un état ancien ou incomplet. Chaque contrat distingue comportement cible, preuve graphique et limite constatée. Les recettes décrivent ce qu’il faut vérifier ; cette documentation ne constitue pas une recette réussie de l’application ni du prototype interactif. Les règles communes sont héritées par renvoi précis ; une rubrique non applicable en explique la raison. Les identifiants techniques ActivityDefinition/ACTIVITY restent inchangés et ne sont pas des libellés utilisateur.

## Inventaire des contrats actifs

| Contrat | Famille |
|---|---|
| CE-T03-01 | Catalogue des séances — état T03 |
| CE-T03-02 | Catalogue des exercices — liste, filtres et cartes |
| CE-T03-03 | Catalogue — action `Créer` contextuelle |
| CE-T03-04 | Éditeur ActivityDefinition — créer / modifier |
| CE-T03-05 | ActivityDefinition — archiver / restaurer / supprimer |
| CE-T03-06 | Composition — `Ajouter un exercice` vers le Catalogue |
| CE-T03-07 | Sélection multiple d’Exercices existants |
| CE-T03-08 | Composition d’une séance — brouillon, Circuit, points d’arrêt et validation |
| CE-T03-09 | Lancement direct et préparation fixe 5 s |
| CE-T03-10 | Exécution directe — Durée unilatérale |
| CE-T03-11 | Exécution directe — Répétitions et À l’échec |
| CE-T03-12 | Exécution directe — bilatéralité, Pauses, Récupération |
| CE-T03-13 | Fin, interruption et retour d’Exécution directe |
| CE-T03-14 | Synthèse d’Exécution directe |
| CE-T03-15 | Suivi général — Exécution ACTIVITY |
| CE-T03-16 | Étiquettes de Séance — sélectionner, créer, retirer |
| CE-T03-17 | Navigation principale — inventaire DSF |
| CE-MEDIA-EXEC-01 | Exécution — faces Information et Média |
| CE-MEDIA-EXEC-02 | Exécution — média plein écran |
| CE-UI-01 | Profil — préférence silhouette |
| CE-UI-02 | Calendrier — Jour compact |
| CE-UI-03 | Calendrier — Semaine et structure Mois |
| CE-UI-04 | Calendrier et planification — choisir une source |
| CE-UI-05 | Planification — formulaire et états de paramètres |
| CE-UI-06 | Splash KODJO |
| CE-UI-07 | Profil — préférences et défauts d’exécution |
| CE-EXEC-SESSION-01 | Exécution d’une Séance — phases, commandes et confirmations |
| CE-UI-08 | Synthèse de Séance |
| CE-UI-09 | Référentiels d’Exercice — Catégorie et Zones corporelles |
| CE-UI-10 | Paramètres d’exécution — feuille basse |

## CE-T03-01 — Catalogue des séances — état T03

### 1. Identification

| Propriété | Valeur |
|---|---|
| Bloc | B1 |
| États | S01 + état vide/liste + retour Composition |
| T03-E | E01, E02, E04, E05, E06, E19, E67, E68, E69 |
| Frames | `2117:86`, `1992:9910` |
| Shell | `Shell / Screen`, Context On, Bottom Navigation |
| Nature | Écran existant modifié |

### 2. Finalité fonctionnelle

Faire du Catalogue des séances le segment d’entrée par défaut du Catalogue multi-type, avec navigation `Catalogues`, segment Exercices désormais actif, Parcours visible disabled, rangée déterministe `Créer / Filtrer / Trier` et action `Créer` contextuelle.

### 3. Contexte d’entrée

Ouverture initiale/reprise complète : segment Séances ; retour de Composition après Continuer ; retour de planification ou d’Exécution avec contexte appelant conservé.

### 4. Contexte de sortie / destinations

Segment Exercices → CE-T03-02 ; Séances reste ; Parcours sans action ; Créer → CE-T03-08 nouveau brouillon ; surface carte → CE-T03-08 modification ; Démarrer → CE-EXEC-SESSION-01 ; Planifier → CE-UI-05 ; navigation basse → destination correspondante. Les zones surface/Déployer/Démarrer restent indépendantes.

### 5. Données affichées et source de vérité

Séances enregistrées du dépôt local, non archivées par défaut, tri updatedAt décroissant. Étiquette facultative ; en son absence, catégories issues des Exercices. Aucun champ Catégorie propre à la Séance. Les objets historiques incomplets restent consultables mais Démarrer est désactivé tant qu’ils ne sont pas exécutables.

### 6. Classification des valeurs Figma

`Catalogue des séances`, `Exercices`, `Séances`, `Parcours`, `Créer`, `Filtrer`, `Trier`, `Catalogues` = statiques. Contenus de cartes = dynamiques/démonstration.

### 7. Structure de l’écran

Header fixe → segmenté trois types → rangée commandes Catalogue (`Créer`, `Filtrer`, `Trier`) → liste/état vide → Bottom Navigation.

### 8. Éléments obligatoires

Carte : titre et badge durée, Étiquette puis catégories issues des exercices (catégories seules sans Étiquette), `N exercices` et `N tours`. Pas de prochaine planification ni pause/récupération. Séance sans vignette. Archivée : fond #F6F6F6, bord #D9D9D9, Restaurer. Catalogue : Séances sélectionné, Exercices actif, Parcours et Trier désactivés ; commandes §4.5 et navigation Catalogues.

### 9. Layout déterministe

Cartes standard : largeur 354 sur écran 402, rayon 8, fond #FCFCFE, bord intérieur 0,5 #CCD1E0, titre 15 Semi Bold ; classement pastilles 20, valeurs nues 16 ; aucune barre verticale. Références APRÈS6354:16089 / Photo 6354:16964. Les captures actualisées le 30/09 sont listées dans la matrice de couverture ; les fichiers hors remplacement restent historiques. Hauteur repliée 90, déployée 235. Commandes 34/dessins 20/gaps 12/cibles 44. Segmenté 354 : padding 4, gaps 4, options 112,67. Actions glissées de même hauteur que la carte, y compris déployée.

### 10. Responsive, Safe Areas, texte, scroll et clavier

Appliquer §4.2. Segmenté flexible ; libellés complets ; contenu liste scrollable. Aucune recherche n’est exposée (D-221).

### 11. États de l’écran

Vide réel ; liste ; retour Composition ; retour d’un sous-parcours ; relaunch sur Séances.

### 12. Contrôles et interactions

Exercices navigue ; Séances maintient ; Parcours disabled ; `Créer` initialise directement le parcours de création d’une Séance. Sur une Séance active, `Archiver` agit immédiatement lorsqu’aucune Routine n’est associée et affiche ensuite un snackbar `Séance archivée` avec `Annuler`. Si au moins une Routine est associée, une confirmation explicite précède obligatoirement l’archivage et la suppression de ces Routines ; après confirmation, aucun snackbar d’annulation n’est affiché. `Trier` reste non déclenchable en T03. T03 n’invente aucune nouvelle option Filtrer/Trier propre aux Séances.

### 13. Gestes

Cartes de Séance utilisant des actions contextuelles suivent §4.7. Aucun geste sur le segment désactivé.

### 14. Validation

Aucune validation pour changer de segment. Parcours et `Trier` ne déclenchent aucun événement métier. Créer n’écrit aucune donnée à l’ouverture. Pour `Archiver`, la confirmation est requise si et seulement si au moins une Routine est associée à la Séance. Le snackbar d’annulation est affiché si et seulement si l’archivage a été réalisé sans dialogue de confirmation.

### 15. Brouillon et persistance

Aucun état de segment persisté au relaunch. Le brouillon de création de Séance n’est initialisé qu’après tap sur `Créer`.

### 16. Navigation et conservation d’état

Continuer dans CE-T03-08 enregistre puis ouvre Catalogues / Séances. Aucun écran final Catégories. Un aller-retour restaure filtre et position ; relance complète réinitialise selon §4.4.

### 17. Erreurs et cas limites

Liste vide et archives vides : aucun contenu de démonstration. Suppression concurrente : rafraîchir sans ouvrir un objet absent. Archivage d’une Séance planifiée : confirmation avant mutation des Routines. Suppression définitive uniquement depuis les archives ; historique conservé. La capture2234:189 restaurée le01/10 montre le dialogue ; Annuler/Confirmer non câblés, preuve visuelle seulement.

### 18. Accessibilité

Parcours annonce disabled ; Séances selected ; `Catalogues` est le label accessible du premier onglet ; `Trier` annonce disabled ; focus cohérent et cibles ≥44 malgré la hauteur visuelle `34 pt` des commandes contextuelles.

### 19. Invariants

Séances = défaut/relaunch ; Exercices = actif T03 ; Parcours = disabled ; bottom label = `Catalogues`, jamais `Séances` ; rangée Catalogue = trois commandes présentes selon §4.5 ; `Trier` disabled.

### 20. Recette déterministe

Tester liste vide 2117:86, cartes repliées/déployées, filtres actifs/archives, surface Modifier distincte de Démarrer, état non exécutable, archivage planifié confirmé/annulé, restauration, suppression définitive confirmée/annulée et conservation de l’historique. Après Continuer dans Composition : Séances sélectionné, aucune étape Catégories. Vérifier Étiquette ou catégories de repli, sans prochaine planification affichée.

### 21. Traçabilité

D-187/D-188/D-196/D-206/D-209/D-211/D-238 ; CE-T03-08 et CE-UI-05. Frames 1992:9910/10014/10518/10628/10848/10937, 2117:86, 2234:88/189, 4168:11149, 4549:6382/6742, 4592:6217, 4593:6285 ; écarts de preuve §5.

---

## CE-T03-02 — Catalogue des exercices — liste, filtres et cartes

### 1. Identification

| Propriété | Valeur |
|---|---|
| Bloc | B1 |
| États | S02–S12 |
| T03-E | E03, E07–E12, E32–E36, E58–E62, E73 |
| Frames | `3786:5093` |
| Déployer | `2537:1033` |
| Navigation | `6298:12462` |
| Nature | Nouvel écran T03 |

L’ancienne référence `3787:5209` n’existe plus dans l’état Figma courant du 16 septembre 2026 et n’est plus une preuve active.

### 2. Finalité fonctionnelle

Lister les ActivityDefinition ; filtres/archives, ouverture/modification et lancement direct. Présentation avec/sans vignette selon RG-1/RG-4, sans créer un mécanisme d’import.

### 3. Contexte d’entrée

Segment Exercices depuis Catalogue ; retour éditeur ; retour Exécution directe ; retour archives. L’état du parcours courant est restitué.

### 4. Contexte de sortie / destinations

Surface carte → `CE-T03-04`; Lecture → `CE-T03-09`; `Créer` → règle contextuelle `CE-T03-03` puis création directe `CE-T03-04`; Filtrer>Archivées → `CE-T03-05`; segment Séances → `CE-T03-01`.

### 5. Données affichées et source de vérité

Source : `ActivityDefinitionRepository` / `API-CAT-01`. Défaut : non archivées, `updatedAt DESC`. Exécuter ne modifie pas `updatedAt`. Le Catalogue n’affiche aucune récupération post-exercice, car elle n’existe pas sur `ActivityDefinition`; seule la Pause entre les côtés éventuelle relève de la définition.

Exercice variable : indicateur N séries variables et total intrinsèque selon v12 ; pas de détail exhaustif des cibles sur la carte.

### 6. Classification des valeurs Figma

Noms, Catégories, Zones et paramètres sont des données métier ; les valeurs de la première carte ne sont jamais des constantes. Les pauses/récupérations et la prochaine planification ne sont pas des lignes de carte cible. Titres, segments et actions sont statiques.

### 7. Structure de l’écran

Header → segmenté → rangée commandes Catalogue (`Créer`, `Filtrer`, `Trier`) → liste scrollable → navigation. Carte : pastille de classement, titre/badge, valeurs, zones Déployer/Lecture selon contexte ; aucune barre verticale. Voir le complément Cartes du 30 septembre 2026.

### 8. Éléments obligatoires

Pastille Catégorie colorée, Zones corporelles, titre et badge durée ; synthèse `N séries de X` / `N séries de N rép.` / `N séries à l’échec`, miroir 16 si bilatéral. Aucune pause/récupération ni prochaine planification affichée. Lecture indépendante ; Déployer retiré avec vignette. Aucune poignée. Créer/Filtrer actifs, Trier désactivé.

### 9. Layout déterministe

Cartes standard : largeur 354 sur écran 402, rayon 8, fond #FCFCFE, bord intérieur 0,5 #CCD1E0, titre 15 Semi Bold ; classement pastilles 20, valeurs nues 16 ; aucune barre verticale. Références APRÈS6354:16089 / Photo 6354:16964. Les captures actualisées le 30/09 sont listées dans la matrice de couverture ; les fichiers hors remplacement restent historiques. Repliée 354 × 91. Avec média d’exercice : vignette 64 à12 du bord, centrée et recadrée sans déformation (couverture vidéo), texte x88/largeur 254 ; hauteur inchangée ; place réservée pendant chargement/erreur, texte alternatif = nom de l’exercice. Badge durée/heure conservé selon contexte, catégorie conservée, pictogramme de zone retiré ; Déployer absent. Séance sans vignette (RG-3 reportée). Commandes 34/dessins 20/gaps 12/cibles 44. La référence exercice déployé≈260 du wireframe reste distincte du composant≈236 conservé ; cet écart d’assemblage ne réintroduit pas Déployer dans Photo.

### 10. Responsive, Safe Areas, texte, scroll et clavier

§4.2. Liste et cartes prennent largeur utile. Aucune recherche active ; `1992:10129` est une archive (D-221). Cibles ≥44 pour les commandes contextuelles visuelles hautes de 34 pt ; les cibles spécifiques de 48 restent conservées. Texte long peut passer sur plusieurs lignes selon DSF.

### 11. États de l’écran

Liste active ; vide 4521:6220 ; filtre étendu Aucun ; filtre appliqué ; archives ; Trier désactivé ; carte glissée ; déploiement sans photo ; Photo sans Déployer ; chargement/erreur média ; retour restauré ; relance sans filtre. 4738:6355 illustre l’ancien assemblage média déployé, pas la cible Photo.

### 12. Contrôles et interactions

Surface carte = ouvrir/modifier ; Lecture = exécution directe. Avec vignette, aucun contrôle Déployer. Sans vignette, conserver la présentation APRÈS et son contrôle de déploiement ; l’existence de l’état déployé dans les wireframes ne contredit pas RG-4. Filtrer ouvre ses options ; Trier sans événement ; Créer ouvre directement la création persistante.

### 13. Gestes

Swipe selon §4.7 ; pas de drag/appui long de carte Catalogue. Aucune zone de tap Déployer invisible dans l’état avec photo. Les commandes d’appui suivent D-237.

### 14. Validation

Lecture seulement si définition exécutable. Filtrer>Archivées ne modifie aucune donnée. Trier reste désactivé quel que soit l’état de liste.

### 15. Brouillon et persistance

Filtre/scroll = état UI mémoire du parcours. Aucun stockage persistant après relaunch. Aucun tri utilisateur persisté.

### 16. Navigation et conservation d’état

Édition/Execution/Archives puis retour : restaurer filtre, tri implicite et scroll. Relaunch : perdre état et revenir globalement Séances.

### 17. Erreurs et cas limites

Définition supprimée entre rendu et action : rafraîchir et indiquer indisponibilité. Filtre Archives sans résultat = état vide Archives, pas retour automatique aux actives.

### 18. Accessibilité

Carte : `Ouvrir l’exercice <nom>` ; Lecture : `Exécuter l’exercice <nom>` ; vignette : nom de l’exercice. Déployer expose son état uniquement lorsqu’il est présent. Trier désactivé/non déclenchable ; commandes contextuelles cibles 44 sans chevauchement. Troncature conserve la donnée complète.

### 19. Invariants

Lecture indépendante ; aucune poignée ; carte avec photo sans Déployer et sans hausse de hauteur. Absence des pauses/récupérations/prochaine planification sur carte sans perte de données. Trier disabled, tri updatedAt DESC, règles Filtrer inchangées.

### 20. Recette déterministe

Tester zéro/N cartes, active/archivée, avec/sans photo/vidéo, chargement/erreur, texte alternatif, troncature, sélection indépendante et absence de zone Déployer dans Photo. Vérifier formats des trois modes, miroir pour bilatéral et absence des textes retirés. Puis filtres, actions glissées, retour d’état et responsive. Critères CAR/MED/ICO/CTX/ANI du complément.

Vérifier aussi les cartes variables dans les trois modes et la durée intrinsèque sans récupération contextuelle.

### 21. Traçabilité

Référence variable courante6665:24120 : indicateur N séries variables sans détail ; total intrinsèque selon mode. État ajouté au chapitre06 et à la matrice du03/10.

D-167/D-173/D-187/D-193/D-195 révisée par D-238 ; D-221/D-233–239 ; API-CAT-01 ; frames 3786:5093, 4168:11262, 4521:6220, 4544:6344/6651, 4738:6209/6355. Cible Photo : wireframe 6354:16964 ; limites §5.

---

## CE-T03-03 — Catalogue — action `Créer` contextuelle

### 1. Identification

Contrat d’action, sans écran intermédiaire. Bouton Créer dans les Catalogues 1992:9910 et 3786:5093. Les arbres historiques 3787:5148/3841:8375 ne sont pas des destinations.

### 2. Finalité fonctionnelle

Ouvrir directement la création de l’objet correspondant au Catalogue courant, sans écran ni arbre intermédiaire.

### 3. Contexte d’entrée

Tap `Créer` depuis le Catalogue courant. Le type de Catalogue affiché détermine la destination.

### 4. Contexte de sortie / destinations

Exercices → CE-T03-04 en création ; Séances → CE-T03-08 en création ; Parcours désactivé, aucune navigation. Annuler le formulaire ouvert restaure le Catalogue appelant sans créer d’objet.

### 5. Données affichées et source de vérité

Aucun écran intermédiaire et aucune donnée métier intermédiaire. La destination est dérivée du type de Catalogue courant.

### 6. Classification des valeurs Figma

`Créer` est un libellé statique obligatoire. Les anciennes valeurs de l’arbre `Un nouvel exercice / Une séance / Un parcours / Annuler` ne sont plus des contrôles de l’interface des Catalogues.

### 7. Structure de l’écran

Aucune structure d’écran supplémentaire : le tap sur `Créer` déclenche directement la navigation vers le parcours de création correspondant.

### 8. Éléments obligatoires

Le bouton `Créer` reste dans la rangée commune `Créer / Filtrer / Trier`. Aucun scrim, aucune liste d’options et aucun bouton `Annuler` intermédiaire ne sont affichés.

### 9. Layout déterministe

La géométrie de la rangée Catalogue reste celle de §4.5. La suppression de l’écran intermédiaire ne modifie pas les dimensions ni l’alignement du bouton `Créer`.

### 10. Responsive, Safe Areas, texte, scroll et clavier

Appliquer les règles du Catalogue courant. Aucun layout responsive propre à un écran intermédiaire n’existe.

### 11. États de l’écran

Action disponible depuis les Catalogues actifs. Dans T03 : `Exercices` et `Séances` ; `Parcours` reste disabled.

### 12. Contrôles et interactions

Un tap sur `Créer` produit une navigation directe. Aucun second choix utilisateur n’est demandé avant d’entrer dans le parcours de création.

### 13. Gestes

Tap simple sur `Créer`. Aucun geste ou scrim intermédiaire.

### 14. Validation

Aucune validation métier avant l’entrée dans le parcours de création. Les validations propres à l’objet créé restent dans son écran de création.

### 15. Brouillon et persistance

Le brouillon du nouvel objet peut être initialisé au déclenchement du parcours de création. Aucune donnée persistée n’est créée par le seul tap sur `Créer`.

### 16. Navigation et conservation d’état

Transmettre le segment appelant, les filtres et le scroll au formulaire. Retour avant validation : les restituer. Succès Séance : Catalogues/Séances ; succès Exercice : Catalogues/Exercices.

### 17. Erreurs et cas limites

Si le parcours cible ne peut pas être initialisé, aucune donnée partielle n’est persistée et le Catalogue d’origine reste utilisable.

### 18. Accessibilité

`Créer` expose son rôle de bouton et un libellé accessible. La navigation directe supprime tout ordre de focus propre à l’ancien arbre.

### 19. Invariants

Destination déterminée par le Catalogue courant ; aucun écran/arbre intermédiaire ; aucun choix transversal d’un autre type d’objet ; Parcours non activés par cette règle en T03.

### 20. Recette déterministe

Depuis chaque segment actif, un tap ouvre exactement le formulaire correspondant ; aucun arbre. Annuler ne crée rien ; double tap n’empile pas deux formulaires ; Parcours désactivé ne produit aucun événement.

### 21. Traçabilité

D-187/D-221 ; CE-T03-01/02/04/08 ; frames 1992:9910 et 3786:5093.

---

## CE-T03-04 — Éditeur Exercice — créer / modifier

### 1. Identification

Formulaire créer/modifier :3943:6064,4217:6980,5088:6398,3542:4656,4734:6342. Carte vide6407:9458, résumé uniforme6407:9702, variables6665:27862/28050. Abandon4714:6241. Feuille CE-UI-10 et référentiels CE-UI-09 ; inventaire courant du03/10.

### 2. Finalité fonctionnelle

Créer/modifier un Exercice avec paramètres saisis dans la feuille basse. Le résumé de la carte est dérivé et sert de raccourci ; il ne contient aucun contrôle de saisie inline. Ajout/import média toujours hors périmètre MVP.

### 3. Contexte d’entrée

Créer depuis Catalogue ou modifier une définition existante ; nouveau brouillon ou copie de travail. Le même motif s’applique à une copie de Composition lorsque son édition est exposée, sans synchronisation vers la référence.

### 4. Contexte de sortie / destinations

Terminer valide et persiste puis retourne au contexte appelant. Carte Paramètres → CE-UI-10. Retour avec modifications → confirmation d’abandon existante.

### 5. Données affichées et source de vérité

Brouillon parent : nom, référentiels, description, paramètres validés par la feuille et médias existants. Aucun texte de démonstration codé en dur.

Paramètres étendus : uniforme/variable, liste ordonnée de cibles/Pauses, Ordre des côtés ; copie complète vers CE-UI-10.

### 6. Classification des valeurs Figma

Ajouter un exercice/Modifier un exercice, Paramètres d’exécution, Description de l’exercice, Terminer : statiques. Nom et résumé : dynamiques. Mode et Compte à rebours/Fin restent séparés de la phrase intrinsèque.

### 7. Structure de l’écran

En-tête fixe → nom et accès Catégorie/Zones → carte Paramètres avec résumé/raccourcis et Compte à rebours/Fin → Description → Média → Terminer. Réutiliser le shell existant.

### 8. Éléments obligatoires

Carte vide initiale ; après ✓, résumé des valeurs appliquées. Mode cliquable ouvre sa ligne dans la feuille ; valeurs de durée/côté ouvrent la ligne dédiée ; steppers et zone vide ouvrent la feuille sans sélection. Aucun stepper, segmenté ou roulette dans le résumé.

Carte Paramètres : trois premières valeurs variables puis… ; Répétitions suffixe rép., À l’échec liste des pauses sans total ; ordre des côtés dans la phrase.

### 9. Layout déterministe

Shell conservé : en-tête fixe, bandeau nom/référentiels, carte Paramètres, Description, Média, action Terminer. Références3943:6064/4734:6342/6407:9702 et6665:27862/28050. Les deux nouveaux résumés gardent cette implantation ; le texte peut grandir, sans déplacement arbitraire des contrôles. Feuille selon DSF-SERIES-VARIABLES-2026-10-02, actualisé le03/10.

### 10. Responsive, Safe Areas, texte, scroll et clavier

360/402/440, Safe Areas, texte agrandi et clavier. Formulaire défilant ; Terminer accessible. Feuille ouverte : formulaire parent inerte et hors parcours de focus.

### 11. États de l’écran

Vide, nom seul, catégorie renseignée, nom/description/média renseignés, modification existante, résumé uniforme, résumé variable Durée/Répétitions/À l’échec, bilatéral et chacun des ordres, abandon confirmé/annulé, erreur de sauvegarde. Le résumé Répétitions est visible derrière6665:24844 ; pas de vue parent dédiée actuellement. L’absence de capture ne retire pas cet état du contrat.

### 12. Contrôles et interactions

Toucher carte/valeur ouvre CE-UI-10 selon le tableau de v12. ✓ de la feuille applique au brouillon sans écrire en base ; ✕ le conserve. Terminer sauvegarde une fois. Référentiels CE-UI-09 inchangés.

### 13. Gestes

Tap, saisie et défilement du formulaire ; pas de geste métier supplémentaire.

### 14. Validation

Nom, exactement une Catégorie et au moins une Zone pour un nouvel Exercice ; maintien des affectations retirées D-210. Paramètres exécutables issus de CE-UI-10. Terminer inactif si paramètres absents/invalides ; la couleur d’exemple de Figma ne suffit pas à valider.

Toutes les Séries actives doivent être valides ; Total variable en lecture seule, aucune cible uniforme utilisée à sa place.

### 15. Brouillon et persistance

Persistance à Terminer uniquement, atomique. Le brouillon de la feuille est distinct du brouillon parent ; annuler la feuille ne modifie aucun paramètre du parent.

### 16. Navigation et conservation d’état

Retour au Catalogue restauré en contexte définition ; au contexte Composition en contexte copie. Les Exécutions historisées ne sont jamais modifiées.

### 17. Erreurs et cas limites

Échec DB : conserver brouillon, rester éditeur et permettre nouvelle tentative. Source supprimée en parallèle : signaler erreur sans recréation implicite. Aucun contenu de démonstration en remplacement des données manquantes.

### 18. Accessibilité

Carte et raccourcis ont labels explicites ; résumé lisible sans action imposée ; ne pas exposer Total estimé comme éditable. À la fermeture de la feuille, rendre le focus au déclencheur.

### 19. Invariants

Aucune édition inline de la phrase. Mode/nom exclus de la phrase intrinsèque ; pas de total À l’échec. Calculs v12, D-248 ; D-242 supersédée ; aucun import média ajouté. Aucun enregistrement à la simple fermeture de feuille.

### 20. Recette déterministe

Tester vide→feuille→annuler sans changement ; feuille valide→résumé→Terminer ; tous raccourcis ; modification annulée ; trois modes, deux ordres bilatéraux et PC=0 sans repli ; source disparue/erreurDB ; champs/référentiels requis ; lecture seule Total Répétitions. Vérifier différences entre exemple Figma et données recalculées.

Sauvegarder/réouvrir après bascules, déplacement et N1 ; vérifier indépendance copie Catalogue/Séance et résumé v12.

### 21. Traçabilité

D-246 à D-255 ; v12 ; CE-UI-10/09 ; état des lieux du03/10 (chaque frame, capture, statut, contrat). Anciennes copies hors Prototype MVP actuel, aucune modification de règle issue de leurs chiffres.

## CE-T03-05 — ActivityDefinition — archiver / restaurer / supprimer

### 1. Identification

Cycle de vie Exercice ; carte archivée du composant 6214:7278, panneau 4168:11262. Patrons de Séance 2234:88 et 1992:10848 illustrent les actions, sans constituer une frame archive Exercice.2234:189 ne prouve pas son dialogue de suppression.

### 2. Finalité fonctionnelle

Gérer le cycle de vie d’une définition persistante : archiver depuis active, puis restaurer ou supprimer définitivement depuis Archives, sans cascade.

### 3. Contexte d’entrée

Archiver : action contextuelle sur carte active. Archives : `Filtrer > Archivées` depuis CE-T03-02. Restaurer/Supprimer : depuis carte archivée.

### 4. Contexte de sortie / destinations

Archiver → reste Catalogue actif avec carte retirée ; Restaurer → reste vue Archives, carte retirée après succès ; Supprimer confirmé → reste Archives recalculées.

### 5. Données affichées et source de vérité

ActivityDefinition + statut/archivedAt éventuel. Copies Session et historique ne pilotent pas la carte.

### 6. Classification des valeurs Figma

Nom/paramètres = dynamiques. Libellés Archiver/Restaurer/Supprimer/confirmation = statiques. Valeurs des Séances du pattern = démonstration et ne doivent pas être reprises.

### 7. Structure de l’écran

Catalogue filtré Archives, cartes archivées et actions de cycle de vie ; confirmation destructive centrée. Panneau Filtrer représenté par 4168:11262 ; variante archive du composant existante, écran complet archive non fourni.

### 8. Éléments obligatoires

Accès Archives via Filtrer ; Restaurer ; Supprimer uniquement depuis Archives ; confirmation avant suppression définitive ; feedback succès selon pattern commun.

### 9. Layout déterministe

Variante archivée : fond #F6F6F6, bord #D9D9D9 à0,5, même rayon/ombre ; Restaurer remplace Lecture. Avec média, RG-4 et RG-11 à RG-13 s’appliquent ; aucune prochaine planification. L’état existe dans le composant sans écran d’archive d’exercice dédié ; ne pas déclarer un écran Figma créé.

### 10. Responsive, Safe Areas, texte, scroll et clavier

360/402/440 ; cibles ≥44 (dimensions spécifiques 48 conservées) ; liste scrollable ; aucun clavier de recherche.

### 11. États de l’écran

Active ; swipe Archiver ; Archives avec N ; Archives vide ; Restaurer succès ; confirmation Supprimer ; suppression succès ; erreur écriture.

### 12. Contrôles et interactions

Filtrer ouvre Archives ; Archiver/Restaurer exécutent action atomique ; Supprimer demande confirmation ; Trier demeure disabled même dans Archives.

### 13. Gestes

Swipe selon §4.7. Actions accessibles par tap. Aucun drag.

### 14. Validation

Supprimer autorisé seulement si archivée. Restaurer seulement si archivée. Archiver seulement si active.

### 15. Brouillon et persistance

Actions écrivent immédiatement de façon atomique après confirmation requise. Filtre Archives n’est qu’état UI. Suppression ne cascade pas.

### 16. Navigation et conservation d’état

Filtre Archives et scroll conservés pendant la session courante. Après restaurer/supprimer, rester Archives. Au relaunch, le filtre revient à `Aucun`.

### 17. Erreurs et cas limites

Archivage avec Routines ACTIVITY : confirmation avant suppression des planifications futures ; Annuler ne modifie ni définition ni Routines. Suppression définitive depuis archives : aucune cascade vers les copies de Séance ou l’historique. Une erreur de transaction restaure la liste et l’état antérieur. La variante carte archivée existe sans écran complet dédié : limite de preuve acceptée.

### 18. Accessibilité

Actions nommées ; Supprimer annoncé destructif ; dialogue focusé ; filtre Archives annoncé actif ; équivalents aux gestes disponibles.

### 19. Invariants

Suppression seulement Archives ; aucune suppression de SessionActivity, snapshot, Result ou Execution ; accès Archives via Filtrer ; Trier disabled.

### 20. Recette déterministe

Archiver/restaurer/supprimer une définition non planifiée puis planifiée ; confirmer/annuler ; vérifier Routines futures retirées à l’archivage confirmé, copies et instantanés conservés. Restauration ne recrée pas les Routines supprimées. Vérifier double tap, échec atomique, filtre archives vide, absence Lecture dans l’état archivé.

### 21. Traçabilité

D-173/D-196/D-206/D-238 ; API-ACT-REF ; règles cycle de vie chapitre 08 §5.9 ; CE-T03-02/CE-UI-05. Variante archivée dans Carte exercice 6214:7278 ; absence d’écran complet dédiée acceptée.

---

## CE-T03-06 — Composition — `Ajouter un exercice` vers le Catalogue

### 1. Identification

Action Ajouter un exercice dans Composition ; propriétaire de l’écran CE-T03-08 et de la modale CE-T03-07. Aucun arbre intermédiaire actif.

### 2. Finalité fonctionnelle

Ouvrir directement la sélection des Exercices persistants du Catalogue depuis la Composition, sans arbre intermédiaire.

### 3. Contexte d’entrée

Tap `+ Ajouter un exercice` dans la Composition.

### 4. Contexte de sortie / destinations

Ouvre CE-T03-07 au-dessus du brouillon courant. Fermer sans Sélectionner rend le même brouillon sans insertion.

### 5. Données affichées et source de vérité

Aucune donnée métier n’est créée à l’ouverture. Le brouillon de Composition existant est conservé.

### 6. Classification des valeurs Figma

Les anciennes options `Un nouvel exercice / Un exercice existant / Annuler` appartiennent à des frames historiques et ne sont plus des contrôles du parcours courant.

### 7. Structure de l’écran

Aucun écran intermédiaire : transition directe de la Composition vers la sélection Catalogue.

### 8. Éléments obligatoires

Action `Ajouter un exercice` dans la Composition ; écran de sélection CE-T03-07.

### 9. Layout déterministe

Aucun layout d’arbre contextuel à implémenter.

### 10. Responsive, Safe Areas, texte, scroll et clavier

Conforme à la Composition puis à CE-T03-07.

### 11. États de l’écran

Composition → sélection Catalogue → retour/validation.

### 12. Contrôles et interactions

Le tap ouvre CE-T03-07. Aucun choix préalable n’est demandé.

### 13. Gestes

Tap sur `Ajouter un exercice`.

### 14. Validation

La validation métier est portée par CE-T03-07 ; aucune mutation à l’ouverture.

### 15. Brouillon et persistance

Le brouillon de Composition est conservé. La capacité existante de création directe d’une `SessionActivity` locale reste fonctionnellement et techniquement conservée mais n’est pas exposée dans cet enchaînement.

### 16. Navigation et conservation d’état

Conserver ID de brouillon, point d’insertion et position de Composition pendant la modale. Retour annulation identique ; retour validé montre les nouvelles copies au point d’insertion.

### 17. Erreurs et cas limites

Échec d’ouverture du Catalogue → Composition inchangée.

### 18. Accessibilité

`Ajouter un exercice` annonce l’ouverture de la sélection d’Exercices.

### 19. Invariants

Aucun arbre intermédiaire ; aucune suppression du mécanisme technique de `SessionActivity` locale.

### 20. Recette déterministe

Ouvrir/fermer sans sélection ; sélectionner une puis plusieurs définitions ; vérifier brouillon et ordre d’insertion ; aucune création persistante de Session avant Continuer ; aucune création locale exposée par cet enchaînement.

### 21. Traçabilité

D-194/D-222 ; CE-T03-07/08 ; frames Composition 2028:11700 et sélection 3789:5349.

---

## CE-T03-07 — Sélection multiple d’Exercices existants

### 1. Identification

Modale Sélection des exercices depuis Composition ; frame 3789:5349. Le bouton Créer une activité résiduel de la capture n’appartient pas au parcours exposé D-194.

### 2. Finalité fonctionnelle

Choisir plusieurs définitions actives puis copier dans le brouillon de Séance selon leur ordre de liste, pas l’ordre des touchers.

### 3. Contexte d’entrée

Ouverture directe depuis `Ajouter un exercice` dans CE-T03-06.

### 4. Contexte de sortie / destinations

Fermer/Annuler → Composition sans mutation ; Sélectionner avec N>0 → insertion groupée dans le brouillon puis CE-T03-08.

### 5. Données affichées et source de vérité

Définitions actives et ensemble d’IDs sélectionnés en mémoire. Ordre de la liste affichée, stable pendant la sélection. Aucun filtre/recherche supplémentaire n’est exposé par cette modale de référence ; les règles de filtres Catalogue ne créent pas ici un contrôle. Il n’existe donc pas de sélection cachée par un filtre local.

### 6. Classification des valeurs Figma

Noms/paramètres = dynamiques. Compteur = calculé. Libellés/actions = statiques. Exemples = démonstration.

### 7. Structure de l’écran

Modale avec titre, fermeture, liste défilante, cases à cocher et compteur, CTA Sélectionner fixe. Pas de création locale exposée.

### 8. Éléments obligatoires

Case 20, titre 15, pastilles 20, valeurs 16, compteur et Sélectionner désactivé à0. Aucun badge durée/heure, Lecture ou Déployer. Fermeture accessible dans l’en-tête.

### 9. Layout déterministe

Cartes standard : largeur 354 sur écran 402, rayon 8, fond #FCFCFE, bord intérieur 0,5 #CCD1E0, titre 15 Semi Bold ; classement pastilles 20, valeurs nues 16 ; aucune barre verticale. Références APRÈS6354:16089 / Photo 6354:16964. Les captures actualisées le 30/09 sont listées dans la matrice de couverture ; les fichiers hors remplacement restent historiques. Choix Composition 354 × 91 ; texte tronqué à≥20 de la case, liste seule défilante ; actions fixes. Avec média d’exercice : vignette 64 à12 du bord, centrée et recadrée sans déformation (couverture vidéo), texte x88/largeur 254 ; hauteur inchangée ; place réservée pendant chargement/erreur, texte alternatif = nom de l’exercice. Aucun badge durée/heure dans ce choix, catégorie conservée, pictogramme de zone retiré ; Déployer absent. 

### 10. Responsive, Safe Areas, texte, scroll et clavier

360/402/440 ; aucune recherche ; validation reste accessible ; lignes s’étendent pour texte ; scroll indépendant.

### 11. États de l’écran

Liste vide ; 0/1/N sélection ; Sélectionner désactivé/actif ; copie en cours ; erreur ; texte long et média chargé/indisponible.

### 12. Contrôles et interactions

Toucher ligne/case sélectionne ou désélectionne le même ID. Sélectionner produit une seule insertion groupée. Fermer annule toute sélection transitoire. Ni réordre ni filtre local ni action Créer un exercice ne sont ajoutés.

### 13. Gestes

Tap et scroll uniquement. Aucun drag/reorder.

### 14. Validation

N>0 et toutes définitions encore disponibles avant insertion. L’ordre final est l’ordre de liste des IDs sélectionnés. Une disparition invalide cette soumission, actualise sélection/compteur et demande une nouvelle validation explicite.

### 15. Brouillon et persistance

Les copies sont ajoutées atomiquement au brouillon de Composition ; aucune sauvegarde de Séance avant Continuer. Une erreur ne laisse aucune copie partielle. Les copies portent les paramètres intrinsèques ; leur récupération post-occurrence est initialisée depuis Profil.

### 16. Navigation et conservation d’état

Succès → Composition enrichie, même contexte/scroll autant que possible. Annuler → exact état antérieur.

### 17. Erreurs et cas limites

Définition supprimée entre sélection et validation : la retirer/recalculer, empêcher copie fantôme, informer. Échec d’une copie → rollback total.

### 18. Accessibilité

Chaque ligne annonce nom/type et sélection ; cible case≥44 ; compteur annoncé après modification ; Sélectionner désactivé à0 ; focus captif dans modale, restitué au déclencheur à la fermeture.

### 19. Invariants

Ordre liste et non touchers ; copies indépendantes ; zéro sélection interdit ; pas de copie fantôme ou partielle ; pas de synchronisation ultérieure à la définition source.

### 20. Recette déterministe

Liste A/B : sélectionner B puis A → insertion A/B ; désélection, 0/1/N, fermeture sans effet, double tap, suppression de source avant validation, rollback total, modification indépendante des copies. Vérifier aucun badge/lecture/déploiement/création/recherche/filtre local ; vignette, texte long, marge 20, clavier non requis.

### 21. Traçabilité

D-171/D-194/D-208/D-213/D-222/D-238 ; frame 3789:5349 ; CE-T03-08. Clarification dérivée : aucun filtre non représenté ajouté à cette modale.

---

## CE-T03-08 — Composition d’une séance — brouillon, Circuit, points d’arrêt et validation

### 1. Identification

Composition d’une séance : 2028:11137/11700/11808/12003,3518:4576,5271:5455. Points d’arrêt 3722:5061/4893:6675/5301:5443. Étiquette CE-T03-16 ; sélection CE-T03-07. Réglages 2028:11375/11457 ; limites de preuve §5.

### 2. Finalité fonctionnelle

Créer/modifier le brouillon de Séance, son nom, son Étiquette facultative, ses occurrences avant/dans/après un Circuit, ses Tours et points d’arrêt ; valider une seule fois vers le Catalogue.

### 3. Contexte d’entrée

Créer depuis Catalogues/Séances, ouvrir une Séance existante, revenir de sélection/édition d’Exercice ou d’Étiquette. La modification part d’une copie de travail de la Séance.

### 4. Contexte de sortie / destinations

Exercice → éditeur de copie locale ; Ajouter un exercice → CE-T03-07 ; Étiquette → CE-T03-16 ; Continuer valide/enregistre → CE-T03-01 segment Séances. Retour avec changements → confirmation d’abandon 2028:11298 ; abandon confirmé détruit le brouillon seul.

### 5. Données affichées et source de vérité

Brouillon Session et occurrences indépendantes. Nom ; étiquette 0..1 ; compte à rebours initial ; Fin de séance ; Circuit unique/Tours 1..99 ; phases propres activées par un booléen global true par défaut. postActivityRecoverySeconds appartient à chaque occurrence, initialisé depuis Profil et conservé au déplacement/duplication ; aucune récupération sur la définition Catalogue.

Chaque occurrence conserve les paramètres variables et son R contextuel ; durée To=T si R=0 sinon T−PN+R. Total de Composition somme ces occurrences développées selon les Tours.

### 6. Classification des valeurs Figma

Noms/paramètres = dynamiques ; titres structurels = statiques ; positions de cartes d’exemple = démonstration.

### 7. Structure de l’écran

Nom/contexte de Séance, Étiquette et actions → compte à rebours initial → occurrences/points avant Circuit → Circuit répété en Tours avec occurrences/points internes → occurrences/points après Circuit → Fin de séance → Continuer. Aucun Cycle visible ni étape finale Catégories.

### 8. Éléments obligatoires

Compte à rebours/Fin non déplaçables ; Circuit unique sans changement de côté ; Tours par stepper. Cartes sans pause/récupération affichée. Réglage global D-214 applique/ignore ensemble les deux phases propres ; son emplacement graphique n’est pas représenté dans les captures contrôlées : réserve V-04, pas de composant inventé.

Ligne variable : N séries variables uniquement, sans liste des cibles ; récupération reste visible et attachée à son occurrence.

### 9. Layout déterministe

Swipe : déplacement réel, gap et Dupliquer selon référence. Occurrence et récupération restent solidaires dans les données ; aucune ligne Récupération affichée. Commandes contextuelles 34/dessin 20/gap 10/cibles 44 dans bande 32, durée immobile et actions à droite 6 plus bas.

### 10. Responsive, Safe Areas, texte, scroll et clavier

360/402/440 ; scroll Composition ; actions contextuelles restent accessibles ; pas de clavier sauf champs de contexte déjà définis.

### 11. États de l’écran

Création vide ; nom saisi ; composition valide/invalide ; édition ; Étiquette sélectionnée/absente ; glissé ; déplacement ; réglage initial/fin ; placement point d’arrêt ; bulle Retirer ; abandon ; sauvegarde/erreur.

### 12. Contrôles et interactions

Modifier les champs dans le brouillon. Réordonner une occurrence avec sa récupération ; dupliquer copie les paramètres ; retirer supprime occurrence et récupération associée. Point d’arrêt : entrer en placement, choisir une position valide ; appui long sur point ouvre Retirer, tap hors bulle ferme sans suppression. Le booléen global D-214 ne modifie pas les valeurs propres enregistrées des Exercices.

### 13. Gestes

Swipe §4.7 sur occurrence ; appui long/déplacement des occurrences ; placement et retrait des points d’arrêt D-217. Aucun déplacement du compte à rebours initial ni de la Fin. Aucun réglage de côté du Circuit.

### 14. Validation

Continuer exige nom et au moins un Exercice valide ; Étiquette facultative. Point d’arrêt interdit juste après le compte à rebours initial et juste avant Fin de séance ; autorisé avant/après Circuit et entre ses Exercices. Drop invalide restaure la position initiale. Les affectations de référentiels retirées restent valides D-210.

### 15. Brouillon et persistance

Toutes les opérations modifient le brouillon ; Continuer seul enregistre Session+Composition atomiquement. Une dépose ou confirmation de roulette n’écrit pas le modèle enregistré. Abandon restaure la version antérieure. Des brouillons techniques ne sont pas des Séances de Catalogue.

### 16. Navigation et conservation d’état

Sous-parcours : conserver brouillon, insertion et scroll. Continuer succès → Catalogues/Séances avec transition canonique ; aucune page Catégories. Échec : rester, brouillon intact, action réactivée.

### 17. Erreurs et cas limites

Drop invalide ; liste vide ; source disparue ; doublon de soumission ; échec de transaction ; point d’arrêt à frontière interdite : aucune mutation partielle. Les anciennes Séances incomplètes peuvent être ouvertes, mais ne deviennent exécutables qu’après correction.

### 18. Accessibilité

Nom des occurrences et côté développés pour lecteur d’écran. Compte à rebours/Fin sans action Déplacer. Actions accessibles équivalentes au swipe/drag ; position de point annoncée et confirmation de retrait accessible ; état du réglage global annoncé quand son rendu est spécifié.

### 19. Invariants

Circuit=groupe, Tour=répétition, Parcours=objet autonome hors MVP. Un point interne s’exécute à chaque Tour ; ordre occurrence→récupération→point→suite ; attente exclue des durées. Pas de récupération visible sur carte, donnée conservée ; pas d’écriture avant Continuer.

### 20. Recette déterministe

Créer/éditer/abandonner après nom, insertion, réordre, duplication, Étiquette, roulette et point d’arrêt ; vérifier aucune écriture avant Continuer. Tester sauvegarde atomique/double tap/erreur ; Tours 1/99 ; points avant/après/dans Circuit et frontières interdites ; retrait/fermeture hors bulle ; récupération attachée conservée ; D-214 on/off sans modifier les paramètres propres. Vérifier cible graphique séparément pour V-04.

Scénario B=285s, R0 conserve PN ; déplacer/dupliquer conserve tableau/ordre/R et ne modifie pas la définition Catalogue.

### 21. Traçabilité

Référence variable courante6665:23973 : N séries variables. Les mots Parcours et récupération visible sont des écarts déjà tracés ; Circuit/Tour et D-238 restent normatifs.

D-188–194/D-208–214/D-217/D-222/D-238 ; CE-T03-06/07/16, CE-EXEC-SESSION-01 ; frames§1 ; prescriptions de brouillon du chapitre 06 et décisions actives priment sur l’ancienne autosauvegarde de Composition.

---

## CE-T03-09 — Lancement direct et préparation fixe 5 s

### 1. Identification

Préparation de l’Exécution ACTIVITY, état du shell partagé ; aucune ancienne page autonome « écran 16 ». Frame courante 4968:8188 pour la structure, pas une preuve de préparation 5 s.

### 2. Finalité fonctionnelle

Lancer une Exécution `ACTIVITY` autonome depuis Lecture, avec snapshot immuable et préparation système fixe 5 s.

### 3. Contexte d’entrée

Lecture d’un Exercice valide du Catalogue ou d’une occurrence Calendrier ACTIVITY. Conserver contexte appelant et identifiant d’occurrence le cas échéant.

### 4. Contexte de sortie / destinations

Après préparation fixe 5 s → compte à rebours propre applicable → première Série. Arrêt volontaire uniquement via pause/confirmation ; finalisation selon CE-T03-13/14.

### 5. Données affichées et source de vérité

Snapshot ActivityDefinition, nom, préparation 5. `preparation=5` est règle système, pas propriété de la définition.

Paramètres de la Série courante issus de l’instantané variable/uniforme ; ordres v12. En direct : total intrinsèque, Pause terminale normale, aucune récupération contextuelle.

### 6. Classification des valeurs Figma

Nom = dynamique ; 5 s = règle statique système ; autres exemples = démonstration.

### 7. Structure de l’écran

Shell Exécution, nom Exercice et Catégorie, décompte de préparation ; aucune Séance/Tour/Cycle.

### 8. Éléments obligatoires

Préparation 5 s, nom Exercice, Catégorie, état de suspension ; Pause/Reprendre et accès Arrêter depuis Pause selon§4.12. Réinitialiser/Suivant pendant cette phase système ne sautent pas la préparation.

Série n/N, côté courant distinct ; aucune barre par Série. À suivre affiche la phase réelle : Pause ou Pause entre les côtés ; aucune Récupération en direct.

### 9. Layout déterministe

Réutiliser Shell existant, ne pas créer un écran Session factice. Le compte à rebours reste dans zone centrale prévue.

### 10. Responsive, Safe Areas, texte, scroll et clavier

360/402/440 et Safe Areas ; pas de clavier ; commandes visibles à taille standard et atteignables par scroll si texte agrandi.

### 11. États de l’écran

Initial 5 ; 4..1 ; 0/transit ; erreur initialisation.

### 12. Contrôles et interactions

Pause suspend le décompte, Reprendre reprend le restant ; Arrêter depuis Pause suit confirmation. Aucun tap ne crée de Session ni une seconde Exécution. Commandes propres à une Série ne sont pas des commandes de la préparation.

### 13. Gestes

Tap sur commandes explicites seulement ; aucun swipe Catalogue pendant Execution.

### 14. Validation

Éligibilité avant création Execution. Définition invalide → aucune Execution créée.

### 15. Brouillon et persistance

Création atomique Execution + snapshot ; origin ACTIVITY ; état Catalogue de retour mémorisé en mémoire de parcours.

### 16. Navigation et conservation d’état

Conserver le contexte d’entrée jusqu’à la Synthèse ; démarrage crée un instantané autonome, aucune Séance artificielle. Retour après finalisation selon §4.12.

### 17. Erreurs et cas limites

Échec snapshot/persistance = pas d’Execution fantôme. Source supprimée après snapshot n’empêche pas la suite.

### 18. Accessibilité

Décompte annoncé selon guidage ; aucun label Tour/Séance ; nom accessible.

### 19. Invariants

5 s fixes ; origin ACTIVITY ; pas de Session artificielle ; pas SESSION_END.

### 20. Recette déterministe

Tester Catalogue et Calendrier, source invalide/disparue, préparation exactement 5 s, compte à rebours propre 0/>0, absence de Tour/Cycle/SESSION_END, interruption et double démarrage ; vérifier instantané immuable et rattachement d’occurrence.

Vérifier les deux ordres et directions, valeurs variables, PC0 sans repli, Pause terminale et N1 normalisé. Ne pas déduire les transitions du câblage Figma.

### 21. Traçabilité

D-172/D-191/D-208/D-209/D-214/D-220 ; règles communes §4.12 ; médias CE-MEDIA-EXEC-01/02 ; Synthèse CE-T03-14 ; frame directe 4968:8188 et variantes média 4997:6113/5588:4363/5009:6069/5021:5994/5581:4257. Leur Tour résiduel ne valide aucun Circuit en ACTIVITY. Préparation et variantes sans frame propre : preuve partagée, pas ancien écran numéroté.

---

## CE-T03-10 — Exécution directe — Durée unilatérale

### 1. Identification

Exécution ACTIVITY en Durée unilatérale ; frame 4968:8188, contexte de données unilatéral ; pas d’ancien écran 17 autonome.

### 2. Finalité fonctionnelle

Exécuter une ActivityDefinition DURATION en autonomie avec Séries et Pauses, sans orchestration Session. En unilatéral, aucune phase de récupération n’est ajoutée.

### 3. Contexte d’entrée

Fin CE-T03-09 ; mode DURATION ; sideMode UNILATERAL.

### 4. Contexte de sortie / destinations

Fin Série → pause inter-Séries seulement s’il reste une Série, sinon Fin d’exercice propre applicable → CE-T03-13. Aucune récupération de côté en unilatéral, aucune récupération post-occurrence en direct.

### 5. Données affichées et source de vérité

Snapshot uniquement ; série courante, cible temps, temps restant, progression locale.

Paramètres de la Série courante issus de l’instantané variable/uniforme ; ordres v12. En direct : total intrinsèque, Pause terminale normale, aucune récupération contextuelle.

### 6. Classification des valeurs Figma

Nom/temps/série = dynamiques ; commandes = statiques ; exemples = démonstration.

### 7. Structure de l’écran

Nom Exercice → Catégorie → chrono courant et Série → commandes du shell ; côté absent ; Tour/Cycle absents ; média conditionnel.

### 8. Éléments obligatoires

Compte à rebours de Série ; numéro/total de Séries ; temps total actif ; Catégorie sous le nom ; commandes Réinitialiser, Pause, Suivant et son/vocal ; mode et unité non ambigus.

Série n/N, côté courant distinct ; aucune barre par Série. À suivre affiche la phase réelle : Pause ou Pause entre les côtés ; aucune Récupération en direct.

### 9. Layout déterministe

Réutiliser groupes visuels du Shell ; supprimer plutôt que remplacer par valeurs fictives les blocs Session-only.

### 10. Responsive, Safe Areas, texte, scroll et clavier

360/402/440 ; pas clavier ; commandes restent dans Safe Area ; pas scroll principal si Shell n’en prévoit pas.

### 11. États de l’écran

Préparation/compte à rebours propre ; Série active ; pause inter-Séries ; pause utilisateur ; confirmation saut/reset ; Fin propre ; fin/interruption ; média éventuel. Pas de phase récupération unilatérale.

### 12. Contrôles et interactions

Réinitialiser et Suivant selon table§4.12 ; Pause suspend les horloges actives ; terminer volontairement depuis Pause. Confirmation saut avant zéro produit le résultat partiel correspondant.

### 13. Gestes

Tap commandes ; aucun geste structurel de Session.

### 14. Validation

Transitions dérivées du snapshot et plan ; source persistante n’est jamais relue pour modifier le run.

### 15. Brouillon et persistance

Résultats dans Execution ACTIVITY. Aucun SessionActivity créé/persisté par l’exécution.

### 16. Navigation et conservation d’état

Aucune sortie Session ; fin vers CE-T03-13 puis Synthèse.

### 17. Erreurs et cas limites

Background/reprise selon moteur commun ; interruption technique conserve snapshot/résultats ; source absente tolérée.

### 18. Accessibilité

Timer/commandes nommés ; aucun côté annoncé en UNILATERAL ; état pause annoncé.

### 19. Invariants

Aucun Tour/Cycle/SESSION_END ; calculs existants inchangés.

### 20. Recette déterministe

Durée 1 s et plusieurs Séries avec pause 0/>0 ; fin naturelle, saut anticipé confirmé/annulé, reset, pause/reprise/arrêt, Fin propre 0/>0 ; aucun Tour/Cycle/récupération post-occurrence. Vérifier Catégorie, chrono et conservation du temps global après reset.

Vérifier les deux ordres et directions, valeurs variables, PC0 sans repli, Pause terminale et N1 normalisé. Ne pas déduire les transitions du câblage Figma.

### 21. Traçabilité

D-172/D-191/D-208/D-209/D-214/D-220 ; règles communes §4.12 ; médias CE-MEDIA-EXEC-01/02 ; Synthèse CE-T03-14 ; frame directe 4968:8188 et variantes média 4997:6113/5588:4363/5009:6069/5021:5994/5581:4257. Leur Tour résiduel ne valide aucun Circuit en ACTIVITY. Préparation et variantes sans frame propre : preuve partagée, pas ancien écran numéroté.

---

## CE-T03-11 — Exécution directe — Répétitions et À l’échec

### 1. Identification

Bloc B5 ; états S57/S58 ; T03-E E40/E43 ; Shell Execution partagé.

### 2. Finalité fonctionnelle

Exécuter REPS ou TO_FAILURE sans minuterie cible fictive, avec Suivant comme fin normale de Série.

### 3. Contexte d’entrée

Fin préparation CE-T03-09 avec mode REPS ou TO_FAILURE.

### 4. Contexte de sortie / destinations

Suivant → fin Série → Pause / Série suivante / `SIDE_RECOVERY` éventuelle selon le côté et le plan, puis CE-T03-13 ; jamais `POST_ACTIVITY_RECOVERY`.

### 5. Données affichées et source de vérité

REPS : cible répétitions du snapshot. TO_FAILURE : aucune cible chiffrée. Pauses/Récupérations : durées connues snapshot.

Paramètres de la Série courante issus de l’instantané variable/uniforme ; ordres v12. En direct : total intrinsèque, Pause terminale normale, aucune récupération contextuelle.

### 6. Classification des valeurs Figma

Cibles REPS = dynamiques ; absence de cible Failure = règle métier ; exemples = démonstration.

### 7. Structure de l’écran

Shell Exécution : nom, Catégorie, côté si applicable, numéro de Série, cible de répétitions ou À l’échec, chronomètre croissant et commandes ; Tour/Cycle absents.

### 8. Éléments obligatoires

Chronomètre courant initial 00:00, cible Répétitions inchangée par reset, aucune cible chiffrée en À l’échec. Suivant termine normalement la Série ; Catégorie toujours sous le nom.

Série n/N, côté courant distinct ; aucune barre par Série. À suivre affiche la phase réelle : Pause ou Pause entre les côtés ; aucune Récupération en direct.

### 9. Layout déterministe

Même architecture visuelle que CE-T03-10 ; ne jamais combler un espace Failure par une durée ou répétition fictive.

### 10. Responsive, Safe Areas, texte, scroll et clavier

360/402/440 ; pas clavier ; labels modes non tronqués.

### 11. États de l’écran

Série Répétitions/À l’échec ; pause inter-Séries ; côté suivant via CE-T03-12 ; pause utilisateur ; fin propre ; résultat terminé/interrompu.

### 12. Contrôles et interactions

Suivant valide normalement la Série sans confirmation de saut chronométré, puis applique pause/Série/côté/Fin propre selon plan. Réinitialiser remet le chronomètre courant 00:00 sans changer cible ni temps total déjà écoulé ; portée bilatérale spécifique §4.12.

### 13. Gestes

Tap commandes uniquement.

### 14. Validation

REPS exige cible valide snapshot ; Failure interdit cible ; aucune durée conventionnelle ajoutée.

### 15. Brouillon et persistance

Résultat Série persisté selon mode ; temps éventuellement mesuré sans devenir cible.

### 16. Navigation et conservation d’état

Enchaînement interne du plan ; fin CE-T03-13.

### 17. Erreurs et cas limites

Double tap Suivant idempotent/protégé ; reprise après interruption ne crée pas une Série supplémentaire.

### 18. Accessibilité

Mode et cible utile annoncés ; Failure n’annonce aucune cible fausse ; Suivant clairement nommé.

### 19. Invariants

Failure sans cible ; Suivant normal ; aucune confirmation chronométrée ; pas SESSION_END.

### 20. Recette déterministe

Deux modes, N=1/N>1, cible 1/100, reset après temps écoulé, Suivant sans dialogue, pauses 0/>0, changement de côté et Fin propre. Aucun total cible inventé pour À l’échec ; aucun Tour/Cycle ni récupération post-occurrence.

Vérifier les deux ordres et directions, valeurs variables, PC0 sans repli, Pause terminale et N1 normalisé. Ne pas déduire les transitions du câblage Figma.

### 21. Traçabilité

D-172/D-191/D-208/D-209/D-214/D-220 ; règles communes §4.12 ; médias CE-MEDIA-EXEC-01/02 ; Synthèse CE-T03-14 ; frame directe 4968:8188 et variantes média 4997:6113/5588:4363/5009:6069/5021:5994/5581:4257. Leur Tour résiduel ne valide aucun Circuit en ACTIVITY. Préparation et variantes sans frame propre : preuve partagée, pas ancien écran numéroté.

---

## CE-T03-12 — Exécution directe — bilatéralité, Pauses, Récupération

### 1. Identification

Bloc B5 ; états S59–S62 ; T03-E E40–E41 ; Shell Execution ; sous-titre côté validé D-149.

### 2. Finalité fonctionnelle

L’ordre d’exécution vient du paramètre Ordre des côtés : Un côté après l’autre (défaut) ou Les deux côtés à chaque série. En bilatéral N est toujours par côté, paramètres communs aux deux côtés. Les successions et pauses sont celles de v12 §4 ; aucun repli de PC vers la Pause. Les cibles et Pauses variables proviennent de la ligne courante. Aucune récupération post-exercice en ACTIVITY.

### 3. Contexte d’entrée

Après préparation d’un snapshot bilatéral.

### 4. Contexte de sortie / destinations

Séries/pauses premier côté → SIDE_RECOVERY si positive → Séries/pauses second → Fin propre applicable → CE-T03-13.

### 5. Données affichées et source de vérité

sideMode snapshot ; executionSide RIGHT/LEFT ; résultats séparés par côté.

Paramètres de la Série courante issus de l’instantané variable/uniforme ; ordres v12. En direct : total intrinsèque, Pause terminale normale, aucune récupération contextuelle.

### 6. Classification des valeurs Figma

`Côté droit/gauche` = libellés calculés ; ordre vient sideMode, jamais de la frame d’exemple.

### 7. Structure de l’écran

Shell Execution + nom + sous-titre côté + information Série/mode + commandes.

### 8. Éléments obligatoires

Sous-titre côté ; aucun `1/2`/`2/2`; même rang logique Activity entre côtés ; Pauses suivant v12, Pause terminale comprise ; Pause entre les côtés éventuelle avant le second passage.

Série n/N, côté courant distinct ; aucune barre par Série. À suivre affiche la phase réelle : Pause ou Pause entre les côtés ; aucune Récupération en direct.

### 9. Layout déterministe

Nom puis Catégorie, et ligne Côté droit/gauche distincte du contexte ; aucun compteur 1/2 ou 2/2. Pas de Tour en direct ; dimensions du shell courant.

### 10. Responsive, Safe Areas, texte, scroll et clavier

360/402/440 ; sous-titre reste lisible ; aucune collision avec titre ou timer.

### 11. États de l’écran

Premier côté ; Pause intra-côté ; Pause entre les côtés éventuelle ; second côté ; Partial side ; fin intrinsèque.

### 12. Contrôles et interactions

Ordre D→G/G→D strict. Réinitialiser ne touche que le côté courant et conserve l’autre résultat. Passage anticipé du premier côté : résultat partiel conservé, second côté selon D-150 ; transition selon la succession du plan v12 (§6 R-03).

### 13. Gestes

Tap commandes uniquement.

### 14. Validation

Chaque Série possède une Pause, y compris la dernière. En unilatéral, chaque Pi est exécutée une fois ; en bilatéral Un côté après l’autre, chaque Pi deux fois et PC une fois ; en Les deux côtés à chaque série, chaque Pi une fois et PC une fois par paire. Seule PN terminale est remplacée par R si R>0 dans une occurrence de Séance ; aucune Récupération en direct. N=1 est normalisé en uniforme/Un côté après l’autre dès le brouillon. Référence normative : v12 §§3–5, D-247 à D-250.

### 15. Brouillon et persistance

Résultats séparés par executionSide ; réinitialisation ne détruit pas résultat autre côté.

### 16. Navigation et conservation d’état

Transitions internes au plan ; aucun écran intermédiaire Session.

### 17. Erreurs et cas limites

Interruption entre côtés ; reprise sur bon side ; side result déjà finalisé ne doit pas être dupliqué.

### 18. Accessibilité

Annonce vocale côté au début et au changement selon règles ; label accessible développé même si UI courte ailleurs.

### 19. Invariants

Toutes Séries d’un côté avant l’autre ; une seule pause entre côtés ; aucune récupération post-occurrence ACTIVITY ; résultats séparés par côté ; rang logique Exercice inchangé.

### 20. Recette déterministe

D→G/G→D, C=1/2/99, pause inter-Séries 0/>0, SIDE_RECOVERY0/>0, reset second préservant premier, interruption pendant SIDE_RECOVERY, absence de récupération après second. Tester saut anticipé avec pC>0 puis pC=0/pS>0 puis les deux à zéro ; ne jamais cumuler les pauses.

Vérifier les deux ordres et directions, valeurs variables, PC0 sans repli, Pause terminale et N1 normalisé. Ne pas déduire les transitions du câblage Figma.

### 21. Traçabilité

D-172/D-191/D-208/D-209/D-214/D-220 ; règles communes §4.12 ; médias CE-MEDIA-EXEC-01/02 ; Synthèse CE-T03-14 ; frame directe 4968:8188 et variantes média 4997:6113/5588:4363/5009:6069/5021:5994/5581:4257. Leur Tour résiduel ne valide aucun Circuit en ACTIVITY. Préparation et variantes sans frame propre : preuve partagée, pas ancien écran numéroté.

---

## CE-T03-13 — Fin, interruption et retour d’Exécution directe

### 1. Identification

Bloc B5 ; états S63–S65 ; T03-E E43, E44, E49.

### 2. Finalité fonctionnelle

Clore l’Execution ACTIVITY immédiatement après sa dernière phase métier et ouvrir la Synthèse, sans SESSION_END.

### 3. Contexte d’entrée

Dernière Série/côté puis Fin propre achevée, ou arrêt volontaire/interruption technique depuis une phase en cours.

### 4. Contexte de sortie / destinations

Fin de la dernière Série/côté puis Fin propre applicable → signal de fin → CE-T03-14. Arrêt volontaire confirmé → Synthèse Interrompue ; interruption technique sans présentation possible → historique Interrompue sans Ressenti autorisé.

### 5. Données affichées et source de vérité

État moteur, résultats par Série/côté/phase et instantané ACTIVITY ; total actif exclut pauses utilisateur et attente de point d’arrêt le cas échéant. Instantané figé au départ ; Ressenti/Commentaire finalisés séparément.

Paramètres de la Série courante issus de l’instantané variable/uniforme ; ordres v12. En direct : total intrinsèque, Pause terminale normale, aucune récupération contextuelle.

### 6. Classification des valeurs Figma

Statut/temps = dynamiques ; libellés confirmation = statiques ; aucune valeur de fin de Séance applicable.

### 7. Structure de l’écran

Commandes et dialogue d’arrêt selon§4.12 ; transition de fin vers Synthèse ; aucun composant SESSION_END.

### 8. Éléments obligatoires

Signal de fin, statut persisté, Synthèse sur fin normale/arrêt volontaire ; interruption technique sans Synthèse seulement si présentation impossible.

Série n/N, côté courant distinct ; aucune barre par Série. À suivre affiche la phase réelle : Pause ou Pause entre les côtés ; aucune Récupération en direct.

### 9. Layout déterministe

Réutiliser composants communs. Ne pas ajouter carte/phase Fin de séance.

### 10. Responsive, Safe Areas, texte, scroll et clavier

Selon Shell Execution et dialogue commun ; 360/402/440.

### 11. États de l’écran

Fin naturelle, fin partielle, arrêt confirmé/annulé, interruption technique, fin propre, Synthèse en attente de finalisation.

### 12. Contrôles et interactions

Pause puis Arrêter ouvre confirmation ; Annuler reprend l’état suspendu ; confirmer clôt une seule Exécution et présente Synthèse si possible. Aucun bouton Retour ne remplace l’arrêt confirmé.

### 13. Gestes

Tap commandes/dialogue ; aucun swipe métier.

### 14. Validation

Finalisation seulement après état cohérent des résultats ; double finalisation interdite/idempotente.

### 15. Brouillon et persistance

Sauvegarder Execution/results avant navigation ; ne pas perdre résultats en cas d’erreur transition.

### 16. Navigation et conservation d’état

Conserver contexte Catalogue/Calendrier jusqu’à CE-T03-14. Aucun retour automatique qui contourne Ressenti lorsque la Synthèse est présentée.

### 17. Erreurs et cas limites

Échec finalisation → rester état récupérable ; crash après persistance avant navigation → reprise sans nouvelle Execution.

### 18. Accessibilité

Signal de fin non uniquement sonore ; dialogues lisibles ; focus sur décision.

### 19. Invariants

Aucun SESSION_END ; aucun Session count ; origin ACTIVITY intact.

### 20. Recette déterministe

Fin 0/>0 ; plan terminé/partiel ; arrêt depuis Pause confirmé/annulé ; interruption technique sans Synthèse ; clôture idempotente et aucune duplication historique ; retour par contexte après Enregistrer.

Vérifier les deux ordres et directions, valeurs variables, PC0 sans repli, Pause terminale et N1 normalisé. Ne pas déduire les transitions du câblage Figma.

### 21. Traçabilité

D-172/D-191/D-208/D-209/D-214/D-220 ; règles communes §4.12 ; médias CE-MEDIA-EXEC-01/02 ; Synthèse CE-T03-14 ; frame directe 4968:8188 et variantes média 4997:6113/5588:4363/5009:6069/5021:5994/5581:4257. Leur Tour résiduel ne valide aucun Circuit en ACTIVITY. Préparation et variantes sans frame propre : preuve partagée, pas ancien écran numéroté.

---

## CE-T03-14 — Synthèse d’Exécution directe

### 1. Identification

Synthèse ACTIVITY : 4968:8055 (initial),4968:8105 (Ressenti sélectionné). Pour SESSION voir CE-UI-08 ; ne pas utiliser les frames Séance comme seule preuve directe.

### 2. Finalité fonctionnelle

Collecter Ressenti obligatoire et Commentaire facultatif avant finalisation UI et retour au contexte appelant.

### 3. Contexte d’entrée

Fin normale ou arrêt volontaire donnant lieu à Synthèse.

### 4. Contexte de sortie / destinations

Enregistrer avec Ressenti valide sauvegarde puis restaure le Catalogue ou le Calendrier appelant selon§16.

### 5. Données affichées et source de vérité

Instantané Exercice, statut et durée réelle issus de l’Exécution ACTIVITY ; Ressenti et Commentaire issus du brouillon de finalisation. Les statistiques ne comptent pas de Séance. Les résultats partiels sont conservés sans inventer un compteur de Tours.

### 6. Classification des valeurs Figma

Nom/durée/résultats = dynamiques ; options Ressenti = statiques ; commentaire exemple = démonstration.

### 7. Structure de l’écran

Shell Summary ; résumé Execution ; choix Ressenti ; Commentaire ; CTA Enregistrer.

### 8. Éléments obligatoires

Nom Exercice, statut, durée réalisée, trois options de Ressenti, indication obligatoire, Commentaire facultatif limité 200 caractères, Enregistrer. Pas de Tours/Cycles ni de Relancer.

### 9. Layout déterministe

Réutiliser disposition Summary ; supprimer blocs Session-only plutôt que valeurs fictives ; pas Tour/Cycle/compteur Session.

### 10. Responsive, Safe Areas, texte, scroll et clavier

360/402/440 ; clavier commentaire ne masque pas saisie/CTA ; scroll si nécessaire avec texte agrandi.

### 11. États de l’écran

Ressenti vide ; Ressenti sélectionné ; commentaire vide ; commentaire renseigné ; save en cours ; erreur save.

### 12. Contrôles et interactions

Sélectionner un Ressenti active Enregistrer ; modifier le Commentaire ne change aucun résultat moteur. Enregistrer finalise une fois. Aucune sortie normale ne contourne Ressenti.

### 13. Gestes

Tap et saisie/scroll. Aucun swipe métier.

### 14. Validation

Ressenti obligatoire dès présentation de Synthèse, même Interrompue ; Commentaire≤200 caractères. Au-delà, ne pas enregistrer : conserver la saisie et signaler la limite ; validation serveur/service identique. Pas de suppression silencieuse du commentaire.

### 15. Brouillon et persistance

Résultats et instantané moteur conservés ; seule la finalisation Ressenti/Commentaire est modifiable avant Enregistrer. Écriture atomique et idempotente ; erreur conserve brouillon et écran.

### 16. Navigation et conservation d’état

Enregistrer → contexte appelant : Catalogue Exercices avec filtre/scroll restaurés ; lancement depuis Calendrier → date/vue appelantes avec occurrence actualisée. Ce retour contextualisé est dérivé de la conservation d’état, sans création de Séance.

### 17. Erreurs et cas limites

Commentaire>200 : indiquer la limite et empêcher Enregistrer, conserver saisie. Erreur DB : rester Synthèse avec brouillon ; Exécution déjà finalisée : aucun doublon.

### 18. Accessibilité

Options selected ; CTA disabled annoncé ; commentaire avec limite ; erreurs annoncées.

### 19. Invariants

Ressenti obligatoire si Synthèse affichée ; commentaire facultatif ; aucun Session count.

### 20. Recette déterministe

Statuts Terminée/Partielle/Interrompue ; sans Ressenti bouton désactivé ; chaque Ressenti ; Commentaire 0/200/201 ; double tap, erreur de sauvegarde puis reprise ; historique ACTIVITY et absence de comptage Séance ; retour Catalogue/Calendrier ; accessibilité/clavier.

### 21. Traçabilité

D-172/D-206 et Synthèse chapitre 06 ; frames 4968:8055/8105. Enregistrer est le libellé visuel courant de la finalisation anciennement nommée Terminer. CE-UI-08 distingue la Synthèse SESSION.

---

## CE-T03-15 — Suivi général — Exécution ACTIVITY

### 1. Identification

Suivi général ; frames 1992:8843/8996 et état vide 2117:190. Carte ACTIVITY présente dans la liste condensée ; variante déployée ACTIVITY sans frame dédiée. Copies exclusivement au chapitre 06.

### 2. Finalité fonctionnelle

Afficher les Exécutions directes dans le Suivi général comme type Exercice sans compter une Séance.

### 3. Contexte d’entrée

Navigation Suivi ; retour d’autres écrans Suivi.

### 4. Contexte de sortie / destinations

Déployer/replier carte ; navigation globale. Pas de dépendance à l’ActivityDefinition source pour lire l’historique.

### 5. Données affichées et source de vérité

Exécutions SESSION et ACTIVITY clôturées, ordre chronologique décroissant ; type depuis origine, titre/paramètres depuis instantané et résultats, pas source courante. Durée réelle, date/heure, statut et Ressenti lorsqu’il existe. ACTIVITY ne compte pas comme Séance.

### 6. Classification des valeurs Figma

Nom/date/durée/statut = dynamiques ; `Exercice` = dérivé origin ; exemples de cartes = démonstration.

### 7. Structure de l’écran

Liste Suivi mixte ; cartes condensées/déployées ; contenu historique issu du snapshot.

### 8. Éléments obligatoires

Nature 26 liste ou tai-chi, classement gris en pastilles 20, valeurs 16, titre 15. Badge statut 76 en haut à droite ; heure `18 h 42`, durée réelle ; Déployer 28 et Ressenti visible 28 en bas à droite. Aucune Vue d’ensemble requise au MVP. Aucun miroir des cartes Catalogue ajouté au Suivi.

### 9. Layout déterministe

Carte 354 × 95,5 repliée ; séance déployée 310,5 à texte standard. Bord gauche Déployer 262 ; Ressenti à16 du bord droit, boîte du composant 48. Pas de champs Session-only fictifs sur activité. Filtrer/Trier 34, dessins 20, gap 12, cibles 44 ; liste scrollable, navigation fixe.

### 10. Responsive, Safe Areas, texte, scroll et clavier

360/402/440 ; liste scrollable ; contenu déployé s’allonge ; aucun clavier hors fonctions existantes.

### 11. États de l’écran

Liste vide ; cartes condensées/déployées ; ACTIVITY/SESSION ; trois statuts ; Ressenti présent/absent après interruption technique. Vue d’ensemble/Filtrer/Trier visibles désactivés, aucune recherche.

### 12. Contrôles et interactions

Déployer/replier ; navigation globale ; commandes Suivi existantes selon statut de disponibilité.

### 13. Gestes

Tap déployer ; scroll. Aucun geste modifiant historique.

### 14. Validation

Lecture historique depuis snapshot même si source n’existe plus. Calculs stats doivent respecter sémantique origin.

### 15. Brouillon et persistance

Lecture seule. Aucun changement snapshot/results depuis Suivi.

### 16. Navigation et conservation d’état

Conserver déploiement et scroll pendant l’aller-retour du parcours courant. Après nouvelle Synthèse de Séance, afficher l’Exécution créée. Une source supprimée ne supprime pas sa carte historique.

### 17. Erreurs et cas limites

Source supprimée : carte reste lisible. Snapshot ancien : appliquer compatibilité migration/lecture existante.

### 18. Accessibilité

Type Exercice, statut, date et détails annoncés ; déployer/replier accessible.

### 19. Invariants

Historique indépendant source ; origin ACTIVITY ; compteur Séances inchangé.

### 20. Recette déterministe

SESSION/ACTIVITY, statuts, source modifiée/supprimée, instantané conservé, absence Ressenti technique, déploiement/repli, liste vide. Filtrer/Trier/Vue d’ensemble sans action ; aucune Recherche. Carte ACTIVITY condensée présente dans 1992:8843 ; variante déployée à tester fonctionnellement sans prétendre disposer d’une frame dédiée.

### 21. Traçabilité

D-172 et Suivi chapitre 06 ; 1992:8843/8996,2117:190 ; D-233–239. CE-T03-14 et CE-UI-08 ; archives 1842:2/3401:86 hors cible MVP.

---

## CE-T03-16 — Étiquettes de Séance — sélectionner, créer, retirer

### 1. Identification

Modale de Composition 2028:11204, sélection 4581:6404, création 4640:6308, suppression 4861:6145. Remplace le contrat obsolète de page finale Catégories ; ID conservé pour traçabilité.

### 2. Finalité fonctionnelle

Associer zéro ou une Étiquette au brouillon de Séance et administrer le référentiel sans étape supplémentaire de sauvegarde de Séance.

### 3. Contexte d’entrée

Action Étiquette dans CE-T03-08, avec sélection courante et brouillon conservés.

### 4. Contexte de sortie / destinations

Choix simple valide au toucher puis ferme vers Composition ; fermer sans choix laisse la sélection antérieure. Retirer l’affectation revient à zéro Étiquette. Nouvelle Étiquette ouvre la création dans cette famille.

### 5. Données affichées et source de vérité

Référentiel Étiquette (ID,nom,couleur,statut retiré) et ID facultatif dans brouillon Session ; couleur de Séance dérivée, pas copie indépendante modifiable.

### 6. Classification des valeurs Figma

Étiquettes/Nouvelle étiquette/Annuler/Supprimer statiques ; noms et couleurs des options dynamiques ; Hyrox et couleurs de démonstration ne sont pas des constantes imposées.

### 7. Structure de l’écran

Feuille de sélection et fermeture ; options avec pastilles ; création avec nom/palette ; confirmation centrée à l’appui long ; Composition demeure en arrière-plan.

### 8. Éléments obligatoires

Sélection unique facultative, nom et couleur pour une nouvelle Étiquette, annulation ; aucune Catégorie de Séance ni CTA final d’enregistrement de Séance.

### 9. Layout déterministe

Modale DSF D-228 ; lignes/pastilles selon 2028:11204 ; palette 4640:6308 ; dialogue 354/rayon 18, deux actions Annuler/Supprimer. Ne pas réutiliser le panneau Catégorie de l’Exercice.

### 10. Responsive, Safe Areas, texte, scroll et clavier

Feuille limitée à la zone sûre, liste défilante, titre non tronqué ; clavier fait apparaître le nom saisi et les actions ; texte agrandi selon§4.2.

### 11. États de l’écran

Aucune/une Étiquette ; liste vide ; création ; nom invalide ; sélection retirée existante ; appui long ; suppression confirmée/annulée ; erreur.

### 12. Contrôles et interactions

Tap valide une sélection simple ; appui long ne change pas la sélection et ouvre suppression. Créer valide le référentiel ; son affectation reste dans le brouillon de Séance. La suppression globale conserve les affectations existantes D-210.

### 13. Gestes

Tap, scroll, appui long option ; fermeture hors dialogue n’exécute jamais Supprimer. Pas de drag des options.

### 14. Validation

Nom de nouvelle Étiquette non vide et unique dans le référentiel ; couleur choisie dans palette. Aucune Étiquette exigée pour Continuer dans Composition ; affectation retirée existante reste conservable.

### 15. Brouillon et persistance

Affectation Session enregistrée seulement à Continuer. Création/renommage/couleur/suppression du référentiel sont des opérations explicites de référentiel, sans sauvegarder la Séance. Une erreur ne modifie pas partiellement le référentiel.

### 16. Navigation et conservation d’état

Retour à la même Composition et au même brouillon ; Annuler la confirmation restitue la liste ; suppression retire des nouveaux choix mais conserve une affectation existante et dernière couleur.

### 17. Erreurs et cas limites

Valeur retirée : pas de nouvelle affectation ; nom dupliqué/vide : conserver saisie et erreur ; échec persistance : conserver modale. Le message 4861:6145 mentionnant Exercices est incorrect : il doit viser les Séances.

### 18. Accessibilité

Annoncer nom, sélection et action ; la couleur seule n’identifie pas une Étiquette. Focus captif dans confirmation puis retour à option/liste ; bouton destructif nommé.

### 19. Invariants

Zéro ou une Étiquette ; couleur appartient au référentiel, propagée aux objets courants ; instantanés historiques immuables. Aucun parcours Composition→Catégories→Catalogue.

### 20. Recette déterministe

Aucune/une sélection, changement/fermeture ; créer nom valide/vide/dupliqué et couleur ; renommer/recolorer ; supprimer valeur utilisée/inutilisée, Annuler ; conserver ancienne affectation et couleur ; abandonner Composition ne sauvegarde pas son affectation ; historique inchangé.

### 21. Traçabilité

D-188/D-200/D-210–212/D-222 ; CE-T03-08 ; frames§1. Renommage requis, sans frame dédiée : couverture fonctionnelle, preuve visuelle à compléter.

---

## CE-T03-17 — Navigation principale — inventaire DSF

### 1. Identification

Bloc B8/B9 ; états S78–S82 ; T03-E E05–E06 ; composant `6298:12462`.

### 2. Finalité fonctionnelle

Garantir la même navigation globale sur T03 avec libellé `Catalogues` et icônes DSF exactes.

### 3. Contexte d’entrée

Tous écrans utilisant Shell Bottom=Navigation.

### 4. Contexte de sortie / destinations

Tap sur destination active/inactive ouvre la route racine correspondante selon navigation existante.

### 5. Données affichées et source de vérité

Aucune donnée métier. État active dérivé de route.

### 6. Classification des valeurs Figma

`Catalogues`, `Calendrier`, `Suivi`, `Profil` = statiques ; icônes = composants DSF, pas données.

### 7. Structure de l’écran

Barre Bottom Navigation canonique à quatre destinations.

### 8. Éléments obligatoires

| Destination | Variante | Boîte | Dessin | Cible |
|---|---|---:|---:|---:|
| Catalogues | `6298:11827` | 32×32 | ≤24 centré | ≥48×48 |
| Calendrier | `6298:11988` | 32×32 | ≤24 centré | ≥48×48 |
| Suivi | `6298:12149` | 32×32 | ≤24 centré | ≥48×48 |
| Profil | `6298:12310` | 32×32 | ≤24 centré | ≥48×48 |

### 9. Layout déterministe

Répartition via composant DSF ; dessins centrés ; aucune substitution ou mise à l’échelle >24 pour quatre destinations.

### 10. Responsive, Safe Areas, texte, scroll et clavier

Barre adapte largeur 360/402/440 et inset bas ; aucun chevauchement ; labels accessibles même si présentation visuelle compacte.

### 11. États de l’écran

Quatre destinations : Catalogues, Calendrier, Suivi, Profil ; une active. Aucune Recherche ; aucune destination créée par la variante Search du set DSF. Navigation absente des modales/shells d’Exécution selon leur propre contrat.

### 12. Contrôles et interactions

Tap navigation. Destination non disponible dans une livraison partielle doit être explicitement disabled plutôt qu’active sans action.

### 13. Gestes

Tap uniquement ; aucun swipe/long press de navigation.

### 14. Validation

Route courante détermine selected. Aucun état métier ne conditionne le label `Catalogues`.

### 15. Brouillon et persistance

Aucune persistance métier. Le segment Catalogue n’est pas une propriété de la nav globale persistée au relaunch.

### 16. Navigation et conservation d’état

Tap Catalogues ouvre espace Catalogue ; relaunch force Séances selon D-167.

### 17. Erreurs et cas limites

Route indisponible = disabled explicite. Éviter double navigation sur double tap.

### 18. Accessibilité

Role tab ; selected ; label exact ; ordre logique ; cibles suffisantes.

### 19. Invariants

Premier onglet = Catalogues ; dessins ≤24 ; DSF exact ; aucune icône système de remplacement.

### 20. Recette déterministe

Tester les quatre destinations, labels accessibles, état actif, dimensions et Safe Areas ; relance Catalogue/Séances ; aucune action ni bouton Recherche ; ne pas confondre une variante DSF inutilisée avec une route produit.

### 21. Traçabilité

D-221/D-225/D-233–239 ; Navigation/Bottom 6298:12462 ; CE-UI-06 Splash et CE-UI-07 Profil sont propriétaires de leurs comportements.

---

## CE-MEDIA-EXEC-01 — Exécution — faces Information et Média

### 1. Identification

Variantes intégrées de l’Exécution SESSION ou ACTIVITY : 5021:5994,5581:4257,4997:6113,5588:4363. Source de comportement : CONCEPTION-EXECUTION-MEDIA ; aucune acquisition média.

### 2. Finalité fonctionnelle

Consulter les médias déjà associés à l’Exercice courant pendant que le moteur poursuit normalement l’Exécution.

### 3. Contexte d’entrée

Exercice avec au moins un média, depuis le shell direct ou Séance ; face Information par défaut au début d’une nouvelle Exécution.

### 4. Contexte de sortie / destinations

Bascule → autre face ; tap média → CE-MEDIA-EXEC-02 ; changement d’Exercice → fermeture du média précédent et nouvel état moteur ; les commandes d’Exécution restent sous le contrat moteur propriétaire.

### 5. Données affichées et source de vérité

Collection ordonnée de médias de l’Exercice de l’instantané ; index courant, face et état du lecteur transitoires. Chrono/Série/côté/Tour proviennent exclusivement du moteur ; Tour seulement pour SESSION.

### 6. Classification des valeurs Figma

Nom et paramètres dynamiques ; photos/vidéos exemples non codées ; labels Information/Média et commandes statiques ; aucune valeur de Série/Tour de démonstration n’initialise le moteur.

### 7. Structure de l’écran

Même zone de carte pour Information et Média, retournement sans déplacement du shell ; bouton dédié ; un média ; pagination ; Lecture central avant vidéo ; commandes d’Exécution accessibles.

### 8. Éléments obligatoires

Bascule seulement si média présent ; pagination ; image/poster intégral avec ratio conservé ; Lecture central disparaît pendant lecture ; aucun autoplay ; catégorie et côté restent des informations distinctes du nom.

### 9. Layout déterministe

Bascule circulaire 32, fond#FDFDFE, liseré blanc 1, ombreDSF T10 ; icône flip horizontale noire. Les deux emplacements graphiques haut/bas ne créent pas deux effets métier différents. Série/Tour cible 24 selonDSF T10 ;17 sur 4997:6113 reste écart visuel. Tour masqué en ACTIVITY.

### 10. Responsive, Safe Areas, texte, scroll et clavier

Même zone sûre que shell Exécution ; média non recadré, marges possibles ; texte agrandi sans masquer les commandes ; réduction des animations supprime la transformation 3D et utilise un changement discret sans mouvement spatial.

### 11. États de l’écran

Sans média ; Information ; image ; vidéo poster/lecture/pause ; premier/dernier média ; chargement ; média indisponible ; Exercice terminé.

### 12. Contrôles et interactions

Bouton retourne la face ; retour Information met vidéo en pause. Swipe change exactement un média et met la précédente vidéo en pause. Tap média ouvre plein écran ; Lecture lance explicitement vidéo. Son vidéo actif par défaut, abaissé pendant annonce KODJO puis restauré.

### 13. Gestes

Swipe horizontal simple pour galerie, jamais pour changer de face ; galerie non circulaire avec résistance aux bornes ; tap dédié pour bascule/lecture/plein écran ; actions au relâchement D-237.

### 14. Validation

Vérifier existence média et index dans bornes avant affichage ; absence média masque bascule ; aucune consultation ne valide une Série ni ne suspend le moteur.

### 15. Brouillon et persistance

Face/index mémorisés par Exercice pendant l’Exécution courante seulement. Retour immédiat à Média permet reprise explicite de vidéo ; retour après avoir quitté l’Exercice restaure face/index mais jamais autoplay. Aucune préférence durable ni modification d’instantané.

### 16. Navigation et conservation d’état

Plein écran revient sur même face/index ; au changement d’Exercice fermer lecteur précédent et plein écran, puis transition normale. Nouvelle Exécution réinitialise face Information.

### 17. Erreurs et cas limites

Erreur locale visible à la place du média ; conserver face et accès aux autres médias, moteur continue. Ne pas masquer silencieusement le média en erreur. Une collection vide après chargement ne crée pas de commande fantôme.

### 18. Accessibilité

Labels Changer de face, Lire la vidéo et Agrandir le média ; pagination annoncée ; alternatives accessibles précédent/suivant au geste ; ordre de focus stable. Annonces KODJO intelligibles via ducking ; aucun flash/autoplay.

### 19. Invariants

Un média à la fois, ordre source, aucun bouclage ; moteur indépendant ; pas d’import ; pas de Tour en direct ; vidéo ne redémarre jamais sans action utilisateur.

### 20. Recette déterministe

Tester 0/1/N médias, mélange image/vidéo, premier/dernier, un swipe=un média, retour Information pendant lecture, retour même Exercice et autre Tour, nouveau run, erreur média, ducking, plein écran, fin naturelle et saut d’Exercice. Vérifier réduction des animations et contrôles accessibles ; essais interactifs nécessaires.

### 21. Traçabilité

Réexport5581:4257 du03/10 ; valeurs Série0/3 et Tour0/3 d’exemple ne définissent ni index initial ni Tour ACTIVITY.

D-203/D-216/D-220/D-237 ; CONCEPTION-EXECUTION-MEDIA §§3–6/9–14 ; DSF-V2-MOTIFS-LOT-3 T10 ; frames§1 ; CE-T03-09..13/CE-EXEC-SESSION-01.

---

## CE-MEDIA-EXEC-02 — Exécution — média plein écran

### 1. Identification

Frame 5009:6069 Exécution d’un exercice — Média plein écran ; variante de CE-MEDIA-EXEC-01. Le nom historique de test Séance ne borne pas l’origine de données.

### 2. Finalité fonctionnelle

Agrandir l’image/vidéo sans perdre le suivi et les commandes du moteur.

### 3. Contexte d’entrée

Tap sur le média courant en face Média, avec origine SESSION/ACTIVITY, index et état de lecture conservés.

### 4. Contexte de sortie / destinations

Fermer revient à face Média au même index ; changement d’Exercice ferme automatiquement le plein écran ; sortie d’Exécution selon le contrat moteur.

### 5. Données affichées et source de vérité

Même média et même moteur que la face compacte ; couche flottante alimentée par nom, côté, chrono, Série et Tour conditionnel ; aucune copie autonome du temps.

### 6. Classification des valeurs Figma

Nom, chrono et index dynamiques ; contenu vidéo/image démonstratif ; labels Fermer/Lecture/Pause statiques. Un Tour visible dans la capture n’active pas cette donnée en ACTIVITY.

### 7. Structure de l’écran

Média plein écran ratio conservé ; cadre flottant d’Exécution ; couche lecteur vidéo séparée. Le moteur et le lecteur ont des commandes différentes.

### 8. Éléments obligatoires

Cadre : nom, côté si applicable, chrono, Série, Tour seulement SESSION, commandes principales d’Exécution et son/vocal. Lecteur vidéo : Lecture/Pause, progression vidéo, Fermer ; image : Fermer et cadre moteur.

### 9. Layout déterministe

Reprendre la composition de 5009:6069 sans rogner le média ; marges admises ; couche flottante lisible au-dessus, Safe Areas respectées. Les commandes lecteur ne remplacent pas Pause/Réinitialiser/Suivant du moteur.

### 10. Responsive, Safe Areas, texte, scroll et clavier

Orientation suit l’appareil, paysage autorisé sans rotation forcée ; recomposer les couches sans les étirer. À texte agrandi, commandes restent atteignables ; restaurer disposition compacte à la fermeture.

### 11. États de l’écran

Image ; vidéo poster/en lecture/en pause ; portrait/paysage ; erreur média ; moteur actif/suspendu ; transition de phase/Exercice.

### 12. Contrôles et interactions

Fermer ne modifie ni index ni temps moteur. Lecture/Pause et barre vidéo pilotent uniquement le lecteur ; commandes flottantes pilotent le moteur selon§4.12. Son vidéo actif par défaut, ducking pendant les annonces.

### 13. Gestes

Tap sur commandes ; interaction barre vidéo distincte de progression moteur. Ne pas déduire une galerie plein écran non spécifiée du swipe compact ; fermer puis naviguer dans la galerie compacte.

### 14. Validation

Aucune modification du plan ou des résultats par ouverture/rotation/fermeture ; valider média existant ; empêcher l’action derrière les couches du plein écran.

### 15. Brouillon et persistance

État lecteur et index transitoires partagés avec la face compacte ; aucun enregistrement durable. Les résultats du moteur suivent leur propre persistance.

### 16. Navigation et conservation d’état

Retour au déclencheur/face même média ; fin d’Exercice ferme plein écran et média précédent même pendant vidéo ou rotation ; début d’un nouveau run réinitialise l’état transitoire.

### 17. Erreurs et cas limites

Média indisponible : erreur locale et fermeture disponible ; moteur continue. La transition moteur garde priorité sur le maintien d’une vidéo terminée ; ne pas bloquer la fin de Séance.

### 18. Accessibilité

Distinguer vocalement Pause vidéo et Pause exécution ; nommer Fermer le plein écran ; focus contenu dans la couche active et restauré à la sortie ; contraste du cadre et commandes vérifiable en portrait/paysage.

### 19. Invariants

Pas de suspension implicite, pas d’autoplay, ratio conservé, un seul état moteur ; Tour conditionnel SESSION ; lecteur et commandes Exécution séparés.

### 20. Recette déterministe

Image/vidéo, portrait/paysage, fermer/revenir, pause vidéo sans pause moteur, pause moteur distincte, ducking, erreur, fin de Série puis changement d’Exercice, arrêt confirmé ; vérifier focus/texte agrandi et absence de Tour ACTIVITY.

### 21. Traçabilité

D-203/D-216 ; CONCEPTION-EXECUTION-MEDIA §§7–12 ; frame 5009:6069 ; CE-MEDIA-EXEC-01 et contrats moteur.

---

## CE-UI-01 — Profil — préférence silhouette

### 1. Identification

Modifier le profil — MVP ; frame 1992:778. Contrat de photo/nom d’affichage/silhouette, distinct des préférences immédiates CE-UI-07.

### 2. Finalité fonctionnelle

Modifier l’identité locale et la variante d’icône de Zone corporelle, sans compte distant ni effet métier de la silhouette.

### 3. Contexte d’entrée

Profil > Modifier.

### 4. Contexte de sortie / destinations

Enregistrer valide/persiste et revient à Profil ; retour avec modification propose abandon, qui restaure les valeurs enregistrées ; annuler abandon conserve le brouillon.

### 5. Données affichées et source de vérité

Photo locale facultative, nom d’affichage et silhouette facultative homme/femme ; absence silhouette affiche homme. Les champs viennent du brouillon de Profil, pas de données d’événement.

### 6. Classification des valeurs Figma

Nom/photo utilisateur dynamiques ; hommes/femmes sont labels de choix d’icône, sans validation de sexe ; exemples du profil illustratifs. Aucun événement/date/durée à classer ici.

### 7. Structure de l’écran

Photo/nom existants puis deux choix de silhouette sous l’aide du Nom d’affichage.

### 8. Éléments obligatoires

Champ Nom d’affichage, action photo facultative, deux silhouettes à sélection unique et Enregistrer. Aucun sélecteur de langue ni identité distante.

### 9. Layout déterministe

Cercles 64 espacés 24, silhouettes 44. Sélection contour 2 et dessin#0508E5 ; non sélection contour#CCD1E0 à1, dessin#9499A8.

### 10. Responsive, Safe Areas, texte, scroll et clavier

Références 360/402/440, Safe Areas existantes ; texte agrandi sans réduction de police, scroll utile et contrôles accessibles. Les dimensions de référence 402 ne figent pas les coordonnées sur tous les appareils.

### 11. États de l’écran

Non renseigné ; homme ; femme ; modification non enregistrée.

### 12. Contrôles et interactions

Toucher une silhouette change le brouillon ; Enregistrer persiste avec le Profil.

### 13. Gestes

Tap choix/actions et saisie/scroll ; D-237 ; aucune interaction sur les icônes de zones ailleurs ne modifie cette préférence.

### 14. Validation

Nom d’affichage non vide,1..80 caractères selon conception 08 ; photo et silhouette facultatives ; silhouette homme/femme ou absente. Les anciens profils sans silhouette restent valides.

### 15. Brouillon et persistance

Même brouillon et action Enregistrer que photo/nom. Les profils existants sans valeur restent valides.

### 16. Navigation et conservation d’état

Destination Profil inchangée ; préférence relue après relance.

### 17. Erreurs et cas limites

Nom vide/trop long : erreur liée au champ, rester ; photo indisponible : avatar/initiales sans empêcher l’accès aux champs ; erreur sauvegarde : conserver brouillon, aucune mutation partielle.

### 18. Accessibilité

Labels Silhouette homme / Silhouette femme ; état sélectionné annoncé.

### 19. Invariants

Aucun effet sur recherche, catégories, calculs, exécutions ou données historiques.

### 20. Recette déterministe

Nom 1/80/vide/81, photo absente/présente/indisponible ; silhouette absente→homme, choisir femme/enregistrer/relancer ; abandon sans écriture ; erreur persistance ; vérifier toutes icônes de zone et aucun effet filtre/calcul/historique.

### 21. Traçabilité

Chapitre 06 Profil et 08 Profil ; D-213/D-238 RG-5/RG-10 ;1992:778 ; CE-UI-07. Les anciennes restrictions photo post-MVP ne décrivent pas cet écran actuel.

---

## CE-UI-02 — Calendrier — Jour compact

### 1. Identification

Calendrier Jour ; frames 1992:5510,1992:5602,1992:5697,1992:5794,2059:267 ; composants 6374:12704/12705.

### 2. Finalité fonctionnelle

Présenter les occurrences sur la grille horaire avec la distinction Séance/Exercice.

### 3. Contexte d’entrée

Onglet Calendrier (Jour par défaut), changement de jour, retour de planification.

### 4. Contexte de sortie / destinations

Surface occurrence → CE-UI-05 en modification ; Lecture → moteur SESSION/ACTIVITY ; appui long sur créneau → sélection de plage puis Planifier avec date/heure de début préremplies ; source par CE-UI-04. Pas d’actions glissées en Jour.

### 5. Données affichées et source de vérité

Occurrences futures Routine SESSION/ACTIVITY ; titre, heure, durée et couleur de l’événement. Nature issue du type de source.

### 6. Classification des valeurs Figma

Noms, dates, durées et couleurs d’événement sont des données ; les exemples Figma ne deviennent pas des constantes ni des règles de déduction.

### 7. Structure de l’écran

Navigation de date et grille horaire ; cartes à droite de la colonne des heures ; navigation basse.

### 8. Éléments obligatoires

Barre couleur 4 ; nature 26 ; titre 13 gras ; heure/durée 11 gris ; Lecture 26. Aucun Déployer.

### 9. Layout déterministe

Référence 402 : x80, largeur 298 ; séance 46 de haut, exercice 48. Hauteur d’instance adaptée à l’événement. Exemple heure/durée : 08 h · 13 min.

### 10. Responsive, Safe Areas, texte, scroll et clavier

Références 360/402/440, Safe Areas existantes ; texte agrandi sans réduction de police, scroll utile et contrôles accessibles. Les dimensions de référence 402 ne figent pas les coordonnées sur tous les appareils.

### 11. États de l’écran

Jour standard ; appui long ; créneau ; après planification ; jour suivant ; vide 2128:86.

### 12. Contrôles et interactions

Glissement gauche/droit ou chevrons change de jour ; Aujourd’hui revient à date locale ; toucher occurrence ouvre sa Routine ; Lecture lance sa source. Appui long crée une sélection transitoire, jamais une Routine avant Enregistrer. La plage n’impose pas une durée à l’Exercice/Séance.

### 13. Gestes

Scroll vertical de grille ; navigation horizontale de jour ; appui long créneau distinct du tap occurrence. Pas de déploiement ni de swipe destructif.

### 14. Validation

Aucune mutation par changement de date/vue ; valider la planification seulement dans CE-UI-05. Les périodes passées sans Exécution ne sont pas ajoutées au Suivi.

### 15. Brouillon et persistance

Jour visible, position de grille et plage sélectionnée sont des états UI ; brouillon Routine appartient au formulaire. Annuler Planifier ne crée aucune occurrence ; Enregistrer actualise la grille.

### 16. Navigation et conservation d’état

Conserver date/vue/position pendant planification ; au retour réussi montrer l’occurrence concernée. Changer Jour/Semaine/Mois conserve la date de référence. Aucune persistance durable de préférence de vue n’est ajoutée.

### 17. Erreurs et cas limites

Jour vide sans carte fictive ; source supprimée : rafraîchir et signaler indisponibilité. Chevauchement d’occurrences : ne jamais masquer une action ; géométrie exacte non représentée, réserve V-05. Texte long tronqué avec nom complet accessible.

### 18. Accessibilité

Annoncer type, nom, heure, durée et action Lecture. La taille visible 26 ne remplace pas le minimum tactile 44.

### 19. Invariants

Exception explicite à largeur 354/titre 15/suppression de barre des cartes standard. Aujourd’hui/Planifier 32 restent l’exception acceptée à revoir aprèsT04.

### 20. Recette déterministe

Jour vide/1/N, deux types de source, tap surface distinct de Lecture, glissements et chevrons, Aujourd’hui, sélection plage→date/heure préremplies, annulation et enregistrement, retour même date/scroll. Vérifier dimensions compactes, aucun Déployer, aucune action glissée ; chevauchements V-05 à qualifier.

### 21. Traçabilité

D-206/D-223/D-239 ; chapitre 06 Calendrier ;1992:5510/5602/5697/5794,2059:267,2128:86 ; CE-UI-03/04/05.

---

## CE-UI-03 — Calendrier — Semaine et structure Mois

### 1. Identification

Calendrier ; frames 1992:5101,2252:86,1992:6389,1992:5962,2094:86,2074:86 ; Mois 1992:5237 ; suppressions 1992:5365/6102.

### 2. Finalité fonctionnelle

Présenter les occurrences chronologiques de Semaine ; conserver la grille mensuelle existante.

### 3. Contexte d’entrée

Segment Semaine/Mois ; retour de planification/suppression.

### 4. Contexte de sortie / destinations

Surface occurrence → CE-UI-05 modification de Routine ; Lecture → moteur selon origine ; Dupliquer → brouillon Routine copié ; Supprimer → confirmation unique/périodique ; choix source CE-UI-04.

### 5. Données affichées et source de vérité

Occurrence et type SESSION/ACTIVITY, heure, durée et classement de la source ; jamais déduits du titre.

Sources SESSION : durées d’occurrence et total de Séance sans double ajout de R ; ACTIVITY : durée intrinsèque ; v12§5.

### 6. Classification des valeurs Figma

Noms, dates, durées et couleurs d’événement sont des données ; les exemples Figma ne deviennent pas des constantes ni des règles de déduction.

### 7. Structure de l’écran

Semaine : segmenté, barre 7 jours, sections chronologiques, navigation fixe. Mois : grille 7colonnes, navigation mensuelle, jour sélectionné et marqueurs d’occurrences ; ne pas appliquer les cartes de Semaine à chaque cellule du Mois.

### 8. Éléments obligatoires

Semaine : nature 26, badge heure 08:00, classement puis durée avec sablier ; statut Suivi non ajouté. Mois : grille 7colonnes conservée.

### 9. Layout déterministe

Carte 354×95,5 repliée ; séance déployée 254,5. Segmenté 354/padding 4/gaps 4/options 112,67. Aucune barre de carte Semaine.

### 10. Responsive, Safe Areas, texte, scroll et clavier

Références 360/402/440, Safe Areas existantes ; texte agrandi sans réduction de police, scroll utile et contrôles accessibles. Les dimensions de référence 402 ne figent pas les coordonnées sur tous les appareils.

### 11. États de l’écran

Repliée, séance déployée, jour sélectionné, actions glissées, après suppression ; Mois ; vide.

### 12. Contrôles et interactions

Semaine : sélectionner un jour place sa section en tête ; scroll synchronise jour. Déployer révèle détails/récurrence ; Lecture distincte. Glisser expose Dupliquer/Supprimer seulement. Dupliquer copie source+paramètres dans brouillon sans persister. Mois : navigation change mois, sélection change date de référence ; passage Jour/Semaine utilise cette date.

### 13. Gestes

Swipe contextuel en Semaine selon§4.7 ; Mois : tap jour/chevrons, pas de déploiement de carte mensuelle inventé ; D-237 pour les appuis.

### 14. Validation

Unique : Annuler/Confirmer suppression. Périodique : Seulement cette occurrence / Toutes les occurrences à venir / Annuler. La seconde action porte les occurrences futures de la Routine, pas d’autres Routines de la même source. Historique et source conservés.

### 15. Brouillon et persistance

Recalcul des occurrences après validation de Routine. Suppression unitaire doit rester exclue après relance et retirer sa notification ; le modèle/API doit persister l’exclusion par Routine et date/heure d’origine (§6 R-04), pas de simulation d’une suppression seulement visuelle. Duplication reste brouillon jusqu’à Enregistrer.

### 16. Navigation et conservation d’état

Après confirmation, conserver date/vue et actualiser liste/marqueurs. Après annulation, même sélection et même état. Changement de vue conserve date ; scroll Semaine synchronise la barre 7 jours.

### 17. Erreurs et cas limites

Semaine/mois vide, occurrence déjà retirée, source disparue, erreur de suppression : informer sans mutation partielle. Ne pas confondre média absent avec erreur métier. Photo selon règles communes§4.11 ; pas de photo Séance.

### 18. Accessibilité

Heure/type/nom annoncés ; vignette nom de l’exercice ; cibles 44 hors exception explicite Aujourd’hui/Planifier.

### 19. Invariants

Récurrence seulement déployée en Semaine ; ne pas appliquer les cartes compactes Jour à Semaine ou Mois.

### 20. Recette déterministe

Semaine vide/N, deux origines, déploiement/récurrence, synchronisation jour/scroll, modification, duplication annulée/enregistrée. Suppression unique et deux choix périodiques confirmés/annulés, notifications/historique. Mois : sept colonnes, sélection, navigation de mois, retour Jour/Semaine même date, marqueurs actualisés. La recette de persistance unitaire est obligatoire ; cette documentation ne prétend pas l’avoir exécutée.

### 21. Traçabilité

Chapitre 06 Calendrier ; D-206/D-233–239 ;1992:5101/5237/5365/5962/6102/6389,2252:86,2094:86,2074:86 ; CE-UI-02/04/05.

---

## CE-UI-04 — Calendrier et planification — choisir une source

### 1. Identification

Calendrier et Planification — choix de source ; frames 1992:6249,1992:7861,5451:4272 ; variante Choix calendrier ou planification.

### 2. Finalité fonctionnelle

Choisir une seule source SESSION ou ACTIVITY pour la planification.

### 3. Contexte d’entrée

Planifier depuis Calendrier ; changer la source du formulaire.

### 4. Contexte de sortie / destinations

Toucher une source valide met à jour le brouillon et ferme immédiatement vers CE-UI-05. Fermer sans choix restitue l’appelant et sa source précédente. Aucun CTA Sélectionner.

### 5. Données affichées et source de vérité

Séances/Exercices persistants sélectionnables ; identifiant choisi dans le brouillon.

### 6. Classification des valeurs Figma

Noms/classements/paramètres des sources dynamiques ; titres Choisir une séance/Choisir un exercice et fermeture statiques ; aucune date/couleur d’événement issue de cette sélection.

### 7. Structure de l’écran

Modale avec titre/fermeture et liste défilante de cartes radio ; aucun pied de validation. Arrière-plan visible mais inactif.

### 8. Éléments obligatoires

Radio de sélection ; pas de badge durée, Lecture ou Déployer ; titre/classement/valeurs, état sélectionné ou non.

### 9. Layout déterministe

Largeur 354, marges 24 sur 402, hauteur 91 ; radio côté droit ; minimum 20 entre texte et contrôle ; titre 15/pastilles 20/valeurs 16.

### 10. Responsive, Safe Areas, texte, scroll et clavier

Références 360/402/440, Safe Areas existantes ; texte agrandi sans réduction de police, scroll utile et contrôles accessibles. Les dimensions de référence 402 ne figent pas les coordonnées sur tous les appareils.

### 11. États de l’écran

Aucune/une sélection ; longue liste ; texte tronqué ; exercice avec/sans média.

### 12. Contrôles et interactions

Tap carte/radio choisit exactement une source et ferme ; pas de seconde validation. Cette action ne crée pas de Routine et ne copie pas de SessionActivity. Case et Sélectionner restent propres à CE-T03-07.

### 13. Gestes

Gestes existants du chapitre 06 ; appuis D-237, action immédiate au relâchement, annulation hors cible, opacité seule si réduction des animations.

### 14. Validation

Source persistante active et planifiable SESSION/ACTIVITY ; recontrôler disponibilité avant choix et à Enregistrer. Parcours non sélectionnable au MVP.

### 15. Brouillon et persistance

Source dans le brouillon seulement ; aucune copie SessionActivity par cette sélection.

### 16. Navigation et conservation d’état

Annuler conserve source antérieure ; retour au formulaire avec nouvelle source validée.

### 17. Erreurs et cas limites

RG-3 : séance sans photo. Exercice avec média : vignette 64/recadrage/place réservée et texte alternatif ; pas de hausse de hauteur. Source indisponible : pas de sélection fantôme.

### 18. Accessibilité

Nom/type et état sélectionné annoncés ; texte complet accessible ; radio cible 44 minimum.

### 19. Invariants

Même variante Calendrier/Planification, aucun contexte Choix planification distinct ; aucune action d’exécution sur carte.

### 20. Recette déterministe

Tap une source→fermeture immédiate et formulaire actualisé ; fermer sans choix→source antérieure ; source disparue/archivée→pas de choix fantôme ;0/1/N, longue liste, deux types, radio accessible. Aucun CTA bas ni badge durée/Lecture/Déployer ; média/place réservée sans agrandir carte.

### 21. Traçabilité

D-206/D-222/D-223/D-238 ;1992:6249/7861,5451:4272 ; CE-UI-05 ; distinction multisélection CE-T03-07.

---

## CE-UI-05 — Planification — formulaire et états de paramètres

### 1. Identification

Planifier une séance ou un exercice ; frames 1992:6838,1992:6622,1992:7187,1992:7369,1992:7537,1992:7716 ; sélection CE-UI-04.

### 2. Finalité fonctionnelle

Créer/modifier une Routine pour SESSION/ACTIVITY en conservant les règles existantes.

### 3. Contexte d’entrée

Catalogue Planifier avec source préremplie ; Calendrier ; modification de Routine.

### 4. Contexte de sortie / destinations

Enregistrer réussit → écran appelant Catalogue ou Calendrier, occurrence recalculée ; abandon → appelant inchangé ; choisir/changer source → CE-UI-04 puis même brouillon.

### 5. Données affichées et source de vérité

Source, début, heure, périodicité, fin et rappel du brouillon.

### 6. Classification des valeurs Figma

Noms, dates, durées et couleurs d’événement sont des données ; les exemples Figma ne deviennent pas des constantes ni des règles de déduction.

### 7. Structure de l’écran

Titre Planifier sans type puis Planifier une séance/un exercice ; source → Date de début → Heure → Aucune/Périodique → fréquence/jours/fin conditionnels → Rappel → récapitulatif dérivé → Enregistrer.

### 8. Éléments obligatoires

Source SESSION/ACTIVITY ; une date et une heure ; mode Aucune ou Périodique. Périodique : fréquence entière de 1 à 12 semaines,≥1jour, fin obligatoire≥début. Rappel unique facultatif : Aucun,5 min,15 min,30 min,1h,Autre. Autre ouvre le délai personnalisé. Les anciens 10 min/Personnalisé ne sont pas les labels cibles D-229.

### 9. Layout déterministe

Shell Modal Fullscreen ; blocs sur marges 24 ; Date de début/Heure au même niveau, pas de titre Quand ?. Rappel : Aucun/Autre fixes aux extrémités, choix rapides défilants. Récapitulatif multi-ligne dans son cadre ; fréquence par stepper inline, date/heure/rappel dans leurs sélecteurs dédiés.

### 10. Responsive, Safe Areas, texte, scroll et clavier

Références 360/402/440, Safe Areas existantes ; texte agrandi sans réduction de police, scroll utile et contrôles accessibles. Les dimensions de référence 402 ne figent pas les coordonnées sur tous les appareils.

### 11. États de l’écran

Création sans source/avec source ; édition/duplication ; Aucune/Périodique ; date/heure/rappel ouverts ; rappel refusé ; semaine modifiée ; champ invalide ; enregistrement/erreur. Aucune n’exige ni jours ni date de fin.

### 12. Contrôles et interactions

Changer source conserve autres paramètres ; changer fréquence/jours met à jour le récapitulatif depuis les mêmes valeurs, sans phrase codée. Annuler un sélecteur restaure sa valeur ; Confirmer met à jour le brouillon. Enregistrer persiste une seule Routine ; première activation rappel demande permission système, refus remet rappel désactivé et informe.

### 13. Gestes

Tap/stepper/roulette/scroll ; D-237 action au relâchement. Pas de roulette pour fréquence entière. Le scroll des raccourcis de rappel ne déplace pas Aucun/Autre.

### 14. Validation

Source disponible ; date/heure valides ; Aucune=une occurrence ; Périodique=fréquence entière 1..12, jours non vides, fin≥début inclusive. Semaine contenant début = ancrage ; bornes de dates inclusives. Pas d’occurrence historique réécrite. Un rappel n’est actif qu’avec permission ; délai personnalisé validé selon unité du picker. Rappel personnalisé strictement positif, maximum 24 h ; fréquence maximum 12 semaines (§6 R-02).

### 15. Brouillon et persistance

Brouillon distinct de Routine ; ouvertures/choix/roulettes ne persistent rien avant Enregistrer. Écriture et recalcul des notifications cohérents ; double soumission bloquée. Erreur conserve brouillon.

### 16. Navigation et conservation d’état

Conserver les champs pendant sélection source et paramètres ; annulation du formulaire restaure le contexte appelant. Succès conserve vue/date Calendrier ou filtre/scroll Catalogue ; pas de ligne prochaine planification sur carte Catalogue.

### 17. Erreurs et cas limites

Source disparue, dates inversées, aucun jour, fréquence invalide : indiquer champ et empêcher sauvegarde. Permission refusée : ne pas prétendre avoir planifié un rappel. Erreur persistance : rester, réactiver Enregistrer, aucune Routine partielle.

### 18. Accessibilité

Unités et sélection annoncées ; focus de modale ; réduction des animations sans dilatation.

### 19. Invariants

Aucun second moteur de planification ; occurrence passée non réécrite. Paramètres fonctionnels inchangés par la revue des cartes.

### 20. Recette déterministe

SESSION/ACTIVITY depuis chaque entrée ; Aucune et Périodique 1/2 semaines avec un/sept jours ; bornes début/fin inclusives et semaine d’ancrage ; date fin manquante/inversée ; rappel Aucun/rapide/Autre, permission accordée/refusée ; annuler/confirmer pickers ; récapitulatif reflète 2 semaines ; double tap/erreur ; retour appelant et historique inchangé.

### 21. Traçabilité

D-206/D-222/D-223/D-229 ; chapitre 06 Planifier et 08 calcul des occurrences ;1992:6622/6838/7187/7369/7537/7716 ; CE-UI-04. Les valeurs de démonstration incohérentes ne sont pas recopiées dans le récapitulatif.

---

## CE-UI-06 — Splash KODJO

### 1. Identification

Splash actif 1992:469 ; unique exception aux Screen Shells standards. Anciennes propositions graphiques hors cible.

### 2. Finalité fonctionnelle

Présenter l’identité KODJO pendant l’initialisation locale.

### 3. Contexte d’entrée

Démarrage de l’application nécessitant initialisation ; pas une destination de navigation.

### 4. Contexte de sortie / destinations

Initialisation terminée → navigation initiale Catalogues/Séances ; ne pas ajouter une connexion ou un onboarding non spécifié.

### 5. Données affichées et source de vérité

État d’initialisation locale ; identité KODJO/ANKUSHA et signature Keep On. Do Just One. depuis ressources produit.

### 6. Classification des valeurs Figma

Logo, nom et signature statiques ; temps d’affichage dépend de l’initialisation, aucune durée de démonstration codée.

### 7. Structure de l’écran

Identité centrée dans zone sûre ; aucun en-tête/navigation/action de formulaire.

### 8. Éléments obligatoires

Logo proportionnel et textes d’identité représentés par 1992:469 ; aucune commande Recherche/Créer.

### 9. Layout déterministe

Respecter centrage et proportions du Figma ; ne pas étirer le logo sur largeur écran ; fond du Splash courant.

### 10. Responsive, Safe Areas, texte, scroll et clavier

360/402/440, centrage zone sûre ; texte agrandi lisible sans recouvrement ; aucun défilement normal.

### 11. États de l’écran

Initialisation en cours ; prête ; échec d’initialisation pris en charge par état d’erreur technique, pas un écran vide infini.

### 12. Contrôles et interactions

Aucune action sur logo/texte ; transition automatique quand l’initialisation est prête.

### 13. Gestes

Aucun geste métier ni swipe de navigation.

### 14. Validation

Ne pas ouvrir les Catalogues avant disponibilité du stockage requis ; ne pas retarder artificiellement pour reproduire une durée Figma.

### 15. Brouillon et persistance

Aucun brouillon ni préférence persistée par Splash ; migrations/chargement relèvent du démarrage technique.

### 16. Navigation et conservation d’état

Ne pas empiler Splash dans le retour utilisateur ; la reprise courante conserve le contexte si aucune initialisation n’est requise.

### 17. Erreurs et cas limites

Échec stockage/migration : signaler échec selon architecture, sans effacer les données. Présentation graphique d’erreur sans frame : preuve manquante V-06.

### 18. Accessibilité

Nom de l’application annoncé une fois ; éviter annonces répétées pendant chargement ; logo avec texte alternatif utile, signature non dupliquée.

### 19. Invariants

Une seule référence Splash active ; aucune création de compte ; aucun timeout de maquette transformé en règle métier.

### 20. Recette déterministe

Démarrage prêt/lent/échec ; proportions et centrage aux trois largeurs ; pas de navigation avant prêt, pas de Splash au retour Catalogue ; erreur ne détruit pas stockage.

### 21. Traçabilité

D-218 ; chapitre 06 Splash et 12 démarrage ;1992:469 ; CE-T03-17.

---

## CE-UI-07 — Profil — préférences et défauts d’exécution

### 1. Identification

Profil principal 1992:375/474/579/684 et 2139:86 ; modification identité CE-UI-01.2139:86 est un doublon visuel, pas un parcours autonome.

### 2. Finalité fonctionnelle

Consulter identité et modifier les préférences globales et valeurs proposées aux nouveaux objets.

### 3. Contexte d’entrée

Destination Profil ou retour de Modifier le profil.

### 4. Contexte de sortie / destinations

Modifier → CE-UI-01 ; navigation basse vers les trois autres destinations ; un réglage reste sur Profil.

### 5. Données affichées et source de vérité

Préférences locales : Sons, Annonces vocales, Vibration, Notifications ; groupe Exercice : Pause entre les côtés, Compte à rebours d’exercice, Fin d’exercice ; groupe Séance : Récupération après exercice, Compte à rebours initial, Fin de séance.

### 6. Classification des valeurs Figma

Labels statiques ; valeurs locales dynamiques. Défauts actés : côté 10 s, récupération après exercice 30 s, comptes à rebours 10 s, fins 5 s, Vibration activée. L’état vibration désactivée est un exemple utilisateur.

### 7. Structure de l’écran

Identité/Modifier, groupes Exercice et Séance de réglages, commandes son/vocal/vibration/notifications, navigation basse.

### 8. Éléments obligatoires

Six défauts distincts ; aucune Pause inter-Séries globale ajoutée. La pause inter-Séries 5 s appartient à l’initialisation de l’éditeur. Silhouette ne se modifie que dans CE-UI-01.

Libellé unique Pause entre les côtés ; défaut10s ; pas des pauses validé D-252. Les captures anciennes de Profil portant un ancien libellé sont historiques sur ce texte.

### 9. Layout déterministe

Groupes selonDSF T5/T6 : fond#FCFCFE, liseré blanc 1, rayon 12, ombre sans rognage. Durées par steppers Profil, pas par roulette d’Exercice ; libellés complets accessibles.

### 10. Responsive, Safe Areas, texte, scroll et clavier

Zone centrale scrollable, navigation fixe ; texte long/agrandi fait croître lignes/groupes ; unités et actions restent visibles dans Safe Areas.

### 11. États de l’écran

Préférences chargées ; steppers actifs/borne ; vibration on/off ; notifications autorisées/refusées ; enregistrement/erreur.

### 12. Contrôles et interactions

Chaque modification de préférence s’enregistre immédiatement. Les valeurs servent aux nouveaux objets seulement ; aucune rétroaction sur brouillons déjà initialisés, Séances ou Exécutions existantes. Permission système demandée lors de première activation d’un rappel en Planification.

### 13. Gestes

Tap bascule ; stepper incrément immédiat, maintien 450 ms puis pas 150 ms, arrêt au relâchement ; action/animation D-237.

### 14. Validation

Valeurs non négatives ; pauses côté/récupération 0..300 s, progression1s jusqu’à5s, puis5s jusqu’à120s, puis30s jusqu’à300s. Respecter les bornes des réglages propres déjà définies ; pas de maximum déduit d’un exemple. Les bornes partagées sont consolidées au §6 R-02.

### 15. Brouillon et persistance

Persistance immédiate de préférence, atomique par modification ; pas de bouton Enregistrer global. Identité/photo/silhouette gardent leur brouillon séparé dans CE-UI-01.

### 16. Navigation et conservation d’état

Navigation ne perd pas une préférence confirmée ; relance relit les valeurs. Création ultérieure copie les valeurs ; objets antérieurs inchangés.

### 17. Erreurs et cas limites

Échec écriture : indiquer erreur et restituer valeur confirmée ; permission refusée ne s’affiche pas active. Profil sans silhouette valide, affichage homme par défaut.

### 18. Accessibilité

Nom et état on/off annoncés ; steppers annoncent unité et borne ; cibles distinctes ; haptique de roulette indépendant de Vibration fonctionnelle.

### 19. Invariants

Pas de compte distant, pas de langue MVP, aucune rétroactivité ; Notifications non autorisées par défaut ; Vibration ne désactive pas l’haptique des roulettes.

### 20. Recette déterministe

Changer chacun des six défauts, créer un nouvel objet puis comparer ancien objet inchangé ; relancer ; erreur écriture ; vibration off et haptique roulette maintenu ; notification refusée ; Modifier puis Annuler sans changement identité.

### 21. Traçabilité

D-191/D-208/D-213/D-232 ; chapitre 06 Profil ; DSF T5/T6 ; CE-UI-01 et CE-UI-05 ; frames§1.

---

## CE-EXEC-SESSION-01 — Exécution d’une Séance — phases, commandes et confirmations

### 1. Identification

Famille SESSION :1992:8132/8530/8626 ; dialogues 1992:8224/8326/8428 ; médias CE-MEDIA-EXEC-01/02. ACTIVITY reste CE-T03-09..13.

### 2. Finalité fonctionnelle

Exécuter l’instantané de Séance avec Circuit répété en Tours, Exercices avant/après, phases propres, récupérations et points d’arrêt.

### 3. Contexte d’entrée

Démarrer depuis Catalogue ou occurrence Calendrier SESSION valide ; écran initial puis action Démarrer lance le plan, sans double lancement.

### 4. Contexte de sortie / destinations

Plan achevé → CE-UI-08 ; arrêt depuis Pause confirmé → CE-UI-08 Interrompue ; interruption technique sans Synthèse possible → historique conservé. Ne pas permettre un retour qui abandonne silencieusement le moteur.

### 5. Données affichées et source de vérité

Instantané Session au démarrage, occurrences développées, Série/côté/Tour courants, paramètres propres et booléen global D-214, résultats et temps moteur ; aucune lecture réactive de la source modifiée.

Plan depuis les cibles/Pauses de chaque Série et l’Ordre des côtés de l’instantané ; R>0 remplace PN uniquement en fin d’occurrence.

### 6. Classification des valeurs Figma

Noms/durées/compteurs calculés ; valeurs Figma démonstratives. Circuit=groupe, Tour=répétition ; Cycle technique 1 jamais affiché.

### 7. Structure de l’écran

Shell Execution ; nom Exercice puis contexte nom Séance + Catégorie, côté distinct ; chrono/Série/Tour/progression ; commandes ; état média conditionnel.

### 8. Éléments obligatoires

Phase courante identifiable, temps et progression, commandes Réinitialiser/Pause/Suivant/sons/vocal ; Tour seulement dans contexte de Circuit ; aucune interface de bilatéralité Circuit.

Série n/N et côté séparés ; aucune barre par Série. À suivre : Pause / Pause entre les côtés / Récupération selon la phase.

### 9. Layout déterministe

Rendu du shell courant et D-197/D-220 ; Série/Tour 24 selonDSF T10 ; écart vertical 24 entre temps total et progression Tours ; dialogues centrés D-228, jamais nouvelles pages numérotées.

### 10. Responsive, Safe Areas, texte, scroll et clavier

Commandes visibles à texte standard ; à texte agrandi scroll accessible sans masquer temps/action ; Safe Areas ; plein écran média suit son contrat et orientation.

### 11. États de l’écran

Initial ; compte à rebours initial ; phases propres activées/ignorées ; Série ; pause inter-Séries ; côté ; récupération ; point d’arrêt ; pause utilisateur ; confirmations ; Fin de séance ; terminé/partiel/interrompu.

### 12. Contrôles et interactions

Démarrer construit le plan ; ordre canonique§4.12. Pause suspend temps actif ; Reprendre relance ; Arrêter seulement depuis Pause avec confirmation. Réinitialiser/Suivant suivent table§4.12, résultat partiel si saut chronométré anticipé. Point d’arrêt attend reprise explicite ; média ne suspend pas moteur.

### 13. Gestes

Tap commandes ; confirmation explicite avant action destructive ; gestes média uniquement dans sa zone ; aucun retour vers Exercice précédent au MVP.

### 14. Validation

Séance contenant≥1Exercice valide ; pas de double démarrage. Points aux positions D-217 seulement. Phases 0 s instantanées. Progression hybride selon la formule §6 R-01, calculée sur toutes les étapes contributives du plan.

### 15. Brouillon et persistance

Instantané immuable ; résultats/temps checkpointés selon architecture ; Ressenti/Commentaire finalisés après clôture dans CE-UI-08. Réinitialiser conserve temps total déjà exécuté et résultats hors cible.

### 16. Navigation et conservation d’état

Reprise technique restaure phase/Série/côté/Tour sans relire source ni dupliquer résultat. Retour normal après Synthèse vers Suivi ; contexte occurrence reste associé à l’Exécution.

### 17. Erreurs et cas limites

Source supprimée après départ sans effet sur instantané ; interruption technique conserve résultats ; attente de point hors durée ; reprise après arrière-plan par horodatage. Gardes 30 min/2h selon modèle, sans réponse, rester suspendu sans arrêt automatique (§6 R-03).

### 18. Accessibilité

Annoncer phase, nom et côté au démarrage/changement ; commandes nommées selon phase, notamment Réinitialiser la récupération. Focus dans dialogue puis retour ; indicateurs non fondés uniquement sur couleur.

### 19. Invariants

Circuit unilatéral, Tours 1..99 ; récupération après chaque occurrence y compris dernière et chaque Tour ; point interne répété chaque Tour ; attente hors durée ; pas de mutation de la source ; média indépendant du moteur.

### 20. Recette déterministe

Séance avec avant/dans/après Circuit, Tours 1/2, unilatéral/bilatéral, trois modes ; D-214on/off ; toutes phases 0/>0 ; dernière récupération avant Fin ; points frontières/intérieur ; pause/reset/saut/arrêt confirmés/annulés ; source modifiée pendant run ; reprise ; médias ; vérifier poids §6 R-01 et transitions §6 R-03 ; aucun résultat de test applicatif n’est revendiqué ici.

Ordres D→G/G→D, A–F, N1, R0/positif et dernière occurrence/chaque Tour ; jamais cumul PN+R ni récupération ajoutée deux fois.

### 21. Traçabilité

Réexport courant1992:8132 du03/10 : Série et côté séparés. Références dédiées de récupération terminale/paire de côtés absentes de Prototype MVP actuel ; recette prescrite, preuve visuelle partielle.

D-133/D-149/D-150/D-191/D-197/D-208–220 ; chapitres 04/08/09/10/11/12 ; CE-UI-08 ; frames§1. Spécification de la famille T04, sans lancement d’une implémentation dans cette livraison.

---

## CE-UI-08 — Synthèse de Séance

### 1. Identification

SESSION terminée 1992:8718/8780, partielle 4760:6448/6500 ; ACTIVITY distinct CE-T03-14.

### 2. Finalité fonctionnelle

Afficher bilan de Séance et finaliser Ressenti/Commentaire avant Suivi.

### 3. Contexte d’entrée

Fin normale du plan SESSION ou arrêt volontaire confirmé ; pas obligatoire à afficher si interruption technique l’empêche.

### 4. Contexte de sortie / destinations

Enregistrer réussi → Suivi ; erreur reste sur Synthèse. Aucun Relancer ni sortie normale sans Ressenti.

### 5. Données affichées et source de vérité

Instantané de Séance, statut, durée réelle et résultats atteints ; nombre exécuté inclut les partiels, nombre terminé les exclut. Ne pas étiqueter le premier comme Exercices terminés. Partiels affichés séparément si>0 ; aucun double comptage Série/côté.

### 6. Classification des valeurs Figma

Nom/date/nombres dynamiques ; labels Enregistrer/Commentaire statiques ;12/12 et 10/12 des maquettes sont démonstratifs.

### 7. Structure de l’écran

Nom/statut → durée et bilan → question de Ressenti et trois choix → Commentaire → Enregistrer.

### 8. Éléments obligatoires

Ressenti obligatoire, Commentaire facultatif≤200, Enregistrer désactivé sans Ressenti ; pas de Tours/Cycles ni détail des Exercices sur cet écran.

### 9. Layout déterministe

Shell Summary ; trois choix Ressenti égaux, séparations 16 ; question selon type.cardTitle ; noms et chiffres depuis données ; Enregistrer est le CTA des captures courantes.

### 10. Responsive, Safe Areas, texte, scroll et clavier

Texte agrandi peut revenir à la ligne ; clavier n’occulte ni saisie ni CTA ; scroll utile, pas de rognage du bilan.

### 11. États de l’écran

Terminée/Partielle/Interrompue ; aucun/un Ressenti ; commentaire vide/renseigné/invalide ; sauvegarde/erreur.

### 12. Contrôles et interactions

Tap Ressenti change choix unique ; Commentaire modifie brouillon de finalisation ; Enregistrer une fois, pas de réexécution du plan.

### 13. Gestes

Tap/saisie/scroll uniquement ; D-237 sur choix/actions ; aucun swipe qui quitte la Synthèse.

### 14. Validation

Ressenti obligatoire même Interrompue si écran présenté ; commentaire≤200 caractères ; dépassement signalé sans enregistrement ni troncature silencieuse.

### 15. Brouillon et persistance

Instantané/résultats figés ; finalisation Ressenti/Commentaire atomique et idempotente. Échec conserve brouillon, ne crée pas une seconde Exécution.

### 16. Navigation et conservation d’état

Après Enregistrer, Suivi montre l’Exécution ; pas de retour au Catalogue imposé pour SESSION. L’occurrence Calendrier liée est marquée exécutée le cas échéant.

### 17. Erreurs et cas limites

Interruption technique sans présentation autorise Ressenti absent ; données source supprimées restituées depuis instantané ; erreur sauvegarde garde écran/choix/commentaire.

### 18. Accessibilité

Labels des trois Ressentis et état sélectionné ; obligatoire/facultatif annoncé ; statut non uniquement coloré ; focus/erreur champ ; réduction des animations.

### 19. Invariants

Exécuté≠terminé ; un Exercice partiel compte exécuté, jamais atteint ne compte pas ; pas de compteur de Séries interprété comme nombre d’Exercices ; aucun Cycle/Tour.

### 20. Recette déterministe

Trois statuts,0/1/N partiels, distinction exécutés/terminés, trois Ressentis, commentaire 0/200/201, erreur/reprise/double tap, source supprimée ; navigation Suivi ; pas de Relancer ni sortie sans Ressenti.

### 21. Traçabilité

Chapitre 06 Synthèse ; RM-074 et modèle résultats 09 ;1992:8718/8780,4760:6448/6500 ; CE-EXEC-SESSION-01 et CE-T03-14.

---

## CE-UI-09 — Référentiels d’Exercice — Catégorie et Zones corporelles

### 1. Identification

Catégorie 4332:7095, création 4474:7157 ; Zones 4478:7209, création 4683:6336 ; suppressions 4861:6259/6348. Étiquettes de Séance :CE-T03-16.

### 2. Finalité fonctionnelle

Renseigner les classifications d’un Exercice et administrer leurs valeurs sans changer son exécution.

### 3. Contexte d’entrée

Accès Catégorie ou Zones depuis éditeur persistant/local, avec brouillon conservé.

### 4. Contexte de sortie / destinations

Catégorie choisie au toucher → éditeur ; Zones sélection multiple puis validation de la modale → éditeur ; fermer sans validation restaure sélection antérieure. Création/suppression restent dans la famille de sélection.

### 5. Données affichées et source de vérité

Référentiels utilisateur et IDs du brouillon. Catégorie unique avec couleur ; Zones multiples sans couleur. Affectations retirées existantes conservables avec nom/dernière couleur.

### 6. Classification des valeurs Figma

Noms et couleurs dynamiques ; dix zones initiales sont un jeu de départ, pas une liste fermée. Labels Catégorie/Zones/Nouvelle… statiques.

### 7. Structure de l’écran

Modale de choix, création inline avec clavier, palette seulement Catégorie, dialogue destructif centré sur appui long.

### 8. Éléments obligatoires

Catégorie 1 et Zones≥1 pour nouvel Exercice ; nouvelle valeur nommée ; annuler et confirmer les sélections multiples ; aucun CTA supplémentaire en choix simple D-222.

### 9. Layout déterministe

Modales D-228 ; pastille Catégorie colorée et nom ; Zones icône silhouette depuis Profil ; palette de 4474:7157. Les Zones n’ont pas de palette.

### 10. Responsive, Safe Areas, texte, scroll et clavier

Liste scrollable, clavier et actions visibles ; nom long accessible ; textes agrandis sans réduction ; focus confiné à la modale ouverte.

### 11. États de l’écran

Liste vide/initiale/enrichie ; aucune/une Catégorie ; zéro/N Zones ; création/nom invalide ; valeur retirée déjà affectée ; confirmation/erreur.

### 12. Contrôles et interactions

Catégorie tap valide/ferme ; Zones tap toggle puis confirmer. Appui long ouvre suppression sans sélectionner. Créer/renommer conserve identité de référence ; changer couleur Catégorie se propage aux objets courants, pas aux instantanés.

### 13. Gestes

Tap, scroll, saisie et appui long option ; aucun drag des référentiels ; appui destructif jamais déclenché par simple sélection.

### 14. Validation

Nom non vide et unique dans son référentiel ; Catégorie exactement 1, Zones≥1 pour nouvel objet. Une valeur retirée ne peut recevoir de nouvelle affectation ; l’ancienne affectation n’exige pas un remplacement forcé.

### 15. Brouillon et persistance

Affectations dans brouillon Exercice, persistées à Terminer ; opérations de référentiel explicitement confirmées sont distinctes. Erreur de création/suppression ne sauvegarde pas l’Exercice.

### 16. Navigation et conservation d’état

Fermer restitue éditeur/brouillon ; Annuler suppression restitue sélection intacte ; confirmer retire des futurs choix mais conserve affectations existantes et historique.

### 17. Erreurs et cas limites

Nom vide/dupliqué, valeur retirée entre lecture et choix, échec écriture : message et brouillon conservé. Ne jamais recréer automatiquement une valeur initiale supprimée.

### 18. Accessibilité

Nom/état sélectionné annoncés ; couleur accompagnée du nom ; labels accessibles des actions ; focus dialogue puis liste ; toutes Zones sélectionnées lisibles.

### 19. Invariants

Classification sans effet sur moteur ; Catégorie colore les objets courants référents ; Zone sans couleur ; conservation D-210 ; silhouette sans effet de filtre.

### 20. Recette déterministe

Catégorie choix/annulation/création/couleur ; Zones 0/1/N ; noms vide/dupliqué ; supprimer initiale/personnelle utilisée/inutilisée ; sauvegarder ancienne affectation retirée ; interdire nouvelle ; renommer sans changer ID ; historique inchangé.

### 21. Traçabilité

Les6frames de référentiels ont été réexportées et contrôlées le03/10 : rendu identique aux PNG publiés. ✓ sur Catégorie reste un écart à D-222 ; validation simple au toucher conservée. Les paramètres variables du parent sont conservés durant ces opérations.

D-199/D-200/D-210–212/D-222/D-238 ; CE-T03-04 ; frames§1. Renommage sans frame dédiée : comportement requis, rendu non prouvé.

---

## CE-UI-10 — Paramètres d’exécution — feuille basse

### 1. Identification

Une feuille depuis CE-T03-04 :21états courants recensés le03/10. Uniformes6407:9551/9805/9966/10127/10481,6411:9546/9649,6419:9847/10028,6423:9953 ; variables6665:24616/24844/25072/25277/26185/26575/26822/27008/27232/27458/27608. Captures centralisées au chapitre06.

### 2. Finalité fonctionnelle

Éditer les paramètres uniformes ou variables et l’ordre des côtés, selon v12. Calculs/comportements issus des spécifications ; Figma fournit seulement le layout.

### 3. Contexte d’entrée

Copie des paramètres du brouillon parent ; carte vide : N1, Pause0s, mode/durée/côté— ; Répétitions uniforme défaut1, CR10s/Fin5s depuis Profil. Aucune valeur exemple injectée. Séries variables désactivées initialement.

### 4. Contexte de sortie / destinations

✕ et retour système annulent toute l’ouverture ; ✓ applique atomiquement au parent puis ferme et régénère le résumé. Terminer seul sauvegarde l’Exercice. La feuille ne modifie ni nom ni référentiels.

### 5. Données affichées et source de vérité

Mode commun, N, état variable explicite, cible/Pause communes ou tableau ordonné, direction, ordre des côtés, PC, CR et Fin. Total dérivé intrinsèque. R contextuelle absente de cette feuille. Valeurs alternatives cachées seulement dans le brouillon.

### 6. Classification des valeurs Figma

Libellés normatifs v12 ; chiffres, titres de frames et câblages Figma = démonstration. Incomplet— ; Répétitions Durée totale≥ ; À l’échec pas de total. La photo et le résumé derrière le voile ne commandent pas le brouillon.

### 7. Structure de l’écran

En-tête fixe ✕/titre/✓ ; corps défilant : Mode → Séries → Séries variables → cible/Pause uniformes ou tableau → Changement de côté → Ordre des côtés et Pause entre les côtés si bilatéral → Total applicable → CR → Fin.

### 8. Éléments obligatoires

Interrupteur sous Séries ; tableau rattaché, ligne numérotée à droite sans symbole, poignée, cible et Pause ; en À l’échec texte fixe et seul stepper Pause. Chevron replie sans désactiver. Steppers permanents, pas de modale supplémentaire. N1 : interrupteur désactivé grisé, Ordre grisé. Total reste dans le corps replié.

### 9. Layout déterministe

402px de référence ; feuille blanche, coins hauts24 et voile28% selon DSF existant. Groupe tableau x24 largeur354, fond gris clair et contour ; ligne variable x36 largeur334 ; deux steppers128px (cible/Pause), numéro et poignée à gauche. Ordre : segmenté330×60, deux options sur deux lignes, titre centré et notation en flèches. Géométrie détaillée/captures DSF du02/10, sans transformer dimensions en règles métier.

### 10. Responsive, Safe Areas, texte, scroll et clavier

Corps entier défilant sous en-tête fixe, Safe Areas et texte agrandi.6665:25277 montre le haut et les12lignes ; total/CR/Fin sous le viewport : accessibles par scroll, pas de second scroll dans le tableau. La position basse n’a plus de frame dédiée dans Prototype MVP et reste à qualifier visuellement. Le total reste dans le flux lorsque le tableau est replié.

### 11. États de l’écran

Uniforme, variable activé par copie, Durée/Répétitions/À l’échec, 12lignes avec défilement requis, chacun des deux ordres, variable+bilatéral, N1, changement de mode incomplet, erreur de validation, repli du tableau, ligne déplacée, message de total ajusté en Durée uniforme.

### 12. Contrôles et interactions

Activation copie les paramètres communs ; désactivation sans confirmation/message reprend la première ligne courante ; réactivation avant✓ restaure. N augmente : restaurer retirées puis copier dernière ; réduit : conserver provisoirement les lignes retirées. Changer mode conserve Pauses et met cibles incompatibles—, retour restaure anciennes cibles. Déplacement cible+Pause solidaire ; nouvelle dernière porte PN.

### 13. Gestes

Tap, steppers, roulette uniforme, glissement via poignée et scroll ; D-237 pour maintien et animations. Repli via chevron = présentation seulement. Retour système annule. Aucune fermeture destructive implicite par swipe de feuille. Ne pas appliquer le déplacement à une valeur isolée.

### 14. Validation

N1..99, répétitions1..100, durée1..5999s, pauses0..300s. Pas durée1s/répétitions1 ; pauses0,1,2,3,4,5,10…120,150…300. ✓ inactif si mode/cible active manquante ; signaler cellule et Série en ligne. Zéro valide pour Pause. Variable : aucune inversion du Total.

### 15. Brouillon et persistance

Brouillon transactionnel v12§3. N1 effectif uniforme/par côté dès calcul, ancien état mémorisé pour retour≥2. À✓ supprimer alternatives cachées et lignes retirées ; aucun état persistant1série variable. Pas d’arrondi des données existantes à la lecture. Copie/duplication incluent tableau et ordre.

### 16. Navigation et conservation d’état

Réouverture depuis parent validé ; raccourcis conservés pour champs compatibles. Cible uniforme Durée/Total uniforme ouvre roulette ; valeurs détaillées variables utilisent steppers dans la feuille. Focus restitué à fermeture ; aucun changement de route parent.

### 17. Erreurs et cas limites

— distinct de0 ; tableau replié ne masque pas une invalidité à la validation. À l’échec n’a jamais de cible numérique/total. Total— tant que cibles actives incomplètes. Annulation restaure aussi ordre et déplacements ; N1 n’efface pas le brouillon avant✓.

### 18. Accessibilité

Nommer interrupteur/état, chevron développé/replié, Série et unité de chaque stepper, commandes de déplacement et erreurs. Focus dans feuille, parent inaccessible ; texte non tronqué à agrandissement. Total annoncé lecture seule et estimation si≥ ; options grisées non activables.

### 19. Invariants

Un mode par Exercice, N par côté, mêmes paramètres des deux côtés, aucune surcharge commune en variable ; total intrinsèque sans R/CR/Fin. Calculs v12 indépendants de Figma. Aucun nouveau design ni mécanisme d’import.

### 20. Recette déterministe

Scénarios A–F et N1 v12§9 ; 1/99séries, 1/100répétitions,1/5999s ; pauses4→5→10 et120→150 en aller/retour ; activation/désactivation/réactivation ; changement de mode aller/retour ; déplacement puis réduction/restauration ; N1→N≥2 avant✓ et après✓ ; erreur repliée ; duplication/réouverture ; scroll et texte agrandi.

### 21. Traçabilité

D-247 à D-255 ; v12 ; DSF actualisé03/10 ; ETAT-DES-LIEUX-CREATION-EXERCICE-2026-10-03. Les références courantes sont dans Prototype MVP, pas des copies de travail. Les états sans frame dédiée sont listés séparément ; aucune recette interactive ni propagation aux composants maîtres n’est présumée.

## 5. État des preuves visuelles

| ID | Écart ou limite | Contrat / traitement |
|---|---|---|
| V-01 | Dialogue2234:189 restauré et capture actualisée le01/10 | Preuve visuelle disponible ; boutons non câblés, recette interactive non acquise |
| V-02 |Activité, Parcours/Tour mal employés dans plusieurs PNG | Contrats cible Exercice/Circuit/Tour ; corriger Figma sans renommer les IDs techniques |
| V-03 | Anciennes variantes de phrase éditable remplacées par D-246 | Les nouveaux états et limites de la feuille sont documentés dans CE-UI-10 ; anciennes captures historiques |
| V-04 |Contrôle global D-214 sans emplacement graphique complet | CE-T03-08 ; règle fonctionnelle complète, preuve graphique à fournir |
| V-05 |Chevauchement de créneaux Jour sans géométrie de référence | CE-UI-02 ; conserver lisibilité/accès, rendu à qualifier |
| V-06 |Erreur d’initialisation Splash sans frame | CE-UI-06 ; aucune destruction de données ou blocage silencieux, rendu à qualifier |
| V-07 |Direct/media montre Tour ;17 px/24 px divergent ; état Démarré parfois incohérent | CE-T03-09..13/MEDIA ; Tour absentACTIVITY,24 px cibleDSF T10 |
| V-08 |Étiquette 4861:6145 mentionne Exercices au lieu de Séances ; renommages sans preuve dédiée | CE-T03-16/CE-UI-09 ; textes et comportement explicités, pas de preuve inventée |
| V-09 |Récurrence 2 semaines avec récapitulatif hebdomadaire ; filtre dit inactif avec critère appliqué | CE-UI-05/CE-T03-02 ; récapitulatif et état dérivés des données |
| V-10 |Récupération visible dans certaines cartes Composition ; média déployé 4738:6355 ; Photo non propagée | Écarts d’assemblage déjà acceptés ; appliquer cible D-238, ne pas retoucher les PNG ni rouvrir RG-3 |
| V-11 |Compte à rebours Composition inline 2028:11375 mais description roulette ; pas Fin 5 s contre prescription 1 s | CE-T03-08 ; aucun état de picker déclaré vérifié tant que la description 06 et sa preuve ne sont pas réconciliées |
| V-12 |Archives Exercice sans écran complet ; Photo à200% non qualifiée ; animations non câblées ; contrastes acceptés | Limites déjà documentées du DSF, pas de nouvelle décision produit |

Les captures courantes sont centralisées au chapitre06 ; l’état des lieux du03/10 distingue42références du parcours, leurs contrats et les copies historiques remplacées. La matrice donne l’inventaire, dont les références hors prototype qui ne deviennent pas des écrans MVP. Les matrices ci-jointes donnent les rattachements ; la présence de chaque capture a été vérifiée lors de l’audit, pas son fonctionnement interactif.

## 6. Clôture des réserves fonctionnelles des contrats

Les arbitrages des 30 septembre et 1er octobre 2026 ferment les points fonctionnels ci-dessous. Ils ne valent ni recette de l’application ni validation de preuves Figma absentes. Aucun shell, composant, placement ou parcours n’est redessiné.

### R-01 — Progression et estimation

Le calcul porte sur les étapes du plan développé, sans modifier la piste segmentée existante. Soit M le nombre d’étapes contributives (Séries non chronométrées et phases chronométrées de durée strictement positive), R le nombre de Séries non chronométrées et T la somme des durées chronométrées. Chaque Série non chronométrée pèse 1/M ; chaque phase chronométrée de durée d pèse (1−R/M)×d/T. Avec R=0, les poids sont d/T ; sans phase chronométrée, chaque Série pèse 1/M. Les phases à 0 s, pauses manuelles et attentes aux points d’arrêt n’ont pas de poids. Une Série non chronométrée acquiert sa part à validation ; une phase chronométrée la remplit progressivement. Un passage anticipé confirmé franchit les étapes effectivement sautées sans leur attribuer de temps réalisé. Le moteur ne publie 100 % qu’à la finalisation du plan (SESSION_END compris pour une Séance) ; une étape finale instantanée est finalisée avant de publier 100 %. Les poids sont figés au démarrage. Un reset remet à zéro les parts de son périmètre, en préservant les parts antérieures hors de ce périmètre.

La convention 2 s/répétition reste celle de la phrase intrinsèque de l’éditeur (04 §2 et D-232). Elle n’est pas une durée cible du moteur. Les métriques globales régies par D-112/D-131 continuent de sommer les durées connues et d’afficher ≥ en présence d’effort non chronométré. Cette séparation de périmètres ne crée pas une nouvelle estimation globale.

### R-02 — Validation des contrôles existants

- Planifier : fréquence entière de 1 à 12 semaines incluses ; − inactif à 1 et + inactif à 12 ; toute valeur extérieure est refusée à l’enregistrement.
- Rappel Autre : délai strictement positif, maximum 24 h (1 440 minutes), avec les unités et le sélecteur existants. Aucun désactive le rappel ; zéro ne crée pas une deuxième manière de désactiver le champ. Une notification dont l’échéance est déjà passée n’est pas envoyée rétroactivement ; les futures occurrences conservent leur rappel.
- Durée totale : conserver le sélecteur minutes/secondes. La borne dérivée est T(1)..T(99) pour les paramètres courants, et non 99 min 59 s (borne par Série). La colonne minutes doit représenter T(99), sans nouvelle colonne ni nouveau contrôle. Granularité seconde ; le calcul inverse existant choisit N dans 1..99, arrondi .5 vers le haut, puis affiche T(N) et le message d’ajustement si nécessaire. En Durée uniforme, une diminution à N=1 ne masque le total du résumé que s’il égale effectivement la cible ; la ligne Total reste présente dans la feuille en Durée/Répétitions (D-246).
- Profil : les paramètres identiques héritent des mêmes bornes que leur champ cible, sans maximum tiré des valeurs d’exemple. Compte à rebours initial/Fin de séance : 0..3599 s (D-089) ; pauses et récupération : 0..300 s ; le contrôle et ses pas restent ceux du DSF et de D-232. Les valeurs initiales déjà validées ne changent pas.

### R-03 — Transition, reset et suspension

L’ordre d’exécution vient du paramètre Ordre des côtés : Un côté après l’autre (défaut) ou Les deux côtés à chaque série. En bilatéral N est toujours par côté, paramètres communs aux deux côtés. Les successions et pauses sont celles de v12 §4 ; aucun repli de PC vers la Pause. Les cibles et Pauses variables proviennent de la ligne courante.

Durée intrinsèque : unilatéral Σ(Ti+Pi) ; Un côté après l’autre 2×Σ(Ti+Pi)+PC ; Les deux côtés à chaque série (N≥2) 2×ΣTi+ΣPi+N×PC. Répétitions : Ti=2×Ri s pour l’estimation ≥ seulement ; À l’échec : aucun total d’Exercice. Occurrence : T si R=0, T−PN+R si R>0. Compte à rebours propre/Fin propre exclus de ce total. Calcul inverse réservé à Durée uniforme, suivant v12 §5 ; variable : lecture seule et — si incomplet.

La source active est v12 §§3–5 ; D-242 est supersédée. Les tests PRE-1 restent figés sur leur source historique.

Réinitialiser conserve D-029/D-150 : recommencer le côté courant depuis sa première Série, préserver les résultats de l’autre côté et le temps total écoulé. Cette portée s’applique aussi à Les deux côtés à chaque série ; un passage déjà acquis de l’autre côté n’est pas rejoué. Exemple : gauche2/3 → reprise gauche1/3, résultats droits conservés. Pendant une récupération, RM-062 réinitialise seulement cette phase. Le passage anticipé conserve D-150 : côté courant partiel, poursuite des passages restant à exécuter de l’autre côté ; les résultats acquis ne sont pas effacés. Ces conséquences du périmètre existant ne constituent pas un nouvel arbitrage.

Pause de sécurité : sans réponse au choix Reprendre/Arrêter, l’exécution reste suspendue, son état est conservé et son temps n’avance plus. Aucun délai d’arrêt automatique supplémentaire.

### R-04 — Suppression d’une occurrence périodique

Le comportement utilisateur est déjà fixé. L’exclusion d’une occurrence identifiée par Routine et date/heure d’origine doit être persistée, survivre à la relance et au recalcul, et retirer sa notification. Les autres occurrences et l’historique restent conservés. La mutation doit être atomique et idempotente ; en cas d’échec, l’interface ne simule pas un succès. Modèle et API doivent satisfaire ce contrat ; le choix de stockage relève du développement et ne requiert aucun nouvel écran ni arbitrage de design. La recette doit prouver relance, recalcul et notifications ; elle n’est pas réputée exécutée par cette clôture documentaire.

## 7. Référentiel élémentaire T03 et couverture

| ID | Contenu élémentaire |
|---|---|
| E01 | Catalogue multi-type `Exercices / Séances / Parcours` |
| E02 | Séances sélectionné par défaut/relaunch |
| E03 | Exercices actif T03 |
| E04 | Parcours visible disabled |
| E05 | Navigation basse `Catalogues` |
| E06 | Icônes navigation conformes DSF |
| E07 | Lister ActivityDefinition |
| E08 | Absence de recherche globale ou locale MVP (D-221) |
| E09 | Rangée Catalogue `Créer / Filtrer / Trier` commune ; Filtres contextuels statut/Catégories/Zones pour Exercices, statut/Étiquettes pour Séances ; Trier désactivé |
| E10 | Préserver filtres/tri/scroll pendant aller-retour |
| E11 | Ne pas conserver au relaunch |
| E12 | Ouvrir ActivityDefinition en consultation/modification |
| E13 | Créer ActivityDefinition depuis Catalogue |
| E14 | Modifier ActivityDefinition |
| E15 | Archiver ActivityDefinition |
| E16 | Restaurer ActivityDefinition |
| E17 | Supprimer définitivement depuis archives |
| E18 | Aucune cascade vers copies/historique |
| E19 | Créer contextuel Catalogue |
| E20 | Exercices → création directe ActivityDefinition |
| E21 | Séances → création directe Séance |
| E22 | Ajouter depuis Composition ouvre directement la sélection Catalogue |
| E23 | Création locale SessionActivity conservée techniquement, non exposée dans ce parcours |
| E24 | Pas Enregistrer dans Catalogue T03 |
| E25 | Multi-sélection ActivityDefinition |
| E26 | Validation disabled sélection vide |
| E27 | Compteur sélection |
| E28 | Ordre insertion = liste filtrée |
| E29 | Copie indépendante |
| E30 | Copier tout état métier applicable |
| E31 | Retour Composition enrichie |
| E32 | Bouton Lecture Activity |
| E33 | Déployer selon état média : retiré avec photo (RG-4) |
| E34 | Déployer même DSF que Séances |
| E35 | Zone droite réservée identique |
| E36 | Pas poignée Catalogue Activity |
| E37 | Execution origin ACTIVITY |
| E38 | Snapshot autonome immuable |
| E39 | Préparation fixe 5 s |
| E40 | Séries / pauses / côtés / SIDE_RECOVERY / phases propres |
| E41 | Réutiliser règles bilatérales existantes |
| E42 | Pas Session artificielle |
| E43 | Pas SESSION_END |
| E44 | Signal fin → Synthèse |
| E45 | Ressenti obligatoire |
| E46 | Commentaire facultatif |
| E47 | Suivi type Exercice |
| E48 | Stats compatibles sans compter Séance |
| E49 | Retour au contexte appelant ACTIVITY avec état restauré |
| E50 | Résumé des paramètres sans nom ; valeurs dynamiques, saisie exclusivement CE-UI-10 |
| E51 | Répétitions : phrase `Durée totale ≥ {estimation}` avec 2 s par répétition |
| E52 | À l’échec : aucune Durée totale dans le texte éditable |
| E53 | Pas texte direction développé cartes Composition |
| E54 | Feuille de paramètres bloque arrière-plan ; roulette déployée sous sa ligne |
| E55 | CTA visible normal mais fonctionnel/accessibilité disabled |
| E56 | Annuler la feuille restaure tout le brouillon parent |
| E57 | Valider la feuille applique les paramètres et régénère le résumé sans sauvegarde DB |
| E58 | Swipe gauche déplace carte |
| E59 | Actions révélées progressivement |
| E60 | Swipe droit ferme seulement carte ouverte |
| E61 | Autres contrôles restent actifs |
| E62 | Une seule carte expose actions |
| E63 | Dupliquer arrondi + gap fond Circuit |
| E64 | CR initial non déplaçable |
| E65 | Fin séance non déplaçable |
| E66 | Aucun long press/poignée cartes structurelles |
| E67 | Continuer de Composition → Catalogue séances ; Étiquette facultative en modale |
| E68 | Segment Séances sélectionné |
| E69 | Transition canonique droite→gauche |
| E70 | Migration sans promotion SessionActivity |
| E71 | Consultation galerie média MVP ; ajout/import non activés par D-203 |
| E72 | Parcours fonctionnels hors T03 |
| E73 | Valeurs Figma démo non codées en dur |

### Couverture des contenus élémentaires

| Plage | Contrats propriétaires |
|---|---|
| E01–E06 | CE-T03-01, CE-T03-17 |
| E07–E12 | CE-T03-02 |
| E13–E14 | CE-T03-04 |
| E15–E18 | CE-T03-05 |
| E19–E21 | CE-T03-03 |
| E22–E24 | CE-T03-06 |
| E25–E31 | CE-T03-07/08 |
| E32–E36 | CE-T03-02/09 |
| E37–E49 | CE-T03-09..15 |
| E50–E57 | CE-T03-04 |
| E58–E63 | CE-T03-02/05/08 |
| E64–E66 | CE-T03-08 |
| E67–E69 | CE-T03-01/16 |
| E70 | invariant non visuel 09 + contrats de persistance |
| E71 | CE-MEDIA-EXEC-01/02, CE-T03-04 |
| E72 | CE-T03-01/03 |
| E73 | règle commune §4.1 + tous contrats données |

Chaque contenu E01–E73 est rattaché ci-dessus ; E08 est rattaché à CE-T03-02/17 et §4.3. E70 n’a volontairement pas d’écran artificiel.


## 8. Frontière de réalisation et recette

T03 décrit l’Exécution ACTIVITY autonome : préparation 5 s, phases propres, Séries/pauses/côtés, Pause entre les côtés, Synthèse et Suivi. T04 porte l’orchestration SESSION : Circuit/Tours, phases structurelles, récupération post-occurrence, points d’arrêt et progression globale. Ajouter leurs contrats ne déclenche ni développement ni changement de tranche. Parcours autonome et recherche restent hors MVP.

Pour chaque contrat : tester nominal/alternatifs/négatifs, comparer le rendu 402 à la preuve lorsqu’elle existe, vérifier 360/402/440 et texte agrandi, accessibilité, données réelles, persistance/annulation, erreurs et absence d’activation hors périmètre. Consigner séparément conformité documentaire, conformité visuelle et recette interactive. Les règles §6 et preuves manquantes §5 ne sont jamais marquées CONFORME en exécution par la seule présence de 21 sections.
