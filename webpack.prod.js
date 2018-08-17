const path = require('path');
const merge = require('webpack-merge');
const common = require('./webpack.common.js');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
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
      }),
      new OptimizeCSSAssetsPlugin({})
    ]
  },
  plugins: [
    new CleanWebpackPlugin('dist', { dry: false }),
    new HtmlCriticalWebpackPlugin({
      base: path.resolve(__dirname, 'dist/'),
      src: 'index.html',
      dest: 'index.html',
      inline: true,
      minify: true,
      extract: false,
      width: 375,
      height: 667,
      penthouse: {
        blockJSRequests: false
      }
    }),
    new HtmlCriticalWebpackPlugin({
      base: path.resolve(__dirname, 'dist/'),
      src: 'restaurant.html',
      dest: 'restaurant.html',
      inline: true,
      minify: true,
      extract: false,
      width: 375,
      height: 667,
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
