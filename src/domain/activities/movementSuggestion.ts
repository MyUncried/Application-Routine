/**
 * PRE-7 (R-5, D-445 C01, v7 §6 R02 à R05) — proximité de nom des mouvements et classement des
 * résultats de recherche, fonctions pures. Remplace la proximité lexicale par suite de mots d'A2.3.
 *
 * R02 (v7 l.84-164) : la recherche PROPOSE des rapprochements et ne conclut jamais à l'identité ;
 * aucune fusion, aucun rattachement, aucune présélection n'en découle. L'unicité de nom (C01,
 * `findMovementNameConflict` de `Movement.ts`) est un mécanisme DISTINCT (v7 l.35).
 *
 * Mise en œuvre (v7 l.162-164, « relève de l'analyse technique ») : jetons et trigrammes sont
 * calculés à la lecture, sur la liste des mouvements disponibles parcourue en mémoire ; aucune
 * colonne pré-calculée ni migration (volumes d'une base personnelle). Coefficients et seuils sont
 * le point de départ de la v7, vérifiés par le corpus automatisé R07
 * (`__tests__/movementSearch.r07.test.ts`), qui conditionne toute évolution de la formule.
 */

import type { Movement } from "./Movement";

/** R02 : `score ≥ 0,75` — suggestion présentée d'elle-même. */
export const SUGGESTION_THRESHOLD = 0.75;
/** R02 : `0,45 ≤ score < 0,75` — résultat listé, sans suggestion spontanée ; en dessous, non présenté. */
export const LISTING_THRESHOLD = 0.45;
/** R02 : un score de nom inférieur à 0,65 reste sous le seuil haut quels que soient les bonus. */
const BONUS_PROMOTION_FLOOR = 0.65;
/** R02 : `+ 0,10` par signal partagé (Catégorie, au moins une Zone corporelle). */
const SIGNAL_BONUS = 0.1;
const TOKEN_WEIGHT = 0.55;
const TRIGRAM_WEIGHT = 0.35;
const PREFIX_WEIGHT = 0.1;
/** Caractère de garde des trigrammes, hors de l'alphabet normalisé (lettres et chiffres). */
const GUARD = "$";

/** R02 « retrait des mots fonctionnels » : liste de la v7 (l.94), sous leur forme normalisée. */
const FUNCTION_WORDS: ReadonlySet<string> = new Set([
  "de",
  "du",
  "des",
  "la",
  "le",
  "les",
  "l",
  "sur",
  "sous",
  "en",
  "avec",
  "a",
  "au",
  "aux",
  "un",
  "une",
  "et",
  "pour",
  "par",
]);

/**
 * R02 « Normalisation » : diacritiques retirés par décomposition NFD, casse ignorée, ponctuation
 * et traits d'union traités comme des séparateurs, espaces réduits. Forme de calcul seulement :
 * les noms restent affichés tels qu'ils ont été saisis (v7 l.158).
 */
export function normalizeSearchText(text: string): string {
  return text
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/**
 * R02 « rognage de pluriel prudent » : la finale `s` ou `x` n'est retirée que si le radical
 * restant compte au moins 4 caractères (« pompes » → « pompe », « genoux » → « genou » ; « dos »,
 * « bras » intacts). La finale « es » suit la même règle : seul son `s` est retiré, ce que
 * confirme l'exemple « pompes » donne « pompe » (v7 l.95-97).
 */
function trimPlural(token: string): string {
  return /[sx]$/.test(token) && token.length - 1 >= 4 ? token.slice(0, -1) : token;
}

/**
 * R02 « Tokens » : découpage de la forme normalisée, mots fonctionnels retirés, pluriel rogné ;
 * ensemble ordonné sans doublon. « Pompes sur les genoux » et « Pompes genoux » donnent
 * `{pompe, genou}`.
 */
export function searchTokens(text: string): readonly string[] {
  const normalized = normalizeSearchText(text);
  if (normalized.length === 0) {
    return [];
  }
  const tokens = normalized
    .split(" ")
    .filter((word) => word.length > 0 && !FUNCTION_WORDS.has(word))
    .map(trimPlural);
  return [...new Set(tokens)];
}

/** Distance d'édition (Levenshtein) entre deux jetons. */
function editDistance(a: string, b: string): number {
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    for (let j = 1; j <= b.length; j += 1) {
      const substitution = previous[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1);
      current.push(Math.min(previous[j]! + 1, current[j - 1]! + 1, substitution));
    }
    previous = current;
  }
  return previous[b.length]!;
}

/**
 * R02 « Distance d'édition entre tokens » : trois conditions cumulatives — même initiale (« fente »
 * et « pente » sont écartés), différence de longueur au plus 2, distance au plus 1 pour des jetons
 * de 5 caractères ou moins, 2 au-delà (longueur du plus long des deux). `null` : non rapprochés.
 */
