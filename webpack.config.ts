import { Configuration } from 'webpack';
import { resolve } from 'path';
// const WebpackBundleAnalyzer = require('webpack-bundle-analyzer');

const config: Configuration = {
  target: 'node',
  entry: {
    extension: './src/extension.ts',
    server: './src/server.ts',
  },
  cache: true,
  output: {
    path: resolve(__dirname, 'dist'),
    filename: '[name].js',
    libraryTarget: 'commonjs2',
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  // plugins: [new WebpackBundleAnalyzer.BundleAnalyzerPlugin()],
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader',
          },
        ],
      },
    ],
  },
  externals: {
    vscode: 'commonjs vscode',
  },
};
export default config;
