const https = require('https');
class Https
{
    get(url, callback)
    {   
        console.log("[ Https ] Url:",url);
        https.get(url, callback).on('error', err => {
            console.log('Error: ', err.message);
        });
    }
}
module.exports = Https;