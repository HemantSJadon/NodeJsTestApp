import {readFile, writeFile} from 'fs';
import util from 'util';
const readFilePromise = util.promisify(readFile);
const writeFilePromise = util.promisify(writeFile);

async function Waiter(timeInms){
    await new Promise((resolve,reject) => {
        setTimeout(() => {
            console.log(`waiting done for ${timeInms} milliseconds`);
            resolve();
        }, timeInms);
    })
}
console.log('waiting starts');
console.time('waiting');
await Waiter(1000);
console.timeEnd('waiting');

//Reading file
console.time('file reading.');
await readFilePromise('./content/first.txt','utf-8');
console.timeEnd('file reading.');

//Writing file
/* console.time('write');
await writeFilePromise('./content/first.txt',
'Hello! this is first text file written again',{flag : 'a'});
console.timeEnd('write'); */


import {readFile} from 'fs';

function someAsyncOperation(cb){
    readFile('./content/first.txt',cb);
}
const timeoutScheduled = Date.now();

setTimeout(() => {
    const delay = Date.now() - timeoutScheduled;
    console.log(`${delay}ms have passed since I was scheduled.`);
}, 0);

setImmediate(() => {
    console.log("I am executed just after the file is read.");
})

// someAsyncOperation( () => {
//     const startCallBack = Date.now();

//     while(Date.now() - startCallBack < 10000){
//         //do nothing
//     }

//     console.log("File data reading completed");
// })

