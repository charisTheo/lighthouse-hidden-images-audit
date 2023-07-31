const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const path = require('path');

const DEV_SERVER_PORT = 8080;
const DOCS_OUTPUT_PATH = path.resolve(__dirname, './docs');
const LIB_OUTPUT_PATH = path.resolve(__dirname, './lib');
const SRC_SCRIPT_PATH = path.resolve(__dirname, './src/analyser.js');

module.exports = [
  {
    entry: SRC_SCRIPT_PATH,
    output: {
      path: LIB_OUTPUT_PATH,
      filename: 'index.mjs',
      libraryTarget: 'umd',
      libraryExport: 'default',
      scriptType: 'module',
    },
    stats: 'none',
    name: 'module',
    mode: 'production',
  },
  {
    entry: SRC_SCRIPT_PATH,
    output: {
      path: LIB_OUTPUT_PATH,
      filename: 'index.cjs',
      libraryTarget: 'commonjs',
    },
    stats: 'none',
    name: 'commonjs',
    mode: 'production',
  },
  {
    entry: './src/main.js',
    output: {
      path: DOCS_OUTPUT_PATH,
      filename: '[name].js',
    },
    devServer: {
      openPage: 'docs/',
      open: true,
      hot: true,
      port: DEV_SERVER_PORT,
      stats: 'minimal',
      // quiet: true,
      // noInfo: true,
    },
    module: {
      rules: [
        {
          test: /\.(js|ts)$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: [
                '@babel/preset-env',
                // [ '@babel/preset-env', { targets: "defaults" } ]
                // [ "env", { "modules": false } ],
              ],
              plugins: [
                ['@babel/plugin-transform-runtime', {'regenerator': true}],
              ],
            },
          },
        },
        {
          test: /\.css$/,
          use: [
            MiniCssExtractPlugin.loader,
            'css-loader',
          ],
        },
      ],
    },
    plugins: [
      new CleanWebpackPlugin(),
      new MiniCssExtractPlugin(),
      new HtmlWebpackPlugin({
        template: path.resolve(__dirname, './src/index.html'),
      }),
    ],
    mode: 'development',
  },
];
