# KODJO — Rapport de réconciliation documentaire A à H

**Date :** 11 novembre 2026  
**Dépôt :** `MyUncried/Application-Routine`  
**Baseline non modifiée :** `docs/mouvements-modele-cible-etape2-20261111`  
**Branche corrective distincte :** `docs/mouvements-reconciliation-A-H-20261111`  
**Objet :** suppression des contradictions documentaires A à H identifiées dans l'audit du 11 novembre, sans modification du code, de Figma ni des travaux PRE-10.  
**Méthode :** comparaison Git de la branche à la baseline, remplacement ciblé des passages contradictoires, seconde recherche indépendante des variantes lexicales et sémantiques, contrôle des documents transverses et des principales références Markdown créées/modifiées. Les lignes ci-dessous correspondent à la **baseline auditée** lorsqu'elles sont datées avant correction.

## 1. Synthèse de conformité

| Axe | Règle attendue | Résultat du contrôle documentaire | Statut |
|---|---|---|---|
| **A — Droits des importées** | Aucune modification/duplication d'une fiche importée ; redistribution sur autorisation future, paramètres d'Exercice indépendants | Anciennes matrices de droits et copie remplacées dans les sources actives visées ; registre corrigé, BIB-06/07 supersédées **sur ce périmètre**, BIB-08 maintenue pour les Exercices | **CONFORME dans le périmètre documentaire contrôlé** |
| **B — Auteur unique** | `author: ActorRef \| null`, aucune gestion multi-auteurs cible | Consignes de choix d'auteur supprimées/fermées ; anciennes `authors[]` identifiées comme constat du pilote, conversion sûre prescrite | **CONFORME en documentation ; code CA-1 NON CONFORME tant qu'il n'est pas modifié** |
| **C — Plan en six étapes** | Plan unique, fonctions communautaires postérieures | Ancien tableau de lots de l'annexe remplacé ; phasage L1/L2 du registre requalifié en priorité fonctionnelle, non plan concurrent | **CONFORME en documentation contrôlée** |
| **D — Médias** | Métadonnées exhaustives, médias distants à la demande et cache, droits, données historiques non perdues | Distinction explicite `EMBEDDED`/ `REMOTE` historique vs accès distant cible dans la spécification, les données, API et architecture | **CONFORME en cadrage ; stockage/cache NON VÉRIFIABLE sans développement** |
| **E — Révisions/conflits** | Mise à jour volontaire ; nouvelles fiches importées en lecture seule ; anciens imports conservés | Conception, parcours, règles et registre distinguent désormais les **60 historiques** du flux des **nouvelles fiches protégées** | **CONFORME en documentation ; reprise CA-3 NON VÉRIFIABLE sans tests** |
| **F — Identité/source** | Identité éditoriale stable, pas d'espace de noms local persistant additionnel imposé | Ancienne obligation supprimée ; première publication avec allocation serveur opaque présentée comme **proposition technique à valider**, sans fusion d'identités ni reconstruction | **PARTIELLEMENT CONFORME : implémentation/compatibilité à vérifier** |
| **G — Profil/Figma** | Conserver l'évidence des écrans, ne pas inventer l'activation des accès différés | Contrats 06/13 distinguent visuel, premier périmètre et comportement non arbitré ; nœud Figma `1992:778` contrôlé | **À CLARIFIER : action des deux entrées futures** |
| **H — Neutralité santé** | Pas de suivi d'exécution des patients ni rôle professionnel imposé | Chapitres 02, 03 et 05 corrigés ; patientèle, prescription et remontée de résultats supprimées des parcours actifs visés | **CONFORME dans les passages documentaires contrôlés** |

**Conclusion générale : PARTIELLEMENT CONFORME**, uniquement parce que F comporte une vérification technique future et G un arbitrage UX non pris. Aucune inférence sur un écran Figma n'a été présentée comme décision fonctionnelle.

## 2. Détail par axe : fichiers, ancienne formulation, correction, contrôle

### A — Droits de modification et duplication

**Décision source :** MOUV-D3, supersession ciblée de BIB-06 et BIB-07 ; **BIB-08 demeure applicable**.

