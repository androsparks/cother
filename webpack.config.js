const path = require('path');
const autoprefixer = require('autoprefixer');
const webpack = require('webpack');
const AssetsPlugin = require('assets-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const ImageminPlugin = require('imagemin-webpack-plugin').default;
const imageminMozjpeg = require('imagemin-mozjpeg');
const uniqueIdGenerator = require('./uniqueIdGenerator');
const pkg = require('./package.json');

const isDebug = global.DEBUG;
const isVerbose = process.argv.includes('--verbose') || process.argv.includes('-v');
const babelConfig = Object.assign({}, pkg.babel, {
  babelrc: false,
  cacheDirectory: isDebug,
});

const postcssPlugins = [
  autoprefixer({
    browsers: ['>1%', 'last 4 versions', 'Firefox ESR', 'not ie < 9'],
  }),
  require('postcss-flexibility'),
];

const cssModuleParam = (isModule) => {
  const param = {
    sourceMap: isDebug,
    modules: isModule,
    minimize: !isDebug,
    // localIdentName: isDebug ? '[name]__[local]__[hash:base64:5]' : '[hash:base64]',
    localIdentName: '[name]__[local]__[hash:base64:5]',
  };

  if (!isDebug) {
    // https://goo.gl/B2fe2b
    param.getLocalIdent = (context, localIdentName, localName) => {
      // const componentName = context.resourcePath.split('/').slice(-2, -1);
      return `${uniqueIdGenerator(context.resourcePath)}_${uniqueIdGenerator(localName)}`;
    };
  }

  return param;
};

const cssLoader = {
  test: /\.css$/,
  exclude: [/\.mod\.css/, /\.string\.css/],
};

const cssModLoader = {
  test: /\.mod\.css?$/,
};

const scssLoader = {
  test: /\.scss$/,
  exclude: [/\.mod\.scss$/, /\.string\.scss$/],
};

const scssModLoader = {
  test: /\.mod\.scss$/,
};

if (isDebug) {
  cssLoader.use = [
    'style-loader',
    { loader: 'css-loader', options: cssModuleParam(false) },
    { loader: 'postcss-loader', options: { plugins: () => [...postcssPlugins] } },
  ];
  cssModLoader.use = [
    'style-loader',
    { loader: 'css-loader', options: cssModuleParam(true) },
    { loader: 'postcss-loader', options: { plugins: () => [...postcssPlugins] } },
  ];
  scssLoader.use = [
    'style-loader',
    { loader: 'css-loader', options: cssModuleParam(false) },
    { loader: 'postcss-loader', options: { plugins: () => [...postcssPlugins] } },
    'sass-loader',
  ];
  scssModLoader.use = [
    'style-loader',
    { loader: 'css-loader', options: cssModuleParam(true) },
    { loader: 'postcss-loader', options: { plugins: () => [...postcssPlugins] } },
    'sass-loader',
  ];
} else {
  cssLoader.use = ExtractTextPlugin.extract({
    fallback: 'style-loader',
    use: [
      {
        loader: 'css-loader',
        options: Object.assign({}, cssModuleParam(false), { importLoaders: 1 }),
      },
      { loader: 'postcss-loader', options: { plugins: () => [...postcssPlugins] } },
    ],
  });
  cssModLoader.use = ExtractTextPlugin.extract({
    fallback: 'style-loader',
    use: [
      {
        loader: 'css-loader',
        options: Object.assign({}, cssModuleParam(true), { importLoaders: 1 }),
      },
      { loader: 'postcss-loader', options: { plugins: () => [...postcssPlugins] } },
    ],
  });
  scssLoader.use = ExtractTextPlugin.extract({
    fallback: 'style-loader',
    use: [
      {
        loader: 'css-loader',
        options: Object.assign({}, cssModuleParam(false), { importLoaders: 2 }),
      },
      { loader: 'postcss-loader', options: { plugins: () => [...postcssPlugins] } },
      'sass-loader',
    ],
  });
  scssModLoader.use = ExtractTextPlugin.extract({
    fallback: 'style-loader',
    use: [
      {
        loader: 'css-loader',
        options: Object.assign({}, cssModuleParam(true), { importLoaders: 2 }),
      },
      { loader: 'postcss-loader', options: { plugins: () => [...postcssPlugins] } },
      'sass-loader',
    ],
  });
}

const config = {
  entry: {
    vendor: [
      'babel-polyfill',
      'react',
      'react-dom',
      'react-ga',
      'react-redux',
      'react-router',
      'redux',
      'redux-thunk',
      'prop-types',
      'classnames',
      'css-element-queries',
      'lodash',
    ],
    main: [
      './src/index',
    ],
  },
  // Developer tool to enhance debugging, source maps
  // http://webpack.github.io/docs/configuration.html#devtool
  devtool: isDebug ? 'cheap-module-eval-source-map' : false,
  // What information should be printed to the console
  stats: {
    colors: true,
    reasons: isDebug,
    hash: isVerbose,
    version: isVerbose,
    timings: true,
    chunks: true,
    chunkModules: isVerbose,
    cached: isVerbose,
    cachedAssets: isVerbose,
  },
  plugins: [
    new AssetsPlugin({
      path: path.resolve(__dirname, global.DIST_FOLDER),
      filename: 'assets.json',
      prettyPrint: true,
    }),
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendor',
      filename: 'vendor.[hash].js',
      minChunks: Infinity,
    }),
    new webpack.optimize.OccurrenceOrderPlugin(),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: isDebug ? JSON.stringify('development') : JSON.stringify('production'),
      },
    }),
  ],
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        loaders: [`babel-loader?${JSON.stringify(babelConfig)}`],
        include: __dirname,
        exclude: /(node_modules|bower_components)/,
      },
      cssLoader,
      cssModLoader,
      scssLoader,
      scssModLoader,
      {
        test: /\.string\.css?$/,
        loader: 'css-to-string-loader!css-loader',
      },
      {
        test: /\.string\.scss?$/,
        loader: 'css-to-string-loader!css-loader!sass-loader',
      },
      {
        test: /\.json$/,
        loader: 'json-loader',
      },
      {
        test: /\.(ico|jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|csv)(\?.*)?$/,
        loader: 'file-loader',
        query: {
          name: 'media/[hash].[ext]',
        },
      },
      {
        test: /\.(mp4|webm|wav|mp3|m4a|aac|ogg)(\?.*)?$/,
        loader: 'url-loader',
        query: {
          limit: 10000,
          name: 'media/[hash].[ext]',
        },
      },
      {
        test: /\.(html|txt)(\?.*)?$/,
        loader: 'raw-loader',
      },
    ],
  },
  output: {
    path: path.join(__dirname, global.DIST_FOLDER),
    publicPath: isDebug ? `http://localhost:${global.PORT}/` : '/dist/',
    filename: isDebug ? '[name].js?[hash]' : '[name].[hash].js',
    chunkFilename: isDebug ? '[id].js?[chunkhash]' : '[id].[chunkhash].js',
    sourcePrefix: '  ',
  },
};

if (isDebug) {
  // Development mode
  babelConfig.plugins.unshift('react-hot-loader/babel');
  config.entry.main.unshift(
    'react-hot-loader/patch',
    'webpack-hot-middleware/client',
  );
  config.plugins.push(new webpack.HotModuleReplacementPlugin());
} else {
  // Optimize the bundle in production mode
  config.plugins.push(new ExtractTextPlugin({
    filename: '[name].[hash].css',
    allChunks: true,
  }));
  config.plugins.push(new webpack.optimize.UglifyJsPlugin({
    compress: {
      warnings: isVerbose,
    },
  }));
  config.plugins.push(new webpack.optimize.AggressiveMergingPlugin());
  config.plugins.push(
    new ImageminPlugin({
      optipng: {
        optimizationLevel: 3,
      },
      plugins: [
        imageminMozjpeg({
          quality: 95,
          progressive: true,
        }),
      ],
    }),
  );
}

// eslint-disable-next-line no-console
console.log(`=> ${isDebug ? '`development`' : '`production`'} env`);

module.exports = config;
