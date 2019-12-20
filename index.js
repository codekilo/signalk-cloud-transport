const config = require('config');
const WebSocket = require('ws');
const generateKeys = require('./generateKeys.js');
const pipeLine = require('./createPipeline.js');

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

const crypto = require('crypto');

const pw = "abcdefghijklmnopqrstuvwx";
const salt = crypto.randomBytes(9).toString('base64');
const keys = generateKeys(pw, salt, 24, 32);

var buffer;


ws.on('open', function open() {
    // subscribe to all signalk paths from configuration
    var subscriptionPaths = [];
    paths.forEach(path => subscriptionPaths.push({
        "path": path,
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
        buffer.push(data);

        if (buffer.inputLength() > buffersize) {
            clearTimeout(timer);
            push();
        }
    }

});

function callback(err) {
    if (err) {
        console.log("error: ", err);
    }
}

function mqttpublish(data, iv) {
    const hmac = crypto.createHmac("sha256", keys.hmac);
    var payload = Buffer.concat([iv, Buffer.from(salt), data]);
    hmac.update(payload);
    var digest = hmac.digest();
    payload = Buffer.concat([digest, payload]);

    console.log("payload: ", payload.length);
    client.publish(topic, payload, {
        "qos": 2,
    }, callback);
}


function push() {
    // process the buffer and reset buffer and timer afterwards
    // end the input
    buffer.end();

    console.log("count: ", buffer.count);
    buffer = new pipeLine(keys.encryption, mqttpublish);

    timer = setTimeout(push, period * 1000);
}

buffer = new pipeLine(keys.encryption, mqttpublish);
var timer = setTimeout(push, period * 1000);
