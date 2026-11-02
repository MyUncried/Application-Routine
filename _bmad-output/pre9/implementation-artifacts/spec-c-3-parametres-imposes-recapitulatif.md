# C.3 — Paramètres imposés et récapitulatif

Story PRE-9, epic C. Plan : `../planning-artifacts/epics.md` § C.3 (ARB-03, ARB-18, ARB-22a, ARB-25, ARB-04 valeurs initiales validées). Branche `pre9-bmad/dev`. Figma en lecture seule : `8624:30306` (Tabata), `8624:30392` (EMOM), `8656:35062` (Progression). Aucune migration.

## Sources appliquées

| Source | Passage | Effet |
|---|---|---|
| ch07 l.1414 « Défauts validés » | « Tabata 8×20 s/10 s imposés ; 30/30 6 séries, cadence 30/30 imposée ; EMOM fenêtre 60 s/N 6 ; AMRAP durée 12:00 **réglable** ; For time 21·15·9 ; Death by départ1/incrément1/fenêtre1 min. **Départs rapides** sans Mouvement présélectionné : Renforcement 3×15, Progression 10/12/14, À l'échec 3 séries, Superset Circuit groupé 1 passage/deux emplacements vides, Libre Séance vide ; Gainage · Mobilité supprimé. Aucune autre valeur de maquette n'est un défaut. » | `sessionModels.ts` : seules ces valeurs. |
| Consolidation 30/10, D-02 | « le Format et ses réglages appartiennent à l'Exercice, **jamais au Circuit** » | Chaque Exercice reçoit `format` ; aucun Format sur un Circuit. |
| D-13 | « Pour Tabata, EMOM, Progression : proposer l'organisation à l'ajout du second Exercice ; pas de sélecteur d'organisation pour For time. » | Segment « À la suite / En alternance » seulement pour ces trois modèles, à partir de deux Exercices. |
| D-16, FMT-13 | Tabata alterné admis si N = 8 ; EMOM alterné, N adapté. | « En alternance » : Circuit alterné de compte égal aux séries des membres (Tabata 8, EMOM N, Progression 3). |
| D-22 / D-23 | « aucun Mouvement présélectionné […] Les modèles réutilisent le parcours Catalogue de choix des Mouvements. » | Format / départ rapide → sélection des Mouvements (écran existant) → paramètres. |
| CE-FMT-02 §5, §8, §12, §14, §16 | Paramètres par Exercice formaté ; Tabata séries 8 ; EMOM durée calculée N×E×W ; For time sans segment ; « Changer un réglage recalcule synthèse et durée. Segment change ordre, pas volume. » ; aucune borne nouvelle ; retour conserve les réglages. | Constantes grisées avec leur raison ; réglages par pas ; durée totale recalculée (autorité de B.7) ; minimum structurel du registre seulement. |
| ARB-18b | For time : zéro admis dans une position si le volume total n'est pas nul. | `withModelSetting` refuse un volume total nul. |
| ARB-15, B.9 | Nom initial suggéré = nom du Format, modifiable. | Champ de nom en tête, prérempli du nom du Format (Format seulement), resté suggéré s'il n'est pas modifié. |

## Réalisé

- **Domaine** `src/domain/sessions/sessionModels.ts` : paramètres par modèle (verrouillé / réglable), valeurs initiales, `withModelSetting`, `modelFormat`, `modelExecutionParameters` (Tabata 8×20/10, 30/30 N×30/30, EMOM N séries, Renforcement N×R répétitions, Progression échelle de répétitions, À l'échec N séries à l'échec ; AMRAP, For time, Death by et Superset gardent les paramètres du Mouvement, leur bloc étant décrit par le Format, D.1), `modelArrangement`, `modelDraftPatch` (modèle à Circuit unique : Exercices enchaînés ou membres du Circuit).
- **Écran** `FormatParametersScreen.tsx`, route `(creation)/format-parameters` : « Composer une séance {modèle} », nom, Mouvements choisis, Paramètres d'exécution, Durée totale (`formatSessionDurationEstimate`, annoncée poliment), Exécution, « Enregistrer dans la séance » → brouillon prérempli (C.4, première puce) et Composition.
- `MovementSelectionScreen` : `then=format-parameters` enchaîne sur les paramètres ; le retour revient au choix des Mouvements.
- `SessionDraftProvider.suggestDraftName` : nom proposé qui reste suggéré (B.9).

