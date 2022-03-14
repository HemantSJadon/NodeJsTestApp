//Event loop phases

/*
1. Poll phases (all synchronous code is executed in this phase
    , all async i/o operations,
    , i/o operations callback,
    event queue) (except > timer callback, check phase callback 
        , close callbacks)
2. Check phase (setImmediate callbacks)
3. Close callback phase ()
4. Timer phase (settimeout callbacks)
5. pending callback phase 
6. idle, prepare 
 */

//case 1: 
/* setTimeout(() => {
   console.log('2'); 
});
console.log(1); */

/* setTimeout is run synchronously
says after a thresold of 2 ms, add a callback to timers queue.
poll phases print 1. 
after the poll phase is done, a new callback will be added to the 
callback queue of timers phase by the node.js api.

After the completion of the poll phase, event loop moves to 
the next phase. 

When the loop reaches timers phase in the current iteration, 
it will go throught the timers queue. It will find the 
settimeout function's callback there and 
print 2 to the console.



*/


//2: SetImmediate (executes callback in the check phase of the event loop )

setImmediate(() => {
    console.log("Callback executed by setImmediate in the check phase.");
});
console.log(1);


setTimeout(() => {
    console.log("settimeout callback : 4 ms");
}, 4);

setTimeout(() => {
    console.log("settimeout callback: 2ms");
}, 2);


