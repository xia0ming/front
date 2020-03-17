'use strict';

const merge = require('webpack-merge');
const baseConfig = require('./webpack.base');
const path = require('path');
const webpack = require('webpack');
const TerserPlugin = require('terser-webpack-plugin'); // js压缩, 相对于uglyfyjs插件, 这个支持压缩es6语法
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin'); // 压缩css
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin; // 打包大小结构分析
const HtmlWebpackExternalsPlugin = require('html-webpack-externals-plugin'); // 抽离公共包React ReactDOM
// const HardSourceWebpackPlugin = require('hard-source-webpack-plugin'); // 打包时候的模块缓存
const SpeedMeasureWebpackPlugin = require('speed-measure-webpack-plugin'); // 统计打包各部分耗时
const smp = new SpeedMeasureWebpackPlugin();

const prodConfig = {
    mode: 'production',
    plugins: [
        new OptimizeCssAssetsPlugin({ // css压缩
            assetNameRegExp: /\.css$/g,
            cssProcessor: require('cssnano')
        }),
        // new BundleAnalyzerPlugin(), // 打包分析
        // new webpack.DllReferencePlugin({ // 通过预编译包的json信息注入预编译包, 要注入多个预编译包需要多个webpack.DllReferencePlugin插件
        //     manifest: require('../build/library/react.json')
        // }),
        // 分离React, ReactDOM
        // 目的是告诉webpack不要管React, ReactDOM这两个module, 尽管使用, 因为会给出全局的对象React, ReactDOM
        // adds React, ReactDOM to your Webpack config's externals object to exclude it from your bundle, telling it to expect a global object called React, ReactDOM (on the window object)
        // new HtmlWebpackExternalsPlugin({
        //     externals: [
        //         {
        //             module: 'react',
        //             entry: 'https://cdn.bootcss.com/react/16.13.0/umd/react.production.min.js',
        //             global: 'React'
        //         },
        //         {
        //             module: 'react-dom',
        //             entry: 'https://unpkg.com/react-dom@16/umd/react-dom.production.min.js',
        //             global: 'ReactDOM'
        //         }
        //     ]
        // }),
    ],
    optimization: {
        // 多进程并行压缩
        minimizer: [
            new TerserPlugin({
                parallel: true, // 开启并行压缩, 传递number可指定进程数量
                cache: true // 开启压缩缓存, 文件在node_modules/cache下, 加快打包时间
            })
        ],
        // 代码分割, 公用资源抽离 https://www.cnblogs.com/kwzm/p/10314438.html
        splitChunks: {
            // 默认配置
            /*
            chunks: "async",
                // chunk分三种情况生成:
                //  1: 入口文件, 这里的'main', 多页面应用每个入口都会分为一个chunk
                //  2: 动态加载(import)的module 如component:()=>import(/* webpackChunkName: "payslip.dashboard" * / '@/views...'
                //  3: 通过splitChunks配置专门分割出来的代码
                // "async": "动态(按需)加载的", 只针对动态加载的chunk里的依赖进行分析拆分, 不是动态加载的模块里的依赖不做处理, 不抽离出来
                // "initial": "初始的", 只针对入口文件chunk里的依赖进行分析拆分
                // "all": 对所有的chunk里的依赖进行分析拆分
            minSize: 30000,
            minChunks: 1,
            maxAsyncRequests: 5,
                // 每个"动态加载的"chunk入口出发的的抽离最大请求数量为5
                // 比如pageA.js是动态引入的, 那么从pageA这个chunk出发的抽离出的包(不管是vendor或者default)最多5个
            maxInitialRequests: 3,
                // 每个"初始的(入口文件)"chunk入口出发的抽离最大请求数量为3
                // 比如入口a.js里面: 自身是入口文件, 将单独分割为一个包, +1
                //                             入口a 和 入口b共同引用的包抽离了一个包, +1
                //                             入口a 和 入口c共同引用的包抽离了一个包, +1
                // 这个时候入口a 和 入口d共同引用的就不会单独抽离了, 而是直接打包在a里面
            automaticNameDelimiter: '~',
            name: true,
            cacheGroups: { 
                // splitChunks下的所有属性配置都是为了作用于cacheGroups, cacheGroups是splitChunks生效的地方, cacheGroups里可以覆盖外面的配置
                vendors: {
                    // 抽离公共资源, 第三方库, 从node_modules文件夹引用的模块, 如: import React from 'react'
                    test: /[\\/]node_modules[\\/]/,
                    priority: -10
                        // 优先级, 优先处理从node_modules文件夹引用的模块, 而不是引用次数
                },
                default: {
                    // 自定义的多次引用的模块, 如: import './Dashboard.jsx', 通过多次引用来判断抽离条件, 优先级低于抽
                    // 离第三方库, 也就是除了第三方库的多次引用的代码抽离在default中
                    minChunks: 2,
                    priority: -20,
                    reuseExistingChunk: true
                },
                common: {} // 可以自定义抽离规则, 权重默认为0, 大于vendors和default
            }
            */

            chunks: "all",
            // 将react react-dom单独打包成一个叫vendors的chunk, 这个chunk要使用的话需要在html中注入
            cacheGroups: {
                common: {
                    test: /(react|react-dom)/,
                    name: 'react',
                    chunks: 'all'
                }
            }
        }
    }
};

module.exports = smp.wrap(merge(baseConfig, prodConfig));