# Recette iPhone du 27/11/2026 (matin) — paquet COMPO3

## Objectif

Écarts relevés par Hermann sur la Composition (séance ouverte depuis sa carte, modale plein écran du lot 23), citations exactes :

1. « Quand la composition monte du bas, le bouton Créer de la composition apparaît en haut à gauche de l'écran, puis disparait pour réapparaître à la place ou était le bouton de Créer une séance. » Note a) : « Composition de séance, ouverture des paramètres d'exécution d'un exercice libre : le bouton "Créer" apparaît en haut à gauche de l'écran. Je ferme la modale, le bouton y reste et je ne peux pas le bouger, il est inactif. »
2. « Quand on relâche une carte déplacée (dans un circuit, vers / hors d'un cycle ou d'un circuit, il y a un petit saut (disparition, apparition) de la carte, c'est très récurrent mais pas a priori systématique. »
3. « Créer un circuit : le premier déplacement du bord du circuit se fait en dessous des cartes qu'il survole. Après relâchement puis et déplacement de nouveau du bord, le circuit est bien au dessus des cartes. »
4. « Lorsqu'on relâche le bord du circuit, il se déplace à sa position initiale et revient à la position finale. Pareil pour le cycle. »
5. « Créer un cycle sur deux circuits : après validation du cycle, son format est cassé. Faire dérouler l'écran le remet normalement. Problème constaté une fois, non reproduit sur les mêmes objets. »

Acquis à préserver (Hermann) : « Je peux déplacer des exercices dans la composition, faire sortir / entrer des exercices dans un circuit > OK. »

## Branche et commit de départ

- Worktree `C:\Dev\KODJO-R28-COMPO3`, branche `fix/recette-28-compo3`, créée depuis `900502584` (recette `recette/agenda-axe-20261124`, lot 23).

## Périmètre

- Demandé : points 1 à 5.
- Traité : 1, 3, 4 corrigés (cause trouvée dans le code) ; 2 et 5 analysés, sans modification de code (cause non démontrée).

## Diagnostic historique (CLAUDE.md)

- Point 1 : bouton flottant introduit par `1352d1a36` (UI-FAB-01), physique `9a1bcc2eb` (D-594) : depuis ce commit les valeurs animées `x`/`y` partent de 0 et la place de repos est posée dans un effet. Défaut introduit par `9a1bcc2eb`, détecté le 27/11 : la présentation `fullScreenModal` du lot 23 (FEUILLE, `compositionRoutePresentation.ts`) rend visible l'image où le bouton est encore en (0, 0) (montée du bas, contenu affiché dès la première image). Attribution : **plausible** (mécanisme démontré dans le code, image non observée par moi). Dernière preuve comparable : aucune conservée.
- Point 3 : élévation `envelopeFrameRaised` (B.4b) ; enveloppe de mouvement des cartes `CardMotionBlock` (B.5) — l'enveloppe est une vue native propre (`Reanimated.View`, `collapsable: false` imposé par Reanimated, `css/component/AnimatedComponent.tsx` l. 219-221). Défaut introduit par B.5 pour la disposition générale ; l'ancien modèle (Séance sans structure, `ActivityZoneList`) rend le cadre directement dans la liste : l'élévation y est effective. Attribution : **démontrée en code** pour la disposition générale ; la différence « premier glisser / glisser suivant » n'est pas expliquée (voir À CLARIFIER).
- Point 4 : `EnvelopeHandle.finish` remettait la translation à 0 avant `onDragEnd` depuis B.4b ; la contre-recette n° 4 du 01/11 (bord du cadre qui suit le trait, `EnvelopeMovingSegment`) a étendu ce retour au bord du cadre entier. Attribution : **démontrée en code** (séquence ci-dessous).
- Point 2 : mécanisme du registre des translations (stories 7.4, 7.6, cr5-reposer du 01/11). Attribution : **indéterminée** (voir constats).

## Constats et causes

### Point 1 — bouton « Créer » en haut à gauche

- `FloatingCreateButton` : `x = useSharedValue(0)`, `y = useSharedValue(0)` ; la place de repos (`rest`, connue dès le premier rendu grâce aux dimensions de la fenêtre) n'était écrite dans `x`/`y` que par un `useEffect`, donc après l'affichage. Premier rendu : `translateX: 0, translateY: 0` → bouton en haut à gauche, puis déplacé à sa place (côté et hauteur enregistrés, communs à tous les écrans : d'où « à la place où était le bouton de Créer une séance »).
- De plus, Reanimated transmet à React, à **chaque** rendu, le style initial figé au premier rendu (`createAnimatedComponent/PropsFilter.tsx` l. 44-51, `_initialPropsMap`) : l'arbre de React gardait donc `translate(0, 0)` pour toujours. Toute réapplication des propriétés de React à la vue native remettait le bouton en haut à gauche.
- Note a (paramètres d'exécution) : le bouton reste en (0, 0) après fermeture de la modale. Hypothèse, **non démontrée** : l'ouverture de la `Modal` au-dessus de la modale plein écran provoque une réapplication des propriétés de React (style initial (0, 0)) à la vue du bouton, sans nouvelle écriture de Reanimated. Avec la correction, ce style initial est la place de repos du montage : même dans ce cas, le bouton reste à sa place. Le caractère « inactif » n'est pas expliqué (À CLARIFIER).
- Correction : `x`/`y` partent de `rest` connu au montage.

### Point 3 — bord du circuit sous les cartes

- `LayoutDirectExercise` : `CardMotionBlock` (vue native) → vue intérieure → `EnvelopeFrame` (élévation `zIndex: 1` quand il porte le trait bas). Le `zIndex` n'ordonne que les frères d'un même parent : l'élévation du cadre restait enfermée dans l'enveloppe de sa carte, et les cartes suivantes de la liste (rendues après) passaient au-dessus du bord qui descend.
- Correction : l'enveloppe de la carte qui porte le trait bas d'un périmètre ajustable reçoit la même élévation (`envelopeFrameRaised`), en mode enveloppe seulement.

### Point 4 — retour du bord au relâchement

- Séquence (code) : `finish` → `translation.setValue(0)` (le trait et `EnvelopeMovingSegment` reviennent aussitôt à la position de départ : valeur animée JS appliquée immédiatement) → `onDragEnd` → `setEdgeDrag(null)` + `onReplace` (nouveau périmètre) → rendu suivant : périmètre calé. Entre les deux : image du bord à sa position initiale, puis à la position finale. Identique pour le cycle (même trait).
- Correction : la remise à 0 attend le rendu qui suit le relâchement (`useLayoutEffect`, drapeau `resetAfterRenderRef`) ; un nouveau glisser part de 0 même si ce rendu n'a pas eu lieu. Quand le trait change d'unité (extension / réduction), l'ancien trait est démonté par ce rendu et le nouveau naît à 0.

### Point 2 — petit saut d'une carte relâchée (non corrigé)

- Lecture du code : au dépôt appliqué, `layoutSettleFor` pose la translation native de la carte sous le doigt (`pose`), puis `applied` → `prepareLayoutCommit` ne pose que la valeur JS de la nouvelle translation (`setJsValue`, clé marquée `nativeStale`) ; le pilote natif ne la reçoit qu'à l'`apply` de l'effet de mise en page qui suit le rendu de la nouvelle disposition. Or le commentaire même du registre (`resyncNative`) rappelle que, sous Fabric iOS, les commits n'appliquent plus la translation d'une vue gérée par le pilote natif. Si la nouvelle mise en page est montée avant l'exécution de cette opération native, la carte est affichée une image à « nouvelle place + ancienne translation » : saut, dépendant du minutage (« pas systématique »).
- Cette lecture est une **hypothèse** : l'ordre réel entre le montage Fabric et les opérations du pilote natif n'est pas démontré, et ce mécanisme a déjà fait l'objet de plusieurs correctifs (7.4, 7.6, cr5-reposer). Toute modification ici toucherait le glisser-déposer validé par Hermann ce matin. Lecture prudente : aucune modification.

### Point 5 — format du cycle cassé après validation (non corrigé)

- Lecture du code : « Confirmer » écrit le brouillon (`draftAfterEnvelope`) et lance l'apparition progressive du nouveau Cycle (`cycleReveal`) ; un défilement provoque un nouveau rendu et de nouvelles mesures. Hypothèse compatible : mesure de mise en page ou translation périmée recalculée par Fabric au changement de taille (même famille que `resyncNative`, story 7.5). Une seule occurrence, non reproduite : **cause non trouvée**, aucune modification.

## PRESERVE / CHANGE / FORBIDDEN

- PRESERVE : glisser-déposer des cartes, entrée / sortie d'un Circuit, registre des translations (`useAnimatedShift.ts` non modifié) ; physique du bouton flottant (ressorts, rangement, position enregistrée, couleurs, fondu) ; règles de calage du bord (`edgeIndexAt`, `adjustEnvelopeSpan`) ; `EnvelopeMovingSegment` ; ancien modèle (`ActivityZoneList`) ; présentation `fullScreenModal` du lot 23 ; modale « Paramètres d'exécution » (non modifiée).
- CHANGE : valeurs initiales de `x`/`y` du bouton flottant ; moment de la remise à 0 de la translation du trait ; élévation de l'enveloppe de la carte qui porte le trait bas (disposition générale, mode enveloppe).
- FORBIDDEN : remplacement de primitive, modification native, refonte du registre, changements hors des fichiers cités.
- Démonstration : `git diff --stat 900502584` limité à `FloatingCreateButton.tsx` (une déclaration), `EnvelopePerimeter.tsx` (`finish`, un effet, une ligne au début du glisser), `CompositionScreen.tsx` (`LayoutDirectExercise` seul), trois fichiers de test, le registre ch07 et ce rapport. Les suites existantes du bouton flottant, de B.4b et du lot 3 passent sans modification de leurs assertions.

## Modifications

- `src/shared/ui/FloatingCreateButton.tsx` : `useSharedValue(rest?.left ?? 0)` / `useSharedValue(rest?.top ?? 0)` (commentaire daté, formulation remplacée annotée).
- `src/features/sessions/EnvelopePerimeter.tsx` : `EnvelopeHandle` — remise à 0 différée au rendu suivant (`resetAfterRenderRef`, `useLayoutEffect`), remise à 0 de sécurité au début d'un nouveau glisser.
- `src/features/sessions/CompositionScreen.tsx` : `LayoutDirectExercise` — `envelopeFrameRaised` sur l'enveloppe de la carte qui porte le trait bas.
- Tests : `EnvelopeHandle.recette2711.test.tsx` (nouveau), `FloatingCreateButton.test.tsx` (premier rendu à la place de repos), `CompositionScreen.recette2lot3.test.tsx` (élévation de l'enveloppe en disposition générale).

## Tests et résultats

- `npx jest -w 1 --workerIdleMemoryLimit=800MB` `EnvelopeHandle.recette2711`, `CompositionScreen.recette2lot3`, `FloatingCreateButton`, `CompositionScreen.b4b`, `EnvelopePerimeter`, `CompositionScreen.envelopeFormat` : 6 suites, 47 tests, PASS.
- Les nouveaux tests échouent sur la base par construction (translation 0 vue par `onDragEnd` ; transformation (0, 0) au premier rendu ; pas de `zIndex` sur l'enveloppe).
- `npx tsc --noEmit` : PASS.
- `npx eslint` (fichiers modifiés) : 0 erreur ; `CompositionScreen.tsx` : 2 avertissements, identiques sur la base (vérifié par `git stash`).
- Passe complète non lancée (consigne du brief).
- Une suite Jest verte ne prouve ni l'image affichée pendant la présentation, ni l'ordre d'empilement natif, ni l'absence de saut sur iPhone.

## Classe documentaire et documents touchés

- Points 1, 3, 4 : retour au comportement attendu (classe A dans les faits), consigné comme demandé par le brief en complément daté de D-608 dans le registre ch07 (« [Recette iPhone du 27/11/2026 (matin) : …] », citations exactes, sans nouveau numéro).
- Points 2 et 5 : aucune règle modifiée ; mentionnés À CLARIFIER dans le même complément.
- `docs/KODJO-Formats-entrainement-2026-11-02.md` : non concerné.

## À CLARIFIER

1. Point 1, note a : « le bouton y reste et je ne peux pas le bouger, il est inactif » — la place est corrigée par construction ; l'inactivité n'est pas expliquée. Si un bouton inactif persiste ailleurs qu'à sa place sur iPhone, une instrumentation ciblée (identifiant de la vue native du bouton avant / après la `Modal`) sera nécessaire.
2. Point 2 : hypothèse « translation native périmée au montage de la nouvelle disposition ». Vérification proposée avant tout correctif : enregistrement vidéo au ralenti (240 i/s) d'un relâchement dans un Circuit, pour voir si la carte saute vers la nouvelle place décalée (hypothèse) ou disparaît (autre cause : remontage de la vue quand elle change de conteneur).
3. Point 3 : la correction vaut pour les cartes directes d'une disposition générale (Séance déjà structurée, séance rouverte). La différence « premier glisser dessous / suivant dessus » n'est pas expliquée par le code ; si elle persiste, préciser le cas (séance neuve ou rouverte, bord tiré vers le haut ou vers le bas).
4. Point 5 : cause non trouvée ; à reproduire avec une séance précise.
5. Aucune modification native.

## Vérifications iPhone restantes

1. Catalogue des séances → toucher une carte : pendant la montée de la Composition, le bouton « Créer » n'apparaît qu'à sa place (jamais en haut à gauche). Puis toucher la carte d'un exercice libre (modale « Paramètres d'exécution ») et la fermer : le bouton est toujours à sa place, déplaçable, et ouvre le menu.
2. Séance rouverte, Créer → Créer un circuit, désigner un exercice, tirer le trait bas vers le bas dès le premier glisser : le bord du cadre passe au-dessus des cartes suivantes.
3. Relâcher le trait bas (circuit puis cycle) : le bord reste sous le doigt et se cale, sans repasser par sa position de départ.
4. Relâcher une carte dans un Circuit, vers / hors d'un Cycle ou d'un Circuit : noter si le petit saut persiste (non corrigé, voir À CLARIFIER 2) ; le déplacement lui-même reste correct.
5. Créer un cycle sur deux circuits, Confirmer : noter si le format est cassé (non corrigé, À CLARIFIER 4).

## Fichiers modifiés

- `src/shared/ui/FloatingCreateButton.tsx`
- `src/features/sessions/EnvelopePerimeter.tsx`
- `src/features/sessions/CompositionScreen.tsx`
- `src/shared/ui/__tests__/FloatingCreateButton.test.tsx`
- `src/features/sessions/__tests__/CompositionScreen.recette2lot3.test.tsx`
- `src/features/sessions/__tests__/EnvelopeHandle.recette2711.test.tsx` (nouveau)
- `docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md`
- `.github/orchestration/reports/2026-11-27_RECETTE-28-COMPO3.md`

## Commit final et état Git

Voir le message final de la mission (hash du commit de livraison ; branche poussée sur `origin/fix/recette-28-compo3`).
