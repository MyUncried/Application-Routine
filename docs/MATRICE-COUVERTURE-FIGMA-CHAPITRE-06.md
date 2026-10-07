# Matrice de couverture Figma ↔ documentation

**État antérieur au lot Bip de cadence.** La [matrice Bip du07/10](MATRICE-BIP-FIGMA-2026-10-07.md) porte les références courantes et remplace les états de captures en attente.

**Inventaire historique.** La [matrice du 07/10](MATRICE-FIGMA-2026-10-07.md) porte les références actives, notamment le remplacement de 4893:6675.

**Inventaire courant :** [matrice06/10](MATRICE-CADENCE-FIGMA-2026-10-06.md). Ce relevé antérieur conserve sa provenance ; ses empreintes datées ne décrivent pas les PNG réexportés le06/10. Les états6603/6611/6623 ne remplacent plus les frames6407/6411/6423 réintégrées. Cadence/phrase/DSF actifs : paramètres v13, Phrase v1 et DSF-CADENCE-2026-10-06.

**Complément historique02/10 :** [matrice séries variables](MATRICE-SERIES-VARIABLES-2026-10-02.md). Les copies de travail ont été remplacées le03/10 ; la matrice06/10 fait autorité sur les références courantes.

Contrôle exhaustif du 30 septembre 2026 : 113 frames du prototype et les 6 références complémentaires du rapport utilisateur, soit 119 captures Figma. Les 84 écrans du rapport sont couverts (78 dans le prototype). 74 fichiers existants sont actualisés et 45 copies documentaires complètent des écrans déjà présents dans Figma ; aucun écran applicatif ou Figma créé.

L’inventaire du 24 septembre était un état des lieux ; il ne borne plus le contrôle. Sources : fichier Figma `G6RY5Ebhgwb4AHIOYDwwvg`, lecture structurelle des 113 frames de Prototype MVP, pages Profil/Suivi/Archives et rapport utilisateur `ecrans_modifies.md` du 30 septembre. Les noms et identifiants ont été recoupés dans Figma. Les captures sont des exports directs, sans retouche.

## Résultat du second contrôle

- 84/84 références du rapport retrouvées. Les codes ci-dessous reprennent les modifications déclarées dans ce rapport ; ils ne prétendent pas reconstruire un historique Figma indisponible.
- 35 autres frames du prototype examinées et illustrées ; leur absence du rapport ne signifie pas qu’elles seraient inutiles à la documentation.
- 64 exports déjà réalisés conservés ; 55 exports complémentaires décodés et contrôlés visuellement. Chaque fichier est rattaché à un nœud et une empreinte Git.
- Les 6 références hors prototype restent séparées : une cible Profil post-MVP, deux références Suivi hors prototype et trois archives. Elles ne deviennent pas des exigences MVP par leur export.
- Les composants, wireframes Cartes/Icônes et démonstrations d’appui restent des références DSF, pas des écrans applicatifs. La planche responsive `2317:87` reste hors périmètre du rapport.

## Références réconciliées

| Ancienne référence | Traitement courant |
|---|---|
| Heure ouverte `1992:7006` | Référence remplacée, selon la précision du propriétaire, par « Planifier une séance — Test picker rappel personnalisé ouvert » `1992:7187`, illustrée dans « Planifier une séance ou un exercice ». L’ancienne image 8b n’est plus affichée comme preuve active et aucune fonction de réglage d’heure n’est supprimée. |
| Nombre de tours `2028:11580` | Ancienne roulette retirée des références actives. Stepper permanent confirmé dans `2028:11700`, nœud `4913:7432`, 137 × 36. Pas de modale Tours séparée. |
| Catégories `4332:7095` | Nom et contenu actuels : sélection de Catégorie, et non roulette Durée. La durée ouverte reste `3556:7645`. |
| Séries `3556:7801`, répétitions `3561:7673`, semaines `1992:7537` | Steppers intégrés confirmés ; légendes et descriptions des anciennes roulettes corrigées. |
| Recherche `1992:10129`, `1992:10320` | Présentes sur la page Archives : captures conservées dans la section de traçabilité, pas comme états actifs du prototype. |
| Splash `1992:469` | Nom courant « Splash — Kodjo » ; ancienne qualification « proposition métallisée » retirée. |

## Lecture des écarts visuels et des décisions

La capture décrit l’état Figma observé ; elle ne remplace pas une décision métier validée. Hors placement, le trait de démarcation reste présent, indépendamment du contenu. Récupération absente/0 : aucune information de récupération ; aucun point : aucune information de point. Pendant le choix des emplacements, le trait est masqué au profit des contrôles de placement (D-303). Les frames `4738:6355` (Exercice déployé) et `1992:8996` (Suivi déployé) sont historiques hors MVP depuis D-261/D-262 ; elles ne servent plus de cible accessible. Ces écarts d’assemblage n’ouvrent aucun nouvel arbitrage et les PNG ne sont pas retouchés pour les masquer. Les cartes standard ne sont pas déclarées propagées dans les frames qui n’en contiennent pas.

Codes : C cartes ; J cartes Jour ; N navigation ; B commandes contextuelles ; S segmenté à trois options ; I icônes catégorie/zone hors cartes ; P silhouette Profil ; — absent du rapport.

## Prototype MVP

