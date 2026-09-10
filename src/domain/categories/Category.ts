export type { Category } from "@/domain/sessions/Session";

/**
 * Réexport unique du type `Category` (défini dans `@/domain/sessions/
 * Session.ts` pour rester colocalisé avec `Session.categories`, évitant une
 * dépendance circulaire `sessions ↔ categories`) — ce module est le point
 * d'entrée canonique du Domaine Catégorie pour tout consommateur qui n'a par
 * ailleurs aucune raison d'importer le Domaine Séance.
 */
