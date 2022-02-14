//Iterables

let range = {
    from : 1,
    to: 5
};

//1. call to for..of initially calls this.

range[Symbol.iterator] = function(){
    //..it returns the iterator object:
    //2. onward, for..of works only with the iterator object below, 
    //asking it for the next value
    return {
        current : this.from,
        last: this.to,

        //3. next() is called on each iteration nby the for..of loop
        next(){
            //4. it should return the value as an object {done:.., value:..}
            if(this.current <= this.last){
                return {done: false, value: this.current++};
            }
            else{
                return {done: true};
            }

        }
    }
}
for(let num of range){
    console.log(num);
}

//the iterator object is separate from the object it iterates over.
//separation of concerns

/// String and Array are most widely used built-in iterables

for(let char of "Test"){
    console.log(char);
}

//calling an iterator explicitly

let str = "Hello"
for(let char of str){
    console.log(char);
}
let iterator =  str[Symbol.iterator]();
while(true){
    let result = iterator.next();
    if(result.done) break;
    console.log(result.value);
}

//Iterables and array-likes
//iterables: objects that implement the Symbol.iterator method
//Array-like are objects that have indexes and length, so they look like arrays

/*range object mentioned above is iterables (implement Symbol.iterator method)
but not array-like (doesn't have indexed properties and length)
*/

let arrayLike = { //has indexes and length => array-like
    0 : "Hello",
    1: "World",
    length: 2
}
/* for..of loop wouldn't work on this object*/
