import EventEmitter from 'events';
//Removing listeners

//removeListener method

/* Best practice is to have named listeners rather anonymous functions.
Reason being > we will have to reference the exact function in this method. 
if anonymous > only way to do that would be inside the eventemitter object. Even more problematic if mutliple listeners
are registered for an event. 
*/ 

//Example of using anonymous event listeners


const chatRoomEvents = new EventEmitter();

function userJoined(username){
    const msg = `user ${username} has joined`;
    chatRoomEvents.emit('message',msg);
}
function login(username){
    chatRoomEvents.emit('userJoined', username);
}

chatRoomEvents.on('message',(msg) => {
    console.log(msg);
});

chatRoomEvents.on('userJoined', userJoined);

login("Akanksha");

// named listener example
const myEmitter = new EventEmitter();

myEmitter.on('event', function firstListener() {
    console.log(`event triggered: first listener
    parameters: none`);
});
function secondListener(arg1, arg2){
    console.log(`event triggered: second listener
    parameters: ${arg1} ${arg2}`);
}
myEmitter.on('event', secondListener);

/*this removal wouldn't work because the event listener 
* was defined in the on method itself. it should have been defined before
* and referenced in the on method */
// myEmitter.removeListener('event'firstListener,  firstListener);

//This would work fine.
myEmitter.removeListener('event', secondListener);

//This removes all event listeners
myEmitter.removeAllListeners('event');
myEmitter.emit('event',1,2);





