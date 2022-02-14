import { createServer } from 'http';


const server = createServer((req, res) => {
    if(req.url == "/"){
        res.write("Welcome to our home page.");
    }
    // if(req.url === "/about"){
    //     res.end("Here is our short history.");
    // }
    // else{
    // res.end(`
    // <h1>OOPS!</h1>
    // <p>We couldn't find what you are looking for.</p>
    // <a href = "/">back home</a>
    // `);
    // }
    // res.write("Welcome");
    res.write('Not found.');
    
});

server.listen(5002);