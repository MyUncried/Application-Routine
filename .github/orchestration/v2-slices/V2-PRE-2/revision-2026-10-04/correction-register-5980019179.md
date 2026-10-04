# Registre de correction — revue 5980019179 (run 37202181321)

- **Revue corrigée :** commentaire `5980019179`, verdict REVISE, 5 constats bloquants. Constats épinglés : `prior-findings-5980019179.json`, dans l'ordre 1..5.
- **Plan corrigé :** `technical-plan.md` (même répertoire). Il remplace le candidat publié `5979912654`.
- **Méthode :** correction locale, sans nouvelle génération du plan. La sortie structurée du plan approuvé est complétée par les seuls points ci-dessous. Le plan est réassemblé par les décodeurs et vérificateurs réels de `kodjo-v2-slice-plan.yml`.
- **Sources vérifiées :** à `8260bcaa`. Les entrées produit protégées y sont identiques octet pour octet à celles de `7a51179f`.

## 1. REQ-F907047106F88386 — exigence Profil (C08)

| Rubrique | Contenu |
|---|---|
| Observation | Locator « Profil L1076–1101 ». La plage tronque L1102–L1103. L1103 n'est portée par aucune assertion, et L1098 est absente du texte de l'exigence. |
| Exigence (source vérifiée) | C08 L1103 : « Retour \| Quitter l'écran ne demande aucune confirmation, les modifications étant enregistrées automatiquement. » C08 L1098 : « Langue du MVP \| … Tous les textes utilisateur, pluriels, variables, formats locaux, notifications et libellés d'accessibilité utilisent des clés de traduction centralisées … ». C13 CE-UI-07 L2556 : « Persistance immédiate de préférence, atomique par modification ; pas de bouton Enregistrer global. » |
| Qualification | Omission confirmée. Correction bornée au texte de l'exigence et à une assertion ; aucune décision métier. |
| Correction | Locator porté à « Profil L1076–1103 ». Texte complété : quitter l'écran Profil ne demande aucune confirmation (L1103) ; tous les textes utilisateur et libellés d'accessibilité livrés utilisent les clés de traduction centralisées (L1098). `change_targets` complétés par `src/features/preferences/ProfileScreen.tsx` et `src/shared/i18n/resources/fr.ts`. `tests` complétés par `src/features/preferences/__tests__/ProfileScreen.test.tsx` et `src/shared/i18n/index.test.ts`. Nouvelle assertion INTERACTION sur UI-82B1544AE5AE (`UI-82B1544AE5AE-A3B2D83AEBA4C`, « CE-UI-07 L2556 ; C08 L1103 ») : quitter le Profil ne déclenche ni dialogue ni garde de sortie. |
| Changement d'identifiant | L'identifiant de l'exigence dérive de son contenu : `REQ-F907047106F88386` devient **`REQ-B01623D27FF0E00D`**. |
| Preuve | `verify-plan-contract-consistency` : périmètre 95, tests 41, inchangés (chemins déjà au périmètre). `verify-ui-plan-criteria` : 73 assertions. |

## 2. UI-5F3D94866D30 — liste des Catégories (CE-UI-09 §10)

| Rubrique | Contenu |
|---|---|
| Observation | Aucune assertion RESPONSIVE sur la liste des Catégories. `CategoryPickerModal.tsx` n'a pas de liste défilante. |
| Exigence (source vérifiée) | C13 CE-UI-09 L2808 : « Liste scrollable, clavier et actions visibles ; nom long accessible ; textes agrandis sans réduction ; focus confiné à la modale ouverte. » |
| Qualification | Omission confirmée. Le focus confiné est déjà asserté ; la carte et la palette sont déjà assertées (R4). |
| Correction | Nouvelle assertion RESPONSIVE `UI-5F3D94866D30-A4BEE35F8C506` (« CE-UI-09 L2808 », preuves FUNCTIONAL_TEST + VISUAL_COMPARE) : la liste défile quel que soit le nombre d'entrées, toutes restent atteignables ; un nom long reste accessible sans troncature ; le texte agrandi ne réduit pas la police, clavier affiché ou masqué. |
| Preuve | Assertion liée aux cibles et tests déjà déclarés du critère (`CategoryPickerModal.tsx`, `CategoryPickerModal.test.tsx`). |

## 3. UI-5F3D94866D30 — chaînes de suppression partagées (§4.10 L134–L135)

