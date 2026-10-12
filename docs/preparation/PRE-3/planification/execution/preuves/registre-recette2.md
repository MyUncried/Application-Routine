# PRE-3 (#340) — registre de la recette iPhone 2 de Hermann

## Repères

| Élément | Valeur |
|---|---|
| Source | `KODJO_PRE3_Recette2_Ecarts_et_Mission_Claude.md` (onglet « Recette 2 », remis le 12/10/2026) |
| Résultats déclarés | 78 entrées : 61 Conforme, 10 Écart, 2 Clarifier, 4 Non testé, 1 Non provoqué |
| Candidat testé | `0f86cddb262364030d324a79ef96b8cde03a9351`. OTA `01a12f22-927f-70a1-9060-17e3379ccc2d` (canal `review`) sur le build iOS 7, runtime 1.1.0. Chargement confirmé par Hermann ; preuves : `publication-ota-finale.json`, `verification-manifeste-ota-finale.json`. |
| Branche au départ | `feat/pre3-exercice-20261009` à `b1399804` (local = distant). Aucun travail actif, aucune PR, aucun run en cours. |
| Identifiants | T-54 « Position Bip » reste **Conforme** et n’est pas réaffecté. L’alignement de l’interrupteur est suivi sous **T-53**. |

**Qualifications utilisées**
- **DD** : défaut démontré.
- **DP** : défaut probable.
- **AJ** : ajustement de présentation explicitement demandé.
- **EXT** : surface hors PRE-3, extension proposée.
- **AR** : à reproduire.

## 1. Écarts déclarés

