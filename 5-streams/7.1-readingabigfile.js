import fs from 'fs';
var fileToRead =  "./5-streams.js/content/big_file.txt";

//reading file the sync way
let data = fs.readFileSync(fileToRead, "utf-8");
console.log("data_sync: ",data.length);


//reading file the async way 

//1. with callbacks
let data_async = fs.readFile(fileToRead, "utf-8", (err, data) => {
    if(err) throw err;
    console.log("data_async with callbacks:", data.length);
});


//2. with promise (non await pattern)
let data_asyncPromise = new Promise((resolve, reject) => {
    fs.readFile(fileToRead, "utf-8", (err, data) => {
        if(err) reject(err);
        resolve(data);
    })
});

data_asyncPromise
.then(data => console.log(`data_async w/ promise non await:`,data.length))
.catch(err => {
    throw err;
});

//3. With promise (await pattern)
let data_asyncPromiseAwait =  await data_asyncPromise;
console.log(`data_async with promise with await: ${data_asyncPromiseAwait.length}`);


//Reading asycn way with read streams
const readStream = fs.createReadStream(fileToRead, {highWaterMark: 90000});
let size = 0;
readStream.on('data', chunk => {
    size += chunk.length;
    console.length(`chunk size: ${chunk.length}`);
});
readStream.on('end', () => {
    console.log(`total data_async with stream: ${size}`);
})


