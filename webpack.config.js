const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

const PATHS = {
  src: path.resolve(__dirname, 'src'),
};

const config = {
  entry: [
    './src/index',
  ],
  // Allows us to use 'joi' node module
  node: {
    Buffer: true,
    fs: 'empty',
    net: 'empty',
    tls: 'empty',
    crypto: 'empty',
    dns: 'empty',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'Map Maker',
      template: 'src/index.ejs',
      inject: true,
    }),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify(process.env.NODE_ENV),
      },
    }),
  ],
  module: {
    loaders: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        include: PATHS.src,
        query: {
          presets: ['react', 'es2015', 'stage-0'],
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

  config.plugins.push(new UglifyJsPlugin({
    parallel: true,
  }));

  config.plugins.push(new webpack.optimize.OccurrenceOrderPlugin());
}

module.exports = config;
