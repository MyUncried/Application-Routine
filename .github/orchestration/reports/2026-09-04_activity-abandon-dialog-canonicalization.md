# Canonicalisation — abandon des modifications d’une Activité

Date : 2026-09-04  
Périmètre : Figma, DSF et documentation. Aucun code applicatif modifié.

## Diagnostic initial

La modale n’était pas totalement absente : le chapitre 06 décrivait son comportement et la décision `D-094` fixait ses anciens textes. Les contrats CE-T01-13 et CE-T01-15 la mentionnaient également.

En revanche, elle ne possédait ni frame dans `Prototype MVP`, ni capture documentaire, ni contrat autonome, ni correspondance déterministe vers une variante DSF. L’implémentation avait donc été construite à partir de `D-094` et du composant générique de dialogue, sans référence visuelle de production propre à l’Activité.

## Référence créée

- frame : `3224:4082` — `Modal — Abandonner les modifications d’une activité` ;
- voile modal : `3224:4139` ;
- instance : `3224:4140` — `Overlay / Decision Dialog — Abandon activité` ;
- component set DSF : `Overlay / Decision Dialog` (`2590:2961`) ;
- variante : `PrimaryTone=Danger,SecondaryTone=Neutral,Actions=2` (`2590:2934`).

## Contenu canonique

- titre : `Abandonner les modifications ?` ;
- message : `Les modifications apportées à cette activité seront perdues.` ;
- action non destructive : `Annuler`, gris neutre ;
- action destructive : `Confirmer`, rouge avec texte blanc.

## Géométrie et comportement

- dialogue centré : `354 × 186`, rayon `18` ;
- boutons : `147 × 48`, écart `12` ;
- espacement dernière ligne du message vers actions : `spacing/16` ;
- titres et libellés de boutons centrés ; message aligné à gauche ;
- Annuler et Retour système conservent le brouillon local ;
- Confirmer détruit uniquement les modifications locales de l’Activité ;
- toucher le voile ne confirme jamais l’action destructive.

## Documentation

- chapitre 06 : capture, node, variante, textes, géométrie et comportement ;
- chapitre 07 : décision `D-094` révisée ;
- chapitre 12 : correspondance DSF et frame de production ;
- chapitre 13 : contrat autonome `CE-T01-16` et matrice T01 portée à seize frames ;
- image : `Specifications-fonctionnelles/images/activite-abandon-modifications.png`.

## Point applicatif identifié, non modifié

Le code actuel utilise encore les anciens libellés `Continuer la modification` et `Abandonner` dans `ExerciseExitConfirmModal.tsx` et `fr.ts`. Il devra être aligné séparément sur `Annuler` et `Confirmer` après autorisation de développement.

Statut : `ACTIVITY_ABANDON_DIALOG_DESIGN_READY_FOR_IMPLEMENTATION_REVIEW`.
