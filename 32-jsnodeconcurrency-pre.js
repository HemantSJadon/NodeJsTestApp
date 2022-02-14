// import express from 'express';
// import req from 'express/lib/request';
// import res from 'express/lib/response';

// const app = express();
// const port = 3055;

// app.get('/async', async (req,res) => {
//     const user = await readUserAsync();
//     res.send(user);
// });


// app.get('/sync' ,(req,res) => {
//     const user = readUserSync();
//     res.send(user);
// })

// app.listen(port, () => console.log(`Example app listening on port ${port}!`));




// // import {promises as fs} from 'fs';
// // const {readFile, writeFile} = fs;

// // const first = await readFile('./content/first.txt','utf-8');
// // console.log(first);
// // ReadFileData('./content/first.txt','utf-8');
// // console.log(first);
// // function ReadFileData(relativeFilePath, bufferEncoding) {
// //     console.log(`started reading file from path "${relativeFilePath}"`);
// //     return readFile(relativeFilePath, bufferEncoding,(err,data) =>{
// //         if(err){
// //             console.log(err);
// //             return;
// //         }
// //         console.log(`finished with reading data from path "${relativeFilePath}"`);
// //         return data;
// //     });
// // }