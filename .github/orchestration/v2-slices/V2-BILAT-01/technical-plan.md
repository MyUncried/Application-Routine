[KODJO_V2] PLAN_OUTPUT
slice_id=V2-BILAT-01
bootstrap_path=.github/orchestration/v2-slices/V2-BILAT-01/slice-bootstrap.json
source_head=4c72abe2cb7f72f3629092f7e3da8220a9e305dc
protocol_execution_head=4c72abe2cb7f72f3629092f7e3da8220a9e305dc
application_pr=142
application_head=3a0dbbe7510f69f702c4b440e25b63b893d2d492
supersedes_plan_blob_oid=20ae36edc25e5979922b7d183b79ff752bac849b
prior_review_blob_oid=cd5a8a7066db0d2fd6ed34ef47f54a443efc0c04
planning_contract=kodjo.plan-impact.v1
STATUT : PLAN_READY_FOR_INDEPENDENT_REVIEW

# Plan technique final — KODJO V2 — BILAT-01

## 1. Identité et statut

- Tranche : `V2-BILAT-01`
- Mode : `PLAN_ONLY`
- Implémentation autorisée : **NON**
- Objet : correction strictement visuelle de l’indicateur de direction des cartes d’Activité.
- La transition entre la source et l’exécution est protocol-only.
- Le scan déterministe fourni confirme le périmètre des importations directes.
- Aucun manifeste V1 n’est créé, consulté ou réutilisé.
- Aucun calcul, modèle, service, repository, migration, persistance, route, synthèse ou comportement T03 n’est réouvert.

## 2. Décision produit opposable

La décision utilisateur `5678061573` supersède explicitement, pour cette correction limitée, les coordonnées historiques de `BIL-065`.

L’indicateur :

- conserve une géométrie de `42 × 20 pt` ;
- affiche uniquement `D→G` ou `G→D` ;
- reste hors flux et positionné en absolu ;
- utilise la marge intérieure droite déjà validée de la carte ;
- aligne son centre vertical sur le centre vertical du titre de l’Activité ;
- applique cette règle aux cartes de `60 pt`, `44 pt` et à l’état soulevé ;
- reste non interactif ;
- conserve son libellé accessible développé.

Les règles suivantes restent inchangées :

- `BIL-061` : contrôle du Tour, `42 × 34 pt`, espace `8 pt` et alignement ;
- `BIL-062` : absence de titre du Tour, tiret, directions et accessibilité ;
- absence d’indicateur propre sous un Tour bilatéral ;
- absence d’indicateur propre pour une Activité `UNILATERAL` ;
- absence de texte directionnel développé dans le contenu de la carte.

Aucun texte de synthèse, calcul, stockage ou comportement T03 ne change.

## 3. Décision de portée issue du scan

Le scan direct-import déterministe ne présente qu’un consommateur de production candidat. Ce consommateur est déclaré inchangé : son contrat, ses propriétés, sa navigation et son flux de données ne sont pas affectés par une correction locale de rendu.

<KODJO_PLAN_IMPACT_JSON>
{
  "schema": "kodjo.plan-impact.v1",
  "scan_revision": "3a0dbbe7510f69f702c4b440e25b63b893d2d492",
  "modified_modules": [
    {
      "path": "src/features/sessions/CompositionScreen.tsx",
      "change": "MODIFY"
    },
    {
      "path": "src/features/sessions/__tests__/CompositionScreen.test.tsx",
      "change": "MODIFY"
    }
  ],
  "scan_sha256": "90b35c3018600bfcb294685fb4ad404029e71a1caa0ad359e00b248825d16998",
  "rows": [
    {
      "path": "src/features/sessions/CompositionScreen.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "src/features/sessions/__tests__/CompositionScreen.test.tsx",
      "candidate_kind": "MODIFIED_MODULE",
      "triggered_by": [],
      "risk_score": 0,
      "classification": "MODIFY",
      "justification": "Module declare CREATE ou MODIFY dans le plan."
    },
    {
      "path": "app/(creation)/composition.tsx",
      "candidate_kind": "CONSUMER",
      "triggered_by": [
        "src/features/sessions/CompositionScreen.tsx"
      ],
      "risk_score": 0,
      "classification": "CONSUMER_UNAFFECTED",
      "justification": "Le scan direct-import identifie ce fichier comme consommateur de CompositionScreen, tandis que la correction reste confinée au rendu de l’écran et à ses tests ; son contrat, ses propriétés, sa navigation et son flux de données ne changent pas."
    }
  ],
  "scope_allow": [
    "src/features/sessions/CompositionScreen.tsx",
    "src/features/sessions/__tests__/CompositionScreen.test.tsx"
  ]
}
</KODJO_PLAN_IMPACT_JSON>

