export default {
  expo: {
    name: 'Bet On It',
    slug: 'bet-on-it',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#667eea'
    },
    assetBundlePatterns: [
      '**/*'
    ],
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.betonit.app'
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#667eea'
      },
      package: 'com.betonit.app'
    },
    web: {
      favicon: './assets/favicon.png'
    },
    plugins: [
      'expo-notifications'
    ]
  }
};