## À CLARIFIER (non bloquant)

1. **Superset — « deux emplacements d'Exercices vides »** (D-24) contre COMP §1 « Un conteneur naît autour de membres existants, jamais vide ». Réalisé sans emplacement vide : le Circuit groupé d'un passage est formé des Mouvements choisis dans le Catalogue (D-22/D-23). Un emplacement vide demanderait un nouvel objet de modèle.
2. **« Récupération entre les mouvements »** (Tabata, `8624:30306`, 1 min) : valeur de maquette, absente des défauts validés — non rendue. La Récupération de l'Exercice (défaut du Profil) s'applique.
3. **« Déroulé »** (graphique des maquettes) : non exigé par CE-FMT-02 §8 ; non rendu.
4. **Libellé EMOM** : la maquette montre « Dans chaque intervalle » ; le segment commun « À la suite / En alternance » est retenu (CE-FMT-02 §12).
5. **Saisie des réglages** : pas de 1 (5 s pour les fenêtres, 1 min pour l'AMRAP) par boutons − / +, élément ajustable VoiceOver ; la valeur Figma en pastille ne précise pas l'éditeur.

## Synchronisation documentaire

Classe **A** (règles écrites ci-dessus) ; points 1 à 5 consignés ici, sans règle créée.

## Tests

`src/domain/sessions/__tests__/sessionModels.c3.test.ts` (valeurs initiales, constantes, EMOM N × W, For time ARB-18b, départs rapides sans Format, organisation, Superset, brouillon).

## Reprise du 02/11/2026 — questionnaires et récapitulatifs (remplace ce qui précède)

[Le contenu ci-dessus (écran unique de paramètres, constantes Tabata/30/30 grisées, À CLARIFIER 1 à 5) est **remplacé** par la référence Formats du 02/11/2026 §7, §9 à §12, §15 et CE-FMT-02. Les points 1 (Superset sans emplacement vide : A4), 2 (Récupération entre les mouvements : §9, §10, §12), 3 (Déroulé : §15) et 4 (libellé EMOM : « Dans chaque intervalle ») sont tranchés ; le point 5 (saisie) suit CE-FMT-02.]

- **Domaine** `formatModels.ts` : réponses du questionnaire (valeurs initiales décidées seulement ; pause et récupération non décidées = Profil, §14.3), options d'Exécution (Tabata/30/30/Renforcement/Progression/À l'échec : À la suite | En alternance ; EMOM : Dans chaque intervalle | À la suite | En alternance ; Death by : À la suite | En alternance | Dans chaque intervalle ; aucune pour AMRAP, For time, Superset), valeurs par mouvement, adaptation à N (A6, §9.3 : lignes « à compléter », surplus retiré), structure produite (§1 : Exercices standards, Exercices formatés autonomes, Circuit standard, Circuit porteur), ajout au brouillon (`appendModelToDraft`). `formatTimeline.ts` : Déroulé calculé (§15).
- **Écran** `FormatModelScreen` (routes `format-questionnaire`, `format-summary`) : croix au questionnaire, Retour au récapitulatif (réponses conservées par `FormatModelDraftProvider`, titre inchangé) ; zone de contexte (couleur, motif agrandi, nom, accroche) ; « + Ajouter » → champ de saisie et « Ouvrir le catalogue » (le Catalogue reprend le texte saisi) ; suggestions en cartes « Mouvement sélectionné » ; choix → récapitulatif ; cartes à suppression glissée (dernier mouvement de boucle bloqué) ; tableaux AMRAP (Rép. | Par tour | Max), For time (tours), Progression (séries, répétitions et charge locales, clavier numérique/décimal, Suivant) ; Déroulé à 25 px du bouton ; « Enregistrer dans la séance » → brouillon, retour à la Composition, nom du modèle suggéré (B.9).
- Modale « Mouvement du buy-in » (sélection unique) ; « Changer » remplace le buy-in.

Écarts restants (C.3) : réordonnancement par appui long non réalisé (actions VoiceOver Monter / Descendre seulement) ; police d'accroche « Mali » non embarquée (Inter italique) ; « Charge Avec/Sans » se règle dans la modale du mouvement de la Composition, pas encore depuis le récapitulatif ; nombre de séries variables For time / Progression édité par cellule, sans roulette.

Synchronisation : classe **A**. Tests : `formatModels.c3` (20), `FormatModelScreen.c3` (3).
