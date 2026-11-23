# KODJO — Programme : compléments de la recette du 23/11/2026

**Décisions :** D-561 à D-566, RM-275 (classe B : remarques de recette de Hermann du 23/11/2026, reformulées et validées).
**Complète :** [KODJO — Programme : catalogue, création et configuration](KODJO-Programme-catalogue-creation-configuration-2026-11-20.md) (sur `main`, D-543 à D-552), le [DSF Plan](DSF-PLAN-2026-11-21.md) et le [DSF Bouton flottant](DSF-BOUTON-FLOTTANT-2026-11-22.md).

## 1. Programme dans le Plan (D-561)

- Un programme dont la période recouvre la semaine affichée a sa bande « Programme · Nom » dans le Plan, même sans créneau cette semaine-là.
- La bande est seule : les routines du programme sans créneau dans la semaine ne sont pas listées.
- « + Routine » sur cette bande planifie une routine du programme. Il remplace, pour ce cas, la création depuis le Journal (D-559).

## 2. Arrivée dans le calendrier (D-562)

| Écran de départ | Onglet ouvert |
|---|---|
| Catalogue des programmes | Plan |
| Catalogue des séances | Agenda |
| Catalogue des mouvements | Agenda |
| Autre onglet | Dernier onglet utilisé du calendrier |

## 3. Période d'un programme (D-563)

Dans la modale du programme, toucher « Du » ou « au » ouvre **un seul calendrier pour les deux dates**. C'est le calendrier natif d'iOS (`UICalendarView`), sans réimplémentation.

1. **Début.** Un appui sélectionne une date de début ; un second appui sur la même date la confirme. Avant confirmation, un appui sur une autre date déplace la sélection.
2. **Fin.** Une fois le début confirmé, l'appui suivant sélectionne la date de fin. Un second appui sur la même date la confirme et ferme le calendrier.
3. **Sortie sans confirmer la fin.** La date de fin sélectionnée est conservée.
4. **Appui avant le début.** Une fois le début confirmé, un appui sur une date antérieure recommence la sélection du début.
5. **Période.** Chaque jour de la période porte un repère sous son numéro (décoration native). iOS ne permet pas de colorer le fond des jours : pas de bandeau continu.
6. **Modifier seulement la fin.** Toucher « au » ouvre le calendrier avec le début déjà confirmé.

## 4. Occurrences d'une routine et période du programme (D-564, RM-275)

- Seules les occurrences d'une routine comprises dans la période de son programme appartiennent au programme. Les autres restent à la routine, sans programme.
- Dans le Plan, une même routine figure sous la bande du programme pendant la période, et sous « Sans programme » en dehors.
- « Supprimer avec ses routines » (D-547) ne supprime que les créneaux à venir compris dans la période du programme.
- **Limite :** une routine appartient à un seul programme à la fois. Pour enchaîner deux programmes sur la même routine, on la duplique.
- **Routine qui déborde (D-566).** Au rattachement d'une routine, ou à sa modification depuis le Journal, si des créneaux à venir tombent hors de la période, un message le signale : « N créneaux sont en dehors de la période du programme. »
  - **Garder dans le calendrier** (par défaut) : la routine n'est pas coupée ; ces créneaux restent hors programme.
  - **Supprimer** : les créneaux à venir hors période sont supprimés.
  - **Annuler** : rien n'est enregistré.

  Sans créneau à venir hors période, aucune question. Les créneaux réalisés ne sont jamais touchés.

## 5. Actions glissées (D-565)

- **Modale du programme.** Le glisser d'une routine s'arrête net sur la position de son action, sans rebond. Aller trop loin à gauche ou à droite ne referme ni ne rouvre l'action.
- **Catalogue des programmes.** L'espace entre la carte et ses actions glissées est celui du catalogue des séances.
