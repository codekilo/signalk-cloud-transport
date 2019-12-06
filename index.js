const config = require('config');
const WebSocket = require('ws');
const zlib = require('zlib');

const ip = config.get("ip");
const port = config.get("port");
const buffersize = config.get("buffersize");
const period = config.get("period");
const paths = require("./config/paths.json");

const mqtt = require('mqtt');
const mqttbroker = config.get("mqttbroker");
const client = mqtt.connect(mqttbroker);
const topic = config.get("mqtttopic");

const ws = new WebSocket('ws://' + ip + ':' + port + '/signalk/v1/stream?subscribe=none');
var buffer = "[";
var count = 0;
ws.on('open', function open() {
    // subscribe to all signalk paths from configuration
    var subscriptionPaths = [];
    paths.forEach(path => subscriptionPaths.push({
        "path": path,
        "period": 5000,
        "format": "delta",
        "policy": "instant",
    }));
    var sub = {
        "context": "vessels.self",
        "subscribe": subscriptionPaths
    };
    ws.send(JSON.stringify(sub));
});

ws.on('message', function incoming(data) {
    // handle all incoming deltas
    var message = JSON.parse(data);
    // check if the message isn't a hello message
    if (!message.roles) {
        if (count > 0) {
            buffer += ",";
        }
        buffer += data;
        count++;
        if (buffer.length > buffersize) {
            clearTimeout(timer);
            push();
        }
    }

});

function callback(err) {
    if (err) {
        console.log("error: ", err);
    } else {
        buffer = "[";
        count = 0;
    }
}

function push() {
    // process the buffer and reset buffer and timer afterwards
    console.log("buffer", buffer.length);
    var payload = zlib.gzipSync(buffer + "]");
    console.log("payload: ", payload.length);
    console.log("count: ", count);
    client.publish(topic, payload, {
        "qos": 2,
    }, callback);
    timer = setTimeout(push, period * 1000);
}
var timer = setTimeout(push, period * 1000);
