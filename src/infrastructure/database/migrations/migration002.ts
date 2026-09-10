import { PREDEFINED_CATEGORIES } from "@/domain/categories/defaults";
import { canonicalCategoryKey } from "@/domain/categories/validation";
import { BODY_ZONES } from "@/features/reference-data/bodyZones";

/**
 * Migration additive T01-S09 : Catégories de la séance (D-106/D-107) et
 * Zones corporelles persistées (D-093). N'altère JAMAIS `migration001.ts`
 * (« Conservation des acquis / Change Control », `.github/
 * AI_ORCHESTRATION.md`) — uniquement de nouvelles tables, jamais un
 * `ALTER TABLE` ni une contrainte modifiée sur `sessions`/`cycles`/`tours`/
 * `activities`. Ces quatre tables supportaient déjà, sans modification,
 * PLUSIEURS lignes `activities` par Séance (`UNIQUE(session_id,
 * structural_position, position)`, `position >= 0`) — seul le code
 * applicatif (`assertT01S01Row`, `FIXED_ACTIVITY_POSITION`) restreignait
 * jusqu'ici l'usage réel à une Activité unique.
 *
 * `categories` : `canonical_key` (espaces normalisés + casse + diacritiques
 * ignorés, calculée en JS par `canonicalCategoryKey` — SQLite n'a pas de
 * fonction native `lower()` sensible aux diacritiques) porte la contrainte
 * d'unicité réelle ; `name` reste le libellé affiché/persisté tel que
 * saisi (espaces normalisés uniquement, casse et accents conservés). Les 10
 * Catégories prédéfinies du référentiel MVP (D-107,
 * `@/domain/categories/defaults.ts`) sont semées ici, une seule fois — cette
 * migration ne s'exécute jamais deux fois sur la même base
 * (`migrateDatabase.ts`, garde par `PRAGMA user_version`).
 *
 * `session_categories` : association Séance↔Catégorie, clé composite,
 * suppression en cascade avec la Séance mais jamais avec la Catégorie
 * (`ON DELETE RESTRICT` côté Catégorie — une Catégorie encore référencée ne
 * peut pas disparaître silencieusement ; aucune fonctionnalité de
 * suppression de Catégorie n'existe de toute façon en T01).
 *
 * `activity_body_zones` : association Activité↔Zone corporelle. Le
 * référentiel des Zones (`bodyZones.ts`) reste en code, jamais une table —
 * même choix déjà fait pour `SESSION_COLORS` (migration001) : la contrainte
 * `CHECK (body_zone_id IN (...))` ci-dessous duplique ce référentiel au
 * niveau SQL, pour la même raison de défense en profondeur.
 */
const CATEGORIES_SEED = PREDEFINED_CATEGORIES.map((category) => {
  const escapedName = category.name.replace(/'/g, "''");
  const escapedKey = canonicalCategoryKey(category.name).replace(/'/g, "''");
  return `('${category.id}', '${escapedName}', '${escapedKey}', 1, ${category.displayOrder}, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`;
}).join(",\n  ");

const BODY_ZONE_IDS_SQL_LIST = BODY_ZONES.map((zone) => `'${zone.id}'`).join(", ");

export const MIGRATION_002 = `
CREATE TABLE categories (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 40),
  canonical_key TEXT NOT NULL UNIQUE,
  is_predefined INTEGER NOT NULL CHECK (is_predefined IN (0, 1)),
  display_order INTEGER,
  created_at TEXT NOT NULL,
  CHECK (
    ((is_predefined = 1) AND (display_order IS NOT NULL))
    OR
    ((is_predefined = 0) AND (display_order IS NULL))
  )
);

CREATE INDEX categories_display_order_idx
ON categories(is_predefined DESC, display_order, created_at);

INSERT INTO categories (id, name, canonical_key, is_predefined, display_order, created_at) VALUES
  ${CATEGORIES_SEED};

CREATE TABLE session_categories (
  session_id TEXT NOT NULL REFERENCES sessions(id) ON UPDATE RESTRICT ON DELETE CASCADE,
  category_id TEXT NOT NULL REFERENCES categories(id) ON UPDATE RESTRICT ON DELETE RESTRICT,
  PRIMARY KEY (session_id, category_id)
);

CREATE TABLE activity_body_zones (
  activity_id TEXT NOT NULL REFERENCES activities(id) ON UPDATE RESTRICT ON DELETE CASCADE,
  body_zone_id TEXT NOT NULL CHECK (body_zone_id IN (${BODY_ZONE_IDS_SQL_LIST})),
  PRIMARY KEY (activity_id, body_zone_id)
);
`;
