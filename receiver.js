const mqtt = require('mqtt');
const zlib = require('zlib');

const client = mqtt.connect('mqtt://localhost');
client.subscribe('test', {
    "qos": 2
});


const WebSocket = require('ws');
const ip = 'localhost';
const port = '3008';
const ws = new WebSocket('ws://' + ip + ':' + port + '/signalk/v1/stream?subscribe=none');


ws.on('message', function incoming(data) {
    console.log(data);
});

client.on('message', function(topic, message) {
    var payload = zlib.gunzipSync(message);
    var data = JSON.parse(payload);

    data.forEach(update => ws.send(JSON.stringify(update)));
    console.log("put sent");
});