Aucun élargissement de portée n’est requis par le scan. Les modules concernés par l’implémentation restent :

- `src/features/sessions/CompositionScreen.tsx`
- `src/features/sessions/__tests__/CompositionScreen.test.tsx`

Aucun nouveau fichier ne sera créé.

## 4. Constat technique

### `src/features/sessions/CompositionScreen.tsx`

Le composant possède déjà :

- la direction propre ou héritée de l’Activité ;
- l’absence d’indicateur sous un Tour bilatéral ;
- l’absence d’indicateur en `UNILATERAL` ;
- les libellés courts `D→G` et `G→D` ;
- le libellé accessible développé ;
- la géométrie `42 × 20 pt` ;
- un positionnement absolu historique.

L’écart est exclusivement visuel :

- le positionnement horizontal historique laisse environ `1 pt` de marge dans la carte de référence ;
- le positionnement vertical historique est centré sur une ancienne carte de référence de `354 × 69 pt` ;
- les cartes réellement rendues peuvent mesurer `60 pt`, `44 pt` ou utiliser une hauteur spécifique à l’état soulevé ;
- dans la variante compacte, le positionnement historique peut provoquer un rognage avec le débordement masqué.

Le positionnement absolu doit être conservé. Un retour en flux réduirait la largeur disponible pour le nom, les Zones corporelles et la synthèse.

### `src/features/sessions/__tests__/CompositionScreen.test.tsx`

Les tests couvrent déjà une partie du comportement fonctionnel. Ils doivent être complétés pour établir la correction visuelle sans supprimer ni réécrire les garanties existantes :

- présence de l’indicateur propre ;
- absence en `UNILATERAL` ;
- absence sous héritage du Tour ;
- libellé accessible développé ;
- dimensions ;
- non-interactivité ;
- marge droite ;
- alignement vertical avec le titre ;
- cartes de hauteur `60 pt`, `44 pt` et état soulevé ;
- absence de rognage dans la variante compacte.

Les scénarios de confirmation du Tour, d’atomicité, d’annulation et de remise des enfants restent inchangés et doivent continuer à passer.

## 5. Portée fonctionnelle

### Correction directe

- `BIL-065` : positionnement visuel, marge droite, alignement vertical, lisibilité et accessibilité de l’indicateur propre de carte.

### Préservé et retesté

- `BIL-002` : états courts `D→G` et `G→D`.
- `BIL-003` : libellé accessible développé.
- `BIL-026` à `BIL-031` : confirmation, remise des enfants, désactivation et absence de restauration.
- `BIL-058` : contrôles UI et validations.
- `BIL-061` : contrôle du Tour, `42 × 34 pt`, espace `8 pt` et alignement inchangés.
- `BIL-062` : absence de titre du Tour, tiret, directions et accessibilité inchangés.

### Préservé sans modification applicative

- `BIL-001`
- `BIL-004` à `BIL-009`
- `BIL-011` à `BIL-020`
- `BIL-023` à `BIL-025`
- `BIL-028`
- `BIL-032`
- `BIL-053`, `BIL-054`
- `BIL-057`
- `BIL-063`, `BIL-064`
- `BIL-066` à `BIL-068`

### Différé

