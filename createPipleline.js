const zlib = require('zlib');
const stream = require('stream');
const miss = require('mississippi');
const meter = require("stream-meter");
const crypto = require('crypto');

const algorithm = 'aes-192-cbc';

class pipeLine {
    constructor(key, callback) {
        this.iv = crypto.randomBytes(16);
        this.cipher = crypto.createCipheriv(algorithm, key, this.iv);
        this.gzip = zlib.createGzip();
        this.uncompressed = new stream.Readable();
        this.uncompressed._read = () => {}; // see https://stackoverflow.com/a/22085851
        // create destination and publish when input ends
        this.compressed = miss.concat(data => callback(data, this.iv));
        this.m1 = meter();
        this.m2 = meter();

        this.uncompressed.pipe(this.m1).pipe(this.gzip).pipe(this.cipher).pipe(this.m2).pipe(this.compressed);
        this.uncompressed.push("[");
        this.count = 0;
    }

    // add data to the pipeline
    push(data) {
        if (this.count > 0) {
            this.uncompressed.push(',');
        }
        this.uncompressed.push(data);
        this.count++;
    }

    // close the pipeline
    end() {
        this.uncompressed.push("]");
        this.uncompressed.push(null);
    }

    // return the uncompressed length
    inputLength() {
        return this.m1.bytes;
    }

    // return the compressed and encrypted length
    outputLength() {
        return this.m2.bytes;
    }
}
module.exports = pipeLine;
