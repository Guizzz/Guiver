var EventEmitter = require('events');
var amqp = require('amqplib/callback_api');
var queueing = require("../config");

class Link_manager extends EventEmitter
{
    constructor(name)
    {
        super();
        this.caller = name;
        this.queue_in = queueing[this.caller][0];
        this.queue_out = queueing[this.caller][1]
        console.log("[",this.caller,"] Link Manager inizializated...")
    }

    start()
    {
        console.log("[",this.caller,"] Link Manager started...");
        amqp.connect('amqp://localhost', this._rabbit_handler.bind(this));
    }

    to_core(data)
    {
        this.channel.sendToQueue(this.queue_out, Buffer.from(data));
    }

    from_core(data)
    {   
        this.emit("msg", data.toString().trim())
    }

    _rabbit_handler(error0, connection) 
    {
        if (error0) throw error0;
        connection.createChannel(function(error1, c) {
            if (error1) throw error1;
            this.channel = c;

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