- `BIL-010`, `BIL-021`, `BIL-022`
- `BIL-033`
- `BIL-034` à `BIL-048`
- `BIL-049` à `BIL-052`
- `BIL-055`, `BIL-056`
- `BIL-059`, `BIL-060`

Ces exigences concernent respectivement l’exécution T03, la duplication de Tour, le Catalogue V2, le Plan, les Résultats et les évolutions ultérieures. Elles restent hors de cette tranche.

## 6. Comportement cible

Pour une Activité propre `RIGHT_LEFT` ou `LEFT_RIGHT`, hors héritage d’un Tour bilatéral :

- afficher un seul indicateur ;
- utiliser respectivement `D→G` ou `G→D` ;
- conserver le cadre `42 × 20 pt` ;
- conserver le libellé accessible développé ;
- ne permettre aucune interaction ;
- maintenir le positionnement hors flux ;
- utiliser la marge intérieure droite locale déjà validée ;
- aligner le centre vertical du cadre sur le centre vertical du titre de l’Activité ;
- appliquer la règle aux cartes de `60 pt`, `44 pt` et à l’état soulevé ;
- ne modifier ni la hauteur ni la structure générale de la carte.

Pour une Activité :

- `UNILATERAL` ;
- ou héritant d’un Tour bilatéral ;

aucun indicateur propre ne doit être rendu.

Le texte de la carte ne doit pas contenir :

- `à droite, puis à gauche` ;
- `à gauche, puis à droite`.

La formulation `par côté`, lorsqu’elle décrit le nombre de séries, reste inchangée.

## 7. Stratégie de mise en page

La correction reste locale à `CompositionScreen.tsx`.

1. Conserver le positionnement absolu afin de ne pas réduire `boundaryRowTitleSlot`.
2. Remplacer l’ancrage fondé sur le centre global de la carte par un ancrage calculé depuis le slot ou le cadre réel du titre.
3. Positionner verticalement l’indicateur par son centre, avec un décalage égal à la moitié de sa hauteur.
4. Appliquer horizontalement l’inset droit interne existant de la carte.
5. Ne pas modifier `src/shared/ui/tokens.ts`.
6. Ne pas créer de nouveau token.
7. Ne pas remplacer les anciennes coordonnées par une nouvelle constante globale indépendante de la géométrie réelle.
8. Ne pas changer la largeur de la carte, le texte, les Zones, la synthèse ou les règles de troncature.
9. Conserver les conditions existantes d’affichage selon la direction propre, l’héritage du Tour et le mode unilatéral.
10. Préserver l’accessibilité et la non-interactivité du rendu.

Les trois variantes à contrôler sont :

- carte standard rendue à `60 pt` ;
- carte compacte rendue à `44 pt` ;
- état soulevé avec sa hauteur propre.

La variante compacte doit notamment démontrer que l’indicateur reste entièrement visible malgré le débordement masqué.

## 8. Plan séquencé

### Étape 1 — Vérification de portée

- Considérer le scan direct-import comme la vérification de portée de la présente tranche.
- Conserver `app/(creation)/composition.tsx` inchangé.
- Ne modifier aucun autre consommateur, routeur ou module transitif.
- Bloquer toute modification supplémentaire qui ne serait pas directement justifiée par la correction visuelle.

**Résultat attendu :** portée confirmée et limitée à `CompositionScreen.tsx` et à son fichier de tests.

### Étape 2 — Correction du positionnement

Dans `CompositionScreen.tsx` :

- conserver les conditions d’affichage ;
- conserver les textes courts ;
- conserver `42 × 20 pt` ;
- conserver le positionnement absolu ;
- utiliser l’inset droit interne existant ;
- aligner le centre de l’indicateur sur le titre réel ;
- vérifier les hauteurs `60 pt`, `44 pt` et soulevée ;
- préserver l’accessibilité et la non-interactivité ;
- ne modifier aucune logique de direction, d’héritage ou de Tour.

