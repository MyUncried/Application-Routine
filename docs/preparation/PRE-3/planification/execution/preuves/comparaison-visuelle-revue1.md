# PRE-3 — comparaison visuelle, correction revue 1 (REV-06)

Opération #340. Ce document complète `comparaison-visuelle.md` (livraison 96c46c74), qui reste inchangé. Il reprend les écarts E1–E20, indique ceux qui sont corrigés et liste les écarts encore ouverts, chacun avec sa justification.

## Blocage du rendu (aucune capture produite)

Aucune comparaison **rendue** n'a été faite, et aucune validation visuelle n'est revendiquée :

- poste Windows 11 ARM64 (MSYS) : ni Xcode, ni `xcrun`, ni simulateur iOS ; aucun appareil iOS n'est relié ;
- EAS CLI absent du poste (`npx --no-install eas` échoue) ; aucune build distante n'a été lancée, car elle exige une connexion au compte EAS et des identifiants de signature non disponibles ici, et peut être payante ;
- `expo-video ~57.0.5` est une dépendance native : un rechargement JS d'une build existante ne suffit pas.

Les éléments ci-dessous résultent d'un **contrôle structurel** : propriétés de style et arbres rendus vérifiés par Jest, comparés aux valeurs Figma lues lors de la livraison. Ce contrôle ne remplace pas une capture. Le candidat installable et la procédure bornée sont dans `procedure-appareil-revue1.md`.

## Écarts corrigés dans le périmètre (tests propriétaires PASS)

| ID | Source | Correction | Preuve |
|---|---|---|---|
| E6 | Phrase v1 §5 (Figma) | Retour à la ligne de **présentation** avant « Durée totale » ; le texte canonique (corpus de 276 phrases) est inchangé | `ActivityEditorForm.test.tsx` (`phrase()` canonique vs `renderedPhrase()`) |
| E10 | D-335 | Plus aucun bouton dessiné sous les aperçus. Un appui ouvre un menu par média (feuille d'actions iOS, alerte ailleurs) : Retirer / Monter / Descendre, bornes exclues ; les mêmes actions sont exposées à VoiceOver | `ActivityMediaList.test.tsx`, `ExerciseScreen.test.tsx` |
| E11 | Figma 4332:7095 | Titre de feuille « Catégorie de l’exercice » ; **aucune coche** sur la feuille Catégorie (D-222, chapitre 06) | `CategoryPickerModal.test.tsx` |
| E12 | Figma | « Créer une zone corporelle » ; action de création en hauteur 32, rayon 16, contour `primarySoft`, texte `type.supporting` en couleur primaire | `BodyZonePickerModal.test.tsx`, `CategoryPickerModal.test.tsx` |
| E16 | v13 / Figma | Groupe « Séries variables » encadré : bordure 1,5 `colors.selection`, fond `colors.surface` | `ExecutionParametersSheet.test.tsx` |
| E17 | v13 §6 | Poignée de glisser (6 points) sur chaque ligne du tableau, avec les actions accessibles « Monter / Descendre la série n » | `ExecutionParametersSheet.test.tsx` (`dragDestination`, glisser simulé, actions) |
| E19 | v13 §6 | ✓ grisé et annoncé indisponible tant qu’une valeur manque ; cellule signalée par un contour danger ; message en ligne qui nomme la Série ; total « — » tant que le brouillon est incomplet | `ExecutionParametersSheet.test.tsx` (« correction revue 1 ») |
| E20 | DSF | Repli du tableau par le contrôle de divulgation partagé (`DisclosureControl`) | `ExecutionParametersSheet.test.tsx` |
| — | DSF | Largeur des steppers : 137, et 128 dans le tableau ; libellé long limité à 180 | `ExecutionParametersSheet.test.tsx` |
| — | RM-010 / D-136 | Message d’ajustement placé **sous la ligne du total** ; « Annuler » restitue le brouillon précédent ; disparition automatique | `ExecutionParametersSheet.test.tsx` (REV-02) |
| — | DSF cartes-durée | La carte Catalogue affiche la durée intrinsèque : exacte, « ≈ », ou absente | `ActivityCard.test.tsx` |
| — | Figma Composition | Résumé compact des Séries variables : « N séries variables » (et la variante « par côté ») | `compositionPresentation.test.ts` |

## Écarts conservés par décision ou par réutilisation de tokens

| ID | Écart | Raison |
|---|---|---|
| E2, E5 | Hauteurs minimales (zone bleue, feuille) au lieu de hauteurs fixes | Le texte agrandi et le contenu variable ne doivent pas être rognés (choix technique déjà exposé) |
| E3 | Séparateur « · » des Zones | Séparateur compact canonique du projet |
| E4 | #F4F4FF → `stepperSurface` #F2F2FF ; #F3F3F6 → `surface` #F5F7FA ; points de la poignée en `textSecondary` | Écarts négligeables. Ils évitent d'ajouter de nouveaux tokens (`tokens.ts` non modifié) |
| E15 | « Annuler » sur le message d’ajustement | Décision existante D-136 |
| E18 | Phrase d’un brouillon incomplet : « Paramètres à compléter. » | Phrase v1 interdit les cibles inventées ; les gabarits Figma « (à renseigner) » ne figurent pas dans le corpus |

## Écarts restants qui exigent un chemin hors périmètre (non élargi)

Conformément à la mission, aucun de ces chemins n'a été modifié. Chacun est identifié avec sa justification et ses consommateurs, pour que le pilote décide s'il faut élargir le périmètre.

| ID | Écart | Chemin à ouvrir | Consommateurs touchés | Justification |
|---|---|---|---|---|
| E7, E14 | Segmenté de mode sans sélection quand le mode est nul ; libellés sur deux lignes en 13 px pour Côté et Ordre | `src/shared/ui/SegmentedControl.tsx` (hauteur 34 et police 16 fixes) | Composition, Profil, feuille Paramètres | Composant partagé : modifier son comportement touche des écrans PRE-2 gelés |
| E8 | Roulette en ligne sans sa barre ✕/✓ propre (DSF : « pas de seconde modale ni validation indépendante ») | `src/features/sessions/DurationWheelPicker.tsx` | Composition, feuille Paramètres | Tension avec R-1, qui impose Valider/Annuler distincts. **Arbitrage déjà tracé (R-1), pas une nouvelle question** |
| E9 | Icône Figma « photo — ajouter » | Nouvel asset + `src/shared/ui/KodjoIcon.tsx` | Tuile d’ajout de média | L'asset n'existe pas dans le dépôt |
| E1 | Dégradé de la zone bleue | Dépendance `expo-linear-gradient` (`package.json`, nouvelle build native) | En-tête d’Exercice | Aucun token de dégradé ; dépendance native supplémentaire |
| E13 | Dialogue d’abandon « Abandonner la création ? » | `ExerciseExitConfirmModal` / `resources/fr.ts` | Dialogue partagé D-094 (création et modification) | Texte partagé hors `write_scope` |

## Hors comparaison

Les écrans d’exécution (hors PRE-3) et le Profil (inchangé).
