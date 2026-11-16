# KODJO — Provenance, propriété et fiches éditoriales des Mouvements

**Date :** 6 novembre 2026. **Statut :** décisions de conception validées par le propriétaire du produit ; modélisation préparatoire indépendante du moteur d'exécution. **Implémentation :** la présente spécification ne certifie pas un partage opérationnel, une base de comptes ni une migration SQLite.

## 1. Arbitrage et périmètre

KODJO prépare des fiches de Mouvements proposées par KODJO, des coachs ou des organisations, susceptibles d'être publiées, importées ou adaptées localement. Une fiche possède une **provenance**, un **propriétaire administratif**, un ou plusieurs **auteurs**, un **éditeur/diffuseur** éventuellement distinct, une **version** et une référence vers sa **source éditoriale** en cas de copie.

**Indépendance impérative :** cette évolution ne constitue aucun préalable aux travaux du moteur d'exécution. Elle n'altère ni les paramètres des Exercices, ni les formats, ni la préparation des instantanés, ni les timers, ni les résultats historiques. Le moteur consomme le Mouvement et les paramètres résolus selon les contrats actuels et ne lit jamais les métadonnées éditoriales pour exécuter.

**Périmètre immédiat :** modèle et contrôle des métadonnées ; préparation du catalogue Git et de la traçabilité ; scénarios de test isolés. **Hors périmètre immédiat :** comptes distants, authentification des coachs, permissions réseau, publication communautaire effective, boutique, synchronisation et modification des écrans mobiles/Figma.

## 2. Termes distincts et invariants

| Terme | Définition |
|---|---|
| **Concept gestuel** | Référence facultative permettant d'associer plusieurs fiches décrivant un même geste technique. Ne remplace pas le groupe de Niveaux KODJO. |
| **Fiche éditoriale** | Contenu versionné et attribué à un auteur/propriétaire ; plusieurs fiches peuvent décrire le même concept gestuel. |
| **Mouvement local** | Objet existant `Movement` de KODJO, référencé par les Exercices et la Composition. Ses contraintes restent en vigueur. |
| **Propriétaire administratif** | Personne, organisation ou compte qui contrôle la gestion de la fiche ; **ce n'est pas une preuve de titularité des droits d'auteur**. |
| **Auteur** | Créateur du texte, des consignes ou de la représentation éditoriale de la fiche. |
| **Diffuseur / éditeur** | Entité qui publie ou distribue la fiche, distincte de son auteur et de son propriétaire. |
| **Ayant droit** | Entité déclarée pour les droits sur les éléments protégés (texte, image, vidéo) ; statut des droits à vérifier. |
| **Provenance** | Mode de création/entrée de la fiche et, lorsqu'il existe, identifiant exact et version de la fiche source. |
| **Source documentaire** | Publication appuyant une consigne ou indication clinique ; distincte de la fiche source d'un import. |
| **Filiation d'exécution** | `sourceMovementId` existant des exercices/instantanés ; **ne doit pas servir de référence de provenance éditoriale**. |

Une fiche `sheetId` possède une identité immuable, distincte de son titre. Plusieurs fiches éditoriales appartenant à des coachs distincts peuvent partager un titre et un concept. **La contrainte actuelle d'unicité des noms de `Movement` dans une base locale n'est pas levée** par cette décision : le traitement de plusieurs fiches homonymes installées simultanément reste à arbitrer avant distribution réelle.

## 3. Contrat de métadonnées proposé

| Champ logique | Cardinalité | Rôle |
|---|---|---|
| `sheetId` | 1 | Identifiant stable de la fiche éditoriale, indépendant du `Movement.id` local. |
| `gestureId` | 0..1 | Identifiant de concept gestuel ; plusieurs fiches peuvent le partager. |
| `localMovementId` | 0..1 | Correspondance facultative avec un Mouvement dans une base locale ; aucune écriture dans la fiche source. |
| `origin` | 1 | `LOCAL_CREATED`, `CATALOGUE_INSTALLED`, `SHARED_IMPORTED`, `EXTERNAL_IMPORTED` ou `LOCAL_DERIVED`. |
| `upstream` | 0..1 | `catalogueId`, `sheetId`, `revision` de la fiche source ; exigée sauf création originale. |
| `owner` | 1 | Référence stable de l'entité qui contrôle la fiche ; une installation locale peut employer l'identifiant interne d'utilisateur. |
| `authors` | 0..n | Références des auteurs connus ; l'absence signifie inconnu, pas propriété implicite de KODJO. |
| `publisher` | 0..1 | Diffuseur de la fiche, s'il existe. |
| `rightsHolder` | 0..1 | Titulaire déclaré des droits sur le contenu, **non vérifié automatiquement**. |
| `license` | 0..1 | Conditions connues de réutilisation, séparées des sources scientifiques et des médias. |
| `revision` | 1 | Version éditoriale de la fiche. |
| `reviewStatus` | 1 | `DRAFT`, `IN_REVIEW`, `APPROVED` ou `RETIRED`. |
| `visibility` | 1 | `PRIVATE`, `UNLISTED` ou `PUBLIC` ; métadonnée prospective sans publication réseau automatique. |

Les acteurs sont identifiés par `{kind, id}`, où `kind` vaut `LOCAL_USER`, `PERSON`, `ORGANIZATION` ou `PLATFORM`. Les noms affichés ne sont jamais des identifiants.

