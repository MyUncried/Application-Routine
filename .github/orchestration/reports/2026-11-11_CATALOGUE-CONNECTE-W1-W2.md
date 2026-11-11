# CATALOGUE CONNECTÉ — W1 (administration locale v2) et W2 (connexion Wi-Fi) — rapport de qualification

**Date :** 11/11/2026. **Type :** développement (deux tranches). **Exécutant :** Claude Code (session déléguée).

## 1. Identifiant et objectif

- **W1 — Administration Web locale sur le format v2 (PC uniquement)** : l'administration Node ouvre, édite et enregistre directement `catalogue/catalogues/*.catalogue.json` (v2), avec **le même validateur de domaine que l'application**.
- **W2 — Connexion Wi-Fi** : le serveur du PC sert, sur le réseau local et après appairage, la liste des Bibliothèques et les fichiers catalogue v2 au téléphone, et reçoit les Mouvements envoyés par le téléphone dans une boîte d'arrivée traitée explicitement depuis le PC. Test depuis Safari sur iPhone ; aucune build mobile.

## 2. Branche et commit de départ

- Branche : `catalogue/connecte-admin-20261111`, créée depuis `b8da709b` (branche `catalogue/connecte-dev-20261111`, « format v2 — auteur unique, Bibliothèques, relecture v1, aller-retour (P0) »).
- Worktree : `C:/Dev/KODJO-CAT-ADMIN`.

## 3. Périmètre demandé / réellement traité

