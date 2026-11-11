# Catalogue connecté — Recette PC + iPhone (R)

Version en ligne, avec enregistrement des résultats : https://claude.ai/artifact/9RszZZ4tEgVBb5KJYEky18.

Branche `catalogue/integration-pre10-20261111` ; spécification `_bmad-output/catalogue-connecte/spec-catalogue-connecte.md`.

**Prérequis.** Application **Routine Catalogue** (client de développement, base distincte), build EAS `development-catalogue` `b509f0aa` lancée le 11/11/2026 sur accord de Hermann (« ok pour routine catalogue ») : https://expo.dev/accounts/ankushas-team/projects/routine/builds/b509f0aa-206f-4f27-8ccb-5a7fcd3788a8. L'installer depuis ce lien. Elle est servie par un Metro dédié au chantier, `http://192.168.0.16:8082` (dossier `KODJO-CAT-INTEG`). Routine BMAD reste l'application de PRE-10 et n'est pas touchée. Au premier lancement, choisir ce serveur dans le lanceur ; si la liste est vide, saisir l'adresse à la main.

Pour chaque point, note **OK**, ou **KO** avec ce que tu vois (une capture aide).

## 0. Préparation sur le PC

1. Dans le dossier `C:\Dev\KODJO-CAT-INTEG` (branche d'intégration ; pas `KODJO-CAT-ADMIN`) : `node tools/catalogue-admin/server.mjs --lan`. La console affiche l'adresse locale `http://127.0.0.1:4738` et le port téléphone `4739`.
2. Ouvre `http://127.0.0.1:4738` dans le navigateur du PC : l'administration s'ouvre sur « Catalogue pilote KODJO — 60 fiches de test ».
3. Au premier lancement en `--lan`, Windows propose d'autoriser Node.js. Coche **Réseaux privés uniquement**.
4. Relève l'adresse IP du PC (`ipconfig` → « Adresse IPv4 », par exemple `192.168.1.20`).

## 1. W1 — Administration (PC)

5. La liste montre les 60 fiches. Le filtre et la recherche fonctionnent.
6. **Créer une 61e fiche** :
   - nom « Squat test recette », 2 étapes, une Catégorie, une Zone ;
   - Enregistrer : elle apparaît avec la révision 1.
7. Rouvre la fiche, change une étape, Enregistrer : révision 2, avec une entrée d'historique.
8. Rouvre-la et Enregistre **sans rien changer** : la révision reste 2.
9. Modifie les autres propriétés (provenance, sources, validation, classification), Enregistrer : aucune erreur, révision 3.
10. **Médias** :
    - ajoute une photo depuis un fichier (compressée), puis une vidéo par lien HTTPS avec sa source ;
    - réordonne-les, mets leurs droits à « Non vérifié » ;
    - Enregistrer : révision suivante.
11. **Bibliothèques** :
    - crée « Recette Hyrox » avec 3 fiches, dont la 61e ;
    - ajoute aussi une de ces fiches à la Bibliothèque pilote : la même fiche est dans deux Bibliothèques, sans copie.
12. Saisis une valeur invalide (nom vide) : le problème s'affiche, l'enregistrement est refusé et le fichier sur disque est inchangé.
13. Exporte le fichier, puis rouvre-le : aucune perte, mêmes révisions.

## 2. W2 — Connexion Wi-Fi depuis Safari (avant toute build)

14. iPhone sur le même Wi-Fi. Dans Safari : `http://<IP du PC>:4739/phone/test` → page « Connexion réussie. Ce téléphone joint … par le réseau local. ».
15. `http://<IP du PC>:4739/phone/v1/ping` → `{"ok":true,…}`.
16. `http://<IP du PC>:4738/` depuis l'iPhone → **inaccessible** : l'administration reste réservée au PC.
17. En cas d'échec en 14 :
    - vérifie l'autorisation du pare-feu ;
    - vérifie que le Wi-Fi n'isole pas les appareils (réseau invité, « isolation des clients » de la box).

## 3. A1 — Profil → Bibliothèques (build de développement)

18. **Profil → Modifier le profil** :
    - les sections « Bibliothèques » (« Ajouter une bibliothèque », « Envoyer mes mouvements ») et, après installation, « Bibliothèques installées » sont présentes ;
    - ni « Mes bibliothèques » ni « Bibliothèques partagées » ne sont affichées.
19. **Ajouter une bibliothèque → Depuis l'administration (PC)** :
    - sur le PC, « Appairer un téléphone » affiche un code à 6 chiffres ;
    - saisis un code **faux** : « Code refusé ou expiré ».
20. Saisis le bon code :
    - iOS demande l'accès au réseau local : accepte ;
    - l'écran affiche « Connexion en cours… », puis « Connecté à « … » ».
21. **Voir les bibliothèques disponibles** : « Pilote KODJO — 60 mouvements (recette) » et « Recette Hyrox », chacune avec son nombre de fiches et « Installer ».
22. Pilote :
    - l'aperçu annonce **60 déjà présentes — rattachées à vos mouvements, sans doublon** (si les 60 sont déjà installés) ou **60 nouvelles** ;
    - il affiche « Propriétaire inconnu : usage privé » ;
    - **Installer** : « … est installée ».
23. Catalogue des Mouvements : aucun doublon. Les Séances existantes utilisent toujours les mêmes Mouvements.
24. Ouvre un des 60 depuis le Catalogue :
    - pastille « Pilote KODJO — 60 mouvements (recette) · rév. 1 » à la place du crayon ;
    - aucune modification ni duplication possible.
    - Ouvre ensuite un Exercice qui utilise ce Mouvement : ses paramètres restent modifiables.
25. Recette Hyrox : un **média aux droits non vérifiés** bloque le transfert. Message attendu : liste indisponible ou erreur. Sur le PC, passe les droits à « Permission confirmée » (avec licence et attribution), Enregistrer, puis **Actualiser** sur l'iPhone : installation possible.
26. Coupe le Wi-Fi de l'iPhone pendant le chargement de la liste : message de connexion perdue, puis **Actualiser** quand le Wi-Fi revient.

## 4. A1 — Mise à jour volontaire

27. Sur le PC, modifie une fiche du pilote (une étape), Enregistrer.
28. iPhone, Bibliothèques disponibles → Actualiser : le pilote affiche « révision … disponible » et « Mettre à jour ». Profil : la pastille « Mettre à jour » apparaît.
29. Aperçu de mise à jour :
    - « 1 Modifiée » et la ligne « Étapes : n → n+1 · Catégorie inchangée » ;
    - « Voir le détail » : Actuelle / Nouvelle.
30. **Reporter** : rien n'est modifié et la mise à jour reste proposée. **Refuser** : elle n'est plus proposée.
31. Nouvelle modification sur le PC, puis **Mettre à jour** :
    - « … est à jour » ;
    - le Mouvement montre la nouvelle étape ;
    - la fiche présente aussi dans « Recette Hyrox » est annoncée « Aussi dans … ».
32. **Interruption** : lance une installation, puis force la fermeture de l'application avant la fin. Au retour dans Profil :
    - une ligne « Installation interrompue · x sur y » apparaît ;
    - **Reprendre** termine sans doublon.

## 5. A1 — Fichier

33. Copie le fichier exporté dans Fichiers sur l'iPhone. **Ajouter une bibliothèque → Depuis un fichier** : les mêmes Bibliothèques s'affichent.
34. Fichier modifié pour être invalide (nom vide) : « Fichier refusé en entier », problèmes listés, aucune fiche importée.

## 6. A2 — Envoyer mes mouvements

35. Crée un Mouvement personnel « Gainage maison » dans le Catalogue.
36. **Profil → Envoyer mes mouvements** :
    - seuls les Mouvements personnels sont listés, aucun des 60 importés ;
    - choisis « Gainage maison », puis **Envoyer (1)** : « 1 mouvement envoyé ».
37. Renvoie-le : aucun doublon sur le PC.
38. PC, onglet **Boîte d'arrivée** : « Gainage maison » est présent ; **Ajouter au catalogue** dans « Recette Hyrox ».
39. iPhone, actualise puis ouvre la mise à jour de « Recette Hyrox » :
    - la fiche est signalée « Mouvement personnel envoyé à l'administration : rattachement en attente de règle » ;
    - aucun doublon n'est créé ;
    - « Gainage maison » reste modifiable.

## 7. Non-régression

40. Composition d'une Séance avec un Mouvement importé, puis exécution complète : rien ne change par rapport à PRE-10.
41. Révocation : sur le PC, révoque l'iPhone (onglet Téléphones). Sur l'iPhone, Actualiser : « L'appairage a expiré ou a été révoqué », puis « Se reconnecter ».
