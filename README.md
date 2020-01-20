# SignalK cloud transport

This package is designed to transport signalk messages over mqtt multiple messages are bundled together and then compressed and encrypted.

## Installation

To install this package clone it from git and run npm install, this needs to happen on both the client and the server.

```
git clone https://github.com/codekilo/signalk-cloud-transport.git
cd signalk-cloud-transport
sudo npm  -g install
```

## Use 

### Transmitter
run `signalk-cloud-tx` in a directory that also has the `config/` directory

### Receiver
run `signalk-cloud-rx` in a directory that also has the `config/` directory. This config file should contain the token for the websocket connection if required.

To generate a token to connect to a signalk server with security enabled see [the signalK specification](https://signalk.org/specification/1.3.0/doc/access_requests.html).

## Configuration

The configuration for the transmitter is in `config/transmitter/default.json`. The configuration for the receiver is located in `config/receiver/default.json`.

### Shared

The following options are shared by both the transmitter and receiver.
#### ip 
The IP address of the signalk server.
#### port
The port of the signalk server 
#### mqtttopic
The mqtt topic the messages will appear on
#### mqttbroker
The address of the mqtt broker.

### Transmitter
#### buffersize
The maximum size of the buffer in bytes, the message will be transmitted when the buffer is full.
#### period
The maximum time between two messages in seconds.
#### sendothers
If true send data about all known vessels, when false only send data about the own vessel.
#### paths
An array of paths to include in messages, paths can inlcude `*` as wildcard.

### Receiver
#### token
The token used to connect to the signalk server (optional)
