//Example displaying how synchronously set up time consuming
//code can block others
/* time consuming i/o operations or calculation should be set up
in non-blocking/asynchronous way */

import http from 'http';

const server = http.createServer((req,res) => {
    console.log("request event");
    if(req.url === "/"){
        res.end("Welcome to the home page, man.");
    }
    else if(req.url === "/about"){
        //Blocking code (some time consuming operation set up in synchronous way)
        for(let i =0; i < 10000; i++){
            for(let j =0; j < 100; j++){
                console.log(`${i}:${j}`);
            }   
        }

        res.end("Here is out short history.");
    }
    else{
        res.end("Error.");
    }
});

server.listen(8080, () => {
    console.log("Server listening on port 8080....");
})