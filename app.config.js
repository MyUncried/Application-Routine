const base = require('./app.json');

const isDevelopmentVariant = process.env.APP_VARIANT === 'development';

module.exports = {
  ...base,
  expo: {
    ...base.expo,
    name: isDevelopmentVariant ? 'Routine Dev' : 'Routine',
    ios: {
      ...base.expo.ios,
      bundleIdentifier: isDevelopmentVariant ? 'com.ankusha.kodjo.dev' : 'com.ankusha.kodjo',
    },
  },
};
