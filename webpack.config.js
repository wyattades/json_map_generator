const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const PATHS = {
  src: path.resolve(__dirname, 'src'),
};

const config = {
  entry: [
    'babel-polyfill',
    './src/index',
  ],
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Map Maker',
      template: 'src/index.ejs',
      // favicon: 'src/favicon.ico',
      inject: 'body',
    }),
  ],
  module: {
    loaders: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        include: PATHS.src,
        query: {
          presets: ['es2015', 'stage-0'],
        },
      }, {
        test: /\.scss$/,
        loaders: ['style-loader', 'css-loader', 'sass-loader'],
        include: PATHS.src,
      },
    ],
  },
};

if (process.env.NODE_ENV !== 'development') {
  config.plugins.push(new webpack.optimize.UglifyJsPlugin({
    minimize: true,
    compressor: {
      warnings: false,
      screw_ie8: true,
    },
  }));
}

module.exports = config;
