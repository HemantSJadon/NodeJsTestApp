/* 1. implement a readable stream:
extend the base Readable class
use the readable constructor with an options object as an argument
2. consume the readable stream */
import { resolve } from 'path';
import {Readable} from 'stream';

const inStream = new Readable({
    read(size){
        this.push(String.fromCharCode(this.currentCharCode++));
        if(this.currentCharCode > 90){
            this.push(null);
        }
    }
});
console.log(inStream.isPaused());
inStream.currentCharCode = 65;
//read method is called an a consumer when the stream is in the paused state.
// inStream.push('Abcdeisfb');
// inStream.push('jhbddcbschsdcbsdbc');
//pushing null indicates that there is no more data to push > it closes the stream
// inStream.push(null);

//consuming the readable by piping it to a writable stream
async function consumeData(){
    await new Promise((resolve,reject) => {
        try {
            inStream.pipe(process.stdout);
            resolve();
        } catch (error) {
            reject(error);
        }
    });
}
await consumeData();
process.nextTick(() => console.log(inStream.readable));

