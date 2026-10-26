# Epic B Context: Finalisation de l'éditeur d'Exercice

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Terminer la présentation de l'éditeur d'Exercice et de sa Feuille des paramètres d'exécution (points B1 à B10 demandés par Hermann) : harmoniser les hauteurs, alignements et marges, corriger les libellés et l'affichage des valeurs, remplacer le menu natif du Changement de côté par le déroulant dessiné dans Figma, et stabiliser la barre au-dessus du clavier. Le travail porte uniquement sur l'interface. Le modèle de données, les calculs, les API et les identifiants techniques ne changent pas. Cet epic passe avant l'Epic A2, qui modifie le même fichier (`ExecutionParametersSheet.tsx`) pour les états MFN : terminer l'harmonisation d'abord évite de la refaire. Sources qui font autorité : la décision D-447 (chapitre 07) et le contrat d'écran CE-UI-10 (chapitre 13, §8 à §20, en particulier les révisions du 24/10 aux §9 et §10). Le dossier de planification ne contient que `epics.md` : il n'existe ni PRD, ni architecture, ni document UX propres à PRE-7.

## Stories

- Story B.1 : Harmonisation visuelle de la Feuille des paramètres (B3, B4, B6, B7)
- Story B.2 : Libellés, valeurs et Description (B1, B2, B8, B10)
- Story B.3 : Changement de côté et barre du clavier (B5, B9)

## Requirements & Constraints

- Hauteur commune de 32 pour les boutons et champs éditables de la Feuille : segmentés, pastilles de valeur, steppers ouverts ou fermés, champ de charge (une légère augmentation est admise). Rayons, alignements et espacements sont harmonisés. Les champs de saisie se distinguent des options par leur fond (`colors.surface`). **Aucun jeton modifié** : `tokens.ts` est verrouillé par un test.
- Segmenté Séries : la marge intérieure horizontale des boutons actifs passe de 8 à 12, sans débordement à 360, 402 et 440.
- Pause après chaque série, Pause entre les côtés, Compte à rebours et Fin d'exercice sont alignés à droite comme Durée de l'exercice, fermés comme ouverts. L'alignement à droite du stepper ouvert maintient la règle « la valeur ne bouge pas à l'ouverture ».
- Le chevron de Durée de l'exercice perd son cadre (variante sans cadre du contrôle Disclosure). Il garde sa cible de 48, sa position à 12 px du libellé, son accessibilité et son interaction. Les autres usages du contrôle restent inchangés.
- Description : l'invite « Étape suivante » n'apparaît que lorsque le champ est actif. Au repos, elle est masquée sans supprimer d'étape. L'invite de première étape reste quand la liste est vide. Aucun clignotement entre deux étapes. Les mécanismes des étapes (D-425) restent inchangés.
- Condition d'arrêt : « À l'objectif » et « À l'objectif et à l'échec » remplacent « À la cible… » dans tous les états, cas mixte et valeur imposée grisée compris. « À l'échec » ne change pas. Les identifiants `TARGET` et `MIXED` sont inchangés. Vérifier que le libellé tient dans la largeur de l'option.
- Cadence : une valeur personnalisée s'affiche à la place de « Autre » (par exemple « 3 s »). Un nouvel appui rouvre le stepper. La valeur est conservée à la fermeture et à la réouverture selon le brouillon existant. Choix rapides, bornes (0 à 10, pas de 1 s) et passage à « 1 s » ou « Sans » restent comme aujourd'hui.
- Charge en séries variables : la colonne reste toujours présente (en-tête, largeur 71). En Sans, chaque cellule montre un tiret gris non éditable, ignoré par Précédent et Suivant. En Avec, les champs apparaissent dans la même colonne, sans suppression ni recréation. Les valeurs conservées sous Sans continuent d'être enregistrées.
- Changement de côté : depuis l'option Avec sélectionnée, le choix se fait par un déroulant conforme à Figma `9462:18986` / `9462:18987` : 144 × 88, deux rangées de 44, ancré sur l'option, avec chevron, rôle menu et fermeture accessibles. Les notations et comportements de D-431 (RC-12, RC-13) restent inchangés, et la désignation Droite / Gauche n'est pas réintroduite. La valeur sélectionnée doit tenir entièrement dans l'option, y compris après fermeture et réouverture de la Feuille. La cause du défaut actuel (le dimensionnement de l'hôte du menu natif) doit être identifiée et disparaître avec le menu natif.
- Barre du clavier : une seule ligne de quatre emplacements stables, de largeur et de hauteur égales. De gauche à droite : « À l'échec » s'il est applicable (sinon un emplacement réservé vide), Précédent, Suivant, Fermer. Précédent et Suivant restent fixes au centre. Les boutons sont arrondis, sur le fond des touches. Fermer est bleu KODJO avec un texte blanc. Le fond de la barre est proche de celui du clavier. Focus et navigation (D-434) restent inchangés.
- Abandonnés : la fusion avec la forme du clavier, le recouvrement de ses coins, l'imitation du matériau vitré d'iOS 26 et tout clavier personnalisé.
- Une suite verte ne prouve rien sur appareil : recette iPhone **JB** après B.3 (360 / 402 / 440, iOS 26), validée par Hermann.

## Technical Decisions

- Clavier natif `number-pad` / `decimal-pad` conservé. La barre est rendue par la Feuille au-dessus du clavier, parce qu'`InputAccessoryView` ne s'affiche pas dans la `Modal` de la Feuille (mécanisme validé en RC-1 de PRE-5).
- Le déroulant du Changement de côté est construit sur `AnchoredPanel.tsx` et remplace le menu natif iOS accepté en RC-6. Ce remplacement est explicitement décidé par D-447 : ce n'est pas une substitution de primitive à l'initiative du développeur.
- Déjà conformes, à ne pas redévelopper : la réouverture du stepper Cadence par un nouvel appui sur Autre ; la conservation des valeurs de charge en Sans ; l'ordre de la barre du clavier (« À l'échec » seulement pour une Cible) ; le clavier natif.
- Textes : la source des libellés de la Condition d'arrêt est `src/shared/i18n/index.ts:57`.
- Tests : mettre à jour la géométrie existante de `ExecutionParametersSheet.test.tsx` et de `rc15`, sans nouveau dispositif. Ne pas affaiblir les garde-fous « zéro `ScrollView` sur iOS » des sélecteurs à roulette.
- Contrôles de fin : `npm test`, `npx tsc --noEmit`, `npm run lint`.

## UX & Interaction Patterns

- Feuille en quatre cadres, titres à gauche et contrôles à droite. Pas de coordonnées absolues : la mise en page doit fonctionner à 360, 402 et 440, avec le texte agrandi et les Safe Areas.
- La cellule active reste visible au-dessus du clavier. Le tableau n'a pas de défilement propre.
- Figma ne donne que le rendu. Une valeur lue dans une capture n'est pas une règle, et aucun composant absent de Figma ne doit être inventé.

## Cross-Story Dependencies

- B.1, puis B.2, puis B.3, dans cet ordre : les trois stories modifient `ExecutionParametersSheet.tsx`.
- Prérequis : la story 0.1 (D-447 et la propagation des libellés dans la documentation), terminée.
- B.3 précède A2.1 (Feuille des paramètres MFN, même fichier). A1.1 (domaine pur) peut avancer en parallèle.
