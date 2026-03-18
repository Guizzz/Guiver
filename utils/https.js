const http = require('http');
const https = require('https');
const { URL } = require('url');
const { interfaceLogger } = require('./logger');

class Https
{   
    constructor()
    {
        this.logger = interfaceLogger("HTTPS_UTIL")
    }

    get(urlString, callback)
    {   
        this.logger.debug("Url:" + urlString);

        const url = new URL(urlString);
        const client = url.protocol === 'https:' ? https : http;

        client.get(url, callback).on('error', err => {
            this.logger.error('Error:' + err.message);
        });
    }
}

module.exports = Https;