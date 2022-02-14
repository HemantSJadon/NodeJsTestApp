//Rest operator ...
//gathers/collects items
//destructuring, functions
//placement important, careful with the same name
//rest when declaring function, spread when invoking the function

//arrays
const fruits = ['apple','banana','lemon','orange'];
// const [first,second, ...rest] = fruits;
const [first, ...restOfTheFruits] = fruits;
console.log(first, restOfTheFruits)

//objects
const person = {name : 'john', lastName: 'smith', job: 'developer'};
const {name, ...rest} = person;
console.log(name, rest);


//functions

const getAverage = (name, ...scores) => {
    console.log(name);
    console.log(scores);
    const avg = scores.reduce((avg, item) => {return avg += item}, 0)/scores.length;
    console.log(avg);
}

const testScores = [89,09,32,56,88,90,93,89];
getAverage(person.name, ...testScores)