const {readFile, writeFile} = require('fs');

let taskNum = 1;
console.log(`starting with the task ${taskNum}`);
readFile(
    './content/first.txt',
    'utf8',
    (err, result) =>{
        if(err){
            console.log(err);
            return;
        }
        const first = result;
        readFile(
            './content/second.txt','utf8',
            (err,result) =>{
                if(err){
                    console.log(err);
                    return;
                }
                const second = result;
                writeFile(
                    './content/result-async.txt',
                    `Here is the result: ${first},${second}`,
                    (err,result) =>{
                        if(err){
                            console.log(err);
                            return;
                        }
                        console.log(`done with the task ${taskNum}`);
                    }
                )
            }
        )
    }
)
taskNum++;
console.log(`starting with the task ${taskNum}`);