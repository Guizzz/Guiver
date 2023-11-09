const https = require('https');
class Http
{
    get(url, callback)
    {   
        console.log("[ Http ] Url:",url);
        https.get(url, callback).on('error', err => {
            console.log('Error: ', err.message);
        });
    }
}

module.exports = Http;