//hashing, encryption, decryption
//cipher class
import crypto from 'crypto';

const algo = 'aes-192-cbc';
const password = 'holdMeForever1991';

//1. Creating key and iv (using await pattern, not callback)

async function createKeyFromPassword(password){
    let key = await new Promise((resolve,reject) => {
        crypto.scrypt(password,'salt',24,(err,key) => {
            if(err) reject(err);
            resolve(key);
        });
    });
    return key;
};
async function createRandomIv(size){
    let iv = await new Promise((resolve,reject) => {
        crypto.randomFill(new Uint8Array(size), (err, iv)=> {
            if(err) reject(err);
            resolve(iv);
        });
    });
    return iv;
}
let keyTodecrypt = await createKeyFromPassword(password);
let ivTodecrypt = await createRandomIv(16);
const cipher = crypto.createCipheriv(algo,keyTodecrypt,ivTodecrypt);
let encrypted = '';
cipher.setEncoding("hex");
cipher.on('data', chunk => {
    encrypted += chunk;
});
cipher.on('end', () => {
    console.log(encrypted);
});
cipher.write("some plain text data");
cipher.end();

//Callback approach:  create a key from the password using the internal algorithm behind this method, done with salt
/* crypto.scrypt(password, 'salt', 24, (err, key) => {
    if(err) throw err;
    keyTodecrypt = key;
    console.log("Key is :",keyTodecrypt.toString("hex"));
    //generate a random iv
    crypto.randomFill(new Uint8Array(16),(err, iv) => {
        if(err) throw err;
        ivTodecrypt = iv;
        console.log("iv is :",ivTodecrypt.toString("hex"));
        //create a cipher object with key and iv
        //the key length (buffer length should be in the valid range allow by the algorithm being used to create a cipher)
        const cipher = crypto.createCipheriv(algo,key,iv);
        let encrypted = '';
        cipher.setEncoding("hex");

        cipher.on('data', chunk => {
            encrypted += chunk;
        });
        cipher.on('end', () => {
            console.log(encrypted);
        });

        cipher.write('some plain text data');
        cipher.end();
    })
}); */

const decipher = crypto.createDecipheriv(algo,keyTodecrypt,ivTodecrypt);

let decrypted = '';
decipher.on('data', (chunk) => {
    decrypted += chunk.toString("utf-8");
});
decipher.on('end', () => {
    console.log(decrypted);
});

decipher.write(encrypted, "hex");
decipher.end();

//3. hashing (one way)
const hash = crypto.createHash('sha256');
hash.on('readable', (chunk) => {
    const data = hash.read();
    if(data){
        console.log("Hash is ",data.toString("hex"));
    }
});
hash.write("some plain data to hash");
hash.end();