function closeTokenDistance(a: string, b: string): number | null {
  if (a.length === 0 || b.length === 0 || a[0] !== b[0] || Math.abs(a.length - b.length) > 2) {
    return null;
  }
  const distance = editDistance(a, b);
  const allowed = Math.max(a.length, b.length) <= 5 ? 1 : 2;
  return distance <= allowed ? distance : null;
}

function dice(matches: number, sizeA: number, sizeB: number): number {
  return sizeA + sizeB === 0 ? 0 : (2 * matches) / (sizeA + sizeB);
}

/**
 * R02 « Recouvrement de tokens » : Dice où une correspondance exacte vaut 1 et un rapprochement
 * par distance d'édition 0,5 ; chaque jeton ne sert qu'à une correspondance, la meilleure (les
 * exactes d'abord, puis, parmi les jetons restés libres, la plus petite distance).
 */
function tokenDice(a: readonly string[], b: readonly string[]): number {
  const freeB = new Set(b);
  const leftA: string[] = [];
  let matches = 0;
  for (const token of a) {
    if (freeB.has(token)) {
      freeB.delete(token);
      matches += 1;
    } else {
      leftA.push(token);
    }
  }
  for (const token of leftA) {
    let best: { readonly token: string; readonly distance: number } | null = null;
    for (const candidate of freeB) {
      const distance = closeTokenDistance(token, candidate);
      if (distance !== null && (best === null || distance < best.distance)) {
        best = { token: candidate, distance };
      }
    }
    if (best !== null) {
      freeB.delete(best.token);
      matches += 0.5;
    }
  }
  return dice(matches, a.length, b.length);
}

/**
 * R02 « Trigrammes » : construits JETON PAR JETON, jamais sur la chaîne entière (mesure
 * indépendante de l'ordre des mots) ; chaque jeton est encadré de deux caractères de garde de
 * chaque côté, puis les ensembles sont réunis.
 */
export function searchTrigrams(tokens: readonly string[]): ReadonlySet<string> {
  const trigrams = new Set<string>();
  for (const token of tokens) {
    const padded = `${GUARD}${GUARD}${token}${GUARD}${GUARD}`;
    for (let index = 0; index + 3 <= padded.length; index += 1) {
      trigrams.add(padded.slice(index, index + 3));
    }
  }
  return trigrams;
}

function trigramDice(a: ReadonlySet<string>, b: ReadonlySet<string>): number {
  let common = 0;
  for (const trigram of a) {
    if (b.has(trigram)) common += 1;
  }
  return dice(common, a.size, b.size);
}

/** Forme d'un nom pré-calculée pour la comparaison (normalisé, jetons, trigrammes). */
type PreparedName = {
  readonly normalized: string;
  readonly tokens: readonly string[];
  readonly trigrams: ReadonlySet<string>;
};

function prepare(text: string): PreparedName {
  const tokens = searchTokens(text);
  return { normalized: normalizeSearchText(text), tokens, trigrams: searchTrigrams(tokens) };
}

function preparedScore(a: PreparedName, b: PreparedName): number {
  if (a.normalized.length === 0 || b.normalized.length === 0) {
    return 0;
  }
  const prefix = a.normalized.startsWith(b.normalized) || b.normalized.startsWith(a.normalized) ? 1 : 0;
  return TOKEN_WEIGHT * tokenDice(a.tokens, b.tokens) + TRIGRAM_WEIGHT * trigramDice(a.trigrams, b.trigrams) + PREFIX_WEIGHT * prefix;
}

/**
 * R02 « Score de nom » : `0,55 × Dice(tokens) + 0,35 × Dice(trigrammes) + 0,10 × préfixe`, le
 * préfixe valant 1 si l'une des deux chaînes normalisées est préfixe de l'autre. Symétrique ; 0
 * pour un nom vide.
 */
export function movementNameScore(left: string, right: string): number {
  return preparedScore(prepare(left), prepare(right));
}

/** Mouvement candidat au classement : nom principal, alias (R05) et signaux de classement. */
export type MovementSearchCandidate = Pick<Movement, "id" | "name" | "aliases" | "categoryId" | "bodyZoneIds">;

/** R02 « Signaux Catégorie et Zones corporelles » : champs renseignés dans le brouillon. */
export type MovementSearchContext = {
  readonly categoryId?: string | null;
  readonly bodyZoneIds?: readonly string[];
};

/** Résultat classé : un par mouvement (R05). */
export type RankedMovement = {
  readonly id: string;
  /** Meilleure correspondance entre la requête et le nom principal ou un alias. */
  readonly nameScore: number;
  /** Score de classement, bonus compris ; plafonné sous le seuil haut pour un résultat non suggéré. */
  readonly score: number;
  /** Seuil haut atteint : suggestion présentée d'elle-même (R03). */
  readonly suggested: boolean;
};

