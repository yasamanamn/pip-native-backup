const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: path.resolve(__dirname, 'index.web.js'),
 output: {
  path: path.resolve(__dirname, 'dist'),
  filename: 'bundle.js',
  publicPath: '/',
  clean: true,
},

resolve: {
  alias: {
    'react-native$': 'react-native-web',
    'react-native-reanimated': path.resolve(__dirname, 'reanimated-web-shim.js'),
    'react-native-worklets': 'react-native-worklets-core',

    '@expo/vector-icons/MaterialCommunityIcons': path.resolve(__dirname, 'src/components/PaperIconShim.js'),
  },
  extensions: ['.web.js', '.web.tsx', '.js', '.jsx', '.ts', '.tsx'],
},

  stats: {
    warningsFilter: [/export 'TurboModuleRegistry' was not found in 'react-native'/],
  },
 module: {
  rules: [
{
  test: /\.[jt]sx?$/,
  include: [
    path.resolve(__dirname, 'index.web.js'),
    path.resolve(__dirname, 'App.tsx'),
    path.resolve(__dirname, 'AppRouter.tsx'),
    path.resolve(__dirname, 'src'),
    path.resolve(__dirname, 'node_modules/react-native-vector-icons'),
    path.resolve(__dirname, 'node_modules/react-native-reanimated'),
    path.resolve(__dirname, 'node_modules/react-native-worklets-core'),
    path.resolve(__dirname, 'node_modules/@expo/vector-icons'),
  ],
  use: {
    loader: 'babel-loader',
    options: {
      cacheDirectory: true,
      presets: [
        '@babel/preset-env',
        '@babel/preset-react',
        '@babel/preset-typescript',
      ],
      plugins: [
        '@babel/plugin-proposal-class-properties',
        'react-native-web',
      ],
    },
  },
},

    { test: /\.m?js$/, resolve: { fullySpecified: false } },

    {
      test: /\.(png|jpg|jpeg|gif|svg)$/,
      type: 'asset/resource',
    },

    {
      test: /\.ttf$/,
      type: 'asset/resource',
    },

    {
      test: /\.css$/i,
      include: /node_modules/,
      use: ['style-loader', 'css-loader'],
    },
  ],
},
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
    }),
  ],
  devServer: {
    static: { directory: path.join(__dirname, 'public') },
    port: 3001,
    hot: true,
    historyApiFallback: true,
    // Note: set to false if running in headless Docker to avoid browser errors
    open: false, 
    host: '0.0.0.0', 
  },
};
