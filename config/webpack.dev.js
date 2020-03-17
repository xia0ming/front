'use strict';

const merge = require('webpack-merge');
const baseConfig = require('./webpack.base');
const webpack = require('webpack');

const devConfig = {
    mode: 'development',
    plugins: [
        new webpack.HotModuleReplacementPlugin(), // 热更新
    ],
    devServer: {
        contentBase: './dist',
        hot: true,
        // hotOnly: true // 只使用热更新, 就算更新失败也不去刷新浏览器实现"修改后自动更新"
    },
    devtool: 'source-map'
};

module.exports = merge(baseConfig, devConfig);