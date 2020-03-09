'use strict';

const path = require('path');
const glob = require('glob');
const webpack = require('webpack');
const { CleanWebpackPlugin } = require('clean-webpack-plugin'); // 清除构建目录
const HtmlWebpackPlugin = require('html-webpack-plugin'); // html模板

// 多页面打包通用方案
const setMPA = () => {
    const entry = {};
    const htmlWebpackPlugins = [];

    const entryFiles = glob.sync(path.join(__dirname, '../src/pages/*/index.js'));
    entryFiles.map(entryFile => {
        const match = entryFile.match(/src\/pages\/(.*)\/index\.js/);
        const pageName = match && match[1];
        entry[pageName] = entryFile;
        htmlWebpackPlugins.push(
            // 多页面应用里 一个页面需要对应一个HtmlWebpackPlugin, 因为每个页面都有单独的html模板需要处理
            new HtmlWebpackPlugin({
                template: path.join(__dirname, `../src/pages/${pageName}/index.html`), // 需要处理的html模板所在位置
                filename: `${pageName}.html`, // 打包出来后的html文件名称
                // 打包出来后的html需要使用哪些chunk (需要注入哪些js), chunk是指(多页面应用)当前页面的chunk
                // 单页面应该是main
                chunks: [pageName], 
                inject: true, // 是否执行上面的注入
                minify: { // 压缩html
                    html5: true,
                    collapseWhitespace: true, // 合并空格
                    preserveLineBreaks: true,
                    // 用于去压缩一开始就内联在html模板里面的css和js，不是打包生成的 css 和 js
                    minifyCSS: true,
                    minifyJS: true,
                    removeComments: false // html注释
                }
            }),
        );
    })

    return {
        entry,
        htmlWebpackPlugins
    }
}
const { entry, htmlWebpackPlugins } = setMPA();

module.exports = {
    entry: entry,
    output: {
        path: path.join(__dirname, '../dist'), 
        filename: '[name]_[chunkhash:8].js'
    },
    mode: 'development',
    module: {
        rules: [
            {
                test: /\.js$/,
                use: 'babel-loader'
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            },
            {
                test: /\.less$/,
                use: ['style-loader', 'css-loader', 'less-loader']
            },
            {
                test: /\.(png|jpg|jpeg|gif)$/,
                use: [{
                    loader: 'url-loader',
                    options: {
                        limit: 10240 // 小于10K转为base64
                    }
                }]
            }
        ],
    },
    plugins: [
        new webpack.HotModuleReplacementPlugin(), // 热更新
        new CleanWebpackPlugin() // 清除构建目录
    ].concat(htmlWebpackPlugins),
    devServer: {
        contentBase: './dist',
        hot: true,
        // hotOnly: true // 只使用热更新, 就算更新失败也不去刷新浏览器实现更新
    },
    devtool: 'source-map'
}