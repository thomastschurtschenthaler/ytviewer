// Generated using webpack-cli https://github.com/webpack/webpack-cli

const path = require('path');
const CopyPlugin = require("copy-webpack-plugin");
const WebpackConcatPlugin = require('webpack-concat-files-plugin');

const config = {
    entry: './src/index.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: "ytdlbrowser.js"
    },
    plugins: [
        new WebpackConcatPlugin({
            bundles: [
              {
                dest: 'dist/ytviewer.js',
                src: ['src/ytplayer.js', 'src/ytviewer.js']
              },
            ],
        }),        
        new CopyPlugin({
            patterns: [
                {from: path.resolve(__dirname, "src/ytviewer.html")},
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
                    loader: path.resolve('ytinfoloader.js'),
                    options: {
                      /* ... */
                    },
                  },
                ],
            }
        ],
    },
    resolve: {
        alias: {
            "miniget": require.resolve("./src/miniget.js"),
            "fs": require.resolve("./src/fs.js"),
            "undici": require.resolve("./src/undici.js"),
            "http-cookie-agent/undici": require.resolve("./src/cookie-agent.js"),
            "./sig": require.resolve("@distube/ytdl-core/lib/sig.js")
        },
        fallback: {
            "vm": require.resolve("vm-browserify"),
            "querystring": require.resolve("querystring-es3"),
            "timers": require.resolve("timers-browserify"),
            "stream": require.resolve("stream-browserify"),
            "util": require.resolve("util/")
        }
    }
};

module.exports = () => {
    return config;
};
