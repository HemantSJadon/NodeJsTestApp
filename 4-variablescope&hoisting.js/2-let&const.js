//Keywords declared with let, const are block-scoped. 
/*
1. let : 
    a. these can be reassigned but can not be redeclared in the same scope.
    b. if we explicitely declare a variable with 'let' keyword > it is assigned a default value of undefined;
    c. if we try to access a 'let' variable because it is explicitely declared and assigned in the code >
    it throws error (ReferenceError: variable is not defined).
    This variable is still being hoisted but the value remain uninitialised rather than a default value (as was the case with 'var')
2. const:
    a. These can neither be reassigned and redeclared in the same scope.
    b. the variables declared with const keyword has to be assigned at the same time.

*/
//

// let x;

//1. Trying to access a let variable before explicitly declaring and initialising it error:
//ReferenceError : Cannot access variable before initialisation

/* console.log(x);
let x = 10; */


//2. Can we assign a value to a variable with declaring it (i.e. without using let, var and const keyword)

// a = 10;
//the above code throws an error when tryin to assign value to an undeclared variable

//ALWAYS DECLARE YOUR VARIABLE FIRST BEFORE ACCESS IT

//3. variables declared with keyword 'let' are block-scoped

let y = 45;

{
    let y = 78;
    console.log(y);
}
console.log(y);

/* the first y is declared with global scope. 
the second y declared inside the block has the local block-level scope. 
It it wasn't, an error would be throws because let doesn't allow redeclaring the variables in the same scope.
the console.log statement inside the block outputs > 78
the console.log statement outside the block outputs > 45 
 */

//4. Can we access the type of a variable before explicitly declaring it

/* console.log(typeof desire);
let desire = 60; */

// the above code throws an error in console.log statement
//ReferenceError: cannot access variable before initialisation


//5. Varibles declared with const has to be assigned at the time of declaration only

const h;
//The above code throws an Syntax error: Missing Initialiser 







