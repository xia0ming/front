'use strict';

const path = require('path');
const glob = require('glob');
const MiniCssExtractPlugin = require('mini-css-extract-plugin'); // 将css提取成单独的文件
const OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin'); // 压缩css
const HtmlWebpackPlugin = require('html-webpack-plugin'); // html模板
const { CleanWebpackPlugin } = require('clean-webpack-plugin'); // 清除构建目录
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin; // 打包分析

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
                // 打包出来后的html需要使用哪些chunk (需要注入哪些js), chunk配置是指(多页面应用)当前页面要用的chunk
                // 单页面应该是main(打包过后的入口文件)
                // chunk分三种情况:
                //  1: 入口文件, 这里的'main', 多页面应用每个入口都会分为一个chunk
                //  2: 动态加载(import)的代码 如component:()=>import(/* webpackChunkName: "payslip.dashboard" * / '@/views...'
                //  3: 通过splitChunks配置专门分割出来的代码
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

// css前缀自动补齐, 放在less-loader前后都可以, 因为less里面一般需要补齐前缀的样式也是直接写出来的
// 只要保证在css-loader前去补全前缀就可以了, 因为css-loader是把css内容转换成commonjs对象了
const postcssLoader = {
    loader: 'postcss-loader',
    options: {
        plugins: () => [ // 这个plugin是postcss生态下的, 和webpack的plugin没有关系
            require('autoprefixer')()
        ]
    }
};
// 将项目中的px全部转为rem, 用来实现移动端自适应, 但是需要搭配lib-flexible使用
// px全部转为rem, 页面加载时内联的lib-flexible.js马上计算不同设备下的 rem 相对 px 的单位, 也就是计算跟元素 html 节点的 font-size 大小
// 15px被转换成了0.2rem这个操作是固定的, 但是这0.2rem在不同设备该显示多大, 就需要看根元素的font-size大小
// 一般用于不同的移动设备之间的兼容
// rem兼容性更好, 支持android2.2以上的机型, 但是vm只支持android4.4和ios8以上的。
// 另外rem需要的计算需要在头部内联一个脚本, vm是纯css去实现的。如果不考虑兼容性，vm完全没问题
// 不想转换的时候可以在样式后面加上  /*no*/, 如{ top: 3px; /*no*/ }
const px2remLoader = {
    loader: 'px2rem-loader',
    options: {
        exclude: /node_modules/i,
        remUnit: 75, // 默认一个rem为75px
        remPrecision: 8 // rem单位保留8位小数
    }
};

module.exports = {
    entry: entry,
    output: {
        path: path.join(__dirname, '../dist'), 
        filename: '[name]_[chunkhash:8].js'
    },
    mode: 'production',
    module: {
        rules: [
            {
                test: /\.html$/i,
                use: 'inline-html-loader' // HTML文件中的内联, 将内联内容插入到匹配到需要内联的位置(以__inline标识)
            },
            {
                test: /\.js$/,
                use: 'babel-loader'
            },
            {
                test: /\.css$/,
                use: [
                    // MiniCssExtractPlugin与style-loader的功能是互斥的, 使用了style-loader是将css内容直接插入到head中
                    // MiniCssExtractPlugin是将css提取成单独的文件在head中引入, 所以这里要使用MiniCssExtractPlugin.loader
                    MiniCssExtractPlugin.loader, 
                    // 'style-loader',
                    'css-loader',
                    postcssLoader,
                    px2remLoader,
                ]
            },
            {
                test: /\.less$/,
                use: [
                    MiniCssExtractPlugin.loader, 
                    // 'style-loader',
                    //  ||
                    // {
                    //     loader: 'style-loader',
                    //     options: {
                    //         insertAt: 'top', // 插入到head中
                    //         singleton: true // 将所有style标签合并成一个
                    //     }
                    // },
                    'css-loader',
                    postcssLoader,
                    px2remLoader,
                    'less-loader'
                ]
            },
            {
                test: /\.(png|jpg|jpeg|gif)$/,
                use: [{
                    loader: 'url-loader',
                    options: {
                        limit: 10240, // 小于10K转为base64
                        name: '[name]_[hash:8].[ext]'
                    }
                }]
            }
        ]
    },
    // plugin 是通过 webpack 的 Tapable 的钩子进行事件控制的，也就是插件通过事件监听的方式进行执行。用的plugin会自己绑定相应的事件，所以一般不用关注顺序
    plugins: [
        // 将css提取成单独的文件引入, 并且加上content hash, 内容不变时hash不变
        // 而不是通过style-loader将css内容直接插入<style>...</style>中
        new MiniCssExtractPlugin({
            filename: '[name]_[contenthash:8].css'
        }),
        // css压缩
        new OptimizeCssAssetsPlugin({
            assetNameRegExp: /\.css$/g,
            cssProcessor: require('cssnano')
        }),
        // 单页面应用方案
        // 多页面应用里 一个页面需要对应一个HtmlWebpackPlugin, 因为每个页面都有单独的html模板需要处理
        /*
        new HtmlWebpackPlugin({
            template: path.join(__dirname, '../src/pages/index/index.html'), // 需要处理的html模板所在位置
            filename: 'index.html', // 打包出来后的html文件名称
            // 打包出来后的html需要使用哪些chunk (需要注入哪些js), chunk配置是指(多页面应用)当前页面要用的chunk
            // 单页面应该是main(打包过后的入口文件)
            // chunk分三种情况:
            //  1: 入口文件, 这里的'main', 多页面应用每个入口都会分为一个chunk
            //  2: 动态加载(import)的module 如component:()=>import(/* webpackChunkName: "payslip.dashboard" * / '@/views...'
            //  3: 通过splitChunks配置专门分割出来的代码
            chunks: ['main'], 
            inject: true, // 是否执行上面的注入(到HTML页面里)
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
        */
        new CleanWebpackPlugin(), // 清除构建目录
        new BundleAnalyzerPlugin() // 打包分析
    ].concat(htmlWebpackPlugins),
    optimization: {
        // 代码分割, 公用资源抽离 https://www.cnblogs.com/kwzm/p/10314438.html
        splitChunks: {
            // 默认配置
            /*
                // chunk分三种情况生成:
                //  1: 入口文件, 这里的'main', 多页面应用每个入口都会分为一个chunk
                //  2: 动态加载(import)的module 如component:()=>import(/* webpackChunkName: "payslip.dashboard" * / '@/views...'
                //  3: 通过splitChunks配置专门分割出来的代码
            chunks: "async",
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

           chunks: "all"
        }
    }
}