# Pauses de Composition et symboles de durée — consolidation du 07/10/2026

Version normative complémentaire à Paramètres v13, Bip v2 et Phrase v1. Décisions D-302 à D-307. Sources : [prompt révisé](../archives/figma-2026-10-07/prompt-claude-source.md), arbitrages explicites du propriétaire et lecture Figma du 07/10. Les arbitrages prévalent sur les passages contradictoires du prompt ; Figma définit le layout, jamais les calculs. Aucun redesign des shells.

## 1. Autorité et règles conservées

La cadence conserve ses signaux intermédiaires/final, sa progression temporelle, les intervalles de reprise, la portée du Reset, l’arrière-plan et les seuils de sécurité. Le chronomètre continue après le nominal ; Suivant termine normalement, même avant le nominal. Aucun compteur de répétitions réalisées n’est déduit. La qualification « cadence déclarative sans signaux » du prompt est rejetée.

Phrase selon les276 cas Excel v14 : « pause après chaque série », Q-08 clos et H-03 remplacé. Bilatéralité et pause à la frontière des côtés conservées selon les nouvelles formules. Excel reste rédactionnel.

## 2. Résultats temporels — remplacés par Bip v2

[Bip v2](SPECIFICATION-BIP-CADENCE-v2.md) fait autorité : exact Durée, ≈ Répétitions avec bip, omitted Répétitions sans bip et À l’échec ; ≥ seulement en Séance avec travail inconnu. Q-07 clos. Travail et pause après chaque série, dernière comprise ; Récupération positive remplaçant seulement cette dernière Pause. Les règles de placement, brouillon et trait ci-dessous restent applicables.

## 3. Pause de Composition : deux types, un parcours

Pause est le terme d’interface commun à :
- Récupération : pause chronométrée explicitement ajoutée après une occurrence ;
- Point d’arrêt : arrêt structurel, attente exclue de la durée prévue.

Ces objets ne fusionnent pas avec la Pause après chaque série, la Pause entre les côtés ni la Pause manuelle d’exécution.

Une nouvelle occurrence ne crée aucune récupération. Le bouton Pause ouvre le mode placement de la Composition. Chaque emplacement autorisé présente deux blocs côte à côte, de largeur identique : Récupération et Point d’arrêt. Plusieurs éléments peuvent être sélectionnés en une seule entrée ; une récupération et un point peuvent coexister à la même position.

Sélectionner Récupération ouvre immédiatement la modale de durée. La valeur proposée provient du défaut Profil de récupération, initialement 0min30s. Cette règle dérivée conserve le réglage existant en déplaçant son application de la création d’occurrence à l’ajout explicite. Une modification ultérieure du Profil n’altère pas les pauses déjà ajoutées.

## 4. Brouillons, validation et annulation

Entrer en placement crée un sous-brouillon de la Composition. Le clic sur un Point d’arrêt bascule sa sélection dans ce sous-brouillon. Sélectionner une récupération puis Valider la durée confirme l’ajout au sous-brouillon ; fermer la roulette sans Valider (retour/fermeture du panneau, sans inventer de bouton Annuler absent de la capture) abandonne uniquement cette édition et restitue l’état antérieur de cet emplacement.

Le bouton indique « Confirmer N pauses ajoutées » ; N compte les ajouts du sous-brouillon, une récupération et un point comptent deux éléments. Une désélection retire l’ajout du décompte. Les éléments déjà présents ne sont pas comptés comme nouveaux ; la modification de leur durée n’est pas un ajout. À N=0, aucune confirmation d’ajout vide n’est proposée comme action active. Annuler reste libellé Annuler et restitue l’état avant entrée en placement.

Confirmer applique atomiquement le sous-brouillon au brouillon parent. Continuer seul enregistre la Séance. Quitter/abandonner la Composition restitue la version persistée. Échec de validation, double appui et erreur d’écriture ne produisent pas d’ajout partiel.

Les récupérations restent 0..300s avec la grille de pas déjà validée ; 0 est valide, ne produit pas de phase et n’affiche pas d’information de récupération. Un objet explicitement réglé à0 peut rester distinct de l’absence pour la persistance ; la suppression enlève l’objet. Ce choix ne modifie ni les calculs ni l’affichage conditionnel.

## 5. Contenu et trait de démarcation

| Contexte | Récupération positive | R absente ou0 | Point présent | Trait |
|---|---|---|---|---|
| Composition ordinaire | Icône et valeur visibles | Informations récupération absentes | Informations point visibles | Conservé |
| R absente/0 et aucun point | — | Aucune information de pause | — | Conservé hors placement |
| Placement | Bloc Récupération sélectionnable et valeur si renseignée | Emplacement Récupération sélectionnable | Bloc Point d’arrêt selon sélection | Trait de démarcation supprimé pendant le choix |

