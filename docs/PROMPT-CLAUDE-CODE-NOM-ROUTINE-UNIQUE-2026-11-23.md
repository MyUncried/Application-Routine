# Claude Code — nom des routines unique parmi les routines actives (23/11/2026)

Mission : appliquer D-563 (registre, ch07 ; `docs/DSF-JOURNAL-2026-11-19.md` § 6 bis), branche `docs/planification-grille-creneaux`, à lire sans la fusionner. D-563 remplace le « non unique » de D-553 (branche `docs/agenda-seances-journal-filtre-20261121`, non fusionnée : lis-la en lecture seule pour le contexte) et rétablit RM-258 / RM-261 / D-522 pour les routines actives.

1. Unicité : le nom d'une routine est unique parmi les routines **actives**, sans distinguer majuscules, minuscules, accents ni espaces de bord (réutilise la normalisation existante de RM-261). Une routine **terminée** garde son nom et n'entre pas dans le contrôle. L'unicité des noms de séances ne change pas.
2. Création : le champ Nom est prérempli avec le nom par défaut (celui de la séance, ou les noms reliés par « + »). S'il est déjà pris par une routine active, propose le premier nom libre : « Tabata (2) », puis « Tabata (3) ». L'utilisateur peut modifier le champ.
3. Nom saisi déjà pris : message « Ce nom est déjà utilisé » sous le champ ; rien n'est enregistré. Nom vide : « Nom obligatoire » (inchangé).
4. Réactivation : une modification qui rend active une routine terminée (période étendue, créneaux ajoutés) vérifie le nom. S'il est pris par une routine active, l'écran reste ouvert, le champ Nom reçoit le premier nom libre et le message apparaît ; rien n'est enregistré tant que le nom n'est pas libre.
5. Le nom par défaut non personnalisé continue de suivre la composition (D-553 § 2) ; le contrôle d'unicité s'applique au nom effectivement enregistré. Ne déduis pas « nom généré » d'une égalité textuelle (point déjà noté dans le document Agenda).
6. Données existantes : si la base contient déjà des routines actives de même nom, ne les renomme pas automatiquement ; le contrôle joue à leur prochaine modification. Signale-le dans le rapport.
7. Tests : unicité normalisée parmi les actives, terminée exclue, suffixe (2), (3), réactivation, nom vide, séances inchangées.

Règles du projet : baseline gelée ; primitives natives de l'OS prioritaires ; Expo v57 ; aucune réécriture hors périmètre. PRESERVE / CHANGE / FORBIDDEN à établir avant de coder et à démontrer dans le rapport de mission. Si le modèle Routine n'existe pas encore tel que décrit dans le code, ne l'invente pas : dis-le en tête du rapport et signale le reste « préparé, non appliqué ».
