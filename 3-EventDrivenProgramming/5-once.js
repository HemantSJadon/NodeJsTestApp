import {once, EventEmitter} from 'events';

async function run(){
    const ee = new EventEmitter();
    process.nextTick(() => {
        ee.emit('myevent',42);
    });
    const [value] = await once(ee,'myevent');
    console.log(value);

    const err = new Error("Kaboom!");
    console.log(err);
    process.nextTick(() => {
        ee.emit('error',err);
    });
    //special handling of error is when waiting for another event
    try {
        await once(ee,'myevent');
    } catch (error) {
        console.log('error happened:',error);
    }
}
// run();

/* When events.once() is used to wait for error event,
it is treated like any other event */

const ee = new EventEmitter();
once(ee, 'error')
.then(([err]) => console.log('ok', err.message))
.catch(err => console.log('error', err.message));

ee.emit('error', new Error('boom'));

// const myEmitter = new EventEmitter();

// myEmitter.on()