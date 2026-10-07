# Évolutions du 07/10 — consolidation et lecture de la source v15

Complément à Bip v2, Paramètres v13, Phrase v1 et Pauses. [Matrice des21points](../MATRICE-EVOLUTIONS-V15-2026-10-07.md). La versionv15 désigne le classeur rédactionnel, pas une nouvelle règle générale de calcul.

## Hiérarchie et corrections de la source

Les décisions explicites du propriétaire et les spécifications déterminent le métier ; Excel détermine uniquement les formulations ; Figma définit le layout. Le document reçu est archivé sans altération, puis rapproché du main72d1bf4 qui lui est postérieur. Les sections déjà intégrées ne sont pas de nouvelles décisions.

| Passage reçu | Lecture normative |
|---|---|
| §6.3, exemple300s | **330s** :3×90+3×15−15+30. Seule la dernière pause est substituée ; les deux pauses internes subsistent. R=0 ne supprime pasPN. |
| §6.3, jamais deux repos consécutifs | Porte sur la substitution récupération/Pause terminale ; n’interdit pas PN puis PC à la frontière des côtés. |
| §6.1, pauseSeconds remplacé par les pauses de Séance | Faux pour la Pause de Série : conserver Pi dans SeriesParameters ; Pause de Composition est une autre collection. |
| §6.5, ligne supprimée à0 | Aucune information récupération ; sans point aucune information de pause. **Trait conservé hors placement, masqué pendant le choix**, selon l’arbitrage explicite D-303. Pas de nouvelle décision graphique implicite. |
| §4.1, c’est l’utilisateur qui termine | En Répétitions/À l’échec ; le minuteur du mode Durée conserve sa fin automatique. Le bip ne déclenche aucune transition. |
| §8.1, générée à validation | À chaque affichage depuis les paramètres validés ; segments`{texte,gras}`, aucun stockage de phrase. |
| §8.3, la pause figure dans l’énumération variable | Les276phrases ne l’énumèrent pas : omission rédactionnelle, aucun retrait des pauses du calcul. |
| §8.4/annexeB, tester les durées depuis Excel | Refusé selon instruction explicite du propriétaire : injecter le total métier dans les gabarits ; tester le calcul depuis les spécifications. |
| §15.4, interdire toute écriture n−1 | Interdire n−1 pour le total intrinsèque. L’écriture de n−1 pauses internes plus un repos terminal est mathématiquement valide en contexte de récupération. |
| §15.10, tester sur la présence en base | Séparer les assertions : objet recovery0 conservé ; information masquée ; trait conforme àD-303. |

## CF1 à CF4 : statut sans nouveau design

| Point reçu | Décision existante / état |
|---|---|
| CF1 — N1 et ordre des côtés | Clos dans Paramètres v13/Bip v2 : N1 normalisé Un côté après l’autre ;2(d+p)+PC. Avec90/15/10 :220s. L’ordre masqué ne reste pas une variante calculable205s. |
| CF2 — libellé à l’échec | Clos : emplacement exclusivement temporel, absent en À l’échec et Répétitions sans bip. Le propriétaire a déjà masqué le libellé dans3786:5093 ; clôture du précédent lot. |
| CF3 — D→G compact | Déjà défini par RM-151/RM-152 : indicateur directionnel de Composition conservé, absent en unilatéral. La grammaire longuev15 ne le remplace pas. Pas d’extension aux autres cartes. |
| CF4 — séances anciennes | Aucune reprise fonctionnelle des séances anciennes dans ce lot de conception. Avant une migration applicative, vérifier le parc de données réellement présent et son traitement ; aucune migration destructrice autorisée par cette livraison documentaire. |

## Calculs conservés

Unilatéral :Σ(Ti+Pi). Par côté :2Σ(Ti+Pi)+PC. Par paire,N≥2 :2ΣTi+ΣPi+N×PC. N1 normalisé par côté. Rpositive en occurrence :To=T−PN+R ; sinonTo=T. Bip estime seulement le travail Répétitions ; pauses comptées selon le même plan. Aucun changement de ces formules n’est nécessaire par rapport au main72d1bf4.

Les montants dessinés ne sont pas des tests ni une justification métier. Les concordances présentées au §11 de la source ne changent pas cette hiérarchie. Les phrases compactes de carte n’héritent pas des cinq groupes de la phrase complète.

## Dépendances de développement à transmettre

F-0 est cette consolidation documentaire. La représentation des Séries effectives et des pauses de Composition précède leur persistance/snapshot, puis calculs/moteur et générateur. Le prochain numéro de migration observé est009 sur72d1bf4 ; le développement doit le revalider contre sa propre tête. Cette vérification ne vaut pas implémentation d’une migration. Les travaux de layout du brief jumeau restent séparés ; celui-ci n’est pas une pièce nouvelle de cette livraison.

F-2 àF-6 réutilisent les spécifications Bip/Paramètres/Phrase/Pauses ; F-7 utilise la propriété booléenne Durée des cartes, F-8 les icônes contour/plein. La qualification iOS/Android du bip en arrière-plan, verrouillage et interruption reste à effectuer sur appareil. Aucun résultat Jest/e2e/appareil n’est revendiqué par un lot documentaire.