| Réf. | Observation (reformulée) | Reproduction / cause | Qualif. | Modification | Preuve | État |
|---|---|---|---|---|---|---|
| **T-10 / F-02** | Après un aller-retour de mode, les dernières valeurs ne reviennent pas. Désactiver puis réactiver les Séries variables « corrige ». | **Reproduite et cause démontrée.** Le répéteur du stepper était créé au **premier** appui et gardait les bornes et la valeur de départ de ce mode. Après un appui en Durée, une ligne vide en Répétitions démarrait à **« 30 rép. »** (durée recyclée), avec les bornes de la Durée. Désactiver puis réactiver l’interrupteur **démonte et recrée** les steppers du tableau, d’où le contournement observé. | DD | `ProfileStepper.tsx` (`InlineStepper`) : bornes et valeur de départ relues dans une ref tenue à jour à chaque rendu ; répéteur recréé si la politique change. | Test « F-02 — appui en Durée, puis en Répétitions… » : **rouge sur l’original** (« 30 rép. » au lieu de « 1 rép. »), vert après correction | Corrigé, à retester |
| **T-15** | La ligne suit le doigt mais ne se dépose jamais ; aucun repère ; le corps de la feuille bouge. | **Cause probable** (iOS) : le défilement natif de la feuille prend le geste et déplace le corps, puis interrompt le responder ; l’interruption annule le dépôt. Les deux symptômes ont une cause commune. | DP + AJ (repère) | Corps de la feuille non défilant pendant le glisser (`scrollEnabled`). Repère d’insertion : trait bleu Kodjo de 2, hauteur nulle dans le flux, masqué à VoiceOver. **D-345.** | Tests T-15 : défilement bloqué puis rétabli ; un seul repère, avant la Série 4 ; dépôt à la position visée ; interruption sans effet. **Rouges sur l’original.** | Corrigé, à retester. Défilement automatique aux bords non ajouté (tableau de 99 lignes possible) : à évaluer selon le retest. |
| **T-49** (éditeur) | Courbure et dégradé visibles. Retirer la barre du haut, les deux liserés gris du bas et le contour blanc du champ Nom. | Barre du haut : `HeaderSeparator` sous l’en-tête. Contour du Nom : `borderWidth 1` (`sessionNameBorder` #FFFFFF). Liserés du bas : **cause probable** = interstices entre les 12 bandes juxtaposées du fondu. | AJ (barre, contour) + DP (liserés) | Séparateur retiré (Créer et Modifier). Contour du Nom retiré. Fondu en **couches superposées** jusqu’au bas, sans interstice (même rampe). **D-348.** | Tests T-49 et `ExerciseScreen` (aucun séparateur, aucun contour, couches absolues jusqu’au bas) | Corrigé, à retester. Si des liserés persistent, une capture est nécessaire. |
| **T-49** (Catalogue, Composition) | Catalogue : liserés de la zone de contexte. Composition : courbure, dégradé, liserés, contour du champ de nom. | Surfaces PRE-2 et PRE-4 hors PRE-3 (`ScreenShell.ContextBand`, `CatalogueScreen.tsx`, `CompositionScreen.tsx`). | EXT | Aucune. **Proposition EXT-R2-A** (§2). | — | En attente d’extension et d’une précision : quel champ de nom en Composition ? |
| **T-53** | L’interrupteur Séries variables n’est pas centré verticalement avec son libellé ni entre ses séparateurs. | **Non reproduit par analyse.** Géométrie figée (6407-9805, 6665-27458) : ligne de 42, libellé y 12,5, interrupteur y 7 h 28, séparateurs avant et après. Le code reproduit cette structure : séparateur, ligne `alignItems: center` de hauteur minimale 42, séparateur. La mesure native de l’interrupteur (`RCTSwitchSize`, taille intrinsèque iOS) est correcte. | AR | Aucune modification à l’aveugle. | — | **Capture et version d’iOS demandées** |
| **T-58** | Annuler : capsule plus grande, sans liseré, blanc « transparent à 90 % », demi-cercles, marges droite/haut/bas égales. | Présentation. Ambiguïté sur l’opacité : un fond blanc à 90 % d’opacité rendrait le texte blanc illisible ; la lecture « transparent à 90 % » (opacité 10 %) est la seule compatible. | AJ | Capsule sans contour, `borderRadius` 999, `minHeight` 36, fond `snackbarActionSurface` `rgba(255,255,255,0.1)` (ch. 12). Message en `alignItems: stretch` avec marges droite, haute et basse égales (8). Comportement D-5 inchangé. **D-346.** | Test D-5 mis à jour (capsule, marges égales, Annuler restaure, toucher ferme sans annuler) | Corrigé, à retester. **Opacité à confirmer.** |
| **N-01** | Catégorie : supprimer Annuler dans le formulaire ; réduire l’espace entre la barre de couleurs et le clavier. | Effet vérifié : Annuler fermait **seulement** le formulaire, la feuille restant ouverte. ✕ ferme la feuille entière, en gardant la Catégorie précédente (D-343). | AJ | Bouton retiré. Clavier ouvert : marge basse du contenu 24 → 8, marge de la feuille 24 → 0. **D-347.** | Tests N-01 (absence d’Annuler, espace réduit puis rétabli) | Corrigé, à retester |
| **N-02** | Zones : idem, espace entre le champ et le clavier. | Même effet : Annuler fermait le formulaire seul ; ✕ ferme la feuille en restaurant la sélection antérieure. | AJ | Idem. **D-347.** | Tests N-02 | Corrigé, à retester |
| **N-03** | Étiquette : feuilles à aligner sur le modèle Catégorie. | Surface PRE-2 (Composition), exclue de PRE-3 (« Pas de refonte d’Étiquette »). Le comportement Catégorie (D-343) ne se transfère pas implicitement. | EXT | Aucune. **Proposition EXT-R2-B** (§2). | — | En attente de décision de portée |
| **N-04** | Menu d’appui long (Catégorie, Étiquette, Zones) : ✕ rond en haut à gauche ; Modifier puis Supprimer alignés, fonds bleu Kodjo et rouge, texte blanc. | Composant **maison partagé** `ReferenceValueDialog.tsx` (pas un menu natif), utilisé par les trois sélecteurs. Hors du périmètre d’écriture. Aucune défaillance métier rapportée. | EXT | Aucune. **Proposition EXT-R2-C** (§2). | — | En attente d’extension |
| **N-05** | Description : Terminer remonte avec le clavier ; le champ ne se replace pas au-dessus du clavier. | Terminer était **dans** le `KeyboardAvoidingView`, donc soulevé avec le clavier. Aucun recadrage de la Description. | DD | Terminer sorti de la zone qui évite le clavier. Pendant la saisie, la Description est recadrée juste au-dessus du clavier (au focus, à l’apparition du clavier, à chaque changement de taille) ; hauteur bornée à la zone visible, pour que la vue de texte iOS garde le curseur visible ; bornage retiré à la fermeture. **D-349** (exception au chapitre 06 l.184). | Test N-05 : Terminer hors de la zone, défilement calculé (257, puis 317 après croissance), bornage puis retour. **Rouge sur l’original.** | Corrigé, à retester |

## 2. Extensions proposées (non réalisées)

| # | Objet | Exigence ou demande | Fichiers | Modification minimale | Consommateurs | Tests |
|---|---|---|---|---|---|---|
| EXT-R2-A | T-49, Catalogue et Composition | Demande explicite de Hermann (recette 2). Composition : maquettes PRE-2/PRE-4, hors PRE-3. | `src/shared/ui/ScreenShell.tsx` (`ContextBand`, `HeaderSeparator`), `src/features/sessions/CatalogueScreen.tsx`, `CompositionScreen.tsx` et leurs tests | Retirer les liserés de la zone de contexte (Catalogue, Composition) ; Composition : halo et fondu selon le modèle de l’éditeur ; retirer le contour du champ de nom **identifié** | Tous les écrans à `ContextBand`/`HeaderSeparator` (Catalogue, Composition, Calendrier, Suivi, Profil selon usage) | Suites Catalogue et Composition ; géométrie inchangée hors liserés |
| EXT-R2-B | N-03, Étiquette | Demande explicite ; la surface est exclue de PRE-3 | `src/features/reference-data/LabelPickerModal.tsx` et son test ; consommateur `CompositionScreen.tsx` | Feuille pleine largeur, en-tête ✕/✓ et séparateur, champ avec ↑, barre de couleurs (12 couleurs), suppression de Fermer/Annuler/Ajouter, évitement du clavier (défaut F-03 déjà constaté). **Règle de sélection à décider** : confirmation explicite comme la Catégorie (D-343), ou choix au toucher (D-222) avec ✓ décoratif ? | Composition (Étiquette de Séance) | Suite `LabelPickerModal`, intégrations Composition |
| EXT-R2-C | N-04, menu d’appui long | Demande explicite | `src/features/reference-data/ReferenceValueDialog.tsx` et son test | ✕ rond en haut à gauche (même rendu que les feuilles) ; Modifier puis Supprimer alignés, fond `primary` et fond `danger`, texte blanc ; annulation et confirmation de suppression conservées | Catégorie, Zones (PRE-3), Étiquette (PRE-2) | Suite `ReferenceValueDialog` ; sélecteurs Catégorie et Zones ; `LabelPickerModal` |

## 3. Précisions demandées

1. **T-58** : « blanc transparent à 90 % » = opacité 10 % (réalisé, texte blanc lisible) ou opacité 90 % (texte blanc illisible, exigerait un texte foncé) ?
2. **T-49, Composition** : quel champ de nom porte le contour blanc, celui de la séance ou celui d’un exercice ouvert depuis la Composition ? (Utile seulement si EXT-R2-A est approuvée.)
3. **T-53** : une capture de la ligne Séries variables et la **version d’iOS** de l’iPhone de recette.
4. **N-03** : règle de sélection de l’Étiquette, si EXT-R2-B est approuvée.

## 4. Non concluants et réserves anciennes

- **T-04, T-17** (Clarifier), **T-42** (Non provoqué), **T-62 à T-65** (Non testé) : statuts conservés. T-04 et T-17 sont repris dans la procédure ; T-62 se vérifie sans VoiceOver.
- **T-09, T-19, T-25, T-34, T-35, T-39, T-43, T-55, T-59** : Conforme conservé ; les commentaires anciens ne sont pas rouverts. Aucune de ces réserves ne change une correction de cette étape.

## 5. Décisions préservées

D-1 à D-9, enregistrées D-336 à D-344, sont inchangées. D-340 (Annuler) est seulement précisée en présentation par D-346.
