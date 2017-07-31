import * as webpack from 'webpack';
import * as path from 'path';
const nodeModules = path.join(process.cwd(), 'node_modules');
declare var __dirname;

const config: webpack.Configuration = {
  entry: './index.js',
  output: {
    filename: '[name].js',
    chunkFilename: '[id].chunk.js',
    path: path.resolve(__dirname, 'dist')
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
  ]
};

export default config;