**Résultat attendu :** marge droite visible et régulière, axe vertical commun avec le titre et absence de rognage.

### Étape 3 — Tests ciblés

Dans `CompositionScreen.test.tsx` :

- vérifier `RIGHT_LEFT` et `LEFT_RIGHT` ;
- vérifier les dimensions `42 × 20 pt` ;
- vérifier une marge droite non nulle et conforme à l’inset local ;
- vérifier l’alignement vertical avec le titre ;
- vérifier les cartes de `60 pt`, `44 pt` et l’état soulevé ;
- vérifier l’absence en `UNILATERAL` ;
- vérifier l’absence sous Tour bilatéral ;
- vérifier le libellé accessible développé ;
- vérifier l’absence de direction développée dans le texte ;
- vérifier la non-interactivité ;
- vérifier l’absence de rognage dans la variante compacte ;
- préserver les tests existants du Tour, de la confirmation, de l’atomicité, de l’annulation et de la remise des enfants.

### Étape 4 — Validation complète

Exécuter sans filtrage :

- Jest complet ;
- tests d’intégration transitifs, notamment les flux de composition et d’édition du Catalogue ;
- vérification TypeScript complète ;
- lint complet ;
- contrôle du diff ;
- inspection visuelle à la largeur de référence ;
- inspection visuelle sur largeur compacte.

Contrôler explicitement :

- aucun calcul modifié ;
- aucun texte de synthèse modifié ;
- aucune migration ou persistance modifiée ;
- aucune route modifiée ;
- aucun module T03 modifié ;
- aucun fichier hors périmètre modifié ;
- aucun changement de `BIL-061` ou `BIL-062` ;
- aucune modification de l’appelant `app/(creation)/composition.tsx`.

## 9. Données et compatibilité

Cette correction est strictement présentationnelle.

Ne pas modifier :

- `side_mode` ;
- les modèles et DTO ;
- les calculs ;
- les pauses ;
- les valeurs persistées ;
- les conversions SQL ;
- `DATABASE_VERSION` ;
- les migrations ;
- les données d’Exécution, de Plan ou de Résultat ;
- les routes ;
- les textes de synthèse ;
- les modules T03.

Les valeurs persistées suivantes continuent d’être consommées sans transformation :

- `UNILATERAL`
- `RIGHT_LEFT`
- `LEFT_RIGHT`

Aucune compatibilité de données ou de navigation supplémentaire n’est requise.

## 10. Critères d’acceptation

La correction est acceptable si :

- l’indicateur propre apparaît uniquement hors héritage ;
- l’indicateur reste absent en `UNILATERAL` ;
- `D→G` et `G→D` sont entièrement visibles ;
- la dimension reste `42 × 20 pt` ;
- le bord droit ne touche pas le bord de la carte ;
- la marge droite est régulière ;
- le centre vertical de l’indicateur correspond à celui du titre ;
- le résultat est correct pour les cartes de `60 pt`, `44 pt` et l’état soulevé ;
- aucun rognage n’apparaît dans la variante compacte ;
- le libellé accessible développé est conservé ;
- l’indicateur reste non interactif ;
- aucun texte directionnel développé n’est ajouté à la carte ;
- `BIL-061` et `BIL-062` restent inchangés ;
- les tests d’intégration transitifs passent ;
- Jest complet passe ;
- la vérification TypeScript complète passe ;
- le lint complet passe ;
- seul le périmètre autorisé est modifié.

## 11. Risques et contrôles

### Divergence entre hauteur documentaire et hauteur réelle

La géométrie historique de référence ne doit pas être réappliquée aux variantes réelles. Les tests doivent cibler séparément les cartes de `60 pt`, `44 pt` et l’état soulevé.

### Rognage de la carte compacte

L’ancienne position pouvait dépasser la hauteur compacte. Le nouveau calcul doit être validé avec le débordement masqué et par inspection visuelle.

### Régression du slot de titre

Le positionnement absolu est obligatoire afin de préserver la largeur disponible pour le nom, les Zones et la synthèse.

