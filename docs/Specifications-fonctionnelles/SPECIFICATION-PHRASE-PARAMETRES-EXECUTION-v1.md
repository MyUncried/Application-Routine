# Phrase des paramètres d’exécution — spécification rédactionnelle v1

Actualisée le07/10/2026 selon la clarification explicite du propriétaire et le classeur v15. La version du document reste indépendante de celle du classeur. Q-08 est clos ; les formulations antérieures « + … de pause chacune », « suivie de » et la proposition « pause entre les séries » sont remplacées.

## 1. Sources et responsabilité

Les [276 cas v15](../archives/evolutions-v15-2026-10-07/phrases-276.json), extraits des cellules I4:I279 du [classeur original](../archives/evolutions-v15-2026-10-07/generateur-phrase-activite_v15.xlsx), fixent les formulations. Leur total numérique est un exemple injecté, jamais un oracle métier. Le générateur reçoit le résultat calculé par [Bip v2](SPECIFICATION-BIP-CADENCE-v2.md) et [Paramètres v13](SPECIFICATION-PARAMETRES-MODALE-v13.md). Ne pas exécuter les formules Excel pour calculer l’application. Figma définit le layout ; ses chiffres n’amendent aucune règle.

Entrées : mode, N, uniforme/variable, cibles et pauses ordonnées, bip commun, direction et ordre des côtés, PC ; résultat intrinsèque exact/estimated/omitted. Le contexte de récupération de Séance ne réécrit pas cette description intrinsèque.

La comparaison v14→v15 ne change aucun gabarit : seuls36montants d’exemple diffèrent. Le corpus courant contient140phrases sans total,46avec≈ et90avec total exact ; aucun≥. Les tests métier de durée restent indépendants de la colonneJ et de la feuille Calcul des durées. [Preuve de comparaison](../archives/evolutions-v15-2026-10-07/comparaison-v14-v15.json).

## 2. Contrat de génération et persistance

Fonction pure : mêmes paramètres, même locale et même résultat métier donnent les mêmes segments. Retour **`Array<{texte: string, gras: boolean}>`**, jamais une chaîne à redécouper par recherche de valeurs. Le choix du gras appartient au gabarit à l’émission des segments ; deux valeurs identiques restent deux occurrences distinctes. La concaténation des `texte` restitue la phrase exacte. Valeurs et unités paramétrées en gras, texte grammatical normal.

Exemple de début : `[{texte:"3",gras:true},{texte:" séries de ",gras:false},{texte:"30 s",gras:true}]`. React Native rend les segments directement en `<Text>` imbriqués dans un `<Text>` parent. Aucun balisage Markdown à analyser au rendu, aucune recherche/remplacement de sous-chaînes pour le gras.

**Aucune phrase ni aucun segment n’est stocké en base**, dans la définition, l’occurrence ou l’instantané. Seuls les paramètres métier sont persistés ; la phrase se régénère **à chaque affichage**, notamment après validation ✓. ✕ annule le brouillon ; ✓ applique atomiquement au parent ; Terminer persiste ses paramètres. Le retour sur une séance existante utilise la grammaire courante, pas une phrase figée avant correction. Les paramètres et durées réelles historiques restent immuables.

Pendant un brouillon incomplet, aucune cible inventée : conserver les règles de champs manquants/validation et interdire✓. Compte à rebours et Fin sont des lignes séparées, exclus du texte et du total intrinsèque.

## 3. Grammaire française v15

Ordre : nombre de séries → contenu → pause → côtés → durée applicable. Ponctuation et accords conformes aux276 cas ; série/séries, menée/menées. Les espaces et unités font partie du texte. Mode affiché à part, absent du début de phrase.

| Cas | Forme |
|---|---|
| Durée uniforme | `{N} séries de {durée}` |
| Durée variable, jusqu’à3 | `{N} séries de durée variable ({d1}, {d2} puis {d3})` ; à2, séparer par « puis » |
| Durée variable, plus de3 | `{N} séries variables, de {min} à {max}` |
| Répétitions uniformes | `{N} séries de {R} répétitions` |
| Répétitions variables, jusqu’à3 | `{N} séries de {r1}, {r2} puis {r3} répétitions` |
| Répétitions variables, plus de3 | `{N} séries variables, de {min} à {max} répétitions` |
| Bip positif en Répétitions | Accoler `cadencées toutes les {bip}` aux répétitions |
| À l’échec | `1 série menée jusqu’à l’échec` / `{N} séries menées jusqu’à l’échec` |
| Uniforme, pause positive, N≥1 | `, avec {pause} de pause après chaque série` |
| Uniforme, pause nulle, N>1 | `, enchaînées sans pause` |
| Uniforme, pause nulle, N=1 | Aucune clause de pause |
| Séries variables, tous modes | Clause de pause omise conformément aux276 cas, même À l’échec ; aucune liste de pauses ajoutée |

