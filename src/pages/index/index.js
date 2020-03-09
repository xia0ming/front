'use strict';

import React from 'react';
import ReactDOM from 'react-dom';
import './styles/index.less';

// 模块热更新
if (module.hot) {
    module.hot.accept()
}
class Index extends React.Component {

    render() {
        return <div className="color_red">index text1234</div>
    }
}

ReactDOM.render(<Index/>, document.getElementById('root'));