| Source Figma et titre courant | Codes du rapport | Capture actuelle | SHA Git |
|---|---|---|---|
| [Profil — Vue d'ensemble - Vibration désactivée](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-375) — `1992:375` | N | [PNG](Specifications-fonctionnelles/images/ecran-1-profil.png) | `a0a44adce908c1e44b192cd109267df55d0a3d8b` |
| [Splash — Kodjo](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-469) — `1992:469` | — | [PNG](Specifications-fonctionnelles/images/ecran-0-splash-kodjo.png) | `6b0730794fa14d507a89d728c3ccf32d91cdd4e4` |
| [Profil — Stepper Pause changement de côté](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-474) — `1992:474` | N | [PNG](Specifications-fonctionnelles/images/ecran-1c-profil-compte-rebours-ouvert.png) | `61a379f1fce83de265ca06174f415514b037587b` |
| [Profil — Stepper Récupération après activité](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-579) — `1992:579` | N | [PNG](Specifications-fonctionnelles/images/ecran-1d-profil-fin-seance-ouverte.png) | `a6e65fb0413876e79a6b8501c3a2345a4e6cee34` |
| [Profil — Vue d'ensemble - Vibration activée](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-684) — `1992:684` | N | [PNG](Specifications-fonctionnelles/images/ecran-1b-profil-vibration-activee.png) | `350b8446bb2cc271a4237c4cc5c4315e5cf185d4` |
| [Profil — Modifier le profil — MVP](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-778) — `1992:778` | IP | [PNG](Specifications-fonctionnelles/images/ecran-1a-modifier-profil.png) | `f669f397705650bffb08ba53e976fe12a0a9513b` |
| [Calendrier — Semaine](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-5101) — `1992:5101` | CNS | [PNG](Specifications-fonctionnelles/images/ecran-7a-calendrier-semaine.png) | `0ca1c7d530bf92c8acb6a59945f0c0459cbfff70` |
| [Calendrier — Mois](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-5237) — `1992:5237` | NS | [PNG](Specifications-fonctionnelles/images/ecran-7b-calendrier-mois.png) | `837c3b38b08444e69c7a66c6e916c92c23fbc48e` |
| [Modal — Supprimer une planification unique — Calendrier](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-5365) — `1992:5365` | CNS | [PNG](Specifications-fonctionnelles/images/modale-4-suppression-planification-unique.png) | `bd262a6a7ff3baeb928147c009a0303fa57212bc` |
| [Calendrier — Jour — MVP](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-5510) — `1992:5510` | CJNS | [PNG](Specifications-fonctionnelles/images/ecran-7-calendrier-jour.png) | `f244636fa09ba76f4ea2ee5462ec4d9515c0ee2e` |
| [Calendrier — Jour — Appui long — MVP](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-5602) — `1992:5602` | CJNS | [PNG](Specifications-fonctionnelles/images/ecran-7c-calendrier-jour-appui-long.png) | `7d4545147c23834526da74d4922827fb2576950d` |
| [Calendrier — Jour — MAJ — MVP](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-5697) — `1992:5697` | CJNS | [PNG](Specifications-fonctionnelles/images/ecran-7f-calendrier-jour-apres-planification.png) | `fee928c4e02b4ff65fc5b33468fd51533d600311` |
| [Calendrier — Jour — Créneau à planifier — MVP](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-5794) — `1992:5794` | CJNS | [PNG](Specifications-fonctionnelles/images/ecran-7e-calendrier-creneau-a-planifier.png) | `4e76623e7799ab52735808ec8f2987cb35af359b` |
| [Calendrier — Semaine — Actions glissées](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-5962) — `1992:5962` | CNS | [PNG](Specifications-fonctionnelles/images/ecran-7j-calendrier-semaine-actions.png) | `777be1a8cd21ec7d71dfce49472a42b91ff2cc42` |
| [Modal — Supprimer des occurrences — Calendrier](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-6102) — `1992:6102` | CNS | [PNG](Specifications-fonctionnelles/images/modale-4a-suppression-occurrences.png) | `7fe6f7b619f880788e647de995c4ed76ec1b9be6` |
| [Modal — Choisir une séance — Planification — Liste longue](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-6249) — `1992:6249` | CNS | [PNG](Specifications-fonctionnelles/images/ecran-7d-calendrier-choisir-seance.png) | `3ad6ee4f308c71a66d9e9ba35d39f257034358a7` |
| [Calendrier — Semaine — Séance déployée](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-6389) — `1992:6389` | CNS | [PNG](Specifications-fonctionnelles/images/ecran-7i-calendrier-semaine-deployee.png) | `3f0b24b221f6ed22a7fa6768d204ecdd8113c7e6` |
| [Planifier une séance — Test picker date ouvert](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-6622) — `1992:6622` | NS | [PNG](Specifications-fonctionnelles/images/ecran-8a-planifier-date-ouverte.png) | `ac9806ad9268d99e74539f6c47ce9164199665c4` |
| [Planifier une séance — Création](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-6838) — `1992:6838` | NS | [PNG](Specifications-fonctionnelles/images/ecran-8-planifier-seance.png) | `af463996732e0f1934068882cd3ec41fc061cdb0` |
| [Planifier une séance — Test picker rappel personnalisé ouvert](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-7187) — `1992:7187` | NS | [PNG](Specifications-fonctionnelles/images/ecran-8c-planifier-rappel-ouvert.png) | `6ffe9788be3a7c03e031f0c309ddf4f9914de848` |
| [Planifier une séance — Test rappel personnalisé sélectionné](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-7369) — `1992:7369` | NS | [PNG](Specifications-fonctionnelles/images/ecran-8d-planifier-rappel-selectionne.png) | `23e46f5442c9d106d639137523e4c4a82f30a19b` |
| [Planifier une séance — Stepper Nombre de semaines](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-7537) — `1992:7537` | NS | [PNG](Specifications-fonctionnelles/images/ecran-8e-planifier-semaines-ouvert.png) | `514a33504f94107c8fd7e3a7bff93c0cfd40639c` |
| [Planifier une séance — Aucune répétition](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-7716) — `1992:7716` | NS | [PNG](Specifications-fonctionnelles/images/ecran-8f-planifier-sans-repetition.png) | `5ab0e33ab81c83f3d0c04f14b72c08c9ff666b40` |
| [Planifier une séance — Chioisir la séance](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-7861) — `1992:7861` | CNS | [PNG](Specifications-fonctionnelles/images/ecran-8g-planifier-changer-seance.png) | `babd00ec27c68fedf832b44b4173f78a022a46e8` |
| [Exécution d'une séance — Démarrée](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-8132) — `1992:8132` | — | [PNG](Specifications-fonctionnelles/images/ecran-9-execution-seance.png) | `c79f117df0e7c2796bddcf6ce43e40298d9d0844` |
| [Exécution d'un exercice — Démarrée](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4968-8188) — `4968:8188` | — | [PNG](Specifications-fonctionnelles/images/figma-4968-8188.png) | `bbc768307d0673a9c12b4f0f7fe5f5cb20db5b84` |
| [Modal — Réinitialiser l’activité](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-8224) — `1992:8224` | — | [PNG](Specifications-fonctionnelles/images/modale-5-reinitialiser-activite.png) | `c6d0e99d37a47964ca992f03744b05506d01b820` |
| [Modal — Passer à l’activité suivante](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-8326) — `1992:8326` | — | [PNG](Specifications-fonctionnelles/images/modale-6-activite-suivante.png) | `db29f49d57b075ac25837bb0b8c2776af11efd7b` |
| [Modal — Séance en pause](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-8428) — `1992:8428` | — | [PNG](Specifications-fonctionnelles/images/modale-7-seance-en-pause.png) | `130173331938c0603432e16a6223c6b49a01137f` |
| [Exécution d'une séance — Démarrée — Bips et vocal désactivés](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-8530) — `1992:8530` | — | [PNG](Specifications-fonctionnelles/images/ecran-9b-execution-sons-annonces-desactives.png) | `ccb454c6ec26b5d9442ce57046c22e835730d8f5` |
| [Exécution d'une séance — Initial](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-8626) — `1992:8626` | — | [PNG](Specifications-fonctionnelles/images/ecran-9a-execution-etat-initial.png) | `b3bf8661fe4d9007f673fb53060434ccfbd64af8` |
| [Synthèse de séance — Terminée —  Évaluation initiale](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-8718) — `1992:8718` | — | [PNG](Specifications-fonctionnelles/images/ecran-10a-synthese-evaluation-initiale.png) | `a0f4fc22afab5d345ead317614bf797beb765c92` |
| [Synthèse de séance — Terminée — Ressenti sélectionné](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-8780) — `1992:8780` | — | [PNG](Specifications-fonctionnelles/images/ecran-10-synthese-seance.png) | `4937fade8ae1a80c36d57c084af17a14876debe3` |
| [Synthèse d'exécution — Exercice Terminé —  Évaluation initiale](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4968-8055) — `4968:8055` | — | [PNG](Specifications-fonctionnelles/images/figma-4968-8055.png) | `1ee35bfe4da7e9fa3c3299acf49325d5199778a0` |
| [Synthèse d'exécution — Exercice Terminé —  Ressenti sélectionné](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4968-8105) — `4968:8105` | — | [PNG](Specifications-fonctionnelles/images/figma-4968-8105.png) | `6aa71b970506688a182f19935357aa5dadc63d33` |
| [Synthèse de séance — Partielle — Évaluation initiale](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4760-6448) — `4760:6448` | — | [PNG](Specifications-fonctionnelles/images/figma-4760-6448.png) | `cca20f57f76db8dd68a3d0578f2a46d658293fd7` |
| [Synthèse de séance — Partielle — Ressenti sélectionné](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4760-6500) — `4760:6500` | — | [PNG](Specifications-fonctionnelles/images/figma-4760-6500.png) | `5f23ef8bf1adeaded110aa1a81a7cbd4d0ce385f` |
| [Suivi — Séances — Liste condensée](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-8843) — `1992:8843` | CNBS | [PNG](Specifications-fonctionnelles/images/ecran-11-suivi-condense.png) | `7175acebdfa2df05d7a47dc3fae9ce5406c5fc9a` |
| [Suivi — Séances — Vue déployée](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-8996) — `1992:8996` | CNBS | [PNG](Specifications-fonctionnelles/images/ecran-11a-suivi-deploye.png) | `135d7b84233a26d72d411fbaa6e4fdae7379e69b` | <!-- Historique hors MVP : D-261/D-262 -->
| [Catalogue des séances — Liste par défaut](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-9910) — `1992:9910` | CNBS | [PNG](Specifications-fonctionnelles/images/ecran-2-catalogue-seances.png) | `7f9169f212d7a6673d7f7d08acc54f6e5ab4ab6d` |
| [Catalogue des séances — Séance déployée](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-10014) — `1992:10014` | CNBS | [PNG](Specifications-fonctionnelles/images/ecran-2b-catalogue-seance-deployee.png) | `fd124699b95f8ae7211b859500ad24231db5c47c` |
| [Catalogue des séances — Liste condensée — actions glissées](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-10518) — `1992:10518` | CNBS | [PNG](Specifications-fonctionnelles/images/ecran-2d-catalogue-condense-actions.png) | `ee117ca78bbfdfc0da24abb12cce28ed291441fe` |
| [Catalogue des séances — Séance déployée — actions glissées](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-10628) — `1992:10628` | CNBS | [PNG](Specifications-fonctionnelles/images/ecran-2e-catalogue-deployee-actions.png) | `72ddd098e4cee8e34f84541face514147b55452c` |
| [Catalogue des séances — Archivées — Séance restaurée](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-10848) — `1992:10848` | CNBS | [PNG](Specifications-fonctionnelles/images/ecran-2g-catalogue-seance-restauree.png) | `fec2e085fc5cd936296205b56068565e14a9a290` |
| [Catalogue des séances — Liste sans Renforcement du genou](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-10937) — `1992:10937` | CNBS | [PNG](Specifications-fonctionnelles/images/ecran-2h-catalogue-apres-archivage.png) | `fed22b502a386e12e5ad72b70e2aff4a1796e63c` |
| [Composition séance — Initial](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=2028-11137) — `2028:11137` | B | [PNG](Specifications-fonctionnelles/images/ecran-3b-composition-etat-initial.png) | `d1d776840c5fdeefe8432c84d657f9565b1e0d1f` |
| [Composition séance — Étiquettes](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=2028-11204) — `2028:11204` | B | [PNG](Specifications-fonctionnelles/images/figma-2028-11204.png) | `86faba44738cde82fd933026facecf0108894d15` |
| [Composition séance — Abandon](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=2028-11298) — `2028:11298` | B | [PNG](Specifications-fonctionnelles/images/modale-1-abandon-creation-seance.png) | `638253aaf581fabcab30e9ad88c0dc3356afe89b` |
| [Composition séance — Compte à rebours](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=2028-11375) — `2028:11375` | B | [PNG](Specifications-fonctionnelles/images/ecran-3e-composition-compte-rebours-ouvert.png) | `141adbf039ca987ebf95e850342be9b798673c76` |
| [Composition séance — Fin](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=2028-11457) — `2028:11457` | B | [PNG](Specifications-fonctionnelles/images/ecran-3f-composition-fin-seance-ouverte.png) | `e61b1b5aaf709865efd999047c625a498db68399` |
| [Composition séance — Standard](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=2028-11700) — `2028:11700` | B | [PNG](Specifications-fonctionnelles/images/ecran-3-composition-seance.png) | `d8eea50e18742cc8a0fc24b41354eb97564eafa9` |
| [Composition séance — Actions glissées](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=2028-11808) — `2028:11808` | B | [PNG](Specifications-fonctionnelles/images/ecran-3a-composition-actions-glissees.png) | `3d848990aa2f54052f203ff10dbe31db88091af1` |
| [Composition séance — Nom saisi](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=2028-12003) — `2028:12003` | B | [PNG](Specifications-fonctionnelles/images/ecran-3c-composition-nom-renseigne.png) | `84852f6e29ec063b6077412d7b49133e2dc59754` |
| [Calendrier — Jour suivant — Glissement gauche — MVP](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=2059-267) — `2059:267` | CJNS | [PNG](Specifications-fonctionnelles/images/ecran-7g-calendrier-jour-suivant.png) | `f94c3d3568771b8aedb6e4d2fa028bc9e8c7bf19` |
| [Calendrier — Semaine — Après suppression d’une planification](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=2074-86) — `2074:86` | CNS | [PNG](Specifications-fonctionnelles/images/ecran-7l-calendrier-apres-suppression.png) | `552042355fc4369dc8e2598be6434b40a8b01fc4` |
| [Calendrier — Semaine — Étirements — Actions glissées](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=2094-86) — `2094:86` | CNS | [PNG](Specifications-fonctionnelles/images/ecran-7k-calendrier-etirements-actions.png) | `8c66fe5f7e32a7c49deb1dad9f88a219fc60cd86` |
| [Catalogue des séances — État vide](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=2117-86) — `2117:86` | NBS | [PNG](Specifications-fonctionnelles/images/ecran-2i-catalogue-vide.png) | `f12658d0e244ea1f6f2ead109378e6e9f039933c` |
| [Suivi — Séances — État vide](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=2117-190) — `2117:190` | NBS | [PNG](Specifications-fonctionnelles/images/ecran-11b-suivi-vide.png) | `386dc0f10e2e1f7aabc3566ace3b5ff60f2b69a3` |
| [Calendrier — Jour — État vide](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=2128-86) — `2128:86` | NS | [PNG](Specifications-fonctionnelles/images/ecran-7m-calendrier-vide.png) | `e6a4714cf95b2abd6f16a0a03461e0266f4794ef` |
| [Profil — Vue d'ensemble — Parcours vide](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=2139-86) — `2139:86` | N | [PNG](Specifications-fonctionnelles/images/ecran-1e-profil-parcours-vide.png) | `350b8446bb2cc271a4237c4cc5c4315e5cf185d4` |
| [Catalogue des séances — Archivées — actions glissées](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=2234-88) — `2234:88` | CNBS | [PNG](Specifications-fonctionnelles/images/modale-3-seance-archivee-action-supprimer.png) | `7f46d5ca3f75c848317ac84b6c9732b7fde63fe9` |
| [Modal — Confirmer la suppression d’une séance archivée](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=2234-189) — `2234:189` | CNBS | [PNG](Specifications-fonctionnelles/images/modale-3a-confirmer-suppression-seance-archivee.png) | `92c9c185d593ddcbd9671fc585a90223bc50d557` |
| [Calendrier — Semaine — Mardi sélectionné](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=2252-86) — `2252:86` | CNS | [PNG](Specifications-fonctionnelles/images/ecran-7h-calendrier-semaine-mardi.png) | `406b0d735b3b67d3415eba04c3d0582f4d7790cf` |
| [Composition séance — Déplacement](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=3518-4576) — `3518:4576` | B | [PNG](Specifications-fonctionnelles/images/ecran-3h-composition-appui-long.png) | `b4f4aab2847a880129bb1e9d3f6b69c5fc0274c3` |
| [Création activité — Avant Paramètres d'exécution](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=3542-4656) — `3542:4656` | — | [PNG](Specifications-fonctionnelles/images/ecran-4-creation-activite-duree.png) | `074482e3abca16eee80056329741a8c703fd6cd4` |
| [Ajouter un exercice — Initial](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=3943-6064) — `3943:6064` | BI | [PNG](Specifications-fonctionnelles/images/figma-3943-6064.png) | `5dfb6a27e496ddaa6345a7058ed01493f0ff5e18` |
| [Ajouter un exercice — Durée de l'exerciceouvert](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=3556-7645) — `3556:7645` | — | [PNG](Specifications-fonctionnelles/images/ecran-4c-creation-activite-duree-ouverte.png) | `d7d09d9eaf91bfe083ab5f70b5c0e3e367c8faf6` |
| [Ajouter un exercice — Pause — sélecteur ouvert](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=3556-7712) — `3556:7712` | — | [PNG](Specifications-fonctionnelles/images/ecran-4d-creation-activite-pause-ouverte.png) | `65ca24071fc319b7e356b3eb755cb41e31df2169` |
| [Ajouter un exercice — Contrôle déployé — 3 séries (stepper)](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=3556-7801) — `3556:7801` | — | [PNG](Specifications-fonctionnelles/images/ecran-4e-creation-activite-series-ouvert.png) | `2aeed751659c9dd7c09f15380d6087ba5e11e846` |
| [Ajouter un exercice — Répétitions](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=3561-7673) — `3561:7673` | — | [PNG](Specifications-fonctionnelles/images/ecran-4f-creation-activite-repetitions-ouvert.png) | `2e2e4826bfb8a3fdf434783d292658beccbefcd1` |
| [Création activité — À l’échec](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=3561-7802) — `3561:7802` | — | [PNG](Specifications-fonctionnelles/images/ecran-4b-creation-activite-a-l-echec.png) | `3de8478a337eecc593f8114cc5cd8a8c70183dd6` |
| [Création activité — Durée totale ajustée — message temporaire](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=3580-4957) — `3580:4957` | — | [PNG](Specifications-fonctionnelles/images/ecran-4k-creation-activite-duree-ajustee.png) | `6f4a8a7f079c3e955c24c94b23efe90c3ab05b2e` |
| [Composition séance — Point d’arrêt](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=3722-5061) — `3722:5061` | B | [PNG](Specifications-fonctionnelles/images/figma-3722-5061.png) | `09e30b2b5c696b5c6f9873f9c3c992ccf37e740d` |
| [Composition séance — Étiquette sélectionnée](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4581-6404) — `4581:6404` | B | [PNG](Specifications-fonctionnelles/images/figma-4581-6404.png) | `14210afbb2709d0d273743f5e956555ef4de3202` |
| [Modification d'une séance](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=5271-5455) — `5271:5455` | B | [PNG](Specifications-fonctionnelles/images/figma-5271-5455.png) | `79925e86f242cfa956be9f62d6c896b319c90d18` |
| [Catalogue des Exercices — Liste](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=3786-5093) — `3786:5093` | CNBS | [PNG](Specifications-fonctionnelles/images/ecran-12-catalogue-activites-liste.png) | `910e87af88debdacc36aa6904ddf902c02db6546` |
| [Composition séance — Sélection exercices](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=3789-5349) — `3789:5349` | CB | [PNG](Specifications-fonctionnelles/images/ecran-14-selection-activites-existantes.png) | `6e42ebe3396f7f31d7ffa19e0713fcdca8bc35e1` |
| [Catalogue des séances — Filtrer — Panneau ouvert](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4168-11149) — `4168:11149` | CNBS | [PNG](Specifications-fonctionnelles/images/figma-4168-11149.png) | `ba5a14d0c06ddcbb394586c8a3e441a49df9e13f` |
| [Catalogue des Exercices — Filtrer — Panneau ouvert](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4168-11262) — `4168:11262` | CNBS | [PNG](Specifications-fonctionnelles/images/figma-4168-11262.png) | `47cd2f6e25af56e05a90457052a6e6c640bd223e` |
| [Modal — Confirmer l’archivage d’une séance planifiée](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4593-6285) — `4593:6285` | CNBS | [PNG](Specifications-fonctionnelles/images/figma-4593-6285.png) | `c6d7b1ba41223584049b73bc771814f464b57808` |
| [Ajouter un exercice — Nom Description Media](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4217-6980) — `4217:6980` | BI | [PNG](Specifications-fonctionnelles/images/ecran-15-creation-activite-persistante.png) | `bfdac38156e0a32396c31ee7753dd8825884de21` |
| [Ajouter un exercice — Catégorie renseignée](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=5088-6398) — `5088:6398` | BI | [PNG](Specifications-fonctionnelles/images/figma-5088-6398.png) | `b5b07d2461ed0db8f81b6716a1a8011722dd7c27` |
| [Ajouter un exercice — Phrase éditée](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4279-7044) — `4279:7044` | — | [PNG](Specifications-fonctionnelles/images/figma-4279-7044.png) | `453e4efd25d7d40fb77435d37daba22f71314e02` |
| [Modifier un exercice](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4734-6342) — `4734:6342` | — | [PNG](Specifications-fonctionnelles/images/ecran-15a-modification-activite-persistante.png) | `1f864f14e20ac5270a86cfc6f26c646ad9e58307` |
| [Ajouter un exercice — Catégories](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4332-7095) — `4332:7095` | BI | [PNG](Specifications-fonctionnelles/images/figma-4332-7095.png) | `91ae1ffd8e15fd33a2f9c3d189faea41562cf6d5` |
| [Ajouter un exercice — Mode d’exécution (3 pastilles)](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4367-7128) — `4367:7128` | — | [PNG](Specifications-fonctionnelles/images/figma-4367-7128.png) | `8c1fcbac7f471abc6f3e60216b2be6d57522c97b` |
| [Modèle paramètre — Compte à rebours](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4367-7276) — `4367:7276` | — | [PNG](Specifications-fonctionnelles/images/figma-4367-7276.png) | `70d8f3a8296e9d848bc9e7443fc325bcbde91d42` |
| [Ajouter un exercice — Changement de côté (3 pastilles)](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4367-7906) — `4367:7906` | — | [PNG](Specifications-fonctionnelles/images/figma-4367-7906.png) | `5ae8072009f03a33d8d0a39089502817e46a9b9c` |
| [Modèle paramètre — Durée totale — Roulette ouverte](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4367-8193) — `4367:8193` | — | [PNG](Specifications-fonctionnelles/images/figma-4367-8193.png) | `500bb42f1d614469203362b8c9a4bc2637ab80cf` |
| [Ajouter un exercice — Nouvelle catégorie](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4474-7157) — `4474:7157` | BI | [PNG](Specifications-fonctionnelles/images/figma-4474-7157.png) | `b16a117fccd4f1b8ecd119d3b6e5e6bb865d568a` |
| [Ajouter un exercice — Zones corporelles](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4478-7209) — `4478:7209` | BI | [PNG](Specifications-fonctionnelles/images/ecran-4h-creation-activite-zone-corporelle.png) | `d791e6275a6be79aec443d404887eaa072fc4de8` |
| [Catalogue des exercices — État vide](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4521-6220) — `4521:6220` | NBS | [PNG](Specifications-fonctionnelles/images/figma-4521-6220.png) | `7f9fe46754c7124eb93255abece4ac7fced7e8ab` |
| [Catalogue des Exercices — Liste — Filtre inactif étendu](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4544-6344) — `4544:6344` | CNBS | [PNG](Specifications-fonctionnelles/images/figma-4544-6344.png) | `82a3272658818d19bce1d242d31aeee03986249a` |
| [Catalogue des Exercices — Liste — Filtre actif étendu](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4544-6651) — `4544:6651` | CNBS | [PNG](Specifications-fonctionnelles/images/figma-4544-6651.png) | `8170693a9ffe6a38525805a4bbf4922b614ea1db` |
| [Catalogue des séances — Liste — Filtre inactif étendu](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4549-6382) — `4549:6382` | CNBS | [PNG](Specifications-fonctionnelles/images/figma-4549-6382.png) | `fc9bdc26f4520001bdbbdbf7b7034fd20b603957` |
| [Catalogue des séances — Filtre actif Archivé](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4549-6742) — `4549:6742` | CNBS | [PNG](Specifications-fonctionnelles/images/ecran-2f-catalogue-archivees.png) | `4d58c9a2d5da36b51e3e9f987ddc582240159449` |
| [Catalogue des séances — Liste condensée — actions glissées — Dos et mobilité](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4592-6217) — `4592:6217` | CNBS | [PNG](Specifications-fonctionnelles/images/figma-4592-6217.png) | `cd20bf170b8e516d001b65f42dd49aa0e4450894` |
| [Composition séance — Nouvelle étiquette](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4640-6308) — `4640:6308` | B | [PNG](Specifications-fonctionnelles/images/figma-4640-6308.png) | `d42c6c7817381017fe478ddf72c0c11b94a86f1b` |
| [Ajouter un exercice — Nouvelle zone corporelle](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4683-6336) — `4683:6336` | BI | [PNG](Specifications-fonctionnelles/images/figma-4683-6336.png) | `48f9dcac9d88af2e57aa9c6928564f7e6ab14505` |
| [Modal — Abandonner la création de l’activité](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4714-6241) — `4714:6241` | — | [PNG](Specifications-fonctionnelles/images/figma-4714-6241.png) | `a7f65dfa058f94e1e2a4231aa146a2c1630bd541` |
| [Catalogue des Exercices — Liste — actions glissées](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4738-6209) — `4738:6209` | CNBS | [PNG](Specifications-fonctionnelles/images/figma-4738-6209.png) | `68ec9355429c29a521cca1a5f571217d7bb22116` |
| [Catalogue des Exercices — Liste — Première carte déployée — Média](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4738-6355) — `4738:6355` | CNBS | [PNG](Specifications-fonctionnelles/images/figma-4738-6355.png) | `6c53d2414ac97eea115fe558bef7a78977ec26db` | <!-- Historique hors MVP : D-261/D-262 -->
| [Composition séance — Étiquettes — Appui long — Confirmation suppression](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4861-6145) — `4861:6145` | — | [PNG](Specifications-fonctionnelles/images/figma-4861-6145.png) | `cb9112f1c48e4fefa3674fdeabf62f00b58093d5` |
| [Ajouter un exercice — Catégorie — Appui long — Confirmation suppression](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4861-6259) — `4861:6259` | BI | [PNG](Specifications-fonctionnelles/images/figma-4861-6259.png) | `2a1735abb723f92b2c3b4d4209b2929d53326012` |
| [Ajouter un exercice — Zones corporelles — Appui long — Confirmation suppression](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4861-6348) — `4861:6348` | — | [PNG](Specifications-fonctionnelles/images/figma-4861-6348.png) | `f90a950055146ed9e6bbd6cf268183666656f9d9` |
| [Composition d’une séance — Placement d’un point d’arrêt](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4893-6675) — `4893:6675` | B | [PNG](Specifications-fonctionnelles/images/figma-4893-6675.png) | `f858d9c4422a946a3ae0c0118cd90801609534f2` |
| [Exécution d'un exercice — Initial — Bascule basse (média) avec Cercle](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=4997-6113) — `4997:6113` | — | [PNG](Specifications-fonctionnelles/images/figma-4997-6113.png) | `ab84be06247b1c50e945af6d607fa76e18c61222` |
| [Exécution d'un exercice — Initial — Bascule haute avec média](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=5588-4363) — `5588:4363` | — | [PNG](Specifications-fonctionnelles/images/figma-5588-4363.png) | `6c046491e529ecfb312fefb38d00df312955de37` |
| [Exécution d'un exercice — Média plein écran](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=5009-6069) — `5009:6069` | — | [PNG](Specifications-fonctionnelles/images/figma-5009-6069.png) | `39213185e0c7d1e6c22c27562093413a31c0990a` |
| [Exécution d'un exercice — Initial - Cercle avec Texte](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=5021-5994) — `5021:5994` | — | [PNG](Specifications-fonctionnelles/images/figma-5021-5994.png) | `68999dd3ef8e5f32ff6690aa1370e63aac4ccdbe` |
| [Exécution d'un exercice — Démarré —  Bascule haute avec texte](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=5581-4257) — `5581:4257` | — | [PNG](Specifications-fonctionnelles/images/figma-5581-4257.png) | `761e80ad565ce193ffa5c2af026e8ea363302801` |
| [Composition séance — Retirer un point d’arrêt](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=5301-5443) — `5301:5443` | B | [PNG](Specifications-fonctionnelles/images/figma-5301-5443.png) | `750562ba4e47bf2e79eaf63da3f078c2e1407040` |
| [Modal — Choisir un exercice — Planification — Liste longue](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=5451-4272) — `5451:4272` | CNS | [PNG](Specifications-fonctionnelles/images/figma-5451-4272.png) | `34a70bcbc6948c3bf489661a9ef14ee582b254a5` |

## Profil

| Source Figma et titre courant | Codes du rapport | Capture actuelle | SHA Git |
|---|---|---|---|
| [Profil — Cible post-MVP](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1354-182) — `1354:182` | N | [PNG](Specifications-fonctionnelles/images/figma-1354-182.png) | `e4d7308a98dea98901b082b1e1d0044bbb5da435` |

## Suivi

| Source Figma et titre courant | Codes du rapport | Capture actuelle | SHA Git |
|---|---|---|---|
| [Suivi — Séances — Vue déployée](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1842-2) — `1842:2` | NS | [PNG](Specifications-fonctionnelles/images/figma-1842-2.png) | `74b071520d8e7d1979590a1a1fca3998910d016b` |
| [Suivi — Vue d’ensemble](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=3401-86) — `3401:86` | N | [PNG](Specifications-fonctionnelles/images/figma-3401-86.png) | `1a1ff1e2311b6d2cdc7e906093834ed71e782f03` |

## Archives

| Source Figma et titre courant | Codes du rapport | Capture actuelle | SHA Git |
|---|---|---|---|
| [Recherche globale — Champ déployé](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-10129) — `1992:10129` | NS | [PNG](Specifications-fonctionnelles/images/ecran-2c-recherche-globale-champ.png) | `696d54242bca0c09ab88ab08c336363b7cac3bc1` |
| [Recherche globale — Résultats affichés](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=1992-10320) — `1992:10320` | NS | [PNG](Specifications-fonctionnelles/images/ecran-2a-recherche-globale-resultats.png) | `17e90cecc2e48d9f1637991baf47ea453216d0ee` |
| [HISTORIQUE — Catalogue Séances — ancien arbre Créer — supersédé D-187](https://www.figma.com/design/G6RY5Ebhgwb4AHIOYDwwvg?node-id=3841-8375) — `3841:8375` | NS | [PNG](Specifications-fonctionnelles/images/ecran-13a-catalogue-seances-creer-arbre.png) | `42a7a28c3e2eaf3d6ce6d8f449b740377fc0cc6e` |

## Organisation du chapitre 06 — correction du 30 septembre 2026

Les captures sont intégrées en Markdown standard et regroupées dans leur famille. Les identifiants Figma et chemins d’images restent stables ; la numérotation des écrans n’est plus utilisée pour organiser le chapitre. Les anciennes captures de préparation/exécution directe et de synthèse directe ne sont plus affichées comme références actives. La préparation de 5 s et les règles de l’exécution directe restent documentées dans la famille Exécution. Aucun écran Figma n’a été créé ou modifié.

| Source Figma | Famille dans le chapitre 06 | Nature |
|---|---|---|
| `1992:375` — Profil — Vue d'ensemble - Vibration désactivée | Profil | Vues principales et états intégrés |
| `1992:469` — Splash — Kodjo | Splash KODJO | Vues principales et états intégrés |
| `1992:474` — Profil — Stepper Pause changement de côté | Profil | Vues principales et états intégrés |
| `1992:579` — Profil — Stepper Récupération après activité | Profil | Vues principales et états intégrés |
| `1992:684` — Profil — Vue d'ensemble - Vibration activée | Profil | Vues principales et états intégrés |
| `1992:778` — Profil — Modifier le profil — MVP | Profil | Vues principales et états intégrés |
| `1992:5101` — Calendrier — Semaine | Calendrier | Vues principales et états intégrés |
| `1992:5237` — Calendrier — Mois | Calendrier | Vues principales et états intégrés |
| `1992:5365` — Modal — Supprimer une planification unique — Calendrier | Calendrier | Modales, panneaux et confirmations |
| `1992:5510` — Calendrier — Jour — MVP | Calendrier | Vues principales et états intégrés |
| `1992:5602` — Calendrier — Jour — Appui long — MVP | Calendrier | Vues principales et états intégrés |
| `1992:5697` — Calendrier — Jour — MAJ — MVP | Calendrier | Vues principales et états intégrés |
| `1992:5794` — Calendrier — Jour — Créneau à planifier — MVP | Calendrier | Vues principales et états intégrés |
| `1992:5962` — Calendrier — Semaine — Actions glissées | Calendrier | Vues principales et états intégrés |
| `1992:6102` — Modal — Supprimer des occurrences — Calendrier | Calendrier | Modales, panneaux et confirmations |
| `1992:6249` — Modal — Choisir une séance — Planification — Liste longue | Planifier une séance ou un exercice | Modales, panneaux et confirmations |
| `1992:6389` — Calendrier — Semaine — Séance déployée | Calendrier | Vues principales et états intégrés |
| `1992:6622` — Planifier une séance — Test picker date ouvert | Planifier une séance ou un exercice | Modales, panneaux et confirmations |
| `1992:6838` — Planifier une séance — Création | Planifier une séance ou un exercice | Vues principales et états intégrés |
| `1992:7187` — Planifier une séance — Test picker rappel personnalisé ouvert | Planifier une séance ou un exercice | Modales, panneaux et confirmations |
| `1992:7369` — Planifier une séance — Test rappel personnalisé sélectionné | Planifier une séance ou un exercice | Vues principales et états intégrés |
| `1992:7537` — Planifier une séance — Stepper Nombre de semaines | Planifier une séance ou un exercice | Vues principales et états intégrés |
| `1992:7716` — Planifier une séance — Aucune répétition | Planifier une séance ou un exercice | Vues principales et états intégrés |
| `1992:7861` — Planifier une séance — Chioisir la séance | Planifier une séance ou un exercice | Modales, panneaux et confirmations |
| `1992:8132` — Exécution d'une séance — Démarrée | Exécution — séance ou exercice | Vues principales et états intégrés |
| `4968:8188` — Exécution d'un exercice — Démarrée | Exécution — séance ou exercice | Vues principales et états intégrés |
| `1992:8224` — Modal — Réinitialiser l’activité | Exécution — séance ou exercice | Modales, panneaux et confirmations |
| `1992:8326` — Modal — Passer à l’activité suivante | Exécution — séance ou exercice | Modales, panneaux et confirmations |
| `1992:8428` — Modal — Séance en pause | Exécution — séance ou exercice | Modales, panneaux et confirmations |
| `1992:8530` — Exécution d'une séance — Démarrée — Bips et vocal désactivés | Exécution — séance ou exercice | Vues principales et états intégrés |
| `1992:8626` — Exécution d'une séance — Initial | Exécution — séance ou exercice | Vues principales et états intégrés |
| `1992:8718` — Synthèse de séance — Terminée —  Évaluation initiale | Synthèse — séance ou exercice | Vues principales et états intégrés |
| `1992:8780` — Synthèse de séance — Terminée — Ressenti sélectionné | Synthèse — séance ou exercice | Vues principales et états intégrés |
| `4968:8055` — Synthèse d'exécution — Exercice Terminé —  Évaluation initiale | Synthèse — séance ou exercice | Vues principales et états intégrés |
| `4968:8105` — Synthèse d'exécution — Exercice Terminé —  Ressenti sélectionné | Synthèse — séance ou exercice | Vues principales et états intégrés |
| `4760:6448` — Synthèse de séance — Partielle — Évaluation initiale | Synthèse — séance ou exercice | Vues principales et états intégrés |
| `4760:6500` — Synthèse de séance — Partielle — Ressenti sélectionné | Synthèse — séance ou exercice | Vues principales et états intégrés |
| `1992:8843` — Suivi — Séances — Liste condensée | Suivi — Séances | Vues principales et états intégrés |
| `1992:8996` — Suivi — Séances — Vue déployée | Suivi — Séances | Vues principales et états intégrés | <!-- Historique hors MVP : D-261/D-262 -->
| `1992:9910` — Catalogue des séances — Liste par défaut | Catalogue des séances | Vues principales et états intégrés |
| `1992:10014` — Catalogue des séances — Séance déployée | Catalogue des séances | Vues principales et états intégrés |
| `1992:10518` — Catalogue des séances — Liste condensée — actions glissées | Catalogue des séances | Vues principales et états intégrés |
| `1992:10628` — Catalogue des séances — Séance déployée — actions glissées | Catalogue des séances | Vues principales et états intégrés |
| `1992:10848` — Catalogue des séances — Archivées — Séance restaurée | Catalogue des séances | Vues principales et états intégrés |
| `1992:10937` — Catalogue des séances — Liste sans Renforcement du genou | Catalogue des séances | Vues principales et états intégrés |
| `2028:11137` — Composition séance — Initial | Composition d’une séance | Vues principales et états intégrés |
| `2028:11204` — Composition séance — Étiquettes | Composition d’une séance | Modales, panneaux et confirmations |
| `2028:11298` — Composition séance — Abandon | Composition d’une séance | Modales, panneaux et confirmations |
| `2028:11375` — Composition séance — Compte à rebours | Composition d’une séance | Modales, panneaux et confirmations |
| `2028:11457` — Composition séance — Fin | Composition d’une séance | Modales, panneaux et confirmations |
| `2028:11700` — Composition séance — Standard | Composition d’une séance | Vues principales et états intégrés |
| `2028:11808` — Composition séance — Actions glissées | Composition d’une séance | Vues principales et états intégrés |
| `2028:12003` — Composition séance — Nom saisi | Composition d’une séance | Vues principales et états intégrés |
| `2059:267` — Calendrier — Jour suivant — Glissement gauche — MVP | Calendrier | Vues principales et états intégrés |
| `2074:86` — Calendrier — Semaine — Après suppression d’une planification | Calendrier | Vues principales et états intégrés |
| `2094:86` — Calendrier — Semaine — Étirements — Actions glissées | Calendrier | Vues principales et états intégrés |
| `2117:86` — Catalogue des séances — État vide | Catalogue des séances | Vues principales et états intégrés |
| `2117:190` — Suivi — Séances — État vide | Suivi — Séances | Vues principales et états intégrés |
| `2128:86` — Calendrier — Jour — État vide | Calendrier | Vues principales et états intégrés |
| `2139:86` — Profil — Vue d'ensemble — Parcours vide | Profil | Vues principales et états intégrés |
| `2234:88` — Catalogue des séances — Archivées — actions glissées | Catalogue des séances | Vues principales et états intégrés |
| `2234:189` — Modal — Confirmer la suppression d’une séance archivée | Catalogue des séances | Modales, panneaux et confirmations |
| `2252:86` — Calendrier — Semaine — Mardi sélectionné | Calendrier | Vues principales et états intégrés |
| `3518:4576` — Composition séance — Déplacement | Composition d’une séance | Vues principales et états intégrés |
| `3542:4656` — Création activité — Avant Paramètres d'exécution | Créer ou modifier un exercice | Vues principales et états intégrés |
| `3943:6064` — Ajouter un exercice — Initial | Créer ou modifier un exercice | Vues principales et états intégrés |
| `3556:7645` — Ajouter un exercice — Durée de l'exerciceouvert | Créer ou modifier un exercice | Modales, panneaux et confirmations |
| `3556:7712` — Ajouter un exercice — Pause — sélecteur ouvert | Créer ou modifier un exercice | Modales, panneaux et confirmations |
| `3556:7801` — Ajouter un exercice — Contrôle déployé — 3 séries (stepper) | Créer ou modifier un exercice | Vues principales et états intégrés |
| `3561:7673` — Ajouter un exercice — Répétitions | Créer ou modifier un exercice | Vues principales et états intégrés |
| `3561:7802` — Création activité — À l’échec | Créer ou modifier un exercice | Vues principales et états intégrés |
| `3580:4957` — Création activité — Durée totale ajustée — message temporaire | Créer ou modifier un exercice | Vues principales et états intégrés |
| `3722:5061` — Composition séance — Point d’arrêt | Composition d’une séance | Vues principales et états intégrés |
| `4581:6404` — Composition séance — Étiquette sélectionnée | Composition d’une séance | Vues principales et états intégrés |
| `5271:5455` — Modification d'une séance | Composition d’une séance | Vues principales et états intégrés |
| `3786:5093` — Catalogue des Exercices — Liste | Catalogue des exercices | Vues principales et états intégrés |
| `3789:5349` — Composition séance — Sélection exercices | Composition d’une séance | Modales, panneaux et confirmations |
| `4168:11149` — Catalogue des séances — Filtrer — Panneau ouvert | Catalogue des séances | Modales, panneaux et confirmations |
| `4168:11262` — Catalogue des Exercices — Filtrer — Panneau ouvert | Catalogue des exercices | Modales, panneaux et confirmations |
| `4593:6285` — Modal — Confirmer l’archivage d’une séance planifiée | Catalogue des séances | Modales, panneaux et confirmations |
| `4217:6980` — Ajouter un exercice — Nom Description Media | Créer ou modifier un exercice | Vues principales et états intégrés |
| `5088:6398` — Ajouter un exercice — Catégorie renseignée | Créer ou modifier un exercice | Vues principales et états intégrés |
| `4279:7044` — Ajouter un exercice — Phrase éditée | Créer ou modifier un exercice | Vues principales et états intégrés |
| `4734:6342` — Modifier un exercice | Créer ou modifier un exercice | Vues principales et états intégrés |
| `4332:7095` — Ajouter un exercice — Catégories | Créer ou modifier un exercice | Modales, panneaux et confirmations |
| `4367:7128` — Ajouter un exercice — Mode d’exécution (3 pastilles) | Créer ou modifier un exercice | Vues principales et états intégrés |
| `4367:7276` — Modèle paramètre — Compte à rebours | Créer ou modifier un exercice | Références de contrôles intégrés |
| `4367:7906` — Ajouter un exercice — Changement de côté (3 pastilles) | Créer ou modifier un exercice | Vues principales et états intégrés |
| `4367:8193` — Modèle paramètre — Durée totale — Roulette ouverte | Créer ou modifier un exercice | Modales, panneaux et confirmations |
| `4474:7157` — Ajouter un exercice — Nouvelle catégorie | Créer ou modifier un exercice | Modales, panneaux et confirmations |
| `4478:7209` — Ajouter un exercice — Zones corporelles | Créer ou modifier un exercice | Modales, panneaux et confirmations |
| `4521:6220` — Catalogue des exercices — État vide | Catalogue des exercices | Vues principales et états intégrés |
| `4544:6344` — Catalogue des Exercices — Liste — Filtre inactif étendu | Catalogue des exercices | Vues principales et états intégrés |
| `4544:6651` — Catalogue des Exercices — Liste — Filtre actif étendu | Catalogue des exercices | Vues principales et états intégrés |
| `4549:6382` — Catalogue des séances — Liste — Filtre inactif étendu | Catalogue des séances | Vues principales et états intégrés |
| `4549:6742` — Catalogue des séances — Filtre actif Archivé | Catalogue des séances | Vues principales et états intégrés |
| `4592:6217` — Catalogue des séances — Liste condensée — actions glissées — Dos et mobilité | Catalogue des séances | Vues principales et états intégrés |
| `4640:6308` — Composition séance — Nouvelle étiquette | Composition d’une séance | Modales, panneaux et confirmations |
| `4683:6336` — Ajouter un exercice — Nouvelle zone corporelle | Créer ou modifier un exercice | Modales, panneaux et confirmations |
| `4714:6241` — Modal — Abandonner la création de l’activité | Créer ou modifier un exercice | Modales, panneaux et confirmations |
| `4738:6209` — Catalogue des Exercices — Liste — actions glissées | Catalogue des exercices | Vues principales et états intégrés |
| `4738:6355` — Catalogue des Exercices — Liste — Première carte déployée — Média | Catalogue des exercices | Vues principales et états intégrés | <!-- Historique hors MVP : D-261/D-262 -->
| `4861:6145` — Composition séance — Étiquettes — Appui long — Confirmation suppression | Composition d’une séance | Modales, panneaux et confirmations |
| `4861:6259` — Ajouter un exercice — Catégorie — Appui long — Confirmation suppression | Créer ou modifier un exercice | Modales, panneaux et confirmations |
| `4861:6348` — Ajouter un exercice — Zones corporelles — Appui long — Confirmation suppression | Créer ou modifier un exercice | Modales, panneaux et confirmations |
| `4893:6675` — Composition d’une séance — Placement d’un point d’arrêt | Composition d’une séance | Vues principales et états intégrés |
| `4997:6113` — Exécution d'un exercice — Initial — Bascule basse (média) avec Cercle | Exécution — séance ou exercice | Variantes Information et Média — MVP |
| `5588:4363` — Exécution d'un exercice — Initial — Bascule haute avec média | Exécution — séance ou exercice | Variantes Information et Média — MVP |
| `5009:6069` — Exécution d'un exercice — Média plein écran | Exécution — séance ou exercice | Variantes Information et Média — MVP |
| `5021:5994` — Exécution d'un exercice — Initial - Cercle avec Texte | Exécution — séance ou exercice | Variantes Information et Média — MVP |
| `5581:4257` — Exécution d'un exercice — Démarré —  Bascule haute avec texte | Exécution — séance ou exercice | Variantes Information et Média — MVP |
| `5301:5443` — Composition séance — Retirer un point d’arrêt | Composition d’une séance | Bulle contextuelle |
| `5451:4272` — Modal — Choisir un exercice — Planification — Liste longue | Planifier une séance ou un exercice | Modales, panneaux et confirmations |
| `1354:182` — Profil — Cible post-MVP | Archives et références hors prototype actif | Vues principales et états intégrés |
| `1842:2` — Suivi — Séances — Vue déployée | Archives et références hors prototype actif | Vues principales et états intégrés |
| `3401:86` — Suivi — Vue d’ensemble | Archives et références hors prototype actif | Vues principales et états intégrés |
| `1992:10129` — Recherche globale — Champ déployé | Archives et références hors prototype actif | Vues principales et états intégrés |
| `1992:10320` — Recherche globale — Résultats affichés | Archives et références hors prototype actif | Vues principales et états intégrés |
| `3841:8375` — HISTORIQUE — Catalogue Séances — ancien arbre Créer — supersédé D-187 | Archives et références hors prototype actif | Vues principales et états intégrés |

### Écarts restant explicitement distingués

- **NON CONFORME (vocabulaire Figma)** : les confirmations `1992:8224` et `1992:8326` emploient encore Activité ; le vocabulaire cible du chapitre est Exercice.
- **Terminologie tranchée (D-209)** : Circuit désigne le groupe interne ; Tour désigne une répétition ; Parcours reste autonome. Les 17 occurrences du libellé de Composition ont été corrigées en Circuit le 05/10/2026 (journal, §8). Les libellés antérieurs conservés dans les relevés historiques ne constituent pas une correction Figma encore à réaliser.
- **Périmètre corrigé depuis #247** : D-203 inclut la consultation média représentée au MVP ; ses cinq variantes sont regroupées dans Exécution. Aucun mécanisme d’import n’est ajouté.
- **Limite de contrôle** : les fichiers image existants ont été réutilisés ; aucun nouvel export global n’a été effectué. Leur correspondance par nœud et leur intégration Markdown ont été contrôlées.


## Delta du01/10 — paramètres en feuille basse

12 nouvelles références exportées et inspectées ;2234:189 réexportée après restauration du dialogue. Le compte119 décrit le contrôle du30/09, pas le catalogue courant. Aucune ancienne image supprimée ; les états de saisie inline sont historiques.

| Frame | Contrat actif | Preuve au chapitre06 |
|---|---|---|
| `6407:9458` | CE-T03-04 | `images/figma-6407-9458.png` |
| `6407:9551` | CE-UI-10 | `images/figma-6407-9551.png` |
| `6407:9702` | CE-T03-04 | `images/figma-6407-9702.png` |
| `6407:9805` | CE-UI-10 | `images/figma-6407-9805.png` |
| `6407:9966` | CE-UI-10 | `images/figma-6407-9966.png` |
| `6407:10127` | CE-UI-10 | `images/figma-6407-10127.png` |
| `6411:9546` | CE-UI-10 | `images/figma-6411-9546.png` |
| `6407:10481` | CE-UI-10 | `images/figma-6407-10481.png` |
| `6411:9649` | CE-UI-10 | `images/figma-6411-9649.png` |
| `6419:9847` | CE-UI-10 | `images/figma-6419-9847.png` |
| `6419:10028` | CE-UI-10 | `images/figma-6419-10028.png` |
| `6423:9953` | CE-UI-10 | `images/figma-6423-9953.png` |
| `2234:189` | CE-T03-01 | `images/modale-3a-confirmer-suppression-seance-archivee.png` ; boutons non câblés |

## Inventaire courant du parcours Créer un exercice — 03/10/2026

[État des lieux exhaustif,42frames et revue des contrats](ETAT-DES-LIEUX-CREATION-EXERCICE-2026-10-03.md). Les références actuelles remplacent les copies du02/10 :37frames de la famille création/modification,2effets Catalogue/Composition et3exécutions. La réserve de réinitialisation a été retirée : D-029/D-150 restent applicables aux deux ordres.

