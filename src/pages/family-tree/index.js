'use strict';

import React from 'react';
import ReactDOM from 'react-dom';
import '../index/styles/index.less';

// 模块热更新
if (module.hot) {
    module.hot.accept();
}
class Index extends React.Component {
    render() {
        return <div className="color_blue">family-tree</div>
    }
}

ReactDOM.render(<Index/>, document.getElementById('root1'));