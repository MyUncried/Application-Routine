# Spec Delta

## Purpose

Décrire la manière de gérer la documentation fonctionnelle de KODJO : chaque règle produit a une source normative unique et identifiable ; les remplacements et les contradictions sont traités explicitement ; Figma reste la référence du rendu visuel. Cette capacité ne contient aucune règle produit.

## ADDED Requirements

### Requirement: Source normative unique par règle
Chaque règle produit MUST avoir une seule source qui fait foi, dans un chapitre 01 à 13 ou, tant que son transfert n'est pas fait et vérifié, dans le DSF qui la porte aujourd'hui. Hors de cette source, une révision MUST citer la règle par son identifiant plutôt que la reformuler.

#### Scenario: Règle portée par un DSF
- **WHEN** une règle applicable n'existe que dans un DSF
- **THEN** le DSF reste sa source jusqu'à ce que la règle soit transférée dans un chapitre et que le renvoi soit posé dans le même commit

#### Scenario: Révision d'un passage qui recopie une règle
- **WHEN** une révision touche un passage qui recopie une règle à l'identique
- **THEN** la copie peut être remplacée par une citation de l'identifiant, sans obligation de traiter les autres copies dans la même révision

### Requirement: Résolution explicite des contradictions
Une contradiction entre deux passages MUST être résolue par une décision explicite citée (D-xxx ou décision de Hermann documentée), ou rester en place et être consignée comme question. L'emplacement, la date ou le rang d'un document MUST NOT suffire à la résoudre.

#### Scenario: Contradiction couverte par une décision existante
- **WHEN** une décision explicite tranche déjà l'objet de la contradiction
- **THEN** la correction cite cette décision et sa portée (générale ou limitée à une préparation)

#### Scenario: Contradiction sans décision
- **WHEN** aucune décision explicite ne tranche la contradiction
- **THEN** les deux passages restent inchangés et la question est soumise à décision

### Requirement: Texte d'origine des décisions remplacées
Une décision qui en remplace une autre MUST nommer la décision et le point remplacés. Une décision remplacée MUST conserver son texte d'origine lisible dans le registre, avec l'indication de ce qui la remplace.

#### Scenario: Décision dont le texte a été remplacé par un renvoi
- **WHEN** le registre ne montre qu'un renvoi tel que « ancienne version conservée dans Git »
- **THEN** le texte d'origine est restauré à l'identique depuis Git à côté de la prescription courante, sans changement de statut

### Requirement: Restauration des identifiants avant toute numérotation
Un identifiant de règle, de recette ou de décision effacé MUST être restauré à l'identique depuis l'historique Git lorsqu'il y existe. Une nouvelle numérotation MUST NOT être introduite pour des règles dont l'identifiant historique est récupérable.

#### Scenario: Titre de règle dont le numéro a été effacé
- **WHEN** un titre porte un identifiant vide tel que `RM-` et que sa version antérieure porte `RM-FMT-12`
- **THEN** le titre retrouve `RM-FMT-12`, apparié par l'ancre ou la position d'origine, et rien d'autre ne change dans la ligne

### Requirement: Liens internes résolus
Un lien interne de `docs/` hors `archives/` MUST NOT viser un fichier inexistant. Une ancre explicite MUST être ajoutée seulement pour une cible fortement citée ou exposée aux renommages.

#### Scenario: Contrôle après un lot
- **WHEN** le contrôle `outils/links.mjs` est rejoué après un lot
- **THEN** il ne signale aucun fichier manquant dans les fichiers touchés par le lot

#### Scenario: Cible disparue d'un document historique
- **WHEN** un document historique pointe vers un fichier supprimé
- **THEN** le lien vise un permalien Git de l'état antérieur au lieu d'une cible actuelle de sens différent

### Requirement: Séparation entre comportement et rendu visuel
Une valeur de calcul ou une valeur par défaut MUST être rattachée à une règle ou à une décision, et MUST NOT être justifiée par une capture ou par Figma seuls. Le rendu visuel reste défini par Figma.

#### Scenario: Valeur par défaut justifiée par une capture
- **WHEN** un passage justifie une valeur par « le Figma de référence »
- **THEN** la valeur est rattachée à la décision ou à la règle qui la fixe, ou signalée comme question

### Requirement: Classement des corrections documentaires
Chaque tâche de correction MUST être classée DOC, DOC-AUTORITÉ, FONCT-ARBITRÉ ou FONCT-À-ARBITRER (design G10). Une tâche DOC MUST être accompagnée d'une preuve mécanique qu'elle ne modifie aucune règle produit.

#### Scenario: Restauration présentée comme purement documentaire
- **WHEN** une restauration est classée DOC
- **THEN** son diff ne contient que les identifiants ou textes d'origine restaurés, vérifiés contre leur commit source

### Requirement: Conservation vérifiée lors d'une restructuration
Un déplacement, un regroupement ou un dédoublonnage de sections MUST conserver chaque identifiant défini (une seule définition), chaque ligne de contenu (à l'identique, aux renvois de localisation près, ou retirée avec un motif consigné) et le texte de chaque décision du registre. Il MUST NOT réécrire le texte d'une règle qu'il déplace, et MUST NOT fusionner deux passages divergents.

#### Scenario: Étape de restructuration contrôlée
- **WHEN** une étape de restructuration est prête à être publiée
- **THEN** le contrôle de conservation, rejoué contre le commit de départ de l'étape, ne signale aucun identifiant manquant ou dupliqué, aucune ligne absente sans motif et aucune décision modifiée

#### Scenario: Copie divergente
- **WHEN** deux passages sur le même sujet diffèrent
- **THEN** les deux restent en place, marqués `À CLARIFIER`, jusqu'à une décision explicite

### Requirement: Sens, portée et autorité conservés
Une transformation MUST conserver la portée de chaque ligne (MVP courant, hors MVP, historique), ses marqueurs d'autorité et ses références. Une copie MUST NOT être remplacée par un renvoi sans équivalence complète du texte, de la portée et de l'autorité.

#### Scenario: Copie quasi identique de portée différente
- **WHEN** deux passages ont le même texte mais l'un est placé sous une portée hors MVP et l'autre sous une portée courante
- **THEN** aucun des deux n'est remplacé par un renvoi vers l'autre

#### Scenario: Correction rédactionnelle
- **WHEN** une correction classée DOC modifie un nombre, une unité, un identifiant, un libellé, une négation ou une modalité
- **THEN** elle est reclassée FONCT et ne s'applique qu'avec la décision qui la fonde

### Requirement: Pas de seconde source normative dans OpenSpec
Les changes OpenSpec MUST décrire des révisions de la documentation, et MUST NOT servir de source normative pour une règle produit. Le répertoire `openspec/specs/` MUST NOT contenir de règle produit.

#### Scenario: Archivage d'un change documentaire
- **WHEN** un change de révision documentaire est archivé
- **THEN** seules des exigences de gestion documentaire rejoignent `openspec/specs/`, et les règles produit restent dans les chapitres
