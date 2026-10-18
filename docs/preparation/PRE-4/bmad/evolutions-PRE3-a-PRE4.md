# PRE-4 BMAD — ce qui change par rapport à PRE-3

**Périmètre.** Ce document liste les évolutions livrées sur la branche `bmad/pre4-comparaison`, du code PRE-3 (`626632c3`) au commit `57a99c8e` (story 4.6). Il couvre les stories 1.1 à 4.6 et les décisions Q33 à Q52, ainsi que les décisions Q53, Q54 et Q55 (correctifs de recette du 2026-10-18 ; Q55 retire l’invite H22 de la Carte vide, rendue comme en PRE-3). Ce qui a été fait puis annulé n’y figure pas, sauf mention « annulé, PRE-3 conservé ».

**Sources.** Code et `git diff 626632c3 57a99c8e`, specs livrées `_bmad-output/implementation-artifacts/spec-*.md`, `questions-ouvertes.md`, colonne « Changé vs PRE-3 » de `recette-delta-PRE3-a-4.4.md`.

**Ce que ce document n’établit pas.** Il ne déclare aucune conformité visuelle ni aucun résultat de recette. La validation sur iPhone appartient à Hermann.

**En bref, par thème.**

- **Données et migration** : « à l’échec » n’est plus un Mode mais une valeur de Cible, par Série ; les données PRE-3 sont converties sans perte de ce qui est lisible.
- **Calculs, durées et phrases** : un mélange de Cibles chiffrées et « à l’échec » a désormais une Phrase et un total partiel « ≥ » ; un seul formateur de durée.
- **Feuille** : valeur seule, ouverte à l’appui, dans un popover natif (Mode) ou un panneau sans flèche ; roues de Cible avec option échec ; roue par cellule et retrait d’une série.
- **Éditeur** : ouverture directe depuis `Créer`, ordre et grille des frames, fermeture par ✕ ; la Carte entière ouvre la Feuille.
- **Catégorie et Zones** : libellé et icône pleine sur les accès ; alternatives accessibles ; une Zone retirée encore affectée reste utilisable, visible et désaffectable (Q53).
- **Médias** : toucher pour consulter par le lecteur natif, appui long pour le menu ; vignette du premier Média au Catalogue.
- **Technique** : nouveaux composants partagés ; primitives natives étendues, jamais remplacées ; aucune dépendance native ajoutée.

