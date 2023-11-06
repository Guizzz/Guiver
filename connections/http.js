const https = require('https');
class Http
{
    get(url, callback)
    {
        https.get(url, callback).on('error', err => {
            console.log('Error: ', err.message);
        });
    }
}

module.exports = Http;