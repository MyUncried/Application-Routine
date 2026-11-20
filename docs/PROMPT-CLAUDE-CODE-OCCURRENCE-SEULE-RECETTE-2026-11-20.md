# Claude Code — modification d'une occurrence seule et cahier de recette (20/11/2026)

Mission en deux parties, à la suite du prompt `docs/PROMPT-CLAUDE-CODE-MODIFICATION-OCCURRENCES-2026-11-20.md` (figement et règle B, déjà demandés). Source : D-536 (registre, ch07), `docs/DSF-AGENDA-PLANNING-2026-11-19.md` § 8, `docs/DSF-JOURNAL-2026-11-19.md` § 5, branche `docs/planification-grille-creneaux` (à lire sans la fusionner). Aucune règle métier nouvelle : tout point non couvert → signale-le, ne tranche pas.

## Partie 1 — Modifier une occurrence seule (Agenda)

1. Depuis une occurrence de l'Agenda, on peut modifier : la date, l'heure, l'activation ou la désactivation des pastilles du créneau, l'ajout d'une séance à ce créneau uniquement, le rappel. Le nom reste celui de la routine.
2. Une séance ajoutée à la main peut être retirée de l'occurrence ; les séances de la routine ne se retirent pas, on les désactive. Une occurrence est « Complétée » quand toutes ses séances **actives** sont faites.
3. Dans l'Agenda, toute modification ne concerne que l'occurrence, jamais la routine entière : aucun choix ni fenêtre de choix. La routine entière se modifie uniquement depuis le Journal (règle du prompt précédent : occurrences non commencées seulement).
4. **Protection des modifications manuelles par groupe** : date et heure ; séances (pastilles, séance ajoutée) ; rappel. Un changement global ne remplace que les réglages non modifiés à la main sur l'occurrence. Une occurrence déplacée suit donc un futur changement de séquence, mais pas un futur changement de récurrence.
5. Une occurrence commencée (une séance lancée) n'est pas modifiable. Une occurrence passée non commencée (rouge) l'est : on peut la reprogrammer ; son bouton affiche « Rattraper ».
6. Pendant l'édition, seul le créneau de l'occurrence ouverte est coloré (en-tête et pastille) ; les autres créneaux sont grisés.
7. Le compteur « X à venir » du Journal continue de compter les occurrences modifiées à la main.

## Partie 2 — Cahier de recette

Repère le cahier de recette de la planification dans le dépôt ; ajoute (sans toucher aux autres sections) les cas ci-dessous, avec résultat attendu et case de résultat vide. Si le cahier n'est pas dans le dépôt, dis-le et fournis le texte dans le rapport.

**B) Parcours à deux séances — modification de la séquence depuis le Journal.** Règle : une occurrence est « commencée » dès qu'une de ses séances a été lancée ; la modification ne s'applique qu'aux occurrences non commencées et ne change jamais un statut.
1. Ajouter une séance à une routine ayant une occurrence Complétée : elle reste Complétée avec ses deux séances d'origine.
2. Inverser l'ordre : seules les occurrences non commencées changent.
3. Occurrence en cours (une séance lancée) : inchangée.
4. Occurrence rouge d'une semaine passée : prend la nouvelle séquence, affiche « Rattraper », reste rouge tant qu'elle n'est pas lancée.
5. Occurrence à venir exécutée en avance : inchangée.
6. À la sauvegarde : confirmation « N créneaux non commencés seront modifiés. ».
7. Après un rattrapage : statut selon l'issue ; date prévue conservée, date réelle d'exécution enregistrée.

**C) Modification d'une occurrence seule.**
1. Déplacer une occurrence (« Cette occurrence seulement ») : seule elle change ; les autres et le compteur « X à venir » sont inchangés.
2. Modifier ensuite la séquence de la routine : l'occurrence déplacée suit la nouvelle séquence et garde sa date.
3. Modifier ensuite la récurrence dans le Journal : l'occurrence déplacée à la main ne bouge pas.
4. Désactiver une pastille : seule cette occurrence est concernée ; elle est « Complétée » quand les séances actives sont faites.
5. Ajouter une séance à l'occurrence, puis la retirer : possible ; une séance de la routine ne peut pas être retirée, seulement désactivée.
6. Modifier la séquence de la routine après ajout ou désactivation manuels : l'occurrence est protégée.
7. Modifier le rappel d'une occurrence : seule elle change ; un changement global de rappel ne l'écrase pas.
8. Depuis l'Agenda, aucun moyen de modifier la routine entière : seul le Journal le permet (résultats du cas B).
9. Occurrence commencée : aucune modification possible.
10. Occurrence rouge : reprogrammable ; « Rattraper » affiché.
11. Pendant l'édition : seul le créneau ouvert est coloré, les autres sont grisés.

Règles du projet : baseline gelée ; primitives natives de l'OS prioritaires.
- PRESERVE : moteur d'exécution, écrans d'exécution, formulaire de planification hors points ci-dessus, tests existants.
- CHANGE : modification d'une occurrence, protection par groupe, cahier de recette (cas B et C).
- FORBIDDEN : réécriture massive des tests, changement de primitive native, modification du modèle sans validation (la copie de séquence par occurrence figée a déjà été soumise à validation dans le prompt précédent). Hors périmètre → `SCOPE_EXPANSION_REQUIRED`.

Tests : un test par cas C ; une suite verte ne remplace pas la recette sur iPhone. Livraison : classe de synchronisation A, rapport de mission dans `.github/orchestration/reports/` avec PRESERVE / CHANGE / FORBIDDEN démontrés, commit, état Git.
