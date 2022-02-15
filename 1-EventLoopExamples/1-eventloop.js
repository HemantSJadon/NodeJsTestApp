//Event loop, async patterns, events emitter and streams
//main concepts
//pre-built code
//Event loop

//JS is synchronous and single threaded
// JS executes code line by line

console.log("first task");

// let counter = 0;
// console.time('counter');
// for(let i = 0; i < 1000; i++){
//     counter++;
// }
// console.timeEnd('counter');
// console.log(`counter: ${counter}`);

setTimeout(() => {
    console.log("offloaded task completed.");
}, 0);


console.log("second task");

let counter = 0;

for(let i = 0; i < 1000000; i++ ){
    counter++;
}

console.log(`counter : ${counter}`);

/* callbacks from offloaded tasks are executed
only when the main thread is empty

for ex: settimeout API add the callback to the callback queue
when the timeout is complete. 
Items from this callback queue are picked based on FIFO
and added to call stack only when main thread is empty
*/
