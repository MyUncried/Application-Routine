# Revue du 16/10, point 1 — renvois D-232 et D-246 réintroduits par le lot 3b

Source de la demande : [KODJO_revue_reserves_lots1-5_2026-10-16.md](../KODJO_revue_reserves_lots1-5_2026-10-16.md), point 1 :
> « contrôler chaque occurrence contre le statut, la portée et le texte de la décision remplaçante. Conserver une citation historique uniquement si son caractère historique est explicite ; sinon remplacer par le renvoi actif démontré ou classer À CLARIFIER. »

## Textes de référence

**D-232, texte actuel** (ch. 07) :
> « **Amendée le06/10 : voir D-268 à D-298 (cadence, incertitude, phrase), autres dispositions conservées.** Bornes conservées : N1..99, répétitions1..100, durée5..3535s, pauses0..300s ; aucune estimation forfaitaire de répétition (Bip v2). Anciennes saisie inline, valeurs initiales, formules et granularités remplacées par D-246 puis D-247 à D-253/v12. »

Statut : « Supersédée sur ces points le 02/10/2026 ».

**D-232, texte d'origine** (`fd9555bc`, 30/09/2026), extraits :
> « … paramètres communs conservés lors d’un changement de mode … ; après la première sélection, impossible de revenir à « aucun mode » ; `Terminer` désactivé tant qu’aucun mode n’a été choisi ; Séries `1..99`; Répétitions `1..100`; … »

Le texte d'origine ne contient aucune disposition sur la persistance de la phrase.

**D-246, texte actuel** :
> « La carte ouvre une feuille transactionnelle ✕/✓ ; Terminer seul persiste. Layout et contrôles complétés par D-247 à D-253 et v12 ; v11 archivée. »

Statut : « Supersédée sur ces points le 02/10/2026 ».

## Décision par occurrence

| Ligne (avant correction) | Point cité | Analyse | Traitement |
|---|---|---|---|
| ch. 08 « Entier de 1 à 100 (D-232) » | borne des répétitions | Le texte actuel de D-232 conserve explicitement cette borne (« Bornes conservées : … répétitions1..100 ») ; RM-234 concorde | **Renvoi actif démontré**, précisé : « (D-232, bornes conservées) » |
| ch. 08 « cible valide selon le mode (D-211/D-232) » | validité de la cible selon les bornes du mode | Même disposition conservée | **Renvoi actif démontré**, précisé : « (D-211 ; bornes conservées par D-232) » |
| ch. 08 « premier choix irréversible vers aucun mode (D-232) » | retour impossible à « aucun mode » | Présent dans le texte d'origine de D-232 et non cité parmi les points remplacés, mais **absent du texte actuel** du registre. Le caractère actif n'est donc pas démontrable à la lecture du registre. | **Citation historique explicitée, À CLARIFIER** |
| ch. 09 « La phrase elle-même n’est pas persistée … (D-232) » | non-persistance de la phrase | Absent du texte d'origine comme du texte actuel de D-232 | **Renvoi non démontré, À CLARIFIER** |
| ch. 09 « Aucun champ de stockage autonome de la phrase n’est requis (D-232) » | idem | idem | **Renvoi non démontré, À CLARIFIER** |
| ch. 13 « la ligne Total reste présente … (D-246) » | présence de la ligne Total | D-246 ne traite pas de la ligne Total. Sujet voisin de la question Q-K (b) (« — » ou absence pendant une saisie incomplète) | **Renvoi non démontré, À CLARIFIER** |

**Ce qui n'a pas changé :**
- aucune règle n'a été supprimée ni reformulée, seule la citation est précisée ;
- aucune substitution n'a été faite sur la seule chronologie ;
- le marqueur `À CLARIFIER` est celui déjà employé dans le corpus (par exemple au ch. 13, CE-T03-04).

**Fichier d'application :** [REVUE-R1-corrections.json](REVUE-R1-corrections.json), appliqué par `outils/appliquer-lot5.mjs --fichier=REVUE-R1-corrections.json`.

**Question documentaire ouverte (sans effet sur les règles) :** quelle décision fonde la non-persistance de la phrase et la présence de la ligne Total ? Elle est reportée dans [arbitrages.md](../arbitrages.md), thème « Traçabilité ».
