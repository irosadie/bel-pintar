module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
  plugins: [
    'nativewind/babel',
    'react-native-reanimated/plugin',
    [
      'module-resolver',
      {
        root: ['.'],
        alias: {
          '@components': './src/components',
          '@screens': './src/screens',
          '@navigations': './src/navigations',
          '@utils': './src/utils',
          '@assets': './src/assets',
        },
      },
    ],
  ],
};
