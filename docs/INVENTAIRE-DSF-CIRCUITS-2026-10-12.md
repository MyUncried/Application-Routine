# Inventaire préalable — DSF et captures des circuits — 12/10/2026

Base documentaire : PR #350, commit `079cc57ab14efd48d8d6cd835338da04ddd3cde8`, dépendant de #349. Relevé effectué avant les modifications documentaires de ce lot. Source Figma : `G6RY5Ebhgwb4AHIOYDwwvg`, pages Prototype MVP `510:101`, Fondations `2291:2`, Conception — Hors MVP `6464:10219`.

Périmètre : Composition et création d’exercice / Modalités d’exécution, dans le prolongement de la spécification Circuits du 12/10. Ce relevé n’est pas un audit de toutes les pages du produit. Les noms de calques « activité » sont rapportés comme provenance, sans réintroduire ce terme dans le vocabulaire produit. Aucun chiffre de démonstration Figma ne constitue une règle de calcul.

| ID | Écart constaté avant modification | Traitement prévu |
|---|---|---|
| E01 | Les captures Composition et création renvoient aux anciens IDs 2028/6407/6665… ; les écrans courants portent 8328 | Réexporter les 54 frames externes identifiées ; remplacer les références de ces parcours dans le chapitre 06 ; conserver les fichiers historiques sans les présenter comme preuves actuelles |
| E02 | Quatre nouveaux états Circuit absents de la galerie | Ajouter nature `8328:34662`, confirmation `8328:34813`, volumes séries `8328:34965`, volumes tours `8328:35135` ; rattacher CE-CIR-01/02/03 |
| E03 | DSF variable décrit deux steppers permanents par ligne et interrupteur de régime | Décrire cellules, sélection, pied de réglage commun et popover identiques/variables ; référencer les composants `8129:31593` et `8129:31601` |
| E04 | Compteur et nature confondus dans l’ancien composant Stepper / Tour | Documenter la pastille sur le mot seulement, chiffre distinct, commandes numériques révélées au toucher ; distinguer assemblage écran et composant maître ancien |
| E05 | Icône œil et nouvelle action de retrait non référencées dans le DSF documentaire | Référencer `8165:13756` et `8129:31604` ; ne pas confondre existence des maîtres et utilisation réelle dans toutes les instances |
| E06 | Nouvel état hérité non représenté par une frame identifiée ni une variante Valeur modifiable | Prescrire visible / valeur réelle / non modifiable / raison discrète ; conserver la dette visuelle et ne pas inventer l’emplacement de la mention |
| E07 | Volumes tours : S3 de l’exercice à deux séries est vide ; indicateurs de côté absents des deux grilles | Tracer l’écart Figma : tiret et direction requis par CE-CIR-03 ; ne pas retoucher les PNG |
| E08 | Grilles existantes ne prouvent pas échec ✓, longue liste, colonnes défilantes/fixes ni texte agrandi | Distinguer prescriptions fonctionnelles et couverture visuelle limitée aux deux exemples ; ne pas prétendre une recette responsive |
| E09 | Page modèles et Tabata présentes seulement dans Conception — Hors MVP | Conserver leur classement ; aucune promotion en cible MVP ni validation d’un nouveau design par cet inventaire |
| E10 | Anciennes descriptions / contrats et mentions « DSF et captures différés » restent actives | Mettre à jour descriptions remplacées, contrats, index et matrice de clôture ; limiter la clôture aux preuves réellement disponibles |

Les frames internes « Modale — Paramètres d’exécution », « Voile modal » et « Fond — Groupe Paramètres » ne sont pas des écrans supplémentaires. Les confirmations, popovers et bulles sont documentés comme états du parcours parent. Les anciens états spécialisés sans équivalent actuel identifié (douze séries, erreur de validation, résumés spécialisés) ne sont pas certifiés par les nouveaux exports.


## Mise à jour Composition — 28/10/2026

[Inventaire courant, règles et réserves](KODJO-Composition-conteneurs-2026-10-28.md). Les en-têtes du 28/10 remplacent le stepper permanent, l’unité interactive, le masquage de durée et le circuit unique des relevés historiques. Le tableau des dix nodes vérifiés est la référence de ce lot. Aucun écran d’extension par la borne ne fait partie du parcours courant.
