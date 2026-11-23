# Claude Code — rattacher un programme à la planification (23/11/2026)

Mission : appliquer D-545 (registre, ch07 ; `docs/DSF-PROGRAMMES-2026-11-23.md` § 3), branche `docs/planification-grille-creneaux`, à lire sans la fusionner. Écrans Figma : « P-Planifier une séance — Création » (ligne Programme) et « P-Planifier une séance — Choix du programme (proposition) ».

1. La ligne « Programme » ouvre la modale « Rattacher un programme » à la place du menu iOS.
2. Feuille modale iOS native, sur le modèle de la modale « Sélectionner une séance » de la planification : ✕ Annuler en haut à gauche avec son halo (la bande de contexte passe sous le halo), titre centré « Rattacher un programme », **pas de bouton Valider**.
3. Contenu : champ Rechercher, filtre et tri, libellé « Actifs N · Terminés M », puis les cartes du catalogue des programmes (nom, période · état, nombre de planifications et de séances), avec leur composant existant.
4. Sélection unique : bouton radio (`DSF / Controls / Radio`) à droite de chaque carte. Toucher une carte non sélectionnée la sélectionne et ferme la modale. Toucher la carte sélectionnée retire le rattachement (« Aucun », D-332) et ferme la modale. À l'ouverture, le programme actuel est sélectionné.
5. Le Programme reste facultatif ; sa période borne les dates (D-332).
6. Tests : la modale est utilisée à la place du menu ; sélection, désélection, fermeture ; aucun bouton Valider.

Règles du projet : baseline gelée ; primitives natives de l'OS prioritaires ; Expo v57 ; aucune réécriture hors périmètre. PRESERVE / CHANGE / FORBIDDEN à établir avant de coder et à démontrer dans le rapport de mission. Si l'objet Programme (modèle, stockage, catalogue) n'existe pas encore dans le code, ne l'invente pas : dis-le en tête du rapport, applique seulement ce qui s'appuie sur du code existant et signale le reste « préparé, non appliqué ».
