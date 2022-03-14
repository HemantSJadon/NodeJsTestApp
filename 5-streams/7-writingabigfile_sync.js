//writing a big file
import fs from 'fs';

let filePathRelative = "/5-streams/content/big_file.txt";
let fileToWrite = process.cwd() + filePathRelative;

console.log(fileToWrite);

for(let i = 0; i < 100000; i++){
    fs.writeFileSync(fileToWrite, `hello world ${i}\n`, {flag : 'a'});
}

