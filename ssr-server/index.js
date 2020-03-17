if (typeof window === 'undefined') {
    global.window = {};
}

const fs = require('fs');
const path = require('path');
const express = require('express');
const { renderToString } = require('react-dom/server');
const SSR = require('../dist-server/index-server');
const htmlTemplate = fs.readFileSync(path.join(__dirname, '../dist-server/index.html'), 'utf-8');

const server = (port) => {
    const app = express();

        app.use(express.static('dist-server'));
        app.get('/index1', (req, res) => {
            const html = renderMarkup(renderToString(SSR));
            console.log(SSR);
            // console.log(renderToString(SSR));
            res.status(200).send(html);
        });
        app.listen(port, () => {
            console.log('Server is runing at port ' + port);
        });
}

server(3000);

const renderMarkup = (str) => {
    return htmlTemplate.replace('<!-- HTML_PLACEHOLDER -->', str);
}