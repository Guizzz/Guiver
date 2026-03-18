var udp = require('dgram');
require('dotenv').config()
const { interfaceLogger } = require('../../utils/logger');

class Info_Point
{
    constructor()
    {   
        this.logger = interfaceLogger("INFO_POINT");
        this.server = udp.createSocket('udp4');
        this.server.on('error', function(error){
          interfaceLogger.error('Error: ' + error);
          this.server.close();
        }.bind(this));

        //emits when socket is ready and listening for datagram msgs
        this.server.on('listening', this.listening.bind(this));
        // emits on new datagram msg
        this.server.on('message', this.on_messages.bind(this));
        //emits after the socket is closed using socket.close();
        this.server.on('close', function(){
            this.logger.debug('Socket is closed !');
        });

        this.server.bind(process.env.INFO_PORT);
    }

    listening()
    {
        var address = this.server.address();
        var port = address.port;
        var family = address.family;
        var ipaddr = address.address;
        this.logger.info('Server is listening at port ' + port);
        this.logger.debug('Server ip :' + ipaddr);
        this.logger.debug('Server is IP4/IP6 : ' + family);
    }

    on_messages(msg,info)
    {
        this.logger.debug('Data received from client : ' + msg.toString());
        this.logger.debug('From %s:%d\n', info.address, info.port);
    
        if (msg.toString() == "WHOISBRAIN")
        {
            this.server.send("IAM", info.port, 'localhost');  
        }
    }
    
}

module.exports = Info_Point