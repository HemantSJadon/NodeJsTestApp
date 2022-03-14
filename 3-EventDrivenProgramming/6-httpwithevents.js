import http from 'http';

//Case 1 : create server  and logic to listen and respond to requests using callbacks

const server = http.createServer((req,res) => {
    res.end('welcome');
});

// server.listen(8080, () => {
//     console.log('server is listening on port 8080...');
// });

//case 2: create sever and logic to listen to request is implemented using events listener

const server2 = http.createServer();
server2.on('request', (req,res) => {
    res.end('welcome to the server2.');
});

server2.listen(8080);

server2.on('listening',() => {
    console.log('server2 is listening on port 8080');
})