| Rubrique | Contenu |
|---|---|
| Observation | Les assertions A7819D6C3521A (titre exact) et A14AB0BC67228 (messages selon l'usage) figent des chaînes portées par `src/shared/i18n/resources/fr.ts`. Ce fichier et `src/shared/i18n/index.test.ts` ne sont liés à aucun critère des référentiels. |
| Exigence (source vérifiée) | C13 §4.10 L134 : « titre dynamique : `Supprimer « {nom} » ?` » ; L135 : message dynamique selon l'usage. C08 L1098 : clés de traduction centralisées. |
| Qualification | Défaut de traçabilité confirmé. Les deux chemins sont déjà au périmètre ; aucune extension. |
| Correction | `src/shared/i18n/resources/fr.ts` ajouté aux `change_targets` et `src/shared/i18n/index.test.ts` aux `tests` des critères UI-5F3D94866D30 (Catégorie), UI-3D89E598F31D (Zones) et UI-60B2C84BF572 (Étiquette). La partie L1098 est portée par la correction 1. |
| Preuve | Diff structurel r2 → r3 : seuls ces deux chemins sont ajoutés à ces trois critères. |

## 4. UI-96E7FD739BF0 — Modifier le profil (CE-UI-01 §10)

| Rubrique | Contenu |
|---|---|
| Observation | Aucune assertion RESPONSIVE. `ProfileEditScreen.tsx` n'a ni défilement, ni évitement du clavier, ni Safe Area. |
| Exigence (source vérifiée) | C13 CE-UI-01 L2004 : « Références 360/402/440, Safe Areas existantes ; texte agrandi sans réduction de police, scroll utile et contrôles accessibles. » |
| Qualification | Omission confirmée, de même nature que R1 sur le Profil. |
| Correction | Nouvelle assertion RESPONSIVE `UI-96E7FD739BF0-A202F52482AC0` (« CE-UI-01 L2004 », FUNCTIONAL_TEST + VISUAL_COMPARE) : Modifier le profil défile dans les Safe Areas ; photo, Nom d'affichage, deux silhouettes et Enregistrer restent atteignables et utilisables, clavier affiché ou masqué, en texte agrandi sans réduction de police. |
| Preuve | Assertion liée aux cibles et tests déjà déclarés (`ProfileEditScreen.tsx`, `ProfileEditScreen.test.tsx`). |

## 5. UI-60B2C84BF572 — feuille d'Étiquettes (CE-T03-16 §10)

| Rubrique | Contenu |
|---|---|
| Observation | Seule la partie clavier et actions est assertée (palette, R4). La zone sûre, la liste défilante, le titre non tronqué et le texte agrandi ne le sont pas. `LabelPickerModal.tsx` n'a pas de liste défilante. |
| Exigence (source vérifiée) | C13 CE-T03-16 L1645 : « Feuille limitée à la zone sûre, liste défilante, titre non tronqué ; clavier fait apparaître le nom saisi et les actions ; texte agrandi selon §4.2. » |
| Qualification | Omission confirmée. |
| Correction | Nouvelle assertion RESPONSIVE `UI-60B2C84BF572-AEC754D3ABC2D` (« CE-T03-16 L1645 », FUNCTIONAL_TEST + VISUAL_COMPARE) : feuille limitée à la zone sûre ; liste défilante quel que soit le nombre d'Étiquettes ; titre non tronqué ; texte agrandi sans réduction de police. |
| Preuve | Assertion liée aux cibles et tests déjà déclarés (`LabelPickerModal.tsx`, `LabelPickerModal.test.tsx`). |

## Conséquences directes vérifiées et acquis conservés

- **Diff structurel r2 → r3** (`5979912654` → ce candidat) :
  - 69 assertions conservées à l'identique (mêmes identifiants), 4 ajoutées, 0 retirée ;
  - 6 critères conservés ; seuls `change_targets` et `tests` de 3 critères reçoivent les deux chemins i18n ;
  - une seule exigence modifiée (correction 1) ;
  - narration (hors blocs structurés) : quatre changements au §0 bis, détaillés ci-dessous.
- **Défaut de narration du candidat r2, corrigé ici.** Le générateur local de la narration (`make-markdown.js`) était en erreur de syntaxe depuis la correction r2 (backticks non échappés). L'assemblage, qui enchaînait les générateurs par `&&` sans arrêt sous `set -e`, a réutilisé la narration du candidat précédent. Effets :
  - les blocs structurés de `5979912654` étaient complets (69 assertions, exigences corrigées) ;
  - le §0 bis en prose n'en portait pas la trace : ligne R4 « Zones inchangées », ligne R6 limitée à l'éditeur, paragraphe des 7 corrections absent.
  - Correction : le générateur a été corrigé et l'assemblage rendu strict (une commande par ligne).
  - Les quatre changements de narration r2 → r3 : ligne R4 (modale Zones défilante, carte évitant le clavier), ligne R6 (Composition incluse), paragraphe des corrections de la revue 37198105017 et paragraphe des corrections de la présente revue. Ils alignent la prose sur les blocs structurés et n'ajoutent aucune règle.
- **Contrôles déterministes :**
  - périmètre 95 et tests 41, inchangés ; impact vérifié `558c1cae…`, inchangé ;
  - analyse à `10ac761e` ; `APPROVED_BASE_NEW_CYCLE`.
- **Corrections des revues antérieures conservées :**
  - les 7 constats de la revue `5979898944` (Zones, erreurs, nom, ordre, en-têtes) ;
  - les décisions D-265 à D-267 et les écarts de recette R1, R4, R5, R6, R7a, R9, R10.
- **Hors correction :** aucune règle nouvelle, aucune décision métier, aucune extension de périmètre.
