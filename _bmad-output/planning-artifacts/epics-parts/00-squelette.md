# Squelette des stories PRE-4 (fixé avant rédaction parallèle)

Numérotation, titres et dépendances arrêtés par Claude avant la rédaction parallèle des quatre epics. Une story ne dépend que de stories antérieures dans cet ordre : 1.1 → 1.2 → 1.3 → 1.4 → 2.1 → … → 4.6.

*Révision après la revue ChatGPT du 2026-10-16 (R1-R4, Q27-Q30) : story 4.5 « Consulter un Média dans l'Éditeur (lecteur natif) » ajoutée (Q27) ; l'ancienne 4.5 devient 4.6 ; 3.3 et 3.6 suivent AD-15 révisé (`openSurface` et `activeCell` distincts).*

*Révision après la porte post-revue du 2026-10-16 (M1 à M3, F1 à F5, Q31) : AD-15 complété (T1 à T27) ; gestes de la tuile Média selon Q31 (4.4, 4.5) ; H22 précisée (4.2) ; 2.1 dépend de 1.1 et 1.3.*

## Epic 1 — Mes Exercices passent au modèle à Cible typée, sans perte

- **1.1 Socle : Cible typée, format v2 et migration 010.** Story atomique imposée par AD-14. Elle comprend :
  - le type de Cible et les deux Modes (AD-1) ;
  - les lecteurs v1 et v2, la forme v2 figée, la projection scalaire unique (AD-3) ;
  - `validateForSave` (AD-13) ;
  - `migration010` : conversion, prédicat d'illisibilité, écart des illisibles avec leurs liens et écriture de `migration_notices`, reconstruction d'`activities` avec ses tables filles, CHECK et parité (AD-4) ;
  - l'adaptation mécanique de tous les consommateurs et des tests `TO_FAILURE` ;
  - l'adaptation minimale de l'interface PRE-3 : 2 Modes dans le segmenté existant, et une Cible à l'échec affichée en lecture (« à l’échec ») dans la Feuille existante.

  L'application reste verte et utilisable. Dépend de : rien.
- **1.2 Avis des Exercices écartés et Séance vide visible.** `MigrationNoticeGate` et message unique (AD-12, H24) ; Séance sans occurrence visible et ouvrable (P39). Dépend de 1.1.
- **1.3 Copies, duplications et Instantanés à Cibles typées.** ED-19, FR-21-50 à FR-21-58, AD-9, H11, H29, P27, P28, P36. Dépend de 1.1.
- **1.4 Preuve de préservation sur une base antérieure réelle.** FR-18-19 : jeu de données v9 complet et comptes. Procédure de préparation des données de recette (`recette-iphone.md` §2, Exercice illisible de Q19 compris). Dépend de 1.1 à 1.3.

## Epic 2 — Des durées et des phrases justes pour les Cibles à l'échec

- **2.1 Nature et montant de la Durée totale d'un Exercice.** `exact | estimated | lowerBound | omitted`, formules, P25, H10, Cible `UNSET` (Q30) ; restriction et calcul de l'Inversion du total dans le domaine (FR-14-02, FR-14-03). Dépend de 1.1 et 1.3 (l'AC8 rejoue le calcul après une copie et sur un Instantané v2).
- **2.2 Format des durées et agrégation de Séance.** Formateur unique (FR-17-01, H8) ; Récupération qui remplace la Pause terminale ; nature de la Séance et du Circuit ; mesures (FR-15-02 à FR-15-05). Dépend de 2.1.
- **2.3 Phrase des paramètres pour les Cibles mixtes et corpus.** FR-16-*, Q16, H9, H16 à H18, P26 ; FR-17-02 à FR-17-05, avec l'adaptation explicite des 92 cas et les variantes. Dépend de 2.2.
- **2.4 Durées et résumés sur les cartes Catalogue et Composition.** FR-15-06 ; Q17, Q20, H20, H28 ; jamais « 0 s » ni « 0 rép. ». Dépend de 2.2 et 2.3.

## Epic 3 — Régler chaque Série dans la Feuille Paramètres d'exécution

- **3.1 Faisabilité sur iPhone du Popover natif dans la Feuille (S0).** AD-7 : critères de succès, repli, décision consignée. Ouverte par la vérification de compatibilité du dev client « Routine Dev » (Q22) ; nouveau build signalé à Hermann si nécessaire. Dépend de 1.1.
- **3.2 Brouillon de Feuille : Cibles typées, Régime, mémoire par Mode, retrait et annulation.** Domaine seul (AD-2) : H4, H5 (confirmée par Q29), H26, H27, P37, FR-11-*, FR-12-01 à FR-12-05, FR-12-07, FR-04-03 à FR-04-05. Dépend de 1.1 et 2.1.
- **3.3 Popovers Mode, Changement de côté, Ordre des côtés et Régime.** Interrupteur et segmentés retirés ; `openSurface` (AD-15) ; FR-03-*, FR-04-01, FR-04-02, FR-05-01 à FR-05-04. Dépend de 3.1 et 3.2.
- **3.4 Sélecteur de cible en Durée : option échec et grisé manipulable.** Q12, Q15, Q21, FR-07-01, FR-07-02, FR-07-04 à FR-07-06, FR-07-08, FR-08-01, FR-08-02, FR-08-04 à FR-08-06, FR-09-01, FR-09-05 (interface), H15. Dépend de 3.3.
- **3.5 Sélecteur de cible en Répétitions à une colonne.** Q8, Q14, FR-07-03, FR-08-03, FR-09-02, H14. Dépend de 3.4.
- **3.6 Tableau des séries variables : Cellule active, Pied commun, retrait, glisser.** AD-8, AD-15 (`activeCell`, table de transitions), AD-16, Q13, Q15, Q21, P38, H19 ; FR-10-*, FR-12-05, FR-12-06, FR-09-04, FR-09-06. Dépend de 3.5.
- **3.7 Ligne Durée totale et Inversion dans la Feuille.** FR-14-01, FR-14-04, FR-14-05, FR-07-07 ; roulette du total distincte. Dépend de 3.4 et 2.1.
- **3.8 Accessibilité et recette de la Feuille.** FR-22-08, FR-22-11, FR-03-13 ; scénarios de recette de la Feuille. Dépend de 3.3 à 3.7.

## Epic 4 — Un Éditeur d'Exercice fini, fidèle et accessible

- **4.1 Quatre Parcours d'édition, Terminer et retour.** ED-01, P8, P15. Dépend de 1.3 et 3.3.
- **4.2 Écran principal conforme aux références.** ED-02 : relevé des propriétés de FR-02-13, Q11, Q18, H22, P7, P17. Dépend de 4.1 et 2.3.
- **4.3 Catégorie et Zones corporelles depuis l'Éditeur.** ED-20 : P12 à P15, P34, P35. Dépend de 4.2.
- **4.4 Médias dans l'Éditeur, sans perte.** ED-21 (interface), P18. Dépend de 4.2 et 1.3.
- **4.5 Consulter un Média dans l'Éditeur (lecteur natif).** FR-21-05, FR-21-02 (consultation au toucher de la tuile, menu Retirer / Monter / Descendre à l'appui long), FR-22-09, Q27, Q31, AD-17. Dépend de 4.4.
- **4.6 Fidélité, accessibilité et recette finale de l'Éditeur.** ED-22 : FR-22-01 à FR-22-07, FR-22-09, FR-22-10, FR-22-12 ; largeurs, texte agrandi, VoiceOver ; liste complète des scénarios de recette. Dépend de 4.1 à 4.5 et 3.8.
