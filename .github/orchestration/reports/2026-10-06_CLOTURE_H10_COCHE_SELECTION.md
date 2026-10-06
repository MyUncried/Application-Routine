# KODJO — clôture H-10 : source actuelle de la coche de sélection

Mission : `CLOTURE_H10_COCHE_SELECTION`. Objectif autorisé : retrouver la représentation actuelle dans Figma, vérifier l’asset GitHub, déposer l’asset manquant et corriger la traçabilité documentaire.

Branche `docs/cadence-dsf-2026-10-06`, départ local et distant `c3731726da86d446dff1973240bb6a327d5b44b6`, PR #323 ouverte en brouillon vers main. Checkout propre avant écriture ; aucun run GitHub Actions sur la branche au contrôle préalable. Sessions externes non observables.

## Résultat vérifié directement dans Figma

L’ancien composant autonome `Icon / Selection Check` `3847:5512` est absent. La coche reste présente dans l’écran `3789:5349` (Composition séance — Sélection exercices), dans les instances sélectionnées `6221:3519` (Squat assisté) et `6221:3586` (Extension du genou).

Source courante : `DSF / Cards / Exercice`, set `6214:7278`, variante `Contexte=Choix composition, État=Sélectionné` `6214:4425`. La case `6214:4423` mesure20 ×20, rayon6, fond `#0508E5` lié à `color/blue/primary-0508E5` (`VariableID:2290:2`), sans contour. La coche `6214:4424` est un texte « ✓ », Inter14 Semi Bold, blanc lié à `color/neutral/white-FFFFFF` (`VariableID:2290:5`), dans un calque20 ×20. Sa position verticale est1px au-dessus de la case ; son tracé visible est décalé d’environ5,236px horizontalement et5,598px verticalement dans la case.

L’ancienne prescription de pictogramme autonome24 ×24 avec fond `#5F60EE` et liseré blanc ne décrit plus cet usage. Le composant de fondations Case à cocher ne doit pas être assimilé par son seul nom à cette représentation : son état sélectionné lu est un cercle avec point.

## Asset et contrôles

`assets/icons/state-selected.svg` existe dans GitHub et localement, mais le manifeste le rattache au sélecteur de couleur `2537:1509`, et son tracé24 ×24 diffère du dessin actuel. Il est conservé intact.

Le dessin courant a été exporté directement du nœud `6214:4424` via `exportAsync`, format SVG, `svgOutlineText=true`. Résultat conservé octet pour octet dans [selection-check.svg](../../../assets/icons/selection-check.svg). L’export mesure10 ×8 (`viewBox 0 0 10 8`), correspondant au tracé visible ; ce n’est pas un slot20 ×20. Le SVG contient un path blanc et aucun texte : il permet l’implémentation vectorielle sans dépendance à un glyphe de police. Le fond et le rayon appartiennent au contrôle hôte ; ne pas étirer ce tracé10 ×8 à20 ×20.

Contrôles : lecture du maître et des instances visibles ; absence de l’ancien nœud ; propriétés/variables lues ; validité XML du SVG, viewBox, absence de texte ; comparaison avec l’asset existant ; SHA-256 et SHA Git enregistrés dans la provenance des exports et [les preuves](2026-10-06_CLOTURE_H10_COCHE_SELECTION_PREUVES.json) ; liens locaux, ancres et revue du diff. Aucun test applicatif ou sur appareil applicable à ce dépôt d’asset source.

La représentation Figma reste un glyphe texte ; aucune mutation Figma n’est effectuée. Une éventuelle conversion du maître Figma en composant vectoriel serait un chantier distinct, et n’est pas nécessaire pour retrouver et exporter son tracé actuel. Aucun branchement de code ni modification du manifeste runtime. Aucun workflow, appel Claude ou parcours de qualification lancé.

## Fichiers et livraison

Nouveau `assets/icons/selection-check.svg` ; provenance `assets/icons/figma-current-exports.json` ; chapitre12 ; DSF-CADENCE ; INDEX ; README ; présent rapport et preuves JSON. Les captures, autres assets, sources archivées et rapports antérieurs restent intacts.

H-10 est clos pour la correction des références et l’identification/export de la coche actuelle. Ce contrôle ciblé ne certifie pas l’ensemble des identifiants Figma ni l’alignement fonctionnel total. Les autres réserves et la couverture partielle de lecture restent suivies dans leurs rapports.

Commit final : commit introduisant ce rapport, SHA exact dans la PR #323 et le bilan utilisateur. Publication sur la branche documentaire existante avec vérification de tête attendue, PR conservée en brouillon ; pas de fusion main ni synchronisation du PC. Prochaine action pour le lot code : consommer le SVG et les dimensions du contrôle hôte selon chapitre12 ; aucun développement lancé dans cette mission.
