import type { Profile } from "./Profile";

/** Le Profil reste un agrégat SINGLETON (plan §3.2) : une seule ligne existe toujours après initialisation — jamais `null`. */
export interface ProfileRepository {
  get(): Promise<Profile>;
}
