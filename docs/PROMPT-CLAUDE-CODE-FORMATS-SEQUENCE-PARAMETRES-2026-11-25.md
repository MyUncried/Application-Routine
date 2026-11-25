# Claude Code — Formats : séquence d'ouverture et modale « Paramètres d'exécution » selon le contexte (25/11/2026)

Mission : appliquer D-568 et D-569 (registre, ch07 ; `docs/KODJO-Formats-entrainement-2026-11-02.md` §§ 9.6 et 9.7, branche `docs/planification-grille-creneaux`, à lire sans la fusionner). Figma : modales « … — Modale exercice » du 30/30, de l'EMOM, de l'AMRAP, du Death by, du For time et du Tabata ; « P-Tabata — Choix des mouvements ».

1. Séquence : à la première ouverture du Tabata, du 30/30, du Renforcement, de la Progression, de l'À l'échec et du Superset, afficher en premier l'écran de choix des mouvements (mode catalogue du format) ; le questionnaire reste accessible depuis cet écran. Le lien du haut s'intitule « Paramètres ». Aucun nouvel écran : seul l'état initial change.
2. Modale « Paramètres d'exécution » d'un exercice déjà dans la séance (ouverte depuis le questionnaire ou la Composition ; même modale) : n'afficher que les champs utiles dans le contexte de l'exercice (§ 9.7 des Formats) :
   - Tabata, 30/30, Renforcement, Progression, À l'échec, Superset : Charge et De chaque côté ;
   - EMOM : Mode, Condition d'arrêt, Nombre de répétitions, Intervalle (absent dans chaque intervalle), Charge, De chaque côté ;
   - AMRAP : Mode, Condition d'arrêt, Rôle (en circuit), Nombre de répétitions, Incrément par tour, Charge, De chaque côté ;
   - Death by : Mode, Condition d'arrêt, Nombre de répétitions, Incrément par intervalle, Intervalle (absent dans chaque intervalle), Charge, De chaque côté ;
   - For time : Mode, Condition d'arrêt, Rôle (en circuit), Séries (tableau des répétitions et pauses ; en buy-in ou buy-out, Nombre de répétitions), Charge, De chaque côté.
   Ne pas afficher, dans ces formats : Phases du mouvement, Cadence, Durée de l'exercice (ou durée maximum), Récupération, Pause. Les valeurs correspondantes de l'exercice ne changent pas : elles viennent du questionnaire ou du circuit.
3. Sortie et entrée d'un format : un exercice déplacé hors du format prend les champs et les valeurs par défaut d'un exercice libre, sans rien reprendre du bloc d'origine ; un exercice libre qui entre dans un format présente les champs du format, ses autres valeurs étant conservées, masquées et inactives (elles réapparaissent à la sortie).
4. Hors périmètre : les exercices libres hors déplacement, le calcul des durées, l'exécution. La hauteur de la feuille s'adapte à son contenu.
5. Tests : première ouverture de chaque format à départ rapide sur le choix des mouvements ; accès au questionnaire par le lien « Paramètres » ; champs de la modale par format, depuis le questionnaire et depuis la Composition ; valeurs enregistrées inchangées ; sortie d'un exercice hors du format (champs et valeurs libres) puis retour (valeurs retrouvées) ; EMOM, AMRAP, Death by et For time inchangés en dehors de la modale.

Règles du projet : baseline gelée ; primitives natives de l'OS prioritaires (feuille native iOS conservée) ; Expo v57 ; aucune réécriture hors périmètre. PRESERVE / CHANGE / FORBIDDEN à établir avant de coder et à démontrer dans le rapport. La validation visuelle se fait sur iPhone : une suite verte ne la remplace pas.