| Thème | Type | Évolution | Nature | Story / décision |
|---|---|---|---|---|
| Données et migration | Retiré | Le Mode « À l’échec » disparaît : il reste deux Modes, Durée et Répétitions, et « à l’échec » devient une Cible possible pour chaque Série. | Fonctionnel, Technique | 1.1 |
| Données et migration | Modifié | Chaque Série porte une Cible typée (valeur, « à l’échec » ou à renseigner), enregistrée dans un nouveau format (v2) des paramètres, pour les Définitions comme pour les Copies. | Technique | 1.1 |
| Données et migration | Ajouté | La migration 010 fait passer la base en version 10 : elle convertit les données PRE-3 et reconstruit la table des Copies sans l’ancien troisième Mode ; toute erreur structurelle annule l’ensemble. | Technique | 1.1, 1.4 |
| Données et migration | Ajouté | Les Exercices illisibles sont écartés et dénombrés, sans perte de leur Séance, de leurs Catégories, Zones ni Médias. Une `Alert` native au lancement (« n exercices illisibles n’ont pas pu être repris. », bouton `OK`) le signale. | Fonctionnel, Technique | 1.1, 1.2 ; Q19, Q28, H24 |
| Données et migration | Modifié | Une Séance vidée par la migration reste listée et ouvrable (« 0 exercice · 2 tours », « 0 min »), au lieu de disparaître de la liste. | Fonctionnel | 1.2 ; Q32 |
| Données et migration | Modifié | Une valeur ancienne hors bornes (5999 s, 150 rép.) est conservée et affichée telle quelle tant qu’on ne la modifie pas. | Fonctionnel | 1.1 ; Q21, H25 |
| Données et migration | Modifié | Copies, duplications et Instantanés conservent à l’identique les Cibles, Pauses, Zones et Médias, sans partage d’objets entre Copie et source. | Technique | 1.3 |
| Calculs, durées et phrases | Ajouté | Une Phrase est produite pour un mélange de Cibles, par exemple « 3 séries de durée variable (30 s, 45 s puis jusqu’à l’échec) ». Elle se compacte au-delà de 3 Cibles. | Fonctionnel | 2.3 ; Q16 |
| Calculs, durées et phrases | Ajouté | Un mélange affiche une durée partielle précédée de « ≥ », dans la Feuille, la Carte, le Catalogue et Composition. | Fonctionnel | 2.1, 2.4, 3.7 ; Q17 |
| Calculs, durées et phrases | Modifié | La carte d’un Exercice dont toutes les Cibles sont à l’échec affiche « 3 séries à l’échec » au lieu de « 3 séries jusqu’à l’échec ». | Fonctionnel | 2.4 ; Q24 |
| Calculs, durées et phrases | Modifié | Le total partiel de Composition s’affiche en minutes et secondes exactes (« ≥ 1 min 45 s »), et non plus arrondi à la minute (« ≥ 2 min »). | Fonctionnel | 2.4 ; Q20 |
| Calculs, durées et phrases | Modifié | Un formateur de durée unique s’applique partout : 60 s s’affiche « 1 min », par exemple pour le Compte à rebours et la Fin sur la Carte. | Fonctionnel, Technique | 2.2 |
| Calculs, durées et phrases | Modifié | Une Cible à renseigner supprime la Durée totale de l’Exercice et affiche « Paramètres à compléter. » au Catalogue. La Séance compte le travail connu, avec « ≥ ». | Fonctionnel | 2.1 ; Q30, H10 |
| Calculs, durées et phrases | Ajouté | La Durée estimée d’exécution d’une Séance (Compte à rebours et Fin compris) est calculée dans le domaine. Elle n’est affichée nulle part. | Technique | 2.2 ; P31 |
| Feuille | Modifié | Le Mode passe d’un segmenté en ligne à trois options à un popover natif iOS à deux options (`Durée`, `Répétitions`). | Fonctionnel, Layout | 3.1, 3.3 |
| Feuille | Modifié | Changement de côté, Ordre des côtés et Régime s’ouvrent dans un panneau sans flèche, sous le champ, avec le segmenté existant. Sur Android et le web, ils restent en ligne. | Layout | 3.3 ; Q41, Q43 |
| Feuille | Modifié | Un champ Régime (`identiques` / `variables`) dans la ligne `Séries` remplace l’interrupteur « Séries variables » ; il est atténué à 1 série. À 1 série, l’Ordre des côtés est masqué au lieu d’être grisé, et il est restitué dès 2 séries. | Fonctionnel, Layout | 3.3 ; Q38, Q43 |
| Feuille | Modifié | Les steppers permanents (N, Pauses, Bip, Compte à rebours, Fin) cèdent la place à la valeur seule. Les ± apparaissent à l’appui, et un seul champ est ouvert à la fois. | Fonctionnel, Layout | 3.3 |
| Feuille | Modifié | Une valeur à renseigner est signalée par un fond rouge léger `#FFF1F0`, sans liseré. Le Changement de côté non choisi affiche « — » au lieu de « Sans changement ». | Layout | 3.3 ; Q35 |
| Feuille | Ajouté | La roue de Cible Durée propose l’option « Aucune durée, à l’échec » et un grisé manipulable. Elle va de 5 s à 58 min 55 s, à la seconde, refuse `00:00` et s’ouvre sur 00:05 si la Cible est vide. | Fonctionnel, Layout | 3.4 ; Q25, Q36 |
| Feuille | Modifié | En Répétitions, le stepper de Cible devient une roue à une colonne : « Aucune répétition, à l’échec », puis 1 à 100. Le libellé devient « Nombre de répétitions ». | Fonctionnel, Layout | 3.5 ; Q8, Q14 |
| Feuille | Ajouté | Dans le tableau des séries variables, toucher la valeur d’une cellule ouvre la même roue, ce qui permet une Cible à l’échec par série. Les ± permanents sont conservés. | Fonctionnel | 3.6 ; Q44, Q45 |
| Feuille | Ajouté | Une croix retire une série, avec « Série supprimée — Annuler ». Toute autre modification annule la possibilité de revenir en arrière. | Fonctionnel | 3.2, 3.6 ; Q29 |
| Feuille | Modifié | Depuis « — », le + d’une cellule donne le minimum (5 s ou 1 rép.) et non plus 30 s. Au-dessus de la borne, il est indisponible au lieu de faire baisser la valeur. | Fonctionnel | 3.6 ; Q36, Q44 |
| Feuille | Modifié | Durée totale : un mélange affiche un total partiel « ≥ » en lecture seule, et la ligne est masquée si une Cible est à renseigner. La roue est bornée de 1 à 99 séries, en panneau. Au-delà de 99:59, la ligne passe en lecture seule. | Fonctionnel, Layout | 3.7 ; Q46 |
| Feuille | Modifié | Les apparitions se font par le bas, sans fondu (350 ms). La sélection est rendue par un fond, sans liseré ni déplacement du texte. Les lignes de la Feuille et du tableau mesurent 44 pt. | Layout | Q39 à Q42 |
| Feuille | Modifié | Avec une surface ouverte, le premier ✓ ou ✕ de la Feuille la ferme seulement. VoiceOver annonce « aucune valeur », « minimum atteint » et « maximum atteint », et le focus est rendu à la Carte. | Fonctionnel | 3.8 ; Q47 |
| Éditeur | Modifié | Sur le segment Exercices du Catalogue, `Créer` ouvre directement l’Éditeur, une seule fois même en cas de double toucher. Le segment et le défilement sont restitués au retour. Les autres segments gardent la liste d’options. | Fonctionnel | 4.1 ; Q33 |
| Éditeur | Modifié | La Description passe avant la Carte Paramètres d’exécution. | Layout | 4.2 ; P7 |
| Éditeur | Modifié | L’Éditeur se ferme par un ✕ circulaire au lieu du chevron, avec le libellé accessible « Retour » inchangé. | Layout | 4.2 ; Q48 |
| Éditeur | Retiré | Le bouton « Choisir un mode » (ou nom du Mode) à droite du titre de la Carte disparaît : toute la Carte ouvre la Feuille. | Fonctionnel, Layout | 4.2 ; Q23 |
| Éditeur | Modifié | Grille verticale D-327 (18 / 13 / 20 / 12), marge latérale de 16 sous 390 pt, retour à la ligne avant « Durée totale » dans la Phrase. | Layout | 4.2 ; Q48 |
| Éditeur | Modifié | Le dialogue d’abandon en création a ses propres textes (« Abandonner la création ? »). Ceux de la modification sont inchangés. | Fonctionnel | 4.2 ; Q18 |
| Catégorie et Zones | Modifié | Non renseignés, les accès `Catégorie` et `Zone corporelle` affichent une icône et un libellé. L’icône devient pleine pendant l’ouverture de la feuille, avec la silhouette du Profil pour les Zones. | Fonctionnel, Layout | 4.3 ; Q49 d |
| Catégorie et Zones | Modifié | Dans le bandeau, les Zones sont séparées par « . » au lieu de « · ». | Layout | 4.3 ; Q49 a |
| Catégorie et Zones | Modifié | Supprimer une Catégorie ou une Zone utilisée affiche un message propre à chaque référentiel, au lieu d’un message commun. | Fonctionnel | 4.3 |
| Catégorie et Zones | Ajouté | L’action VoiceOver « Modifier ou supprimer » remplace l’appui long sur une entrée. Le focus va au menu puis à la confirmation, et revient à l’accès à la fermeture de la feuille. | Fonctionnel | 4.6 ; Q52 f |
| Catégorie et Zones | Ajouté | Les zones de toucher de `Créer une catégorie`, `Créer une zone corporelle` et `Ouvrir les réglages` sont élargies, sans changement de dessin. | Fonctionnel | 4.6 ; Q52 a |
| Catégorie et Zones | Modifié | Une Zone corporelle retirée du référentiel mais déjà affectée ne bloque plus l’enregistrement d’un Exercice ni d’une Séance : la Copie la conserve. Dans la feuille des Zones de cet Exercice, elle reste visible, cochée et interactive, sur fond rouge clair, sans mention « Retirée » ; supprimée depuis la feuille d’un Exercice, elle disparaît du sélecteur et de la sélection de cet Exercice, comme en PRE-3, et n’apparaît en rouge que dans les autres Exercices qui l’avaient (Q53 (7)). Aucun avis textuel ni annonce VoiceOver dans l’Éditeur (Q53 (9), décision de Hermann du 2026-10-18). Avant : la Zone était absente de la feuille et la Séance ne s’enregistrait pas. | Fonctionnel, Technique | 4.3 ; Q53 |
| Composition | Retiré | L’écran « Catégories de la séance », vestige d’un parcours disparu, est supprimé (route `categories`). | Fonctionnel, Technique | Q54 |
| Composition | Modifié | L’action finale de la Composition devient `Enregistrer la séance` (au lieu de `Continuer`) : elle enregistre la Séance et revient au Catalogue, segment `Séances` ; en cas d’échec, le message « La séance n’a pas pu être enregistrée. Réessayez. » s’affiche sur la Composition. | Fonctionnel | Q54 |
| Catégorie et Zones | Modifié | Même règle pour la Catégorie d’un Exercice et l’Étiquette d’une Séance : supprimées depuis la feuille d’un objet, elles quittent immédiatement sa liste et sa sélection (Catégorie : avis « Choisissez-en une autre », `Terminer` inactif jusqu’au choix d’une autre) ; dans les autres objets qui les ont, elles restent affectées, choisies sur fond rouge clair, sans menu, sans avis textuel (Q53 (9)) ; une Copie ou une Séance dupliquée les conserve sans blocage. | Fonctionnel, Technique | 4.3 ; Q53 (8), (9) |
| Médias | Ajouté | Dans l’Éditeur, toucher une tuile lit la vidéo en plein écran natif ou ouvre la photo en plein écran avec « Fermer ». En cas d’échec, la tuile affiche « Média indisponible. » | Fonctionnel | 4.5 ; Q27 |
| Médias | Modifié | Le menu `Retirer` / `Monter` / `Descendre` passe du toucher à l’appui long, en menu contextuel natif iOS, sans `Annuler`. Les actions VoiceOver sont inchangées, et les indications deviennent « Lire la vidéo… » et « Agrandir le média… ». | Fonctionnel | 4.5 ; Q31, Q51 |
| Médias | Ajouté | La carte du Catalogue affiche une vignette carrée du premier Média (l’image de couverture pour une vidéo). Elle est touchable et n’est pas annoncée par VoiceOver. | Fonctionnel, Layout | 4.4 ; D-264, Q50 e |
| Technique | Ajouté | Nouveaux modules : `AnchoredPanel` (panneau sans flèche), `SheetMotion` (animations Reanimated sur le fil UI), `sheetSurface` (une seule surface ouverte), `MediaConsultation`, `useReferenceSheet`, `MigrationNoticeGate`, `UNSELECTED_OPACITY` ; icônes `icon/fermer` câblée et trois icônes pleines tirées de Figma. | Technique | 1.2, 3.3 à 4.6 |
| Technique | Modifié | `DurationWheelPicker` (bornes, option échec), `NumberWheelPicker` (1 à 100, ligne de tête), `InlineStepper` (pas corrigé) et `FixedHeader` (✕, marge) reçoivent des props optionnelles ; Composition et Profil doivent garder leur comportement, à vérifier en recette (D-4, D-5). | Technique | 3.4 à 3.6, 4.2 |
| Technique | Ajouté | Nouveaux usages de `@expo/ui` (`Popover` du Mode, `ContextMenu` des Médias), d’`expo-video` et de `react-native-reanimated`, déjà présents dans le build : `package.json` est inchangé. | Technique | 3.1, 4.5 ; Q39 |
| Technique | Ajouté | Dans le domaine : lecteur des anciens paramètres v1, Brouillon de Feuille étendu (retrait, annulation, ligne de base par identité, N hérité), natures de durée `lowerBound` et `incomplete`. | Technique | 1.1, 2.1, 3.2 |
| Technique | Modifié | Lexique : nouvelles clés (avis, option échec, annonces, consultation, préfixes ≈ et ≥) et clés orphelines retirées. Jetons inchangés, `migration001` intacte. | Technique | 2.2, 3.8, 4.5, 4.6 |
| Technique | Ajouté | Nouveaux tests : migration 010, préservation sur une base v9 réelle, quatre parcours sans écriture avant `Terminer`, accessibilité 3.8 et 4.6. Les garde-fous zéro `ScrollView` sont renforcés, et le gel des migrations historiques ne dépend plus des fins de ligne. | Technique | 1.1 à 4.6 ; `d07a3817` |
| Technique | Ajouté | Variante de développement « Routine BMAD » (`com.ankusha.kodjo.bmad`, icône, profil EAS dédié) et script de tunnel ngrok pour Windows ARM64. | Technique | `fa738e31`, `f41ef057` |

**Annulé, PRE-3 conservé.** Cellule active et Pied commun du tableau des séries variables (Q44).

Points en attente d’arbitrage : Q44 à Q52.
