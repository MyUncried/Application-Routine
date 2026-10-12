# PRE-3 (#340) — retest ciblé après la recette 3

Ce retest couvre une ligne par sous-point corrigé : T-53, N-01, N-02 et N-05. Durée : environ 10 minutes. Aucune suppression ni réinstallation de l’app ; les données sont conservées. Le commit exact et l’identifiant de mise à jour figurent dans le rapport `2026-10-12_PRE3-340_CORRECTION-RECETTE3.md`.

Candidat : commit `1645b52f`, OTA **`01a130ce-0c5c-75c5-b821-2bc0d85e1113`** (canal `review`, runtime 1.1.0), compatible avec les builds 7 et 8.

## 0. Identifier la version exécutée (une fois)

1. Ouvrir **Routine Dev** avec le réseau actif.
2. Dans **Safari**, saisir `routine://diagnostic-updates`, valider, puis accepter « Ouvrir dans Routine Dev ».
3. Lire l’écran « Diagnostic des mises à jour » :

| Ce qui s’affiche | Signification | Suite |
|---|---|---|
| « Mise à jour exécutée » = `01a130ce-0c5c-75c5-b821-2bc0d85e1113` et « Lancement » = « mise à jour OTA » | Le candidat (`1645b52f`) est exécuté | Capture, puis retests du §1 |
| « Téléchargée, en attente » = `01a130ce…` | Téléchargée, appliquée au prochain lancement | Fermer complètement l’app **une seule fois**, la rouvrir, refaire 2 et 3 |
| Autre identifiant, sans attente | Mise à jour non reçue | Toucher « Vérifier maintenant », capture de tout l’écran, **s’arrêter** et me la transmettre |
| Safari ne peut pas ouvrir le lien | Build 7 sans le candidat (le lien n’existe qu’à partir du build 8 et de cette OTA) | **S’arrêter** et le signaler |

La correspondance au commit se fait côté EAS : la mise à jour `01a130ce…` porte `gitCommitHash` `1645b52f3deaa185606aa2375e4ad3192c3675f7`.

## 1. Retests

| ID | Écran affiché | Données de départ | Gestes | Résultat attendu | Si échec, rapporter |
|---|---|---|---|---|---|
| R3-01 **T-53** | « Paramètres d’exécution » (carte Paramètres de « Créer un exercice ») | Mode Durée, 3 Séries | Observer la ligne « Séries variables » : interrupteur **désactivé** ; puis **activé** (tableau déployé) ; puis tableau **replié** (chevron). Recommencer avec le texte agrandi (Réglages › Luminosité et affichage › Taille du texte). | L’interrupteur est centré verticalement sur le libellé et au milieu de l’espace entre les deux traits, dans les trois états. Aucun déplacement dû au tableau ; libellé non tronqué. | Capture de la ligne seulement |
| R3-02 **N-01** Catégorie | « Catégorie de l’exercice » (depuis Créer / Modifier un exercice › Catégorie) | Une Catégorie déjà affectée (par ex. Mobilité) | 1. « Créer une catégorie », écrire un nom **nouveau** (« Test R3 »), choisir une couleur, toucher **↑**. 2. Toucher ↑ à nouveau, champ vide. 3. Écrire le nom d’une Catégorie **existante**, toucher ↑. 4. Toucher **✕**. 5. Rouvrir, toucher « Test R3 », toucher **✓**. | 1 : « Test R3 » apparaît **une seule fois**, marqué ; **le clavier reste affiché**, la feuille reste ouverte, le champ est vidé et garde le curseur. 2 : rien ne se passe (↑ grisé). 3 : message de doublon, aucune création. 4 : la feuille se ferme, Mobilité reste affectée, « Test R3 » reste dans la liste. 5 : « Test R3 » affectée, fermeture progressive. | Étape, état du clavier, nombre d’entrées « Test R3 » |
| R3-03 **N-02** Zone | « Zones corporelles » (depuis Créer / Modifier un exercice) | Une Zone déjà choisie | 1. « Créer une zone corporelle », écrire « Zone R3 », toucher **↑**. 2. Toucher ↑ à nouveau, champ vide. 3. Toucher **✕**, rouvrir. 4. Recréer une Zone « Zone R3b », toucher **✓**. | 1 : « Zone R3 » apparaît **une fois**, cochée ; **le clavier reste affiché**, la feuille reste ouverte. 2 : rien. 3 : la sélection d’avant l’ouverture est restaurée ; « Zone R3 » reste dans la liste. 4 : la sélection (avec « Zone R3b ») est appliquée. | Étape, état du clavier, doublon éventuel |
| R3-04 **N-05** Description | « Créer un exercice », puis un exercice existant (« Modifier un exercice ») | — | 1. Toucher **Description** : observer le coin bas droit du champ. 2. Écrire une ligne, puis plusieurs lignes avec Retour ; replacer le curseur au milieu et écrire. 3. Toucher **↑**. 4. Rouvrir Description : texte présent ; toucher ↑ sans rien changer. 5. Toucher **Terminer**, rouvrir l’exercice. 6. Vider la Description, toucher ↑. 7. Refaire 1 à 3 avec le texte agrandi. | 1 : un bouton rond bleu **↑** dans le champ, qui ne masque ni le texte ni le curseur. 2 : Retour **ajoute une ligne** (ne valide pas) ; la ligne en cours reste visible. 3 : le clavier se ferme, le texte est conservé, Terminer réapparaît à sa place ; **rien n’est enregistré** à ce stade. 5 : la Description est enregistrée. 6 : Description vide acceptée comme avant. 7 : mêmes résultats. | Étape en défaut, capture |

**Non retestés ici**, en attente des extensions EXT-R3-1 à -4 et de l’arbitrage ARB-R3-1 : T-49 (Catalogue, Composition), N-03 (Étiquette), N-04 (menu d’appui long).
