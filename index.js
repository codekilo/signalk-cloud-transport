const config = require('config');
const WebSocket = require('ws');
const zlib = require('zlib');
const stream = require('stream');
const miss = require('mississippi');
const meter = require("stream-meter");

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
const algorithm = 'aes-192-cbc';
const key = Buffer.from("abcdefghijklmnopqrstuvwx");
var cipher;
var count = 0;
var umcompressed;
var compressed;
var m1;
var m2;

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
        if (count > 0) {
            uncompressed.push(',');
        }
        uncompressed.push(data);
        count++;

        // gzip.flush();
        if (m1.bytes > buffersize) {
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
    var payload = Buffer.concat([iv, data]);
    console.log("payload: ", payload.length);
    client.publish(topic, payload, {
        "qos": 2,
    }, callback);
}

function createPipeline(payload) {
    var iv = crypto.randomBytes(16);
    // console.log("iv: ", iv);
    // console.log("key: ", key);
    cipher = crypto.createCipheriv(algorithm, key, iv);
    gzip = zlib.createGzip();
    uncompressed = new stream.Readable();
    uncompressed._read = () => {}; // see https://stackoverflow.com/a/22085851
    // create destination and publish when input ends
    compressed = miss.concat(data => mqttpublish(data, iv));

    m1 = meter();
    m2 = meter();

    uncompressed.pipe(m1).pipe(gzip).pipe(cipher).pipe(m2).pipe(compressed);
    uncompressed.push("[");
    count = 0;

}

function push() {
    // process the buffer and reset buffer and timer afterwards
    // end the input
    uncompressed.push("]");
    uncompressed.push(null);

    console.log("count: ", count);
    createPipeline();

    timer = setTimeout(push, period * 1000);
}

createPipeline();
var timer = setTimeout(push, period * 1000);
