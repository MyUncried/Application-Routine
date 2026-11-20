# Claude Code — suppression d'une occurrence et d'une routine (20/11/2026)

Mission : appliquer D-537 (registre, ch07 ; ch03 et ch13 annotés ; `docs/DSF-AGENDA-PLANNING-2026-11-19.md` § 8 ; `docs/DSF-JOURNAL-2026-11-19.md` § 6), branche `docs/planification-grille-creneaux`, à lire sans la fusionner. S'appuie sur le figement des occurrences commencées (D-536). Aucune règle nouvelle ; tout point non couvert → signale-le.

## Agenda
1. On supprime uniquement l'occurrence choisie. Le choix « Toutes les occurrences à venir » disparaît.
2. Dialogue « Supprimer cette occurrence » : titre seul, bouton « Confirmer » pleine largeur, bouton « Annuler » en haut à gauche ; pas de message, pas de gros bouton Annuler en bas. Écrans Figma : « P-Modal — Supprimer des occurrences — Calendrier » et « P-Modal — Supprimer une planification unique — Calendrier » (identiques ; un seul dialogue dans le code).
3. Une occurrence commencée (une séance lancée) ne peut pas être supprimée.
4. Supprimer la dernière occurrence à venir laisse la routine dans le Journal, en gris.

## Journal
1. Routine sans occurrence commencée : suppression de la routine et de toutes ses occurrences. Message : « La routine et ses N créneaux seront supprimés. »
2. Routine avec au moins une occurrence commencée : suppression de ses occurrences non commencées, archivage de la routine ; les occurrences commencées restent dans l'historique, l'Agenda passé et les graphiques. Message : « N créneaux non commencés seront supprimés ; La routine sera archivée. »
3. Un seul dialogue, au titre « Supprimer cette routine », dont le message dépend de la présence d'historique ; boutons « Confirmer » et « Annuler » (en haut à gauche). Écrans Figma : « P-Modal — Supprimer une routine — Journal » et « P-Modal — Supprimer et archiver une routine — Journal ».
4. La routine archivée apparaît avec le filtre « Archivées » existant du Journal. Vérifie si elle peut être restaurée et signale-le ; ne l'invente pas.

Dialogue : reprends le composant `DSF / Overlays / Confirmation` (variantes « Titre seul » et « Titre et message ») ; pas de nouvelle primitive.

Règles du projet : baseline gelée ; primitives natives de l'OS prioritaires.
- PRESERVE : moteur d'exécution, historique des exécutions, formulaire de planification, filtres du Journal, tests existants.
- CHANGE : dialogues et logique de suppression d'occurrence et de routine.
- FORBIDDEN : réécriture massive des tests, modification du modèle sans validation, suppression d'une occurrence commencée. Hors périmètre → `SCOPE_EXPANSION_REQUIRED`.

Tests : suppression d'une occurrence à venir (seule elle disparaît) ; refus pour une occurrence commencée ; dernière occurrence supprimée (routine grise dans le Journal) ; routine jamais lancée supprimée avec ses occurrences ; routine avec historique archivée, occurrences non commencées supprimées, occurrences exécutées conservées ; nombres N corrects dans les messages ; routine visible avec le filtre « Archivées ». Une suite verte ne remplace pas la recette sur iPhone.

Cahier de recette : ajoute le cas D du cahier (règle et 7 cas de suppression, voir D-537) sans toucher aux autres sections.

Livraison : classe de synchronisation A, rapport de mission dans `.github/orchestration/reports/` avec PRESERVE / CHANGE / FORBIDDEN démontrés, commit, état Git.
