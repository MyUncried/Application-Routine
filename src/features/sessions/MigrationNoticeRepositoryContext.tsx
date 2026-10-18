import { createContext } from "react";

import type { MigrationNoticeRepository } from "@/domain/migration/MigrationNotice";

/**
 * PRE-4 (story 1.1, AD-12) : contrat React pur d'exposition du repository des
 * avis de migration — même patron que `SessionServiceContext` : aucun import
 * `expo-sqlite` ni infrastructure ici. La construction réelle (même connexion
 * SQLite que les autres services) vit dans `SessionServiceProvider.tsx`.
 * Story 1.2 : son lecteur unique est `MigrationNoticeGate`, qui lit le
 * contexte directement (il peut être nul au premier rendu).
 */
export const MigrationNoticeRepositoryContext = createContext<MigrationNoticeRepository | null>(null);