/**
 * R02 à R05 — mouvements rapprochés de `query`, classés par pertinence décroissante :
 * - un résultat par mouvement, retenu sur sa meilleure correspondance entre nom principal et
 *   alias (R05 : deux mouvements partageant un alias restent deux résultats distincts) ;
 * - listé si le score de NOM atteint 0,45 : les bonus « réordonnent, ils ne promeuvent pas »
 *   (v7 l.152), ils ne font donc entrer aucun candidat dans la liste ;
 * - suggéré si le score, bonus compris, atteint 0,75 ; jamais si le score de nom est sous 0,65,
 *   et un résultat non suggéré est classé sous les suggérés (score plafonné) ;
 * - égalité : nom normalisé, puis identifiant (ordre déterministe).
 * Requête vide (après normalisation) : `[]` ; la liste complète relève de l'écran (R03).
 */
export function rankMovements(
  query: string,
  candidates: readonly MovementSearchCandidate[],
  context: MovementSearchContext = {},
): readonly RankedMovement[] {
  const prepared = prepare(query);
  if (prepared.normalized.length === 0) {
    return [];
  }
  const zones = new Set(context.bodyZoneIds ?? []);
  const categoryId = context.categoryId ?? null;
  const ranked: (RankedMovement & { readonly sortName: string; readonly raw: number })[] = [];
  for (const candidate of candidates) {
    let nameScore = 0;
    for (const name of [candidate.name, ...candidate.aliases]) {
      nameScore = Math.max(nameScore, preparedScore(prepared, prepare(name)));
    }
    if (nameScore < LISTING_THRESHOLD) {
      continue;
    }
    const bonus =
      (categoryId !== null && categoryId.length > 0 && candidate.categoryId === categoryId ? SIGNAL_BONUS : 0) +
      (candidate.bodyZoneIds.some((zone) => zones.has(zone)) ? SIGNAL_BONUS : 0);
    const raw = nameScore + bonus;
    const suggested = nameScore >= BONUS_PROMOTION_FLOOR && raw >= SUGGESTION_THRESHOLD;
    ranked.push({
      id: candidate.id,
      nameScore,
      score: suggested ? raw : Math.min(raw, SUGGESTION_THRESHOLD - Number.EPSILON),
      suggested,
      sortName: normalizeSearchText(candidate.name),
      raw,
    });
  }
  ranked.sort((left, right) => {
    if (left.score !== right.score) return right.score - left.score;
    // Résultats plafonnés au même score : départagés par la pertinence réelle avant le nom.
    if (left.raw !== right.raw) return right.raw - left.raw;
    if (left.nameScore !== right.nameScore) return right.nameScore - left.nameScore;
    if (left.sortName !== right.sortName) return left.sortName < right.sortName ? -1 : 1;
    return left.id < right.id ? -1 : left.id > right.id ? 1 : 0;
  });
  return ranked.map(({ sortName: _sortName, raw: _raw, ...result }) => result);
}

/** Rang (1..total) et total dérivés du groupe de niveaux (MFN-05) ; jamais persistés. */
export type MovementLevelPosition = {
  readonly rank: number;
  readonly total: number;
};

/**
 * Position du geste dans son groupe, dérivée des membres ORDONNÉS (`listGroup`). Un geste sans
 * groupe, ou un groupe réduit à un membre, masque rang et total (MFN-05, MFN/AC08) : `null`, jamais
 * un faux « Niveau 1 ». Un geste absent des membres fournis : `null`.
 */
export function movementLevelPosition(movement: Movement, orderedMembers: readonly Movement[]): MovementLevelPosition | null {
  if (movement.levelGroup === null || orderedMembers.length < 2) {
    return null;
  }
  const index = orderedMembers.findIndex((member) => member.id === movement.id);
  if (index < 0) {
    return null;
  }
  return { rank: index + 1, total: orderedMembers.length };
}

/**
 * PRE-7 (R-5, C02, MFN-07 l.371) : position d'une variante insérée avant (Plus facile) ou après
 * (Plus difficile) son origine, dérivée de la position de l'origine (`null` : sans groupe, la
 * première variante forme un groupe de deux membres). Affichage seulement, jamais persistée.
 */
export function variantLevelPosition(
  origin: MovementLevelPosition | null,
  placement: "BEFORE_ORIGIN" | "AFTER_ORIGIN",
): MovementLevelPosition {
  const rank = origin?.rank ?? 1;
  const total = (origin?.total ?? 1) + 1;
  return { rank: placement === "BEFORE_ORIGIN" ? rank : rank + 1, total };
}
