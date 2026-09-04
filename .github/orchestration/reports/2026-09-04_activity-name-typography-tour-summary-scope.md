# Références canoniques — Nom d’activité et synthèse du Tour

Date : 2026-09-04  
Périmètre : Figma, DSF et documentation uniquement. Aucun code applicatif modifié.

## Décisions consolidées

- La valeur saisie dans `Nom de l’activité` utilise le style canonique `KODJO / Screen title`, Inter Semi Bold `20/24`, identique à `Nom de la séance`.
- La synthèse `N activité(s) · X min` sous `Nombre de tours` calcule exclusivement le nombre et la durée déterminable des Activités.
- Le `Compte à rebours initial` et la `Fin de séance` sont des éléments structurels hors Tour : leurs durées sont toujours exclues de cette synthèse.
- La confirmation de l’un de ces deux sélecteurs actualise uniquement sa propre carte.
- Les autres règles de calcul, notamment la durée estimée globale du plan, ne sont pas modifiées.

## Références Figma

- Fichier : `Application Tabata – Wireframes V1` (`G6RY5Ebhgwb4AHIOYDwwvg`).
- Style texte : `KODJO / Screen title` (`S:7c197e8db2eab5a365d730c5c67fef9397121b43`) — `20/24`, Inter Semi Bold.
- Composant DSF : `Composition / Tour Section` (`3067:270`) — description complétée avec le périmètre exact de la synthèse.
- Écran de référence : `Création activité — Durée / Pause / Séries — avec mode` (`1992:9132`).
- Les champs Nom des huit états Activité et du dialogue d’abandon ont été alignés sur le même style canonique.

## Contrôles réalisés

- Recherche documentaire des occurrences `18/22` et `KODJO / Modal title` liées au champ Nom : aucune occurrence active restante.
- Recherche des formulations associant la confirmation du Compte à rebours ou de la Fin de séance à l’actualisation de la synthèse du Tour : contradictions supprimées.
- Vérification visuelle de `1992:9132` après application du style : champ lisible, non tronqué et structure inchangée.
- Les règles globales de durée estimée des chapitres 09 et 10 ont été conservées, car elles décrivent le plan d’Exécution complet et non la synthèse locale du Tour.
