# DSF — Segmentés et titres d’écran — 07/10/2026

[Source reçue](archives/complements-2026-10-07/demande-source.md) · [Traçabilité](MATRICE-COMPLEMENTS-2026-10-07.md) · décisions D-324 à D-326. Complément au DSF Cadence ; aucune refonte de shell.

**Mise à jour du 18/10/2026 — spécification v3.0 :**
- Remplacé pour la présentation : au §3, pour les contrôles de la feuille des paramètres, la typographie des libellés de segmentés (D-413 : options inactives en texte gris Regular) et les exceptions Changement de côté (options Avec / Sans, D-406) et Ordre des côtés (libellé visible Enchainement, notation à flèches de Figma, D-413) ; la description des cadres de paramètres existants (rayon 12, fond opaque, contour), remplacée par les quatre cadres de D-413. Le standard Catalogue Exercices / Séances, ses variantes et les titres d’écran sont inchangés.
- Comportements : règles RM-235 à RM-250 du chapitre 10, [Charge, côtés, cadence et condition d’arrêt — règles du 18/10/2026](Specifications-fonctionnelles/10%20%E2%80%93%20Processus%20m%C3%A9tier%20et%20r%C3%A8gles%20m%C3%A9tier%20transverses.md#charge-côtés-cadence-et-condition-darrêt--règles-du-18102026) (décisions D-403 à D-413 du [registre](Specifications-fonctionnelles/07%20%E2%80%93%20Registre%20des%20d%C3%A9cisions%20de%20conception.md#parametres-execution-20261018)) ; ce DSF n’en reprend pas l’énoncé. Les valeurs des captures restent illustratives.
- Présentation nouvelle de la feuille des paramètres (D-413 ; spécification v3.0, GR-01 et PR-01 à PR-04 ; référence 402 × 874) : quatre cadres successifs espacés de 8 px, dans l’ordre de D-413 ; contrôles segmentés alignés à droite, titres à gauche, sans enveloppe blanche ; tableaux à fond blanc sans contour, lignes de 36 px, sans boutons +/− de tableau ; Cadence en 12 px ; labels Regular, plus petits que les valeurs ; options inactives en texte gris Regular sur le fond des champs variables ; option sélectionnée selon le traitement violet existant ; saisie de la charge au clavier décimal, tableau visible au-dessus du clavier avec une marge de 12 px (D-405) ; chevrons à l’intérieur des options Variables (Type de série) et Avec (Changement de côté) (D-410) ; Durée de l’exercice avec son chevron à 12 px du libellé (D-409).
- Tokens : les valeurs correspondantes sont à relever dans Figma avant publication ; aucun nouveau token n’est défini ici.

## 1. Portée fonctionnelle

Le Catalogue et les modales de sélection de type de contenu proposent exactement **Exercices / Séances**. Parcours/Circuits n’est ni affiché, ni désactivé, ni réservé dans la largeur, ni présent dans l’arbre d’accessibilité. Séances reste le défaut du Catalogue. Les mécanismes de sélection et de retour existants sont conservés. Les sélecteurs Calendrier, Mode et Statut ne perdent aucune option par cette décision.

Circuit reste la structure interne à la Séance ; le concept autonome Parcours reste post-MVP. La suppression du troisième segment de code est [FUNC-SEG-02](BACKLOG-SEGMENTS-CATALOGUE-2026-10-07.md), hors brief d’alignement visuel. D10 de l’ancien brief est caduc pour le catalogue : ne pas implémenter un simple renommage Circuits → Parcours.

## 2. Géométrie et peinture du standard

| Élément | Prescription |
|---|---|
| Cadre standard à largeur de référence | 354 × 42 px ; padding4, gap4 ; rayon14 ; sans contour |
| Fond du cadre | Blanc, `VariableID:2290:54`, opacité du remplissage0,5 ; opacité du nœud1 |
| Deux options | 171 × 34 px chacune ; `(largeur − 2×padding − gap) / 2` ; flex égal à toute largeur |
| Option sélectionnée | Indigo du rôle de sélection/action, texte blanc, rayon10 |
| Option inactive | #EAEAFF, texte sombre, rayon10, sans contour |
| Trois options, où elles restent requises | Même largeur utile répartie en trois ;112,67px à354, padding4 et deux gaps4 ; ne pas conserver cette largeur sur un Catalogue à deux options |

**Opacité Figma :** la surcharge de remplissage50% doit être rétablie après liaison au token si Figma la remet à100%. Ne pas appliquer0,5 au conteneur entier : textes et options seraient atténués. Cette précaution de manipulation n’ajoute aucun état fonctionnel ni animation.

## 3. Typographie

[remplacé par D-413 le 18/10/2026 pour les contrôles de la feuille des paramètres : options inactives en gris Regular, tailles à relever dans Figma] Libellés : style **KODJO / Section title**, Inter Semi Bold16, interligne20. Cela couvre Catalogue, Calendrier Jour/Semaine/Mois, Suivi, Mode, Mode d’exécution et Statut des séances. La prescription vise les libellés de segmenté, pas toutes les valeurs et lignes de paramètres.

| Exception conservée | Typographie |
|---|---|
| [remplacé par D-406 le 18/10/2026 : options Avec / Sans] Changement de côté |13px, libellés sur deux lignes |
| [libellé visible : Enchainement, D-413 le 18/10/2026 ; notation à flèches de Figma, RM-243] Ordre des côtés | Titre14px ; sous-titre11px |

Conserver leurs géométries de feuille et leur contenu. Le document reçu décrit le cadre standard ; l’inspection distingue les cadres de paramètres existants [remplacé par D-413 le 18/10/2026 : quatre cadres gris, sans contour] (rayon12, fond opaque, contour) du standard Catalogue (rayon14, blanc50%, sans contour). Aucun élargissement de la modification à ces cadres n’est déduit de l’harmonisation typographique.

## 4. Variantes du set 5548:9818

Le set **DSF / Controls / Segmenté** contient désormais huit variantes : six conservées et deux nouvelles.

| Nœud | Variante | Rôle / état |
|---|---|---|
|6679:26352|Deux détaillé — premier|Ordre des côtés,14/11 conservé|
|6679:26361|Deux détaillé — second|Ordre des côtés,14/11 conservé|
|6981:14877|Trois éléments — 1 sélectionné|Ancienne variante conservée|
|6981:14863|Trois éléments — 2 sélectionné|Ancienne variante conservée|
|6981:14870|Trois éléments — 3 sélectionné|Ancienne variante conservée|
|6981:14884|Deux éléments — 1 sélectionné|Ancienne variante conservée|
|7388:13779|Deux options — 1 sélectionné|Exercices sélectionné ; référence courante Catalogue|
|7388:13786|Deux options — 2 sélectionné|Séances sélectionné ; référence courante Catalogue|

Les deux nouvelles variantes mesurées ont354×42, options171×34, rayon14/10, blanc50%, inactive#EAEAFF et libellés16/20. Leur sélection indigo est visuellement#5F60EE ; la peinture d’option est locale dans ces maîtres, sans liaison de variable constatée. La valeur correcte n’est donc pas une preuve de liaison au token. Le cadre blanc est lié à2290:54.

**Propagation partielle explicitement conservée :** les quatre anciennes variantes simples du set gardent des libellés14px, cadre rayon12 opaque et contour. Les deux détaillées gardent14/11 et leur géométrie. Ne pas les déclarer alignées au standard nouveau ; ne pas utiliser leur texte14px comme prescription courante. Le prototype montre les segmentés standard à16/20. Ce lot documentaire ne modifie pas les maîtres Figma.

## 5. Titres et noms de références

| Usage | Titre visible | Référence |
|---|---|---|
| Création d’un Exercice | Créer un exercice | CE-T03-04 |
| Modification d’un Exercice | Modifier un exercice | CE-T03-04, inchangé |
| Nouvelle Composition | Composer une séance | CE-T03-08 |
| Modification d’une Séance | Modifier une séance | CE-T03-08 |
| Autre titre expressément exclu | Créer une activité | Inchangé |

Les IDs, chemins PNG, noms de frames et annotations ne sont pas renommés dans ce lot. Les titres visibles font foi pour l’affichage ; les noms historiques servent au repérage. Les boutons Ajouter conservent leurs destinations : notamment Ajouter un exercice en Composition ouvre la sélection multiple CE-T03-07. Aucun arbre de création n’est réintroduit et aucune action de création n’est ajoutée à cette modale.

## 6. Contrôles effectués

Lecture en direct des pages Prototype MVP et Communautaire : chacune présente25 contrôles de type de contenu à deux libellés Exercices/Séances et aucun Parcours dans ces contrôles. Sur Prototype MVP :24 Calendriers,3 Suivis et3 Modes à16/20 ;1 Changement de côté13 et1 Ordre14/11. Les25 contrôles comprennent les sélecteurs insérés dans les modales de choix. Les libellés internes « MVP : Séances uniquement » de certains nœuds sont historiques : ils ne redéfinissent pas les fonctionnalités.

Titres relevés sur Prototype MVP :40 Créer un exercice,19 Composer une séance,1 Modifier une séance ; sur Communautaire :23,17 et1 respectivement. Le volume64 annoncé dans la source inclut l’en-tête DSF ; il n’est pas le nombre de captures MVP. Les pages responsive et archives n’ont pas fait l’objet d’une nouvelle certification dans ce lot.

L’occurrence « Parcours » qui subsiste dans la Composition5271:5455 est extérieure aux sélecteurs de catalogue et ne modifie pas la règle Circuit/Tour. Elle est conservée comme écart de texte Figma, sans nouvelle décision métier.

## Captures des nouvelles variantes

![Deux options — Exercices sélectionné](Specifications-fonctionnelles/images/dsf-segmente-7388-13779.png)

![Deux options — Séances sélectionné](Specifications-fonctionnelles/images/dsf-segmente-7388-13786.png)

## Raccordement Formats du 14/10/2026

Le [DSF Formats](DSF-FORMATS-SEANCES-2026-10-14.md) complète ce document : organisation Par exercice/En alternance, compte nommé selon son unité, constantes Tabata grisées mais effectives et phrases contextuelles. L’état imposé effectif conserve une valeur réelle ; ne pas lui appliquer le tiret des valeurs sans effet. Les cartes de modèles illustrées ne changent pas la règle des cartes catalogue. Les points de layout non qualifiés restent signalés dans la [revue transverse](REVUE-COHERENCE-FORMATS-2026-10-14.md).
