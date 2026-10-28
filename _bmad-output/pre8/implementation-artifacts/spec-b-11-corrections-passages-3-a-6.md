# B.11 — Corrections après le second passage de la recette iPhone A/B (27/10/2026)

Statut : **done**. Recette iPhone validée par Hermann le 27/10/2026 (« j'ai terminé les tests de recette, avec succès », puis « Je valide les résultats de ces deux epics »). Code recetté : `88c2adde`.

Cette story regroupe, dans le lot A/B et sans nouvel epic, les corrections livrées après B.10. Le détail des causes et des preuves est dans le rapport `.github/orchestration/reports/2026-10-27_PRE8_EPICS_A_B.md`, sections « Correction UX clavier » à « Sixième passage ». Les décisions sont consignées au chapitre 07 et dans CE-MVT-01 §10 (chapitre 13).

| Lot | Réalisation | Commit |
|---|---|---|
| Clavier de la fiche Mouvement | Média et contexte fixes ; le formulaire éditable remonte devant le média, sur une surface claire translucide | `6412580b` |
| Feuille des filtres | Cadre standard des feuilles (poignée, ✕ / ✓ ronds, titre, filet), sur le modèle de `ExecutionParametersSheet` | `a3d568ec` |
| Bouton de lecture vidéo | Ø 72, verre natif iOS 26 (`expo-glass-effect`, arbitrage B), triangle 30 ; vidéo seulement ; ouvre le lecteur système plein écran | `e74f85b1` |
| Troisième passage | Glisser de réordonnancement sans démontage de la carte, Entrée des Phases, clavier de la fiche, menu Niveau natif conservé | `4c44cca2` |
| Quatrième passage | Remontée jusqu'au bas des Phases, jamais redescendue clavier ouvert, au plus sous le fondu du contexte ; contexte inactif clavier ouvert ; clavier stable dans les Phases ; menu Niveau réarmé à chaque ouverture | `5eee0b99` |
| Cinquième passage | Réserve clavier appliquée (le `KeyboardAvoidingView` ne l'écrase plus) : défilement jusqu'à la dernière Phase | `d4cf9785` |
| Sixième passage | Défilement arrêté à la dernière ligne des Phases, juste au-dessus du clavier | `88c2adde` |

| Correctif ultérieur b8-3 (28/10) | Fiche Mouvement (pastille et menu Niveau) alignée sur les rangs des actifs du Catalogue ; b8-3 confirmé par Hermann, option A | `77990e7d` |

## Limites connues

- **Menu Niveau sur iOS (ARBITRAGE ouvert).** Hermann a demandé d'élargir le menu pour que les noms tiennent sur une ligne. Le menu natif d'iOS a une largeur et une taille de texte fixées par le système. Options soumises : A, panneau KODJO sur iOS (exception à la primitive native, autorisation explicite requise) ; B, menu natif et libellés raccourcis ; C, autre ou laisser tel quel. Aucun code n'a été modifié.
- **Filets entre groupes de filtres** : non ajoutés ; à préciser si « barres horizontales » les désigne aussi.
- **VoiceOver (`q6-4`)** : non testé sur l'appareil.
