# Revue indépendante de ChatGPT — PRE-4 BMAD (16 octobre 2026)

Trace transmise par Hermann dans la conversation du 2026-10-16, sur l'archive `PRE4-BMAD-2026-10-16.zip` (SHA-256 `e490b1f041ce1cf9b817190ee484242f0a94c6651213bf7cb00c91a3280f9265`). Les constats R1 à R4 et la section 6 sont repris textuellement ; le reste est résumé. Les annexes A et B de la revue (table des 196 FR vers stories et critères, et le registre source vers PRD) ne sont pas recopiées : elles reprennent les tables du dossier, avec la colonne « Réserve » de ChatGPT, dont les seules réserves non génériques portent sur R1 à R4.

## Décision de revue

« Corrections requises avant développement. La couverture fonctionnelle complète n'est pas validée. » Les 196 FR ont chacune un renvoi précis vers une story et un critère d'acceptation, ce qui a été vérifié indépendamment ; ce renvoi « ne prouve pas que chaque conséquence est correcte ni qu'aucune exigence source n'a été omise ». La revue ne vaut ni arbitrage produit ni autorisation de `bmad-build`.

Limites déclarées : le manifeste a 127 empreintes de contenu, toutes retrouvées. Onze chemins de chapitres du manifeste ne correspondent pas littéralement aux noms du ZIP (tiret demi-cadratin, apostrophe) : c'est un problème de portabilité des chemins, sans contenu manquant. Le dépôt complet n'était pas inclus. Une seule capture Média a été inspectée (8328:35740).

## Écarts

- **R1 (élevé) — 120 répétitions acceptées après modification, malgré la borne 100.** Story 1.1 AC7 (`epics.md:197`) : « 150 → 120 … 100 et 120 acceptés », alors que l'AC6 refuse 101 en création et que ch. 13 l. 4092 et 4106 imposent 1 à 100. Correction attendue : 150 → 100 accepté, 150 → 120 refusé, 150 → 150 toléré (H25). Un tableau unique : ancienne 150 inchangée → tolérée ; nouvelle 100 → valide ; nouvelle 101 ou 120 → refusée. Ni renommer l'Exercice ni modifier une Pause ne fait d'une valeur inchangée une nouvelle saisie.
- **R2 (élevé) — La fermeture du Sélecteur perd la Cellule active dans l'architecture.** AD-15 impose une union exclusive `none | … | selector(…) | … | cell(…)` ; `onIsPresentedChange(false)` remet `none` ; AD-16 désactive les ± hors de `cell`. Or la story 3.6 AC3 exige que la cellule reste active à la fermeture du Sélecteur, et le scénario R-3.6-08 (`UNSET` → ouverture → ✕ → + → 5 s) en dépend. Correction attendue : définir l'identité de la Cellule active pendant le Sélecteur et ses transitions. Deux conceptions possibles : (a) sélection de cellule séparée de la surface ouverte, avec au plus une surface ouverte ; (b) union qui conserve la cellule et revient à `cell` après fermeture. ✓ applique puis restitue la cellule ; ✕ ferme sans appliquer puis la restitue ; le geste extérieur qui range l'outil peut désactiver la cellule selon FR-10-04. Le callback natif ne doit pas effacer un état plus récent. Fournir une table de transitions : cellule numérique et `UNSET`, ouverture, ✓, ✕, fermeture extérieure, changement de cellule, repli du tableau.
- **R3 (moyen, arbitrage de portée) — Médias : lecture dans l'Éditeur et pendant l'Exécution.** FR-21-02 inclut « bouton plein écran, lecture vidéo » ; la story 4.4 AC4 les exclut en citant P18 et FR-21-04, et les classe NON VÉRIFIABLE. Or FR-21-04 n'exclut que la lecture pendant l'Exécution. Correction attendue : chercher la règle ; si les sources ne tranchent pas, demander un seul arbitrage à Hermann en distinguant Éditeur et Exécution.
- **R4 (moyen, décision à confirmer) — « Données utilisables » n'est pas synonyme de « tout nombre analysable ».** P40, P44 et AD-4 étendent la conservation aux valeurs négatives ou fractionnaires, et P45 en écarte certaines selon leur position. Cette politique dépasse les exemples validés par Hermann. Action attendue : un arbitrage groupé et concret, sans élargir tacitement « utilisable ».

## Hypothèses (section 4 de la revue)

Avis favorables sous réserve, sans valoir décision. À faire confirmer : H5 (invalidation d'Annuler par toute modification, y compris un Bip) et H30 (ne compter que les Pauses est un choix conservateur, non une conséquence du calcul). H22 ne doit pas imposer un terme « durée » inadapté au cas Répétitions sans vérification. H2 doit décrire l'état Git effectivement obtenu.

## Indépendance (section 5)

Orchestrations séparées, et non expérience complètement aveugle : l'exposition initiale aux noms de fichiers du plan VNext et la lecture du code d'une dépendance dans un autre clone doivent rester consignées. Vérifier la prise en compte de Q19 par VNext avant de comparer les résultats sur données corrompues.

## Section 6 — Retour demandé à Claude (texte de la revue)

1. Corriger R1 et R2 sans modifier le produit ni les skills BMAD.
2. Résoudre R3 par confrontation des sources ; ne pas confondre lecture dans l'Éditeur et lecture pendant l'exécution. S'il faut un arbitrage, présenter les deux options à Hermann.
3. Présenter R4 avec quelques données concrètes et l'effet sur Catalogue, copie en Séance, calcul et enregistrement. Ne pas élargir tacitement « utilisable ».
4. Répercuter chaque correction dans PRD, architecture, parties des epics et assemblage, critères, scénarios et questions. Garder les anciennes revues comme historiques en les datant ; ne pas remplacer un ancien verdict par un succès inventé.
5. Refaire le contrôle de readiness sur les documents corrigés. Fournir une archive révisée avec empreintes et un journal très court : constat → modification → preuve documentaire.
6. Maintenir l'arrêt avant développement. Aucune autorisation de coder n'est donnée par ce rapport.

Conditions de clôture : R1 et R2 corrigés de façon cohérente ; R3 résolu explicitement ; R4 arbitré ou démontré déjà couvert par une décision applicable ; hypothèses produit retenues distinguées des propositions ; réexamen des zones modifiées.
