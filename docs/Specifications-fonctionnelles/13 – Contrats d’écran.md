# 13 — Contrats d’écran

> Planification à plusieurs contenus (08/10) : les règles antérieures d’archivage supprimant les Routines associées restent décrites pour le cas à contenu unique. Leur extension à une Routine contenant d’autres contenus est **non définie** ; ne pas supprimer ces autres planifications par généralisation. Voir la chapitre 08, Planification.

> **Règle documentaire :** le chapitre 13 ne contient aucune copie d’écran. Les captures et copies physiques d’écrans/modales sont centralisées exclusivement dans le chapitre 06. Le chapitre 13 conserve uniquement les contrats, états, règles et références de nodes Figma nécessaires à la recette.

## 1. Objet et statut normatif

Ce chapitre constitue la **spécification des familles d’écran du MVP, avec séparation des périmètres T03 et T04**. Il transforme les décisions produit, règles métier, modèle de données, API fonctionnelles, architecture, Design System Figma et frames de référence en comportements directement exploitables par le développement et la recette.

Un écran T03 n’est considéré comme spécifié que si son contrat définit explicitement : contexte d’entrée, sorties, données et leurs sources, valeurs Figma, structure, éléments obligatoires, layout, responsive, états, contrôles, gestes, validation, brouillon/persistance, navigation/conservation d’état, erreurs, accessibilité, invariants, recette.

Les 40 contrats actifs couvrent les familles CE-T03, CE-MEDIA-EXEC, CE-UI, CE-EXEC-SESSION et CE-FMT. Les contrats suivent les 20 rubriques canoniques définies ci-dessous. CE-T03-16 est désormais le contrat des Étiquettes de Composition ; l’ancien parcours Catégories est retiré. Les règles de clôture §6 complètent les contrats sans modifier le design. Cette correction documentaire ne modifie pas les tranches de réalisation ni leurs autorisations.

## 2. Sources et ordre d’application

Pour les contrats actifs :

1. décisions validées dans le chapitre 07, avec priorité aux décisions explicitement supersédantes ; D-247 à D-255 et la section Paramètres et brouillon du chapitre 08 pour l’éditeur ;
2. modèle fonctionnel / modèle de données / règles métier ;
3. API fonctionnelles ;
4. architecture technique ;
5. chapitre 06 pour navigation/interaction et corrections UX T03 ;
6. présent chapitre 13 ;
7. Figma pour le rendu visuel et les états effectivement représentés.

Cet ordre n’établit aucune priorité automatique entre le chapitre 08, y compris sa section Paramètres et brouillon citée au rang 1, et le présent chapitre : une contradiction entre eux qui n’est pas résolue par une décision explicite reste `À CLARIFIER` (D-376).

Figma ne transforme jamais une valeur de démonstration en règle métier. Inversement, un comportement métier ne permet pas d’inventer un composant graphique absent de Figma. Tout détail visuel non représenté et non arbitré est `NON VÉRIFIABLE` ou `À CLARIFIER`.

### Portée transverse des paramètres v13

Catalogue et exécution ACTIVITY : durée intrinsèque. Composition, détails de Séance, calendrier SESSION et exécution SESSION : durée d’occurrence avec récupération explicite, sans ajouter R deux fois. Les cartes de composition affichent les volumes variables selon la chapitre 13, Cartes et grille des volumes ; le détail complet est accessible dans la grille de volumes du circuit, en lecture seule, et dans CE-UI-10 pour édition. Copie/duplication et instantané conservent l’état variable explicite, les cibles/Pauses ordonnées et l’Ordre des côtés. Ces règles s’appliquent aux contrats hôtes, y compris CE-UI-01/02/03/05 et CE-T03-01/06/07/08. Les règles propres aux cartes et médias sont conservées.

Réinitialiser conserve D-029/D-150 et RM-062 : recommencer la Série courante en unilatéral ; en bilatéral, recommencer le côté courant depuis sa première Série, préserver les résultats de l’autre côté et le temps total écoulé. Cette portée s’applique aussi à Les deux côtés à chaque série ; un passage déjà acquis de l’autre côté n’est pas rejoué. Exemple : gauche2/3 → reprise gauche1/3, résultats droits conservés. Pendant une récupération, RM-062 réinitialise seulement cette phase. Le saut confirmé d’un bloc chronométré conserve D-150 : côté courant partiel, poursuite des passages restant à exécuter de l’autre côté ; les résultats acquis ne sont pas effacés. Ces conséquences du périmètre existant ne constituent pas un nouvel arbitrage.

## 3. Structure canonique obligatoire

Chaque contrat comporte **exactement les 20 rubriques suivantes**, même lorsqu’une rubrique renvoie à une règle commune :

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

`Filtrer` et `Trier` sont communs à `Exercices / Séances`; leur représentation d’entrée est commune, leurs options peuvent être contextuelles. Le filtre inactif est un bouton rond blanc. Un appui l’étend en `Filtres / Aucun` sans modifier la liste. Après sélection d’un critère, le contrôle actif est bleu et étendu ; le rond bleu retire le filtre, tandis que la zone texte ouvre la modale. `Réinitialiser` revient à `Aucun`. `Créer` reste actif. `Trier` reste visible mais disabled en T03.

Pour T03 / `Exercices` :

- `Filtrer` propose les critères contextuels validés : statut (`Actives` / `Archivées`), Catégories et Zones corporelles ;
- `Trier` est visible mais disabled ;
- le tri réellement appliqué reste `updatedAt DESC` ;
- aucun menu de tri n’est ouvert ;
- aucune préférence de tri n’est persistée ;
- aucun critère non arbitré n’est inventé.

`Créer` est contextuel au Catalogue affiché : un tap ouvre directement la création de l’objet correspondant, sans écran ni arbre intermédiaire.

Les **contrôles d’entrée** et les panneaux ouverts de `Filtrer` sont conçus et vérifiables dans Figma. `Trier` reste visible mais désactivé dans le périmètre T03.

### 4.5 bis — Segmentés et titres courants (07/10/2026)

Catalogues et sélecteurs de type de contenu dans les modales « Choisir une séance / Choisir un exercice » : exactement **Exercices / Séances**, dans cet ordre, sans troisième segment Parcours/Circuits, sans espace réservé ni annonce accessible résiduelle. Le catalogue conserve Séances par défaut et les comportements existants de sélection. Cette suppression n’ajoute aucun sélecteur à une modale qui n’en présente pas : CE-T03-07 reste la sélection multiple d’Exercices de Composition, sans choix de Séance ni nouveau parcours de création.

À largeur de référence 354 : cadre 354×42, padding 4, gap 4, deux options 171×34 ; rayon extérieur 14, fond blanc `VariableID:2290:54` à 50 %, sans contour. Rayon des options 10 ; sélection indigo, texte blanc ; inactive #EAEAFF, texte sombre, sans contour. Largeurs flexibles : répartir la largeur utile, sans figer 171 sur tous appareils.

Libellés de tous les segmentés : `KODJO / Section title`, Inter Semi Bold 16/20, notamment Catalogue, Calendrier Jour/Semaine/Mois, Suivi, Mode, Mode d’exécution et Statut. Exceptions historiques de la feuille Paramètres, dont la présentation D-341 est remplacée par les DSF validés (D-377) : Changement de côté 13 px sur deux lignes ; Ordre des côtés 14 px + sous-titre 11 px. Les Calendriers et modes à trois choix gardent leurs trois options. La typographie ne modifie ni les libellés, ni les règles de sélection, ni l’état actif/désactivé propre à leur contexte.

Titres affichés : CE-T03-04 `Créer un exercice` / `Modifier un exercice` ; CE-T03-08 `Composer une séance` / `Modifier une séance`. `Créer une activité` reste inchangé. Les noms techniques de frames et annotations historiques peuvent différer : les IDs et chemins restent stables. Un libellé d’action `Ajouter` ne devient pas automatiquement `Créer` ; depuis Composition, `Ajouter un exercice` conserve la destination CE-T03-07. Aucun arbre de création retiré n’est réintroduit.

[DSF détaillé et écarts de propagation](../DSF-SEGMENTES-TITRES-2026-10-07.md) ; .

### 4.6 Roulettes de durée et steppers

Toutes les roulettes de **durée** actives utilisent la famille de modales basses du DSF. Les entiers simples `Nombre de Séries` et `Nombre de Tours` utilisent un **stepper inline** et n’ouvrent aucune roulette. La cible `Nombre de répétitions` utilise une roulette native à une colonne : « Aucune répétition, à l’échec » en tête, puis 1 à 100 (décision PRE-4 Q8 du 16/10, D-385). Les anciennes représentations contraires ne constituent plus une référence active.

Tous les voiles modaux utilisent exclusivement `overlayScrim` (`color/overlay/scrim`) = #1F2129 à 34 % : dialogues de décision, feuilles de sélection, roues, filtres, classification, catégorie, zones corporelles, calendrier ouvert, abandon/confirmation et CE-UI-10. Cette règle est commune à tous les contrats ci-dessous. L’exception de CE-UI-10 concerne uniquement la roulette inline, jamais la couleur ou l’opacité du voile. `compositionDraggedCardShadow` (`color/overlay-scrim`, #14171F) est réservé à l’ombre de la carte déplacée. Voir .

Hors CE-UI-10 (roulette déployée dans la feuille), roulette ouverte : **modale basse standardisée** avec scrim bloquant arrière-plan et scroll ; CTA principal fixe reste visuellement normal mais fonctionnellement et accessibilité-inactif ; `Annuler` restaure ; `Confirmer` applique puis recalcule. Les valeurs restent brouillon jusqu’à confirmation.

### 4.7 Swipe contextuel

Swipe gauche : la carte suit le doigt et révèle progressivement les actions derrière. Une seule carte peut exposer ses actions. Les autres contrôles restent actifs, mais un autre swipe gauche n’ouvre pas un second contexte. Tap fond = aucun effet. Tap surface de carte ouverte hors actions = aucun effet. Seul un swipe droit commencé sur la carte ouverte referme.

### 4.8 Cartes structurelles Composition

`Compte à rebours initial` et `Fin de séance` : jamais déplaçables, aucun appui long, aucune poignée de drag.

### 4.9 Transition canonique

Avancement vers l’écran suivant : cible entre depuis la droite, écran courant sort vers la gauche. Ne pas recréer localement une autre animation.

### 4.10 Référentiels — appui long et suppression

Les modales `Étiquettes`, `Catégorie` et `Zones corporelles` partagent le même contrat :

- appui court : Étiquette marquée au toucher (nouveau toucher : démarquée) puis confirmée par ✓ (D-355) ; Catégorie d’Exercice marquée au toucher puis confirmée par ✓ (D-343) ; choix multiple Zones sélectionné/désélectionné puis confirmé ;
- appui long : aucun changement de sélection ni désaffectation ; ouverture d’un `Overlay / Decision Dialog` proposant `Modifier` (renommer ; couleur pour Catégorie et Étiquette) et `Supprimer` (D-259), dans la fenêtre de la feuille, sans masquer le clavier déjà affiché (D-354) ;
- titre dynamique : `Supprimer « {nom} » ?` ;
- message dynamique : si la valeur est utilisée, préciser qu’elle disparaît des nouveaux choix mais reste attachée aux objets existants, avec son nom et sa dernière couleur ; l’historique reste inchangé ;
- actions : ✕ rond en haut à gauche, puis `Modifier` (bleu Kodjo) et `Supprimer` (rouge) sur une ligne, texte blanc (D-354) ; `Supprimer` demande la confirmation destructive ci-dessus ; `Modifier` ouvre la saisie du nom de l’entrée visée, même formulaire de création ouvert (dont le texte est conservé) (et la palette pour Catégorie/Étiquette) avec les composants existants ;
- toutes les valeurs sont concernées, y compris les valeurs initiales fournies par KODJO ;
- après `Supprimer`, revenir à la modale de sélection restée ouverte, avec la valeur supprimée absente ;
- une affectation existante reste sélectionnée et peut être conservée à l’enregistrement ; une nouvelle affectation à cette valeur retirée n’est plus permise ;
- aucune restauration automatique d’une valeur supprimée au démarrage ou par migration ; créer explicitement un nom correspondant à une valeur retirée la réactive (D-257).

La recette doit couvrir au minimum une Étiquette, une Catégorie et une Zone corporelle, chacune dans un cas utilisé et non utilisé.

Références Figma : `4861:6145` (Étiquette), `4861:6259` (Catégorie), `4861:6348` (Zone corporelle).

---

### 4.11 Cartes, médias de carte et appuis — référence courante

D-233–239 révisées par D-260 à D-264 et DSF-CARTES-ICONES-APPUIS-2026-09-30 gouvernent le rendu. Carte standard 354 sur 402, rayon 8, fond#F9FAFC/bord 0,5#CCD1E0, titre 15 Semi Bold, pastilles 20 et valeurs 16 ; marges adaptatives, aucune barre verticale hors Jour. Carte d’Exercice Catalogue/choix : gouttière permanente 64, photo recadrée centrée sans déformation ou icône de nature sans média/pendant chargement/erreur ; texte à x88 ; Catalogue replié/archivé : titre250, lignes basses207 ; Choix conserve sa coupe propre ; aucun Déployer. Aucune photo dans les listes mixtes, le Calendrier ou le Suivi ; texte alternatif de la vignette égal au nom. La vignette utilise le premier média dans l’ordre de la galerie ; si ce média est une vidéo, elle utilise son image de couverture (D-264). La galerie d’Exécution conserve au contraire le média intégral sans recadrage. Séance sans photo (D-260). Choix sans badge durée/heure ni Lecture/Déployer. Pauses/récupérations absentes des cartes Catalogue/choix/Composition ; prochaine planification absente des Catalogues ; données et calculs conservés.

Commandes contextuelles 34/dessin 20/cible 44, gaps 12 ou 10 en Composition ; dimensions spécifiques 48 conservées. Jour compact 298×46/48, barre 4, nature 26, titre 13, valeurs 11, Lecture 26 ; pas de déploiement. Aujourd’hui/Planifier 32 restent l’exception acceptée aprèsT04. Action au relâchement, sans attendre le retour animé ; sortie de cible annule ; stepper : maintien≈500ms, répétition150ms et paliers1/5/10 selon DSF Bip ; réduction des animations par opacité sans dilatation. Les dimensions à402 ne sont pas des coordonnées absolues d’implémentation.

### 4.12 Exécution — phases, commandes et finalisation partagées

Le moteur possède la source de vérité temporelle. En exécution autonome uniquement, le Compte à rebours propre et la Fin propre entourent l’Exercice complet, une fois. Dans une Séance, les Compte à rebours d’exercice et Fin d’exercice ne sont jamais exécutés ; seuls le Compte à rebours initial et la Fin de séance s’appliquent, une fois, par substitution. Aucun booléen ni contrôle d’activation n’existe à cet effet. Les valeurs propres restent conservées pour l’exécution de l’Exercice seul. Référence : D-214 révisée le12/10/2026.

| Origine | Séquence normale |
|---|---|
| ACTIVITY | Préparation système 5 s → compte à rebours propre applicable → toutes Séries/pauses du premier côté → transition SIDE_RECOVERY de durée q si bilatéral (§6 R-03) → toutes Séries/pauses du second côté → Fin propre applicable → signal de fin → Synthèse |
| SESSION | Compte à rebours initial → plan avant Circuit → Circuit répété par Tours → plan après Circuit → Fin de séance → Synthèse |
| Occurrence SESSION | Exercice intrinsèque (Séries/côtés/pauses) → POST_ACTIVITY_RECOVERY positive éventuelle → point d’arrêt éventuel → suite ; aucun Compte à rebours/Fin propre |

Durée intrinsèque calculable : unilatéral Σ(Ti+Pi) ; succession des côtés 2Σ(Ti+Pi)+PC ; par paire 2ΣTi+ΣPi+N×PC. N=1 normalisé succession. Occurrence calculable To=T−PN+R si R>0, sinon To=T. Durée : exact si toutes les cibles sont chiffrées ; Répétitions avec bip : ≈ si toutes les cibles sont chiffrées. Mélange chiffré/échec calculable : ≥ au niveau Exercice, prioritaire sur ≈, somme du travail connu ou estimable et des pauses prévues. Répétitions sans bip, ou toutes les cibles À l’échec : aucun total d’Exercice (omitted). Séance/Circuit : agrégation des contributions connues du plan, ≥ si travail inconnu. Travail + pause après chaque série, dernière comprise ; seule la dernière Pause est remplacée par la Récupération positive qui suit. Compte à rebours/Fin exclus du total intrinsèque. Aucun calcul issu de Figma ou d’Excel.

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

### 4.14 Cadence et DSF — consolidation du06/10/2026