Le trait ne désigne pas la ligne entière de contenu. Supprimer les informations ne doit pas supprimer ce trait hors placement ni faire disparaître les contrôles pendant le choix. Même distinction après la dernière occurrence : récupération absente/0 sans phase et sans contenu, trait selon le layout hors placement. Aucun Point d’arrêt terminal n’est créé.

**Écart de capture maintenu explicitement :** certains écrans Figma, dont 2028:11700, ont supprimé tout l’emplacement à zéro. Les PNG sont fidèles à Figma et ne corrigent pas artificiellement ce rendu ; le contrat D-303 gouverne le trait. Cette mission documentaire ne modifie pas la géométrie Figma.

## 6. Positions, ordre et retrait

Récupération uniquement après une occurrence, y compris la dernière ; aucune récupération avant le premier Exercice. Point d’arrêt : frontières existantes conservées, interdit juste après le compte à rebours initial et juste avant Fin de séance, permis avant/après Circuit et entre ses Exercices. Les deux types ont donc un parcours commun sans devenir interchangeables à toutes les frontières.

À un emplacement partagé : Exercice → récupération positive → Point d’arrêt → suite. Les éléments internes au Circuit s’exécutent à chaque Tour. Circuit désigne le groupe, Tour sa répétition.

Appui long sur la récupération existante ouvre la bulle Retirer la récupération, comme Retirer le point d’arrêt. Choisir Retirer supprime du brouillon ; toucher hors bulle ferme sans mutation. Ne pas ajouter un second dialogue absent de la référence. La suppression d’une récupération retire sa durée du plan et rétablit la Pause terminale configurée ; elle ne modifie pas la définition d’Exercice.

## 7. Modèle fonctionnel et API

Le modèle logique distingue deux objets de pause : recovery (durée, occurrence source) et breakpoint (position structurelle). La présence explicite n’est pas déduite de la durée. Un identifiant stable permet les opérations idempotentes. L’attachement de recovery à l’occurrence est conservé ; le Point d’arrêt garde ses règles de position structurelle.

postActivityRecoverySeconds devient une projection compatible pour les calculs : durée de recovery si présente,0 sinon. Il n’est pas une seconde source persistée concurrente. Schéma physique, index et numéro de migration relèvent du développement ; aucune migration009 ni version de stack n’est prescrite sans revue du code. Aucune reprise des séances anciennes n’est demandée dans ce lot de conception.

Déplacer/dupliquer l’occurrence conserve sa récupération explicite et ses paramètres ; supprimer l’occurrence supprime sa récupération. Les règles structurelles des points d’arrêt restent celles de la Composition. Le snapshot copie les pauses effectives ; POST_ACTIVITY_RECOVERY est générée seulement pour recovery positive. Aucune récupération post-exercice en exécution directe. La machine distingue récupération chronométrée et attente au point d’arrêt ; phases existantes réutilisées.

| Opération | Entrée | Résultat et contrat |
|---|---|---|
| Ouvrir le placement | Brouillon Composition | Sous-brouillon isolé, positions autorisées par type |
| Ajouter recovery | Occurrence, durée validée | Objet explicite ; défaut proposé au moment de l’ajout |
| Ajouter breakpoint | Position autorisée | Objet structurel, pas de durée cible |
| Modifier/retirer | Identifiant de pause | Mutation du sous-brouillon/brouillon, aucune sauvegarde prématurée |
| Confirmer/Annuler | Sous-brouillon | Application atomique ou restitution, décompte correct |
| Calculer le total | Plan et séries effectives | exact/estimated/lowerBound/omitted, ou incomplete |
| Exécuter | Snapshot | Séries/pauses/côtés/récupérations/points selon plan, cadence sonore conservée |

## 8. Recette documentaire et fonctionnelle

Vérifier R absente, R0, Rpositive croisés avec point absent/présent, dans/hors placement ; absence d’informations n’efface pas le trait hors placement. Vérifier annulation de roulette, annulation du placement, sélection de plusieurs types/positions, désélection et décompte. Vérifier retrait par bulle, fermeture extérieure, déplacement, duplication, suppression, limites terminales, répétition par Tour, sauvegarde atomique et abandon.

D-301 reste non bloquant : « Attention, les exercices vont s’enchaîner sans pause. » si aucune pause effective de transition ni récupération positive entre deux Exercices. Aucun avertissement de Série ajouté.

Durées et signaux : appliquer la recette Bip v2, notamment les six combinaisons, l’omission et le bip périodique au-delà du nominal. Aucun test applicatif exécuté par ce lot.

