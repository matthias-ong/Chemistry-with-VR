const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin")
const CopyPlugin = require("copy-webpack-plugin")

module.exports = {
    entry: path.resolve(__dirname, './src/index.ts'),
    output: {
        filename: 'index.js',
        path: path.resolve(__dirname, 'dist/app')
    },
    resolve: {
        extensions: [".ts", ".js"]
    },
    module: {
        rules: [
            { test: /\.tsx?$/, loader: "ts-loader" }
        ]
    },
    mode: "development",
    devtool: 'inline-source-map', //see error msges (optional)
    devServer: {
        //static files e.g. non code, assets by default is true, you can specify a path though
        //static: true, 
        port: 3001,
        server: "https"
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, 'src/index.html'),
        }),
        new CopyPlugin({
            patterns: [
                { from: path.resolve(__dirname, 'public') }
            ]
        })
    ]
};