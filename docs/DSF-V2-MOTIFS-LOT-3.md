# DSF V2 — Motifs visuels et règles de construction — lot 3

**Statut :** relevé documentaire validé pour la PR #247. Ce texte documente le DSF ; il ne modifie aucune planche Figma.
**Référence fonctionnelle active :** `Specifications-fonctionnelles/SPECIFICATION-PARAMETRES-MODALE-v12.md`. La documentation fonctionnelle et le classeur v10 déterminent les règles de gestion ; Figma illustre les états.

## T1 à T4 — paramètres : remplacés par la feuille basse

Les prescriptions de phrase éditable et contrôles inline sont obsolètes sur le parcours Exercice. Référence active : [DSF Paramètres en modale](DSF-PARAMETRES-MODALE-2026-10-01.md) et [spécification v12](Specifications-fonctionnelles/SPECIFICATION-PARAMETRES-MODALE-v12.md). La phrase devient résumé/raccourcis ; steppers, segmentés et roulettes sont dans la feuille. Les badges réutilisés ailleurs conservent leur variante locale ; cette évolution n’impose pas un changement de tous les écrans.

## T5 — Libellés Profil et exercice

Dans les écrans d'ajout ou de modification de l'Exercice, la ligne s'appelle « Fin d'exercice » et montre 5 s ; les écrans Composition séance conservent « Fin de séance », réglage distinct. Sur les cinq écrans Profil :

| Groupe | Libellés |
|---|---|
| Exercice | Pause entre les côtés ; Compte à rebours d'un exercice ; Fin d'exercice |
| Séance | Récupération après un exercice ; Compte à rebours de la séance ; Fin de séance |

Le titre du groupe est « Exercice », et non « Activité ». **Vocabulaire :** le glossaire de la PR #247 définit déjà l'objet métier « Exercice » ; conserver les identifiants techniques existants et signaler toute occurrence documentaire résiduelle d’« Activité » selon son contexte.

## T6 — Groupe de réglages Profil

Fond `#FCFCFE`, liseré blanc de 1 px, ombre `rgba(26,26,38,0.08)` de rayon 10 px et décalage (0, 2), coins 12 px. Les fonds des sous-cadres des lignes de la section Exécution sont transparents. Le rognage des conteneurs « Section — Exécution des séances » et « Profile content » est désactivé pour afficher l'ombre entière.

## T7 — Carte de liste

Précision du 30 septembre : pour les cartes, D-233/D-238 et le complément DSF du 30/09 prévalent sur ce relevé historique (fond archivé, Composition, retrait de Déployer avec Photo). Les règles de badge T4 et les autres motifs non remplacés restent applicables.

Fond `#FCFCFE`, liseré intérieur `#CCD1E0` de 0,5 px, ombre `rgba(26,26,38,0.08)` de rayon 10 px et décalage (0, 2), quatre coins de 8 px. Format relevé sur 76 cartes et 25 écrans : catalogues des Exercices et des séances, sélections en modale et Suivi.

| Variante | Traitement |
|---|---|
| Archivée | Fond `#F5F5F5`, contour `#D9D9D9` de 0,5 px ; ombre et coins du format commun |
| Sélectionnée dans Composition séance — Sélection exercices | Contour de 1,5 px conservé |
| Carte de Composition séance sous un voile de modale | Autre famille : coins 14 px, contour `#E3E3EB` ; hors standard de carte de liste |

Si un cadre rognant de même taille contient le rectangle de fond, porter fond, contour, ombre et coins sur ce cadre extérieur (42 cartes concernées). La carte « Squat assisté » déployée avec média suit cette règle ; le cadre rogne toujours son second média. Dans certaines listes défilantes, l'ombre latérale est limitée au bord des cartes ; le liseré reste visible.

## T8 — Action « Démarrer »

Cercle `#8283F2`, liseré blanc et ombre ronde de rayon 10 px à 18 % d'opacité. Le cadre « Icône — Démarrer » de 28 × 28 px ne rogne pas le rendu. Correction appliquée aux 90 icônes relevées sur 30 écrans. La couleur exacte de cette ombre n'est pas fournie par le lot 3.