**Fichiers corrigés :**
- `docs/KODJO-Conception-Bibliotheques-Mouvements-Partage-2026-11-10.md` : lignes BIB-06/07/11/13, matrice §2.1, limites et synthèse, remplacées par les règles « personnelle » / « importée » ;
- `docs/KODJO-Bibliotheques-Parcours-utilisateurs-cibles-2026-11-10.md` : règles communes, matrice, PU-03/PU-04, critères d'acceptation, copies des importées interdites ;
- `docs/KODJO-Bibliotheques-Conception-fonctionnelle-technique-donnees-Revue-Claude-2026-11-10.md` : BIB-06–08, PU-03/04, droits, test T-03 ;
- `docs/Specifications-fonctionnelles/01 – Vision Générale.md`, `04 – Modèle fonctionnel.md`, `08 – Conception fonctionnelle détaillée.md`, `10 – Processus métier et règles métier transverses.md`, `05 – Versions du produit.md`, `07 – Registre des décisions de conception.md`, `PRODUCT.md` ;
- `docs/KODJO-Mouvements-Etape2-Modele-cible-et-migrations-2026-11-11.md` : corrige la mention de BIB-08, **non supersédée**.

**Anciennes formes recherchées en seconde passe :** « Copier est toujours possible », « copie personnelle volontaire », « copie personnelle conserve », « Libre localement » interprété comme éditable, « quatre modes destinataires restent applicables », « corriger une fiche reçue si Modifier autorisé ». **Résultat : aucune prescription active de ces formes trouvée dans les documents normatifs contrôlés**. Certaines mentions historiques sont conservées comme constats ou comme règles explicitement supersédées.

**Restant :** vérification de refus de modification/duplication par les services et l'UI pendant le développement ; code non modifié.

### B — Auteur unique

**Décision source :** BIB-02 et MOUV-D1 (`author: ActorRef | null`).

**Fichiers corrigés :** `KODJO-Fiche-Mouvement-Contrat-consolide-et-handoff-2026-11-11.md` (ancienne table et consigne de choix d'auteur désormais closes), `KODJO-Bibliotheques-Conception-fonctionnelle-technique-donnees-Revue-Claude-2026-11-10.md` (question d'auteur close), `09 – Modèle de données fonctionnel.md` (migration du champ), `07 – Registre des décisions de conception.md`, `Annexe – Index des identifiants.md`.

**Ancienne règle recherchée :** plusieurs auteurs, demande d'arbitrer le champ et conservation de `authors[]` comme modèle cible. **Résultat : les occurrences de `authors[]` qui restent sont étiquetées « format CA-1 historique » ou « migration attendue » ; aucune gestion multi-auteurs n'est prescrite comme cible.**

**Restant côté code :** `MovementEditorialProvenance.ts`, `MovementCatalogueFile.ts`, convertisseurs, admin Web et tests de la branche pilote CA-1/CA-3 sont **à modifier lors du développement**. Ces fichiers n'appartiennent pas à la baseline documentaire et ne sont pas ajoutés silencieusement.

### C — Plan de réalisation et lots

**Référence :** plan en six étapes du chapitre 07 confirmé le 11/11/2026.

**Corrections :**
- `Annexe – Matrice de traçabilité.md` : remplace le tableau de correspondance BIB/F4 vers L1–L5 par une matrice vers les **six étapes**, avec les fonctions communautaires au-delà de ces étapes ;
- `07 – Registre des décisions de conception.md` : supprime la formulation « plan de lots révisé L1/L2 » comme concurrente ; distingue **priorité fonctionnelle** et plan de réalisation ;
- dossiers de conception : ancien tableau L1–L6 remplacé dans la réconciliation antérieure, conservé comme information historique seulement.

**Contrôle :** recherche de tables `| **L1 —`, « L1 — définition minimale … L2 — contrôle », prescriptions de lancement du partage avant CA-3. **Aucune prescription concurrente détectée dans les documents actifs contrôlés.**

### D — Médias

**Référence :** MOUV-D2.

**Fichiers corrigés :** `KODJO-Mouvements-Etape2-Modele-cible-et-migrations-2026-11-11.md`, `09 – Modèle de données fonctionnel.md`, `11 – API fonctionnelles.md`, `12 – Architecture technique.md` et `KODJO-Fiche-Mouvement-Contrat-consolide-et-handoff-2026-11-11.md`.

