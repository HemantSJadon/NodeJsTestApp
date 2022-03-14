//Transform stream: 
/* it's a more interesting form of duplex streams where the writing and reading 
parts are not independent of each other. 
the output is computed from the input. what is written to the stream will 
determine what can be read from the stream. 

1. Implementing a transform stream: 
using a Transform constructor where an object containing 
a custom implementation of the transform method. 
Transform method has the signature of write method 
but can use push in its implementation. 

2. Consuming the stream
2.a using pipe
2.b or by defining custom event listeners

*/

import { transcode } from 'buffer';
import {Readable, Transform} from 'stream';

const upperCasetr = new Transform({
    transform(chunk, encoding, cb){
        this.push(chunk.toString().toUpperCase());
        cb();
    }
});
process.stdin.pipe(upperCasetr).pipe(process.stdout); 

// stream object mode

const commaSpliter = new Transform({
    readableObjectMode : true,
    transform(chunk, encoding, cb){
        this.push(chunk.toString().trim().split(','));
        cb();
    }
});
const arrayToObject = new Transform({
    writableObjectMode: true,
    readableObjectMode:true,
    transform(chunk,encoding,cb){
        let obj = {};
        for(let i=0; i < chunk.length; i+= 2){
            obj[chunk[i]] = chunk[i+1] 
        }
        this.push(obj);
        cb();
    }
})
const objToString = new Transform({
    writableObjectMode: true,
    readableObjectMode: true,
    transform(chunk, encoding, cb){
        this.push(JSON.stringify(chunk) + "\n");
        cb();
    }
});

const inStream = new Readable({
    read(){}
});
inStream.push("a,b,c,d");
inStream.push(null);
// reading the data from source 
inStream
//splitting the input string around commas(","), spits out an array containing the elements produced after splitting
.pipe(commaSpliter)
//transforming the input array in the custom object (props and their values selected from the array elements)
.pipe(arrayToObject)
//transforming the object into an string, input>obj, output> stringified object
.pipe(objToString)
.pipe(process.stdout);