const path = require('path');

module.exports = {
    entry: './src/main.ts',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist')
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/
            },
            {
                test: /\.wasm$/,
                type: 'asset/resource',
            },
        ]
    },
    resolve: {
        extensions: ['.ts', '.js'],
        alias: {
            resvg: require.resolve('resvg')
        }
    },
    mode: 'production'
};
