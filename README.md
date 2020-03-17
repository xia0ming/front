# front
xiao0ming.com frontend

# 目录结构
.
├── README.md 我寄几
├── config webpack配置文件
├── dist 前端项目打包文件
├── dist-server 服务端渲染页面的打包文件
├── public
├── package-lock.json
├── package.json
├── src
│   └── pages 多页面应用的所有页面, 每个页面对应一个打包入口
│       ├── emoji
│       ├── family-tree
│       ├── index
│       │   └── index.js
│       └── light
├── ssr-server 本地ssr服务器
├── test 测试
│   └── smoke 冒烟测试: 测试打包是否成功
└── tree.text 目录结构文本, 生成使用: "tree -I node_modules > tree.text"
