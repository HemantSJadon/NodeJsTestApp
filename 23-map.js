let john = {name: 'john Doe'},
lily = {name: 'Lily Bush'},
peter = {name: 'Peter Drucker'};

let userRoles = new Map([[peter,'subscriber']]);

console.log(typeof(userRoles));
console.log(userRoles instanceof Map);

//Adding elements to the map
userRoles.set(john, 'admin');
userRoles.set(lily,'editor');

console.log(userRoles);
let johnCopy = {name : 'john Doe'};
console.log(userRoles.has(johnCopy));
console.log(userRoles.has(john))
console.log(userRoles.has(john));
console.log(Array.from(userRoles.keys()));

//get an element from map by key

console.log(userRoles.get(john));
let foo = {name: 'bar'};
console.log(userRoles.get(foo));

//check the existence of an element by key

console.log( userRoles.has(foo));

//number of elements in the map
console.log(userRoles.size);

//Iterate over map elements

for(const role of userRoles.entries()){
    console.log(`${role[0].name}:${role[1]}`);
}
//can also use destructuring as follows

for(let [user,role] of userRoles.entries())
{
    console.log(`${user.name}:${role}`);
}
//forEach() method

userRoles.forEach((role,user) => console.log(`${user.name}:${role}`));

//convert keys/values to array

var keys = [...userRoles.keys()];
console.log(keys);

var values = [...userRoles.values()];
console.log(values);

//delete an element using its key

userRoles.delete(lily);
console.log(userRoles);

//Delete all elements in the map

userRoles.clear();
console.log(userRoles);