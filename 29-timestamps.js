//JS nuggets 
//timestamps

console.log(new Date());

// /* unix time
// from Jan 1, 1970
// number of ms passed
// */

// //Retrieval of current timestamp
// //Date.now()
console.log(Date.now());
// //new Date().getTime()
console.log(new Date().getTime());
// //new Date().valueOf()
console.log(new Date().valueOf());

console.log(new Date());

setTimeout(() => {
    console.log(Date.now());
}, 1000);


///Use cases

//Create id's in learning apps
let people = [];
people = [...people,{id: Date.now(), name: 'peter'}];

// setTimeout(() => {
//     people = [...people, {id:Date.now(),name:'john'}];
//     console.log(people);
// }, 1000);

async function AddNewPerson(peopleCollection, newPersonName){
    setTimeout(() => {
        peopleCollection.push({id: Date.now(), name:newPersonName});
        // peopleCollection = [...peopleCollection,{id: Date.now(), name:newPersonName}];
        console.log(peopleCollection);
    }, 1000);
}  

await AddNewPerson(people, 'john');
await AddNewPerson(people, 'mary');
console.log(people);

//create/get dates

console.log(new Date(1655666709641));

const now = Date.now();
const futureDate = new Date(now + 1000 * 60);

console.log(new Date());
console.log(futureDate);

//difference between dates
const firstDate = new Date();
const secondDate = new Date(2022,1,22);
console.log(secondDate);


const firstValue = firstDate.getTime();
const secondValue = secondDate.getTime();

console.log(firstValue);
console.log(secondValue);

const timeDifference = secondValue - firstValue;
console.log(timeDifference);

const minutes = timeDifference/(1000*60);
console.log(minutes);

const hours = timeDifference/(1000*3600);
console.log(hours);



