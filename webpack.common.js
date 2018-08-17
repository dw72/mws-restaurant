const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackExcludeAssetsPlugin = require('html-webpack-exclude-assets-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  entry: {
    'js/main': './src/js/main.js',
    'js/restaurant': './src/js/restaurant_info.js',
    sw: './src/sw.js',
    styles: './src/css/styles.css'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    chunkFilename: '[name].js',
    filename: '[name].js'
  },
  plugins: [
    new CopyWebpackPlugin([{ from: 'src/offline.html', to: 'offline.html' }]),
    new CopyWebpackPlugin([{ from: 'src/favicon.ico', to: 'favicon.ico' }]),
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: 'src/index.html',
      excludeAssets: [/styles.*\.js/],
      chunks: ['styles', 'js/main']
    }),
    new HtmlWebpackPlugin({
      filename: 'restaurant.html',
      template: 'src/restaurant.html',
      excludeAssets: [/styles.*\.js/],
      chunks: ['styles', 'js/restaurant']
    }),
    new HtmlWebpackExcludeAssetsPlugin(),
    new MiniCssExtractPlugin({
      filename: 'css/[name].css',
      chunkFilename: 'css/[name].css'
    })
  ],
  module: {
    rules: [
      {
        test: /\.(png|jpe?g|gif)$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 8192,
              fallback: 'responsive-loader',
              sizes: [840, 720, 600, 480, 360],
              quality: 70,
              name: 'img/[name]-[width]px.[ext]'
            }
          }
        ]
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, 'css-loader']
      }
    ]
  }
};
