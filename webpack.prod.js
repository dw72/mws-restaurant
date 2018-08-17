const path = require('path');
const glob = require('glob');
const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const PurifyCSSPlugin = require('purifycss-webpack');
const HtmlCriticalWebpackPlugin = require('html-critical-webpack-plugin');
const WebpackPwaManifest = require('webpack-pwa-manifest');

module.exports = merge(common, {
  mode: 'production',
  optimization: {
    minimize: true,
    minimizer: [
      new UglifyJsPlugin({
        cache: true,
        parallel: true,
        sourceMap: true
      })
    ]
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: 'css/[name].css',
      chunkFilename: 'css/[name].css'
    }),
    PurifyCSSPlugin({
      paths: glob.sync(path.join(__dirname, 'src/*.html')),
      purifyOptions: {
        whitelist: ['svg']
      },
      minimize: true
    }),
    new HtmlCriticalWebpackPlugin({
      base: path.resolve(__dirname, 'dist/'),
      src: 'index.html',
      dest: 'index.html',
      inline: true,
      minify: true,
      extract: false,
      width: 375,
      height: 565,
      penthouse: {
        blockJSRequests: false
      }
    }),
    new WebpackPwaManifest({
      name: 'MWS Restaurants - Stage 3',
      short_name: 'MWS Restaurants',
      description: 'Mobile Web Specialist Restaurant Reviews App',
      background_color: '#4285f4',
      theme_color: '#4285f4',
      'theme-color': '#4285f4',
      start_url: '/',
      icons: [
        {
          src: path.resolve('src/img/launcher.png'),
          sizes: [48, 96, 128, 192, 256, 384, 512],
          destination: path.join('img', 'icons')
        }
      ]
    })
  ]
});
