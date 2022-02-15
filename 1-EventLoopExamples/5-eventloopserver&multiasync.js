import http from 'http';

const server = http.createServer((req, res) => {
    console.log("request event");
    if(req.url === "/" ){
        res.end("Welcome to the home page man!");
    }
    else if(req.url === "/about"){
        res.end("Here is our short history.");
    }
    else{
        res.end(`
        <h1>OOPS!</h1>
        <p>We couldn't find what you were looking for.</p>
        <a href="/">back home</a>
        `);
    }
});

server.listen(8080, () => {
    console.log("Server listening on port 8080..");
})

setInterval(() => {
    console.log("WhatUp man!");
}, 10000);

//Callbacks  from multiple async processes are added to the queue.



