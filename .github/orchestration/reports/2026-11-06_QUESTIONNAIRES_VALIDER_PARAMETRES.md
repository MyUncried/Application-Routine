# Rapport de mission — QUESTIONNAIRES_VALIDER_PARAMETRES (6 novembre 2026)

- **Objectif :** rétablir le bouton « Valider les paramètres » sur les questionnaires de Format suivis d'une seconde étape, et vérifier l'alignement de Figma (demande de Hermann du 6/11/2026, D-511).
- **Branche :** `docs/pre9-catalogues-cartes-modales-20261106`.
- **Commit de départ :** `8bcb1d642567e71ddad130d99d81be14899eaf52`.
- **Périmètre :** Figma (questionnaires de Format) et documentation associée.
- **Règle appliquée :** la seconde étape (récapitulatif) existe :
  - dès le premier mouvement pour EMOM, AMRAP, For time et Progression ;
  - à partir du deuxième mouvement pour Tabata, 30/30, Death by, Renforcement et À l'échec ;
  - à deux mouvements pour Superset.

  Le bouton est en bas et la coche est masquée. Sans seconde étape, la coche enregistre directement.
- **Constats :**
  - les 11 questionnaires existants sont tous à zéro mouvement : aucun écran ne montrait le cas du bouton ;
  - « Death by — Récapitulatif » montrait un seul mouvement, ce qui contredit la règle.
- **Figma :**
  - écrans créés : `11753:21642` (EMOM, un mouvement), `11753:21837` (Tabata, un mouvement), `11753:21977` (Tabata, deux mouvements), `11753:22133` (Superset, deux mouvements) ;
  - `8624:30602` renommé « Death by — Questionnaire, un mouvement » : croix à la place de Retour, paramètres du questionnaire avec « Avec charge » ;
  - bouton : instance de « DSF / Actions / Bouton primaire », état Actif.
- **Documentation :**
  - spec du 6/11, nouveau §1 bis ;
  - ch07 : D-511 ;
  - ch13 et référence Formats : annotations ;
  - ch06 : annotations et galerie ;
  - INDEX.
- **Synchronisation code / documentation :** classe B (décision explicite).
- **Tests :** aucun applicable (documentation et Figma). Captures relues après modification.
- **Hypothèses non démontrées :** aucune.
- **Hors périmètre :** la coche des questionnaires à zéro mouvement est bleue dans Figma alors que la règle la veut grise. Signalé pour arbitrage, non modifié.
- **À vérifier sur appareil :** le passage dynamique coche ↔ bouton quand on ajoute ou retire un mouvement.
- **Fichiers modifiés :**
  - spec du 6/11 ;
  - ch06, ch07, ch13 ;
  - `KODJO-Formats-entrainement-2026-11-02.md` ;
  - INDEX ;
  - 5 images ;
  - ce rapport.
- **Commit final et état Git :** donnés dans le compte rendu de livraison.
