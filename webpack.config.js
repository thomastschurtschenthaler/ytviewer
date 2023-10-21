// Generated using webpack-cli https://github.com/webpack/webpack-cli

const path = require('path');
const CopyPlugin = require("copy-webpack-plugin");

const config = {
    entry: './src/index.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: "ytdlbrowser.js"
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                {from: path.resolve(__dirname, "src/ytviewer.html")},
                {from: path.resolve(__dirname, "src/ytviewer.js")},
                {from: path.resolve(__dirname, "src/bootstrap.min.css")},
                {from: path.resolve(__dirname, "src/screen1.png")},
                {from: path.resolve(__dirname, "src/screen2.png")},
            ],
            options: {
              concurrency: 100,
            },
        })
    ],
    module: {
        rules: [
            {
                test: /\info.js$/,
                use: [
                  {
                    loader: path.resolve('ytinfooader.js'),
                    options: {
                      /* ... */
                    },
                  },
                ],
              },
        ],
    },
    resolve: {
        alias: {
            "miniget": require.resolve("./src/miniget.js"),
        },
        fallback: {
            "vm": require.resolve("vm-browserify"),
            "querystring": require.resolve("querystring-es3"),
            "timers": require.resolve("timers-browserify"),
            "stream": require.resolve("stream-browserify")
        }
    }
};

module.exports = () => {
    return config;
};