### Régression de l’héritage

La correction ne doit pas réintroduire l’indicateur propre sous un Tour bilatéral.

### Régression de `BIL-061` et `BIL-062`

Le contrôle du Tour est hors correction. Il doit être couvert par les tests existants et la validation complète sans modification de sa géométrie ou de ses textes.

### Consommateur direct inchangé

Le consommateur identifié par le scan reste hors portée applicative. Les tests d’intégration qui montent le véritable écran restent inchangés, mais leur exécution complète est obligatoire.

## 12. Conclusion

Le scan déterministe résout la dernière vérification de portée. La décision `5678061573` résout la question de supersession de `BIL-065`. Aucune clarification produit ou technique ne reste ouverte.

PLAN_STATUS: READY_FOR_INDEPENDENT_REVIEW

<KODJO_PLAN_TRANSITION_JSON>
{
  "schema_version": "kodjo.protocol.v2.plan-review-transition.0.6.25",
  "source_head": "4c72abe2cb7f72f3629092f7e3da8220a9e305dc",
  "protocol_execution_head": "4c72abe2cb7f72f3629092f7e3da8220a9e305dc",
  "bootstrap_path": ".github/orchestration/v2-slices/V2-BILAT-01/slice-bootstrap.json",
  "status": "PASS",
  "reason": null,
  "protected_paths": [
    ".github/orchestration/v2-activation-registry.json",
    ".github/orchestration/v2-slices/V2-BILAT-01/independent-review.md",
    ".github/orchestration/v2-slices/V2-BILAT-01/planning-mission.md",
    ".github/orchestration/v2-slices/V2-BILAT-01/slice-bootstrap.json",
    ".github/orchestration/v2-slices/V2-BILAT-01/technical-plan.md",
    "docs/MATRICE-TRACABILITE-BILATERALITE.md",
    "docs/PRODUCT.md",
    "docs/RAPPORT-CONFORMITE-BILATERALITE.md",
    "docs/Specifications-fonctionnelles/12 – Architecture technique.md"
  ],
  "changed_paths": [],
  "protocol_changes": [],
  "protected_blobs": [
    {
      "path": ".github/orchestration/v2-activation-registry.json",
      "source_oid": "286b6d2808e28814cb0b4b3c725150980f9afd67",
      "execution_oid": "286b6d2808e28814cb0b4b3c725150980f9afd67"
    },
    {
      "path": ".github/orchestration/v2-slices/V2-BILAT-01/independent-review.md",
      "source_oid": "cd5a8a7066db0d2fd6ed34ef47f54a443efc0c04",
      "execution_oid": "cd5a8a7066db0d2fd6ed34ef47f54a443efc0c04"
    },
    {
      "path": ".github/orchestration/v2-slices/V2-BILAT-01/planning-mission.md",
      "source_oid": "6e418e0b9f4e81a4e7e06930ecf5035cff5a635a",
      "execution_oid": "6e418e0b9f4e81a4e7e06930ecf5035cff5a635a"
    },
    {
      "path": ".github/orchestration/v2-slices/V2-BILAT-01/slice-bootstrap.json",
      "source_oid": "e96e51544d3a163a87d4d587acefe83fd903e8f5",
      "execution_oid": "e96e51544d3a163a87d4d587acefe83fd903e8f5"
    },
    {
      "path": ".github/orchestration/v2-slices/V2-BILAT-01/technical-plan.md",
      "source_oid": "20ae36edc25e5979922b7d183b79ff752bac849b",
      "execution_oid": "20ae36edc25e5979922b7d183b79ff752bac849b"
    },
    {
      "path": "docs/MATRICE-TRACABILITE-BILATERALITE.md",
      "source_oid": "e78bf56059fd90e5b8020c0c8870f9685f461403",
      "execution_oid": "e78bf56059fd90e5b8020c0c8870f9685f461403"
    },
    {
      "path": "docs/PRODUCT.md",
      "source_oid": "872ae9f40437b6d379daec4073e02a42506ea872",
      "execution_oid": "872ae9f40437b6d379daec4073e02a42506ea872"
    },
    {
      "path": "docs/RAPPORT-CONFORMITE-BILATERALITE.md",
      "source_oid": "38f0047cfc80724b5a2930b250221252efb798d6",
      "execution_oid": "38f0047cfc80724b5a2930b250221252efb798d6"
    },
    {
      "path": "docs/Specifications-fonctionnelles/12 – Architecture technique.md",
      "source_oid": "4205d200faa365bc55484c542c5c240988383c4f",
      "execution_oid": "4205d200faa365bc55484c542c5c240988383c4f"
    }
  ],
  "product_source_evidence": [
    {
      "path": "docs/PRODUCT.md",
      "declared_sha256": "62daa97413d9dc268e7245a3cbe2a5604b40fc74baaa00fab1bfed9428fa6125",
      "source_sha256": "eac9645772d69e344be05536b6f843db01cc1a17c965a1bb62a7b277ec9334fa",
      "execution_sha256": "eac9645772d69e344be05536b6f843db01cc1a17c965a1bb62a7b277ec9334fa",
      "declared_hash_matches_source": false,
      "transition_matches": true
    },
    {
      "path": "docs/MATRICE-TRACABILITE-BILATERALITE.md",
      "declared_sha256": "7c400345e180b298d81f704199a955234ffaceed35b1001bd30e7ece4a89e575",
      "source_sha256": "b9476b6652a826139cb7aefeefa23053b73ad2f2c68dff8cda3c4d503d267238",
      "execution_sha256": "b9476b6652a826139cb7aefeefa23053b73ad2f2c68dff8cda3c4d503d267238",
      "declared_hash_matches_source": false,
      "transition_matches": true
    },
    {
      "path": "docs/RAPPORT-CONFORMITE-BILATERALITE.md",
      "declared_sha256": "630afb04768e6199315ac767ccfa5af3d3ecdf6697b0604395e60a88a1ae369b",
      "source_sha256": "9917cdffb80333315f6afe1eb18a9e1f516b8494853905ad48684f443d2302ee",
      "execution_sha256": "9917cdffb80333315f6afe1eb18a9e1f516b8494853905ad48684f443d2302ee",
      "declared_hash_matches_source": false,
      "transition_matches": true
    },
    {
      "path": "docs/Specifications-fonctionnelles/12 – Architecture technique.md",
      "declared_sha256": "8337d20068a151b9ab3654528d5416e9b1c3f9ca23f1362cb3d89c5dbd8ae3ac",
      "source_sha256": "ddca8811dbf19a7454c3a28a6107b910256987b15f4341d4f7824839294ead18",
      "execution_sha256": "ddca8811dbf19a7454c3a28a6107b910256987b15f4341d4f7824839294ead18",
      "declared_hash_matches_source": false,
      "transition_matches": true
    }
  ],
  "policy": {
    "classifier_sha256": "a954d5be623a9d8e0481821957af30ff5ab61d85a047fc90396aa9bd6581f852",
    "blobs": [
      {
        "path": "scripts/kodjo/verify-plan-review-transition.js",
        "source_oid": "ff40f12f7f4d5c03d849d70e1f498039621098e4",
        "execution_oid": "ff40f12f7f4d5c03d849d70e1f498039621098e4"
      },
      {
        "path": ".github/workflows/kodjo-v2-slice-plan.yml",
        "source_oid": "19bd7127ae7cca036fe1c43cf4d38781d913b77d",
        "execution_oid": "19bd7127ae7cca036fe1c43cf4d38781d913b77d"
      },
      {
        "path": ".github/workflows/kodjo-v2-slice-plan-review.yml",
        "source_oid": "6a24287981898a85bb8b73fc60b466c668a15e89",
        "execution_oid": "6a24287981898a85bb8b73fc60b466c668a15e89"
      }
    ]
  }
}
</KODJO_PLAN_TRANSITION_JSON>
