# Rapport de mission — MARQUE-HORS-ROUTINE (22 novembre 2026)

## Identifiant et objectif

- **Mission :** `MARQUE-HORS-ROUTINE`.
- **Objectif :** remplacer le libellé « Hors planification » de l'Agenda par un astérisque sur l'heure, marque commune avec les créneaux ajoutés du Plan. Demande de Hermann du 22/11/2026 : « les deux concepts se rejoignent, une séance exécutée ou à exécuter hors routine ».
- **Hors périmètre :** code applicatif.

## Branche et commit de départ

- **Branche :** `docs/agenda-seances-journal-filtre-20261121` (PR #448, non fusionnée).
- **Commit de départ :** `99816d48`.

## Périmètre traité

1. **Figma :**
   - carte Gainage de l'Agenda : « 17h05* », spécialité « Kiné » au lieu de « Hors planification ». Écrans « … (proposition B — lien fin) » `12906:47` et « … (proposition) » `12890:19` (variante non retenue, alignée) ;
   - Plan `12983:19` : exemple « 18h30* » sur la case du samedi 21 de « Dos et mobilité ».
2. **Documentation :** D-560 (ch07), spécification du 21/11 § 4, DSF Plan § 8, DSF Agenda.

## Constats

- Le Plan marquait déjà les créneaux ajoutés d'un astérisque dans l'application (observation de Hermann). Ce rendu n'était écrit nulle part ; il est désormais documenté (D-560).
- **Retenus par Claude :** le créneau unique créé depuis l'Agenda (D-559) n'est pas marqué, car il constitue toute sa routine ; l'annonce vocale distingue les deux cas.
- Identifiant D-560 vérifié libre sur toutes les branches distantes.

## Synchronisation code / documentation

- **Classe B** : D-560.
- **Code concerné** par un développement à venir, non modifié : libellé « Hors planification » de la carte d'Agenda ; astérisque sur l'heure des Exécutions hors planification et des créneaux ajoutés dans l'Agenda.

## Preuves et tests

- Aucun test applicable (mission documentaire et Figma).
- Captures Figma relues après modification ; `git diff --check`.

## Hypothèses non démontrées

- La lisibilité de « 18h30* » dans une case de 34 de large n'a pas été vérifiée sur iPhone.

## Vérifications restant à effectuer sur appareil réel

- Lisibilité de l'astérisque dans les cases du Plan et sur l'heure de l'Agenda.

## Fichiers modifiés

- `docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md`
- `docs/KODJO-Agenda-seances-journal-filtre-2026-11-21.md`
- `docs/DSF-PLAN-2026-11-21.md`
- `docs/DSF-AGENDA-PLANNING-2026-11-19.md`
- ce rapport.

## Commit final et état Git

Donnés dans le compte rendu de livraison.

## Complément du 23/11/2026

- **Constat :** le code de `feat/plan-20261121` affiche déjà les Exécutions hors planification dans le Plan, sous « Sans programme », avec un petit astérisque (recette de Hermann du 22/11/2026, constat a). Cette règle n'était pas écrite ; le DSF Plan disait l'inverse. Le créneau ajouté (RM-273), lui, n'est pas encore marqué.
- **Correction :** D-560 couvre les deux cas dans les deux écrans ; astérisque plus petit que l'heure, comme dans le code (« petite astérisque ») ; DSF Plan § 3 annoté ; Figma ajusté (11 pour 15 dans l'Agenda, 7 pour 9 dans le Plan).
- Prompt de développement rédigé pour `feat/plan-20261121`.
