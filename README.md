# SignalK cloud transport

This package is designed to transport signalk messages over mqtt multiple messages are bundled together and then compressed and encrypted.

## Installation

To install this package clone it from git and run npm install, this needs to happen on both the client and the server.

```
git clone https://github.com/codekilo/signalk-cloud-transport.git
cd signalk-cloud-transport
npm install
```

## Use 

### Transmitter
run `signalk-cloud-tx` 

### Receiver
run `signalk-cloud-rx` 

## Configuration

The configuration for the transmitter is in `config/default.json` and `config/paths.json`. The receiver can't be configured right now.
