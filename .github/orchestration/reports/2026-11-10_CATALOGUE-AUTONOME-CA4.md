# 2026-11-10 — CATALOGUE-AUTONOME — CA-4 : écran de recette « Charger un catalogue »

## Identifiant et objectif

- **CATALOGUE-AUTONOME, tranche CA-4** : écran de recette « Charger un catalogue », qui remplace « Importer 60 fiches ». Il s'appuie sur les états, les décisions et les services de CA-3.
- Autorisation de Hermann (10/11), verbatim : « tu peux passer à CA-4 ».
- Cadre (validation CA-3, 10/11) :
  - fiche par fiche ;
  - résumé systématique avant acceptation, même sans conflit ;
  - comparaison détaillée champ par champ à la demande, conflits identifiés ;
  - aucun écrasement, refus ni remplacement automatique ;
  - aucune fusion automatique ;
  - OVH inchangé ;
  - pas de modification de PRE-10, pas de build, pas d'OTA, pas de fusion dans `main`.

## Branche et commit de départ

- `catalogue/integration-60-main-20261109`, worktree `C:/Dev/KODJO-CAT60-MAIN`.
- Départ : `7cf6758e` (CA-3).

## Périmètre

- **Traité** :
  - écran ;
  - commande et route ;
  - présentation (libellés, résumé, valeurs) ;
  - lecture fraîche raccordée au repository de l'application ;
  - remplacement de la commande dans le Catalogue des Mouvements ;
  - tests ;
  - spécification.
- **Non traité** :
  - CA-5 : retrait du corpus embarqué et de l'ancienne commande `PilotMovementImportCommand`, conservée mais plus affichée ;
  - CA-6 : recette iPhone ;
  - administration Web OVH.

## Réalisation

