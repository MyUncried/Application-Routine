---
status: final
stepsCompleted: ['step-01-validate-prerequisites','step-02-design-epics','step-03-create-stories','step-04-final-validation']
inputDocuments:
  - '_bmad-output/planning-artifacts/prds/prd-kodjo-pre4-2026-10-16/prd.md'
  - '_bmad-output/planning-artifacts/prds/prd-kodjo-pre4-2026-10-16/addendum.md'
  - '_bmad-output/planning-artifacts/architecture/architecture-kodjo-pre4-2026-10-16/ARCHITECTURE-SPINE.md'
  - 'docs/preparation/PRE-4/bmad/questions-ouvertes.md'
  - 'docs/preparation/PRE-4/bmad/recette-iphone.md'
  - 'docs/preparation/PRE-4/references-figma.json'
---

# KODJO PRE-4 — Découpage en epics et stories

## Vue d'ensemble

Ce document découpe en epics et stories les exigences du PRD PRE-4 (« Finalisation de l'éditeur Exercice et cible À l'échec par série ») et les décisions de l'architecture. Il n'existe pas de document UX séparé : le PRD (FR-02-13, FR-22-*) et les 32 frames Figma de `references-figma.json` en tiennent lieu. Les identifiants Q, P et H renvoient à `docs/preparation/PRE-4/bmad/questions-ouvertes.md`, et AD-n à la spine d'architecture.

**Mode d'exécution du skill.** Hermann a demandé d'avancer sur les décisions documentées et de ne lui reposer que les arbitrages réellement non résolus (consigne du 2026-10-16). Les menus « [C] continuer » du skill ont donc été franchis sans confirmation interactive. Ce n'est pas une validation de Hermann : le découpage sera soumis à la revue ChatGPT, puis à Hermann.

## Inventaire des exigences

### Exigences fonctionnelles

Les 197 FR du PRD, avec leur titre (196 avant la révision qui suit la revue ChatGPT du 2026-10-16, puis FR-21-05 ajoutée par Q27). Les conséquences testables, valeurs exactes et sources se lisent dans le PRD, à l'identifiant cité.

**ED-01 Parcours d'édition :** FR-01-01 Créer un Exercice au Catalogue · FR-01-02 Modifier un Exercice au Catalogue · FR-01-03 Créer et modifier un Exercice dans une Séance · FR-01-04 Contexte d'ouverture explicite · FR-01-05 Terminer et retour selon le contexte · FR-01-06 Copie isolée · FR-01-07 Relecture à l'identique · FR-01-08 Aucune Récupération automatique · FR-01-09 Compatibilité avec l'héritage de N par circuit · FR-01-10 Source supprimée en parallèle.

**ED-02 Écran principal :** FR-02-01 Titre selon l'action · FR-02-02 Structure et ordre des blocs · FR-02-03 En-tête et fermeture · FR-02-04 Grille verticale et adaptation aux largeurs · FR-02-05 Accès Catégorie et Zones corporelles · FR-02-06 Carte Paramètres d'exécution · FR-02-07 Description · FR-02-08 Bouton Terminer et clavier · FR-02-09 Validation avant Terminer · FR-02-10 Enregistrement atomique et erreur d'écriture · FR-02-11 États à couvrir · FR-02-12 Abandon avec confirmation · FR-02-13 Propriétés visuelles de chaque bloc.

**ED-03 Feuille et popovers :** FR-03-01 Ouverture de la Feuille sur un Brouillon · FR-03-02 En-tête et ordre du corps · FR-03-03 Annuler ou appliquer la Feuille · FR-03-04 Valeurs initiales en création · FR-03-05 Réglage des valeurs numériques par ± · FR-03-06 Popover Mode d'exécution · FR-03-07 Popover Changement de côté · FR-03-08 Popover Ordre des côtés · FR-03-09 Popover Régime des séries · FR-03-10 Comportement commun des popovers · FR-03-11 Roulettes de Cible et de Durée totale dans la Feuille · FR-03-12 Tableau des séries variables : déplacement et Pied commun (rendu) · FR-03-13 Décisions de recette PRE-3 maintenues dans la Feuille.

**ED-04 Régime :** FR-04-01 Choisir le Régime par popover · FR-04-02 Afficher et replier le Tableau des séries variables · FR-04-03 Passer en Régime variables · FR-04-04 Revenir en Régime identiques · FR-04-05 Valeurs par défaut et lecture du Régime.

**ED-05 Deux Modes :** FR-05-01 Choisir un Mode parmi deux · FR-05-02 Mode initial non renseigné · FR-05-03 Changer de Mode sans rien enregistrer · FR-05-04 Mode distinct de la Phrase et de la Cible à l'échec · FR-05-05 Mode transporté et identifiable.

**ED-06 Cible typée :** FR-06-01 Attribuer une Cible typée à chaque Série · FR-06-02 Refuser une Cible à renseigner ou invalide sans la convertir · FR-06-03 Cible commune ou Cibles ordonnées selon le Régime · FR-06-04 Cible typée en bilatéral · FR-06-05 Présenter une Cible à l'échec · FR-06-06 Cible typée dans les copies et les Instantanés.

**ED-07 Sélecteur de cible :** FR-07-01 Ouvrir le Sélecteur de cible · FR-07-02 Variante Durée · FR-07-03 Variante Répétitions · FR-07-04 Ouvrir sur la Cible courante, une seule sélection · FR-07-05 Valider ou annuler dans le Sélecteur, puis dans la Feuille · FR-07-06 Roulette native et retour haptique · FR-07-07 Roulette de Durée totale distincte · FR-07-08 Accessibilité du Sélecteur.

**ED-08 Transitions et grisé :** FR-08-01 Passer à la Cible à l'échec (Durée) · FR-08-02 Revenir au numérique sans déverrouillage (Durée) · FR-08-03 Transitions en Répétitions · FR-08-04 `00:00` n'est jamais une Cible · FR-08-05 Annuler ou valider une transition · FR-08-06 Aucun écran supplémentaire.

**ED-09 Bornes :** FR-09-01 Bornes de la Cible Durée · FR-09-02 Bornes de la Cible Répétitions · FR-09-03 Bornes de N, des Pauses, du Bip, du Compte à rebours et de la Fin · FR-09-04 Comportement des commandes − et + · FR-09-05 Valeurs historiques hors grille ou hors plage · FR-09-06 Indépendance des bornes et absence d'état partiel.

**ED-10 Tableau et Pied commun :** FR-10-01 Structure du tableau · FR-10-02 Une seule Cellule active · FR-10-03 Régler une cellule de Cible par le Sélecteur · FR-10-04 Ajuster la Cellule active par le Pied commun · FR-10-05 Valeurs numériques hors tableau · FR-10-06 Signaler une cellule à renseigner · FR-10-07 Réordonner une ligne par glisser · FR-10-08 Bip commun et ordre de la Feuille.

**ED-11 Brouillons et Modes :** FR-11-01 Travailler sur un Brouillon de Feuille · FR-11-02 Réserve jamais enregistrée · FR-11-03 Changer de Mode sans conversion · FR-11-04 Retrouver les Cibles d'un Mode en y revenant · FR-11-05 Valeurs initiales à la création · FR-11-06 Copies sans mutation partielle.

**ED-12 N, retrait, réordonnancement :** FR-12-01 Augmenter N · FR-12-02 Diminuer N · FR-12-03 Effets d'un déplacement de ligne · FR-12-04 N = 1 · FR-12-05 Supprimer une ligne par sa croix · FR-12-06 Affichage de N et recette des variations · FR-12-07 Compatibilité avec un N hérité d'un circuit de séries.

**ED-13 Calculs :** FR-13-01 Déterminer le travail de chaque Série · FR-13-02 Qualifier la nature de la Durée totale de l'Exercice · FR-13-03 Calculer le total partiel d'un mélange · FR-13-04 Appliquer les formules du total intrinsèque · FR-13-05 Distinguer l'omission de l'erreur de saisie · FR-13-06 Tirer les calculs des seules spécifications.

**ED-14 Total et Inversion :** FR-14-01 Afficher la ligne Durée totale de la Feuille selon le cas · FR-14-02 Restreindre l'Inversion du total · FR-14-03 Calculer N à partir d'une Durée totale choisie · FR-14-04 Signaler et annuler un ajustement · FR-14-05 Annoncer la nature du total à l'accessibilité.

**ED-15 Agrégation et cartes :** FR-15-01 Transporter le Mode et les Cibles typées dans la Copie en Séance · FR-15-02 Remplacer la seule Pause terminale par une Récupération positive · FR-15-03 Faire contribuer les Pauses d'un Exercice omis ou partiel · FR-15-04 Qualifier la nature du total de Séance et de Circuit · FR-15-05 Respecter le périmètre de chaque mesure de durée · FR-15-06 Afficher la durée et le résumé des nouvelles Cibles sur les cartes consommatrices · FR-15-07 Ne rien recalculer de l'historique.

**ED-16 Phrase :** FR-16-01 Générer la Phrase à l'affichage, sans la stocker · FR-16-02 Mettre en gras les valeurs et les unités · FR-16-03 Écrire les Cibles numériques selon les gabarits v15 · FR-16-04 Écrire la cadence du Bip · FR-16-05 Écrire la clause de Pause · FR-16-06 Écrire la clause des côtés · FR-16-07 Conserver le gabarit tout à l'échec · FR-16-08 Énumérer un mélange de 3 Cibles ou moins · FR-16-09 Compacter un mélange de plus de 3 Cibles · FR-16-10 Écrire la Durée totale dans la Phrase · FR-16-11 Afficher la Phrase en entier.

**ED-17 Format et corpus :** FR-17-01 Formater une durée · FR-17-02 Conserver les 276 phrases de référence · FR-17-03 Relire les anciennes entrées « À l’échec » · FR-17-04 Compléter le corpus par les variantes des cas nouveaux · FR-17-05 Afficher la Phrase la plus longue.

**ED-18 Persistance et migration :** FR-18-01 Deux Modes seulement dans les données · FR-18-02 Cible typée enregistrée de façon explicite · FR-18-03 Cible à renseigner refusée de façon atomique · FR-18-04 Régime et collection ordonnée enregistrés explicitement · FR-18-05 Aucun Brouillon ni aucune valeur dérivée enregistrés · FR-18-06 Bip enregistré et relu sans correction silencieuse · FR-18-07 Valeurs historiques relues sans arrondi · FR-18-08 Aller-retour exact d'une Définition d'Exercice · FR-18-09 Aller-retour exact d'une Copie en Séance · FR-18-10 Migration de l'Ancien mode À l'échec · FR-18-11 Conservation de tous les paramètres par la migration · FR-18-12 Définitions et Copies migrées, identités stables · FR-18-13 Aucune valeur factice · FR-18-14 Donnée ancienne invalide jamais convertie en échec · FR-18-15 Migration atomique, annulation complète en cas d'erreur structurelle · FR-18-16 Aucune réinitialisation des données · FR-18-17 Écriture seulement à l'enregistrement validé · FR-18-18 Échec d'écriture sans perte du Brouillon · FR-18-19 Preuve sur une vraie base SQLite contenant des données antérieures · FR-18-20 Exercices aux paramètres illisibles écartés par la migration (Q19).

**ED-19 Copies et Instantanés :** FR-19-01 Copie complète et isolée du Catalogue vers la Séance · FR-19-02 Paramètres d'exécution copiés à l'identique · FR-19-03 Édition d'une Copie en Séance sans synchronisation · FR-19-04 Propriétés propres à la Copie en Séance · FR-19-05 Copie groupée atomique et ordonnée · FR-19-06 Suppression d'une Définition sans effet sur les copies et l'historique · FR-19-07 Duplication d'un Exercice de Séance · FR-19-08 Toute duplication conserve l'état complet · FR-19-09 Copie d'une ligne à l'échec à l'augmentation de N · FR-19-10 Instantanés existants jamais réécrits, lus selon leur version · FR-19-11 Nouveaux Instantanés avec Cibles typées et Médias ordonnés · FR-19-12 Anciens résultats sans performance inventée · FR-19-13 Aucune écriture à l'annulation.

**ED-20 Catégorie et Zones :** FR-20-01 Ouverture sans perte du Brouillon · FR-20-02 Choisir une Catégorie · FR-20-03 Choisir des Zones corporelles · FR-20-04 Une Catégorie et au moins une Zone · FR-20-05 Liste longue · FR-20-06 Créer une entrée sans quitter le clavier · FR-20-07 Unicité et réactivation · FR-20-08 Appui long : modifier une entrée · FR-20-09 Supprimer une entrée · FR-20-10 Erreurs de référentiel et séparation des enregistrements · FR-20-11 Scénarios de recette des référentiels.

**ED-21 Médias :** FR-21-01 Ajouter un Média depuis l'Éditeur · FR-21-02 Galerie, ordre affiché et actions de consultation · FR-21-03 Import annulé ou en erreur · FR-21-04 Pas de lecture d'exécution · FR-21-05 Consulter un Média dans l'Éditeur (lecteur natif) · FR-21-50 Médias ordonnés, ordre conservé · FR-21-51 Fichiers hors base, référence stable · FR-21-52 Médias enregistrés avec l'Exercice · FR-21-53 Copies et duplications partagent les fichiers · FR-21-54 Retirer un Média ne retire que son lien · FR-21-55 Aucun fichier encore référencé supprimé · FR-21-56 Import annulé ou en erreur sans lien ni fichier orphelin · FR-21-57 Migration sans effet sur les Médias · FR-21-58 Média indisponible sans perte de lisibilité.

**ED-22 Fidélité et accessibilité :** FR-22-01 Conformité complète, état par état · FR-22-02 Trois preuves séparées · FR-22-03 Primitives natives · FR-22-04 Cibles tactiles · FR-22-05 Texte agrandi · FR-22-06 Largeurs d'écran · FR-22-07 VoiceOver dans l'Éditeur · FR-22-08 VoiceOver dans la Feuille et les Sélecteurs de cible · FR-22-09 Alternatives aux gestes · FR-22-10 Référentiels accessibles · FR-22-11 Surface ouverte et actions extérieures · FR-22-12 États, appuis et lexique.

### Exigences non fonctionnelles

NFR-01 Règles contre Figma · NFR-02 Primitives natives · NFR-03 Non-remplacement (mécanisme des primitives acceptées ; changements limités à ED-04, ED-03 avec P9 et P10, Q8 et Q14, ED-10 avec P11) · NFR-04 Preuve (tests ≠ recette visuelle ; validation par Hermann) · NFR-05 Préservation (exception Q19 ; valeur négative ou non entière illisible, Q28) · NFR-06 Pas de valeur inventée · NFR-07 Atomicité · NFR-08 Lexique (RM-092, apostrophe ’) · NFR-09 Accessibilité (44 × 44 pt, VoiceOver, texte agrandi, largeurs 360, 402 et 440) · NFR-10 Animations réduites · NFR-11 Contrôles `npm test`, `npx tsc --noEmit`, `npm run lint` · NFR-12 Persistance par repositories, `migration001` intouchable · NFR-13 Identifiants historiques non renommés · NFR-14 Ordre de lecture des sources.

### Exigences complémentaires (architecture)

- **Pas de starter :** projet existant (brownfield). La pile est figée par le lockfile de `c32e360d`, sans montée de version. Un `npm ci` dans ce clone est un préalable au développement.
- **AD-14 :** ordre de livraison. Imposé : un socle de données atomique et vert vient d'abord (types, lecteurs v1 et v2, projection unique, `migration010`, assertion de lecture, adaptation mécanique des consommateurs et des tests `TO_FAILURE`) ; S0 précède toute autre story d'interface de la Feuille ; aucune story ne dépend d'une story placée après elle. Indicatif : le Brouillon, les calculs et la Phrase, puis l'interface, puis les cartes. Le découpage ci-dessous s'en écarte, ce qu'AD-14 admet expressément (spine, « Contrainte obligatoire et ordre indicatif ») : calculs, Phrase et cartes (Epic 2) avant le Brouillon et l'interface (Epic 3), car ils ne dépendent que du socle ; S0 (3.1) avant le Brouillon (3.2), car il ne dépend d'aucun état du Brouillon.
- **AD-1 :** Cible `NUMBER | FAILURE | UNSET`. Le type `UNSET` hérité n'est écrit que par la migration ; une Cible `NUMBER` héritée positive hors bornes est conservée telle quelle (Q15, Q21, H25) ; une Cible négative ou non entière rend l'Exercice illisible (Q28). Le domaine est seul propriétaire du type.
- **AD-3 :** JSON v2 de forme figée ; lecteur v1 ; projection scalaire unique dans les repositories (première Cible `FAILURE` ou `UNSET` → NULL). Inventaire des lecteurs de scalaires à migrer (section dédiée de la spine). Instantanés lus en v1 et en v2.
- **AD-4 :** `migration010` dans la transaction existante. Prédicat d'illisibilité fermé (P44 amendée par Q28 : JSON non analysable, version inconnue, types impossibles, Mode ou `kind` inconnu, lignes incohérentes avec N, valeur non représentable de P45, valeur numérique négative ou non entière (Q28) ; valeurs positives hors bornes lisibles et conservées) ; étapes ordonnées ; sauvegarde de toutes les tables filles d'`activities` (`activity_body_zones`, `session_activity_media`) ; comptes avant et après ; `foreign_key_check` vide ; bornes de 004 reprises à l'identique ; table `migration_notices`.
- **AD-5 et AD-6 :** un seul calcul (`exact | estimated | lowerBound | omitted | incomplete`, `incomplete` pour une Cible à renseigner, qui porte le travail connu et les Pauses, Q30), un seul formateur de durée, rendu PRE-3 des totaux exacts et estimés conservé sur chaque carte (P41) et partiel en `≥` minutes et secondes sur les cartes Catalogue et Composition (Q20), un seul générateur de Phrase. Résumés compacts lus sur les Cibles typées.
- **AD-7 :** Popover SwiftUI de `@expo/ui` pour les choix et les roulettes, sous condition de la story S0. Roulettes existantes étendues par des props (`failureOption` typée). Garde-fous zéro `ScrollView` inchangés. Repli Android et web : les segmentés et roulettes existants.
- **AD-8 :** glisser PRE-3 conservé ; steppers permanents retirés ; Cellule active et Pied commun.
- **AD-9 :** copies et duplications par clonage profond ; aucun nouveau parcours.
- **AD-10 :** preuves sur `node:sqlite` réel. Base v9 construite par les migrations 001 à 009, puis alimentée en données anciennes. Corpus inchangé sur disque : oracle d'archives et encodage de test PRE-3, aux phrases identiques (P43).
- **AD-11 :** lexique ; jetons intouchés ; constante d'opacité partagée.
- **AD-12 :** avis de migration (`migration_notices`), lu par un seul composant à la racine ; acquitté seulement à l'appui sur son bouton (H24).
- **AD-13 :** `validateForSave(params, baseline)` ; niveau structurel = forme, types et entiers non négatifs, pas les bornes (P44 amendée par Q28) ; valeurs héritées positives non modifiées tolérées (H25).
- **AD-15 :** `openSurface` (au plus une surface ouverte, clé de surface anti-rappel tardif) et `activeCell` distincts ; table de transitions T1 à T27 (révisé après la revue ChatGPT R2 ; complété après la porte post-revue, M1 : `stepper(champ)` ouvert, Sélecteurs commun et du total, `Annuler` du retrait).
- **AD-16 :** mécanisme ± PRE-3 ratifié ; règle Q21 et P38 dans le domaine.
- **AD-17 :** consultation d'un Média dans l'Éditeur par le lecteur natif `expo-video` en plein écran natif, photo en plein écran ; sans lecture automatique ; aucun lien avec le moteur d'Exécution (Q27). Toucher la tuile consulte ; menu Retirer / Monter / Descendre à l'appui long, menu contextuel natif, actions VoiceOver conservées ; aucun bouton ajouté (Q31, D-335 amendée).
- **Q22 (tranchée) :** recette dans le dev client « Routine Dev » déjà installé sur l'iPhone ; compatibilité vérifiée en ouverture de la story S0 (3.1) avant la recette ; nouveau build signalé à Hermann si nécessaire (EAS exclu de la préparation actuelle, pas définitivement). Ne bloque pas les documents.
- **Q23 (tranchée) :** bouton de Mode retiré de la Carte Paramètres d'exécution ; Carte à zone touchable unique (4.2).

### Exigences de conception UX

Pas de document UX séparé. Les exigences d'interface sont portées par le PRD : FR-02-13 (relevé des propriétés visuelles, bloc par bloc, depuis les données Figma locales), FR-22-* (accessibilité) et la table des 32 frames de la section 4.22. Chaque story d'interface relève, avant développement, les propriétés de ses frames depuis `docs/preparation/PRE-4/figma/*.json.gz` et `fermeture-maitres-et-variables.json.gz`, sans tirer de règle d'un chiffre (NFR-01).

### Carte de couverture des FR

| Epic | FR couvertes |
|---|---|
| **E1** | FR-05-05 ; FR-06-02 (refus enregistrable, partie domaine et données) ; FR-06-06 ; FR-09-01, FR-09-02, FR-09-03, FR-09-05 (bornes et tolérance historique, domaine) ; FR-15-01 ; FR-15-07 ; FR-18-01 à FR-18-20 ; FR-19-01 à FR-19-13 ; FR-21-50 à FR-21-58 |
| **E2** | FR-13-01 à FR-13-06 ; FR-14-02, FR-14-03 (domaine) ; FR-15-02 à FR-15-06 ; FR-16-01 à FR-16-11 ; FR-17-01 à FR-17-05 |
| **E3** | FR-03-01 à FR-03-13 ; FR-04-01 à FR-04-05 ; FR-05-01 à FR-05-04 ; FR-06-01, FR-06-02 (interface), FR-06-03 à FR-06-05 ; FR-07-01 à FR-07-08 ; FR-08-01 à FR-08-06 ; FR-09-04, FR-09-06 (interface) ; FR-10-01 à FR-10-08 ; FR-11-01 à FR-11-06 ; FR-12-01 à FR-12-07 ; FR-14-01, FR-14-04, FR-14-05 ; FR-22-08, FR-22-11 (Feuille) |
| **E4** | FR-01-01 à FR-01-10 ; FR-02-01 à FR-02-13 ; FR-20-01 à FR-20-11 ; FR-21-01 à FR-21-05 ; FR-22-01 à FR-22-07, FR-22-09, FR-22-10, FR-22-12 |

Les NFR s'appliquent à toutes les stories. NFR-04, NFR-09 et NFR-14 sont rappelées dans les critères de chaque story d'interface.

## Liste des epics

### Epic 1 : Mes Exercices passent au modèle à Cible typée, sans perte

Après la mise à jour, Hermann retrouve tous ses Exercices, Copies en Séance, Médias et référentiels. Les anciens Exercices « À l'échec » deviennent des Exercices en Répétitions dont toutes les Cibles sont à l'échec. Les Exercices illisibles sont écartés et dénombrés (Q19). Les copies et les Instantanés portent les Cibles typées. L'application reste utilisable de bout en bout avec l'interface PRE-3, adaptée au minimum.
**FR couvertes :** voir la carte (E1). **Architecture :** AD-1, AD-3, AD-4, AD-9, AD-10, AD-12, AD-13, AD-14 (socle atomique d'abord).

### Epic 2 : Des durées et des phrases justes pour les Cibles à l'échec

Pour tout Exercice, y compris à Cibles mixtes ou tout à l'échec, l'application calcule la Durée totale exacte, estimée (≈), partielle (≥) ou omise. La Phrase des paramètres décrit les Cibles dans l'ordre. Les cartes Catalogue et Composition affichent la durée selon Q17, Q20 et P41, sans « 0 s » ni « 0 rép. ». Les 276 phrases de référence restent identiques.
**FR couvertes :** voir la carte (E2). **Architecture :** AD-5, AD-6, AD-10. S'appuie sur E1.

### Epic 3 : Régler chaque Série dans la Feuille Paramètres d'exécution

Dans la Feuille, Hermann choisit le Mode, le Changement de côté, l'Ordre des côtés et le Régime dans des popovers natifs ancrés. Il règle chaque Cible, numérique ou à l'échec, avec la roulette native, présentée centrée et sans flèche dans la couche `WheelPickerOverlay` de PRE-3 (Q37) : minutes-secondes en Durée, une colonne en Répétitions. Il gère le Tableau des séries variables par Cellule active et Pied commun, avec glisser, retrait et annulation. Aucun réglage n'est perdu en changeant de Mode ou de N.
**FR couvertes :** voir la carte (E3). **Architecture :** AD-2, AD-7, AD-8, AD-13, AD-15, AD-16. La story S0 (faisabilité du Popover sur appareil) ouvre l'epic, par la vérification de compatibilité du dev client « Routine Dev » (Q22). S'appuie sur E1 et E2.

### Epic 4 : Un Éditeur d'Exercice fini, fidèle et accessible

Les quatre Parcours d'édition passent par le même Éditeur. L'écran principal suit les références visuelles bloc par bloc (FR-02-13). Catégorie et Zones se gèrent sans perdre le clavier, et les Médias sont préservés et se consultent dans l'Éditeur par le lecteur natif (Q27). L'ensemble est accessible : VoiceOver, texte agrandi, largeurs 360, 402 et 440, alternatives aux gestes, cibles de 44 pt. La recette sur iPhone par Hermann clôt l'epic.
**FR couvertes :** voir la carte (E4). **Architecture :** AD-7, AD-9, AD-11, AD-17. S'appuie sur E1 à E3.

## Stories

Contenu complet des quatre epics, repris des parties sources `epics-parts/epic-1.md` à `epic-4.md` (ordre et dépendances fixés par `epics-parts/00-squelette.md`). Une story ne dépend que de stories antérieures : 1.1 → 1.2 → 1.3 → 1.4 → 2.1 → … → 4.6.

---

## Epic 1 : Mes Exercices passent au modèle à Cible typée, sans perte

Après la mise à jour, Hermann retrouve tous ses Exercices, Copies en Séance, Médias et référentiels. Les anciens Exercices « À l'échec » deviennent des Exercices en Répétitions dont toutes les Cibles sont à l'échec. Les Exercices illisibles sont écartés et dénombrés (Q19). Les copies et les Instantanés portent les Cibles typées. L'application reste utilisable de bout en bout avec l'interface PRE-3, adaptée au minimum.

**Architecture :** AD-1, AD-3, AD-4, AD-9, AD-10, AD-12, AD-13, AD-14 (socle atomique d'abord). **Ordre :** 1.1 → 1.2 → 1.3 → 1.4 (squelette `00-squelette.md`).

*Révision du 2026-10-17 (recette iPhone) : Q35 (Cible à renseigner signalée par un fond `#FFF1F0`, sans liseré ni contour, reporté dans le texte de 1.1 : jalon J6 et AC de la Définition migrée à Cible `UNSET`) ; Q36 (Cible Durée à la seconde, bornes 5..3535 inchangées, plus de multiple de 5) : AC6, tableau d'AC7, AC14 et « Hors story » corrigés.*

**Conventions de cet epic.**
- Les littéraux d'interface et de phrase sont écrits avec l'apostrophe typographique `’` (U+2019), comme le Corpus 276 et le lexique.
- « Base v9 » : base SQLite construite par `migration001` à `migration009` du code de départ, sur `node:sqlite` réel (`src/infrastructure/database/testing/NodeSqliteDatabase.ts`), puis alimentée en données anciennes par des `INSERT` directs (AD-10). Aucune simulation de la persistance.
- « Injection d'échec » : motif `FailingDatabase` existant (`src/infrastructure/database/__tests__/migrateDatabase.test.ts:1607`).
- Les scénarios de recette `R-1.M-xx` suivent le modèle de `docs/preparation/PRE-4/bmad/recette-iphone.md` §3. Ils sont exécutés par Hermann dans le dev client « Routine Dev » déjà installé sur l'iPhone (Q22), une fois sa compatibilité vérifiée en ouverture de la story 3.1 ; si un nouveau build est nécessaire, il est signalé à Hermann. Une suite verte n'est jamais une preuve visuelle ou tactile (NFR-04).

---

### Story 1.1 : Socle : Cible typée, format v2 et migration 010

En tant que Hermann (utilisateur de KODJO),
je veux que l'application passe au modèle « deux Modes, une Cible typée par Série » et que mes données existantes y soient converties sans perte ni valeur inventée,
afin que mes anciens Exercices « À l'échec » restent identiques à l'usage et que les fonctions suivantes de PRE-4 reposent sur un seul format de données.

**Exigences :** FR-05-05 (Mode à deux valeurs, conversion, carte « N séries à l’échec ») ; FR-06-02 (partie domaine et données) ; FR-09-01, FR-09-02, FR-09-03, FR-09-05 (bornes et tolérance historique, domaine) ; FR-15-01 (transport v2 dans `activities`, consommateurs à deux Modes) ; FR-15-07 (formules inchangées pour les Cibles numériques) ; FR-18-01 à FR-18-16 ; FR-18-20 (partie données) ; FR-21-57 ; vérifiées ici sans en être le porteur principal : FR-17-02, FR-17-03 (corpus 276 gardé vert par l'adaptation minimale, P43 ; porteur : 2.3), FR-19-06 (AC12 : écart des illisibles sans effet sur les copies ; porteur : 1.3), FR-19-09 (AC22 : transition mécanique de la Feuille PRE-3 ; porteur : 1.3) ; NFR-05, NFR-06, NFR-07, NFR-11, NFR-12, NFR-13 ; H6, H7, H21, H25 ; P3, P20, P22, P26 (gabarit tout à l'échec conservé), P28, P29, P43 (corpus : adaptation minimale), P44 (amendée par Q28), P45 et Q28 (prédicat d'illisibilité, voir AC9 et AC14).
**Architecture :** AD-1, AD-3, AD-4, AD-13, AD-14 (story atomique, non découpable), AD-10 (preuves) ; inventaire des lecteurs de scalaires de la spine (toutes les lignes). Fichiers principalement touchés (indicatif, le code fait foi) : `src/domain/activities/ExecutionParameters.ts`, `ExecutionParametersDraft.ts`, `executionCalculations.ts`, `executionPhrase.ts`, `ActivityDefinition.ts`, `exerciseSnapshot.ts` ; `src/domain/sessions/Session.ts`, `validation.ts`, `calculations.ts`, `SessionDraft.ts`, `composition.ts`, `errors.ts` ; `src/infrastructure/database/migrations/migration010.ts` (nouveau), `migrateDatabase.ts`, `constants.ts`, `types/DatabaseRows.ts`, `repositories/SqliteActivityDefinitionRepository.ts`, `repositories/SqliteSessionRepository.ts`, `repositories/SqliteMigrationNoticeRepository.ts` (nouveau, nom indicatif) ; `src/features/activities/ExecutionParametersSheet.tsx`, `ActivityEditorForm.tsx`, `ActivityCard.tsx` ; `src/features/sessions/ExerciseScreen.tsx`, `compositionPresentation.ts`, `SessionServiceProvider.tsx` ; `src/shared/i18n/` ; tests `TO_FAILURE` existants (au départ, le littéral est porté par 17 fichiers de test, dont le test du corpus traité à part en AC21, et par 19 fichiers de production ; relevé de la porte de préparation, à recompter à l'ouverture de la story).
**Dépend de :** rien.
**Hypothèses non validées :** H6, H7, H21, H24 (partie données), H25 — à confirmer par la revue ChatGPT/Hermann avant développement.

**Tâches indicatives et jalons internes (ordre conseillé).** La story reste atomique (AD-14) : une seule livraison, verte à la fin, et aucun jalon n'est livré seul. Chaque jalon est un point de contrôle local, consigné dans le fichier de la story (commande lancée, résultat) ; tant que le jalon J5 n'est pas atteint, l'arbre peut ne pas compiler hors des modules visés.
1. Types du domaine (AD-1) dans `ExecutionParameters.ts` ; réexport depuis `Session.ts` ; `LegacyExecutionMode` cantonné. **J1 :** tests unitaires d'AC1 verts (`npx jest src/domain/activities`, fichiers des types).
2. `readV1`, `readV2`, `serializeV2`, `ExecutionParametersDataError` (AD-3) ; `validateForSave(params, baseline)` aux deux niveaux (AD-13). **J2 :** tests d'AC2, AC3, AC5, AC6, AC7 verts.
3. `migration010` avec convertisseur figé embarqué, prédicat d'illisibilité (cas (a) à (c11) d'AC9), étapes 1 à 7 d'AD-4, table `migration_notices` ; `DATABASE_VERSION = 10`. **J3 :** tests `node:sqlite` d'AC9 à AC15 et AC17 verts (`npx jest src/infrastructure/database`).
4. Repositories : lecture `readV2` seule, écriture v2, projection scalaire unique ; `assertSessionAggregateRow` et revalidations alignées sur le nouveau CHECK ; repository des avis (exposé par `SessionServiceProvider`, sans affichage). **J4 :** tests d'AC16, AC18, AC19 et parité CHECK réel / assertion verts.
5. Adaptation mécanique de tous les consommateurs de l'inventaire (brouillon, calculs, phrase, Composition, Éditeur, copies) ; suppression de `formatExerciseRecap`, `formatExerciseDurationLine`, `projectLegacyScalars` et des chemins scalaires. **J5 :** `npx tsc --noEmit` vert sur tout l'arbre ; test de garde d'AC4 vert.
6. Interface minimale : segmenté Mode à 2 options ; Cible `FAILURE` affichée en lecture ; Cible `UNSET` affichée `—` sur fond `#FFF1F0` (`color.dangerSurface`), sans contour (Q35). **J6 :** tests de composants d'AC21 à AC24 verts.
7. Adaptation des tests `TO_FAILURE` ; tests nouveaux (parité, prédicat, migration, garde) ; trois contrôles. **J7 = livraison :** AC20 et AC25, `npm test`, `npx tsc --noEmit`, `npm run lint` verts.

**Critères d'acceptation :**

*A. Types et format (AD-1, AD-3)*

**AC1 — Deux Modes, Cible typée unique.**
**Given** le code livré **When** on recherche les définitions de type du Mode et de la Cible **Then** un seul type de Cible existe, `SeriesTarget` = `{ kind: "NUMBER", value }` | `{ kind: "FAILURE" }` | `{ kind: "UNSET" }`, défini dans `src/domain/activities/ExecutionParameters.ts` **And** le Mode d'un Exercice est `"DURATION" | "REPETITIONS"` seulement, réexporté par `Session.ts` **And** `LegacyExecutionMode` (`DURATION | REPETITIONS | TO_FAILURE`) n'apparaît que dans `readV1`, les types de ligne SQL (`DatabaseRows.ts`) et `migration010` **And** aucun module ne teste une Cible par `=== null` ni par une valeur numérique sentinelle (0 compris). *(FR-18-01, FR-18-02, FR-06-02 ; AD-1)*

**AC2 — Forme v2 figée et sérialiseur.**
**Given** les paramètres `{ mode: REPETITIONS, series: UNIFORM, count 3, target FAILURE, pause 10, sideMode UNILATERAL, sideOrder BY_SIDE, sideRecovery 0, Bip 2, countdown 0, end 0 }` **When** `serializeV2` les écrit **Then** la chaîne vaut exactement `{"version":2,"mode":"REPETITIONS","series":{"kind":"UNIFORM","count":3,"target":{"kind":"FAILURE"},"pauseSeconds":10},"sideMode":"UNILATERAL","sideOrder":"BY_SIDE","sideRecoverySeconds":0,"cadenceBeepIntervalSeconds":2,"countdownSeconds":0,"endSeconds":0}` (mêmes clés et même ordre que le sérialiseur v1, sans espace) **And** une Cible numérique s'écrit `{"kind":"NUMBER","value":30}` **And** en Régime variables, `series` vaut `{"kind":"VARIABLE","rows":[{"target":…,"pauseSeconds":…},…]}` sans aucun Bip par ligne **And** ni identité de ligne, ni Réserve, ni mémoire de Mode, ni phrase, ni total ne sont sérialisés. *(FR-18-02, FR-18-04 invariant du Bip, FR-18-05 ; P22 ; AD-3)*

**AC3 — Lecteurs v1 et v2.**
**Given** une chaîne v2 valide **When** `readV2` la lit **Then** elle renvoie les paramètres typés, et `serializeV2(readV2(s))` = `s` octet pour octet **And Given** une chaîne NULL, v1 ou de version inconnue **When** `readV2` la lit **Then** elle lève `ExecutionParametersDataError` **And Given** un JSON v1 `TO_FAILURE` à 3 Séries **When** `readV1` le lit **Then** il renvoie Répétitions, 3 Cibles `FAILURE`, Pauses, côtés et Bip inchangés **And Given** des scalaires sans JSON et sans Bip **When** `readV1` les lit **Then** Régime identiques, ordre `BY_SIDE` (« Un côté après l’autre »), Bip 0, Compte à rebours et Fin 0, N = max(`series_count`, 1). *(FR-18-01, FR-18-06 deuxième conséquence, FR-18-07 troisième conséquence ; AD-3)*

**AC4 — Garde de cantonnement.**
**Given** l'arbre `src/` et `app/` **When** le test de garde recherche le littéral `TO_FAILURE` dans le code (hors commentaires) et les imports de `readV1` **Then** `TO_FAILURE` n'apparaît que dans `readV1` (et son module de tests), `DatabaseRows.ts`, `migration010.ts`, les migrations historiques 003, 004 et 006 (inchangées), les tests de parité ou de migration, et le test du corpus `src/domain/activities/__tests__/executionPhrase.test.ts`, au seul endroit de son adaptation (minimale ici, AC21 ; explicite et nommée en 2.3 AC13) **And** `readV1` n'est importé que par les tests de parité et le lecteur d'Instantané v1 **And** `legacyExecutionParameters` et `resolveExecutionParameters` n'ont plus d'appelant de production. *(FR-18-01 ; AD-3)*

*B. Validation unique (AD-13)*

**AC5 — Niveau structurel, toujours appliqué : forme, types et nombres entiers non négatifs, pas les bornes (P44 amendée par Q28).**
**Given** `validateForSave(params, "STORAGE")` **When** les paramètres contiennent une Cible `UNSET` (héritée comprise), un Mode `TO_FAILURE` ou inconnu, un `kind` de Cible ou de Régime inconnu, une chaîne ou un booléen à la place d'un nombre, un Régime variables sans ligne, ou une valeur numérique négative ou non entière (Cible, Pause, Pause au changement de côté, Bip, Compte à rebours, Fin ; Q28 : aucune donnée de cette forme ne subsiste après la migration) **Then** chaque cas renvoie une violation en union discriminée, sans exception levée **And** une Cible `FAILURE` seule, une Cible Durée de 5999 s, une Cible Répétitions de 150, un Bip de 11, une Pause de 400 s hérités (valeurs **positives** hors bornes) sont acceptés à ce niveau : les bornes relèvent du niveau saisie (AC6), appliqué aux seules valeurs modifiées (AC7) **And** les contraintes de la base restent appliquées par le repository : une Copie en Séance dont la projection viole le CHECK d'`activities` (Durée 1..5999, Répétitions ≥ 1, Pauses et Récupération 0..5999, N ≥ 1) est refusée par `assertSessionAggregateRow`, sans écriture (P44, « dans la limite des contraintes de la base »). *(FR-06-02, FR-18-01, FR-18-02, FR-18-03 ; P44, Q28 ; AD-13)*

**AC6 — Niveau saisie, appliqué aux seules valeurs modifiées.**
**Given** une création (aucune ligne de base) **When** `validateForSave` évalue une Cible Durée **Then** 5, 7, 30, 31 et 3535 s sont acceptées ; 0, 1, 4, 3536, 3540 et 5999 s sont refusées (à la seconde, sans multiple de 5 : Q36) **And** une Cible Répétitions de 1 et 100 est acceptée ; 0, 101 et 1,5 sont refusées **And** N est accepté de 1 à 99 ; Pause après chaque série et Pause entre les côtés de 0 à 300 s ; Bip de 0 à 10 (−1, 11 et 2,5 refusés) ; Compte à rebours et Fin de 0 à 60 s. *(FR-09-01, FR-09-02, FR-09-03 ; FR-18-06 troisième conséquence ; AD-13)*

**AC7 — Tolérance historique (H25).**
**Given** une ligne de base relue avec Cible Durée 5999 s, ou Cible Répétitions 150, ou Bip 11 **When** `validateForSave(params, baseline)` évalue des paramètres où cette valeur est inchangée et où seul le nom, ou une Pause dans ses bornes, a changé **Then** aucune violation n'est renvoyée **And When** la valeur historique est modifiée **Then** seule la nouvelle valeur est soumise au niveau saisie, selon ce tableau unique :

| Champ (bornes de saisie) | Cas | Valeur évaluée | Verdict |
|---|---|---|---|
| Cible Répétitions (1..100) | ancienne valeur inchangée | 150 (seul le nom de l'Exercice, ou une Pause dans ses bornes, a changé) | tolérée (H25) |
| Cible Répétitions (1..100) | nouvelle valeur | 150 → 100 | valide |
| Cible Répétitions (1..100) | nouvelle valeur | 150 → 101 | refusée |
| Cible Répétitions (1..100) | nouvelle valeur | 150 → 120 | refusée |
| Cible Durée (5..3535, à la seconde, Q36) | ancienne valeur inchangée | 5999 | tolérée (H25) |
| Cible Durée (5..3535, à la seconde, Q36) | nouvelle valeur | 5999 → 5995 | refusée |
| Cible Durée (5..3535, à la seconde, Q36) | nouvelle valeur | 5999 → 3535 | valide |
| Bip (0..10) | ancienne valeur inchangée | 11 | toléré (H25) |
| Bip (0..10) | nouvelle valeur | 11 → 12 | refusé |
| Bip (0..10) | nouvelle valeur | 11 → 10 | valide |

**And** ni le renommage de l'Exercice ni la modification d'une Pause (ou de tout autre champ) ne transforment une valeur inchangée en nouvelle saisie : la comparaison se fait champ par champ avec la ligne de base **And** une Cible n'est tolérée que si le Mode est celui de la ligne de base **And** une Cible `UNSET` héritée est toujours une violation (bloque ✓ et `Terminer`). *(FR-09-05 huitième et neuvième conséquences, FR-18-06 quatrième conséquence, FR-18-07 deuxième conséquence, FR-18-14 quatrième conséquence ; H7, H25 ; AD-13)*

**AC8 — Appelants de la validation.**
**Given** le code livré **When** on recense les chemins de validation des Paramètres d'exécution **Then** le ✓ de la Feuille et `Terminer` (Catalogue et Séance) appellent `validateForSave` avec la ligne de base relue à l'ouverture de l'Éditeur (aucune base en création) **And** la validation de Séance au `Continuer` et les repositories l'appellent avec `"STORAGE"` **And** aucun autre chemin ne valide les paramètres (les chemins `validation.ts:579-617` et `ActivityDefinition.ts:250-333` sont supprimés) **And** une demande d'enregistrement refusée par le repository ne laisse aucune ligne, aucune Série, aucun lien Catégorie, Zone ou Média ajouté ou modifié (base relue identique, `node:sqlite`). *(FR-18-03, FR-09-06 troisième conséquence en données ; AD-13)*

*C. Migration 010 (AD-4)*

**AC9 — Prédicat d'illisibilité fermé, cas par cas (P44 amendée par Q28, P45, Q28).**
**Given** une base v9 contenant, pour chacun des cas (a) à (c9) et (c11), une Définition d'Exercice et une Copie en Séance, et pour le cas (c10) une Copie en Séance, dont les paramètres présentent : (a) un texte non analysable ; (b) un JSON de `version` 2 ou 7 ; (c1) une racine non objet (`[]`, `3`) ; (c2) une clé requise absente ; (c3) un type impossible : chaîne, booléen, objet ou tableau là où un nombre est attendu ; (c4) `mode` hors `DURATION | REPETITIONS | TO_FAILURE` ; (c5) `sideMode` ou `sideOrder` inconnu ; (c6) `series.kind` inconnu ; (c7) nombre de lignes incohérent avec N : `count` < 1 (aucune Série) ; (c8) `rows` absent, vide ou non tableau ; (c9) N non entier (P45) : `count` du JSON v1 à 2,5, et, dans une autre ligne sans JSON, `series_count` à 2,5 ; (c10) Copie en Séance seulement (P45) : JSON v1 lisible selon (a) à (c9) et (c11) dont la projection scalaire d'AD-3 violerait le nouveau CHECK d'`activities` (AC15) par une valeur **positive** hors bornes, un test pour une Cible Durée de première ligne à 6 000 s, un pour une Pause de première ligne à 6 000 s ; (c11) valeur numérique **négative ou non entière** (Q28), dans un JSON v1 ou dans les scalaires d'une ligne sans JSON, quelle que soit la ligne (première ou non) : un test par champ et par forme, Cible −3 et 7,5 ; Pause −5 et 2,5 (ligne 1 et ligne 2) ; Pause au changement de côté −5 et 2,5 ; Bip −1 et 2,5 ; Compte à rebours −3 ; Fin 1,5 ; et, sans JSON, `pause_seconds` −5, `side_recovery_seconds` 2,5, cible scalaire −3 **When** `migration010` s'exécute **Then** chacune de ces lignes est écartée et dénombrée dans l'avis (AC13), un test par cas, sans erreur structurelle ni annulation **And** les cas (c9), (c10) et (c11) sont classés à l'étape 1 d'AD-4, avant toute écriture **And** une Définition d'Exercice portant le même JSON que les Copies de (c10) n'est pas écartée (aucun CHECK composite sur `activity_definitions`, AC14) **And** aucune autre cause n'écarte une ligne : hors (c9) à (c11), une valeur numérique **positive** hors grille ou hors bornes est lisible et conservée (AC14) ; une Cible absente, `null` ou 0 devient `UNSET` (AC11, H7) et n'écarte pas la ligne **And** une ligne sans JSON (scalaires seuls) n'est écartée que pour un `series_count` non entier (c9) ou un scalaire négatif ou non entier (c11) **And** les scalaires d'une ligne qui porte un JSON sont ignorés pour la décision. *(FR-18-20 ; Q19, Q28, P44, P45 ; AD-4)*

**AC10 — Conversion de l'Ancien mode À l'échec.**
**Given** une base v9 contenant une Définition et une Copie en Séance en `TO_FAILURE`, l'une en JSON v1 uniforme à 3 Séries (Pause 10 s, Bip 2, côtés `RIGHT_LEFT`, ordre `BY_SERIES`, Pause au changement de côté 5 s, Compte à rebours 3 s, Fin 4 s), l'autre en JSON v1 variable à 2 lignes (Pauses 10 s et 20 s), et une Définition `TO_FAILURE` sans JSON (scalaires, `series_count` 3) **When** `migration010` s'exécute **Then** chacune est relue en Mode Répétitions, toutes ses Cibles `FAILURE`, sans aucune valeur numérique de Cible **And** le Régime, le nombre de Séries, l'ordre des lignes, les Pauses, le Bip, les côtés, l'ordre des côtés, la Pause au changement de côté, le Compte à rebours, la Fin, le nom, la description, la Catégorie, les Zones et les Médias ordonnés sont identiques avant et après **And** la Définition sans JSON est relue en Régime identiques, ordre `BY_SIDE`, Bip 0, N = 3 **And** aucune ligne d'`activity_definitions` ni d'`activities` ne garde `execution_mode = 'TO_FAILURE'`. *(FR-05-05 deuxième conséquence, FR-18-01 troisième conséquence, FR-18-10, FR-18-11, FR-18-12 première conséquence, FR-18-13 ; P28 ; AD-4)*

**AC11 — Données lisibles mais invalides conservées, jamais converties en échec.**
**Given** une base v9 contenant : une Définition Répétitions sans nombre et sans JSON ; une Définition Durée sans valeur et sans JSON ; une Définition en JSON v1 Durée dont la deuxième ligne variable a une cible 0, et une autre dont la cible est `null` ; une Définition Durée de 7 s, une de 3 s et une de 5999 s ; une Définition Bip 11 ; une Copie en Séance en JSON v1 dont une ligne non première porte 0 **When** `migration010` s'exécute **Then** les Cibles sans nombre, à 0 ou `null` sont relues `UNSET`, jamais `FAILURE`, et l'Exercice n'est pas écarté **And** 7 s, 3 s et 5999 s sont relues à 7, 3 et 5999 s, sans arrondi ni bornage **And** le Bip 11 est relu 11 **And** aucun nombre de répétitions n'est calculé à partir d'une durée et aucun 0 n'est écrit à la place d'une valeur absente. *(FR-09-05 première et deuxième conséquences, FR-18-07 première conséquence, FR-18-13 deuxième conséquence, FR-18-14 première et deuxième conséquences ; H7 ; AD-4)*

**AC12 — Écart des illisibles : intégrité, Séances et Médias.**
**Given** une base v9 contenant trois Définitions dont une illisible (avec Catégorie, 2 Zones et 2 Médias dont l'un partagé avec une Définition lisible) ; une Séance A de deux Copies dont la deuxième, illisible, est au milieu d'une zone de trois occurrences ; une Séance B dont toutes les Copies sont illisibles ; un Circuit (zone `IN_TOUR`) dont l'unique Copie est illisible ; une Copie lisible dont la Définition source est illisible **When** `migration010` s'exécute **Then** les deux Définitions lisibles sont présentes et migrées, la Définition illisible n'existe plus, et la migration réussit (`user_version` = 10, pas d'erreur de démarrage) **And** aucun lien `activity_definition_body_zones`, `activity_media`, `activity_body_zones` ni `session_activity_media` ne référence un Exercice absent **And** les Catégories, Zones et lignes `media_assets` sont toutes présentes et inchangées, y compris celles dont l'Exercice écarté était le seul utilisateur, et aucun fichier n'est supprimé ni lu par la migration **And** la Séance A existe avec son identifiant, ses paramètres et sa Copie lisible ; seule l'occurrence illisible est retirée avec sa Récupération (colonne de la ligne) ; les positions des occurrences restantes sont contiguës et dans le même ordre relatif **And** la Séance B et le Circuit vidé existent toujours, sans occurrence **And** la Copie lisible dont la source est écartée est intacte, et une Définition lisible n'est pas touchée par l'écart d'une de ses Copies **And** aucune table, ligne ni fichier de sauvegarde ou de quarantaine de l'Exercice écarté n'est créé. *(FR-18-12 troisième conséquence, FR-18-15 troisième conséquence, FR-18-16, FR-18-20 première à sixième et neuvième conséquences, FR-21-57 deuxième conséquence ; Q19, P29 ; AD-4)*

**AC13 — Avis de migration enregistré (sans affichage).**
**Given** la base de l'AC12 (une Définition et des Copies illisibles) **When** `migration010` s'exécute **Then** la table `migration_notices` existe avec exactement ce schéma (AD-12) : `id INTEGER PRIMARY KEY`, `kind TEXT NOT NULL`, `count INTEGER NOT NULL CHECK (count >= 1)`, `created_at TEXT NOT NULL`, `acknowledged_at TEXT` (nullable), les deux dates au format ISO 8601 UTC de `Date.prototype.toISOString()`, comme les colonnes `created_at` existantes **And** elle contient exactement une ligne, `kind = 'UNREADABLE_EXERCISES_DROPPED'`, `count` = nombre de Définitions + Copies en Séance écartées, date de création renseignée, date d'acquittement NULL **And** aucune colonne ne contient d'identifiant, de nom ni de contenu d'Exercice écarté **And Given** une base sans Exercice illisible **When** la migration s'exécute **Then** la table existe et ne contient aucune ligne **And** le repository des avis est exposé par le contexte de services de `SessionServiceProvider`, sans aucun lecteur d'interface dans cette story. Exemple : 1 Définition + 1 Copie illisibles → `count` = 2. *(FR-18-20 septième conséquence, partie données ; H24 ; AD-12)*

**AC14 — Valeurs numériques positives hors bornes lisibles et conservées, en JSON v1 comme en scalaires (Q28, Q15, Q21, H25 ; limites de P45).**
**Given** une Définition sans JSON dont `pause_seconds` vaut 400 (hors 0..300) ; une Définition en JSON v1 dont une Pause vaut 400 et dont la Pause au changement de côté vaut 400 ; une Définition en JSON v1 dont les Cibles Durée valent 7 s et 6 000 s ; une Définition en JSON v1 en Répétitions dont une Cible vaut 150 ; une Définition en JSON v1 dont le Compte à rebours vaut 90 s (hors 0..60) **When** `migration010` s'exécute **Then** aucune n'est écartée **And** chaque valeur est recopiée telle quelle dans le v2 : Pauses 400, Cibles `NUMBER` 7, 6 000 et 150, Compte à rebours 90, jamais `UNSET` ni `FAILURE` (seules une Cible absente, `null` ou 0 deviennent `UNSET`, AC11) **And** l'Éditeur les affiche telles quelles ; une valeur non modifiée est réenregistrée telle quelle, une valeur modifiée doit respecter les bornes de saisie (AC7, H25 ; Q36 : 7 s est désormais dans les bornes) **And** le convertisseur de `migration010` n'importe ni le sérialiseur ni les lecteurs du domaine (copie figée de l'adaptateur `ExecutionParameters.ts:395-415`) **And** cette conservation vaut pour les Définitions, qui n'ont pas de CHECK composite ; dans une Copie en Séance, une valeur positive hors bornes de saisie mais dans les bornes du CHECK est conservée de même (exemple testé : Copie en JSON v1 dont la Pause de la ligne 2 vaut 400 → conservée, Pause relue 400), alors qu'une Cible ou une Pause de première ligne dont la projection violerait le CHECK d'`activities` relève d'AC9 (c10) **And** une valeur négative ou non entière relève d'AC9 (c11), et un N non entier d'AC9 (c9), dans les deux tables : aucune n'est conservée, aucun calcul ne l'utilise (Q28). *(FR-18-14, FR-18-20 ; H7, H25, Q15, Q21, Q28, P45 ; AD-4)*

**AC15 — Reconstruction d'`activities`, CHECK et parité.**
**Given** une base v9 migrée **When** on compare le schéma d'`activities` avant et après **Then** colonnes, clés étrangères (dont `category_id` et les FK composites), unicité et index `activities_session_position_idx`, `session_activity_media_activity_idx`, `session_activity_media_asset_idx` sont identiques, seul le CHECK composite diffère **And** le nouveau CHECK reprend les bornes de 004 à l'identique (Durée 1..5999, Répétitions ≥ 1, Pauses et Récupération 0..5999, N ≥ 1), retire `TO_FAILURE`, admet une cible scalaire NULL en Durée et en Répétitions, refuse les deux cibles non nulles, et laisse la branche `RECOVERY` inchangée **And** les comptes de `activity_body_zones` et `session_activity_media` sont égaux avant et après, hors liens des illisibles **And** `PRAGMA foreign_key_check` est vide **And** un test de parité soumet les mêmes lignes au CHECK réel (`node:sqlite`) et à `assertSessionAggregateRow` et obtient le même verdict pour chacune **And** `activity_definitions` n'est pas reconstruite **And** `migration001.ts` est inchangé (`git diff` vide). *(FR-18-11, FR-18-16, FR-21-57 première conséquence ; NFR-12 ; AD-4)*

**AC16 — Projection scalaire unique.**
**Given** un enregistrement par repository **When** les paramètres sont VARIABLE en Durée `[FAILURE / 10 s, NUMBER 30 / 10 s]` **Then** `execution_mode` = `DURATION`, `duration_seconds` = NULL (jamais 30), `repetition_count` = NULL, `series_count` = 2, `pause_seconds` = 10 **And** pour UNIFORM Répétitions 12 × 3, `repetition_count` = 12, `duration_seconds` = NULL, `series_count` = 3 **And** la même projection est produite par `migration010` pour les lignes converties **And** les repositories renvoient des paramètres analysés (type du domaine), jamais la chaîne JSON ni les scalaires. *(FR-18-02, FR-18-04 ; AD-3)*

**AC17 — Atomicité et nouvelle tentative (erreur structurelle).**
**Given** la base v9 de l'AC12 (illisibles compris) **When** une erreur est injectée successivement à chaque écriture de `migration010` (lecture, suppression des illisibles, renumérotation, mise à jour des Définitions, recopie d'`activities`, restauration des tables filles, contrôle des comptes, création de `migration_notices`), puis par un schéma inattendu et par une seconde FK vers `activities` **Then** chaque fois la base relue est identique à son état de départ (tables, lignes, liens, Exercices illisibles compris, `user_version` = 9) et l'erreur remonte au comportement d'erreur de démarrage existant, sans repli silencieux **And When** la migration est relancée sur cette base sans injection **Then** elle réussit. *(FR-18-15 ; H6 ; AD-4)*

**AC18 — Aller-retour exact sur SQLite réelle.**
**Given** une base migrée (version 10) **When** on enregistre puis relit, après fermeture et réouverture de la base, une Définition d'Exercice et une Copie en Séance pour chaque combinaison Durée/Répétitions × identiques/variables, avec des Cibles toutes numériques, toutes à l'échec et mixtes (`[NUMBER, NUMBER, FAILURE]`, `[FAILURE, NUMBER, NUMBER]`, `[NUMBER, FAILURE, NUMBER]`), Bip, côtés, ordre des côtés, Pause au changement de côté, Compte à rebours, Fin, nom, description, Catégorie, Zones et Médias ordonnés **Then** l'Exercice relu est égal à l'Exercice enregistré, types et ordre compris **And** la Récupération de chaque Copie est relue exacte **And** un Exercice en Régime variables dont toutes les Cibles sont égales est relu en variables ; un Exercice en identiques est relu en identiques **And** le Bip relu est une valeur unique, aucune Série n'ayant un Bip différent **And** un échec injecté pendant l'enregistrement d'une Séance laisse la base dans son état précédent, sans lien Zone, Catégorie ou Média orphelin. *(FR-05-05 première conséquence, FR-06-02, FR-15-01 première conséquence, FR-18-02, FR-18-04, FR-18-08, FR-18-09 ; AD-10)*

**AC19 — Refus d'un troisième Mode à l'écriture.**
**Given** une base migrée **When** un appel de repository tente d'enregistrer une Définition ou une Copie avec le Mode `TO_FAILURE`, ou une Cible `UNSET` **Then** l'appel est refusé sans aucune écriture (base relue identique). *(FR-18-01 deuxième conséquence, FR-18-03 ; AD-1)*

*D. Consommateurs et interface minimale*

**AC20 — Consommateurs adaptés, sans régression numérique.**
**Given** l'inventaire des lecteurs de scalaires de la spine **When** la story est livrée **Then** chaque ligne de l'inventaire a reçu le sort indiqué (lecture de `executionParameters` obligatoire, scalaires non exposés, `formatExerciseRecap` et `formatExerciseDurationLine` supprimés avec leurs tests, égalité de brouillon de Composition par `executionParametersEqual`) **And** pour tout Exercice à Cibles toutes numériques, les montants et natures de Durée totale, les phrases et les résumés de carte attendus par les tests existants sont inchangés (seuls les tests `TO_FAILURE` sont réécrits en « Répétitions, toutes Cibles `FAILURE` », avec les mêmes attendus) **And** Composition, détail de Séance et calcul acceptent Durée et Répétitions sans troisième Mode. *(FR-15-01 deuxième conséquence, FR-15-07 deuxième conséquence ; AD-14)*

**AC21 — Exercice migré tout à l'échec : comportement observable inchangé.**
**Given** un ancien Exercice `TO_FAILURE` à 3 Séries, Pause 10 s, Bip 2, migré **When** Hermann l'ouvre dans l'Éditeur **Then** la Carte Paramètres d'exécution affiche la Phrase « **3 séries** menées jusqu’à l’échec » (gabarit tout à l'échec existant, sans clause de Bip) et aucune Durée totale **And** la carte Catalogue affiche le résumé de tout échec (« 3 séries à l’échec » selon FR-05-05 et P3 ; libellé confirmé par Hermann en Q24), sans ligne de durée, jamais « 0 s » ni « 0 rép. » ; le changement de ce texte dans le lexique (`fr.ts:380`, « {N} séries jusqu’à l’échec » → « {N} séries à l’échec ») est porté par cette story, et 2.4 AC4 le réutilise sans le modifier **And** dans la Feuille, le Mode affiché est `Répétitions` **And** les 276 phrases du corpus restent vertes : le test du corpus applique l'adaptation **minimale** nécessaire, lire chaque cas `TO_FAILURE` en Répétitions avec toutes ses Cibles `FAILURE`, avec le même attendu ; ni `docs/archives/evolutions-v15-2026-10-07/phrases-276.json` (oracle source) ni `docs/preparation/PRE-3/planification/attendus-phrases-276.json` (encodage de test, phrases identiques) ne sont modifiés (P43). L'adaptation explicite et nommée et le rejeu en Durée viennent en 2.3. *(FR-05-05 deuxième à quatrième conséquences, FR-18-10 deuxième conséquence ; P3, P26 ; AD-10)*

**AC22 — Feuille PRE-3 adaptée au minimum.**
**Given** la Feuille Paramètres d'exécution existante **When** Hermann ouvre le choix du Mode **Then** le segmenté propose exactement `Durée` puis `Répétitions`, sans option `À l’échec` (le segmenté est ensuite remplacé par le popover en 3.3) **And Given** un Exercice dont des Cibles sont `FAILURE` **When** la Feuille s'affiche **Then** la Cible commune (Régime identiques) et chaque cellule de Cible du tableau (Régime variables) affichent `à l’échec`, en lecture, sans stepper ni roulette, sans valeur numérique **And** l'en-tête de colonne reste celui du Mode (`Durée` ou `Répétitions`) et le tableau garde ses colonnes Cible et Pause **And** augmenter N quand la dernière ligne est à l'échec ajoute une ligne à l'échec avec la même Pause (transition mécanique du brouillon) **And** changer de Mode conserve les Cibles `FAILURE` **And** le libellé `À l’échec` disparaît de la liste des Modes du lexique (`sheet.modes`), et le texte `à l’échec` d'une Cible y reste présent (FR-05-04 : il désigne une Cible, jamais un Mode). *(FR-05-05, FR-06-02 ; FR-05-01 deuxième conséquence en lecture minimale ; AD-14 ; squelette 1.1)*

**AC23 — Cible à renseigner héritée dans l'interface existante.**
**Given** une Définition migrée dont la Cible est `UNSET` (ancienne Répétitions sans nombre) **When** Hermann l'ouvre **Then** la Cible affiche `—` sur le fond `#FFF1F0` (`color.dangerSurface`), sans contour (Q35), la Carte affiche le texte existant « Paramètres à compléter. », le ✓ de la Feuille et `Terminer` sont indisponibles **And When** il règle une Cible par la commande existante puis ✓ et `Terminer` **Then** l'Exercice est enregistré avec cette Cible `NUMBER` **And** à aucun moment la Cible n'est convertie en `FAILURE`. *(FR-06-02, FR-09-05 dixième conséquence, FR-18-14 première et quatrième conséquences ; H25)*

**AC24 — Exercice ancien hors bornes réenregistré sans modification.**
**Given** un Exercice ancien à Cible Durée 5999 s **When** Hermann change seulement son nom et touche `Terminer` **Then** l'Exercice est enregistré et la Cible relue vaut 5999 s **And Given** le même Exercice **When** il ouvre la Feuille et touche ✓ sans toucher la Cible **Then** ✓ est disponible et la Cible vaut toujours 5999 s **And Given** un Exercice ancien à Bip 11 **When** il change une Pause, touche ✓ puis `Terminer` **Then** le Bip relu vaut 11. *(FR-09-05 huitième conséquence, FR-18-06 quatrième conséquence, FR-18-07 deuxième conséquence, FR-18-14 quatrième conséquence ; H25)*

*E. Contrôles*

**AC25 — Trois contrôles verts, rien hors périmètre.**
**Given** la story terminée **When** on exécute `npm test`, `npx tsc --noEmit` et `npm run lint` **Then** les trois passent **And** les garde-fous zéro `ScrollView` iOS (`DurationWheelPicker.test.tsx`, `NumberWheelPicker.test.tsx`) et `tokensSpecification.test.ts` sont inchangés et verts **And** aucun jeton de `src/shared/ui/tokens.ts` n'est modifié **And** aucun identifiant historique n'est renommé (`ActivityDefinition`, `ACTIVITY`, `tour*`, `IN_TOUR`). *(NFR-11, NFR-13 ; AD-11)*

**Preuves attendues :**
- Tests unitaires du domaine : types, `serializeV2`, `readV1`, `readV2`, `validateForSave` aux deux niveaux avec ligne de base (AC1 à AC7) ; garde de cantonnement (AC4).
- Tests SQLite réelle `node:sqlite` : migration depuis une base v9 (AC9 à AC17), un test par cas du prédicat ; parité `readV2(sortie 010)` = `readV1(entrée)` et `serializeV2(readV2(sortie 010))` = sortie 010 octet pour octet, pour chaque fixture ; parité CHECK réel / `assertSessionAggregateRow` ; injection d'échec à chaque étape ; aller-retour après fermeture et réouverture (AC18, AC19).
- Tests de composants : segmenté à 2 options, cellules `à l’échec`, Cible `UNSET` (AC21 à AC24) ; corpus 276 vert.
- `npm test`, `npx tsc --noEmit`, `npm run lint` verts.
- Recette iPhone (dev client « Routine Dev », Q22 ; compatibilité vérifiée en ouverture de 3.1) :
  - **R-1.1-01** — Préconditions : installation PRE-4 sur données antérieures (procédure de la story 1.4). Gestes : Catalogue → ouvrir un ancien Exercice « À l’échec » → toucher la Carte Paramètres d'exécution → toucher le champ Mode. Attendu fonctionnel : Phrase « 3 séries menées jusqu’à l’échec » (FR-18-10, P3) ; Mode `Répétitions` ; deux options `Durée`, `Répétitions` (FR-05-01) ; Cibles `à l’échec` (FR-06-05) ; aucune Durée totale. Attendu visuel : rendu PRE-3 de la Feuille conservé (état transitoire, aucune frame Figma propre : NON VÉRIFIABLE) ; texte de cellule comparé à 8328:38848 et 8470:13303 pour le seul libellé `à l’échec`.
  - **R-1.1-02** — Préconditions : ancien Exercice à Cible Durée 5999 s ou Bip 11, si présent dans les données antérieures. Gestes : renommer → `Terminer` → rouvrir. Attendu fonctionnel : enregistré, valeur inchangée (H25, FR-18-07). Attendu visuel : NON VÉRIFIABLE (aucune frame propre).
  - **R-1.1-03** — Préconditions : carte Catalogue d'un ancien Exercice « À l’échec ». Attendu fonctionnel : « 3 séries à l’échec » (Q24), aucune ligne de durée, jamais « 0 s » ni « 0 rép. » (FR-05-05, Q17). Attendu visuel : cartes Catalogue existantes (ch. 13 l. 556).
  - Rappel : une suite verte n'est pas une preuve visuelle ou tactile (NFR-04) ; la validation appartient à Hermann.

**Hors story :**
- Popovers natifs, Sélecteur de cible avec option échec, grisé manipulable, passage d'une Cible à l'échec vers le numérique et inversement : E3 (3.3 à 3.6). **Entre 1.1 et 3.4, Hermann ne peut ni créer une Cible à l'échec, ni rendre numérique une Cible à l'échec migrée** ; seule la Cible `UNSET` se règle par les commandes existantes. Cette perte transitoire de fonction est assumée : aucune livraison n'a lieu avant la fin de PRE-4, et la recette porte sur la version finale.
- Roulette Durée bornée à 5..3535 s, à la seconde : 3.4. D'ici là, la roulette existante (pas 1 s, maximum 5999 s) peut proposer une valeur hors bornes qu'AC6 refuse (✓ indisponible), comportement transitoire signalé. *Q36 (2026-10-17) : la grille initiale « au pas de 5 » est levée ; seule la borne haute reste à appliquer.*
- `nearestGridValue` (bornage à 5..3535 depuis Q36), `stepTarget`, correction de `steppedValue`, maintien de la Cible Durée (Q21, P38, H19, AD-16 ; politique existante conservée depuis Q36) : E3.
- Nature `lowerBound`, calcul des Cibles mixtes, formateur unique, agrégation ≥ : E2 (2.1, 2.2). Dans 1.1, aucune donnée ni aucun geste ne produit de Cible mixte ; toute Cible `FAILURE` donne un total omis, comme l'ancien Mode.
- Phrase des Cibles mixtes, rejeu du corpus en Durée tout à l'échec, variantes : 2.3. Textes de carte H20 et H28 vérifiés : 2.4.
- Affichage de l'avis de migration et Séance vide visible : 1.2. Copies, duplications et Instantanés vérifiés de bout en bout : 1.3. Jeu de données v9 complet et procédure de recette : 1.4.
- Valeur numérique négative ou non entière (Cible, Pause, Pause au changement de côté, Bip, Compte à rebours, Fin), dans une Définition ou une Copie, quelle que soit la ligne : tranché par Q28 (Exercice écarté et dénombré selon Q19, AC9 (c11)). Valeur positive hors bornes : conservée (AC14), sauf en première ligne d'une Copie en Séance quand sa projection violerait le CHECK d'`activities` (P45, AC9 (c10)).

---

### Story 1.2 : Avis des Exercices écartés et Séance vide visible

En tant que Hermann (utilisateur de KODJO),
je veux être informé une fois du nombre d'Exercices illisibles écartés par la mise à jour, et retrouver mes Séances même si elles ont perdu tous leurs Exercices,
afin de savoir ce qui n'a pas pu être repris et de ne perdre aucune Séance.

**Exigences :** FR-18-20 (septième et huitième conséquences : signalement ; sixième conséquence : Séance vide visible et ouvrable) ; FR-18-16 (toutes les Séances présentes) ; NFR-04, NFR-08, NFR-09 ; Q19, H24, P39.
**Architecture :** AD-12, AD-11 ; piège `SQLiteProvider` (AGENTS.md). Fichiers principalement touchés (indicatif) : `src/features/migration/MigrationNoticeGate.tsx` (nouveau, emplacement indicatif), `app/_layout.tsx` (montage unique sous `SessionServiceProvider`), `src/features/sessions/SessionServiceProvider.tsx`, repository des avis de 1.1, `src/infrastructure/database/repositories/SqliteSessionRepository.ts` (lectures `:229-235` et liste `:470-475`, `JOIN activities`), `src/shared/i18n/`.
**Dépend de :** 1.1.
**Hypothèses non validées :** H24 (forme du signalement, texte singulier d'AC4 compris) — à confirmer par la revue ChatGPT/Hermann avant développement.

**Critères d'acceptation :**

**AC1 — Message unique au premier lancement après la migration.**
**Given** une base migrée dont `migration_notices` contient une ligne non acquittée `count` = 2 **When** l'application démarre **Then** une `Alert` native s'affiche une seule fois, avec le texte du lexique « 2 exercices illisibles n’ont pas pu être repris. » et un seul bouton de fermeture **And** aucun identifiant, nom ni contenu d'Exercice écarté n'est affiché. *(FR-18-20 septième et huitième conséquences ; H24 ; AD-12)*

**AC2 — Acquittement à l'appui, aucune réapparition.**
**Given** l'avis de l'AC1 affiché **When** Hermann touche le bouton **Then** le repository écrit la date d'acquittement **And When** l'application est relancée **Then** aucun avis ne s'affiche **And Given** l'application fermée avant l'appui sur le bouton **When** elle est relancée **Then** l'avis s'affiche de nouveau : il ne disparaît qu'une fois fermé par son bouton (H24 précisée ; AD-12). *(FR-18-20 huitième conséquence ; H24 ; AD-12)*

**AC3 — Aucun avis sans Exercice écarté.**
**Given** une migration qui n'a écarté aucun Exercice (table vide) **When** l'application démarre **Then** aucun avis ne s'affiche. *(FR-18-20 septième conséquence)*

**AC4 — Nombre singulier.**
**Given** une ligne non acquittée `count` = 1 **When** l'application démarre **Then** le texte, issu du lexique, indique le nombre 1 avec un accord grammatical correct. La forme exacte au singulier n'a pas de source : elle est proposée dans le lexique (par exemple « 1 exercice illisible n’a pas pu être repris. ») et validée par Hermann à la recette (H24 n'en donne que l'exemple au pluriel). *(FR-18-20 ; H24 ; NFR-08)*

**AC5 — Lecteur unique, montage sûr.**
**Given** le code livré **When** on recherche les lecteurs de `migration_notices` **Then** seul `MigrationNoticeGate`, monté une fois à la racine sous `SessionServiceProvider`, lit l'avis **And** il n'est pas passé en `children` de `SQLiteProvider` (piège de l'écran blanc, `SessionServiceProvider.test.tsx:36-47` reste vert) **And** le texte passe par une clé du lexique (RM-092). *(AD-12, AD-11 ; NFR-08)*

**AC6 — Séance sans occurrence visible dans la liste.**
**Given** une Séance dont toutes les Copies ont été écartées par la migration (Séance B de la story 1.1) **When** Hermann ouvre la liste des Séances **Then** la Séance y figure ; sa carte affiche « 0 exercice · {n} tours » et la durée « 0 min » (zéro au singulier, Q32 ; « 0 exercice · 0 min » est le résumé de Composition, visible à l'ouverture) **And** les autres Séances gardent leur résumé, leur ordre et leur durée inchangés. *(FR-18-20 sixième conséquence, FR-18-16 ; P39)*

**AC7 — Séance sans occurrence ouvrable.**
**Given** la même Séance **When** Hermann la touche **Then** l'écran existant de la Séance s'ouvre, sans Exercice et sans erreur **And** la lecture par identifiant renvoie la Séance avec ses paramètres et une composition vide, au lieu de l'absence actuelle due à `JOIN activities`. Les règles existantes d'enregistrement d'une Séance (au `Continuer`) sont inchangées. *(FR-18-20 sixième conséquence ; P39 ; Q4)*

**Preuves attendues :**
- Tests de composant de `MigrationNoticeGate` (avis présent, absent, acquitté, singulier) avec un repository de test ; test SQLite réelle du repository (écriture de l'acquittement, relecture).
- Tests `node:sqlite` de `SqliteSessionRepository` : liste et lecture d'une Séance sans occurrence, à partir de la base migrée de 1.1.
- `npm test`, `npx tsc --noEmit`, `npm run lint` verts.
- Recette iPhone (dev client « Routine Dev », Q22 ; compatibilité vérifiée en ouverture de 3.1) :
  - **R-1.2-01** — Préconditions : installation de départ contenant une Définition et une Copie illisibles (procédure de 1.4). Gestes : lancer l'application après mise à jour ; lire le message ; quitter l'application sans toucher le bouton ; relancer ; toucher le bouton ; relancer. Attendu fonctionnel : un message « 2 exercices illisibles n’ont pas pu être repris. », un bouton ; message de nouveau présent après la sortie sans fermeture ; plus de message après fermeture par le bouton (FR-18-20, H24). Attendu visuel : `Alert` native iOS, aucune frame Figma (NON VÉRIFIABLE).
  - **R-1.2-02** — Préconditions : Séance dont toutes les Copies étaient illisibles. Gestes : onglet des Séances → toucher la Séance. Attendu fonctionnel : Séance présente, carte « 0 exercice · {n} tours » et « 0 min » (Q32) ; elle s'ouvre vide, avec le résumé de Composition « 0 exercice · 0 min » (P39). Attendu visuel : rendu existant de la liste et de la Séance, aucune frame propre (NON VÉRIFIABLE).
  - Rappel NFR-04 : une suite verte ne vaut pas recette.

**Hors story :** toute refonte de Composition ou de l'écran de Séance (Q4) ; le comportement sur Android et sur le web de l'`Alert` n'est pas recetté (Q5).

---

### Story 1.3 : Copies, duplications et Instantanés à Cibles typées

En tant que Hermann (utilisateur de KODJO),
je veux que copier un Exercice dans une Séance, le dupliquer, en faire un Instantané ou annuler une édition conserve exactement ses Cibles typées, ses Médias et ses autres propriétés,
afin que mes Séances et mon historique restent fidèles, sans synchronisation cachée ni donnée perdue ou inventée.

**Exigences :** FR-05-05 (première conséquence : copie et Instantané) ; FR-06-06 ; FR-15-01 ; FR-15-07 (première conséquence) ; FR-18-17 ; FR-18-18 ; FR-19-01 à FR-19-13 ; FR-21-50 à FR-21-56 ; FR-21-58 ; NFR-05, NFR-06, NFR-07 ; H11, H12, H29 ; P8, P15, P27, P28, P36.
**Architecture :** AD-9, AD-3 (Instantanés), AD-13 (validation au `Continuer`). Fichiers principalement touchés (indicatif) : `src/domain/activities/ActivityDefinition.ts` (`activityDefinitionToDraftExercise`), `src/domain/sessions/composition.ts` (`duplicateActivity`), `SessionDraft.ts`, `src/domain/activities/exerciseSnapshot.ts`, `src/features/sessions/ExerciseScreen.tsx`, `CompositionScreen.tsx`, `src/domain/media/`, repositories de Séance, de Définitions et de Médias.
**Dépend de :** 1.1.
**Hypothèses non validées :** H11, H12, H29 — à confirmer par la revue ChatGPT/Hermann avant développement.

**Critères d'acceptation :**

**AC1 — Copie Catalogue → Séance complète.**
**Given** une Définition d'Exercice Durée, Régime variables, Cibles `[NUMBER 30, NUMBER 45, FAILURE]`, Pauses 10 s × 3, Bip 0, côtés `RIGHT_LEFT`, ordre `BY_SERIES`, Pause au changement de côté 5 s, Compte à rebours 3 s, Fin 4 s, une Catégorie, 2 Zones, 3 Médias ordonnés **When** elle est ajoutée à une Séance puis la Séance enregistrée au `Continuer` et relue **Then** la Copie porte le même nom, la même description, la même Catégorie, les mêmes Zones, les mêmes Médias dans le même ordre et des Paramètres d'exécution égaux champ par champ, types de Cible et ordre compris **And** sa Récupération vaut 0 **And** la Définition ne porte ni position de Séance ni Récupération. *(FR-05-05, FR-06-06, FR-15-01 première conséquence, FR-19-01 première conséquence, FR-19-02, FR-19-04 ; P27)*

**AC2 — Isolation dans les deux sens, clonage profond.**
**Given** la Copie de l'AC1 **When** on modifie la Définition (Cible, Pause, ordre) puis on relit la Copie **Then** la Copie est inchangée **And When** on modifie la Copie (Cible de la ligne 1, ordre des lignes, retrait d'un Média), puis `Terminer` et `Continuer` **Then** la Définition et les autres Copies sont inchangées et aucune collection mutable n'est partagée (modifier l'objet copié ne modifie pas l'objet source en mémoire). *(FR-19-01 deuxième et troisième conséquences, FR-19-02 troisième conséquence, FR-19-03, FR-21-54 ; AD-9)*

**AC3 — Copie groupée atomique et ordonnée (non-régression).**
**Given** trois Définitions sélectionnées dans la liste filtrée **When** la copie groupée réussit **Then** les Copies apparaissent dans l'ordre de présentation de la liste filtrée, chacune avec ses Cibles typées **And When** un échec est provoqué pendant la copie groupée **Then** la Composition est inchangée, sans sous-ensemble inséré. *(FR-19-05)*

**AC4 — Copie d'une Définition à Cible héritée à renseigner (H29).**
**Given** une Définition dont une Cible est `UNSET` **When** Hermann l'ajoute à une Séance **Then** la Copie entre dans le Brouillon de Composition avec sa Cible `UNSET`, jamais `FAILURE` **And When** il touche `Continuer` sans la renseigner **Then** l'enregistrement est refusé (comportement existant) et la base est inchangée. *(FR-06-02 ; H29 ; AD-13)*

**AC5 — Duplication d'un Exercice de Séance.**
**Given** une Copie en Séance à Cibles `[NUMBER 10, NUMBER 12, FAILURE]` en Répétitions, Récupération 40 s, Catégorie, Zones et 2 Médias **When** Hermann la duplique **Then** la nouvelle Copie a un identifiant différent, est placée immédiatement après la source, et porte des Paramètres d'exécution (types et ordre compris), une Récupération de 40 s, une Catégorie, des Zones et des Médias ordonnés égaux **And** le nombre de Définitions au Catalogue est inchangé **And** modifier l'une ne modifie pas l'autre. *(FR-19-07, FR-19-08 première conséquence)*

**AC6 — Duplications non offertes : sans objet.**
**Given** le code de départ, qui n'offre ni duplication de Séance ni duplication d'Exercice au Catalogue **When** la story est livrée **Then** aucun nouveau parcours de duplication n'existe (routes et actions inchangées) et les deuxième et troisième conséquences de FR-19-08 sont consignées sans objet dans le compte rendu de la story. *(FR-19-08 ; P36 ; Q4)*

**AC7 — Augmentation de N depuis une ligne à l'échec.**
**Given** un Exercice Répétitions, Régime variables, Cibles `[NUMBER 10, FAILURE]`, Pauses 10 s et 20 s (fixture de domaine ; Exercice migré tout à l'échec pour le parcours d'interface) **When** N passe de 2 à 3 **Then** la ligne ajoutée est `FAILURE`, avec une Pause de 20 s et sans valeur numérique **And** après `Terminer` et réouverture, elle est relue ainsi. *(FR-19-09)*

**AC8 — Suppression d'une source sans effet sur les copies.**
**Given** le code de départ, qui n'expose aucune suppression ni archivage de Définition (`ActivityDefinitionRepository.ts:7`) **When** la story est livrée **Then** le seul cas de disparition d'une source est l'écart par la migration, couvert en 1.1 (AC12 : Copie lisible intacte, Cibles typées et Médias compris) **And** FR-19-06 est consigné sans autre objet dans le compte rendu. *(FR-19-06 ; Q4)*

**AC9 — Instantanés v1 relus selon leur version, jamais réécrits.**
**Given** des enveloppes d'Instantané v1 en mémoire (H11) : l'une sans Bip, l'une en Ancien mode `TO_FAILURE` à 3 Séries avec `actualDurationSeconds` NULL, l'une avec `actualDurationSeconds` = 95 **When** elles sont relues après la migration et après modification de leur Définition source **Then** leur contenu sérialisé est identique octet pour octet à celui d'avant **And** l'Instantané sans Bip est lu avec un Bip 0 (non cadencé) **And** l'Instantané `TO_FAILURE` est lu sans erreur, en Répétitions avec 3 Cibles `FAILURE`, sans aucun nombre de répétitions **And** `actualDurationSeconds` NULL reste NULL (jamais 0) et 95 reste 95, sans recalcul depuis la source. *(FR-15-07 première conséquence, FR-19-10, FR-19-12 ; H11, P28 ; AD-3)*

**AC10 — Nouveaux Instantanés typés et immuables.**
**Given** une Copie à Cibles `[NUMBER 30, FAILURE, NUMBER 45]`, côtés `RIGHT_LEFT`, Bip 2, 3 Médias ordonnés **When** un Instantané est créé puis relu **Then** sa version est 2, il restitue les mêmes types, valeurs, ordre et Bip (une seule valeur de Bip pour toutes les Séries et les deux côtés) **And** il restitue les Médias dans leur ordre, par référence, sans copie de fichier **And** modifier ensuite la Copie ne change pas l'Instantané relu (objet gelé). *(FR-05-05, FR-06-06, FR-19-11 ; AD-3)*

**AC11 — Aucune écriture à l'annulation ni avant l'enregistrement validé.**
**Given** chacun des quatre Parcours d'édition **When** Hermann modifie des paramètres, touche ✓ de la Feuille puis ferme l'application sans `Terminer`, ou touche ✕ de la Feuille, ou abandonne l'Éditeur avec confirmation **Then** la base relue est identique à son état d'avant ouverture, et aucun fichier de Média encore référencé n'est supprimé **And** après ✕ de la Feuille, le Brouillon de l'Éditeur garde ses paramètres d'avant ouverture **And** en Séance, `Terminer` n'écrit que dans le Brouillon de Composition ; la Copie n'est écrite en base qu'au `Continuer`. *(FR-18-17, FR-19-13 ; P8)*

**AC12 — Échec d'écriture sans perte du Brouillon.**
**Given** une Définition modifiée dans l'Éditeur **When** une erreur d'écriture est injectée à `Terminer` **Then** la base est inchangée, l'Éditeur reste affiché avec toutes les valeurs saisies, et une nouvelle tentative réussie les enregistre **And Given** une Définition supprimée en base entre l'ouverture et `Terminer` (par le test) **When** Hermann touche `Terminer` **Then** une erreur est signalée et aucune Définition n'est recréée. *(FR-18-18)*

**AC13 — Médias ordonnés, référencés, jamais supprimés s'ils sont référencés.**
**Given** un Exercice avec 3 Médias **When** on importe un quatrième, réordonne, touche `Terminer` et rouvre **Then** les Médias sont relus dans l'ordre affiché avant `Terminer`, avec la même identité, sans deux positions égales, et la vignette de carte utilise le premier **And** avant `Terminer`, aucun lien du Média ajouté n'existe en base ; après, tous existent dans l'ordre du Brouillon **And** la base ne contient aucun contenu de fichier, et chaque référence pointe vers un fichier existant, inchangée depuis l'import **And** réordonner les Médias d'un Exercice ne change pas l'ordre de ceux de sa copie **And** après copie Catalogue → Séance ou duplication, le nombre de fichiers de Médias est inchangé et la copie référence les mêmes fichiers dans le même ordre. *(FR-21-50, FR-21-51, FR-21-52, FR-21-53)*

**AC14 — Fichiers référencés conservés en toutes circonstances.**
**Given** un fichier référencé par une Définition, une Copie, un Instantané seul, ou un Exercice ou une Séance archivés (H12) **When** on exécute chacune des opérations de PRE-4 (enregistrement, retrait d'un Média d'un autre Exercice, abandon, migration) **Then** le fichier existe toujours **And** retirer un Média d'une Copie puis `Continuer` ne retire que ce lien : la Définition source et les autres Copies le gardent, et le fichier existe. *(FR-21-54, FR-21-55, FR-19-13 deuxième conséquence ; H12)*

**AC15 — Import annulé ou en erreur (non-régression PRE-3).**
**Given** un Exercice à 2 Médias **When** un import est annulé puis `Terminer` **Then** l'Exercice relu a les mêmes 2 Médias **And When** un import échoue, puis un réessai réussit, puis `Terminer` **Then** l'Exercice relu a 3 Médias, le nouveau en dernière position, sans lien ni fichier référencé orphelin. *(FR-21-56 ; P18)*

**AC16 — Média indisponible.**
**Given** un Exercice, une Copie et un Instantané dont un fichier de Média a disparu **When** ils sont relus **Then** la lecture réussit avec tous les autres paramètres et tous les liens de Médias, et le lien du fichier disparu n'est pas supprimé. *(FR-21-58)*

**AC17 — Réouverture d'une Copie : mêmes Cibles, même montant.**
**Given** une Copie en Séance enregistrée **When** elle est rouverte dans l'Éditeur **Then** elle a les mêmes Mode et Cibles typées, et la Durée totale affichée est produite par la même fonction de calcul que pour une Définition aux mêmes paramètres (même montant, même nature). *(FR-15-01 troisième et quatrième conséquences)*

**Preuves attendues :**
- Tests unitaires du domaine : clonage profond de `activityDefinitionToDraftExercise` et `duplicateActivity`, transition N + 1, Instantanés v1 et v2.
- Tests SQLite réelle `node:sqlite` : copie, `Continuer`, duplication, réouverture, injection d'échec à `Terminer` et au `Continuer`, Médias et comptes de fichiers (fichiers simulés par un magasin de test dont on compte les appels de suppression).
- Tests d'intégration `*.integration.test.tsx` : quatre Parcours d'édition avec ✕, abandon et fermeture sans `Terminer` (AC11).
- `npm test`, `npx tsc --noEmit`, `npm run lint` verts.
- Recette iPhone (dev client « Routine Dev », Q22 ; compatibilité vérifiée en ouverture de 3.1) :
  - **R-1.3-01** — Préconditions : ancien Exercice « À l’échec » migré, avec Médias. Gestes : Composition → `Ajouter un exercice` → le choisir → ouvrir la Copie → changer une Pause → `Terminer` → `Continuer` → rouvrir la Définition au Catalogue. Attendu fonctionnel : Copie à Cibles `à l’échec` et Médias dans le même ordre ; Définition inchangée (FR-19-01, FR-19-03). Attendu visuel : rendu existant de Composition et de l'Éditeur ; aucune frame propre à la copie (NON VÉRIFIABLE).
  - **R-1.3-02** — Gestes : dupliquer cette Copie dans Composition. Attendu fonctionnel : nouvelle Copie juste après la source, mêmes Cibles, Récupération et Médias ; Catalogue inchangé (FR-19-07). Attendu visuel : NON VÉRIFIABLE.
  - **R-1.3-03** — Gestes : ouvrir la Feuille d'un Exercice, modifier, ✓, puis quitter l'Éditeur par abandon confirmé ; rouvrir. Attendu fonctionnel : rien n'a changé (FR-18-17). Attendu visuel : dialogue d'abandon existant.
  - Rappel NFR-04.

**Hors story :** l'adaptation d'une Copie à un circuit de séries et les relevés qualifiés (Composition, moteur, hors périmètre) ; le calcul des natures `lowerBound` (E2) : AC17 n'exige que l'identité du calcul ; l'interface des Médias dans l'Éditeur (4.4).

---

### Story 1.4 : Preuve de préservation sur une base antérieure réelle

En tant que Hermann (utilisateur de KODJO),
je veux une preuve, sur une vraie base SQLite contenant des données d'avant PRE-4, que la migration conserve tout ce qui est lisible, écarte proprement l'illisible et s'annule entièrement en cas d'erreur, ainsi qu'une procédure pour préparer ces données sur mon iPhone,
afin de pouvoir installer PRE-4 sur mes données réelles en confiance et de recetter la préservation moi-même.

**Exigences :** FR-18-19 ; FR-18-10 à FR-18-16 (dont FR-18-13, aucune valeur factice, AC2), FR-18-20, FR-21-57 (vérifiés sur le jeu complet) ; FR-18-08, FR-18-09 (relus après réouverture) ; NFR-04, NFR-05, NFR-06 ; Q5, Q6, Q19, Q22, Q28 ; P29.
**Architecture :** AD-10, AD-4. Fichiers principalement touchés (indicatif) : un module de fixture de base v9 sous `src/infrastructure/database/__tests__/` (ou `testing/`), un test d'intégration de migration ; `docs/preparation/PRE-4/bmad/recette-iphone.md` §2 (procédure) ; aucun code de production nouveau.
**Dépend de :** 1.1, 1.2, 1.3.
**Hypothèses non validées :** H21 — à confirmer par la revue ChatGPT/Hermann avant développement.

**Critères d'acceptation :**

**AC1 — Jeu de données v9 complet.**
**Given** une base fichier `node:sqlite` construite par `migration001` à `migration009` **When** la fixture l'alimente **Then** elle contient au moins : des Définitions et des Copies en Séance en Ancien mode À l'échec, en JSON v1 et en scalaires seuls, uniformes et variables ; des Exercices en Durée et en Répétitions avec côtés bilatéraux, Bip, Pauses, Catégorie, plusieurs Zones et plusieurs Médias ordonnés ; des Médias partagés entre une Définition et une Copie ; des données anciennes sans Bip ni Régime explicite ; des valeurs positives hors grille ou hors bornes, conservées (Durée 7 s et 5999 s, Répétitions 150, Bip 11) ; une Définition Répétitions sans nombre ; des Récupérations, une zone `IN_TOUR` et plusieurs Séances **And** la fixture consigne, avant migration, le compte de chaque table et la liste des identifiants. *(FR-18-19 premier critère ; AD-10)*

**AC2 — Migration du jeu complet : tout le lisible est conservé.**
**Given** la base de l'AC1 **When** `migration010` s'exécute **Then** FR-18-10 à FR-18-14 et FR-21-57 sont vérifiés sur chaque Exercice : Mode et Cibles convertis selon 1.1, tous les autres paramètres identiques **And** les comptes après migration sont égaux aux comptes avant pour `sessions`, `activity_definitions`, `activities`, `categories`, les Zones, `media_assets`, `activity_media`, `session_activity_media` et les tables de Zones liées **And** l'ensemble des identifiants est identique **And** `migration_notices` est vide. *(FR-18-11, FR-18-12, FR-18-16, FR-18-19 troisième critère, FR-21-57 ; H21)*

**AC3 — Variante avec illisibles.**
**Given** la base de l'AC1 complétée d'au moins une Définition et une Copie illisibles parmi des Exercices lisibles, avec Catégorie, Zones et Médias dont l'un est partagé avec un Exercice lisible, et d'une Définition et d'une Copie portant une valeur négative ou non entière (Pause −5 en ligne 2 ; Bip 2,5), illisibles selon Q28 **When** `migration010` s'exécute **Then** FR-18-20 est vérifiée : les comptes après migration valent les comptes avant moins exactement les Exercices écartés et leurs liens ; les Catégories, Zones, `media_assets` et toutes les Séances sont présents (une Séance dont l'occurrence est retirée est conservée, P39) ; aucun lien orphelin ; `migration_notices` contient `count` = 4 (2 illisibles de structure + 2 selon Q28) ; les valeurs positives hors bornes de l'AC1 sont conservées. *(FR-18-19 deuxième et troisième critères, FR-18-20 ; Q19, Q28)*

**AC4 — Annulation sur le jeu complet.**
**Given** la variante de l'AC3 **When** une erreur structurelle est injectée pendant la migration **Then** l'état relu est identique à l'état de départ, Exercices illisibles compris, `user_version` = 9. *(FR-18-19 quatrième critère, FR-18-15)*

**AC5 — Allers-retours relus depuis la base.**
**Given** la base migrée de l'AC2 **When** on enregistre une Définition et une Séance (Cibles mixtes, Médias ordonnés), on ferme la base, puis on la rouvre **Then** les valeurs relues proviennent de la base rouverte (nouvelle connexion, aucun état en mémoire) et sont égales à celles enregistrées. *(FR-18-19 cinquième critère, FR-18-08, FR-18-09)*

**AC6 — Procédure de préparation des données de recette.**
**Given** `docs/preparation/PRE-4/bmad/recette-iphone.md` §2 **When** la story est livrée **Then** la section décrit pas à pas : (1) le chargement de la version de départ `c32e360d` dans le dev client « Routine Dev » déjà installé sur l'iPhone, par `npx expo start` depuis ce clone (Q22) ; (2) la création, par l'interface de cette version, de chaque donnée de la liste du §2 (Exercices `À l’échec` en Durée et en Répétitions, Régimes identiques et variables, Pauses et Bip, Copies en Séance, Médias ordonnés, Catégories et Zones), avec les valeurs exactes à saisir ; (3) la production d'au moins une Définition et une Copie aux paramètres illisibles (Q19), par un moyen qui ne laisse aucun code dans la branche livrée et qui est décrit précisément ; (4) le relevé, avant mise à jour, des données présentes (comptes visibles, liste des Exercices et Séances) ; (5) le chargement de la version PRE-4 dans le même dev client, sans réinstallation ni effacement des données **And** la procédure indique qu'elle n'est exécutée qu'après la vérification de compatibilité du dev client faite en ouverture de la story 3.1 (Q22) ; si un nouveau build est nécessaire, elle s'arrête et le signale à Hermann **And** aucune mesure (durée de migration, temps) n'y est inscrite si elle n'a pas été observée (Q6). *(FR-18-19 sixième critère, FR-18-16 ; P29, Q5, Q6, Q22)*

**AC7 — Scénarios de recette de la préservation.**
**Given** la procédure de l'AC6 **When** la story est livrée **Then** `recette-iphone.md` contient les scénarios R-1.4-01 à R-1.4-03 ci-dessous, et rappelle les scénarios R-1.1-xx, R-1.2-xx et R-1.3-xx qui utilisent ces données. *(FR-18-19 ; Q5)*

**Preuves attendues :**
- Test d'intégration de migration sur base fichier `node:sqlite` réelle (AC1 à AC5), relu après fermeture et réouverture ; aucune simulation de la persistance.
- `npm test`, `npx tsc --noEmit`, `npm run lint` verts.
- Recette iPhone (dev client « Routine Dev », Q22 ; compatibilité vérifiée en ouverture de 3.1) :
  - **R-1.4-01** — Préconditions : données préparées selon l'AC6, relevé fait. Gestes : charger PRE-4 dans le dev client (procédure de l'AC6) ; lancer ; parcourir Catalogue, Séances, chaque Exercice relevé, ses Médias, ses Catégorie et Zones. Attendu fonctionnel : toutes les Séances, Catégories, Zones et fichiers de Médias présents ; toutes les Définitions et Copies lisibles présentes, avec leurs paramètres ; anciens Exercices « À l’échec » en Répétitions, Cibles `à l’échec` (FR-18-16, FR-18-10). Attendu visuel : rendu existant ; aucune frame propre (NON VÉRIFIABLE).
  - **R-1.4-02** — Préconditions : données avec Exercices illisibles. Attendu fonctionnel : message de 1.2 avec le bon nombre ; Exercices illisibles absents ; leurs Séances présentes ; Médias partagés toujours visibles depuis l'Exercice lisible (FR-18-20). Attendu visuel : `Alert` native (NON VÉRIFIABLE).
  - **R-1.4-03** — Attendu fonctionnel : aucune réinitialisation ; un Exercice ancien modifié puis `Terminer` est relu modifié et le reste est intact (FR-18-16, FR-18-08).
  - Rappel NFR-04 : une suite verte ne vaut pas recette ; la validation appartient à Hermann.

**Hors story :** la durée de la migration sur une base réelle (aucune mesure disponible ; à observer en recette, sans chiffre fabriqué) ; la publication EAS (exclue de la préparation actuelle, Q5, Q22).

---

#### Couverture E1

| FR | Story / AC |
|---|---|
| FR-05-05 | 1.1 AC1, AC10, AC18, AC21, AC22 ; 1.3 AC1, AC10 |
| FR-06-02 (domaine, données) | 1.1 AC1, AC5, AC18, AC22, AC23 ; 1.3 AC4 |
| FR-06-06 | 1.3 AC1, AC10 |
| FR-09-01 | 1.1 AC6 |
| FR-09-02 | 1.1 AC6 |
| FR-09-03 | 1.1 AC6 |
| FR-09-05 (domaine) | 1.1 AC7, AC11, AC23, AC24 |
| FR-15-01 | 1.1 AC18, AC20 ; 1.3 AC1, AC17 |
| FR-15-07 | 1.1 AC20 ; 1.3 AC9 |
| FR-18-01 | 1.1 AC1, AC3, AC4, AC5, AC10, AC19 |
| FR-18-02 | 1.1 AC1, AC2, AC5, AC16, AC18 |
| FR-18-03 | 1.1 AC5, AC8, AC19 |
| FR-18-04 | 1.1 AC2, AC16, AC18 |
| FR-18-05 | 1.1 AC2 |
| FR-18-06 | 1.1 AC3, AC6, AC7, AC24 |
| FR-18-07 | 1.1 AC3, AC7, AC11, AC24 |
| FR-18-08 | 1.1 AC18 ; 1.4 AC5 |
| FR-18-09 | 1.1 AC18 ; 1.4 AC5 |
| FR-18-10 | 1.1 AC10, AC21 ; 1.4 AC2 |
| FR-18-11 | 1.1 AC10, AC15 ; 1.4 AC2 |
| FR-18-12 | 1.1 AC10, AC12 ; 1.4 AC2 |
| FR-18-13 | 1.1 AC10, AC11 ; 1.4 AC2 |
| FR-18-14 | 1.1 AC7, AC11, AC14, AC23, AC24 ; 1.4 AC2 |
| FR-18-15 | 1.1 AC12, AC17 ; 1.4 AC4 |
| FR-18-16 | 1.1 AC12, AC15 ; 1.2 AC6 ; 1.4 AC2, AC6 |
| FR-18-17 | 1.3 AC11 |
| FR-18-18 | 1.3 AC12 |
| FR-18-19 | 1.4 AC1 à AC7 |
| FR-18-20 | 1.1 AC9, AC12, AC13, AC14 ; 1.2 AC1 à AC7 ; 1.4 AC3 |
| FR-19-01 | 1.3 AC1, AC2 |
| FR-19-02 | 1.3 AC1, AC2 |
| FR-19-03 | 1.3 AC2 |
| FR-19-04 | 1.3 AC1 |
| FR-19-05 | 1.3 AC3 |
| FR-19-06 | 1.3 AC8 (avec 1.1 AC12) |
| FR-19-07 | 1.3 AC5 |
| FR-19-08 | 1.3 AC5, AC6 |
| FR-19-09 | 1.3 AC7 (et 1.1 AC22, transition mécanique) |
| FR-19-10 | 1.3 AC9 |
| FR-19-11 | 1.3 AC10 |
| FR-19-12 | 1.3 AC9 |
| FR-19-13 | 1.3 AC11, AC14 |
| FR-21-50 | 1.3 AC13 |
| FR-21-51 | 1.3 AC13 |
| FR-21-52 | 1.3 AC13 |
| FR-21-53 | 1.3 AC13 |
| FR-21-54 | 1.3 AC2, AC14 |
| FR-21-55 | 1.3 AC14 |
| FR-21-56 | 1.3 AC15 |
| FR-21-57 | 1.1 AC12, AC15 ; 1.4 AC2 |
| FR-21-58 | 1.3 AC16 |

<!-- FIN EPIC 1 -->

---

## Epic 2 : Des durées et des phrases justes pour les Cibles à l'échec

**Objectif.** Pour tout Exercice, y compris à Cibles mixtes ou tout à l'échec, l'application calcule la Durée totale exacte, estimée (≈), partielle (≥) ou omise, avec un seul calcul et un seul formateur (AD-5). La Séance et le Circuit prennent la nature la plus faible de leurs contributions. Les Pauses d'un Exercice omis y contribuent toujours, et une Récupération positive remplace seulement la Pause terminale. La Phrase des paramètres décrit les Cibles dans l'ordre (Q16) avec un seul générateur (AD-6). Les 276 phrases de référence restent identiques, et des variantes couvrent les cas nouveaux (AD-10). Les cartes Catalogue et Composition affichent la durée selon Q17, Q20 et P41, sans « 0 s » ni « 0 rép. ».

**S'appuie sur :** Epic 1, en particulier 1.1 (type `SeriesTarget` `NUMBER | FAILURE | UNSET`, Mode à deux valeurs, lecteurs v1 et v2, `validateForSave` structurel, adaptation mécanique des consommateurs) et 1.3 (copies, duplications et Instantanés à Cibles typées).

**Conventions de l'epic.**
- Les attendus chiffrés sont recalculés **par formule dans le test**, jamais par `executionCalculations` ni repris d'une capture Figma ou d'Excel (AD-10, FR-13-06, FR-17-02, D-300).
- Les gabarits sont cités entre accents graves, au caractère près, avec l'apostrophe typographique ’.
- **Points signalés.** Les écarts relevés entre le PRD, la spine et le code de départ sont repérés `C-E2-n`. Ils sont listés en fin d'epic, avant la table de couverture, avec la décision ou la règle qui les tranche. Un critère qui dépend d'un point encore ouvert le dit ; il ne doit pas être développé dans une autre lecture sans arbitrage.

---

### Story 2.1 : Nature et montant de la Durée totale d'un Exercice

En tant que Hermann (utilisateur de KODJO),
je veux que la Durée totale de chaque Exercice soit calculée Série par Série, y compris quand certaines Cibles sont à l'échec,
afin de connaître le temps prévu exact, estimé ou partiel sans jamais lire un montant inventé.

**Exigences :** FR-13-01, FR-13-02, FR-13-03, FR-13-04, FR-13-05, FR-13-06 ; FR-14-02, FR-14-03 (partie domaine) ; NFR-05, NFR-06, NFR-11, NFR-13 ; P25, P42, H10, Q30, Q7 (13a, 13b, 13d, 13f, 13m, 13n, 14i).
**Architecture :** AD-5 (propriétaire unique du résultat `exact | estimated | lowerBound | omitted | incomplete`, disponibilité de l'Inversion du total), AD-1 (Cible typée), AD-10 (attendus par formule). Fichiers principalement touchés (indicatif) : `src/domain/activities/executionCalculations.ts` et ses tests ; consommateurs existants du résultat, en adaptation de type seulement : `src/domain/sessions/calculations.ts`, `src/features/activities/ActivityCard.tsx`, `src/features/activities/ExecutionParametersSheet.tsx`, `src/domain/activities/executionPhrase.ts`.
**Dépend de :** 1.1, 1.3 (l'AC8 rejoue le calcul après une copie de Définition vers Séance et sur un Instantané v2, livrés par 1.3, antérieure dans l'ordre arrêté).
**Hypothèses non validées :** H8, H10, H28 — à confirmer par la revue ChatGPT/Hermann avant développement.

**Critères d'acceptation :**

**AC1 — Travail de chaque Série (FR-13-01)**
**Given** des Paramètres d'exécution à Cibles typées
**When** le domaine détermine le travail de chaque Série
**Then** Mode Durée, Cible `NUMBER` d → Ti = d, travail connu
**And** Mode Répétitions, Cible `NUMBER` Ri, Bip b > 0 → Ti = Ri × b, travail estimable
**And** Cible `FAILURE`, en Durée comme en Répétitions, avec ou sans Bip → travail inconnu
**And** Mode Répétitions, Bip 0 → travail inconnu, même avec une Cible `NUMBER`
**And** aucun forfait par répétition n'est utilisé : en Répétitions sans Bip, aucun montant de travail n'apparaît, quelle que soit la Cible (D-232, Q7 15b.4)
**And** en Durée, le Bip ne change pas le total : N = 4, Ti = 60 s, b = 4 s, Pause 15 s → 4 × (60 + 15) = **300 s**, nature exacte.

**AC2 — Nature de la Durée totale de l'Exercice (FR-13-02, P25)**
**Given** un Exercice dont toutes les Cibles sont renseignées (`NUMBER` ou `FAILURE`)
**When** sa Durée totale intrinsèque est calculée
**Then** la nature suit exactement ce tableau :

| Mode | Bip | Cibles | Nature |
|---|---|---|---|
| Durée | 0 ou > 0 | toutes `NUMBER` | `exact` |
| Répétitions | > 0 | toutes `NUMBER` | `estimated` |
| Durée | 0 ou > 0 | mélange `NUMBER` et `FAILURE` | `lowerBound` |
| Répétitions | > 0 | mélange `NUMBER` et `FAILURE` | `lowerBound`, jamais `estimated` (≥ prime sur ≈) |
| Répétitions | 0 | toutes `NUMBER`, mélange ou toutes `FAILURE` | `omitted` |
| Durée ou Répétitions | 0 ou > 0 | toutes `FAILURE`, Pauses positives ou nulles | `omitted` |

**And** la nature `lowerBound` porte le montant connu ; `omitted` ne porte aucun montant, mais conserve les contributions connues (Pauses, Pause au changement de côté) pour l'agrégation (2.2)
**And** le montant d'une Pause change le montant, jamais la nature
**And** RM-072 « omitted … À l’échec » est appliqué au seul cas tout à l'échec ; le mélange suit RM-129 et RM-132 (P25).

**AC3 — Total partiel d'un mélange (FR-13-03)**
**Given** un Exercice à Cibles mixtes, unilatéral, seul (sans Récupération)
**When** son total est calculé
**Then** montant = Σ Ti des Séries à travail connu ou estimable + Σ Pi de **toutes** les Séries, y compris la Pause qui suit une Série à l'échec et la Pause terminale ; le travail inconnu n'ajoute rien
**And** R01 — Durée, Régime variables, Cibles 30 s / 45 s / `FAILURE`, Pauses 10 s × 3 → (30 + 45) + 30 = **105 s**, `lowerBound`
**And** R02 — Répétitions, Cibles 10 / 12 / `FAILURE`, Bip 2 s, Pauses 10 s × 3 → (10 × 2 + 12 × 2) + 30 = **74 s**, `lowerBound` (et non `estimated`)
**And** R03 — même Exercice qu'en R02 avec Bip 0 → `omitted`, aucun montant ; contributions connues **30 s**
**And** R04 — trois Cibles `FAILURE`, Pauses 10 s × 3, en Durée et en Répétitions, Bip 0 et 2 s (quatre combinaisons) → `omitted` ; contributions connues **30 s**
**And** mixte Figma — Durée, Cibles 30 s / 45 s / `FAILURE`, Pauses 10 s / 20 s / 30 s → 75 + 60 = **135 s**, `lowerBound` (montant obtenu par la règle, NFR-01, D-255)
**And** contrôles tout numériques — Durée 30 s / 45 s / 60 s, Pauses 10 s × 3 → 135 + 30 = **165 s**, `exact` ; Répétitions 10 / 12 / 15, Bip 2 s, Pauses 10 s × 3 → 37 × 2 + 30 = **104 s**, `estimated`
**And** plus de 3 Cibles — Durée 30 s / 45 s / 60 s / `FAILURE`, Pauses 10 s × 4 → 135 + 40 = **175 s**, `lowerBound` ; Répétitions 10 / 12 / 15 / `FAILURE`, Bip 2 s, Pauses 10 s × 4 → 37 × 2 + 40 = **114 s**, `lowerBound` (montants repris par la Phrase en 2.3, FR-16-09).

**AC4 — Formules du total intrinsèque, Cibles typées (FR-13-04)**
**Given** les formules unilatérale, un côté après l'autre, les deux côtés à chaque série et N = 1 bilatéral normalisé
**When** les attendus normatifs sont recalculés avec des Cibles `NUMBER`
**Then** ils valent tous :

| Cas | Paramètres | Attendu |
|---|---|---|
| A | unilatéral, 30 s / 45 s / 60 s, Pauses 10 / 20 / 30 s | **195 s** |
| B | A suivi d'une Récupération de 120 s (durée d'occurrence) | **285 s** |
| C | A, un côté après l'autre, PC 15 s | **405 s** |
| D | A, les deux côtés à chaque série, PC 15 s | **375 s** |
| E | Répétitions 12 / 10 / 8, Bip 0, Pauses 30 / 45 / 60 s | `omitted`, **135 s** de Pauses connues |
| F | toutes `FAILURE`, Bip 0 puis 4 s, Pauses 30 / 45 / 60 s | `omitted` dans les deux cas |
| Uniforme | N 3, d 90 s, p 15 s | **315 s** |
| Bilatéral | N 3, d 90 s, p 15 s, PC 10 s | un côté après l'autre **640 s** ; les deux côtés à chaque série **615 s** |
| N 1 bilatéral | d 90 s, p 15 s, PC 10 s | **220 s** ; suivi d'une Récupération de 30 s → **235 s** |
| Douze séries | travail total 390 s, Pause 10 s | **510 s** |
| Répétitions avec Bip | N 4, Ri 15, b 4 s, p 15 s | **300 s**, `estimated` |
| Une Série | Ti 30 s, p 15 s | **45 s** |

**And** une Pause suit chaque Série, la dernière comprise, même à N = 1 et avec une PC ; une Pause de 0 s ne crée aucune phase ; PC = 0 ne supprime ni ne remplace Pi
**And** Compte à rebours et Fin sont exclus du total intrinsèque
**And** en Régime variables, Cibles et Pauses viennent de chaque ligne dans l'ordre effectif ; après déplacement de la dernière ligne, la nouvelle dernière ligne porte PN.

**AC5 — Cible à renseigner : ni durée, ni omission (FR-13-05, H10, Q30)**
**Given** un Exercice dont au moins une Cible est `UNSET` (brouillon, ou héritée de `migration010`)
**When** sa Durée totale est demandée, en Durée ou en Répétitions avec ou sans Bip
**Then** le domaine rend l'issue `incomplete`, distincte des quatre natures et d'`omitted` : aucun montant de Durée totale d'Exercice, donc aucune ligne ni aucun total affiché pour cet Exercice (H10, H28)
**And** `incomplete` porte, pour l'agrégation de 2.2, les contributions connues de l'Exercice calculées comme pour un mélange avec échec (AC3, FR-13-03) : travail connu ou estimable des Séries dont la Cible est `NUMBER`, plus toutes les Pauses (et PC) ; le travail de la Série `UNSET` est inconnu et n'ajoute rien (Q30). Attendu : Durée, Régime variables, Cibles 30 s / `UNSET` / 45 s, Pauses 10 s × 3, unilatéral → `incomplete`, contributions connues (30 + 45) + (10 + 10 + 10) = **105 s** ; même Exercice en Répétitions Bip 0, Cibles 10 / `UNSET` / 12 → contributions connues **30 s** (Pauses seules, travail inconnu sans Bip)
**And** la Cible n'est jamais convertie en `FAILURE` ni lue comme 0
**And** une Cible `FAILURE` explicitement choisie reste valide sans nombre (AC2).

**AC6 — Disponibilité de l'Inversion du total (FR-14-02, partie domaine, P42)**
**Given** des Paramètres d'exécution
**When** le domaine qualifie la disponibilité de l'Inversion du total
**Then** elle est disponible **si et seulement si** Mode Durée, Régime identiques, Cible `NUMBER` et N non hérité
**And** elle est indisponible pour une Cible `FAILURE` (Régime identiques) ou `UNSET`, en Régime variables (quelles que soient les Cibles) et en Mode Répétitions
**And** N hérité d'un circuit de séries : la fonction de disponibilité reçoit un indicateur d'héritage en entrée (forme introduite ici, non persistée en v2, reprise par 3.2 AC14) ; avec l'indicateur vrai, l'Inversion est indisponible, y compris avec des Cibles à l'échec. PRE-4 ne produisant aucun N hérité (FR-12-07, Composition hors périmètre), cette conséquence est une exigence de compatibilité du modèle, vérifiée par un test du domaine seulement, sans parcours d'interface ni recette (P42)
**And** l'appel de l'Inversion sur des paramètres non disponibles est une entrée invalide (levée), jamais un résultat silencieux.

**AC7 — Calcul de N à partir d'une Durée totale choisie (FR-14-03, partie domaine)**
**Given** un Exercice en Durée, Régime identiques, Cible `NUMBER` d, Pause p
**When** une Durée totale Tv est demandée
**Then** N ∈ 1..99 ; candidats unilatéral `arrondi(Tv / (d + p))`, un côté après l'autre `arrondi((Tv − PC) / (2(d + p)))`, les deux côtés à chaque série `arrondi(Tv / (2d + p + PC))`, et N = 1 évalué avec l'Ordre normalisé par côté ; le total réalisable le plus proche est retenu ; à égalité, le plus grand N
**And** un N = 1 issu de l'Inversion est normalisé (Régime identiques, par côté si bilatéral)
**And** bornes : de T(1) à T(99) pour les paramètres courants, au pas d'une seconde, sans plafond à 58 min 55 s. Attendu : unilatéral, d = 30 s, p = 10 s → T(1) = **40 s**, T(99) = **3 960 s** (formaté `66 min` par 2.2, H8)
**And** Tv = 160 s → N = 4, T(4) = 160 s, ajustement faux
**And** Tv = 180 s → N = 4 (160 s) et N = 5 (200 s) à égale distance → N = 5, T(5) = **200 s**, ajustement vrai (message littéral et `Annuler` : story 3.7, FR-14-04)
**And** les bornes et l'Inversion ne s'appliquent qu'à une Cible `NUMBER` ; aucune valeur à l'échec n'entre ni ne sort de ce calcul (roulette sans option à l'échec : story 3.7).

**AC8 — Calculs tirés des seules règles (FR-13-06)**
**Given** la suite de tests de `executionCalculations`
**When** elle s'exécute
**Then** chaque attendu de AC1 à AC7 est une constante écrite ou une formule calculée dans le test ; aucun n'est produit par la fonction testée, lu dans Figma ni dans la colonne J d'Excel
**And** la matrice couvre : unilatéral, `RIGHT_LEFT` et `LEFT_RIGHT`, chacun en `BY_SIDE` et `BY_SERIES` ; Pause 0 et PC 0 ; Récupération nulle et positive ; N = 1 et N = 99 ; Cibles mixtes en tête, au milieu et en fin
**And** le même Exercice, après un changement de Mode aller-retour par la fonction du Brouillon existante, après le déplacement de sa dernière ligne, après une copie de Définition vers Séance (1.3) et relu depuis un Instantané v2 (1.3), donne le même montant et la même nature que l'original, à paramètres identiques.

**AC9 — Consommateurs existants pendant la transition (NFR-06, NFR-11)**
**Given** les consommateurs existants du résultat (`calculations.ts`, `ActivityCard.tsx`, `ExecutionParametersSheet.tsx`, `executionPhrase.ts`)
**When** la nature `lowerBound` d'Exercice est introduite
**Then** chacun compile en traitant les cinq issues (quatre natures et `incomplete`) de façon exhaustive
**And** aucun n'affiche un montant `lowerBound` sans le préfixe `≥ ` ; aucun n'affiche `0 s` ni un tiret pour `omitted` ou une Cible à renseigner
**And** aucun nouveau gabarit ni nouveau formateur n'est introduit ici ; ils viennent de 2.2, 2.3 et 2.4.

**Preuves attendues :** tests unitaires de `executionCalculations` (AC1 à AC8, tableaux littéraux ci-dessus) ; tests existants de calcul et de Séance adaptés, sans affaiblissement ; `npm test`, `npx tsc --noEmit`, `npm run lint` verts. Recette iPhone : **R-2.1-01** — Exercice migré tout à l'échec (données de `recette-iphone.md` §2) ouvert dans l'Éditeur : la carte et la Feuille n'affichent aucune Durée totale, ni `0 s` ni tiret. Une suite verte ne vaut pas recette visuelle (NFR-04).
**Hors story :** format des durées et agrégation de Séance (2.2) ; Phrase (2.3) ; cartes (2.4) ; ligne Durée totale de la Feuille, roulette, message d'ajustement et annonces VoiceOver (3.7 : FR-14-01, FR-14-04, FR-14-05) ; relevés d'exécution R05 à R13 (moteur d'exécution).

---

### Story 2.2 : Format des durées et agrégation de Séance

En tant que Hermann (utilisateur de KODJO),
je veux que toutes les durées s'écrivent de la même façon et que la durée de mes Séances tienne compte des Pauses, des Récupérations et des Exercices à l'échec,
afin que le temps annoncé pour une Séance ne soit jamais faux, gonflé ni minoré à tort.

**Exigences :** FR-17-01 (format) ; FR-15-02, FR-15-03, FR-15-04, FR-15-05 ; FR-13-05 (contribution d'une Cible à renseigner à l'agrégat, AC4, Q30 ; porteur : 2.1) ; NFR-03, NFR-06, NFR-08, NFR-11 ; H8, Q30, P25, P31, P41, Q4, Q7 (13n.2, 15b, 15k).
**Architecture :** AD-5 (formateur unique `durationFormat.ts`, `formatPhraseDuration` adopté ; pli d'agrégation ; `computeOccurrenceDuration` substitue PN par R avant de qualifier la nature ; `formatEstimatedDuration` des cartes de Séance inchangé), AD-10. Fichiers principalement touchés (indicatif) : `src/domain/activities/durationFormat.ts` (nouveau), `src/domain/activities/executionPhrase.ts` (import du formateur), `src/domain/activities/executionCalculations.ts` (`aggregateSessionDuration`, `computeOccurrenceDuration`), `src/domain/sessions/calculations.ts`.
**Dépend de :** 2.1.
**Hypothèses non validées :** H8 — à confirmer par la revue ChatGPT/Hermann avant développement.

**Critères d'acceptation :**

**AC1 — Un seul formateur de durée (FR-17-01, H8)**
**Given** une durée de x secondes entières
**When** elle est formatée
**Then** 0 → `0 s` ; 15 → `15 s` ; 60 → `1 min` (jamais `60 s`) ; 90 → `1 min 30 s` ; 1 265 → `21 min 5 s`
**And** au-delà de 59 min, les minutes continuent sans heures : 3 665 → `61 min 5 s` ; 3 960 → `66 min` ; 4 500 → `75 min`
**And** ce formateur est défini une seule fois, dans `src/domain/activities/durationFormat.ts`, en fonction pure ; la Phrase (2.3), la Feuille et les cartes (2.4) l'importent ; aucun autre module ne formate une durée d'Exercice en minutes et secondes
**And** les 520 durées du Corpus 276 sont produites sans écart (contrôlé par le test du corpus, 2.3).

**AC2 — Récupération positive en remplacement de la seule Pause terminale (FR-15-02)**
**Given** un Exercice de total intrinsèque T, de dernière Pause PN, suivi dans une Séance d'une Récupération R
**When** la durée d'occurrence To est calculée
**Then** To = T − PN + R si R > 0 ; To = T si R = 0 ; R n'est jamais ajoutée deux fois ; R = 0 ne crée aucune phase et ne supprime pas PN ; la Pause du premier côté reste intacte
**And** la substitution précède la qualification de la nature, pour toutes les issues (quatre natures et `incomplete`)
**And** attendu — Durée 30 s / 45 s / `FAILURE`, Pauses 10 s × 3, unilatéral, Récupération 40 s : intrinsèque **105 s** ; occurrence 105 − 10 + 40 = **135 s**, `lowerBound`, formaté `≥ 2 min 15 s`
**And** retirer la Récupération rétablit PN ; après un déplacement de Séries, la nouvelle dernière ligne est déterminée avant la substitution
**And** un Exercice calculé seul n'a aucune Récupération : PN reste comptée ; aucune Récupération n'est créée automatiquement (RM-038, D-307).

**AC3 — Pauses d'un Exercice omis ou partiel dans le total (FR-15-03)**
**Given** un Exercice dont la Durée totale propre est `omitted` ou `lowerBound`
**When** il contribue à une Séance ou à un Circuit
**Then** ses Pauses, sa PC et sa R contribuent ; le travail inconnu n'ajoute rien ; chaque phase chronométrée et chaque travail estimable sont comptés une seule fois
**And** Répétitions 10 / 12 / `FAILURE`, Bip 0, Pauses 10 s × 3, unilatéral → contribution **30 s** ; suivi d'une Récupération de 40 s → 10 + 10 + 40 = **60 s**
**And** trois Cibles `FAILURE`, Pauses 10 s × 3 → contribution **30 s**, Séance `lowerBound`
**And** bilatéral — Durée, Régime variables, N = 2 par côté, Cibles 30 s / `FAILURE`, `Les deux côtés à chaque série`, Pauses 10 s / 10 s, PC 5 s : travail connu 2 × 30 = **60 s** ; intrinsèque 60 + 20 + 2 × 5 = **90 s**, `lowerBound`, `≥ 1 min 30 s` ; suivi d'une Récupération de 40 s → 90 − 10 + 40 = **120 s**, `≥ 2 min` ; succession D1 → PC → G1 → P1 → D2 → PC → G2 → P2 comptée une fois
**And** contrôle `Un côté après l’autre`, mêmes Cibles, Pauses 10 s, PC 5 s → 2 × (30 + 10 + 10) + 5 = **105 s** ; occurrence avec R = 40 s → **135 s**, `lowerBound`
**And** la Cible typée s'applique aux deux côtés.

**AC4 — Nature du total de Séance et de Circuit (FR-15-04, FR-13-05, P25, Q30)**
**Given** les contributions d'une Séance ou d'un Circuit
**When** elles sont agrégées
**Then** nature `lowerBound` si au moins une contribution est `lowerBound`, `omitted` ou `incomplete` ; sinon `estimated` si au moins une est `estimated` ; sinon `exact`
**And** montant = Σ des montants `exact`, `estimated` et `lowerBound` + Σ des contributions connues des `omitted` et des `incomplete` (pour `incomplete` : travail connu ou estimable des Séries numériques et toutes les Pauses, 2.1 AC5)
**And** Copie en Séance dont une Cible héritée est à renseigner (donnée migrée, Q30) : le travail de la Série à renseigner est inconnu ; le travail connu des autres Séries et les Pauses contribuent, comme pour un mélange avec échec ; la Séance est partielle ; ce n'est pas une omission. Attendu : Séance d'un Exercice seul de 165 s `exact` et d'une Copie Durée 30 s / `UNSET` / 45 s, Pauses 10 s × 3, unilatérale, sans Récupération → contribution de la Copie (30 + 45) + (10 + 10 + 10) = 105 s ; Séance 165 + 105 = **270 s**, `lowerBound`
**And** attendus — Séance de deux Exercices seuls, sans Récupération : 165 s `exact` + 104 s `estimated` → **269 s**, `estimated` ; 165 s `exact` + 105 s `lowerBound` → **270 s**, `lowerBound` ; 165 s `exact` + Répétitions Bip 0 (Pauses 30 s connues) → **195 s**, `lowerBound`
**And** un Exercice placé dans un Circuit répété k fois compte k fois, sans multiplicateur double ; une Récupération interne au Circuit est comptée à chaque répétition, jamais deux fois par répétition. Attendu : Circuit répété 2 fois contenant le seul Exercice R01 (105 s, `lowerBound`) → **210 s**, `lowerBound`
**And** l'omission reste propre à l'Exercice concerné : elle ne retire aucune contribution des autres.

**AC5 — Périmètre de chaque mesure (FR-15-05, P31, P41)**
**Given** un Exercice dans une Séance
**When** les mesures de durée sont calculées
**Then** le Compte à rebours et la Fin propres de l'Exercice ne sont ni exécutés ni comptés dans la Séance ; seuls le Compte à rebours initial et la Fin de séance appartiennent au plan de la Séance
**And** la Durée estimée d'exécution de la Séance compte le plan complet, Compte à rebours initial et Fin de séance compris
**And** la mesure intrinsèque (Catalogue, PC comprise) et la mesure d'occurrence (Composition, avec R, répétitions de Circuit développées) sont deux fonctions distinctes, qui excluent le Compte à rebours initial et la Fin de séance
**And** attendu P31 — l'Exercice de l'AC2 (occurrence 135 s), seul dans une Séance avec un Compte à rebours initial de 10 s et une Fin de séance de 5 s : Durée estimée d'exécution 135 + 10 + 5 = **150 s**, `lowerBound` ; le montant de base est l'occurrence (135 s), pas l'intrinsèque (105 s). L'attendu porte sur le montant et la nature ; l'affichage sur la Séance suit son formateur actuel, inchangé (AC6, P41), sans attendu de texte propre à PRE-4.

**AC6 — Cartes de Séance inchangées dans leur forme (AD-5, P41)**
**Given** une Séance dont la nature devient `lowerBound` à cause d'un Exercice partiel, omis ou à Cible à renseigner
**When** sa carte de Séance est affichée
**Then** la durée passe par `formatEstimatedDuration` sans modification de ce formateur, pour toutes les natures, avec le symbole de la nature agrégée ; Q20 ne s'applique pas à la carte de Séance (P41)
**And** les symboles `≈` et `≥` viennent du lexique (NFR-08).

**Preuves attendues :** tests unitaires du formateur (toutes les valeurs de l'AC1), de `computeOccurrenceDuration` et du pli d'agrégation (AC2 à AC5), avec attendus par formule dans le test ; tests de `calculations.ts` et de Séance existants verts sans affaiblissement ; `npm test`, `npx tsc --noEmit`, `npm run lint` verts. Recette iPhone : **R-2.2-01** — Séance contenant un Exercice migré tout à l'échec, avec Pauses : la carte de Séance affiche une durée précédée de `≥`, Pauses comprises, jamais `0 s`. Une suite verte ne vaut pas recette visuelle (NFR-04).
**Hors story :** rendu des durées sur les cartes Catalogue et Composition (2.4, Q20, P41) ; Phrase (2.3) ; refonte de Composition, Volumes, placement complet des Récupérations, Points d'arrêt et règle de passage des circuits de séries (Q4) ; moteur d'exécution, progression et poids des phases (RM-077, RM-126) ; historique non recalculé (FR-15-07, Epic 1).

---

### Story 2.3 : Phrase des paramètres pour les Cibles mixtes et corpus

En tant que Hermann (utilisateur de KODJO),
je veux que la Phrase des paramètres décrive chaque Cible dans l'ordre, y compris « jusqu’à l’échec », avec la bonne Durée totale,
afin de relire d'un coup d'œil ce que je vais faire, sans que les phrases de mes Exercices existants changent.

**Exigences :** FR-16-01 à FR-16-11 ; FR-17-01 (absence de `0 s` dans la Phrase) ; FR-17-02, FR-17-03, FR-17-04, FR-17-05 ; NFR-01, NFR-04, NFR-06, NFR-09, NFR-11, NFR-14 ; Q16, P1, P3, P26, P43, H8, H9, H16, H17, H18.
**Architecture :** AD-6 (générateur unique, segments `{ texte, gras }`, Cible `UNSET` → phrase nulle), AD-5 (formateur et résultat de durée), AD-10 (corpus inchangé sur disque, rejeu des cas `TO_FAILURE` en Répétitions et en Durée, variantes dans `src/domain/activities/__tests__/fixtures/`). Fichiers principalement touchés (indicatif) : `src/domain/activities/executionPhrase.ts`, `src/domain/activities/__tests__/executionPhrase.test.ts`, `src/domain/activities/__tests__/fixtures/` (nouveau), carte Paramètres d'exécution de `src/features/activities/ActivityEditorForm.tsx` (lecture seule de la Phrase, si un ajustement d'affichage est nécessaire).
**Dépend de :** 2.2.
**Hypothèses non validées :** H8, H9, H16, H17, H18 — à confirmer par la revue ChatGPT/Hermann avant développement.

**Critères d'acceptation :**

**AC1 — Génération à l'affichage, sans stockage (FR-16-01)**
**Given** des Paramètres d'exécution et leur résultat de durée
**When** la Phrase est générée deux fois
**Then** les deux sorties sont identiques, segments et gras compris ; la concaténation des textes restitue la Phrase exacte ; deux valeurs identiques restent deux segments distincts ; le gras est décidé par le gabarit, jamais par recherche de sous-chaîne
**And** aucune Phrase ni aucun segment n'est écrit dans une Définition, une Copie en Séance ou un Instantané ; un Exercice ancien relu prend la grammaire courante
**And** une Cible `UNSET` ou un Mode non choisi donne une Phrase nulle : aucune Cible inventée ; Compte à rebours et Fin restent hors de la Phrase
**And** le Mode n'ouvre pas la Phrase ; seul le français est produit.

**AC2 — Gras des valeurs et des unités (FR-16-02, H9)**
**Given** une Phrase générée
**When** ses segments sont lus
**Then** `3 séries de 30 s` donne `3` (gras), ` séries de ` (normal), `30 s` (gras)
**And** dans `4 séries variables, de 10 rép. à l’échec`, `10 rép.` est en gras et ` à l’échec` est normal
**And** dans `(30 s, 45 s puis jusqu’à l’échec)`, `jusqu’à l’échec` est normal
**And** `≥` ou `≈` est dans le même segment gras que le montant de la Durée totale.

**AC3 — Cibles toutes numériques : gabarits inchangés (FR-16-03)**
**Given** un Exercice à Cibles toutes `NUMBER`
**When** sa Phrase est générée
**Then** l'ordre est : nombre de Séries → contenu → Pause → côtés → Durée totale, avec les accords `série`/`séries`
**And** attendus littéraux : `1 série de 1 min 30 s.` ; `3 séries de durée variable (30 s, 45 s puis 1 min).` ; `6 séries variables, de 30 s à 1 min 45 s` (min et max sur les Cibles, pas sur la première et la dernière ligne) ; `3 séries de 12 répétitions, enchaînées sans pause.` ; `3 séries de 12, 10 puis 8 répétitions` ; `6 séries variables, de 6 à 15 répétitions`
**And** N = 1 est normalisé en Régime identiques avant génération ; aucune ellipse après trois valeurs.

**AC4 — Cadence du Bip (FR-16-04, P26, H16)**
**Given** un Exercice avec un Bip b
**When** sa Phrase est générée
**Then** Répétitions, b > 0, Cibles toutes `NUMBER` : `3 séries de 12, 10 puis 8 répétitions cadencées toutes les 4 s.` ; `6 séries variables, de 6 à 15 répétitions cadencées toutes les 4 s.`
**And** en Durée, aucune clause : Durée, N = 1, Bip 4 s → `1 série de 1 min 30 s.`
**And** tout à l'échec avec Bip : aucune clause de cadence, même en Répétitions
**And** mélange en Répétitions de plus de 3 Cibles avec Bip : `4 séries variables, de 10 rép. à l’échec, cadencées toutes les 2 s` (Cibles 10 / 12 / 15 / `FAILURE`, Bip 2 s ; H16)
**And** mélange en Répétitions de 3 Cibles ou moins avec Bip : forme de l'AC8.

**AC5 — Clause de Pause (FR-16-05, P1)**
**Given** un Exercice
**When** sa Phrase est générée
**Then** Régime identiques, Pause positive : `, avec {pause} de pause après chaque série` ; attendu `1 série de 1 min 30 s, avec 15 s de pause après chaque série. Durée totale : 1 min 45 s.`
**And** Régime identiques, Pause nulle, N > 1 : `, enchaînées sans pause` ; N = 1 : aucune clause
**And** Régime variables, tous Modes, y compris tout à l'échec et mélanges : aucune clause de Pause, aucune énumération des Pauses, même si Figma `8328:38848` les énumère (P1)
**And** l'omission des Pauses dans la Phrase ne les retire ni du plan ni du calcul.

**AC6 — Clause des côtés (FR-16-06)**
**Given** un Exercice bilatéral ou non
**When** sa Phrase est générée
**Then** sans changement de côté : aucune clause
**And** départ droit : N = 1 `, en faisant le côté droit puis le gauche` (attendu `1 série de 1 min 30 s, en faisant le côté droit puis le gauche. Durée totale : 3 min.`) ; N > 1 deux côtés à chaque série `, en alternant le côté droit puis le gauche à chaque série` ; N > 1 un côté après l'autre `, en faisant d’abord toutes les séries à droite, puis à gauche`
**And** départ gauche : `en faisant le côté gauche puis le droit`, `en alternant le côté gauche puis le droit à chaque série`, `en faisant d’abord toutes les séries à gauche, puis à droite`
**And** PC > 0 : suffixe `, avec {PC} de pause au changement de côté` ; PC = 0 : aucun suffixe. Attendu `3 séries de 1 min 30 s, avec 15 s de pause après chaque série, en alternant le côté droit puis le gauche à chaque série, avec 5 s de pause au changement de côté. Durée totale : 10 min.` (3 × (180 + 15 + 5) = 600 s).

**AC7 — Tout à l'échec : gabarit existant, dans les deux Modes (FR-16-07, P3, P26)**
**Given** un Exercice dont toutes les Cibles sont `FAILURE`
**When** sa Phrase est générée, en Mode Durée puis en Mode Répétitions, Bip 0 puis 4 s
**Then** les quatre Phrases sont identiques
**And** `1 série menée jusqu’à l’échec.` ; `{N} séries menées jusqu’à l’échec`, jamais `{N} séries jusqu’à l’échec`
**And** attendus : `3 séries menées jusqu’à l’échec, enchaînées sans pause, en faisant d’abord toutes les séries à droite, puis à gauche, avec 5 s de pause au changement de côté.` ; Régime identiques, Pause 10 s : `3 séries menées jusqu’à l’échec, avec 10 s de pause après chaque série.` ; Régime variables, Pauses variables : `3 séries menées jusqu’à l’échec.`
**And** aucune Durée totale ni aucune clause de Bip.

**AC8 — Mélange de 3 Cibles ou moins : énumération (FR-16-08, Q16)**
**Given** un Exercice en Régime variables à Cibles mixtes, 2 ou 3 Cibles
**When** sa Phrase est générée
**Then** Durée : `3 séries de durée variable (30 s, 45 s puis jusqu’à l’échec)` ; `3 séries de durée variable (jusqu’à l’échec, 30 s puis 45 s)` ; `3 séries de durée variable (30 s, jusqu’à l’échec puis 45 s)` ; `2 séries de durée variable (30 s puis jusqu’à l’échec)`
**And** Répétitions, quelle que soit la position de l'échec : `3 séries de répétitions variables (10, 12 puis jusqu’à l’échec)` ; `3 séries de répétitions variables (jusqu’à l’échec, 10 puis 12)` ; `3 séries de répétitions variables (10, jusqu’à l’échec puis 12)` ; `2 séries de répétitions variables (10 puis jusqu’à l’échec)`
**And** Répétitions avec Bip : `3 séries de répétitions variables (10, 12 puis jusqu’à l’échec), cadencées toutes les 2 s` ; `3 séries de répétitions variables (10, jusqu’à l’échec puis 12), cadencées toutes les 2 s`
**And** Phrases complètes : Durée 30 s / 45 s / `FAILURE`, Pauses 10 s × 3, unilatéral → `3 séries de durée variable (30 s, 45 s puis jusqu’à l’échec). Durée totale : ≥ 1 min 45 s.` ; Répétitions 10 / 12 / `FAILURE`, Bip 2 s, Pauses 10 s × 3 → `3 séries de répétitions variables (10, 12 puis jusqu’à l’échec), cadencées toutes les 2 s. Durée totale : ≥ 1 min 14 s.` ; même Exercice Bip 0 → `3 séries de répétitions variables (10, 12 puis jusqu’à l’échec).`
**And** ces formes ne valent que pour un mélange : un Régime variables tout numérique en Répétitions garde `3 séries de 12, 10 puis 8 répétitions`.

**AC9 — Mélange de plus de 3 Cibles : compaction (FR-16-09, H17)**
**Given** un Exercice à Cibles mixtes, plus de 3 Cibles
**When** sa Phrase est générée
**Then** Répétitions : `{N} séries variables, de {minimum numérique} rép. à l’échec` ; Durée : `{N} séries variables, de {minimum numérique formaté} à l’échec`
**And** le minimum est celui des Cibles `NUMBER`, pas la première valeur : 10 / 12 / `FAILURE` / 20 → `4 séries variables, de 10 rép. à l’échec` ; 90 s / 120 s / `FAILURE` / 150 s → `4 séries variables, de 1 min 30 s à l’échec`
**And** Durée 30 s / 45 s / 60 s / `FAILURE`, Pauses 10 s × 4 → `4 séries variables, de 30 s à l’échec. Durée totale : ≥ 2 min 55 s.` (175 s)
**And** Répétitions 10 / 12 / 15 / `FAILURE`, Bip 0 → `4 séries variables, de 10 rép. à l’échec.`, sans Durée totale ; avec Bip 2 s et Pauses 10 s × 4 → Durée totale `≥ 1 min 54 s` (114 s)
**And** plus de 3 Cibles toutes `NUMBER` et toutes égales : le gabarit actuel est conservé (`6 séries variables, de 30 s à 30 s` pour six Cibles de 30 s), sans nouvelle forme (H17).

**AC10 — Durée totale dans la Phrase (FR-16-10, H18)**
**Given** le résultat de durée intrinsèque de l'Exercice (2.1)
**When** la Phrase est générée
**Then** `exact` : ` Durée totale : {total}.` ; `estimated` : ` Durée totale : ≈ {total}.` (attendu `… Durée totale : ≈ 1 min 41 s.`, corpus id 101) ; `lowerBound` : ` Durée totale : ≥ {total}.` (attendus `Durée totale : ≥ 1 min 45 s.`, `Durée totale : ≥ 2 min 15 s.`)
**And** `omitted` (Répétitions sans Bip, tout à l'échec) : aucune clause `Durée totale`, ni zéro ni tiret
**And** redondance : la Durée totale n'est omise que pour une Série unique en Durée, unilatérale **et** sans Pause (`1 série de 1 min 30 s.`) ; avec Pause : `1 série de 1 min 30 s, avec 15 s de pause après chaque série. Durée totale : 1 min 45 s.` ; bilatéral : `… Durée totale : 3 min.`
**And** la Récupération de Séance ne modifie pas la Phrase.

**AC11 — Jamais `0 s` dans la Phrase (FR-17-01)**
**Given** toute Phrase générée par le corpus et les variantes
**When** son texte est examiné
**Then** il ne contient jamais `0 s` : une Pause nulle s'écrit `enchaînées sans pause` ou s'omet ; une PC nulle omet le suffixe.

**AC12 — Corpus 276 conservé (FR-17-02, AD-10, P43)**
**Given** l'oracle source `docs/archives/evolutions-v15-2026-10-07/phrases-276.json` et son encodage de test `docs/preparation/PRE-3/planification/attendus-phrases-276.json` (mêmes 276 phrases, vérifié le 2026-10-16), **aucun des deux modifié sur disque**, et le fichier Excel source, non modifié
**When** le test du corpus s'exécute
**Then** les 276 textes sont reproduits sans altération, ponctuation comprise, et les segments gras attendus sont respectés ; le montant de chaque total est remplacé par le total calculé par formule avant comparaison, jamais lu dans Excel
**And** la répartition est vérifiée : 140 sans total, 46 `≈`, 90 exactes, aucune `≥` ; les 184 cas Durée et Répétitions numériques sont inchangés en texte et en nature
**And** aucune clause n'est ajoutée aux 120 cas en Régime variables
**And** un test vérifie que les 276 phrases de l'encodage de test sont identiques à celles de l'oracle source, et échoue sinon (P43).

**AC13 — Les 92 anciennes entrées « À l’échec » (FR-17-03, P26, P43)**
**Given** les 92 entrées du corpus en ancien Mode `TO_FAILURE`, que le test de 1.1 relit par une adaptation minimale pour rester vert
**When** le test les relit par une adaptation **explicite et nommée** dans le test (et non par une modification de l'un des deux fichiers), qui remplace l'adaptation minimale de 1.1 : Mode Répétitions, toutes les Cibles `FAILURE`, N, Pause, Bip, côtés, Ordre des côtés et PC conservés
**Then** la sortie est identique au corpus. Attendus : `3 séries menées jusqu’à l’échec, en faisant d’abord toutes les séries à droite, puis à gauche, avec 5 s de pause au changement de côté.` (id 251, Bip 4 s) ; `6 séries menées jusqu’à l’échec, en faisant d’abord toutes les séries à droite, puis à gauche, avec 5 s de pause au changement de côté.` (id 276)
**And** chaque entrée est rejouée une seconde fois en Mode Durée, toutes Cibles `FAILURE` : même attendu (FR-16-07)
**And** les 46 entrées avec Bip 4 s restent sans clause de cadence et sans Durée totale
**And** le littéral `TO_FAILURE` n'apparaît dans le test qu'à l'endroit de cette adaptation, conformément au test de garde d'AD-3.

**AC14 — Variantes des cas nouveaux (FR-17-04)**
**Given** un fichier de variantes dans `src/domain/activities/__tests__/fixtures/`, aux attendus littéraux écrits à la main et aux totaux calculés par formule
**When** le test des variantes s'exécute
**Then** il couvre au moins :
- mélange en Durée, 2 Cibles, et 3 Cibles avec l'échec en position 1, 2 et 3, total `≥` (AC8) ;
- mélange en Durée de plus de 3 Cibles, compaction et `≥` (AC9) ;
- mélange en Répétitions de 3 Cibles ou moins, échec en position 1, 2 (`3 séries de répétitions variables (10, jusqu’à l’échec puis 12)` et sa variante `…, cadencées toutes les 2 s`) et 3 ; plus de 3 Cibles ; Bip 0 (aucun total) et Bip positif (`≥`) ;
- tout à l'échec en Durée et en Répétitions, Régime identiques et variables, Bip 0 et 4 s, avec et sans Pause : texte identique au corpus ;
- N = 1 normalisé, N = 2, N > 6 ; Pause 0 et positive ; N = 1 avec et sans Pause ; PC 0 et positive ; Bip 0 et positif dans les deux Modes ;
- départ gauche dans les deux Ordres et à N = 1 ;
- redondance : Durée, N = 1, unilatéral, Pause 0 (total omis) contre Pause positive (total affiché) ; Durée, N = 1, bilatéral (total affiché) ;
- segments : deux valeurs identiques à des positions différentes ; segments `jusqu’à l’échec` et `à l’échec` non gras ;
- relecture d'un ancien Exercice (Instantané v1 lu par `readV1`, 1.3) ; absence de toute Phrase enregistrée ;
- totaux d'une heure ou plus : par exemple Durée uniforme, N = 61, Cible 55 s, Pause 5 s → 61 × 60 = 3 660 s → `Durée totale : 61 min.`.
**And** aucun attendu de variante n'est produit par le générateur ni par `executionCalculations`.

**AC15 — Phrase affichée en entier dans la Carte Paramètres d'exécution (FR-16-11, FR-17-05)**
**Given** la Carte Paramètres d'exécution de l'Éditeur d'Exercice
**When** elle affiche une Phrase
**Then** la Phrase est rendue dans la Carte existante, segments non interactifs, dans un même flux de texte, sans espace ajoutée avant la ponctuation ; la Phrase générée reste une seule suite de segments, sans saut de ligne (le retour de ligne de présentation avant « Durée totale » est un traitement de rendu, porté par 4.2 AC6)
**And** la zone touchable unique de la Carte et son focus d'accessibilité unique ne sont pas exigés ici : ils dépendent du retrait du bouton de Mode (`exercise-parameters-mode`, Q23) et sont portés par 4.2 AC6 et AC14 ; cette story ne modifie ni ce bouton ni le libellé accessible de la Carte
**And** aucun plafond de lignes, de hauteur ni de caractères (aucun `numberOfLines`, aucune hauteur fixe sur le texte, aucun `maxFontSizeMultiplier`) ; Inter 13 Regular, interligne 20, valeurs Semi Bold
**And** le cas 144 du corpus s'affiche en entier : `6 séries de 12 répétitions cadencées toutes les 4 s, avec 15 s de pause après chaque série, en faisant d’abord toutes les séries à droite, puis à gauche, avec 5 s de pause au changement de côté. Durée totale : ≈ 12 min 41 s.` (2 × 6 × (48 + 15) + 5 = 761 s)
**And** Compte à rebours et Fin restent sur leurs lignes et ne sont jamais rognés
**And** aucune carte consommatrice (Catalogue, Composition) ne reçoit la Phrase.

**Preuves attendues :** test du corpus 276 (AC12, AC13, rejeu en Répétitions et en Durée) ; test des variantes (AC14) ; tests unitaires des gabarits (AC1 à AC11) ; test de rendu de la carte (texte complet, aucun `numberOfLines`) ; `npm test`, `npx tsc --noEmit`, `npm run lint` verts. Recette iPhone, à 360, 402 et 440 pt et en texte agrandi (NFR-09) :
- **R-2.3-01** — Exercice migré tout à l'échec : `3 séries menées jusqu’à l’échec…`, sans Bip ni Durée totale ;
- **R-2.3-02** — cas 144 : Phrase lue en entier, sans troncature ni virgule seule en début de ligne ;
- **R-2.3-03** — mélange en Durée, 3 Cibles : `… (30 s, 45 s puis jusqu’à l’échec). Durée totale : ≥ 1 min 45 s.`, gras conforme à H9 (vérification visuelle de H9 sur Figma `8470:13303`) ;
- **R-2.3-04** — mélange en Répétitions avec Bip, échec au milieu ;
- **R-2.3-05** — VoiceOver sur la carte : la Phrase est lue en entier. Le contrôle « un seul élément, nom `Modifier les paramètres d’exécution` » est joué en 4.2 (`R-4.2-03`), après le retrait du bouton de Mode (Q23).

R-2.3-03 et R-2.3-04 ne sont exécutables qu'une fois les Cibles mixtes saisissables dans la Feuille (Epic 3) ; ce n'est pas une dépendance de la story. Une suite verte ne vaut pas recette visuelle ; la validation visuelle appartient à Hermann (NFR-04).
**Hors story :** énumération des Pauses variables (D-338, P1) ; formats For time, Tabata, EMOM ; autre langue (D-317) ; refonte visuelle de la carte (Epic 4, FR-02-06, FR-02-13).

---

### Story 2.4 : Durées et résumés sur les cartes Catalogue et Composition

En tant que Hermann (utilisateur de KODJO),
je veux que les cartes du Catalogue et de la Composition montrent la durée et le résumé de mes Exercices à l'échec ou mixtes comme l'Éditeur,
afin de ne jamais lire « 0 s », « 0 rép. » ni une durée partielle arrondie trompeuse.

**Exigences :** FR-15-06 ; FR-15-05 (conversion des cartes) ; FR-16-11 (aucune Phrase sur les cartes) ; NFR-01, NFR-03, NFR-04, NFR-06, NFR-08, NFR-09, NFR-11, NFR-14 ; Q4, Q17, Q20, Q30, P3, P41, H20, H28.
**Architecture :** AD-5 (rendu PRE-3 de chaque carte conservé pour `exact` et `estimated`, P41 ; `≥` en minutes et secondes sans arrondi pour `lowerBound` sur les cartes Catalogue et Composition, Q20, par le formateur de `durationFormat.ts` ; `formatCompactDuration` et `formatDurationRowValue` cessent de formater une durée d'Exercice ; `formatEstimatedDuration` des cartes de Séance inchangé pour toutes les natures), AD-6 (`formatExerciseRowSummary` lit les Cibles typées), AD-11. Fichiers principalement touchés (indicatif) : `src/domain/activities/durationFormat.ts`, `src/features/activities/ActivityCard.tsx` (`catalogueDuration`), `src/features/sessions/compositionPresentation.ts` (`formatExerciseRowSummary`, `formatCompositionSummary`), `src/shared/i18n/`.
**Dépend de :** 2.2 et 2.3.
**Hypothèses non validées :** H9, H20, H28 — à confirmer par la revue ChatGPT/Hermann avant développement.

**Critères d'acceptation :**

**AC1 — Durée partielle sur la carte Catalogue (FR-15-06, Q17, Q20)**
**Given** une Définition d'Exercice affichée au Catalogue
**When** sa durée intrinsèque (PC comprise) est `lowerBound`
**Then** la carte affiche `≥ {montant}` en minutes et secondes, **sans arrondi** à la minute, par le formateur de 2.2
**And** Durée 30 s / 45 s / `FAILURE`, Pauses 10 s × 3 → `≥ 1 min 45 s` (et non `≥ 2 min`) ; mixte Figma (Pauses 10 / 20 / 30 s) → `≥ 2 min 15 s`
**And** le même Exercice en Répétitions Bip 0 → aucune ligne de durée.

**AC2 — Durées exactes et estimées sur la carte Catalogue : rendu PRE-3 conservé (FR-15-05, FR-15-06, P41)**
**Given** une Définition dont la durée intrinsèque est `exact` ou `estimated`
**When** la carte Catalogue l'affiche
**Then** le montant garde le rendu de la carte Catalogue du code de départ (`catalogueDuration`, `ActivityCard.tsx:114-121`) : minutes et secondes par le formateur de 2.2, sans arrondi à la minute, précédé de `≈` si `estimated`
**And** total exact de 165 s → `2 min 45 s` (et non `3 min`) ; total estimé de 104 s → `≈ 1 min 44 s` ; total exact de 120 s → `2 min`
**And** un test compare ces sorties à celles du code de départ pour les mêmes paramètres numériques (non-régression, NFR-03).

**AC3 — Total omis et Cible à renseigner (FR-15-06, Q17, H28, Q30)**
**Given** une Définition dont la durée est `omitted`, ou `incomplete` parce qu'une Cible est `UNSET`
**When** sa carte est affichée
**Then** aucune ligne de durée n'est rendue : ni `0 s`, ni tiret, ni libellé de remplacement
**And** pour une Cible `UNSET`, le résumé des Séries affiche le texte existant du lexique `Paramètres à compléter.` (H28).

**AC4 — Résumé des Séries lu sur les Cibles typées (FR-15-06, H20, P3, Q17)** — *libellé du tout échec : Q24, `{N} séries à l’échec` en Régime identiques comme variables*
**Given** le résumé compact d'un Exercice (`formatExerciseRowSummary`, partagé par la carte Catalogue et la ligne Exercice de Composition)
**When** il est produit
**Then** il lit les Cibles typées du domaine, jamais les scalaires ni un `?? 0` ; le texte de tout échec du lexique a déjà été changé en 1.1 AC21 (Q24) et n'est pas modifié ici
**And** Régime variables à Cibles mixtes → branche existante `{N} séries variables` (attendu Durée 30 s / 45 s / `FAILURE` → `3 séries variables`) ; avec la bilatéralité propre → `{N} séries variables par côté`
**And** toutes les Cibles `FAILURE`, en Régime identiques comme variables, dans les deux Modes → `{N} séries à l’échec` (attendu `3 séries à l’échec`) ; les autres clauses existantes de la branche (par côté, Pause) restent celles du code de départ
**And** quel que soit le cas, le résumé ne contient jamais `0 s` ni `0 rép.` ; un test le vérifie sur toutes les combinaisons Mode × Régime × position de l'échec
**And** les Cibles numériques d'un résumé sont formatées par le formateur de 2.2 (sortie identique au code de départ pour ces valeurs).

**AC5 — Durée sur la Composition (FR-15-05, FR-15-06, Q20, P41, Q30)**
**Given** le résumé de la Composition, qui porte la durée synthétique des occurrences (avec R, répétitions de Circuit développées, sans Compte à rebours initial ni Fin de séance)
**When** sa nature est `lowerBound` (Exercice partiel, omis ou à Cible héritée à renseigner)
**Then** la durée est précédée de `≥`, en minutes et secondes, sans arrondi, par le formateur de `durationFormat.ts` : Circuit répété 1 fois contenant le seul Exercice R01 sans Récupération → `≥ 1 min 45 s` ; répété 2 fois → `≥ 3 min 30 s`
**And** une nature `exact` ou `estimated` garde le rendu actuel du résumé de Composition (`formatEstimatedDuration`, `compositionPresentation.ts:134`, arrondi à la minute supérieure), inchangé (P41)
**And** le calcul passe par la mesure d'occurrence de 2.2, sans formule locale ni nombre Figma
**And** la ligne Exercice de Composition n'acquiert aucune ligne de durée propre : PRE-4 n'ajoute aucun élément à Composition (Q4).

**AC6 — Source unique et conservation des cartes (FR-15-06, FR-16-11)**
**Given** les cartes Catalogue et Composition
**When** elles affichent durée et résumé
**Then** durée et symbole viennent du calcul commun (2.1, 2.2) ; le montant passe par le formateur de `durationFormat.ts`, sauf les totaux exacts et estimés du résumé de Composition, qui gardent leur formateur actuel (P41) ; aucun module de carte ne recalcule une durée d'Exercice
**And** les six contrats de cartes du ch. 13 (l. 277, 378, 764, 850, 2167, 2259) sont lus comme amendés par Q17 : `≥` admis sur une carte d'Exercice
**And** les huit cartes du Catalogue et leurs filtres sont conservés ; aucune Phrase des paramètres n'est ajoutée à une carte
**And** les cartes de Séance gardent `formatEstimatedDuration`, inchangé
**And** `≈` et `≥` restent des clés du lexique (NFR-08).

**Preuves attendues :** tests unitaires des rendus de carte (AC1, AC2, AC5 : 105 → `≥ 1 min 45 s`, 135 → `≥ 2 min 15 s`, Catalogue 165 → `2 min 45 s`, Catalogue 104 → `≈ 1 min 44 s`, Composition 210 `lowerBound` → `≥ 3 min 30 s`, Composition exacte et estimée inchangées) ; tests de `formatExerciseRowSummary` (AC3, AC4, matrice sans `0 s` ni `0 rép.`) ; tests de rendu d'`ActivityCard` (ligne absente si omise) ; tests existants des cartes adaptés sans affaiblissement ; `npm test`, `npx tsc --noEmit`, `npm run lint` verts. Recette iPhone, à 360, 402 et 440 pt et en texte agrandi (NFR-09) :
- **R-2.4-01** — Catalogue, Exercice migré tout à l'échec : résumé `{N} séries à l’échec` (Q24), aucune ligne de durée ;
- **R-2.4-02** — Catalogue, Exercice exact de 165 s : `2 min 45 s`, comme avant la mise à jour (P41) ;
- **R-2.4-03** — Catalogue, Exercice mixte R01 : `≥ 1 min 45 s` et `3 séries variables` (exécutable après l'Epic 3) ;
- **R-2.4-04** — Composition contenant l'Exercice migré tout à l'échec : ligne Exercice sans `0 s` ni `0 rép.`, résumé de Composition précédé de `≥` ;
- **R-2.4-05** — Catalogue, Définition à Cible héritée à renseigner (données de 1.4) : `Paramètres à compléter.`, aucune durée.

Une suite verte ne vaut pas recette visuelle ; la validation visuelle appartient à Hermann (NFR-04). Ordre de lecture des sources : NFR-14 ; Figma pour le rendu seulement (NFR-01).
**Hors story :** synthèse des Exercices mixtes sur les cartes de Composition au-delà de la durée et de l'interdiction du zéro (grille Volumes) ; refonte de Composition (Q4) ; libellés « Tour » et « Circuit » existants (`questions-ouvertes.md` §4) ; Phrase dans l'Éditeur (2.3).

---

#### Points signalés et leur traitement

| ID | Écart | Traitement | Critères concernés |
|---|---|---|---|
| C-E2-1 | Durée partielle du résumé de Composition : sans arrondi ou par le formateur de Séance (`formatEstimatedDuration`, `compositionPresentation.ts:134`), qui arrondit à la minute supérieure. | **Tranché par Q20 et P41** : partiel en `≥` minutes et secondes sans arrondi sur les cartes Catalogue et Composition ; exact et estimé gardent le formateur actuel de Composition. | 2.4 AC5 |
| C-E2-2 | Affichage de la Durée estimée d'exécution P31 (`≥ 2 min 30 s` au PRD, contre le formateur inchangé de la carte de Séance). | **Tranché par P31 et P41** : l'attendu porte sur le montant (150 s, `lowerBound`) ; l'affichage de la Séance suit son formateur actuel. | 2.2 AC5, AC6 |
| C-E2-3 | Résultat d'une Cible à renseigner et comportement de l'agrégat quand une Copie porte une Cible `UNSET` héritée. | **Tranché par Q30 (remplace H30)** : issue `incomplete`, distincte d'`omitted` ; aucun total d'Exercice ; dans l'agrégation, travail de la Série à renseigner inconnu, travail connu des autres Séries et Pauses comptés, comme pour un mélange avec échec (30 s / — / 45 s, Pauses 10 s × 3 → 105 s), Séance `lowerBound` ; pas une omission (AD-5). | 2.1 AC5, AC9 ; 2.2 AC4 ; 2.4 AC3, AC5 |
| C-E2-4 | Inversion du total sous un N hérité, non produit par PRE-4. | **Tranché par P42** : exigence de compatibilité du modèle, vérifiée par un test du domaine seulement (indicateur d'héritage en entrée, non persisté). | 2.1 AC6 |
| C-E2-5 | La carte Catalogue du code de départ n'arrondit pas un total exact (`2 min 45 s` pour 165 s). | **Tranché par P41** : rendu PRE-3 conservé pour les totaux exacts et estimés ; aucun arrondi RM-159 introduit sur la carte Catalogue. | 2.4 AC2 |
| C-E2-6 | Le PRD (FR-05-05, FR-15-06, P3, H20) présente `{N} séries à l’échec` comme la formulation **conservée** sur les cartes, mais le code de départ produit `{N} séries jusqu’à l’échec` (`exerciseRow.toFailure`, `fr.ts:380`), et `{N} séries variables` pour un tout échec en Régime variables. Suivre P3 et H20 change le texte visible d'une carte acceptée en PRE-3 (NFR-03) ; garder le code contredit P3. | **Tranché par Hermann (Q24) : `{N} séries à l’échec`**, en Régime identiques comme en Régime variables. 2.4 AC4 l'applique ; les clauses existantes de la branche sont conservées, dont la clause de Pause. Le texte PRE-3 change. | 1.1 AC21 ; 2.4 AC4 ; R-2.4-01, R-31 |
| C-E2-7 | Frontière avec le socle pour les 92 cas `TO_FAILURE` du corpus. | **Tranché par P43** : deux fichiers aux phrases identiques, l'archive est l'oracle, le fichier PRE-3 l'encodage de test, aucun n'est modifié ; 1.1 applique l'adaptation minimale qui garde le corpus vert, 2.3 la rend explicite et nommée et ajoute le rejeu en Durée et les variantes. | 1.1 AC21 ; 2.3 AC12, AC13 |

Ambiguïté mineure, sans contradiction : le gras de « répétitions variables » dans la forme Q16 n'est pas fixé par H9. 2.3 le traite comme le texte grammatical ` de durée variable (` du code de départ, donc en style normal. À confirmer sur Figma `8470:13303` lors de R-2.3-04.

#### Couverture E2

| FR | Story / AC |
|---|---|
| FR-13-01 | 2.1 AC1 |
| FR-13-02 | 2.1 AC2 |
| FR-13-03 | 2.1 AC3 |
| FR-13-04 | 2.1 AC4 |
| FR-13-05 | 2.1 AC5, AC9 ; 2.2 AC4 (agrégat, Q30) |
| FR-13-06 | 2.1 AC8 |
| FR-14-02 (domaine) | 2.1 AC6 |
| FR-14-03 (domaine) | 2.1 AC7 |
| FR-15-02 | 2.2 AC2 |
| FR-15-03 | 2.2 AC3 |
| FR-15-04 | 2.2 AC4 |
| FR-15-05 | 2.2 AC5, AC6 ; 2.4 AC2, AC5 |
| FR-15-06 | 2.4 AC1 à AC6 |
| FR-16-01 | 2.3 AC1 |
| FR-16-02 | 2.3 AC2 |
| FR-16-03 | 2.3 AC3 |
| FR-16-04 | 2.3 AC4 |
| FR-16-05 | 2.3 AC5 |
| FR-16-06 | 2.3 AC6 |
| FR-16-07 | 2.3 AC7, AC13 |
| FR-16-08 | 2.3 AC8 |
| FR-16-09 | 2.3 AC9 |
| FR-16-10 | 2.3 AC10 |
| FR-16-11 | 2.3 AC15 ; 2.4 AC6 |
| FR-17-01 | 2.2 AC1 ; 2.3 AC11 |
| FR-17-02 | 2.3 AC12 |
| FR-17-03 | 2.3 AC13 |
| FR-17-04 | 2.3 AC14 |
| FR-17-05 | 2.3 AC15 |

<!-- FIN EPIC 2 -->

---

## Epic 3 : Régler chaque Série dans la Feuille Paramètres d'exécution

**Objectif.** Dans la Feuille Paramètres d'exécution, Hermann choisit le Mode, le Changement de côté, l'Ordre des côtés et le Régime dans des popovers natifs ancrés à leur ligne. Il règle chaque Cible, numérique ou à l'échec, avec la roulette native et ses propres ✕ / ✓, présentée centrée, sans flèche, dans la couche `WheelPickerOverlay` de PRE-3 (Q37) : minutes-secondes en Durée, une colonne en Répétitions. Il gère le Tableau des séries variables par Cellule active et Pied commun, avec glisser, retrait et annulation. Il lit la Durée totale selon sa nature et peut l'inverser quand la règle le permet. Aucun réglage n'est perdu en changeant de Mode ou de N, et rien n'est enregistré avant le ✓ de la Feuille puis `Terminer`.

*Révision après la porte post-revue du 2026-10-16 (M1, F1 à F3) : AD-15 complété (T1 à T27) ; 3.3 AC8 et 3.6 AC2, AC3, AC9 alignés (champ ± ouvert : un seul geste, ± sans fermeture, N diminué sans fermer le champ ; surfaces natives : appui absorbé ; `Annuler` sans rangement) ; `R-3.6-09` ajouté.*

*Révision du 2026-10-17 (recette iPhone) : Q35 (Cible à renseigner signalée par un fond `#FFF1F0`, sans liseré ni contour, reporté dans le texte de 3.3 AC10 et `R-3.3-05`, 3.4 AC3 et AC10, 3.6 AC4, AC7, tests, `R-3.6-07` et `R-3.6-08`, et des états sans frame de la Feuille ; le reste de D-337 est inchangé) ; Q36 (Cible Durée à la seconde : bornes 5..3535 inchangées, roulette au pas de 1 s, ± au pas de base 1 avec la politique existante `EXECUTION_ACCELERATED_HOLD_POLICY`, `nearestGridValue` réduit à un bornage) : 3.4 AC2, AC4, AC10, preuves et `R-3.4-03`, `R-3.4-04` ; 3.6 AC4, AC5, AC6 et `R-3.6-01` corrigés.*

*Révision du 2026-10-17 (recette iPhone, écarts E-10 et E-11) : Q37 (la roue d'un Sélecteur de la Feuille — Cible Durée, Cible Répétitions, Cible d'une Cellule active, Durée totale — s'affiche sans flèche, centrée horizontalement sur la page, sur voile, dans la couche `WheelPickerOverlay` acceptée en PRE-3, et se ferme par ✕ ou ✓ seulement ; les popovers de choix restent natifs et ancrés) : reporté dans l'objectif, 3.1 (exigences, références, AC4 à AC7, `R-3.1-02`), 3.2 AC10, 3.3 AC8, 3.4 (architecture, AC1, AC8, AC11, AC12), 3.5 (architecture, AC1, AC8), 3.6 AC3, AC9, 3.7 (architecture, AC4), 3.8 AC5. Historique conservé en italique « Rendu remplacé par Q37 ».*

*Révision du 2026-10-17 (recette iPhone, écart E-12) : Q38 (en bilatéral, la ligne `Ordre des côtés` est masquée à N = 1 au lieu d'être atténuée et non modifiable ; l'Ordre choisi est conservé dans le Brouillon et réaffiché dès N ≥ 2 ; la normalisation effective `Un côté après l’autre` à N = 1 est inchangée) : reporté dans 3.3 AC5 et `R-3.3-03`, et dans `R-16` de l'epic 4. Historique conservé en italique « Rendu remplacé par Q38 ».*

*Révision du 2026-10-17 (recette iPhone, écart E-13) : Q39 (apparitions et disparitions fluides dans la Feuille : entrée en fondu avec léger déploiement, sortie en fondu avec repli, glissement des lignes voisines et de la feuille, durée courte et unique, sur le fil UI ; aucune animation avec « Réduire les animations », NFR-10) : reporté dans 3.8 (AC9 et preuves).*

*Révision du 2026-10-17 (recette iPhone, écart E-14) : Q40 (durée et sens de Q39 remplacés : 350 ms, entrée par le bas et sortie vers le bas en fondu simultané, l'espace se refermant pendant le fondu ; cadre D-4 à 350 ms ; lignes sélectionnées sans liseré ; tableau des séries variables sélectionné — fond d'une ligne sélectionnée — quand il est ouvert ou utilisé, état normal dès qu'un autre champ est sélectionné, cadre fixe X-3 retiré) : reporté dans 3.3 AC7, 3.6 AC1, 3.8 AC9 et preuves.*

*Révision du 2026-10-17 (recette iPhone, écart E-15) : Q41 (fondu supprimé : une ligne ou un contrôle de la Feuille monte de bas en haut, révélé par un cadre de découpe borné par la barre horizontale du dessous, et redescend sous elle ; aucun mouvement du texte à la sélection, le fond de sélection ne modifiant plus la mise en page ; un contrôle en ligne sous le champ sélectionné est dans le même cadre coloré ; sur iOS, Changement de côté, Ordre des côtés, roue de « Durée d’une série » et roue de Durée totale dans un panneau sans flèche juste sous le champ, aligné à droite, au-dessus du contenu, fermé sans application par un toucher extérieur ; popover natif du Mode inchangé ; par cohérence, toutes les roues de la Feuille — Cible Durée, Cible Répétitions, Cellule active, Durée totale — dans ce même panneau, Q37 ne s'appliquant plus à aucune) : reporté dans 3.1 (AC4 à AC6, R-3.1-02), 3.3 (AC4, AC5, AC7, AC8), 3.4 (AC1, AC3, AC11, AC12), 3.5 (architecture, AC1, AC12), 3.6 (AC sur la fermeture du Sélecteur), 3.7 (AC4), 3.8 (AC5, AC9 et preuves).*

*Révision du 2026-10-17 (recette iPhone, écart E-16) : Q42 — lignes de la Feuille et du tableau des séries variables à 44 pt de hauteur minimale (NFR-09), au lieu des 42 pt du DSF.*

**Architecture :** AD-2 (machine de brouillon unique), AD-7 (primitives natives, story S0), AD-8 (tableau, glisser conservé), AD-13 (validation unique avec ligne de base), AD-15 (une seule surface ouverte), AD-16 (mécanisme ± accepté, règle du domaine). S'appuie sur la story 1.1 (Cible typée, format v2) et la story 2.1 (nature de la Durée totale, Inversion du total dans le domaine).

**Règles communes à toutes les stories d'interface de l'epic (3.1, 3.3 à 3.8).** Elles sont reprises dans chaque story et ne sont pas répétées comme critères distincts :

- **Garde-fous des roulettes natives.** Les assertions « zéro `ScrollView` sur iOS » restent vertes et ne sont ni affaiblies, ni supprimées, ni contournées : `src/features/sessions/__tests__/DurationWheelPicker.test.tsx:378` et `:619`, `src/features/sessions/__tests__/NumberWheelPicker.test.tsx:267` (NFR-03, `AGENTS.md`, « Pièges connus »).
- **NFR-02 et NFR-03.** Chaque interaction pour laquelle une primitive native iOS existe passe par elle. Le mécanisme d'une primitive déjà acceptée (roulettes `DurationWheelPicker` et `NumberWheelPicker`, glisser des lignes PRE-3, `InlineStepper` et `ProfileStepper`) n'est pas remplacé. Seuls les remplacements de la liste fermée de NFR-03 sont admis. Une difficulté de style, une absence de test ou l'impossibilité de faire soi-même une capture ne justifient jamais un remplacement ; un écart avec la référence visuelle est signalé à Hermann (P33).
- **NFR-04.** Une suite de tests verte ne vaut jamais preuve visuelle ou tactile sur appareil réel. Aucune story ne déclare une conformité visuelle : la validation visuelle et tactile appartient à Hermann, sur iPhone (Q5).
- **Relevé visuel avant développement (FR-02-13 par analogie, FR-22-01, NFR-01).** Avant de coder, l'agent de développement relève, pour chaque frame citée par la story, les propriétés visuelles utiles (composant et variante, jetons, géométrie relative, typographie, couleurs, contours, effets, comportement adaptatif) depuis `docs/preparation/PRE-4/figma/<frame>.json.gz` et `docs/preparation/PRE-4/bmad/sources-caa2a5cf/docs/preparation/PRE-4/figma/fermeture-maitres-et-variables.json.gz`. Il consigne ce relevé dans le fichier de la story, sous forme d'un tableau à une ligne par élément et par état (frame et état ; élément et identifiant de nœud ; composant maître et variante ; style ou variable lié ; police ; couleurs ; contour ; ombre et effets ; espacements relatifs ; jeton existant retenu ; écart). Les stories 3.3 à 3.7 relèvent ainsi, à elles cinq, les 19 frames de la Feuille (liste de 3.8) ; la story 4.6 (AC1) reprend ces tableaux pour la conformité des 32 frames. Aucun chiffre lu n'y devient une règle (D-255, D-300). Un composant absent de Figma n'est pas inventé : il est classé `NON VÉRIFIABLE` (FR-22-01).
- **Ordre de lecture des sources (NFR-14)**, lexique de clés et apostrophe `’` (NFR-08, AD-11), jetons de `src/shared/ui/tokens.ts` intouchés, « Réduire les animations » respecté (NFR-10), cibles tactiles d'au moins 44 × 44 pt (NFR-09, P30).
- **Recette.** Les scénarios `R-3.M-xx` sont joués dans le dev client « Routine Dev » déjà installé sur l'iPhone (Q22), une fois sa compatibilité vérifiée en ouverture de la story 3.1 (AC1) ; si un nouveau build est nécessaire, il est signalé à Hermann. Leur attendu visuel renvoie à une frame ; leur attendu fonctionnel renvoie à une FR, une décision Q, une règle P ou une hypothèse H, jamais à une capture.

### Story 3.1 : Faisabilité sur iPhone du Popover natif dans la Feuille (S0)

En tant que Hermann (utilisateur de KODJO),
je veux que la faisabilité d'un popover natif ancré dans la Feuille, avec une roulette native et ses ✕ / ✓, soit établie sur mon iPhone avant toute autre story d'interface,
afin que les popovers et le Sélecteur de cible reposent sur une primitive native qui fonctionne réellement, sans réimplémentation découverte en fin d'epic.

**Exigences :** FR-03-10 (mécanisme natif, appui extérieur, une seule surface), FR-03-11 (roulette avec ses ✕ / ✓ ; *rendu remplacé par Q37 : couche `WheelPickerOverlay`, centrée, sans flèche, au lieu d'un popover ancré* ; règle de repli) ; NFR-02, NFR-03, NFR-04 ; Q5, Q12, Q22 (dev client « Routine Dev », compatibilité vérifiée en AC1), Q37 ; P9, P33.
**Architecture :** AD-7 (décision sous condition, critères de succès de S0, repli), AD-15 (principe d'une seule surface, pour l'essai seulement). Fichiers principalement touchés (indicatif) : `src/features/activities/ExecutionParametersSheet.tsx` (prototype limité à la ligne `Mode d’exécution` et à la ligne de Cible commune), `src/features/sessions/DurationWheelPicker.tsx` (lecture ; aucune modification de mécanisme), tests iOS associés.
**Références visuelles :** frames Figma `8328:37092` (popover de Mode), `8328:37862` (roulette de Cible dans son popover, maître `8452:13297` ; repère pour la roue seulement, sa présentation suit Q37) — visuel seulement, D-255.
**Dépend de :** 1.1. Mode d'installation tranché par Q22 (`docs/preparation/PRE-4/bmad/questions-ouvertes.md` §1) : le dev client « Routine Dev », déjà installé sur l'iPhone, charge le JavaScript servi par `npx expo start` depuis ce clone. La story commence par vérifier sa compatibilité (AC1) ; aucun résultat sur appareil n'est fabriqué.
**Hypothèses non validées :** H13 — à confirmer par la revue ChatGPT/Hermann avant développement.

**Critères d'acceptation :**

**AC1 — Préalable d'environnement et compatibilité du dev client (AD-7, Q22).**
**Given** le clone après `npm ci`, et le dev client « Routine Dev » installé sur l'iPhone de Hermann
**When** l'agent ouvre la story, avant tout prototype
**Then** `node_modules/@expo/ui/package.json` indique exactement la version `57.0.13`, consignée dans le fichier de la story, sans montée ni descente de version
**And** la version native de `@expo/ui` embarquée dans le dev client est relevée (par un moyen décrit dans la story, par exemple la version rapportée par le module natif au chargement ou les métadonnées du build) et comparée à `57.0.13`, en vérifiant la présence des correctifs de `57.0.12` exigés par AD-7 (modificateurs du `Popover`)
**And** l'essai s'exécute dans ce dev client, jamais dans Expo Go, avec le commit et l'état de l'arbre consignés (`recette-iphone.md` §1)
**And** issue « compatible » : la story continue ; issue « nouveau build nécessaire » (version native différente, correctifs absents, ou chargement du JavaScript refusé par le dev client) : la story s'arrête, le constat est signalé à Hermann, sans build ni publication EAS par l'agent (EAS est exclu de la préparation actuelle, pas définitivement) ; issue « non vérifiable » : consignée telle quelle et signalée à Hermann, sans conclusion fabriquée.

**AC2 — Popover de choix ancré dans la Feuille (FR-03-10, P9, AD-7).**
**Given** la Feuille ouverte (la `Modal` React Native existante, en fondu, non remplacée) et un prototype de popover `Mode d’exécution` à deux options `Durée` puis `Répétitions`, rendu par le `Popover` SwiftUI de `@expo/ui` dans un `Host` placé dans le `ScrollView` de la Feuille
**When** Hermann touche la ligne, puis recommence après avoir fait défiler le corps de la Feuille
**Then** la bulle s'ouvre ancrée à la ligne dans les deux cas
**And** un appui sur une option l'applique au Brouillon de la Feuille seulement (FR-03-10).

**AC3 — Fermeture extérieure sans application (FR-03-10, P9).**
**Given** le Mode `Durée` et le popover de Mode ouvert
**When** Hermann touche hors de la bulle
**Then** `onIsPresentedChange(false)` est reçu, le popover se ferme, et le Mode reste `Durée`
**And** la Feuille reste entièrement tactile après la fermeture (défilement, ✕, ✓, autres lignes)
**And** l'appui extérieur ne déclenche pas le contrôle situé dessous.

**AC4 — Roulette native et ✕ / ✓ dans un panneau sans flèche sous le champ (FR-03-11, Q12, Q41, AD-7).**
**Given** le Sélecteur de cible sur la ligne de Cible commune en Durée, présentant la roulette existante `DurationWheelPicker` et sa `PickerToolbar`, inchangées, sur iOS dans un panneau sans flèche (`AnchoredPanel`, conteneur de positionnement, ni `Modal` ni `Popover`)
**When** Hermann touche la valeur, fait tourner la roue, puis touche ✓ ; puis rouvre, fait tourner et touche ✕ ; puis rouvre, fait tourner et touche hors du panneau
**Then** la roue s'affiche juste sous le champ `Durée d’une série`, cadre aligné à droite sur le champ, sans flèche, au-dessus du contenu (aucune ligne ne se décale)
**And** la roue est dimensionnée sans repli, tourne au doigt et donne le retour haptique natif
**And** ✓ et ✕ sont actifs ; ✓ applique la valeur au Brouillon de la Feuille ; ✕ restaure la valeur d'avant ouverture (Q12)
**And** un toucher hors du panneau le ferme sans rien appliquer (Q41)
**And** le popover natif de `Mode d’exécution` (AC2, AC3) est conservé.
*Présentation remplacée par Q41 (2026-10-17, écart E-15). Historique Q37 : « dans `WheelPickerOverlay`, couche centrée sur la page, sur voile, fermée par ✕ et ✓ seulement, le voile ne fermant pas la roue ».*
*Rendu remplacé par Q37 (2026-10-17, écarts E-10 et E-11). Historique : « AC4 — Roulette native et ✕ / ✓ dans `Popover.Content` » ; le prototype plaçait `DurationWheelPicker` par `RNHostView` (ou un `Picker` en style roue) dans `Popover.Content`, ouvert par le popover ancré ; le constat de taille (E-05) a été corrigé et validé avant ce changement.*

**AC5 — Accessibilité minimale constatée (FR-03-10, H13).**
**Given** VoiceOver activé
**When** Hermann ouvre le popover de Mode puis le Sélecteur de la Cible commune
**Then** les options et la roue sont atteignables et annoncées, le focus reste dans la bulle ou dans le panneau de la roue (modal pour VoiceOver, fermé par le geste d'échappement ; Q41, avant lui la couche de Q37) tant qu'elle est ouverte, et revient à la ligne déclenchante à la fermeture
**And** chaque constat (réussi, partiel, impossible) est consigné tel quel, sans en déduire de conformité visuelle (NFR-04).

**AC6 — Aucune substitution (NFR-02, NFR-03, AD-7).**
**Given** le prototype sous Jest avec `Platform.OS = "ios"`
**When** les tests s'exécutent
**Then** un test vérifie qu'aucune `Modal` ni aucun `Pressable` de substitution n'est rendu à la place du `Popover` de Mode
**And** un test vérifie que la roue de la Cible commune est rendue dans le panneau sans flèche, sous le champ, aligné à droite, sans `Popover` ni `Modal` supplémentaire, que ✓ applique et que ✕ et un toucher extérieur ferment sans appliquer (Q41, tests `PRE4-Q41` ; *remplace le test Q37 : « dans `WheelPickerOverlay` […], voile non pressable »*)
**And** les garde-fous `DurationWheelPicker.test.tsx:378`, `:619` et `NumberWheelPicker.test.tsx:267` restent verts sans modification.

**AC7 — Décision consignée, sans réimplémentation (AD-7, P33, FR-03-11).**
**Given** les constats AC2 à AC5
**When** l'agent clôt la story
**Then** il consigne dans le fichier de la story et dans `docs/preparation/PRE-4/bmad/journal-comparaison.md` l'une des trois décisions :
- **succès** : les critères AC2 à AC5 sont remplis ; le prototype est conservé comme base des stories 3.3 et 3.4 ;
- **repli (a)** : le `Popover` fonctionne ancré au niveau d'un `Host` hors de la `Modal` ; le repli est décrit et ses limites listées ;
- **repli (b)** : ni l'un ni l'autre ne fonctionne ; l'écart est signalé à Hermann comme question P33 dans `questions-ouvertes.md`, et les stories 3.3 à 3.8 restent bloquées jusqu'à son arbitrage
**And** en cas de succès ou de repli (a), il consigne aussi la **voie retenue pour la roue** dans `Popover.Content`, avec sa preuve sur iPhone : (i) `RNHostView` enveloppant `DurationWheelPicker` (et, par extension, `NumberWheelPicker`), ou (ii) `Picker` SwiftUI rendu directement dans `Popover.Content` (AD-7, « Voie consignée »). Cette voie s'impose aux stories 3.4, 3.5 et 3.7, qui n'en ouvrent pas d'autre ; dans les deux voies, le contrat des roulettes reste porté par `DurationWheelPicker` et `NumberWheelPicker`. *Rendu remplacé par Q37 (2026-10-17) : la voie de la roue est désormais la couche `WheelPickerOverlay` de PRE-3, centrée, sans flèche, fermée par ✕ / ✓ seulement, avec `DurationWheelPicker` / `NumberWheelPicker` et `PickerToolbar` inchangés ; elle s'impose aux stories 3.4, 3.5 et 3.7. La voie (i) a été constatée sur iPhone (E-05 validé) avant d'être abandonnée pour ce rendu ; la décision consignée porte alors sur le popover de choix seulement*
**And** aucune réimplémentation du popover ou de la roulette (`Modal` React Native, assemblage de `ScrollView`, imitation graphique) n'est introduite, quel que soit le résultat
**And** en cas d'échec, le prototype est retiré dans la même story et l'application reste dans son état antérieur, les trois contrôles verts.

**Preuves attendues :**
- Tests : test iOS d'absence de `Modal` et de `Pressable` de substitution ; garde-fous zéro `ScrollView` inchangés et verts.
- Contrôles : `npm test`, `npx tsc --noEmit`, `npm run lint` verts.
- Recette iPhone, jouée par Hermann ou en sa présence :
  - `R-3.1-00` — Préconditions : dev client « Routine Dev » sur l'iPhone, `npx expo start` depuis ce clone. Gestes : ouvrir le projet dans le dev client. Attendu : JavaScript chargé sans erreur de module natif ; version native de `@expo/ui` relevée et comparée à 57.0.13 (Q22, AD-7). Résultat consigné : compatible, nouveau build nécessaire, ou non vérifiable.
  - `R-3.1-01` — Préconditions : `R-3.1-00` compatible, Feuille ouverte sur un Exercice en création. Gestes : toucher `Mode d’exécution`, choisir `Répétitions` ; rouvrir, toucher hors de la bulle ; faire défiler le corps, rouvrir. Attendu fonctionnel : choix appliqué au Brouillon de la Feuille ; appui extérieur sans application ; bulle ancrée après défilement ; Feuille tactile après fermeture (FR-03-10, P9). Attendu visuel : `8328:37092`.
  - `R-3.1-02` — Préconditions : Feuille ouverte, Mode `Durée`. Gestes : ouvrir le Sélecteur de la Cible commune, tourner, ✓ ; rouvrir, tourner, ✕ ; rouvrir, tourner, toucher hors du panneau. Attendu fonctionnel : roue juste sous le champ, cadre aligné à droite, sans flèche ; roue non repliée, haptique native, ✓ applique, ✕ restaure ; un toucher extérieur ferme sans appliquer (FR-03-11, Q12, Q41 ; *historique Q37 : roue centrée sur voile, fermée par ✕ / ✓ seulement*). Attendu visuel : `8328:37862` pour la roue seulement.
  - `R-3.1-03` — Préconditions : VoiceOver activé. Gestes : parcourir le popover de Mode et le Sélecteur. Attendu : options et roue annoncées, focus confiné puis rendu à la ligne (H13).
- Rappel NFR-04 : ces constats décident de la faisabilité ; ils ne valent pas conformité visuelle.

**Hors story :** les popovers Changement de côté, Ordre des côtés et Régime (3.3) ; l'option échec et les bornes du Sélecteur (3.4, 3.5) ; la roulette de Durée totale (3.7) ; le rendu Android et web (repli `SegmentedControl` et roulettes `Legacy*`, AD-7, livré avec 3.3 et 3.4) ; toute montée de version de `@expo/ui`.

---

### Story 3.2 : Brouillon de Feuille : Cibles typées, Régime, mémoire par Mode, retrait et annulation

En tant que Hermann (utilisateur de KODJO),
je veux que le Brouillon de la Feuille gère des Cibles typées, le Régime, la mémoire des Cibles par Mode, les variations de N, le retrait d'une ligne et son annulation, selon des règles fixes,
afin qu'aucun réglage ne soit perdu ni converti en changeant de Mode, de Régime ou de N, et que rien ne soit enregistré avant le ✓ de la Feuille.

**Exigences :** FR-03-03 (domaine : ✓ et ✕ de la Feuille, AC11), FR-03-04, FR-04-03, FR-04-04, FR-04-05, FR-05-02 (domaine), FR-05-03, FR-06-01, FR-06-03, FR-06-04, FR-09-06 (absence d'état partiel, domaine), FR-11-01, FR-11-02, FR-11-03, FR-11-04, FR-11-05, FR-11-06, FR-12-01, FR-12-02, FR-12-03, FR-12-04 (domaine), FR-12-05 (domaine), FR-12-07 ; NFR-05, NFR-06, NFR-07 ; H4, H5 (confirmée par Q29), Q29, H25, H26, H27, P19, P22, P37, P42.
**Architecture :** AD-2 (machine de brouillon unique, précédence H27, `pendingRemoval`), AD-13 (ligne de base alignée par identité de ligne ; le ✓ appelle `validateForSave`), AD-1 (types `SeriesTarget`). Fichiers principalement touchés (indicatif) : `src/domain/activities/ExecutionParametersDraft.ts`, `src/domain/activities/ExecutionParameters.ts` (lecture), `src/domain/activities/__tests__/`.
**Références visuelles :** aucune (domaine seul).
**Dépend de :** 1.1, 2.1.
**Hypothèses non validées :** H4, H25, H26, H27 — à confirmer par la revue ChatGPT/Hermann avant développement.

**Critères d'acceptation :**

**AC1 — Cibles typées dans le Brouillon (FR-06-01, FR-06-03, AD-1, AD-2).**
**Given** le Brouillon de la Feuille ouvert sur des paramètres v2
**When** une transition fixe la Cible commune ou la Cible d'une ligne
**Then** la Cible est une `SeriesTarget` (`NUMBER` entier ≥ 1, `FAILURE` ou `UNSET`), jamais `null`, 0 ni une valeur sentinelle
**And** une ligne ne porte jamais à la fois un nombre et l'échec (FR-06-01)
**And** en `variables`, la suite ordonnée des N couples Cible / Pause est la seule vérité et accepte un mélange, par exemple `NUMBER 10`, `NUMBER 12`, `FAILURE` (FR-06-03)
**And** les quatre combinaisons Durée / Répétitions × `identiques` / `variables` acceptent des Cibles `FAILURE` (FR-06-03).

**AC2 — Valeurs initiales en création (FR-11-05, FR-03-04, FR-05-02, P19, P37).**
**Given** un Brouillon ouvert sans paramètres préalables (création)
**When** il est lu
**Then** Mode `—` (non renseigné), N = 1, Pause 0 s, Régime `identiques`, Bip 0 (`Aucun`), Changement de côté non renseigné, Cible Durée `UNSET`, aucun tempo implicite
**And** choisir directement le Mode Répétitions sans Cible préalable donne une Cible commune `NUMBER 1` (P37)
**And** choisir Durée puis Répétitions en `identiques` avec une Cible `UNSET` la laisse `UNSET`, jamais 1 (P37)
**And** un Changement de côté non renseigné est produit `Sans changement` par le ✓ (FR-11-05)
**And** une fois un Mode choisi, aucune transition ne le ramène à `—` (FR-05-02).

**AC3 — Changement de Mode sans conversion (FR-11-03, FR-05-03, H26).**
**Given** Durée, `variables`, N = 3, Cibles 30 s / 45 s / à l'échec, Pauses 10 / 20 / 30 s, Bip 2 s, `Droite puis gauche`, `Les deux côtés à chaque série`, Pause au changement de côté 5 s, Compte à rebours 10 s, Fin 5 s
**When** le Mode passe à Répétitions
**Then** N = 3, Pauses 10 / 20 / 30 s, Bip 2 s, côtés, ordre, 5 s, 10 s et 5 s sont inchangés, le Régime reste `variables`
**And** les Cibles deviennent `UNSET`, `UNSET`, `FAILURE` : jamais 30 rép., jamais 0 (FR-11-03)
**And** aucune Cible implicite n'est introduite en `variables` (FR-11-03).

**AC4 — Retour au Mode précédent et précédence (FR-11-04, H4, H27).**
**Given** l'état final d'AC3
**When** le Mode revient à Durée avant ✓
**Then** les Cibles sont 30 s, 45 s, à l'échec (FR-11-04)
**And** la mémoire suit l'identité de chaque ligne, à travers réordonnancement, retrait et restauration (H4)
**And** si, en Répétitions, la ligne 1 a reçu `FAILURE`, le retour en Durée la laisse `FAILURE` : le dernier choix explicite l'emporte et 30 s n'est pas restauré sur cette ligne (H27)
**And** une ligne `UNSET` sans mémoire pour le Mode cible reste `UNSET` (P37).

**AC5 — Passage en `variables` et retour en `identiques` (FR-04-03, FR-04-04).**
**Given** `identiques`, N = 3, Cible `FAILURE`, Pause 20 s
**When** le Régime passe à `variables`
**Then** trois lignes `FAILURE` / 20 s sont créées, le Bip restant commun (FR-04-03)
**And** revenir à `identiques` reprend la Cible et la Pause de la première ligne dans l'ordre courant, y compris après un réordonnancement (FR-04-04, FR-12-03)
**And** repasser en `variables` avant ✓ restitue le dernier tableau (lignes, ordre, Cibles, Pauses)
**And** après un ✓ en `identiques`, une réouverture puis un passage en `variables` copient les valeurs uniformes, sans retrouver l'ancien tableau (FR-04-04, FR-11-02).

**AC6 — Régime explicite et lecture (FR-04-05, FR-04-01 domaine).**
**Given** un Exercice en `variables` à 3 × 30 s, Pause 10 s
**When** le Brouillon est ouvert, validé puis rouvert
**Then** le Régime reste `variables` : il ne se déduit jamais de l'égalité des valeurs ni du Mode
**And** un Exercice relu sans Régime explicite (paramètres uniformes) s'ouvre en `identiques`, et à N = 1 le Régime effectif est `identiques` (FR-04-05).

**AC7 — Augmenter et diminuer N (FR-12-01, FR-12-02).**
**Given** `variables`, N = 5, lignes L1 à L5
**When** N passe à 3, puis à 5, puis à 6
**Then** N = 3 retire L4 et L5, gardées en Réserve avec leur Cible, leur Pause et leur ordre
**And** N = 5 restitue L4 puis L5, jamais L5 puis L4 (FR-12-01)
**And** N = 6 ajoute une ligne qui copie la Cible et la Pause de la dernière ligne de l'ordre courant ; une dernière ligne `FAILURE` est copiée `FAILURE`, sans nombre inventé (FR-12-01, NFR-06)
**And** N reste dans 1..99 : aucune transition ne le porte à 0 ni à 100 (FR-12-01, FR-12-02).

**AC8 — Déplacement d'une ligne (FR-12-03, P22).**
**Given** `variables`, N = 3, lignes (30 s, 10 s), (45 s, 20 s), (à l'échec, 30 s)
**When** la ligne 3 est déplacée en tête
**Then** l'ordre devient (à l'échec, 30 s), (30 s, 10 s), (45 s, 20 s), renuméroté de 1 à 3
**And** la nouvelle dernière ligne porte la Pause terminale PN
**And** des lignes retirées restaurées ensuite sont réinsérées en fin, dans leur ordre conservé
**And** le Bip commun n'est pas affecté (P22).

**AC9 — N = 1 normalisé dès le Brouillon (FR-12-04).**
**Given** `variables`, N = 3, bilatéral, `Les deux côtés à chaque série`
**When** N passe à 1
**Then** les paramètres effectifs (ceux que lisent la Phrase et la Durée totale) sont uniformes sur la première ligne de l'ordre courant, avec l'Ordre des côtés `Un côté après l’autre`
**And** remonter N à 2 ou plus avant ✓ restaure `variables`, ses lignes et l'ancien Ordre des côtés
**And** un ✓ à N = 1 ne produit qu'une Série uniforme et l'Ordre des côtés par défaut.

**AC10 — Retrait d'une ligne et annulation (FR-12-05, H5 confirmée par Q29, AD-2).**
**Given** `variables`, N = 4
**When** la ligne 2 est retirée
**Then** elle part avec sa Cible et sa Pause, N = 3 et les lignes suivantes sont renumérotées
**And** le Brouillon expose un instantané d'annulation (`pendingRemoval`) ; l'annulation restaure la ligne à sa position 2 avec sa Cible et sa Pause
**And** toute modification du Brouillon de la Feuille invalide l'annulation (Q29), un test par cas de la liste exhaustive de la décision : Cible, Pause, N, Mode, Régime, Bip, Pause commune, réordonnancement, autre retrait
**And** seules l'ouverture et la fermeture d'un popover ou du Sélecteur de cible, **sans application**, ne l'invalident pas (Q29) : un test ouvre puis ferme un popover par appui extérieur et un Sélecteur par ✕ (depuis Q37, le voile d'une roue ne la ferme pas), puis vérifie que l'annulation restaure toujours la ligne ; un ✓ de Sélecteur qui applique une Cible l'invalide (modification de Cible)
**And** le retrait est refusé à N = 1 ; un retrait qui ramène N à 1 applique la normalisation d'AC9 (H5, Q29).

**AC11 — ✓ et ✕ de la Feuille, Réserve jamais transmise (FR-03-03, FR-11-01, FR-11-02, FR-09-06, AD-13).**
**Given** un Brouillon modifié par des changements de Mode, de Régime, de N, de Cibles, des déplacements et des retraits
**When** la Feuille est abandonnée (✕ ou retour système)
**Then** les paramètres du parent sont inchangés
**And** **When** la Feuille est validée (✓), le Brouillon appelle `validateForSave(params, baseline)` puis produit d'un bloc les paramètres effectifs, sans aucune écriture en base
**And** le résultat ne contient ni identité de ligne, ni Réserve, ni mémoire par Mode, ni `pendingRemoval` (FR-11-02)
**And** une violation est retournée en union, sans état partiel : le parent reste dans son état complet antérieur (FR-09-06, NFR-07).

**AC12 — Ligne de base alignée par identité de ligne (AD-13, H25).**
**Given** un Exercice ancien en `variables` dont la ligne 2 porte une Cible 5999 s et la ligne 3 une Cible 7 s, Bip 11
**When** la ligne 2 est déplacée en tête sans être modifiée, puis le ✓ est demandé
**Then** la ligne de base suit l'identité des lignes : la Cible 5999 s non modifiée et le Bip 11 non modifié sont tolérés, le ✓ réussit et les valeurs sortent inchangées
**And** une ligne nouvelle (ajoutée par N) n'a pas de base : la grille s'y applique
**And** une Cible n'est tolérée que si le Mode est celui de la ligne de base ; une Cible `UNSET`, héritée comprise, bloque toujours le ✓ (H25)
**And** en création, aucune ligne de base : la grille s'applique partout.

**AC13 — Bilatéral et Bip commun (FR-06-04, FR-05-03, P22).**
**Given** un Exercice bilatéral, N = 3
**When** les Cibles sont réglées
**Then** N désigne 3 Séries par côté et les deux côtés reçoivent les mêmes Cibles (FR-06-04)
**And** le Bip, de 0 à 10 s, existe dans les deux Modes et est conservé au changement de Mode, même après ✓ (FR-05-03).

**AC14 — Compatibilité N hérité et copies (FR-12-07, FR-11-06).**
**Given** des paramètres dont N est marqué hérité (indicateur d'héritage introduit en 2.1 AC6, sans persistance v2 ; P42 : compatibilité du modèle, testée au domaine seulement)
**When** ils sont ouverts, validés et relus par le modèle
**Then** ils sont acceptés sans erreur ; N, Cibles, Pauses et ordre des lignes sont relus inchangés ; aucune règle n'exige de modifier N, de supprimer une ligne ni de purger une Réserve (FR-12-07)
**And** hors héritage, le ✓ vide la Réserve
**And** les paramètres produits par le ✓ contiennent le Bip commun et la Cible typée de chaque Série, sans état intermédiaire, prêts pour copie et Instantané (FR-11-06).

**Preuves attendues :**
- Tests unitaires purs dans `src/domain/activities/__tests__/` : un test par AC, attendus littéraux ; scénarios de FR-12-06 (N à 1 et à 99, réduction, augmentation, restauration, réordonnancement de la dernière Série, PN après déplacement) au niveau du domaine.
- Contrôles : `npm test`, `npx tsc --noEmit`, `npm run lint` verts.
- Recette iPhone : aucune propre à cette story (domaine seul) ; ses règles sont recettées par les scénarios des stories 3.3 à 3.6. Rappel NFR-04.

**Hors story :** toute modification d'interface (3.3 à 3.7) ; les fonctions `nearestGridValue` (3.4) et `stepTarget` (3.6) ; le calcul de la Durée totale et de l'Inversion du total (2.1) ; le niveau structurel de `validateForSave` et les bornes de saisie (1.1, FR-09-01 à FR-09-05) ; la persistance (E1).

---

### Story 3.3 : Popovers Mode, Changement de côté, Ordre des côtés et Régime

En tant que Hermann (utilisateur de KODJO),
je veux choisir le Mode, le Changement de côté, l'Ordre des côtés et le Régime dans des popovers natifs ancrés à leur ligne, et régler les valeurs numériques par des ± qui n'apparaissent qu'à l'appui,
afin de régler la Feuille au pouce, avec les menus du système, sans interrupteur ni segmenté et sans deux surfaces ouvertes à la fois.

**Exigences :** FR-03-01, FR-03-02, FR-03-03, FR-03-04 (affichage), FR-03-05, FR-03-06, FR-03-07, FR-03-08, FR-03-09, FR-03-10, FR-04-01, FR-04-02, FR-05-01, FR-05-02 (affichage), FR-05-04, FR-09-04 (champs hors Cible), FR-10-05, FR-12-04 (interface) ; NFR-02, NFR-03, NFR-04, NFR-09, NFR-10 ; P9, P10, P16, P33, H13.
**Architecture :** AD-7 (popovers SwiftUI selon la décision de 3.1 ; repli Android et web par `SegmentedControl`), AD-15 (état `openSurface`, distinct de la Cellule active `activeCell` ; transitions T7, T8, T10, T15 à T17, T19, et celles du `stepper(champ)` hors tableau, T20, T22, T23), AD-16 (`InlineStepper` réutilisé), AD-11 (`UNSELECTED_OPACITY`), AD-2 (dispatch au Brouillon). Fichiers principalement touchés (indicatif) : `src/features/activities/ExecutionParametersSheet.tsx`, `src/shared/ui/opacity.ts` (nouveau), `src/shared/i18n/`, tests de la Feuille.
**Références visuelles :** frames Figma `8328:36923`, `8328:37092`, `8328:38513`, `8328:37972`, `8328:38953`, `8328:39390`, `8328:39181`, `8328:39072`, `8328:37760`, `8328:38193`, `8328:38301` — visuel seulement, D-255.
**Dépend de :** 3.1 (décision « succès » ou « repli (a) » ; un « repli (b) » bloque la story), 3.2.
**Hypothèses non validées :** H13, H25 — à confirmer par la revue ChatGPT/Hermann avant développement.

**Critères d'acceptation :**

**AC1 — Ouverture et en-tête maintenus (FR-03-01, FR-03-02, NFR-10).**
**Given** l'Éditeur et sa Carte Paramètres d'exécution
**When** Hermann touche la Carte
**Then** la Feuille s'ouvre sur une copie du Brouillon de l'Éditeur, voile en fondu `#1F2129` à 34 % et Feuille montant du bas ; avec « Réduire les animations », elle apparaît en place
**And** l'en-tête fixe montre ✕ à gauche, le titre `Paramètres d’exécution`, ✓ à droite ; le corps défile ; l'Éditeur est inerte et hors du parcours de focus ; aucune navigation ni nouvelle route n'est possible depuis la Feuille (FR-03-01).

**AC2 — Ordre du corps et absence d'interrupteur (FR-03-02, FR-04-01, FR-05-04).**
**Given** la Feuille ouverte en bilatéral avec une ligne Durée totale applicable
**When** Hermann parcourt le corps
**Then** l'ordre est : `Mode d’exécution` → `Séries` (champ de Régime, chevron en `variables`, nombre) → Cible et `Pause après chaque série` communes, ou Tableau des séries variables → `Changement de côté` → `Ordre des côtés` et `Pause entre les côtés` → `Bip de cadence` → `Durée totale` → `Compte à rebours` → `Fin d’exercice`
**And** sans ligne `Durée totale`, le `Bip de cadence` est juste avant `Compte à rebours`
**And** aucun interrupteur « Séries variables », aucune option ni ligne métier « échec », aucun écran « Série à l’échec » n'existent (FR-04-01, FR-05-04).

**AC3 — Popover de Mode (FR-05-01, FR-03-06, FR-05-02).**
**Given** une création, le champ `Mode d’exécution` affiche `—`
**When** Hermann touche le champ, en `identiques` comme en `variables`
**Then** le même popover propose exactement `Durée` puis `Répétitions`, sans « À l’échec »
**And** un choix l'applique au Brouillon de la Feuille ; aucune option ne ramène le Mode à `—` (FR-05-02)
**And** le segmenté de Mode est retiré sur iOS (NFR-03, liste fermée).

**AC4 — Popover Changement de côté (FR-03-07, P10).**
**Given** la ligne `Changement de côté`
**When** Hermann la touche
**Then** un popover propose exactement `Sans changement`, `Droite puis gauche`, `Gauche puis droite` ; jamais un segmenté en ligne sur iOS
**And** les libellés accessibles développent la direction en toutes lettres, sans abréviation D/G
**And** sur iOS, ce popover est un panneau sans flèche, ouvert juste sous le champ sélectionné, aligné à droite sur lui, au-dessus du contenu (aucune ligne ne se décale), qui contient le `SegmentedControl` accepté, inchangé ; un choix l'applique au Brouillon et ferme le panneau (cadre D-4) ; un toucher hors du panneau le ferme sans appliquer ; Android et web gardent le segmenté en ligne, dans le cadre de sélection de la ligne — source : Q41 (décision de Hermann du 2026-10-17, écart E-15). *Remplace, pour iOS, le popover natif SwiftUI prévu : iOS n'offre pas de popover natif sans flèche.*

**AC5 — Popover Ordre des côtés (FR-03-08, FR-12-04).**
**Given** un Changement de côté bilatéral
**When** Hermann touche `Ordre des côtés`
**Then** le popover propose `Un côté après l’autre` (par défaut) et `Les deux côtés à chaque série`, avec les sous-titres de référence `(D1 → D2) → (G1 → G2)` et `(D1 → G1) → (D2 → G2)` si la primitive le permet (P33)
**And** la ligne n'existe pas en `Sans changement`
**And** à N = 1, la ligne est masquée (ni ligne, ni séparateur propre, ni popover ; un popover ouvert se ferme), sans texte explicatif ; l'Ordre choisi est conservé et réaffiché dès N ≥ 2 — source : Q38 ; l'ordre effectif à N = 1 reste `Un côté après l’autre` (FR-12-04). *Rendu remplacé par Q38 : la ligne n'est plus atténuée à `UNSELECTED_OPACITY` ni non modifiable.*
**And** sur iOS, la présentation est celle d'AC4 : panneau sans flèche sous le champ, aligné à droite, contenant le `SegmentedControl` accepté (options et sous-titres inchangés) — source : Q41.

**AC6 — Popover Régime et chevron (FR-04-01, FR-03-09, FR-04-02, FR-12-04).**
**Given** N ≥ 2
**When** Hermann touche le champ de Régime de la ligne `Séries`
**Then** le popover propose exactement `identiques` (« toutes les séries ont la même valeur ») et `variables` (« chaque série a sa propre valeur »), les sous-titres étant une référence visuelle (P33)
**And** en `variables`, un chevron masque ou affiche le Tableau des séries variables ; trois états : `identiques` sans chevron, `variables` déployé, `variables` replié
**And** replier ne modifie aucune donnée, ne quitte pas `variables`, et une Cible à renseigner dans un tableau replié laisse le ✓ indisponible (FR-04-02, FR-03-03)
**And** à N = 1, le champ de Régime n'est pas modifiable et la Feuille montre l'état uniforme (FR-12-04, P16).

**AC7 — Comportement commun des popovers (FR-03-10, P9, AD-15).**
**Given** un popover ouvert, par exemple Mode `Durée`
**When** Hermann touche à l'extérieur
**Then** le popover se ferme sans appliquer : le Mode reste `Durée`, et l'appui n'active pas un contrôle destructif situé dessous
**And** la ligne déclenchante est désignée active pendant l'ouverture (référence visuelle : barre d'accent et fond de ligne)
**And** une ligne sélectionnée porte le fond de sélection (`colors.stepperSurface`, rayon 12), sans contour ni liseré, sans qu'aucun texte ne bouge — source : Q40 (décision de Hermann du 2026-10-17, écart E-14)
**And** sélectionner ou désélectionner une ligne ne change ni marge, ni padding, ni largeur, ni position du texte, et ne joue aucune transition de place (fond dessiné en arrière-plan) ; un contrôle affiché sur une ligne sous le champ sélectionné est dans le même cadre coloré que la ligne — source : Q41 (écart E-15)
**And** ouvrir une autre surface ferme la précédente sans appliquer sa valeur en cours : `openSurface` porte au plus une surface, en état d'interface, jamais dans le Brouillon du domaine ; l'ouverture d'un popover désactive la Cellule active éventuelle (AD-15, T15) ; un rappel `onIsPresentedChange(false)` d'une surface déjà fermée ou remplacée est ignoré (clé de surface, AD-15, T8)
**And** le focus revient au déclencheur à la fermeture (H13)
**And** ✕ de la Feuille après un choix dans un popover rétablit l'état d'avant l'ouverture de la Feuille.

**AC8 — Valeurs numériques hors tableau (FR-03-05, FR-10-05, FR-09-04).**
**Given** les lignes `Séries` (N), `Pause après chaque série`, `Pause entre les côtés`, `Bip de cadence`, `Compte à rebours`, `Fin d’exercice`
**When** Hermann touche une valeur
**Then** au repos seule la valeur est visible ; à l'appui, − et + apparaissent à sa droite, la valeur reculant d'une translation constante
**And** un seul champ actif dans toute la Feuille : toucher une autre valeur ferme le précédent et ouvre le nouveau d'un seul geste (AD-15, T20) ; un appui extérieur range l'outil sans bouton Annuler, les valeurs restant dans le Brouillon de la Feuille (T23)
**And** les − et + d'un champ ouvert ne le ferment jamais : le champ reste ouvert, avec la même clé de surface, après chaque pas, y compris le − de N qui retire des lignes du tableau (AD-15, T22 ; FR-12-02)
**And** le toucher qui range un champ ouvert active dans le même geste une cible inoffensive : ligne d'un popover (T15), ligne de Cible commune ou de Durée totale (T24), chevron (T14), ✓ ou ✕ de la Feuille (T19) ; il ne déclenche jamais la croix d'une ligne (T23)
**And** à l'inverse, pendant qu'un popover ou un Sélecteur est ouvert, toucher une valeur hors tableau ferme seulement la surface, sans appliquer, et n'ouvre pas le champ touché : la primitive native absorbe l'appui (AD-15, T10). *Pour un Sélecteur, depuis Q37 : la couche `WheelPickerOverlay` couvre la Feuille ; le toucher n'atteint pas la valeur et ne ferme pas la roue, que seuls ✕ et ✓ ferment. Depuis Q41, pour un panneau sans flèche (Changement de côté, Ordre des côtés, roue de Durée commune, roue de Durée totale, iOS) : le toucher extérieur ferme le panneau sans appliquer et n'ouvre pas le champ touché*
**And** appui bref : pas de 1 ; maintien : répétition après ≈ 500 ms toutes les 150 ms, paliers de 5 après ≈ 2 s puis de 10 après ≈ 4 s pour N et les Pauses ; `Bip de cadence`, `Compte à rebours` et `Fin d’exercice` restent au pas de 1 sans accélération ; saturation aux bornes, arrêt au relâchement sans pas supplémentaire (FR-09-04)
**And** les bornes restent N 1..99, Pauses 0..300 s, Bip 0..10 (`Aucun` à 0), Compte à rebours et Fin 0..60 s (FR-09-03, lecture).

**AC9 — Affichage des valeurs initiales (FR-03-04, FR-11-05).**
**Given** une création
**When** la Feuille s'ouvre
**Then** `Mode d’exécution` et `Changement de côté` affichent `—`, N = 1, Pause 0 s, `Bip de cadence` `Aucun`.

**AC10 — Validation de la Feuille (FR-03-03, P4).**
**Given** un Mode à renseigner ou une Cible commune `UNSET`
**When** Hermann regarde la Feuille
**Then** ✓ est indisponible ; la ligne concernée prend le fond `#FFF1F0` (`color.dangerSurface`), sans contour (Q35) ; aucun message en ligne
**And** une Pause de 0 s est valide ; une valeur ancienne hors bornes non modifiée ne rend pas ✓ indisponible (H25).

**AC11 — Repli Android et web (AD-7).**
**Given** `Platform.OS` différent de `"ios"` sous Jest
**When** la Feuille est rendue
**Then** Mode, Changement de côté, Ordre des côtés et Régime passent par le `SegmentedControl` existant, avec les mêmes options et les mêmes effets sur le Brouillon (parité fonctionnelle testée)
**And** sur iOS, un test par popover vérifie qu'aucune `Modal` ni aucun `Pressable` de substitution n'est rendu à sa place.

**Preuves attendues :**
- Relevé visuel préalable des frames citées (règles communes de l'epic).
- Tests : rendu de chaque popover et de ses options exactes ; appui extérieur sans application ; une seule surface ; ordre du corps ; ± à l'appui ; transitions du réducteur T10, T15 à T17, T19, T20, T22, T23 (champ → autre champ d'un seul geste, ± sans fermeture, appui extérieur, popover ouvert depuis un champ ouvert) ; N = 1 ; chevron ; repli Android et web ; garde-fous zéro `ScrollView` (`DurationWheelPicker.test.tsx:378`, `:619`, `NumberWheelPicker.test.tsx:267`) verts et inchangés.
- Contrôles : `npm test`, `npx tsc --noEmit`, `npm run lint` verts.
- Recette iPhone (dev client « Routine Dev », Q22, après `R-3.1-00`) :
  - `R-3.3-01` — Création, Feuille ouverte. Gestes : toucher `Mode d’exécution`, choisir `Durée` ; rouvrir, toucher hors de la bulle. Attendu : deux options exactes, appui extérieur sans application (FR-05-01, FR-03-10). Visuel : `8328:37092`, `8328:38513`.
  - `R-3.3-02` — Gestes : `Changement de côté` → `Droite puis gauche` ; `Ordre des côtés` → `Les deux côtés à chaque série`. Attendu : options exactes, ligne `Ordre des côtés` présente seulement en bilatéral (FR-03-07, FR-03-08). Visuel : `8328:37972`, `8328:38953`, `8328:38193`, `8328:38301`.
  - `R-3.3-03` — N = 3. Gestes : champ de Régime → `variables` ; replier puis déplier par le chevron ; N à 1. Attendu : tableau visible, replié sans perte, Régime non modifiable et, en bilatéral, Ordre masqué à N = 1 ; l'Ordre choisi est conservé et réaffiché dès N ≥ 2 — source : Q38 (FR-04-01, FR-04-02, FR-12-04). Visuel : `8328:39390`, `8328:39181`, `8328:39072`.
  - `R-3.3-04` — Gestes : toucher la valeur de `Pause après chaque série`, maintenir + 5 s ; toucher `Bip de cadence` pendant que l'outil est ouvert ; toucher + du Bip deux fois ; toucher le corps de la Feuille. Attendu : ± à l'appui, accélération, un seul champ actif, Bip ouvert d'un seul geste, ± du Bip sans fermeture du champ, Bip au pas de 1, champ rangé par l'appui extérieur (FR-03-05, FR-09-04 ; AD-15 T20, T22, T23). Visuel : `8328:37760`.
  - `R-3.3-05` — Création, rien de choisi. Attendu : `—` sur fond `#FFF1F0`, sans contour (Q35), ✓ indisponible, aucun message (FR-03-03, FR-11-05). Visuel : `8328:36923`.
  - `R-3.3-06` — Dans chacun des quatre parcours. Gestes : toucher la Carte ; modifier le Mode, le Régime, N et une Pause ; ✕ ; rouvrir ; refaire puis ✓ ; recommencer avec « Réduire les animations ». Attendu : voile en fondu et Feuille montant du bas (en place avec la réduction) ; en-tête fixe ✕ / `Paramètres d’exécution` / ✓ ; ordre du corps de FR-03-02 ; ✕ rend l'Éditeur inchangé ; ✓ applique d'un bloc, rien en base avant `Terminer` ; focus rendu à la Carte (FR-03-01 à FR-03-03, FR-11-01, FR-11-02, NFR-10). Visuel : `8328:36923`.
- Rappel NFR-04.

**Hors story :** le Sélecteur de cible et la ligne de Cible commune (3.4, 3.5) ; les cellules du tableau et le Pied commun (3.6) ; la ligne Durée totale (3.7) ; l'audit VoiceOver complet de la Feuille (3.8).

---

### Story 3.4 : Sélecteur de cible en Durée : option échec et grisé manipulable

En tant que Hermann (utilisateur de KODJO),
je veux choisir la Cible d'une Série en Durée sur une roulette native minutes-secondes, ou choisir « Aucune durée, à l’échec », et revenir au numérique en faisant tourner directement le bloc atténué,
afin de régler une durée ou l'échec en un geste, sans déverrouillage ni écran supplémentaire, et sans jamais valider `00:00`.

**Exigences :** FR-03-11 (Cible), FR-06-02 (interface, ligne commune), FR-06-05 (ligne commune), FR-07-01 (ligne commune), FR-07-02, FR-07-04 (Durée), FR-07-05, FR-07-06, FR-07-08, FR-08-01, FR-08-02, FR-08-04, FR-08-05, FR-08-06, FR-09-01 (interface), FR-09-05 (ouverture, Q21) ; NFR-02, NFR-03, NFR-04, NFR-06, NFR-09 ; Q12, Q15, Q21, Q25, P5, P6, P19, P21, P33, H13, H15.
**Architecture :** AD-7 (Popover, contrat des roulettes : props optionnelles de pas, de bornes et `failureOption` typée, aucune sentinelle numérique, aucune haptique ajoutée, grisé par opacité jamais `disabled`), AD-15 (`selector(commonTarget)`, valeur locale dispatchée à ✓ seulement ; transitions T24 à T26, avec T7, T8 et T10), AD-16 (`nearestGridValue` et `selectorOpeningPosition` dans `ExecutionParameters.ts`), AD-11 (`UNSELECTED_OPACITY`). Voie de la roue : la couche `WheelPickerOverlay` de PRE-3, centrée, sans flèche, fermée par ✕ / ✓ seulement (Q37, 3.1 AC7). *Rendu remplacé par Q37 ; historique : « Voie de la roue dans `Popover.Content` : celle consignée par 3.1 AC7 ».* Fichiers principalement touchés (indicatif) : `src/features/sessions/DurationWheelPicker.tsx`, `src/domain/activities/ExecutionParameters.ts`, `src/features/activities/ExecutionParametersSheet.tsx`, `src/shared/i18n/`.
**Références visuelles :** frames Figma `8328:37862` (Sélecteur, Durée, Cible numérique ; maître `8452:13297`), `8328:37760` (ligne `Durée d’une série`) — visuel seulement, D-255.
**Dépend de :** 3.3.
**Hypothèses non validées :** H13, H15, H23 — à confirmer par la revue ChatGPT/Hermann avant développement.

**Critères d'acceptation :**

**AC1 — Ouverture depuis la ligne commune (FR-07-01, FR-03-11, AD-15).**
**Given** Mode Durée, Régime `identiques`
**When** Hermann touche la valeur de la ligne `Durée d’une série`
**Then** le Sélecteur s'ouvre, sur iOS, dans un panneau sans flèche juste sous le champ `Durée d’une série`, cadre aligné à droite, au-dessus du contenu, avec ses propres ✕ et ✓, sans `Modal` ni l'ancienne modale basse séparée (Q41 ; *historique : « dans un popover ancré sous la ligne », puis Q37 « dans la couche `WheelPickerOverlay`, centré horizontalement sur la page, sans flèche, sur voile »*)  ; le Sélecteur d'une Cellule active (Durée, story 3.6) s'ouvre dans le même panneau, sous la cellule, aligné à droite (Q41, cohérence)
**And** toute autre surface ouverte se ferme sans appliquer ; une seule surface est ouverte.

**AC2 — Composition de la variante Durée (FR-07-02, P6, P21, H15).**
**Given** le Sélecteur ouvert en Durée
**When** Hermann l'observe et fait tourner les colonnes
**Then** de haut en bas : l'option « Aucune durée, à l’échec » centrée, un filet, la roulette native à deux colonnes `minutes` et `secondes`
**And** le libellé est exactement « Aucune durée, à l’échec »
**And** les minutes vont de 00 à 58, sans 59 ; les secondes avancent par pas de 1, de 00 à 59, et de 00 à 55 à 58 minutes (Q36) ; les valeurs proposées vont de 00:05 à 58:55, plus la position `00:00`
**And** la roue des minutes ne reboucle pas de 58 à 00 (H15)
**And** la roulette de Durée totale n'en fait pas partie.

**AC3 — Ouverture sur la Cible courante (FR-07-04).**
**Given** une Cible `NUMBER 30`
**When** le Sélecteur s'ouvre
**Then** la roue est sur 00:30, active, et l'option échec est à 45 % d'opacité
**And** **Given** une Cible `FAILURE`, l'option est à 100 % et le bloc minutes-secondes affiche `00:00` atténué à 45 %
**And** **Given** une Cible `UNSET` (`—` : création en Durée, P19 ; ligne après un changement de Mode ; donnée ancienne sans Cible), la roue s'ouvre sur 00:05, active, sélection numérique, option échec à 45 %, ✓ du Sélecteur disponible ; la position vient de `selectorOpeningPosition("DURATION", UNSET)` du domaine (Q25, AD-16)
**And** pendant l'ouverture, la ligne de la Feuille affiche toujours `—` ; ✕ laisse la Cible à renseigner (`—` sur fond `#FFF1F0`, sans contour, ✓ de la Feuille indisponible) ; ✓ sans avoir tourné applique 5 s (Q25, Q12)
**And** exactement une Cible est sélectionnée ; aucune coche n'est affichée.

**AC4 — Cible historique hors bornes (FR-07-04, FR-09-05, Q21, Q36).**
**Given** une Cible ancienne 5999 s
**When** le Sélecteur s'ouvre
**Then** la roue est sur 58:55, calculé par `nearestGridValue("DURATION", value)` du domaine, qui borne la valeur à 5..3535 (Q36 : sans multiple de 5) ; la roulette reçoit une valeur déjà dans les bornes et ne recale jamais
**And** la ligne de la Feuille affiche toujours 5999 s pendant l'ouverture
**And** ✕ laisse 5999 s intact ; ✓ sans avoir tourné applique 3535 s
**And** **Given** une Cible ancienne 7 s, valide depuis Q36, le Sélecteur s'ouvre sur 00:07 et ✓ sans avoir tourné laisse 7 s.

**AC5 — Passer à l'échec (FR-08-01).**
**Given** le Sélecteur ouvert sur 30 s
**When** Hermann touche « Aucune durée, à l’échec »
**Then** l'option passe à 100 %, la roue revient à `00:00` et tout le bloc minutes-secondes est atténué à 45 %
**And** le rappel du composant reçoit une `SeriesTarget` `FAILURE`, jamais un nombre (AD-7).

**AC6 — Revenir au numérique sans déverrouillage (FR-08-02, P5, FR-07-06).**
**Given** l'échec sélectionné, bloc atténué
**When** Hermann fait directement tourner la roue jusqu'à 00:30
**Then** la Cible sélectionnée devient 30 s ; l'option repasse à 45 % et la roue reprend son rendu actif
**And** aucun appui long, double appui ni déverrouillage n'est nécessaire ; le bloc n'est jamais rendu par un `disabled` natif : l'atténuation est une opacité autour de la primitive (AD-7)
**And** chaque cran donne le retour haptique natif du `Picker`, sans haptique ajoutée (FR-07-06).

**AC7 — `00:00` jamais une Cible (FR-08-04, Q15).**
**Given** une sélection numérique (option à 45 %)
**When** Hermann amène la roue sur `00:00`
**Then** le ✓ du Sélecteur est indisponible et l'échec n'est pas sélectionné : `00:00` n'est jamais converti en échec ni validé
**And** l'indisponibilité passe par la seule prop optionnelle `validateDisabled` ajoutée à `PickerToolbar`, à l'identique dans ses deux copies (`DurationWheelPicker.tsx`, `NumberWheelPicker.tsx`), sans remplacer le composant (AD-7) : le ✓ reçoit `disabled`, `accessibilityState={{ disabled: true }}` et l'opacité `UNSELECTED_OPACITY` ; un appui n'appelle pas `onValidate` ; ✕ reste disponible ; la roue n'est jamais désactivée **And** sans la prop, `PickerToolbar` se comporte comme au départ (Composition, roulette des tours) **And** le rendu du ✓ indisponible n'a pas de frame : il est inscrit `NON VÉRIFIABLE` au relevé et jugé par Hermann à la recette
**And** une Pause de 0 s reste valide ailleurs dans la Feuille.

**AC8 — Valider ou annuler, puis la Feuille (FR-07-05, Q12, AD-15).**
**Given** le Sélecteur ouvert sur 30 s
**When** Hermann tourne vers 45 s puis touche ✕
**Then** la Cible reste 30 s
**And** **When** il tourne vers 45 s et touche ✓, la Cible du Brouillon de la Feuille devient 45 s, l'Éditeur restant inchangé
**And** ✓ de la Feuille applique ensuite à l'Éditeur ; ✕ de la Feuille annule tout, y compris le choix validé dans le Sélecteur
**And** un toucher hors du panneau ferme le Sélecteur sans rien appliquer (Q41) ; la valeur en cours n'atteint jamais le Brouillon avant ✓. *Historique : « l'appui extérieur ferme le Sélecteur sans rien appliquer », puis Q37 « un toucher sur le voile ne ferme pas le Sélecteur ; seuls ✕ et ✓ le ferment ».*

**AC9 — Scénario de transition complet (FR-08-05).**
**Given** une Cible 30 s
**When** Hermann ouvre (roue 00:30, option 45 %), touche l'option (100 %, `00:00` à 45 %), tourne vers 00:30 (30 s, option 45 %), ✓, rouvre ; puis choisit l'échec, ✓, rouvre ; puis change et touche ✕
**Then** il lit successivement : 30 s ; option à 100 % et `00:00` à 45 % ; l'état d'avant l'ouverture restauré.

**AC10 — Ligne commune : affichage et validation (FR-06-05, FR-06-02, FR-08-06, FR-09-01).**
**Given** la ligne `Durée d’une série`
**When** la Cible est `FAILURE`, `UNSET` ou `NUMBER`
**Then** elle affiche `à l’échec`, `—` sur le fond `#FFF1F0` (`color.dangerSurface`), sans contour (Q35), et ✓ de la Feuille indisponible, ou la durée formatée (ex. `30 s`, `1 min`)
**And** aucune Cible à renseigner, 0 ni texte n'est converti en échec (FR-06-02)
**And** aucune nouvelle Cible hors 5..3535 s ne peut sortir du Sélecteur ; toute valeur entière dans ces bornes, multiple de 5 ou non, est valide (FR-09-01, Q36)
**And** aucun écran « Série à l’échec » n'existe (FR-08-06).

**AC11 — Accessibilité du Sélecteur (FR-07-08, H13, H23).**
**Given** VoiceOver activé
**When** Hermann parcourt le Sélecteur
**Then** l'option échec est annoncée « sélectionnée » ou « non sélectionnée », jamais par le gris seul
**And** le bloc atténué reste manipulable avec VoiceOver ; la valeur et son unité sont annoncées ; le focus reste dans le panneau de la roue, modal pour VoiceOver (Q41 ; couche de la roue selon Q37 auparavant)
**And** l'option échec, dessinée sur 30 de haut, a une cible tactile d'au moins 44 × 44 pt (P30)
**And** les textes d'annonce sont des clés du lexique (H23).

**AC12 — Contrat de la roulette et repli (AD-7, NFR-03).**
**Given** `DurationWheelPicker` étendu par des props optionnelles (pas, bornes, `failureOption`)
**When** il est utilisé sans ces props (Composition, roulette des tours)
**Then** son comportement actuel est inchangé ; `WHEEL_SECONDS_STEP` n'est pas modifié
**And** avec `failureOption`, le rappel numérique n'est jamais appelé pour l'échec
**And** hors iOS, la roulette `Legacy*` existante porte la même option et les mêmes transitions (parité testée sous Jest)
**And** sur iOS, la roue de la Cible commune est présentée dans le panneau sans flèche sous le champ (`AnchoredPanel`, conteneur de positionnement, Q41) ; `DurationWheelPicker` et sa `PickerToolbar` y gardent leur mécanisme natif ; `WheelPickerOverlay` reste inchangé pour Composition (*Q37 : « présentée dans `WheelPickerOverlay`, composant PRE-3 accepté, sans autre voie (3.1 AC7) »*). *Historique : « placée dans `Popover.Content` par la voie consignée en 3.1 AC7 ((i) `RNHostView` ou (ii) `Picker` SwiftUI direct) »*
**And** les garde-fous `DurationWheelPicker.test.tsx:378` et `:619` restent verts et inchangés.

**Preuves attendues :**
- Relevé visuel préalable de `8328:37862`, `8328:37760` et du maître `8452:13297`.
- Tests : `nearestGridValue`, bornage depuis Q36 (4 → 5, 5999 → 3535, valeurs dans les bornes inchangées, dont 7 → 7 et 31 → 31) ; `selectorOpeningPosition` (`UNSET` → 00:05, `FAILURE` → option, `NUMBER` → `nearestGridValue`) ; composant (option, transitions, `00:00`, ✕ / ✓, `SeriesTarget` émise, absence de `disabled` sur la roue, `validateDisabled` du ✓ et état d'accessibilité, comportement inchangé sans la prop) ; Feuille (ouverture, ouverture sur `UNSET`, une seule surface, dispatch à ✓) ; garde-fous zéro `ScrollView`.
- Contrôles : `npm test`, `npx tsc --noEmit`, `npm run lint` verts.
- Recette iPhone (dev client « Routine Dev », Q22, après `R-3.1-00`) :
  - `R-3.4-01` — Durée, `identiques`, Cible 30 s. Gestes : scénario d'AC9. Attendu : FR-08-05 pas à pas. Visuel : `8328:37862`.
  - `R-3.4-02` — Gestes : sélection numérique, amener la roue sur `00:00`. Attendu : ✓ du Sélecteur indisponible, pas d'échec (FR-08-04, Q15).
  - `R-3.4-03` — Exercice ancien à Cible 5999 s. Gestes : ouvrir, ✕ ; ouvrir, ✓. Attendu : 58:55 à l'ouverture, 5999 s après ✕, 3535 s après ✓ (Q21). Une Cible ancienne 7 s, valide depuis Q36, ouvre sur 00:07 et n'est pas signalée.
  - `R-3.4-04` — Gestes : faire défiler les minutes jusqu'en butée. Attendu : 58 maximum, aucune 59, pas de rebouclage, secondes au pas de 1 (P21, H15, Q36).
  - `R-3.4-05` — VoiceOver. Attendu : AC11 (FR-07-08).
  - `R-3.4-06` — Préconditions : nouvel Exercice, Mode Durée, Cible `—`. Gestes : ouvrir le Sélecteur, ✕ ; rouvrir, ✓ sans tourner. Attendu fonctionnel : ouverture sur 00:05, option échec à 45 % ; `—` après ✕ ; 5 s après ✓ (Q25, FR-07-04). Attendu visuel : `8328:37862` pour la composition ; position d'ouverture sans frame propre.
- Rappel NFR-04 et P33 : le rendu ligne par ligne de la roue (niveaux 100/45/20/10 %) relève du rendu natif ; un écart est signalé, jamais corrigé par une réimplémentation.

**Hors story :** la variante Répétitions (3.5) ; l'ouverture depuis une cellule du tableau (3.6) ; la roulette de Durée totale (3.7).

---

### Story 3.5 : Sélecteur de cible en Répétitions à une colonne

En tant que Hermann (utilisateur de KODJO),
je veux choisir la Cible d'une Série en Répétitions sur une roulette native à une colonne dont la première ligne est « Aucune répétition, à l’échec », suivie de 1 à 100,
afin de régler un nombre de répétitions ou l'échec du même geste, sans stepper en ligne.

**Exigences :** FR-07-01 (ligne commune en Répétitions), FR-07-03, FR-07-04 (Répétitions), FR-07-05 (Répétitions), FR-07-08 (Répétitions), FR-08-03, FR-09-02 (interface), FR-09-05 (ouverture à 150) ; NFR-02, NFR-03, NFR-04 ; Q8, Q12, Q14, Q21, Q25, P37, H13, H14.
**Architecture :** AD-7 (`NumberWheelPicker` étendu : bornes 1..100 par prop, `failureOption` typée, aucune sentinelle sortante ; voie de la roue : panneau sans flèche sous le champ, aligné à droite, comme 3.4 (Q41, cohérence) — *historique : « dans `Popover.Content` », puis couche `WheelPickerOverlay` (Q37)*), AD-15, AD-16 (`nearestGridValue("REPETITIONS", …)`, `selectorOpeningPosition`). Fichiers principalement touchés (indicatif) : `src/features/sessions/NumberWheelPicker.tsx`, `src/domain/activities/ExecutionParameters.ts`, `src/features/activities/ExecutionParametersSheet.tsx`, `src/shared/i18n/`.
**Références visuelles :** aucune capture de la variante Répétitions (table de 4.22 du PRD) ; référence de contexte `8328:38741` (en-tête de colonne `Répétitions`) et géométrie hôte de `8328:37862` — visuel seulement, D-255. Le rendu de la ligne de tête est `NON VÉRIFIABLE` sur Figma et validé par Hermann sur appareil.
**Dépend de :** 3.4.
**Hypothèses non validées :** H13, H14 — à confirmer par la revue ChatGPT/Hermann avant développement.

**Critères d'acceptation :**

**AC1 — Ouverture depuis la ligne commune (FR-07-01, H14).**
**Given** Mode Répétitions, Régime `identiques`
**When** Hermann touche la valeur de la ligne `Nombre de répétitions`
**Then** le Sélecteur s'ouvre, sur iOS, dans le même panneau sans flèche que 3.4, juste sous le champ `Nombre de répétitions`, cadre aligné à droite, au-dessus du contenu, avec ses propres ✕ et ✓ ; un toucher hors du panneau le ferme sans appliquer ; une seule surface ouverte (Q41, décision de cohérence du 2026-10-17 ; *historique : « dans le même popover ancré », puis Q37 « dans la même couche `WheelPickerOverlay`, centré, sans flèche, fermé par ✕ et ✓ seuls »*).

**AC2 — Une colonne, ligne de tête puis 1 à 100 (FR-07-03, Q8, Q14).**
**Given** le Sélecteur ouvert en Répétitions
**When** Hermann fait tourner la roue
**Then** elle a une seule colonne : première ligne « Aucune répétition, à l’échec », puis les entiers 1 à 100 dans l'ordre croissant
**And** ni filet, ni libellé séparé, ni position `00:00`, ni grisé ajouté n'existent ; la sélection est rendue par la roue native
**And** le stepper en ligne de la Cible Répétitions est retiré (NFR-03, liste fermée).

**AC3 — Choix par la position de la roue (FR-07-03, FR-08-03).**
**Given** la roue sur la ligne de tête
**When** Hermann tourne vers 12
**Then** la Cible sélectionnée devient 12 ; revenir sur la ligne de tête sélectionne l'échec
**And** le rappel du composant reçoit une `SeriesTarget` (`FAILURE` ou `NUMBER`), jamais une sentinelle numérique (AD-7).

**AC4 — Ouverture sur la Cible courante (FR-07-04, Q21).**
**Given** une Cible `NUMBER 12`, puis une Cible `FAILURE`, puis une Cible ancienne 150
**When** le Sélecteur s'ouvre
**Then** la roue est respectivement sur 12, sur la ligne de tête, et sur 100 (`nearestGridValue`)
**And** pour 150, la ligne de la Feuille affiche 150 pendant l'ouverture ; ✕ laisse 150 ; ✓ sans tourner applique 100
**And** **Given** une Cible `UNSET` (`—`, par exemple une ligne après un passage de Durée à Répétitions, P37) **When** le Sélecteur s'ouvre **Then** la roue est sur 1, et non sur la ligne de tête ; la position vient de `selectorOpeningPosition("REPETITIONS", UNSET)` (Q25, AD-16) ; pendant l'ouverture la ligne affiche `—` ; ✕ laisse `—` ; ✓ sans tourner applique 1.

**AC5 — Bornes (FR-09-02).**
**Given** le Sélecteur en Répétitions
**When** Hermann cherche une valeur hors plage
**Then** aucune valeur 0, 101 ou fractionnaire n'est proposée ni ne peut sortir du Sélecteur ; 1 et 100 sont atteignables.

**AC6 — Valider, annuler (FR-07-05, Q12).**
**Given** une Cible 10
**When** Hermann tourne vers 12 puis ✕, puis tourne vers l'échec puis ✓
**Then** la Cible reste 10 après ✕ ; elle devient `à l’échec` dans le Brouillon de la Feuille après ✓, l'Éditeur restant inchangé jusqu'au ✓ de la Feuille.

**AC7 — Accessibilité (FR-07-08, H13).**
**Given** VoiceOver activé
**When** Hermann parcourt la roue
**Then** la ligne de tête est annoncée avec son état sélectionné ou non, et un nombre est annoncé avec son unité
**And** le libellé « Aucune répétition, à l’échec » n'est pas tronqué au point de devenir illisible ; s'il l'est dans la largeur native, l'écart est signalé à Hermann (P33), sans réimplémentation de la roue.

**AC8 — Contrat de la roulette et repli (AD-7, NFR-03).**
**Given** `NumberWheelPicker` étendu par des props optionnelles (bornes, `failureOption`)
**When** il est utilisé sans ces props (Composition, roulette des tours)
**Then** son comportement actuel (1..99) est inchangé ; `WHEEL_NUMBER_MAX` n'est pas modifié
**And** hors iOS, la roulette `Legacy*` porte la même ligne de tête et les mêmes transitions (parité testée)
**And** sur iOS, la roue est présentée dans le panneau sans flèche (`AnchoredPanel`), la même voie que 3.4 (Q41 ; *historique : « placée dans `Popover.Content` par la voie consignée en 3.1 AC7 », puis `WheelPickerOverlay` (Q37)*) ; `PickerToolbar` de `NumberWheelPicker.tsx` reçoit la même prop optionnelle `validateDisabled` que sa copie (AD-7), sans usage obligatoire dans cette variante
**And** le garde-fou `NumberWheelPicker.test.tsx:267` reste vert et inchangé, la largeur explicite de la colonne native est conservée (pas de repli sous `matchContents`).

**Preuves attendues :**
- Relevé visuel préalable : géométrie hôte de `8328:37862` et contexte de `8328:38741` ; la ligne de tête est classée `NON VÉRIFIABLE`.
- Tests : composant (ligne de tête, 1..100, `SeriesTarget` émise, ✕ / ✓) ; `nearestGridValue("REPETITIONS", 150) = 100` ; Feuille ; garde-fou zéro `ScrollView`.
- Contrôles : `npm test`, `npx tsc --noEmit`, `npm run lint` verts.
- Recette iPhone (dev client « Routine Dev », Q22, après `R-3.1-00`) :
  - `R-3.5-01` — Répétitions, `identiques`, Cible 10. Gestes : ouvrir, tourner vers 12, ✕ ; ouvrir, tourner jusqu'à la ligne de tête, ✓ ; rouvrir. Attendu : 10 après ✕ ; `à l’échec` après ✓ ; réouverture sur la ligne de tête (FR-07-03, FR-08-03, Q14). Visuel : `NON VÉRIFIABLE`, jugement de Hermann.
  - `R-3.5-02` — Exercice ancien à Cible 150. Gestes : ouvrir, ✕ ; ouvrir, ✓. Attendu : roue sur 100 ; 150 après ✕ ; 100 après ✓ (Q21).
  - `R-3.5-03` — VoiceOver et texte agrandi. Attendu : AC7.
  - `R-3.5-04` — Préconditions : Exercice en Durée, Cible `—`, passé en Répétitions. Gestes : ouvrir le Sélecteur, ✕ ; rouvrir, ✓ sans tourner. Attendu fonctionnel : roue sur 1 ; `—` après ✕ ; `1 rép.` après ✓ (Q25, P37). Visuel : `NON VÉRIFIABLE`.
- Rappel NFR-04.

**Hors story :** l'ouverture depuis une cellule du tableau (3.6) ; le libellé de la ligne et les autres textes de la Feuille déjà traités (3.3).

---

### Story 3.6 : Tableau des séries variables : Cellule active, Pied commun, retrait, glisser

En tant que Hermann (utilisateur de KODJO),
je veux régler chaque Série du Tableau des séries variables en touchant sa cellule, ajuster la Cellule active par le Pied commun, retirer une ligne avec annulation et réordonner par glisser,
afin de composer une suite de Cibles mixtes (par exemple 10, 12 puis à l'échec) sans steppers permanents ni réglage perdu.

**Exigences :** FR-03-12, FR-06-02 (interface, cellule), FR-06-05, FR-07-01 (cellule), FR-09-04 (Cible et Pause du tableau), FR-09-05 (± depuis une valeur hors grille), FR-09-06 (interface), FR-10-01, FR-10-02, FR-10-03, FR-10-04, FR-10-05 (un seul champ actif, tableau compris), FR-10-06, FR-10-07, FR-10-08, FR-12-02 (interface : − de N, champ ouvert), FR-12-03 (interface), FR-12-05 (interface), FR-12-06 ; NFR-02, NFR-03, NFR-04, NFR-09 ; Q13, Q15, Q21, Q25, Q26, P4, P11, P23, P38, H5 (confirmée par Q29), Q29, H19, H22.
**Architecture :** AD-8 (glisser PRE-3 et actions accessibles monter / descendre conservés ; steppers permanents retirés ; message « Série supprimée — Annuler » par le message existant `ExecutionParametersSheet.tsx:741-768`), AD-15 (`activeCell` = `{ ligne, colonne }` distinct d'`openSurface` = `selector(rowTarget(ligne))` ; table de transitions T1 à T27, dont T21 et T22 pour un champ hors tableau ouvert et T27 pour `Annuler` ; croix inactive tant qu'une surface est ouverte ou qu'une Cellule est active), AD-16 (`stepTarget` et `steppedValue` corrigé, politique `StepperHoldPolicy` de la Cible Durée), AD-2 (dispatch au Brouillon). Fichiers principalement touchés (indicatif) : `src/features/activities/ExecutionParametersSheet.tsx`, `src/domain/activities/ExecutionParameters.ts`, `src/shared/ui/ProfileStepper.tsx`, `src/shared/i18n/`.
**Références visuelles :** frames Figma `8328:38632`, `8328:38741`, `8328:38848`, `8470:13303`, `8328:39279`, `8328:39181` ; maîtres `8129:31593` (ligne), `8129:31601` (Pied commun), `8129:31604` (icône de retrait) — visuel seulement, D-255. Le texte de Phrase de `8328:38848` n'est pas reproduit (P1).
**Dépend de :** 3.5.
**Hypothèses non validées :** H19, H22 — à confirmer par la revue ChatGPT/Hermann avant développement.

**Critères d'acceptation :**

*Q44 (décision de Hermann du 2026-10-17) : la Cellule active et le Pied commun ne sont pas réalisés. Les cellules de Cible et de Pause gardent leurs ± permanents (code PRE-3). Statut des critères : **maintenus** AC1, AC3 (Sélecteur ouvert en touchant la valeur de la cellule de Cible, sous la cellule, Q41 ; ✓ n'applique qu'à cette ligne), AC5 et AC6 (appliqués aux ± de la cellule, par `stepTarget`), AC7, AC8, AC9 (croix inactive tant qu'un outil est ouvert), AC10, AC11, AC12, AC13 (cibles tactiles, annonce de ligne et colonne de la cellule) ; **partiel** AC2 (unicité de la surface ouverte, tableau compris ; un champ hors tableau se ferme au toucher d'une cellule de Cible, T21) ; **sans objet** AC4 (Pied commun), la partie Cellule active d'AC3 et d'AC9, les transitions AD-15 propres à `activeCell` (T4, T9, T11, T12) et R-3.6-08. Les ± d'une cellule sont indisponibles sur l'échec.*

**AC1 — Structure du tableau (FR-10-01, FR-06-05, P23).**
**Given** Régime `variables`, N = 3, Mode Durée
**When** le tableau est affiché
**Then** il est rattaché au champ de Régime ; chaque ligne, numérotée 1 à 3, porte une poignée, un numéro, une cellule de Cible, une cellule de Pause et une commande de retrait
**And** les en-têtes sont `Durée` (ou `Répétitions`) puis `Pause` ; les deux colonnes restent même si toutes les Cibles sont à l'échec
**And** une cellule de Cible affiche `30 s`, `1 min`, `12 rép.` ou `à l’échec`
**And** la disposition est la grille à cellules du DSF du 12/10, sans retraits x52 ; le tableau ne défile pas indépendamment du corps.
**And** **Given** la Feuille ouverte, le tableau n'est pas sélectionné et le groupe « Séries variables » est à l'état normal, sans fond ni contour **When** Hermann active les séries variables, déplie le tableau ou agit dans le tableau (cellule, ±, glisser, retrait) **Then** le groupe prend le fond d'une ligne sélectionnée, sans contour ; **When** il sélectionne ensuite un autre champ hors du tableau (popover, roue, ± de N, du Bip ou d'une autre ligne) ou replie le tableau **Then** le groupe revient à l'état normal (le cadre fixe X-3 du code de départ est retiré) — source : Q40 (décision de Hermann du 2026-10-17, écart E-14).

**AC2 — Une seule Cellule active, désignée trois fois (FR-10-02, FR-10-05, P11).**
**Given** le tableau affiché
**When** Hermann touche la cellule Pause de la ligne 2, puis la cellule Pause de la ligne 3
**Then** aucune cellule n'a de − / + permanents
**And** la cellule touchée devient la seule Cellule active, la précédente étant désactivée d'un seul geste ; une seule surface ou champ actif existe dans toute la Feuille, tableau compris
**And** elle est désignée par une barre d'accent sur sa ligne, un fond sur sa colonne et la mention `Série 3 · Pause` dans le Pied commun
**And** **Given** un champ hors tableau ouvert (par exemple N, ou `Pause après chaque série`) **When** Hermann touche une cellule de Cible ou de Pause **Then** le champ se ferme et la cellule devient la Cellule active **dans le même geste** ; une cellule de Cible ouvre en outre son Sélecteur (FR-03-05, FR-10-05 ; AD-15, T21)
**And** **Given** le champ de N ouvert, N = 3 **When** Hermann touche − **Then** N = 2, la ligne 3 est retirée du Brouillon (FR-12-02) et le champ de N reste ouvert ; **When** Hermann touche ensuite la cellule de Cible de la ligne 2 **Then** le champ de N se ferme, la cellule devient la Cellule active et le Sélecteur s'ouvre sur sa Cible, d'un seul geste (AD-15, T16, T22, T21 ; séquence S4 rejouée dans la spine).

**AC3 — Cellule de Cible et Sélecteur (FR-10-03, FR-07-01, Q13, Q21).**
**Given** Mode Durée, ligne 3 à 45 s
**When** Hermann touche la cellule de Cible de la ligne 3
**Then** elle devient Cellule active et le Sélecteur de la story 3.4 s'ouvre sur 00:45 (en Répétitions, celui de la story 3.5) ; une Cible hors bornes ouvre sur la valeur valide la plus proche (bornage, Q36) ; une Cible `UNSET` ouvre sur la valeur minimale, 00:05 ou 1 (Q25, `selectorOpeningPosition`)
**And** ✓ sur l'échec fait afficher `à l’échec` ; ✓ sur un nombre l'affiche ; ✕ laisse la cellule inchangée
**And** seule la cellule touchée change ; les autres lignes sont inchangées
**And** à la fermeture du Sélecteur par son ✓ ou son ✕, la cellule reste la Cellule active, de sorte que le Pied commun agit sur elle (Q13 : toucher la cellule l'active, et les ± du Pied commun ajustent la Cible numérique de la Cellule active) : `activeCell` reste `{ 3, target }` et `openSurface` revient à `none` (AD-15, T5, T6)
**And** une fermeture du Sélecteur par appui extérieur (hors de la bulle, ou geste d'échappement) ferme sans appliquer et range l'outil : plus aucune Cellule active, ± du Pied indisponibles (FR-10-04 ; AD-15, T7) ; toucher une autre cellule pendant que le Sélecteur est ouvert ferme le Sélecteur sans appliquer, sans activer la cellule touchée : la primitive native absorbe l'appui (T10 ; à la différence d'un champ hors tableau ouvert, T21). *Présentation remplacée par Q41 (cohérence) : le Sélecteur de la Cellule active s'ouvre dans le panneau sans flèche, sous la cellule, aligné à droite ; un toucher hors du panneau le ferme sans appliquer et n'active pas la cellule touchée (T7, T10 rétablies). Historique Q37 : la roue est dans la couche `WheelPickerOverlay`, dont le voile n'est pas pressable ; un toucher hors de la roue ne la ferme pas et n'atteint ni une cellule ni le Pied ; seuls ✕ et ✓ la ferment, et la Cellule active est alors conservée (T5, T6). T7 ne reste atteignable que par un geste d'échappement système, s'il existe, avec le même effet*
**And** pendant que le Sélecteur est ouvert, les ± du Pied sont indisponibles (AD-15, T12 ; FR-22-11)
**And** un rappel natif `onIsPresentedChange(false)` reçu après le ✓ ou le ✕ (surface déjà fermée) ne désactive pas la Cellule active : un test de réducteur rejoue ✕ puis le rappel tardif et vérifie `activeCell = { 3, target }` (AD-15, T8).

**AC4 — Pied commun (FR-10-04, FR-03-12, Q15, Q26, AD-16).**
**Given** une Cellule active
**When** Hermann touche − ou + du Pied commun
**Then** le Pied montre à gauche la mention `Série i · <champ>` et à droite − / + qui n'agissent que sur la Cellule active
**And** pas et bornes : Cible Durée appui 1 s et maintien accéléré dans 5..3535 s (Q36) ; Cible Répétitions pas de 1 dans 1..100 ; Pause appui 1 s et maintien accéléré dans 0..300 s ; saturation aux bornes
**And** chaque appui est acquis dans le Brouillon de la Feuille, sans bouton Annuler, et reste annulé par ✕ de la Feuille
**And** sur une Cible `FAILURE`, − et + sont indisponibles (Q13)
**And** **Given** une Cellule active de Cible `UNSET` (`—`) **When** Hermann touche + **Then** la Cible devient la valeur minimale, 5 s en Durée ou 1 en Répétitions, et le fond `#FFF1F0` disparaît (Q35) ; − est indisponible tant que la Cible est `UNSET` (Q26 ; `stepTarget(mode, UNSET, "+")` = valeur minimale, `stepTarget(mode, UNSET, "−")` = `unavailable`, AD-16)
**And** **Given** aucune Cellule active (ouverture de la Feuille, passage en `variables`, ou après qu'un appui extérieur a rangé l'outil) **Then** le Pied commun reste affiché, sans mention de cellule, et ses − et + sont indisponibles, annoncés comme tels (`accessibilityState.disabled`) ; aucune cellule n'est active à l'ouverture de la Feuille (Q26, FR-10-04, AD-16) ; la géométrie du Pied est celle de l'état avec Cellule active, sans composant nouveau.

**AC5 — ± depuis une Cible hors grille ou hors plage (FR-09-05, Q21, P38, AD-16).**
**Given** une Cellule active de Cible Durée 7 s, puis 5999 s ; une Cible Répétitions 150
**When** Hermann touche + puis − (sur une copie de l'état de départ)
**Then** depuis 7 s, valeur valide depuis Q36 : + → 8 s, − → 6 s ; depuis 5999 s : + indisponible, − → 3535 s ; depuis 150 répétitions : + indisponible, − → 100
**And** les résultats proviennent de `stepTarget(mode, target, direction)` du domaine (AD-16) ; le bouton est indisponible sur `unavailable`
**And** `steppedValue` ne renvoie jamais une valeur inférieure à la courante pour + ni supérieure pour − (correction de `steppedValue(5999, +1, 5, 5, 3535)`, qui renvoie 3535 aujourd'hui) ; le Profil est inchangé.

**AC6 — Maintien sur une Cible Durée (FR-09-04, H19, Q36).**
**Given** une Cellule active de Cible Durée à 30 s
**When** Hermann maintient +
**Then** la valeur avance de 1 s (pas de base, Q36 : la politique à pas de base 5 est levée), puis par paliers de 5 s puis de 10 s, arrondis au multiple dans le sens du geste, selon les seuils de temps d'`EXECUTION_ACCELERATED_HOLD_POLICY`, avec saturation à 3535 s sans rebouclage
**And** le relâchement arrête la répétition sans pas supplémentaire
**And** `PROFILE_HOLD_POLICY` est inchangée ; aucune accélération ne s'applique aux roulettes
**And** **Given** une Cellule active de Cible Répétitions à 10 **When** Hermann maintient + **Then** la règle générale de maintien de FR-09-04 s'applique par la politique existante `EXECUTION_ACCELERATED_HOLD_POLICY` : pas de 1, puis paliers de 5 et de 10 arrondis au multiple dans le sens du geste, saturation à 100 sans rebouclage (AD-16 ; aucune politique nouvelle).

**AC7 — Cellule à renseigner (FR-10-06, FR-06-02, P4).**
**Given** une Cible `UNSET` (par exemple après un changement de Mode)
**When** le tableau est affiché, déplié ou replié
**Then** la cellule prend le fond `#FFF1F0` (`color.dangerSurface`), sans contour (Q35), et le ✓ de la Feuille est indisponible
**And** aucun message en ligne n'apparaît (ni « Renseignez la durée… », ni « Renseignez les répétitions », ni nom de Série)
**And** la Cible n'est jamais convertie en échec.

**AC8 — Glisser une ligne (FR-10-07, FR-03-12, FR-12-03, AD-8).**
**Given** N = 3, lignes (30 s, 10 s), (45 s, 20 s), (à l'échec, 30 s)
**When** Hermann glisse la poignée de la ligne 3 en tête
**Then** la ligne entière se déplace ; le corps de la Feuille reste immobile ; un repère d'insertion (trait bleu Kodjo de 2) montre la position de dépôt
**And** l'ordre devient (à l'échec, 30 s), (30 s, 10 s), (45 s, 20 s), renuméroté, la nouvelle dernière ligne portant PN
**And** le mécanisme de glisser PRE-3 (responder React Native) est conservé, sans `List` native
**And** l'alternative accessible produit le même déplacement : actions VoiceOver `Monter la série {n}` et `Descendre la série {n}` de chaque ligne, libellés existants du lexique (`src/shared/i18n/index.ts:43-44`), conservés (FR-10-07, FR-22-09).

**AC9 — Retrait par la croix et annulation (FR-12-05, H5 confirmée par Q29, AD-15).**
**Given** N = 4, aucune surface ouverte et aucune Cellule active
**When** Hermann touche la croix de la ligne 2
**Then** la ligne est supprimée immédiatement, sans confirmation, avec sa Pause ; les lignes suivantes sont renumérotées
**And** le message discret « Série supprimée — Annuler » s'affiche par le message existant de la Feuille, sans écran ni durée nouveaux
**And** `Annuler` restaure la ligne en position 2 avec sa Cible et sa Pause, jusqu'à la modification suivante du Brouillon de la Feuille ou la fermeture de la Feuille ; toute modification du Brouillon l'invalide (Cible, Pause, N, Mode, Régime, Bip, Pause commune, réordonnancement, autre retrait), seules l'ouverture et la fermeture d'un popover ou du Sélecteur sans application ne l'invalident pas (Q29 ; 3.2 AC10)
**And** la croix est indisponible à N = 1
**And** tant qu'un champ hors tableau est ouvert ou qu'une Cellule est active, l'appui qui le range ne déclenche jamais la croix ; il active dans le même geste une cible inoffensive (autre valeur, autre cellule, ligne d'un popover, chevron) (FR-10-04, FR-03-05 ; AD-15, T13, T20, T21, T23)
**And** tant qu'un Sélecteur ou un popover est ouvert, la primitive native absorbe l'appui : la surface se ferme sans appliquer et rien n'est activé par ce geste, ni la croix, ni une cellule, ni une autre valeur (FR-22-11, FR-03-10 ; AD-15, T7, T10). *Pour un Sélecteur, depuis Q37 : le voile de `WheelPickerOverlay` absorbe l'appui sans fermer la roue ; rien n'est activé. Depuis Q41 (cohérence), le panneau sans flèche se ferme sans appliquer à l'appui extérieur, et rien n'est activé par ce geste*
**And** **Given** une ligne retirée, puis la Cible d'une autre ligne touchée et son Sélecteur fermé par ✕ (Cellule active conservée, T6) **When** Hermann touche `Annuler` **Then** la ligne retirée est restaurée à sa position et la Cellule active le reste : `Annuler` ne range pas l'outil, et la restauration n'invalide rien (Q29 ; AD-15, T27).

**AC10 — Affichage de N (FR-12-06, H22).**
**Given** la ligne `Séries`
**When** N vaut 1 puis 3
**Then** elle affiche `1 série` puis `3 séries`, textes du lexique (repris des captures `8328:37760`, `8328:38632`, validés par Hermann à la recette).

**AC11 — Bip commun hors tableau (FR-10-08, P22).**
**Given** `variables`
**When** le tableau est affiché
**Then** aucune ligne ne porte de Bip ; le `Bip de cadence` reste au premier niveau, à la place définie par FR-03-02.

**AC12 — Absence d'état partiel (FR-09-06).**
**Given** une saisie refusée (+ indisponible), une Cible manquante ou un retrait annulé
**When** Hermann ferme la Feuille par ✕ ou la valide par ✓
**Then** l'Éditeur reste dans son état complet antérieur (✕) ou reçoit d'un bloc un état valide (✓) ; les bornes de Cible ne modifient ni les bornes des Pauses ni celles de la Durée totale.

**AC13 — Cibles tactiles et accessibilité des cellules (FR-10-02, FR-22-09 lecture, P30).**
**Given** la poignée dessinée 12 × 18 et les cellules dessinées 76 × 24
**When** Hermann les touche ou les parcourt avec VoiceOver
**Then** chacune a une cible d'au moins 44 × 44 pt sans agrandir le dessin
**And** la Cellule active est identifiée par sa ligne et sa colonne (`Série i · Durée`), pas seulement par la couleur, et la mention du Pied est annoncée.

**Preuves attendues :**
- Relevé visuel préalable des frames et maîtres cités.
- Tests : `stepTarget` (cas d'AC5 ; `UNSET` : + → 5 s ou 1, − `unavailable` ; `FAILURE` : `unavailable`), `steppedValue` corrigé, politiques de maintien des Cibles Durée et Répétitions ; réducteur d'interface d'AD-15 : un test par transition T1 à T27 (la table complète, y compris les lignes déjà testées en 3.3, 3.4 et 3.7), dont la séquence de R-3.6-08 (T1, T3, T6, T12, T11, T13), la séquence S4 (T16, T22, T21), `Annuler` avec une Cellule active (T27), la règle « Ligne disparue » et le rappel tardif ignoré (T8) ; Feuille : une seule Cellule active, aucune Cellule active à l'ouverture, Pied sans Cellule active (± indisponibles, sans mention), Sélecteur depuis la cellule (ouverture sur `UNSET`), Pied commun, ± indisponibles sur l'échec, fond `#FFF1F0` sans contour ni message (Q35), glisser et actions accessibles, croix inactive sous surface ouverte, « Série supprimée — Annuler » ; garde-fous zéro `ScrollView` inchangés.
- Contrôles : `npm test`, `npx tsc --noEmit`, `npm run lint` verts.
- Recette iPhone (dev client « Routine Dev », Q22, après `R-3.1-00`) :
  - `R-3.6-01` — Durée, `variables`, N = 3. Gestes : toucher la Cible de la ligne 3, choisir l'échec, ✓ ; toucher la Cible de la ligne 1, ± du Pied. Attendu : `à l’échec` en ligne 3, pas de 1 s en ligne 1 (Q36), ± indisponibles sur la ligne 3 (FR-10-03, FR-10-04, Q13). Visuel : `8328:38632`, `8328:38848`, `8470:13303`.
  - `R-3.6-02` — Répétitions, `variables`. Gestes : régler 10, 12, échec. Attendu : `10 rép.`, `12 rép.`, `à l’échec` (FR-10-01). Visuel : `8328:38741`.
  - `R-3.6-03` — Gestes : glisser la ligne 3 en tête ; avec VoiceOver, monter une ligne. Attendu : FR-10-07, FR-12-03. Visuel : `8328:39279`.
  - `R-3.6-04` — Gestes : croix de la ligne 2, `Annuler` ; croix, ouvrir puis fermer par ✕ le Sélecteur d'une autre ligne, `Annuler` ; croix, puis changer une Pause. Attendu : restauration ; `Annuler` toujours disponible après l'ouverture et la fermeture sans application, et la cellule de l'autre ligne toujours active après `Annuler` ; `Annuler` invalidé après la Pause (FR-12-05, Q29 ; AD-15 T6, T27).
  - `R-3.6-05` — Exercice ancien à Cible 7 s et 5999 s. Gestes : ± du Pied. Attendu : AC5 (Q21, P38).
  - `R-3.6-06` — Gestes : N à 1 puis 99 ; réduire, augmenter, restaurer ; déplacer la dernière Série puis changer la dernière ligne. Attendu : FR-12-01 à FR-12-04, FR-12-06.
  - `R-3.6-07` — Cible `—` après changement de Mode, tableau replié. Attendu : fond `#FFF1F0`, sans contour (Q35), ✓ indisponible, aucun message (FR-10-06, FR-04-02). Visuel : `8328:39181`.
  - `R-3.6-08` — Préconditions : Durée, `variables`, N = 3, une ligne à Cible `—`. Gestes : ouvrir la Feuille sans toucher le tableau, observer le Pied ; toucher la cellule `—`, ✕ ; toucher −, puis + ; toucher hors du tableau. Attendu fonctionnel : à l'ouverture, aucune Cellule active, Pied affiché sans mention, ± indisponibles ; Sélecteur ouvert sur 00:05 puis `—` conservé après ✕ ; − indisponible, + donne 5 s et retire le fond `#FFF1F0` (Q35) ; après l'appui extérieur, ± de nouveau indisponibles (Q25, Q26 ; transitions AD-15 T1, T3, T6, T12, T11, T13). Attendu visuel : `8328:38632` pour le Pied avec Cellule active ; état sans Cellule active sans frame propre (`NON VÉRIFIABLE`).
  - `R-3.6-09` — Préconditions : Durée, `variables`, N = 3, Cibles 30 s, 45 s, 60 s. Gestes : toucher la valeur de N ; − ; toucher la cellule de Cible de la ligne 2. Attendu fonctionnel : après −, deux lignes et le champ de N toujours ouvert ; au toucher de la cellule, champ de N fermé, cellule de la ligne 2 active et Sélecteur ouvert sur 00:45, d'un seul geste (FR-03-05, FR-10-05, FR-12-02 ; AD-15 T16, T22, T21). Attendu visuel : `8328:38632` ; transition sans frame (`NON VÉRIFIABLE`).
- Rappel NFR-04.

**Hors story :** la Durée totale (3.7) ; le comportement sous N hérité (FR-12-07, P42, hors recette).

---

### Story 3.7 : Ligne Durée totale et Inversion dans la Feuille

En tant que Hermann (utilisateur de KODJO),
je veux lire dans la Feuille une ligne Durée totale dont la forme suit le Mode, le Régime, le Bip et les Cibles, et, quand la règle le permet, choisir une Durée totale par sa propre roulette pour obtenir N,
afin de savoir ce que durera l'Exercice, ou au moins combien il durera au minimum, sans jamais lire un total faux.

**Exigences :** FR-03-11 (roulette de Durée totale), FR-07-05 (double validation pour le total), FR-07-07, FR-14-01, FR-14-04, FR-14-05 ; FR-14-02 et FR-14-03 (domaine livré par 2.1, vérifiés ici à l'interface) ; NFR-04, NFR-06, NFR-08 ; Q12, P24, H8, H10, H18.
**Architecture :** AD-5 (nature et disponibilité de l'Inversion lues dans `executionCalculations.ts` ; formateur unique `durationFormat.ts`), AD-7 (roulette de Durée totale dans un panneau sans flèche sous le champ, Q41 — *historique : « dans un popover », puis couche `WheelPickerOverlay` (Q37)* —, bornes inchangées, aucune option échec), AD-15 (`selector(total)` ; transitions T24 à T26, avec T7, T8 et T10), AD-2 (Inversion par une transition du Brouillon), AD-11. Fichiers principalement touchés (indicatif) : `src/features/activities/ExecutionParametersSheet.tsx`, `src/shared/i18n/`.
**Références visuelles :** frames Figma `8328:38084` (roulette de Durée totale ; maître `5544:5118`), `8328:38409` (message d'ajustement), `8470:13303` (cas mixte en lecture seule) — visuel seulement, D-255.
**Dépend de :** 3.4, 2.1.
**Hypothèses non validées :** H8, H10, H18 — à confirmer par la revue ChatGPT/Hermann avant développement.

**Critères d'acceptation :**

**AC1 — Forme de la ligne selon le cas (FR-14-01, P24).**
**Given** le Brouillon de la Feuille
**When** il est dans l'un des cas suivants
**Then** la ligne `Durée totale` est :
- Durée, `identiques`, Cible numérique, N libre → modifiable par roulette ;
- Durée en `variables` à Cibles toutes numériques, ou Répétitions avec Bip et Cibles toutes numériques → lecture seule (`≈` en Répétitions) ;
- mélange calculable → lecture seule, montant précédé de `≥` : Cibles 30 s / 45 s / à l'échec, Pauses 10 / 20 / 30 s → `≥ 2 min 15 s` ;
- Répétitions sans Bip, ou toutes les Cibles à l'échec, ou `identiques` avec la Cible à l'échec → **aucune ligne** ;
**And** aucune nouvelle composante d'interface n'est créée pour l'interdiction de l'Inversion.

**AC2 — Recalcul et Cible incomplète (FR-14-01, H10, FR-06-02).**
**Given** la ligne affichée
**When** une Cible, une Pause, N, les côtés, le Bip ou le Mode changent dans le Brouillon
**Then** la ligne se recalcule aussitôt
**And** tant qu'une Cible est `UNSET`, aucune ligne ni montant n'apparaît et ✓ est indisponible ; aucun montant n'est inventé (H10, NFR-06)
**And** le retrait de la ligne raccourcit la Feuille, le `Bip de cadence` passant juste avant `Compte à rebours` (FR-03-02).

**AC3 — Restriction de l'Inversion à l'interface (FR-14-02).**
**Given** une Cible à l'échec (en `identiques` ou en `variables`), ou le Régime `variables`, ou le Mode Répétitions
**When** Hermann touche la ligne Durée totale (si elle existe)
**Then** aucune roulette ne s'ouvre ; la valeur est en lecture seule.

**AC4 — Roulette de Durée totale distincte (FR-07-07, FR-03-11, Q12, AD-7).**
**Given** Durée, `identiques`, d = 30 s, p = 10 s, unilatéral
**When** Hermann touche la ligne Durée totale
**Then** une roulette s'ouvre, sur iOS, dans un panneau sans flèche juste sous le champ Durée totale, cadre aligné à droite, au-dessus du contenu, sans `Modal`, sans animation saccadée ni animation de hauteur, avec ses propres ✕ / ✓ ; un toucher hors du panneau la ferme sans appliquer ; si le panneau dépasse le bas du contenu, une réserve vide est ajoutée sous le groupe (et le corps défile jusqu'au bas si la Feuille est à sa hauteur maximale), sans déplacer de ligne ; sans option échec et distincte du Sélecteur de cible (Q41, AD-7) ; Android et web : roulette en ligne dans le cadre de sélection de la ligne ; *historique : « dans un popover ancré sous la ligne […] ; sur iOS, la roue est placée dans `Popover.Content` par la voie consignée en 3.1 AC7 », puis Q37 « dans la couche `WheelPickerOverlay`, centrée horizontalement, sans flèche, sur voile, fermée par ✕ / ✓ seulement »*
**And** ses bornes vont de T(1) = `40 s` à T(99) = 3 960 s = `66 min`, à la seconde, la colonne des minutes allant jusqu'à T(99) sans colonne ni contrôle supplémentaire (FR-14-03, H8)
**And** ✕ restaure la valeur d'avant ouverture ; ✓ applique au Brouillon de la Feuille, puis ✓ de la Feuille applique à l'Éditeur.

**AC5 — Inversion exacte, sans message (FR-14-03).**
**Given** l'Exercice d'AC4
**When** Hermann choisit Tv = 160 s puis ✓
**Then** N = 4, T(4) = 160 s, aucun message ; la Cible reste 30 s.

**AC6 — Ajustement signalé et annulable (FR-14-04).**
**Given** l'Exercice d'AC4
**When** Hermann choisit Tv = 180 s puis ✓
**Then** N = 5 (égalité 160 s / 200 s tranchée vers le plus grand N), la ligne réaffiche `3 min 20 s`
**And** le message littéral `Durée ajustée à 3 min 20 s pour respecter un nombre entier de séries.` s'affiche avec `Annuler`
**And** `Annuler` restaure N et la Durée totale d'avant l'ajustement ; toucher le reste du message le ferme sans annuler
**And** `Annuler` est présenté en capsule sans contour, blanc transparent à 90 %, demi-cercles, marges droite, haut et bas égales (rendu à valider sur appareil).

**AC7 — Accessibilité du total (FR-14-05).**
**Given** VoiceOver activé
**When** Hermann atteint la ligne Durée totale
**Then** `≈` est annoncé « estimation », `≥` « total prévisionnel partiel », et le caractère non modifiable d'un total en lecture seule est annoncé
**And** une valeur en lecture seule est annoncée avec sa valeur, jamais par un tiret, et l'état n'est jamais transmis par le gris seul ; les textes sont des clés du lexique.

**AC8 — Formatage unique (AD-5, H8).**
**Given** tout montant affiché par la ligne
**When** il est rendu
**Then** il passe par le formateur unique de `durationFormat.ts` (ex. `2 min 15 s`, `66 min`) ; la Feuille ne formate aucune durée elle-même.

**Preuves attendues :**
- Relevé visuel préalable de `8328:38084`, `8328:38409`, `8470:13303`, maître `5544:5118`.
- Tests : forme de la ligne pour chaque cas d'AC1 (montants recalculés par formule dans le test, jamais par `executionCalculations`) ; roulette ✕ / ✓ ; Inversion 160 s et 180 s ; message et `Annuler` ; absence de roulette sur échec, `variables`, Répétitions ; garde-fous zéro `ScrollView` inchangés.
- Contrôles : `npm test`, `npx tsc --noEmit`, `npm run lint` verts.
- Recette iPhone (dev client « Routine Dev », Q22, après `R-3.1-00`) :
  - `R-3.7-01` — Durée, `identiques`, 30 s, Pause 10 s. Gestes : ouvrir la roulette du total, choisir 3 min (180 s), ✓ ; `Annuler`. Attendu : N = 5, message littéral, restauration (FR-14-03, FR-14-04). Visuel : `8328:38084`, `8328:38409`.
  - `R-3.7-02` — `variables`, 30 s / 45 s / à l'échec, Pauses 10 / 20 / 30 s. Attendu : `≥ 2 min 15 s` en lecture seule, aucune roulette (FR-14-01, FR-14-02). Visuel : `8470:13303`.
  - `R-3.7-03` — Répétitions sans Bip ; puis tout à l'échec. Attendu : aucune ligne Durée totale, Bip juste avant `Compte à rebours` (P24).
  - `R-3.7-04` — VoiceOver sur `≈` et `≥`. Attendu : AC7.
- Rappel NFR-04.

**Hors story :** le calcul des natures et de l'Inversion (2.1) ; la Durée totale sur les cartes (2.4) ; la Phrase des paramètres (2.3) ; le total sous N hérité (compatibilité seulement, FR-12-07).

---

### Story 3.8 : Accessibilité et recette de la Feuille

En tant que Hermann (utilisateur de KODJO),
je veux une Feuille entièrement utilisable avec VoiceOver, sans action extérieure déclenchable pendant qu'une roulette est ouverte, qui maintient les décisions de recette PRE-3 non supersédées, et une liste complète de scénarios de recette,
afin de valider sur mon iPhone toute la Feuille Paramètres d'exécution, état par état.

**Exigences :** FR-03-13, FR-22-08, FR-22-11 (Feuille), FR-03-01 (focus), FR-22-05 et FR-22-06 (vérification sur la Feuille seulement) ; NFR-04, NFR-08, NFR-09, NFR-10 ; H13, H23, D-143.
**Architecture :** AD-7, AD-11, AD-15. Fichiers principalement touchés (indicatif) : `src/features/activities/ExecutionParametersSheet.tsx` (libellés et traits d'accessibilité), `src/shared/i18n/`, tests de la Feuille, `docs/preparation/PRE-4/bmad/recette-iphone.md` (scénarios de la Feuille).
**Références visuelles :** frames Figma `8328:36923`, `8328:37092`, `8328:37760`, `8328:37862`, `8328:37972`, `8328:38084`, `8328:38193`, `8328:38301`, `8328:38409`, `8328:38513`, `8328:38632`, `8328:38741`, `8328:38848`, `8470:13303`, `8328:38953`, `8328:39072`, `8328:39181`, `8328:39279`, `8328:39390` — visuel seulement, D-255.
**Dépend de :** 3.3, 3.4, 3.5, 3.6, 3.7.
**Hypothèses non validées :** H13, H23 — à confirmer par la revue ChatGPT/Hermann avant développement.

**Critères d'acceptation :**

**AC1 — Focus et en-tête (FR-22-08, FR-03-01).**
**Given** VoiceOver activé et la Feuille ouverte
**When** Hermann la parcourt
**Then** le focus reste confiné dans la Feuille ; ✕ et ✓ ont un libellé accessible ; à la fermeture, le focus revient à la Carte Paramètres d'exécution
**And** le Régime `variables` est annoncé.

**AC2 — Valeurs, Cellule active et Bip (FR-22-08).**
**Given** VoiceOver activé
**When** Hermann atteint une valeur en lecture seule, la Cellule active et le `Bip de cadence`
**Then** une valeur en lecture seule est annoncée avec sa valeur et son origine, jamais un tiret
**And** la Cellule active est annoncée par sa ligne et sa colonne (`Série i · Durée`)
**And** `Bip de cadence` a ce nom accessible, la valeur `Aucun` ou l'intervalle en secondes, et ses actions augmenter, diminuer et limites sont annoncées
**And** chaque ligne du Tableau des séries variables expose les actions `Monter la série {n}` et `Descendre la série {n}` (3.6 AC8), et la poignée son libellé existant `Déplacer la série {n}` ; ces libellés sont ceux que 4.6 AC8 vérifie.

**AC3 — Totaux, échec et côtés (FR-22-08, D-143).**
**Given** VoiceOver activé
**When** Hermann atteint la Durée totale, une option échec, une Cible à l'échec et le Changement de côté
**Then** `≈` est annoncé comme estimation, `≥` comme total prévisionnel partiel, et le total comme non modifiable
**And** `Aucune durée, à l’échec` et `Aucune répétition, à l’échec` sont annoncées sélectionnées ou non ; une Cible à l'échec est annoncée ; le grisé n'est jamais le seul indicateur
**And** la valeur et l'unité de la Cible sont annoncées dans le Sélecteur
**And** les directions du Changement de côté sont annoncées en toutes lettres.

**AC4 — Textes du lexique (FR-22-08, H23, NFR-08).**
**Given** toutes les annonces de la Feuille
**When** le code est relu
**Then** chaque texte d'annonce est une clé de `src/shared/i18n/`, avec le vocabulaire du glossaire et l'apostrophe `’` ; aucun texte en dur ; les textes sont listés pour validation par Hermann.

**AC5 — Surface ouverte et actions extérieures (FR-22-11, AD-15).**
**Given** une roulette ouverte (Sélecteur de cible ou Durée totale) dans la Feuille
**When** Hermann, au doigt ou par VoiceOver, tente d'activer `Terminer`, la croix d'une ligne, ✓ de la Feuille ou une autre ligne
**Then** aucune action extérieure n'est déclenchée : l'Éditeur est inerte sous la Feuille, et dans la Feuille l'appui extérieur ferme la roulette sans appliquer ni déclencher de commande destructive. *Depuis Q37 : l'appui sur le voile de `WheelPickerOverlay` ne ferme pas la roulette et ne déclenche rien ; seuls ✕ et ✓ la ferment. Depuis Q41 (roue de Durée commune et roue de Durée totale, iOS) : l'appui hors du panneau sans flèche le ferme sans appliquer ni déclencher la commande touchée.*

**AC6 — Décisions de recette PRE-3 maintenues (FR-03-13).**
**Given** la table de FR-03-13
**When** l'agent vérifie chaque règle PRE-3 non supersédée
**Then** chacune est couverte par un test existant ou ajouté, rattaché à l'exigence PRE-4 citée (FR-03-01, FR-11-01, FR-04-03, FR-04-04, FR-12-01 à FR-12-04, FR-11-03, FR-11-04, FR-04-02, FR-03-02, FR-03-05, FR-09-04, NFR-03)
**And** seules les règles PRE-3 supersédées listées par FR-03-13 (steppers en place et permanents, message nommant la Série, Mode à trois valeurs, Cible Durée 1..5999 s, retraits x52 du tableau, segmentés intégrés, présentations D-339 et D-341) sont absentes de l'interface.

**AC7 — Texte agrandi et largeurs, Feuille seule (FR-22-05, FR-22-06).**
**Given** le texte du système à 100 %, 135 % et ≈ 200 %, et les largeurs 360, 402 et 440
**When** la Feuille est affichée dans ses états de référence
**Then** l'en-tête reste accessible, aucune hauteur fixe ne rogne un texte ni les ±, aucun chevauchement ni débordement horizontal, aucune action essentielle masquée ; aucun `maxFontSizeMultiplier` ni `allowFontScaling` à faux.

**AC8 — Scénarios de recette de la Feuille (NFR-04, Q5).**
**Given** les scénarios `R-3.1-xx` à `R-3.7-xx`
**When** l'agent rédige la section Feuille de `docs/preparation/PRE-4/bmad/recette-iphone.md`
**Then** il les consolide au format du §3 (ID, ED et story, préconditions, gestes, attendu fonctionnel sourcé, attendu visuel par frame, résultat vide), avec au moins un scénario par popover et par roulette (Mode, Côté, Ordre, Régime, Sélecteur Durée et Répétitions, Durée totale), le grisé manipulable, le tableau et son Pied commun, et VoiceOver et texte agrandi
**And** il ajoute les états exigés sans frame qui touchent la Feuille : validation incomplète (fond `#FFF1F0`, Q35), douze Séries avec défilement, Répétitions avec option échec ; leur attendu visuel est « jugement de Hermann »
**And** aucun résultat n'est prérempli ; la colonne Résultat reste vide jusqu'à la recette par Hermann.

**AC9 — Apparitions et disparitions fluides, sans fondu (NFR-10, Q39, Q40, Q41).**
**Given** la Feuille ouverte, « Réduire les animations » désactivé
**When** une ligne, un sélecteur en ligne, une roulette en ligne, le tableau des séries variables ou l'une de ses lignes, ou le message d'ajustement apparaît ou disparaît (N 1 ↔ 2 ↔ 3, Séries variables, bilatéral, Mode, ouverture et fermeture d'un sélecteur)
**Then** aucune opacité n'est animée : l'élément monte de bas en haut, révélé par un cadre de découpe (`overflow: hidden`) dont la limite basse est la barre horizontale située sous lui — il sort de sous cette barre vers le haut — et disparaît en redescendant sous la même barre ; les lignes voisines, le groupe et la feuille glissent vers leur nouvelle place pendant ce même temps, sans saut ni fondu (même durée, même courbe) ; durée unique de 350 ms, sur le fil UI, sans animation exécutée sur le fil JavaScript (Q40, Q41 ; *historique Q40 : « entre par le bas en fondu simultané et sort vers le bas en fondu simultané »*)
**And** un simple changement de sélection ne joue aucune transition de place ; les panneaux sans flèche apparaissent et disparaissent sans fondu ni mouvement (Q41)
**And** le comportement D-4 du sélecteur est conservé, cadre porté à 350 ms (valeur choisie visible 350 ms, puis repli ; Q40)
**And** avec « Réduire les animations », le changement est immédiat, sans animation
**And** la montée de la Feuille, les fondus des `Modal`, le popover natif du Mode, les roulettes, le `SegmentedControl` et le glisser des lignes du tableau sont inchangés — source : Q39 (décision de Hermann du 2026-10-17, écart E-13), Q41 (écart E-15).

**Preuves attendues :**
- Tests `PRE4-Q39` (AC9) : conteneurs porteurs des animations de mise en page `entering` / `exiting` / `layout` ; aucune avec « Réduire les animations » ; `onClosed` du sélecteur toujours appelé. La fluidité elle-même se juge sur l'iPhone (NFR-04).
- Tests `PRE4-Q40` (AC9, 3.3 AC7, 3.6 AC1) : durées 350 ms ; entrée et sortie par le bas ; ligne sélectionnée sans contour ; groupe « Séries variables » sélectionné à l'ouverture du tableau et après une action dedans, à l'état normal après sélection d'un champ hors tableau. Vitesse, sens et simultanéité se jugent sur l'iPhone (NFR-04).
- Tests `PRE4-Q41` (AC9, AC5, 3.1 AC4 et AC6, 3.3 AC4, AC5 et AC7, 3.4 AC1, 3.7 AC4), dans `ExecutionParametersSheet.test.tsx` et `AnchoredPanel.test.tsx` : aucune opacité animée ; révélation par le bas (cadre `overflow: hidden` de 0 à sa hauteur, contenu qui monte de sa hauteur) ; cadre de sélection englobant ; styles de ligne identiques sélectionnée ou non ; panneaux Côté, Ordre et roues sous le champ, alignés à droite, sans flèche, sans `Popover` ni `Modal` supplémentaire ; choix et ✓ appliquent, ✕ et toucher extérieur ferment sans appliquer. L'absence de fondu, la position et le toucher se jugent sur l'iPhone (NFR-04).
- Tests : libellés, rôles, états et actions d'accessibilité de chaque contrôle ; inertie hors surface ouverte ; couverture de la table FR-03-13 ; garde-fous zéro `ScrollView` (`DurationWheelPicker.test.tsx:378`, `:619`, `NumberWheelPicker.test.tsx:267`) inchangés.
- Contrôles : `npm test`, `npx tsc --noEmit`, `npm run lint` verts.
- Recette iPhone (dev client « Routine Dev », Q22, après `R-3.1-00`) :
  - `R-3.8-01` — VoiceOver, création. Gestes : parcourir toute la Feuille, ouvrir chaque popover et chaque roulette. Attendu : AC1 à AC3 (FR-22-08).
  - `R-3.8-02` — Sélecteur ouvert. Gestes : tenter `Terminer`, une croix, ✓ de la Feuille. Attendu : rien ne se déclenche (FR-22-11).
  - `R-3.8-03` — Texte à ≈ 200 %, largeur 360. Gestes : parcourir la Feuille en `variables` à douze Séries. Attendu : AC7 (FR-22-05, FR-22-06).
  - La liste consolidée d'AC8.
- Rappel NFR-04 : la recette de Hermann est la seule preuve visuelle et tactile.

**Hors story :** l'accessibilité de l'écran principal de l'Éditeur et des référentiels (4.6) ; la recette finale de l'Éditeur (4.6) ; toute correction visuelle découverte en recette, traitée par une story de correction après arbitrage de Hermann.

---

#### Couverture E3

| FR | Story / AC |
|---|---|
| FR-03-01 | 3.3 AC1 ; 3.8 AC1 |
| FR-03-02 | 3.3 AC1, AC2 ; 3.7 AC2 |
| FR-03-03 | 3.3 AC10, AC6 ; 3.2 AC11 |
| FR-03-04 | 3.2 AC2 ; 3.3 AC9 |
| FR-03-05 | 3.3 AC8 ; 3.6 AC2, AC9 |
| FR-03-06 | 3.3 AC3 |
| FR-03-07 | 3.3 AC4 |
| FR-03-08 | 3.3 AC5 |
| FR-03-09 | 3.3 AC6 |
| FR-03-10 | 3.1 AC2, AC3 ; 3.3 AC7 |
| FR-03-11 | 3.1 AC4, AC7 ; 3.4 AC1 ; 3.7 AC4 |
| FR-03-12 | 3.6 AC4, AC8 |
| FR-03-13 | 3.8 AC6 |
| FR-04-01 | 3.3 AC2, AC6 ; 3.2 AC6 |
| FR-04-02 | 3.3 AC6 ; 3.6 AC7 |
| FR-04-03 | 3.2 AC5 |
| FR-04-04 | 3.2 AC5 |
| FR-04-05 | 3.2 AC6 |
| FR-05-01 | 3.3 AC3 |
| FR-05-02 | 3.2 AC2 ; 3.3 AC3 |
| FR-05-03 | 3.2 AC3, AC13 |
| FR-05-04 | 3.3 AC2 |
| FR-06-01 | 3.2 AC1 |
| FR-06-02 (interface) | 3.4 AC10 ; 3.6 AC7 ; 3.7 AC2 |
| FR-06-03 | 3.2 AC1 |
| FR-06-04 | 3.2 AC13 |
| FR-06-05 | 3.4 AC10 ; 3.6 AC1 |
| FR-07-01 | 3.4 AC1 ; 3.5 AC1 ; 3.6 AC3 |
| FR-07-02 | 3.4 AC2 |
| FR-07-03 | 3.5 AC2, AC3 |
| FR-07-04 | 3.4 AC3, AC4 ; 3.5 AC4 |
| FR-07-05 | 3.4 AC8 ; 3.5 AC6 ; 3.7 AC4 |
| FR-07-06 | 3.4 AC6 |
| FR-07-07 | 3.7 AC4 |
| FR-07-08 | 3.4 AC11 ; 3.5 AC7 |
| FR-08-01 | 3.4 AC5 |
| FR-08-02 | 3.4 AC6 |
| FR-08-03 | 3.5 AC3 |
| FR-08-04 | 3.4 AC7 |
| FR-08-05 | 3.4 AC9 |
| FR-08-06 | 3.4 AC10 |
| FR-09-04 (interface) | 3.3 AC8 ; 3.6 AC4, AC6 |
| FR-09-06 (interface) | 3.2 AC11 ; 3.6 AC12 |
| FR-10-01 | 3.6 AC1 |
| FR-10-02 | 3.6 AC2, AC13 |
| FR-10-03 | 3.6 AC3 |
| FR-10-04 | 3.6 AC4, AC9 |
| FR-10-05 | 3.3 AC8 ; 3.6 AC2 |
| FR-10-06 | 3.6 AC7 |
| FR-10-07 | 3.6 AC8 |
| FR-10-08 | 3.6 AC11 |
| FR-11-01 | 3.2 AC11 |
| FR-11-02 | 3.2 AC5, AC11 |
| FR-11-03 | 3.2 AC3 |
| FR-11-04 | 3.2 AC4 |
| FR-11-05 | 3.2 AC2 ; 3.3 AC9 |
| FR-11-06 | 3.2 AC14 |
| FR-12-01 | 3.2 AC7 |
| FR-12-02 | 3.2 AC7 ; 3.6 AC2 (− de N, champ de N ouvert) |
| FR-12-03 | 3.2 AC8 ; 3.6 AC8 |
| FR-12-04 | 3.2 AC9 ; 3.3 AC5, AC6 |
| FR-12-05 | 3.2 AC10 ; 3.6 AC9 |
| FR-12-06 | 3.6 AC10 (et recette `R-3.6-06`) |
| FR-12-07 | 3.2 AC14 |
| FR-14-01 | 3.7 AC1, AC2 |
| FR-14-04 | 3.7 AC6 |
| FR-14-05 | 3.7 AC7 |
| FR-22-08 (Feuille) | 3.8 AC1 à AC4 |
| FR-22-11 (Feuille) | 3.8 AC5 |

Vérifiés à l'interface sans être attribués à E3 : FR-14-02 et FR-14-03 (3.7 AC3 à AC6, domaine en 2.1) ; FR-09-01, FR-09-02, FR-09-03, FR-09-05 (3.3 AC8, 3.4 AC4 et AC10, 3.5 AC4 et AC5, 3.6 AC5, domaine en 1.1) ; FR-22-05, FR-22-06 sur la Feuille (3.8 AC7, attribution E4).

<!-- FIN EPIC 3 -->

---

## Epic 4 : Un Éditeur d'Exercice fini, fidèle et accessible

**Objectif.** Les quatre Parcours d'édition (créer au Catalogue, modifier au Catalogue, créer dans une Séance, modifier une Copie en Séance) passent par le même Éditeur d'Exercice et la même Feuille Paramètres d'exécution. L'écran principal suit ses références visuelles bloc par bloc, à partir d'un relevé consigné avant le développement (FR-02-13). Catégorie et Zones corporelles se gèrent depuis l'Éditeur sans perdre le Brouillon ni le clavier. Les Médias sont ajoutés, ordonnés et relus sans perte, et se consultent dans l'Éditeur par le lecteur natif : vidéo lue à la demande en plein écran, photo en plein écran (Q27). L'ensemble est accessible : VoiceOver, texte agrandi, largeurs 360, 402 et 440, alternatives aux gestes, cibles d'au moins 44 × 44 pt. La recette sur iPhone par Hermann, sur la liste de scénarios produite en 4.6, clôt l'epic (Q5).

**FR couvertes :** FR-01-01 à FR-01-10 ; FR-02-01 à FR-02-13 ; FR-20-01 à FR-20-11 ; FR-21-01 à FR-21-05 ; FR-22-01 à FR-22-07, FR-22-09, FR-22-10, FR-22-12.
**Architecture :** AD-7, AD-9, AD-11, AD-17 (et AD-13, AD-15 en lecture). S'appuie sur E1 à E3.

*Révision après la revue ChatGPT du 2026-10-16 (R3, Q27) : story 4.5 « Consulter un Média dans l'Éditeur (lecteur natif) » ajoutée ; l'ancienne story 4.5 devient 4.6, et ses scénarios `R-4.5-xx` deviennent `R-4.6-xx`.*

*Révision après la porte post-revue du 2026-10-16 (M2, M3, Q31) : toucher la tuile consulte le Média, le menu Retirer / Monter / Descendre passe à l'appui long (menu contextuel natif, D-335 amendée), actions VoiceOver conservées (4.4 AC3, 4.5 AC2, AC3, AC7 à AC9, `R-4.5-05`, R-41, R-51, R-52) ; ce changement de geste du menu natif des Médias est prescrit par Q31 (NFR-03). H22 précisée : invite de la seule Carte vide, avant tout Mode (4.2 AC6).*

*Révision du 2026-10-17 (recette iPhone) : Q35 (Cible à renseigner signalée par un fond `#FFF1F0`, sans liseré ni contour, reporté dans le texte des états sans frame de 4.6 et des scénarios R-18 et R-25) ; Q36 (Cible Durée à la seconde, bornes 5..3535 inchangées, plus de multiple de 5) : scénarios R-20, R-24, R-25 et R-36 corrigés.*

**Conventions de l'epic.**
- Parcours : **CC** = créer au Catalogue ; **MC** = modifier au Catalogue ; **CS** = créer dans une Séance ; **MS** = modifier une Copie en Séance.
- Littéraux : les textes d'interface sont écrits avec l'apostrophe typographique `’` (U+2019), comme dans le lexique et le Corpus 276 (NFR-08).
- **Rappel commun à toutes les stories d'interface de l'epic** (cité « Rappels E4 » dans chaque story) :
  - **NFR-02** : quand une primitive native iOS existe pour l'interaction, elle est utilisée ; une difficulté de rendu se corrige autour d'elle, sans remplacer son mécanisme.
  - **NFR-03** : aucun mécanisme de primitive déjà acceptée n'est remplacé (roulettes natives et leurs garde-fous zéro `ScrollView` iOS, glisser des lignes, menus natifs des Médias) ; un contrôle PRE-3 n'est changé que si une ED ou une décision Q le prescrit.
  - **NFR-04** : une suite de tests verte ne prouve ni le rendu ni le comportement tactile ; tests, comparaisons de captures et perception sur appareil sont consignés séparément ; la validation visuelle et tactile appartient à Hermann.
  - **NFR-09** : cibles d'au moins 44 × 44 pt, libellés VoiceOver, état non porté par la seule couleur, texte agrandi, largeurs 360, 402 et 440.
  - **NFR-14** : ordre de lecture des sources : ch. 07 → ch. 04, 09, 10 → ch. 11 → ch. 12 → ch. 06 → ch. 13 → Figma en dernier, pour le visuel seulement ; Q et P priment sur les sources qu'elles tranchent.
- **Méthode de relevé visuel** (utilisée par 4.2, 4.3 et 4.4). Avant toute modification de code, la story consigne dans un tableau, ajouté à sa section « Notes de développement », une ligne par élément visible et par état. Colonnes : frame et état ; élément (nom de nœud Figma et identifiant) ; composant maître et variante ; style ou variable Figma lié ; police (famille, style, taille, graisse, interligne) ; couleurs (texte, fond, icône) ; contour (couleur, épaisseur, rayon) ; ombre et effets ; espacements relatifs au bloc voisin ; jeton existant de `src/shared/ui/tokens.ts` retenu ; écart. Sources : les arbres des frames `docs/preparation/PRE-4/figma/<frame>.json.gz` (propriétés `fontName`, `fontSize`, `fontWeight`, `lineHeight`, `fills`, `strokes`, `strokeWeight`, `cornerRadius`, `effects`, marges d'auto-layout) et `docs/preparation/PRE-4/bmad/sources-caa2a5cf/docs/preparation/PRE-4/figma/fermeture-maitres-et-variables.json.gz` (maîtres, `styles`, `variables`). Les nœuds masqués (`visible: false`) sont relevés comme masqués et ne sont pas rendus. La barre d'état dessinée est un décor système. Aucune coordonnée absolue n'est reprise. Un chiffre relevé n'est jamais une règle de comportement (NFR-01, D-255, D-300). Une valeur Figma différente d'un jeton est inscrite comme écart et signalée à Hermann ; elle n'est jamais corrigée en modifiant le jeton (verrouillé par `tokensSpecification.test.ts`) ni en codant la valeur en dur (AD-11). Une mention « conforme Figma » ne remplace pas ce tableau (FR-22-01).

---

### Story 4.1 : Quatre Parcours d'édition, Terminer et retour

En tant que Hermann (utilisateur de KODJO),
je veux ouvrir le même Éditeur d'Exercice depuis le Catalogue et depuis une Séance, en création comme en modification, et que `Terminer` agisse selon l'endroit d'où je viens,
afin que je retrouve toujours le même écran et que mes Définitions d'Exercice et mes Copies en Séance restent indépendantes.

**Exigences :** FR-01-01, FR-01-02, FR-01-03, FR-01-04, FR-01-05, FR-01-06, FR-01-07, FR-01-08, FR-01-09, FR-01-10 ; NFR-02, NFR-03, NFR-04, NFR-05, NFR-07, NFR-13, NFR-14 ; P8, P15, Q4, D-194 (écart signalé).
**Architecture :** AD-9 (clonage profond à l'ouverture, à la copie et à la réouverture), AD-13 (`validateForSave` appelé par `Terminer`), paradigme en couches. Fichiers principalement touchés (indicatif) : `src/features/sessions/ExerciseScreen.tsx`, `src/features/activities/ActivityEditorForm.tsx`, `src/features/sessions/CompositionScreen.tsx` (lecture et tests seulement, aucun changement d'enchaînement), `src/features/sessions/CatalogueScreen.tsx`, `src/domain/sessions/composition.ts`, tests d'intégration `*.integration.test.tsx`.
**Références visuelles :** `8328:35698` (Ajouter un exercice — Initial). Aucune frame « Modifier un exercice » parmi les 32 (`S/06…:1335`).
**Dépend de :** 1.3, 3.3.
**Critères d'acceptation :**

**AC1 — Créer au Catalogue (FR-01-01, Q33).**
**Given** le Catalogue ouvert sur le segment Exercices, avec un filtre et une position de défilement
**When** Hermann touche `Créer`
**Then** l'Éditeur d'Exercice s'ouvre directement en création, sans écran ni arbre intermédiaire, sans voile, sans liste d'options et sans `Annuler` intermédiaire
**And** sur les autres segments du Catalogue, `Créer` garde son comportement de départ : la liste d'options existante (`CatalogueCreateOptions`) est conservée sans modification (Q33)
**And** deux appuis rapprochés sur `Créer` n'ouvrent qu'un seul Éditeur
**And** aucune donnée n'est écrite : seul un Brouillon de l'Éditeur est initialisé
**And** au retour avant validation, le segment, les filtres et la position de défilement du Catalogue sont restitués ; après un `Terminer` réussi, l'écran affiché est Catalogues / Exercices.

**AC2 — Abandon d'une création au Catalogue (FR-01-01).**
**Given** l'Éditeur ouvert par `Créer`
**When** Hermann le quitte (sortie immédiate s'il n'a rien saisi, ou `Confirmer` dans le dialogue d'abandon de FR-02-12)
**Then** le Catalogue appelant est restauré et aucun Exercice n'est créé.

**AC3 — Modifier au Catalogue (FR-01-02).**
**Given** une Définition d'Exercice au Catalogue, avec nom, Catégorie, Zones, Paramètres d'exécution typés, description et deux Médias
**When** Hermann touche sa carte hors du bouton Lecture
**Then** l'Éditeur s'ouvre en modification et affiche ces données, Médias dans leur ordre
**And** le bouton Lecture reste désactivé, comme dans le code de départ ; son appui n'ouvre pas l'Éditeur. L'Exécution directe relève du moteur d'Exécution, hors périmètre (Q34).

**AC4 — Modifier une Copie en Séance (FR-01-03).**
**Given** Composition d'une Séance contenant une Copie en Séance
**When** Hermann fait un appui court sur la carte Exercice
**Then** l'Éditeur s'ouvre directement sur la Copie en Séance
**And** un appui long déclenche la réorganisation et n'ouvre pas l'Éditeur.

**AC5 — Créer dans une Séance, parcours PRE-3 conservé (FR-01-03, P8, Q4).**
**Given** Composition d'une Séance
**When** Hermann touche `Ajouter un exercice`
**Then** le choix `Un nouvel exercice` / `Un exercice existant` / `Annuler` s'affiche, inchangé
**And** `Un nouvel exercice` ouvre l'Éditeur en création, sans Exercice source ; `Terminer` place le nouvel Exercice dans le Brouillon de Composition, à la suite des Exercices affichés, sans l'ajouter au Catalogue
**And** `Un exercice existant` ouvre la sélection multiple du Catalogue
**And** aucun point d'entrée n'est ajouté ni retiré. L'écart avec D-194 (`S/07…:241`, `S/08…:202`, `S/06…:274,822`, qui disent cette création non exposée) reste signalé à Hermann ; la story ne le tranche pas.

**AC6 — Un seul Éditeur et une seule Feuille (FR-01-03, P8).**
**Given** chacun des parcours CC, MC, CS et MS
**When** l'Éditeur puis la Feuille sont ouverts
**Then** le même composant d'Éditeur (`ActivityEditorForm`) et la même Feuille (`ExecutionParametersSheet`) sont rendus ; un test d'intégration par parcours le vérifie.

**AC7 — Contexte d'ouverture explicite (FR-01-04).**
**Given** un même contenu affiché
**When** l'Éditeur est ouvert depuis le Catalogue, puis depuis Composition
**Then** il agit respectivement sur la Définition d'Exercice et sur la Copie en Séance ; le contexte est porté par le point d'entrée (paramètres de route), jamais déduit de l'apparence ni des données.

**AC8 — Terminer selon le contexte (FR-01-05, P8).**
**Given** un Brouillon de l'Éditeur valide
**When** Hermann touche `Terminer`
**Then** ouvert depuis le Catalogue (CC, MC), la Définition d'Exercice est créée ou mise à jour, puis le Catalogue restauré s'affiche (AC1)
**And** ouvert depuis Composition (CS, MS), seul le Brouillon de Composition est modifié, puis Composition s'affiche ; aucune écriture en base n'a lieu avant le `Continuer` de Composition
**And** aucune Exécution historisée n'est modifiée.

**AC9 — Copie isolée (FR-01-06, renvoi FR-19-01).**
**Given** une Définition d'Exercice et sa Copie en Séance
**When** Hermann modifie la Copie (MS), `Terminer`, puis `Continuer`
**Then** la Définition est inchangée ; inversement, modifier la Définition (MC) ne change pas la Copie
**And** une Copie en Séance n'apparaît jamais comme doublon dans le Catalogue ; un Exercice créé dans une Séance (CS) n'est pas ajouté au Catalogue
**And** l'isolation repose sur le clonage profond d'AD-9 livré en 1.3 : la story l'exerce par un test d'intégration d'interface, sans nouveau mécanisme.

**AC10 — Relecture à l'identique (FR-01-07).**
**Given** dans chacun des parcours CC, MC, CS et MS, un Exercice en Régime variables à Cibles mixtes (Durée 30 s, 45 s, à l'échec ; Pauses 10, 20, 30 s), bilatéral, Bip 2 s, Compte à rebours 10 s, Fin 5 s, avec description, Catégorie, deux Zones et deux Médias
**When** Hermann bascule de Mode puis revient, déplace une Série, passe à N = 1 puis remonte à 3, valide par ✓, `Terminer` (puis `Continuer` en Séance), ferme et rouvre
**Then** nom, Catégorie, Zones, description, Médias dans leur ordre et Paramètres d'exécution typés (Mode, Régime, Cibles numériques et à l'échec, Pauses, côtés, Bip, Compte à rebours, Fin) sont relus à l'identique
**And** la Définition et la Copie restent indépendantes.

**AC11 — Aucune Récupération automatique (FR-01-08, P15).**
**Given** un Exercice créé (CC, CS) ou une Copie insérée dans Composition
**When** il est enregistré
**Then** aucune Récupération n'est créée
**And** l'Éditeur et la Feuille ne contiennent aucun réglage de Récupération ; la Pause au changement de côté n'est visible qu'en bilatéral.

**AC12 — Compatibilité avec un N hérité (FR-01-09, renvoi FR-12-07).**
**Given** des Paramètres d'exécution dont N est marqué hérité, par l'indicateur introduit en 2.1 (AC6) et repris en 3.2 (AC14), non persisté (P42)
**When** ils sont validés et relus par le modèle
**Then** ils sont acceptés et relus sans erreur, N inchangé (test du modèle, sans parcours d'interface)
**And** aucun libellé « Circuit » ni « Tour » n'apparaît dans l'Éditeur ni dans la Feuille ; un test vérifie l'absence de ces mots dans le rendu des deux surfaces.

**AC13 — Source supprimée pendant l'édition (FR-01-10).**
**Given** l'Éditeur ouvert sur une Définition d'Exercice (ou une Copie) supprimée entre-temps
**When** Hermann touche `Terminer`
**Then** une erreur est signalée, rien n'est recréé implicitement, et aucun contenu de démonstration ne remplace les données manquantes
**And** le Brouillon de l'Éditeur est conservé ; le texte affiché est celui du code de départ pour l'échec d'enregistrement (P34, FR-02-10) ; aucun texte nouveau n'est inventé.

**Preuves attendues :**
- Tests d'intégration (`*.integration.test.tsx`) : un par parcours (AC6, AC8), double appui sur `Créer` (AC1), restauration du Catalogue (AC1, AC2), appui court et appui long dans Composition (AC4), choix `Un nouvel exercice` (AC5), isolation dans les deux sens (AC9), relecture typée après bascules (AC10), absence de Récupération (AC11), source supprimée (AC13). Test du modèle pour AC12.
- `npm test`, `npx tsc --noEmit` et `npm run lint` verts (NFR-11).
- Scénarios de recette iPhone : `R-4.1-01` (CC complet et retour au Catalogue restauré), `R-4.1-02` (MC et bouton Lecture), `R-4.1-03` (MS, appui court et appui long, isolation), `R-4.1-04` (CS par `Un nouvel exercice`, aucune Récupération), `R-4.1-05` (relecture à l'identique après bascules, dans les quatre parcours). Rattachés en 4.6 à `R-01` à `R-06`.
- Rappel NFR-04 : les tests ne valent pas recette ; Hermann valide sur iPhone.
**Rappels E4 :** NFR-02, NFR-03, NFR-04, NFR-09, NFR-14.
**Hors story :** tout nouveau parcours de création ou de duplication (Q4, P36) ; l'arbitrage de l'écart D-194 ; la production d'un N hérité et le comportement de l'Éditeur sous N hérité (FR-12-07) ; le libellé « Un circuit » de `CatalogueCreateOptions.tsx` ; le rendu visuel de l'écran (4.2).

---

### Story 4.2 : Écran principal conforme aux références

En tant que Hermann (utilisateur de KODJO),
je veux un écran principal de l'Éditeur dont chaque bloc a l'ordre, les textes, la typographie, les couleurs, les contours et les ombres de ses références,
afin que l'Éditeur soit fini et fidèle, et que je puisse le valider bloc par bloc sur mon iPhone.

**Exigences :** FR-02-01, FR-02-02, FR-02-03, FR-02-04, FR-02-06, FR-02-07, FR-02-08, FR-02-09, FR-02-10, FR-02-11, FR-02-12, FR-02-13 (relevé de tous les blocs, accès Catégorie et Zones compris ; leur comportement est en 4.3) ; FR-22-06 (largeurs de l'écran principal, AC5 ; contrôle complet en 4.6) ; NFR-01, NFR-02, NFR-03, NFR-04, NFR-07, NFR-08, NFR-09, NFR-14 ; Q9 (non bloquant), Q11, Q18, Q23, H22, H25, P7, P17, P18, P34.
**Architecture :** AD-11 (lexique, jetons intouchés), AD-13 (`validateForSave` pour l'état de `Terminer`). Fichiers principalement touchés (indicatif) : `src/features/activities/ActivityEditorForm.tsx`, `src/features/sessions/ExerciseScreen.tsx`, `src/features/sessions/ExerciseExitConfirmModal.tsx`, `src/shared/i18n/index.ts` et `src/shared/i18n/resources/fr.ts` (clés nouvelles), tests associés.
**Références visuelles :** `8328:35698`, `8328:35740`, `8328:36278`, `8328:36711`, `8328:36853`, `8328:37022`, `8328:36781`.
**Dépend de :** 4.1, 2.3.
**Hypothèses non validées :** H22, H25 — à confirmer par la revue ChatGPT/Hermann avant développement.
**Critères d'acceptation :**

**AC1 — Relevé des propriétés visuelles, avant tout développement (FR-02-13, FR-22-01).**
**Given** les arbres des sept frames de référence et `fermeture-maitres-et-variables.json.gz`
**When** la story démarre, avant toute modification de `src/`
**Then** le tableau de relevé de la « Méthode de relevé visuel » est consigné dans la story, avec une ligne par élément et par état pour : l'en-tête fixe (✕ circulaire « Action / Fermer », halo blanc, titre) ; la zone de contexte (« Zone bleue », dégradé) ; le champ Nom (placeholder et valeur) ; les accès Catégorie et Zones (non renseignés, renseignés, ouverts) ; l'en-tête et le champ Description (repos, saisie avec ↑) ; la Carte Paramètres d'exécution (libellé de section, Carte vide avec invite, Phrase affichée, lignes Compte à rebours et Fin) ; le bloc Médias (titre de section et emprise de la galerie ; le détail des tuiles relève de 4.4) ; `Terminer` (actif, inactif) ; le dialogue d'abandon (titre, message, `Annuler`, `Confirmer`)
**And** chaque ligne indique le jeton existant retenu, ou l'écart constaté ; les écarts sont listés à part et signalés à Hermann, sans modification de `tokens.ts`
**And** les éléments sans référence visuelle sont inscrits `NON VÉRIFIABLE` : lignes Compte à rebours et Fin (P17, absentes de `8328:37022`), dialogue d'abandon en modification, erreur d'enregistrement
**And** les textes des captures qui ne sont pas repris sont inscrits comme tels : « Modalités d’exécution » (Q11), titres de frames « Ajouter un exercice… » (D-325), liste d'étapes « 1. Décrivez la première étape » / « Étape suivante » (P18), message « l’activité ne sera pas créé » (Q18), données de démonstration (« Squats sautés », « Renforcement », « Cuisses . Fessier »).

**AC2 — Titre selon l'action (FR-02-01, Q9).**
**Given** chacun des quatre parcours
**When** l'Éditeur s'ouvre
**Then** le titre est `Créer un exercice` en création (CC, CS) et `Modifier un exercice` en modification (MC, MS) ; aucun nom de frame n'est affiché
**And** le rendu du titre suit le relevé d'AC1 ; sa validation visuelle revient à Hermann (Q9 non bloquant).

**AC3 — Ordre des blocs (FR-02-02, P7).**
**Given** l'Éditeur ouvert dans n'importe quel parcours
**When** l'écran est rendu
**Then** l'ordre vertical est : en-tête fixe → bandeau (champ Nom, puis accès Catégorie et Zones corporelles) → Description → Carte Paramètres d'exécution → Médias → `Terminer`. La Description précède la Carte (P7) ; le code de départ, qui place la Carte avant la Description, est réordonné
**And** le champ Nom est le premier élément du bandeau ; aucun contexte « Séance · {nom} » ni aucun contrôle de type d'Exercice n'est affiché
**And** le placeholder du nom est `Nom de l’exercice` ; aucune valeur de démonstration n'est codée en dur.

**AC4 — En-tête et zone de contexte (FR-02-03).**
**Given** l'Éditeur ouvert
**When** l'en-tête est rendu
**Then** la fermeture est un ✕ circulaire en haut à gauche, de cible tactile 48 × 48, cercle visible 38 × 38, icône 24, avec le halo blanc de 59,28
**And** aucun liseré n'apparaît sous l'en-tête ni autour du champ Nom ; la zone de contexte porte le dégradé `#EAEAFF` → transparent sur ses 20 % inférieurs (le séparateur de 1 px du code de départ suit le relevé d'AC1 de `8328:35698` : retiré s'il n'y figure pas, conservé et inscrit comme écart signalé à Hermann s'il y figure ; aucun jugement du développeur)
**And** 18 séparent le bas géométrique du dégradé de la première ligne de texte ; le nom est posé à la même hauteur que dans `8328:35698`.

**AC5 — Grille verticale et largeurs (FR-02-04, FR-22-06).**
**Given** l'Éditeur rendu aux largeurs 360, 402 et 440 (NFR-09), plus 390, seuil de la marge latérale de FR-02-04
**When** les tests vérifient les styles appliqués, Jest n'ayant pas de moteur de mise en page : valeurs de marge et d'espacement des `StyleSheet` des blocs, et marge latérale calculée pour chaque largeur fournie par une largeur de fenêtre simulée ; la géométrie effective est contrôlée à la recette (`R-4.2-06`), à la largeur de l'iPhone de Hermann
**Then** 20 séparent le dernier élément d'un bloc du titre suivant, 13 un titre de section de son bloc, 12 deux blocs ; les espaces internes des composants ne relèvent pas de cette grille
**And** la marge latérale vaut 24 à partir de 390 et 16 en dessous ; aucune coordonnée Figma n'est reprise en position absolue.

**AC6 — Carte Paramètres d'exécution (FR-02-06, Q11, H22, P17).**
**Given** un nouvel Exercice sans Mode
**When** l'Éditeur est rendu
**Then** le libellé de section au-dessus de la Carte est `Paramètres d’exécution` ; « Modalités d’exécution » n'apparaît nulle part
**And** la Carte vide est une zone unique qui ouvre la Feuille ; elle est rendue comme en PRE-3, sans invite (Q55, décision de Hermann du 2026-10-18, qui retire l'invite H22 « Appuyez pour définir les séries et les durées ») ; dès qu'un Mode est validé par le ✓ de la Feuille, la Phrase s'affiche
**And**, après le ✓ de la Feuille avec un Mode renseigné, la Carte affiche **une seule** Phrase des paramètres (générée par le générateur unique d'AD-6), valeurs et unités en gras, Inter 13, interligne 20, hauteur intrinsèque, sans plafond ni troncature ; le contenu situé dessous suit
**And** la Phrase passe à la ligne avant « Durée totale » sans changer sa grammaire, sans virgule isolée en début de ligne ; aucun mot ni nombre de la Phrase n'est un contrôle autonome ; ce retour de ligne est un traitement de rendu de la Carte (l'espace qui sépare « Durée totale » de la fin de phrase précédente est remplacée par un saut de ligne à l'affichage seulement), les segments produits par le générateur (2.3) restant inchangés
**And** les lignes `Compte à rebours` et `Fin d’exercice` restent dans la Carte, séparées de la Phrase (P17)
**And** la Carte entière ouvre la Feuille et a un seul focus d'accessibilité (possible une fois le bouton de Mode retiré, AC14) ; son libellé accessible garde la composition du code de départ (`ActivityEditorForm.tsx:310`, NFR-03) : `Modifier les paramètres d’exécution`, puis la Phrase entière en texte brut, puis `Compte à rebours {n} s, Fin d’exercice {n} s.` ; pour la Carte vide, la même composition, l'invite H22 prenant la place de la Phrase
**And** la phrase longue de référence (224 caractères, `7119:27855`) tient sans troncature à la largeur 324 ; la hauteur constatée n'est jamais fixée dans le code.

**AC7 — Description (FR-02-07, P18).**
**Given** le champ `Description de l’exercice`
**When** Hermann y saisit du texte
**Then** le champ est facultatif, multiligne, limité à 1000 caractères ; la touche Retour fait un retour à la ligne ; aucune structure en étapes numérotées n'est reproduite
**And** pendant la saisie, le bouton ↑ dans le champ ferme le clavier ; le texte est déjà dans le Brouillon de l'Éditeur ; ↑ n'enregistre pas l'Exercice
**And** clavier ouvert, la Description se place juste au-dessus du clavier, curseur visible
**And** le placeholder reste celui du code de départ, aucune source ne fixant ce texte (P18, P34).

**AC8 — Terminer et clavier (FR-02-08).**
**Given** l'Éditeur à la largeur 402
**When** l'écran est rendu
**Then** `Terminer` est un bouton principal sur toute la largeur utile (354 × 48 à 402), hauteur 48, rayon 24, libellé centré, sans position absolue
**And** clavier ouvert, `Terminer` reste en bas, sous le clavier, et ne remonte pas ; il redevient accessible à la fermeture du clavier ; le corps reste défilable.

**AC9 — Validation avant Terminer (FR-02-09, H25).**
**Given** un Brouillon de l'Éditeur
**When** l'une de ces conditions manque : nom de 1 à 80 caractères ; exactement une Catégorie ; au moins une Zone (nouvel Exercice) ; Paramètres d'exécution exécutables validés par la Feuille
**Then** `Terminer` est inactif, et l'est aussi pour l'accessibilité (`accessibilityState.disabled`)
**And** l'état de `Terminer` ne dépend jamais de la couleur des captures (`8328:35698` actif à vide, `8328:35740` pâle rempli)
**And** en modification, une Catégorie ou une Zone retirée de son référentiel reste affectée et enregistrable
**And** un Exercice ancien portant une valeur hors bornes non modifiée (Cible 5999 s, 150 répétitions, Bip 11) reste enregistrable, la valeur réenregistrée telle quelle ; une Cible absente, à renseigner, laisse `Terminer` inactif (H25, `validateForSave` d'AD-13).

**AC10 — Enregistrement atomique et erreur d'écriture (FR-02-10, P34).**
**Given** un Brouillon valide
**When** Hermann touche `Terminer`
**Then** nom, référentiels, description, Paramètres d'exécution validés et associations Médias ordonnées sont enregistrés ensemble ou pas du tout (en Séance : dans le Brouillon de Composition)
**And** en cas d'échec d'écriture (injection d'échec en test), le Brouillon est conservé, Hermann reste dans l'Éditeur et peut réessayer ; aucun enregistrement partiel ni doublon ; le message est celui du code de départ, inchangé (`L’exercice n’a pas pu être enregistré. Réessayez.`)
**And** des appuis répétés sur `Terminer` ne lancent qu'une opération d'enregistrement à la fois.

**AC11 — États à couvrir (FR-02-11).**
**Given** la liste d'états de FR-02-11
**When** la story est close
**Then** chaque état a au moins un test de rendu et un scénario de recette : vide ; nom seul ; Catégorie renseignée ; nom, description et Média renseignés ; modification d'un Exercice existant ; résumé identiques ; résumé variables en Durée, en Répétitions, à l'échec et Cible mixte ; bilatéral dans chaque Ordre des côtés ; abandon confirmé et annulé ; erreur d'enregistrement. L'absence de capture ne retire aucun état.

**AC12 — Abandon avec confirmation (FR-02-12, Q18).**
**Given** l'Éditeur ouvert
**When** Hermann ferme ou revient sans modification à perdre
**Then** la sortie est immédiate, sans dialogue
**When** il a des modifications non enregistrées
**Then** un dialogue de décision centré s'affiche, avec deux actions sur une ligne : `Annuler` (neutre) et `Confirmer` (destructif, rouge)
**And** en création (CC, CS), titre `Abandonner la création ?` et message `Les informations saisies seront perdues et l’exercice ne sera pas créé.`, portés par des clés nouvelles du lexique
**And** en modification (MC, MS), titre `Abandonner les modifications ?` et message `Les modifications apportées à cet exercice seront perdues.`, inchangés
**And** `Annuler` ferme le dialogue et conserve le formulaire et le Brouillon ; `Confirmer` quitte sans enregistrer.

**AC13 — Rendu conforme au relevé (FR-02-13, AD-11).**
**Given** le tableau d'AC1
**When** les blocs sont rendus, dans chacun de leurs états
**Then** typographie, couleurs, contour et ombre suivent le relevé, par les jetons existants
**And** aucun jeton n'est modifié et aucune valeur n'est codée en dur ; chaque écart reste listé et signalé à Hermann
**And** l'opacité d'un élément atténué éventuel passe par `UNSELECTED_OPACITY` (AD-11), jamais par une constante locale.

**AC14 — Bouton de Mode retiré à côté du titre de section (Q23, FR-02-06).**
**Given** le code de départ, qui affiche à droite du titre de la Carte un bouton (`exercise-parameters-mode`, texte `Choisir un mode` ou nom du Mode) de même libellé accessible que la Carte
**When** l'Éditeur est rendu, avec ou sans Mode renseigné
**Then** aucun bouton ni nom du Mode n'est affiché à droite du titre `Paramètres d’exécution` ; l'élément d'identifiant de test `exercise-parameters-mode` n'existe plus (Q23)
**And** la Carte est une seule zone touchable qui ouvre la Feuille, avec un seul focus d'accessibilité (AC6)
**And** le Mode reste visible dans la Phrase de la Carte et se choisit dans la Feuille, par son popover (3.3) ; les clés du lexique devenues sans usage sont retirées.

**Preuves attendues :**
- Tableau de relevé d'AC1 dans la story, avant le premier commit de code.
- Tests de rendu : ordre des blocs, textes exacts (titres, invite H22, libellé `Paramètres d’exécution`, textes Q18), focus unique de la Carte, absence du bouton de Mode à côté du titre (Q23), marges à 360, 390, 402 et 440, `Terminer` hors de la zone qui évite le clavier, états de FR-02-11, atomicité et erreur d'écriture (motif `FailingDatabase`), appuis répétés.
- `npm test`, `npx tsc --noEmit` et `npm run lint` verts ; `tokensSpecification.test.ts` inchangé et vert.
- Scénarios de recette iPhone : `R-4.2-01` (écran vide et invite), `R-4.2-02` (nom, description, Média, clavier), `R-4.2-03` (Phrase affichée, lignes Compte à rebours et Fin, phrase longue ; VoiceOver : un seul élément, libellé composé selon AC6, repris de `R-2.3-05`), `R-4.2-04` (validation de `Terminer`), `R-4.2-05` (abandon en création et en modification), `R-4.2-06` (comparaison bloc par bloc au relevé, à 402). Rattachés en 4.6 à `R-07` à `R-12`.
- Rappel NFR-04 : la conformité visuelle de FR-02-13 est validée par Hermann sur iPhone ; un test vert ne la prouve pas.
**Rappels E4 :** NFR-02, NFR-03, NFR-04, NFR-09, NFR-14.
**Hors story :** le comportement des sélections Catégorie et Zones et le rendu de leurs accès (4.3) ; le détail de la galerie Médias (4.4) ; la Feuille (E3) ; la Phrase elle-même (2.3) ; l'arbitrage de Q9 (non bloquant, validé sur appareil).

---

### Story 4.3 : Catégorie et Zones corporelles depuis l'Éditeur

En tant que Hermann (utilisateur de KODJO),
je veux choisir, créer, modifier et supprimer une Catégorie ou une Zone corporelle depuis le bandeau du nom, sans perdre ce que j'ai saisi ni le clavier,
afin de classer mes Exercices sans quitter l'Éditeur.

**Exigences :** FR-02-05, FR-02-13 (relevé des feuilles de référentiel, AC1), FR-22-04 (cibles des accès, AC2 ; contrôle complet en 4.6), FR-20-01, FR-20-02, FR-20-03, FR-20-04, FR-20-05, FR-20-06, FR-20-07, FR-20-08, FR-20-09, FR-20-10, FR-20-11 ; NFR-02, NFR-03, NFR-04, NFR-05, NFR-08, NFR-09, NFR-10, NFR-14 ; P12, P13, P14, P15, P34, P35, D-026, D-093, D-210, D-211, D-257, D-343, D-344, D-350, D-354.
**Architecture :** AD-11 ; capability map : `src/features/reference-data/` garde le comportement PRE-3 (P12 à P14, P34), sauf deux changements limités : l'icône et le libellé des accès non renseignés (FR-02-05, P35, ici) et l'action accessible équivalente à l'appui long (FR-22-09, en 4.6). La story **constate** d'abord par tests le comportement PRE-3 et ne corrige que les écarts aux FR ci-dessus. Fichiers principalement touchés (indicatif) : `src/features/activities/ActivityEditorForm.tsx` (accès du bandeau), `src/features/reference-data/CategoryPickerModal.tsx`, `BodyZonePickerModal.tsx`, `ReferenceValueDialog.tsx`, `src/features/sessions/BodyZoneSelector.tsx`, lexique, tests.
**Références visuelles :** `8328:35698`, `8328:36278`, `8328:37022` (accès du bandeau) ; `8328:35810`, `8328:35932`, `8328:36056`, `8328:36348`, `8328:36441`, `8328:36536` (`8328:35932` et `8328:36441` sont antérieures à D-354).
**Dépend de :** 4.2.
**Critères d'acceptation :**

**AC1 — Relevé visuel des feuilles de référentiel (FR-22-01, FR-02-13 ; méthode de l'epic).**
**Given** les frames `8328:35810`, `8328:35932`, `8328:36056`, `8328:36348`, `8328:36441`, `8328:36536` et les lignes « accès Catégorie / Zones » du relevé de 4.2
**When** la story démarre, avant toute modification de `src/`
**Then** le tableau de relevé est consigné pour : l'en-tête ✕ / titre / ✓ et son séparateur ; les options de Catégorie (pastille et nom) et de Zone (sans couleur, sans silhouette) ; l'action de création et son champ avec ↑ ; la barre de couleurs ; le dialogue de confirmation de suppression
**And** le menu d'appui long D-354 (✕ / `Modifier` / `Supprimer`), sans frame, est inscrit `NON VÉRIFIABLE` sur Figma ; les menus `Annuler` / `Supprimer` des frames `8328:35932` et `8328:36441` ne sont pas repris (P13)
**And** l'écart de nombre de cases de la barre de couleurs de `8328:36056` avec les 12 couleurs de D-026 est inscrit et signalé à Hermann ; le nombre de couleurs reste celui de D-026.

**AC2 — Accès du bandeau (FR-02-05, P35).**
**Given** le bandeau du nom
**When** Catégorie et Zones ne sont pas renseignées
**Then** chaque accès est un bouton qui affiche une icône **et** un libellé : `Catégorie` et `Zone corporelle` (captures `8328:35698`, P35) ; le code de départ, qui n'affiche que l'icône, est complété ; les libellés passent par le lexique
**When** elles sont renseignées
**Then** l'accès Catégorie affiche une pilule (pastille colorée + nom) et l'accès Zones les noms des Zones choisies, avec le séparateur et l'icône tels que montrés par `8328:36278` et `8328:37022` (P35)
**And** les icônes ont deux états : contour au repos, plein pendant l'ouverture de la sélection ; le cercle ne change pas ; elles reviennent au repos après ✓ ou ✕
**And** une seule silhouette est affichée, celle du Profil (homme par défaut) ; jamais deux boutons homme / femme
**And** chaque accès a une cible d'au moins 44 × 44 pt (FR-22-04).

**AC3 — Ouverture sans perte du Brouillon (FR-20-01).**
**Given** un Brouillon de l'Éditeur avec nom, description et Paramètres d'exécution en Régime variables
**When** Hermann ouvre puis ferme (✓ ou ✕) la sélection de Catégorie ou de Zones
**Then** tout le Brouillon est conservé
**And** la sélection est une feuille ancrée en bas, avec en-tête ✕ / titre / ✓ et séparateur.

**AC4 — Choisir une Catégorie (FR-20-02, P14).**
**Given** la feuille de Catégories ouverte
**When** Hermann touche une Catégorie
**Then** elle est marquée sans fermer la feuille ; ✓ affecte la Catégorie marquée et ferme progressivement (immédiatement avec « Réduire les animations ») ; ✕ ferme et conserve la Catégorie d'avant l'ouverture
**And** chaque Catégorie affiche une pastille colorée et son nom
**And** l'ordre est : Catégories prédéfinies selon leur ordre d'affichage, puis Catégories personnelles par date de création croissante ; une sélection ne change pas l'ordre.

**AC5 — Choisir des Zones corporelles (FR-20-03).**
**Given** la feuille de Zones ouverte
**When** Hermann touche des Zones
**Then** chaque appui bascule la sélection de la Zone ; ✓ applique la sélection ; ✕ restaure celle d'avant l'ouverture
**And** les Zones n'ont pas de couleur et aucune silhouette n'est répétée dans les options
**And** le jeu initial est celui des dix Zones de D-093 (jeu de départ, non liste fermée).

**AC6 — Une Catégorie et au moins une Zone (FR-20-04, P15).**
**Given** un nouvel Exercice
**When** il n'a pas exactement une Catégorie et au moins une Zone
**Then** `Terminer` reste inactif (FR-02-09)
**And** une Zone retirée de son référentiel et déjà affectée ne bloque ni l'enregistrement de l'Exercice (Définition ou Copie), ni son ajout à une Séance, ni l'enregistrement de la Séance : la Copie conserve l'affectation, aucun écran d'erreur système ; l'Éditeur n'affiche aucun avis textuel ni annonce VoiceOver à son sujet (Q53 (9), décision de Hermann du 2026-10-18) ; dans la feuille des Zones de cet Exercice, elle reste visible, cochée et interactive, sur fond `#FFF1F0`, sans mention « Retirée », et peut être conservée, remplacée ou retirée (règle « au moins une Zone » et son message inchangés) ; elle n'est jamais proposée à un Exercice qui ne l'a pas (Q53, décision de Hermann du 2026-10-18, qui remplace Q49 b)
**And** Catégorie et Zones sont sans effet sur l'exécution.

**AC7 — Liste longue (FR-20-05).**
**Given** une trentaine de Catégories ou de Zones
**When** la feuille s'ouvre, clavier affiché ou non
**Then** elle monte jusqu'au bord haut de la zone de contexte, la liste défile, le clavier et les actions restent visibles
**And** un nom long reste lisible en entier par l'accessibilité.

**AC8 — Créer une entrée sans quitter le clavier (FR-20-06, P12, D-344, D-350).**
**Given** le formulaire de création (champ texte avec ↑ dans le champ)
**When** Hermann saisit un nom puis touche ↑
**Then** l'entrée est enregistrée **sans fermer le clavier ni la feuille** ; le champ est vidé ; des appuis répétés ne créent qu'une entrée
**And** une Catégorie créée est marquée comme choisie, et ✓ l'affecte ; elle reste dans le référentiel si la feuille est fermée par ✕ ; une Zone créée rejoint la sélection, et ✓ l'applique
**And** le formulaire n'a pas de bouton `Annuler` : le ✕ de l'en-tête ferme la feuille (Catégorie précédente conservée, sélection de Zones antérieure restaurée)
**And** nom vide : ↑ est inactif, **sans message d'erreur** (P12)
**And** en création de Catégorie, une seule barre de couleurs sous le champ, sans pastille séparée, avec les 12 couleurs de D-026 ; les Zones n'ont pas de palette.

**AC9 — Unicité et réactivation (FR-20-07, P34).**
**Given** un référentiel
**When** Hermann crée un nom qui existe déjà, ou qui correspond à une entrée retirée
**Then** l'unicité est assurée sur la clé normalisée du code de départ ; le traitement d'un nom dupliqué (comportement et texte) est celui du code de départ, inchangé (P34)
**And** recréer un nom retiré réactive l'entrée : même identifiant, associations conservées, sans confirmation ; pour une Catégorie, la couleur choisie à cette création est appliquée
**And** ni le démarrage ni une migration ne réactivent ni ne recréent une entrée supprimée.

**AC10 — Appui long : menu ✕ / Modifier / Supprimer (FR-20-08, P13, D-354).**
**Given** une option de Catégorie ou de Zone
**When** Hermann fait un appui long
**Then** la sélection et l'affectation ne changent pas ; un dialogue de décision s'ouvre, dans la fenêtre de la feuille, avec un ✕ rond en haut à gauche, puis `Modifier` (fond bleu Kodjo) et `Supprimer` (fond rouge), texte blanc, sur une ligne (référence 147 × 48 dans un dialogue de 354, adaptés à la largeur)
**And** un clavier déjà affiché reste affiché, y compris quand le menu est fermé par ✕
**And** `Modifier` ouvre la saisie du nom de l'entrée dans le formulaire de création, texte conservé, avec la palette pour une Catégorie ; renommer conserve l'identifiant
**And** changer la couleur d'une Catégorie s'applique aux objets courants, jamais aux Instantanés.

**AC11 — Supprimer une entrée (FR-20-09).**
**Given** le menu d'appui long
**When** Hermann touche `Supprimer`
**Then** une confirmation destructive s'affiche, de titre `Supprimer « {nom} » ?`
**And** pour une entrée utilisée, le message est `Cette catégorie ne sera plus proposée. Les exercices qui l’utilisent actuellement la conserveront.` ou `Cette zone corporelle ne sera plus proposée. Les exercices qui l’utilisent actuellement la conserveront.` ; pour une entrée non utilisée, la confirmation et son texte sont ceux du code de départ (P34)
**And** après confirmation, la sélection reste ouverte sans l'entrée supprimée ; pour une Catégorie (Q53 (8)), dans l'Exercice depuis lequel la suppression est effectuée, elle disparaît immédiatement du sélecteur et de la sélection, qu'elle soit utilisée ailleurs ou non (avis `Cette valeur a été retirée. Choisissez-en une autre.` ; `Terminer` inactif tant qu'aucune Catégorie n'est choisie) ; dans les autres Exercices qui l'ont, elle reste affectée, choisie sur fond `#FFF1F0` dans leur feuille, sans menu d'appui long, sans avis textuel sous l'accès Catégorie (Q53 (9)) ; une Copie nouvelle la conserve ; elle n'est plus proposée pour de nouvelles affectations ; aucune erreur système ni sauvegarde bloquée ; pour une Zone, dans l'Exercice depuis lequel la suppression est effectuée, la Zone disparaît immédiatement du sélecteur et de la sélection, sans rester affichée en rouge ; dans les autres Exercices auxquels elle était déjà affectée, l'affectation est conservée et la Zone apparaît sur fond `#FFF1F0` dans leur sélecteur, où l'utilisateur peut la conserver, la remplacer ou la décocher ; elle n'est plus proposée pour de nouvelles affectations ; si c'était la seule Zone de l'Exercice courant, « au moins une Zone requise » s'applique (`Terminer` inactif, message existant), sans erreur système (Q53 (7), qui remplace Q49 b) ; annuler la suppression laisse la sélection intacte
**And** toutes les entrées sont supprimables, valeurs initiales de KODJO comprises.

**AC12 — Erreurs et séparation des enregistrements (FR-20-10, P34).**
**Given** une création, une modification ou une suppression confirmée dans un référentiel
**When** elle réussit
**Then** elle est enregistrée dans le référentiel indépendamment de `Terminer` ; l'Exercice, lui, n'est enregistré qu'à `Terminer`
**When** elle échoue (injection d'échec en test)
**Then** un message s'affiche (texte du code de départ, P34), le Brouillon de l'Éditeur est conservé et l'Exercice n'est pas enregistré
**And** aucun glisser n'existe dans les référentiels ; aucune action destructive n'est déclenchée par une simple sélection.

**AC13 — Scénarios de recette des référentiels (FR-20-11).**
**Given** les données de départ de `recette-iphone.md` §2
**When** la story est close
**Then** les scénarios couvrent : une Catégorie et une Zone, chacune utilisée et non utilisée ; Catégorie choisie, annulée, créée, recolorée ; Zones 0, 1 et N ; noms vide et dupliqué ; suppression d'une valeur initiale et d'une valeur personnelle ; ancienne affectation retirée enregistrée ; nouvelle affectation d'une valeur retirée impossible ; renommage sans changement d'identifiant ; silhouette du Profil dans ses deux variantes.

**Preuves attendues :**
- Tableau de relevé d'AC1 dans la story, avant le premier commit de code.
- Tests : accès du bandeau (libellés `Catégorie` et `Zone corporelle`, pilule, noms, icônes contour / plein, silhouette unique), conservation du Brouillon, ✓ / ✕ des deux feuilles, ordre des Catégories, création par ↑ sans fermeture du clavier (journal clavier existant), appuis répétés, nom vide sans message, palette à 12 couleurs, réactivation, menu D-354 avec clavier conservé, textes de suppression, échec de référentiel sans perte du Brouillon.
- `npm test`, `npx tsc --noEmit` et `npm run lint` verts.
- Scénarios de recette iPhone : `R-4.3-01` (Catégorie : marquer, ✓, ✕, créer, recolorer), `R-4.3-02` (Zones 0, 1, N ; créer une Zone), `R-4.3-03` (appui long, `Modifier`, `Supprimer`, clavier conservé), `R-4.3-04` (affectations retirées), `R-4.3-05` (silhouette du Profil, deux variantes ; liste longue). Rattachés en 4.6 à `R-38` à `R-40`.
- Rappel NFR-04 : le menu D-354, sans frame, et l'écart de la barre de couleurs sont validés par Hermann sur appareil.
**Rappels E4 :** NFR-02, NFR-03, NFR-04, NFR-09, NFR-14.
**Hors story :** Étiquettes et Profil (PRE3-PERIM §3) ; l'accessibilité complète des référentiels et les alternatives à l'appui long (FR-22-09, FR-22-10, en 4.6) ; toute nouvelle règle de normalisation des noms.

---

### Story 4.4 : Médias dans l'Éditeur, sans perte

En tant que Hermann (utilisateur de KODJO),
je veux ajouter, ordonner et retrouver les photos et vidéos d'un Exercice depuis l'Éditeur, dans les quatre parcours,
afin que mes Médias soient enregistrés avec l'Exercice, dans mon ordre, sans jamais se perdre.

**Exigences :** FR-21-01, FR-21-02, FR-21-03, FR-21-04 (côté interface ; les règles de données FR-21-50 à FR-21-58 sont livrées en 1.1 et 1.3) ; NFR-02, NFR-03, NFR-04, NFR-05, NFR-07, NFR-08, NFR-09, NFR-14 ; P18, Q31, D-115, D-264, D-333, D-335 (amendée par Q31).
**Architecture :** AD-9 (copies et duplications : liens nouveaux, fichiers partagés), AD-11, AD-17 (gestes de la tuile, Q31 : livrés en 4.5). Fichiers principalement touchés (indicatif) : `src/features/activities/ActivityMediaList.tsx`, `src/features/activities/ActivityEditorForm.tsx` (section Médias), `src/domain/media/` (lecture), `src/infrastructure/media/` (lecture), tests. La story est une exigence de non-régression : le comportement PRE-3 accepté (menu natif Retirer / Monter / Descendre, actions accessibles Retirer / Monter / Descendre, réessai) est conservé (P18, NFR-03). Seul le **geste** d'ouverture du menu change, du toucher à l'appui long (menu contextuel natif, Q31, D-335 amendée) : ce changement est livré par la story 4.5, en même temps que le toucher devient la consultation, pour que la tuile ne passe jamais par un état sans menu ni consultation (AD-17). Cette story-ci ne modifie pas `MediaTile`.
**Références visuelles :** `8328:35698`, `8328:35740`.
**Dépend de :** 4.2, 1.3.
**Critères d'acceptation :**

**AC1 — Relevé visuel du bloc Médias (FR-22-01, FR-02-13 ; méthode de l'epic).**
**Given** les frames `8328:35698` et `8328:35740`
**When** la story démarre, avant toute modification de `src/`
**Then** le tableau de relevé est consigné pour la galerie horizontale, l'aperçu tronqué du Média suivant, la tuile d'ajout (icône vectorielle `icon/ajouter`), les pictogrammes de lecture et de plein écran (rendus par la story 4.5) et les vignettes photo et vidéo
**And** les états sans capture (import en cours, erreur d'import et réessai, menu de retrait et de réordonnancement, fichier introuvable) sont inscrits `NON VÉRIFIABLE` sur Figma et soumis à la validation de Hermann
**And** l'écart entre l'icône de la tuile d'ajout du code de départ (`action-add`) et `icon/ajouter` est inscrit et traité par le relevé (même glyphe ou écart signalé) ; jamais un « + » typographique.

**AC2 — Ajouter un Média dans les quatre parcours (FR-21-01, P18).**
**Given** l'Éditeur ouvert en CC, MC, CS ou MS
**When** Hermann ajoute une photo puis une vidéo locales depuis la zone Médias
**Then** chaque Média ajouté s'affiche en dernière position
**And** les Médias sont enregistrés avec l'Exercice à `Terminer` (au Brouillon de Composition en Séance, puis au `Continuer`)
**And** aucune caméra n'est activée implicitement ; aucune limite de nombre, de taille ni de durée n'est ajoutée ; sources système, formats et permissions restent ceux du code de départ.

**AC3 — Galerie et ordre (FR-21-02).**
**Given** un Exercice à trois Médias
**When** l'Éditeur est rendu
**Then** la galerie est horizontale et ordonnée, l'aperçu du Média suivant est tronqué, et la tuile d'ajout porte l'icône vectorielle du relevé
**And** la zone Médias reste sous la Carte Paramètres d'exécution en cas de chevauchement
**And** après réordonnancement, `Terminer`, fermeture et réouverture, les Médias réapparaissent dans le même ordre et avec la même identité
**And** le premier Média (image de couverture pour une vidéo) est la vignette de la carte du Catalogue
**And** retirer ou réordonner un Média reste possible par le menu natif Retirer / Monter / Descendre et par les actions VoiceOver `Retirer {item}`, `Monter {item}`, `Descendre {item}`, sans régression (options, bornes exclues, effets) ; le retrait ne supprime que l'association, jamais le fichier (FR-21-54, livré en 1.3)
**And** le menu s'ouvre au toucher de la tuile tant que la story 4.5 n'est pas livrée (code de départ inchangé), puis par appui long, menu contextuel natif (Q31, FR-21-02) ; les tests de non-régression des trois actions écrits ici sont repris par 4.5 avec le nouveau geste, sans changer leurs attendus.

**AC4 — Plein écran et lecture vidéo : renvoi à la story 4.5 (FR-21-02, FR-21-05, Q27).**
**Given** le rendu de référence de FR-21-02, qui montre une action de plein écran et de lecture vidéo (`S/12…:829-832`, `8328:35698`, `8328:35740`), et la décision Q27, qui les inclut dans PRE-4 pour l'Éditeur
**When** la story est livrée
**Then** la galerie conserve, sans régression, la tuile dont le toucher deviendra en 4.5 la consultation (« Lire la vidéo », « Agrandir le média ») ; cette story-ci ne l'implémente pas et ne l'exclut pas : elle est livrée et recettée en 4.5 (FR-21-05, AD-17, Q31) ; aucun bouton n'est ajouté sur la tuile
**And** FR-21-04 n'exclut que la lecture pendant l'Exécution, hors périmètre (AC6).

**AC5 — Import annulé ou en erreur (FR-21-03, P18).**
**Given** un Brouillon de l'Éditeur avec deux Médias
**When** Hermann annule le sélecteur système
**Then** ni la galerie ni le Brouillon ne changent
**When** un import échoue (erreur simulée en test : `COPY_FAILED`, `STORAGE_FULL`, `INCOMPATIBLE`, `ERROR`)
**Then** le Brouillon reste intact, le message existant du lexique s'affiche, et Hermann peut relancer l'ajout par `Réessayer` ; un réessai réussi ajoute un seul Média, en dernière position
**And** les textes d'erreur, de permission refusée, d'accès limité et de fichier introuvable restent ceux du code de départ.

**AC6 — Pas de lecture d'exécution (FR-21-04).**
**Given** PRE-4
**When** la story est close
**Then** aucun moteur de lecture des Médias pendant l'exécution n'a été ajouté (vérifié par le diff : aucun fichier du moteur d'exécution touché).

**AC7 — Copies et duplications, côté interface (FR-21-01, FR-21-02 ; renvoi FR-21-53).**
**Given** une Définition à deux Médias, copiée dans une Séance
**When** Hermann ouvre la Copie (MS), réordonne puis retire un Média, `Terminer`, `Continuer`
**Then** la Définition garde ses deux Médias dans leur ordre ; le fichier retiré de la Copie existe toujours.

**Preuves attendues :**
- Tableau de relevé d'AC1 dans la story, avant le premier commit de code ; pictogrammes de lecture et de plein écran relevés pour la story 4.5.
- Tests : ajout en dernière position dans les quatre parcours, ordre relu après réouverture, vignette de carte, annulation, erreurs et réessai (un seul Média ajouté), retrait sur une Copie sans effet sur la Définition, absence d'activation de caméra ; non-régression des actions Retirer / Monter / Descendre (options du menu selon la position, bornes exclues, effets sur l'ordre, actions VoiceOver), écrite indépendamment du geste pour être reprise par 4.5.
- `npm test`, `npx tsc --noEmit` et `npm run lint` verts.
- Scénarios de recette iPhone : `R-4.4-01` (ajout photo et vidéo, ordre, réouverture après relance de l'application), `R-4.4-02` (réordonner et retirer par le menu, ouvert par appui long sur la tuile, menu contextuel natif, Q31 ; recetté après 4.5), `R-4.4-03` (import annulé ; import en erreur et réessai, si l'erreur est reproductible sur l'appareil, sinon `NON VÉRIFIABLE` consigné), `R-4.4-04` (vignette du Catalogue ; Copie indépendante). Rattachés en 4.6 à `R-41`.
- Rappel NFR-04 : les états d'import et le menu contextuel natif, sans capture, sont validés par Hermann.
**Rappels E4 :** NFR-02, NFR-03, NFR-04, NFR-09, NFR-14.
**Hors story :** les règles de données des Médias (FR-21-50 à FR-21-58 : E1) ; la lecture des Médias en exécution (FR-21-04) ; toute limite, source ou permission nouvelle ; la consultation d'un Média dans l'Éditeur, plein écran et lecture vidéo (story 4.5, Q27).

---

### Story 4.5 : Consulter un Média dans l'Éditeur (lecteur natif)

En tant que Hermann (utilisateur de KODJO),
je veux, en touchant une tuile de la galerie de l'Éditeur, lire une vidéo ou agrandir une photo en plein écran avec le lecteur du système, et garder le menu Retirer / Monter / Descendre à l'appui long,
afin de vérifier le Média d'un Exercice sans quitter l'Éditeur ni perdre mon Brouillon.

**Exigences :** FR-21-05 ; FR-21-02 (consultation au toucher de la tuile, menu à l'appui long, Q31) ; FR-21-04 (aucune lecture pendant l'Exécution) ; FR-21-58 (Média indisponible) ; FR-22-03 (lecteur et menu natifs, AC2, AC8) ; FR-22-09 (actions VoiceOver, alternative à l'appui long, AC7) ; NFR-02, NFR-03, NFR-04, NFR-05, NFR-08, NFR-09, NFR-14 ; Q27, Q31, D-335 (amendée par Q31), P18, H13, H23.
**Architecture :** AD-17 (gestes de la tuile selon Q31 : toucher → consultation, appui long → menu contextuel natif `ContextMenu` d'`@expo/ui`, vérifié en AC9, repli défini ; lecteur natif `expo-video` ~57.0.5 et plein écran natif ; photo par la présentation modale native et `expo-image` ; aucune lecture automatique ; aucun lien avec le moteur d'Exécution ; livraison atomique du changement de geste), AD-11 (lexique). API d'`@expo/ui` `ContextMenu` relue dans la documentation versionnée SDK 57 avant de coder. Fichiers principalement touchés (indicatif) : `src/features/activities/ActivityMediaList.tsx`, `src/shared/i18n/`, tests ; lecture de `src/infrastructure/media/VideoPoster.ts` (cycle de vie existant d'un lecteur `expo-video`). L'API exacte d'`expo-video` est relue dans la documentation versionnée SDK 57 avant de coder (`docs/AGENTS.md`).
**Références visuelles :** `8328:35698`, `8328:35740` (pictogrammes de lecture et de plein écran relevés en 4.4 AC1) — visuel seulement, D-255. Le lecteur plein écran lui-même est le rendu natif d'iOS, sans frame Figma (`NON VÉRIFIABLE` sur Figma, jugé par Hermann).
**Dépend de :** 4.4.
**Hypothèses non validées :** H13, H23 ; primitive du menu contextuel natif (AD-17, `[ASSUMPTION]`, vérifiée en AC9) — à confirmer par la revue ChatGPT/Hermann avant développement.
**Critères d'acceptation :**

**AC1 — Aucune lecture automatique (FR-21-05, Q27, AD-17).**
**Given** un Exercice dont la galerie contient une vidéo
**When** l'Éditeur s'ouvre, défile, ou que la Feuille s'ouvre et se ferme
**Then** aucune vidéo n'est lue et aucun son n'est émis ; aucun lecteur n'est créé au montage de la galerie (la génération d'affiche existante de `VideoPoster.ts` est conservée telle quelle)
**And** un test de composant vérifie qu'aucun appel de lecture n'a lieu sans action de l'utilisateur.

**AC2 — Lire une vidéo à la demande, en plein écran natif (FR-21-05, FR-21-02, FR-22-03, NFR-02, Q31).**
**Given** une vidéo de la galerie
**When** Hermann touche sa tuile (toucher simple, n'importe où sur la tuile)
**Then** la vidéo est lue par le lecteur natif `expo-video`, en plein écran natif, avec les contrôles natifs du système (lecture, pause, position, fermeture)
**And** aucune commande de lecture ni aucun plein écran n'est réimplémenté en composants React Native ; aucune boucle ; le lecteur est mis en pause à la sortie du plein écran et libéré au démontage (AD-17).

**AC3 — Agrandir une photo (FR-21-05, Q27, Q31).**
**Given** une photo de la galerie
**When** Hermann touche sa tuile
**Then** la photo s'affiche en plein écran, entière, par la présentation modale native existante et `expo-image`, avec une action de fermeture libellée par le lexique
**And** aucun geste, zoom ni défilement entre Médias n'est ajouté (non demandé par Q27).

**AC4 — Retour à l'Éditeur sans perte du Brouillon (FR-21-05, NFR-05).**
**Given** un Brouillon de l'Éditeur modifié et non enregistré (nom, Description, Paramètres d'exécution appliqués par ✓, ordre des Médias)
**When** Hermann ouvre un Média en plein écran, puis ferme le plein écran
**Then** l'Éditeur réapparaît dans le même état : Brouillon identique champ par champ, ordre des Médias inchangé, aucune écriture en base (base relue identique), `Terminer` dans le même état de disponibilité
**And** le focus VoiceOver revient à la tuile du Média (H13).

**AC5 — Aucun effet sur l'Exécution (FR-21-04, FR-21-05).**
**Given** le diff de la story
**When** il est relu
**Then** aucun module du moteur d'Exécution n'est créé, importé ni modifié ; le lecteur appartient au composant de galerie de l'Éditeur ; `Lecture` (désactivé, 4.1, Q34) garde son comportement de départ.

**AC6 — Vidéo illisible ou fichier absent (FR-21-05, FR-21-58).**
**Given** une vidéo dont le fichier est absent ou que le lecteur ne peut pas décoder
**When** Hermann touche sa tuile
**Then** un état d'erreur local s'affiche (texte du lexique), sans exception non capturée ni fermeture de l'Éditeur ; le Brouillon et les autres Médias restent utilisables ; le lien du Média n'est pas supprimé
**And** un test simule l'erreur du lecteur et vérifie l'absence de plantage.

**AC7 — Accessibilité (FR-21-05, FR-22-07, FR-22-09, NFR-09, Q31).**
**Given** VoiceOver actif sur la galerie
**When** Hermann atteint une tuile
**Then** l'activation de la tuile (double toucher) consulte le Média ; l'indication de la tuile annonce « Lire la vidéo » pour une vidéo et « Agrandir le média » pour une photo, puis l'appui long pour le menu, textes du lexique repris par analogie du contrat d'écran d'Exécution (ch. 13 l. 1957), validés par Hermann à la recette (H23)
**And** les actions VoiceOver existantes `Retirer {item}`, `Monter {item}`, `Descendre {item}` restent présentes sur la tuile, bornes exclues, avec leurs effets de départ : elles sont l'alternative à l'appui long (FR-22-09)
**And** la tuile a une cible d'au moins 44 × 44 pt ; les pictogrammes de lecture et de plein écran éventuels sont masqués à l'accessibilité ; aucune lecture automatique ni aucun flash.

**AC8 — Gestes de la tuile et menu à l'appui long (FR-21-02, FR-21-05, FR-22-03, Q31, D-335 amendée, AD-17).**
**Given** une galerie de trois Médias
**When** Hermann fait un appui long sur la tuile du deuxième
**Then** le menu contextuel natif s'ouvre avec `Retirer`, `Monter` et `Descendre` ; sur le premier Média, sans `Monter` ; sur le dernier, sans `Descendre` ; chaque option a l'effet de départ (retrait de l'association seule, FR-21-54 ; déplacement d'un rang)
**And** l'appui long ne lance aucune lecture ni aucun plein écran ; un toucher simple n'ouvre plus le menu
**And** aucun bouton n'est ajouté sur la tuile : les pictogrammes de lecture et de plein écran de `8328:35740`, s'ils sont rendus, sont une indication non touchable, et la tuile entière reste la cible
**And** le commentaire D-335 de `MediaTile` (`ActivityMediaList.tsx:167-172`) est réécrit selon Q31
**And** les tests de non-régression des actions Retirer / Monter / Descendre écrits en 4.4 passent, rejoués avec l'appui long et avec les actions VoiceOver, sans changement de leurs attendus.

**AC9 — Vérification du menu contextuel natif, en ouverture de story (AD-17, NFR-02, NFR-03).**
**Given** le dev client « Routine Dev » sur l'iPhone (Q22) et `@expo/ui` 57.0.13
**When** la story démarre, avant tout autre changement de `MediaTile`
**Then** l'essai sur iPhone vérifie : appui long → menu contextuel natif avec aperçu de la tuile ; toucher simple toujours reçu par le `Pressable` ; galerie horizontale toujours défilable ; résultat consigné dans le fichier de story, sans résultat fabriqué
**And** si l'essai échoue, le repli d'AD-17 s'applique (appui long ouvrant la feuille d'actions native existante) et l'écart avec « menu contextuel natif » est signalé à Hermann avant la suite ; aucun menu n'est réimplémenté en composants React Native.

**Preuves attendues :**
- Consignation de l'essai d'AC9 (voie retenue : menu contextuel natif ou repli signalé).
- Tests : absence de lecture au montage ; lecture au toucher de la tuile (lecteur simulé) ; aucun menu au toucher ; menu à l'appui long, options selon la position ; aucune lecture à l'appui long ; non-régression Retirer / Monter / Descendre (appui long et actions VoiceOver) ; pause et libération au démontage ; plein écran photo ouvert et fermé ; Brouillon identique après fermeture ; erreur du lecteur sans plantage ; libellés, indications et actions d'accessibilité.
- `npm test`, `npx tsc --noEmit` et `npm run lint` verts.
- Scénarios de recette iPhone : `R-4.5-01` (ouvrir l'Éditeur à vidéo : rien ne joue ; toucher la tuile vidéo : plein écran natif, lecture ; fermer : retour à l'Éditeur, Brouillon intact), `R-4.5-02` (toucher la tuile photo : plein écran, fermeture), `R-4.5-03` (vidéo au fichier absent, si reproductible, sinon `NON VÉRIFIABLE` consigné), `R-4.5-04` (VoiceOver sur la galerie : activation, indication, actions Retirer / Monter / Descendre), `R-4.5-05` (appui long sur la première, une médiane et la dernière tuile : menu contextuel natif, options selon la position, aucune lecture ; retirer et réordonner ; toucher simple sans menu). Rattachés en 4.6 à `R-41`, `R-51` et `R-52`.
- Rappel NFR-04 : le plein écran natif et le menu contextuel natif n'ont pas de frame ; leur rendu est jugé par Hermann.
**Rappels E4 :** NFR-02, NFR-03, NFR-04, NFR-09, NFR-14.
**Hors story :** toute lecture pendant l'Exécution (moteur, ducking, changement de face : FR-21-04, hors périmètre) ; toute bibliothèque de visionneuse ; tout zoom ou navigation entre Médias en plein écran ; tout bouton ajouté sur la tuile ; toute option nouvelle dans le menu des Médias.

---

### Story 4.6 : Fidélité, accessibilité et recette finale de l'Éditeur

En tant que Hermann (utilisateur de KODJO),
je veux un Éditeur, une Feuille et des référentiels conformes état par état, utilisables avec VoiceOver, le texte agrandi et sans geste exclusif, et une liste complète de scénarios pour les recetter,
afin de valider PRE-4 sur mon iPhone en sachant exactement quoi regarder.

**Exigences :** FR-22-01, FR-22-02, FR-22-03, FR-22-04, FR-22-05, FR-22-06, FR-22-07, FR-22-09, FR-22-10, FR-22-12 ; FR-20-11 (scénarios des référentiels rattachés à `R-38` à `R-40`, AC11) ; Q31 (alternative au menu d'appui long des Médias, AC8) ; NFR-01 à NFR-04, NFR-08, NFR-09, NFR-10, NFR-11, NFR-14 ; SM-1 ; Q5, Q22 (recette dans le dev client « Routine Dev », après la vérification de compatibilité de 3.1), P30, P33, H13, H23.
**Architecture :** AD-7 (garde-fous des roulettes, popovers natifs), AD-11 (lexique, jetons, `UNSELECTED_OPACITY`), AD-15 (une seule surface ouverte) ; convention « Texte agrandi » de la spine (aucun `maxFontSizeMultiplier` ni `allowFontScaling` à faux, aucune hauteur fixe sur un texte). Fichiers principalement touchés (indicatif) : `ActivityEditorForm.tsx`, `ExerciseScreen.tsx`, `src/features/reference-data/*`, `ActivityMediaList.tsx`, lexique, tests d'accessibilité ; `docs/preparation/PRE-4/bmad/recette-iphone.md` (insertion de la liste de scénarios, pendant le développement).
**Références visuelles :** les 32 frames de la table de 4.22 du PRD.
**Dépend de :** 4.1, 4.2, 4.3, 4.4, 4.5, 3.8.
**Hypothèses non validées :** H9, H13, H18, H20, H23, H24, H25, H29 (attendus de la liste de recette compris) — à confirmer par la revue ChatGPT/Hermann avant développement.
**Critères d'acceptation :**

**AC1 — Conformité état par état des 32 frames (FR-22-01).**
**Given** les tableaux de relevé des stories 3.3 à 3.7 (les 19 frames de la Feuille, relevées selon la règle commune de l'epic 3), 4.2 (7 frames), 4.3 (6 frames) et 4.4 (bloc Médias de `8328:35698` et `8328:35740`, pictogrammes de lecture et de plein écran de la story 4.5 compris)
**When** la story est close
**Then** un tableau de conformité donne, pour chacune des 32 frames, la surface, la story qui en porte le relevé, les états couverts, les écarts restants et leur traitement (signalé, `NON VÉRIFIABLE` ou `À CLARIFIER`) ; une frame sans relevé est un manque bloquant, comblé dans cette story
**And** chaque contrôle est vérifié par état avec ses propriétés observées (composant et variante, jeton, géométrie, typographie, couleurs, effets, comportement adaptatif, frame) ; l'absence ou la substitution d'un élément obligatoire est bloquante ; une ressemblance partielle ne suffit pas
**And** le texte de fond de `8328:38848` qui énumère des Pauses variables n'est pas reproduit (P1) ; une frame de composant n'est jamais promue au rang d'écran ou de modale ; aucun composant absent de Figma n'est inventé
**And** les interactions documentées et les actions accessibles sont présentes dans chaque état
**And** les états exigés sans frame (`Modifier un exercice`, menu D-354, erreur d'import, réordonnancement et retrait d'un Média, N hérité, validation incomplète (fond `#FFF1F0`, Q35), douze Séries avec défilement, phrase longue, Répétitions avec option échec, abandon en modification) sont listés pour validation sur appareil.

**AC2 — Trois preuves séparées (FR-22-02, NFR-04).**
**Given** la clôture de l'epic
**When** les preuves sont consignées
**Then** les résultats des tests automatisés, les comparaisons de captures et la perception sur appareil sont consignés dans trois rubriques distinctes (story et `recette-iphone.md`) ; aucune n'est déduite d'une autre
**And** aucune conformité visuelle ou tactile n'est déclarée à partir d'une suite de tests verte.

**AC3 — Primitives natives et garde-fous (FR-22-03, NFR-02, NFR-03).**
**Given** l'ensemble des surfaces de PRE-4
**When** les tests s'exécutent
**Then** `DurationWheelPicker.test.tsx` et `NumberWheelPicker.test.tsx` gardent leurs assertions de zéro `ScrollView` sur iOS, inchangées et vertes
**And** les tests d'AD-7 (aucune `Modal` ni `Pressable` de substitution pour chaque popover) sont verts
**And** la roulette dont le bloc minutes-secondes est en Grisé manipulable n'est pas désactivée nativement (aucun `disabled`)
**And** le diff de PRE-4 ne remplace aucun mécanisme accepté (glisser des lignes, menus natifs des Médias, roulettes) ; tout écart de rendu natif est signalé (P33).

**AC4 — Cibles tactiles (FR-22-04, P30).**
**Given** chaque contrôle de l'Éditeur, de la Feuille, des Sélecteurs et des référentiels
**When** ses dimensions effectives (dessin et `hitSlop`) sont mesurées par test
**Then** chaque cible fait au moins 44 × 44 pt, sans chevauchement, avec 8 pt entre cibles adjacentes ; les cibles de 48 × 48 (fermeture, actions circulaires, Disclosure) sont conservées
**And** la poignée (12 × 18), les cellules (76 × 24) et l'option échec (30 de haut) ont une cible d'au moins 44 × 44 sans que leur dessin soit agrandi.

**AC5 — Texte agrandi (FR-22-05).**
**Given** le texte du système à 100 %, 135 % et environ 200 %
**When** l'Éditeur, la Feuille, les Sélecteurs et les référentiels sont rendus
**Then** le texte suit le réglage, sans réduction automatique ; aucune hauteur fixe ne rogne un texte, la Phrase des paramètres ou les commandes ± ; l'en-tête de la Feuille reste accessible
**And** un test vérifie qu'aucun `maxFontSizeMultiplier` ni `allowFontScaling={false}` n'apparaît dans ces surfaces ; les noms de Zones du bandeau ne sont pas tronqués sans que leur liste complète reste lisible par l'accessibilité.

**AC6 — Largeurs d'écran (FR-22-06).**
**Given** les largeurs 360, 390, 402, 430 et 440 (FR-22-06 : 360, 402 et 440 de NFR-09, plus 390 et 430)
**When** les surfaces sont rendues par test, clavier ouvert et fermé
**Then** aucun chevauchement, aucune action essentielle masquée, aucun contenu sous le clavier ou les barres système, aucun débordement horizontal
**And** seule exception : `Terminer` reste sous le clavier ouvert (FR-02-08)
**And** en recette, la largeur de l'iPhone de Hermann est consignée ; les largeurs qu'aucun appareil disponible ne permet d'observer sont inscrites `NON VÉRIFIABLE` sur appareil, sans mesure fabriquée.

**AC7 — VoiceOver dans l'Éditeur (FR-22-07, H13, H23).**
**Given** VoiceOver actif sur l'Éditeur
**When** Hermann parcourt l'écran
**Then** l'ordre de lecture est : en-tête → Nom → accès Catégorie et Zones → Description → Carte Paramètres d'exécution → Médias → `Terminer`
**And** le champ Nom, le champ Description, l'action de fermeture et chaque accès ont un libellé accessible ; les accès annoncent la Catégorie et les Zones choisies
**And** la Carte a un seul focus, dont le libellé commence par `Modifier les paramètres d’exécution` et lit ensuite la Phrase en entier, selon la composition de 4.2 AC6 ; aucune valeur estimée n'est annoncée comme saisissable ; le focus revient à la Carte à la fermeture de la Feuille
**And** les textes d'annonce nouveaux sont des clés du lexique, validées par Hermann à la recette (H23).

**AC8 — Alternatives aux gestes (FR-22-09).**
**Given** chaque action qui demande un glisser ou un maintien : réordonner ou retirer une Série du Tableau des séries variables, régler une valeur au-delà du pas simple, réordonner ou retirer un Média (menu ouvert par appui long depuis Q31), ouvrir le menu d'appui long d'une Catégorie ou d'une Zone
**When** Hermann utilise VoiceOver, ou n'utilise ni glisser ni maintien
**Then** chaque action reste possible : actions accessibles existantes de la Feuille (`Monter la série {n}`, `Descendre la série {n}`, libellés de `src/shared/i18n/index.ts:43-44`, conservés par 3.6 AC8 et annoncés selon 3.8 AC2 ; retrait par la croix, qui est un simple appui) et des Médias (actions VoiceOver `Retirer {item}`, `Monter {item}`, `Descendre {item}`, alternative au menu `Retirer` / `Monter` / `Descendre` ouvert par appui long, `index.ts:92-99`, Q31 ; 4.5 AC7, AC8), et, pour les référentiels, une action accessible équivalente à l'appui long qui ouvre le menu ✕ / `Modifier` / `Supprimer` (absente du code de départ, ajoutée par cette story)
**And** la poignée a une alternative accessible ; la forme exacte de chaque alternative est consignée.

**AC9 — Référentiels accessibles (FR-22-10).**
**Given** VoiceOver actif sur une feuille de référentiel
**When** Hermann choisit, crée, modifie ou supprime une entrée
**Then** chaque option annonce son nom et son état sélectionné ; la couleur d'une Catégorie est toujours accompagnée de son nom ; les actions ont des libellés accessibles ; toutes les Zones sélectionnées sont lisibles
**And** le focus est confiné à la feuille ou au dialogue ouvert ; il va au dialogue à son ouverture, puis revient à la liste
**And** l'action ↑ inactive (nom vide) est perçue comme désactivée autrement que par la couleur (`accessibilityState.disabled`)
**And** à la fermeture d'une feuille de référentiel, le focus revient à l'accès Catégorie ou Zones qui l'a ouverte.

**AC10 — États, appuis et lexique (FR-22-12, NFR-08, NFR-10).**
**Given** les contrôles de l'Éditeur et des référentiels
**When** ils sont actifs, pressés, désactivés, sélectionnés ou destructifs
**Then** ces états passent par des jetons sémantiques et jamais par la seule couleur (état d'accessibilité ou forme associés)
**And** l'appui dilate au contact, agit au relâchement, et n'agit pas si le doigt sort de la cible ; avec « Réduire les animations », le rendu passe par l'opacité seule
**And** tous les textes, libellés d'accessibilité compris, passent par le lexique ; un test parcourt les surfaces de PRE-4 et refuse tout texte en dur et tout terme interdit (« Activité » à l'interface, « Set » comme terme métier, « Modalités d’exécution »).

**AC11 — Liste complète des scénarios de recette (SM-1, FR-22-02, FR-20-11, Q5).**
**Given** la liste ci-dessous, rédigée avant le développement
**When** la story est développée
**Then** cette liste est insérée dans `docs/preparation/PRE-4/bmad/recette-iphone.md` (nouvelle section, au format du §3 : ID, ED et story, préconditions, gestes, attendu fonctionnel, attendu visuel, résultat) ; les scénarios `R-x.y-zz` des stories 1.1 à 4.5 y sont rattachés par la colonne « Rattachement » ; un scénario de story absent de la liste y est ajouté, jamais retiré
**And** chaque ED d'ED-01 à ED-22 a au moins un scénario, et la matrice ED × parcours ci-dessous est complète
**And** la colonne « Résultat » reste vide jusqu'à la recette de Hermann ; aucun résultat n'est pré-rempli. La recette se joue dans le dev client « Routine Dev » (Q22), après la vérification de compatibilité de 3.1 (`R-3.1-00`) ; si un nouveau build est nécessaire, il est signalé à Hermann.

**Preuves attendues :**
- Tableau de conformité des 32 frames (AC1) ; liste des états sans frame.
- Tests : garde-fous zéro `ScrollView` et popovers natifs (AC3) ; dimensions de cibles (AC4) ; absence de réduction du texte (AC5) ; rendu aux cinq largeurs (AC6) ; ordre et libellés VoiceOver (AC7, AC9) ; actions accessibles des référentiels (AC8) ; lexique et termes interdits (AC10).
- `npm test`, `npx tsc --noEmit` et `npm run lint` verts.
- Scénarios de recette iPhone : la liste complète ci-dessous (`R-01` à `R-52`), insérée dans `recette-iphone.md` ; scénarios propres à la story : `R-4.6-01` (VoiceOver dans l'Éditeur), `R-4.6-02` (texte agrandi), `R-4.6-03` (largeur de l'appareil), `R-4.6-04` (alternatives aux gestes), `R-4.6-05` (référentiels avec VoiceOver), rattachés à `R-42` à `R-48`.
- Rappel NFR-04 : la recette de Hermann est la seule preuve visuelle et tactile ; le journal de comparaison consigne ses résultats sans en fabriquer (Q6).
**Rappels E4 :** NFR-02, NFR-03, NFR-04, NFR-09, NFR-14.
**Hors story :** l'accessibilité propre à la Feuille et aux Sélecteurs (FR-22-08, FR-22-11, en 3.8), dont cette story n'inclut que la vérification de conformité (AC1) et les scénarios ; l'exécution de la recette elle-même (Hermann) ; tout rendu Android ou web (Q5).

#### Liste des scénarios de recette iPhone (à insérer dans `recette-iphone.md`)

Notation des parcours : CC, MC, CS, MS (voir les conventions de l'epic). « ×4 » : à exécuter dans les quatre parcours. Préconditions de données : `recette-iphone.md` §2, procédure de la story 1.4. Attendus visuels : frames de `references-figma.json` ; aucun chiffre lu sur une capture n'est un attendu fonctionnel (NFR-01). Les écarts entre rendu natif et Figma sont relevés, jamais corrigés par remplacement (P33).

| ID | ED · stories | Parcours | Préconditions et gestes | Attendu fonctionnel (source) | Attendu visuel | Rattachement |
|---|---|---|---|---|---|---|
| R-01 | ED-01 · 4.1 | CC | Catalogue > Exercices, filtre actif, liste défilée. Deux appuis rapides sur `Créer` ; ✕ sans saisie. | Un seul Éditeur, titre `Créer un exercice`, sans écran intermédiaire ; sortie immédiate ; filtre et défilement restaurés ; aucun Exercice créé (FR-01-01). | `8328:35698` | R-4.1-01 |
| R-02 | ED-01 · 4.1, 4.2 | CC | Saisir nom, Catégorie, une Zone, Paramètres (Durée, 3 × 30 s, Pause 10 s) ; ✓ ; `Terminer` ; rouvrir la carte. | Retour à Catalogues / Exercices ; carte présente ; réouverte, titre `Modifier un exercice`, tout identique (FR-01-05, FR-01-07). | `8328:37022` | R-4.1-01 |
| R-03 | ED-01 · 4.1 | MC | Toucher une carte hors Lecture ; modifier une Cible ; `Terminer` ; puis toucher Lecture. | Éditeur en modification, données et Médias dans l'ordre ; relecture identique ; Lecture reste désactivé et son appui n'ouvre pas l'Éditeur (FR-01-02, Q34). | — (aucune frame « Modifier ») | R-4.1-02 |
| R-04 | ED-01, ED-19 · 4.1, 1.3 | MS | Composition : ajouter un Exercice existant ; appui long sur sa carte ; appui court ; changer une Cible ; `Terminer` ; `Continuer` ; ouvrir la Définition au Catalogue. | Appui long : réorganisation sans Éditeur ; appui court : Éditeur sur la Copie ; retour à Composition ; Définition inchangée ; carte de Composition selon Q17 (FR-01-03, FR-01-06, FR-19-03). | — | R-4.1-03 |
| R-05 | ED-01 · 4.1 | CS | Composition : `Ajouter un exercice` → `Un nouvel exercice` ; remplir ; `Terminer` ; `Continuer`. | Choix `Un nouvel exercice` / `Un exercice existant` / `Annuler` ; titre `Créer un exercice` ; Exercice placé en fin de liste, absent du Catalogue ; aucune Récupération ajoutée (FR-01-03, FR-01-08). | — | R-4.1-04 |
| R-06 | ED-01, ED-11, ED-12 · 4.1 | ×4 | Exercice Durée variables 30 s / 45 s / à l'échec, Pauses 10 / 20 / 30 s, bilatéral, Bip 2 s ; basculer en Répétitions puis revenir ; déplacer la Série 3 en tête ; N = 1 puis 3 ; ✓ ; `Terminer` (et `Continuer`) ; fermer, rouvrir. | Relecture identique de tous les champs ; Définition et Copie indépendantes (FR-01-07). | — | R-4.1-05 |
| R-07 | ED-02 · 4.2 | CC, CS | Ouvrir l'Éditeur vide. | Ordre en-tête → bandeau → Description → Carte → Médias → `Terminer` ; libellé `Paramètres d’exécution` ; Carte vide sans invite (Q55) ; placeholder `Nom de l’exercice` ; accès `Catégorie` et `Zone corporelle` ; `Terminer` inactif ; aucun « Modalités d’exécution » ; aucun bouton ni nom du Mode à droite du titre de la Carte, Carte à zone touchable unique (FR-02-02, FR-02-05, FR-02-06, FR-02-09 ; Q23). | `8328:35698`, `8328:36711`, `8328:36853` | R-4.2-01 |
| R-08 | ED-02 · 4.2 | CC | Saisir nom et description ; ajouter un Média ; pendant la saisie, toucher ↑. | Description au-dessus du clavier, curseur visible ; ↑ ferme le clavier sans enregistrer ; `Terminer` reste en bas sous le clavier puis réapparaît (FR-02-07, FR-02-08). | `8328:35740` | R-4.2-02 |
| R-09 | ED-02, ED-16 · 4.2, 2.3 | ×4 | Valider la Feuille sur un Exercice de phrase longue ; toucher la Carte à plusieurs endroits. | Une seule Phrase, valeurs et unités en gras, entière, sans troncature ; lignes `Compte à rebours` et `Fin d’exercice` séparées ; tout point de la Carte ouvre la Feuille (FR-02-06, P17). | `8328:37022` (lignes Compte à rebours et Fin : `NON VÉRIFIABLE`) | R-4.2-03 |
| R-10 | ED-02 · 4.2 | CC, CS puis MC, MS | Modifier un champ, puis ✕ : `Annuler`, puis ✕ : `Confirmer`. | Création : `Abandonner la création ?` / `Les informations saisies seront perdues et l’exercice ne sera pas créé.` ; modification : `Abandonner les modifications ?` / `Les modifications apportées à cet exercice seront perdues.` ; `Annuler` conserve tout ; `Confirmer` quitte sans enregistrer (FR-02-12, Q18). | `8328:36781` (textes remplacés par Q18) | R-4.2-05 |
| R-11 | ED-02 · 4.2 | CC | Nom de 80 caractères puis tentative d'un 81e ; retirer la Catégorie ; retirer la dernière Zone ; ouvrir un Exercice ancien à Cible 5999 s non modifiée. | `Terminer` inactif tant qu'une condition manque ; la saisie s'arrête à 80 ; l'Exercice ancien reste enregistrable sans modifier la valeur (FR-02-09, H25). L'erreur d'écriture, non reproductible sans outil, est couverte par les tests et inscrite `NON VÉRIFIABLE` sur appareil si elle ne peut être provoquée. | — | R-4.2-04 |
| R-12 | ED-02, ED-22 · 4.2 | CC | Comparer chaque bloc, dans chaque état disponible, au tableau de relevé de 4.2. | Typographie, couleurs, contour, ombre conformes au relevé ; écarts listés et jugés par Hermann (FR-02-13). | 7 frames de 4.2 | R-4.2-06 |
| R-13 | ED-03 · 3.3 | ×4 | Toucher la Carte ; modifier un réglage ; ✕ ; rouvrir ; refaire avec « Réduire les animations ». | Voile en fondu, Feuille montant du bas (en place avec réduction) ; en-tête ✕ / `Paramètres d’exécution` / ✓ fixe ; ordre du corps de FR-03-02 ; ✕ rend l'Éditeur inchangé ; focus revenu à la Carte (FR-03-01 à FR-03-03). | `8328:36923` | R-3.3-06 |
| R-14 | ED-03, ED-05 · 3.3 | ×4 | Ouvrir le popover `Mode d’exécution` ; appui extérieur ; rouvrir ; choisir `Répétitions`. | Exactement `Durée` puis `Répétitions` ; appui extérieur ferme sans appliquer ; une seule surface ouverte ; ligne déclenchante désignée active (FR-03-06, FR-03-10, FR-05-01). | `8328:37092`, `8328:38513` | R-3.1-01, R-3.3-01 |
| R-15 | ED-03 · 3.3 | CC | Popover `Changement de côté` ; VoiceOver sur les options. | Options `Sans changement`, `Droite puis gauche`, `Gauche puis droite` ; directions annoncées en toutes lettres ; aucun segmenté (FR-03-07). | `8328:37972` | R-3.3-02, R-3.8-01 |
| R-16 | ED-03, ED-12 · 3.3 | CC | Bilatéral ; popover `Ordre des côtés` ; puis N = 1. | Ligne présente en bilatéral seulement ; `Un côté après l’autre` et `Les deux côtés à chaque série` ; à N = 1 ligne masquée ; l'Ordre choisi est conservé et réaffiché dès N ≥ 2 — source : Q38 (FR-03-08, FR-12-04). | `8328:38953`, `8328:39072`, `8328:38193`, `8328:38301` | R-3.3-02, R-3.3-03 |
| R-17 | ED-04 · 3.3, 3.6 | CC, MC | Popover de Régime : `variables` ; replier par le chevron ; mettre 3 × 30 s / Pause 10 s ; ✓ ; `Terminer` ; rouvrir. | Deux entrées `identiques` / `variables` ; aucun interrupteur ; replier ne change rien ; Régime `variables` conservé malgré des valeurs égales (FR-04-01, FR-04-02, FR-04-05). | `8328:39390`, `8328:39181` | R-3.3-03, R-3.6-07 |
| R-18 | ED-05, ED-11 · 3.2, 3.3 | CC | Durée variables 30 s / 45 s / à l'échec ; passer en Répétitions ; tenter ✓ ; revenir en Durée. | N, Pauses, Bip, côtés, Compte à rebours, Fin conservés ; 30 s et 45 s → `—` sur fond `#FFF1F0`, sans contour (Q35), sans message ; échec conservé ; ✓ indisponible ; retour en Durée : 30 s, 45 s, à l'échec (FR-11-03, FR-11-04 ; UJ-1). | — | R-3.3-01, R-3.6-07 (règles du domaine de 3.2) |
| R-19 | ED-06, ED-10 · 3.6 | CC | Tableau en Durée, Répétitions, puis tout à l'échec et mixte. | Cellules `30 s`, `12 rép.`, `à l’échec` ; deux colonnes même tout à l'échec (FR-06-05, FR-10-01). | `8328:38632`, `8328:38741`, `8328:38848` (texte de fond non repris, P1), `8470:13303` | R-3.6-01, R-3.6-02 |
| R-20 | ED-07 · 3.4 | ×4 | Toucher `Durée d’une série` ; faire défiler minutes et secondes jusqu'aux bornes. | Option `Aucune durée, à l’échec` en tête, filet, roulette minutes-secondes ; minutes 00 à 58 sans rebouclage ; à 58 secondes jusqu'à 55 ; secondes au pas de 1 s (Q36) ; haptique à chaque cran ; ✕ / ✓ propres (FR-07-02, FR-07-05, FR-07-06). | `8328:37862` | R-3.4-01, R-3.4-04 |
| R-21 | ED-07, ED-08 · 3.5 | ×4 | Répétitions : toucher `Nombre de répétitions` ; tourner vers 12 ; revenir en tête. | Une colonne : `Aucune répétition, à l’échec`, puis 1 à 100 ; 12 sélectionne 12 ; la tête sélectionne l'échec ; aucun grisé ajouté (FR-07-03, FR-08-03 ; Q8, Q14). | — (état sans frame) | R-3.5-01 |
| R-22 | ED-08 · 3.4 | CC | Scénario FR-08-05 : ouvrir sur 30 s ; toucher l'option ; tourner vers 00:30 ; ✓ ; rouvrir ; choisir l'échec ; ✓ ; rouvrir ; changer puis ✕. | Option à 45 % puis 100 %, bloc `00:00` à 45 % manipulable sans déverrouillage ; réouvertures fidèles ; ✕ restaure (FR-08-01, FR-08-02, FR-08-05). | `8328:37862` | R-3.4-01 |
| R-23 | ED-08 · 3.4 | CC | Cible numérique ; amener la roue sur `00:00`. | ✓ du Sélecteur indisponible ; aucune conversion en échec (FR-08-04, Q15). | — | R-3.4-02 |
| R-24 | ED-09 · 3.4, 3.6, 1.4 | MC | Exercices anciens : Cible 7 s, Cible 5999 s, Cible 150 rép., Bip 11. Ouvrir le Sélecteur puis ✕ ; ± du Pied ; enregistrer sans modifier. | 7 s, valide depuis Q36 : ouvert sur 00:07, non signalé ; + → 8 s, − → 6 s ; 5999 s : ouvert sur 58:55, ✕ → 5999 s ; + indisponible, − → 3535 s ; 150 : ouvert sur 100 ; valeurs non modifiées enregistrables (FR-09-04, FR-09-05 ; Q21, P38, H25). | — | R-3.4-03, R-3.5-02, R-3.6-05, R-1.1-02 |
| R-25 | ED-09, ED-10 · 3.6 | CC | Toucher une cellule de Pause, puis une cellule de Cible ; ± du Pied ; cellule à l'échec ; cellule `—`. | Une seule Cellule active : barre, fond de colonne, Pied `Série 1 · Durée` ; Cible Durée au pas de 1 s dans 5 à 3535 s (Q36) ; Pause 0 à 300 s ; ± indisponibles sur une cellule à l'échec ; cellule `—` sur fond `#FFF1F0` (`color.dangerSurface`), sans contour (Q35), sans message (FR-10-02, FR-10-04, FR-10-06). | `8328:38632` | R-3.6-01, R-3.6-07 |
| R-26 | ED-10, ED-12, ED-22 · 3.6 | CC | Glisser la poignée de la Série 3 en tête ; puis VoiceOver : action `Monter la série {n}`. | Corps immobile, repère d'insertion bleu Kodjo de 2 ; renumérotation ; nouvelle dernière ligne porteuse de PN ; même déplacement par action accessible (FR-10-07, FR-12-03, FR-22-09). | `8328:39279` | R-3.6-03 |
| R-27 | ED-11 · 3.2 | CC | Modifier Mode, Régime, N, une Cible, déplacer une ligne ; ✕ ; refaire puis ✓ ; rouvrir et passer en `variables`. | ✕ annule toute l'ouverture ; ✓ applique d'un bloc, Phrase régénérée, rien en base ; Réserve vidée après ✓ (FR-11-01, FR-11-02). | — | R-3.3-06, R-3.6-06 (règles du domaine de 3.2) |
| R-28 | ED-12 · 3.6 | CC | N 5 → 3 → 5 ; N à 99 ; croix sur la Série 2 puis `Annuler` ; N = 1. | Lignes 4 puis 5 restaurées dans l'ordre ; N borné à 99 ; « Série supprimée — Annuler » restaure position, Cible et Pause ; croix indisponible à N = 1 ; Régime non modifiable à N = 1 (FR-12-01, FR-12-02, FR-12-04, FR-12-05). Champ de N ouvert, −, puis toucher une cellule de Cible : champ de N resté ouvert après −, puis fermé et cellule activée avec son Sélecteur d'un seul geste (FR-03-05, FR-10-05). | `8328:39072` | R-3.6-04, R-3.6-06, R-3.6-09 |
| R-29 | ED-13 · 3.7, 2.1 | CC | Composer : Durée 30 / 45 / échec, Pauses 10 × 3 ; Répétitions 10 / 12 / échec, Bip 2 s puis 0 ; tout à l'échec ; Durée 30 / 45 / 60. | `≥ 1 min 45 s` ; `≥ 1 min 14 s` ; Bip 0 : aucune ligne Durée totale ; tout échec : aucune ligne ; `2 min 45 s` exact (FR-13-02, FR-13-03 ; R01 à R04). | `8470:13303` (montant non repris de la capture) | R-3.7-02, R-3.7-03, R-2.1-01 |
| R-30 | ED-14 · 3.7 | CC | Durée identiques d = 30 s, p = 10 s : roulette de Durée totale sur 160 s puis 180 s ; `Annuler` du message ; puis une Cible à l'échec. | 160 s → N = 4, aucun message ; 180 s → N = 5, `Durée ajustée à 3 min 20 s pour respecter un nombre entier de séries.` avec `Annuler` qui restaure ; roulette sans option échec ; avec échec : aucune Inversion, total ≥ en lecture seule (FR-14-01 à FR-14-04). | `8328:38084`, `8328:38409` | R-3.7-01, R-3.7-02 |
| R-31 | ED-15 · 2.4, 1.3 | MC, MS | Cartes Catalogue et Composition des Exercices de R-29 ; ajouter une Récupération positive en Composition. | Catalogue : `≥ 1 min 45 s` ; Répétitions Bip 0 : aucune ligne de durée ; exact 165 s : `2 min 45 s`, comme avant la mise à jour ; résumé `3 séries variables` ; tout échec `3 séries à l’échec` (Q24) ; jamais `0 s` ni `0 rép.` ; Composition : partiel en `≥` minutes et secondes, exact et estimé inchangés ; Récupération remplaçant la Pause terminale dans la durée d'occurrence (FR-15-02, FR-15-06 ; Q17, Q20, P41, H20). | — | R-2.4-01 à R-2.4-05 |
| R-32 | ED-16 · 2.3 | CC | Afficher la Phrase des Exercices de R-29 et un mélange de 4 Cibles. | `3 séries de durée variable (30 s, 45 s puis jusqu’à l’échec). Durée totale : ≥ 1 min 45 s.` ; `3 séries de répétitions variables (10, 12 puis jusqu’à l’échec), cadencées toutes les 2 s. Durée totale : ≥ 1 min 14 s.` ; `4 séries variables, de 30 s à l’échec. Durée totale : ≥ 2 min 55 s.` ; tout échec : `3 séries menées jusqu’à l’échec`, identique dans les deux Modes ; valeurs et unités en gras (FR-16-02, FR-16-07 à FR-16-10 ; Q16, H9, H18). | `8470:13303` | R-2.3-01, R-2.3-03, R-2.3-04 |
| R-33 | ED-17, ED-18 · 2.3, 1.1 | MC | Ancien Exercice « À l’échec » (données de départ) : comparer sa Phrase avant et après la mise à jour ; afficher la phrase la plus longue. | Phrase identique (ex. `3 séries menées jusqu’à l’échec`) ; phrase la plus longue entière (FR-17-03, FR-17-05 ; UJ-2). | — | R-2.3-01, R-2.3-02, R-1.1-01 |
| R-34 | ED-18, ED-21 · 1.1, 1.4 | MC, MS | Installation à données de `c32e360d` (§2) ; mettre à jour ; ouvrir chaque Exercice, Copie, Média, Catégorie, Zone. | Rien de perdu ; ancien À l'échec → Répétitions, toutes Cibles à l'échec ; Pauses, côtés, Bip, Médias et ordre inchangés (FR-18-10, FR-18-11, FR-21-57 ; SM-2). | — | R-1.4-01, R-1.4-03 |
| R-35 | ED-18 · 1.2, 1.4 | — | Installation contenant un Exercice illisible (Q19) ; premier lancement après la mise à jour ; quitter sans toucher le bouton et relancer ; toucher le bouton ; relancer. | Exercice écarté ; message d'information unique avec le nombre écarté, un seul bouton ; de nouveau présent si l'application a été quittée avant le bouton, absent après fermeture par le bouton ; sa Séance reste visible et ouvrable (P39) ; autres données intactes (FR-18-20 ; H24). | — | R-1.2-01, R-1.2-02, R-1.4-02 |
| R-36 | ED-18, ED-09 · 1.1, 3.4 | MC | Exercice ancien Bip 11 et Cible 5999 s : `Terminer` sans les modifier ; rouvrir ; modifier la Cible. | Réenregistré tel quel ; la modification impose une valeur dans les bornes, à la seconde (Q36) (FR-09-05, FR-18-06, FR-18-07 ; H25). | — | R-1.1-02 |
| R-37 | ED-19, ED-21 · 1.3 | MS | Copier une Définition mixte à deux Médias dans une Séance ; modifier la Copie ; dupliquer l'occurrence (parcours existant) ; copier une Définition à Cible à renseigner et tenter `Continuer`. | Copie complète, Cibles typées et Médias ordonnés conservés ; Définition inchangée ; duplication fidèle ; Cible à renseigner : ajout permis, `Continuer` refusé (FR-19-01 à FR-19-08 ; H29). | — | R-1.3-01, R-1.3-02, R-1.3-03 |
| R-38 | ED-20 · 4.3 | ×4 | Feuille Catégories : marquer, ✓ ; rouvrir, marquer une autre, ✕ ; créer par ↑ (clavier ouvert) ; nom vide ; nom dupliqué ; recolorer. | Toucher marque, ✓ affecte, ✕ conserve ; création sans fermer clavier ni feuille ; ↑ inactif sans message ; doublon selon le code de départ ; 12 couleurs (FR-20-02, FR-20-06, FR-20-07). | `8328:35810`, `8328:36056`, `8328:36278` | R-4.3-01 |
| R-39 | ED-20 · 4.3 | CC, MC | Feuille Zones : 0, 1, puis N Zones ; ✓ ; ✕ ; créer une Zone ; liste longue. | Bascule par appui ; ✓ applique ; ✕ restaure ; au moins une Zone exigée ; noms des Zones dans le bandeau ; feuille jusqu'au bord de la zone de contexte (FR-20-03 à FR-20-05). | `8328:36348`, `8328:36536` | R-4.3-02, R-4.3-05 |
| R-40 | ED-20 · 4.3 | MC | Clavier ouvert : appui long sur une entrée ; ✕ ; `Modifier` (renommer) ; `Supprimer` une entrée utilisée, une valeur initiale ; ancienne affectation retirée ; Profil homme puis femme. | Menu ✕ / `Modifier` / `Supprimer`, clavier conservé ; identifiant conservé ; textes `Supprimer « {nom} » ?` et `Cette catégorie ne sera plus proposée…` ; affectation retirée enregistrable, nouvelle affectation impossible ; une seule silhouette, celle du Profil (FR-20-08, FR-20-09, FR-02-05). | `8328:35932`, `8328:36441` (antérieures à D-354 ; menu `NON VÉRIFIABLE`) | R-4.3-03, R-4.3-04 |
| R-41 | ED-21 · 4.4, 4.5 | ×4 | Ajouter une photo et une vidéo ; réordonner, retirer par le menu ouvert par appui long sur la tuile (menu contextuel natif, Q31), puis par les actions VoiceOver ; vérifier qu'un toucher simple n'ouvre pas le menu ; annuler un import ; `Terminer` ; relancer l'application ; rouvrir ; regarder la carte du Catalogue. | Dernière position à l'ajout ; ordre et identité relus ; import annulé sans effet ; vignette = premier Média ; Copie indépendante ; erreur d'import et réessai si reproductible, sinon `NON VÉRIFIABLE` ; menu `Retirer` / `Monter` / `Descendre` à l'appui long, options selon la position, sans lecture ; mêmes effets par VoiceOver (FR-21-01 à FR-21-03, FR-22-09 ; Q31). | `8328:35698`, `8328:35740` ; menu contextuel natif sans frame (`NON VÉRIFIABLE`) | R-4.4-01 à R-4.4-04, R-4.5-05 |
| R-42 | ED-22 · 4.6 | ×4 | VoiceOver : balayer l'Éditeur ; ouvrir et fermer la Feuille. | Ordre en-tête → Nom → accès → Description → Carte → Médias → `Terminer` ; Carte : un focus, libellé `Modifier les paramètres d’exécution` suivi de la Phrase lue entière (4.2 AC6) ; focus revenu à la Carte (FR-22-07). | — | R-4.6-01 |
| R-43 | ED-22 · 3.8 | CC | VoiceOver dans la Feuille et les deux Sélecteurs. | Focus confiné ; ✕ et ✓ libellés ; Régime variables annoncé ; Cellule active `Série i · Durée` ; option échec sélectionnée / non sélectionnée ; ≈ « estimation », ≥ « total prévisionnel partiel » ; `Bip de cadence` et `Aucun` ; actions `Monter la série {n}` et `Descendre la série {n}` annoncées (FR-22-08, FR-14-05 ; H23). | — | R-3.8-01, R-3.1-03, R-3.4-05, R-3.5-03, R-3.7-04 |
| R-44 | ED-22 · 4.6, 3.8 | CC | Texte du système à 100 %, 135 %, ≈ 200 % : Éditeur, Feuille, Sélecteurs, référentiels. | Aucune troncature, Phrase entière, ± visibles, en-tête de Feuille accessible (FR-22-05). | — | R-4.6-02, R-3.8-03 |
| R-45 | ED-22 · 4.6 | CC | Consigner modèle et largeur de l'iPhone ; parcourir les surfaces, clavier ouvert et fermé. | Aucun chevauchement ni action masquée ni débordement ; `Terminer` sous le clavier seul admis ; autres largeurs `NON VÉRIFIABLE` sur appareil (FR-22-06). | — | R-4.6-03 |
| R-46 | ED-22 · 4.6, 3.8 | CC | Toucher les petites cibles (poignée, cellules, option échec, ✕ des feuilles) ; ouvrir une roulette et tenter `Terminer`. | Cibles fiables d'au moins 44 × 44 ; roulette ouverte : actions extérieures inactives (FR-22-04, FR-22-11). | — | R-4.6-04, R-3.8-02 |
| R-47 | ED-22 · 4.6 | CC | Sans glisser ni maintien, avec VoiceOver : réordonner une Série, un Média ; ouvrir le menu d'une Catégorie. | Chaque action possible par une action accessible : `Monter la série {n}` / `Descendre la série {n}` ; `Monter {item}` / `Descendre {item}` ; action équivalente à l'appui long d'une Catégorie (FR-22-09). | — | R-4.6-04, R-3.6-03 |
| R-48 | ED-22 · 4.6 | CC | VoiceOver dans les feuilles de référentiel ; ↑ avec nom vide ; fermer la feuille. | Nom et état annoncés ; couleur toujours accompagnée du nom ; ↑ annoncé désactivé ; focus revenu à l'accès (FR-22-10). | — | R-4.6-05 |
| R-49 | ED-22 · 4.6 | CC | « Réduire les animations » actif : Feuille, popovers, feuilles de référentiel ; appuyer puis glisser le doigt hors d'un bouton. | Apparitions et fermetures sans animation de déplacement ; appui sans action si le doigt sort ; états non portés par la seule couleur (FR-22-12, NFR-10). | — | R-4.6-04 |
| R-50 | ED-01 à ED-22 · 4.6 | ×4 | Passe de contrôle dans chacun des parcours CC, MC, CS, MS : ouvrir l'Éditeur, la Feuille, le popover Mode, un Sélecteur, le tableau, une feuille de référentiel, ajouter un Média ; `Terminer`. | Mêmes surfaces et même comportement dans les quatre parcours ; effet de `Terminer` selon le contexte (FR-01-03, FR-01-05). | — | — |
| R-51 | ED-21, ED-22 · 4.5 | ×4 | Exercice à une vidéo et une photo ; modifier le nom sans `Terminer` ; ouvrir l'Éditeur et attendre ; toucher la tuile de la vidéo ; mettre en pause, fermer le plein écran ; toucher la tuile de la photo ; fermer ; appui long sur la vidéo ; puis `Lecture` depuis le Catalogue (MC). | Aucune lecture ni aucun son à l'ouverture ; vidéo lue seulement au toucher de sa tuile, en plein écran natif, contrôles du système ; photo entière en plein écran ; appui long : menu, aucune lecture ; aucun bouton sur la tuile ; retour à l'Éditeur avec le nom modifié et l'ordre des Médias intacts, rien en base ; `Lecture` inchangée, sans lecture de Média par le moteur (FR-21-05, FR-21-02, FR-21-04 ; Q27, Q31). | `8328:35740` (pictogrammes) ; plein écran natif sans frame (`NON VÉRIFIABLE`) | R-4.5-01, R-4.5-02 |
| R-52 | ED-21, ED-22 · 4.5 | CC | VoiceOver sur la galerie ; vidéo au fichier absent ou illisible, si reproductible. | Activation de la tuile : consultation, annoncée « Lire la vidéo » ou « Agrandir le média » ; actions `Retirer {item}`, `Monter {item}`, `Descendre {item}` toujours proposées (Q31) ; focus revenu à la tuile après fermeture ; vidéo illisible : état d'erreur local, aucun plantage, Brouillon intact ; sinon `NON VÉRIFIABLE` consigné (FR-21-05, FR-21-58 ; H23). | — | R-4.5-03, R-4.5-04 |

**Matrice ED × parcours.** Les scénarios marqués « ×4 » sont exécutés dans les quatre parcours ; R-50 assure une passe complète par parcours.

| ED | CC | MC | CS | MS |
|---|---|---|---|---|
| ED-01 | R-01, R-02, R-06, R-50 | R-03, R-06, R-50 | R-05, R-06, R-50 | R-04, R-06, R-50 |
| ED-02 | R-07 à R-12 | R-09, R-10 | R-07, R-09, R-10 | R-09, R-10 |
| ED-03 | R-13 à R-16 | R-13, R-14 | R-13, R-14 | R-13, R-14 |
| ED-04 | R-17 | R-17 | R-50 | R-50 |
| ED-05 | R-14, R-18 | R-14 | R-14 | R-14 |
| ED-06 | R-19 | R-50 | R-50 | R-50 |
| ED-07 | R-20, R-21 | R-20, R-21 | R-20, R-21 | R-20, R-21 |
| ED-08 | R-21, R-22, R-23 | R-21 | R-21 | R-21 |
| ED-09 | R-25 | R-24, R-36 | R-50 | R-50 |
| ED-10 | R-19, R-25, R-26 | R-50 | R-50 | R-50 |
| ED-11 | R-18, R-27 | R-06 | R-06 | R-06 |
| ED-12 | R-16, R-26, R-28 | R-06 | R-06 | R-06 |
| ED-13 | R-29 | R-50 | R-50 | R-50 |
| ED-14 | R-30 | R-50 | R-50 | R-50 |
| ED-15 | — (carte Catalogue : R-31 en MC) | R-31 | R-50 | R-31 |
| ED-16 | R-32 | R-09 | R-09 | R-09 |
| ED-17 | — | R-33 | — | — |
| ED-18 | — | R-33, R-34, R-36 | — | R-34 |
| ED-19 | — | — | R-05 | R-04, R-37 |
| ED-20 | R-38, R-39 | R-38, R-39, R-40 | R-38 | R-38 |
| ED-21 | R-41, R-51, R-52 | R-41, R-51 | R-41, R-51 | R-41, R-51 |
| ED-22 | R-42 à R-49 | R-42 | R-42 | R-42 |

Les cases « — » sont sans objet : ED-17 et ED-18 portent sur des données antérieures (MC, MS) ; ED-19 porte sur les copies (CS, MS) ; ED-15 porte sur les cartes consommatrices, observées hors de l'Éditeur.

#### Couverture E4

| FR | Story / AC |
|---|---|
| FR-01-01 | 4.1 AC1, AC2 |
| FR-01-02 | 4.1 AC3 |
| FR-01-03 | 4.1 AC4, AC5, AC6 |
| FR-01-04 | 4.1 AC7 |
| FR-01-05 | 4.1 AC8 |
| FR-01-06 | 4.1 AC9 |
| FR-01-07 | 4.1 AC10 |
| FR-01-08 | 4.1 AC11 |
| FR-01-09 | 4.1 AC12 |
| FR-01-10 | 4.1 AC13 |
| FR-02-01 | 4.2 AC2 |
| FR-02-02 | 4.2 AC3 |
| FR-02-03 | 4.2 AC4 |
| FR-02-04 | 4.2 AC5 |
| FR-02-05 | 4.3 AC2 |
| FR-02-06 | 4.2 AC6, AC14 |
| FR-02-07 | 4.2 AC7 |
| FR-02-08 | 4.2 AC8 |
| FR-02-09 | 4.2 AC9 ; 4.3 AC6 |
| FR-02-10 | 4.2 AC10 ; 4.1 AC13 |
| FR-02-11 | 4.2 AC11 |
| FR-02-12 | 4.2 AC12 ; 4.1 AC2 |
| FR-02-13 | 4.2 AC1, AC13 (relevé de 4.3 AC1 et 4.4 AC1 pour les blocs voisins) |
| FR-20-01 | 4.3 AC3 |
| FR-20-02 | 4.3 AC4 |
| FR-20-03 | 4.3 AC5 |
| FR-20-04 | 4.3 AC6 |
| FR-20-05 | 4.3 AC7 |
| FR-20-06 | 4.3 AC8 |
| FR-20-07 | 4.3 AC9 |
| FR-20-08 | 4.3 AC10 |
| FR-20-09 | 4.3 AC11 |
| FR-20-10 | 4.3 AC12 |
| FR-20-11 | 4.3 AC13 ; 4.6 AC11 (R-38 à R-40) |
| FR-21-01 | 4.4 AC2, AC7 |
| FR-21-02 | 4.4 AC1, AC3, AC4, AC7 ; 4.5 AC2, AC3, AC8 (gestes, Q31) |
| FR-21-03 | 4.4 AC5 |
| FR-21-04 | 4.4 AC6 ; 4.5 AC5 |
| FR-21-05 | 4.5 AC1 à AC9 (R-41, R-51, R-52) |
| FR-22-01 | 4.6 AC1 ; 4.2 AC1 ; 4.3 AC1 ; 4.4 AC1 |
| FR-22-02 | 4.6 AC2, AC11 |
| FR-22-03 | 4.6 AC3 ; 4.5 AC2, AC8 |
| FR-22-04 | 4.6 AC4 ; 4.3 AC2 |
| FR-22-05 | 4.6 AC5 |
| FR-22-06 | 4.6 AC6 ; 4.2 AC5 |
| FR-22-07 | 4.6 AC7 ; 4.5 AC7 |
| FR-22-09 | 4.6 AC8 ; 4.5 AC7 (actions VoiceOver des Médias, Q31) |
| FR-22-10 | 4.6 AC9 |
| FR-22-12 | 4.6 AC10 |

**Points signalés par l'epic et leur traitement.**
- **E4-1 (4.1 AC5)** : écart D-194 sur la création dans une Séance, déjà signalé par le PRD (FR-01-03, §9 point 3). **Traité par P8 et Q4** : le comportement PRE-3 accepté est conservé, sans nouveau parcours ; l'écart reste signalé pour la revue, sans changement de comportement.
- **E4-2 (4.2 AC14)** : bouton de Mode à côté du titre de la Carte dans le code de départ. **Tranché par Q23** : retiré ; Carte à zone touchable unique.
- **E4-3 (4.4 AC4)** : bouton plein écran et lecture vidéo de la galerie, mentionnés par le rendu de référence de FR-21-02 et absents du code de départ. **Tranché par Hermann (Q27, après la revue ChatGPT R3)** : inclus dans PRE-4 pour l'Éditeur, par le lecteur natif, sans lecture automatique (FR-21-05, AD-17, story 4.5) ; la lecture pendant l'Exécution reste hors périmètre (FR-21-04). **Geste tranché par Hermann (Q31, après la porte post-revue M2)** : toucher la tuile consulte, le menu Retirer / Monter / Descendre passe à l'appui long (menu contextuel natif), actions VoiceOver conservées ; aucun bouton ajouté ; D-335 amendée (4.5 AC8, AC9). *Traitement initial, historique : P18, non ajoutés et classés `NON VÉRIFIABLE`.*
- **E4-4 (4.6 AC6)** : contrôle sur appareil des largeurs 360, 402 et 440 ; une seule largeur est observable avec un seul iPhone, sans simulateur iOS sous Windows. **Traité par Q5 et Q6** : recette sur l'iPhone de Hermann seulement, aucune mesure fabriquée ; les autres largeurs sont couvertes par des tests et marquées `NON VÉRIFIABLE` sur appareil.
- **E4-5 (4.3 AC1)** : barre de couleurs de `8328:36056` contre les 12 couleurs de D-026, déjà signalé par le PRD (FR-20-06, notes). **Traité par NFR-01 (D-255)** : Figma ne crée aucune règle ; les 12 couleurs de D-026 s'appliquent, l'écart visuel est inscrit au relevé et signalé à Hermann.

<!-- FIN EPIC 4 -->

---

## Couverture consolidée

Synthèse des quatre tables de couverture (E1 à E4) : pour chacune des 197 FR, les stories qui la portent. Entre parenthèses, les stories qui la vérifient à l'interface sans en être le porteur principal. Le détail par critère d'acceptation est dans la table de couverture de chaque epic.

| ED | FR → stories |
|---|---|
| ED-01 | FR-01-01 → 4.1 ; FR-01-02 → 4.1 ; FR-01-03 → 4.1 ; FR-01-04 → 4.1 ; FR-01-05 → 4.1 ; FR-01-06 → 4.1 ; FR-01-07 → 4.1 ; FR-01-08 → 4.1 ; FR-01-09 → 4.1 ; FR-01-10 → 4.1 |
| ED-02 | FR-02-01 → 4.2 ; FR-02-02 → 4.2 ; FR-02-03 → 4.2 ; FR-02-04 → 4.2 ; FR-02-05 → 4.3 ; FR-02-06 → 4.2 ; FR-02-07 → 4.2 ; FR-02-08 → 4.2 ; FR-02-09 → 4.2, 4.3 ; FR-02-10 → 4.2, 4.1 ; FR-02-11 → 4.2 ; FR-02-12 → 4.2, 4.1 ; FR-02-13 → 4.2 (4.3, 4.4) |
| ED-03 | FR-03-01 → 3.3, 3.8 ; FR-03-02 → 3.3, 3.7 ; FR-03-03 → 3.2, 3.3 ; FR-03-04 → 3.2, 3.3 ; FR-03-05 → 3.3, 3.6 ; FR-03-06 → 3.3 ; FR-03-07 → 3.3 ; FR-03-08 → 3.3 ; FR-03-09 → 3.3 ; FR-03-10 → 3.1, 3.3 ; FR-03-11 → 3.1, 3.4, 3.7 ; FR-03-12 → 3.6 ; FR-03-13 → 3.8 |
| ED-04 | FR-04-01 → 3.2, 3.3 ; FR-04-02 → 3.3, 3.6 ; FR-04-03 → 3.2 ; FR-04-04 → 3.2 ; FR-04-05 → 3.2 |
| ED-05 | FR-05-01 → 3.3 ; FR-05-02 → 3.2, 3.3 ; FR-05-03 → 3.2 ; FR-05-04 → 3.3 ; FR-05-05 → 1.1, 1.3 |
| ED-06 | FR-06-01 → 3.2 ; FR-06-02 → 1.1, 1.3, 3.4, 3.6, 3.7 ; FR-06-03 → 3.2 ; FR-06-04 → 3.2 ; FR-06-05 → 3.4, 3.6 ; FR-06-06 → 1.3 |
| ED-07 | FR-07-01 → 3.4, 3.5, 3.6 ; FR-07-02 → 3.4 ; FR-07-03 → 3.5 ; FR-07-04 → 3.4, 3.5 ; FR-07-05 → 3.4, 3.5, 3.7 ; FR-07-06 → 3.4 ; FR-07-07 → 3.7 ; FR-07-08 → 3.4, 3.5 |
| ED-08 | FR-08-01 → 3.4 ; FR-08-02 → 3.4 ; FR-08-03 → 3.5 ; FR-08-04 → 3.4 ; FR-08-05 → 3.4 ; FR-08-06 → 3.4 |
| ED-09 | FR-09-01 → 1.1 (3.4) ; FR-09-02 → 1.1 (3.5) ; FR-09-03 → 1.1 (3.3) ; FR-09-04 → 3.3, 3.6 ; FR-09-05 → 1.1 (3.4, 3.5, 3.6) ; FR-09-06 → 3.2, 3.6 |
| ED-10 | FR-10-01 → 3.6 ; FR-10-02 → 3.6 ; FR-10-03 → 3.6 ; FR-10-04 → 3.6 ; FR-10-05 → 3.3, 3.6 ; FR-10-06 → 3.6 ; FR-10-07 → 3.6 ; FR-10-08 → 3.6 |
| ED-11 | FR-11-01 → 3.2 ; FR-11-02 → 3.2 ; FR-11-03 → 3.2 ; FR-11-04 → 3.2 ; FR-11-05 → 3.2, 3.3 ; FR-11-06 → 3.2 |
| ED-12 | FR-12-01 → 3.2 ; FR-12-02 → 3.2 (3.6) ; FR-12-03 → 3.2, 3.6 ; FR-12-04 → 3.2, 3.3 ; FR-12-05 → 3.2, 3.6 ; FR-12-06 → 3.6 ; FR-12-07 → 3.2 |
| ED-13 | FR-13-01 → 2.1 ; FR-13-02 → 2.1 ; FR-13-03 → 2.1 ; FR-13-04 → 2.1 ; FR-13-05 → 2.1 (2.2) ; FR-13-06 → 2.1 |
| ED-14 | FR-14-01 → 3.7 ; FR-14-02 → 2.1 (3.7) ; FR-14-03 → 2.1 (3.7) ; FR-14-04 → 3.7 ; FR-14-05 → 3.7 |
| ED-15 | FR-15-01 → 1.1, 1.3 ; FR-15-02 → 2.2 ; FR-15-03 → 2.2 ; FR-15-04 → 2.2 ; FR-15-05 → 2.2, 2.4 ; FR-15-06 → 2.4 ; FR-15-07 → 1.1, 1.3 |
| ED-16 | FR-16-01 → 2.3 ; FR-16-02 → 2.3 ; FR-16-03 → 2.3 ; FR-16-04 → 2.3 ; FR-16-05 → 2.3 ; FR-16-06 → 2.3 ; FR-16-07 → 2.3 ; FR-16-08 → 2.3 ; FR-16-09 → 2.3 ; FR-16-10 → 2.3 ; FR-16-11 → 2.3, 2.4 |
| ED-17 | FR-17-01 → 2.2, 2.3 ; FR-17-02 → 2.3 (1.1) ; FR-17-03 → 2.3 (1.1) ; FR-17-04 → 2.3 ; FR-17-05 → 2.3 |
| ED-18 | FR-18-01 → 1.1 ; FR-18-02 → 1.1 ; FR-18-03 → 1.1 ; FR-18-04 → 1.1 ; FR-18-05 → 1.1 ; FR-18-06 → 1.1 ; FR-18-07 → 1.1 ; FR-18-08 → 1.1, 1.4 ; FR-18-09 → 1.1, 1.4 ; FR-18-10 → 1.1, 1.4 ; FR-18-11 → 1.1, 1.4 ; FR-18-12 → 1.1, 1.4 ; FR-18-13 → 1.1, 1.4 ; FR-18-14 → 1.1, 1.4 ; FR-18-15 → 1.1, 1.4 ; FR-18-16 → 1.1, 1.2, 1.4 ; FR-18-17 → 1.3 ; FR-18-18 → 1.3 ; FR-18-19 → 1.4 ; FR-18-20 → 1.1, 1.2, 1.4 |
| ED-19 | FR-19-01 → 1.3 ; FR-19-02 → 1.3 ; FR-19-03 → 1.3 ; FR-19-04 → 1.3 ; FR-19-05 → 1.3 ; FR-19-06 → 1.3 (1.1) ; FR-19-07 → 1.3 ; FR-19-08 → 1.3 ; FR-19-09 → 1.3 (1.1) ; FR-19-10 → 1.3 ; FR-19-11 → 1.3 ; FR-19-12 → 1.3 ; FR-19-13 → 1.3 |
| ED-20 | FR-20-01 → 4.3 ; FR-20-02 → 4.3 ; FR-20-03 → 4.3 ; FR-20-04 → 4.3 ; FR-20-05 → 4.3 ; FR-20-06 → 4.3 ; FR-20-07 → 4.3 ; FR-20-08 → 4.3 ; FR-20-09 → 4.3 ; FR-20-10 → 4.3 ; FR-20-11 → 4.3, 4.6 |
| ED-21 | FR-21-01 → 4.4 ; FR-21-02 → 4.4, 4.5 ; FR-21-03 → 4.4 ; FR-21-04 → 4.4, 4.5 ; FR-21-05 → 4.5 ; FR-21-50 → 1.3 ; FR-21-51 → 1.3 ; FR-21-52 → 1.3 ; FR-21-53 → 1.3 ; FR-21-54 → 1.3 ; FR-21-55 → 1.3 ; FR-21-56 → 1.3 ; FR-21-57 → 1.1, 1.4 ; FR-21-58 → 1.3 |
| ED-22 | FR-22-01 → 4.6, 4.2, 4.3, 4.4 ; FR-22-02 → 4.6 ; FR-22-03 → 4.6 (4.5) ; FR-22-04 → 4.6, 4.3 ; FR-22-05 → 4.6 (3.8) ; FR-22-06 → 4.6, 4.2 (3.8) ; FR-22-07 → 4.6 (4.5) ; FR-22-08 → 3.8 ; FR-22-09 → 4.6 (3.6, 4.5) ; FR-22-10 → 4.6 ; FR-22-11 → 3.8 ; FR-22-12 → 4.6 |

**Contrôles de cohérence de l'assemblage.** Les 197 FR du PRD figurent chacune dans au moins une story. Chaque story ne dépend que de stories antérieures dans l'ordre 1.1 → 1.4 → 2.1 → 2.4 → 3.1 → 3.8 → 4.1 → 4.6 (les mentions de stories ultérieures dans les critères sont des renvois de portée, jamais des dépendances). Le dernier point ouvert, C-E2-6 (libellé du résumé de carte d'un Exercice tout à l'échec), a été tranché par Hermann en Q24 : `{N} séries à l’échec`.

## Validation finale (étape 4 du skill)

Faite le 2026-10-16 par Claude, sans menu interactif (consigne d'autonomie de Hermann, voir la vue d'ensemble). Cette validation n'est pas la revue indépendante ChatGPT exigée par `CLAUDE.md`.

| Contrôle | Résultat |
|---|---|
| Couverture des FR | Les 197 FR sont couvertes par au moins une story (tables E1 à E4 et couverture consolidée, comparées aux titres du PRD : ni manque ni excédent). FR-21-05 (Q27) est portée par la story 4.5. |
| Modèle de démarrage | Sans objet : projet existant (brownfield). Préalable noté : `npm ci` dans ce clone. |
| Création des tables au besoin | Seule `migration010` (story 1.1) modifie le schéma : reconstruction d'`activities` et table `migration_notices`. Cette table est lue en 1.2. La séparation est imposée par AD-4 et AD-14 : une seule migration atomique. |
| Taille des stories | 1.1 est volumineuse (25 AC), mais atomique par AD-14 : un socle vert est impossible autrement. Ses AC sont structurés en 5 sous-ensembles, avec des tâches ordonnées. Les autres stories tiennent dans une session d'agent. |
| Dépendances | Uniquement vers des stories antérieures. 3.1 (S0) dépend de la vérification du dev client « Routine Dev » (Q22), sans bloquer les documents. |
| Valeur des epics | E1 porte une valeur de préservation des données, rendue obligatoire par AD-14. E2 à E4 livrent des capacités visibles. |
| Recouvrement de fichiers | E3 et E4 touchent tous deux l'Éditeur et la Feuille. Le découpage est maintenu pour une vraie frontière de risque : S0 en tête d'E3 peut changer la technique des popovers avant le travail de l'écran principal. |
| Indépendance des epics | E2 fonctionne sur les données d'E1 sans E3 ; E3 sans E4 ; E4 s'appuie sur E1 à E3. |

**Résultat :** tous les contrôles passent. Statut porté à `final` pour cette étape de préparation. Le document reste soumis à la revue ChatGPT, puis à l'arbitrage de Hermann.

**Révision après revue ChatGPT du 2026-10-16 (R1-R4, Q27-Q30).** R1 : story 1.1 AC7, tableau unique de tolérance historique (150 → 100 valide ; 150 → 101 ou 120 refusée ; 150 inchangée tolérée). R2 : stories 3.3 et 3.6 alignées sur AD-15 révisé (`openSurface` et `activeCell` distincts, transitions T1 à T19, rappel tardif ignoré) ; R-3.6-08 vérifié pas à pas. R3 (Q27) : nouvelle story 4.5 « Consulter un Média dans l'Éditeur (lecteur natif) », FR-21-05, AD-17 ; l'ancienne 4.5 devient 4.6 ; 4.4 AC4 renvoie à 4.5 ; scénarios R-51 et R-52 ajoutés. R4 (Q28) : 1.1 AC5, AC9 (c11), AC14 et 1.4 AC1, AC3 ; P40 remplacée, P44 amendée. Q29 : 3.2 AC10, 3.6 AC9, R-3.6-04. Q30 : 2.1 AC5, 2.2 AC4 (Séance 165 + 105 = 270 s ≥), C-E2-3. H5 et H30 retirées des lignes « Hypothèses non validées ». Après révision : 197 FR, chacune couverte ; dépendances toujours vers l'arrière (4.5 dépend de 4.4 ; 4.6 de 4.1 à 4.5 et 3.8) ; copies des parties identiques aux fichiers `epics-parts/`. Cette révision n'est ni une nouvelle revue ChatGPT ni une autorisation de développement.

**Révision après la porte post-revue du 2026-10-16 (M1 à M3, F1 à F5, Q31).** M1 : 3.3 AC8 et 3.6 AC2, AC3, AC9 alignés sur AD-15 complété (T1 à T27 : champ ± ouvert vers une autre valeur ou une cellule d'un seul geste, ± sans fermeture, N diminué sans fermer le champ de N, surfaces natives qui absorbent l'appui, `Annuler` sans rangement) ; `R-3.6-09` (séquence S4) rattaché à R-28 ; tests du réducteur T1 à T27. M2 (Q31) : 4.4 AC3, AC4 et `R-4.4-02` ; 4.5 AC2, AC3, AC6, AC7, nouvelles AC8 (gestes et menu à l'appui long) et AC9 (vérification du menu contextuel natif, repli signalé) ; `R-4.5-05` ; R-41, R-51, R-52. M3 : 4.2 AC6 (invite de la seule Carte vide, H22 précisée). F4 : renvois de couverture désormais cités dans les stories visées (3.2, 2.2, 1.1, 1.4, 4.2, 4.3, 4.4, 4.5, 4.6). F5 : 2.1 dépend de 1.1 et 1.3, squelette aligné. Après révision : 197 FR, chacune couverte ; dépendances vers l'arrière ; copies des parties identiques aux fichiers `epics-parts/`. Ni revue ChatGPT ni autorisation de développement.
