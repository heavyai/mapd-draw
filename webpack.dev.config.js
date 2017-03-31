var webpack = require("webpack");
var path = require("path");

module.exports = {
  context: __dirname + "/src",
  entry: {
    "mapd-draw": "./mapd-draw.js"
  },
  output: {
    path: __dirname + "/dist",
    filename: "[name]-dev.js",
    sourceMapFilename: "[name].dev.js.map",
    libraryTarget: "umd",
    library: "MapdDraw"
  },
  externals: {
  },
  module: {
    loaders: [
      {
        test: /\.js?$/,
        exclude: /node_modules/,
        loader: "babel-loader"
      },
      {
        test: /\.json?$/,
        exclude: /node_modules/,
        loader: "json-loader"
      }
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      "process.env": {
        NODE_ENV: JSON.stringify("production")
      }
    }),
    // new webpack.OldWatchingPlugin(),
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.optimize.DedupePlugin(),
  ],
  devtool: "eval-source-map",
  resolve: {
    extensions: ["", ".js"]
  }
};
