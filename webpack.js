var path = require('path');
var webpack = require('webpack');

module.exports = {
    target:'web',
    entry: [ "./src/notifier.js" ],
    output: {
        path: path.join(__dirname, "./dist"),
        filename: "notifier.min.js",
        library:"EasyNotify",
        libraryTarget: 'umd',
        globalObject:'this',
        umdNamedDefine:true
    },

  module: {
    rules: [
      { test: /\.js$/, use: [ { loader: 'babel-loader' } ], exclude: /node_modules/ }
    ]
  },

  plugins: [
    new webpack.LoaderOptionsPlugin({
      minimize: true,
      debug: false
    }),
    new webpack.LoaderOptionsPlugin({
      minimize: true
    })
  ]
};