# KODJO — Administration locale du catalogue (V0)

**Périmètre :** consultation et édition de brouillons de fiches de mouvements, valeurs proposées des référentiels et glossaire sportif/anatomique. **Pas** d'interface utilisateur mobile, de diffusion aux utilisateurs, de publication, de comptes coachs, de migration SQLite ou de modification du moteur d'exécution.

## Démarrage sur le PC de développement

Pré-requis : Node.js 22+ et dépôt KODJO incluant les PR empilées #421, #423, #425 puis la présente tranche.

Depuis la racine du dépôt :

```bash
node tools/catalogue-admin/server.mjs
```

Ouvrir **http://127.0.0.1:4738** dans le navigateur du même PC.

Pour un autre port local : définir `KODJO_ADMIN_PORT` dans l'environnement avant de lancer le serveur. Le processus écoute uniquement `127.0.0.1` ; aucune connexion externe, cloud ni synchronisation n'est implémentée.

### Utilisation

- **Mouvements** : recherche dans les 60 candidats et édition du nom, des étapes (65 caractères/étape), des alias, des catégories et zones KODJO, des spécialités, des familles gestuelles, des problèmes cliniques, des cibles anatomiques, des auteurs et du propriétaire administratif. Les URL et classifications originales restent visibles en lecture seule.
- **Référentiels** : proposition de nouveaux identifiants stables et de libellés ; aucune modification des référentiels KODJO Catégorie/Zone et aucune suppression d'une valeur de référence initiale.
- **Glossaire** : création/modification/retrait de termes descriptifs et synonymes ; le glossaire officiel du produit (chap. 01) n'est pas touché.
- **Exporter/Importer** : JSON des **brouillons exclusivement**, pas du contenu source. Une importation remplace uniquement l'état en mémoire et doit être validée avant écriture.
- **Enregistrer** : écriture atomique de `catalogue/admin/brouillons.json`, avec validation de références et contrôle de révision concurrente. Le statut de publication reste `false`.

Les fichiers `catalogue/pilote/mouvements-60-candidats.json` et `catalogue/referentiels/taxonomie-v0-proposition.json` sont **sources immuables** pour cet outil. Les modifications sont des *overrides* dans `catalogue/admin/brouillons.json` : les descriptions d'origine, la traçabilité et les incertitudes ne sont pas écrasées. Les modifications sont enregistrées sur disque local ; pour les versionner, vérifier le diff puis `git add catalogue/admin/brouillons.json && git commit`. Aucun `git push` automatique.

### Sécurité et limites

- Liaison à l'adresse `127.0.0.1`, contrôle Host, `Origin` et `Content-Type` pour les écritures, politique CSP restrictive, aucun chemin fourni par l'utilisateur, taille de requête plafonnée à 1 Mio.
- Il s'agit d'une interface locale destinée à un **poste de développement de confiance**. Elle n'est pas authentifiée et n'est pas prévue pour être exposée sur un réseau, via un tunnel ou un reverse proxy.
- La validation empêche les références inconnues et les modifications non publiables, mais **ne constitue pas** une approbation des valeurs de classification, des contenus médicaux ou des droits sur les images/textes.
- La Catégorie KODJO reste l'Objectif principal, les Zones KODJO restent leur référentiel existant. Aucun axe ne devient obligatoire pour les données utilisateur.
- `Movement.id`, `sourceMovementId` et les mécanismes du moteur restent inchangés. Les brouillons ne sont **pas importés dans la SQLite de l'utilisateur**.
- Les valeurs des Catégories/Zones affichées sont celles des *seeds historiques du dépôt*, pas un miroir des catégories/zones personnalisées d'un utilisateur mobile. L'administration ne lit aucune base utilisateur.
- Les changements de formulaire sont conservés en mémoire via la commande « Conserver la fiche en brouillon » ; cliquer « Enregistrer les brouillons » écrit le fichier. Quitter la page sans enregistrer peut faire perdre les modifications en mémoire.

## Tests

```bash
node --test tools/catalogue-admin/server.test.mjs
node --test scripts/catalogue/__tests__/validate-pilot-corpus.test.mjs scripts/catalogue/__tests__/validate-taxonomy.test.mjs
npx jest --runInBand src/domain/catalogue/__tests__/MovementEditorialProvenance.test.ts src/infrastructure/database/__tests__/seedMovementTestCorpus.test.ts
```

Le serveur est testé sur une **copie temporaire isolée** des fichiers du dépôt. Les tests contrôlent l'intégrité de l'API et l'absence d'écriture du corpus source. Aucune exécution de test ne modifie la base mobile réelle.

## À préparer ensuite

- Approbation de la taxonomie et mapping des 60 fiches (Catégories/ Zones adaptées aux cas transversaux).
- Workflow de publication séparé des brouillons et gouvernance clinique/des droits.
- Résolution des fiches de coach homonymes lors d'une installation réelle (unicité actuelle du nom de Mouvement en SQLite).
- Distribution contrôlée de paquets par spécialité et tests mobiles, sans imposer la diffusion au MVP.
