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
const pw = "abcdefghijklmnopqrstuvwx";
var salt;
var key;
var HMACKey;

function generateKeys(passwd, salt, encryptLength, HMACLength) {
    var keys = crypto.scryptSync(passwd, salt, encryptLength + HMACLength);
    return [keys.slice(0, encryptLength), keys.slice(encryptLength)];
}
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
    var digestReceived = message.slice(0, 32);
    var payload = message.slice(32);
    var iv = payload.slice(0, 16);
    if (!salt) {
        salt = payload.slice(16, 28);
        let keys = generateKeys(pw, salt, 24, 32);
        key = keys[0];
        HMACKey = keys[1];

    } else {
        let tempsalt = payload.slice(16, 28);
        if (!tempsalt.equals(salt)) {
            console.warn("key changed");
            salt = tempsalt;
            let keys = generateKeys(pw, salt, 24, 32);
            key = keys[0];
            HMACKey = keys[1];

        }
    }
    const hmac = crypto.createHmac("sha256", HMACKey);
    hmac.update(payload);
    var digest = hmac.digest();
    if (crypto.timingSafeEqual(digestReceived, digest)) {

        // console.log("iv: ", iv);
        // console.log("key: ", key);
        var data = payload.slice(28);
        var decipher = crypto.createDecipheriv(algorithm, key, iv);
        var decompress = zlib.createGunzip();
        fromValue(data).pipe(decipher).pipe(decompress).pipe(miss.concat(sendToSignalK));
    } else {
        console.err("error occured digests didn't match");
    }

});
