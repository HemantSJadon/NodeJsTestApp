//4 types of streams


//2. Writable streams
import fs, { read } from 'fs';
import http from 'http';

var readvideoFilePath = "/Users/hemant/downloads/video/sample1.mp4";
var writevidFilePath = "/Users/hemant/downloads/video/sample1_copy.mp4";
const readStream = fs.createReadStream(readvideoFilePath);
const writeStream = fs.createWriteStream(writevidFilePath);

readStream.on('data', chunk => {
    writeStream.write(chunk);
});

readStream.on('end', () => {
    console.log('Read stream finished');
});

readStream.on('end', () => {
    writeStream.end();//finishing the copy
});

writeStream.on('close', () => {
    console.log('File copies successfully.');
} );

//When the file is copies successfully, open an http server with endpoint to serve the file
writeStream.on('close', () => {
    const server = http.createServer();
    server.on('request', (req,res) => {
        res.writeHead(200, {'Content-Type': 'video/mp4'});
        fs.createReadStream(writevidFilePath).pipe(res)
        .on('error', () => console.error());
    });
    server.listen(8080);
    server.on('listening', () => {
        console.log('video server listening on port 8080..');
    });
})
