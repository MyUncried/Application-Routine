# KODJO — Propagation du formulaire Activité

Date : 2026-09-04  
Périmètre : Figma, DSF existant et documentation uniquement. Aucun code applicatif modifié.

## Décisions propagées

- titre fonctionnel `Ajouter une activité` ; variante de modification `Modifier une activité` ;
- bandeau contextuel bleu `402 × 115`, accolé à l’en-tête sans intervalle ;
- contexte `Séance · {nom}` en Inter Regular `14/20` ;
- espacement contexte/champ `spacing/24` ;
- champ Nom de l’Activité `354 × 46`, fond transparent, liseré blanc intérieur `1` ;
- valeur du nom en `KODJO / Modal title`, Inter Semi Bold `18/22` ;
- synthèse en `KODJO / Body`, Inter Regular `14/20`, ancrée à `spacing/24` au-dessus de l’action finale ;
- suppression des préfixes de synthèse relatifs au type et au mode ;
- ajout de `entre les séries` à la clause de pause uniquement lorsque le nombre de Séries est supérieur à `1`.

## Frames Figma mises à jour

| État | Frame |
| --- | --- |
| Exercice — Durée | `1992:9132` |
| Exercice — Répétitions | `1992:9212` |
| Récupération — Durée | `1992:9364` |
| Durée ouverte | `1992:9430` |
| Pause ouverte | `1992:9524` |
| Séries ouvertes | `1992:9618` |
| Répétitions ouvertes | `1992:9709` |
| Récupération — Durée ouverte | `1992:9800` |
| Abandonner les modifications d’une Activité | `3224:4082` |
| Informations complémentaires | `1992:9292` |

Proposition validée : `3245:4120`.

## Références DSF réutilisées

- `KODJO / Modal title` : Inter Semi Bold `18/22` ;
- `KODJO / Body` : Inter Regular `14/20` ;
- `spacing/12`, `spacing/16` et `spacing/24` ;
- hauteur de bandeau `115`, alignée sur la référence active du catalogue `1992:9911`.

## Documentation mise à jour

- `docs/Specifications-fonctionnelles/06 – Ecrans et navigation de la V1.md` ;
- `docs/Specifications-fonctionnelles/07 – Registre des décisions de conception.md` ;
- `docs/Specifications-fonctionnelles/08 – Conception fonctionnelle détaillée.md` ;
- `docs/Specifications-fonctionnelles/12 – Architecture technique.md` ;
- `docs/Specifications-fonctionnelles/13 – Contrats d’écran.md` ;
- dix captures Figma associées aux écrans et états ci-dessus.

## Contrôles effectués

- aucun espace entre la ligne basse de l’en-tête (`y=92`) et le bandeau (`y=92`) ;
- conservation des huit états de formulaire et de leurs roulettes ;
- absence de duplication des roulettes et barres d’actions ;
- ordre Nom, Type, Mode conservé ;
- synthèse placée hors du groupe Paramètres ;
- synthèse et bouton séparés de `24` points ;
- recherche documentaire des anciens préfixes `Exercice · Mode` et `Récupération · Mode` : aucune occurrence active restante.

## Point de mise en œuvre

Le texte de synthèse est calculé depuis les valeurs confirmées. Il ne doit pas être dérivé d’une chaîne Figma statique. Les pluriels et le nom de l’Activité passent par les ressources de traduction centralisées.