Les références actives sont [paramètres v13](08%20%E2%80%93%20Conception%20fonctionnelle%20d%C3%A9taill%C3%A9e.md#parametres-exercice), [Règles détaillées](10%20%E2%80%93%20Processus%20m%C3%A9tier%20et%20r%C3%A8gles%20m%C3%A9tier%20transverses.md#resultats-temporels), [Phrase v1](08%20%E2%80%93%20Conception%20fonctionnelle%20d%C3%A9taill%C3%A9e.md#phrases) et [DSF courant](../DSF-CADENCE-2026-10-06.md). Figma fournit le layout ; Excel uniquement les formulations. Les titres de cartes approuvées restent15, compactCardTitle15/18, cardTitle16 hors de cette famille ; pas de changement de hauteur induit par le média. Danger#D92D20 pour les confirmations destructives ; séparateur#E0E3E8 et iconNeutral#595E66. Safe Areas natives, aucune barre d’état9:41 codée en dur.

Les durées des contrats Catalogue/Composition/Calendrier utilisent leur périmètre défini : intrinsèque pour ACTIVITY, occurrences avec substitution de PN pour SESSION. Incertitude sans symbole/≈/≥ issue du calcul ; aucune formule locale ni nombre Figma recopié. Suivi/Synthèse affichent le réalisé issu de l’instantané et des accumulateurs, pas une estimation.

Bip de cadence : shell et préférences Profil conservés ; stepper0..10 dans les deux modes,0=Aucun. États d’exécution sans nouveau layout ; Bip v2 gouverne les signaux périodiques, nominal, Pause/Reprise et sécurité. L’ancien écran7061:13383 de roulette est supprimé.

### 4.15 Interface générale du 08/10/2026

Tous les contrats appliquent le [DSF général](../DSF-INTERFACE-GENERALE-2026-10-08.md) pour les quatre relations verticales 18/20/13/12, les pieds d’action, les surfaces blanches des modales et les blocs de section gris sans trait. Exception 20du Profil conservée. Les dimensions internes des cartes ne sont pas remplacées par cette grille ; les cibles tactiles et Safe Areas restent indépendantes. Les coordonnées sont celles du gabarit 402×874 et se traduisent par les ancrages du shell sur les autres tailles.

La suppression du titre des contenus de planification est confirmée par le propriétaire le 08/10. Les états Calendrier multi-contenus et Programme PROG2/3 restent en construction : CE-UI-02/03 ne certifient pas leur recette ; le modèle cible et les limites figurent dans la spécification dédiée.

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
| CE-T03-08 | Composer une séance / Modifier une séance — brouillon, Circuit, points d’arrêt et validation |
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
| CE-UI-04 | Calendrier et planification — choisir des contenus |
| CE-UI-05 | Planification — formulaire et états de paramètres |
| CE-UI-06 | Splash KODJO |
| CE-UI-07 | Profil — préférences et défauts d’exécution |
| CE-EXEC-SESSION-01 | Exécution d’une Séance — phases, commandes et confirmations |
| CE-UI-08 | Synthèse de Séance |
| CE-UI-09 | Référentiels d’Exercice — Catégorie et Zones corporelles |
| CE-UI-10 | Paramètres d’exécution — feuille basse |
| CE-UI-11 | Planification — fréquence d’un contenu |

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

Faire du Catalogue des séances le segment d’entrée par défaut du Catalogue multi-type, avec navigation `Catalogues`, segment Exercices désormais actif, aucun troisième segment, rangée déterministe `Créer / Filtrer / Trier` et action `Créer` contextuelle.

### 3. Contexte d’entrée

Ouverture initiale/reprise complète : segment Séances ; retour de Composition après Continuer ; retour de planification ou d’Exécution avec contexte appelant conservé.

### 4. Contexte de sortie / destinations

Segment Exercices → CE-T03-02 ; Séances reste ; Créer → CE-T03-08 nouveau brouillon ; surface carte → CE-T03-08 modification ; Démarrer → CE-EXEC-SESSION-01 ; Planifier → CE-UI-05 ; navigation basse → destination correspondante. Les zones surface/Déployer/Démarrer restent indépendantes.

### 5. Données affichées et source de vérité

Séances enregistrées du dépôt local, non archivées par défaut, tri updatedAt décroissant. Étiquette facultative ; en son absence, catégories issues des Exercices. Aucun champ Catégorie propre à la Séance. Les objets historiques incomplets restent consultables mais Démarrer est désactivé tant qu’ils ne sont pas exécutables.

Durée et symbole viennent du calcul commun : Durée exacte, Répétitions avec bip ≈, sans bip et À l’échec omis à l’Exercice ; ≥ seulement à la Séance avec travail inconnu ; périmètre intrinsèque ACTIVITY ou occurrence SESSION selon§4.14. Ne rien ajouter dans les choix où la durée est masquée.

### 6. Classification des valeurs Figma

`Catalogue des séances`, `Exercices`, `Séances`, `Créer`, `Filtrer`, `Trier`, `Catalogues` = statiques. Contenus de cartes = dynamiques/démonstration.

### 7. Structure de l’écran

Header fixe → segmenté deux types → rangée commandes Catalogue (`Créer`, `Filtrer`, `Trier`) → liste/état vide → Bottom Navigation.

### 8. Éléments obligatoires

Carte : titre et badge durée, Étiquette puis catégories issues des exercices (catégories seules sans Étiquette), `N exercices` et `N tours` (Séance sans Exercice : « 0 exercice », au singulier, selon la décision PRE-4 Q32 et D-392). Pas de prochaine planification ni pause/récupération. Séance sans vignette. Archivée : fond `color/surface #F5F7FA` (ancienne prescription `#F6F6F6` historique ; référence couleur centralisée au chapitre12), bord #D9D9D9, Restaurer. Catalogue : Séances sélectionné, Exercices actif, Trier désactivé et aucun segment Parcours ; commandes §4.5 et navigation Catalogues.

### 9. Layout déterministe

Cartes Catalogue : [DSF Durée du07/10](../DSF-CARTES-DUREE-2026-10-07.md). Texte de durée sans fond/cadre/padding, Inter Semi Bold12 #141414, droite16px. Propriété booléenne Durée des sets6214:7276/7278 ; absence → aucun contenu de remplacement. Exercice replié/archivé : titre250px, lignes basses207px àx88 ; coupes60/69/145 fondées sur207. Gouttière12px conservée ; Séance16/16. La référence Exercice Déployé ne crée aucun accès MVP.

Cartes standard : largeur 354 sur écran 402, rayon 8, fond #F9FAFC, bord intérieur 0,5 #CCD1E0, titre 15 Semi Bold ; classement pastilles 20, valeurs nues 16 ; aucune barre verticale. Références APRÈS6354:16089 / Photo 6354:16964. Les captures actualisées le 30/09 sont listées dans la matrice de couverture ; les fichiers hors remplacement restent historiques. Hauteur repliée 90, déployée 235. Commandes 34/dessins 20/gaps 12/cibles 44. Segmenté à deux options 354×42 : padding 4, gap 4, options 171×34 ; typographie 16/20 et styles communs ci-dessus. Actions glissées de même hauteur que la carte, y compris déployée.

### 10. Responsive, Safe Areas, texte, scroll et clavier

Appliquer §4.2. Segmenté flexible ; libellés complets ; contenu liste scrollable. Aucune recherche n’est exposée (D-221).

### 11. États de l’écran

Vide réel ; liste ; retour Composition ; retour d’un sous-parcours ; relaunch sur Séances.

### 12. Contrôles et interactions

Exercices navigue ; Séances maintient ; `Créer` initialise directement le parcours de création d’une Séance. Sur une Séance active, `Archiver` agit immédiatement lorsqu’aucune Routine n’est associée et affiche ensuite un snackbar `Séance archivée` avec `Annuler`. Si au moins une Routine est associée, une confirmation explicite précède obligatoirement l’archivage et la suppression de ces Routines ; après confirmation, aucun snackbar d’annulation n’est affiché. `Trier` reste non déclenchable en T03. T03 n’invente aucune nouvelle option Filtrer/Trier propre aux Séances.

### 13. Gestes

Cartes de Séance utilisant des actions contextuelles suivent §4.7. Aucun geste sur le segment désactivé.

### 14. Validation

Aucune validation pour changer de segment. Aucun segment Parcours n’est rendu ; `Trier` ne déclenche aucun événement métier. Créer n’écrit aucune donnée à l’ouverture. Pour `Archiver`, la confirmation est requise si et seulement si au moins une Routine est associée à la Séance. Le snackbar d’annulation est affiché si et seulement si l’archivage a été réalisé sans dialogue de confirmation.

### 15. Brouillon et persistance

Aucun état de segment persisté au relaunch. Le brouillon de création de Séance n’est initialisé qu’après tap sur `Créer`.

### 16. Navigation et conservation d’état

Continuer dans CE-T03-08 enregistre puis ouvre Catalogues / Séances. Aucun écran final Catégories. Un aller-retour restaure filtre et position ; relance complète réinitialise selon §4.4.

### 17. Erreurs et cas limites

Liste vide et archives vides : aucun contenu de démonstration. Suppression concurrente : rafraîchir sans ouvrir un objet absent. Archivage d’une Séance planifiée : confirmation avant mutation des Routines. Suppression définitive uniquement depuis les archives ; historique conservé. La capture2234:189 restaurée le01/10 montre le dialogue ; Annuler/Confirmer non câblés, preuve visuelle seulement.

### 18. Accessibilité

Aucun élément Parcours dans l’arbre d’accessibilité ; Séances selected ; `Catalogues` est le label accessible du premier onglet ; `Trier` annonce disabled ; focus cohérent et cibles ≥44 malgré la hauteur visuelle `34 pt` des commandes contextuelles.

### 19. Invariants

Séances = défaut/relaunch ; Exercices = actif T03 ; Parcours = absent ; bottom label = `Catalogues`, jamais `Séances` ; rangée Catalogue = trois commandes présentes selon §4.5 ; `Trier` disabled.

### 20. Recette déterministe

Vérifier présence/absence puis retour de durée sans perdre titre/catégorie/zones ; aucun badge vide, aucun libellé « à l’échec » dans l’emplacement temporel. Texte long et agrandi : durée alignée à droite, titre sans collision. Durée exacte / Répétitions avec bip≈ / autres modes sans total ; ne pas tester les calculs sur les montants dessinés.

Tester liste vide 2117:86, cartes repliées/déployées, filtres actifs/archives, surface Modifier distincte de Démarrer, état non exécutable, archivage planifié confirmé/annulé, restauration, suppression définitive confirmée/annulée et conservation de l’historique. Après Continuer dans Composition : Séances sélectionné, aucune étape Catégories. Vérifier Étiquette ou catégories de repli, sans prochaine planification affichée.

Comparer sources Durée, Répétitions avec/sans cadence et À l’échec dans les emplacements de durée existants ; conserver masquages des cartes de choix, aucune formule locale et aucune photo de Séance/liste mixte.

## CE-T03-02 — Catalogue des exercices — liste, filtres et cartes

### 1. Identification

| Propriété | Valeur |
|---|---|
| Bloc | B1 |
| États | S02–S12 |
| T03-E | E03, E07–E12, E32–E36, E58–E62, E73 |
| Frames | `3786:5093` |
| Navigation | `6298:12462` |
| Nature | Nouvel écran T03 |

L’ancienne référence `3787:5209` n’existe plus dans l’état Figma courant du 16 septembre 2026 et n’est plus une preuve active.

### 2. Finalité fonctionnelle

Lister les ActivityDefinition ; filtres/archives, ouverture/modification et lancement direct. Format unique à gouttière permanente selon D-260/D-261, sans créer un mécanisme d’import.

### 3. Contexte d’entrée

Segment Exercices depuis Catalogue ; retour éditeur ; retour Exécution directe ; retour archives. L’état du parcours courant est restitué.

### 4. Contexte de sortie / destinations

Surface carte → `CE-T03-04`; Lecture → `CE-T03-09`; `Créer` → règle contextuelle `CE-T03-03` puis création directe `CE-T03-04`; Filtrer>Archivées → `CE-T03-05`; segment Séances → `CE-T03-01`.

### 5. Données affichées et source de vérité

Source : `ActivityDefinitionRepository` / `API-CAT-01`. Défaut : non archivées, `updatedAt DESC`. Exécuter ne modifie pas `updatedAt`. Le Catalogue n’affiche aucune récupération post-exercice, car elle n’existe pas sur `ActivityDefinition`; seule la Pause entre les côtés éventuelle relève de la définition.

Exercice variable : indicateur N séries variables et total intrinsèque selon v13 ; pas de détail exhaustif des cibles sur la carte.

Durée et symbole viennent du calcul commun : Durée exacte, Répétitions avec bip ≈, sans bip et À l’échec omis à l’Exercice ; ≥ seulement à la Séance avec travail inconnu ; périmètre intrinsèque ACTIVITY ou occurrence SESSION selon§4.14. Ne rien ajouter dans les choix où la durée est masquée.

### 6. Classification des valeurs Figma

Noms, Catégories, Zones et paramètres sont des données métier ; les valeurs de la première carte ne sont jamais des constantes. Les pauses/récupérations et la prochaine planification ne sont pas des lignes de carte cible. Titres, segments et actions sont statiques.

### 7. Structure de l’écran

Header → segmenté → rangée commandes Catalogue (`Créer`, `Filtrer`, `Trier`) → liste scrollable → navigation. Carte : pastille de classement, titre/badge, valeurs, Lecture/Restaurer selon contexte, sans Déployer ; aucune barre verticale. Voir le complément Cartes du 30 septembre 2026.

### 8. Éléments obligatoires

Pastille Catégorie colorée, Zones corporelles, titre et badge durée ; synthèse `N séries de X` / `N séries de N rép.` / `N séries à l’échec`, miroir 16 si bilatéral. Aucune pause/récupération ni prochaine planification affichée. Lecture indépendante ; aucun Déployer, avec ou sans média. Aucune poignée. Créer/Filtrer actifs, Trier désactivé.

### 9. Layout déterministe

Cartes Catalogue : [DSF Durée du07/10](../DSF-CARTES-DUREE-2026-10-07.md). Texte de durée sans fond/cadre/padding, Inter Semi Bold12 #141414, droite16px. Propriété booléenne Durée des sets6214:7276/7278 ; absence → aucun contenu de remplacement. Exercice replié/archivé : titre250px, lignes basses207px àx88 ; coupes60/69/145 fondées sur207. Gouttière12px conservée ; Séance16/16. La référence Exercice Déployé ne crée aucun accès MVP.

Cartes standard : largeur 354 sur écran 402, rayon 8, fond #F9FAFC, bord intérieur 0,5 #CCD1E0, titre 15 Semi Bold ; classement pastilles 20, valeurs nues 16 ; aucune barre verticale. Références APRÈS6354:16089 / Photo 6354:16964. Les captures actualisées le 30/09 sont listées dans la matrice de couverture ; les fichiers hors remplacement restent historiques. Repliée 354 × 91. Gouttière permanente d’exercice : carré 64 à12 du bord, photo si média ou icône de nature sinon, centrée et recadrée sans déformation (couverture vidéo), texte x88 ; titre250 en Catalogue replié/archivé, lignes basses207 ; Choix conserve sa largeur liée au contrôle ; hauteur inchangée ; place réservée pendant chargement/erreur, texte alternatif = nom de l’exercice. La vignette utilise le premier média dans l’ordre de la galerie ; si ce média est une vidéo, elle utilise son image de couverture (D-264). Durée Catalogue sans cadre, Inter Semi Bold12 #141414 à16px du bord droit, présence selon Bip v2 ; heure selon contexte, catégorie conservée, pictogramme de zone conservé ; Déployer absent. Séance sans vignette (D-260). Commandes 34/dessins 20/gaps 12/cibles 44. La référence Exercice Déployé est historique hors MVP, sans chemin d’accès.

### 10. Responsive, Safe Areas, texte, scroll et clavier

§4.2. Liste et cartes prennent largeur utile. Aucune recherche active ; `1992:10129` est une archive (D-221). Cibles ≥44 pour les commandes contextuelles visuelles hautes de 34 pt ; les cibles spécifiques de 48 restent conservées. Texte long peut passer sur plusieurs lignes selon DSF.

### 11. États de l’écran

Liste active ; vide 4521:6220 ; filtre étendu Aucun ; filtre appliqué ; archives ; Trier désactivé ; carte glissée ; gouttière sans média/avec photo, sans Déployer ; chargement/erreur média ; retour restauré ; relance sans filtre. 4738:6355 illustre l’ancien assemblage média déployé, pas la cible Photo.

### 12. Contrôles et interactions

Surface carte = ouvrir/modifier ; Lecture = exécution directe. Aucun contrôle Déployer, visible ou invisible, quel que soit le média. La gouttière existe toujours ; le booléen Photo ne change que son contenu. Filtrer ouvre ses options ; Trier sans événement ; Créer ouvre directement la création persistante.

### 13. Gestes

Swipe selon §4.7 ; pas de drag/appui long de carte Catalogue. Aucune zone de tap Déployer, avec ou sans média. Les commandes d’appui suivent D-237.

### 14. Validation

Lecture seulement si définition exécutable. Filtrer>Archivées ne modifie aucune donnée. Trier reste désactivé quel que soit l’état de liste.

### 15. Brouillon et persistance

Filtre/scroll = état UI mémoire du parcours. Aucun stockage persistant après relaunch. Aucun tri utilisateur persisté.

### 16. Navigation et conservation d’état

Édition/Execution/Archives puis retour : restaurer filtre, tri implicite et scroll. Relaunch : perdre état et revenir globalement Séances.

### 17. Erreurs et cas limites

Définition supprimée entre rendu et action : rafraîchir et indiquer indisponibilité. Filtre Archives sans résultat = état vide Archives, pas retour automatique aux actives.

### 18. Accessibilité

Carte : `Ouvrir l’exercice <nom>` ; Lecture : `Exécuter l’exercice <nom>` ; vignette : nom de l’exercice. Aucune commande de déploiement ne doit être annoncée pour une carte d’Exercice. Trier désactivé/non déclenchable ; commandes contextuelles cibles 44 sans chevauchement. Troncature conserve la donnée complète.

### 19. Invariants

Lecture indépendante ; aucune poignée ; carte à gouttière permanente sans Déployer et sans hausse de hauteur liée au média. Absence des pauses/récupérations/prochaine planification sur carte sans perte de données. Trier disabled, tri updatedAt DESC, règles Filtrer inchangées.

### 20. Recette déterministe

Vérifier présence/absence puis retour de durée sans perdre titre/catégorie/zones ; aucun badge vide, aucun libellé « à l’échec » dans l’emplacement temporel. Texte long et agrandi : durée alignée à droite, titre sans collision. Durée exacte / Répétitions avec bip≈ / autres modes sans total ; ne pas tester les calculs sur les montants dessinés.

Tester zéro/N cartes, active/archivée, avec/sans photo/vidéo, chargement/erreur, texte alternatif, troncature, sélection indépendante et absence de zone Déployer avec ou sans média. Vérifier formats des deux modes, miroir pour bilatéral et absence des textes retirés. Puis filtres, actions glissées, retour d’état et responsive. Critères CAR/MED/ICO/CTX/ANI du complément.

Vérifier aussi les cartes variables dans les deux modes et la durée intrinsèque sans récupération contextuelle.

Comparer sources Durée, Répétitions avec/sans cadence et À l’échec dans les emplacements de durée existants ; conserver masquages des cartes de choix, aucune formule locale et aucune photo de Séance/liste mixte.

## CE-T03-03 — Catalogue — action `Créer` contextuelle

**Complément Formats du 14/10 :** L’entrée par modèle/format suit CE-FMT-01 et CE-FMT-02. La création libre reste disponible. Format et origine sont séparés ; aucune contrainte ne vient du seul nom du modèle.

### 1. Identification

Contrat d’action, sans écran intermédiaire. Bouton Créer dans les Catalogues 1992:9910 et 3786:5093. Les arbres historiques 3787:5148/3841:8375 ne sont pas des destinations.

### 2. Finalité fonctionnelle

Ouvrir directement la création de l’objet correspondant au Catalogue courant, sans écran ni arbre intermédiaire.

### 3. Contexte d’entrée

Tap `Créer` depuis le Catalogue courant. Le type de Catalogue affiché détermine la destination.

### 4. Contexte de sortie / destinations

Exercices → CE-T03-04 en création ; Séances → CE-T03-08 en création. Aucun troisième segment n’est présenté. Annuler le formulaire ouvert restaure le Catalogue appelant sans créer d’objet.

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

Action disponible depuis les Catalogues actifs. Dans T03 : `Exercices` et `Séances`. Aucun troisième segment n’est présenté.

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

Action Créer contextuelle conservée D-187 ; ancien arbre Un circuit retiré, Parcours absent du Catalogue. Aucune règle Cadence ajoutée à ce contrôle.

### 20. Recette déterministe

Depuis chaque segment actif, un tap ouvre exactement le formulaire correspondant ; aucun arbre. Annuler ne crée rien ; double tap n’empile pas deux formulaires ; aucun segment Parcours, aucune cible ni annonce accessible résiduelle.

## CE-T03-04 — Éditeur Exercice — créer / modifier

### 1. Identification

Formulaire créer/modifier :3943:6064,4217:6980,5088:6398,3542:4656,4734:6342. Carte vide6407:9458, résumé uniforme6407:9702, variables6665:27862/28050. Abandon4714:6241. Feuille CE-UI-10 et référentiels CE-UI-09 ; inventaire courant du03/10.

Phrase longue7119:27855 et Bip7059:13302 ;7061:13383 supprimé ; copies9b/10b7069:13464/13573. Relevé06/10, captures dans chapitre06.

### 2. Finalité fonctionnelle

Créer/modifier un Exercice avec paramètres saisis dans la feuille basse. Le résumé de la carte est dérivé et sert de raccourci ; il ne contient aucun contrôle de saisie inline. Ajout/import de médias inclus au MVP dans PRE-3, avant le moteur d’exécution (D-333).

### 3. Contexte d’entrée

Créer depuis Catalogue ou modifier une définition existante ; nouveau brouillon ou copie de travail. Le même motif s’applique à une copie de Composition lorsque son édition est exposée, sans synchronisation vers la référence.

### 4. Contexte de sortie / destinations

Terminer valide et persiste puis retourne au contexte appelant. Carte Paramètres → CE-UI-10. Retour avec modifications → confirmation d’abandon existante.

### 5. Données affichées et source de vérité

Deux modes communs, cible typée par Série et régime conservé. Phrase régénérée depuis les cibles mixtes, total issu du moteur (≥ si mélange calculable). Les huit cartes catalogue tout échec conservent leur formulation.

Phrase selon les276 cas v15, total fourni par le calcul métier. Générateur → segments ordonnés `{texte, gras}`, valeurs et unités en gras, aucun redécoupage de chaîne. Terme « pause après chaque série », y compris N=1 ; clause de pauses variables omise conformément au corpus.

Brouillon parent : nom, référentiels, description, paramètres validés par la feuille et associations médias ordonnées, existantes ou ajoutées dans PRE-3 (D-333). Aucun texte de démonstration codé en dur.

Paramètres étendus : uniforme/variable, liste ordonnée de cibles/Pauses, Ordre des côtés ; copie complète vers CE-UI-10.

Import média : accès depuis la zone Média et sauvegarde avec l’Exercice. Tester import nominal/annulé/en erreur, conservation à la réouverture, ordre et copies indépendantes selon D-333. Sources système, formats, permissions et présentation des états non représentés : À CLARIFIER dans le plan, sans inventer de caméra ni de limite.

La collection inclut la bip commun0..10 de chaque Série. Phrase dérivée des paramètres appliqués et du résultat de calcul intrinsèque, jamais sauvegardée comme vérité indépendante.

### 6. Classification des valeurs Figma

Créer un exercice/Modifier un exercice, Paramètres d’exécution, Description de l’exercice, Terminer : statiques. Nom et résumé : dynamiques. Compte à rebours/Fin restent séparés de la phrase intrinsèque ; le Mode n’a pas de champ propre sur la carte et reste visible dans la phrase (décision PRE-4 Q23 du 16/10, D-385).

Le champ du mode à droite du titre de la carte, visible sur7059:13302 et7119:27855, est retiré : la carte forme une seule zone touchable qui ouvre la feuille ; le Mode reste visible dans la phrase et se choisit dans la feuille, par son popover (décision PRE-4 Q23 du 16/10, D-385). La phrase reflète les paramètres appliqués ; les montants statiques des copies ne sont pas des valeurs par défaut.

### 7. Structure de l’écran

En-tête fixe → nom et accès Catégorie/Zones → carte Paramètres avec phrase unique et Compte à rebours/Fin → Description → Média → Terminer. Réutiliser le shell existant.

### 8. Éléments obligatoires

Carte vide initiale ; après✓, une phrase unique avec valeurs en gras, énumération jusqu’à3 puis min/max selon Phrase v1. La zone entière ouvre CE-UI-10 ; aucun segment/raccourci autonome dans la phrase. Compte à rebours et Fin restent des lignes séparées.

### 9. Layout déterministe

Shell conservé : en-tête fixe, bandeau nom/référentiels, carte Paramètres, Description, Média, action Terminer. Références3943:6064/4734:6342/6407:9702 et6665:27862/28050. Les deux nouveaux résumés gardent cette implantation ; le texte peut grandir, sans déplacement arbitraire des contrôles. Feuille selon DSF-SERIES-VARIABLES-2026-10-02, actualisé le03/10.

Phrase : Inter13, interligne20, texte sombre et valeurs en gras ; largeur324/x39 dans la référence402. Hauteur auto et retour naturel ; le contenu inférieur suit la croissance. Aucune limite de198/211 caractères. Le layout du shell reste celui des frames du formulaire.

Icônes Catégorie et Zones : états contour/plein de la planche7245:13718 ; une seule silhouette, issue du Profil, jamais deux boutons homme/femme dans l’éditeur.

Référence longue7119:27855 :224caractères, cinq lignes/100px à largeur324, carte193px en AUTO. Contenu et contrôles suivants suivent la hauteur intrinsèque, sans plafond.

### 10. Responsive, Safe Areas, texte, scroll et clavier

360/402/440, Safe Areas, texte agrandi et clavier. Formulaire défilant ; Terminer accessible. Feuille ouverte : formulaire parent inerte et hors parcours de focus.

### 11. États de l’écran

Vide, nom seul, catégorie renseignée, nom/description/média renseignés, modification existante, résumé uniforme, résumé variable Durée/Répétitions/À l’échec, bilatéral et chacun des ordres, abandon confirmé/annulé, erreur de sauvegarde. Le résumé Répétitions est visible derrière6665:24844 ; pas de vue parent dédiée actuellement. L’absence de capture ne retire pas cet état du contrat.

Avec/sans cadence ; phrase courte/longue, total déterminable/approximatif, suppression de cadence et retour de mode en brouillon. Les textes de démonstration de7059/7061/7119 sont antérieurs à la grammaire finale et ne la remplacent pas.

### 12. Contrôles et interactions

Toucher la zone Paramètres ouvre CE-UI-10. Aucun mot ou nombre de la phrase ne sélectionne une ligne indépendamment. ✓ applique au brouillon et régénère ; ✕ le conserve ; Terminer persiste atomiquement.

### 13. Gestes

Tap, saisie et défilement du formulaire. Toucher une tuile Média la consulte : vidéo lue en plein écran par le lecteur natif de la plateforme (iOS sur iPhone, Android sur Android, D-393), sans lecture automatique ; photo ouverte en plein écran. Appui long sur la tuile : menu contextuel natif Retirer / Monter / Descendre, avec actions VoiceOver équivalentes ; aucun bouton ajouté sur la tuile (décisions PRE-4 Q27 et Q31 du 16/10, D-385). Pas d’autre geste métier.

### 14. Validation

Nom, exactement une Catégorie et au moins une Zone pour un nouvel Exercice ; maintien des affectations retirées D-210. Paramètres exécutables issus de CE-UI-10. Terminer inactif si paramètres absents/invalides ; la couleur d’exemple de Figma ne suffit pas à valider.

Toutes les Séries actives doivent être valides ; Total variable en lecture seule, aucune cible uniforme utilisée à sa place.

### 15. Brouillon et persistance

Aucune phrase ni aucun segment en base, occurrence ou snapshot. Régénération à chaque affichage depuis les paramètres ; ✓ applique, ✕ annule, Terminer persiste les paramètres. Une règle rédactionnelle amendée s’applique au prochain affichage des objets existants.

Persistance à Terminer uniquement, atomique. Le brouillon de la feuille est distinct du brouillon parent ; annuler la feuille ne modifie aucun paramètre du parent.

### 16. Navigation et conservation d’état

Retour au Catalogue restauré en contexte définition ; au contexte Composition en contexte copie. Les Exécutions historisées ne sont jamais modifiées.

### 17. Erreurs et cas limites

Échec DB : conserver brouillon, rester éditeur et permettre nouvelle tentative. Source supprimée en parallèle : signaler erreur sans recréation implicite. Aucun contenu de démonstration en remplacement des données manquantes.

### 18. Accessibilité

Un focus pour la zone de phrase, label Modifier les paramètres d’exécution, lecture intégrale ; aucune valeur estimée annoncée comme saisissable. Restituer le focus au retour.

### 19. Invariants

Aucune édition inline de la phrase. Mode/nom exclus de la phrase intrinsèque ; pas de total À l’échec. Calculs v13, D-248 ; D-242 supersédée ; import de médias livré dans PRE-3 selon D-333, sans anticiper le moteur de lecture en exécution. Aucun enregistrement à la simple fermeture de feuille.

### 20. Recette déterministe

Après✓ tester mélange chiffré/échec et ≥, puis annulation et édition d’une copie ; tout échec reste sans total. La formulation de fond divergente de8328:38848 est une réserve Figma, pas une autorité métier.

Recette rédactionnelle :276 gabarits v15 avec total métier injecté, gras sur occurrences répétées d’une valeur, N1 avec pause mentionnée et total non redondant ; absence de troncature. Français au MVP ; i18n nécessite des gabarits et accords par locale, pas une traduction de fragments isolés.

Tester vide→feuille→annuler sans changement ; feuille valide→résumé→Terminer ; zone de phrase entière ; modification annulée ; deux modes, deux ordres bilatéraux et PC=0 sans repli ; source disparue/erreurDB ; champs/référentiels requis ; lecture seule Total Répétitions. Vérifier différences entre exemple Figma et données recalculées.

Sauvegarder/réouvrir après bascules, déplacement et N1 ; vérifier indépendance copie Catalogue/Séance et résumé v13.

Bip0/1/10, supprimer puis annuler/confirmer, phrase à3/4cibles, singulier et deux directions, omission Répétitions sans bip/À l’échec ; redondance N1 Durée unilatérale, texte agrandi. Le classeur teste la formulation avec un total fourni, jamais les calculs.

Vérifier état repos/activé à ouverture/fermeture du panneau et symbole du total selon D-305.

Corpusv15 :276gabarits, total métier injecté ; aucun changement grammatical vs v14. Tester virgule jamais isolée en début de ligne, cas144 long et ordre des cibles après déplacement. Les cas de brouillon incomplet restent hors des276sorties validées.

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

Cartes Catalogue : [DSF Durée du07/10](../DSF-CARTES-DUREE-2026-10-07.md). Texte de durée sans fond/cadre/padding, Inter Semi Bold12 #141414, droite16px. Propriété booléenne Durée des sets6214:7276/7278 ; absence → aucun contenu de remplacement. Exercice replié/archivé : titre250px, lignes basses207px àx88 ; coupes60/69/145 fondées sur207. Gouttière12px conservée ; Séance16/16. La référence Exercice Déployé ne crée aucun accès MVP.

Variante archivée : fond `color/surface #F5F7FA` (ancienne prescription `#F6F6F6` historique ; référence couleur centralisée au chapitre12), bord #D9D9D9 à0,5, même rayon/ombre ; Restaurer remplace Lecture. Avec média, RG-4 et RG-11 à RG-13 s’appliquent ; aucune prochaine planification. L’état existe dans le composant sans écran d’archive d’exercice dédié ; ne pas déclarer un écran Figma créé.

Actions destructives : token danger#D92D20 ; séparateurs#E0E3E8 et labels par rôle DSF. Aucune reprise des anciens rouges locaux.

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

Vérifier présence/absence puis retour de durée sans perdre titre/catégorie/zones ; aucun badge vide, aucun libellé « à l’échec » dans l’emplacement temporel. Texte long et agrandi : durée alignée à droite, titre sans collision. Durée exacte / Répétitions avec bip≈ / autres modes sans total ; ne pas tester les calculs sur les montants dessinés.

Archiver/restaurer/supprimer une définition non planifiée puis planifiée ; confirmer/annuler ; vérifier Routines futures retirées à l’archivage confirmé, copies et instantanés conservés. Restauration ne recrée pas les Routines supprimées. Vérifier double tap, échec atomique, filtre archives vide, absence Lecture dans l’état archivé.

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

Durée et symbole viennent du calcul commun : Durée exacte, Répétitions avec bip ≈, sans bip et À l’échec omis à l’Exercice ; ≥ seulement à la Séance avec travail inconnu ; périmètre intrinsèque ACTIVITY ou occurrence SESSION selon§4.14. Ne rien ajouter dans les choix où la durée est masquée.

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

Comparer sources Durée, Répétitions avec/sans cadence et À l’échec dans les emplacements de durée existants ; conserver masquages des cartes de choix, aucune formule locale et aucune photo de Séance/liste mixte.

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

Durée et symbole viennent du calcul commun : Durée exacte, Répétitions avec bip ≈, sans bip et À l’échec omis à l’Exercice ; ≥ seulement à la Séance avec travail inconnu ; périmètre intrinsèque ACTIVITY ou occurrence SESSION selon§4.14. Ne rien ajouter dans les choix où la durée est masquée.

### 6. Classification des valeurs Figma

Noms/paramètres = dynamiques. Compteur = calculé. Libellés/actions = statiques. Exemples = démonstration.

### 7. Structure de l’écran

Modale avec titre, fermeture, liste défilante, cases à cocher et compteur, CTA Sélectionner fixe. Pas de création locale exposée.

### 8. Éléments obligatoires

Case 20, titre 15, pastilles 20, valeurs 16, compteur et Sélectionner désactivé à0. Aucun badge durée/heure, Lecture ou Déployer. Fermeture accessible dans l’en-tête.

### 9. Layout déterministe

Composants actifs et propriété Durée : [DSF cartes du07/10](../DSF-CARTES-DUREE-2026-10-07.md). La suppression du cadre de durée Catalogue ne change pas le contrat de cette variante : sélecteurs sans durée, Suivi avec durée réelle, Calendrier avec données de planification. Ne pas injecter une durée à cause du défauttrue de la propriété Figma.

Cartes standard : largeur 354 sur écran 402, rayon 8, fond #F9FAFC, bord intérieur 0,5 #CCD1E0, titre 15 Semi Bold ; classement pastilles 20, valeurs nues 16 ; aucune barre verticale. Références APRÈS6354:16089 / Photo 6354:16964. Les captures actualisées le 30/09 sont listées dans la matrice de couverture ; les fichiers hors remplacement restent historiques. Choix Composition 354 × 91 ; cadre des zones corporelles arrêté à8 px de la case, points de suspension en fin, liste seule défilante ; actions fixes. Gouttière permanente d’exercice : carré 64 à12 du bord, photo si média ou icône de nature sinon, centrée et recadrée sans déformation (couverture vidéo), texte x88 ; titre250 en Catalogue replié/archivé, lignes basses207 ; Choix conserve sa largeur liée au contrôle ; hauteur inchangée ; place réservée pendant chargement/erreur, texte alternatif = nom de l’exercice. Aucun badge durée/heure dans ce choix, catégorie conservée, pictogramme de zone conservé ; Déployer absent.

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

Les copies sont ajoutées atomiquement au brouillon de Composition ; aucune sauvegarde de Séance avant Continuer. Une erreur ne laisse aucune copie partielle. Les copies portent les paramètres intrinsèques ; aucune récupération post-occurrence n’est ajoutée automatiquement ; le défaut Profil est proposé seulement à son ajout explicite.

### 16. Navigation et conservation d’état

Succès → Composition enrichie, même contexte/scroll autant que possible. Annuler → exact état antérieur.

### 17. Erreurs et cas limites

Définition supprimée entre sélection et validation : la retirer/recalculer, empêcher copie fantôme, informer. Échec d’une copie → rollback total.

### 18. Accessibilité

Chaque ligne annonce nom/type et sélection ; cible case≥44 ; compteur annoncé après modification ; Sélectionner désactivé à0 ; focus captif dans modale, restitué au déclencheur à la fermeture.

### 19. Invariants

Ordre liste et non touchers ; copies indépendantes ; zéro sélection interdit ; pas de copie fantôme ou partielle ; pas de synchronisation ultérieure à la définition source.

### 20. Recette déterministe

Liste A/B : sélectionner B puis A → insertion A/B ; désélection, 0/1/N, fermeture sans effet, double tap, suppression de source avant validation, rollback total, modification indépendante des copies. Vérifier aucun badge/lecture/déploiement/création/recherche/filtre local ; vignette, texte long, cadre de coupe à8 px de la case, clavier non requis.

Comparer sources Durée, Répétitions avec/sans cadence et À l’échec dans les emplacements de durée existants ; conserver masquages des cartes de choix, aucune formule locale et aucune photo de Séance/liste mixte.

## CE-T03-08 — Composer une séance / Modifier une séance — brouillon, Circuit, points d’arrêt et validation

**Complément Formats du 14/10 :** Pour une séance issue d’un format, appliquer CE-FMT-03 : réglages autorisés toujours éditables, identité et constantes conservées, synthèse et calculs actualisés. Conserver la nature et l’unité de compte propres au format.

### 1. Identification

Composition2028:11137/11700/11808/12003,3518:4576,5271:5455. Placement unifié7167:13503 ; durée7173:13521 ; retrait récupération7296:13696 ; point présent3722:5061/retrait5301:5443. Ancien4893:6675 supprimé, historique seulement. Étiquettes CE-T03-16, sélection CE-T03-07. Réglages2028:11375/11457.

### 2. Finalité fonctionnelle

Créer/modifier la Séance : nom, Étiquette facultative, occurrences avant/dans/après Circuit, Tours et pauses explicites. Valider une seule fois vers le Catalogue.

### 3. Contexte d’entrée

Créer depuis Catalogues/Séances, ouvrir une Séance existante, revenir de sélection/édition d’Exercice ou d’Étiquette. La modification part d’une copie de travail de la Séance.

### 4. Contexte de sortie / destinations

Exercice → éditeur de copie locale ; Ajouter un exercice → CE-T03-07 ; Étiquette → CE-T03-16 ; Continuer valide/enregistre → CE-T03-01 segment Séances. Retour avec changements → confirmation d’abandon 2028:11298 ; abandon confirmé détruit le brouillon seul.

### 5. Données affichées et source de vérité

**Complément cible12/10 :** Nature, compte et régime explicites. N imposé en circuit de séries ; durées agrégées exact/≈/≥, sans lire les chiffres Figma.

Brouillon Session indépendant, nom, Étiquette0..1, compte à rebours/Fin, Circuit unique, nature tours/séries, compte1..99, exclusion systématique des Compte à rebours/Fin propres selon D-214 révisée, sans booléen et sans effacer leurs valeurs. Aucune récupération automatique à la création d’une occurrence. Une récupération explicite est proposée au défaut Profil (30 s initialement) lors de son ajout ; elle reste solidaire de son occurrence. postActivityRecoverySeconds est sa projection de calcul, 0 en l’absence de récupération (D-304/D-307). Chaque occurrence conserve ses séries/cadences ; To=T−PN+R si R>0, sinon To=T pour un travail calculable. Total développé selon la nature du Circuit ; exact/estimated/lowerBound selon Bip v2 et spécification Circuits du12/10. Point d’arrêt sans durée prévue.

### 6. Classification des valeurs Figma

Titres statiques : `Composer une séance` en création, `Modifier une séance` en modification. Noms/paramètres = dynamiques ; titres structurels = statiques ; positions de cartes d’exemple = démonstration.

### 7. Structure de l’écran

Nom/contexte de Séance, Étiquette et actions → compte à rebours initial → occurrences/points avant Circuit → Circuit de tours ou de séries avec occurrences/points internes développés selon sa nature → occurrences/points après Circuit → Fin de séance → Continuer. Aucun Cycle visible ni étape finale Catégories.

### 8. Éléments obligatoires

**Complément cible12/10 :** Chiffre distinct de la pastille d’unité ; œil permanent ; volumes sur cartes. N× conservé même sous héritage.

Compte à rebours/Fin non déplaçables ; Appui sur le chiffre pour révéler ± ; pastille tours/séries pour choisir la nature ; œil permanent sur la ligne du titre ; aucun côté au Circuit. Carte sans texte de pause/récupération dans son corps. Ligne variable : volumes séparés par un point médian, unité finale ; trois valeurs au maximum selon place puis ellipse. Régime explicite, notation stable ; voir chapitre 13, Cartes et grille des volumes. Hors placement, le trait de démarcation reste présent, indépendamment du contenu. Récupération absente/0 : aucune information de récupération ; aucun point : aucune information de point. Pendant le choix des emplacements, le trait est masqué au profit des contrôles de placement . V-04 est clos par clarification du12/10 : aucun réglage global D-214 n’est requis ; aucune modification Figma nécessaire sur ce point, selon confirmation du propriétaire.

### 9. Layout déterministe

Shell de Composition conservé. Commandes contextuelles34/dessin20/gap10/cibles44 dans bande32, durée immobile et actions à droite6 plus bas. En placement, deux blocs de largeur égale et marges alignées aux cartes ; récupération à gauche, point à droite, selon7167:13503. Trait masqué uniquement pendant le choix. La récupération ajoutée reste attachée au bloc de l’occurrence lors du déplacement ; carte levée selon3518:4576. Annuler et Confirmer restent accessibles en bas. Captures à géométrie encore divergente sur le trait qualifiées au chapitre06.

### 10. Responsive, Safe Areas, texte, scroll et clavier

360/402/440 ; scroll Composition ; actions contextuelles restent accessibles ; pas de clavier sauf champs de contexte déjà définis.

### 11. États de l’écran

**Complément cible12/10 :** Tours/séries ; compteur actif/repos ; conversion avec/sans perte ; confirmation annulée/confirmée ; réserve après diminution ; grille ouverte ; N minimal/maximal.

Création vide ; nom saisi ; composition valide/invalide ; édition ; Étiquette sélectionnée/absente ; réglages initial/fin ; glissé/déplacement ; placement multiple sans/avec sélection ; roulette récupération ; confirmation décomptée ; retour/annulation ; bulle retrait récupération/point ; abandon/sauvegarde/erreur. Rabsente/R0/Rpositive croisés avec point absent/présent et trait hors/en placement.

### 12. Contrôles et interactions

**Complément cible12/10 :** Choix de nature → CE-CIR-01 ; perte → CE-CIR-02 ; œil → CE-CIR-03. Diminution sans message ; restauration avant préremplissage. Ajout catalogue avec perte exige confirmation, Annuler abandonne ajout.

Pause ouvre le sous-brouillon de placement. Sélection Point d’arrêt bascule l’ajout ; sélectionner Récupération ouvre immédiatement la durée proposée du Profil, initialement30s. Valider la roulette confirme au sous-brouillon, Annuler restitue l’état de cet emplacement. Confirmer N pauses ajoutées applique au parent ; Annuler le placement restitue tout l’état d’entrée. Décompte par objet nouvellement ajouté, récupération+point=2 ; désélection retranche, N0 sans confirmation active. Tap sur récupération positive ouvre son réglage ; appui long ouvre Retirer. L’avertissement D-301 reste « Attention, les exercices vont s’enchaîner sans pause. » si aucune Pause terminale ni Rpositive entre deux Exercices ; informatif, aucune mutation ni blocage.

### 13. Gestes

Swipe occurrence : Dupliquer/Supprimer ; appui long puis glisser : déplacer. Appui long récupération ou point : bulle Retirer ; tap hors bulle ferme sans mutation. Aucun second dialogue imposé par ces bulles. Compte à rebours/Fin non déplaçables.

### 14. Validation

Continuer exige nom et au moins un Exercice valide ; il reste désactivé, et la Séance n’est pas enregistrée, si un de ses Exercices comporte une cible obligatoire non renseignée (D-380, D-123). Le contrôle ou champ obligatoire sans valeur est signalé par son fond rouge pâle, pas la carte entière, sans message supplémentaire (D-389). Récupération0..300s, grille1s jusqu’à5,5s jusqu’à120,30s jusqu’à300 ; aucune durée requise pour point. Récupération après occurrence, dernière comprise ; pas avant première. Point interdit immédiatement après compte à rebours initial et avant Fin ; autorisé avant/après Circuit et entre ses Exercices. Un élément de chaque type au même emplacement ; pas de doublon du même type. Drop invalide restitue la position. Les affectations de référentiels retirées restent valides selon D-210.

### 15. Brouillon et persistance

**Complément cible12/10 :** Diminution du compte : réserve dans le brouillon de séance jusqu’à Continuer/enregistrement ; conversion confirmée : troncature définitive. Annuler conversion restitue nature et toutes données.

Brouillon de placement isolé du brouillon Composition ; roulette incluse dans cette transaction. Confirmer applique atomiquement au parent, Continuer seul persiste Session+Composition. Annuler la roulette ne confirme pas un ajout ; Annuler placement restaure son état d’entrée ; abandon Séance restaure la version persistée.

Une récupération explicitement réglée à0 reste persistée ; seule l’action Retirer supprime l’objet. Elle ne produit aucune phase et ne remplace pasPN. Pause après chaque série et Pause de Composition sont deux données distinctes.

### 16. Navigation et conservation d’état

Sous-parcours : conserver brouillon, insertion et scroll. Continuer succès → Catalogues/Séances avec transition canonique ; aucune page Catégories. Échec : rester, brouillon intact, action réactivée.

### 17. Erreurs et cas limites

Liste vide, position interdite, erreur durée, double tap et erreur de transaction : pas de mutation partielle. R0 ne génère aucune phase. Suppression recovery retire cette phase et rétablit la Pause terminale configurée ; aucun changement de définition Catalogue. Anciennes séances : aucune reprise imposée par ce lot ; ne pas confondre migration de schéma et reprise fonctionnelle.

### 18. Accessibilité

Annoncer type, position, durée, sélection et nombre d’ajouts ; ordre de focus récupération puis point à chaque emplacement. Focus contenu dans la roulette/bulle puis rendu à la commande d’origine. Alternatives accessibles au drag/swipe ; sélection non fondée sur couleur seule ; suppression et annulation explicitement nommées.

### 19. Invariants

**Complément cible12/10 :** Un circuit MVP. Nature séries : tous exercices à N ; régime indépendant. Passage bilatéral unique PC puis Pi terminale. Aucun compte à rebours/fin propre en SESSION.

Pause après chaque série, dernière comprise, même N1. Hors circuit de séries, PN puis PC se cumulent à la frontière des côtés successifs ; ordre par paire selon paramètres d’exercice du chapitre 08. Dans un circuit de séries : premier côté → PC → second côté → Pi, déroulement unique ; R positive remplace Pi terminale. Seule la toute dernière Pause est remplacée si une récupération positive suit l’Exercice ; sans elle (ou R0), conserver PN. En direct, conserver PN sans récupération contextuelle. Réordonner les Séries réévalue la dernière Pause.

Circuit=groupe, Tour=répétition ; récupération positive avant point, attente exclue du prévu ; éléments internes répétés à chaque Tour. Aucune récupération automatique ni récupération directe ACTIVITY. Hors placement, le trait de démarcation reste présent, indépendamment du contenu. Récupération absente/0 : aucune information de récupération ; aucun point : aucune information de point. Pendant le choix des emplacements, le trait est masqué au profit des contrôles de placement (D-303). D-248 confirmée sur pause terminale et substitution par R ; D-301 maintenu pour l’absence de pause effective entre Exercices ; aucune persistance avant Continuer.

CF3 déjà tranché par RM-151/RM-152 : indicateur compact D→G/G→D conservé, sans nouvelle ligne de pause ni phrase longue injectée dans les cartes.

### 20. Recette déterministe

**Complément cible12/10 :** Tester A/B avec comptes différents ; conversion destructive/non destructive, annulation,4→3→4, enregistrement3 puis augmentation ; sortie/ajout sans mutation du catalogue ; récupération/point chaque passage.

Tester annulation roulette/placement/Séance, sélection multiple/désélection/décompte, Rabsente/0/positive et point absent/présent, dans/hors placement. Tester frontières des deux types, dernière récupération, répétition par Tour, retrait/extérieur bulle, duplication/déplacement/suppression et sauvegarde atomique. Tester erreur/double tap ; D-214 révisée : vérifier l’absence du contrôle et des phases propres en SESSION ; V-04 clos. D-301 présent uniquement sans pause effective de transition ni Rpositive, sans blocage. Vérifier symbole ≈ avec bip/omission sans bip à l’Exercice et montants issus de la spécification, aucune formule de capture.

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

Paramètres de la Série courante issus de l’instantané variable/uniforme ; ordres v13. En direct : total intrinsèque, Pause terminale normale, aucune récupération contextuelle.

Cadence éventuelle issue de la Série de l’instantané, jamais du Profil ou des chiffres Figma. Temps réellement dépensé cumulatif distinct du chrono de tentative ; bip applicable aux deux modes, sans modifier leur terminaison propre.

### 6. Classification des valeurs Figma

Nom = dynamique ; 5 s = règle statique système ; autres exemples = démonstration.

### 7. Structure de l’écran

Shell Exécution, nom Exercice et Catégorie, décompte de préparation ; aucune Séance/Tour/Cycle.

### 8. Éléments obligatoires

Préparation 5 s, nom Exercice, Catégorie, état de suspension ; Pause/Reprendre et accès Arrêter depuis Pause selon§4.12. Réinitialiser/Suivant pendant cette phase système ne sautent pas la préparation.

Série n/N ; côté courant distinct uniquement en bilatéral, absent en unilatéral ; aucune barre par Série. À suivre affiche la phase réelle : Pause (y compris terminale) ou, uniquement en bilatéral, Pause entre les côtés ; aucune Récupération en direct.

### 9. Layout déterministe

Réutiliser Shell existant, ne pas créer un écran Session factice. Le compte à rebours reste dans zone centrale prévue.

### 10. Responsive, Safe Areas, texte, scroll et clavier

360/402/440 et Safe Areas ; pas de clavier ; commandes visibles à taille standard et atteignables par scroll si texte agrandi.

### 11. États de l’écran

Initial 5 ; 4..1 ; 0/transit ; erreur initialisation.

### 12. Contrôles et interactions

Pause suspend le décompte, Reprendre reprend le restant ; Arrêter depuis Pause suit confirmation. Aucun tap ne crée de Session ni une seconde Exécution. Commandes propres à une Série ne sont pas des commandes de la préparation.

Si la Série est en Répétitions avec bip, appliquer Bip v2 : nominal sans transition, Suivant normal ; dans les deux autres modes, le bip est périodique sans changer leur terminaison ; Pause/Reprise sur intervalle complet ; reset de portée existante avec temps réel conservé. En préparation/phase chronométrée, conserver le décompte propre. Média/retournement ne déclenchent pas Pause.

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

Pause après chaque série, dernière comprise, même N1. Hors circuit de séries, PN puis PC se cumulent à la frontière des côtés successifs ; ordre par paire selon paramètres d’exercice du chapitre 08. Dans un circuit de séries : premier côté → PC → second côté → Pi, déroulement unique ; R positive remplace Pi terminale. Seule la toute dernière Pause est remplacée si une récupération positive suit l’Exercice ; sans elle (ou R0), conserver PN. En direct, conserver PN sans récupération contextuelle. Réordonner les Séries réévalue la dernière Pause.

5 s fixes ; origin ACTIVITY ; pas de Session artificielle ; pas SESSION_END.

### 20. Recette déterministe

Tester Catalogue et Calendrier, source invalide/disparue, préparation exactement 5 s, compte à rebours propre 0/>0, absence de Tour/Cycle/SESSION_END, interruption et double démarrage ; vérifier instantané immuable et rattachement d’occurrence.

Vérifier les deux ordres et directions, valeurs variables, PC0 sans repli, Pause terminale et N1 normalisé. Ne pas déduire les transitions du câblage Figma.

Vérifier passage entre préparation, Série cadencée, pauses programmées et fin ; deux côtés/deux ordres si applicables ; reset préservant autre côté et temps cumulé ; absence de double signal/transition. Bip valide dans les deux modes ; aucun signal hors phase Série.

## CE-T03-10 — Exécution directe — Durée chiffrée unilatérale

### 1. Identification

Exécution ACTIVITY en Durée unilatérale ; frame 4968:8188, contexte de données unilatéral ; pas d’ancien écran 17 autonome.

### 2. Finalité fonctionnelle

Exécuter une ActivityDefinition DURATION en autonomie avec Séries et Pauses, sans orchestration Session. En unilatéral, aucune phase de récupération n’est ajoutée.

### 3. Contexte d’entrée

Fin CE-T03-09 ; mode DURATION ; sideMode UNILATERAL.

### 4. Contexte de sortie / destinations

Fin Série → Pause si positive, y compris la Pause terminale après la dernière Série → Fin d’exercice propre applicable → CE-T03-13. Aucune récupération de côté en unilatéral, aucune récupération post-occurrence en direct.

### 5. Données affichées et source de vérité

**Cible par Série (13/10) :** fin automatique seulement en Durée chiffrée ; Suivant pour Répétitions ou toute cible À l’échec. Pas de nominal pour l’échec, même avec bip. Relevé par occurrence/côté : durée de dernière tentative ou répétitions estimées/déclarées ; non bloquant. Voir chapitre 08, Cibles et relevés d’exécution. Aucun nouveau layout de saisie/restitution n’est livré dans cette passe.

Snapshot uniquement ; série courante, cible temps, temps restant, progression locale.

Paramètres de la Série courante issus de l’instantané variable/uniforme ; ordres v13. En direct : total intrinsèque, Pause terminale normale, aucune récupération contextuelle.

Cadence éventuelle issue de la Série de l’instantané, jamais du Profil ou des chiffres Figma. Temps réellement dépensé cumulatif distinct du chrono de tentative ; bip applicable aux deux modes, sans modifier leur terminaison propre.

### 6. Classification des valeurs Figma

Nom/temps/série = dynamiques ; commandes = statiques ; exemples = démonstration.

### 7. Structure de l’écran

Nom Exercice → Catégorie → chrono courant et Série → commandes du shell ; côté absent ; Tour/Cycle absents ; média conditionnel.

### 8. Éléments obligatoires

Compte à rebours de Série ; numéro/total de Séries ; temps total actif ; Catégorie sous le nom ; commandes Réinitialiser, Pause, Suivant et son/vocal ; mode et unité non ambigus.

Série n/N ; côté courant distinct uniquement en bilatéral, absent en unilatéral ; aucune barre par Série. À suivre affiche la phase réelle : Pause (y compris terminale) ou, uniquement en bilatéral, Pause entre les côtés ; aucune Récupération en direct.

### 9. Layout déterministe

Réutiliser groupes visuels du Shell ; supprimer plutôt que remplacer par valeurs fictives les blocs Session-only.

### 10. Responsive, Safe Areas, texte, scroll et clavier

360/402/440 ; pas clavier ; commandes restent dans Safe Area ; pas scroll principal si Shell n’en prévoit pas.

### 11. États de l’écran

Préparation/compte à rebours propre ; Série active ; pause inter-Séries ; pause utilisateur ; confirmation saut/reset ; Fin propre ; fin/interruption ; média éventuel. Pas de phase récupération unilatérale.

### 12. Contrôles et interactions

Réinitialiser et Suivant selon table§4.12 ; Pause suspend les horloges actives ; terminer volontairement depuis Pause. Confirmation saut avant zéro produit le résultat partiel correspondant.

Si la Série est en Répétitions avec bip, appliquer Bip v2 : nominal sans transition, Suivant normal ; dans les deux autres modes, le bip est périodique sans changer leur terminaison ; Pause/Reprise sur intervalle complet ; reset de portée existante avec temps réel conservé. En préparation/phase chronométrée, conserver le décompte propre. Média/retournement ne déclenchent pas Pause.

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

Pause après chaque série, dernière comprise, même N1. Hors circuit de séries, PN puis PC se cumulent à la frontière des côtés successifs ; ordre par paire selon paramètres d’exercice du chapitre 08. Dans un circuit de séries : premier côté → PC → second côté → Pi, déroulement unique ; R positive remplace Pi terminale. Seule la toute dernière Pause est remplacée si une récupération positive suit l’Exercice ; sans elle (ou R0), conserver PN. En direct, conserver PN sans récupération contextuelle. Réordonner les Séries réévalue la dernière Pause.

Aucun Tour/Cycle/SESSION_END ; calculs existants inchangés.

### 20. Recette déterministe

Vérifier alternance chiffré/échec, sécurité2h sans nominal, progression des cibles inconnues à Suivant ; reset20s puis35s donne55s cumulé et35s relevé. Suivant ne confirme pas implicitement un nombre de bips estimé.

Durée 1 s et plusieurs Séries avec pause 0/>0 ; fin naturelle, saut anticipé confirmé/annulé, reset, pause/reprise/arrêt, Fin propre 0/>0 ; aucun Tour/Cycle/récupération post-occurrence. Vérifier Catégorie, chrono et conservation du temps global après reset.

Vérifier les deux ordres et directions, valeurs variables, PC0 sans repli, Pause terminale et N1 normalisé. Ne pas déduire les transitions du câblage Figma.

Vérifier passage entre préparation, Série cadencée, pauses programmées et fin ; deux côtés/deux ordres si applicables ; reset préservant autre côté et temps cumulé ; absence de double signal/transition. Bip valide dans les deux modes ; aucun signal hors phase Série.

## CE-T03-11 — Exécution directe — Répétitions et À l’échec

### 1. Identification

Bloc B5 ; états S57/S58 ; T03-E E40/E43 ; Shell Execution partagé.

### 2. Finalité fonctionnelle

Exécuter REPETITIONS avec/sans cadence ou toute Série à cible À l’échec, y compris DURATION ; chronomètre croissant, Suivant fin normale. Avec cible chiffrée et cadence la durée prescrite Ri×Ci est estimée et ne termine pas la Série.

### 3. Contexte d’entrée

Fin préparation CE-T03-09 avec mode REPETITIONS ou première cible À l’échec ; transition depuis une Série chiffrée lorsque la Série suivante est À l’échec.

### 4. Contexte de sortie / destinations

Suivant → fin Série → Pause / Série suivante / `SIDE_RECOVERY` éventuelle selon le côté et le plan, puis CE-T03-13 ; jamais `POST_ACTIVITY_RECOVERY`.

### 5. Données affichées et source de vérité

**Cible par Série (13/10) :** fin automatique seulement en Durée chiffrée ; Suivant pour Répétitions ou toute cible À l’échec. Pas de nominal pour l’échec, même avec bip. Relevé par occurrence/côté : durée de dernière tentative ou répétitions estimées/déclarées ; non bloquant. Voir chapitre 08, Cibles et relevés d’exécution. Aucun nouveau layout de saisie/restitution n’est livré dans cette passe.

REPETITIONS chiffrées : cible du snapshot. Toute cible À l’échec : aucun nombre prescrit ; mode conservé pour l’unité du relevé. Pauses/Récupérations : durées connues snapshot.

Paramètres de la Série courante issus de l’instantané variable/uniforme ; ordres v13. En direct : total intrinsèque, Pause terminale normale, aucune récupération contextuelle.

REPETITIONS : cadence et cible prescrites de l’instantané. État cadence avant/après nominal, progression interne, temps actif cumulé et chrono tentative séparés.

### 6. Classification des valeurs Figma

Cibles REPETITIONS = dynamiques ; absence de cible Failure = règle métier ; exemples = démonstration.

### 7. Structure de l’écran

Shell Exécution : nom, Catégorie, côté si applicable, numéro de Série, cible de répétitions ou À l’échec, chronomètre croissant et commandes ; Tour/Cycle absents.

### 8. Éléments obligatoires

Chronomètre courant initial 00:00, cible Répétitions inchangée par reset, aucune cible chiffrée en À l’échec. Suivant termine normalement la Série ; Catégorie toujours sous le nom.

Série n/N ; côté courant distinct uniquement en bilatéral, absent en unilatéral ; aucune barre par Série. À suivre affiche la phase réelle : Pause (y compris terminale) ou, uniquement en bilatéral, Pause entre les côtés ; aucune Récupération en direct.

Bip périodique positif : premier signal après un intervalle, puis jusqu’à fin/Pause de Série, même après le nominal Répétitions. Aucun signal périodique maintenu après nominal sans signal final distinct ni bip minute superposé. Aucun compteur de répétitions réalisées. Durée conserve sa fin au zéro du minuteur ; À l’échec reste manuel.

### 9. Layout déterministe

Même architecture visuelle que CE-T03-10 ; ne jamais combler un espace Failure par une durée ou répétition fictive.

Conserver le shell et les commandes existantes. Les états cadencés sont spécifiés fonctionnellement ; placement d’un éventuel libellé de cadence/nominal non certifié faute de frame. Ne pas créer un indicateur par Série ou un nouveau design.

La durée cible Ri×Ci, lorsqu’affichée, utilise la ligne de temps existante et le style du compte à rebours, sans nouveau shell. Elle est une estimation ≈, aucun compteur automatique de répétitions.

### 10. Responsive, Safe Areas, texte, scroll et clavier

360/402/440 ; pas clavier ; labels modes non tronqués.

### 11. États de l’écran

Série Répétitions/À l’échec ; pause inter-Séries ; côté suivant via CE-T03-12 ; pause utilisateur ; fin propre ; résultat terminé/interrompu.

Cadencée avant nominal ; nominal atteint sans Suivant ; Pause/Reprise avec intervalle complet ; reset. Ces variantes fonctionnelles réemploient le layout existant et ne nécessitent pas trois maquettes dédiées (CAD-V02–04 levées comme réserves de développement).

### 12. Contrôles et interactions

Suivant valide normalement la Série sans confirmation de saut chronométré, puis applique pause/Série/côté/Fin propre selon plan. Réinitialiser remet le chronomètre courant 00:00 sans changer cible ni temps total déjà écoulé ; portée bilatérale spécifique §4.12.

Suivant anticipé en cadence acquiert le reste du poids sans confirmation ni Partielle due à la durée. Pause conserve le temps réel, abandonne la fraction pour progression ; Reprendre lance un intervalle complet. Réinitialiser : chrono tentative0 et cadence intervalle1, accumulateur réel conservé.

### 13. Gestes

Tap commandes uniquement.

### 14. Validation

Chaque Série exige une cible typée : nombre valide ou À l’échec. Absence/invalide n’équivaut pas à l’échec. Bip0..10 valide dans les deux modes, entier obligatoire,0=Aucun. Aucune estimation forfaitaire ni transition déclenchée par le bip.

### 15. Brouillon et persistance

Résultat persistant par Série/côté : prescription instantanée et temps actif cumulé, y compris fraction abandonnée et tentatives reset. Aucun compte réel de répétitions.

### 16. Navigation et conservation d’état

Enchaînement interne du plan ; fin CE-T03-13.

### 17. Erreurs et cas limites

Double tap Suivant idempotent/protégé ; reprise après interruption ne crée pas une Série supplémentaire.

Arrière-plan continue par ancres, signaux manqués non rejoués ; seuil30min après nominal recalculé si cadence,2h sans cadence/À l’échec. Audio à qualifier sur appareil.

### 18. Accessibilité

Mode et cible utile annoncés ; Failure n’annonce aucune cible fausse ; Suivant clairement nommé.

Cadence et état utiles annoncés sans dépendre du son ; ne pas annoncer chaque seconde ni un nombre réalisé supposé. Suivant reste accessible après nominal.

### 19. Invariants

Pause après chaque série, dernière comprise, même N1. Hors circuit de séries, PN puis PC se cumulent à la frontière des côtés successifs ; ordre par paire selon paramètres d’exercice du chapitre 08. Dans un circuit de séries : premier côté → PC → second côté → Pi, déroulement unique ; R positive remplace Pi terminale. Seule la toute dernière Pause est remplacée si une récupération positive suit l’Exercice ; sans elle (ou R0), conserver PN. En direct, conserver PN sans récupération contextuelle. Réordonner les Séries réévalue la dernière Pause.

Failure sans cible ; Suivant normal ; aucune confirmation chronométrée ; pas SESSION_END.

D-302 confirme tous les signaux et comportements de cadence ; ≈ ne signifie pas absence de guidage.

### 20. Recette déterministe

Vérifier alternance chiffré/échec, sécurité2h sans nominal, progression des cibles inconnues à Suivant ; reset20s puis35s donne55s cumulé et35s relevé. Suivant ne confirme pas implicitement un nombre de bips estimé.

Deux modes, N=1/N>1, cible 1/100, reset après temps écoulé, Suivant sans dialogue, pauses 0/>0, changement de côté et Fin propre. Aucun total cible inventé pour À l’échec ; aucun Tour/Cycle ni récupération post-occurrence.

Vérifier les deux ordres et directions, valeurs variables, PC0 sans repli, Pause terminale et N1 normalisé. Ne pas déduire les transitions du câblage Figma.

10×4s : début0, bips4..36, final40 ; Suivant20/45s normal ; Pause6s puis intervalle4s complet ; reset6s puis10s → réel16s. Arrière-plan sans rejeu ; après nominal aucun bip, Série active. Recette prescrite, non exécutée.

## CE-T03-12 — Exécution directe — bilatéralité, Pauses, Récupération

### 1. Identification

Bloc B5 ; états S59–S62 ; T03-E E40–E41 ; Shell Execution ; sous-titre côté validé D-149.

### 2. Finalité fonctionnelle

L’ordre d’exécution vient du paramètre Ordre des côtés : Un côté après l’autre (défaut) ou Les deux côtés à chaque série. En bilatéral N est toujours par côté, paramètres communs aux deux côtés. Les successions et pauses sont celles de chapitre 08, paramètres d’exercice ; aucun repli de PC vers la Pause. Les cibles et Pauses variables proviennent de la ligne courante. Aucune récupération post-exercice en ACTIVITY.

### 3. Contexte d’entrée

Après préparation d’un snapshot bilatéral.

### 4. Contexte de sortie / destinations

Séries/pauses premier côté → SIDE_RECOVERY si positive → Séries/pauses second → Fin propre applicable → CE-T03-13.

### 5. Données affichées et source de vérité

sideMode snapshot ; executionSide RIGHT/LEFT ; résultats séparés par côté.

Paramètres de la Série courante issus de l’instantané variable/uniforme ; ordres v13. En direct : total intrinsèque, Pause terminale normale, aucune récupération contextuelle.

Cadence éventuelle issue de la Série de l’instantané, jamais du Profil ou des chiffres Figma. Temps réellement dépensé cumulatif distinct du chrono de tentative ; bip applicable aux deux modes, sans modifier leur terminaison propre.

### 6. Classification des valeurs Figma

`Côté droit/gauche` = libellés calculés ; ordre vient sideMode, jamais de la frame d’exemple.

### 7. Structure de l’écran

Shell Execution + nom + sous-titre côté + information Série/mode + commandes.

### 8. Éléments obligatoires

Sous-titre côté ; aucun `1/2`/`2/2`; même rang logique Activity entre côtés ; Pauses suivant v13, Pause terminale comprise ; Pause entre les côtés éventuelle avant le second passage.

Série n/N ; côté courant distinct uniquement en bilatéral, absent en unilatéral ; aucune barre par Série. À suivre affiche la phase réelle : Pause (y compris terminale) ou, uniquement en bilatéral, Pause entre les côtés ; aucune Récupération en direct.

### 9. Layout déterministe

Nom puis Catégorie, et ligne Côté droit/gauche distincte du contexte ; aucun compteur 1/2 ou 2/2. Pas de Tour en direct ; dimensions du shell courant.

### 10. Responsive, Safe Areas, texte, scroll et clavier

360/402/440 ; sous-titre reste lisible ; aucune collision avec titre ou timer.

### 11. États de l’écran

Premier côté ; Pause intra-côté ; Pause entre les côtés éventuelle ; second côté ; Partial side ; fin intrinsèque.

### 12. Contrôles et interactions

Ordre D→G/G→D strict. Réinitialiser ne touche que le côté courant et conserve l’autre résultat. Saut confirmé du premier côté chronométré : résultat partiel conservé, second côté selon D-150 ; transition selon la succession du plan v13 (§6 R-03).

Si la Série est en Répétitions avec bip, appliquer Bip v2 : nominal sans transition, Suivant normal ; dans les deux autres modes, le bip est périodique sans changer leur terminaison ; Pause/Reprise sur intervalle complet ; reset de portée existante avec temps réel conservé. En préparation/phase chronométrée, conserver le décompte propre. Média/retournement ne déclenchent pas Pause.

### 13. Gestes

Tap commandes uniquement.

### 14. Validation

Pi est stockée et exécutée après chaque Série, dernière comprise. À la frontière des côtés successifs, PN puis PC se cumulent. Par paire, Pi suit chaque paire, dernière comprise, et PC reste dans chaque paire. Seule la toute dernière Pause est remplacée par la récupération positive qui suit l’occurrence ; aucune récupération en direct. N=1 normalisé uniforme/par côté. Formules et séquences : chapitre 10, Calculs des durées et ordre des phases.

### 15. Brouillon et persistance

Résultats séparés par executionSide ; réinitialisation ne détruit pas résultat autre côté.

### 16. Navigation et conservation d’état

Transitions internes au plan ; aucun écran intermédiaire Session.

### 17. Erreurs et cas limites

Interruption entre côtés ; reprise sur bon side ; side result déjà finalisé ne doit pas être dupliqué.

### 18. Accessibilité

Annonce vocale côté au début et au changement selon règles ; label accessible développé même si UI courte ailleurs.

### 19. Invariants

Pause après chaque série, dernière comprise, même N1. Hors circuit de séries, PN puis PC se cumulent à la frontière des côtés successifs ; ordre par paire selon paramètres d’exercice du chapitre 08. Dans un circuit de séries : premier côté → PC → second côté → Pi, déroulement unique ; R positive remplace Pi terminale. Seule la toute dernière Pause est remplacée si une récupération positive suit l’Exercice ; sans elle (ou R0), conserver PN. En direct, conserver PN sans récupération contextuelle. Réordonner les Séries réévalue la dernière Pause.

Respecter l’ordre effectif : successif, PC une fois ; par paire, PC à chaque Série. Pi et PC selon chapitre 08, paramètres d’exercice ; aucune Récupération contextuelle en ACTIVITY ; résultats séparés par côté ; rang logique Exercice inchangé.

L’ajout explicite de recovery concerne SESSION seulement ; aucune récupération contextuelle en ACTIVITY. Cadence sonore propre à chaque Série/côté conservée.

### 20. Recette déterministe

D→G/G→D, C=1/2/99, pause inter-Séries 0/>0, SIDE_RECOVERY0/>0, reset second préservant premier, interruption pendant SIDE_RECOVERY, absence de récupération après second. Tester saut anticipé avec pC>0 puis pC=0/pS>0 puis les deux à zéro ; respecter les cumuls Pi puis PC en ordre successif et la succession PC puis Pi après paire en ordre alterné.

Vérifier les deux ordres et directions, valeurs variables, PC0 sans repli, Pause terminale et N1 normalisé. Ne pas déduire les transitions du câblage Figma.

Vérifier passage entre préparation, Série cadencée, pauses programmées et fin ; deux côtés/deux ordres si applicables ; reset préservant autre côté et temps cumulé ; absence de double signal/transition. Bip valide dans les deux modes ; aucun signal hors phase Série.

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

Paramètres de la Série courante issus de l’instantané variable/uniforme ; ordres v13. En direct : total intrinsèque, Pause terminale normale, aucune récupération contextuelle.

Cadence éventuelle issue de la Série de l’instantané, jamais du Profil ou des chiffres Figma. Temps réellement dépensé cumulatif distinct du chrono de tentative ; bip applicable aux deux modes, sans modifier leur terminaison propre.

### 6. Classification des valeurs Figma

Statut/temps = dynamiques ; libellés confirmation = statiques ; aucune valeur de fin de Séance applicable.

### 7. Structure de l’écran

Commandes et dialogue d’arrêt selon§4.12 ; transition de fin vers Synthèse ; aucun composant SESSION_END.

### 8. Éléments obligatoires

Signal de fin, statut persisté, Synthèse sur fin normale/arrêt volontaire ; interruption technique sans Synthèse seulement si présentation impossible.

Série n/N ; côté courant distinct uniquement en bilatéral, absent en unilatéral ; aucune barre par Série. À suivre affiche la phase réelle : Pause (y compris terminale) ou, uniquement en bilatéral, Pause entre les côtés ; aucune Récupération en direct.

### 9. Layout déterministe

Réutiliser composants communs. Ne pas ajouter carte/phase Fin de séance.

### 10. Responsive, Safe Areas, texte, scroll et clavier

Selon Shell Execution et dialogue commun ; 360/402/440.

### 11. États de l’écran

Fin naturelle, fin partielle, arrêt confirmé/annulé, interruption technique, fin propre, Synthèse en attente de finalisation.

### 12. Contrôles et interactions

Pause puis Arrêter ouvre confirmation ; Annuler reprend l’état suspendu ; confirmer clôt une seule Exécution et présente Synthèse si possible. Aucun bouton Retour ne remplace l’arrêt confirmé.

Si la Série est en Répétitions avec bip, appliquer Bip v2 : nominal sans transition, Suivant normal ; dans les deux autres modes, le bip est périodique sans changer leur terminaison ; Pause/Reprise sur intervalle complet ; reset de portée existante avec temps réel conservé. En préparation/phase chronométrée, conserver le décompte propre. Média/retournement ne déclenchent pas Pause.

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

Pause après chaque série, dernière comprise, même N1. Hors circuit de séries, PN puis PC se cumulent à la frontière des côtés successifs ; ordre par paire selon paramètres d’exercice du chapitre 08. Dans un circuit de séries : premier côté → PC → second côté → Pi, déroulement unique ; R positive remplace Pi terminale. Seule la toute dernière Pause est remplacée si une récupération positive suit l’Exercice ; sans elle (ou R0), conserver PN. En direct, conserver PN sans récupération contextuelle. Réordonner les Séries réévalue la dernière Pause.

Aucun SESSION_END ; aucun Session count ; origin ACTIVITY intact.

### 20. Recette déterministe

Fin 0/>0 ; plan terminé/partiel ; arrêt depuis Pause confirmé/annulé ; interruption technique sans Synthèse ; clôture idempotente et aucune duplication historique ; retour par contexte après Enregistrer.

Vérifier les deux ordres et directions, valeurs variables, PC0 sans repli, Pause terminale et N1 normalisé. Ne pas déduire les transitions du câblage Figma.

Vérifier passage entre préparation, Série cadencée, pauses programmées et fin ; deux côtés/deux ordres si applicables ; reset préservant autre côté et temps cumulé ; absence de double signal/transition. Bip valide dans les deux modes ; aucun signal hors phase Série.

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

Le futur relevé À l’échec distingue chronométré, estimé, déclaré et non renseigné, par occurrence/côté ; il ne remplace pas le temps actif cumulé. Exigence de données validée ; implantation des champs de saisie et de restitution hors périmètre de cette passe, aucun emplacement nouveau supposé.

Instantané Exercice, statut et durée réelle issus de l’Exécution ACTIVITY ; Ressenti et Commentaire issus du brouillon de finalisation. Les statistiques ne comptent pas de Séance. Les résultats partiels sont conservés sans inventer un compteur de Tours.

La cadence prescrite est conservée dans l’instantané ; durée affichée réelle, cumulant intervalles abandonnés et tentatives reset par Série/côté. Aucun nombre de répétitions réellement effectué n’est inféré. Aucun nouveau champ de saisie en Synthèse.

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

10×4s terminé avec Suivant20s : temps réel20s et fin normale ; reset6s puis10s : cumulé16s ; modifier la définition après exécution ne change pas prescription/résultat. Aucun symbole d’estimation collé au temps réel.

## CE-T03-15 — Suivi général — Exécution ACTIVITY

### 1. Identification

Suivi général ; frame courante 1992:8843 et état vide 2117:190. Carte ACTIVITY à deux lignes ; 1992:8996 est historique hors MVP. Copies exclusivement au chapitre 06.

### 2. Finalité fonctionnelle

Afficher les Exécutions directes dans le Suivi général comme type Exercice sans compter une Séance.

### 3. Contexte d’entrée

Navigation Suivi ; retour d’autres écrans Suivi.

### 4. Contexte de sortie / destinations

Navigation globale ; aucun déploiement de carte. Pas de dépendance à l’ActivityDefinition source pour lire l’historique.

### 5. Données affichées et source de vérité

Le futur relevé À l’échec distingue chronométré, estimé, déclaré et non renseigné, par occurrence/côté ; il ne remplace pas le temps actif cumulé. Exigence de données validée ; implantation des champs de saisie et de restitution hors périmètre de cette passe, aucun emplacement nouveau supposé.

Exécutions SESSION et ACTIVITY clôturées, ordre chronologique décroissant ; type depuis origine, titre/paramètres depuis instantané et résultats, pas source courante. Groupes de dates ; nature, titre, statut, durée réelle, catégorie et Ressenti lorsqu’il existe. Heure, zones et étiquettes restent enregistrées mais ne sont pas affichées dans la carte. ACTIVITY ne compte pas comme Séance.

La cadence prescrite est conservée dans l’instantané ; durée affichée réelle, cumulant intervalles abandonnés et tentatives reset par Série/côté. Aucun nombre de répétitions réellement effectué n’est inféré. Aucun nouveau champ de saisie en Synthèse.

### 6. Classification des valeurs Figma

Nom/date/durée/statut = dynamiques ; `Exercice` = dérivé origin ; exemples de cartes = démonstration.

### 7. Structure de l’écran

Liste Suivi mixte ; cartes à deux lignes sans photo ni déploiement ; contenu historique issu du snapshot.

### 8. Éléments obligatoires

Ligne 1 : nature 26 liste ou tai-chi, titre15, statut76 aligné à droite. Ligne 2 : durée réelle, catégorie en pastille20, Ressenti20 × 20 aligné à droite. Aucun chevron, heure, zones corporelles ni étiquettes. Ressenti informatif, sans cible tactile ni action. Aucune Vue d’ensemble requise au MVP. Aucun miroir des cartes Catalogue ajouté au Suivi.

### 9. Layout déterministe

Composants actifs et propriété Durée : [DSF cartes du07/10](../DSF-CARTES-DUREE-2026-10-07.md). La suppression du cadre de durée Catalogue ne change pas le contrat de cette variante : sélecteurs sans durée, Suivi avec durée réelle, Calendrier avec données de planification. Ne pas injecter une durée à cause du défauttrue de la propriété Figma.

Carte354 × 67 à texte standard ; bloc texte y12/hauteur43 ; statut x262/y9 (76 × 24), Ressenti x318/y39 (20 × 20), marge droite16. Marge haute12/basse8 assumée. Ces coordonnées sont la référence Figma402, pas des positions absolues à imposer au responsive. Pas de champs Session-only fictifs sur activité. Filtrer/Trier 34, dessins 20, gap 12, cibles 44 ; liste scrollable, navigation fixe.

Durée des cartes : chronomètre16×16, trait0,9, #9499A8 lié au rôle catégorie ; texte durée #595E66 et nature #14141A. Suivi = temps réalisé, sans symbole prévisionnel ; Calendrier = nature de calcul fournie.

### 10. Responsive, Safe Areas, texte, scroll et clavier

360/402/440 ; liste scrollable ; carte adapte sa hauteur au texte agrandi sans réduire la police ; aucun clavier hors fonctions existantes.

### 11. États de l’écran

Liste vide ; cartes à deux lignes sans déploiement ; ACTIVITY/SESSION ; trois statuts ; Ressenti présent/absent après interruption technique. Vue d’ensemble/Filtrer/Trier visibles désactivés, aucune recherche.

### 12. Contrôles et interactions

Navigation globale, aucune action sur Ressenti et aucun déploiement ; commandes Suivi existantes selon statut de disponibilité.

### 13. Gestes

Scroll. Aucun geste modifiant historique.

### 14. Validation

Lecture historique depuis snapshot même si source n’existe plus. Calculs stats doivent respecter sémantique origin.

### 15. Brouillon et persistance

Lecture seule. Aucun changement snapshot/results depuis Suivi.

### 16. Navigation et conservation d’état

Conserver scroll pendant l’aller-retour du parcours courant. Après nouvelle Synthèse de Séance, afficher l’Exécution créée. Une source supprimée ne supprime pas sa carte historique.

### 17. Erreurs et cas limites

Source supprimée : carte reste lisible. Snapshot ancien : appliquer compatibilité migration/lecture existante.

### 18. Accessibilité

Type, titre, statut, durée, catégorie et Ressenti annoncé lorsqu’il existe ; dates des groupes accessibles. L’indicateur Ressenti n’est pas présenté comme un bouton. Aucun déployer/replier annoncé.

### 19. Invariants

Historique indépendant source ; origin ACTIVITY ; compteur Séances inchangé.

### 20. Recette déterministe

SESSION/ACTIVITY, statuts, source modifiée/supprimée, instantané conservé, absence Ressenti technique, deux lignes, absence de photo/heure/zones/étiquettes/chevron, liste vide. Filtrer/Trier/Vue d’ensemble sans action ; aucune Recherche. Carte ACTIVITY présente dans 1992:8843 ; aucune variante déployée n’est requise au MVP. Ressenti n’a ni action ni cible tactile.

10×4s terminé avec Suivant20s : temps réel20s et fin normale ; reset6s puis10s : cumulé16s ; modifier la définition après exécution ne change pas prescription/résultat. Aucun symbole d’estimation collé au temps réel.

## CE-T03-16 — Étiquettes de Séance — sélectionner, créer, retirer

### 1. Identification

Modale de Composition 2028:11204, sélection 4581:6404, création 4640:6308, suppression 4861:6145. Remplace le contrat obsolète de page finale Catégories ; ID conservé pour traçabilité.

### 2. Finalité fonctionnelle

Associer zéro ou une Étiquette au brouillon de Séance et administrer le référentiel sans étape supplémentaire de sauvegarde de Séance.

### 3. Contexte d’entrée

Action Étiquette dans CE-T03-08, avec sélection courante et brouillon conservés.

### 4. Contexte de sortie / destinations

Toucher marque une Étiquette ; ✓ applique le choix puis ferme vers Composition ; ✕ laisse la sélection antérieure. Un nouveau toucher sur l’Étiquette marquée la démarque ; ✓ confirme alors le retrait (zéro Étiquette) (D-355, remplace le choix au toucher et D-259 sur ce point). Nouvelle Étiquette ouvre la création dans cette famille.

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

Actions destructives : token danger#D92D20 ; séparateurs#E0E3E8 et labels par rôle DSF. Aucune reprise des anciens rouges locaux.

Étiquette contour au repos, pleine durant le panneau contextuel ; cercle blanc/trait inchangé. La sélection d’une valeur ne remplace pas la distinction ouvert/fermé.

### 10. Responsive, Safe Areas, texte, scroll et clavier

Feuille limitée à la zone sûre, liste défilante, titre non tronqué ; clavier fait apparaître le nom saisi et les actions ; texte agrandi selon§4.2.

### 11. États de l’écran

Aucune/une Étiquette ; liste vide ; création ; nom invalide ; sélection retirée existante ; appui long ; suppression confirmée/annulée ; erreur.

### 12. Contrôles et interactions

Tap valide une sélection simple ; appui long ne change pas la sélection et ouvre le dialogue Modifier/Supprimer (D-259). Créer valide le référentiel ; son affectation reste dans le brouillon de Séance. La suppression globale conserve les affectations existantes D-210.

### 13. Gestes

Tap, scroll, appui long option ; fermeture hors dialogue n’exécute jamais Supprimer. Pas de drag des options.

### 14. Validation

Nom de nouvelle Étiquette non vide et unique dans le référentiel ; couleur choisie dans palette. Un nom correspondant à une Étiquette retirée la réactive avec la couleur choisie (D-257). Aucune Étiquette exigée pour Continuer dans Composition ; affectation retirée existante reste conservable.

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

Vérifier icône sur ouverture, annulation et validation du panneau.

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

Aucune préférence Cadence ajoutée au Profil ; sons selon réglages existants. Barre d’état native et Safe Areas, pas9:41/95px codés en dur. DSF courant§4.14.

### 20. Recette déterministe

Tester les quatre destinations, labels accessibles, état actif, dimensions et Safe Areas ; relance Catalogue/Séances ; aucune action ni bouton Recherche ; ne pas confondre une variante DSF inutilisée avec une route produit.

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

Cadence éventuelle issue de la Série de l’instantané, jamais du Profil ou des chiffres Figma. Temps réellement dépensé cumulatif distinct du chrono de tentative ; bip applicable aux deux modes, sans modifier leur terminaison propre.

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

Si la Série est en Répétitions avec bip, appliquer Bip v2 : nominal sans transition, Suivant normal ; dans les deux autres modes, le bip est périodique sans changer leur terminaison ; Pause/Reprise sur intervalle complet ; reset de portée existante avec temps réel conservé. En préparation/phase chronométrée, conserver le décompte propre. Média/retournement ne déclenchent pas Pause.

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

Cadence sonore et progression continuent lors du changement de face ; symbole prévisionnel ≈ sans effet sur la durée réelle.

### 20. Recette déterministe

Tester 0/1/N médias, mélange image/vidéo, premier/dernier, un swipe=un média, retour Information pendant lecture, retour même Exercice et autre Tour, nouveau run, erreur média, ducking, plein écran, fin naturelle et saut d’Exercice. Vérifier réduction des animations et contrôles accessibles ; essais interactifs nécessaires.

Vérifier passage entre préparation, Série cadencée, pauses programmées et fin ; deux côtés/deux ordres si applicables ; reset préservant autre côté et temps cumulé ; absence de double signal/transition. Bip valide dans les deux modes ; aucun signal hors phase Série.

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

Cadence éventuelle issue de la Série de l’instantané, jamais du Profil ou des chiffres Figma. Temps réellement dépensé cumulatif distinct du chrono de tentative ; bip applicable aux deux modes, sans modifier leur terminaison propre.

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

Si la Série est en Répétitions avec bip, appliquer Bip v2 : nominal sans transition, Suivant normal ; dans les deux autres modes, le bip est périodique sans changer leur terminaison ; Pause/Reprise sur intervalle complet ; reset de portée existante avec temps réel conservé. En préparation/phase chronométrée, conserver le décompte propre. Média/retournement ne déclenchent pas Pause.

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

Consulter le média ne crée ni Pause utilisateur ni cadence implicite ; comportements D-302 conservés.

### 20. Recette déterministe

Image/vidéo, portrait/paysage, fermer/revenir, pause vidéo sans pause moteur, pause moteur distincte, ducking, erreur, fin de Série puis changement d’Exercice, arrêt confirmé ; vérifier focus/texte agrandi et absence de Tour ACTIVITY.

Vérifier passage entre préparation, Série cadencée, pauses programmées et fin ; deux côtés/deux ordres si applicables ; reset préservant autre côté et temps cumulé ; absence de double signal/transition. Bip valide dans les deux modes ; aucun signal hors phase Série.

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

Photo locale facultative choisie dans la galerie (D-258), nom d’affichage et silhouette facultative homme/femme ; absence silhouette affiche homme. Les champs viennent du brouillon de Profil, pas de données d’événement.

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

Nom vide/trop long : erreur liée au champ, rester ; photo indisponible : avatar/initiales sans empêcher l’accès aux champs ; choix de photo annulé : aucune modification ; échec de lecture ou de copie : message, brouillon conservé ; erreur sauvegarde : conserver brouillon, aucune mutation partielle.

### 18. Accessibilité

Labels Silhouette homme / Silhouette femme ; état sélectionné annoncé.

### 19. Invariants

Aucun effet sur recherche, catégories, calculs, exécutions ou données historiques.

Aucune préférence Cadence ajoutée au Profil ; sons selon réglages existants. Barre d’état native et Safe Areas, pas9:41/95px codés en dur. DSF courant§4.14.

### 20. Recette déterministe

Nom 1/80/vide/81, photo absente/présente/indisponible ; silhouette absente→homme, choisir femme/enregistrer/relancer ; abandon sans écriture ; erreur persistance ; vérifier toutes icônes de zone et aucun effet filtre/calcul/historique.

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

Durée et symbole viennent du calcul commun : Durée exacte, Répétitions avec bip ≈, sans bip et À l’échec omis à l’Exercice ; ≥ seulement à la Séance avec travail inconnu ; périmètre intrinsèque ACTIVITY ou occurrence SESSION selon§4.14. Ne rien ajouter dans les choix où la durée est masquée.

### 6. Classification des valeurs Figma

Noms, dates, durées et couleurs d’événement sont des données ; les exemples Figma ne deviennent pas des constantes ni des règles de déduction.

### 7. Structure de l’écran

Navigation de date et grille horaire ; cartes à droite de la colonne des heures ; navigation basse.

### 8. Éléments obligatoires

Barre couleur 4 ; nature 26 ; titre 13 gras ; heure/durée 11 gris ; Lecture 26. Aucun Déployer.

### 9. Layout déterministe

Composants actifs et propriété Durée : [DSF cartes du07/10](../DSF-CARTES-DUREE-2026-10-07.md). La suppression du cadre de durée Catalogue ne change pas le contrat de cette variante : sélecteurs sans durée, Suivi avec durée réelle, Calendrier avec données de planification. Ne pas injecter une durée à cause du défauttrue de la propriété Figma.

Référence 402 : x80, largeur 298 ; séance 46 de haut, exercice 48. Hauteur d’instance adaptée à l’événement. Exemple heure/durée : 08 h · 13 min.

Durée des cartes : chronomètre16×16, trait0,9, #9499A8 lié au rôle catégorie ; texte durée #595E66 et nature #14141A. Suivi = temps réalisé, sans symbole prévisionnel ; Calendrier = nature de calcul fournie.

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

Comparer sources Durée, Répétitions avec/sans cadence et À l’échec dans les emplacements de durée existants ; conserver masquages des cartes de choix, aucune formule locale et aucune photo de Séance/liste mixte.

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

Sources SESSION : durées d’occurrence et total de Séance sans double ajout de R ; ACTIVITY : durée intrinsèque ; chapitre 08, paramètres d’exercice.

Durée et symbole viennent du calcul commun : Durée exacte, Répétitions avec bip ≈, sans bip et À l’échec omis à l’Exercice ; ≥ seulement à la Séance avec travail inconnu ; périmètre intrinsèque ACTIVITY ou occurrence SESSION selon§4.14. Ne rien ajouter dans les choix où la durée est masquée.

### 6. Classification des valeurs Figma

Noms, dates, durées et couleurs d’événement sont des données ; les exemples Figma ne deviennent pas des constantes ni des règles de déduction.

### 7. Structure de l’écran

Semaine : segmenté, barre 7 jours, sections chronologiques, navigation fixe. Mois : grille 7colonnes, navigation mensuelle, jour sélectionné et marqueurs d’occurrences ; ne pas appliquer les cartes de Semaine à chaque cellule du Mois.

### 8. Éléments obligatoires

Semaine : nature 26, badge heure 08:00, classement puis durée avec sablier ; statut Suivi non ajouté. Mois : grille 7colonnes conservée.

### 9. Layout déterministe

Composants actifs et propriété Durée : [DSF cartes du07/10](../DSF-CARTES-DUREE-2026-10-07.md). La suppression du cadre de durée Catalogue ne change pas le contrat de cette variante : sélecteurs sans durée, Suivi avec durée réelle, Calendrier avec données de planification. Ne pas injecter une durée à cause du défauttrue de la propriété Figma.

Carte 354×95,5 repliée ; séance déployée 254,5. Segmenté 354/padding 4/gaps 4/options 112,67. Aucune barre de carte Semaine.

Durée des cartes : chronomètre16×16, trait0,9, #9499A8 lié au rôle catégorie ; texte durée #595E66 et nature #14141A. Suivi = temps réalisé, sans symbole prévisionnel ; Calendrier = nature de calcul fournie.

### 10. Responsive, Safe Areas, texte, scroll et clavier

Références 360/402/440, Safe Areas existantes ; texte agrandi sans réduction de police, scroll utile et contrôles accessibles. Les dimensions de référence 402 ne figent pas les coordonnées sur tous les appareils.

### 11. États de l’écran

Repliée, séance déployée, jour sélectionné, actions glissées, après suppression ; Mois ; vide.

### 12. Contrôles et interactions

Semaine : sélectionner un jour place sa section en tête ; scroll synchronise jour. Déployer sur une Séance uniquement révèle détails/récurrence ; aucune carte d’Exercice ne se déploie. Lecture distincte. Glisser expose Dupliquer/Supprimer seulement. Dupliquer copie source+paramètres dans brouillon sans persister. Mois : navigation change mois, sélection change date de référence ; passage Jour/Semaine utilise cette date.

### 13. Gestes

Swipe contextuel en Semaine selon§4.7 ; Mois : tap jour/chevrons, pas de déploiement de carte mensuelle inventé ; D-237 pour les appuis.

### 14. Validation

Unique : Annuler/Confirmer suppression. Périodique : Seulement cette occurrence / Toutes les occurrences à venir / Annuler. La seconde action porte les occurrences futures de la Routine, pas d’autres Routines de la même source. Historique et source conservés.

### 15. Brouillon et persistance

Recalcul des occurrences après validation de Routine. Suppression unitaire doit rester exclue après relance et retirer sa notification ; le modèle/API doit persister l’exclusion par Routine et date/heure d’origine (§6 R-04), pas de simulation d’une suppression seulement visuelle. Duplication reste brouillon jusqu’à Enregistrer.

### 16. Navigation et conservation d’état

Après confirmation, conserver date/vue et actualiser liste/marqueurs. Après annulation, même sélection et même état. Changement de vue conserve date ; scroll Semaine synchronise la barre 7 jours.

### 17. Erreurs et cas limites

Semaine/mois vide, occurrence déjà retirée, source disparue, erreur de suppression : informer sans mutation partielle. Ne pas confondre média absent avec erreur métier. Aucune photo sur les cartes du Calendrier, quel que soit le type (D-260).

### 18. Accessibilité

Heure/type/nom annoncés ; aucune vignette dans le Calendrier ; cibles 44 hors exception explicite Aujourd’hui/Planifier.

### 19. Invariants

Récurrence seulement déployée en Semaine ; ne pas appliquer les cartes compactes Jour à Semaine ou Mois.

### 20. Recette déterministe

Semaine vide/N, deux origines, déploiement/récurrence, synchronisation jour/scroll, modification, duplication annulée/enregistrée. Suppression unique et deux choix périodiques confirmés/annulés, notifications/historique. Mois : sept colonnes, sélection, navigation de mois, retour Jour/Semaine même date, marqueurs actualisés. La recette de persistance unitaire est obligatoire ; cette documentation ne prétend pas l’avoir exécutée.

Comparer sources Durée, Répétitions avec/sans cadence et À l’échec dans les emplacements de durée existants ; conserver masquages des cartes de choix, aucune formule locale et aucune photo de Séance/liste mixte.

## CE-UI-04 — Calendrier et planification — choisir des contenus

### 1. Identification

CE-UI-04 ; sélection de contenus pour planification. Frames MVP 7599:14197 et 7594:34809 ; homologues communautaires 7599:14753 et 7600:14108. Un seul composant de choix avec des états de décompte différents.

### 2. Finalité fonctionnelle

Choisir une ou plusieurs Séances et/ou Exercices persistants pour un même créneau ; aucune entité Parcours créée.

### 3. Contexte d’entrée

Calendrier → Planifier ; formulaire CE-UI-05 → Changer ; sélection initiale éventuellement préremplie depuis une carte Catalogue.

### 4. Contexte de sortie / destinations

« Ajouter 1 élément » / « Ajouter n éléments » valide la sélection dans le brouillon et revient au formulaire. Fermer sans valider conserve la liste antérieure. Le toucher d’une carte ne ferme pas la modale.

### 5. Données affichées et source de vérité

Sources actives SESSION/ACTIVITY appartenant à l’utilisateur ; collection d’identifiants retenus. Aucun contenu de démonstration injecté en liste vide. Conserver les règles existantes de classement et les paramètres de carte sans durée/Lecture/Déployer.

### 6. Classification des valeurs Figma

Choisir des séances/Choisir des exercices dépendent du segment actif ; décompte et contenus dynamiques. Les noms et coches des exemples ne sont pas des règles de sélection.

### 7. Structure de l’écran

Titre et fermeture → segmenté Exercices/Séances → liste défilante avec cases → CTA de décompte en bas. Pas de segment Parcours.

### 8. Éléments obligatoires

Cases à cocher même pour un seul élément. Ajouter 1 élément au singulier ; Ajouter n éléments au pluriel. Le titre de la modale suit le segment actif.

### 9. Layout déterministe

Marges 24 et largeur 354 sur 402 ; CTA de référence y 802,354×48, libellé centré. Cartes de choix issues du DSF courant, sans durée ni Lecture/Déployer. Cases à droite ; pas de radios. États de sélection du contrôle de planification : retenu #5F60EE/texte blanc Semi Bold ; non retenu #F9FAFC/texte #141414 Regular.

### 10. Responsive, Safe Areas, texte, scroll et clavier

Référence 402×874, adaptations 360/440 et Safe Areas conservées. Texte agrandi sans réduction de police ; liste/formulaire défilant ; CTA ancré dans le pied sûr. Les coordonnées Figma ne sont pas des constantes absolues sur tous les appareils.

### 11. États de l’écran

Zéro, un, plusieurs éléments retenus ; liste vide/longue ; segment Séances/Exercices ; retour au brouillon ; source devenue indisponible. À zéro, ne pas créer une Routine vide ; libellé/présentation précise du CTA zéro non représentés.

### 12. Contrôles et interactions

Toucher carte/case sélectionne ou désélectionne sans fermeture. Basculer le segment change les choix affichés sans valider ; la sélection doit pouvoir contenir les deux types. Ajouter valide l’ensemble. Aucune copie SessionActivity.

### 13. Gestes

Tap et scroll ; animation Discret/action au relâchement D-237. Pas d’action d’exécution dans la modale.

### 14. Validation

Au moins un contenu actif et disponible à validation ; recontrôler les références à Enregistrer. L’ordre initial de la sélection mixte est à préciser ; le formulaire permet ensuite de réordonner. Ne pas importer implicitement l’ordre propre à la Composition.

### 15. Brouillon et persistance

Sélection locale puis transfert au brouillon ; aucune écriture Routine avant Enregistrer. Annuler restaure la sélection d’entrée.

### 16. Navigation et conservation d’état

Retour CE-UI-05 sans perdre dates, répétition, rappel et Programme déjà saisis. Le titre final est calculé depuis les types et le nombre, non le dernier segment visité.

### 17. Erreurs et cas limites

Source archivée/supprimée : signaler et revalider sans référence fantôme. Liste mixte sans photo pour tous ; Séance jamais de photo. Ne pas activer des objets autonomes Parcours.

### 18. Accessibilité

Rôle checkbox, nom/type et état coché annoncés ; texte complet accessible ; cibles minimales communes conservées et dimensions spécifiques de 48 points maintenues. Focus modal et CTA décompté accessibles.

### 19. Invariants

Même sélection pour 1 ou N ; le nombre ne change pas le mécanisme de validation. Aucun troisième type autonome ; aucune persistance au toucher.

### 20. Recette déterministe

Tester 0/1/2, mêmes types et mixte, bascule de segment sans perte, cocher/décocher, fermer/valider, source disparue, longues listes, libellés singulier/pluriel, absence de radio et de fermeture automatique. Vérifier titre suivant pour 0/1/N.

## CE-UI-05 — Planification — formulaire et états de paramètres

### 1. Identification

CE-UI-05 ; formulaire de Routine à un ou plusieurs contenus. Frames 1992:6838/6622/7187/7369/7537/7716 et 7594:34531 ; fréquence CE-UI-11 ; sélection CE-UI-04.

### 2. Finalité fonctionnelle

Créer/modifier un créneau, sa liste ordonnée, sa récurrence, son rappel et son rattachement facultatif à un Programme.

### 3. Contexte d’entrée

Calendrier, action Planifier du Catalogue avec contenu prérempli, modification ou duplication de Routine.

### 4. Contexte de sortie / destinations

Enregistrer réussi → appelant actualisé ; abandon → appelant inchangé ; Changer → CE-UI-04 ; fréquence d’une ligne → CE-UI-11. Les destinations Programme non représentées ne sont pas inventées.

### 5. Données affichées et source de vérité

Liste ordonnée de références, motifs par contenu, début/heure, répétition/unité/multiplicateur/borne, rappel, Programme. Récapitulatif dérivé de ces paramètres. Valeurs historiques non réécrites.

### 6. Classification des valeurs Figma

Libellés de structure statiques ; titre dépend du nombre/type ; noms, dates, montants et durées illustratifs dynamiques. Figma ne fournit aucune règle de calcul.

### 7. Structure de l’écran

Bloc sans titre : Programme puis Début le → Répétition → lignes de contenus si N ≥ 2, sans titre → Rappel → zone protégée du récapitulatif → Enregistrer. En-tête contextuel : Planifier, Planifier une séance, Planifier un exercice ou Planifier un parcours.

### 8. Éléments obligatoires

Programme : Aucun par défaut, facultatif. Une date et une heure. Interrupteurs Répétition/Rappel. Répétition sur Oui : Jour/Semaine/Mois, multiplicateur, borne jusqu’au/pendant ; jours de semaine pour Semaine. Rappel sur Oui : 5 min/15 min/30 min/1 h/Autre. Poignées 12×18 et fréquence générique pour chaque ligne à N ≥ 2.

### 9. Layout déterministe

Shell ModalFullscreen ; surface blanche de y 36 au bas y 874 sur référence 402×874, coins supérieurs carrés. Appliquer le DSF général pour les blocs gris, rayon 12, sans trait et espacements. Préfixe de récurrence au-dessus de la ligne porteuse ; titres Semi Bold 16, valeurs 16, libellés Medium 14, liaisons Medium 12. Récapitulatif 16 px au-dessus du CTA ; hauteur adaptée au texte ; dégradé de 40 px au-dessus, fond opaque jusqu’au bas. Le formulaire défile sous cette zone.

### 10. Responsive, Safe Areas, texte, scroll et clavier

Référence 402×874, adaptations 360/440 et Safe Areas conservées. Texte agrandi sans réduction de police ; liste/formulaire défilant ; CTA ancré dans le pied sûr. Les coordonnées Figma ne sont pas des constantes absolues sur tous les appareils. Le récapitulatif et le CTA restent visibles, aucun chevauchement. Le contenu peut dépasser la hauteur du formulaire ; ne pas imposer un plafond arbitraire.

### 11. États de l’écran

Sans contenu/un/multiple ; Répétition sur Non (section repliée) / Oui ; Jour/Semaine/Mois ; borne date/durée ; Rappel sur Non / Oui/Autre ; Programme : Aucun/choisi ; date/heure/stepper ouverts ; erreur/enregistrement. Les états encore non dessinés restent identifiés comme tels.

### 12. Contrôles et interactions

Interrupteur Répétition sur Non replie et retire toute récurrence du résumé. Activer expose les réglages ; chevron gère le repli sans être un nouvel état d’activation. Réordonner les contenus par poignée. Toucher fréquence ouvre CE-UI-11. Modifier une valeur actualise le brouillon et le résumé. Première activation rappel demande la permission ; refus le désactive et informe.

### 13. Gestes

Tap, scroll, poignée de réordonnancement, steppers et sélecteurs dédiés ; D-237 conservée. La bascule jusqu’au/pendant nécessite une conversion non encore spécifiée ; ne pas en inventer une.

### 14. Validation

Contenus disponibles, date/heure valides, bornes cohérentes avec Programme. Semaine : multiplicateur 1..12, au moins un jour, bornes inclusives. Rappel personnalisé positif, maximum 24 h conservé. Bornes Jour/Mois et conversion ouvertes. Pas de sauvegarde avec motif incohérent ; interaction de sélection de x ouverte.

### 15. Brouillon et persistance

Tout reste en brouillon jusqu’à Enregistrer ; enregistrer la Routine et ses entrées de façon cohérente, sans Routine partielle ; double soumission empêchée. Une phrase de récapitulatif ne devient pas une donnée métier stockée.

### 16. Navigation et conservation d’état

Conserver les réglages au retour de sélection/fréquence/date/rappel. Annuler restaure l’état antérieur du sélecteur. Succès restitue vue/date du Calendrier ou filtre/défilement du Catalogue.

### 17. Erreurs et cas limites

Sources supprimées, fenêtre du Programme incompatible, dates inversées, motif incomplet, permission refusée, persistance échouée : ne pas prétendre au succès. Traitement d’archivage d’un seul contenu et statut multi-contenus à compléter. PROG2/3 ne constituent pas les parcours finalisés.

### 18. Accessibilité

Interrupteurs annoncés avec leur état ; unité et sélection annoncées ; focus modal, pastilles/jours nommés ; cible Disclosure 48 × 48 distincte du cadre de 28 points. Texte agrandi, récapitulatif intégral, réduction des animations.

### 19. Invariants

Le créneau produit les occurrences, les contenus filtrent. Parcours n’est pas un objet. Aucune unité Heure ; aucune création persistante à l’ouverture ; aucune modification de l’échu.

### 20. Recette déterministe

Tester contenu unique Séance/Exercice et liste mixte, ordre, suppression du titre des lignes, masquage complet à N = 1, répétition désactivée sans récurrence dans résumé, rappel oui/non, dates invalides, permission refusée, défilement long/résumé protégé, texte agrandi. Scénarios Mois, conversion et x marqués en attente des règles manquantes ; pas de PASS inventé.

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

Préférences locales : Sons, Annonces vocales, Vibration, Notifications ; groupe Exercice : Pause entre les côtés, Compte à rebours d’un exercice (D-266), Fin d’exercice ; groupe Séance : Récupération après exercice, Compte à rebours initial, Fin de séance.

Révision D-307 : le défaut récupération est proposé à son ajout explicite en Composition, pas à l’insertion de chaque Exercice.

### 6. Classification des valeurs Figma

Labels statiques ; valeurs locales dynamiques. Défauts actés : côté 10 s, récupération après exercice 30 s, comptes à rebours 10 s, fins 5 s, Vibration activée. L’état vibration désactivée est un exemple utilisateur.

### 7. Structure de l’écran

Identité/Modifier, groupes Exercice et Séance de réglages, commandes son/vocal/vibration/notifications, navigation basse.

### 8. Éléments obligatoires

Six défauts distincts ; aucune Pause inter-Séries globale ajoutée. La Pause après chaque série est initialisée à 0 s dans l’éditeur (chapitre 08, paramètres d’exercice, CE-UI-10 §3), sans défaut global du Profil. Silhouette ne se modifie que dans CE-UI-01.

Libellé unique Pause entre les côtés ; défaut10s ; pas des pauses selon D-312 (D-386). Les captures anciennes de Profil portant un ancien libellé sont historiques sur ce texte.

### 9. Layout déterministe

Groupes selonDSF T5/T6 : fond#F9FAFC, liseré blanc 1, rayon 12, ombre sans rognage. Dans chaque groupe, un séparateur horizontal entre deux lignes consécutives, au style de séparateur de référence, aucun après la dernière ligne (D-267). Durées par steppers Profil, pas par roulette d’Exercice ; libellés complets accessibles.

### 10. Responsive, Safe Areas, texte, scroll et clavier

Zone centrale scrollable, navigation fixe ; texte long/agrandi fait croître lignes/groupes ; unités et actions restent visibles dans Safe Areas.

### 11. États de l’écran

Préférences chargées ; steppers actifs/borne ; vibration on/off ; notifications autorisées/refusées ; enregistrement/erreur.

### 12. Contrôles et interactions

Chaque modification de préférence s’enregistre immédiatement. Les valeurs servent aux nouveaux objets seulement ; aucune rétroaction sur brouillons déjà initialisés, Séances ou Exécutions existantes. Permission système demandée lors de première activation d’un rappel en Planification.

### 13. Gestes

Tap bascule ; stepper incrément immédiat, maintien≈500ms, répétition150ms et paliers1/5/10 selon DSF Bip, arrêt au relâchement ; action/animation D-237.

### 14. Validation

Valeurs non négatives ; pauses côté/récupération 0..300 s, tap1s puis maintien accéléré selon DSF Bip. Compte à rebours d’exercice et Fin d’exercice : 0..60 s, pas 1 s (D-256). Compte à rebours initial et Fin de séance (valeurs par défaut) : 0..60 s, pas 1 s (D-265) ; une valeur enregistrée au-delà est conservée sans plafonnement : « + » inactif, « − » ramène d’abord à 60 s. Pas de maximum déduit d’un exemple. Les bornes partagées sont consolidées au §6 R-02.

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

Aucune préférence Cadence ajoutée au Profil ; sons selon réglages existants. Barre d’état native et Safe Areas, pas9:41/95px codés en dur. DSF courant§4.14.

### 20. Recette déterministe

Changer chacun des six défauts, créer un nouvel objet puis comparer ancien objet inchangé ; relancer ; erreur écriture ; vibration off et haptique roulette maintenu ; notification refusée ; Modifier puis Annuler sans changement identité.

Insérer un Exercice : aucune récupération. Ajouter recovery : défaut Profil proposé ; ancien objet inchangé après modification du Profil.

## CE-EXEC-SESSION-01 — Exécution d’une Séance — phases, commandes et confirmations

**Complément Formats du 14/10 :** Les commandes et transitions génériques ci-dessous décrivent les plans libres finis. Les fenêtres EMOM/Death by et la borne AMRAP suivent CE-FMT-05 ; l’arrêt Death by suit CE-FMT-06. Ne pas appliquer Suivant, fin de cible, arrêt depuis Pause ou formule de progression générique aux fenêtres sans le raccordement explicitement signalé.

### 1. Identification

Famille SESSION :1992:8132/8530/8626 ; dialogues 1992:8224/8326/8428 ; médias CE-MEDIA-EXEC-01/02. ACTIVITY reste CE-T03-09..13.

### 2. Finalité fonctionnelle

Exécuter l’instantané de Séance avec Circuit répété en Tours, Exercices avant/après, phases de Séance uniquement pour préparation/fin, récupérations et points d’arrêt.

### 3. Contexte d’entrée

Démarrer depuis Catalogue ou occurrence Calendrier SESSION valide ; écran initial puis action Démarrer lance le plan, sans double lancement.

### 4. Contexte de sortie / destinations

Plan achevé → CE-UI-08 ; arrêt depuis Pause confirmé → CE-UI-08 Interrompue ; interruption technique sans Synthèse possible → historique conservé. Ne pas permettre un retour qui abandonne silencieusement le moteur.

### 5. Données affichées et source de vérité

**Cible par Série hors fenêtres de formats (13/10) :** fin automatique seulement en Durée chiffrée ; Suivant pour Répétitions ou toute cible À l’échec. Pas de nominal pour l’échec, même avec bip. Relevé par occurrence/côté : durée de dernière tentative ou répétitions estimées/déclarées ; non bloquant. Voir chapitre 08, Cibles et relevés d’exécution. Aucun nouveau layout de saisie/restitution n’est livré dans cette passe.

Instantané Session au démarrage, occurrences développées, Série/côté/Tour courants, paramètres intrinsèques, exclusion inconditionnelle des Compte à rebours/Fin propres selon D-214 révisée, résultats et temps moteur ; aucune lecture réactive de la source modifiée.

Plan depuis les cibles/Pauses de chaque Série et l’Ordre des côtés de l’instantané ; R positive remplace seulement la dernière Pause de l’occurrence.

Cadence éventuelle issue de la Série de l’instantané, jamais du Profil ou des chiffres Figma. Temps réellement dépensé cumulatif distinct du chrono de tentative ; bip applicable aux deux modes, sans modifier leur terminaison propre.

Snapshot : récupérations explicitement ajoutées uniquement ; projection R0 si absente. Ordre Exercice→Rpositive→point→suite ; D-248 conservée.

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

Initial ; compte à rebours initial de Séance ; aucune phase Compte à rebours/Fin propre aux Exercices ; Série ; pause inter-Séries ; côté ; récupération ; point d’arrêt ; pause utilisateur ; confirmations ; Fin de séance ; terminé/partiel/interrompu.

### 12. Contrôles et interactions

Pour une séance libre à plan fini, Démarrer construit le plan ; ordre canonique§4.12. Pause suspend temps actif ; Reprendre relance ; Arrêter seulement depuis Pause avec confirmation. Réinitialiser/Suivant suivent table§4.12, résultat partiel si saut chronométré anticipé. Point d’arrêt attend reprise explicite ; média ne suspend pas moteur.

Si la Série est en Répétitions avec bip, appliquer Bip v2 : nominal sans transition, Suivant normal ; dans les deux autres modes, le bip est périodique sans changer leur terminaison ; Pause/Reprise sur intervalle complet ; reset de portée existante avec temps réel conservé. En préparation/phase chronométrée, conserver le décompte propre. Média/retournement ne déclenchent pas Pause.

### 13. Gestes

Tap commandes ; confirmation explicite avant action destructive ; gestes média uniquement dans sa zone ; aucun retour vers Exercice précédent au MVP.

### 14. Validation

Séance contenant≥1Exercice valide ; pas de double démarrage. Points aux positions D-217 seulement. Phases 0 s instantanées. Hors fenêtres et formats à borne ouverte, progression hybride selon la formule §6 R-01, calculée sur toutes les étapes contributives du plan.

### 15. Brouillon et persistance

Instantané immuable ; résultats/temps checkpointés selon architecture ; Ressenti/Commentaire finalisés après clôture dans CE-UI-08. Réinitialiser conserve temps total déjà exécuté et résultats hors cible.

### 16. Navigation et conservation d’état

Reprise technique restaure phase/Série/côté/Tour sans relire source ni dupliquer résultat. Retour normal après Synthèse vers Suivi ; contexte occurrence reste associé à l’Exécution.

### 17. Erreurs et cas limites

Source supprimée après départ sans effet sur instantané ; interruption technique conserve résultats ; attente de point hors durée ; reprise après arrière-plan par horodatage. Gardes 30 min/2h selon modèle, sans réponse, rester suspendu sans arrêt automatique (§6 R-03).

### 18. Accessibilité

Annoncer phase, nom et côté au démarrage/changement ; commandes nommées selon phase, notamment Réinitialiser la récupération. Focus dans dialogue puis retour ; indicateurs non fondés uniquement sur couleur.

### 19. Invariants

Pause après chaque série, dernière comprise, même N1. Hors circuit de séries, PN puis PC se cumulent à la frontière des côtés successifs ; ordre par paire selon paramètres d’exercice du chapitre 08. Dans un circuit de séries : premier côté → PC → second côté → Pi, déroulement unique ; R positive remplace Pi terminale. Seule la toute dernière Pause est remplacée si une récupération positive suit l’Exercice ; sans elle (ou R0), conserver PN. En direct, conserver PN sans récupération contextuelle. Réordonner les Séries réévalue la dernière Pause.

Séance libre à compte borné : Circuit unilatéral, Tours 1..99 ; récupération après chaque occurrence y compris dernière et chaque Tour ; point interne répété chaque Tour ; attente hors durée ; pas de mutation de la source ; média indépendant du moteur.

Bip v2 remplace D-302/D-305 sur portée, signaux et symboles ; durées réelles conservées.

### 20. Recette déterministe

Vérifier alternance chiffré/échec, sécurité2h sans nominal, progression des cibles inconnues à Suivant ; reset20s puis35s donne55s cumulé et35s relevé. Suivant ne confirme pas implicitement un nombre de bips estimé.

Séance avec avant/dans/après Circuit, Tours 1/2, unilatéral/bilatéral, deux modes ; D-214 révisée : absence des phases propres quelle que soit la valeur d’un éventuel ancien champ ; toutes phases 0/>0 ; dernière récupération avant Fin ; points frontières/intérieur ; pause/reset/saut/arrêt confirmés/annulés ; source modifiée pendant run ; reprise ; médias ; vérifier poids §6 R-01 et transitions §6 R-03 ; aucun résultat de test applicatif n’est revendiqué ici.

Ordres D→G/G→D, A–F, N1, R0/positif et dernière occurrence/chaque Tour ; jamais cumul PN+R ni récupération ajoutée deux fois.

Vérifier passage entre préparation, Série cadencée, pauses programmées et fin ; deux côtés/deux ordres si applicables ; reset préservant autre côté et temps cumulé ; absence de double signal/transition. Bip valide dans les deux modes ; aucun signal hors phase Série.

## CE-UI-08 — Synthèse de Séance

**Complément Formats du 14/10 :** Pour Death by, montrer le résultat tours acquis + répétitions partielles et le motif, avec achèvement incomplet dans les deux cas. Ne pas transformer « limite atteinte » en Terminée. La représentation visuelle de ce résultat reste à illustrer ; CE-FMT-06. La représentation d’un Death by incomplet sera définie dans le chantier Suivi (D-381, D-365).

### 1. Identification

SESSION terminée 1992:8718/8780, partielle 4760:6448/6500 ; ACTIVITY distinct CE-T03-14.

### 2. Finalité fonctionnelle

Afficher bilan de Séance et finaliser Ressenti/Commentaire avant Suivi.

### 3. Contexte d’entrée

Fin normale du plan SESSION ou arrêt volontaire confirmé ; pas obligatoire à afficher si interruption technique l’empêche.

### 4. Contexte de sortie / destinations

Enregistrer réussi → Suivi ; erreur reste sur Synthèse. Aucun Relancer ni sortie normale sans Ressenti.

### 5. Données affichées et source de vérité

Le futur relevé À l’échec distingue chronométré, estimé, déclaré et non renseigné, par occurrence/côté ; il ne remplace pas le temps actif cumulé. Exigence de données validée ; implantation des champs de saisie et de restitution hors périmètre de cette passe, aucun emplacement nouveau supposé.

Instantané de Séance, statut, durée réelle et résultats atteints ; nombre exécuté inclut les partiels, nombre terminé les exclut. Ne pas étiqueter le premier comme Exercices terminés. Partiels affichés séparément si>0 ; aucun double comptage Série/côté.

La cadence prescrite est conservée dans l’instantané ; durée affichée réelle, cumulant intervalles abandonnés et tentatives reset par Série/côté. Aucun nombre de répétitions réellement effectué n’est inféré. Aucun nouveau champ de saisie en Synthèse.

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

10×4s terminé avec Suivant20s : temps réel20s et fin normale ; reset6s puis10s : cumulé16s ; modifier la définition après exécution ne change pas prescription/résultat. Aucun symbole d’estimation collé au temps réel.

## CE-UI-09 — Référentiels d’Exercice — Catégorie et Zones corporelles

### 1. Identification

Catégorie 4332:7095, création 4474:7157 ; Zones 4478:7209, création 4683:6336 ; suppressions 4861:6259/6348. Étiquettes de Séance :CE-T03-16.

### 2. Finalité fonctionnelle

Renseigner les classifications d’un Exercice et administrer leurs valeurs sans changer son exécution.

### 3. Contexte d’entrée

Accès Catégorie ou Zones depuis éditeur persistant/local, avec brouillon conservé.

### 4. Contexte de sortie / destinations

Catégorie marquée au toucher (ou créée par ↑ et marquée), confirmée par ✓ → éditeur ; ✕ conserve la Catégorie précédente, une Catégorie créée reste dans le référentiel (D-343) ; Zones sélection multiple puis validation de la modale → éditeur ; fermer sans validation restaure sélection antérieure. Création/suppression restent dans la famille de sélection.

### 5. Données affichées et source de vérité

Référentiels utilisateur et IDs du brouillon. Catégorie unique avec couleur ; Zones multiples sans couleur. Affectations retirées existantes conservables avec nom/dernière couleur.

Référentiel initial :10 zones D-093. Fessier est un ajout utilisateur dans les exemples Figma, pas une onzième valeur initiale obligatoire.

### 6. Classification des valeurs Figma

Noms et couleurs dynamiques ; dix zones initiales sont un jeu de départ, pas une liste fermée. Labels Catégorie/Zones/Nouvelle… statiques.

### 7. Structure de l’écran

Modale de choix, création inline avec clavier (action ↑ dans le champ, ↑ enregistre sans fermer le clavier ni la feuille — D-350 ; sans bouton Annuler : ✕ ferme la feuille ; espace réduit au-dessus du clavier — D-347), palette seulement Catégorie, dialogue destructif centré sur appui long.

### 8. Éléments obligatoires

Catégorie 1 et Zones≥1 pour nouvel Exercice ; nouvelle valeur nommée ; annuler et confirmer les sélections multiples ; aucun CTA supplémentaire en choix simple D-222.

### 9. Layout déterministe

Modales D-228 ; pastille Catégorie colorée et nom ; Zones icône silhouette depuis Profil ; palette de 4474:7157 : barre de couleurs sous le champ, sans pastille séparée, 12 couleurs D-026 (D-344). Les Zones n’ont pas de palette.

Actions destructives : token danger#D92D20 ; séparateurs#E0E3E8 et labels par rôle DSF. Aucune reprise des anciens rouges locaux.

Catégorie et Zones utilisent contour au repos et plein pendant l’ouverture du panneau ; cercle inchangé. Silhouette selon Profil, homme par défaut.

### 10. Responsive, Safe Areas, texte, scroll et clavier

Liste scrollable, clavier et actions visibles ; nom long accessible ; textes agrandis sans réduction ; focus confiné à la modale ouverte.

### 11. États de l’écran

Liste vide/initiale/enrichie ; aucune/une Catégorie ; zéro/N Zones ; création/nom invalide ; valeur retirée déjà affectée ; confirmation/erreur.

### 12. Contrôles et interactions

Catégorie tap valide/ferme ; Zones tap toggle puis confirmer. Appui long ouvre le dialogue Modifier/Supprimer sans sélectionner (D-259). Créer/renommer conserve identité de référence ; changer couleur Catégorie se propage aux objets courants, pas aux instantanés.

### 13. Gestes

Tap, scroll, saisie et appui long option ; aucun drag des référentiels ; appui destructif jamais déclenché par simple sélection.

### 14. Validation

Nom non vide et unique dans son référentiel ; un nom correspondant à une valeur retirée la réactive avec son identifiant et ses associations (D-257) ; Catégorie exactement 1, Zones≥1 pour nouvel objet. Une valeur retirée ne peut recevoir de nouvelle affectation ; l’ancienne affectation n’exige pas un remplacement forcé.

### 15. Brouillon et persistance

Affectations dans brouillon Exercice, persistées à Terminer ; opérations de référentiel explicitement confirmées sont distinctes. Erreur de création/suppression ne sauvegarde pas l’Exercice.

### 16. Navigation et conservation d’état

Fermer restitue éditeur/brouillon ; Annuler suppression restitue sélection intacte ; confirmer retire des futurs choix mais conserve affectations existantes et historique.

### 17. Erreurs et cas limites

Nom vide/dupliqué, valeur retirée entre lecture et choix, échec écriture : message et brouillon conservé. Ne jamais recréer ni réactiver automatiquement une valeur supprimée au démarrage ou par migration ; seule une création explicite du même nom la réactive (D-257).

### 18. Accessibilité

Nom/état sélectionné annoncés ; couleur accompagnée du nom ; labels accessibles des actions ; focus dialogue puis liste ; toutes Zones sélectionnées lisibles.

### 19. Invariants

Classification sans effet sur moteur ; Catégorie colore les objets courants référents ; Zone sans couleur ; conservation D-210 ; silhouette sans effet de filtre.

### 20. Recette déterministe

Catégorie choix/annulation/création/couleur ; Zones 0/1/N ; noms vide/dupliqué ; supprimer initiale/personnelle utilisée/inutilisée ; sauvegarder ancienne affectation retirée ; interdire nouvelle ; renommer sans changer ID ; historique inchangé.

Vérifier les deux silhouettes et le retour au repos après validation/annulation ; pas de suppression de la variante femme.

## CE-UI-10 — Paramètres d’exécution — feuille basse

**Complément Formats du 14/10 :** Complément format : CE-FMT-04. Les valeurs imposées restent réelles et effectives ; Tabata affiche Durée/8/20 s/10 s grisées et non modifiables, avec raison. Ne pas appliquer à cet état le tiret d’une valeur sans effet.

### 1. Identification

Feuille Paramètres d’exécution de CE-T03-04. Références courantes :8328:37092,8328:37862,8328:38513,8328:38848 et nouveau8470:13303 ; les autres états du12/10 restent applicables. Captures au chapitre06 ; matrice Deux modes du13/10. Les références6419/6665/7059/7069 du07/10 sont historiques.

### 2. Finalité fonctionnelle

Saisir/éditer mode, Séries uniformes/variables, cibles, Pauses, côtés, Bip de cadence, Compte à rebours et Fin ; appliquer au brouillon parent et régénérer la phrase sans sauvegarde prématurée.

### 3. Contexte d’entrée

Ouverture depuis la zone Paramètres d’exécution. Copie du parent ; Bip initial0=Aucun, reprendre valeur existante0..10 en édition. Aucun tempo implicite. Création : N1,Pause0,cibles et mode selon v13 ; absence de cible requise distincte de Bip0.

### 4. Contexte de sortie / destinations

✕/retour système annule l’ouverture ; ✓ applique état actif valide au parent ; Terminer du parent persiste. Même feuille pour création/modification et copie d’Exercice dans Séance.

### 5. Données affichées et source de vérité

**Complément cible12/10 :** Contexte de l’occurrence et compte hérité ; total dérivé, jamais source de N dans ce contexte.

Phrase selon les276 cas v15, total fourni par le calcul métier. Générateur → segments ordonnés `{texte, gras}`, valeurs et unités en gras, aucun redécoupage de chaîne. Terme « pause après chaque série », y compris N=1 ; clause de pauses variables omise conformément au corpus.

Collection effective des Séries, cible/Pause/bip, mode, direction, ordre,PC,Compte à rebours/Fin. Bip commun à toutes les lignes,0..10 dans deux modes ; aucune surcharge persistée. Calcul typé fourni par Bip v2 ; phrase et montants Figma ne pilotent aucune donnée.

### 6. Classification des valeurs Figma

Titres/règles statiques ; valeurs de champs dynamiques ; exemples Figma démonstratifs. exact/estimated/lowerBound/omitted à l’Exercice ; lowerBound réservé au mélange calculable. Une erreur de cible n’est pas une durée omitted et bloque ✓ sans inventer un montant.

### 7. Structure de l’écran

**Complément cible12/10 :** Champ régime identiques/variables et chevron distinct ; identiques sans chevron. Tableau variable visible ou replié.

En-tête fixe ✕/titre/✓ ; corps défilant Mode → Séries → régime identiques/variables avec chevron indépendant → cible/Pause uniformes ou tableau → Changement de côté → Ordre/PC si bilatéral → Bip de cadence → Total applicable → Compte à rebours → Fin. Bip commun hors tableau, présent dans les deux modes. N1 normalisé uniforme et ordre par côté.

### 8. Éléments obligatoires

**Complément cible12/10 :** Valeur numérique au repos, ± au toucher ; N hérité visible et non modifiable, origine discrète. Total affichable en lecture seule sous héritage.

Bip0..10, boutons ± révélés par appui sur sa valeur,0 libellé Aucun ; contrôle actif même à0. Aucun interrupteur ou roulette Bip. Total absent en Répétitions sans bip et toutes cibles À l’échec ; exact en Durée toute chiffrée, ≈ en Répétitions toute chiffrée avec bip, ≥ en mélange calculable. Pause entre les côtés seulement en bilatéral. Compte à rebours/Fin conservés.

### 9. Layout déterministe

**Révision13/10 :** popover Mode184×99, hauteur automatique, deux options. Roulette cible : popover354×249 avec maître8452:13297 (330×181), option en tête330×30, séparateur1px, roulette numérique150px. Le total conserve le maître5544:5118 (330×150) et son popover354×216. Ligne de série à deux colonnes maintenue, même tout échec ; aucune variante à une colonne. Voir DSF Deux modes pour tailles et opacités.

**Alignement DSF du 12/10 :** ligne variable `8129:31593`, 334 × 36 ; cellules cible/Pause 76 × 24 ; pied commun `8129:31601`, 354 × 48, ± à droite. Une cellule active ; plus de steppers permanents dans chaque cellule. Les 19 états de la feuille sont illustrés au chapitre 06. Seul le placement de la mention/astérisque du nombre hérité reste sans référence visuelle identifiée.

À402 : groupe à x24, largeur354 ; Bip au premier niveau x36. Les anciennes indentations systématiques x52 des contrôles variables sont remplacées par la grille à cellules décrite dans le DSF du 12/10. Bip juste au-dessus du total ou avant Compte à rebours si total absent. Retrait du total raccourcit la feuille de42px par le haut, bas ancré. Valeurs/steppers à droite ; marges adaptées, pas de coordonnées absolues sur toutes largeurs. Voile modal `overlayScrim` (`color/overlay/scrim`) #1F2129 à 34 %, distinct de `compositionDraggedCardShadow`, qui ne sert jamais de voile.

Référence longue7119:27855 :224caractères, cinq lignes/100px à largeur324, carte193px en AUTO. Contenu et contrôles suivants suivent la hauteur intrinsèque, sans plafond.

### 10. Responsive, Safe Areas, texte, scroll et clavier

360/402/440, Safe Areas, texte agrandi et scroll ; en-tête reste accessible. Tableau replié conserve données et erreurs ; feuille sans total conserve accès au Bip et aux actions. Aucune hauteur fixe ne doit rogner le texte ou les steppers.

### 11. États de l’écran

Cible chiffrée / À l’échec / mélange ; ouverture sur la cible courante. Option sélectionnée100%, sinon45% du remplissage #1a1a1f. À l’échec sélectionné : partie numérique neutre00:00 et grisée ; ce zéro n’est pas une cible valide. Aucun écran uniforme supplémentaire : un changement de valeur seul ne crée pas un nouveau contrat.

Bip0/positif dans chacun des deux modes ; cible valide/incomplète ; uniforme/variable ;N1 ; deux ordres/directions ; tableau ouvert/replié ; steppers au minimum/maximum et maintenus ; validation/annulation. Plus aucun état roulette de cadence.

### 12. Contrôles et interactions

Deux modes seulement. Cible chiffrée et À l’échec mutuellement exclusives ; libellé « Aucune durée, à l’échec » ou « Aucune répétition, à l’échec ». Aucune coche dans la liste ; ✓ de la feuille applique. Conserver le type À l’échec lors d’une bascule de mode. À tout instant, exactement une cible est sélectionnée. À l’ouverture : cible numérique → roulette active sur la valeur courante et libellé échec à45% ; cible échec → libellé actif et bloc numérique grisé à45%, affiché à00:00. Faire tourner la roulette sélectionne la valeur numérique et grise le libellé. Toucher le libellé sélectionne l’échec et ramène la roulette grisée à00:00. Le grisé exprime la non-sélection, pas une interdiction de manipuler la roulette. Aucun geste supplémentaire de déverrouillage, aucune coche. Validation par le bouton de la feuille ; annulation selon le brouillon existant.00:00 n’est jamais une cible valide ; pause0 reste valide.

**Complément cible12/10 :** Un seul champ actif. Changer de champ ferme/ouvre en un geste. Pi et cible copiées depuis dernière ligne. Suppression immédiate + Annuler avec position et paramètres ; sous N hérité, suppression locale indisponible.

± modifie Bip par1, bornes0..10, sans accélération. Autres steppers : DSF Bip (maintien≈500ms, paliers1/5/10 selon durée du maintien et champ). Bascule de mode conserve Bip même à✓ ; cibles numériques incompatibles remplacées par— et restaurées dans le brouillon selon v13. Variable copie les valeurs uniformes ; retour uniforme reprend première ligne ; réduction/augmentation/restauration et déplacement selon v13. Une seule roulette/segmenté ouvert pour les autres champs. Le total Durée uniforme entièrement chiffré garde son inversion seulement si N est libre ; sous N imposé par un circuit de séries, tout total affichable est en lecture seule. omitted reste absent.

### 13. Gestes

Tap et maintien sur steppers, arrêt au relâchement/sortie de cible, pas supplémentaire de relâchement interdit après répétition. Glisser la poignée réordonne cible/Pause/bip ensemble et recalcule la dernière ligne. Alternatives accessibles sans geste fin.

### 14. Validation

Mode et cibles typées actives requis ; une cible À l’échec est valide sans nombre. R06 close : maximum58min55s (3535s) confirmé ; roulette de cible par pas5s dès5s. Cibles chiffrées : N1..99,Ri1..100,Ti5..3535s,Pauses0..300s,Bip entier0..10 dans deux modes. −1,11,fraction invalides, aucune correction silencieuse. Repli ne contourne pas validation ; erreur nommant la Série.0=Aucun reste valide. Nom/Catégorie/Zones contrôlés au parent.

### 15. Brouillon et persistance

Aucune phrase ni aucun segment en base, occurrence ou snapshot. Régénération à chaque affichage depuis les paramètres ; ✓ applique, ✕ annule, Terminer persiste les paramètres. Une règle rédactionnelle amendée s’applique au prochain affichage des objets existants.

Brouillon isolé ; ✓ atomique au parent ; ✕ restaure totalité avant ouverture. Bip persiste quel que soit le mode. Les variantes cachées de cibles/tableaux ne sont pas persistées hors état actif. Duplication/copie/snapshot incluent Bip ; aucune mutation partielle.

### 16. Navigation et conservation d’état

Retour au parent même position et contenu, phrase régénérée à chaque affichage depuis les paramètres appliqués, notamment après✓ valide. Une bascule de mode seule ne sauvegarde rien. Pas de navigation vers un écran de cadence ni de nouvelle route.

### 17. Erreurs et cas limites

Cible manquante, valeur hors borne, double validation, interruption ou erreur de persistance : aucun état partiel. Mode sans durée propre : ligne absente même si pauses positives. Historique non modifié ; données héritées hors plage conservées tant qu’elles ne sont pas modifiées, toute nouvelle saisie ou modification respectant les bornes (D-383) ; jamais tronquées silencieusement.

### 18. Accessibilité

**Complément cible12/10 :** Lecture seule annoncée avec valeur et origine ; ne pas remplacer par un tiret. Cellule active identifiée par ligne/colonne et texte Série i · Durée (ou autre champ), sans dépendre seulement de la couleur.

Nom accessible Bip de cadence ; valeur Aucun ou intervalle en secondes ; boutons augmenter/diminuer et limites annoncées. Total ≈ annoncé estimation ; ≥ annoncé total prévisionnel partiel. Option À l’échec annoncée sélectionnée/non sélectionnée ; le grisé n’est pas le seul indicateur accessible. Focus modal contenu, retour à la zone Paramètres. Texte agrandi, cibles44 minimum, alternatives au maintien/glisser.

### 19. Invariants

Bip sonore uniquement pendant Série, aucune transition automatique. Les intervalles logiques peuvent proposer un relevé estimé en Répétitions à l’échec. Son ne transforme pas À l’échec en durée connue. Aucune estimation forfaitaire ; ≥ seulement pour mélange calculable à l’Exercice. Pause après chaque série, y compris la dernière ; récupération contextuelle positive remplaçant seulement la dernière Pause. Les images ne gouvernent ni calculs ni persistance.

### 20. Recette déterministe

Recette complémentaire : deux options, ouverture valeur/échec courant, exclusion mutuelle,00:00 cible refusée (pause0 valide), tout échec sans total, mixte30/45/échec avec pauses10/20/30 →≥2min15 en lecture seule, Répétitions sans bip sans total ; annuler/appliquer sans persistance anticipée. Tester30s → toucher échec →00:00 grisé → tourner vers30s → cible numérique ; réouverture fidèle et annulation/restauration. Le bloc grisé reste manipulable. Qualification native et accessible sur appareils à réaliser ; §4.5 reçu, réserve de source close.

**Complément cible12/10 :** Vérifier N libre/hérité, total éditable/lecture seule/omitted, identiques/variables égales, repli, croix/Annuler, cible destructive pendant stepper actif ; conserver tests des modes et pauses.

Recette rédactionnelle :276 gabarits v15 avec total métier injecté, gras sur occurrences répétées d’une valeur, N1 avec pause mentionnée et total non redondant ; absence de troncature. Français au MVP ; i18n nécessite des gabarits et accords par locale, pas une traduction de fragments isolés.

Deux modes × deux types de cible × bip nul/positif ;0/1/10 et rejets−1/11/fraction ; conservation lors des bascules, annulation et duplication.4×15×4+4×15=300s≈ ; sans bip ligne absente. Tester N1,variable,repli,réordre de dernière Série,inversion Durée,deux côtés/R ; géométrie42px, texte agrandi et accessibilité. Phrase de pauses conforme aux276 formulations v15 ; Q-08 clos.

Corpusv15 :276gabarits, total métier injecté ; aucun changement grammatical vs v14. Tester virgule jamais isolée en début de ligne, cas144 long et ordre des cibles après déplacement. Les cas de brouillon incomplet restent hors des276sorties validées.

## 5. État des preuves visuelles

| ID | Écart ou limite | Contrat / traitement |
|---|---|---|
| V-01 | Dialogue2234:189 restauré et capture actualisée le01/10 | Preuve visuelle disponible ; boutons non câblés, recette interactive non acquise |
| V-02 |Activité, Parcours/Tour mal employés dans plusieurs PNG | Contrats cible Exercice/Circuit/Tour ; corriger Figma sans renommer les IDs techniques |
| V-03 | Anciennes variantes de phrase éditable remplacées par D-246 | Les nouveaux états et limites de la feuille sont documentés dans CE-UI-10 ; anciennes captures historiques |
| V-04 | Clos le12/10/2026 : ancien contrôle global D-214 supprimé du besoin | CE-T03-08 ; aucun emplacement ni composant à ajouter ; Figma confirmé aligné par le propriétaire |
| V-05 |Chevauchement de créneaux Jour sans géométrie de référence | CE-UI-02 ; conserver lisibilité/accès, rendu à qualifier |
| V-06 |Erreur d’initialisation Splash sans frame | CE-UI-06 ; aucune destruction de données ou blocage silencieux, rendu à qualifier |
| V-07 |Direct/media montre Tour ;17 px/24 px divergent ; état Démarré parfois incohérent | CE-T03-09..13/MEDIA ; Tour absentACTIVITY,24 px cibleDSF T10 |
| V-08 |Étiquette 4861:6145 mentionne Exercices au lieu de Séances ; renommages sans preuve dédiée | CE-T03-16/CE-UI-09 ; textes et comportement explicités, pas de preuve inventée |
| V-09 |Récurrence 2 semaines avec récapitulatif hebdomadaire ; filtre dit inactif avec critère appliqué | CE-UI-05/CE-T03-02 ; récapitulatif et état dérivés des données |
| V-10 | Lignes structurelles de récupération conformes au principe de visibilité permanente (H-08, clarification propriétaire du 06/10), dont 2028:11700 à 0 s sans Point d’arrêt ; 4738:6355 et 1992:8996 représentent des déploiements historiques | D-260/D-261/D-262 gouvernent les cartes courantes ; variantes déployées Exercice/Suivi hors MVP. Copies historiques conservées, sans retouche |
| V-11 |Compte à rebours Composition inline 2028:11375 mais description roulette ; pas Fin 5 s contre prescription 1 s | CE-T03-08 ; aucun état de picker déclaré vérifié tant que la description 06 et sa preuve ne sont pas réconciliées |
| V-12 |Archives Exercice sans écran complet ; Photo à200% non qualifiée ; animations non câblées ; contrastes acceptés | Limites déjà documentées du DSF, pas de nouvelle décision produit |

Les captures courantes sont centralisées au chapitre06 ; l’état des lieux du03/10 distingue42références du parcours, leurs contrats et les copies historiques remplacées. La matrice donne l’inventaire, dont les références hors prototype qui ne deviennent pas des écrans MVP. Les matrices ci-jointes donnent les rattachements ; la présence de chaque capture a été vérifiée lors de l’audit, pas son fonctionnement interactif.

## 6. Clôture des réserves fonctionnelles des contrats

Les arbitrages des 30 septembre et 1er octobre 2026 ferment les points fonctionnels ci-dessous. Ils ne valent ni recette de l’application ni validation de preuves Figma absentes. Aucun shell, composant, placement ou parcours n’est redessiné.

### R-01 — Progression et estimation

Le calcul porte sur le plan développé et conserve la piste existante. M compte les étapes contributives ; R compte les Séries Répétitions sans cadence et À l’échec ; T somme les durées des phases chronométrées positives et les Ri×Ci des Séries cadencées. Chaque Série sans durée déterminable pèse1/M ; chaque étape temporelle de durée d pèse(1−R/M)×d/T. Sans R, poids d/T ; sans T, poids1/M. Phases0s, Pause manuelle et attente de point n’ont aucun poids. Les non-cadencées/À l’échec acquièrent leur part à Suivant ; les Répétitions avec bip progressent continûment, Suivant acquiert leur reste. À fin nominale, part de Série100% mais Série active. Pause abandonne la fraction d’intervalle pour la progression, conserve le temps réel ; reprise sur intervalle complet. Aucun100% global publié avant finalisation du plan. Poids figés au départ ; reset remet à zéro son périmètre seulement. Aucun nouveau composant de progression par Série.

Durée : exact si toutes les cibles sont chiffrées ; Répétitions avec bip : ≈ si toutes les cibles sont chiffrées. Mélange chiffré/échec calculable : ≥ au niveau Exercice, prioritaire sur ≈, somme du travail connu ou estimable et des pauses prévues. Répétitions sans bip, ou toutes les cibles À l’échec : aucun total d’Exercice (omitted). Séance/Circuit : agrégation des contributions connues du plan, ≥ si travail inconnu. Travail + pause après chaque série, dernière comprise ; seule la dernière Pause est remplacée par la Récupération positive qui suit. Compte à rebours/Fin exclus du total intrinsèque. Aucun calcul issu de Figma ou d’Excel.

### R-02 — Validation des contrôles existants

- Planifier : fréquence entière de 1 à 12 semaines incluses ; − inactif à 1 et + inactif à 12 ; toute valeur extérieure est refusée à l’enregistrement.
- Rappel Autre : délai strictement positif, maximum 24 h (1 440 minutes), avec les unités et le sélecteur existants. Aucun désactive le rappel ; zéro ne crée pas une deuxième manière de désactiver le champ. Une notification dont l’échéance est déjà passée n’est pas envoyée rétroactivement ; les futures occurrences conservent leur rappel.
- Durée totale : conserver le sélecteur minutes/secondes. La borne dérivée est T(1)..T(99) pour les paramètres courants, et non 58 min 55 s (borne par Série). La colonne minutes doit représenter T(99), sans nouvelle colonne ni nouveau contrôle. Granularité seconde ; le calcul inverse existant choisit N dans 1..99, arrondi .5 vers le haut, puis affiche T(N) et le message d’ajustement si nécessaire. En Durée uniforme, une diminution à N=1 ne masque le total du résumé que s’il égale effectivement la cible ; la ligne Total reste présente dans la feuille en Durée/Répétitions, y compris à N = 1 ; elle affiche « — » lorsqu’une cible nécessaire au calcul manque (D-396, D-384).
- Profil : les paramètres identiques héritent des mêmes bornes que leur champ cible, sans maximum tiré des valeurs d’exemple, sauf D-265. Compte à rebours initial/Fin de séance : 0..3599 s pour les champs de la Séance (D-089), 0..60 s pas 1 s pour leurs valeurs par défaut du Profil (D-265) ; Compte à rebours d’exercice/Fin d’exercice : 0..60 s, pas 1 s (D-256) ; pauses et récupération : 0..300 s ; le contrôle et ses pas restent ceux du DSF et, pour les steppers, de D-312 (D-386). Les valeurs initiales déjà validées ne changent pas.

### R-03 — Transition, reset et suspension

L’ordre d’exécution vient du paramètre Ordre des côtés : Un côté après l’autre (défaut) ou Les deux côtés à chaque série. En bilatéral N est toujours par côté, paramètres communs aux deux côtés. Les successions et pauses sont celles de chapitre 08, paramètres d’exercice ; aucun repli de PC vers la Pause. Les cibles et Pauses variables proviennent de la ligne courante.

Durée intrinsèque calculable : unilatéral Σ(Ti+Pi) ; succession des côtés 2Σ(Ti+Pi)+PC ; par paire 2ΣTi+ΣPi+N×PC. N=1 normalisé succession. Occurrence calculable To=T−PN+R si R>0, sinon To=T. Durée : exact si toutes les cibles sont chiffrées ; Répétitions avec bip : ≈ si toutes les cibles sont chiffrées. Mélange chiffré/échec calculable : ≥ au niveau Exercice, prioritaire sur ≈, somme du travail connu ou estimable et des pauses prévues. Répétitions sans bip, ou toutes les cibles À l’échec : aucun total d’Exercice (omitted). Séance/Circuit : agrégation des contributions connues du plan, ≥ si travail inconnu. Travail + pause après chaque série, dernière comprise ; seule la dernière Pause est remplacée par la Récupération positive qui suit. Compte à rebours/Fin exclus du total intrinsèque. Aucun calcul issu de Figma ou d’Excel.

La source active est chapitre 08, paramètres d’exercice ; D-242 est supersédée. Les tests PRE-1 restent figés sur leur source historique.

Réinitialiser conserve D-029/D-150 et RM-062 : recommencer la Série courante en unilatéral ; en bilatéral, recommencer le côté courant depuis sa première Série, préserver les résultats de l’autre côté et le temps total écoulé. Cette portée s’applique aussi à Les deux côtés à chaque série ; un passage déjà acquis de l’autre côté n’est pas rejoué. Exemple : gauche2/3 → reprise gauche1/3, résultats droits conservés. Pendant une récupération, RM-062 réinitialise seulement cette phase. Le saut confirmé d’un bloc chronométré conserve D-150 : côté courant partiel, poursuite des passages restant à exécuter de l’autre côté ; les résultats acquis ne sont pas effacés. Ces conséquences du périmètre existant ne constituent pas un nouvel arbitrage.

Pause de sécurité : sans réponse au choix Reprendre/Arrêter, l’exécution reste suspendue, son état est conservé et son temps n’avance plus. Aucun délai d’arrêt automatique supplémentaire.

### R-04 — Suppression d’une occurrence périodique

Le comportement utilisateur est déjà fixé. L’exclusion d’une occurrence identifiée par Routine et date/heure d’origine doit être persistée, survivre à la relance et au recalcul, et retirer sa notification. Les autres occurrences et l’historique restent conservés. La mutation doit être atomique et idempotente ; en cas d’échec, l’interface ne simule pas un succès. Modèle et API doivent satisfaire ce contrat ; le choix de stockage relève du développement et ne requiert aucun nouvel écran ni arbitrage de design. La recette doit prouver relance, recalcul et notifications ; elle n’est pas réputée exécutée par cette clôture documentaire.

## 7. Référentiel élémentaire T03 et couverture

| ID | Contenu élémentaire |
|---|---|
| E01 | Catalogue multi-type `Exercices / Séances` |
| E02 | Séances sélectionné par défaut/relaunch |
| E03 | Exercices actif T03 |
| E04 | aucun troisième segment |
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
| E33 | Aucun Déployer d’Exercice, avec ou sans média (D-261) |
| E34 | Gouttière permanente Exercice ; déploiement réservé aux Séances Catalogue/Semaine |
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
| E51 | Deux modes × deux types de cible × Bip nul/positif : exact Durée, ≈ Répétitions avec bip, omitted Répétitions sans bip et À l’échec ; ≥ pour mélange calculable à l’Exercice |
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
| E71 | Consultation galerie média MVP selon D-203 ; ajout/import activés dans PRE-3 par D-333 |
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

T03 décrit l’Exécution ACTIVITY autonome : préparation 5 s, phases propres, Séries/pauses/côtés, Pause entre les côtés, Synthèse et Suivi. T04 porte l’orchestration SESSION : Circuit/Tours, phases structurelles, récupération post-occurrence, points d’arrêt et progression globale. Ajouter leurs contrats ne déclenche ni développement ni changement de tranche. Ancien objet Parcours autonome retiré ; recherche hors MVP.

Pour chaque contrat : tester nominal/alternatifs/négatifs, comparer le rendu 402 à la preuve lorsqu’elle existe, vérifier 360/402/440 et texte agrandi, accessibilité, données réelles, persistance/annulation, erreurs et absence d’activation hors périmètre. Consigner séparément conformité documentaire, conformité visuelle et recette interactive. Les règles §6 et preuves manquantes §5 ne sont jamais marquées CONFORME en exécution par la seule présence de 20 sections.

## Mise à jour des références visuelles — 07/10, corrections rédactionnelles

Les références de CE-T03-02 (catalogue), CE-T03-04 (éditeur et abandon), CE-UI-09 (zones corporelles) et CE-UI-10 (paramètres) ont été recapturées après correction du libellé de carte et des19 phrases. [Inventaire exact](../CLOTURE-CAPTURES-PHRASES-2026-10-07.md). Les comportements, champs et règles métier de ces contrats restent ceux déjà validés ; aucune nouvelle décision de conception.

## CE-UI-11 — Planification — fréquence d’un contenu

### 1. Identification

CE-UI-11 — Planification — fréquence d’un contenu. Frame MVP 7594:34653, communautaire 7567:13761. Feuille au-dessus de CE-UI-05.

### 2. Finalité fonctionnelle

Définir combien et quelles occurrences du créneau retient le contenu ciblé.

### 3. Contexte d’entrée

Toucher la fréquence générique d’une ligne de contenu dans CE-UI-05.

### 4. Contexte de sortie / destinations

Valider → brouillon de CE-UI-05 ; fermeture/annulation → fréquence antérieure conservée. Le parent reste inactif sous la feuille.

### 5. Données affichées et source de vérité

Contenu ciblé, entiers x/n, motif des positions 1..n ; aucune unité de temps dans le motif.

### 6. Classification des valeurs Figma

Fréquence, fois sur, Valider sont structurels ; nom, x/n et pastilles sont dynamiques. Le contenu de démonstration de la feuille ne détermine pas l’identité métier ciblée.

### 7. Structure de l’écran

Titre Fréquence et nom → stepper x, liaison « fois sur », stepper n → n pastilles numérotées → Valider.

### 8. Éléments obligatoires

Deux steppers, n pastilles, état gris/sélectionné, validation. Pas de texte explicatif supplémentaire ; libellés de groupe figurant dans Figma conservés. Pas de variante 2n avec séparateur.

### 9. Layout déterministe

Feuille blanche, voile commun 34 %. Respecter les positions et styles de la frame de référence sans redessin. Retenu #5F60EE, texte blanc Semi Bold ; non retenu #F9FAFC, texte #141414 Regular. Liaison « fois sur » plus grande que les libellés voisins. Composants de stepper et cibles communes conservés.

### 10. Responsive, Safe Areas, texte, scroll et clavier

Référence 402×874, adaptations 360/440 et Safe Areas conservées. Texte agrandi sans réduction de police ; liste/formulaire défilant ; CTA ancré dans le pied sûr. Les coordonnées Figma ne sont pas des constantes absolues sur tous les appareils. Grand n : comportement de retour à la ligne/scroll et borne maximale à spécifier ; ne pas tronquer des pastilles.

### 11. États de l’écran

À chaque fois ; motif partiel ; après changement de x/n : toutes grisées ; sélection incomplète ; validation/annulation.

### 12. Contrôles et interactions

Changer x ou n remet toutes les pastilles au gris. Sélectionner les positions voulues. Le contrôle « plafond x ou mise à jour de x » reste explicitement ouvert ; ne pas choisir silencieusement. x=n s’affiche à chaque fois dans la liste.

### 13. Gestes

Toucher d’un stepper ou d’une pastille, action au relâchement ; aucun geste de réordonnancement dans le motif.

### 14. Validation

Le motif final doit représenter x positions parmi n. Bornes des steppers et règle précise de validation pendant une sélection incomplète à compléter avec le point ouvert sur x. Pas de sélection automatique après changement.

### 15. Brouillon et persistance

Brouillon local de fréquence ; Valider transmet au parent ; seule la sauvegarde finale de la Routine persiste.

### 16. Navigation et conservation d’état

Retour conserve position de la liste et autres paramètres ; annulation ne remplace pas le motif antérieur.

### 17. Erreurs et cas limites

Contenu retiré pendant l’édition, grand n, motif vidé après modification d’un stepper : revalider sans références fantômes. Ne pas généraliser la fréquence d’une entrée à toute la Routine.

### 18. Accessibilité

Annoncer la position et l’état de chaque pastille ; steppers accessibles avec valeur ; texte complet et focus modal ; cibles minimales conservées.

### 19. Invariants

n pastilles ; fréquence sans unité ; aucune occurrence ajoutée au créneau ; détails du motif seulement ici et au Calendrier.

### 20. Recette déterministe

Tester 1 sur 2, 2 sur 3 avec positions 1/3 ou 1/2, x=n, chaque stepper réinitialisant toutes les pastilles, annuler/valider, indépendance des contenus. Les tests du comportement de x et des bornes attendent leur spécification.

## CE-CIR-01 — Choix de nature du circuit

**Complément Formats du 14/10 :** Le format peut imposer la nature du circuit selon CE-FMT-03. Le choix libre Tours/Séries ne permet pas de contourner ses constantes ou l’indexation du Volume par tour For time.

### 1. Identification

Popover de CE-T03-08, déclenché uniquement par la pastille tours/séries. Référence Prototype MVP `8328:34662`, capture au chapitre 06 ; DSF Circuits du 12/10.

### 2. Finalité fonctionnelle

Choisir comment le circuit développe les séries, sans changer le nombre affiché.

### 3. Contexte d’entrée

Brouillon de composition avec circuit unique ; appui sur unité, pas sur chiffre.

### 4. Contexte de sortie / destinations

Retour composition après choix sans perte ; CE-CIR-02 si perte ; abandon conserve état courant.

### 5. Données affichées et source de vérité

Nature actuelle, compte N, nombres et paramètres des exercices dans le brouillon.

### 6. Classification des valeurs Figma

Libellés tours/séries statiques ; nombre et sélection dynamiques ; aucune règle tirée d’un exemple.

### 7. Structure de l’écran

Popover ancré au déclencheur, deux options.

### 8. Éléments obligatoires

Deux options et état courant identifiable ; aucune troisième nature.

### 9. Layout déterministe

Pastille limitée au mot ; chiffre hors pastille. Référence 402 : popover `8328:34805`, 252 × 117, deux options 250 × 49. Ancrage au déclencheur, largeur adaptée au shell ; voir DSF Circuits du 12/10. Les ± visibles dans la capture représentent l’édition numérique, pas un nouveau repos permanent.

### 10. Responsive, Safe Areas, texte, scroll et clavier

Conserver options accessibles avec texte agrandi, safe areas et petit écran ; aucun clavier.

### 11. États de l’écran

Tours actif ; séries actif ; choix inchangé ; choix avec extension ; choix avec troncature.

### 12. Contrôles et interactions

Séries→tours conserve compte et valeurs. Tours→séries adapte à N ; prédicat de perte avant mutation.

### 13. Gestes

Toucher une option ; fermeture sans choix selon convention existante, aucune mutation.

### 14. Validation

Nature dans les deux valeurs ; N valide ; confirmation requise uniquement si perte.

### 15. Brouillon et persistance

Appliquer au brouillon atomiquement ; aucune persistance avant enregistrement de séance.

### 16. Navigation et conservation d’état

Retour au même circuit et scroll ; restitution du focus au déclencheur.

### 17. Erreurs et cas limites

Choix identique sans modification ; double action sans double conversion ; erreur conserve état initial.

### 18. Accessibilité

Annoncer choix, état sélectionné et fonction ; pastille et chiffre ont des noms accessibles distincts.

### 19. Invariants

Régime de chaque exercice conservé ; nombre affiché inchangé lors du choix ; catalogue intact.

### 20. Recette déterministe

Tours→séries avec exercices<N,=N,>N ; séries→tours ; Annuler après perte ; absence de confirmation sans perte.

## CE-CIR-02 — Confirmation d’adaptation avec perte

**Complément Formats du 14/10 :** Les confirmations de conversion libre restent applicables seulement aux conversions autorisées. Un format n’est pas changé par cette confirmation ; aucune conversion For time en séries locales.

### 1. Identification

Dialogue décision existant appelé par conversion ou ajout catalogue dans un circuit de séries ; frame à rattacher ensuite.

### 2. Finalité fonctionnelle

Confirmer une suppression de séries liée à une adaptation structurelle.

### 3. Contexte d’entrée

Au moins un exercice concerné a plus de N séries. Pas de dialogue pour diminution simple du compteur.

### 4. Contexte de sortie / destinations

Annuler retourne à l’état d’origine ; Confirmer applique l’opération et revient en composition.

### 5. Données affichées et source de vérité

Opération demandée et séries au-delà de N depuis le brouillon, sans appliquer la perte avant confirmation.

### 6. Classification des valeurs Figma

Actions Annuler/Confirmer fixes ; exercices/comptes affectés dynamiques.

### 7. Structure de l’écran

Dialogue au-dessus de composition avec texte expliquant la perte et les deux actions.

### 8. Éléments obligatoires

Annuler et Confirmer ; indication explicite de suppression définitive des séries excédentaires.

### 9. Layout déterministe

Réutiliser le dialogue générique : frame `8328:34813`, instance `8328:34964`, 354 × 215 à x24/y635 sur la référence 402 × 874. Annuler à gauche, Confirmer à droite. Titre « Passer en circuit de séries ? » ; message décrit N et les séries/valeurs supprimées. N=3 est un exemple dynamique. Fond et popover inertes. Hauteur adaptée au texte, sans figer les coordonnées sur tous les appareils.

### 10. Responsive, Safe Areas, texte, scroll et clavier

Texte intégral et actions accessibles avec agrandissement ; aucune saisie clavier.

### 11. États de l’écran

Conversion en attente ; ajout en attente ; confirmé ; annulé ; échec atomique.

### 12. Contrôles et interactions

Annuler conversion conserve nature/compte/valeurs. Annuler ajout abandonne ajout. Confirmer applique toutes les modifications ensemble.

### 13. Gestes

Pas de confirmation par simple appui sur le voile ; fermeture sans confirmation ne valide jamais la perte.

### 14. Validation

Pertes recalculées sur état effectif avant application ; pas de confirmation sur état obsolète.

### 15. Brouillon et persistance

Après confirmation, lignes tronquées non mémorisées pour retour de nature ; transaction de séance toujours annulable dans son ensemble.

### 16. Navigation et conservation d’état

Conserver position et contexte ; ne pas créer un exercice catalogue lors de l’adaptation.

### 17. Erreurs et cas limites

Erreur/double appui : pas de mutation partielle ni doublon ; si état changé, recalculer avant toute suppression.

### 18. Accessibilité

Annonce du dialogue, de la conséquence et des actions ; focus contenu puis rendu à l’origine.

### 19. Invariants

Confirmation si et seulement si perte lors des opérations visées ; diminution simple exclue.

### 20. Recette déterministe

Confirmer/Annuler conversions et ajouts ; comparaison complète avant/après ; test catalogue inchangé.

## CE-CIR-03 — Volumes du circuit

**Complément Formats du 14/10 :** Pour For time, l’échelle est un Volume par tour ; pour Progression, des répétitions par série. Le nombre de valeurs et le compte correspondant restent cohérents ; le parcours détaillé de redimensionnement For time reste le raccordement R-04 de la revue.

### 1. Identification

Fenêtre de lecture seule ouverte par œil sur la ligne du titre de circuit ; frame à rattacher ensuite.

### 2. Finalité fonctionnelle

Lire toutes les cibles série par série sans ouvrir chaque exercice.

### 3. Contexte d’entrée

Composition avec circuit de tours ou de séries ; œil présent et actif dans les deux natures.

### 4. Contexte de sortie / destinations

Fermer restitue la composition sans modification.

### 5. Données affichées et source de vérité

Le mode Durée/Répétitions reste identifiable dans les volumes mixtes ; ✓ désigne la cible À l’échec, jamais un accomplissement. Le libellé d’unité ancien « À l’échec » pour une ligne tout échec ne suffit plus à distinguer les deux modes. L’alignement visuel précis de cette unité est à fournir : aucune capture de grille mixte n’est livrée dans cette passe.

Exercices et séries actives du brouillon, régime, mode et direction ; aucune réserve de lignes retirées affichée.

### 6. Classification des valeurs Figma

Exercice, S1…Sn et unité/mode : en-têtes ; cellules dynamiques ; pas de calcul à partir des captures.

### 7. Structure de l’écran

Colonne Exercice, colonnes séries, colonne finale unité/mode.

### 8. Éléments obligatoires

Grille et fermeture ; ni pauses ni récupérations ; présence de série distincte de son absence.

### 9. Layout déterministe

Colonnes Exercice et unité/mode fixes ; colonnes séries défilantes horizontalement ; liste défilante verticalement. Références `8328:34965` et `8328:35135` : feuille 402 × 190 à y684 pour deux lignes, en-tête 378 × 60 et grille 378 × 130, marge12. Hauteur selon contenu. Les captures statiques ne qualifient pas les défilements ; voir DSF Circuits du 12/10.

### 10. Responsive, Safe Areas, texte, scroll et clavier

Contenu accessible au-delà de hauteur/largeur disponibles ; support texte agrandi, pas de clavier.

### 11. États de l’écran

Comptes identiques/hétérogènes ; deux régimes ; deux modes ; bilatéral ; longues listes ; circuit vide sans valeurs fictives.

### 12. Contrôles et interactions

Lecture seule ; fermeture selon composant existant ; aucune cellule n’édite les séries.

### 13. Gestes

Défilement horizontal/vertical ; aucune suppression, tri ou déplacement de données dans cette vue.

### 14. Validation

Nombre de colonnes = maximum des comptes actifs ; case absente = tiret, pas zéro.

### 15. Brouillon et persistance

Projection sans écriture. Les scrolls sont état d’interface ; pas une source métier persistée.

### 16. Navigation et conservation d’état

Focus retourne à œil ; état du brouillon et position de composition conservés.

### 17. Erreurs et cas limites

Nom long/12+ séries : défilement sans rognage des cibles. Aucun travail inconnu remplacé par durée arbitraire.

### 18. Accessibilité

Annoncer exercice, numéro de série, cible/unité ; ✓ annoncé Série N à l’échec ; tiret annoncé absence de série ; pastille côté explicitée.

### 19. Invariants

Répétitions numériques + rép. ; durée min:ss ; échec ✓ + À l’échec en dernière colonne. Cibles bilatérales par côté, non doublées, direction près du nom.

### 20. Recette déterministe

A2/B4 avec tirets ;45s/60s/90s→0:45/1:00/1:30 ; échec✓ ; variables égales ; bilatéral10 affiché10 ; défilements ; aucune écriture.

## CE-FMT-01 — Choix du modèle et du format
<a id="ce-fmt-01"></a>

### 1. Identification

Entrée 8598:29271 ; page complète, shell de composition existant. Captures au chapitre 06, ancre formats-galerie.

### 2. Finalité fonctionnelle

Choisir un des six formats contraignants ou un départ rapide libre, sans les confondre.

### 3. Contexte d’entrée

Action de création d’une séance depuis les entrées existantes ; aucune nouvelle condition de compte communautaire.

### 4. Contexte de sortie / destinations

Choix → parcours de paramètres correspondant CE-FMT-02 ; Libre → composition existante ; retour selon navigation du shell.

### 5. Données affichées et source de vérité

Catalogue de modèles ; format et origine distincts. Le nom de la carte n’est pas utilisé comme identifiant métier.

### 6. Classification des valeurs Figma

Images et exemples illustrent le choix. Une photographie de carte modèle ne crée pas un visuel attaché à chaque séance sauvegardée.

### 7. Structure de l’écran

Titre, groupes de cartes de modèles, libellés et descriptions, navigation existante.

### 8. Éléments obligatoires

Distinguer les six formats et les départs rapides ; entrée Libre disponible.

### 9. Layout déterministe

Conserver la grille, proportions, couleurs, images et espacements du nœud 8598:29271. Ne pas convertir les cartes modèles en cartes catalogue. DSF Formats §2.

### 10. Responsive, Safe Areas, texte, scroll et clavier

Grille adaptée à la largeur utile ; Safe Areas ; texte agrandi sans couper le nom ni rendre une carte inaccessible, défilement vertical si nécessaire.

### 11. États de l’écran

Liste disponible ; sélection ; navigation en cours ; erreur d’initialisation du brouillon. Aucun état sélectionné persistant inventé.

### 12. Contrôles et interactions

Tap sur carte initialise le brouillon adapté puis ouvre ses paramètres ; empêcher une double création par double tap.

### 13. Gestes

Tap carte et retour ; aucun glissement requis pour accéder à une entrée.

### 14. Validation

Entrée reconnue ; aucune affectation d’un format par comparaison de titre ou valeurs.

### 15. Brouillon et persistance

Le choix initialise format/origine et paramètres du brouillon ; la sauvegarde explicite de séance reste celle du parcours existant.

### 16. Navigation et conservation d’état

Retour ne transforme pas silencieusement un brouillon déjà composé en autre format ; conservation selon le parcours de brouillon existant.

### 17. Erreurs et cas limites

Ancienne séance sans format reste libre. Carte indisponible ne doit pas créer un objet partiellement typé.

### 18. Accessibilité

Nom accessible de carte égal au modèle ; ordre de focus égal à la lecture ; image décorative non redondante.

### 19. Invariants

pas de verrouillage pour un départ rapide.

### 20. Recette déterministe

REC-01, REC-25 ; choisir chaque entrée et vérifier format/origine, puis la possibilité de modifier une séance libre.

## CE-FMT-02 — Paramètres globaux et récapitulatif
<a id="ce-fmt-02"></a>

### 1. Identification

Famille des paramètres, sélection Tabata et récapitulatifs : inventaire chapitre 06, CE-FMT-02 ; plusieurs états, pas un écran universel inventé.

### 2. Finalité fonctionnelle

Régler les paramètres autorisés et lire les constantes/calculs avant composition.

### 3. Contexte d’entrée

Choix d’un modèle ; brouillon initialisé et exercices sélectionnés selon son parcours.

### 4. Contexte de sortie / destinations

Validation → CE-FMT-03 ; retour → étape précédente en conservant les valeurs selon brouillon existant.

### 5. Données affichées et source de vérité

Paramètres effectifs du brouillon. EMOM : tours, fenêtre, organisation ; durée calculée N×E×W. For time : Volume par tour.

### 6. Classification des valeurs Figma

Constantes Tabata et Intervalles normatives ; nombres d’exercices/tours d’exemple illustratifs ; aucune formule tirée de la maquette.

### 7. Structure de l’écran

En-tête, exercices et bloc de paramètres, durée calculée lorsqu’applicable, action de composition.

### 8. Éléments obligatoires

Tabata : Séries par exercice 8 ; Exécution si plusieurs exercices. EMOM : compte/fenêtre/organisation et total. For time : Volume par tour sans sélecteur. Progression : répétitions par série et organisation.

### 9. Layout déterministe

Exécution en dernière ligne après Durée totale lorsqu’elle existe ; séparateur entre les deux dernières lignes. Titre et options sur une ligne, typographie des paramètres voisins. Sources 8624:30306, 8624:30392, 8656:35062 ; DSF §2.

### 10. Responsive, Safe Areas, texte, scroll et clavier

Largeur du segment limitée à l’espace de valeur ; petits écrans et texte agrandi préservent les libellés et l’accès aux options. Pas de clavier sur une valeur calculée.

### 11. États de l’écran

Paramètres initiaux/modifiés ; organisation sélectionnée ; sélection d’exercices ; erreur de saisie ; total recalculé. Un exercice Tabata : pas de question d’organisation inutile.

### 12. Contrôles et interactions

Changer un réglage recalcule synthèse et durée. Segment change ordre, pas volume. Aucun champ Durée totale éditable EMOM. For time ne propose pas le segment.

### 13. Gestes

Tap sur réglage/option et contrôles existants ; pas de nouvelle gestuelle.

### 14. Validation

Paramètres valides suivant leurs bornes normatives ; aucune borne nouvelle déduite des chiffres de Figma. Échelle et unité cohérentes.

### 15. Brouillon et persistance

Réglages conservés dans brouillon ; la synthèse est générée, jamais stockée comme source.

### 16. Navigation et conservation d’état

Retour conserve les réglages ; changement du nombre d’exercices EMOM conserve N et recalcule le total.

### 17. Erreurs et cas limites

Ne pas arrondir les tours EMOM pour préserver une durée antérieure. Éditeur de longueur For time : raccordement R-04 explicitement non qualifié.

### 18. Accessibilité

Segment expose nom, choix et sélection ; total calculé annoncé sans provoquer une annonce à chaque rendu ; constante expliquée autrement que par couleur.

### 19. Invariants

pas de durée saisie pour les formats cadencés à compte.

### 20. Recette déterministe

REC-02, 04–05, 09–11, 14, 16–18, 28 ; vérifier même volume avant/après organisation.

## CE-FMT-03 — Composition d’une séance issue d’un format
<a id="ce-fmt-03"></a>

### 1. Identification

Famille des compositions préremplies ; notamment Tabata 8747:14320, EMOM 8795:14449, Progression 8795:14681. Complète CE-T03-08.

### 2. Finalité fonctionnelle

Éditer les réglages autorisés d’une séance déjà composée et consulter sa prescription effective.

### 3. Contexte d’entrée

Validation du récapitulatif ou réouverture d’une séance sauvegardée.

### 4. Contexte de sortie / destinations

Modale de paramètres CE-FMT-04 ; sauvegarde de séance ; départ vers exécution selon règles existantes.

### 5. Données affichées et source de vérité

Format, origine, paramètres contextualisés, organisation, cartes et synthèse calculées depuis la séance courante.

### 6. Classification des valeurs Figma

Valeurs d’exemple ne font pas autorité sur durée calculée. Le 1 tour de représentation par exercice ne remplace pas le compte de passages EMOM.

### 7. Structure de l’écran

Shell composition existant : en-tête, circuit et cartes ordonnées, récupérations/points présents selon règles existantes, actions de composition.

### 8. Éléments obligatoires

Tabata par exercice : un tour dans la configuration de référence, cartes 8×20 s. Progression alternée : compte en séries. Réglages autorisés restent accessibles.

### 9. Layout déterministe

Conserver l’implantation des cartes du chapitre 06. Volume dans l’emplacement existant sans cadre ajouté. Pas de pause dans le libellé 8×20 s ; aucune récupération fictive pour montrer la pause.

### 10. Responsive, Safe Areas, texte, scroll et clavier

Défilement du contenu et actions du shell ; Safe Areas ; ordre visuel cohérent avec l’ordre accessible. Textes longs conservent les règles existantes.

### 11. États de l’écran

Brouillon initial/modifié/sauvegardé ; réorganisation ; erreur de sauvegarde ; constantes effectives en lecture seule.

### 12. Contrôles et interactions

Édition autorisée recalcule immédiatement synthèse et métriques. Ajout/retrait EMOM conserve N. Les opérations permises ne changent pas le format.

### 13. Gestes

Gestes de composition existants ; pas de geste de conversion du format ajouté.

### 14. Validation

Au moins un exercice valide ; aucune double multiplication du compte du format par sa représentation locale. Contraintes réappliquées après édition.

### 15. Brouillon et persistance

Persister paramètres et origine/format ; générer la phrase en segments. Ne pas modifier ActivityDefinition du catalogue pour un héritage contextuel.

### 16. Navigation et conservation d’état

Réouverture restaure paramètres effectifs ; annuler suit le brouillon existant ; historiques conservés.

### 17. Erreurs et cas limites

Anciennes séances restent libres ; suppression d’exercice recalcule les valeurs dérivées. Redimensionnement For time reste R-04, sans destruction implicite inventée.

### 18. Accessibilité

Cartes, compte et unité lisibles ; expliquer le verrouillage ; déplacement accessible suit le contrat de composition existant.

### 19. Invariants

Pas de récupération par défaut ajoutée pour Tabata ; phases propres d’exercice exclues des séances ; bilatéralité dans fenêtres reste R-02.

### 20. Recette déterministe

REC-02–07, 11, 16–17, 25–26 ; vérifier le même résultat après sauvegarde/réouverture et l’historique inchangé.

## CE-FMT-04 — Paramètres d’exercice contextualisés par un format
<a id="ce-fmt-04"></a>

### 1. Identification

Famille des modales ; Tabata par exercice 8747:14451, EMOM par exercice 8795:14588 et autres nœuds CE-FMT-04 de la galerie. Complète CE-UI-10.

### 2. Finalité fonctionnelle

Lire les paramètres effectifs imposés et éditer seulement ceux autorisés dans le contexte de séance.

### 3. Contexte d’entrée

Ouverture depuis une carte de composition ; occurrence et format connus.

### 4. Contexte de sortie / destinations

Validation/fermeture → même composition, état conforme au brouillon existant.

### 5. Données affichées et source de vérité

Paramètres effectifs de l’occurrence, provenance de la contrainte, phrase générée. Ne pas afficher les valeurs brutes du catalogue si elles sont remplacées par le format.

### 6. Classification des valeurs Figma

Tabata Durée/8/20 s/10 s : constantes métier ; exemples EMOM ne définissent pas de nouvelle borne. Le texte de fond reste celui de la séance.

### 7. Structure de l’écran

Modale du système existant : titre, phrase, lignes paramètres, contrôle de fermeture et voile.

### 8. Éléments obligatoires

Quatre valeurs Tabata réelles grisées non modifiables et raison visible. Valeur effective imposée ≠ valeur sans effet : aucun tiret de remplacement.

### 9. Layout déterministe

Réutiliser tailles, alignements, voile et lignes de la modale de référence. Le grisé approuvé s’applique au contrôle/à la valeur ; garder les libellés et la raison lisibles. Aucun nouveau voile.

### 10. Responsive, Safe Areas, texte, scroll et clavier

Hauteur/scroll et Safe Areas selon CE-UI-10 ; clavier uniquement pour les champs autorisés ; texte de justification accessible au grossissement.

### 11. États de l’écran

Imposé effectif ; éditable ; erreur de saisie. Ne pas confondre avec indisponible sans effet ou héritage structurel du nombre de séries.

### 12. Contrôles et interactions

Tap sur constante n’ouvre pas un éditeur. Changement autorisé actualise la phrase et les calculs sans écraser la définition catalogue.

### 13. Gestes

Fermeture et interactions existantes de modale ; pas d’appui long requis pour comprendre la raison.

### 14. Validation

Refuser une modification des constantes au niveau métier, même si une commande UI incorrecte est envoyée.

### 15. Brouillon et persistance

Valeurs modifiées dans le brouillon contextualisé ; phrase non persistée ; validation selon contrat existant.

### 16. Navigation et conservation d’état

Retour ferme la modale et restitue le focus à la carte ; annulation ne laisse pas de mutation partielle du format.

### 17. Erreurs et cas limites

For time : phrase par tour, jamais « 21,15 puis9 à chaque tour ». Intervalles : 30/30, jamais 20/30. Les captures en écart restent identifiées.

### 18. Accessibilité

Lecture de la valeur réelle et de la raison ; état non modifiable annoncé ; grisé seul insuffisant ; contraste selon DSF.

### 19. Invariants

les constantes restent effectives dans le moteur futur.

### 20. Recette déterministe

REC-08, 18 ; vérifier absence d’éditeur sur les quatre constantes et absence de tiret ; contrôle des segments et de l’unité tour.

## CE-FMT-05 — Exécution des fenêtres et formats à borne ouverte
<a id="ce-fmt-05"></a>

### 1. Identification

Complément fonctionnel CE-EXEC-SESSION-01. Aucun écran d’exécution spécifique qualifié dans les 46 captures ; layout non clôturé.

### 2. Finalité fonctionnelle

Exécuter la prescription selon sa borne et son unité sans double comptage ni transition anticipée.

### 3. Contexte d’entrée

Démarrage d’un instantané valide ; format et paramètres effectifs figés.

### 4. Contexte de sortie / destinations

EMOM : fin du nombre prévu de fenêtres ; AMRAP : échéance globale ; Death by : CE-FMT-06. Pas de fin par un compte d’exercices supposé.

### 5. Données affichées et source de vérité

Instantané, horloge, rang/échéance/objectif courants et signal de travail accompli ; données de résultat distinctes.

### 6. Classification des valeurs Figma

Les captures de composition ne prouvent pas le layout d’exécution. Les nombres du cadran sont calculés depuis l’exécution, pas copiés de Figma.

### 7. Structure de l’écran

Réemploi du shell Exécution ; cadran de fenêtre et contexte exercice. Position précise des informations propres au format à illustrer avant qualification visuelle.

### 8. Éléments obligatoires

Objectif et fenêtre courante ; temps restant ; distinction travail/repos ; rang distinct de tours acquis Death by.

### 9. Layout déterministe

Pas de coordonnées nouvelles prescrites sans frame. Conserver shell, Safe Areas et hiérarchie existants ; compléter la preuve de layout pour les informations propres au format.

### 10. Responsive, Safe Areas, texte, scroll et clavier

Commandes accessibles sans recouvrir le cadran ; textes agrandis et lecteurs d’écran ; aucun clavier pour saisir le rang.

### 11. États de l’écran

Travail ; travail confirmé/repos révélé ; échéance ; clôture. R-01 couvre le raccordement avec pause utilisateur/reset/point et reprise.

### 12. Contrôles et interactions

Appui sur cadran révèle le repos sans avancer. Death by acquiert au plus une fois la fenêtre accomplie. L’échéance EMOM relance quoi qu’il arrive. Aucune saisie manuelle de rang.

### 13. Gestes

Appui cadran explicite ; son et média ne confirment pas de travail. Gestes génériques ne doivent pas contourner l’échéance.

### 14. Validation

Identité de fenêtre/exécution vérifiée, doublons idempotents ; objectif issu du rang et des paramètres. Cas multi-exercices Death by R-03 non extrapolé.

### 15. Brouillon et persistance

Conserver instantané, événements/résultats qualifiés et échéances nécessaires ; pas de liste infinie de fenêtres précréée.

### 16. Navigation et conservation d’état

Reprise sans double acquisition ni lecture de la source modifiée ; politique de suspension/reprise exacte à raccorder en R-01.

### 17. Erreurs et cas limites

Fenêtre sans appui ≠ objectif confirmé. Audio indisponible ne doit pas devenir l’horloge métier. R-02 bilatéralité reste explicitement non qualifié.

### 18. Accessibilité

Annonces des changements de phase, objectif et fin de fenêtre ; repos et travail différenciés autrement que par couleur ou son.

### 19. Invariants

repos inclus dans fenêtre ; pas de multiplicateur caché pour côtés.

### 20. Recette déterministe

REC-10–15, 19–21, 27 ; ces scénarios sont prescrits, non exécutés sur un moteur livré.

## CE-FMT-06 — Arrêt et résultat Death by
<a id="ce-fmt-06"></a>

### 1. Identification

Contrat fonctionnel de confirmation et raccord à CE-UI-08. Aucun nœud de confirmation Death by identifié dans l’inventaire courant ; layout partiel.

### 2. Finalité fonctionnelle

Clore avec un motif fidèle et un résultat tours acquis + répétitions partielles, sans confondre résultat et achèvement.

### 3. Contexte d’entrée

Un seul déclencheur de fin pendant une exécution Death by ; dernière fenêtre et acquisitions connues.

### 4. Contexte de sortie / destinations

Validation → synthèse/résultat ; refus de clôturer conserve l’exécution selon contrat de confirmation existant, sans acquérir un tour.

### 5. Données affichées et source de vérité

Tours acquis par appuis valides, dernière fenêtre non acquise, répétitions partielles proposées à zéro, motif limite/abandon et état incomplet.

### 6. Classification des valeurs Figma

12 tours + 5 répétitions est un exemple de résultat ; zéro initial est une proposition de saisie, non une mesure.

### 7. Structure de l’écran

Confirmation à deux choix métier : Limite atteinte / Abandonner ; saisie des répétitions partielles lorsqu’applicable ; synthèse ensuite.

### 8. Éléments obligatoires

Un seul déclencheur d’arrêt ; deux motifs ; saisie partielle si fenêtre entamée inachevée ; résultat et état incomplet indépendants du motif.

### 9. Layout déterministe

Réutiliser le système de modale de confirmation ; emplacement précis des deux choix et du champ à illustrer. Ne pas prétendre ce layout validé depuis une capture de paramètres.

### 10. Responsive, Safe Areas, texte, scroll et clavier

Clavier numérique pour répétitions ; valeur/action accessibles au-dessus du clavier et via scroll selon shell modal ; Safe Areas.

### 11. États de l’écran

Confirmation ouverte ; valeur proposée/modifiée ; validation ; erreur ; clôture. Aucune issue « Terminée » sur limite atteinte.

### 12. Contrôles et interactions

Saisie initiale 0 ; validation confirme la valeur affichée ; choisir le motif ne crée pas de tour supplémentaire. Empêcher une double clôture.

### 13. Gestes

Actions explicites ; la fermeture non validée ne doit pas enregistrer la proposition comme mesure.

### 14. Validation

Valeur entière non négative conforme au type répétitions ; ne pas inventer une borne max issue de Figma. Contrôle de cohérence avec fenêtre et résultat avant validation.

### 15. Brouillon et persistance

Persister le résultat confirmé, son motif et l’achèvement incomplet avec l’instantané ; brouillon du formulaire non assimilé à un relevé acquis.

### 16. Navigation et conservation d’état

Après clôture, synthèse puis suivi existants ; l’édition ultérieure de la séance ne modifie pas ce résultat. La représentation d’un Death by incomplet sera définie dans le chantier Suivi (D-381, D-365).

### 17. Erreurs et cas limites

Aucun appui dans la dernière fenêtre : aucun tour acquis pour elle. Aucun doublon de clôture. Cas sans répétitions partielles à afficher selon valeur effective, sans faux objectif accompli.

### 18. Accessibilité

Champs et choix nommés ; focus contenu dans la modale ; annonce du motif et du résultat ; retour du focus si non-validation.

### 19. Invariants

FMT-34–38 ; limite atteinte et abandon donnent tous deux incomplet ; rang déduit de l’horloge.

### 20. Recette déterministe

REC-20–24 ; 12 tours confirmés +5 déclarées ; zéro validé conservé comme déclaration ; double appui sans double acquisition.

## Clarification d’autorité et de portée

Les spécifications définissent les règles métier, les calculs et les comportements. Figma illustre les scénarios de présentation des écrans et contrôles. Un scénario absent de Figma ne constitue pas une lacune fonctionnelle lorsque son comportement est spécifié. Les shells, composants, DSF et contrats existants permettent de décliner des états sans dessiner chaque combinaison.

R-01 à R-05 sont des sujets de vérification ciblée, pas cinq blocages démontrés ni un préalable global au développement. R-01 concerne les commandes du moteur à fenêtres ; R-02 son exécution bilatérale ; R-03 l’enchaînement Death by multi-exercices. Leurs réponses doivent être recherchées dans les spécifications avant toute question. R-04 concerne uniquement la synchronisation des champs de l’éditeur For time s’ils sont modifiables séparément ; le contrôle du double comptage EMOM relève de l’implémentation et de ses tests. R-05 ne bloque rien du seul fait de captures absentes : une clarification de présentation n’est nécessaire que si l’implantation d’un élément nouveau ne peut pas être déterminée depuis les contrats et le DSF.

Aucun de ces constats ne suspend globalement la création/composition. Seule une règle effectivement absente ou contradictoire doit être clarifiée avant l’implémentation du comportement concerné. Les mentions de preuve visuelle partielle décrivent la couverture des illustrations, pas une obligation de produire une nouvelle maquette.

<a id="editeur-parametres"></a>

## Règles communes de l’éditeur de paramètres

### Feuille et contrôles

| Ordre | Ligne | Contrôle / visibilité |
|---|---|---|
| 1 | Mode d’exécution | Valeur puis popover Durée/Répétitions, deux options |
| 2 | Séries | Valeur numérique, défaut1 ; appui révèle ± si N libre ; valeur réelle en lecture seule avec origine si N hérité du circuit |
| 3 | Régime des séries | Valeur identiques/variables et popover ; chevron indépendant uniquement si variable ; normalisation N1 existante conservée |
| 4 | Cible et Pause | Uniforme : lignes Durée/Répétitions et Pause après chaque série ; variable : tableau rattaché au champ de régime, ligne numérotée, poignée, cible et Pause par steppers ; À l’échec : cible textuelle sélectionnable, sans nombre prescrit |
| 5 | Changement de côté | Popover, sans changement / D→G / G→D (DSF du 12/10, D-377) |
| 6 | Ordre des côtés | Bilatéral uniquement, deux options ; grisé à1 |
| 7 | Pause entre les côtés | Bilatéral uniquement, stepper ; copie du Profil à activation |
| 7b | Bip de cadence | Deux modes ; stepper0..10,0=Aucun ; premier niveau, juste avant le total applicable ; commun hors tableau variable. |
| 8 | Durée totale | Durée uniforme chiffrée avec N libre : roulette ; N hérité du circuit, variable/Répétitions avec bip : lecture seule ; Répétitions sans bip et toutes cibles À l’échec : absente ; mélange calculable : ≥ en lecture seule ; cible nécessaire au calcul manquante : ligne affichée avec « — » (D-384) ; ligne affichée à N = 1 comme à N > 1 (D-396) |
| 9 | Compte à rebours | Stepper ; défaut Profil10s |
| 10 | Fin d’exercice | Stepper ; défaut Profil5s |

Création : mode/durée/côté non renseignés —, Série1, Pause0s ; cible Répétitions uniforme initiale1 ; aucune cible implicite lors d’un changement de mode variable. Une cible à renseigner (—) ouvre la roulette sur la plus petite valeur valide, sélectionnée : 00:05 en Durée, 1 en Répétitions ; rien n’est appliqué avant le ✓ de la roulette ; ✕ laisse la cible à renseigner (décision PRE-4 Q25 du 16/10, D-385). Côté vide normalisé Sans changement à validation. La feuille entière défile sous un en-tête ✕/titre/✓ fixe. Ouverture : voile en fondu sur place, feuille montante depuis le bas ; « Réduire les animations » : feuille en place . Un seul popover/roulette ouvert ; les boutons ± apparaissent à l’appui sur une valeur numérique ; un seul champ est actif, sans modale supplémentaire. Glisser une Série : corps immobile et repère d’insertion entre les lignes . Le chevron masque le tableau sans modifier les données ni désactiver le mode variable.

État historique livré PRE-3 : sélecteurs segmentés et steppers permanents, avec fermeture progressive D-339 et typographie D-341. Le DSF du12/10 et Deux modes du13/10 remplacent la présentation D-341 pour la prochaine tranche (D-377) ; la fermeture après sélection de D-339 est conservée, y compris dans les popovers (D-377). Ces DSF ne prétendent pas être déjà réalisés.

| Paramètre | Bornes | Granularité validée le02/10 |
|---|---|---|
| Séries | 1..99 | 1 |
| Répétitions par Série | 1..100 | 1 |
| Durée par Série | 5..3535s | Roulette par pas de5s ;00:00 interdit comme cible |
| Pause après chaque série / Pause entre les côtés | 0..300s | Tap1s ; maintien accéléré1/5/10 selon DSF Bip |
| Bip de cadence | 0..10s | 1s, aucune accélération |
| Compte à rebours / Fin d’exercice | 0..60s | 1s  |

Steppers : tap1 ; maintien≈500ms, puis paliers5 après≈2s et10 après≈4s, arrondi directionnel au multiple et saturation aux bornes. Bip/Compte à rebours/Fin restent au pas1. Relâchement arrête et rétablit le pas1 ; pas d’arrondi à l’ouverture. Voir DSF Bip. Les roulettes ne sont pas redéfinies par cette règle.

✓ grisé tant que le mode ou une cible active exigée est invalide ; cellule concernée signalée par son contour ; aucun message en ligne (D-337, 12/10 : remplace le message nommant la Série à renseigner). Une cible obligatoire sans valeur, représentée par « — », reçoit un fond rouge pâle ; sur un stepper, les cercles − et + conservent leurs couleurs normales ; le fond redevient normal dès qu’une valeur valide est saisie (D-389 ; `À CLARIFIER` : maintien ou retrait, dans ce cas, du contour de D-337, non tranché). Pause0 valide. Une valeur héritée hors bornes, non modifiée, reste valide ; toute nouvelle saisie ou modification respecte les bornes (D-383). Repli du tableau ne contourne jamais la validation. Nom, Catégorie et Zones restent validés dans le parent.

### Sélecteur de cible — complément §4.5 du13/10

À tout instant, exactement une cible est sélectionnée. À l’ouverture : cible numérique → roulette active sur la valeur courante et libellé échec à45% ; cible échec → libellé actif et bloc numérique grisé à45%, affiché à00:00. Faire tourner la roulette sélectionne la valeur numérique et grise le libellé. Toucher le libellé sélectionne l’échec et ramène la roulette grisée à00:00. Le grisé exprime la non-sélection, pas une interdiction de manipuler la roulette. Aucun geste supplémentaire de déverrouillage, aucune coche. Validation par le bouton de la feuille ; annulation selon le brouillon existant.00:00 n’est jamais une cible valide ; pause0 reste valide.

**Bornes confirmées le13/10 :** cible Durée de00:05 à58:55 (5–3535s), sélecteur par pas de5s. Hermann corrige explicitement la borne maximale :58min55s ;5999s était une coquille. Répétitions : entiers1–100.00:00 reste réservé à la représentation neutre de l’échec, jamais une cible. Les valeurs historiques ne sont pas arrondies silencieusement à la lecture ; les contrôles de pauses et de Durée totale conservent leurs règles propres.

<a id="formats-raccordement"></a>

### Raccordement aux formats de séance

Les paramètres autorisés du format restent modifiables dans la séance composée ; leurs valeurs calculées sont actualisées. Les constantes ne deviennent pas éditables dans l’exercice contextualisé. Tabata par exercice affiche Durée, 8 séries, 20 s, 10 s : valeurs réelles grisées et non modifiables, avec raison ; aucun tiret de valeur sans effet. L’origine de préremplissage seule ne verrouille rien. Le total EMOM est exclusivement calculé, jamais contrôle pilote. Le volume For time est indexé par tour et n’est pas une liste de séries locales.

<a id="controles-circuit"></a>

## Cartes, grille des volumes et interactions de composition

### La fenêtre des volumes du circuit

#### Le besoin

Dans un circuit, la composition ne dit pas ce que contient chaque série de chaque exercice : il faut ouvrir chaque exercice pour le savoir. La vue d'ensemble manque au moment où elle est la plus utile — quand on compose.

#### La règle

Un bouton œil, posé **sur la ligne du titre de l'en-tête de circuit**, ouvre une fenêtre **en lecture seule** présentant une grille :

- une colonne `Exercice` ;
- une colonne par série, `S 1` … `S n` ;
- une **dernière colonne d’unité ou de mode**, à droite : `rép.`, `min:ss` ou `À l’échec`. Les rendus complétés sont définis au §9.5.

**Pas de pauses, pas de récupérations.** On y lit des volumes, pas un déroulé.

#### Le bouton est permanent, dans les deux natures

Il serait défendable de ne l'offrir qu'au circuit de séries, où il est le plus utile. Il est **présent dans les deux natures**, et actif dans les deux : un en-tête de circuit a une composition fixe, qui ne se réorganise pas quand on change sa nature.

#### La grille accepte deux régimes dans la même colonne

Un circuit peut contenir un exercice en séries variables et un autre en séries identiques. La grille les présente dans les mêmes colonnes :

- une ligne **plate** — « 45 · 45 · 45 » — pour un exercice en séries identiques ;
- une ligne de valeurs propres — « 10 · 12 · 14 », par exemple — pour un exercice en séries variables ; elles peuvent aussi décroître ou être égales.

La grille montre les valeurs. Elle ne permet pas de déduire le régime lorsque des séries variables ont des valeurs égales ; le régime reste une donnée explicite de l’exercice.

#### Sens de lecture, et défilement

Le tableau se lit **par colonne** dans un circuit de séries — une colonne est un passage — et **par ligne** dans un circuit de tours — une ligne est un exercice et toutes ses séries. Les deux lectures sont légitimes ; **la structure n'en privilégie aucune**.

Si l'on veut guider la lecture : coloriser une colonne sur deux, ou une ligne sur deux. Pour la place : **figer la colonne de titre et la colonne d'unité**, et faire défiler les colonnes de séries.

**Au-delà de la hauteur de l'écran, la fenêtre défile.** Ce n'est pas une décision de conception, c'est le comportement par défaut ; il n'appelle aucune règle particulière. Mesure utile au dimensionnement : à douze séries, le contenu dépasse de 153 px.

---

### Ce que porte la carte d'un exercice, en composition

#### La règle

**La carte affiche le volume de l'exercice.** Les valeurs séparées par un point médian quand les séries varient, la forme courte sinon. L'unité est en fin d'énoncé.

| cas | affichage | statut |
|---|---|---|
| série unique, durée | `45 s` | inchangé |
| trois séries identiques, durée | `3 × 45 s` | inchangé |
| trois séries variables, répétitions | **`10 · 12 · 14 rép.`** | **nouveau** — remplaçait « 3 séries variables » |
| trois séries, durée composée | `3 × 1 min 30` | inchangé |
| bilatéral | `3 × 10 rép.` + pastille `D→G` | inchangé |
| à l'échec | `3 séries à l'échec` | inchangé |
| douze séries variables | **`10 · 12 · … rép.`** | **nouveau** — remplaçait « 12 séries variables » |

Les rendus variables remplacent l’ancien libellé limité au nombre de séries. Le tableau ci-dessus présente sept exemples, sans prétendre constituer un inventaire exhaustif des états Figma.

#### Le repli, et sa règle

**Autant de valeurs que la place en autorise, trois au maximum, puis `…`.** En pratique : trois valeurs pour les répétitions et les secondes, une seule pour les durées composées, qui sont longues.

Le `…` ne signifie pas « plus de trois séries ». Il signifie **« la suite est dans la fenêtre des volumes »**, ce qui est vrai dans les deux cas.

#### La forme suit le régime, pas les valeurs

Un exercice en régime **variables** dont les trois valeurs se trouvent être égales affiche **`45 · 45 · 45 s`**, et non `3 × 45 s`.

La raison est la **stabilité à l'édition** : sous une règle qui regarderait les valeurs, corriger une seule série ferait changer la *forme* du libellé, pas seulement son contenu. Le lecteur verrait la notation sauter d'un format à l'autre sans avoir rien demandé de tel.

#### Deux arbitrages actés, à ne pas rouvrir

**Le préfixe « N × » est conservé même dans un circuit de séries**, où le nombre est pourtant hérité et déjà écrit dans l'en-tête. La régularité de la carte l'emporte sur l'économie de place.

**La notation ne change pas selon le contexte.** Une carte s'écrit de la même façon qu'elle soit dans un circuit ou hors circuit, dans un circuit de tours ou de séries. Un lecteur peut inférer une absence ; il ne peut pas inférer une règle de notation qui varie. *Omettre ce qui est redondant* reste un principe recevable ; *changer de notation selon le contexte* ne l'est pas.

---

### Le modèle d'interaction des valeurs réglables

Cette section décrit un modèle d'interaction général, appliqué à toutes les valeurs numériques de la modale des modalités d'exécution et aux réglages de composition de séance.

#### Au repos, seule la valeur est visible

Les boutons `−` et `+` n'apparaissent **qu'à l'appui sur la valeur**. Au repos, la ligne ne porte qu'un libellé à gauche et une valeur à droite.

Les boutons apparaissent **à droite de la valeur**, qui recule d'une translation constante. Les mettre à gauche ferait couvrir le chiffre par la main pendant qu'il change.

#### Un seul champ actif à la fois

Appuyer sur une autre valeur ferme le précédent et ouvre le nouveau **d'un seul geste**. Les boutons disparaissent et réapparaissent plutôt que de voyager d'une ligne à l'autre.

#### Il n'y a rien à valider

Chaque appui sur `−` ou `+` est acquis. **L'appui à l'extérieur range l'outil** ; il n'y a pas de bouton Annuler.

C'est ce qui distingue ce modèle du popover de roulette, qui a besoin d'une validation parce qu'un défilement continu n'a pas d'instant de décision.

#### Deux règles de sûreté

**L'appui qui range l'outil ne doit pas activer ce qu'il touche lorsque la cible est destructive.** Sinon on supprime une série en croyant terminer un réglage. Pour une cible inoffensive — une autre valeur, un chevron — l'appui peut faire les deux.

Ranger l’outil ne revient pas sur les appuis ±. Ils restent cependant dans le brouillon transactionnel : ✕ annule l’ouverture de la feuille, ✓ applique au parent. **La suppression manuelle par croix est immédiate, sans confirmation, avec une action « Annuler » restaurant position et paramètres** (§9.6).

#### La cellule active a deux coordonnées

Dans un tableau où les boutons sont communs à toutes les lignes, ils ne disent plus sur quoi ils agissent. La cellule visée est donc désignée **trois fois** : une barre d'accent sur la ligne, un fond coloré sur la colonne, et **la mention textuelle de la cellule dans le pied du tableau** — « Série 1 · Durée ».

---

### Le marqueur d'un déclencheur de popover

#### L'état des lieux, établi par recensement

- le seul composant du DSF qui porte un chevron **déploie ou replie** ; son second emploi, pointant à droite, est la **navigation** ;
- le composant qui sert de déclencheur de popover **ne contient qu'un texte**, sans marqueur — **341 instances** sur la page du prototype, plus 65 contrôles segmentés ;
- une seule exception dans tout le fichier, dans un écran d'exploration ancien, jamais généralisée.

**La convention établie, à l'échelle de 341 champs, est : valeur bleue, sans marqueur.** Un chevron y dirait « ceci se déploie », ce qui est faux.

#### La règle retenue

**Un déclencheur de popover situé en dehors du formulaire de l'exercice reçoit un fond — une pastille — là où la couleur bleue ne suffit pas à dire qu'on peut appuyer.**

À l'intérieur du formulaire, toute valeur bleue s'appuie : la pastille n'y ajouterait rien et multiplierait les boîtes par écran. **Les 341 champs restent nus.** En faire la règle générale serait une campagne à part, à décider explicitement.

Le cas d'application est l'en-tête de circuit : « 3 **tours** », où seul le mot d'unité reçoit la pastille, le nombre restant nu puisqu'il relève des boutons.

---

<a id="controle-bip"></a>

## Implantation du bip et comportement des steppers

### Interface et steppers

Bip au premier niveau x36 sur référence402, séparateur330px ; juste avant Durée totale, ou à sa position lorsque le total est omis, avant Compte à rebours/Fin. Les sous-lignes Séries variables/cible/Pause et Ordre/PC restent indentées x52, séparateurs314px. La feuille se raccourcit de42px par le haut lorsque le total disparaît, en restant ancrée en bas ; texte agrandi et petits écrans : contenu défilant, aucun rognage.

Step simple=1 unité. Maintien après environ500ms : répétition au pas1 ; après2s : pas5 vers le prochain multiple dans le sens du geste ; après4s : pas10 de même. Relâchement arrête immédiatement et rétablit le pas1, sans pas supplémentaire de fin de maintien. Cadence de répétition technique existante150ms conservée tant que le produit ne la révise pas. Exemple+ depuis13→15→20 ; − depuis13→10→5. Bornes saturées, pas de dépassement ni rebouclage.

L’accélération est désactivée pour Bip, Compte à rebours et Fin d’exercice conformément au prompt ; ils restent au pas1 pendant tout maintien. Les steppers de plus grande plage utilisent les paliers ; aucune accélération appliquée aux roulettes. La règle remplace l’ancienne grille de pas des steppers de pauses dépendante de la valeur. Aucun arrondi au chargement ou à l’ouverture, uniquement lors d’un geste accéléré. Bornes des champs inchangées hors Bip0..10.

<a id="rendu-phrase"></a>

## Rendu et accessibilité de la phrase

### Rendu et accessibilité

Zone cliquable unique, segments non interactifs. Inter13 Regular, interligne20 ; valeurs Semi Bold dans le texte courant. Référence402 : x39, largeur324 ; hauteur intrinsèque, retour naturel, aucun plafond de caractères. Le titre et les lignes Compte à rebours/Fin gardent leur hiérarchie. Zone entière → CE-UI-10, focus unique « Modifier les paramètres d’exécution ». Texte complet accessible et agrandissable ; retour de ligne de présentation avant Durée totale sans changement de grammaire.

La référence7119:27855 est désormais « Phrase longue (224 caractères) », cas144 du corpusv15 : largeur324px, cinq lignes de20px, bloc100px, carte de paramètres193px à hauteur automatique. Ces mesures constatées ne deviennent pas des hauteurs fixes : agrandissement de texte et autres largeurs doivent étendre le contenu sans rogner Compte à rebours/Fin.

Une virgule reste attachée au mot qui la précède : aucune virgule isolée en début de ligne. Les segments sont rendus dans un même flux Text, sans espace ajouté avant la ponctuation ni segments disposés chacun comme une boîte indépendante. Le retour visuel avant Durée totale est une propriété de rendu, pas une modification du texte canonique utilisé par la recette.

<a id="controles-planification"></a>

## Contrôles et layout de planification

### Règles d'interface propres à la planification

Les règles communes de shell, de voile et de blocs sont définies dans les règles transverses du présent chapitre ; les dispositions suivantes précisent la planification.

#### La modale de planification occupe toute la hauteur

La modale part de **y 36** (sous la barre d'état) et descend à 874. Coins supérieurs **carrés**. Elle ne laisse plus voir l'écran appelant.

Justification à consigner : le bandeau résiduel ne montrait qu'un titre générique, sans le jour ni le créneau visés ; il coûtait 56 px pour une information que l'en-tête de la modale donne déjà. Et le formulaire, qui porte cinq sections et s'achève par un engagement, relève de la page plutôt que de la feuille.

#### Les blocs du formulaire

Le formulaire applique les règles communes de blocs du présent chapitre. Deux blocs **ne portent pas de titre**, parce que leur contenu est autoporteur :

- le bloc **Créneau** — ligne Programme + ligne Début le, séparées par un filet. Le titre « Créneau » a été écrit puis retiré ;
- le bloc des **éléments planifiés** (§ 5.3).

Dans la section Répétition, les deux blocs successifs sont séparés par l'écart standard entre deux cartes, **12 px** (§ 0.1).

#### Ordre des sections du formulaire

1. **Créneau** — Programme, puis Début le
2. **Répétition**
3. **Éléments planifiés** (à partir de deux contenus)
4. **Rappel**

Le Rappel est en dernier : il porte sur ce qui a été planifié, il ne peut donc pas précéder la liste des éléments. L'ordre est une conséquence de la lecture, pas une préférence.

#### La ligne Rappel

Même forme que la ligne Répétition : **interrupteur à droite** du titre.

**L'option « Aucun » du contrôle segmenté est supprimée** — comme pour la répétition, c'est l'interrupteur qui porte l'absence. Les options restantes se **répartissent sur toute la largeur, à largeur égale**.

À consigner comme dette de design : ce contrôle est un contrôle segmenté construit à la main, et le DSF n'offre aucune variante au-delà de trois éléments (DSF général, § 8.3).

#### Échelle typographique du formulaire

| élément | style |
|---|---|
| titre de section | **Inter Semi Bold 16** |
| valeurs de paramètre — date, heure, `jusqu'au`, borne, multiplicateur | **16** |
| libellés de ligne, lignes des éléments planifiés | **Medium 14** |
| libellés d'appoint — « Toutes les », le mot d'unité | **Medium 12** |

La règle à retenir : **une valeur que l'utilisateur peut modifier est au corps des titres de section**, pas au corps du libellé qui l'introduit. Les mots de liaison, eux, sont en petit.

#### Le récapitulatif de planification

> Le récapitulatif est **toujours visible** et **jamais chevauché**. Il est posé sur une zone protégée, immédiatement au-dessus du bouton d'action.

| élément | géométrie |
|---|---|
| dégradé de transparence | 40 px, au-dessus du récapitulatif |
| fond opaque | du haut du récapitulatif jusqu'au bas de l'écran |
| récapitulatif | hauteur ajustée à son texte, **16 px** au-dessus du bouton |

Le contenu du formulaire **défile sous** cette zone et s'efface dans le dégradé. C'est ce qui permet au formulaire de dépasser la hauteur de l'écran sans que le récapitulatif ni le bouton ne soient repoussés. C'est aussi ce qui a dissous le problème de débordement : il n'y a plus de hauteur maximale à respecter pour le formulaire.

**Règle fonctionnelle associée :** le récapitulatif se recompose selon les sections actives. Quand la répétition est désactivée, il ne doit pas annoncer de récurrence.

#### Sélection

- Cases à cocher, **jamais de pastilles radio**, y compris quand un seul élément est attendu.
- CTA bas portant le décompte : **« Ajouter 1 élément »** au singulier, **« Ajouter n éléments »** au pluriel.
- Le titre de la modale de choix suit l'option active du contrôle segmenté : « Choisir des séances » / « Choisir des exercices ».
- **Style de l'état retenu**, valable pour le contrôle segmenté comme pour les pastilles de fréquence : fond **#5F60EE**, texte **blanc Semi Bold**. État non retenu : fond **#F9FAFC**, texte **#141414 Regular**.

---
