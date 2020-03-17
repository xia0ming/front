'use strict';

import React from 'react';
import ReactDOM from 'react-dom';
import './styles/index.less';

// 模块热更新
if (module.hot) {
    module.hot.accept();
}
class Index extends React.Component {
    constructor() {
        super(...arguments);
        this.state = {
            Text: null
        }
    }

    dynamicImport() {
        import('./text.js').then((Text) => {
            console.log(Text);
            this.setState({
                Text: Text.default
            });
        })
    }
    render() {
        const { Text } = this.state;
        return <div className="color_red" onClick={() => this.dynamicImport()}>{Text || ''}index</div>
    }
}

ReactDOM.render(<Index/>, document.getElementById('root'));