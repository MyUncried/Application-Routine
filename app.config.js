const base = require('./app.json');

const isDevelopmentVariant = process.env.APP_VARIANT === 'development';

// Variante de développement « Routine BMAD » (expérimentation PRE-4 BMAD,
// décision de Hermann du 2026-10-17) : application distincte de
// « Routine Dev », installée à côté d'elle, avec ses propres données.
// Identifiant iOS, nom, icône et schéma de lien distincts ; le schéma
// généré `exp+routine` du dev client n'est pas ajouté, pour qu'aucun lien
// ne puisse ouvrir l'une à la place de l'autre.
const isBmadVariant = process.env.APP_VARIANT === 'bmad';

// Variante temporaire « Routine Catalogue » (décision de Hermann du
// 2026-11-09 : recette du chargement des 60 mouvements pilotes) : application
// distincte, installée à côté des autres, avec sa propre base SQLite.
// Identifiant iOS et schéma de lien distincts ; mises à jour OTA désactivées
// (bundle embarqué uniquement) pour qu'aucune publication sur un canal ne
// l'atteigne ni qu'elle n'en consomme une.
const isCatalogueVariant = process.env.APP_VARIANT === 'catalogue';

function variantConfig() {
  if (isCatalogueVariant) {
    return {
      ...base.expo,
      name: 'Routine Catalogue',
      scheme: 'routine-catalogue',
      updates: { ...base.expo.updates, enabled: false },
      ios: {
        ...base.expo.ios,
        bundleIdentifier: 'com.ankusha.kodjo.catalogue',
      },
      plugins: [...base.expo.plugins, ['expo-dev-client', { addGeneratedScheme: false }]],
    };
  }
  if (isBmadVariant) {
    return {
      ...base.expo,
      name: 'Routine BMAD',
      scheme: 'routine-bmad',
      ios: {
        ...base.expo.ios,
        icon: './assets/variants/bmad/icon.png',
        bundleIdentifier: 'com.ankusha.kodjo.bmad',
      },
      plugins: [...base.expo.plugins, ['expo-dev-client', { addGeneratedScheme: false }]],
    };
  }
  return {
    ...base.expo,
    name: isDevelopmentVariant ? 'Routine Dev' : 'Routine',
    ios: {
      ...base.expo.ios,
      bundleIdentifier: isDevelopmentVariant ? 'com.ankusha.kodjo.dev' : 'com.ankusha.kodjo',
    },
  };
}

module.exports = {
  ...base,
  expo: variantConfig(),
};
