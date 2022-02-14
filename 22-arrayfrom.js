//Array.from()
let arrayLike = {
    0: "Hello",
    1: "World",
    length: 2
}
console.log(arrayLike);
let arr = Array.from(arrayLike, (v,index) => {return index;}); // copies all elements into new array
console.log(arr);


//Array.from() with iterables

let range = {
    from: 1,
    to: 5    
};
range[Symbol.iterator] = function(){
    return {
        current: this.from,
        last : this.to,
        next(){
            if(this.current <= this.last){
                return {done: false, value : this.current++};
            }
            else{
                return {done: true};
            }
        }
    };

};

arr = Array.from(range, num => Math.pow(num,2));
console.log(arr);

//Array from a string
arr = Array.from('foo');
console.log(arr);

//Array from a set
const set = new Set(['foo','bar','baz','bar']);
console.log(Array.from(set))

//Array from a Map
const map = new Map([[1,2],[2,4],['11',3]]);
console.log(map.get('11'));
console.log(Array.from(map.values()));
Array.from(map.keys());
arr = map.entries();
for(let pair of arr)
{
    console.log(pair);
}

//Sequence generator (range)

const rangeGen = (start, stop, step) => Array.from({length: (stop-start)/step + 1},(_,i) => start + (i*step));

console.log(rangeGen(0,7,2));

//Generate the alphabate

console.log(rangeGen('A'.charCodeAt(0), 'Z'.charCodeAt(0),1)
.map(x => String.fromCharCode(x)));

//pagination
//1.. generate a sequence of 120 items

const items = Array.from({length: 120}, (_,index) => {return index;});
const itemsPerPage = 14;
const pages = Math.ceil(items.length/itemsPerPage);
console.log(pages);

const itemsOnPages = Array.from({length: pages}, (_,index) =>{
    const start = index*itemsPerPage;
    const end = start + itemsPerPage;
    return items.slice(start,end);
});
console.log(itemsOnPages);

