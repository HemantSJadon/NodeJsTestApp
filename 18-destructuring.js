//Destructuring is
//faster/easier way to access/unpack elements from arrays, objects

const fruits = ['orange','papaya','apple','banana'];
const friends = ['john','peter','bob','anna'];

// const fruit1 = fruits[0];
// const fruit2 = fruits[1];
// const fruit3 = fruits[2];

// console.log(fruit1, fruit2, fruit3);

const [,fruit1, ,fruit2, fruit3,fruit4, fruit5] = fruits;
console.log(fruit1, fruit2, fruit3,fruit4, fruit5);

//swapping values between 2 variables

// let first = 'bob';
// let second = 'john';

// [second, first] = [first, second]
// console.log(first, second);

//object destructuring (done with curly braces{})
//order does not matter
//can use an alias
const bob = {
    first:'bob',
    last: 'sanders',
    city:'chicago',
    siblings:{
        sister:'jane'
    }
};

const last = "some value";
const { last:shakeAndBake,first, city, siblings:{sister:favoriteSib}} = bob;

console.log(first, last, city, shakeAndBake, favoriteSib);


function printPerson({first, last,city, siblings:{sister}})
{
    // const {} = person;
    console.log(first, last, city, sister);
}
printPerson(bob);