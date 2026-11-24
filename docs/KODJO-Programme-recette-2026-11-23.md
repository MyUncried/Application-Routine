# KODJO — Programme : compléments de la recette du 23/11/2026

**Décisions :** D-561 à D-568, RM-275, RM-276 (classe B : remarques de recette de Hermann du 23/11/2026, reformulées et validées).
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

[Complété le 23/11/2026, contre-recette 2 (constats f / g) — sens inverse, du calendrier vers le Catalogue : depuis le Plan, catalogue des programmes ; depuis l’Agenda, catalogue des séances ; depuis le Journal, aucun changement.]

## 3. Période d'un programme (D-563)

[Remplacé le 23/11/2026 par D-581 (contre-recette 4 ; Hermann : « Pour le calendrier du programme utilisé exactement celui de la planification (format, dimensions). On oublie le marquage des périodes dans le calendrier. ») : le calendrier de la période est celui de Planifier, en popover, sans marquage de la période ; le calendrier natif `UICalendarView` est abandonné. Format de la carte Période : D-582. Texte d’origine conservé ci-dessous.]

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
- **Routine qui déborde (D-566).** Au rattachement d'une routine, ou à sa modification depuis le Journal, si des créneaux à venir tombent hors de la période, un message le signale : « N créneaux sont en dehors de la période du programme. » [Remplacé le 23/11/2026, contre-recette 3 (x9, x10) : titre sans point final, « … de ce programme » au rattachement, « … du programme » dans le Journal ; dans le Journal, remplacé par D-587 : fenêtre unique titrée « Modifier la routine », texte « N créneaux … », sans confirmation à la suite.]
  - **Garder dans le calendrier** [« Les garder dans le calendrier » depuis le 23/11/2026] (par défaut) : la routine n'est pas coupée ; ces créneaux restent hors programme.
  - **Supprimer** [« Les supprimer » depuis le 23/11/2026, arbitrage de Hermann, dans les deux contextes] : les créneaux à venir hors période sont supprimés.
  - **Annuler** : rien n'est enregistré.

  Sans créneau à venir hors période, aucune question. Les créneaux réalisés ne sont jamais touchés.
- **Dates de la routine (D-567).**
  - « Supprimer » ramène la date de fin de la routine à celle du programme. Si la routine commençait avant le programme sans séance réalisée avant son début, sa date de début est aussi ramenée à celle du programme ; sinon elle ne bouge pas.
  - Étendre la date de fin de la routine au-delà du programme crée des occurrences **hors programme** et pose la question ci-dessus.
  - Supprimer des occurrences hors de la période n'a aucun effet sur le programme.
  - Détacher la routine du programme met toutes ses occurrences hors programme.
  - Une occurrence hors de la période n'est **jamais** rattachée au programme.

## 5. Actions glissées (D-565)

- **Modale du programme.** Le glisser d'une routine s'arrête net sur la position de son action, sans rebond. Aller trop loin à gauche ou à droite ne referme ni ne rouvre l'action.
- **Catalogue des programmes.** L'espace entre la carte et ses actions glissées est celui du catalogue des séances.

## 6. Trace d'une occurrence supprimée (D-568, RM-276)

**Avec trace** : une occurrence prévue par la répétition d'une routine, supprimée depuis l'Agenda.
- **Agenda** : la carte reste à son heure prévue, cadre et texte en gris, pastille « Supprimée » (Figma : carte « Dos et mobilité » du mardi 17, écran « P-Calendrier — Semaine — Séances, parcours et hors planification (proposition B — lien fin) »).
- **Rétablir** : glisser la carte propose « Rétablir » tant que la date n'est pas passée.
- **Suivi** : ni manquée ni réalisée ; hors du taux de réalisation.
- **Parcours** : trace par Séance ; si toutes ses Séances sont supprimées, tout le créneau apparaît supprimé.
- **Plan** : pas de trace ; la case est vide et la toucher recrée un créneau. Le Total ne la compte pas. [Remplacé le 23/11/2026 par D-586 : la case reste, avec l’heure en gris sur gris, ne réagit pas au toucher et sort du Total.]

**Sans trace** :
- suppression de la routine depuis le Journal, réduction de sa période, suppression d'un programme avec ses routines, créneaux hors période supprimés (D-566) ;
- créneau ajouté à la main (RM-273) ou créneau unique : il disparaît.

Les séances réalisées restent toujours dans l'historique.
