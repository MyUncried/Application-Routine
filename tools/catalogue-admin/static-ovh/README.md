> **Statut au 11/11/2026 (W1) : variante historique, conservée sans évolution.** Responsabilités :
> - **administration locale Node** (`tools/catalogue-admin/server.mjs`) = édition directe du format catalogue **v2** (`catalogue/catalogues/*.catalogue.json`) avec le validateur de l'application, et connexion Wi-Fi du téléphone ;
> - **cette page statique OVH** = ancien éditeur de brouillons `KODJO_ADMIN_DRAFTS` (v0), **non déployée par nous** ; la page en ligne n'est pas modifiée. Ses brouillons ont été intégrés une fois dans le catalogue par la conversion CA-2 (`tools/catalogue/convertPilotCorpus.ts`) ; le format v2 ne repasse plus par ces brouillons.

# KODJO — Administration statique OVH avec médias (7 novembre 2026)

## Rôle et statut

Cette version **autonome** de l'administration Web est destinée à l'hébergement OVH gratuit de 100 Mo. Elle est distincte du serveur Node.js local dans `tools/catalogue-admin/server.mjs`. Elle s'exécute **entièrement dans le navigateur**, sans API d'écriture ni SQLite.

Cette variante prépare la classification et la documentation de médias **facultatifs** : photo locale compressée, photo via lien HTTPS ou vidéo externe via lien HTTPS. **Aucun fichier vidéo n'est hébergé sur OVH**. Aucun média de tiers n'est fourni par défaut, et aucun contenu n'est déclaré autorisé à la publication par simple saisie dans le formulaire.

### Diffusion et confidentialité

- Ce `index.html` ne contient que **trois mouvements de démonstration**. Les **60 fiches non validées** ne doivent pas être déposées sur l'hébergement public : elles sont importées séparément depuis l'appareil de l'administrateur.
- Les photos locales sont optimisées par le navigateur puis intégrées sous forme `data:image/...` dans le **JSON exporté localement**. Le serveur OVH ne reçoit aucune image téléchargée par le formulaire.
- Les vidéos utilisent des **liens HTTPS**, ouverts sur le site source ; les droits et les conditions de redistribution doivent être vérifiés avant toute publication des contenus.
- L'administration ne propose **aucune sauvegarde automatique partagée** : exporter les brouillons JSON après modification, puis réimporter pour reprendre le travail sur un autre appareil. Ne pas publier ce JSON sur l'hébergement.
- Le statut des droits est **déclaratif**, sans vérification automatique. Les médias manquants restent facultatifs pour un Mouvement.
- `noindex` **ne constitue pas un mécanisme d'authentification**. La page HTML est publiquement accessible. Le navigateur doit utiliser HTTPS avant de saisir des données sensibles ; éviter les contenus privés, cliniques identifiables ou sous licence non vérifiée.
- Le modèle d'exécution KODJO, les instantanés, les séances, les migrations SQLite et Figma ne sont pas modifiés.

## Installation OVH (aucun serveur Node.js requis)

La livraison contient uniquement `kodjo-admin/index.html`. Dans FileZilla, via **SFTP** :

1. Ouvrir le dossier distant `/home/ankushu/www/kodjo-admin`.
2. Remplacer **uniquement** `index.html` par celui de cette version.
3. Consulter `https://ankusha.fr/kodjo-admin/` lorsque le certificat HTTPS du domaine est actif. Recharger la page si l'ancienne version reste en cache.
4. Vérifier, sur un mouvement de démonstration, l'encadré **Photos et vidéos — facultatif** ; son compteur initial est **0 média**.
5. Télécharger le JSON des 60 fiches sur son appareil, puis cliquer sur **Importer un catalogue JSON** dans la page. Ne pas transférer ce fichier JSON sur OVH.

L'hébergement reste limité à un seul fichier HTML et ne nécessite ni offre payante, ni base SQL.

## Contrôles / recette

La version du 7 novembre 2026 a été testée localement dans Chromium (Playwright) sur les parcours :
- photo locale JPEG/PNG, compression, prévisualisation et export JSON ;
- photo par URL HTTPS et lien vidéo HTTPS ;
- informations de source, attribution, licence, statut des droits ;
- ordre des médias, suppression / édition ;
- rejet d'une URL `javascript:` et d'un import malformé ;
- export puis réimport des brouillons, import des **60 candidats** ;
- contrôle de l'affichage de la zone médias en bureau et en affichage mobile.

**Limites de preuve :** contrôle local en navigateur, **aucune recette sur le site OVH ou sur Safari**, aucun audit de licence/média tiers. La présence du ZIP ne vaut pas confirmation du transfert distant. Une recette visuelle sur l'hébergement et un essai réel de photo restent nécessaires après remplacement.

## Traçabilité

La maquette statique ne remplace pas la spécification normative [provenance et propriété des fiches](../../../docs/KODJO-Provenance-propriete-fiches-mouvements-2026-11-06.md), la taxonomie V0 proposée ou la version Node.js locale. La logique des droits doit faire l'objet d'un contrôle distinct avant toute diffusion commerciale.
