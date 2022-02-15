import {promises as fs} from 'fs';
const {readFile, writeFile} = fs;

/* using promisify from util package 
to cause async operations return a promise*/
// import util from 'util';
// const readFilePromise = util.promisify(readFile);
// const writeFilePromise = util.promisify(writeFile);

const start = async () => {
    try {
        const first = await readFile('./content/first.txt','utf-8');
        const second = await readFile('./content/second.txt','utf-8');
        await writeFile('./content/result-asycnawait.txt',
        `Here is the result: ${first} ${second}`,{flag : 'a'});
        const result = await readFile('./content/result-asycnawait.txt','utf-8');
        console.log(first,second);
        console.log(`the result of write operation : ${result}`);
    } catch (error) {
        console.log(error);
    }
};

start();
// getText('./content/first.txt')
// .then((d) => console.log(d))
// .catch(err => console.log(err));

//Asynchronously starts reading the file
//callback added to the queue by event loop
//callback will be executed only when call stack is empty

// readFile('./content/first.txt','utf-8',(err, data) => {
//     if(err){
//         console.log(err);
//         return;
//     }
//     console.log(data);
//     return;
// });
