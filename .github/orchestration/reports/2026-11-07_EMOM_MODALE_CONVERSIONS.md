# EMOM — modale, conversions et récapitulatifs

Décisions de Hermann des 6 et 7 novembre 2026. Documentation établie sur la suite de D-516 (PR #427). Code examiné sur la branche PRE-9 au commit `f0f8ebab`, corrections dans la [PR #430](https://github.com/MyUncried/Application-Routine/pull/430). La carte de Composition dépend également de la [PR #428](https://github.com/MyUncried/Application-Routine/pull/428).

## Inventaire et classement

A désigne une correction d’écart avec une règle déjà applicable. B désigne la mise en œuvre d’un arbitrage fonctionnel de Hermann. Les cas ci-dessous décrivent le point de départ examiné et le résultat attendu.

| Champ ou parcours | Cas | Constat initial et correction | Classe |
|---|---|---|---|
| Mode, phases, charge, côtés, cadence | 1 à 4 | La modale standard comportait ces contrôles. La ligne du récapitulatif EMOM était initialisée sans unité. Initialisation en Répétitions, changement vers Durée possible par exercice. | B |
| Condition d’arrêt | 1 à 4 | Le segment et le clavier des séries variables permettaient l’échec. Désactivation visible dans la modale, retrait du choix clavier et rejet de l’ancienne cible à la validation de configuration. Une ancienne cible à l’échec doit être renseignée avant validation. | B |
| Pause | 1 à 4 | Le champ uniforme était masqué seulement pour un intervalle local. La colonne Pause restait accessible dans le tableau et au clavier. Masquer ces saisies en EMOM. La pause entre les côtés conserve sa fonction. | A |
| Séries et récupération | 1–2 puis 3–4 | Récupération proposée par le même éditeur dans les quatre cas. En alternance et en fenêtre commune, retirer la récupération et hériter de N, tout en laissant choisir le régime. Seul et à la suite, N, intervalle et récupération restent modifiables. Dernier membre à la suite initialisé à 0 s. | B |
| Durée d’exercice | 1 à 4 | La ligne générique de durée restait dans le cadre Cadence. La remplacer par N × intervalle sous Intervalle, en lecture seule pour 1 à 3. L’omettre pour 4. | B |
| Fenêtre valide | 1 à 4 | Le récapitulatif contrôlait les durées rang par rang. La modale pouvait laisser passer un membre en répétitions si les autres saturaient la fenêtre. Le changement de durée depuis l’en-tête ne lisait que le premier rang. Vérifier chaque rang, égalité incluse, avec signalement et blocage. | A |
| Questionnaire et colonnes | 13, tous formats | Le tableau éditait déjà une seule cellule. Une option du domaine et un test demandaient encore la propagation de S1. Retirer cette option et tester l’indépendance des cibles et des charges. Les modèles prédéfinis et les données rouvertes conservent leur provenance. | A, décision du 06/11 |
| Entrée dans le porteur | 14 et 20 | Un EMOM entrant pouvait être pris pour un membre déjà adapté ; une cible commune à l’échec passait la conversion. Adopter les réglages du destinataire, reprendre la cible numérique commune ou laisser à renseigner, sans confirmation intermédiaire. Redimensionner les séries quand N change dans l’en-tête du porteur. | B pour la conversion, A pour la synchronisation de N |
| Sortie du porteur | 15 | Le choix libre existait. La conservation du format ne garantissait pas la remise à zéro de la récupération. En EMOM simple, reprendre la durée de tour et les prescriptions par série ; recalculer la durée affichée. | B |
| Circuits standards | 16 à 18 | Le groupé admettait le bloc entier. En alternance, N était adapté mais l’ancienne récupération pouvait subsister. À la sortie, conserver le format et son intervalle sans dialogue, remettre la récupération à zéro. | B |
| Modifier le format | 19 | L’édition par différence pouvait transporter des paramètres incompatibles vers la nouvelle structure. Appliquer les règles d’arrivée au changement d’organisation. | B |
| Carte et en-tête | 21–22 | Prescription seule couverte par D-515 et la PR #428. Le Circuit EMOM porteur possède déjà le compteur de tours, la nature groupée et la durée de tour bleue modifiable. | Règles existantes ; correction A du contrôle de durée ci-dessus |

## Contrôles effectués

- Inspection directe des trois écrans Figma et renouvellement des captures. L’écran alterné est référencé au chapitre 06 et dans la référence Formats §10.
- TypeScript vérifié sur la combinaison des changements EMOM et de la PR #428. 144 tests ciblés réussis dans 11 suites Jest, avec les branches de déplacement, l’édition, les quatre états de la modale, le récapitulatif, les cartes et l’en-tête.
- La suite CompositionScreen (437 tests) a réussi en série. Une première exécution en parallèle avait échoué sur le focus VoiceOver après déplacement d’une carte. Le cas isolé a également réussi sur la base PRE-9 et sur la combinaison des changements. La suite complète du dépôt et la recette physique iPhone n’ont pas été exécutées.
- Contrôle indépendant des annotations, du manifeste (taille et SHA-256 des trois PNG), des chemins locaux ajoutés et du diff. Aucun changement apporté au fichier Figma.

## Anciennes formulations conservées

Les lignes suivantes portent l’annotation de remplacement datée du 06/11/2026 concernant la copie d’une colonne à l’autre.

| Fichier | Lignes |
|---|---|
| `docs/INDEX.md` | 125 |
| `docs/KODJO-Composition-conteneurs-2026-10-28.md` | 149 |
| `docs/KODJO-Formats-entrainement-2026-11-02.md` | 318, 320, 499, 560, 567 |
| `docs/PRODUCT.md` | 602 |
| `docs/Specifications-fonctionnelles/06 – Ecrans et navigation de la V1.md` | 1684 |
| `docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md` | 1256 |
| `docs/Specifications-fonctionnelles/08 – Conception fonctionnelle détaillée.md` | 520, 918, 961 |
| `docs/Specifications-fonctionnelles/09 – Modèle de données fonctionnel.md` | 1535 |
| `docs/Specifications-fonctionnelles/10 – Processus métier et règles métier transverses.md` | 1336, 1571, 2726 |
| `docs/Specifications-fonctionnelles/12 – Architecture technique.md` | 1959 |
| `docs/Specifications-fonctionnelles/13 – Contrats d’écran.md` | 5907, 6061, 6091 |
| `docs/sources/formats-2026-11-05/KODJO-Complement-Parcours-creation-2026-11-05.md` | 130, 166, 226 |

Les annotations spécifiques à la modale dans la référence Formats se trouvent aux lignes 170, 536, 537, 541, 554. Elles conservent notamment « Récupération initiale 0 s » et « Comme pour un seul mouvement ».

## Fichiers modifiés

### Documentation et captures

- `.github/orchestration/reports/2026-11-07_EMOM_MODALE_CONVERSIONS.md`
- `docs/INDEX.md`
- `docs/KODJO-Composition-conteneurs-2026-10-28.md`
- `docs/KODJO-Formats-entrainement-2026-11-02.md`
- `docs/PRODUCT.md`
- `docs/Specifications-fonctionnelles/06 – Ecrans et navigation de la V1.md`
- `docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md`
- `docs/Specifications-fonctionnelles/08 – Conception fonctionnelle détaillée.md`
- `docs/Specifications-fonctionnelles/09 – Modèle de données fonctionnel.md`
- `docs/Specifications-fonctionnelles/10 – Processus métier et règles métier transverses.md`
- `docs/Specifications-fonctionnelles/12 – Architecture technique.md`
- `docs/Specifications-fonctionnelles/13 – Contrats d’écran.md`
- `docs/Specifications-fonctionnelles/images/figma-11856-24719.png`
- `docs/Specifications-fonctionnelles/images/figma-8598-30515.png`
- `docs/Specifications-fonctionnelles/images/figma-8795-14588.png`
- `docs/figma-formats-2026-11-02/captures.json`
- `docs/sources/formats-2026-11-05/KODJO-Complement-Parcours-creation-2026-11-05.md`

### Application et tests

- `src/domain/sessions/__tests__/carrierMembership.c4.test.ts`
- `src/domain/sessions/__tests__/configurationValidity.d4.test.ts`
- `src/domain/sessions/__tests__/formatModels.recette0411.test.ts`
- `src/domain/sessions/__tests__/formats.complement0511.test.ts`
- `src/domain/sessions/carrierMembership.ts`
- `src/domain/sessions/configurationValidity.ts`
- `src/domain/sessions/formatModels.ts`
- `src/domain/sessions/formatReedit.ts`
- `src/domain/sessions/layoutOperations.ts`
- `src/features/activities/ExecutionParametersSheet.tsx`
- `src/features/activities/FormatSettingsFrame.tsx`
- `src/features/activities/__tests__/ExecutionParametersSheet.format0711.test.tsx`
- `src/features/sessions/CarrierDurationSheet.tsx`
- `src/features/sessions/CompositionScreen.tsx`
- `src/features/sessions/FormatTables.tsx`
- `src/features/sessions/formatSheetContext.ts`
