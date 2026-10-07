# DSF — durée des cartes — 07/10/2026

Sources : [prompt cartes](archives/cartes-phrases-v14-2026-10-07/prompt-cartes.md), composants relus dans Figma, spécification Bip pour présence/nature. Ce complément remplace les anciennes dispositions de badge de durée Catalogue, pas les badges des contrôles éditables.

## Composants actifs et portée

| Composant | ID | Propriété |
|---|---|---|
| DSF / Cards / Exercice | 6214:7278 | `Durée#7344:0`, booléen, défauttrue |
| DSF / Cards / Séance | 6214:7276 | `Durée#7344:11`, booléen, défauttrue |

Référence402, carte354. Format vérifié dans les trois variantes Catalogue repliée, archivée, déployée des deux sets. Exercice Déployé reste une référence sans route MVP : la modification d’un composant ne crée pas une navigation. Les variantes de sélection gardent leurs règles d’absence de durée ; Suivi garde sa durée réelle, Calendrier ses informations de planification. Aucun remplacement global de leurs layouts par la carte Catalogue.

## Durée affichée

Texte Inter Semi Bold12, #141414, alignement droite ; aucun fond #F5F7FA, aucun cadre, aucun rayon ni padding8/2 du précédent badge. Bord droit à16px du bord de carte. Le nom de couche « Durée totale — badge » subsiste dans Figma mais ne signifie plus un badge visuel. Le gain de16px profite à la ligne de titre. Durée en lecture seule, aucune cible interactive créée.

À l’Exercice : Durée → valeur exacte ; Répétitions avec bip → ≈valeur ; Répétitions sans bip et À l’échec → aucun contenu dans cet emplacement. Aucun zéro, tiret ni libellé de mode de remplacement. Le libellé « à l’échec » signalé sur la carte Étirement du quadriceps (3786:5093) a été masqué par le propriétaire ; absence vérifiée et capture renouvelée. Le mode reste décrit dans le résumé. À la Séance : exact/≈/≥ selon Bip v2, jamais calculé depuis un chiffre Figma. Le rendu reçoit un champ optionnel ; absence ne signifie pas durée0. La visibilité effective tient aussi compte de la variante de contexte, pas seulement de la valeurpar défauttrue dans Figma.

## Géométrie

| Élément | Référence |
|---|---|
| Exercice Catalogue replié/archivé, gouttière photo | x12,64px |
| Départ du contenu texte | x88 |
| Ligne titre/durée | 250px, bord droit338 |
| Deux lignes basses catégorie/zones et résumé | 207px, réservation du bouton Lecture en bas à droite |
| Coupe zones corporelles | 60/69/145px selon contexte existant ; référence colonne basse207, jamais titre250 ni carte354 |
| Séance | marges gauche/droite16px ; contenu322px |
| Asymétrie Exercice | marge gauche12, droite16, explicitement conservée |

Ne pas déplacer la gouttière ni recalculer les coupes pour rendre la carte symétrique. Repliée354×91 ; média ne change pas la hauteur. Photos réservées aux Exercices, absentes des Séances et listes mixtes ; règles de chargement inchangées. Sur largeur réduite/texte agrandi, préserver les marges et la priorité de durée, adapter/tronquer le titre selon contrat sans chevaucher Lecture ; les250/207 sont les mesures de référence402, pas des largeurs absolues pour tous les écrans.

## Méthode et composants obsolètes

Visibilité variable par instance : utiliser la propriété Durée. L’incident rapporté concerne cinq instances Extension du genou masquées par surcharge locale, dont la restauration complète effaçait aussi titre/catégorie/zones. C’est un incident observé, pas une preuve que toute surcharge Figma est irréversible. Ne pas réinitialiser toutes les surcharges pour changer la seule visibilité d’une donnée.

Composants historiques sans instance selon le prompt :5544:6324 Exercice—catalogue ;5544:6426 Séance—catalogue ;5544:6430 Séance—archivée ;5544:6555 Planification ;5544:6954 Durée totale. Ne pas les prendre comme référence d’implémentation. Leur nettoyage reste séparé ; aucun composant supprimé dans ce lot.

## Recette et preuves

Contrôler catalogue Exercice/Séance replié, archivé et référence déployée ; durée longue et titre long, présence/absence puis retour sans perdre les autres données, modes et bip, marges et texte agrandi. Absence ne laisse aucune pastille vide. Sélecteurs sans durée et Suivi réel conservés. [Matrice des captures courantes](MATRICE-CARTES-PHRASES-2026-10-07.md) :38 écrans contenant des instances des sets actifs réexportés, plus paramètres et résumés. Les montants illustratifs ne sont pas évalués comme une recette de calcul.

La forme compacte « Pause de15s par série » citée dans le prompt est un texte témoin Figma, pas une autorisation de réintroduire une ligne de pause dans les cartes Catalogue/Choix/Composition qui l’excluent. Le libellé métier demeure « Pause après chaque série » ; la phrase complète suit exclusivement les276 cas v14.
