# Documentation de KODJO

**Actualisation du 25/10/2026 :** [niveaux, recherche, captures, composants, tokens et réserves](DSF-NIVEAUX-RECHERCHE-2026-10-25.md). Les contradictions C01–C09 restent explicites ; les captures ne les tranchent pas.

**Référence fonctionnelle reçue et intégrée — v6 :** [Niveaux, recherche et parcours v6](KODJO-Niveaux-Recherche-Parcours-Regles-v6.md). Ses règles remplacent les dispositions antérieures contradictoires dans leur portée, notamment recherche, alias, reprise des phases et classification actuelle. [Consignes Claude Code actualisées](PROMPT-CLAUDE-CODE-NIVEAUX-RECHERCHE-V6.md).

**Relevé historique Figma du 23/10/2026 :** [Gestes, filiation et niveaux](DSF-MOUVEMENT-FILIATION-NIVEAUX-2026-10-23.md) — cinq nouveaux états et popover illustrés au chapitre 06, captures existantes actualisées, contrats et composants réconciliés ; écarts de prototype explicités.

La documentation de référence forme un ensemble de treize chapitres, complété par quatre annexes non normatives. Les règles métier, calculs et comportements sont définis ici ; Figma décrit les dispositions visuelles et illustre des états. Les valeurs de démonstration des captures ne définissent pas les calculs.

| Chapitre | Titre | Contenu |
|---|---|---|
| 01 | [Vision et glossaire](Specifications-fonctionnelles/01%20%E2%80%93%20Vision%20G%C3%A9n%C3%A9rale.md) | Vision et principes ; glossaire, seule source des définitions |
| 02 | [Utilisateurs et besoins](Specifications-fonctionnelles/02%20%E2%80%93%20Utilisateurs%20et%20besoins.md) | Profils et besoins, identifiés B-001 et suivants |
| 03 | [Parcours utilisateur](Specifications-fonctionnelles/03%20%E2%80%93%20Parcours%20utilisateur.md) | Parcours illustratifs |
| 04 | [Modèle fonctionnel](Specifications-fonctionnelles/04%20%E2%80%93%20Mod%C3%A8le%20fonctionnel.md) | Concepts, structures et relations |
| 05 | [Versions et périmètre](Specifications-fonctionnelles/05%20%E2%80%93%20Versions%20du%20produit.md) | Périmètre des versions et des tranches |
| 06 | [Interface : navigation, écrans et conventions communes](Specifications-fonctionnelles/06%20%E2%80%93%20Ecrans%20et%20navigation%20de%20la%20V1.md) | Navigation, inventaire des écrans, captures, conventions d’interface communes à plusieurs écrans |
| 07 | [Registre des décisions de conception](Specifications-fonctionnelles/07%20%E2%80%93%20Registre%20des%20d%C3%A9cisions%20de%20conception.md) | Décisions, dans l’ordre chronologique |
| 08 | [Conception fonctionnelle par fonctionnalité](Specifications-fonctionnelles/08%20%E2%80%93%20Conception%20fonctionnelle%20d%C3%A9taill%C3%A9e.md) | Enchaînements, états et transitions ; cite les règles du chapitre 10 |
| 09 | [Modèle de données fonctionnel](Specifications-fonctionnelles/09%20%E2%80%93%20Mod%C3%A8le%20de%20donn%C3%A9es%20fonctionnel.md) | Entités, attributs, invariants, intégrité, migration |
| 10 | [Règles métier et calculs](Specifications-fonctionnelles/10%20%E2%80%93%20Processus%20m%C3%A9tier%20et%20r%C3%A8gles%20m%C3%A9tier%20transverses.md) | Règles testables, calculs, formats d’affichage, recettes |
| 11 | [API fonctionnelles](Specifications-fonctionnelles/11%20%E2%80%93%20API%20fonctionnelles.md) | Contrats de services |
| 12 | [Architecture technique](Specifications-fonctionnelles/12%20%E2%80%93%20Architecture%20technique.md) | Architecture et design system technique |
| 13 | [Contrats d’écran](Specifications-fonctionnelles/13%20%E2%80%93%20Contrats%20d%E2%80%99%C3%A9cran.md) | Les 40 contrats existants et le contrat Niveaux |

