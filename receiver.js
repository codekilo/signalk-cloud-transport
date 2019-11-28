const mqtt = require('mqtt');
const zlib = require('zlib');

const client = mqtt.connect('mqtt://localhost');
client.subscribe('test', {
    "qos": 2
});


// const WebSocket = require('ws');
// const ip = 'localhost';
// const port = '3008';
// const ws = new WebSocket('ws://' + ip + ':' + port + '/signalk/v1/stream?subscribe=none');

// const uuidv4 = require('uuid/v4');

// ws.on('message', function incoming(data) {
//     console.log(data);
// });
const net = require('net');
const server = new net.Server();
server.listen(3333, '0.0.0.0', function() {
    console.log(`Server listening for connection requests on socket localhost: 3333`);
});
var sock;


server.on('connection', function(socket) {
    console.log('connection received');
    sock = socket;

    socket.on('end', function() {
        console.log('Closing connection with the client');
        sock = undefined;
    });
    socket.on('error', function(err) {
        console.log(`Error: ${err}`);
    });

    socket.on('data', function(chunk) {
        console.log('Data received from client: ${chunk.toString()');
    });
});



client.on('message', function(topic, message) {
    var payload = zlib.gunzipSync(message);
    var data = JSON.parse(payload);
    //var res = [];
    if (sock) {
        // data.forEach(update => sock.write(JSON.stringify({
        //     "requestID": uuidv4(),
        //     "context": update.context,
        //     "put": update.updates
        // }) + "\n"));
        data.forEach(update => sock.write(JSON.stringify(update) + "\n"));
        console.log("put sent");
    }
    //ws.send(res);
});
