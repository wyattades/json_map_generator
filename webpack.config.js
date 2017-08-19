const path = require('path');
const webpack = require('webpack');

const config = {
  entry: [
    'babel-polyfill',
    './src/index',
  ],
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
  },
  module: {
    loaders: [
      {
        loader: 'babel-loader',

        // Skip any files outside of your project's `src` directory
        include: [
          path.resolve(__dirname, 'src'),
        ],

        // Only run `.js` and `.jsx` files through Babel
        test: /\.js$/,

        // Options to configure babel with
        query: {
          presets: ['es2015', 'stage-0'],
        },
      },
    ],
  },
};

if (process.env.NODE_ENV !== 'development') {
  config.plugins = [
    new webpack.optimize.UglifyJsPlugin({
      minimize: true,
      compressor: {
        warnings: false,
        screw_ie8: true,
      },
    }),
  ];
}

module.exports = config;