| Fichier | Rôle |
|---|---|
| `src/features/catalogue/CatalogueLoadScreen.tsx` | Écran : choix du fichier, liste par état, fiche (résumé, comparaison, conflits), décisions, rattachement groupé des fiches identiques |
| `src/features/catalogue/catalogueLoadPresentation.ts` | Libellés des états et des champs, résumé systématique, valeurs lisibles (référentiels nommés, étapes numérotées), signalements du fichier |
| `src/features/catalogue/CatalogueLoadCommand.tsx` | Bouton « Charger un catalogue (test local) », affiché avec le même indicateur de build que l'ancien bouton (`EXPO_PUBLIC_KODJO_CATALOGUE_IMPORT=1`) |
| `src/features/catalogue/pickCatalogueFile.ts` | Sélecteur de documents chargé à l'appel (même motif que l'import pilote), limite de 24 Mo |
| `app/catalogue-load.tsx` | Route `routine://catalogue-load` ; « indisponible » hors variante de recette. `app/_layout.tsx` n'est **pas** modifié (fichier touché par PRE-10) |
| `src/features/sessions/CatalogueScreen.tsx` | Deux lignes : import et rendu de la nouvelle commande à la place de l'ancienne. Les blocs modifiés par PRE-10 ne sont pas touchés |
| `src/infrastructure/database/repositories/SqliteMovementRepository.ts` | Ajout de `readFresh` : lecture dans une transaction, même motif que la relecture de `create` (PR #436) |
| `src/features/activities/ActivityDefinitionService.ts` | Ajout de l'accesseur `freshMovementReader` sur le **même** repository : aucune seconde composition SQLite, `SessionServiceProvider` inchangé (fichier touché par PRE-10) |
| `src/features/catalogue/readLocalMovements.ts` | Utilise désormais `readFresh` (application et tests passent par le même chemin) |

### Réemploi et primitives natives

- **Choix d'un conflit** : `Picker` segmenté natif SwiftUI (`@expo/ui/swift-ui`, `pickerStyle("segmented")`), déjà employé par les roulettes. Il n'a **aucune valeur par défaut**. Hors iOS seulement, deux boutons le remplacent.
- **Confirmations et comptes rendus** : `Alert` natif, comme l'ancien outil d'import.
- **Liste et fiche** : composants React Native standard, couleurs des jetons existants (`colors`).
- **Retour sur le Catalogue** : la liste des Mouvements est relue au retour sur l'écran (mécanisme existant).

### Choix d'ergonomie à valider

**Rattachement groupé des fiches « déjà présentes, identiques »** (bouton « Rattacher les N fiches identiques », après confirmation).
- Ces fiches ne modifient aucun Mouvement : le résumé l'indique et la confirmation le rappelle. Seul l'historique d'installation est enregistré.
- Sans ce bouton, la recette CA-6 exigerait 60 ouvertures et acceptations successives.
- Toute fiche qui modifierait un Mouvement (nouvelle, nouvelle révision, à rapprocher) reste acceptée **fiche par fiche**, après son résumé.
- Si tu préfères l'acceptation individuelle même pour ces fiches, le bouton se retire sans autre changement.

## Preuves et tests

| Commande | Résultat |
|---|---|
| `npx jest src/features/catalogue/__tests__/CatalogueLoadScreen.test.tsx` | PASS, 8 tests (écran sur vraies bases SQLite, principale + registre) |
| `npx jest src/features/catalogue/__tests__/CatalogueLoadCommand.test.tsx` | PASS, 1 test |
| Catalogue (CA-1 à CA-4), importeur actuel, commande pilote, Catalogue, `ActivityDefinitionService`, repository Mouvement, migrations, schéma, routes `app/` (33 suites) | PASS, 364 tests |
| Suite Jest complète | voir le compte rendu de session (exécution longue) |
| `npx tsc --noEmit` ; `npx eslint` (fichiers modifiés) | OK |

Scénarios d'écran :
1. **Sélection annulée** : rien n'est lu ni écrit.
2. **Fichier invalide** : refusé en entier, problèmes affichés, aucune écriture.
3. **Pilote sur la base des 60** :
   - « Déjà présente, identique (60) » et « Propriétaire inconnu (61) : chargement privé possible, aucune publication » ;
   - rattachement groupé confirmé → 60 rattachées, « À jour (60) » ;
   - base principale identique (toutes les tables).
4. **Nouvelle révision** :
   - résumé : « Révision 1 → 2. », « 2 champ(s) différent(s) : contenu 1, sources 1. », « Le mouvement sera modifié : Étapes. » ;
   - comparaison masquée par défaut, puis affichée à la demande, source documentaire comprise ;
   - confirmation reprenant le résumé → révision acceptée, étape ajoutée au Mouvement.
5. **Conflit, « Garder ma valeur »** :
   - le conflit est visible sans le demander, avec la valeur du téléphone et la nouvelle valeur ;
   - le sélecteur natif n'a aucune sélection et « Accepter » est inactif ;
   - après le choix « Garder ma valeur » → acceptation, base principale identique.
6. **Conflit, « Prendre la nouvelle »** : Mouvement mis à jour, valeur locale sauvegardée au registre.
7. **Reporter puis refuser** : la fiche est reproposée avec la marque « reportée », puis classée « Révision refusée (1) » ; base principale identique.
8. **Fiche créée dans le fichier** : résumé « Nouvelle fiche… » → confirmation → installée.

## Hypothèses non démontrées

- Les éléments suivants restent à constater sur iPhone (CA-6), comme le prévoit la règle des primitives natives :
  - rendu et toucher réels du sélecteur segmenté natif, que Jest ne fait que simuler ;
  - sélecteur de documents ;
  - lisibilité de l'écran ;
  - comportement d'expo-sqlite réel sur deux bases.
- Une suite Jest verte ne vaut pas validation sur iPhone.

## Synchronisation code / documentation

- **Classe B** (décisions de Hermann du 10/11) :
  - `docs/KODJO-Format-catalogue-mouvements-v1.md`, nouveau § 9.5 « Écran de recette » ;
  - plan, révision 2, § 6 : CA-4 annoté comme développé.
- **Classe C**, signalée : le rattachement groupé des fiches identiques est un choix d'ergonomie de recette, soumis à validation, sans règle métier créée.
- Figma n'est pas modifié : outil de recette hors MVP, sans référence Figma, comme l'outil qu'il remplace.

## Hors périmètre / non corrigé

- CA-5 : `PilotMovementImportCommand`, `pilotMovementImport.ts` et le corpus embarqué restent dans le code, mais ne sont plus affichés.
- CA-6.
- Administration Web OVH.
- PR #436 : en attente de la validation de la build `6987d086` sur iPhone.

## Vérifications restant à faire sur appareil réel (CA-6, build de recette à autoriser)

1. Fichier pilote sur la base contenant les 60 Mouvements → 60 « Déjà présente, identique », rattachement → aucun Mouvement modifié.
2. Rechargement → 60 « À jour ».
3. Fichier édité :
   - une fiche créée dans le fichier → installée ;
   - une fiche révisée → résumé, comparaison détaillée, puis reporter / refuser / accepter ;
   - une modification personnelle préservée, et un conflit tranché par le sélecteur natif.
4. Interruption réelle (fermeture de l'application pendant un chargement), puis réouverture → reprise annoncée, sans doublon.

## Fichiers modifiés

- `app/catalogue-load.tsx` (nouveau)
- `src/features/catalogue/CatalogueLoadScreen.tsx` (nouveau)
- `src/features/catalogue/CatalogueLoadCommand.tsx` (nouveau)
- `src/features/catalogue/catalogueLoadPresentation.ts` (nouveau)
- `src/features/catalogue/pickCatalogueFile.ts` (nouveau)
- `src/features/catalogue/readLocalMovements.ts`
- `src/features/catalogue/__tests__/CatalogueLoadScreen.test.tsx` (nouveau)
- `src/features/catalogue/__tests__/CatalogueLoadCommand.test.tsx` (nouveau)
- `src/features/catalogue/__tests__/CatalogueLoadService.sqlite.test.ts`
- `src/features/sessions/CatalogueScreen.tsx`
- `src/features/activities/ActivityDefinitionService.ts`
- `src/infrastructure/database/repositories/SqliteMovementRepository.ts`
- `docs/KODJO-Format-catalogue-mouvements-v1.md`
- `.github/orchestration/reports/2026-11-10_CATALOGUE-AUTONOME-PLAN.md`
- `.github/orchestration/reports/2026-11-10_CATALOGUE-AUTONOME-CA4.md`

## Commit final et état Git

Commit de livraison de CA-4 contenant ce rapport, poussé sur `catalogue/integration-60-main-20261109` ; hash, CI et résultat de la suite complète communiqués dans le compte rendu de session. Aucune modification de PRE-10, aucune build, aucune OTA, aucune fusion dans `main`.
