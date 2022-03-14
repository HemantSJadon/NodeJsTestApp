//Streams 

//Buffering is a generic mechanism:
//temporary store data before it can be consumed/processed
/* deal with the speed mistmatch at which the data is being generated 
vs at which the data is consumed
 */

/* rather than downloading entire data at once, 
reading/writing it bit by bit and 
processing can be started as soon as you have some data
rather than waiting for entire payload/data to arrive
1. Memory efficiency:No need to download large amounts of data before processing it,
2. Time efficiency: start processing data as soons as you have it
rather than waiting for the entire payload to arrive.

 */
import fs from 'fs';
import http from 'http';

//case1: reading a video file without streaming approach
var videoFilePath = "/Users/hemant/downloads/video/sample2.mp4";
const server1 = http.createServer();
server1.on('request',(req,res) => {
    //reading the video file entirely at once
    fs.readFile(videoFilePath, (err, data) => {
        if(err){
            console.log(err);
            return;
        }
        res.writeHead(200, {'Content-type':'video/mp4'});
        res.end(data);
    })
});
const port = 8080;
server1.listen(port);
server1.on('listening', () => {
    console.log(`server1 is listening on ${port}`);
});

//case2: reading/accessing video with streaming approach

const server2 = http.createServer();
server2.on('request',(req,res) => {
    res.writeHead(200,{'Content-Type':'video/mp4'});
    //first, creating a read stream and piping it to write stream
    fs.createReadStream(videoFilePath).pipe(res)
    .on('error',console.error);
});
// server2.listen(port);
server2.on('listening',() => {
    console.log(`server2 is listening on port ${port}`);
})