**Annexes non normatives :**
- [Correspondance des sections](Specifications-fonctionnelles/Annexe%20%E2%80%93%20Correspondance%20des%20sections.md) : pour chaque ancienne section, sa place actuelle ;
- [Index des identifiants](Specifications-fonctionnelles/Annexe%20%E2%80%93%20Index%20des%20identifiants.md) : où chaque identifiant est défini, règles sans identifiant, registre par thème ;
- [Matrice de traçabilité](Specifications-fonctionnelles/Annexe%20%E2%80%93%20Matrice%20de%20tra%C3%A7abilit%C3%A9.md) : besoins, règles, contrats et recettes reliés par les seules références établies (citations et rattachements prouvés) ;
- [Historique des consolidations](Specifications-fonctionnelles/Annexe%20%E2%80%93%20Historique%20des%20consolidations.md) : passages historiques conservés à l’identique.

**Organisation (D-402).**
- Les chapitres 03, 04, 08, 09, 10, 11 et 13 suivent le même ordre de parties : Séances, Exercices, Paramètres d’exécution, Composition, Circuits, Formats, Bilatéralité, Exécution, Médias, Planification, Suivi, Profil, Référentiels, puis les sujets transverses. Une même fonctionnalité occupe ainsi la même place d’un chapitre à l’autre.
- Chaque chapitre commence par un sommaire.
- Les noms des fichiers n’ont pas changé.
- Les mentions « chapitre NN » et « § » des textes antérieurs, en particulier du registre, se lisent avec l’annexe de correspondance.

La documentation décrit la conception attendue ; elle ne constitue pas une preuve de réalisation ni de qualification sur appareil. Les limites fonctionnelles encore ouvertes sont indiquées dans le sujet concerné. L’historique des modifications reste consultable dans Git.

## Autorité documentaire — ce qui est décidé

Cette section est une aide à la navigation. Elle regroupe, sans en ajouter, les règles d'autorité déjà décidées explicitement. Elle ne tranche par elle-même aucun point d’autorité.

- **Comportements et calculs / rendu.** « Spécifications et arbitrages déterminent calculs et comportements ; Figma définit uniquement le layout/rendu. Exemples chiffrés et câblages ne sont jamais une règle. » ([D-255](Specifications-fonctionnelles/07%20%E2%80%93%20Registre%20des%20d%C3%A9cisions%20de%20conception.md), confirmée par D-300.) Voir aussi le chapitre 13, « Clarification d’autorité et de portée ».
- **Décisions.** Les décisions validées du chapitre 07 s’appliquent dans leur portée. Une décision n’en remplace une autre que si elle le dit explicitement (principe des « arbitrages explicitement supersédants », énoncé jusqu’ici au rang 1 de l’ordre de référence de `PRODUCT.md`, retiré par D-402). Une règle n’est pas remplacée du seul fait qu’un texte est plus récent ou placé ailleurs.
- **Chapitres 08 et 13.** « Aucune priorité automatique entre le chapitre 08 et le chapitre 13 : une contradiction entre eux qui n’est pas résolue par une décision explicite reste `À CLARIFIER`. » (D-376.)
- **DSF, D-339 et D-341.** « D-339 conserve son comportement de fermeture après sélection, y compris dans les popovers ; présentation D-341 remplacée par les DSF validés. » (D-377.) Pour les lignes Mode, Type de série et Changement de côté de la feuille des paramètres, la présentation par popovers est remplacée par des contrôles segmentés et D-339 n’y a plus d’objet ([D-413](Specifications-fonctionnelles/07%20%E2%80%93%20Registre%20des%20d%C3%A9cisions%20de%20conception.md#parametres-execution-20261018)).
- **Domiciles (D-402).** Une règle testable est énoncée au chapitre 10. Le chapitre 08 la cite par son identifiant, et le contrat du chapitre 13 en décrit l’effet à l’écran. `PRODUCT.md` est une synthèse sans ordre de référence propre.

En cas de contradiction entre deux passages, les deux sont conservés jusqu’à décision explicite.

## Mouvement, filiation et niveaux — intégration du 23/10/2026

Règles normatives et recettes MFN : [chapitre 10](Specifications-fonctionnelles/10%20%E2%80%93%20Processus%20m%C3%A9tier%20et%20r%C3%A8gles%20m%C3%A9tier%20transverses.md#mouvement-filiation-et-niveaux). Modèle et intégrité : chapitres 04/09 ; parcours : 03/08 ; contrats : 06/13 ; API/architecture : 11/12 ; livraison : 05 ; décisions D-436 à D-440 : 07. La spécification v0.4 est propagée dans ces chapitres ; code à réaliser, transition sur base vierge sans reprise.
