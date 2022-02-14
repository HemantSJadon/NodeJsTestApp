// JS callbacks: "I will call back later"
// function myDisplayer(some){
//     console.log(some);
// }

// function myCalculator(num1, num2, myCallback){
//     let sum = num1+ num2;
//     myCallback(sum);
// }

// myCalculator(5,6, myDisplayer);
//Asynchronous JS: "I will finish later."
//functions running in parallel with other functions

function makeUpperCase(value){
    console.log(value.toUpperCase());
}
// makeUpperCase('peter');

function reverseString(value){
    console.log(Array.from(value).reverse().join(''));
}

function handleName(name, cb){
    const fullName = `${name} smith`;
    cb(fullName);
}

handleName('peter', makeUpperCase);
handleName('peter',reverseString);

//callback using unnamed function 

handleName('susan', function(value) {
    console.log(value);
})

//callback using arrow function (lambda expression in C#)
handleName('hemant', v => console.log(v));

//array methods, setTimeout, event listeners


