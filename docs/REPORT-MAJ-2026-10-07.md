# Propagation documentaire — 07/10/2026

## Périmètre

Reprise de la PR brouillon #323, tête vérifiée e2f236381d8c9d2e762033f3161e98d7e25922f9. Mise à jour des chapitres, spécifications Cadence/Paramètres/Phrase, DSF, registre et contrats ; sources de Claude archivées sans altération. Les décisions explicites prévalent, Figma gouverne le layout et Excel seulement les formulations. Aucun code applicatif modifié.

## Changements

- Cadence sonore, progression, reprise/reset et sécurité conservés.
- Durée sans symbole, Répétitions avec cadence ≈, sans cadence ≥ ; total intrinsèque À l’échec omis.
- Placement unifié des pauses, durée immédiate, confirmation multiple, annulation et retrait ; aucune récupération créée automatiquement.
- Informations absentes à récupération nulle et sans point ; trait conservé hors placement et absent pendant le choix.
- États d’icônes, chronomètres, tokens par rôle, phrase unique et composants existants explicités dans le DSF.
- Les trois nouveaux états de Composition sont illustrés au chapitre 06 et décrits par CE-T03-08. Ancien 4893:6675 historique uniquement.

## Contrôles réellement exécutés

30 contrats, chacun avec ses 21 rubriques non vides ; liens locaux contrôlés contre le workspace et l’arbre Git de départ ; images décodées par Pillow ; comparaison des blobs au parent ; périmètre limité à docs/. Les captures de placement, durée et retrait ont été inspectées visuellement. La présence des rubriques ne constitue pas une certification fonctionnelle exhaustive.

[Preuves structurées](VERIFICATION-DOCUMENTAIRE-2026-10-07.json) ; [inventaire des 140 références et statut de chaque capture](MATRICE-FIGMA-2026-10-07.md).

## Limites explicites

127 captures actualisées. Quota Figma atteint : 12 anciennes captures conservées et signalées, 1 nouvelle planche sans PNG mais avec lien Figma. Les téléchargements HTML déguisés en PNG ont été rejetés.

Q-07 : le symbole ≥ est acté, mais l’estimation antérieure 2s/répétition ne constitue pas un minimum garanti. Aucune nouvelle formule n’est imposée. Une proposition de minorant fondé sur les phases certaines est séparée des règles validées ; arbitrage requis avant implémentation de ce montant.

D-307 explicite une conséquence de conception : le défaut Profil de récupération est proposé à l’ajout explicite, au lieu de l’insertion de l’occurrence. Ce statut dérivé n’est pas présenté comme une citation du propriétaire.

Les écarts Figma (trait à zéro, « circuits » au lieu de « tours » sur deux nouveaux états, emplacement terminal de Point d’arrêt) sont consignés dans la matrice. Aucune retouche d’image ne les masque. V-04 sur le réglage global de phases propres et la dette de composants/assets restent visibles.

Aucune fusion main, aucun pull local, aucun test applicatif ni nouvelle revue externe exécuté dans ce lot.
