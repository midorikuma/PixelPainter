const path = require('path');

module.exports = {
    entry: './src/main.ts',  // エントリーポイント（main.tsを起点に依存ファイルを解決）
    output: {
        filename: 'bundle.js',          // 出力されるファイル名
        path: path.resolve(__dirname, 'dist')  // 出力先ディレクトリ
    },
    module: {
        rules: [
            {
                test: /\.ts$/,              // .ts ファイルを対象
                use: 'ts-loader',           // ts-loaderを使ってTypeScriptをコンパイル
                exclude: /node_modules/     // node_modulesは除外
            }
        ]
    },
    resolve: {
        extensions: ['.ts', '.js']      // import文で拡張子を省略可能に
    },
    mode: 'production'                // プロダクションモードで最適化
};
