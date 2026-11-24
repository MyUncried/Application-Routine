# Mission Claude Code — Revue documentaire indépendante et ajustement Figma Journal / filtre Agenda

Dépôt : `MyUncried/Application-Routine`
Branche documentaire : `docs/agenda-seances-journal-filtre-20261121` (issue de `integration/bmad-planification-20261120` ; ne pas travailler depuis une ancienne `main`).
Référence fonctionnelle : `docs/KODJO-Agenda-seances-journal-filtre-2026-11-21.md`.
Figma : `G6RY5Ebhgwb4AHIOYDwwvg`, page « Prototype MVP » `510:101`.
Références connues à vérifier dans le Figma actuel : Journal `1992:5510` ; ancien filtre `12798:26906` (composant/ligne, pas forcément écran complet). Les IDs anciens d'Agenda peuvent être périmés : rechercher par nom.

## Mandat
1. Vérifier directement l'état actuel du dépôt, la branche, les décisions et les nœuds Figma. Ne pas supposer que les captures anciennes représentent le Figma actuel.
2. Faire une **revue indépendante** de la nouvelle spécification et des mises à jour documentaires : contradictions, décisions antérieures, nomenclature, scénarios, modèle de données, API, architecture, MVP, PRODUCT, INDEX si présent. Produire un relevé par axe : CONFORME / PARTIELLEMENT CONFORME / NON CONFORME / NON VÉRIFIABLE / À CLARIFIER avec preuves.
3. **Ne pas redessiner l'Agenda** : l'affichage des Séances, la ligne Ⓟ et le rail sont déjà réalisés et validés par Hermann dans Figma. Comparer pour contrôle uniquement. La capture du 21/11/2026 fournie par Hermann représente l'orientation validée ; consulter l'écran Figma courant.
4. **Modifier Figma uniquement pour le Journal et le filtre de l'Agenda** : carte compacte de Routine, une seule ligne pour un Parcours, symbole Ⓟ et nom, même principe dans la liste du filtre ; choix des Séances planifiées (Routine à une Séance) et des Parcours (Routine à plusieurs Séances), sélection multiple, noms de Routine doublons possibles. Reprendre les composants, tokens, espacements et interactions existants. Ne pas transformer une représentation purement graphique en règle métier.
5. Mettre à jour les documents dépendants si des contradictions avérées subsistent, par modifications minimales. Ne pas inventer de règle pour les points « À CLARIFIER ». Ne pas modifier le code applicatif.
6. Faire une seconde passe indépendante : vérifier les nœuds Figma modifiés (IDs, captures), les références Markdown, l'absence d'anciennes règles contradictoires, le diff et les fichiers non concernés.
7. Livrer un rapport avec fichiers/nœuds réellement modifiés, décisions supersédées, résultats de recherche des anciennes règles, contradictions résiduelles, tests/contrôles effectués. Publier une PR depuis la branche documentaire, **sans fusionner**.

## Garde-fous
- Préserver strictement tous les noms de chemins Unicode, accents, apostrophes et tirets ; aucun `#Uxxxx`, `\\uXXXX` ou renommage automatique.
- Aucun ZIP, déplacement, suppression ou création hors périmètre.
- Figma est la source du rendu, documentation fonctionnelle celle des comportements, documentation technique celle de l'implémentation, registre celle des arbitrages.
- Une absence de preuve n'est pas une conformité ; aucune déclaration « terminé » sans vérification.
- Signaler explicitement toute incompatibilité avec les comportements D-536 à D-540 et l'enchaînement D-534.
