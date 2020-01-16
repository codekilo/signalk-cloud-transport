process.env.NODE_CONFIG_DIR = 'config/receiver/';
const config = require('config');
const mqtt = require('mqtt');
const zlib = require('zlib');
const fromValue = require('stream-from-value');
const miss = require('mississippi');
const generateKeys = require('./lib/generateKeys.js');

const mqttbroker = config.get("mqttbroker");
const client = mqtt.connect(mqttbroker);
const topic = config.get("mqtttopic");
client.subscribe(topic, {
    "qos": 2
});


const WebSocket = require('ws');
const ip = config.get('ip');
const port = config.get('port');

const crypto = require('crypto');
const algorithm = 'aes-192-cbc';
const pw = "abcdefghijklmnopqrstuvwx";
var salt;
var keys;

var token = config.get('token');
var options = {
    headers: {
        "Authorization": "JWT " + token
    }
};
const ws = new WebSocket('ws://' + ip + ':' + port + '/signalk/v1/stream?subscribe=none', options);
ws.on('message', function incoming(data) {
    console.log(data);
});

function sendToSignalK(payload) {
    var data = JSON.parse(payload);

    data.forEach(update => ws.send(JSON.stringify(update)));
    console.log("put sent");
}

client.on('message', function(topic, message) {
    console.log("payload: ", message.length);
    var digestReceived = message.slice(0, 32);
    var payload = message.slice(32);
    var iv = payload.slice(0, 16);
    if (!salt) {
        salt = payload.slice(16, 28);
        keys = generateKeys(pw, salt, 24, 32);

    } else {
        let tempsalt = payload.slice(16, 28);
        if (!tempsalt.equals(salt)) {
            console.warn("key changed");
            salt = tempsalt;
            keys = generateKeys(pw, salt, 24, 32);
        }
    }
    const hmac = crypto.createHmac("sha256", keys.hmac);
    hmac.update(payload);
    var digest = hmac.digest();
    if (crypto.timingSafeEqual(digestReceived, digest)) {

        // console.log("iv: ", iv);
        // console.log("key: ", key);
        var data = payload.slice(28);
        var decipher = crypto.createDecipheriv(algorithm, keys.encryption, iv);
        var decompress = zlib.createGunzip();
        fromValue(data).pipe(decipher).pipe(decompress).pipe(miss.concat(sendToSignalK));
    } else {
        console.err("error occured, digests didn't match");
    }

});
