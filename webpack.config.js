const path = require("path");
const webpackNodeExternals = require("webpack-node-externals");

/** @type import("webpack").WebpackOptions */
module.exports = {
  mode: "development",
  target: "node",
  entry: {
    daily: path.resolve(__dirname, "./src/handlers/daily.ts"),
  },
  externals: [
    webpackNodeExternals({
      allowlist: [/^(?!chrome-aws-lambda$).+$/],
    }),
  ],
  output: {
    filename: "handlers/[name]/index.js",
    path: path.resolve(__dirname, "dist"),
    libraryTarget: "commonjs2",
  },
  devtool: "inline-source-map",
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: {
          loader: "ts-loader",
          options: {
            transpileOnly: true,
          },
        },
      },
      {
        test: /\.js$/,
        use: "unlazy-loader",
      },
      {
        test: /node_modules\/puppeteer-extra\/dist\/index\.esm\.js/,
        loader: "string-replace-loader",
        options: {
          search: "require[(]([^'\"])",
          replace: "__non_webpack_require__($1",
          flags: "g",
        },
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
};
