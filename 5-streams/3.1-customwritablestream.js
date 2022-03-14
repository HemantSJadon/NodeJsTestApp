//Stream : implement a stream and consume the stream
/* 1. Implement a writable stream: 
there are 2 ways: extends the base Writable class
or create an object using the Writable constructor passing 
it an options object.  
2. consume the stream (pipe it with a data source or 
    use it's method as event listeners for events emitted by a readable source)
 */
/*
backPressure strategy for writable streams 
.write method on the writable stream return true/false depending on whether
current chunk 
*/
import {Writable} from 'stream'

const outStream = new Writable({
    write(chunk, encoding, callback){
        console.log(chunk.toString());
        //callback is called when the data processing on the chunk is finished
        callback(); //call the callback with an error object in case of error
    }
});

process.stdin.on('data', chunk => {
    const result = outStream.write(chunk,'utf-8',() => {
        console.log("EventListener: done with writing current chunk. do more writes now.");
    });
    if(!result){
        console.log("backPressure: pausing the read Stream");
        process.stdin.pause();
    }
});

outStream.on('drain', () => {
    console.log("resuming the readStream");
    process.stdin.resume();
});

outStream.on('close', () => {
    console.log('the file has been written successfully');
});

//consuming using pipe
process.stdin.pipe(outStream).on('drain', () => {
    console.log("PipeConsumption: done with writing current chunk. do more writes now.");
});
//buffer drain check