//Map method

const people = [
    {
        name:'Hemant',
        age:20,
        position:'Developer'
    },
    {
        name:'Rakesh',
        age:30,
        position:'ProductManager'
    },
    {
        name:'Nikhil',
        age:50,
        position:'CEO'
    }
]

// map method does return a new array 
// does not affect the original size of the array

const ages = people.map((p) => p.age);
console.log(ages);

const newPeople = people.map((p) => {
    return {
        firstName: p.name.toUpperCase(),
        oldAge: p.age + 20
    }
}
);
console.log(newPeople);