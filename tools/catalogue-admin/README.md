# KODJO — Administration locale du catalogue (format v2) et connexion Wi-Fi

Mise à jour du 11/11/2026 (tranches W1 et W2). Remplace l'administration locale v0 du 07/11/2026
(brouillons `KODJO_ADMIN_DRAFTS` et `drafts.mjs`), qui n'est pas reprise sur cette branche.

## Rôles des deux administrations

| Outil | Rôle | Statut |
|---|---|---|
| **Administration locale Node** (`server.mjs`, ce dossier) | Édite directement `catalogue/catalogues/*.catalogue.json` au format **v2**, avec le validateur de l'application ; sert le téléphone par le Wi-Fi local. | Évolue. PC uniquement. |
| **Page statique OVH** (`static-ovh/`) | Ancien éditeur de brouillons v0 dans le navigateur. | **Variante historique**, conservée sans évolution, **non déployée par nous** ; la page en ligne n'est pas modifiée. |

Les brouillons v0 ont été intégrés une fois dans le catalogue par la conversion CA-2
(`tools/catalogue/convertPilotCorpus.ts`). Le format v2 s'édite désormais directement : aucun
brouillon intermédiaire, aucune seconde validation.

## Démarrer

Depuis la racine du dépôt (Node 20 ou plus récent ; aucun paquet supplémentaire) :

```text
node tools/catalogue-admin/server.mjs          # PC seulement
node tools/catalogue-admin/server.mjs --lan    # PC + connexion Wi-Fi du téléphone
```

Puis ouvrir `http://127.0.0.1:4738` sur le PC. Ports modifiables : `KODJO_ADMIN_PORT` (4738) et
`KODJO_PHONE_PORT` (4739). `KODJO_ADMIN_LAN=1` équivaut à `--lan`.

Au démarrage, le serveur génère la **couche métier partagée** (voir ci-dessous) si une source a
changé. Génération manuelle : `node tools/catalogue-admin/build-domain.mjs` (`--force` pour tout
régénérer).

## Couche métier partagée (aucun second validateur)

`build-domain.mjs` transpile avec l'API du paquet `typescript` (`ts.transpileModule`, déjà présent
dans `node_modules`) la fermeture des imports de trois modules du domaine de l'application :

- `src/domain/catalogue/MovementCatalogueFile.ts` — format, `parseMovementCatalogueFile`,
  `serializeMovementCatalogueFile`, `sheetFingerprint` ;
- `src/domain/catalogue/catalogueEditing.ts` — création de fiche et de Bibliothèque, composition,
  calcul des révisions (`applyFileEdit`) ;
- `src/domain/catalogue/MovementInbox.ts` — contrat de la boîte d'arrivée.

Résultat : environ 36 modules ESM dans `tools/catalogue-admin/generated/` (non versionné), alias
`@/` réécrits en chemins relatifs, extension `.js` ajoutée. Un import de paquet externe fait
échouer la génération (le domaine doit rester pur). Le **serveur** les importe ; la **page** les
charge depuis `/domain/...` (liste blanche du manifeste). Les mêmes fonctions valident donc côté
navigateur (affichage des problèmes avant enregistrement), côté serveur (refus) et dans
l'application (import de fichier).

## Ce que permet la page

- **Fichier** : liste des fichiers `catalogue/catalogues/*.catalogue.json`, ouverture,
  rechargement, export (octets du fichier enregistré), enregistrement.
