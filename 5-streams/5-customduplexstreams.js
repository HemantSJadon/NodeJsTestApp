//With duplex Streams: can implement both readble and writable streams
//with the same object: Implement both the interfaces. 

/* 
1. Implementing a duplex stream: 
with Duplex constructor > pass an object in method  with write and read method implementation >
Readable and writable sides of the duplex work independently from each other. 

*/

import {Duplex} from 'stream';

const inOutStream = new Duplex({
    write(chunk, encoding, cb){
        console.log(chunk.toString());
        cb();
    },
    read(size){
        this.push(String.fromCharCode(this.currentCharCode++));
        if(this.currentCharCode > 90){
            this.push(null);
        }
    }
});

inOutStream.currentCharCode = 65;
process.stdin.pipe(inOutStream).pipe(process.stdout);



