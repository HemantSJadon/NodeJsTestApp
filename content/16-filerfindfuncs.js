//Filter  - returns a new array, can manipulate the size of new array (unlike map)
// returns based on condition

//Find - returns single instance, returns first match, if no match - undefined

const people = [
    {name: 'bob', age:20 , position: 'developer' },
    {name: 'peter', age: 25, position: 'designer'},
    {name: 'susy', age: 30, position: 'the boss'},
    {name: 'anna', age: 35, position: 'intern'}
]

//filter

const youndPeople = people.filter((p) => p.age <= 25).map(p => 
    p.name);
console.log(youndPeople);


//no match
const seniorDevs = people.filter((i) => i.position == 'senior devs');
console.log(seniorDevs); 

//find
const peter = people.find((person) =>  person.name ===  'peter');
console.log(peter);

// no match
const fruits = ["apple","pineapple","lemon","melon","melon"];
const fruitToEat = fruits.find(f => f === "melon");
const melons = fruits.filter(f => f === "melon");
console.log(fruitToEat);
console.log(melons);

//multiple matches - first match
