import fs from 'fs';
import http, { Server } from 'http';

//writing a big file
/* const file = fs.createWriteStream("./big.file");

for(let i = 0; i <= 1e6; i++){
    file.write('Lorem ipsum dolor sit amet, consectetur adipisicing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.\n');
}
file.end(); */

var filePath = "./big.file";
const server = http.createServer();

//reading file asynchronously without any streams
/* server.on('request', (req,res) => {
    fs.readFile(filePath, (err, data) => {
        if(err){
            throw err;
        }
        res.end(data);
    });
}); */

//reading file asynchronously with streams
server.on('request', (req,res) => {
    const readStream =  fs.createReadStream(filePath);
    readStream.pipe(res);
});

server.listen(8080);
server.on('listening', () => {
    console.log("server is listening to port 8080....");
});

/* check the memory consumed by the process named "node"
in the process tab of the activity monitor. 
//Case1: without streams
as soon as you make a request, the memory shoots up. as it asynchronously reads the entire file into RAM, then only the processing (writing it to the response ca begin)

//Case2: with streams
this reads the data from source chunk by chunk, as soon as the first chunk arrives, the data can be processed.
The memory footprint stay low. The GC sweep cycle is small (multiple cycles with be there, high efficiency)
*/