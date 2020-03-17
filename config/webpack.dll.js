/*
    预编译资源模块, 将通用的多个资源模块打包到一起 
    将多个npm包打包成一个公共包
*/
const path = require('path');
const webpack = require('webpack');

module.exports = {
    mode: 'production',
    entry: {
        react: [ // 打包成的预编译包的名称
            'react',
            'react-dom'
        ],
        // library: [ // 可以定义多个预编译包
        //     'jquery'
        // ]
    },
    output: {
        filename: '[name]_[chunkhash].dll.js',
        path: path.join(__dirname, '../build/library'), // 打包出的文件, 不放在dist目录中, 因为每次项目build会清理dist目录, dll打包一次就行了
        library: '[name]'
    },
    plugins: [
        // 存放预编译包的json信息, 在webpack.prod.js中通过
        new webpack.DllPlugin({
            name: '[name]_[hash]',
            path: path.join(__dirname, '../build/library/[name].json')
        })
    ]
}