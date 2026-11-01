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
