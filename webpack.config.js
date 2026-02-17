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
      // Explicitly point to the core package to help resolution
      'react-native-worklets': 'react-native-worklets-core', 
    },
    extensions: ['.web.js', '.web.tsx', '.js', '.jsx', '.ts', '.tsx'],
  },
  // This section silences the TurboModuleRegistry warning
  stats: {
    warningsFilter: [/export 'TurboModuleRegistry' was not found in 'react-native'/],
  },
  module: {
    rules: [
      {
        test: /\.[jt]sx?$/,
        // Expanded include to ensure Reanimated and Worklets are transpiled for web
        include: [
          path.resolve(__dirname, 'index.web.js'),
          path.resolve(__dirname, 'App.tsx'),
          path.resolve(__dirname, 'AppRouter.tsx'),
          path.resolve(__dirname, 'src'),
          path.resolve(__dirname, 'node_modules/react-native-vector-icons'),
          path.resolve(__dirname, 'node_modules/react-native-reanimated'),
          path.resolve(__dirname, 'node_modules/react-native-worklets-core'),
        ],
	use: {
        loader: 'babel-loader',
        options: {
          cacheDirectory: true,
        },
      },
      },
      {
        test: /\.m?js$/,
        resolve: { fullySpecified: false },
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg)$/,
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
