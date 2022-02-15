import {readFile} from 'fs';

console.log("Started the first task.");
readFile('./content/first.txt',"utf-8", (err, result) => {
    if(err){
        console.log(err);
        return;
    }
    console.log(result);
    console.log("Completed the first task");
});
console.log("Starting the next task"); 