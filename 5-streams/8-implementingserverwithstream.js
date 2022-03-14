//reading a big file over network (whole vs stream)
import http from 'http';
import fs from 'fs';

let fileToRead = "." + "/5-streams/content/big_file.txt";
const server = http.createServer();
server.on('request', (req,res)=> {
    const data = fs.readFileSync(fileToRead, "utf-8");
    res.end(data);
})
const port = 8080;
// server.listen(8080,() => {
//     console.log("server is listening to port 8080..");
// });
const serverUsingStream = http.createServer();
serverUsingStream.on('request',(req,res) => {
    const fileStream = fs.createReadStream(fileToRead,"utf-8");
    //on stream opening, consume oit by piping to the response stream
    fileStream.on('open', () => {
        fileStream.pipe(res);
    });
    fileStream.on('error', err => {
        res.end(err);
    });
    //consuming stream via manual event listener 
    // fileStream.on('data', (chunk) => {
    //     res.write(chunk);
    // });
    fileStream.on('end', () => {
        res.end();
    });
});
serverUsingStream.listen(port);
serverUsingStream.on('listening', () => {
    console.log(`server is listeing on port ${port}...`);
})


