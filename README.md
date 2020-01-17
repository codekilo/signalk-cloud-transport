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

## Configuration

The configuration for the transmitter is in `config/transmitter/default.json` and `config/transmitter/paths.json`. The configuration for the receiver is located in `config/receiver/default.json`.