N=1 est normalisé uniforme avant génération. Les min/max viennent des cibles actives, pas de la première et dernière ligne. Aucune ellipse après les trois premières valeurs. L’omission rédactionnelle des pauses variables ne les retire jamais du plan ni du calcul. La grammaire du classeur dit « la pause figure dans l’énumération », mais ses276 phrases variables n’énumèrent pas les pauses : conserver exactement leurs formulations, sans inventer cette énumération.

En Durée et À l’échec, le bip n’ajoute aucune clause. En Répétitions, le suffixe cadencé n’existe que pour b>0. Le texte n’explique pas les règles audio.

## 4. Côtés et durée

Sans changement : aucune clause. N=1 bilatéral : « en faisant le côté droit puis le gauche ». N>1 par paire : « en alternant le côté droit puis le gauche à chaque série ». N>1 par côté : « en faisant d’abord toutes les séries à droite, puis à gauche ». Inverser les directions pour un départ gauche. PC>0 ajoute « , avec {PC} de pause au changement de côté » ; PC=0 omet le suffixe. Les modèles exacts de ponctuation sont ceux des276 cas.

Après le point final, afficher « Durée totale : {total}. » sans symbole en Durée ; « Durée totale : ≈ {total}. » en Répétitions avec bip. Omettre intégralement en Répétitions sans bip et À l’échec. Aucun≥, zéro ni tiret de remplacement. **Redondance : omettre le total seulement pour une Série Durée sans côté ET sans pause.** Avec une pause positive, même une seule Série possède son total affiché. Cette exception rédactionnelle ne masque pas la durée de la carte Catalogue.

La pause après chaque série, dernière comprise, fait partie du calcul intrinsèque. Une récupération positive qui suit l’Exercice remplace seulement la dernière pause dans le plan de Séance ; la phrase intrinsèque demeure descriptive des paramètres de l’Exercice.

## 5. Rendu et accessibilité

Zone cliquable unique, segments non interactifs. Inter13 Regular, interligne20 ; valeurs Semi Bold dans le texte courant. Référence402 : x39, largeur324 ; hauteur intrinsèque, retour naturel, aucun plafond de caractères. Le titre et les lignes Compte à rebours/Fin gardent leur hiérarchie. Zone entière → CE-UI-10, focus unique « Modifier les paramètres d’exécution ». Texte complet accessible et agrandissable ; retour de ligne de présentation avant Durée totale sans changement de grammaire.

La référence7119:27855 est désormais « Phrase longue (224 caractères) », cas144 du corpusv15 : largeur324px, cinq lignes de20px, bloc100px, carte de paramètres193px à hauteur automatique. Ces mesures constatées ne deviennent pas des hauteurs fixes : agrandissement de texte et autres largeurs doivent étendre le contenu sans rogner Compte à rebours/Fin.

Une virgule reste attachée au mot qui la précède : aucune virgule isolée en début de ligne. Les segments sont rendus dans un même flux Text, sans espace ajouté avant la ponctuation ni segments disposés chacun comme une boîte indépendante. Le retour visuel avant Durée totale est une propriété de rendu, pas une modification du texte canonique utilisé par la recette.

## 6. Internationalisation — décision et dette explicites

Le générateur livré pour le MVP est **francophone uniquement**. Les segments de rendu ne sont pas des fragments à traduire isolément : ordre des groupes, accords de nombre et de genre, ponctuation et placement des unités dépendent de la langue. Une future version multilingue nécessite des gabarits par locale avec règles de pluriel/genre (par exemple un système de messages à règles), puis génération de segments depuis ces gabarits. Prévoir une réécriture de la grammaire française concaténée et des tests par langue ; ne pas chiffrer cette évolution comme une simple traduction de libellés. Aucun moteur i18n supplémentaire imposé au MVP monolingue.

## 7. Recette de développement

276 cas de référence conservés sans altération ; injecter le total métier de test à la place du montant d’exemple avant comparaison. Vérifier texte/ponctuation exacts et absence de clause ajoutée aux cas variables. Vérifier singulier, côtés inversés, deux/trois/plus de trois cibles, min=max, bip0/positif dans trois modes, pause0/positive, N1 avec/sans pause et PC0/positive. Les cas complémentaires ne remplacent pas le corpus.

Contrôler les segments et le gras, notamment deux valeurs identiques à des positions différentes ; concaténation égale au texte attendu. Relire un objet ancien après modification de grammaire : nouvelle phrase, aucune migration de chaîne. Vérifier absence de champ persistant phrase/segments et génération au rendu, annulation/validation, accès clavier/lecteur d’écran et absence de troncature à360/402/440 avec texte agrandi. Il s’agit de recette prescrite, pas d’une implémentation ou de tests applicatifs exécutés dans ce lot documentaire.
