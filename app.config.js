const base = require('./app.json');

const isDevelopmentVariant = process.env.APP_VARIANT === 'development';

// Variante de développement « Routine BMAD » (expérimentation PRE-4 BMAD,
// décision de Hermann du 2026-10-17) : application distincte de
// « Routine Dev », installée à côté d'elle, avec ses propres données.
// Identifiant iOS, nom, icône et schéma de lien distincts ; le schéma
// généré `exp+routine` du dev client n'est pas ajouté, pour qu'aucun lien
// ne puisse ouvrir l'une à la place de l'autre.
const isBmadVariant = process.env.APP_VARIANT === 'bmad';

function variantConfig() {
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
