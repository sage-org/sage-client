const path = require('path')
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')
require('@babel/polyfill')

module.exports = {
  mode: 'production',
  entry: [
    '@babel/polyfill',
    './src/lib.js'
  ],
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'sage-client.bundle.js',
    library: 'sage',
    libraryTarget: 'var'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules(?!\/sparql-engine)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['env']
          }
        }
      }
    ]
  },
  resolve: {
    extensions: ['*', '.js']
  },
  node: {
    fs: 'empty',
    net: 'empty',
    tls: 'empty'
  },
  plugins: [
    new UglifyJsPlugin()
  ]
}