Le **statut éditorial** est distinct de `movements.archived_at` (archivage local), de la disponibilité d'un catalogue, de la visibilité publique et des droits. Les alias restent les alias du Mouvement existant. Le glossaire de contenu est distinct du glossaire normatif du chapitre 01.

## 4. Règles de cycle de vie à préparer

1. **Création locale originale :** `origin=LOCAL_CREATED`, sans `upstream`, propriété administrative du propriétaire local. Aucun partage automatique.
2. **Installation depuis catalogue KODJO :** identité locale différente de `sheetId`, `origin=CATALOGUE_INSTALLED`, provenance avec version figée.
3. **Import d'un coach ou d'un tiers :** `SHARED_IMPORTED` ou `EXTERNAL_IMPORTED`, source et auteur conservés lorsqu'ils sont connus ; importer ne transfère pas les droits sur la source.
4. **Adaptation locale :** nouvelle identité éditoriale, `origin=LOCAL_DERIVED`, `upstream` conservé ; propriétaire local ; la fiche source n'est pas modifiée.
5. **Évolution de la fiche source :** aucune mise à jour silencieuse des consignes personnalisées ni des Mouvements utilisés ; politique de proposition/adoption à arbitrer.
6. **Retrait de catalogue ou de publication :** ne supprime ni une copie locale légalement conservable, ni un Mouvement référencé par un Exercice, ni des instantanés historiques.
7. **Publication :** ne peut devenir effective sans authentification, vérification des permissions et conditions de licence. Une valeur `visibility=PUBLIC` n'active, à elle seule, aucun partage réseau.
8. **Compatibilité historique :** pour les Mouvements actuels dépourvus de métadonnées, provenance et propriétaire éditorial restent **inconnus** ; aucune attribution fictive rétroactive.

## 5. Séparation technique obligatoire

```text
Catalogue Git / outil Web local
   → Fiche éditoriale + provenance/acteur/version + contenu + sources
   → Validateur + tests de paquet
   → [future importation explicitement activée]
   → Couche de correspondance fiche ↔ Movement local (persistée séparément)
   → Movement local actuel (nom, consignes, catégorie, zones, phases, médias)
   → Exercice + paramètres → instantané → moteur d'exécution inchangé
```

L'objet de domaine préparatoire `MovementEditorialProvenance` est indépendant de `Movement.ts`, des serializers d'exécution et des Repositories existants. **Aucune nouvelle migration SQLite n'est engagée au titre de la présente tranche documentaire / domaine pur.** La future persistance locale de la correspondance sera additive et isolée, par exemple dans une table annexe référencée par `movement_id`, sous réserve d'une conception et de tests de migration distincts.

## 6. Tests d'acceptation pour la suite

- Création locale sans source : valide ; import sans référence source : refusé.
- Import de source avec version : validé sans réattribuer l'auteur ou les droits.
- Deux fiches de coachs avec le même concept et le même titre : deux identités éditoriales distinctes ; la collision lors de l'installation locale reste explicitement ouverte.
- Adaptation locale : nouvelle identité, référence source inchangée, aucune écriture dans la fiche du coach.
- Duplications d'acteurs / identifiants vides : signalés par le validateur.
- Ancien Mouvement sans métadonnée : conservé et interprétable, sans attribution de propriétaire inventée.
- Réexécution d'import de test : aucune duplication ; échec atomique ; pas de donnée utilisateur affectée.
- Non-régression : mêmes résultats de lecture Mouvement / Exercice / composition, plans et instantanés ; aucune dépendance du moteur vers le module éditorial.
- Vérification des droits avant publication ; pas de republication automatique de médias externes.

## 7. À CLARIFIER avant distribution et publication

- **A1 — Homonymie locale :** coexistence de deux fiches distinctes intitulées « Squat » dans un même catalogue et adaptation de l'unicité actuelle des noms de `Movement`.
- **A2 — Droits et authentification :** preuve d'identité des coachs, propriété transférable, licences, consentements de publication et modération.
- **A3 — Politique de mise à jour :** notification, proposition d'adoption, divergences entre versions et modifications locales.
- **A4 — Notion de concept :** qui attribue et fusionne les `gestureId`, avec quel contrôle de qualité et quelle séparation des variantes de difficulté.
- **A5 — Cycle de vie local :** règles exactes pour retrait d'un paquet, archive et copies conservées.
- **A6 — Interfaces :** administration Web locale à concevoir ; application/Figma inchangés à ce stade.
- **A7 — MVP :** cible préparatoire, non ajout automatique du partage au périmètre du moteur ou du MVP.

## 8. Traçabilité et documents dépendants

Décision utilisateur du 6 novembre 2026 : adopter provenance, propriétaire et fiches éditoriales distinctes ; **ne pas faire de cette évolution une dépendance du moteur d'exécution**. Cette règle complète le chantier `Référentiels, Catalogue et Jeux de données` et ne remplace aucune décision d'exécution.

Documents affectés par la décision et à relire lors de chaque tranche : ch. 01 (glossaire), 04 (Mouvement), 05 (MVP), 07 (décisions), 08 (édition), 09 (données), 10 (règles), 11 (services), 12 (architecture), 13 (écrans si UI), `PRODUCT.md`, `INDEX.md`. Figma n'est pas modifié par cette tranche sans évolution d'interface.

**État :** contrat préparatoire et types purs ; pas de backend, pas d'import réel, pas de droits activés, pas de migration ou de changement du moteur.
