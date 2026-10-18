# Lot 6 — rapport de conservation de la restructuration (17/10/2026)

## Périmètre

- **Base :** `cefc9b99`. Les chapitres y sont identiques à ceux analysés au lot 6A (`49526414`).
- **Autorisation :** décisions QR-1 à QR-9 de Hermann, consignées en D-402.
- **Méthode :** chaque étape reconstruit les chapitres depuis la base avec `outils/restructurer.mjs`, puis rejoue les contrôles avec `outils/executer-etape.sh`. Les journaux d'étape sont dans [execution/](execution/).
- **Statut :** soumis à revue indépendante. Rien n'est déclaré clos.

## Étapes et commits

| Étape | Commit | Contenu | Contrôles |
|---|---|---|---|
| 6B | `3789f1de` | Outillage ; affectations corrigées (voir ci-dessous) | — |
| 6C | `444e5822` | Tableaux coupés réparés (13 corrections) ; inventaire du ch. 13 complété (9 contrats) ; D-046 et D-047 rangées dans « Décisions validées » | [6C.txt](execution/6C.txt) |
| 6D | `cc5c6ff2` | 20 sections à équivalence complète remplacées par un renvoi ; 53 lignes identiques de même contexte remplacées par un renvoi ; 7 titres « Saisie des paramètres — D-246 » retitrés | [6D.txt](execution/6D.txt) |
| 6E | `2cf0b27a` | Plan de domaine commun (ch. 03, 04, 08, 09, 10, 11, 13) ; ch. 06 en trois parties ; compléments intégrés (ch. 01, 02, 05, 12) ; numérotation et dates retirées des titres | [6E.txt](execution/6E.txt) |
| 6F1 | `a23770be` | Conventions d'interface vers le ch. 06 | [6F1.txt](execution/6F1.txt) |
| 6F2 | `681babf6` | Ch. 08 recentré sur la conception par fonctionnalité | [6F2.txt](execution/6F2.txt) |
| 6F3 | `7b43cb7c` | Descriptions d'écran du ch. 06 placées auprès des contrats du ch. 13 | [6F3.txt](execution/6F3.txt) |
| 6F4 | `4b6c2c3c` | Autres déplacements | [6F4.txt](execution/6F4.txt) |
| 6F5 | `c2625d02` | 17 sections historiques non normatives vers l'annexe | [6F5.txt](execution/6F5.txt) |
| 6G | `383bdeeb` | Sommaires ; annexes de correspondance et d'index ; INDEX.md ; besoins B-001 à B-091 | [6G.txt](execution/6G.txt) |
| 6H | `ff9fd738` | D-402 au registre ; ordre de référence de PRODUCT.md remplacé par un renvoi (QR-6) | [6H.txt](execution/6H.txt) |
| 6I | `4d6d9722` | RG-1 à RG-13 transférées au ch. 06 ; renvoi dans le DSF | [6I.txt](execution/6I.txt) |
| 6K | `aa9cd0bd` | 157 lignes : espaces manquantes | [6K.txt](execution/6K.txt) |

Chaque étape a été contrôlée deux fois : contre la base, et contre l'étape précédente (HEAD). Toutes donnent `base=0 head=0 place=0 liens=0 tokens=0 fichiers=0 openspec=0`, et 6K y ajoute `redaction=0`.

## Contrôle final contre la base

| Contrôle | Résultat |
|---|---|
| C1 Identifiants | Les 782 identifiants définis à la base le sont chacun une fois. Un seul est nouveau : D-402, justifié par la décision elle-même. Les B-001 à B-091 sont des identifiants nouveaux de besoins (QR-7), indexés en annexe. |
| C2 Lignes | 7 015 lignes distinctes de la base : 6 776 identiques (N1), 239 identiques aux cibles de liens, renvois de localisation, préfixes B-nnn ou espaces typographiques près (N2), 0 absente |
| C3 Copies retirées | 45 lignes ont moins d'occurrences, du fait des renvois de 6D : leur texte subsiste dans la copie conservée |
| C4 Registre | Texte des 393 décisions inchangé (cibles des liens exceptées) |
| C5 Portée | 0 ligne n'a changé de portée. Les 40 lignes archivées sont justifiées par le motif HISTORIQUE-ARCHIVE ([justifications-archive.tsv](justifications-archive.tsv)). |
| C6 Autorité | Aucune ligne portant un marqueur (`À CLARIFIER`, « remplacée par », « prévaut », « Validée »…) n'a disparu |
| C7 Références | 750 identifiants cités : tous encore cités, tous encore définis |
| C8 Place | 998 sections sur 998 sont dans le fichier prévu par la [matrice actualisée](correspondance-actualisee.tsv). Les 16 renvois de ligne sont comptés à part. |
| C9 Liens | 2 anomalies, toutes deux historiques et connues, inchangées |
| C10 Rédaction | 157 corrections ; aucune ne change un nombre, une unité, un identifiant, un libellé, une négation ou une modalité ([corrections-6K.json](corrections-6K.json)) |
| K1 Design tokens | Les rangs `color.`, `type.`, `spacing.`, `radius.` lus par le test `tokensSpecification.test.ts` sont identiques à l'octet, dans le même fichier. Le test lui-même n'a pas été exécuté : Jest n'est pas installé dans ce clone. |
| K2 Fichiers | Les 13 noms de fichiers sont conservés ; trois annexes sont créées |
| C12 OpenSpec | `--strict` réussi |