**Distinctions actées :** (i) `EMBEDDED` / `REMOTE` décrivent le fichier d'échange CA-1 historique ; (ii) la référence distante et le cache local sont la stratégie cible d'accès aux médias diffusables ; (iii) les métadonnées de médias historiques sont conservées ; (iv) un média non autorisé n'est pas diffusé ; (v) absence de réseau/cache = indisponibilité sans suppression de fiche ; (vi) média personnel indépendant du cache.

**Restant :** mécanismes techniques exacts de cache, quota, purge, stockage, URL expirantes et droits à valider/implémenter ; aucun comportement n'a été déclaré testé.

### E — Conflits historiques et mises à jour

**Référence :** MOUV-D3/D4 et CA-3.

**Fichiers corrigés :** `KODJO-Conception-Bibliotheques-Mouvements-Partage-2026-11-10.md` (BIB-13), `KODJO-Bibliotheques-Parcours-utilisateurs-cibles-2026-11-10.md` (PU-03/04), `KODJO-Bibliotheques-Conception-fonctionnelle-technique-donnees-Revue-Claude-2026-11-10.md` (réconciliation historique), chapitres 08/10/07.

**Résultat :** (a) nouvelles fiches importées : lecture seule, donc pas de conflit d'édition personnel ; (b) anciennes installations du corpus 60 : adaptation antérieure conservée, examen par CA-3 sans écrasement ni fusion silencieuse ; (c) mise à jour ordinaire toujours volontaire.

**Restant :** tests avec données historiques, coupures et liens vers les Séances existantes ; aucune garantie de reprise runtime prétendue.

### F — Identité/source

**Référence :** décision d'identité source stable, seconde revue Claude, modèle CA-1.

**Correction :** `KODJO-Bibliotheques-Conception-fonctionnelle-technique-donnees-Revue-Claude-2026-11-10.md` §5.4 : retirer l'espace de noms local persistant non affiché imposé hors publication ; rappeler la correspondance source + fiche éditoriale, identité locale `Movement.id`, et l'option d'allocation d'une identité éditoriale opaque lors d'une première publication, à vérifier techniquement.

**Contrôle :** la phrase « un créateur local hors ligne utilise un espace de noms local persistant » ne subsiste pas dans les documents contrôlés.

**Restant :** validation technique du mapping des fiches historiques et du scénario de première publication ; les identités préexistantes ne sont jamais reconstruites à partir du nom.

### G — Profil et Figma

**Référence Figma contrôlée à nouveau en lecture :** fichier `G6RY5Ebhgwb4AHIOYDwwvg`, page `510:101`, écran `1992:778`. Le nœud contient les sections « Mes bibliothèques », « Bibliothèques partagées », « Bibliothèques installées », Fitness et Pilates, et la commande « Mettre à jour » de Pilates.

**Fichiers corrigés :** `06 – Ecrans et navigation de la V1.md`, `13 – Contrats d’écran.md` ; l'Annexe Matrice rattache la décision en suspens à l'étape 3.

**Résultat :** le rendu et le vocabulaire Figma sont distingués des comportements ; le premier périmètre ne devient pas création personnelle/partage par simple présence de ces entrées.

**Restant : À CLARIFIER** — masquer/désactiver ou autre action des deux entrées futures tant que les parcours ne sont pas développés. **Aucune décision inventée ; aucune modification Figma.**

### H — Neutralité santé

**Référence :** KIN-01, neutralité du modèle.

**Fichiers corrigés :**
- `02 – Utilisateurs et besoins.md` : utilisateur accompagné défini sans rôle professionnel ; B-049/051/052 réorientés vers réception/versions de Mouvements, sans suivi d'exécution ;
- `03 – Parcours utilisateur.md` : anciennes fonctions « suivre l'exécution des séances réalisées par un patient ou client » et « gérer plusieurs patients » remplacées par une transmission générique sans prescription numérique ;
- `05 – Versions du produit.md` : section V3 et sommaire renommés, ancienne liste de prescription de Séances et remontée douleur/fatigue/résultats remplacée par transmission de Mouvements autorisés ;
- dossier de conception technique Bibliothèques : suppression de la mention « données de santé associées à un coach/kiné » au titre du partage.