| Demande | État |
|---|---|
| W1.1 Couche métier partagée transpilée (`build-domain.mjs`, `ts.transpileModule`, alias et extensions réécrits), importée par le serveur ET la page | Fait — 36 modules générés (fermeture des 3 points d'entrée), dossier `generated/` non versionné |
| W1.2 `catalogueEditing.ts` (+ tests jest) : `createSheet`, `applySheetEdit`, `applyLibraryEdit`, `applyFileEdit`, aides de Bibliothèque | Fait (+ `nextRevision`, `libraryFingerprint`, `linkLocalMovement`, `replaceLibrary`) |
| W1.3 Serveur v2 : liste, lecture, enregistrement (409 / 422 / révisions serveur / écriture atomique), export, protections, 24 Mio | Fait |
| W1.4 Interface : onglets, liste filtrée, création de la 61e fiche, édition de toutes les propriétés, galerie médias, Bibliothèques, Référentiels, Glossaire, problèmes affichés avant enregistrement | Fait |
| W1.5 Tests `node --test` serveur et jest | Faits, exécutés (§ 6) |
| W2.1 Écoute réseau local optionnelle, administration en bouclage seulement | Fait — `--lan` / `KODJO_ADMIN_LAN=1`, **second port 4739** n'exposant que `/phone/*` |
| W2.2 Appairage (code 6 chiffres, 5 min, usage unique, verrouillage, jeton 32 octets 12 h, liste et révocation, comparaison à temps constant) | Fait |
| W2.3 API téléphone : bibliothèques, catalogue (octets exacts, validation stricte), boîte d'arrivée (`MovementInbox.ts` + tests jest, stockage atomique, idempotence) | Fait |
| W2.4 Interface boîte d'arrivée : collisions, « Ajouter au catalogue », « Rapprocher », traitement marqué | Fait (+ « Ignorer ») |
| W2.5 `/phone/v1/ping`, `/phone/test`, README (démarrage, IP, pare-feu, isolation, procédure Safari) | Fait |
| W2.6 Sécurité (pas d'Internet, liaison LAN sur option, jetons non journalisés, entrées validées, pas de CORS, limites, chemins jamais fournis) | Fait (+ filtrage des adresses non locales) |
| W2.7 Tests `node --test` et jest | Faits, exécutés (§ 6) |
| Documentation : § 11 et § 12 ajoutés au format, README de l'outil | Fait (texte existant conservé) |

Hors périmètre, non touché : application mobile, `src/infrastructure/catalogue/*`, `src/features/catalogue/*`, `catalogueLoadPlan.ts`, `library*.ts`, `app/*`, `MovementCatalogueFile.ts`, `MovementEditorialProvenance.ts` (non modifiés), page OVH en ligne, Figma, `main`.

## 4. Constats et choix techniques

1. **Aucun second validateur.** Le serveur et la page importent les mêmes modules transpilés depuis `src/domain/**`. La galerie de médias ne réécrit pas les règles de média de l'ancienne page : elle valide un média en soumettant le fichier candidat à `parseMovementCatalogueFile` (le module `MovementCatalogueFile.ts` n'expose pas `mediaProblem` et n'a pas été modifié). `drafts.mjs` (validateur des brouillons v0) n'est **pas** porté : il est remplacé par la conversion CA-2 déjà livrée.
2. **Révisions calculées par le serveur** à partir du fichier sur disque (`applyFileEdit`) ; révisions et historiques envoyés par le client ignorés (testé avec une révision forgée « 77 »).
3. **Règle de révision non numérique** (choix technique déterministe, documenté § 11.3) : entier → +1 ; suffixe `.N` → `.N+1` ; sinon ajout de `.1` ; jamais une valeur déjà présente dans l'historique. Une Bibliothèque issue de la conversion v1 (révision « 1 », historique vide) passe à « 2 » avec une première entrée d'historique.
4. **Rapprochement** : `install` est hors empreinte → pas de révision de fiche, mais révision du catalogue (le fichier change).
5. **Fins de ligne** : le fichier pilote est extrait en CRLF dans ce worktree (`core.autocrlf=true`, aucun attribut `.gitattributes`). Le serveur sert et écrit la sérialisation de référence (LF). « Octets identiques » est donc vérifié entre le fichier enregistré par l'administration, l'export et le téléchargement téléphone ; un fichier non canonique sur disque est signalé dans l'onglet Catalogue et réécrit au premier enregistrement effectif.

### Écarts au demandé (assumés, à valider)

- **Suppression** d'une fiche ou d'une Bibliothèque : refusée par `applyFileEdit` (`SHEET_REMOVED`, `LIBRARY_REMOVED`) pour garantir qu'aucun identifiant n'est réutilisé. Non demandée ; aucune action de suppression dans l'interface.
- **Second port** (4739) pour le téléphone plutôt qu'un filtrage par route sur le même port : l'administration n'est physiquement pas à l'écoute sur le réseau.
- **Défense supplémentaire** : l'API téléphone refuse les adresses sources hors réseau local (`403 LOCAL_NETWORK_REQUIRED`).
- **Enveloppe de boîte d'arrivée stricte** : une anomalie refuse l'envoi entier (comme l'import d'un fichier catalogue).
- `eslint.config.js` : ajout de `tools/catalogue-admin/generated/*` aux exclusions (dossier généré).
- La page OVH historique (`static-ovh/index.html`, `README.md` + note de statut) et son test (`scripts/catalogue/__tests__/static-ovh-medias.test.mjs`) sont repris à l'identique depuis `origin/feat/catalogue-admin-static-medias-20261107`.

### Synchronisation code / documentation

Classe **B — évolution validée** (demande explicite de la mission W1/W2) : sources mises à jour = `docs/KODJO-Format-catalogue-mouvements-v1.md` (§ 11 et § 12 ajoutés, texte existant inchangé) et `tools/catalogue-admin/README.md` ; responsabilités Node local / OVH statique documentées (README des deux outils). Aucune formulation antérieure contradictoire trouvée dans le document de format (la v2 y déclarait déjà « Administration » comme utilisatrice de `serializeMovementCatalogueFile`). Aucune correction préparée non appliquée.

## 5. Fichiers

Créés :
- `src/domain/catalogue/catalogueEditing.ts`, `src/domain/catalogue/MovementInbox.ts`
- `src/domain/catalogue/__tests__/catalogueEditing.test.ts`, `src/domain/catalogue/__tests__/MovementInbox.test.ts`
- `tools/catalogue-admin/build-domain.mjs`, `server.mjs`, `phone.mjs`, `app.js`, `media.js`, `index.html`, `styles.css`, `server.test.mjs`, `README.md`
- `tools/catalogue-admin/static-ovh/index.html`, `tools/catalogue-admin/static-ovh/README.md` (historique)
- `scripts/catalogue/__tests__/static-ovh-medias.test.mjs` (historique)
- ce rapport

Modifiés : `docs/KODJO-Format-catalogue-mouvements-v1.md` (ajouts § 11–12), `.gitignore` (`tools/catalogue-admin/generated/`, `catalogue/admin/appareils.json`, `catalogue/admin/inbox/`), `eslint.config.js` (exclusion du dossier généré).

## 6. Tests exécutés (résultats réels)

| Commande | Résultat |
|---|---|
| `node --test tools/catalogue-admin/server.test.mjs` | **23 tests, 23 PASS, 0 FAIL** (3 suites) |
| `node --test scripts/catalogue/__tests__/static-ovh-medias.test.mjs` | **5 PASS, 0 FAIL** |
| `npx jest src/domain/catalogue/__tests__/catalogueEditing.test.ts src/domain/catalogue/__tests__/MovementInbox.test.ts` | **2 suites, 27 tests PASS** |
| `npx jest src/domain/catalogue tools/catalogue` | **6 suites, 99 tests PASS** (dont format v2, chargement, conversion pilote : non régressés) |
| `npx jest` (suite complète) | voir § 6 bis |
| `npx tsc --noEmit -p .` | **0 erreur** |
| `npx eslint src/domain/catalogue tools/catalogue-admin/*.mjs tools/catalogue-admin/*.js scripts/catalogue` | **0 problème** |
| Fumée de l'interface (script jetable hors dépôt : jsdom + serveur réel sur copie temporaire du pilote) | ouverture (60 fiches), édition du nom, 7 onglets rendus, création d'une Bibliothèque + ajout de fiche + enregistrement (révision 2), création d'une 61e fiche + enregistrement (révision 3, 1 fiche créée), code d'appairage affiché, boîte d'arrivée (envoi réel par l'API téléphone puis « Ajouter au catalogue ») : **aucune erreur JavaScript**. Ce n'est pas un contrôle visuel. |

Couverture du test serveur : interface et domaine servis (liste blanche), ouverture du pilote, réenregistrement sans changement (aucune écriture), 61e fiche (révision 1 imposée, catalogue +1, relu et réécrit à l'identique), édition effective (+1 sur la seule fiche), 409 périmé, 422 invalide (LOCAL_DERIVED, publication sans propriétaire), suppression refusée, auteur de révision invalide, Bibliothèque (révision de composition, fiches inchangées), export = octets du fichier, Host non local / origine étrangère / text/plain / chemin forgé / corps trop gros ; ping et page de test sans authentification, aucune route d'administration sur le port réseau, authentification exigée, appairage (succès, usage unique, mauvais code, expiration 5 min), 5 essais → code brûlé, verrou global 20 échecs / 10 min puis réouverture, empreinte seule du jeton sur disque, bibliothèques et téléchargement (octets identiques, parseur partagé, ETag/304, identifiant inconnu ou forgé), fichier invalide non servi, identifiant ambigu 409, révocation et expiration 12 h, boîte d'arrivée (422, 415, stockage, idempotence, nouvelle version, 413), « Ajouter au catalogue » (fiche LOCAL_CREATED privée sans identité, rapprochée, ajoutée à une Bibliothèque, traitée, 409 ALREADY_LINKED), « Rapprocher » (sans révision de fiche, catalogue révisé), « Ignorer », serveur sans `--lan`, adresses locales / non locales, chemin mal encodé.

### 6 bis. Suite jest complète

RESULTAT_SUITE_COMPLETE

## 7. Hypothèses non démontrées

- Joignabilité réelle depuis l'iPhone (pare-feu Windows, routeur) : non testée par Claude.
- Rendu et ergonomie de la page dans un vrai navigateur : non contrôlés visuellement (aucun navigateur lancé).
- Compression des photos (canvas WebP) : code repris de la page OVH, non réexécuté (jsdom n'a pas de canvas).

## 8. Limitations

- Les médias des Mouvements personnels ne sont pas transférés (seul `mediaCount`).
- Propriétés inconnues imbriquées d'un fichier (ex. `content.x`) : tolérées par le parseur partagé et conservées ; les propriétés inconnues de premier niveau d'une fiche ou d'une Bibliothèque sont retirées à la révision.
- Un poste du réseau local peut provoquer le verrou global d'appairage (20 échecs) : déni de service temporaire (10 min), sans risque d'appairage.
- Si l'écriture du statut de la boîte d'arrivée échouait après l'écriture du catalogue, le Mouvement resterait « en attente » ; « Ajouter » serait alors refusé (`ALREADY_LINKED`) et « Rapprocher » le solderait sans effet sur le fichier.

## 9. Questions ouvertes (réelles)

1. **Limites des étapes reçues du téléphone** : 20 étapes de 65 points de code au plus (règle de l'administration Web, imposée par la mission). Le contrat `Movement` de l'application ne borne que le total (1 000). Un Mouvement du téléphone ayant une étape plus longue serait refusé en entier. Confirmer ou assouplir.
2. **Médias non confirmés dans le téléchargement Wi-Fi** : le fichier servi au téléphone est l'octet-près du fichier v2 (exigence « même format qu'un import ») et contient donc les médias intégrés dont les droits ne sont pas confirmés. Confirmer que l'envoi vers son propre téléphone appairé n'est pas une « transmission » au sens de la règle sur les médias, ou demander un filtrage.

## 10. Vérifications restant à faire par Hermann

**Sur le PC (navigateur)** — `node tools/catalogue-admin/server.mjs`, puis `http://127.0.0.1:4738` :
1. Le pilote s'ouvre : 60 fiches, bandeau « Fichier valide… 62 signalement(s) ».
2. Modifier une note d'une fiche → « Modifiée » dans la liste → Enregistrer → message « révision du catalogue 2 ; fiches révisées : 1 ». La fiche passe en révision 2 (Historique).
3. Enregistrer de nouveau sans rien changer → « Aucun changement effectif ».
4. « Nouvelle fiche » (nom, Catégorie, une Zone) → compléter → Enregistrer → 61 fiches, révision 1.
5. Vider le nom d'une fiche → le problème s'affiche immédiatement et l'enregistrement est refusé.
6. Ajouter une photo locale (JPEG) avec texte alternatif → aperçu → Enregistrer → la photo reste après Recharger.
7. Onglet Bibliothèques : créer une Bibliothèque, ajouter trois fiches, réordonner, Enregistrer.
8. Ouvrir la page dans deux onglets, enregistrer dans l'un puis dans l'autre → le second est refusé (fichier changé).
9. Exporter → le fichier téléchargé est identique à `catalogue/catalogues/…` (après un enregistrement).
10. Restaurer ensuite le pilote si ces essais ne doivent pas être conservés (`git checkout -- catalogue/catalogues/kodjo-pilote-60.catalogue.json` dans ce worktree).

**Depuis l'iPhone (Safari)** — `node tools/catalogue-admin/server.mjs --lan` (accepter Node sur **réseaux privés** seulement) :
1. `http://<IP du PC>:4739/phone/test` → « Connexion réussie » et l'heure du PC.
2. `http://<IP du PC>:4739/phone/v1/ping` → `{"ok":true,"name":"Administration KODJO locale","api":"1","formatVersion":"2.0.0"}`.
3. `http://<IP du PC>:4739/phone/v1/libraries` → `{"error":"UNAUTHORIZED"}`.
4. `http://<IP du PC>:4738/` → échec de connexion (administration non exposée).
5. Sur le PC, onglet Téléphones : « Appairer un téléphone » affiche un code à 6 chiffres et son délai.
En cas d'échec en 1 : pare-feu, réseau invité / isolation des clients, ou mauvaise IP (`ipconfig`).

## 11. Commits et état Git

- Commit de livraison (code, tests, documentation) : `COMMIT_LIVRAISON`.
- Commit documentaire de ce rapport : voir le message de commit qui le contient (rattaché au commit ci-dessus).
- Poussée : `git push -u origin catalogue/connecte-admin-20261111`. Aucune fusion vers `main`, aucun déploiement, aucune écriture OVH, aucune modification Figma.
