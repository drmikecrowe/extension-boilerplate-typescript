const fs = require("fs");
const path = require("path");
const webpack = require("webpack");

const pkgJson = require("../package.json");

const CopyWepbackPlugin = require("copy-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const GenerateJsonPlugin = require("generate-json-webpack-plugin");
const TsconfigPathsPlugin = require("tsconfig-paths-webpack-plugin");
const VueLoaderPlugin = require("vue-loader").VueLoaderPlugin;

const isDev = process.env.NODE_ENV === "development";

const target = process.env.TARGET || "chrome";
const environment = process.env.NODE_ENV || "development";

const manifestTemplate = JSON.parse(fs.readFileSync(resolve(`/manifest.json`)));
const manifestOptions = {
  firefox: {
    applications: {
      gecko: {
        id: pkgJson.name + "@mozilla.org",
      },
    },
  },
};
const manifest = Object.assign({}, manifestTemplate, target === "firefox" ? manifestOptions.firefox : {});

function resolve(dir) {
  return path.join(__dirname, "..", dir);
}

const webpackConfig = {
  entry: {
    background: resolve("src/background/index.ts"),
    contentscript: resolve("src/contentscript/index.ts"),
    options: [resolve("src/options/index.ts"), resolve(`src/assets/${target}-options.css`)],
    popup: resolve("src/popup/index.ts"),
  },
  output: {
    path: resolve(`build/${target}`),
    filename: "scripts/[name].js",
  },
  optimization: {
    splitChunks: false,
  },
  resolve: {
    extensions: [".js", ".ts", ".tsx", ".json", ".sass", ".scss", ".vue"],
    modules: [resolve("src"), resolve("node_modules")],
    alias: {
      src: resolve("src"),
      lodash: "lodash-es",
    },
    plugins: [
      new TsconfigPathsPlugin({
        configFile: resolve("/tsconfig.json"),
        extensions: [".ts", ".tsx", ".js", ".vue"],
      }),
    ],
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        use: "vue-loader",
      },
      // Super thanks to https://stackoverflow.com/a/55234989
      {
        test: /\.tsx?$/,
        loader: "ts-loader",
        exclude: /node_modules/,
        options: {
          transpileOnly: isDev,
          appendTsSuffixTo: [/\.vue$/],
        },
      },
      {
        test: /\.s?[ac]ss$/,
        use: ["style-loader", "css-loader", "postcss-sass-loader"],
      },
      {
        test: /\.md$/,
        use: [
          {
            loader: "html-loader",
          },
          {
            loader: "markdown-loader",
            options: {
              /* your options here */
            },
          },
        ],
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".vue"],
    plugins: [
      new TsconfigPathsPlugin({
        configFile: resolve("/tsconfig.json"),
        extensions: [".ts", ".tsx", ".js", ".vue"],
      }),
    ],
    alias: {
      lodash: "lodash-es",
    },
  },
  plugins: [
    require("tailwindcss"),
    new VueLoaderPlugin(),
    new CopyWepbackPlugin([{ from: resolve("public"), to: resolve(`build/${target}`) }]),
    new GenerateJsonPlugin(`manifest.json`, manifest),
    new MiniCssExtractPlugin(),
    new webpack.DefinePlugin({
      "process.env": require(`../env/${environment}.env`),
    }),
  ],
  stats: "minimal"
};

module.exports = {
  manifest,
  resolve,
  webpackConfig,
  target,
  pkgJson,
};
