//Node's built-in transform streams
//1. zlib (compressing and decompressing file)
//2. crypto (encrypting and decrypting files)

//1. Compressing and saving a file (creating a zipped version of the file)
import fs from 'fs';
import zlib from 'zlib';
import {Transform} from 'stream';
import crypto from 'crypto';

//pass the file path from node command (node <this js file name> <path to the file to compress)
let file = process.argv[2];

console.log(file + ".gz");

const reportProgress = new Transform({
    transform(chunk,encoding, cb){
        process.stdout.write(".");
        //notice how the callback is used to push the data to readable part of the transform stream
        //This is equivalent to pushing the data first : this.push(chunk);cb();
        cb(null,chunk);
    }
})

/* fs.createReadStream(file)
//reads the file from the readAble stream , outputs: compressed data file stream
.pipe(zlib.createGzip())
//one way to report process
// .on('data',() => console.log("."))
//Another way to report progress (using another transform stream to report process)
.pipe(reportProgress)
.pipe(fs.createWriteStream(file + ".gz"))
.on('finish', () => console.log("Done")); */

//2. Uncompressing (unzipping a file)

//pass the path of the file to decompress as an command line argument (node <this js file path> <path to the file to decompress>) 
let fileToDecomp = process.argv[2].slice(0,-4) + ".pdf.gz";
// console.log(file.slice(0,-7)+ "_decomp2.pdf");

/* fs.createReadStream(file)
.pipe(zlib.createGunzip())
.pipe(fs.createWriteStream(file.slice(0,-7)+ "_decomp2.pdf"));
 */


//3. chaining multiple transform operations by piping data to many transform streams
// compressing and then encrypting the file
const algo = "aes-192-cbc";
const password = "hemant1123";
let keyToDecrypt = crypto.scryptSync(password,'salt',24);
let ivToDecrypt = crypto.randomFillSync(new Uint8Array(16));


const cipher = crypto.createCipheriv(algo,keyToDecrypt, ivToDecrypt);

let encrypted = '';
const compressedFile = file + ".gz";
const compressedEncryptedFile = compressedFile.slice(0,-7) + "_compEncr.pdf.gz";

fs.createReadStream(file)
.pipe(zlib.createGzip())
// .pipe(cipher)
// .pipe(process.stdout);
.pipe(reportProgress)
.pipe(fs.createWriteStream(file + ".gz"))
.on('finish', () => {
    console.log('done');
    let encrypted = '';
    fs.createReadStream(file + ".gz")
    .pipe(cipher)
    .on('data', chunk => {
        encrypted += chunk;
    })
    .pipe(fs.createWriteStream(compressedEncryptedFile))
    .on('finish', () => {
        console.log('done with encryption');
        console.log(encrypted.length);
    });


});


//
// const compressedFile = file + ".gz";
// const compressedEncryptedFile = compressedFile.slice(0,-7) + "_compEncr.pdf.zz";
// fs.createReadStream(compressedFile)
// .pipe(cipher)
// .pipe(reportProgress)
// .pipe(fs.createWriteStream(compressedEncryptedFile))
// .on('finish', () => console.log('done with encryption'));




//decrypting and then decompressing the file
const decipher = crypto.createDecipheriv(algo, keyToDecrypt, ivToDecrypt);


// fs.createReadStream(fileToDecomp)
// .pipe(decipher)
// .pipe(zlib.createGunzip())
// .pipe(reportProgress)
// .pipe(fs.createWriteStream(file.slice(0,-7) + "_decomped3.pdf"))
// .pipe('finish',() => console.log('done'))
// ;

