# Spec Delta

## Purpose

Définir les règles qui garantissent que chaque règle produit de KODJO possède une seule référence normative identifiable, que les remplacements sont explicites et que la documentation reste distincte du rendu visuel Figma.

## ADDED Requirements

### Requirement: Couche normative unique
Seuls les chapitres 01 à 13 de `docs/Specifications-fonctionnelles/` MUST porter des règles produit normatives. Tout autre document de `docs/` MUST déclarer en tête un statut `navigation`, `traçabilité` ou `historique` et renvoyer au chapitre qui fait foi.

#### Scenario: Document de traçabilité consulté
- **WHEN** un lecteur ouvre un DSF, une matrice, un rapport ou une revue
- **THEN** l'en-tête indique son statut non normatif, sa date et le chapitre ou l'ancre qui fait foi

#### Scenario: Règle présente uniquement hors chapitres
- **WHEN** une règle produit n'existe que dans un document de traçabilité
- **THEN** elle est intégrée dans son chapitre domicile avant que le document ne soit marqué `traçabilité`

### Requirement: Domicile unique de chaque type de règle
Chaque type de contenu MUST avoir un chapitre domicile unique (table de `design.md` D2). Hors de son domicile, une règle MUST être citée par son identifiant et un lien, sans reformulation normative.

#### Scenario: Formule de calcul utilisée par un contrat d'écran
- **WHEN** un contrat CE-xx affiche une durée calculée
- **THEN** il renvoie à la règle RM-xxx du chapitre 10 sans recopier la formule

#### Scenario: Divergence entre domicile et copie
- **WHEN** une copie diverge de son domicile
- **THEN** la divergence est traitée comme un défaut et la copie est remplacée par un renvoi

### Requirement: Règle d'arbitrage écrite à un seul endroit
La documentation MUST contenir une seule règle d'arbitrage en cas de conflit, écrite à un seul endroit et citée ailleurs. L'antériorité ou la récence d'un texte MUST NOT servir de critère d'arbitrage.

#### Scenario: Conflit entre deux chapitres
- **WHEN** deux chapitres énoncent des règles incompatibles sur le même objet
- **THEN** le lecteur applique la règle d'arbitrage unique et le conflit est consigné pour correction

#### Scenario: Texte plus récent sans remplacement explicite
- **WHEN** un texte plus récent contredit un texte plus ancien sans le nommer
- **THEN** aucun des deux n'est réputé remplacé et le conflit est soumis à décision

### Requirement: Remplacement explicite et bidirectionnel des décisions
Une décision qui en remplace une autre MUST nommer la décision et le point remplacés. La décision remplacée MUST porter le statut `Remplacée par D-yyy (point)` et conserver son texte d'origine lisible.

#### Scenario: Décision remplacée consultée
- **WHEN** un lecteur consulte une décision remplacée dans le chapitre 07
- **THEN** il lit son texte d'origine, son statut et l'identifiant de la décision remplaçante

#### Scenario: Remplacement par un document non normatif
- **WHEN** un DSF ou une matrice entend modifier une décision
- **THEN** une décision D-xxx explicite est enregistrée au chapitre 07, à défaut de quoi la décision d'origine reste applicable

### Requirement: Réécriture en place plutôt que complément empilé
Une modification de règle MUST réécrire le texte normatif à son domicile et ajouter une ligne d'historique citant la décision. Un ajout daté MUST NOT laisser en place un texte normatif qu'il contredit.

#### Scenario: Révision d'une rubrique de contrat d'écran
- **WHEN** une décision modifie une rubrique d'un contrat CE-xx
- **THEN** la rubrique est réécrite et l'ancienne formulation n'apparaît plus comme règle applicable

### Requirement: Identifiants stables et liens valides
Toute règle normative MUST porter un identifiant unique non vide (D-xxx, RM-xxx, CE-xx, REC-xx). Les titres porteurs d'identifiant MUST exposer une ancre explicite stable. Aucun lien interne de `docs/` hors archives MUST NOT viser un fichier ou une ancre inexistants.

#### Scenario: Contrôle mécanique des liens
- **WHEN** le contrôle `outils/links.mjs` est exécuté après un lot de corrections
- **THEN** il ne signale aucun fichier manquant ni aucune ancre manquante

#### Scenario: Règle sans numéro
- **WHEN** un titre de règle porte un identifiant vide tel que `RM-`
- **THEN** la règle est considérée comme non référençable et doit recevoir un identifiant avant toute citation

### Requirement: Séparation entre comportement et rendu visuel
La documentation MUST définir les comportements, calculs, libellés et états. Figma MUST rester la référence du rendu visuel. Une valeur de calcul ou par défaut MUST NOT être justifiée par une capture ou par Figma.

#### Scenario: Valeur par défaut justifiée par Figma
- **WHEN** une règle justifie une valeur par défaut par « le Figma de référence »
- **THEN** la valeur est rattachée à une décision D-xxx ou à une règle RM-xxx, ou signalée comme à confirmer

#### Scenario: Dimension visuelle dans un chapitre de données
- **WHEN** un chapitre de données, d'API ou d'architecture contient des px, couleurs ou polices
- **THEN** ce contenu est retiré au profit d'un renvoi à Figma ou au contrat d'écran
