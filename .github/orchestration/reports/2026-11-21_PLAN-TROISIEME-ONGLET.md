# Rapport de mission — PLAN-TROISIEME-ONGLET (21 novembre 2026)

## Identifiant et objectif

- **Mission :** `PLAN-TROISIEME-ONGLET`.
- **Objectif :** concevoir dans Figma l'écran Plan, mettre Figma à jour, puis la documentation. Demande de Hermann : « lorsque Figma est à jour, tu mets à jour la documentation ».
- **Hors périmètre :** aucun code applicatif.

## Branche et commit de départ

- **Branche :** `docs/agenda-seances-journal-filtre-20261121` (PR #448, non fusionnée).
- **Commit de départ :** `fccd9f4a`.

## Périmètre demandé et traité

1. **Conception de l'écran Plan** : itérations Figma avec Hermann.
2. **Rangement Figma** : écran de référence, variante « case vide touchée », exemple d'un mois à cinq semaines. Suppression de l'ancien écran.
3. **Trois onglets** Journal · Agenda · Plan sur tous les écrans du calendrier.
4. **Zone de contexte de l'Agenda** : mois centré sur la rangée des jours, entonnoir symétrique, centré verticalement, contour bleu.
5. **Documentation** : D-554, D-555, RM-273, DSF Plan, compléments ch06, ch09, ch10 et ch13, DSF Agenda, DSF Barre de titre, INDEX, PRODUCT.

## Constats

- **D-541 et D-542, et le DSF Plan du 20/11** : ils n'existent que sur la branche `docs/planification-grille-creneaux`, non fusionnée.
  - La nouvelle documentation les remplace.
  - **À reporter lors de la fusion de cette branche** : annotation « remplacé le 21/11/2026 (D-554) » sur D-541, D-542 et `docs/DSF-PLAN-2026-11-20.md`. Préparé, non appliqué : la fusion n'est pas demandée.
- **Numérotation :**
  - RM-265 à RM-272 sont pris sur d'autres branches. La nouvelle règle prend **RM-273**.
  - D-554 et D-555 sont libres sur toutes les branches.
- **Choix du 20/11 conservés**, retenus par Claude, non promus en règle :
  - routines affichées = celles qui ont un créneau dans la semaine ;
  - ordre alphabétique dans un groupe.
- **Exécutions hors planification** : non affichées dans le Plan, qui montre les planifications. C'est une conséquence du principe de l'écran ; Hermann ne l'a pas arbitrée explicitement.

## Figma

**Écrans créés ou réorganisés :**

| Nœud | Écran |
|---|---|
| `12983:19` | « P-Calendrier — Plan » (référence, x = 6737) |
| `13005:14750` | « … — Mois de cinq semaines » |
| `13005:14584` | « … — Case vide touchée (proposition) » |

**Écrans supprimés** (validation de Hermann) :
- « P-Calendrier — Vue d’ensemble — Routines et jours (proposition) » `12829:24633` ;
- l'ancien exemple de décembre `12934:237`.

**Onglets** Journal · Agenda · Plan : sur les 20 écrans du calendrier qui portent la barre de titre.

**Agenda** (11 écrans) :
- mois décalé de 25,5 ;
- entonnoir centré au-dessus de la flèche de semaine suivante et abaissé de 4,2.

Un premier script avait déplacé l'entonnoir de 10 écrans hors cadre. L'erreur a été corrigée et chaque position vérifiée.

**Composant modifié** : `icon/filtre-routine`, état Inactif (`12794:49374`) : contour bleu. Il est utilisé 14 fois.

**Contrôle** : captures relues après chaque modification. Il s'agit de vérifications de rendu Figma, pas d'une validation sur iPhone.

## Synchronisation code / documentation

- **Classe B** : D-554, D-555 et RM-273, décisions de Hermann du 21/11/2026.
- **Code concerné** par le développement à venir, non modifié ici :
  - deux onglets implémentés (D-542) ;
  - zone de contexte de l'Agenda (D-538, D-539).

## Preuves et tests

- **Aucun test applicable** (mission documentaire et Figma).
- **Contrôles réalisés :**
  - `git diff --check` ;
  - liens Markdown vers `DSF-PLAN-2026-11-21.md` ;
  - absence de collision des identifiants (D et RM) sur toutes les branches distantes.

## Hypothèses non démontrées

- La lisibilité des heures en 9 et des noms en 10 n'a pas été vérifiée sur iPhone.

## Éléments non corrigés ou hors périmètre

- Report sur `docs/planification-grille-creneaux` (voir Constats).
- Glisser-déposer d'un créneau : non prévu.

## Vérifications restant à effectuer sur appareil réel

- Lisibilité de la grille (heures en 9, noms en 10, traits de 0,5).
- Précision du toucher sur des cases de 34 × 20.

## Fichiers modifiés

- **Créés :**
  - `docs/DSF-PLAN-2026-11-21.md` ;
  - ce rapport.
- **Modifiés :**
  - `docs/DSF-AGENDA-PLANNING-2026-11-19.md` ;
  - `docs/DSF-BARRE-TITRE-ONGLETS-2026-11-19.md` ;
  - `docs/INDEX.md` ;
  - `docs/PRODUCT.md` ;
  - chapitres 06, 07, 09, 10 et 13.

## Commit final et état Git

Donnés dans le compte rendu de livraison.
