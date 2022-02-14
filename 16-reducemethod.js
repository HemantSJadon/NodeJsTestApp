//reduce basics
//iterates over all values of a collection, callback function
//reduces to a single value - number, array, object
//seed values
//1st parameter ('acc') - total of all calculations
//2nd parameter ('curr') - current iteration/value

const staff = [
    {name: 'Bob',age: 30, position: 'Developer', salary: 40000},
    {name: 'peter',age: 20, position: 'Designer', salary: 30000},
    {name: 'Nikhil',age: 40, position: 'Product Manager', salary: 50000},
    {name: 'Anna',age: 60, position: 'CEO', salary: 100000},
];

const dailyTotal = staff.reduce((total, person) => {
    console.log(total);
    console.log(person.salary);
    total += person.salary;
    console.log(total);
    // return total;
}, 200);

console.log(dailyTotal);
