const WebSocket = require('ws');
const ip = 'localhost';
const port = '3000';
const buffersize = 1000;
const period = 10;
const paths = ["navigation.speedOverGround", "navigation.position"];

const mqtt = require('mqtt');
const client = mqtt.connect('mqtt://localhost');

const ws = new WebSocket('ws://' + ip + ':' + port + '/signalk/v1/stream?subscribe=none');
var buffer = [];
ws.on('open', function open() {
    // subscribe to all signalk paths from configuration
    var subscribtionPaths = [];
    paths.forEach(path => subscribtionPaths.push({
        "path": path,
        "period": 5000,
        "format": "delta",
        "policy": "fixed",
    }));
    var sub = {
        "context": "vessels.self",
        "subscribe": subscribtionPaths
    };
    ws.send(JSON.stringify(sub));
});

ws.on('message', function incoming(data) {
    // handle all incoming deltas
    var message = JSON.parse(data);
    // check if the message isn't a hello message
    if (!message.roles) {
        // console.log(message);
        // console.log("message received");
        buffer.push(message);
        if (buffer.length > buffersize) {
            clearTimeout(timer);
            push();
        }
    }

});

function callback(err) {
    if (err) {
        console.log(err);
    } else {
        buffer = [];
    }
}

function push() {
    // process the buffer and reset buffer and timer afterwards
    //buffer.forEach(data => console.log(data.updates[0].timestamp));
    //console.log(JSON.stringify(buffer, null, 2));
    console.log(buffer.length);
    client.publish('test', JSON.stringify(buffer, null, 2), {
        "qos": 2,
    }, callback);
    timer = setTimeout(push, period * 1000);
}
var timer = setTimeout(push, period * 1000);