**Contrôle :** recherches « suivre l'exécution des séances réalisées par un patient », « gérer plusieurs patients », « données de santé associées à un coach/kiné » dans les documents actifs concernés : **aucune règle active trouvée**. Les exemples d'usage professionnel sans rôle ni fonction clinique peuvent demeurer comme illustration, non comme règle métier.

## 3. Vérifications indépendantes de la modification

### 3.1 Diff et conservation physique

Comparaison Git `docs/mouvements-modele-cible-etape2-20261111` → `docs/mouvements-reconciliation-A-H-20261111`, effectuée après corrections :

- **21 fichiers Markdown modifiés** avant ajout du présent rapport, **aucune suppression ni renommage** ;
- aucun fichier `src/`, `app/`, migration, artefact Figma ou administration Web modifié ;
- aucun fichier Unicode transformé en `#Uxxxx`, `\uXXXX` ou caractère de remplacement dans les **chemins modifiés** ;
- fichiers non compris dans le diff conservés par Git à l'identique ;
- rapport créé **sur demande**, hors des spécifications fonctionnelles, sans ajout au périmètre physique d'un ZIP.

### 3.2 Recherche sémantique

Deuxième passe effectuée sur PRODUCT, INDEX, les documents actifs de conception des Bibliothèques, les chapitres 01–13 et les annexes 4 concernées. Variantes contrôlées : copie/duplication, permissions éditoriales, libre localement, auteur, multi-auteur, namespace local, ancien lot, suivi de patient, médias et révision. Les anciennes formulations qui restent dans le **constat du code CA-1** sont identifiées comme historiques, pas des règles applicables.

**Limite d'exhaustivité :** la recherche ne constitue pas une certification de tous les fichiers archivés, issues, PR, branches ou artefacts BMAD du dépôt. Aucun résultat Jest ou de migration n'a été exécuté.

### 3.3 Liens internes

Cibles des liens ajoutés ou rectifiés dans la matrice, l'index et INDEX vérifiées par lecture GitHub sur la branche : `07 – Registre des décisions de conception.md`, `KODJO-Mouvements-Etape2-Modele-cible-et-migrations-2026-11-11.md`, `KODJO-Fiche-Mouvement-Contrat-consolide-et-handoff-2026-11-11.md`, `KODJO-Bibliotheques-Parcours-utilisateurs-cibles-2026-11-10.md`, `KODJO-Bibliotheques-Conception-fonctionnelle-technique-donnees-Revue-Claude-2026-11-10.md`. Décodage des espaces/tirets Unicode contrôlé pour ces chemins. **Non vérifié exhaustivement : tous les liens historiques Markdown et ancres intra-page du dépôt.**

## 4. Limites et prochaines actions

| Sujet | État | Action requise |
|---|---|---|
| Auteurs uniques CA-1 | Documentation mise à jour ; code pilote encore `authors[]` | Claude : modifier format, validateurs, conversion et tests |
| Fiches importées en lecture seule | Règle documentaire corrigée | Claude : gardes métier et UI, tests de duplication/édition refusées |
| Réconciliation des 60 | Contrat documentaire corrigé | Claude : exécuter tests sur base peuplée et interruption |
| Média/cache | Contrat cible clarifié | Claude : définir et tester résolution distante, droits, cache et indisponibilité |
| Identité à première publication | Proposition technique décrite | Valider selon le schéma réel avant implémentation future |
| Profil : deux entrées de fonctions futures | **À CLARIFIER** | Arbitrage UX ultérieur, distinct du développement de la fiche |
| Partage communautaire | Reporté | Aucun développement immédiat |

**Verdict de livraison documentaire : PARTIELLEMENT CONFORME sur l'ensemble A–H, malgré la correction des contradictions textuelles identifiées.** Les limites F et G sont explicitement réservées ; aucun test de code ni changement Figma n'a été entrepris.

**Gouvernance :** nouvelle branche dédiée, sans PR et sans fusion dans `main`. La baseline reste inchangée.
