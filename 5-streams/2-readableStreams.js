//4 Types of streams
//1. Readable streams
/* 1. Non-flow: needs some manual user interactions to read data
2. flow: reads/sends data without any manual action
 */
import fs from 'fs';

var videoFilePath = "/Users/hemant/downloads/video/sample1.mp4";
const readStream = fs.createReadStream(videoFilePath);

//listening
readStream.on('data', (chunk) => {
    console.time('reading');
    console.log('reading chunk: ', chunk);
    console.log('size: ', chunk.length);
    console.timeEnd('reading');
})

readStream.on('end',() => {
    console.log('read stream finished.');
    process.exit();
});
readStream.on('error', err => {
    console.log('an error occured:',err);
});

//pause stream

setTimeout(() => {
    console.log('pausing read stream');
    readStream.pause();
}, 10);

process.stdin.on('data', chunk => {
    if(chunk.toString().trim() === "finish"){
        setTimeout(() => {
            console.log('resuming read stream');
        }, 10);
        setTimeout(() => {
            readStream.resume();
        }, 10000);
    }
    readStream.read();
})