## T9 — Cartes et liste Suivi

Référence historique du lot3, supersédée sur le déploiement par D-262 le03/10/2026 : les cartes Suivi suivent le format de carte de liste, avec quatre coins de 8 px, y compris le cadre « Cartes — Hier ». La **zone visible de la liste** de « Suivi — Séances — Vue déployée » atteint 540 px, jusqu'au début de la zone protégée ; le **cadre du groupe de cartes** suit la hauteur de ses cartes pour ne pas tronquer « Dos et mobilité ». Ces deux contraintes s'appliquent à des cadres distincts.

## Règles communes de construction

1. Porter l'ombre sur un cadre dont le rendu extérieur n'est pas rogné. Si un cadre rognant de même taille contient le rectangle de fond, porter le style sur ce cadre.
2. Désactiver le rognage sur tout conteneur qui doit laisser visible l'ombre d'un enfant, notamment « Icône — Démarrer ».
3. Adapter la hauteur des groupes de cartes à leur contenu ; distinguer cette hauteur de celle d'une fenêtre de liste défilante.
4. Masquer ou retirer les segments de texte vides en mise en page automatique : l'écran « Création activité — À l'échec » montrait un espace résiduel de 5 px.

## Références de vérification Figma

- Carte : « Catalogue des Exercices — Liste », `3786:5223`.
- Groupe Profil : `5288:5436`.
- Badge édité « 1 min 30 s » : `5053:6069`.
- Icône Démarrer : `3834:5390`.
- Contrôle segmenté Changement de côté : `4959:6202`.

Ce relevé ne valide ni le code de l'application ni l'intégration physique des nouveaux motifs dans les planches DSF de Figma.


## T10 — Consultation média pendant l’Exécution (MVP)

D-203 inclut au MVP la face Média et son état plein écran pour les Exercices disposant déjà de médias. La bascule Information/Média utilise l’action circulaire d’exécution de 32 × 32 px : fond solide `#FDFDFE`, liseré blanc de 1 px, ombre `rgba(26,26,38,0.08)` de rayon 10 px et décalage (0, 2), spread 0, derrière le calque. Les boutons de bascule de côté haut et bas sont symétriques et utilisent l’icône vectorielle `bitcoin-icons:flip-horizontal-filled` en noir `#000000`, au-dessus de son fond dans l’empilement. La face Média présente un média à la fois, la pagination de galerie, la lecture vidéo sans lancement automatique et l’accès au plein écran. Le plein écran conserve le cadre flottant de suivi et les contrôles média dédiés. Les captures de référence sont `4997:6113` et `5009:6069` ; `4997:6015` est absent et ne sert pas de preuve visuelle. Le libellé « Série X/3 • Tour X/3 » suit le motif de l’écran d’exécution à 24 px ; `4997:6113` apparaît encore à 17 px : écart Figma à corriger. L’ajout/import dans l’éditeur n’est pas couvert par ce motif.


## Paramètres — consolidation du02/10/2026

Référence courante : [v12](Specifications-fonctionnelles/SPECIFICATION-PARAMETRES-MODALE-v12.md), [DSF](DSF-SERIES-VARIABLES-2026-10-02.md), [matrice](MATRICE-SERIES-VARIABLES-2026-10-02.md) et [rapport](RAPPORT-MISE-A-JOUR-SERIES-VARIABLES-2026-10-02.md). D-247 à D-255 remplacent les anciennes formules et descriptions uniformes sur ce périmètre. Les règles de cartes sans rapport avec les paramètres restent conservées. Les nouvelles copies fournissent le layout ; elles ne prouvent ni intégration DSF ni conformité du moteur.


**Complément courant cartes :** [durée sans cadre, propriété Durée et géométrie](DSF-CARTES-DUREE-2026-10-07.md). Les276 textes v14 et les segments `{texte, gras}` sont définis dans [Phrase v1 actualisée](Specifications-fonctionnelles/SPECIFICATION-PHRASE-PARAMETRES-EXECUTION-v1.md).
