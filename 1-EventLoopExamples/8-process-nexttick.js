//process.nextTick

/*
Before starting execution of next phase,
nextTickQueue is executed. it's not officially a part of the 
event loop.
Any callback provided in the process.nextTick() gets registered in the 
nextTickQueue of the next phase. 
 */

/* process.nextTick(() => {
    console.log(2);
});

setImmediate(() => {
    console.log(3);
    process.nextTick(() => {
        console.log(4);
    });
});

console.log(5);

setTimeout(() => {
    console.log(6);
}, 0); */

//case2: 

let bar;

//this has an async signature, but calls the callback synchronously

function someAsyncApiCall(cb){
    cb();
}

//the callback is called before 'someAsyncApiCall' is executed

someAsyncApiCall(() => {
    //this callback is trying to access a variable before it has been assigned a value 
    //use process.next tick here
    console.log('without process.nexttick, the bar value is', bar); // outputs bar as undefined
});

someAsyncApiCall(() => {
    process.nextTick(() => {
        console.log(`with process.nexttick, the bar value is ${bar}`);
    });
})
bar = 1;

//if the callback passed to someAsyncApiCall was made to 
//run after the complete synchronous part has been read, the 
// the variable bar will not be undefined when written to the console.

//case 3: event emit with process.nexttick()

import {EventEmitter} from 'events';
import util from 'util';

class MyEmitter extends EventEmitter{

}

const myEmitter = new MyEmitter();
process.nextTick(() => {
    myEmitter.emit('event');
});
// myEmitter.emit('event');
myEmitter.on('event', () => {
    console.log('an event occurred');
})