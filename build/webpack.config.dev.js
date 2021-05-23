const webpackConfig = require('./webpack.config');

module.exports = webpackConfig.config({
    date: new Date(),
    mode: 'development',
    sha: 'dev'
});
