# PRE-3 — comparaison visuelle des 41 états de référence

Opération #340 · branche `feat/pre3-exercice-20261009` · développeur : Claude Code local.

## Nature exacte de cette comparaison

- **Comparaison statique** : propriétés du code livré (styles résolus, tokens, textes, ordre et structure) confrontées aux arbres Figma figés de `docs/preparation/PRE-3/figma/ecrans/*.json` (402 × 874), lus par un contour compact (nom, géométrie, remplissage, typographie, texte).
- **Aucune capture rendue** n'a été produite (pas de simulateur ni d'appareil dans cet environnement). Les largeurs 360 et 440, le texte agrandi, le clavier et les Safe Areas ne sont **pas** vérifiés visuellement : la mise en page utilise des marges relatives et du flex (aucune coordonnée absolue d'écran), ce qui est une propriété du code, pas une preuve de rendu.
- Les tests Jest de rendu vérifient la structure, les textes, les rôles et certaines propriétés de style ; ils ne remplacent pas une comparaison rendue. Aucun statut « conforme visuellement » n'est revendiqué.
- La barre d'état dessinée dans Figma est un décor système (non codé).

## Correspondance états → surfaces livrées

| # | Frame Figma | Surface livrée | Contrôle statique | Écarts nommés |
|---|---|---|---|---|
| 1 | 3542:4656 Création — Avant Paramètres | `ActivityEditorForm` | Zone bleue (nom 20 Semi Bold, pastilles Catégorie/Zones), carte Paramètres, Description, Médias, Terminer 48 r24 | E1, E2, E9 |
| 2 | 3943:6064 Ajouter — Initial | idem, état vide | « Choisir un mode », icône Catégorie, silhouette Zones, CR 10 s / Fin 5 s, placeholder description exact | E1, E9 |
| 3 | 4217:6980 Nom Description Media | idem | champ nom saisi, description multi-lignes, galerie 260 × 213 | E1, E9, E10 |
| 4 | 5088:6398 Catégorie renseignée | pastille Catégorie | pastille contour primary r16, pastille couleur 24, libellé Semi Bold 14 primary | E1 |
| 5 | 4734:6342 Modifier | `ExerciseScreen` (Catalogue/Séance edit) | titre « Modifier un exercice », valeurs rouvertes | E1, E3 |
| 6 | 4332:7095 Catégories | `CategoryPickerModal` | feuille ancrée bas, poignée 50 × 4, en-tête ✕ 38 / titre 18 / ✓ 38 primary, séparateur, pastilles 30 r16 surface-subtle, sélection #E5F0FF / contour #8283F2, pastille couleur 12, libellé 12 | E11, E12 |
| 7 | 4474:7157 Nouvelle catégorie | formulaire de création | champ nom, Ajouter inactif sur nom vide, sans message | E12 |
| 8 | 4478:7209 Zones | `BodyZonePickerModal` | même en-tête de feuille ; pastilles textuelles **sans silhouette répétée** ; action « Créer… » | E11, E12 |
| 9 | 4683:6336 Nouvelle zone | formulaire | Ajouter inactif sur nom vide, sans message | E12 |
| 10 | 4714:6241 Abandonner la création | `ExerciseExitConfirmModal` (existant) | boutons Annuler / Confirmer | E13 |
| 11 | 4861:6259 Catégorie — appui long | `ReferenceValueDialog` (existant, PRE-2) | inchangé | — |
| 12 | 4861:6348 Zones — appui long | idem | inchangé | — |
| 13 | 6407:9458 Paramètres 1 champ vide | carte Paramètres | « Choisir un mode », phrase vide, CR/Fin | E9 |
| 14 | 6407:9551 Modale ouverte vide | `ExecutionParametersSheet` | voile `overlayScrim` #1F2129 34 %, poignée, en-tête ✕/titre/✓, « — », « 1 série », « 0 s », « Aucun », ordre des lignes | E4, E5 |
| 15 | 6407:9702 Texte affiché | carte Paramètres | phrase Inter 13 / interligne 20, valeurs Semi Bold, carte bordée #E0E3E8 r12 | E6 |
| 16 | 6407:9805 Modale complète — mode | feuille | segmenté de mode en place (exclusif) | E4, E7 |
| 17 | 6407:9966 Steppers | feuille | steppers pilule 36 r18, cercles 28, valeur Semi Bold 13 primary (DSF Stepper) | E4 |
| 18 | 6407:10127 Durée — roulette ouverte | feuille + `DurationWheelPicker` natif | roulette SwiftUI en place sous la ligne, autres contrôles fermés | E8 |
| 19 | 6407:10481 Changement de côté — segmenté | feuille | segmenté 3 options en place | E4, E14 |
| 20 | 6411:9546 Durée totale — roulette | feuille | roulette de total (inversion) en place | E8 |
| 21 | 6411:9649 Avec changement de côté | feuille | lignes indentées Ordre des côtés / Pause entre les côtés | E4 |
| 22 | 6419:9847 Répétitions | feuille | ligne « Répétitions » stepper « 15 rép. » | E4 |
| 23 | 6419:10028 À l'échec | feuille | aucune cible, aucun total ; Bip avant Compte à rebours | E4 |
| 24 | 6423:9953 Message durée ajustée | feuille + `TransientNotification` | texte exact « Durée ajustée à … pour respecter un nombre entier de séries. », fond snackbar #292B33 r16 | E15 |
| 25 | 6665:24616 Durée variable (A) | tableau variable | en-têtes Durée / Pause, lignes numérotées, steppers cible/pause, total non modifiable 3 min 15 s | E4, E16, E17 |
| 26 | 6665:24844 Répétitions variables (E) | tableau | en-tête « Répétitions » | E16, E17 |
| 27 | 6665:25072 À l'échec variable (F) | tableau | colonne Pause seule | E16, E17 |
| 28 | 6665:25277 Douze séries (haut) | tableau 12 lignes dans le corps défilant | E16, E17 |
| 29 | 6665:26185 Ordre — Un côté après l'autre | segmenté Ordre des côtés | E4 |
| 30 | 6665:26575 Variables + par série (D) | tableau + ordre BY_SERIES | E16, E17 |
| 31 | 6665:26822 Une seule série — options sans effet | interrupteur et Ordre grisés (opacité 0,45), valeur « Un côté après l'autre » #BEC2CC | — |
| 32 | 6665:27008 Changement de mode — cibles à renseigner | cibles « — » | E18 |
| 33 | 6665:27232 Série incomplète | message « Série n : renseignez … » annoncé, tableau redéployé | E19 |
| 34 | 6665:27458 Tableau masqué | repli par chevron, données conservées | E20 |
| 35 | 6665:27608 Déplacement d'une série | Monter / Descendre par ligne | E17 |
| 36 | 6665:27862 Résumé — Durée variable bilatérale par série | phrase générée | E6 |
| 37 | 6665:28050 Résumé — À l'échec variable | phrase générée | E6 |
| 38 | 7059:13302 Répétitions avec cadence | « Durée totale ≈ » + valeur, Bip « 4 s » | E4 |
| 39 | 7069:13464 Avec changement de côté (copie) | feuille | E4 |
| 40 | 7069:13573 Répétitions (copie) | feuille | E4 |
| 41 | 7119:27855 Phrase longue (224 caractères) | carte Paramètres, hauteur intrinsèque, aucune troncature | E6 |

## Écarts nommés (impact · justification · statut · décision attendue)

| ID | Écart | Impact | Justification | Statut | Décision |
|---|---|---|---|---|---|
| E1 | Zone bleue : dégradé Figma (`GRADIENT_LINEAR`) rendu par le fond plein `exerciseContextBandBackground` (#F5F7FA) | Faible, visuel | Aucun token de dégradé canonique ; consigne « réutiliser uniquement les tokens existants » (`tokens.ts` non modifié) | Ouvert | Revue / propriétaire |
| E2 | Zone bleue en hauteur minimale 115 (contenu) au lieu d'une hauteur fixe | Faible | Texte agrandi et pastilles multiples ne doivent pas être rognés | Choix technique | Revue |
| E3 | Pastille Zones : noms joints par « · » (Figma « Cuisses . Fessier ») | Négligeable | Séparateur compact canonique du projet | Ouvert | Revue |
| E4 | Ligne sélectionnée : fond `stepperSurface` #F2F2FF (Figma #F4F4FF), contour 2 primary ; groupe #F9FAFC | Négligeable | Réutilisation de tokens existants | Ouvert | Revue |
| E5 | Hauteur de feuille : contenu jusqu'à la hauteur de fenêtre − Safe Area (Figma 570 fixe) | Faible | Corps défilant, en-tête fixe, bas atteignable à 360/440 et texte agrandi | Choix technique | Revue |
| E6 | Phrase : « Durée totale » sur la même ligne (espace) — Figma montre un retour à la ligne | Faible | Le générateur suit le corpus v15 (276 cas, texte exact) qui fait autorité sur l'exemple Figma | Ouvert | Propriétaire si le retour à la ligne est voulu |
| E7 | Segmenté de mode ouvert alors qu'aucun mode n'est choisi : l'indicateur partagé se place sur « Durée » | Faible | `SegmentedControl` partagé hors périmètre ne gère pas « aucune sélection » | Ouvert | Revue |
| E8 | Roulette en place avec sa barre ✕/✓ propre (Figma : roulette seule) | Moyen, visuel | R-1 : primitive native conservée, Valider/Annuler distincts, aucun commit au démontage | Délibéré (R-1) | Propriétaire |
| E9 | Tuile d'ajout de média : icône `action-add` (l'icône Figma « photo — ajouter » n'existe pas dans les assets) | Faible | Aucun nouvel asset ajouté | Ouvert | Revue |
| E10 | Actions par média Monter / Descendre / Retirer affichées sous chaque aperçu (pas de rendu Figma) | Moyen, visuel | D-335 exige ces commandes accessibles ; aucun maître Figma de menu | Ouvert | Propriétaire |
| E11 | Titres de feuille « Catégorie » / « Zones corporelles » (Figma « Catégorie de l'exercice ») | Faible | Libellés PRE-2 de `resources/fr.ts`, hors périmètre d'écriture | Ouvert | Élargissement i18n si souhaité |
| E12 | Action « Créer une zone » (Figma « Créer une zone corporelle ») ; style de l'action de création non réaligné | Faible | Libellés et styles PRE-2 conservés | Ouvert | Revue |
| E13 | Dialogue d'abandon : titre/message existants (« Abandonner les modifications ? ») vs Figma « Abandonner la création ? » | Faible | Dialogue partagé existant (D-094) hors périmètre d'écriture | Ouvert | Élargissement si souhaité |
| E14 | Segmenté de côté : libellés sur une ligne (Figma deux lignes « Sans⏎changement ») | Faible | Retour à la ligne laissé au moteur de texte | Ouvert | Revue |
| E15 | Message d'ajustement porte l'action « Annuler » (D-136) | Faible | Décision existante RM-010 / D-136 conservée | Délibéré | — |
| E16 | Groupe « Séries variables » (fond #F3F3F6, contour #5F60EE 1,5) non rendu comme cadre distinct | Faible | Pas de token correspondant | Ouvert | Revue |
| E17 | Poignée de glisser-déposer remplacée par Monter / Descendre ; **aucun geste de glisser** | Moyen, fonctionnel | Alternative accessible exigée ; aucune bibliothèque de glisser ajoutée | Ouvert | Propriétaire |
| E18 | Phrase d'un brouillon incomplet : « Paramètres à compléter. » au lieu des gabarits Figma « (30 s, — puis 1 min) » / « (à renseigner) » | Faible | Le générateur n'invente aucune phrase hors corpus | Ouvert | Propriétaire |
| E19 | Message de Série incomplète : texte défini en PRE-3 (aucun texte Figma) | Faible | Exigence v13 §6 sans libellé source | Ouvert | Propriétaire |
| E20 | Bouton de repli du tableau : chevrons existants `control-chevron-up/down` | Négligeable | Réutilisation d'assets | Ouvert | Revue |

## Hors comparaison

Écrans d'exécution (hors PRE-3), cartes Catalogue/Composition (adaptation minimale uniquement : « N séries variables », symboles exact/≈/≥), Profil (inchangé).
