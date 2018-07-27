const webpack = require('webpack');
const path = require('path');
const copyWebpackPlugin = require('copy-webpack-plugin');

// ソースマップの利用有無(productionのときはソースマップを利用しない)
// const enabledSourceMap = (MODE === 'development');


// plugins.push(new CopyWebpackPlugin(
//     [{
//         from: `${dir.app}/assets`,
//         to: `${dir.build}/assets`,
//     }]));

module.exports = {
    // モードの設定、v4系以降はmodeを指定しないと、webpack実行時に警告が出る
    // webpack v4からUglifyJsPluginが無くなり、代わりにmode=productionにすると、自動的にuglifyされるようになる
    mode: process.env.NODE_ENV || "development",
    entry: {
        libs: path.join(__dirname, 'src/libs.js'),
        app: path.join(__dirname, 'src/app.js'),
    },
    output: {
        path: path.join(__dirname, 'public/js'),
        filename: '[name].js'
            // filename: '[name]-[hash].js'
    },
    plugins: [
        new webpack.ProvidePlugin({
            $: 'jquery',
            jQuery: 'jquery',
            'window.jQuery': 'jquery',
            'window.$': 'jquery',
            Popper: ['popper.js', 'default'],
        })
    ],
    module: {
        rules: [{
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            },
            {
                test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
                loader: "url-loader?limit=10000&mimetype=application/font-woff"
            },
            {
                test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
                loader: "file-loader"
            }
        ]
    },
    cache: true
};