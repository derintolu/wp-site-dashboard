const defaultConfig = require('@wordpress/scripts/config/webpack.config');

module.exports = {
    ...defaultConfig,
    entry: {
        index: './src/index.js',
        admin: './src/admin.js'
    },
    externals: {
        ...defaultConfig.externals,
        'react': ['wp', 'element'],
        'react-dom': ['wp', 'element'],
        'react/jsx-runtime': ['wp', 'element']
    }
}; 