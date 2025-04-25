var EventEmitter = require('events');
var amqp = require('amqplib/callback_api');

class Link_manager extends EventEmitter
{
    constructor(name, queue_in)
    {
        super();
        this.caller = name;
        this.queue_in = queue_in;
        console.log("[LINK_",this.caller,"] Link Manager inizializated...")
    }

    start()
    {
        console.log("[LINK_",this.caller,"] Link Manager started...");
        var rabbit_server_ip =  process.env.RABBITMQ_IP.toString();
        const opt = { credentials: require('amqplib').credentials.plain(process.env.RABBITMQ_USR, process.env.RABBITMQ_PSW) };
        amqp.connect('amqp://' + rabbit_server_ip , opt, this._rabbit_handler.bind(this));
    }

    to_core(queue_out, data)
    {
        // console.log("[LINK_",this.caller,"]",queue_out, data);
        this.channel.sendToQueue(queue_out, Buffer.from(data));
    }

    from_core(data)
    {   
        // console.log("[LINK_",this.caller,"] emit:", data.toString().trim());
        this.emit("msg", data.toString().trim())
    }

    _rabbit_handler(error0, connection) 
    {
        console.log("[LINK_",this.caller,"] connected");
        if (error0) 
            throw error0;
        
        connection.createChannel(function(error1, c) 
        {   
            if (error1) 
                throw error1;

            this.channel = c;
            this.emit("channel_new");

            this.channel.assertQueue(this.queue_in, {
                durable: false
            });

            this.channel.consume(this.queue_in, function(msg) 
            {
                // console.log("[LINK_",this.caller,"] -> ",this.queue_in," consume:", msg.content.toString());
                this.from_core(msg.content.toString());
                }.bind(this), {
                noAck: true
            });
        }.bind(this));
        

        
    }
    
}

module.exports = Link_manager