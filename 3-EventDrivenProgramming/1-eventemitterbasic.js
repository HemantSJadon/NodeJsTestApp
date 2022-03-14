//event driven programming 
// where some events determine the flow of the program

import EventEmitter from 'events';

const chatRoomEvents = new EventEmitter();

console.log(chatRoomEvents instanceof EventEmitter);
// console.log(EventEmitter);

function userJoined(username){
    alertAllUsers('User ' + username + ' has joined the chat');
}

function alertAllUsers(message){
    console.log(message);
}

//Trigger the userJoined functino when a 'userJoined' events is triggered
chatRoomEvents.on('userJoined', userJoined);

//Chaining multiple trigger to single event, executed in order
chatRoomEvents.on('userJoined', () => {
    console.log("User has joined");
});

chatRoomEvents.on('userJoined',() => {
    console.log("User has joined 2.");
});
//Use prepend listener to change order of execution
chatRoomEvents.prependListener('userJoined', () => {
    console.log('User has joined 3');
});

function login(username){
    chatRoomEvents.emit('userJoined', username);
}

login("Hemant");


//Emit calls all the listeners for an event synchrnously. 
const myEmitter = new EventEmitter();

myEmitter.on('event', function firstListener() {
    console.log("Hello! first listener.");
});
myEmitter.on('event', function secondListener(arg1, arg2) {
    console.log(`event with parameters ${arg1} ${arg2} in second listener`);
});
myEmitter.on('event', function thirdListener(...args){
    const parameters = args.join(",");
    console.log(`event with parameters ${parameters} in third listener.`);
});

myEmitter.emit('event',1,2,3,3,4,5);




