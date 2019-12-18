const mqtt = require('mqtt');
const zlib = require('zlib');
const fromValue = require('stream-from-value');
const miss = require('mississippi');
const client = mqtt.connect('mqtt://localhost');
client.subscribe('test', {
    "qos": 2
});


const WebSocket = require('ws');
const ip = 'localhost';
const port = '3008';
const ws = new WebSocket('ws://' + ip + ':' + port + '/signalk/v1/stream?subscribe=none');

const crypto = require('crypto');
const algorithm = 'aes-192-cbc';
const key = Buffer.from("abcdefghijklmnopqrstuvwx");

ws.on('message', function incoming(data) {
    console.log(data);
});

function sendToSignalK(payload) {
    var data = JSON.parse(payload);

    data.forEach(update => ws.send(JSON.stringify(update)));
    console.log("put sent");
}

client.on('message', function(topic, message) {
    console.log(message.length);
    var iv = message.slice(0, 16);
    // console.log("iv: ", iv);
    // console.log("key: ", key);
    var payload = message.slice(16);
    var decipher = crypto.createDecipheriv(algorithm, key, iv);
    var decompress = zlib.createGunzip();
    fromValue(payload).pipe(decipher).pipe(decompress).pipe(miss.concat(sendToSignalK));

});
