const path = require('path')
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')

module.exports = {
  mode: 'production',
  entry: './src/lib.js',
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
        exclude: /node_modules/,
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
