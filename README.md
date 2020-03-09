# front
xiao0ming.com frontend

# 目录结构
.
├── README.md 我寄几
├── config webpack配置文件
│   ├── webpack.dev.js
│   └── webpack.prod.js
├── dist 打包文件
│   └── bundle.js
├── package-lock.json
├── package.json
├── public
├── src
│   └── pages 多页面应用的所有页面, 每个页面对应一个打包入口
│       ├── emoji
│       ├── family-tree
│       ├── index
│       │   └── index.js
│       └── light
└── tree.text 目录结构文本, 生成使用: "tree -I node_modules > tree.text"
