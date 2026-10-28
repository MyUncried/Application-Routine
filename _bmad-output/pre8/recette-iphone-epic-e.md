# PRE-8 — Cahier de recette iPhone de l'epic E (Catalogue unifié des Séances)

> Préparé le 28/10/2026 sur `pre8-bmad/dev` (commit consigné dans le bilan de l'epic, `_bmad-output/pre8/bilan-epic-e-2026-10-28.md`). **Aucun parcours n'est validé** : la validation appartient à Hermann, sur appareil. L'epic E n'est pas considéré comme recetté avant cette validation.
>
> Gabarits : 360 (iPhone SE / mini), 402 (iPhone 16 / 17), 440 (Pro Max). Texte agrandi : Réglages › Accessibilité › Affichage et taille du texte › Texte plus grand (deux crans au-delà du défaut). « Réduire les animations » : Réglages › Accessibilité › Mouvement. VoiceOver pour les cases marquées 🔊.
>
> Pour chaque case : ✅ conforme, ❌ problème (décrire), ➖ non testé. Les Séances à plusieurs Cycles ou plusieurs Circuits ne peuvent pas être créées sur l'appareil tant que l'epic C n'existe pas : leur rendu est couvert par les tests automatiques seulement.

## 0. Avant d'installer

- **Aucune migration dans E** : la base reste au schéma **15** (014 et 015 d'A/B). Un appareil déjà passé en A/B ne voit aucun avis de mise à jour.
- **Aucune dépendance native modifiée** : le build de développement **Routine BMAD** (`com.ankusha.kodjo.bmad`) déjà installé suffit.
- Ouvrir : arrêter tout autre serveur Expo ; depuis `C:\Dev\KODJO-BMAD-PRE8` (PowerShell) : `$env:APP_VARIANT='bmad'; npx expo start --dev-client --tunnel --scheme routine-bmad --port 8081` ; sur l'iPhone, ouvrir **Routine BMAD** et scanner le QR code.
- **Jeu de données conseillé** (créé dans l'app avant la recette) :
  1. « Squat assisté » : 1 Exercice, Mouvement **avec photo**, 3 séries de 1 min 30 s ;
  2. « Mobilisation du genou » : 1 Exercice **sans photo**, 1 série de 45 s ;
  3. « Renforcement du genou » : 4 ou 5 Exercices, catégories Renforcement et Mobilité, un Circuit de 3 tours, une récupération après un Exercice ;
  4. « Séance au nom très long pour vérifier la troncature sur une seule ligne » : 3 Exercices de trois catégories différentes (pour « +N ») ;
  5. une Séance avec une **Étiquette** (ex. Hyrox) ;
  6. une Séance à archiver pendant la recette.

## E.1 / E.2 — Carte unique

- [ ] Segment Séances : une seule forme de carte pour toutes les Séances ; aucune barre de couleur, aucune étiquette, aucune zone corporelle sur la carte.
- [ ] Visuel carré 64 à 8 du bord : photo de l'Exercice pour « Squat assisté » ; vignette **Libre** (cadre pointillé gris) pour « Mobilisation du genou » ; pour « Renforcement du genou », photo du premier Exercice qui en a une.
- [ ] Texte aligné à 84 (après le visuel) ; nom sur une ligne, tronqué par « … » si trop long.
- [ ] Chevron à côté du nom **seulement** pour les Séances de plusieurs Exercices ; aucun chevron pour une Séance d'un Exercice.
- [ ] Ligne Catégories : pictogramme gris, noms séparés par « · », sans doublon, dans l'ordre de la composition ; Séance n° 4 à 360 : « +N » à la fin, aucun mot coupé.
- [ ] Ligne de synthèse : haltère puis « N exercices » (plusieurs) ou le volume (« 3 × 1 min 30 s », « 1 × 45 s ») pour un seul Exercice ; jamais « 1 exercice ».
- [ ] Durée à droite, sablier gris : minutes et secondes exactes, sans arrondi (D-391), « ≈ » si estimée, « ≥ » avec des Répétitions sans durée (ex. « ≥ 11 min 3 s », « 45 s »). La zone de contexte de la Composition garde son estimation arrondie à 15 s (D-443) : un écart d'arrondi entre les deux écrans est attendu.
- [ ] Bouton Lecture (rond violet pâle) à droite, à 8 du bord, sur toute carte active ; le toucher **n'ouvre rien** (ni Exécution, ni Composition). 🔊 annoncé « Lancer la séance — indisponible ».
- [ ] Cartes de 80 de haut repliées, 12 entre deux cartes, marges de 16, largeur pleine à 360 / 402 / 440.
- [ ] Texte agrandi : rien ne se chevauche ; la carte s'agrandit ; le bouton Lecture reste à sa place.
- [ ] Une Séance sans Exercice (si elle existe dans la base historique) affiche « 0 exercice » et s'ouvre sans erreur.
- [ ] Toucher la carte (hors chevron et Lecture) ouvre la Composition en modification.

## E.3 — Déploiement

- [ ] Toucher le chevron déploie la carte ; il pointe vers le haut ; un nouveau toucher replie. Toucher le chevron n'ouvre pas la Composition.
- [ ] Sous un filet, la composition occupe toute la largeur (sous le visuel) ; nom à gauche, volume à droite ; « Circuit · 3 tours » en gris sans valeur ; membres du Circuit décalés de 16 avec un filet vertical à gauche ; récupération en gris clair, à sa place, avec sa durée.
- [ ] Un Circuit d'un seul tour avec un seul Exercice n'ajoute aucune ligne de Circuit.
- [ ] La hauteur suit le contenu ; l'animation d'ouverture et de fermeture est fluide.
- [ ] « Réduire les animations » activé : ouverture et fermeture immédiates.
- [ ] Défiler la liste avec une carte déployée : rien ne s'ouvre ni ne se lance.
- [ ] 🔊 VoiceOver : la carte annonce son nom, ses catégories, sa synthèse et sa durée ; action « Afficher la composition de … » (balayage vertical) ; une fois déployée, la composition est lue avec la carte ; état « déployé » annoncé.

## E.5 — Actions glissées, archivage, restauration, suppression

- [ ] Glisser une carte active vers la gauche : la carte suit le doigt ; trois actions jointives de 80 de haut, alignées en haut, se terminant sur la marge droite : **Planifier** (grisé), **Dupliquer** (gris), **Archiver** (orange) ; la carte s'arrête à 8 du bloc.
- [ ] Même geste sur une carte **déployée** : les actions gardent 80 de haut, en haut de la carte.
- [ ] Une seule carte ouverte à la fois ; un toucher sur une carte ouverte ne l'ouvre pas ; un glissé vers la droite la referme.
- [ ] Planifier : grisé, sans effet.
- [ ] Dupliquer : une copie « {nom} (copie) » apparaît ; deux touchers rapides ne créent qu'une copie.
- [ ] Archiver : immédiat, sans confirmation ; la carte quitte la liste ; snackbar « Séance archivée » avec **Annuler** ; Annuler : la Séance revient à sa place.
- [ ] Filtre Statut = Archivées (voir E.6) : la Séance archivée apparaît, **sans bouton Lecture**, texte jusqu'à la marge, bordure grise.
- [ ] Glisser une carte archivée : **Restaurer** (indigo) puis **Supprimer** (rouge), 80 de haut.
- [ ] Restaurer : snackbar « Séance restaurée » avec Annuler ; la Séance revient parmi les actives à sa place ; Annuler la réarchive.
- [ ] Supprimer : dialogue « Supprimer cette séance ? » / « Cette séance archivée sera définitivement supprimée. Cette action est irréversible. » ; **Annuler** ne supprime rien ; **Confirmer** supprime la Séance, sans snackbar d'annulation.
- [ ] Après suppression : les Mouvements utilisés par la Séance restent dans le segment Mouvements.
- [ ] Toucher une Séance archivée : la Composition l'affiche comme archivée, non modifiable (règle existante).
- [ ] 🔊 VoiceOver : actions « Dupliquer », « Archiver » (ou « Restaurer », « Supprimer ») dans le rotor d'actions ; Planifier absent.

## E.4 — Écran du segment Séances

- [ ] Segmenté : **Mouvements | Séances | Programmes** ; Séances sélectionné au lancement ; Programmes grisé, sans effet ; plus de segment Exercices.
- [ ] Rangée : « Un exercice | Plusieurs » à gauche ; puis Filtre, Tri (grisé), Créer à droite, Créer sur la marge.
- [ ] « Un exercice » : seules les Séances d'un Exercice ; « Plusieurs » : seules les Séances de plusieurs Exercices ; toucher de nouveau l'option active : collection complète. 🔊 état sélectionné annoncé, indication « Touchez de nouveau pour afficher toutes les séances ».
- [ ] Vue sans résultat : « Aucune séance ne correspond aux filtres. » ; Catalogue vide (aucune Séance) : message habituel dans son cadre.
- [ ] Créer : ouvre directement « Composer une séance » ; double toucher : une seule Composition ; enregistrer : retour au Catalogue, segment Séances.
- [ ] Ouvrir une Séance puis revenir : vue, filtres, position de défilement et cartes déployées conservés.
- [ ] Relancer l'application : segment Séances, collection complète, aucun filtre.
- [ ] Segment Mouvements : rangée inchangée (Rechercher, Créer, Filtrer, Trier), recherche et filtres de B fonctionnels.

### Rangée responsive (Q-E4) — avec un filtre actif (ex. Statut = Archivées)

- [ ] **440** : forme étendue sur une ligne — rond bleu (réinitialise) + « Filtres / Archivées » (ouvre le panneau).
- [ ] **402** : forme compacte sur une ligne — deux ronds distincts : filtre sur fond bleu pâle (ouvre), croix (réinitialise en un toucher).
- [ ] **360** : deux lignes — la bascule, puis les commandes à droite ; aucune commande masquée ni chevauchée.
- [ ] Texte agrandi, à chaque gabarit : deux lignes si nécessaire, jamais de chevauchement entre « Plusieurs » et le filtre.
- [ ] Toucher chaque commande et chaque option de la bascule avec le pouce : cibles confortables (≥ 44), aucun toucher qui active la commande voisine.
- [ ] Réinitialiser (rond bleu ou croix) : les filtres sont retirés en un toucher ; la vue « Un exercice / Plusieurs » choisie est **conservée**.

## E.6 — Panneau de filtres

- [ ] Toucher Filtre : feuille avec poignée, ✕ à gauche, « Filtres », ✓ à droite, filet.
- [ ] Sections dans l'ordre : Statut des séances (pastilles Actives / Archivées sur la même ligne, à droite), Catégories, Zones corporelles, Étiquettes, Format ; chevron accolé au titre ; le titre ouvre ou ferme sa section.
- [ ] Sans filtre : seul Statut est visible, les autres sections repliées. Avec un filtre (ex. une Étiquette) : à la réouverture, sa section est ouverte.
- [ ] Réinitialiser fixé en bas de la feuille, ne défile pas avec le contenu.
- [ ] ✓ applique ; ✕ ferme sans rien appliquer.
- [ ] Statut Archivées : seules les archivées ; Actives + Archivées : les deux.
- [ ] Catégorie Mobilité + Zone Genoux : une Séance dont un Exercice est en Mobilité et un **autre** sur les Genoux apparaît (critères portés par des Exercices différents).
- [ ] Deux catégories choisies : Séances de l'une **ou** l'autre.
- [ ] Étiquette Hyrox : seule la Séance étiquetée.
- [ ] Format : 12 vignettes ; **Libre** sélectionnable (toutes les Séances) ; les 11 autres visibles, pâlies, sans effet ; 🔊 annoncées « … — indisponible ».
- [ ] Résumé dans la commande : nom du critère s'il y en a un, sinon « N filtres ».
- [ ] Filtres + vue « Un exercice » : les deux se combinent.

## E.8-a — Anciens Exercices (définitions)

- [ ] Ouvrir Créer (ou une Séance) → « Ajouter un exercice » → « Un exercice existant » : chaque ligne porte un crayon **Modifier** à droite, distinct de la case.
- [ ] Toucher la ligne coche / décoche, comme avant ; toucher le crayon **ne coche pas**.
- [ ] Crayon : l'éditeur habituel de l'Exercice s'ouvre sur la bonne définition (données, médias, menu Niveau).
- [ ] Modifier le nom, Terminer : retour à la sélection, nom mis à jour, **cases cochées conservées**.
- [ ] Revenir à la Composition (Annuler) : le brouillon (nom de Séance, Exercices déjà ajoutés) est intact.
- [ ] Ajouter les Exercices cochés : ils entrent dans la Composition comme avant.
- [ ] Toutes les anciennes définitions sont présentes dans la sélection (aucune perdue, aucune en double).
- [ ] 🔊 le crayon est un élément propre, « Modifier l’exercice {nom} ».

## Non-régression

- [ ] Composition : créer, modifier, Points d'arrêt, dupliquer un Exercice, enregistrer : comportement inchangé.
- [ ] Segment Mouvements : piles, déploiement, glissé, archivage avec Annuler, filtres, fiche Mouvement, rangs des Niveaux après archivage (b8-3 : N1, N2 sans trou).
- [ ] Second lancement : aucune donnée perdue.

## Réserves à trancher pendant la recette

- **R-E1** — levée : durée de la carte selon D-391.
- **R-E2** — vignettes Tabata et EMOM reconstituées hors sélection (désactivées).
- **R-E3** — forme compacte du filtre actif (précision UX hors Figma, Q-E4) : apparence du rond « ouvrir » (fond bleu pâle) et de la croix.
- **R-E4** — lignes de la composition déployée au format « 3 × 12 rép. » / « 45 s » (le ch13 de `main` décrit encore `12 reps · x3`).
- **R-E5** — filtre Archivées sans Séance archivée : message générique « Aucune séance ne correspond aux filtres. » ; le ch13 prévoit un message propre, sans texte fourni.
