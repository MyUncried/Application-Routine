import "expo-sqlite/localStorage/install";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * T1 Compte — client Supabase (guide Expo « Using Supabase ») : session persistée par `expo-sqlite/localStorage`,
 * flux PKCE pour la connexion web (Google, Apple sur Android), rafraîchissement automatique quand le réseau est là.
 * URL et clé publique fournies par EAS (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`), hors dépôt.
 */
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

let client: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  return SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;
}

export function supabaseClient(): SupabaseClient {
  if (!isSupabaseConfigured()) throw new Error("Supabase is not configured (EXPO_PUBLIC_SUPABASE_URL / ANON_KEY).");
  client ??= createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      storage: localStorage,
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      flowType: "pkce",
    },
  });
  return client;
}
