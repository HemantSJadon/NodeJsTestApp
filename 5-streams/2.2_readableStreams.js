import fs, { read } from 'fs';
import Buffer from 'buffer';


let filePath = "./big.file";

// the source is file path, create a readable stream which provides
// an abstraction on the source

const readStream = fs.createReadStream(filePath);

readStream.on('data', chunk => {
    console.log(`chunk size: ${chunk.length}`);
    readStream.pause();
    console.log('the stream is paused for 1 second.');
    setTimeout(() => {
        console.log('now the data will flow again');
        readStream.resume();
    }, 1000);
})

setTimeout(() => {
    readStream.push(null);
}, 10000);
// readStream.pause();

// readStream.read();

