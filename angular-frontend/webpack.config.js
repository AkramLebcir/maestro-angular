module.exports = {
  module: {
    rules: [
      {
        test: /\.js$/,
        enforce: 'pre',
        use: ['source-map-loader'],
        exclude: [
          /node_modules\/webpack/,
          /node_modules\/@angular/,
        ],
      },
    ],
  },
  ignoreWarnings: [
    /Failed to parse source map/,
    /ENOENT: no such file or directory/,
  ],
  // دعم Web Workers
  resolve: {
    extensions: ['.ts', '.js'],
  },
};






