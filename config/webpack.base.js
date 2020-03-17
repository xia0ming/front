'use strict';

const path = require('path');
const glob = require('glob');
// const webpack = require('webpack');
const autoprefixer = require('autoprefixer');
const MiniCssExtractPlugin = require('mini-css-extract-plugin'); // 将css提取成单独的文件
const HtmlWebpackPlugin = require('html-webpack-plugin'); // html模板
const { CleanWebpackPlugin } = require('clean-webpack-plugin'); // 清除构建目录
const FriendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin'); // 优化命令行显示
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

// css前缀自动补齐, 放在less-loader前后都可以, 因为less里面一般需要补齐前缀的样式也是直接写出来的
// 只要保证在css-loader前去补全前缀就可以了, 因为css-loader是把css内容转换成commonjs对象了
const postcssLoader = {
    loader: 'postcss-loader',
    options: {
        plugins: () => [ // 这个plugin是postcss生态下的, 和webpack的plugin没有关系
            autoprefixer()
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
        // filename: '[name]_[chunkhash:8].js'
        filename: '[name]_[hash:8].js'
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
                exclude: path.resolve(__dirname, "../node_modules"),
                // exclude: 'node_modules',
                // 用 // eslint-disable-next-line 忽略下一行的校验
                // 用 /* eslint-disable */ 忽略整个文件的校验
                use: [
                    { // 多进程打包, 将模块分给多个进程打包, 提升打包速度
                        loader: 'thread-loader',
                        options: {
                            workers: 4
                        }
                    },
                    'babel-loader?cacheDirectory=true', // ?cacheDirectory=true是开启了babel转译的缓存, 在node_modules/cache下, 加快打包速度
                    'eslint-loader'
                ]
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
                },
                // 图片压缩
                {
                    loader: 'image-webpack-loader',
                    options: {
                      mozjpeg: {
                        progressive: true,
                        quality: 65
                      },
                      // optipng.enabled: false will disable optipng
                      optipng: {
                        enabled: false,
                      },
                      pngquant: {
                        quality: [0.65, 0.90],
                        speed: 4
                      },
                      gifsicle: {
                        interlaced: false,
                      },
                      // the webp option will enable WEBP
                      webp: {
                        quality: 75
                      }
                    }
                },
            ]
            },
            {
                test: /.(woff|woff2|eot|ttf|otf)$/,
                use: [
                {
                    loader: 'file-loader',
                    options: {
                    name: '[name]_[hash:8][ext]',
                    },
                },
                ],
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
        // new BundleAnalyzerPlugin(), // 打包分析
        new FriendlyErrorsWebpackPlugin(), // 优化命令行输出

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

        // 自定义处理构建失败的情况
        function() {
            // plugin都会被绑定到compiler对象上, 所以这里的this就是compiler对象, 在对compiler对象上的"done"勾子进行监听
            this.hooks.done.tap('done', (stats) => {
                if (stats.compilation.errors && stats.compilation.errors.length && process.argv.indexOf('--watch') === -1) {
                    console.log('build error');
                    process.exit(1);
                }
            })
        }
    ].concat(htmlWebpackPlugins),
    // 优化webpack对模块的查找方式, 来加快打包, 当前目录 -> 判断是否核心模块 -> 当前目录的node_modules文件夹 -> 父目录 -> 循环...
    resolve: {
        alias: { // 直接指定一些常用模块的目录, 使用的时候就可以不用去一层层查找, 减少查找时间
            'react': path.resolve(__dirname, '../node_modules/react/umd/react.production.min.js'),
            'react-dom': path.resolve(__dirname, '../node_modules/react-dom/umd/react-dom.production.min.js')
        },
        modules: [path.resolve(__dirname, "../node_modules")], // 指定查找模块的目录, 不去其他文件夹查找, 比如src等
        extensions: ['.js'], // 引入不带后缀的模块import File from '../path/to/file'时自动匹配js文件, 其他后缀的文件最好指明类型
        mainFields: ['main'] // 引入模块时, 直接通过模块的package.json的"main"入口引入, 而不是去判断index.js等
    }
}