## Taille des chapitres (lignes)

| Fichier | Base | Après |
|---|---|---|
| 01 Vision et glossaire | 449 | 408 |
| 02 Utilisateurs et besoins | 246 | 255 |
| 03 Parcours utilisateur | 563 | 590 |
| 04 Modèle fonctionnel | 459 | 590 |
| 05 Versions et périmètre | 284 | 476 |
| 06 Interface : navigation, écrans et conventions communes | 2 794 | 1 984 |
| 07 Registre | 688 | 691 |
| 08 Conception fonctionnelle par fonctionnalité | 1 850 | 691 |
| 09 Modèle de données | 1 274 | 1 389 |
| 10 Règles métier et calculs | 784 | 2 096 |
| 11 API fonctionnelles | 463 | 508 |
| 12 Architecture technique | 1 623 | 1 744 |
| 13 Contrats d'écran | 4 351 | 5 095 |
| Annexes (correspondance, historique, index) | — | 1 003 + 139 + 1 072 |

Les tailles « après » comprennent les sommaires.

## Affectations corrigées pendant l'exécution

Le rapport de la revue indépendante sur les affectations de défauts structurels n'était pas présent dans le dépôt. Les corrections ci-dessous viennent du réexamen fait pendant l'exécution ; les règles sont dans `outils/correspondance-cible.mjs`.

1. **Annexe historique :** seules les sections non normatives y vont. Elles sont 17 au lieu de 32 ; les sections historiques normatives ou mixtes restent dans leur chapitre.
2. **PR ouvertes :** une section modifiée par une PR ouverte reste dans son fichier (QR-5). Les 35 sections concernées sont dans [dependances-pr.tsv](dependances-pr.tsv).
3. **Identifiants :** une section qui définit un identifiant reste avec sa famille. Les RM-FMT restent au ch. 10. Un premier essai les envoyait aux ch. 06 et 13 : C1 l'a détecté.
4. **Titres-conteneurs :** un titre-conteneur suit ses sous-sections quand elles partent toutes vers le même fichier (8 cas).
5. **Contexte des sections déplacées :** une section déplacée sans son titre parent reçoit ce titre en préfixe, par exemple « Catalogue des séances — Archivage ». Un titre qui est un identifiant n'est jamais préfixé.
6. **Portée :** lorsqu'un déplacement fait perdre une portée héritée d'un titre parent, le suffixe « (hors MVP) » ou « (historique) » est ajouté au titre. Une section dont le titre dit « MVP » n'est jamais déplacée si sa portée « hors MVP » est héritée. Ce cas ne s'est pas présenté.
7. **Partie du plan de domaine :** elle est choisie à la majorité des lignes du bloc entier, et non d'après le seul titre racine.

## Ce qui n'a pas été transformé, et pourquoi

| Élément | Raison | Suite |
|---|---|---|
| 11 copies partielles et 158 occurrences de lignes « à vérifier » | L'équivalence complète (texte, portée, autorité) n'est pas établie : on n'en retire aucune | [arbitrages-lot6.md](arbitrages-lot6.md) §3 |
| 204 paires divergentes, dont 30 nouvelles (QR-9) | Contradictions fonctionnelles : elles restent côte à côte | [arbitrages-lot6.md](arbitrages-lot6.md) §2 |
| 214 lignes « à examiner » de R-06 | Chaque ligne exige un examen de l'identifiant perdu et de la reformulation ; une restauration automatique risquerait d'inventer | lot suivant |
| Alias de version (« v13 », « Bip v2 », « Phrase v1 ») | Le remplacement change le texte de lignes normatives ; C10 le classe non rédactionnel, à cause des nombres | lot suivant, en JSON contrôlé |
| RM-131 et ch. 08 l. 1573 | Ils dépendent des PR #370 et #371, encore ouvertes | après leur fusion |
| Transfert des autres DSF | Seul le DSF Cartes, icônes et appuis (RG-1 à RG-13) est transféré | règle par règle, lot suivant |
| Matrice besoin → règle → contrat → recette ; rubrique « Règles applicables » des contrats | Les rattachements demandent un jugement ; aucun n'est inventé | à proposer pour validation |
| Corrections rédactionnelles non mécaniques (pronoms, termes proscrits, découpage des règles longues) | À faire au cas par cas sous C10 | lot suivant |

## Dépendances Git (fusion simulée, `git merge-tree`)

| PR | Fichiers en conflit avec la branche restructurée |
|---|---|
| #363 (`d2386c8d`) | ch. 06 |
| #370 (`6cf3634a`) | ch. 03, 04, 06, 08, 09, 10, 11, 13 |
| #371 (`2c050d0e`) | ch. 06, 08, 13 |

Ces conflits viennent de la réorganisation des fichiers. Les modifications des PR portent sur 35 sections, toutes restées dans leur fichier. Pour les réappliquer, il suffit de retrouver leur place actuelle dans l'annexe de correspondance. La fusion dans `main` attend la revue finale et la résolution de ces dépendances, comme demandé.
