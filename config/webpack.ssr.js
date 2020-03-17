'use strict';
/*
    服务端渲染: 
    从需要服务端渲染的页面入口开始, 单独打包出提供给服务端的组件和HTML模板
    服务端监听需要ssr的页面的路由, 收到请求时读取对应的打包好的HTML模板和组件, 将组件renderToString并插入HTML模板,
    然后返回整个拼接好的HTML字符串
*/

const path = require('path');
const glob = require('glob');
const merge = require('webpack-merge');
const baseConfig = require('./webpack.base');
const HtmlWebpackPlugin = require('html-webpack-plugin'); // html模板
const webpack = require('webpack');


// 多页面打包通用方案 + 服务器端渲染
const setMPA = () => {
    const entry = {};
    const htmlWebpackPlugins = [];

    const entryFiles = glob.sync(path.join(__dirname, '../src/pages/*/index-server.js')); // 需要服务器端渲染的page才打包
    entryFiles.map(entryFile => {
        const match = entryFile.match(/src\/pages\/(.*)\/index-server\.js/);
        const pageName = match && match[1];
        entry[pageName] = entryFile;
        htmlWebpackPlugins.push(
            // 多页面应用里 一个页面需要对应一个HtmlWebpackPlugin, 因为每个页面都有单独的html模板需要处理
            new HtmlWebpackPlugin({
                template: path.join(__dirname, `../src/pages/${pageName}/index.html`), // 需要处理的html模板所在位置
                filename: `${pageName}.html`, // 打包出来后的html文件名称
                // 打包出来后的html需要使用哪些chunk (需要注入哪些js), chunk配置是指(多页面应用)当前页面要用的chunk
                // 单页面应该是main(打包过后的入口文件)
                // chunk分三种情况:
                //  1: 入口文件, 这里的'main', 多页面应用每个入口都会分为一个chunk
                //  2: 动态加载(import)的代码 如component:()=>import(/* webpackChunkName: "payslip.dashboard" * / '@/views...'
                //  3: 通过splitChunks配置专门分割出来的代码
                chunks: ['react', pageName], 
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

const ssrConfig = {
    mode: 'production',

    entry: entry,
    output: {
        path: path.join(__dirname, '../dist-server'), 
        filename: '[name]-server.js',
        libraryTarget: 'umd'
    },
    plugins: [].concat(htmlWebpackPlugins),
};

module.exports = merge(baseConfig, ssrConfig);