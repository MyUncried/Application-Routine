# Rapport de mission — BADGE_NOUVEAU_INTEGRATION (6 novembre 2026)

- **Objectif :** intégrer la spec du badge « NOUVEAU » (D-510) dans Figma, le registre et le contrat d'écran du catalogue des mouvements (demande de Hermann, 15:52).
- **Branche :** `docs/pre9-formats-questionnaires-figma-20261106`.
- **Commit de départ :** `fef41be6e6b51af993c5cfb5ef42a2bc623e3fe3`.
- **Figma :**
  - **Composant « Carte — Mouvement » :** propriété de variante « Nouveau » (Non / Oui) et variante `11762:2205`. Le badge est un cadre auto-layout, ancré en bas à droite, fond `color/primary`, texte blanc Inter Medium 12. La description est raccourcie à 8 px du badge.
  - **Écran :** « Mouvement — Catalogue — Fiche créée » `11762:23747`, avec la fiche « Fentes avant » et la pile « Squats sautés ».
- **Constat :** une propriété booléenne ne permet pas de raccourcir la description. D'où le choix d'une variante : le passage de variante conserve le texte propre à chaque instance.
- **Documentation :**
  - statut de la spec : intégrée, avec les identifiants Figma ;
  - registre (ch07) : D-510 ;
  - contrat d'écran : complément CE-MVT-03 ;
  - galerie du ch06 et INDEX.
- **Synchronisation code / documentation :** classe B (décision explicite).
- **Tests :** aucun applicable. Capture relue.
- **À vérifier sur appareil :**
  - lisibilité du badge et de la description raccourcie ;
  - annonce VoiceOver ;
  - défilement vers la fiche créée.
- **Fichiers modifiés :**
  - spec du badge ;
  - ch06, ch07, ch13 ;
  - INDEX ;
  - 1 image ;
  - ce rapport.
- **Commit final et état Git :** donnés dans le compte rendu de livraison.

## Révision du rendu (demande de Hermann, 16:13)

- **Libellé :** « New » en Inter Bold 12, seule la première lettre en majuscule.
- **Couleur :** vert `color/status/positive-text`. Le bleu signale ce qui se touche et le rouge la suppression ; le badge n'est pas interactif.
- **Position :** badge accolé au coin bas droit, rayon 12 sur les quatre coins, 24 px de haut.
- **Pile :** nouvelle variante « Nouveau=Dans la pile » `11765:2101` avec « New ↓ ». La flèche a été préférée au bord coloré de la deuxième feuille : un repère porté par la seule couleur est peu visible et non accessible.
- **Mises à jour :** spec, D-510, CE-MVT-03, INDEX et capture.
