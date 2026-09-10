# Ordre canonique des contrôles de création d’activité

Date : 2026-09-04  
Périmètre : Figma et documentation uniquement. Aucun code applicatif modifié.

## Décision validée

Dans les écrans Exercice, l’ordre canonique est :

1. `Nom de l’activité` ;
2. `Type d’activité` avec `Exercice / Récupération` ;
3. `Mode d’exécution` avec `Durée / Répétition` ;
4. `Paramètres de l’activité`.

Le titre historique `Ajouter une activité` associé au contrôle de type est remplacé par `Type d’activité`. Le titre `Nom` est remplacé par `Nom de l’activité`. Les trois titres de contrôle utilisent le même niveau typographique existant : Inter Semi Bold, `16 pt`.

Pour une Récupération, le mode Durée reste imposé et son contrôle demeure masqué. L’ordre visible est donc `Nom de l’activité → Type d’activité → Paramètres de l’activité`.

## Frames Figma mises à jour

- `1992:9132` — Durée / Pause / Séries — avec mode ;
- `1992:9212` — Répétitions / Pause / Séries — avec mode ;
- `1992:9364` — Récupération / Durée ;
- `1992:9430` — Durée — sélecteur ouvert ;
- `1992:9524` — Pause — sélecteur ouvert ;
- `1992:9618` — Séries — pop-up ouvert ;
- `1992:9709` — Répétitions — pop-up ouvert ;
- `1992:9800` — Récupération — Durée — sélecteur ouvert.

La proposition temporaire `3140:4010` a été supprimée après propagation. La frame `1992:9292` — Informations complémentaires — n’est pas concernée.

## Documentation mise à jour

- chapitre 06 : ordre fonctionnel et libellés visibles ;
- chapitre 12 : traçabilité de la rangée de paramètres dans son écran parent ;
- chapitre 13 : contrat d’écran, huit frames sources et tests bloquants ;
- huit captures Figma correspondant aux huit états ci-dessus.

## Vérifications

- ordre structurel relu sur les huit frames ;
- titres `Nom de l’activité` et `Type d’activité` présents sur les huit frames ;
- `Mode d’exécution` conservé sans modification fonctionnelle ;
- contrôles, valeurs, sélecteurs ouverts et actions finales inchangés ;
- aucun écran Informations complémentaires modifié ;
- aucun fichier de code applicatif inclus dans le livrable.

## Point distinct observé

La frame `1992:9800` présente encore plusieurs barres d’actions/cadres superposés dans la roulette ouverte. Cette anomalie existait indépendamment du réordonnancement et n’a pas été corrigée dans cette mission ciblée.
