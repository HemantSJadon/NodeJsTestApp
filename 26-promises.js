//JS promises - a solution to avoid callback hell

//async await
//consume/use promises

//pending, rejected, fulfilled

const value = 2;

const promise = new Promise((resolve, reject) => {
    const random = Math.floor(Math.random * 3);
    if(random === value){
        resolve('you guessed correctly.');
    }
    else
    {
        reject('wrong number');
    }
});
console.log(promise);

promise.then((data) => console.log(data)).catch((err) => 
console.log(err));
/* the argument passed to the promise is known as 
executor > it's a callback function:
it is passed 2 arguments (which are callback themselves):
1. resolve: it's a callback function used to resolve the promise 
with a value or the result of another promise.
2. Reject: it's a callback function used to reject the promise
with a provided reason or error
*/


