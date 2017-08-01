import * as webpack from 'webpack';
import * as path from 'path';
import * as OfflinePlugin from 'offline-plugin';
import * as ManifestPlugin from 'webpack-manifest-plugin';

const nodeModules = path.join(process.cwd(), 'node_modules');
declare var __dirname;

const config: webpack.Configuration = {
  entry: './index.js',
  output: {
    filename: '[name].js',
    chunkFilename: '[id].chunk.js',
    path: path.resolve(__dirname, '/')
  },
  module: {
    rules: [
     {
       test: /\.css$/,
       use: [
         'style-loader',
         'css-loader'
       ]
     },
     {
       test: /\.(woff|woff2|eot|ttf|otf|svg)$/,
       use: [
         'file-loader'
       ]
     }
    ]
  },
  plugins: [
    new webpack.optimize.CommonsChunkPlugin({
      'name': 'vendor',
      'minChunks': (module) => module.resource && module.resource.startsWith(nodeModules),
    }),
    new OfflinePlugin({
      externals: [
        './index.html',
        './vendor.js',
        './main.js',
        './assets/images/dgh.png',
        './assets/fonts/icomoon.svg',
        './assets/fonts/icomoon.ttf',
        './assets/fonts/icomoon.woff',
        './assets/fonts/icomoon.eot',
      ]
    }),
    new ManifestPlugin({
      cache: {
        name: 'd-g-h.co',
        short_name: 'd-g-h',
        display: 'minimal-ui',
        description: 'dgh\'s thoughts',
        start_url: '/',
        theme_color: '#4078c0',
        background_color: '#fff',
        icons: [
          {
            'src': '/assets/images/dgh-72x72.png',
            'sizes': '72x72',
            'type': 'image/png'
          },
          {
            'src': '/assets/images/dgh-96x96.png',
            'sizes': '96x96',
            'type': 'image/png'
          },
          {
            'src': '/assets/images/dgh-128x128.png',
            'sizes': '128x128',
            'type': 'image/png'
          },
          {
            'src': '/assets/images/dgh-144x144.png',
            'sizes': '144x144',
            'type': 'image/png'
          },
          {
            'src': '/assets/images/dgh-152x152.png',
            'sizes': '152x152',
            'type': 'image/png'
          },
          {
            'src': '/assets/images/dgh-192x192.png',
            'sizes': '192x192',
            'type': 'image/png'
          },
          {
            'src': '/assets/images/dgh-384x384.png',
            'sizes': '384x384',
            'type': 'image/png'
          },
          {
            'src': '/assets/images/dgh-512x512.png',
            'sizes': '512x512',
            'type': 'image/png'
          }
        ],
      }
    })
  ]
};

export default config;