- **Fiches** : recherche, filtre par Bibliothèque, **création** (61e fiche et suivantes) et édition
  de toutes les propriétés : contenu (nom, alias, position de départ, matériel, étapes, sécurité,
  notes), classification (Catégorie, Zones, spécialités, familles gestuelles, problèmes traités,
  cibles anatomiques, fondement, revue ; classification d'origine en lecture seule), provenance
  (geste, origine, amont, propriétaire, auteur unique, diffuseur, ayant droit, licence, statut
  éditorial, visibilité), sources (documentaire, contexte de prescription), validation (tous les
  champs), **galerie de médias** (reprise de la page OVH : photo locale compressée en WebP ≤ 1050 px,
  photo ou vidéo par lien HTTPS, 30 médias au plus, droits, réordonnancement), installation et
  historique en lecture seule.
- **Bibliothèques** : création, en-tête (titre, description, éditeur, propriétaire, visibilité,
  publication), ajout / retrait / réordonnancement des fiches **par référence** ; une fiche peut
  appartenir à plusieurs Bibliothèques.
- **Référentiels** et **Glossaire** : axes proposés éditables (Catégories et Zones, partagées avec
  l'application, en lecture seule) ; termes du glossaire.
- **Catalogue** : en-tête du fichier (titre, propriétaire, gestionnaire, diffuseur, publication,
  notes) et signalements.
- **Boîte d'arrivée** et **Téléphones** : voir « Connexion Wi-Fi ».

Les problèmes trouvés par le validateur partagé s'affichent en continu ; l'enregistrement est
refusé tant qu'il en reste.

## Révisions (calculées par le serveur)

- Le client envoie le fichier entier avec l'empreinte SHA-256 des octets lus (`etag`). Fichier
  modifié entre-temps → **409** (rien n'est écrit).
- Le serveur revalide avec le parseur partagé (**422** avec la liste des problèmes), puis calcule
  les révisions avec `applyFileEdit` **à partir du fichier sur disque** : un client ne peut pas
  forger une révision ni un historique.
- **Changement effectif seulement** : une fiche n'est révisée que si son empreinte éditoriale
  change (hors `revision`, `history`, `install` ; l'ordre des Zones et taxonomies n'est pas un
  changement, l'ordre des étapes, alias et médias en est un). Même règle pour une Bibliothèque
  (composition et en-tête). La révision du catalogue avance dès que le fichier change.
  Réenregistrer sans changement : aucune révision, aucune écriture.
- Révision suivante : entier → entier suivant ; `….N` → `….N+1` ; autre (ex. `2026-10-27`) →
  `2026-10-27.1` ; jamais une valeur déjà présente dans l'historique.
- Nouvelle fiche ou Bibliothèque : révision `1` et une entrée d'historique. Suppression d'une fiche
  ou d'une Bibliothèque : refusée (un identifiant n'est jamais réutilisé).
- Écriture : sérialisation de référence (`serializeMovementCatalogueFile`), fichier temporaire puis
  renommage, file d'écriture unique.

## Sécurité

- Administration : écoute **127.0.0.1** seulement ; en-tête `Host` local et adresse distante de
  bouclage exigés (anti-rebond DNS) ; toute écriture exige la même origine et `application/json`
  (aucune requête « simple » inter-sites) ; CSP stricte sans script en ligne, `nosniff`,
  `no-referrer`, `CORP same-origin`, `X-Frame-Options: DENY`.
- Limites de corps : 24 Mio pour un catalogue (photos intégrées), 64 Kio pour les autres actions
  d'administration, 4 Kio pour l'appairage, 1 Mio pour un envoi du téléphone.
- Noms de fichiers : jamais fournis librement ; seuls les fichiers listés dans
  `catalogue/catalogues/` (motif `*.catalogue.json`) sont accessibles. Côté téléphone, un
  `catalogueId` est associé aux seuls fichiers valides ; un identifiant porté par deux fichiers est
  ambigu et n'est pas servi.
- Aucun CORS ouvert ; aucune exposition Internet revendiquée ni prévue.

## Connexion Wi-Fi (option `--lan`)

Le serveur ouvre alors un **second port (4739)** sur le réseau local, qui n'expose **que** l'API
du téléphone (`/phone/*`). L'administration reste sur 127.0.0.1:4738 et n'est pas joignable depuis
le réseau.

### Préparer le PC (Windows)

1. Lancer `node tools/catalogue-admin/server.mjs --lan`. La console affiche les adresses de test,
   par exemple `http://192.168.1.23:4739/phone/test`.
2. Adresse IP du PC, si besoin : `ipconfig` → « Adresse IPv4 » de la carte Wi-Fi ou Ethernet.
3. **Pare-feu Windows Defender** : à la première écoute, Windows demande d'autoriser Node.js.
   Cocher **Réseaux privés uniquement**, jamais « Réseaux publics ». Le réseau Wi-Fi de la maison
   doit être de type « Privé » (Paramètres → Réseau et Internet → Wi-Fi → propriétés).
4. **Isolation des clients** : certains routeurs ou réseaux « invités » empêchent deux appareils de
   se joindre. Utiliser le réseau principal, pas le réseau invité.

### Vérifier depuis l'iPhone (Safari)

1. iPhone sur le **même Wi-Fi** que le PC.
2. Ouvrir `http://<IP du PC>:4739/phone/test`.
   **Attendu** : page « Connexion réussie », heure du PC affichée.
3. Ouvrir `http://<IP du PC>:4739/phone/v1/ping`.
   **Attendu** : `{"ok":true,"name":"Administration KODJO locale","api":"1","formatVersion":"2.0.0"}`.
4. Ouvrir `http://<IP du PC>:4739/phone/v1/libraries`.
   **Attendu** : `{"error":"UNAUTHORIZED"}` (protection par jeton active).
5. Ouvrir `http://<IP du PC>:4738/`. **Attendu** : échec de connexion (administration non exposée).

En cas d'échec en 2 : pare-feu (étape 3), réseau invité ou isolation (étape 4), mauvaise IP.

### Appairage

Onglet **Téléphones** → « Appairer un téléphone » : code à 6 chiffres, aléatoire, valable 5 minutes,
à usage unique (un nouveau code remplace le précédent). 5 essais faux brûlent le code ; plus de 20
échecs en 10 minutes verrouillent l'appairage jusqu'à la fin de la fenêtre. Le téléphone reçoit un
jeton de 32 octets valable 12 heures ; seule son empreinte SHA-256 est conservée
(`catalogue/admin/appareils.json`, non versionné). Jetons jamais journalisés. Les appareils
appairés sont listés et révocables.

### API du téléphone (version 1)

Base : `http://<IP du PC>:4739`. Réponses JSON (`application/json; charset=utf-8`), sauf la page de
test. Erreurs : `{ "error": "<CODE>", ... }`.

| Méthode et chemin | Auth | Corps / réponse |
|---|---|---|
| `GET /phone/v1/ping` | non | `200 { ok, name, api: "1", formatVersion }` |
| `GET /phone/test` | non | `200` page HTML sans script |
| `POST /phone/v1/pair` | non | corps `{ code: "123456", deviceName }` → `200 { token, tokenType: "Bearer", expiresAt, deviceId }` |
| `GET /phone/v1/libraries` | `Authorization: Bearer <token>` | `200 { libraries: [{ catalogueId, libraryId, title, description, revision, memberCount, fileRevision, catalogueTitle }] }` |
| `GET /phone/v1/catalogues/:catalogueId` | Bearer | `200` octets exacts du fichier v2 (sérialisation de référence, validée avant envoi), en-têtes `ETag`, `X-Kodjo-Catalogue-Revision` ; `If-None-Match` → `304` |
| `POST /phone/v1/inbox` | Bearer | corps `KODJO_MOVEMENT_INBOX` 1.0.0 → `200 { received, stored, duplicates, submissionId }` |

Codes d'erreur : `400 INVALID_JSON | INVALID_CODE_FORMAT | INVALID_DEVICE_NAME`,
`401 UNAUTHORIZED` (jeton absent, inconnu, expiré ou révoqué), `403 PAIRING_CLOSED | WRONG_CODE |
CODE_REVOKED_AFTER_FAILURES`, `404 NOT_FOUND | UNKNOWN_CATALOGUE`, `409 AMBIGUOUS_CATALOGUE`,
`413 TOO_LARGE`, `415 JSON_REQUIRED` (POST sans `Content-Type: application/json`),
`422 INVALID_INBOX` (+ `issues[{ path, code }]`), `429 PAIRING_LOCKED`, `500 INTERNAL_ERROR`,
`503 CATALOGUE_INVALID`.

Enveloppe de la boîte d'arrivée (contrat `src/domain/catalogue/MovementInbox.ts`) :

```json
{
  "format": "KODJO_MOVEMENT_INBOX", "formatVersion": "1.0.0",
  "sentAt": "2026-11-11T10:15:00.000Z", "device": { "name": "iPhone de Hermann" },
  "movements": [{
    "movementId": "…", "name": "Pompe murale", "aliases": [], "steps": ["…"],
    "categoryId": "renforcement", "categoryLabel": "Renforcement",
    "bodyZoneIds": ["bras"], "bodyZoneLabels": ["Bras"], "mediaCount": 0
  }]
}
```

Limites : 1 à 200 Mouvements par envoi ; nom 1 à 80 points de code (normalisé) ; au plus 20 alias
valides et distincts ; au plus 20 étapes non vides d'au plus 65 points de code, 1 000 au total
séparateurs compris ; Catégorie et au moins une Zone (libellés alignés sur les identifiants) ;
`mediaCount` entier de 0 à 1 000. Toute anomalie refuse l'envoi entier. Un même `movementId` deux
fois dans un envoi : fusionné s'il est identique, refusé (`DUPLICATE`) sinon. Renvoyer un Mouvement
déjà reçu avec le même contenu ne crée aucun doublon (`duplicates` le compte) ; un contenu différent
crée une nouvelle entrée.

### Boîte d'arrivée (onglet du PC)

Chaque envoi est stocké atomiquement dans `catalogue/admin/inbox/*.json` (non versionné). Pour
chaque Mouvement : collisions signalées (même nom normalisé qu'une fiche ou un alias, ou
identifiant déjà rapproché), puis décision explicite :

- **Ajouter au catalogue** : fiche `LOCAL_CREATED`, sans amont, privée, brouillon, non publiable,
  propriétaire et auteur inconnus (`null`), contenu projeté (nom, alias, étapes), Catégorie et Zones
  choisies dans les référentiels du catalogue (proposées par identifiant puis par libellé, jamais
  inventées), `install.knownLocalMovementIds: [movementId]`, ajout facultatif à une Bibliothèque.
  Refus `409 ALREADY_LINKED` si ce Mouvement est déjà rapproché d'une fiche.
- **Rapprocher** : ajoute le `movementId` à `install.knownLocalMovementIds` d'une fiche existante,
  après confirmation. L'installation est hors empreinte éditoriale : **aucune révision de la
  fiche** ; la révision du catalogue avance (le fichier change).
- **Ignorer**.

Les médias des Mouvements personnels **ne sont pas transférés** dans ce lot (seul `mediaCount`).

## Tests

```text
node --test tools/catalogue-admin/server.test.mjs
npx jest src/domain/catalogue
node --test scripts/catalogue/__tests__/static-ovh-medias.test.mjs
```

Les tests serveur travaillent sur une copie temporaire du catalogue pilote ; ils ne modifient pas
le dépôt.
