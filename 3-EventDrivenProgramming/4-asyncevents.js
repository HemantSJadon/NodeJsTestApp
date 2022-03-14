import EventEmitter from 'events';
import {readFile} from 'fs';
import util from 'util'
import { isAsyncFunction } from 'util/types';
const readFilePromise = util.promisify(readFile);
//EventEmitter objects

/*Emitter objects emit named events that cause previously
* registered listeners to be called. 
An emitter objects basically has 2 main features:
1. Emitting named events
2. Registering and unregistering listener functions
*/
//event emitter based classes
class MyEmitter extends EventEmitter{

}

const myEmitter = new MyEmitter();
myEmitter.on('something-happened', () => {
    console.log('something has happened.');
})


myEmitter.emit('something-happened');

//Events !== Asynchrony

class WithLog extends EventEmitter{
     execute =  async (taskFunc) => {
        console.log('Before executing');
        this.emit('begin');
        //Awaiting the async function
        await taskFunc();
        this.emit('end');
        console.log('After executing');
    };
}
const withLog = new WithLog();

withLog.on('begin', () => console.log('About to execute'));
withLog.on('end', () => {console.log('Done with execute')});

//Synchronous task
// withLog.execute(() => console.log('*** Executing task***'));

//Passing an asychronous function (the order of events will not be correct if the result of async is not await)

// await withLog.execute(TaskFunction);

async function TaskFunction(){
    await new Promise((resolve,reject) => {
        setImmediate(() => {
            console.log("*** executing task ***");
            resolve();
        });
    })
}

// async with callbacks
class WithTime extends EventEmitter{
    execute = async (asyncFunc, ...args) => {
        console.log("before executing");
        this.emit('begin');
        console.time('execute');
        asyncFunc(...args, (err, data) => {
            if(err){
                return this.emit('error',err);
            }
            this.emit('data',data);
            console.timeEnd('execute');
            this.emit('end');
        });
        console.log('after executing');
    }
}

const withTime = new WithTime();
withTime.on('error', (err) => console.log(err));
withTime.on('data', data => console.log(data));        
withTime.on('begin', () => console.log("About to execute"));
withTime.on('end', () => console.log("Done with execute"));
// withTime.execute(readFile,'./content/first.txt','utf-8');


//Async with promises without await pattern

class WithTimePromise extends EventEmitter{
    execute = (asyncFunc, ...args) => {
        console.log("before execution");
        this.emit('begin');
        console.time('execute');
        asyncFunc(...args)
        .then(d => {
            this.emit('data',d);
            console.timeEnd('execute');
            this.emit('end');
        })
        .catch(error => {
            this.emit('error',error);
        });
        console.log("after execution");
    }
}
const withTimePromise = new WithTimePromise();
withTimePromise.on('begin', () => console.log("about to execute"));
withTimePromise.on('end', () => console.log("done with execute"));
withTimePromise.on('data',(data) => console.log(data));
withTimePromise.on('error', (error) => console.log(error));

// withTimePromise.execute(readFilePromise,'./content/first.txt','utf-8');

//Async with Promise with await pattern

class WithTimePromiseAwait extends EventEmitter{
    execute =  async (asyncFunc, ...args) => {
        try {
            console.log('before execution');
            this.emit('begin');
            console.time('execute');
            const data = await asyncFunc(...args);
            this.emit('data',data);
            console.timeEnd('execute');
            this.emit('end');
            console.log("after execution");
        } catch (error) {
            this.emit('error',error);
        }
    }
}
const withTimePromAwait = new WithTimePromiseAwait();
withTimePromAwait.on('begin',() => {
    console.log('about to execute');
});
withTimePromAwait.on('end',() => {
    console.log('done with execute');
});
withTimePromAwait.on('data', (data) => {
    console.log(data);
});
withTimePromAwait.on('error', (err) => {
    console.log(err);
});
withTimePromAwait.execute(readFilePromise,'./content/second.txt','utf-8');


