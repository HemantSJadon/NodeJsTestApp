const fs = require('fs');
console.log('start');
const first = fs.readFileSync('./content/first.txt');
const second = fs.readFileSync('./content/second.txt','utf-8');
console.log(first.toLocaleString(), "\n", second);
fs.writeFileSync(
    './content/result-sync.txt',
    `Here is the result: ${first}, ${second}`,
    { flag: 'a' }
);
const result = fs.readFileSync('./content/result-sync.txt');
console.log(result.toLocaleString());
console.log('done with the task');
console.log('starting the next task.');


