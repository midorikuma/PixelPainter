const path = require('path');

module.exports = {
    target: 'webworker',  // Cloudflare Workers のため 'webworker' を指定
    entry: './src/index.ts',  // エントリーポイントのパスが正しいことを確認
    output: {
        filename: 'bundle.js',  // 出力ファイル名
        path: path.resolve(__dirname, 'dist'),
        publicPath: undefined,         // 空文字列を指定してパス推測を無効化
        globalObject: 'this',   // グローバルオブジェクトを 'this' に設定
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/
            },
        ],
    },
    resolve: {
        extensions: ['.ts', '.js']
    },
    mode: 'production'
};
