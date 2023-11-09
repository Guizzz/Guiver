var EventEmitter = require('events');
var amqp = require('amqplib/callback_api');

class Link_manager extends EventEmitter
{
    constructor(name, queue_in)
    {
        super();
        this.caller = name;
        this.queue_in = queue_in;
        console.log("[",this.caller,"] Link Manager inizializated...")
    }

    start()
    {
        console.log("[",this.caller,"] Link Manager started...");
        amqp.connect('amqp://localhost', this._rabbit_handler.bind(this));
    }

    to_core(queue_out, data)
    {
        console.log("[",this.caller,"]",queue_out, data);
        this.channel.sendToQueue(queue_out, Buffer.from(data));
    }

    from_core(data)
    {   
        this.emit("msg", data.toString().trim())
    }

    _rabbit_handler(error0, connection) 
    {
        console.log("[",this.caller,"] connected");
        if (error0) throw error0;
        connection.createChannel(function(error1, c) {
            if (error1) throw error1;
            this.channel = c;
            this.emit("channel_new");

            this.channel.assertQueue(this.queue_in, {
                durable: false
            });

            this.channel.consume(this.queue_in, function(msg) 
            {
                this.from_core(msg.content.toString());
                }.bind(this), {
                noAck: true
            });
        }.bind(this));

        
    }
    
}

module.exports = Link_manager