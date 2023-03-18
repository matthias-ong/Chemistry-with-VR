const path = require("path");
const CopyPlugin = require("copy-webpack-plugin")

module.exports = {
    entry: './src/index-ext.ts',
    output: {
        filename: 'index.js',
        path: path.resolve(__dirname, 'dist/ext')
    },
    resolve: {
        extensions: [".ts"]
    },
    module: {
        rules: [
            { test: /\.tsx?$/, loader: "ts-loader" }
        ]
    },
    mode: "production", //1st develop app as standalone and build it as production extension
    plugins: [
        new CopyPlugin({
            patterns: [
                {
                    from: path.resolve(__dirname, 'public'),
                    globOptions: {
                        //ignore assets that are already on XRAuthor
                        ignore: ['**/synthesisDecompBalanced/**']
                    }
                }
            ]
        })
    ]
};