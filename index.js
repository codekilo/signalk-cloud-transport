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
var buffer = "[";
var count = 0;
var umcompressed;
var compressed;
var m;
var gzip;
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
            uncompressed.push(',');
        }
        buffer += data;
        uncompressed.push(data);
        count++;
        console.log("length: ", m.bytes);
        // gzip.flush();
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

function mqttpublish(data, temp) {
    console.log("payload: ", data.length);
    console.log("length2: ", temp.bytes);
    client.publish(topic, data, {
        "qos": 2,
    }, callback);
}

function createPipeline(payload) {
    gzip = zlib.createGzip();
    uncompressed = new stream.Readable();
    uncompressed._read = () => {}; // see https://stackoverflow.com/a/22085851
    compressed = miss.concat(res => mqttpublish(res, m));
    m = meter();
    uncompressed.pipe(gzip).pipe(m).pipe(compressed);
    uncompressed.push("[");

}

function push() {
    // process the buffer and reset buffer and timer afterwards
    console.log("buffer", buffer.length);
    uncompressed.push("]");
    uncompressed.push(null);
    // var payload = zlib.gzipSync(buffer + "]");
    // console.log("payload: ", payload.length);
    console.log("count: ", count);
    createPipeline();

    timer = setTimeout(push, period * 1000);
}
createPipeline();
var timer = setTimeout(push, period * 1000);
