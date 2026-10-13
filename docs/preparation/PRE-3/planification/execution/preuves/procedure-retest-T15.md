# PRE-3 (#340) — retest ciblé T-15 (dépôt d’une Série)

Ce retest porte uniquement sur T-15. Il dure environ 3 minutes. Les autres lignes de `procedure-retest-recette2.md` restent ouvertes et ne sont pas concernées ici.

Mise à jour à tester : OTA **`01a12fae-53ec-72ca-b260-4e89a5f74e96`**, canal `review`, build iOS 7, commit `a12bb92f`. **Suspendu** : le 12/10 à 14:46, la mise à jour `01a12fae` n’était pas appliquée sur l’iPhone (« Annuler » présent). Ne pas reprendre ce retest avant la résolution du blocage `OTA-NON-APPLIQUEE` (rapport `2026-10-12_PRE3-340_OTA-NON-APPLIQUEE.md`). La version sur laquelle porte le constat T-15 précédent n’est pas vérifiée.

## 0. Charger la bonne mise à jour

1. Ouvrir **Routine Dev** avec le réseau actif. Attendre 20 secondes sur l’écran d’accueil.
2. Fermer complètement l’app : balayer vers le haut dans le sélecteur d’apps.
3. Rouvrir l’app. La mise à jour est appliquée à cette seconde ouverture.
4. **Repère de chargement** : Catalogue › Créer › « Un nouvel exercice » › **Catégorie** › « **Créer une catégorie** ». Si **aucun bouton « Annuler »** n’apparaît sous le champ, c’est la bonne version. Fermer avec ✕.
5. Si « Annuler » est encore visible, refaire les étapes 1 à 3 une fois. S’il l’est toujours, arrêter et le signaler : le retest serait encore fait sur l’ancienne version.

## 1. Geste

| Étape | Action | Attendu |
|---|---|---|
| Préparer | « Créer un exercice » › carte Paramètres. Mode **Durée**, **4** Séries, **Séries variables** activé. Valeurs : 30 s, 45 s, 1 min, 1 min 15 s. | Tableau de 4 lignes |
| Glisser | Poser le doigt sur les **six points** de la ligne 1 et le garder immobile un court instant. Glisser ensuite vers le bas jusqu’entre les lignes 3 et 4, sans relâcher. | La **feuille reste immobile**. La ligne suit le doigt. Un **trait bleu** apparaît entre les lignes 3 et 4. |
| Déposer | Relâcher | Ordre **45 s, 1 min, 30 s, 1 min 15 s**. Chaque durée garde sa pause. Numéros 1 à 4. |
| Variante | Recommencer en glissant **dès** le contact, sans temps d’arrêt | Même résultat |

## 2. À rapporter

- repère de l’étape 0 : « Annuler » absent ou présent ;
- trait bleu : vu ou non ;
- feuille : immobile ou en mouvement ;
- ordre final constaté ;
- résultat de la variante sans temps d’arrêt. Si seule la variante échoue, la cause est différente : le défilement natif démarre avant son blocage. Une autre correction sera alors proposée.
